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
import { ref, computed, onMounted, nextTick, watch } from "vue";
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
// Local state for toggles (separate from store until user saves)
const analyticsConsent = ref(consentStore.analytics);
const marketingConsent = ref(consentStore.marketing);

// Sync local toggles with store when store changes externally
watch(
  () => [consentStore.analytics, consentStore.marketing],
  ([newAnalytics, newMarketing]) => {
    analyticsConsent.value = newAnalytics;
    marketingConsent.value = newMarketing;
  }
);

// Initialize consent store and check Shopify API
onMounted(() => {
  // Initialize store from localStorage
  consentStore.initializeFromStorage();

  // Sync local toggles with loaded store values
  analyticsConsent.value = consentStore.analytics;
  marketingConsent.value = consentStore.marketing;

  // Set ready after store initialization (with small delay to prevent flash)
  nextTick(() => {
    setTimeout(() => {
      isReady.value = true;
      // Banner ready
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

      // Wait a bit longer to ensure any previous saves have been processed
      setTimeout(() => {
        // Sync current state from Shopify API
        consentStore.syncFromShopifyAPI();

        // Shopify API loaded and state synced
      }, 300); // Give extra time for any pending saves to complete
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

async function acceptAll() {
  // Update local toggles first
  analyticsConsent.value = true;
  marketingConsent.value = true;

  // Update store state (this will dismiss the banner)
  consentStore.acceptAll();

  try {
    // Set consent in Shopify API and wait for confirmation
    const result = await setConsent(consentStore.consentSettings);
    // User accepted all cookies
  } catch (error) {
    console.error(
      "[Cookie Banner] Failed to save accept all to Shopify:",
      error
    );
  }
}

async function rejectAll() {
  // Update local toggles first
  analyticsConsent.value = false;
  marketingConsent.value = false;

  // Update store state (this will dismiss the banner)
  consentStore.rejectAll();

  try {
    // Set consent in Shopify API and wait for confirmation
    const result = await setConsent(consentStore.consentSettings);
    // User rejected all cookies
  } catch (error) {
    console.error(
      "[Cookie Banner] Failed to save reject all to Shopify:",
      error
    );
  }
}

async function savePreferences() {
  // Save local toggle values to store (this will dismiss the banner)
  consentStore.savePreferences({
    analytics: analyticsConsent.value,
    marketing: marketingConsent.value,
    preferences: analyticsConsent.value, // Link to analytics for simplicity
    sale_of_data: marketingConsent.value, // Link to marketing for simplicity
  });

  try {
    // Set consent in Shopify API and wait for confirmation
    const result = await setConsent({
      analytics: analyticsConsent.value,
      marketing: marketingConsent.value,
      preferences: analyticsConsent.value,
      sale_of_data: marketingConsent.value,
    });

    // User saved custom preferences
  } catch (error) {
    console.error(
      "[Cookie Banner] Failed to save preferences to Shopify:",
      error
    );
  }
}

function updateAnalyticsConsent() {
  // Only update the toggle state, don't save or dismiss banner yet
  // The store will be updated via the computed property binding
  // Analytics consent toggled
}

function updateMarketingConsent() {
  // Only update the toggle state, don't save or dismiss banner yet
  // The store will be updated via the computed property binding
  // Marketing consent toggled
}

function setConsent(consent) {
  if (!window.Shopify?.customerPrivacy) {
    console.error("[Cookie Banner] Shopify Customer Privacy API not available");
    return Promise.reject(new Error("Shopify API not available"));
  }

  return new Promise((resolve, reject) => {
    try {
      // Saving consent to Shopify

      // Set consent using Shopify's API
      window.Shopify.customerPrivacy.setTrackingConsent(consent, (result) => {
        if (result?.error) {
          console.error(
            "[Cookie Banner] Shopify consent save failed:",
            result.error
          );
          reject(new Error(result.error));
          return;
        }

        // Consent saved to Shopify successfully

        // Wait a moment for Shopify to process, then verify the save worked
        setTimeout(() => {
          try {
            const savedAnalytics =
              window.Shopify.customerPrivacy.analyticsProcessingAllowed?.() ??
              false;
            const savedMarketing =
              window.Shopify.customerPrivacy.marketingAllowed?.() ?? false;

            // Check Shopify's regional and merchant settings
            const shouldShowBanner =
              window.Shopify.customerPrivacy.shouldShowBanner?.() ?? false;
            const customerRegion =
              window.Shopify.customerPrivacy.getRegion?.() ?? "unknown";
            const currentConsent =
              window.Shopify.customerPrivacy.currentVisitorConsent?.() ?? {};

            // Verified Shopify consent state

            // Check if save actually worked
            const analyticsMatch = savedAnalytics === consent.analytics;
            const marketingMatch = savedMarketing === consent.marketing;

            if (!analyticsMatch || !marketingMatch) {
              // Check for store-level overrides
              const storeOverridesMarketing =
                consent.marketing === false && savedMarketing === true;
              const storeOverridesAnalytics =
                consent.analytics === false && savedAnalytics === true;

              if (storeOverridesMarketing || storeOverridesAnalytics) {
                console.warn(
                  "[Cookie Banner] 🏪 Store-level privacy settings detected!",
                  {
                    message:
                      "Your Shopify store has privacy settings that override user consent choices.",
                    analytics: {
                      sent: consent.analytics,
                      received: savedAnalytics,
                      storeOverride: storeOverridesAnalytics,
                    },
                    marketing: {
                      sent: consent.marketing,
                      received: savedMarketing,
                      storeOverride: storeOverridesMarketing,
                    },
                    possibleCauses: [
                      "Store configured to require marketing consent in your region",
                      "Regional privacy laws overriding user choice",
                      "Merchant settings forcing consent to 'on' for compliance",
                    ],
                    region: customerRegion,
                    recommendation:
                      "Check Shopify Admin → Settings → Customer Privacy → Regional Settings",
                  }
                );

                // Update local store to match what Shopify actually enforces
                consentStore.$patch({
                  analytics: savedAnalytics,
                  marketing: savedMarketing,
                });

                // Updated local store to match Shopify store settings
                resolve({
                  consent,
                  savedAnalytics,
                  savedMarketing,
                  storeOverride: true,
                });
                return;
              }

              console.warn(
                "[Cookie Banner] ⚠️ Shopify save verification failed!",
                {
                  analytics: {
                    sent: consent.analytics,
                    received: savedAnalytics,
                    match: analyticsMatch,
                  },
                  marketing: {
                    sent: consent.marketing,
                    received: savedMarketing,
                    match: marketingMatch,
                  },
                }
              );

              // Try saving again with minimal fields approach
              // Retrying save with minimal consent object
              setTimeout(() => {
                // Try with just the essential fields
                const minimalConsent = {
                  analytics: consent.analytics,
                  marketing: consent.marketing,
                };

                // Retry with minimal consent

                // Call the original Shopify API directly (not our overridden version)
                window.Shopify.customerPrivacy.setTrackingConsent(
                  minimalConsent,
                  (retryResult) => {
                    // Retry save completed

                    // Verify this attempt too
                    setTimeout(() => {
                      const reVerifyAnalytics =
                        window.Shopify.customerPrivacy.analyticsProcessingAllowed?.() ??
                        false;
                      const reVerifyMarketing =
                        window.Shopify.customerPrivacy.marketingAllowed?.() ??
                        false;

                      // Re-verification completed
                    }, 300);
                  }
                );
              }, 100);
            }

            // Update analytics context
            if (analytics.value?.canTrack?.value) {
              const newCanTrack = () => {
                try {
                  return savedAnalytics;
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

            resolve({ consent, savedAnalytics, savedMarketing });
          } catch (verifyError) {
            console.error(
              "[Cookie Banner] Failed to verify consent save:",
              verifyError
            );
            reject(verifyError);
          }
        }, 500); // Give Shopify more time to process the save
      });
    } catch (error) {
      console.error("[Cookie Banner] Failed to set consent:", error);
      reject(error);
    }
  });
}

// Listen for privacy API changes
onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("consentChanged", (event) => {
      // Consent changed event received
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
      currentToggles: {
        analytics: analyticsConsent.value,
        marketing: marketingConsent.value,
      },
      savedConsent: {
        analytics: consentStore.analytics,
        marketing: consentStore.marketing,
      },
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
