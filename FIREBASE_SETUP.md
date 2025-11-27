# Firebase Setup Instructions

To enable authentication and database functionality, you need to set up Firebase:

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "safesip-app")
4. Follow the setup wizard

## Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Click **Sign-in method** tab
3. Enable **Email/Password** provider
4. Click **Save**

## Step 3: Create Firestore Database

1. In Firebase Console, go to **Firestore Database** > **Create database**
2. Start in **test mode** (for development)
3. Choose your region
4. Click **Enable**

## Step 4: Get Your Firebase Config

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to **Your apps** section
3. Click the **Web** icon (`</>`) to add a web app
4. Register app with a nickname (e.g., "safesip-web")
5. Copy the `firebaseConfig` object

## Step 5: Update Firebase Config in App

1. Open `/src/config/firebase.ts`
2. Replace the placeholder values with your Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Step 6: Set Up Firestore Security Rules (Optional - for production)

For development, test mode is fine. For production, update Firestore rules:

1. Go to **Firestore Database** > **Rules**
2. Update rules to:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions belong to users
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Admin Access to User Data

To view user data as an admin:

1. Go to **Firestore Database** in Firebase Console
2. Click on the `users` collection
3. You'll see all registered users with:
   - Email
   - Phone number
   - Name
   - Height, weight, age
   - Sex, meal state
   - Created/updated timestamps

## Testing

1. Start the app: `npm start`
2. Register a new account (onboarding flow)
3. Check Firebase Console to see the new user in Firestore
4. Login with the credentials you created

## Troubleshooting

- **"Firebase: Error (auth/network-request-failed)"**: Check your internet connection
- **"Firebase: Error (auth/invalid-email)"**: Ensure email format is correct
- **"Firebase: Error (auth/weak-password)"**: Password must be at least 6 characters
- **Database permission errors**: Check Firestore security rules

