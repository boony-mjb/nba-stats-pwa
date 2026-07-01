// MANUAL NRL LADDER — update this weekly from https://www.nrl.com/ladder/
//
// Unlike the NBA Playoffs page (final, settled standings), the NRL season is
// live and TheSportsDB's free API doesn't return ladder data for rugby league
// (lookuptable.php is documented as soccer-leagues-only). So instead of
// guessing or showing a broken "live" feed, this ladder is edited by hand —
// same approach as the hardcoded EAST/WEST arrays in playoffs.js.
//
// HOW TO UPDATE: each row is { rank, name, w (wins), l (losses), pts }.
// Competition points = 2 per win, 1 per draw. Just re-type the numbers after
// each round and re-order the array — no other code needs to change.

const LADDER = [
  { rank: 1,  name: 'Penrith Panthers',            w: 12, l: 2,  pts: 28 },
  { rank: 2,  name: 'New Zealand Warriors',        w: 10, l: 4,  pts: 24 },
  { rank: 3,  name: 'Dolphins',                    w: 9,  l: 5,  pts: 22 },
  { rank: 4,  name: 'Sydney Roosters',             w: 9,  l: 5,  pts: 22 },
  { rank: 5,  name: 'Newcastle Knights',           w: 9,  l: 5,  pts: 22 },
  { rank: 6,  name: 'Manly Sea Eagles',            w: 8,  l: 6,  pts: 20 },
  { rank: 7,  name: 'South Sydney Rabbitohs',      w: 7,  l: 6,  pts: 20 },
  { rank: 8,  name: 'Cronulla Sharks',             w: 8,  l: 6,  pts: 20 },
  { rank: 9,  name: 'North QLD Cowboys',           w: 8,  l: 7,  pts: 18 },
  { rank: 10, name: 'Wests Tigers',                w: 7,  l: 7,  pts: 18 },
  { rank: 11, name: 'Melbourne Storm',             w: 7,  l: 8,  pts: 16 },
  { rank: 12, name: 'Canterbury Bulldogs',         w: 6,  l: 8,  pts: 16 },
  { rank: 13, name: 'Brisbane Broncos',            w: 5,  l: 9,  pts: 14 },
  { rank: 14, name: 'Parramatta Eels',             w: 5,  l: 9,  pts: 14 },
  { rank: 15, name: 'Canberra Raiders',            w: 5,  l: 10, pts: 12 },
  { rank: 16, name: 'Gold Coast Titans',           w: 4,  l: 10, pts: 12 },
  { rank: 17, name: 'St George Illawarra Dragons', w: 1,  l: 13, pts: 6 },
];

const LADDER_UPDATED = '01-07-2026';

function renderLadder() {
  const list = document.getElementById('nrl-standings-list');
  const seasonLabel = document.getElementById('nrl-season-label');

  seasonLabel.textContent = `Updated: ${LADDER_UPDATED}`;

  const sorted = [...LADDER].sort((a, b) => a.rank - b.rank);

  list.innerHTML = '<div class="standings-table">' + sorted.map(t => {
    const style = t.rank <= 8 ? 'seed-in' : 'seed-out';
    return `
      ${t.rank === 9 ? '<div class="divider-line out"><span>Outside Top 8</span></div>' : ''}
      <div class="standing-row ${t.rank <= 8 ? 'playoff' : 'out'}">
        <div class="seed-badge ${style}">${t.rank}</div>
        <div class="standing-team">
          <div class="team-name">${t.name}</div>
        </div>
        <div class="standing-stats">
          <span class="stat-w">${t.w}</span>
          <span class="stat-sep">–</span>
          <span class="stat-l">${t.l}</span>
          <span class="stat-pct">${t.pts} pts</span>
        </div>
      </div>
    `;
  }).join('') + '</div>';
}

document.addEventListener('DOMContentLoaded', renderLadder);