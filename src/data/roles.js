/**
 * 수학비서 IT 직군 평가 정의.
 * 항목을 바꾸려면 이 파일만 수정하면 UI·계산·내보내기가 전부 따라온다.
 * (항목 개수는 자유 — 평균은 항목 수 기준으로 계산된다.)
 */

export const ROLES = [
  {
    id: 'designer',
    label: '프로덕트 디자이너',
    short: 'PD',
    icon: 'PenTool',
    // Tailwind 클래스는 정적 문자열이어야 빌드에 포함된다 (동적 조합 금지)
    theme: {
      accent: '#7c3aed',
      soft: 'bg-violet-50',
      text: 'text-violet-700',
      ring: 'ring-violet-200',
      chip: 'bg-violet-600 text-white',
      border: 'border-violet-200',
    },
    criteria: [
      {
        id: 'proto',
        label: '빠른 프로토타이핑 & 피벗',
        hint: '아이디어를 화면으로 옮기는 속도, 방향 전환 시 재작업 비용 최소화',
      },
      {
        id: 'uiux',
        label: 'UI/UX 완성도 & 사용자 이해',
        hint: '디테일 품질, 사용자 관찰·리서치 기반의 문제 정의',
      },
      {
        id: 'handoff',
        label: '개발 핸드오프 & 기술 이해',
        hint: '스펙·에셋 전달 정확도, 구현 제약을 고려한 설계',
      },
      {
        id: 'domain',
        label: '도메인 이해 (수학/교육)',
        hint: '수식·문항·학습 흐름 등 교육 도메인 맥락 반영',
      },
      {
        id: 'feedback',
        label: '피드백 수용성 & 리허설',
        hint: '비판적 피드백 소화, 발표·리허설을 통한 설득',
      },
      {
        id: 'schedule',
        label: '일정 준수 및 우선순위',
        hint: '마감 예측 정확도, 중요도에 따른 스코프 조절',
      },
    ],
  },
  {
    id: 'fe',
    label: '프론트엔드 개발자',
    short: 'FE',
    icon: 'MonitorSmartphone',
    theme: {
      accent: '#0284c7',
      soft: 'bg-sky-50',
      text: 'text-sky-700',
      ring: 'ring-sky-200',
      chip: 'bg-sky-600 text-white',
      border: 'border-sky-200',
    },
    criteria: [
      { id: 'poc', label: 'PoC/기능 구현 속도', hint: '요구사항을 동작하는 화면으로 만드는 속도' },
      {
        id: 'perf',
        label: '사용자 경험(UX) & 성능 최적화',
        hint: '렌더링/번들/인터랙션 반응성, 체감 품질',
      },
      {
        id: 'reuse',
        label: '코드 재사용성 & 상태 관리',
        hint: '컴포넌트 설계, 상태 구조의 단순함과 확장성',
      },
      {
        id: 'comm',
        label: '디자이너/BE 연동 소통',
        hint: '스펙 합의, API 계약 조율, 블로커 조기 공유',
      },
      {
        id: 'quality',
        label: '예외 처리 & 품질 검증',
        hint: '엣지 케이스·에러 상태 처리, 배포 전 검증 습관',
      },
      {
        id: 'flex',
        label: '변화 유연성 & 문제 해결',
        hint: '요구 변경 대응, 막힌 문제를 스스로 뚫는 능력',
      },
    ],
  },
  {
    id: 'be',
    label: '백엔드 개발자',
    short: 'BE',
    icon: 'Server',
    theme: {
      accent: '#059669',
      soft: 'bg-emerald-50',
      text: 'text-emerald-700',
      ring: 'ring-emerald-200',
      chip: 'bg-emerald-600 text-white',
      border: 'border-emerald-200',
    },
    criteria: [
      { id: 'api', label: 'API 구현 & 납기 속도', hint: '약속한 일정 안에 동작하는 API 제공' },
      {
        id: 'db',
        label: 'DB 설계 & 데이터 처리 능숙도',
        hint: '스키마 설계, 쿼리 성능, 데이터 정합성',
      },
      {
        id: 'arch',
        label: '시스템 안정성 & 서버 아키텍처',
        hint: '가용성·확장성, 인프라 구조 판단',
      },
      { id: 'spec', label: 'API 명세 및 FE/AI 협업', hint: '문서화 품질, 계약 변경 커뮤니케이션' },
      {
        id: 'debt',
        label: '기술 부채 관리 & 리팩토링',
        hint: '부채 가시화와 상환 계획, 점진적 개선',
      },
      {
        id: 'incident',
        label: '장애 대응 및 문제 해결력',
        hint: '탐지·복구 속도, 재발 방지 조치',
      },
    ],
  },
  {
    id: 'ai',
    label: 'AI 개발자',
    short: 'AI',
    icon: 'BrainCircuit',
    theme: {
      accent: '#d97706',
      soft: 'bg-amber-50',
      text: 'text-amber-700',
      ring: 'ring-amber-200',
      chip: 'bg-amber-600 text-white',
      border: 'border-amber-200',
    },
    criteria: [
      {
        id: 'modelpoc',
        label: 'AI 모델/알고리즘 PoC 속도',
        hint: '가설을 실험으로 옮겨 결과를 내는 속도',
      },
      {
        id: 'accuracy',
        label: '모델 성능 & 정밀도 개선',
        hint: '지표 정의와 실제 개선폭, 오답 분석',
      },
      {
        id: 'pipeline',
        label: 'AI 서비스화 능력 (파이프라인)',
        hint: '학습·추론·배포 파이프라인, 운영 안정성',
      },
      {
        id: 'comm',
        label: '데이터(선생님)/BE 팀 소통',
        hint: '라벨링·데이터 요구 정의, 연동 협업',
      },
      {
        id: 'research',
        label: '최신 AI 기술 탐색 & 적용',
        hint: '신기술 검증 후 제품에 반영하는 판단력',
      },
      {
        id: 'uncertainty',
        label: '불확실성 관리 & 피벗 유연성',
        hint: '실패 실험의 손절, 대안 경로 확보',
      },
    ],
  },
]

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]))

/** 1~5점 각각의 의미 (슬라이더 아래 라벨) */
export const SCORE_LABELS = {
  1: '미흡',
  2: '보완 필요',
  3: '기대 충족',
  4: '기대 상회',
  5: '탁월',
}
