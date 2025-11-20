# 끝말잇기 웹게임 (Astro + React)

이 프로젝트는 Astro와 React를 활용한 끝말잇기 웹게임입니다.  
단어를 입력하면 끝말이 이어지는지 검사하고, 리스트에 추가됩니다.  
향후 실시간 멀티플레이 기능과 DB 연동을 통해 확장할 예정입니다.

---

## 📦 폴더 구조

zapping-zero/
├── public/
│   └── style.css               # 전체 스타일 정의
│
├── src/
│   ├── pages/
│   │   └── index.astro         # 메인 페이지 (Astro)
│   │
│   └── components/
│       └── WordChain.jsx       # React 기반 끝말잇기 컴포넌트
│
├── astro.config.mjs            # Astro 설정 파일 (React 통합 포함)
├── package.json                # 프로젝트 의존성 및 실행 스크립트 정의
├── package-lock.json           # 의존성 버전 고정 정보 (자동 생성됨)
├── README.txt                   # 실행 가이드 및 프로젝트 설명

---

## ⚙️ 실행 방법

1. 압축 해제 후 `zapping-zero` 폴더에서 터미널 실행
zapping-zero 폴더에서, 빈 곳을 shift+우클릭 -> '여기에 powershell 창 열기' 선택

2. 스크립트를 순서대로 입력합니다.

의존성 설치:
npm install

개발 서버 실행:
npm run dev

3. 브라우저에서 접속하기
http://localhost:4321

🧑‍💻 주요 기능
단어 입력 후 끝말이 이어지면 리스트에 추가

틀린 단어 입력 시 경고창 표시

스타일 적용 완료 (모바일 대응 준비 중)

React 컴포넌트로 동적 UI 구현

Astro로 정적 페이지 구성 및 통합 관리

🚀 향후 계획
WebSocket 기반 실시간 멀티플레이

DB 연동 (단어 사전, 사용자 기록)

모바일 최적화 및 PWA 확장

랭킹, 기록, 게임 로비 Astro 페이지로 구성