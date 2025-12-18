import { ref, markRaw } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import FractionationView from "./views/FractionationView.vue";
import { faceMeshService } from "../services/faceMeshService";
import type { ThemeConfig } from '../types';

interface FractionationOptions extends InstructionOptions {
  cycles: number;
}

export class FractionationInstruction extends Instruction<FractionationOptions> {
  // --- Reactive UI State ---
  public status = ref<
    | "READY"
    | "OBSERVING"
    | "WAITING_FOR_OPEN"
    | "OPEN"
    | "WAITING_FOR_CLOSED"
    | "CLOSED"
    | "FINISHED"
  >("READY");

  public currentCycle = ref(0);
  public ear = ref(0);
  public eyeOpennessNormalized = ref(1.0);
  // public resolvedTheme!: ThemeConfig; // Removed redundant declaration


  // --- Internal Logic State ---
  private observationSamples: number[] = [];
  private openSamples: number[] = [];
  private closedSamples: number[] = [];

  private stateStartTime = 0;
  private stableSince = 0;
  private isDetecting = false;
  private isSpeaking = false;
  private animationFrameId: number | null = null;

  // --- Calibration Baselines ---
  private naturalOpenBaseline = 0;
  private estimatedClosedThreshold = 0;

  // --- Constants ---
  private readonly STABILITY_DURATION = 800; // Time eye must be stable to trigger state
  private readonly HOLD_DURATION = 2000; // Time to collect data in a state
  private readonly OBSERVING_DURATION = 3000; // Initial "natural look" time

  /**
   * Entry point: Initializes service and starts the sequence.
   */
  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme; // Store the resolved theme
    this.status.value = "READY";
    this.currentCycle.value = 0;
    this.observationSamples = [];
    this.openSamples = [];
    this.closedSamples = [];
    this.isDetecting = false;

    await faceMeshService.init();

    // PHASE 1: Await the introductory speech before starting the observation timer
    await this.speak(
      "Please look naturally at the screen while I measure your eyes."
    );

    this.status.value = "OBSERVING";
    this.stateStartTime = Date.now();
    this.loop();
  }

  /**
   * Main animation loop: Runs ~60fps.
   */
  private loop() {
    const ear = faceMeshService.debugData.eyeOpenness;
    this.ear.value = ear;
    const now = Date.now();

    // GUARD: If the computer is talking, pause all detection logic.
    if (this.isSpeaking) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
      return;
    }

    // --- State: OBSERVING (Establishing Baseline) ---
    if (this.status.value === "OBSERVING") {
      this.observationSamples.push(ear);

      if (now - this.stateStartTime > this.OBSERVING_DURATION) {
        const sum = this.observationSamples.reduce((a, b) => a + b, 0);
        this.naturalOpenBaseline = sum / this.observationSamples.length;

        /**
         * CALIBRATION MATH:
         * We use your .25 / .20 feedback.
         * Offset of -0.04 from natural baseline marks "Closed".
         * Offset of -0.02 from natural baseline marks "Open".
         */
        this.estimatedClosedThreshold = this.naturalOpenBaseline - 0.04;

        this.moveToWaitingForOpen();
        return;
      }
    }

    // --- Phase 2: Active Detection ---
    else if (this.isDetecting) {
      const isOpen = ear >= this.naturalOpenBaseline - 0.02;
      const isClosed = ear <= this.estimatedClosedThreshold;

      // Logic: WAITING FOR OPEN
      if (this.status.value === "WAITING_FOR_OPEN") {
        if (isOpen) {
          if (this.stableSince === 0) this.stableSince = now;
          else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.status.value = "OPEN";
            this.stateStartTime = now;
            this.stableSince = 0;
            this.speak("Perfect."); // Encouragement (non-blocking)
          }
        } else {
          this.stableSince = 0;
        }
      }

      // Logic: COLLECTING OPEN DATA
      else if (this.status.value === "OPEN") {
        this.openSamples.push(ear);
        if (now - this.stateStartTime > this.HOLD_DURATION) {
          this.isDetecting = false;
          this.switchState("CLOSED");
        }
      }

      // Logic: WAITING FOR CLOSED
      else if (this.status.value === "WAITING_FOR_CLOSED") {
        if (isClosed) {
          if (this.stableSince === 0) this.stableSince = now;
          else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.status.value = "CLOSED";
            this.stateStartTime = now;
            this.stableSince = 0;
            this.speak("Good."); // Encouragement (non-blocking)
          }
        } else {
          this.stableSince = 0;
        }
      }

      // Logic: COLLECTING CLOSED DATA
      else if (this.status.value === "CLOSED") {
        this.closedSamples.push(ear);
        if (now - this.stateStartTime > this.HOLD_DURATION) {
          this.isDetecting = false;
          this.currentCycle.value++;

          if (this.currentCycle.value >= this.options.cycles) {
            this.finish();
            return;
          } else {
            this.switchState("OPEN");
          }
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Helper to transition from Observation to the first cycle.
   */
  private async moveToWaitingForOpen() {
    this.status.value = "WAITING_FOR_OPEN";
    await this.speak("Thank you. Now, please open your eyes.");
    this.isDetecting = true;
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  /**
   * Handles switching between OPEN and CLOSED prompts.
   */
  private async switchState(newState: "OPEN" | "CLOSED") {
    if (newState === "OPEN") {
      this.status.value = "WAITING_FOR_OPEN";
      await this.speak("Now, open your eyes.");
      this.isDetecting = true;
    } else {
      this.status.value = "WAITING_FOR_CLOSED";
      await this.speak("Now, close your eyes.");
      this.isDetecting = true;
    }
    // Ensure loop continues after the await
    if (!this.animationFrameId) this.loop();
  }

  /**
   * Wraps Web Speech API in a Promise to block logic until speech ends.
   */
  private speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      this.isSpeaking = true;

      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.pitch = 1.0;

      u.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      u.onerror = () => {
        this.isSpeaking = false;
        resolve();
      };

      window.speechSynthesis.speak(u);
    });
  }

  /**
   * Finalizes calibration and saves data to the service.
   */
  private async finish() {
    this.status.value = "FINISHED";
    this.stop();

    const avgOpen =
      this.openSamples.reduce((a, b) => a + b, 0) / this.openSamples.length;
    const avgClosed =
      this.closedSamples.reduce((a, b) => a + b, 0) / this.closedSamples.length;

    // Apply 5% padding to ensure the UI animation range feels natural
    faceMeshService.setEyeOpennessMin(avgClosed * 0.95);
    faceMeshService.setEyeOpennessMax(avgOpen * 1.05);

    // Set a relative threshold for what counts as a blink in the future
    faceMeshService.setNormalizedBlinkThreshold(0.25);

    await this.speak("Calibration complete. Thank you.");

    setTimeout(() => {
      this.context?.complete(true, {
        metrics: { open: avgOpen, closed: avgClosed },
        ...faceMeshService.getCalibration(),
      });
    }, 1000);
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.isDetecting = false;
    this.isSpeaking = false;
    window.speechSynthesis.cancel();
  }

  get component() {
    return markRaw(FractionationView);
  }
}
