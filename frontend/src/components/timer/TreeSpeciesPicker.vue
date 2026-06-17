<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal-content">
        <h3 class="modal-title">选择树种</h3>
        <div class="species-grid">
          <button
            v-for="species in TREE_SPECIES"
            :key="species.id"
            class="species-card"
            :class="{ selected: species.id === store.selectedSpeciesId }"
            @click="selectAndClose(species.id)"
          >
            <svg width="56" height="56" viewBox="0 0 48 48">
              <rect x="22" y="28" width="4" height="14" rx="1" :fill="species.color" />
              <circle cx="24" cy="18" r="14" :fill="species.color" opacity="0.8" />
            </svg>
            <span class="species-name">{{ species.name }}</span>
            <span class="species-desc">{{ species.description }}</span>
          </button>
        </div>
        <button class="close-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useTimerStore } from '../../stores/timer'
import { TREE_SPECIES } from '../../utils/constants'

defineEmits(['close'])
const store = useTimerStore()

function selectAndClose(id: string) {
  store.selectSpecies(id)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--color-bg);
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 90vw;
  box-shadow: 0 8px 32px rgba(0,0,0,0.15);
}

.modal-title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  color: var(--color-text);
}

.species-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.species-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  background: var(--color-bg-secondary);
  cursor: pointer;
  transition: border-color 0.2s, transform 0.15s;
}

.species-card:hover {
  transform: translateY(-2px);
}

.species-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
}

.species-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}

.species-desc {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: center;
}

.close-btn {
  display: block;
  margin: 20px auto 0;
  padding: 8px 28px;
  border: 1px solid var(--color-border);
  border-radius: 20px;
  background: var(--color-bg-secondary);
  color: var(--color-text);
  font-size: 14px;
  cursor: pointer;
}
</style>
