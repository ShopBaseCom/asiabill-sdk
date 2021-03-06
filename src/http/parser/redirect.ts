import { OrderRequest }       from '../../payment/type';
import Joi                    from 'joi';
import ShopBaseSigner         from '../../lib/Signer';
import { SignInvalidError }   from '../../payment/error';


export const schemaRedirectRequest = Joi.object({
  x_account_id: Joi.string().required(),
  x_amount: Joi.number().required(),
  x_currency: Joi.string().max(3).required(),
  x_reference: Joi.string().required(),
  x_shop_name: Joi.string().required(),
  x_test: Joi.bool().required(),
  x_url_callback: Joi.string().required(),
  x_url_cancel: Joi.string().required(),
  x_url_complete: Joi.string().required(),
  x_customer_billing_address_1: Joi.string(),
  x_customer_billing_address_2: Joi.string(),
  x_customer_billing_city: Joi.string(),
  x_customer_billing_company: Joi.string(),
  x_customer_billing_country: Joi.string().max(2).required(),
  x_customer_billing_phone: Joi.string().optional(),
  x_customer_billing_state: Joi.string().optional(),
  x_customer_billing_zip: Joi.string(),
  x_customer_email: Joi.string(),
  x_customer_first_name: Joi.string().optional(),
  x_customer_last_name: Joi.string(),
  x_customer_phone: Joi.string().optional(),
  x_customer_shipping_address_1: Joi.string(),
  x_customer_shipping_address_2: Joi.string(),
  x_customer_shipping_city: Joi.string(),
  x_customer_shipping_company: Joi.string(),
  x_customer_shipping_country: Joi.string().max(2).required(),
  x_customer_shipping_first_name: Joi.string().optional(),
  x_customer_shipping_last_name: Joi.string(),
  x_customer_shipping_phone: Joi.string().optional(),
  x_customer_shipping_state: Joi.string().optional(),
  x_post_purchase: Joi.bool(),
  x_customer_shipping_zip: Joi.string(),
  x_signature: Joi.string(),
  purchase_items: Joi.string().optional(),
});

export async function parseOrderRequest(request: any): Promise<OrderRequest> {
  const value = await schemaRedirectRequest.validateAsync(request);

  if (!ShopBaseSigner.verify(request, value['x_signature'])) {
    throw new SignInvalidError('signature invalid');
  }

  return {
    accountId: value['x_account_id'],
    billingAddress: {
      country: value['x_customer_billing_country'],
      phone: value['x_customer_billing_phone'],
      postal_code: value['x_customer_billing_zip'],
      line1: value['x_customer_billing_address_1'],
      city: value['x_customer_billing_city'],
      state: value['x_customer_billing_state'],
      line2: value['x_customer_billing_address_2'],
    },
    urlObject: {
      callbackUrl: value['x_url_callback'],
      returnUrl: value['x_url_complete'],
      cancelUrl: value['x_url_cancel'],
    },
    firstName: value['x_customer_first_name'],
    lastName: value['x_customer_last_name'],
    currency: value['x_currency'],
    amount: value['x_amount'],
    email: value['x_customer_email'],
    reference: value['x_reference'],
    shippingAddress: {
      country: value['x_customer_shipping_country'],
      phone: value['x_customer_shipping_phone'],
      postal_code: value['x_customer_shipping_zip'],
      line1: value['x_customer_shipping_address_1'],
      city: value['x_customer_shipping_city'],
      state: value['x_customer_shipping_state'],
      line2: value['x_customer_shipping_address_2'],
    },
    shopName: value['x_shop_name'],
    isPostPurchase: value['x_post_purchase'],
    purchaseItems: value['purchase_items'] ? JSON.parse(value['purchase_items']) : null,
  };
}
