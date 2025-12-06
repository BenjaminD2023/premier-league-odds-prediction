// Global state
let selectedFixture = null;
let aiPredictionData = null;
let actualOddsData = null;
let lastMatchData = null;
let aiChatHistory = [];
let selectedModel = 'qwen3-8b';
let lastModelUsed = 'qwen3-8b';

// Utility functions
function convertDecimalToAmerican(dec) {
    if (!isFinite(dec) || dec <= 1) return 'N/A';
    if (dec >= 2) return `+${Math.round((dec - 1) * 100)}`;
    return `-${Math.round(100 / (dec - 1))}`;
}

function formatMoneylineWithProbability(dec) {
    if (!isFinite(dec) || dec <= 1) return 'N/A';
    const american = convertDecimalToAmerican(dec);
    const implied = (1 / dec * 100).toFixed(1);
    return `${american} <small>(${dec.toFixed(2)} | ${implied}% )</small>`;
}

function isSampleFixture(fixture) {
    return isNaN(Number(fixture?.fixture?.id));
}

function updateSampleDataBanner(usingSample) {
    const banner = document.getElementById('sampleDataBanner');
    if (!banner) return;
    banner.style.display = usingSample ? 'block' : 'none';
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showError(message) {
    // Create a toast notification instead of alert
    const toast = document.createElement('div');
    toast.className = 'error-message';
    toast.style.position = 'fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '10000';
    toast.style.maxWidth = '400px';
    toast.style.animation = 'slideIn 0.3s ease-out';
    toast.innerHTML = `<strong>Error:</strong> ${message}`;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
    
    // Add click to dismiss
    toast.style.cursor = 'pointer';
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Check API status on load
async function checkAPIStatus() {
    try {
        const response = await fetch('/api/health');
        const data = await response.json();
        
        const footballStatus = document.getElementById('footballApiStatus');
        const qwenStatus = document.getElementById('qwenApiStatus');
        
        if (data.hasFootballApiKey) {
            footballStatus.textContent = '✓ Configured';
            footballStatus.className = 'status-indicator configured';
        } else {
            footballStatus.textContent = '✗ Not Configured';
            footballStatus.className = 'status-indicator not-configured';
        }
        
        if (data.hasQwenApiKey) {
            qwenStatus.textContent = '✓ Configured';
            qwenStatus.className = 'status-indicator configured';
        } else {
            qwenStatus.textContent = '✗ Not Configured';
            qwenStatus.className = 'status-indicator not-configured';
        }
        
        return data;
    } catch (error) {
        console.error('Error checking API status:', error);
        return { hasFootballApiKey: false, hasQwenApiKey: false };
    }
}

// Load fixtures
async function loadFixtures() {
    showLoading();
    try {
        const response = await fetch('/api/football/fixtures');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to load fixtures');
        }
        
        displayFixtures(data.data);
        document.getElementById('fixturesSection').style.display = 'block';
    } catch (error) {
        showError(error.message);
        console.error('Error loading fixtures:', error);
    } finally {
        hideLoading();
    }
}

// Display fixtures
function displayFixtures(fixtures) {
    const container = document.getElementById('fixturesContainer');
    container.innerHTML = '';
    
    if (!fixtures || fixtures.length === 0) {
        container.innerHTML = '<p class="placeholder">No upcoming fixtures found.</p>';
        updateSampleDataBanner(false);
        return;
    }
    
    const sampleOnly = fixtures.filter(isSampleFixture);
    const listToRender = sampleOnly.length ? sampleOnly : fixtures;
    updateSampleDataBanner(sampleOnly.length > 0);
    
    listToRender.forEach(fixture => {
        const card = document.createElement('div');
        card.className = 'fixture-card';
        const samplePill = isSampleFixture(fixture) ? '<span class="sample-pill">Sample</span>' : '';
        card.innerHTML = `
            <div class="fixture-date">${formatDate(fixture.fixture.date)}</div>
            <div class="fixture-teams">
                ${fixture.teams.home.name} vs ${fixture.teams.away.name}
            </div>
            <div class="fixture-venue">${fixture.fixture.venue.name} ${samplePill}</div>
        `;
        
        card.addEventListener('click', () => selectFixture(fixture, card));
        container.appendChild(card);
    });
}

// Select a fixture
async function selectFixture(fixture, cardElement) {
    // Update UI
    document.querySelectorAll('.fixture-card').forEach(card => {
        card.classList.remove('selected');
    });
    cardElement.classList.add('selected');
    
    selectedFixture = fixture;
    aiPredictionData = null;
    actualOddsData = null;
    lastMatchData = null;
    aiChatHistory = [];
    
    // Load team statistics
    showLoading();
    try {
        const homeStatsResponse = await fetch(`/api/football/teams/${fixture.teams.home.id}/statistics`);
        const awayStatsResponse = await fetch(`/api/football/teams/${fixture.teams.away.id}/statistics`);
        
        const homeStats = await homeStatsResponse.json();
        const awayStats = await awayStatsResponse.json();
        
        displayMatchInfo(fixture, homeStats.data, awayStats.data);
        document.getElementById('predictionSection').style.display = 'block';
        
        // Reset prediction displays
        document.getElementById('aiPrediction').innerHTML = '<button id="generatePredictionBtn" class="btn btn-success">Generate AI Prediction</button>';
        document.getElementById('actualOdds').innerHTML = '<p class="placeholder">Load odds from bookmakers</p><button id="loadOddsBtn" class="btn btn-secondary">Load Actual Odds</button>';
        document.getElementById('comparisonSection').style.display = 'none';
        
        // Re-attach event listeners
        document.getElementById('generatePredictionBtn').addEventListener('click', generatePrediction);
        document.getElementById('loadOddsBtn').addEventListener('click', loadActualOdds);
        
        // Scroll to prediction section
        document.getElementById('predictionSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError('Error loading team statistics: ' + error.message);
        console.error('Error loading team statistics:', error);
    } finally {
        hideLoading();
    }
}

// Display match information
function displayMatchInfo(fixture, homeStats, awayStats) {
    const container = document.getElementById('matchInfo');
    const sampleTag = isSampleFixture(fixture) ? '<div class="sample-tag">Sample Fixture Data</div>' : '';
    
    container.innerHTML = `
        <div class="match-header">
            ${fixture.teams.home.name} vs ${fixture.teams.away.name}
        </div>
        ${sampleTag}
        <div style="text-align: center; color: #666; margin-bottom: 20px;">
            ${formatDate(fixture.fixture.date)} | ${fixture.fixture.venue.name}
        </div>
        <div class="team-stats">
            <div class="team-stat-box">
                <h4>${fixture.teams.home.name} (Home)</h4>
                ${formatTeamStats(homeStats)}
            </div>
            <div class="team-stat-box">
                <h4>${fixture.teams.away.name} (Away)</h4>
                ${formatTeamStats(awayStats)}
            </div>
        </div>
    `;
    
    aiChatHistory = [];
    renderChatInterface();
}

// Format team statistics
function formatTeamStats(stats) {
    if (!stats) {
        return '<p>Statistics not available</p>';
    }

    const renderBlock = (label, payload) => {
        if (!payload) return '';
        const played = payload.fixtures?.played?.total ?? 'N/A';
        const wins = payload.fixtures?.wins?.total ?? 'N/A';
        const draws = payload.fixtures?.draws?.total ?? 'N/A';
        const loses = payload.fixtures?.loses?.total ?? 'N/A';
        const goalsFor = payload.goals?.for?.total?.total ?? 'N/A';
        const goalsAgainst = payload.goals?.against?.total?.total ?? 'N/A';
        const form = payload.form || 'N/A';
        const rank = payload.league?.rank ? `Rank: #${payload.league.rank}` : '';
        const subLabel = payload.label ? ` • ${payload.label}` : '';

        return `
            <div class="stat-period">
                <div class="stat-period-header">
                    <span>${label}${subLabel}</span>
                    <span>${rank}</span>
                </div>
                <div class="stat-item">
                    <span>Matches Played:</span>
                    <strong>${played}</strong>
                </div>
                <div class="stat-item">
                    <span>Wins:</span>
                    <strong>${wins}</strong>
                </div>
                <div class="stat-item">
                    <span>Draws:</span>
                    <strong>${draws}</strong>
                </div>
                <div class="stat-item">
                    <span>Losses:</span>
                    <strong>${loses}</strong>
                </div>
                <div class="stat-item">
                    <span>Goals For / Against:</span>
                    <strong>${goalsFor} / ${goalsAgainst}</strong>
                </div>
                <div class="stat-item">
                    <span>Form:</span>
                    <strong>${form}</strong>
                </div>
            </div>
        `;
    };

    const sections = [
        renderBlock('2021 Season', stats.season2021),
        renderBlock('2022 Pre-Match', stats.season2022PreMatch)
    ].filter(Boolean);

    return sections.length
        ? `<div class="stat-periods">${sections.join('')}</div>`
        : '<p>Statistics not available</p>';
}

function summarizeSeasonStats(period) {
    if (!period) return null;
    const wins = period.fixtures?.wins?.total ?? 0;
    const draws = period.fixtures?.draws?.total ?? 0;
    const loses = period.fixtures?.loses?.total ?? 0;

    return {
        season: period.league?.season ?? 'N/A',
        rank: period.league?.rank ?? 'N/A',
        form: period.form || 'N/A',
        goalsFor: period.goals?.for?.total?.total ?? 0,
        goalsAgainst: period.goals?.against?.total?.total ?? 0,
        record: `${wins}W-${draws}D-${loses}L`
    };
}

function buildStatsPayload(rawStats) {
    return {
        season2021: summarizeSeasonStats(rawStats?.season2021),
        season2022PreMatch: summarizeSeasonStats(rawStats?.season2022PreMatch)
    };
}

// Generate AI prediction
async function generatePrediction() {
    if (!selectedFixture) {
        showError('Please select a fixture first');
        return;
    }
    
    showLoading();
    try {
        // Fetch team statistics for prediction
        const homeStatsResponse = await fetch(`/api/football/teams/${selectedFixture.teams.home.id}/statistics`);
        const awayStatsResponse = await fetch(`/api/football/teams/${selectedFixture.teams.away.id}/statistics`);
        
        const homeStats = await homeStatsResponse.json();
        const awayStats = await awayStatsResponse.json();
        
        const homeStatsPayload = buildStatsPayload(homeStats.data);
        const awayStatsPayload = buildStatsPayload(awayStats.data);
        
        const matchData = {
            homeTeam: selectedFixture.teams.home.name,
            awayTeam: selectedFixture.teams.away.name,
            date: formatDate(selectedFixture.fixture.date),
            homeStats: homeStatsPayload,
            awayStats: awayStatsPayload
        };
        
        lastMatchData = matchData;
        
        const response = await fetch('/api/prediction/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                matchData,
                model: selectedModel
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate prediction');
        }
        
        lastModelUsed = selectedModel;
        aiPredictionData = data.prediction;
        displayAIPrediction(data.prediction);
        
        // Check if we can compare
        if (actualOddsData) {
            compareOdds();
        }
    } catch (error) {
        showError(error.message);
        console.error('Error generating prediction:', error);
    } finally {
        hideLoading();
    }
}

// Load actual odds (moneyline 1X2)
async function loadActualOdds() {
    if (!selectedFixture) {
        showError('Please select a fixture first');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`/api/football/odds/${selectedFixture.fixture.id}`);
        const data = await response.json();

        console.log('Odds API response:', data);
        
        if (!data.success || !data.data || !data.data.odds) {
            if (data.message) console.warn(data.message);
            displayManualOddsInput();
            return;
        }

        const market = data.data;
        const odds = market.odds;

        const homeWin = parseFloat(odds.homeWin);
        const draw = parseFloat(odds.draw);
        const awayWin = parseFloat(odds.awayWin);

        if (!isFinite(homeWin) || !isFinite(draw) || !isFinite(awayWin)) {
            console.warn('Parsed odds contain non-finite values from API-Football/sample source:', odds);
            displayManualOddsInput();
            return;
        }

        actualOddsData = {
            homeWinDecimal: homeWin,
            drawDecimal: draw,
            awayWinDecimal: awayWin,
            homeWinAmerican: convertDecimalToAmerican(homeWin),
            drawAmerican: convertDecimalToAmerican(draw),
            awayWinAmerican: convertDecimalToAmerican(awayWin),
            bookmakerName: market.bookmaker?.title || market.bookmaker?.key || 'Bookmaker'
        };

        displayActualOdds(actualOddsData);
        
        if (aiPredictionData) {
            compareOdds();
        }
    } catch (error) {
        console.error('Error loading odds:', error);
        displayManualOddsInput();
    } finally {
        hideLoading();
    }
}

// Display manual odds input (moneyline)
function displayManualOddsInput() {
    const container = document.getElementById('actualOdds');
    
    container.innerHTML = `
        <p style="margin-bottom: 15px; text-align: center;">
            No moneyline odds available from API. Enter bookmaker odds manually:
        </p>
        <div class="odds-display">
            <div class="odds-item">
                <span class="odds-label">Home Moneyline:</span>
                <input type="number" id="manualHomeWin" step="0.01" placeholder="2.50" style="width: 80px; padding: 5px; font-size: 1.2em;">
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <input type="number" id="manualDraw" step="0.01" placeholder="3.20" style="width: 80px; padding: 5px; font-size: 1.2em;">
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Moneyline:</span>
                <input type="number" id="manualAwayWin" step="0.01" placeholder="2.80" style="width: 80px; padding: 5px; font-size: 1.2em;">
            </div>
        </div>
        <button id="submitManualOdds" class="btn btn-secondary" style="width: 100%; margin-top: 15px;">Submit Odds</button>
    `;
    
    document.getElementById('submitManualOdds').addEventListener('click', () => {
        const homeWin = parseFloat(document.getElementById('manualHomeWin').value);
        const draw = parseFloat(document.getElementById('manualDraw').value);
        const awayWin = parseFloat(document.getElementById('manualAwayWin').value);
        
        if (isNaN(homeWin) || isNaN(draw) || isNaN(awayWin)) {
            showError('Please enter valid decimal moneyline odds for all outcomes');
            return;
        }
        
        actualOddsData = { 
            homeWinDecimal: homeWin,
            drawDecimal: draw,
            awayWinDecimal: awayWin,
            homeWinAmerican: convertDecimalToAmerican(homeWin),
            drawAmerican: convertDecimalToAmerican(draw),
            awayWinAmerican: convertDecimalToAmerican(awayWin),
            bookmakerName: 'Manual Entry' 
        };
        displayActualOdds(actualOddsData);
        
        if (aiPredictionData) {
            compareOdds();
        }
    });
}

// Display actual odds
function displayActualOdds(odds) {
    const container = document.getElementById('actualOdds');
    
    container.innerHTML = `
        <div class="odds-display">
            <div class="odds-item">
                <span class="odds-label">Home Moneyline:</span>
                <span class="odds-value">${formatMoneylineWithProbability(odds.homeWinDecimal)}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <span class="odds-value">${formatMoneylineWithProbability(odds.drawDecimal)}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Moneyline:</span>
                <span class="odds-value">${formatMoneylineWithProbability(odds.awayWinDecimal)}</span>
            </div>
        </div>
        <p style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
            Moneyline odds from ${odds.bookmakerName || 'bookmaker'}
        </p>
    `;
}

// Display AI prediction
function displayAIPrediction(prediction) {
    const container = document.getElementById('aiPrediction');
    
    container.innerHTML = `
        <div class="odds-display">
            <div class="odds-item">
                <span class="odds-label">Home Moneyline:</span>
                <span class="odds-value">${formatMoneylineWithProbability(prediction.homeWin)}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <span class="odds-value">${formatMoneylineWithProbability(prediction.draw)}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Moneyline:</span>
                <span class="odds-value">${formatMoneylineWithProbability(prediction.awayWin)}</span>
            </div>
        </div>
        <div class="confidence-meter">
            <strong>Confidence Level:</strong>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${prediction.confidence}%">
                    ${prediction.confidence}%
                </div>
            </div>
        </div>
        <p class="prediction-note">
            Curious about these numbers? Use the “Ask the AI Why” chat to dig deeper.
        </p>
        <p style="text-align: center; margin-top: 10px; color: #666; font-size: 0.9em;">
            Generated by ${prediction.model} at ${new Date(prediction.timestamp).toLocaleTimeString()}
        </p>
    `;
    renderChatInterface();
}

function renderChatInterface() {
    const container = document.getElementById('aiExplanation');
    if (!container) return;

    const historyHtml = aiChatHistory.length
        ? aiChatHistory.map(entry => `
            <div class="chat-bubble ${entry.role}">
                <strong>${entry.role === 'user' ? 'You' : 'AI'}:</strong>
                <p>${entry.message.replace(/\n+/g, '<br>')}</p>
            </div>
        `).join('')
        : '<p class="placeholder">Generate a prediction first, then ask your own follow-up questions here.</p>';

    const disabled = aiPredictionData ? '' : 'disabled';

    container.innerHTML = `
        <div class="chat-history">${historyHtml}</div>
        <div class="chat-input">
            <textarea id="chatQuestion" placeholder="Ask the AI why it priced the draw this way..." rows="2" ${disabled}></textarea>
            <button id="sendChatBtn" class="btn btn-primary" ${disabled}>Send</button>
        </div>
    `;

    if (!aiPredictionData) return;

    document.getElementById('sendChatBtn').addEventListener('click', sendChatQuestion);
}

async function sendChatQuestion() {
    const textarea = document.getElementById('chatQuestion');
    const question = textarea.value.trim();
    if (!question) {
        showError('Enter a question for the AI.');
        return;
    }
    aiChatHistory.push({ role: 'user', message: question });
    renderChatInterface();

    textarea.value = '';
    await requestAIPredictionExplanation(question);
}

async function requestAIPredictionExplanation(question) {
    if (!aiPredictionData || !lastMatchData) {
        showError('Generate a prediction first.');
        return;
    }

    showLoading();
    try {
        const response = await fetch('/api/prediction/explain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                matchData: lastMatchData,
                prediction: aiPredictionData,
                question,
                model: lastModelUsed || selectedModel
            })
        });

        const data = await response.json();
        if (!data.success || !data.explanation) {
            throw new Error(data.error || 'Failed to fetch explanation');
        }

        aiChatHistory.push({
            role: 'assistant',
            message: data.explanation,
            meta: { model: data.model, timestamp: data.timestamp }
        });
        renderChatInterface();
    } catch (error) {
        showError(error.message);
        console.error('Error requesting explanation:', error);
    } finally {
        hideLoading();
    }
}

// Compare odds
async function compareOdds() {
    if (!aiPredictionData || !actualOddsData) {
        return;
    }
    
    showLoading();
    try {
        const response = await fetch('/api/prediction/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                llmPrediction: aiPredictionData,
                actualOdds: {
                    homeWin: actualOddsData.homeWinDecimal,
                    draw: actualOddsData.drawDecimal,
                    awayWin: actualOddsData.awayWinDecimal
                }
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to compare odds');
        }
        
        displayComparison(data);
        document.getElementById('comparisonSection').style.display = 'block';
        document.getElementById('comparisonSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        showError(error.message);
        console.error('Error comparing odds:', error);
    } finally {
        hideLoading();
    }
}

// Display comparison results
function displayComparison(data) {
    const container = document.getElementById('comparisonResults');
    
    container.innerHTML = `
        <div class="accuracy-score">${data.accuracy}%</div>
        <p style="text-align: center; font-size: 1.2em; margin-bottom: 20px;">Overall Accuracy</p>
        
        <div class="comparison-grid">
            <div class="comparison-item">
                <div class="comparison-header">Home Win</div>
                <div class="comparison-values">
                    <div class="value-box">
                        <span class="value-label">AI Prediction</span>
                        <div class="value-number">${data.comparison.homeWin.llm.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.homeWin.actual.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.homeWin.difference.toFixed(2)}</div>
                    </div>
                </div>
                <div class="difference">
                    ${data.comparison.homeWin.percentageDiff.toFixed(2)}% difference
                </div>
            </div>
            
            <div class="comparison-item">
                <div class="comparison-header">Draw</div>
                <div class="comparison-values">
                    <div class="value-box">
                        <span class="value-label">AI Prediction</span>
                        <div class="value-number">${data.comparison.draw.llm.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.draw.actual.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.draw.difference.toFixed(2)}</div>
                    </div>
                </div>
                <div class="difference">
                    ${data.comparison.draw.percentageDiff.toFixed(2)}% difference
                </div>
            </div>
            
            <div class="comparison-item">
                <div class="comparison-header">Away Win</div>
                <div class="comparison-values">
                    <div class="value-box">
                        <span class="value-label">AI Prediction</span>
                        <div class="value-number">${data.comparison.awayWin.llm.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.awayWin.actual.toFixed(2)}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.awayWin.difference.toFixed(2)}</div>
                    </div>
                </div>
                <div class="difference">
                    ${data.comparison.awayWin.percentageDiff.toFixed(2)}% difference
                </div>
            </div>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background: #e8f5e9; border-radius: 8px;">
            <strong>Summary:</strong> The AI's closest prediction was for <strong>${data.summary.closestPrediction}</strong> 
            with an average difference of <strong>${data.summary.averageDifference}%</strong> across all outcomes.
        </div>
    `;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAPIStatus();
    initModelSelector();
    document.getElementById('loadFixturesBtn').addEventListener('click', loadFixtures);
});

function initModelSelector() {
    const select = document.getElementById('modelSelect');
    const label = document.getElementById('modelSelectLabelValue');
    if (!select) return;

    const updateLabel = () => {
        if (label) {
            const option = select.options[select.selectedIndex];
            label.textContent = option?.dataset?.desc || option?.text || 'Qwen3 8B';
        }
    };

    select.value = selectedModel;
    updateLabel();

    select.addEventListener('change', () => {
        selectedModel = select.value;
        updateLabel();
    });
}
