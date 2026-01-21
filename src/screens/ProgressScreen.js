import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { getBodyScans } from '../services/bodyScanStorage';
import SettingsButton from '../components/common/SettingsButton';
import { getWeeklyNutritionData } from '../services/mealStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Time period options for the chart
const TIME_PERIODS = ['This wk', 'Last wk', '2 wk ago', '3 wk ago'];

/**
 * Get the Sunday of a specific week
 * @param {number} weeksAgo - 0 for this week, 1 for last week, etc.
 * @returns {Date} - The Sunday of that week
 */
const getWeekStartDate = (weeksAgo = 0) => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - dayOfWeek - (weeksAgo * 7));
  sunday.setHours(0, 0, 0, 0);
  return sunday;
};

const ProgressScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedPeriod, setSelectedPeriod] = useState('This wk');
  const [recentScans, setRecentScans] = useState([]);
  const [weeklyData, setWeeklyData] = useState(null);
  const [previousWeekData, setPreviousWeekData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map period to weeks ago
  const getWeeksAgo = (period) => {
    switch (period) {
      case 'This wk': return 0;
      case 'Last wk': return 1;
      case '2 wk ago': return 2;
      case '3 wk ago': return 3;
      default: return 0;
    }
  };

  // Load data when screen comes into focus or period changes
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setLoading(true);
        try {
          // Load recent scans
          const allScans = await getBodyScans();
          setRecentScans(allScans.slice(0, 3));

          // Load weekly nutrition data for selected period
          const weeksAgo = getWeeksAgo(selectedPeriod);
          const weekStart = getWeekStartDate(weeksAgo);
          const data = await getWeeklyNutritionData(weekStart);
          setWeeklyData(data);

          // Load previous week's data for comparison
          const prevWeekStart = getWeekStartDate(weeksAgo + 1);
          const prevData = await getWeeklyNutritionData(prevWeekStart);
          setPreviousWeekData(prevData);
        } catch (error) {
          console.error('Error loading progress data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadData();
    }, [selectedPeriod])
  );

  // Get chart data
  const chartData = weeklyData?.dailyData || [
    { day: 'Sun', protein: 0, carbs: 0, fats: 0 },
    { day: 'Mon', protein: 0, carbs: 0, fats: 0 },
    { day: 'Tue', protein: 0, carbs: 0, fats: 0 },
    { day: 'Wed', protein: 0, carbs: 0, fats: 0 },
    { day: 'Thu', protein: 0, carbs: 0, fats: 0 },
    { day: 'Fri', protein: 0, carbs: 0, fats: 0 },
    { day: 'Sat', protein: 0, carbs: 0, fats: 0 },
  ];

  // Calculate daily average
  const dailyAverage = weeklyData?.averageCalories || 0;

  // Calculate percentage change
  const calculatePercentageChange = () => {
    const currentAvg = weeklyData?.averageCalories || 0;
    const previousAvg = previousWeekData?.averageCalories || 0;
    
    if (previousAvg === 0) {
      return currentAvg > 0 ? { value: 100, isPositive: true } : { value: 0, isPositive: true };
    }
    
    const change = ((currentAvg - previousAvg) / previousAvg) * 100;
    return {
      value: Math.abs(Math.round(change)),
      isPositive: change >= 0,
    };
  };

  const percentageChange = calculatePercentageChange();

  // Find max value for chart scaling
  const maxCalories = Math.max(
    ...chartData.map(day => (day.protein * 4) + (day.carbs * 4) + (day.fats * 9)),
    100 // Minimum scale
  );
  const chartMax = Math.ceil(maxCalories / 250) * 250 || 1000;

  const handleProgressPhotosPress = () => {
    navigation.navigate('ProgressPhotos');
  };

  const hasPhotos = recentScans.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
      <Text style={styles.title}>Progress</Text>
          <SettingsButton onPress={() => navigation.navigate('Profile')} />
        </View>

        {/* Progress Photos Card */}
        <TouchableOpacity
          style={styles.progressPhotosCard}
          onPress={handleProgressPhotosPress}
          activeOpacity={0.8}
        >
          {/* Header with title and See all */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Progress Photos</Text>
            {hasPhotos && (
              <TouchableOpacity onPress={handleProgressPhotosPress} activeOpacity={0.7}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Photos row */}
          <View style={styles.photosRow}>
            {/* Upload button - always first */}
            <TouchableOpacity
              style={styles.uploadPhotoBox}
              onPress={handleProgressPhotosPress}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={28} color={Colors.dark.textSecondary} />
              <Text style={styles.uploadPhotoText}>Upload</Text>
              <Text style={styles.uploadPhotoText}>Photo</Text>
            </TouchableOpacity>

            {/* Recent scan photos */}
            {hasPhotos ? (
              // Show up to 3 recent photos
              recentScans.map((scan, index) => (
                <TouchableOpacity
                  key={scan.id}
                  style={styles.photoThumbnail}
                  onPress={() => navigation.navigate('ScanDetails', { scanData: scan })}
                  activeOpacity={0.8}
                >
                  {scan.front_image_path ? (
                    <Image
                      source={{ uri: scan.front_image_path }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <Ionicons name="body-outline" size={32} color={Colors.dark.textSecondary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              // Empty state - show placeholder with text
              <View style={styles.emptyPhotosContainer}>
                <View style={styles.emptyPhotoPlaceholder}>
                  <View style={styles.torsoIcon}>
                    <View style={styles.torsoHead} />
                    <View style={styles.torsoBody} />
                    <View style={styles.torsoArm} />
                  </View>
                </View>
                <Text style={styles.emptyPhotosText}>
                  Want to add a photo to track your progress?
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Daily Average Calories Card */}
        <View style={styles.caloriesCard}>
          <Text style={styles.cardTitle}>Daily Average Calories</Text>
          
          {/* Average display */}
          <View style={styles.averageContainer}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.dark.primary} />
            ) : (
              <>
                <Text style={styles.averageValue}>{dailyAverage}</Text>
                <Text style={styles.averageUnit}>cals</Text>
                {percentageChange.value > 0 && (
                  <View style={styles.changeIndicator}>
                    <Ionicons 
                      name={percentageChange.isPositive ? "arrow-up" : "arrow-down"} 
                      size={14} 
                      color={percentageChange.isPositive ? "#4CAF50" : "#F44336"} 
                    />
                    <Text style={[
                      styles.changeText,
                      { color: percentageChange.isPositive ? "#4CAF50" : "#F44336" }
                    ]}>
                      {percentageChange.value}%
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {/* Y-axis labels */}
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>{chartMax.toLocaleString()}</Text>
              <Text style={styles.yAxisLabel}>{(chartMax * 0.75).toLocaleString()}</Text>
              <Text style={styles.yAxisLabel}>{(chartMax * 0.5).toLocaleString()}</Text>
              <Text style={styles.yAxisLabel}>{(chartMax * 0.25).toLocaleString()}</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>

            {/* Chart area */}
            <View style={styles.chartArea}>
              {/* Grid lines */}
              <View style={styles.gridLines}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.gridLine} />
                ))}
              </View>

              {/* Bars */}
              <View style={styles.barsContainer}>
                {chartData.map((day, index) => {
                  const totalCals = (day.protein * 4) + (day.carbs * 4) + (day.fats * 9);
                  const proteinHeight = chartMax > 0 ? ((day.protein * 4) / chartMax) * 100 : 0;
                  const carbsHeight = chartMax > 0 ? ((day.carbs * 4) / chartMax) * 100 : 0;
                  const fatsHeight = chartMax > 0 ? ((day.fats * 9) / chartMax) * 100 : 0;

                  return (
                    <View key={index} style={styles.barColumn}>
                      <View style={styles.stackedBar}>
                        {totalCals > 0 && (
                          <>
                            {/* Fats (top - coral/red) */}
                            <View
                              style={[
                                styles.barSegment,
                                styles.fatsBar,
                                { height: `${fatsHeight}%` },
                              ]}
                            />
                            {/* Carbs (middle - orange) */}
                            <View
                              style={[
                                styles.barSegment,
                                styles.carbsBar,
                                { height: `${carbsHeight}%` },
                              ]}
                            />
                            {/* Protein (bottom - blue) */}
                            <View
                              style={[
                                styles.barSegment,
                                styles.proteinBar,
                                { height: `${proteinHeight}%` },
                              ]}
                            />
                          </>
                        )}
                      </View>
                      <Text style={styles.dayLabel}>{day.day}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendContainer}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#5B9BD5' }]} />
              <Text style={styles.legendText}>Protein</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#F4A460' }]} />
              <Text style={styles.legendText}>Carbs</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E57373' }]} />
              <Text style={styles.legendText}>Fats</Text>
            </View>
          </View>

          {/* Time period selector */}
          <View style={styles.periodSelector}>
            {TIME_PERIODS.map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive,
                ]}
                onPress={() => setSelectedPeriod(period)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodButtonText,
                    selectedPeriod === period && styles.periodButtonTextActive,
                  ]}
                >
                  {period}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const PHOTO_SIZE = 85;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120, // Account for tab bar
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
  },

  // Progress Photos Card
  progressPhotosCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  seeAllText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
  photosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  uploadPhotoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE + 20,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.textSecondary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  uploadPhotoText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  photoThumbnail: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE + 20,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.dark.background,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.background,
  },
  // Empty state
  emptyPhotosContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  emptyPhotoPlaceholder: {
    width: 60,
    height: 80,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  torsoIcon: {
    alignItems: 'center',
    position: 'relative',
  },
  torsoHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.textSecondary,
    marginBottom: 3,
  },
  torsoBody: {
    width: 20,
    height: 30,
    backgroundColor: Colors.dark.textSecondary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  torsoArm: {
    position: 'absolute',
    top: 18,
    right: -10,
    width: 16,
    height: 5,
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 2,
    transform: [{ rotate: '-45deg' }],
  },
  emptyPhotosText: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    lineHeight: 20,
  },

  // Calories Card
  caloriesCard: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  averageContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  averageValue: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 48,
    color: Colors.dark.textPrimary,
  },
  averageUnit: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textSecondary,
    marginLeft: Spacing.xs,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  changeText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    marginLeft: 2,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    height: 200,
    marginBottom: Spacing.md,
  },
  yAxisLabels: {
    width: 45,
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  yAxisLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: Colors.dark.textSecondary,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    marginLeft: Spacing.sm,
    position: 'relative',
  },
  gridLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: Colors.dark.textSecondary,
    opacity: 0.2,
    borderStyle: 'dashed',
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  stackedBar: {
    width: 24,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barSegment: {
    width: '100%',
  },
  proteinBar: {
    backgroundColor: '#5B9BD5', // Blue
  },
  carbsBar: {
    backgroundColor: '#F4A460', // Sandy brown/orange
  },
  fatsBar: {
    backgroundColor: '#E57373', // Coral/red
  },
  dayLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },

  // Legend
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.xs,
  },
  legendText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textPrimary,
  },

  // Period Selector
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  periodButtonActive: {
    backgroundColor: Colors.dark.surface,
  },
  periodButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.dark.textPrimary,
  },
});

export default ProgressScreen;
