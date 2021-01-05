const {
  StatusCodes,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseCaptureRequest} = require('../parser/capture');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const ShopBaseSigner = require('../lib/Signer');
const {handleError} = require('../lib/ResponseHelper');
const {parseOrderManagementResponse} = require('../parser/response');
const creManager = new CredentialManager(redis);

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function captureHandler(req, res) {
  try {
    const captureReq = await parseCaptureRequest(req.body);
    const credential = await creManager.getById(captureReq.accountId);
    const paymentGateway = new PaymentGateway();

    const response = await paymentGateway.capture(captureReq, credential);

    return res.status(StatusCodes.OK).json(ShopBaseSigner.sign(parseOrderManagementResponse(response)));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = captureHandler;
