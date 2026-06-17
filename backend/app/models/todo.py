"""Todo ORM model."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, Float, DateTime

from ..database import Base


class Todo(Base):
    __tablename__ = "todos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    content = Column(String, nullable=False)
    completed = Column(Integer, nullable=False, default=0)
    sort_order = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
