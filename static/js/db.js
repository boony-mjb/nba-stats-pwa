// Shared IndexedDB wrapper for storing favourite teams across pages (NBA + NRL).
// Exposes window.FavouritesDB = { toggle, isFavourite, getAll, subscribe }
//
// OBFUSCATION NOTE:
// The stored records are run through a lightweight XOR + base64 round-trip
// before being written to IndexedDB. This means anyone who opens DevTools →
// Application → IndexedDB will see scrambled blobs instead of plain JSON.
//
// This is obfuscation, NOT encryption. The XOR key is embedded in this file,
// so a determined person could always reverse it by reading the source. Real
// encryption would require a secret key the user doesn't have access to —
// but browser storage has no trusted key store, so that's fundamentally
// impossible in client-side JS. For a school project or low-sensitivity
// preferences like favourites, obfuscation is the honest and appropriate tool.

(function () {
  const DB_NAME   = 'nba-live-db';
  const DB_VERSION = 2; // bumped so IndexedDB re-runs onupgradeneeded and
                        // creates the new 'prefs' store alongside 'favourites'
  const STORE     = 'favourites';
  const PREFS_STORE = 'prefs';

  // XOR obfuscation key — 16 bytes, arbitrary
  const XOR_KEY = [0x4e, 0x42, 0x41, 0x4c, 0x69, 0x76, 0x65, 0x32,
                   0x30, 0x32, 0x35, 0x21, 0x2a, 0x3f, 0x7e, 0x40];

  function obfuscate(obj) {
    const json  = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    const out   = bytes.map((b, i) => b ^ XOR_KEY[i % XOR_KEY.length]);
    return btoa(String.fromCharCode(...out));
  }

  function deobfuscate(str) {
    try {
      const raw   = atob(str);
      const bytes = Uint8Array.from(raw, c => c.charCodeAt(0));
      const out   = bytes.map((b, i) => b ^ XOR_KEY[i % XOR_KEY.length]);
      return JSON.parse(new TextDecoder().decode(out));
    } catch {
      return null;
    }
  }

  let dbPromise = null;
  const listeners = [];

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(PREFS_STORE)) {
          db.createObjectStore(PREFS_STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror  = () => reject(req.error);
    });
    return dbPromise;
  }

  function makeKey(league, teamId) {
    return `${league}:${teamId}`;
  }

  async function getAll() {
    try {
      const db = await openDB();
      const raw = await new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
      });
      // Deobfuscate each stored blob back into a plain object
      return raw.map(r => ({ key: r.key, ...deobfuscate(r.data) })).filter(r => r.league);
    } catch (e) {
      console.error('FavouritesDB.getAll failed', e);
      return [];
    }
  }

  async function isFavourite(league, teamId) {
    const all = await getAll();
    return all.some(f => f.key === makeKey(league, teamId));
  }

  async function toggle(league, teamId, teamName, teamBadge) {
    const db      = await openDB();
    const key     = makeKey(league, teamId);
    const already = await isFavourite(league, teamId);

    await new Promise((resolve, reject) => {
      const tx    = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      if (already) {
        store.delete(key);
      } else {
        // Store obfuscated: { key } is the plain IndexedDB keyPath,
        // { data } is the scrambled payload
        store.put({ key, data: obfuscate({ league, teamId, teamName, teamBadge }) });
      }
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });

    const newState = !already;
    listeners.forEach(fn => fn());
    return newState;
  }

  // Generic prefs store — for anything else we want to persist obfuscated
  async function setPref(key, value) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PREFS_STORE, 'readwrite');
      tx.objectStore(PREFS_STORE).put({ key, data: obfuscate(value) });
      tx.oncomplete = resolve;
      tx.onerror    = () => reject(tx.error);
    });
  }

  async function getPref(key) {
    const db = await openDB();
    const row = await new Promise((resolve, reject) => {
      const tx  = db.transaction(PREFS_STORE, 'readonly');
      const req = tx.objectStore(PREFS_STORE).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
    return row ? deobfuscate(row.data) : null;
  }

  function subscribe(fn) {
    listeners.push(fn);
  }

  window.FavouritesDB = { toggle, isFavourite, getAll, subscribe, setPref, getPref };
})();