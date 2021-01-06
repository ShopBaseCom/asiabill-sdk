const Joi = require('joi');

const schemaCredential = Joi.object({
  sandbox: Joi.bool(),
  merNo: Joi.string().max(5).required(),
  gatewayNo: Joi.string().max(8).required(),
  signKey: Joi.string().max(100).required(),
});

module.exports = schemaCredential;
