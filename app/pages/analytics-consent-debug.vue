<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">
        🔐 Analytics Consent Debug
      </h1>

      <!-- Consent Status -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🎯 Current Consent Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">Privacy API Status</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>API Loaded:</span>
                <span
                  :class="privacyApiLoaded ? 'text-green-600' : 'text-red-600'"
                >
                  {{ privacyApiLoaded ? "✅ Yes" : "❌ No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Analytics Allowed:</span>
                <span
                  :class="analyticsAllowed ? 'text-green-600' : 'text-red-600'"
                >
                  {{ analyticsAllowed ? "✅ Yes" : "❌ No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Marketing Allowed:</span>
                <span
                  :class="marketingAllowed ? 'text-green-600' : 'text-red-600'"
                >
                  {{ marketingAllowed ? "✅ Yes" : "❌ No" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Sale of Data Allowed:</span>
                <span
                  :class="saleOfDataAllowed ? 'text-green-600' : 'text-red-600'"
                >
                  {{ saleOfDataAllowed ? "✅ Yes" : "❌ No" }}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 class="font-medium mb-3">Analytics Context</h3>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Can Track Function:</span>
                <span :class="canTrack ? 'text-green-600' : 'text-red-600'">
                  {{ canTrack ? "✅ Enabled" : "❌ Disabled" }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Privacy API Reference:</span>
                <span
                  :class="
                    customerPrivacyExists ? 'text-green-600' : 'text-red-600'
                  "
                >
                  {{ customerPrivacyExists ? "✅ Set" : "❌ Missing" }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Debug Information -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🔍 Debug Information</h2>
        <div class="space-y-4">
          <div>
            <h3 class="font-medium mb-2">Window.Shopify Object</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto h-32">{{
              JSON.stringify(windowShopify, null, 2)
            }}</pre>
          </div>
          <div>
            <h3 class="font-medium mb-2">Analytics Context CanTrack</h3>
            <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto">{{
              canTrackDebug
            }}</pre>
          </div>
        </div>
      </div>

      <!-- Development Controls -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-xl font-semibold mb-4">🛠️ Development Controls</h2>
        <p class="text-gray-600 mb-4">
          Force consent settings for development and testing:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="forceEnableConsent"
            class="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✅ Force Enable All Consent
          </button>
          <button
            @click="forceDisableConsent"
            class="p-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ❌ Force Disable All Consent
          </button>
          <button
            @click="resetToDefault"
            class="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            🔄 Reset to Default
          </button>
          <button
            @click="testConsentCall"
            class="p-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            🧪 Test Consent Call
          </button>
        </div>
        <div class="mt-4">
          <button
            @click="forceRefreshAnalytics"
            class="w-full p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            🔄 Force Refresh Analytics Context
          </button>
        </div>
      </div>

      <!-- Test Analytics After Consent -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">
          🚀 Test Analytics (After Enabling Consent)
        </h2>
        <p class="text-gray-600 mb-4">
          After enabling consent above, test if Shopify events are sent:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="testShopifyPageView"
            :disabled="!canTrack"
            class="p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            📄 Test Shopify Page View
          </button>
          <button
            @click="testShopifyProductView"
            :disabled="!canTrack"
            class="p-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 transition-colors"
          >
            🛍️ Test Shopify Product View
          </button>
        </div>

        <div class="mt-6">
          <h3 class="font-medium mb-2">Test Results</h3>
          <div class="bg-gray-100 p-3 rounded h-32 overflow-y-auto text-sm">
            <div
              v-for="(result, index) in testResults"
              :key="index"
              class="mb-2"
            >
              <span
                class="font-medium"
                :class="result.success ? 'text-green-600' : 'text-red-600'"
              >
                {{ result.timestamp }}:
              </span>
              {{ result.message }}
            </div>
            <div v-if="testResults.length === 0" class="text-gray-500">
              No test results yet. Enable consent and run tests above.
            </div>
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
  title: "Analytics Consent Debug",
});

// Reactive state
const analytics = ref(null);
const testResults = ref([]);
const windowShopify = ref({});

// Computed properties
const privacyApiLoaded = computed(
  () => typeof window !== "undefined" && !!window.Shopify?.customerPrivacy
);
const canTrack = computed(() => {
  try {
    // Handle both ref structure and direct function assignment
    if (typeof analytics.value?.canTrack === "function") {
      // canTrack is directly a function (current state)
      return analytics.value.canTrack();
    } else if (typeof analytics.value?.canTrack?.value === "function") {
      // canTrack is a ref with .value being the function (correct state)
      return analytics.value.canTrack.value();
    }
    return false;
  } catch (e) {
    console.error("canTrack error:", e);
    return false;
  }
});
const customerPrivacyExists = computed(
  () => !!analytics.value?.customerPrivacy
);

const analyticsAllowed = computed(() => {
  try {
    return (
      window.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.() ?? false
    );
  } catch (e) {
    return false;
  }
});

const marketingAllowed = computed(() => {
  try {
    return window.Shopify?.customerPrivacy?.marketingAllowed?.() ?? false;
  } catch (e) {
    return false;
  }
});

const saleOfDataAllowed = computed(() => {
  try {
    return window.Shopify?.customerPrivacy?.saleOfDataAllowed?.() ?? false;
  } catch (e) {
    return false;
  }
});

const canTrackDebug = computed(() => {
  if (!analytics.value?.canTrack) {
    return "Analytics context not available";
  }

  // Handle both ref structure and direct function assignment
  if (typeof analytics.value.canTrack === "function") {
    try {
      const result = analytics.value.canTrack();
      return `canTrack() returns: ${result} [Direct function]`;
    } catch (e) {
      return `canTrack() error: ${e.message} [Direct function]`;
    }
  } else if (typeof analytics.value.canTrack.value === "function") {
    try {
      const result = analytics.value.canTrack.value();
      return `canTrack() returns: ${result} [Ref function]`;
    } catch (e) {
      return `canTrack() error: ${e.message} [Ref function]`;
    }
  } else if (!analytics.value.canTrack.value) {
    return `canTrack.value is null/undefined (type: ${typeof analytics.value
      .canTrack.value})`;
  } else {
    return `canTrack structure is unexpected (canTrack type: ${typeof analytics
      .value.canTrack}, canTrack.value type: ${typeof analytics.value.canTrack
      .value})`;
  }
});

// Initialize
onMounted(() => {
  const nuxtApp = useNuxtApp();
  analytics.value = nuxtApp.$analytics;

  // Capture window.Shopify for debugging
  if (typeof window !== "undefined") {
    windowShopify.value = {
      exists: !!window.Shopify,
      customerPrivacy: {
        exists: !!window.Shopify?.customerPrivacy,
        methods: window.Shopify?.customerPrivacy
          ? Object.keys(window.Shopify.customerPrivacy)
          : [],
      },
    };
  }

  console.log("🔐 Consent Debug: Analytics context:", analytics.value);
  console.log("🔐 Consent Debug: canTrack ref:", analytics.value?.canTrack);
  console.log(
    "🔐 Consent Debug: canTrack.value:",
    analytics.value?.canTrack?.value
  );
  console.log(
    "🔐 Consent Debug: canTrack type:",
    typeof analytics.value?.canTrack?.value
  );
  if (analytics.value?.canTrack?.value) {
    try {
      console.log(
        "🔐 Consent Debug: canTrack() result:",
        analytics.value.canTrack.value()
      );
    } catch (e) {
      console.log("🔐 Consent Debug: canTrack() error:", e);
    }
  }
  console.log("🔐 Consent Debug: Window.Shopify:", window.Shopify);
});

// Development controls
function forceEnableConsent() {
  if (typeof window !== "undefined") {
    // Override the privacy API with enabled consent
    if (!window.Shopify) window.Shopify = {};

    window.Shopify.customerPrivacy = {
      analyticsProcessingAllowed: () => true,
      marketingAllowed: () => true,
      saleOfDataAllowed: () => true,
      setTrackingConsent: (consent, callback) => {
        console.log("🔐 Mock consent set:", consent);
        if (callback) callback();
      },
    };

    // Update analytics context - force the canTrack function to update
    if (analytics.value) {
      analytics.value.customerPrivacy = window.Shopify.customerPrivacy;

      // Force update the canTrack function
      analytics.value.canTrack.value = () => {
        try {
          return (
            window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() ??
            true
          );
        } catch (e) {
          return true; // Force true for development
        }
      };

      // Trigger reactivity by calling it
      console.log("🔐 New canTrack result:", analytics.value.canTrack.value());
    }

    addTestResult(true, "Consent forced to ENABLED for development");

    // Force reactivity update
    setTimeout(() => {
      windowShopify.value = { ...windowShopify.value, updated: Date.now() };
    }, 100);
  }
}

function forceDisableConsent() {
  if (typeof window !== "undefined") {
    // Override the privacy API with disabled consent
    if (!window.Shopify) window.Shopify = {};

    window.Shopify.customerPrivacy = {
      analyticsProcessingAllowed: () => false,
      marketingAllowed: () => false,
      saleOfDataAllowed: () => false,
      setTrackingConsent: (consent, callback) => {
        console.log("🔐 Mock consent set:", consent);
        if (callback) callback();
      },
    };

    // Update analytics context
    if (analytics.value) {
      analytics.value.customerPrivacy = window.Shopify.customerPrivacy;

      // Force update the canTrack function
      analytics.value.canTrack.value = () => {
        try {
          return (
            window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() ??
            false
          );
        } catch (e) {
          return false;
        }
      };

      // Trigger reactivity by calling it
      console.log("🔐 New canTrack result:", analytics.value.canTrack.value());
    }

    addTestResult(true, "Consent forced to DISABLED for testing");

    // Force reactivity update
    setTimeout(() => {
      windowShopify.value = { ...windowShopify.value, updated: Date.now() };
    }, 100);
  }
}

function resetToDefault() {
  // Reload the page to reset everything
  window.location.reload();
}

function testConsentCall() {
  try {
    const analyticsResult =
      window.Shopify?.customerPrivacy?.analyticsProcessingAllowed?.();
    const marketingResult =
      window.Shopify?.customerPrivacy?.marketingAllowed?.();
    const saleResult = window.Shopify?.customerPrivacy?.saleOfDataAllowed?.();

    addTestResult(
      true,
      `Direct API calls - Analytics: ${analyticsResult}, Marketing: ${marketingResult}, Sale: ${saleResult}`
    );
  } catch (error) {
    addTestResult(false, `Error calling privacy API: ${error.message}`);
  }
}

// Test functions
async function testShopifyPageView() {
  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "page_view_2",
            payload: {
              shopifySalesChannel: "hydrogen",
              shopId: "gid://shopify/Shop/87662625086", // From your debug data
              url: window.location.href,
              hasUserConsent: true,
              test: true,
              debugSource: "consent-debug-page",
            },
          },
        ],
      },
    });

    addTestResult(true, "Page view successfully sent to Shopify!");
  } catch (error) {
    addTestResult(false, `Failed to send page view: ${error.message}`);
  }
}

async function testShopifyProductView() {
  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "product_view",
            payload: {
              shopifySalesChannel: "hydrogen",
              shopId: "gid://shopify/Shop/87662625086",
              url: window.location.href,
              hasUserConsent: true,
              pageType: "product",
              resourceId: "gid://shopify/Product/987654321",
              products: [
                {
                  productGid: "gid://shopify/Product/987654321",
                  variantGid: "gid://shopify/ProductVariant/555444333",
                  name: "Consent Test Product",
                  variantName: "Test Variant",
                  brand: "Debug Brand",
                  price: "99.99",
                  quantity: 1,
                },
              ],
              test: true,
              debugSource: "consent-debug-page",
            },
          },
        ],
      },
    });

    addTestResult(true, "Product view successfully sent to Shopify!");
  } catch (error) {
    addTestResult(false, `Failed to send product view: ${error.message}`);
  }
}

function addTestResult(success, message) {
  testResults.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    success,
    message,
  });
}

// Force refresh analytics context
function forceRefreshAnalytics() {
  if (!analytics.value) {
    addTestResult(false, "Analytics context not available");
    return;
  }

  // Handle both ref structure and direct function
  let currentResult;
  if (typeof analytics.value.canTrack === "function") {
    currentResult = analytics.value.canTrack();
    addTestResult(
      true,
      `Analytics refreshed - canTrack: ${currentResult} [Direct function]`
    );
  } else if (typeof analytics.value.canTrack?.value === "function") {
    currentResult = analytics.value.canTrack.value();
    addTestResult(
      true,
      `Analytics refreshed - canTrack: ${currentResult} [Ref function]`
    );
  } else {
    addTestResult(
      false,
      `canTrack function not available - canTrack type: ${typeof analytics.value
        .canTrack}, canTrack.value type: ${typeof analytics.value.canTrack
        ?.value}`
    );
    return;
  }

  console.log("🔄 Analytics refresh - canTrack:", currentResult);

  // Force Vue reactivity update
  analytics.value = { ...analytics.value };
}
</script>
