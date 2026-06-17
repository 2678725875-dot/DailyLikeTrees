"""UserSetting ORM model — key-value store for user preferences."""

from datetime import datetime

from sqlalchemy import Column, String, DateTime

from ..database import Base


class UserSetting(Base):
    __tablename__ = "user_settings"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow)
