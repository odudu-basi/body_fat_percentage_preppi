import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import { checkProAccess } from '../../services/purchases';

// Check if we're in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';

const { width } = Dimensions.get('window');

const BENEFITS = [
  {
    id: 1,
    icon: 'calendar-outline',
    text: 'Build daily habits to lose and maintain low body fat %',
  },
  {
    id: 2,
    icon: 'restaurant-outline',
    text: 'Get meals that help reduce body fat and hunger',
  },
  {
    id: 3,
    icon: 'analytics-outline',
    text: 'Keep track of your calories effortlessly',
  },
  {
    id: 4,
    icon: 'fitness-outline',
    text: 'Get exercises that focus on body fat loss',
  },
];

const WelcomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [isCheckingSubscription, setIsCheckingSubscription] = useState(false);

  // Animation states
  const logoFadeAnim = useRef(new Animated.Value(0)).current;
  const brandNameFadeAnim = useRef(new Animated.Value(0)).current;
  const [logoComplete, setLogoComplete] = useState(false);
  const [brandNameComplete, setBrandNameComplete] = useState(false);

  // Typewriter effect state
  const fullHeadline = "Your #1 AI assistant to\nlosing body fat sustainably";
  const [displayedHeadline, setDisplayedHeadline] = useState('');
  const [headlineComplete, setHeadlineComplete] = useState(false);

  // Benefit cards animation
  const benefitFadeAnims = useRef(BENEFITS.map(() => new Animated.Value(0))).current;
  const [showButtons, setShowButtons] = useState(false);

  // Logo slide and fade-in animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setLogoComplete(true);
    });
  }, []);

  // Brand name slide and fade-in animation (after logo)
  useEffect(() => {
    if (!logoComplete) return;

    Animated.parallel([
      Animated.timing(brandNameFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setBrandNameComplete(true);
    });
  }, [logoComplete]);

  // Typewriter effect for headline (after brand name completes)
  useEffect(() => {
    if (!brandNameComplete) return;

    let currentIndex = 0;
    const typingSpeed = 50; // milliseconds per character

    const typeNextCharacter = () => {
      if (currentIndex < fullHeadline.length) {
        setDisplayedHeadline(fullHeadline.substring(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextCharacter, typingSpeed);
      } else {
        setHeadlineComplete(true);
      }
    };

    typeNextCharacter();
  }, [brandNameComplete]);

  // Sequential fade-in animation for benefit cards
  useEffect(() => {
    if (!headlineComplete) return;

    const animationDelay = 350; // milliseconds between each card
    const animationDuration = 600; // duration of fade-in

    const animations = benefitFadeAnims.map((anim, index) => {
      return Animated.timing(anim, {
        toValue: 1,
        duration: animationDuration,
        delay: index * animationDelay,
        useNativeDriver: true,
      });
    });

    // Start all animations
    Animated.stagger(animationDelay, animations).start(() => {
      // Show buttons after all animations complete
      setShowButtons(true);
    });
  }, [headlineComplete]);

  const handleGetStarted = () => {
    // Navigate to name screen (first onboarding step)
    navigation.navigate('Name');
  };

  const handleSignIn = async () => {
    // DEVELOPMENT MODE: Skip paywall completely in Expo Go
    if (isExpoGo) {
      console.log('[WelcomeScreen] 🔧 DEV MODE: Skipping paywall check - going to Login');
      navigation.navigate('Login');
      return;
    }

    // PRODUCTION MODE: Check if user has subscription before navigating
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
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo with Brand Name */}
        <View style={styles.logoContainer}>
          <Animated.View
            style={{
              opacity: logoFadeAnim,
              transform: [{
                translateX: logoFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              }],
            }}
          >
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
          <Animated.View
            style={{
              opacity: brandNameFadeAnim,
              transform: [{
                translateX: brandNameFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              }],
            }}
          >
            <Text style={styles.brandName}>
              <Text style={styles.brandNameBody}>Body</Text>
              <Text style={styles.brandNameMaxx}>Maxx</Text>
            </Text>
          </Animated.View>
        </View>

        {/* Headline with typewriter effect */}
        <View style={styles.headlineContainer}>
          <Text style={styles.headline}>{displayedHeadline}</Text>
        </View>

        {/* Benefits List with fade-in animation */}
        <View style={styles.benefitsContainer}>
          {BENEFITS.map((benefit, index) => (
            <Animated.View
              key={benefit.id}
              style={[
                styles.benefitItem,
                {
                  opacity: benefitFadeAnims[index],
                  transform: [{
                    translateY: benefitFadeAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <View style={styles.benefitIconContainer}>
                <Ionicons
                  name={benefit.icon}
                  size={24}
                  color={Colors.dark.primary}
                />
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </Animated.View>
          ))}
        </View>

        {/* Get Started Button - Only show after animations */}
        {showButtons && (
          <>
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
          </>
        )}
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  logo: {
    width: 140,
    height: 140,
  },
  brandName: {
    marginTop: Spacing.xs,
  },
  brandNameBody: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    letterSpacing: 1,
  },
  brandNameMaxx: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.primary,
    letterSpacing: 1,
  },
  headlineContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 1.5,
    minHeight: 80, // Reserve space for typewriter animation
  },
  headlineTag: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  headline: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  benefitsContainer: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 100, 25, 0.1)',
    padding: Spacing.lg,
    borderRadius: 14, // Design.md suggests 12-16px
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  benefitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(242, 100, 25, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  benefitText: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    lineHeight: 22,
  },
  startButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
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
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  signInText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
