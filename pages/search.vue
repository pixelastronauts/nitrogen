<template>
  <div>
    <AppHeader />
    <main class="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
      <!-- Search Header -->
      <div class="mb-8">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
          {{ searchTerm ? `Search results for "${searchTerm}"` : "Search" }}
        </h1>

        <!-- Search Form -->
        <form @submit.prevent="performSearch" class="max-w-md">
          <div class="relative">
            <input
              v-model="searchQuery"
              type="search"
              placeholder="Search products..."
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <Icon name="heroicons:magnifying-glass" class="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div v-if="pending" class="animate-pulse">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="i in 8"
            :key="i"
            class="aspect-square bg-gray-200 rounded"
          ></div>
        </div>
      </div>

      <!-- Search Results -->
      <div v-else-if="searchTerm">
        <div v-if="searchResults?.length" class="space-y-6">
          <p class="text-gray-600">
            Found {{ searchResults.length }} result{{
              searchResults.length !== 1 ? "s" : ""
            }}
          </p>

          <div
            class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
          >
            <ProductCard
              v-for="product in searchResults"
              :key="product.id"
              :product="product"
            />
          </div>
        </div>

        <div v-else class="text-center py-12">
          <Icon
            name="heroicons:magnifying-glass"
            class="w-12 h-12 text-gray-400 mx-auto mb-4"
          />
          <h2 class="text-xl font-semibold text-gray-900 mb-2">
            No results found
          </h2>
          <p class="text-gray-600">
            No products found for "{{ searchTerm }}". Try adjusting your search
            terms.
          </p>
        </div>

        <!-- Analytics Tracking -->
        <AnalyticsSearchView
          :data="{
            searchTerm: searchTerm,
            searchResults: searchResults,
          }"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <Icon
          name="heroicons:magnifying-glass"
          class="w-12 h-12 text-gray-400 mx-auto mb-4"
        />
        <h2 class="text-xl font-semibold text-gray-900 mb-2">
          Search our products
        </h2>
        <p class="text-gray-600">Enter a search term above to find products.</p>
      </div>
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import type {
  SearchQuery,
  SearchQueryVariables,
} from "@@/types/shopify-storefront";

// Route & Query
const route = useRoute();
const router = useRouter();
const searchQuery = ref("");
const searchTerm = computed(() => (route.query.q as string) || "");

// Initialize search query from URL
onMounted(() => {
  searchQuery.value = searchTerm.value;
});

// Stores
const shopStore = useShopStore();

// Data
const searchVars = computed<SearchQueryVariables>(() => ({
  query: searchTerm.value,
  country: shopStore.buyerCountryCode,
  language: shopStore.buyerLanguageCode,
  first: 20,
}));

const shopify = useShopify();

const { data: searchData, pending } = await useAsyncData(
  `search-${searchTerm.value}`,
  () => (searchTerm.value ? shopify.search.get(searchVars.value) : null),
  {
    watch: [searchVars],
    default: () => null,
  }
);

// Computed
const searchResults = computed(
  () => searchData.value?.search?.edges?.map((edge) => edge.node) || []
);

// Methods
const performSearch = () => {
  if (searchQuery.value.trim()) {
    router.push({ query: { q: searchQuery.value.trim() } });
  }
};

// SEO
useSeoMeta({
  title: () =>
    searchTerm.value
      ? `Search: ${searchTerm.value} - Nitrogen`
      : "Search - Nitrogen",
  description: () =>
    searchTerm.value
      ? `Search results for "${searchTerm.value}"`
      : "Search our product catalog",
});
</script>
