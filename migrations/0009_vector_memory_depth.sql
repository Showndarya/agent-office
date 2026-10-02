ALTER TABLE knowledge_nodes ADD COLUMN vector_dirty INTEGER NOT NULL DEFAULT 1;
ALTER TABLE knowledge_nodes ADD COLUMN embedded_at TEXT;
ALTER TABLE knowledge_nodes ADD COLUMN embedding_model TEXT;

CREATE INDEX IF NOT EXISTS knowledge_nodes_vector_sync_idx
  ON knowledge_nodes(vector_dirty, active, last_seen_at);

CREATE TABLE IF NOT EXISTS knowledge_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  to_node_id TEXT NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  rationale TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  evidence_count INTEGER NOT NULL DEFAULT 1,
  contributed_by TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT 'inferred' CHECK (source IN ('baseline', 'conversation', 'inferred', 'correction')),
  active INTEGER NOT NULL DEFAULT 1,
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (from_node_id <> to_node_id),
  UNIQUE (from_node_id, relation, to_node_id)
);

CREATE INDEX IF NOT EXISTS knowledge_relationships_rank_idx
  ON knowledge_relationships(active, weight DESC, evidence_count DESC, last_seen_at DESC);

-- Relationships are learned from the owner's conversations after setup.
