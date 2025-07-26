<template>
  <div style="display: none"></div>
</template>

<script setup lang="ts">
interface CustomViewProps {
  event: `custom_${string}`;
  data?: Record<string, unknown>;
  customData?: Record<string, unknown>;
}

const props = defineProps<CustomViewProps>();

watchEffect(() => {
  const { $analytics } = useNuxtApp() as any;

  if (!$analytics?.shop?.value?.shopId) return;

  const payload = {
    ...props.data,
    customData: {
      ...$analytics.customData.value,
      ...props.customData,
    },
    shop: $analytics.shop.value,
  };

  $analytics.publish(props.event, payload);
});
</script>
