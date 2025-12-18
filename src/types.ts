import type { Instruction, InstructionOptions } from './core/Instruction';

// Enums
export enum SessionState {
  IDLE = 'IDLE',
  INSTRUCTING = 'INSTRUCTING', // Prompt is visible, waiting for user to start
  VALIDATING = 'VALIDATING',   // User is performing task, system checking
  REINFORCING_POS = 'REINFORCING_POS', // Success state
  REINFORCING_NEG = 'REINFORCING_NEG', // Failure state
  FINISHED = 'FINISHED'
}

export enum FormFieldType {
  TEXT = 'text',
  LONG_TEXT = 'longText',
  NUMBER = 'number',
  EMAIL = 'email',
  RADIO = 'radio',
  MULTISELECT = 'multiselect',
}

// Interfaces for Form Instruction
export interface FormField {
  label: string;
  type: FormFieldType;
  name: string; // The key for the field's value
  options?: string[]; // For radio and multiselect
  required?: boolean; // Optional: for validation
}

export interface FormInstructionOptions extends InstructionOptions {
  question: string;
  fields: FormField[];
  autoContinue?: boolean;
}

// Data Models
export interface Program {
  id: string;
  title: string;
  description: string;
  audioTrack: string; // Simulated audio track name
  videoBackground: string;
  instructions: Instruction[];
}

export interface SessionMetric {
  instructionId: string;
  success: boolean;
  timestamp: number;
  reactionTime: number;
}

export interface SessionLog {
  id: string;
  subjectId: string;
  programId: string;
  startTime: string; // ISO String
  endTime?: string;
  totalScore: number;
  metrics: SessionMetric[];
}

export interface UserCalibration {
  blinkThreshold?: number;
  gazeMinX?: number;
  gazeMaxX?: number;
  gazeMinY?: number;
  gazeMaxY?: number;
}

export interface User {
  id: string;
  name: string;
  totalScore: number;
  history: string[]; // Array of SessionLog IDs
  calibration?: UserCalibration;
}
