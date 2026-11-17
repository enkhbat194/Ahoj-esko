// Strictly READ-ONLY Google Drive API v3 client.
// Never performs POST, PATCH, PUT, or DELETE against any Drive resource.

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
export const DRIVE_DOC_MIME = 'application/vnd.google-apps.document';
export const DRIVE_SHEET_MIME = 'application/vnd.google-apps.spreadsheet';
export const DRIVE_SLIDE_MIME = 'application/vnd.google-apps.presentation';

export type DriveReadContentResult =
  | {
      kind: 'text';
      text: string;
      exportedMimeType: string;
    }
  | {
      kind: 'audio';
      blob: Blob;
      mimeType: string;
      fileName: string;
    }
  | {
      kind: 'unsupported';
      reasonMn: string;
    };

async function driveGet(accessToken: string, url: string): Promise<Response> {
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (res.status === 401) {
    throw new Error('AUTH_EXPIRED');
  }
  if (res.status === 403 || res.status === 404) {
    const errBody = await res.text().catch(() => '');
    throw new Error(
      `Drive хавтас/файлд хандах эрх хүрсэнгүй (${res.status}). Та зөв Google хаягаараа (zazadada8899@gmail.com) нэвтэрсэн эсэхээ шалгана уу. ${errBody.slice(0, 120)}`
    );
  }
  if (!res.ok) {
    throw new Error(`Google Drive алдаа (${res.status})`);
  }
  return res;
}

export async function getDriveFileMetadata(
  accessToken: string,
  fileId: string
): Promise<DriveFileItem> {
  const fields = encodeURIComponent('id,name,mimeType,size,modifiedTime,webViewLink');
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=${fields}&supportsAllDrives=true`;
  const res = await driveGet(accessToken, url);
  return (await res.json()) as DriveFileItem;
}

export async function listDriveFolderItems(
  accessToken: string,
  folderId: string
): Promise<DriveFileItem[]> {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id,name,mimeType,size,modifiedTime,webViewLink)');
  const orderBy = encodeURIComponent('folder,name_natural');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=${orderBy}&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`;
  const res = await driveGet(accessToken, url);
  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files ?? [];
}

export function isTextReadableDriveFile(file: DriveFileItem): boolean {
  const m = file.mimeType.toLowerCase();
  const n = file.name.toLowerCase();
  return (
    m === DRIVE_DOC_MIME ||
    m === DRIVE_SHEET_MIME ||
    m === DRIVE_SLIDE_MIME ||
    m.startsWith('text/') ||
    m === 'application/json' ||
    n.endsWith('.md') ||
    n.endsWith('.txt') ||
    n.endsWith('.json') ||
    n.endsWith('.csv') ||
    n.endsWith('.ts') ||
    n.endsWith('.tsx')
  );
}

export function isAudioDriveFile(file: DriveFileItem): boolean {
  const m = file.mimeType.toLowerCase();
  const n = file.name.toLowerCase();
  return (
    m.startsWith('audio/') ||
    n.endsWith('.mp3') ||
    n.endsWith('.m4a') ||
    n.endsWith('.wav') ||
    n.endsWith('.ogg') ||
    n.endsWith('.webm')
  );
}

export async function readDriveFileContent(
  accessToken: string,
  file: DriveFileItem
): Promise<DriveReadContentResult> {
  if (file.mimeType === DRIVE_DOC_MIME || file.mimeType === DRIVE_SLIDE_MIME) {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/plain')}`;
    const res = await driveGet(accessToken, url);
    return {
      kind: 'text',
      text: await res.text(),
      exportedMimeType: 'text/plain',
    };
  }

  if (file.mimeType === DRIVE_SHEET_MIME) {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=${encodeURIComponent('text/csv')}`;
    const res = await driveGet(accessToken, url);
    return {
      kind: 'text',
      text: await res.text(),
      exportedMimeType: 'text/csv',
    };
  }

  if (isAudioDriveFile(file)) {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`;
    const res = await driveGet(accessToken, url);
    const blob = await res.blob();
    return {
      kind: 'audio',
      blob,
      mimeType: file.mimeType || blob.type || 'audio/mpeg',
      fileName: file.name,
    };
  }

  if (isTextReadableDriveFile(file)) {
    const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media&supportsAllDrives=true`;
    const res = await driveGet(accessToken, url);
    return {
      kind: 'text',
      text: await res.text(),
      exportedMimeType: file.mimeType || 'text/plain',
    };
  }

  return {
    kind: 'unsupported',
    reasonMn: `Энэ файлын төрлийг (${file.mimeType}) шууд текст эсвэл аудио хэлбэрээр унших боломжгүй байна. Google Drive дээрх линкээр нээж харна уу.`,
  };
}
