/**
 * Swagger/OpenAPI 3.0.0 specifications for the Blog API.
 * This object defines the interactive documentation served at /api-docs.
 */
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Blogging Platform API',
    version: '1.0.0',
    description: 'A robust, self-contained RESTful Blog API built with Node.js, Express, and JWT Authentication. Features database persistence using a local JSON engine, custom colored logging, strict input schema validations, error recovery, and comments management.',
    contact: {
      name: 'Developer Support',
      email: 'support@example.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development Server'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT bearer token to access secured API endpoints. Format: "Bearer <your_token>"'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'fail' },
          message: { type: 'string', example: 'Validation failed for request input parameters.' },
          details: {
            type: 'array',
            items: { type: 'string' },
            example: ["Field 'title' is required and cannot be empty."]
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'u_1700000000000' },
          username: { type: 'string', example: 'john_doe' },
          email: { type: 'string', example: 'john@example.com' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-08-07T10:00:00.000Z' }
        }
      },
      Post: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'p_1700000000000' },
          title: { type: 'string', example: 'Introduction to Node.js' },
          content: { type: 'string', example: 'Node.js is an open-source, cross-platform JavaScript runtime...' },
          tags: { type: 'array', items: { type: 'string' }, example: ['nodejs', 'javascript', 'backend'] },
          authorId: { type: 'string', example: 'u_1700000000000' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-08-07T10:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-08-07T10:05:00.000Z' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'u_1700000000000' },
              username: { type: 'string', example: 'john_doe' }
            }
          }
        }
      },
      Comment: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'c_1700000000000' },
          postId: { type: 'string', example: 'p_1700000000000' },
          authorId: { type: 'string', example: 'u_1700000000000' },
          content: { type: 'string', example: 'Excellent guide! Really helped clear up the event loop.' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-08-07T10:10:00.000Z' },
          author: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'u_1700000000000' },
              username: { type: 'string', example: 'john_doe' }
            }
          }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password'],
                properties: {
                  username: { type: 'string', minLength: 3, example: 'john_doe' },
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', minLength: 6, example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'User registered successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          409: { description: 'Email already taken' }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate credentials and generate token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'john@example.com' },
                  password: { type: 'string', example: 'password123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful, token returned',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Login successful.' },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed' },
          401: { description: 'Invalid email or password combination' }
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Retrieve logged-in user profile details',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'User details retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized / Missing Token' }
        }
      }
    },
    '/api/posts': {
      get: {
        tags: ['Blog Posts'],
        summary: 'Retrieve a list of blog posts',
        parameters: [
          { name: 'search', in: 'query', description: 'Filter posts by term match in title or content', required: false, schema: { type: 'string' } },
          { name: 'authorId', in: 'query', description: 'Filter posts by creator user ID', required: false, schema: { type: 'string' } }
        ],
        responses: {
          200: {
            description: 'List of posts fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    results: { type: 'integer', example: 2 },
                    data: {
                      type: 'object',
                      properties: {
                        posts: { type: 'array', items: { $ref: '#/components/schemas/Post' } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ['Blog Posts'],
        summary: 'Create a new blog post',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', minLength: 5, example: 'Introduction to Express.js' },
                  content: { type: 'string', minLength: 10, example: 'Express is a minimal and flexible Node.js web application framework...' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['express', 'webdev'] }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Post created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Blog post created successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        post: { $ref: '#/components/schemas/Post' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/api/posts/{id}': {
      get: {
        tags: ['Blog Posts'],
        summary: 'Get a single post by ID (includes comments)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Post details fetched successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    data: {
                      type: 'object',
                      properties: {
                        post: {
                          allOf: [
                            { $ref: '#/components/schemas/Post' },
                            {
                              type: 'object',
                              properties: {
                                comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Post not found' }
        }
      },
      put: {
        tags: ['Blog Posts'],
        summary: 'Update an existing blog post',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', minLength: 5, example: 'Advanced Express Middleware' },
                  content: { type: 'string', minLength: 10, example: 'Diving deep into Express route handlers, next triggers, and custom filters...' },
                  tags: { type: 'array', items: { type: 'string' }, example: ['express', 'advanced'] }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Post updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Blog post updated successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        post: { $ref: '#/components/schemas/Post' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Not the author of this post)' },
          404: { description: 'Post not found' }
        }
      },
      delete: {
        tags: ['Blog Posts'],
        summary: 'Delete a blog post and its comments',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Post deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Blog post and associated comments deleted successfully.' }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Not the author of this post)' },
          404: { description: 'Post not found' }
        }
      }
    },
    '/api/posts/{postId}/comments': {
      get: {
        tags: ['Comments'],
        summary: 'Get all comments for a specific post',
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' }
        ],
        responses: {
          200: {
            description: 'Comments list retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    results: { type: 'integer', example: 1 },
                    data: {
                      type: 'object',
                      properties: {
                        comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } }
                      }
                    }
                  }
                }
              }
            }
          },
          404: { description: 'Post not found' }
        }
      },
      post: {
        tags: ['Comments'],
        summary: 'Add a new comment to a post',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', minLength: 2, example: 'This is a comment.' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Comment created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Comment added successfully.' },
                    data: {
                      type: 'object',
                      properties: {
                        comment: { $ref: '#/components/schemas/Comment' }
                      }
                    }
                  }
                }
              }
            }
          },
          400: { description: 'Validation failed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Post not found' }
        }
      }
    },
    '/api/posts/{postId}/comments/{commentId}': {
      delete: {
        tags: ['Comments'],
        summary: 'Delete a comment from a post',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'postId', in: 'path', required: true, schema: { type: 'string' }, description: 'Post ID' },
          { name: 'commentId', in: 'path', required: true, schema: { type: 'string' }, description: 'Comment ID' }
        ],
        responses: {
          200: {
            description: 'Comment deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'Comment deleted successfully.' }
                  }
                }
              }
            }
          },
          400: { description: 'Comment post linkage mismatch' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden (Not the author of the comment nor the post author)' },
          404: { description: 'Post or Comment not found' }
        }
      }
    }
  }
};

module.exports = swaggerDefinition;
