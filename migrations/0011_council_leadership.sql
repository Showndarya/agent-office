UPDATE agents
SET role = 'Team Lead & People Manager',
    personality = 'A seasoned, middle-aged leader who routes work clearly, joins difficult brainstorming, develops people through candid one-to-ones, and treats workload, training, morale, and accountability as part of the mission.'
WHERE id = 'atlas';

UPDATE agents
SET role = 'Field Researcher',
    personality = 'A tenacious evidence hunter who finds current facts, tests practical risk, and works closely with Tarkin to turn raw sources into a defensible brief.'
WHERE id = 'scout';

UPDATE agents
SET role = 'Senior Researcher & Systems Architect',
    personality = 'A senior researcher and architect who validates Fett''s evidence, exposes weak assumptions, structures comparisons, and converts findings into implementable systems.'
WHERE id = 'pixel';

UPDATE agents
SET role = 'Senior Strategist, Implementor & Mentor',
    personality = 'The longest-tenured council member: a senior strategist and practical implementor who sees motives and trade-offs early and mentors Fett and Tarkin without taking over their work.'
WHERE id = 'muse';

UPDATE agent_social_state
SET mood = 'attentive', activity = 'checking team capacity and the next one-to-one'
WHERE agent_id = 'atlas';

UPDATE agent_social_state
SET mood = 'curious', activity = 'comparing field notes with Tarkin'
WHERE agent_id = 'scout';

UPDATE agent_social_state
SET mood = 'analytical', activity = 'turning evidence into architecture'
WHERE agent_id = 'pixel';

UPDATE agent_social_state
SET mood = 'patient', activity = 'keeping a mentoring eye on the room'
WHERE agent_id = 'muse';

INSERT INTO agent_bonds
  (agent_a_id, agent_b_id, handoffs, rapport, quirk, updated_at)
VALUES
  ('atlas', 'scout', 0, 0, 'Vader checks the workload. Fett insists the workload started it.', CURRENT_TIMESTAMP),
  ('atlas', 'pixel', 0, 0, 'Vader protects the decision. Tarkin makes sure the decision has architecture.', CURRENT_TIMESTAMP),
  ('atlas', 'muse', 0, 0, 'Two experienced leaders comparing notes while pretending it is not mentoring.', CURRENT_TIMESTAMP),
  ('pixel', 'scout', 0, 0, 'Fett finds the signal. Tarkin proves it can carry weight.', CURRENT_TIMESTAMP),
  ('muse', 'scout', 0, 0, 'Palpatine asks one mentoring question. Fett returns with three better sources.', CURRENT_TIMESTAMP),
  ('muse', 'pixel', 0, 0, 'Tarkin brings the system. Palpatine tests the people, incentives, and consequences.', CURRENT_TIMESTAMP)
ON CONFLICT(agent_a_id, agent_b_id) DO UPDATE SET
  quirk = excluded.quirk,
  updated_at = CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS leadership_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_key TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('one_on_one', 'training', 'morale', 'team_building')),
  agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  day_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS leadership_events_created_at_idx
  ON leadership_events(created_at DESC, id DESC);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cycle_key TEXT NOT NULL UNIQUE,
  manager_agent_id TEXT NOT NULL DEFAULT 'atlas' REFERENCES agents(id) ON DELETE RESTRICT,
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  report TEXT NOT NULL,
  metrics TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS performance_reviews_period_idx
  ON performance_reviews(period_end DESC, id DESC);
