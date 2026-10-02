ALTER TABLE tasks
  ADD COLUMN archive_retained INTEGER NOT NULL DEFAULT 0 CHECK (archive_retained IN (0, 1));

ALTER TABLE agents
  ADD COLUMN manager_agent_id TEXT REFERENCES agents(id) ON DELETE SET NULL;

ALTER TABLE agents
  ADD COLUMN joined_on TEXT;

ALTER TABLE agents
  ADD COLUMN education TEXT NOT NULL DEFAULT '';

UPDATE agents
SET manager_agent_id = CASE id
      WHEN 'scout' THEN 'atlas'
      WHEN 'pixel' THEN 'atlas'
      WHEN 'muse' THEN 'atlas'
      WHEN 'luke' THEN 'muse'
      ELSE NULL
    END,
    joined_on = CASE id
      WHEN 'muse' THEN '2017-03-13'
      WHEN 'atlas' THEN '2019-01-21'
      WHEN 'pixel' THEN '2019-08-19'
      WHEN 'scout' THEN '2021-02-08'
      WHEN 'luke' THEN '2026-09-29'
      ELSE joined_on
    END,
    education = CASE id
      WHEN 'atlas' THEN 'Imperial Command Academy — systems leadership, crisis operations, and advanced team command.'
      WHEN 'scout' THEN 'Concord Dawn Fieldcraft Institute — applied intelligence, source verification, and investigative operations.'
      WHEN 'pixel' THEN 'Eriadu Naval Academy and Imperial Staff College — operations research, systems architecture, and strategic logistics.'
      WHEN 'muse' THEN 'Theed School of Statecraft — organizational strategy, institutional memory, negotiation, and implementation doctrine.'
      WHEN 'luke' THEN 'Tosche Station Polytechnic — self-directed software engineering, automation, distributed systems, and an inconvenient amount of natural talent.'
      ELSE education
    END;

-- Before this release, every New chat action was stored as a permanent archive.
-- Remove those legacy copies while leaving their raw daily messages available
-- for the normal nightly memory distillation.
DELETE FROM tasks
WHERE archive_key LIKE 'command-chat:%';

CREATE INDEX IF NOT EXISTS tasks_chat_archive_retention_idx
  ON tasks(archive_retained, archive_key)
  WHERE archive_key IS NOT NULL;
