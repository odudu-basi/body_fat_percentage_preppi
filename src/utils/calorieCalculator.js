/**
 * Calorie Calculator Utility
 * Calculates personalized daily calorie targets based on user profile
 */

/**
 * Calculate BMR (Basal Metabolic Rate) using Mifflin-St Jeor Equation
 * This is the most accurate formula for estimating BMR
 *
 * @param {number} weight_kg - Weight in kilograms
 * @param {number} height_cm - Height in centimeters
 * @param {number} age - Age in years
 * @param {string} gender - 'male' or 'female'
 * @returns {number} - BMR in calories
 */
export const calculateBMR = (weight_kg, height_cm, age, gender) => {
  if (!weight_kg || !height_cm || !age || !gender) {
    console.warn('Missing parameters for BMR calculation');
    return 0;
  }

  // Mifflin-St Jeor Equation
  // Men: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
  // Women: BMR = (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161

  const bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age);

  if (gender.toLowerCase() === 'male') {
    return Math.round(bmr + 5);
  } else {
    return Math.round(bmr - 161);
  }
};

/**
 * Get activity level multiplier based on workout frequency
 *
 * @param {string} workoutFrequency - Workout frequency from onboarding ('0-2', '3-5', '6+')
 * @returns {number} - Activity multiplier
 */
export const getActivityMultiplier = (workoutFrequency) => {
  switch (workoutFrequency) {
    case '0-2':
      return 1.375; // Lightly active
    case '3-5':
      return 1.55;  // Moderately active
    case '6+':
      return 1.725; // Very active
    default:
      return 1.55;  // Default to moderately active
  }
};

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 * This represents maintenance calories
 *
 * @param {number} bmr - Basal Metabolic Rate
 * @param {string} workoutFrequency - Workout frequency from onboarding
 * @returns {number} - TDEE in calories
 */
export const calculateTDEE = (bmr, workoutFrequency) => {
  const activityMultiplier = getActivityMultiplier(workoutFrequency);
  return Math.round(bmr * activityMultiplier);
};

/**
 * Calculate daily calorie target based on user profile
 * This is the main function to use for getting personalized calorie goals
 *
 * @param {Object} profile - User profile object
 * @param {number} profile.weight_kg - Weight in kg
 * @param {number} profile.height_cm - Height in cm
 * @param {number} profile.age - Age in years
 * @param {string} profile.gender - 'male' or 'female'
 * @param {string} profile.workout_frequency - '0-2', '3-5', or '6+'
 * @returns {number} - Daily calorie target (maintenance)
 */
export const calculateDailyCalorieTarget = (profile) => {
  if (!profile) {
    console.warn('No profile provided for calorie calculation');
    return 2000; // Default fallback
  }

  const { weight_kg, height_cm, age, gender, workout_frequency } = profile;

  // Validate required fields
  if (!weight_kg || !height_cm || !age || !gender) {
    console.warn('Missing required fields for calorie calculation');
    return 2000; // Default fallback
  }

  // Calculate BMR
  const bmr = calculateBMR(weight_kg, height_cm, age, gender);

  // Calculate TDEE (maintenance calories)
  const tdee = calculateTDEE(bmr, workout_frequency);

  console.log(`📊 Calorie calculation for user:`, {
    weight_kg,
    height_cm,
    age,
    gender,
    workout_frequency,
    bmr,
    tdee,
  });

  return tdee;
};

/**
 * Calculate calories remaining for the day
 *
 * @param {number} dailyTarget - Daily calorie target
 * @param {number} consumed - Calories consumed so far
 * @returns {number} - Calories remaining (can be negative if over target)
 */
export const calculateCaloriesRemaining = (dailyTarget, consumed) => {
  return dailyTarget - consumed;
};

/**
 * Calculate percentage of daily calories consumed
 *
 * @param {number} dailyTarget - Daily calorie target
 * @param {number} consumed - Calories consumed so far
 * @returns {number} - Percentage (0-100+)
 */
export const calculateCaloriesPercentage = (dailyTarget, consumed) => {
  if (!dailyTarget || dailyTarget === 0) return 0;
  return Math.round((consumed / dailyTarget) * 100);
};

/**
 * Calculate calorie goal with deficit for fat loss
 *
 * @param {number} tdee - Total Daily Energy Expenditure (maintenance calories)
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @returns {number} - Calorie goal with deficit applied
 */
export const calculateCalorieGoalWithDeficit = (tdee, difficulty = 'medium') => {
  const deficits = {
    easy: 250,    // ~0.5 lb/week loss
    medium: 500,  // ~1 lb/week loss
    hard: 750,    // ~1.5 lb/week loss
  };

  const deficit = deficits[difficulty] || deficits.medium;
  return Math.round(tdee - deficit);
};

/**
 * Calculate macro targets for high-protein fat loss diet
 *
 * @param {number} calorieGoal - Daily calorie goal
 * @returns {Object} - Macro targets in grams and milligrams
 */
export const calculateMacroTargets = (calorieGoal) => {
  // High protein split for fat loss: 40% protein, 35% carbs, 25% fats
  const proteinCalories = calorieGoal * 0.40;
  const carbsCalories = calorieGoal * 0.35;
  const fatsCalories = calorieGoal * 0.25;

  // Convert calories to grams
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fats: 9 cal/g
  const protein_g = Math.round(proteinCalories / 4);
  const carbs_g = Math.round(carbsCalories / 4);
  const fats_g = Math.round(fatsCalories / 9);

  // Micronutrient targets that scale with calorie intake
  // Fiber: 14g per 1000 calories (FDA recommendation)
  const fiber_g = Math.round((calorieGoal / 1000) * 14);

  // Sodium and Sugar: Fixed max limits (health guidelines)
  const sodium_mg = 2300;    // FDA recommended max sodium per day
  const sugar_g = 50;        // WHO recommended max added sugar per day

  return {
    protein_g,
    carbs_g,
    fats_g,
    fiber_g,       // Now scales: ~21g at 1500cal, ~28g at 2000cal, ~35g at 2500cal
    sodium_mg,     // Fixed: max 2300mg regardless of calories
    sugar_g,       // Fixed: max 50g regardless of calories
  };
};

/**
 * Calculate complete nutrition targets for a user
 * Includes calorie goal with deficit and macro targets
 *
 * @param {Object} profile - User profile object
 * @param {string} difficulty - Fat loss difficulty: 'easy', 'medium', or 'hard'
 * @returns {Object} - Complete nutrition targets
 */
export const calculateNutritionTargets = (profile, difficulty = 'medium') => {
  // Calculate maintenance calories (TDEE)
  const tdee = calculateDailyCalorieTarget(profile);

  // Apply deficit for fat loss
  const calorieGoal = calculateCalorieGoalWithDeficit(tdee, difficulty);

  // Calculate macro targets
  const macros = calculateMacroTargets(calorieGoal);

  console.log(`📊 Nutrition targets calculated:`, {
    tdee,
    difficulty,
    calorieGoal,
    macros,
  });

  // Return with database-compatible field names
  return {
    daily_calorie_target: calorieGoal,
    daily_protein_target: macros.protein_g,
    daily_carbs_target: macros.carbs_g,
    daily_fat_target: macros.fats_g,
    // Keep internal fields for backward compatibility
    tdee,
    protein_g: macros.protein_g,
    carbs_g: macros.carbs_g,
    fats_g: macros.fats_g,
    fiber_g: macros.fiber_g,
    sodium_mg: macros.sodium_mg,
    sugar_g: macros.sugar_g,
  };
};

export default {
  calculateBMR,
  getActivityMultiplier,
  calculateTDEE,
  calculateDailyCalorieTarget,
  calculateCaloriesRemaining,
  calculateCaloriesPercentage,
  calculateCalorieGoalWithDeficit,
  calculateMacroTargets,
  calculateNutritionTargets,
};
