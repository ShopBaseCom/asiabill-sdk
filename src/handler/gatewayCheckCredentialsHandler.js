const logger = require('../lib/logger');
const StatusCodes = require('../constants/statusCodes');
const {parseCheckCredentialsRequest} = require('../parser/checkCredentials');
const {handleError} = require('../lib/ResponseHelper');
const PaymentGateway = require('../asiabill/PaymentGateway');

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayCheckCredentialsHandler(req, res) {
  try {
    const checkCredentialsRequest = await parseCheckCredentialsRequest(req);
    // const credential = await creManager.getById(checkCredentialsRequest.shopId);
    // Make a request to asiabill to validate credentials
    const paymentGateway = new PaymentGateway();

    const result = await paymentGateway.validateCredential(checkCredentialsRequest.gatewayCredentials);
    logger.info(result);

    return res.status(StatusCodes.OK).json({
      x_result: result.status,
    });
  } catch (e) {
    return handleError(res, e);
  }
}

module.exports = gatewayCheckCredentialsHandler;
