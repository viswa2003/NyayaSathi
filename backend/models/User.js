// models/User.js

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // Changed 'name' to 'username' to match frontend usage
    username: {
        type: String,
        required: true,
        trim: true // Remove whitespace
    },
    email: {
        type: String,
        // Removed required: true
        unique: true,
        sparse: true, // Allows multiple documents to have null/missing email
        lowercase: true, // Store emails consistently
        trim: true
    },
    password: {
        type: String,
        // Removed required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'guest'], // Added 'guest' role
        default: 'user' // Default for registered users
    },
    createdAt: { // Renamed 'date' for clarity and consistency
        type: Date,
        default: Date.now
    },
}, { timestamps: true }); // Use timestamps for createdAt and updatedAt

// Note: No need for manual index - 'unique: true' and 'sparse: true' on the email field
// already create the necessary index automatically

module.exports = mongoose.model('User', userSchema);