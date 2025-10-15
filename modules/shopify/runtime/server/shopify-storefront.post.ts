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

  // Get Shopify session cookies from the incoming request
  const shopifyY = getCookie(event, '_shopify_y')
  const shopifyS = getCookie(event, '_shopify_s')

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Shopify-Storefront-Access-Token': options.storefrontAccessToken,
  }

  // CRITICAL: Forward Shopify cookies to enable Live View cart tracking
  // This allows Shopify to associate the cart session with Live View metrics
  // See: https://github.com/Shopify/hydrogen/pull/614
  if (shopifyY || shopifyS) {
    const cookieParts = []
    if (shopifyY) cookieParts.push(`_shopify_y=${shopifyY}`)
    if (shopifyS) cookieParts.push(`_shopify_s=${shopifyS}`)
    headers['Cookie'] = cookieParts.join('; ')
  }

  return await $fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  })
})
