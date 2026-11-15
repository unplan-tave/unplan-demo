import { useEffect, useRef, useState } from 'react';
import type { ParseContext } from '@unplan-tave/parser';
export interface Draft {
  messageId: number;
  optionId: string;
  original: string;
  context: ParseContext;
  title: string;
  date: string;
  time: string;
  qualification: 'none' | 'unqualified' | 'approximate';
  unfinishedTime: string;
}

export function DraftEditor({
  initial,
  onClose,
}: {
  initial: Draft;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const composing = useRef(false);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    titleRef.current?.focus();
  }, []);
  return (
    <section
      className="draft-editor"
      aria-label="일정 초안"
      onCompositionStart={() => {
        composing.current = true;
      }}
      onCompositionEnd={() => {
        composing.current = false;
      }}
      onKeyDown={(event) => {
        if (
          event.key === 'Escape' &&
          !composing.current &&
          !event.nativeEvent.isComposing &&
          event.nativeEvent.keyCode !== 229
        )
          onClose();
      }}
    >
      <h3>일정 초안</h3>
      <p className="panel-note">
        편집 중인 초안입니다. 실제 일정은 저장하지 않습니다.
      </p>
      <p className="panel-note">
        메시지 {initial.messageId} · {initial.original}
      </p>
      {initial.qualification === 'approximate' && (
        <p className="draft-warning">
          근사 시각입니다. 아래 시간은 기준값이며 정확한 시작 시각이나 ±범위를
          뜻하지 않습니다.
        </p>
      )}
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
        시간이 비어 있으면 자정·종일 여부도 미정입니다. 다른 메시지를 보내도 이
        초안은 유지됩니다.
      </p>
      <button type="button" className="example" onClick={onClose}>
        초안 닫기 · Esc
      </button>
    </section>
  );
}
