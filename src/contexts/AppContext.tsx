import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACSimulator } from '../models/BACCalculator';
import {
  UserProfile,
  LoggedDrink,
  DrinkingSession,
  Friend,
  Group,
  BACReading,
} from '../types';
import { DRINK_TYPES } from '../utils/drinkTypes';
import { useAuth } from './AuthContext';

interface AppContextType {
  // User
  user: UserProfile | null;

  // Current Session
  currentSession: DrinkingSession | null;
  bacSimulator: BACSimulator | null;
  currentBAC: number;
  bacHistory: BACReading[];
  startSession: () => void;
  endSession: (notes?: string, feeling?: 'great' | 'good' | 'okay' | 'bad') => Promise<void>;
  logDrink: (drinkTypeId: string) => void;

  // Friends & Groups
  friends: Friend[];
  groups: Group[];
  addFriend: (friend: Friend) => void;
  createGroup: (name: string) => Group;
  joinGroup: (groupId: string) => void;

  // History
  sessions: DrinkingSession[];
  updateSession: (sessionId: string, notes?: string, feeling?: 'great' | 'good' | 'okay' | 'bad') => Promise<void>;
  
  // Update BAC
  updateBAC: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [currentSession, setCurrentSession] = useState<DrinkingSession | null>(null);
  const [bacSimulator, setBacSimulator] = useState<BACSimulator | null>(null);
  const [currentBAC, setCurrentBAC] = useState(0);
  const [bacHistory, setBacHistory] = useState<BACReading[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [sessions, setSessions] = useState<DrinkingSession[]>([]);

  // Load sessions when user changes
  useEffect(() => {
    if (userProfile) {
      loadSessions();
    }
  }, [userProfile]);

  // Update BAC every 5 seconds during active session
  useEffect(() => {
    if (currentSession && bacSimulator) {
      const interval = setInterval(() => {
        updateBAC();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [currentSession, bacSimulator]);


  const loadSessions = async () => {
    try {
      const sessionsData = await AsyncStorage.getItem('sessions');
      if (sessionsData) {
        const parsed = JSON.parse(sessionsData);
        // Convert date strings back to Date objects
        const sessionsWithDates = parsed.map((s: any) => ({
          ...s,
          startTime: new Date(s.startTime),
          endTime: s.endTime ? new Date(s.endTime) : undefined,
          drinks: s.drinks?.map((d: any) => ({
            ...d,
            timestamp: new Date(d.timestamp),
          })) || [],
          bacHistory: s.bacHistory || [], // Load BAC history if available
        }));
        setSessions(sessionsWithDates);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const saveSessions = async (newSessions: DrinkingSession[]) => {
    try {
      // Convert to JSON-serializable format
      const serializable = newSessions.map(s => ({
        ...s,
        startTime: s.startTime.toISOString(),
        endTime: s.endTime?.toISOString(),
        drinks: s.drinks.map(d => ({
          ...d,
          timestamp: d.timestamp.toISOString(),
        })),
      }));
      const serializableWithHistory = serializable.map(s => ({
        ...s,
        bacHistory: s.bacHistory || [],
      }));
      await AsyncStorage.setItem('sessions', JSON.stringify(serializableWithHistory));
    } catch (error) {
      console.error('Error saving sessions:', error);
    }
  };

  const startSession = () => {
    if (!userProfile) return;

    const session: DrinkingSession = {
      id: Date.now().toString(),
      userId: userProfile.id,
      startTime: new Date(),
      drinks: [],
      maxBAC: 0,
      notes: '',
    };

    const simulator = new BACSimulator(
      {
        height: userProfile.height,
        weight: userProfile.weight,
        age: userProfile.age,
        sex: userProfile.sex,
      },
      userProfile.mealState
    );

    setCurrentSession(session);
    setBacSimulator(simulator);
    setBacHistory([{ time: 0, bac: 0 }]);
  };

  const endSession = async (notes?: string, feeling?: 'great' | 'good' | 'okay' | 'bad') => {
    if (!currentSession) return;

    // Calculate maxBAC from history
    const maxBAC = Math.max(...bacHistory.map(h => h.bac), currentBAC);

    const finalSession: DrinkingSession = {
      ...currentSession,
      endTime: new Date(),
      maxBAC: maxBAC,
      notes: notes || currentSession.notes || '',
      feeling: feeling || currentSession.feeling,
      bacHistory: [...bacHistory], // Save the BAC history for chart display
    };

    const newSessions = [finalSession, ...sessions];
    setSessions(newSessions);
    await saveSessions(newSessions);

    setCurrentSession(null);
    setBacSimulator(null);
    setCurrentBAC(0);
    setBacHistory([]);
  };

  const updateSession = async (sessionId: string, notes?: string, feeling?: 'great' | 'good' | 'okay' | 'bad') => {
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);
    if (sessionIndex === -1) return;

    const updatedSessions = [...sessions];
    updatedSessions[sessionIndex] = {
      ...updatedSessions[sessionIndex],
      notes: notes !== undefined ? notes : updatedSessions[sessionIndex].notes,
      feeling: feeling !== undefined ? feeling : updatedSessions[sessionIndex].feeling,
    };

    setSessions(updatedSessions);
    await saveSessions(updatedSessions);
  };

  const logDrink = (drinkTypeId: string) => {
    if (!currentSession || !bacSimulator || !userProfile) return;

    const drinkType = DRINK_TYPES.find((d) => d.id === drinkTypeId);
    if (!drinkType) return;

    const timeHours = (Date.now() - currentSession.startTime.getTime()) / (1000 * 60 * 60);

    // Log drink in simulator
    bacSimulator.logDrink(timeHours, drinkType.defaultVolume, drinkType.defaultABV);

    // Create logged drink
    const newDrink: LoggedDrink = {
      id: Date.now().toString(),
      type: drinkType,
      time: timeHours,
      volume: drinkType.defaultVolume,
      ABV: drinkType.defaultABV,
      timestamp: new Date(),
    };

    // Update session
    setCurrentSession({
      ...currentSession,
      drinks: [...currentSession.drinks, newDrink],
    });

    // Immediately update BAC
    updateBAC();
  };

  const updateBAC = () => {
    if (!bacSimulator) return;

    const newBAC = bacSimulator.step();
    setCurrentBAC(newBAC);

    // Add to history
    setBacHistory((prev) => [...prev, { time: bacSimulator.time, bac: newBAC }]);
  };

  const addFriend = (friend: Friend) => {
    setFriends((prev) => [...prev, friend]);
  };

  // Generate a short, user-friendly group code (6 characters, alphanumeric)
  const generateGroupCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars (0, O, I, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createGroup = (name: string): Group => {
    if (!userProfile) throw new Error('User not found');

    const group: Group = {
      id: Date.now().toString(),
      groupCode: generateGroupCode(),
      name,
      creatorId: userProfile.id,
      members: [userProfile.id],
      createdAt: new Date(),
    };

    setGroups((prev) => [...prev, group]);
    return group;
  };

  const joinGroup = (groupIdOrCode: string) => {
    if (!userProfile) throw new Error('User not found');
    
    // Find group by ID or groupCode
    const group = groups.find(
      (g) => g.id === groupIdOrCode || g.groupCode.toUpperCase() === groupIdOrCode.toUpperCase()
    );
    
    if (group) {
      // Add user to members if not already a member
      if (!group.members.includes(userProfile.id)) {
        setGroups((prev) =>
          prev.map((g) =>
            g.id === group.id
              ? { ...g, members: [...g.members, userProfile!.id] }
              : g
          )
        );
      }
    } else {
      throw new Error('Group not found. Please check the group ID or code.');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user: userProfile,
        currentSession,
        bacSimulator,
        currentBAC,
        bacHistory,
        startSession,
        endSession,
        logDrink,
        friends,
        groups,
        addFriend,
        createGroup,
        joinGroup,
        sessions,
        updateSession,
        updateBAC,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

