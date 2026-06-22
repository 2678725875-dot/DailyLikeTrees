"""User settings service."""

import json
from datetime import datetime

from sqlalchemy.orm import Session

from ..models.settings import UserSetting


DEFAULTS = {
    "theme": "light",
    "master_volume": "80",
    "bgm_enabled": "true",
    "ambiance_enabled": "true",
    "default_timer_mode": "countdown",
    "default_species_id": "oak",
    "dev_mode": "false",
    "weather_enabled": "true",
    "floating_ball_enabled": "false",
}


def get_settings(db: Session) -> dict:
    """Get all settings, merging stored values with defaults."""
    stored = {s.key: s.value for s in db.query(UserSetting).all()}
    result = {}
    for key, default_value in DEFAULTS.items():
        result[key] = stored.get(key, default_value)
    # Add updated_at from any stored setting
    latest = db.query(UserSetting).order_by(UserSetting.updated_at.desc()).first()
    if latest:
        result["updated_at"] = latest.updated_at
    return result


def update_settings(db: Session, data: dict) -> dict:
    """Update settings. Only provided keys are updated."""
    for key, value in data.items():
        if value is None:
            continue
        setting = db.query(UserSetting).filter(UserSetting.key == key).first()
        if setting:
            setting.value = str(value).lower() if isinstance(value, bool) else str(value)
            setting.updated_at = datetime.utcnow()
        else:
            setting = UserSetting(
                key=key,
                value=str(value).lower() if isinstance(value, bool) else str(value),
            )
            db.add(setting)
    db.commit()
    return get_settings(db)
