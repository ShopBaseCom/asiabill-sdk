import express                        from 'express'
import createOrder                    from './src/http/handler/createOrder';
import gatewayConfirmHandler          from './src/http/handler/gatewayConfirmHandler';
import gatewayWebhookHandler          from './src/http/handler/gatewayWebhookHandler';
import gatewayCheckCredentialsHandler from './src/http/handler/gatewayCheckCredentialsHandler';
import captureHandler                 from './src/http/handler/captureHandler';
import voidHandler                    from './src/http/handler/voidHandler';
import refundHandler                  from './src/http/handler/refundHandler';
import getTransactionHandler          from './src/http/handler/getTransactionHandler';

const router = new express.Router();

router.post('/create-order', createOrder);

router.post('/provider-webhook', gatewayWebhookHandler);

router.post('/provider-confirm', gatewayConfirmHandler);

router.post('/provider-check-credentials', gatewayCheckCredentialsHandler);

router.get('/transaction', getTransactionHandler);

router.post('/capture', captureHandler);

router.post('/void', voidHandler);

router.post('/refund', refundHandler);

export default router;
