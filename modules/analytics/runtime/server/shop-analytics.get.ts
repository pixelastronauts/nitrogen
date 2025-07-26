import type { ShopAnalytics } from '../../../../types/analytics'

const SHOP_QUERY = `#graphql
  query ShopData(
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    shop {
      id
    }
    localization {
      country {
        currency {
          isoCode
        }
      }
      language {
        isoCode
      }
    }
  }
`

export default defineEventHandler(async (event): Promise<ShopAnalytics | null> => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  
  try {
    const response: any = await $fetch('/api/shopify-storefront', {
      method: 'POST',
      body: {
        query: SHOP_QUERY,
        variables: {
          country: query.country || 'US',
          language: query.language || 'EN',
        },
      },
    })

    if (!response?.data?.shop || !response?.data?.localization) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to fetch shop data from Shopify',
      })
    }

    const { shop, localization } = response.data

    return {
      shopId: shop.id,
      acceptedLanguage: localization.language.isoCode,
      currency: localization.country.currency.isoCode,
      hydrogenSubchannelId: config.public.analytics?.storefrontId || '0',
    }
  } catch (error) {
    console.error('Shop analytics error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch shop analytics data',
    })
  }
}) 