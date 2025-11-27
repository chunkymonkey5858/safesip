# SafeSip 🍺

A social accountability app for responsible drinking with real-time Blood Alcohol Content (BAC) tracking. SafeSip helps you and your friends drink responsibly by tracking your BAC in real-time, providing alerts, and fostering group accountability.

![SafeSip Logo](assets/icon.png)

## Features

### 🎯 Core Features

- **Real-time BAC Tracking**: Advanced pharmacokinetic model calculates your BAC based on drinks consumed, meal state, and body metrics
- **Drink Logging**: Quick logging of beer, wine, shots, and cocktails with accurate volume and ABV tracking
- **Session Management**: Start and end drinking sessions with detailed reflections and notes
- **Visual BAC Graph**: Real-time chart showing current BAC and predicted future levels with danger zones

### 👥 Social Features

- **Friends System**: Add friends and view their real-time BAC status with color-coded indicators
- **Group Management**: Create or join groups with QR codes and group IDs
- **Accountability**: See friends' BAC levels and send messages to check in
- **Session Sharing**: View friends' past drinking sessions (with their permission)

### 📊 History & Reflection

- **Session History**: View detailed history of all your past drinking sessions
- **Personal Reflections**: Add notes and feelings after each session
- **BAC Charts**: Each session shows its unique BAC curve over time
- **Date Filtering**: Filter sessions by date for easy review

### ⚙️ User Management

- **Onboarding**: Comprehensive profile setup (height, weight, age, sex, meal state)
- **Authentication**: Secure login/logout with Firebase
- **Profile Pictures**: Upload and manage your profile picture
- **Settings**: Manage your account and preferences

## Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: React Navigation (Stack & Bottom Tabs)
- **State Management**: React Context API
- **Backend**: Firebase (Authentication & Firestore)
- **Local Storage**: AsyncStorage
- **Charts**: React Native Chart Kit
- **QR Codes**: React Native QR Code SVG

## Installation

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android)

### Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd mobile-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase**
   - Follow the instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Configure Firebase credentials in `src/config/firebase.ts`
   - Enable Email/Password authentication in Firebase Console
   - Set up Firestore database

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on your device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile-app/
├── src/
│   ├── components/          # Reusable components
│   ├── config/              # Configuration files (Firebase, etc.)
│   ├── contexts/            # React Context providers
│   │   ├── AppContext.tsx   # Global app state
│   │   └── AuthContext.tsx  # Authentication state
│   ├── models/              # Data models
│   │   └── BACCalculator.ts # Pharmacokinetic BAC model
│   ├── navigation/          # Navigation configuration
│   ├── screens/             # Screen components
│   │   ├── LoginScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── FriendsScreen.tsx
│   │   ├── LogDrinkScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   ├── SettingsScreen.tsx
│   │   └── ...
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── assets/                  # Images and icons
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
└── package.json
```

## BAC Calculation Model

SafeSip uses a sophisticated pharmacokinetic model based on the Widmark formula:

- **First-order absorption**: Alcohol is absorbed from the gut into the bloodstream
- **Zero-order elimination**: Constant rate elimination based on weight and sex
- **Meal state factors**: Absorption rate varies with meal state (fasted/light/heavy)
- **Real-time updates**: BAC recalculates every 5 seconds during active sessions

See [DRINK_REGISTRATION.md](./DRINK_REGISTRATION.md) for details on drink volumes and ABV.

## Key Screens

### 🏠 Log Drink Screen
- Log different drink types (beer, wine, shot, cocktail)
- View real-time BAC graph
- See current BAC status and danger zones
- End session and add reflection

### 👥 Friends Screen
- View friends' real-time BAC status
- Color-coded BAC indicators
- Send messages to friends
- Create or join groups

### 📊 History Screen
- View all past drinking sessions
- Filter by date
- Toggle between your sessions and friends' sessions
- Each session shows unique BAC curve

### ⚙️ Settings Screen
- View and edit profile
- Upload profile picture
- Logout

## Configuration

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Add your Firebase config to `src/config/firebase.ts`

See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) for detailed instructions.

### Environment Variables

For production, use environment variables for sensitive Firebase keys. Create a `.env` file:

```
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## Development

### Running the App

```bash
# Start Expo dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web
```

### Building

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

## Safety Features

- **BAC Thresholds**: Clear indicators for impairment levels
- **Alerts**: Visual warnings at different BAC levels
- **Danger Zones**: Graph shows life-threatening levels (>0.30%)
- **Reflection Prompts**: Encourages users to reflect after sessions

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

MIT License - see [LICENSE](./LICENSE) file for details

## Important Notes

⚠️ **Before using this repository:**
- The Firebase config file (`src/config/firebase.ts`) should NOT contain real API keys when committing to a public repository
- Copy `src/config/firebase.ts.template` to `src/config/firebase.ts` and add your own Firebase credentials
- See [PRE_PUSH_CHECKLIST.md](./PRE_PUSH_CHECKLIST.md) before pushing to GitHub

## Acknowledgments

- BAC calculation model based on Widmark formula
- Built with React Native and Expo
- UI inspired by modern mobile app design principles

## Support

For issues or questions, please open an issue in the repository.

---

**Remember**: SafeSip is a tool to help with responsible drinking. Always drink responsibly and never drink and drive.

