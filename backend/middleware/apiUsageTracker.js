const ApiUsage = require('../models/ApiUsage');

// Middleware to track API usage
const trackApiUsage = async (req, res, next) => {
    // Skip tracking for certain routes
    const skipRoutes = ['/api/auth', '/api/admin/api-usage'];
    const shouldSkip = skipRoutes.some(route => req.path.startsWith(route));
    
    if (shouldSkip) {
        return next();
    }

    try {
        // Get today's date at midnight (for daily aggregation)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Try to update existing record or create new one
        await ApiUsage.findOneAndUpdate(
            {
                date: today,
                endpoint: req.path,
                method: req.method
            },
            {
                $inc: { count: 1 }
            },
            {
                upsert: true,
                new: true
            }
        );
    } catch (err) {
        // Don't block the request if tracking fails
        console.error('API usage tracking error:', err);
    }

    next();
};

module.exports = trackApiUsage;
