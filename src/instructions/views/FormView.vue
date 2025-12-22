<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { FormInstruction } from '../FormInstruction';
import { FormFieldType } from '../../types';

const props = defineProps<{
  instruction: FormInstruction;
}>();

const localFormData = ref({ ...props.instruction.formData });

// Helper to check if a field is valid (e.g., required and not empty)
const isFieldValid = (field: any) => {
  if (!field.required) return true;
  const value = localFormData.value[field.name];
  if (field.type === FormFieldType.MULTISELECT) {
    return Array.isArray(value) && value.length > 0;
  }
  return !!value;
};

const isFormValid = computed(() => {
  return props.instruction.fields.every(isFieldValid);
});

const accentHoverColor = computed(() => props.instruction.resolvedTheme.accentHoverColor || props.instruction.resolvedTheme.accentColor);
const accentColor = computed(() => props.instruction.resolvedTheme.accentColor);
const negativeColor = computed(() => props.instruction.resolvedTheme.negativeColor);
const secondaryTextColor = computed(() => props.instruction.resolvedTheme.secondaryTextColor);
const textColor = computed(() => props.instruction.resolvedTheme.textColor);
const backgroundColor = computed(() => props.instruction.resolvedTheme.backgroundColor);


// Watch for changes in localFormData to potentially auto-submit
watch(localFormData.value, () => {
  if (props.instruction.autoContinue && isFormValid.value) {
    props.instruction.submitForm(localFormData.value);
  }
}, { deep: true });

const submitForm = () => {
  if (isFormValid.value) {
    props.instruction.submitForm(localFormData.value);
  }
};
</script>

<template>
  <div class="form-instruction-view p-8 mx-auto" :style="{ color: textColor }">
    <h2 class="text-3xl font-bold mb-6 text-center">
      <span
        v-for="(segment, index) in instruction.question.split('~')"
        :key="index"
        class="inline-block"
      >{{ segment }}&nbsp;</span>
    </h2>

    <form @submit.prevent="submitForm" class="space-y-6">
      <div v-for="field in instruction.fields" :key="field.name">
        <label
          :for="field.name"
          class="block text-sm font-medium mb-1"
          :style="{ color: secondaryTextColor }"
        >
          {{ field.label }}
          <span v-if="field.required" :style="{ color: negativeColor }">*</span>
        </label>

        <!-- Text, Number, Email -->
        <input
          v-if="field.type === FormFieldType.TEXT || field.type === FormFieldType.NUMBER || field.type === FormFieldType.EMAIL"
          :id="field.name"
          :name="field.name"
          :type="field.type === FormFieldType.TEXT ? 'text' : field.type"
          v-model="localFormData[field.name]"
          :required="field.required"
          class="form-input"
        />

        <!-- Long Text -->
        <textarea
          v-else-if="field.type === FormFieldType.LONG_TEXT"
          :id="field.name"
          :name="field.name"
          v-model="localFormData[field.name]"
          :required="field.required"
          rows="4"
          class="form-input"
        ></textarea>

        <!-- Radio -->
        <div
          v-else-if="field.type === FormFieldType.RADIO"
          class="mt-2 space-y-2"
        >
          <div
            v-for="option in field.options"
            :key="option"
            class="flex items-center"
          >
            <input
              :id="`${field.name}-${option}`"
              :name="field.name"
              type="radio"
              :value="option"
              v-model="localFormData[field.name]"
              :required="field.required"
              class="form-radio"
            />
            <label
              :for="`${field.name}-${option}`"
              class="ml-2 block text-sm"
              :style="{ color: secondaryTextColor }"
            >
              {{ option }}
            </label>
          </div>
        </div>

        <!-- Multiselect (Checkboxes) -->
        <div
          v-else-if="field.type === FormFieldType.MULTISELECT"
          class="mt-2 space-y-2"
        >
          <div
            v-for="option in field.options"
            :key="option"
            class="flex items-center"
          >
            <input
              :id="`${field.name}-${option}`"
              :name="field.name"
              type="checkbox"
              :value="option"
              v-model="localFormData[field.name]"
              class="form-checkbox"
            />
            <label
              :for="`${field.name}-${option}`"
              class="ml-2 block text-sm"
              :style="{ color: secondaryTextColor }"
            >
              {{ option }}
            </label>
          </div>
        </div>
      </div>

      <div v-if="!instruction.autoContinue" class="flex justify-center">
        <button
          type="submit"
          :disabled="!isFormValid"
          class="form-submit-button"
        >
          Next
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.form-instruction-view{
	height: 100vh;
	width: 100vw;
	position: absolute;
	background: v-bind(backgroundColor); /* Bind background color */
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}

.form-input, .form-radio, .form-checkbox {
  @apply block w-full px-3 py-2 rounded-md bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800;
  --tw-ring-color: v-bind(accentColor);
}

.form-radio, .form-checkbox {
  @apply h-4 w-4;
  color: v-bind(accentColor); /* For custom checkbox/radio styling */
}

/* Override default browser styles for checked state */
.form-radio:checked, .form-checkbox:checked {
  background-color: v-bind(accentColor);
  border-color: v-bind(accentColor);
}

.form-submit-button {
  @apply px-6 py-3 text-white font-semibold rounded-md shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed;
  background-color: v-bind(accentColor);
  --tw-ring-color: v-bind(accentColor);

  /* Applying hover styles using v-bind and a pseudo-class is tricky with Tailwind's JIT.
     For this, a direct CSS hover rule or a separate Tailwind utility is usually needed if the hover color is dynamic.
     For simplicity and consistency with v-bind, we'll use a direct CSS hover rule here. */
  &:hover:enabled {
    background-color: v-bind(accentHoverColor);
  }
}
</style>
