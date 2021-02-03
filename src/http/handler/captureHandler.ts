import { Request, Response }             from 'express';
import redis                             from '../../lib/redis';
import { parseCaptureRequest }           from '../parser/capture';
import { parseOrderManagementResponse }  from '../parser/response';
import StatusCodes                       from '../constant/statusCodes';
import { handleError, responseWithSign } from '../../lib/ResponseHelper';
import CredentialManager                 from '../../lib/CredentialManager';
import { makePaymentGateway }            from '../../payment/FactoryPaymentGateway';

const creManager = new CredentialManager(redis);
const paymentGateway = makePaymentGateway();

async function captureHandler(req: Request, res: Response) {
  try {
    const captureReq = parseCaptureRequest(req);
    const credential = await creManager.getById(captureReq.accountId);

    const response = await paymentGateway.capture(captureReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderManagementResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

export default captureHandler;
