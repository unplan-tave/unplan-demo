import { useState } from 'react';
import { INITIAL_POLICIES, PARSER_INFO } from '@unplan-tave/parser';
import type { ParseInput, ParserInfo } from '@unplan-tave/parser';

const parserInfo: ParserInfo = PARSER_INFO;
const examples = [
  '다음',
  '다음 주',
  '다음 주 월요일에',
  '다음 주 월요일에 오후 3시 회의',
];

export function App() {
  const [text, setText] = useState('');
  // The caller owns the clock and zone. This is input inspection, not parsing.
  const [context] = useState<Omit<ParseInput, 'text'>>(() => ({
    referenceInstant: new Date().toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));
  const input = { text, ...context } satisfies ParseInput;

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
          지금은 공개 API와 개발 환경을 준비한 단계입니다.
        </p>
      </section>

      <div className="notice" role="status">
        <span className="notice-icon" aria-hidden="true">
          i
        </span>
        <p>
          <strong>파서는 아직 구현되지 않았어요.</strong> 입력을 바꿔도
          해석하거나 일정을 저장하지 않습니다.
        </p>
        <span className="stage-tag">설계 단계</span>
      </div>

      <section className="input-panel" aria-labelledby="input-title">
        <div className="section-heading">
          <h2 id="input-title">
            <span className="section-number">01</span> 일정 입력
          </h2>
          <span className="quiet-label">클라이언트 입력</span>
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
        <section className="result-panel" aria-labelledby="result-title">
          <div className="section-heading">
            <h2 id="result-title">
              <span className="section-number">02</span> 파싱 결과
            </h2>
            <span className="state-pill">미구현</span>
          </div>
          <dl className="result-list">
            {['날짜', '시간', '제목 후보'].map((label) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>아직 분석하지 않음</dd>
              </div>
            ))}
          </dl>
          <p className="panel-note">
            인식 위치·입력 중·모호함·추론 근거는 파서 구현 후 표시합니다.
          </p>
        </section>

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
            <p className="action-title">일정 초안을 기다리고 있어요</p>
            <p>
              파서 구현 후, 특정 날짜가 인식되면
              <br />
              제목이 없어도 초안 추가를 제안합니다.
            </p>
          </div>
          <button
            type="button"
            className="add-button"
            disabled
            aria-describedby="action-help"
          >
            할 일 추가 <span aria-hidden="true">↗</span>
          </button>
          <p id="action-help" className="panel-note">
            현재는 제안과 저장 기능이 연결되어 있지 않습니다.
          </p>
        </section>
      </div>

      <details className="contract-panel">
        <summary>
          <span>개발 정보 · 패키지 연결 확인</span>
          <span className="connection-label">공개 타입 연결됨</span>
        </summary>
        <dl className="contract-meta">
          <div>
            <dt>패키지 상태</dt>
            <dd>{parserInfo.implementation}</dd>
          </div>
          <div>
            <dt>API 초안</dt>
            <dd>{parserInfo.apiVersion}</dd>
          </div>
          <div>
            <dt>해석 정책</dt>
            <dd>
              {parserInfo.policyVersion} · 주 시작{' '}
              {INITIAL_POLICIES.weekStartsOn === 1 ? '월요일' : ''}
            </dd>
          </div>
        </dl>
        <p className="panel-note">
          아래는 전달할 입력 객체입니다. 파싱 결과가 아닙니다. 기준 시각은
          페이지를 연 시점에 고정됩니다.
        </p>
        <pre aria-label="파서 입력 객체">{JSON.stringify(input, null, 2)}</pre>
        <a
          className="docs-link"
          href="https://github.com/unplan-tave/unplan-parser/tree/main/docs"
          target="_blank"
          rel="noreferrer"
        >
          API·해석 정책 문서 ↗
        </a>
        <p className="panel-note">
          문서는 parser 레포의 docs/에 준비되어 있으며, 원격 링크는 커밋·푸시 후
          열립니다.
        </p>
      </details>

      <footer>
        <span>unplan / parser playground</span>
        <span>한국어 입력에서 일정으로.</span>
      </footer>
    </main>
  );
}
