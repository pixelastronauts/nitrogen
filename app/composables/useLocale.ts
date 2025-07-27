import type { CountryCode, LanguageCode } from "@@/types/shopify-storefront";

export interface LocaleContext {
  country: CountryCode;
  language: LanguageCode;
}

export interface LocalePreference {
  country: CountryCode;
  language: LanguageCode;
  i18nLocale: string;
}

// Default locale mappings based on Shopify's supported markets
const DEFAULT_LOCALES: Record<string, LocalePreference> = {
  'nl': { country: 'NL', language: 'NL', i18nLocale: 'nl' },
  'en': { country: 'US', language: 'EN', i18nLocale: 'en' },
  'es': { country: 'ES', language: 'ES', i18nLocale: 'es' },
  'fr': { country: 'FR', language: 'FR', i18nLocale: 'fr' },
};

// Country-language combinations (some countries support multiple languages)
const COUNTRY_LANGUAGE_MAP: Partial<Record<CountryCode, LanguageCode[]>> = {
  'NL': ['NL', 'EN'],
  'US': ['EN', 'ES'],
  'CA': ['EN', 'FR'],
  'ES': ['ES', 'EN'],
  'FR': ['FR', 'EN'],
  'DE': ['DE', 'EN'],
  'BE': ['NL', 'FR', 'EN'],
};

export const useLocale = () => {
  const shopStore = useShopStore();
  const { $i18n } = useNuxtApp();
  
  // Get locale from cookie (SSR compatible)
  const localeCookie = useCookie('shopify-locale', { 
    default: () => 'nl'
  });

  // Get current locale preference
  const currentLocale = computed((): LocalePreference => {
    try {
      const cookieValue = localeCookie.value;
      if (typeof cookieValue === 'string') {
        // Handle custom format: "custom:country:language"
        if (cookieValue.startsWith('custom:')) {
          const parts = cookieValue.split(':');
          if (parts.length === 3 && parts[1] && parts[2]) {
            const country = parts[1];
            const language = parts[2];
            return {
              country: country as CountryCode,
              language: language as LanguageCode,
              i18nLocale: getI18nLocale(language.toLowerCase())
            };
          }
        }
        
        // Try to parse as JSON for legacy format
        try {
          const parsed = JSON.parse(cookieValue);
          if (parsed.locale) {
            const preference = DEFAULT_LOCALES[parsed.locale];
            if (preference) return preference;
          }
          if (parsed.country && parsed.language) {
            return {
              country: parsed.country,
              language: parsed.language,
              i18nLocale: getI18nLocale(parsed.language.toLowerCase())
            };
          }
        } catch {
          // Not JSON, treat as simple locale string
        }
        
        // Simple locale string
        const preference = DEFAULT_LOCALES[cookieValue];
        if (preference) return preference;
      }
    } catch {
      // Fall through to default
    }
    
    return { country: 'NL', language: 'NL', i18nLocale: 'nl' };
  });

  // Get Shopify context for queries
  const shopifyContext = computed((): LocaleContext => ({
    country: currentLocale.value.country,
    language: currentLocale.value.language,
  }));

  // Helper functions
  const getCountryForLocale = (locale: string): CountryCode => {
    return DEFAULT_LOCALES[locale]?.country || 'NL';
  };

  const getLanguageForLocale = (locale: string): LanguageCode => {
    return DEFAULT_LOCALES[locale]?.language || 'NL';
  };

  const getI18nLocale = (locale: string): string => {
    return DEFAULT_LOCALES[locale]?.i18nLocale || 'nl';
  };

  // Check if a country supports a specific language
  const isLanguageSupportedInCountry = (country: CountryCode, language: LanguageCode): boolean => {
    const supportedLanguages = COUNTRY_LANGUAGE_MAP[country];
    return supportedLanguages?.includes(language) || false;
  };

  // Set locale preference
  const setLocale = async (locale: string) => {
    if (!DEFAULT_LOCALES[locale]) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }

    const preference = DEFAULT_LOCALES[locale];
    
    // Update cookie
    localeCookie.value = locale;
    
    // Update shop store
    await shopStore.getLocalization(preference.country, preference.language);
    
    // Update i18n
    if ($i18n && $i18n.locale.value !== preference.i18nLocale) {
      await ($i18n as any).setLocale(preference.i18nLocale);
    }
  };

  // Set custom country/language combination
  const setCustomLocale = async (country: CountryCode, language: LanguageCode) => {
    if (!isLanguageSupportedInCountry(country, language)) {
      console.warn(`Language ${language} not supported in country ${country}`);
    }

    // Update shop store
    await shopStore.getLocalization(country, language);
    
    // Update cookie with custom preference (store as custom format)
    localeCookie.value = `custom:${country}:${language}`;
  };

  // Initialize locale on app startup
  const initializeLocale = async () => {
    try {
      const preference = currentLocale.value;
      
      // Always call getLocalization to ensure we have availableCountries and availableLanguages
      // This is needed for the locale modal to work properly
      await shopStore.getLocalization(preference.country, preference.language);
      
      // Update i18n if needed
      if ($i18n && $i18n.locale.value !== preference.i18nLocale) {
        await ($i18n as any).setLocale(preference.i18nLocale);
      }
    } catch (error) {
      console.error('Failed to initialize locale:', error);
    }
  };

  return {
    // State
    currentLocale: readonly(currentLocale),
    shopifyContext: readonly(shopifyContext),
    
    // Getters
    country: computed(() => currentLocale.value.country),
    language: computed(() => currentLocale.value.language),
    i18nLocale: computed(() => currentLocale.value.i18nLocale),
    
    // Actions
    setLocale,
    setCustomLocale,
    initializeLocale,
    
    // Helpers
    getCountryForLocale,
    getLanguageForLocale,
    getI18nLocale,
    isLanguageSupportedInCountry,
    
    // Constants
    DEFAULT_LOCALES: readonly(DEFAULT_LOCALES),
    COUNTRY_LANGUAGE_MAP: readonly(COUNTRY_LANGUAGE_MAP),
  };
};

// Auto-inject locale context into shopify operations
export const useShopifyLocale = () => {
  const { shopifyContext } = useLocale();
  return shopifyContext.value;
}; 