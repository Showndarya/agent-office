CREATE TABLE IF NOT EXISTS task_schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  task_type TEXT NOT NULL DEFAULT 'research' CHECK (task_type IN ('qna', 'research')),
  model_mode TEXT NOT NULL DEFAULT 'auto' CHECK (model_mode IN ('auto', 'fast', 'smart', 'deep')),
  cadence TEXT NOT NULL CHECK (cadence IN ('daily', 'twice_daily')),
  time_one TEXT NOT NULL,
  time_two TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/New_York',
  team_agents TEXT NOT NULL DEFAULT '["atlas","scout","pixel","muse"]',
  allow_recruits INTEGER NOT NULL DEFAULT 1,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run_at TEXT,
  last_task_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS task_schedules_enabled_idx
  ON task_schedules(enabled, time_one, time_two);

ALTER TABLE tasks ADD COLUMN schedule_id INTEGER REFERENCES task_schedules(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN schedule_run_key TEXT;
ALTER TABLE tasks ADD COLUMN team_agents TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN collaborators TEXT NOT NULL DEFAULT '[]';
ALTER TABLE tasks ADD COLUMN allow_recruits INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS tasks_schedule_run_idx
  ON tasks(schedule_id, schedule_run_key)
  WHERE schedule_id IS NOT NULL AND schedule_run_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS office_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_outbox (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL UNIQUE REFERENCES tasks(id) ON DELETE CASCADE,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'retry', 'sent', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  next_attempt_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT
);

CREATE INDEX IF NOT EXISTS notification_outbox_queue_idx
  ON notification_outbox(status, next_attempt_at, id);
