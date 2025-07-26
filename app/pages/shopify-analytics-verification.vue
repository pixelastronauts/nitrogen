<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-lg shadow p-6">
        <h1 class="text-2xl font-bold mb-6">
          🔍 Shopify Analytics Verification
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Bulk Test Section -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">
              📊 Send Test Batch (Easy to Spot)
            </h2>
            <p class="text-sm text-gray-600">
              Send multiple events at once to create a clear spike in your
              Shopify Analytics
            </p>

            <div class="space-y-3">
              <button
                @click="sendTestBatch"
                :disabled="sending"
                class="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                🚀 Send 5 Collection View Events
                <div v-if="sending" class="text-xs mt-1">Sending...</div>
                <div class="text-xs mt-1 opacity-75">
                  UTM: analytics-test | Source: nitrogen-debug
                </div>
              </button>

              <button
                @click="sendMixedBatch"
                :disabled="sending"
                class="w-full p-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                🎯 Send Mixed Event Batch (5 events)
                <div v-if="sending" class="text-xs mt-1">Sending...</div>
                <div class="text-xs mt-1 opacity-75">
                  UTM: mixed-test | Source: nitrogen-debug
                </div>
              </button>

              <button
                @click="sendUTMTest"
                :disabled="sending"
                class="w-full p-3 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                🎯 Send UTM Tagged Events
                <div v-if="sending" class="text-xs mt-1">Sending...</div>
                <div class="text-xs mt-1 opacity-75">
                  Campaign: debug_session | Medium: test
                </div>
              </button>
            </div>

            <div
              v-if="lastBatchInfo"
              class="p-3 bg-green-50 border border-green-200 rounded"
            >
              <div class="text-sm font-medium text-green-800">
                ✅ Batch Sent Successfully!
              </div>
              <div class="text-xs text-green-700 mt-1">
                {{ lastBatchInfo.count }} events sent at
                {{ lastBatchInfo.time }}
              </div>
              <div class="text-xs text-green-600 mt-1 font-mono">
                Event IDs: {{ lastBatchInfo.eventIds.join(", ") }}
              </div>
            </div>
          </div>

          <!-- Filtering Options -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">🔍 Test Event Filtering</h2>
            <div
              class="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm"
            >
              <div class="font-medium text-yellow-800 mb-2">
                🚨 Live Site Protection
              </div>
              <div class="text-yellow-700 space-y-1">
                <div>
                  • <strong>UTM Campaign:</strong>
                  <code>debug_session_{{ generateSessionId() }}</code>
                </div>
                <div>
                  • <strong>Traffic Source:</strong> <code>nitrogen-debug</code>
                </div>
                <div>
                  • <strong>Test Flag:</strong> <code>test_event: true</code>
                </div>
                <div>
                  • <strong>Referrer:</strong>
                  <code>analytics-verification-page</code>
                </div>
              </div>
            </div>
          </div>

          <!-- Where to Look -->
          <div class="space-y-4">
            <h2 class="text-lg font-semibold">👀 Where to Check in Shopify</h2>

            <div class="space-y-3">
              <div class="p-3 border rounded">
                <div class="font-medium text-sm">🔴 Live View (2-5 min)</div>
                <div class="text-xs text-gray-600">Analytics → Live View</div>
                <div class="text-xs text-gray-500">Look for session spikes</div>
              </div>

              <div class="p-3 border rounded">
                <div class="font-medium text-sm">
                  📈 Sessions Report (5-15 min)
                </div>
                <div class="text-xs text-gray-600">
                  Analytics → Reports → Online store sessions
                </div>
                <div class="text-xs text-gray-500">
                  Check page view increases
                </div>
              </div>

              <div class="p-3 border rounded">
                <div class="font-medium text-sm">
                  🎯 Behavior Reports (15-30 min)
                </div>
                <div class="text-xs text-gray-600">
                  Analytics → Reports → Behavior
                </div>
                <div class="text-xs text-gray-500">Detailed page analytics</div>
              </div>

              <div class="p-3 border rounded border-yellow-300 bg-yellow-50">
                <div class="font-medium text-sm text-yellow-800">
                  🔍 Filter Test Events
                </div>
                <div class="text-xs text-yellow-700 space-y-1">
                  <div>• Traffic Source: <strong>nitrogen-debug</strong></div>
                  <div>• UTM Campaign: <strong>debug_session_*</strong></div>
                  <div>
                    • Referrer: <strong>analytics-verification-page</strong>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div class="font-medium text-blue-800 text-sm">💡 Pro Tip</div>
              <div class="text-xs text-blue-700">
                After sending the batch above, wait 5-10 minutes then check
                "Online store sessions" for a spike in activity around the
                current time.
              </div>
            </div>
          </div>
        </div>

        <!-- Event Log -->
        <div v-if="eventLog.length > 0" class="mt-8">
          <h3 class="font-semibold mb-3">📝 Event History</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="(event, index) in eventLog"
              :key="index"
              class="p-2 bg-gray-50 rounded text-xs"
            >
              <div class="font-medium">
                {{ event.timestamp }} - {{ event.type }} ({{ event.count }}
                events)
              </div>
              <div class="text-gray-600 font-mono">
                {{ event.eventIds.slice(0, 3).join(", ")
                }}{{ event.eventIds.length > 3 ? "..." : "" }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const sending = ref(false);
const lastBatchInfo = ref(null);
const eventLog = ref([]);

const analytics = useState("analytics");

// Generate unique session ID for filtering
const sessionId = ref(
  Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
);

function generateSessionId() {
  return sessionId.value;
}

// Create UTM-tagged URL for better tracking
function createTestURL(
  utmCampaign,
  utmSource = "nitrogen-debug",
  utmMedium = "test"
) {
  // Use a production-like domain for better Shopify analytics tracking
  const baseUrl = window.location.origin.includes("localhost")
    ? "https://your-shop.myshopify.com/analytics-verification" // Replace with your actual shop domain
    : window.location.origin + "/analytics-verification";

  return `${baseUrl}?utm_campaign=${utmCampaign}&utm_source=${utmSource}&utm_medium=${utmMedium}&utm_content=debug&test_session=${sessionId.value}`;
}

async function sendTestBatch() {
  sending.value = true;

  try {
    const events = [];
    const eventIds = [];

    // Create 5 collection view events
    for (let i = 0; i < 5; i++) {
      const response = await $fetch("/api/analytics/shopify", {
        method: "POST",
        body: {
          events: [
            {
              eventName: "collection_view",
              payload: {
                shopifySalesChannel: "nitrogen-debug",
                shopId: "gid://shopify/Shop/87662625086",
                acceptedLanguage: "EN",
                currency: "EUR",
                hydrogenSubchannelId: "0",
                hasUserConsent: true,
                url: createTestURL(
                  `analytics_test_${sessionId.value}`,
                  "nitrogen-debug",
                  "batch-test"
                ),
                path: `/verification-test-${i}`,
                referrer: "analytics-verification-page",
                pageType: "collection",
                resourceId: `gid://shopify/Collection/${123456789 + i}`,
                collectionHandle: `test-collection-${i}`,
                collectionId: `gid://shopify/Collection/${123456789 + i}`,
                // Test event flags for filtering
                isTestEvent: true,
                testSource: "batch-collection-test",
                testCampaign: `debug_session_${sessionId.value}`,
              },
            },
          ],
        },
      });

      if (response.debug?.events) {
        eventIds.push(
          ...response.debug.events.map((e) => e.event_id.slice(0, 8))
        );
      }
    }

    lastBatchInfo.value = {
      count: 5,
      time: new Date().toLocaleTimeString(),
      eventIds: eventIds,
    };

    eventLog.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      type: "Collection View Batch",
      count: 5,
      eventIds: eventIds,
    });
  } catch (error) {
    console.error("Failed to send batch:", error);
  } finally {
    sending.value = false;
  }
}

async function sendMixedBatch() {
  sending.value = true;

  try {
    const eventTypes = [
      { type: "page_view_2", name: "Page View" },
      { type: "collection_view", name: "Collection View" },
      { type: "product_view", name: "Product View" },
      { type: "search_view", name: "Search View" },
      { type: "collection_view", name: "Collection View" },
    ];

    const eventIds = [];

    for (let i = 0; i < eventTypes.length; i++) {
      const eventType = eventTypes[i];

      const basePayload = {
        shopifySalesChannel: "hydrogen",
        shopId: "gid://shopify/Shop/87662625086",
        acceptedLanguage: "EN",
        currency: "EUR",
        hydrogenSubchannelId: "0",
        hasUserConsent: true,
        url: window.location.href,
        path: `/verification-test-${i}`,
      };

      let payload = { ...basePayload };

      if (eventType.type === "collection_view") {
        payload = {
          ...payload,
          pageType: "collection",
          resourceId: `gid://shopify/Collection/${555666777 + i}`,
          collectionHandle: `mixed-test-collection-${i}`,
          collectionId: `gid://shopify/Collection/${555666777 + i}`,
        };
      } else if (eventType.type === "product_view") {
        payload = {
          ...payload,
          pageType: "product",
          resourceId: `gid://shopify/Product/${999888777 + i}`,
          products: [
            {
              id: `gid://shopify/Product/${999888777 + i}`,
              title: `Mixed Test Product ${i}`,
              vendor: "Test Vendor",
              price: "99.99",
            },
          ],
        };
      } else if (eventType.type === "search_view") {
        payload = {
          ...payload,
          pageType: "search",
          searchTerm: `test query ${i}`,
        };
      }

      const response = await $fetch("/api/analytics/shopify", {
        method: "POST",
        body: {
          events: [
            {
              eventName: eventType.type,
              payload: payload,
            },
          ],
        },
      });

      if (response.debug?.events) {
        eventIds.push(
          ...response.debug.events.map((e) => e.event_id.slice(0, 8))
        );
      }
    }

    lastBatchInfo.value = {
      count: 5,
      time: new Date().toLocaleTimeString(),
      eventIds: eventIds,
    };

    eventLog.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      type: "Mixed Event Batch",
      count: 5,
      eventIds: eventIds,
    });
  } catch (error) {
    console.error("Failed to send mixed batch:", error);
  } finally {
    sending.value = false;
  }
}

async function sendUTMTest() {
  sending.value = true;

  try {
    const utmCampaign = `debug_session_${sessionId.value}`;
    const eventIds = [];

    // Send 3 different events with strong UTM tracking
    const testEvents = [
      {
        type: "page_view_2",
        path: "/utm-test-page-view",
        pageType: "page",
        utm_content: "page-view-test",
      },
      {
        type: "collection_view",
        path: "/utm-test-collection",
        pageType: "collection",
        resourceId: "gid://shopify/Collection/777888999",
        collectionHandle: "utm-test-collection",
        collectionId: "gid://shopify/Collection/777888999",
        utm_content: "collection-view-test",
      },
      {
        type: "product_view",
        path: "/utm-test-product",
        pageType: "product",
        resourceId: "gid://shopify/Product/666555444",
        utm_content: "product-view-test",
        products: [
          {
            id: "gid://shopify/Product/666555444",
            title: "UTM Test Product",
            vendor: "Debug Vendor",
            price: "199.99",
          },
        ],
      },
    ];

    for (let i = 0; i < testEvents.length; i++) {
      const event = testEvents[i];

      const response = await $fetch("/api/analytics/shopify", {
        method: "POST",
        body: {
          events: [
            {
              eventName: event.type,
              payload: {
                shopifySalesChannel: "nitrogen-debug",
                shopId: "gid://shopify/Shop/87662625086",
                acceptedLanguage: "EN",
                currency: "EUR",
                hydrogenSubchannelId: "0",
                hasUserConsent: true,
                // UTM-tagged URL for Shopify tracking
                url: createTestURL(utmCampaign, "nitrogen-debug", "utm-test"),
                path: event.path,
                referrer: `analytics-verification-page?utm_source=debug&utm_campaign=${utmCampaign}`,
                pageType: event.pageType,

                // Event-specific fields
                ...(event.resourceId && { resourceId: event.resourceId }),
                ...(event.collectionHandle && {
                  collectionHandle: event.collectionHandle,
                }),
                ...(event.collectionId && { collectionId: event.collectionId }),
                ...(event.products && { products: event.products }),

                // Strong filtering flags
                isTestEvent: true,
                testSource: "utm-tagged-test",
                testCampaign: utmCampaign,
                utm_campaign: utmCampaign,
                utm_source: "nitrogen-debug",
                utm_medium: "utm-test",
                utm_content: event.utm_content,
                test_session: sessionId.value,
                debug_timestamp: Date.now(),
              },
            },
          ],
        },
      });

      if (response.debug?.events) {
        eventIds.push(
          ...response.debug.events.map((e) => e.event_id.slice(0, 8))
        );
      }
    }

    lastBatchInfo.value = {
      count: 3,
      time: new Date().toLocaleTimeString(),
      eventIds: eventIds,
      campaign: utmCampaign,
    };

    eventLog.value.unshift({
      timestamp: new Date().toLocaleTimeString(),
      type: "UTM Tagged Test",
      count: 3,
      eventIds: eventIds,
      campaign: utmCampaign,
    });
  } catch (error) {
    console.error("Failed to send UTM test:", error);
  } finally {
    sending.value = false;
  }
}
</script>
