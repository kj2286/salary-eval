# 수학비서 · IT 직군 분기 평가 / 연봉 산정 앱

**등록된 직원**을 **분기마다** 평가한다. 매번 새로 입력하지 않고, 명부에서 직원을 고르면
그 직원의 직무 항목·현재 연봉·이전 분기 이력이 따라온다.

- **스택**: Vite + React 19 + Tailwind CSS 4 + lucide-react (백엔드 없음)
- **데이터**: 전부 브라우저 `localStorage`. 서버 전송은 Google Sheets 웹훅을 설정한 경우에만 발생

## 실행

```bash
npm install
npm run dev       # http://localhost:5180
npm run build     # dist/ 정적 산출물
npm run preview   # 빌드 결과 확인 (http://localhost:4173)
```

## 사용 흐름

1. **직원 등록** — 좌측 명부에서 `직원 추가`. 이름·직무·현재 연봉을 한 번만 입력한다.
   (직원이 없으면 "샘플 직원 4명 넣어보기"로 바로 체험 가능)
2. **분기 선택** — 헤더의 `◀ 2026년 3분기 ▶`. 평가는 언제나 "선택된 분기 × 선택된 직원" 한 칸에 저장된다.
3. **직원 선택 후 평가** — 명부에서 이름을 누르면 그 직무의 6개 항목이 뜬다. 점수 조절 → 평균·등급·추천 인상률 실시간 갱신.
4. **저장** — `이 분기 평가 저장`. 이미 저장된 분기면 버튼이 `평가 수정 저장`으로 바뀐다.
   저장 전 편집분은 `작성 중` 배지로 남고 브라우저를 닫아도 유지된다(`되돌리기`로 폐기).
5. **연봉 확정** — 최종 인상률 조정 후, 필요하면 `조정 후 연봉을 명부에 반영`으로 명부의 현재 연봉을 갱신한다
   (다음 분기부터 이 금액이 기준이 된다).

명부 각 행의 배지가 **선택한 분기**의 상태다: 등급(저장 완료) / `작성 중` / 점선 원(미평가).
하단 표는 그 분기의 전 직원 현황으로, 미평가자도 행으로 남아 누락이 드러난다.

## 구조

```
src/
├─ App.jsx                  상태 오케스트레이션(명부·분기·평가 저장/수정)
├─ data/roles.js            직군 4종 × 평가 항목 정의 ← 항목 변경은 여기만 수정
├─ lib/
│  ├─ grading.js            평균 → 등급 → 추천 인상률 → 연봉 계산 (순수 함수)
│  ├─ quarters.js           '2026-Q3' 문자열 기반 분기 이동/표기
│  ├─ format.js             원화/숫자/날짜 포맷
│  ├─ exporters.js          CSV · JSON 백업 · TSV(시트 붙여넣기) · Apps Script 전송
│  └─ storage.js            localStorage 백업 useState + 저장 키
└─ components/
   ├─ QuarterSwitcher.jsx   분기 이동 + 진행률(평가 n/전체)
   ├─ EmployeeRoster.jsx    직원 명부 = 평가 대상 선택 UI (검색·직무 필터·분기 상태 배지)
   ├─ EmployeeDialog.jsx    직원 등록/수정/삭제 모달
   ├─ ScoreSlider.jsx       항목 1개 = 슬라이더 + 숫자 입력(동일 값)
   ├─ GradeSummary.jsx      실시간 평균·등급·추천 인상률 범위
   ├─ EvaluationHistory.jsx 최근 6분기 추이(클릭하면 그 분기로 이동)
   ├─ SalaryPanel.jsx       현재 연봉 · 최종 인상률 → 3개 결과 타일 + 명부 반영
   ├─ QuarterTable.jsx      분기 현황표(미평가 포함) + 인상 재원 합계
   ├─ ExportBar.jsx         범위(이번 분기/전체) 내보내기, 백업/복원
   └─ ui.jsx                Card · Button · Field · StatTile
```

### 데이터 모델 (localStorage)

| 키 | 내용 |
|---|---|
| `salary-eval:employees:v2` | 직원 명부 `{id, name, roleId, currentSalary, joinedAt, active}` |
| `salary-eval:evaluations:v2` | 평가 `{id, employeeId, quarter:'2026-Q3', scores, average, grade, finalRate, ...}` |
| `salary-eval:drafts:v2` | 저장 전 편집분 (`직원id::분기` 키) |
| `salary-eval:settings:v2` | 평가자 이름, 시트 웹훅 URL |

평가에는 저장 시점의 **이름·직무·연봉 스냅샷**이 함께 들어간다. 이후 명부가 바뀌어도 과거 분기 기록은 변하지 않는다.

## 산출 로직

| 평균 점수 | 등급 | 추천 인상률 |
|---|---|---|
| 4.5 이상 | **S** (탁월) | 8.0% ~ 10.0%+ |
| 3.8 이상 ~ 4.5 미만 | **A** (우수) | 5.0% ~ 7.0% |
| 2.8 이상 ~ 3.8 미만 | **B** (기대 충족) | 3.0% ~ 4.0% |
| 2.8 미만 | **C** (개선 필요) | 0.0% (동결) |

```
평균         = 6개 항목 점수 합 / 6        (미입력 항목은 3점으로 간주)
인상 금액    = 현재 연봉 × 인상률 / 100     (원 단위 반올림)
조정 후 연봉 = 현재 연봉 + 인상 금액
월 수령(세전) = 조정 후 연봉 / 12
```

최종 인상률은 기본적으로 등급 추천 범위의 **중앙값이 자동 적용**("자동" 배지)되며,
직접 조정하면 수동 값이 되고 `추천값 적용`으로 되돌릴 수 있다. 범위를 벗어나면 경고 문구가 뜬다(입력은 막지 않음).

기준 변경은 `src/lib/grading.js`의 `GRADES`, 평가 항목 변경은 `src/data/roles.js`의 `criteria`만 고치면
UI·CSV 열까지 자동 반영된다.

## 내보내기

범위 토글(`이번 분기` / `전체 분기`)이 CSV·시트 복사·Sheets 전송에 적용된다.

| 버튼 | 동작 |
|---|---|
| CSV | `연봉평가_2026-Q3.csv` (엑셀 한글 깨짐 방지 BOM 포함, 분기 열 포함) |
| 시트용 복사 | TSV를 클립보드에 복사 → 구글 시트에 ⌘V 하면 표로 분리됨 |
| Sheets 전송 | Apps Script 웹앱 URL로 POST |
| 백업(JSON) | 명부 + 전체 평가를 통째로 저장 |
| 복원 | 백업 JSON 로드(같은 `id`는 중복 제거) |

### Google Sheets 연동 (Apps Script)

구글 시트 → **확장 프로그램 → Apps Script** 에 아래를 붙여넣고
**배포 → 새 배포 → 웹 앱**(액세스: 모든 사용자)으로 배포한 뒤, 발급된 `/exec` URL을 앱에 입력한다.

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents)
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
  const rows = data.rows || []
  if (!rows.length) return ContentService.createTextOutput('no rows')

  const headers = Object.keys(rows[0])
  if (sheet.getLastRow() === 0) sheet.appendRow(headers)
  rows.forEach(function (row) {
    sheet.appendRow(headers.map(function (h) { return row[h] }))
  })
  return ContentService.createTextOutput('ok')
}
```

> 브라우저 CORS 제약으로 전송은 `no-cors`로 나가며 응답을 읽을 수 없다.
> 전송 후 시트에서 실제 반영 여부를 확인할 것. 확실한 경로가 필요하면 "시트용 복사" 사용.

## 알아둘 점

- 데이터는 브라우저에 남으므로 **개인 PC/계정에서만 사용**. 정기 백업(JSON) 권장.
- 퇴사 처리(재직 체크 해제)한 직원은 분기 현황 집계에서 빠지지만, 이미 저장된 과거 평가는 남는다.
- 분기 현황표는 좁은 화면에서 가로 스크롤된다. `⌘P` 인쇄 시 버튼·관리 열은 숨겨진다.
