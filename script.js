"use strict";

/* =========================================================
   مجلس القمة للشحن | F90
   SCRIPT.JS - النسخة الكاملة
   ========================================================= */


/* =========================================================
   VIP TABLE
   ========================================================= */

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


/* =========================================================
   SETTINGS
   ========================================================= */

const STORAGE_KEY = "majlis_alqimma_vip_records_v5";
const THEME_KEY = "majlis_alqimma_theme";

const TARGET_JOD_RATE = 73;
const TARGET_USD_RATE = 85;
const TARGET_EGP_RATE = 5800;

const GAMES_JOD_RATE = 62;
const GAMES_USD_RATE = 85;
const GAMES_EGP_RATE = 4500;


/* =========================================================
   HELPERS
   ========================================================= */

const $ = (selector, parent = document) =>
  parent.querySelector(selector);

const $$ = (selector, parent = document) =>
  Array.from(parent.querySelectorAll(selector));


const state = {
  mode: "reach",
  records: loadRecords(),
  lastResult: null
};


/* =========================================================
   NUMBER FUNCTIONS
   ========================================================= */

function parseNumber(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  const number = Number(cleaned);

  return Number.isFinite(number)
    ? number
    : 0;
}


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
    maximumFractionDigits: 2
  }).format(number);
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {
  const region = $("#toastRegion");

  if (!region) {
    return;
  }

  const toast = document.createElement("div");

  toast.className = `toast toast-${type}`;

  const icon =
    type === "error"
      ? "!"
      : "✓";

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message"></span>
  `;

  const messageElement =
    $(".toast-message", toast);

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


/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadRecords() {
  try {
    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    console.error(error);
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
    console.error(error);

    showToast(
      "تعذر حفظ البيانات",
      "error"
    );
  }
}


/* =========================================================
   VIP SELECTS
   ========================================================= */

function populateVipSelects() {
  const options =
    VIP_TABLE.map(vip => `
      <option value="${vip.level}">
        VIP ${vip.level}
      </option>
    `).join("");

  const currentVip =
    $("#currentVip");

  const targetVip =
    $("#targetVip");

  const targetLockLevel =
    $("#targetLockLevel");

  if (currentVip) {
    currentVip.innerHTML =
      options;
    currentVip.value = "1";
  }

  if (targetVip) {
    targetVip.innerHTML =
      options;
    targetVip.value = "2";
  }

  if (targetLockLevel) {
    targetLockLevel.innerHTML =
      options;
    targetLockLevel.value = "1";
  }
}


function getVip(level) {
  return (
    VIP_TABLE.find(
      vip =>
        vip.level === Number(level)
    ) ||
    VIP_TABLE[0]
  );
}


/* =========================================================
   MODE
   ========================================================= */

function setMode(mode) {
  state.mode =
    mode === "currentLock"
      ? "currentLock"
      : "reach";

  $$(".mode-option").forEach(
    button => {

      const active =
        button.dataset.mode ===
        state.mode;

      button.classList.toggle(
        "active",
        active
      );

      button.setAttribute(
        "aria-selected",
        active
          ? "true"
          : "false"
      );
    }
  );


  const reachFields =
    $("#reachFields");

  const transitionRoute =
    $("#transitionRoute");

  const currentLockBox =
    $("#currentLockBox");


  if (reachFields) {
    reachFields.hidden =
      state.mode !== "reach";
  }

  if (transitionRoute) {
    transitionRoute.hidden =
      state.mode !== "reach";
  }

  if (currentLockBox) {
    currentLockBox.hidden =
      state.mode !== "currentLock";
  }

  updateLockDisplay();
}


/* =========================================================
   FORM VALUES
   ========================================================= */

function getFormValues() {
  return {

    mode:
      state.mode,

    currentVip:
      parseNumber(
        $("#currentVip")?.value
      ),

    targetVip:
      parseNumber(
        $("#targetVip")?.value
      ),

    multiplier:
      parseNumber(
        $("#multiplier")?.value
      ),

    transitionRoute:
      $("#transitionRoute")?.value ||
      "",

    firstTransitionInput:
      parseNumber(
        $("#firstTransitionInput")?.value
      ),

    targetLockEnabled:
      Boolean(
        $("#enableTargetLock")?.checked
      ),

    targetLockValue:
      parseNumber(
        $("#targetLockValue")?.value
      ),

    targetLockLevel:
      parseNumber(
        $("#targetLockLevel")?.value
      ),

    supportRate:
      parseNumber(
        $("#supportRate")?.value
      ),

    jodRate:
      parseNumber(
        $("#jodRate")?.value
      ),

    usdRate:
      parseNumber(
        $("#usdRate")?.value
      ),

    egpRate:
      parseNumber(
        $("#egpRate")?.value
      )
  };
}


/* =========================================================
   LOCK
   ========================================================= */

function updateLockDisplay() {
  const values =
    getFormValues();

  const targetLockBox =
    $("#targetLockBox");

  const targetLockLevel =
    $("#targetLockLevel");

  const targetLockValue =
    $("#targetLockValue");


  if (targetLockBox) {
    targetLockBox.hidden =
      !values.targetLockEnabled;
  }

  if (targetLockLevel) {
    targetLockLevel.disabled =
      !values.targetLockEnabled;
  }

  if (targetLockValue) {
    targetLockValue.disabled =
      !values.targetLockEnabled;
  }


  const description =
    $("#currentLockDescription");

  const currentLockValue =
    $("#currentLockValue");


  if (
    values.mode ===
    "currentLock"
  ) {

    const current =
      getVip(
        values.currentVip
      );

    if (description) {
      description.textContent =
        `قفل VIP ${current.level} يحتاج ${formatNumber(current.maintain)} نقطة للمحافظة.`;
    }

    if (currentLockValue) {
      currentLockValue.textContent =
        formatNumber(
          current.maintain
        );
    }
  }
}


/* =========================================================
   CALCULATION
   ========================================================= */

function calculateValues(values) {

  const current =
    getVip(values.currentVip);

  const target =
    getVip(values.targetVip);


  let multiplier =
    values.multiplier;

  if (
    !multiplier ||
    multiplier <= 0
  ) {
    multiplier = 1;
  }


  let reachPoints = 0;
  let lockPoints = 0;
  let totalVipPoints = 0;
  let supportNeeded = 0;
  let actualCharge = 0;


  if (
    values.mode === "reach"
  ) {

    reachPoints =
      Math.max(
        0,
        target.total -
        current.total
      );


    totalVipPoints =
      reachPoints *
      multiplier;


    if (
      values.firstTransitionInput >
      0
    ) {
      totalVipPoints +=
        values.firstTransitionInput;
    }


    if (
      values.targetLockEnabled
    ) {

      const lock =
        getVip(
          values.targetLockLevel
        );

      lockPoints =
        lock.maintain;

      totalVipPoints +=
        lockPoints;
    }


    supportNeeded =
      totalVipPoints;

  } else {

    lockPoints =
      current.maintain;

    totalVipPoints =
      lockPoints;

    supportNeeded =
      lockPoints;
  }


  actualCharge =
    supportNeeded *
    (
      values.supportRate /
      100000
    );


  const jodTotal =
    actualCharge *
    values.jodRate;

  const usdTotal =
    actualCharge *
    values.usdRate;

  const egpTotal =
    actualCharge *
    values.egpRate;


  const routeText =
    values.mode === "reach"
      ? `VIP ${current.level} ← VIP ${target.level}`
      : `محافظة على VIP ${current.level}`;


  return {

    multiplier,

    currentVip:
      current.level,

    targetVip:
      target.level,

    actualCharge,

    reachPoints,

    lockPoints,

    totalVipPoints,

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


/* =========================================================
   VALIDATION
   ========================================================= */

function validateCalculation(values) {

  if (
    values.currentVip < 1 ||
    values.currentVip > 20
  ) {
    return "اختر مستوى VIP الحالي.";
  }


  if (
    values.targetVip < 1 ||
    values.targetVip > 20
  ) {
    return "اختر مستوى VIP المستهدف.";
  }


  if (
    values.mode === "reach" &&
    values.targetVip <=
    values.currentVip
  ) {
    return "يجب أن يكون VIP المستهدف أعلى من الحالي.";
  }


  if (
    values.multiplier < 0
  ) {
    return "المضاعف غير صحيح.";
  }


  if (
    values.supportRate < 0
  ) {
    return "قيمة الدعم غير صحيحة.";
  }


  return "";
}


/* =========================================================
   RENDER RESULT
   ========================================================= */

function renderResult(result) {

  if (!result) {
    return;
  }


  const setText =
    (selector, value) => {

      const element =
        $(selector);

      if (element) {
        element.textContent =
          value;
      }
    };


  setText(
    "#resultMultiplier",
    formatNumber(
      result.multiplier
    )
  );


  setText(
    "#resultRoute",
    result.routeText
  );


  setText(
    "#actualCharge",
    formatMoney(
      result.actualCharge
    )
  );


  setText(
    "#reachPoints",
    formatNumber(
      result.reachPoints
    )
  );


  setText(
    "#lockPoints",
    formatNumber(
      result.lockPoints
    )
  );


  setText(
    "#totalVipPoints",
    formatNumber(
      result.totalVipPoints
    )
  );


  setText(
    "#supportNeeded",
    formatNumber(
      result.supportNeeded
    )
  );


  setText(
    "#jodTotal",
    formatMoney(
      result.jodTotal
    )
  );


  setText(
    "#usdTotal",
    formatMoney(
      result.usdTotal
    )
  );


  setText(
    "#egpTotal",
    formatMoney(
      result.egpTotal
    )
  );


  setText(
    "#vipFormula",
    result.vipFormula
  );


  setText(
    "#supportFormula",
    result.supportFormula
  );


  const resultCard =
    $(".result-card");

  if (resultCard) {

    resultCard.classList.remove(
      "result-pulse"
    );

    requestAnimationFrame(() => {

      resultCard.classList.add(
        "result-pulse"
      );

      setTimeout(() => {

        resultCard.classList.remove(
          "result-pulse"
        );

      }, 700);
    });
  }
}


/* =========================================================
   CALCULATE
   ========================================================= */

function calculate() {

  const values =
    getFormValues();


  const error =
    validateCalculation(
      values
    );


  const errorElement =
    $("#calculationError");


  if (error) {

    if (errorElement) {
      errorElement.textContent =
        error;

      errorElement.hidden =
        false;
    }

    showToast(
      error,
      "error"
    );

    return null;
  }


  if (errorElement) {
    errorElement.textContent =
      "";

    errorElement.hidden =
      true;
  }


  const result =
    calculateValues(
      values
    );


  state.lastResult = {
    values,
    result
  };


  renderResult(
    result
  );


  return {
    values,
    result
  };
}


/* =========================================================
   SAVE
   ========================================================= */

function saveCurrent() {

  const calculation =
    calculate();


  if (!calculation) {
    return;
  }


  const record = {

    id:
      `${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`,

    createdAt:
      new Date().toISOString(),

    clientName:
      $("#clientName")?.value.trim() ||
      "بدون اسم",

    clientId:
      $("#clientId")?.value.trim() ||
      "",

    clientStatus:
      $("#clientStatus")?.value.trim() ||
      "",

    mode:
      calculation.values.mode,

    values:
      calculation.values,

    result:
      calculation.result
  };


  state.records.unshift(
    record
  );


  if (
    state.records.length > 500
  ) {
    state.records =
      state.records.slice(
        0,
        500
      );
  }


  persistRecords();

  renderHistory();

  renderStats();

  showToast(
    "تم حفظ العملية بنجاح"
  );
}


/* =========================================================
   HISTORY
   ========================================================= */

function renderHistory(
  filter = ""
) {

  const history =
    $("#history");

  const historyEmpty =
    $("#historyEmpty");


  if (!history) {
    return;
  }


  const query =
    String(filter)
      .trim()
      .toLowerCase();


  const records =
    state.records.filter(
      record => {

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


        return text.includes(
          query
        );
      }
    );


  history.innerHTML =
    "";


  if (!records.length) {

    if (historyEmpty) {
      historyEmpty.hidden =
        false;
    }

    return;
  }


  if (historyEmpty) {
    historyEmpty.hidden =
      true;
  }


  records.forEach(
    record => {

      const item =
        document.createElement(
          "article"
        );


      item.className =
        "history-record";


      item.innerHTML = `

        <div class="history-record-top">

          <div>

            <strong class="history-name"></strong>

            <small class="history-date"></small>

          </div>

          <span class="history-vip">
            VIP ${Number(
              record.values?.targetVip ||
              0
            )}
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
            <span>القيمة</span>
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


      const date =
        record.createdAt
          ? new Date(
              record.createdAt
            )
          : new Date();


      $(".history-name", item)
        .textContent =
        record.clientName ||
        "بدون اسم";


      $(".history-date", item)
        .textContent =
        date.toLocaleString(
          "ar"
        );


      $(".history-client-id", item)
        .textContent =
        record.clientId ||
        "غير محدد";


      $(".history-route", item)
        .textContent =
        record.result?.routeText ||
        "غير محدد";


      $(".history-points", item)
        .textContent =
        formatNumber(
          record.result
            ?.totalVipPoints || 0
        );


      $(".history-charge", item)
        .textContent =
        formatMoney(
          record.result
            ?.actualCharge || 0
        );


      history.appendChild(
        item
      );
    }
  );
}


/* =========================================================
   RESTORE
   ========================================================= */

function restoreRecord(id) {

  const record =
    state.records.find(
      item => item.id === id
    );


  if (!record) {
    return;
  }


  const values =
    record.values || {};


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
    values.mode ||
    "reach"
  );


  const setValue =
    (selector, value) => {

      const element =
        $(selector);

      if (element) {
        element.value =
          value;
      }
    };


  setValue(
    "#currentVip",
    String(
      values.currentVip || 1
    )
  );


  setValue(
    "#targetVip",
    String(
      values.targetVip || 2
    )
  );


  setValue(
    "#multiplier",
    values.multiplier || 1
  );


  setValue(
    "#transitionRoute",
    values.transitionRoute || ""
  );


  setValue(
    "#firstTransitionInput",
    values.firstTransitionInput || 0
  );


  if ($("#enableTargetLock")) {
    $("#enableTargetLock").checked =
      Boolean(
        values.targetLockEnabled
      );
  }


  setValue(
    "#targetLockValue",
    values.targetLockValue || 0
  );


  setValue(
    "#targetLockLevel",
    String(
      values.targetLockLevel || 1
    )
  );


  setValue(
    "#supportRate",
    values.supportRate ??
    130000
  );


  setValue(
    "#jodRate",
    values.jodRate ??
    11
  );


  setValue(
    "#usdRate",
    values.usdRate ??
    15
  );


  setValue(
    "#egpRate",
    values.egpRate ??
    600
  );


  updateLockDisplay();

  calculate();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });


  showToast(
    "تمت استعادة العملية"
  );
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteRecord(id) {

  const index =
    state.records.findIndex(
      record =>
        record.id === id
    );


  if (index === -1) {
    return;
  }


  state.records.splice(
    index,
    1
  );


  persistRecords();


  renderHistory(
    $("#historySearch")
      ?.value || ""
  );


  renderStats();


  showToast(
    "تم حذف العملية"
  );
}


/* =========================================================
   WHATSAPP
   ========================================================= */

function shareRecordWhatsApp(id) {

  const record =
    state.records.find(
      item => item.id === id
    );


  if (!record) {
    return;
  }


  const result =
    record.result || {};


  const message = [

    "مجلس القمة للشحن | F90",

    "",

    `العميل: ${
      record.clientName ||
      "غير محدد"
    }`,

    `ID: ${
      record.clientId ||
      "غير محدد"
    }`,

    `المسار: ${
      result.routeText ||
      "غير محدد"
    }`,

    `النقاط: ${
      formatNumber(
        result.totalVipPoints ||
        0
      )
    }`,

    `القيمة: ${
      formatMoney(
        result.actualCharge ||
        0
      )
    }`,

    "",

    `JOD: ${
      formatMoney(
        result.jodTotal ||
        0
      )
    }`,

    `USD: ${
      formatMoney(
        result.usdTotal ||
        0
      )
    }`,

    `EGP: ${
      formatMoney(
        result.egpTotal ||
        0
      )
    }`

  ].join("\n");


  const url =
    `https://wa.me/?text=${encodeURIComponent(
      message
    )}`;


  window.open(
    url,
    "_blank",
    "noopener,noreferrer"
  );
}


/* =========================================================
   STATS
   ========================================================= */

function renderStats() {

  const records =
    state.records;


  const operations =
    records.length;


  const customers =
    new Set(
      records
        .map(
          record =>
            record.clientId
        )
        .filter(Boolean)
    ).size;


  const charge =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.actualCharge || 0
        ),
      0
    );


  const support =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.supportNeeded || 0
        ),
      0
    );


  const vipPoints =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.totalVipPoints || 0
        ),
      0
    );


  const jod =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.jodTotal || 0
        ),
      0
    );


  const usd =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.usdTotal || 0
        ),
      0
    );


  const egp =
    records.reduce(
      (sum, record) =>
        sum +
        Number(
          record.result
            ?.egpTotal || 0
        ),
      0
    );


  const highestVip =
    records.reduce(
      (highest, record) =>
        Math.max(
          highest,
          Number(
            record.values
              ?.targetVip || 0
          )
        ),
      0
    );


  const set =
    (selector, value) => {

      const element =
        $(selector);

      if (element) {
        element.textContent =
          formatNumber(value);
      }
    };


  set(
    "#statOperations",
    operations
  );

  set(
    "#statCustomers",
    customers
  );

  set(
    "#statCharge",
    charge
  );

  set(
    "#statSupport",
    support
  );

  set(
    "#statVipPoints",
    vipPoints
  );

  set(
    "#statJod",
    jod
  );

  set(
    "#statUsd",
    usd
  );

  set(
    "#statEgp",
    egp
  );

  set(
    "#statHighestVip",
    highestVip
  );
}


/* =========================================================
   VIP TABLE
   ========================================================= */

function renderVipTable() {

  const body =
    $("#vipTableBody");


  if (!body) {
    return;
  }


  body.innerHTML =
    "";


  VIP_TABLE.forEach(
    vip => {

      const row =
        document.createElement(
          "tr"
        );


      row.innerHTML = `

        <td>
          <span class="table-vip">
            VIP ${vip.level}
          </span>
        </td>

        <td>
          ${formatNumber(
            vip.total
          )}
        </td>

        <td>
          ${formatNumber(
            vip.upgrade
          )}
        </td>

        <td>
          ${formatNumber(
            vip.maintain
          )}
        </td>

      `;


      body.appendChild(
        row
      );
    }
  );
}


/* =========================================================
   EXTRA CALCULATORS
   ========================================================= */

function updateExtraCalculators() {

  const targetInput =
    parseNumber(
      $("#targetInput")
        ?.value
    );


  const gamesInput =
    parseNumber(
      $("#gamesInput")
        ?.value
    );


  const targetJod =
    targetInput /
    TARGET_JOD_RATE;


  const targetUsd =
    targetInput /
    TARGET_USD_RATE;


  const targetEgp =
    targetInput *
    TARGET_EGP_RATE;


  const gamesJod =
    gamesInput /
    GAMES_JOD_RATE;


  const gamesUsd =
    gamesInput /
    GAMES_USD_RATE;


  const gamesEgp =
    gamesInput *
    GAMES_EGP_RATE;


  const update =
    (selector, value) => {

      const element =
        $(selector);

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


/* =========================================================
   NEW OPERATION
   ========================================================= */

function newOperation() {

  state.lastResult =
    null;


  const clear =
    selector => {

      const element =
        $(selector);

      if (element) {
        element.value =
          "";
      }
    };


  clear("#clientName");
  clear("#clientId");
  clear("#clientStatus");


  if ($("#currentVip")) {
    $("#currentVip").value =
      "1";
  }


  if ($("#targetVip")) {
    $("#targetVip").value =
      "2";
  }


  if ($("#multiplier")) {
    $("#multiplier").value =
      "1";
  }


  clear(
    "#transitionRoute"
  );


  if ($("#firstTransitionInput")) {
    $("#firstTransitionInput").value =
      "0";
  }


  if ($("#enableTargetLock")) {
    $("#enableTargetLock").checked =
      false;
  }


  if ($("#targetLockValue")) {
    $("#targetLockValue").value =
      "0";
  }


  if ($("#targetLockLevel")) {
    $("#targetLockLevel").value =
      "1";
  }


  if ($("#supportRate")) {
    $("#supportRate").value =
      "130000";
  }


  if ($("#jodRate")) {
    $("#jodRate").value =
      "11";
  }


  if ($("#usdRate")) {
    $("#usdRate").value =
      "15";
  }


  if ($("#egpRate")) {
    $("#egpRate").value =
      "600";
  }


  const error =
    $("#calculationError");


  if (error) {
    error.textContent =
      "";

    error.hidden =
      true;
  }


  setMode(
    "reach"
  );


  updateLockDisplay();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   THEME
   ========================================================= */

function setTheme(theme) {

  const selected =
    theme === "light"
      ? "light"
      : "dark";


  document.body.classList.toggle(
    "light",
    selected === "light"
  );


  try {

    localStorage.setItem(
      THEME_KEY,
      selected
    );

  } catch (error) {
    console.error(error);
  }


  const button =
    $("#themeToggle");


  if (button) {

    if (selected === "light") {

      button.innerHTML =
        `☾ <span>الوضع الداكن</span>`;

    } else {

      button.innerHTML =
        `☼ <span>غير الثيم</span>`;
    }
  }
}


function initializeTheme() {

  let theme =
    "dark";


  try {

    const saved =
      localStorage.getItem(
        THEME_KEY
      );


    if (
      saved === "light" ||
      saved === "dark"
    ) {
      theme =
        saved;
    }

  } catch (error) {
    console.error(error);
  }


  setTheme(
    theme
  );
}


/* =========================================================
   COPY
   ========================================================= */

async function copyText(text) {

  if (!text) {
    return;
  }


  try {

    await navigator.clipboard.writeText(
      text
    );

    showToast(
      "تم النسخ"
    );

  } catch (error) {

    const textarea =
      document.createElement(
        "textarea"
      );


    textarea.value =
      text;

    textarea.style.position =
      "fixed";

    textarea.style.opacity =
      "0";


    document.body.appendChild(
      textarea
    );


    textarea.select();


    try {

      document.execCommand(
        "copy"
      );

      showToast(
        "تم النسخ"
      );

    } catch (copyError) {

      showToast(
        "تعذر النسخ",
        "error"
      );
    }


    textarea.remove();
  }
}


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {

  /* الوضع */

  $$(".mode-option").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          setMode(
            button.dataset.mode
          );

        }
      );
    }
  );


  /* الثيم */

  const themeToggle =
    $("#themeToggle");


  if (themeToggle) {

    themeToggle.addEventListener(
      "click",
      () => {

        const light =
          document.body.classList.contains(
            "light"
          );


        setTheme(
          light
            ? "dark"
            : "light"
        );

      }
    );
  }


  /* حساب */

  const calculateButton =
    $("#calculateBtn");


  if (calculateButton) {

    calculateButton.addEventListener(
      "click",
      calculate
    );
  }


  /* حفظ */

  const saveButton =
    $("#saveBtn");


  if (saveButton) {

    saveButton.addEventListener(
      "click",
      saveCurrent
    );
  }


  /* جديد */

  const newButton =
    $("#newBtn");


  if (newButton) {

    newButton.addEventListener(
      "click",
      newOperation
    );
  }


  /* البحث */

  const search =
    $("#historySearch");


  if (search) {

    search.addEventListener(
      "input",
      event => {

        renderHistory(
          event.target.value
        );

      }
    );
  }


  /* حذف السجل */

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


        if (
          !window.confirm(
            "هل تريد حذف جميع العمليات من السجل؟"
          )
        ) {
          return;
        }


        state.records =
          [];


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


        if (
          action ===
          "restore"
        ) {
          restoreRecord(id);
        }


        if (
          action ===
          "delete"
        ) {
          deleteRecord(id);
        }


        if (
          action ===
          "share"
        ) {
          shareRecordWhatsApp(id);
        }

      }
    );
  }


  /* Target Lock */

  const targetLock =
    $("#enableTargetLock");


  if (targetLock) {

    targetLock.addEventListener(
      "change",
      updateLockDisplay
    );
  }


  /* حقول VIP */

  [
    "#currentVip",
    "#targetVip",
    "#targetLockLevel",
    "#targetLockValue"
  ].forEach(
    selector => {

      const element =
        $(selector);


      if (!element) {
        return;
      }


      element.addEventListener(
        "input",
        updateLockDisplay
      );


      element.addEventListener(
        "change",
        updateLockDisplay
      );
    }
  );


  /* الحاسبات */

  [
    "#targetInput",
    "#gamesInput"
  ].forEach(
    selector => {

      const element =
        $(selector);


      if (!element) {
        return;
      }


      element.addEventListener(
        "input",
        updateExtraCalculators
      );


      element.addEventListener(
        "change",
        updateExtraCalculators
      );
    }
  );


  /* نسخ */

  $$(".copy-btn").forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          copyText(
            button.dataset.copy ||
            ""
          );

        }
      );
    }
  );
}


/* =========================================================
   PREMIUM ANIMATION
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


  const reduced =
    window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;


  /* ظهور أثناء التمرير */

  const revealElements =
    document.querySelectorAll(`
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


  revealElements.forEach(
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
    reduced ||
    !("IntersectionObserver" in window)
  ) {

    revealElements.forEach(
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
            "0px 0px -40px 0px"
        }
      );


    revealElements.forEach(
      element => {

        observer.observe(
          element
        );

      }
    );
  }


  /* Header */

  const header =
    $(".site-header");


  if (header) {

    const update =
      () => {

        header.classList.toggle(
          "is-scrolled",
          window.scrollY > 20
        );

      };


    window.addEventListener(
      "scroll",
      update,
      {
        passive: true
      }
    );


    update();
  }


  /* 3D */

  const desktop =
    window.matchMedia(
      "(pointer: fine)"
    ).matches;


  if (
    desktop &&
    !reduced
  ) {

    const tiltElements =
      document.querySelectorAll(`
        .hero-stamp,
        .side-card,
        .extra-card,
        .contact-card,
        .result-card,
        .stat-card
      `);


    tiltElements.forEach(
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
              (
                event.clientX -
                rect.left
              ) /
              rect.width;


            const y =
              (
                event.clientY -
                rect.top
              ) /
              rect.height;


            const rotateX =
              (0.5 - y) * 5;


            const rotateY =
              (x - 0.5) * 7;


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
}


/* =========================================================
   INITIALIZE
   ========================================================= */

function initialize() {

  populateVipSelects();

  initializeTheme();

  bindEvents();

  setMode(
    "reach"
  );

  updateLockDisplay();

  renderHistory();

  renderStats();

  renderVipTable();

  updateExtraCalculators();
}


/* =========================================================
   START
   ========================================================= */

initialize();

initPremiumMotion();
