import { useEffect, useMemo, useRef, useState } from 'react';
import type { AudioSettings, ListeningMode, Question, TrainingMode } from '../types';
import {
  describeVoiceQuality,
  getVoiceNaturalnessScore,
  hasBritishVoice,
  hasNaturalBritishVoice,
  loadVoices,
  modeDefaults,
  selectBestUkVoice,
  selectVoice,
  speakText,
  stopSpeech,
} from '../utils/audio';

interface AudioControlsProps {
  question: Question;
  settings: AudioSettings;
  onChangeSettings: (settings: AudioSettings) => void;
  settingsOnly?: boolean;
}

const listeningModes: ListeningMode[] = ['clear', 'meeting', 'stress', 'dictation'];
const trainingModes: TrainingMode[] = ['sequential', 'random', 'weak'];

export default function AudioControls({ question, settings, onChangeSettings, settingsOnly = false }: AudioControlsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [mp3Failed, setMp3Failed] = useState(false);
  const [status, setStatus] = useState('');
  const bestUkVoice = useMemo(() => selectBestUkVoice(voices), [voices]);
  const selectedVoice = useMemo(() => selectVoice(voices, settings.voiceURI), [settings.voiceURI, voices]);
  const sortedVoices = useMemo(
    () => [...voices].sort((a, b) => getVoiceNaturalnessScore(b) - getVoiceNaturalnessScore(a)),
    [voices],
  );
  const audioSrc = useMemo(() => buildPublicAssetUrl(question.audioPath), [question.audioPath]);

  useEffect(() => {
    void loadVoices().then(setVoices);
  }, []);

  useEffect(() => {
    setMp3Failed(false);
    setStatus('');
  }, [question.id]);

  const updateSetting = <K extends keyof AudioSettings>(key: K, value: AudioSettings[K]) => {
    onChangeSettings({ ...settings, [key]: value });
  };

  const applyMode = (mode: ListeningMode) => {
    const defaults = modeDefaults(mode);
    onChangeSettings({ ...settings, listeningMode: mode, ...defaults });
  };

  const useBestUkVoice = () => {
    if (bestUkVoice) {
      onChangeSettings({
        ...settings,
        voiceURI: bestUkVoice.voiceURI,
        listeningMode: 'meeting',
        ...modeDefaults('meeting'),
      });
      setStatus(describeVoiceQuality(bestUkVoice));
      return;
    }

    setStatus('No UK English voice is available in this browser. Install or enable a UK English voice, or add MP3 files.');
  };

  const play = async () => {
    setStatus('');
    if (!mp3Failed && audioRef.current) {
      try {
        audioRef.current.currentTime = 0;
        audioRef.current.volume = settings.volume;
        audioRef.current.playbackRate = settings.rate;
        await audioRef.current.play();
        return;
      } catch {
        setMp3Failed(true);
      }
    }

    const spoken = await speakText(question.question, settings, voices);
    setStatus(spoken ? describeVoiceQuality(selectedVoice) : 'Speech synthesis is not available in this browser.');
  };

  return (
    <section className="panel">
      <div className="question-topline">
        <h2>{settingsOnly ? 'Audio settings' : 'Audio practice'}</h2>
        {!hasBritishVoice(voices) && voices.length > 0 && <span className="warning-text">No en-GB voice detected</span>}
        {hasBritishVoice(voices) && !hasNaturalBritishVoice(voices) && (
          <span className="warning-text">UK voice found, but not a natural/neural voice</span>
        )}
      </div>

      {!settingsOnly && !mp3Failed && (
        <audio ref={audioRef} src={audioSrc} preload="none" onError={() => setMp3Failed(true)} />
      )}

      {!settingsOnly && (
        <div className="audio-buttons">
          <button type="button" className="primary-button" onClick={play}>
            Play question
          </button>
          <button type="button" className="secondary-button" onClick={stopSpeech}>
            Stop
          </button>
          <span className="weak-meta">{mp3Failed ? 'MP3 unavailable; browser TTS fallback is ready.' : audioSrc}</span>
        </div>
      )}

      <div className="audio-grid">
        <label className="voice-select">
          Voice
          <select value={settings.voiceURI} onChange={(event) => updateSetting('voiceURI', event.target.value)}>
            <option value="">Auto-select best UK English voice</option>
            {sortedVoices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}){voice.voiceURI === bestUkVoice?.voiceURI ? ' - best UK' : ''}
              </option>
            ))}
          </select>
        </label>
        <label>
          UK voice helper
          <button type="button" className="secondary-button" onClick={useBestUkVoice} disabled={!bestUkVoice}>
            Use best UK voice
          </button>
        </label>
        <label>
          Listening mode
          <select value={settings.listeningMode} onChange={(event) => applyMode(event.target.value as ListeningMode)}>
            {listeningModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
        <label>
          Rate {settings.rate.toFixed(2)}
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={settings.rate}
            onChange={(event) => updateSetting('rate', Number(event.target.value))}
          />
        </label>
        <label>
          Pitch {settings.pitch.toFixed(2)}
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.05"
            value={settings.pitch}
            onChange={(event) => updateSetting('pitch', Number(event.target.value))}
          />
        </label>
        <label>
          Volume {Math.round(settings.volume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={(event) => updateSetting('volume', Number(event.target.value))}
          />
        </label>
        <label>
          Repeat
          <select value={settings.repeatCount} onChange={(event) => updateSetting('repeatCount', Number(event.target.value))}>
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {count}
              </option>
            ))}
          </select>
        </label>
        <label>
          Default practice mode
          <select value={settings.defaultMode} onChange={(event) => updateSetting('defaultMode', event.target.value as TrainingMode)}>
            {trainingModes.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>
      </div>

      {voices.length === 0 && <p className="warning-text">No browser voices are currently available.</p>}
      {voices.length > 0 && bestUkVoice && (
        <p className="weak-meta">
          {describeVoiceQuality(selectedVoice)} Best UK match: {bestUkVoice.name} ({bestUkVoice.lang}).
        </p>
      )}
      {status && <p className="weak-meta">{status}</p>}
    </section>
  );
}

function buildPublicAssetUrl(path: string) {
  const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${base}${path.replace(/^\/+/, '')}`;
}
