# Shopify Analytics Module - Implementation Summary

## ✅ What Was Built

A complete Nuxt module for Shopify analytics that sends events to Shopify's Monorail API endpoint, inspired by the Hydrogen framework.

### Module Structure

```
modules/shopify-analytics/
├── index.ts                          # Module configuration
├── runtime/
│   ├── composables/
│   │   ├── use-shopify-analytics.ts            # Pub/Sub system
│   │   └── use-shopify-analytics-handlers.ts   # Event handlers
│   ├── plugins/
│   │   └── shopify-analytics.client.ts         # Client plugin
│   ├── types/
│   │   ├── events.ts                           # Event constants
│   │   ├── payloads.ts                         # TypeScript types
│   │   └── module.d.ts                         # Nuxt config types
│   └── utils/
│       └── monorail.ts                         # Monorail API client
├── README.md                         # Full documentation
├── QUICKSTART.md                     # Quick start guide
└── SUMMARY.md                        # This file
```

## 🎯 Key Features

### 1. Pub/Sub Event System

- Module-level subscriber storage (persists across component lifecycles)
- Registration system to queue events until all systems are ready
- Type-safe event publishing and subscribing

### 2. Shopify Monorail Integration

- Sends events to `https://monorail-edge.shopifysvc.com/unstable/produce_batch`
- Uses Shopify's official schema IDs
- Automatic client browser parameter collection (cookies, URL, user agent, etc.)

### 3. Event Types Supported

- ✅ Product view tracking
- ✅ Collection view tracking
- ✅ Search tracking
- ✅ Add to cart tracking
- ✅ Page view tracking
- ✅ Custom event subscriptions

### 4. Architecture Highlights

- Client-only execution (no SSR overhead)
- Auto-imported composable
- Type-safe API
- Follows your existing module patterns

## 📦 Configuration

### nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: ["./modules/shopify-analytics"],

  shopifyAnalytics: {
    enabled: true,
    shopId: process.env.NUXT_SHOPIFY_SHOP_ID || "",
    currency: process.env.NUXT_SHOPIFY_CURRENCY || "USD",
    acceptedLanguage: process.env.NUXT_SHOPIFY_LANGUAGE || "en",
    hydrogenSubchannelId: process.env.NUXT_SHOPIFY_SUBCHANNEL_ID,
  },
});
```

### Environment Variables

```bash
NUXT_SHOPIFY_SHOP_ID=gid://shopify/Shop/12345678
NUXT_SHOPIFY_CURRENCY=USD
NUXT_SHOPIFY_LANGUAGE=en
```

## 🚀 Working Example

### Product Page Implementation

The module is already integrated into `/app/pages/products/[handle].vue`:

```typescript
// Analytics
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

// Track product view when product is loaded
watch(
  product,
  (productData) => {
    if (!productData || !process.client) return;

    const shop = getShop();
    if (!shop?.shopId) return;

    const firstVariant = productVariants.value?.[0];
    if (!firstVariant) return;

    // Track product view
    publish(AnalyticsEvent.PRODUCT_VIEWED, {
      url: window.location.href,
      shop,
      products: [
        {
          id: productData.id,
          variantId: firstVariant.id,
          title: productData.title,
          variantTitle: firstVariant.title,
          vendor: (productData as any).vendor || "Unknown",
          price: firstVariant.price.amount,
          quantity: 1,
          productType: productData.productType,
          sku: firstVariant.sku,
        },
      ],
    });
  },
  { immediate: true },
);
```

## 🔧 Updates Made to Existing Files

### 1. nuxt.config.ts

- Added `./modules/shopify-analytics` to modules array
- Added `shopifyAnalytics` configuration section

### 2. modules/shopify/runtime/resources/graphql/storefront/fragments/product.ts

- Added `vendor` field to product fragment (required for analytics)

### 3. app/pages/products/[handle].vue

- Added analytics tracking on product view
- Tracks when product data loads

## 🎨 How It Works

### Data Flow

```
User views product page
    ↓
Product data loads
    ↓
watch() triggers analytics
    ↓
publish(PRODUCT_VIEWED, payload)
    ↓
Shopify Analytics Handler receives event
    ↓
Transforms to Monorail format
    ↓
Creates schema-wrapped event
    ↓
sendToMonorail() → POST to Shopify API
    ↓
Analytics tracked in Shopify
```

### Monorail Request Example

```json
{
  "events": [
    {
      "schema_id": "custom_storefront_customer_product_view/1.1",
      "payload": {
        "shop_id": "12345678",
        "currency": "USD",
        "locale": "en",
        "session_token": "abc123...",
        "visit_token": "abc123...",
        "unique_token": "xyz789...",
        "url": "https://your-store.com/products/product-name",
        "canonical_url": "https://your-store.com/products/product-name",
        "product_id": "123",
        "product_gid": "gid://shopify/Product/123",
        "variant_id": "456",
        "variant_gid": "gid://shopify/ProductVariant/456",
        "name": "Product Name",
        "brand": "Vendor Name",
        "price": "29.99",
        "category": "Product Type",
        "sku": "SKU123"
      },
      "metadata": {
        "event_created_at_ms": 1234567890
      }
    }
  ],
  "metadata": {
    "event_sent_at_ms": 1234567890
  }
}
```

## 🧪 Testing

1. **Set environment variables** (see `.env.example`)
2. **Restart dev server**: `pnpm dev`
3. **Visit a product page**: `/products/any-handle`
4. **Check console** for log messages
5. **Check Network tab** for monorail requests

## 🔮 Next Steps (Future Enhancements)

### Easy Additions

- [ ] Automatic page view tracking (route middleware)
- [ ] Cart update tracking with diff algorithm
- [ ] Collection page integration
- [ ] Search page integration

### Advanced Features

- [ ] Customer Privacy API integration (GDPR consent)
- [ ] Shopify cookie management (\_shopify_y, \_shopify_s)
- [ ] Performance monitoring (PerfKit integration)
- [ ] Custom event support
- [ ] Third-party integration helpers (GA4, Meta Pixel)

### Current Limitations

- No consent management (always tracks)
- No cart diff algorithm (manual tracking only)
- No automatic page view tracking
- No customer ID tracking
- Vendor field uses type assertion (TypeScript workaround)

## 📝 Notes

- The module follows your existing module pattern (klaviyo, shopify)
- It's less complex than Hydrogen's full implementation
- Focus is on core functionality and Monorail integration
- Easy to extend with more event types
- TypeScript support with auto-imports

## 🎓 Learning Resources

- [Shopify Monorail API](https://shopify.dev/docs/api/web-analytics)
- [Hydrogen Analytics](https://shopify.dev/docs/custom-storefronts/hydrogen/analytics)
- [Customer Privacy API](https://shopify.dev/docs/api/customer-privacy)

---

Built with ❤️ following the Hydrogen framework patterns, adapted for Nuxt 3.
