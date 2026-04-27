-- Add missing foreign key constraint to habit_entries table
-- Ensures data integrity: habit entries can only reference existing habits

ALTER TABLE habit_entries
ADD CONSTRAINT fk_habit_entries_habit_id
FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_habit_entries_habit_id ON habit_entries(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_entries_user_date ON habit_entries(user_id, date);
