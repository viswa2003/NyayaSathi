// routes/ragLawRoute.js
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const Law = require("../models/Law");
const { auth } = require('../middleware/authMiddleware');
const guestLimiter = require('../middleware/guestLimiter');
require("dotenv").config();

// Import semantic search tools
const { getEmbedding } = require('../services/embeddingService');
const { cosineSimilarity } = require('../utils/similarity');

// Initialize the AI Client with new SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// @route   POST api/rag-laws/laws
// @desc    Get legal information based on user problem (RAG with semantic search)
// @access  Private (Requires valid token - user or guest)
router.post("/laws", auth, guestLimiter, async (req, res) => {
  try {
    const { userProblem } = req.body;
    if (!userProblem) {
      return res.status(400).json({ message: "User problem description is required." });
    }

    console.log(`RAG query received from user ID: ${req.user.id}, Role: ${req.user.role}`);

    // --- RAG Logic with Semantic Search ---
    
    // 1. Retrieval - Embed the user's problem
    const queryEmbedding = await getEmbedding(userProblem);

    // 2. Find all laws with embeddings
    const allLaws = await Law.find({ 
      embeddings: { $exists: true, $type: 'array' },
      $expr: { $gt: [{ $size: '$embeddings' }, 0] }
    }).lean();

    // 3. Calculate similarity for each law
    const scoredLaws = allLaws
      .map(law => {
        if (!Array.isArray(law.embeddings) || law.embeddings.length !== queryEmbedding.length) {
          return null;
        }
        return {
          ...law,
          score: cosineSimilarity(queryEmbedding, law.embeddings)
        };
      })
      .filter(x => x !== null && Number.isFinite(x.score));

    // 4. Sort by score and get top 5
    const foundLaws = scoredLaws
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Check if we have relevant results (threshold 0.3)
    if (!foundLaws.length || foundLaws[0].score < 0.3) {
      return res.status(404).json({ 
        message: "No relevant laws found matching your description in our database." 
      });
    }

    // 5. Prepare context for AI (Augmentation)
    const contextFromDB = foundLaws.map((law) => ({
      law_code: law.law_code,
      section_number: law.section_number,
      title: law.title,
      simplified_description: law.simplified_description,
      description: law.description,
      punishment: law.punishment,
      category: law.category,
      act_name: law.act_name,
      similarity_score: law.score.toFixed(3) // Optional: show relevance
    }));

    // 6. Create Prompt for AI (Generation)
    const generationPrompt = `
      You are Nyayasathi, a legal information API for India. Based ONLY on the User Problem and Relevant Sections (from database context), generate a single, valid JSON object matching the schema below. Output ONLY the raw JSON, nothing else. Do NOT give legal advice.

      User Problem: "${userProblem}"

      Relevant Sections (Context - sorted by semantic relevance):
      ${JSON.stringify(contextFromDB, null, 2)}

      JSON Output Schema:
      {
        "legalInformation": "string (Simple, empathetic explanation referencing relevant acts)",
        "punishment": "string (Summary of applicable punishments from the relevant sections, if any. If no punishment is specified, state 'Not specified' or explain the legal consequence)",
        "relevantSections": [ { 
          "act_name": "string (from context)",
          "law_code": "string (from context, e.g., BNS)",
          "section_number": "string",
          "section_title": "string",
          "simple_explanation": "string (from context)",
          "legal_text": "string (from context)",
          "punishment": "string (from context)"
        } ],
        "nextSteps": { "suggestions": "string (2-3 safe, general next steps in India, separated by newline characters \\n - one step per line)", "disclaimer": "This is informational only, not legal advice. Consult a qualified legal professional." }
      }
    `;

    // 7. Call AI (Generation) - Updated for new SDK
    const modelName = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp";
    const generationResult = await ai.models.generateContent({
      model: modelName,
      contents: generationPrompt
    });
    const generatedText = generationResult.text;

    // 8. Parse and Send Response
    try {
      const cleanJsonText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();
      if (!cleanJsonText.startsWith('{') || !cleanJsonText.endsWith('}')) {
          throw new Error("AI response is not valid JSON format.");
      }
      const structuredResponse = JSON.parse(cleanJsonText);
      res.status(200).json(structuredResponse);
    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", parseError);
      console.error("AI Response causing error (first 500 chars):", generatedText.substring(0, 500));
      res.status(500).json({ message: "Error processing the AI response. Please try again." });
    }
  } catch (error) {
    const userId = req.user ? req.user.id : 'N/A';
    console.error(`Error in /laws route for user ${userId}:`, error);
    res.status(500).json({ message: "An internal server error occurred while processing your request." });
  }
});

module.exports = router;