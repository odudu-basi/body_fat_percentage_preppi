import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { useTutorial } from '../../context/TutorialContext';
import { TUTORIAL_STEPS, TOTAL_STEPS } from './tutorialSteps';
import { useNavigation } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TutorialOverlay = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {
    showTutorial,
    currentStep,
    nextStep,
    prevStep,
    completeTutorial,
  } = useTutorial();

  const currentStepData = TUTORIAL_STEPS.find(step => step.step === currentStep);

  // Handle tab navigation when step changes
  useEffect(() => {
    if (!currentStepData) {
      console.log('[TutorialOverlay] No current step data');
      return;
    }

    console.log('[TutorialOverlay] Current step:', currentStep, currentStepData);

    // Skip navigation for step 1 (Buddy intro)
    if (currentStepData.showBuddyIntro) {
      console.log('[TutorialOverlay] Step 1 - Buddy intro, skipping navigation');
      return;
    }

    const targetTab = currentStepData.tab;
    console.log('[TutorialOverlay] Navigating to tab:', targetTab);

    // Small delay for smooth transition
    setTimeout(() => {
      try {
        // For Daily screen, pass the sub-tab if specified
        if (targetTab === 'Daily' && currentStepData.dailySubTab) {
          console.log('[TutorialOverlay] Daily screen with sub-tab:', currentStepData.dailySubTab);
          navigation.navigate(targetTab, { initialTab: currentStepData.dailySubTab });
        } else {
          console.log('[TutorialOverlay] Navigating to:', targetTab);
          navigation.navigate(targetTab);
        }
      } catch (error) {
        console.error('[TutorialOverlay] Navigation error:', error);
      }
    }, 100);
  }, [currentStep, currentStepData]);

  if (!showTutorial || !currentStepData) {
    return null;
  }

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS) {
      // Tutorial complete - go directly to Home screen
      completeTutorial();
      navigation.navigate('Home');
    } else {
      nextStep();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      prevStep();
    }
  };

  // For step 1 (Buddy intro), show special layout
  if (currentStepData.showBuddyIntro) {
    return (
      <Modal
        visible={showTutorial}
        transparent={false}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={[styles.buddyIntroContainer, { paddingTop: insets.top + Spacing.xl }]}>
          {/* Progress dots */}
          <View style={[styles.progressContainer, { paddingTop: 20 }]}>
            {TUTORIAL_STEPS.map((step, index) => (
              <View
                key={step.step}
                style={[
                  styles.progressDot,
                  currentStep === step.step && styles.progressDotActive,
                  currentStep > step.step && styles.progressDotCompleted,
                ]}
              />
            ))}
          </View>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Message */}
          <View style={styles.buddyMessageContainer}>
            <Text style={styles.buddyMessage}>{currentStepData.description}</Text>
          </View>

          {/* Next Button */}
          <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 20 }]}>
            <View style={{ flex: 1 }} />
            <TouchableOpacity
              style={[styles.button, styles.nextButton]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  // Calculate tooltip position (centered on screen)
  const tooltipTop = screenHeight * 0.35;

  // For steps 2-7, use an absolute overlay instead of Modal so screens show underneath
  if (!showTutorial) {
    return null;
  }

  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      <View style={styles.container} pointerEvents="box-none">
        {/* Progress dots */}
        <View style={[styles.progressContainer, { paddingTop: insets.top + 20 }]} pointerEvents="none">
          {TUTORIAL_STEPS.map((step, index) => (
            <View
              key={step.step}
              style={[
                styles.progressDot,
                currentStep === step.step && styles.progressDotActive,
                currentStep > step.step && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>

        {/* Info tooltip - centered, no highlight box */}
        <View
          style={[
            styles.tooltipContainer,
            { top: tooltipTop },
          ]}
          pointerEvents="auto"
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
            <Text style={styles.tooltipDescription}>
              {currentStepData.description}
            </Text>
          </View>
        </View>

        {/* Navigation buttons */}
        <View style={[styles.buttonsContainer, { paddingBottom: insets.bottom + 20 }]} pointerEvents="auto">
          {/* Back button (only show if not first step) */}
          {currentStep > 1 && (
            <TouchableOpacity
              style={[styles.button, styles.backButton]}
              onPress={handleBack}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color={Colors.dark.primary} />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          {/* Spacer if no back button */}
          {currentStep === 1 && <View style={{ flex: 1 }} />}

          {/* Next button */}
          <TouchableOpacity
            style={[styles.button, styles.nextButton]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === TOTAL_STEPS ? 'Finish' : 'Next'}
            </Text>
            {currentStep !== TOTAL_STEPS && (
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  progressContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 3,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: Colors.dark.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressDotCompleted: {
    backgroundColor: 'rgba(242, 100, 25, 0.5)',
  },
  tooltipContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 3,
  },
  tooltip: {
    backgroundColor: Colors.dark.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tooltipTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  tooltipDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 22,
  },
  buttonsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    zIndex: 3,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: 28,
    gap: 8,
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  backButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
  },
  nextButton: {
    flex: 1,
    backgroundColor: Colors.dark.primary,
  },
  nextButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
  // Buddy intro screen styles
  buddyIntroContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl * 2,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl * 3,
  },
  logo: {
    width: 160,
    height: 160,
  },
  buddyMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  buddyMessage: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
});

export default TutorialOverlay;
