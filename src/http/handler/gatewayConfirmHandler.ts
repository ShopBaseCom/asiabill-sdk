import Joi                                                            from 'joi';
import { Request, Response }                                          from 'express';
import redis                                                          from '../../lib/redis';
import logger                                                         from '../../lib/logger';
import { parseOrderResponse }                                         from '../parser/response';
import { InvalidAccountError, ShopBaseSystemError, SignInvalidError } from '../../payment/error';
import * as errorCode                                                 from '../constant/errorCode';
import UrlManager                                                     from '../../lib/UrlManager';
import StatusCodes                                                    from '../constant/statusCodes';
import { redirectWithSignRequestToShopBase }                          from '../../lib/ResponseHelper';
import CredentialManager                                              from '../../lib/CredentialManager';
import { RESULT_FAILED }                                              from '../constant/statusTransaction';
import { makePaymentGateway }                                         from '../../payment/FactoryPaymentGateway';

const creManager = new CredentialManager(redis);
const urlManager = new UrlManager(redis);
const paymentGateway = makePaymentGateway();

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayConfirmHandler(req: Request, res: Response) {
  let ref;
  let isPostPurchase;
  let urlObject;

  try {
    ref = paymentGateway.getRefFromResponseGateway(req.body);
    isPostPurchase = paymentGateway.isPostPurchase(req.body);
    urlObject = await urlManager.getUrlObject(ref, isPostPurchase);
    const accountId = paymentGateway.getAccountIdFromResponseGateway(req.body);
    const credential = await creManager.getById(accountId);
    const orderResponse = await paymentGateway.getOrderResponse(req.body, credential);

    if (orderResponse.isCancel) {
      return res.redirect(urlObject.cancelUrl);
    }

    return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, parseOrderResponse(orderResponse));
  } catch (e) {
    if (!urlObject) {
      // system error cannot get url object -> block checkout buyer urgent
      logger.error(e);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send('system error');
    }
    if (e instanceof Joi.ValidationError) {
      return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof SignInvalidError) {
      logger.warn(e);
      return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_INVALID_SIGNATURE,
      });
    }

    if (e instanceof InvalidAccountError) {
      return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof ShopBaseSystemError) {
      return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_PROCESSING_ERROR,
      });
    }

    // system or unexpected error need call alert
    logger.error(e);
    return redirectWithSignRequestToShopBase(res, urlObject.returnUrl, {
      x_result: RESULT_FAILED,
      x_message: e.message,
      x_error_code: errorCode.ERROR_PROCESSING_ERROR,
    });
  }
}

export default gatewayConfirmHandler;
