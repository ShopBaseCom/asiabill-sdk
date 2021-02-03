/**
 * error invalid Account Id
 */
class InvalidAccountError extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAccountError';
  }
}

export default InvalidAccountError;
