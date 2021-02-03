const ShopBaseSigner = require('../../lib/Signer');
const SignInvalidError = require('../../errors/SignInvalid');
import { schemaOrderManagementRequest } from '../../payment/asabill/validate';

export function parseVoidRequest(request) {
  const {value, error} = schemaOrderManagementRequest.validateAsync(request.body, {
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

