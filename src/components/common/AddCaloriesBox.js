import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const AddCaloriesBox = ({ onDescribe, onPhoto }) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handlePress = () => {
    console.log('[AddCaloriesBox] Opening modal');
    setModalVisible(true);
  };

  const handleDescribe = () => {
    console.log('[AddCaloriesBox] Describe pressed, closing modal');
    setModalVisible(false);
    // Add small delay to ensure modal is fully closed before callback
    setTimeout(() => {
      console.log('[AddCaloriesBox] Calling onDescribe callback');
      onDescribe?.();
    }, 300);
  };

  const handlePhoto = () => {
    console.log('[AddCaloriesBox] Photo pressed, closing modal');
    setModalVisible(false);
    // Add small delay to ensure modal is fully closed before callback
    setTimeout(() => {
      console.log('[AddCaloriesBox] Calling onPhoto callback');
      onPhoto?.();
    }, 300);
  };

  return (
    <>
      {/* Add Calories Box */}
      <TouchableOpacity 
        style={styles.container} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="add" size={32} color={Colors.dark.primary} />
        </View>
        <Text style={styles.title}>Add your calories</Text>
        <Text style={styles.subtitle}>Log your meals and snacks</Text>
      </TouchableOpacity>

      {/* Modal with options */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>How would you like to add?</Text>
            
            {/* Describe Option */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handleDescribe}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.15)' }]}>
                <Ionicons name="create-outline" size={28} color="#4CAF50" />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Describe</Text>
                <Text style={styles.optionSubtitle}>Type what you ate</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>

            {/* Photo Option */}
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={handlePhoto}
              activeOpacity={0.8}
            >
              <View style={[styles.optionIcon, { backgroundColor: 'rgba(232, 93, 4, 0.15)' }]}>
                <Ionicons name="camera-outline" size={28} color={Colors.dark.primary} />
              </View>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>Photo</Text>
                <Text style={styles.optionSubtitle}>Scan your meal</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={Colors.dark.textSecondary} />
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.dark.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  optionTitle: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  optionSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  cancelText: {
    fontFamily: 'Rubik_500Medium',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
  },
});

export default AddCaloriesBox;

