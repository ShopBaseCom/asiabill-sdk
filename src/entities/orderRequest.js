/* eslint-disable max-len */

/**
 @typedef customerAddress
 @type {Object}
 @property {string} line1 Address line 1 (e.g., street, PO Box, or company name).
 @property {string} city City, district, suburb, town, or village.
 @property {string} country Two-letter country code (ISO 3166-1 alpha-2).
 @property {string} line2 Address line 2 (e.g., apartment, suite, unit, or building).
 @property {string} postal_code ZIP or postal code.
 @property {string} state State, county, province, or region.
 @property {string} phone
 */

/**
 @typedef urlObject
 @type {Object}
 @property {string} cancelUrl
 @property {string} returnUrl
 @property {string} callbackUrl
 */

/**
 @typedef orderRequest
 @type {Object}
 @property {customerAddress} billingAddress Billing information for order.
 @property {customerAddress} shippingAddress Shipping information for order.
 @property {string} currency The three-character ISO-4217 currency code that identifies the currency.
 @property {number} amount
 @property {string} firstName
 @property {string} lastName
 @property {string} email
 @property {urlObject} urlObject
 @property {boolean} isPostPurchase
 @property {string} shopName
 @property {string} reference
 @property {number} accountId
 */

