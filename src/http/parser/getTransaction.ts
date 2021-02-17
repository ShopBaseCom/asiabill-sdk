import { OrderManagementRequest } from '../../payment/type';
import Joi                        from 'joi';
import ShopBaseSigner             from '../../lib/Signer';
import { SignInvalidError }       from '../../payment/error';

const schemaGetTransactionRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_reference: Joi.string().required(),
  x_gateway_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_transaction_type: Joi.string().required(),
  x_signature: Joi.string().required(),
});

export function parseGetTransactionRequest(request: object): OrderManagementRequest {
  const {value, error} = schemaGetTransactionRequest.validate(request, {
    allowUnknown: true,
  });
  if (error) {
    throw error
  }
  if (!ShopBaseSigner.verify(request, value['x_signature'])) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    reference: value['x_reference'],
    transactionType: value['x_transaction_type'],
    gatewayReference: value['x_gateway_reference'],
  };
}
