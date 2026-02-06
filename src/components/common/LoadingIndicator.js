import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts, Spacing } from '../../constants/theme';

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Progress Circle Component (fills based on percentage)
const ProgressCircle = ({ progress, size = 80, strokeWidth = 4 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={size} height={size}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(232, 93, 4, 0.2)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Animated progress circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.dark.primary}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
};

// Spinning Progress Circle Component
const SpinningCircle = ({ size = 80, strokeWidth = 4 }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Create infinite spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotation = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={{ transform: [{ rotate: rotation }] }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(232, 93, 4, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated circle segment */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.dark.primary}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
        />
      </Svg>
    </Animated.View>
  );
};

/**
 * LoadingIndicator - Reusable loading component with spinning or progress circle
 * @param {string} text - Loading text to display
 * @param {string} subtext - Optional subtext
 * @param {number} size - Size of the loading circle (default: 80)
 * @param {boolean} showLogo - Whether to show logo in center (default: true)
 * @param {number} progress - Progress percentage (0-100). If provided, shows progress mode instead of spinning
 */
const LoadingIndicator = ({
  text = 'Loading...',
  subtext = null,
  size = 80,
  showLogo = true,
  progress = null,
}) => {
  const showProgress = progress !== null && progress !== undefined;

  return (
    <View style={styles.container}>
      {/* Logo with Circle (Spinning or Progress) */}
      <View style={[styles.logoProgressContainer, { width: size, height: size }]}>
        {showProgress ? (
          <ProgressCircle size={size} strokeWidth={size / 20} progress={progress} />
        ) : (
          <SpinningCircle size={size} strokeWidth={size / 20} />
        )}
        {showLogo && (
          <View style={[styles.logoWrapper, { width: size * 0.5, height: size * 0.5 }]}>
            <Image
              source={require('../../../assets/logo.png')}
              style={styles.loadingLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* Progress Percentage (only shown in progress mode) */}
      {showProgress && (
        <Text style={styles.progressPercentage}>{Math.round(progress)}%</Text>
      )}

      {/* Loading Text */}
      {text && <Text style={styles.loadingText}>{text}</Text>}
      {subtext && <Text style={styles.loadingSubtext}>{subtext}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoProgressContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  logoWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  loadingSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  progressPercentage: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
});

export default LoadingIndicator;
