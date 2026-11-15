import type { StoredAudioMeta } from '../types/lesson';
import type { TtsAudioCacheMetadata } from './ttsCacheMeta';

const DB_NAME = 'ahoj_cesko_audio_db';
const DB_VERSION = 1;
const STORE_NAME = 'audio_blobs';

interface StoredAudioRecord {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: number;
  blob: Blob;
  cacheMeta?: TtsAudioCacheMetadata;
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
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
    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
  });
}

export async function saveAudioFile(file: File): Promise<StoredAudioMeta> {
  const db = await openAudioDB();
  const id = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const record: StoredAudioRecord = {
    id,
    fileName: file.name,
    mimeType: file.type || 'audio/mpeg',
    sizeBytes: file.size,
    createdAt: Date.now(),
    blob: file,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      resolve({
        id: record.id,
        fileName: record.fileName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        createdAt: record.createdAt,
      });
    };
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save audio'));
  });
}

export async function saveAudioBlob(
  id: string,
  blob: Blob,
  fileName: string,
  mimeType: string,
  cacheMeta?: TtsAudioCacheMetadata
): Promise<StoredAudioMeta> {
  const db = await openAudioDB();
  const record: StoredAudioRecord = {
    id,
    fileName,
    mimeType: mimeType || blob.type || 'audio/wav',
    sizeBytes: blob.size,
    createdAt: Date.now(),
    blob,
    cacheMeta,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () => {
      resolve({
        id: record.id,
        fileName: record.fileName,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes,
        createdAt: record.createdAt,
      });
    };
    tx.onerror = () => reject(tx.error ?? new Error('Failed to save audio blob'));
  });
}

export async function getAudioBlob(id: string): Promise<Blob | null> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(id);
    req.onsuccess = () => {
      const rec = req.result as StoredAudioRecord | undefined;
      resolve(rec?.blob ?? null);
    };
    req.onerror = () => reject(req.error ?? new Error('Failed to load audio'));
  });
}

export async function listAudioMetadata(): Promise<StoredAudioMeta[]> {
  try {
    const db = await openAudioDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const records = ((req.result as StoredAudioRecord[]) ?? []).filter(
          (r) => !r.id.startsWith('ai_tts_')
        );
        resolve(
          records
            .map((r) => ({
              id: r.id,
              fileName: r.fileName,
              mimeType: r.mimeType,
              sizeBytes: r.sizeBytes,
              createdAt: r.createdAt,
            }))
            .sort((a, b) => b.createdAt - a.createdAt)
        );
      };
      req.onerror = () => reject(req.error ?? new Error('Failed to list audio'));
    });
  } catch {
    return [];
  }
}

export async function deleteAudioBlob(id: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('Failed to delete audio'));
  });
}
