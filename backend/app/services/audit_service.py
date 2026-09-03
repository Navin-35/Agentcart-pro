import sqlite3
import json
import uuid
import os
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from app.core.config import settings
from app.core.security import generate_chain_hash
from app.domain.audit import AuditLogEntry, AuditLedgerSummary

class AuditLedgerService:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or settings.AUDIT_DB_PATH
        self._init_db()
        self._memory_cache: List[AuditLogEntry] = []
        self._latest_hash: str = "0" * 64

    def _init_db(self):
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                timestamp TEXT,
                event_type TEXT,
                status TEXT,
                summary TEXT,
                details TEXT,
                previous_hash TEXT,
                cryptographic_hash TEXT
            )
        """)
        conn.commit()
        conn.close()

    def record(
        self,
        session_id: str,
        event_type: str,
        status: str,
        summary: str,
        details: Dict[str, Any]
    ) -> AuditLogEntry:
        log_id = str(uuid.uuid4())
        ts = datetime.now(timezone.utc).isoformat()
        
        # Calculate Merkle-chained SHA-256 hash
        crypto_hash = generate_chain_hash(
            previous_hash=self._latest_hash,
            entry_id=log_id,
            timestamp=ts,
            event_type=event_type,
            status=status,
            summary=summary,
            details=details
        )
        
        entry = AuditLogEntry(
            id=log_id,
            session_id=session_id,
            timestamp=ts,
            event_type=event_type,
            status=status,
            summary=summary,
            details=details,
            previous_hash=self._latest_hash,
            cryptographic_hash=crypto_hash
        )
        
        self._latest_hash = crypto_hash
        self._memory_cache.append(entry)
        
        # SQLite persistence
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO audit_logs (
                    id, session_id, timestamp, event_type, status, summary, details, previous_hash, cryptographic_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                entry.id, entry.session_id, entry.timestamp, entry.event_type,
                entry.status, entry.summary, json.dumps(entry.details),
                entry.previous_hash, entry.cryptographic_hash
            ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[AuditLedger] SQLite write warning: {e}")
            
        return entry

    def get_logs_by_session(self, session_id: str) -> List[AuditLogEntry]:
        return [entry for entry in self._memory_cache if entry.session_id == session_id]

    def get_all_logs(self, limit: int = 50) -> List[AuditLogEntry]:
        return self._memory_cache[-limit:][::-1]

    def verify_chain_integrity(self) -> bool:
        """Cryptographically verify the entire chain of audit log hashes."""
        current_prev = "0" * 64
        for entry in self._memory_cache:
            if entry.previous_hash != current_prev:
                return False
            expected_hash = generate_chain_hash(
                previous_hash=entry.previous_hash,
                entry_id=entry.id,
                timestamp=entry.timestamp,
                event_type=entry.event_type,
                status=entry.status,
                summary=entry.summary,
                details=entry.details
            )
            if entry.cryptographic_hash != expected_hash:
                return False
            current_prev = entry.cryptographic_hash
        return True

    def clear(self) -> None:
        self._memory_cache.clear()
        self._latest_hash = "0" * 64
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM audit_logs")
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"[AuditLedger] SQLite clear warning: {e}")

audit_service = AuditLedgerService()
