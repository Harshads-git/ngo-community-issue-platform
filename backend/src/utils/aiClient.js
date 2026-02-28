const axios = require('axios');

/**
 * Service to call the AI Python microservice for classification and severity detection
 * If the microservice is down or not configured, it will fallback to rule-based mocking
 */
exports.analyzeIssueText = async (description) => {
    try {
        const aiUrl = process.env.AI_SERVICE_URL;

        if (aiUrl) {
            // Attempt to call the real AI microservice
            const response = await axios.post(`${aiUrl}/analyze`, { text: description }, { timeout: 3000 });
            return response.data; // Example expected: { predictedCategory: 'environment', severity: 'high', confidenceScore: 0.92 }
        } else {
            // No URL defined, throw to trigger fallback mock
            throw new Error('AI Service not configured');
        }
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🤖 Falling back to AI Mock System. Reason: ${error.message}`);
        }

        // --- VERY BASIC NLP MOCKING FALLBACK ---
        const text = description.toLowerCase();
        let predictedCategory = 'other';
        let severity = 'low';

        // Mock Categories
        if (text.includes('pothole') || text.includes('road') || text.includes('bridge') || text.includes('water pipe')) {
            predictedCategory = 'infrastructure';
        } else if (text.includes('garbage') || text.includes('waste') || text.includes('smell') || text.includes('dirty')) {
            predictedCategory = 'sanitation';
        } else if (text.includes('tree') || text.includes('pollution') || text.includes('smoke') || text.includes('lake')) {
            predictedCategory = 'environment';
        } else if (text.includes('crime') || text.includes('dark') || text.includes('robbery') || text.includes('accident')) {
            predictedCategory = 'public_safety';
        }

        // Mock Severities
        if (text.includes('danger') || text.includes('immediate') || text.includes('fatal') || text.includes('blood')) {
            severity = 'critical';
        } else if (text.includes('huge') || text.includes('many') || text.includes('blocked') || text.includes('broken')) {
            severity = 'high';
        } else if (text.includes('small') || text.includes('minor') || text.includes('little')) {
            severity = 'low';
        } else {
            severity = 'medium'; // Default fallback
        }

        // Mock Response to match Issue schema
        return {
            predictedCategory,
            severity,
            confidenceScore: parseFloat((Math.random() * (0.95 - 0.70) + 0.70).toFixed(2)) // random score between 70% and 95%
        };
    }
};
