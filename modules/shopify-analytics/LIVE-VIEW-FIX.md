# Live View "Active Carts" Fix - Complete Implementation

## Problem
"Active carts" counter in Shopify Live View was showing 0 even though:
- ✅ Analytics events were sending successfully (200 OK)
- ✅ "Visitors right now" was showing correctly
- ✅ Cookies were being set (`_shopify_y`, `_shopify_s`)
- ✅ Analytics payloads included all required fields

## Root Cause
Based on [Hydrogen PR #614](https://github.com/Shopify/hydrogen/pull/614), the issue was:

> **Shopify requires session headers to be forwarded in the Storefront API cart mutation requests themselves.**

We were sending cookies in analytics events, but **NOT** in the actual cart API calls. Shopify needs these headers when the cart is created/modified to associate it with the Live View session.

## Solution Implemented

### Modified: `modules/shopify/runtime/server/shopify-storefront.post.ts`

Added forwarding of three critical headers to Shopify Storefront API:

#### 1. **Session Cookies** (Most Critical)
```typescript
// Forward _shopify_y and _shopify_s cookies
const shopifyY = getCookie(event, '_shopify_y')
const shopifyS = getCookie(event, '_shopify_s')

if (shopifyY || shopifyS) {
  const cookieParts = []
  if (shopifyY) cookieParts.push(`_shopify_y=${shopifyY}`)
  if (shopifyS) cookieParts.push(`_shopify_s=${shopifyS}`)
  headers['Cookie'] = cookieParts.join('; ')
}
```

**Why:** Shopify uses these cookies to identify which Live View session owns the cart.

#### 2. **Buyer IP Address**
```typescript
// Try multiple sources (Cloudflare, standard proxies)
const buyerIp = 
  getHeader(event, 'cf-connecting-ip') ||
  getHeader(event, 'x-real-ip') ||
  getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
  event.node?.req?.socket?.remoteAddress

if (buyerIp) {
  headers['Shopify-Storefront-Buyer-IP'] = buyerIp
}
```

**Why:** Shopify uses IP for session validation and fraud detection. Helps associate the cart with the visitor's session.

#### 3. **Request ID**
```typescript
// Try Cloudflare Ray ID or standard request IDs
const requestId = 
  getHeader(event, 'cf-ray') ||
  getHeader(event, 'x-request-id') ||
  getHeader(event, 'request-id')

if (requestId) {
  headers['Shopify-Storefront-Request-Group-Id'] = requestId
}
```

**Why:** Helps Shopify correlate analytics events with cart mutations for debugging and session tracking.

## How It Works

### Before (Broken)

```
Client → Add to Cart
   ↓
Client → /api/shopify-storefront (with cookies in browser)
   ↓
Server → Shopify API (NO cookies forwarded) ❌
   ↓
Shopify: "Who owns this cart?" 🤷
   ↓
Live View: Active carts = 0 ❌
```

### After (Fixed)

```
Client → Add to Cart
   ↓
Client → /api/shopify-storefront (with cookies in browser)
   ↓
Server → Shopify API (WITH cookies + IP + request ID) ✅
   ↓
Shopify: "This cart belongs to session XYZ" ✅
   ↓
Live View: Active carts = 1 ✅
```

## Verification

### Test Locally (Development)

```bash
# 1. Start dev server
npm run dev

# 2. Open browser DevTools → Network tab

# 3. Add product to cart

# 4. Find the /api/shopify-storefront request

# 5. Check Request Headers should include:
#    - Cookie: _shopify_y=...; _shopify_s=...
#    - (Headers are server-side, won't show in browser)
```

### Test in Production

1. **Deploy to production**
2. **Clear browser cache & cookies**
3. **Visit your site**
4. **Add product to cart**
5. **Wait 2-5 minutes**
6. **Check Shopify Admin → Analytics → Live View**
7. **"Active carts" should show 1** ✅

## What Gets Forwarded

| Header | Source | Purpose |
|--------|--------|---------|
| `Cookie` | `_shopify_y`, `_shopify_s` | Session identification |
| `Shopify-Storefront-Buyer-IP` | `cf-connecting-ip` or similar | Visitor IP for session validation |
| `Shopify-Storefront-Request-Group-Id` | `cf-ray` or similar | Request correlation |

## Cloudflare Workers Specifics

Since you're deploying on Cloudflare Workers (not Oxygen), we check multiple header sources:

- **IP Address:**
  - `cf-connecting-ip` (Cloudflare's real IP)
  - `x-real-ip` (Standard proxy header)
  - `x-forwarded-for` (Fallback)

- **Request ID:**
  - `cf-ray` (Cloudflare's trace ID)
  - `x-request-id` (Standard)
  - `request-id` (Alternative)

## Matches Hydrogen Implementation

Our implementation now matches Hydrogen's `getStorefrontHeaders()` function:

| Hydrogen | Our Implementation | Status |
|----------|-------------------|--------|
| Forward cookies | ✅ | `Cookie` header with `_shopify_y` and `_shopify_s` |
| Forward buyer IP | ✅ | `Shopify-Storefront-Buyer-IP` header |
| Forward request ID | ✅ | `Shopify-Storefront-Request-Group-Id` header |

## Why This Fix Works

From the Hydrogen PR #614:

> "Add-to-cart session in Live View is not working"
> "add the missing headers"

The key insight: **Shopify needs to know WHO is adding items to the cart at the time of the cart mutation**, not just when analytics events fire.

By forwarding the session cookies + IP + request ID to the Storefront API during cart operations, Shopify can:

1. ✅ Associate the cart with the Live View session
2. ✅ Track "Active carts" correctly
3. ✅ Display real-time cart behavior in Live View dashboard
4. ✅ Correlate cart events with analytics events

## Files Modified

1. **`modules/shopify/runtime/server/shopify-storefront.post.ts`**
   - Added cookie forwarding
   - Added buyer IP forwarding
   - Added request ID forwarding

## Additional Context

### Why Server-Side Forwarding?

Cart mutations go through our Nuxt server (`/api/shopify-storefront`), not directly from the browser to Shopify. We need to:

1. Extract cookies from the incoming client request
2. Forward them to Shopify's API
3. Same for IP and request ID

### Why This Wasn't Needed for Analytics?

Analytics events are sent directly from the browser to Shopify's Monorail endpoint, so they already include cookies. But cart mutations go through our server proxy, which strips cookies by default.

## Expected Behavior

After this fix:

| Metric | Before | After |
|--------|--------|-------|
| Visitors right now | ✅ Working | ✅ Working |
| Sessions | ✅ Working | ✅ Working |
| Active carts | ❌ Always 0 | ✅ Shows correctly |

## Troubleshooting

### Still showing 0 active carts?

1. **Clear browser cookies** completely
2. **Wait 5-10 minutes** after adding to cart
3. **Stay on the site** (don't close the tab)
4. **Check cookies are being set** in DevTools → Application → Cookies
5. **Verify you're testing in production**, not localhost

### How to verify cookies are being forwarded?

Add temporary logging in the server handler:

```typescript
console.log('[storefront-api] Headers being sent:', {
  hasCookies: !!headers['Cookie'],
  hasIP: !!headers['Shopify-Storefront-Buyer-IP'],
  hasRequestId: !!headers['Shopify-Storefront-Request-Group-Id'],
})
```

## References

- [Hydrogen PR #614: Fix add-to-cart session event in Live View](https://github.com/Shopify/hydrogen/pull/614)
- [Hydrogen getStorefrontHeaders documentation](https://shopify.dev/docs/api/hydrogen)

---

**Status:** ✅ **Complete** - All headers from Hydrogen PR #614 are now implemented

