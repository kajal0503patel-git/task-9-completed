const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

// JWT generation configuration
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_blog_api_key_2026_antigravity';
const JWT_EXPIRES_IN = '1d'; // Token validity: 1 day

/**
 * Handle user registration
 * Route: POST /api/auth/register
 */
const register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  // Check if a user already exists with the given email
  const existingUser = db.users.findOne({ email });
  if (existingUser) {
    return next(new AppError('A user with this email address already exists.', 409));
  }

  // Hash the password securely using bcrypt
  // Hashing with 10 salt rounds provides a great balance of security and speed
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Save the new user record in our database
  const newUser = db.users.create({
    username,
    email,
    password: hashedPassword
  });

  // Extract password from response representation for safety
  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    status: 'success',
    message: 'User registered successfully.',
    data: {
      user: safeUser
    }
  });
});

/**
 * Handle user login session creation
 * Route: POST /api/auth/login
 */
const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Retrieve user record from database
  const user = db.users.findOne({ email });
  if (!user) {
    // Return a generic error to prevent email enumeration attacks
    return next(new AppError('Invalid email or password combination.', 401));
  }

  // Verify the provided password matches the stored bcrypt hash
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return next(new AppError('Invalid email or password combination.', 401));
  }

  // Issue a JWT token with the user's ID as payload
  const token = jwt.sign({ id: user.id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });

  // Exclude password hash from response
  const { password: _, ...safeUser } = user;

  res.status(200).json({
    status: 'success',
    message: 'Login successful.',
    data: {
      token,
      user: safeUser
    }
  });
});

/**
 * Get active session user profile details
 * Route: GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res, next) => {
  // `req.user` is already set by the `authenticateJWT` middleware.
  // We perform an active lookup to grab the latest user details from the store.
  const user = db.users.findById(req.user.id);
  if (!user) {
    return next(new AppError('User session is invalid or user no longer exists.', 404));
  }

  const { password: _, ...safeUser } = user;

  res.status(200).json({
    status: 'success',
    data: {
      user: safeUser
    }
  });
});

module.exports = {
  register,
  login,
  getMe
};
