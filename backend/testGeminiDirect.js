// Direct HTTP test of Gemini API
require('dotenv').config();

async function testDirectAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    console.log(`Testing API Key: ${apiKey}\n`);

    // Try different API versions and models
    const tests = [
        { version: 'v1', model: 'gemini-pro' },
        { version: 'v1beta', model: 'gemini-pro' },
        { version: 'v1', model: 'gemini-1.5-pro' },
        { version: 'v1beta', model: 'gemini-1.5-pro' },
        { version: 'v1', model: 'gemini-1.5-flash' },
        { version: 'v1beta', model: 'gemini-1.5-flash' },
    ];

    for (const test of tests) {
        console.log(`\nTrying ${test.version}/models/${test.model}...`);
        
        const url = `https://generativelanguage.googleapis.com/${test.version}/models/${test.model}:generateContent?key=${apiKey}`;
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Say hello' }]
                    }]
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log(`✅ SUCCESS with ${test.version}/${test.model}`);
                console.log('Response:', JSON.stringify(data, null, 2).substring(0, 200));
                console.log(`\n🎉 Use this in your .env: GEMINI_MODEL_NAME=${test.model}`);
                return;
            } else {
                const error = await response.text();
                console.log(`❌ Failed: ${response.status} - ${error.substring(0, 100)}`);
            }
        } catch (err) {
            console.log(`❌ Error: ${err.message}`);
        }
    }

    console.log('\n\n⚠️  All tests failed. Your API key is invalid or restricted.');
    console.log('Please generate a new key at: https://makersuite.google.com/app/apikey');
}

testDirectAPI();
