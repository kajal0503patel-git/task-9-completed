const express = require('express');
const authController = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validator');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validateSchema(schemas.register),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
router.post(
  '/login',
  validateSchema(schemas.login),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticateJWT,
  authController.getMe
);

module.exports = router;
