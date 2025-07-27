import type { ProductFragment, ProductVariantFragment } from '@@/types/shopify-storefront'
import type { Ref } from 'vue'
import { computed, readonly } from 'vue'
import { formatVariantId } from '@/utils/formatters'

/**
 * Global composable for consistent variant selection across all components
 * Uses URL query parameter as the source of truth
 */
export const useCurrentVariant = (product: Ref<ProductFragment> | ProductFragment) => {
  const route = useRoute()
  
  // Get the product value (handle both ref and direct value)
  const productValue = computed(() => 
    'value' in product ? product.value : product
  )
  
  // Get variant query from URL
  const variantQuery = computed(() => route.query.variant as string | undefined)
  
  // Get all variants from the product (handle both formats)
  const allVariants = computed(() => {
    const prod = productValue.value
    if (!prod) return []
    
    // Handle both formats: direct variants array or edges format
    if ('edges' in prod.variants) {
      return prod.variants.edges.map(edge => edge.node)
    }
    return prod.variants || []
  })
  
  // Find current variant based on URL
  const currentVariant = computed(() => {
    const variants = allVariants.value
    if (!variants.length) return null
    
    // If we have a variant query, find the matching variant
    if (variantQuery.value) {
      const found = variants.find(variant => 
        formatVariantId(variant.id) === variantQuery.value
      )
      if (found) {
        return found
      }
      console.warn('Variant from URL not found:', variantQuery.value)
    }
    
    // Fallback logic:
    // 1. First available variant
    const firstAvailable = variants.find(variant => variant.availableForSale)
    if (firstAvailable) {
      console.log('Using first available variant:', firstAvailable)
      return firstAvailable
    }
    
    // 2. First variant regardless of availability
    console.log('Using first variant (may not be available):', variants[0])
    return variants[0]
  })
  
  // Helper to update the URL with a new variant
  const setCurrentVariant = (variant: ProductVariantFragment | null) => {
    const router = useRouter()
    const query = { ...route.query }
    
    if (variant) {
      query.variant = formatVariantId(variant.id)
      console.log('Setting variant in URL:', variant.id, '→', query.variant)
    } else {
      delete query.variant
      console.log('Removing variant from URL')
    }
    
    router.replace({ query })
  }
  
  // Helper to check if a variant is currently selected
  const isVariantSelected = (variantId: string) => {
    if (!currentVariant.value) return false
    return currentVariant.value.id === variantId
  }
  
  return {
    currentVariant: readonly(currentVariant),
    variantQuery: readonly(variantQuery),
    allVariants: readonly(allVariants),
    setCurrentVariant,
    isVariantSelected
  }
} 