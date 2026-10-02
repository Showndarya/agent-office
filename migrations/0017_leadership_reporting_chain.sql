ALTER TABLE leadership_events ADD COLUMN leader_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL;

UPDATE leadership_events
SET leader_agent_id = 'atlas'
WHERE leader_agent_id IS NULL;

INSERT INTO office_settings (key, value, updated_at)
VALUES ('leadership_reporting_chain', 'Vader manages Fett, Tarkin, and Palpatine; Palpatine manages Luke and reports Luke updates to Vader.', CURRENT_TIMESTAMP)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;
