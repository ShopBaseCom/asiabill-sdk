/**
 * error SignInvalid
 */
class SignInvalidError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'SignInvalid';
  }
}

module.exports = SignInvalidError;
