import ShopBaseSigner                 from '../../lib/Signer';
import { RefundRequest }              from '../../payment/type';
import { SignInvalidError }           from '../../payment/error';
import { schemaRefundPaymentRequest } from '../../payment/asabill/validate';

export function parseRefundRequest(request): RefundRequest {
  const {value, error} = schemaRefundPaymentRequest.validate(request.body, {
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
    gatewayReference: value['x_gateway_reference'],
    transactionType: value['x_transaction_type'],
    amount: value['x_amount'],
    currency: value['x_currency'],
    refundReason: value['x_refund_reason'],
  };
}

