import { Response } from 'express';
import crypto       from 'crypto';

/**
 * Signing mechanism data transform between ShopBase and provider
 */
class ShopBaseSigner {
  /**
   *
   * @param {Object} obj
   * @return {string}
   */
  static getSignature(obj: any): string {
    const objEntities = Object.entries(obj);
    // @ts-ignore
    const msg = objEntities.filter(([key, val]) => key.startsWith('x_') && val !== undefined).sort(([key], [key2]) => {
      if (key < key2) {
        return -1;
      }
      if (key > key2) {
        return 1;
      }
      return 0;
    }).reduce(((previousValue, [key, val]) => {
      if (typeof val === 'object') {
        return `${previousValue}${key}${JSON.stringify(val)}`;
      }
      return `${previousValue}${key}${val}`;
    }), '');

    return crypto.createHmac('sha256', process.env.SHOPBASE_PAYMENT_KEY || '').update(msg).digest('hex');
  }

  /**
   *
   * @param {Object} obj
   * @return {Object}
   */
  static sign(obj: any): any {
    delete obj['x_signature'];
    obj['x_signature'] = this.getSignature(obj);
    return obj;
  }

  /**
   * Write signature to response header
   */
  static signResponse(res: Response, statusCode: number, data: any) {

  }

  static verify(object: any, signature: string = object['x_signature']): boolean {
    return this.sign(object).x_signature === signature;
  }
}

export default ShopBaseSigner;
