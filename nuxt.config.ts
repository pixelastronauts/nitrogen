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
    './modules/analytics',
  ],

  runtimeConfig: {
    // Server-side config
    shopify: {
      adminAccessToken: process.env.NUXT_SHOPIFY_ADMIN_ACCESS_TOKEN,
    },
    
    // Client-side config (exposed to browser)
    public: {
      shopify: {
        domain: process.env.NUXT_SHOPIFY_DOMAIN,
        apiVersion: process.env.NUXT_SHOPIFY_API_VERSION,
        storefrontAccessToken: process.env.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
      },
      analytics: {
        checkoutDomain: process.env.NUXT_SHOPIFY_CHECKOUT_DOMAIN,
        storefrontAccessToken: process.env.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN,
        withPrivacyBanner: false,
        cookieDomain: process.env.NUXT_ANALYTICS_COOKIE_DOMAIN,
      },
    },
  },

  klaviyo: {
    apiVersion: process.env.NUXT_KLAVIYO_API_VERSION,
    publicApiKey: process.env.NUXT_KLAVIYO_PUBLIC_API_KEY,
    privateApiKey: process.env.NUXT_KLAVIYO_PRIVATE_API_KEY,
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
