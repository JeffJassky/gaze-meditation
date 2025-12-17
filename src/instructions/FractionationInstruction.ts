import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import FractionationView from './views/FractionationView.vue';
import { faceMeshService } from '../services/faceMeshService';

interface FractionationOptions extends InstructionOptions {
  cycles: number;
}

export class FractionationInstruction extends Instruction<FractionationOptions> {
  public status = ref<'READY' | 'OPEN' | 'CLOSED' | 'FINISHED'>('READY');
  public currentCycle = ref(0);
  public ear = ref(0);
  
  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  
  private openSamples: number[] = [];
  private closedSamples: number[] = [];
  
  // State timers
  private stateStartTime = 0;
  private readonly HOLD_DURATION = 3000; // Time to hold open/closed before switching

  async start(context: InstructionContext) {
    this.context = context;
    this.status.value = 'READY';
    this.currentCycle.value = 0;
    this.openSamples = [];
    this.closedSamples = [];
    
    await faceMeshService.init();
    
    // Start with "Open"
    this.speak("Look at the screen. Eyes open.");
    setTimeout(() => {
        this.status.value = 'OPEN';
        this.stateStartTime = Date.now();
        this.loop();
    }, 2000);
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    window.speechSynthesis.cancel();
  }

  private loop() {
    const ear = faceMeshService.debugData.eyeOpenness;
    this.ear.value = ear;
    
    const elapsed = Date.now() - this.stateStartTime;

    if (this.status.value === 'OPEN') {
        // Collect "Open" samples continuously while in this state
        // (Maybe skip the first 500ms to allow movement to settle)
        if (elapsed > 500) {
            this.openSamples.push(ear);
        }

        // Wait for duration
        if (elapsed > this.HOLD_DURATION) {
            this.switchState('CLOSED');
        }
    } 
    else if (this.status.value === 'CLOSED') {
        if (elapsed > 500) {
            this.closedSamples.push(ear);
        }

        if (elapsed > this.HOLD_DURATION) {
            this.currentCycle.value++;
            if (this.currentCycle.value >= this.options.cycles) {
                this.finish();
                return;
            } else {
                this.switchState('OPEN');
            }
        }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private switchState(newState: 'OPEN' | 'CLOSED') {
      this.status.value = newState;
      this.stateStartTime = Date.now();
      
      if (newState === 'OPEN') {
          this.speak("Open your eyes. Wide awake.");
      } else {
          this.speak("Close your eyes. Go deeper.");
      }
  }

  private finish() {
      this.status.value = 'FINISHED';
      this.stop();
      
      // Calculate calibration
      const avgOpen = this.openSamples.reduce((a,b)=>a+b, 0) / this.openSamples.length;
      const avgClosed = this.closedSamples.reduce((a,b)=>a+b, 0) / this.closedSamples.length;
      
      // Ideally, threshold is midpoint
      // But let's bias it slightly towards closed to avoid false positives on squinting
      // Weighted: 40% Open + 60% Closed?
      // No, usually (Open + Closed) / 2 is safe.
      // Typical: Open ~0.35, Closed ~0.15 => Threshold 0.25.
      
      const newThreshold = (avgOpen + avgClosed) / 2;
      
      console.log(`Calibration Complete. Open: ${avgOpen.toFixed(3)}, Closed: ${avgClosed.toFixed(3)}, Threshold: ${newThreshold.toFixed(3)}`);
      
      faceMeshService.setBlinkThreshold(newThreshold);
      
      this.speak("Calibration complete.");
      setTimeout(() => {
          this.context?.complete(true, { open: avgOpen, closed: avgClosed, threshold: newThreshold });
      }, 2000);
  }

  private speak(text: string) {
      window.speechSynthesis.cancel(); // Interrupt previous
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.8; // Slower, more hypnotic
      u.pitch = 0.9; // Slightly deeper
      window.speechSynthesis.speak(u);
  }

  get component() {
    return markRaw(FractionationView);
  }
}
