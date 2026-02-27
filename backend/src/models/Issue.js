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
        enum: ['infrastructure', 'sanitation', 'environment', 'public_safety', 'other'] // Can be expanded later
    },
    location: {
        address: {
            type: String,
            required: [true, 'Please provide an address']
        },
        // GeoJSON Point format for future map integration
        coordinates: {
            type: {
                type: String,
                enum: ['Point'],
            },
            coordinates: {
                type: [Number],
                index: '2dsphere'
            }
        }
    },
    status: {
        type: String,
        enum: ['reported', 'verified', 'in_progress', 'resolved', 'dismissed'],
        default: 'reported'
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
    },
    aiClassification: {
        predictedCategory: String,
        confidenceScore: Number,
        isFlagged: {
            type: Boolean,
            default: false
        }
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
