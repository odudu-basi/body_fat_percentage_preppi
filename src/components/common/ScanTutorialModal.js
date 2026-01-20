import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActionSheetIOS,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Fonts, Spacing, BorderRadius } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Hardcoded user profile - TODO: Connect to text fields later
const USER_PROFILE = {
  age: 22,
  heightFeet: 5,
  heightInches: 5,
  heightCm: 165.1, // 5'5" in cm
  ethnicity: 'black/african american',
  gender: 'male',
};

const ScanTutorialModal = ({ visible, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [frontPhoto, setFrontPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs'); // 'lbs' or 'kg'

  const steps = [
    {
      id: 'front',
      title: 'Front View',
      description: 'Take a photo of your torso from the front. Stand straight with arms slightly away from your body.',
      icon: 'body',
    },
    {
      id: 'side',
      title: 'Side View',
      description: 'Now take a photo of your torso from the side. Stand straight and relaxed.',
      icon: 'body',
    },
    {
      id: 'weight',
      title: 'Enter Your Weight',
      description: 'Please enter your current weight for accurate body fat analysis.',
      icon: 'scale',
    },
  ];

  const totalSteps = steps.length;
  const currentStepData = steps[currentStep];
  const isWeightStep = currentStep === 2;
  const isWeightValid = weight.trim() !== '' && !isNaN(parseFloat(weight)) && parseFloat(weight) > 0;

  // Request camera permissions
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please allow camera access to take photos for body scanning.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Request media library permissions
  const requestMediaLibraryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Photo Library Permission Required',
        'Please allow photo library access to select photos for body scanning.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  // Take photo with camera
  const takePhotoWithCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handlePhotoSelected(result.assets[0].uri);
    }
  };

  // Choose photo from library
  const chooseFromLibrary = async () => {
    const hasPermission = await requestMediaLibraryPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      handlePhotoSelected(result.assets[0].uri);
    }
  };

  // Handle photo selection - now just saves the photo, doesn't advance step
  const handlePhotoSelected = (uri) => {
    if (currentStep === 0) {
      setFrontPhoto(uri);
    } else if (currentStep === 1) {
      setSidePhoto(uri);
    }
  };

  // Handle continue button - advances to next step
  const handleContinue = () => {
    if (currentStep === 0 && frontPhoto) {
      setCurrentStep(1);
    } else if (currentStep === 1 && sidePhoto) {
      setCurrentStep(2); // Move to weight step
    }
  };

  // Check if current step has a photo
  const hasCurrentPhoto = (currentStep === 0 && frontPhoto) || (currentStep === 1 && sidePhoto);

  // Handle get results button press
  const handleGetResults = () => {
    if (isWeightValid) {
      handleComplete();
    }
  };

  // Show action sheet to choose between camera and library
  const handleTakePhoto = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Library'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhotoWithCamera();
          } else if (buttonIndex === 2) {
            chooseFromLibrary();
          }
        }
      );
    } else {
      // For Android, show an Alert with options
      Alert.alert(
        'Select Photo',
        'Choose how you want to add your photo',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhotoWithCamera },
          { text: 'Choose from Library', onPress: chooseFromLibrary },
        ]
      );
    }
  };

  const handleComplete = () => {
    // Convert weight to kg if needed for consistency
    const weightValue = parseFloat(weight);
    const weightInKg = weightUnit === 'lbs' ? weightValue * 0.453592 : weightValue;
    
    // Pass data to parent before closing
    onComplete?.({
      // Photos
      frontPhoto,
      sidePhoto,
      // Weight data
      weight: weightValue,
      weightUnit,
      weightInKg, // Always provide weight in kg for calculations
      // User profile (hardcoded for now)
      ...USER_PROFILE,
    });
    // Reset state and close
    setCurrentStep(0);
    setFrontPhoto(null);
    setSidePhoto(null);
    setWeight('');
    setWeightUnit('lbs');
    onClose();
  };

  const handleClose = () => {
    setCurrentStep(0);
    setFrontPhoto(null);
    setSidePhoto(null);
    setWeight('');
    setWeightUnit('lbs');
    onClose();
  };

  const toggleWeightUnit = () => {
    setWeightUnit(prev => prev === 'lbs' ? 'kg' : 'lbs');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.dark.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Body Scan</Text>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>{currentStep + 1}/{totalSteps}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${((currentStep + 1) / totalSteps) * 100}%` }
                ]} 
              />
            </View>
          </View>

          {/* Content */}
          <KeyboardAvoidingView 
            style={styles.content}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Title */}
              <Text style={styles.title}>{currentStepData.title}</Text>
              <Text style={styles.description}>{currentStepData.description}</Text>

              {/* Weight Input Step */}
              {isWeightStep ? (
                <View style={styles.weightInputContainer}>
                  {/* Photo thumbnails showing captured images */}
                  <View style={styles.photoThumbnails}>
                    <View style={styles.thumbnailWrapper}>
                      <Image source={{ uri: frontPhoto }} style={styles.thumbnail} />
                      <View style={styles.thumbnailCheck}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
                      </View>
                      <Text style={styles.thumbnailLabel}>Front</Text>
                    </View>
                    <View style={styles.thumbnailWrapper}>
                      <Image source={{ uri: sidePhoto }} style={styles.thumbnail} />
                      <View style={styles.thumbnailCheck}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.dark.primary} />
                      </View>
                      <Text style={styles.thumbnailLabel}>Side</Text>
                    </View>
                  </View>

                  {/* Weight Input */}
                  <View style={styles.weightInputWrapper}>
                    <View style={styles.scaleIconContainer}>
                      <Ionicons name="scale-outline" size={32} color={Colors.dark.primary} />
                    </View>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={styles.weightInput}
                        placeholder="Enter weight"
                        placeholderTextColor={Colors.dark.textSecondary}
                        keyboardType="decimal-pad"
                        value={weight}
                        onChangeText={setWeight}
                        maxLength={6}
                      />
                      <TouchableOpacity 
                        style={styles.unitSelector}
                        onPress={toggleWeightUnit}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.unitText}>{weightUnit}</Text>
                        <Ionicons 
                          name="swap-horizontal" 
                          size={16} 
                          color={Colors.dark.primary} 
                          style={styles.swapIcon}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.weightHint}>
                      Your weight helps us calculate accurate body fat percentage
                    </Text>
                  </View>
                </View>
              ) : (
                <>
                  {/* Image Placeholder / Photo Preview */}
                  <View style={[
                    styles.imagePlaceholder,
                    hasCurrentPhoto && styles.imagePlaceholderWithPhoto
                  ]}>
                    {currentStep === 0 && frontPhoto ? (
                      // Front photo preview
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: frontPhoto }} style={styles.capturedPhoto} />
                        {/* Retake button overlay */}
                        <TouchableOpacity 
                          style={styles.retakeButton}
                          onPress={handleTakePhoto}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="camera" size={20} color="#FFFFFF" />
                          <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                      </View>
                    ) : currentStep === 1 && sidePhoto ? (
                      // Side photo preview
                      <View style={styles.photoPreviewContainer}>
                        <Image source={{ uri: sidePhoto }} style={styles.capturedPhoto} />
                        {/* Retake button overlay */}
                        <TouchableOpacity 
                          style={styles.retakeButton}
                          onPress={handleTakePhoto}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="camera" size={20} color="#FFFFFF" />
                          <Text style={styles.retakeText}>Retake</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <>
                        {/* Body silhouette placeholder */}
                        <View style={styles.silhouetteContainer}>
                          {currentStep === 0 ? (
                            // Front view silhouette
                            <View style={styles.silhouetteFront}>
                              <View style={styles.silhouetteHead} />
                              <View style={styles.silhouetteNeck} />
                              <View style={styles.silhouetteTorso} />
                              <View style={styles.silhouetteArmsContainer}>
                                <View style={styles.silhouetteArm} />
                                <View style={styles.silhouetteArm} />
                              </View>
                            </View>
                          ) : (
                            // Side view silhouette
                            <View style={styles.silhouetteSide}>
                              <View style={styles.silhouetteHead} />
                              <View style={styles.silhouetteNeck} />
                              <View style={styles.silhouetteTorsoSide} />
                            </View>
                          )}
                        </View>
                        <Text style={styles.placeholderText}>
                          {currentStep === 0 ? 'Front torso view' : 'Side torso view'}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* Tips */}
                  <View style={styles.tipsContainer}>
                    <View style={styles.tipItem}>
                      <Ionicons name="sunny-outline" size={20} color={Colors.dark.primary} />
                      <Text style={styles.tipText}>Good lighting</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="shirt-outline" size={20} color={Colors.dark.primary} />
                      <Text style={styles.tipText}>Fitted clothing</Text>
                    </View>
                    <View style={styles.tipItem}>
                      <Ionicons name="resize-outline" size={20} color={Colors.dark.primary} />
                      <Text style={styles.tipText}>Full torso visible</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Bottom Button */}
          <View style={styles.buttonContainer}>
            {isWeightStep ? (
              <TouchableOpacity 
                style={[
                  styles.takePhotoButton,
                  !isWeightValid && styles.buttonDisabled
                ]}
                onPress={handleGetResults}
                activeOpacity={isWeightValid ? 0.8 : 1}
                disabled={!isWeightValid}
              >
                <Ionicons 
                  name="analytics" 
                  size={24} 
                  color={isWeightValid ? '#FFFFFF' : 'rgba(255,255,255,0.5)'} 
                />
                <Text style={[
                  styles.takePhotoText,
                  !isWeightValid && styles.buttonTextDisabled
                ]}>Get Results</Text>
              </TouchableOpacity>
            ) : hasCurrentPhoto ? (
              // Continue button when photo is selected
              <TouchableOpacity 
                style={styles.continueButton}
                onPress={handleContinue}
                activeOpacity={0.8}
              >
                <Text style={styles.continueText}>Continue</Text>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              // Take photo button when no photo yet
              <TouchableOpacity 
                style={styles.takePhotoButton}
                onPress={handleTakePhoto}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={24} color="#FFFFFF" />
                <Text style={styles.takePhotoText}>Take Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    paddingTop: Spacing.xxl + Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.xl,
    color: Colors.dark.textPrimary,
  },
  stepIndicator: {
    backgroundColor: Colors.dark.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  stepText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.primary,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 4,
    backgroundColor: Colors.dark.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.dark.primary,
    borderRadius: 2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    flexGrow: 1,
  },
  title: {
    fontFamily: 'Rubik_700Bold',
    fontSize: 28,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  imagePlaceholder: {
    width: SCREEN_WIDTH - (Spacing.lg * 2),
    aspectRatio: 0.75,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  imagePlaceholderWithPhoto: {
    borderStyle: 'solid',
    borderColor: Colors.dark.primary,
  },
  photoPreviewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  retakeButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  retakeText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.sm,
    color: '#FFFFFF',
  },
  silhouetteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  silhouetteFront: {
    alignItems: 'center',
  },
  silhouetteSide: {
    alignItems: 'center',
  },
  silhouetteHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(232, 93, 4, 0.3)',
  },
  silhouetteNeck: {
    width: 16,
    height: 12,
    backgroundColor: 'rgba(232, 93, 4, 0.3)',
    marginTop: -2,
  },
  silhouetteTorso: {
    width: 80,
    height: 100,
    backgroundColor: 'rgba(232, 93, 4, 0.3)',
    borderRadius: BorderRadius.md,
    marginTop: -2,
  },
  silhouetteTorsoSide: {
    width: 50,
    height: 100,
    backgroundColor: 'rgba(232, 93, 4, 0.3)',
    borderRadius: BorderRadius.md,
    marginTop: -2,
  },
  silhouetteArmsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    top: 55,
    width: 140,
    justifyContent: 'space-between',
  },
  silhouetteArm: {
    width: 20,
    height: 60,
    backgroundColor: 'rgba(232, 93, 4, 0.3)',
    borderRadius: 10,
  },
  placeholderText: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  photoTakenContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  capturedPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg - 2,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderBottomLeftRadius: BorderRadius.lg - 2,
    borderBottomRightRadius: BorderRadius.lg - 2,
  },
  photoTakenText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.md,
    color: Colors.dark.primary,
    marginTop: Spacing.xs,
  },
  tipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  tipItem: {
    alignItems: 'center',
  },
  tipText: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.xs,
    color: Colors.dark.textSecondary,
    marginTop: 4,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  takePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  takePhotoText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dark.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  continueText: {
    fontFamily: 'Rubik_700Bold',
    fontSize: Fonts.sizes.lg,
    color: '#FFFFFF',
  },
  buttonDisabled: {
    backgroundColor: Colors.dark.surface,
  },
  buttonTextDisabled: {
    color: 'rgba(255,255,255,0.5)',
  },
  // Weight Input Styles
  weightInputContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.lg,
  },
  photoThumbnails: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  thumbnailWrapper: {
    alignItems: 'center',
  },
  thumbnail: {
    width: 100,
    height: 133,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.surface,
  },
  thumbnailCheck: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.dark.background,
    borderRadius: 12,
  },
  thumbnailLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.sm,
  },
  weightInputWrapper: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
  },
  scaleIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(232, 93, 4, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: Spacing.md,
  },
  weightInput: {
    flex: 1,
    height: 56,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    paddingHorizontal: Spacing.lg,
    fontFamily: 'Rubik_600SemiBold',
    fontSize: 24,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
  },
  unitSelector: {
    height: 56,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.dark.background,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
    gap: Spacing.xs,
  },
  unitText: {
    fontFamily: 'Rubik_600SemiBold',
    fontSize: Fonts.sizes.lg,
    color: Colors.dark.textPrimary,
  },
  swapIcon: {
    marginLeft: 2,
  },
  weightHint: {
    fontFamily: 'Inter_400Regular',
    fontSize: Fonts.sizes.sm,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    lineHeight: 20,
  },
});

export default ScanTutorialModal;

