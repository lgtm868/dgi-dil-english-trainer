import type { ScoreRecord } from '../types';
import { average, buildMetricAverages } from '../utils/scoring';

interface SessionSummaryProps {
  records: ScoreRecord[];
  currentStreak: number;
  lastPracticeDate: string;
}

export default function SessionSummary({ records, currentStreak, lastPracticeDate }: SessionSummaryProps) {
  const metrics = buildMetricAverages(records);
  const totalAverage = average(records.map((record) => record.totalScore));

  return (
    <section className="panel session-summary">
      <h2>Current session</h2>
      <strong>{records.length}</strong>
      <p className="weak-meta">saved answers</p>
      <ul className="metric-list">
        <li>Average total: {totalAverage.toFixed(1)} / 8</li>
        <li>Listening: {metrics.listening.toFixed(1)} / 2</li>
        <li>Speed: {metrics.responseSpeed.toFixed(1)} / 2</li>
        <li>Safety: {metrics.practicalSafety.toFixed(1)} / 2</li>
        <li>Naturalness: {metrics.naturalness.toFixed(1)} / 2</li>
        <li>Streak: {currentStreak} days</li>
        <li>Last practice: {lastPracticeDate || '-'}</li>
      </ul>
    </section>
  );
}
