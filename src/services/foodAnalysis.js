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
 * Build the food analysis prompt
 */
const buildFoodAnalysisPrompt = () => {
  return `You are an expert nutritionist and food analyst. Analyze this food photo and provide detailed nutritional information.

**Your task:**
1. Identify the food items in the image
2. Estimate portion sizes
3. Calculate nutritional values including all macros and micronutrients

**Guidelines:**
- Be specific about what you see (e.g., "White rice" not just "rice")
- Estimate realistic portion sizes based on the plate/container
- Provide accurate calorie and macro estimates
- Include fiber, sugar, and sodium estimates
- List all visible ingredients separately
- If you see multiple food items, list each one

**Return ONLY this JSON format (no other text):**

{
  "meal_name": "Descriptive name of the meal",
  "meal_time": "breakfast" | "lunch" | "dinner" | "snack",
  "total_calories": <number>,
  "macros": {
    "protein_g": <number>,
    "carbs_g": <number>,
    "fat_g": <number>,
    "fiber_g": <number>,
    "sugar_g": <number>,
    "sodium_mg": <number>
  },
  "ingredients": [
    {
      "name": "Ingredient name",
      "portion": "estimated portion (e.g., '1 cup', '150g')",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>
    }
  ],
  "confidence": "high" | "medium" | "low",
  "notes": "Any relevant notes about the meal or estimation"
}`;
};

/**
 * Analyze food from a photo using Claude Vision API
 * @param {string} photoUri - URI of the food photo
 * @returns {Promise<Object>} - Analysis results
 */
export const analyzeFoodPhoto = async (photoUri) => {
  try {
    console.log('Starting food analysis...');

    // Convert image to base64
    const imageBase64 = await imageToBase64(photoUri);
    console.log('Image converted to base64');

    // Build the prompt
    const prompt = buildFoodAnalysisPrompt();

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
                data: imageBase64,
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
      throw new Error(errorData.error?.message || 'Failed to analyze food');
    }

    const data = await response.json();
    const content = data.content?.[0]?.text;

    console.log('Claude Response:', content);

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    try {
      const analysisResult = JSON.parse(cleanedContent);
      console.log('Food analysis successful:', analysisResult.meal_name);
      return {
        success: true,
        data: analysisResult,
      };
    } catch (parseError) {
      console.error('JSON parse error. Raw content:', content);
      throw new Error('Failed to parse AI response.');
    }
  } catch (error) {
    console.error('Food analysis error:', error);
    return {
      success: false,
      error: error.message || 'Failed to analyze food',
    };
  }
};

export default {
  analyzeFoodPhoto,
};
