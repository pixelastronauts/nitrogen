import { watch } from 'vue'
import type { CartQuery } from '@@/types/shopify-storefront'

/**
 * Cart Analytics Composable
 * 
 * Mimics Hydrogen's CartAnalytics component behavior:
 * - Watches cart state changes
 * - Compares previous vs current cart
 * - Detects added/removed items and quantity changes
 * - Prevents duplicate events using localStorage
 */
export function useCartAnalytics(cartStore: any) {
  if (!import.meta.client) return

  const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics()
  const shop = getShop()

  if (!shop?.shopId) {
    console.warn('[cart-analytics] Shop not configured, skipping cart tracking')
    return
  }

  let prevCart: CartQuery['cart'] | null = null
  let lastEventId: string | null = null

  // Watch for cart changes
  watch(
    () => cartStore.cart,
    (currentCart: CartQuery['cart'] | null) => {
      if (!currentCart) return

      if (import.meta.dev) {
        console.log('[cart-analytics] Cart changed:', {
          cartId: currentCart.id,
          updatedAt: currentCart.updatedAt,
          prevUpdatedAt: prevCart?.updatedAt,
          totalItems: currentCart.totalQuantity,
        })
      }

      // Check if cart actually changed
      if (currentCart.updatedAt === prevCart?.updatedAt) {
        if (import.meta.dev) {
          console.log('[cart-analytics] Skipping - same updatedAt')
        }
        return
      }

      // Check localStorage to prevent duplicate events on page reload
      let storedCart: { id: string; updatedAt: string } | null = null
      try {
        const stored = localStorage.getItem('cartLastUpdatedAt')
        if (stored) {
          storedCart = JSON.parse(stored)
        }
      } catch (e) {
        storedCart = null
      }

      if (
        currentCart.id === storedCart?.id &&
        currentCart.updatedAt === storedCart?.updatedAt
      ) {
        // Update prevCart for next comparison but don't send event
        prevCart = currentCart
        return
      }

      // Prevent duplicate events
      if (currentCart.updatedAt === lastEventId) {
        prevCart = currentCart
        return
      }
      lastEventId = currentCart.updatedAt

      // Store timestamp to prevent duplicate events on page reload
      try {
        localStorage.setItem(
          'cartLastUpdatedAt',
          JSON.stringify({
            id: currentCart.id,
            updatedAt: currentCart.updatedAt,
          }),
        )
      } catch (e) {
        console.warn('[cart-analytics] Failed to save to localStorage:', e)
      }

      // Flatten cart lines
      const prevLines = prevCart?.lines?.edges?.map(edge => edge.node) || []
      const currentLines = currentCart.lines?.edges?.map(edge => edge.node) || []

      // Detect quantity changes and removed items
      prevLines.forEach((prevLine) => {
        const matchedLine = currentLines.find(line => line.id === prevLine.id)
        
        if (matchedLine) {
          // Quantity increased = added to cart
          if (prevLine.quantity < matchedLine.quantity) {
            if (import.meta.dev) {
              console.log('[cart-analytics] Quantity increased:', {
                product: matchedLine.merchandise.product.title,
                from: prevLine.quantity,
                to: matchedLine.quantity,
              })
            }
            publish(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
              url: window.location.href,
              shop,
              cart: currentCart,
              prevCart,
              currentLine: matchedLine,
            })
          }
          // Quantity decreased = removed from cart
          else if (prevLine.quantity > matchedLine.quantity) {
            publish(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, {
              url: window.location.href,
              shop,
              cart: currentCart,
              prevCart,
              currentLine: matchedLine,
            })
          }
        } else {
          // Line was completely removed
          publish(AnalyticsEvent.PRODUCT_REMOVED_FROM_CART, {
            url: window.location.href,
            shop,
            cart: currentCart,
            prevCart,
            currentLine: prevLine,
          })
        }
      })

      // Detect new items added
      currentLines.forEach((line) => {
        const matchedLines = prevLines.filter(prevLine => line.id === prevLine.id)
        
        if (!matchedLines || matchedLines.length === 0) {
          // This is a new line item
          if (import.meta.dev) {
            console.log('[cart-analytics] New item added to cart:', {
              product: line.merchandise.product.title,
              quantity: line.quantity,
            })
          }
          publish(AnalyticsEvent.PRODUCT_ADD_TO_CART, {
            url: window.location.href,
            shop,
            cart: currentCart,
            prevCart,
            currentLine: line,
          })
        }
      })

      // Update prevCart for next comparison
      prevCart = currentCart
    },
    { deep: true },
  )
}

