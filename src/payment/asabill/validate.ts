import * as Joi from 'joi';

export const schemaOrderResponse = Joi.object().keys({
  orderAmount: Joi.number().max(1000000000).required(),
  orderCurrency: Joi.string().max(3).required(),
  orderNo: Joi.string().max(50).required(),
  tradeNo: Joi.string().max(200).required(),
  remark: Joi.string().max(200).required(),
  orderInfo: Joi.string().max(200).required(),
  orderStatus: Joi.number().required(),
  signInfo: Joi.string().required(),
})

export const schemaCaptureOrVoidResponse = Joi.object().keys({
  respon: Joi.object().keys({
    merNo: Joi.string().allow(null, ''),
    gatewayNo: Joi.string().allow(null, ''),
    tradeNo: Joi.string().allow(null, ''),
    orderNo: Joi.string().allow(null, ''),
    orderStatus: Joi.string().allow(null, ''),
    orderInfo: Joi.string().allow(null, ''),
  }),
});

export const schemaCredential = Joi.object({
  sandbox: Joi.bool(),
  merNo: Joi.string().max(5).required(),
  gatewayNo: Joi.string().max(8).required(),
  signKey: Joi.string().max(100).required(),
});

export const schemaRefundResponse = Joi.object().keys({
  response: Joi.object().keys({
    applyRefund: Joi.object().keys({
      batchNo: Joi.number().allow(null, 0),
      merNo: Joi.string().allow(null, ''),
      gatewayNo: Joi.string().allow(null, ''),
      code: Joi.string().allow(null, ''),
      description: Joi.string().allow(null, ''),
      tradeNo: Joi.string().allow(null, ''),
      refundReason: Joi.string().allow(null, ''),
      remark: Joi.string().allow(null, ''),
    }),
  }),
});

export const schemaWebhookResponse = Joi.object().keys({
  signInfo: Joi.string().required(),
  orderNo: Joi.string().required(),
  gatewayNo: Joi.string().required(),
  tradeNo: Joi.string().required(),
  authTypeStatus: Joi.number().required(),
  orderCurrency: Joi.string().max(3).required(),
  orderStatus: Joi.number().required(),
  remark: Joi.string().required(),
  orderAmount: Joi.number().required(),
  notifyType: Joi.string().required(),
  merNo: Joi.string().required(),
  orderInfo: Joi.string().required(),
});

export const schemaGetTransactionResponse = Joi.object().keys({
  response: Joi.object().keys({
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
  }),
});
