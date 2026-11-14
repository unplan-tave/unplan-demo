# Unplan Demo

공유 데모: [unplan-demo.vercel.app](https://unplan-demo.vercel.app).
배포 식별 정보와 검증 결과는 [릴리스 기록](docs/demo-release.md)에 있다.

Unplan 한국어 일정 파서의 계약과 실제 동작을 확인하기 위한 Vite + React +
TypeScript 정적 웹이다. 완성된 챗봇은 이번 범위에 포함하지 않는다.

**한국어 일정 파서 MVP가 연결되어 있다.** 입력이 바뀌면 공개 패키지의 실제
`parseSchedule`이 전체 문자열을 분석한다. 날짜·시간·제목의 상태, 인식 위치, diagnostics,
추론 근거를 확인하고 정책에 맞으면 편집 가능한 초안을 연다. 입력은 서버로 보내지 않으며
실제 일정도 저장하지 않는다. 기준 시각은 페이지 진입 시 고정하고 시간대는 브라우저에서
읽는다. 개발 정보에서 context를 편집해 invalid-context도 확인할 수 있다.

단일 날짜는 제목이 없어도 초안을 연다. 미완성 시간은 비워 두고 원문을 안내한다.
주간 범위·미확정 날짜·모호/잘못된 시간·unsupported 경고는 추가를 보류한다.
초안은 입력 변화와 독립적이며 제목·날짜·시간을 편집하고 닫을 수 있다.

## 실행

Node 22.20.0 (`.nvmrc`), npm 10.9.3 기준.

```sh
nvm use
npm ci
npm run dev
```

기본 주소는 `http://127.0.0.1:5173`이다. 포트 사용 중이면 Vite가 출력한 주소를 사용한다.
이 레포의 `vendor/` 패키지를 설치하므로 parser 형제 폴더 없이도 실행된다.

```sh
npm run typecheck
npm run lint
npm run format:check
npm run build
npm run preview
# 전체 검증: npm run check
```

## parser 수정 반영

```sh
cd ../unplan-parser
npm ci
cd ../unplan-demo
npm run parser:sync
npm run check
```

다른 위치에서는 `npm run parser:sync -- /absolute/path/to/unplan-parser`를 사용한다.
스크립트는 parser의 `npm pack`(prepack 빌드 포함)을 실행해 해시가 붙은 tarball을
`vendor/`에 복사한 후 정확한 파일 경로로 설치한다. 반복 실행 시 같은 내용은 같은 파일을
사용하고, 새 스냅샷을 설치한 후 이전 스냅샷을 제거한다. `npm ci`는 동기화나 parser 빌드를
하지 않는다. `npm link`나 형제 소스 alias를 쓰지 않는다.

`package.json`, `package-lock.json`, 현재 참조하는 `vendor/*.tgz`는 향후 함께 커밋해야 한다.
수동 pack 설치와 정식 배포 버전 전환의 기준 문서는 parser의
[docs/development.md](../unplan-parser/docs/development.md)다.

## 계약 문서

API와 해석 정책은 [parser 레포](https://github.com/unplan-tave/unplan-parser)의
`docs/public-api.md`, `docs/interpretation-policy.md`, `docs/examples.md`를 기준으로 한다.
로컬에서는 [공개 API](../unplan-parser/docs/public-api.md),
[정책](../unplan-parser/docs/interpretation-policy.md),
[기대 예시](../unplan-parser/docs/examples.md)를 확인한다. 원격 파일 링크는 초기 커밋이
푸시되기 전에는 열리지 않는다. 설치된 스냅샷의 문서도
`node_modules/@unplan-tave/parser/docs/`에 포함된다.

## Vercel 준비

`vercel.json`: Vite / 설치 `npm ci` / 빌드 `npm run build` / 출력 `dist`.
Vercel 프로젝트의 Root Directory는 이 레포 루트, Node는 지원되는 22.x로 설정한다.
현재 의존성은 이 레포 안의 tarball이므로 형제 레포나 npm 게시 여부에 의존하지 않는다.
정식 게시 후에는 parser의 정확한 버전으로 교체하고 lockfile을 갱신한다.
현재 배포 상태, 리뷰 수정, 내부 입력 검증과 피드백 제보 양식은
[docs/demo-release.md](docs/demo-release.md)를 참고한다.

스타일 토큰은 `src/tokens.css`, 화면 조립은 `src/App.tsx`, 결과 표시는
`src/ParseResultView.tsx`, 소비자 액션 정책은 `src/draft-policy.ts`, 초안은
`src/DraftAction.tsx`다. 파서 로직과 계약 타입은 복사하지 않는다.

## 브라우저 확인

```sh
# 별도 터미널에서 npm run dev 실행 후
npx playwright install chromium
npm run test:browser
# 기존 Chrome 사용 시: BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser
```

입력·예시·상태·버튼, 제목 없는/미완성 시간 초안, context 오류, 키보드와 375px 화면을
검증하고 `artifacts/`에 스크린샷·결과를 남긴다. 실제 검증 기록은
[MVP-VERIFICATION.md](MVP-VERIFICATION.md)에 있다.
Expo SDK 56/Hermes는 아직 검증하지 않았다. Vercel 배포 및 브라우저 검증 상태는
최신 [릴리스 기록](docs/demo-release.md)을 기준으로 한다.
