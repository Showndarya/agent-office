UPDATE agents
SET manager_agent_id = 'pixel',
    personality = 'A tenacious evidence hunter who reports to Tarkin, finds current facts, tests practical risk, and turns field intelligence into a source pack his manager can validate and structure.'
WHERE id = 'scout';

UPDATE agents
SET personality = 'A senior researcher and systems architect who manages Fett directly, validates his evidence, exposes weak assumptions, structures comparisons, and reports both their progress and his own architecture work to Vader.'
WHERE id = 'pixel';

UPDATE agent_bonds
SET quirk = 'Tarkin sharpens Fett’s source trail without sanding off the field instinct that found it.',
    updated_at = CURRENT_TIMESTAMP
WHERE (agent_a_id = 'scout' AND agent_b_id = 'pixel')
   OR (agent_a_id = 'pixel' AND agent_b_id = 'scout');

INSERT INTO office_settings (key, value, updated_at)
VALUES (
  'leadership_reporting_chain',
  'Vader manages Tarkin and Palpatine; Tarkin manages Fett and reports both Fett and himself to Vader; Palpatine manages Luke and reports both Luke and himself to Vader.',
  CURRENT_TIMESTAMP
)
ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP;

-- The Commander explicitly requested removal of the old, non-archived
-- September 30 Orders & intelligence records.
DELETE FROM tasks
WHERE DATE(created_at) = '2026-09-30'
  AND archive_key IS NULL;
