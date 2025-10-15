# Shopify Analytics Troubleshooting

## Live View Not Showing Active Carts

### Issue
You're sending analytics events successfully (200 OK responses), but "Active carts" remains at 0 in Shopify Live View.

### Root Cause
According to [Hydrogen PR #614](https://github.com/Shopify/hydrogen/pull/614), **Shopify Live View behaves differently for preview vs production environments**.

### Checklist

#### 1. ✅ Verify You're in Production Mode

**Your domain must be registered as a production sales channel in Shopify.**

Go to: **Shopify Admin → Settings → Apps and sales channels**

Check if your headless storefront domain is listed and marked as **"production"**.

#### 2. ✅ Verify Checkout Domain Matches

Your checkout domain (`checkout.debakfietsbrigade.nl`) should be:
- Registered in Shopify Admin
- Set as `NUXT_PUBLIC_CHECKOUT_DOMAIN` in your environment variables

#### 3. ✅ Test in Production Only

**Important:** According to Hydrogen team:

> "You won't see the `Visitors right now` counter increase if you are running in preview. This will only increase when running in production."

**Test on your ACTUAL production URL**, not:
- ❌ Localhost
- ❌ Staging URLs
- ❌ Preview deployments
- ❌ Development branches

#### 4. ✅ Verify Analytics Events Include Headers

Check your network payload includes:

```json
{
  "unique_token": "...",  // ✅ Should be populated
  "deprecated_visit_token": "...",  // ✅ Should be populated  
  "cart_token": "...",  // ✅ Should be populated
  "total_value": 327,  // ✅ Should be populated
  "shop_id": 97733247307  // ✅ Should be populated
}
```

#### 5. ✅ Wait Longer

Live View metrics can take:
- **2-5 minutes** for initial display
- **10-15 minutes** during high traffic
- **May not show** if you're the only visitor and you leave the site

## How to Register Your Headless Domain in Shopify

### Option 1: Create a Custom Sales Channel

1. Go to **Shopify Admin → Apps**
2. Click **Develop apps**
3. Create a new app for your headless storefront
4. Configure it with your production domain
5. Make sure it's marked as "production" not "development"

### Option 2: Use Headless Channel

1. Go to **Shopify Admin → Settings → Apps and sales channels**
2. Find your Headless channel
3. Add your production domain: `shop.debakfietsbrigade.nl`
4. Ensure checkout domain is set: `checkout.debakfietsbrigade.nl`

### Option 3: Use Hydrogen Sales Channel

If you created a Hydrogen channel:
1. Go to **Settings → Apps and sales channels**
2. Click on your Hydrogen channel
3. Add production domain
4. Verify it's marked as "production"

## Environment Variables Required

```bash
# Production
NUXT_SHOPIFY_DOMAIN=debakfietsbrigade.myshopify.com
NUXT_PUBLIC_CHECKOUT_DOMAIN=checkout.debakfietsbrigade.nl
NUXT_SHOPIFY_SHOP_ID=gid://shopify/Shop/97733247307
NUXT_SHOPIFY_CURRENCY=EUR
NUXT_SHOPIFY_LANGUAGE=nl
```

## Testing Methodology

### Correct Way to Test Live View

1. **Deploy to production**
2. **Open your production URL** in a **private/incognito window**
3. **Clear all cookies** before testing
4. **Add product to cart**
5. **Stay on the site** for 5 minutes
6. **Check Live View** in Shopify Admin (in a different browser/tab)

### What You Should See

Within 5 minutes:
- ✅ "Visitors right now": 1
- ✅ "Sessions": 1  
- ✅ "Active carts": 1 (after adding to cart)

### If Still Not Working

#### Check Shopify's Sales Channel Settings

Your domain might not be recognized as "production". Contact Shopify Support and ask:

1. "Is my domain `shop.debakfietsbrigade.nl` registered as a production sales channel?"
2. "Why isn't Live View showing active carts for my headless storefront?"
3. "Do I need to configure anything else for Live View to work with headless?"

#### Verify Using Shopify's Analytics Debug Mode

Enable debug mode in your analytics:

```typescript
// In your analytics plugin
if (import.meta.dev || new URLSearchParams(window.location.search).has('debug_analytics')) {
  window._shopify_analytics_debug = true;
}
```

Then visit: `https://shop.debakfietsbrigade.nl?debug_analytics=true`

Check browser console for Shopify's internal analytics logs.

## Known Limitations

### Preview/Development Mode
- ❌ "Visitors right now" won't increase
- ⚠️ "Active carts" may not appear
- ⚠️ Events are received but not fully processed for Live View

### Production Mode
- ✅ All metrics work correctly
- ✅ Real-time tracking functional
- ✅ Active carts appear within 5 minutes

### Time Delays
- First event: 2-5 minutes to appear
- Subsequent events: 30-60 seconds
- Cart becoming "inactive": 30 minutes after last activity

## Reference

- [Hydrogen PR #614: Fix add-to-cart session event in Live View](https://github.com/Shopify/hydrogen/pull/614)
- [Shopify Analytics Updates](https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/analytics-updates)

---

**TL;DR:** Shopify Live View requires your domain to be registered as a **production sales channel**. Preview/development environments won't show full Live View data.

