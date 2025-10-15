import { gql } from 'graphql-tag'

import { IMAGE_FRAGMENT } from './image'
import { MONEY_FRAGMENT } from './money'

export const PRODUCT_VARIANT_FRAGMENT = gql`
  fragment ProductVariant on ProductVariant {
    availableForSale
    compareAtPrice {
      ...Money
    }
    currentlyNotInStock
    id
    image {
      ...Image
    }
    price {
      ...Money
    }
    product {
      id
      featuredImage {
        ...Image
      }
      handle
      title
      vendor
      productType
    }
    quantityAvailable
    requiresShipping
    selectedOptions {
      name
      value
    }
    sku
    title
    unitPrice {
      ...Money
    }
    weight
    weightUnit
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`
