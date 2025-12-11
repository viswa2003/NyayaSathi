const mongoose = require('mongoose');

const savedAdviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true // Index for faster queries by user
  },
  userProblem: {
    type: String,
    required: true
  },
  legalInformation: {
    type: String,
    required: true
  },
  punishment: {
    type: String,
    default: ''
  },
  relevantSections: [{
    act_name: String,
    law_code: String,
    section_number: String,
    section_title: String,
    simple_explanation: String,
    legal_text: String,
    punishment: String
  }],
  nextSteps: {
    suggestions: String,
    disclaimer: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can query their own saved advice efficiently
savedAdviceSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('SavedAdvice', savedAdviceSchema);
