const express = require('express');
const {
    getIssues,
    getIssue,
    createIssue,
    updateIssue,
    deleteIssue,
    uploadIssuePhoto,
    getIssueMetrics,
    upvoteIssue
} = require('../controllers/issue');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router
    .route('/metrics/all')
    .get(protect, authorize('ngo', 'admin'), getIssueMetrics);

router
    .route('/')
    .get(getIssues)
    .post(protect, createIssue);

router
    .route('/:id')
    .get(getIssue)
    .put(protect, authorize('citizen', 'ngo', 'admin'), updateIssue)
    .delete(protect, authorize('citizen', 'admin'), deleteIssue);

router
    .route('/:id/upvote')
    .put(protect, upvoteIssue);

router
    .route('/:id/photo')
    .put(protect, upload.array('images', 5), uploadIssuePhoto);

module.exports = router;
