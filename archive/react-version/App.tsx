import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Theater } from './components/Theater';
import { Program } from './types';

type View = 'dashboard' | 'theater';

interface ActiveSession {
  program: Program;
  subjectId: string;
}

const App: React.FC = () => {
  const [view, setView] = useState<View>('dashboard');
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);

  const startSession = (program: Program, subjectId: string) => {
    setActiveSession({ program, subjectId });
    setView('theater');
  };

  const endSession = () => {
    setActiveSession(null);
    setView('dashboard');
  };

  return (
    <div className="w-full h-screen bg-black text-white overflow-hidden">
      {view === 'dashboard' && (
        <Dashboard onStartSession={startSession} />
      )}
      
      {view === 'theater' && activeSession && (
        <Theater 
          program={activeSession.program} 
          subjectId={activeSession.subjectId}
          onExit={endSession}
        />
      )}
    </div>
  );
};

export default App;