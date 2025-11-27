# Quick Setup Guide

Follow these steps to get SafeSip up and running:

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Firebase

1. Copy the Firebase template file:
   ```bash
   cp src/config/firebase.ts.template src/config/firebase.ts
   ```

2. Set up your Firebase project:
   - Follow the detailed instructions in [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
   - Get your Firebase config credentials from Firebase Console

3. Update `src/config/firebase.ts` with your Firebase credentials

## 3. Start the App

```bash
npm start
```

Then:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on your phone

## 4. Test the App

1. Create a new account through onboarding
2. Fill in your profile information
3. Start logging drinks and see your BAC update in real-time!

## Troubleshooting

### Firebase not working?
- Make sure you've copied `firebase.ts.template` to `firebase.ts`
- Verify your Firebase credentials are correct
- Check that Email/Password authentication is enabled in Firebase Console

### App won't start?
- Clear Expo cache: `npx expo start -c`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Build errors?
- Make sure you have the latest Node.js (v18+)
- Check that all dependencies are installed: `npm install`

