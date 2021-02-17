/**
 * error System error
 */
class SystemError extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'SystemError';
  }
}

export default SystemError;
