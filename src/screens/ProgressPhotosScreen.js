import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { getBodyScans, deleteBodyScan, saveBodyScan } from '../services/bodyScanStorage';
import BodyScanCard from '../components/common/BodyScanCard';
import { useAuth } from '../context/AuthContext';
import LoadingIndicator from '../components/common/LoadingIndicator';

const ProgressPhotosScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);

  const loadScans = async () => {
    try {
      const allScans = await getBodyScans();
      setScans(allScans);
    } catch (error) {
      console.error('Error loading scans:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load scans when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadScans();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadScans();
  };

  const handleScanPress = (scan) => {
    // Just show the photo in a simple view, no complex scan details
    navigation.navigate('ScanDetails', { scanData: scan });
  };

  const handleDeleteScan = async (scanId) => {
    const success = await deleteBodyScan(scanId);
    if (success) {
      setScans((prev) => prev.filter((scan) => scan.id !== scanId));
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take progress photos.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsTakingPhoto(true);

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const photoUri = result.assets[0].uri;

        // Get current weight from profile
        const currentWeightKg = profile?.weight_kg || 0;
        const currentWeightLbs = Math.round(currentWeightKg * 2.20462);

        // Save the photo with current weight
        const scanData = {
          front_image_path: photoUri,
          side_image_path: null, // No side photo needed
          weight_kg: currentWeightKg,
          weight_lbs: currentWeightLbs,
          body_fat_percentage: null, // No body fat analysis
          confidence_level: null,
          confidence_low: null,
          confidence_high: null,
          height_cm: profile?.height_cm || 0,
          age: profile?.age || 0,
          gender: profile?.gender || 'male',
          bmi: null,
          ai_analysis: null,
          front_observations: null,
          side_observations: null,
          primary_indicators: null,
          biometric_notes: null,
        };

        await saveBodyScan(scanData);

        // Reload scans to show the new photo
        await loadScans();

        Alert.alert(
          'Progress Photo Saved',
          `Photo saved with your current weight: ${currentWeightLbs} lbs`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(
        'Error',
        'Failed to take photo. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTakingPhoto(false);
    }
  };

  const renderScanItem = ({ item, index }) => (
    <View style={[styles.cardWrapper, index === 0 && styles.firstCard]}>
      <BodyScanCard
        scanData={item}
        onPress={() => handleScanPress(item)}
        onDelete={handleDeleteScan}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="camera-outline" size={64} color={Colors.dark.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Progress Photos Yet</Text>
      <Text style={styles.emptySubtitle}>
        Take your first progress photo to start tracking your journey
      </Text>
      <TouchableOpacity
        style={styles.startScanButton}
        onPress={handleTakePhoto}
        activeOpacity={0.8}
        disabled={isTakingPhoto}
      >
        {isTakingPhoto ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.startScanButtonText}>Take Photo</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color={Colors.dark.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress Photos</Text>
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={handleTakePhoto}
          activeOpacity={0.7}
          disabled={isTakingPhoto}
        >
          {isTakingPhoto ? (
            <ActivityIndicator color={Colors.dark.primary} size="small" />
          ) : (
            <Ionicons name="camera" size={24} color={Colors.dark.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Photo count */}
      {scans.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {scans.length} {scans.length === 1 ? 'photo' : 'photos'} total
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <LoadingIndicator text="Loading photos..." />
        </View>
      ) : (
        <FlatList
          data={scans}
          renderItem={renderScanItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            scans.length === 0 && styles.emptyListContent,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.dark.primary}
              colors={[Colors.dark.primary]}
            />
          }
        />
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  headerRight: {
    width: 40,
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  countText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl + 100, // Account for tab bar
  },
  emptyListContent: {
    flex: 1,
  },
  cardWrapper: {
    marginBottom: Spacing.md,
  },
  firstCard: {
    marginTop: Spacing.sm,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  startScanButton: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  startScanButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
});

export default ProgressPhotosScreen;
