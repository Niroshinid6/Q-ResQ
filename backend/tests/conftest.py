"""
Pytest configuration for Q-ResQ backend tests.

Uses a temporary file-based SQLite database so that all connections
within a test session share the same schema (avoids the :memory:
per-connection isolation problem).

The temp DB file is deleted after the session.
"""
import os
import tempfile
import pytest

# Create a temp SQLite file that persists across the session
_tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
_tmp.close()

# Set env var BEFORE any app module is imported by the test collector
os.environ["DATABASE_URL"] = f"sqlite:///{_tmp.name}"


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    """Remove the temp test DB after the session."""
    yield
    try:
        os.unlink(_tmp.name)
    except OSError:
        pass
