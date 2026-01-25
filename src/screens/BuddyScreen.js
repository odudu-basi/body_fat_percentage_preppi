import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Spacing } from '../constants/theme';
import ChatCard from '../components/common/ChatCard';
import SuggestionCard from '../components/common/SuggestionCard';
import SettingsButton from '../components/common/SettingsButton';

const BuddyScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const handleAskAnything = () => {
    // Navigate to chat screen
    navigation.navigate('BuddyChat', {});
  };

  const handleSuggestionPress = (suggestion) => {
    // Navigate to chat with pre-filled message
    navigation.navigate('BuddyChat', { initialMessage: suggestion });
  };

  const suggestions = [
    {
      id: 1,
      title: 'Make me a meal plan to lose weight.',
      icon: '🥗',
      backgroundColor: '#2E7D32', // Green for healthy food/meal plan
    },
    {
      id: 2,
      title: 'How can I lose face fat?',
      icon: '😊',
      backgroundColor: '#7B1FA2', // Purple for face/beauty
    },
    {
      id: 3,
      title: 'How can I gain more muscle during my cut?',
      icon: '💪',
      backgroundColor: '#1565C0', // Blue for strength/muscle
    },
    {
      id: 4,
      title: 'Give me advice on my relationship.',
      icon: '❤️',
      backgroundColor: '#D81B60', // Pink for love/relationships
    },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.md }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Chat with Buddy </Text>
          <Image 
            source={require('../../assets/logo.png')} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
        <SettingsButton onPress={() => navigation.navigate('Profile')} />
      </View>

      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Ask Me Anything Card */}
        <ChatCard
          icon={require('../../assets/logo.png')}
          title="Ask me anything"
          onPress={handleAskAnything}
          gradientColors={['#E85D04', '#F26419']}
        />

        {/* Hey Buddy Section */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>Hey Buddy...?</Text>
          
          {/* Suggestion Cards */}
          {suggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              title={suggestion.title}
              icon={suggestion.icon}
              backgroundColor={suggestion.backgroundColor}
              onPress={() => handleSuggestionPress(suggestion.title)}
            />
          ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
  },
  headerLogo: {
    width: 60,
    height: 60,
    marginLeft: -12,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140, // Extra padding for glassmorphic tab bar
  },
  suggestionsSection: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.md,
  },
});

export default BuddyScreen;

