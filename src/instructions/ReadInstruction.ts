import { Instruction, type InstructionContext } from '../core/Instruction';
import { markRaw } from 'vue';
import ReadView from './views/ReadView.vue';

interface ReadInstructionConfig {
  id: string;
  prompt: string;
  duration?: number; // Optional duration for how long the text is displayed
  text: string; // The text content to display
}

export class ReadInstruction extends Instruction {
  readonly text: string;
  readonly component = markRaw(ReadView);
  private timer: number | null = null;

  constructor(config: ReadInstructionConfig) {
    super(config);
    this.text = config.text;
  }

  start(context: InstructionContext): void {
    this.context = context;
    if (this.options.duration) {
      this.timer = window.setTimeout(() => {
        this.context?.complete(true);
      }, this.options.duration);
    } else {
      // If no duration, it completes immediately, or expects external trigger
      // For a simple ReadInstruction, we can make it complete almost immediately if no duration.
      // Or, it could wait for a user interaction in ReadView, but for now, let's assume auto-completion.
      this.context?.complete(true); // Auto-complete if no duration, adjust if ReadView will have a "Next" button.
    }
  }

  stop(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
