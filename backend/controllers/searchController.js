/*
 * =======================================================
 * NYAYASATHI: SEARCH CONTROLLER (RAG)
 * =======================================================
 */

const Law = require('../models/Law');
const { getEmbedding } = require('../services/embeddingService');
const { cosineSimilarity } = require('../utils/similarity');

/**
 * @desc    AI semantic search over Law embeddings
 * @route   POST /api/search
 * @access  Public
 * body: { query: string, k?: number }
 */
async function searchLaws(req, res) {
  try {
    const { query, k, category, law_code, act_name, minScore } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ message: 'Please provide a search query.' });
    }
    const topK = Math.min(Math.max(parseInt(k || 3, 10), 1), 50);

    // Step 1: Embed the query
    const queryEmbedding = await getEmbedding(query);
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      return res.status(500).json({ message: 'Could not embed query.' });
    }

    // Build candidate filter
    const candidateQuery = {
      embeddings: { $exists: true, $type: 'array' },
      $expr: { $gt: [{ $size: '$embeddings' }, 0] }
    };
    if (category) candidateQuery.category = category;
    if (law_code) candidateQuery.law_code = law_code;
    if (act_name) candidateQuery.act_name = act_name;

    const laws = await Law.find(candidateQuery)
      .select('_id law_code act_name section_number title simplified_description punishment keywords embeddings')
      .lean();

    // Score by cosine similarity (skip mismatched vectors)
    const scored = [];
    for (const l of laws) {
      if (!Array.isArray(l.embeddings) || l.embeddings.length !== queryEmbedding.length) continue;
      const score = cosineSimilarity(queryEmbedding, l.embeddings);
      if (Number.isFinite(score)) {
        scored.push({
          _id: l._id,
          law_code: l.law_code,
          act_name: l.act_name,
          section_number: l.section_number,
          title: l.title,
          simplified_description: l.simplified_description,
          punishment: l.punishment,
          keywords: l.keywords,
          score
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);

    const filtered = typeof minScore === 'number'
      ? scored.filter(x => x.score >= minScore)
      : scored;

    return res.status(200).json({
      message: 'Context retrieved successfully',
      count: filtered.length,
      results: filtered.slice(0, topK),
      originalQuery: query
    });
  } catch (error) {
    console.error('Error in search controller:', error);
    return res.status(500).json({ message: 'Server error during search.' });
  }
}

module.exports = { searchLaws };