-- Add unique constraint to prevent multiple active focus blocks per user
-- This prevents race conditions where multiple focus blocks could be created

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_focus_per_user
ON focus_blocks(user_id, status)
WHERE status = 'active';
