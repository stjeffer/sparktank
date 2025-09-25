// Azure Static Web Apps function for retrieving all submissions
// File: api/submissions/index.js

// In-memory storage reference (shared with submit function)
// Note: In Azure Static Web Apps, functions run independently so we need external storage
// For production, use Cosmos DB or Azure Table Storage

module.exports = async function (context, req) {
    context.log('Get submissions function triggered');

    // Handle CORS
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        context.res.body = null;
        return;
    }

    if (req.method !== 'GET') {
        context.res.status = 405;
        context.res.body = { error: 'Method not allowed' };
        return;
    }

    try {
        // For demo purposes, return some sample data
        // In production, this would query your database
        const sampleSubmissions = [
            {
                id: "demo1",
                teamName: "Innovation Squad",
                useCase: "AI-powered customer service chatbot that learns from interactions",
                timestamp: new Date().toISOString(),
                sessionId: 'workshop-' + new Date().toISOString().split('T')[0]
            },
            {
                id: "demo2", 
                teamName: "Future Builders",
                useCase: "Blockchain-based supply chain transparency platform",
                timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                sessionId: 'workshop-' + new Date().toISOString().split('T')[0]
            }
        ];

        context.log('Returning submissions:', sampleSubmissions.length);

        // Return all submissions
        context.res.status = 200;
        context.res.body = sampleSubmissions;

    } catch (error) {
        context.log('Error retrieving submissions:', error);
        
        context.res.status = 500;
        context.res.body = {
            error: 'Internal server error',
            message: 'Failed to retrieve submissions'
        };
    }
};