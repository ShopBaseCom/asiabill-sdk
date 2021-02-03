import * as Joi                              from 'joi';
import type { Request, Response }            from 'express';
import redis                                 from '../../lib/redis';
import logger                                from '../../lib/logger';
import { RESULT_FAILED }                     from '../constant/statusTransaction';
import { makePaymentGateway }                from '../../payment/FactoryPaymentGateway';
import * as errorCode                        from '../constant/errorCode';
import CredentialManager                     from '../../lib/CredentialManager';
import * as errors                           from '../../payment/error';
import { redirectWithSignRequestToShopBase } from '../../lib/ResponseHelper';
import UrlManager                            from '../../lib/UrlManager';
import StatusCodes                           from '../constant/statusCodes';
import { parseOrderRequest }                 from '../parser/redirect';

const creManager = new CredentialManager(redis);
const urlManager = new UrlManager(redis);
const paymentGateway = makePaymentGateway();

export default async function createOrder(req: Request, res: Response) {
  try {
    const orderReq = await parseOrderRequest(req.body);
    const credential = await creManager.getById(orderReq.accountId);
    orderReq.urlObject = await urlManager.getProxyUrlObject(
      orderReq.reference, orderReq.isPostPurchase, orderReq.urlObject,
    );
    logger.info('url object', orderReq.urlObject);
    logger.info(process.env.HOST);
    const createOrder = await paymentGateway.getDataCreateOrder(orderReq, credential);
    return res.render('redirect', createOrder);
  } catch (e) {
    if (!req.body || !req.body['x_url_complete']) {
      logger.error(e);
      return res.status(StatusCodes.BAD_REQUEST).json({
        x_result: RESULT_FAILED,
        x_message: 'x_url_complete not found',
        x_error_code: errorCode.ERROR_MISSING_PARAMS,
      });
    }
    if (e instanceof Joi.ValidationError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof errors.SignInvalidError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_INVALID_SIGNATURE,
      });
    }

    if (e instanceof errors.InvalidAccountError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_MISSING_PARAMS,
      });
    }

    if (e instanceof errors.ShopBaseSystemError) {
      return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
        x_result: RESULT_FAILED,
        x_message: e.message,
        x_error_code: errorCode.ERROR_PROCESSING_ERROR,
      });
    }

    // system or unexpected error need call alert
    logger.error(e);

    return redirectWithSignRequestToShopBase(res, req.body['x_url_complete'], {
      x_result: RESULT_FAILED,
      x_message: e.message,
      x_error_code: errorCode.ERROR_PROCESSING_ERROR,
    });
  }
}
