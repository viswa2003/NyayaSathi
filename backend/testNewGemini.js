const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: "AIzaSyAUafzfVvIHkhAgvoBaNKdclMwT4R57d8g" });

async function main() {
  try {
    console.log('Testing Gemini API with @google/genai package...\n');
    
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: "Explain how AI works in a few words",
    });
    
    console.log('✅ SUCCESS! API is working.\n');
    console.log('Response:');
    console.log('─'.repeat(60));
    console.log(response.text);
    console.log('─'.repeat(60));
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('\nFull error:', error);
  }
}

main();
