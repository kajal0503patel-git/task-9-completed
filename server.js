const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');

// Initialize environment variables from .env file
require('dotenv').config();

// Middleware imports
const requestLogger = require('./src/middleware/logger');
const { errorHandler, AppError } = require('./src/middleware/errorHandler');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const postRoutes = require('./src/routes/postRoutes');

// Swagger specification object
const swaggerDefinition = require('./src/docs/swaggerDef');

const app = express();

/**
 * 1. Global Middleware Configurations
 */
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Parse incoming request payloads containing JSON bodies
app.use(express.json());

// Parse URL-encoded request payloads (extended: true allows nested object structures)
app.use(express.urlencoded({ extended: true }));

// Attach our beautiful custom console & file logger
app.use(requestLogger);

/**
 * 2. API Documentation Route
 * Mounts interactive Swagger UI representation of our endpoints
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

/**
 * 3. Base / Landing Page Route
 * Serves a highly polished, responsive landing page detailing instructions.
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blogging Platform API</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=JetBrains+Mono&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-color: #0b0f19;
          --panel-bg: rgba(17, 24, 39, 0.7);
          --accent-blue: #3b82f6;
          --accent-cyan: #06b6d4;
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --border-color: rgba(255, 255, 255, 0.08);
        }
        
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Outfit', sans-serif;
          background-color: var(--bg-color);
          background-image: 
            radial-gradient(at 0% 0%, rgba(59, 130, 246, 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.12) 0px, transparent 50%);
          color: var(--text-primary);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          overflow-x: hidden;
        }

        .container {
          max-width: 800px;
          width: 100%;
          background: var(--panel-bg);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 3rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          position: relative;
        }

        .container::before {
          content: '';
          position: absolute;
          top: -2px; left: -2px; right: -2px; bottom: -2px;
          background: linear-gradient(45deg, var(--accent-blue), var(--accent-cyan));
          border-radius: 26px;
          z-index: -1;
          opacity: 0.15;
        }

        h1 {
          font-size: 2.8rem;
          font-weight: 800;
          background: linear-gradient(135deg, #fff 30%, #a5b4fc 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
          letter-spacing: -0.5px;
        }

        .badge {
          display: inline-block;
          background: rgba(59, 130, 246, 0.1);
          color: #60a5fa;
          padding: 0.35rem 0.8rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 100px;
          border: 1px solid rgba(59, 130, 246, 0.2);
          margin-bottom: 2rem;
        }

        p {
          font-size: 1.1rem;
          line-height: 1.6;
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }

        .card-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 1.5rem;
          transition: transform 0.2s, border-color 0.2s;
        }

        .card:hover {
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .card h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #fff;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .card p {
          font-size: 0.95rem;
          margin: 0;
        }

        .code-box {
          font-family: 'JetBrains Mono', monospace;
          background: #060913;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          font-size: 0.9rem;
          color: #34d399;
          margin-bottom: 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-blue), #2563eb);
          color: white;
          text-decoration: none;
          padding: 1rem 2rem;
          font-weight: 600;
          border-radius: 12px;
          transition: filter 0.2s, transform 0.2s;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
          cursor: pointer;
        }

        .btn:hover {
          filter: brightness(1.15);
          transform: translateY(-1px);
        }

        .footer {
          margin-top: 3rem;
          text-align: center;
          font-size: 0.85rem;
          color: #4b5563;
        }

        @media (max-width: 640px) {
          .card-grid {
            grid-template-columns: 1fr;
          }
          .container {
            padding: 1.5rem;
          }
          h1 {
            font-size: 2rem;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Blogging Platform API</h1>
        <span class="badge">v1.0.0 • Online</span>
        
        <p>
          Welcome to the Blog API server! This backend has been successfully configured. It implements a JSON-based database engine, JWT Authentication, and a nested comments schema.
        </p>

        <div class="card-grid">
          <div class="card">
            <h3>⚡ Swagger Documentation</h3>
            <p>Test all API endpoints directly in your browser with our interactive playground.</p>
          </div>
          <div class="card">
            <h3>🔒 JWT Authentication</h3>
            <p>Secure routes for managing posts and writing or moderate comments on articles.</p>
          </div>
        </div>

        <div class="code-box">
          <span>GET /api/health</span>
          <span style="color: var(--text-secondary);">- System Health Check</span>
        </div>

        <div style="text-align: center;">
          <a href="/api-docs" class="btn">Explore Interactive API Docs</a>
        </div>

        <div class="footer">
          Designed by Antigravity AI • Running on port ${process.env.PORT || 3000}
        </div>
      </div>
    </body>
    </html>
  `);
});

/**
 * 4. General Health Endpoint
 * Public route to verify application health and local timestamp
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

/**
 * 5. Primary Application Routes
 */
// Mount Authentication Endpoints
app.use('/api/auth', authRoutes);

// Mount Blog Post Endpoints (handles comments internally as nested routes)
app.use('/api/posts', postRoutes);

/**
 * 6. Wildcard Fallback Route Handler (404)
 * Triggers when a request hits an endpoint that doesn't match any routes
 */
app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find endpoint "${req.method} ${req.originalUrl}" on this server.`, 404));
});

/**
 * 7. Global Exception/Error Handler
 * Catches all errors from async handlers, validation schemas, or syntax anomalies
 */
app.use(errorHandler);

/**
 * 8. Server Booting Process
 */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('----------------------------------------------------');
  console.log(`🚀 Blog API server listening on port: \x1b[36m${PORT}\x1b[0m`);
  console.log(`🌍 Interactive API docs: \x1b[32mhttp://localhost:${PORT}/api-docs\x1b[0m`);
  console.log('----------------------------------------------------');
});

module.exports = app; // Export for testing purposes
