const express = require("express");
const router = express.Router();
const { GoogleGenAI } = require("@google/genai");
const { auth } = require('../middleware/authMiddleware');
const guestLimiter = require('../middleware/guestLimiter');
const Law = require("../models/Law");
const { getEmbedding } = require("../services/embeddingService");
const { cosineSimilarity } = require("../utils/similarity");
require("dotenv").config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash-exp";

// Detect simple greetings/casual openers
function isGreeting(text = "") {
  const q = String(text || "").toLowerCase().trim();
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'namaste', 'namaskar', 'hola', 'yo'
  ];
  return greetings.some(g => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g));
}

// Simple heuristic to detect if a query is about Indian law/legal matters
function isLikelyLegalQuery(text = "") {
  const q = String(text || "").toLowerCase();
  const keywords = [
    // Generic legal terms
    'law', 'legal', 'illegal', 'act', 'section', 'penal', 'offence', 'offense', 'crime', 'criminal', 'civil',
    'court', 'judge', 'lawyer', 'advocate', 'bail', 'arrest', 'fir', 'ipc', 'bns', 'crpc', 'cpc', 'ni act',
    // Indian law specifics and common matters
    'indian penal code', 'bharatiya nyaya sanhita', 'nyaya', 'police', 'chargesheet', 'charge sheet', 'notice',
    'divorce', 'marriage', 'maintenance', 'alimony', 'dowry', '498a', '420', '302', 'cheque bounce', '138',
    'property dispute', 'contract', 'agreement', 'trespass', 'defamation', 'harassment', 'domestic violence'
  ];
  return keywords.some(k => q.includes(k));
}

// Detect if query needs specific section lookup vs. general legal knowledge
function needsSpecificSectionLookup(text = "") {
  const q = String(text || "").toLowerCase().trim();
  
  // Exclude greetings and casual conversation
  const greetings = [
    'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening',
    'thank you', 'thanks', 'ok', 'okay', 'bye', 'goodbye', 'see you'
  ];
  
  // If it's just a greeting or very short casual message, no lookup needed
  if (greetings.some(g => q === g || q.startsWith(g + ' ') || q.endsWith(' ' + g))) {
    return false;
  }
  
  // Indicators that need DB lookup: specific sections, case scenarios, "what law applies"
  const specificIndicators = [
    'section', 'what law', 'which law', 'what section', 'which section', 'applies to', 
    'applicable', 'under which', 'my case', 'my situation', 'i was', 'i am', 'i have been',
    'someone', 'neighbor', 'landlord', 'tenant', 'employer', 'employee', 'husband', 'wife',
    'police', 'arrested', 'threatened', 'harassed', 'cheated', 'fraud', 'assault', 'theft',
    'filed', 'fir', 'complaint', 'charge', 'accused', 'victim', 'can i', 'should i',
    'my rights', 'legal action', 'sue', 'file a case', 'what can i do', 'help with'
  ];
  
  // Indicators for general knowledge: stats, counts, explanations, definitions
  const generalIndicators = [
    'how many', 'what is', 'define', 'explain', 'difference between', 'types of',
    'history of', 'when was', 'who made', 'purpose of', 'overview', 'introduction',
    'tell me about', 'information about', 'meaning of'
  ];
  
  const hasSpecific = specificIndicators.some(k => q.includes(k));
  const hasGeneral = generalIndicators.some(k => q.includes(k));
  
  // If it has general indicators without specific ones, no lookup
  if (hasGeneral && !hasSpecific) return false;
  
  // If it has specific indicators, definitely lookup
  if (hasSpecific) return true;
  
  // Short queries without specific indicators (likely general chat) - no lookup
  if (q.length < 20) return false;
  
  // For longer queries without clear indicators, default to lookup for safety
  return true;
}

// POST /api/chat-rag
// Body: { message: string, history?: [{role: 'user'|'assistant', content: string}], topK?: number, embedding?: number[] }
router.post('/', auth, guestLimiter, async (req, res) => {
  try {
    const { message, history = [], topK = 5, embedding } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ message: 'message is required' });
    }

    // If it's a greeting, return a friendly introduction without retrieval
    if (isGreeting(message)) {
      return res.status(200).json({
        question: message,
        answer: "Hello! I’m NyayaSathi, a legal information assistant for Indian law. Ask me any legal question you have, and I’ll help with clear information. If needed, I can also point you to the most relevant sections of Indian law.",
        relevantSections: [],
        nextSteps: {
          suggestions: "• Ask a specific question about your situation\n• Mention any act/section if you know it\n• Share relevant details (place, timeline) for better context",
          disclaimer: "I am not a lawyer. This is general information, not legal advice."
        }
      });
    }

    // 1) Optional rewrite to standalone question
    const rewritePrompt = `
You are a query rewriter. Given the chat history and the latest user message, produce a single standalone question about Indian law. Output only the rewritten question.

Chat History:
${history.map(h => `${h.role}: ${h.content}`).join("\n")}

User Message:
${message}
    `.trim();

    let standalone = message;
    try {
      const rewrite = await ai.models.generateContent({ model: MODEL, contents: rewritePrompt });
      standalone = (rewrite.text || message).trim();
      if (!standalone) standalone = message;
    } catch (e) {
      // silent fallback
      standalone = message;
    }

    // Guardrail: Only proceed for legal queries (non-greeting). For non-legal, respond politely without sections.
    if (!isLikelyLegalQuery(standalone)) {
      return res.status(200).json({
        question: standalone,
        answer: "I can help with questions related to Indian law. Share your legal query or describe your situation, and I’ll do my best to help.",
        relevantSections: [],
        nextSteps: {
          suggestions: "• Briefly describe your issue\n• Mention any acts/sections if you know them\n• Ask what law applies or what you can do",
          disclaimer: "This is general information, not legal advice."
        }
      });
    }

    // Classify with Gemini whether sections are needed
    const classifyPrompt = `
You are a classifier. Analyze the user query (and history) and decide if the user explicitly needs relevant legal sections/provisions from Indian law.

Return strict JSON only:
{
  "needsSections": boolean,
  "explicitRequest": boolean,
  "reason": "string"
}

Guidance:
- If the user asks for a law/section/provision or "under which section", set both to true.
- If the user seeks only general advice or next steps, set needsSections to false.
- Do NOT include any text outside JSON.
    
Chat History:
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}

User Message: "${standalone}"
    `.trim();

    let shouldRetrieve = false;
    try {
      const cls = await ai.models.generateContent({ model: MODEL, contents: classifyPrompt });
      const clsRaw = (cls.text || "").replace(/```json|```/g, "").trim();
      const clf = JSON.parse(clsRaw);
      shouldRetrieve = !!(clf && (clf.needsSections || clf.explicitRequest));
    } catch {
      // Fallback heuristic
      shouldRetrieve = needsSpecificSectionLookup(standalone);
    }

    let context = [];

    if (shouldRetrieve) {
      // 2) Embed and retrieve (use provided embedding if valid)
      let queryEmbedding;
      if (Array.isArray(embedding) && embedding.length > 0 && embedding.every(n => typeof n === 'number')) {
        queryEmbedding = embedding;
      } else {
        queryEmbedding = await getEmbedding(standalone);
      }

      const allLaws = await Law.find({
        embeddings: { $exists: true, $type: 'array' },
        $expr: { $gt: [{ $size: '$embeddings' }, 0] }
      }).lean();

      const scored = allLaws
        .map(l => {
          if (!Array.isArray(l.embeddings) || l.embeddings.length !== queryEmbedding.length) return null;
          return { law: l, score: cosineSimilarity(queryEmbedding, l.embeddings) };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Math.min(10, topK)));

      if (!scored.length || scored[0].score < 0.3) {
        return res.status(404).json({ message: 'No relevant laws found for this query. Try rephrasing with more details.' });
      }

      context = scored.map(({ law, score }) => ({
        act_name: law.act_name,
        law_code: law.law_code,
        section_number: law.section_number,
        title: law.title,
        simplified_description: law.simplified_description,
        description: law.description,
        punishment: law.punishment,
        similarity_score: Number(score.toFixed(3))
      }));
    }

    // 3) Generate answer
    const genPrompt = shouldRetrieve && context.length > 0
      ? `
You are NyayaSathi, a legal information assistant for Indian law. Answer the user clearly and concisely based ONLY on the provided Relevant Sections.
- Do not provide legal advice; include the disclaimer.
- If unsure, say you don't have enough information.

Chat History:
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}

User Message: "${message}"

Relevant Sections (Top ${context.length} by semantic relevance):
${JSON.stringify(context, null, 2)}

Respond as valid JSON only:
{
  "answer": "string (concise, empathetic, references sections when helpful)",
  "relevantSections": [
    {
      "act_name": "string",
      "law_code": "string",
      "section_number": "string",
      "section_title": "string",
      "simple_explanation": "string",
      "punishment": "string"
    }
  ],
  "nextSteps": {
    "suggestions": "string (2-3 steps, newline-separated, one per line)",
    "disclaimer": "string"
  }
}
      `.trim()
  : `
You are NyayaSathi, a legal information assistant for Indian law. The user has a general question or greeting that doesn't require looking up specific sections.

Answer in a friendly, helpful manner. For greetings, respond warmly and offer assistance. For general legal questions, provide clear information based on your knowledge.

Chat History:
${history.map(h => `${h.role.toUpperCase()}: ${h.content}`).join("\n")}

User Message: "${message}"

Respond as valid JSON only:
{
  "answer": "string (friendly, conversational response for greetings OR clear informative answer for general questions)",
  "relevantSections": [],
  "nextSteps": {
    "suggestions": "",
    "disclaimer": ""
  }
}
      `.trim();

    const result = await ai.models.generateContent({ model: MODEL, contents: genPrompt });
    const raw = (result.text || "").replace(/```json|```/g, "").trim();

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      // Fallback structure
      data = shouldRetrieve && context.length > 0
        ? {
            answer: raw || "Sorry, I couldn't generate a response.",
            relevantSections: context.map(c => ({
              act_name: c.act_name,
              law_code: c.law_code,
              section_number: c.section_number,
              section_title: c.title,
              simple_explanation: c.simplified_description,
              punishment: c.punishment
            })),
            nextSteps: {
              suggestions: "Consult a qualified lawyer in your area\nVisit the nearest police station for assistance",
              disclaimer: "This is informational only, not legal advice. Consult a qualified legal professional."
            }
          }
        : {
            answer: raw || "Sorry, I couldn't generate a response.",
            relevantSections: [],
            nextSteps: {
              suggestions: "",
              disclaimer: "This is general information only, not legal advice."
            }
          };
    }

    return res.status(200).json({
      question: standalone,
      ...data
    });
  } catch (err) {
    console.error('Chat RAG error:', err);
    return res.status(500).json({ message: 'Failed to process chat query' });
  }
});

module.exports = router;
