import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    'pinia-plugin-persistedstate/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
    '@nuxt/icon',
    '@nuxt/fonts',
    '@nuxt/eslint',
    '@nuxthub/core',
  ],

  shopify: {
    domain: process.env.NUXT_SHOPIFY_DOMAIN,
    apiVersion: process.env.NUXT_SHOPIFY_API_VERSION,
    adminAccessToken: process.env.NUXT_SHOPIFY_ADMIN_ACCESS_TOKEN,
    storefrontAccessToken: process.env.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
  },

  // Make shopify domain available on client for analytics
  runtimeConfig: {
    public: {
      shopify: {
        domain: process.env.NUXT_SHOPIFY_DOMAIN,
      },
      // Checkout domain for cookie sharing and Live View
      checkoutDomain: process.env.NUXT_PUBLIC_CHECKOUT_DOMAIN || process.env.NUXT_SHOPIFY_DOMAIN,
    },
  },

  klaviyo: {
    apiVersion: process.env.NUXT_KLAVIYO_API_VERSION,
    publicApiKey: process.env.NUXT_KLAVIYO_PUBLIC_API_KEY,
    privateApiKey: process.env.NUXT_KLAVIYO_PRIVATE_API_KEY,
  },

  shopifyAnalytics: {
    enabled: true,
    shopId: process.env.NUXT_SHOPIFY_SHOP_ID || '',
    currency: process.env.NUXT_SHOPIFY_CURRENCY || 'USD',
    acceptedLanguage: process.env.NUXT_SHOPIFY_LANGUAGE || 'en',
    hydrogenSubchannelId: process.env.NUXT_SHOPIFY_SUBCHANNEL_ID,
  },

  site: {
    url: 'https://nitrogen.nuxt.dev',
    name: 'Nitrogen',
  },

  sitemap: {
    sources: [
      '/api/sitemap',
    ],
  },

  robots: {
    disallow: ['/account', '/account/*'],
    sitemap: 'https://nitrogen.nuxt.dev/sitemap.xml',
  },

  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 256,
    },
  },

  fonts: {
    defaults: {
      weights: [400, 500],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  css: ['@/assets/styles/app.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  components: [
    {
      path: '@/components',
      pathPrefix: false,
    },
  ],
})
