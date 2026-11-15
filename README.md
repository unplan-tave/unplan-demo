# Unplan Demo

공유 데모: [unplan-demo.vercel.app](https://unplan-demo.vercel.app).
배포 식별 정보와 검증 결과는 [릴리스 기록](docs/demo-release.md)에 있다.

Unplan 한국어 일정 파서의 P0 대화 제안을 확인하는 Vite + React + TypeScript 정적 웹이다.
메시지를 전송하면 공개 패키지의 실제 `parseSchedule`로 분석한다. 한 행동의 오전·오후
후보 중 하나를 골라 제목·날짜·시간 초안을 편집하고 닫거나 다시 선택할 수 있다.
실제 저장·서버·DB·사용자 입력 수집은 없다.

메시지마다 원문·기준 시각·시간대·후보를 고정한다. 기본 기준 시각은 전송할 때 생성하며
개발 정보의 검증용 context는 이후 메시지에만 적용한다. 전송한 원문의 편집은 제공하지
않는다. 근사 시각은 초안까지 보존하고 충돌·부정·질문·미지원 구문은 보류한다.
제목을 정리할 수 없으면 원문 잔여를 보여 주고 편집해서 다시 보내도록 안내한다.

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
`src/ParseResultView.tsx`, 후보 선택은 `src/App.tsx`, 초안은
`src/DraftAction.tsx`다. 파서 로직과 계약 타입은 복사하지 않는다.

## 브라우저 확인

```sh
# 별도 터미널에서 npm run dev 실행 후
npx playwright install chromium
npm run test:browser
# 기존 Chrome 사용 시: BROWSER_EXECUTABLE='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' npm run test:browser
```

메시지 전송·후보 선택·재선택, 제목 없는/미완성 시간 초안, context 분리, IME·키보드와 320px/375px 화면을
검증하고 `artifacts/`에 스크린샷·결과를 남긴다. 이전 MVP 검증은
[MVP-VERIFICATION.md](MVP-VERIFICATION.md), 현재 대화형 제안 검증은
[릴리스 기록](docs/demo-release.md)에 있다.
Expo SDK 56/Hermes는 아직 검증하지 않았다. Vercel 배포 및 브라우저 검증 상태는
최신 [릴리스 기록](docs/demo-release.md)을 기준으로 한다.

`node scripts/verify-snapshot.mjs`는 manifest·lockfile·vendor integrity·런타임 export·빌드 해시를 대조한다.

## Git 자동 배포

[자동 배포 설정과 검증](docs/git-deployment.md)을 참고한다. `main`은 Production,
다른 브랜치는 Preview이며 `vercel.json`의 `npm run check`를 빌드 단계에서 실행한다.
파서 변경은 새 vendor 스냅샷을 데모에 반영해 함께 push해야 배포된다.
