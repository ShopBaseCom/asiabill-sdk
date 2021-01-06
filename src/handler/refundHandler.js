const {
  StatusCodes,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseRefundRequest} = require('../parser/refund');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const ShopBaseSigner = require('../lib/Signer');
const {handleError} = require('../lib/ResponseHelper');
const {parseOrderManagementResponse} = require('../parser/response');

const creManager = new CredentialManager(redis);
const paymentGateway = new PaymentGateway();
/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function refundHandler(req, res) {
  try {
    const refundReq = await parseRefundRequest(req.body);
    const credential = await creManager.getById(refundReq.accountId);

    const response = await paymentGateway.refund(refundReq, credential);

    return res.status(StatusCodes.OK).json(ShopBaseSigner.sign(parseOrderManagementResponse(response)));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = refundHandler;
