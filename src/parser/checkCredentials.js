const Joi = require('joi');
const asiaBillCredential = require('../asiabill/credential');
const ShopBaseSigner = require('../lib/Signer');
const SignInvalidError = require('../errors/SignInvalid');

const schemaCheckCredentialsRequest = Joi.object({
  x_shop_id: Joi.number().required(),
  x_gateway_credentials: asiaBillCredential.required(),
});

/**
 *
 * @throws {Joi.ValidationError} will throw when validate fail
 * @param {Express.request} request request Object get from body request any thing from ShopBase
 * @return {Promise<checkCredentialsRequest>}
 */
async function parseCheckCredentialsRequest(request) {
  const value = await schemaCheckCredentialsRequest.validateAsync(request.body);
  const sign = request.header('X-Signature');
  if (!ShopBaseSigner.verify(request.body, sign)) {
    throw new SignInvalidError('signature invalid');
  }
  return {
    shopId: value['x_shop_id'],
    gatewayCredentials: value['x_gateway_credentials'],
  };
}

module.exports = {parseCheckCredentialsRequest};
