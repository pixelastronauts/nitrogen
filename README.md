<p align="center">
  <a href="https://github.com/rylanharper/nitrogen">
    <img src="./public/logo.svg" width="145" height="145" alt="Nitrogen Logo" />
  </a>
</p>

# Nitrogen

Nitrogen is a Nuxt template inspired by Shopify's [Hydrogen](https://github.com/Shopify/hydrogen) framework for headless commerce. This template is designed to empower Nuxt developers to build fast, scalable, and customizable storefronts that incorporate key features from Hydrogen's starter theme.

> [!IMPORTANT]
> This template now features a minimal Sanity studio [template](https://github.com/rylanharper/nitrogen-sanity-studio), which synchronizes content between a Sanity dataset and your Shopify storefront. This allows teams to further enhance product and collection pages with custom modules or curated links — anything, really.

## ✨ Key Features

- 💪 Strongly typed
- 🛒 Cart functionality
- 🔒 User authentication, with password reset
- 👤 Full customer account functionality
- 🗂️ Collection pages, with pagination
- 🕹️ Collection filter and sort functionality
- 👕 Product pages, with metafields
- 🔍 Search functionality
- 🌐 Shop localization
- 💡 Sitemap, with robots
- 📫 Klaviyo integration
- 📊 **Shopify Analytics integration**
- 🎠 Embla Carousel
- 🎨 Tailwind v4
- 🔮 Codegen

## 📖 Documentation

> [!TIP]
> Read through the docs to learn how to configure your Shopify store to work with Nitrogen!

[Nitrogen documentation](https://nitrogen-docs.netlify.app/)

## 💻 Development

To begin using Nitrogen, you'll need to add the following environment variables:

```ini
# Shopify
NUXT_SHOPIFY_DOMAIN=your-shop-name.myshopify.com
NUXT_SHOPIFY_ADMIN_ACCESS_TOKEN=your_admin_access_token
NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your_storefront_access_token
NUXT_SHOPIFY_API_VERSION=2025-01

# Shopify Analytics (optional)
NUXT_SHOPIFY_CHECKOUT_DOMAIN=your-shop-name.myshopify.com
NUXT_ANALYTICS_COOKIE_DOMAIN=yourdomain.com

# Klaviyo (optional)
NUXT_KLAVIYO_PUBLIC_API_KEY=your_public_api_key
NUXT_KLAVIYO_PRIVATE_API_KEY=your_private_api_key
NUXT_KLAVIYO_API_VERSION=2025-01-15

# Sanity (optional)
NUXT_SANITY_PROJECT_ID=your_project_id
NUXT_SANITY_DATASET=production
NUXT_SANITY_API_VERSION=2025-02-02
NUXT_SANITY_STUDIO_URL=http://your-site-domain.com
NUXT_SANITY_API_READ_TOKEN=your_api_read_token
```

> [!WARNING]
> It is strongly recommended that you use the `2025-01` Storefront API version or higher. If not, you will not have access to new API features found within this template (this will cause breaking changes).

### Local Setup

1. Install dependencies using `pnpm install`
2. Generate your project types using `pnpm codegen`
3. Start the development server using `pnpm dev`

## ⚡ Basic Usage

Nitrogen features custom modules for [Shopify](https://github.com/rylanharper/nitrogen/blob/master/modules/shopify), [Analytics](https://github.com/rylanharper/nitrogen/blob/master/modules/analytics), and [Klaviyo](https://github.com/rylanharper/nitrogen/blob/master/modules/klaviyo), located in the `/modules` folder. The Shopify module, in particular, lets you connect to both the Storefront API and Admin API at the same time, which is ideal for building complex storefronts that may use Shopify to act a database in some way (think wishlist functionality or unique customer account features).

> [!TIP]
> Read the official Nuxt Author Module Guide to learn how to create and manage your own modules!

[Author Module Guide](https://nuxt.com/docs/4.x/guide/going-further/modules)

### API Integration

A minimal [GraphQL client](https://github.com/rylanharper/nitrogen/blob/master/data/shopify/utils/graphql-client.ts) is provided to seamlessly integrate with both the Shopify Storefront and Admin APIs. It uses two [server-side proxies](https://github.com/rylanharper/nitrogen/blob/master/modules/shopify/runtime/server) to handle API authentication and requests, while offering a typed interface for executing GraphQL operations.

### GraphQL Operations

This project includes pre-built GraphQL [operations](https://github.com/rylanharper/nitrogen/tree/master/data/shopify/operations) for common queries and mutations frequently used in headless storefront environments. Feel free to add or remove operations that fit your project needs.

### Composable

To get GraphQL operations, use the `useShopify` composable:

```ts
const shopify = useShopify();
```

Operations can be referenced using this composable with dot notation:

```ts
// Shopify
const shopify = useShopify()

// With dot notation
await shopify.cart.addLines(cart.id, [ ... ])
await shopify.product.get({ handle: 'example-product' })
```

### With `useAsyncData`

Perfect for reactive data fetching in pages or components:

```ts
// Shopify
const shopify = useShopify();

// Fetch Shopify data
const productVars = computed<ProductQueryVariables>(() => ({
  handle: handle.value,
  country: shopStore.buyerCountryCode,
  language: shopStore.buyerLanguageCode,
}));

const { data: productData } = await useAsyncData(
  `product-${handle.value}`,
  () => shopify.product.get(productVars.value),
  { watch: [productVars] }
);

// Response data
const product = computed(() => productData.value);
```

### With `Pinia`

Ideal for working with actions in your Pinia stores:

```ts
// Shopify
const shopify = useShopify()

// Cart store actions
actions: {
  async createCart(input?: CartInput, optionalParams?: CartOptionalInput) {
    try {
      const response = await shopify.cart.create({
        input: input,
        ...optionalParams,
      })

      if (response?.userErrors?.length) {
        throw new Error(response?.userErrors[0]?.message)
      }

      this.cart = response?.cart
    } catch (error: any) {
      console.error('Cannot create cart:', error.message)
      throw error
    }
  },
  // More cart actions...
}
```

## 📊 Analytics

Nitrogen includes a comprehensive analytics system inspired by Hydrogen's analytics architecture. It provides automatic tracking for page views, product views, cart events, and more, with built-in Shopify Analytics integration and customer privacy compliance.

### Analytics Setup

The analytics system is automatically configured when you add the required environment variables. It includes:

- **Automatic Page Tracking**: Tracks page views, product views, collection views, and search events
- **Cart Analytics**: Automatically detects cart changes and tracks add/remove events
- **Privacy Compliance**: Integrates with Shopify's Customer Privacy API for GDPR/CCPA compliance
- **Cookie Management**: Manages Shopify analytics cookies (`shopify_Y` and `shopify_S`)

### Analytics Components

Use these components in your templates to track specific events:

```vue
<!-- Product Page -->
<AnalyticsProductView
  :data="{
    products: [
      {
        id: product.id,
        title: product.title,
        price: selectedVariant?.price?.amount || '0',
        vendor: product.vendor,
        variantId: selectedVariant?.id || '',
        variantTitle: selectedVariant?.title || '',
        quantity: 1,
      },
    ],
  }"
/>

<!-- Collection Page -->
<AnalyticsCollectionView
  :data="{
    collection: {
      id: collection.id,
      handle: collection.handle,
    },
  }"
/>

<!-- Search Page -->
<AnalyticsSearchView
  :data="{
    searchTerm: searchTerm,
    searchResults: searchResults,
  }"
/>

<!-- Cart Page -->
<AnalyticsCartView />

<!-- Custom Events -->
<AnalyticsCustomView
  event="custom_newsletter_signup"
  :data="{ email: userEmail }"
/>
```

### Analytics Composable

Access the analytics system programmatically:

```ts
const analytics = useAnalytics();

// Check if tracking is enabled
const canTrack = analytics.canTrack.value();

// Publish custom events
analytics.publish("custom_event", {
  eventName: "button_clicked",
  buttonName: "subscribe",
});

// Subscribe to events (for custom integrations)
analytics.subscribe("product_viewed", (payload) => {
  // Send to Google Analytics, etc.
  console.log("Product viewed:", payload);
});
```

## 🌱 Contribute

Contributions are always welcome! If you'd like to help improve this project, here's how you can get involved:

- Post an issue: Use the [Issues tab](https://github.com/rylanharper/nitrogen/issues) to report bugs or request new features.
- Start a discussion: Share ideas or ask for help in the [Discussions tab](https://github.com/rylanharper/nitrogen/discussions).
- Submit a pull request: If you'd like to contribute, fork the repository, make your changes, and submit a pull request for review.

I actively monitor this repository and will do my best to respond quickly. Whether it's fixing a small typo or adding a new feature, every contribution helps!
