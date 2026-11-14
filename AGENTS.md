# unplan-demo 작업 지침

## 역할과 경계

- Vite + React + TypeScript 정적 웹에서 parser의 계약과 동작을 검증한다.
- 관련 레포: `https://github.com/unplan-tave/unplan-parser`, 로컬 기본 경로
  `../unplan-parser`. 공개 API·정책·지원 표현은 parser의 `docs/`에서 관리한다.
  기준: [API](https://github.com/unplan-tave/unplan-parser/blob/main/docs/public-api.md),
  [정책](https://github.com/unplan-tave/unplan-parser/blob/main/docs/interpretation-policy.md),
  [예시](https://github.com/unplan-tave/unplan-parser/blob/main/docs/examples.md).
- 파서 로직을 복사하거나 데모 안에 정규식 파서를 구현하지 않는다. 공개 패키지
  `@unplan-tave/parser`의 루트 export만 사용한다. 소스 경로 alias/deep import를 금지한다.
- 실제 parseSchedule로 입력 전체를 분석한다. 하드코딩 결과를 실제 인식으로 표시하지
  않는다. 정책에 맞으면 편집 초안을 열되 실제 일정은 저장하지 않는다.

## 개발 규칙

- npm, 독립 lockfile, `.nvmrc`, strict TypeScript, ESLint, Prettier를 유지한다.
- React 기본 기능과 작은 CSS 토큰 파일 `src/tokens.css`를 사용한다. 불필요한 UI
  라이브러리, 전역 상태, 챗봇, 서버, 계정, 데이터베이스를 추가하지 않는다.
- 레이블·키보드 포커스·모바일 너비를 고려한다. 날짜가 있어도 제목이 없을 수 있다는
  제품 흐름을 유지한다. 입력 변경만으로 저장하지 않는다.
- 코어의 시각/시간대는 호출자가 전달한다. 페이지 진입 시 context를 고정하고 입력 변경 시
  실제 parser를 호출한다. 개발 정보에서 context를 편집할 수 있다.
- 공개 타입 변경은 parser 문서·타입을 먼저 맞추고 `npm run parser:sync`로 반영한다.
  API 계약을 데모에서 별도로 정의하거나 복사하지 않는다.
- 로컬 연결은 tarball을 사용한다. `package.json`, `package-lock.json`, `vendor/*.tgz`를
  함께 관리한다. Vercel 빌드에서 `../unplan-parser`가 있다고 가정하지 않는다.
- 기존 unplan-app UI나 Expo 폴더/규칙을 복사하지 않는다.

## 변경 후 검증

```sh
npm ci
npm run check
npm run dev
```

parser 변경이 있을 때 먼저 `npm run parser:sync`를 실행한다. 브라우저에서 입력 예시,
직접 입력, 필드 상태·진단·근거, 버튼 조건, 제목 없는/미완성 시간 초안,
개발 정보, 좁은 화면과 키보드를 확인한다. `npm run test:browser`로 재실행할 수 있다.
`npm run build`는 Vercel과 같은 정적 `dist/`를 생성한다. 배포 검증은 별도 요청에 따른다.
게시·배포·Git 커밋·푸시·PR은 요청 범위에 있을 때만 수행한다.
