CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  time_begin INTEGER,
  time_end INTEGER,
  note TEXT,
  ip TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  path_json TEXT NOT NULL,
  hidden INTEGER CHECK (hidden IN (0, 1) OR hidden IS NULL),
  site INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS note_buckets (
  site INTEGER NOT NULL,
  bucket INTEGER NOT NULL,
  note_id INTEGER NOT NULL,
  PRIMARY KEY (site, bucket, note_id)
);

CREATE INDEX IF NOT EXISTS idx_note_buckets_lookup
  ON note_buckets(site, bucket);

CREATE INDEX IF NOT EXISTS idx_notes_site_time
  ON notes(site, time_begin, time_end);

CREATE INDEX IF NOT EXISTS idx_notes_ip_timestamp
  ON notes(ip, timestamp);

CREATE TABLE IF NOT EXISTS blacklist (
  ip TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS stats5min (
  chunk INTEGER PRIMARY KEY,
  time_begin INTEGER,
  time_end INTEGER,
  count INTEGER
);

CREATE TABLE IF NOT EXISTS stats60min (
  chunk INTEGER PRIMARY KEY,
  time_begin INTEGER,
  time_end INTEGER,
  count INTEGER
);

CREATE VIEW IF NOT EXISTS ips AS
  SELECT DISTINCT ip FROM notes;
