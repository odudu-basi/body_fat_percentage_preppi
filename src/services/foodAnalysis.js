import * as FileSystem from 'expo-file-system/legacy';
import { OPENAI_API_KEY } from '@env';

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
  return `You are an expert nutritionist and food analyst. Analyze this photo to determine if it contains food and provide detailed nutritional information.

**CRITICAL FIRST STEP - Food Detection:**
- First, determine if the image contains recognizable food or beverages
- If the image does NOT contain food (e.g., it's a person, object, scenery, text, blank screen, etc.), set "is_food" to false
- If the image contains any edible food or beverage, set "is_food" to true

**If IS food, then:**
1. Identify the food items in the image
2. Estimate portion sizes
3. Calculate nutritional values including all macros and micronutrients

**Guidelines for food analysis:**
- Be specific about what you see (e.g., "White rice" not just "rice")
- Estimate realistic portion sizes based on the plate/container
- Provide accurate calorie and macro estimates
- Include fiber, sugar, and sodium estimates
- List all visible ingredients separately
- If you see multiple food items, list each one

**Return ONLY this JSON format (no other text):**

{
  "is_food": true | false,
  "meal_name": "Descriptive name of the meal (or empty string if not food)",
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
  "notes": "Any relevant notes about the meal or estimation, or reason why it's not food"
}`;
};

/**
 * Analyze food from a photo using OpenAI GPT-4o-mini Vision API
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

    // Prepare the API request for OpenAI
    const requestBody = {
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
    };

    console.log('Sending request to OpenAI...');

    // Make the API call
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to analyze food');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    console.log('OpenAI Response:', content);

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

      // Check if the image contains food
      if (analysisResult.is_food === false) {
        console.log('Non-food item detected:', analysisResult.notes);
        return {
          success: false,
          error: 'NO_FOOD_DETECTED',
          message: 'Please ensure food is visible in the frame and try again.',
        };
      }

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
