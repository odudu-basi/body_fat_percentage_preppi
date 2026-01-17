/**
 * Theme constants for BodyMax app
 * Based on design.md specifications
 */

export const Colors = {
  // Light Theme
  light: {
    primary: '#E85D04',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
  },
  // Dark Theme
  dark: {
    primary: '#F26419',
    background: '#121212',
    surface: '#1E1E1E',
    textPrimary: '#F5F5F5',
    textSecondary: '#A0A0A0',
  },
};

export const Fonts = {
  // Font families - loaded via expo-google-fonts
  families: {
    inter: {
      regular: 'Inter_400Regular',
      medium: 'Inter_500Medium',
      semiBold: 'Inter_600SemiBold',
      bold: 'Inter_700Bold',
    },
    rubik: {
      regular: 'Rubik_400Regular',
      medium: 'Rubik_500Medium',
      semiBold: 'Rubik_600SemiBold',
      bold: 'Rubik_700Bold',
    },
  },
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    display: 48,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};

export default {
  Colors,
  Fonts,
  Spacing,
  BorderRadius,
  Shadows,
};

