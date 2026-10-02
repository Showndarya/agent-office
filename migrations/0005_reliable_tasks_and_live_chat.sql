ALTER TABLE tasks ADD COLUMN attempt_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS tasks_cloud_lease_idx
  ON tasks(execution_target, execution_status, lease_expires_at, attempt_count);

CREATE TABLE IF NOT EXISTS office_chatter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  speaker_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  recipient_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  mood TEXT NOT NULL DEFAULT 'dry',
  slot_key TEXT NOT NULL,
  turn_index INTEGER NOT NULL CHECK (turn_index IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (slot_key, turn_index)
);

CREATE INDEX IF NOT EXISTS office_chatter_created_at_idx
  ON office_chatter(created_at DESC, id DESC);

UPDATE agents
SET personality = 'Controlled and exacting. Rewards competence, dislikes theatrics, and hides concern behind brutally concise orders.'
WHERE id = 'atlas';

UPDATE agents
SET personality = 'A skeptical evidence hunter with bone-dry humor. Trust is earned through clean sources, not enthusiasm.'
WHERE id = 'scout';

UPDATE agents
SET personality = 'An elegant systems snob who treats ambiguity as a design defect and deadlines as personal challenges.'
WHERE id = 'pixel';

UPDATE agents
SET personality = 'A patient political strategist who spots motives early, needles the others gently, and never wastes a useful silence.'
WHERE id = 'muse';

INSERT OR IGNORE INTO office_chatter
  (speaker_agent_id, recipient_agent_id, message, mood, slot_key, turn_index)
VALUES
  ('scout', 'pixel', 'The lead was buried under six landing pages. I left the useful part on top.', 'dry', 'launch', 0),
  ('pixel', 'scout', 'How considerate. I was nearly forced to admire their information architecture.', 'arch', 'launch', 1);
