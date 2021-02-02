const {
  StatusCodes,
} = require('../../constants');

const PaymentGateway = require('../../asiabill/PaymentGateway');
const {parseVoidRequest} = require('../parser/void');
const redis = require('../../lib/redis');
const CredentialManager = require('../../lib/CredentialManager');
const {handleError} = require('../../lib/ResponseHelper');
const {parseOrderManagementResponse} = require('../parser/response');
const {responseWithSign} = require('../../lib/ResponseHelper');

const creManager = new CredentialManager(redis);
const paymentGateway = new PaymentGateway();

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function voidHandler(req, res) {
  try {
    const voidReq = await parseVoidRequest(req);
    const credential = await creManager.getById(voidReq.accountId);

    const response = await paymentGateway.void(voidReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderManagementResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

module.exports = voidHandler;
