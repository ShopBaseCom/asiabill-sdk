/**
 * error get UrlObject not found
 */
class UrlObjectNotFound extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = 'UrlObjectNotFound';
  }
}

module.exports = UrlObjectNotFound;
