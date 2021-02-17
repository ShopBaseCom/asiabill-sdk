/**
 * error not support notify type
 */
class NotifyTypeNotSupportError extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'NotifyTypeNotSupportError';
  }
}

export default NotifyTypeNotSupportError;
