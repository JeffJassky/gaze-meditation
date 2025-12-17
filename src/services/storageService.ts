import type { User, SessionLog } from '../types';

const KEYS = {
  USERS: 'ncrs_users',
  SESSIONS: 'ncrs_sessions'
};

export const getUsers = (): User[] => {
  const data = localStorage.getItem(KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(KEYS.USERS, JSON.stringify(users));
};

export const getSessions = (): SessionLog[] => {
  const data = localStorage.getItem(KEYS.SESSIONS);
  return data ? JSON.parse(data) : [];
};

export const saveSession = (session: SessionLog): void => {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  
  // Update user score reference
  const users = getUsers();
  const user = users.find(u => u.id === session.subjectId);
  if (user) {
    user.totalScore += session.totalScore;
    user.history.push(session.id);
    saveUser(user);
  }
};

export const seedDatabase = (): void => {
  if (!localStorage.getItem(KEYS.USERS)) {
    const mockUsers: User[] = [
      { id: 'SUB_001', name: 'Subject Alpha', totalScore: 4500, history: [] },
      { id: 'SUB_002', name: 'Subject Beta', totalScore: 1200, history: [] },
    ];
    localStorage.setItem(KEYS.USERS, JSON.stringify(mockUsers));
  }
};