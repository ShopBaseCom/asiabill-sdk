const Joi = require('joi');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaRedirectRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_shop_name: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_url_callback: Joi.string().required(),
  x_url_cancel: Joi.string().required(),
  x_url_complete: Joi.string().required(),
  x_customer_billing_address_1: Joi.string(),
  x_customer_billing_address_2: Joi.string(),
  x_customer_billing_city: Joi.string(),
  x_customer_billing_company: Joi.string(),
  x_customer_billing_country: Joi.string().max(2).required(),
  x_customer_billing_phone: Joi.string(),
  x_customer_billing_state: Joi.string().optional(),
  x_customer_billing_zip: Joi.string(),
  x_customer_email: Joi.string(),
  x_customer_first_name: Joi.string(),
  x_customer_last_name: Joi.string(),
  x_customer_phone: Joi.string(),
  x_customer_shipping_address_1: Joi.string(),
  x_customer_shipping_address_2: Joi.string(),
  x_customer_shipping_city: Joi.string(),
  x_customer_shipping_company: Joi.string(),
  x_customer_shipping_country: Joi.string().max(2).required(),
  x_customer_shipping_first_name: Joi.string(),
  x_customer_shipping_last_name: Joi.string(),
  x_customer_shipping_phone: Joi.string(),
  x_customer_shipping_state: Joi.string().optional(),
  x_customer_shipping_zip: Joi.string(),
  x_signature: Joi.string(),
});

/**
 *
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param  {Object} request Object get from body request any thing from ShopBase
 * @return {Promise<orderRequest>}
 */
async function parseOrderRequest(request) {
  const value = await schemaRedirectRequest.validateAsync(request);

  if (!ShopBaseSigner.verify(request, value['x_signature'])) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    billingAddress: {
      country: value['x_customer_billing_country'],
      phone: value['x_customer_billing_phone'],
      postal_code: value['x_customer_billing_zip'],
      line1: value['x_customer_billing_address_1'],
      city: value['x_customer_billing_city'],
      state: value['x_customer_billing_state'],
      line2: value['x_customer_billing_address_2'],
    },
    urlObject: {
      callbackUrl: value['x_url_callback'],
      returnUrl: value['x_url_complete'],
      cancelUrl: value['x_url_cancel'],
    },
    firstName: value['x_customer_first_name'],
    lastName: value['x_customer_last_name'],
    currency: value['x_currency'],
    amount: value['x_amount'],
    email: value['x_customer_email'],
    reference: value['x_reference'],
    shippingAddress: {
      country: value['x_customer_shipping_country'],
      phone: value['x_customer_shipping_phone'],
      postal_code: value['x_customer_shipping_zip'],
      line1: value['x_customer_shipping_address_1'],
      city: value['x_customer_shipping_city'],
      state: value['x_customer_shipping_state'],
      line2: value['x_customer_shipping_address_2'],
    },
    shopName: value['x_shop_name'],
    isPostPurchase: false,
  };
}

/**
 *
 * @param {orderResponse} res
 * @return {*}
 */
function parseOrderResponse(res) {
  return {
    x_account_id: res.accountId,
    x_amount: res.amount,
    x_currency: res.currency,
    x_gateway_reference: res.gatewayReference,
    x_reference: res.reference,
    x_transaction_type: res.transactionType,
    x_test: res.isTest,
    x_timestamp: res.timestamp,
    x_message: res.errorMessage,
    x_error_code: res.errorCode,
  };
}

module.exports = {parseOrderRequest, parseOrderResponse};
