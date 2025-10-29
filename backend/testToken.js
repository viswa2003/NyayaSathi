require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;

async function testToken() {
  console.log('Testing HuggingFace token:', HF_TOKEN ? `${HF_TOKEN.substring(0, 10)}...` : 'NOT FOUND');
  
  try {
    const hf = new HfInference(HF_TOKEN);
    
    const result = await hf.featureExtraction({
      model: 'sentence-transformers/all-mpnet-base-v2',
      inputs: 'Hello world'
    });
    
    console.log('✅ Token works!');
    console.log('Response type:', Array.isArray(result) ? 'Array' : typeof result);
    console.log('Embedding dimensions:', result.length);
    console.log('First 5 values:', result.slice(0, 5));
  } catch (error) {
    console.error('❌ Token failed!');
    console.error('Error:', error.message);
  }
}

testToken();