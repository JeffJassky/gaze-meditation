// Enums
export enum SessionState {
  IDLE = 'IDLE',
  INSTRUCTING = 'INSTRUCTING', // Prompt is visible, waiting for user to start
  VALIDATING = 'VALIDATING',   // User is performing task, system checking
  REINFORCING_POS = 'REINFORCING_POS', // Success state
  REINFORCING_NEG = 'REINFORCING_NEG', // Failure state
  FINISHED = 'FINISHED'
}

export enum InstructionType {
  GAZE = 'GAZE',
  SPEECH = 'SPEECH'
}

// Data Models
export interface Instruction {
  id: string;
  type: InstructionType;
  prompt: string;
  targetValue?: string; // For speech: the word to say. For gaze: unused (uses coordinates)
  duration: number; // How long they have to do it
  holdTime?: number; // For gaze: how long to hold focus
}

export interface Program {
  id: string;
  title: string;
  description: string;
  audioTrack: string; // Simulated audio track name
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

export interface User {
  id: string;
  name: string;
  totalScore: number;
  history: string[]; // Array of SessionLog IDs
}