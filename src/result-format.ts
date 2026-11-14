import type { DateValue, TimeValue } from '@unplan-tave/parser';

export const stateLabels = {
  none: '정보 없음',
  incomplete: '입력 중',
  resolved: '확정',
  ambiguous: '선택 필요',
  invalid: '수정 필요',
} as const;

export function formatDate(value: DateValue): string {
  return value.kind === 'date'
    ? value.date
    : `${value.startDate} ~ ${value.endDateExclusive} (끝 제외 · 주간 범위)`;
}

export function formatTime(value: TimeValue): string {
  return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}
