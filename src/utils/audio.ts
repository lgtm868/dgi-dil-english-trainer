import type { AudioSettings, ListeningMode } from '../types';

export type SpeechOptions = Partial<AudioSettings> & {
  lang?: string;
};

export type SpeakResult = {
  supported: boolean;
  spoken: boolean;
  voice?: SpeechSynthesisVoice;
};

const fallbackSettings: AudioSettings = {
  voiceURI: '',
  rate: 0.95,
  pitch: 1,
  volume: 1,
  repeatCount: 1,
  listeningMode: 'meeting',
  defaultMode: 'sequential',
};

export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function getAvailableVoices() {
  return isSpeechSupported() ? window.speechSynthesis.getVoices() : [];
}

export function loadVoices(timeoutMs = 1200): Promise<SpeechSynthesisVoice[]> {
  if (!isSpeechSupported()) {
    return Promise.resolve([]);
  }

  const current = getAvailableVoices();
  if (current.length > 0) {
    return Promise.resolve(current);
  }

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(getAvailableVoices());
    }, timeoutMs);

    function onChange() {
      window.clearTimeout(timer);
      window.speechSynthesis.removeEventListener('voiceschanged', onChange);
      resolve(getAvailableVoices());
    }

    window.speechSynthesis.addEventListener('voiceschanged', onChange);
  });
}

export function hasBritishVoice(voices: SpeechSynthesisVoice[]) {
  return voices.some((voice) => voice.lang.toLowerCase().startsWith('en-gb'));
}

export function hasNaturalBritishVoice(voices: SpeechSynthesisVoice[]) {
  return voices.some((voice) => voice.lang.toLowerCase().startsWith('en-gb') && getVoiceNaturalnessScore(voice) >= 1200);
}

export function getVoiceNaturalnessScore(voice: SpeechSynthesisVoice) {
  const lang = voice.lang.toLowerCase();
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  let score = 0;

  if (lang === 'en-gb') score += 1000;
  else if (lang.startsWith('en-gb')) score += 900;
  else if (lang.startsWith('en')) score += 250;

  if (voice.default) score += 20;
  if (!voice.localService) score += 80;

  if (/\b(neural|natural|online|premium|enhanced|cloud)\b/.test(name)) score += 220;
  if (/\b(microsoft|google|apple|siri)\b/.test(name)) score += 80;
  if (/\b(sonia|libby|george|ryan|abbi|maisie|arthur|martha|daniel|kate|serena)\b/.test(name)) score += 90;
  if (/\b(female|male)\b/.test(name)) score += 15;

  if (/\b(compact|legacy|classic|standard|basic|default|espeak|festival|flite)\b/.test(name)) score -= 180;
  if (/\b(us|america|american|australia|australian|india|indian|ireland|irish|south africa)\b/.test(name)) score -= 140;

  return score;
}

export function selectBestUkVoice(voices: SpeechSynthesisVoice[]) {
  return [...voices]
    .filter((voice) => voice.lang.toLowerCase().startsWith('en-gb'))
    .sort((a, b) => getVoiceNaturalnessScore(b) - getVoiceNaturalnessScore(a))[0];
}

export function selectVoice(voices: SpeechSynthesisVoice[], voiceURI: string) {
  return (
    voices.find((voice) => voice.voiceURI === voiceURI) ??
    selectBestUkVoice(voices) ??
    [...voices]
      .filter((voice) => voice.lang.toLowerCase().startsWith('en'))
      .sort((a, b) => getVoiceNaturalnessScore(b) - getVoiceNaturalnessScore(a))[0] ??
    voices[0]
  );
}

export const selectEnglishVoice = selectVoice;
export const getPreferredEnglishVoice = selectVoice;
export const getBestUkEnglishVoice = selectBestUkVoice;

export function sortVoicesByPreference(voices: SpeechSynthesisVoice[]) {
  return [...voices].sort((a, b) => getVoiceNaturalnessScore(b) - getVoiceNaturalnessScore(a));
}

export function describeVoiceQuality(voice?: SpeechSynthesisVoice) {
  if (!voice) {
    return 'No English browser voice is available.';
  }

  const isUk = voice.lang.toLowerCase().startsWith('en-gb');
  const score = getVoiceNaturalnessScore(voice);
  if (isUk && score >= 1200) {
    return `Using the most natural UK voice available: ${voice.name}.`;
  }
  if (isUk) {
    return `Using UK English voice: ${voice.name}.`;
  }
  return `No UK voice is available, so using English fallback: ${voice.name}.`;
}

export function modeDefaults(mode: ListeningMode) {
  switch (mode) {
    case 'clear':
      return { rate: 0.82, pitch: 1, repeatCount: 1 };
    case 'meeting':
      return { rate: 0.95, pitch: 1, repeatCount: 1 };
    case 'stress':
      return { rate: 1.18, pitch: 1, repeatCount: 1 };
    case 'dictation':
      return { rate: 0.72, pitch: 1, repeatCount: 1 };
  }
}

export function stopSpeech() {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

export const stopSpeaking = stopSpeech;

export async function speak(text: string, options: SpeechOptions = {}): Promise<SpeakResult> {
  if (!isSpeechSupported() || text.trim().length === 0) {
    return { supported: isSpeechSupported(), spoken: false };
  }

  const voices = await loadVoices();
  const settings = normalizeSpeechOptions(options);
  const voice = selectVoice(voices, settings.voiceURI);

  stopSpeech();
  await speakText(text, settings, voices);

  return {
    supported: true,
    spoken: true,
    voice,
  };
}

export async function speakText(text: string, settings: AudioSettings, voices: SpeechSynthesisVoice[]) {
  if (!isSpeechSupported()) {
    return false;
  }

  stopSpeech();
  const voice = selectVoice(voices, settings.voiceURI);
  const repeat = Math.max(1, Math.round(settings.repeatCount));

  for (let index = 0; index < repeat; index += 1) {
    await speakOnce(prepareSpeechText(text), settings, voice);
  }
  return true;
}

export function prepareSpeechText(text: string) {
  return text
    .replace(/\bDGI\b/g, 'D G I')
    .replace(/\bDIL\b/g, 'D I L')
    .replace(/\bHMRC\b/g, 'H M R C')
    .replace(/\bUK\b/g, 'U K')
    .replace(/\bDCF\b/g, 'D C F')
    .replace(/\bMP3\b/g, 'M P 3')
    .replace(/tax\/valuation/gi, 'tax and valuation')
    .replace(/\//g, ' and ');
}

function normalizeSpeechOptions(options: SpeechOptions): AudioSettings {
  const mode = options.listeningMode ?? fallbackSettings.listeningMode;
  const defaults = modeDefaults(mode);

  return {
    voiceURI: options.voiceURI ?? fallbackSettings.voiceURI,
    rate: clamp(options.rate ?? defaults.rate, 0.5, 1.5),
    pitch: clamp(options.pitch ?? defaults.pitch, 0.5, 1.5),
    volume: clamp(options.volume ?? fallbackSettings.volume, 0, 1),
    repeatCount: Math.round(clamp(options.repeatCount ?? defaults.repeatCount, 1, 5)),
    listeningMode: mode,
    defaultMode: options.defaultMode ?? fallbackSettings.defaultMode,
  };
}

function clamp(value: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}

function speakOnce(text: string, settings: AudioSettings, voice?: SpeechSynthesisVoice) {
  return new Promise<void>((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = voice?.lang ?? 'en-GB';
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
