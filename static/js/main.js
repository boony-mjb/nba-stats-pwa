const NBA_ID = '4387';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let allEvents = [];
let selectedDate = '';

// Build the last 7 days + next 7 days strip
function buildDayStrip() {
  const strip = document.getElementById('day-strip');
  const today = new Date();
  const days = [];

  for (let i = -7; i <= 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d);
  }

  strip.innerHTML = days.map(d => {
    const iso = d.toISOString().split('T')[0];
    const isToday = iso === today.toISOString().split('T')[0];
    return `
      <button class="day-btn ${isToday ? 'active' : ''}" data-date="${iso}" onclick="selectDay('${iso}', this)">
        <span class="day-name">${isToday ? 'Today' : DAYS[d.getDay()]}</span>
        <span class="day-num">${d.getDate()}</span>
      </button>
    `;
  }).join('');

  selectedDate = today.toISOString().split('T')[0];
}

function selectDay(date, btn) {
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedDate = date;

  const d = new Date(date);
  const isToday = date === new Date().toISOString().split('T')[0];
  document.getElementById('day-label').textContent = isToday
    ? 'Today'
    : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  renderGamesForDate(date);
}

function renderGamesForDate(date) {
  const list = document.getElementById('scores-list');
  const countEl = document.getElementById('game-count');

  const games = allEvents.filter(e => e.dateEvent === date);

  if (!games.length) {
    countEl.textContent = '';
    list.innerHTML = '<div class="no-games">No games scheduled</div>';
    return;
  }

  countEl.textContent = `${games.length} game${games.length !== 1 ? 's' : ''}`;

  list.innerHTML = games.map(e => {
    const hasScore = e.intHomeScore !== null && e.intHomeScore !== '';
    const scoreDisplay = hasScore
      ? `<div class="score">${e.intHomeScore}&nbsp;&ndash;&nbsp;${e.intAwayScore}</div>
         <div class="status-pill final">Final</div>`
      : `<div class="score time-score">${e.strTime ? e.strTime.slice(0,5) : 'TBD'}</div>
         <div class="status-pill upcoming">Upcoming</div>`;

    return `
      <div class="game-row">
        <div class="team-block">
          <div class="team-name">${e.strHomeTeam}</div>
          <div class="team-sub">Home</div>
        </div>
        <div class="score-block">
          ${scoreDisplay}
        </div>
        <div class="team-block away">
          <div class="team-name">${e.strAwayTeam}</div>
          <div class="team-sub">Away</div>
        </div>
      </div>
    `;
  }).join('');
}

async function loadAllGames() {
  try {
    const [pastRes, nextRes] = await Promise.all([
      fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`),
      fetch(`${BASE}/eventsnextleague.php?id=${NBA_ID}`)
    ]);

    const pastData = await pastRes.json();
    const nextData = await nextRes.json();

    const past = pastData.events || [];
    const next = nextData.events || [];

    allEvents = [...past, ...next];
    renderGamesForDate(selectedDate);
  } catch (e) {
    document.getElementById('scores-list').innerHTML =
      '<div class="error">Could not load games. Check your API key.</div>';
  }
}

async function loadTeams() {
  try {
    const res = await fetch(`${BASE}/search_all_teams.php?l=NBA`);
    const data = await res.json();
    const teams = (data.teams || []).sort((a, b) =>
      a.strTeam.localeCompare(b.strTeam)
    );

    document.getElementById('teams-list').innerHTML =
      '<div class="teams-grid">' +
      teams.map(t => `
        <div class="team-row">
          <div class="team-name">${t.strTeam}</div>
          <div class="team-city">${t.strStadium || ''}</div>
        </div>
      `).join('') +
      '</div>';
  } catch (e) {
    document.getElementById('teams-list').innerHTML =
      '<div class="error">Could not load teams.</div>';
  }
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['scores','teams','nrl'][i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === name);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadScores();
  loadUpcoming();
  loadTeams();
  loadNRL();
  setInterval(loadScores, 60000);
});

const NRL_ID = '4957'; // replace with the actual ID you found

async function loadNRL() {
  try {
    const res = await fetch(`${BASE}/eventspastleague.php?id=${NRL_ID}`);
    const data = await res.json();
    const events = (data.events || []).slice(0, 20);

    document.getElementById('nrl-list').innerHTML = events.map(e => `
      <div class="game-row" style="cursor:pointer" onclick="openBoxScore('${e.idEvent}')">
        <div class="team-block">
          <div class="team-name">${e.strHomeTeam}</div>
          <div class="team-sub">Home</div>
        </div>
        <div class="score-block">
          <div class="score">${e.intHomeScore} – ${e.intAwayScore}</div>
          <div class="status-pill final">Final</div>
        </div>
        <div class="team-block away">
          <div class="team-name">${e.strAwayTeam}</div>
          <div class="team-sub">Away</div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    document.getElementById('nrl-list').innerHTML =
      '<div class="error">Could not load NRL games.</div>';
  }
}