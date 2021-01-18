const querystring = require('querystring');
const ShopBaseSigner = require('./Signer');
const Joi = require('joi');
const {
  ERROR_MISSING_PARAMS,
  ERROR_PROCESSING_ERROR,
  RESULT_FAILED,
  StatusCodes,
  ERROR_INVALID_SIGNATURE,
} = require('../constants');
const logger = require('./logger');
const SignInvalidError = require('../errors/SignInvalid');
const NotifyTypeNotSupportError = require('../errors/NotifyTypeError');

/**
 * @param {Express.response} res
 * @param {string} url
 * @param {Object} body
 * @return {*}
 */
function redirectWithSignRequestToShopBase(res, url, body) {
  return res.redirect(`${url}?${querystring.stringify(
      ShopBaseSigner.sign(body),
  )}`);
}

/**
 * @param {Express.response} res
 * @param {Error} err
 * @return {*}
 */
function handleError(res, err) {
  if (err instanceof Joi.ValidationError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: ERROR_MISSING_PARAMS,
    });
  }

  if (err instanceof SignInvalidError) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: ERROR_INVALID_SIGNATURE,
    });
  }

  if (err instanceof NotifyTypeNotSupportError) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      x_result: RESULT_FAILED,
      x_message: err.message,
      x_error_code: ERROR_PROCESSING_ERROR,
    });
  }

  // system or unexpected error need call alert
  logger.error(err);

  return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    x_result: RESULT_FAILED,
    x_message: err.message,
    x_error_code: ERROR_PROCESSING_ERROR,
  });
}

/**
 * @param {Express.response} res
 * @param {integer} httpStatus
 * @param {Object} body
 * @return {*}
 */
function responseWithSign(res, httpStatus, body) {
  return ShopBaseSigner.signResponse(res, httpStatus, body);
}

module.exports = {redirectWithSignRequestToShopBase, handleError, responseWithSign};
