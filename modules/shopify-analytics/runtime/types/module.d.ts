import type { ModuleOptions } from '../../index'

declare module '@nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
  }
}

declare module 'nuxt/schema' {
  interface NuxtConfig {
    shopifyAnalytics?: ModuleOptions
  }
  interface PublicRuntimeConfig {
    shopifyAnalytics: ModuleOptions
  }
}

export {}

