<template>
  <div>
    <AppHeader />
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <div v-if="pending" class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div class="aspect-square bg-gray-200 rounded"></div>
          <div class="space-y-4">
            <div class="h-6 bg-gray-200 rounded"></div>
            <div class="h-4 bg-gray-200 rounded w-2/3"></div>
            <div class="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      <div v-else-if="product" class="space-y-8">
        <!-- Breadcrumbs -->
        <nav class="flex" aria-label="Breadcrumb">
          <ol class="flex items-center space-x-1 text-sm text-gray-600">
            <li>
              <NuxtLink to="/" class="hover:text-gray-900">Home</NuxtLink>
            </li>
            <li>/</li>
            <li>
              <NuxtLink to="/collections/all" class="hover:text-gray-900"
                >Products</NuxtLink
              >
            </li>
            <li>/</li>
            <li class="text-gray-900 font-medium">{{ product.title }}</li>
          </ol>
        </nav>

        <!-- Product -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <!-- Media -->
          <div class="space-y-4">
            <ProductMediaGallery v-if="product.media" :media="product.media" />
          </div>

          <!-- Details -->
          <div class="space-y-6">
            <ProductForm :product="product" />
          </div>
        </div>

        <!-- Recommendations -->
        <ProductRecommendations v-if="product.id" :product-id="product.id" />

        <!-- Analytics Tracking -->
        <AnalyticsProductView
          :data="{
            products: [
              {
                id: product.id,
                title: product.title,
                price: selectedVariant?.price?.amount || '0',
                vendor: product.vendor,
                variantId: selectedVariant?.id || '',
                variantTitle: selectedVariant?.title || '',
                quantity: 1,
                sku: selectedVariant?.sku || '',
                productType: product.productType || '',
              },
            ],
          }"
        />
      </div>

      <div v-else class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
        <p class="text-gray-600 mb-4">
          The product you're looking for doesn't exist.
        </p>
        <NuxtLink
          to="/collections/all"
          class="text-blue-600 hover:text-blue-700"
        >
          Browse all products
        </NuxtLink>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type {
  ProductQuery,
  ProductQueryVariables,
} from "@@/types/shopify-storefront";

// Route
const route = useRoute();
const handle = computed(() => route.params.handle as string);

// Stores
const shopStore = useShopStore();

// Data
const productVars = computed<ProductQueryVariables>(() => ({
  handle: handle.value,
  country: shopStore.buyerCountryCode,
  language: shopStore.buyerLanguageCode,
}));

const shopify = useShopify();

const { data: productData, pending } = await useAsyncData(
  `product-${handle.value}`,
  () => shopify.product.get(productVars.value),
  { watch: [productVars] }
);

// Computed
const product = computed(() => productData.value?.product);
const selectedVariant = computed(() => {
  if (!product.value?.variants?.edges?.length) return null;

  // Try to find variant by query parameters first
  const variantQuery = route.query.variant as string;
  if (variantQuery) {
    const foundVariant = product.value.variants.edges.find(
      (edge) => edge.node.id === variantQuery
    );
    if (foundVariant) return foundVariant.node;
  }

  // Return first available variant or first variant
  return (
    product.value.selectedOrFirstAvailableVariant ||
    product.value.variants.edges[0]?.node
  );
});

// SEO
useSeoMeta({
  title: () =>
    product.value?.title
      ? `${product.value.title} - Nitrogen`
      : "Product - Nitrogen",
  description: () => product.value?.description || "Product details",
  ogTitle: () => product.value?.title,
  ogDescription: () => product.value?.description,
  ogImage: () => product.value?.featuredImage?.url,
  ogType: "product",
});

// Structured data
useJsonld({
  "@context": "https://schema.org",
  "@type": "Product",
  name: () => product.value?.title,
  description: () => product.value?.description,
  image: () => product.value?.featuredImage?.url,
  brand: {
    "@type": "Brand",
    name: () => product.value?.vendor,
  },
  offers: {
    "@type": "Offer",
    price: () => selectedVariant.value?.price?.amount,
    priceCurrency: () => selectedVariant.value?.price?.currencyCode,
    availability: () =>
      selectedVariant.value?.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
  },
});
</script>
