<script setup lang="ts">
import type { ProductFragment } from "@@/types/shopify-storefront";

// Props
const props = defineProps<{
  product: ProductFragment;
  totalPrice: number;
}>();

// Injected state from parent
const configuratorState = inject("configuratorState") as any;
const { formatPrice } = usePricing();

// Computed
const displayDimensions = computed(() => {
  if (!configuratorState.length || !configuratorState.width) return "";
  return `${configuratorState.length} x ${configuratorState.width} cm`;
});

const adjustedDimensions = computed(() => {
  if (
    !configuratorState.length ||
    !configuratorState.width ||
    !configuratorState.hasCuttingMargin
  )
    return "";

  const adjustedLength = configuratorState.length + 3;
  const adjustedWidth = configuratorState.width + 3;
  return `${adjustedLength} x ${adjustedWidth} cm`;
});

const productStyle = computed(() => {
  // Get product title and any variant selections
  let title = props.product.title || "Entreemat";

  // You could extend this to include variant options if needed
  return title;
});

const vinylEdgeText = computed(() => {
  if (configuratorState.hasVinylEdge === null) return "";
  return configuratorState.hasVinylEdge ? "Met vinylrand" : "Zonder vinylrand";
});

const cuttingMarginText = computed(() => {
  if (configuratorState.hasCuttingMargin === null) return "";
  return configuratorState.hasCuttingMargin
    ? "Met snijmarge"
    : "Zonder snijmarge";
});

const formattedPrice = computed(() => {
  return formatPrice(props.totalPrice);
});

const showAdjustedSize = computed(() => {
  return configuratorState.hasCuttingMargin === true;
});
</script>

<template>
  <div
    class="mat-summary bg-white border border-gray-200 rounded-lg p-6 space-y-4"
  >
    <h3 class="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
      Samenvatting
    </h3>

    <!-- Product Style -->
    <div class="flex justify-between items-start">
      <span class="text-sm font-medium text-gray-700">Stijl:</span>
      <span class="text-sm text-gray-900 text-right">{{ productStyle }}</span>
    </div>

    <!-- Dimensions -->
    <div class="space-y-2">
      <div class="flex justify-between items-start">
        <span class="text-sm font-medium text-gray-700">
          {{ showAdjustedSize ? "Oorspronkelijke afmeting:" : "Afmetingen:" }}
        </span>
        <span class="text-sm text-gray-900">{{ displayDimensions }}</span>
      </div>

      <!-- Adjusted size if cutting margin is selected -->
      <div v-if="showAdjustedSize" class="flex justify-between items-start">
        <span class="text-sm font-medium text-gray-700"
          >Aangepaste afmeting:</span
        >
        <span class="text-sm text-gray-900">{{ adjustedDimensions }}</span>
      </div>
    </div>

    <!-- Vinyl Edge -->
    <div v-if="vinylEdgeText" class="flex justify-between items-start">
      <span class="text-sm font-medium text-gray-700">Vinylrand:</span>
      <span class="text-sm text-gray-900">{{ vinylEdgeText }}</span>
    </div>

    <!-- Cutting Margin -->
    <div v-if="cuttingMarginText" class="flex justify-between items-start">
      <span class="text-sm font-medium text-gray-700">Snijmarge:</span>
      <span class="text-sm text-gray-900">{{ cuttingMarginText }}</span>
    </div>

    <!-- Price -->
    <div class="border-t border-gray-200 pt-4">
      <div class="flex justify-between items-center">
        <span class="text-lg font-medium text-gray-900">Totaalprijs:</span>
        <span class="text-lg font-bold text-gray-900">{{
          formattedPrice
        }}</span>
      </div>
      <p class="text-xs text-gray-500 mt-1">Incl. btw & gratis verzending</p>
    </div>
  </div>
</template>
