import { defineStore } from 'pinia'

// Types
type ConsentState = {
  bannerDismissed: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
  saleOfData: boolean
  lastUpdated: number | null
}

type ConsentSettings = {
  analytics: boolean
  marketing: boolean
  preferences: boolean
  sale_of_data: boolean
}

// Store
export const useConsentStore = defineStore('@nitrogen/consent', {
  state: (): ConsentState => ({
    bannerDismissed: false,
    analytics: false,
    marketing: false,
    preferences: false,
    saleOfData: false,
    lastUpdated: null,
  }),

  getters: {
    hasConsentDecision: (state) => state.lastUpdated !== null,
    shouldShowBanner: (state) => !state.bannerDismissed && state.lastUpdated === null,
    consentSettings: (state): ConsentSettings => ({
      analytics: state.analytics,
      marketing: state.marketing,
      preferences: state.preferences,
      sale_of_data: state.saleOfData,
    }),
  },

  actions: {
    // Initialize from localStorage on startup
    initializeFromStorage() {
      if (typeof window === 'undefined') return

      try {
        const stored = localStorage.getItem('@nitrogen/consent')
        if (stored) {
          const data = JSON.parse(stored)
          this.$patch(data)
          console.log('[Consent Store] Loaded consent from localStorage:', data)
        }
      } catch (error) {
        console.error('[Consent Store] Failed to load from localStorage:', error)
      }
    },

    // Save to localStorage when state changes
    persistToStorage() {
      if (typeof window === 'undefined') return

      try {
        const state = this.$state
        localStorage.setItem('@nitrogen/consent', JSON.stringify(state))
        console.log('[Consent Store] Saved consent to localStorage:', state)
      } catch (error) {
        console.error('[Consent Store] Failed to save to localStorage:', error)
      }
    },

    // Accept all cookies
    acceptAll() {
      this.$patch({
        bannerDismissed: true,
        analytics: true,
        marketing: true,
        preferences: true,
        saleOfData: true,
        lastUpdated: Date.now(),
      })
      this.persistToStorage()
      console.log('[Consent Store] User accepted all cookies')
    },

    // Reject all cookies
    rejectAll() {
      this.$patch({
        bannerDismissed: true,
        analytics: false,
        marketing: false,
        preferences: false,
        saleOfData: false,
        lastUpdated: Date.now(),
      })
      this.persistToStorage()
      console.log('[Consent Store] User rejected all cookies')
    },

    // Save custom preferences
    savePreferences(settings: Partial<ConsentSettings>) {
      this.$patch({
        bannerDismissed: true,
        analytics: settings.analytics ?? this.analytics,
        marketing: settings.marketing ?? this.marketing,
        preferences: settings.preferences ?? this.preferences,
        saleOfData: settings.sale_of_data ?? this.saleOfData,
        lastUpdated: Date.now(),
      })
      this.persistToStorage()
      console.log('[Consent Store] User saved custom preferences:', settings)
    },

    // Update consent from Shopify API
    syncFromShopifyAPI() {
      if (typeof window === 'undefined' || !window.Shopify?.customerPrivacy) return

      try {
        const analyticsAllowed = window.Shopify.customerPrivacy.analyticsProcessingAllowed?.() ?? false
        const marketingAllowed = window.Shopify.customerPrivacy.marketingAllowed?.() ?? false

        // Update state with current consent
        this.$patch({
          analytics: analyticsAllowed,
          marketing: marketingAllowed,
          preferences: analyticsAllowed, // Link to analytics
          saleOfData: marketingAllowed, // Link to marketing
        })
        console.log('[Consent Store] Synced from Shopify API:', {
          analytics: analyticsAllowed,
          marketing: marketingAllowed,
        })
      } catch (error) {
        console.error('[Consent Store] Failed to sync from Shopify API:', error)
      }
    },

    // Reset consent (for testing)
    reset() {
      this.$patch({
        bannerDismissed: false,
        analytics: false,
        marketing: false,
        preferences: false,
        saleOfData: false,
        lastUpdated: null,
      })
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('@nitrogen/consent')
      }
      
      console.log('[Consent Store] Reset consent state')
    },
  },
}) 