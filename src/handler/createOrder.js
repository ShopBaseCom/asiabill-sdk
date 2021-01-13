const Joi = require('joi');
const {
  ERROR_MISSING_PARAMS,
  ERROR_PROCESSING_ERROR,
  RESULT_FAILED,
} = require('../constants');

// should using factory return interface
const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseOrderRequest} = require('../parser/redirect');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const UrlManager = require('../lib/UrlManager');
const SignInvalidError = require('../errors/SignInvalid');
const logger = require('../lib/logger');
const InvalidAccountError = require('../errors/InvalidAccountError');
const ShopBaseSystemError = require('../errors/ShopBaseSystemError');
const StatusCodes = require('../constants/statusCodes');
const {redirectWithSignRequestToShopBase} = require('../lib/ResponseHelper');
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
    logger.info('url object', orderReq.urlObject);
    logger.info(process.env.HOST);
    const paymentGateway = new PaymentGateway();
    const createOrder = await paymentGateway.getDataCreateOrder(orderReq,
        credential);
    return res.render('redirect', createOrder);
  } catch (e) {
    if (!req.body || !req.body['x_url_complete']) {
      logger.error(e);
      return res.status(StatusCodes.BAD_REQUEST).json({
        x_result: RESULT_FAILED,
        x_message: 'x_url_complete not found',
        x_error_code: ERROR_MISSING_PARAMS,
      });
    }
    if (e instanceof Joi.ValidationError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof SignInvalidError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_INVALID_SIGNATURE,
      });
    }

    if (e instanceof InvalidAccountError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof ShopBaseSystemError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: ERROR_PROCESSING_ERROR,
      });
    }

    // system or unexpected error need call alert
    logger.error(e);

    return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
      x_result: RESULT_FAILED,
      x_message: e.message,
      x_error_code: ERROR_PROCESSING_ERROR,
    });
  }
}

module.exports = createOrderHandler;
