const fs = require('fs');
const path = require('path');

// Define database directory and file paths
const DB_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(
  DB_DIR,
  process.env.NODE_ENV === 'test' ? 'db.test.json' : 'db.json'
);

/**
 * Initialize the JSON database file if it doesn't exist.
 * This guarantees the server is self-contained and ready to run immediately.
 */
function initDb() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      posts: [],
      comments: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
  }
}

// Immediately initialize the DB upon module load
initDb();

/**
 * Read the entire database file synchronously.
 * Returns parsed JSON.
 */
function readDb() {
  try {
    const rawData = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading JSON database file. Re-initializing...', error);
    // If the file is corrupt, reset it to prevent server crashes
    const initialData = { users: [], posts: [], comments: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

/**
 * Write updated database state back to the file.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to JSON database file:', error);
    throw new Error('Database write operation failed.');
  }
}

// Database helper functions for queries
const db = {
  /**
   * Operations for User records
   */
  users: {
    find: () => readDb().users,
    
    findById: (id) => readDb().users.find(u => u.id === id),
    
    findOne: (criteria) => {
      const users = readDb().users;
      return users.find(u => {
        for (const key in criteria) {
          if (u[key] !== criteria[key]) return false;
        }
        return true;
      });
    },
    
    create: (userData) => {
      const data = readDb();
      const newUser = {
        id: 'u_' + Date.now() + Math.random().toString(36).substr(2, 4),
        ...userData,
        createdAt: new Date().toISOString()
      };
      data.users.push(newUser);
      writeDb(data);
      return newUser;
    }
  },

  /**
   * Operations for Post records
   */
  posts: {
    find: (filter = {}) => {
      let posts = readDb().posts;
      
      // Apply basic search queries if provided
      if (filter.search) {
        const query = filter.search.toLowerCase();
        posts = posts.filter(p => 
          p.title.toLowerCase().includes(query) || 
          p.content.toLowerCase().includes(query)
        );
      }
      
      // Apply author filtering if provided
      if (filter.authorId) {
        posts = posts.filter(p => p.authorId === filter.authorId);
      }
      
      return posts;
    },
    
    findById: (id) => {
      const posts = readDb().posts;
      return posts.find(p => p.id === id);
    },
    
    create: (postData) => {
      const data = readDb();
      const newPost = {
        id: 'p_' + Date.now() + Math.random().toString(36).substr(2, 4),
        ...postData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      data.posts.push(newPost);
      writeDb(data);
      return newPost;
    },
    
    update: (id, updateFields) => {
      const data = readDb();
      const index = data.posts.findIndex(p => p.id === id);
      if (index === -1) return null;
      
      data.posts[index] = {
        ...data.posts[index],
        ...updateFields,
        updatedAt: new Date().toISOString()
      };
      
      writeDb(data);
      return data.posts[index];
    },
    
    delete: (id) => {
      const data = readDb();
      const index = data.posts.findIndex(p => p.id === id);
      if (index === -1) return false;
      
      // Remove the post
      data.posts.splice(index, 1);
      // Clean up comments associated with this post
      data.comments = data.comments.filter(c => c.postId !== id);
      
      writeDb(data);
      return true;
    }
  },

  /**
   * Operations for Comment records
   */
  comments: {
    find: (filter = {}) => {
      let comments = readDb().comments;
      if (filter.postId) {
        comments = comments.filter(c => c.postId === filter.postId);
      }
      return comments;
    },
    
    findById: (id) => readDb().comments.find(c => c.id === id),
    
    create: (commentData) => {
      const data = readDb();
      const newComment = {
        id: 'c_' + Date.now() + Math.random().toString(36).substr(2, 4),
        ...commentData,
        createdAt: new Date().toISOString()
      };
      data.comments.push(newComment);
      writeDb(data);
      return newComment;
    },
    
    delete: (id) => {
      const data = readDb();
      const index = data.comments.findIndex(c => c.id === id);
      if (index === -1) return false;
      
      data.comments.splice(index, 1);
      writeDb(data);
      return true;
    }
  }
};

module.exports = db;
