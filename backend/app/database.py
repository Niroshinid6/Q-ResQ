from sqlalchemy import create_engine, Column, String, Integer, Float, JSON, DateTime, event
from sqlalchemy.orm import DeclarativeBase, Session
from sqlalchemy.sql import func
import os

# Engine is created lazily so that test conftest can set DATABASE_URL
# before any engine is initialised.
_engine = None


def _get_engine():
    global _engine
    if _engine is None:
        DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./q_resq.db")
        # SQLite in-memory shared-cache URIs require uri=True
        connect_args: dict = {"check_same_thread": False}
        if "file::memory:" in DATABASE_URL or "uri=true" in DATABASE_URL.lower():
            connect_args["uri"] = True
        _engine = create_engine(DATABASE_URL, connect_args=connect_args)
    return _engine


class Base(DeclarativeBase):
    pass


class OptimizationRunDB(Base):
    __tablename__ = "optimization_runs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    run_at = Column(DateTime, server_default=func.now())
    status = Column(String)
    objective_value = Column(Float)
    assignments_json = Column(JSON)
    unserved_json = Column(JSON)
    explanation = Column(String)


def init_db() -> None:
    """Create all tables.  Safe to call multiple times."""
    Base.metadata.create_all(bind=_get_engine())


def get_session():
    """FastAPI dependency: yields a SQLAlchemy session."""
    with Session(_get_engine()) as session:
        yield session
