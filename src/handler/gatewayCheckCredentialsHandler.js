const logger = require('../lib/logger');
const StatusCodes = require('../constants/statusCodes');
const {parseCheckCredentialsRequest} = require('../parser/checkCredentials');
const {handleError} = require('../lib/ResponseHelper');
const PaymentGateway = require('../asiabill/PaymentGateway');
const {responseWithSign} = require('../lib/ResponseHelper');

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayCheckCredentialsHandler(req, res) {
  try {
    const checkCredentialsRequest = await parseCheckCredentialsRequest(req);
    // Make a request to asiabill to validate credentials
    const paymentGateway = new PaymentGateway();

    const result = await paymentGateway.validateCredential(checkCredentialsRequest.gatewayCredentials);
    logger.info(result);
    return responseWithSign(res, StatusCodes.OK, {
      x_result: result.status,
    });
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = gatewayCheckCredentialsHandler;
