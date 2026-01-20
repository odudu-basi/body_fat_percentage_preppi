import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Colors, Fonts, Spacing, BorderRadius } from '../constants/theme';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { signInApple, signInDevMode, appleSignInAvailable, loading, isDevMode } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Auto sign-in in dev mode
  useEffect(() => {
    if (isDevMode) {
      console.log('🔧 DEV MODE: Auto-signing in...');
      const autoSignIn = async () => {
        setIsSigningIn(true);
        // Pass all onboarding data from route params
        await signInDevMode(route.params || {});
        setIsSigningIn(false);
      };
      autoSignIn();
    }
  }, [isDevMode]);

  const handleAppleSignIn = async () => {
    if (!appleSignInAvailable) {
      Alert.alert(
        'Not Available',
        'Sign in with Apple is not available on this device.',
        [{ text: 'OK' }]
      );
      return;
    }

    setIsSigningIn(true);
    try {
      // Pass all onboarding data from route params
      const { data, error } = await signInApple(route.params || {});

      if (error) {
        if (error.message !== 'Sign in was canceled') {
          Alert.alert(
            'Sign In Failed',
            error.message || 'An error occurred during sign in. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
      // If successful, the AuthContext will update and navigation will handle the rest
    } catch (error) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Logo and Branding */}
      <View style={styles.brandingContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>BodyMax</Text>
        <Text style={styles.tagline}>Your AI-powered fitness companion</Text>
      </View>

      {/* Features Preview */}
      <View style={styles.featuresContainer}>
        <FeatureItem 
          icon="📊" 
          title="Track Body Composition" 
          description="AI-powered body fat analysis from photos"
        />
        <FeatureItem 
          icon="🍎" 
          title="Smart Nutrition" 
          description="Log meals with photo recognition"
        />
        <FeatureItem 
          icon="💪" 
          title="Personalized Routines" 
          description="Daily checklists tailored to your goals"
        />
        <FeatureItem 
          icon="🤖" 
          title="AI Buddy" 
          description="Get instant answers to fitness questions"
        />
      </View>

      {/* Sign In Button */}
      <View style={styles.authContainer}>
        {Platform.OS === 'ios' && appleSignInAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
            cornerRadius={BorderRadius.full}
            style={styles.appleButton}
            onPress={handleAppleSignIn}
          />
        ) : (
          <TouchableOpacity
            style={styles.signInButton}
            onPress={handleAppleSignIn}
            disabled={isSigningIn || loading}
            activeOpacity={0.8}
          >
            {isSigningIn || loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.signInButtonText}>Sign in with Apple</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.termsText}>
          By signing in, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  );
};

// Feature Item Component
const FeatureItem = ({ icon, title, description }) => (
  <View style={styles.featureItem}>
    <Text style={styles.featureIcon}>{icon}</Text>
    <View style={styles.featureTextContainer}>
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingHorizontal: Spacing.lg,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: Colors.dark.background,
    opacity: 0.8,
  },
  brandingContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl * 2,
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: Spacing.md,
  },
  appName: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 42,
    color: Colors.dark.textPrimary,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    // Orange accent on left
    borderLeftWidth: 4,
    borderLeftColor: Colors.dark.primary,
  },
  featureIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  authContainer: {
    paddingBottom: Spacing.xl,
  },
  appleButton: {
    width: '100%',
    height: 56,
    marginBottom: Spacing.md,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 56,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
    color: '#000000',
  },
  signInButtonText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: '#000000',
  },
  termsText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: Colors.dark.primary,
  },
});

export default LoginScreen;
