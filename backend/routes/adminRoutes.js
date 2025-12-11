const express = require('express');
const router = express.Router();
const { auth, admin } = require('../middleware/authMiddleware');
const Law = require('../models/Law');
const User = require('../models/User');
const ApiUsage = require('../models/ApiUsage');

// GET /api/admin/stats
// Returns basic aggregate counts for admin dashboard
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const [totalLaws, totalUsers] = await Promise.all([
      Law.countDocuments({}),
      User.countDocuments({})
    ]);

    res.json({ totalLaws, totalUsers });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ message: 'Failed to fetch admin stats' });
  }
});

// GET /api/admin/users
// Returns list of users for admin management, with optional filters
router.get('/users', auth, admin, async (req, res) => {
  try {
    const { search = '', role, sort } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ username: regex }, { email: regex }];
    }

    const sortOrder = (typeof sort === 'string' && sort.toLowerCase() === 'asc') ? 1 : -1;

    const users = await User.find(filter)
      .select('username email role createdAt')
      .sort({ createdAt: sortOrder })
      .lean();

    res.json(users);
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// GET /api/admin/api-usage
// Returns API usage statistics for the last 7 days
router.get('/api-usage', auth, admin, async (req, res) => {
  try {
    const daysAgo = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);

    // Aggregate API calls by date
    const usageData = await ApiUsage.aggregate([
      {
        $match: {
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$date',
          totalCalls: { $sum: '$count' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Format data for frontend
    const formattedData = usageData.map(item => {
      const date = new Date(item._id);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        date: dayNames[date.getDay()],
        fullDate: date.toISOString().split('T')[0],
        calls: item.totalCalls
      };
    });

    // Fill in missing days with 0 calls
    const result = [];
    for (let i = daysAgo - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const fullDate = date.toISOString().split('T')[0];
      
      const existing = formattedData.find(d => d.fullDate === fullDate);
      result.push({
        date: dayNames[date.getDay()],
        calls: existing ? existing.calls : 0
      });
    }

    res.json(result);
  } catch (err) {
    console.error('API usage stats error:', err);
    res.status(500).json({ message: 'Failed to fetch API usage stats' });
  }
});

module.exports = router;
