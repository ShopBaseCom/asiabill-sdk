const crypto = require('crypto');

/**
 @typedef signValues
 @type {Array}
 */


/**
 * @public
 * @function
 * @param {signValues} signValues
 * @return {string}
 */
function sign(signValues = '') {
  return crypto.createHash('sha256').update(signValues.join('')).digest('hex');
}

module.exports = sign;
