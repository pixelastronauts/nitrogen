<template>
  <div>
    <AppHeader />
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <div v-if="pending" class="animate-pulse">
        <div class="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div class="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="i in 8"
            :key="i"
            class="aspect-square bg-gray-200 rounded"
          ></div>
        </div>
      </div>

      <div v-else-if="collection" class="space-y-8">
        <!-- Header -->
        <div class="text-center space-y-4">
          <h1 class="text-3xl md:text-4xl font-bold text-gray-900">
            {{ collection.title }}
          </h1>
          <p
            v-if="collection.description"
            class="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {{ collection.description }}
          </p>
        </div>

        <!-- Filters & Sort -->
        <FilterMenu />

        <!-- Products Grid -->
        <div
          v-if="products?.length"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <div v-else class="text-center py-12">
          <p class="text-gray-600">No products found in this collection.</p>
        </div>

        <!-- Analytics Tracking -->
        <AnalyticsCollectionView
          :data="{
            collection: {
              id: collection.id,
              handle: collection.handle,
            },
          }"
        />
      </div>

      <div v-else class="text-center py-12">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">
          Collection not found
        </h1>
        <p class="text-gray-600 mb-4">
          The collection you're looking for doesn't exist.
        </p>
        <NuxtLink
          to="/collections/all"
          class="text-blue-600 hover:text-blue-700"
        >
          Browse all collections
        </NuxtLink>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type {
  CollectionQuery,
  CollectionQueryVariables,
} from "@@/types/shopify-storefront";

// Route
const route = useRoute();
const handle = computed(() => route.params.handle as string);

// Stores
const shopStore = useShopStore();

// Data
const collectionVars = computed<CollectionQueryVariables>(() => ({
  handle: handle.value,
  country: shopStore.buyerCountryCode,
  language: shopStore.buyerLanguageCode,
  first: 20, // Adjust as needed
}));

const shopify = useShopify();

const { data: collectionData, pending } = await useAsyncData(
  `collection-${handle.value}`,
  () => shopify.collection.get(collectionVars.value),
  { watch: [collectionVars] }
);

// Computed
const collection = computed(() => collectionData.value?.collection);
const products = computed(
  () => collection.value?.products?.edges?.map((edge) => edge.node) || []
);

// SEO
useSeoMeta({
  title: () =>
    collection.value?.title
      ? `${collection.value.title} - Nitrogen`
      : "Collection - Nitrogen",
  description: () => collection.value?.description || "Product collection",
  ogTitle: () => collection.value?.title,
  ogDescription: () => collection.value?.description,
  ogImage: () => collection.value?.image?.url,
});
</script>
