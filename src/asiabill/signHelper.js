const crypto = require('crypto');

/**
 * @public
 * @function
 * @param {signValues} signValues
 * @return {string}
 */
function sign(signValues = '') {
  return crypto.createHash('sha256').update(signValues.join('')).digest('hex').toUpperCase();
}

module.exports = sign;
