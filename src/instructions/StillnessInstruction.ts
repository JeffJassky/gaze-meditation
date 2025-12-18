import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import StillnessView from './views/StillnessView.vue';
import { faceMeshService } from '../services/faceMeshService';

interface StillnessOptions extends InstructionOptions {
  duration: number; // ms to hold still
  tolerance?: number; // Sensitivity (0.01 - 0.1)
}

export class StillnessInstruction extends Instruction<StillnessOptions> {
  public status = ref<'WAITING' | 'HOLDING' | 'FAILED' | 'SUCCESS'>('WAITING');
  public progress = ref(0);
  public drift = ref(0);
  public driftX = ref(0);
  public driftY = ref(0);
  
  protected context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private startHoldTime = 0;
  private initialYaw = 0;
  private initialPitch = 0;
  
  // Tolerance for movement
  private get tolerance() { return this.options.tolerance || 0.05; }

  async start(context: InstructionContext) {
    this.context = context;
    this.status.value = 'WAITING';
    
    await faceMeshService.init();
    
    // Give them a moment to settle before locking the pose
    setTimeout(() => this.lockPose(), 2000);
    
    this.loop();
  }

  private lockPose() {
    if (this.status.value === 'FAILED') return;
    
    this.initialYaw = faceMeshService.debugData.headYaw;
    this.initialPitch = faceMeshService.debugData.headPitch;
    this.startHoldTime = Date.now();
    this.status.value = 'HOLDING';
  }

  stop() {
    this.status.value = 'SUCCESS'; // Or whatever state it ended in
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private loop() {
    if (this.status.value === 'SUCCESS' || this.status.value === 'FAILED') return;

    if (this.status.value === 'HOLDING') {
        const currentYaw = faceMeshService.debugData.headYaw;
        const currentPitch = faceMeshService.debugData.headPitch;

        // Calculate distance from initial pose
        const diffYaw = currentYaw - this.initialYaw;
        const diffPitch = currentPitch - this.initialPitch;
        
        this.driftX.value = diffYaw;
        this.driftY.value = diffPitch;

        const totalDrift = Math.hypot(diffYaw, diffPitch);
        
        this.drift.value = totalDrift;

        if (totalDrift > this.tolerance) {
            this.fail("Moved too much");
        }

        const elapsed = Date.now() - this.startHoldTime;
        this.progress.value = Math.min(100, (elapsed / this.options.duration!) * 100);

        if (elapsed >= this.options.duration!) {
            this.succeed();
        }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private fail(reason: string) {
      this.status.value = 'FAILED';
      this.stop();
      // Fail immediately or retry? Let's fail for now.
      setTimeout(() => {
        this.context?.complete(false, { reason });
      }, 1000);
  }

  private succeed() {
      this.status.value = 'SUCCESS';
      this.stop();
      this.context?.complete(true, { drift: this.drift.value });
  }

  get component() {
    return markRaw(StillnessView);
  }
}
