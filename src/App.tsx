import { useLayoutEffect, useRef, useState } from 'react';
import { PARSER_INFO, parseSchedule } from '@unplan-tave/parser';
import type {
  ParseContext,
  ParseResult,
  InvalidContextResult,
  ScheduleOption,
  SuggestionGroup,
} from '@unplan-tave/parser';
import { DraftEditor } from './DraftAction';
import type { Draft } from './DraftAction';
import { ParseResultView } from './ParseResultView';

interface Message {
  id: number;
  revision: 1;
  result: ParseResult | InvalidContextResult;
}
const clock = (t: NonNullable<ScheduleOption['value']['time']>) =>
  `${String(t.hour).padStart(2, '0')}:${String(t.minute).padStart(2, '0')}`;
function candidateLabel(
  result: ParseResult,
  group: SuggestionGroup,
  option: ScheduleOption,
) {
  const date =
    result.date.state === 'resolved'
      ? (result.date.candidate.sources[0]?.text ?? option.value.date)
      : option.value.date;
  const t = option.value.time;
  const time = t
    ? `${t.hour < 12 ? '오전' : '오후'} ${t.hour % 12 || 12}시${t.minute ? ` ${t.minute}분` : ''}${t.qualification === 'approximate' ? '쯤' : ''}`
    : '';
  return `${date}${time ? ` ${time}` : ''} · ${group.title.value ?? '제목 입력'} ＋`;
}
function guidance(result: ParseResult | InvalidContextResult) {
  if (result.status === 'invalid-context')
    return '기준 시각과 시간대를 확인해 주세요. 개발 정보에서 수정할 수 있어요.';
  const s = result.suggestions;
  if (s.decision === 'offer') return '하나를 골라 초안을 편집해 보세요.';
  if (s.decision === 'review-title')
    return `제목을 확실히 정리하지 못했어요. 이 표현을 편집해서 다시 보내 주세요: ${s.title.value}`;
  if (s.reason === 'negated-action')
    return '하지 않겠다는 계획이라 일정 추가를 제안하지 않았어요.';
  if (s.reason === 'existing-event-operation')
    return '기존 일정의 취소·삭제 요청으로 읽었어요. 이 데모에서는 일정을 변경하지 않아요.';
  if (s.reason === 'conflicting-explicit-clocks')
    return '서로 다른 시각이 있어요. 원하는 시간을 하나로 정해 다시 보내 주세요.';
  if (
    s.reason === 'date-needed' ||
    s.reason === 'no-supported-date' ||
    s.reason === 'week-range-needs-day'
  )
    return '하나의 날짜를 알려 주세요. 오늘·내일·모레·요일을 사용할 수 있어요.';
  if (s.reason === 'invalid-hour' || s.reason === 'invalid-minute')
    return '시간 값의 범위를 확인해 주세요.';
  return '아직 지원하지 않는 표현이거나 확인이 필요한 문장이에요. 날짜·시간·행동을 하나씩 분명하게 알려 주세요.';
}

export function App() {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [context, setContext] = useState<ParseContext>({
    referenceInstant: '',
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const composing = useRef(false);
  const nextId = useRef(1);
  const originButton = useRef<HTMLButtonElement | null>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    if (!draft && restoreFocus.current) {
      if (originButton.current?.isConnected) originButton.current.focus();
      else inputRef.current?.focus();
      restoreFocus.current = false;
    }
  }, [draft]);
  const latest = messages.at(-1)?.result;
  const send = () => {
    if (!text.trim() || composing.current) return;
    const result = parseSchedule({
      text,
      referenceInstant: context.referenceInstant || new Date().toISOString(),
      timeZone: context.timeZone,
    });
    const message: Message = { id: nextId.current++, revision: 1, result };
    setMessages((previous) => [...previous, message]);
    setText('');
    inputRef.current?.focus();
  };
  return (
    <main className="workspace">
      <header className="masthead">
        <a className="brand" href="/" aria-label="Unplan 홈">
          <span className="brand-mark" aria-hidden="true">
            u.
          </span>
          unplan
        </a>
        <span className="environment">
          일정 대화 <span className="status-dot" />
        </span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">A LITTLE PLAN, IN YOUR WORDS</p>
        <h1 id="page-title">
          하고 싶은 일을,
          <br />
          말하듯 적어 보세요.
        </h1>
        <p className="intro-copy">
          “음 내일 3시쯤 카페 갈 거야”
          <br />
          시간을 고르고, 나만의 일정 초안으로 다듬어요.
        </p>
      </section>
      <div className="notice">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <p>
          후보 하나를 선택하면 편집 초안을 엽니다. 실제 일정은 저장하지 않아요.
        </p>
      </div>
      <section
        className="conversation"
        aria-label="일정 대화 기록"
        aria-live="polite"
        aria-relevant="additions"
      >
        {!messages.length && (
          <p className="welcome">안녕하세요. 어떤 일을 계획하고 있나요?</p>
        )}
        {messages.map(({ id, revision, result }) => (
          <article
            key={id}
            className="message"
            data-message-id={id}
            data-revision={revision}
            aria-label={`메시지 ${id}`}
          >
            <p className="message-author">나</p>
            <p className="user-message">{result.input.text}</p>
            <div className="reply">
              <p className="reply-author">unplan</p>
              <p>{guidance(result)}</p>
              {result.status === 'parsed' &&
                result.suggestions.groups.map((group) => (
                  <div
                    key={group.frameId}
                    className="candidate-list"
                    aria-label="일정 추가 후보"
                  >
                    {group.options.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className="candidate"
                        disabled={!!draft}
                        onClick={(event) => {
                          originButton.current = event.currentTarget;
                          setDraft({
                            messageId: id,
                            optionId: option.id,
                            original: result.input.text,
                            context: result.input,
                            title: group.title.value ?? '',
                            date: option.value.date,
                            time: option.value.time
                              ? clock(option.value.time)
                              : '',
                            qualification: group.timeQualification,
                            unfinishedTime: group.unfinishedTime ?? '',
                          });
                        }}
                      >
                        {candidateLabel(result, group, option)}
                      </button>
                    ))}
                    {group.timeQualification === 'approximate' && (
                      <p className="panel-note">
                        ‘쯤’은 근사 시각이에요. 정확한 시작이나 시간 범위로
                        확정하지 않았어요.
                      </p>
                    )}
                    {group.unfinishedTime && (
                      <p className="panel-note">
                        입력 중인 시간: {group.unfinishedTime} · 초안의 시간은
                        비워 둡니다.
                      </p>
                    )}
                  </div>
                ))}
              <details className="message-details">
                <summary>이 메시지의 원문·근거·분석</summary>
                <pre>{JSON.stringify(result, null, 2)}</pre>
              </details>
            </div>
          </article>
        ))}
      </section>
      {draft && (
        <DraftEditor
          initial={draft}
          onClose={() => {
            restoreFocus.current = true;
            setDraft(null);
          }}
        />
      )}
      <form
        className="input-panel composer"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <label className="input-label" htmlFor="schedule-input">
          어떤 일을 계획하고 있나요?
        </label>
        <textarea
          id="schedule-input"
          ref={inputRef}
          value={text}
          rows={2}
          placeholder="음 내일 3시쯤 카페 갈 거야"
          aria-describedby="input-help"
          onChange={(event) => setText(event.target.value)}
          onCompositionStart={() => {
            composing.current = true;
          }}
          onCompositionEnd={() => {
            composing.current = false;
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !composing.current &&
              !event.nativeEvent.isComposing &&
              event.nativeEvent.keyCode !== 229
            ) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="composer-actions">
          <p id="input-help">Enter 전송 · Shift+Enter 줄바꿈</p>
          <button type="submit" className="send-button" disabled={!text.trim()}>
            전송 ↑
          </button>
        </div>
      </form>
      <details className="contract-panel">
        <summary>개발 정보 · 실제 파서 연결됨</summary>
        <p className="panel-note">
          API {PARSER_INFO.apiVersion} · 정책 {PARSER_INFO.policyVersion}.
          전송할 때 기준 시각을 고정합니다. 기록은 이 화면의 메모리에만
          남습니다. 전송된 원문은 수정하지 않습니다.
        </p>
        <div className="context-fields">
          <label htmlFor="reference-instant">
            검증용 기준 시각 (ISO 8601, 비우면 전송 시각)
          </label>
          <input
            id="reference-instant"
            value={context.referenceInstant}
            onChange={(event) =>
              setContext({ ...context, referenceInstant: event.target.value })
            }
          />
          <label htmlFor="time-zone">IANA 시간대</label>
          <input
            id="time-zone"
            value={context.timeZone}
            onChange={(event) =>
              setContext({ ...context, timeZone: event.target.value })
            }
          />
        </div>
        {latest && (
          <>
            <pre aria-label="파서 입력 객체">
              {JSON.stringify(latest.input, null, 2)}
            </pre>
            <details>
              <summary>최근 메시지의 필드 진단</summary>
              <ParseResultView result={latest} />
            </details>
          </>
        )}
      </details>
      <footer>
        <span>unplan / conversation preview</span>
        <span>한 문장, 하나의 계획.</span>
      </footer>
    </main>
  );
}
