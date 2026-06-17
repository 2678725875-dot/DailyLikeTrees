"""Pydantic schemas for trees."""

from datetime import datetime
from typing import List

from pydantic import BaseModel


class TreeResponse(BaseModel):
    id: int
    session_id: int
    species_id: str
    growth_stage: int
    grid_x: int
    grid_y: int
    planted_at: datetime

    class Config:
        from_attributes = True


class TreeStats(BaseModel):
    count: int
    total_minutes: int


class TreeListResponse(BaseModel):
    trees: List[TreeResponse]
    stats: TreeStats
