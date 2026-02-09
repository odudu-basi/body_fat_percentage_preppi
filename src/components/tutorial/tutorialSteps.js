/**
 * Tutorial Steps Configuration
 * Defines the sequence and content of the app tutorial
 */

export const TUTORIAL_STEPS = [
  {
    step: 1,
    screen: 'BuddyIntro',
    tab: 'Home',
    highlightArea: 'none', // No highlight for intro screen
    title: "Hi I'm Buddy",
    description: "Your AI fitness partner, let me show you around",
    showBuddyIntro: true, // Special flag for step 1
  },
  {
    step: 2,
    screen: 'Home',
    tab: 'Home',
    highlightArea: 'calorieTracking',
    title: 'Calorie Tracking',
    description: 'Use the day slider to view calories and meals for any day of the week',
    // Position relative to screen (approximate)
    position: {
      top: '25%',
      left: '5%',
      width: '90%',
      height: '45%',
    },
  },
  {
    step: 3,
    screen: 'Home',
    tab: 'Home',
    highlightArea: 'settings',
    title: 'Settings',
    description: 'See your information and preferences in the settings',
    position: {
      top: '7%',
      right: '5%',
      width: 48,
      height: 48,
    },
  },
  {
    step: 4,
    screen: 'Daily',
    tab: 'Daily',
    dailySubTab: 'Checklist', // Sub-tab within Daily screen
    highlightArea: 'checklist',
    title: 'Checklist',
    description: 'Get habits you need to lose body fat and stay lean',
    position: {
      top: '20%',
      left: '5%',
      width: '90%',
      height: '30%',
    },
  },
  {
    step: 5,
    screen: 'Daily',
    tab: 'Daily',
    dailySubTab: 'Nutrition', // Show Nutrition tab on Daily screen
    highlightArea: 'mealPlan',
    title: 'Meal Plan',
    description: 'Generate AI-powered meal plans with recipes for today',
    position: {
      top: '20%',
      left: '5%',
      width: '90%',
      height: '35%',
    },
  },
  {
    step: 6,
    screen: 'Daily',
    tab: 'Daily',
    dailySubTab: 'Exercise', // Show Exercise tab on Daily screen
    highlightArea: 'exercise',
    title: 'Exercise',
    description: 'Our AI recommends exercises to lose body fat and stay healthy',
    position: {
      top: '20%',
      left: '5%',
      width: '90%',
      height: '35%',
    },
  },
  {
    step: 7,
    screen: 'Feedback',
    tab: 'Feedback',
    highlightArea: 'feedback',
    title: 'Feedback',
    description: 'Provide feedback to the founder with issues, complaints or compliments',
    position: {
      top: '15%',
      left: '5%',
      width: '90%',
      height: '70%',
    },
  },
];

export const TOTAL_STEPS = TUTORIAL_STEPS.length;
