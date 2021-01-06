/**
 * error ShopBase system error
 */
class ShopBaseSystemError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'ShopBaseSystemError';
  }
}

module.exports = ShopBaseSystemError;
