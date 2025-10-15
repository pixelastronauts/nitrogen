/**
 * Handles server requests to the Shopify GraphQL Storefront API.
 * @param event - The H3 event containing the request data
 * @returns The response from the Shopify API
 * @see https://shopify.dev/docs/api/storefront
 */
export default defineEventHandler(async (event) => {
  const { shopify: options } = useRuntimeConfig(event)
  const { query, variables } = await readBody(event)

  const endpoint = `https://${options.domain}/api/${options.apiVersion}/graphql.json`

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': options.storefrontAccessToken,
  }

  // CRITICAL: Forward Shopify session headers to enable Live View tracking
  // See: https://github.com/Shopify/hydrogen/pull/614
  // See: https://github.com/Shopify/hydrogen/issues/701
  
  // 1. Forward Shopify session cookies
  // For headless storefronts, use Shopify-Storefront-Y/S headers instead of Cookie
  const shopifyY = getCookie(event, '_shopify_y')
  const shopifyS = getCookie(event, '_shopify_s')
  
  if (shopifyY) {
    headers['Shopify-Storefront-Y'] = shopifyY
  }
  
  if (shopifyS) {
    headers['Shopify-Storefront-S'] = shopifyS
  }

  // 2. Forward buyer IP (required for Live View session tracking)
  // Try multiple header sources (Cloudflare, standard proxies)
  const buyerIp = 
    getHeader(event, 'cf-connecting-ip') ||
    getHeader(event, 'x-real-ip') ||
    getHeader(event, 'x-forwarded-for')?.split(',')[0].trim() ||
    event.node?.req?.socket?.remoteAddress

  if (buyerIp) {
    headers['Shopify-Storefront-Buyer-IP'] = buyerIp
  }

  // 3. Forward request ID (helps with debugging and analytics correlation)
  const requestId = 
    getHeader(event, 'cf-ray') ||
    getHeader(event, 'x-request-id') ||
    getHeader(event, 'request-id')

  if (requestId) {
    headers['Shopify-Storefront-Request-Group-Id'] = requestId
  }

  return await $fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
})
