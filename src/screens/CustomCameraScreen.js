import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/theme';
import { trackEvent } from '../utils/analytics';

const CustomCameraScreen = ({ navigation }) => {
  const [facing, setFacing] = useState('back');
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'barcode', 'label'
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef(null);

  // Request camera permission if not granted
  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color={Colors.dark.primary} />
        <Text style={styles.permissionText}>Camera Access Required</Text>
        <Text style={styles.permissionSubtext}>
          We need your permission to access the camera to scan your meals
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      trackEvent('meal_photo_captured', { source: 'custom_camera', tab: activeTab });

      // Navigate to NutritionResults with the photo
      navigation.replace('NutritionResults', { photoUri: photo.uri });
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant photo library access to select images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        trackEvent('meal_photo_selected', { source: 'library', tab: activeTab });

        // Navigate to NutritionResults with the selected photo
        navigation.replace('NutritionResults', { photoUri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const handleTabPress = (tab) => {
    if (tab === 'barcode') {
      // Barcode functionality not implemented yet
      Alert.alert(
        'Coming Soon',
        'Barcode scanning will let you quickly log packaged foods by scanning their barcodes. This feature is coming soon!',
        [{ text: 'OK' }]
      );
      return;
    }

    setActiveTab(tab);
    trackEvent('camera_tab_changed', { tab });
  };

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => {
              Alert.alert(
                'How to Scan',
                '1. Point your camera at your meal\n2. Make sure the food is well-lit and in frame\n3. Tap the capture button\n\nTip: You can also select a photo from your gallery using the image icon.',
                [{ text: 'Got it' }]
              );
            }}
          >
            <Ionicons name="help-circle-outline" size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Camera Frame Guide */}
        <View style={styles.frameGuide}>
          <View style={styles.frameCorner} style={[styles.frameCorner, styles.topLeft]} />
          <View style={styles.frameCorner} style={[styles.frameCorner, styles.topRight]} />
          <View style={styles.frameCorner} style={[styles.frameCorner, styles.bottomLeft]} />
          <View style={styles.frameCorner} style={[styles.frameCorner, styles.bottomRight]} />
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomContainer}>
          {/* Tab Buttons */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'scan' && styles.tabActive]}
              onPress={() => handleTabPress('scan')}
            >
              <Ionicons
                name="scan-outline"
                size={24}
                color={activeTab === 'scan' ? Colors.dark.primary : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'scan' && styles.tabTextActive,
                ]}
              >
                Scan Food
              </Text>
            </TouchableOpacity>

            {/* Barcode tab - hidden but code kept for future use
            <TouchableOpacity
              style={[styles.tab, activeTab === 'barcode' && styles.tabActive]}
              onPress={() => handleTabPress('barcode')}
            >
              <Ionicons
                name="barcode-outline"
                size={24}
                color={activeTab === 'barcode' ? Colors.dark.primary : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'barcode' && styles.tabTextActive,
                ]}
              >
                Barcode
              </Text>
            </TouchableOpacity>
            */}
          </View>

          {/* Capture Button and Gallery Icon */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlsSpacer} />

            {/* Capture Button */}
            <TouchableOpacity
              style={styles.captureButton}
              onPress={handleCapture}
              disabled={isCapturing}
            >
              {isCapturing ? (
                <ActivityIndicator size="large" color={Colors.dark.primary} />
              ) : (
                <View style={styles.captureButtonInner} />
              )}
            </TouchableOpacity>

            {/* Gallery Icon */}
            <TouchableOpacity style={styles.galleryButton} onPress={handleGallery}>
              <Ionicons name="images" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionSubtext: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  permissionButton: {
    backgroundColor: Colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameGuide: {
    position: 'absolute',
    top: '25%',
    left: '10%',
    right: '10%',
    bottom: '40%',
  },
  frameCorner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
  },
  tabText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.dark.primary,
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  controlsSpacer: {
    width: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.dark.primary,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dark.primary,
  },
  galleryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default CustomCameraScreen;
