const { AppError } = require('./errorHandler');

// A simple, bulletproof RFC 5322 regex for email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Higher-order middleware factory that validates request body fields against a predefined schema.
 */
function validateSchema(schema) {
  return (req, res, next) => {
    const errors = [];
    const body = req.body || {};

    for (const field in schema) {
      const rules = schema[field];
      const val = body[field];

      // 1. Required Check
      if (rules.required) {
        if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
          errors.push(`Field '${field}' is required and cannot be empty.`);
          continue; // Skip further checks for this missing field
        }
      }

      // If value is provided, evaluate constraints
      if (val !== undefined && val !== null && val !== '') {
        // 2. Type Check
        if (rules.type === 'array') {
          if (!Array.isArray(val)) {
            errors.push(`Field '${field}' must be an array.`);
            continue;
          }
        } else if (rules.type && typeof val !== rules.type) {
          errors.push(`Field '${field}' must be a ${rules.type}.`);
          continue;
        }

        // 3. String Length Constraints
        if (typeof val === 'string') {
          const trimmedVal = val.trim();
          if (rules.minLength && trimmedVal.length < rules.minLength) {
            errors.push(`Field '${field}' must be at least ${rules.minLength} characters.`);
          }
          if (rules.maxLength && trimmedVal.length > rules.maxLength) {
            errors.push(`Field '${field}' cannot exceed ${rules.maxLength} characters.`);
          }
        }

        // 4. Format Validations
        if (rules.format === 'email' && typeof val === 'string') {
          if (!EMAIL_REGEX.test(val)) {
            errors.push(`Field '${field}' must be a valid email address.`);
          }
        }
      }
    }

    // If validations failed, interrupt request flow and report errors
    if (errors.length > 0) {
      return next(new AppError('Validation failed for request input parameters.', 400, errors));
    }

    next();
  };
}

// Pre-defined schemas for validation targets
const schemas = {
  register: {
    username: { required: true, type: 'string', minLength: 3, maxLength: 30 },
    email: { required: true, type: 'string', format: 'email' },
    password: { required: true, type: 'string', minLength: 6, maxLength: 100 }
  },
  login: {
    email: { required: true, type: 'string', format: 'email' },
    password: { required: true, type: 'string' }
  },
  post: {
    title: { required: true, type: 'string', minLength: 5, maxLength: 150 },
    content: { required: true, type: 'string', minLength: 10 },
    tags: { required: false, type: 'array' }
  },
  comment: {
    content: { required: true, type: 'string', minLength: 2, maxLength: 500 }
  }
};

module.exports = {
  validateSchema,
  schemas
};
