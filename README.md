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

## Configuration

Before deploying, update `app.json` with your existing App Store credentials:
- `ios.bundleIdentifier`: Your existing iOS bundle ID
- `android.package`: Your existing Android package name
- `extra.eas.projectId`: Your EAS project ID (if using EAS Build)

