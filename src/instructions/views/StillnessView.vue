<template>
  <div class="stillness-view">
    <div
      class="status-indicator"
      :class="{ error: instruction.status.value === 'FAILED' }"
    >
      <h2 v-if="instruction.status.value === 'WAITING'">
        Get Ready to Freeze...
      </h2>
      <h2 v-else-if="instruction.status.value === 'HOLDING'">
        {{ instruction.options.prompt }}
      </h2>
      <h2 v-else-if="instruction.status.value === 'FAILED'">
        MOVEMENT DETECTED
      </h2>
      <h2 v-else>PERFECT</h2>
    </div>

    <div class="visualizer" v-if="instruction.status.value === 'HOLDING'">
      <!-- A target ring -->
      <div class="target-ring"></div>
      <!-- The user's head position -->
      <div class="cursor" :style="cursorStyle"></div>
    </div>

    <div class="progress-bar">
      <div
        class="fill"
        :style="{ width: instruction.progress.value + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { StillnessInstruction } from '../StillnessInstruction';

const props = defineProps<{
  instruction: StillnessInstruction;
}>();

const cursorStyle = computed(() => {
    // Amplify drift for visual feedback (Scale factor)
    // FaceMesh Yaw: -Left, +Right
    // FaceMesh Pitch: -Up, +Down (Assuming standard image coords)
    // We multiply by a large factor (e.g. 1000px) because the units are small (normalized relative to face width)

    const scale = 1500;
    const x = props.instruction.driftX.value * scale;
    const y = props.instruction.driftY.value * scale;

    return {
        transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
        opacity: Math.max(0.4, 1 - props.instruction.drift.value * 5)
    }
});
</script>

<style scoped>
.stillness-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
}

.status-indicator h2 {
  font-size: 3rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

.status-indicator.error {
  color: #ff4444;
  animation: shake 0.5s;
}

.visualizer {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 50px;
}

.target-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100px;
  height: 100px;
  border: 4px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
}

.cursor {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  background: cyan;
  border-radius: 50%;
  transform: translate(-50%, -50%); /* Base transform, overridden by style */
  transition: transform 0.1s;
}

.progress-bar {
  width: 80%;
  height: 10px;
  background: #333;
  border-radius: 5px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: cyan;
  transition: width 0.1s linear;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
</style>
