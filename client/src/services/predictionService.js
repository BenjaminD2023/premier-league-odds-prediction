import axios from 'axios';

const QWEN_API_BASE = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
const QWEN_API_KEY = import.meta.env.VITE_QWEN_API_KEY;

const MODEL_CONFIG = {
  'qwen-turbo': { id: 'qwen-turbo', disableThinking: false },
  'qwen3-max': { id: 'qwen3-max', disableThinking: false },
  'qwen3-8b': { id: 'qwen3-8b', disableThinking: true }
};
const DEFAULT_MODEL = MODEL_CONFIG['qwen3-8b'];

function hasQwenApiKey() {
  return !!(QWEN_API_KEY && QWEN_API_KEY !== 'your_qwen_api_key_here');
}

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

function resolveModelConfig(requested) {
  return MODEL_CONFIG[requested] || DEFAULT_MODEL;
}

async function makeLLMRequest(messages, modelConfig) {
  if (!hasQwenApiKey()) {
    throw new Error('Qwen API key not configured. Please set VITE_QWEN_API_KEY in .env file');
  }

  const parameters = { result_format: 'message' };
  if (modelConfig.disableThinking) parameters.enable_thinking = false;

  const response = await axios.post(QWEN_API_BASE, {
    model: modelConfig.id,
    input: {
      messages: [
        {
          role: 'system',
          content: 'You are a professional sports betting analyst with expertise in Premier League football. Provide accurate, data-driven odds predictions.'
        },
        ...messages
      ]
    },
    parameters
  }, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${QWEN_API_KEY}`
    }
  });

  return response.data;
}

export async function generatePrediction(matchData, model = 'qwen3-8b') {
  try {
    const modelConfig = resolveModelConfig(model);

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

    const data = await makeLLMRequest([
      {
        role: 'user',
        content: prompt
      }
    ], modelConfig);

    const content = data.output?.choices?.[0]?.message?.content || data.output?.text;
    const prediction = parseModelJSON(content);

    return {
      success: true,
      prediction: {
        ...prediction,
        timestamp: new Date().toISOString(),
        model: modelConfig.id
      }
    };
  } catch (error) {
    console.error('Error generating prediction:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function generateExplanation(matchData, prediction, question, model = 'qwen3-8b') {
  try {
    const modelConfig = resolveModelConfig(model);

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

    const data = await makeLLMRequest([
      {
        role: 'user',
        content: prompt
      }
    ], modelConfig);

    const explanation = data.output?.choices?.[0]?.message?.content || data.output?.text || 'No explanation available.';

    return {
      success: true,
      explanation,
      model: modelConfig.id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error generating explanation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export function compareOdds(llmPrediction, actualOdds) {
  try {
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

    const avgPercentageDiff = (
      comparison.homeWin.percentageDiff +
      comparison.draw.percentageDiff +
      comparison.awayWin.percentageDiff
    ) / 3;

    const accuracy = Math.max(0, 100 - avgPercentageDiff);

    return {
      success: true,
      comparison,
      accuracy: accuracy.toFixed(2),
      summary: {
        averageDifference: avgPercentageDiff.toFixed(2),
        closestPrediction: Object.entries(comparison).reduce((min, [key, val]) =>
          val.percentageDiff < comparison[min].percentageDiff ? key : min
          , 'homeWin')
      }
    };
  } catch (error) {
    console.error('Error comparing odds:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function checkAPIStatus() {
  return {
    hasQwenApiKey: hasQwenApiKey()
  };
}
