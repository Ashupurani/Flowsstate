-- Update enhanced_tasks table with missing user_id and other required fields
-- This fixes the incomplete schema that was preventing the enhanced tasks feature from working

ALTER TABLE enhanced_tasks
ADD COLUMN user_id integer,
ADD COLUMN task_id integer,
ADD COLUMN updated_at timestamp DEFAULT now();

-- Add foreign key constraints
ALTER TABLE enhanced_tasks
ADD CONSTRAINT fk_enhanced_tasks_user_id
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE enhanced_tasks
ADD CONSTRAINT fk_enhanced_tasks_task_id
FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_user_id ON enhanced_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_task_id ON enhanced_tasks(task_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_tasks_status ON enhanced_tasks(user_id, status);
