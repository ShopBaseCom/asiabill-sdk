const logger = require('../lib/logger');
/**
 * @param {Express.request} req
 * @param {Express.response} res
 * @return {Promise<*>}
 */
async function gatewayWebhookHandler(req, res) {
  logger.info('webhook query', req.query);
  logger.info('webhook params', req.params);
  logger.info('webhook body', req.body);
  return null;
}

module.exports = gatewayWebhookHandler;
