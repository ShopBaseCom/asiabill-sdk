/**
 * error not support notify type
 */
class NotifyTypeNotSupportError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'NotifyTypeNotSupportError';
  }
}

module.exports = NotifyTypeNotSupportError;
