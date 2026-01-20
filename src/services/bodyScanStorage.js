import { supabase } from './supabase';

/**
 * Save a body scan result to Supabase
 * @param {Object} scanData - The scan data to save
 * @returns {Promise<Object>} - The saved scan with ID
 */
export const saveBodyScan = async (scanData) => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Format data for Supabase body_scans table
    const scanRecord = {
      user_id: user.id,
      scan_date: new Date().toISOString().split('T')[0],
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

    const { data, error } = await supabase
      .from('body_scans')
      .insert(scanRecord)
      .select()
      .single();

    if (error) throw error;

    console.log('Body scan saved to Supabase:', data.id);
    
    // Return in the format expected by the app
    return formatScanFromDB(data);
  } catch (error) {
    console.error('Error saving body scan:', error);
    throw error;
  }
};

/**
 * Get all body scans for current user
 * @returns {Promise<Array>} - Array of scan objects
 */
export const getBodyScans = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(formatScanFromDB);
  } catch (error) {
    console.error('Error getting body scans:', error);
    return [];
  }
};

/**
 * Get the most recent body scan
 * @returns {Promise<Object|null>} - The most recent scan or null
 */
export const getLatestBodyScan = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('body_scans')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows

    return data ? formatScanFromDB(data) : null;
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
    const { data, error } = await supabase
      .from('body_scans')
      .select('*')
      .eq('id', scanId)
      .single();

    if (error) throw error;

    return data ? formatScanFromDB(data) : null;
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
    const { error } = await supabase
      .from('body_scans')
      .delete()
      .eq('id', scanId);

    if (error) throw error;

    console.log('Body scan deleted:', scanId);
    return true;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('body_scans')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    console.log('All body scans cleared');
    return true;
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

  return {
    // Body composition results
    body_fat_percentage: analysisResult?.body_fat_estimate?.percentage,
    confidence_level: analysisResult?.body_fat_estimate?.confidence_level,
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
