const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// 2025 NBA Playoff seedings - current as of May 2025
const EAST = [
  { seed: 1, name: 'Cleveland Cavaliers', w: 64, l: 18 },
  { seed: 2, name: 'Boston Celtics', w: 61, l: 21 },
  { seed: 3, name: 'New York Knicks', w: 51, l: 31 },
  { seed: 4, name: 'Milwaukee Bucks', w: 48, l: 34 },
  { seed: 5, name: 'Indiana Pacers', w: 50, l: 32 },
  { seed: 6, name: 'Miami Heat', w: 48, l: 34 },
  { seed: 7, name: 'Atlanta Hawks', w: 44, l: 38 },
  { seed: 8, name: 'Orlando Magic', w: 41, l: 41 },
  { seed: 9, name: 'Chicago Bulls', w: 39, l: 43 },
  { seed: 10, name: 'Philadelphia 76ers', w: 24, l: 58 },
];

const WEST = [
  { seed: 1, name: 'Oklahoma City Thunder', w: 68, l: 14 },
  { seed: 2, name: 'Houston Rockets', w: 52, l: 30 },
  { seed: 3, name: 'Los Angeles Lakers', w: 50, l: 32 },
  { seed: 4, name: 'Denver Nuggets', w: 49, l: 33 },
  { seed: 5, name: 'Memphis Grizzlies', w: 49, l: 33 },
  { seed: 6, name: 'Golden State Warriors', w: 48, l: 34 },
  { seed: 7, name: 'Los Angeles Clippers', w: 42, l: 40 },
  { seed: 8, name: 'Minnesota Timberwolves', w: 41, l: 41 },
  { seed: 9, name: 'Sacramento Kings', w: 40, l: 42 },
  { seed: 10, name: 'Phoenix Suns', w: 36, l: 46 },
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