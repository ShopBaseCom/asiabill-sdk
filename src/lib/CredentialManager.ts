import { RedisClient }      from 'redis';
import logger               from './logger';
import axios                from 'axios';
import ShopBaseSigner       from './Signer';
import * as error           from '../payment/error';
import { SignInvalidError } from '../payment/error';


/**
 * Credential storage manager
 * Handler cache strategy and logic get credential from ShopBase
 */
class CredentialManager {
  private storage: any;

  constructor(storage: RedisClient) {
    this.storage = storage;
  }

  async getById(id: number | string): Promise<any> {
    const key = CredentialManager.getCacheKeyById(id);
    try {
      const credential = await this.storage.get(key);
      if (credential) {
        return JSON.parse(credential);
      }
    } catch (e) {
      logger.error(e);
    }
    try {
      const response = await axios.get(`${process.env.SHOPBASE_ENDPOINT}/api/checkout/payment-credential.json`, {
        params: ShopBaseSigner.sign({
          x_account_id: id,
        })
      });

      if (!ShopBaseSigner.verify(response.data)) throw new SignInvalidError('signature invalid');

      await this.storage.set(key, JSON.stringify(response.data.x_gateway_credentials));
      this.storage.expire(key, 60 * 60 * 24);
      return response.data.x_gateway_credentials;
    } catch (e) {
      if (!e.response || !e.response.data) {
        throw new error.SystemError(e.message);
      }
      const message = e.response.data.x_message;
      const errorCode = e.response.data.x_error_code;
      switch (errorCode) {
        case 'internal_server':
          throw new error.ShopBaseSystemError(message);
        case 'invalid_account':
          throw new error.InvalidAccountError(message);
        case 'invalid_signature':
          throw new error.SignInvalidError(message);
        case 'invalid_request':
          throw new error.InvalidAccountError(message);
      }
      throw e;
    }
  }

  private static getCacheKeyById(id: number | string): string {
    return `${process.env.CACHE_KEY_CREDENTIAL}/${id}`;
  }
}


export default CredentialManager;
