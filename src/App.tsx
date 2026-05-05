import { useEffect, useMemo, useState } from 'react';
import { questions } from './data/questions';
import Header from './components/Header';
import QuestionCard from './components/QuestionCard';
import AnswerForm from './components/AnswerForm';
import ScoreForm from './components/ScoreForm';
import Dashboard from './components/Dashboard';
import WeakQuestionList from './components/WeakQuestionList';
import SessionSummary from './components/SessionSummary';
import AudioControls from './components/AudioControls';
import {
  clearAudioSettings,
  clearDraftAnswers,
  clearProgress,
  getAudioSettings,
  getDraftAnswers,
  getReviewedQuestionIds,
  getScoreRecords,
  saveAudioSettings,
  saveDraftAnswers,
  saveReviewedQuestionIds,
  saveScoreRecord,
} from './utils/storage';
import { buildDashboard, getWeakQuestions } from './utils/scoring';
import { downloadCsv, scoreRecordsToCsv, questionSummaryToCsv } from './utils/csv';
import type {
  AnswerDraft,
  AudioSettings,
  Difficulty,
  Question,
  ScoreInput,
  ScoreRecord,
  TrainingMode,
} from './types';

type Tab = 'practice' | 'dashboard' | 'weak' | 'settings';

const allCategories = Array.from(new Set(questions.map((question) => question.category)));
const allDifficulties: Difficulty[] = ['Basic', 'Intermediate', 'Advanced'];

const emptyDraft: AnswerDraft = {
  japaneseSummary: '',
  englishAnswer: '',
  notes: '',
};

const emptyScore: ScoreInput = {
  listening: 0,
  responseSpeed: 0,
  practicalSafety: 0,
  naturalness: 0,
};

function reorderQuestions(pool: Question[], mode: TrainingMode, weakQuestions: ReturnType<typeof getWeakQuestions>) {
  if (mode === 'random') {
    return [...pool].sort(() => Math.random() - 0.5);
  }

  if (mode === 'weak') {
    const weakIds = new Set(weakQuestions.map((item) => item.question.id));
    return pool.filter((question) => weakIds.has(question.id));
  }

  return pool;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('practice');
  const [records, setRecords] = useState<ScoreRecord[]>(() => getScoreRecords());
  const [drafts, setDrafts] = useState<Record<string, AnswerDraft>>(() => getDraftAnswers());
  const [reviewedIds, setReviewedIds] = useState<string[]>(() => getReviewedQuestionIds());
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => getAudioSettings());
  const [mode, setMode] = useState<TrainingMode>(audioSettings.defaultMode ?? 'sequential');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'All'>('All');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [score, setScore] = useState<ScoreInput>(emptyScore);
  const [sessionRecordIds, setSessionRecordIds] = useState<string[]>([]);

  const dashboard = useMemo(() => buildDashboard(records, questions), [records]);
  const weakQuestions = useMemo(() => getWeakQuestions(records, questions), [records]);

  const filteredQuestions = useMemo(() => {
    const pool = questions.filter((question) => {
      const categoryMatch = categoryFilter === 'All' || question.category === categoryFilter;
      const difficultyMatch = difficultyFilter === 'All' || question.difficulty === difficultyFilter;
      return categoryMatch && difficultyMatch;
    });

    return reorderQuestions(pool, mode, weakQuestions);
  }, [categoryFilter, difficultyFilter, mode, weakQuestions]);

  const currentQuestion = filteredQuestions[currentIndex] ?? filteredQuestions[0] ?? questions[0];
  const currentDraft = drafts[currentQuestion.id] ?? emptyDraft;

  useEffect(() => {
    setCurrentIndex(0);
    setShowModelAnswer(false);
  }, [categoryFilter, difficultyFilter, mode]);

  const updateDraft = (draft: AnswerDraft) => {
    const nextDrafts = { ...drafts, [currentQuestion.id]: draft };
    setDrafts(nextDrafts);
    saveDraftAnswers(nextDrafts);
  };

  const updateAudioSettings = (nextSettings: AudioSettings) => {
    setAudioSettings(nextSettings);
    setMode(nextSettings.defaultMode ?? mode);
    saveAudioSettings(nextSettings);
  };

  const saveScore = () => {
    const totalScore = score.listening + score.responseSpeed + score.practicalSafety + score.naturalness;
    const record: ScoreRecord = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      difficulty: currentQuestion.difficulty,
      japaneseSummary: currentDraft.japaneseSummary,
      englishAnswer: currentDraft.englishAnswer,
      notes: currentDraft.notes,
      listeningScore: score.listening,
      responseSpeedScore: score.responseSpeed,
      practicalSafetyScore: score.practicalSafety,
      naturalnessScore: score.naturalness,
      totalScore,
    };
    const nextRecords = [...records, record];
    setRecords(nextRecords);
    saveScoreRecord(record);
    setSessionRecordIds([...sessionRecordIds, record.id]);
    setScore(emptyScore);
    setShowModelAnswer(false);
  };

  const toggleReviewed = () => {
    const nextReviewed = reviewedIds.includes(currentQuestion.id)
      ? reviewedIds.filter((id) => id !== currentQuestion.id)
      : [...reviewedIds, currentQuestion.id];
    setReviewedIds(nextReviewed);
    saveReviewedQuestionIds(nextReviewed);
  };

  const shuffle = () => {
    setMode('random');
    setCurrentIndex(0);
  };

  const resetSessionAnswers = () => {
    if (!confirm('Reset current answer drafts? Score records will be kept.')) {
      return;
    }
    setDrafts({});
    clearDraftAnswers();
  };

  const resetAllProgress = () => {
    if (!confirm('Reset all score records, drafts, and reviewed marks? This cannot be undone.')) {
      return;
    }
    clearProgress();
    setRecords([]);
    setDrafts({});
    setReviewedIds([]);
    setSessionRecordIds([]);
  };

  const resetAudio = () => {
    clearAudioSettings();
    setAudioSettings(getAudioSettings());
  };

  const exportScores = () => downloadCsv('dgi-dil-score-records.csv', scoreRecordsToCsv(records));
  const exportQuestionSummary = () =>
    downloadCsv('dgi-dil-question-summary.csv', questionSummaryToCsv(records, questions));

  return (
    <div className="app-shell">
      <Header activeTab={activeTab} onChangeTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'practice' && (
          <section className="practice-grid" aria-label="Practice">
            <div className="practice-main">
              <div className="toolbar panel">
                <label>
                  Mode
                  <select value={mode} onChange={(event) => setMode(event.target.value as TrainingMode)}>
                    <option value="sequential">Sequential</option>
                    <option value="random">Random</option>
                    <option value="weak">Weak review</option>
                  </select>
                </label>
                <label>
                  Category
                  <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                    <option value="All">All categories</option>
                    {allCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Difficulty
                  <select
                    value={difficultyFilter}
                    onChange={(event) => setDifficultyFilter(event.target.value as Difficulty | 'All')}
                  >
                    <option value="All">All levels</option>
                    {allDifficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>
                        {difficulty}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="secondary-button" onClick={shuffle}>
                  Shuffle
                </button>
              </div>

              <QuestionCard
                question={currentQuestion}
                currentNumber={Math.min(currentIndex + 1, filteredQuestions.length)}
                total={filteredQuestions.length}
                showModelAnswer={showModelAnswer}
                reviewed={reviewedIds.includes(currentQuestion.id)}
                onToggleModelAnswer={() => setShowModelAnswer((value) => !value)}
                onToggleReviewed={toggleReviewed}
              />

              <AudioControls question={currentQuestion} settings={audioSettings} onChangeSettings={updateAudioSettings} />

              <AnswerForm draft={currentDraft} onChange={updateDraft} />

              <ScoreForm score={score} onChange={setScore} onSave={saveScore} />

              <div className="navigation-row">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={currentIndex <= 0}
                  onClick={() => {
                    setCurrentIndex((index) => Math.max(0, index - 1));
                    setShowModelAnswer(false);
                  }}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="primary-button"
                  disabled={currentIndex >= filteredQuestions.length - 1}
                  onClick={() => {
                    setCurrentIndex((index) => Math.min(filteredQuestions.length - 1, index + 1));
                    setShowModelAnswer(false);
                  }}
                >
                  Next
                </button>
              </div>
            </div>

            <aside className="practice-side">
              <SessionSummary
                records={records.filter((record) => sessionRecordIds.includes(record.id))}
                currentStreak={dashboard.currentStreak}
                lastPracticeDate={dashboard.lastPracticeDate}
              />
              <WeakQuestionList weakQuestions={weakQuestions.slice(0, 5)} compact />
            </aside>
          </section>
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            dashboard={dashboard}
            records={records}
            questions={questions}
            onExportScores={exportScores}
            onExportQuestionSummary={exportQuestionSummary}
          />
        )}

        {activeTab === 'weak' && <WeakQuestionList weakQuestions={weakQuestions} />}

        {activeTab === 'settings' && (
          <section className="settings-layout">
            <AudioControls question={currentQuestion} settings={audioSettings} onChangeSettings={updateAudioSettings} settingsOnly />
            <div className="panel settings-panel">
              <h2>Data controls</h2>
              <button type="button" className="secondary-button" onClick={exportScores}>
                Export score records CSV
              </button>
              <button type="button" className="secondary-button" onClick={exportQuestionSummary}>
                Export question summary CSV
              </button>
              <button type="button" className="secondary-button" onClick={resetSessionAnswers}>
                Reset current session answers
              </button>
              <button type="button" className="secondary-button" onClick={resetAudio}>
                Reset audio settings
              </button>
              <button type="button" className="danger-button" onClick={resetAllProgress}>
                Reset all progress
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
