/**
 * Credential storage manager
 * Handler cache strategy and logic get credential from ShopBase
 */
class CredentialManager {
  /**
   *
   * @param {Storage} storage
   */
  constructor(storage) {
    this.redis = storage;
  }

  /**
   * @public
   * @param {string} id
   * @return {Promise<*>}
   */
  getById(id) {
    // return this.storage.get(this.getCacheKeyById(id)).then((res) => {
    //   console.log(res);
    // });
    return Promise.resolve({
      gatewayNo: '12318001',
      merNo: '12318',
      isTestMode: true,
      signKey: '12345678',
    });
  }

  /**
   * @private
   * @param {number} id
   * @return {string}
   */
  getCacheKeyById(id) {
    return `${process.env.CACHE_KEY_URL}/${id}`;
  }
}


module.exports = CredentialManager;
