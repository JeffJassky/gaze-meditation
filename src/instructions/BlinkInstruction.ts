import { ref, markRaw } from 'vue';
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction';
import BlinkView from './views/BlinkView.vue';
import { faceMeshService } from '../services/faceMeshService';

interface BlinkOptions extends InstructionOptions {
  duration: number;
}

export class BlinkInstruction extends Instruction<BlinkOptions> {
  public timeLeft = ref(0);
  public isBlinking = ref(false);
  public ear = ref(0); // Eye Aspect Ratio
  public status = ref<'RUNNING' | 'FAILED' | 'SUCCESS'>('RUNNING');
  
  private context: InstructionContext | null = null;
  private animationFrameId: number | null = null;
  private endTime = 0;

  async start(context: InstructionContext) {
    this.context = context;
    this.status.value = 'RUNNING';
    
    await faceMeshService.init();
    
    this.endTime = Date.now() + (this.options.duration || 10000);
    this.loop();
  }

  stop() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
  }

  private loop() {
    if (this.status.value !== 'RUNNING') return;

    this.timeLeft.value = Math.max(0, this.endTime - Date.now());
    this.isBlinking.value = faceMeshService.debugData.blinkDetected;
    this.ear.value = faceMeshService.debugData.eyeOpenness;

    if (this.isBlinking.value) {
        this.fail();
        return;
    }

    if (this.timeLeft.value <= 0) {
        this.succeed();
        return;
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private fail() {
      this.status.value = 'FAILED';
      this.stop();
      setTimeout(() => {
        this.context?.complete(false, { reason: 'Blinked' });
      }, 1500);
  }

  private succeed() {
      this.status.value = 'SUCCESS';
      this.stop();
      this.context?.complete(true);
  }

  get component() {
    return markRaw(BlinkView);
  }
}
