const express = require('express');
const createOrderHandler = require('./src/handler/createOrder');
const gatewayWebhookHandler = require('./src/handler/gatewayWebhookHandler');
const gatewayConfirmHandler = require('./src/handler/gatewayConfirmHandler');
const getTransactionInfoHandler = require('./src/handler/getTransactionHandler');
const captureHandler = require('./src/handler/captureHandler');
const voidHandler = require('./src/handler/voidHandler');

const gatewayCheckCredentialsHandler = require('./src/handler/gatewayCheckCredentialsHandler');
const router = new express.Router();

router.post('/create-order', createOrderHandler);

router.get('/provider-webhook', gatewayWebhookHandler);

router.post('/provider-confirm', gatewayConfirmHandler);

router.post('/provider-check-credentials', gatewayCheckCredentialsHandler);

router.get('/transaction', getTransactionInfoHandler);

router.post('/capture', captureHandler);

router.post('/void', voidHandler);

module.exports = router;
