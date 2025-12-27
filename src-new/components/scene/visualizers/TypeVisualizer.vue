<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'

const props = defineProps<{
  targetText: string
  currentInput: string
  isComplete: boolean
  theme: {
    textColor: string
    secondaryTextColor?: string
    accentColor: string
    positiveColor?: string
    negativeColor?: string
    [key: string]: any
  }
}>()

const emit = defineEmits<{
  (e: 'update:input', value: string): void
}>()

const hiddenInput = ref<HTMLInputElement | null>(null)

const hasError = computed(() => {
  return !props.targetText.startsWith(props.currentInput)
})

const inputAreaStyles = computed(() => {
  let borderColor = props.theme.secondaryTextColor || '#ccc'
  let color = props.theme.textColor || '#fff'

  if (props.isComplete) {
    borderColor = props.theme.positiveColor || 'green'
    color = props.theme.positiveColor || 'green'
  } else if (hasError.value) {
    borderColor = props.theme.negativeColor || 'red'
    color = props.theme.negativeColor || 'red'
  }

  return { borderColor, color }
})

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:input', target.value)
}

const focusInput = () => {
  hiddenInput.value?.focus()
}

// Keep focus
const refocus = () => {
  if (!props.isComplete) {
    setTimeout(() => hiddenInput.value?.focus(), 10)
  }
}

onMounted(() => {
  focusInput()
})

watch(() => props.isComplete, (newVal) => {
  if (!newVal) focusInput()
})
</script>

<template>
  <div class="type-visualizer" @click="focusInput">
    <!-- Hidden Input -->
    <input
      ref="hiddenInput"
      type="text"
      class="hidden-input"
      :value="currentInput"
      @input="handleInput"
      @blur="refocus"
      autofocus
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />

    <!-- Target Display -->
    <div class="target-display mb-8">
      <h1
        :style="{
          color: theme.accentColor,
          textShadow: `0 0 10px ${theme.accentColor}`
        }"
      >
        {{ targetText }}
      </h1>
    </div>

    <!-- Input Feedback -->
    <div
      class="input-area"
      :style="inputAreaStyles"
    >
      {{ currentInput }}<span class="cursor">|</span>
    </div>
  </div>
</template>

<style scoped>
.type-visualizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: text;
  width: 100%;
}

.hidden-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}

.target-display h1 {
  font-size: 2.5rem;
  margin: 0;
  letter-spacing: 1px;
  text-align: center;
}

.input-area {
  font-size: 3rem;
  border-bottom: 2px solid;
  min-width: 50%;
  text-align: center;
  padding-bottom: 10px;
  word-break: break-all;
  white-space: pre-wrap;
}

.cursor {
  animation: blink 1s infinite;
  opacity: 0.7;
}

@keyframes blink {
  0%, 100% { opacity: 0; }
  50% { opacity: 1; }
}
</style>
