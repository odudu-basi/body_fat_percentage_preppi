# Preppi App

A React Native app built with Expo.

## Code Organization Guidelines

**All code should be properly organized into appropriate files.** The goal is to maintain files that are not too cumbersome to read, understand, and maintain.

### File Structure Principles

1. **Single Responsibility**: Each file should have one clear purpose. If a file is doing too many things, split it up.

2. **Maximum File Length**: Aim to keep files under 200-300 lines. If a file grows beyond this, consider breaking it into smaller modules.

3. **Folder Structure**:
   ```
   src/
   ├── components/       # Reusable UI components
   │   ├── common/       # Shared components (buttons, inputs, etc.)
   │   └── features/     # Feature-specific components
   ├── screens/          # Screen/page components
   ├── navigation/       # Navigation configuration
   ├── services/         # API calls and external services
   ├── hooks/            # Custom React hooks
   ├── utils/            # Helper functions and utilities
   ├── constants/        # App constants and configuration
   ├── types/            # TypeScript types/interfaces (if using TS)
   ├── context/          # React Context providers
   └── assets/           # Images, fonts, and other static assets
   ```

4. **Component Files**: Each component should be in its own file. Related styles can be in the same file or a separate `.styles.js` file.

5. **Naming Conventions**:
   - Components: PascalCase (e.g., `UserProfile.js`)
   - Utilities/Hooks: camelCase (e.g., `useAuth.js`, `formatDate.js`)
   - Constants: SCREAMING_SNAKE_CASE for values, camelCase for files

6. **Import Organization**: Group imports in this order:
   - React/React Native imports
   - Third-party libraries
   - Local components
   - Local utilities/hooks
   - Styles/Constants

### Best Practices

- Extract repeated logic into custom hooks
- Extract repeated UI patterns into reusable components
- Keep business logic separate from UI components
- Use index files to simplify imports from folders
- Comment complex logic, but write self-documenting code where possible

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Storage Architecture

BodyMaxx uses a **dual-storage system** that automatically switches between local and remote storage based on the environment.

### How It Works

The app detects whether it's running in **Expo Go** (development) or a **production build**:

```javascript
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = isExpoGo;
```

### Environment-Based Storage

#### Development Mode (Expo Go)
- **Storage**: AsyncStorage (local device storage)
- **User ID**: Uses mock 'dev-user' ID
- **Console Log**: `💾 Storage Mode: LOCAL (AsyncStorage)`
- **Benefits**:
  - No Supabase connection required
  - Fast offline development
  - Data persists between app restarts
  - No authentication needed during development

#### Production Mode (EAS Build / TestFlight / App Store)
- **Storage**: Supabase (cloud database)
- **User ID**: Real authenticated user IDs from Apple Sign In
- **Console Log**: `💾 Storage Mode: REMOTE (Supabase)`
- **Benefits**:
  - Cloud sync and backup
  - Multi-device support
  - User authentication
  - Production-ready data management

### Storage Abstraction Layer

**File**: `src/services/storage.js`

This file provides a unified API that automatically routes to the correct storage backend:

**Exported Functions**:
- `getUserProfile(userId)` / `upsertUserProfile(profileData)`
- `saveBodyScan(scanData)` / `getBodyScans(userId)` / `getLatestBodyScan(userId)`
- `saveMeal(mealData)` / `getMeals(date, userId)` / `deleteMeal(mealId)`
- `getChecklist(date, userId)` / `saveChecklist(checklistData)`
- `saveExercise(exerciseData)` / `getExercises(date, userId)` / `updateExercise(exerciseId, updates)` / `deleteExercise(exerciseId)`

### AsyncStorage Keys (Development)

When running in Expo Go, data is stored locally using these keys:

```javascript
@bodymax:user_profile          // User profile data
@bodymax:body_scans            // Body fat scan results
@bodymax:meal_logs             // Food/meal logs with nutrition data
@bodymax:daily_checklists      // Daily checklist items
@bodymax:exercise_logs         // Exercise logs and completion status
@bodymax:checklist_items       // Checklist item definitions (for local mode)
@bodymax:checklist_completions // Checklist completion records (for local mode)
```

### Supabase Tables (Production)

When running as a production build, data is stored in these Supabase tables:

```
profiles                  // User profiles
body_scans               // Body fat scan results
meal_logs                // Food/meal logs
daily_checklists         // Daily checklist data (unified)
exercise_logs            // Exercise logs
checklist_items          // Checklist item definitions
checklist_completions    // Checklist completion records
```

### Service Files

The following service files use the storage abstraction layer:

**Core Storage Services** (use abstraction layer):
- `src/services/bodyScanStorage.js` - Body fat scan operations
- `src/services/mealStorage.js` - Meal logging and nutrition tracking
- `src/services/checklistStorage.js` - Daily checklist management
- `src/services/exerciseStorage.js` - Exercise tracking

**Context** (uses storage layer):
- `src/context/AuthContext.js` - User profile management

**Direct Services** (bypass storage layer):
- `src/services/claude.js` - Claude API for body fat analysis
- `src/services/foodAnalysis.js` - Claude API for food analysis
- `src/services/buddyChat.js` - OpenAI API for fitness buddy chat

### Development Workflow

1. **Start Expo Go**: Run `npx expo start` and open in Expo Go app
2. **Storage Auto-Detects**: App automatically uses AsyncStorage
3. **No Auth Required**: Bypass authentication (see AuthContext DEV_MODE_BYPASS_AUTH)
4. **Data Persists**: All data saved locally on device
5. **Clear Data**: Use `clearAllLocalStorage()` from storage.js to reset

### Important Notes

⚠️ **Data Separation**: Local development data and production data are completely separate. Data created in Expo Go will not appear in production builds.

⚠️ **Mock User**: Development mode uses a mock user ID ('dev-user') and profile. Real authentication only works in production builds.

⚠️ **Testing Production Storage**: To test Supabase integration, you must create a production build (EAS Build) - it won't work in Expo Go.

⚠️ **Data Structure**: Both storage backends maintain identical data structures, ensuring seamless transition from development to production.

### Utility Functions

**Clear all local storage** (development only):
```javascript
import { clearAllLocalStorage } from './src/services/storage';
await clearAllLocalStorage();
```

**Check storage mode**:
```javascript
import { getStorageMode } from './src/services/storage';
console.log(getStorageMode()); // Returns 'local' or 'remote'
```

## Subscriptions & Paywall
Superwall:
  https://superwall.com/docs/expo/quickstart/install\
  https://superwall.com/docs/expo/quickstart/configure\
  https://superwall.com/docs/expo/quickstart/present-first-pay
  wall\
  https://superwall.com/docs/expo/quickstart/user-management
  https://superwall.com/docs/expo/quickstart/feature-gating
  https://superwall.com/docs/expo/quickstart/tracking-subscription-state
  https://superwall.com/docs/expo/quickstart/setting-user-properties
  https://superwall.com/docs/expo/quickstart/in-app-paywall-previews
  suoerwall webchokout
  https://superwall.com/docs/expo/guides/web-checkout
  https://superwall.com/docs/expo/guides/web-checkout/post-checkout-redirecting
  https://superwall.com/docs/expo/guides/web-checkout/using-revenuecat
  https://superwall.com/docs/expo/guides/web-checkout/linking-membership-to-iOS-app
- **Superwall**: Used for paywall UI and A/B testing different paywall designs
- **RevenueCat**: Used for handling subscriptions, purchase validation, and managing entitlements

### Crash Solved: "The subscription status was not set"

**Problem:**
The app was showing a Superwall error: `"The subscription status was not set. Please restart the app and try again."`

**Root Cause:**
RevenueCat was never initialized before being used. The app was calling RevenueCat functions (`Purchases.getCustomerInfo()`, `Purchases.purchaseStoreProduct()`, etc.) without first calling `Purchases.configure()` with the API key.

**Solution:**
Added RevenueCat initialization in `App.js` before rendering any providers:

```javascript
import Purchases from 'react-native-purchases';

export default function App() {
  // Configure RevenueCat on mount (BEFORE rendering providers)
  useEffect(() => {
    const apiKey = process.env.REVENUECAT_API_KEY || '';
    Purchases.configure({ apiKey });
    console.log('[App] ✅ RevenueCat configured successfully');
  }, []);

  // ... rest of app
}
```

**Key Points:**
1. RevenueCat MUST be configured before SubscriptionSyncContext attempts to sync status to Superwall
2. The API key should be stored in environment variables (`REVENUECAT_API_KEY`)
3. For EAS builds, add the key to Expo dashboard secrets
4. Initialization happens once on app mount, before any providers render

**Result:** Superwall now receives subscription status correctly from RevenueCat, eliminating the "subscription status was not set" error.

## Configuration

Before deploying, update `app.json` with your existing App Store credentials:
- `ios.bundleIdentifier`: Your existing iOS bundle ID
- `android.package`: Your existing Android package name
- `extra.eas.projectId`: Your EAS project ID (if using EAS Build)

