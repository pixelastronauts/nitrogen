<script setup lang="ts">
import type {
  ProductFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";

import { isSizeOption } from "@/helpers/shopify";
import { formatVariantId } from "@/utils/formatters";

// Props
const props = defineProps<{
  product: ProductFragment;
  variants: ProductVariantFragment[];
  matchingColors: ProductFragment[];
}>();

// Route data
const route = useRoute();
const router = useRouter();
const variantQuery = computed(() => route.query.variant as string | undefined);

// State
const selectedSize = ref("");

// Computed
const currentVariant = computed(() => {
  // First, try to find variant from URL query parameter (for color selection)
  if (variantQuery.value) {
    const urlVariant = props.variants.find(
      (variant) => formatVariantId(variant.id) === variantQuery.value,
    );
    if (urlVariant) return urlVariant;
  }

  // Fall back to size-based selection if no URL variant found
  return props.variants.find((variant) =>
    variant.selectedOptions.every(({ name, value }) =>
      isSizeOption(name) ? value === selectedSize.value : true,
    ),
  );
});

// Check if this is a mat product that needs the configurator
const isMatProduct = computed(() => {
  const tags = props.product.tags || [];

  // Only check for "Made to order" tag
  return tags.some((tag) => {
    const tagLower = tag.toLowerCase().trim();
    return tagLower === "made to order";
  });
});

// Set formatted variant ID to URL
const setVariantId = (variant: ProductVariantFragment | undefined) => {
  const query = { ...route.query };

  if (variant) {
    query.variant = formatVariantId(variant.id);
  } else {
    delete query.variant;
  }

  router.replace({ query });
};

// Set initial variant from URL or default to first
// Defaults to undefined if no match is found
onMounted(() => {
  let initialVariant: ProductVariantFragment | undefined;

  if (props.variants.length === 1) {
    initialVariant = props.variants[0];
  } else if (variantQuery.value) {
    initialVariant = props.variants.find(
      (value) => formatVariantId(value.id) === variantQuery.value,
    );
  }

  if (initialVariant) {
    const sizeOption = initialVariant.selectedOptions.find((option) =>
      isSizeOption(option.name),
    );
    if (sizeOption) selectedSize.value = sizeOption.value;
    setVariantId(initialVariant);
  }
});

// Actions
const setSizeOption = (size: string) => {
  selectedSize.value = size;
};

// Watchers
watch(currentVariant, setVariantId);
</script>

<template>
  <div class="relative lg:sticky lg:top-[calc(var(--header-height)+1px)]">
    <div class="flex flex-col gap-5 w-full lg:md:max-w-lg lg:pt-20 lg:mx-auto">
      <FormHeader :product="product" :current-variant="currentVariant" />
      <FormColorOptions :product="product" :matching-colors="matchingColors" />
      <FormSizeOptions
        :product="product"
        :variants="variants"
        :selected-size="selectedSize"
        @set-size-option="setSizeOption"
      />

      <!-- Mat Configurator for custom mat products -->
      <MatConfigurator
        v-if="isMatProduct"
        :product="product"
        :current-variant="currentVariant"
        :variants="variants"
      />

      <!-- Standard Add to Cart for non-mat products -->
      <FormAddToCart
        v-if="!isMatProduct"
        :current-variant="currentVariant"
        :variants="variants"
      />
      <FormDetails
        :description="product.descriptionHtml"
        :details="product.details?.value"
        :shipping="product.shipping?.value"
      />
    </div>
  </div>
  <KlaviyoBackInStockModal :variant-id="variantQuery" />
</template>
