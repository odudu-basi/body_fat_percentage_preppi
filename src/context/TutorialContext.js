import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TutorialContext = createContext(undefined);

const TUTORIAL_STORAGE_KEY = '@tutorial_seen';

export const TutorialProvider = ({ children }) => {
  const [tutorialSeen, setTutorialSeen] = useState(null); // null = loading, true/false = loaded
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [showBuddyIntro, setShowBuddyIntro] = useState(false);

  // Load tutorial status from AsyncStorage on mount
  useEffect(() => {
    loadTutorialStatus();
  }, []);

  const loadTutorialStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(TUTORIAL_STORAGE_KEY);
      const seen = value === 'true';
      setTutorialSeen(seen);
      console.log('[TutorialContext] Tutorial seen:', seen);
    } catch (error) {
      console.error('[TutorialContext] Error loading tutorial status:', error);
      setTutorialSeen(false); // Default to not seen on error
    }
  };

  const startTutorial = () => {
    console.log('[TutorialContext] Starting tutorial');
    setCurrentStep(1);
    setShowTutorial(true);
    setShowBuddyIntro(false); // No longer using separate buddy intro screen
  };

  const startOverlayTutorial = () => {
    console.log('[TutorialContext] Starting overlay tutorial (legacy - now unused)');
    // This function is no longer used since Buddy intro is now step 1
    setShowBuddyIntro(false);
    setCurrentStep(1);
    setShowTutorial(true);
  };

  const completeTutorial = async () => {
    try {
      console.log('[TutorialContext] Completing tutorial');
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
      setTutorialSeen(true);
      setShowTutorial(false);
      setCurrentStep(0);
      console.log('[TutorialContext] Tutorial completed and saved');
    } catch (error) {
      console.error('[TutorialContext] Error saving tutorial completion:', error);
    }
  };

  const resetTutorial = async () => {
    try {
      console.log('[TutorialContext] Resetting tutorial');
      await AsyncStorage.setItem(TUTORIAL_STORAGE_KEY, 'false');
      setTutorialSeen(false);
      setCurrentStep(0);
      setShowTutorial(false);
      console.log('[TutorialContext] Tutorial reset');
    } catch (error) {
      console.error('[TutorialContext] Error resetting tutorial:', error);
    }
  };

  const nextStep = () => {
    console.log('[TutorialContext] Next step:', currentStep + 1);
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) {
      console.log('[TutorialContext] Previous step:', currentStep - 1);
      setCurrentStep(currentStep - 1);
    }
  };

  const value = {
    tutorialSeen,
    showTutorial,
    currentStep,
    showBuddyIntro,
    startTutorial,
    startOverlayTutorial,
    completeTutorial,
    resetTutorial,
    nextStep,
    prevStep,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};
