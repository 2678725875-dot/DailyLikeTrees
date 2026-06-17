"""PlantedTree ORM model — one tree per completed focus session."""

from datetime import datetime

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

from ..database import Base


class PlantedTree(Base):
    __tablename__ = "planted_trees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("focus_sessions.id"), nullable=False)
    species_id = Column(String, nullable=False)
    growth_stage = Column(Integer, nullable=False)   # 0=seed, 1=sprout, 2=sapling, 3=mature
    grid_x = Column(Integer, nullable=False)
    grid_y = Column(Integer, nullable=False)
    time_filter_key = Column(String, nullable=False, index=True)  # e.g. '2026-06-14', '2026-W24', '2026-06', 'total'
    planted_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
