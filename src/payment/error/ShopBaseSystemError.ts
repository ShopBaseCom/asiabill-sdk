/**
 * error ShopBase system error
 */
class ShopBaseSystemError extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'ShopBaseSystemError';
  }
}

export default ShopBaseSystemError;
