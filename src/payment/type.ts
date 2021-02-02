export type CustomerAddress = {
  line1: string
  line2: string
  city: string
  country: string
  postal_code: string
  state: string
  phone: string
}

export type UrlObject = {
  cancelUrl: string
  returnUrl: string
  callbackUrl: string
}

export type OrderRequest = {
  billingAddress: CustomerAddress
  shippingAddress: CustomerAddress
  currency: string
  amount: number
  firstName: string
  lastName: string
  email: string
  urlObject: UrlObject
  isPostPurchase: boolean
  shopName: string
  reference: string
  accountId: number
}

export type OrderManagementResponse = {
  gatewayReference: string
  reference: string
  transactionType: string
  result: string
  timestamp: string
  errorCode: string
  errorMessage: string
}

export type OrderResponse = {
  accountId: string
  amount: number
  currency: string
  isTest: boolean
  reference: string
  gatewayReference: string
  isPostPurchase
  timestamp: string
  errorCode: string
  errorMessage: string
  isSuccess: boolean
  isCancel: boolean
  transactionType: string
}

export type RedirectRequest = {
  data: any
  url: string
}

// ShopBase Credential always has an isTestMode field that is a bool. All remaining fields are string
export type Credential = Record<string, string | boolean>

export interface PaymentGateway {

  getDataCreateOrder(orderRequest: OrderRequest, credential: Credential): RedirectRequest

  getOrderResponse(body: any, credential: Credential): OrderResponse

  isPostPurchase(body: any): boolean

  getRefFromResponseGateway(body: any): string

  getAccountIdFromResponseGateway(body: any): number

  capture(captureRequest, credential): Promise<OrderManagementResponse>

}
