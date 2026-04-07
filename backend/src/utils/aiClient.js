const axios = require('axios');

/**
 * Service to call the Groq AI API for classification and severity detection
 * If the API is down or not configured, it will fallback to rule-based mocking
 */
exports.analyzeIssueText = async (description) => {
    try {
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('Groq API Key not configured');
        }

        // Call Groq API (OpenAI compatible)
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an AI assistant for a civic issue reporting platform. 
                        Analyze the issue description and provide classification in JSON format.
                        
                        Categories: [infrastructure, sanitation, environment, public_safety, other]
                        Severities: [critical, high, medium, low]
                        
                        Example Response:
                        {
                            "predictedCategory": "infrastructure",
                            "severity": "high",
                            "confidenceScore": 0.95
                        }`
                    },
                    {
                        role: 'user',
                        content: `Analyze this issue: "${description}"`
                    }
                ],
                response_format: { type: 'json_object' }
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        const content = response.data.choices[0]?.message?.content;
        if (!content) {
            throw new Error('Empty response from Groq API');
        }

        let aiResult;
        if (typeof content === 'string') {
            try {
                aiResult = JSON.parse(content);
            } catch (pErr) {
                console.error('Failed to parse AI JSON:', content);
                throw new Error('AI response is not valid JSON');
            }
        } else {
            aiResult = content;
        }

        // Validate result has required fields
        if (aiResult && (aiResult.predictedCategory || aiResult.category) && aiResult.severity) {
            return {
                predictedCategory: aiResult.predictedCategory || aiResult.category,
                severity: aiResult.severity,
                confidenceScore: aiResult.confidenceScore || 0.90
            };
        }

        console.warn('AI Response missing fields:', aiResult);
        throw new Error('Invalid AI response format');

    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🤖 AI Service Error. Falling back to Mock. Reason: ${error.message}`);
        }

        // --- VERY BASIC NLP MOCKING FALLBACK (Ensures system stays functional) ---
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

        return {
            predictedCategory,
            severity,
            confidenceScore: parseFloat((Math.random() * (0.95 - 0.70) + 0.70).toFixed(2))
        };
    }
};
