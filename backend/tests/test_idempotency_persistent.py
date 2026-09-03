"""
Tests for persistent idempotency store.

Key property: The idempotency guard must survive server restarts.
The old implementation used an in-memory set() which reset on every restart,
allowing replay attacks to succeed after server restart.

The new SQLite-backed implementation persists across process restarts.
"""
import sqlite3
import pytest
from app.services.idempotency_service import IdempotencyService


def test_new_key_is_accepted():
    """A fresh idempotency key must be accepted and reserved."""
    svc = IdempotencyService(db_path=":memory:")
    result = svc.check_and_reserve("key_001", "sess_001", 1000.0)
    assert result is True


def test_duplicate_key_is_rejected():
    """A duplicate idempotency key must be rejected."""
    svc = IdempotencyService(db_path=":memory:")
    svc.check_and_reserve("key_dup", "sess_001", 1000.0)
    result = svc.check_and_reserve("key_dup", "sess_001", 1000.0)
    assert result is False  # Second attempt blocked


def test_replay_across_restarts():
    """
    Simulate server restart by creating a new service instance pointing to
    the same SQLite file. The key from the previous instance must still be blocked.
    """
    import tempfile, os
    db_file = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    db_path = db_file.name
    db_file.close()

    try:
        # First "server instance"
        svc1 = IdempotencyService(db_path=db_path)
        accepted = svc1.check_and_reserve("key_restart_test", "sess_restart", 2000.0)
        assert accepted is True

        # Second "server instance" (simulates restart)
        svc2 = IdempotencyService(db_path=db_path)
        replay_attempt = svc2.check_and_reserve("key_restart_test", "sess_restart", 2000.0)
        assert replay_attempt is False  # Must be blocked even after restart
    finally:
        os.unlink(db_path)


def test_mark_processed_updates_status():
    """After mark_processed(), the key status changes to PROCESSED."""
    svc = IdempotencyService(db_path=":memory:")
    svc.check_and_reserve("key_proc", "sess_001", 500.0)
    assert svc.is_processed("key_proc") is False
    svc.mark_processed("key_proc")
    assert svc.is_processed("key_proc") is True


def test_different_keys_dont_conflict():
    """Different idempotency keys must not interfere with each other."""
    svc = IdempotencyService(db_path=":memory:")
    r1 = svc.check_and_reserve("key_a", "sess_001", 100.0)
    r2 = svc.check_and_reserve("key_b", "sess_002", 200.0)
    assert r1 is True
    assert r2 is True
