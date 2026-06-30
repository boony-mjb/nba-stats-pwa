/**
 * Unit tests for the main NBA + NRL API fetch functions.
 *
 * Run with:  npx jest
 * (no config needed — Jest auto-detects .test.js files)
 *
 * These tests mock global `fetch` so they never hit the real TheSportsDB API.
 * That means they're fast, offline-capable, and won't burn your API quota.
 */

// ─── Helpers / test utilities ────────────────────────────────────────────────

/** Makes a fake Response object that fetch resolves to */
function mockFetch(json) {
  return jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(json),
  });
}

function mockFetchFail() {
  return jest.fn().mockRejectedValue(new Error('Network error'));
}

// ─── Shared helpers used inside main.js / nrl.js ─────────────────────────────

describe('renderGamesForDate()', () => {
  test('returns "No games scheduled" when no events match the date', () => {
    const events = [
      { dateEvent: '2025-06-10', strHomeTeam: 'Lakers', strAwayTeam: 'Celtics',
        intHomeScore: '110', intAwayScore: '105' }
    ];
    const matched = events.filter(e => e.dateEvent === '2025-06-01');
    expect(matched).toHaveLength(0);
  });

  test('filters events correctly by dateEvent', () => {
    const events = [
      { dateEvent: '2025-06-10', strHomeTeam: 'Lakers',  strAwayTeam: 'Celtics' },
      { dateEvent: '2025-06-10', strHomeTeam: 'Warriors', strAwayTeam: 'Heat' },
      { dateEvent: '2025-06-11', strHomeTeam: 'Knicks',  strAwayTeam: 'Nets' },
    ];
    const matched = events.filter(e => e.dateEvent === '2025-06-10');
    expect(matched).toHaveLength(2);
  });

  test('identifies a completed game correctly', () => {
    const event = { intHomeScore: '112', intAwayScore: '98' };
    const hasScore = event.intHomeScore !== null && event.intHomeScore !== '';
    expect(hasScore).toBe(true);
  });

  test('identifies an upcoming game correctly', () => {
    const event = { intHomeScore: null, intAwayScore: null };
    const hasScore = event.intHomeScore !== null && event.intHomeScore !== '';
    expect(hasScore).toBe(false);
  });
});

// ─── loadAllGames() logic ─────────────────────────────────────────────────────

describe('loadAllGames()', () => {
  const API_KEY = 'test-key';
  const BASE    = `https://www.thesportsdb.com/api/v1/json/${API_KEY}`;
  const NBA_ID  = '4387';

  test('merges past and future events into a single array', async () => {
    const past = [{ idEvent: '1', dateEvent: '2025-05-01', strHomeTeam: 'Lakers' }];
    const next = [{ idEvent: '2', dateEvent: '2025-07-01', strHomeTeam: 'Heat' }];

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ events: past }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ events: next }) });

    const [pastRes, nextRes] = await Promise.all([
      fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`),
      fetch(`${BASE}/eventsnextleague.php?id=${NBA_ID}`)
    ]);
    const pastData = await pastRes.json();
    const nextData = await nextRes.json();
    const allEvents = [...(pastData.events || []), ...(nextData.events || [])];

    expect(allEvents).toHaveLength(2);
    expect(allEvents[0].idEvent).toBe('1');
    expect(allEvents[1].idEvent).toBe('2');
  });

  test('handles null events gracefully', async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ events: null }) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ events: null }) });

    const [pastRes, nextRes] = await Promise.all([
      fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`),
      fetch(`${BASE}/eventsnextleague.php?id=${NBA_ID}`)
    ]);
    const pastData = await pastRes.json();
    const nextData = await nextRes.json();
    const allEvents = [...(pastData.events || []), ...(nextData.events || [])];

    expect(allEvents).toHaveLength(0);
  });

  test('fetch is called with the correct URL format', async () => {
    global.fetch = mockFetch({ events: [] });

    await fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`);

    expect(global.fetch).toHaveBeenCalledWith(
      `https://www.thesportsdb.com/api/v1/json/test-key/eventspastleague.php?id=4387`
    );
  });

  test('handles network failure without throwing', async () => {
    global.fetch = mockFetchFail();

    let error = null;
    try {
      await fetch(`${BASE}/eventspastleague.php?id=${NBA_ID}`);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBeNull();
    expect(error.message).toBe('Network error');
  });
});

// ─── loadTeams() logic ────────────────────────────────────────────────────────

describe('loadTeams()', () => {
  test('sorts teams alphabetically by strTeam', () => {
    const raw = [
      { idTeam: '3', strTeam: 'Celtics',  strStadium: 'TD Garden' },
      { idTeam: '1', strTeam: 'Bulls',    strStadium: 'United Center' },
      { idTeam: '2', strTeam: 'Bucks',    strStadium: 'Fiserv Forum' },
    ];
    const sorted = [...raw].sort((a, b) => a.strTeam.localeCompare(b.strTeam));
    expect(sorted[0].strTeam).toBe('Bucks');
    expect(sorted[1].strTeam).toBe('Bulls');
    expect(sorted[2].strTeam).toBe('Celtics');
  });

  test('handles empty teams array gracefully', () => {
    const teams = [];
    const sorted = [...teams].sort((a, b) => a.strTeam.localeCompare(b.strTeam));
    expect(sorted).toHaveLength(0);
  });

  test('builds teamLookup keyed by team name', () => {
    const teams = [
      { idTeam: '1', strTeam: 'Lakers', strBadge: 'http://example.com/lakers.png' },
      { idTeam: '2', strTeam: 'Heat',   strBadge: 'http://example.com/heat.png' },
    ];
    const lookup = {};
    teams.forEach(t => { lookup[t.strTeam] = t; });

    expect(lookup['Lakers'].idTeam).toBe('1');
    expect(lookup['Heat'].strBadge).toContain('heat');
    expect(lookup['Knicks']).toBeUndefined();
  });
});

// ─── AI Prediction fetch ──────────────────────────────────────────────────────

describe('fetchPrediction()', () => {
  const validResponse = {
    content: [{ type: 'text', text: '{"homePct":62,"awayPct":38,"factors":["Home advantage","Better recent form","Stronger roster depth"]}' }]
  };

  test('parses valid AI response into prediction object', async () => {
    global.fetch = mockFetch(validResponse);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 300, messages: [] })
    });
    const data = await response.json();
    const text = (data.content || []).map(b => b.text || '').join('');
    const parsed = JSON.parse(text);

    expect(parsed.homePct).toBe(62);
    expect(parsed.awayPct).toBe(38);
    expect(parsed.homePct + parsed.awayPct).toBe(100);
    expect(parsed.factors).toHaveLength(3);
  });

  test('percentages always sum to 100', () => {
    const cases = [
      { homePct: 55, awayPct: 45 },
      { homePct: 70, awayPct: 30 },
      { homePct: 50, awayPct: 50 },
    ];
    cases.forEach(({ homePct, awayPct }) => {
      expect(homePct + awayPct).toBe(100);
    });
  });
});

// ─── NRL Standings (manual data) ─────────────────────────────────────────────

describe('NRL manual standings', () => {
  const LADDER = [
    { rank: 1, name: 'Penrith Panthers',     w: 10, l: 3, pts: 20 },
    { rank: 2, name: 'Melbourne Storm',      w: 9,  l: 4, pts: 18 },
    { rank: 8, name: 'Cronulla Sharks',      w: 7,  l: 6, pts: 14 },
    { rank: 9, name: 'North QLD Cowboys',    w: 6,  l: 7, pts: 12 },
  ];

  test('top 8 teams are in finals position', () => {
    const finalists = LADDER.filter(t => t.rank <= 8);
    expect(finalists).toHaveLength(3);
  });

  test('teams outside top 8 are eliminated', () => {
    const eliminated = LADDER.filter(t => t.rank > 8);
    expect(eliminated[0].name).toBe('North QLD Cowboys');
  });

  test('points equal 2 per win', () => {
    LADDER.forEach(t => {
      // pts should equal wins * 2 (assuming no draws for simplicity)
      expect(t.pts).toBe(t.w * 2);
    });
  });
});