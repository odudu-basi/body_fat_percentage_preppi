import { OPENAI_API_KEY } from '@env';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate a daily meal plan using OpenAI
 * @param {Object} userProfile - User's profile data
 * @returns {Promise<Object>} - Generated meal plan
 */
export const generateDailyMealPlan = async (userProfile) => {
  try {
    console.log('[MealPlan] Generating daily meal plan...');
    console.log('[MealPlan] User calorie target:', userProfile?.daily_calorie_target);
    console.log('[MealPlan] User kitchen items:', userProfile?.kitchen_items);

    const calorieTarget = userProfile?.daily_calorie_target || 2000;
    const proteinTarget = userProfile?.daily_protein_target || 150;
    const carbsTarget = userProfile?.daily_carbs_target || 200;
    const fatTarget = userProfile?.daily_fat_target || 65;
    const kitchenItems = userProfile?.kitchen_items || [];

    // Ensure total calories is below target for fat loss
    const targetCalories = Math.round(calorieTarget * 0.85); // 15% deficit for fat loss

    // Add randomness to the prompt
    const currentDate = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(7);

    // Format kitchen items list for the prompt
    const kitchenItemsList = kitchenItems.length > 0
      ? kitchenItems.map(item => item.replace(/_/g, ' ')).join(', ')
      : 'No restrictions - use any common ingredients';

    const prompt = `You are a professional nutritionist creating a UNIQUE daily meal plan for fat loss.

IMPORTANT: Create completely DIFFERENT and VARIED meals each time. Do NOT repeat the same meals. Be creative and diverse with your choices.

Today's date: ${currentDate}
Random seed: ${randomSeed}

**CRITICAL CONSTRAINT - AVAILABLE INGREDIENTS:**
The user has the following ingredients available in their kitchen:
${kitchenItemsList}

**YOU MUST ONLY use ingredients from the above list when creating meals.**
Do NOT suggest any ingredients that are not in this list. If the user doesn't have an ingredient, find creative alternatives using what they DO have.

You are a professional nutritionist creating a daily meal plan for fat loss.

User Profile:
- Daily calorie target: ${calorieTarget} kcal (we'll aim for ${targetCalories} kcal for fat loss)
- Protein target: ${proteinTarget}g
- Carbs target: ${carbsTarget}g
- Fat target: ${fatTarget}g
- Goal: Lose body fat while maintaining muscle

Create a meal plan with exactly 4 UNIQUE meals:
1. Breakfast - Choose a RANDOM breakfast option (e.g., eggs, oatmeal, smoothie bowl, Greek yogurt parfait, protein pancakes, avocado toast, etc.)
2. Lunch - Choose a RANDOM lunch option (e.g., grilled chicken salad, salmon bowl, turkey wrap, quinoa bowl, stir-fry, soup, etc.)
3. Dinner - Choose a RANDOM dinner option (e.g., lean beef with veggies, baked fish, chicken breast, tofu stir-fry, shrimp, turkey meatballs, etc.)
4. Fruits - Choose a RANDOM fruit or fruit mix (e.g., mixed berries, apple slices, banana, orange, mango, pineapple chunks, fruit salad, etc.)

Requirements:
- Total calories must be BELOW ${targetCalories} kcal
- High protein to preserve muscle mass (prioritize lean proteins)
- Moderate carbs, prioritize complex carbs and vegetables
- Healthy fats from nuts, avocado, olive oil, fish
- VARY the meals - don't use the same proteins or ingredients repeatedly
- Be CREATIVE - explore different cuisines (Mediterranean, Asian, Mexican, American, etc.)
- Each meal should be realistic, delicious, and easy to prepare
- Provide specific portion sizes
- Meals should be filling and satisfying
- Focus on whole foods that promote fat loss

IMPORTANT: For the "description" field in each meal, list ONLY the main ingredients that appear in the meal name. Do not add extra toppings, garnishes, or ingredients not mentioned in the meal name.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "total_calories": <number>,
  "total_protein": <number>,
  "total_carbs": <number>,
  "total_fat": <number>,
  "meals": [
    {
      "meal_type": "breakfast",
      "name": "Meal name",
      "description": "List only the main ingredients from the meal name",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "sodium_mg": <number>,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "portion_details": "Detailed portion information"
    },
    {
      "meal_type": "lunch",
      "name": "Meal name",
      "description": "List only the main ingredients from the meal name",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "sodium_mg": <number>,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "portion_details": "Detailed portion information"
    },
    {
      "meal_type": "dinner",
      "name": "Meal name",
      "description": "List only the main ingredients from the meal name",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "sodium_mg": <number>,
      "ingredients": ["ingredient 1", "ingredient 2"],
      "portion_details": "Detailed portion information"
    },
    {
      "meal_type": "snack",
      "name": "Fresh fruit mix",
      "description": "List only the fruits from the meal name",
      "calories": <number>,
      "protein_g": <number>,
      "carbs_g": <number>,
      "fat_g": <number>,
      "fiber_g": <number>,
      "sugar_g": <number>,
      "sodium_mg": <number>,
      "ingredients": ["fruit 1", "fruit 2"],
      "portion_details": "Detailed portion information"
    }
  ]
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative professional nutritionist specializing in fat loss meal planning. Create diverse and varied meal plans. Never repeat the same meals. Be creative with different cuisines and ingredients. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 1.0,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[MealPlan] OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate meal plan');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[MealPlan] Raw response:', content);

    // Parse JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const mealPlan = JSON.parse(cleanedContent);

    console.log('[MealPlan] Meal plan generated successfully');
    console.log('[MealPlan] Total calories:', mealPlan.total_calories);

    return {
      success: true,
      data: mealPlan,
    };
  } catch (error) {
    console.error('[MealPlan] Error generating meal plan:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate meal plan',
    };
  }
};

/**
 * Generate a single meal replacement using OpenAI
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {Object} userProfile - User's profile data
 * @returns {Promise<Object>} - Generated meal
 */
export const generateSingleMeal = async (mealType, userProfile) => {
  try {
    console.log('[MealPlan] Generating single meal replacement...');
    console.log('[MealPlan] Meal type:', mealType);

    const calorieTarget = userProfile?.daily_calorie_target || 2000;
    const proteinTarget = userProfile?.daily_protein_target || 150;
    const kitchenItems = userProfile?.kitchen_items || [];

    // Calculate target calories for this meal type
    let mealCalorieTarget;
    switch (mealType) {
      case 'breakfast':
        mealCalorieTarget = Math.round(calorieTarget * 0.25); // 25%
        break;
      case 'lunch':
        mealCalorieTarget = Math.round(calorieTarget * 0.35); // 35%
        break;
      case 'dinner':
        mealCalorieTarget = Math.round(calorieTarget * 0.30); // 30%
        break;
      case 'snack':
        mealCalorieTarget = Math.round(calorieTarget * 0.10); // 10%
        break;
      default:
        mealCalorieTarget = Math.round(calorieTarget * 0.25);
    }

    // Add randomness to the prompt
    const currentDate = new Date().toISOString();
    const randomSeed = Math.random().toString(36).substring(7);

    // Format kitchen items list for the prompt
    const kitchenItemsList = kitchenItems.length > 0
      ? kitchenItems.map(item => item.replace(/_/g, ' ')).join(', ')
      : 'No restrictions - use any common ingredients';

    const prompt = `You are a professional nutritionist creating a UNIQUE ${mealType} meal for fat loss.

IMPORTANT: Create a completely DIFFERENT and VARIED meal. Do NOT repeat common meals. Be creative and diverse with your choices.

Today's date: ${currentDate}
Random seed: ${randomSeed}

**CRITICAL CONSTRAINT - AVAILABLE INGREDIENTS:**
The user has the following ingredients available in their kitchen:
${kitchenItemsList}

**YOU MUST ONLY use ingredients from the above list when creating this meal.**
Do NOT suggest any ingredients that are not in this list. If you need an ingredient that's not available, find creative alternatives using what they DO have.

User Profile:
- Daily calorie target: ${calorieTarget} kcal
- Target for this ${mealType}: ~${mealCalorieTarget} kcal
- Protein target: ${proteinTarget}g (daily)
- Goal: Lose body fat while maintaining muscle

Create a UNIQUE ${mealType} meal:
${mealType === 'breakfast' ? '- Choose a RANDOM breakfast option (e.g., eggs, oatmeal, smoothie bowl, Greek yogurt parfait, protein pancakes, avocado toast, etc.)' : ''}
${mealType === 'lunch' ? '- Choose a RANDOM lunch option (e.g., grilled chicken salad, salmon bowl, turkey wrap, quinoa bowl, stir-fry, soup, etc.)' : ''}
${mealType === 'dinner' ? '- Choose a RANDOM dinner option (e.g., lean beef with veggies, baked fish, chicken breast, tofu stir-fry, shrimp, turkey meatballs, etc.)' : ''}
${mealType === 'snack' ? '- Choose a RANDOM fruit or fruit mix (e.g., mixed berries, apple slices, banana, orange, mango, pineapple chunks, fruit salad, etc.)' : ''}

Requirements:
- Target calories: ~${mealCalorieTarget} kcal
- High protein to preserve muscle mass (prioritize lean proteins)
- Moderate carbs, prioritize complex carbs and vegetables
- Healthy fats from nuts, avocado, olive oil, fish
- Be CREATIVE - explore different cuisines (Mediterranean, Asian, Mexican, American, etc.)
- Meal should be realistic, delicious, and easy to prepare
- Provide specific portion sizes
- Meal should be filling and satisfying
- Focus on whole foods that promote fat loss

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "meal_type": "${mealType}",
  "name": "Meal name",
  "description": "Brief description listing ONLY the main ingredients that appear in the meal name - do not add extra toppings or garnishes",
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "fiber_g": <number>,
  "sugar_g": <number>,
  "sodium_mg": <number>,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "portion_details": "Detailed portion information",
  "prep_time": "X minutes",
  "cook_time": "Y minutes"
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative professional nutritionist specializing in fat loss meal planning. Create diverse and varied meal plans. Never repeat the same meals. Be creative with different cuisines and ingredients. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 1.0,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[MealPlan] OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate meal');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[MealPlan] Raw response:', content);

    // Parse JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const meal = JSON.parse(cleanedContent);

    console.log('[MealPlan] Meal generated successfully:', meal.name);

    return {
      success: true,
      data: meal,
    };
  } catch (error) {
    console.error('[MealPlan] Error generating meal:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate meal',
    };
  }
};

/**
 * Generate a meal replacement suggestion - optimized for variety
 * @param {string} mealType - Type of meal (breakfast, lunch, dinner, snack)
 * @param {Object} userProfile - User's profile data
 * @param {string} previousMealName - Name of previous suggestion to avoid (optional)
 * @returns {Promise<Object>} - Generated meal
 */
export const generateMealSuggestion = async (mealType, userProfile, previousMealName = null) => {
  try {
    console.log('[MealPlan] Generating meal suggestion...');
    console.log('[MealPlan] Meal type:', mealType);
    console.log('[MealPlan] Avoid repeating:', previousMealName);

    const calorieTarget = userProfile?.daily_calorie_target || 2000;
    const proteinTarget = userProfile?.daily_protein_target || 150;
    const kitchenItems = userProfile?.kitchen_items || [];

    console.log('[MealPlan] Kitchen items available:', kitchenItems);

    // Calculate target calories for this meal type
    let mealCalorieTarget;
    switch (mealType) {
      case 'breakfast':
        mealCalorieTarget = Math.round(calorieTarget * 0.25);
        break;
      case 'lunch':
        mealCalorieTarget = Math.round(calorieTarget * 0.35);
        break;
      case 'dinner':
        mealCalorieTarget = Math.round(calorieTarget * 0.30);
        break;
      case 'snack':
        mealCalorieTarget = Math.round(calorieTarget * 0.10);
        break;
      default:
        mealCalorieTarget = Math.round(calorieTarget * 0.25);
    }

    // Format kitchen items list
    const kitchenItemsList = kitchenItems.length > 0
      ? kitchenItems.map(item => item.replace(/_/g, ' ')).join(', ')
      : 'No restrictions - use any common ingredients';

    // Random cuisine suggestion
    const cuisines = ['Mediterranean', 'Asian', 'Mexican', 'American', 'Indian', 'Thai', 'Italian', 'Greek', 'Middle Eastern', 'Japanese', 'Korean', 'Spanish', 'Vietnamese'];
    const randomCuisine = cuisines[Math.floor(Math.random() * cuisines.length)];

    const avoidClause = previousMealName
      ? `DO NOT suggest "${previousMealName}" or anything similar. Make something completely different.\n\n`
      : '';

    const prompt = `Generate a random ${mealType} meal for fat loss.

${avoidClause}Pick a random cuisine style. Try ${randomCuisine} or any other cuisine you want.

Available ingredients (USE VARIETY - don't default to the same ingredients):
${kitchenItemsList}

IMPORTANT:
- ONLY use ingredients from the list above
- Mix different ingredients together - be creative
- Don't always use the same proteins (chicken, beef, etc.) - vary it up
- Combine different vegetables and carbs
- Make each meal unique and interesting

Target for this ${mealType}:
- Calories: ${mealCalorieTarget} kcal
- High protein
- Moderate carbs
- Healthy fats

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "meal_type": "${mealType}",
  "name": "Meal name",
  "description": "List only the main ingredients from the meal name",
  "calories": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "fiber_g": <number>,
  "sugar_g": <number>,
  "sodium_mg": <number>,
  "ingredients": ["ingredient 1", "ingredient 2"],
  "portion_details": "Detailed portion information",
  "prep_time": "X minutes",
  "cook_time": "Y minutes"
}`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a creative chef who loves variety. Never suggest the same meal twice. Explore different cuisines and ingredient combinations. Always return valid JSON only, no markdown.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 1.2, // Higher temperature for more variety
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[MealPlan] OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate meal');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[MealPlan] Raw response:', content);

    // Parse JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const meal = JSON.parse(cleanedContent);

    console.log('[MealPlan] Meal suggested:', meal.name);

    return {
      success: true,
      data: meal,
    };
  } catch (error) {
    console.error('[MealPlan] Error generating suggestion:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate meal suggestion',
    };
  }
};

export default {
  generateDailyMealPlan,
  generateSingleMeal,
  generateMealSuggestion,
};
