import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { sendFeedbackEmail } from '../services/feedback';

const FEEDBACK_TYPES = [
  { id: 'bug', label: 'Bug Report', icon: 'bug', color: '#F44336' },
  { id: 'feature', label: 'Feature Request', icon: 'bulb', color: '#FF9800' },
  { id: 'improvement', label: 'Improvement', icon: 'trending-up', color: '#4CAF50' },
  { id: 'other', label: 'Other', icon: 'chatbubble', color: '#2196F3' },
];

const FeedbackScreen = () => {
  const insets = useSafeAreaInsets();
  const [selectedType, setSelectedType] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('Select Type', 'Please select a feedback type.');
      return;
    }
    if (!feedback.trim()) {
      Alert.alert('Enter Feedback', 'Please enter your feedback.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Send feedback email via Resend
      await sendFeedbackEmail({
        type: selectedType,
        message: feedback.trim(),
        userEmail: email.trim() || null,
      });

      setIsSubmitting(false);
      Alert.alert(
        'Thank You! 🎉',
        'Your feedback has been submitted. We really appreciate you taking the time to help us improve BodyMaxx!',
        [
          {
            text: 'OK',
            onPress: () => {
              setSelectedType(null);
              setFeedback('');
              setEmail('');
            },
          },
        ]
      );
    } catch (error) {
      setIsSubmitting(false);
      console.error('Failed to submit feedback:', error);
      Alert.alert(
        'Submission Failed',
        'We couldn\'t submit your feedback right now. Please try again or email us directly at oduduabasiav@gmail.com',
        [
          {
            text: 'Try Again',
            onPress: handleSubmit,
          },
          {
            text: 'Email Instead',
            onPress: handleEmailSupport,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleEmailSupport = () => {
    const subject = encodeURIComponent('BodyMaxx Feedback');
    const body = encodeURIComponent(`Type: ${selectedType || 'General'}\n\nFeedback:\n${feedback}`);
    Linking.openURL(`mailto:oduduabasiav@gmail.com?subject=${subject}&body=${body}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={[styles.scrollView, { paddingTop: insets.top + Spacing.md }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Feedback</Text>
          <Text style={styles.subtitle}>
            Help us make BodyMaxx better! Your feedback is incredibly valuable.
          </Text>
        </View>

        {/* Feedback Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's this about?</Text>
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.typeCard,
                  selectedType === type.id && styles.typeCardSelected,
                  selectedType === type.id && { borderColor: type.color },
                ]}
                onPress={() => setSelectedType(type.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIconContainer, { backgroundColor: `${type.color}20` }]}>
                  <Ionicons name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelSelected,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Feedback Text */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us more</Text>
          <TextInput
            style={styles.feedbackInput}
            placeholder="Describe your feedback, bug, or idea in detail..."
            placeholderTextColor={Colors.dark.textSecondary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedback}
            onChangeText={setFeedback}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{feedback.length}/1000</Text>
        </View>

        {/* Email (Optional) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Email (optional)</Text>
          <Text style={styles.sectionSubtitle}>
            So we can follow up if needed
          </Text>
          <TextInput
            style={styles.emailInput}
            placeholder="your@email.com"
            placeholderTextColor={Colors.dark.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedType || !feedback.trim()) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!selectedType || !feedback.trim() || isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <Text style={styles.submitButtonText}>Sending...</Text>
          ) : (
            <>
              <Ionicons name="send" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit Feedback</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Alternative Contact */}
        <View style={styles.alternativeSection}>
          <Text style={styles.alternativeText}>
            Prefer email? Reach us at
          </Text>
          <TouchableOpacity onPress={handleEmailSupport} activeOpacity={0.7}>
            <Text style={styles.emailLink}>oduduabasiav@gmail.com</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },
  header: {
    marginBottom: Spacing.xl,
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
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeCard: {
    width: '48%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeCardSelected: {
    backgroundColor: 'rgba(232, 93, 4, 0.1)',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  typeLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  typeLabelSelected: {
    color: Colors.dark.textPrimary,
  },
  feedbackInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    minHeight: 150,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  charCount: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  emailInput: {
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.dark.surface,
    opacity: 0.6,
  },
  submitButtonText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  alternativeSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  alternativeText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  emailLink: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
    marginTop: Spacing.xs,
  },
});

export default FeedbackScreen;
