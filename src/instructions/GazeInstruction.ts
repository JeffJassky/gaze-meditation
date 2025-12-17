import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import GazeView from './views/GazeView.vue';
import { faceMeshService } from '../services/faceMeshService';

interface GazeOptions extends InstructionOptions {
  holdTime?: number; // ms
}

export class GazeInstruction extends Instruction<GazeOptions> {
  public position = ref({ top: '50%', left: '50%' });
  
  private holdProgress = 0; // ms held
  private context: InstructionContext | null = null;
  private timeoutId: number | null = null;
  private startTime: number = 0;
  private animationFrameId: number | null = null;
  private isActive = false;

  async start(context: InstructionContext) {
    this.context = context;
    this.startTime = Date.now();
    this.holdProgress = 0;
    this.isActive = true;
    
    // Random Position
    this.position.value = {
        top: `${20 + Math.random() * 60}%`,
        left: `${20 + Math.random() * 60}%`
    };

    // Init FaceMesh
    await faceMeshService.init();

    // Start Gaze Loop
    this.checkGaze();

    // Timeout Logic
    if (this.options.duration) {
      this.timeoutId = window.setTimeout(() => {
        this.complete(false);
      }, this.options.duration);
    }
  }

  stop() {
    this.isActive = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private checkGaze() {
    if (!this.isActive) return;

    const prediction = faceMeshService.getCurrentGaze();
    
    if (prediction) {
        // Calculate Target Box
        // Position is in %, w/h is 96px (24 * 4 = 96)
        const leftPct = parseFloat(this.position.value.left);
        const topPct = parseFloat(this.position.value.top);
        
        const x = window.innerWidth * (leftPct / 100);
        const y = window.innerHeight * (topPct / 100);
        const size = 96;

        // Assuming visual is centered, adjust check?
        // If CSS is "left: 50%" it usually means the element starts at 50%.
        // If it has transform: translate(-50%, -50%), then 50% is the center.
        // Let's assume standard positioning for now (Top-Left corner at %).
        const hit = prediction.x >= x && prediction.x <= x + size &&
                    prediction.y >= y && prediction.y <= y + size;

        if (hit) {
            this.holdProgress += 16.6; // approx 60fps
            const targetHold = this.options.holdTime || 1000;
            
            if (this.holdProgress >= targetHold) {
                this.complete(true);
                return;
            }
        } else {
            // Optional: Decay hold progress instead of hard reset?
            // For now, hard reset to match original behavior
            this.holdProgress = 0;
        }
    }

    this.animationFrameId = requestAnimationFrame(() => this.checkGaze());
  }

  private complete(success: boolean) {
    this.isActive = false;
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    
    const reactionTime = Date.now() - this.startTime;
    this.context?.complete(success, { reactionTime });
  }

  get component() {
    return markRaw(GazeView);
  }
}