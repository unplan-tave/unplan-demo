import type { InvalidContextResult, ParseResult } from '@unplan-tave/parser';
import { formatTime } from './result-format';

export interface Draft {
  date: string;
  time: string;
  title: string;
  unfinishedTime: string;
}

export function draftAction(result: ParseResult | InvalidContextResult): {
  draft: Draft | null;
  message: string;
} {
  if (result.status === 'invalid-context')
    return { draft: null, message: '유효한 기준 시각과 시간대가 필요합니다.' };
  if (
    result.diagnostics.some(
      (diagnostic) => diagnostic.code === 'unsupported-expression',
    )
  )
    return {
      draft: null,
      message: '반복·기간 표현은 아직 지원하지 않아 추가를 보류합니다.',
    };
  if (result.date.state !== 'resolved')
    return {
      draft: null,
      message: '하나의 날짜가 확정되면 초안을 추가할 수 있어요.',
    };
  if (result.date.candidate.value.kind === 'range')
    return { draft: null, message: '주간 범위에서 특정 요일을 입력해 주세요.' };
  if (result.time.state === 'ambiguous' || result.time.state === 'invalid')
    return {
      draft: null,
      message: '날짜는 유지됩니다. 시간을 선택하거나 수정해 주세요.',
    };
  const unfinishedTime = result.expressions
    .filter(
      (expression) =>
        expression.kind === 'time' && expression.state === 'incomplete',
    )
    .map((expression) => expression.span.text)
    .join(' / ');
  return {
    draft: {
      date: result.date.candidate.value.date,
      time:
        result.time.state === 'resolved'
          ? formatTime(result.time.candidate.value)
          : '',
      title:
        result.title.state === 'resolved' ? result.title.candidate.value : '',
      unfinishedTime,
    },
    message: unfinishedTime
      ? '날짜 초안을 열 수 있어요. 입력 중인 시간은 자동으로 채우지 않습니다.'
      : '제목이 없어도 초안을 열어 편집할 수 있어요.',
  };
}
