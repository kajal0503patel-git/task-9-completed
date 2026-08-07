const db = require('../models/db');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper function to attach user info to a post object.
 * Simulates a DB join (e.g. Mongoose populate or SQL Join).
 */
function populatePostAuthor(post) {
  if (!post) return null;
  const author = db.users.findById(post.authorId);
  return {
    ...post,
    author: author ? { id: author.id, username: author.username } : { id: post.authorId, username: 'Deleted User' }
  };
}

/**
 * Create a new blog post
 * Route: POST /api/posts
 */
const createPost = asyncHandler(async (req, res, next) => {
  const { title, content, tags } = req.body;
  const authorId = req.user.id;

  // Insert post into JSON store
  const newPost = db.posts.create({
    title,
    content,
    tags: tags || [],
    authorId
  });

  // Populate author details for response completeness
  const populatedPost = populatePostAuthor(newPost);

  res.status(201).json({
    status: 'success',
    message: 'Blog post created successfully.',
    data: {
      post: populatedPost
    }
  });
});

/**
 * Retrieve all blog posts (supports optional search and authorId filtering)
 * Route: GET /api/posts
 */
const getAllPosts = asyncHandler(async (req, res, next) => {
  const { search, authorId } = req.query;

  // Retrieve posts based on query params
  const rawPosts = db.posts.find({ search, authorId });

  // Map over posts and populate their author metadata
  const populatedPosts = rawPosts.map(populatePostAuthor);

  res.status(200).json({
    status: 'success',
    results: populatedPosts.length,
    data: {
      posts: populatedPosts
    }
  });
});

/**
 * Retrieve a single blog post by its ID, complete with comments and author info
 * Route: GET /api/posts/:id
 */
const getPostById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const post = db.posts.findById(id);
  if (!post) {
    return next(new AppError(`No post found with ID '${id}'`, 404));
  }

  // Populate main post author details
  const populatedPost = populatePostAuthor(post);

  // Fetch comments belonging to this post
  const rawComments = db.comments.find({ postId: id });

  // Populate author details on each comment item
  const populatedComments = rawComments.map(comment => {
    const commentAuthor = db.users.findById(comment.authorId);
    return {
      ...comment,
      author: commentAuthor 
        ? { id: commentAuthor.id, username: commentAuthor.username } 
        : { id: comment.authorId, username: 'Deleted User' }
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      post: {
        ...populatedPost,
        comments: populatedComments
      }
    }
  });
});

/**
 * Update an existing blog post
 * Route: PUT /api/posts/:id
 */
const updatePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { title, content, tags } = req.body;
  const userId = req.user.id;

  // Check if target post exists
  const post = db.posts.findById(id);
  if (!post) {
    return next(new AppError(`No post found with ID '${id}'`, 404));
  }

  // Authorization Check: Only the author of the post is allowed to modify it
  if (post.authorId !== userId) {
    return next(new AppError('You do not have permission to edit this post.', 403));
  }

  // Apply updates
  const updatedPost = db.posts.update(id, {
    title: title || post.title,
    content: content || post.content,
    tags: tags || post.tags
  });

  // Populate author details before returning
  const populatedPost = populatePostAuthor(updatedPost);

  res.status(200).json({
    status: 'success',
    message: 'Blog post updated successfully.',
    data: {
      post: populatedPost
    }
  });
});

/**
 * Delete a blog post and its associated comments
 * Route: DELETE /api/posts/:id
 */
const deletePost = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if target post exists
  const post = db.posts.findById(id);
  if (!post) {
    return next(new AppError(`No post found with ID '${id}'`, 404));
  }

  // Authorization Check: Only the author of the post is allowed to delete it
  if (post.authorId !== userId) {
    return next(new AppError('You do not have permission to delete this post.', 403));
  }

  // Delete from file-based store
  db.posts.delete(id);

  res.status(200).json({
    status: 'success',
    message: 'Blog post and associated comments deleted successfully.'
  });
});

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost
};
