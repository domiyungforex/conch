-- Add notification preferences to users table
-- Migration 002

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "mute_users": [],
  "mute_conches": [],
  "email_notifications": true,
  "push_notifications": true,
  "mentions": true,
  "follows": true,
  "likes": true,
  "digest": "daily"
}'::jsonb;