const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const MODEL_CONFIG = {
    'qwen-turbo': { id: 'qwen-turbo', disableThinking: false },
    'qwen3-max': { id: 'qwen3-max', disableThinking: false },
    'qwen3-8b': { id: 'qwen3-8b', disableThinking: true }
};
const DEFAULT_MODEL = MODEL_CONFIG['qwen3-8b'];

/**
 * Helper to safely parse JSON emitted by Qwen models
 */
function parseModelJSON(content) {
    if (!content || typeof content !== 'string') {
        throw new Error('Model returned an empty response. Please try again.');
    }

    const trimmed = content.trim();
    if (/^too many/i.test(trimmed)) {
        throw new Error('Qwen rate limit reached. Wait a moment or choose a different model.');
    }

    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Model response did not contain JSON. Please retry or switch models.');
    }

    try {
        return JSON.parse(jsonMatch[0]);
    } catch (err) {
        console.warn('Failed to parse model JSON:', err, 'Raw snippet:', trimmed.slice(0, 200));
        throw new Error('Model response was not valid JSON. Please retry or switch models.');
    }
}

/**
 * Helper function to resolve model configuration
 */
function resolveModelConfig(requested) {
    return MODEL_CONFIG[requested] || DEFAULT_MODEL;
}

/**
 * Helper function to make Qwen API requests
 */
async function makeLLMPrediction(matchData, modelConfig) {
    const apiKey = process.env.QWEN_API_KEY;
    
    if (!apiKey || apiKey === 'your_qwen_api_key_here') {
        throw new Error('Qwen API key not configured. Please set QWEN_API_KEY in .env file');
    }
    
    const prompt = `You are a sports betting analyst. Analyze the provided Premier League match using ONLY the statistics supplied below. 
Rules:
1. Do NOT use online search, browsing tools, or any external knowledge of actual bookmaker odds or final match outcomes.
2. Base your reasoning strictly on the historical (2021 season) and pre-match 2022 statistics that stop before kickoff.
3. Return decimal odds only.

Match context:
${JSON.stringify(matchData, null, 2)}

Respond with JSON in this exact shape:
{
  "homeWin": <decimal odds>,
  "draw": <decimal odds>,
  "awayWin": <decimal odds>,
  "confidence": <percentage>,
  "reasoning": "<brief explanation>"
}`;

    const parameters = { result_format: 'message' };
    if (modelConfig.disableThinking) parameters.enable_thinking = false;

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelConfig.id,
            input: {
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional sports betting analyst with expertise in Premier League football. Provide accurate, data-driven odds predictions.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            },
            parameters
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Qwen API error: ${error.message || response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract content from Qwen API response
    // Qwen API can return content in different formats depending on the parameters
    const content = data.output?.choices?.[0]?.message?.content || data.output?.text;
    return parseModelJSON(content);
}

/**
 * Helper function to explain Qwen predictions
 */
async function makeLLMExplanation(matchData, prediction, question = '', modelConfig = DEFAULT_MODEL) {
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey || apiKey === 'your_qwen_api_key_here') {
        throw new Error('Qwen API key not configured. Please set QWEN_API_KEY in .env file');
    }

    const prompt = `You previously produced the decimal moneyline odds below for this Premier League match. The user now wants deeper insight using ONLY the historical stats provided (no web searches or bookmaker data). Reference the prediction values explicitly.

Match context:
${JSON.stringify(matchData, null, 2)}

Your prediction:
${JSON.stringify(prediction, null, 2)}

User question: ${question || 'Explain the prediction in more detail.'}

Respond with concise paragraphs (no JSON) that answer the user question and include:
1. Key statistical drivers for each outcome.
2. Why the specific odds values make sense relative to each other.
3. Any caveats or data limitations.`;

    const parameters = { result_format: 'message' };
    if (modelConfig.disableThinking) parameters.enable_thinking = false;

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: modelConfig.id,
            input: {
                messages: [
                    { role: 'system', content: 'You are a professional football betting analyst. Explain predictions clearly using only provided data.' },
                    { role: 'user', content: prompt }
                ]
            },
            parameters
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Qwen API error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data.output?.choices?.[0]?.message?.content || data.output?.text || 'No explanation available.';
}

/**
 * POST /api/prediction/predict
 * Generate AI prediction for a match
 */
router.post('/predict', async (req, res) => {
    try {
        const { matchData, model } = req.body || {};
        if (!matchData?.homeTeam || !matchData?.awayTeam) {
            return res.status(400).json({ success: false, error: 'Missing required match data' });
        }

        const modelConfig = resolveModelConfig(model);
        const prediction = await makeLLMPrediction(matchData, modelConfig);

        res.json({
            success: true,
            prediction: {
                ...prediction,
                timestamp: new Date().toISOString(),
                model: modelConfig.id
            }
        });
    } catch (error) {
        console.error('Error generating prediction:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/prediction/compare
 * Compare LLM prediction with actual betting odds
 */
router.post('/compare', async (req, res) => {
    try {
        const { llmPrediction, actualOdds } = req.body;
        
        if (!llmPrediction || !actualOdds) {
            return res.status(400).json({
                success: false,
                error: 'Missing required data for comparison'
            });
        }
        
        // Calculate differences
        const comparison = {
            homeWin: {
                llm: llmPrediction.homeWin,
                actual: actualOdds.homeWin,
                difference: Math.abs(llmPrediction.homeWin - actualOdds.homeWin),
                percentageDiff: Math.abs((llmPrediction.homeWin - actualOdds.homeWin) / actualOdds.homeWin * 100)
            },
            draw: {
                llm: llmPrediction.draw,
                actual: actualOdds.draw,
                difference: Math.abs(llmPrediction.draw - actualOdds.draw),
                percentageDiff: Math.abs((llmPrediction.draw - actualOdds.draw) / actualOdds.draw * 100)
            },
            awayWin: {
                llm: llmPrediction.awayWin,
                actual: actualOdds.awayWin,
                difference: Math.abs(llmPrediction.awayWin - actualOdds.awayWin),
                percentageDiff: Math.abs((llmPrediction.awayWin - actualOdds.awayWin) / actualOdds.awayWin * 100)
            }
        };
        
        // Calculate overall accuracy
        const avgPercentageDiff = (
            comparison.homeWin.percentageDiff +
            comparison.draw.percentageDiff +
            comparison.awayWin.percentageDiff
        ) / 3;
        
        const accuracy = Math.max(0, 100 - avgPercentageDiff);
        
        res.json({
            success: true,
            comparison,
            accuracy: accuracy.toFixed(2),
            summary: {
                averageDifference: avgPercentageDiff.toFixed(2),
                closestPrediction: Object.entries(comparison).reduce((min, [key, val]) => 
                    val.percentageDiff < comparison[min].percentageDiff ? key : min
                , 'homeWin')
            }
        });
    } catch (error) {
        console.error('Error comparing predictions:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/prediction/explain
 * Explain LLM prediction
 */
router.post('/explain', async (req, res) => {
    try {
        const { matchData, prediction, question, model } = req.body || {};
        if (!matchData || !prediction) {
            return res.status(400).json({ success: false, error: 'Missing match data or prediction context' });
        }

        const modelConfig = resolveModelConfig(model);
        const explanation = await makeLLMExplanation(matchData, prediction, question, modelConfig);

        res.json({
            success: true,
            explanation,
            model: modelConfig.id,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error generating explanation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
