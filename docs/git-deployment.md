# Git 자동 배포

2026-11-15 (Asia/Seoul). 기존 `haewonwons-projects/unplan-demo` 프로젝트를 사용한다.

## 저장소와 배포 흐름

- 데모: `unplan-tave/unplan-demo`, 공개 저장소. 사용자 선택에 따라 vendor에 포함한
  파서 코드·문서와 데모 이력도 공개한다.
- 코어 원본: `unplan-tave/unplan-parser`, 비공개 유지. 기능 구현 커밋은 `97be135`다.
- 데모 기능 구현과 패키지·검증 증거 커밋은 `c954e60`이다.
- Production branch는 `main`, 다른 브랜치는 Preview로 배포한다.
- Git 연동이 확인되면 push 자체가 배포를 시작한다. 로컬 CLI 배포로 자동 배포 성공을
  대신 판정하지 않는다.

## 빌드 계약

`vercel.json`을 배포 설정의 기준으로 사용한다. Root Directory는 레포 루트,
Node는 22.x, 설치는 `npm ci`, 빌드는 `npm run check`, 출력은 `dist`다.
`npm run check`에서 strict TypeScript·ESLint·Prettier를 통과한 뒤 Vite로 빌드한다.
빌드 실패 시 성공한 기존 Production이 유지된다. 원격 빌드에서 플랫폼이 가공하는
`vercel.json`은 전체 포맷 검사 대상에서 제외한다. 저장소의 원본 설정을 수정할 때는
`npx prettier vercel.json --check --ignore-path /dev/null`로 별도 확인한다.

파서 원본 저장소의 push만으로 데모를 갱신하지 않는다. parser를 수정했으면 해당
레포를 검증하고 demo에서 `npm run parser:sync`, `npm run check`,
`node scripts/verify-snapshot.mjs`를 실행한다. 갱신된 manifest·lockfile·vendor tarball을
함께 커밋하여 push한다. Vercel에는 형제 parser 폴더가 필요 없다. npm 게시는 하지 않는다.

## 검증과 접근

`codex/git-auto-deploy` 브랜치 push → Preview 생성·화면 확인 → `main` 반영 →
Production 자동 생성·인증 없는 새 브라우저 확인 순서로 검사한다.
배포 ID·커밋 SHA·검사 결과는 실제 실행 후 이 문서와 evidence에 기록한다.

기존 Preview 인증 보호, 플랜, 도메인을 유지한다. 저장소 공개는 Preview 보호 해제를
뜻하지 않는다. 인증 토큰·자동화 bypass 값은 Git 파일이나 배포 문서에 넣지 않는다.
