<template>
  <div class="tree-preview" @click.stop="$emit('click')" title="点击选择树种">
    <img
      :src="previewPath"
      :alt="speciesLabel"
      class="preview-img"
      width="36" height="36"
    />
    <span class="species-label">{{ speciesLabel }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTimerStore } from '../../stores/timer'
import { TREE_SPECIES } from '../../utils/constants'
import { getSpeciesPreviewPath } from '../../utils/assetPaths'

defineEmits(['click'])

const store = useTimerStore()

const previewPath = computed(() => getSpeciesPreviewPath(store.selectedSpeciesId))

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

.preview-img {
  image-rendering: auto;
  object-fit: contain;
}

.species-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  line-height: 1.3;
}
</style>
