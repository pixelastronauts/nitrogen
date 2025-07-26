<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
interface SearchViewProps {
  data: {
    searchTerm: string;
    searchResults?: any;
  };
  customData?: Record<string, unknown>;
}

const props = defineProps<SearchViewProps>();

watchEffect(() => {
  const { $analytics } = useNuxtApp() as any;

  if (!$analytics?.shop?.value?.shopId) return;

  const payload = {
    ...props.data,
    customData: {
      ...$analytics.customData.value,
      ...props.customData,
    },
    url: typeof window !== "undefined" ? window.location.href : "",
    shop: $analytics.shop.value,
    cart: $analytics.cart.value,
    prevCart: $analytics.prevCart.value,
  };

  $analytics.publish("search_viewed", payload);
});
</script>
