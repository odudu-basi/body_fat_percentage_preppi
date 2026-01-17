import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';
import ChecklistItem from './ChecklistItem';

const DailyChecklist = () => {
  const [checkedItems, setCheckedItems] = useState({});

  const checklistItems = [
    {
      id: 'water',
      title: 'Drink 8 glasses of water',
      subtitle: 'Stay hydrated throughout the day',
      icon: 'water',
      iconColor: '#2196F3', // Blue
    },
    {
      id: 'workout',
      title: 'Complete your workout',
      subtitle: '45 min strength training',
      icon: 'barbell',
      iconColor: '#E85D04', // Orange from design.md
    },
    {
      id: 'protein',
      title: 'Hit your protein goal',
      subtitle: '120g protein target',
      icon: 'nutrition',
      iconColor: '#4CAF50', // Green
    },
    {
      id: 'sleep',
      title: 'Get 7-8 hours of sleep',
      subtitle: 'Rest and recovery is key',
      icon: 'moon',
      iconColor: '#9C27B0', // Purple
    },
    {
      id: 'steps',
      title: 'Walk 10,000 steps',
      subtitle: 'Keep moving throughout the day',
      icon: 'footsteps',
      iconColor: '#FF9800', // Amber
    },
    {
      id: 'meals',
      title: 'Log all your meals',
      subtitle: 'Track your nutrition intake',
      icon: 'restaurant',
      iconColor: '#F44336', // Red
    },
  ];

  const toggleItem = (id) => {
    setCheckedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = checklistItems.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressHeader}>
        <View style={styles.progressTextContainer}>
          <Text style={styles.progressTitle}>Today's Goals</Text>
          <Text style={styles.progressSubtitle}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressPercent}>{progressPercent}%</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarTrack}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressPercent}%` }
            ]} 
          />
        </View>
      </View>

      {/* Checklist Items - sorted with unchecked first, checked at bottom */}
      <View style={styles.checklistContainer}>
        {[...checklistItems]
          .sort((a, b) => {
            const aChecked = checkedItems[a.id] || false;
            const bChecked = checkedItems[b.id] || false;
            if (aChecked === bChecked) return 0;
            return aChecked ? 1 : -1;
          })
          .map((item) => (
            <ChecklistItem
              key={item.id}
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              iconColor={item.iconColor}
              isChecked={checkedItems[item.id] || false}
              onPress={() => toggleItem(item.id)}
            />
          ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  progressSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  progressBadge: {
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  progressPercent: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.md,
    color: '#FFFFFF',
  },
  progressBarContainer: {
    marginBottom: Spacing.lg,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: Colors.dark.surface,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 4,
  },
  checklistContainer: {
    flex: 1,
  },
});

export default DailyChecklist;

