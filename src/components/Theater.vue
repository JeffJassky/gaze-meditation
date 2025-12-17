<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { SessionState, InstructionType, type Program, type Instruction, type SessionLog, type SessionMetric } from '../types';
import Visuals from './Visuals.vue'; // Correct import for Vue component
import HUD from './HUD.vue'; // Correct import for Vue component
import { saveSession } from '../services/storageService';

// --- Speech Recognition Types ---
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
}

// Extend Window to include webkitSpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

interface TheaterProps {
  program: Program;
  subjectId: string;
}

const props = defineProps<TheaterProps>();
const emit = defineEmits<{
  (e: 'exit'): void;
}>();

// Helper to generate a random position within safe bounds (percentage)
const getRandomPosition = () => ({
    top: `${20 + Math.random() * 60}%`,
    left: `${20 + Math.random() * 60}%`
});

const state = ref<SessionState>(SessionState.IDLE);
const instrIndex = ref(0);
const score = ref(0);
const targetPos = ref(getRandomPosition());

// Refs for logic loop (mutable values)
const timerRef = ref<number | null>(null);
const startTimeRef = ref<number>(Date.now());
const metricsRef = ref<SessionMetric[]>([]);
const gazeHoldRef = ref<number>(0);

// Speech Recognition Ref
const recognition = ref<SpeechRecognition | null>(null);
const isListening = ref(false);

const nextInstruction = (index: number) => {
  if (index >= props.program.instructions.length) {
      finishSession();
      return;
  }

  instrIndex.value = index;
  state.value = SessionState.INSTRUCTING;
  targetPos.value = getRandomPosition();
  gazeHoldRef.value = 0;

  // Instruction phase duration (read the prompt)
  if (timerRef.value) clearTimeout(timerRef.value);
  
  const currentInstruction = props.program.instructions[index];
  const delay = currentInstruction.type === InstructionType.SPEECH ? 0 : 2000;

  timerRef.value = window.setTimeout(() => {
      state.value = SessionState.VALIDATING;
      startValidation(currentInstruction);
  }, delay);
};

const startValidation = (instruction: Instruction) => {
    const startValidationTime = Date.now();

    // Start Speech Recognition if needed
    if (instruction.type === InstructionType.SPEECH && recognition.value) {
      try {
        recognition.value.start();
        isListening.value = true;
      } catch (e) {
        // Recognition might already be started
        console.warn("Speech recognition start failed (maybe already active)", e);
      }
    }

    // Timeout failure condition: Trigger negative reinforcement and retry
    if (timerRef.value) clearTimeout(timerRef.value);
    timerRef.value = window.setTimeout(() => {
        triggerReinforcement(false, instruction, startValidationTime);
    }, instruction.duration);
};

const triggerReinforcement = (success: boolean, instruction: Instruction, startTime: number) => {
    if (timerRef.value) clearTimeout(timerRef.value);
    
    // Stop recognition if it was running
    if (isListening.value && recognition.value) {
      recognition.value.stop();
      isListening.value = false;
    }

    const reactionTime = Date.now() - startTime;
    
    // Record Metric
    metricsRef.value.push({
        instructionId: instruction.id,
        success,
        timestamp: Date.now(),
        reactionTime
    });

    if (success) {
        // Calculate Bonus based on speed
        // Multiplier = (Duration - ReactionTime) / Duration
        // If ReactionTime is near 0 (fast), Multiplier is near 1.
        // If ReactionTime is near Duration (slow), Multiplier is near 0.
        const duration = instruction.duration || 5000; // Default safety
        const remainingRatio = Math.max(0, (duration - reactionTime) / duration);
        const points = Math.round(100 * remainingRatio);
        
        score.value += points;
        state.value = SessionState.REINFORCING_POS;
        // Play positive sound (mock)
    } else {
        score.value = Math.max(0, score.value - 50);
        state.value = SessionState.REINFORCING_NEG;
        // Play negative sound (mock)
    }

    // Time in reinforcement state
    setTimeout(() => {
        if (success) {
            // Advance to next instruction
            nextInstruction(instrIndex.value + 1);
        } else {
            // Repeat current instruction (Game loop style)
            nextInstruction(instrIndex.value);
        }
    }, 2000);
};

const finishSession = () => {
    state.value = SessionState.FINISHED;
    const log: SessionLog = {
        id: `SES_${Date.now()}`,
        subjectId: props.subjectId,
        programId: props.program.id,
        startTime: new Date(startTimeRef.value).toISOString(),
        endTime: new Date().toISOString(),
        totalScore: score.value,
        metrics: metricsRef.value
    };
    saveSession(log);
    setTimeout(() => emit('exit'), 3000);
};

// --- MOCK SENSORS & REAL SENSORS ---

// Gaze Tracking (Mouse)
const handleMouseEnterTarget = () => {
    if (state.value !== SessionState.VALIDATING) return;
    const currentInstr = props.program.instructions[instrIndex.value];
    if (currentInstr.type !== InstructionType.GAZE) return;

    // Simulate Gaze Hold
    const checkHold = () => {
        gazeHoldRef.value += 100;
        if (gazeHoldRef.value >= (currentInstr.holdTime || 1000)) {
            triggerReinforcement(true, currentInstr, Date.now() - 500); // approximate start time diff
        } else {
            // Only continue if still in VALIDATING state and component is mounted
            if (state.value === SessionState.VALIDATING) requestAnimationFrame(checkHold);
        }
    };
    requestAnimationFrame(checkHold); // Start the simulation loop
};

const handleMouseLeaveTarget = () => {
    gazeHoldRef.value = 0;
};

// Voice Logic handled by SpeechRecognition, simulation button removed.

const currentInstr = ref<Instruction | undefined>();
watch(instrIndex, (newIndex) => {
    currentInstr.value = props.program.instructions[newIndex];
}, { immediate: true });


// Initialize Session on mount
onMounted(() => {
  // Setup Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition.value = new SpeechRecognition();
    recognition.value.continuous = true; // Keep listening even if user pauses
    recognition.value.interimResults = true; // Get results as they speak
    recognition.value.lang = 'en-US';

    recognition.value.onresult = (event: SpeechRecognitionEvent) => {
      if (state.value !== SessionState.VALIDATING || !currentInstr.value || currentInstr.value.type !== InstructionType.SPEECH) return;

      // Check results
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const result = event.results[i];
        
        // Optimize latency: Check all alternatives, ignore confidence if text matches
        for (let j = 0; j < result.length; ++j) {
           const transcript = result[j].transcript.trim().toUpperCase();
           const target = currentInstr.value.targetValue?.toUpperCase() || '';
           
           if (transcript.includes(target)) {
             // Success! Trigger immediately
             triggerReinforcement(true, currentInstr.value, Date.now() - 500);
             return; 
           }
        }
      }
    };

    recognition.value.onend = () => {
      // Auto-restart if we should still be listening
      if (state.value === SessionState.VALIDATING && currentInstr.value?.type === InstructionType.SPEECH && !recognition.value) {
         isListening.value = false;
         // Note: Chrome might block auto-restart if no user interaction, but since we are in a session, it usually works.
         try {
             recognition.value?.start();
             isListening.value = true;
         } catch(e) { console.log("Restart recognition failed", e); }
      } else {
        isListening.value = false;
      }
    };

    recognition.value.onerror = (event: Event) => {
        console.error("Speech recognition error", event);
        // If error, we might want to fail the step or retry, currently we just let it timeout
    };
  } else {
    console.warn("Speech Recognition API not supported in this browser.");
  }


  // Force full screen attempt (browser blocks usually, but we try)
  try {
      document.documentElement.requestFullscreen().catch(e => console.log("Fullscreen blocked", e));
  } catch(e) {}

  // Start delay
  setTimeout(() => {
      nextInstruction(0);
  }, 2000);

  // Emergency Stop Key listener
  const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
          emit('exit');
      }
  };
  window.addEventListener('keydown', handleKeyDown);

  onUnmounted(() => {
    if (timerRef.value) clearTimeout(timerRef.value);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    window.removeEventListener('keydown', handleKeyDown);
    if (recognition.value) {
      recognition.value.stop();
      recognition.value = null;
    }
  });
});

</script>

<template>
  <div class="relative w-full h-full bg-black overflow-hidden cursor-crosshair">
    <!-- 3D Background -->
    <Visuals :state="state" />

    <!-- Target Element for Gaze Tasks -->
    <div v-if="state === SessionState.VALIDATING && currentInstr?.type === InstructionType.GAZE" 
      class="absolute w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-full blur-sm opacity-80 animate-pulse hover:scale-110 transition-transform duration-75"
      :style="{ top: targetPos.top, left: targetPos.left }"
      @mouseenter="handleMouseEnterTarget"
      @mouseleave="handleMouseLeaveTarget"
    >
        <div class="absolute inset-0 bg-white opacity-20 rounded-full animate-ping" />
    </div>

    <!-- Voice Feedback Indicator (Replaces Button) -->
    <div v-if="state === SessionState.VALIDATING && currentInstr?.type === InstructionType.SPEECH"
      class="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4"
    >
      <div class="flex items-center gap-2 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-700">
         <div class="w-3 h-3 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_red]" />
         <span class="text-xs font-bold text-zinc-300 uppercase tracking-widest">Listening...</span>
      </div>
      <div class="text-white font-mono text-sm opacity-50">
          Say: "{{ currentInstr.targetValue }}"
      </div>
    </div>

    <!-- Timer Wipe -->
    <div v-if="state === SessionState.VALIDATING && currentInstr?.duration" 
         class="absolute inset-0 -z-5 pointer-events-none"
    >
        <div class="h-full bg-cyan-600/50 mix-blend-screen shadow-[0_0_50px_rgba(8,145,178,0.5)] w-0" 
             :style="{ 
                 animation: `wipe ${currentInstr.duration}ms linear forwards`
             }"
        ></div>
    </div>

    <!-- Heads Up Display -->
    <HUD 
      :state="state" 
      :currentInstruction="currentInstr" 
      :score="score" 
      @exit="emit('exit')"
    />
  </div>
</template>

<style scoped>
/* Any specific styles for Theater if needed */
</style>

<style>
@keyframes wipe {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>
