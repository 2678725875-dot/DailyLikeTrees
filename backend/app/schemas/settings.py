"""Pydantic schemas for user settings."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class SettingsUpdate(BaseModel):
    theme: Optional[str] = None
    master_volume: Optional[int] = None
    bgm_enabled: Optional[bool] = None
    ambiance_enabled: Optional[bool] = None
    default_timer_mode: Optional[str] = None
    default_species_id: Optional[str] = None
    dev_mode: Optional[bool] = None
    weather_enabled: Optional[bool] = None
    floating_ball_enabled: Optional[bool] = None


class SettingsResponse(BaseModel):
    theme: str = "light"
    master_volume: int = 80
    bgm_enabled: bool = True
    ambiance_enabled: bool = True
    default_timer_mode: str = "countdown"
    default_species_id: str = "oak"
    dev_mode: bool = False
    weather_enabled: bool = True
    floating_ball_enabled: bool = False
    updated_at: Optional[datetime] = None
