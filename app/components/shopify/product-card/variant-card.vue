<script setup lang="ts">
import type {
  ProductFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";

import { getColorOption } from "@/helpers/shopify";
import { flattenConnection } from "@/utils/graphql";

// Props
const props = defineProps<{
  variant: ProductVariantFragment;
  product: ProductFragment;
}>();

// State for image preview on hover
const hoveredVariantId = ref<string | null>(null);

// State for currently selected variant
const selectedVariant = ref<ProductVariantFragment>(props.variant);

// Track if user has actively selected a variant (vs initial state)
const hasUserSelectedVariant = ref(false);

// Get all available variants for this product (filtered)
const availableVariants = computed(() => {
  const variants = flattenConnection(
    props.product.variants,
  ) as ProductVariantFragment[];
  return variants.filter(
    (variant) =>
      !variant.sku?.startsWith("ST_") && !variant.title?.startsWith("ST_"),
  );
});

// Access data nodes - prioritize variant image over product media
const displayImage = computed(() => {
  // If hovering over a variant, show that variant's image
  if (hoveredVariantId.value) {
    const hoveredVariant = availableVariants.value.find(
      (v) => v.id === hoveredVariantId.value,
    );
    if (hoveredVariant?.image) {
      return hoveredVariant.image;
    }
  }

  // Use currently selected variant image if available, otherwise fall back to product featured image
  if (selectedVariant.value.image) {
    return selectedVariant.value.image;
  }
  return props.product.featuredImage;
});

const mediaItems = computed(() => {
  // Only used as fallback if no variant or featured image exists
  return flattenConnection(props.product.media);
});

// Computed
const colorOption = computed(() => getColorOption(props.product.options));
const variantTitle = computed(() => {
  // If variant has a specific title different from product, use it
  if (
    selectedVariant.value.title &&
    selectedVariant.value.title !== "Default Title"
  ) {
    return selectedVariant.value.title;
  }

  // Otherwise, construct title from selected options
  const selectedOptions = selectedVariant.value.selectedOptions;
  if (selectedOptions && selectedOptions.length > 0) {
    const optionValues = selectedOptions
      .filter((option) => option.value !== "Default Title")
      .map((option) => option.value);

    if (optionValues.length > 0) {
      return optionValues.join(" / ");
    }
  }

  return null;
});

const displayTitle = computed(() => {
  if (variantTitle.value) {
    return `${props.product.title} - ${variantTitle.value}`;
  }
  return props.product.title;
});

const variantPrice = computed(() => selectedVariant.value.price);
const variantCompareAtPrice = computed(
  () => selectedVariant.value.compareAtPrice,
);
</script>

<template>
  <NuxtLink
    :to="`/products/${product.handle}?variant=${selectedVariant.id.split('/').pop()}`"
    class="relative flex flex-col gap-4"
  >
    <ProductCardTags :product="product" />

    <!-- Display variant image or fallback to product media -->
    <div v-if="displayImage" class="relative aspect-square overflow-hidden">
      <ShopifyImage
        :image="displayImage"
        :alt="
          displayImage.altText ||
          `${product.title} - ${variantTitle || 'Variant'}`
        "
        :index="0"
      />
    </div>
    <ProductCardMedia v-else :media-items="mediaItems" />

    <!-- Variant Selection Circles -->
    <div
      v-if="availableVariants.length > 1"
      class="flex flex-wrap gap-2 justify-center py-2"
    >
      <button
        v-for="variantOption in availableVariants"
        :key="variantOption.id"
        type="button"
        class="group relative w-8 h-8 rounded-full border-2 border-zinc-300 overflow-hidden transition-all duration-200 hover:border-zinc-800 hover:scale-110 cursor-pointer"
        :class="{
          'border-zinc-800 ring-2 ring-zinc-800 ring-offset-2':
            variantOption.id === selectedVariant.id,
        }"
        @mouseenter="hoveredVariantId = variantOption.id"
        @mouseleave="hoveredVariantId = null"
        @click.prevent.stop="
          if (
            hasUserSelectedVariant &&
            selectedVariant.id === variantOption.id
          ) {
            // If user already selected this variant, navigate to it
            $router.push(
              `/products/${product.handle}?variant=${variantOption.id.split('/').pop()}`,
            );
          } else {
            // Select the variant and mark as user-selected
            selectedVariant = variantOption;
            hasUserSelectedVariant = true;
          }
        "
      >
        <!-- Show variant image if available, otherwise show a color/pattern indicator -->
        <div v-if="variantOption.image" class="w-full h-full">
          <ShopifyImage
            :image="variantOption.image"
            :alt="`${product.title} - ${variantOption.title}`"
            :index="0"
            class="w-full h-full object-cover"
          />
        </div>
        <!-- Fallback for variants without images - show colored circle or first letter -->
        <div
          v-else
          class="w-full h-full bg-zinc-200 flex items-center justify-center text-xs font-medium text-zinc-600"
        >
          {{ variantOption.title?.charAt(0)?.toUpperCase() || "?" }}
        </div>

        <!-- Tooltip showing variant title -->
        <div
          class="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-zinc-800 text-white text-xs px-2 py-1 rounded opacity-0 transition-opacity duration-200 pointer-events-none whitespace-nowrap group-hover:opacity-100"
        >
          {{ variantOption.title }}
        </div>
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <div>
        <h2 class="uppercase">{{ product.title }}</h2>
        <h3 v-if="variantTitle">{{ variantTitle }}</h3>
        <p v-if="selectedVariant.sku" class="text-sm text-zinc-500">
          SKU: {{ selectedVariant.sku }}
        </p>
      </div>
      <PriceDisplay
        :price="variantPrice"
        :compare-at-price="variantCompareAtPrice"
      />
      <div
        v-if="!selectedVariant.availableForSale"
        class="text-sm text-red-600"
      >
        Out of Stock
      </div>
    </div>
  </NuxtLink>
</template>
