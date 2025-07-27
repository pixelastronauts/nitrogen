<script setup lang="ts">
import type { ProductFragment } from "@@/types/shopify-storefront";

import { getColorOption, isColorOption } from "@/helpers/shopify";
import { formatVariantId } from "@/utils/formatters";

// Props
const props = defineProps<{
  product: ProductFragment;
  matchingColors: ProductFragment[];
}>();

// Route data
const route = useRoute();
const handle = computed(() => route.params.handle as string);
const variantQuery = computed(() => route.query.variant as string | undefined);

// Computed
const colorOption = computed(() => getColorOption(props.product.options));
const defaultColorName = computed(
  () => colorOption.value?.optionValues[0]?.name
);

// Get current variant color name based on URL
const currentVariantColorName = computed(() => {
  if (!variantQuery.value) return defaultColorName.value;

  // Find the variant that matches the current URL variant query
  const currentVariant = props.product.variants.edges.find(
    (edge) => formatVariantId(edge.node.id) === variantQuery.value
  );

  if (currentVariant) {
    const colorSelection = currentVariant.node.selectedOptions.find((option) =>
      isColorOption(option.name)
    );
    return colorSelection?.value || defaultColorName.value;
  }

  return defaultColorName.value;
});

// Get all unique color variants from the current product
const currentProductColors = computed(() => {
  if (!colorOption.value) return [];

  const colorVariants = new Map();

  // Get all variants and group by color
  props.product.variants.edges.forEach((edge) => {
    const variant = edge.node;
    const colorSelection = variant.selectedOptions.find((option) =>
      isColorOption(option.name)
    );

    if (
      colorSelection &&
      !colorVariants.has(colorSelection.value) &&
      !colorSelection.value.startsWith("ST_")
    ) {
      colorVariants.set(colorSelection.value, {
        name: colorSelection.value,
        image: variant.image?.url || props.product.featuredImage?.url,
        handle: props.product.handle,
        isAvailable: variant.availableForSale,
        variantId: variant.id,
        formattedVariantId: formatVariantId(variant.id),
      });
    }
  });

  return Array.from(colorVariants.values());
});

// Get variant image for a specific color from matching products
const getVariantImageForColor = (
  product: ProductFragment,
  colorName: string
) => {
  const variant = product.variants.edges.find((edge) =>
    edge.node.selectedOptions.some(
      (option) => isColorOption(option.name) && option.value === colorName
    )
  );
  return variant?.node.image?.url || product.featuredImage?.url;
};

// Get matching product colors (from other products)
const matchingProductColors = computed(() => {
  return props.matchingColors.map((product) => {
    const options = product.options;
    const colorOption = getColorOption(options);
    const colorName = colorOption?.optionValues[0]?.name;

    return {
      name: colorName,
      image: getVariantImageForColor(product, colorName || ""),
      handle: product.handle,
      isAvailable: product.availableForSale,
    };
  });
});

// Combine current product colors and matching colors, keep original order
const sortedColors = computed(() => {
  const allColors = [
    ...currentProductColors.value,
    ...matchingProductColors.value,
  ];
  return allColors;
});

// State for hover interactions
const hoveredColorName = ref<string | null>(null);

// Display color name (current variant color or hovered color)
const displayColorName = computed(() => {
  return hoveredColorName.value || currentVariantColorName.value;
});

// Actions
const updateColorName = (name: string | undefined) => {
  hoveredColorName.value = name || null;
};

const resetColorName = () => {
  hoveredColorName.value = null;
};

// Check if a color is currently selected
const isColorSelected = (color: any) => {
  if (color.handle === handle.value) {
    // For current product variants, check the variant ID
    if (color.formattedVariantId) {
      return variantQuery.value === color.formattedVariantId;
    }
    // If no variant query, this could be the default
    return !variantQuery.value;
  }
  return false;
};

// Get the URL for a color option
const getColorUrl = (color: any) => {
  if (color.formattedVariantId) {
    return `/products/${color.handle}?variant=${color.formattedVariantId}`;
  }
  return `/products/${color.handle}`;
};
</script>

<template>
  <div v-if="colorOption" class="flex flex-col gap-2">
    <span class="uppercase">color: {{ displayColorName }}</span>
    <div class="flex flex-wrap gap-2">
      <NuxtLink
        v-for="color in sortedColors"
        :key="`${color.handle}-${color.name}`"
        :to="getColorUrl(color)"
        class="relative flex size-12 shrink-0 outline-1 rounded-lg overflow-hidden hover:outline-black"
        :class="[
          isColorSelected(color)
            ? 'outline-black border-2 border-white'
            : 'outline-gray-200',
          !color.isAvailable
            ? 'opacity-50 after:h-px after:w-[150%] after:-rotate-[24deg] after:absolute after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 after:bg-zinc-400'
            : '',
        ]"
        :aria-label="`Color Option ${color.name}`"
        @mouseenter="updateColorName(color.name)"
        @mouseleave="resetColorName"
      >
        <img
          v-if="color.image"
          :src="color.image"
          :alt="color.name"
          class="w-full h-full object-cover"
        />
      </NuxtLink>
    </div>
  </div>
</template>
