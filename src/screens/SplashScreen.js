import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Colors, Fonts, Spacing } from '../constants/theme';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Animate logo entrance
    Animated.sequence([
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in and slide up
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Auto-dismiss after animation
    const timer = setTimeout(() => {
      if (onFinish) {
        onFinish();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Gradient-like background effect using overlapping views */}
      <View style={styles.backgroundGradient} />
      
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textOpacity,
              transform: [{ translateY: textTranslateY }],
            },
          ]}
        >
          <Text style={styles.appName}>BodyMaxx</Text>
          <Text style={styles.tagline}>
            Lose body fat, and reach your highest potential
          </Text>
        </Animated.View>
      </View>

      {/* Subtle decorative elements */}
      <View style={styles.bottomDecoration}>
        <View style={styles.decorativeLine} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.dark.background,
    // Creating a subtle radial gradient effect
    opacity: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoContainer: {
    marginBottom: Spacing.xl,
    // Subtle glow effect behind logo
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 10,
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    maxWidth: 200,
    maxHeight: 200,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  appName: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.display,
    color: Colors.dark.primary,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.md,
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  decorativeLine: {
    width: 60,
    height: 4,
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
    opacity: 0.6,
  },
});

export default SplashScreen;

