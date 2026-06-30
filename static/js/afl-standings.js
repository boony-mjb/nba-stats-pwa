// MANUAL AFL LADDER — update this weekly from https://www.afl.com.au/ladder
//
// Same reasoning as the NRL ladder: TheSportsDB's lookuptable.php endpoint
// is documented as soccer-leagues-only, so it doesn't return AFL standings
// either. Rather than show a broken "live" feed, this ladder is edited by
// hand — same pattern as playoffs.js (NBA) and nrl-standings.js (NRL).
//
// HOW TO UPDATE: each row is { rank, name, w (wins), l (losses), pts }.
// AFL competition points = 4 per win, 2 per draw, 0 per loss.
// Just re-type the numbers after each round and re-order the array —
// no other code needs to change.

const LADDER = [
  { rank: 1,  name: 'Adelaide',                    w: 0, l: 0, pts: 0 },
  { rank: 2,  name: 'Brisbane Lions',               w: 0, l: 0, pts: 0 },
  { rank: 3,  name: 'Carlton',                      w: 0, l: 0, pts: 0 },
  { rank: 4,  name: 'Collingwood',                  w: 0, l: 0, pts: 0 },
  { rank: 5,  name: 'Essendon',                     w: 0, l: 0, pts: 0 },
  { rank: 6,  name: 'Fremantle',                    w: 0, l: 0, pts: 0 },
  { rank: 7,  name: 'Geelong',                      w: 0, l: 0, pts: 0 },
  { rank: 8,  name: 'Gold Coast',                   w: 0, l: 0, pts: 0 },
  { rank: 9,  name: 'Greater Western Sydney Giants',w: 0, l: 0, pts: 0 },
  { rank: 10, name: 'Hawthorn',                     w: 0, l: 0, pts: 0 },
  { rank: 11, name: 'Melbourne',                    w: 0, l: 0, pts: 0 },
  { rank: 12, name: 'North Melbourne',              w: 0, l: 0, pts: 0 },
  { rank: 13, name: 'Port Adelaide',                w: 0, l: 0, pts: 0 },
  { rank: 14, name: 'Richmond',                     w: 0, l: 0, pts: 0 },
  { rank: 15, name: 'St Kilda',                     w: 0, l: 0, pts: 0 },
  { rank: 16, name: 'Sydney Swans',                 w: 0, l: 0, pts: 0 },
  { rank: 17, name: 'West Coast Eagles',            w: 0, l: 0, pts: 0 },
  { rank: 18, name: 'Western Bulldogs',             w: 0, l: 0, pts: 0 },
];

const LADDER_UPDATED = 'Not yet filled in — edit LADDER + LADDER_UPDATED at the top of afl-standings.js';

function renderLadder() {
  const list = document.getElementById('afl-standings-list');
  const seasonLabel = document.getElementById('afl-season-label');

  seasonLabel.textContent = `Updated: ${LADDER_UPDATED}`;

  const sorted = [...LADDER].sort((a, b) => a.rank - b.rank);

  // AFL finals series takes the top 8, same cutoff convention as the NRL ladder page
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