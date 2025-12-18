import type { Component } from "vue";

export interface InstructionContext {
  // Callbacks to report status to the engine
  complete(success: boolean, metrics?: any, result?: any): void;

  // Access to shared resources if needed (e.g. DOM container)
  container?: HTMLElement;
}

export interface InstructionOptions {
  id: string;
  prompt: string;
  duration?: number; // ms
  onCompleteCallback?: (success: boolean, result?: any) => string | undefined; // NEW
  positiveReinforcement?: {
    enabled?: boolean;
    message?: string;
  };
  negativeReinforcement?: {
    enabled?: boolean;
    message?: string;
  };
}

export abstract class Instruction<
  TOptions extends InstructionOptions = InstructionOptions
> {
  public options: TOptions;
  protected context: InstructionContext | null = null;

  constructor(options: TOptions) {
    this.options = {
      duration: 5000, // Default duration
      ...options,
      positiveReinforcement: {
        ...{ enabled: true, message: "REINFORCED" },
        ...(options.positiveReinforcement || {}),
      },
      negativeReinforcement: {
        ...{ enabled: true, message: "CORRECTION REQUIRED" },
        ...(options.negativeReinforcement || {}),
      },
    };
  }

  // Lifecycle: Called when instruction becomes active
  abstract start(context: InstructionContext): void;

  // Lifecycle: Called when instruction is stopped/swapped out
  abstract stop(): void;

  // Lifecycle: Called every frame (optional)
  // update(time: number, delta: number): void {}

  // Called by the engine after the instruction has completed
  // Can return an instruction ID to jump to, otherwise continues sequentially
  public onComplete(success: boolean, result?: any): string | undefined {
    if (this.options.onCompleteCallback) {
      return this.options.onCompleteCallback(success, result);
    }
    return undefined; // Continue sequentially
  }
}
