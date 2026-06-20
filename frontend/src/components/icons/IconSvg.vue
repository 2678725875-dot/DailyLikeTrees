<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    :stroke="color"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="icon-svg"
  >
    <g v-show="name === 'timer'">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </g>
    <g v-show="name === 'tree'" transform="translate(12,12) scale(1.1,1) translate(-12,-12)">
      <path d="M12 1L7 10M12 1l5 9" fill="none" />
      <path d="M12 8l-6 10h12z" fill="none" />
      <line x1="12" y1="18" x2="12" y2="22" />
    </g>
    <g v-show="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </g>
    <g v-show="name === 'moon'">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </g>
    <g v-show="name === 'volume-on'">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    </g>
    <g v-show="name === 'volume-off'">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </g>
    <g v-show="name === 'music'">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </g>
    <g v-show="name === 'headphones'">
      <!-- Violin body: upper bout + waist + lower bout -->
      <path d="M10 7.5C8 7.5 6.5 9.5 6.5 12c0 1.5 0.8 2.5 1.5 3 0.8 0.5 1.5 0.8 2.5 1.2 0.8 0.3 1.2 0.5 1.5 0.8 0.3-0.3 0.7-0.5 1.5-0.8 1-0.4 1.7-0.7 2.5-1.2 0.7-0.5 1.5-1.5 1.5-3 0-2.5-1.5-4.5-3.5-4.5z" />
      <!-- Neck -->
      <line x1="10" y1="7.5" x2="10" y2="3" />
      <line x1="14" y1="7.5" x2="14" y2="3" />
      <!-- Scroll -->
      <circle cx="12" cy="2" r="1.2" />
      <!-- f-holes -->
      <path d="M10 11.5c0.3-0.8 0.3-1.5 0-2" />
      <path d="M14 11.5c-0.3-0.8-0.3-1.5 0-2" />
      <!-- Bow (diagonal crossing) -->
      <line x1="4" y1="5" x2="20" y2="19" />
      <line x1="4.8" y1="4.2" x2="20.8" y2="18.2" />
    </g>
    <g v-show="name === 'leaf'">
      <path d="M5 19C5 19 7 5 19 3c0 0 1 6-5 14z" />
      <path d="M5 19c4-4 8-7 14-16" />
    </g>
    <g v-show="name === 'check'">
      <polyline points="20 6 9 17 4 12" />
    </g>
    <g v-show="name === 'check-filled'">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </g>
    <g v-show="name === 'plus'">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>
    <g v-show="name === 'close'">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </g>
    <g v-show="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </g>
    <g v-show="name === 'play'">
      <polygon points="5 3 19 12 5 21 5 3" />
    </g>
    <g v-show="name === 'pause'">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </g>
    <g v-show="name === 'trash'">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </g>
    <g v-show="name === 'landscape'">
      <path d="M17.5 19H9.7l-4.2-5.3a1 1 0 0 1 1.5-1.2L12 15l4-5h5.5a1 1 0 0 1 .8.4l1.7 2.2a1 1 0 0 1-.2 1.4L17.5 19z" />
      <path d="M2 21h20" />
    </g>
    <g v-show="name === 'cloud'">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </g>
    <g v-show="name === 'lightning'">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </g>
    <g v-show="name === 'image'">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </g>
    <g v-show="name === 'sparkle'">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </g>
    <g v-show="name === 'piano'">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <line x1="6" y1="4" x2="6" y2="14" />
      <line x1="10" y1="4" x2="10" y2="14" />
      <line x1="14" y1="4" x2="14" y2="14" />
      <line x1="18" y1="4" x2="18" y2="14" />
    </g>
    <g v-show="name !== 'timer' && name !== 'tree' && name !== 'sun' && name !== 'moon' && name !== 'volume-on' && name !== 'volume-off' && name !== 'music' && name !== 'headphones' && name !== 'leaf' && name !== 'check' && name !== 'check-filled' && name !== 'plus' && name !== 'close' && name !== 'settings' && name !== 'play' && name !== 'pause' && name !== 'trash' && name !== 'landscape' && name !== 'cloud' && name !== 'lightning' && name !== 'image' && name !== 'sparkle' && name !== 'piano'">
      <circle cx="12" cy="12" r="2" />
    </g>
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  name: string
  size?: number
  strokeWidth?: number
  color?: string
}>(), {
  size: 24,
  strokeWidth: 1.5,
  color: 'currentColor',
})
</script>

<style scoped>
.icon-svg {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
