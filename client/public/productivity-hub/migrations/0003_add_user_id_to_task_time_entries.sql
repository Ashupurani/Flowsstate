-- Add userId field to task_time_entries table for user isolation and multi-tenancy
-- This ensures time entries are properly scoped to their users

ALTER TABLE task_time_entries
ADD COLUMN user_id integer;

-- Add the foreign key constraint
ALTER TABLE task_time_entries
ADD CONSTRAINT fk_task_time_entries_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraint to tasks table (was missing)
ALTER TABLE task_time_entries
ADD CONSTRAINT fk_task_time_entries_task_id
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_id ON task_time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_task_id ON task_time_entries(task_id);
CREATE INDEX IF NOT EXISTS idx_task_time_entries_user_task ON task_time_entries(user_id, task_id);
