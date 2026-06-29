const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const NRL_ID = '4416';

// NRL is mid-season, so unlike the NBA Playoffs page (final, hardcoded standings),
// this pulls the live ladder from the API rather than hardcoding numbers that go stale.
async function loadStandings() {
  const list = document.getElementById('nrl-standings-list');
  const seasonLabel = document.getElementById('nrl-season-label');

  try {
    // Note: TheSportsDB's optional &s=season param on lookuptable.php only works
    // for featured soccer leagues. For NRL we have to omit it and take whatever
    // "current" table the API hands back.
    const res = await fetch(`${BASE}/lookuptable.php?l=${NRL_ID}`);
    const data = await res.json();
    const table = data.table || [];

    if (!table.length) {
      list.innerHTML = `
        <div class="no-games">
          TheSportsDB's free API doesn't provide a live NRL ladder<br/>
          (league tables are limited to soccer on the free tier).<br/>
          Check the official ladder at
          <a href="https://www.nrl.com/ladder/" target="_blank" rel="noopener">nrl.com/ladder</a>.
        </div>`;
      return;
    }

    seasonLabel.textContent = table[0].strSeason || '';

    list.innerHTML = '<div class="standings-table">' + table.map(t => {
      const rank = parseInt(t.intRank, 10);
      const style = rank <= 8 ? 'seed-in' : 'seed-out';
      return `
        ${rank === 9 ? '<div class="divider-line out"><span>Outside Top 8</span></div>' : ''}
        <div class="standing-row ${rank <= 8 ? 'playoff' : 'out'}">
          <div class="seed-badge ${style}">${t.intRank}</div>
          <div class="standing-team">
            <div class="team-name">${t.strTeam}</div>
          </div>
          <div class="standing-stats">
            <span class="stat-w">${t.intWin}</span>
            <span class="stat-sep">–</span>
            <span class="stat-l">${t.intLoss}</span>
            <span class="stat-pct">${t.intPoints} pts</span>
          </div>
        </div>
      `;
    }).join('') + '</div>';
  } catch (e) {
    list.innerHTML = `
      <div class="error">
        Could not load the ladder. Check the official ladder at
        <a href="https://www.nrl.com/ladder/" target="_blank" rel="noopener">nrl.com/ladder</a>.
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', loadStandings);