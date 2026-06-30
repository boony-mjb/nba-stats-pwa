const AFL_ID = '4456';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let aflEvents = [];
let selectedDate = '';

// Maps team name -> { idTeam, strTeamBadge }, built once team badges load
let teamLookup = {};
let favouriteIds = new Set();

async function refreshFavourites() {
  const favs = await window.FavouritesDB.getAll();
  favouriteIds = new Set(favs.filter(f => f.league === 'AFL').map(f => f.teamId));
}

async function loadTeamBadges() {
  try {
    const res = await fetch(`${BASE}/search_all_teams.php?l=Australian_AFL`);
    const data = await res.json();
    (data.teams || []).forEach(t => { teamLookup[t.strTeam] = t; });
    await refreshFavourites();
    renderGamesForDate(selectedDate);
  } catch (e) {
    // Badges are a nice-to-have; if this fails, game rows just render without logos/stars
  }
}

async function toggleFavourite(teamId, teamName, teamBadge) {
  await window.FavouritesDB.toggle('AFL', teamId, teamName, teamBadge);
  await refreshFavourites();
  renderGamesForDate(selectedDate);
}

// Store events by ID so we can look them up on click
const eventStore = {};

function buildDayStrip() {
  const strip = document.getElementById('afl-day-strip');
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
  document.getElementById('date-picker').value = '';
  selectedDate = date;

  const d = new Date(date);
  const isToday = date === new Date().toISOString().split('T')[0];
  document.getElementById('afl-day-label').textContent = isToday
    ? 'Today'
    : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

  renderGamesForDate(date);
}

function selectDateFromPicker(date) {
  if (!date) return;

  // Deselect any active day-strip button, since the picker takes over
  document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
  selectedDate = date;

  const d = new Date(`${date}T00:00:00`);
  const isToday = date === new Date().toISOString().split('T')[0];
  document.getElementById('afl-day-label').textContent = isToday
    ? 'Today'
    : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

  renderGamesForDate(date);
}

function renderGamesForDate(date) {
  const list = document.getElementById('afl-list');
  const countEl = document.getElementById('afl-game-count');

  const games = aflEvents.filter(e => e.dateEvent === date);

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
        ${teamBlock(e.strHomeTeam, 'Home')}
        <div class="score-block">
          ${scoreDisplay}
        </div>
        ${teamBlock(e.strAwayTeam, 'Away', true)}
      </div>
    `;
  }).join('');
}

function teamBlock(teamName, subLabel, away) {
  const team = teamLookup[teamName];
  const badge = team && (team.strBadge || team.strTeamBadge)
    ? `<img class="team-logo" src="${team.strBadge || team.strTeamBadge}/small" alt="" onerror="this.style.display='none'" />`
    : '';
  const isFav = team && favouriteIds.has(team.idTeam);
  const star = team
    ? `<button class="fav-star ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        onclick="event.stopPropagation(); toggleFavourite('${team.idTeam}', '${teamName.replace(/'/g, "\\'")}', '${team.strBadge || team.strTeamBadge || ''}')">★</button>`
    : '';

  return `
    <div class="team-block ${away ? 'away' : ''}">
      ${badge}
      <div class="team-name">${teamName}</div>
      <div class="team-sub">${subLabel}</div>
      ${star}
    </div>
  `;
}

async function loadAllGames() {
  try {
    const [pastRes, nextRes] = await Promise.all([
      fetch(`${BASE}/eventspastleague.php?id=${AFL_ID}`),
      fetch(`${BASE}/eventsnextleague.php?id=${AFL_ID}`)
    ]);

    const pastData = await pastRes.json();
    const nextData = await nextRes.json();

    const past = pastData.events || [];
    const next = nextData.events || [];

    aflEvents = [...past, ...next];

    // Store all events in lookup object
    aflEvents.forEach(e => { eventStore[e.idEvent] = e; });

    renderGamesForDate(selectedDate);
  } catch (e) {
    document.getElementById('afl-list').innerHTML =
      '<div class="error">Could not load games. Check your API key.</div>';
  }
}

function openBoxScore(eventId) {
  const event = eventStore[eventId];
  if (!event) return;

  document.getElementById('box-score-modal').style.display = 'block';

  const isUpcoming = event.intHomeScore === null || event.intHomeScore === '';

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
      ${event.strLeague ?? 'AFL'} · ${event.strSeason ?? ''}
    </p>
    ${isUpcoming ? '<div id="prediction-mount"></div>' : ''}
  `;

  // Only show the AI prediction widget for upcoming (unplayed) games
  if (isUpcoming && window.renderPredictionWidget) {
    renderPredictionWidget(
      document.getElementById('prediction-mount'),
      event.strHomeTeam,
      event.strAwayTeam,
      'AFL'
    );
  }
}

function closeBoxScore() {
  document.getElementById('box-score-modal').style.display = 'none';
}

window.openBoxScore = openBoxScore;
window.closeBoxScore = closeBoxScore;
window.selectDay = selectDay;
window.selectDateFromPicker = selectDateFromPicker;
window.toggleFavourite = toggleFavourite;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshFavourites();
  buildDayStrip();
  loadAllGames();
  loadTeamBadges();
  setInterval(loadAllGames, 60000);
});