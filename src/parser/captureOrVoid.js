const Joi = require('joi');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaCaptureOrVoidPaymentRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_gateway_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_url_callback: Joi.string().required(),
  x_transaction_type: Joi.string().required(),
  x_invoice: Joi.string(),
  x_signature: Joi.string(),
});

/**
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param {Object} request Object get from request body sent from ShopBase
 * @return {Promise<captureOrVoidRequest>}
 */
async function parseCaptureOrVoidRequest(request) {
  const value = await schemaCaptureOrVoidPaymentRequest.validateAsync(request, {
    allowUnknown: true,
  });

  if (!ShopBaseSigner.verify(request, value['x_signature'])) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    currency: value['x_currency'],
    amount: value['x_amount'],
    reference: value['x_reference'],
    gatewayReference: value['x_gateway_reference'],
    transactionType: value['x_transaction_type'],
  };
}

module.exports = {parseCaptureOrVoidRequest};
