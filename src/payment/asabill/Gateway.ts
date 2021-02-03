import * as Joi                                            from 'joi';
import SignHelper                                          from './signHelper';
import Axios                                               from '../../lib/Axios';
import redis                                               from '../../lib/redis';
import logger                                              from '../../lib/logger';
import { ERROR_CARD_DECLINED, ERROR_PROCESSING_ERROR }     from '../../http/constant/errorCode';
import { TRANSACTION_TYPE_AUTHORIZATION }                  from '../../http/constant/transactionType';
import { RESULT_INVALID, RESULT_RESTRICTED, RESULT_VALID } from '../../http/constant/statusCredential';
import { RESULT_COMPLETED, RESULT_FAILED }                 from '../../http/constant/statusTransaction';
import {
  Credential,
  OrderManagementRequest,
  OrderManagementResponse,
  OrderRequest,
  OrderResponse,
  PaymentGateway,
  RedirectRequest,
  ValidateCredentialResponse
}                                                          from '../type';
import {
  schemaCaptureOrVoidResponse,
  schemaCaptureRequest,
  schemaCredential,
  schemaOrderRequest,
  schemaOrderResponse,
  schemaVoidRequest
}                                                          from './validate';
import {
  ErrorCodeCustomerCancel,
  INTERFACE_INFO,
  MAP_ERROR,
  PAYMENT_METHOD,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES, TypeTransaction
}                                                          from './constant';

export default class AsiaBillGateway implements PaymentGateway {

  public getDataCreateOrder(orderRequest: OrderRequest, credential: Credential): RedirectRequest {
    if (!orderRequest) {
      throw new Joi.ValidationError("create order request is required", orderRequest, null)
    }
    const result = schemaCredential.validate(credential, {
      allowUnknown: true,
    });
    if (result.error) {
      throw result.error;
    }
    const {value, error} = schemaOrderRequest.validate(
      orderRequest, {
        allowUnknown: true,
      },
    );
    if (error) {
      throw error;
    }
    const orderReqValid = value as OrderRequest;
    let orderNo = orderRequest.reference;
    if (orderRequest.isPostPurchase) {
      orderNo += AsiaBillGateway.suffixPostPurchase;
    }

    return {
      data: {
        merNo: credential.merNo,
        gatewayNo: credential.gatewayNo,
        orderNo: orderNo,
        orderCurrency: orderReqValid.currency,
        orderAmount: orderReqValid.amount,
        returnUrl: orderReqValid.urlObject.returnUrl,
        remark: orderReqValid.accountId,
        callbackUrl: orderReqValid.urlObject.callbackUrl,
        interfaceInfo: INTERFACE_INFO,
        paymentMethod: PAYMENT_METHOD,
        firstName: orderReqValid.firstName,
        lastName: orderReqValid.lastName,
        email: orderReqValid.email,
        phone: orderReqValid.billingAddress.phone,
        country: orderReqValid.billingAddress.country,
        state: orderReqValid.billingAddress.state,
        city: orderReqValid.billingAddress.city,
        address: orderReqValid.billingAddress.line1,
        zip: orderReqValid.billingAddress.postal_code,
        shipFirstName: orderReqValid.firstName,
        shipLastName: orderReqValid.lastName,
        shipPhone: orderReqValid.shippingAddress.phone,
        shipCountry: orderReqValid.shippingAddress.country,
        shipState: orderReqValid.shippingAddress.state,
        shipCity: orderReqValid.shippingAddress.city,
        shipAddress: orderReqValid.shippingAddress.line1,
        shipZip: orderReqValid.shippingAddress.postal_code,
        signInfo: SignHelper.sign([
          credential.merNo,
          credential.gatewayNo,
          orderNo,
          orderReqValid.currency,
          orderReqValid.amount,
          orderReqValid.urlObject.returnUrl,
          credential.signKey,
        ])
      },
      url: AsiaBillGateway.getUrlApi(credential),
    };
  }

  public getOrderResponse(body: any, credential: Credential): OrderResponse {
    let result = schemaCredential.validate(credential, {
      allowUnknown: true,
    });
    if (result.error) {
      throw result.error;
    }
    result = schemaOrderResponse.validate(
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

  public async capture(captureRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse> {
    const captureReqValid = await schemaCaptureRequest.validateAsync(
      captureRequest, {
        allowUnknown: true,
      },
    );

    return AsiaBillGateway.captureOrVoid(captureReqValid, credential, TRANSACTION_TYPES.CAPTURE);
  }

  public async void(voidRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse> {
    const voidReqValid = await schemaVoidRequest.validateAsync(
      voidRequest, {
        allowUnknown: true,
      },
    );

    return AsiaBillGateway.captureOrVoid(voidReqValid, credential, TRANSACTION_TYPES.VOID);
  }

  async validateCredential(credential: Credential): Promise<ValidateCredentialResponse> {
    await schemaCredential.validateAsync(credential, {
      allowUnknown: true,
    });

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
      TRANSACTION_STATUS.QUERY_SYSTEM_ERROR];

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

  private static async captureOrVoid(captureOrVoidRequest: OrderManagementRequest, credential: Credential, authType: TypeTransaction): Promise<OrderManagementResponse> {
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
      [code, message] = orderInfo.split(':');
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

  async getOrderResponseFromWebhook(body: object, credential: Credential): Promise<OrderResponse> {
    const creResValid = schemaCredential.validate(credential, {
      allowUnknown: true,
    });
    if (creResValid.error) {
      throw creResValid.error;
    }
    const webhookResValid = await schemaWebhookResponse.validateAsync(
      body, {
        allowUnknown: true,
      },
    );

    const signInfo = sign([
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

    let errorCode;
    let errorMessage;

    if (webhookResValid.orderStatus === TRANSACTION_STATUS.FAILURE) {
      const result = this.getErrorCodeAndMessage(
        webhookResValid.orderInfo,
      );

      if (result.errorCode === ERROR_PROCESSING_ERROR) {
        logger.info('debug error', webhookResValid);
      }

      errorCode = result.errorCode;
      errorMessage = result.errorMessage;
    }

    await redis.set(this.getCacheKeyTranNo(webhookResValid.tradeNo),
      webhookResValid.orderNo);

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
      isTest: credential.sandbox,
      timestamp: new Date().toISOString(),
      isCancel: false,
      transactionType: TRANSACTION_TYPE_AUTHORIZATION,
    };
  }
}
