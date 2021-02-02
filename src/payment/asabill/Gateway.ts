import {
  Credential, OrderManagementResponse, OrderRequest, OrderResponse, PaymentGateway, RedirectRequest
}                                                      from '../type';
import {
  schemaCaptureOrVoidResponse, schemaCaptureRequest, schemaCredential, schemaOrderRequest, schemaOrderResponse
}                                                      from './validate';
import {
  ErrorCodeCustomerCancel, INTERFACE_INFO, MAP_ERROR, PAYMENT_METHOD, TRANSACTION_STATUS, TRANSACTION_TYPES
}                                                      from './constant';
import { RESULT_COMPLETED, RESULT_FAILED }             from '../../constant/statusTransaction.ts'
import SignHelper                                      from './signHelper';
import * as Joi                                        from 'joi';
import { ERROR_CARD_DECLINED, ERROR_PROCESSING_ERROR } from '../../constant/errorCode';
import { TRANSACTION_TYPE_AUTHORIZATION }              from '../../constant/transactionType';
import logger                                          from '../../lib/logger';
import redis                                           from '../../lib/redis';
import Axios                                           from '../../lib/Axios';


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
    let errorCode;
    let errorMessage;

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

  public async capture(captureRequest, credential): Promise<OrderManagementResponse> {
    const captureReqValid = await schemaCaptureRequest.validateAsync(
      captureRequest, {
        allowUnknown: true,
      },
    );

    return this.captureOrVoid(captureReqValid, credential, TRANSACTION_TYPES.CAPTURE);
  }

  private async captureOrVoid(captureOrVoidRequest, credential, authType) {
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

    const response = await Axios.getInstance().post(url, requestPayload);
    const captureOrVoidRes = await schemaCaptureOrVoidResponse.validateAsync(
      response.data,
      {
        allowUnknown: true,
      },
    );

    const result = parseInt(captureOrVoidRes.respon.orderStatus) ===
    TRANSACTION_STATUS.SUCCESS ?
      RESULT_COMPLETED : RESULT_FAILED;

    let errorCode;
    let errorMessage;

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

  private static getUrlApi(credential: Credential) {
    if (credential.sandbox) {
      return process.env.ASIABILL_URL_TEST_MODE;
    }

    return process.env.ASIABILL_URL_LIVE_MODE;
  }

  private static getErrorCodeAndMessage(orderInfo) {
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
}
