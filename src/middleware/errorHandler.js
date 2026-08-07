/**
 * Custom Error class for operational API errors.
 * Used to distinguish expected, handled API failures from unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // Indicates this error is hand-written/operational, not a code bug
    this.details = details;    // For validation issues or list-based descriptions

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express Global Error Handling Middleware.
 * Catches all exceptions thrown inside controllers and forwards them as formatted JSON.
 */
function errorHandler(err, req, res, next) {
  // Set default values if error isn't instantiated with AppError properties
  let statusCode = err.statusCode || 500;
  let status = err.status || 'error';
  let message = err.message || 'Something went wrong on our end.';
  let details = err.details || null;

  // Handle common JWT signature validation errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    status = 'fail';
    message = 'Invalid credentials. Signature verification failed.';
  }

  // Handle expired JWT tokens
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    status = 'fail';
    message = 'Session expired. Please log in again.';
  }

  // Handle parsing errors for malformed raw request JSON payloads
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    status = 'fail';
    message = 'Malformed JSON payload provided in request body.';
  }

  // Log critical 5xx errors to standard error (console) for backend debugging
  if (statusCode === 500) {
    console.error(`[CRITICAL ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  // Format final client-facing JSON object
  const errorResponse = {
    status,
    message,
    ...(details && { details }), // Only include details array if it contains elements
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) // Include stack trace only in dev
  };

  res.status(statusCode).json(errorResponse);
}

// Export both the custom error class and the middleware function
module.exports = {
  AppError,
  errorHandler
};
