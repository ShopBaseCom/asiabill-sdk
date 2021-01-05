const {schemaOrderRequest, schemaGetTransactionRequest, schemaCaptureOrVoidRequest} = require('./orderRequest');
const schemaCredential = require('./credential');
const sign = require('./signHelper');
const {schemaOrderResponse, schemaGetTransactionResponse, schemaCaptureOrVoidResponse} = require('./orderResponse');
const logger = require('../lib/logger');
const Joi = require('joi');
const {
  TRANSACTION_TYPE_AUTHORIZATION,
  RESULT_COMPLETED,
  RESULT_FAILED,
  RESULT_INVALID,
  RESULT_VALID,
  RESULT_RESTRICTED,
} = require('../constants');
const {TRANSACTION_STATUS} = require('./constant');
const {
  ERROR_PROCESSING_ERROR, ERROR_CARD_DECLINED, MAP_ERROR,
  PAYMENT_METHOD,
  INTERFACE_INFO,
} = require('./constant');
const Axios = require('../lib/Axios');

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
      orderResValid['orderNo'],
      orderResValid['orderAmount'],
      orderResValid['orderCurrency'],
    ]);

    // Todo check Signing mechanism
    if (signInfo !== orderResValid['signInfo']) {
      // throw new SignInvalidError('sign invalid');
    }

    if (orderResValid['orderStatus'] === TRANSACTION_STATUS.TO_BE_CONFIRMED) {
      // in case merchant should confirm and order will handle over webhook
      logger.info('order status is confirmed', orderResValid);
    }

    if (orderResValid['orderStatus'] === TRANSACTION_STATUS.PENDING) {
      // in order will handle over webhook
      logger.info('order status is pending', orderResValid);
    }

    return {
      errorCode, errorMessage,
      accountId: this.getAccountIdFromResponseGateway(orderResValid),
      reference: this.getRefFromResponseGateway(orderResValid),
      currency: orderResValid['orderCurrency'],
      amount: orderResValid['orderAmount'],
      gatewayReference: orderResValid['tradeNo'],
      isPostPurchase: this.isPostPurchase(orderResValid),
      isSuccess: orderResValid['orderStatus'] === TRANSACTION_STATUS.SUCCESS,
      isTest: credential.isTestMode,
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

    let [code, message] = orderInfo.split(':');

    let errorCode = MAP_ERROR[code];

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

    const url = credential.isTestMode ?
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

    const result = tradeInfo.orderStatus === TRANSACTION_STATUS.SUCCESS ? RESULT_COMPLETED : RESULT_FAILED;
    return {
      timestamp: new Date().toISOString(),
      accountId: getTransactionInfoReqValid.accountId,
      reference: this.getRefFromResponseGateway(tradeInfo),
      currency: tradeInfo.tradeCurrency,
      isTest: credential.isTestMode,
      amount: tradeInfo.tradeAmount,
      gatewayReference: tradeInfo.tradeNo,
      result,
      transactionType: getTransactionInfoReqValid.transactionType,
    };
  }

  /**
   * capture or void a payment
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {captureOrVoidRequest} captureOrVoidRequest
   * @param {AsiaBillCredential} credential
   * @return {Promise<orderManagementResponse>}
   */
  async captureOrVoid(captureOrVoidRequest, credential) {
    const captureOrVoidReqValid = await schemaCaptureOrVoidRequest.validateAsync(
      captureOrVoidRequest, {
        allowUnknown: true,
      },
    );

    const requestPayload = {
      merNo: credential.merNo,
      gatewayNo: credential.gatewayNo,
      tradeNo: captureOrVoidReqValid.gatewayReference,
      authType: captureOrVoidReqValid.transactionType,
      remark: captureOrVoidReqValid.accountId,
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

    const url = credential.isTestMode ?
      process.env.ASIABILL_CAPTURE_VOID_URL_TEST_MODE :
      process.env.ASIABILL_CAPTURE_VOID_URL_LIVE_MODE;

    const response = await Axios.getInstance().post(url, requestPayload);
    const captureOrVoidRes = await schemaCaptureOrVoidResponse.validateAsync(
      response.data,
      {
        allowUnknown: true,
      },
    );


    let errorCode;
    let errorMessage;

    if (captureOrVoidRes.orderStatus === TRANSACTION_STATUS.FAILURE) {
      const result = this.getErrorCodeAndMessage(
        captureOrVoidRes.orderInfo,
      );
      errorCode = result.errorCode;
      errorMessage = result.errorMessage;
    }

    const result = captureOrVoidRes.respon.orderStatus === TRANSACTION_STATUS.SUCCESS ? RESULT_COMPLETED : RESULT_FAILED;
    return {
      gatewayReference: captureOrVoidRes.respon.tradeNo,
      reference: captureOrVoidReqValid.reference,
      transactionType: captureOrVoidReqValid.transactionType,
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
   * @returns {Promise<{*}>}
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

    const url = credential.isTestMode ?
      process.env.ASIABILL_RETRIEVE_URL_TEST_MODE :
      process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE;

    const response = await Axios.getInstance().post(url, requestPayload);

    if (response.status > 201) {
      // Some errors occurred
      throw new Error('Some errors occurred. detail: ' + response.statusText);
    }

    // Just status 6 is invalid account
    const restrictedStatus = ['5'];
    const validStatus = ['-2', '-1', '0', '1', '2'];
    const errorStatus = ['7', '999'];

    const tradeInfo = response.data.response.tradeinfo;

    if (errorStatus.indexOf(tradeInfo.queryResult) > -1) {
      throw new Error('Some errors occurred. detail: ' + response.statusText);
    }

    if (validStatus.indexOf(tradeInfo.queryResult) > -1) {
      return {
        status: RESULT_VALID,
      };
    }

    if (restrictedStatus.indexOf(tradeInfo.queryResult) > -1) {
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
    if (credential.isTestMode) {
      return process.env.ASIABILL_URL_TEST_MODE;
    }

    return process.env.ASIABILL_URL_LIVE_MODE;
  }
}

module.exports = AsiaBillPaymentGateway;
