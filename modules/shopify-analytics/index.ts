import {
  defineNuxtModule,
  addImports,
  addPlugin,
  createResolver,
} from '@nuxt/kit'

// Interface
export interface ModuleOptions {
  enabled: boolean
  shopId: string
  currency: string
  acceptedLanguage: string
  hydrogenSubchannelId?: string
}

// Module
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@nitrogen/shopify-analytics',
    configKey: 'shopifyAnalytics',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },

  defaults: {
    enabled: true,
    shopId: '',
    currency: 'USD',
    acceptedLanguage: 'en',
    hydrogenSubchannelId: '',
  },

  setup(options, nuxt) {
    // Add to public runtime config
    nuxt.options.runtimeConfig.public.shopifyAnalytics = {
      ...options,
      hydrogenSubchannelId: options.hydrogenSubchannelId || '',
    }

    const { resolve } = createResolver(import.meta.url)

    // Add composables
    addImports([
      {
        name: 'useShopifyAnalytics',
        from: resolve('runtime/composables/use-shopify-analytics'),
      },
      {
        name: 'useShopifyCookies',
        from: resolve('runtime/composables/use-shopify-cookies'),
      },
    ])

    // Add client plugin
    addPlugin({
      src: resolve('runtime/plugins/shopify-analytics.client'),
      mode: 'client',
    })

    // Auto-import types
    nuxt.hook('prepare:types', ({ references }) => {
      references.push({
        path: resolve('runtime/types/module.d.ts'),
      })
      references.push({
        path: resolve('runtime/types/events'),
      })
      references.push({
        path: resolve('runtime/types/payloads'),
      })
    })
  },
})

