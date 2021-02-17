import { PaymentGateway } from './type';
import AsiaBillGateway    from './asiabill/Gateway';

export function makePaymentGateway(): PaymentGateway {
  return new AsiaBillGateway()
}