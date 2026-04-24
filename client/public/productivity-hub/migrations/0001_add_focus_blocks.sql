-- Focus Protection Engine schema
-- NOTE: reviewed migration script only; not executed by assistant.

CREATE TABLE IF NOT EXISTS focus_blocks (
  id serial PRIMARY KEY,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  planned_duration_min integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamp NOT NULL DEFAULT now(),
  paused_at timestamp,
  total_paused_ms integer NOT NULL DEFAULT 0,
  completed_at timestamp,
  actual_duration_sec integer,
  quality_rating integer,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS focus_interruptions (
  id serial PRIMARY KEY,
  focus_block_id integer NOT NULL REFERENCES focus_blocks(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interruption_type text NOT NULL DEFAULT 'internal',
  note text,
  occurred_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_focus_blocks_user_status ON focus_blocks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_focus_blocks_completed_at ON focus_blocks(completed_at);
CREATE INDEX IF NOT EXISTS idx_focus_interruptions_block_id ON focus_interruptions(focus_block_id);
CREATE INDEX IF NOT EXISTS idx_focus_interruptions_user_id ON focus_interruptions(user_id);
