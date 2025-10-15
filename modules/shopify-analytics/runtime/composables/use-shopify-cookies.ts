/**
 * Shopify Cookies Management
 * Sets _shopify_y and _shopify_s cookies for session tracking
 */

import { onMounted } from 'vue'

const SHOPIFY_Y = '_shopify_y'
const SHOPIFY_S = '_shopify_s'

const longTermLength = 60 * 60 * 24 * 360 // ~1 year expiry
const shortTermLength = 60 * 30 // 30 mins

interface UseShopifyCookiesOptions {
  /**
   * If set to false, Shopify cookies will be removed.
   * If set to true, Shopify unique user token cookie will have cookie expiry of 1 year.
   */
  hasUserConsent?: boolean
  /**
   * The domain scope of the cookie. Defaults to empty string.
   */
  domain?: string
  /**
   * The checkout domain of the shop. Used to calculate common domain.
   */
  checkoutDomain?: string
}

/**
 * Generates a hex timestamp (like Hydrogen)
 */
function hexTime(): string {
  const dateNumber = new Date().getTime() >>> 0

  let perfNumber = 0
  try {
    perfNumber = performance.now() >>> 0
  }
  catch {
    perfNumber = 0
  }

  const output = Math.abs(dateNumber + perfNumber)
    .toString(16)
    .toLowerCase()

  return output.padStart(8, '0')
}

/**
 * Generates a UUID v4 with timestamp prefix (exactly like Hydrogen)
 */
function buildUUID(): string {
  const tokenHash = 'xxxx-4xxx-xxxx-xxxxxxxxxxxx'

  let hash = ''
  try {
    const crypto = window.crypto
    const randomValuesArray = new Uint16Array(31)
    crypto.getRandomValues(randomValuesArray)

    let i = 0
    hash = tokenHash.replace(/[x]/g, (c) => {
      const r = randomValuesArray[i] % 16
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      i++
      return v.toString(16)
    }).toUpperCase()
  }
  catch {
    // Fallback if crypto not available
    hash = tokenHash.replace(/[x]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    }).toUpperCase()
  }

  return `${hexTime()}-${hash}`
}

/**
 * Gets existing Shopify cookies
 */
function getShopifyCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {}

  cookieString.split(';').forEach((cookie) => {
    const [key, value] = cookie.trim().split('=')
    if (key && value) {
      cookies[key] = value
    }
  })

  return {
    [SHOPIFY_Y]: cookies[SHOPIFY_Y] || '',
    [SHOPIFY_S]: cookies[SHOPIFY_S] || '',
  }
}

/**
 * Sets a cookie with specified parameters
 */
function setCookie(
  name: string,
  value: string,
  maxAge: number,
  domain: string,
): void {
  const parts = [
    `${name}=${value}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'SameSite=Lax',
  ]

  if (domain) {
    parts.push(`Domain=${domain}`)
  }

  document.cookie = parts.join('; ')
}

/**
 * Composable to manage Shopify cookies for analytics and checkout
 * This enables Live View tracking and session continuity
 */
export function useShopifyCookies(options: UseShopifyCookiesOptions = {}) {
  const {
    hasUserConsent = true,
    domain = '',
    checkoutDomain = '',
  } = options

  if (typeof document === 'undefined') {
    return
  }

  // Run immediately, not in onMounted
  const cookies = getShopifyCookies(document.cookie)

  function initializeCookies() {

    /**
     * Calculate the domain for cookies
     * If checkoutDomain is provided, find common domain parts
     */
    let currentDomain = domain || window.location.host

    if (checkoutDomain) {
      const checkoutDomainParts = checkoutDomain.split('.').reverse()
      const currentDomainParts = currentDomain.split('.').reverse()
      const sameDomainParts: string[] = []

      checkoutDomainParts.forEach((part, index) => {
        if (part === currentDomainParts[index]) {
          sameDomainParts.push(part)
        }
      })

      currentDomain = sameDomainParts.reverse().join('.')
    }

    // Reset domain if localhost
    if (/^localhost/.test(currentDomain)) {
      currentDomain = ''
    }

    // Shopify checkout requires cookies with leading dot domain
    const domainWithLeadingDot = currentDomain
      ? /^\./.test(currentDomain)
        ? currentDomain
        : `.${currentDomain}`
      : ''

    /**
     * Set or remove cookies based on consent
     */
    if (hasUserConsent) {
      // Set _shopify_y (user token) - 1 year expiry
      setCookie(
        SHOPIFY_Y,
        cookies[SHOPIFY_Y] || buildUUID(),
        longTermLength,
        domainWithLeadingDot,
      )

      // Set _shopify_s (session token) - 30 min expiry
      setCookie(
        SHOPIFY_S,
        cookies[SHOPIFY_S] || buildUUID(),
        shortTermLength,
        domainWithLeadingDot,
      )
    }
    else {
      // Remove cookies if no consent
      setCookie(SHOPIFY_Y, '', 0, domainWithLeadingDot)
      setCookie(SHOPIFY_S, '', 0, domainWithLeadingDot)
    }
  }

  // Initialize cookies immediately
  initializeCookies()

  // Also refresh on mount
  onMounted(() => {
    initializeCookies()
  })
}

