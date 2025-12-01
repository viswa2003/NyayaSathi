// routes/ragLawRoute.js
const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai"); // Using the new SDK
const Law = require("../models/Law");
const { auth } = require('../middleware/authMiddleware');
const guestLimiter = require('../middleware/guestLimiter');
require("dotenv").config();

// Import semantic search tools
const { getEmbedding } = require('../services/embeddingService');
const { cosineSimilarity } = require('../utils/similarity');

// Initialize the AI Client
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

    // console.log(`RAG query received from user ID: ${req.user.id}`);

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
      similarity_score: law.score.toFixed(3)
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

    // 7. Call AI (Generation) - UPDATED FOR STABILITY & SAFETY
    // Using gemini-2.5-flash for speed and generous free tier
    const modelName = "gemini-2.5-flash"; 
    
    const generationResult = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
            role: "user",
            parts: [{ text: generationPrompt }]
        }
      ],
      // CRITICAL: Safety settings allow the model to discuss "crimes" without blocking
      config: {
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ]
      }
    });

    // Handle different response structures (Robustness check)
    let generatedText = "";
    if (generationResult && generationResult.text) {
        generatedText = typeof generationResult.text === 'function' 
            ? generationResult.text() 
            : generationResult.text;
    } else if (generationResult && generationResult.response && generationResult.response.text) {
        generatedText = typeof generationResult.response.text === 'function'
            ? generationResult.response.text()
            : generationResult.response.text;
    }

    // 8. Parse and Send Response
    try {
      if (!generatedText) {
          throw new Error("AI returned empty response. It may have been blocked or the model is overloaded.");
      }

      const cleanJsonText = generatedText.replace(/```json/g, "").replace(/```/g, "").trim();
      
      if (!cleanJsonText.startsWith('{') || !cleanJsonText.endsWith('}')) {
          // Fallback: Try to find JSON within the text
          const firstCurly = cleanJsonText.indexOf('{');
          const lastCurly = cleanJsonText.lastIndexOf('}');
          if(firstCurly !== -1 && lastCurly !== -1) {
             const fixedJson = cleanJsonText.substring(firstCurly, lastCurly + 1);
             const structuredResponse = JSON.parse(fixedJson);
             return res.status(200).json(structuredResponse);
          }
          throw new Error("AI response is not valid JSON format.");
      }

      const structuredResponse = JSON.parse(cleanJsonText);
      res.status(200).json(structuredResponse);

    } catch (parseError) {
      console.error("Failed to parse JSON from AI:", parseError);
      console.error("Raw AI Response:", generatedText);
      res.status(500).json({ message: "Error processing the AI response. Please try again." });
    }

  } catch (error) {
    const userId = req.user ? req.user.id : 'N/A';
    console.error(`Error in /laws route for user ${userId}:`, error);
    // Explicitly check for Quota/Overloaded errors
    if (error.status === 429 || (error.message && error.message.includes("429"))) {
         return res.status(429).json({ message: "Server is currently busy (Quota Exceeded). Please try again in a moment." });
    }
    res.status(500).json({ message: "An internal server error occurred." });
  }
});

module.exports = router;