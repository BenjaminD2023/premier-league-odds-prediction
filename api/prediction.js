const express = require('express');
const router = express.Router();

// Use node-fetch v2 for compatibility with CommonJS
const fetch = require('node-fetch');

/**
 * Convert decimal odds to moneyline (American) odds
 */
function decimalToMoneyline(decimal) {
    if (decimal >= 2.0) {
        const moneyline = Math.round((decimal - 1) * 100);
        return `+${moneyline}`;
    } else {
        const moneyline = Math.round(-100 / (decimal - 1));
        return `${moneyline}`;
    }
}

/**
 * Helper function to make Qwen API requests
 */
async function makeLLMPrediction(matchData) {
    const apiKey = process.env.QWEN_API_KEY;
    
    if (!apiKey || apiKey === 'your_qwen_api_key_here') {
        throw new Error('Qwen API key not configured. Please set QWEN_API_KEY in .env file');
    }
    
    const prompt = `You are a sports betting analyst. Analyze the following Premier League match and predict betting odds in moneyline (American) format.

Match: ${matchData.homeTeam} vs ${matchData.awayTeam}
Date: ${matchData.date}

${matchData.homeTeam} Statistics:
- League Position: ${matchData.homeStats?.position || 'N/A'}
- Form (last 5): ${matchData.homeStats?.form || 'N/A'}
- Goals For: ${matchData.homeStats?.goalsFor || 'N/A'}
- Goals Against: ${matchData.homeStats?.goalsAgainst || 'N/A'}
- Home Record: ${matchData.homeStats?.homeRecord || 'N/A'}

${matchData.awayTeam} Statistics:
- League Position: ${matchData.awayStats?.position || 'N/A'}
- Form (last 5): ${matchData.awayStats?.form || 'N/A'}
- Goals For: ${matchData.awayStats?.goalsFor || 'N/A'}
- Goals Against: ${matchData.awayStats?.goalsAgainst || 'N/A'}
- Away Record: ${matchData.awayStats?.awayRecord || 'N/A'}

Please provide your prediction in the following JSON format only, no additional text.
Moneyline odds format: positive (e.g., +150) for underdogs, negative (e.g., -200) for favorites.
{
  "homeWin": "<moneyline odds with + or - sign>",
  "draw": "<moneyline odds with + or - sign>",
  "awayWin": "<moneyline odds with + or - sign>",
  "confidence": <percentage>,
  "reasoning": "<brief explanation>"
}`;

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'qwen-turbo',
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
            parameters: {
                result_format: 'message'
            }
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
    
    if (!content) {
        throw new Error(`No content found in Qwen API response. Response structure: ${JSON.stringify(data.output || {})}`);
    }
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('Could not parse LLM response');
    }
    
    const prediction = JSON.parse(jsonMatch[0]);
    
    // Convert to moneyline if LLM returned decimal format
    const oddsFields = ['homeWin', 'draw', 'awayWin'];
    oddsFields.forEach(field => {
        if (typeof prediction[field] === 'number') {
            prediction[field] = decimalToMoneyline(prediction[field]);
        }
    });
    
    return prediction;
}

/**
 * POST /api/prediction/predict
 * Generate AI prediction for a match
 */
router.post('/predict', async (req, res) => {
    try {
        const matchData = req.body;
        
        if (!matchData.homeTeam || !matchData.awayTeam) {
            return res.status(400).json({
                success: false,
                error: 'Missing required match data'
            });
        }
        
        const prediction = await makeLLMPrediction(matchData);
        
        res.json({
            success: true,
            prediction: {
                ...prediction,
                timestamp: new Date().toISOString(),
                model: 'qwen-turbo'
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

module.exports = router;
