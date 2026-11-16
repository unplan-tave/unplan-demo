# P1 로컬 개발 검증

2026-11-17 (Asia/Seoul). 파서 0.3.0-alpha.1을 vendor tarball로 소비한다.
기존 0.2 배포 기록은 demo-release.md에 보존하며 이번 작업은 배포하지 않는다.

- 한 행동의 최대 네 날짜·시간 대안과 여러 행동 그룹을 표시한다.
- 전/후 관계를 후보와 편집 초안에 표시한다. 상속된 날짜는 초안에서 안내하며,
  앞 행동의 시각을 다음 행동에 복사하지 않는다.
- 밤 12시·1시는 날짜 확인 안내를 표시한다.
- 상대 시간의 날짜/시간 표현이 같은 원문 범위를 공유해도 하이라이트는 한 번 표시한다.
- 새 패키지의 루트 export·공개 타입을 소비하며 파서 로직은 복사하지 않는다.

Node 22.20.0에서 npm ci, parser:sync, check를 실행한다. 브라우저 검증은
scripts/verify-browser.mjs의 11개 검사 그룹을 실행했다. 후보 선택·초안 편집·메시지 분리,
P1 문법과 순서/상속, 원문 표시, IME 합성 이벤트·키보드 포커스, 320px/375px를 확인했다.
브라우저 console/page/HTTP 오류는 0건이다. 실제 OS IME·모바일 기기 검증은 포함하지 않는다.

실행 증거는 docs/evidence/p1-browser.json과 p1-snapshot.json, p1-isolated.json에 기록한다.
파서의 설계 자료 실행 결과는 docs/p1-input-results.json이다.
소스 변경 후 같은 검증을 다시 실행해야 하며 실제 일정 저장은 없다.
