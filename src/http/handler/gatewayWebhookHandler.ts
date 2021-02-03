import { Request, Response }  from 'express';
import logger                 from '../../lib/logger';
import CredentialManager      from '../../lib/CredentialManager';
import redis                  from '../../lib/redis';
import { makePaymentGateway } from '../../payment/FactoryPaymentGateway';
import { parseOrderResponse } from '../parser/response';
import axios                  from 'axios';
import ShopBaseSigner         from '../../lib/Signer';
import StatusCodes            from '../constant/statusCodes';
import { handleError }        from '../../lib/ResponseHelper';


const creManager = new CredentialManager(redis);
const paymentGateway = makePaymentGateway();

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayWebhookHandler(req: Request, res: Response) {
  try {
    logger.info('[webhook] Received webhook: ', req.body);
    const accountId = paymentGateway.getAccountIdFromResponseGateway(req.body);
    const credential = await creManager.getById(accountId);
    const orderResponse = await paymentGateway.getOrderResponseFromWebhook(req.body, credential);

    const parsedOrderResponse = parseOrderResponse(orderResponse);
    const response = await axios.post(process.env.SHOPBASE_CALLBACK_URL || '', parsedOrderResponse, {
      headers: {
        'X-Signature': ShopBaseSigner.getSignature(parsedOrderResponse),
      },
    });
    logger.info('[webhook] ShopBase Response: ', response.data);
    res.status(StatusCodes.OK).send('success');
  } catch (err) {
    logger.error('[webhook] handle webhook err', err);
    handleError(res, err);
  }
  return null;
}

export default gatewayWebhookHandler;
