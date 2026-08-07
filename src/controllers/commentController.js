const db = require('../models/db');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper to populate author metadata on a comment object.
 */
function populateCommentAuthor(comment) {
  if (!comment) return null;
  const author = db.users.findById(comment.authorId);
  return {
    ...comment,
    author: author ? { id: author.id, username: author.username } : { id: comment.authorId, username: 'Deleted User' }
  };
}

/**
 * Add a comment to a blog post
 * Route: POST /api/posts/:postId/comments
 */
const createComment = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;
  const { content } = req.body;
  const authorId = req.user.id;

  // Verify that the parent post exists
  const post = db.posts.findById(postId);
  if (!post) {
    return next(new AppError(`Cannot comment. No blog post found with ID '${postId}'`, 404));
  }

  // Create comment in DB store
  const newComment = db.comments.create({
    postId,
    authorId,
    content
  });

  const populatedComment = populateCommentAuthor(newComment);

  res.status(201).json({
    status: 'success',
    message: 'Comment added successfully.',
    data: {
      comment: populatedComment
    }
  });
});

/**
 * Retrieve all comments for a specific blog post
 * Route: GET /api/posts/:postId/comments
 */
const getComments = asyncHandler(async (req, res, next) => {
  const { postId } = req.params;

  // Verify that the parent post exists
  const post = db.posts.findById(postId);
  if (!post) {
    return next(new AppError(`No blog post found with ID '${postId}'`, 404));
  }

  // Fetch comments matching postId
  const comments = db.comments.find({ postId });
  const populatedComments = comments.map(populateCommentAuthor);

  res.status(200).json({
    status: 'success',
    results: populatedComments.length,
    data: {
      comments: populatedComments
    }
  });
});

/**
 * Delete a comment on a blog post
 * Route: DELETE /api/posts/:postId/comments/:commentId
 */
const deleteComment = asyncHandler(async (req, res, next) => {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  // 1. Verify parent post exists
  const post = db.posts.findById(postId);
  if (!post) {
    return next(new AppError(`No blog post found with ID '${postId}'`, 404));
  }

  // 2. Verify target comment exists
  const comment = db.comments.findById(commentId);
  if (!comment) {
    return next(new AppError(`No comment found with ID '${commentId}'`, 404));
  }

  // 3. Integrity check: Verify the comment actually belongs to the given post
  if (comment.postId !== postId) {
    return next(new AppError('The requested comment does not belong to the specified post.', 400));
  }

  // 4. Authorization Check:
  // A comment can be deleted by either:
  // - The author of the comment
  // - The author of the parent blog post (moderation privilege)
  const isCommentAuthor = comment.authorId === userId;
  const isPostAuthor = post.authorId === userId;

  if (!isCommentAuthor && !isPostAuthor) {
    return next(
      new AppError('You do not have permission to delete this comment.', 403)
    );
  }

  // Perform removal
  db.comments.delete(commentId);

  res.status(200).json({
    status: 'success',
    message: 'Comment deleted successfully.'
  });
});

module.exports = {
  createComment,
  getComments,
  deleteComment
};
