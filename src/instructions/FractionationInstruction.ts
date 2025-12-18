import { ref, markRaw } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import FractionationView from "./views/FractionationView.vue";
import { faceMeshService } from "../services/faceMeshService";

interface FractionationOptions extends InstructionOptions {
  cycles: number;
}

export class FractionationInstruction extends Instruction<FractionationOptions> {
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

  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;

  private openSamples: number[] = [];
  private closedSamples: number[] = [];

  private stateStartTime = 0;
  private readonly HOLD_DURATION = 3000; // Time to hold open/closed to collect samples
  private readonly DETECTION_DELAY_MS = 1500; // Delay before detection starts after speech
  private readonly STABILITY_DURATION = 1500; // Time (ms) eye must be stable in compliant state
  private readonly OBSERVING_DURATION = 3000; // Time (ms) to passively observe EAR range

  private isDetecting = false;
  private stableSince = 0; // Timestamp when eye entered compliant state

  private initialOpenEAR = 0;
  private initialClosedEAR = 1; // Start high, so min works

  async start(context: InstructionContext) {
    this.context = context;
    this.status.value = "READY";
    this.currentCycle.value = 0;
    this.openSamples = [];
    this.closedSamples = [];
    this.isDetecting = false;
    this.stableSince = 0;
    this.initialOpenEAR = 0;
    this.initialClosedEAR = 1; // Reset for each start

    await faceMeshService.init();

    this.speak("Please look at the screen while I estimate your eye range.");
    this.status.value = "OBSERVING";
    this.stateStartTime = Date.now();
    setTimeout(() => {
      // Start passive observation loop
      this.loop();
    }, this.DETECTION_DELAY_MS); // Give time for speech
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.speechSynthesis.cancel();
    this.isDetecting = false; // Ensure detection stops
  }

  private loop() {
    const ear = faceMeshService.debugData.eyeOpenness;
    this.ear.value = ear;
    this.eyeOpennessNormalized.value = faceMeshService.debugData.eyeOpennessNormalized;

    const now = Date.now();

    if (this.status.value === "OBSERVING") {
      this.initialOpenEAR = Math.max(this.initialOpenEAR, ear);
      this.initialClosedEAR = Math.min(this.initialClosedEAR, ear);

      if (now - this.stateStartTime > this.OBSERVING_DURATION) {
        console.log(
          `Initial EAR range - Open: ${this.initialOpenEAR.toFixed(
            3
          )}, Closed: ${this.initialClosedEAR.toFixed(3)}`
        );
        this.speak("Thank you. To begin, please open your eyes.");
        this.status.value = "WAITING_FOR_OPEN";
        setTimeout(() => {
          this.isDetecting = true;
        }, this.DETECTION_DELAY_MS);
      }
    } else {
      // Normal instruction flow
      if (!this.isDetecting && this.status.value !== "READY") {
        this.animationFrameId = requestAnimationFrame(() => this.loop());
        return;
      }

      // Dynamic transition thresholds based on initial observation
      // When detecting open, look for EAR well above the estimated closed
      const openTransitionThreshold =
        this.initialClosedEAR +
        (this.initialOpenEAR - this.initialClosedEAR) * 0.15; // 15% up from closed
      // When detecting closed, look for EAR well below the estimated open
      const closedTransitionThreshold =
        this.initialOpenEAR -
        (this.initialOpenEAR - this.initialClosedEAR) * 0.15; // 15% down from open

      if (this.status.value === "WAITING_FOR_OPEN") {
        if (ear > openTransitionThreshold) {
          if (this.stableSince === 0) {
            this.stableSince = now;
          } else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.speak("Thank you. Please keep them open.");
            this.stateStartTime = now;
            this.status.value = "OPEN";
            this.stableSince = 0;
          }
        } else {
          this.stableSince = 0;
        }
      } else if (this.status.value === "OPEN") {
        this.openSamples.push(ear);
        if (now - this.stateStartTime > this.HOLD_DURATION) {
          this.isDetecting = false;
          this.switchState("CLOSED");
        }
      } else if (this.status.value === "WAITING_FOR_CLOSED") {
        if (ear < closedTransitionThreshold) {
          if (this.stableSince === 0) {
            this.stableSince = now;
          } else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.speak("Thank you. Please keep them closed.");
            this.stateStartTime = now;
            this.status.value = "CLOSED";
            this.stableSince = 0;
          }
        } else {
          this.stableSince = 0;
        }
      } else if (this.status.value === "CLOSED") {
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

  private switchState(newState: "OPEN" | "CLOSED") {
    if (newState === "OPEN") {
      this.speak("Now, please open your eyes.");
      this.status.value = "WAITING_FOR_OPEN";
      setTimeout(() => {
        this.isDetecting = true;
      }, this.DETECTION_DELAY_MS);
    } else {
      this.speak("Now, please close your eyes.");
      this.status.value = "WAITING_FOR_CLOSED";
      setTimeout(() => {
        this.isDetecting = true;
      }, this.DETECTION_DELAY_MS);
    }
  }

  private finish() {
    this.status.value = "FINISHED";
    this.stop();

    const avgOpen =
      this.openSamples.reduce((a, b) => a + b, 0) / this.openSamples.length;
    const avgClosed =
      this.closedSamples.reduce((a, b) => a + b, 0) / this.closedSamples.length;

    // Use a small buffer around the min/max to ensure animation range
    const eyeOpennessMinCalibrated = avgClosed * 0.95; // Slightly below observed closed
    const eyeOpennessMaxCalibrated = avgOpen * 1.05; // Slightly above observed open

    faceMeshService.setEyeOpennessMin(eyeOpennessMinCalibrated);
    faceMeshService.setEyeOpennessMax(eyeOpennessMaxCalibrated);
    
    // Set normalized blink threshold based on the calibrated range
    // A value of 0.2 means eyes need to be 20% "closed" on the normalized scale to trigger a blink
    faceMeshService.setNormalizedBlinkThreshold(0.2); 

    const fullCalibration = faceMeshService.getCalibration();

    console.log(`Calibration Complete. Open: ${avgOpen.toFixed(3)}, Closed: ${avgClosed.toFixed(3)}`);

    this.speak("Calibration complete.");
    setTimeout(() => {
      this.context?.complete(true, {
        ...fullCalibration,
        metrics: { open: avgOpen, closed: avgClosed },
      });
    }, 2000);
  }

  private speak(text: string) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.8;
    u.pitch = 0.9;
    window.speechSynthesis.speak(u);
  }

  get component() {
    return markRaw(FractionationView);
  }
}
