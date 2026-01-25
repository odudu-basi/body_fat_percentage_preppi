import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import {
  saveBodyScan as storageLayerSaveBodyScan,
  getBodyScans as storageLayerGetBodyScans,
  getLatestBodyScan as storageLayerGetLatestBodyScan,
} from './storage';
import { getTodayLocalDate } from '../utils/dateUtils';

// Detect if running in Expo Go (development mode)
const isExpoGo = Constants.appOwnership === 'expo';
const USE_LOCAL_STORAGE = false; // Force Supabase mode for testing

/**
 * Save a body scan result
 * Uses storage abstraction layer (local in dev, Supabase in production)
 */
export const saveBodyScan = async (scanData) => {
  try {
    // Get current user ID
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      userId = user.id;
    }

    // Format data for storage
    const scanRecord = {
      user_id: userId,
      scan_date: getTodayLocalDate(),
      body_fat_percentage: scanData.body_fat_percentage,
      confidence_level: scanData.confidence_level,
      confidence_low: scanData.confidence_low,
      confidence_high: scanData.confidence_high,
      weight_kg: scanData.weight_kg,
      weight_lbs: scanData.weight_lbs,
      height_cm: scanData.height_cm,
      age: scanData.age,
      gender: scanData.gender,
      bmi: scanData.bmi || null,
      front_image_path: scanData.front_image_path,
      side_image_path: scanData.side_image_path,
      ai_analysis: scanData.ai_analysis,
      front_observations: scanData.front_observations,
      side_observations: scanData.side_observations,
      primary_indicators: scanData.primary_indicators,
      biometric_notes: scanData.biometric_notes,
    };

    const result = await storageLayerSaveBodyScan(scanRecord);
    return formatScanFromDB(result);
  } catch (error) {
    console.error('Error saving body scan:', error);
    throw error;
  }
};

/**
 * Get all body scans for current user
 * Uses storage abstraction layer
 */
export const getBodyScans = async () => {
  try {
    let userId = null;
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      userId = user.id;
    } else {
      userId = 'dev-user';
    }

    const scans = await storageLayerGetBodyScans(userId);
    return (scans || []).map(formatScanFromDB);
  } catch (error) {
    console.error('Error getting body scans:', error);
    return [];
  }
};

/**
 * Get the most recent body scan
 * Uses storage abstraction layer
 */
export const getLatestBodyScan = async () => {
  try {
    let userId = 'dev-user';
    if (!USE_LOCAL_STORAGE) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      userId = user.id;
    }

    const scan = await storageLayerGetLatestBodyScan(userId);
    return scan ? formatScanFromDB(scan) : null;
  } catch (error) {
    console.error('Error getting latest body scan:', error);
    return null;
  }
};

/**
 * Get a specific body scan by ID
 * @param {string} scanId - The scan ID
 * @returns {Promise<Object|null>} - The scan or null
 */
export const getBodyScanById = async (scanId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage - get all scans and find by ID
      const scans = await storageLayerGetBodyScans();
      const scan = scans.find(s => s.id === scanId);
      return scan ? formatScanFromDB(scan) : null;
    } else {
      // Supabase
      const { data, error } = await supabase
        .from('body_scans')
        .select('*')
        .eq('id', scanId)
        .single();

      if (error) throw error;
      return data ? formatScanFromDB(data) : null;
    }
  } catch (error) {
    console.error('Error getting body scan by ID:', error);
    return null;
  }
};

/**
 * Delete a body scan
 * @param {string} scanId - The scan ID to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteBodyScan = async (scanId) => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage - remove from array
      const scans = await storageLayerGetBodyScans();
      const updatedScans = scans.filter(s => s.id !== scanId);
      await AsyncStorage.setItem('@bodymax:body_scans', JSON.stringify(updatedScans));
      console.log('Body scan deleted:', scanId);
      return true;
    } else {
      // Supabase
      const { error } = await supabase
        .from('body_scans')
        .delete()
        .eq('id', scanId);

      if (error) throw error;
      console.log('Body scan deleted:', scanId);
      return true;
    }
  } catch (error) {
    console.error('Error deleting body scan:', error);
    return false;
  }
};

/**
 * Clear all body scans for current user (for testing)
 * @returns {Promise<boolean>} - Success status
 */
export const clearAllBodyScans = async () => {
  try {
    if (USE_LOCAL_STORAGE) {
      // Local storage - clear the key
      await AsyncStorage.removeItem('@bodymax:body_scans');
      console.log('All body scans cleared');
      return true;
    } else {
      // Supabase
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('body_scans')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('All body scans cleared');
      return true;
    }
  } catch (error) {
    console.error('Error clearing body scans:', error);
    return false;
  }
};

/**
 * Format scan data for storage (from scan flow)
 * @param {Object} scanData - Raw scan data from the scan flow
 * @param {Object} analysisResult - AI analysis result
 * @returns {Object} - Formatted scan data
 */
export const formatScanForStorage = (scanData, analysisResult) => {
  // Calculate BMI if we have height and weight
  let bmi = null;
  if (scanData.weightInKg && scanData.heightCm) {
    const heightM = scanData.heightCm / 100;
    bmi = parseFloat((scanData.weightInKg / (heightM * heightM)).toFixed(1));
  }

  // Normalize confidence level to lowercase and validate
  let confidenceLevel = analysisResult?.body_fat_estimate?.confidence_level;
  if (confidenceLevel) {
    confidenceLevel = confidenceLevel.toLowerCase();
    // Ensure it's one of the valid values
    if (!['high', 'medium', 'low'].includes(confidenceLevel)) {
      confidenceLevel = 'medium'; // Default to medium if invalid
    }
  } else {
    confidenceLevel = 'medium'; // Default if not provided
  }

  return {
    // Body composition results
    body_fat_percentage: analysisResult?.body_fat_estimate?.percentage,
    confidence_level: confidenceLevel,
    confidence_low: analysisResult?.body_fat_estimate?.confidence_range?.low,
    confidence_high: analysisResult?.body_fat_estimate?.confidence_range?.high,
    
    // User measurements
    weight_kg: scanData.weightInKg,
    weight_lbs: scanData.weight,
    weight_unit: scanData.weightUnit,
    height_cm: scanData.heightCm,
    height_feet: scanData.heightFeet,
    height_inches: scanData.heightInches,
    age: scanData.age,
    gender: scanData.gender,
    ethnicity: scanData.ethnicity,
    bmi: bmi,
    
    // Image paths
    front_image_path: scanData.frontPhoto,
    side_image_path: scanData.sidePhoto,
    
    // AI analysis
    ai_analysis: analysisResult,
    front_observations: analysisResult?.visual_observations?.front,
    side_observations: analysisResult?.visual_observations?.side,
    primary_indicators: analysisResult?.primary_indicators,
    biometric_notes: analysisResult?.biometric_notes,
  };
};

/**
 * Format database record to app format
 * @param {Object} dbRecord - Database record
 * @returns {Object} - Formatted scan for app use
 */
const formatScanFromDB = (dbRecord) => {
  return {
    id: dbRecord.id,
    scan_date: dbRecord.scan_date,
    created_at: dbRecord.created_at,
    
    // Body composition
    body_fat_percentage: dbRecord.body_fat_percentage,
    confidence_level: dbRecord.confidence_level,
    confidence_low: dbRecord.confidence_low,
    confidence_high: dbRecord.confidence_high,
    
    // Measurements
    weight_kg: dbRecord.weight_kg,
    weight_lbs: dbRecord.weight_lbs,
    height_cm: dbRecord.height_cm,
    age: dbRecord.age,
    gender: dbRecord.gender,
    bmi: dbRecord.bmi,
    
    // Images
    front_image_path: dbRecord.front_image_path,
    side_image_path: dbRecord.side_image_path,
    
    // AI analysis
    ai_analysis: dbRecord.ai_analysis,
    front_observations: dbRecord.front_observations,
    side_observations: dbRecord.side_observations,
    primary_indicators: dbRecord.primary_indicators,
    biometric_notes: dbRecord.biometric_notes,
  };
};

export default {
  saveBodyScan,
  getBodyScans,
  getLatestBodyScan,
  getBodyScanById,
  deleteBodyScan,
  clearAllBodyScans,
  formatScanForStorage,
};
