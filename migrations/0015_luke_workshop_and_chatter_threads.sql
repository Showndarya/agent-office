INSERT OR IGNORE INTO agents (id, name, role, personality, emoji, color, status)
VALUES (
  'luke',
  'Luke Skywalker',
  'Rotating Software Intern',
  'An intensely curious software prodigy who listens before building, prototypes the smallest useful improvement, documents the trade-offs, and treats production access as something to earn rather than assume.',
  '⌘',
  '#63B3ED',
  'ready'
);

INSERT OR IGNORE INTO agent_social_state (agent_id, mood, activity, last_topic)
VALUES ('luke', 'curious', 'asking the council what feels repetitive', 'Workshop orientation');

INSERT INTO agent_bonds
  (agent_a_id, agent_b_id, handoffs, rapport, quirk, updated_at)
VALUES
  ('atlas', 'luke', 0, 0, 'Vader asks for the rollback plan. Luke already has two.', CURRENT_TIMESTAMP),
  ('luke', 'scout', 0, 0, 'Fett finds the friction. Luke quietly automates the boring part.', CURRENT_TIMESTAMP),
  ('luke', 'pixel', 0, 0, 'Tarkin reviews the architecture. Luke arrives with tests and an inconveniently good question.', CURRENT_TIMESTAMP),
  ('luke', 'muse', 0, 0, 'Palpatine teaches patience. Luke applies it to release engineering.', CURRENT_TIMESTAMP)
ON CONFLICT(agent_a_id, agent_b_id) DO UPDATE SET
  quirk = excluded.quirk,
  updated_at = CURRENT_TIMESTAMP;

ALTER TABLE office_chatter ADD COLUMN conversation_key TEXT;
ALTER TABLE office_chatter ADD COLUMN burst_index INTEGER NOT NULL DEFAULT 0;
ALTER TABLE office_chatter ADD COLUMN continuity INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS office_chatter_conversation_idx
  ON office_chatter(conversation_key, burst_index, created_at, id);

CREATE TABLE IF NOT EXISTS improvement_proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rotation_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  proposal TEXT NOT NULL,
  benefit TEXT NOT NULL,
  requested_by TEXT NOT NULL DEFAULT '[]',
  affected_agents TEXT NOT NULL DEFAULT '[]',
  acceptance_tests TEXT NOT NULL DEFAULT '[]',
  permissions TEXT NOT NULL DEFAULT '[]',
  risk_level TEXT NOT NULL DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  estimated_cost TEXT NOT NULL,
  plan_model TEXT NOT NULL,
  action_model TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN (
    'proposed', 'build_approved', 'building', 'awaiting_deploy',
    'deploy_approved', 'deploying', 'shipped', 'rejected', 'failed', 'blocked'
  )),
  runner_id TEXT,
  lease_expires_at TEXT,
  branch_name TEXT,
  base_commit TEXT,
  build_summary TEXT,
  build_error TEXT,
  deploy_summary TEXT,
  deploy_error TEXT,
  build_approved_at TEXT,
  deploy_approved_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS improvement_proposals_status_idx
  ON improvement_proposals(status, created_at, id);

CREATE TABLE IF NOT EXISTS improvement_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL REFERENCES improvement_proposals(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  detail TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS improvement_events_proposal_idx
  ON improvement_events(proposal_id, created_at, id);

CREATE TABLE IF NOT EXISTS capability_registry (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('skill', 'tool', 'plugin')),
  description TEXT NOT NULL,
  owner_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  permissions TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('experimental', 'active', 'retired')),
  source_proposal_id INTEGER REFERENCES improvement_proposals(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO capability_registry
  (slug, name, kind, description, owner_agent_id, permissions, status)
VALUES
  ('bounded-live-research', 'Bounded live research', 'skill', 'One focused web pass with source links, a deadline, and a guaranteed return.', 'scout', '["web-read"]', 'active'),
  ('evidence-to-architecture', 'Evidence to architecture', 'skill', 'Turns Fett’s source trail into checked assumptions, comparisons, and an implementable structure.', 'pixel', '["read-task-context"]', 'active'),
  ('strategy-pressure-test', 'Strategy pressure test', 'skill', 'Reviews incentives, trade-offs, rollout, and maintainability without taking ownership away from the working agent.', 'muse', '["read-task-context"]', 'active'),
  ('visible-council-routing', 'Visible council routing', 'tool', 'Records Vader’s assignments, specialist contributions, handoffs, and returns.', 'atlas', '["write-handoff-board"]', 'active');

INSERT INTO office_settings (key, value, updated_at)
VALUES ('luke_rotation_schedule', 'Tuesday and Friday at 10:30 AM ET', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;
