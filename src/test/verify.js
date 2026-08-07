// Force test configuration variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3050';
process.env.JWT_SECRET = 'test_suite_secret_key_999';

const assert = require('assert');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Import the Express application (this starts the server on port 3050)
const app = require('../../server');

// Target server base URL
const BASE_URL = 'http://localhost:3050';

/**
 * Native HTTP Request helper to simplify asynchronous requests in tests.
 */
function makeRequest(method, urlPath, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = data ? JSON.parse(data) : null;
        } catch (e) {
          parsed = data; // Fallback to raw string if not JSON
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

// Running states
let userToken = '';
let createdPostId = '';
let createdCommentId = '';

async function runTests() {
  console.log('\n\x1b[36m====================================================');
  console.log('🧪 RUNNING NODE.JS BLOG API VERIFICATION SUITE');
  console.log('====================================================\x1b[0m\n');

  try {
    // ----------------------------------------------------
    // Test 1: Health Check Endpoint
    // ----------------------------------------------------
    console.log('▶ Test 1: GET /api/health ...');
    const health = await makeRequest('GET', '/api/health');
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.body.status, 'ok');
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 2: User Registration Validation Failure
    // ----------------------------------------------------
    console.log('▶ Test 2: POST /api/auth/register (Validation check) ...');
    const badReg = await makeRequest('POST', '/api/auth/register', {}, {
      username: 'al', // Too short (min is 3)
      email: 'invalid-email-format',
      password: '123' // Too short (min is 6)
    });
    assert.strictEqual(badReg.statusCode, 400);
    assert.strictEqual(badReg.body.status, 'fail');
    assert.ok(badReg.body.details.length >= 3, 'Should trigger multiple validation errors');
    console.log('  ✔ Passed (Correctly rejected malformed payload)');

    // ----------------------------------------------------
    // Test 3: User Registration Successful
    // ----------------------------------------------------
    console.log('▶ Test 3: POST /api/auth/register (Success check) ...');
    const goodReg = await makeRequest('POST', '/api/auth/register', {}, {
      username: 'tester_bob',
      email: 'bob@example.com',
      password: 'superSecretPassword123'
    });
    assert.strictEqual(goodReg.statusCode, 201);
    assert.strictEqual(goodReg.body.status, 'success');
    assert.ok(goodReg.body.data.user.id, 'User record must contain generated ID');
    assert.strictEqual(goodReg.body.data.user.username, 'tester_bob');
    assert.strictEqual(goodReg.body.data.user.password, undefined, 'Sensitive password field must be excluded');
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 4: Duplicate Email Registration Check
    // ----------------------------------------------------
    console.log('▶ Test 4: POST /api/auth/register (Duplicate check) ...');
    const dupReg = await makeRequest('POST', '/api/auth/register', {}, {
      username: 'another_bob',
      email: 'bob@example.com',
      password: 'anotherSecurePass123'
    });
    assert.strictEqual(dupReg.statusCode, 409);
    assert.strictEqual(dupReg.body.status, 'fail');
    console.log('  ✔ Passed (Correctly blocked duplicate email)');

    // ----------------------------------------------------
    // Test 5: Login Failure Check
    // ----------------------------------------------------
    console.log('▶ Test 5: POST /api/auth/login (Failure check) ...');
    const badLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'bob@example.com',
      password: 'wrongPasswordHere'
    });
    assert.strictEqual(badLogin.statusCode, 401);
    assert.strictEqual(badLogin.body.status, 'fail');
    console.log('  ✔ Passed (Correctly rejected invalid credentials)');

    // ----------------------------------------------------
    // Test 6: Login Successful Check
    // ----------------------------------------------------
    console.log('▶ Test 6: POST /api/auth/login (Success check) ...');
    const goodLogin = await makeRequest('POST', '/api/auth/login', {}, {
      email: 'bob@example.com',
      password: 'superSecretPassword123'
    });
    assert.strictEqual(goodLogin.statusCode, 200);
    assert.strictEqual(goodLogin.body.status, 'success');
    assert.ok(goodLogin.body.data.token, 'Should return jwt token');
    userToken = goodLogin.body.data.token;
    console.log('  ✔ Passed (Captured access token)');

    // ----------------------------------------------------
    // Test 7: Fetch Current Profile details (Auth me)
    // ----------------------------------------------------
    console.log('▶ Test 7: GET /api/auth/me (Protected check) ...');
    const profile = await makeRequest('GET', '/api/auth/me', {
      'Authorization': `Bearer ${userToken}`
    });
    assert.strictEqual(profile.statusCode, 200);
    assert.strictEqual(profile.body.data.user.email, 'bob@example.com');
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 8: Create Blog Post without Auth (Should fail)
    // ----------------------------------------------------
    console.log('▶ Test 8: POST /api/posts (No token failure) ...');
    const unauthorizedPost = await makeRequest('POST', '/api/posts', {}, {
      title: 'Writing Asynchronous JS',
      content: 'This post is written anonymously...'
    });
    assert.strictEqual(unauthorizedPost.statusCode, 401);
    console.log('  ✔ Passed (Correctly rejected unauthorized post creation)');

    // ----------------------------------------------------
    // Test 9: Create Blog Post Successfully
    // ----------------------------------------------------
    console.log('▶ Test 9: POST /api/posts (Success check) ...');
    const createdPost = await makeRequest('POST', '/api/posts', {
      'Authorization': `Bearer ${userToken}`
    }, {
      title: 'Mastering Node.js and Express',
      content: 'Building RESTful APIs with Express is incredibly simple, clean, and highly performant.',
      tags: ['nodejs', 'express', 'javascript']
    });
    assert.strictEqual(createdPost.statusCode, 201);
    assert.strictEqual(createdPost.body.status, 'success');
    assert.ok(createdPost.body.data.post.id);
    assert.strictEqual(createdPost.body.data.post.author.username, 'tester_bob');
    createdPostId = createdPost.body.data.post.id;
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 10: Fetch All Posts & Verify Search Query
    // ----------------------------------------------------
    console.log('▶ Test 10: GET /api/posts (Listing & filter checks) ...');
    // Fetch all
    const allPosts = await makeRequest('GET', '/api/posts');
    assert.strictEqual(allPosts.statusCode, 200);
    assert.ok(allPosts.body.results >= 1);
    
    // Fetch with matching query
    const searchMatch = await makeRequest('GET', '/api/posts?search=Express');
    assert.strictEqual(searchMatch.body.results, 1);

    // Fetch with non-matching query
    const searchMiss = await makeRequest('GET', '/api/posts?search=Python');
    assert.strictEqual(searchMiss.body.results, 0);
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 11: Add a Comment to the Post
    // ----------------------------------------------------
    console.log('▶ Test 11: POST /api/posts/:id/comments ...');
    const commentRes = await makeRequest('POST', `/api/posts/${createdPostId}/comments`, {
      'Authorization': `Bearer ${userToken}`
    }, {
      content: 'This is an excellent write-up Bob!'
    });
    assert.strictEqual(commentRes.statusCode, 201);
    assert.strictEqual(commentRes.body.status, 'success');
    assert.ok(commentRes.body.data.comment.id);
    createdCommentId = commentRes.body.data.comment.id;
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 12: Fetch Single Post (Includes Author details and Nested comments)
    // ----------------------------------------------------
    console.log('▶ Test 12: GET /api/posts/:id (Hydrated entity details) ...');
    const singlePost = await makeRequest('GET', `/api/posts/${createdPostId}`);
    assert.strictEqual(singlePost.statusCode, 200);
    assert.strictEqual(singlePost.body.data.post.title, 'Mastering Node.js and Express');
    assert.strictEqual(singlePost.body.data.post.author.username, 'tester_bob');
    assert.strictEqual(singlePost.body.data.post.comments.length, 1);
    assert.strictEqual(singlePost.body.data.post.comments[0].content, 'This is an excellent write-up Bob!');
    assert.strictEqual(singlePost.body.data.post.comments[0].author.username, 'tester_bob');
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 13: Update Blog Post details
    // ----------------------------------------------------
    console.log('▶ Test 13: PUT /api/posts/:id ...');
    const updatedPost = await makeRequest('PUT', `/api/posts/${createdPostId}`, {
      'Authorization': `Bearer ${userToken}`
    }, {
      title: 'Mastering Node.js and Express Server Development',
      content: 'Express remains the leading web framework for Node.js due to its simplicity.',
      tags: ['nodejs', 'express', 'javascript', 'backend']
    });
    assert.strictEqual(updatedPost.statusCode, 200);
    assert.strictEqual(updatedPost.body.data.post.title, 'Mastering Node.js and Express Server Development');
    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Test 14: Delete Comments & Post
    // ----------------------------------------------------
    console.log('▶ Test 14: DELETE endpoints ...');
    // Delete comment
    const delComment = await makeRequest('DELETE', `/api/posts/${createdPostId}/comments/${createdCommentId}`, {
      'Authorization': `Bearer ${userToken}`
    });
    assert.strictEqual(delComment.statusCode, 200);

    // Verify comment is removed
    const postDetailsAfterCommentDel = await makeRequest('GET', `/api/posts/${createdPostId}`);
    assert.strictEqual(postDetailsAfterCommentDel.body.data.post.comments.length, 0);

    // Delete post
    const delPost = await makeRequest('DELETE', `/api/posts/${createdPostId}`, {
      'Authorization': `Bearer ${userToken}`
    });
    assert.strictEqual(delPost.statusCode, 200);

    // Verify post is removed (404)
    const checkPostMissing = await makeRequest('GET', `/api/posts/${createdPostId}`);
    assert.strictEqual(checkPostMissing.statusCode, 404);

    console.log('  ✔ Passed');

    // ----------------------------------------------------
    // Cleanup & Completion
    // ----------------------------------------------------
    console.log('\n\x1b[32m🎉 ALL SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!\x1b[0m\n');
    cleanup(0);

  } catch (error) {
    console.error('\n\x1b[31m❌ TEST FAILURE OCCURRED:\x1b[0m');
    console.error(error);
    cleanup(1);
  }
}

/**
 * Clean up test files and shutdown test server
 */
function cleanup(exitCode) {
  console.log('🧹 Cleaning up test database environment...');
  
  // Delete the testing database file
  const testDbFile = path.join(__dirname, '../../data/db.test.json');
  if (fs.existsSync(testDbFile)) {
    try {
      fs.unlinkSync(testDbFile);
      console.log('  ✔ Deleted data/db.test.json');
    } catch (e) {
      console.error('  ⚠ Failed to delete data/db.test.json:', e.message);
    }
  }

  // Force close HTTP server
  console.log('🔌 Shutting down test server...');
  process.exit(exitCode);
}

// Initiate the run
runTests();
