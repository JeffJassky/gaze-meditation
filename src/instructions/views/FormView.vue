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
  <div class="form-instruction-view p-8 mx-auto text-white">
    <h2 class="text-3xl font-bold mb-6 text-center">
      {{ instruction.question }}
    </h2>

    <form @submit.prevent="submitForm" class="space-y-6">
      <div v-for="field in instruction.fields" :key="field.name">
        <label
          :for="field.name"
          class="block text-sm font-medium text-zinc-300 mb-1"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-red-500">*</span>
        </label>

        <!-- Text, Number, Email -->
        <input
          v-if="field.type === FormFieldType.TEXT || field.type === FormFieldType.NUMBER || field.type === FormFieldType.EMAIL"
          :id="field.name"
          :name="field.name"
          :type="field.type === FormFieldType.TEXT ? 'text' : field.type"
          v-model="localFormData[field.name]"
          :required="field.required"
          class="block w-full px-3 py-2 rounded-md bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <!-- Long Text -->
        <textarea
          v-else-if="field.type === FormFieldType.LONG_TEXT"
          :id="field.name"
          :name="field.name"
          v-model="localFormData[field.name]"
          :required="field.required"
          rows="4"
          class="block w-full px-3 py-2 rounded-md bg-zinc-700 border border-zinc-600 text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-zinc-500 bg-zinc-600"
            />
            <label
              :for="`${field.name}-${option}`"
              class="ml-2 block text-sm text-zinc-300"
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
              class="focus:ring-blue-500 h-4 w-4 text-blue-600 border-zinc-500 bg-zinc-600"
            />
            <label
              :for="`${field.name}-${option}`"
              class="ml-2 block text-sm text-zinc-300"
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
          class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* Add any specific styles here if needed, or rely on Tailwind CSS */
.form-instruction-view{
	height: 100vh;
	width: 100vw;
	position: absolute;
	background: gray;
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
}
</style>
