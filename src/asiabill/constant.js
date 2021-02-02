/* eslint-disable max-len */
const {
  ERROR_CARD_DECLINED,
  ERROR_ACCOUNT_INVALID,
  ERROR_ACCOUNT_RESTRICTED,
  ERROR_CALLER_ISSUER,
  ERROR_PROCESSING_ERROR,
  ERROR_PAYMENT_NOT_SUPPORTED,
  ERROR_VALIDATION_ERROR,
} = require('../constants');
const PAYMENT_METHOD = 'Credit Card';
const INTERFACE_INFO = 'ShopBase';

const MAP_ERROR = {
  I0001: ERROR_ACCOUNT_INVALID, // IMerchant Number cannot be empty!
  I0002: ERROR_ACCOUNT_INVALID, // Gateway Number cannot empty!
  I0003: ERROR_ACCOUNT_INVALID, // Gateway of Merchant Number cannot be empty
  I0004: ERROR_ACCOUNT_INVALID, // Gateway of Merchant Number is incorrect
  I0005: ERROR_ACCOUNT_RESTRICTED, // Merchant Number is not actived
  I0006: ERROR_ACCOUNT_RESTRICTED, // Merchant Number is disabled
  I0007: ERROR_ACCOUNT_RESTRICTED, // Merchant Number is canceled
  I0008: ERROR_ACCOUNT_INVALID, // The state of merchant Number is anomalous
  I0009: ERROR_ACCOUNT_RESTRICTED, // Gateway Number is not actived
  I0010: ERROR_ACCOUNT_RESTRICTED, // Gateway Number is disabled
  I0011: ERROR_ACCOUNT_RESTRICTED, // Gateway Number is canceled
  I0012: ERROR_ACCOUNT_INVALID, // The state of gateway Number is anomalous
  I0013: ERROR_PROCESSING_ERROR, // Invalid Encryption Value (signinfo)
  I0014: ERROR_ACCOUNT_INVALID, // Testing Gateway No. posting transaction to a Production URL
  I0015: ERROR_ACCOUNT_INVALID, // Production Gateway No. posting transaction to a Testing URL
  I0016: ERROR_ACCOUNT_INVALID, // The gateway Number does not blind the interface
  I0017: ERROR_ACCOUNT_INVALID, // Merchant order Number is empty
  I0018: ERROR_PROCESSING_ERROR, // Order Number cannot exceed 50 characters
  I0019: ERROR_PROCESSING_ERROR, // Order value cannot be empty
  I0020: ERROR_PROCESSING_ERROR, // Order value is incorrect
  I0021: ERROR_PROCESSING_ERROR, // The decimal place of order value should be between 0-2 digit
  I0022: ERROR_PROCESSING_ERROR, // Order currency is empty
  I0023: ERROR_PROCESSING_ERROR, // Order currency is incorrect
  I0024: ERROR_PROCESSING_ERROR, // Return URL cannot be empty
  I0025: ERROR_PROCESSING_ERROR, // The length of returning URL cannot exceed 1000 characters
  I0026: ERROR_VALIDATION_ERROR, // Card No cannot be empty
  I0027: ERROR_VALIDATION_ERROR, // Please input 13 or 16 digit
  I0028: ERROR_VALIDATION_ERROR, // Please input number
  I0029: ERROR_VALIDATION_ERROR, // Card Number should begin with 4 or 5
  I0030: ERROR_VALIDATION_ERROR, // Card Number is incorrect
  I0031: ERROR_VALIDATION_ERROR, // Month cannot be empty
  I0032: ERROR_VALIDATION_ERROR, // Please input double digit only;
  I0033: ERROR_VALIDATION_ERROR, // Please input numbers only
  I0034: ERROR_VALIDATION_ERROR, // The month should be between 1-12
  I0035: ERROR_VALIDATION_ERROR, // Year cannot be empty
  I0036: ERROR_VALIDATION_ERROR, // Please input 4-digit only
  I0037: ERROR_VALIDATION_ERROR, // Please input numbers only
  I0038: ERROR_VALIDATION_ERROR, // Year and month cannot be smaller than current date and greater than 10 year
  I0039: ERROR_VALIDATION_ERROR, // Verification code cannot be empty
  I0040: ERROR_VALIDATION_ERROR, // Please input 3-digit Verification code
  I0041: ERROR_VALIDATION_ERROR, // Please input numbers only
  I0042: ERROR_VALIDATION_ERROR, // Issuing bank cannot be empty
  I0043: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0044: ERROR_VALIDATION_ERROR, // First name cannot be empty
  I0045: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0046: ERROR_VALIDATION_ERROR, // Last name cannot empty
  I0047: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0048: ERROR_VALIDATION_ERROR, // E-mail address cannot be empty
  I0049: ERROR_VALIDATION_ERROR, // Please input between 2-100 characters only
  I0050: ERROR_VALIDATION_ERROR, // E-mail address format is incorrect
  I0051: ERROR_VALIDATION_ERROR, // The phone number of card holder cannot be empty
  I0052: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0053: ERROR_VALIDATION_ERROR, // The country of cardholder cannot be empty
  I0054: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0055: ERROR_VALIDATION_ERROR, // The address of cardholder cannot be empty
  I0056: ERROR_VALIDATION_ERROR, // Please input between 2-100 characters only
  I0057: ERROR_VALIDATION_ERROR, // The zip code of cardholder cannot be empty
  I0058: ERROR_VALIDATION_ERROR, // Please input between 2-50 characters only
  I0059: ERROR_PROCESSING_ERROR, // Property{0},can not be empty
  I0060: ERROR_PROCESSING_ERROR, // Property{0},length is more than {1}
  I0061: ERROR_PROCESSING_ERROR, // Duplicate Order
  I0062: ERROR_PROCESSING_ERROR, // Host index exists
  I0063: ERROR_PROCESSING_ERROR, // The state/province of cardholder cannot be empty
  I0064: ERROR_PROCESSING_ERROR, // Please input between 2-50 characters only
  I0065: ERROR_PROCESSING_ERROR, // The city of cardholder cannot be empty
  I0066: ERROR_PROCESSING_ERROR, // Please input no more than 100 characters
  I0067: ERROR_PROCESSING_ERROR, // Please input no more than 500 characters
  I0074: ERROR_PROCESSING_ERROR, // Error when saving the unique identifier of cardholder
  I0075: ERROR_PROCESSING_ERROR, // Error when querying the unique identifier of cardholder
  I0076: ERROR_PROCESSING_ERROR, // The unique identifier of cardholder in the database does not exist
  I0077: ERROR_CARD_DECLINED, // The Card No. and unique identifier of cardholder sent by merchant corresponding to the card no. do not match
  I0078: ERROR_CARD_DECLINED, // The CVV and unique identifier of cardholder sent by merchant corresponding to the CVV do not match
  I0079: ERROR_CARD_DECLINED, // The expiry month and unique identifier of cardholder sent by merchant corresponding to the card expiry month do not match
  I0080: ERROR_CARD_DECLINED, // The expiry year and unique identifier of cardholder sent by merchant corresponding to the card expiry year do not match
  I0081: ERROR_CARD_DECLINED, // The last name and unique identifier of cardholder sent by merchant corresponding to the last name do not match
  I0082: ERROR_CARD_DECLINED, // The last name and unique identifier of cardholder sent by merchant corresponding to the last name do not match
  I0083: ERROR_CARD_DECLINED, // The billing address and unique identifier of cardholder sent by merchant corresponding to the billing address do not match
  I0084: ERROR_CARD_DECLINED, // The billing city and unique identifier of cardholder sent by merchant corresponding to the billing city do not match
  I0085: ERROR_CARD_DECLINED, // The billing state and unique identifier of cardholder sent by merchant corresponding to the billing state do not match
  I0086: ERROR_CARD_DECLINED, // The billing country and unique identifier of cardholder sent by merchant corresponding to the billing country do not match
  I0087: ERROR_CARD_DECLINED, // The zip code and unique identifier of cardholder sent by merchant corresponding to the zip code do not match
  I0088: ERROR_CARD_DECLINED, // The issuing bank and unique identifier of cardholder sent by merchant corresponding to the issuing bank do not match
  I0089: ERROR_CARD_DECLINED, // The email and unique identifier of cardholder sent by merchant corresponding to the email do not match
  I0090: ERROR_CARD_DECLINED, // The issuing bank and unique identifier of cardholder sent by merchant corresponding to the issuing bank do not match
  R0000: ERROR_CARD_DECLINED, // High risk
  R0001: ERROR_ACCOUNT_RESTRICTED, // Do not set up the limitation of amount
  C0001: ERROR_ACCOUNT_RESTRICTED, // Do not pass the number of times that payment are made limitation
  C0002: ERROR_ACCOUNT_RESTRICTED, // Merchant gateway Number unbinds the channel
  C0003: ERROR_ACCOUNT_RESTRICTED, // Merchant gateway Number do not set up deduction rate
  C0004: ERROR_ACCOUNT_RESTRICTED, // Channel deduction rate of merchant gateway Number is incorrect
  C0005: ERROR_ACCOUNT_RESTRICTED, // Channel deduction rate of merchant gateway Number is incorrect
  C0006: ERROR_ACCOUNT_RESTRICTED, // The exchange rate of currency does not set up
  C0007: ERROR_PROCESSING_ERROR, // Obtaining currency failed
  C0008: ERROR_ACCOUNT_RESTRICTED, // Merchant does not bind payment domain name
  C0009: ERROR_ACCOUNT_RESTRICTED, // Merchant gateway Number do not bind channel {0}
  S0001: ERROR_ACCOUNT_RESTRICTED, // Merchant gateway Number do not set up deduction rate
  S0002: ERROR_ACCOUNT_RESTRICTED, // Fail to save to anomalous transation list
  S0003: ERROR_PROCESSING_ERROR, // Fail to save to the information list of cardholder
  S0004: ERROR_PROCESSING_ERROR, // Fail to save to the informal transation list
  S0005: ERROR_PROCESSING_ERROR, // Fail to save to the additional transation list
  S0006: ERROR_PROCESSING_ERROR, // Channel information the system obtained is anomalous
  S0007: ERROR_PROCESSING_ERROR, //  Fail to save transation information
  S0008: ERROR_PROCESSING_ERROR, // Fail to update testing list
  S0009: ERROR_PROCESSING_ERROR, // Fail to delete anomalous record
  S0010: ERROR_PROCESSING_ERROR, // Fail to save transation record
  S0011: ERROR_PROCESSING_ERROR, // Fail to obtain domain name the merchant bound
  S0012: ERROR_PROCESSING_ERROR, // Fail to save the information list of cardholder
  S0013: ERROR_PROCESSING_ERROR, //  Fail to obtain the information of bank channel
  S0014: ERROR_PROCESSING_ERROR, // System Exception
  E0001: ERROR_PROCESSING_ERROR, //  Channel does not bind e-mail domain name
  E0002: ERROR_PROCESSING_ERROR, //  The operation has timed outt
  E0003: ERROR_PROCESSING_ERROR, // The operation has timed out
  E0004: ERROR_PROCESSING_ERROR, // Sending failed
  E0005: ERROR_PROCESSING_ERROR, // Invoking failed
  E0006: ERROR_PAYMENT_NOT_SUPPORTED, // The channel code that the bank returned does not exist
  A0001: ERROR_PROCESSING_ERROR, // Authorization type cannot be empty
  A0002: ERROR_PROCESSING_ERROR, // Wrong authorization type
  A0003: ERROR_PROCESSING_ERROR, // The return URL cannot be empty
  A0004: ERROR_PROCESSING_ERROR, // The length of the return URL is too long and cannot exceed 100
  A0005: ERROR_PROCESSING_ERROR, // Serial order number cannot be empty
  A0006: ERROR_PROCESSING_ERROR, // Incorrect serial number
  A0007: ERROR_PROCESSING_ERROR, // This order is not a pre-authorized transaction
  A0008: ERROR_PROCESSING_ERROR, // This order cannot initiate an authorization operation
  A0009: ERROR_PROCESSING_ERROR, // Exceeded the authorization completion time limit
  A0010: ERROR_PROCESSING_ERROR, // Remarks cannot exceed 100 characters,
};

const MAP_REFUND_ERROR = {
  '01': ERROR_CALLER_ISSUER, // Incorrect parameter transmission
  '03': ERROR_CALLER_ISSUER, // Incorrect registered IP address
  '04': ERROR_CALLER_ISSUER, // Insufficient parameter transmission
  '05': ERROR_ACCOUNT_INVALID, // Invalid Merchant ID
  '06': ERROR_ACCOUNT_INVALID, // Invalid Gateway ID
  '08': ERROR_CALLER_ISSUER, // Incorrect format of Ref No.
  '09': ERROR_CALLER_ISSUER, // Refunded amount over original amount
  '10': ERROR_CALLER_ISSUER, // Incorrect refund Type
  '12': ERROR_CALLER_ISSUER, // Incorrect SHA256
  '13': ERROR_PROCESSING_ERROR, // Failed transaction,can not apply for refund
  '14': ERROR_PROCESSING_ERROR, // Transaction suspended,can not apply for refund
  '15': ERROR_CALLER_ISSUER, // Incorrect transaction amount
  '16': ERROR_CALLER_ISSUER, // Incorrect currency
  '17': ERROR_PROCESSING_ERROR, // Rolling reserve is being settled, can not apply for refund
  '18': ERROR_CALLER_ISSUER, // Incorrect refund amount format
  '19': ERROR_CALLER_ISSUER, // Incorrect refund amount and type
  '20': ERROR_PROCESSING_ERROR, // Partial refund is not supported
  '21': ERROR_PROCESSING_ERROR, // Transaction is being settled, can not apply for refund
  '22': ERROR_CALLER_ISSUER, // Incorrect transaction amount format
  '23': ERROR_CALLER_ISSUER, // Refund reason over length
  '24': ERROR_PROCESSING_ERROR, // Pending for transaction reconciliation
  '25': ERROR_CALLER_ISSUER, // Refunded amount over refundable amount
  '26': ERROR_CALLER_ISSUER, // MerTrackNo over length
  '27': ERROR_PROCESSING_ERROR, // Over 180 days,can not be refunded
  '98': ERROR_PROCESSING_ERROR, // No transaction record on file
  '99': ERROR_PROCESSING_ERROR, // System error
};

const ErrorCodeCustomerCancel = 'E0008';

const TRANSACTION_STATUS = {
  TO_BE_CONFIRMED: -2,
  PENDING: -1,
  FAILURE: 0,
  SUCCESS: 1,
  ORDER_DOES_NOT_EXIST: 2,
  // Follows docs
  INCOMING_PARAMETERS_INCOMPLETE: 3,
  ORDER_AN_EXCESSIVE_NUMBER: 4,
  MERCHANT_GATEWAY_ACCESS_ERROR: 5,
  SIGNINFO_ERROR: 6,
  ACCESS_IP_ERROR: 7,
  QUERY_SYSTEM_ERROR: 999,
};

const TRANSACTION_TYPES = {
  CAPTURE: 1,
  VOID: 2,
};

const REFUND_TYPES = {
  FULL: 1,
  PARTIAL: 2,
};

const NOTIFY_TYPES = {
  PaymentResult: 'PaymentResult',
  OrderStatusChanged: 'OrderStatusChanged',
  Capture: 'Capture',
  Void: 'Void',
  Refund: 'Refund',
};
module.exports = {
  PAYMENT_METHOD,
  INTERFACE_INFO,
  MAP_ERROR,
  TRANSACTION_STATUS,
  TRANSACTION_TYPES,
  REFUND_TYPES,
  MAP_REFUND_ERROR,
  NOTIFY_TYPES,
  ErrorCodeCustomerCancel,
};
