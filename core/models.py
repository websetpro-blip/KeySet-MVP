from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base

ACCOUNT_STATUSES = (
    'ok',
    'cooldown',
    'captcha',
    'banned',
    'disabled',
    'error',
)


class Account(Base):
    __tablename__ = 'accounts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    profile_path: Mapped[str] = mapped_column(String(255), nullable=False)
    proxy: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    captcha_key: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(Enum(*ACCOUNT_STATUSES, name='account_status'), default='ok')
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    cooldown_until: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    captcha_tries: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    proxy_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    proxy_strategy: Mapped[str] = mapped_column(String(32), default='fixed', nullable=False)
    cookies: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    active_slot_id: Mapped[int | None] = mapped_column(ForeignKey('profile_slots.id'), nullable=True)

    slots: Mapped[list['ProfileSlot']] = relationship(
        'ProfileSlot',
        back_populates='account',
        cascade='all, delete-orphan',
        foreign_keys='ProfileSlot.account_id',
    )
    active_slot: Mapped['ProfileSlot | None'] = relationship(
        'ProfileSlot',
        foreign_keys=[active_slot_id],
        post_update=True,
    )
    tasks: Mapped[list['Task']] = relationship('Task', back_populates='account', cascade='all, delete-orphan')


class ProfileSlot(Base):
    __tablename__ = 'profile_slots'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    account_id: Mapped[int] = mapped_column(ForeignKey('accounts.id'), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    profile_path: Mapped[str] = mapped_column(String(255), nullable=False)
    cookies_file: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    profile_size: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    cookies_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    account: Mapped['Account'] = relationship(
        'Account',
        back_populates='slots',
        foreign_keys=[account_id],
    )

    __table_args__ = (
        UniqueConstraint('account_id', 'name', name='ux_slots_account_name'),
        {
            'sqlite_autoincrement': True,
        },
    )


class Task(Base):
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    account_id: Mapped[int | None] = mapped_column(ForeignKey('accounts.id'), nullable=True)
    seed_file: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[int] = mapped_column(Integer, default=225)
    headless: Mapped[bool] = mapped_column(Integer, default=0)
    dump_json: Mapped[bool] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default='queued')
    log_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    output_path: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    kind: Mapped[str] = mapped_column(String(16), default='frequency')
    params: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    account: Mapped[Account | None] = relationship('Account', back_populates='tasks')


class FrequencyResult(Base):
    __tablename__ = 'freq_results'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mask: Mapped[str] = mapped_column(String(255), nullable=False)
    region: Mapped[int] = mapped_column(Integer, nullable=False, default=225)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default='queued')
    freq_total: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Широкая частотность (WS)")
    freq_quotes: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Частотность в кавычках (\"WS\")")
    freq_exact: Mapped[int] = mapped_column(Integer, nullable=False, default=0, comment="Точная частотность (!WS)")
    group: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, comment="Группа для организации ключей")
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('mask', 'region', name='uq_freq_mask_region'),
        {
            'sqlite_autoincrement': True,
        },
    )


__all__ = ['Account', 'ProfileSlot', 'Task', 'FrequencyResult', 'ACCOUNT_STATUSES']


class PhraseGroup(Base):
    __tablename__ = 'groups'

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parent_id: Mapped[str | None] = mapped_column(String(64), ForeignKey('groups.id'), nullable=True)
    color: Mapped[str] = mapped_column(String(7), nullable=False, default='#6366f1')
    type: Mapped[str] = mapped_column(String(32), nullable=False, default='normal')
    locked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    __table_args__ = (
        UniqueConstraint('parent_id', 'name', name='ux_groups_parent_name'),
    )


__all__.append('PhraseGroup')

