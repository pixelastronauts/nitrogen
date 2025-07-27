<script setup lang="ts">
import type {
  ProductFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";
import { reactive, computed, provide, onMounted, toRef } from "vue";
import { useCurrentVariant } from "@/composables/useCurrentVariant";
import { usePricing } from "@/composables/usePricing";

// Props
const props = defineProps<{
  product: ProductFragment;
  currentVariant?: ProductVariantFragment;
  variants: ProductVariantFragment[];
}>();

// Use global variant management for reliable variant selection
const { currentVariant: globalCurrentVariant } = useCurrentVariant(
  toRef(() => props.product),
);

// Configurator state
const configuratorState = reactive({
  // Dimensions
  length: 0,
  width: 0,

  // Options
  hasVinylEdge: null as boolean | null,
  hasCuttingMargin: null as boolean | null,

  // Validation
  inputsInteracted: {
    length: false,
    width: false,
    vinylEdge: false,
    cuttingMargin: false,
  },

  // Pricing
  basePrice: 0,
  calculatedPrice: 0,
  isCalculatingPrice: false,
});

// Configuration constraints from dataset
const config = reactive({
  minVertical: 28,
  maxVertical: 250,
  minHorizontal: 28,
  maxHorizontal: 250,
  useDefaultValues: true,
  productId: props.product.id,
  domain: "https://dashboard.studiotapiz.nl",
  activeFormula: null as any,
});

// Computed
const baseVariant = computed(() => {
  // Use the global variant selection which handles URL-based variant selection properly
  if (globalCurrentVariant.value?.availableForSale) {
    return globalCurrentVariant.value;
  }

  // Fallback to global variant even if not available
  if (globalCurrentVariant.value) {
    return globalCurrentVariant.value;
  }

  // Final fallback: first available variant
  const firstAvailable = props.variants.find((v) => v.availableForSale);
  if (firstAvailable) {
    return firstAvailable;
  }

  // Last resort: first variant even if not available
  return props.variants[0];
});

const areAllInputsValid = computed(() => {
  return (
    validateLength() &&
    validateWidth() &&
    validateVinylEdge() &&
    validateCuttingMargin()
  );
});

const totalPrice = computed(() => {
  if (!configuratorState.length || !configuratorState.width) return 0;
  return configuratorState.calculatedPrice;
});

// Validation methods
const validateLength = () => {
  if (!configuratorState.inputsInteracted.length) return true;
  const value = configuratorState.length;
  const min = config.minVertical;

  // Flexible max logic
  let max = Math.max(config.maxVertical, config.maxHorizontal);
  if (configuratorState.width > config.maxHorizontal) {
    max = config.maxVertical;
  }

  return (
    value > 0 && value >= min && value <= max && validateBothDimensionsRule()
  );
};

const validateWidth = () => {
  if (!configuratorState.inputsInteracted.width) return true;
  const value = configuratorState.width;
  const min = config.minHorizontal;

  // Flexible max logic
  let max = Math.max(config.maxVertical, config.maxHorizontal);
  if (configuratorState.length > config.maxVertical) {
    max = config.maxHorizontal;
  }

  return (
    value > 0 && value >= min && value <= max && validateBothDimensionsRule()
  );
};

const validateVinylEdge = () => {
  return configuratorState.hasVinylEdge !== null;
};

const validateCuttingMargin = () => {
  return configuratorState.hasCuttingMargin !== null;
};

const validateBothDimensionsRule = () => {
  const lowerMax = Math.min(config.maxVertical, config.maxHorizontal);
  return !(
    configuratorState.length > lowerMax && configuratorState.width > lowerMax
  );
};

// Methods
const updateDimensions = (length: number, width: number) => {
  configuratorState.length = length;
  configuratorState.width = width;
  configuratorState.inputsInteracted.length = true;
  configuratorState.inputsInteracted.width = true;
  calculatePrice();
};

const updateVinylEdge = (hasVinylEdge: boolean) => {
  configuratorState.hasVinylEdge = hasVinylEdge;
  configuratorState.inputsInteracted.vinylEdge = true;
  calculatePrice();
};

const updateCuttingMargin = (hasCuttingMargin: boolean) => {
  configuratorState.hasCuttingMargin = hasCuttingMargin;
  configuratorState.inputsInteracted.cuttingMargin = true;
  calculatePrice();
};

const initializeFormula = async () => {
  try {
    const { fetchActiveFormula } = usePricing();
    const formula = await fetchActiveFormula(config.domain);
    config.activeFormula = formula;
  } catch (error) {
    console.error("Failed to load pricing formula:", error);
  }
};

const calculatePrice = async () => {
  if (!configuratorState.length || !configuratorState.width) {
    configuratorState.calculatedPrice = 0;
    return;
  }

  configuratorState.isCalculatingPrice = true;

  try {
    // Use the pricing composable
    const { calculateMatPrice } = usePricing();
    const price = await calculateMatPrice({
      width: configuratorState.width,
      length: configuratorState.length,
      hasCuttingMargin: configuratorState.hasCuttingMargin || false,
      domain: config.domain,
    });

    configuratorState.calculatedPrice = price;
  } catch (error) {
    console.error("Error calculating price:", error);
    configuratorState.calculatedPrice = 0;
  } finally {
    configuratorState.isCalculatingPrice = false;
  }
};

// Initialize with default values if enabled
onMounted(async () => {
  // Load the pricing formula first
  await initializeFormula();

  if (config.useDefaultValues) {
    configuratorState.length = config.minVertical;
    configuratorState.width = config.minHorizontal;
    configuratorState.hasVinylEdge = false;
    configuratorState.hasCuttingMargin = false;

    // Mark as interacted for validation
    configuratorState.inputsInteracted.length = true;
    configuratorState.inputsInteracted.width = true;
    configuratorState.inputsInteracted.vinylEdge = true;
    configuratorState.inputsInteracted.cuttingMargin = true;

    calculatePrice();
  }
});

// Provide state to child components
provide("configuratorState", configuratorState);
provide("configuratorConfig", config);
provide("baseVariant", baseVariant);
provide("updateDimensions", updateDimensions);
provide("updateVinylEdge", updateVinylEdge);
provide("updateCuttingMargin", updateCuttingMargin);
provide("areAllInputsValid", areAllInputsValid);
</script>

<template>
  <div class="mat-configurator space-y-6">
    <!-- Dimensions Section -->
    <MatDimensions />

    <!-- Cutting Margin Section -->
    <CuttingMargin />

    <!-- Vinyl Edge Section -->
    <VinylEdge />

    <!-- Summary Section -->
    <MatSummary
      v-if="areAllInputsValid"
      :product="product"
      :total-price="totalPrice"
    />

    <!-- Add to Cart Section -->
    <MatAddToCart
      :product="product"
      :current-variant="currentVariant"
      :variants="variants"
      :is-valid="areAllInputsValid"
      :total-price="totalPrice"
    />
  </div>
</template>
