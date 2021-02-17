import { Request, Response }             from 'express';
import CredentialManager                 from '../../lib/CredentialManager';
import redis                             from '../../lib/redis';
import { makePaymentGateway }            from '../../payment/FactoryPaymentGateway';
import { handleError, responseWithSign } from '../../lib/ResponseHelper';
import StatusCodes                       from '../constant/statusCodes';
import { parseOrderResponse }            from '../parser/response';
import { parseGetTransactionRequest }  from '../parser/getTransaction';
import { schemaGetTransactionRequest } from '../../payment/validate';

const creManager = new CredentialManager(redis);
const paymentGateway = makePaymentGateway();

async function getTransactionHandler(req: Request, res: Response) {
  try {
    const getTransactionReq = parseGetTransactionRequest(req.query);
    const credential = await creManager.getById(getTransactionReq.accountId);
    const getTransactionInfoReqValid = await schemaGetTransactionRequest.validateAsync(
      getTransactionReq, {
        allowUnknown: true,
      },
    );
    const response = await paymentGateway.getTransaction(getTransactionInfoReqValid, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

export default getTransactionHandler;
