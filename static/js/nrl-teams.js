const BASE = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
const NRL_LEAGUE_NAME = 'Australian_National_Rugby_League';

let teamsData = [];
let favouriteIds = new Set();

async function refreshFavourites() {
  const favs = await window.FavouritesDB.getAll();
  favouriteIds = new Set(favs.filter(f => f.league === 'NRL').map(f => f.teamId));
}

async function loadTeams() {
  try {
    // search_all_teams.php needs the league's full name (underscores for spaces),
    // not the "NRL" abbreviation — that's what caused the earlier blank page.
    // lookup_all_teams.php?id=4416 would be simpler, but 404s on this account's key.
    const res = await fetch(`${BASE}/search_all_teams.php?l=${NRL_LEAGUE_NAME}`);
    const data = await res.json();
    teamsData = (data.teams || []).sort((a, b) => a.strTeam.localeCompare(b.strTeam));

    if (!teamsData.length) {
      document.getElementById('nrl-teams-list').innerHTML =
        '<div class="error">No teams returned by the API for this league.</div>';
      return;
    }

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
      const badge = t.strBadge || t.strTeamBadge
        ? `<img class="team-logo" src="${t.strBadge || t.strTeamBadge}/small" alt="" onerror="this.style.display='none'" />`
        : '';
      return `
        <div class="team-row">
          ${badge}
          <div class="team-info">
            <div class="team-name">${t.strTeam}</div>
            <div class="team-city">${t.strStadium || ''}</div>
          </div>
          <button class="fav-star ${isFav ? 'active' : ''}" title="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
            onclick="toggleFavourite('${t.idTeam}', '${t.strTeam.replace(/'/g, "\\'")}', '${t.strBadge || t.strTeamBadge || ''}')">★</button>
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