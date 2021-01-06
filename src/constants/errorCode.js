/**
 * Card declined by any reasons (anti-fraud, declined by bank..)
 * @type {string}
 */
const ERROR_CARD_DECLINED = 'card_declined';
/**
 * An error occurred while processing the card.
 * Try again later or with a different payment method.
 * @type {string}
 */
const ERROR_PROCESSING_ERROR = 'processing_error';
/**
 * The card has been declined for an unknown reason.
 * The customer needs to contact their card issuer for more information.
 * @type {string}
 */
const ERROR_CALLER_ISSUER = 'call_issuer';
/**
 * The customer's card issuer has declined the transaction and requested that
 * the card be retained as the card may have been reported as lost or stolen
 * @type {string}
 */
const ERROR_PICK_UP_CARD = 'pick_up_card';
/**
 * @type {string}
 */
const ERROR_INVALID_SIGNATURE = 'invalid_signature';
/**
 * @type {string}
 */
const ERROR_ACCOUNT_RESTRICTED = 'account_restricted';
/**
 * @type {string}
 */
const ERROR_ACCOUNT_INVALID = 'account_invalid';
/**
 * @type {string}
 */
const ERROR_PAYMENT_NOT_SUPPORTED = 'payment_not_supported';
/**
 * Missing "x" params
 * @type {string}
 */
const ERROR_MISSING_PARAMS = 'missing_param';

module.exports = {
  ERROR_CARD_DECLINED,
  ERROR_PROCESSING_ERROR,
  ERROR_CALLER_ISSUER,
  ERROR_PICK_UP_CARD,
  ERROR_INVALID_SIGNATURE,
  ERROR_ACCOUNT_RESTRICTED,
  ERROR_ACCOUNT_INVALID,
  ERROR_PAYMENT_NOT_SUPPORTED,
  ERROR_MISSING_PARAMS,
};
