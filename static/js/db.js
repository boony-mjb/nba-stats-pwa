// Shared IndexedDB wrapper for storing favourite teams across pages (NBA + NRL).
// Exposes window.FavouritesDB = { toggle, isFavourite, getAll, subscribe }

(function () {
  const DB_NAME = 'nba-live-db';
  const DB_VERSION = 1;
  const STORE = 'favourites';

  let dbPromise = null;
  const listeners = [];

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }

  // key = `${league}:${teamId}` so NBA and NRL team IDs never collide
  function makeKey(league, teamId) {
    return `${league}:${teamId}`;
  }

  async function getAll() {
    try {
      const db = await openDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const req = tx.objectStore(STORE).getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('FavouritesDB.getAll failed', e);
      return [];
    }
  }

  async function isFavourite(league, teamId) {
    const all = await getAll();
    return all.some(f => f.key === makeKey(league, teamId));
  }

  // Adds the team if not already a favourite, removes it if it is.
  // Returns the new favourite state (true/false).
  async function toggle(league, teamId, teamName, teamBadge) {
    const db = await openDB();
    const key = makeKey(league, teamId);
    const already = await isFavourite(league, teamId);

    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      if (already) {
        store.delete(key);
      } else {
        store.put({ key, league, teamId, teamName, teamBadge });
      }
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });

    const newState = !already;
    listeners.forEach(fn => fn());
    return newState;
  }

  // Lets pages re-render their team/game lists when favourites change elsewhere
  function subscribe(fn) {
    listeners.push(fn);
  }

  window.FavouritesDB = { toggle, isFavourite, getAll, subscribe };
})();