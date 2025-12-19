import { ref, markRaw } from 'vue'
import { Instruction, type InstructionContext, type InstructionOptions } from '../core/Instruction'
import FractionationView from './views/FractionationView.vue'
import { faceMeshService } from '../services/faceMeshService'

interface FractionationOptions extends InstructionOptions {
	cycles: number
}

export class FractionationInstruction extends Instruction<FractionationOptions> {
	// --- Reactive UI State ---
	public status = ref<
		'READY' | 'WAITING_FOR_OPEN' | 'OPEN' | 'WAITING_FOR_CLOSED' | 'CLOSED' | 'FINISHED'
	>('READY')

	public currentCycle = ref(0)
	public ear = ref(0)
	public eyeOpennessNormalized = ref(0)

	// --- Internal Logic State ---
	private openSamples: number[] = []
	private closedSamples: number[] = []

	private stateStartTime = 0
	private stableSince = 0
	private isDetecting = false
	private isSpeaking = false
	private animationFrameId: number | null = null

  // --- Adaptive Math ---
  private centerOpenness = 0;
  private isInitialized = false;

  // --- Constants ---
  private readonly STABILITY_DURATION = 500; 
  private readonly HOLD_DURATION = 1500; 
  
  // Per user feedback: Thresholds set to -0.04 for both.
  // Note: We use a tiny epsilon for 'isOpen' to prevent rapid flickering 
  // if the value is exactly at the threshold.
  private readonly CLOSE_THRESHOLD = -0.04;
  private readonly OPEN_THRESHOLD = -0.035; 

  constructor(options: FractionationOptions) {
    super({
      ...options,
      capabilities: { faceMesh: true, ...options.capabilities }
    });
  }

  async start(context: InstructionContext) {
    this.context = context;
    this.resolvedTheme = context.resolvedTheme;
    this.status.value = "READY";
    this.currentCycle.value = 0;
    this.openSamples = [];
    this.closedSamples = [];
    this.isDetecting = false;
    this.isInitialized = false;
    this.centerOpenness = 0;

    await faceMeshService.init();

    // Start the loop immediately to begin establishing centerOpenness (baseline)
    this.animationFrameId = requestAnimationFrame(() => this.loop());

    // Give a brief moment for the camera/filter to settle and capture the 
    // "already open" eyes as the baseline.
    setTimeout(() => {
        this.moveToWaitingForClosed();
    }, 800);
  }

  private loop() {
    const rawEAR = faceMeshService.debugData.eyeOpenness;
    this.ear.value = rawEAR;
    const now = Date.now();

    if (this.isSpeaking) {
      this.animationFrameId = requestAnimationFrame(() => this.loop());
      return;
    }

    // --- Adaptive Center Logic ---
    if (!this.isInitialized) {
        if (rawEAR > 0) {
            this.centerOpenness = rawEAR;
            this.isInitialized = true;
        }
    } else {
        // We adapt the "Center" (Open Baseline) when the user's eyes should be open.
        const shouldAdapt = 
            this.status.value === 'READY' || 
            this.status.value === 'WAITING_FOR_OPEN' || 
            this.status.value === 'OPEN';

        if (shouldAdapt) {
             this.centerOpenness = this.lerp(this.centerOpenness, rawEAR, 0.05);
        }
    }

    const deviation = rawEAR - this.centerOpenness;
    this.eyeOpennessNormalized.value = Math.min(1, Math.max(0, 1 + (deviation / 0.15)));

    const isOpen = deviation > this.OPEN_THRESHOLD;
    const isClosed = deviation < this.CLOSE_THRESHOLD;

    if (this.isDetecting) {
      // Logic: WAITING FOR OPEN
      if (this.status.value === "WAITING_FOR_OPEN") {
        if (isOpen) {
          if (this.stableSince === 0) this.stableSince = now;
          else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.status.value = "OPEN";
            this.stateStartTime = now;
            this.stableSince = 0;
            this.speak("Perfect."); 
          }
        } else {
          this.stableSince = 0;
        }
      }

      // Logic: COLLECTING OPEN DATA
      else if (this.status.value === "OPEN") {
        this.openSamples.push(rawEAR);
        if (now - this.stateStartTime > this.HOLD_DURATION) {
          this.isDetecting = false;
          this.switchState("CLOSED");
        }
      }

      // Logic: WAITING FOR CLOSED
      else if (this.status.value === "WAITING_FOR_CLOSED") {
        if (isClosed) {
          if (this.stableSince === 0) this.stableSince = now;
          else if (now - this.stableSince >= this.STABILITY_DURATION) {
            this.status.value = "CLOSED";
            this.stateStartTime = now;
            this.stableSince = 0;
            this.speak("Good.");
          }
        } else {
          this.stableSince = 0;
        }
      }

      // Logic: COLLECTING CLOSED DATA
      else if (this.status.value === "CLOSED") {
        this.closedSamples.push(rawEAR);
        if (now - this.stateStartTime > this.HOLD_DURATION) {
          this.isDetecting = false;
          this.currentCycle.value++;

          if (this.currentCycle.value >= this.options.cycles) {
            this.finish();
            return;
          } else {
            this.switchState("OPEN");
          }
        }
      }
    }

    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  private async moveToWaitingForClosed() {
    this.status.value = "WAITING_FOR_CLOSED";
    await this.speak("Please close your eyes.");
    this.isDetecting = true;
  }

  private async switchState(newState: "OPEN" | "CLOSED") {
    if (newState === "OPEN") {
      this.status.value = "WAITING_FOR_OPEN";
      await this.speak("Now, open your eyes.");
      this.isDetecting = true;
    } else {
      this.status.value = "WAITING_FOR_CLOSED";
      await this.speak("Now, close your eyes.");
      this.isDetecting = true;
    }
    if (!this.animationFrameId) this.loop();
  }

	private speak(text: string): Promise<void> {
		return new Promise(resolve => {
			window.speechSynthesis.cancel()
			this.isSpeaking = true

			const u = new SpeechSynthesisUtterance(text)
			u.rate = 1.0
			u.pitch = 1.0

			u.onend = () => {
				this.isSpeaking = false
				resolve()
			}

			u.onerror = () => {
				this.isSpeaking = false
				resolve()
			}

			window.speechSynthesis.speak(u)
		})
	}

	private async finish() {
		this.status.value = 'FINISHED'
		this.stop()

		// Calculate averages if we have samples
		const avgOpen =
			this.openSamples.length > 0
				? this.openSamples.reduce((a, b) => a + b, 0) / this.openSamples.length
				: 0.3 // Fallback
		const avgClosed =
			this.closedSamples.length > 0
				? this.closedSamples.reduce((a, b) => a + b, 0) / this.closedSamples.length
				: 0.05 // Fallback

		// Update global service with "calibrated" values
		faceMeshService.setEyeOpennessMin(avgClosed * 0.95)
		faceMeshService.setEyeOpennessMax(avgOpen * 1.05)
		faceMeshService.setNormalizedBlinkThreshold(0.3) // Safe relative threshold

		await this.speak('Exercise complete.')

		this.complete(true, {
			metrics: { open: avgOpen, closed: avgClosed },
			...faceMeshService.getCalibration()
		})
	}

	stop() {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId)
			this.animationFrameId = null
		}
		this.isDetecting = false
		this.isSpeaking = false
		window.speechSynthesis.cancel()
	}

	private lerp(start: number, end: number, amt: number) {
		return (1 - amt) * start + amt * end
	}

	get component() {
		return markRaw(FractionationView)
	}
}
