/**
 * Url Manager
 * Service will replace and storage.
 * Because any request from ShopBase to provider should handler by
 * payment provider ( not payment gateway )
 */
class UrlManager {
  /**
   *
   * @param {Storage} storage
   */
  constructor(storage) {
    this.redis = storage;
  }

  /**
   * function get proxy UrlObject with ref
   * @function
   * @throws Credential
   * @param {string} ref
   * @param {boolean} isPortPurchase
   * @param {urlObject} url
   * @return {Promise<urlObject>}
   */
  async getProxyUrlObject(ref, isPortPurchase, url) {
    await this.redis.set(this.getCacheKeyByOrderNo(ref, isPortPurchase),
        JSON.stringify(url));

    return {
      // url define in file router.js
      returnUrl: `${process.env.HOST}/provider-confirm`,
      callbackUrl: `${process.env.HOST}/provider-webhook`,
      cancelUrl: `${process.env.HOST}/cancel-url`,
    };
  }

  /**
   * function get real UrlObject with ref
   * @function
   * @param {string} ref
   * @param {boolean} isPortPurchase
   * @return {Promise<urlObject>}
   */
  getUrlObject(ref, isPortPurchase) {
    const key = this.getCacheKeyByOrderNo(ref, isPortPurchase);
    return this.redis.get(key).then((rs) => {
      if (rs == null) {
        throw new Error(`cannot get url object with ref ${ref}`);
      }
      return JSON.parse(rs);
    });
  }

  /**
   * @private
   * @param {string} ref
   * @param {boolean} isPortPurchase
   * @return {string}
   */
  getCacheKeyByOrderNo(ref, isPortPurchase) {
    return `${process.env.CACHE_KEY_URL}/${ref}-${isPortPurchase}`;
  }
}

module.exports = UrlManager;
