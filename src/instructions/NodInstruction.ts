import { ref, markRaw } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import NodView from "./views/NodView.vue";
import { faceMeshService } from "../services/faceMeshService";

interface NodOptions extends InstructionOptions {
  nodsRequired: number;
  type: "YES" | "NO"; // Just YES (Nod) implemented for now
}

export class NodInstruction extends Instruction<NodOptions> {
  public nodsCompleted = ref(0);
  public currentStage = ref<"CALIBRATING" | "CENTER" | "WAIT_UP" | "WAIT_DOWN">(
    "CALIBRATING"
  );
  public currentPitch = ref(0);
  public relativePitch = ref(0);

  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private baselinePitch = 0;
  private calibrationSamples: number[] = [];

  // Thresholds (Relative to baseline)
  // Pitch: -Up, +Down
  private readonly UP_THRESH = -0.01;
  private readonly DOWN_THRESH = 0.01;

  async start(context: InstructionContext) {
    this.context = context;
    this.nodsCompleted.value = 0;
    this.currentStage.value = "CALIBRATING";
    this.calibrationSamples = [];

    await faceMeshService.init();

    // Run calibration for 1 second
    const startCal = Date.now();

    const calibrate = () => {
      if (Date.now() - startCal > 1000) {
        // Finish calibration
        if (this.calibrationSamples.length > 0) {
          this.baselinePitch =
            this.calibrationSamples.reduce((a, b) => a + b, 0) /
            this.calibrationSamples.length;
        }
        this.currentStage.value = "CENTER";
        this.loop();
        return;
      }

      const pitch = faceMeshService.debugData.headPitch;
      // Ignore zeros/uninitialized
      if (pitch !== 0) this.calibrationSamples.push(pitch);

      this.animationFrameId = requestAnimationFrame(calibrate);
    };

    calibrate();
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private loop() {
    const rawPitch = faceMeshService.debugData.headPitch;
    const relPitch = rawPitch - this.baselinePitch;

    this.currentPitch.value = rawPitch;
    this.relativePitch.value = relPitch;

    // State Machine
    if (this.currentStage.value === "CENTER") {
      // Waiting for start of nod cycle (Up first)
      if (relPitch < this.UP_THRESH) {
        this.currentStage.value = "WAIT_DOWN";
      }
    } else if (this.currentStage.value === "WAIT_DOWN") {
      // We went UP, now we must go DOWN past threshold
      if (relPitch > this.DOWN_THRESH) {
        this.completeNod();
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private completeNod() {
    this.nodsCompleted.value++;
    this.currentStage.value = "CENTER"; // Reset cycle

    if (this.nodsCompleted.value >= this.options.nodsRequired) {
      this.stop();
      this.context?.complete(true);
    }
  }

  get component() {
    return markRaw(NodView);
  }
}
