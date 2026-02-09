import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../../constants/theme';
import { useTutorial } from '../../context/TutorialContext';

const { width } = Dimensions.get('window');

const BuddyIntroScreen = () => {
  const insets = useSafeAreaInsets();
  const { startOverlayTutorial } = useTutorial();

  // Typewriter effect state
  const fullMessage = "Hi I'm Buddy, your AI fitness partner, let me show you around";
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [showNextButton, setShowNextButton] = useState(false);

  // Typewriter effect
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 50; // milliseconds per character

    const typeNextCharacter = () => {
      if (currentIndex < fullMessage.length) {
        setDisplayedMessage(fullMessage.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextCharacter, typingSpeed);
      } else {
        // Typing complete, show next button
        setShowNextButton(true);
      }
    };

    typeNextCharacter();
  }, []);

  const handleNext = () => {
    startOverlayTutorial();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Typewriter Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{displayedMessage}</Text>
      </View>

      {/* Next Button */}
      {showNextButton && (
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
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
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  message: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  nextButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default BuddyIntroScreen;
