const router = require('express').Router();
const { searchLaws } = require('../controllers/searchController');

router.get('/', (req, res) => {
  res.json({ message: 'POST to /api/search with { query, k }' });
});

router.post('/', searchLaws);

module.exports = router;