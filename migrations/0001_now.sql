PRAGMA foreign_keys = ON;

CREATE TABLE now_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_channel_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  display_text TEXT NOT NULL,
  entities_json TEXT NOT NULL DEFAULT '[]',
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published')),
  telegram_link TEXT NOT NULL,
  UNIQUE (telegram_channel_id, telegram_message_id)
);

CREATE TABLE telegram_message_fragments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES now_entries(id) ON DELETE CASCADE,
  telegram_channel_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  entities_json TEXT NOT NULL DEFAULT '[]',
  UNIQUE (telegram_channel_id, telegram_message_id)
);

CREATE INDEX now_entries_published_page_idx
  ON now_entries (published_at DESC, id DESC)
  WHERE status = 'published';
