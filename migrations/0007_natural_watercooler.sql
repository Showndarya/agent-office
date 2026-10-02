ALTER TABLE office_chatter RENAME TO office_chatter_v1;

CREATE TABLE office_chatter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speaker_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  recipient_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT 'dry',
  slot_key TEXT NOT NULL,
  turn_index INTEGER NOT NULL CHECK (turn_index BETWEEN 0 AND 3),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slot_key, turn_index)
);

INSERT INTO office_chatter
  (id, speaker_agent_id, recipient_agent_id, message, mood, slot_key, turn_index, created_at)
SELECT id, speaker_agent_id, recipient_agent_id, message, mood, slot_key, turn_index, created_at
FROM office_chatter_v1;

DROP TABLE office_chatter_v1;

CREATE INDEX office_chatter_created_at_idx
  ON office_chatter(created_at DESC, id DESC);
