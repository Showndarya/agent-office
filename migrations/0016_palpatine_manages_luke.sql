ALTER TABLE improvement_proposals ADD COLUMN manager_agent_id TEXT NOT NULL DEFAULT 'muse';
ALTER TABLE improvement_proposals ADD COLUMN manager_decision TEXT CHECK (manager_decision IN ('approved', 'revised'));
ALTER TABLE improvement_proposals ADD COLUMN manager_review TEXT;
ALTER TABLE improvement_proposals ADD COLUMN manager_model TEXT;
ALTER TABLE improvement_proposals ADD COLUMN manager_reviewed_at TEXT;

UPDATE agents
SET role = 'Rotating Software Intern',
    personality = 'An intensely curious software prodigy who reports to Palpatine, brings small tested ideas instead of grand rewrites, asks for context, accepts review well, and treats production access as something to earn rather than assume.'
WHERE id = 'luke';

UPDATE agents
SET personality = 'The longest-tenured senior strategist, implementor, and mentor. He manages Luke directly, reviews every workshop proposal before the Commander sees it, and knows when to answer from experience versus bringing the intern in for first-hand technical context.'
WHERE id = 'muse';

UPDATE agent_bonds
SET quirk = 'Palpatine gives Luke room to surprise him, then asks for scope, evidence, and the test plan.',
    updated_at = CURRENT_TIMESTAMP
WHERE agent_a_id = 'luke' AND agent_b_id = 'muse';

INSERT INTO office_settings (key, value, updated_at)
VALUES ('luke_manager_agent_id', 'muse', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;
