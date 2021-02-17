import * as Joi                                            from 'joi';
import { NotifyTypeNotSupportError, SignInvalidError }     from '../error';
import * as SignHelper                                     from './signHelper';
import Axios                                               from '../../lib/Axios';
import redis                                               from '../../lib/redis';
import logger                                              from '../../lib/logger';
import { ERROR_CARD_DECLINED, ERROR_PROCESSING_ERROR }     from '../../http/constant/errorCode';
import { TRANSACTION_TYPE_AUTHORIZATION }                  from '../../http/constant/transactionType';
import { RESULT_INVALID, RESULT_RESTRICTED, RESULT_VALID } from '../../http/constant/statusCredential';
import { RESULT_COMPLETED, RESULT_FAILED }                 from '../../http/constant/statusTransaction';
import type {
  Credential, lineItem,
  OrderManagementRequest,
  OrderManagementResponse,
  OrderRequest,
  OrderResponse,
  PaymentGateway,
  RedirectRequest, RefundRequest,
  ValidateCredentialResponse
}                                                          from '../type';
import {
  schemaCaptureOrVoidResponse,
  schemaCredential,
  schemaGetTransactionResponse, schemaOrderResponse,
  schemaRefundResponse,
  schemaWebhookResponse
}                                                          from './validate';
import {
  ErrorCodeCustomerCancel,
  INTERFACE_INFO,
  MAP_ERROR, MAP_REFUND_ERROR, NOTIFY_TYPES,
  PAYMENT_METHOD, REFUND_TYPES,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
  TypeTransaction
}                                                          from './constant';

export default class AsiaBillGateway implements PaymentGateway {

  public isPostPurchase(body: any) {
    if (!body || !body['orderNo'] || typeof body['orderNo'] !== 'string') {
      throw new Joi.ValidationError('cannot orderNo from body', body, null);
    }
    return body['orderNo'].endsWith(AsiaBillGateway.suffixPostPurchase);
  }

  public getRefFromResponseGateway(body: any) {
    if (!body || !body['orderNo'] || typeof body['orderNo'] !== 'string') {
      throw new Joi.ValidationError('cannot get ref from body', body, null);
    }
    return body['orderNo'].replace(AsiaBillGateway.suffixPostPurchase, '');
  }

  public getAccountIdFromResponseGateway(body: any) {
    if (!body || !body['remark']) {
      throw new Joi.ValidationError('cannot get account from body', body, null);
    }
    return body['remark'];
  }

  public getRequestCreateOrder(orderRequest: OrderRequest, credential: Credential): RedirectRequest {
    AsiaBillGateway.validateSchemaCredential(credential);
    let orderNo = orderRequest.reference;
    if (orderRequest.isPostPurchase) {
      orderNo += AsiaBillGateway.suffixPostPurchase;
    }

    const redirectRequest = {
      data: {
        merNo: credential.merNo,
        gatewayNo: credential.gatewayNo,
        orderNo: orderNo,
        orderCurrency: orderRequest.currency,
        orderAmount: orderRequest.amount,
        returnUrl: orderRequest.urlObject.returnUrl,
        remark: orderRequest.accountId,
        callbackUrl: orderRequest.urlObject.callbackUrl,
        interfaceInfo: INTERFACE_INFO,
        paymentMethod: PAYMENT_METHOD,
        firstName: orderRequest.firstName,
        lastName: orderRequest.lastName,
        email: orderRequest.email,
        phone: orderRequest.billingAddress.phone,
        country: orderRequest.billingAddress.country,
        state: orderRequest.billingAddress.state,
        city: orderRequest.billingAddress.city,
        address: orderRequest.billingAddress.line1,
        zip: orderRequest.billingAddress.postal_code,
        shipFirstName: orderRequest.firstName,
        shipLastName: orderRequest.lastName,
        shipPhone: orderRequest.shippingAddress.phone,
        shipCountry: orderRequest.shippingAddress.country,
        shipState: orderRequest.shippingAddress.state,
        shipCity: orderRequest.shippingAddress.city,
        shipAddress: orderRequest.shippingAddress.line1,
        shipZip: orderRequest.shippingAddress.postal_code,
        signInfo: SignHelper.sign([
          credential.merNo,
          credential.gatewayNo,
          orderNo,
          orderRequest.currency,
          orderRequest.amount,
          orderRequest.urlObject.returnUrl,
          credential.signKey,
        ]),
        goods_detail: undefined as Array<any>
      },
      url: AsiaBillGateway.getUrlApi(credential),
    }

    if (orderRequest.purchaseItems) {
      redirectRequest.data.goods_detail = orderRequest.purchaseItems.map((item) => ({
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      }));
    }

    return redirectRequest;
  }

  public getOrderResponse(body: any, credential: Credential): OrderResponse {
    AsiaBillGateway.validateSchemaCredential(credential);
    const result = schemaOrderResponse.validate(
      body, {
        allowUnknown: true,
      },
    );
    if (result.error) {
      throw result.error;
    }

    let orderResValid = result.value
    let errorCode = '';
    let errorMessage = '';

    if (orderResValid.orderStatus === TRANSACTION_STATUS.FAILURE) {
      const result = AsiaBillGateway.getErrorCodeAndMessage(
        orderResValid.orderInfo,
      );

      if (result.errorCode === ERROR_PROCESSING_ERROR) {
        logger.info('debug error', orderResValid);
      }

      errorCode = result.errorCode;
      errorMessage = result.errorMessage;
    }
    const signInfo = SignHelper.sign([
      credential.merNo,
      credential.gatewayNo,
      orderResValid.tradeNo,
      orderResValid.orderNo,
      orderResValid.orderCurrency,
      orderResValid.orderAmount,
      orderResValid.orderStatus,
      orderResValid.orderInfo,
      credential.signKey,
    ]);

    if (signInfo !== orderResValid.signInfo) {
      logger.warn('sign invalid', orderResValid);
      // throw new SignInvalidError('sign invalid');
    }

    if (orderResValid.orderStatus === TRANSACTION_STATUS.TO_BE_CONFIRMED) {
      // in case merchant should confirm and order will handle over webhook
      logger.info('order status is confirmed', orderResValid);
    }

    redis.set(AsiaBillGateway.getCacheKeyTranNo(orderResValid.tradeNo),
      orderResValid.orderNo);

    logger.info(`set ref ${AsiaBillGateway.getCacheKeyTranNo(
      orderResValid.tradeNo)} ${orderResValid.orderNo}`);

    return {
      errorCode, errorMessage,
      accountId: this.getAccountIdFromResponseGateway(orderResValid),
      reference: this.getRefFromResponseGateway(orderResValid),
      currency: orderResValid.orderCurrency,
      amount: orderResValid.orderAmount,
      gatewayReference: orderResValid.tradeNo,
      isPostPurchase: this.isPostPurchase(orderResValid),
      isSuccess: orderResValid.orderStatus === TRANSACTION_STATUS.PENDING,
      isTest: !!credential.sandbox,
      timestamp: new Date().toISOString(),
      isCancel: orderResValid.orderInfo.startsWith(ErrorCodeCustomerCancel),
      transactionType: TRANSACTION_TYPE_AUTHORIZATION,
    };
  }

  public async capture(captureRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse> {
    return AsiaBillGateway.captureOrVoid(captureRequest, credential, TRANSACTION_TYPES.CAPTURE);
  }

  public async void(voidRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse> {
    return AsiaBillGateway.captureOrVoid(voidRequest, credential, TRANSACTION_TYPES.VOID);
  }

  async validateCredential(credential: Credential): Promise<ValidateCredentialResponse> {
    AsiaBillGateway.validateSchemaCredential(credential);

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      orderNo: '999999999999',
      signInfo: SignHelper.sign(
        [
          credential.merNo,
          credential.gatewayNo,
          credential.signKey,
        ],
      )
    };

    const url = (credential.sandbox ?
      process.env.ASIABILL_RETRIEVE_URL_TEST_MODE :
      process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE) || '';

    const response = await Axios.getInstance().post(url, requestPayload);

    if (response.status > 201) {
      // Some errors occurred
      throw new Error('Some errors occurred. detail: ' + response.statusText);
    }

    // Just status MERCHANT_GATEWAY_ACCESS_ERROR is invalid account
    const restrictedStatus = [TRANSACTION_STATUS.MERCHANT_GATEWAY_ACCESS_ERROR];
    const validStatus = [
      TRANSACTION_STATUS.TO_BE_CONFIRMED,
      TRANSACTION_STATUS.PENDING,
      TRANSACTION_STATUS.FAILURE,
      TRANSACTION_STATUS.SUCCESS,
      TRANSACTION_STATUS.ORDER_DOES_NOT_EXIST,
    ];
    const errorStatus = [
      TRANSACTION_STATUS.ACCESS_IP_ERROR,
      TRANSACTION_STATUS.QUERY_SYSTEM_ERROR
    ];

    const tradeInfo = response.data.response.tradeinfo;

    if (errorStatus.includes(tradeInfo.queryResult)) {
      throw new Error('Some errors occurred. detail: ' + response.statusText);
    }

    const queryResult = parseInt(tradeInfo.queryResult);
    if (validStatus.includes(queryResult)) {
      return {
        status: RESULT_VALID,
      };
    }

    if (restrictedStatus.includes(queryResult)) {
      return {
        status: RESULT_RESTRICTED,
      };
    }

    return {
      status: RESULT_INVALID,
    };
  }

  async getOrderResponseFromWebhook(body: object, credential: Credential): Promise<OrderResponse> {
    AsiaBillGateway.validateSchemaCredential(credential);
    const webhookResValid = await schemaWebhookResponse.validateAsync(body, {allowUnknown: true});

    const signInfo = SignHelper.sign([
      credential.merNo,
      credential.gatewayNo,
      webhookResValid.tradeNo,
      webhookResValid.orderNo,
      webhookResValid.orderCurrency,
      webhookResValid.orderAmount,
      webhookResValid.orderStatus,
      webhookResValid.orderInfo,
      credential.signKey,
    ]);

    if (signInfo.toUpperCase() !== webhookResValid.signInfo) {
      throw new SignInvalidError('sign invalid');
    }

    if (webhookResValid.notifyType !== NOTIFY_TYPES.PaymentResult) {
      throw new NotifyTypeNotSupportError('notify type not supported');
    }

    let errorCode: string = '';
    let errorMessage: string = '';

    if (webhookResValid.orderStatus === TRANSACTION_STATUS.FAILURE) {
      const result = AsiaBillGateway.getErrorCodeAndMessage(
        webhookResValid.orderInfo,
      );

      if (result.errorCode === ERROR_PROCESSING_ERROR) {
        logger.info('debug error', webhookResValid);
      }

      errorCode = result.errorCode;
      errorMessage = result.errorMessage;
    }

    await redis.set(AsiaBillGateway.getCacheKeyTranNo(webhookResValid.tradeNo), webhookResValid.orderNo);

    return {
      errorCode,
      errorMessage,
      accountId: this.getAccountIdFromResponseGateway(webhookResValid),
      reference: this.getRefFromResponseGateway(webhookResValid),
      currency: webhookResValid.orderCurrency,
      amount: webhookResValid.orderAmount,
      gatewayReference: webhookResValid.tradeNo,
      isPostPurchase: this.isPostPurchase(webhookResValid),
      isSuccess: [TRANSACTION_STATUS.PENDING].includes(webhookResValid.orderStatus),
      isTest: !!credential.sandbox,
      timestamp: new Date().toISOString(),
      isCancel: false,
      transactionType: TRANSACTION_TYPE_AUTHORIZATION,
    };
  }

  async getTransaction(getTransactionRequest: OrderManagementRequest, credential: Credential): Promise<OrderResponse> {
    AsiaBillGateway.validateSchemaCredential(credential);

    const url = credential.sandbox ?
      process.env.ASIABILL_RETRIEVE_URL_TEST_MODE :
      process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE;

    const orderNo = await redis.get(AsiaBillGateway.getCacheKeyTranNo(getTransactionRequest.gatewayReference));

    logger.info(`ref ${AsiaBillGateway.getCacheKeyTranNo(getTransactionRequest.gatewayReference)} ${orderNo}`);

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      orderNo: orderNo,
      signInfo: SignHelper.sign(
        [
          credential.merNo,
          credential.gatewayNo,
          credential.signKey,
        ],
      )
    };

    const response = await Axios.getInstance().post(url || '', requestPayload);
    const getTransactionRes = await schemaGetTransactionResponse.validateAsync(
      response.data.response,
      {
        allowUnknown: true,
      },
    );

    const tradeInfo = getTransactionRes.tradeinfo;

    let amount = parseFloat(tradeInfo.tradeAmount);
    if (isNaN(amount) || amount < 0) {
      amount = 0;
    }
    return {
      // @todo The timestamp must be the timestamp of the transaction creation from the gateway -> field tradeDate
      timestamp: new Date().toISOString(),
      accountId: getTransactionRequest.accountId,
      reference: this.getRefFromResponseGateway(tradeInfo),
      currency: tradeInfo.tradeCurrency,
      isTest: !!credential.sandbox,
      amount,
      gatewayReference: tradeInfo.tradeNo,
      isSuccess: [TRANSACTION_STATUS.PENDING, TRANSACTION_STATUS.SUCCESS].includes(parseInt(tradeInfo.queryResult)),
      transactionType: getTransactionRequest.transactionType,
    };
  }

  async refund(refundRequest: RefundRequest, credential: Credential): Promise<OrderManagementResponse> {
    AsiaBillGateway.validateSchemaCredential(credential);

    const getTransactionResponse = await this.getTransaction({
      transactionType: refundRequest.transactionType,
      accountId: refundRequest.accountId,
      gatewayReference: refundRequest.gatewayReference,
      reference: '',
    }, credential);

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      tradeNo: refundRequest.gatewayReference,
      refundType: getTransactionResponse.amount === refundRequest.amount ? REFUND_TYPES.FULL : REFUND_TYPES.PARTIAL,
      tradeAmount: getTransactionResponse.amount,
      refundAmount: refundRequest.amount,
      currency: refundRequest.currency,
      refundReason: refundRequest.refundReason,
      remark: refundRequest.accountId,
      signInfo: SignHelper.sign(
        [
          credential.merNo,
          credential.gatewayNo,
          refundRequest.gatewayReference,
          refundRequest.currency,
          refundRequest.amount,
          credential.signKey,
        ],
      )
    };

    const url = credential.sandbox ?
      process.env.ASIABILL_REFUND_URL_TEST_MODE :
      process.env.ASIABILL_REFUND_URL_LIVE_MODE;

    const response = await Axios.getInstance().post(url || '', requestPayload);
    const refundRes = await schemaRefundResponse.validateAsync(
      response.data,
      {
        allowUnknown: true,
      },
    );

    const result = refundRes.response.applyRefund.code === '00' ?
      RESULT_COMPLETED : RESULT_FAILED;

    let errorCode: string = '';
    let errorMessage: string = '';

    if (result === RESULT_FAILED) {
      errorCode = MAP_REFUND_ERROR[refundRes.response.applyRefund.code] ||
        ERROR_PROCESSING_ERROR;
      errorMessage = refundRes.response.applyRefund.description ||
        'something went wrong';
    } else {
      logger.info(`Refund success,
      batchNo: ${refundRes.response.applyRefund.batchNo},
      tradeNo: ${refundRes.response.applyRefund.tradeNo},
      refundReason: ${refundRes.response.applyRefund.refundReason}.`,
      );
    }
    return {
      gatewayReference: refundRes.response.applyRefund.tradeNo,
      reference: refundRequest.reference,
      transactionType: refundRequest.transactionType,
      result,
      timestamp: new Date().toISOString(),
      errorCode,
      errorMessage,
    };
  }

  private static async captureOrVoid(captureOrVoidRequest: OrderManagementRequest, credential: Credential, authType: TypeTransaction): Promise<OrderManagementResponse> {
    AsiaBillGateway.validateSchemaCredential(credential);
    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      tradeNo: captureOrVoidRequest.gatewayReference,
      authType: authType,
      remark: captureOrVoidRequest.accountId,
      signInfo: SignHelper.sign(
        [
          credential.merNo,
          credential.gatewayNo,
          captureOrVoidRequest.gatewayReference,
          authType,
          credential.signKey,
        ],
      )
    };


    const url = credential.sandbox ?
      process.env.ASIABILL_CAPTURE_VOID_URL_TEST_MODE :
      process.env.ASIABILL_CAPTURE_VOID_URL_LIVE_MODE;

    const response = await Axios.getInstance().post(url as string, requestPayload);
    const captureOrVoidRes = await schemaCaptureOrVoidResponse.validateAsync(
      response.data,
      {
        allowUnknown: true,
      },
    );

    const result = parseInt(captureOrVoidRes.respon.orderStatus) ===
    TRANSACTION_STATUS.SUCCESS ?
      RESULT_COMPLETED : RESULT_FAILED;

    let errorCode = '';
    let errorMessage = '';

    if (result === RESULT_FAILED) {
      const errResult = AsiaBillGateway.getErrorCodeAndMessage(
        captureOrVoidRes.respon.orderInfo,
      );
      errorCode = errResult.errorCode;
      errorMessage = errResult.errorMessage;
    }
    return {
      gatewayReference: captureOrVoidRes.respon.tradeNo,
      reference: captureOrVoidRequest.reference,
      transactionType: captureOrVoidRequest.transactionType,
      result,
      timestamp: new Date().toISOString(),
      errorCode,
      errorMessage,
    };
  }

  private static get suffixPostPurchase() {
    return '_1';
  }

  private static getUrlApi(credential: Credential): string {
    if (credential.sandbox) {
      return process.env.ASIABILL_URL_TEST_MODE || '';
    }

    return process.env.ASIABILL_URL_LIVE_MODE || '';
  }

  private static getErrorCodeAndMessage(orderInfo: string) {
    // special case not have in document but work in test mode
    if (orderInfo === 'Decline') {
      return {
        errorCode: ERROR_CARD_DECLINED,
        errorMessage: orderInfo,
      };
    }

    let [code, message] = orderInfo.split('_');

    let errorCode = MAP_ERROR[code];

    if (!errorCode) {
      // get error from string
      const [field1, field2, field3] = orderInfo.split(':');
      if (field3) {
        message = `${this.capitalizeFirstLetter(field2)}: ${this.capitalizeFirstLetter(field3)}`;
      } else {
        message = field2;
      }
      code = field1;
    }

    if (code === ErrorCodeCustomerCancel) {
      return {
        errorCode: ERROR_CARD_DECLINED,
        errorMessage: message,
      };
    }

    errorCode = MAP_ERROR[code];

    if (!errorCode) {
      logger.error('cannot detect error code', {orderInfo});
      errorCode = ERROR_PROCESSING_ERROR;
    }

    if (!message) {
      logger.warn('cannot detect error message', {orderInfo});
      message = orderInfo;
    }

    return {
      errorMessage: message,
      errorCode: errorCode,
    };
  }

  private static getCacheKeyTranNo(ref: string): string {
    return `${process.env.ASIABILL_CACHE_KEY_TRANO}/${ref}`;
  }

  public static validateSchemaCredential(credential: Credential) {
    let {error} = schemaCredential.validate(credential, {
      allowUnknown: true,
    });
    if (error) {
      throw error;
    }
  }

  private static capitalizeFirstLetter(string: string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}
