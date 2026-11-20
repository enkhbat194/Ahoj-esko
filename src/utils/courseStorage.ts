import { readCourse } from './courseSource';

const store = 'private-course';
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ahoj-canonical-course', 1);
    request.onupgradeneeded = () => request.result.createObjectStore(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact(mode: IDBTransactionMode, apply: (s: IDBObjectStore) => IDBRequest) {
  const db = await openDatabase();
  try {
    return await new Promise<unknown>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const request = apply(tx.objectStore(store));
      tx.oncomplete = () => resolve(request.result);
      tx.onabort = () => reject(tx.error || request.error);
      tx.onerror = () => reject(tx.error || request.error);
    });
  } finally { db.close(); }
}

export async function loadCourse() {
  const file = await transact('readonly', s => s.get('current'));
  return file instanceof Blob ? readCourse(file) : null;
}
export async function installCourse(file: Blob) {
  const course = await readCourse(file);
  // A text-only Drive import must preserve the owner's already-installed audio.
  if (!course.clips.size) {
    const previous = await loadCourse();
    if (previous?.clips.size) return previous;
  }
  await transact('readwrite', s => s.put(file, 'current'));
  return course;
}

export function linkedLesson() {
  const params = new URLSearchParams(location.hash.slice(1));
  const id = params.get('lesson') || '';
  return /^CZ-A[01]-M\d{2}-L\d{2}$/.test(id) ? id : '';
}

// The owner receives the preview key in the URL fragment. The static host receives only ciphertext.
export async function openPrivateInvitation(key: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(key)) throw Error('Хувийн хичээлийн холбоос буруу байна.');
  const raw = Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/') + '='), c => c.charCodeAt(0));
  const aes = await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['decrypt']);
  const response = await fetch('/private-course-v1.bin', {credentials: 'same-origin'});
  if (!response.ok) throw Error('Хичээлийн багцыг татаж чадсангүй.');
  const encrypted = await response.arrayBuffer();
  const iv = new Uint8Array(encrypted, 0, 12);
  const compressed = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, aes, encrypted.slice(12));
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  return installCourse(await new Response(stream).blob());
}
