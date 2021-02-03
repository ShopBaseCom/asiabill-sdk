import ShopBaseSigner                   from '../../lib/Signer';
import { OrderManagementRequest }       from '../../payment/type';
import { SignInvalidError }             from '../../payment/error';
import { schemaOrderManagementRequest } from '../../payment/asabill/validate';

export function parseCaptureRequest(request): OrderManagementRequest {
  const {value, error} = schemaOrderManagementRequest.validate(request.body, {
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
