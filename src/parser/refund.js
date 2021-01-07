const Joi = require('joi');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaRefundPaymentRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_gateway_reference: Joi.string().required(),
  x_transaction_type: Joi.string().required(),
  x_invoice: Joi.string(),
  x_url_callback: Joi.string().required(),
  x_refund_type: Joi.string().required(),
  x_transaction_amount: Joi.number().required(),
  x_refund_reason: Joi.string().required(),
});

/**
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param {Object} request Object get from request body sent from ShopBase
 * @return {Promise<refundRequest>}
 */
async function parseRefundRequest(request) {
  const value = await schemaRefundPaymentRequest.validateAsync(request, {
    allowUnknown: true,
  });

  if (!ShopBaseSigner.verify(request, request.header('X-Signature'))) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    reference: value['x_reference'],
    gatewayReference: value['x_gateway_reference'],
    transactionType: value['x_transaction_type'],
    refundType: value['x_refund_type'],
    transactionAmount: value['x_transaction_amount'],
    amount: value['x_amount'],
    currency: value['x_currency'],
    refundReason: value['x_refund_reason'],
  };
}

module.exports = {parseRefundRequest};
