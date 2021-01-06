const {
  StatusCodes,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseCaptureRequest} = require('../parser/capture');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const {handleError} = require('../lib/ResponseHelper');
const {parseOrderManagementResponse} = require('../parser/response');
const {responseWithSign} = require('../lib/ResponseHelper');

const creManager = new CredentialManager(redis);
const paymentGateway = new PaymentGateway();
/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function captureHandler(req, res) {
  try {
    const captureReq = await parseCaptureRequest(req.body);
    const credential = await creManager.getById(captureReq.accountId);

    const response = await paymentGateway.capture(captureReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderManagementResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = captureHandler;
