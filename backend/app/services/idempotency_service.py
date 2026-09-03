"""
Persistent SQLite-backed idempotency store.

Survives server restarts — unlike the previous in-memory set().
Uses a UNIQUE constraint on idempotency_key to prevent race conditions
even under concurrent requests (SQLite serializes writes).

Schema:
    idempotency_key  TEXT PRIMARY KEY
    session_id       TEXT
    status           TEXT  (RESERVED | PROCESSED | EXPIRED)
    amount           REAL
    created_at       INTEGER (unix timestamp)
    processed_at     INTEGER (unix timestamp, nullable)
"""
import sqlite3
import time
import os
from typing import Optional
from app.core.config import settings


class IdempotencyService:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.IDEMPOTENCY_DB_PATH
        self._mem_conn: Optional[sqlite3.Connection] = None  # Shared conn for :memory:
        self._init_db()

    def _connect(self) -> sqlite3.Connection:
        """Return a connection. For :memory: databases, always return the same shared connection."""
        if self.db_path == ":memory:":
            if self._mem_conn is None:
                self._mem_conn = sqlite3.connect(":memory:", check_same_thread=False)
                self._mem_conn.row_factory = sqlite3.Row
            return self._mem_conn
        conn = sqlite3.connect(self.db_path, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        return conn

    def _close(self, conn: sqlite3.Connection) -> None:
        """Only close non-shared (file-backed) connections."""
        if self.db_path != ":memory:":
            conn.close()

    def _init_db(self):
        if self.db_path != ":memory:":
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = self._connect()
        conn.execute("""
            CREATE TABLE IF NOT EXISTS idempotency_keys (
                idempotency_key  TEXT PRIMARY KEY,
                session_id       TEXT NOT NULL,
                status           TEXT NOT NULL DEFAULT 'RESERVED',
                amount           REAL,
                created_at       INTEGER NOT NULL,
                processed_at     INTEGER
            )
        """)
        conn.commit()
        if self.db_path != ":memory:":
            conn.close()

    def check_and_reserve(self, key: str, session_id: str, amount: float = 0.0) -> bool:
        """
        Atomically check whether a key has already been used and reserve it.

        Returns:
            True  → key is new; it has been reserved for this session.
            False → key already exists (duplicate / replay); reject the request.
        """
        conn = self._connect()
        try:
            conn.execute(
                """
                INSERT INTO idempotency_keys (idempotency_key, session_id, amount, created_at)
                VALUES (?, ?, ?, ?)
                """,
                (key, session_id, amount, int(time.time()))
            )
            conn.commit()
            return True  # New key — proceed
        except sqlite3.IntegrityError:
            return False  # Already exists — duplicate
        finally:
            self._close(conn)

    def mark_processed(self, key: str) -> None:
        """Mark a previously reserved key as fully processed (payment completed)."""
        conn = self._connect()
        conn.execute(
            "UPDATE idempotency_keys SET status = 'PROCESSED', processed_at = ? WHERE idempotency_key = ?",
            (int(time.time()), key)
        )
        conn.commit()
        self._close(conn)

    def is_processed(self, key: str) -> bool:
        """Check if a key was already fully processed (payment captured)."""
        conn = self._connect()
        row = conn.execute(
            "SELECT status FROM idempotency_keys WHERE idempotency_key = ?", (key,)
        ).fetchone()
        self._close(conn)
        return row is not None and row["status"] == "PROCESSED"

    def exists(self, key: str) -> bool:
        """Check if a key exists in any state."""
        conn = self._connect()
        row = conn.execute(
            "SELECT 1 FROM idempotency_keys WHERE idempotency_key = ?", (key,)
        ).fetchone()
        self._close(conn)
        return row is not None


idempotency_service = IdempotencyService()
