import type { AnalyticsContextValue } from '../../../../types/analytics'

declare global {
  interface Window {
    $analytics?: AnalyticsContextValue
  }
}

export const useAnalytics = (): AnalyticsContextValue => {
  // First check window (client-side)
  if (typeof window !== 'undefined' && window.$analytics) {
    return window.$analytics
  }
  
  // Try Nuxt app context
  try {
    const nuxtApp = useNuxtApp()
    if (nuxtApp.$analytics) {
      return nuxtApp.$analytics
    }
  } catch (e) {
    // Not in Nuxt context
  }
  
  // Return a mock analytics object for SSR/initial load
  return {
    shop: ref(null),
    cart: ref(null),
    prevCart: ref(null),
    customData: ref({}),
    canTrack: ref(() => false),
    publish: (event: string, payload: any) => {
      if (import.meta.dev) {
        console.log('[Analytics Mock] Event:', event, payload)
      }
    },
    subscribe: (event: string, callback: any) => {
      if (import.meta.dev) {
        console.log('[Analytics Mock] Subscribe:', event)
      }
    },
    register: (name: string) => ({ 
      ready: () => {
        if (import.meta.dev) {
          console.log('[Analytics Mock] Ready:', name)
        }
      }
    }),
    customerPrivacy: null,
    privacyBanner: null,
  }
} 