import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import CalibrationView from './views/CalibrationView.vue';
import { faceMeshService, type Point } from '../services/faceMeshService';

interface CalibrationOptions extends InstructionOptions {}

export class CalibrationInstruction extends Instruction<CalibrationOptions> {
  public currentStep = ref<'left' | 'right'>('left');
  public currentCount = ref(5);
  public currentGaze = ref<Point | null>(null);
  
  private processing = false;
  private recognition: SpeechRecognition | null = null;
  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  
  private numbersMap: Record<string, number> = {
      'FIVE': 5, 'FOUR': 4, 'THREE': 3, 'TWO': 2, 'ONE': 1,
      '5': 5, '4': 4, '3': 3, '2': 2, '1': 1,
      'TO': 2, 'TOO': 2, 'FOR': 4, 'FORE': 4
  };

  async start(context: InstructionContext) {
    this.context = context;
    this.currentStep.value = 'left';
    this.currentCount.value = 5;

    // Init FaceMesh
    await faceMeshService.init();
    faceMeshService.clearCalibration();

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

  private startGazeLoop() {
      const loop = async () => {
          const pred = faceMeshService.getCurrentGaze(); // synchronous now
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
        console.log("Speech recognition ended, restarting...");
        // Restart if not done
        if (this.context) {
            try { this.recognition?.start(); } catch(e){}
        }
    };
    
    this.recognition.onerror = (e) => {
        console.error("Speech recognition error:", e);
    };
    
    try {
        console.log("Starting speech recognition...");
        this.recognition.start();
    } catch(e) {
        console.warn("Speech start error", e);
    }
  }

  private async handleSpeechResult(event: SpeechRecognitionEvent) {
      if (this.processing) return;

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        // Check both interim and final results
        const transcript = result[0].transcript.trim().toUpperCase();
        
        // Debugging
        console.log("Heard:", transcript, "IsFinal:", result.isFinal, "Expected:", this.currentCount.value);

        const expected = this.currentCount.value;
        const expectedWords = [
            expected.toString(), 
            ...Object.keys(this.numbersMap).filter(key => this.numbersMap[key] === expected)
        ];
        
        // Check if ANY of the expected words are in the transcript
        // using .includes() for faster/permissive matching on interim results
        const match = expectedWords.some(w => w && transcript.includes(w));
        
        if (match) {
            this.processing = true;
            await this.snapshot();
            this.processing = false;
            return; // Stop processing this event once we found a match
        }
    }
  }

  private async snapshot() {
      // Calculate target position
      // Left: 10% w, 50% h. Right: 90% w, 50% h.
      const w = window.innerWidth;
      const h = window.innerHeight;
      
      const targetX = this.currentStep.value === 'left' ? w * 0.1 : w * 0.9;
      const targetY = h * 0.5;

      // Train FaceMesh
      // We perform multiple trains to simulate "recording" a burst
      for(let i=0; i<5; i++) {
          faceMeshService.train(targetX, targetY);
          await new Promise(r => setTimeout(r, 20)); // tiny delay
      }

      // Always decrement
      this.currentCount.value--;
      if (this.currentCount.value <= 0) {
          this.advanceStep();
      }
      
      // Reduced delay for snappier feel
      await new Promise(resolve => setTimeout(resolve, 250));
  }

  private advanceStep() {
      if (this.currentStep.value === 'left') {
          this.currentStep.value = 'right';
          this.currentCount.value = 5;
      } else {
          this.complete(true);
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
