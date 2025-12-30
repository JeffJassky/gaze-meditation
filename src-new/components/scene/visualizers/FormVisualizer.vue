<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { FormFieldType, type FormField } from '@/types'

const props = defineProps<{
  question: string
  fields: FormField[]
  initialData: Record<string, any>
  autoContinue?: boolean
  theme: {
    accentColor: string
    accentHoverColor?: string
    negativeColor?: string
    secondaryTextColor?: string
    textColor: string
    backgroundColor?: string
    [key: string]: any
  }
}>()

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void
}>()

const localFormData = ref({ ...props.initialData })

const isFieldValid = (field: FormField) => {
  if (!field.required) return true
  const value = localFormData.value[field.name]
  if (field.type === FormFieldType.MULTISELECT) {
    return Array.isArray(value) && value.length > 0
  }
  return !!value
}

const isFormValid = computed(() => {
  return props.fields.every(isFieldValid)
})

watch(localFormData, (newVal) => {
  if (props.autoContinue && isFormValid.value) {
    emit('submit', newVal)
  }
}, { deep: true })

const submitForm = () => {
  if (isFormValid.value) {
    emit('submit', localFormData.value)
  }
}
</script>

<template>
  <div class="form-visualizer p-8 w-full max-w-2xl mx-auto backdrop-blur-md bg-black/20 rounded-3xl border border-white/5 shadow-2xl">
    <h2 class="text-3xl font-light mb-12 text-center tracking-tight" :style="{ color: theme.textColor }">
      <span
        v-for="(segment, index) in question.split('~')"
        :key="index"
        class="inline-block"
      >{{ segment.trim() }}&nbsp;</span>
    </h2>

    <form @submit.prevent="submitForm" class="space-y-8">
      <div v-for="field in fields" :key="field.name" class="space-y-3">
        <label
          :for="field.name"
          class="block text-xs uppercase tracking-widest font-bold opacity-50"
          :style="{ color: theme.secondaryTextColor }"
        >
          {{ field.label }}
          <span v-if="field.required" :style="{ color: theme.negativeColor }">*</span>
        </label>

        <!-- Inputs -->
        <input
          v-if="[FormFieldType.TEXT, FormFieldType.NUMBER, FormFieldType.EMAIL].includes(field.type)"
          :id="field.name"
          :type="field.type === FormFieldType.TEXT ? 'text' : field.type"
          v-model="localFormData[field.name]"
          class="form-input"
        />

        <textarea
          v-else-if="field.type === FormFieldType.LONG_TEXT"
          :id="field.name"
          v-model="localFormData[field.name]"
          rows="4"
          class="form-input"
        ></textarea>

        <div v-else-if="field.type === FormFieldType.RADIO" class="grid grid-cols-1 gap-3">
          <label v-for="option in field.options" :key="option" class="form-radio-label">
            <input type="radio" :value="option" v-model="localFormData[field.name]" class="sr-only" />
            <span 
              class="radio-custom transition-all duration-300"
              :class="{ 'active': localFormData[field.name] === option }"
              :style="{ 
                borderColor: localFormData[field.name] === option ? theme.accentColor : 'rgba(255,255,255,0.1)',
                backgroundColor: localFormData[field.name] === option ? theme.accentColor + '20' : 'transparent'
              }"
            >
              {{ option }}
            </span>
          </label>
        </div>

        <div v-else-if="field.type === FormFieldType.MULTISELECT" class="grid grid-cols-1 gap-3">
          <label v-for="option in field.options" :key="option" class="form-checkbox-label">
            <input type="checkbox" :value="option" v-model="localFormData[field.name]" class="sr-only" />
            <span 
              class="checkbox-custom transition-all duration-300"
              :class="{ 'active': localFormData[field.name].includes(option) }"
              :style="{ 
                borderColor: localFormData[field.name].includes(option) ? theme.accentColor : 'rgba(255,255,255,0.1)',
                backgroundColor: localFormData[field.name].includes(option) ? theme.accentColor + '20' : 'transparent'
              }"
            >
              {{ option }}
            </span>
          </label>
        </div>
      </div>

      <div v-if="!autoContinue" class="pt-8 flex justify-center">
        <button
          type="submit"
          :disabled="!isFormValid"
          class="form-submit-btn transition-all duration-500"
          :style="{ 
            backgroundColor: theme.accentColor,
            color: '#000',
            opacity: isFormValid ? 1 : 0.3
          }"
        >
          CONTINUE
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-input {
  @apply block w-full px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white transition-all duration-300;
}
.form-input:focus {
  @apply outline-none border-white/30 bg-white/10;
}

.radio-custom, .checkbox-custom {
  @apply block px-6 py-4 rounded-2xl border-2 cursor-pointer text-sm font-medium;
}

.radio-custom.active, .checkbox-custom.active {
  @apply border-opacity-100;
}

.form-submit-btn {
  @apply px-12 py-4 rounded-full font-black tracking-widest text-sm shadow-xl;
}
</style>
