/**
 * error invalid Account Id
 */
class InvalidAccountError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'InvalidAccountError';
  }
}

module.exports = InvalidAccountError;
