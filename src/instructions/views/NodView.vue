<template>
  <div class="nod-view" :style="{ color: instruction.resolvedTheme.textColor }">
    <div class="counter" v-if="instruction.currentStage.value !== 'CALIBRATING'">
      <span v-for="n in instruction.options.nodsRequired" :key="n" 
            class="dot" :class="{ filled: n <= instruction.nodsCompleted.value }"></span>
    </div>

    <div class="guide" v-if="instruction.currentStage.value === 'CALIBRATING'">
      <h1 class="blink">CALIBRATING...</h1>
      <p :style="{ color: instruction.resolvedTheme.secondaryTextColor }">LOOK STRAIGHT AHEAD</p>
    </div>

    <div class="guide" v-else>
      <h1>{{ instruction.options.type === 'NO' ? 'SHAKE "NO"' : 'NOD "YES"' }}</h1>
      
      <!-- Vertical Layout (YES) -->
      <div class="arrow-container vertical" v-if="instruction.options.type !== 'NO'">
        <!-- UP (negative pitch) -->
        <div class="arrow up" :class="{ active: instruction.relativePitch.value < instruction.UP_THRESH }">▲</div>
        
        <div class="head-dot" :style="{ 
          transform: `translateY(${ (instruction.relativePitch.value / instruction.DOWN_THRESH) * 130 }px)`, 
          backgroundColor: instruction.resolvedTheme.textColor 
        }"></div>
        
        <!-- DOWN (positive pitch) -->
        <div class="arrow down" :class="{ active: instruction.relativePitch.value > instruction.DOWN_THRESH }">▼</div>
      </div>

      <!-- Horizontal Layout (NO) -->
      <div class="arrow-container horizontal" v-else>
        <!-- LEFT (negative yaw) -->
        <div class="arrow left" :class="{ active: instruction.relativeYaw.value < instruction.LEFT_THRESH }">◀</div>
        
        <div class="head-dot" :style="{ 
          transform: `translateX(${ (instruction.relativeYaw.value / instruction.RIGHT_THRESH) * 130 }px)`, 
          backgroundColor: instruction.resolvedTheme.textColor 
        }"></div>
        
        <!-- RIGHT (positive yaw) -->
        <div class="arrow right" :class="{ active: instruction.relativeYaw.value > instruction.RIGHT_THRESH }">▶</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import type { NodInstruction } from '../NodInstruction';
import { computed } from 'vue';

const props = defineProps<{
  instruction: NodInstruction;
}>();

const accentColor = computed(() => props.instruction.resolvedTheme.accentColor);
const secondaryTextColor = computed(() => props.instruction.resolvedTheme.secondaryTextColor);

</script>

<style scoped>
.nod-view {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.counter {
  display: flex;
  gap: 20px;
  margin-bottom: 50px;
}

.dot {
  width: 20px;
  height: 20px;
  border: 2px solid v-bind('instruction.resolvedTheme.textColor');
  border-radius: 50%;
  transition: background 0.3s;
}

.dot.filled {
  background: v-bind(accentColor);
  box-shadow: 0 0 10px v-bind(accentColor);
}

.guide h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.guide p {
    letter-spacing: 2px;
}

.blink {
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
}

.arrow-container {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.arrow-container.vertical {
  height: 300px;
  width: 100px;
  border-left: 2px dashed v-bind(secondaryTextColor);
  flex-direction: column;
}

.arrow-container.horizontal {
  width: 300px;
  height: 100px;
  border-top: 2px dashed v-bind(secondaryTextColor);
  flex-direction: row;
}

.arrow {
  font-size: 2rem;
  color: v-bind(secondaryTextColor);
}

.arrow.active {
  color: v-bind(accentColor);
  text-shadow: 0 0 10px v-bind(accentColor);
}

.head-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  transition: transform 0.05s linear;
}

.vertical .head-dot {
    top: 50%;
    left: -10px; /* Centered on the vertical line (width 100px, border-left at 0?) No, border-left is usually at left edge. Wait. */
    /* Previous CSS had `left: -10px` and `border-left` on container. */
    /* Container width 100px. border-left. Dot is relative to container. */
    /* Let's center the dot on the line. If line is at left edge, dot at -10px is centered on it. */
}

.horizontal .head-dot {
    left: 50%;
    top: -10px; /* Centered on the horizontal line */
}
</style>
