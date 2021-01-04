const {
  StatusCodes,
} = require('../constants');

const PaymentGateway = require('../asiabill/PaymentGateway');
const {parseGetTransactionRequest} = require('../parser/getTransaction');
const redis = require('../lib/redis');
const CredentialManager = require('../lib/CredentialManager');
const ShopBaseSigner = require('../lib/Signer');
const {handleError} = require('../lib/ResponseHelper');
const {parseOrderResponse} = require('../parser/response');

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

    const response = await paymentGateway.getTransaction(getTransactionReq, credential);

    return res.status(StatusCodes.OK).json(ShopBaseSigner.sign(parseOrderResponse(response)));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = getTransactionHandler;
