const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const User = require('../models/User');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate meal plan
router.post('/meal-plan', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const { preferences, duration = 7 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        message: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a personalized ${duration}-day meal plan for a person with the following profile:

User Profile:
- Age: ${user.age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Height: ${user.height || 'Not specified'} cm
- Weight: ${user.weight || 'Not specified'} kg
- BMI: ${user.currentBMI || 'Not calculated'}
- Activity Level: ${user.activityLevel || 'moderately_active'}
- Goals: ${user.goals.join(', ') || 'general health'}
- Dietary Restrictions: ${user.dietaryRestrictions.join(', ') || 'none'}
- Additional Preferences: ${preferences || 'none'}

Please provide:
1. Daily meal plans with breakfast, lunch, dinner, and 2 snacks
2. Estimated calories per meal and daily total
3. Nutritional highlights for each day
4. Shopping list for the week
5. Meal prep tips

Format the response as a structured JSON with the following structure:
{
  "mealPlan": {
    "day1": {
      "date": "Day 1",
      "meals": {
        "breakfast": { "name": "", "ingredients": [], "calories": 0, "instructions": "" },
        "lunch": { "name": "", "ingredients": [], "calories": 0, "instructions": "" },
        "dinner": { "name": "", "ingredients": [], "calories": 0, "instructions": "" },
        "snacks": [
          { "name": "", "ingredients": [], "calories": 0, "instructions": "" }
        ]
      },
      "totalCalories": 0,
      "nutritionHighlights": []
    }
  },
  "shoppingList": [],
  "mealPrepTips": [],
  "nutritionalSummary": {
    "dailyAverageCalories": 0,
    "proteinFocus": "",
    "healthBenefits": []
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Try to parse JSON from the response
    try {
      // Remove any markdown formatting if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const mealPlan = JSON.parse(text);
      
      res.json({
        message: 'Meal plan generated successfully',
        data: mealPlan,
        generatedAt: new Date(),
      });
    } catch (parseError) {
      // If JSON parsing fails, return the raw text
      res.json({
        message: 'Meal plan generated successfully',
        data: {
          rawResponse: text,
          note: 'Response could not be parsed as JSON. Please check the format.'
        },
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Generate meal plan error:', error);
    res.status(500).json({ 
      message: 'Failed to generate meal plan',
      error: error.message 
    });
  }
});

// Generate workout plan
router.post('/workout-plan', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const { preferences, duration = 7, equipment = [] } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        message: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Create a personalized ${duration}-day workout plan for a person with the following profile:

User Profile:
- Age: ${user.age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Height: ${user.height || 'Not specified'} cm
- Weight: ${user.weight || 'Not specified'} kg
- BMI: ${user.currentBMI || 'Not calculated'}
- Activity Level: ${user.activityLevel || 'moderately_active'}
- Fitness Goals: ${user.goals.join(', ') || 'general fitness'}
- Available Equipment: ${equipment.join(', ') || 'bodyweight exercises'}
- Additional Preferences: ${preferences || 'none'}

Please provide:
1. Daily workout routines with exercises, sets, reps, and rest periods
2. Estimated calories burned per workout
3. Progressive difficulty throughout the week
4. Warm-up and cool-down routines
5. Recovery and rest day recommendations
6. Form tips and safety guidelines

Format the response as a structured JSON with the following structure:
{
  "workoutPlan": {
    "day1": {
      "date": "Day 1",
      "type": "strength/cardio/rest",
      "duration": 0,
      "warmup": { "exercises": [], "duration": 0 },
      "mainWorkout": [
        {
          "name": "",
          "sets": 0,
          "reps": "",
          "rest": "",
          "instructions": "",
          "targetMuscles": []
        }
      ],
      "cooldown": { "exercises": [], "duration": 0 },
      "estimatedCalories": 0
    }
  },
  "weeklySchedule": [],
  "progressionTips": [],
  "safetyGuidelines": [],
  "equipmentNeeded": []
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Try to parse JSON from the response
    try {
      // Remove any markdown formatting if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const workoutPlan = JSON.parse(text);
      
      res.json({
        message: 'Workout plan generated successfully',
        data: workoutPlan,
        generatedAt: new Date(),
      });
    } catch (parseError) {
      // If JSON parsing fails, return the raw text
      res.json({
        message: 'Workout plan generated successfully',
        data: {
          rawResponse: text,
          note: 'Response could not be parsed as JSON. Please check the format.'
        },
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Generate workout plan error:', error);
    res.status(500).json({ 
      message: 'Failed to generate workout plan',
      error: error.message 
    });
  }
});

// Get health recommendations
router.post('/recommendations', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const { focus = 'general' } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ 
        message: 'AI service not configured. Please add GEMINI_API_KEY to environment variables.' 
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Provide personalized health and wellness recommendations for a person with the following profile:

User Profile:
- Age: ${user.age || 'Not specified'}
- Gender: ${user.gender || 'Not specified'}
- Height: ${user.height || 'Not specified'} cm
- Weight: ${user.weight || 'Not specified'} kg
- BMI: ${user.currentBMI || 'Not calculated'}
- Activity Level: ${user.activityLevel || 'moderately_active'}
- Goals: ${user.goals.join(', ') || 'general health'}
- Dietary Restrictions: ${user.dietaryRestrictions.join(', ') || 'none'}
- Focus Area: ${focus}

Please provide recommendations for:
1. Nutrition and hydration
2. Exercise and movement
3. Sleep and recovery
4. Stress management
5. Preventive health measures
6. Lifestyle adjustments

Keep recommendations practical, evidence-based, and personalized to the user's profile. Include specific actionable steps.

Format as JSON:
{
  "recommendations": {
    "nutrition": [],
    "exercise": [],
    "sleep": [],
    "stress": [],
    "preventive": [],
    "lifestyle": []
  },
  "priorityActions": [],
  "healthInsights": []
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Try to parse JSON from the response
    try {
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const recommendations = JSON.parse(text);
      
      res.json({
        message: 'Health recommendations generated successfully',
        data: recommendations,
        generatedAt: new Date(),
      });
    } catch (parseError) {
      res.json({
        message: 'Health recommendations generated successfully',
        data: {
          rawResponse: text,
          note: 'Response could not be parsed as JSON. Please check the format.'
        },
        generatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Generate recommendations error:', error);
    res.status(500).json({ 
      message: 'Failed to generate recommendations',
      error: error.message 
    });
  }
});

module.exports = router;
