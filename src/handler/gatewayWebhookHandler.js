const PaymentGateway = require('../asiabill/PaymentGateway');
const logger = require('../lib/logger');
const CredentialManager = require('../lib/CredentialManager');
const redis = require('../lib/redis');
const axios = require('axios');
const ShopBaseSigner = require('../lib/Signer');
const {parseOrderResponse} = require('../parser/response');
const {
  StatusCodes,
} = require('../constants');
const {handleError} = require('../lib/ResponseHelper');

const creManager = new CredentialManager(redis);
const paymentGateway = new PaymentGateway();
/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayWebhookHandler(req, res) {
  try {
    logger.info('[webhook] Received webhook: ', req.body);
    const accountId = paymentGateway.getAccountIdFromResponseGateway(req.body);
    const credential = await creManager.getById(accountId);
    const orderResponse = await paymentGateway.getOrderResponseFromWebhook(req.body, credential);

    const parsedOrderResponse = parseOrderResponse(orderResponse);
    const response = await axios.post(process.env.SHOPBASE_CALLBACK_URL, parsedOrderResponse, {
      headers: {
        'X-Signature': ShopBaseSigner.getSignature(parsedOrderResponse),
      },
    });
    logger.info('[webhook] ShopBase Response: ', response.data);
    res.status(StatusCodes.OK).send();
  } catch (err) {
    logger.error('[webhook] handle webhook err', err);
    handleError(res, err);
  }
  return null;
}

module.exports = gatewayWebhookHandler;
