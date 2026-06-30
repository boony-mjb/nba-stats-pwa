// AI Prediction Widget
// Calls our Flask /api/predict route, which proxies to the Claude API server-side.
// The Anthropic secret key never touches the browser — it stays in .env on the server.

/**
 * Generates a prediction for a matchup and injects the widget into `container`.
 * @param {HTMLElement} container  - The element to render into
 * @param {string}      homeTeam   - Home team name
 * @param {string}      awayTeam   - Away team name
 * @param {string}      league     - 'NBA' or 'NRL' (for sport-specific framing)
 */
async function renderPredictionWidget(container, homeTeam, awayTeam, league = 'NBA') {
  container.innerHTML = `
    <div class="prediction-widget">
      <div class="prediction-header">
        <span class="prediction-ai-badge">AI</span>
        <span class="prediction-title">Match Prediction</span>
        <span class="prediction-disclaimer">Prototype · Not real data</span>
      </div>
      <div class="prediction-loading">
        Analysing matchup<span class="prediction-loading-dots"></span>
      </div>
    </div>
  `;

  try {
    const result = await fetchPrediction(homeTeam, awayTeam, league);
    renderResult(container, homeTeam, awayTeam, result);
  } catch (e) {
    container.innerHTML = `
      <div class="prediction-widget">
        <div class="prediction-header">
          <span class="prediction-ai-badge">AI</span>
          <span class="prediction-title">Match Prediction</span>
        </div>
        <div class="prediction-loading">Prediction unavailable right now.</div>
      </div>
    `;
  }
}

async function fetchPrediction(homeTeam, awayTeam, league) {
  // Call our own Flask endpoint rather than the Anthropic API directly —
  // this keeps the secret API key on the server where it can't be read
  // by anyone inspecting the browser's network tab.
  const response = await fetch('/api/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ homeTeam, awayTeam, league })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  const parsed = await response.json();

  if (
    typeof parsed.homePct !== 'number' ||
    typeof parsed.awayPct !== 'number' ||
    !Array.isArray(parsed.factors)
  ) {
    throw new Error('Unexpected response shape from AI');
  }

  return parsed;
}

function renderResult(container, homeTeam, awayTeam, result) {
  const { homePct, awayPct, factors } = result;
  const homeFav = homePct >= awayPct;

  container.innerHTML = `
    <div class="prediction-widget">
      <div class="prediction-header">
        <span class="prediction-ai-badge">AI</span>
        <span class="prediction-title">Match Prediction</span>
        <span class="prediction-disclaimer">Prototype · Not real data</span>
      </div>

      <div class="prediction-matchup">
        <div class="prediction-team">
          <div class="prediction-team-name">${homeTeam}</div>
          <div class="prediction-pct ${homeFav ? 'favourite' : 'underdog'}">${homePct}%</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">HOME</div>
        </div>
        <div class="prediction-vs">
          <div class="prediction-vs-text">VS</div>
        </div>
        <div class="prediction-team right">
          <div class="prediction-team-name">${awayTeam}</div>
          <div class="prediction-pct ${!homeFav ? 'favourite' : 'underdog'}">${awayPct}%</div>
          <div style="font-family:'DM Mono',monospace;font-size:9px;color:var(--muted);">AWAY</div>
        </div>
      </div>

      <div class="prediction-bar-wrap">
        <div class="prediction-bar">
          <div class="prediction-bar-fill" style="width:${homePct}%"></div>
        </div>
      </div>

      <div class="prediction-factors">
        ${factors.map(f => `
          <div class="prediction-factor">
            <div class="prediction-factor-dot"></div>
            <span>${f}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.renderPredictionWidget = renderPredictionWidget;