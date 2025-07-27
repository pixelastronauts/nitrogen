<script setup lang="ts">
import type {
  ProductFragment,
  ProductVariantFragment,
} from "@@/types/shopify-storefront";

// Props
const props = defineProps<{
  product: ProductFragment;
  currentVariant?: ProductVariantFragment;
  variants: ProductVariantFragment[];
  isValid: boolean;
  totalPrice: number;
}>();

// Injected state from parent
const configuratorState = inject("configuratorState") as any;
const configuratorConfig = inject("configuratorConfig") as any;
const baseVariant = inject("baseVariant") as any;

// Stores
const appStore = useAppStore();
const cartStore = useCartStore();

// Composables
const { createVariant, formatPrice } = usePricing();
const { addOptimisticItem, removeOptimisticItemByVariantId } =
  useOptimisticCart();

// Local state
const isLoading = ref(false);

// Methods
const openDrawer = () => {
  appStore.toggle("cartDrawer", true);
};

// Helper to create a "calculated variant" for immediate optimistic add
const createCalculatedVariant = () => {
  const { length, width, hasVinylEdge, hasCuttingMargin } = configuratorState;

  if (!baseVariant.value) {
    throw new Error("Cannot create calculated variant: missing base variant");
  }

  // Calculate display dimensions (with cutting margin if selected)
  let displayLength = length;
  let displayWidth = width;

  if (hasCuttingMargin) {
    displayLength += 3;
    displayWidth += 3;
  }

  // Create a temporary variant object with calculated price and custom title
  const calculatedVariant = {
    ...baseVariant.value,
    id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary ID
    title: `${props.product.title} - ${displayLength}x${displayWidth}cm${
      hasVinylEdge ? " + Vinylrand" : ""
    }${hasCuttingMargin ? " + Snijmarge" : ""}`,
    price: {
      amount: props.totalPrice.toString(),
      currencyCode: baseVariant.value.price.currencyCode,
    },
    compareAtPrice: null,
    // Keep other variant properties for compatibility
    availableForSale: true,
    currentlyNotInStock: false,
    quantityAvailable: 999,
    requiresShipping: baseVariant.value.requiresShipping,
    selectedOptions: [
      ...baseVariant.value.selectedOptions,
      { name: "Afmetingen", value: `${displayLength}x${displayWidth}cm` },
      { name: "Vinylrand", value: hasVinylEdge ? "Ja" : "Nee" },
      { name: "Snijmarge", value: hasCuttingMargin ? "Ja" : "Nee" },
    ],
  };

  console.log(
    "Created calculated variant for immediate add:",
    calculatedVariant
  );
  return calculatedVariant;
};

// Helper to create real custom variant with API
const createRealCustomVariant = async () => {
  const { length, width, hasVinylEdge, hasCuttingMargin } = configuratorState;

  if (!configuratorConfig.activeFormula?.id) {
    throw new Error("Cannot create custom variant: missing formula");
  }

  if (!baseVariant.value) {
    throw new Error("Cannot create custom variant: missing base variant");
  }

  // Create the real custom variant via API
  const customVariant = await createVariant({
    formula_id: configuratorConfig.activeFormula.id,
    width: width + (hasCuttingMargin ? 3 : 0),
    length: length + (hasCuttingMargin ? 3 : 0),
    productId: props.product.id,
    variantId: baseVariant.value.id,
    hasVinylEdge,
    hasCuttingMargin,
  });

  if (!customVariant || !customVariant.id) {
    throw new Error("Failed to create custom variant");
  }

  return customVariant;
};

// Helper to create real variant and replace both optimistic and base variants
const createRealVariantAndUpdate = async (
  optimisticId: string,
  attributes: Array<{ key: string; value: string }>
) => {
  try {
    console.log("Creating real variant in background...");

    // Create the real variant via API
    const realVariant = await createRealCustomVariant();

    console.log("Real variant created:", realVariant);

    // Find the cart line item with our temporary variant
    const cartLines = (cartStore as any).cart?.lines?.edges || [];
    const cartNodes = cartLines.map((edge: any) => edge.node);

    // Find the most recent cart line with our base variant ID
    const baseCartLine = cartNodes
      .reverse()
      .find((line: any) => line.merchandise.id === baseVariant.value.id);

    if (!baseCartLine) {
      console.warn(
        "Could not find cart line with base variant ID:",
        baseVariant.value.id
      );
      return;
    }

    console.log("Found base cart line, updating with real variant...");

    // Update the cart line to use the real variant
    await (cartStore as any).updateCart([
      {
        id: baseCartLine.id,
        merchandiseId: realVariant.id,
        quantity: baseCartLine.quantity,
        attributes: attributes,
      },
    ]);

    console.log("Cart successfully updated with real variant!");

    // Remove the optimistic item now that we have the real variant
    removeOptimisticItemByVariantId(baseVariant.value.id);
    console.log("Removed optimistic item and replaced with real variant");
  } catch (error) {
    console.error("Failed to create real variant or update cart:", error);

    // If real variant creation fails, keep the optimistic item
    // This way user still sees their configured mat with correct price
    console.warn(
      "Keeping optimistic item due to background error - user will see calculated price"
    );
  }
};

const addToCart = async () => {
  if (!props.isValid || !baseVariant.value || isLoading.value) return;

  isLoading.value = true;

  try {
    // Get current configuration
    const { length, width, hasVinylEdge, hasCuttingMargin } = configuratorState;

    // Calculate display dimensions (with cutting margin if selected)
    let displayLength = length;
    let displayWidth = width;

    if (hasCuttingMargin) {
      displayLength += 3;
      displayWidth += 3;
    }

    // Prepare line item attributes for the cart
    const attributes = [
      { key: "_Length", value: displayLength.toString() },
      { key: "_Width", value: displayWidth.toString() },
      { key: "Lengte (cm)", value: displayLength.toString() },
      { key: "Breedte (cm)", value: displayWidth.toString() },
      { key: "_Vinyl_Edge", value: hasVinylEdge.toString() },
      {
        key: "Vinylrand",
        value: hasVinylEdge ? "Met vinylrand" : "Zonder vinylrand",
      },
      { key: "_Cutting_Margin", value: hasCuttingMargin.toString() },
      {
        key: "Snijmarge",
        value: hasCuttingMargin ? "Met snijmarge" : "Zonder snijmarge",
      },
    ];

    // Step 1: Add optimistic item (user sees correct price immediately)
    console.log("Adding optimistic item...");
    const optimisticId = addOptimisticItem({
      merchandiseId: `temp-${baseVariant.value.id}`,
      quantity: 1,
      attributes,
      originalVariantId: baseVariant.value.id,
      optimisticData: {
        // Store real variant and product data for identical display
        baseVariant: baseVariant.value,
        product: props.product,
        customPrice: {
          amount: (props.totalPrice / 100).toFixed(2), // Convert from cents to euros
          currencyCode: baseVariant.value.price.currencyCode,
        },
      },
    });

    // Step 2: Add base variant to Shopify cart (hidden from user display)
    console.log("Adding base variant to Shopify cart...");
    await (cartStore as any).addToCart([
      {
        merchandiseId: baseVariant.value.id,
        quantity: 1,
        attributes,
      },
    ]);

    // Step 3: Open cart drawer immediately (shows optimistic item)
    openDrawer();

    // Step 4: Create real variant in background and replace both items
    console.log("Creating real variant in background...");
    createRealVariantAndUpdate(optimisticId, attributes);

    // Dispatch success event
    const addToCartEvent = new CustomEvent("mat-configurator:added-to-cart", {
      bubbles: true,
      detail: {
        product: props.product,
        variant: baseVariant.value,
        configuration: { length, width, hasVinylEdge, hasCuttingMargin },
        price: props.totalPrice,
        attributes,
        isOptimistic: true, // Real variant will replace this in background
      },
    });
    document.dispatchEvent(addToCartEvent);
  } catch (error) {
    console.error("Add to cart error:", error);
    // You could add a toast notification here
    alert(
      error instanceof Error
        ? error.message
        : "Er is een fout opgetreden bij het toevoegen aan de winkelwagen"
    );
  } finally {
    isLoading.value = false;
  }
};

// Computed
const buttonText = computed(() => {
  if (isLoading.value) return "Toevoegen...";
  if (!props.isValid) return "Maak je keuze";
  if (!baseVariant.value?.availableForSale) return "Niet beschikbaar";
  return "Aan winkelwagen toevoegen";
});

const buttonDisabled = computed(() => {
  return (
    !props.isValid || isLoading.value || !baseVariant.value?.availableForSale
  );
});

const formattedPrice = computed(() => {
  return formatPrice(props.totalPrice);
});
</script>

<template>
  <div class="mat-add-to-cart space-y-4">
    <!-- Add to Cart Button -->
    <button
      type="button"
      class="w-full py-4 px-6 bg-black text-white font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
      :class="[
        buttonDisabled
          ? 'opacity-50 cursor-not-allowed bg-gray-400'
          : 'hover:bg-gray-800 active:bg-gray-900',
      ]"
      :disabled="buttonDisabled"
      @click="addToCart"
    >
      <!-- Loading spinner -->
      <div v-if="isLoading" class="flex items-center justify-center gap-2">
        <svg
          class="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span>{{ buttonText }}</span>
      </div>

      <!-- Normal state -->
      <span v-else class="flex items-center justify-center gap-2">
        <svg
          v-if="!isValid"
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clip-rule="evenodd"
          />
        </svg>
        <svg
          v-else
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3m4 10v6a1 1 0 001 1h8a1 1 0 001-1v-6m-10 0V9a1 1 0 011-1h8a1 1 0 011 1v4m-10 0h10"
          />
        </svg>
        <span>{{ buttonText }}</span>
      </span>
    </button>

    <!-- Validation Message -->
    <div v-if="!isValid" class="text-center">
      <p class="text-sm text-gray-600">
        Kies alle opties om door te gaan naar je winkelwagen
      </p>
    </div>
  </div>
</template>
