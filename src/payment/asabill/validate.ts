import * as Joi from 'joi';

export const schemaAddress = Joi.object({
  phone: Joi.string().max(50).optional(),
  country: Joi.string().max(100).required(),
  state: Joi.string().max(100).optional(),
  city: Joi.string().max(100).required(),
  line1: Joi.string().max(500).required(),
  postal_code: Joi.string().max(100).required(),
});

export const schemaOrderRequest = Joi.object().keys({
  currency: Joi.string().max(3).required(),
  amount: Joi.number().max(1000000000).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(50).required(),
  email: Joi.string().max(200).required(),

  shippingAddress: schemaAddress.required(),
  billingAddress: schemaAddress.required(),
});

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

export const schemaGetTransactionRequest = Joi.object().keys({
  accountId: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

export const schemaCaptureRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

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

export const schemaVoidRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

export const schemaRefundRequest = Joi.object().keys({
  // remark
  accountId: Joi.string(),
  reference: Joi.string().required(),
  // tradeNo
  gatewayReference: Joi.string().required(),
  // refundAmount
  amount: Joi.number().required(),
  currency: Joi.string().max(3).required(),
  refundReason: Joi.string().required(),
});

export const schemaCredential = Joi.object({
  sandbox: Joi.bool(),
  merNo: Joi.string().max(5).required(),
  gatewayNo: Joi.string().max(8).required(),
  signKey: Joi.string().max(100).required(),
});
