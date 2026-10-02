ALTER TABLE command_chat_messages
  ADD COLUMN archived_at TEXT;

ALTER TABLE command_chat_messages
  ADD COLUMN archive_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN archive_key TEXT;

CREATE INDEX IF NOT EXISTS command_chat_active_idx
  ON command_chat_messages(day_key, archived_at, id);

CREATE UNIQUE INDEX IF NOT EXISTS tasks_archive_key_idx
  ON tasks(archive_key)
  WHERE archive_key IS NOT NULL;
