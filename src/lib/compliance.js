/**
 * 한국 노동법·HR 실무 가드레일.
 *
 * 이 앱은 법률 자문을 하지 않는다. 다만 "계산기가 시키는 대로 눌렀다가
 * 분쟁이 되는" 전형적인 지점에서 멈춰 세우는 역할은 한다.
 *
 * 근거
 * - 근로기준법 제94조: 취업규칙을 근로자에게 불리하게 변경하려면 과반수 노조(없으면
 *   근로자 과반수)의 집단적 동의가 필요하다.
 * - 대법원 2023. 5. 11. 선고 2017다35588 전원합의체: 집단적 동의 없이 불이익 변경한
 *   취업규칙은 "사회통념상 합리성"만으로는 유효해지지 않는다.
 * - 근로계약이 취업규칙보다 유리하면 근로계약이 우선한다 → 취업규칙 개정만으로
 *   이미 정한 연봉액을 깎을 수 없다. 삭감은 개별 근로자의 동의 사안이다.
 * - 인사평가는 사법심사의 대상이 될 수 있다. 저성과 처우의 근거 기록이 곧 방어 수단이다.
 * - 2026년 최저임금 시간급 10,320원 (월 209시간 환산 2,156,880원 / 연 25,882,560원).
 */

import { MINIMUM_WAGE } from '../data/market.js'

export const LEVELS_OF_CONCERN = { block: 'block', warn: 'warn', info: 'info' }

/**
 * 확정 직전에 돌리는 점검.
 * @returns { level, code, message, detail }[]  — level 'block' 이면 저장을 막는다
 */
export function checkCompensation({
  base,
  finalRate,
  newSalary,
  band,
  gradeKey,
  memo,
  quarterCount,
  levelChanged,
}) {
  const issues = []

  /* 1) 임금 삭감 — 계산기로 처리할 사안이 아니다 */
  if (Number(finalRate) < 0) {
    issues.push({
      level: 'block',
      code: 'negative-rate',
      message: '인상률을 음수로 둘 수 없습니다.',
      detail:
        '이미 정한 연봉액의 삭감은 취업규칙 개정만으로 되지 않고 해당 근로자의 개별 동의가 필요합니다(근기법 §94, 대법 2023.5.11. 전합). 동결(0%)까지만 이 화면에서 처리하고, 삭감이 필요하면 별도 합의 절차로 진행하세요.',
    })
  }

  /* 2) 최저임금 — 연봉을 12로 나눈 단순 비교라 보수적으로만 본다 */
  if (newSalary > 0 && newSalary < MINIMUM_WAGE.annual) {
    issues.push({
      level: 'block',
      code: 'minimum-wage',
      message: `조정 후 연봉이 ${MINIMUM_WAGE.year}년 최저임금 연환산액(${MINIMUM_WAGE.annual.toLocaleString()}원)에 미달합니다.`,
      detail: `시간급 ${MINIMUM_WAGE.hourly.toLocaleString()}원 × 월 ${MINIMUM_WAGE.monthlyHours}시간 기준. 실제 위반 여부는 최저임금 산입 범위(정기상여·복리후생비 등)에 따라 달라지므로 급여 담당자 확인이 필요합니다.`,
    })
  }

  /* 3) 저성과 처우의 근거 — 기록이 없으면 나중에 설명할 방법이 없다 */
  if ((gradeKey === 'C' || gradeKey === 'D') && !String(memo ?? '').trim()) {
    issues.push({
      level: 'block',
      code: 'no-evidence',
      message: `${gradeKey} 등급은 평가 근거 메모가 필수입니다.`,
      detail:
        '저성과를 이유로 한 동결·저인상은 다툼이 생기면 그 합리성을 회사가 소명해야 합니다. 관찰한 사실, 이미 준 피드백, 합의한 개선 목표를 남기세요.',
    })
  }

  /* 4) 근거 분기 수 */
  if (Number(quarterCount) > 0 && Number(quarterCount) < 2) {
    issues.push({
      level: 'warn',
      code: 'thin-evidence',
      message: `평가된 분기가 ${quarterCount}개뿐입니다.`,
      detail:
        '한 분기 결과만으로 연간 보상을 확정하면 단기 이슈가 과대 반영됩니다. 최소 2개 분기 기록을 권장합니다.',
    })
  }

  /* 5) 밴드 이탈 */
  if (band?.max && newSalary > band.max) {
    issues.push({
      level: 'warn',
      code: 'above-band',
      message: '조정 후 연봉이 해당 레벨 밴드 상한을 넘습니다.',
      detail: levelChanged
        ? '승급을 반영한 결과라면 밴드 자체를 재검토하세요.'
        : '레벨 대비 과다 보상입니다. 승급 심사로 올리거나, 인상 대신 일시금(사이닝/성과급)으로 처리하는 편이 밴드 붕괴를 막습니다.',
    })
  }
  if (band?.min && newSalary > 0 && newSalary < band.min) {
    issues.push({
      level: 'warn',
      code: 'below-band',
      message: '조정 후에도 밴드 하한 미만입니다.',
      detail:
        '시장 대비 낮은 보상은 이탈 위험이 가장 큰 신호입니다. 재원이 부족하면 다음 사이클 계획이라도 함께 제시하세요.',
    })
  }

  /* 6) 승급 없는 큰 폭 인상 */
  if (!levelChanged && Number(finalRate) >= 15) {
    issues.push({
      level: 'warn',
      code: 'large-jump',
      message: `승급 없이 ${Number(finalRate).toFixed(1)}% 인상입니다.`,
      detail:
        '통상 이 정도 폭은 레벨 자체가 잘못 매겨져 있었다는 뜻입니다. 레벨 재조정(승급)으로 처리하는 편이 다음 해 기준선이 깨끗합니다.',
    })
  }

  return issues
}

/** 상시 노출 주의사항 — 화면 하단 고지 */
export const STANDING_NOTES = [
  '이 앱의 산정 결과는 참고안입니다. 최종 연봉은 근로계약·취업규칙·회사 재원에 따라 확정하세요.',
  '평가·연봉 데이터는 개인정보입니다. 공용 PC 사용을 피하고, 사용 목적·보관 기간을 사전에 고지하세요.',
  '인상률은 계약 연봉(기본급 기준) 인상률입니다. 포괄임금·고정연장수당이 포함된 계약이면 통상임금 재산정이 필요할 수 있습니다.',
]

export const hasBlocking = (issues) => issues.some((i) => i.level === 'block')
