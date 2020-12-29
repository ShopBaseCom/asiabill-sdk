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
   *
   * @param {Object} object
   * @param {string} signature
   * @return {boolean}
   */
  static verify(object, signature) {
    return true;
  }
}

module.exports = ShopBaseSigner;
