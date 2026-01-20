import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as StoreReview from 'expo-store-review';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const TestimonialsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = async () => {
    // Request Apple/Google review
    if (await StoreReview.hasAction()) {
      await StoreReview.requestReview();
    }

    navigation.navigate('Accuracy', {
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
            <View style={[styles.progressBarFill, { width: '97%' }]} />
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
        <Text style={styles.title}>Help Us Grow{'\n'}With a Rating!</Text>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Story Text */}
        <Text style={styles.storyText}>
          I built this because I want to help people reach the best versions of themselves and feel happier when looking at themselves.
        </Text>

        {/* Stars */}
        <View style={styles.starsContainer}>
          {Array.from({ length: 5 }).map((_, index) => (
            <Ionicons
              key={index}
              name="star"
              size={32}
              color={Colors.dark.primary}
            />
          ))}
        </View>

        {/* Testimonial Quote */}
        <View style={styles.testimonialBox}>
          <View style={styles.laurelLeft}>
            <Text style={styles.laurelEmoji}>🌿</Text>
          </View>
          <Text style={styles.testimonialQuote}>
            "Thank you for helping me reach my dream physique"
          </Text>
          <View style={styles.laurelRight}>
            <Text style={styles.laurelEmoji}>🌿</Text>
          </View>
        </View>
      </ScrollView>

      {/* Continue Button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 42,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 140,
    height: 140,
  },
  storyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl * 2,
    paddingHorizontal: Spacing.md,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.xl * 2,
  },
  testimonialBox: {
    position: 'relative',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  testimonialQuote: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 28,
    fontStyle: 'italic',
  },
  laurelLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  laurelRight: {
    position: 'absolute',
    right: 0,
    top: 0,
    transform: [{ scaleX: -1 }],
  },
  laurelEmoji: {
    fontSize: 40,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  continueButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default TestimonialsScreen;
