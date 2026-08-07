const express = require('express');
const commentController = require('../controllers/commentController');
const { authenticateJWT } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validator');

// mergeParams is required so we can access parent parameters (like :postId) in nested routes
const router = express.Router({ mergeParams: true });

/**
 * @route   GET /api/posts/:postId/comments
 * @desc    Get all comments for a specific post
 * @access  Public
 */
router.get(
  '/',
  commentController.getComments
);

/**
 * @route   POST /api/posts/:postId/comments
 * @desc    Add a comment to a specific post
 * @access  Private
 */
router.post(
  '/',
  authenticateJWT,
  validateSchema(schemas.comment),
  commentController.createComment
);

/**
 * @route   DELETE /api/posts/:postId/comments/:commentId
 * @desc    Delete a comment from a specific post
 * @access  Private
 */
router.delete(
  '/:commentId',
  authenticateJWT,
  commentController.deleteComment
);

module.exports = router;
