<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        🔍 Analytics Test Dashboard
      </h1>

      <!-- Status Panel -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">📊 Analytics Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            class="p-4 rounded-lg"
            :class="analyticsLoaded ? 'bg-green-100' : 'bg-red-100'"
          >
            <div
              class="text-sm font-medium"
              :class="analyticsLoaded ? 'text-green-800' : 'text-red-800'"
            >
              Analytics Context
            </div>
            <div
              class="text-2xl font-bold"
              :class="analyticsLoaded ? 'text-green-600' : 'text-red-600'"
            >
              {{ analyticsLoaded ? "✅ Loaded" : "❌ Missing" }}
            </div>
          </div>

          <div
            class="p-4 rounded-lg"
            :class="canTrack ? 'bg-green-100' : 'bg-yellow-100'"
          >
            <div
              class="text-sm font-medium"
              :class="canTrack ? 'text-green-800' : 'text-yellow-800'"
            >
              Tracking Consent
            </div>
            <div
              class="text-2xl font-bold"
              :class="canTrack ? 'text-green-600' : 'text-yellow-600'"
            >
              {{ canTrack ? "✅ Allowed" : "⚠️ Blocked" }}
            </div>
          </div>

          <div
            class="p-4 rounded-lg"
            :class="shopDataLoaded ? 'bg-green-100' : 'bg-yellow-100'"
          >
            <div
              class="text-sm font-medium"
              :class="shopDataLoaded ? 'text-green-800' : 'text-yellow-800'"
            >
              Shop Data
            </div>
            <div
              class="text-2xl font-bold"
              :class="shopDataLoaded ? 'text-green-600' : 'text-yellow-600'"
            >
              {{ shopDataLoaded ? "✅ Loaded" : "⏳ Loading" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Data Display -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">📋 Current Analytics Data</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-2">Shop Information</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto">{{
              JSON.stringify(shopData, null, 2)
            }}</pre>
          </div>
          <div>
            <h3 class="font-medium mb-2">Cart Information</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto">{{
              JSON.stringify(cartSummary, null, 2)
            }}</pre>
          </div>
        </div>
      </div>

      <!-- Event Testing Panel -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🧪 Test Analytics Events</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Page View Test -->
          <button
            @click="testPageView"
            class="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📄 Test Page View
          </button>

          <!-- Product View Test -->
          <button
            @click="testProductView"
            class="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            🛍️ Test Product View
          </button>

          <!-- Collection View Test -->
          <button
            @click="testCollectionView"
            class="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            📂 Test Collection View
          </button>

          <!-- Search View Test -->
          <button
            @click="testSearchView"
            class="p-4 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            🔍 Test Search View
          </button>

          <!-- Add to Cart Test -->
          <button
            @click="testAddToCart"
            class="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            🛒 Test Add to Cart
          </button>

          <!-- Custom Event Test -->
          <button
            @click="testCustomEvent"
            class="p-4 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            ⚡ Test Custom Event
          </button>
        </div>
      </div>

      <!-- Event Log -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">📝 Event Log</h2>
          <button
            @click="clearEventLog"
            class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Clear Log
          </button>
        </div>
        <div class="space-y-2 max-h-96 overflow-y-auto">
          <div
            v-for="(event, index) in eventLog"
            :key="index"
            class="p-3 bg-gray-50 rounded border-l-4"
            :class="getEventColor(event.type)"
          >
            <div class="flex justify-between items-start">
              <div>
                <span class="font-medium">{{ event.type }}</span>
                <span class="text-sm text-gray-500 ml-2">{{
                  event.timestamp
                }}</span>
              </div>
              <span
                class="text-xs px-2 py-1 rounded"
                :class="
                  event.sent
                    ? 'bg-green-200 text-green-800'
                    : 'bg-yellow-200 text-yellow-800'
                "
              >
                {{ event.sent ? "Sent" : "Queued" }}
              </span>
            </div>
            <pre class="text-xs text-gray-600 mt-2 overflow-auto">{{
              JSON.stringify(event.payload, null, 2)
            }}</pre>
          </div>
          <div
            v-if="eventLog.length === 0"
            class="text-center text-gray-500 py-8"
          >
            No events logged yet. Click the test buttons above to generate
            events.
          </div>
        </div>
      </div>

      <!-- Analytics Components Demo -->
      <div class="bg-white rounded-lg shadow p-6 mt-8">
        <h2 class="text-xl font-semibold mb-4">🎯 Analytics Components Demo</h2>
        <p class="text-gray-600 mb-4">
          These components automatically fire analytics events when rendered:
        </p>

        <div class="space-y-4">
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">Product View Component</h3>
            <AnalyticsProductView
              :data="{
                products: [
                  {
                    id: 'gid://shopify/Product/987654321',
                    title: 'Test Product',
                    vendor: 'Test Vendor',
                    price: '29.99',
                    variantId: 'gid://shopify/ProductVariant/555444333',
                    variantTitle: 'Default Title',
                    productType: 'Test Type',
                  },
                ],
              }"
            />
            <p class="text-sm text-gray-500 mt-2">
              ✅ This component fired a product_viewed event when it mounted
            </p>
          </div>

          <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">Collection View Component</h3>
            <AnalyticsCollectionView
              :data="{
                collection: {
                  id: 'gid://shopify/Collection/123456789',
                  handle: 'test-collection',
                  title: 'Test Collection',
                },
              }"
            />
            <p class="text-sm text-gray-500 mt-2">
              ✅ This component fired a collection_viewed event when it mounted
            </p>
          </div>
        </div>
      </div>

      <!-- Verification Guide -->
      <div class="bg-blue-50 rounded-lg p-6 mt-8">
        <h2 class="text-xl font-semibold mb-4 text-blue-900">
          🔍 How to Verify Analytics Are Working
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 class="font-medium text-blue-800 mb-2">
              🌐 Browser DevTools (Real-time)
            </h3>
            <ol class="list-decimal list-inside space-y-1 text-blue-700">
              <li>Open DevTools → Network tab</li>
              <li>Filter by "shopify" or "monorail"</li>
              <li>Click test buttons above</li>
              <li>Look for successful POST requests</li>
              <li>Check server console for debug logs</li>
            </ol>
          </div>
          <div>
            <h3 class="font-medium text-blue-800 mb-2">
              🏪 Shopify Admin (5-30 minutes delay)
            </h3>
            <ol class="list-decimal list-inside space-y-1 text-blue-700">
              <li>Analytics → Online store sessions</li>
              <li>Analytics → Behavior reports</li>
              <li>Check for increased page views</li>
              <li>Verify traffic sources</li>
              <li>Monitor conversion events</li>
            </ol>
          </div>
        </div>
        <div class="mt-4 p-3 bg-blue-100 rounded text-blue-800 text-sm">
          <strong>🎯 Debug Tip:</strong> Check your server console (where you
          ran <code>bun dev</code>) for detailed analytics logs including event
          IDs and Shopify responses.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useConsentStore } from "~/stores/consent";

// Page metadata
definePageMeta({
  title: "Analytics Test Dashboard",
});

// Reactive state
const eventLog = ref([]);
const analytics = ref(null);

// Computed properties
const analyticsLoaded = computed(() => !!analytics.value);
// Import consent store for direct reactivity
const consentStore = useConsentStore();

const canTrack = computed(() => {
  try {
    // Use consent store directly for better reactivity
    if (consentStore.hasConsentDecision) {
      return consentStore.analytics;
    }

    // Fallback to analytics context
    return analytics.value?.canTrack?.value?.() ?? false;
  } catch (e) {
    return false;
  }
});

// Watch canTrack changes for debugging
watch(
  canTrack,
  (newValue, oldValue) => {
    if (newValue !== oldValue) {
      // canTrack changed
    }
  },
  { immediate: true }
);
const shopDataLoaded = computed(() => !!analytics.value?.shop?.value?.shopId);

const shopData = computed(() => analytics.value?.shop?.value || {});
const cartSummary = computed(() => {
  const cart = analytics.value?.cart?.value;
  if (!cart) return { status: "No cart data" };

  return {
    id: cart.id,
    totalQuantity: cart.totalQuantity,
    estimatedCost: cart.estimatedCost?.totalAmount,
    lineCount: cart.lines?.edges?.length || 0,
    updatedAt: cart.updatedAt,
  };
});

// Initialize analytics
onMounted(() => {
  const nuxtApp = useNuxtApp();
  analytics.value = nuxtApp.$analytics;

  if (analytics.value) {
    // Subscribe to all analytics events for logging
    const eventTypes = [
      "page_viewed",
      "product_viewed",
      "collection_viewed",
      "search_viewed",
      "cart_updated",
      "product_added_to_cart",
      "product_removed_from_cart",
      "custom_event",
    ];

    eventTypes.forEach((eventType) => {
      analytics.value.subscribe(eventType, (payload) => {
        eventLog.value.unshift({
          type: eventType,
          payload,
          timestamp: new Date().toLocaleTimeString(),
          sent: true,
        });
      });
    });

    // Subscribed to all events
  } else {
    console.error("🚨 Analytics Test Page: Analytics context not available");
  }
});

// Test functions
function testPageView() {
  if (!analytics.value) return;

  analytics.value.publish("page_viewed", {
    url: window.location.href,
    shop: analytics.value.shop.value,
    cart: analytics.value.cart.value,
    prevCart: analytics.value.prevCart.value,
    customData: { test: true, source: "test-page" },
  });
}

function testProductView() {
  if (!analytics.value) return;

  analytics.value.publish("product_viewed", {
    products: [
      {
        id: "gid://shopify/Product/987654321",
        title: "Test Product for Analytics",
        vendor: "Test Vendor",
        price: "49.99",
        variantId: "gid://shopify/ProductVariant/555444333",
        variantTitle: "Test Variant",
        productType: "Test Category",
        sku: "TEST-SKU-123",
      },
    ],
    shop: analytics.value.shop.value,
    cart: analytics.value.cart.value,
    url: window.location.href,
  });
}

function testCollectionView() {
  if (!analytics.value) return;

  analytics.value.publish("collection_viewed", {
    collection: {
      id: "gid://shopify/Collection/123456789",
      handle: "test-collection",
      title: "Test Collection for Analytics",
    },
    shop: analytics.value.shop.value,
    cart: analytics.value.cart.value,
    url: window.location.href,
  });
}

function testSearchView() {
  if (!analytics.value) return;

  analytics.value.publish("search_viewed", {
    searchTerm: "test analytics search",
    shop: analytics.value.shop.value,
    cart: analytics.value.cart.value,
    url: window.location.href,
  });
}

function testAddToCart() {
  if (!analytics.value) return;

  analytics.value.publish("product_added_to_cart", {
    currentLine: {
      id: "gid://shopify/CartLine/test-line-123",
      quantity: 2,
      merchandise: {
        id: "gid://shopify/ProductVariant/555444333",
        title: "Test Variant",
        sku: "TEST-SKU-123",
        price: { amount: "49.99" },
        product: {
          id: "gid://shopify/Product/987654321",
          title: "Test Product for Cart",
          vendor: "Test Vendor",
          productType: "Test Type",
        },
      },
    },
    cart: analytics.value.cart.value,
    shop: analytics.value.shop.value,
    url: window.location.href,
  });
}

function testCustomEvent() {
  if (!analytics.value) return;

  analytics.value.publish("custom_event", {
    eventName: "test_custom_event",
    eventData: {
      testParameter: "test value",
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      source: "analytics-test-page",
    },
    shop: analytics.value.shop.value,
  });
}

function clearEventLog() {
  eventLog.value = [];
}

function getEventColor(eventType) {
  const colors = {
    page_viewed: "border-blue-400",
    product_viewed: "border-green-400",
    collection_viewed: "border-purple-400",
    search_viewed: "border-yellow-400",
    cart_updated: "border-orange-400",
    product_added_to_cart: "border-red-400",
    product_removed_from_cart: "border-pink-400",
    custom_event: "border-indigo-400",
  };
  return colors[eventType] || "border-gray-400";
}
</script>
