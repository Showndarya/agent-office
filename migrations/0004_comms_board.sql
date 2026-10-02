CREATE TABLE IF NOT EXISTS office_feed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL CHECK (kind IN ('handoff', 'note', 'sprint')),
  speaker_agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  recipient_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  day_key TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS office_feed_created_at_idx
  ON office_feed(created_at DESC, id DESC);

CREATE UNIQUE INDEX IF NOT EXISTS office_feed_sprint_day_idx
  ON office_feed(day_key)
  WHERE kind = 'sprint' AND day_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS agent_bonds (
  agent_a_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  agent_b_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  handoffs INTEGER NOT NULL DEFAULT 0,
  rapport INTEGER NOT NULL DEFAULT 0,
  quirk TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (agent_a_id, agent_b_id)
);

INSERT OR IGNORE INTO agent_bonds
  (agent_a_id, agent_b_id, handoffs, rapport, quirk)
VALUES
  ('atlas', 'scout', 1, 2, 'Mutual respect, aggressively unspoken.'),
  ('pixel', 'scout', 0, 1, 'Fett finds the facts. Tarkin rearranges the furniture.'),
  ('atlas', 'muse', 0, 1, 'Strategic alignment. Excessive capes.');

INSERT INTO office_feed
  (kind, speaker_agent_id, recipient_agent_id, task_id, message)
VALUES
  ('handoff', 'atlas', 'scout', NULL, 'Fett, your latest intelligence is on the board. The citations are acceptable.'),
  ('note', 'scout', 'pixel', NULL, 'Tarkin, I found the route. You can pretend the map was obvious.'),
  ('note', 'pixel', 'scout', NULL, 'Naturally. I was testing whether you would notice.');
