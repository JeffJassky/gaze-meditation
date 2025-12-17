import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import CalibrationView from './views/CalibrationView.vue';
import { faceMeshService, type Point } from '../services/faceMeshService';

interface CalibrationOptions extends InstructionOptions {}

export class CalibrationInstruction extends Instruction<CalibrationOptions> {
  public currentCount = ref(10);
  public currentGaze = ref<Point | null>(null);
  public targetPosition = ref({ x: 50, y: 50 }); // Percentage
  public isSuccess = ref(false);
  
  private processing = false;
  private recognition: SpeechRecognition | null = null;
  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  
  private numbersMap: Record<string, number> = {
      'TEN': 10, 'NINE': 9, 'EIGHT': 8, 'SEVEN': 7, 'SIX': 6, 'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1,
      '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2, '1': 1,
      'TO': 2, 'TOO': 2, 'FOR': 4, 'FORE': 4
  };

  async start(context: InstructionContext) {
    this.context = context;
    this.currentCount.value = 10;
    this.isSuccess.value = false;

    // Init FaceMesh
    await faceMeshService.init();
    faceMeshService.clearCalibration();

    // Start with first position
    this.generateNextPosition();

    // Start Loops
    this.initSpeech();
    this.startGazeLoop();
  }

  stop() {
    if (this.recognition) {
        this.recognition.stop();
        this.recognition = null;
    }
    if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId);
    }
    faceMeshService.stop();
  }

  private generateNextPosition() {
      // Pick a position based on remaining count to ensure coverage
      // 10 points: 4 corners, 4 edges, 2 random/center
      const count = this.currentCount.value;
      
      // Map count to specific regions to ensure good calibration spread
      // 10: Center (Start)
      // 9: Top Left
      // 8: Top Right
      // 7: Bottom Right
      // 6: Bottom Left
      // 5: Top Center
      // 4: Bottom Center
      // 3: Left Center
      // 2: Right Center
      // 1: Center (Verify)
      
      const padding = 10; // % from edge
      
      const positions: Record<number, {x: number, y: number}> = {
          10: { x: 50, y: 50 },
          9:  { x: padding, y: padding }, // TL
          8:  { x: 100 - padding, y: padding }, // TR
          7:  { x: 100 - padding, y: 100 - padding }, // BR
          6:  { x: padding, y: 100 - padding }, // BL
          5:  { x: 50, y: padding }, // TC
          4:  { x: 50, y: 100 - padding }, // BC
          3:  { x: padding, y: 50 }, // LC
          2:  { x: 100 - padding, y: 50 }, // RC
          1:  { x: 50, y: 50 } // C
      };
      
      this.targetPosition.value = positions[count] || { x: 50, y: 50 };
  }

  private startGazeLoop() {
      const loop = async () => {
          const pred = faceMeshService.getCurrentGaze();
          this.currentGaze.value = pred;
          this.animationFrameId = requestAnimationFrame(loop);
      };
      loop();
  }

  private initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error("Speech Recognition not supported");
        this.complete(false);
        return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (e) => this.handleSpeechResult(e);
    this.recognition.onend = () => {
        // Restart if not done
        if (this.context && this.recognition) {
            try { this.recognition.start(); } catch(e){}
        }
    };
    
    try {
        this.recognition.start();
    } catch(e) {
        console.warn("Speech start error", e);
    }
  }

  private async handleSpeechResult(event: SpeechRecognitionEvent) {
      if (this.processing) return;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        const transcript = result[0].transcript.trim().toUpperCase();
        
        console.log("Heard:", transcript, "Expected:", this.currentCount.value);

        const expected = this.currentCount.value;
        const expectedWords = [
            expected.toString(), 
            ...Object.keys(this.numbersMap).filter(key => this.numbersMap[key] === expected)
        ];
        
        const match = expectedWords.some(w => w && transcript.includes(w));
        
        if (match) {
            this.processing = true;
            await this.snapshot();
            this.processing = false;
            return;
        }
    }
  }

  private async snapshot() {
      // Show Success Visual
      this.isSuccess.value = true;
      
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      // Convert % to px
      const targetX = (this.targetPosition.value.x / 100) * w;
      const targetY = (this.targetPosition.value.y / 100) * h;

      // Train
      for(let i=0; i<5; i++) {
          faceMeshService.train(targetX, targetY);
          await new Promise(r => setTimeout(r, 20));
      }

      // Wait 1s for visual feedback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Move to next
      this.isSuccess.value = false;
      this.currentCount.value--;
      
      if (this.currentCount.value <= 0) {
          this.complete(true);
      } else {
          this.generateNextPosition();
      }
  }

  private complete(success: boolean) {
      this.stop();
      this.context?.complete(success);
  }

  get component() {
    return markRaw(CalibrationView);
  }
}
