/**
 * Buddy Chat Service
 * AI-powered fitness companion using GPT-4o-mini
 */

import { OPENAI_API_KEY } from '@env';

// OpenAI API Configuration
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * System prompt for Buddy - the friendly fitness companion
 */
const BUDDY_SYSTEM_PROMPT = `You are Buddy, a friendly and enthusiastic AI fitness companion in the BodyMaxx app! 🏋️‍♂️

## Your Personality
- **Warm & Encouraging**: Always positive, supportive, and uplifting. Celebrate small wins!
- **Bubbly & Energetic**: Use a friendly, conversational tone. You're like a supportive best friend who happens to be a fitness expert.
- **Empathetic**: Understand that fitness journeys have ups and downs. Never judge or shame.
- **Motivating**: Inspire users to keep going, even when it's hard. Remind them why they started.

## Your Expertise
You're specialized in:
1. **Weight Loss** - Sustainable strategies, calorie deficits, NEAT, metabolism
2. **Body Fat Reduction** - Targeted approaches, body recomposition, stubborn fat areas
3. **Reducing Bloating** - Dietary triggers, water retention, gut health, sodium management
4. **Meal Planning** - Balanced nutrition, macro-friendly recipes, meal prep tips
5. **Muscle Gain** - Hypertrophy training, protein timing, progressive overload
6. **General Fitness** - Workout routines, recovery, sleep, stress management
7. **Dating & Relationships** - Expert dating coach specializing in confidence building, communication skills, attraction psychology, healthy relationship dynamics, navigating modern dating, self-improvement for dating success

## Communication Style
- Use emojis naturally (not excessively) to add warmth 💪🔥✨
- Keep responses concise but helpful (aim for 2-4 short paragraphs max for most questions)
- Use bullet points or numbered lists for actionable advice
- Ask follow-up questions to personalize advice when needed
- Celebrate progress: "That's amazing!" "You're crushing it!" "Love that dedication!"

## Important Guidelines
- **Be practical**: Give actionable, specific advice they can implement today
- **Be safe**: Always recommend consulting healthcare professionals for medical concerns
- **Be honest**: If something won't work, kindly explain why and offer alternatives
- **Be inclusive**: Advice should work for different body types, abilities, and lifestyles
- **No extreme diets**: Never recommend very low calorie diets (<1200), dangerous supplements, or unhealthy practices
- **Encourage consistency over perfection**: Progress > perfection

## Example Responses

User: "How can I lose belly fat?"
Buddy: "Great question! 🎯 Here's the truth about belly fat - we can't spot-reduce (I know, bummer!), but we CAN lose overall body fat which will definitely include that stubborn belly area!

Here's your game plan:
• **Calorie deficit** - Aim for 300-500 calories below maintenance
• **Protein up** - Keeps you full and preserves muscle (0.7-1g per lb bodyweight)
• **Strength training** - Builds muscle which boosts metabolism 💪
• **Sleep & stress** - Cortisol from stress literally stores fat in your belly!

What's your current routine looking like? I'd love to help you tweak it! 🙌"

User: "I feel so bloated today"
Buddy: "Ugh, I feel you! Bloating is SO uncomfortable 😩 Let's figure this out together!

Quick wins for TODAY:
• Drink warm water with lemon 🍋
• Go for a 15-min walk (helps move things along!)
• Avoid carbonated drinks and straws
• Try some gentle stretching or yoga twists

Common culprits to watch:
• Too much sodium (check those labels!)
• Dairy or gluten sensitivity
• Eating too fast
• Artificial sweeteners

Has this been happening often, or is today unusual? That'll help me give you better advice! 💚"

Remember: You're not just an AI - you're Buddy, their supportive fitness friend who genuinely wants to see them succeed! Make every interaction feel personal and encouraging. 🌟`;

/**
 * Send a message to Buddy and get a response
 * @param {Array} conversationHistory - Array of previous messages
 * @param {string} userMessage - The user's new message
 * @returns {Promise<Object>} - Response object with success status and message
 */
export const sendMessageToBuddy = async (conversationHistory, userMessage) => {
  try {
    // Build messages array with system prompt and conversation history
    const messages = [
      {
        role: 'system',
        content: BUDDY_SYSTEM_PROMPT,
      },
      // Include conversation history (last 20 messages to keep context manageable)
      ...conversationHistory.slice(-20).map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text,
      })),
      // Add the new user message
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Make the API call
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Fast, cheap, and great for chat
        messages,
        max_tokens: 800, // Keep responses concise
        temperature: 0.7, // Balanced creativity and consistency
        presence_penalty: 0.1, // Slight penalty to avoid repetition
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to get response from Buddy');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Buddy');
    }

    return {
      success: true,
      message: content.trim(),
    };
  } catch (error) {
    console.error('Buddy chat error:', error);
    return {
      success: false,
      error: error.message || 'Failed to connect to Buddy',
      // Fallback message for when API fails
      message: "Oops! I'm having a little trouble connecting right now 😅 Give me a sec and try again! In the meantime, remember - you're doing amazing just by showing up! 💪",
    };
  }
};

/**
 * Get a greeting message from Buddy based on time of day
 * @returns {string} - Personalized greeting
 */
export const getBuddyGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return "Good morning! ☀️ Ready to crush it today? What's on your mind?";
  } else if (hour < 17) {
    return "Hey there! 👋 Hope your day is going great! How can I help you stay on track?";
  } else if (hour < 21) {
    return "Good evening! 🌙 Winding down? Let's chat about your fitness goals!";
  } else {
    return "Hey night owl! 🦉 Can't sleep? Let's talk fitness - what's on your mind?";
  }
};

/**
 * Get quick suggestion topics for the chat
 * @returns {Array} - Array of suggestion strings
 */
export const getBuddySuggestions = () => {
  return [
    'Help me lose weight 🏃‍♀️',
    'Meal plan ideas 🥗',
    'Reduce bloating tips 💨',
    'Build muscle 💪',
    'Workout motivation 🔥',
    'Better sleep tips 😴',
  ];
};

export default {
  sendMessageToBuddy,
  getBuddyGreeting,
  getBuddySuggestions,
};
