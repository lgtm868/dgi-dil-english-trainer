import type { AnswerDraft, AudioSettings, ScoreRecord } from '../types';

const KEY_PREFIX = 'dgi-dil-english-trainer';
const SCORE_KEY = `${KEY_PREFIX}:score-records`;
const DRAFT_KEY = `${KEY_PREFIX}:draft-answers`;
const REVIEWED_KEY = `${KEY_PREFIX}:reviewed-question-ids`;
const AUDIO_KEY = `${KEY_PREFIX}:audio-settings`;

export const defaultAudioSettings: AudioSettings = {
  voiceURI: '',
  rate: 0.95,
  pitch: 1,
  volume: 1,
  repeatCount: 1,
  listeningMode: 'meeting',
  defaultMode: 'sequential',
};

function canUseLocalStorage() {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can fail in private browsing or when quota is exceeded.
  }
}

function removeKey(key: string) {
  try {
    if (!canUseLocalStorage()) {
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage removal failures so reset controls remain non-fatal.
  }
}

export function getScoreRecords(): ScoreRecord[] {
  const records = readJson<ScoreRecord[]>(SCORE_KEY, []);
  return Array.isArray(records) ? records : [];
}

export function saveScoreRecords(records: ScoreRecord[]) {
  writeJson(SCORE_KEY, records);
}

export function saveScoreRecord(record: ScoreRecord) {
  saveScoreRecords([...getScoreRecords(), record]);
}

export function getDraftAnswers(): Record<string, AnswerDraft> {
  const drafts = readJson<Record<string, AnswerDraft>>(DRAFT_KEY, {});
  return drafts && typeof drafts === 'object' ? drafts : {};
}

export function saveDraftAnswers(drafts: Record<string, AnswerDraft>) {
  writeJson(DRAFT_KEY, drafts);
}

export function clearDraftAnswers() {
  removeKey(DRAFT_KEY);
}

export function getReviewedQuestionIds(): string[] {
  const ids = readJson<string[]>(REVIEWED_KEY, []);
  return Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
}

export function saveReviewedQuestionIds(ids: string[]) {
  writeJson(REVIEWED_KEY, ids);
}

export function getAudioSettings(): AudioSettings {
  const saved = readJson<Partial<AudioSettings>>(AUDIO_KEY, defaultAudioSettings);
  return {
    voiceURI: typeof saved.voiceURI === 'string' ? saved.voiceURI : defaultAudioSettings.voiceURI,
    rate: clamp(saved.rate, 0.5, 1.5, defaultAudioSettings.rate),
    pitch: clamp(saved.pitch, 0.5, 1.5, defaultAudioSettings.pitch),
    volume: clamp(saved.volume, 0, 1, defaultAudioSettings.volume),
    repeatCount: Math.round(clamp(saved.repeatCount, 1, 5, defaultAudioSettings.repeatCount)),
    listeningMode: saved.listeningMode ?? defaultAudioSettings.listeningMode,
    defaultMode: saved.defaultMode ?? defaultAudioSettings.defaultMode,
  };
}

export function saveAudioSettings(settings: AudioSettings) {
  writeJson(AUDIO_KEY, settings);
}

export function clearAudioSettings() {
  removeKey(AUDIO_KEY);
}

export function clearProgress() {
  removeKey(SCORE_KEY);
  removeKey(DRAFT_KEY);
  removeKey(REVIEWED_KEY);
}

function clamp(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
