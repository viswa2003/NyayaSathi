require('dotenv').config();
const { HfInference } = require('@huggingface/inference');

const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
const MODEL = 'sentence-transformers/all-mpnet-base-v2';

const hf = new HfInference(HF_TOKEN);

/**
 * Returns embedding vector for the given text.
 * Uses official HuggingFace Inference SDK with feature extraction.
 * 
 * @param {string} text - Input text
 * @returns {Promise<number[]>} - Embedding vector [768]
 */
async function getEmbedding(text) {
  if (!HF_TOKEN) throw new Error('HUGGINGFACE_API_TOKEN missing in env');

  try {
    const result = await hf.featureExtraction({
      model: MODEL,
      inputs: text
    });

    // SDK returns the pooled embedding directly as [768] array
    return result;
  } catch (error) {
    console.error('HF API Error:', error.message);
    throw error;
  }
}

module.exports = { getEmbedding, MODEL };