import type {
  AnalyticsEventName,
  BasePayload,
  EventPayloads,
  ShopAnalytics,
} from '../types/payloads'
import { AnalyticsEvent } from '../types/events'

type SubscriberCallback = (payload: any) => void

// Module-level storage for subscribers (persists across component lifecycles)
const subscribers = new Map<string, Map<string, SubscriberCallback>>()
const registers: Record<string, boolean> = {}
const waitForReadyQueue = new Map<string, any>()

// Shop configuration
let shopConfig: ShopAnalytics | null = null

/**
 * Composable for Shopify Analytics
 */
export function useShopifyAnalytics() {
  /**
   * Subscribe to an analytics event
   */
  function subscribe<T extends AnalyticsEventName>(
    event: T,
    callback: (payload: EventPayloads[T]) => void,
  ): () => void {
    if (!subscribers.has(event)) {
      subscribers.set(event, new Map())
    }

    const id = Math.random().toString(36).substring(7)
    subscribers.get(event)!.set(id, callback as SubscriberCallback)

    // Return unsubscribe function
    return () => {
      subscribers.get(event)?.delete(id)
    }
  }

  /**
   * Publish an analytics event
   */
  function publish<T extends AnalyticsEventName>(
    event: T,
    payload: EventPayloads[T],
  ): void {
    // If not all systems are ready, queue the event
    if (!areRegistersReady()) {
      waitForReadyQueue.set(event, payload)
      return
    }

    // Notify all subscribers
    const eventSubscribers = subscribers.get(event)
    if (eventSubscribers) {
      eventSubscribers.forEach((callback) => {
        try {
          callback(payload)
        }
        catch (error) {
          console.error(`[shopify-analytics] Error in subscriber for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Register a system that needs to be ready before analytics can fire
   */
  function register(key: string) {
    if (!registers.hasOwnProperty(key)) {
      registers[key] = false
    }

    return {
      ready: () => {
        registers[key] = true

        // When all systems are ready, flush the queue
        if (areRegistersReady() && waitForReadyQueue.size > 0) {
          waitForReadyQueue.forEach((queuePayload, queueEvent) => {
            publish(queueEvent, queuePayload)
          })
          waitForReadyQueue.clear()
        }
      },
    }
  }

  /**
   * Check if all registered systems are ready
   */
  function areRegistersReady(): boolean {
    const keys = Object.keys(registers)
    if (keys.length === 0)
      return true

    return keys.every(key => registers[key] === true)
  }

  /**
   * Set shop configuration
   */
  function setShop(shop: ShopAnalytics | null) {
    shopConfig = shop
  }

  /**
   * Get shop configuration
   */
  function getShop(): ShopAnalytics | null {
    return shopConfig
  }

  /**
   * Check if analytics can track (consent management)
   * For now, returns true - can be extended with privacy API
   */
  function canTrack(): boolean {
    return true
  }

  return {
    subscribe,
    publish,
    register,
    canTrack,
    setShop,
    getShop,
    AnalyticsEvent,
  }
}

