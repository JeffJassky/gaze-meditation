import type { Component } from 'vue';

export interface InstructionContext {
  // Callbacks to report status to the engine
  complete(success: boolean, metrics?: any): void;
  
  // Access to shared resources if needed (e.g. DOM container)
  container?: HTMLElement;
}

export interface InstructionOptions {
  id: string;
  prompt: string;
  duration?: number; // ms
}

export abstract class Instruction<TOptions extends InstructionOptions = InstructionOptions> {
  public options: TOptions;

  constructor(options: TOptions) {
    this.options = { 
      duration: 5000, // Default duration
      ...options 
    };
  }

  // Lifecycle: Called when instruction becomes active
  abstract start(context: InstructionContext): void;

  // Lifecycle: Called when instruction is stopped/swapped out
  abstract stop(): void;

  // Lifecycle: Called every frame (optional)
  // update(time: number, delta: number): void {}

  // The Vue Component to render for this instruction
  abstract get component(): Component;
  
  // Helper to get ID
  get id() { return this.options.id; }
}
