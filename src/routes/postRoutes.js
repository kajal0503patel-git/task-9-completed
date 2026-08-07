const express = require('express');
const postController = require('../controllers/postController');
const commentRoutes = require('./commentRoutes');
const { authenticateJWT } = require('../middleware/auth');
const { validateSchema, schemas } = require('../middleware/validator');

const router = express.Router();

// Mount comments router as a nested resource under posts
// This directs "/api/posts/:postId/comments" routes to the comments router
router.use('/:postId/comments', commentRoutes);

/**
 * @route   GET /api/posts
 * @desc    Get all posts (supports search/filter query params)
 * @access  Public
 */
router.get(
  '/',
  postController.getAllPosts
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post details with its comments
 * @access  Public
 */
router.get(
  '/:id',
  postController.getPostById
);

/**
 * @route   POST /api/posts
 * @desc    Create a new blog post
 * @access  Private
 */
router.post(
  '/',
  authenticateJWT,
  validateSchema(schemas.post),
  postController.createPost
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update an existing blog post
 * @access  Private
 */
router.put(
  '/:id',
  authenticateJWT,
  validateSchema(schemas.post),
  postController.updatePost
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a blog post (and associated comments)
 * @access  Private
 */
router.delete(
  '/:id',
  authenticateJWT,
  postController.deletePost
);

module.exports = router;
