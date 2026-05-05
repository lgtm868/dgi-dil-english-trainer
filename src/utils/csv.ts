import type { Question, ScoreRecord } from '../types';
import { average, buildMetricAverages } from './scoring';

type CsvValue = string | number | undefined;

function escapeCell(value: CsvValue) {
  if (value === undefined) {
    return '';
  }
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function rowsToCsv(headers: string[], rows: CsvValue[][]) {
  return [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\r\n');
}

export function scoreRecordsToCsv(records: ScoreRecord[]) {
  return rowsToCsv(
    [
      'timestamp',
      'question id',
      'category',
      'difficulty',
      'Japanese summary',
      'English answer',
      'listening score',
      'response speed score',
      'practical safety score',
      'naturalness score',
      'total score',
      'notes',
    ],
    records.map((record) => [
      record.timestamp,
      record.questionId,
      record.category,
      record.difficulty,
      record.japaneseSummary,
      record.englishAnswer,
      record.listeningScore,
      record.responseSpeedScore,
      record.practicalSafetyScore,
      record.naturalnessScore,
      record.totalScore,
      record.notes,
    ]),
  );
}

export function questionSummaryToCsv(records: ScoreRecord[], questions: Question[]) {
  return rowsToCsv(
    [
      'question id',
      'category',
      'difficulty',
      'question',
      'attempts',
      'average total',
      'average listening',
      'average response speed',
      'average practical safety',
      'average naturalness',
      'last practiced',
    ],
    questions.map((question) => {
      const questionRecords = records.filter((record) => record.questionId === question.id);
      const metrics = buildMetricAverages(questionRecords);
      return [
        question.id,
        question.category,
        question.difficulty,
        question.question,
        questionRecords.length,
        average(questionRecords.map((record) => record.totalScore)).toFixed(2),
        metrics.listening.toFixed(2),
        metrics.responseSpeed.toFixed(2),
        metrics.practicalSafety.toFixed(2),
        metrics.naturalness.toFixed(2),
        questionRecords.map((record) => record.timestamp).sort().at(-1),
      ];
    }),
  );
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
