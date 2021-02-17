import * as Joi from 'joi';

export const schemaOrderManagementRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_gateway_reference: Joi.string().required(),
  x_transaction_type: Joi.string().required(),
  x_invoice: Joi.string(),
  x_url_callback: Joi.string().required(),
});

export const schemaRefundPaymentRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_gateway_reference: Joi.string().required(),
  x_transaction_type: Joi.string().required(),
  x_invoice: Joi.string(),
  x_url_callback: Joi.string().required(),
  x_refund_reason: Joi.string().required(),
});

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

export const schemaVoidRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  transactionType: Joi.string().required(),
});

export const schemaRefundRequest = Joi.object().keys({
  accountId: Joi.string(),
  reference: Joi.string().required(),
  gatewayReference: Joi.string().required(),
  amount: Joi.number().required(),
  currency: Joi.string().max(3).required(),
  refundReason: Joi.string().required(),
});
