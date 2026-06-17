/** Application constants. */

import type { TreeSpecies } from '../types/tree'

export const TREE_SPECIES: TreeSpecies[] = [
  { id: 'oak', name: '橡树', description: '坚固可靠，持之以恒', color: '#6B8E23' },
  { id: 'pine', name: '松树', description: '常青不凋，韧性十足', color: '#2E8B57' },
  { id: 'cherry', name: '樱花', description: '柔美优雅，珍惜时光', color: '#FFB7C5' },
  { id: 'bonsai', name: '盆景', description: '耐心呵护，方寸之间', color: '#8FBC8F' },
]

export const GROWTH_LABELS = ['种子', '萌芽', '树苗', '大树'] as const
