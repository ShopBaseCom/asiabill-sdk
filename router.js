const express = require('express');
const createOrderHandler = require('./src/handler/createOrder');
const gatewayWebhookHandler = require('./src/handler/gatewayWebhookHandler');
const gatewayConfirmHandler = require('./src/handler/gatewayConfirmHandler');
const getTransactionInfoHandler = require('./src/handler/getTransactionHandler');
const captureOrVoidHandler = require('./src/handler/captureOrVoidHandler');

const gatewayCheckCredentialsHandler = require('./src/handler/gatewayCheckCredentialsHandler');
const router = new express.Router();

const redis = require('./src/lib/redis');

router.post('/create-order', createOrderHandler);

router.get('/provider-webhook', gatewayWebhookHandler);

router.post('/provider-confirm', gatewayConfirmHandler);

router.post('/provider-check-credentials', gatewayCheckCredentialsHandler);

router.get('/test', async (req, res) => {
  const redirectOrder = await redis.get('test');
  console.log(redirectOrder);
  return res.render('redirect', JSON.parse(redirectOrder));
});

router.get('/transaction', getTransactionInfoHandler);

router.post('/capture_or_void', captureOrVoidHandler);

module.exports = router;
