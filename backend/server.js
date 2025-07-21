const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OZNHVfQlRwGhcUBFmkVluOzTonqTpIKa@interchange.proxy.rlwy.net:30153/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database tables
async function initDB() {
  try {
    // First, create table with basic structure if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS job_applications (
        id SERIAL PRIMARY KEY,
        url VARCHAR(2048) NOT NULL,
        domain VARCHAR(255) NOT NULL,
        title VARCHAR(500),
        applied BOOLEAN DEFAULT false,
        applied_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes TEXT
      );
    `);
    
    // Check if user_id column exists, and add it if it doesn't
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' AND column_name = 'user_id';
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('Adding user_id column to existing table...');
      // Add user_id column with a default value for existing rows
      await pool.query(`
        ALTER TABLE job_applications 
        ADD COLUMN user_id VARCHAR(255) NOT NULL DEFAULT 'legacy_user';
      `);
      console.log('user_id column added successfully');
    }
    
    // Add job_id column if not exists
    const jobIdColumnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'job_applications' AND column_name = 'job_id';
    `);
    if (jobIdColumnCheck.rows.length === 0) {
      console.log('Adding job_id column to existing table...');
      await pool.query(`ALTER TABLE job_applications ADD COLUMN job_id VARCHAR(64);
        `);
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_jobid ON job_applications(user_id, job_id);`);
      console.log('job_id column added successfully');
    }
    
    // Create indexes if they don't exist
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_url ON job_applications(url);
      CREATE INDEX IF NOT EXISTS idx_domain ON job_applications(domain);
      CREATE INDEX IF NOT EXISTS idx_user_url ON job_applications(user_id, url);
      CREATE INDEX IF NOT EXISTS idx_user_id ON job_applications(user_id);
    `);
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '');
  } catch (error) {
    return url;
  }
}

// Helper function to extract LinkedIn job ID
function extractLinkedInJobId(url) {
  try {
    const parsedUrl = new URL(url);
    // Try to get from query param
    const jobId = parsedUrl.searchParams.get('currentJobId');
    if (jobId) return jobId;
    // Try to get from path (e.g. /jobs/view/1234567890/)
    const match = parsedUrl.pathname.match(/\/jobs\/view\/(\d+)/);
    if (match) return match[1];
    return null;
  } catch (e) {
    return null;
  }
}

// Routes

// Get application status for a specific URL
app.get('/api/status/:url', async (req, res) => {
  try {
    const url = decodeURIComponent(req.params.url);
    const userId = req.headers['x-user-id'];
    const jobId = extractLinkedInJobId(url);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    let result;
    if (jobId) {
      // LinkedIn: check by job_id
      result = await pool.query(
        'SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2 ORDER BY created_at DESC LIMIT 1',
        [userId, jobId]
      );
    } else {
      // Other: check by full URL
      result = await pool.query(
        'SELECT * FROM job_applications WHERE url = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
        [url, userId]
      );
    }
    
    if (result.rows.length > 0) {
      res.json({
        found: true,
        application: result.rows[0]
      });
    } else {
      res.json({
        found: false,
        application: null
      });
    }
  } catch (error) {
    console.error('Error checking status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check multiple URLs at once
app.post('/api/status/batch', async (req, res) => {
  try {
    const { urls } = req.body;
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({ error: 'URLs array required' });
    }
    
    if (urls.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 URLs allowed per request' });
    }
    
    const results = [];
    
    for (const url of urls) {
      try {
        const jobId = extractLinkedInJobId(url);
        let result;
        if (jobId) {
          result = await pool.query(
            'SELECT * FROM job_applications WHERE user_id = $1 AND job_id = $2 ORDER BY created_at DESC LIMIT 1',
            [userId, jobId]
          );
        } else {
          result = await pool.query(
            'SELECT * FROM job_applications WHERE url = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
            [url, userId]
          );
        }
        
        if (result.rows.length > 0) {
          results.push({
            url: url,
            found: true,
            application: result.rows[0]
          });
        } else {
          results.push({
            url: url,
            found: false,
            application: null
          });
        }
      } catch (error) {
        console.error(`Error checking URL ${url}:`, error);
        results.push({
          url: url,
          found: false,
          application: null,
          error: 'Failed to check URL'
        });
      }
    }
    
    res.json({ results });
  } catch (error) {
    console.error('Error checking batch status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save or update application
app.post('/api/applications', async (req, res) => {
  try {
    const { url, title, applied, notes } = req.body;
    const userId = req.headers['x-user-id'];
    const domain = extractDomain(url);
    const jobId = extractLinkedInJobId(url);
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    let existingResult;
    if (jobId) {
      existingResult = await pool.query(
        'SELECT id FROM job_applications WHERE user_id = $1 AND job_id = $2',
        [userId, jobId]
      );
    } else {
      existingResult = await pool.query(
        'SELECT id FROM job_applications WHERE url = $1 AND user_id = $2',
        [url, userId]
      );
    }
    
    if (existingResult.rows.length > 0) {
      // Update existing record
      let updateResult;
      if (jobId) {
        updateResult = await pool.query(
          `UPDATE job_applications 
           SET applied = $1, applied_date = $2, title = $3, notes = $4, updated_at = CURRENT_TIMESTAMP, url = $5, domain = $6
           WHERE user_id = $7 AND job_id = $8
           RETURNING *`,
          [applied, applied ? new Date() : null, title, notes, url, domain, userId, jobId]
        );
      } else {
        updateResult = await pool.query(
          `UPDATE job_applications 
           SET applied = $1, applied_date = $2, title = $3, notes = $4, updated_at = CURRENT_TIMESTAMP
           WHERE url = $5 AND user_id = $6
           RETURNING *`,
          [applied, applied ? new Date() : null, title, notes, url, userId]
        );
      }
      
      res.json({
        success: true,
        application: updateResult.rows[0],
        action: 'updated'
      });
    } else {
      // Insert new record
      let insertResult;
      if (jobId) {
        insertResult = await pool.query(
          `INSERT INTO job_applications (user_id, url, domain, title, applied, applied_date, notes, job_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [userId, url, domain, title, applied, applied ? new Date() : null, notes, jobId]
        );
      } else {
        insertResult = await pool.query(
          `INSERT INTO job_applications (user_id, url, domain, title, applied, applied_date, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [userId, url, domain, title, applied, applied ? new Date() : null, notes]
        );
      }
      
      res.json({
        success: true,
        application: insertResult.rows[0],
        action: 'created'
      });
    }
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_urls,
        COUNT(CASE WHEN applied = true THEN 1 END) as applied_count,
        COUNT(CASE WHEN applied = false THEN 1 END) as not_applied_count
      FROM job_applications
      WHERE user_id = $1
    `, [userId]);
    
    res.json(statsResult.rows[0]);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent applications
app.get('/api/recent', async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const result = await pool.query(
      'SELECT * FROM job_applications ORDER BY updated_at DESC LIMIT $1',
      [limit]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting recent applications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete application
app.delete('/api/applications/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await pool.query(
      'DELETE FROM job_applications WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length > 0) {
      res.json({ success: true, deleted: result.rows[0] });
    } else {
      res.status(404).json({ error: 'Application not found' });
    }
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await initDB();
});

module.exports = app; 