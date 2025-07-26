import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useConsentStore } from '../../../../app/stores/consent'
import type { 
  AnalyticsContextValue, 
  ShopAnalytics, 
  CartReturn, 
  EventPayloads 
} from '../../../../types/analytics'

declare global {
  interface Window {
    Shopify?: {
      customerPrivacy?: {
        analyticsProcessingAllowed: () => boolean
        marketingAllowed: () => boolean
        saleOfDataAllowed: () => boolean
        setTrackingConsent: (consent: any, callback?: () => void) => void
      }
    }
  }
}

export default defineNuxtPlugin(() => {
  // ===================
  // CORE ANALYTICS SETUP
  // ===================
  
  // Core state management
  const shop = ref<ShopAnalytics | null>(null)
  const cart = ref<CartReturn | null>(null)
  const prevCart = ref<CartReturn | null>(null)
  const customData = ref<Record<string, unknown>>({})
  
  // Initialize canTrack function with consent store integration
  const canTrackFunction = () => {
    try {
      // Try to get analytics consent from store first, then fallback to Shopify API
      const { $pinia } = useNuxtApp()
      if ($pinia) {
        const consentStore = useConsentStore($pinia)
        if (consentStore.hasConsentDecision) {
          return consentStore.analytics
        }
      }
      
      // Fallback to direct Shopify API check
      return window?.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() ?? false
    } catch (e) {
      return false
    }
  }
  
  const canTrackRef = ref<() => boolean>(canTrackFunction)
  
  // Event system
  const subscribers = new Map<string, Map<string, (payload: EventPayloads) => void>>()
  const registers: Record<string, boolean> = reactive({})
  const waitForReadyQueue = new Map<string, EventPayloads>()

  // Check if all services are ready
  const areRegistersReady = computed(() => 
    Object.keys(registers).length > 0 && Object.values(registers).every(Boolean)
  )

  // Subscribe function with type safety
  function subscribe<T extends EventPayloads>(
    event: string, 
    callback: (payload: T) => void
  ): void {
    if (!subscribers.has(event)) {
      subscribers.set(event, new Map())
    }
    const key = callback.toString()
    subscribers.get(event)?.set(key, callback as any)
  }

  // Publish function with queueing
  function publish<T extends EventPayloads>(event: string, payload: T): void {
    if (!areRegistersReady.value) {
      waitForReadyQueue.set(event, payload)
      return
    }
    publishEvent(event, payload)
  }

  function publishEvent<T extends EventPayloads>(event: string, payload: T): void {
    const eventSubscribers = subscribers.get(event) ?? new Map()
    eventSubscribers.forEach((callback, subscriber) => {
      try {
        callback(payload)
      } catch (error) {
        console.error('Analytics publish error', error, subscriber)
      }
    })
  }

  // Service registration
  function register(key: string) {
    if (!registers.hasOwnProperty(key)) {
      registers[key] = false
    }

    return {
      ready: () => {
        registers[key] = true
        
        if (areRegistersReady.value && waitForReadyQueue.size > 0) {
          waitForReadyQueue.forEach((queuePayload, queueEvent) => {
            publishEvent(queueEvent, queuePayload)
          })
          waitForReadyQueue.clear()
        }
      },
    }
  }

  const analyticsContext: AnalyticsContextValue = {
    canTrack: canTrackRef,
    cart,
    prevCart,
    customData,
    publish,
    subscribe,
    register,
    shop,
    customerPrivacy: null, // Will be set up below
    privacyBanner: null,
  }

  // ===================
  // CUSTOMER PRIVACY SETUP
  // ===================
  
  const config = useRuntimeConfig()
  
  // Load Shopify Customer Privacy API
  if (typeof window !== 'undefined') {
    const script = document.createElement('script')
    script.src = 'https://cdn.shopify.com/shopifycloud/consent-tracking-api/v0.1/consent-tracking-api.js'
    script.id = 'customer-privacy-api'
    script.async = true
    
    // Handle script loading errors (ad blockers, etc.)
    script.onerror = () => {
      console.warn('[Analytics] Customer Privacy API blocked (probably by ad blocker). Using fallback for development.')
      setupFallbackPrivacyApi(analyticsContext)
    }
    
    script.onload = () => {
      // Customer Privacy API loaded successfully
    }
    
    document.head.appendChild(script)

    // Monitor for when Shopify.customerPrivacy becomes available
    const checkForPrivacyApi = () => {
      if (window.Shopify?.customerPrivacy) {
        // Override setTrackingConsent to inject shop configuration
        const originalSetTrackingConsent = window.Shopify.customerPrivacy.setTrackingConsent
        
        window.Shopify.customerPrivacy.setTrackingConsent = function(consent, callback) {
          // Inject shop configuration like Hydrogen does
          const rawCheckoutDomain = config.public?.analytics?.checkoutDomain || config.public?.shopify?.domain;
          const rawStorefrontDomain = config.public?.shopify?.domain;
          
          // Don't use localhost domains - they won't work with Shopify
          const isValidDomain = (domain: string) => domain && !domain.includes('localhost') && domain.includes('.');
          
          const shopConfig = {
            checkoutRootDomain: isValidDomain(rawCheckoutDomain) ? rawCheckoutDomain : undefined,
            storefrontAccessToken: config.public?.analytics?.storefrontAccessToken || config.public?.shopify?.storefrontAccessToken,
            storefrontRootDomain: isValidDomain(rawStorefrontDomain) ? rawStorefrontDomain : undefined,
            headlessStorefront: true,
          }
          
          // Setting tracking consent with shop configuration
          
          // Build consent object according to Shopify docs for custom storefronts
          const finalConsent = {
            // Core consent decisions (user choice)
            analytics: consent.analytics,
            marketing: consent.marketing,
            preferences: consent.preferences || consent.analytics, // fallback to analytics if not specified
            sale_of_data: consent.sale_of_data,
            
            // Required for custom storefronts (headless)
            headlessStorefront: true,
            checkoutRootDomain: shopConfig.checkoutRootDomain,
            storefrontRootDomain: shopConfig.storefrontRootDomain,
            storefrontAccessToken: shopConfig.storefrontAccessToken,
          };
          
          // Remove undefined values to avoid API issues
          if (finalConsent.checkoutRootDomain === undefined) delete finalConsent.checkoutRootDomain;
          if (finalConsent.storefrontRootDomain === undefined) delete finalConsent.storefrontRootDomain;
          // Sending consent to Shopify
          
          // Call original method with injected config and update canTrack after
          return originalSetTrackingConsent.call(this, finalConsent, (result?: any) => {
            if (result?.error) {
              console.error('[Analytics] Shopify consent error:', result.error);
            }
            
            // Call the original callback
            if (callback) callback();
            // Update canTrack function after consent change
            setTimeout(() => {
              const newCanTrackFunction = () => {
                try {
                  const { $pinia } = useNuxtApp()
                  if ($pinia) {
                    const consentStore = useConsentStore($pinia)
                    if (consentStore.hasConsentDecision) {
                      return consentStore.analytics
                    }
                  }
                  
                  return window?.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() ?? false
                } catch (e) {
                  return false
                }
              }
              
              analyticsContext.canTrack.value = newCanTrackFunction
            }, 100)
            
            // Call original callback if provided
            if (callback) callback()
          })
        }
        
        analyticsContext.customerPrivacy = window.Shopify.customerPrivacy
        
        // Update the canTrack function
        const newCanTrackFunction = () => {
          try {
            return window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() ?? false
          } catch (e) {
            return false
          }
        }
        
        analyticsContext.canTrack.value = newCanTrackFunction
        return true
      }
      return false
    }

    // Check immediately in case it's already loaded
    if (!checkForPrivacyApi()) {
      // Poll until privacy API is available
      const pollInterval = setInterval(() => {
        if (checkForPrivacyApi()) {
          clearInterval(pollInterval)
        }
      }, 100)
      
      // Set a shorter timeout for fallback (3 seconds instead of 10)
      setTimeout(() => {
        clearInterval(pollInterval)
        if (!window.Shopify?.customerPrivacy) {
          console.warn('[Analytics] Customer Privacy API not loaded after 3s. Using fallback.')
          setupFallbackPrivacyApi(analyticsContext)
        }
      }, 3000)
    }

    // Set up cookies based on consent
    watch(analyticsContext.canTrack, (canTrack) => {
      setupShopifyCookies(canTrack())
    }, { immediate: true })
  }

  // ===================
  // CONSENT STORE INTEGRATION
  // ===================
  
  // Watch consent store changes and update canTrack
  if (typeof window !== 'undefined') {
    try {
      const { $pinia } = useNuxtApp()
      if ($pinia) {
        const consentStore = useConsentStore($pinia)
        
        // Watch for consent changes and update canTrack
        watch(() => consentStore.analytics, (newValue) => {
          const newCanTrackFunction = () => {
            try {
              if (consentStore.hasConsentDecision) {
                return consentStore.analytics
              }
              
              return window?.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() ?? false
            } catch (e) {
              return false
            }
          }
          
          analyticsContext.canTrack.value = newCanTrackFunction
        }, { immediate: true })
      }
    } catch (e) {
      console.warn('[Analytics] Could not setup consent store watcher:', e)
    }
  }

  // ===================
  // CART ANALYTICS SETUP
  // ===================
  
  const cartStore = useCartStore()
  
  // Initialize analytics cart state with current cart
  analyticsContext.cart.value = cartStore.cart
  
  // Watch for cart changes
  watch(
    () => cartStore.cart,
    (newCart, oldCart) => {
      if (!newCart?.updatedAt || newCart.updatedAt === oldCart?.updatedAt) return
      
      // Check localStorage to prevent duplicates on page reload
      let cartLastUpdatedAt: { id: string; updatedAt: string } | null = null
      try {
        cartLastUpdatedAt = JSON.parse(
          localStorage.getItem('cartLastUpdatedAt') || 'null'
        )
      } catch (e) {
        cartLastUpdatedAt = null
      }

      if (
        newCart.id === cartLastUpdatedAt?.id &&
        newCart.updatedAt === cartLastUpdatedAt?.updatedAt
      ) return

      // Update analytics context
      analyticsContext.prevCart.value = analyticsContext.cart.value
      analyticsContext.cart.value = newCart

      const payload = {
        eventTimestamp: Date.now(),
        cart: newCart,
        prevCart: oldCart,
        shop: analyticsContext.shop.value,
        customData: analyticsContext.customData.value,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }

      // Publish cart_updated event
      analyticsContext.publish('cart_updated', payload)

      // Store in localStorage to prevent duplicates
      localStorage.setItem(
        'cartLastUpdatedAt',
        JSON.stringify({
          id: newCart.id,
          updatedAt: newCart.updatedAt,
        })
      )

      // Detect line-level changes
      detectCartLineChanges(oldCart, newCart, payload, analyticsContext)
    },
    { deep: true }
  )

  // Track initial page view
  const router = useRouter()
  router.afterEach((to) => {
    nextTick(() => {
      if (!analyticsContext.shop.value?.shopId) return

      const payload = {
        url: typeof window !== 'undefined' ? window.location.href : to.fullPath,
        shop: analyticsContext.shop.value,
        cart: analyticsContext.cart.value,
        prevCart: analyticsContext.prevCart.value,
        customData: analyticsContext.customData.value,
      }

      analyticsContext.publish('page_viewed', payload)
    })
  })

  // ===================
  // SHOPIFY ANALYTICS SETUP
  // ===================
  
  // Initialize shop analytics data
  ;(async () => {
    try {
      const shopStore = useShopStore()
      const shopData = await $fetch('/api/analytics/shop', {
        query: {
                 country: (shopStore as any).buyerCountryCode || 'US',
       language: (shopStore as any).buyerLanguageCode || 'EN',
        },
      })
      analyticsContext.shop.value = shopData
    } catch (error) {
      console.error('Failed to load shop analytics:', error)
    }

    // Register with analytics system
    const { ready } = analyticsContext.register('Internal_Shopify_Analytics')
    
    // Subscribe to analytics events
    analyticsContext.subscribe('page_viewed', (payload: any) => {
      const eventPayload = prepareBasePageViewPayload(payload)
      if (eventPayload) {
        sendShopifyAnalytics({
          eventName: 'page_view_2',
          payload: eventPayload,
        })
      }
    })

    analyticsContext.subscribe('product_viewed', (payload: any) => {
      const eventPayload = prepareBasePageViewPayload(payload)
      if (eventPayload && payload.products && validateProducts({ type: 'product', products: payload.products })) {
        const formattedProducts = formatProducts(payload.products)
        sendShopifyAnalytics({
          eventName: 'product_view',
          payload: {
            ...eventPayload,
            pageType: 'product',
            resourceId: formattedProducts[0]?.productGid,
            products: formattedProducts,
          },
        })
      }
    })

    analyticsContext.subscribe('collection_viewed', (payload: any) => {
      const eventPayload = prepareBasePageViewPayload(payload)
      if (eventPayload && payload.collection?.id) {
        sendShopifyAnalytics({
          eventName: 'collection_view',
          payload: {
            ...eventPayload,
            pageType: 'collection',
            resourceId: payload.collection.id,
            collectionHandle: payload.collection.handle,
            collectionId: payload.collection.id,
          },
        })
      }
    })

    analyticsContext.subscribe('search_viewed', (payload: any) => {
      const eventPayload = prepareBasePageViewPayload(payload)
      if (eventPayload) {
        sendShopifyAnalytics({
          eventName: 'search_view',
          payload: {
            ...eventPayload,
            pageType: 'search',
            searchString: payload.searchTerm,
          },
        })
      }
    })

    analyticsContext.subscribe('product_added_to_cart', (payload: any) => {
      const eventPayload = prepareBaseCartPayload(payload, payload.cart)
      if (eventPayload && payload.currentLine?.id) {
        sendCartAnalytics({
          matchedLine: payload.currentLine,
          eventPayload,
        })
      }
    })

    // Signal ready
    ready()
  })()

  // Analytics plugin initialized

  // Provide analytics context globally
  return {
    provide: {
      analytics: analyticsContext
    }
  }
})

// ===================
// HELPER FUNCTIONS
// ===================

function setupShopifyCookies(hasConsent: boolean) {
  const config = useRuntimeConfig()
  const domain = (config.public as any).analytics?.cookieDomain || ''
  
  if (hasConsent) {
    setCookie('shopify_Y', generateUUID(), 365 * 24 * 60 * 60 * 1000, domain)
    setCookie('shopify_S', generateUUID(), 30 * 60 * 1000, domain)
  } else {
    setCookie('shopify_Y', '', 0, domain)
    setCookie('shopify_S', '', 0, domain)
  }
}

function setCookie(name: string, value: string, maxAge: number, domain: string) {
  const domainStr = domain ? `; domain=${domain.startsWith('.') ? domain : '.' + domain}` : ''
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/${domainStr}; secure; samesite=lax`
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

function detectCartLineChanges(
  prevCart: any,
  currentCart: any,
  basePayload: any,
  analytics: any
) {
  const previousCartLines = prevCart?.lines?.edges?.map((edge: any) => edge.node) || []
  const currentCartLines = currentCart.lines?.edges?.map((edge: any) => edge.node) || []

  // Check for quantity changes and removals
  previousCartLines.forEach((prevLine: any) => {
    const matchedLines = currentCartLines.filter((line: any) => prevLine.id === line.id)
    
    if (matchedLines.length === 1) {
      const matchedLine = matchedLines[0]
      if (prevLine.quantity < matchedLine.quantity) {
        analytics.publish('product_added_to_cart', {
          ...basePayload,
          prevLine,
          currentLine: matchedLine,
        })
      } else if (prevLine.quantity > matchedLine.quantity) {
        analytics.publish('product_removed_from_cart', {
          ...basePayload,
          prevLine,
          currentLine: matchedLine,
        })
      }
    } else if (matchedLines.length === 0) {
      analytics.publish('product_removed_from_cart', {
        ...basePayload,
        prevLine,
      })
    }
  })

  // Check for new additions
  currentCartLines.forEach((line: any) => {
    const matchedLines = previousCartLines.filter((prevLine: any) => line.id === prevLine.id)
    if (matchedLines.length === 0) {
      analytics.publish('product_added_to_cart', {
        ...basePayload,
        currentLine: line,
      })
    }
  })
}

function prepareBasePageViewPayload(payload: any) {
  if (!payload?.shop?.shopId) {
    console.error('[Analytics] Missing shop.shopId configuration')
    return null
  }

  const { $analytics } = useNuxtApp() as any
  const hasUserConsent = $analytics?.canTrack?.value?.() ?? false
  
  return {
    shopifySalesChannel: 'hydrogen',
    ...payload.shop,
    hasUserConsent,
    ...getClientBrowserParameters(),
    ccpaEnforced: !($analytics?.customerPrivacy?.saleOfDataAllowed?.() ?? true),
    gdprEnforced: !(
      ($analytics?.customerPrivacy?.marketingAllowed?.() ?? true) &&
      ($analytics?.customerPrivacy?.analyticsProcessingAllowed?.() ?? true)
    ),
    analyticsAllowed: $analytics?.customerPrivacy?.analyticsProcessingAllowed?.() ?? false,
    marketingAllowed: $analytics?.customerPrivacy?.marketingAllowed?.() ?? false,
    saleOfDataAllowed: $analytics?.customerPrivacy?.saleOfDataAllowed?.() ?? false,
  }
}

function prepareBaseCartPayload(payload: any, cart: any) {
  if (cart === null) return null

  const pageViewPayload = prepareBasePageViewPayload(payload)
  if (!pageViewPayload) return null

  return {
    ...pageViewPayload,
    cartId: cart.id,
  }
}

function validateProducts({ type, products }: { type: 'cart' | 'product'; products: any[] }) {
  if (!products || products.length === 0) {
    console.error(`[Analytics] Missing products data for ${type}`)
    return false
  }

  for (const product of products) {
    if (!product.id || !product.title || !product.price || !product.vendor || !product.variantId || !product.variantTitle) {
      console.error(`[Analytics] Missing required product fields for ${type}`)
      return false
    }
  }
  
  return true
}

function formatProducts(products: any[]) {
  return products.map((product) => ({
    productGid: product.id,
    variantGid: product.variantId,
    name: product.title,
    variantName: product.variantTitle,
    brand: product.vendor,
    price: product.price,
    quantity: product.quantity || 1,
    category: product.productType || '',
    sku: product.sku || '',
  }))
}

function sendCartAnalytics({ matchedLine, eventPayload }: any) {
  const product = {
    id: matchedLine.merchandise.product.id,
    variantId: matchedLine.merchandise.id,
    title: matchedLine.merchandise.product.title,
    variantTitle: matchedLine.merchandise.title,
    vendor: matchedLine.merchandise.product.vendor,
    price: matchedLine.merchandise.price.amount,
    quantity: matchedLine.quantity,
    productType: matchedLine.merchandise.product.productType,
    sku: matchedLine.merchandise.sku,
  }

  if (validateProducts({ type: 'cart', products: [product] })) {
    sendShopifyAnalytics({
      eventName: 'add_to_cart',
      payload: {
        ...eventPayload,
        products: formatProducts([product]),
      },
    })
  }
}

async function sendShopifyAnalytics(data: any) {
  const { $analytics } = useNuxtApp() as any
  
  if (!$analytics?.canTrack?.value?.()) return

  try {
    await $fetch('/api/analytics/shopify', {
      method: 'POST',
      body: {
        events: [data],
      },
    })
  } catch (error) {
    console.error('Failed to send Shopify analytics:', error)
  }
}

function getClientBrowserParameters() {
  if (typeof window === 'undefined') {
    return {
      uniqueToken: '',
      visitToken: '',
      url: '',
      path: '',
      search: '',
      referrer: '',
      title: '',
      userAgent: '',
      navigationType: '',
      navigationApi: '',
    }
  }

  const shopifyCookies = getShopifyCookies()
  
  return {
    uniqueToken: shopifyCookies.shopify_Y || generateUUID(),
    visitToken: shopifyCookies.shopify_S || generateUUID(),
    url: location.href,
    path: location.pathname,
    search: location.search,
    referrer: document.referrer,
    title: document.title,
    userAgent: navigator.userAgent,
    navigationType: getNavigationType(),
    navigationApi: 'modern',
  }
}

function getShopifyCookies() {
  const cookies: Record<string, string> = {}
  if (typeof document !== 'undefined') {
    document.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = value
      }
    })
  }
  return cookies
}

function setupFallbackPrivacyApi(context: AnalyticsContextValue) {
  // Mock privacy API for development when script is blocked
  if (!window.Shopify) {
    window.Shopify = {}
  }
  
  window.Shopify.customerPrivacy = {
    analyticsProcessingAllowed: () => true, // Allow analytics in dev
    marketingAllowed: () => true,
    saleOfDataAllowed: () => true,
    setTrackingConsent: (consent: any, callback?: () => void) => {
              // Mock consent set
      if (callback) callback()
    }
  }
  
  context.customerPrivacy = window.Shopify.customerPrivacy
  
  // Create a new function that references the mock API
  const fallbackCanTrack = () => {
    try {
      return window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() ?? true
    } catch (e) {
      return true // Always allow in dev fallback
    }
  }
  
  context.canTrack.value = fallbackCanTrack
  
  console.log('[Analytics] Using fallback Customer Privacy API for development - canTrack:', fallbackCanTrack())
}

function getNavigationType() {
  try {
    const navigationEntries = performance?.getEntriesByType?.('navigation')
    if (navigationEntries && navigationEntries[0]) {
      return (navigationEntries[0] as PerformanceNavigationTiming).type
    }
  } catch (err) {
    // Fallback
  }
  return 'navigate'
} 