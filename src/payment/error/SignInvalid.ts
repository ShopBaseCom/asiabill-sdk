/**
 * error SignInvalid
 */
class SignInvalidError extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'SignInvalid';
  }
}

export default SignInvalidError;
