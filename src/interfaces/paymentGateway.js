/**
 * Interface for classes that represent a Payment Gateway.
 *
 * @interface PaymentGateway
 */

/**
 * Set config credential -> get from ShopBase
 *
 * @throws {Joi.ValidationError}
 * @function
 * @param {Object} credential
 * @name PaymentGateway#setCredential
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @public
 * @param {Object} body
 * @name PaymentGateway#getAccountIdFromResponseGateway
 * @return {number}
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @function
 * @param {Object} body
 * @name PaymentGateway#getRefFromResponseGateway
 * @return {string}
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @function
 * @param {Object} body
 * @name PaymentGateway#isPostPurchase
 * @return {boolean}
 */

/**
 * Get accountId from body response gateway
 * @function
 * @param {orderRequest} orderRequest
 * @name PaymentGateway#getDataCreateOrder
 * @returns {Promise<redirectRequest>}
 */

/**
 * @function
 * @throws {Joi.ValidationError, SignInvalidError}
 * @param {Object} body
 * @name PaymentGateway#getOrderResponse
 * @return {Promise<orderResponse>}
 */

/**
 * @function
 * @throws {Joi.ValidationError}
 * @param {getTransactionRequest} getTransactionRequest
 * @name PaymentGateway#getTransactionHandler
 * @return {Promise<orderResponse>}
 */
