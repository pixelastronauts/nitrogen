<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
import type { ProductPayload } from "../../../../types/analytics";

interface ProductViewProps {
  data: {
    products: Array<ProductPayload>;
  };
  customData?: Record<string, unknown>;
}

const props = defineProps<ProductViewProps>();

// Watch for shop availability and publish event
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

  $analytics.publish("product_viewed", payload);
});
</script>
