import { ref, markRaw, computed } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import DirectionalGazeView from './views/DirectionalGazeView.vue';
import { webGazerService, type Point } from '../services/webGazerService';

interface DirectionalOptions extends InstructionOptions {
  direction: 'LEFT' | 'RIGHT';
  duration: number;
}

export class DirectionalGazeInstruction extends Instruction<DirectionalOptions> {
  public currentGaze = ref<Point | null>(null);
  public isCorrect = ref(false);
  public score = ref(100); // Start high, drop if wrong? or Start 0, gain if right.
  
  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private isActive = false;
  private startTime = 0;
  private correctFrames = 0;
  private totalFrames = 0;

  async start(context: InstructionContext) {
    this.context = context;
    this.isActive = true;
    this.startTime = Date.now();
    this.correctFrames = 0;
    this.totalFrames = 0;
    this.score.value = 0;

    // Ensure service running
    await webGazerService.init();
    
    this.loop();
  }

  stop() {
    this.isActive = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private async loop() {
    if (!this.isActive) return;

    const pred = await webGazerService.getCurrentPrediction();
    this.currentGaze.value = pred;

    if (pred) {
        this.totalFrames++;
        const correct = this.checkDirection(pred);
        this.isCorrect.value = correct;
        
        if (correct) {
            this.correctFrames++;
        }

        this.score.value = (this.correctFrames / this.totalFrames) * 100;
    }

    // Check duration
    if (Date.now() - this.startTime > (this.options.duration || 5000)) {
        // Success if > 50% ?
        this.complete(this.score.value > 50);
        return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private checkDirection(p: Point): boolean {
      const leftC = webGazerService.calibrationData.leftCentroid;
      const rightC = webGazerService.calibrationData.rightCentroid;

      if (!leftC || !rightC) {
          // Fallback to simple screen split if no calibration
          const midX = window.innerWidth / 2;
          if (this.options.direction === 'LEFT') return p.x < midX;
          else return p.x >= midX;
      }

      // Check distance to centroids
      const distLeft = Math.hypot(p.x - leftC.x, p.y - leftC.y);
      const distRight = Math.hypot(p.x - rightC.x, p.y - rightC.y);

      if (this.options.direction === 'LEFT') {
          return distLeft < distRight;
      } else {
          return distRight < distLeft;
      }
  }

  private complete(success: boolean) {
    this.stop();
    this.context?.complete(success, { score: this.score.value });
  }

  get component() {
    return markRaw(DirectionalGazeView);
  }

  get centroids() {
      return {
          left: webGazerService.calibrationData.leftCentroid,
          right: webGazerService.calibrationData.rightCentroid
      };
  }
}
