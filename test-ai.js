require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('Testing Gemini API configuration...');
console.log('API Key configured:', !!process.env.GEMINI_API_KEY);
console.log('API Key starts with:', process.env.GEMINI_API_KEY?.substring(0, 10) + '...');

async function testGeminiAPI() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not found in environment variables');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try the newer model name
    console.log('Trying gemini-1.5-flash model...');
    let model;
    try {
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    } catch (e) {
      console.log('gemini-1.5-flash not available, trying gemini-1.5-pro...');
      model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }

    console.log('Attempting to generate content with Gemini...');
    const prompt = "Generate a simple health tip in one sentence.";
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    console.log('✅ Success! Gemini API is working.');
    console.log('Response:', text);
  } catch (error) {
    console.log('❌ Error testing Gemini API:');
    console.log('Error message:', error.message);
    console.log('Error details:', error);
  }
}

testGeminiAPI();
