import { Request, Response } from 'express';

const {
  StatusCodes,
} = require('../../constants');

const PaymentGateway = require('../../asiabill/PaymentGateway');
const {parseGetTransactionRequest} = require('../parser/getTransaction');
const redis = require('../../lib/redis');
const CredentialManager = require('../../lib/CredentialManager');
const {handleError} = require('../../lib/ResponseHelper');
const {parseOrderResponse} = require('../parser/response');
const {responseWithSign} = require('../../lib/ResponseHelper');

const creManager = new CredentialManager(redis);
const paymentGateway = new PaymentGateway();

/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function getTransactionHandler(req: Request, res: Response) {
  try {
    const getTransactionReq = await parseGetTransactionRequest(req.query);
    const credential = await creManager.getById(getTransactionReq.accountId);

    const response = await paymentGateway.getTransaction(getTransactionReq, credential);

    return responseWithSign(res, StatusCodes.OK, parseOrderResponse(response));
  } catch (e) {
    handleError(res, e);
  }
}

export default getTransactionHandler;
