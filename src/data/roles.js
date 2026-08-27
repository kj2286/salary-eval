/**
 * 평가 항목 정의.
 *
 * 구조가 예전(직무별 6항목 단순평균)과 다르다. 보상 컨설팅사들이 공통으로 쓰는
 * "core competency(전사 공통) + functional competency(직무 전문)" 2층 구조를 따른다.
 *
 *   도메인 4개
 *   ├ delivery       성과 — 약속한 것을 내놨는가, 그게 제품에 기여했는가   (직무별)
 *   ├ craft          전문성 — 그 산출물의 품질 수준은 어떤가               (직무별)
 *   ├ collaboration  협업 — 전사 공통. 직군이 달라도 기준이 같아야 캘리브레이션이 된다
 *   └ leadership     리더십·영향력 — 전사 공통. 레벨이 올라갈수록 비중이 커진다
 *
 * 최종 점수 = Σ(도메인 평균 × 레벨별 도메인 가중치).
 * 단순평균이 아니라 도메인 평균을 먼저 내므로, 도메인별 항목 개수가 달라도 왜곡되지 않는다.
 *
 * minLevel: 그 레벨 미만에서는 항목 자체를 평가하지 않는다.
 *   신입에게 "조직 기여도"를 묻고 3점을 주는 건 평가가 아니라 노이즈다.
 */

/** 도메인 메타 — 표시 순서가 곧 화면 순서 */
export const DOMAINS = [
  {
    id: 'delivery',
    label: '성과',
    sub: 'Delivery',
    desc: '약속한 산출물을 내놨는가, 그것이 제품·지표에 기여했는가',
    theme: { text: 'text-slate-900', soft: 'bg-slate-100 text-slate-700', bar: 'bg-slate-700' },
  },
  {
    id: 'craft',
    label: '전문성',
    sub: 'Craft',
    desc: '산출물의 품질과 직무 기술 수준',
    theme: { text: 'text-sky-900', soft: 'bg-sky-100 text-sky-700', bar: 'bg-sky-600' },
  },
  {
    id: 'collaboration',
    label: '협업',
    sub: 'Collaboration',
    desc: '전사 공통 — 직군이 달라도 같은 기준으로 본다',
    theme: { text: 'text-emerald-900', soft: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-600' },
  },
  {
    id: 'leadership',
    label: '리더십·영향력',
    sub: 'Leadership',
    desc: '전사 공통 — 타인과 조직에 미친 영향. 레벨이 올라갈수록 비중이 커진다',
    theme: { text: 'text-amber-900', soft: 'bg-amber-100 text-amber-700', bar: 'bg-amber-600' },
  },
]

export const DOMAIN_MAP = Object.fromEntries(DOMAINS.map((d) => [d.id, d]))

/**
 * 전사 공통역량 — 직무와 무관하게 동일한 문항.
 * 이게 직무별로 다르면 "FE 의 A 와 디자이너의 A 가 같은 A 인가" 를 설명할 수 없다.
 */
export const CORE_CRITERIA = [
  {
    id: 'sync',
    domain: 'collaboration',
    label: '진행 투명성 & 조기 공유',
    hint: '진행 상황·지연·블로커를 상대가 대응할 수 있는 시점에 먼저 알린다',
    anchors: {
      L1: '막혔을 때 혼자 오래 붙들지 않고 물어본다',
      L3: '일정 리스크를 발생 전에 신호로 보낸다',
      L5: '조직이 상황을 파악할 수 있는 공유 루틴 자체를 만든다',
    },
  },
  {
    id: 'crossfn',
    domain: 'collaboration',
    label: '직군 간 협업 & 합의',
    hint: '상대 직군의 제약을 이해하고 접점을 조율한다. 떠넘기지 않는다',
    anchors: {
      L1: '요청을 정확히 이해하고 되묻는다',
      L3: '이견을 근거로 좁히고 합의점을 문서로 남긴다',
      L5: '직군 간 반복되는 마찰을 구조로 제거한다',
    },
  },
  {
    id: 'feedback',
    domain: 'collaboration',
    label: '피드백 수용 & 전달',
    hint: '비판을 방어 없이 소화하고, 상대가 행동할 수 있는 형태로 되돌려준다',
    anchors: {
      L1: '피드백을 다음 결과물에 실제로 반영한다',
      L3: '동료에게 구체적이고 실행 가능한 피드백을 준다',
      L5: '피드백이 오가는 문화를 만들고, 불편한 말을 먼저 한다',
    },
  },
  {
    id: 'mentor',
    domain: 'leadership',
    minLevel: 'L2',
    label: '멘토링 & 지식 전파',
    hint: '리뷰·문서·페어링으로 남의 실력을 올린다. 나만 아는 지식을 남긴다',
    anchors: {
      L2: '자기가 배운 것을 기록해 남이 쓸 수 있게 한다',
      L4: '주니어의 성장 속도가 눈에 띄게 빨라진다',
      L5: '팀의 학습 구조(리뷰·온보딩·문서)를 설계한다',
    },
  },
  {
    id: 'direction',
    domain: 'leadership',
    minLevel: 'L3',
    label: '방향 설정 & 의사결정',
    hint: '정보가 부족한 상태에서 근거 있는 선택을 하고, 그 선택을 책임진다',
    anchors: {
      L3: '트레이드오프를 설명하고 결정한 뒤 되돌아보지 않는다',
      L4: '무엇을 하지 않을지를 정해 팀의 스코프를 지킨다',
      L5: '반년 뒤를 보고 방향을 세우고 조직을 설득한다',
    },
  },
  {
    id: 'impact',
    domain: 'leadership',
    minLevel: 'L4',
    label: '조직 기여 & 영향 범위',
    hint: '자기 팀 밖까지 미친 개선. 채용·프로세스·기술 표준 등 재사용되는 기여',
    anchors: {
      L4: '팀 밖에서도 쓰이는 개선을 하나 이상 남긴다',
      L5: '조직의 일하는 방식이 이 사람 때문에 바뀐다',
    },
  },
]

/** 직무 전문역량 — delivery 2 + craft 3 */
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
        id: 'ship',
        domain: 'delivery',
        label: '디자인 산출 & 납기',
        hint: '약속한 범위를 기한 내 전달. 방향 전환 시 재작업 비용을 최소화한다',
      },
      {
        id: 'outcome',
        domain: 'delivery',
        label: '제품 성과 기여',
        hint: '전환·이탈·CS 문의 등 지표 개선, 또는 실제 사용성 문제의 해소로 이어졌는가',
      },
      {
        id: 'problem',
        domain: 'craft',
        label: '문제 정의 & 사용자 리서치',
        hint: '요청받은 화면을 그리는 데 그치지 않고 풀어야 할 문제를 다시 정의한다',
      },
      {
        id: 'visual',
        domain: 'craft',
        label: 'UI 완성도 & 시스템 일관성',
        hint: '디테일 품질, 디자인 시스템 준수와 확장. 일회용 예외를 남기지 않는다',
      },
      {
        id: 'feasible',
        domain: 'craft',
        label: '구현 제약 이해 & 핸드오프',
        hint: '기술 제약을 아는 상태로 설계하고, 개발이 되묻지 않아도 되는 스펙을 넘긴다',
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
      {
        id: 'ship',
        domain: 'delivery',
        label: '기능 구현 & 납기',
        hint: '요구사항을 동작하는 화면으로. 예측한 일정과 실제의 오차가 작다',
      },
      {
        id: 'outcome',
        domain: 'delivery',
        label: '사용자 체감 개선 실적',
        hint: '성능·안정성·사용성 개선이 실제 지표나 사용자 반응으로 확인됐는가',
      },
      {
        id: 'arch',
        domain: 'craft',
        label: '컴포넌트 & 상태 설계',
        hint: '재사용 가능한 구조, 단순하고 확장 가능한 상태 모델',
      },
      {
        id: 'perf',
        domain: 'craft',
        label: '성능 & 접근성',
        hint: '렌더링·번들·인터랙션 반응성, 키보드/스크린리더 등 접근성 기본',
      },
      {
        id: 'quality',
        domain: 'craft',
        label: '예외 처리 & 배포 품질',
        hint: '엣지 케이스·에러 상태, 배포 전 검증 습관, 되돌릴 수 있는 릴리스',
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
      {
        id: 'ship',
        domain: 'delivery',
        label: 'API·기능 납기',
        hint: '약속한 일정 안에 계약대로 동작하는 API 를 제공한다',
      },
      {
        id: 'reliability',
        domain: 'delivery',
        label: '서비스 안정성 실적',
        hint: '장애 빈도·복구 시간(MTTR)·재발 방지가 실제로 개선됐는가',
      },
      {
        id: 'datamodel',
        domain: 'craft',
        label: '데이터 모델링 & 쿼리 성능',
        hint: '스키마 설계, 정합성 보장, 증가하는 데이터에도 버티는 쿼리',
      },
      {
        id: 'arch',
        domain: 'craft',
        label: '시스템 설계 & 확장성',
        hint: '경계 설정, 결합도 관리, 지금 규모와 다음 규모를 모두 고려한 판단',
      },
      {
        id: 'ops',
        domain: 'craft',
        label: '관측성 · 보안 · 기술부채',
        hint: '로그·지표·알람, 인증/권한 처리, 부채의 가시화와 상환 계획',
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
        id: 'ship',
        domain: 'delivery',
        label: '실험 → 제품 반영 사이클',
        hint: '가설을 실험으로 옮기고 제품에 반영하기까지의 속도. 실패 실험의 손절 포함',
      },
      {
        id: 'metric',
        domain: 'delivery',
        label: '모델 성능 개선 실적',
        hint: '정의된 지표 기준의 실제 개선폭. 지표 없는 "좋아졌다"는 인정하지 않는다',
      },
      {
        id: 'eval',
        domain: 'craft',
        label: '평가셋 설계 & 오답 분석',
        hint: '무엇을 측정할지 정하고, 틀린 케이스에서 원인을 뽑아낸다',
      },
      {
        id: 'pipeline',
        domain: 'craft',
        label: '파이프라인 & 비용 관리',
        hint: '학습·추론·배포의 재현성과 운영 안정성, 토큰/GPU 비용에 대한 감각',
      },
      {
        id: 'research',
        domain: 'craft',
        label: '신기술 검증 & 적용 판단',
        hint: '새 기술을 검증한 뒤 도입 여부를 판단한다. 유행을 그대로 들이지 않는다',
      },
    ],
  },
]

export const ROLE_MAP = Object.fromEntries(ROLES.map((r) => [r.id, r]))

/**
 * 해당 직무 × 레벨에서 실제로 평가할 항목 목록.
 * - 레벨 가중치가 0인 도메인은 통째로 제외 (신입의 리더십)
 * - 항목별 minLevel 미만도 제외
 */
export function criteriaFor(role, level) {
  const order = DOMAINS.map((d) => d.id)
  const all = [...(role?.criteria ?? []), ...CORE_CRITERIA]
  const idx = (id) => ['L1', 'L2', 'L3', 'L4', 'L5'].indexOf(id)
  return all
    .filter((c) => (level.weights[c.domain] ?? 0) > 0)
    .filter((c) => !c.minLevel || idx(level.id) >= idx(c.minLevel))
    .sort((a, b) => order.indexOf(a.domain) - order.indexOf(b.domain))
}

/** 도메인별로 묶은 { domain, criteria[] } 목록 (화면 렌더용) */
export function groupedCriteriaFor(role, level) {
  const list = criteriaFor(role, level)
  return DOMAINS.map((d) => ({
    domain: d,
    weight: level.weights[d.id] ?? 0,
    criteria: list.filter((c) => c.domain === d.id),
  })).filter((g) => g.criteria.length > 0)
}

/** 항목의 레벨별 기대 행동 — 해당 레벨 이하에서 가장 가까운 앵커를 고른다 */
export function anchorFor(criterion, levelId) {
  if (!criterion.anchors) return null
  const ids = ['L1', 'L2', 'L3', 'L4', 'L5']
  const at = ids.indexOf(levelId)
  for (let i = at; i >= 0; i -= 1) {
    if (criterion.anchors[ids[i]]) return criterion.anchors[ids[i]]
  }
  return null
}

/** 1~5점 각각의 의미 (슬라이더 아래 라벨) — "기대"의 기준은 레벨별 anchor 가 정한다 */
export const SCORE_LABELS = {
  1: '미흡',
  2: '보완 필요',
  3: '기대 충족',
  4: '기대 상회',
  5: '탁월',
}
