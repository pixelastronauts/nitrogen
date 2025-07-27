import type {
  CountryCode,
  LanguageCode,
  LocalizationQuery,
} from '@@/types/shopify-storefront'

import { defineStore } from 'pinia'

// Interface
interface ShopState {
  locale: LocalizationQuery['localization']
}

// Composables
const shopify = useShopify()

// Store
export const useShopStore = defineStore('@nikkoel/shop', {
  state: (): ShopState => ({
    locale: {
      availableCountries: [],
      availableLanguages: [],
      country: {
        isoCode: 'NL',
        name: 'Netherlands',
                 unitSystem: 'METRIC' as any,
        currency: {
          isoCode: 'EUR',
          name: 'Euro',
          symbol: '€',
        },
        availableLanguages: [{
          isoCode: 'NL',
          name: 'Dutch',
          endonymName: 'Nederlands',
        }],
      },
      language: {
        isoCode: 'NL',
        name: 'Dutch',
        endonymName: 'Nederlands',
      },
    },
  }),

  actions: {
    /**
     * Fetches localization data from Shopify and updates the store.
     * @param newCountryCode - Optional country code input
     * @param newLanguageCode - Optional language code input
     */
    async getLocalization(newCountryCode?: CountryCode, newLanguageCode?: LanguageCode) {
      try {
        // Use provided params or defaults if store is not initialized
        const country = newCountryCode || (this.locale?.country?.isoCode) || 'NL'
        const language = newLanguageCode || (this.locale?.language?.isoCode) || 'NL'
        
        const response = await shopify.localization.get({
          country: country as any,
          language: language as any,
        })

        if (!response.country && !response.language) {
          throw new Error('No localization data found.')
        }

        this.locale.availableCountries = response.availableCountries
        this.locale.availableLanguages = response.availableLanguages
        this.locale.country = response.country
        this.locale.language = response.language

      } catch (error: any) {
        console.error('Cannot get localization data:', error.message)
        throw error
      }
    },
  },

  getters: {
    buyerCountryCode: (state) => state.locale?.country?.isoCode || 'NL',
    buyerCurrencyCode: (state) => state.locale?.country?.currency?.isoCode || 'EUR',
    buyerCurrencySymbol: (state) => state.locale?.country?.currency?.symbol || '€',
    buyerLanguageCode: (state) => state.locale?.language?.isoCode || 'NL',
  },
})
