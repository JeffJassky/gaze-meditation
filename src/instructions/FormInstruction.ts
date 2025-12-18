import { ref, markRaw, reactive } from "vue";
import FormView from "./views/FormView.vue";
import { Instruction, type InstructionContext } from "../core/Instruction";
import { type FormInstructionOptions, FormFieldType } from "../types";

export class FormInstruction extends Instruction<FormInstructionOptions> {
  // UI State
  public question = ref("");
  public fields = reactive<FormInstructionOptions["fields"]>([]);
  public formData = reactive<Record<string, any>>({});
  public autoContinue = false;

  constructor(options: FormInstructionOptions) {
    super(options);
    this.question.value = options.question;
    this.fields = options.fields;
    this.autoContinue = options.autoContinue ?? false;

    // Initialize formData with default values
    options.fields.forEach((field) => {
      if (field.type === FormFieldType.MULTISELECT) {
        this.formData[field.name] = [];
      } else {
        this.formData[field.name] = "";
      }
    });
  }

  async start(context: InstructionContext) {
    this.context = context;
    // No specific start logic other than presenting the form
    // The view will handle user input and completion.
  }

  stop() {
    // No specific stop logic
  }

  // Method to be called by the FormView when the form is submitted/completed
  public submitForm(data: Record<string, any>) {
    Object.assign(this.formData, data); // Update internal formData
    this.context?.complete(true, undefined, this.formData); // Pass formData as result
  }

  get component() {
    return markRaw(FormView);
  }

  // Helper to check if all required fields are filled for autoContinue
  public areAllRequiredFieldsFilled(): boolean {
    return this.fields.every((field) => {
      if (!field.required) return true;
      const value = this.formData[field.name];
      if (field.type === FormFieldType.MULTISELECT) {
        return Array.isArray(value) && value.length > 0;
      }
      return !!value;
    });
  }
}
