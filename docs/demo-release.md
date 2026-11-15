# Unplan 대화형 일정 제안 릴리스

2026-11-15 (Asia/Seoul). P0의 실제 파서와 메시지별 후보·편집 초안을 연결했다.
이전 MVP의 배포 기록은 [이력](releases/2026-11-15-mvp.md)에 보존했다.

## 배포 식별 정보

| 항목                | 값                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------ |
| Production 공유 URL | [Unplan](https://unplan-demo.vercel.app)                                             |
| Production 고유 URL | [Production 고유 주소](https://unplan-demo-gwz8lscto-haewonwons-projects.vercel.app) |
| Production 배포 ID  | dpl_4RrLbm3UPfkh3jQtAPQuNHoC8evw                                                     |
| Preview URL         | [Preview (인증 필요)](https://unplan-demo-1f22k8jm6-haewonwons-projects.vercel.app)  |
| Preview 배포 ID     | dpl_3b1AJ1hujbKkGK3d8PzvzcfLsDQZ                                                     |
| 기존 프로젝트       | haewonwons-projects/unplan-demo / prj_dEaAIakpLUnh6ub6GkBJFrZgeeif                   |
| 팀                  | team_WIRikT3FV5NG9Xu6ol3D96gb                                                        |
| CLI / 로컬 도구     | Vercel 65.16.0 / Node 22.20.0 / npm 10.9.3                                           |

Preview 화면 검증 후 **그 Preview를 승격하여 동일한 소스·vendor 패키지로 Production을
재배포**했다. Production은 로그인·저장 쿠키·인증 헤더 없는 새 Chrome context에서
공유 주소로 별도 검사했다. 배포 전파 중 이전 JS를 받은 첫 검사는 실패로 확인했고,
최종 JS·CSS·HTML 해시를 대조한 뒤 새 브라우저의 전체 검사를 다시 실행했다.
CLI 성공이나 HTTP 200만으로 통과 처리하지 않았다.
[배포 ID·상태·시각](evidence/conversation-deployments.json).

기존 인증 보호 `all_except_custom_domains`를 유지했다. Preview는 인증이 필요하다.
공식 `vercel curl`이 만든 검증용 임시 인증을 메모리에서만 브라우저에 전달했고,
검사 후 폐기하여 secret 수가 다시 0개임을 확인했다. 첫 인증 시도는 로그인 화면으로
이동해 실패했고, 인증 적용을 확인한 재시도의 앱 화면 검사만 통과로 기록한다.
[보호 설정 대조](evidence/conversation-protection.json),
[공식 인증 방식](https://vercel.com/docs/cli/curl).
접근 보호 정책·플랜·커스텀 도메인은 변경하지 않았다.

## 코드와 패키지

- 파서 `@unplan-tave/parser@0.2.0-alpha.1`.
- API `0.2.0-conversation.1`, 정책 `ko-schedule-v0.2-p0.1`.
- vendor: `vendor/unplan-tave-parser-0.2.0-alpha.1-bbd1ec87cfaa.tgz`.
- SHA-256: `bbd1ec87cfaaaed442c3566e1068ca3178c7f189759e20ed166efd92e9b90155`.
- manifest·lockfile 경로, 설치 버전, vendor SHA-256/512·lockfile integrity,
  실제 런타임 export를 대조했다. [패키지와 빌드 해시](evidence/conversation-snapshot.json).
- npm pack은 dist JS·선언, docs, README, package.json의 28개 파일만 포함한다.
  런타임 export는 `parseSchedule`, `PARSER_INFO`, `INITIAL_POLICIES` 세 개다.
- 시작 시 parser에는 미추적 설계/검토 문서 3개가 있었고 demo는 깨끗했다.
  기존 문서 내용을 보존하고 설계 이력 안내·포맷을 갱신했다. 이 기록은 기능 구현과
  CLI 배포 당시의 검증이다. 이후 사용자 요청으로 Git 커밋·푸시와 자동 배포 연결을
  진행하며 npm 게시는 하지 않는다. 파서 로직·타입을 데모에 복사하지 않았다.

## 구현한 규칙과 보류

기존 달력·IANA 시간대·값 검증을 재사용한다. `suggestions`가 한 절의 행동 제목과
시간 대안을 묶으며, 기존 독립 date/time/title 필드는 인식·진단용으로 유지한다.
특히 기존 title의 잔여 문자열을 정리된 행동 제목으로 표시하지 않는다.

- 완성 시각의 쯤/정도와 시간 수식어 약을 근사 속성으로 보존한다. 긴 공백·줄바꿈도
  검사한다. 수치 시각은 기준값이며 정확한 시작·±30분 범위·timestamp로 바꾸지 않는다.
- 오전·오후 없는 1~12시는 두 대안, 12시는 00:00/12:00이다. 서로 다른 명시 시각의
  충돌은 선택 후보로 나열하지 않고 확인한다. 같은 값은 병합한다.
- 문두 독립 담화어와 가다/먹다/보다/읽다/듣다/만나다/걷다/쓰다의 등록 활용형,
  검증한 행동 명사+하다로 제목을 정리한다. 장소별 정규식이나 예문 전체 비교는 없다.
  동반자·대상·전달 대상·목적 정보는 보존하고 새로운 행동을 추론하지 않는다.
- 부정·질문·취소/삭제·조회·불확실·희망·조건·인용·타인 주어를 보호한다.
  안과/취소표 같은 명사는 문자열 일부만으로 부정/취소로 판단하지 않는다.
  명시적인 `일정 추가해줄래?`는 생성 요청 예외지만 앞의 부정·조건은 계속 검사한다.
- 미등록 행동은 verbatim 원문 잔여와 제목 편집 요청을 반환하며 후보를 만들지 않는다.
  날짜만/제목 없음/미완성 시간은 빈 필드 초안을 허용하고 자정·종일로 채우지 않는다.
- P1의 한글 수사·시간대 단어·정정·여러 행동·날짜 선택·목적절·복합 서술어·
  순서·이중 부정은 확인/미지원 안내다. 기간·마감·반복·숫자 날짜·NFD도 지원하지 않는다.

한 메시지의 단일 행동, 최대 두 후보만 지원한다. 새 메시지에 옛 날짜를 상속하지 않고
서로 무관한 날짜·시간·제목을 교차 조합하지 않는다. title의 form·ruleIds·edits·
UTF-16 sources와 option의 sources/derivations로 원문 근거를 추적한다.

## 기대값과 실제 실행

64개 설계 예시는 **요구 예문 1개와 내부 작성 자료**다. 실제 사용자 수집 자료나
실사용 정확도 검증이 아니다. 원본 기대값을 바꾸어 통과시키지 않았으며 실행 결과는
[원문·기대·실제 결과](conversation-input-results.json)에 별도로 기록했다.

| 분류              |  수 | 실행 결과                                        |
| ----------------- | --: | ------------------------------------------------ |
| P0 후보 제안      |  30 | 제목·형태·날짜·시간·근사·대안 관계 일치          |
| P0 확인 보호      |  14 | 기대한 clarify와 이유 일치                       |
| P0 제안 금지      |   9 | 기대한 no-offer와 이유 일치                      |
| P0 제목 편집 요청 |   1 | verbatim 잔여 보존과 review-title 일치           |
| P1 보류           |  10 | 미지원 확인 동작만 일치, 문법 지원으로 세지 않음 |
| 실패              |   0 | 최종 실행 기준                                   |

즉 P0 54건의 기대 동작과 P1 10건의 안전한 보류를 구분한다. 제목 누락·미완성,
단어 경계(음/음악, 약/약속, 안/안과), 동반자·대상 보존, 부정 반전 방지,
명시 충돌, 이모지·줄바꿈·긴 반복·10만 자리 숫자·UTF-16 범위의 별도 회귀도 실행했다.

## 실행한 검사

- 두 `.nvmrc`의 Node 22.20.0과 npm 10.9.3을 사용했다.
- parser: `npm ci`, `npm test` **199 pass / 0 fail / 14 TODO**, `npm run check`
  (strict 타입·ESLint·Prettier·빌드), `npm pack --dry-run --json`, 실제 pack 통과.
  14 TODO는 이전 독립 필드 검증 자료의 범위 밖 관찰 사례이며 새 기능 성공으로 세지 않는다.
- demo: `npm run parser:sync`, `npm ci`, `npm run check`,
  `node scripts/verify-snapshot.mjs` 통과. 독립 manifest/lockfile/vendor를 유지한다.
- 형제 parser 폴더 없는 임시 demo 복사본에서 `npm ci`와 build 통과.
  패키지와 HTML·JS·CSS·favicon SHA-256이 원본 빌드와 일치했다.
  [독립 설치 증거](evidence/conversation-isolated.json).
- 실제 정적 빌드·Preview·Production에서 브라우저 검사 8개 그룹을 실행했다.
  화면과 스크린샷을 확인했으며 최종 검사에서 pageerror·console error·HTTP 실패는 0건이다.
  [정적 빌드](evidence/conversation-browser-static.json),
  [Preview](evidence/conversation-browser-preview.json),
  [Production](evidence/conversation-browser-production.json).
- [Production 정적 자산 대조](evidence/conversation-production-assets.json)는 인증 없는
  요청으로 로컬/독립 빌드의 해시·MIME·상태와 대조했다.
- 검증 중 발견한 초안 닫기 후 포커스 경쟁을 layout effect로 수정했다. 제목 정리에서
  목적어 을/를을 임의 삭제하지 않으며, 긴 공백의 약 수식어와 같은 시각의 근사 속성
  병합, 연결어 없는 명사형 행동 나열의 보류를 회귀 검사했다. 긴 숫자에서 보호 정규식의 재시도 성능 문제도 수정했다.

## 배포 화면에서 확인한 흐름

1. 입력 수정·전체 삭제만으로 메시지·후보·초안이 생기지 않는다. Enter/전송으로만 전송한다.
2. `음 내일 3시쯤 카페 갈 거야` → 원문 표시와 두 후보:
   `내일 오전 3시쯤 · 카페 가기 ＋`, `내일 오후 3시쯤 · 카페 가기 ＋`.
3. 오후 선택 → 제목 카페 가기, 기준 context에서 2026-11-16, 기준 시간 15:00.
   근사 안내를 유지한다. 오전 선택은 03:00이다. 입력만으로 두 일정을 추가하지 않는다.
4. 제목·날짜·시간을 편집하고 닫기/Esc 후 다시 선택하면 선택 후보의 새 초안이 열린다.
   초안 제목으로 포커스를 옮기고 닫으면 원래 후보 버튼으로 돌아온다.
5. 다른 메시지와 개발 context를 보내도 이전 메시지의 원문·context·후보와 열린 초안은
   섞이지 않는다. 전송 시각을 메시지마다 고정하며 전송한 원문의 편집은 제공하지 않는다.
6. 부정·질문·충돌·P1·타인 주어에는 긍정 후보가 없다. 미등록 행동은 원문을 보여 주며
   편집해서 다시 보내도록 요청한다. 날짜만/미완성 시간은 빈 시간 초안으로 이어진다.
7. IME 조합 중 Enter/Esc와 keyCode 229를 합성 이벤트로 검사했다. Shift+Enter는 줄바꿈,
   Tab·Enter·Escape와 포커스를 검사했다. 320px·375px에서 가로 넘침 없이 조작했다.
8. 이모지·줄바꿈, 18,000 UTF-16 반복 메시지와 전송 후 입력 삭제를 확인했다.

증거 PNG는 `artifacts/conversation-static`, `artifacts/conversation-preview`,
`artifacts/conversation-production`에 있다. 실제 macOS/iOS/Android 한글 입력기의
조합·후보 선택을 사람이 직접 확인한 결과로 표현하지 않는다.

## 알려진 제한과 실패 제보

등록 문법에 한정한 규칙 파서다. 임의의 한국어를 이해하지 않으며, 명사 중 가/이로
끝나는 토큰이나 쉼표·연결 표현을 보수적으로 확인할 수 있다. 복잡한 명사구·부정 범위·
미등록 활용형은 원문 보존/확인으로 처리한다. 새 단어나 모든 미지원 구문에 대한
오제안 방지를 보장하지 않는다. P1을 지원하는 척하지 않는다.

context의 IANA 가용성은 실행 환경 Intl에 의존한다. 저장 instant, DST gap/fold,
자정·종일 확정은 일정 도메인의 후속 책임이다. 초안·대화는 메모리 안에만 있으며
새로고침하면 사라진다. 서버·DB·계정·사용자 입력 자동 수집·실제 저장은 없다.
Expo SDK 56/Hermes와 실제 기기의 한글 입력기는 후속 검증이다.

자동 전송 폼이 아니다. 아래 내용을 복사해 수동으로 제보한다.

```text
접속 URL / 확인한 날짜:
입력 원문(공백·줄바꿈·이모지 포함):
해당 메시지의 referenceInstant / timeZone (원문·근거·분석에서 복사):
기대 결과(후보 수·문구·제목·시간·근사·확인 안내):
실제 결과와 해당 메시지의 분석 JSON:
재현 순서(입력·전송·후보 선택·편집·닫기·재선택):
브라우저/기기/화면 너비/한글 입력기:
추가 메모:
```

실제 사용자 피드백 자료는 제공되지 않았다. 자동 수집 도구나 외부 피드백 요청 메시지를
추가하지 않았다.
