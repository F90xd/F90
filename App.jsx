import { useEffect, useMemo, useState, useCallback } from 'react'
import { Crown, Settings as SettingsIcon, CheckCircle2, AlertCircle, XCircle, Copy } from 'lucide-react'

import CustomerForm from './components/CustomerForm.jsx'
import Calculator from './components/Calculator.jsx'
import CalculationResults from './components/CalculationResults.jsx'
import VipTable from './components/VipTable.jsx'
import CustomerHistory from './components/CustomerHistory.jsx'
import ContactSection from './components/ContactSection.jsx'
import SettingsPanel from './components/Settings.jsx'

import {
  loadSettings,
  saveSettings,
  loadVipLevels,
  saveVipLevels,
  loadCustomers,
  upsertCustomer,
  deleteCustomer as deleteCustomerFromStorage,
  loadCalculations,
  addCalculation,
  deleteCalculation as deleteCalculationFromStorage,
  getNextCounter,
  exportAllData,
  importAllData,
  clearAllData,
  validateImportedData
} from './utils/storage.js'

import {
  generateTransitions,
  areDeficitsComplete,
  buildCalculationSummary,
  parseLocaleNumber
} from './utils/calculations.js'

import { buildFullSummaryText, buildLiveModeSummaryText, copyTextToClipboard } from './utils/summaryText.js'

function formatDateLocal(date) {
  const d = String(date.getDate()).padStart(2, '0')
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const y = date.getFullYear()
  return `${d}/${m}/${y}`
}

function formatTimeLocal(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${min}`
}

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export default function App() {
  // ---------------------------- بيانات دائمة ----------------------------
  const [settings, setSettings] = useState(() => loadSettings())
  const [vipLevels, setVipLevels] = useState(() => loadVipLevels())
  const [customers, setCustomers] = useState(() => loadCustomers())
  const [calculations, setCalculations] = useState(() => loadCalculations())

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    saveVipLevels(vipLevels)
  }, [vipLevels])

  // ---------------------------- حالة نموذج الحساب ----------------------------
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [currentVip, setCurrentVip] = useState(1)
  const [targetVip, setTargetVip] = useState(2)
  const [multiplier, setMultiplier] = useState(1)
  const [deficits, setDeficits] = useState({})
  const [existingCustomerNote, setExistingCustomerNote] = useState('')

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, key: Date.now() })
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3800)
    return () => clearTimeout(t)
  }, [toast])

  // ---------------------------- منطق الانتقالات ----------------------------
  const transitions = useMemo(() => generateTransitions(currentVip, targetVip), [currentVip, targetVip])
  const targetError = targetVip <= currentVip ? 'المستوى المستهدف يجب أن يكون أعلى من المستوى الحالي.' : ''

  function handleDeficitChange(fromLevel, value) {
    setDeficits((prev) => ({ ...prev, [fromLevel]: value }))
  }

  const targetLevelData = vipLevels.find((l) => l.level === targetVip)
  const targetMaintainValue = targetLevelData?.maintain || 0

  const summary = useMemo(
    () =>
      buildCalculationSummary({
        currentLevel: currentVip,
        targetLevel: targetVip,
        multiplier,
        deficits,
        targetMaintainValue,
        prices: settings.prices
      }),
    [currentVip, targetVip, multiplier, deficits, targetMaintainValue, settings.prices]
  )

  // ---------------------------- التحقق قبل الحفظ ----------------------------
  function validateBeforeSave() {
    if (!customerId.trim()) return 'أدخل ID المستخدم قبل حفظ العملية.'
    if (targetVip <= currentVip) return 'المستوى المستهدف يجب أن يكون أعلى من المستوى الحالي.'
    if (multiplier < 1 || multiplier > 10) return 'اختر عرضًا من ×1 إلى ×10.'
    if (transitions.length === 0) return 'اختر مستوى حالي ومستوى مستهدف لإظهار الانتقالات.'
    if (!areDeficitsComplete(transitions, deficits)) return 'أدخل قيمة الناقص لهذا الانتقال.'
    for (const t of transitions) {
      const val = parseLocaleNumber(deficits[t.from])
      if (val !== null && val < 0) return 'لا يُسمح بإدخال قيم سالبة.'
    }
    return ''
  }

  const validationMessage = validateBeforeSave()
  const canSave = validationMessage === ''

  // ---------------------------- بيانات العميل ----------------------------
  function handleCustomerIdBlur() {
    const trimmed = customerId.trim()
    if (!trimmed) {
      setExistingCustomerNote('')
      return
    }
    const existing = customers[trimmed]
    if (existing) {
      if (!customerName.trim()) setCustomerName(existing.name || '')
      const count = calculations.filter((c) => c.customerId === trimmed).length
      setExistingCustomerNote(`تم العثور على عميل سابق: ${existing.name || 'بدون اسم'} — عدد العمليات المحفوظة: ${count}`)
    } else {
      setExistingCustomerNote('عميل جديد — سيتم إنشاء سجل له عند حفظ أول عملية.')
    }
  }

  // ---------------------------- حفظ عملية ----------------------------
  function saveOperation(mode) {
    const error = validateBeforeSave()
    if (error) {
      showToast(error, 'error')
      return
    }

    const trimmedId = customerId.trim()
    const now = new Date()
    const savedTransitions = transitions.map((t) => ({
      from: t.from,
      to: t.to,
      deficit: parseLocaleNumber(deficits[t.from]) || 0
    }))

    const modeData = mode === 'with' ? summary.withMaintain : summary.withoutMaintain

    const calcRecord = {
      id: makeId(),
      sequence: getNextCounter(),
      customerId: trimmedId,
      customerName: customerName.trim(),
      currentVip,
      targetVip,
      multiplier,
      transitions: savedTransitions,
      totalAccess: summary.totalAccess,
      maintainMode: mode,
      maintainValue: mode === 'with' ? summary.withMaintain.maintainValue : 0,
      totalWithMaintain: mode === 'with' ? summary.withMaintain.totalWithMaintain : summary.totalAccess,
      shipping: modeData.shipping,
      jod: modeData.jod,
      usd: modeData.usd,
      coins: modeData.coins,
      pricesUsed: { ...settings.prices },
      timestamp: now.getTime(),
      dateStr: formatDateLocal(now),
      timeStr: formatTimeLocal(now)
    }

    addCalculation(calcRecord)
    setCalculations((prev) => [...prev, calcRecord])

    const updatedCustomer = upsertCustomer(trimmedId, customerName)
    setCustomers((prev) => ({ ...prev, [trimmedId]: updatedCustomer }))

    showToast(
      `تم حفظ العملية #${String(calcRecord.sequence).padStart(6, '0')} (${mode === 'with' ? 'مع تثبيت' : 'بدون تثبيت'}).`,
      'success'
    )
  }

  // ---------------------------- نسخ ----------------------------
  function copyFullSummary() {
    const text = buildFullSummaryText({
      settings,
      customerId,
      customerName,
      currentVip,
      targetVip,
      multiplier,
      transitions,
      deficits,
      totalAccess: summary.totalAccess,
      withoutMaintainShipping: summary.withoutMaintain.shipping,
      maintainValue: summary.withMaintain.maintainValue,
      totalWithMaintain: summary.withMaintain.totalWithMaintain,
      withMaintainShipping: summary.withMaintain.shipping
    })
    copyTextToClipboard(text).then((ok) => showToast(ok ? 'تم نسخ ملخص الحساب.' : 'تعذّر النسخ.', ok ? 'success' : 'error'))
  }

  function copyModeOnly(mode) {
    const modeData = mode === 'with' ? summary.withMaintain : summary.withoutMaintain
    const text = buildLiveModeSummaryText({
      settings,
      customerId,
      customerName,
      currentVip,
      targetVip,
      multiplier,
      transitions,
      deficits,
      totalAccess: summary.totalAccess,
      mode,
      maintainValue: summary.withMaintain.maintainValue,
      totalWithMaintain: summary.withMaintain.totalWithMaintain,
      shipping: modeData.shipping
    })
    copyTextToClipboard(text).then((ok) =>
      showToast(ok ? 'تم نسخ الملخص.' : 'تعذّر النسخ.', ok ? 'success' : 'error')
    )
  }

  // ---------------------------- إعادة فتح عملية ----------------------------
  function reopenCalculation(calc) {
    setCustomerId(calc.customerId)
    setCustomerName(calc.customerName)
    setCurrentVip(calc.currentVip)
    setTargetVip(calc.targetVip)
    setMultiplier(calc.multiplier)
    const newDeficits = {}
    calc.transitions.forEach((t) => {
      newDeficits[t.from] = String(t.deficit)
    })
    setDeficits(newDeficits)
    setExistingCustomerNote('')
    showToast('تم تحميل بيانات العملية داخل الحاسبة.', 'success')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ---------------------------- حذف ----------------------------
  function handleDeleteCalculation(id) {
    const remaining = deleteCalculationFromStorage(id)
    setCalculations(remaining)
  }

  function handleDeleteCustomer(id) {
    deleteCustomerFromStorage(id)
    setCustomers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    setCalculations((prev) => prev.filter((c) => c.customerId !== id))
  }

  // ---------------------------- إعدادات / بيانات ----------------------------
  function handleExport() {
    const data = exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `majlis-alqimma-backup-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('تم تنزيل نسخة البيانات.', 'success')
  }

  function handleImport(data) {
    if (!validateImportedData(data)) {
      showToast('ملف البيانات غير صالح أو تالف.', 'error')
      return
    }
    try {
      importAllData(data)
      setSettings(loadSettings())
      setVipLevels(loadVipLevels())
      setCustomers(loadCustomers())
      setCalculations(loadCalculations())
      showToast('تم استيراد البيانات بنجاح.', 'success')
    } catch (e) {
      showToast('تعذّر استيراد الملف.', 'error')
    }
  }

  function handleClearAll() {
    clearAllData()
    setSettings(loadSettings())
    setVipLevels(loadVipLevels())
    setCustomers(loadCustomers())
    setCalculations(loadCalculations())
    showToast('تم مسح جميع البيانات.', 'success')
  }

  const ToastIcon = toast?.type === 'success' ? CheckCircle2 : toast?.type === 'error' ? XCircle : AlertCircle

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <div className="brand-icon">
              <Crown size={22} />
            </div>
            <div>
              <h1>{settings.site.name}</h1>
              <p>{settings.site.description}</p>
            </div>
          </div>
          <button type="button" className="btn btn-ghost settings-trigger" onClick={() => setSettingsOpen(true)}>
            <SettingsIcon size={18} />
            <span>الإعدادات</span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <CustomerForm
          customerId={customerId}
          customerName={customerName}
          currentVip={currentVip}
          onCustomerIdChange={setCustomerId}
          onCustomerIdBlur={handleCustomerIdBlur}
          onCustomerNameChange={setCustomerName}
          onCurrentVipChange={(val) => {
            setCurrentVip(val)
            if (val >= targetVip) setTargetVip(Math.min(val + 1, 50))
          }}
          existingCustomerNote={existingCustomerNote}
        />

        <Calculator
          currentVip={currentVip}
          targetVip={targetVip}
          multiplier={multiplier}
          onTargetVipChange={setTargetVip}
          onMultiplierChange={setMultiplier}
          transitions={transitions}
          deficits={deficits}
          onDeficitChange={handleDeficitChange}
          targetError={targetError}
        />

        <div className="copy-full-row">
          <button type="button" className="btn btn-ghost" onClick={copyFullSummary}>
            <Copy size={16} />
            <span>نسخ ملخص الحساب</span>
          </button>
        </div>

        <CalculationResults
          totalAccess={summary.totalAccess}
          multiplier={multiplier}
          withoutMaintain={summary.withoutMaintain}
          withMaintain={summary.withMaintain}
          targetVip={targetVip}
          prices={settings.prices}
          onSaveWithout={() => saveOperation('without')}
          onSaveWith={() => saveOperation('with')}
          onCopyWithout={() => copyModeOnly('without')}
          onCopyWith={() => copyModeOnly('with')}
          canSave={canSave}
          validationMessage={!canSave ? validationMessage : ''}
        />

        <VipTable vipLevels={vipLevels} />

        <CustomerHistory
          customers={customers}
          calculations={calculations}
          settings={settings}
          onReopenCalculation={reopenCalculation}
          onDeleteCalculation={handleDeleteCalculation}
          onDeleteCustomer={handleDeleteCustomer}
          onToast={showToast}
        />

        <ContactSection settings={settings} />
      </main>

      <footer className="app-footer">
        <p className="footer-brand">{settings.site.developer}</p>
        <p className="footer-instagram">Instagram: {settings.site.instagram}</p>
      </footer>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        vipLevels={vipLevels}
        onUpdateSettings={setSettings}
        onUpdateVipLevels={setVipLevels}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
        onToast={showToast}
      />

      {toast && (
        <div className={`toast toast--${toast.type}`} key={toast.key}>
          <ToastIcon size={18} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  )
}
