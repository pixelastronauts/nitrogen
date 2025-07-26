interface ShopifyMonorailEvent {
  schema_id: string;
  payload: Record<string, unknown>;
  metadata: {
    event_created_at_ms: number;
  };
}

interface AnalyticsEvent {
  eventName: string;
  payload: Record<string, unknown>;
}

interface ShopifyGid {
  id: string;
  resource: string | null;
  resourceId: string | null;
  search: string;
  searchParams: URLSearchParams;
  hash: string;
}

// Utility functions from Hydrogen
function parseGid(gid: string | undefined): ShopifyGid {
  const defaultReturn: ShopifyGid = {
    id: '',
    resource: null,
    resourceId: null,
    search: '',
    searchParams: new URLSearchParams(),
    hash: '',
  };

  if (typeof gid !== 'string') {
    return defaultReturn;
  }

  try {
    const {search, searchParams, pathname, hash} = new URL(gid);
    const pathnameParts = pathname.split('/');
    const lastPathnamePart = pathnameParts[pathnameParts.length - 1];
    const resourcePart = pathnameParts[pathnameParts.length - 2];

    if (!lastPathnamePart || !resourcePart) {
      return defaultReturn;
    }

    const id = `${lastPathnamePart}${search}${hash}` || '';
    const resourceId = lastPathnamePart || null;
    const resource = resourcePart ?? null;

    return {id, resource, resourceId, search, searchParams, hash};
  } catch {
    return defaultReturn;
  }
}

function buildUUID(): string {
  const tokenHash = 'xxxx-4xxx-xxxx-xxxxxxxxxxxx';
  
  try {
    // Try crypto.getRandomValues for secure UUID
    const randomValuesArray = new Uint16Array(31);
    crypto.getRandomValues(randomValuesArray);
    
    let i = 0;
    const hash = tokenHash
      .replace(/[x]/g, (c: string): string => {
        const r = randomValuesArray[i] % 16;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        i++;
        return v.toString(16);
      })
      .toUpperCase();
    
    return `${Date.now().toString(16)}-${hash}`;
  } catch (err) {
    // Fallback to Math.random for server environments
    const hash = tokenHash
      .replace(/[x]/g, (c: string): string => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      })
      .toUpperCase();
    
    return `${Date.now().toString(16)}-${hash}`;
  }
}

// Map event names to schema IDs (following Hydrogen patterns)
const SCHEMA_MAP: Record<string, string> = {
  'page_view_2': 'custom_storefront_customer_tracking/1.2',
  'product_view': 'custom_storefront_customer_tracking/1.2', 
  'collection_view': 'custom_storefront_customer_tracking/1.2',
  'search_view': 'custom_storefront_customer_tracking/1.2',
  'add_to_cart': 'custom_storefront_customer_tracking/1.2',
}

// Convert camelCase payload to snake_case fields (exactly like Hydrogen)
function formatPayload(payload: Record<string, unknown>): Record<string, unknown> {
  // Debug logging for unique_token
  console.log('🔍 [Analytics Debug] payload.uniqueToken:', payload.uniqueToken);
  console.log('🔍 [Analytics Debug] payload.visitToken:', payload.visitToken);
  
  const basePayload = {
    source: payload.shopifySalesChannel || 'headless',
    asset_version_id: payload.assetVersionId || '1.0.0',
    hydrogenSubchannelId: payload.storefrontId || payload.hydrogenSubchannelId || '0',

    is_persistent_cookie: payload.hasUserConsent,
    deprecated_visit_token: payload.visitToken || buildUUID(),
    unique_token: payload.uniqueToken || buildUUID(),
    event_time: Date.now(),
    event_id: buildUUID(),

    event_source_url: payload.url,
    referrer: payload.referrer,
    user_agent: payload.userAgent,
    navigation_type: payload.navigationType,
    navigation_api: payload.navigationApi,

    // Critical field mapping: shopId (camelCase) -> shop_id (snake_case + numeric)
    shop_id: parseInt(parseGid(payload.shopId as string).id),
    currency: payload.currency,

    ccpa_enforced: payload.ccpaEnforced || false,
    gdpr_enforced: payload.gdprEnforced || false,
    gdpr_enforced_as_string: payload.gdprEnforced ? 'true' : 'false',
    analytics_allowed: payload.analyticsAllowed || false,
    marketing_allowed: payload.marketingAllowed || false,
    sale_of_data_allowed: payload.saleOfDataAllowed || false,

    // Event-specific fields
    page_type: payload.pageType,
    // Parse resource ID from GID format, fallback to 0 if not numeric
    resource_id: payload.resourceId ? 
      (function() {
        const parsed = parseGid(payload.resourceId as string);
        const numericId = parseInt(parsed.id);
        return isNaN(numericId) ? 0 : numericId;
      })() : 0,
    collection_handle: payload.collectionHandle,
    // Parse collection ID from GID format, fallback to 0 if not numeric
    collection_id: payload.collectionId ? 
      (function() {
        const parsed = parseGid(payload.collectionId as string);
        const numericId = parseInt(parsed.id);
        return isNaN(numericId) ? 0 : numericId;
      })() : 0,
  };

  // Add debugging/filtering fields for test events
  if (payload.isTestEvent) {
    (basePayload as any).test_event = true;
    (basePayload as any).test_source = payload.testSource || 'automated-test';
    (basePayload as any).test_campaign = payload.testCampaign || 'analytics-debug';
  }

  return basePayload;
}

function formatEventForShopify(event: AnalyticsEvent): ShopifyMonorailEvent {
  const formattedPayload = formatPayload(event.payload);
  const finalEvent = {
    schema_id: SCHEMA_MAP[event.eventName] || 'custom_storefront_customer_tracking/1.2',
    payload: {
      event_name: event.eventName,
      ...formattedPayload
    },
    metadata: {
      event_created_at_ms: Date.now(),
    },
  };

  // Debug logging for final event
  console.log('🔍 [Analytics Debug] Final event payload unique_token:', (finalEvent.payload as any).unique_token);
  console.log('🔍 [Analytics Debug] Final event payload deprecated_visit_token:', (finalEvent.payload as any).deprecated_visit_token);

  return finalEvent;
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const { events } = await readBody(event)

  if (!events || !Array.isArray(events)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid events data',
    })
  }

  try {
    const shopifyDomain = (config.public as any)?.shopify?.domain
    const endpoint = shopifyDomain 
      ? `https://${shopifyDomain}/.well-known/shopify/monorail/unstable/produce_batch`
      : 'https://monorail-edge.shopifysvc.com/unstable/produce_batch'

    // Format events properly for Shopify Monorail (like Hydrogen does)
    const formattedEvents = events.map((event: AnalyticsEvent) => formatEventForShopify(event))
    
    const requestPayload = {
      events: formattedEvents,
      metadata: {
        event_sent_at_ms: Date.now(),
      },
    }

    // Debug logging (will appear in server console)
    console.log('🚀 [Analytics] Sending to Shopify:', {
      endpoint,
      eventCount: formattedEvents.length,
      eventTypes: formattedEvents.map(e => e.payload.event_name),
      timestamp: new Date().toISOString(),
    })

    const response = await $fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(requestPayload),
    })

    // Enhanced response logging
    console.log('✅ [Analytics] Shopify Response:', {
      success: true,
      response: response || 'Empty response (normal)',
      eventCount: formattedEvents.length,
      timestamp: new Date().toISOString(),
    })

    return {
      success: true,
      eventCount: formattedEvents.length,
      response: response || null,
      debug: {
        endpoint,
        sentAt: new Date().toISOString(),
        events: formattedEvents.map(e => ({
          event_name: e.payload.event_name,
          schema_id: e.schema_id,
          shop_id: e.payload.shop_id,
          event_id: e.payload.event_id,
        }))
      }
    }
  } catch (error) {
    console.error('Shopify analytics proxy error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to send analytics to Shopify',
    })
  }
}) 