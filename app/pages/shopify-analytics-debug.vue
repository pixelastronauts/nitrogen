<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-6xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        📊 Shopify Analytics Debug Dashboard
      </h1>

      <!-- Connection Status -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🔗 Connection Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            class="p-4 rounded-lg"
            :class="shopifyConnected ? 'bg-green-100' : 'bg-red-100'"
          >
            <div
              class="text-sm font-medium"
              :class="shopifyConnected ? 'text-green-800' : 'text-red-800'"
            >
              Shopify API
            </div>
            <div
              class="text-2xl font-bold"
              :class="shopifyConnected ? 'text-green-600' : 'text-red-600'"
            >
              {{ shopifyConnected ? "✅ Connected" : "❌ Failed" }}
            </div>
          </div>

          <div
            class="p-4 rounded-lg"
            :class="monorailReady ? 'bg-green-100' : 'bg-yellow-100'"
          >
            <div
              class="text-sm font-medium"
              :class="monorailReady ? 'text-green-800' : 'text-yellow-800'"
            >
              Monorail Endpoint
            </div>
            <div
              class="text-2xl font-bold"
              :class="monorailReady ? 'text-green-600' : 'text-yellow-600'"
            >
              {{ monorailReady ? "✅ Ready" : "⏳ Testing" }}
            </div>
          </div>

          <div
            class="p-4 rounded-lg"
            :class="cookiesSet ? 'bg-green-100' : 'bg-yellow-100'"
          >
            <div
              class="text-sm font-medium"
              :class="cookiesSet ? 'text-green-800' : 'text-yellow-800'"
            >
              Shopify Cookies
            </div>
            <div
              class="text-2xl font-bold"
              :class="cookiesSet ? 'text-green-600' : 'text-yellow-600'"
            >
              {{ cookiesSet ? "✅ Set" : "⚠️ Missing" }}
            </div>
          </div>

          <div
            class="p-4 rounded-lg"
            :class="privacyApiLoaded ? 'bg-green-100' : 'bg-red-100'"
          >
            <div
              class="text-sm font-medium"
              :class="privacyApiLoaded ? 'text-green-800' : 'text-red-800'"
            >
              Privacy API
            </div>
            <div
              class="text-2xl font-bold"
              :class="privacyApiLoaded ? 'text-green-600' : 'text-red-600'"
            >
              {{ privacyApiLoaded ? "✅ Loaded" : "❌ Blocked" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Shopify Configuration -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibent mb-4">⚙️ Shopify Configuration</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-2">Shop Analytics Data</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto h-40">{{
              JSON.stringify(shopAnalytics, null, 2)
            }}</pre>
          </div>
          <div>
            <h3 class="font-medium mb-2">Environment Configuration</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto h-40">{{
              JSON.stringify(envConfig, null, 2)
            }}</pre>
          </div>
        </div>
      </div>

      <!-- Cookie Information -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🍪 Shopify Cookies Debug</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">shopify_Y (Unique Visitor)</h3>
            <p class="text-sm text-gray-600 mb-2">
              365-day persistent visitor identifier
            </p>
            <code class="bg-gray-100 p-2 rounded block text-xs break-all">
              {{ cookies.shopify_Y || "Not set" }}
            </code>
          </div>
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">shopify_S (Session)</h3>
            <p class="text-sm text-gray-600 mb-2">
              30-minute session identifier
            </p>
            <code class="bg-gray-100 p-2 rounded block text-xs break-all">
              {{ cookies.shopify_S || "Not set" }}
            </code>
          </div>
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium mb-2">Other Shopify Cookies</h3>
            <div class="space-y-1">
              <div
                v-for="(value, key) in otherShopifyCookies"
                :key="key"
                class="text-xs"
              >
                <span class="font-medium">{{ key }}:</span>
                {{ value.substring(0, 20) }}...
              </div>
              <div
                v-if="Object.keys(otherShopifyCookies).length === 0"
                class="text-gray-500 text-xs"
              >
                No other Shopify cookies found
              </div>
            </div>
          </div>
        </div>
        <button
          @click="regenerateCookies"
          class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          🔄 Regenerate Shopify Cookies
        </button>
      </div>

      <!-- Live Event Testing -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">
          🧪 Live Shopify Event Testing
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-4">Send Test Events to Shopify</h3>
            <div class="space-y-3">
              <button
                @click="sendTestPageView"
                :disabled="!canSendEvents"
                class="w-full p-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
              >
                📄 Send Page View to Shopify
              </button>
              <button
                @click="sendTestProductView"
                :disabled="!canSendEvents"
                class="w-full p-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 transition-colors"
              >
                🛍️ Send Product View to Shopify
              </button>
              <button
                @click="sendTestAddToCart"
                :disabled="!canSendEvents"
                class="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-300 transition-colors"
              >
                🛒 Send Add to Cart to Shopify
              </button>
            </div>
          </div>
          <div>
            <h3 class="font-medium mb-4">API Response Log</h3>
            <div
              class="bg-gray-100 p-3 rounded max-h-96 overflow-y-auto text-sm space-y-3"
            >
              <div
                v-for="(response, index) in apiResponses"
                :key="index"
                class="p-3 border rounded"
                :class="
                  response.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                "
              >
                <div class="flex justify-between items-start mb-2">
                  <span
                    class="font-medium text-sm"
                    :class="
                      response.success ? 'text-green-800' : 'text-red-800'
                    "
                  >
                    {{ response.success ? "✅" : "❌" }}
                    {{ response.timestamp }}
                  </span>
                  <button
                    v-if="response.data"
                    @click="response.showDetails = !response.showDetails"
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {{ response.showDetails ? "Hide" : "Show" }} Details
                  </button>
                </div>
                <div class="text-sm">{{ response.message }}</div>

                <!-- Debug Details -->
                <div
                  v-if="response.data && response.showDetails"
                  class="mt-3 pt-3 border-t border-gray-200"
                >
                  <div class="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <strong>Event Count:</strong>
                      {{ response.data.eventCount }}
                    </div>
                    <div>
                      <strong>Endpoint:</strong>
                      {{
                        response.data.debug?.endpoint?.includes("monorail-edge")
                          ? "Global Monorail"
                          : "Shop Domain"
                      }}
                    </div>
                  </div>
                  <div class="mt-2 text-xs">
                    <strong>Event IDs:</strong>
                    <div class="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                      {{
                        response.data.debug?.events
                          ?.map((e) => `${e.event_name}: ${e.event_id}`)
                          .join("\n")
                      }}
                    </div>
                  </div>
                  <details class="mt-2">
                    <summary class="cursor-pointer text-xs text-gray-600">
                      Raw Response Data
                    </summary>
                    <pre
                      class="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto"
                      >{{ JSON.stringify(response.data, null, 2) }}</pre
                    >
                  </details>
                </div>
              </div>
              <div
                v-if="apiResponses.length === 0"
                class="text-gray-500 text-center py-8"
              >
                No API responses yet. Send a test event above.
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Analytics Verification Guide -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          ✅ How to Verify Analytics in Shopify
        </h2>
        <div class="prose max-w-none">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 class="text-lg font-medium mb-3">🏪 In Shopify Admin</h3>
              <ol class="list-decimal list-inside space-y-2 text-sm">
                <li>Go to <strong>Analytics → Reports</strong></li>
                <li>Check <strong>Online store sessions</strong></li>
                <li>Look for recent page views and sessions</li>
                <li>Check <strong>Sales by traffic source</strong></li>
                <li>
                  Verify events appear in real-time (may take 5-10 minutes)
                </li>
              </ol>
            </div>
            <div>
              <h3 class="text-lg font-medium mb-3">
                🔍 Developer Tools Verification
              </h3>
              <ol class="list-decimal list-inside space-y-2 text-sm">
                <li>Open Browser DevTools → Network tab</li>
                <li>Filter by "monorail" or "shopify"</li>
                <li>Trigger events on this test page</li>
                <li>Look for POST requests to Shopify endpoints</li>
                <li>Check response status codes (200 = success)</li>
              </ol>
            </div>
          </div>

          <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul class="list-disc list-inside space-y-1 text-sm text-blue-800">
              <li>
                Analytics data may take 5-30 minutes to appear in Shopify Admin
              </li>
              <li>Use browser Network tab to see immediate API responses</li>
              <li>Check Console for any analytics error messages</li>
              <li>Verify cookies are being set properly for tracking</li>
              <li>Test with and without ad blockers to see differences</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";

// Page metadata
definePageMeta({
  title: "Shopify Analytics Debug",
});

// Reactive state
const shopAnalytics = ref({});
const envConfig = ref({});
const cookies = ref({});
const apiResponses = ref([]);
const analytics = ref(null);

// Computed properties
const shopifyConnected = computed(() => !!shopAnalytics.value?.shopId);
const monorailReady = computed(
  () => !!shopAnalytics.value?.shopId && !!envConfig.value?.domain
);
const cookiesSet = computed(
  () => !!(cookies.value.shopify_Y && cookies.value.shopify_S)
);
const privacyApiLoaded = computed(
  () => typeof window !== "undefined" && !!window.Shopify?.customerPrivacy
);
const canSendEvents = computed(
  () => shopifyConnected.value && analytics.value?.canTrack?.value?.()
);

const otherShopifyCookies = computed(() => {
  const result = {};
  Object.keys(cookies.value).forEach((key) => {
    if (
      key.startsWith("shopify_") &&
      !["shopify_Y", "shopify_S"].includes(key)
    ) {
      result[key] = cookies.value[key];
    }
  });
  return result;
});

// Initialize debug data
onMounted(async () => {
  const nuxtApp = useNuxtApp();
  analytics.value = nuxtApp.$analytics;

  // Load shop analytics data
  try {
    const shopData = await $fetch("/api/analytics/shop");
    shopAnalytics.value = shopData;
  } catch (error) {
    console.error("Failed to load shop data:", error);
    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      message: "Failed to load shop data: " + error.message,
    });
  }

  // Get environment config
  const config = useRuntimeConfig();
  envConfig.value = {
    domain: config.public?.shopify?.domain,
    storefrontToken: config.public?.shopify?.storefrontAccessToken
      ? "***set***"
      : "missing",
    analyticsConfig: config.public?.analytics || "missing",
  };

  // Load cookies
  loadCookies();
});

function loadCookies() {
  const cookieObj = {};
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((cookie) => {
      const [name, value] = cookie.trim().split("=");
      if (name && value) {
        cookieObj[name] = value;
      }
    });
  }
  cookies.value = cookieObj;
}

function regenerateCookies() {
  if (analytics.value) {
    // Manually trigger cookie regeneration
    const hasConsent = analytics.value.canTrack.value();
    const domain = envConfig.value.analyticsConfig?.cookieDomain || "";

    if (hasConsent) {
      setCookie("shopify_Y", generateUUID(), 365 * 24 * 60 * 60 * 1000, domain);
      setCookie("shopify_S", generateUUID(), 30 * 60 * 1000, domain);

      setTimeout(() => {
        loadCookies();
        apiResponses.value.unshift({
          timestamp: new Date().toLocaleTimeString(),
          success: true,
          message: "Shopify cookies regenerated successfully",
        });
      }, 100);
    } else {
      apiResponses.value.unshift({
        timestamp: new Date().toLocaleTimeString(),
        success: false,
        message: "Cannot regenerate cookies: consent not granted",
      });
    }
  }
}

async function sendTestPageView() {
  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "page_view_2",
            payload: {
              shopifySalesChannel: "hydrogen",
              shopId: shopAnalytics.value.shopId,
              url: window.location.href,
              hasUserConsent: true,
              test: true,
            },
          },
        ],
      },
    });

    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: true,
      message: `Page view sent successfully - ${
        response.eventCount
      } events, IDs: ${response.debug?.events
        .map((e) => e.event_id.slice(0, 8))
        .join(", ")}`,
      data: response,
    });
  } catch (error) {
    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      message: "Failed to send page view: " + error.message,
    });
  }
}

async function sendTestProductView() {
  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "product_view",
            payload: {
              shopifySalesChannel: "hydrogen",
              shopId: shopAnalytics.value.shopId,
              url: window.location.href,
              hasUserConsent: true,
              pageType: "product",
              resourceId: "gid://shopify/Product/888777666",
              products: [
                {
                  productGid: "gid://shopify/Product/888777666",
                  variantGid: "gid://shopify/ProductVariant/444333222",
                  name: "Debug Test Product",
                  variantName: "Debug Variant",
                  brand: "Debug Brand",
                  price: "99.99",
                  quantity: 1,
                },
              ],
              test: true,
            },
          },
        ],
      },
    });

    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: true,
      message: `Product view sent successfully - ${
        response.eventCount
      } events, IDs: ${response.debug?.events
        .map((e) => e.event_id.slice(0, 8))
        .join(", ")}`,
      data: response,
    });
  } catch (error) {
    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      message: "Failed to send product view: " + error.message,
    });
  }
}

async function sendTestAddToCart() {
  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "add_to_cart",
            payload: {
              shopifySalesChannel: "hydrogen",
              shopId: shopAnalytics.value.shopId,
              url: window.location.href,
              hasUserConsent: true,
              cartId: "gid://shopify/Cart/111222333",
              products: [
                {
                  productGid: "gid://shopify/Product/888777666",
                  variantGid: "gid://shopify/ProductVariant/444333222",
                  name: "Debug Test Product",
                  variantName: "Debug Variant",
                  brand: "Debug Brand",
                  price: "99.99",
                  quantity: 2,
                },
              ],
              test: true,
            },
          },
        ],
      },
    });

    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: true,
      message: `Add to cart sent successfully - ${
        response.eventCount
      } events, IDs: ${response.debug?.events
        .map((e) => e.event_id.slice(0, 8))
        .join(", ")}`,
      data: response,
    });
  } catch (error) {
    apiResponses.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      message: "Failed to send add to cart: " + error.message,
    });
  }
}

function setCookie(name, value, maxAge, domain) {
  const domainStr = domain
    ? `; domain=${domain.startsWith(".") ? domain : "." + domain}`
    : "";
  document.cookie = `${name}=${value}; max-age=${maxAge}; path=/${domainStr}; secure; samesite=lax`;
}

function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
</script>
