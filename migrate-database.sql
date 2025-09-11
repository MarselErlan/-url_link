-- Database migration script to assign all existing links to ericabram33@gmail.com
-- Run this script to update your PostgreSQL database

-- First, let's see what data we currently have
SELECT 
    user_id, 
    COUNT(*) as record_count,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM job_applications 
GROUP BY user_id 
ORDER BY record_count DESC;

-- Update all records with NULL user_id or 'legacy_user' to ericabram33@gmail.com
UPDATE job_applications 
SET user_id = 'ericabram33@gmail.com'
WHERE user_id IS NULL 
   OR user_id = 'legacy_user'
   OR user_id = '';

-- Update any other generated user IDs to ericabram33@gmail.com
-- (This will consolidate all data under one user)
UPDATE job_applications 
SET user_id = 'ericabram33@gmail.com'
WHERE user_id LIKE 'user_%' 
   OR user_id LIKE 'anonymous_%';

-- Verify the changes
SELECT 
    user_id, 
    COUNT(*) as record_count,
    COUNT(CASE WHEN applied = true THEN 1 END) as applied_count,
    COUNT(CASE WHEN applied = false THEN 1 END) as not_applied_count
FROM job_applications 
GROUP BY user_id 
ORDER BY record_count DESC;

-- Show some sample records to verify
SELECT 
    id,
    user_id,
    url,
    title,
    applied,
    created_at
FROM job_applications 
ORDER BY created_at DESC 
LIMIT 10;
