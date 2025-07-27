<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold mb-6">🍪 Cookie Banner Demo</h1>

        <div class="space-y-6">
          <!-- Current Status -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-3 text-blue-900">
              📊 Current Banner State
            </h2>
            <p class="text-xs text-blue-700 mb-3">
              Shows live toggle state (may not be saved yet)
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Analytics Allowed:</span>
                    <span
                      :class="
                        analyticsAllowed ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ analyticsAllowed ? "✅ Yes" : "❌ No" }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>Marketing Allowed:</span>
                    <span
                      :class="
                        marketingAllowed ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ marketingAllowed ? "✅ Yes" : "❌ No" }}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span>Sale of Data Allowed:</span>
                    <span
                      :class="
                        saleOfDataAllowed ? 'text-green-600' : 'text-red-600'
                      "
                    >
                      {{ saleOfDataAllowed ? "✅ Yes" : "❌ No" }}
                    </span>
                  </div>
                  <div class="flex justify-between">
                    <span>Analytics Tracking:</span>
                    <span :class="canTrack ? 'text-green-600' : 'text-red-600'">
                      {{ canTrack ? "✅ Active" : "❌ Blocked" }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Demo Controls -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-3">🎮 Demo Controls</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                @click="showCookieBanner"
                class="p-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                🍪 Show Cookie Banner
              </button>
              <button
                @click="clearConsent"
                class="p-3 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
              >
                🔄 Reset Consent
              </button>
              <button
                @click="refreshStatus"
                class="p-3 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                📊 Refresh Status
              </button>
            </div>
          </div>

          <!-- Information -->
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-3 text-yellow-900">
              📋 How It Works
            </h2>
            <div class="space-y-3 text-sm text-yellow-800">
              <div>
                <strong>1. First Visit:</strong> The cookie banner appears at
                the bottom of the page
              </div>
              <div>
                <strong>2. User Choice:</strong> Users can accept all, reject
                all, or customize preferences
              </div>
              <div>
                <strong>3. Analytics Integration:</strong> Analytics tracking
                respects the user's consent
              </div>
              <div>
                <strong>4. Persistence:</strong> Choices are saved and respected
                across sessions
              </div>
            </div>
          </div>

          <!-- Test Analytics -->
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 class="text-lg font-semibold mb-3 text-green-900">
              🧪 Test Analytics
            </h2>
            <p class="text-sm text-green-800 mb-3">
              Send a test analytics event to verify tracking works with current
              consent:
            </p>
            <button
              @click="sendTestEvent"
              :disabled="!canTrack"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              📊 Send Test Analytics Event
            </button>
            <div
              v-if="testEventResult"
              class="mt-3 p-3 bg-white rounded border text-sm"
            >
              <strong>Test Result:</strong> {{ testEventResult }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useConsentStore } from "~/stores/consent";

const analyticsAllowed = ref(false);
const marketingAllowed = ref(false);
const saleOfDataAllowed = ref(false);
// Import consent store for direct reactivity
const consentStore = useConsentStore();

// Reactive canTrack that updates automatically
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

// Load status on mount, then only refresh manually
onMounted(() => {
  refreshStatus();
});

// Watch consent store for reactive updates (without spamming logs)
watch(
  () => [consentStore.analytics, consentStore.marketing],
  ([newAnalytics, newMarketing]) => {
    // Update display values reactively
    analyticsAllowed.value = newAnalytics;
    marketingAllowed.value = newMarketing;
  }
);
const testEventResult = ref("");

// Get analytics context
const analytics = useState("analytics");

onMounted(() => {
  refreshStatus();

  // Listen for consent changes
  if (typeof window !== "undefined") {
    window.addEventListener("consentChanged", () => {
      setTimeout(refreshStatus, 100); // Small delay for API to update
    });
  }
});

function refreshStatus() {
  if (typeof window !== "undefined") {
    // Get current banner toggle state if available
    const bannerState = window.__cookieBanner?.getState?.();

    if (bannerState?.currentToggles) {
      // Show current banner toggle state (live, may not be saved yet)
      analyticsAllowed.value = bannerState.currentToggles.analytics;
      marketingAllowed.value = bannerState.currentToggles.marketing;
    } else if (window.Shopify?.customerPrivacy) {
      // Fallback to Shopify API for saved state
      analyticsAllowed.value =
        window.Shopify.customerPrivacy.analyticsProcessingAllowed?.() ?? false;
      marketingAllowed.value =
        window.Shopify.customerPrivacy.marketingAllowed?.() ?? false;
    }

    // Sale of data always from Shopify API (not in our toggle system)
    if (window.Shopify?.customerPrivacy) {
      saleOfDataAllowed.value =
        window.Shopify.customerPrivacy.saleOfDataAllowed?.() ?? false;
    }

    // Only log when manually refreshed (not auto-spam)
    if (console.groupCollapsed) {
      console.groupCollapsed("[Cookie Demo] Status refreshed");
      console.log("Analytics:", analyticsAllowed.value ? "✅" : "❌");
      console.log("Marketing:", marketingAllowed.value ? "✅" : "❌");
      console.log("Can Track:", canTrack.value ? "✅" : "❌");
      console.log(
        "Source:",
        bannerState?.currentToggles ? "banner-toggles" : "shopify-api"
      );
      console.groupEnd();
    }
  } else {
    console.warn(
      "[Cookie Demo] Neither banner state nor Shopify API available"
    );
  }
}

function showCookieBanner() {
  if (typeof window !== "undefined" && window.__cookieBanner) {
    window.__cookieBanner.showBanner();
    // Cookie banner shown manually
  } else {
    console.warn("[Cookie Demo] Cookie banner controls not available");
  }
}

function clearConsent() {
  if (typeof window !== "undefined" && window.Shopify?.customerPrivacy) {
    // Clear consent to show banner again
    window.Shopify.customerPrivacy.setTrackingConsent(
      {
        analytics: false,
        marketing: false,
        preferences: false,
        sale_of_data: false,
      },
      () => {
        // Consent cleared
        setTimeout(() => {
          refreshStatus();
          showCookieBanner();
        }, 100);
      }
    );
  }
}

async function sendTestEvent() {
  if (!canTrack.value) {
    testEventResult.value = "❌ Analytics tracking is disabled by user consent";
    return;
  }

  try {
    const response = await $fetch("/api/analytics/shopify", {
      method: "POST",
      body: {
        events: [
          {
            eventName: "page_view_2",
            payload: {
              shopifySalesChannel: "nitrogen-debug",
              shopId: "gid://shopify/Shop/87662625086",
              acceptedLanguage: "EN",
              currency: "EUR",
              hydrogenSubchannelId: "0",
              hasUserConsent: true,
              url: window.location.href,
              path: "/cookie-banner-demo",
              referrer: "cookie-demo-page",
              pageType: "page",
              isTestEvent: true,
              testSource: "cookie-banner-demo",
              testCampaign: "consent_test",
            },
          },
        ],
      },
    });

    testEventResult.value = `✅ Event sent successfully! Event ID: ${response.debug?.events?.[0]?.event_id?.slice(
      0,
      8
    )}...`;
    // Test event sent
  } catch (error) {
    testEventResult.value = `❌ Failed to send event: ${error.message}`;
    console.error("[Cookie Demo] Test event failed:", error);
  }
}

useHead({
  title: "Cookie Banner Demo",
});
</script>
