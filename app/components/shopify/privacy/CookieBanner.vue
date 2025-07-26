<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="transform translate-y-full opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform translate-y-full opacity-0"
    >
      <div
        v-if="isReady && showBanner"
        class="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        role="dialog"
        aria-labelledby="cookie-banner-title"
        aria-describedby="cookie-banner-description"
      >
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div
            class="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0"
          >
            <!-- Content -->
            <div class="flex-1">
              <h3
                id="cookie-banner-title"
                class="text-sm font-medium text-gray-900 mb-2"
              >
                🍪 We use cookies to enhance your experience
              </h3>
              <p
                id="cookie-banner-description"
                class="text-sm text-gray-600 leading-relaxed"
              >
                We use cookies and similar technologies to improve your browsing
                experience, analyze site traffic, and provide personalized
                content. You can choose which categories of cookies to accept.
                <button
                  @click="showDetails = !showDetails"
                  class="text-blue-600 hover:text-blue-800 underline ml-1"
                  :aria-expanded="showDetails"
                  aria-controls="cookie-details"
                >
                  {{ showDetails ? "Show less" : "Learn more" }}
                </button>
              </p>

              <!-- Detailed Information -->
              <Transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="max-h-0 opacity-0"
                enter-to-class="max-h-96 opacity-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="max-h-96 opacity-100"
                leave-to-class="max-h-0 opacity-0"
              >
                <div
                  v-if="showDetails"
                  id="cookie-details"
                  class="mt-3 space-y-3 overflow-hidden"
                >
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <!-- Essential Cookies -->
                    <div class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-900">Essential</h4>
                        <span
                          class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                          >Required</span
                        >
                      </div>
                      <p class="text-gray-600">
                        Necessary for basic site functionality, security, and
                        user authentication.
                      </p>
                    </div>

                    <!-- Analytics Cookies -->
                    <div class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-900">Analytics</h4>
                        <label class="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            v-model="analyticsConsent"
                            class="sr-only"
                            @change="updateAnalyticsConsent"
                          />
                          <div
                            class="toggle-checkbox w-8 h-4 bg-gray-300 rounded-full shadow-inner transition-colors duration-200"
                            :class="
                              analyticsConsent ? 'bg-blue-600' : 'bg-gray-300'
                            "
                          >
                            <div
                              class="toggle-dot absolute w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 transform"
                              :class="
                                analyticsConsent
                                  ? 'translate-x-4'
                                  : 'translate-x-0'
                              "
                            ></div>
                          </div>
                        </label>
                      </div>
                      <p class="text-gray-600">
                        Help us understand how visitors interact with our
                        website.
                      </p>
                    </div>

                    <!-- Marketing Cookies -->
                    <div class="p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center justify-between mb-2">
                        <h4 class="font-medium text-gray-900">Marketing</h4>
                        <label class="relative inline-flex items-center">
                          <input
                            type="checkbox"
                            v-model="marketingConsent"
                            class="sr-only"
                            @change="updateMarketingConsent"
                          />
                          <div
                            class="toggle-checkbox w-8 h-4 bg-gray-300 rounded-full shadow-inner transition-colors duration-200"
                            :class="
                              marketingConsent ? 'bg-blue-600' : 'bg-gray-300'
                            "
                          >
                            <div
                              class="toggle-dot absolute w-3 h-3 bg-white rounded-full shadow transition-transform duration-200 transform"
                              :class="
                                marketingConsent
                                  ? 'translate-x-4'
                                  : 'translate-x-0'
                              "
                            ></div>
                          </div>
                        </label>
                      </div>
                      <p class="text-gray-600">
                        Enable personalized ads and marketing communications.
                      </p>
                    </div>
                  </div>
                </div>
              </Transition>
            </div>

            <!-- Actions -->
            <div
              class="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3 lg:ml-6"
            >
              <button
                @click="rejectAll"
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                Reject All
              </button>
              <button
                v-if="showDetails"
                @click="savePreferences"
                class="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Save Preferences
              </button>
              <button
                @click="acceptAll"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { useConsentStore } from "~/stores/consent";

// Get consent store and analytics context
const consentStore = useConsentStore();
const analytics = useState("analytics");

// Reactive banner state
const showDetails = ref(false);
const isReady = ref(false);

// Computed properties from store
const showBanner = computed({
  get: () => consentStore.shouldShowBanner,
  set: (value) => {
    if (value) {
      // Reset consent to show banner again
      consentStore.reset();
    } else {
      // Hide banner by marking as dismissed (but don't change consent)
      consentStore.$patch({ bannerDismissed: true });
    }
  },
});
const analyticsConsent = computed({
  get: () => consentStore.analytics,
  set: (value) => (consentStore.analytics = value),
});
const marketingConsent = computed({
  get: () => consentStore.marketing,
  set: (value) => (consentStore.marketing = value),
});

// Initialize consent store and check Shopify API
onMounted(() => {
  // Initialize store from localStorage
  consentStore.initializeFromStorage();

  // Set ready after store initialization (with small delay to prevent flash)
  nextTick(() => {
    setTimeout(() => {
      isReady.value = true;
      console.log("[Cookie Banner] Ready - banner cloaking disabled");
    }, 100);
  });

  // Small delay to ensure Shopify Privacy API is loaded, then sync
  setTimeout(checkShopifyAPI, 500);
});

function checkShopifyAPI() {
  // Wait for Shopify Customer Privacy API to load
  const checkInterval = setInterval(() => {
    if (window.Shopify?.customerPrivacy) {
      clearInterval(checkInterval);

      // Sync current state from Shopify API
      consentStore.syncFromShopifyAPI();

      console.log("[Cookie Banner] Shopify API loaded, state synced:", {
        shouldShowBanner: consentStore.shouldShowBanner,
        hasDecision: consentStore.hasConsentDecision,
        analytics: consentStore.analytics,
        marketing: consentStore.marketing,
      });
    }
  }, 100);

  // Fallback: Log warning after 10 seconds if API doesn't load
  setTimeout(() => {
    clearInterval(checkInterval);
    if (!window.Shopify?.customerPrivacy) {
      console.warn("[Cookie Banner] Shopify Customer Privacy API not loaded");
    }
  }, 10000);
}

function acceptAll() {
  // Update store state
  consentStore.acceptAll();

  // Set consent in Shopify API
  setConsent(consentStore.consentSettings);

  console.log("[Cookie Banner] User accepted all cookies");
}

function rejectAll() {
  // Update store state
  consentStore.rejectAll();

  // Set consent in Shopify API
  setConsent(consentStore.consentSettings);

  console.log("[Cookie Banner] User rejected all cookies");
}

function savePreferences() {
  // Save preferences to store
  consentStore.savePreferences({
    analytics: analyticsConsent.value,
    marketing: marketingConsent.value,
    preferences: analyticsConsent.value, // Link to analytics for simplicity
    sale_of_data: marketingConsent.value, // Link to marketing for simplicity
  });

  // Set consent in Shopify API
  setConsent(consentStore.consentSettings);

  console.log("[Cookie Banner] User saved custom preferences:", {
    analytics: analyticsConsent.value,
    marketing: marketingConsent.value,
  });
}

function updateAnalyticsConsent() {
  // Real-time update without saving (until user clicks Save)
  console.log(
    "[Cookie Banner] Analytics consent toggled:",
    analyticsConsent.value
  );
}

function updateMarketingConsent() {
  // Real-time update without saving (until user clicks Save)
  console.log(
    "[Cookie Banner] Marketing consent toggled:",
    marketingConsent.value
  );
}

function setConsent(consent) {
  if (!window.Shopify?.customerPrivacy) {
    console.error("[Cookie Banner] Shopify Customer Privacy API not available");
    return;
  }

  try {
    // Set consent using Shopify's API
    window.Shopify.customerPrivacy.setTrackingConsent(consent, () => {
      console.log("[Cookie Banner] Consent updated successfully");

      // Update analytics context
      if (analytics.value?.canTrack?.value) {
        // Trigger a re-evaluation of the canTrack function
        const newCanTrack = () => {
          try {
            return (
              window.Shopify?.customerPrivacy?.analyticsProcessingAllowed() ??
              false
            );
          } catch (e) {
            return false;
          }
        };
        analytics.value.canTrack.value = newCanTrack;

        console.log(
          "[Cookie Banner] Analytics context updated, canTrack:",
          newCanTrack()
        );
      }

      // Dispatch a consent change event for other components
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("consentChanged", {
            detail: { consent, timestamp: Date.now() },
          })
        );
      }
    });
  } catch (error) {
    console.error("[Cookie Banner] Failed to set consent:", error);
  }
}

// Listen for privacy API changes
onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("consentChanged", (event) => {
      console.log("[Cookie Banner] Consent changed:", event.detail);
    });
  }
});

// Expose functions for debugging
if (process.dev) {
  window.__cookieBanner = {
    showBanner: () => {
      isReady.value = true;
      showBanner.value = true;
    },
    hideBanner: () => (showBanner.value = false),
    toggleReady: () => (isReady.value = !isReady.value),
    acceptAll,
    rejectAll,
    checkStatus: checkShopifyAPI,
    getState: () => ({
      isReady: isReady.value,
      showBanner: showBanner.value,
      shouldShowBanner: consentStore.shouldShowBanner,
    }),
  };
}
</script>

<style scoped>
.toggle-checkbox {
  position: relative;
}

.toggle-dot {
  top: 2px;
  left: 2px;
}

/* Smooth transitions for toggle */
.toggle-checkbox,
.toggle-dot {
  transition: all 0.2s ease-in-out;
}
</style>
