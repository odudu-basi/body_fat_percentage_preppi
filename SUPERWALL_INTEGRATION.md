# Superwall Paywall Integration

## Overview
Superwall is integrated to display a paywall after the onboarding flow and before sign-in. It works alongside RevenueCat for subscription management.

## Integration Details

### 1. Configuration
**File:** `App.js`
- Superwall is configured with API key from `.env`
- Purchase controller set to `'revenueCat'` to integrate with existing RevenueCat setup
- Initialized early in app lifecycle

```javascript
await Superwall.configure(SUPERWALL_API_KEY, {
  purchaseController: 'revenueCat',
});
```

### 2. Flow

**Onboarding → Paywall → Sign In**

1. User completes onboarding screens (Welcome → Gender → ... → Accuracy)
2. AccuracyScreen navigates to PaywallScreen
3. PaywallScreen checks subscription status:
   - **If subscribed:** Skip paywall, go directly to Login
   - **If not subscribed:** Present Superwall paywall with placement `campaign_trigger`
4. After paywall (subscribed or dismissed), navigate to LoginScreen
5. User signs in and enters the app

### 3. Paywall Screen
**File:** `src/screens/onboarding/PaywallScreen.js`

- Checks subscription status using `Superwall.getSubscriptionStatus()`
- Presents paywall using `Superwall.register('campaign_trigger')`
- Handles subscription state changes
- Always navigates to Login after paywall interaction

### 4. Placement
**Placement ID:** `campaign_trigger`

This placement is configured in the Superwall dashboard and associated with your active paywall template.

### 5. Integration with RevenueCat

Superwall and RevenueCat work together:
- **Superwall:** Handles paywall UI and presentation logic
- **RevenueCat:** Manages subscriptions, purchases, and entitlements
- **Sync:** Automatic sync when `purchaseController` is set to `'revenueCat'`

**SubscriptionContext** (`src/context/SubscriptionContext.js`):
- Checks both RevenueCat and Superwall subscription status
- Uses RevenueCat as source of truth
- Logs any status mismatches for debugging

### 6. Subscription Status

**Three possible states:**
- `ACTIVE`: User has an active subscription
- `INACTIVE`: User does not have an active subscription
- `UNKNOWN`: Status could not be determined

### 7. API Key
**Location:** `.env`
```
SUPERWALL_API_KEY=pk_796843e739b0b13d93cc0fb8df0361ba17b5ba9657e588c1
```

## Testing

### In Development (Expo Go)
**Paywall is automatically bypassed in Expo Go!**

1. Complete onboarding flow
2. PaywallScreen detects Expo Go environment
3. Console logs: `🔧 DEV MODE: Skipping paywall (Expo Go detected)`
4. Automatically skips to Login screen
5. All Superwall code is preserved but not executed

This allows you to test the full app flow without building a development build.

### In Production (Development Build or Release)
1. Users will see the real paywall from your Superwall dashboard
2. Paywall appears after Accuracy screen, before Login
3. Purchases will be processed through RevenueCat
4. Subscription status will sync automatically
5. Console logs: `📱 PRODUCTION: Superwall configured successfully`

### Building for Production
When ready to test the actual paywall:
```bash
# Create development build (includes native code)
eas build --profile development --platform ios

# Or build locally
npx expo run:ios
```

## Important Notes

1. **Development Mode Bypass:** Paywall is automatically bypassed in Expo Go for development/testing
2. **Production Ready:** Paywall will work normally in production builds (development build, TestFlight, App Store)
3. **Mandatory Paywall:** All non-subscribed users must see the paywall (in production)
4. **Subscription Check:** Paywall is automatically skipped for subscribed users
5. **Navigation:** Users can dismiss paywall but will still proceed to Login (though they won't have premium features)
6. **RevenueCat Integration:** Superwall uses RevenueCat for purchase processing, so all your existing RevenueCat logic remains intact

## Files Modified

1. `App.js` - Superwall configuration
2. `.env` - API key added
3. `src/screens/onboarding/PaywallScreen.js` - New paywall screen
4. `src/screens/onboarding/index.js` - Export PaywallScreen
5. `src/screens/onboarding/AccuracyScreen.js` - Navigate to Paywall instead of Login
6. `src/navigation/AppNavigator.js` - Added Paywall to AuthNavigator
7. `src/context/SubscriptionContext.js` - Sync with Superwall status

## Troubleshooting

### Paywall not showing
- Check that Superwall is configured correctly in App.js
- Verify API key in `.env`
- Ensure placement `campaign_trigger` exists in Superwall dashboard
- Check that user is not already subscribed

### Subscription status mismatch
- Check console logs for sync warnings
- Verify RevenueCat integration is working
- Ensure user is logged in to RevenueCat with correct ID

### Navigation issues
- Verify PaywallScreen is added to AuthNavigator
- Check that AccuracyScreen navigates to 'Paywall'
- Ensure LoginScreen is accessible from PaywallScreen

## Superwall Dashboard
Configure your paywall template, placement, and rules at:
https://superwall.com/dashboard

Your placement: `campaign_trigger`
