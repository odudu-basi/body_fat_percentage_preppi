import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';

const SettingsButton = ({ 
  onPress, 
  size = 24, 
  color = Colors.dark.textPrimary,
  showBackground = true,
}) => {
  return (
    <TouchableOpacity 
      style={[
        styles.button,
        showBackground && styles.buttonWithBackground,
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name="settings-outline" size={size} color={color} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonWithBackground: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
  },
});

export default SettingsButton;

