# Unplan Demo

Unplan 한국어 일정 파서의 계약과 향후 실제 동작을 확인하기 위한 Vite + React +
TypeScript 정적 웹이다. 완성된 챗봇은 이번 범위에 포함하지 않는다.

**현재 파서는 미구현이다.** 화면은 입력창, 미구현 결과 영역, 비활성 제안 버튼, 공개
타입과 패키지 연결 확인용 개발 정보만 제공한다. 예시 버튼은 원문만 채운다. 분석 결과를
만들거나 입력을 서버로 전송·저장하지 않는다. 기준 시각은 페이지 진입 시 고정하고
시간대는 브라우저에서 읽는다. 개발 정보의 객체는 파서 입력이며 결과가 아니다.

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
Vercel 로그인·프로젝트 생성·환경변수·실제 배포는 이번에 수행하지 않았다.

스타일 토큰은 `src/tokens.css`, 화면은 `src/App.tsx`다. 다음 구현에서는 실제 parser의
결과를 렌더링하고, 날짜만 있어도 제목 입력이 가능한 초안으로 이어지는 액션을 연결한다.
실제 일정 저장은 입력 변경과 분리한다. 이번 세팅에서는 Git 커밋·푸시·PR을 만들지 않는다.
