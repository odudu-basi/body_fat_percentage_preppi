import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { analyzeBodyComposition } from '../services/claude';
import { saveBodyScan, formatScanForStorage } from '../services/bodyScanStorage';

// Animated Circle component
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// Progress Circle Component
const ProgressCircle = ({ progress, size = 160, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 500,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <Svg width={size} height={size} style={styles.progressSvg}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="rgba(232, 93, 4, 0.2)"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Progress circle */}
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

const ResultsScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { scanData } = route.params || {};
  
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          // Progress quickly to 70%, then slow down
          if (prev < 70) {
            return prev + Math.random() * 15;
          } else if (prev < 90) {
            return prev + Math.random() * 3;
          }
          return prev;
        });
      }, 300);

      return () => clearInterval(interval);
    } else {
      // Complete the circle when loading is done
      setLoadingProgress(100);
    }
  }, [isLoading]);

  // Run analysis when screen mounts
  useEffect(() => {
    const runAnalysis = async () => {
      if (!scanData) {
        setError('No scan data provided');
        setIsLoading(false);
        return;
      }

      try {
        const result = await analyzeBodyComposition(scanData);
        
        if (result.success) {
          setAnalysisResult(result.data);
          
          // Save the scan to local storage
          try {
            const formattedScan = formatScanForStorage(scanData, result.data);
            await saveBodyScan(formattedScan);
            console.log('Scan saved successfully');
          } catch (saveError) {
            console.error('Error saving scan:', saveError);
            // Don't fail the whole flow if save fails
          }
        } else {
          setError(result.error);
        }
      } catch (err) {
        console.error('Analysis error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    runAnalysis();
  }, [scanData]);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleGoHome = () => {
    // Reset navigation stack and go directly to Daily tab with Checklist selected
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'MainTabs',
            state: {
              routes: [
                { name: 'Home' },
                { name: 'Daily', params: { initialTab: 'Checklist' } },
                { name: 'Progress' },
                { name: 'Profile' },
              ],
              index: 1, // Daily tab is at index 1
            },
          },
        ],
      })
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          {/* Logo with Progress Circle */}
          <View style={styles.logoProgressContainer}>
            <ProgressCircle progress={loadingProgress} size={160} strokeWidth={6} />
            <View style={styles.logoWrapper}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.loadingLogo}
                resizeMode="contain"
              />
            </View>
          </View>
          
          {/* Progress Percentage */}
          <Text style={styles.progressPercent}>{Math.round(loadingProgress)}%</Text>
          
          <Text style={styles.loadingText}>Analyzing your body composition...</Text>
          <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={28} color={Colors.dark.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.dark.error || '#FF4444'} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleGoBack}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Get the body fat percentage from the analysis result
  const bodyFatPercentage = analysisResult?.body_fat_estimate?.percentage;
  const confidenceLevel = analysisResult?.body_fat_estimate?.confidence_level;
  const confidenceRange = analysisResult?.body_fat_estimate?.confidence_range;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Results</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Main Result */}
      <View style={styles.resultContainer}>
        {/* Buddy Logo */}
        <Image
          source={require('../../assets/logo.png')}
          style={styles.resultLogo}
          resizeMode="contain"
        />
        
        <Text style={styles.resultLabel}>You are</Text>
        
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageValue}>
            {bodyFatPercentage ? bodyFatPercentage.toFixed(1) : '--'}
          </Text>
          <Text style={styles.percentageSymbol}>%</Text>
        </View>
        
        <Text style={styles.resultSubLabel}>body fat</Text>

        {/* Confidence indicator */}
        {confidenceLevel && (
          <View style={styles.confidenceContainer}>
            <View style={[
              styles.confidenceBadge,
              confidenceLevel === 'high' && styles.confidenceHigh,
              confidenceLevel === 'medium' && styles.confidenceMedium,
              confidenceLevel === 'low' && styles.confidenceLow,
            ]}>
              <Text style={styles.confidenceText}>
                {confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1)} Confidence
              </Text>
            </View>
            {confidenceRange && (
              <Text style={styles.rangeText}>
                Range: {confidenceRange.low}% - {confidenceRange.high}%
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Continue Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.doneButton} 
          onPress={handleGoHome}
          activeOpacity={0.8}
        >
          <Text style={styles.doneButtonText}>Continue to Routine</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  placeholder: {
    width: 44,
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  logoProgressContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  progressSvg: {
    position: 'absolute',
    transform: [{ rotate: '0deg' }],
  },
  logoWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingLogo: {
    width: 80,
    height: 80,
  },
  progressPercent: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 24,
    color: Colors.dark.primary,
    marginTop: Spacing.lg,
  },
  loadingText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  // Error styles
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  errorTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.lg,
  },
  errorText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.full,
  },
  retryButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  // Result styles
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  resultLogo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.lg,
  },
  resultLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  percentageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  percentageValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 120,
    color: Colors.dark.primary,
    lineHeight: 130,
  },
  percentageSymbol: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 48,
    color: Colors.dark.primary,
    marginTop: 20,
  },
  resultSubLabel: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    marginTop: Spacing.sm,
  },
  confidenceContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  confidenceBadge: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
  },
  confidenceHigh: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  confidenceMedium: {
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  confidenceLow: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  confidenceText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },
  rangeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  // Button styles
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  doneButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default ResultsScreen;
