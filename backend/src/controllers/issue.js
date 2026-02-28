const Issue = require('../models/Issue');
const { analyzeIssueText } = require('../utils/aiClient');

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
exports.getIssues = async (req, res) => {
    try {
        let query;

        // Copy req.query
        const reqQuery = { ...req.query };

        // Fields to exclude from normal matching
        const removeFields = ['select', 'sort', 'page', 'limit'];

        // Loop over removeFields and delete them from reqQuery
        removeFields.forEach(param => delete reqQuery[param]);

        // Create query string
        let queryStr = JSON.stringify(reqQuery);

        // Create operators ($gt, $gte, etc) in case we need to filter by numbers/dates later
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

        // Finding resource
        query = Issue.find(JSON.parse(queryStr)).populate({
            path: 'user',
            select: 'name'
        });

        // Select Fields
        if (req.query.select) {
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        // Sort
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('-createdAt'); // Default sort by newest
        }

        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Issue.countDocuments(JSON.parse(queryStr));

        query = query.skip(startIndex).limit(limit);

        // Executing query
        const issues = await query;

        // Pagination result
        const pagination = {};

        if (endIndex < total) {
            pagination.next = {
                page: page + 1,
                limit
            }
        }

        if (startIndex > 0) {
            pagination.prev = {
                page: page - 1,
                limit
            }
        }

        res.status(200).json({
            success: true,
            count: issues.length,
            pagination,
            data: issues
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
exports.getIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id).populate({
            path: 'user',
            select: 'name role'
        });

        if (!issue) {
            return res.status(404).json({ success: false, message: `Issue not found with id of ${req.params.id}` });
        }

        res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = async (req, res) => {
    try {
        // Add user to req.body
        req.body.user = req.user.id;

        // --- AI MICROSERVICE INTEGRATION ---
        // Pass the user's description (and title) to the AI service
        const issueText = `${req.body.title}. ${req.body.description}`;
        const aiAnalysis = await analyzeIssueText(issueText);

        // Attach AI data to the issue before saving it into MongoDB
        req.body.category = aiAnalysis.predictedCategory || req.body.category;
        req.body.severity = aiAnalysis.severity || req.body.severity;
        req.body.aiClassification = {
            predictedCategory: aiAnalysis.predictedCategory,
            confidenceScore: aiAnalysis.confidenceScore,
            isFlagged: aiAnalysis.confidenceScore < 0.50 // Flag for human review if AI is unsure
        };

        const issue = await Issue.create(req.body);

        res.status(201).json({
            success: true,
            data: issue
        });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// @desc    Update issue (Status, Severity, etc)
// @route   PUT /api/issues/:id
// @access  Private
exports.updateIssue = async (req, res) => {
    try {
        let issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ success: false, message: `Issue not found with id of ${req.params.id}` });
        }

        // Make sure user is issue owner OR is an NGO/Admin
        if (issue.user.toString() !== req.user.id && req.user.role !== 'ngo' && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this issue` });
        }

        issue = await Issue.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: issue
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private
exports.deleteIssue = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ success: false, message: `Issue not found with id of ${req.params.id}` });
        }

        // Make sure user is issue owner OR is an admin
        if (issue.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to delete this issue` });
        }

        await issue.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Upload photo for issue
// @route   PUT /api/issues/:id/photo
// @access  Private
exports.uploadIssuePhoto = async (req, res) => {
    try {
        const issue = await Issue.findById(req.params.id);

        if (!issue) {
            return res.status(404).json({ success: false, message: `Issue not found with id of ${req.params.id}` });
        }

        // Make sure user is issue owner
        if (issue.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ success: false, message: `User ${req.user.id} is not authorized to update this issue` });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: `Please upload a file` });
        }

        // Get array of file paths
        const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);

        // Append to existing images
        issue.images = [...(issue.images || []), ...newImagePaths];

        // Check array limit
        if (issue.images.length > 5) {
            // NOTE: We could also delete the freshly uploaded files here since it's an error
            return res.status(400).json({ success: false, message: `Exceeds the limit of 5 images` });
        }

        await issue.save();

        res.status(200).json({
            success: true,
            data: issue.images
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get issue metrics/statistics
// @route   GET /api/issues/metrics/all
// @access  Private (NGO & Admin)
exports.getIssueMetrics = async (req, res) => {
    try {
        const totalIssues = await Issue.countDocuments();
        const resolvedIssues = await Issue.countDocuments({ status: 'resolved' });
        const pendingIssues = await Issue.countDocuments({ status: { $ne: 'resolved' } });

        const issuesByCategory = await Issue.aggregate([
            { $group: { _id: '$category', count: { $sum: 1 } } }
        ]);

        const issuesByStatus = await Issue.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        const issuesBySeverity = await Issue.aggregate([
            { $group: { _id: '$severity', count: { $sum: 1 } } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                summary: {
                    total: totalIssues,
                    resolved: resolvedIssues,
                    pending: pendingIssues,
                    resolutionRate: totalIssues > 0 ? ((resolvedIssues / totalIssues) * 100).toFixed(2) + '%' : '0%'
                },
                byCategory: issuesByCategory,
                byStatus: issuesByStatus,
                bySeverity: issuesBySeverity
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
