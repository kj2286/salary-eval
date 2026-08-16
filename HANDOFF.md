# HANDOFF — 수학비서 IT 직군 연봉 평가/산정 앱

## 마지막 작업 (2026-08-16) — **외부 공개 배포 완료 (GitHub Pages)**
- 공개 URL: **https://kj2286.github.io/salary-eval/** (로그인 없이 누구나 접근, 검증 완료)
- 리포: https://github.com/kj2286/salary-eval (public, `main` = 소스 / `gh-pages` = 빌드 산출물)
- 재배포: `npm run deploy` (빌드 → gh-pages 워크트리 반영 → 푸시. `scripts/deploy-pages.sh`)
  ※ `dist/` 는 빌드마다 비워지므로 배포 이력은 git worktree 로 분리해 둠(nested .git 금지).
- `vite.config.js` 에 `base: './'` 추가 — 하위 경로(/salary-eval/) 서빙 대응.
- ⚠️ **Vercel 은 포기함**: `salary-eval-gangs-5471s-projects.vercel.app` 로 배포는 성공(READY)했으나
  Deployment Protection(Vercel Authentication)이 켜져 있어 외부인은 로그인 화면을 봄
  (302 → vercel.com/sso-api 로 확인). 무료 플랜에서 이 보호 해제가 유료 기능이라 GitHub Pages 로 전환.
  Vercel 프로젝트는 남아 있음(삭제하려면 대시보드에서 제거).
- ⚠️ `salary-eval.vercel.app` 은 **타인 프로젝트**(일본어 인사 시스템) — 우리 주소 아님, 혼동 주의.
- 검증: 공개 URL 200 + JS/CSS 200 + 헤드리스 렌더 정상(빈 상태 화면), 재배포 후 타이틀 갱신 확인.

## 마지막 작업 (2026-08-14, 2차) — **분기 평가 + 직원 명부 구조로 전환 완료**
- 요청: "평가항목은 매분기마다 할 수 있게 / 등록된 직원을 선택하는 UI로. 매번 새로 만들지 말 것."
- 데이터 모델 전환(v1 → v2): `employees`(명부) / `evaluations`(직원×분기 1건) / `drafts`(저장 전 편집분,
  `직원id::분기` 키) / `settings`(평가자·웹훅). 평가에는 이름·직무·연봉 **스냅샷**을 저장해 과거 분기 불변.
- 신규/개편 컴포넌트: QuarterSwitcher, EmployeeRoster(선택 UI), EmployeeDialog(등록·수정·삭제),
  EvaluationHistory(최근 6분기 추이), QuarterTable(미평가 포함 현황), ExportBar(이번 분기/전체 범위 토글).
  RoleTabs·RecordsTable 은 삭제(직무 선택은 직원 등록 시 1회).
- 부가 기능: `조정 후 연봉을 명부에 반영`(다음 분기 기준 연봉 갱신), 명부 검색·직무 필터,
  분기 진행률(평가 n/전체), 샘플 직원 4명 시딩.
- 검증 증거 (헤드리스 자동 플로우):
  - `npm run build` 성공(246KB js / 27KB css).
  - 미평가 직원 선택 시 FE 항목 노출·자동 인상률 3.5%(B), 전 항목 5점 → 5.00/S·자동 9%.
  - 저장 → `이프론/2026-Q3/avg=5/S/9%` 레코드 생성(총 4건), 분기 이동 시 Q2 이프론 미평가(3.00)·
    Q2 김디자 3.83 복원·Q3 김디자 4.67 — **분기별 독립 저장 확인**.
  - 명부 반영: 42,000,000 × 1.09 = 45,780,000 정확 반영.
  - 렌더 QA: 1600px/500px 스크린샷 정상, 가로 오버플로 없음.
- 아티팩트(단일 HTML) 재배포: https://claude.ai/code/artifact/f28de40b-226a-4171-9a4c-8ca664505205
- QA 도구: 시드/자동테스트 생성기는 스크래치패드 `make-seed.py` (`python3 make-seed.py test` → dist/seed-test.html).

## 1차 작업 (2026-08-14) — 신규 프로젝트 초기 구축 **완료**
- Vite + React 19 + Tailwind 4 + lucide-react 로 전체 구현. 백엔드 없음(localStorage).
- 구현 범위: 직무 4종 탭(PD/FE/BE/AI) × 6항목 5점 슬라이더 → 실시간 평균·등급(S/A/B/C)·추천 인상률 →
  연봉 계산(인상금액/조정 후 연봉/월 수령액 세전) → 평가 목록 표(합계 인상 재원) →
  CSV·JSON·TSV(시트 붙여넣기)·Apps Script 웹훅 전송.
- 검증 증거:
  - `npm run build` 성공 (231KB js / 25KB css).
  - 등급 경계 단위 확인: 4.5→S, 4.49→A, 3.8→A, 3.79→B, 2.8→B, 2.79→C.
  - 브라우저 자동 플로우(헤드리스): 저장→목록 반영, 슬라이더 조작→평균 2.67/C 동결 즉시 반영,
    직무 탭 전환→BE 항목 교체, 연봉 62,000,000×3.5%→64,170,000 정확.
  - CSV 이스케이프(콤마 포함 값) 및 직무 혼합 시 열 정렬 26열 일치 확인.
  - 렌더 QA 스크린샷: 데스크톱 1440px / 모바일 500px — 가로 오버플로 0 (scrollWidth == clientWidth).
- 미배포: git init·커밋·Vercel 배포는 하지 않음(요청 없음).

## 멈춘 지점
- 없음 (완료).

## 다음 할 일
- 사용자 확인 후: ① git init + 첫 커밋 ② Vercel 배포(Framework: Vite, output `dist`)
- 선택: 평가 항목 가중치, 팀 평균 대비 상대 등급, 예산 상한(총 인상 재원) 제약 기능.

## 미해결 이슈 / 주의
- Google Sheets 전송은 `no-cors` 라 성공 응답을 읽을 수 없음 → 시트에서 직접 확인 필요.
  확실한 경로가 필요하면 "시트용 복사"(TSV) 사용.
- 데이터가 브라우저 localStorage 에만 있으므로 공용 PC 사용 시 주의(개인정보·연봉 데이터).
