import type { Question } from '../types';

interface QuestionCardProps {
  question: Question;
  currentNumber: number;
  total: number;
  showModelAnswer: boolean;
  reviewed: boolean;
  onToggleModelAnswer: () => void;
  onToggleReviewed: () => void;
}

export default function QuestionCard({
  question,
  currentNumber,
  total,
  showModelAnswer,
  reviewed,
  onToggleModelAnswer,
  onToggleReviewed,
}: QuestionCardProps) {
  return (
    <article className="question-card">
      <div className="question-topline">
        <span>
          Question {currentNumber} / {total || 0}
        </span>
        <button type="button" className="secondary-button" onClick={onToggleReviewed}>
          {reviewed ? 'Reviewed' : 'Mark reviewed'}
        </button>
      </div>

      <div className="meta-row">
        <span className="chip">{question.category}</span>
        <span className="chip">{question.difficulty}</span>
      </div>

      <h2 className="question-text">{question.question}</h2>
      <p className="japanese-meaning" lang="ja">
        {question.japaneseMeaning}
      </p>

      <div className="model-header">
        <button type="button" className="primary-button" onClick={onToggleModelAnswer}>
          {showModelAnswer ? 'Hide model answer' : 'Show model answer'}
        </button>
      </div>

      {showModelAnswer && (
        <section className="model-answer">
          <h3>Model answer</h3>
          <p>{question.modelAnswer}</p>
        </section>
      )}

      <section className="key-phrases">
        <h3>Key phrases</h3>
        <ul>
          {question.keyPhrases.map((phrase) => (
            <li key={phrase}>{phrase}</li>
          ))}
        </ul>
      </section>

      <section className="caution">
        <h3>Practical caution</h3>
        <p>{question.practicalCaution}</p>
      </section>
    </article>
  );
}
