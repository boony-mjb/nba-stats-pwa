const NBA_ID = '4387';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

async function loadScores() {
  try {
    const res = await fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`);
    const data = await res.json();
    const events = (data.events || []).slice(0, 20);

    document.getElementById('scores-list').innerHTML = events.map(e => `
      <div class="game-card final">
        <div class="team-block">
          <div class="team-name">${e.strHomeTeam}</div>
          <div class="team-sub">Home</div>
        </div>
        <div class="score-block">
          <div class="score">${e.intHomeScore} – ${e.intAwayScore}</div>
          <div class="game-status">Final</div>
        </div>
        <div class="team-block away">
          <div class="team-name">${e.strAwayTeam}</div>
          <div class="team-sub">Away</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('scores-list').innerHTML =
      '<p class="error">Could not load scores. Check your API key.</p>';
  }
}

async function loadUpcoming() {
  try {
    const res = await fetch(`${BASE}/eventsnextleague.php?id=${NBA_ID}`);
    const data = await res.json();
    const events = (data.events || []).slice(0, 10);

    const html = events.map(e => `
      <div class="game-card upcoming">
        <div class="team-block">
          <div class="team-name">${e.strHomeTeam}</div>
          <div class="team-sub">Home</div>
        </div>
        <div class="score-block">
          <div class="score upcoming">${e.dateEvent}</div>
          <div class="game-status upcoming">Upcoming</div>
        </div>
        <div class="team-block away">
          <div class="team-name">${e.strAwayTeam}</div>
          <div class="team-sub">Away</div>
        </div>
      </div>
    `).join('');

    document.getElementById('scores-list').innerHTML += html;
  } catch (e) {
    console.log('Could not load upcoming games.');
  }
}

async function loadTeams() {
  try {
    const res = await fetch(`${BASE}/search_all_teams.php?l=NBA`);
    const data = await res.json();

    document.getElementById('standings-list').innerHTML = (data.teams || []).map(t => `
      <div class="team-card">
        <div>
          <div class="team-name">${t.strTeam}</div>
          <div class="team-sub">${t.strStadium || 'NBA'}</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('standings-list').innerHTML =
      '<p class="error">Could not load teams. Check your API key.</p>';
  }
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.textContent.toLowerCase() === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === name);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadScores();
  loadUpcoming();
  loadTeams();
  setInterval(loadScores, 60000);
});
