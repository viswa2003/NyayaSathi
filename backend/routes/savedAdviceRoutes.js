const express = require('express');
const router = express.Router();
const SavedAdvice = require('../models/SavedAdvice');
const { auth } = require('../middleware/authMiddleware');

// @route   POST /api/saved-advice
// @desc    Save advice for a user
// @access  Private (user or admin only, not guests)
router.post('/', auth, async (req, res) => {
  try {
    // Prevent guests from saving advice
    if (req.user.role === 'guest') {
      return res.status(403).json({ 
        message: 'Guest users cannot save advice. Please sign up to save your queries.' 
      });
    }

    const { userProblem, legalInformation, punishment, relevantSections, nextSteps } = req.body;

    if (!userProblem || !legalInformation) {
      return res.status(400).json({ message: 'Missing required fields: userProblem and legalInformation are required' });
    }

    // Check if user already saved this exact problem
    const existingSave = await SavedAdvice.findOne({
      userId: req.user.id,
      userProblem: userProblem.trim()
    });

    if (existingSave) {
      return res.status(409).json({ 
        message: 'You have already saved advice for this query',
        existingSaveId: existingSave._id
      });
    }

    const savedAdvice = new SavedAdvice({
      userId: req.user.id,
      userProblem,
      legalInformation,
      punishment: punishment || '',
      relevantSections: relevantSections || [],
      nextSteps: nextSteps || { suggestions: '', disclaimer: '' }
    });

    await savedAdvice.save();
    
    console.log(`User ${req.user.id} saved advice: ${savedAdvice._id}`);
    
    res.status(201).json({ 
      message: 'Advice saved successfully', 
      savedAdvice 
    });
  } catch (error) {
    console.error('Error saving advice:', error);
    res.status(500).json({ message: 'Failed to save advice. Please try again.' });
  }
});

// @route   GET /api/saved-advice
// @desc    Get all saved advice for current user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role === 'guest') {
      return res.status(403).json({ message: 'Guest users have no saved advice. Please sign up.' });
    }

    const savedAdvices = await SavedAdvice.find({ userId: req.user.id })
      .sort({ createdAt: -1 }) // Most recent first
      .lean();

    res.status(200).json(savedAdvices);
  } catch (error) {
    console.error('Error fetching saved advice:', error);
    res.status(500).json({ message: 'Failed to fetch saved advice' });
  }
});

// @route   GET /api/saved-advice/:id
// @desc    Get single saved advice by ID
// @access  Private (user can only access their own advice)
router.get('/:id', auth, async (req, res) => {
  try {
    const savedAdvice = await SavedAdvice.findOne({ 
      _id: req.params.id,
      userId: req.user.id // Security: ensure user can only access their own advice
    }).lean();

    if (!savedAdvice) {
      return res.status(404).json({ message: 'Saved advice not found or you do not have permission to view it' });
    }

    res.status(200).json(savedAdvice);
  } catch (error) {
    console.error('Error fetching saved advice:', error);
    res.status(500).json({ message: 'Failed to fetch saved advice' });
  }
});

// @route   DELETE /api/saved-advice/:id
// @desc    Delete saved advice
// @access  Private (user can only delete their own advice)
router.delete('/:id', auth, async (req, res) => {
  try {
    const savedAdvice = await SavedAdvice.findOneAndDelete({ 
      _id: req.params.id,
      userId: req.user.id // Security: ensure user can only delete their own advice
    });

    if (!savedAdvice) {
      return res.status(404).json({ message: 'Saved advice not found or you do not have permission to delete it' });
    }

    console.log(`User ${req.user.id} deleted advice: ${req.params.id}`);
    
    res.status(200).json({ message: 'Advice deleted successfully' });
  } catch (error) {
    console.error('Error deleting saved advice:', error);
    res.status(500).json({ message: 'Failed to delete saved advice' });
  }
});

module.exports = router;
