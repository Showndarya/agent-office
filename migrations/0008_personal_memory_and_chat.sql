CREATE TABLE IF NOT EXISTS user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  display_name TEXT NOT NULL DEFAULT 'Commander',
  summary TEXT NOT NULL,
  communication_style TEXT NOT NULL,
  decision_style TEXT NOT NULL,
  collaboration_style TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL CHECK (category IN (
    'identity', 'trait', 'interest', 'preference', 'dislike', 'style', 'goal', 'context'
  )),
  label TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence BETWEEN 0 AND 1),
  evidence_count INTEGER NOT NULL DEFAULT 1,
  contributed_by TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'conversation' CHECK (source IN ('baseline', 'conversation', 'correction')),
  active INTEGER NOT NULL DEFAULT 1,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  to_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  weight REAL NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  evidence_count INTEGER NOT NULL DEFAULT 1,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (from_node_id, relation, to_node_id)
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_rank_idx
  ON knowledge_nodes(active, confidence DESC, evidence_count DESC, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS command_chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  mode TEXT NOT NULL DEFAULT 'qna' CHECK (mode IN ('qna', 'research')),
  content TEXT NOT NULL DEFAULT '',
  model_mode TEXT NOT NULL DEFAULT 'auto' CHECK (model_mode IN ('auto', 'fast', 'smart', 'deep')),
  model_used TEXT,
  sources TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'complete' CHECK (status IN ('queued', 'running', 'complete', 'failed')),
  error TEXT,
  reply_to_id INTEGER REFERENCES command_chat_messages(id) ON DELETE CASCADE,
  day_key TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  lease_expires_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS command_chat_day_idx
  ON command_chat_messages(day_key, id);

CREATE INDEX IF NOT EXISTS command_chat_queue_idx
  ON command_chat_messages(status, lease_expires_at, id);

INSERT OR REPLACE INTO user_profile
  (id, display_name, summary, communication_style, decision_style, collaboration_style, updated_at)
VALUES
  (1,
   'Commander',
   'A private AI-office owner. This starter profile is intentionally sparse and should evolve only from explicit conversations and corrections.',
   'Not learned yet.',
   'Not learned yet.',
   'Not learned yet.',
   CURRENT_TIMESTAMP);

INSERT OR IGNORE INTO knowledge_nodes
  (id, category, label, description, confidence, evidence_count, contributed_by, source)
VALUES
  ('person:user', 'identity', 'The Commander', 'The person this private office serves. Profile claims describe observed working preferences, not diagnoses.', 1.0, 1, '[]', 'baseline');

INSERT OR IGNORE INTO knowledge_edges
  (from_node_id, relation, to_node_id, weight, evidence_count)
SELECT 'person:user',
  CASE category
    WHEN 'preference' THEN 'prefers'
    WHEN 'dislike' THEN 'avoids'
    WHEN 'interest' THEN 'is_interested_in'
    WHEN 'goal' THEN 'is_working_toward'
    WHEN 'style' THEN 'communicates_with'
    WHEN 'trait' THEN 'often_shows'
    ELSE 'has_context'
  END,
  id,
  confidence,
  evidence_count
FROM knowledge_nodes
WHERE id <> 'person:user';
