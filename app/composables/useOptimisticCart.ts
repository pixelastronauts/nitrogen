import { ref, computed } from 'vue'

// Optimistic cart line item interface
interface OptimisticCartLine {
  id: string // temporary ID like "optimistic-1673559123-abc"
  merchandiseId: string // temporary merchandise ID for tracking
  quantity: number
  attributes?: Array<{ key: string; value: string }>
  // Display data for optimistic items - store real data for identical rendering
  optimisticData: {
    baseVariant: any // Real Shopify variant data
    product: any // Real Shopify product data
    customPrice: {
      amount: string
      currencyCode: string
    }
  }
  // Track when this was created for cleanup
  createdAt: number
  // Track original base variant ID for replacement
  originalVariantId: string
}

// Global reactive state for optimistic items
const optimisticItems = ref<OptimisticCartLine[]>([])

export const useOptimisticCart = () => {
  // Add an optimistic item to the cart
  const addOptimisticItem = (item: Omit<OptimisticCartLine, 'id' | 'createdAt'>) => {
    const optimisticItem: OptimisticCartLine = {
      ...item,
      id: `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    }
    
    optimisticItems.value.push(optimisticItem)
    console.log('Added optimistic item:', optimisticItem)
    
    return optimisticItem.id
  }

  // Remove an optimistic item (when replaced with real item)
  const removeOptimisticItem = (id: string) => {
    const index = optimisticItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      const removed = optimisticItems.value.splice(index, 1)[0]
      console.log('Removed optimistic item:', removed)
      return removed
    }
    return null
  }

  // Remove optimistic item by original variant ID (when real variant is added)
  const removeOptimisticItemByVariantId = (originalVariantId: string) => {
    const index = optimisticItems.value.findIndex(item => item.originalVariantId === originalVariantId)
    if (index !== -1) {
      const removed = optimisticItems.value.splice(index, 1)[0]
      console.log('Removed optimistic item by variant ID:', removed)
      return removed
    }
    return null
  }

  // Clear all optimistic items (useful for cleanup)
  const clearOptimisticItems = () => {
    const cleared = optimisticItems.value.splice(0)
    console.log('Cleared optimistic items:', cleared)
    return cleared
  }

  // Clean up old optimistic items (older than 5 minutes)
  const cleanupOldItems = () => {
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
    const before = optimisticItems.value.length
    
    optimisticItems.value = optimisticItems.value.filter(item => 
      item.createdAt > fiveMinutesAgo
    )
    
    const after = optimisticItems.value.length
    if (before !== after) {
      console.log(`Cleaned up ${before - after} old optimistic items`)
    }
  }

  // Get all optimistic items
  const getOptimisticItems = computed(() => optimisticItems.value)

  // Get total optimistic items count
  const optimisticItemsCount = computed(() => optimisticItems.value.length)

  // Check if there are any optimistic items
  const hasOptimisticItems = computed(() => optimisticItems.value.length > 0)

  return {
    addOptimisticItem,
    removeOptimisticItem,
    removeOptimisticItemByVariantId,
    clearOptimisticItems,
    cleanupOldItems,
    optimisticItems: getOptimisticItems,
    optimisticItemsCount,
    hasOptimisticItems,
  }
} 