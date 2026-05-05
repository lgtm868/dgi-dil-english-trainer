import type { Question, WeakQuestion } from '../types';

export type TrainerQuestion = Question;
export type { WeakQuestion };

export type ProgressDatum = {
  label: string;
  value: number;
  date?: string;
};

export type SessionStats = {
  answeredQuestions: number;
  averageScore: number;
};
