import type { Credential, CustomerAddress, OrderRequest }   from '../src/payment/type';
import AsiaBillGateway                                      from '../src/payment/asabill/Gateway';
import * as Joi                                             from 'joi';
import * as signHelper                                      from '../src/payment/asabill/signHelper';
import { MAP_ERROR, TRANSACTION_STATUS, TRANSACTION_TYPES } from '../src/payment/asabill/constant';
import { TRANSACTION_TYPE_CAPTURE, TRANSACTION_TYPE_VOID }  from '../src/http/constant/transactionType';
import Axios                                                from '../src/lib/Axios';
import axios                                                from 'axios'
import { RESULT_COMPLETED, RESULT_FAILED }                  from '../src/http/constant/statusTransaction';
import { RESULT_RESTRICTED, RESULT_VALID }                  from '../src/http/constant/statusCredential';
import redis                                                from '../src/lib/redis';
import type { Callback }                                    from 'redis';

process.env.ASIABILL_CAPTURE_VOID_URL_TEST_MODE = 'ASIABILL_CAPTURE_VOID_URL_TEST_MODE'
process.env.ASIABILL_CAPTURE_VOID_URL_LIVE_MODE = 'ASIABILL_CAPTURE_VOID_URL_LIVE_MODE'
process.env.ASIABILL_RETRIEVE_URL_TEST_MODE = 'ASIABILL_RETRIEVE_URL_TEST_MODE'
process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE = 'ASIABILL_RETRIEVE_URL_LIVE_MODE'
process.env.ASIABILL_CACHE_KEY_TRANO = 'ASIABILL_CACHE_KEY_TRANO'
process.env.ASIABILL_URL_LIVE_MODE = 'live_mode'
process.env.ASIABILL_URL_TEST_MODE = 'test_mode'

function mockAxios(params: Record<string, any>): Function {
  const getInstanceTmp = Axios.getInstance
  // @ts-ignore
  Axios.getInstance = () => ({
    ...axios.create(),
    ...params
  })
  return function () {
    // @ts-ignore
    Axios.getInstance = getInstanceTmp
  }
}

function mockRedis(mockFun: Function): { mockFun: (key: string, cb?: Callback<string | null>) => boolean; close: () => void } {
  const getTmp = redis.get
  // @ts-ignore
  redis.get = jest.fn(mockFun)
  return {
    mockFun: redis.get,
    close: function () {
      // @ts-ignore
      redis.get = getTmp
    }
  }
}

function mockSignHelper(mockFun: Function): { mockFun: (signValues: any[]) => string; close: () => void } {
  const signTmp = signHelper.sign
  // @ts-ignore
  signHelper.sign = jest.fn(mockFun)
  return {
    mockFun: signHelper.sign,
    close: function () {
      // @ts-ignore
      signHelper.sign = signTmp
    }
  }
}

jest.mock('../src/lib/logger')

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
  sandbox: false,
  signKey: '123456',
};

describe('AsiaBill', () => {

    describe('validate credential', () => {
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
            AsiaBillGateway.validateSchemaCredential(cre as Credential);
            throw new Error('test case should throw error')
          } catch (e) {
            expect(e.message).toBe(error);
            expect(e).toBeInstanceOf(Joi.ValidationError);
          }
        });
      }
    })

    describe('create order', () => {

      it('should get url from env live mode', () => {
        expect(new AsiaBillGateway().getRequestCreateOrder(orderRequest, {
          ...credential,
          sandbox: false
        }).url).toBe('live_mode')
      })

      it('should get url from env test mode', () => {
        expect(new AsiaBillGateway().getRequestCreateOrder(orderRequest, {
          ...credential,
          sandbox: true
        }).url).toBe('test_mode')
      })

      it('should sign data', () => {
        const {mockFun, close} = mockSignHelper(() => 'vietlungtung')
        const res = new AsiaBillGateway().getRequestCreateOrder(orderRequest, credential)
        expect(res.data.signInfo).toBe('vietlungtung')
        expect(mockFun).toHaveBeenCalled()
        expect(mockFun).toHaveBeenCalledWith([
          credential.merNo,
          credential.gatewayNo,
          orderRequest.reference,
          orderRequest.currency,
          orderRequest.amount,
          orderRequest.urlObject.returnUrl,
          credential.signKey,
        ])
        close()
      })

      it('post purchase should change orderNo', () => {
        const normal = new AsiaBillGateway().getRequestCreateOrder({...orderRequest, isPostPurchase: false}, credential)
        const postPurchase = new AsiaBillGateway().getRequestCreateOrder({
          ...orderRequest,
          isPostPurchase: true
        }, credential)

        expect(normal.data.orderNo).not.toBe(postPurchase.data.orderNo)
        expect(postPurchase.data.orderNo).toBe(normal.data.orderNo + '_1')
      })
    })

    describe.skip('get order response should detect error from orderInfo', () => {
      const orderResponse = {
        orderAmount: 1000,
        orderCurrency: 'USD',
        orderNo: 'orderNo',
        tradeNo: 'tradeNo',
        remark: 'remark',
        orderInfo: 'orderInfo',
        orderStatus: TRANSACTION_STATUS.FAILURE,
        signInfo: 'signInfo',
      }
      for (let key in MAP_ERROR) {
        const normal = new AsiaBillGateway().getOrderResponse({
          ...orderResponse,
          orderInfo: `${key}:message`
        }, credential)
        it(`detect error patent ${key}:message`, () => {
          expect(normal.errorCode).toBe(MAP_ERROR[key])
          expect(normal.errorMessage).toBe("message")
        })
      }

      for (let key in MAP_ERROR) {
        const normal = new AsiaBillGateway().getOrderResponse({
          ...orderResponse,
          orderInfo: `${key}:field:message`
        }, credential)
        it(`detect error patent ${key}:field:message`, () => {
          expect(normal.errorCode).toBe(MAP_ERROR[key])
          expect(normal.errorMessage).toBe("Field: Message")
        })
      }
    })

    describe.skip('validate request', () => {
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

    describe('validate credential', () => {
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
        it(`credential should throw error: ${error}`, function () {
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

    it('should return success data', () => {
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
        url: process.env.ASIABILL_URL_LIVE_MODE
      });
    })

    describe('is post purchase', () => {
      it('should detect transaction post purchase', () => {
        expect(new AsiaBillGateway().isPostPurchase({orderNo: '123'})).toBe(false)
      })
      it('should detect transaction post purchase', () => {
        expect(new AsiaBillGateway().isPostPurchase({orderNo: '123_1'})).toBe(true)
      })
    })

    describe('capture order', () => {

      it('should sign request before sending capture to gateway', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.SUCCESS.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {mockFun, close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        await asiaBill.capture({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, credential)
        expect(mockFun).toHaveBeenCalledWith([
          credential.merNo,
          credential.gatewayNo,
          'gatewayReference',
          TRANSACTION_TYPES.CAPTURE,
          credential.signKey,
        ])
        expect(postRequest).toHaveBeenCalledWith(process.env.ASIABILL_CAPTURE_VOID_URL_LIVE_MODE, {
          "merNo": "12345",
          "gatewayNo": "123",
          "tradeNo": "gatewayReference",
          "authType": 1,
          "remark": "accountlungtung",
          "signInfo": "vietlungtung"
        })
        closeAxios()
        close()
      })

      it('should return success when gateway response success', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.SUCCESS.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.capture({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, {...credential, sandbox: true})
        expect(rs.result).toBe(RESULT_COMPLETED)
        expect(rs.transactionType).toBe(TRANSACTION_TYPE_CAPTURE)
        expect(rs.gatewayReference).toBe('tradeNo')
        closeAxios()
        close()
      })

      it('should return fail when gateway response fail', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.FAILURE.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.capture({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, {...credential, sandbox: true})
        expect(rs.result).toBe(RESULT_FAILED)
        expect(rs.transactionType).toBe(TRANSACTION_TYPE_CAPTURE)
        expect(rs.gatewayReference).toBe('tradeNo')
        closeAxios()
        close()
      })

    })
    describe('void transaction', () => {

      it('should sign request before sending void to gateway', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.SUCCESS.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {mockFun, close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        await asiaBill.void({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_VOID
        }, credential)
        expect(mockFun).toHaveBeenCalledWith([
          credential.merNo,
          credential.gatewayNo,
          'gatewayReference',
          TRANSACTION_TYPES.VOID,
          credential.signKey,
        ])
        expect(postRequest).toHaveBeenCalledWith(process.env.ASIABILL_CAPTURE_VOID_URL_LIVE_MODE, {
          "merNo": "12345",
          "gatewayNo": "123",
          "tradeNo": "gatewayReference",
          "authType": TRANSACTION_TYPES.VOID,
          "remark": "accountlungtung",
          "signInfo": "vietlungtung"
        })
        closeAxios()
        close()
      })

      it('should return success when gateway response success', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.SUCCESS.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.void({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_VOID
        }, {...credential, sandbox: true})
        expect(rs.result).toBe(RESULT_COMPLETED)
        expect(rs.transactionType).toBe(TRANSACTION_TYPE_VOID)
        expect(rs.gatewayReference).toBe('tradeNo')
        closeAxios()
        close()
      })

      it('should return fail when gateway response fail', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            respon: {
              merNo: 'merNo',
              gatewayNo: 'gatewayNo',
              tradeNo: 'tradeNo',
              orderNo: 'orderNo',
              orderStatus: TRANSACTION_STATUS.FAILURE.toString(),
              orderInfo: 'orderInfo',
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.void({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_VOID
        }, {...credential, sandbox: true})
        expect(rs.result).toBe(RESULT_FAILED)
        expect(rs.transactionType).toBe(TRANSACTION_TYPE_VOID)
        expect(rs.gatewayReference).toBe('tradeNo')
        closeAxios()
        close()
      })

    })

    describe('validate credential', () => {
      const mapStatus = {
        [TRANSACTION_STATUS.MERCHANT_GATEWAY_ACCESS_ERROR]: RESULT_RESTRICTED,
        [TRANSACTION_STATUS.TO_BE_CONFIRMED]: RESULT_VALID,
        [TRANSACTION_STATUS.PENDING]: RESULT_VALID,
        [TRANSACTION_STATUS.FAILURE]: RESULT_VALID,
        [TRANSACTION_STATUS.SUCCESS]: RESULT_VALID,
        [TRANSACTION_STATUS.ORDER_DOES_NOT_EXIST]: RESULT_VALID,
      }

      for (let transactionStatus in mapStatus) {
        it(`error code ${transactionStatus} should return status ${mapStatus[transactionStatus]}`, async () => {
          const postRequest = jest.fn(() => ({data: {response: {tradeinfo: {queryResult: transactionStatus}}}}))
          const closeAxios = mockAxios({post: postRequest})

          const {mockFun, close} = mockSignHelper(() => 'vietlungtung')

          const asiaBill = new AsiaBillGateway()
          const rs = await asiaBill.validateCredential(credential)
          expect(rs.status).toBe(mapStatus[transactionStatus])
          expect(mockFun).toHaveBeenCalled()
          closeAxios()
          close()
        })
      }
    })

    describe('get transaction', () => {
      it('should sign request before sending capture to gateway', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            response: {
              tradeinfo: {
                merNo: 'merNo',
                gatewayNo: 'gatewayNo',
                orderNo: 'orderNo',
                tradeNo: 'tradeNo',
                tradeDate: 'tradeDate',
                tradeAmount: 100,
                tradeCurrency: 'tradeCurrency',
                sourceWebsite: 'sourceWebsite',
                authStatus: 'authStatus',
                queryResult: TRANSACTION_STATUS.SUCCESS,
              },
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})
        const redis = mockRedis(() => "someOrderNo")

        const {mockFun, close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        await asiaBill.getTransaction({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, credential)
        expect(mockFun).toHaveBeenCalledWith([
          credential.merNo,
          credential.gatewayNo,
          credential.signKey,
        ])
        expect(postRequest).toHaveBeenCalledWith(process.env.ASIABILL_RETRIEVE_URL_LIVE_MODE, {
          "merNo": "12345",
          "gatewayNo": "123",
          "signInfo": "vietlungtung",
          "orderNo": "someOrderNo"
        })
        expect(redis.mockFun).toHaveBeenCalledWith(`${process.env.ASIABILL_CACHE_KEY_TRANO}/gatewayReference`)
        closeAxios()
        close()
        redis.close()
      })

      it('should return success when gateway response success', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            response: {
              tradeinfo: {
                merNo: 'merNo',
                gatewayNo: 'gatewayNo',
                orderNo: 'orderNo',
                tradeNo: 'tradeNo',
                tradeDate: "2021-02-04T20:53:59.093Z",
                tradeAmount: '100',
                tradeCurrency: 'tradeCurrency',
                sourceWebsite: 'sourceWebsite',
                authStatus: 'authStatus',
                queryResult: TRANSACTION_STATUS.SUCCESS,
              },
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})
        const redis = mockRedis(() => "someOrderNo")

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.getTransaction({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, credential)

        expect(rs).toEqual({
          "accountId": "accountlungtung",
          "amount": 100,
          "currency": "tradeCurrency",
          "gatewayReference": "tradeNo",
          "isSuccess": true,
          "isTest": false,
          "reference": "orderNo",
          "timestamp": "2021-02-04T20:53:59.093Z",
          "transactionType": TRANSACTION_TYPE_CAPTURE
        })

        closeAxios()
        close()
        redis.close()
      })

      it('should return fail when gateway response fail', async () => {
        const postRequest = jest.fn(() => ({
          data: {
            response: {
              tradeinfo: {
                merNo: 'merNo',
                gatewayNo: 'gatewayNo',
                orderNo: 'orderNo',
                tradeNo: 'tradeNo',
                tradeDate: "2021-02-04T20:53:59.093Z",
                tradeAmount: '100',
                tradeCurrency: 'tradeCurrency',
                sourceWebsite: 'sourceWebsite',
                authStatus: 'authStatus',
                queryResult: 'ASDAS',
              },
            },
          }
        }))
        const closeAxios = mockAxios({post: postRequest})
        const redis = mockRedis(() => "someOrderNo")

        const {close} = mockSignHelper(() => 'vietlungtung')

        const asiaBill = new AsiaBillGateway()
        const rs = await asiaBill.getTransaction({
          reference: 'demo ref',
          accountId: 'accountlungtung',
          gatewayReference: 'gatewayReference',
          transactionType: TRANSACTION_TYPE_CAPTURE
        }, {...credential, sandbox: false})

        expect(rs).toEqual({
          "accountId": "accountlungtung",
          "amount": 100,
          "currency": "tradeCurrency",
          "gatewayReference": "tradeNo",
          "isSuccess": false,
          "isTest": false,
          "reference": "orderNo",
          "timestamp": "2021-02-04T20:53:59.093Z",
          "transactionType": TRANSACTION_TYPE_CAPTURE
        })

        closeAxios()
        close()
        redis.close()
      })
    })
  },
);
