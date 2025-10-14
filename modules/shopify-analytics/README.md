# Shopify Analytics Module

A Nuxt module for tracking Shopify analytics events via the Monorail API, inspired by Shopify's Hydrogen framework.

## Features

- 📊 **Page view tracking** - Automatic and manual page view events
- 🛍️ **Product view tracking** - Track product impressions
- 📦 **Collection view tracking** - Track collection page views
- 🔍 **Search tracking** - Track search queries
- 🛒 **Cart tracking** - Track add to cart events
- 🎯 **Pub/Sub system** - Subscribe to analytics events
- 🚀 **Monorail API** - Sends data to Shopify's analytics endpoint

## Configuration

Add the module to your `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  modules: ["./modules/shopify-analytics"],

  shopifyAnalytics: {
    enabled: true,
    shopId: "gid://shopify/Shop/12345678", // Your Shopify shop GID
    currency: "USD",
    acceptedLanguage: "en",
    hydrogenSubchannelId: "your-subchannel-id", // Optional
  },
});
```

### Environment Variables

```bash
NUXT_SHOPIFY_SHOP_ID=gid://shopify/Shop/12345678
NUXT_SHOPIFY_CURRENCY=USD
NUXT_SHOPIFY_LANGUAGE=en
NUXT_SHOPIFY_SUBCHANNEL_ID=your-subchannel-id
```

## Usage

### Basic Usage

The module automatically sets up analytics handlers. You can publish events using the `useShopifyAnalytics` composable:

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent } = useShopifyAnalytics();

// Track page view
publish(AnalyticsEvent.PAGE_VIEWED, {
  url: "/products/my-product",
  shop: {
    shopId: "gid://shopify/Shop/12345678",
    currency: "USD",
    acceptedLanguage: "en",
  },
});
</script>
```

### Product View Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

const product = ref({
  id: "gid://shopify/Product/123",
  title: "My Product",
  vendor: "My Brand",
  // ... other product data
});

const variant = ref({
  id: "gid://shopify/ProductVariant/456",
  title: "Default Title",
  price: { amount: "29.99" },
  sku: "SKU123",
});

// Track when product is viewed
onMounted(() => {
  publish(AnalyticsEvent.PRODUCT_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    products: [
      {
        id: product.value.id,
        variantId: variant.value.id,
        title: product.value.title,
        variantTitle: variant.value.title,
        vendor: product.value.vendor,
        price: variant.value.price.amount,
        quantity: 1,
      },
    ],
  });
});
</script>
```

### Collection View Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

const collection = ref({
  id: "gid://shopify/Collection/789",
  handle: "new-arrivals",
});

onMounted(() => {
  publish(AnalyticsEvent.COLLECTION_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    collection: {
      id: collection.value.id,
      handle: collection.value.handle,
    },
  });
});
</script>
```

### Search Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

function handleSearch(searchTerm: string) {
  publish(AnalyticsEvent.SEARCH_VIEWED, {
    url: window.location.href,
    shop: getShop(),
    searchTerm,
  });
}
</script>
```

### Add to Cart Tracking

```vue
<script setup lang="ts">
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

function trackAddToCart(cart: any, addedLine: any) {
  publish(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
    shop: getShop(),
    cart: cart,
    currentLine: addedLine,
  });
}
</script>
```

### Custom Event Subscribers

You can subscribe to analytics events to add custom tracking (e.g., Google Analytics, Meta Pixel):

```typescript
// plugins/custom-analytics.client.ts
export default defineNuxtPlugin(() => {
  const { subscribe, AnalyticsEvent } = useShopifyAnalytics();

  // Subscribe to product views
  subscribe(AnalyticsEvent.PRODUCT_VIEWED, (payload) => {
    console.log("Product viewed:", payload);

    // Send to Google Analytics
    if (window.gtag) {
      window.gtag("event", "view_item", {
        items: payload.products.map((p) => ({
          item_id: p.id,
          item_name: p.title,
          price: p.price,
        })),
      });
    }
  });

  // Subscribe to add to cart
  subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, (payload) => {
    console.log("Added to cart:", payload);

    // Send to Meta Pixel
    if (window.fbq) {
      window.fbq("track", "AddToCart", {
        content_ids: [payload.currentLine.merchandise.id],
        content_type: "product",
      });
    }
  });
});
```

## API Reference

### Composable: `useShopifyAnalytics()`

#### Methods

- `publish<T>(event: T, payload: EventPayloads[T])` - Publish an analytics event
- `subscribe<T>(event: T, callback: (payload: EventPayloads[T]) => void)` - Subscribe to an event
- `register(key: string)` - Register a system that needs to be ready
- `canTrack()` - Check if tracking is allowed (consent)
- `setShop(shop: ShopAnalytics)` - Set shop configuration
- `getShop()` - Get current shop configuration

#### Properties

- `AnalyticsEvent` - Event name constants

### Event Types

- `AnalyticsEvent.PAGE_VIEWED` - Page view event
- `AnalyticsEvent.PRODUCT_VIEWED` - Product view event
- `AnalyticsEvent.COLLECTION_VIEWED` - Collection view event
- `AnalyticsEvent.CART_VIEWED` - Cart view event
- `AnalyticsEvent.SEARCH_VIEWED` - Search event
- `AnalyticsEvent.PRODUCT_ADD_TO_CART` - Add to cart event
- `AnalyticsEvent.PRODUCT_REMOVED_FROM_CART` - Remove from cart event

## How It Works

1. **Pub/Sub System**: Module-level event bus for subscribing to analytics events
2. **Event Handlers**: Automatic handlers transform events into Shopify's Monorail format
3. **Monorail API**: Events are sent to `https://monorail-edge.shopifysvc.com/unstable/produce_batch`
4. **Client Browser Data**: Automatically collects URL, referrer, user agent, cookies, etc.
5. **Schema Validation**: Events use Shopify's standard schema IDs for compatibility

## Architecture

The module follows Shopify's Hydrogen analytics architecture:

- **Module-level subscribers**: Persist across component lifecycles
- **Registration system**: Queues events until all systems are ready
- **Schema-based events**: Uses Shopify's standard event schemas
- **Client-only**: Analytics only run on the client side

## Development

To enable debug logging in development:

```typescript
if (import.meta.dev) {
  const { subscribe } = useShopifyAnalytics();

  // Log all events
  Object.values(AnalyticsEvent).forEach((event) => {
    subscribe(event, (payload) => {
      console.log(`[Analytics] ${event}:`, payload);
    });
  });
}
```

## License

MIT
