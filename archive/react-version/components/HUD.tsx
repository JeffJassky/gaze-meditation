import React from 'react';
import { SessionState, Instruction } from '../types';

interface HUDProps {
  state: SessionState;
  currentInstruction?: Instruction;
  score: number;
  message?: string;
  onExit: () => void;
}

const HUD: React.FC<HUDProps> = ({ state, currentInstruction, score, message, onExit }) => {
  
  // State-based color logic
  const getBorderColor = () => {
    switch (state) {
      case SessionState.REINFORCING_POS: return 'border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.5)]';
      case SessionState.REINFORCING_NEG: return 'border-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)]';
      case SessionState.VALIDATING: return 'border-blue-400';
      default: return 'border-zinc-800';
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none p-8 flex flex-col justify-between transition-all duration-300 border-[12px] ${getBorderColor()}`}>
      
      {/* Top Bar: Metrics & System Status */}
      <div className="flex justify-between items-start">
        <div className="bg-black/80 backdrop-blur-md px-6 py-3 rounded-br-2xl border-l-4 border-zinc-500">
          <h2 className="text-zinc-400 text-xs uppercase tracking-widest font-bold mb-1">Neural Score</h2>
          <span className="text-4xl font-mono text-white tracking-tighter">{score.toString().padStart(6, '0')}</span>
        </div>

        <div className="flex flex-col items-end gap-2 pointer-events-auto">
             <button 
                onClick={onExit}
                className="bg-red-900/80 hover:bg-red-700 text-red-200 px-4 py-1 text-xs uppercase tracking-widest rounded border border-red-500 transition-colors"
            >
                Emergency Stop (ESC)
            </button>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${state === SessionState.IDLE ? 'bg-zinc-600' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-xs text-zinc-500 font-mono uppercase">System Active</span>
            </div>
        </div>
      </div>

      {/* Center: Dynamic Instructions */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center w-full max-w-4xl">
         {state === SessionState.INSTRUCTING || state === SessionState.VALIDATING ? (
             <div className="animate-in fade-in zoom-in duration-300">
                 <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-xl">{currentInstruction?.prompt}</h1>
                 {state === SessionState.VALIDATING && (
                     <div className="inline-block mt-4 px-4 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm border border-blue-500/50 animate-pulse">
                        Awaiting Input...
                     </div>
                 )}
             </div>
         ) : null}

         {state === SessionState.REINFORCING_POS && (
             <h1 className="text-6xl font-black text-yellow-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.8)] animate-bounce">
                 REINFORCED
             </h1>
         )}

        {state === SessionState.REINFORCING_NEG && (
             <h1 className="text-6xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(220,38,38,0.8)] glitch-text">
                 CORRECTION REQUIRED
             </h1>
         )}
         
         {state === SessionState.FINISHED && (
             <h1 className="text-5xl font-bold text-white">Session Complete</h1>
         )}
      </div>

      {/* Bottom Bar: Debug/Technical Info */}
      <div className="flex justify-between items-end text-zinc-600 font-mono text-xs">
         <div>
            ID: {currentInstruction?.id || '--'} <br/>
            MODE: {currentInstruction?.type || '--'}
         </div>
         <div className="text-right">
            NCRS v2.1.0 <br/>
            LATENCY: 12ms
         </div>
      </div>
    </div>
  );
};

export default HUD;