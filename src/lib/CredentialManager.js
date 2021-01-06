const axios = require('axios');
const ShopBaseSigner = require('./Signer');
const logger = require('../lib/logger');
const SystemError = require('../errors/SystemError');
const ShopBaseSystemError = require('../errors/ShopBaseSystemError');
const InvalidAccountError = require('../errors/InvalidAccountError');
const SignInvalidError = require('../errors/SignInvalid');

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
    this.storage = storage;
  }

  /**
   * @throws { ShopBaseSystemError, InvalidAccountError, SignInvalidError, SystemError }
   * @public
   * @param {number} id x_account_id
   * @return {Promise<*>}
   */
  async getById(id) {
    const key = this.getCacheKeyById(id);
    try {
      const credential = await this.storage.get(key);
      if (credential) {
        return JSON.parse(credential);
      }
    } catch (e) {
      logger.error(e);
    }
    try {
      const response = await axios.get(`${process.env.SHOPBASE_ENDPOINT}/api/checkout/payment-credential`, {
        params: ShopBaseSigner.sign({
          x_account_id: id,
        })});

      if (!ShopBaseSigner.verify(response.data)) {
        throw new SignInvalidError('signature invalid');
      }

      await this.storage.set(key, JSON.stringify(response.data.x_gateway_credentials));
      this.redis.expire(key, 60 * 60 * 24);
      return response.data.x_gateway_credentials;
    } catch (e) {
      if (!e.response || !e.response.data) {
        throw new SystemError(e.message);
      }
      const message = e.response.data.x_message;
      const errorCode = e.response.data.x_error_code;
      switch (errorCode) {
        case 'internal_server':
          throw new ShopBaseSystemError(message);
        case 'invalid_account':
          throw new InvalidAccountError(message);
        case 'invalid_signature':
          throw new SignInvalidError(message);
        case 'invalid_request':
          throw new InvalidAccountError(message);
      }
      throw e;
    }
  }

  /**
   * @private
   * @param {number} id
   * @return {string}
   */
  getCacheKeyById(id) {
    return `${process.env.CACHE_KEY_CREDENTIAL}/${id}`;
  }
}


module.exports = CredentialManager;
