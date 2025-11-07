"""
Database models and operations for KeySet LocalAgent
"""
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    create_engine,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "keyset.db"

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Account(Base):
    """Yandex account model"""

    __tablename__ = "accounts"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Basic info
    name = Column(String(255), unique=True, nullable=False, index=True)  # Email
    profile_path = Column(String(500))  # Chrome profile path

    # Proxy settings
    proxy = Column(String(500))  # URI format: http://user:pass@host:port
    proxy_id = Column(Integer, ForeignKey("proxies.id"), nullable=True)
    proxy_strategy = Column(String(50), default="fixed")  # fixed/rotate

    # Authorization
    cookies = Column(Text)  # JSON with Yandex cookies
    captcha_key = Column(String(255))  # Anticaptcha service key

    # Status
    status = Column(
        String(50), default="ok"
    )  # ok/cooldown/captcha/banned/disabled/error
    captcha_tries = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
    cooldown_until = Column(DateTime, nullable=True)

    # Notes
    notes = Column(Text)

    # Relationships
    tasks = relationship("Task", back_populates="account")
    proxy_obj = relationship("Proxy", foreign_keys=[proxy_id])


class Task(Base):
    """Parsing task model"""

    __tablename__ = "tasks"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)

    # Parameters
    seed_file = Column(String(500), nullable=False)  # File with phrases
    region = Column(Integer, default=225)  # Region ID (lr parameter)
    headless = Column(Boolean, default=False)  # Headless browser mode
    dump_json = Column(Boolean, default=False)  # Save JSON log
    kind = Column(String(50), default="frequency")  # frequency/forecast/etc
    params = Column(Text)  # JSON with additional parameters

    # Status
    status = Column(
        String(50), default="queued"
    )  # queued/running/completed/failed

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    # Results
    log_path = Column(String(500))  # Path to task log
    output_path = Column(String(500))  # Path to results file
    error_message = Column(Text)  # Error text if status=failed

    # Relationships
    account = relationship("Account", back_populates="tasks")


class FrequencyResult(Base):
    """Frequency parsing result model"""

    __tablename__ = "freq_results"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Phrase and region
    mask = Column(String(500), nullable=False, index=True)  # Keyword phrase
    region = Column(Integer, default=225, index=True)  # Region ID

    # Frequencies
    freq_total = Column(Integer, default=0)  # Broad match (WS)
    freq_quotes = Column(Integer, default=0)  # Phrase match ("WS")
    freq_exact = Column(Integer, default=0)  # Exact match (!WS)

    # Metadata
    group = Column(String(255))  # Group for organization
    status = Column(String(50), default="queued")  # queued/ok/error
    attempts = Column(Integer, default=0)  # Number of parsing attempts
    error = Column(Text)  # Error text

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Constraints
    __table_args__ = (UniqueConstraint("mask", "region", name="uq_mask_region"),)


class Proxy(Base):
    """Proxy server model"""

    __tablename__ = "proxies"

    # Primary key
    id = Column(Integer, primary_key=True, index=True)

    # Proxy info
    host = Column(String(255), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(String(255))
    password = Column(String(255))
    proxy_type = Column(String(50), default="http")  # http/https/socks5

    # Status
    status = Column(String(50), default="active")  # active/dead/checking
    country = Column(String(50))  # Country code
    speed_ms = Column(Integer)  # Response time in ms

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_checked_at = Column(DateTime, nullable=True)

    # Notes
    notes = Column(Text)


def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print(f"✓ Database initialized at {DB_PATH}")


def get_db() -> Session:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# CRUD operations
def create_account(db: Session, **kwargs) -> Account:
    """Create new account"""
    account = Account(**kwargs)
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


def get_accounts(db: Session, skip: int = 0, limit: int = 100) -> list[Account]:
    """Get all accounts"""
    return db.query(Account).offset(skip).limit(limit).all()


def get_account(db: Session, account_id: int) -> Optional[Account]:
    """Get account by ID"""
    return db.query(Account).filter(Account.id == account_id).first()


def update_account(db: Session, account_id: int, **kwargs) -> Optional[Account]:
    """Update account"""
    account = get_account(db, account_id)
    if account:
        for key, value in kwargs.items():
            setattr(account, key, value)
        account.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(account)
    return account


def delete_account(db: Session, account_id: int) -> bool:
    """Delete account"""
    account = get_account(db, account_id)
    if account:
        db.delete(account)
        db.commit()
        return True
    return False


def create_task(db: Session, **kwargs) -> Task:
    """Create new task"""
    task = Task(**kwargs)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


def get_tasks(db: Session, skip: int = 0, limit: int = 100) -> list[Task]:
    """Get all tasks"""
    return db.query(Task).offset(skip).limit(limit).all()


def get_task(db: Session, task_id: int) -> Optional[Task]:
    """Get task by ID"""
    return db.query(Task).filter(Task.id == task_id).first()


def update_task(db: Session, task_id: int, **kwargs) -> Optional[Task]:
    """Update task"""
    task = get_task(db, task_id)
    if task:
        for key, value in kwargs.items():
            setattr(task, key, value)
        db.commit()
        db.refresh(task)
    return task


def create_proxy(db: Session, **kwargs) -> Proxy:
    """Create new proxy"""
    proxy = Proxy(**kwargs)
    db.add(proxy)
    db.commit()
    db.refresh(proxy)
    return proxy


def get_proxies(db: Session, skip: int = 0, limit: int = 100) -> list[Proxy]:
    """Get all proxies"""
    return db.query(Proxy).offset(skip).limit(limit).all()


def get_proxy(db: Session, proxy_id: int) -> Optional[Proxy]:
    """Get proxy by ID"""
    return db.query(Proxy).filter(Proxy.id == proxy_id).first()


if __name__ == "__main__":
    # Initialize database when run directly
    init_db()
    print("Database schema created successfully!")
