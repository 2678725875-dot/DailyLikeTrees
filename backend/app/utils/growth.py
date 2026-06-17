"""Tree growth stage calculation.

Growth stages are determined by the actual focus duration:
  0-14  minutes → stage 0 (seed)
  15-29 minutes → stage 1 (sprout)
  30-59 minutes → stage 2 (sapling)
  60+   minutes → stage 3 (mature)
"""

GROWTH_THRESHOLDS = [
    (14, 0),
    (29, 1),
    (59, 2),
    (float("inf"), 3),
]


def get_growth_stage(duration_minutes: float) -> int:
    """Return the growth stage (0-3) for a given focus duration in minutes."""
    for max_minutes, stage in GROWTH_THRESHOLDS:
        if duration_minutes <= max_minutes:
            return stage
    return 3


def get_growth_label(stage: int) -> str:
    """Return a human-readable label for a growth stage."""
    labels = {0: "种子", 1: "萌芽", 2: "树苗", 3: "大树"}
    return labels.get(stage, "未知")
