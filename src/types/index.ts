// User Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  height: number; // cm
  weight: number; // kg
  age: number;
  sex: 'male' | 'female';
  mealState: 'fasted' | 'light' | 'heavy';
  profilePictureUri?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Drink Types
export interface DrinkType {
  id: string;
  name: string;
  icon: string;
  defaultVolume: number; // mL
  defaultABV: number; // 0-1
  color: string;
}

export interface LoggedDrink {
  id: string;
  type: DrinkType;
  time: number; // hours since session start
  volume: number; // mL
  ABV: number; // 0-1
  timestamp: Date;
}

// BAC Types
export interface BACReading {
  time: number; // hours
  bac: number; // g/dL
}

// Session Types
export interface DrinkingSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  drinks: LoggedDrink[];
  maxBAC: number;
  notes: string;
  feeling?: 'great' | 'good' | 'okay' | 'bad';
  bacHistory?: BACReading[]; // Store BAC readings over time for chart display
}

// Friend Types
export interface Friend {
  id: string;
  name: string;
  email?: string;
  phoneNumber?: string;
  currentBAC: number;
  lastUpdate: Date;
  status: 'drinking' | 'sober' | 'offline';
}

// Group Types
export interface Group {
  id: string;
  groupCode: string; // Short code for manual entry (e.g., "ABC123")
  name: string;
  creatorId: string;
  members: string[]; // user IDs
  createdAt: Date;
  qrCode?: string;
}

// Alert Types
export interface BACAlert {
  type: 'warning' | 'danger' | 'limit';
  message: string;
  bac: number;
  timestamp: Date;
}

