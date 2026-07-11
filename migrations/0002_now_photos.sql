PRAGMA foreign_keys = OFF;

ALTER TABLE telegram_message_fragments RENAME TO telegram_message_fragments_v1;
ALTER TABLE now_entries RENAME TO now_entries_v1;

CREATE TABLE now_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_channel_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  group_key TEXT NOT NULL,
  media_group_id TEXT,
  raw_text TEXT NOT NULL,
  display_text TEXT NOT NULL,
  entities_json TEXT NOT NULL DEFAULT '[]',
  published_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('pending', 'published')),
  telegram_link TEXT NOT NULL,
  UNIQUE (telegram_channel_id, group_key)
);

CREATE TABLE telegram_message_fragments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES now_entries(id) ON DELETE CASCADE,
  telegram_channel_id TEXT NOT NULL,
  telegram_message_id INTEGER NOT NULL,
  raw_text TEXT NOT NULL,
  entities_json TEXT NOT NULL DEFAULT '[]',
  file_id TEXT,
  image_id TEXT UNIQUE,
  width INTEGER,
  height INTEGER,
  received_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE (telegram_channel_id, telegram_message_id)
);

INSERT INTO now_entries (
  id, telegram_channel_id, telegram_message_id, group_key, raw_text, display_text,
  entities_json, published_at, updated_at, status, telegram_link
)
SELECT id, telegram_channel_id, telegram_message_id, 'message:' || telegram_message_id,
  raw_text, display_text, entities_json, published_at, updated_at, status, telegram_link
FROM now_entries_v1;

INSERT INTO telegram_message_fragments (
  id, entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json
)
SELECT id, entry_id, telegram_channel_id, telegram_message_id, raw_text, entities_json
FROM telegram_message_fragments_v1;

DROP TABLE telegram_message_fragments_v1;
DROP TABLE now_entries_v1;

CREATE INDEX now_entries_published_page_idx
  ON now_entries (published_at DESC, id DESC)
  WHERE status = 'published';

PRAGMA foreign_keys = ON;
