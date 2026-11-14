import type {
  Field,
  ParseResult,
  InvalidContextResult,
} from '@unplan-tave/parser';
import { formatDate, formatTime, stateLabels } from './result-format';

function FieldRow<T>({
  label,
  field,
  format,
}: {
  label: string;
  field: Field<T>;
  format: (value: T) => string;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <span className={`field-state state-${field.state}`}>
          {stateLabels[field.state]} · {field.state}
        </span>
        {field.state === 'resolved' && (
          <span>{format(field.candidate.value)}</span>
        )}
        {field.state === 'ambiguous' && (
          <>
            <span>
              {field.candidates
                .map((candidate) => format(candidate.value))
                .join(' / ')}
            </span>
            <small>{field.reason}</small>
          </>
        )}
        {field.state === 'incomplete' && (
          <small>다음 입력: {field.expected.join(', ')}</small>
        )}
        {field.state === 'invalid' && (
          <small>
            {field.message} ({field.code})
          </small>
        )}
      </dd>
    </div>
  );
}

export function ParseResultView({
  result,
}: {
  result: ParseResult | InvalidContextResult;
}) {
  return (
    <section className="result-panel" aria-labelledby="result-title">
      <div className="section-heading">
        <h2 id="result-title">
          <span className="section-number">02</span> 파싱 결과
        </h2>
        <span className="state-pill">
          {result.status === 'parsed' ? '분석 완료' : 'invalid-context'}
        </span>
      </div>
      {result.status === 'invalid-context' ? (
        <div role="alert">
          <p>기준 시각·시간대를 확인해 주세요.</p>
          <ul>
            {result.errors.map((error) => (
              <li key={error.code}>
                {error.message} ({error.code})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <>
          <dl className="result-list" aria-live="polite">
            <FieldRow label="날짜" field={result.date} format={formatDate} />
            <FieldRow label="시간" field={result.time} format={formatTime} />
            <FieldRow
              label="제목 후보"
              field={result.title}
              format={(value) => value}
            />
          </dl>
          <details className="recognition-details">
            <summary>인식 위치·진단·추론 근거</summary>
            <p className="panel-note">원문 위치는 UTF-16 [start, end)입니다.</p>
            <p className="source-preview" aria-label="인식한 원문">
              {(() => {
                const parts = [];
                let end = 0;
                for (const expression of result.expressions) {
                  parts.push(
                    result.input.text.slice(end, expression.span.start),
                  );
                  parts.push(
                    <mark
                      key={expression.span.start}
                      title={`${expression.kind} · ${expression.state} · [${expression.span.start}, ${expression.span.end})`}
                    >
                      {expression.span.text}
                    </mark>,
                  );
                  end = expression.span.end;
                }
                parts.push(result.input.text.slice(end));
                return parts;
              })()}
            </p>
            {result.expressions.length ? (
              <ul>
                {result.expressions.map((expression) => (
                  <li key={expression.span.start}>
                    {expression.kind} · {expression.state} [
                    {expression.span.start}, {expression.span.end}):{' '}
                    {expression.span.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="panel-note">인식한 날짜·시간 표현이 없습니다.</p>
            )}
            <h3>Diagnostics</h3>
            {result.diagnostics.length ? (
              <ul>
                {result.diagnostics.map((diagnostic, i) => (
                  <li key={i}>
                    <strong>{diagnostic.code}</strong> · {diagnostic.message}{' '}
                    {diagnostic.sources
                      .map(
                        (source) =>
                          `[${source.start}, ${source.end}) ${source.text}`,
                      )
                      .join(', ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p>진단 없음</p>
            )}
            <h3>후보·원문·Derivations</h3>
            <pre aria-label="필드 추론 근거">
              {JSON.stringify(
                { date: result.date, time: result.time, title: result.title },
                null,
                2,
              )}
            </pre>
          </details>
        </>
      )}
    </section>
  );
}
