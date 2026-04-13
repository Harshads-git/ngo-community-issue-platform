const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide an issue title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please provide an issue description'],
        maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    category: {
        type: String,
        required: [true, 'Please specify an issue category'],
        enum: ['infrastructure', 'sanitation', 'environment', 'public_safety', 'health', 'education', 'other']
    },

    // --- Structured location object (replaces plain string) ---
    location: {
        address: {
            type: String,
            required: [true, 'Please provide an address']
        },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        pincode: { type: String, default: '' },
        // GeoJSON Point — enables future map/geo queries
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],  // [longitude, latitude]
                default: [0, 0],
                index: '2dsphere'
            }
        }
    },

    status: {
        type: String,
        enum: ['reported', 'verified', 'in_progress', 'resolved', 'rejected', 'dismissed'],
        default: 'reported'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },

    // --- AI Classification (structured sub-document) ---
    aiClassification: {
        predictedCategory: String,
        confidenceScore: Number,
        isFlagged: {
            type: Boolean,
            default: false
        },
        keywords: {
            type: [String],  // array of keywords extracted by AI
            default: []
        }
    },

    // --- Tags / Labels (array of strings) ---
    tags: {
        type: [String],
        default: []
    },

    // --- Affected areas (array of location strings) ---
    affectedAreas: {
        type: [String],
        default: []
    },

    // --- Contact info (structured object, not plain string) ---
    contactInfo: {
        name: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' }
    },

    images: {
        type: [String], // Array of image URLs/paths
        validate: [arrayLimit, 'Exceeds the limit of 5 images']
    },
    upvotes: [{
        type: mongoose.Schema.ObjectId,
        ref: 'User'
    }],
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.ObjectId,
        ref: 'User' // Could be an NGO or Volunteer
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

function arrayLimit(val) {
    return val.length <= 5;
}

module.exports = mongoose.model('Issue', issueSchema);
