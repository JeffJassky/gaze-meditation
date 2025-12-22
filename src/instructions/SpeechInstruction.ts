import { ref, markRaw, watch } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import SpeechView from "./views/SpeechView.vue";
import { speechService } from "../services/speechService";
import type { ThemeConfig } from '../types';
import { playbackSpeed } from '../state/playback';

interface SpeechOptions extends InstructionOptions {
  targetValue: string;
  timeout?: number;
}

export class SpeechInstruction extends Instruction<SpeechOptions> {
  public isListening = ref(false);
  public currentTranscript = ref("");
  protected context: InstructionContext | null = null;
  private timeoutId: number | null = null;
  private startTime: number = 0;
  // public resolvedTheme!: ThemeConfig; // Removed redundant declaration
  private unwatch: (() => void) | null = null;

  constructor(options: SpeechOptions) {
    super({
      ...options,
      capabilities: { speech: true, ...options.capabilities }
    });
  }

  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme; // Store the resolved theme
    this.startTime = Date.now();
    this.currentTranscript.value = "";

    // Start Timeout Logic
    if (this.options.timeout) {
      this.timeoutId = window.setTimeout(() => {
        this.handleTimeout();
      }, this.options.timeout / playbackSpeed.value);
    }

    // Initialize/Ensure Speech Service
    await speechService.init();
    speechService.resetTranscript(); // Clear previous session text for clean slate? 
    // Or maybe we don't want to kill the background session?
    // resetTranscript() in my implementation restarts the service which clears memory.
    // If we just want to track *new* words, we could just clear our local view of it.
    // But since the service accumulates a huge string, resetting is probably good practice per-instruction.
    
    if (!speechService.isListening.value) {
        speechService.start();
    }
    
    this.isListening.value = true; // Local UI state matches service? 
    // actually, let's link it to service state for accurate UI
    
    // Watch service transcript
    this.unwatch = watch(speechService.transcript, (newVal) => {
        this.handleTranscriptUpdate(newVal);
    });
  }

  stop() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.unwatch) {
        this.unwatch();
        this.unwatch = null;
    }
    this.isListening.value = false;
    // We do NOT stop the service here, as per "keep instance running in background" request.
    // Theater handles the global stop.
  }

  private handleTranscriptUpdate(fullTranscript: string) {
    this.currentTranscript.value = fullTranscript;
    this.isListening.value = speechService.isListening.value;

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
      // Small delay to let the UI reflect the final word before resolving
      setTimeout(() => {
        this.finish(true);
      }, 150 / playbackSpeed.value);
    }
  }

  private handleTimeout() {
    this.finish(false);
  }

  private finish(success: boolean) {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    const reactionTime = Date.now() - this.startTime;
    this.complete(success, { reactionTime });
  }

  get component() {
    return markRaw(SpeechView);
  }
}
