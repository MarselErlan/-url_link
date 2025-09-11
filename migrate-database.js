// Database migration script to assign all existing links to ericabram33@gmail.com
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:OZNHVfQlRwGhcUBFmkVluOzTonqTpIKa@interchange.proxy.rlwy.net:30153/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

async function migrateDatabase() {
  console.log('🔄 Starting database migration...\n');
  
  try {
    // Step 1: Check current data
    console.log('1️⃣ Checking current data...');
    const beforeQuery = `
      SELECT 
        user_id, 
        COUNT(*) as record_count,
        MIN(created_at) as earliest_record,
        MAX(created_at) as latest_record
      FROM job_applications 
      GROUP BY user_id 
      ORDER BY record_count DESC
    `;
    
    const beforeResult = await pool.query(beforeQuery);
    console.log('📊 Current data distribution:');
    beforeResult.rows.forEach(row => {
      console.log(`  ${row.user_id || 'NULL'}: ${row.record_count} records (${row.earliest_record} to ${row.latest_record})`);
    });
    
    // Step 2: Update NULL and legacy user IDs
    console.log('\n2️⃣ Updating NULL and legacy user IDs...');
    const updateLegacyQuery = `
      UPDATE job_applications 
      SET user_id = 'ericabram33@gmail.com'
      WHERE user_id IS NULL 
         OR user_id = 'legacy_user'
         OR user_id = ''
    `;
    
    const legacyResult = await pool.query(updateLegacyQuery);
    console.log(`✅ Updated ${legacyResult.rowCount} legacy records`);
    
    // Step 3: Update generated user IDs
    console.log('\n3️⃣ Updating generated user IDs...');
    const updateGeneratedQuery = `
      UPDATE job_applications 
      SET user_id = 'ericabram33@gmail.com'
      WHERE user_id LIKE 'user_%' 
         OR user_id LIKE 'anonymous_%'
    `;
    
    const generatedResult = await pool.query(updateGeneratedQuery);
    console.log(`✅ Updated ${generatedResult.rowCount} generated user ID records`);
    
    // Step 4: Verify the changes
    console.log('\n4️⃣ Verifying changes...');
    const afterQuery = `
      SELECT 
        user_id, 
        COUNT(*) as record_count,
        COUNT(CASE WHEN applied = true THEN 1 END) as applied_count,
        COUNT(CASE WHEN applied = false THEN 1 END) as not_applied_count
      FROM job_applications 
      GROUP BY user_id 
      ORDER BY record_count DESC
    `;
    
    const afterResult = await pool.query(afterQuery);
    console.log('📊 Updated data distribution:');
    afterResult.rows.forEach(row => {
      console.log(`  ${row.user_id}: ${row.record_count} total records`);
      console.log(`    - Applied: ${row.applied_count}`);
      console.log(`    - Not Applied: ${row.not_applied_count}`);
    });
    
    // Step 5: Show sample records
    console.log('\n5️⃣ Sample records:');
    const sampleQuery = `
      SELECT 
        id,
        user_id,
        url,
        title,
        applied,
        created_at
      FROM job_applications 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const sampleResult = await pool.query(sampleQuery);
    sampleResult.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.title || 'No title'} (${row.applied ? 'Applied' : 'Not Applied'})`);
      console.log(`     URL: ${row.url}`);
      console.log(`     User: ${row.user_id}`);
      console.log(`     Date: ${row.created_at}`);
    });
    
    console.log('\n🎉 Database migration completed successfully!');
    console.log('All existing records are now assigned to ericabram33@gmail.com');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration
migrateDatabase().catch(console.error);
