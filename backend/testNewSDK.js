// Test with the new @google/genai package
const { GoogleGenerativeAI } = require('@google/genai');
require('dotenv').config();

async function testWithNewSDK() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log(`Testing with @google/genai package...`);
    console.log(`API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}\n`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        console.log('Sending test prompt...\n');

        const result = await model.generateContent('Say hello and confirm you are working');
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS! API is working with @google/genai\n');
        console.log('Response:');
        console.log('─'.repeat(60));
        console.log(text);
        console.log('─'.repeat(60));

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

testWithNewSDK();
