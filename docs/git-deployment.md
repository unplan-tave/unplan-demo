# Git 자동 배포

2026-11-15 (Asia/Seoul). 기존 `haewonwons-projects/unplan-demo` 프로젝트와 Hobby 플랜을
유지한다. 조직의 비공개 저장소는 해당 플랜의 Git 배포 대상이 아니므로 사용자 선택에
따라 데모를 공개했다. [Vercel 공식 제한](https://vercel.com/docs/git#deploying-private-git-repositories).

## 저장소와 배포 흐름

- 데모: `unplan-tave/unplan-demo`, 공개 저장소. 사용자 선택에 따라 vendor에 포함한
  파서 코드·문서와 데모 이력도 공개한다.
- 코어 원본: `unplan-tave/unplan-parser`, 비공개 유지. 기능 구현 커밋은 `97be135`다.
- 데모 기능 구현과 패키지·검증 증거 커밋은 `c954e60`이다.
- Production branch는 `main`, 다른 브랜치는 Preview로 배포한다.
- Git 연동을 확인했으며 push 자체가 배포를 시작한다. 로컬 CLI 배포로 자동 배포 성공을
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
브랜치 push로 생성된 Preview `dpl_EtNwgeoA23EDmB5GzDPpfemEXDs2`의 출처가
`git`, 커밋이 `c002e2ad8b84aa801ea27ef787220fe6e3a8b12b`임을 API로 확인했다.
GitHub의 Vercel 상태도 success다. 실제 화면에서 후보·초안·메시지 분리·IME 합성 이벤트와
320px/375px 검사 8개 그룹을 통과했다. [Preview 증거](evidence/git-preview-deployment.json),
[브라우저 증거](evidence/git-browser-preview.json).

첫 Git Preview는 원격 `vercel.json`의 포맷 차이로 실패했다. 이 실패는
[별도 기록](evidence/git-preview-initial-failure.json)에 남겼고 성공으로 세지 않았다.
앱 소스의 검사 단계는 유지하고 플랫폼 설정의 포맷 경계를 분리한 뒤 재검증했다.
동일 커밋을 `main`으로 push하여 생성한 Production은
`dpl_4pQP3336DbhqUJnxPHFwHzXsHGMM`이며, 출처 `git`·브랜치 `main`·커밋 SHA와
공유 도메인 연결을 대조했다. 인증 헤더·저장 쿠키·로그인 정보 없는 새 Chrome context에서
같은 8개 그룹을 통과했다. 콘솔·페이지·HTTP 오류는 0건이다.
[Production 배포](evidence/git-production-deployment.json),
[브라우저 검사](evidence/git-browser-production.json),
[공개 자산 해시 대조](evidence/git-production-assets.json),
[GitHub 커밋 상태](evidence/git-commit-status.json).

이 배포 ID들은 자동 배포 기능을 확인한 스냅샷이다. 이후 문서 변경 push도 새 배포를
만드므로 최신 배포는 [Vercel 프로젝트](https://vercel.com/haewonwons-projects/unplan-demo)에서
확인한다. 전체 기능 검사 이력은 [데모 릴리스 기록](demo-release.md)에 있다.

기존 Preview 인증 보호, 플랜, 도메인을 유지한다. 저장소 공개는 Preview 보호 해제를
뜻하지 않는다. 인증 토큰·자동화 bypass 값은 Git 파일이나 배포 문서에 넣지 않는다.

[프로젝트 연결·빌드 설정](evidence/git-auto-deploy.json)에서 GitHub repo와 main,
`npm run check`, 기존 인증 보호를 확인했다. Preview 검사에 사용한 임시 인증은 폐기하여
secret 수가 다시 0개다. [접근 보호 대조](evidence/git-protection.json).

두 레포의 기능 변경은 기존 원격에 커밋·푸시했다. PR과 npm 게시, 유료 플랜 전환,
커스텀 도메인 변경은 수행하지 않았다.
