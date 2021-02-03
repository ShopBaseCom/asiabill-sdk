import { PaymentGateway } from './type';
import AsiaBillGateway    from './asabill/Gateway';

export function makePaymentGateway(): PaymentGateway {
  return new AsiaBillGateway()
}