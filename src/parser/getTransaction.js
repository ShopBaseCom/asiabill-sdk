const Joi = require('joi');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaGetTransactionRequest = Joi.object({
  x_account_id: Joi.number().required(),
  x_reference: Joi.string().required(),
  x_gateway_reference: Joi.string().required(),
  x_transaction_type: Joi.string(),
  x_test: Joi.bool(),
  x_signature: Joi.string(),
});

/**
 *
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param  {Object} request Object get from query params sent from ShopBase
 * @return {Promise<getTransactionRequest>}
 */
async function parseGetTransactionRequest(request) {
  const value = await schemaGetTransactionRequest.validateAsync(request);
  // if (!ShopBaseSigner.verify(request, value['x_signature'])) {
  //   throw new SignInvalidError('signature invalid');
  // }

  return {
    accountId: value['x_account_id'],
    reference: value['x_reference'],
    gateway_reference: value['x_gateway_reference'],
  };
}

module.exports = {parseGetTransactionRequest};
