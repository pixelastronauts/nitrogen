import {
  defineNuxtModule,
  addImports,
  addServerImports,
  addServerHandler,
  createResolver,
  addComponentsDir,
  addPlugin,
} from '@nuxt/kit'

// Interface
export interface ModuleOptions {
  domain?: string
  checkoutDomain?: string
  storefrontAccessToken?: string
  withPrivacyBanner?: boolean
  cookieDomain?: string
}

// Module
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nitrogen/analytics',
    configKey: 'analytics',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },

  defaults: {
    domain: '',
    checkoutDomain: '',
    storefrontAccessToken: '',
    withPrivacyBanner: false,
    cookieDomain: '',
  },

  setup(options, nuxt) {
    nuxt.options.runtimeConfig.analytics = {
      domain: options.domain || '',
      checkoutDomain: options.checkoutDomain || '',
      storefrontAccessToken: options.storefrontAccessToken || '',
      withPrivacyBanner: options.withPrivacyBanner || false,
      cookieDomain: options.cookieDomain || '',
    }
    
    nuxt.options.runtimeConfig.public.analytics = {
      checkoutDomain: options.checkoutDomain || '',
      storefrontAccessToken: options.storefrontAccessToken || '',
      withPrivacyBanner: options.withPrivacyBanner || false,
      cookieDomain: options.cookieDomain || '',
    }

    const { resolve } = createResolver(import.meta.url)

    // Add composables
    addImports({
      name: 'useAnalytics',
      from: resolve('runtime/composables/use-analytics'),
    })

    addServerImports([{
      name: 'useAnalytics',
      from: resolve('runtime/composables/use-analytics'),
    }])

    // Add server handlers
    addServerHandler({
      method: 'post',
      route: '/api/analytics/shopify',
      handler: resolve('runtime/server/shopify-analytics.post'),
    })

    addServerHandler({
      method: 'get',
      route: '/api/analytics/shop',
      handler: resolve('runtime/server/shop-analytics.get'),
    })

    // Add components
    addComponentsDir({
      path: resolve('runtime/components'),
      prefix: 'Analytics',
      global: true,
    })

    // Add single unified analytics plugin
    addPlugin({
      src: resolve('runtime/plugins/analytics.client'),
      mode: 'client',
    })
  },
}) 