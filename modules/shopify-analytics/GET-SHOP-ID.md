# How to Find Your Shopify Shop ID & Subchannel ID

## 🆔 Shop ID (REQUIRED)

The Shop ID is your Shopify store's unique identifier in the format: `gid://shopify/Shop/12345678`

### Option 1: Use Our Helper Script (Easiest)

If you already have your Shopify credentials set up:

```bash
# Make sure you have these in your .env file:
# NUXT_SHOPIFY_DOMAIN=your-store.myshopify.com
# NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token

# Run the helper script:
npx tsx modules/shopify-analytics/scripts/get-shop-id.ts
```

This will output your Shop ID ready to copy into your `.env` file.

### Option 2: Shopify Admin Graph

1. **Go to Shopify Admin**
   - URL: `https://admin.shopify.com/store/YOUR_STORE`

2. **Open GraphiQL Admin API**
   - Go to: Settings → Apps and sales channels → Develop apps
   - Create an app if you haven't (or use existing)
   - Click "API credentials" tab
   - Scroll down to "Admin API access token"
   - Copy the access token
   - Open GraphiQL explorer

3. **Run this query:**

   ```graphql
   {
     shop {
       id
       name
       myshopifyDomain
       currencyCode
       primaryDomain {
         url
       }
     }
   }
   ```

4. **Copy the result:**
   ```json
   {
     "data": {
       "shop": {
         "id": "gid://shopify/Shop/12345678",  ← This is your Shop ID
         "name": "Your Store Name",
         "myshopifyDomain": "your-store.myshopify.com",
         "currencyCode": "USD",
         "primaryDomain": {
           "url": "https://yourstore.com"
         }
       }
     }
   }
   ```

### Option 3: Online GraphQL Explorer

1. Go to: https://shopify.dev/docs/apps/tools/graphiql-admin-api
2. Sign in with your Shopify account
3. Select your store
4. Run the same query as above
5. Copy the `id` field

---

## 🔢 Subchannel ID (OPTIONAL)

The Hydrogen Subchannel ID is **optional** and only needed if you want to:

- Track multiple storefronts separately (e.g., mobile app vs web)
- Use Shopify's advanced analytics segmentation
- Distinguish between different Hydrogen storefronts

### What is it?

It's a unique identifier for your Hydrogen/custom storefront within Shopify's analytics system. Think of it as a way to separate analytics from different channels under the same shop.

### Do you need it?

**Most likely NO** - You can leave it empty unless:

- You have multiple custom storefronts
- You're migrating from Hydrogen
- Shopify support asked you to use one

### How to get it (if needed):

1. **Contact Shopify Support** or your Shopify Plus account manager
2. Or it's automatically generated when you:
   - Create a Hydrogen channel in Shopify Admin
   - Set up a custom sales channel

### Format:

If you do get one, it looks like: `01234567-89ab-cdef-0123-456789abcdef` (UUID format)

---

## 🚀 Quick Setup

For most users, you only need the **Shop ID**:

```bash
# .env or .env.local
NUXT_SHOPIFY_SHOP_ID=gid://shopify/Shop/12345678
NUXT_SHOPIFY_CURRENCY=USD
NUXT_SHOPIFY_LANGUAGE=en

# Leave this empty (optional)
NUXT_SHOPIFY_SUBCHANNEL_ID=
```

---

## 🧪 Testing Your Configuration

After adding your Shop ID:

1. **Restart your dev server:**

   ```bash
   # Stop with Ctrl+C, then:
   pnpm dev
   ```

2. **Visit a product page:**

   ```
   http://localhost:3000/products/any-product-handle
   ```

3. **Check the console:**
   You should see:

   ```
   [shopify-analytics] Initialized with shop: { shopId: 'gid://shopify/Shop/...', ... }
   [Product Page] Analytics tracked: { product: '...', variant: '...' }
   ```

4. **Check Network tab:**
   Filter for "monorail" and you should see POST requests to Shopify's analytics endpoint

---

## ❓ Troubleshooting

### "Shop not configured" error

**Problem:** Console shows `[shopify-analytics] Shop not configured`

**Solution:**

1. Make sure `NUXT_SHOPIFY_SHOP_ID` is set in your `.env` file
2. Shop ID must be in format: `gid://shopify/Shop/12345678`
3. Restart your dev server after adding it

### "Module not configured or disabled"

**Problem:** Console shows `[shopify-analytics] Module not configured or disabled`

**Solution:**

1. Check `nuxt.config.ts` has `shopifyAnalytics` configuration
2. Make sure `enabled: true` is set
3. Ensure the module is in the `modules` array

### Can't find Shop ID in Admin

**Solution:**

1. Use the helper script: `npx tsx modules/shopify-analytics/scripts/get-shop-id.ts`
2. Or ask your Shopify admin for access to the GraphQL Admin API
3. If you have Storefront API access, the Shop ID is in the `shop` query

---

## 📚 Additional Resources

- [Shopify Admin API](https://shopify.dev/docs/api/admin-graphql)
- [Shopify Storefront API](https://shopify.dev/docs/api/storefront)
- [Hydrogen Analytics](https://shopify.dev/docs/custom-storefronts/hydrogen/analytics)
