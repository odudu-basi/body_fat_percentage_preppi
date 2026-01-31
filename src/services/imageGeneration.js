import { TOGETHER_AI_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system/legacy';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';

/**
 * Generate an image for a meal using Together AI FLUX.1-schnell
 * @param {string} mealName - Name of the meal
 * @param {string} mealDescription - Description of the meal
 * @returns {Promise<string>} - Local file URI of the generated image
 */
export const generateMealImage = async (mealName, mealDescription) => {
  try {
    console.log('[ImageGen] Generating image for:', mealName);

    const prompt = `A professional, appetizing photo of exactly ${mealName}. Show ONLY the ingredients mentioned: ${mealDescription}. Do not add any extra toppings, garnishes, or ingredients not mentioned. Food photography, well-lit, restaurant quality, overhead view, on a clean white plate. High resolution, vibrant colors, realistic.`;

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: prompt,
        width: 512,
        height: 512,
        steps: 4,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageGen] Together API Error:', errorText);
      throw new Error('Failed to generate image');
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('[ImageGen] Image URL received:', imageUrl);

    const timestamp = Date.now();
    const documentDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const localUri = `${documentDir}meal_${timestamp}.png`;

    console.log('[ImageGen] Downloading image to:', localUri);

    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);

    console.log('[ImageGen] Image downloaded successfully:', downloadResult.uri);

    return downloadResult.uri;
  } catch (error) {
    console.error('[ImageGen] Error generating image:', error);
    return null;
  }
};

/**
 * Generate images for all meals in a meal plan
 * @param {Array} meals - Array of meal objects
 * @returns {Promise<Array>} - Array of meals with image URIs
 */
export const generateMealPlanImages = async (meals) => {
  try {
    console.log('[ImageGen] Generating images for', meals.length, 'meals');

    const mealsWithImages = await Promise.all(
      meals.map(async (meal) => {
        const imageUri = await generateMealImage(meal.name, meal.description);
        return {
          ...meal,
          image_uri: imageUri,
        };
      })
    );

    console.log('[ImageGen] All images generated');
    return mealsWithImages;
  } catch (error) {
    console.error('[ImageGen] Error generating meal plan images:', error);
    return meals.map(meal => ({ ...meal, image_uri: null }));
  }
};

export default {
  generateMealImage,
  generateMealPlanImages,
};
