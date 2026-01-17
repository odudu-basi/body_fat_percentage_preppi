import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import CalorieCard from '../components/common/CalorieCard';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandBody}>Body</Text>
            <Text style={styles.brandMax}>Max</Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <View style={styles.uploadContainer}>
          <View style={styles.uploadArea}>
            <View style={styles.uploadIconContainer}>
              <View style={styles.cameraIcon}>
                <View style={styles.cameraBody} />
                <View style={styles.cameraLens} />
              </View>
            </View>
            <Text style={styles.uploadText}>Upload your photo</Text>
            <Text style={styles.uploadSubtext}>
              Take or upload a photo of your torso to analyze body fat percentage
            </Text>
          </View>

          {/* Scan Button */}
          <TouchableOpacity style={styles.scanButton} activeOpacity={0.8}>
            <Text style={styles.scanButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>

        {/* Calorie Card */}
        <View style={styles.calorieSection}>
          <CalorieCard 
            currentCalories={1250}
            targetCalories={2000}
            onPress={() => console.log('Calorie card pressed')}
          />
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
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    width: 64,
    height: 64,
  },
  brandText: {
    flexDirection: 'row',
    marginLeft: Spacing.sm,
  },
  brandBody: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.primary,
  },
  brandMax: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 32,
    color: Colors.dark.textPrimary,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140, // Extra padding for glassmorphic tab bar
  },
  uploadContainer: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  calorieSection: {
    marginTop: Spacing.xl,
  },
  uploadArea: {
    width: width - Spacing.lg * 2,
    aspectRatio: 0.85,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  cameraIcon: {
    width: 40,
    height: 32,
    position: 'relative',
  },
  cameraBody: {
    width: 40,
    height: 28,
    backgroundColor: Colors.dark.primary,
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
  },
  cameraLens: {
    width: 16,
    height: 16,
    backgroundColor: Colors.dark.background,
    borderRadius: 8,
    position: 'absolute',
    bottom: 6,
    left: 12,
    borderWidth: 3,
    borderColor: Colors.dark.primary,
  },
  uploadText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  uploadSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scanButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl * 2,
    borderRadius: BorderRadius.full,
  },
  scanButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default HomeScreen;

