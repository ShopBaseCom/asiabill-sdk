const {RESULT_COMPLETED, RESULT_FAILED} = require('../../constants');

/**
 *
 * @param {orderResponse} res
 * @return {*}
 */
function parseOrderResponse(res) {
  return {
    x_account_id: res.accountId,
    x_amount: res.amount,
    x_currency: res.currency,
    x_gateway_reference: res.gatewayReference,
    x_reference: res.reference,
    x_transaction_type: res.transactionType,
    x_test: res.isTest,
    x_timestamp: res.timestamp,
    x_message: res.errorMessage,
    x_error_code: res.errorCode,
    x_result: res.isSuccess ? RESULT_COMPLETED : RESULT_FAILED,
  };
}

/**
 *
 * @param {orderManagementResponse} res
 * @return {*}
 */
function parseOrderManagementResponse(res) {
  return {
    x_gateway_reference: res.gatewayReference,
    x_reference: res.reference,
    x_transaction_type: res.transactionType,
    x_timestamp: res.timestamp,
    x_message: res.errorMessage,
    x_error_code: res.errorCode,
    x_result: res.result,
  };
}

module.exports = {parseOrderResponse, parseOrderManagementResponse};
