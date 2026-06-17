<template>
  <div class="tree-preview" @click.stop="$emit('click')" title="点击选择树种">
    <svg width="36" height="36" viewBox="0 0 48 48">
      <rect x="22" y="28" width="4" height="14" rx="1" :fill="speciesColor" />
      <circle cx="24" cy="18" r="14" :fill="speciesColor" opacity="0.8" />
      <circle cx="16" cy="16" r="8" :fill="speciesColor" opacity="0.55" />
      <circle cx="32" cy="16" r="8" :fill="speciesColor" opacity="0.55" />
      <circle cx="24" cy="8" r="7" :fill="speciesColor" opacity="0.65" />
    </svg>
    <span class="species-label">{{ speciesLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '../../stores/timer'
import { TREE_SPECIES } from '../../utils/constants'

defineEmits(['click'])

const store = useTimerStore()

const speciesColor = computed(() => {
  const s = TREE_SPECIES.find(t => t.id === store.selectedSpeciesId)
  return s?.color || '#6B8E23'
})

const speciesLabel = computed(() => {
  const s = TREE_SPECIES.find(t => t.id === store.selectedSpeciesId)
  return s?.name || '橡树'
})
</script>

<style scoped>
.tree-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 10px;
  transition: background 0.2s;
  min-width: 52px;
}

.tree-preview:hover {
  background: var(--color-hover-bg);
}

.species-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  line-height: 1.3;
}
</style>
