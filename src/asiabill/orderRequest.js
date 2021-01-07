const Joi = require('joi');
const {REFUND_TYPE_PARTIAL, REFUND_TYPE_FULL} = require('../constants');

const schemaAddress = Joi.object({
  phone: Joi.string().max(50).required(),
  country: Joi.string().max(100).required(),
  state: Joi.string().max(100).required(),
  city: Joi.string().max(100).required(),
  line1: Joi.string().max(500).required(),
  postal_code: Joi.string().max(100).required(),
});

const schemaOrderRequest = Joi.object().keys({
  currency: Joi.string().max(3).required(),
  amount: Joi.number().max(1000000000).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(50).required(),
  email: Joi.string().max(200).required(),

  shippingAddress: schemaAddress.required(),
  billingAddress: schemaAddress.required(),
});


const schemaGetTransactionRequest = Joi.object().keys({
  accountId: Joi.string().required(),
  reference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

const schemaCaptureRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

const schemaVoidRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

const schemaRefundRequest = Joi.object().keys({
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

module.exports = {schemaOrderRequest, schemaGetTransactionRequest, schemaCaptureRequest, schemaVoidRequest, schemaRefundRequest};
