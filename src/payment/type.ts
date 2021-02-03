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

export type OrderManagementRequest = {
  accountId: string
  reference: string
  gatewayReference: string
  transactionType: string
}

export type CheckCredentialsRequest = {
  shopId: number
  gatewayCredentials: any
}

export type ValidateCredentialResponse = {
  status: StatusCheckCredential
}

export type RefundRequest = {
  accountId: string
  reference: string
  gatewayReference: string
  transactionType: string
  amount: number
  currency: string
  refundReason: string
}

// ShopBase Credential always has an isTestMode field that is a bool. All remaining fields are string
export type Credential = Record<string, string | boolean>
export type StatusCheckCredential = string
export type StatusTransaction = string

export interface PaymentGateway {

  getDataCreateOrder(orderRequest: OrderRequest, credential: Credential): RedirectRequest

  getOrderResponse(body: object, credential: Credential): OrderResponse

  isPostPurchase(body: object): boolean

  getRefFromResponseGateway(body: object): string

  getAccountIdFromResponseGateway(body: object): number

  validateCredential(credential: Credential): Promise<ValidateCredentialResponse>

  capture(captureRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse>

  void(voidRequest: OrderManagementRequest, credential: Credential): Promise<OrderManagementResponse>

  getOrderResponseFromWebhook(body: object, credential: Credential): Promise<OrderResponse>

}
