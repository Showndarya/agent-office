PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  personality TEXT NOT NULL,
  emoji TEXT NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'busy', 'offline')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox', 'active', 'done')),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS tasks_created_at_idx ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS tasks_agent_id_idx ON tasks(agent_id);

INSERT OR IGNORE INTO agents (id, name, role, personality, emoji, color) VALUES
  ('atlas', 'Atlas', 'Chief of Staff', 'Calm, strategic, and always three steps ahead.', '🧭', '#7C6BF2'),
  ('scout', 'Scout', 'Researcher', 'Curious, quick, and happiest following a fresh lead.', '🔭', '#23A8A0'),
  ('pixel', 'Pixel', 'Builder', 'Practical, precise, and eager to ship useful things.', '🛠️', '#F08A5D'),
  ('muse', 'Muse', 'Creative', 'Playful, imaginative, and full of unexpected angles.', '✨', '#D968A6');
