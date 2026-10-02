ALTER TABLE office_chatter ADD COLUMN context_kind TEXT NOT NULL DEFAULT 'office';
ALTER TABLE office_chatter ADD COLUMN context_title TEXT;
ALTER TABLE office_chatter ADD COLUMN context_url TEXT;
ALTER TABLE office_chatter ADD COLUMN context_source TEXT;

CREATE TABLE IF NOT EXISTS watercooler_topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fingerprint TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('news', 'holiday')),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  context TEXT NOT NULL DEFAULT '',
  url TEXT,
  source TEXT NOT NULL,
  event_date TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS watercooler_topics_pick_idx
  ON watercooler_topics(active, kind, expires_at, last_used_at, use_count);

CREATE TABLE IF NOT EXISTS agent_social_state (
  agent_id TEXT PRIMARY KEY REFERENCES agents(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  activity TEXT NOT NULL,
  last_topic TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO agent_social_state (agent_id, mood, activity, last_topic) VALUES
  ('atlas', 'focused', 'guarding the quiet before coffee', NULL),
  ('scout', 'curious', 'checking what everyone else missed', NULL),
  ('pixel', 'composed', 'defending the lunch calendar', NULL),
  ('muse', 'amused', 'considering the strategic value of pastries', NULL);
