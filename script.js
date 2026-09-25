"use strict";

const VIP_TABLE = [
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

const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "majlis_alqimma_theme";
const TARGET_JOD_RATE = 7;
const TARGET_USD_RATE = 10;
const GAMES_JOD_RATE = 6;
const GAMES_USD_RATE = 8;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const state = { mode: "reach", records: loadRecords(), lastResult: null };

function readRecords() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isValidRecord) : [];
  } catch {
    return [];
  }
}

function loadRecords() {
  return readRecords();
}

function isValidRecord(record) {
  return record && typeof record === "object" &&
    Number.isFinite(Number(record.currentVip)) &&
    Number.isFinite(Number(record.targetVip)) &&
    Number.isFinite(Number(record.actualCharge));
}

function persistRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
    return true;
  } catch {
    showToast("تعذر الحفظ في المتصفح. تحقق من مساحة التخزين.", "error");
    return false;
  }
}

function formatNumber(value, decimals = 0) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "—";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function numericValue(element) {
  const value = Number(element.value);
  return Number.isFinite(value) ? value : NaN;
}

function vipData(level) {
  return VIP_TABLE[level - 1] || null;
}

function showToast(message, type = "") {
  const region = $("#toastRegion");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  region.append(toast);
  window.setTimeout(() => toast.remove(), 3000);
}

function clientStatus(message, type) {
  const element = $("#clientStatus");
  if (!element) return;
  element.textContent = message;
  element.className = `status-message ${type || ""}`;
  element.hidden = !message;
}

function setError(message = "") {
  const element = $("#calculationError");
  if (!element) return;
  element.textContent = message;
  element.hidden = !message;
}

function buildSelectOptions() {
  const current = $("#currentVip");
  const target = $("#targetVip");
  const multiplier = $("#multiplier");

  VIP_TABLE.forEach(item => {
    const optionA = document.createElement("option");
    optionA.value = String(item.level);
    optionA.textContent = `VIP ${item.level}`;
    current.append(optionA);

    const optionB = document.createElement("option");
    optionB.value = String(item.level);
    optionB.textContent = `VIP ${item.level}`;
    target.append(optionB);
  });

  for (let value = 1; value <= 10; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = `×${value}`;
    multiplier.append(option);
  }

  current.value = "10";
  target.value = "11";
  multiplier.value = "5";
}

function setMode(mode) {
  state.mode = mode === "currentLock" ? "currentLock" : "reach";
  $$(".mode-option").forEach(button => {
    const selected = button.dataset.mode === state.mode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-pressed", String(selected));
  });
  $("#reachFields").hidden = state.mode !== "reach";
  $("#currentLockBox").hidden = state.mode !== "currentLock";
  if (state.mode === "currentLock") $("#enableTargetLock").checked = false;
  updateLockDisplay();
  calculate();
}

function getFormValues() {
  return {
    clientName: $("#clientName").value.trim(),
    clientId: $("#clientId").value.trim(),
    currentVip: Number($("#currentVip").value),
    targetVip: Number($("#targetVip").value),
    multiplier: Number($("#multiplier").value),
    firstTransition: $("#firstTransitionInput").value.trim() === ""
      ? null : numericValue($("#firstTransitionInput")),
    supportRate: numericValue($("#supportRate")),
    jodRate: numericValue($("#jodRate")),
    usdRate: numericValue($("#usdRate")),
    enableTargetLock: $("#enableTargetLock").checked,
    mode: state.mode
  };
}

function calculateValues(input) {
  const {
    currentVip, targetVip, multiplier, firstTransition,
    supportRate, jodRate, usdRate, enableTargetLock, mode
  } = input;

  if (!Number.isInteger(currentVip) || currentVip < 1 || currentVip > 20) {
    throw new Error("اختر مستوى حالي صحيحاً.");
  }
  if (!Number.isInteger(targetVip) || targetVip < 1 || targetVip > 20) {
    throw new Error("اختر مستوى مطلوباً صحيحاً.");
  }
  if (!Number.isInteger(multiplier) || multiplier < 1 || multiplier > 10) {
    throw new Error("اختر عرضاً صحيحاً من ×1 إلى ×10.");
  }
  if ([supportRate, jodRate, usdRate].some(value => !Number.isFinite(value) || value < 0)) {
    throw new Error("تحقق من قيم الدعم وأسعار العملات.");
  }

  let reachPoints = 0;
  let lockPoints = 0;
  const transitions = [];

  if (mode === "reach") {
    if (targetVip < currentVip) {
      throw new Error("المستوى المطلوب يجب أن يساوي الحالي أو يكون أعلى منه.");
    }

    if (targetVip > currentVip) {
      if (firstTransition === null || !Number.isFinite(firstTransition) || firstTransition < 0) {
        throw new Error("أدخل قيمة صحيحة للانتقال الأول.");
      }

      for (let level = currentVip; level < targetVip; level += 1) {
        const nextLevel = level + 1;
        const amount = level === currentVip
          ? firstTransition
          : vipData(nextLevel).upgrade;

        reachPoints += amount;
        transitions.push({
          from: level,
          to: nextLevel,
          points: amount,
          kind: level === currentVip ? "يدوي" : "تلقائي"
        });
      }
    }

    if (enableTargetLock) lockPoints = vipData(targetVip).maintain;
  } else {
    lockPoints = vipData(currentVip).maintain;
  }

  const totalVipPoints = reachPoints + lockPoints;
  // قاعدة العرض: نقاط VIP تقسم على المضاعف ولا تضرب به.
  const actualCharge = totalVipPoints / multiplier;
  const supportNeeded = actualCharge / 1000000 * supportRate;
  const jodTotal = supportRate === 0 ? 0 : supportNeeded / supportRate * jodRate;
  const usdTotal = supportRate === 0 ? 0 : supportNeeded / supportRate * usdRate;

  const result = {
    ...input,
    transitions,
    reachPoints,
    lockPoints,
    totalVipPoints,
    actualCharge,
    supportNeeded,
    jodTotal,
    usdTotal,
    createdAt: new Date().toISOString()
  };

  if (Object.values({
    reachPoints, lockPoints, totalVipPoints, actualCharge,
    supportNeeded, jodTotal, usdTotal
  }).some(value => !Number.isFinite(value))) {
    throw new Error("تعذر إكمال الحساب. تحقق من القيم المدخلة.");
  }
  return result;
}

function updateLockDisplay() {
  const current = Number($("#currentVip").value);
  const target = Number($("#targetVip").value);
  const currentData = vipData(current);
  const targetData = vipData(target);

  $("#currentLockValue").textContent = `${formatNumber(currentData?.maintain || 0)} XP`;
  $("#currentLockDescription").textContent = `VIP ${current} · نقاط الحفاظ من جدول VIP`;
  $("#targetLockValue").textContent = `${formatNumber(targetData?.maintain || 0)} XP`;
  $("#targetLockLevel").textContent = `VIP ${target}`;

  const enabled = state.mode === "reach" && $("#enableTargetLock").checked;
  $("#targetLockBox").hidden = !enabled;

  if (state.mode === "reach") {
    $("#transitionRoute").innerHTML = `VIP ${current} <span>←</span> VIP ${Math.min(current + 1, 20)}`;
  }
}

function renderResult(result) {
  $("#resultMultiplier").textContent = `×${result.multiplier}`;
  $("#resultRoute").textContent = `VIP ${result.currentVip} → VIP ${result.targetVip}`;
  $("#actualCharge").textContent = formatNumber(result.actualCharge);
  $("#reachPoints").textContent = formatNumber(result.reachPoints);
  $("#lockPoints").textContent = formatNumber(result.lockPoints);
  $("#totalVipPoints").textContent = formatNumber(result.totalVipPoints);
  $("#supportNeeded").textContent = formatNumber(result.supportNeeded);
  $("#jodTotal").textContent = formatNumber(result.jodTotal, 2);
  $("#usdTotal").textContent = formatNumber(result.usdTotal, 2);
  $("#vipFormula").textContent =
    `${formatNumber(result.reachPoints)} + ${formatNumber(result.lockPoints)} = ${formatNumber(result.totalVipPoints)} ÷ ×${result.multiplier}`;
  $("#supportFormula").textContent =
    `${formatNumber(result.actualCharge)} ÷ 1,000,000 × ${formatNumber(result.supportRate)} = ${formatNumber(result.supportNeeded)}`;
}

function calculate(showErrorMessage = false) {
  setError("");
  updateLockDisplay();
  try {
    const result = calculateValues(getFormValues());
    state.lastResult = result;
    renderResult(result);
    return result;
  } catch (error) {
    state.lastResult = null;
    if (showErrorMessage) setError(error.message);
    else if (error.message.includes("أعلى") || error.message.includes("أدخل قيمة")) {
      // تظهر الأخطاء التفصيلية عند طلب الحساب أو الحفظ، مع إبقاء الواجهة صالحة أثناء التحرير.
    }
    return null;
  }
}

function calculateAndReport() {
  const result = calculate(true);
  if (!result) return null;
  setError("");
  return result;
}

function saveCurrent() {
  const result = calculateAndReport();
  if (!result) return;

  if (!result.clientName && !result.clientId) {
    clientStatus("أدخل اسم العميل أو ID أولاً", "error");
    showToast("أدخل اسم العميل أو ID أولاً.", "error");
    return;
  }

  const record = {
    id: createId(),
    createdAt: new Date().toISOString(),
    clientName: result.clientName,
    clientId: result.clientId,
    currentVip: result.currentVip,
    targetVip: result.targetVip,
    multiplier: result.multiplier,
    reachPoints: result.reachPoints,
    lockPoints: result.lockPoints,
    totalVipPoints: result.totalVipPoints,
    actualCharge: result.actualCharge,
    supportNeeded: result.supportNeeded,
    jodTotal: result.jodTotal,
    usdTotal: result.usdTotal,
    firstTransition: result.firstTransition,
    mode: result.mode,
    enableTargetLock: result.enableTargetLock,
    supportRate: result.supportRate,
    jodRate: result.jodRate,
    usdRate: result.usdRate
  };

  state.records.unshift(record);
  if (persistRecords()) {
    renderHistory();
    renderStats();
    clientStatus("تم حفظ العملية بنجاح", "success");
    showToast("تم حفظ العملية بنجاح.", "success");
    $("#historySection").open = true;
  }
}

function createId() {
  return globalThis.crypto?.randomUUID?.() ||
    `record-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function displayDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ar", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit"
  }).format(date);
}

function renderHistory() {
  const query = $("#historySearch").value.trim().toLocaleLowerCase();
  const records = state.records.filter(record =>
    [record.clientName, record.clientId].join(" ").toLocaleLowerCase().includes(query)
  );

  $("#history").innerHTML = records.map(record => `
    <article class="history-record">
      <div class="record-client">
        <strong>${escapeHtml(record.clientName || "عميل بدون اسم")}</strong>
        <small>ID: ${escapeHtml(record.clientId || "—")} · ${escapeHtml(displayDate(record.createdAt))}</small>
      </div>
      <div class="record-route">VIP ${Number(record.currentVip)} → VIP ${Number(record.targetVip)}</div>
      <div class="record-facts">
        <span>الشحن <strong>${formatNumber(record.actualCharge)}</strong></span>
        <span>الدعم <strong>${formatNumber(record.supportNeeded)}</strong></span>
        <span>${formatNumber(record.jodTotal, 2)} JOD</span>
      </div>
      <div class="record-actions">
        <button class="small-button" type="button" data-action="restore" data-id="${escapeHtml(record.id)}">استرجاع</button>
        <button class="small-button delete" type="button" data-action="delete" data-id="${escapeHtml(record.id)}">حذف</button>
      </div>
    </article>
  `).join("");

  $("#historyEmpty").hidden = records.length > 0;
  if (query && records.length === 0) {
    $("#historyEmpty").hidden = false;
    $("#historyEmpty").querySelector("strong").textContent = "لا توجد نتائج مطابقة";
    $("#historyEmpty").querySelector("small").textContent = "جرّب البحث باسم أو ID مختلف.";
  } else {
    $("#historyEmpty").querySelector("strong").textContent = "لا توجد عمليات محفوظة";
    $("#historyEmpty").querySelector("small").textContent = "ستظهر العمليات التي تحفظها في هذا المكان.";
  }
}

function restoreRecord(id) {
  const record = state.records.find(item => item.id === id);
  if (!record) return;

  $("#clientName").value = record.clientName || "";
  $("#clientId").value = record.clientId || "";
  $("#currentVip").value = String(record.currentVip);
  $("#targetVip").value = String(record.targetVip);
  $("#multiplier").value = String(record.multiplier);
  $("#supportRate").value = String(record.supportRate ?? 130000);
  $("#jodRate").value = String(record.jodRate ?? 11);
  $("#usdRate").value = String(record.usdRate ?? 15);
  $("#firstTransitionInput").value = record.firstTransition ?? "";
  $("#enableTargetLock").checked = Boolean(record.enableTargetLock);

  setMode(record.mode === "currentLock" ? "currentLock" : "reach");
  calculate(true);
  $("#clientSection").open = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  clientStatus("تم استرجاع بيانات العملية", "success");
  showToast("تم استرجاع العملية.", "success");
}

function deleteRecord(id) {
  state.records = state.records.filter(record => record.id !== id);
  persistRecords();
  renderHistory();
  renderStats();
  showToast("تم حذف العملية.", "success");
}

function renderStats() {
  const records = state.records;
  const uniqueCustomers = new Set(
    records.map(record => record.clientId || record.clientName).filter(Boolean)
  );
  const total = key => records.reduce((sum, record) => sum + (Number(record[key]) || 0), 0);
  const highestVip = records.reduce((highest, record) =>
    Math.max(highest, Number(record.targetVip) || 0), 0
  );

  $("#statOperations").textContent = formatNumber(records.length);
  $("#statCustomers").textContent = formatNumber(uniqueCustomers.size);
  $("#statCharge").textContent = formatNumber(total("actualCharge"));
  $("#statSupport").textContent = formatNumber(total("supportNeeded"));
  $("#statVipPoints").textContent = formatNumber(total("totalVipPoints"));
  $("#statJod").textContent = formatNumber(total("jodTotal"), 2);
  $("#statUsd").textContent = formatNumber(total("usdTotal"), 2);
  $("#statHighestVip").textContent = highestVip ? `VIP ${highestVip}` : "—";
}

function renderVipTable() {
  $("#vipTableBody").innerHTML = VIP_TABLE.map(item => `
    <tr>
      <td>VIP ${item.level}</td>
      <td>${formatNumber(item.total)}</td>
      <td>${formatNumber(item.upgrade)}</td>
      <td>${formatNumber(item.maintain)}</td>
    </tr>
  `).join("");
}

function updateExtraCalculators() {
  const target = Math.max(0, numericValue($("#targetInput")) || 0);
  const games = Math.max(0, numericValue($("#gamesInput")) || 0);

  $("#targetJod").textContent = `${formatNumber(target / 100000 * TARGET_JOD_RATE, 2)} JOD`;
  $("#targetUsd").textContent = `${formatNumber(target / 100000 * TARGET_USD_RATE, 2)} USD`;
  $("#gamesJod").textContent = `${formatNumber(games / 100000 * GAMES_JOD_RATE, 2)} JOD`;
  $("#gamesUsd").textContent = `${formatNumber(games / 100000 * GAMES_USD_RATE, 2)} USD`;
}

function newOperation() {
  $("#clientName").value = "";
  $("#clientId").value = "";
  $("#currentVip").value = "10";
  $("#targetVip").value = "11";
  $("#multiplier").value = "5";
  $("#firstTransitionInput").value = "";
  $("#enableTargetLock").checked = false;
  $("#supportRate").value = "130000";
  $("#jodRate").value = "11";
  $("#usdRate").value = "15";
  $("#targetInput").value = "";
  $("#gamesInput").value = "";
  $("#currentVip").dispatchEvent(new Event("change"));
  setMode("reach");
  clientStatus("", "");
  setError("");
  updateExtraCalculators();
  calculate();
  $("#clientSection").open = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setTheme(theme) {
  document.body.classList.toggle("light", theme === "light");
  $("#themeToggle").innerHTML = theme === "light" ? "☾ <span>الوضع</span>" : "☼ <span>الوضع</span>";
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // يمكن استخدام الثيم حتى إن كان التخزين المحلي غير متاح.
  }
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("تعذر النسخ");
}

function bindEvents() {
  $$(".mode-option").forEach(button => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  [
    "#currentVip", "#targetVip", "#multiplier", "#firstTransitionInput",
    "#supportRate", "#jodRate", "#usdRate", "#enableTargetLock"
  ].forEach(selector => {
    const element = $(selector);
    element.addEventListener("input", () => calculate());
    element.addEventListener("change", () => calculate());
  });

  $("#calculateBtn").addEventListener("click", () => {
    const result = calculateAndReport();
    if (result) showToast("تم تحديث الحسبة.", "success");
  });

  $("#saveBtn").addEventListener("click", saveCurrent);
  $("#newBtn").addEventListener("click", newOperation);

  $("#historySearch").addEventListener("input", renderHistory);
  $("#history").addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    if (button.dataset.action === "restore") restoreRecord(button.dataset.id);
    if (button.dataset.action === "delete") deleteRecord(button.dataset.id);
  });

  $("#clearHistory").addEventListener("click", () => {
    if (!state.records.length) {
      showToast("السجل فارغ بالفعل.");
      return;
    }
    if (!window.confirm("هل تريد حذف جميع العمليات؟")) return;
    state.records = [];
    persistRecords();
    renderHistory();
    renderStats();
    showToast("تم حذف جميع العمليات.", "success");
  });

  $("#themeToggle").addEventListener("click", () => {
    const nextTheme = document.body.classList.contains("light") ? "dark" : "light";
    setTheme(nextTheme);
  });

  $("#targetInput").addEventListener("input", updateExtraCalculators);
  $("#gamesInput").addEventListener("input", updateExtraCalculators);

  document.addEventListener("click", async event => {
    const button = event.target.closest(".copy-btn");
    if (!button) return;
    const originalText = button.textContent;
    try {
      await copyText(button.dataset.copy || "");
      button.textContent = "تم النسخ";
      showToast("تم نسخ البيانات.", "success");
      window.setTimeout(() => { button.textContent = originalText; }, 1300);
    } catch {
      showToast("تعذر النسخ؛ حاول مرة أخرى.", "error");
    }
  });

  // تنظيف إدخال الحقول الرقمية من الحروف غير الرقمية مع دعم الكسور والسالب.
  $$('input[type="number"]').forEach(input => {
    input.addEventListener("input", () => {
      const cleaned = input.value.replace(/[^\d.,-]/g, "").replace(/,/g, ".");
      if (cleaned !== input.value) input.value = cleaned;
    });
  });
}

function initializeTheme() {
  let savedTheme = "dark";
  try {
    savedTheme = localStorage.getItem(THEME_KEY) || "dark";
  } catch {
    savedTheme = "dark";
  }
  setTheme(savedTheme === "light" ? "light" : "dark");
}

function initialize() {
  buildSelectOptions();
  renderVipTable();
  renderHistory();
  renderStats();
  initializeTheme();
  bindEvents();
  updateLockDisplay();
  updateExtraCalculators();
  calculate();
}

initialize();
