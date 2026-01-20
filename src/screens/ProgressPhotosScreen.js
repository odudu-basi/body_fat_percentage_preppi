import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { getBodyScans, deleteBodyScan } from '../services/bodyScanStorage';
import BodyScanCard from '../components/common/BodyScanCard';

const ProgressPhotosScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    navigation.navigate('ScanDetails', { scanData: scan });
  };

  const handleDeleteScan = async (scanId) => {
    const success = await deleteBodyScan(scanId);
    if (success) {
      setScans((prev) => prev.filter((scan) => scan.id !== scanId));
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
        <Ionicons name="body-outline" size={64} color={Colors.dark.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Body Scans Yet</Text>
      <Text style={styles.emptySubtitle}>
        Complete your first body scan to start tracking your progress
      </Text>
      <TouchableOpacity
        style={styles.startScanButton}
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        activeOpacity={0.8}
      >
        <Text style={styles.startScanButtonText}>Start a Scan</Text>
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
        <View style={styles.headerRight} />
      </View>

      {/* Scan count */}
      {scans.length > 0 && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {scans.length} {scans.length === 1 ? 'scan' : 'scans'} total
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.primary} />
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
