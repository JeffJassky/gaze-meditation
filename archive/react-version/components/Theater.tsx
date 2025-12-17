import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Program, SessionState, Instruction, InstructionType, SessionLog, SessionMetric } from '../types';
import { Visuals } from './Visuals';
import HUD from './HUD';
import { saveSession } from '../services/storageService';

interface TheaterProps {
  program: Program;
  subjectId: string;
  onExit: () => void;
}

// Helper to generate a random position within safe bounds (percentage)
const getRandomPosition = () => ({
    top: `${20 + Math.random() * 60}%`,
    left: `${20 + Math.random() * 60}%`
});

export const Theater: React.FC<TheaterProps> = ({ program, subjectId, onExit }) => {
  const [state, setState] = useState<SessionState>(SessionState.IDLE);
  const [instrIndex, setInstrIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [targetPos, setTargetPos] = useState(getRandomPosition());
  
  // Refs for logic loop
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const metricsRef = useRef<SessionMetric[]>([]);
  const gazeHoldRef = useRef<number>(0);
  const lastFrameTime = useRef<number>(0);

  // Audio Ref (Simulated for this demo, usually an <audio> element)
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Session
  useEffect(() => {
    // Force full screen attempt (browser blocks usually, but we try)
    try {
        document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen blocked", e));
    } catch(e) {}

    // Start delay
    setTimeout(() => {
        nextInstruction(0);
    }, 2000);

    return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Emergency Stop Key listener
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === 'Escape') {
              onExit();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit]);

  const nextInstruction = (index: number) => {
      if (index >= program.instructions.length) {
          finishSession();
          return;
      }

      setInstrIndex(index);
      setState(SessionState.INSTRUCTING);
      setTargetPos(getRandomPosition());
      gazeHoldRef.current = 0;

      // Instruction phase duration (read the prompt)
      timerRef.current = window.setTimeout(() => {
          setState(SessionState.VALIDATING);
          startValidation(program.instructions[index]);
      }, 2000);
  };

  const startValidation = (instruction: Instruction) => {
      const startValidationTime = Date.now();

      // Timeout failure condition
      timerRef.current = window.setTimeout(() => {
          triggerReinforcement(false, instruction, startValidationTime);
      }, instruction.duration);
  };

  const triggerReinforcement = (success: boolean, instruction: Instruction, startTime: number) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      
      const reactionTime = Date.now() - startTime;
      
      // Record Metric
      metricsRef.current.push({
          instructionId: instruction.id,
          success,
          timestamp: Date.now(),
          reactionTime
      });

      if (success) {
          setScore(prev => prev + 100);
          setState(SessionState.REINFORCING_POS);
          // Play positive sound (mock)
      } else {
          setScore(prev => Math.max(0, prev - 50));
          setState(SessionState.REINFORCING_NEG);
          // Play negative sound (mock)
      }

      // Time in reinforcement state
      setTimeout(() => {
          nextInstruction(instrIndex + 1);
      }, 2000);
  };

  const finishSession = () => {
      setState(SessionState.FINISHED);
      const log: SessionLog = {
          id: `SES_${Date.now()}`,
          subjectId,
          programId: program.id,
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date().toISOString(),
          totalScore: score,
          metrics: metricsRef.current
      };
      saveSession(log);
      setTimeout(onExit, 3000);
  };

  // --- MOCK SENSORS ---

  // Gaze Tracking (Mouse)
  const handleMouseEnterTarget = () => {
      if (state !== SessionState.VALIDATING) return;
      const currentInstr = program.instructions[instrIndex];
      if (currentInstr.type !== InstructionType.GAZE) return;

      // Simulate Gaze Hold
      const checkHold = () => {
          gazeHoldRef.current += 100;
          if (gazeHoldRef.current >= (currentInstr.holdTime || 1000)) {
              triggerReinforcement(true, currentInstr, Date.now() - 500); // approximate start time diff
          } else {
              if (state === SessionState.VALIDATING) requestAnimationFrame(checkHold);
          }
      };
      checkHold();
  };

  const handleMouseLeaveTarget = () => {
      gazeHoldRef.current = 0;
  };

  // Voice Interaction (Simulated Button)
  const handleVoiceSim = () => {
      if (state !== SessionState.VALIDATING) return;
      const currentInstr = program.instructions[instrIndex];
      if (currentInstr.type === InstructionType.SPEECH) {
           triggerReinforcement(true, currentInstr, Date.now() - 500);
      }
  };

  const currentInstr = program.instructions[instrIndex];

  return (
    <div className="relative w-full h-full bg-black overflow-hidden cursor-crosshair">
      {/* 3D Background */}
      <Visuals state={state} />

      {/* Target Element for Gaze Tasks */}
      {state === SessionState.VALIDATING && currentInstr?.type === InstructionType.GAZE && (
          <div 
            className="absolute w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full blur-sm opacity-80 animate-pulse hover:scale-110 transition-transform duration-75"
            style={{ top: targetPos.top, left: targetPos.left }}
            onMouseEnter={handleMouseEnterTarget}
            onMouseLeave={handleMouseLeaveTarget}
          >
              <div className="absolute inset-0 bg-white opacity-20 rounded-full animate-ping" />
          </div>
      )}

      {/* Voice Sim Button (Hidden for realism, but needed for demo without mic) */}
      {state === SessionState.VALIDATING && currentInstr?.type === InstructionType.SPEECH && (
           <button 
             onClick={handleVoiceSim}
             className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-800 text-zinc-400 px-6 py-2 rounded-full border border-zinc-700 hover:bg-zinc-700 active:bg-green-800 transition-colors uppercase text-xs font-bold tracking-widest"
           >
             [Simulate Voice: "{currentInstr.targetValue}"]
           </button>
      )}

      {/* Heads Up Display */}
      <HUD 
        state={state} 
        currentInstruction={currentInstr} 
        score={score} 
        onExit={onExit}
      />
    </div>
  );
};