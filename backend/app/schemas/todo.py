"""Pydantic schemas for todos."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class TodoCreate(BaseModel):
    content: str


class TodoUpdate(BaseModel):
    content: Optional[str] = None
    completed: Optional[int] = None


class TodoReorderItem(BaseModel):
    id: int
    sort_order: float


class TodoReorder(BaseModel):
    items: List[TodoReorderItem]


class TodoResponse(BaseModel):
    id: int
    content: str
    completed: int
    sort_order: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
