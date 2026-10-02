"use strict";

/* =========================================================
   مجلس القمة للشحن | F90
   Main JavaScript
   ========================================================= */

/* =========================
   VIP TABLE
   ========================= */

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


/* =========================
   STORAGE
   ========================= */

const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "majlis_alqimma_theme";


/* =========================
   EXTRA CALCULATOR RATES
   ========================= */

/* سحب التارجت */
const TARGET_JOD_RATE = 73;
const TARGET_USD_RATE = 85;
const TARGET_EGP_RATE = 5800;

/* مكاسب الألعاب */
const GAMES_JOD_RATE = 62;
const GAMES_USD_RATE = 85;
const GAMES_EGP_RATE = 4500;


/* =========================
   HELPERS
   ========================= */

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));


const state = {
  mode: "reach",
  records: loadRecords(),
  lastResult: null
};


/* =========================
   NUMBER FORMAT
   ========================= */

function formatNumber(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2
  }).format(number);
}


function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(number);
}


function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(normalized);

  return Number.isFinite(number) ? number : 0;
}


/* =========================
   TOAST
   ========================= */

function showToast(message, type = "success") {
  const region = $("#toastRegion");

  if (!region) {
    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <span class="toast-icon">
      ${type === "error" ? "!" : "✓"}
    </span>
    <span class="toast-message"></span>
  `;

  const messageElement = $(".toast-message", toast);

  if (messageElement) {
    messageElement.textContent = message;
  }

  region.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("show");
  });

  setTimeout(() => {
    toast.classList.remove("show");

    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 2800);
}


/* =========================
   STORAGE
   ========================= */

function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const records = JSON.parse(raw);

    if (!Array.isArray(records)) {
      return [];
    }

    return records.filter(record => {
      return record && typeof record === "object";
    });
  } catch (error) {
    console.error("تعذر تحميل السجل:", error);
    return [];
  }
}


function persistRecords() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state.records)
    );
  } catch (error) {
    console.error("تعذر حفظ السجل:", error);

    showToast(
      "تعذر حفظ البيانات في المتصفح",
      "error"
    );
  }
}


/* =========================
   VIP SELECTS
   ========================= */

function populateVipSelects() {
  const currentVip = $("#currentVip");
  const targetVip = $("#targetVip");
  const targetLockLevel = $("#targetLockLevel");

  const options = VIP_TABLE
    .map(item => {
      return `
        <option value="${item.level}">
          VIP ${item.level}
        </option>
      `;
    })
    .join("");

  if (currentVip) {
    currentVip.innerHTML = options;
  }

  if (targetVip) {
    targetVip.innerHTML = options;
  }

  if (targetLockLevel) {
    targetLockLevel.innerHTML = options;
  }

  if (currentVip) {
    currentVip.value = "1";
  }

  if (targetVip) {
    targetVip.value = "2";
  }

  if (targetLockLevel) {
    targetLockLevel.value = "1";
  }
}


/* =========================
   VIP DATA
   ========================= */

function getVip(level) {
  return (
    VIP_TABLE.find(item => item.level === Number(level)) ||
    VIP_TABLE[0]
  );
}


function getVipDifference(currentLevel, targetLevel) {
  const current = getVip(currentLevel);
  const target = getVip(targetLevel);

  return Math.max(
    0,
    target.total - current.total
  );
}


/* =========================
   MODE
   ========================= */

function setMode(mode) {
  state.mode = mode === "currentLock"
    ? "currentLock"
    : "reach";

  $$(".mode-option").forEach(button => {
    const active = button.dataset.mode === state.mode;

    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
  });

  const reachFields = $("#reachFields");
  const transitionRoute = $("#transitionRoute");
  const currentLockBox = $("#currentLockBox");

  if (reachFields) {
    reachFields.hidden = state.mode !== "reach";
  }

  if (transitionRoute) {
    transitionRoute.hidden = state.mode !== "reach";
  }

  if (currentLockBox) {
    currentLockBox.hidden = state.mode !== "currentLock";
  }

  updateLockDisplay();
}


/* =========================
   FORM VALUES
   ========================= */

function getFormValues() {
  return {
    mode: state.mode,

    currentVip: parseNumber(
      $("#currentVip")?.value
    ),

    targetVip: parseNumber(
      $("#targetVip")?.value
    ),

    multiplier: parseNumber(
      $("#multiplier")?.value
    ),

    transitionRoute:
      $("#transitionRoute")?.value || "",

    firstTransitionInput: parseNumber(
      $("#firstTransitionInput")?.value
    ),

    targetLockEnabled:
      Boolean($("#enableTargetLock")?.checked),

    targetLockValue: parseNumber(
      $("#targetLockValue")?.value
    ),

    targetLockLevel: parseNumber(
      $("#targetLockLevel")?.value
    ),

    supportRate: parseNumber(
      $("#supportRate")?.value
    ),

    jodRate: parseNumber(
      $("#jodRate")?.value
    ),

    usdRate: parseNumber(
      $("#usdRate")?.value
    ),

    egpRate: parseNumber(
      $("#egpRate")?.value
    )
  };
}


/* =========================
   LOCK DISPLAY
   ========================= */

function updateLockDisplay() {
  const values = getFormValues();

  const targetLockBox = $("#targetLockBox");
  const targetLockLevel = $("#targetLockLevel");
  const targetLockValue = $("#targetLockValue");

  if (targetLockBox) {
    targetLockBox.hidden = !values.targetLockEnabled;
  }

  if (targetLockLevel) {
    targetLockLevel.disabled = !values.targetLockEnabled;
  }

  if (targetLockValue) {
    targetLockValue.disabled = !values.targetLockEnabled;
  }

  const currentLockDescription =
    $("#currentLockDescription");

  const currentLockValue =
    $("#currentLockValue");

  if (values.mode === "currentLock") {
    const current = getVip(values.currentVip);

    if (currentLockDescription) {
      currentLockDescription.textContent =
        `قفل VIP ${current.level} يحتاج ${formatNumber(current.maintain)} نقطة للمحافظة.`;
    }

    if (currentLockValue) {
      currentLockValue.textContent =
        formatNumber(current.maintain);
    }
  }
}


/* =========================
   CALCULATION
   ========================= */

function calculateValues(values) {
  const currentVip = getVip(values.currentVip);
  const targetVip = getVip(values.targetVip);

  let multiplier = values.multiplier;

  if (!multiplier || multiplier <= 0) {
    multiplier = 1;
  }

  let vipPoints = 0;
  let supportNeeded = 0;
  let actualCharge = 0;
  let lockPoints = 0;
  let reachPoints = 0;
  let routeText = "";

  if (values.mode === "reach") {
    reachPoints = getVipDifference(
      values.currentVip,
      values.targetVip
    );

    vipPoints = reachPoints * multiplier;

    if (values.firstTransitionInput > 0) {
      vipPoints += values.firstTransitionInput;
    }

    if (values.targetLockEnabled) {
      const targetLock = getVip(
        values.targetLockLevel
      );

      lockPoints = targetLock.maintain;

      vipPoints += lockPoints;
    }

    supportNeeded = vipPoints;

    actualCharge =
      supportNeeded *
      (values.supportRate / 100000);

    routeText =
      `VIP ${currentVip.level} ← VIP ${targetVip.level}`;
  } else {
    lockPoints = currentVip.maintain;

    vipPoints = lockPoints;

    supportNeeded = lockPoints;

    actualCharge =
      supportNeeded *
      (values.supportRate / 100000);

    routeText =
      `محافظة على VIP ${currentVip.level}`;
  }

  const jodTotal =
    actualCharge * values.jodRate;

  const usdTotal =
    actualCharge * values.usdRate;

  const egpTotal =
    actualCharge * values.egpRate;

  return {
    multiplier,
    currentVip: currentVip.level,
    targetVip: targetVip.level,

    actualCharge,
    reachPoints,
    lockPoints,
    totalVipPoints: vipPoints,
    supportNeeded,

    jodTotal,
    usdTotal,
    egpTotal,

    routeText,

    vipFormula:
      `${formatNumber(reachPoints)} × ${formatNumber(multiplier)}`,

    supportFormula:
      `${formatNumber(supportNeeded)} × ${formatNumber(values.supportRate)}`
  };
}


/* =========================
   VALIDATION
   ========================= */

function validateCalculation(values) {
  const errorElement = $("#calculationError");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.hidden = true;
  }

  if (values.currentVip < 1 || values.currentVip > 20) {
    return "اختر مستوى VIP حالي صحيح.";
  }

  if (values.targetVip < 1 || values.targetVip > 20) {
    return "اختر مستوى VIP مستهدف صحيح.";
  }

  if (
    values.mode === "reach" &&
    values.targetVip <= values.currentVip
  ) {
    return "يجب أن يكون VIP المستهدف أعلى من VIP الحالي.";
  }

  if (values.multiplier < 0) {
    return "المضاعف لا يمكن أن يكون سالباً.";
  }

  if (values.supportRate < 0) {
    return "قيمة الدعم غير صحيحة.";
  }

  if (values.targetLockEnabled) {
    if (
      values.targetLockLevel < 1 ||
      values.targetLockLevel > 20
    ) {
      return "اختر مستوى قفل صحيح.";
    }
  }

  return "";
}


/* =========================
   RENDER RESULT
   ========================= */

function renderResult(result) {
  if (!result) {
    return;
  }

  const resultMultiplier = $("#resultMultiplier");
  const resultRoute = $("#resultRoute");
  const actualCharge = $("#actualCharge");
  const reachPoints = $("#reachPoints");
  const lockPoints = $("#lockPoints");
  const totalVipPoints = $("#totalVipPoints");
  const supportNeeded = $("#supportNeeded");
  const jodTotal = $("#jodTotal");
  const usdTotal = $("#usdTotal");
  const egpTotal = $("#egpTotal");
  const vipFormula = $("#vipFormula");
  const supportFormula = $("#supportFormula");

  if (resultMultiplier) {
    resultMultiplier.textContent =
      formatNumber(result.multiplier);
  }

  if (resultRoute) {
    resultRoute.textContent =
      result.routeText;
  }

  if (actualCharge) {
    actualCharge.textContent =
      formatMoney(result.actualCharge);
  }

  if (reachPoints) {
    reachPoints.textContent =
      formatNumber(result.reachPoints);
  }

  if (lockPoints) {
    lockPoints.textContent =
      formatNumber(result.lockPoints);
  }

  if (totalVipPoints) {
    totalVipPoints.textContent =
      formatNumber(result.totalVipPoints);
  }

  if (supportNeeded) {
    supportNeeded.textContent =
      formatNumber(result.supportNeeded);
  }

  if (jodTotal) {
    jodTotal.textContent =
      formatMoney(result.jodTotal);
  }

  if (usdTotal) {
    usdTotal.textContent =
      formatMoney(result.usdTotal);
  }

  if (egpTotal) {
    egpTotal.textContent =
      formatMoney(result.egpTotal);
  }

  if (vipFormula) {
    vipFormula.textContent =
      result.vipFormula;
  }

  if (supportFormula) {
    supportFormula.textContent =
      result.supportFormula;
  }

  animateResultNumbers();
}


/* =========================
   RESULT ANIMATION
   ========================= */

function animateResultNumbers() {
  const resultCard = $(".result-card");

  if (!resultCard) {
    return;
  }

  resultCard.classList.remove("result-pulse");

  requestAnimationFrame(() => {
    resultCard.classList.add("result-pulse");

    setTimeout(() => {
      resultCard.classList.remove("result-pulse");
    }, 700);
  });
}


/* =========================
   CALCULATE
   ========================= */

function calculate() {
  const values = getFormValues();

  const error = validateCalculation(values);

  const errorElement = $("#calculationError");

  if (error) {
    if (errorElement) {
      errorElement.textContent = error;
      errorElement.hidden = false;
    }

    showToast(error, "error");
    return null;
  }

  const result = calculateValues(values);

  state.lastResult = {
    values,
    result
  };

  renderResult(result);

  return {
    values,
    result
  };
}


/* =========================
   SAVE
   ========================= */

function saveCurrent() {
  const calculation = calculate();

  if (!calculation) {
    return;
  }

  const clientName =
    $("#clientName")?.value.trim() || "بدون اسم";

  const clientId =
    $("#clientId")?.value.trim() || "";

  const clientStatus =
    $("#clientStatus")?.value.trim() || "";

  const record = {
    id:
      `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    createdAt:
      new Date().toISOString(),

    clientName,
    clientId,
    clientStatus,

    mode:
      calculation.values.mode,

    values:
      calculation.values,

    result:
      calculation.result
  };

  state.records.unshift(record);

  if (state.records.length > 500) {
    state.records =
      state.records.slice(0, 500);
  }

  persistRecords();

  renderHistory();
  renderStats();

  showToast("تم حفظ العملية بنجاح");
}


/* =========================
   HISTORY
   ========================= */

function renderHistory(filter = "") {
  const history = $("#history");
  const historyEmpty = $("#historyEmpty");

  if (!history) {
    return;
  }

  const query =
    String(filter)
      .trim()
      .toLowerCase();

  const records =
    state.records.filter(record => {
      if (!query) {
        return true;
      }

      const text = [
        record.clientName,
        record.clientId,
        record.clientStatus,
        record.result?.routeText,
        record.values?.currentVip,
        record.values?.targetVip
      ]
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });

  history.innerHTML = "";

  if (!records.length) {
    if (historyEmpty) {
      historyEmpty.hidden = false;
    }

    return;
  }

  if (historyEmpty) {
    historyEmpty.hidden = true;
  }

  records.forEach(record => {
    const item = document.createElement("article");

    item.className = "history-record";

    const date = record.createdAt
      ? new Date(record.createdAt)
      : new Date();

    item.innerHTML = `
      <div class="history-record-top">
        <div>
          <strong class="history-name"></strong>
          <small class="history-date"></small>
        </div>

        <span class="history-vip">
          VIP ${Number(record.values?.targetVip || 0)}
        </span>
      </div>

      <div class="history-record-grid">
        <div>
          <span>العميل</span>
          <strong class="history-client-id"></strong>
        </div>

        <div>
          <span>المسار</span>
          <strong class="history-route"></strong>
        </div>

        <div>
          <span>النقاط</span>
          <strong class="history-points"></strong>
        </div>

        <div>
          <span>قيمة الحساب</span>
          <strong class="history-charge"></strong>
        </div>
      </div>

      <div class="history-actions">
        <button
          class="small-button"
          type="button"
          data-action="restore"
          data-id="${record.id}"
        >
          استعادة
        </button>

        <button
          class="small-button"
          type="button"
          data-action="share"
          data-id="${record.id}"
        >
          واتساب
        </button>

        <button
          class="small-button danger"
          type="button"
          data-action="delete"
          data-id="${record.id}"
        >
          حذف
        </button>
      </div>
    `;

    $(".history-name", item).textContent =
      record.clientName || "بدون اسم";

    $(".history-date", item).textContent =
      date.toLocaleString("ar");

    $(".history-client-id", item).textContent =
      record.clientId || "غير محدد";

    $(".history-route", item).textContent =
      record.result?.routeText || "غير محدد";

    $(".history-points", item).textContent =
      formatNumber(
        record.result?.totalVipPoints || 0
      );

    $(".history-charge", item).textContent =
      formatMoney(
        record.result?.actualCharge || 0
      );

    history.appendChild(item);
  });
}


/* =========================
   RESTORE RECORD
   ========================= */

function restoreRecord(id) {
  const record =
    state.records.find(item => item.id === id);

  if (!record) {
    return;
  }

  const values = record.values || {};

  if ($("#clientName")) {
    $("#clientName").value =
      record.clientName || "";
  }

  if ($("#clientId")) {
    $("#clientId").value =
      record.clientId || "";
  }

  if ($("#clientStatus")) {
    $("#clientStatus").value =
      record.clientStatus || "";
  }

  setMode(
    values.mode || "reach"
  );

  if ($("#currentVip")) {
    $("#currentVip").value =
      String(values.currentVip || 1);
  }

  if ($("#targetVip")) {
    $("#targetVip").value =
      String(values.targetVip || 2);
  }

  if ($("#multiplier")) {
    $("#multiplier").value =
      values.multiplier || 1;
  }

  if ($("#transitionRoute")) {
    $("#transitionRoute").value =
      values.transitionRoute || "";
  }

  if ($("#firstTransitionInput")) {
    $("#firstTransitionInput").value =
      values.firstTransitionInput || 0;
  }

  if ($("#enableTargetLock")) {
    $("#enableTargetLock").checked =
      Boolean(values.targetLockEnabled);
  }

  if ($("#targetLockValue")) {
    $("#targetLockValue").value =
      values.targetLockValue || 0;
  }

  if ($("#targetLockLevel")) {
    $("#targetLockLevel").value =
      String(values.targetLockLevel || 1);
  }

  if ($("#supportRate")) {
    $("#supportRate").value =
      values.supportRate ?? 130000;
  }

  if ($("#jodRate")) {
    $("#jodRate").value =
      values.jodRate ?? 11;
  }

  if ($("#usdRate")) {
    $("#usdRate").value =
      values.usdRate ?? 15;
  }

  if ($("#egpRate")) {
    $("#egpRate").value =
      values.egpRate ?? 600;
  }

  updateLockDisplay();

  calculate();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

  showToast("تمت استعادة العملية");
}


/* =========================
   DELETE RECORD
   ========================= */

function deleteRecord(id) {
  const index =
    state.records.findIndex(
      item => item.id === id
    );

  if (index === -1) {
    return;
  }

  state.records.splice(index, 1);

  persistRecords();

  renderHistory(
    $("#historySearch")?.value || ""
  );

  renderStats();

  showToast("تم حذف العملية");
}


/* =========================
   WHATSAPP SHARE
   ========================= */

function shareRecordWhatsApp(id) {
  const record =
    state.records.find(item => item.id === id);

  if (!record) {
    return;
  }

  const result =
    record.result || {};

  const message = [
    "مجلس القمة للشحن | F90",
    "",
    `العميل: ${record.clientName || "غير محدد"}`,
    `ID: ${record.clientId || "غير محدد"}`,
    `المسار: ${result.routeText || "غير محدد"}`,
    `النقاط: ${formatNumber(result.totalVipPoints || 0)}`,
    `القيمة: ${formatMoney(result.actualCharge || 0)}`,
    "",
    `JOD: ${formatMoney(result.jodTotal || 0)}`,
    `USD: ${formatMoney(result.usdTotal || 0)}`,
    `EGP: ${formatMoney(result.egpTotal || 0)}`
  ].join("\n");

  const url =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================
   STATS
   ========================= */

function renderStats() {
  const records = state.records;

  const operations =
    records.length;

  const customers =
    new Set(
      records
        .map(record => record.clientId)
        .filter(Boolean)
    ).size;

  const charge =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.actualCharge || 0),
      0
    );

  const support =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.supportNeeded || 0),
      0
    );

  const vipPoints =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.totalVipPoints || 0),
      0
    );

  const jod =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.jodTotal || 0),
      0
    );

  const usd =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.usdTotal || 0),
      0
    );

  const egp =
    records.reduce(
      (sum, record) =>
        sum +
        Number(record.result?.egpTotal || 0),
      0
    );

  const highestVip =
    records.reduce(
      (highest, record) => {
        return Math.max(
          highest,
          Number(record.values?.targetVip || 0)
        );
      },
      0
    );

  const setStat = (selector, value) => {
    const element = $(selector);

    if (element) {
      element.textContent = formatNumber(value);
    }
  };

  setStat("#statOperations", operations);
  setStat("#statCustomers", customers);
  setStat("#statCharge", charge);
  setStat("#statSupport", support);
  setStat("#statVipPoints", vipPoints);
  setStat("#statJod", jod);
  setStat("#statUsd", usd);
  setStat("#statEgp", egp);
  setStat("#statHighestVip", highestVip);
}


/* =========================
   VIP TABLE
   ========================= */

function renderVipTable() {
  const body =
    $("#vipTableBody");

  if (!body) {
    return;
  }

  body.innerHTML = "";

  VIP_TABLE.forEach(item => {
    const row =
      document.createElement("tr");

    row.innerHTML = `
      <td>
        <span class="table-vip">
          VIP ${item.level}
        </span>
      </td>

      <td>
        ${formatNumber(item.total)}
      </td>

      <td>
        ${formatNumber(item.upgrade)}
      </td>

      <td>
        ${formatNumber(item.maintain)}
      </td>
    `;

    body.appendChild(row);
  });
}


/* =========================
   EXTRA CALCULATORS
   ========================= */

function updateExtraCalculators() {
  const targetInput =
    parseNumber(
      $("#targetInput")?.value
    );

  const gamesInput =
    parseNumber(
      $("#gamesInput")?.value
    );


  /* سحب التارجت */

  const targetJod =
    targetInput / TARGET_JOD_RATE;

  const targetUsd =
    targetInput / TARGET_USD_RATE;

  const targetEgp =
    targetInput * TARGET_EGP_RATE;


  /* مكاسب الألعاب */

  const gamesJod =
    gamesInput / GAMES_JOD_RATE;

  const gamesUsd =
    gamesInput / GAMES_USD_RATE;

  const gamesEgp =
    gamesInput * GAMES_EGP_RATE;


  const update = (
    selector,
    value
  ) => {
    const element = $(selector);

    if (element) {
      element.textContent =
        formatMoney(value);
    }
  };


  update(
    "#targetJod",
    targetJod
  );

  update(
    "#targetUsd",
    targetUsd
  );

  update(
    "#targetEgp",
    targetEgp
  );

  update(
    "#gamesJod",
    gamesJod
  );

  update(
    "#gamesUsd",
    gamesUsd
  );

  update(
    "#gamesEgp",
    gamesEgp
  );
}


/* =========================
   NEW OPERATION
   ========================= */

function newOperation() {
  state.lastResult = null;

  if ($("#clientName")) {
    $("#clientName").value = "";
  }

  if ($("#clientId")) {
    $("#clientId").value = "";
  }

  if ($("#clientStatus")) {
    $("#clientStatus").value = "";
  }

  if ($("#currentVip")) {
    $("#currentVip").value = "1";
  }

  if ($("#targetVip")) {
    $("#targetVip").value = "2";
  }

  if ($("#multiplier")) {
    $("#multiplier").value = "1";
  }

  if ($("#transitionRoute")) {
    $("#transitionRoute").value = "";
  }

  if ($("#firstTransitionInput")) {
    $("#firstTransitionInput").value = "0";
  }

  if ($("#enableTargetLock")) {
    $("#enableTargetLock").checked = false;
  }

  if ($("#targetLockValue")) {
    $("#targetLockValue").value = "0";
  }

  if ($("#targetLockLevel")) {
    $("#targetLockLevel").value = "1";
  }

  if ($("#supportRate")) {
    $("#supportRate").value = "130000";
  }

  if ($("#jodRate")) {
    $("#jodRate").value = "11";
  }

  if ($("#usdRate")) {
    $("#usdRate").value = "15";
  }

  if ($("#egpRate")) {
    $("#egpRate").value = "600";
  }

  const errorElement =
    $("#calculationError");

  if (errorElement) {
    errorElement.textContent = "";
    errorElement.hidden = true;
  }

  setMode("reach");
  updateLockDisplay();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================
   THEME
   ========================= */

function setTheme(theme) {
  const normalized =
    theme === "light"
      ? "light"
      : "dark";

  document.body.classList.toggle(
    "light",
    normalized === "light"
  );

  try {
    localStorage.setItem(
      THEME_KEY,
      normalized
    );
  } catch (error) {
    console.error(error);
  }

  const button =
    $("#themeToggle");

  if (button) {
    const icon =
      normalized === "light"
        ? "☾"
        : "☼";

    const text =
      normalized === "light"
        ? "الوضع الداكن"
        : "غير الثيم";

    button.innerHTML =
      `${icon} <span>${text}</span>`;
  }
}


function initializeTheme() {
  let theme = "dark";

  try {
    const saved =
      localStorage.getItem(
        THEME_KEY
      );

    if (
      saved === "light" ||
      saved === "dark"
    ) {
      theme = saved;
    }
  } catch (error) {
    console.error(error);
  }

  setTheme(theme);
}


/* =========================
   COPY
   ========================= */

async function copyText(text) {
  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      text
    );

    showToast("تم النسخ");
  } catch (error) {
    const textarea =
      document.createElement("textarea");

    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";

    document.body.appendChild(
      textarea
    );

    textarea.select();

    try {
      document.execCommand("copy");
      showToast("تم النسخ");
    } catch (copyError) {
      showToast(
        "تعذر النسخ",
        "error"
      );
    }

    textarea.remove();
  }
}


/* =========================
   EVENTS
   ========================= */

function bindEvents() {

  /* تغيير الوضع */

  $$(".mode-option").forEach(button => {
    button.addEventListener(
      "click",
      () => {
        setMode(
          button.dataset.mode
        );
      }
    );
  });


  /* الثيم */

  const themeToggle =
    $("#themeToggle");

  if (themeToggle) {
    themeToggle.addEventListener(
      "click",
      () => {
        const isLight =
          document.body.classList.contains(
            "light"
          );

        setTheme(
          isLight
            ? "dark"
            : "light"
        );
      }
    );
  }


  /* الحساب */

  const calculateButton =
    $("#calculateBtn");

  if (calculateButton) {
    calculateButton.addEventListener(
      "click",
      calculate
    );
  }


  /* الحفظ */

  const saveButton =
    $("#saveBtn");

  if (saveButton) {
    saveButton.addEventListener(
      "click",
      saveCurrent
    );
  }


  /* عملية جديدة */

  const newButton =
    $("#newBtn");

  if (newButton) {
    newButton.addEventListener(
      "click",
      newOperation
    );
  }


  /* البحث في السجل */

  const historySearch =
    $("#historySearch");

  if (historySearch) {
    historySearch.addEventListener(
      "input",
      event => {
        renderHistory(
          event.target.value
        );
      }
    );
  }


  /* مسح السجل */

  const clearHistory =
    $("#clearHistory");

  if (clearHistory) {
    clearHistory.addEventListener(
      "click",
      () => {

        if (!state.records.length) {
          showToast(
            "السجل فارغ",
            "error"
          );
          return;
        }

        const confirmed =
          window.confirm(
            "هل تريد حذف جميع العمليات من السجل؟"
          );

        if (!confirmed) {
          return;
        }

        state.records = [];

        persistRecords();

        renderHistory();
        renderStats();

        showToast(
          "تم مسح السجل"
        );
      }
    );
  }


  /* سجل العمليات */

  const history =
    $("#history");

  if (history) {
    history.addEventListener(
      "click",
      event => {

        const button =
          event.target.closest(
            "[data-action]"
          );

        if (!button) {
          return;
        }

        const id =
          button.dataset.id;

        const action =
          button.dataset.action;

        if (action === "restore") {
          restoreRecord(id);
        }

        if (action === "delete") {
          deleteRecord(id);
        }

        if (action === "share") {
          shareRecordWhatsApp(id);
        }
      }
    );
  }


  /* قفل التارجت */

  const targetLock =
    $("#enableTargetLock");

  if (targetLock) {
    targetLock.addEventListener(
      "change",
      updateLockDisplay
    );
  }


  /* حقول القفل */

  [
    "#currentVip",
    "#targetVip",
    "#targetLockLevel",
    "#targetLockValue"
  ].forEach(selector => {
    const element = $(selector);

    if (element) {
      element.addEventListener(
        "input",
        updateLockDisplay
      );

      element.addEventListener(
        "change",
        updateLockDisplay
      );
    }
  });


  /* الحاسبات الإضافية */

  [
    "#targetInput",
    "#gamesInput"
  ].forEach(selector => {
    const element = $(selector);

    if (element) {
      element.addEventListener(
        "input",
        updateExtraCalculators
      );

      element.addEventListener(
        "change",
        updateExtraCalculators
      );
    }
  });


  /* أزرار النسخ */

  $$(".copy-btn").forEach(button => {
    button.addEventListener(
      "click",
      () => {
        copyText(
          button.dataset.copy || ""
        );
      }
    );
  });


  /* زر Enter للحساب */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !== "Enter" ||
        event.shiftKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const tag =
        document.activeElement?.tagName;

      if (
        tag === "TEXTAREA" ||
        tag === "BUTTON" ||
        tag === "SELECT"
      ) {
        return;
      }

      const activeSection =
        document.activeElement?.closest(
          "#vip"
        );

      if (activeSection) {
        event.preventDefault();
        calculate();
      }
    }
  );
}


/* =========================================================
   PREMIUM VISUAL SYSTEM
   لا يغير أي حسابات
   ========================================================= */

function initPremiumMotion() {

  const body =
    document.body;

  if (!body) {
    return;
  }

  body.classList.add(
    "premium-ready"
  );


  const reducedMotion =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* =========================
     REVEAL ON SCROLL
     ========================= */

  const revealTargets =
    $$(`
      .hero,
      .fold-section,
      .vip-section,
      .calculator-section,
      .side-card,
      .side-note,
      .contact-section,
      .contact-card,
      .site-footer
    `);

  revealTargets.forEach(
    (element, index) => {

      element.classList.add(
        "premium-reveal"
      );

      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(index * 45, 450)}ms`
      );
    }
  );


  if (
    reducedMotion ||
    !("IntersectionObserver" in window)
  ) {

    revealTargets.forEach(
      element => {
        element.classList.add(
          "is-visible"
        );
      }
    );

  } else {

    const observer =
      new IntersectionObserver(
        entries => {

          entries.forEach(
            entry => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              entry.target.classList.add(
                "is-visible"
              );

              observer.unobserve(
                entry.target
              );
            }
          );

        },
        {
          threshold: 0.08,
          rootMargin:
            "0px 0px -45px 0px"
        }
      );


    revealTargets.forEach(
      element => {
        observer.observe(element);
      }
    );
  }


  /* =========================
     HEADER SCROLL EFFECT
     ========================= */

  const header =
    $(".site-header");

  if (header) {

    const updateHeader =
      () => {

        header.classList.toggle(
          "is-scrolled",
          window.scrollY > 20
        );
      };


    window.addEventListener(
      "scroll",
      updateHeader,
      {
        passive: true
      }
    );


    updateHeader();
  }


  /* =========================
     3D TILT
     ========================= */

  const finePointer =
    window.matchMedia(
      "(pointer: fine)"
    ).matches;


  if (
    finePointer &&
    !reducedMotion
  ) {

    const tiltTargets =
      $$(`
        .hero-stamp,
        .side-card,
        .extra-card,
        .contact-card,
        .result-card,
        .stat-card
      `);


    tiltTargets.forEach(
      element => {

        element.classList.add(
          "tilt-card"
        );


        element.addEventListener(
          "pointermove",
          event => {

            if (
              event.pointerType !==
              "mouse"
            ) {
              return;
            }

            const rect =
              element.getBoundingClientRect();

            if (
              !rect.width ||
              !rect.height
            ) {
              return;
            }


            const x =
              (event.clientX -
                rect.left) /
              rect.width;

            const y =
              (event.clientY -
                rect.top) /
              rect.height;


            const rotateX =
              (0.5 - y) * 6;

            const rotateY =
              (x - 0.5) * 8;


            element.style.setProperty(
              "--tilt-x",
              `${rotateX}deg`
            );

            element.style.setProperty(
              "--tilt-y",
              `${rotateY}deg`
            );

            element.style.setProperty(
              "--glow-x",
              `${x * 100}%`
            );

            element.style.setProperty(
              "--glow-y",
              `${y * 100}%`
            );

            element.classList.add(
              "tilting"
            );
          }
        );


        element.addEventListener(
          "pointerleave",
          () => {

            element.style.setProperty(
              "--tilt-x",
              "0deg"
            );

            element.style.setProperty(
              "--tilt-y",
              "0deg"
            );

            element.classList.remove(
              "tilting"
            );
          }
        );
      }
    );
  }


  /* =========================
     BUTTON PRESS ANIMATION
     ========================= */

  const interactiveButtons =
    $$(`
      button,
      .mode-option,
      .copy-btn,
      .header-nav a
    `);


  interactiveButtons.forEach(
    button => {

      button.addEventListener(
        "pointerdown",
        () => {
          button.classList.add(
            "pressing"
          );
        }
      );


      button.addEventListener(
        "pointerup",
        () => {
          button.classList.remove(
            "pressing"
          );
        }
      );


      button.addEventListener(
        "pointercancel",
        () => {
          button.classList.remove(
            "pressing"
          );
        }
      );


      button.addEventListener(
        "pointerleave",
        () => {
          button.classList.remove(
            "pressing"
          );
        }
      );
    }
  );


  /* =========================
     POINTER GLOW
     ========================= */

  if (
    finePointer &&
    !reducedMotion
  ) {

    const glowTargets =
      $$(`
        .fold-section,
        .vip-section,
        .calculator-section,
        .side-card,
        .side-note,
        .contact-card,
        .result-card,
        .extra-card
      `);


    glowTargets.forEach(
      element => {

        element.addEventListener(
          "pointermove",
          event => {

            if (
              event.pointerType !==
              "mouse"
            ) {
              return;
            }

            const rect =
              element.getBoundingClientRect();

            const x =
              ((event.clientX -
                rect.left) /
                rect.width) *
              100;

            const y =
              ((event.clientY -
                rect.top) /
                rect.height) *
              100;

            element.style.setProperty(
              "--pointer-x",
              `${x}%`
            );

            element.style.setProperty(
              "--pointer-y",
              `${y}%`
            );
          }
        );
      }
    );
  }


  /* =========================
     ACTIVE NAVIGATION
     ========================= */

  const navLinks =
    $$(".header-nav a");

  const sections =
    $$(
      "#vip, #historySection, #vipTableSection, #contact"
    );


  if (
    sections.length &&
    navLinks.length &&
    "IntersectionObserver" in window
  ) {

    const navObserver =
      new IntersectionObserver(
        entries => {

          entries.forEach(
            entry => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              const id =
                entry.target.id;

              navLinks.forEach(
                link => {

                  const active =
                    link.getAttribute(
                      "href"
                    ) === `#${id}`;

                  link.classList.toggle(
                    "active",
                    active
                  );
                }
              );
            }
          );

        },
        {
          threshold: 0.25,
          rootMargin:
            "-15% 0px -60% 0px"
        }
      );


    sections.forEach(
      section => {
        navObserver.observe(
          section
        );
      }
    );
  }
}


/* =========================
   INITIALIZE
   ========================= */

function initialize() {

  populateVipSelects();

  initializeTheme();

  bindEvents();

  setMode("reach");

  updateLockDisplay();

  renderHistory();

  renderStats();

  renderVipTable();

  updateExtraCalculators();
}


/* =========================
   START
   ========================= */

initialize();

initPremiumMotion();
