<script setup lang="ts">
import type { ProductFragment } from '@@/types/shopify-storefront'

// Props
const props = defineProps<{
  products?: ProductFragment[]
}>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <h2 class="text-xl tracking-tight leading-none">
      You May Also Like
    </h2>
    <div
      v-if="props.products"
      class="grid grid-cols-2 auto-rows-fr gap-x-6 gap-y-8 w-full mb-8 lg:grid-cols-4 lg:gap-y-12"
    >
      <div
        v-for="product in products"
        :key="product.id"
      >
        <ProductCard :product="product" />
      </div>
    </div>
  </div>
</template>
