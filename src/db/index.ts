import Database from "better-sqlite3";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "bookings.sqlite");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_name TEXT NOT NULL,
    price INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    client_name TEXT NOT NULL,
    telegram_username TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    status TEXT NOT NULL DEFAULT 'confirmed'
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_date_time_confirmed
  ON bookings(date, time)
  WHERE status = 'confirmed';
`);
