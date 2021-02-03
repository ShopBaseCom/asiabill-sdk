import type { Credential, CustomerAddress, OrderRequest } from '../src/payment/type';
import AsiaBillGateway                                    from '../src/payment/asabill/Gateway';
import * as Joi                                           from 'joi';

const address: CustomerAddress = {
  phone: '0123456789',
  state: 'New York',
  postal_code: '10000',
  country: 'US',
  city: 'New York',
  line1: 'some where',
  line2: 'some where',
};

const orderRequest: OrderRequest = {
  reference: 'reflungtung',
  accountId: 1,
  isPostPurchase: false,
  shopName: 'shoplungtung',
  urlObject: {
    callbackUrl: 'callbackUrl',
    cancelUrl: 'cancelUrl',
    returnUrl: 'returnUrl',
  },
  currency: 'USD',
  amount: 100,
  firstName: 'quan',
  lastName: 'kun',
  email: 'demo@gmail.com',
  shippingAddress: address,
  billingAddress: address,
};

const credential: Credential = {
  gatewayNo: '123',
  merNo: '12345',
  isTestMode: false,
  signKey: '123456',
};

describe('AsiaBill request create order', () => {
    describe('should validate request', () => {
      const testCases = [
        [null, "create order request is required"],
        [{...orderRequest, currency: undefined}, '"currency" is required'],
        [{...orderRequest, currency: 1}, '"currency" must be a string'],
        [
          {...orderRequest, currency: 'a'.padStart(10)},
          '"currency" length must be less than or equal to 3 characters long'],

        [{...orderRequest, amount: undefined}, '"amount" is required'],
        [{...orderRequest, amount: 'a123123'}, '"amount" must be a number'],
        [
          {...orderRequest, amount: '10000000000'},
          '"amount" must be less than or equal to 1000000000'],

        [{...orderRequest, firstName: undefined}, '"firstName" is required'],
        [{...orderRequest, firstName: 12312}, '"firstName" must be a string'],
        [
          {...orderRequest, firstName: 'a'.padStart(101)},
          '"firstName" length must be less than or equal to 100 characters long'],

        [{...orderRequest, lastName: undefined}, '"lastName" is required'],
        [{...orderRequest, lastName: 32423}, '"lastName" must be a string'],
        [
          {...orderRequest, lastName: 'a'.padStart(51)},
          '"lastName" length must be less than or equal to 50 characters long'],

        [{...orderRequest, email: undefined}, '"email" is required'],
        [{...orderRequest, email: 12321}, '"email" must be a string'],
        [
          {...orderRequest, email: 'a'.padStart(201)},
          '"email" length must be less than or equal to 200 characters long'],

        [
          {...orderRequest, billingAddress: undefined},
          '"billingAddress" is required'],
        [
          {...orderRequest, billingAddress: null},
          '"billingAddress" must be of type object'],
        [
          {...orderRequest, billingAddress: {...address, phone: null}},
          '"billingAddress.phone" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, phone: 123}},
          '"billingAddress.phone" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, phone: 'a'.padStart(51)},
          },
          '"billingAddress.phone" length must be less than or equal to 50' +
          ' characters long'],
        [
          {...orderRequest, billingAddress: {...address, country: null}},
          '"billingAddress.country" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, country: 123}},
          '"billingAddress.country" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, country: 'a'.padStart(1001)},
          },
          '"billingAddress.country" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, billingAddress: {...address, state: null}},
          '"billingAddress.state" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, state: 123}},
          '"billingAddress.state" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, state: 'a'.padStart(1001)},
          },
          '"billingAddress.state" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, billingAddress: {...address, city: null}},
          '"billingAddress.city" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, city: 123}},
          '"billingAddress.city" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, city: 'a'.padStart(101)},
          },
          '"billingAddress.city" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, billingAddress: {...address, line1: null}},
          '"billingAddress.line1" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, line1: 123}},
          '"billingAddress.line1" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, line1: 'a'.padStart(501)},
          },
          '"billingAddress.line1" length must be less than or equal to 500' +
          ' characters long'],
        [
          {...orderRequest, billingAddress: {...address, postal_code: null}},
          '"billingAddress.postal_code" must be a string'],
        [
          {...orderRequest, billingAddress: {...address, postal_code: 123}},
          '"billingAddress.postal_code" must be a string'],
        [
          {
            ...orderRequest,
            billingAddress: {...address, postal_code: 'a'.padStart(101)},
          },
          '"billingAddress.postal_code" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: undefined},
          '"shippingAddress" is required'],
        [
          {...orderRequest, shippingAddress: null},
          '"shippingAddress" must be of type object'],
        [
          {...orderRequest, shippingAddress: {...address, phone: null}},
          '"shippingAddress.phone" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, phone: 123}},
          '"shippingAddress.phone" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, phone: 'a'.padStart(51)},
          },
          '"shippingAddress.phone" length must be less than or equal to 50' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: {...address, country: null}},
          '"shippingAddress.country" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, country: 123}},
          '"shippingAddress.country" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, country: 'a'.padStart(1001)},
          },
          '"shippingAddress.country" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: {...address, state: null}},
          '"shippingAddress.state" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, state: 123}},
          '"shippingAddress.state" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, state: 'a'.padStart(1001)},
          },
          '"shippingAddress.state" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: {...address, city: null}},
          '"shippingAddress.city" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, city: 123}},
          '"shippingAddress.city" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, city: 'a'.padStart(101)},
          },
          '"shippingAddress.city" length must be less than or equal to 100' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: {...address, line1: null}},
          '"shippingAddress.line1" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, line1: 123}},
          '"shippingAddress.line1" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, line1: 'a'.padStart(501)},
          },
          '"shippingAddress.line1" length must be less than or equal to 500' +
          ' characters long'],
        [
          {...orderRequest, shippingAddress: {...address, postal_code: null}},
          '"shippingAddress.postal_code" must be a string'],
        [
          {...orderRequest, shippingAddress: {...address, postal_code: 123}},
          '"shippingAddress.postal_code" must be a string'],
        [
          {
            ...orderRequest,
            shippingAddress: {...address, postal_code: 'a'.padStart(101)},
          },
          '"shippingAddress.postal_code" length must be less than or equal to 100' +
          ' characters long'],
      ]

      for (let [request, error] of testCases) {
        it(`sets error ${error}`, function () {
          try {
            new AsiaBillGateway().getRequestCreateOrder(request as OrderRequest, credential);
            throw new Error('test case should throw error')
          } catch (e) {
            expect(e.message).toBe(error);
            expect(e).toBeInstanceOf(Joi.ValidationError);
          }
        });
      }
    })

    describe('should validate credential', () => {
      const testCases = [
        [{...credential, merNo: undefined}, '"merNo" is required'],
        [{...credential, merNo: 1}, '"merNo" must be a string'],
        [{...credential, merNo: ""}, '"merNo" is not allowed to be empty'],
        [{...credential, merNo: '1'.padStart(6)}, '"merNo" length must be less than or equal to 5 characters long'],
        [{...credential, gatewayNo: undefined}, '"gatewayNo" is required'],
        [{...credential, gatewayNo: 1}, '"gatewayNo" must be a string'],
        [{...credential, gatewayNo: ""}, '"gatewayNo" is not allowed to be empty'],
        [{
          ...credential,
          gatewayNo: '1'.padStart(9)
        }, '"gatewayNo" length must be less than or equal to 8 characters long'],
        [{...credential, signKey: undefined}, '"signKey" is required'],
        [{...credential, signKey: 1}, '"signKey" must be a string'],
        [{...credential, signKey: ""}, '"signKey" is not allowed to be empty'],
        [{
          ...credential,
          signKey: '1'.padStart(101)
        }, '"signKey" length must be less than or equal to 100 characters long'],
      ]

      for (let [cre, error] of testCases) {
        it(`sets error ${error}`, function () {
          try {
            new AsiaBillGateway().getRequestCreateOrder(orderRequest, cre as Credential);
            throw new Error('test case should throw error')
          } catch (e) {
            expect(e.message).toBe(error);
            expect(e).toBeInstanceOf(Joi.ValidationError);
          }
        });
      }
    })

    describe('should return success data', () => {
      const res = new AsiaBillGateway().getRequestCreateOrder(orderRequest, credential);
      expect(res).toEqual({
        "data": {
          "address": "some where",
          "callbackUrl": "callbackUrl",
          "city": "New York",
          "country": "US",
          "email": "demo@gmail.com",
          "firstName": "quan",
          "gatewayNo": "123",
          "interfaceInfo": "ShopBase",
          "lastName": "kun",
          "merNo": "12345",
          "orderAmount": 100,
          "orderCurrency": "USD",
          "orderNo": "reflungtung",
          "paymentMethod": "Credit Card",
          "phone": "0123456789",
          "remark": 1,
          "returnUrl": "returnUrl",
          "shipAddress": "some where",
          "shipCity": "New York",
          "shipCountry": "US",
          "shipFirstName": "quan",
          "shipLastName": "kun",
          "shipPhone": "0123456789",
          "shipState": "New York",
          "shipZip": "10000",
          "state": "New York",
          "zip": "10000",
          "signInfo": "9d00b3640e01ba21b64022f2338455de47e0aa9fcc896e44c99d0ed05c05caa3",
        },
      });
    })
  },
);
