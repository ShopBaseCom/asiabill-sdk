/**
 * @jest-environment node
 */

const {ValidationError} = require('joi');
const AsiaBill = require('../src/asiabill/PaymentGateway');
const {PaymentMethod} = require('../src/asiabill/constant');
const {UrlLiveMore, UrlTestMode} = require('../src/asiabill/constant');

/**
 * @type {customerAddress}
 */
const address = {
  phone: '0123456789',
  state: 'New York',
  postal_code: '10000',
  country: 'US',
  city: 'New York',
  line1: 'some where',
  line2: 'some where',
};

/**
 * @type {orderRequest}
 */
const orderRequest = {
  currency: 'USD',
  amount: 100,
  returnUrl: '',
  firstName: 'quan',
  lastName: 'kun',
  email: 'demo@gmail.com',
  shippingAddress: address,
  billingAddress: address,
};
/**
 * @type {AsiaBillCredential}
 */
const credential = {
  gatewayNo: '123',
  merNo: '12345',
  isTestMode: false,
  signKey: '123456',
};

test('make AsianBill wrong config should throw error', () => {
  const mapExpect = new Map([
    [
      null, '"value" must be of type object'],
    [
      {
        gatewayNo: 123,
        merNo: '123',
        isTestMode: false,
        signKey: '123456',
      }, '"gatewayNo" must be a string'],
    [
      {
        gatewayNo: '123',
        merNo: 123,
        isTestMode: false,
        signKey: '123456',
      }, '"merNo" must be a string'],
  ]);

  for (const [payload, error] of mapExpect.entries()) {
    expect(() => new AsiaBill(payload)).toThrow(ValidationError);
    expect(() => new AsiaBill(payload)).toThrowError(error);
  }
});

test('make AsianBill asiabill config should success', () => {
  expect(new AsiaBill(credential)).toBeInstanceOf(AsiaBill);
});

describe('AsianBill create order wrong request should throw error', () => {
  const mapExpect = new Map([
    [orderRequest, '"value" must be of type object'],

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
    [{...orderRequest, email: 'a123123'}, '"email" must be a number'],
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
  ]);

  for (const [request, error] of mapExpect.entries()) {
    new AsiaBill(credential).getDataCreateOrder(request).catch((err) => {
      expect(err.message).toBe(error);
    });
  }
},
);


describe('AsiaBill create order', () => {
  test('should return url live mode', async () => {
    const result = await (new AsiaBill({
      ...credential, isTestMode: true,
    })).getDataCreateOrder(
        orderRequest);

    expect(result.url).toBe(UrlTestMode);
  });

  test('should return url test mode', async () => {
    const result = await (new AsiaBill({
      ...credential, isTestMode: false,
    })).getDataCreateOrder(orderRequest);

    expect(result.url).toBe(UrlLiveMore);
  });

  test('should create success with data match', async () => {
    const asiaBill = new AsiaBill(credential);
    // try {
    await asiaBill.getDataCreateOrder(orderRequest).then(({data}) => {
      expect(data).toStrictEqual({
        merNo: credential.merNo,
        gatewayNo: credential.gatewayNo,
        // orderNo: 'my value',
        orderCurrency: orderRequest.currency,
        orderAmount: orderRequest.amount,
        returnUrl: 'my value',
        callbackUrl: 'my value',
        // interfaceInfo: 'my value',
        // goods_detail: 'my value',
        signInfo: 'my value',
        paymentMethod: PaymentMethod,
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
      });
    });
  });
});
