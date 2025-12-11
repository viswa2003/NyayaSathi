const Law = require('../models/Law');
const { getEmbedding } = require('../services/embeddingService');

// Compose the text used for generating embeddings from law fields
function composeLawText(fields) {
  const parts = [
    fields.act_name,
    fields.law_code,
    fields.section_number,
    fields.title,
    fields.description,
    fields.simplified_description,
    fields.punishment,
    Array.isArray(fields.keywords) ? fields.keywords.join(', ') : undefined,
  ].filter(Boolean);
  return parts.join(' \n ');
}

// GET all laws (with optional filters)
const getAllLaws = async (req, res) => {
  try {
    const { category, law_code, search, page, limit } = req.query;
    
    let filter = {};
    
    // Filter by category
    if (category) {
      filter.category = category;
    }
    
    // Filter by law_code
    if (law_code) {
      filter.law_code = law_code;
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 0; // 0 means no limit (fetch all)
    const skip = limitNum > 0 ? (pageNum - 1) * limitNum : 0;
    
    const [laws, total] = await Promise.all([
      Law.find(filter)
        .sort({ law_code: 1, section_number: 1 })
        .skip(skip)
        .limit(limitNum),
      Law.countDocuments(filter)
    ]);
    
    // If pagination is requested, return with metadata
    if (limitNum > 0) {
      res.json({
        laws,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum)
      });
    } else {
      // Return simple array for backward compatibility
      res.json(laws);
    }
  } catch (err) {
    console.error('Error fetching laws:', err);
    res.status(500).json({ message: 'Failed to fetch laws' });
  }
};

// GET by id
const getLawById = async (req, res) => {
  try {
    const law = await Law.findById(req.params.id);
    if (!law) return res.status(404).json({ message: 'Law not found' });
    res.json(law);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch law' });
  }
};

// CREATE
const createLaw = async (req, res) => {
  try {
    const {
      category,
      act_name,
      law_code,
      section_number,
      title,
      description,
      simplified_description,
      punishment,
      keywords,
      examples,
    } = req.body;

    if (!category || !act_name || !law_code || !section_number || !title || !description || !simplified_description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate embedding automatically on create
    let embeddings;
    try {
      const text = composeLawText({
        act_name,
        law_code,
        section_number,
        title,
        description,
        simplified_description,
        punishment,
        keywords,
      });
      embeddings = await getEmbedding(text);
    } catch (e) {
      console.error('Failed to generate embeddings on create:', e?.message || e);
      // Proceed without embeddings if HF is down; client can backfill later
      embeddings = undefined;
    }

    const law = await Law.create({
      category,
      act_name,
      law_code,
      section_number,
      title,
      description,
      simplified_description,
      punishment,
      keywords,
      embeddings,
      examples,
    });

    res.status(201).json(law);
  } catch (err) {
    console.error('Error creating law:', err);
    res.status(500).json({ message: 'Failed to create law' });
  }
};

// UPDATE
const updateLaw = async (req, res) => {
  try {
    const allowed = [
      'category','act_name','law_code','section_number','title',
      'description','simplified_description','punishment','keywords','embeddings','examples'
    ];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    // Load current doc to decide on embedding refresh and compose text
    const existing = await Law.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Law not found' });

    const embeddingRelevantKeys = new Set([
      'act_name','law_code','section_number','title','description','simplified_description','punishment','keywords'
    ]);
    const shouldReembed = Object.keys(updates).some(k => embeddingRelevantKeys.has(k));

    if (shouldReembed) {
      try {
        const merged = {
          act_name: updates.act_name ?? existing.act_name,
          law_code: updates.law_code ?? existing.law_code,
          section_number: updates.section_number ?? existing.section_number,
          title: updates.title ?? existing.title,
          description: updates.description ?? existing.description,
          simplified_description: updates.simplified_description ?? existing.simplified_description,
          punishment: updates.punishment ?? existing.punishment,
          keywords: updates.keywords ?? existing.keywords,
        };
        const text = composeLawText(merged);
        updates.embeddings = await getEmbedding(text);
      } catch (e) {
        console.error('Failed to regenerate embeddings on update:', e?.message || e);
        // Keep existing embeddings if embedding refresh fails
      }
    }

    const law = await Law.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(law);
  } catch (err) {
    console.error('Error updating law:', err);
    res.status(500).json({ message: 'Failed to update law' });
  }
};

// DELETE
const deleteLaw = async (req, res) => {
  try {
    const law = await Law.findByIdAndDelete(req.params.id);
    if (!law) return res.status(404).json({ message: 'Law not found' });
    res.json({ message: 'Law deleted' });
  } catch (err) {
    console.error('Error deleting law:', err);
    res.status(500).json({ message: 'Failed to delete law' });
  }
};

// LOOKUP by identifiers (law_code+section_number) or (act_name+section_number)
const lookupLaw = async (req, res) => {
  try {
    const { law_code, act_name, section_number } = req.query;

    if (!section_number) {
      return res.status(400).json({ message: 'section_number is required' });
    }

    const filter = { section_number };
    if (law_code) filter.law_code = law_code;
    if (act_name) filter.act_name = act_name;

    // Prefer exact match with both identifiers if provided
    const law = await Law.findOne(filter);
    if (!law) {
      return res.status(404).json({ message: 'Law not found for given identifiers' });
    }
    res.json(law);
  } catch (err) {
    console.error('Error looking up law:', err);
    res.status(500).json({ message: 'Failed to lookup law' });
  }
};

// GET all unique categories
const getCategories = async (req, res) => {
  try {
    const categories = await Law.distinct('category');
    res.json(categories);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Failed to fetch categories' });
  }
};

// GET acts by category
const getActsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const acts = await Law.find({ category }).distinct('act_name');
    res.json(acts);
  } catch (err) {
    console.error('Error fetching acts:', err);
    res.status(500).json({ message: 'Failed to fetch acts' });
  }
};

module.exports = { 
  getAllLaws, 
  getLawById, 
  createLaw, 
  updateLaw, 
  deleteLaw,
  getCategories,
  getActsByCategory,
  lookupLaw
};
