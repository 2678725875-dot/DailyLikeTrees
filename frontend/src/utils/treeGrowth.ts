/** Tree growth stage calculation (mirrors backend/app/utils/growth.py). */

export function getGrowthStage(durationMinutes: number): number {
  if (durationMinutes <= 14) return 0
  if (durationMinutes <= 29) return 1
  if (durationMinutes <= 59) return 2
  return 3
}

export function getGrowthLabel(stage: number): string {
  const labels = ['种子', '萌芽', '树苗', '大树']
  return labels[stage] ?? '未知'
}
