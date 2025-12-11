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
const trackApiUsage = require('./middleware/apiUsageTracker');

// Routes
const authRoutes = require('./routes/authRoutes');
const lawRoutes = require('./routes/lawRoutes');
const searchRoutes = require('./routes/search');
const ragLawRoutes = require('./routes/ragLawRoute');
const chatRagRoute = require('./routes/chatRagRoute');
const adminRoutes = require('./routes/adminRoutes');
const savedAdviceRoutes = require('./routes/savedAdviceRoutes');

// DB connect with retry logic
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of default 30s
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Track API usage for all routes
app.use(trackApiUsage);

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/laws', lawRoutes);
// Make search public by removing middlewares if desired:
// app.use('/api/search', searchRoutes);
app.use('/api/search', auth, guestLimiter, searchRoutes);
app.use('/api/rag-laws', auth, guestLimiter, ragLawRoutes);
app.use('/api/chat-rag', auth, guestLimiter, chatRagRoute);
app.use('/api/saved-advice', savedAdviceRoutes); // Protected by auth inside routes
app.use('/api/admin', auth, admin, adminRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
