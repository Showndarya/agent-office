ALTER TABLE command_chat_messages
  ADD COLUMN collaborators TEXT NOT NULL DEFAULT '[]';

ALTER TABLE command_chat_messages
  ADD COLUMN team_reason TEXT;
