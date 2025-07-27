<script setup lang="ts">
import type { CartLineFragment } from "@@/types/shopify-storefront";

import { useMagicKeys } from "@vueuse/core";
import { flattenConnection } from "@/utils/graphql";

// Stores
const appStore = useAppStore();
const cartStore = useCartStore();

// Composables
const { optimisticItems } = useOptimisticCart();

// Transform optimistic items to match CartLineFragment structure using real variant data
const transformedOptimisticItems = computed(() => {
  return optimisticItems.value.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    attributes: item.attributes || [],
    discountAllocations: [], // Required field
    cost: {
      totalAmount: {
        amount: (
          parseFloat(item.optimisticData.customPrice.amount) * item.quantity
        ).toString(),
        currencyCode: item.optimisticData.customPrice.currencyCode,
      },
      subtotalAmount: {
        amount: (
          parseFloat(item.optimisticData.customPrice.amount) * item.quantity
        ).toString(),
        currencyCode: item.optimisticData.customPrice.currencyCode,
      },
    },
    // Use the real variant data for identical display
    merchandise: {
      ...item.optimisticData.baseVariant,
      id: item.merchandiseId, // Keep temp ID to distinguish from real item
      product: item.optimisticData.product,
    },
    // Mark as optimistic for special handling
    isOptimistic: true,
  })) as any[];
});

// Access data nodes - combine real and optimistic items, but hide base variants that have optimistic replacements
const lineItems = computed(() => {
  const realItems = flattenConnection(
    (cartStore as any).lineItems
  ) as CartLineFragment[];

  // Get list of original variant IDs that have optimistic items
  const optimisticVariantIds = optimisticItems.value.map(
    (item) => item.originalVariantId
  );

  // Filter out real items that have optimistic replacements
  const filteredRealItems = realItems.filter((realItem) => {
    return !optimisticVariantIds.includes(realItem.merchandise.id);
  });

  return [...transformedOptimisticItems.value, ...filteredRealItems];
});

// Computed - include optimistic items in total count
const cartTotalItems = computed(() => {
  const realCount = (cartStore as any).lineItemCount || 0;
  const optimisticCount = optimisticItems.value.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  return realCount + optimisticCount;
});

// Actions
const closeDrawer = () => {
  appStore.toggle("cartDrawer", false);
};

// Watchers
const route = useRoute();
const { escape } = useMagicKeys();

watch(() => route.path, closeDrawer);

if (escape) {
  watch(escape, closeDrawer);
}
</script>

<template>
  <Transition name="bg-fade">
    <div
      v-if="appStore.cartDrawer"
      class="fixed inset-0 z-200 bg-black/50 pointer-events-auto"
      @click="closeDrawer"
    />
  </Transition>
  <Transition name="slider">
    <aside
      v-if="appStore.cartDrawer"
      class="fixed top-0 right-0 z-200 size-full bg-white md:max-w-[450px]"
    >
      <div class="flex flex-col size-full px-5">
        <div
          class="flex justify-between items-center py-3 border-b border-zinc-300 lg:py-4"
        >
          <h2 class="uppercase">Your Cart ({{ cartTotalItems }})</h2>
          <button
            class="flex ring-1 ring-transparent ring-offset-2 rounded-xs focus:ring-black"
            @click="closeDrawer"
          >
            <Icon name="ph:x" class="inline-block shrink-0 !size-5" />
          </button>
        </div>
        <div v-if="lineItems?.length" class="flex flex-col size-full">
          <div class="flex-1 overflow-y-scroll overflow-x-hidden no-scrollbar">
            <CartLine v-for="line in lineItems" :key="line.id" :line="line" />
          </div>
          <CartSummary />
        </div>
        <div v-else class="flex flex-col justify-center items-center flex-1">
          <p class="mb-3 text-xl tracking-tight leading-none text-center">
            Your cart is empty
          </p>
          <button
            class="flex items-center justify-center p-2 px-4 text-normalize bg-zinc-100 border border-zinc-300 rounded-md transition duration-200 hover:bg-zinc-200"
            @click="closeDrawer"
          >
            <span>Back to Store</span>
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
@reference "tailwindcss";

.bg-fade-enter-active,
.bg-fade-leave-active {
  @apply transition duration-200 ease-out;
}

.bg-fade-enter-from,
.bg-fade-leave-to {
  @apply opacity-0;
}

.bg-fade-enter-to,
.bg-fade-leave-from {
  @apply opacity-100;
}

.slider-enter-active,
.slider-leave-active {
  @apply transition duration-500 ease-[cubic-bezier(0.32,0.72,0,1)];
}

.slider-enter-from,
.slider-leave-to {
  @apply transform translate-x-full;
}

.slider-enter-to,
.slider-leave-from {
  @apply transform translate-x-0;
}
</style>
