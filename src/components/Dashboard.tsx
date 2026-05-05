import type { DashboardSummary, Question, ScoreRecord } from '../types';
import ProgressChart from './ProgressChart';

interface DashboardProps {
  dashboard: DashboardSummary;
  records: ScoreRecord[];
  questions: Question[];
  onExportScores: () => void;
  onExportQuestionSummary: () => void;
}

const metricLabels = {
  listening: 'Listening',
  responseSpeed: 'Response speed',
  practicalSafety: 'Practical safety',
  naturalness: 'Naturalness',
} as const;

export default function Dashboard({
  dashboard,
  records,
  questions,
  onExportScores,
  onExportQuestionSummary,
}: DashboardProps) {
  return (
    <section className="dashboard-layout">
      <div className="stat-grid">
        <Stat label="Today average" value={`${dashboard.todayAverage.toFixed(1)} / 8`} />
        <Stat label="Answered" value={`${dashboard.totalAnswered}`} />
        <Stat label="Practice sessions" value={`${dashboard.totalPracticeSessions}`} />
        <Stat label="Average score" value={`${dashboard.averageTotalScore.toFixed(1)} / 8`} />
        <Stat label="Current streak" value={`${dashboard.currentStreak} days`} />
        <Stat label="Last practice" value={dashboard.lastPracticeDate || '-'} />
        <Stat label="Improvement" value={`${dashboard.improvementPercentage.toFixed(1)}%`} />
        <Stat
          label="Weakest metric"
          value={dashboard.weakestMetric === 'none' ? '-' : metricLabels[dashboard.weakestMetric]}
        />
      </div>

      <section className="panel">
        <h2>Metric averages</h2>
        <ul className="metric-list">
          <li>Listening: {dashboard.metricAverages.listening.toFixed(2)} / 2</li>
          <li>Response speed: {dashboard.metricAverages.responseSpeed.toFixed(2)} / 2</li>
          <li>Practical safety: {dashboard.metricAverages.practicalSafety.toFixed(2)} / 2</li>
          <li>Naturalness: {dashboard.metricAverages.naturalness.toFixed(2)} / 2</li>
        </ul>
      </section>

      <ProgressChart title="Daily average total score" data={dashboard.dailyScores} valueKey="averageTotal" max={8} />
      <ProgressChart title="Daily Listening score" data={dashboard.dailyScores} valueKey="listening" max={2} />
      <ProgressChart title="Daily Response speed score" data={dashboard.dailyScores} valueKey="responseSpeed" max={2} />
      <ProgressChart title="Daily Practical safety score" data={dashboard.dailyScores} valueKey="practicalSafety" max={2} />
      <ProgressChart title="Daily Naturalness score" data={dashboard.dailyScores} valueKey="naturalness" max={2} />

      <section className="panel">
        <h2>Category breakdown</h2>
        {dashboard.categoryAverages.length === 0 ? (
          <p className="empty-state">No category data yet. Save a score to start tracking.</p>
        ) : (
          <div className="category-grid">
            {dashboard.categoryAverages.map((item) => (
              <div className="stat" key={item.category}>
                <span>{item.category}</span>
                <strong>{item.average.toFixed(1)} / 8</strong>
                <small>{item.count} records</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Improvement view</h2>
        <p className="empty-state">
          First 3-day average: {dashboard.firstThreeDayAverage.toFixed(1)} / 8. Latest 3-day average:{' '}
          {dashboard.latestThreeDayAverage.toFixed(1)} / 8. Question bank: {questions.length} items. Records:{' '}
          {records.length}.
        </p>
      </section>

      <div className="panel export-actions">
        <button type="button" className="secondary-button" onClick={onExportScores}>
          Export score records CSV
        </button>
        <button type="button" className="secondary-button" onClick={onExportQuestionSummary}>
          Export question summary CSV
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
