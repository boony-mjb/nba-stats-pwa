const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;

let teamsData = [];
let favouriteIds = new Set();

async function refreshFavourites() {
  const favs = await window.FavouritesDB.getAll();
  favouriteIds = new Set(favs.filter(f => f.league === 'NRL').map(f => f.teamId));
}

async function loadTeams() {
  try {
    const res = await fetch(`${BASE}/search_all_teams.php?l=NRL`);
    const data = await res.json();
    teamsData = (data.teams || []).sort((a, b) => a.strTeam.localeCompare(b.strTeam));

    await refreshFavourites();
    renderTeamsList();
  } catch (e) {
    document.getElementById('nrl-teams-list').innerHTML =
      '<div class="error">Could not load teams.</div>';
  }
}

function renderTeamsList() {
  const sorted = [...teamsData].sort((a, b) => {
    const favA = favouriteIds.has(a.idTeam) ? 0 : 1;
    const favB = favouriteIds.has(b.idTeam) ? 0 : 1;
    if (favA !== favB) return favA - favB;
    return a.strTeam.localeCompare(b.strTeam);
  });

  document.getElementById('nrl-teams-list').innerHTML =
    '<div class="teams-grid">' +
    sorted.map(t => {
      const isFav = favouriteIds.has(t.idTeam);
      const badge = t.strTeamBadge
        ? `<img class="team-logo" src="${t.strTeamBadge}/preview" alt="" onerror="this.style.display='none'" />`
        : '';
      return `
        <div class="team-row">
          ${badge}
          <div class="team-info">
            <div class="team-name">${t.strTeam}</div>
            <div class="team-city">${t.strStadium || ''}</div>
          </div>
          <button class="fav-star ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="toggleFavourite('${t.idTeam}', '${t.strTeam.replace(/'/g, "\\'")}', '${t.strTeamBadge || ''}')">★</button>
        </div>
      `;
    }).join('') +
    '</div>';
}

async function toggleFavourite(teamId, teamName, teamBadge) {
  await window.FavouritesDB.toggle('NRL', teamId, teamName, teamBadge);
  await refreshFavourites();
  renderTeamsList();
}

window.toggleFavourite = toggleFavourite;

document.addEventListener('DOMContentLoaded', loadTeams);