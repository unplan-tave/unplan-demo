import { useEffect, useRef, useState } from 'react';
import type { InvalidContextResult, ParseResult } from '@unplan-tave/parser';
import { draftAction } from './draft-policy';
import type { Draft } from './draft-policy';

function DraftEditor({
  initial,
  onClose,
}: {
  initial: Draft;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <section
      className="draft-editor"
      aria-label="일정 초안"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <h3>일정 초안</h3>
      <p className="panel-note">
        편집 중인 초안입니다. 실제 일정은 저장하지 않습니다.
      </p>
      {initial.unfinishedTime && (
        <p className="draft-warning">
          입력 중인 시간: {initial.unfinishedTime} · 확정되지 않은 시간은 비워
          두었습니다.
        </p>
      )}
      <label htmlFor="draft-title">초안 제목</label>
      <input
        ref={titleRef}
        id="draft-title"
        value={draft.title}
        placeholder="제목을 입력해 주세요"
        onChange={(event) => setDraft({ ...draft, title: event.target.value })}
      />
      <label htmlFor="draft-date">초안 날짜</label>
      <input
        id="draft-date"
        type="date"
        value={draft.date}
        onChange={(event) => setDraft({ ...draft, date: event.target.value })}
      />
      <label htmlFor="draft-time">초안 시간 (선택)</label>
      <input
        id="draft-time"
        type="time"
        value={draft.time}
        onChange={(event) => setDraft({ ...draft, time: event.target.value })}
      />
      <p className="panel-note">
        시간이 비어 있으면 자정·종일 여부도 미정입니다. 원문 입력을 바꿔도 열린
        초안은 유지됩니다.
      </p>
      <button type="button" className="example" onClick={onClose}>
        초안 닫기 · Esc
      </button>
    </section>
  );
}

export function DraftAction({
  result,
}: {
  result: ParseResult | InvalidContextResult;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  useEffect(() => {
    if (!draft && returnFocus.current) {
      addRef.current?.focus();
      returnFocus.current = false;
    }
  }, [draft]);
  const action = draftAction(result);
  return (
    <section className="action-panel" aria-labelledby="action-title">
      <div className="section-heading">
        <h2 id="action-title">
          <span className="section-number">03</span> 제안 액션
        </h2>
      </div>
      <div className="action-placeholder">
        <span className="draft-icon" aria-hidden="true">
          ＋
        </span>
        <p className="action-title">
          {action.draft
            ? '편집 가능한 초안을 열어 보세요'
            : '일정 초안을 기다리고 있어요'}
        </p>
        <p>날짜·확정된 시간·제목 후보를 전달합니다.</p>
      </div>
      <button
        ref={addRef}
        type="button"
        className="add-button"
        disabled={!action.draft || !!draft}
        aria-describedby="action-help"
        onClick={() => setDraft(action.draft)}
      >
        할 일 추가 <span aria-hidden="true">↗</span>
      </button>
      <p id="action-help" className="panel-note">
        {draft
          ? '열린 초안을 편집하거나 닫은 뒤 새 초안을 열 수 있어요.'
          : action.message}
      </p>
      {draft && (
        <DraftEditor
          initial={draft}
          onClose={() => {
            returnFocus.current = true;
            setDraft(null);
          }}
        />
      )}
    </section>
  );
}
