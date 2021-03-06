import { Request }                      from 'express';
import { schemaOrderManagementRequest } from '../../payment/validate';
import ShopBaseSigner                   from '../../lib/Signer';
import { SignInvalidError }             from '../../payment/error';

export function parseVoidRequest(request: Request) {
  const {value, error} = schemaOrderManagementRequest.validate(request.body as object, {
    allowUnknown: true,
  });

  if (error) {
    throw error
  }

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

