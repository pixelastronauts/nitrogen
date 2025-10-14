<script setup lang="ts">
import type {
  ProductQueryVariables,
  ProductFragment,
  MediaFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";

// Route data
const route = useRoute();
const handle = computed(() => route.params.handle as string);

// Stores
const shopStore = useShopStore();

// Shopify
const shopify = useShopify();

// Analytics
const { publish, AnalyticsEvent, getShop } = useShopifyAnalytics();

// Fetch Shopify data
const productVars = computed<ProductQueryVariables>(() => ({
  handle: handle.value,
  country: shopStore.buyerCountryCode,
  language: shopStore.buyerLanguageCode,
}));

const [productQuery, recommendedQuery] = await Promise.all([
  useAsyncData(
    `product-${handle.value}`,
    () => shopify.product.get(productVars.value),
    { watch: [productVars] },
  ),
  useAsyncData(
    `recommended-${handle.value}`,
    () => shopify.product.getRecommended(productVars.value),
    { watch: [productVars] },
  ),
]);

const { data: productData, error: productError } = productQuery;
const { data: recommendedData, error: recommendedError } = recommendedQuery;

// Response data
const product = computed(() => productData.value);
const recommendations = computed(() => recommendedData.value?.slice(0, 4));

// Access data nodes
const productMedia = computed(
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

// SEO
useHead({
  title: product.value?.title,
});

// Analytics - Track product view when product is loaded
watch(
  product,
  (productData) => {
    if (!productData || !process.client) return;

    const shop = getShop();
    if (!shop?.shopId) {
      console.warn(
        "[shopify-analytics] Shop not configured, skipping product view tracking",
      );
      return;
    }

    // Get the first variant (default) or selected variant
    const firstVariant = productVariants.value?.[0];
    if (!firstVariant) return;

    // Track product view
    publish(AnalyticsEvent.PRODUCT_VIEWED, {
      url: window.location.href,
      shop,
      products: [
        {
          id: productData.id,
          variantId: firstVariant.id,
          title: productData.title,
          variantTitle: firstVariant.title,
          vendor: (productData as any).vendor || "Unknown",
          price: firstVariant.price.amount,
          quantity: 1,
          productType: productData.productType,
          sku: firstVariant.sku,
        },
      ],
    });

    console.log("[Product Page] Analytics tracked:", {
      product: productData.title,
      variant: firstVariant.title,
    });
  },
  { immediate: true },
);
</script>

<template>
  <div
    v-if="productError && recommendedError"
    class="fixed top-(--header-height) left-0 w-full h-fit text-zinc-100 bg-line-pattern border-b border-zinc-200"
  >
    <div class="flex items-center justify-center gap-2.5 py-2">
      <Icon name="ph:warning-circle" class="inline-block shrink-0 !size-5" />
      <p class="text-normalize">503: No Shopify data found.</p>
    </div>
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
