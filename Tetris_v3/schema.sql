-- D1 資料庫初始化 Schema
-- 執行: wrangler d1 execute tetris-db --file=schema.sql

CREATE TABLE IF NOT EXISTS players (
    id     INTEGER PRIMARY KEY AUTOINCREMENT,
    act    TEXT    NOT NULL UNIQUE,
    psw    TEXT    NOT NULL,
    email  TEXT    NOT NULL UNIQUE,
    scores INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_players_act   ON players(act);
CREATE INDEX IF NOT EXISTS idx_players_email ON players(email);
CREATE INDEX IF NOT EXISTS idx_players_scores ON players(scores DESC);
