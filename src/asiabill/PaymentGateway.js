const axios = require('axios');
const qs = require('qs');
const {schemaOrderRequest, schemaGetTransactionRequest} = require('./orderRequest');
const schemaCredential = require('./credential');
const sign = require('./signHelper');
const schemaOrderResponse = require('./orderResponse');
const logger = require('../lib/logger');
const Joi = require('joi');
const {TRANSACTION_STATUS} = require('./constant');
const {
  ERROR_PROCESSING_ERROR, ERROR_CARD_DECLINED, MAP_ERROR,
  PAYMENT_METHOD,
  INTERFACE_INFO,
} = require('./constant');

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

    redirectRequest.data.signInfo = sign(credential, redirectRequest.data);

    return redirectRequest;
  }

  /**
   * get accountId from body response gateway
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {Object} body
   * @return {number}
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

    const signInfo = sign(credential, {
      orderNo: orderResValid['orderNo'],
      // Todo check Signing mechanism
      returnUrl: '',
      orderAmount: orderResValid['orderAmount'],
      orderCurrency: orderResValid['orderCurrency'],
    });

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
   * transform, validate and sign request from ShopBase to gateway
   * @public
   * @throws {Joi.ValidationError} will throw when validate fail
   * @param {getTransactionRequest} getTransactionRequest
   * @return {Promise<orderResponse>}
   */
  async getTransactionHandler(getTransactionRequest) {
    const getTransactionInfoReqValid = await schemaGetTransactionRequest.validateAsync(
        getTransactionRequest, {
          allowUnknown: true,
        },
    );
    const orderNo = getTransactionInfoReqValid.reference;

    const url = this.credential.isTestMode ?
      `https://sandbox-pay.asiabill.com:8083/ACI/servlet/NormalCustomerCheck` :
      `https://api.asiabill.com/servlet/NormalCustomerCheck`;

    const requestPayload = {
      merNo: this.credential.merNo,
      gatewayNo: this.credential.gatewayNo,
      orderNo: orderNo,
    };

    requestPayload.signInfo = sign(
        this.credential,
        requestPayload,
    );

    return await axios.post(
        url,
        qs.stringify(requestPayload),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
    );
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
