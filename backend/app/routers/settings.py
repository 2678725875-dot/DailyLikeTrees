"""User settings API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..schemas.settings import SettingsUpdate, SettingsResponse
from ..services import settings_service

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    return settings_service.get_settings(db)


@router.put("", response_model=SettingsResponse)
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    return settings_service.update_settings(db, data.model_dump(exclude_unset=True))
