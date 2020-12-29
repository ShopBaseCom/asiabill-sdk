/**
 * Interface for classes that represent a Payment Gateway.
 *
 * @interface PaymentGateway
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
 * @param {AsiaBillCredential} credential
 * @name PaymentGateway#getDataCreateOrder
 * @returns {Promise<redirectRequest>}
 */

/**
 * @function
 * @throws {Joi.ValidationError, SignInvalidError}
 * @param {Object} body
 * @param {AsiaBillCredential} credential
 * @name PaymentGateway#getOrderResponse
 * @return {Promise<orderResponse>}
 */

/**
 * @function
 * @throws {Joi.ValidationError}
 * @param {getTransactionRequest} getTransactionRequest
 * @param {AsiaBillCredential} credential
 * @name PaymentGateway#getTransaction
 * @return {Promise<orderResponse>}
 */
