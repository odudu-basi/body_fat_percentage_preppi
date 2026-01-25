import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { checkProAccess } from '../../services/purchases';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  const handleGetStarted = () => {
    // Navigate to gender selection screen
    navigation.navigate('Gender');
  };

  const handleSignIn = async () => {
    // Check if user has subscription before navigating
    setIsCheckingSubscription(true);
    try {
      const hasProAccess = await checkProAccess();
      setIsCheckingSubscription(false);

      if (hasProAccess) {
        // User is subscribed, go directly to Login
        navigation.navigate('Login');
      } else {
        // User is NOT subscribed, show paywall first
        navigation.navigate('Paywall');
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsCheckingSubscription(false);
      // On error, go to paywall to be safe
      navigation.navigate('Paywall');
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Body Scan Image Preview */}
        <View style={styles.scanPreviewContainer}>
          <View style={styles.scanImageArea}>
            {/* Body Image - Blurred */}
            <Image
              source={require('../../../assets/body-scan.png')}
              style={styles.scanImage}
              resizeMode="cover"
              blurRadius={40}
            />

            {/* Dark overlay */}
            <View style={styles.scanOverlay} />

            {/* BodyMaxx Header - Top Left */}
            <View style={styles.brandHeader}>
              <Text style={styles.brandBody}>Body</Text>
              <Text style={styles.brandMax}>Maxx</Text>
            </View>

            {/* Centered Logo */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* Body Fat Percentage - Top Right */}
            <View style={styles.percentageOverlay}>
              <Text style={styles.percentageValue}>28%</Text>
              <Text style={styles.percentageLabel}>Body Fat</Text>
            </View>

            {/* Date - Bottom Right */}
            <View style={styles.dateOverlay}>
              <Text style={styles.dateText}>Jan 15, 2026</Text>
            </View>
          </View>

          {/* NEW SCAN Button */}
          <TouchableOpacity style={styles.scanButton} activeOpacity={0.8}>
            <Text style={styles.scanButtonText}>NEW SCAN</Text>
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <Text style={styles.title}>Get your body fat %,{'\n'}get recommendations{'\n'}to reduce it</Text>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.featureText}>Daily checklist</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.featureText}>Calorie requirements</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
              <Text style={styles.featureText}>Tailored exercises</Text>
            </View>
          </View>

          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Let's start</Text>
          </TouchableOpacity>

          {/* Sign In Link */}
          <TouchableOpacity
            onPress={handleSignIn}
            activeOpacity={0.7}
            disabled={isCheckingSubscription}
            style={styles.signInContainer}
          >
            {isCheckingSubscription ? (
              <ActivityIndicator size="small" color={Colors.dark.textSecondary} />
            ) : (
              <Text style={styles.signInText}>You already have an account?</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  scanPreviewContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    alignItems: 'center',
  },
  scanImageArea: {
    width: width - Spacing.lg * 2,
    aspectRatio: 0.85,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanImage: {
    width: '100%',
    height: '100%',
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  brandHeader: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBody: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: Colors.dark.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  brandMax: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: Colors.dark.textPrimary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  logoContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -65 }, { translateY: -65 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 130,
    height: 130,
  },
  percentageOverlay: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    alignItems: 'flex-end',
  },
  percentageValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: Colors.dark.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  percentageLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
    marginTop: -4,
  },
  dateOverlay: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  dateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
  },
  scanButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl * 2,
    borderRadius: BorderRadius.full,
  },
  scanButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  contentSection: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: Spacing.lg,
  },
  featuresList: {
    width: '100%',
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginLeft: Spacing.sm,
  },
  startButton: {
    width: width - Spacing.xl * 2,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  startButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  signInContainer: {
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
