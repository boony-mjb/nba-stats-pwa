const NBA_ID = '4387';
const NRL_ID = '4416';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let allEvents = [];
let selectedDate = '';

// Store events by ID so we can look them up on click
const eventStore = {};

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
    // Store event in lookup object using its ID
    eventStore[e.idEvent] = e;

    const hasScore = e.intHomeScore !== null && e.intHomeScore !== '';
    const scoreDisplay = hasScore
      ? `<div class="score">${e.intHomeScore}&nbsp;&ndash;&nbsp;${e.intAwayScore}</div>
         <div class="status-pill final">Final</div>`
      : `<div class="score time-score">${e.strTime ? e.strTime.slice(0,5) : 'TBD'}</div>
         <div class="status-pill upcoming">Upcoming</div>`;

    return `
      <div class="game-row" style="cursor:pointer" onclick="openBoxScore('${e.idEvent}')">
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

    // Store all events in lookup object
    allEvents.forEach(e => { eventStore[e.idEvent] = e; });

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

async function loadNRL() {
  try {
    const res = await fetch(`${BASE}/eventspastleague.php?id=${NRL_ID}`);
    const data = await res.json();
    const events = (data.events || []).slice(0, 20);

    // Store NRL events in lookup object too
    events.forEach(e => { eventStore[e.idEvent] = e; });

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

function openBoxScore(eventId) {
  const event = eventStore[eventId];
  if (!event) return;

  document.getElementById('box-score-modal').style.display = 'block';

  document.getElementById('box-score-content').innerHTML = `
    <h2 style="font-family:'Bebas Neue',sans-serif; font-size:20px; margin-bottom:12px;">
      ${event.strHomeTeam} vs ${event.strAwayTeam}
    </h2>
    <p style="font-size:12px; color:var(--muted); margin-bottom:16px;">
      ${event.dateEvent} · ${event.strVenue || 'Venue TBA'}
    </p>
    <div style="display:flex; justify-content:space-around; margin-bottom:16px;">
      <div style="text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:48px; line-height:1;">
          ${event.intHomeScore ?? '—'}
        </div>
        <div style="font-size:11px; color:var(--muted);">${event.strHomeTeam}</div>
      </div>
      <div style="font-family:'Bebas Neue',sans-serif; font-size:32px; padding-top:8px; color:var(--muted);">
        –
      </div>
      <div style="text-align:center;">
        <div style="font-family:'Bebas Neue',sans-serif; font-size:48px; line-height:1;">
          ${event.intAwayScore ?? '—'}
        </div>
        <div style="font-size:11px; color:var(--muted);">${event.strAwayTeam}</div>
      </div>
    </div>
    <p style="font-size:11px; color:var(--muted); text-align:center;">
      ${event.strLeague ?? 'NBA'} · ${event.strSeason ?? '2024-25'}
    </p>
  `;
}

function closeBoxScore() {
  document.getElementById('box-score-modal').style.display = 'none';
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['scores','teams','nrl'][i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === name);
  });
}

window.showTab = showTab;
window.openBoxScore = openBoxScore;
window.closeBoxScore = closeBoxScore;
window.selectDay = selectDay;

document.addEventListener('DOMContentLoaded', () => {
  buildDayStrip();
  loadAllGames();
  loadTeams();
  loadNRL();
  setInterval(loadAllGames, 60000);
});