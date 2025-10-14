import type {
  PageViewPayload,
  ProductViewPayload,
  CollectionViewPayload,
  SearchViewPayload,
  CartLineUpdatePayload,
  ShopifyAnalyticsPayload,
  AnalyticsProduct,
} from '../types/payloads'
import { ShopifyAnalyticsEventName, AnalyticsPageType } from '../types/events'
import {
  getClientBrowserParameters,
  createPageViewEvent,
  createProductViewEvent,
  createCollectionViewEvent,
  createSearchViewEvent,
  createAddToCartEvent,
  sendToMonorail,
} from '../utils/monorail'

const PACKAGE_VERSION = '1.0.0'

/**
 * Sets up Shopify analytics event handlers
 */
export function useShopifyAnalyticsHandlers() {
  /**
   * Prepares base analytics payload
   */
  function prepareBasePayload(
    payload: PageViewPayload | ProductViewPayload | CollectionViewPayload | SearchViewPayload,
  ): ShopifyAnalyticsPayload | undefined {
    if (!payload?.shop?.shopId) {
      console.error('[shopify-analytics] Missing shop.shopId')
      return
    }

    if (!payload?.shop?.currency) {
      console.error('[shopify-analytics] Missing shop.currency')
      return
    }

    if (!payload?.shop?.acceptedLanguage) {
      console.error('[shopify-analytics] Missing shop.acceptedLanguage')
      return
    }

    const browserParams = getClientBrowserParameters()

    return {
      shopifySalesChannel: 'hydrogen',
      assetVersionId: PACKAGE_VERSION,
      shopId: payload.shop.shopId,
      currency: payload.shop.currency,
      acceptedLanguage: payload.shop.acceptedLanguage,
      hydrogenSubchannelId: payload.shop.hydrogenSubchannelId,
      hasUserConsent: true, // Can be extended with privacy API
      ...browserParams,
    }
  }

  /**
   * Handles page view events
   */
  async function handlePageView(payload: PageViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload)
      return

    const event = createPageViewEvent(basePayload)
    await sendToMonorail([event])
  }

  /**
   * Handles product view events
   */
  async function handleProductView(payload: ProductViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload)
      return

    if (!payload.products || payload.products.length === 0) {
      console.error('[shopify-analytics] Missing products data')
      return
    }

    // Format products for Shopify
    const formattedProducts = payload.products.map((product: AnalyticsProduct) => ({
      productGid: product.id,
      variantGid: product.variantId,
      name: product.title,
      variantName: product.variantTitle,
      brand: product.vendor,
      price: product.price,
      quantity: product.quantity || 1,
      category: product.productType,
      sku: product.sku,
    }))

    basePayload.products = formattedProducts
    basePayload.pageType = AnalyticsPageType.product
    basePayload.resourceId = formattedProducts[0].productGid

    const event = createProductViewEvent(basePayload)
    await sendToMonorail([event])
  }

  /**
   * Handles collection view events
   */
  async function handleCollectionView(payload: CollectionViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload)
      return

    basePayload.pageType = AnalyticsPageType.collection
    basePayload.resourceId = payload.collection.id
    basePayload.collectionHandle = payload.collection.handle
    basePayload.collectionId = payload.collection.id

    const event = createCollectionViewEvent(basePayload)
    await sendToMonorail([event])
  }

  /**
   * Handles search view events
   */
  async function handleSearchView(payload: SearchViewPayload) {
    const basePayload = prepareBasePayload(payload)
    if (!basePayload)
      return

    basePayload.pageType = AnalyticsPageType.search
    basePayload.searchString = payload.searchTerm

    const event = createSearchViewEvent(basePayload)
    await sendToMonorail([event])
  }

  /**
   * Handles add to cart events
   */
  async function handleAddToCart(payload: CartLineUpdatePayload) {
    const { cart, currentLine, shop } = payload

    if (!cart || !currentLine || !shop) {
      console.error('[shopify-analytics] Missing cart, currentLine, or shop data')
      return
    }

    const browserParams = getClientBrowserParameters()

    const basePayload: ShopifyAnalyticsPayload = {
      shopifySalesChannel: 'hydrogen',
      assetVersionId: PACKAGE_VERSION,
      shopId: shop.shopId,
      currency: shop.currency,
      acceptedLanguage: shop.acceptedLanguage,
      hydrogenSubchannelId: shop.hydrogenSubchannelId,
      hasUserConsent: true,
      cartId: cart.id,
      ...browserParams,
    }

    // Format product from cart line
    const product = {
      productGid: currentLine.merchandise.product.id,
      variantGid: currentLine.merchandise.id,
      name: currentLine.merchandise.product.title,
      variantName: currentLine.merchandise.title,
      brand: currentLine.merchandise.product.vendor,
      price: currentLine.merchandise.price.amount,
      quantity: currentLine.quantity,
      category: currentLine.merchandise.product.productType,
      sku: currentLine.merchandise.sku,
    }

    basePayload.products = [product]

    const event = createAddToCartEvent(basePayload)
    await sendToMonorail([event])
  }

  return {
    handlePageView,
    handleProductView,
    handleCollectionView,
    handleSearchView,
    handleAddToCart,
  }
}

