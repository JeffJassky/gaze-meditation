import { ref, markRaw } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import SpeechView from "./views/SpeechView.vue";

interface SpeechOptions extends InstructionOptions {
  targetValue: string;
}

export class SpeechInstruction extends Instruction<SpeechOptions> {
  private recognition: SpeechRecognition | null = null;
  public isListening = ref(false);
  protected context: InstructionContext | null = null;
  private timeoutId: number | null = null;
  private startTime: number = 0;

  start(context: InstructionContext) {
    this.context = context;
    this.startTime = Date.now();

    // Start Timeout Logic
    if (this.options.duration) {
      this.timeoutId = window.setTimeout(() => {
        this.handleTimeout();
      }, this.options.duration);
    }

    // Initialize Speech
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = "en-US";

      this.recognition.onresult = (e) => this.handleResult(e);
      this.recognition.onend = () => this.handleEnd();
      this.recognition.onerror = (e) => console.error("Speech Error", e);

      try {
        this.recognition.start();
        this.isListening.value = true;
      } catch (e) {
        console.warn("Recognition already active", e);
      }
    } else {
      console.warn("Speech API not supported");
      // Could autocomplete or fail here
    }
  }

  stop() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    this.isListening.value = false;
  }

  private handleResult(event: SpeechRecognitionEvent) {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      for (let j = 0; j < result.length; ++j) {
        const transcript = result[j].transcript.trim().toUpperCase();
        const target = this.options.targetValue.toUpperCase();

        if (transcript.includes(target)) {
          this.complete(true);
          return;
        }
      }
    }
  }

  private handleEnd() {
    // Auto-restart if still active (handled by engine not calling stop yet)
    // Actually, checking isListening or context might be better
    if (this.isListening.value && this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        /* ignore */
      }
    }
  }

  private handleTimeout() {
    this.complete(false);
  }

  private complete(success: boolean) {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    const reactionTime = Date.now() - this.startTime;
    this.context?.complete(success, { reactionTime });
  }

  get component() {
    return markRaw(SpeechView);
  }
}
