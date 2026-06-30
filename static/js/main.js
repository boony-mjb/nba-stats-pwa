const NBA_ID = '4387';
const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let allEvents = [];
let selectedDate = '';

// Maps team name -> { idTeam, strTeamBadge }, built once teams load.
// Lets us show logos/star buttons on game rows, which only have team names.
let teamLookup = {};
let favouriteIds = new Set();

// ── In-memory API cache ───────────────────────────────────────────────────────
// Stores {data, ts} so stale entries expire after CACHE_TTL ms.
// Teams change rarely (24h), scores may change every minute (1m).
const CACHE = {};
const CACHE_TTL = {
  teams:  24 * 60 * 60 * 1000,  // 24 hours
  events:       60 * 1000,       // 1 minute
};

async function cachedFetch(url, ttlMs) {
  const cached = CACHE[url];
  if (cached && Date.now() - cached.ts < ttlMs) {
    return cached.data;
  }
  const res  = await fetch(url);
  const data = await res.json();
  CACHE[url] = { data, ts: Date.now() };
  return data;
}

// ── Lazy image loading ────────────────────────────────────────────────────────
// Instead of loading every badge URL up front, we set data-src and swap to src
// only when the image scrolls into the viewport.
const lazyObserver = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          lazyObserver.unobserve(img);
        }
      });
    }, { rootMargin: '100px' })
  : null;

function lazyImg(src, alt, className) {
  if (!src) return '';
  // If IntersectionObserver isn't available (old browsers), fall back to eager loading
  if (!lazyObserver) {
    return `<img class="${className}" src="${src}" alt="${alt}" onerror="this.style.display='none'" />`;
  }
  return `<img class="${className}" data-src="${src}" alt="${alt}" onerror="this.style.display='none'" />`;
}

// Called after rendering any HTML that contains lazy images so the observer
// picks up the newly-added <img data-src="..."> elements.
function observeLazyImages() {
  document.querySelectorAll('img[data-src]').forEach(img => lazyObserver && lazyObserver.observe(img));
}

async function refreshFavourites() {
  const favs = await window.FavouritesDB.getAll();
  favouriteIds = new Set(favs.filter(f => f.league === 'NBA').map(f => f.teamId));
}

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
  document.getElementById('date-picker').value = '';
  selectedDate = date;

  const d = new Date(date);
  const isToday = date === new Date().toISOString().split('T')[0];
  document.getElementById('day-label').textContent = isToday
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
  document.getElementById('day-label').textContent = isToday
    ? 'Today'
    : `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

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

  observeLazyImages();
}

// Builds a team-block with logo + favourite star, looked up by team name.
// `away` flips text alignment to match the existing away-team styling.
function teamBlock(teamName, subLabel, away) {
  const team  = teamLookup[teamName];
  const src   = team && (team.strBadge || team.strTeamBadge);
  const badge = src ? lazyImg(`${src}/small`, '', 'team-logo') : '';
  const isFav = team && favouriteIds.has(team.idTeam);
  const star  = team
    ? `<button class="fav-star ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
        onclick="event.stopPropagation(); toggleFavourite('${team.idTeam}', '${teamName.replace(/'/g, "\\'")}', '${src || ''}')">★</button>`
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
    const [pastData, nextData] = await Promise.all([
      cachedFetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`, CACHE_TTL.events),
      cachedFetch(`${BASE}/eventsnextleague.php?id=${NBA_ID}`, CACHE_TTL.events)
    ]);

    const past = pastData.events || [];
    const next = nextData.events || [];

    allEvents = [...past, ...next];
    allEvents.forEach(e => { eventStore[e.idEvent] = e; });

    renderGamesForDate(selectedDate);
  } catch (e) {
    document.getElementById('scores-list').innerHTML =
      '<div class="error">Could not load games. Check your API key.</div>';
  }
}

async function loadTeams() {
  try {
    const data  = await cachedFetch(`${BASE}/search_all_teams.php?l=NBA`, CACHE_TTL.teams);
    const teams = (data.teams || []).sort((a, b) => a.strTeam.localeCompare(b.strTeam));

    teams.forEach(t => { teamLookup[t.strTeam] = t; });
    await refreshFavourites();
    renderTeamsList(teams);
    renderGamesForDate(selectedDate);
  } catch (e) {
    document.getElementById('teams-list').innerHTML =
      '<div class="error">Could not load teams.</div>';
  }
}

function renderTeamsList(teams) {
  const sorted = [...teams].sort((a, b) => {
    const favA = favouriteIds.has(a.idTeam) ? 0 : 1;
    const favB = favouriteIds.has(b.idTeam) ? 0 : 1;
    if (favA !== favB) return favA - favB;
    return a.strTeam.localeCompare(b.strTeam);
  });

  document.getElementById('teams-list').innerHTML =
    '<div class="teams-grid">' +
    sorted.map(t => {
      const isFav = favouriteIds.has(t.idTeam);
      const src   = t.strBadge || t.strTeamBadge;
      const badge = src ? lazyImg(`${src}/small`, '', 'team-logo') : '';
      return `
        <div class="team-row">
          ${badge}
          <div class="team-info">
            <div class="team-name">${t.strTeam}</div>
            <div class="team-city">${t.strStadium || ''}</div>
          </div>
          <button class="fav-star ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="toggleFavourite('${t.idTeam}', '${t.strTeam.replace(/'/g, "\\'")}', '${src || ''}')">★</button>
        </div>
      `;
    }).join('') +
    '</div>';

  observeLazyImages();
}

async function toggleFavourite(teamId, teamName, teamBadge) {
  await window.FavouritesDB.toggle('NBA', teamId, teamName, teamBadge);
  await refreshFavourites();
  renderTeamsList(Object.values(teamLookup));
  renderGamesForDate(selectedDate);
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
      ${event.strLeague ?? 'NBA'} · ${event.strSeason ?? '2024-25'}
    </p>
    ${isUpcoming ? '<div id="prediction-mount"></div>' : ''}
  `;

  // Only show the AI prediction widget for upcoming (unplayed) games
  if (isUpcoming && window.renderPredictionWidget) {
    renderPredictionWidget(
      document.getElementById('prediction-mount'),
      event.strHomeTeam,
      event.strAwayTeam,
      'NBA'
    );
  }
}

function closeBoxScore() {
  document.getElementById('box-score-modal').style.display = 'none';
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach((t, i) => {
    t.classList.toggle('active', ['scores','teams'][i] === name);
  });
  document.querySelectorAll('.tab-panel').forEach(p => {
    p.classList.toggle('active', p.id === name);
  });
}

window.showTab = showTab;
window.openBoxScore = openBoxScore;
window.closeBoxScore = closeBoxScore;
window.selectDay = selectDay;
window.selectDateFromPicker = selectDateFromPicker;
window.toggleFavourite = toggleFavourite;

document.addEventListener('DOMContentLoaded', async () => {
  await refreshFavourites();
  buildDayStrip();
  loadAllGames();
  loadTeams();
  setInterval(loadAllGames, 60000);
});