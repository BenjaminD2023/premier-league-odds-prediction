// Global state
let selectedFixture = null;
let aiPredictionData = null;
let actualOddsData = null;

// Utility functions
function decimalToMoneyline(decimal) {
    if (decimal >= 2.0) {
        const moneyline = Math.round((decimal - 1) * 100);
        return `+${moneyline}`;
    } else {
        const moneyline = Math.round(-100 / (decimal - 1));
        return `${moneyline}`;
    }
}

function moneylineToDecimal(moneyline) {
    const value = parseFloat(moneyline);
    if (value >= 0) {
        return 1 + (value / 100);
    } else {
        return 1 + (100 / Math.abs(value));
    }
}

function isMoneylineFormat(value) {
    return typeof value === 'string' && (value.includes('+') || value.includes('-'));
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
        return;
    }
    
    fixtures.forEach(fixture => {
        const card = document.createElement('div');
        card.className = 'fixture-card';
        card.innerHTML = `
            <div class="fixture-date">${formatDate(fixture.fixture.date)}</div>
            <div class="fixture-teams">
                ${fixture.teams.home.name} vs ${fixture.teams.away.name}
            </div>
            <div class="fixture-venue">${fixture.fixture.venue.name}</div>
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
    
    container.innerHTML = `
        <div class="match-header">
            ${fixture.teams.home.name} vs ${fixture.teams.away.name}
        </div>
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
}

// Format team statistics
function formatTeamStats(stats) {
    if (!stats || !stats.fixtures) {
        return '<p>Statistics not available</p>';
    }
    
    return `
        <div class="stat-item">
            <span>Matches Played:</span>
            <strong>${stats.fixtures.played.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Wins:</span>
            <strong>${stats.fixtures.wins.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Draws:</span>
            <strong>${stats.fixtures.draws.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Losses:</span>
            <strong>${stats.fixtures.loses.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Goals For:</span>
            <strong>${stats.goals.for.total.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Goals Against:</span>
            <strong>${stats.goals.against.total.total || 0}</strong>
        </div>
        <div class="stat-item">
            <span>Form:</span>
            <strong>${stats.form || 'N/A'}</strong>
        </div>
    `;
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
        
        const matchData = {
            homeTeam: selectedFixture.teams.home.name,
            awayTeam: selectedFixture.teams.away.name,
            date: formatDate(selectedFixture.fixture.date),
            homeStats: {
                position: homeStats.data?.league?.rank || 'N/A',
                form: homeStats.data?.form || 'N/A',
                goalsFor: homeStats.data?.goals?.for?.total?.total || 0,
                goalsAgainst: homeStats.data?.goals?.against?.total?.total || 0,
                homeRecord: `${homeStats.data?.fixtures?.wins?.home || 0}W-${homeStats.data?.fixtures?.draws?.home || 0}D-${homeStats.data?.fixtures?.loses?.home || 0}L`
            },
            awayStats: {
                position: awayStats.data?.league?.rank || 'N/A',
                form: awayStats.data?.form || 'N/A',
                goalsFor: awayStats.data?.goals?.for?.total?.total || 0,
                goalsAgainst: awayStats.data?.goals?.against?.total?.total || 0,
                awayRecord: `${awayStats.data?.fixtures?.wins?.away || 0}W-${awayStats.data?.fixtures?.draws?.away || 0}D-${awayStats.data?.fixtures?.loses?.away || 0}L`
            }
        };
        
        const response = await fetch('/api/prediction/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(matchData)
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to generate prediction');
        }
        
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

// Display AI prediction
function displayAIPrediction(prediction) {
    const container = document.getElementById('aiPrediction');
    
    // Convert to moneyline if decimal format is received
    const homeWinMoneyline = isMoneylineFormat(prediction.homeWin)
        ? prediction.homeWin 
        : decimalToMoneyline(prediction.homeWin);
    const drawMoneyline = isMoneylineFormat(prediction.draw)
        ? prediction.draw 
        : decimalToMoneyline(prediction.draw);
    const awayWinMoneyline = isMoneylineFormat(prediction.awayWin)
        ? prediction.awayWin 
        : decimalToMoneyline(prediction.awayWin);
    
    container.innerHTML = `
        <div class="odds-display">
            <div class="odds-item">
                <span class="odds-label">Home Win:</span>
                <span class="odds-value">${homeWinMoneyline}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <span class="odds-value">${drawMoneyline}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Win:</span>
                <span class="odds-value">${awayWinMoneyline}</span>
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
        <div class="reasoning">
            <strong>AI Reasoning:</strong><br>
            ${prediction.reasoning}
        </div>
        <p style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
            Generated by ${prediction.model} at ${new Date(prediction.timestamp).toLocaleTimeString()}
        </p>
    `;
}

// Load actual odds
async function loadActualOdds() {
    if (!selectedFixture) {
        showError('Please select a fixture first');
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`/api/football/odds/${selectedFixture.fixture.id}`);
        const data = await response.json();
        
        if (!data.success || !data.data || data.data.length === 0) {
            // If no odds available from API, show manual input option
            showError('No odds available from API. Please enter manually.');
            displayManualOddsInput();
            return;
        }
        
        // Try to extract 1X2 odds (Match Winner) from multiple bookmakers
        let matchWinnerOdds = null;
        let bookmakerName = '';
        
        for (const oddsData of data.data) {
            if (oddsData.bookmakers && oddsData.bookmakers.length > 0) {
                for (const bookmaker of oddsData.bookmakers) {
                    const bet = bookmaker.bets?.find(bet => bet.name === 'Match Winner');
                    if (bet && bet.values && bet.values.length === 3) {
                        matchWinnerOdds = bet;
                        bookmakerName = bookmaker.name;
                        break;
                    }
                }
                if (matchWinnerOdds) break;
            }
        }
        
        if (!matchWinnerOdds) {
            showError('No Match Winner odds found from any bookmaker. Please enter manually.');
            displayManualOddsInput();
            return;
        }
        
        // Extract decimal odds
        const homeWinDecimal = parseFloat(matchWinnerOdds.values.find(v => v.value === 'Home')?.odd || 0);
        const drawDecimal = parseFloat(matchWinnerOdds.values.find(v => v.value === 'Draw')?.odd || 0);
        const awayWinDecimal = parseFloat(matchWinnerOdds.values.find(v => v.value === 'Away')?.odd || 0);
        
        if (!homeWinDecimal || !drawDecimal || !awayWinDecimal) {
            showError('Invalid odds data received. Please enter manually.');
            displayManualOddsInput();
            return;
        }
        
        // Convert to moneyline and store
        actualOddsData = {
            homeWin: decimalToMoneyline(homeWinDecimal),
            draw: decimalToMoneyline(drawDecimal),
            awayWin: decimalToMoneyline(awayWinDecimal),
            bookmaker: bookmakerName
        };
        
        displayActualOdds(actualOddsData);
        
        // Check if we can compare
        if (aiPredictionData) {
            compareOdds();
        }
    } catch (error) {
        console.error('Error loading odds:', error);
        showError('Error loading odds from API. Please enter manually.');
        displayManualOddsInput();
    } finally {
        hideLoading();
    }
}

// Display manual odds input
function displayManualOddsInput() {
    const container = document.getElementById('actualOdds');
    
    container.innerHTML = `
        <p style="margin-bottom: 15px; text-align: center;">Enter betting odds manually (Moneyline format):</p>
        <div class="odds-display">
            <div class="odds-item">
                <span class="odds-label">Home Win:</span>
                <input type="text" id="manualHomeWin" placeholder="+150 or -200" style="width: 100px; padding: 5px; font-size: 1.2em;">
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <input type="text" id="manualDraw" placeholder="+220" style="width: 100px; padding: 5px; font-size: 1.2em;">
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Win:</span>
                <input type="text" id="manualAwayWin" placeholder="+180" style="width: 100px; padding: 5px; font-size: 1.2em;">
            </div>
        </div>
        <button id="submitManualOdds" class="btn btn-secondary" style="width: 100%; margin-top: 15px;">Submit Odds</button>
    `;
    
    document.getElementById('submitManualOdds').addEventListener('click', () => {
        const homeWin = document.getElementById('manualHomeWin').value.trim();
        const draw = document.getElementById('manualDraw').value.trim();
        const awayWin = document.getElementById('manualAwayWin').value.trim();
        
        // Validate moneyline format
        const moneylineRegex = /^[+-]\d+$/;
        if (!moneylineRegex.test(homeWin) || !moneylineRegex.test(draw) || !moneylineRegex.test(awayWin)) {
            showError('Please enter valid moneyline odds (e.g., +150 or -200)');
            return;
        }
        
        // Validate that odds are not zero
        if (parseInt(homeWin) === 0 || parseInt(draw) === 0 || parseInt(awayWin) === 0) {
            showError('Moneyline odds cannot be zero');
            return;
        }
        
        actualOddsData = { 
            homeWin, 
            draw, 
            awayWin,
            bookmaker: 'Manual Entry'
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
                <span class="odds-label">Home Win:</span>
                <span class="odds-value">${odds.homeWin}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Draw:</span>
                <span class="odds-value">${odds.draw}</span>
            </div>
            <div class="odds-item">
                <span class="odds-label">Away Win:</span>
                <span class="odds-value">${odds.awayWin}</span>
            </div>
        </div>
        <p style="text-align: center; margin-top: 15px; color: #666; font-size: 0.9em;">
            ${odds.bookmaker ? `Bookmaker: ${odds.bookmaker}` : 'Bookmaker odds'}
        </p>
    `;
}

// Compare odds
async function compareOdds() {
    if (!aiPredictionData || !actualOddsData) {
        return;
    }
    
    showLoading();
    try {
        // Convert moneyline to decimal for comparison
        const llmDecimal = {
            homeWin: typeof aiPredictionData.homeWin === 'string' 
                ? moneylineToDecimal(aiPredictionData.homeWin)
                : aiPredictionData.homeWin,
            draw: typeof aiPredictionData.draw === 'string'
                ? moneylineToDecimal(aiPredictionData.draw)
                : aiPredictionData.draw,
            awayWin: typeof aiPredictionData.awayWin === 'string'
                ? moneylineToDecimal(aiPredictionData.awayWin)
                : aiPredictionData.awayWin
        };
        
        const actualDecimal = {
            homeWin: typeof actualOddsData.homeWin === 'string'
                ? moneylineToDecimal(actualOddsData.homeWin)
                : actualOddsData.homeWin,
            draw: typeof actualOddsData.draw === 'string'
                ? moneylineToDecimal(actualOddsData.draw)
                : actualOddsData.draw,
            awayWin: typeof actualOddsData.awayWin === 'string'
                ? moneylineToDecimal(actualOddsData.awayWin)
                : actualOddsData.awayWin
        };
        
        const response = await fetch('/api/prediction/compare', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                llmPrediction: llmDecimal,
                actualOdds: actualDecimal
            })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Failed to compare odds');
        }
        
        // Add moneyline values to comparison data
        data.comparison.homeWin.llmMoneyline = typeof aiPredictionData.homeWin === 'string' 
            ? aiPredictionData.homeWin 
            : decimalToMoneyline(aiPredictionData.homeWin);
        data.comparison.homeWin.actualMoneyline = typeof actualOddsData.homeWin === 'string'
            ? actualOddsData.homeWin
            : decimalToMoneyline(actualOddsData.homeWin);
            
        data.comparison.draw.llmMoneyline = typeof aiPredictionData.draw === 'string'
            ? aiPredictionData.draw
            : decimalToMoneyline(aiPredictionData.draw);
        data.comparison.draw.actualMoneyline = typeof actualOddsData.draw === 'string'
            ? actualOddsData.draw
            : decimalToMoneyline(actualOddsData.draw);
            
        data.comparison.awayWin.llmMoneyline = typeof aiPredictionData.awayWin === 'string'
            ? aiPredictionData.awayWin
            : decimalToMoneyline(aiPredictionData.awayWin);
        data.comparison.awayWin.actualMoneyline = typeof actualOddsData.awayWin === 'string'
            ? actualOddsData.awayWin
            : decimalToMoneyline(actualOddsData.awayWin);
        
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
                        <div class="value-number">${data.comparison.homeWin.llmMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.homeWin.actualMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.homeWin.percentageDiff.toFixed(2)}%</div>
                    </div>
                </div>
            </div>
            
            <div class="comparison-item">
                <div class="comparison-header">Draw</div>
                <div class="comparison-values">
                    <div class="value-box">
                        <span class="value-label">AI Prediction</span>
                        <div class="value-number">${data.comparison.draw.llmMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.draw.actualMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.draw.percentageDiff.toFixed(2)}%</div>
                    </div>
                </div>
            </div>
            
            <div class="comparison-item">
                <div class="comparison-header">Away Win</div>
                <div class="comparison-values">
                    <div class="value-box">
                        <span class="value-label">AI Prediction</span>
                        <div class="value-number">${data.comparison.awayWin.llmMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Actual Odds</span>
                        <div class="value-number">${data.comparison.awayWin.actualMoneyline}</div>
                    </div>
                    <div class="value-box">
                        <span class="value-label">Difference</span>
                        <div class="value-number">${data.comparison.awayWin.percentageDiff.toFixed(2)}%</div>
                    </div>
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
    
    document.getElementById('loadFixturesBtn').addEventListener('click', loadFixtures);
});
