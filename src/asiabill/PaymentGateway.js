const {
  schemaOrderRequest,
  schemaGetTransactionRequest,
  schemaCaptureRequest,
  schemaVoidRequest,
  schemaRefundRequest,
} = require('./orderRequest');
const schemaCredential = require('./credential');
const sign = require('./signHelper');
const {
  schemaOrderResponse,
  schemaGetTransactionResponse,
  schemaCaptureOrVoidResponse,
  schemaRefundResponse,
} = require('./orderResponse');
const logger = require('../lib/logger');
const Joi = require('joi');
const {
  TRANSACTION_TYPE_AUTHORIZATION,
  RESULT_COMPLETED,
  RESULT_FAILED,
  RESULT_INVALID,
  RESULT_VALID,
  RESULT_RESTRICTED,
  ERROR_PROCESSING_ERROR,
  ERROR_CARD_DECLINED,
} = require('../constants');
const {TRANSACTION_STATUS, TRANSACTION_TYPES} = require('./constant');
const {
  MAP_ERROR,
  PAYMENT_METHOD,
  INTERFACE_INFO,
  REFUND_TYPES,
  MAP_REFUND_ERROR,
} = require('./constant');
const Axios = require('../lib/Axios');
const {REFUND_TYPE_FULL} = require('../constants');

/**
 * Class representing a AsianBill gateway.
 *
 * @class
 * @implements {PaymentGateway}
 */
class AsiaBillPaymentGateway {
  /**
   * transform, validate and sign request from ShopBase to gateway
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {orderRequest} orderRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<redirectRequest>}
   */
  async getDataCreateOrder(orderRequest, credential) {
    const result = schemaCredential.validate(credential);
    if (result.error) {
      throw result.error;
    }
    const orderReqValid = await schemaOrderRequest.validateAsync(
        orderRequest, {
          allowUnknown: true,
        },
    );
    let orderNo = orderRequest.reference;
    if (orderRequest.isPostPurchase) {
      orderNo += this.suffixPostPurchase;
    }

    const redirectRequest = {
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
      },
      url: this.getUrlApi(credential),
    };

    redirectRequest.data.signInfo = sign([
      credential.merNo,
      credential.gatewayNo,
      redirectRequest.data.orderNo,
      redirectRequest.data.orderCurrency,
      redirectRequest.data.orderAmount,
      redirectRequest.data.returnUrl,
      credential.signKey,
    ]);

    return redirectRequest;
  }

  /**
   * get accountId from body response gateway
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {Object} body
   * @return {string}
   */
  getAccountIdFromResponseGateway(body) {
    if (!body || !body['remark']) {
      throw new Joi.ValidationError('cannot get account from body', body, null);
    }
    return body['remark'];
  }

  /**
   *
   * @static
   * @throws {Joi.ValidationError} will throw when validate fail
   * @public
   * @param {Object} body
   * @return {string}
   */
  getRefFromResponseGateway(body) {
    if (!body || !body['orderNo'] || typeof body['orderNo'] !== 'string') {
      throw new Joi.ValidationError('cannot get ref from body', body, null);
    }
    return body['orderNo'].replace(this.suffixPostPurchase, '');
  }

  /**
   *
   * @static
   * @throws {Joi.ValidationError} will throw when validate fail
   * @public
   * @param {Object} body
   * @return {boolean}
   */
  isPostPurchase(body) {
    if (!body || !body['orderNo'] || typeof body['orderNo'] !== 'string') {
      throw new Joi.ValidationError('cannot orderNo from body', body, null);
    }
    return body['orderNo'].endsWith(this.suffixPostPurchase);
  }

  /**
   * transform and validate request from gateway back to ShopBase
   * @public
   * @throws {Joi.ValidationError, SignInvalidError}
   * @param {Object} body
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderResponse>}
   */
  async getOrderResponse(body, credential) {
    const result = schemaCredential.validate(credential);
    if (result.error) {
      throw result.error;
    }
    const orderResValid = await schemaOrderResponse.validateAsync(
        body, {
          allowUnknown: true,
        },
    );

    let errorCode;
    let errorMessage;

    if (orderResValid['orderStatus'] === TRANSACTION_STATUS.FAILURE) {
      const result = this.getErrorCodeAndMessage(
          orderResValid['orderInfo'],
      );

      errorCode = result.errorCode;
      errorMessage = result.errorMessage;
    }
    const signInfo = sign([
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

    if (signInfo !== orderResValid['signInfo']) {
      logger.warn('sign invalid');
      // throw new SignInvalidError('sign invalid');
    }

    if (orderResValid['orderStatus'] === TRANSACTION_STATUS.TO_BE_CONFIRMED) {
      // in case merchant should confirm and order will handle over webhook
      logger.info('order status is confirmed', orderResValid);
    }

    return {
      errorCode, errorMessage,
      accountId: this.getAccountIdFromResponseGateway(orderResValid),
      reference: this.getRefFromResponseGateway(orderResValid),
      currency: orderResValid['orderCurrency'],
      amount: orderResValid['orderAmount'],
      gatewayReference: orderResValid['tradeNo'],
      isPostPurchase: this.isPostPurchase(orderResValid),
      isSuccess: orderResValid['orderStatus'] === TRANSACTION_STATUS.PENDING,
      isTest: credential.sandbox,
      timestamp: new Date().toISOString(),
      isCancel: false,
      transactionType: TRANSACTION_TYPE_AUTHORIZATION,
    };
  }

  /**
   * example I0013:Invalid Encryption value( signInfo )
   * @param {string} orderInfo
   * @return {{
   *   errorCode: string,
   *   errorMessage: string
   * }}
   */
  getErrorCodeAndMessage(orderInfo) {
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
      logger.error('cannot detect error message', {orderInfo});
      message = 'something went wrong';
    }

    return {
      errorMessage: message,
      errorCode: errorCode,
    };
  }

  /**
   * get AsiaBill transaction info
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {getTransactionRequest} getTransactionRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderResponse>}
   */
  async getTransaction(getTransactionRequest, credential) {
    const getTransactionInfoReqValid = await schemaGetTransactionRequest.validateAsync(
        getTransactionRequest, {
          allowUnknown: true,
        },
    );
    const orderNo = getTransactionInfoReqValid.reference;

    const url = credential.sandbox ?
      process.env.ASIABILL_RETRIEVE_URL_TEST_MODE :
      process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE;

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      orderNo: orderNo,
    };

    requestPayload.signInfo = sign(
        [
          credential.merNo,
          credential.gatewayNo,
          credential.signKey,
        ],
    );
    const response = await Axios.getInstance().post(url, requestPayload);
    const getTransactionRes = await schemaGetTransactionResponse.validateAsync(
        response.data.response,
        {
          allowUnknown: true,
        },
    );

    const tradeInfo = getTransactionRes.tradeinfo;

    const result = parseInt(tradeInfo.queryResult) === TRANSACTION_STATUS.SUCCESS ? RESULT_COMPLETED : RESULT_FAILED;

    let amount = parseFloat(tradeInfo.tradeAmount);
    if (isNaN(amount) || amount < 0) {
      amount = 0;
    }
    return {
      timestamp: new Date().toISOString(),
      accountId: getTransactionInfoReqValid.accountId,
      reference: this.getRefFromResponseGateway(tradeInfo),
      currency: tradeInfo.tradeCurrency,
      isTest: credential.sandbox,
      amount,
      gatewayReference: tradeInfo.tradeNo,
      result,
      transactionType: getTransactionInfoReqValid.transactionType,
    };
  }

  /**
   * capture a payment
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {captureRequest} captureRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderManagementResponse>}
   */
  async capture(captureRequest, credential) {
    const captureReqValid = await schemaCaptureRequest.validateAsync(
        captureRequest, {
          allowUnknown: true,
        },
    );

    return this.captureOrVoid(captureReqValid, credential, TRANSACTION_TYPES.CAPTURE);
  }

  /**
   * void a payment
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {voidRequest} voidRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderManagementResponse>}
   */
  async void(voidRequest, credential) {
    const voidReqValid = await schemaVoidRequest.validateAsync(
        voidRequest, {
          allowUnknown: true,
        },
    );

    return this.captureOrVoid(voidReqValid, credential, TRANSACTION_TYPES.VOID);
  }

  /**
   * refund a payment
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {refundRequest} refundRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderManagementResponse>}
   */
  async refund(refundRequest, credential) {
    await schemaRefundRequest.validateAsync(refundRequest, {
      allowUnknown: true,
    });

    const getTransactionResponse = await this.getTransaction({
      transactionType: refundRequest.transactionType,
      reference: refundRequest.reference,
      accountId: refundRequest.accountId,
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
    };

    requestPayload.signInfo = sign(
        [
          credential.merNo,
          credential.gatewayNo,
          requestPayload.tradeNo,
          requestPayload.currency,
          requestPayload.refundAmount,
          credential.signKey,
        ],
    );

    const url = credential.isTestMode ?
      process.env.ASIABILL_REFUND_URL_TEST_MODE :
      process.env.ASIABILL_REFUND_URL_LIVE_MODE;

    const response = await Axios.getInstance().post(url, requestPayload);
    const refundRes = await schemaRefundResponse.validateAsync(
        response.data,
        {
          allowUnknown: true,
        },
    );

    const result = refundRes.response.applyRefund.code === '00' ?
      RESULT_COMPLETED : RESULT_FAILED;

    let errorCode;
    let errorMessage;

    if (result === RESULT_FAILED) {
      errorCode = MAP_REFUND_ERROR[refundRes.response.applyRefund.code] || ERROR_PROCESSING_ERROR;
      errorMessage = refundRes.response.applyRefund.description || 'something went wrong';
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


  /**
   * capture or void a payment
   * @private
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {captureOrVoidRequest} captureOrVoidRequest
   * @param {AsiaBillCredential} credential
   * @param {number} authType
   * @return {Promise<orderManagementResponse>}
   */
  async captureOrVoid(captureOrVoidRequest, credential, authType) {
    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      tradeNo: captureOrVoidRequest.gatewayReference,
      authType: authType,
      remark: captureOrVoidRequest.accountId,
    };

    requestPayload.signInfo = sign(
        [
          credential.merNo,
          credential.gatewayNo,
          requestPayload.tradeNo,
          requestPayload.authType,
          credential.signKey,
        ],
    );

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

    const result = parseInt(captureOrVoidRes.respon.orderStatus) === TRANSACTION_STATUS.SUCCESS ?
      RESULT_COMPLETED : RESULT_FAILED;

    let errorCode;
    let errorMessage;

    if (result === RESULT_FAILED) {
      const errResult = this.getErrorCodeAndMessage(
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

  /**
   * validate credential
   * @public
   * @param {AsiaBillCredential} credential
   * @throws {Error} will throw when validate fail
   * @return {Promise<*>}
   */
  async validateCredential(credential) {
    const result = schemaCredential.validate(credential);
    if (result.error) {
      throw result.error;
    }

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      orderNo: '999999999999',
    };

    requestPayload.signInfo = sign(
        [
          credential.merNo,
          credential.gatewayNo,
          credential.signKey,
        ],
    );

    const url = credential.sandbox ?
      process.env.ASIABILL_RETRIEVE_URL_TEST_MODE :
      process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE;

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
    const errorStatus = [TRANSACTION_STATUS.ACCESS_IP_ERROR, TRANSACTION_STATUS.QUERY_SYSTEM_ERROR];

    const tradeInfo = response.data.response.tradeinfo;

    if (errorStatus.indexOf(tradeInfo.queryResult) > -1) {
      throw new Error('Some errors occurred. detail: ' + response.statusText);
    }

    const queryResult = parseInt(tradeInfo.queryResult);
    if (validStatus.indexOf(queryResult) > -1) {
      return {
        status: RESULT_VALID,
      };
    }

    if (restrictedStatus.indexOf(queryResult) > -1) {
      return {
        status: RESULT_RESTRICTED,
      };
    }

    return {
      status: RESULT_INVALID,
    };
  }

  /**
   * @private
   * @return {string}
   */
  get suffixPostPurchase() {
    return '_1';
  }

  /**
   * @private
   * @param {AsiaBillCredential} credential
   * @return {string}
   */
  getUrlApi(credential) {
    if (credential.sandbox) {
      return process.env.ASIABILL_URL_TEST_MODE;
    }

    return process.env.ASIABILL_URL_LIVE_MODE;
  }
}

module.exports = AsiaBillPaymentGateway;
