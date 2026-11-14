# 로컬 패키지 스냅샷

`npm run parser:sync`로 만든 parser tarball을 여기에 보관한다. `.tgz`는 이 레포에
포함할 의도된 의존성 파일이다. `package.json`, `package-lock.json`, 해당 tarball을
함께 변경해야 독립 체크아웃 및 Vercel의 `npm ci`가 형제 폴더 없이 성공한다.

파일명 끝의 SHA-256 앞 12자리는 같은 개발 버전의 변경을 구분하기 위한 식별자이며,
설치 무결성은 lockfile의 전체 SHA-512 integrity로 확인한다. 소스는 parser 레포에서
관리하고 여기서 tarball을 직접 수정하지 않는다. 정식 게시 후 정확한 레지스트리
버전으로 교체하는 절차는 parser의 `docs/development.md`를 따른다.
