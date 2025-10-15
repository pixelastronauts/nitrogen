import type {
  ShopifyMonorailEvent,
  ShopifyMonorailPayload,
  ShopifyAnalyticsPayload,
} from '../types/payloads'

// Cookie constants
const SHOPIFY_Y = '_shopify_y'
const SHOPIFY_S = '_shopify_s'

/**
 * Schema ID for Shopify Analytics
 * Shopify uses ONE schema for all custom storefront events
 */
const SCHEMA_ID = 'custom_storefront_customer_tracking/1.2'

/**
 * Event names for different event types
 */
const EVENT_NAMES = {
  PAGE_RENDERED: 'page_rendered',
  PRODUCT_PAGE_RENDERED: 'product_page_rendered',
  COLLECTION_PAGE_RENDERED: 'collection_page_rendered',
  SEARCH_SUBMITTED: 'search_submitted',
  PRODUCT_ADDED_TO_CART: 'product_added_to_cart',
}

/**
 * Wraps a payload with schema metadata
 */
export function schemaWrapper(
  schemaId: string,
  payload: ShopifyMonorailPayload,
): ShopifyMonorailEvent {
  return {
    schema_id: schemaId,
    payload,
    metadata: {
      event_created_at_ms: Date.now(),
    },
  }
}

/**
 * Gets Shopify cookies from document
 */
export function getShopifyCookies(cookieString?: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  const cookieStr = cookieString || (typeof document !== 'undefined' ? document.cookie : '')

  cookieStr.split(';').forEach((cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      cookies[key] = value
    }
  })

  return cookies
}

/**
 * Gets client browser parameters for analytics
 */
export function getClientBrowserParameters(): ClientBrowserParameters {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      uniqueToken: '',
      visitToken: '',
      url: '',
      path: '',
      search: '',
      referrer: '',
      title: '',
      userAgent: '',
    }
  }

  const cookies = getShopifyCookies()

  return {
    uniqueToken: cookies[SHOPIFY_Y] || '',
    visitToken: cookies[SHOPIFY_S] || '',
    url: window.location.href,
    path: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    title: document.title,
    userAgent: navigator.userAgent,
  }
}

interface ClientBrowserParameters {
  uniqueToken: string
  visitToken: string
  url: string
  path: string
  search: string
  referrer: string
  title: string
  userAgent: string
}

/**
 * Parses a Shopify GID and returns the ID
 */
export function parseGid(gid: string | undefined): string {
  if (!gid)
    return ''

  try {
    const url = new URL(gid)
    const pathParts = url.pathname.split('/')
    return pathParts[pathParts.length - 1] || ''
  }
  catch {
    return ''
  }
}

/**
 * Generates a UUID v4
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Filters out undefined/null values from an object
 */
function cleanPayload(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {}
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value
    }
  })
  return cleaned
}

/**
 * Creates base payload for all events
 */
function createBasePayload(payload: ShopifyAnalyticsPayload): ShopifyMonorailPayload {
  return {
    event_id: generateUUID(),
    event_time: Date.now(),
    event_source_url: payload.url,
    
    shop_id: parseInt(parseGid(payload.shopId)),
    currency: payload.currency,
    
    source: payload.shopifySalesChannel || 'headless',
    asset_version_id: payload.assetVersionId || '1.0.0',
    hydrogenSubchannelId: payload.hydrogenSubchannelId || '0',
    
    unique_token: payload.uniqueToken || '',
    deprecated_visit_token: payload.visitToken || '',
    
    referrer: payload.referrer || '',
    user_agent: payload.userAgent || '',
    
    is_persistent_cookie: payload.hasUserConsent !== false,
    
    canonical_url: payload.url,
    
    // Required privacy fields
    ccpa_enforced: false,
    gdpr_enforced: false,
    gdpr_enforced_as_string: 'false',
    analytics_allowed: true,
    marketing_allowed: true,
    sale_of_data_allowed: true,
  }
}

/**
 * Creates page view event for monorail
 */
export function createPageViewEvent(
  payload: ShopifyAnalyticsPayload,
): ShopifyMonorailEvent {
  const monorailPayload: ShopifyMonorailPayload = {
    ...createBasePayload(payload),
    event_name: EVENT_NAMES.PAGE_RENDERED,
  }

  return schemaWrapper(SCHEMA_ID, monorailPayload)
}

/**
 * Creates product view event for monorail
 */
export function createProductViewEvent(
  payload: ShopifyAnalyticsPayload,
): ShopifyMonorailEvent {
  const basePayload = createBasePayload(payload)
  
  // Format products as JSON strings (Shopify's format)
  const products = payload.products?.map(p => JSON.stringify(cleanPayload({
    product_gid: p.productGid,
    variant_gid: p.variantGid,
    product_id: parseInt(parseGid(p.productGid)),
    variant_id: parseInt(parseGid(p.variantGid)),
    name: p.name,
    variant: p.variantName || '',
    brand: p.brand,
    category: p.category,
    price: parseFloat(p.price),
    quantity: Number(p.quantity || 1),
    sku: p.sku,
  }))) || []

  const monorailPayload: ShopifyMonorailPayload = {
    ...basePayload,
    event_name: EVENT_NAMES.PRODUCT_PAGE_RENDERED,
    products,
  }

  return schemaWrapper(SCHEMA_ID, monorailPayload)
}

/**
 * Creates collection view event for monorail
 */
export function createCollectionViewEvent(
  payload: ShopifyAnalyticsPayload,
): ShopifyMonorailEvent {
  const monorailPayload: ShopifyMonorailPayload = {
    ...createBasePayload(payload),
    event_name: EVENT_NAMES.COLLECTION_PAGE_RENDERED,
    collection_name: payload.collectionHandle,
    collection_id: payload.collectionId ? parseInt(parseGid(payload.collectionId)) : undefined,
  }

  return schemaWrapper(SCHEMA_ID, cleanPayload(monorailPayload))
}

/**
 * Creates search view event for monorail
 */
export function createSearchViewEvent(
  payload: ShopifyAnalyticsPayload,
): ShopifyMonorailEvent {
  const monorailPayload: ShopifyMonorailPayload = {
    ...createBasePayload(payload),
    event_name: EVENT_NAMES.SEARCH_SUBMITTED,
    search_string: payload.searchString,
  }

  return schemaWrapper(SCHEMA_ID, monorailPayload)
}

/**
 * Creates add to cart event for monorail
 */
export function createAddToCartEvent(
  payload: ShopifyAnalyticsPayload,
): ShopifyMonorailEvent {
  const basePayload = createBasePayload(payload)
  
  // Format products as JSON strings (Shopify's format)
  const products = payload.products?.map(p => JSON.stringify(cleanPayload({
    product_gid: p.productGid,
    variant_gid: p.variantGid,
    product_id: parseInt(parseGid(p.productGid)),
    variant_id: parseInt(parseGid(p.variantGid)),
    name: p.name,
    variant: p.variantName || '',
    brand: p.brand,
    category: p.category,
    price: parseFloat(p.price),
    quantity: Number(p.quantity || 1),
    sku: p.sku,
  }))) || []

  const monorailPayload: ShopifyMonorailPayload = {
    ...basePayload,
    event_name: EVENT_NAMES.PRODUCT_ADDED_TO_CART,
    cart_token: payload.cartId ? parseGid(payload.cartId) : undefined,
    products,
  }

  return schemaWrapper(SCHEMA_ID, cleanPayload(monorailPayload))
}

/**
 * Sends events to Shopify Monorail endpoint
 * IMPORTANT: Always use shop domain to avoid CORS issues
 */
export async function sendToMonorail(
  events: ShopifyMonorailEvent[],
  shopDomain?: string,
): Promise<void> {
  if (!events.length)
    return

  // Always use shop domain endpoint to avoid CORS issues
  // The edge endpoint blocks requests from non-Shopify domains
  if (!shopDomain) {
    console.error('[shopify-analytics] Shop domain required for analytics. Please configure NUXT_SHOPIFY_DOMAIN.')
    return
  }

  const endpoint = `https://${shopDomain}/.well-known/shopify/monorail/unstable/produce_batch`

  const body = {
    events,
    metadata: {
      event_sent_at_ms: Date.now(),
    },
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error('[shopify-analytics] Failed to send analytics', {
        status: response.status,
        response: text,
      })
    }
    else {
      if (import.meta.dev) {
        console.log('[shopify-analytics] Event sent successfully')
      }
    }
  }
  catch (error) {
    console.error('[shopify-analytics] Error sending analytics', error)
  }
}

