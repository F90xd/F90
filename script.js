"use strict";

/* بيانات VIP ثابتة حسب الجدول المحدد. */
const VIP_DATA = [
  { level: 1, total: 50000, upgrade: 50000, maintain: 30000 },
  { level: 2, total: 100000, upgrade: 50000, maintain: 30000 },
  { level: 3, total: 300000, upgrade: 100000, maintain: 90000 },
  { level: 4, total: 1000000, upgrade: 800000, maintain: 500000 },
  { level: 5, total: 3000000, upgrade: 2000000, maintain: 1300000 },
  { level: 6, total: 7000000, upgrade: 4000000, maintain: 2600000 },
  { level: 7, total: 14000000, upgrade: 7000000, maintain: 4500000 },
  { level: 8, total: 26000000, upgrade: 12000000, maintain: 7800000 },
  { level: 9, total: 42000000, upgrade: 16000000, maintain: 11000000 },
  { level: 10, total: 62000000, upgrade: 20000000, maintain: 14000000 },
  { level: 11, total: 102000000, upgrade: 40000000, maintain: 28000000 },
  { level: 12, total: 220000000, upgrade: 118000000, maintain: 83000000 },
  { level: 13, total: 430000000, upgrade: 210000000, maintain: 150000000 },
  { level: 14, total: 820000000, upgrade: 390000000, maintain: 310000000 },
  { level: 15, total: 1820000000, upgrade: 1000000000, maintain: 700000000 },
  { level: 16, total: 3820000000, upgrade: 2000000000, maintain: 1400000000 },
  { level: 17, total: 7382000000, upgrade: 3500000000, maintain: 3000000000 },
  { level: 18, total: 11882000000, upgrade: 4500000000, maintain: 4000000000 },
  { level: 19, total: 17382000000, upgrade: 5500000000, maintain: 5000000000 },
  { level: 20, total: 27382000000, upgrade: 10000000000, maintain: 9000000000 }
];

const STORAGE = {
  theme: "ascend-theme",
  settings: "ascend-settings",
  history: "ascend-history",
  last: "ascend-last-operation"
};

const DEFAULT_SETTINGS = { supportRate: 130000, jodRate: 11, usdRate: 15 };
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const state = {
  settings: loadJSON(STORAGE.settings, DEFAULT_SETTINGS),
  history: loadJSON(STORAGE.history, []),
  currentResult: null,
  activeDetail: null,
  multiplier: 5,
  calculator: { display: "0", previous: null, operator: null, reset: false }
};

function loadJSON(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value === null ? structuredCloneSafe(fallback) : value;
  } catch {
    return structuredCloneSafe(fallback);
  }
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    toast("تعذر الحفظ في هذا المتصفح. تحقق من المساحة المتاحة.", "error");
    return false;
  }
}

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function timestampText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function vipRecord(level) {
  return VIP_DATA[level - 1] || null;
}

function readSettingsForm() {
  return {
    supportRate: finiteNumber($("#settingSupportRate").value),
    jodRate: finiteNumber($("#settingJodRate").value),
    usdRate: finiteNumber($("#settingUsdRate").value)
  };
}

function calculateOperation(input) {
  const { current, target, multiplier, firstTransition, lockMode, settings } = input;
  if (!Number.isInteger(current) || current < 1 || current > 20) throw new Error("اختر مستوى حالي صحيحاً من 1 إلى 20.");
  if (!Number.isInteger(target) || target < 1 || target > 20) throw new Error("اختر مستوى مطلوباً صحيحاً من 1 إلى 20.");
  if (target < current) throw new Error("المستوى المطلوب أقل من الحالي. اختر مستوى مساوياً أو أعلى.");
  if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 10) throw new Error("قيمة المضاعف غير صحيحة.");
  if (target > current && (!Number.isFinite(firstTransition) || firstTransition < 0)) {
    throw new Error("أدخل قيمة صالحة للانتقال الأول.");
  }
  if ([settings.supportRate, settings.jodRate, settings.usdRate].some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error("تحقق من أن أسعار الدعم والعملات أرقام موجبة أو صفر.");
  }

  const transitions = [];
  let reachXp = 0;

  if (target > current) {
    for (let from = current; from < target; from += 1) {
      const to = from + 1;
      // أول انتقال يدوي؛ الانتقالات التالية تستخدم upgrade للمستوى المستهدف.
      const amount = from === current ? firstTransition : vipRecord(to).upgrade;
      if (!Number.isFinite(amount) || amount < 0) throw new Error("تعذر احتساب أحد الانتقالات.");
      reachXp += amount;
      transitions.push({
        from, to, amount,
        type: from === current ? "يدوي" : "تلقائي"
      });
    }
  }

  let lockXp = 0;
  if (lockMode === "current") lockXp = vipRecord(current).maintain;
  if (lockMode === "target") lockXp = vipRecord(target).maintain;

  const totalVipXp = reachXp + lockXp;
  const actualCharge = totalVipXp / multiplier;
  const supportNeeded = actualCharge / 1000000 * settings.supportRate;
  const jod = settings.supportRate === 0 ? 0 : supportNeeded / settings.supportRate * settings.jodRate;
  const usd = settings.supportRate === 0 ? 0 : supportNeeded / settings.supportRate * settings.usdRate;

  const values = [reachXp, lockXp, totalVipXp, actualCharge, supportNeeded, jod, usd];
  if (values.some(value => !Number.isFinite(value))) throw new Error("نتيجة الحساب غير صالحة؛ تحقق من القيم المدخلة.");

  return {
    id: createId(), createdAt: new Date().toISOString(),
    clientName: $("#clientName").value.trim(),
    clientId: $("#clientId").value.trim(),
    current, target, multiplier, firstTransition: target > current ? firstTransition : 0,
    lockMode, reachXp, lockXp, totalVipXp, actualCharge, supportNeeded, jod, usd,
    transitions, settings: { ...settings }
  };
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `op-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function toast(message, type = "") {
  const item = document.createElement("div");
  item.className = `toast ${type}`;
  item.textContent = message;
  $("#toastRegion").append(item);
  window.setTimeout(() => item.remove(), 3400);
}

function showError(message) {
  const error = $("#formError");
  error.textContent = message;
  error.hidden = false;
}

function clearError() {
  $("#formError").hidden = true;
  $("#formError").textContent = "";
}

function setMultiplier(value) {
  state.multiplier = Math.max(1, Math.min(10, Number(value) || 1));
  $$("#multiplierControl button").forEach(button => {
    button.setAttribute("aria-pressed", String(Number(button.dataset.multiplier) === state.multiplier));
  });
}

function renderMultiplierControl() {
  const host = $("#multiplierControl");
  host.replaceChildren();
  for (let value = 1; value <= 10; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `×${value}`;
    button.dataset.multiplier = String(value);
    button.setAttribute("aria-label", `المضاعف ${value}`);
    button.setAttribute("aria-pressed", String(value === state.multiplier));
    button.addEventListener("click", () => {
      setMultiplier(value);
      refreshCalculation();
    });
    host.append(button);
  }
}

function currentInput() {
  const current = finiteNumber($("#currentVip").value);
  const target = finiteNumber($("#targetVip").value);
  const first = $("#firstTransition").value.trim() === "" ? null : finiteNumber($("#firstTransition").value);
  return {
    current, target, firstTransition: first, multiplier: state.multiplier,
    lockMode: $("#lockMode").value, settings: state.settings,
    clientName: $("#clientName").value.trim(),
    clientId: $("#clientId").value.trim()
  };
}

function refreshCalculation() {
  clearError();
  updateJourney();
  const input = currentInput();
  try {
    state.currentResult = calculateOperation(input);
    renderResult(state.currentResult);
    $("#sameLevelNote").hidden = input.current !== input.target;
    return state.currentResult;
  } catch (error) {
    state.currentResult = null;
    renderEmptyResult(input);
    // لا نعرض خطأ الانتقال الأول أثناء الكتابة إلا عند محاولة الحساب.
    if (input.current != null && input.target != null && input.target < input.current) showError(error.message);
    return null;
  }
}

function renderEmptyResult(input) {
  $("#resultFrom").textContent = Number.isInteger(input.current) ? `VIP ${input.current}` : "VIP —";
  $("#resultTo").textContent = Number.isInteger(input.target) ? `VIP ${input.target}` : "VIP —";
  $("#resultCharge").textContent = "—";
  $("#resultTotalXp").textContent = "—";
  $("#resultMultiplier").textContent = `×${state.multiplier}`;
  $("#resultSupport").textContent = "—";
  $("#resultJod").textContent = "—";
  $("#resultUsd").textContent = "—";
  $("#sameLevelNote").hidden = input.current !== input.target;
}

function renderResult(result) {
  $("#resultFrom").textContent = `VIP ${result.current}`;
  $("#resultTo").textContent = `VIP ${result.target}`;
  $("#resultCharge").textContent = formatNumber(result.actualCharge);
  $("#resultTotalXp").textContent = formatNumber(result.totalVipXp);
  $("#resultMultiplier").textContent = `×${result.multiplier}`;
  $("#resultSupport").textContent = formatNumber(result.supportNeeded);
  $("#resultJod").textContent = `${formatNumber(result.jod, 2)} JOD`;
  $("#resultUsd").textContent = `${formatNumber(result.usd, 2)} USD`;
}

function updateJourney() {
  const current = Number($("#currentVip").value);
  const target = Number($("#targetVip").value);
  const valid = Number.isInteger(current) && current >= 1 && current <= 20 &&
    Number.isInteger(target) && target >= 1 && target <= 20;

  $("#railCurrent").textContent = valid ? `VIP ${current}` : "VIP —";
  $("#railTarget").textContent = valid ? `VIP ${target}` : "VIP —";
  const span = valid ? Math.max(0, target - current) : 0;
  $("#journeyCount").textContent = `${span} ${span === 1 ? "انتقال" : "انتقال"}`;
  const progress = valid && target > current ? ((current - 1) / 19) * 100 : 0;
  $("#journeyProgress").style.width = `${progress}%`;
  $("#journeyHint").textContent = !valid
    ? "أدخل مستوى من 1 إلى 20"
    : target < current
      ? "المستوى المطلوب يجب أن يساوي الحالي أو يتجاوزه"
      : target === current
        ? "المستوى نفسه — يمكن احتساب التثبيت فقط"
        : `${span} ${span === 1 ? "مستوى للهدف" : "مستويات للهدف"}`;
  const lock = $("#lockMode").value;
  $("#lockHint").textContent = lock === "current"
    ? `سيُضاف تثبيت VIP ${current}: ${formatNumber(vipRecord(current)?.maintain || 0)} XP`
    : lock === "target"
      ? `سيُضاف تثبيت VIP ${target}: ${formatNumber(vipRecord(target)?.maintain || 0)} XP`
      : "يمكن إضافة تثبيت إلى إجمالي XP.";
}

function readAndCalculate(showValidation = true) {
  clearError();
  try {
    const input = currentInput();
    if (input.current == null || input.target == null) throw new Error("أدخل المستوى الحالي والمستوى المطلوب.");
    if (input.target > input.current && input.firstTransition == null) throw new Error("أدخل قيمة صالحة للانتقال الأول.");
    const result = calculateOperation(input);
    state.currentResult = result;
    renderResult(result);
    return result;
  } catch (error) {
    state.currentResult = null;
    if (showValidation) showError(error.message);
    toast(error.message, "error");
    return null;
  }
}

/* تفاصيل الحساب؛ يُعاد استخدامها للسجل والعملية الحالية. */
function renderDetails(operation) {
  const transitions = operation.transitions || [];
  const transitionRows = transitions.length
    ? transitions.map((step, index) => `
      <div class="timeline-row">
        <span class="timeline-dot" aria-hidden="true"></span>
        <div><strong>VIP ${step.from} ← VIP ${step.to}</strong><small>${step.type}${index === 0 ? " · إدخال يدوي" : " · upgrade للمستوى المستهدف"}</small></div>
        <strong>${formatNumber(step.amount)} XP</strong>
      </div>`).join("")
    : `<div class="timeline-row"><span class="timeline-dot"></span><div><strong>لا توجد انتقالات</strong><small>المستوى الحالي يساوي المطلوب</small></div><strong>0 XP</strong></div>`;

  const lockLabel = operation.lockMode === "current"
    ? `تثبيت VIP ${operation.current}`
    : operation.lockMode === "target"
      ? `تثبيت VIP ${operation.target}`
      : "بدون تثبيت";

  $("#detailsContent").innerHTML = `
    <div class="detail-client">
      <div><strong>${escapeHTML(operation.clientName || "عميل غير مسمى")}</strong><small>ID: ${escapeHTML(operation.clientId || "غير متوفر")}</small><small>${escapeHTML(timestampText(operation.createdAt))}</small></div>
      <span class="vip-tag">VIP ${operation.current} → ${operation.target}</span>
    </div>
    <h3 class="detail-section-title">رحلة الانتقالات</h3>
    <div class="timeline">${transitionRows}</div>
    <h3 class="detail-section-title">معادلة العملية</h3>
    <div class="formula-list">
      <div><span>الانتقال الأول</span><strong>${formatNumber(operation.firstTransition)} XP</strong></div>
      <div><span>مجموع الانتقالات / Reach XP</span><strong>${formatNumber(operation.reachXp)} XP</strong></div>
      <div><span>${escapeHTML(lockLabel)} / Lock XP</span><strong>${formatNumber(operation.lockXp)} XP</strong></div>
      <div><span>إجمالي VIP XP</span><strong>${formatNumber(operation.totalVipXp)} XP</strong></div>
      <div><span>المضاعف</span><strong>÷ ${operation.multiplier}</strong></div>
      <div><span>الشحن الفعلي</span><strong>${formatNumber(operation.actualCharge)} Coins</strong></div>
      <div><span>الدعم المطلوب</span><strong>${formatNumber(operation.supportNeeded)}</strong></div>
      <div><span>القيمة بالدينار</span><strong>${formatNumber(operation.jod, 2)} JOD</strong></div>
      <div><span>القيمة بالدولار</span><strong>${formatNumber(operation.usd, 2)} USD</strong></div>
    </div>`;
}

function openDetails(operation) {
  if (!operation) return;
  state.activeDetail = operation;
  renderDetails(operation);
  const dialog = $("#detailsDialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
}

function saveCurrentOperation() {
  const operation = readAndCalculate();
  if (!operation) return;
  operation.clientName = $("#clientName").value.trim();
  operation.clientId = $("#clientId").value.trim();
  operation.createdAt = new Date().toISOString();
  state.history.unshift(operation);
  if (persist(STORAGE.history, state.history)) {
    persist(STORAGE.last, operation);
    renderHistory();
    renderStats();
    toast("تم حفظ العملية في سجل العمليات.", "success");
  }
}

function filteredHistory() {
  const query = $("#historySearch").value.trim().toLocaleLowerCase();
  if (!query) return state.history;
  return state.history.filter(item => [
    item.clientName, item.clientId, `vip ${item.current}`, `vip ${item.target}`,
    `${item.current} ${item.target}`
  ].join(" ").toLocaleLowerCase().includes(query));
}

function renderHistory() {
  const body = $("#historyBody");
  const items = filteredHistory();
  body.innerHTML = items.map(item => `
    <tr>
      <td class="client-cell"><strong>${escapeHTML(item.clientName || "عميل غير مسمى")}</strong><small>${escapeHTML(item.clientId || "بدون ID")}</small></td>
      <td><span class="vip-tag">VIP ${item.current} → ${item.target}</span></td>
      <td class="table-number">${formatNumber(item.actualCharge)} <small>Coins</small></td>
      <td>${formatNumber(item.supportNeeded)}</td>
      <td class="table-number">${formatNumber(item.jod, 2)} JOD</td>
      <td class="table-date">${escapeHTML(timestampText(item.createdAt))}</td>
      <td><div class="row-actions"><button class="small-action" data-action="open" data-id="${escapeHTML(item.id)}">فتح</button><button class="small-action" data-action="delete" data-id="${escapeHTML(item.id)}" aria-label="حذف العملية">حذف</button></div></td>
    </tr>`).join("");
  $("#emptyHistory").hidden = items.length > 0;
  $("#historySummary").textContent = items.length
    ? `عرض ${formatNumber(items.length)} من ${formatNumber(state.history.length)} عملية محفوظة على هذا الجهاز.`
    : state.history.length ? "لا توجد نتائج مطابقة للبحث." : "تُحفظ العمليات محلياً على هذا الجهاز.";
}

function renderStats() {
  const operations = state.history;
  const customers = new Set(operations.map(item => item.clientId || item.clientName).filter(Boolean));
  const sum = key => operations.reduce((total, item) => total + (Number(item[key]) || 0), 0);
  $("#statOperations").textContent = formatNumber(operations.length);
  $("#statCustomers").textContent = formatNumber(customers.size);
  $("#statCoins").textContent = formatNumber(sum("actualCharge"));
  $("#statSupport").textContent = formatNumber(sum("supportNeeded"));
  $("#statJod").innerHTML = `${formatNumber(sum("jod"), 2)} <small>JOD</small>`;
  $("#statUsd").textContent = `${formatNumber(sum("usd"), 2)} USD`;
}

async function shareOperation(operation) {
  if (!operation) {
    toast("أكمل حساب العملية أولاً قبل المشاركة.", "error");
    return;
  }
  const message = [
    "ASCEND — VIP CALCULATION",
    "",
    `Client: ${operation.clientName || "—"}`,
    `ID: ${operation.clientId || "—"}`,
    "",
    `VIP: ${operation.current} → ${operation.target}`,
    `First Transition: ${formatNumber(operation.firstTransition)} XP`,
    `Total VIP XP: ${formatNumber(operation.totalVipXp)}`,
    `Multiplier: ×${operation.multiplier}`,
    `Actual Charge: ${formatNumber(operation.actualCharge)} Coins`,
    `Support: ${formatNumber(operation.supportNeeded)}`,
    `JOD: ${formatNumber(operation.jod, 2)}`,
    `USD: ${formatNumber(operation.usd, 2)}`
  ].join("\n");

  if (navigator.share) {
    try {
      await navigator.share({ title: "ASCEND — VIP Calculation", text: message });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

function deleteOperation(id) {
  const operation = state.history.find(item => item.id === id);
  if (!operation) return;
  if (!window.confirm(`حذف عملية ${operation.clientName || "العميل"}؟`)) return;
  state.history = state.history.filter(item => item.id !== id);
  persist(STORAGE.history, state.history);
  renderHistory();
  renderStats();
  toast("تم حذف العملية.", "success");
}

/* تفضيلات الأسعار والثيم */
function applyTheme(theme) {
  const selected = theme === "navy" ? "navy" : "light";
  document.documentElement.dataset.theme = selected;
  $("#themeSelect").value = selected;
  try { localStorage.setItem(STORAGE.theme, selected); } catch { /* تجاهل تعذر التخزين */ }
}

function initializeSettings() {
  const settings = state.settings;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (!Number.isFinite(Number(settings[key])) || Number(settings[key]) < 0) settings[key] = DEFAULT_SETTINGS[key];
  }
  $("#settingSupportRate").value = settings.supportRate;
  $("#settingJodRate").value = settings.jodRate;
  $("#settingUsdRate").value = settings.usdRate;
  updateRateDisplays();
}

function updateRateDisplays() {
  $("#supportRateDisplay").textContent = formatNumber(state.settings.supportRate);
  $("#jodRateDisplay").textContent = `${formatNumber(state.settings.jodRate)} JOD`;
  $("#usdRateDisplay").textContent = `${formatNumber(state.settings.usdRate)} USD`;
}

function saveSettings() {
  const settings = readSettingsForm();
  if (Object.values(settings).some(value => value == null || value < 0)) {
    toast("أدخل قيماً صحيحة وموجبة لإعدادات الأسعار.", "error");
    return;
  }
  state.settings = settings;
  persist(STORAGE.settings, settings);
  applyTheme($("#themeSelect").value);
  updateRateDisplays();
  refreshCalculation();
  toast("تم حفظ الإعدادات.", "success");
}

/* أدوات التحويل */
function updateConverters() {
  const target = Math.max(0, finiteNumber($("#targetAmount").value) || 0);
  const games = Math.max(0, finiteNumber($("#gamesAmount").value) || 0);
  $("#targetJod").textContent = formatNumber(target / 100000 * 7, 2);
  $("#targetUsd").textContent = formatNumber(target / 100000 * 10, 2);
  $("#gamesJod").textContent = formatNumber(games / 100000 * 6, 2);
  $("#gamesUsd").textContent = formatNumber(games / 100000 * 8, 2);
}

/* حاسبة رقمية بسيطة دون eval. */
function updateCalcDisplay() {
  $("#calcDisplay").textContent = state.calculator.display;
}

function calcPress(key) {
  const calc = state.calculator;
  if (key === "clear") {
    calc.display = "0"; calc.previous = null; calc.operator = null; calc.reset = false;
  } else if (key === "backspace") {
    calc.display = calc.display.length > 1 ? calc.display.slice(0, -1) : "0";
    if (calc.display === "-") calc.display = "0";
  } else if (key === "percent") {
    const value = Number(calc.display);
    calc.display = Number.isFinite(value) ? String(value / 100) : "0";
  } else if (["+", "-", "*", "/"].includes(key)) {
    calc.previous = Number(calc.display);
    calc.operator = key;
    calc.reset = true;
  } else if (key === "=") {
    if (calc.operator && calc.previous !== null) {
      const current = Number(calc.display);
      let result;
      if (calc.operator === "+") result = calc.previous + current;
      if (calc.operator === "-") result = calc.previous - current;
      if (calc.operator === "*") result = calc.previous * current;
      if (calc.operator === "/") result = current === 0 ? NaN : calc.previous / current;
      calc.display = Number.isFinite(result) ? String(Number(result.toPrecision(12))) : "خطأ";
      calc.operator = null; calc.previous = null; calc.reset = true;
    }
  } else if (key === ".") {
    if (calc.reset || calc.display === "خطأ") { calc.display = "0."; calc.reset = false; }
    else if (!calc.display.includes(".")) calc.display += ".";
  } else if (/^\d$/.test(key)) {
    if (calc.reset || calc.display === "خطأ") { calc.display = key; calc.reset = false; }
    else calc.display = calc.display === "0" ? key : calc.display + key;
  }
  updateCalcDisplay();
}

/* أحداث الواجهة */
function bindEvents() {
  $$(".level-step").forEach(button => button.addEventListener("click", () => {
    const selector = button.dataset.step === "current" ? "#currentVip" : "#targetVip";
    const input = $(selector);
    input.value = Math.max(1, Math.min(20, Number(input.value || 1) + Number(button.dataset.dir)));
    refreshCalculation();
  }));

  ["currentVip", "targetVip", "firstTransition", "lockMode"].forEach(id => {
    $(`#${id}`).addEventListener("input", refreshCalculation);
    $(`#${id}`).addEventListener("change", refreshCalculation);
  });

  $("#calculateButton").addEventListener("click", () => readAndCalculate());
  $("#saveButton").addEventListener("click", saveCurrentOperation);
  $("#shareButton").addEventListener("click", async () => {
    const result = readAndCalculate();
    if (result) {
      result.clientName = $("#clientName").value.trim();
      result.clientId = $("#clientId").value.trim();
      await shareOperation(result);
    }
  });
  $("#detailsButton").addEventListener("click", () => {
    const result = readAndCalculate();
    if (result) {
      result.clientName = $("#clientName").value.trim();
      result.clientId = $("#clientId").value.trim();
      openDetails(result);
    }
  });

  $("#historySearch").addEventListener("input", renderHistory);
  $("#historyBody").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const operation = state.history.find(item => item.id === button.dataset.id);
    if (button.dataset.action === "open") openDetails(operation);
    if (button.dataset.action === "delete") deleteOperation(button.dataset.id);
  });

  $("#detailsContent").addEventListener("click", () => {});
  $$(".modal-close").forEach(button => button.addEventListener("click", () => $("#detailsDialog").close()));
  $("#detailsDialog").addEventListener("click", event => {
    if (event.target === $("#detailsDialog")) $("#detailsDialog").close();
  });
  $("#detailsPrint").addEventListener("click", () => window.print());

  $("#settingsToggle").addEventListener("click", () => {
    const panel = $("#settingsPanel");
    panel.hidden = !panel.hidden;
    $("#settingsToggle").setAttribute("aria-expanded", String(!panel.hidden));
    if (!panel.hidden) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $("#settingsClose").addEventListener("click", () => {
    $("#settingsPanel").hidden = true;
    $("#settingsToggle").setAttribute("aria-expanded", "false");
  });
  $("#saveSettings").addEventListener("click", saveSettings);
  $("#themeSelect").addEventListener("change", event => applyTheme(event.target.value));
  $("#themeToggle").addEventListener("click", () => {
    applyTheme(document.documentElement.dataset.theme === "navy" ? "light" : "navy");
    toast(`تم تفعيل مظهر ${document.documentElement.dataset.theme === "navy" ? "Navy" : "Slate Blue"}.`, "success");
  });

  $("#targetAmount").addEventListener("input", updateConverters);
  $("#gamesAmount").addEventListener("input", updateConverters);

  $("#calcKeys").addEventListener("click", event => {
    const key = event.target.closest("[data-calc]")?.dataset.calc;
    if (key) calcPress(key);
  });
  document.addEventListener("keydown", event => {
    if ($("#detailsDialog").open || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (/^\d$/.test(event.key) || [".", "+", "-", "*", "/"].includes(event.key)) calcPress(event.key);
    else if (event.key === "Enter" || event.key === "=") calcPress("=");
    else if (event.key === "Backspace") calcPress("backspace");
    else if (event.key === "Escape") calcPress("clear");
  });

  $("#exportButton").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state.history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ascend-operations-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  });

  $("#menuToggle").addEventListener("click", () => {
    const nav = $(".main-nav");
    const isOpen = nav.classList.toggle("open");
    $("#menuToggle").setAttribute("aria-expanded", String(isOpen));
  });
  $$(".main-nav a").forEach(link => link.addEventListener("click", () => {
    $(".main-nav").classList.remove("open");
    $("#menuToggle").setAttribute("aria-expanded", "false");
  }));
  window.addEventListener("scroll", () => $(".topbar").classList.toggle("scrolled", window.scrollY > 8), { passive: true });
}

function initialize() {
  renderMultiplierControl();
  initializeSettings();
  let savedTheme = "light";
  try { savedTheme = localStorage.getItem(STORAGE.theme) || "light"; } catch { /* استخدام المظهر الافتراضي */ }
  applyTheme(savedTheme);
  bindEvents();
  updateJourney();
  updateConverters();
  refreshCalculation();
  renderHistory();
  renderStats();

  // استعادة آخر قيم إدخال مساعدة دون استبدال أي سجل محفوظ.
  const last = loadJSON(STORAGE.last, null);
  if (last && Number.isInteger(last.current) && Number.isInteger(last.target)) {
    $("#currentVip").value = last.current;
    $("#targetVip").value = last.target;
    $("#firstTransition").value = last.target > last.current ? last.firstTransition : "";
    $("#lockMode").value = ["none", "current", "target"].includes(last.lockMode) ? last.lockMode : "none";
    $("#clientName").value = last.clientName || "";
    $("#clientId").value = last.clientId || "";
    setMultiplier(last.multiplier || 5);
    refreshCalculation();
  }
}

initialize();
