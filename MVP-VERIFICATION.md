# 실제 파서 연결과 초안 검증

2026-11-15 (Asia/Seoul). Node **22.20.0**, npm **10.9.3**.

## 연결과 UI

- `npm run parser:sync`로 `@unplan-tave/parser@0.1.0-alpha.1` tarball을 설치했다.
  package.json, package-lock.json, vendor 스냅샷을 일치시켰다.
- 루트의 실제 `parseSchedule`을 import해 매 입력 변경 시 전체 문자열을 분석한다.
  파서 로직·계약 타입을 데모에 복사하지 않는다.
- 기존 화면 디자인과 CSS 토큰을 유지하고, 화면 조립·결과 표시·소비자 액션 정책·초안
  편집 상태를 분리했다. 각 필드 상태/후보, 인식 위치, diagnostics, derivations를 표시한다.
- 단일 날짜면 빈 제목도 허용한다. 미완성 시간은 날짜를 유지하며 초안 시간은 비운다.
  range·미확정 날짜·시간 ambiguous/invalid·unsupported 경고는 추가를 보류한다.
- 클릭 시 날짜·확정 시간·제목 후보를 캡처해 편집 초안을 연다. 원문 입력을 바꿔도
  열린 초안은 유지된다. 자동 초안 생성이나 실제 저장은 없다.
- 개발 정보에서 기준 시각과 시간대를 편집해 invalid-context를 확인할 수 있다.

## 실행 결과

| 실행                         | 결과                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `npm run parser:sync`        | 새 패키지 설치·이전 vendor 스냅샷 제거 통과                                             |
| `npm ci`                     | 통과. 최종 재설치는 별도 캐시와 `--offline`으로 재현                                    |
| `npm run check`              | 타입 검사, ESLint, Prettier, Vite production build 통과                                 |
| 형제 parser 없는 임시 복사본 | `/private/tmp/unplan-demo-isolated-LsRAtb`에서 `npm ci --offline && npm run build` 통과 |
| `npm run test:browser`       | Playwright + 로컬 Chrome 157.0.8103.52에서 아래 항목 통과                               |

검증 서버는 기존 5173 포트를 유지하고 `http://127.0.0.1:5175`에서 실행했다.
브라우저 context를 Asia/Seoul, 기준 시각을 2026-11-14T01:00:00Z로 고정했다.

1. 예시 선택·직접 입력·none/incomplete/resolved/ambiguous/invalid 상태 갱신.
2. 다음/다음 주/단일 날짜의 버튼 조건, 입력 변화만으로 초안이 열리지 않음.
3. 제목 없는 날짜 초안의 빈 제목·빈 시간, 제목 편집, 확정 날짜 전달.
4. `내일 오후 3시 2`의 날짜 유지·시간 incomplete·빈 시간과 원문 안내.
5. 열린 초안이 원문 편집으로 덮어써지지 않음, 새 초안에 확정 시간·제목 전달.
6. 미확정 날짜·주간 range·모호/잘못된 시간·반복/기간 경고의 추가 보류.
7. 인식 위치·원문·추론 근거 표시, 잘못된 시각/시간대 안내와 정상 복구.
8. Enter로 열기, 제목으로 포커스 이동, Tab 이동, Escape로 닫기와 버튼 포커스 복귀.
9. 합성 composition 이벤트와 입력 변경 중 textarea 포커스 유지.
10. 375px·320px 화면의 가로 overflow 없음, 미완성 시간 초안 편집·키보드 닫기.
11. 브라우저 console/page/HTTP 오류 없음. favicon 누락도 수정했다.

재실행 명령:

```sh
npm run dev -- --port 5175 --strictPort
# 다른 터미널
DEMO_URL=http://127.0.0.1:5175 BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser
```

결과 JSON과 desktop/375px/320px 스크린샷은 로컬 `artifacts/`에 있으며 Git 대상에서
제외했다. 브라우저 설치는 README의 Playwright Chromium 명령을 사용할 수도 있다.

## 검증 한계와 다음 작업

좁은 화면은 데스크톱 Chrome viewport 검증이다. 모바일 기기·브라우저와 실제 OS 한국어
IME는 직접 검증하지 않았으며, composition 자동화와 혼동하지 않는다. 다음 작업으로
실제 IME/기기와 Expo SDK 56/Hermes에서 동일 패키지 소비를 검증한다.

서버·계정·DB·일정 저장은 없다. 반복·기간의 완전한 해석, 다중 일정·대화 의도는 파서
지원 범위 밖이다. npm 게시·Vercel 배포·Git 커밋·푸시·PR 생성은 수행하지 않았다.
