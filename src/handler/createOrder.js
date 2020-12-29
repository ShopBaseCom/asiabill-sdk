const Joi = require('joi');
const {
  ERROR_MISSING_PARAMS,
  ERROR_PROCESSING_ERROR,
  RESULT_FAILED,
  StatusCodes,
} = require('../constants');

// should using factory return interface
const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseOrderRequest} = require('../parser/redirect');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const UrlManager = require('../lib/UrlManager');
const SignInvalidError = require('../errors/SignInvalid');
const logger = require('../lib/logger');
const {ERROR_INVALID_SIGNATURE} = require('../constants');

const creManager = new CredentialManager(redis);
const urlManager = new UrlManager(redis);

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function createOrderHandler(req, res) {
  try {
    const orderReq = await parseOrderRequest(req.body);
    const credential = await creManager.getById(orderReq.accountId);
    orderReq.urlObject = await urlManager.getProxyUrlObject(
        orderReq.reference, !!orderReq.isPostPurchase, orderReq.urlObject,
    );
    const paymentGateway = new PaymentGateway();
    const createOrder = await paymentGateway.getDataCreateOrder(orderReq,
        credential);
    redis.set('test', JSON.stringify(createOrder));
    return res.render('redirect', createOrder);
  } catch (e) {
    if (e instanceof Joi.ValidationError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof SignInvalidError) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_INVALID_SIGNATURE,
      });
    }

    // system or unexpected error need call alert
    logger.error(e);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      x_result: RESULT_FAILED,
      x_message: e.message,
      x_error_code: ERROR_PROCESSING_ERROR,
    });
  }
}

module.exports = createOrderHandler;
