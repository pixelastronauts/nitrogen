<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
interface CartViewProps {
  customData?: Record<string, unknown>;
}

const props = defineProps<CartViewProps>();

watchEffect(() => {
  const { $analytics } = useNuxtApp() as any;

  if (!$analytics?.shop?.value?.shopId) return;

  const payload = {
    cart: $analytics.cart.value,
    prevCart: $analytics.prevCart.value,
    customData: {
      ...$analytics.customData.value,
      ...props.customData,
    },
    url: typeof window !== "undefined" ? window.location.href : "",
    shop: $analytics.shop.value,
  };

  $analytics.publish("cart_viewed", payload);
});
</script>
