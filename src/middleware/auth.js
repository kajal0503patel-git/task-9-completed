const jwt = require('jsonwebtoken');
const { AppError } = require('./errorHandler');
const db = require('../models/db');

/**
 * Middleware to authenticate requests using JWT tokens in the Authorization header.
 * Attaches the authenticated user model to `req.user` if valid.
 */
function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  // Verify authorization header presence and correct prefix
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new AppError('Access denied. No authorization token was provided.', 401)
    );
  }

  // Extract token from bearer structure
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_blog_api_key_2026_antigravity');
    
    // Look up the user in the database to ensure the account was not deleted/invalidated
    const user = db.users.findById(decoded.id);
    if (!user) {
      return next(
        new AppError('The user belonging to this authorization token no longer exists.', 401)
      );
    }

    // Attach user information to the request context (excluding sensitive fields)
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    next();
  } catch (error) {
    // Forward the error to the Express error handler
    next(error);
  }
}

module.exports = {
  authenticateJWT
};
