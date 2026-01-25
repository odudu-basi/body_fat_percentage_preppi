// Daily Exercise Pool - Cardio and Weightlifting
// Each day, users get exercises based on their difficulty level:
// - Easy: 1 cardio + 1 weightlifting
// - Medium: 2 cardio + 2 weightlifting
// - Hard: 3 cardio + 3 weightlifting
// Exercises are selected via date-based shuffle for consistency

export const CARDIO_EXERCISES = [
  {
    title: 'HIIT Sprint Intervals',
    description: 'Boost metabolism, burn fat',
    duration: '20 min',
    calories: 300,
    icon: 'fitness',
  },
  {
    title: 'Jump Rope',
    description: 'Full-body cardio workout',
    duration: '15 min',
    calories: 220,
    icon: 'heart',
  },
  {
    title: 'Cycling',
    description: 'Low-impact leg strengthener',
    duration: '30 min',
    calories: 280,
    icon: 'bicycle',
  },
  {
    title: 'Swimming',
    description: 'Full-body, low-impact workout',
    duration: '30 min',
    calories: 350,
    icon: 'water',
  },
  {
    title: 'Stair Climbing',
    description: 'Intense calorie burner',
    duration: '20 min',
    calories: 240,
    icon: 'trending-up',
  },
  {
    title: 'Rowing Machine',
    description: 'Strength and endurance builder',
    duration: '25 min',
    calories: 310,
    icon: 'boat',
  },
  {
    title: 'Burpees Circuit',
    description: 'Explosive full-body exercise',
    duration: '15 min',
    calories: 250,
    icon: 'fitness',
  },
  {
    title: 'Elliptical Training',
    description: 'Low-impact total body',
    duration: '30 min',
    calories: 270,
    icon: 'walk',
  },
  {
    title: 'Running',
    description: 'Classic endurance builder',
    duration: '30 min',
    calories: 320,
    icon: 'walk',
  },
  {
    title: 'Mountain Climbers',
    description: 'Core and agility workout',
    duration: '15 min',
    calories: 200,
    icon: 'fitness',
  },
];

export const WEIGHTLIFTING_EXERCISES = [
  {
    title: 'Push-ups',
    description: 'Chest, shoulders, triceps builder',
    duration: '15 min',
    calories: 100,
    icon: 'body',
  },
  {
    title: 'Squats',
    description: 'Leg strength and power',
    duration: '20 min',
    calories: 150,
    icon: 'barbell',
  },
  {
    title: 'Deadlifts',
    description: 'Full-body strength builder',
    duration: '25 min',
    calories: 180,
    icon: 'barbell',
  },
  {
    title: 'Bench Press',
    description: 'Upper body strength',
    duration: '25 min',
    calories: 160,
    icon: 'barbell',
  },
  {
    title: 'Pull-ups',
    description: 'Back and arm strength',
    duration: '15 min',
    calories: 120,
    icon: 'body',
  },
  {
    title: 'Lunges',
    description: 'Balance and leg strength',
    duration: '20 min',
    calories: 140,
    icon: 'walk',
  },
  {
    title: 'Shoulder Press',
    description: 'Shoulder strength and stability',
    duration: '20 min',
    calories: 130,
    icon: 'barbell',
  },
  {
    title: 'Bicep Curls',
    description: 'Arm strength isolation',
    duration: '15 min',
    calories: 90,
    icon: 'fitness',
  },
  {
    title: 'Tricep Dips',
    description: 'Back of arms strength',
    duration: '15 min',
    calories: 110,
    icon: 'body',
  },
  {
    title: 'Plank Hold',
    description: 'Core stability builder',
    duration: '10 min',
    calories: 50,
    icon: 'body',
  },
  {
    title: 'Leg Press',
    description: 'Safe lower body strength',
    duration: '20 min',
    calories: 150,
    icon: 'barbell',
  },
  {
    title: 'Dumbbell Rows',
    description: 'Back strength and posture',
    duration: '20 min',
    calories: 140,
    icon: 'barbell',
  },
];

// Get exercises for today based on difficulty level using date-based shuffle
// Easy: 1 cardio + 1 weightlifting
// Medium: 2 cardio + 2 weightlifting
// Hard: 3 cardio + 3 weightlifting
export const getDailyExercises = (difficulty = 'medium') => {
  // Use today's date as a seed for consistent daily selection
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();

  // Simple seeded random number generator
  const seededRandom = (seed) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Determine number of exercises based on difficulty
  const exerciseCount = {
    easy: 1,
    medium: 2,
    hard: 3,
  }[difficulty] || 2; // Default to medium

  const exercises = [];

  // Select cardio exercises
  for (let i = 0; i < exerciseCount; i++) {
    const cardioIndex = Math.floor(seededRandom(seed + i) * CARDIO_EXERCISES.length);
    // Ensure we don't add duplicates
    const cardioExercise = CARDIO_EXERCISES[cardioIndex];
    if (!exercises.some(ex => ex.title === cardioExercise.title)) {
      exercises.push({ ...cardioExercise, is_custom: false });
    } else {
      // If duplicate, try next index
      const nextIndex = (cardioIndex + 1) % CARDIO_EXERCISES.length;
      exercises.push({ ...CARDIO_EXERCISES[nextIndex], is_custom: false });
    }
  }

  // Select weightlifting exercises
  for (let i = 0; i < exerciseCount; i++) {
    const weightIndex = Math.floor(seededRandom(seed + 1000 + i) * WEIGHTLIFTING_EXERCISES.length);
    // Ensure we don't add duplicates
    const weightExercise = WEIGHTLIFTING_EXERCISES[weightIndex];
    if (!exercises.some(ex => ex.title === weightExercise.title)) {
      exercises.push({ ...weightExercise, is_custom: false });
    } else {
      // If duplicate, try next index
      const nextIndex = (weightIndex + 1) % WEIGHTLIFTING_EXERCISES.length;
      exercises.push({ ...WEIGHTLIFTING_EXERCISES[nextIndex], is_custom: false });
    }
  }

  return exercises;
};
