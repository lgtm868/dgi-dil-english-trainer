import type { MetricKey, ScoreInput } from '../types';

interface ScoreFormProps {
  score: ScoreInput;
  onChange: (score: ScoreInput) => void;
  onSave: () => void;
}

const metrics: {
  key: MetricKey;
  label: string;
  rubric: string[];
}[] = [
  {
    key: 'listening',
    label: 'Listening comprehension',
    rubric: ['0: Could not understand', '1: Partly understood', '2: Understood accurately'],
  },
  {
    key: 'responseSpeed',
    label: 'Response speed',
    rubric: ['0: Over 20 seconds', '1: Started within 10-20 seconds', '2: Started within 10 seconds'],
  },
  {
    key: 'practicalSafety',
    label: 'Practical safety',
    rubric: ['0: Risky or overstated', '1: Broadly safe', '2: Clear purpose, scope, limits, tax input'],
  },
  {
    key: 'naturalness',
    label: 'Naturalness',
    rubric: ['0: Unnatural', '1: Understandable', '2: Natural business English'],
  },
];

export default function ScoreForm({ score, onChange, onSave }: ScoreFormProps) {
  const total = score.listening + score.responseSpeed + score.practicalSafety + score.naturalness;

  return (
    <section className="panel">
      <div className="question-topline">
        <h2>Self-score</h2>
        <strong>{total} / 8</strong>
      </div>
      <div className="score-grid">
        {metrics.map((metric) => (
          <div className="score-metric" key={metric.key}>
            <strong>{metric.label}</strong>
            <div className="score-options" role="group" aria-label={metric.label}>
              {[0, 1, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={score[metric.key] === value ? 'selected' : ''}
                  onClick={() => onChange({ ...score, [metric.key]: value } as ScoreInput)}
                >
                  {value}
                </button>
              ))}
            </div>
            <p className="rubric">{metric.rubric.join(' / ')}</p>
          </div>
        ))}
      </div>
      <div className="score-actions">
        <button type="button" className="primary-button" onClick={onSave}>
          Save score
        </button>
      </div>
    </section>
  );
}
