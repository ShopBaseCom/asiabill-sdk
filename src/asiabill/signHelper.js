const crypto = require('crypto');

/**
 @typedef signValues
 @type {Array}
 */


/**
 * @public
 * @function
 * @param {AsiaBillCredential} credential
 * @param {signValues} signValues
 * @return {string}
 */
function sign(credential, signValues = '') {
  // eslint-disable-next-line max-len
  return crypto.createHash('sha256').update(signValues.join('')).digest('hex');
}

module.exports = sign;
