// Azure Static Web Apps function for submitting team ideas
// File: api/submit/index.js

const { CosmosClient } = require('@azure/cosmos');

// In-memory storage for workshop submissions (for demo purposes)
// In production, this would connect to your Cosmos DB
let submissions = [];

module.exports = async function (context, req) {
    context.log('Submit function triggered');
    
    // Handle CORS (Azure Static Web Apps handles this automatically, but adding for completeness)
    context.res = {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        context.res.status = 200;
        context.res.body = null;
        return;
    }

    if (req.method !== 'POST') {
        context.res.status = 405;
        context.res.body = { error: 'Method not allowed' };
        return;
    }

    try {
        // Validate request body
        if (!req.body || !req.body.teamName || !req.body.useCase) {
            context.res.status = 400;
            context.res.body = { 
                error: 'Missing required fields: teamName and useCase are required' 
            };
            return;
        }

        // Validate input lengths
        if (req.body.teamName.trim().length === 0) {
            context.res.status = 400;
            context.res.body = { error: 'Team name cannot be empty' };
            return;
        }

        if (req.body.teamName.length > 100) {
            context.res.status = 400;
            context.res.body = { error: 'Team name must be less than 100 characters' };
            return;
        }

        if (req.body.useCase.length > 1000) {
            context.res.status = 400;
            context.res.body = { error: 'Use case description must be less than 1000 characters' };
            return;
        }

        // Create submission object
        const submission = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            teamName: req.body.teamName.trim(),
            useCase: req.body.useCase.trim(),
            timestamp: new Date().toISOString(),
            sessionId: 'workshop-' + new Date().toISOString().split('T')[0]
        };

        // Store submission (in memory for this demo)
        submissions.push(submission);

        context.log('Submission created:', JSON.stringify(submission));

        // Return success response
        context.res.status = 200;
        context.res.body = {
            success: true,
            id: submission.id,
            message: 'Submission received successfully'
        };

    } catch (error) {
        context.log('Error processing submission:', error);
        
        context.res.status = 500;
        context.res.body = {
            error: 'Internal server error',
            message: 'Failed to process submission'
        };
    }
};