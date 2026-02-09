import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const NameScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const [name, setName] = useState('');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleNext = () => {
    if (name.trim()) {
      // Navigate to gender screen with accumulated data
      navigation.navigate('Gender', {
        ...route.params,
        name: name.trim(),
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.inner, { paddingTop: insets.top + Spacing.md }]}>
          {/* Header */}
          <View style={styles.header}>
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color={Colors.dark.textPrimary} />
            </TouchableOpacity>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: '6%' }]} />
              </View>
            </View>

            {/* Language Selector */}
            <View style={styles.languageSelector}>
              <Text style={styles.languageFlag}>🇺🇸</Text>
              <Text style={styles.languageCode}>EN</Text>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              Let's personalize your experience and make your journey more engaging.
            </Text>

            {/* Name Input */}
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor={Colors.dark.textSecondary}
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={handleNext}
            />
          </View>

          {/* Next Button (appears when name is entered) */}
          {name.trim().length > 0 && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Next</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.dark.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  languageFlag: {
    fontSize: 20,
  },
  languageCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xxxl,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl * 2,
  },
  input: {
    width: '100%',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    fontFamily: 'Inter_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
  nextButton: {
    width: '100%',
    backgroundColor: Colors.dark.primary,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
});

export default NameScreen;
