import { TOGETHER_AI_API_KEY, PEXELS_API_KEY } from '@env';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';

const TOGETHER_API_URL = 'https://api.together.xyz/v1/images/generations';
const PEXELS_API_URL = 'https://api.pexels.com/v1/search';

/**
 * Search Pexels for a real food photo
 * @param {string} mealName - Name of the meal
 * @returns {Promise<string|null>} - Image URL or null if not found
 */
const searchPexelsImage = async (mealName) => {
  try {
    if (!PEXELS_API_KEY) {
      console.log('[ImageGen] Pexels API key not configured, skipping');
      return null;
    }

    console.log('[ImageGen] Searching Pexels for:', mealName);

    const searchQuery = `${mealName} plated food`;
    const response = await fetch(
      `${PEXELS_API_URL}?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=square`,
      {
        headers: {
          'Authorization': PEXELS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error('[ImageGen] Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();

    if (data.photos && data.photos.length > 0) {
      // Return the medium-sized version (good quality, reasonable size)
      const imageUrl = data.photos[0].src.large;
      console.log('[ImageGen] Found Pexels image:', imageUrl);
      return imageUrl;
    }

    console.log('[ImageGen] No Pexels results for:', mealName);
    return null;
  } catch (error) {
    console.error('[ImageGen] Error searching Pexels:', error);
    return null;
  }
};

/**
 * Generate an AI image for a meal using Together AI FLUX.1-schnell (optimized)
 * @param {string} mealName - Name of the meal
 * @param {string} mealDescription - Description of the meal
 * @returns {Promise<string>} - Image URL
 */
const generateAIImage = async (mealName, mealDescription) => {
  try {
    console.log('[ImageGen] Generating AI image for:', mealName);

    // Professional food photography prompt
    const prompt = `Professional food photography of ${mealName}, beautifully plated on white ceramic plate, ${mealDescription}. Shot with 85mm lens at f/1.8, natural window lighting from left, shallow depth of field, restaurant quality plating, garnished with fresh herbs, shot from 45-degree angle, highly detailed, photorealistic, high resolution, vibrant colors, editorial food magazine quality`;

    const negativePrompt = `artificial, cartoon, illustration, painting, drawing, oversaturated, blurry, text, watermark, low quality, distorted, deformed, ugly, bad anatomy`;

    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'black-forest-labs/FLUX.1-schnell',
        prompt: prompt,
        negative_prompt: negativePrompt,
        width: 1024,
        height: 1024,
        steps: 10,
        n: 1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ImageGen] Together API Error:', errorText);
      throw new Error('Failed to generate AI image');
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;

    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('[ImageGen] AI image URL received:', imageUrl);
    return imageUrl;
  } catch (error) {
    console.error('[ImageGen] Error generating AI image:', error);
    return null;
  }
};

/**
 * Generate an image for a meal using hybrid approach (Pexels first, AI fallback)
 * @param {string} mealName - Name of the meal
 * @param {string} mealDescription - Description of the meal
 * @returns {Promise<string>} - Local file URI or public URL of the image
 */
export const generateMealImage = async (mealName, mealDescription) => {
  try {
    console.log('[ImageGen] Starting image generation for:', mealName);

    // TEMP: Skipping Pexels, using AI only for testing
    // Step 1: Try Pexels first (free, real photos)
    // let imageUrl = await searchPexelsImage(mealName);

    // Step 2: If no Pexels result, generate with AI
    // if (!imageUrl) {
      console.log('[ImageGen] Generating AI image...');
      const imageUrl = await generateAIImage(mealName, mealDescription);
    // }

    if (!imageUrl) {
      console.error('[ImageGen] Failed to generate image');
      return null;
    }

    console.log('[ImageGen] Final image URL:', imageUrl);

    // Download to local storage first
    const timestamp = Date.now();
    const documentDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    const localUri = `${documentDir}meal_${timestamp}.png`;

    console.log('[ImageGen] Downloading image to:', localUri);

    const downloadResult = await FileSystem.downloadAsync(imageUrl, localUri);

    console.log('[ImageGen] Image downloaded to local storage:', downloadResult.uri);

    // Upload to Supabase Storage for cloud persistence
    try {
      console.log('[ImageGen] Uploading image to Supabase Storage...');

      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

      // Get current user for file path
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'anonymous';

      // Upload to Supabase Storage
      const fileName = `${userId}/meal_${timestamp}.png`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('meal-images')
        .upload(fileName, arrayBuffer, {
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('[ImageGen] Supabase upload error:', uploadError);
        // Fall back to local URI if upload fails
        return downloadResult.uri;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('meal-images')
        .getPublicUrl(fileName);

      console.log('[ImageGen] Image uploaded to Supabase:', publicUrlData.publicUrl);

      return publicUrlData.publicUrl;
    } catch (uploadError) {
      console.error('[ImageGen] Error uploading to Supabase:', uploadError);
      // Fall back to local URI
      return downloadResult.uri;
    }
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
