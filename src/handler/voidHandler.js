const {
  StatusCodes,
  TRANSACTION_TYPE_VOID,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseCaptureOrVoidRequest} = require('../parser/captureOrVoid');
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
async function voidHandler(req, res) {
  try {
    const captureOrVoidReq = await parseCaptureOrVoidRequest(req.body);
    const credential = await creManager.getById(captureOrVoidReq.accountId);
    const paymentGateway = new PaymentGateway();

    captureOrVoidReq.transactionType = TRANSACTION_TYPE_VOID;
    const response = await paymentGateway.captureOrVoid(captureOrVoidReq, credential);

    return res.status(StatusCodes.OK).json(ShopBaseSigner.sign(parseOrderManagementResponse(response)));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = voidHandler;
