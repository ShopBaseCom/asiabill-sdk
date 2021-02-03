/**
 * error get UrlObject not found
 */
class UrlObjectNotFound extends Error {
  /**
   * @param {string} message
   */
  constructor(message: string) {
    super(message);
    this.name = 'UrlObjectNotFound';
  }
}

export default UrlObjectNotFound;
