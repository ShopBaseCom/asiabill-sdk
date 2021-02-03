import { Request, Response }             from 'express';
import { parseCheckCredentialsRequest }  from '../parser/checkCredentials';
import { makePaymentGateway }            from '../../payment/FactoryPaymentGateway';
import logger                            from '../../lib/logger';
import { handleError, responseWithSign } from '../../lib/ResponseHelper';
import StatusCodes                       from '../constant/statusCodes';

async function gatewayCheckCredentialsHandler(req: Request, res: Response) {
  try {
    const checkCredentialsRequest = await parseCheckCredentialsRequest(req);
    // Make a request to asiabill to validate credentials
    const paymentGateway = makePaymentGateway();

    const result = await paymentGateway.validateCredential(checkCredentialsRequest.gatewayCredentials);
    logger.info(result);
    return responseWithSign(res, StatusCodes.OK, {
      x_result: result.status,
    });
  } catch (e) {
    handleError(res, e);
  }
}

export default gatewayCheckCredentialsHandler;
