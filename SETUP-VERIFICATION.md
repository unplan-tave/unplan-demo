# 초기 세팅 검증 기록

이 문서는 alpha.0 초기 세팅 당시의 과거 기록이다. 현재 실제 파서 연결·초안과 검증은
[MVP-VERIFICATION.md](MVP-VERIFICATION.md)를 기준으로 한다.

2026-11-14 (Asia/Seoul), Node 22.20.0 / npm 10.9.3 기준.

- `npm ci`: 통과.
- `npm run check`: strict 타입 검사, ESLint, Prettier, Vite production build 통과.
- `npm run parser:sync`: parser의 실제 npm pack을 vendor tarball로 설치. 공개 타입
  `ParseInput`, `ParserInfo` 및 ESM 메타데이터 import 확인.
- 형제 parser 폴더가 없는 `/private/tmp/` 독립 복사본에서도 `npm ci`와 `npm run check` 통과.
  이번에 다운로드한 별도 npm 캐시를 사용했다.
- dev 서버 HTTP 200 확인. 브라우저에서 예시 선택, 직접 입력, 개발 정보 펼치기,
  입력 객체 갱신, 미구현 결과, 비활성 추가 버튼을 확인했다.
- Vercel용 설정과 정적 dist를 준비했다. 실제 Vercel 배포나 모바일 기기 실행은 하지 않았다.

자연어 파서는 미구현이다. 입력 예시를 테스트 통과 사례로 간주하지 않는다.
계약·정책·기대 결과의 기준은 parser의 `docs/`다.

`npm audit --omit=dev`: 취약점 0개. 전체 audit에서는 typescript-eslint → minimatch의
moderate 7개 영향 항목(high/critical 0개)을 보고했다. 근본 advisory는 하나이며,
상위 도구의 호환 업데이트가 필요하다. 자세한 판단은 parser의
[초기 검증 기록](../unplan-parser/SETUP-VERIFICATION.md)에 남겼다.

다음 단계는 parser 엔진 구현, 실제 결과 렌더링 및 제목 없는 날짜 초안을 편집하는
액션 연결이다. npm 게시·Vercel 배포·Git 커밋·푸시·PR 생성은 수행하지 않았다.
