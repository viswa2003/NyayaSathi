const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Require middlewares BEFORE use
const { auth, admin } = require('./middleware/authMiddleware');
const guestLimiter = require('./middleware/guestLimiter');

// Routes
const authRoutes = require('./routes/authRoutes');
const lawRoutes = require('./routes/lawRoutes');
const searchRoutes = require('./routes/search');
const ragLawRoutes = require('./routes/ragLawRoute');
const adminRoutes = require('./routes/adminRoutes');
const savedAdviceRoutes = require('./routes/savedAdviceRoutes');

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/laws', lawRoutes);
// Make search public by removing middlewares if desired:
// app.use('/api/search', searchRoutes);
app.use('/api/search', auth, guestLimiter, searchRoutes);
app.use('/api/rag-laws', auth, guestLimiter, ragLawRoutes);
app.use('/api/saved-advice', savedAdviceRoutes); // Protected by auth inside routes
app.use('/api/admin', auth, admin, adminRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
