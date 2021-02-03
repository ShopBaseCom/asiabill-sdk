import { Request, Response }             from 'express';
import CredentialManager                 from '../../lib/CredentialManager';
import redis                             from '../../lib/redis';
import { makePaymentGateway }            from '../../payment/FactoryPaymentGateway';
import { parseVoidRequest }              from '../parser/void';
import StatusCodes                       from '../constant/statusCodes';
import { parseOrderManagementResponse }  from '../parser/response';
import { handleError, responseWithSign } from '../../lib/ResponseHelper';
import { schemaVoidRequest }             from '../../payment/validate';

const creManager = new CredentialManager(redis);
const paymentGateway = makePaymentGateway();

async function voidHandler(req: Request, res: Response) {
  try {
    const voidReq = await parseVoidRequest(req);
    const credential = await creManager.getById(voidReq.accountId);
    await schemaVoidRequest.validateAsync(voidReq, {allowUnknown: true});
    const response = await paymentGateway.void(voidReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderManagementResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

export default voidHandler;
