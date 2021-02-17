import { CheckCredentialsRequest } from '../../payment/type';
import Joi                         from 'joi';
import ShopBaseSigner              from '../../lib/Signer';
import { SignInvalidError }        from '../../payment/error';
import { Request }                 from 'express';

const schemaCheckCredentialsRequest = Joi.object({
  x_shop_id: Joi.number().required(),
});

export function parseCheckCredentialsRequest(request: Request): CheckCredentialsRequest {
  const {value, error} = schemaCheckCredentialsRequest.validate(request.body as object, {
    allowUnknown: true,
  });

  if (error) {
    throw error
  }

  const sign = request.header('X-Signature');
  if (!ShopBaseSigner.verify(request.body, sign)) {
    throw new SignInvalidError('signature invalid');
  }
  return {
    shopId: value['x_shop_id'],
    gatewayCredentials: value['x_gateway_credentials'],
  };
}
