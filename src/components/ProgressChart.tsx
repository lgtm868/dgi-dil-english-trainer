import type { DailyScore } from '../types';

interface ProgressChartProps {
  title: string;
  data: DailyScore[];
  valueKey: keyof Pick<DailyScore, 'averageTotal' | 'listening' | 'responseSpeed' | 'practicalSafety' | 'naturalness'>;
  max: number;
}

export default function ProgressChart({ title, data, valueKey, max }: ProgressChartProps) {
  const width = 640;
  const height = 190;
  const pad = 28;
  const points = data.map((day, index) => {
    const x = data.length <= 1 ? pad : pad + (index / (data.length - 1)) * (width - pad * 2);
    const y = height - pad - (Number(day[valueKey]) / max) * (height - pad * 2);
    return { x, y, label: day.date, value: Number(day[valueKey]) };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <section className="panel chart-panel">
      <h2>{title}</h2>
      {data.length === 0 ? (
        <p className="empty-state">No score records yet.</p>
      ) : (
        <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
          <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="currentColor" opacity="0.25" />
          <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="currentColor" opacity="0.25" />
          <polyline fill="none" stroke="var(--accent)" strokeWidth="3" points={line} />
          {points.map((point) => (
            <g key={`${point.label}-${point.x}`}>
              <circle cx={point.x} cy={point.y} r="4" fill="var(--accent)" />
              <text x={point.x} y={height - 8} textAnchor="middle">
                {point.label.slice(5)}
              </text>
            </g>
          ))}
        </svg>
      )}
    </section>
  );
}
