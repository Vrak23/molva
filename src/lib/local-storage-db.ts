import { Playlist } from '@/types';
import { INITIAL_MOCK_PLAYLISTS } from './mock-data';

const DB_NAME = 'canon_playlists_db';
const STORE_NAME = 'playlists';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB no está disponible.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Función para ordenar por fecha de creación / lanzamiento (más reciente primero)
export function sortByReleaseDateDesc(list: Playlist[]): Playlist[] {
  return [...list].sort((a, b) => {
    const dateA = new Date(a.release_date || a.created_at).getTime();
    const dateB = new Date(b.release_date || b.created_at).getTime();
    return dateB - dateA;
  });
}

export async function getLocalPlaylists(): Promise<Playlist[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result as Playlist[];
        if (results && results.length > 0) {
          resolve(sortByReleaseDateDesc(results));
        } else {
          const legacy = localStorage.getItem('canon_local_playlists');
          if (legacy) {
            try {
              const parsed = JSON.parse(legacy);
              resolve(sortByReleaseDateDesc(parsed));
              return;
            } catch {}
          }
          resolve(sortByReleaseDateDesc(INITIAL_MOCK_PLAYLISTS));
        }
      };

      request.onerror = () => {
        resolve(sortByReleaseDateDesc(INITIAL_MOCK_PLAYLISTS));
      };
    });
  } catch {
    return sortByReleaseDateDesc(INITIAL_MOCK_PLAYLISTS);
  }
}

export async function saveLocalPlaylist(playlist: Playlist): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(playlist);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
}

export async function deleteLocalPlaylist(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return false;
  }
}
