ALTER TABLE tasks ADD COLUMN task_type TEXT NOT NULL DEFAULT 'build';
ALTER TABLE tasks ADD COLUMN execution_target TEXT NOT NULL DEFAULT 'mac';
ALTER TABLE tasks ADD COLUMN execution_status TEXT NOT NULL DEFAULT 'queued';
ALTER TABLE tasks ADD COLUMN result TEXT;
ALTER TABLE tasks ADD COLUMN error TEXT;
ALTER TABLE tasks ADD COLUMN sources TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN runner_id TEXT;
ALTER TABLE tasks ADD COLUMN started_at TEXT;
ALTER TABLE tasks ADD COLUMN completed_at TEXT;
ALTER TABLE tasks ADD COLUMN lease_expires_at TEXT;
ALTER TABLE tasks ADD COLUMN model_mode TEXT NOT NULL DEFAULT 'auto';
ALTER TABLE tasks ADD COLUMN model_used TEXT;
ALTER TABLE tasks ADD COLUMN route_reason TEXT;

CREATE INDEX IF NOT EXISTS tasks_execution_queue_idx
  ON tasks(execution_target, execution_status, created_at);

CREATE TABLE IF NOT EXISTS runners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Preserve the useful research task created during V0 and let the cloud pick it up.
UPDATE tasks
SET task_type = 'research', execution_target = 'cloud', agent_id = 'scout'
WHERE LOWER(title) LIKE 'research%';
