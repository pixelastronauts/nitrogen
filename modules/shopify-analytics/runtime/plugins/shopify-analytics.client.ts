import { defineNuxtPlugin } from '#app'
import { useShopifyAnalytics } from '../composables/use-shopify-analytics'
import { useShopifyAnalyticsHandlers } from '../composables/use-shopify-analytics-handlers'
import { AnalyticsEvent } from '../types/events'

export default defineNuxtPlugin((nuxtApp) => {
  const config = nuxtApp.$config.public.shopifyAnalytics
  const { subscribe, register, setShop, getShop } = useShopifyAnalytics()
  const {
    handlePageView,
    handleProductView,
    handleCollectionView,
    handleSearchView,
    handleAddToCart,
  } = useShopifyAnalyticsHandlers()

  // Set shop configuration
  if (config?.enabled && config?.shopId) {
    setShop({
      shopId: config.shopId,
      currency: config.currency || 'USD',
      acceptedLanguage: config.acceptedLanguage || 'en',
      hydrogenSubchannelId: config.hydrogenSubchannelId,
    })

    // Register Shopify analytics system
    const { ready } = register('Internal_Shopify_Analytics')

    // Subscribe to events
    subscribe(AnalyticsEvent.PAGE_VIEWED, handlePageView)
    subscribe(AnalyticsEvent.PRODUCT_VIEWED, handleProductView)
    subscribe(AnalyticsEvent.COLLECTION_VIEWED, handleCollectionView)
    subscribe(AnalyticsEvent.SEARCH_VIEWED, handleSearchView)
    subscribe(AnalyticsEvent.PRODUCT_ADD_TO_CART, handleAddToCart)

    // Mark system as ready
    ready()

    if (import.meta.dev) {
      console.log('[shopify-analytics] Initialized with shop:', getShop())
    }
  }
  else if (import.meta.dev) {
    console.warn('[shopify-analytics] Module not configured or disabled')
  }
})

