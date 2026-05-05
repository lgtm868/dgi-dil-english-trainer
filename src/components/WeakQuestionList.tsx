import type { WeakQuestion } from '../types';

interface WeakQuestionListProps {
  weakQuestions: WeakQuestion[];
  compact?: boolean;
}

const metricLabels = {
  listening: 'Listening',
  responseSpeed: 'Response speed',
  practicalSafety: 'Practical safety',
  naturalness: 'Naturalness',
} as const;

export default function WeakQuestionList({ weakQuestions, compact = false }: WeakQuestionListProps) {
  return (
    <section className="panel">
      <h2>Weak questions</h2>
      {weakQuestions.length === 0 ? (
        <p className="empty-state">No weak questions yet. Questions appear here after low scores are saved.</p>
      ) : (
        <ul className="weak-list">
          {weakQuestions.map((item) => (
            <li className="weak-item" key={item.question.id}>
              <strong>
                {item.question.id.toUpperCase()}: {item.question.question}
              </strong>
              <span className="weak-meta">
                Average: {item.averageTotal.toFixed(1)} / 8. Weakest metric: {metricLabels[item.weakestMetric]}.
              </span>
              {!compact && <span className="weak-meta">Reason: {item.reason}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
