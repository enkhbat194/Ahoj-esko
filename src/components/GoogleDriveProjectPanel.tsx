import { installCourse } from '../utils/courseStorage';
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  Check,
  ChevronRight,
  Copy,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderOpen,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Sparkles,
  Volume2,
} from 'lucide-react';
import type { Dialogue, TopicId } from '../types/lesson';
import type { CanonicalCurriculumOverview } from '../utils/canonicalCurriculumOverview';
import {
  DEFAULT_PROJECT_DRIVE_FOLDER_ID,
  extractDriveFolderId,
  parseDriveCurriculumText,
  type ParsedDriveCard,
} from '../utils/driveCurriculumParser';
import {
  DEFAULT_DRIVE_ACCOUNT_HINT,
  getCachedDriveAccessToken,
  initDriveAuth,
  signInWithGoogleDrive,
  signOutGoogleDrive,
} from '../utils/googleDriveAuth';
import {
  DRIVE_FOLDER_MIME,
  getDriveFileMetadata,
  isAudioDriveFile,
  isTextReadableDriveFile,
  listDriveFolderItems,
  readDriveFileContent,
  type DriveFileItem,
} from '../utils/googleDriveClient';
import { playBlobAudio } from '../utils/audioPlayer';
import { formatTokenCount, formatUsdCost, type TokenUsageMetrics } from '../utils/tokenPricing';
import { appendClientUsageLog } from '../utils/usageMonitor';

interface GoogleDriveProjectPanelProps {
  onImportDriveCurriculum: (
    cards: ParsedDriveCard[],
    dialogues: Omit<Dialogue, 'id'>[]
  ) => Promise<void> | void;
  onImportDriveAudioFiles: (files: File[]) => Promise<void>;
}

interface FolderCrumb {
  id: string;
  name: string;
}

export const GoogleDriveProjectPanel: React.FC<GoogleDriveProjectPanelProps> = ({
  onImportDriveCurriculum,
  onImportDriveAudioFiles,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [accountHint, setAccountHint] = useState(DEFAULT_DRIVE_ACCOUNT_HINT);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [folderInput, setFolderInput] = useState(DEFAULT_PROJECT_DRIVE_FOLDER_ID);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderCrumb[]>([
    { id: DEFAULT_PROJECT_DRIVE_FOLDER_ID, name: 'Ahoj Cesko' },
  ]);
  const [items, setItems] = useState<DriveFileItem[]>([]);
  const [isLoadingFolder, setIsLoadingFolder] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);

  // Selected file preview & extraction
  const [selectedFile, setSelectedFile] = useState<DriveFileItem | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [previewText, setPreviewText] = useState<string>('');
  const [previewAudioBlob, setPreviewAudioBlob] = useState<Blob | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const [parsedCards, setParsedCards] = useState<ParsedDriveCard[]>([]);
  const [canonicalOverview, setCanonicalOverview] = useState<CanonicalCurriculumOverview | null>(null);
  const [parsedDialogues, setParsedDialogues] = useState<Omit<Dialogue, 'id'>[]>([]);
  const [selectedCardIndices, setSelectedCardIndices] = useState<Set<number>>(new Set());
  const [aiSummaryMn, setAiSummaryMn] = useState<string | null>(null);
  const [aiUsage, setAiUsage] = useState<TokenUsageMetrics | null>(null);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadFolder = useCallback(async (folderId: string, tokenOverride?: string) => {
    const token = tokenOverride ?? getCachedDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setIsLoadingFolder(true);
    setDriveError(null);
    try {
      const files = await listDriveFolderItems(token, folderId);
      setItems(files);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Drive хавтас уншиж чадсангүй.';
      if (msg === 'AUTH_EXPIRED') {
        setNeedsAuth(true);
        setDriveError('Google Drive холболтын хугацаа дууссан тул дахин нэвтэрнэ үү.');
      } else {
        setDriveError(msg);
      }
    } finally {
      setIsLoadingFolder(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = initDriveAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setNeedsAuth(false);
        void loadFolder(breadcrumbs[breadcrumbs.length - 1]?.id ?? DEFAULT_PROJECT_DRIVE_FOLDER_ID, token);
      },
      (maybeUser) => {
        setUser(maybeUser);
        setNeedsAuth(true);
      }
    );
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    setDriveError(null);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogleDrive(accountHint);
      setUser(res.user);
      setNeedsAuth(false);

      const targetId = extractDriveFolderId(folderInput) ?? DEFAULT_PROJECT_DRIVE_FOLDER_ID;
      let folderTitle = 'Ahoj Cesko';
      try {
        const meta = await getDriveFileMetadata(res.accessToken, targetId);
        if (meta.name) folderTitle = meta.name;
      } catch {
        // Ignore optional root name lookup failure and list directory directly
      }
      setBreadcrumbs([{ id: targetId, name: folderTitle }]);
      await loadFolder(targetId, res.accessToken);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google нэвтрэлт амжилтгүй боллоо.';
      setDriveError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setUser(null);
    setNeedsAuth(true);
    setItems([]);
    setSelectedFile(null);
    setPreviewText('');
    setPreviewAudioBlob(null);
    setParsedCards([]);
    setCanonicalOverview(null);
    setParsedDialogues([]);
  };

  const handleOpenFolderInput = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractDriveFolderId(folderInput);
    if (!id) {
      setDriveError('Зөв Google Drive хавтасны линк эсвэл ID оруулна уу.');
      return;
    }
    const token = getCachedDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    let name = 'Төслийн хавтас';
    try {
      const meta = await getDriveFileMetadata(token, id);
      if (meta.name) name = meta.name;
    } catch {
      // Proceed to list folder contents
    }
    setSelectedFile(null);
    setPreviewText('');
    setPreviewAudioBlob(null);
    setBreadcrumbs([{ id, name }]);
    await loadFolder(id, token);
  };

  const handleNavigateSubfolder = async (folder: DriveFileItem) => {
    setSelectedFile(null);
    setPreviewText('');
    setPreviewAudioBlob(null);
    setParsedCards([]);
    setCanonicalOverview(null);
    setParsedDialogues([]);
    setAiSummaryMn(null);
    setStatusMessage(null);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
    await loadFolder(folder.id);
  };

  const handleBreadcrumbClick = async (idx: number) => {
    const target = breadcrumbs[idx];
    if (!target) return;
    setSelectedFile(null);
    setPreviewText('');
    setPreviewAudioBlob(null);
    setParsedCards([]);
    setCanonicalOverview(null);
    setParsedDialogues([]);
    setAiSummaryMn(null);
    setStatusMessage(null);
    setBreadcrumbs((prev) => prev.slice(0, idx + 1));
    await loadFolder(target.id);
  };

  const handleSelectFile = async (file: DriveFileItem) => {
    if (file.mimeType === DRIVE_FOLDER_MIME) {
      await handleNavigateSubfolder(file);
      return;
    }

    const token = getCachedDriveAccessToken();
    if (!token) {
      setNeedsAuth(true);
      return;
    }

    setSelectedFile(file);
    setIsReadingFile(true);
    setPreviewText('');
    setPreviewAudioBlob(null);
    setParsedCards([]);
    setCanonicalOverview(null);
    setParsedDialogues([]);
    setSelectedCardIndices(new Set());
    setAiSummaryMn(null);
    setAiUsage(null);
    setStatusMessage(null);
    setDriveError(null);

    try {
      const content = await readDriveFileContent(token, file);
      if (content.kind === 'text') {
        setPreviewText(content.text);
        const parsed = parseDriveCurriculumText(content.text, file.name);
        setParsedCards(parsed.cards);
        setCanonicalOverview(parsed.canonicalOverview ?? null);
        setParsedDialogues(parsed.dialogues);
        setSelectedCardIndices(new Set(parsed.cards.map((_, i) => i)));
      } else if (content.kind === 'audio') {
        setPreviewAudioBlob(content.blob);
      } else {
        setDriveError(content.reasonMn);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Файл уншиж чадсангүй.';
      if (msg === 'AUTH_EXPIRED') {
        setNeedsAuth(true);
        setDriveError('Google Drive холболт дууссан тул дахин нэвтэрнэ үү.');
      } else {
        setDriveError(msg);
      }
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleAiExtract = async () => {
    if (!previewText.trim() || !selectedFile || isAiExtracting) return;
    setIsAiExtracting(true);
    setDriveError(null);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/ai/extract-drive-curriculum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: previewText,
          fileName: selectedFile.name,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        summaryMn?: string;
        cards?: Array<{
          topicId?: string;
          czechWord: string;
          phoneticHint: string;
          mongolianWord: string;
          czechSentence: string;
          mongolianSentence: string;
        }>;
        usage?: TokenUsageMetrics;
      };
      if (!res.ok || data.error) {
        setDriveError(data.error || 'AI ялгалт амжилтгүй боллоо.');
        return;
      }

      if (data.usage) {
        setAiUsage(data.usage);
        appendClientUsageLog({
          id: `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: Date.now(),
          endpoint: '/api/ai/extract-drive-curriculum',
          usedModel: data.usage.usedModel ?? 'gemini-3.1-flash-lite',
          inputTokens: data.usage.inputTokens,
          outputTokens: data.usage.outputTokens,
          thinkingTokens: data.usage.thinkingTokens ?? 0,
          cachedTokens: data.usage.cachedTokens ?? 0,
          totalTokens: data.usage.totalTokens,
          ttsAudioGenerated: false,
          requestDurationMs: data.usage.durationMs ?? 0,
          cacheHit: false,
          estimatedCostUsd: data.usage.estimatedCostUsd,
        });
      }

      if (data.summaryMn) setAiSummaryMn(data.summaryMn);
      const validTopic = (t?: string): TopicId =>
        t === 'greetings' || t === 'cafe' || t === 'transport' || t === 'work' || t === 'custom'
          ? t
          : 'custom';
      const normalized: ParsedDriveCard[] = (data.cards ?? []).map((c) => ({
        topicId: validTopic(c.topicId),
        czechWord: c.czechWord,
        phoneticHint: c.phoneticHint,
        mongolianWord: c.mongolianWord,
        czechSentence: c.czechSentence,
        mongolianSentence: c.mongolianSentence,
      }));
      setParsedCards(normalized);
      setCanonicalOverview(null);
      setSelectedCardIndices(new Set(normalized.map((_, i) => i)));
    } catch {
      setDriveError('Сүлжээний алдаа гарлаа.');
    } finally {
      setIsAiExtracting(false);
    }
  };

  const handleImportSelected = async () => {
    if (canonicalOverview?.validationErrors.length) {
      setDriveError('Эхийн ID/бүтцийн зөрчил илэрсэн тул импортлохыг зогсоолоо.');
      return;
    }
    const cardsToImport = parsedCards.filter((_, idx) => selectedCardIndices.has(idx));
    if (cardsToImport.length === 0 && parsedDialogues.length === 0) return;
    await onImportDriveCurriculum(cardsToImport, parsedDialogues);
    setStatusMessage(
      `${cardsToImport.length} үгсийн карт${
        parsedDialogues.length > 0 ? `, ${parsedDialogues.length} харилцан яриа` : ''
      } Ahoj Česko сан руу нэмэгдлээ.${canonicalOverview ? ' Дасгал болон гарах сорилууд тусдаа сургалтын хөдөлгүүрт хараахан холбогдоогүй.' : ''}`
    );
  };

  const handleSaveDriveAudioOffline = async () => {
    if (!selectedFile || !previewAudioBlob) return;
    const file = new File([previewAudioBlob], selectedFile.name, {
      type: previewAudioBlob.type || 'audio/mpeg',
    });
    await onImportDriveAudioFiles([file]);
    setStatusMessage(`«${selectedFile.name}» офлайн Аудио сан руу хадгалагдлаа.`);
  };

  const handleCopyPreviewText = async () => {
    if (!previewText) return;
    try {
      await navigator.clipboard.writeText(previewText);
      setCopiedText(true);
      window.setTimeout(() => setCopiedText(false), 1800);
    } catch {
      // Clipboard blocked on non-HTTPS fallback
    }
  };

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];

  return (
    <section className="rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-[#1C1C1E] dark:text-white tracking-tight">
              Google Drive төслийн хавтас
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#34C759]/12 text-[#248A3D] dark:text-[#30D158] text-[11px] font-semibold">
              <Lock className="w-3 h-3" />
              <span>Зөвхөн унших (өөрчлөхгүй)</span>
            </span>
          </div>
          <p className="text-xs text-[#8E8E93]">
            Таны <span className="font-mono text-[#1C1C1E] dark:text-[#F2F2F7]">Ahoj Cesko</span> Drive
            хавтаснаас (<span className="font-mono">1TFTOQHQK7JKQFhueBI8LURbxRIdROhYj</span>) баримт,
            хичээл болон аудиог шууд уншиж апп руугаа оруулна.
          </p>
        </div>

        {!needsAuth && user && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-[#636366] dark:text-[#AEAEB2] truncate max-w-[190px]">
              {user.email}
            </span>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              className="min-h-[34px] px-2.5 rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-xs font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Гарах</span>
            </button>
          </div>
        )}
      </div>

      {needsAuth ? (
        <div className="rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] p-4 sm:p-5 space-y-3.5">
          <div className="space-y-1.5">
            <label
              htmlFor="drive-account-hint"
              className="block text-xs font-semibold text-[#1C1C1E] dark:text-white"
            >
              Google Drive хаяг (сонголт хийх үед санал болгоно)
            </label>
            <input
              id="drive-account-hint"
              type="email"
              value={accountHint}
              onChange={(e) => setAccountHint(e.target.value)}
              placeholder="zazadada8899@gmail.com"
              className="w-full sm:max-w-xs min-h-[38px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3 text-xs font-mono text-[#1C1C1E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]/40"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isLoggingIn}
              onClick={() => void handleGoogleSignIn()}
              className="gsi-material-button"
            >
              <div className="gsi-material-button-state" />
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    style={{ display: 'block' }}
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </div>
                <span className="gsi-material-button-contents">
                  {isLoggingIn ? 'Нэвтэрч байна...' : 'Sign in with Google'}
                </span>
                <span style={{ display: 'none' }}>Sign in with Google</span>
              </div>
            </button>

            <span className="text-[11px] text-[#636366] dark:text-[#AEAEB2]">
              Цонх гарч ирэхэд <strong>{accountHint || 'zazadada8899@gmail.com'}</strong> хаягаа
              сонгоорой.
            </span>
          </div>

          {driveError && <p className="text-xs font-medium text-[#FF3B30]">{driveError}</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Folder URL/ID Bar */}
          <form onSubmit={(e) => void handleOpenFolderInput(e)} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              aria-label="Google Drive хавтасны линк эсвэл ID"
              placeholder="https://drive.google.com/drive/folders/..."
              className="flex-1 min-h-[38px] rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#F2F2F7] dark:bg-[#2C2C2E] px-3 text-xs font-mono text-[#1C1C1E] dark:text-white focus:outline-none"
            />
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="min-h-[38px] px-3.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-xs font-semibold cursor-pointer"
              >
                Хавтас нээх
              </button>
              <button
                type="button"
                disabled={isLoadingFolder}
                onClick={() => void loadFolder(currentFolder.id)}
                aria-label="Сэргээх"
                className="min-h-[38px] min-w-[38px] rounded-xl bg-[#F2F2F7] dark:bg-[#2C2C2E] text-[#1C1C1E] dark:text-white flex items-center justify-center cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingFolder ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </form>

          {/* Breadcrumbs */}
          <nav aria-label="Drive зам" className="flex flex-wrap items-center gap-1 text-xs">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93]" />}
                <button
                  type="button"
                  onClick={() => void handleBreadcrumbClick(idx)}
                  className={`px-2 py-1 rounded-lg font-semibold cursor-pointer ${
                    idx === breadcrumbs.length - 1
                      ? 'bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF]'
                      : 'text-[#636366] dark:text-[#AEAEB2] hover:bg-[#F2F2F7] dark:hover:bg-[#2C2C2E]'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>

          {driveError && (
            <div className="rounded-2xl bg-[#FF3B30]/10 border border-[#FF3B30]/25 p-3 text-xs font-medium text-[#D70015] dark:text-[#FF453A]">
              {driveError}
            </div>
          )}

          {/* Folder Contents & File Preview Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Folder / File List */}
            <div className="lg:col-span-5 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] overflow-hidden">
              <div className="px-3.5 py-2.5 border-b border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-[#8E8E93]">
                <span>Файлууд ({items.length})</span>
                {isLoadingFolder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              </div>

              {items.length === 0 && !isLoadingFolder ? (
                <p className="p-4 text-xs text-[#8E8E93]">Энэ хавтас хоосон эсвэл эрхгүй байна.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                  {items.map((item) => {
                    const isFolder = item.mimeType === DRIVE_FOLDER_MIME;
                    const isSheet = item.mimeType.includes('spreadsheet');
                    const isAudio = isAudioDriveFile(item);
                    const isSelected = selectedFile?.id === item.id;
                    const Icon = isFolder
                      ? isSelected
                        ? FolderOpen
                        : Folder
                      : isAudio
                        ? FileAudio
                        : isSheet
                          ? FileSpreadsheet
                          : FileText;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => void handleSelectFile(item)}
                        className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#007AFF]/12 text-[#007AFF] dark:text-[#64D2FF]'
                            : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04] text-[#1C1C1E] dark:text-[#F2F2F7]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isFolder
                                ? 'text-[#007AFF] dark:text-[#64D2FF]'
                                : isAudio
                                  ? 'text-[#34C759]'
                                  : 'text-[#8E8E93]'
                            }`}
                          />
                          <span className="text-xs font-semibold truncate">{item.name}</span>
                        </div>
                        {isFolder && <ChevronRight className="w-3.5 h-3.5 text-[#8E8E93] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected File Preview & Extractor */}
            <div className="lg:col-span-7 rounded-2xl bg-[#F2F2F7] dark:bg-[#2C2C2E] border border-black/[0.05] dark:border-white/[0.06] p-4 space-y-3">
              {!selectedFile ? (
                <div className="py-10 text-center space-y-1.5">
                  <p className="text-xs font-semibold text-[#1C1C1E] dark:text-white">
                    Зүүн жагсаалтаас хавтас эсвэл баримт сонгоно уу
                  </p>
                  <p className="text-[11px] text-[#8E8E93]">
                    Google Docs, Sheets, JSON, текст болон аудио файлуудыг энд шууд уншиж шалгана.
                  </p>
                </div>
              ) : isReadingFile ? (
                <div className="py-10 flex items-center justify-center gap-2 text-xs text-[#8E8E93]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>«{selectedFile.name}» файлыг уншиж байна...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1C1C1E] dark:text-white truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#8E8E93] truncate">
                        {isTextReadableDriveFile(selectedFile)
                          ? `${previewText.length.toLocaleString('en-US')} тэмдэгт`
                          : selectedFile.mimeType}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {previewText && (
                        <>
                          <button
                            type="button"
                            onClick={() => void handleCopyPreviewText()}
                            className="min-h-[32px] px-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] text-[11px] font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            {copiedText ? <Check className="w-3.5 h-3.5 text-[#34C759]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedText ? 'Хуулсан' : 'Хуулах'}</span>
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            disabled={isAiExtracting}
                            onClick={() => void handleAiExtract()}
                            className="min-h-[32px] px-2.5 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-[11px] font-semibold inline-flex items-center gap-1 disabled:opacity-60 cursor-pointer"
                          >
                            {isAiExtracting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span>{isAiExtracting ? 'Ялгаж байна...' : 'AI-аар карт/товч ялгах'}</span>
                          </motion.button>
                        </>
                      )}

                      {previewAudioBlob && (
                        <>
                          <button
                            type="button"
                            onClick={() => void playBlobAudio(previewAudioBlob)}
                            className="min-h-[32px] px-2.5 rounded-xl bg-white dark:bg-[#1C1C1E] text-[11px] font-semibold text-[#1C1C1E] dark:text-white inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>Сонсох</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleSaveDriveAudioOffline()}
                            className="min-h-[32px] px-2.5 rounded-xl bg-[#34C759] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Аудио сан руу хадгалах</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {aiSummaryMn && (
                    <div className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 border border-black/[0.06] dark:border-white/[0.08] space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#007AFF] dark:text-[#64D2FF]">
                        <span>Баримтын хураангуй (AI)</span>
                        {aiUsage && (
                          <span className="font-mono text-[#8E8E93]">
                            {formatTokenCount(aiUsage.totalTokens)} tok · {formatUsdCost(aiUsage.estimatedCostUsd)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#1C1C1E] dark:text-[#F2F2F7] leading-relaxed">
                        {aiSummaryMn}
                      </p>
                    </div>
                  )}

                  {previewText && (
                    <pre className="max-h-52 overflow-y-auto rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3 text-[11px] font-mono whitespace-pre-wrap text-[#1C1C1E] dark:text-[#EBEBF5] leading-relaxed">
                      {previewText.slice(0, 8000)}
                      {previewText.length > 8000 ? '\n... (үлдсэн хэсгийг Хуулах товчоор бүтнээр авна уу)' : ''}
                    </pre>
                  )}

                  {canonicalOverview && (
                    <div role="status" className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3 space-y-1.5">
                      <p className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                        Хичээлийн эх: {canonicalOverview.counts.lessons} хичээл · {canonicalOverview.counts.phrases} хэллэг · {canonicalOverview.counts.dialogues} яриа · {canonicalOverview.counts.dialogueTurns} ярианы ээлж
                      </p>
                      <p className="text-xs text-[#636366] dark:text-[#AEAEB2]">
                        {canonicalOverview.counts.exercises} дасгал, {canonicalOverview.counts.exits} гарах сорилтой. Хичээлийн горимд нээхийн тулд эхийг энэ төхөөрөмжид хадгална.
                      </p>
                      {canonicalOverview.counts.lessons === 72 && !canonicalOverview.validationErrors.length && (
                        <button type="button" className="min-h-11 rounded-xl bg-[#0064CF] px-3 text-sm text-white"
                          onClick={async () => {
                            try {
                              const installed = await installCourse(new Blob([previewText]));
                              setStatusMessage(installed.lessons.length + ' хичээл бэлэн. Нүүрээс «Ярианы хичээлүүд»-ийг нээгээрэй.');
                            } catch (e) { setDriveError(e instanceof Error ? e.message : 'Хичээл хадгалж чадсангүй.'); }
                          }}>Хичээлүүдэд нэмэх</button>
                      )}
                      {canonicalOverview.counts.transferRewritesPending > 0 && (
                        <p className="text-xs text-[#8E8E93]">{canonicalOverview.counts.transferRewritesPending} гарах сорил шинэ нөхцөлд тохируулан засах шаардлагатай.</p>
                      )}
                      {canonicalOverview.validationErrors.length > 0 && (
                        <p className="text-xs font-semibold text-[#FF3B30]">Эхийн ID/бүтцэд {canonicalOverview.validationErrors.length} зөрчил байна. Импорт хаагдсан.</p>
                      )}
                    </div>
                  )}

                  {(parsedCards.length > 0 || parsedDialogues.length > 0) && (
                    <div className="rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3 space-y-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1C1C1E] dark:text-white">
                          Олдсон материал: {parsedCards.length} карт
                          {parsedDialogues.length > 0 ? `, ${parsedDialogues.length} харилцан яриа` : ''}
                        </span>
                        <button
                          type="button"
                          onClick={() => void handleImportSelected()}
                          disabled={Boolean(canonicalOverview?.validationErrors.length)}
                          className="min-h-[32px] px-3 rounded-xl bg-[#007AFF] dark:bg-[#0A84FF] text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Сонгосныг апп руу нэмэх</span>
                        </button>
                      </div>

                      {parsedCards.length > 0 && (
                        <div className="max-h-40 overflow-y-auto divide-y divide-black/[0.05] dark:divide-white/[0.06]">
                          {parsedCards.map((card, idx) => (
                            <label
                              key={`${card.czechWord}-${idx}`}
                              className="py-1.5 flex items-start gap-2 text-xs cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedCardIndices.has(idx)}
                                onChange={(e) => {
                                  setSelectedCardIndices((prev) => {
                                    const next = new Set(prev);
                                    if (e.target.checked) next.add(idx);
                                    else next.delete(idx);
                                    return next;
                                  });
                                }}
                                className="mt-0.5 accent-[#007AFF]"
                              />
                              <span className="min-w-0">
                                <strong className="text-[#1C1C1E] dark:text-white">
                                  {card.czechWord}
                                </strong>{' '}
                                <span className="text-[#8E8E93]">— {card.mongolianWord}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {statusMessage && (
                    <p className="text-xs font-semibold text-[#248A3D] dark:text-[#30D158]">
                      {statusMessage}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
