const Joi = require('joi');

const schemaOrderResponse = Joi.object().keys({
  orderAmount: Joi.number().max(1000000000).required(),
  orderCurrency: Joi.string().max(3).required(),
  orderNo: Joi.string().max(50).required(),
  tradeNo: Joi.string().max(200).required(),
  remark: Joi.string().max(200).required(),
  orderInfo: Joi.string().max(200).required(),
  orderStatus: Joi.number().required(),
  signInfo: Joi.string().required(),
});

const schemaGetTransactionResponse = Joi.object().keys({
  tradeinfo: Joi.object().keys({
    merNo: Joi.string().allow(null, ''),
    gatewayNo: Joi.string().allow(null, ''),
    orderNo: Joi.string().allow(null, ''),
    tradeNo: Joi.string().allow(null, ''),
    tradeDate: Joi.string().allow(null, ''),
    tradeAmount: Joi.string().allow(null, ''),
    tradeCurrency: Joi.string().allow(null, ''),
    sourceWebsite: Joi.string().allow(null, ''),
    authStatus: Joi.string().allow(null, ''),
    queryResult: Joi.number().allow(null, ''),
  }),
});


module.exports = {schemaOrderResponse, schemaGetTransactionResponse};
