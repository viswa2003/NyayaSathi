const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log(`Testing API Key: ${apiKey ? apiKey.substring(0, 10) + '...' : 'NOT FOUND'}\n`);

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env file');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        
        console.log('Fetching available models...\n');
        
        // Try to list models
        const models = await genAI.listModels();
        
        console.log('✅ API Key is valid! Available models:');
        console.log('─'.repeat(60));
        
        for await (const model of models) {
            console.log(`Model: ${model.name}`);
            console.log(`  Display Name: ${model.displayName}`);
            console.log(`  Description: ${model.description || 'N/A'}`);
            console.log('');
        }
        
        console.log('─'.repeat(60));
        console.log('\n✅ Your API key is working! Update GEMINI_MODEL_NAME to one of the above models.');
        
    } catch (error) {
        console.error('\n❌ ERROR: Failed to access Gemini API\n');
        console.error('Error:', error.message);
        console.error('\nThis usually means:');
        console.error('1. ❌ Your API key is invalid or has been revoked');
        console.error('2. ❌ The API key has restrictions that block the Generative AI API');
        console.error('3. ❌ You need to enable the Generative Language API in your Google Cloud project');
        console.error('\n📝 Solution: Generate a new API key at https://makersuite.google.com/app/apikey');
        process.exit(1);
    }
}

listModels();
