/**
 * Helper script to fetch your Shop ID from Shopify
 * Run with: npx tsx modules/shopify-analytics/scripts/get-shop-id.ts
 */

async function getShopId() {
  const domain = process.env.NUXT_SHOPIFY_DOMAIN
  const token = process.env.NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN

  if (!domain || !token) {
    console.error('❌ Missing NUXT_SHOPIFY_DOMAIN or NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN')
    console.log('\nMake sure these are set in your .env file:')
    console.log('  NUXT_SHOPIFY_DOMAIN=your-store.myshopify.com')
    console.log('  NUXT_SHOPIFY_STOREFRONT_ACCESS_TOKEN=your-token')
    process.exit(1)
  }

  const query = `
    {
      shop {
        id
        name
        primaryDomain {
          url
        }
      }
    }
  `

  try {
    const response = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query }),
    })

    const data = await response.json()

    if (data.errors) {
      console.error('❌ GraphQL Error:', data.errors)
      process.exit(1)
    }

    console.log('\n✅ Shop Information:\n')
    console.log(`   Shop Name: ${data.data.shop.name}`)
    console.log(`   Shop ID:   ${data.data.shop.id}`)
    console.log(`   Domain:    ${data.data.shop.primaryDomain.url}`)
    console.log('\n📋 Add this to your .env file:\n')
    console.log(`   NUXT_SHOPIFY_SHOP_ID=${data.data.shop.id}`)
    console.log('\n')
  }
  catch (error) {
    console.error('❌ Error fetching shop data:', error)
    process.exit(1)
  }
}

getShopId()

