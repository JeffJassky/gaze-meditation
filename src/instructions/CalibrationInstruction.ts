import { ref, markRaw, watch } from "vue";
import {
  Instruction,
  type InstructionContext,
  type InstructionOptions,
} from "../core/Instruction";
import CalibrationView from "./views/CalibrationView.vue";
import { faceMeshService, type Point } from "../services/faceMeshService";
import { speechService } from "../services/speechService";
import type { ThemeConfig } from '../types';


interface CalibrationOptions extends InstructionOptions {}

export class CalibrationInstruction extends Instruction<CalibrationOptions> {
  // UI State
  public currentDisplayNumber = ref(10);
  public currentGaze = ref<Point | null>(null);
  public targetPosition = ref({ x: 50, y: 50 }); // Percentage
  public isSuccess = ref(false);
  // public resolvedTheme!: ThemeConfig; // Removed redundant declaration


  // Internal State
  private stepIndex = 0;
  private shuffledNumbers: number[] = [];
  private shuffledPositions: Array<{ x: number; y: number }> = [];

  private processing = false;
  // private recognition: SpeechRecognition | null = null; // Removed
  protected context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private unwatchSpeech: (() => void) | null = null;

  constructor(options: CalibrationOptions) {
    super({
      ...options,
      capabilities: { faceMesh: true, speech: true, ...options.capabilities }
    });
  }

  private numbersMap: Record<string, number> = {
    TEN: 10,
    NINE: 9,
    EIGHT: 8,
    SEVEN: 7,
    SIX: 6,
    FIVE: 5,
    FOUR: 4,
    THREE: 3,
    TWO: 2,
    ONE: 1,
    ZERO: 0,
    "10": 10,
    "9": 9,
    "8": 8,
    "7": 7,
    "6": 6,
    "5": 5,
    "4": 4,
    "3": 3,
    "2": 2,
    "1": 1,
    "0": 0,
    TO: 2,
    TOO: 2,
    FOR: 4,
    FORE: 4,
    SEX: 6,
    OH: 0,
    HATE: 8,
  };

  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme; // Store the resolved theme
    this.isSuccess.value = false;
    this.stepIndex = 0;

    // 1. Generate Random Sequence
    // Numbers 0-10 (11 items) or 1-10? User said 0-10. Let's do 0-10.
    const numbers = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    this.shuffledNumbers = this.shuffle(numbers);

    // 2. Generate Random Positions (ensure coverage)
    // We need 11 positions for 0-10.
    // Corners (4), Edges (4), Center (1), + 2 Randoms?
    // Or just random distribution.
    // Let's stick to the grid concept but shuffled order.
    const edgePaddingPercentage = 10;
    const calibrationPoints: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < numbers.length; i++) {
      const x =
        i % 2 === 0 ? edgePaddingPercentage : 100 - edgePaddingPercentage;
      const y =
        edgePaddingPercentage +
        Math.random() * (100 - 2 * edgePaddingPercentage);
      calibrationPoints.push({ x, y });
    }

    this.shuffledPositions = this.shuffle(calibrationPoints);
    // Init FaceMesh
    await faceMeshService.init();
    faceMeshService.clearCalibration();

    // Init Speech
    await speechService.init();
    speechService.resetTranscript();
    if (!speechService.isListening.value) speechService.start();
    
    // Watch Last Result for event-driven matching (more efficient than parsing whole transcript repeatedly)
    this.unwatchSpeech = watch(speechService.lastResult, (newVal) => {
        this.handleSpeechInput(newVal);
    });

    // Start
    this.nextStep();

    // Start Loops
    // this.initSpeech(); // Removed
    this.startGazeLoop();
  }

  stop() {
    if (this.unwatchSpeech) {
        this.unwatchSpeech();
        this.unwatchSpeech = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    faceMeshService.stop();
    // Do not stop speechService, let theater handle it.
  }

  private nextStep() {
    if (this.stepIndex >= this.shuffledNumbers.length) {
      this.context?.complete(true);
      return;
    }

    this.currentDisplayNumber.value = this.shuffledNumbers[this.stepIndex];
    this.targetPosition.value = this.shuffledPositions[this.stepIndex];
    this.isSuccess.value = false;
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private startGazeLoop() {
    const loop = async () => {
      const pred = faceMeshService.getCurrentGaze();
      this.currentGaze.value = pred;
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  private async handleSpeechInput(transcript: string) {
    if (this.processing || !transcript) return;

    transcript = transcript.trim().toUpperCase();
    const expected = this.currentDisplayNumber.value;
    console.log("Heard:", transcript, "Expected:", expected);

    const expectedWords = [
        expected.toString(),
        ...Object.keys(this.numbersMap).filter(
          (key) => this.numbersMap[key] === expected
        ),
    ];

    const match = expectedWords.some((w) => w && transcript.includes(w));

    if (match) {
        this.processing = true;
        await this.snapshot();
        this.processing = false;
    }
  }
  
  // Removed old initSpeech and handleSpeechResult methods


  private async snapshot() {
    // Show Success Visual
    this.isSuccess.value = true;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const targetX = (this.targetPosition.value.x / 100) * w;
    const targetY = (this.targetPosition.value.y / 100) * h;

    // Train
    for (let i = 0; i < 5; i++) {
      faceMeshService.train(targetX, targetY);
      await new Promise((r) => setTimeout(r, 20));
    }

    // Wait 1s for visual feedback
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Move to next
    this.stepIndex++;
    this.nextStep();
  }

  private complete(success: boolean) {
    this.stop();
    this.context?.complete(success);
  }

  get component() {
    return markRaw(CalibrationView);
  }
}
