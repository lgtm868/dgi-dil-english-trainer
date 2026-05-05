export type Difficulty = 'Basic' | 'Intermediate' | 'Advanced';

export type TrainingMode = 'sequential' | 'random' | 'weak';

export type ListeningMode = 'clear' | 'meeting' | 'stress' | 'dictation';

export type MetricKey = 'listening' | 'responseSpeed' | 'practicalSafety' | 'naturalness';

export interface Question {
  id: string;
  category: string;
  difficulty: Difficulty;
  question: string;
  japaneseMeaning: string;
  modelAnswer: string;
  keyPhrases: string[];
  practicalCaution: string;
  audioPath: string;
}

export interface AnswerDraft {
  japaneseSummary: string;
  englishAnswer: string;
  notes: string;
}

export interface ScoreInput {
  listening: 0 | 1 | 2;
  responseSpeed: 0 | 1 | 2;
  practicalSafety: 0 | 1 | 2;
  naturalness: 0 | 1 | 2;
}

export interface ScoreRecord {
  id: string;
  timestamp: string;
  questionId: string;
  category: string;
  difficulty: Difficulty;
  japaneseSummary: string;
  englishAnswer: string;
  notes: string;
  listeningScore: number;
  responseSpeedScore: number;
  practicalSafetyScore: number;
  naturalnessScore: number;
  totalScore: number;
}

export interface AudioSettings {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
  repeatCount: number;
  listeningMode: ListeningMode;
  defaultMode: TrainingMode;
}

export interface DailyScore {
  date: string;
  averageTotal: number;
  listening: number;
  responseSpeed: number;
  practicalSafety: number;
  naturalness: number;
  count: number;
}

export interface CategoryAverage {
  category: string;
  average: number;
  count: number;
}

export interface MetricAverages {
  listening: number;
  responseSpeed: number;
  practicalSafety: number;
  naturalness: number;
}

export interface DashboardSummary {
  todayAverage: number;
  totalAnswered: number;
  totalPracticeSessions: number;
  averageTotalScore: number;
  metricAverages: MetricAverages;
  categoryAverages: CategoryAverage[];
  dailyScores: DailyScore[];
  sevenDayMovingAverage: DailyScore[];
  firstThreeDayAverage: number;
  latestThreeDayAverage: number;
  improvementPercentage: number;
  weakestMetric: MetricKey | 'none';
  currentStreak: number;
  lastPracticeDate: string;
}

export interface WeakQuestion {
  question: Question;
  averageTotal: number;
  metricAverages: MetricAverages;
  weakestMetric: MetricKey;
  lastPracticed: string;
  reason: string;
}
