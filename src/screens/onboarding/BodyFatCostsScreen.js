import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const COST_ITEMS = [
  'Excess face fat',
  'Less defined jawline',
  'Reduced muscle definition',
  'Decreased aesthetics',
  'Lower energy levels',
  'Decreased athletic performance',
];

const BodyFatCostsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  // Typewriter effect state
  const fullTitle = "What high body fat\npercentage really\ncosts you.";
  const [displayedTitle, setDisplayedTitle] = useState('');
  const [titleComplete, setTitleComplete] = useState(false);

  // Animation state for cost items
  const fadeAnims = useRef(COST_ITEMS.map(() => new Animated.Value(0))).current;
  const [showNextButton, setShowNextButton] = useState(false);

  // Typewriter effect for title
  useEffect(() => {
    let currentIndex = 0;
    const typingSpeed = 50; // milliseconds per character (slowed down from 30ms)

    const typeNextCharacter = () => {
      if (currentIndex < fullTitle.length) {
        setDisplayedTitle(fullTitle.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextCharacter, typingSpeed);
      } else {
        setTitleComplete(true);
      }
    };

    typeNextCharacter();
  }, []);

  // Sequential fade-in animation for cost items
  useEffect(() => {
    if (!titleComplete) return;

    const animationDelay = 350; // milliseconds between each item (slowed down from 200ms)
    const animationDuration = 600; // duration of fade-in (slowed down from 400ms)

    const animations = fadeAnims.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: animationDuration,
        delay: index * animationDelay,
        useNativeDriver: true,
      });
    });

    // Start all animations
    Animated.stagger(animationDelay, animations).start(() => {
      // Show next button after all animations complete
      setShowNextButton(true);
    });
  }, [titleComplete]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    navigation.navigate('OnboardingKitchenItems', {
      ...route.params,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.dark.textPrimary} />
        </TouchableOpacity>

        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: '95%' }]} />
          </View>
        </View>

        <View style={styles.languageSelector}>
          <Text style={styles.languageFlag}>🇺🇸</Text>
          <Text style={styles.languageCode}>EN</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{displayedTitle}</Text>

        {/* Cost Items */}
        <View style={styles.costItemsContainer}>
          {COST_ITEMS.map((item, index) => (
            <Animated.View
              key={index}
              style={[
                styles.costItem,
                {
                  opacity: fadeAnims[index],
                  transform: [{
                    translateY: fadeAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.costIconContainer}>
                <Ionicons
                  name="alert-circle-outline"
                  size={24}
                  color={Colors.dark.primary}
                />
              </View>
              <Text style={styles.costItemText}>{item}</Text>
            </Animated.View>
          ))}
        </View>
      </ScrollView>

      {/* Next Button */}
      {showNextButton && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.dark.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xl * 2,
    lineHeight: 42,
  },
  costItemsContainer: {
    gap: Spacing.md,
  },
  costItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 100, 25, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  costIconContainer: {
    marginRight: Spacing.md,
  },
  costItemText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  nextButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default BodyFatCostsScreen;
