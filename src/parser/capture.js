const Joi = require('joi');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaCapturePaymentRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_gateway_reference: Joi.string().required(),
  x_transaction_type: Joi.string().required(),
  x_invoice: Joi.string(),
  x_url_callback: Joi.string().required(),
});

/**
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param {Express.request} request Object get from request body sent from ShopBase
 * @return {Promise<captureRequest>}
 */
async function parseCaptureRequest(request) {
  const value = await schemaCapturePaymentRequest.validateAsync(request.body, {
    allowUnknown: true,
  });

  if (!ShopBaseSigner.verify(request.body, request.header('X-Signature'))) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    reference: value['x_reference'],
    transactionType: value['x_transaction_type'],
    gatewayReference: value['x_gateway_reference'],
  };
}

module.exports = {parseCaptureRequest};
