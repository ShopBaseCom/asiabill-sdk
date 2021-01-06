/**
 @typedef captureOrVoidRequest
 @type {Object}
 @property {string} accountId
 @property {string} reference
 @property {string} gatewayReference
 @property {number} authType
 */


const Joi = require('joi');

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

const schemaCaptureOrVoidRequest = Joi.object().keys({
  accountId: Joi.string(),
  gatewayReference: Joi.string().required(),
  authType: Joi.number().required().allow(1, 2),
});

module.exports = {schemaOrderRequest, schemaGetTransactionRequest, schemaCaptureOrVoidRequest};
