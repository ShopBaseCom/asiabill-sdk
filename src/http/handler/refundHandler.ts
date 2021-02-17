import { Request, Response }             from 'express';
import { parseRefundRequest }            from '../parser/refund';
import { handleError, responseWithSign } from '../../lib/ResponseHelper';
import { parseOrderManagementResponse }  from '../parser/response';
import CredentialManager                 from '../../lib/CredentialManager';
import redis                             from '../../lib/redis';
import { makePaymentGateway }            from '../../payment/FactoryPaymentGateway';
import StatusCodes             from '../constant/statusCodes';
import { schemaRefundRequest } from '../../payment/validate';

const creManager = new CredentialManager(redis);
const paymentGateway = makePaymentGateway();

async function refundHandler(req: Request, res: Response) {
  try {
    const refundReq = parseRefundRequest(req);
    const credential = await creManager.getById(refundReq.accountId);
    await schemaRefundRequest.validateAsync(refundReq, {allowUnknown: true});
    const response = await paymentGateway.refund(refundReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderManagementResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

export default refundHandler;
