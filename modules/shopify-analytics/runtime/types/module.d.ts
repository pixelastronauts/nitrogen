import type { ModuleOptions } from '../../index'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
    shopify?: {
      domain?: string
    }
    checkoutDomain?: string
  }
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
    shopify?: {
      domain?: string
    }
    checkoutDomain?: string
  }
}

export {}

