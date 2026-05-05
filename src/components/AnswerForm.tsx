import type { AnswerDraft } from '../types';

interface AnswerFormProps {
  draft: AnswerDraft;
  onChange: (draft: AnswerDraft) => void;
}

export default function AnswerForm({ draft, onChange }: AnswerFormProps) {
  return (
    <section className="panel">
      <h2>Your answer</h2>
      <div className="form-grid">
        <label>
          Japanese summary of the question
          <textarea
            lang="ja"
            value={draft.japaneseSummary}
            onChange={(event) => onChange({ ...draft, japaneseSummary: event.target.value })}
          />
        </label>
        <label>
          English answer
          <textarea value={draft.englishAnswer} onChange={(event) => onChange({ ...draft, englishAnswer: event.target.value })} />
        </label>
        <label>
          Notes
          <textarea value={draft.notes} onChange={(event) => onChange({ ...draft, notes: event.target.value })} />
        </label>
      </div>
    </section>
  );
}
