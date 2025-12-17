import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import TypeView from './views/TypeView.vue';

interface TypeOptions extends InstructionOptions {
  targetPhrase: string;
}

export class TypeInstruction extends Instruction<TypeOptions> {
  public input = ref('');
  public target = ref('');
  public isComplete = ref(false);
  
  private context: InstructionContext | null = null;
  private handler: ((e: KeyboardEvent) => void) | null = null;

  async start(context: InstructionContext) {
    this.context = context;
    this.target.value = this.options.targetPhrase;
    this.input.value = '';
    
    this.handler = (e: KeyboardEvent) => {
        if (this.isComplete.value) return;

        // Handle backspace
        if (e.key === 'Backspace') {
            this.input.value = this.input.value.slice(0, -1);
            return;
        }

        // Handle typing (basic chars)
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
            this.input.value += e.key;
            this.checkInput();
        }
    };

    window.addEventListener('keydown', this.handler);
  }

  stop() {
    if (this.handler) {
        window.removeEventListener('keydown', this.handler);
        this.handler = null;
    }
  }

  private checkInput() {
      if (this.input.value === this.target.value) {
          this.isComplete.value = true;
          this.context?.complete(true, { input: this.input.value });
      } else if (this.input.value.length >= this.target.value.length && this.input.value !== this.target.value) {
          // Wrong input logic? reset? or just let them backspace?
          // For now, let them see it's wrong (UI can handle red text)
      }
  }

  get component() {
    return markRaw(TypeView);
  }
}
