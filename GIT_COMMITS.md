# NBA/NRL Live — Git Commit Structure Guide
# =========================================
# Each commit message below is written in the conventional commits format:
#   <type>(<scope>): <short description>
#
# Types used: feat (new feature), fix (bug fix), style (CSS/visual),
#             refactor (code cleanup), test (unit tests), docs (readme/comments),
#             chore (setup, dependencies, config)
#
# This gives you a clean, readable history for your submission.
# Run each `git add` + `git commit` pair after you've made that set of changes.

# ── Suggested commit order ────────────────────────────────────────────────────

# 1. Initial project setup
git add app.py requirements.txt .env .gitignore readme.md
git commit -m "chore: initial Flask project setup with .env and requirements"

# 2. Base NBA Scores page
git add templates/index.html static/js/main.js static/css/style.css
git commit -m "feat(nba): add Scores page with day-strip and box score modal"

# 3. NBA Playoffs & Bracket pages
git add templates/playoffs.html templates/bracket.html static/js/playoffs.js static/js/bracket.js
git commit -m "feat(nba): add Playoffs standings and bracket pages"

# 4. NBA Rules page
git add templates/rules.html
git commit -m "feat(nba): add Rules page with plain-language basketball summary"

# 5. NRL mini-app
git add templates/nrl.html templates/nrl_nav.html templates/nrl_teams.html \
        templates/nrl_standings.html templates/nrl_rules.html \
        static/js/nrl.js static/js/nrl-teams.js static/js/nrl-standings.js
git commit -m "feat(nrl): add NRL as separate mini-app with Scores, Teams, Standings, Rules"

# 6. Shared nav + app-switch link
git add templates/nav.html
git commit -m "feat(nav): add Rules tab and NRL app-switch link to main nav"

# 7. Team logos + favourites with IndexedDB
git add static/js/db.js
git commit -m "feat(db): add IndexedDB wrapper with XOR+base64 obfuscation for favourites"

git add static/js/main.js static/js/nrl.js static/js/nrl-teams.js
git commit -m "feat(teams): add team logos and favourites star to NBA and NRL pages"

# 8. Date picker on Scores pages
git add templates/index.html templates/nrl.html static/css/style.css
git commit -m "feat(ux): add date picker alongside day-strip on Scores pages"

# 9. Login / Register / Guest session
git add auth.py
git commit -m "feat(auth): add SQLite user store with hashed passwords"

git add app.py templates/login.html templates/register.html templates/nav.html templates/nrl_nav.html
git commit -m "feat(auth): gate all routes behind login/register/guest session"

# 10. AI prediction widget
git add static/js/prediction.js
git commit -m "feat(ai): add AI game prediction widget using Claude API (prototype)"

# 11. Caching + lazy loading
git add static/js/main.js static/js/nrl.js
git commit -m "refactor(perf): add in-memory API cache with TTL and IntersectionObserver lazy images"

# 12. Unit tests
git add api.test.js
git commit -m "test: add Jest unit tests for fetch, filter, and standings logic"

# 13. PWA setup
git add manifest.json sw.js
git commit -m "chore(pwa): add PWA manifest and Workbox service worker"

git add app.py templates/nav.html templates/index.html
git commit -m "feat(pwa): serve manifest.json and sw.js from Flask, register SW in nav"

# 14. Final QA / bug fixes — use this pattern for any fixes you make:
# git commit -m "fix(nrl): switch to search_all_teams.php to fix 404 on team lookup"
# git commit -m "fix(auth): add guest route to PUBLIC_ROUTES so session gate doesn't block it"
# git commit -m "style(game-row): set align-items:flex-start on home team-block for symmetric stars"    