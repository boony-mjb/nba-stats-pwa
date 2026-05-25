const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// 2025-26 NBA Standings (final regular season)
const EAST = [
  { seed: 1, name: 'Detroit Pistons',       w: 60, l: 22 },
  { seed: 2, name: 'Boston Celtics',         w: 56, l: 26 },
  { seed: 3, name: 'New York Knicks',        w: 53, l: 29 },
  { seed: 4, name: 'Cleveland Cavaliers',    w: 52, l: 30 },
  { seed: 5, name: 'Toronto Raptors',        w: 46, l: 36 },
  { seed: 6, name: 'Atlanta Hawks',          w: 46, l: 36 },
  { seed: 7, name: 'Orlando Magic',          w: 45, l: 37 },
  { seed: 8, name: 'Philadelphia 76ers',     w: 45, l: 37 },
  { seed: 9, name: 'Charlotte Hornets',      w: 44, l: 38 },
  { seed: 10, name: 'Miami Heat',            w: 43, l: 39 },
];

const WEST = [
  { seed: 1, name: 'Oklahoma City Thunder',  w: 64, l: 18 },
  { seed: 2, name: 'San Antonio Spurs',      w: 62, l: 20 },
  { seed: 3, name: 'Denver Nuggets',         w: 54, l: 28 },
  { seed: 4, name: 'Los Angeles Lakers',     w: 53, l: 29 },
  { seed: 5, name: 'Houston Rockets',        w: 52, l: 30 },
  { seed: 6, name: 'Minnesota Timberwolves', w: 49, l: 33 },
  { seed: 7, name: 'Phoenix Suns',           w: 45, l: 37 },
  { seed: 8, name: 'LA Clippers',            w: 42, l: 40 },
  { seed: 9, name: 'Portland Trail Blazers', w: 42, l: 40 },
  { seed: 10, name: 'Golden State Warriors', w: 37, l: 45 },
];

function getSeedStyle(seed) {
  if (seed <= 6) return 'seed-in';
  if (seed <= 10) return 'seed-playin';
  return 'seed-out';
}

function buildHTML(teams) {
  return teams.map((t, i) => {
    const pct = (t.w / (t.w + t.l)).toFixed(3);
    const isPlayInDivider = i === 6;
    const isOutDivider = i === 10;

    return `
      ${isPlayInDivider ? '<div class="divider-line"><span>Play-In</span></div>' : ''}
      ${isOutDivider ? '<div class="divider-line out"><span>Eliminated</span></div>' : ''}
      <div class="standing-row ${t.seed <= 6 ? 'playoff' : t.seed <= 10 ? 'playin' : 'out'}">
        <div class="seed-badge ${getSeedStyle(t.seed)}">${t.seed}</div>
        <div class="standing-team">
          <div class="team-name">${t.name}</div>
        </div>
        <div class="standing-stats">
          <span class="stat-w">${t.w}</span>
          <span class="stat-sep">–</span>
          <span class="stat-l">${t.l}</span>
          <span class="stat-pct">${pct}</span>
        </div>
      </div>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('east-list').innerHTML = buildHTML(EAST);
  document.getElementById('west-list').innerHTML = buildHTML(WEST);
  document.getElementById('season-label').textContent = '2024–25 Final Standings';
});