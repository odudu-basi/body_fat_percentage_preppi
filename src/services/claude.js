import * as FileSystem from 'expo-file-system/legacy';
import { CLAUDE_API_KEY } from '@env';

// Claude API Configuration
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Convert a local image URI to base64
 */
const imageToBase64 = async (imageUri) => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Format height for display
 */
const formatHeight = (heightFeet, heightInches, heightCm) => {
  return `${heightFeet}'${heightInches}" (${heightCm.toFixed(1)} cm)`;
};

/**
 * Format weight for display
 */
const formatWeight = (weight, weightUnit, weightInKg) => {
  if (weightUnit === 'kg') {
    return `${weight} kg (${(weight * 2.20462).toFixed(1)} lbs)`;
  }
  return `${weight} lbs (${weightInKg.toFixed(1)} kg)`;
};

/**
 * Calculate BMI
 */
const calculateBMI = (weightKg, heightCm) => {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
};

/**
 * Estimate body fat from BMI using validated formula
 * Deurenberg formula: BF% = (1.20 × BMI) + (0.23 × Age) − (10.8 × Sex) − 5.4
 * Sex: Male = 1, Female = 0
 */
const estimateBodyFatFromBMI = (bmi, age, gender) => {
  const sexFactor = gender === 'male' ? 1 : 0;
  return (1.20 * bmi) + (0.23 * age) - (10.8 * sexFactor) - 5.4;
};

/**
 * Build the body fat analysis prompt
 */
const buildAnalysisPrompt = (userData) => {
  const height = formatHeight(userData.heightFeet, userData.heightInches, userData.heightCm);
  const weight = formatWeight(userData.weight, userData.weightUnit, userData.weightInKg);
  
  // Calculate BMI and estimated body fat for reference
  const bmi = calculateBMI(userData.weightInKg, userData.heightCm);
  const estimatedBF = estimateBodyFatFromBMI(bmi, userData.age, userData.gender);

  return `You are a body composition analyst. Estimate body fat percentage from the photos and biometric data.

**CRITICAL BIOMETRIC DATA (use this as your baseline):**
- Height: ${height}
- Weight: ${weight}
- BMI: ${bmi.toFixed(1)} (${bmi >= 30 ? 'Obese range' : bmi >= 25 ? 'Overweight range' : 'Normal range'})
- Age: ${userData.age}
- Gender: ${userData.gender}
- Formula-based estimate: ~${estimatedBF.toFixed(0)}% body fat

**IMPORTANT:** The BMI is ${bmi.toFixed(1)}. For a ${userData.age}-year-old ${userData.gender} with this BMI, body fat is typically:
- BMI 25-27: 20-25% body fat
- BMI 27-30: 25-30% body fat  
- BMI 30-33: 28-33% body fat
- BMI 33+: 32%+ body fat

Use the photos to refine this estimate. Look for:
- Visible abs = lower end of range
- No ab definition + belly = middle/higher end
- Significant belly overhang = higher end

**Visual Reference (Males):**
- 10-14%: Visible abs, vascularity
- 15-19%: Some upper ab definition, soft waist
- 20-24%: No abs visible, noticeable belly
- 25-30%: Larger belly, love handles
- 30%+: Significant fat accumulation

Return ONLY this JSON (no other text):

{
  "body_fat_estimate": {
    "percentage": ${Math.round(estimatedBF)},
    "confidence_range": {"low": ${Math.round(estimatedBF - 3)}, "high": ${Math.round(estimatedBF + 3)}},
    "confidence_level": "medium"
  },
  "visual_observations": {
    "front": "brief observation",
    "side": "brief observation"
  },
  "primary_indicators": ["indicator1", "indicator2"],
  "biometric_notes": "BMI ${bmi.toFixed(1)} suggests ${estimatedBF.toFixed(0)}% range, adjusted based on photos"
}`;
};

/**
 * Analyze body composition using Claude Vision API
 * @param {Object} scanData - Data from the scan including photos and user profile
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeBodyComposition = async (scanData) => {
  try {
    const { frontPhoto, sidePhoto, ...userData } = scanData;

    console.log('Starting Claude analysis...');

    // Convert images to base64
    const [frontBase64, sideBase64] = await Promise.all([
      imageToBase64(frontPhoto),
      imageToBase64(sidePhoto),
    ]);

    console.log('Images converted to base64');

    // Build the prompt
    const prompt = buildAnalysisPrompt(userData);

    // Prepare the API request for Claude
    const requestBody = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: frontBase64,
              },
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: sideBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    };

    console.log('Sending request to Claude...');

    // Make the API call
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Claude API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to analyze body composition');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    console.log('Claude Response:', content);

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    // Remove any potential markdown code blocks
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON in the response if it's wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    try {
      const analysisResult = JSON.parse(cleanedContent);
      console.log('Analysis successful:', analysisResult.body_fat_estimate);
      return {
        success: true,
        data: analysisResult,
      };
    } catch (parseError) {
      console.error('JSON parse error. Raw content:', content);
      throw new Error('Failed to parse AI response.');
    }
  } catch (error) {
    console.error('Body composition analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze body composition',
    };
  }
};

export default {
  analyzeBodyComposition,
};
