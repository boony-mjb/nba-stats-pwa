const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

// TheSportsDB league table endpoint for NBA 2024-25 season
const NBA_ID = '4387';
const SEASON = '2024-2025';

// Eastern and Western conference team names for splitting
const EAST_TEAMS = [
  'Boston Celtics','New York Knicks','Cleveland Cavaliers','Orlando Magic',
  'Indiana Pacers','Milwaukee Bucks','Miami Heat','Philadelphia 76ers',
  'Chicago Bulls','Atlanta Hawks','Brooklyn Nets','Toronto Raptors',
  'Charlotte Hornets','Washington Wizards','Detroit Pistons'
];

function getSeedLabel(seed) {
  if (seed <= 6) return { label: `#${seed} Playoff`, cls: 'seed-in' };
  if (seed <= 10) return { label: `#${seed} Play-In`, cls: 'seed-playin' };
  return { label: `#${seed}`, cls: 'seed-out' };
}

function buildStandingsHTML(teams) {
  return teams.map((t, i) => {
    const seed = i + 1;
    const { label, cls } = getSeedLabel(seed);
    const gp = parseInt(t.played) || 0;
    const w = parseInt(t.win) || 0;
    const l = parseInt(t.loss) || 0;
    const pct = gp > 0 ? (w / gp).toFixed(3) : '.000';
    const isPlayoffLine = seed === 6;
    const isPlayInLine = seed === 10;

    return `
      ${seed === 7 ? '<div class="divider-line"><span>Play-In</span></div>' : ''}
      ${seed === 11 ? '<div class="divider-line out"><span>Eliminated</span></div>' : ''}
      <div class="standing-row ${seed <= 6 ? 'playoff' : seed <= 10 ? 'playin' : 'out'}">
        <div class="seed-badge ${cls}">${seed}</div>
        <div class="standing-team">
          <div class="team-name">${t.name}</div>
        </div>
        <div class="standing-stats">
          <span class="stat-w">${w}</span>
          <span class="stat-sep">–</span>
          <span class="stat-l">${l}</span>
          <span class="stat-pct">${pct}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadStandings() {
  try {
    const res = await fetch(`${BASE}/lookuptable.php?l=${NBA_ID}&s=${SEASON}`);
    const data = await res.json();

    if (!data.table || !data.table.length) {
      document.getElementById('east-list').innerHTML = '<div class="error">No standings data available yet for this season.</div>';
      document.getElementById('west-list').innerHTML = '';
      return;
    }

    const all = data.table;

    const east = all
      .filter(t => EAST_TEAMS.some(name => t.name && t.name.includes(name.split(' ').pop())))
      .sort((a, b) => parseInt(b.win) - parseInt(a.win));

    const west = all
      .filter(t => !EAST_TEAMS.some(name => t.name && t.name.includes(name.split(' ').pop())))
      .sort((a, b) => parseInt(b.win) - parseInt(a.win));

    document.getElementById('east-list').innerHTML = buildStandingsHTML(east);
    document.getElementById('west-list').innerHTML = buildStandingsHTML(west);

    document.getElementById('season-label').textContent = `${SEASON} Season`;

  } catch (e) {
    console.error(e);
    document.getElementById('east-list').innerHTML = '<div class="error">Could not load standings.</div>';
    document.getElementById('west-list').innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', loadStandings);