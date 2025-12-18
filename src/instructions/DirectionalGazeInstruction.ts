import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import DirectionalGazeView from './views/DirectionalGazeView.vue';
import { faceMeshService, type Point } from '../services/faceMeshService';
import type { ThemeConfig } from '../types';

interface DirectionalOptions extends InstructionOptions {
  direction: 'LEFT' | 'RIGHT';
  duration: number;
  leftSrc?: string;
  rightSrc?: string;
}

export class DirectionalGazeInstruction extends Instruction<DirectionalOptions> {
  public currentGaze = ref<Point | null>(null);
  public isCorrect = ref(false);
  public score = ref(100); 
  // public resolvedTheme!: ThemeConfig; // Removed redundant declaration
  
  protected context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private isActive = false;
  private startTime = 0;
  private correctFrames = 0;
  private totalFrames = 0;

  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme; // Store the resolved theme
    this.isActive = true;
    this.startTime = Date.now();
    this.correctFrames = 0;
    this.totalFrames = 0;
    this.score.value = 0;

    // Ensure service running
    await faceMeshService.init();
    
    this.loop();
  }

  stop() {
    this.isActive = false;
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private async loop() {
    if (!this.isActive) return;

    const pred = faceMeshService.getCurrentGaze();
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
        this.complete(this.score.value > 50);
        return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private checkDirection(p: Point): boolean {
      const midX = window.innerWidth / 2;
      if (this.options.direction === 'LEFT') {
          return p.x < midX;
      } else {
          return p.x >= midX;
      }
  }

  private complete(success: boolean) {
    this.stop();
    this.context?.complete(success, { score: this.score.value });
  }

  get component() {
    return markRaw(DirectionalGazeView);
  }
}
