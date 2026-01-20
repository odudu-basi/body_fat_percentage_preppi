import React, { useState } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSubscription } from '../../context/SubscriptionContext';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const RestorePurchasesButton = ({ style }) => {
  const { restorePurchases, isLoading } = useSubscription();
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);

    Alert.alert(
      result.success ? 'Success!' : 'Restore Failed',
      result.message
    );
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={handleRestore}
      disabled={restoring || isLoading}
      activeOpacity={0.7}
    >
      {restoring ? (
        <ActivityIndicator size="small" color={Colors.dark.primary} />
      ) : (
        <Text style={styles.text}>Restore Purchases</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
    textDecorationLine: 'underline',
  },
});

export default RestorePurchasesButton;

