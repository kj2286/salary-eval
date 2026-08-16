import { useRef, useState } from 'react'
import {
  ClipboardCheck,
  Copy,
  Download,
  FileJson,
  FileSpreadsheet,
  Send,
  Upload,
} from 'lucide-react'
import { Button, inputClass } from './ui.jsx'
import {
  copyToClipboard,
  downloadFile,
  sendToSheets,
  toCsv,
  toJson,
  toTsv,
} from '../lib/exporters.js'
import { todayISO } from '../lib/format.js'

const SCOPES = [
  { id: 'quarter', label: '이번 분기' },
  { id: 'all', label: '전체 분기' },
]

/** 내보내기 — CSV/TSV/시트 전송은 선택한 범위, JSON 백업은 명부까지 통째로 */
export default function ExportBar({
  quarter,
  quarterEvaluations,
  allEvaluations,
  employees,
  webhook,
  onWebhookChange,
  onImport,
  onToast,
}) {
  const fileRef = useRef(null)
  const [scope, setScope] = useState('quarter')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const records = scope === 'quarter' ? quarterEvaluations : allEvaluations
  const suffix = scope === 'quarter' ? quarter : '전체'

  const guard = (fn) => () => {
    if (!records.length) return onToast('내보낼 평가가 없습니다.', 'error')
    fn()
  }

  const handleCsv = guard(() =>
    downloadFile(`연봉평가_${suffix}.csv`, toCsv(records), 'text/csv'),
  )

  const handleJson = () =>
    downloadFile(
      `연봉평가_백업_${todayISO()}.json`,
      toJson({ employees, evaluations: allEvaluations }),
      'application/json',
    )

  const handleCopy = guard(async () => {
    const ok = await copyToClipboard(toTsv(records))
    onToast(
      ok ? '구글 시트에 붙여넣기(⌘V) 하세요 — 표로 자동 분리됩니다.' : '복사에 실패했습니다.',
      ok ? 'success' : 'error',
    )
  })

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text())
      const employeeRows = parsed.employees ?? []
      const evaluationRows = parsed.evaluations ?? (Array.isArray(parsed) ? parsed : [])
      if (!employeeRows.length && !evaluationRows.length) {
        throw new Error('employees / evaluations 를 찾을 수 없습니다.')
      }
      onImport({ employees: employeeRows, evaluations: evaluationRows })
      onToast(`직원 ${employeeRows.length}명 · 평가 ${evaluationRows.length}건을 불러왔습니다.`)
    } catch (err) {
      onToast(`불러오기 실패: ${err.message}`, 'error')
    } finally {
      event.target.value = ''
    }
  }

  const handleSend = async () => {
    if (!records.length) return onToast('내보낼 평가가 없습니다.', 'error')
    setSending(true)
    try {
      const { sent } = await sendToSheets(webhook, records)
      onToast(`${sent}건 전송 요청 완료 — 시트에서 반영 여부를 확인하세요.`)
    } catch (err) {
      onToast(`전송 실패: ${err.message}`, 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="no-print">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl bg-slate-100 p-0.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setScope(s.id)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                scope === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              {s.label}
              <span className="ml-1 tabular-nums opacity-60">
                {s.id === 'quarter' ? quarterEvaluations.length : allEvaluations.length}
              </span>
            </button>
          ))}
        </div>

        <Button icon={FileSpreadsheet} onClick={handleCsv}>
          CSV
        </Button>
        <Button icon={Copy} onClick={handleCopy}>
          시트용 복사
        </Button>
        <Button icon={Send} variant={sheetOpen ? 'primary' : 'outline'} onClick={() => setSheetOpen((v) => !v)}>
          Sheets 전송
        </Button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <Button icon={FileJson} onClick={handleJson}>
          백업(JSON)
        </Button>
        <Button icon={Upload} onClick={() => fileRef.current?.click()}>
          복원
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {sheetOpen ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <ClipboardCheck size={14} strokeWidth={1.75} />
            Apps Script 웹앱 URL
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
            구글 시트 → 확장 프로그램 → Apps Script 에 <code>doPost</code> 스크립트(README 참고)를
            배포한 뒤 “웹 앱 URL”을 붙여넣으세요. 브라우저 보안(CORS) 때문에 응답은 확인할 수
            없으므로 전송 후 시트에서 직접 확인해야 합니다.
          </p>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
            <input
              value={webhook}
              onChange={(e) => onWebhookChange(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfy.../exec"
              className={inputClass}
            />
            <Button
              variant="primary"
              icon={Download}
              onClick={handleSend}
              disabled={sending || !webhook}
              className="shrink-0"
            >
              {sending ? '전송 중…' : `${records.length}건 전송`}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
