import React, { useState, useEffect } from 'react';
import { User, Program, SessionLog, InstructionType } from '../types';
import { getUsers, getSessions, seedDatabase, saveUser } from '../services/storageService';

// Mock Programs
const PROGRAMS: Program[] = [
  {
    id: 'prog_focus_alpha',
    title: 'Alpha Focus Protocol',
    description: 'Basic gaze fixation training to improve attention span.',
    audioTrack: 'theta_binaural_40hz.mp3',
    instructions: [
      { id: 'i1', type: InstructionType.GAZE, prompt: 'Fixate on the Blue Orb', duration: 5000, holdTime: 2000 },
      { id: 'i2', type: InstructionType.GAZE, prompt: 'Follow the light', duration: 4000, holdTime: 1500 },
      { id: 'i3', type: InstructionType.GAZE, prompt: 'Hold Steady', duration: 5000, holdTime: 3000 },
    ]
  },
  {
    id: 'prog_verbal_recall',
    title: 'Verbal Recall Beta',
    description: 'Rapid fire word association and repetition.',
    audioTrack: 'white_noise_low.mp3',
    instructions: [
      { id: 'v1', type: InstructionType.SPEECH, prompt: 'Say "START"', targetValue: 'START', duration: 4000 },
      { id: 'v2', type: InstructionType.SPEECH, prompt: 'Say "FOCUS"', targetValue: 'FOCUS', duration: 3000 },
      { id: 'v3', type: InstructionType.GAZE, prompt: 'Look at the center', duration: 3000, holdTime: 1000 },
      { id: 'v4', type: InstructionType.SPEECH, prompt: 'Say "DONE"', targetValue: 'DONE', duration: 3000 },
    ]
  }
];

interface DashboardProps {
  onStartSession: (program: Program, subjectId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onStartSession }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'start' | 'history' | 'users'>('start');
  const [newUserName, setNewUserName] = useState('');

  useEffect(() => {
    seedDatabase();
    refreshData();
  }, []);

  const refreshData = () => {
    setUsers(getUsers());
    setSessions(getSessions().reverse()); // Newest first
  };

  const handleCreateUser = () => {
    if (!newUserName) return;
    const newUser: User = {
        id: `SUB_${Math.floor(Math.random() * 1000)}`,
        name: newUserName,
        totalScore: 0,
        history: []
    };
    saveUser(newUser);
    setNewUserName('');
    refreshData();
    setActiveTab('start');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-cyan-900 selection:text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-6 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-white mb-1">NCRS</h1>
          <p className="text-xs text-zinc-500 uppercase tracking-widest">Research Suite v2.1</p>
        </div>

        <nav className="flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('start')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'start' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`}
          >
            Start Session
          </button>
          <button 
             onClick={() => setActiveTab('history')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`}
          >
            Data Logs
          </button>
          <button 
             onClick={() => setActiveTab('users')}
            className={`text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-zinc-800 text-cyan-400' : 'hover:bg-zinc-800/50 text-zinc-400'}`}
          >
            Subjects
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-y-auto">
        
        {activeTab === 'start' && (
          <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
              <h2 className="text-3xl font-light text-white mb-2">Configure Session</h2>
              <p className="text-zinc-500">Select a subject and a conditioning protocol to begin.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Subject Select */}
              <div className="space-y-4">
                <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Select Subject</label>
                <select 
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none appearance-none"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">-- Choose Subject --</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name} (Score: {u.totalScore})</option>
                  ))}
                </select>
                {users.length === 0 && <p className="text-sm text-red-400">No subjects found. Create one in 'Subjects' tab.</p>}
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Available Protocols</label>
               <div className="grid grid-cols-1 gap-4">
                 {PROGRAMS.map(prog => (
                   <div key={prog.id} className="group relative bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-600 transition-all">
                     <div className="flex justify-between items-start">
                       <div>
                         <h3 className="text-xl font-bold text-zinc-100 group-hover:text-cyan-400 transition-colors">{prog.title}</h3>
                         <p className="text-sm text-zinc-400 mt-2">{prog.description}</p>
                         <div className="flex gap-2 mt-4">
                           <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">{prog.instructions.length} steps</span>
                           <span className="text-xs bg-zinc-800 px-2 py-1 rounded text-zinc-500">Audio: {prog.audioTrack}</span>
                         </div>
                       </div>
                       <button 
                        disabled={!selectedUser}
                        onClick={() => onStartSession(prog, selectedUser)}
                        className="bg-cyan-900 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-cyan-100 px-6 py-3 rounded-lg font-bold text-sm tracking-wide transition-all"
                       >
                         INITIALIZE
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
             <h2 className="text-3xl font-light text-white mb-6">Session Logs</h2>
             <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-zinc-800/50 text-zinc-400 uppercase text-xs font-medium">
                   <tr>
                     <th className="px-6 py-4">Session ID</th>
                     <th className="px-6 py-4">Subject</th>
                     <th className="px-6 py-4">Date</th>
                     <th className="px-6 py-4 text-right">Score</th>
                     <th className="px-6 py-4 text-right">Accuracy</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-800">
                   {sessions.map(s => {
                       const subjectName = users.find(u => u.id === s.subjectId)?.name || s.subjectId;
                       const accuracy = Math.round((s.metrics.filter(m => m.success).length / s.metrics.length) * 100) || 0;
                       return (
                        <tr key={s.id} className="hover:bg-zinc-800/30">
                            <td className="px-6 py-4 font-mono text-zinc-500">{s.id}</td>
                            <td className="px-6 py-4 text-white font-medium">{subjectName}</td>
                            <td className="px-6 py-4 text-zinc-400">{new Date(s.startTime).toLocaleString()}</td>
                            <td className="px-6 py-4 text-right font-mono text-cyan-400">{s.totalScore}</td>
                            <td className="px-6 py-4 text-right text-zinc-400">{accuracy}%</td>
                        </tr>
                       );
                   })}
                 </tbody>
               </table>
               {sessions.length === 0 && <div className="p-8 text-center text-zinc-500">No session data available.</div>}
             </div>
          </div>
        )}

        {activeTab === 'users' && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-3xl font-light text-white mb-6">Subject Management</h2>
                 
                 <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="text-xs uppercase font-bold text-zinc-500 tracking-wider block mb-2">New Subject Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-cyan-500 outline-none"
                            placeholder="e.g. John Doe"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleCreateUser}
                        className="bg-zinc-100 text-black font-bold px-6 py-3 rounded-lg hover:bg-cyan-400 transition-colors"
                    >
                        Create Subject
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {users.map(u => (
                         <div key={u.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between">
                             <div>
                                <h3 className="text-lg font-bold text-white">{u.name}</h3>
                                <p className="text-xs text-zinc-500 font-mono mt-1">{u.id}</p>
                             </div>
                             <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-end">
                                 <div>
                                     <div className="text-xs text-zinc-500 uppercase">Total Score</div>
                                     <div className="text-2xl font-mono text-cyan-400">{u.totalScore}</div>
                                 </div>
                                 <div className="text-xs text-zinc-400">{u.history.length} Sessions</div>
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        )}

      </main>
    </div>
  );
};