const express = require('express');
const router = express.Router();
const lawController = require('../controllers/lawController');
const { auth, admin } = require('../middleware/authMiddleware');

// Public routes
router.get('/', lawController.getAllLaws); // Supports ?category=X&law_code=Y&search=Z
router.get('/lookup', lawController.lookupLaw); // Lookup by law_code+section_number or act_name+section_number
router.get('/categories', lawController.getCategories);
router.get('/categories/:category/acts', lawController.getActsByCategory);
router.get('/:id', lawController.getLawById);

// Admin-only routes
router.post('/', auth, admin, lawController.createLaw);
router.put('/:id', auth, admin, lawController.updateLaw);
router.delete('/:id', auth, admin, lawController.deleteLaw);

module.exports = router;
