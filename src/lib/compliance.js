/**
 * 평가 운영 가드레일.
 *
 * 이 앱은 연봉 금액을 다루지 않으므로 최저임금·밴드 이탈 같은 금액 점검은 여기 없다.
 * 그건 HR 이 실제 연봉에 인상률을 적용하는 단계에서 해야 한다 (README 참고).
 * 여기서 막는 것은 "평가 자체가 나중에 설명 불가능해지는" 지점이다.
 *
 * 근거
 * - 인사평가는 사법심사의 대상이 될 수 있고, 저성과 처우의 합리성은 회사가 소명해야 한다.
 *   → C·D 등급에는 근거 기록을 강제한다.
 * - 근로기준법 제94조 / 대법원 2023. 5. 11. 선고 2017다35588 전원합의체:
 *   취업규칙 불이익 변경에는 집단적 동의가 필요하고, 근로계약이 유리하면 근로계약이 우선한다.
 *   → 이미 정한 연봉액의 삭감은 개별 동의 사안이므로 이 앱은 음수 인상률을 만들지 않는다.
 */

/**
 * 연간 등급 확정 직전 점검.
 * @returns { level: 'block'|'warn', code, message, detail }[]
 */
export function checkDecision({
  finalRate,
  gradeKey,
  memo,
  quarterCount,
  levelChanged,
  recommendedRate,
}) {
  const issues = []

  if (Number(finalRate) < 0) {
    issues.push({
      level: 'block',
      code: 'negative-rate',
      message: '인상률을 음수로 둘 수 없습니다.',
      detail:
        '이미 정한 연봉액의 삭감은 취업규칙 개정만으로 되지 않고 해당 근로자의 개별 동의가 필요합니다(근기법 §94, 대법 2023.5.11. 전합). 동결(0%)까지만 이 화면에서 처리하고, 삭감이 필요하면 HR 이 별도 합의 절차로 진행해야 합니다.',
    })
  }

  if ((gradeKey === 'C' || gradeKey === 'D') && !String(memo ?? '').trim()) {
    issues.push({
      level: 'block',
      code: 'no-evidence',
      message: `${gradeKey} 등급은 근거 메모가 필수입니다.`,
      detail:
        '저성과를 이유로 한 동결·저인상은 다툼이 생기면 그 합리성을 회사가 소명해야 합니다. 관찰한 사실, 이미 전달한 피드백, 합의한 개선 목표를 남기세요.',
    })
  }

  if (
    recommendedRate != null &&
    Math.abs(Number(finalRate) - Number(recommendedRate)) >= 0.05 &&
    !String(memo ?? '').trim()
  ) {
    issues.push({
      level: 'block',
      code: 'override-no-reason',
      message: '추천 인상률과 다르게 확정하려면 사유가 필요합니다.',
      detail: `추천 ${Number(recommendedRate).toFixed(1)}% → 확정 ${Number(finalRate).toFixed(1)}%. 예외를 남기면 다음 사이클에 기준이 무너집니다. 왜 벗어났는지 메모에 남기세요.`,
    })
  }

  if (Number(quarterCount) > 0 && Number(quarterCount) < 2) {
    issues.push({
      level: 'warn',
      code: 'thin-evidence',
      message: `평가된 분기가 ${quarterCount}개뿐입니다.`,
      detail:
        '한 분기 결과만으로 연간 등급을 확정하면 단기 이슈가 과대 반영됩니다. 최소 2개 분기 기록을 권장합니다.',
    })
  }

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

/** 상시 노출 주의사항 */
export const STANDING_NOTES = [
  '이 앱은 연봉 금액을 저장하지 않습니다. 산출물은 등급과 권장 인상률(%)까지이며, 실제 금액 확정은 HR 이 시장 대비 위치(compa-ratio)와 재원을 반영해 진행합니다.',
  '평가 데이터는 개인정보입니다. 공용 PC 사용을 피하고, 수집 목적·보관 기간을 사전에 고지하세요.',
  '등급은 평가 대상 집단 내 상대평가로 배분됩니다. 집단이 바뀌면 같은 점수라도 등급이 달라질 수 있습니다.',
]

export const hasBlocking = (issues) => issues.some((i) => i.level === 'block')
