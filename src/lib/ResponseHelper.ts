import Joi                       from 'joi';
import { Response }              from 'express';
import logger                    from './logger';
import * as querystring          from 'querystring';
import { SignInvalidError }      from '../payment/error';
import * as errorCode            from '../http/constant/errorCode';
import { RESULT_FAILED }         from '../http/constant/statusTransaction';
import NotifyTypeNotSupportError from '../payment/error/NotifyTypeError';
import StatusCodes               from '../http/constant/statusCodes';
import ShopBaseSigner            from './Signer';

export function redirectWithSignRequestToShopBase(res: Response, url: string, body: object) {
  return res.redirect(`${url}?${querystring.stringify(
    ShopBaseSigner.sign(body),
  )}`);
}

export function handleError(res: Response, err: Error) {
  if (err instanceof Joi.ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: errorCode.ERROR_MISSING_PARAMS,
    });
  }

  if (err instanceof SignInvalidError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: errorCode.ERROR_INVALID_SIGNATURE,
    });
  }

  if (err instanceof NotifyTypeNotSupportError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: errorCode.ERROR_PROCESSING_ERROR,
    });
  }

  // system or unexpected error need call alert
  logger.error(err);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    x_result: RESULT_FAILED,
    x_message: err.message,
    x_error_code: errorCode.ERROR_PROCESSING_ERROR,
  });
}


export function responseWithSign(res: Response, statusCode: number, data: any) {
  delete data['x_signature'];
  const sign = ShopBaseSigner.getSignature(data);
  return res.header('X-Signature', sign).status(statusCode).json(data);
}

