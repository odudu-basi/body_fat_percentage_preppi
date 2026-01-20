# Onboarding Flow & Data Storage

## Overview
The onboarding flow collects user information before authentication and saves it to the user's profile in Supabase after sign-in.

## Data Flow

### 1. Onboarding Screens (in order)
Each screen collects data and passes it via navigation params:

1. **WelcomeScreen** → Gender
   - No data collection, just introduction

2. **GenderScreen** → Birthday
   - Collects: `gender` ('male', 'female', 'other')

3. **BirthdayScreen** → HeightWeight
   - Collects: `birthday` (ISO date string)

4. **HeightWeightScreen** → Ethnicity
   - Collects: `height_cm`, `weight_kg`
   - Also stores: `heightUnit`, `weightUnit` for UI preferences

5. **EthnicityScreen** → WorkoutFrequency
   - Collects: `ethnicity`

6. **WorkoutFrequencyScreen** → WaterIntake
   - Collects: `workoutFrequency` ('0-2', '3-5', '6+')

7. **WaterIntakeScreen** → BodyFatCosts
   - Collects: `waterIntake` (decimal, 0-5 liters)

8. **BodyFatCostsScreen** → Testimonials
   - No data collection, educational screen

9. **TestimonialsScreen** → Accuracy
   - No data collection, requests app store review

10. **AccuracyScreen** → Login
    - No data collection, final educational screen

11. **LoginScreen**
    - Receives all accumulated onboarding data via `route.params`
    - Passes data to authentication functions

### 2. Data Storage

When the user signs in (either via Apple or dev mode), all onboarding data is saved to their profile:

```javascript
// Data mapping from onboarding params to database fields
{
  gender: onboardingData.gender,                    // 'male' | 'female' | 'other'
  birthday: onboardingData.birthday,                // DATE
  height_cm: onboardingData.height_cm,              // DECIMAL(5,2)
  weight_kg: onboardingData.weight_kg,              // DECIMAL(5,2)
  ethnicity: onboardingData.ethnicity,              // TEXT
  workout_frequency: onboardingData.workoutFrequency, // '0-2' | '3-5' | '6+'
  water_intake_liters: onboardingData.waterIntake,  // DECIMAL(3,1)
  activity_level: computed,                         // Based on workout_frequency
  age: computed,                                    // Calculated from birthday
}
```

### 3. Database Schema

The onboarding data is stored in the `profiles` table:

```sql
-- Core onboarding fields
birthday DATE                           -- User birth date
ethnicity TEXT                          -- User ethnicity
workout_frequency TEXT                  -- '0-2', '3-5', or '6+'
water_intake_liters DECIMAL(3,1)       -- Daily water intake (0-5L)

-- Also updates existing fields
gender TEXT                             -- From base schema
height_cm DECIMAL(5,2)                 -- From base schema
weight_kg DECIMAL(5,2)                 -- From base schema
age INTEGER                            -- Calculated from birthday
activity_level TEXT                    -- Derived from workout_frequency
```

## Database Migration

To add the onboarding fields to an existing database, run the migration:

```bash
# Apply migration in Supabase SQL Editor
supabase/migrations/001_add_onboarding_fields.sql
```

## Development Mode

In development (Expo Go), authentication is bypassed but onboarding data is still collected:

- User goes through full onboarding flow
- On LoginScreen, auto-signs in with dev credentials
- All onboarding data is stored in local state (not Supabase in dev mode)
- Profile is populated with onboarding data for testing

## Production Flow

In production (real device with Sign in with Apple):

1. User completes onboarding screens
2. User taps "Sign in with Apple"
3. Apple authentication completes
4. `signInApple()` saves all onboarding data to Supabase `profiles` table
5. User is redirected to main app with complete profile

## Key Files

- **AuthContext.js**: `signInApple()` and `signInDevMode()` handle data saving
- **LoginScreen.js**: Passes `route.params` to sign-in functions
- **Onboarding screens**: Each screen adds data to navigation params
- **supabase/migrations/001_add_onboarding_fields.sql**: Database migration

## Testing

To test the onboarding flow:

1. Delete app and reinstall (or clear AsyncStorage)
2. Complete onboarding screens
3. Sign in (or auto-sign-in in dev mode)
4. Check profile data in Supabase dashboard or console logs
