const mongoose = require('mongoose');

/**
 * Nyayasathi: Single Collection Law Schema
 * * Supports categorical browsing and AI RAG search.
 */
const lawSchema = new mongoose.Schema(
  {
    // --- 1. Fields for Browsing & Categorization ---
    category: { 
      type: String, 
      required: true, 
      index: true 
    },
    act_name: { 
      type: String, 
      required: true, 
      index: true 
    },
    law_code: { 
      type: String, 
      required: true, 
      index: true 
    },

    // --- 2. Fields for Section Details ---
    section_number: { 
      type: String, 
      required: true, 
      index: true 
    },
    title: { 
      type: String, 
      required: true, 
      text: true 
    },
    description: { 
      type: String, 
      required: true,
      text: true 
    },
    simplified_description: { 
      type: String, 
      required: true,
      text: true 
    },

    // --- 3. Field for RAG (AI Search) ---
    embeddings: { 
      type: [Number] 
      // Add vector index in your DB if needed: index: "vector"
    },
    
    // --- 4. Optional & Recommended Fields ---
    punishment: { 
      type: String, 
      default: "Not specified" 
    },
    keywords: { 
      type: [String], 
      index: true 
    },
    
    /**
     * OPTIONAL: Array of strings containing examples illustrating the section.
     * Not required, use only for important or confusing sections.
     * Example: ["A shoots Z with the intention of killing him. A commits murder."]
     */
    examples: {
      type: [String],
      required: false // Explicitly stating it's not required
    } 
    
    // --- You could add back other fields from your initial schema if needed ---
    // bailable: { type: String, enum: ["Bailable", "Non-bailable"] },
    // cognizable: { type: String, enum: ["Cognizable", "Non-cognizable"] },
    // compoundable: { type: String, enum: ["Compoundable", "Non-compoundable"] },
    // related_sections: [Object], 

  }, 
  { 
    timestamps: true 
  }
);

// --- Indexes ---
lawSchema.index({ 
  title: "text", 
  description: "text", 
  simplified_description: "text", 
  keywords: "text" 
});
lawSchema.index({ law_code: 1, section_number: 1 }, { unique: true });
// If sections can repeat across acts, use:
// LawSchema.index({ act_name: 1, law_code: 1, section_number: 1 }, { unique: true });

module.exports = mongoose.model('Law', lawSchema);