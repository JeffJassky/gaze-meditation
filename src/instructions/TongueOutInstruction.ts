import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import TongueOutView from './views/TongueOutView.vue';
import { faceMeshService } from '../services/faceMeshService';

interface TongueOutOptions extends InstructionOptions {
  duration?: number;
}

export class TongueOutInstruction extends Instruction<TongueOutOptions> {
  public status = ref<'WAITING' | 'HOLDING' | 'SUCCESS'>('WAITING');
  public progress = ref(0);
  public tongueScore = ref(0);
  public isTongueDetected = ref(false);
  
  // Deprecated but kept for view compatibility until view is updated
  public availableShapes = ref<string[]>([]);
  
  private holdStartTime = 0;
  private animationFrameId: number | null = null;
  
  constructor(options: TongueOutOptions) {
    super({
      duration: 2000,
      ...options,
      capabilities: { faceMesh: true, ...options.capabilities } // We need FaceMesh
    });
  }

  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme;
    this.status.value = 'WAITING';
    this.progress.value = 0;

    await faceMeshService.init();
    await faceMeshService.enableTongueDetection();
    
    this.loop();
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    faceMeshService.disableTongueDetection();
  }

  private loop() {
    if (this.status.value === 'SUCCESS') return;

    // Get Data from FaceMeshService (SlimSAM logic)
    const score = faceMeshService.debugData.tongueProtrusion;
    const isDetected = faceMeshService.debugData.tongueDetected;
    
    this.tongueScore.value = score;
    this.isTongueDetected.value = isDetected;

    const duration = this.options.duration || 2000;

    // Use isDetected (pixel threshold) AND score (protrusion amount)
    // Score is 0-1 (approx). Let's require > 0.1 protrusion.
    if (isDetected && score > 0.1) {
        if (this.status.value === 'WAITING') {
            this.status.value = 'HOLDING';
            this.holdStartTime = Date.now();
        } else if (this.status.value === 'HOLDING') {
            const elapsed = Date.now() - this.holdStartTime;
            this.progress.value = Math.min(100, (elapsed / duration) * 100);
            
            if (elapsed >= duration) {
                this.complete();
                return;
            }
        }
    } else {
        if (this.status.value === 'HOLDING') {
            this.status.value = 'WAITING';
            this.progress.value = 0;
        }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private complete() {
    this.status.value = 'SUCCESS';
    this.stop();
    setTimeout(() => {
        this.context?.complete(true);
    }, 500);
  }

  get component() {
    return markRaw(TongueOutView);
  }
}