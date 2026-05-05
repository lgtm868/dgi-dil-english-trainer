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
  rate: 1,
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

export function selectVoice(voices: SpeechSynthesisVoice[], voiceURI: string) {
  return (
    voices.find((voice) => voice.voiceURI === voiceURI) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en-gb')) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en')) ??
    voices[0]
  );
}

export const selectEnglishVoice = selectVoice;
export const getPreferredEnglishVoice = selectVoice;

export function modeDefaults(mode: ListeningMode) {
  switch (mode) {
    case 'clear':
      return { rate: 0.82, pitch: 1, repeatCount: 1 };
    case 'meeting':
      return { rate: 1, pitch: 1, repeatCount: 1 };
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
    await speakOnce(text, settings, voice);
  }
  return true;
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
