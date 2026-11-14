import { useState } from 'react';
import {
  INITIAL_POLICIES,
  PARSER_INFO,
  parseSchedule,
} from '@unplan-tave/parser';
import type { ParseContext, ParseInput } from '@unplan-tave/parser';
import { DraftAction } from './DraftAction';
import { ParseResultView } from './ParseResultView';

const examples = [
  '다음',
  '다음 주',
  '다음 주 월요일에',
  '다음 주 월요일에 오후',
  '다음 주 월요일에 오후 3시 회의',
  '내일 오후 3시 2',
  '내일 3시 회의',
  '매주 월요일 회의',
];

export function App() {
  const [text, setText] = useState('');
  // The UI owns the clock. Typing does not update the reference instant.
  const [context, setContext] = useState<ParseContext>(() => ({
    referenceInstant: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));
  const input = { text, ...context } satisfies ParseInput;
  const result = parseSchedule(input);
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
          개발 공간 <span className="status-dot" />
        </span>
      </header>
      <section className="intro" aria-labelledby="page-title">
        <p className="eyebrow">KOREAN SCHEDULE PARSER / 01</p>
        <h1 id="page-title">
          일정의 시작은,
          <br />한 줄이면 충분하니까.
        </h1>
        <p className="intro-copy">
          자연스럽게 적은 말이 일정이 되는 과정을 살펴봅니다.
          <br />
          날짜와 시간을 확인하고, 편집 가능한 초안을 열어 보세요.
        </p>
      </section>
      <div className="notice">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <p>
          <strong>입력할 때마다 실제 파서가 분석합니다.</strong> 추가 버튼으로
          초안을 열 수 있으며, 실제 일정은 저장하지 않습니다.
        </p>
        <span className="stage-tag">MVP</span>
      </div>
      <section className="input-panel" aria-labelledby="input-title">
        <div className="section-heading">
          <h2 id="input-title">
            <span className="section-number">01</span> 일정 입력
          </h2>
          <span className="quiet-label">클라이언트 분석</span>
        </div>
        <label className="input-label" htmlFor="schedule-input">
          어떤 일을 계획하고 있나요?
        </label>
        <textarea
          id="schedule-input"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="다음 주 월요일에 오후 3시 회의"
          aria-describedby="input-help"
          rows={3}
        />
        <div className="input-meta">
          <p id="input-help">입력 예시를 눌러 문자열을 채울 수 있어요.</p>
          <span>{text.length}자 · UTF-16</span>
        </div>
        <div className="example-list" aria-label="입력 예시">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              className="example"
              onClick={() => setText(example)}
            >
              {example}
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </div>
      </section>
      <div className="output-grid">
        <ParseResultView result={result} />
        <DraftAction result={result} />
      </div>
      <details className="contract-panel">
        <summary>
          <span>개발 정보 · 패키지 연결 확인</span>
          <span className="connection-label">실제 파서 연결됨</span>
        </summary>
        <dl className="contract-meta">
          <div>
            <dt>패키지 상태</dt>
            <dd>{PARSER_INFO.implementation}</dd>
          </div>
          <div>
            <dt>API</dt>
            <dd>{PARSER_INFO.apiVersion}</dd>
          </div>
          <div>
            <dt>해석 정책</dt>
            <dd>
              {PARSER_INFO.policyVersion} · 주 시작{' '}
              {INITIAL_POLICIES.weekStartsOn === 1 ? '월요일' : ''}
            </dd>
          </div>
        </dl>
        <p className="panel-note">
          기준 시각은 페이지 진입 시 고정됩니다. 아래 context를 편집해 경계와
          오류 상태를 확인할 수 있어요.
        </p>
        <div className="context-fields">
          <label htmlFor="reference-instant">기준 시각 (ISO 8601)</label>
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
        <pre aria-label="파서 입력 객체">{JSON.stringify(input, null, 2)}</pre>
        <details>
          <summary>전체 파싱 결과 JSON</summary>
          <pre aria-label="전체 파싱 결과">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
        <a
          className="docs-link"
          href="https://github.com/unplan-tave/unplan-parser/tree/main/docs"
          target="_blank"
          rel="noreferrer"
        >
          API·해석 정책 문서 ↗
        </a>
      </details>
      <footer>
        <span>unplan / parser playground</span>
        <span>한국어 입력에서 일정으로.</span>
      </footer>
    </main>
  );
}
