const querystring = require('querystring');
const ShopBaseSigner = require('./Signer');

/**
 * @param {Express.response} res
 * @param {string} url
 * @param {Object} body
 * @return {*}
 */
function redirectWithSignRequestToShopBase(res, url, body) {
  return res.redirect(`${url}?${querystring.stringify(
      ShopBaseSigner.sign(body),
  )}`);
}

module.exports = {redirectWithSignRequestToShopBase};
