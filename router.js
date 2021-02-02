const express = require('express');
const createOrderHandler = require('./src/http/handler/createOrder');
const gatewayWebhookHandler = require('./src/http/handler/gatewayWebhookHandler');
const gatewayConfirmHandler = require('./src/http/handler/gatewayConfirmHandler');
const getTransactionInfoHandler = require('./src/http/handler/getTransactionHandler');
const captureHandler = require('./src/http/handler/captureHandler');
const voidHandler = require('./src/http/handler/voidHandler');
const refundHandler = require('./src/http/handler/refundHandler');

const gatewayCheckCredentialsHandler = require('./src/http/handler/gatewayCheckCredentialsHandler');
const router = new express.Router();

router.post('/create-order', createOrderHandler);

router.post('/provider-webhook', gatewayWebhookHandler);

router.post('/provider-confirm', gatewayConfirmHandler);

router.post('/provider-check-credentials', gatewayCheckCredentialsHandler);

router.get('/transaction', getTransactionInfoHandler);

router.post('/capture', captureHandler);

router.post('/void', voidHandler);

router.post('/refund', refundHandler);

module.exports = router;
