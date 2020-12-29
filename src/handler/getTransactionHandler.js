const Joi = require('joi');
const {
  ERROR_MISSING_PARAMS,
  ERROR_PROCESSING_ERROR,
  RESULT_FAILED,
  StatusCodes,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseGetTransactionRequest} = require('../parser/getTransaction');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const SignInvalidError = require('../errors/SignInvalid');
const logger = require('../lib/logger');
const {ERROR_INVALID_SIGNATURE} = require('../constants');

const creManager = new CredentialManager(redis);
/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function getTransactionHandler(req, res) {
  try {
    const getTransactionReq = await parseGetTransactionRequest(req.query);
    const credential = await creManager.getById(getTransactionReq.accountId);
    const paymentGateway = new PaymentGateway();
    paymentGateway.setCredential(credential);

    const response = await paymentGateway.getTransactionHandler(getTransactionReq);
    return res.status(200).json(response);
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

module.exports = getTransactionHandler;
