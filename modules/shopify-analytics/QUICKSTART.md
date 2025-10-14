# Shopify Analytics - Quick Start

## 1. Add Environment Variables

Create or update your `.env` file:

```bash
# Your Shopify Shop GID (required)
NUXT_SHOPIFY_SHOP_ID=gid://shopify/Shop/12345678

# Optional - defaults provided
NUXT_SHOPIFY_CURRENCY=USD
NUXT_SHOPIFY_LANGUAGE=en
NUXT_SHOPIFY_SUBCHANNEL_ID=
```

### Finding Your Shop ID

You can find your Shop ID using the Shopify GraphQL Admin API:

1. Go to your Shopify Admin: `https://admin.shopify.com/store/YOUR_STORE/settings/account`
2. Or use GraphQL to query:
   ```graphql
   {
     shop {
       id
       name
     }
   }
   ```
3. The response will include: `"id": "gid://shopify/Shop/12345678"`

## 2. Restart Dev Server

After adding the module and environment variables:

```bash
# Stop your dev server and restart
pnpm dev
```

This ensures Nuxt registers the new module and auto-imports.

## 3. Test on a Product Page

Navigate to any product page in your browser, for example:

- `http://localhost:3000/products/your-product-handle`

Open the browser console and you should see:

```
[shopify-analytics] Initialized with shop: { shopId: 'gid://shopify/Shop/...', ... }
[Product Page] Analytics tracked: { product: '...', variant: '...' }
```

## 4. Verify Monorail Requests

In your browser's Network tab:

1. Filter by "monorail"
2. You should see POST requests to: `https://monorail-edge.shopifysvc.com/unstable/produce_batch`
3. Check the request payload to see the analytics data being sent

## Example Payload

When you view a product, the module sends data like this:

```json
{
  "events": [
    {
      "schema_id": "custom_storefront_customer_product_view/1.1",
      "payload": {
        "shop_id": "12345678",
        "currency": "USD",
        "locale": "en",
        "url": "http://localhost:3000/products/...",
        "product_id": "123",
        "product_gid": "gid://shopify/Product/123",
        "variant_id": "456",
        "variant_gid": "gid://shopify/ProductVariant/456",
        "name": "Product Name",
        "brand": "Vendor Name",
        "price": "29.99"
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

## Troubleshooting

### "Shop not configured" warning

If you see this warning in the console:

```
[shopify-analytics] Shop not configured, skipping product view tracking
```

**Solution:** Make sure you've set `NUXT_SHOPIFY_SHOP_ID` in your `.env` file and restarted your dev server.

### "Cannot find name 'useShopifyAnalytics'"

**Solution:** Restart your dev server. Nuxt needs to regenerate the auto-imports after adding a new module.

### Module not loading

**Solution:** Check that the module path in `nuxt.config.ts` is correct:

```typescript
modules: [
  './modules/shopify-analytics',  // ✅ Correct
  // Not: '@nitrogen/shopify-analytics'
],
```

## Next Steps

Once you've confirmed the product page tracking works:

1. **Add Collection Tracking** - See README.md for collection view examples
2. **Add Search Tracking** - Track search queries
3. **Add Cart Tracking** - Track add to cart events
4. **Add Custom Subscribers** - Connect Google Analytics, Meta Pixel, etc.

See the full README.md for complete documentation.
