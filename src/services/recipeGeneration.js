import { OPENAI_API_KEY } from '@env';

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * Generate detailed recipe and ingredients for a meal
 * @param {Object} meal - Meal object with name, description, calories, macros
 * @returns {Promise<Object>} - Generated recipe and ingredients
 */
export const generateMealRecipe = async (meal) => {
  try {
    console.log('[RecipeGen] Generating recipe for:', meal.name);

    const prompt = `You are a professional chef and nutritionist. Create a detailed recipe for the following meal:

Meal: ${meal.name}
Description: ${meal.description || meal.name}
Target Calories: ${meal.calories} kcal
Target Protein: ${meal.protein_g}g
Target Carbs: ${meal.carbs_g}g
Target Fats: ${meal.fat_g}g

Create a detailed recipe that matches these nutrition targets as closely as possible.

Return ONLY valid JSON (no markdown, no code blocks) in this exact format:
{
  "ingredients": [
    {
      "name": "Ingredient name",
      "amount": "Specific amount with unit (e.g., '2 cups', '150g', '1 tbsp')",
      "calories": <number>,
      "notes": "Optional preparation notes"
    }
  ],
  "instructions": [
    "Step 1: First instruction in detail",
    "Step 2: Second instruction in detail",
    "Step 3: Continue with clear, detailed steps"
  ],
  "prep_time": "10 minutes",
  "cook_time": "15 minutes",
  "total_time": "25 minutes",
  "servings": 1,
  "difficulty": "Easy",
  "tips": [
    "Helpful cooking tip 1",
    "Helpful cooking tip 2"
  ]
}

Make the recipe:
- Realistic and easy to follow
- Achievable with common kitchen equipment
- Healthy and suitable for fat loss goals
- Delicious and satisfying
- Include specific measurements and clear instructions`;

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
            content: 'You are a professional chef and nutritionist. Create detailed, accurate recipes that match nutritional targets. Always return valid JSON only, no markdown formatting.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[RecipeGen] OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate recipe');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    console.log('[RecipeGen] Raw response:', content);

    // Parse JSON response
    let cleanedContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to find JSON in the response
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedContent = jsonMatch[0];
    }

    const recipe = JSON.parse(cleanedContent);

    console.log('[RecipeGen] Recipe generated successfully');

    return {
      success: true,
      data: recipe,
    };
  } catch (error) {
    console.error('[RecipeGen] Error generating recipe:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate recipe',
    };
  }
};

export default {
  generateMealRecipe,
};
