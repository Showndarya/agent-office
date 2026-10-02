ALTER TABLE command_chat_messages
  ADD COLUMN audience_agent_id TEXT NOT NULL DEFAULT 'atlas';

CREATE INDEX IF NOT EXISTS command_chat_audience_idx
  ON command_chat_messages(day_key, audience_agent_id, archived_at, id);
