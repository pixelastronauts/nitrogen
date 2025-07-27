<script setup lang="ts">
import type { CartLineFragment } from "@@/types/shopify-storefront";

import { formatVariantId } from "@/utils/formatters";

// Props
const props = defineProps<{
  line: CartLineFragment | any; // Allow optimistic items
}>();

// Stores
const cartStore = useCartStore();

// Computed
const merchandise = computed(() => props.line.merchandise);
const variantId = computed(() => formatVariantId(props.line.merchandise.id));
const isOptimistic = computed(() => (props.line as any).isOptimistic || false);

// Check if this is a mat configurator item based on attributes or if it's optimistic
const isMatConfiguratorItem = computed(() => {
  // Always treat optimistic items as mat configurator items
  if (isOptimistic.value) {
    return true;
  }

  // Check attributes for real items
  const attributes = props.line.attributes || [];
  return attributes.some(
    (attr: any) =>
      attr.key === "_Length" ||
      attr.key === "_Width" ||
      attr.key === "_Vinyl_Edge"
  );
});

// Extract mat configuration from attributes - work for any item with these attributes
const matConfiguration = computed(() => {
  const attributes = props.line.attributes || [];
  const config: any = {};

  attributes.forEach((attr: any) => {
    if (attr.key === "_Length") config.length = attr.value;
    if (attr.key === "_Width") config.width = attr.value;
    if (attr.key === "_Vinyl_Edge") config.hasVinylEdge = attr.value === "true";
    if (attr.key === "_Cutting_Margin")
      config.hasCuttingMargin = attr.value === "true";
    if (attr.key === "Vinylrand") config.vinylEdgeDisplay = attr.value;
    if (attr.key === "Snijmarge") config.cuttingMarginDisplay = attr.value;
  });

  return config;
});

// Enhanced product title for mat items - no dimensions since they're shown separately
const displayTitle = computed(() => {
  const config = matConfiguration.value;
  const baseTitle = merchandise.value.product?.title || merchandise.value.title;

  // For mat configurator items, show only the base title (dimensions are in "Afmetingen")
  if (config.length && config.width) {
    return baseTitle;
  }

  return baseTitle;
});

// Enhanced selected options - show mat configuration when available
const selectedOptions = computed(() => {
  const config = matConfiguration.value;

  // If we have mat configuration (length/width), show mat-specific options
  if (config.length && config.width) {
    const matOptions = [];

    // Show color if it exists and is meaningful
    const colorOption = merchandise.value.selectedOptions?.find(
      (option: any) =>
        option.name.toLowerCase().includes("color") ||
        option.name.toLowerCase().includes("kleur")
    );

    if (colorOption && colorOption.value !== "Default Title") {
      // Format color value for ST_ prefixed values
      let formattedColorValue = colorOption.value;

      if (colorOption.value.startsWith("ST_")) {
        // Extract the color part: ST_PurplePeach_120x120 -> PurplePeach
        const parts = colorOption.value.split("_");
        if (parts.length >= 2) {
          const colorPart = parts[1]; // Get the second part
          // Split by capital letters: PurplePeach -> Purple Peach
          formattedColorValue = colorPart.replace(/([A-Z])/g, " $1").trim();
        }
      }

      matOptions.push({ name: "Color", value: formattedColorValue });
    }

    // Show dimensions
    matOptions.push({
      name: "Afmetingen",
      value: `${config.length}x${config.width}cm`,
    });

    // Show vinyl edge option
    if (config.vinylEdgeDisplay) {
      matOptions.push({ name: "Vinylrand", value: config.vinylEdgeDisplay });
    }

    // Show cutting margin option
    if (config.cuttingMarginDisplay) {
      matOptions.push({
        name: "Snijmarge",
        value: config.cuttingMarginDisplay,
      });
    }

    return matOptions;
  }

  // For regular items without mat configuration, show filtered variant options with formatted colors
  const regularOptions =
    merchandise.value.selectedOptions?.filter(
      (option: any) =>
        option.name !== "Title" && option.value !== "Default Title"
    ) || [];

  // Format ST_ color values for regular items too
  return regularOptions.map((option: any) => {
    if (
      (option.name.toLowerCase().includes("color") ||
        option.name.toLowerCase().includes("kleur")) &&
      option.value.startsWith("ST_")
    ) {
      // Extract the color part: ST_PurplePeach_120x120 -> PurplePeach
      const parts = option.value.split("_");
      if (parts.length >= 2) {
        const colorPart = parts[1]; // Get the second part
        // Split by capital letters: PurplePeach -> Purple Peach
        const formattedValue = colorPart.replace(/([A-Z])/g, " $1").trim();
        return { ...option, value: formattedValue };
      }
    }
    return option;
  });
});

// Composables for optimistic cart handling
const { removeOptimisticItem } = useOptimisticCart();

// Actions
const removeLineFromCart = async (lineId: string) => {
  if (isOptimistic.value) {
    // Remove optimistic item
    removeOptimisticItem(lineId);
  } else {
    // Remove real Shopify cart item
    await (cartStore as any).removeFromCart([lineId]);
  }
};

const updateLineQuantity = async (
  line: CartLineFragment,
  newQuantity: number
) => {
  if (isOptimistic.value) {
    // Don't allow quantity changes for optimistic items
    return;
  }

  if (newQuantity <= 0) {
    await removeLineFromCart(line.id);
  } else {
    const quantityAvailable = Math.min(newQuantity, 10);
    await (cartStore as any).updateCart([
      {
        id: line.id,
        quantity: quantityAvailable,
      },
    ]);
  }
};
</script>

<template>
  <div class="flex items-center gap-6 pb-4 my-4 border-b border-zinc-300">
    <NuxtLink
      :to="`/products/${
        merchandise.product?.handle || 'product'
      }?variant=${variantId}`"
      class="aspect-square size-28 shrink-0 border border-transparent transition duration-200 hover:border-zinc-300"
    >
      <ShopifyImage
        :image="merchandise.image || merchandise.product?.featuredImage"
        :alt="merchandise.product?.title || merchandise.title"
      />
    </NuxtLink>
    <div class="flex flex-col justify-between flex-1 gap-6 min-h-[100px]">
      <div class="flex justify-between">
        <div class="uppercase">
          <h3 class="mb-1.5">
            {{ displayTitle }}
          </h3>
          <p v-for="option in selectedOptions" :key="option.name">
            {{ option.name }}: {{ option.value }}
          </p>
        </div>
        <div>
          <PriceDisplay :price="line.cost.totalAmount" />
        </div>
      </div>
      <div class="flex justify-between">
        <div class="flex items-center gap-4">
          <button
            class="flex items-center justify-center p-2 bg-transparent border border-zinc-300 rounded-full transition duration-200 hover:lg:border-black"
            @click="updateLineQuantity(line, line.quantity - 1)"
          >
            <Icon name="ph:minus" class="inline-block shrink-0 !size-3" />
          </button>
          <span>{{ line.quantity }}</span>
          <button
            class="flex items-center justify-center p-2 bg-transparent border border-zinc-300 rounded-full transition duration-200 hover:lg:border-black"
            @click="updateLineQuantity(line, line.quantity + 1)"
          >
            <Icon name="ph:plus" class="inline-block shrink-0 !size-3" />
          </button>
        </div>
        <button
          class="max-w-fit underline decoration-dotted decoration-1 underline-offset-[3px] hover:text-gray-500"
          @click="removeLineFromCart(line.id)"
        >
          <span>Remove</span>
        </button>
      </div>
    </div>
  </div>
</template>
