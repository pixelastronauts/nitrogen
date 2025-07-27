<script setup lang="ts">
import type {
  ProductQueryVariables,
  ProductFragment,
  MediaFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";

import { flattenConnection } from "@/utils/graphql";
import { formatVariantId } from "@/utils/formatters";
import { isColorOption } from "@/helpers/shopify";

// Route data
const route = useRoute();
const router = useRouter();
const handle = computed(() => route.params.handle as string);
const variantQuery = computed(() => route.query.variant as string | undefined);

// Shopify
const shopify = useShopify();

// Get locale context for queries
const localeContext = useShopifyLocale();

// Fetch Shopify data with reactive locale context
const productVars = computed<ProductQueryVariables>(() => ({
  handle: handle.value,
  country: localeContext.country,
  language: localeContext.language,
}));

const [productQuery, recommendedQuery] = await Promise.all([
  useAsyncData(
    `product-${handle.value}-${localeContext.country}-${localeContext.language}`,
    () => shopify.product.get(productVars.value),
    {
      watch: [productVars],
    },
  ),
  useAsyncData(
    `recommended-${handle.value}-${localeContext.country}-${localeContext.language}`,
    () => shopify.product.getRecommended(productVars.value),
    {
      watch: [productVars],
    },
  ),
]);

const { data: productData, error: productError } = productQuery;
const { data: recommendedData, error: recommendedError } = recommendedQuery;

// Response data
const product = computed(() => productData.value);
const recommendations = computed(() => recommendedData.value?.slice(0, 4));

// Access data nodes
const allProductMedia = computed(
  () => flattenConnection(product.value?.media) as MediaFragment[],
);
const productVariants = computed(
  () => flattenConnection(product.value?.variants) as ProductVariantFragment[],
);
const matchingColors = computed(
  () =>
    flattenConnection(
      product.value?.matching_colors?.references,
    ) as ProductFragment[],
);

// Get current variant based on URL
const currentVariant = computed(() => {
  if (!variantQuery.value) return productVariants.value[0]; // Default to first variant

  return (
    productVariants.value.find(
      (variant) => formatVariantId(variant.id) === variantQuery.value,
    ) || productVariants.value[0]
  );
});

// Get current variant's color
const currentVariantColor = computed(() => {
  if (!currentVariant.value) return null;

  const colorOption = currentVariant.value.selectedOptions.find((option) =>
    isColorOption(option.name),
  );
  return colorOption?.value || null;
});

// Filter media to only show current variant's images
const productMedia = computed(() => {
  if (!currentVariant.value || !allProductMedia.value.length)
    return allProductMedia.value;

  // Get all color variants (excluding ST_ variants) in their original order
  const colorVariants = productVariants.value.filter((variant) => {
    const colorOption = variant.selectedOptions.find((option) =>
      isColorOption(option.name),
    );
    return colorOption && !colorOption.value.startsWith("ST_");
  });

  if (colorVariants.length <= 1) return allProductMedia.value;

  // Find each variant's position in the media array and create sorted groups
  const variantMediaPositions: Array<{
    variantId: string;
    variantIndex: number;
    mediaIndex: number;
    color: string;
  }> = [];

  colorVariants.forEach((variant, variantIndex) => {
    const variantImageUrl = variant.image?.url;
    const color =
      variant.selectedOptions.find((o) => isColorOption(o.name))?.value ||
      "unknown";

    if (variantImageUrl) {
      // Try exact URL match first
      let mediaIndex = allProductMedia.value.findIndex((media) => {
        if (
          media.mediaContentType === "IMAGE" &&
          "image" in media &&
          media.image?.url
        ) {
          return media.image.url === variantImageUrl;
        }
        return false;
      });

      // If exact match fails, try comparing just the filename part
      if (mediaIndex === -1) {
        const variantFilename = variantImageUrl.split("/").pop()?.split("?")[0];

        mediaIndex = allProductMedia.value.findIndex((media) => {
          if (
            media.mediaContentType === "IMAGE" &&
            "image" in media &&
            media.image?.url
          ) {
            const mediaFilename = media.image.url
              .split("/")
              .pop()
              ?.split("?")[0];
            return mediaFilename === variantFilename;
          }
          return false;
        });
      }

      if (mediaIndex !== -1) {
        variantMediaPositions.push({
          variantId: variant.id,
          variantIndex,
          mediaIndex,
          color,
        });
      }
    }
  });

  // Sort variants by their media position (not their original array position)
  const sortedByMediaPosition = variantMediaPositions.sort(
    (a, b) => a.mediaIndex - b.mediaIndex,
  );

  if (sortedByMediaPosition.length < 2) {
    return allProductMedia.value;
  }

  // Find the current variant in the sorted media positions
  const currentVariantPosition = sortedByMediaPosition.find(
    (pos) => pos.variantId === currentVariant.value?.id,
  );

  if (!currentVariantPosition) {
    return allProductMedia.value;
  }

  // Find the start and end indices for the current variant's media group
  const currentPositionIndex = sortedByMediaPosition.indexOf(
    currentVariantPosition,
  );
  const startIndex = currentVariantPosition.mediaIndex;

  // Find the end index (next variant's start, or end of media array)
  let endIndex = allProductMedia.value.length;
  if (currentPositionIndex + 1 < sortedByMediaPosition.length) {
    const nextVariant = sortedByMediaPosition[currentPositionIndex + 1];
    if (nextVariant) {
      endIndex = nextVariant.mediaIndex;
    }
  }

  return allProductMedia.value.slice(startIndex, endIndex);
});

// Set default variant if none is selected
onMounted(() => {
  nextTick(() => {
    if (!variantQuery.value && productVariants.value.length > 0) {
      const firstVariant = productVariants.value[0];
      if (firstVariant) {
        const query = { ...route.query };
        query.variant = formatVariantId(firstVariant.id);
        router.replace({ query });
      }
    }
  });
});

// SEO
useHead({
  title: product.value?.title,
});
</script>

<template>
  <div
    v-if="productError || recommendedError"
    class="fixed top-(--header-height) left-0 w-full h-fit text-zinc-100 bg-red-500 border-b border-zinc-200"
  >
    <div class="flex items-center justify-center gap-2.5 py-2">
      <Icon name="ph:warning-circle" class="inline-block shrink-0 !size-5" />
      <p class="text-normalize">
        Error loading product: {{ productError || recommendedError }}
      </p>
    </div>
  </div>

  <div v-else-if="!product && !productError" class="wrapper py-20 text-center">
    <p>Loading product...</p>
  </div>

  <div v-else-if="product" class="wrapper mb-20">
    <!-- Product -->
    <section class="grid gap-10 mb-10 lg:grid-cols-2 lg:gap-0 lg:mb-20">
      <div>
        <ProductMediaGallery :product-media="productMedia" />
        <ProductMediaCarousel :product-media="productMedia" />
      </div>
      <div class="px-6">
        <ProductForm
          :product="product"
          :variants="productVariants"
          :matching-colors="matchingColors"
        />
      </div>
    </section>
    <!-- Recommendations -->
    <section class="px-6">
      <ProductRecommendations :products="recommendations" />
    </section>
  </div>
</template>
