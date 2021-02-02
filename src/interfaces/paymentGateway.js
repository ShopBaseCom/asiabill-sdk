/**
 * Interface for classes that represent a Payment Gateway.
 *
 * @interface Interfaces
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @public
 * @param {Object} body
 * @name Interfaces#getAccountIdFromResponseGateway
 * @return {string}
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @function
 * @param {Object} body
 * @name Interfaces#getRefFromResponseGateway
 * @return {string}
 */

/**
 *
 * @throws {Joi.ValidationError}
 * @function
 * @param {Object} body
 * @name Interfaces#isPostPurchase
 * @return {boolean}
 */

/**
 * Get accountId from body response gateway
 * @function
 * @param {orderRequest} orderRequest
 * @param {PaymentGatewayCredential} credential
 * @name Interfaces#getDataCreateOrder
 * @returns {Promise<redirectRequest>}
 */

/**
 * @function
 * @throws {Joi.ValidationError, SignInvalidError}
 * @param {Object} body
 * @param {PaymentGatewayCredential} credential
 * @name Interfaces#getOrderResponse
 * @return {Promise<orderResponse>}
 */


/**
 * @function
 * @throws {Joi.ValidationError}
 * @param {getTransactionRequest} getTransactionRequest
 * @param {PaymentGatewayCredential} credential
 * @name Interfaces#getTransaction
 * @return {Promise<orderResponse>}
 */

/**
 * @function
 * @throws {Joi.ValidationError}
 * @param {getTransactionRequest}
 * @param {PaymentGatewayCredential} credential
 * @name Interfaces#getTransaction
 * @return {Promise<orderResponse>}
 */
