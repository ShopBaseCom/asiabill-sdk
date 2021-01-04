/**
 * error System error
 */
class SystemError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'SystemError';
  }
}

module.exports = SystemError;
