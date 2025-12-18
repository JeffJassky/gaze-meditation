import { ref, markRaw } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import SpeechView from "./views/SpeechView.vue";
import type { ThemeConfig } from '../types';

interface SpeechOptions extends InstructionOptions {
  targetValue: string;
  timeout?: number;
}

export class SpeechInstruction extends Instruction<SpeechOptions> {
  private recognition: SpeechRecognition | null = null;
  public isListening = ref(false);
  public currentTranscript = ref("");
  protected context: InstructionContext | null = null;
  private timeoutId: number | null = null;
  private startTime: number = 0;
  // public resolvedTheme!: ThemeConfig; // Removed redundant declaration


  start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme; // Store the resolved theme
    this.startTime = Date.now();
    this.currentTranscript.value = "";

    // Start Timeout Logic
    if (this.options.timeout) {
      this.timeoutId = window.setTimeout(() => {
        this.handleTimeout();
      }, this.options.timeout);
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
    let fullTranscript = "";
    // Reconstruct full transcript from all results
    for (let i = 0; i < event.results.length; ++i) {
      if (event.results[i].length > 0) {
        fullTranscript += event.results[i][0].transcript;
      }
    }
    this.currentTranscript.value = fullTranscript;

    const normalizedTranscript = fullTranscript.toLowerCase();
    const targetWords = this.options.targetValue.split(' ');
    
    let searchIndex = 0;
    let allFound = true;

    for (const word of targetWords) {
      const cleanWord = word.toLowerCase().replace(/[^\w\s]|_/g, "");
      if (!cleanWord) continue;

      const foundIndex = normalizedTranscript.indexOf(cleanWord, searchIndex);
      if (foundIndex === -1) {
        allFound = false;
        break;
      }
      searchIndex = foundIndex + cleanWord.length;
    }

    if (allFound) {
      this.complete(true);
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
