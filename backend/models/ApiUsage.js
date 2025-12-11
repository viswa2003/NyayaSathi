const mongoose = require('mongoose');

const apiUsageSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        index: true
    },
    endpoint: {
        type: String,
        required: true
    },
    method: {
        type: String,
        required: true
    },
    count: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});

// Index for efficient querying by date
apiUsageSchema.index({ date: 1, endpoint: 1 });

module.exports = mongoose.model('ApiUsage', apiUsageSchema);
