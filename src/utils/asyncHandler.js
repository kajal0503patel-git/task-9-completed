/**
 * A utility wrapper for asynchronous Express controller routes.
 * Catches rejected promises and forwards them to the global error handler middleware via next().
 * This replaces repetitive try/catch boilerplate blocks in controller code.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
