/**
 * Async handler wrapper to catch unhandled promise rejections and pass to next()
 * @param {Function} fn
 * @returns {Function} Express middleware
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
