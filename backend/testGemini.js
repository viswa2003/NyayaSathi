const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function testGeminiAPI() {
    console.log('Testing Gemini API with new key...\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL_NAME || 'gemini-1.5-flash';
    
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}`);
    console.log(`Model: ${modelName}\n`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }

    try {
        // Initialize the Gemini AI client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName });

        console.log('Sending test prompt to Gemini...\n');

        // Simple test prompt
        const prompt = "Say 'Hello from Gemini!' and confirm you are working correctly.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS! Gemini API is working.\n');
        console.log('Response from Gemini:');
        console.log('─'.repeat(60));
        console.log(text);
        console.log('─'.repeat(60));

        // Test with a legal query similar to your RAG use case
        console.log('\n\nTesting with a legal query...\n');
        const legalPrompt = `Given this Indian law section:

Section: BNS 302 - Murder
Description: Whoever commits murder shall be punished with death or imprisonment for life, and shall also be liable to fine.

User Query: What is the punishment for murder in India?

Provide a brief answer in JSON format: { "answer": "..." }`;

        const legalResult = await model.generateContent(legalPrompt);
        const legalResponse = await legalResult.response;
        const legalText = legalResponse.text();

        console.log('Legal Query Response:');
        console.log('─'.repeat(60));
        console.log(legalText);
        console.log('─'.repeat(60));

        console.log('\n✅ All tests passed! Your Gemini API key is working correctly.');
        
    } catch (error) {
        console.error('\n❌ ERROR: Gemini API test failed\n');
        
        // Show actual error details
        console.error('Full error message:', error.message);
        console.error('\nError details:', error);
        
        if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('invalid')) {
            console.error('\n⚠️  The API key is invalid. Please check:');
            console.error('1. The key is correct in your .env file');
            console.error('2. The key is enabled in Google AI Studio');
            console.error('3. You have billing enabled (if required)');
        } else if (error.message?.includes('quota')) {
            console.error('\n⚠️  API quota exceeded. Check your usage in Google AI Studio.');
        } else if (error.message?.includes('model') || error.message?.includes('404')) {
            console.error(`\n⚠️  Model "${modelName}" not found or not accessible with this API key.`);
            console.error('Try using "gemini-1.5-flash" or "gemini-pro"');
        }
        
        process.exit(1);
    }
}

// Run the test
testGeminiAPI();