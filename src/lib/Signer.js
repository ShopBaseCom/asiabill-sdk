const crypto = require('crypto');

/**
 * Signing mechanism data transform between ShopBase and provider
 */
class ShopBaseSigner {
  /**
   *
   * @param {Object} obj
   * @return {string}
   */
  static getSignature(obj) {
    const objEntities = Object.entries(obj);
    const msg = objEntities.
        filter(([_, val]) => val !== undefined).
        sort(([key], [key2]) => {
          if (key < key2) {
            return -1;
          }
          if (key > key2) {
            return 1;
          }
          return 0;
        }).
        reduce(((previousValue, [key, val]) => {
          if (typeof val === 'object') {
            return `${previousValue}${key}${JSON.stringify(val)}`;
          }
          return `${previousValue}${key}${val}`;
        }), '');

    return crypto.createHmac('sha256', process.env.SHOPBASE_PAYMENT_KEY || '').
        update(msg).digest('hex');
  }

  /**
   *
   * @param {Object} obj
   * @return {Object}
   */
  static sign(obj) {
    delete obj['x_signature'];
    obj['x_signature'] = this.getSignature(obj);
    return obj;
  }

  /**
   * Write signature to response header
   * @param {Express.response} res
   * @param {Object} data
   * @return {Express.response}
   */
  static signResponse(res, data) {
    delete data['x_signature'];
    const sign = this.getSignature(data);
    res.header('X-Signature', sign);
    return res.json(data);
  }

  /**
   *
   * @param {Object} object
   * @param {string} signature
   * @return {boolean}
   */
  static verify(object, signature = object['x_signature']) {
    return this.sign(object).x_signature === signature;
  }
}

module.exports = ShopBaseSigner;
