// Azure Static Web Apps function for clearing all submissions
// File: api/clear/index.js

module.exports = async function (context, req) {
    context.log('Clear data function triggered');

    // Handle CORS
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        context.res.body = null;
        return;
    }

    if (req.method !== 'DELETE') {
        context.res.status = 405;
        context.res.body = { error: 'Method not allowed' };
        return;
    }

    try {
        // For demo purposes, simulate clearing data
        // In production, this would delete records from your database
        const deletedCount = 2; // Simulated count

        context.log('Data cleared successfully');

        // Return success response
        context.res.status = 200;
        context.res.body = {
            success: true,
            message: 'All submissions have been cleared',
            deletedCount: deletedCount
        };

    } catch (error) {
        context.log('Error clearing data:', error);
        
        context.res.status = 500;
        context.res.body = {
            error: 'Internal server error',
            message: 'Failed to clear data'
        };
    }
};