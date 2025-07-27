interface PricingParams {
  width: number
  length: number
  hasCuttingMargin: boolean
  domain: string
}

interface FormulaResponse {
  id: string
  name: string
  is_active: boolean
  formula_parameters: Record<string, number>
  formula_string: string
  formula_explanation: string
  value_ranges: Array<{
    start: number
    end: number
    value_raw: number
  }>
}

interface VariantParams {
  formula_id: string
  width: number
  length: number
  productId: string
  variantId: string
  hasVinylEdge: boolean
  hasCuttingMargin: boolean
}

export const usePricing = () => {
  const activeFormula = ref<FormulaResponse | null>(null)

  const fetchActiveFormula = async (domain: string): Promise<FormulaResponse | null> => {
    try {
      const response = await fetch(`${domain}/api/price-formulas`)
      if (!response.ok) throw new Error('Failed to fetch formulas')
      
      const formulas: FormulaResponse[] = await response.json()
      const formula = formulas.find(f => f.is_active) || formulas[0] || null
      
      activeFormula.value = formula
      return formula
    } catch (error) {
      console.error('Error fetching price formula:', error)
      return null
    }
  }

  const calculateMatPrice = async (params: PricingParams): Promise<number> => {
    const { width, length, hasCuttingMargin, domain } = params
    
    if (!activeFormula.value) {
      await fetchActiveFormula(domain)
    }
    
    if (!activeFormula.value) {
      return 0
    }

    try {
      // Apply cutting margin if selected
      let adjustedWidth = width
      let adjustedLength = length
      
      if (hasCuttingMargin) {
        adjustedWidth += 3
        adjustedLength += 3
      }

      if (!adjustedWidth || !adjustedLength) {
        return 0
      }

      // Get formula parameters from API response
      const formulaParams = activeFormula.value.formula_parameters
      const formulaString = activeFormula.value.formula_string

      // Create variables for formula evaluation
      const variables = {
        width_value: adjustedWidth,
        length_value: adjustedLength,
        ...formulaParams
      }

      // Evaluate the formula string dynamically
      let price: number
      if (formulaString) {
        // Replace variable names in the formula string with actual values
        let evaluableFormula = formulaString
        
        Object.entries(variables).forEach(([key, value]) => {
          const regex = new RegExp(`\\b${key}\\b`, 'g')
          evaluableFormula = evaluableFormula.replace(regex, String(value))
        })

        try {
          price = Function(`"use strict"; return (${evaluableFormula})`)()
        } catch (evalError) {
          console.error('Error evaluating formula:', evalError)
          // Fallback calculation
          price = calculateFallbackPrice(variables)
        }
      } else {
        // Fallback calculation
        price = calculateFallbackPrice(variables)
      }

      return Math.floor(price) * 100 // Convert to cents
    } catch (error) {
      console.error('Error calculating price:', error)
      return 0
    }
  }

  const calculateFallbackPrice = (variables: Record<string, number>): number => {
    const {
      width_value = 0,
      length_value = 0,
      markup = 0,
      tax = 0,
      base_addition = 0,
      length_divisor = 1
    } = variables

    return width_value * (length_value / length_divisor) * (markup + 1) * (tax + 1) + base_addition
  }

  const createVariant = async (params: VariantParams) => {
    try {
      const response = await fetch(`https://dashboard.studiotapiz.nl/api/make-variant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error('Failed to create variant')
      }

      const result = await response.json()
      if (result.error) {
        throw new Error(result.error)
      }

      return result.variant
    } catch (error) {
      console.error('Error creating variant:', error)
      throw error
    }
  }

  const formatPrice = (cents: number, currency = 'EUR'): string => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency
    }).format(cents / 100)
  }

  return {
    activeFormula: readonly(activeFormula),
    fetchActiveFormula,
    calculateMatPrice,
    createVariant,
    formatPrice
  }
} 