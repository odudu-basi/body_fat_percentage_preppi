import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const { width } = Dimensions.get('window');

// Tab Icons as simple components
const HomeIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.homeIcon, focused && styles.homeIconFocused]}>
      <View style={[styles.homeRoof, focused && styles.homeRoofFocused]} />
      <View style={[styles.homeBody, focused && styles.homeBodyFocused]} />
    </View>
  </View>
);

const ProgressIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <View style={styles.progressIcon}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.progressBar,
            { height: 12 + i * 6 },
            focused && styles.progressBarFocused,
          ]}
        />
      ))}
    </View>
  </View>
);

const DailyIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.dailyIcon, focused && styles.dailyIconFocused]}>
      {/* Checkmark */}
      <View style={[styles.checkmarkShort, focused && styles.checkmarkFocused]} />
      <View style={[styles.checkmarkLong, focused && styles.checkmarkFocused]} />
    </View>
  </View>
);

const FeedbackIcon = ({ focused }) => (
  <View style={styles.iconContainer}>
    <Ionicons 
      name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} 
      size={24} 
      color={focused ? Colors.dark.textPrimary : Colors.dark.textSecondary} 
    />
  </View>
);

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const getIcon = (routeName, focused) => {
    switch (routeName) {
      case 'Home':
        return <HomeIcon focused={focused} />;
      case 'Daily':
        return <DailyIcon focused={focused} />;
      case 'Progress':
        return <ProgressIcon focused={focused} />;
      case 'Feedback':
        return <FeedbackIcon focused={focused} />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.container}>
        {/* Logo Button on Left - navigates to Buddy */}
        <TouchableOpacity 
          style={styles.logoButton} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Buddy')}
        >
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Tab Items Container on Right */}
        <View style={styles.tabsContainer}>
          {state.routes
            .filter((route) => route.name !== 'Buddy') // Hide Buddy from tabs
            .map((route, index) => {
              const { options } = descriptors[route.key];
              const label = options.tabBarLabel ?? options.title ?? route.name;
              const actualIndex = state.routes.findIndex((r) => r.name === route.name);
              const isFocused = state.index === actualIndex;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel}
                  onPress={onPress}
                  style={[styles.tabItem, isFocused && styles.tabItemFocused]}
                  activeOpacity={0.7}
                >
                  {getIcon(route.name, isFocused)}
                  <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
    </View>
  );
};

const TAB_BAR_HEIGHT = 64;
const LOGO_SIZE = 80;

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoButton: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  logoImage: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tabsContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    height: TAB_BAR_HEIGHT,
    // Glassmorphic border
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  tabItemFocused: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  tabLabel: {
    fontFamily: 'Rubik_500Medium',
    fontSize: 11,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  tabLabelFocused: {
    color: Colors.dark.textPrimary,
  },
  iconContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Home Icon
  homeIcon: {
    width: 22,
    height: 20,
    position: 'relative',
  },
  homeRoof: {
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.dark.textSecondary,
    position: 'absolute',
    top: 0,
  },
  homeRoofFocused: {
    borderBottomColor: Colors.dark.textPrimary,
  },
  homeBody: {
    width: 16,
    height: 10,
    backgroundColor: Colors.dark.textSecondary,
    position: 'absolute',
    bottom: 0,
    left: 3,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  homeBodyFocused: {
    backgroundColor: Colors.dark.textPrimary,
  },
  // Progress Icon
  progressIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 24,
    gap: 3,
  },
  progressBar: {
    width: 6,
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 2,
  },
  progressBarFocused: {
    backgroundColor: Colors.dark.textPrimary,
  },
  // Daily Icon (Checkmark)
  dailyIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dailyIconFocused: {},
  checkmarkShort: {
    position: 'absolute',
    width: 3,
    height: 10,
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 1.5,
    transform: [{ rotate: '-45deg' }],
    left: 5,
    top: 10,
  },
  checkmarkLong: {
    position: 'absolute',
    width: 3,
    height: 16,
    backgroundColor: Colors.dark.textSecondary,
    borderRadius: 1.5,
    transform: [{ rotate: '45deg' }],
    right: 5,
    top: 4,
  },
  checkmarkFocused: {
    backgroundColor: Colors.dark.textPrimary,
  },
});

export default CustomTabBar;

