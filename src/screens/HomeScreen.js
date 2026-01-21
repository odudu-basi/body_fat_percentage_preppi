import React, { useState, useEffect, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import DailyCalorieCard from '../components/common/DailyCalorieCard';
import BodyScanCard from '../components/common/BodyScanCard';
import ScanTutorialModal from '../components/common/ScanTutorialModal';
import SettingsButton from '../components/common/SettingsButton';
import { getLatestBodyScan, deleteBodyScan } from '../services/bodyScanStorage';
import { getTodaysCalories } from '../services/mealStorage';
import { getTodaysBurnedCalories } from '../services/exerciseStorage';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [showScanModal, setShowScanModal] = useState(false);
  const [latestScan, setLatestScan] = useState(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [exerciseCalories, setExerciseCalories] = useState(0);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        console.log('HomeScreen focused - loading data...');
        
        // Load latest scan
        const scan = await getLatestBodyScan();
        console.log('Latest scan loaded:', scan?.id || 'none');
        setLatestScan(scan);
        
        // Load today's calories
        try {
          const calories = await getTodaysCalories();
          setTotalCalories(calories);
          console.log('Today\'s calories loaded:', calories);
        } catch (error) {
          console.error('Error loading calories:', error);
        }
        
        // Load exercise burned calories
        try {
          const burned = await getTodaysBurnedCalories();
          setExerciseCalories(burned);
          console.log('Exercise calories loaded:', burned);
        } catch (error) {
          console.error('Error loading exercise calories:', error);
        }
      };
      loadData();
    }, [])
  );

  // Also load on initial mount
  useEffect(() => {
    const loadInitialData = async () => {
      const scan = await getLatestBodyScan();
      setLatestScan(scan);
      
      try {
        const calories = await getTodaysCalories();
        setTotalCalories(calories);
      } catch (error) {
        console.error('Error loading initial calories:', error);
      }
      
      try {
        const burned = await getTodaysBurnedCalories();
        setExerciseCalories(burned);
      } catch (error) {
        console.error('Error loading initial exercise calories:', error);
      }
    };
    loadInitialData();
  }, []);

  const handleScanPress = () => {
    setShowScanModal(true);
  };

  const handleScanCardPress = () => {
    // Navigate to scan details screen
    navigation.navigate('ScanDetails', { scanData: latestScan });
  };

  const handleDeleteScan = async (scanId) => {
    const success = await deleteBodyScan(scanId);
    if (success) {
      // Reload the latest scan (which will be null if deleted)
      const scan = await getLatestBodyScan();
      setLatestScan(scan);
    }
  };

  const handleScanComplete = async (scanData) => {
    console.log('Scan completed with data:', scanData);
    
    // Close the modal
    setShowScanModal(false);
    
    // Navigate to results screen with scan data
    // The ResultsScreen will handle the API call
    navigation.navigate('Results', { scanData });
  };

  const handleLogoPress = () => {
    navigation.navigate('Buddy');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header with Logo and Settings */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.logoContainer} 
          onPress={handleLogoPress}
          activeOpacity={0.7}
        >
          <Image
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.brandText}>
            <Text style={styles.brandBody}>Body</Text>
            <Text style={styles.brandMax}>Max</Text>
          </View>
        </TouchableOpacity>
        <SettingsButton onPress={() => navigation.navigate('Profile')} />
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Image Upload Area */}
        <View style={styles.uploadContainer}>
          {latestScan?.front_image_path ? (
            // Show latest scan image with overlay
            <TouchableOpacity 
              style={styles.scanImageArea}
              onPress={handleScanCardPress}
              activeOpacity={0.9}
            >
              <Image 
                source={{ uri: latestScan.front_image_path }}
                style={styles.scanPreviewImage}
                resizeMode="cover"
              />
              {/* Gradient overlay for text readability */}
              <View style={styles.scanImageOverlay} />
              
              {/* Body fat percentage - top right */}
              <View style={styles.percentageOverlay}>
                <Text style={styles.percentageOverlayValue}>
                  {latestScan.body_fat_percentage ? Math.round(latestScan.body_fat_percentage * 10) / 10 : '--'}%
                </Text>
                <Text style={styles.percentageOverlayLabel}>Body Fat</Text>
              </View>
              
              {/* Date - bottom right */}
              <View style={styles.dateOverlay}>
                <Text style={styles.dateOverlayText}>
                  {new Date(latestScan.scan_date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            // Show empty upload area
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
          )}

          {/* Scan Button */}
          <TouchableOpacity 
            style={styles.scanButton} 
            activeOpacity={0.8}
            onPress={handleScanPress}
          >
            <Text style={styles.scanButtonText}>{latestScan ? 'New Scan' : 'Scan'}</Text>
          </TouchableOpacity>
        </View>

        {/* Body Scan Card - Only show if there's a scan */}
        {latestScan && (
          <View style={styles.scanSection}>
            <Text style={styles.sectionTitle}>Latest Body Scan</Text>
            <BodyScanCard 
              scanData={latestScan}
              onPress={handleScanCardPress}
              onDelete={handleDeleteScan}
            />
          </View>
        )}

        {/* Calorie Card - Same as Nutrition tab */}
        <View style={styles.calorieSection}>
          <DailyCalorieCard
            caloriesConsumed={totalCalories}
            dailyTarget={profile?.daily_calorie_target || 2000}
            bonusCalories={exerciseCalories}
          />
        </View>
      </ScrollView>

      {/* Scan Tutorial Modal */}
      <ScanTutorialModal
        visible={showScanModal}
        onClose={() => setShowScanModal(false)}
        onComplete={handleScanComplete}
      />
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
  scanSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calorieSection: {
    marginTop: Spacing.lg,
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
  scanImageArea: {
    width: width - Spacing.lg * 2,
    aspectRatio: 0.85,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  scanPreviewImage: {
    width: '100%',
    height: '100%',
  },
  scanImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  percentageOverlay: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    alignItems: 'flex-end',
  },
  percentageOverlayValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 36,
    color: Colors.dark.primary,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  percentageOverlayLabel: {
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
    bottom: Spacing.md,
    right: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  dateOverlayText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
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

