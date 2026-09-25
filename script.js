/* ==========================================================================
   TIERIQ — VIP OPERATIONS PLATFORM
   script.js — shared engine for index.html / history.html / developer.html

   Module map (each is a small, independent IIFE — search "== MODULE"):
   APP_CONFIG      -> single place to edit brand, pricing links, developer info
   VipData         -> the fixed VIP table (total/upgrade/maintain per level)
   Format          -> number & currency formatting helpers
   Utils           -> generic helpers (clamp, uuid, escapeHtml, animateNumber)
   Store           -> localStorage: settings, history, announcement flag
   Theme           -> light/navy theme switching + persistence
   Toast           -> inline toast notifications (no alert() spam)
   Drawer          -> generic slide-in drawer/modal used across pages
   Calc            -> VIP / support / target / games calculation engine
   Share           -> WhatsApp / Web Share message building
   PrintService    -> builds the print-friendly receipt and opens print
   StandardCalculator -> the plain keypad calculator tool
   ToolsConsole    -> wires the Support / Target / Games / Calculator tabs
   Accordion       -> generic accordion wiring (reference section)
   Header          -> sticky header, mobile menu, announcement bar, pricing CTAs
   FooterInfo      -> terms / privacy info drawer
   Branding        -> applies APP_CONFIG values to [data-bind] elements
   Stats           -> aggregate statistics from saved history
   SettingsPanel   -> settings drawer (rates, theme, export/clear data) — index
   IndexPage       -> wiring specific to index.html (the calculator workspace)
   HistoryPage     -> wiring specific to history.html (history dashboard)
   ========================================================================== */

/* == MODULE: APP_CONFIG =================================================== */
const APP_CONFIG = {
  brandName: 'TIERIQ',
  brandTaglineAr: 'منصة احتساب عمليات VIP الاحترافية',
  pricing: {
    monthlyLabel: '25$',
    fullLabel: '100$',
    monthlyLink: '',   // ضع رابط الدفع الشهري هنا لاحقاً
    fullLink: '',      // ضع رابط شراء الموقع بالكامل هنا لاحقاً
  },
  developer: {
    name: 'F90',
    initials: 'F9',
    roleAr: 'مطوّر مواقع وحلول رقمية',
    bio: 'مطوّر واجهات وأنظمة ويب متخصص في بناء منصات احتساب ولوحات تحكم احترافية. هذا النص عنصر نائب (Placeholder) ويمكن للمطوّر تعديله بما يعكس خبرته الفعلية.',
    instagram: '@f90.dev',            // Placeholder — عدّل لاحقاً
    instagramLink: '',                // ضع رابط الإنستغرام هنا
    email: '',                        // ضع البريد الإلكتروني هنا
  },
  defaults: {
    supportRate: 130000,
    jodRate: 11,
    usdRate: 15,
  },
  version: 'v1.0.0',
};

const ICONS = {
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>',
};

const TERMS_HTML = `<p>هذه نسخة أولية من الشروط والأحكام الخاصة باستخدام منصة ${APP_CONFIG.brandName}. يحتفظ مالك المنصة بحق تعديل هذه الشروط لتعكس سياسة الاستخدام الفعلية، بما يشمل حدود الاشتراك، آلية الدفع، وحقوق الملكية الفكرية للنظام والبيانات.</p><p>يقر المستخدم بأن جميع عمليات الاحتساب مبنية على البيانات التي يُدخلها بنفسه، وأن المنصة أداة مساعدة للاحتساب ولا تمثل جهة إصدار رسمية.</p>`;
const PRIVACY_HTML = `<p>تُحفظ بيانات العمليات (اسم العميل، المعرف، وتفاصيل الاحتساب) بشكل محلي داخل متصفح المستخدم فقط عبر LocalStorage، ولا تُرسل إلى أي خادم خارجي. حذف بيانات المتصفح يؤدي إلى فقدان هذا السجل.</p><p>هذا النص عنصر نائب (Placeholder) ويمكن استبداله بسياسة الخصوصية الفعلية لاحقاً.</p>`;

/* == MODULE: VipData ======================================================= */
const VipData = (function () {
  const TABLE = [
    { total: 50000, upgrade: 50000, maintain: 30000 },
    { total: 100000, upgrade: 50000, maintain: 30000 },
    { total: 300000, upgrade: 100000, maintain: 90000 },
    { total: 1000000, upgrade: 800000, maintain: 500000 },
    { total: 3000000, upgrade: 2000000, maintain: 1300000 },
    { total: 7000000, upgrade: 4000000, maintain: 2600000 },
    { total: 14000000, upgrade: 7000000, maintain: 4500000 },
    { total: 26000000, upgrade: 12000000, maintain: 7800000 },
    { total: 42000000, upgrade: 16000000, maintain: 11000000 },
    { total: 62000000, upgrade: 20000000, maintain: 14000000 },
    { total: 102000000, upgrade: 40000000, maintain: 28000000 },
    { total: 220000000, upgrade: 118000000, maintain: 83000000 },
    { total: 430000000, upgrade: 210000000, maintain: 150000000 },
    { total: 820000000, upgrade: 390000000, maintain: 310000000 },
    { total: 1820000000, upgrade: 1000000000, maintain: 700000000 },
    { total: 3820000000, upgrade: 2000000000, maintain: 1400000000 },
    { total: 7382000000, upgrade: 3500000000, maintain: 3000000000 },
    { total: 11882000000, upgrade: 4500000000, maintain: 4000000000 },
    { total: 17382000000, upgrade: 5500000000, maintain: 5000000000 },
    { total: 27382000000, upgrade: 10000000000, maintain: 9000000000 },
  ];
  const MIN = 1;
  const MAX = TABLE.length;
  function getVip(level) { return TABLE[level - 1]; }
  return { TABLE, MIN, MAX, getVip };
})();

/* == MODULE: Format ========================================================= */
const Format = (function () {
  function formatNumber(n, decimals) {
    decimals = decimals || 0;
    if (!Number.isFinite(n)) return '—';
    return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  function formatMoney(n) { return formatNumber(n, 2); }
  return { formatNumber, formatMoney };
})();

/* == MODULE: Utils ========================================================== */
const Utils = (function () {
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }
  function debounce(fn, wait) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), wait);
    };
  }
  function animateNumber(el, to, opts) {
    if (!el) return;
    opts = opts || {};
    const decimals = opts.decimals || 0;
    const duration = opts.duration || 600;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced || !Number.isFinite(to)) { el.textContent = Format.formatNumber(to, decimals); return; }
    const start = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Format.formatNumber(to * eased, decimals);
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = Format.formatNumber(to, decimals);
    }
    requestAnimationFrame(tick);
  }
  return { clamp, uuid, escapeHtml, debounce, animateNumber };
})();

/* == MODULE: Store (localStorage) =========================================== */
const Store = (function () {
  const KEYS = { settings: 'tieriq_settings', history: 'tieriq_history', announce: 'tieriq_announce_dismissed' };

  function safeParse(raw, fallback) {
    try {
      const v = JSON.parse(raw);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function getSettings() {
    const defaults = Object.assign({}, APP_CONFIG.defaults);
    const parsed = safeParse(localStorage.getItem(KEYS.settings), null);
    if (!parsed) return defaults;
    return {
      supportRate: Number.isFinite(parsed.supportRate) && parsed.supportRate > 0 ? parsed.supportRate : defaults.supportRate,
      jodRate: Number.isFinite(parsed.jodRate) && parsed.jodRate > 0 ? parsed.jodRate : defaults.jodRate,
      usdRate: Number.isFinite(parsed.usdRate) && parsed.usdRate > 0 ? parsed.usdRate : defaults.usdRate,
    };
  }
  function saveSettings(s) {
    try { localStorage.setItem(KEYS.settings, JSON.stringify(s)); } catch (e) { /* storage unavailable */ }
  }
  function getHistory() { return safeParse(localStorage.getItem(KEYS.history), []); }
  function saveHistoryArr(arr) {
    try { localStorage.setItem(KEYS.history, JSON.stringify(arr)); }
    catch (e) { if (window.Toast) Toast.show('error', 'تعذر حفظ البيانات محلياً — قد تكون مساحة التخزين ممتلئة'); }
  }
  function addHistoryRecord(record) { const arr = getHistory(); arr.unshift(record); saveHistoryArr(arr); }
  function deleteHistoryRecord(id) { saveHistoryArr(getHistory().filter((r) => r.id !== id)); }
  function clearHistory() { saveHistoryArr([]); }
  function isAnnouncementDismissed() { return localStorage.getItem(KEYS.announce) === '1'; }
  function dismissAnnouncement() { try { localStorage.setItem(KEYS.announce, '1'); } catch (e) {} }

  return {
    getSettings, saveSettings, getHistory, addHistoryRecord, deleteHistoryRecord,
    clearHistory, isAnnouncementDismissed, dismissAnnouncement,
  };
})();

/* == MODULE: Theme ========================================================== */
const Theme = (function () {
  const KEY = 'tieriq_theme';
  function getCurrent() { return localStorage.getItem(KEY) === 'navy' ? 'navy' : 'light'; }
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'navy' ? 'navy' : 'light');
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.setAttribute('aria-pressed', theme === 'navy' ? 'true' : 'false');
  }
  function setTheme(theme) {
    try { localStorage.setItem(KEY, theme === 'navy' ? 'navy' : 'light'); } catch (e) {}
    apply(theme);
  }
  function toggle() { setTheme(getCurrent() === 'navy' ? 'light' : 'navy'); }
  function init() { apply(getCurrent()); }
  return { init, toggle, setTheme, getCurrent };
})();

/* == MODULE: Toast =========================================================== */
const Toast = (function () {
  const ICON = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v5M12 16h.01"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  };
  function show(type, message, duration) {
    duration = duration || 3800;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.setAttribute('role', type === 'error' ? 'alert' : 'status');
    el.innerHTML = `${ICON[type] || ICON.info}<span>${Utils.escapeHtml(message)}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 220);
    }, duration);
  }
  return { show };
})();

/* == MODULE: Drawer ========================================================== */
const Drawer = (function () {
  let openCount = 0;
  let lastFocused = null;
  function getEl(idOrEl) { return typeof idOrEl === 'string' ? document.getElementById(idOrEl) : idOrEl; }

  function open(idOrEl) {
    const el = getEl(idOrEl);
    if (!el) return;
    lastFocused = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    openCount++;
    requestAnimationFrame(() => {
      const closeBtn = el.querySelector('[data-drawer-close]');
      if (closeBtn) closeBtn.focus();
    });
  }
  function close(idOrEl) {
    const el = getEl(idOrEl);
    if (!el || !el.classList.contains('is-open')) return;
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    openCount = Math.max(0, openCount - 1);
    if (openCount === 0) document.body.classList.remove('no-scroll');
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }
  function closeAll() { document.querySelectorAll('.drawer.is-open').forEach((el) => close(el)); }

  function initGlobalHandlers() {
    document.addEventListener('click', (e) => {
      const closeTrigger = e.target.closest('[data-drawer-close]');
      if (closeTrigger) { const drawer = closeTrigger.closest('.drawer'); if (drawer) close(drawer); }
      const openTrigger = e.target.closest('[data-drawer-open]');
      if (openTrigger) {
        const id = openTrigger.getAttribute('data-drawer-open');
        const el = document.getElementById(id);
        if (el) { e.preventDefault(); open(el); }
      }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAll(); });
  }
  return { open, close, closeAll, initGlobalHandlers };
})();

/* == MODULE: Calc — the calculation engine (logic kept per spec) ============ */
const Calc = (function () {
  function validateJourney({ current, target }) {
    if (!Number.isFinite(current) || !Number.isFinite(target)) return 'يرجى اختيار المستوى الحالي والمستهدف';
    if (current < VipData.MIN || current > VipData.MAX || target < VipData.MIN || target > VipData.MAX) return 'مستوى VIP غير صالح';
    if (target <= current) return 'يجب أن يكون المستوى المستهدف أعلى من المستوى الحالي';
    return null;
  }

  function computeTransitions(current, target, firstTransitionValue) {
    const transitions = [{ from: current, to: current + 1, type: 'manual', value: firstTransitionValue }];
    for (let lvl = current + 2; lvl <= target; lvl++) {
      transitions.push({ from: lvl - 1, to: lvl, type: 'auto', value: VipData.getVip(lvl).upgrade });
    }
    return transitions;
  }
  function sumTransitions(transitions) { return transitions.reduce((s, t) => s + t.value, 0); }
  function computeLockXP(lockMode, current, target) {
    if (lockMode === 'current') return VipData.getVip(current).maintain;
    if (lockMode === 'target') return VipData.getVip(target).maintain;
    return 0;
  }
  function computeOperation({ current, target, firstTransitionValue, multiplier, lockMode }) {
    const transitions = computeTransitions(current, target, firstTransitionValue);
    const totalTransitionXP = sumTransitions(transitions);
    const lockXP = computeLockXP(lockMode, current, target);
    const finalVipXP = totalTransitionXP + lockXP;
    const safeMultiplier = multiplier > 0 ? multiplier : 1;
    const actualCharge = finalVipXP / safeMultiplier;
    return { transitions, totalTransitionXP, lockXP, finalVipXP, actualCharge };
  }
  function computeSupport(actualCharge, rates) {
    const supportRate = rates && rates.supportRate > 0 ? rates.supportRate : APP_CONFIG.defaults.supportRate;
    const jodRate = rates && rates.jodRate > 0 ? rates.jodRate : APP_CONFIG.defaults.jodRate;
    const usdRate = rates && rates.usdRate > 0 ? rates.usdRate : APP_CONFIG.defaults.usdRate;
    const safeCharge = Number.isFinite(actualCharge) ? actualCharge : 0;
    const supportNeeded = (safeCharge / 1000000) * supportRate;
    const jod = (supportNeeded / supportRate) * jodRate;
    const usd = (supportNeeded / supportRate) * usdRate;
    return { supportNeeded, jod, usd };
  }
  function computeTarget(coins) {
    const safe = Number.isFinite(coins) ? coins : 0;
    return { jod: (safe / 100000) * 7, usd: (safe / 100000) * 10 };
  }
  function computeGames(coins) {
    const safe = Number.isFinite(coins) ? coins : 0;
    return { jod: (safe / 100000) * 6, usd: (safe / 100000) * 8 };
  }
  return { validateJourney, computeTransitions, computeOperation, computeSupport, computeTarget, computeGames };
})();

/* == MODULE: Share =========================================================== */
const Share = (function () {
  function buildMessage(r) {
    const lines = ['*VIP CALCULATION* 🧮', '——————————————'];
    if (r.clientName) lines.push(`👤 Client: ${r.clientName}`);
    if (r.clientId) lines.push(`🆔 ID: ${r.clientId}`);
    lines.push('');
    lines.push(`📊 VIP Journey: ${r.currentVip} → ${r.targetVip}`);
    lines.push(`🔹 First Transition: ${Format.formatNumber(r.firstTransition)}`);
    lines.push(`✖️ Multiplier: x${r.multiplier}`);
    lines.push('');
    lines.push(`🔷 Total VIP XP: ${Format.formatNumber(r.finalVipXP)}`);
    lines.push(`💰 Actual Charge: ${Format.formatNumber(r.actualCharge)} Coins`);
    lines.push('');
    lines.push(`🛠️ Support Required: ${Format.formatNumber(r.supportNeeded)}`);
    lines.push(`🇯🇴 JOD: ${Format.formatMoney(r.jod)}`);
    lines.push(`🇺🇸 USD: ${Format.formatMoney(r.usd)}`);
    lines.push('——————————————');
    lines.push(APP_CONFIG.brandName);
    return lines.join('\n');
  }
  async function shareRecord(record) {
    const text = buildMessage(record);
    if (navigator.share) {
      try { await navigator.share({ text }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
  }
  return { buildMessage, shareRecord };
})();

/* == MODULE: PrintService ==================================================== */
const PrintService = (function () {
  function printRecord(r) {
    const area = document.getElementById('printArea');
    if (!area) { window.print(); return; }
    const rowsHtml = r.transitions.map((t) =>
      `<tr><td>VIP ${t.from} → VIP ${t.to}</td><td>${t.type === 'manual' ? 'يدوي' : 'تلقائي'}</td><td>${Format.formatNumber(t.value)}</td></tr>`
    ).join('');
    area.innerHTML = `
      <div class="print-title">${Utils.escapeHtml(APP_CONFIG.brandName)} — تقرير عملية VIP</div>
      <div class="print-sub">${r.clientName ? 'العميل: ' + Utils.escapeHtml(r.clientName) + '  |  ' : ''}${r.clientId ? 'المعرف: ' + Utils.escapeHtml(r.clientId) : ''}</div>
      <div class="print-sub">VIP ${r.currentVip} → VIP ${r.targetVip}  |  المضاعف x${r.multiplier}  |  ${new Date(r.createdAt).toLocaleString('ar-EG')}</div>
      <table>
        <thead><tr><th>الانتقال</th><th>النوع</th><th>القيمة</th></tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="print-final">
        إجمالي VIP XP: ${Format.formatNumber(r.finalVipXP)} — الشحن الفعلي: ${Format.formatNumber(r.actualCharge)} —
        الدعم: ${Format.formatNumber(r.supportNeeded)} — JOD: ${Format.formatMoney(r.jod)} — USD: ${Format.formatMoney(r.usd)}
      </div>`;
    window.print();
  }
  return { printRecord };
})();

/* == MODULE: StandardCalculator (plain keypad tool) ========================= */
const StandardCalculator = (function () {
  let current = '0', previous = null, operator = null, overwrite = true;

  function opSymbol(op) { return { '+': '+', '-': '−', '*': '×', '/': '÷' }[op] || ''; }
  function updateDisplay() {
    const valEl = document.getElementById('calcDisplayValue');
    const exprEl = document.getElementById('calcDisplayExpr');
    if (!valEl) return;
    valEl.textContent = current;
    exprEl.textContent = previous !== null ? `${previous} ${opSymbol(operator)}` : '';
  }
  function inputDigit(d) {
    if (overwrite) { current = d === '.' ? '0.' : d; overwrite = false; return updateDisplay(); }
    if (d === '.' && current.includes('.')) return;
    current = (current === '0' && d !== '.') ? d : current + d;
    updateDisplay();
  }
  function compute() {
    const a = parseFloat(previous), b = parseFloat(current);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return;
    let result;
    switch (operator) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = b === 0 ? NaN : a / b; break;
      default: result = b;
    }
    current = Number.isFinite(result) ? String(Math.round(result * 1e8) / 1e8) : 'خطأ';
    previous = null; operator = null; overwrite = true;
    updateDisplay();
  }
  function inputOperator(op) {
    if (operator && !overwrite) compute();
    previous = current; operator = op; overwrite = true;
    updateDisplay();
  }
  function equals() { if (operator !== null) compute(); }
  function clear() { current = '0'; previous = null; operator = null; overwrite = true; updateDisplay(); }
  function backspace() {
    if (overwrite) return;
    current = current.length > 1 ? current.slice(0, -1) : '0';
    updateDisplay();
  }
  function percent() {
    const val = parseFloat(current);
    if (!Number.isFinite(val)) return;
    current = String(val / 100);
    updateDisplay();
  }
  function toggleSign() {
    if (current === '0') return;
    current = current.startsWith('-') ? current.slice(1) : '-' + current;
    updateDisplay();
  }
  function init() {
    const keypad = document.getElementById('calcKeypad');
    if (!keypad) return;
    keypad.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-key]');
      if (!btn) return;
      const key = btn.dataset.key;
      if (/^[0-9]$/.test(key)) inputDigit(key);
      else if (key === '.') inputDigit('.');
      else if (['+', '-', '*', '/'].includes(key)) inputOperator(key);
      else if (key === '=') equals();
      else if (key === 'C') clear();
      else if (key === 'back') backspace();
      else if (key === '%') percent();
      else if (key === '±') toggleSign();
    });
    updateDisplay();
  }
  return { init };
})();

/* == MODULE: ToolsConsole (Support / Target / Games / Calculator tabs) ====== */
const ToolsConsole = (function () {
  function initTabs() {
    const tabs = document.getElementById('toolTabs');
    if (!tabs) return;
    const panels = {
      support: document.getElementById('toolPanelSupport'),
      target: document.getElementById('toolPanelTarget'),
      games: document.getElementById('toolPanelGames'),
      calculator: document.getElementById('toolPanelCalculator'),
    };
    tabs.querySelectorAll('.tool-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.tool-tab').forEach((t) => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true');
        Object.values(panels).forEach((p) => p && p.classList.remove('is-active'));
        const key = tab.dataset.tool;
        if (panels[key]) panels[key].classList.add('is-active');
      });
    });
  }
  function initSupportTool() {
    const btn = document.getElementById('supportCalcBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const val = parseFloat(document.getElementById('supportChargeInput').value);
      if (!Number.isFinite(val) || val < 0) { Toast.show('error', 'يرجى إدخال قيمة صحيحة'); return; }
      const r = Calc.computeSupport(val, Store.getSettings());
      document.getElementById('supportResultNeeded').textContent = Format.formatNumber(r.supportNeeded);
      document.getElementById('supportResultJod').textContent = Format.formatMoney(r.jod);
      document.getElementById('supportResultUsd').textContent = Format.formatMoney(r.usd);
    });
  }
  function initTargetTool() {
    const btn = document.getElementById('targetCalcBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const val = parseFloat(document.getElementById('targetCoinsInput').value);
      if (!Number.isFinite(val) || val < 0) { Toast.show('error', 'يرجى إدخال قيمة صحيحة'); return; }
      const r = Calc.computeTarget(val);
      document.getElementById('targetResultJod').textContent = Format.formatMoney(r.jod);
      document.getElementById('targetResultUsd').textContent = Format.formatMoney(r.usd);
    });
  }
  function initGamesTool() {
    const btn = document.getElementById('gamesCalcBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const val = parseFloat(document.getElementById('gamesCoinsInput').value);
      if (!Number.isFinite(val) || val < 0) { Toast.show('error', 'يرجى إدخال قيمة صحيحة'); return; }
      const r = Calc.computeGames(val);
      document.getElementById('gamesResultJod').textContent = Format.formatMoney(r.jod);
      document.getElementById('gamesResultUsd').textContent = Format.formatMoney(r.usd);
    });
  }
  function init() { initTabs(); initSupportTool(); initTargetTool(); initGamesTool(); StandardCalculator.init(); }
  return { init };
})();

/* == MODULE: Accordion ======================================================= */
const Accordion = (function () {
  function init() {
    document.querySelectorAll('.accordion-item__header').forEach((btn) => {
      const panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;
      btn.addEventListener('click', () => {
        const isOpen = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isOpen));
        panel.style.maxHeight = isOpen ? '0px' : panel.scrollHeight + 'px';
      });
    });
  }
  return { init };
})();

/* == MODULE: Header (sticky shadow, mobile menu, announcement, pricing CTAs) */
const Header = (function () {
  function initScrollShadow() {
    const header = document.getElementById('siteHeader');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
  function initMobileMenu() {
    const btn = document.getElementById('hamburgerBtn');
    const menu = document.getElementById('mobileMenu');
    if (!btn || !menu) return;
    function closeMenu() { menu.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', () => {
      const willOpen = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    });
    menu.querySelectorAll('.mobile-menu__link').forEach((a) => a.addEventListener('click', closeMenu));
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) closeMenu(); });
  }
  function initAnnouncement() {
    const bar = document.getElementById('announcementBar');
    const closeBtn = document.getElementById('announcementCloseBtn');
    if (!bar) return;
    if (Store.isAnnouncementDismissed()) { bar.hidden = true; return; }
    if (closeBtn) closeBtn.addEventListener('click', () => { bar.hidden = true; Store.dismissAnnouncement(); });
  }
  function initCheckoutButtons() {
    document.querySelectorAll('.js-checkout').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const href = btn.getAttribute('href');
        if (!href || href === '#') {
          e.preventDefault();
          Toast.show('info', 'لإتمام العملية، أضف رابط الدفع في APP_CONFIG داخل script.js');
        }
      });
    });
  }
  function initThemeToggle() {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.addEventListener('click', () => Theme.toggle());
  }
  function init() { initScrollShadow(); initMobileMenu(); initAnnouncement(); initCheckoutButtons(); initThemeToggle(); }
  return { init };
})();

/* == MODULE: FooterInfo (terms / privacy) ==================================== */
const FooterInfo = (function () {
  function init() {
    const termsLink = document.getElementById('termsLink');
    const privacyLink = document.getElementById('privacyLink');
    const titleEl = document.getElementById('infoDrawerTitle');
    const bodyEl = document.getElementById('infoDrawerBody');
    if (termsLink) termsLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (titleEl) titleEl.textContent = 'الشروط والأحكام';
      if (bodyEl) bodyEl.innerHTML = TERMS_HTML;
      Drawer.open('infoDrawer');
    });
    if (privacyLink) privacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (titleEl) titleEl.textContent = 'سياسة الخصوصية';
      if (bodyEl) bodyEl.innerHTML = PRIVACY_HTML;
      Drawer.open('infoDrawer');
    });
  }
  return { init };
})();

/* == MODULE: Branding (single source of truth -> DOM) ========================= */
const Branding = (function () {
  function apply() {
    const map = {
      brandName: APP_CONFIG.brandName,
      brandTagline: APP_CONFIG.brandTaglineAr,
      pricingMonthly: APP_CONFIG.pricing.monthlyLabel,
      pricingFull: APP_CONFIG.pricing.fullLabel,
      devName: APP_CONFIG.developer.name,
      devRole: APP_CONFIG.developer.roleAr,
      devBio: APP_CONFIG.developer.bio,
      devInstagram: APP_CONFIG.developer.instagram,
      devEmail: APP_CONFIG.developer.email || 'أضف بريدك الإلكتروني في الإعدادات',
      version: APP_CONFIG.version,
    };
    document.querySelectorAll('[data-bind]').forEach((el) => {
      const key = el.getAttribute('data-bind');
      if (key in map) el.textContent = map[key];
    });
    document.querySelectorAll('[data-bind-href]').forEach((el) => {
      const key = el.getAttribute('data-bind-href');
      if (key === 'instagram') el.href = APP_CONFIG.developer.instagramLink || '#';
      if (key === 'email') el.href = APP_CONFIG.developer.email ? 'mailto:' + APP_CONFIG.developer.email : '#';
    });
    document.querySelectorAll('.js-checkout').forEach((a) => {
      const plan = a.getAttribute('data-plan');
      const link = plan === 'full' ? APP_CONFIG.pricing.fullLink : APP_CONFIG.pricing.monthlyLink;
      a.setAttribute('href', link || '#');
      if (link) a.setAttribute('target', '_blank');
    });
  }
  return { apply };
})();

/* == MODULE: Stats ============================================================ */
const Stats = (function () {
  function computeStats(history) {
    const totalOps = history.length;
    const customerSet = new Set(history.map((r) => ((r.clientId || r.clientName || '').trim().toLowerCase())).filter(Boolean));
    const sum = (key) => history.reduce((s, r) => s + (Number.isFinite(r[key]) ? r[key] : 0), 0);
    const highestVip = history.reduce((m, r) => Math.max(m, r.targetVip || 0), 0);
    return {
      totalOps,
      totalCustomers: customerSet.size,
      totalCoins: sum('actualCharge'),
      totalSupport: sum('supportNeeded'),
      totalVipXp: sum('finalVipXP'),
      totalJod: sum('jod'),
      totalUsd: sum('usd'),
      highestVip,
    };
  }
  return { computeStats };
})();

/* == MODULE: SettingsPanel (index.html only) ================================= */
const SettingsPanel = (function () {
  function fillInputs() {
    const s = Store.getSettings();
    const supportEl = document.getElementById('supportRateInput');
    const jodEl = document.getElementById('jodRateInput');
    const usdEl = document.getElementById('usdRateInput');
    if (supportEl) supportEl.value = s.supportRate;
    if (jodEl) jodEl.value = s.jodRate;
    if (usdEl) usdEl.value = s.usdRate;
    updateThemeActive();
  }
  function updateThemeActive() {
    const current = Theme.getCurrent();
    document.querySelectorAll('.theme-option').forEach((opt) => opt.classList.toggle('is-active', opt.dataset.themeOption === current));
  }
  function wireThemeOptions() {
    document.querySelectorAll('.theme-option').forEach((opt) => {
      opt.addEventListener('click', () => { Theme.setTheme(opt.dataset.themeOption); updateThemeActive(); });
    });
  }
  function wireSave() {
    const btn = document.getElementById('saveSettingsBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const supportRate = parseFloat(document.getElementById('supportRateInput').value);
      const jodRate = parseFloat(document.getElementById('jodRateInput').value);
      const usdRate = parseFloat(document.getElementById('usdRateInput').value);
      if (![supportRate, jodRate, usdRate].every((v) => Number.isFinite(v) && v > 0)) {
        Toast.show('error', 'يرجى إدخال قيم صحيحة أكبر من صفر لكل الأسعار'); return;
      }
      Store.saveSettings({ supportRate, jodRate, usdRate });
      Toast.show('success', 'تم حفظ الإعدادات بنجاح');
    });
  }
  function wireReset() {
    const btn = document.getElementById('resetSettingsBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      Store.saveSettings(Object.assign({}, APP_CONFIG.defaults));
      fillInputs();
      Toast.show('info', 'تمت إعادة الإعدادات للقيم الافتراضية');
    });
  }
  function exportJSON() {
    const data = JSON.stringify(Store.getHistory(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'tieriq-history.json';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
  function wireExport() {
    const btn = document.getElementById('exportHistoryBtn');
    if (!btn) return;
    btn.addEventListener('click', () => { exportJSON(); Toast.show('success', 'تم تصدير السجل بصيغة JSON'); });
  }
  function wireClear() {
    const btn = document.getElementById('clearHistoryBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (Store.getHistory().length === 0) { Toast.show('info', 'لا يوجد سجل لحذفه'); return; }
      if (!confirm('هل أنت متأكد من حذف كل سجل العمليات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
      Store.clearHistory();
      Toast.show('success', 'تم حذف كل العمليات المحفوظة');
      document.dispatchEvent(new CustomEvent('tieriq:history-changed'));
    });
  }
  function init() { fillInputs(); wireThemeOptions(); wireSave(); wireReset(); wireExport(); wireClear(); }
  return { init };
})();

/* == MODULE: IndexPage — the main VIP calculator workspace =================== */
const IndexPage = (function () {
  const VIP_MIN = VipData.MIN, VIP_MAX = VipData.MAX;
  const state = { current: 10, target: 11, multiplier: 1, lockMode: 'none' };
  let lastResult = null;
  const els = {};

  function cacheEls() {
    [
      'currentVipValue', 'currentVipMinus', 'currentVipPlus',
      'targetVipValue', 'targetVipMinus', 'targetVipPlus',
      'railFill', 'railMarkerCurrent', 'railMarkerTarget', 'railCaption',
      'multiplierPills', 'lockToggle', 'firstTransitionInput', 'firstTransitionLabel',
      'clientNameInput', 'clientIdInput', 'calculateBtn',
      'workspaceError', 'workspaceErrorText',
      'summaryEmpty', 'summaryBody', 'summaryPath', 'summaryTotalXp', 'summaryMultiplier',
      'summaryCharge', 'summarySupport', 'summaryJod', 'summaryUsd', 'summaryTimestamp',
      'viewDetailsBtn', 'saveOperationBtn', 'shareWhatsappBtn', 'printOperationBtn',
      'detailDrawerBody', 'miniStatOps', 'miniStatCustomers', 'miniStatHighest',
    ].forEach((id) => { els[id] = document.getElementById(id); });
  }

  function pct(level) { return ((level - 1) / (VIP_MAX - 1)) * 100; }

  function renderVipUI() {
    els.currentVipValue.textContent = state.current;
    els.targetVipValue.textContent = state.target;
    const curPct = pct(state.current), tgtPct = pct(state.target);
    els.railFill.style.insetInlineStart = curPct + '%';
    els.railFill.style.width = (tgtPct - curPct) + '%';
    els.railMarkerCurrent.style.insetInlineStart = curPct + '%';
    els.railMarkerTarget.style.insetInlineStart = tgtPct + '%';
    const diff = state.target - state.current;
    els.railCaption.textContent = diff === 1 ? 'فرق مستوى واحد' : `فرق ${diff} مستويات`;
    els.firstTransitionLabel.textContent = `قيمة الانتقال اليدوي من VIP ${state.current} إلى VIP ${state.current + 1}`;
    els.currentVipMinus.disabled = state.current <= VIP_MIN;
    els.currentVipPlus.disabled = state.current >= VIP_MAX - 1;
    els.targetVipMinus.disabled = state.target <= state.current + 1;
    els.targetVipPlus.disabled = state.target >= VIP_MAX;
  }

  function clearWorkspaceError() { els.workspaceError.classList.remove('is-visible'); }
  function showWorkspaceError(msg) { els.workspaceErrorText.textContent = msg; els.workspaceError.classList.add('is-visible'); }
  function resetSummaryToEmpty() { els.summaryBody.classList.remove('is-visible'); lastResult = null; }
  function onParamChanged() { clearWorkspaceError(); if (lastResult) resetSummaryToEmpty(); }

  function stepCurrent(delta) {
    state.current = Utils.clamp(state.current + delta, VIP_MIN, VIP_MAX - 1);
    if (state.target <= state.current) state.target = Math.min(VIP_MAX, state.current + 1);
    renderVipUI(); onParamChanged();
  }
  function stepTarget(delta) {
    state.target = Utils.clamp(state.target + delta, state.current + 1, VIP_MAX);
    renderVipUI(); onParamChanged();
  }

  function wireVipSteppers() {
    els.currentVipMinus.addEventListener('click', () => stepCurrent(-1));
    els.currentVipPlus.addEventListener('click', () => stepCurrent(1));
    els.targetVipMinus.addEventListener('click', () => stepTarget(-1));
    els.targetVipPlus.addEventListener('click', () => stepTarget(1));
  }
  function wirePills() {
    els.multiplierPills.querySelectorAll('.pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        els.multiplierPills.querySelectorAll('.pill').forEach((p) => { p.classList.remove('is-active'); p.setAttribute('aria-pressed', 'false'); });
        pill.classList.add('is-active'); pill.setAttribute('aria-pressed', 'true');
        state.multiplier = parseInt(pill.dataset.value, 10);
        onParamChanged();
      });
    });
  }
  function wireLock() {
    els.lockToggle.querySelectorAll('.lock-option').forEach((opt) => {
      opt.addEventListener('click', () => {
        els.lockToggle.querySelectorAll('.lock-option').forEach((o) => { o.classList.remove('is-active'); o.setAttribute('aria-pressed', 'false'); });
        opt.classList.add('is-active'); opt.setAttribute('aria-pressed', 'true');
        state.lockMode = opt.dataset.lock;
        onParamChanged();
      });
    });
  }

  function validateAndCalculate() {
    clearWorkspaceError();
    const journeyError = Calc.validateJourney({ current: state.current, target: state.target });
    if (journeyError) { showWorkspaceError(journeyError); Toast.show('error', journeyError); return; }

    const firstVal = parseFloat(els.firstTransitionInput.value);
    if (!Number.isFinite(firstVal) || firstVal <= 0) {
      showWorkspaceError('يرجى إدخال قيمة صحيحة للانتقال الأول (أكبر من صفر)');
      Toast.show('error', 'قيمة الانتقال الأول غير صالحة');
      els.firstTransitionInput.classList.add('has-error');
      return;
    }
    els.firstTransitionInput.classList.remove('has-error');

    const op = Calc.computeOperation({
      current: state.current, target: state.target, firstTransitionValue: firstVal,
      multiplier: state.multiplier, lockMode: state.lockMode,
    });
    const settings = Store.getSettings();
    const support = Calc.computeSupport(op.actualCharge, settings);

    lastResult = {
      clientName: els.clientNameInput.value.trim(),
      clientId: els.clientIdInput.value.trim(),
      currentVip: state.current, targetVip: state.target,
      multiplier: state.multiplier, lockMode: state.lockMode, firstTransition: firstVal,
      transitions: op.transitions, totalTransitionXP: op.totalTransitionXP, lockXP: op.lockXP,
      finalVipXP: op.finalVipXP, actualCharge: op.actualCharge,
      supportNeeded: support.supportNeeded, jod: support.jod, usd: support.usd,
      supportRateUsed: settings.supportRate, jodRateUsed: settings.jodRate, usdRateUsed: settings.usdRate,
      createdAt: Date.now(),
    };
    renderSummary(lastResult);
    Toast.show('success', 'تم احتساب العملية بنجاح');
  }

  function renderSummary(r) {
    els.summaryPath.innerHTML = `VIP ${r.currentVip} <span>→</span> VIP ${r.targetVip}`;
    Utils.animateNumber(els.summaryCharge, r.actualCharge, { decimals: 0 });
    Utils.animateNumber(els.summaryTotalXp, r.finalVipXP, { decimals: 0 });
    els.summaryMultiplier.textContent = 'x' + r.multiplier;
    Utils.animateNumber(els.summarySupport, r.supportNeeded, { decimals: 0 });
    Utils.animateNumber(els.summaryJod, r.jod, { decimals: 2 });
    Utils.animateNumber(els.summaryUsd, r.usd, { decimals: 2 });
    const d = new Date(r.createdAt);
    els.summaryTimestamp.textContent = 'تم الاحتساب: ' + d.toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' });
    els.summaryBody.classList.add('is-visible');
  }

  function renderDetailsDrawer() {
    if (!lastResult) { Toast.show('error', 'يرجى احتساب العملية أولاً'); return; }
    const r = lastResult;
    let html = '<div class="timeline">';
    r.transitions.forEach((t) => {
      html += `<div class="timeline__item">
        <div class="timeline__from-to">VIP ${t.from} → VIP ${t.to}
          <span class="timeline__badge timeline__badge--${t.type}">${t.type === 'manual' ? 'يدوي' : 'تلقائي'}</span>
        </div>
        <div class="timeline__value num">${Format.formatNumber(t.value)}</div>
      </div>`;
    });
    html += '</div><div class="timeline__totals">';
    html += `<div class="timeline__total-row"><span>إجمالي انتقال XP</span><span class="num">${Format.formatNumber(r.totalTransitionXP)}</span></div>`;
    html += `<div class="timeline__total-row"><span>التثبيت (Lock)</span><span class="num">${Format.formatNumber(r.lockXP)}</span></div>`;
    html += `<div class="timeline__total-row"><span>إجمالي VIP XP النهائي</span><span class="num">${Format.formatNumber(r.finalVipXP)}</span></div>`;
    html += `<div class="timeline__total-row"><span>÷ المضاعف</span><span class="num">x${r.multiplier}</span></div>`;
    html += `<div class="timeline__total-row timeline__total-row--final"><span>الشحن النهائي</span><span class="num">${Format.formatNumber(r.actualCharge)}</span></div>`;
    html += '</div>';
    els.detailDrawerBody.innerHTML = html;
    Drawer.open('detailDrawer');
  }

  function updateMiniStats() {
    if (!els.miniStatOps) return;
    const s = Stats.computeStats(Store.getHistory());
    els.miniStatOps.textContent = Format.formatNumber(s.totalOps);
    els.miniStatCustomers.textContent = Format.formatNumber(s.totalCustomers);
    els.miniStatHighest.textContent = s.highestVip ? ('VIP ' + s.highestVip) : '—';
  }

  function saveOperation() {
    if (!lastResult) { Toast.show('error', 'يرجى احتساب العملية أولاً'); return; }
    const name = els.clientNameInput.value.trim();
    const id = els.clientIdInput.value.trim();
    if (!name || !id) { Toast.show('error', 'يرجى إدخال اسم ومعرف العميل قبل الحفظ'); return; }
    lastResult.clientName = name; lastResult.clientId = id;
    Store.addHistoryRecord(Object.assign({ id: Utils.uuid() }, lastResult));
    Toast.show('success', 'تم حفظ العملية في السجل');
    updateMiniStats();
  }

  function wireActions() {
    els.calculateBtn.addEventListener('click', validateAndCalculate);
    els.viewDetailsBtn.addEventListener('click', renderDetailsDrawer);
    els.saveOperationBtn.addEventListener('click', saveOperation);
    els.shareWhatsappBtn.addEventListener('click', () => {
      if (!lastResult) { Toast.show('error', 'يرجى احتساب العملية أولاً'); return; }
      Share.shareRecord(lastResult);
    });
    els.printOperationBtn.addEventListener('click', () => {
      if (!lastResult) { Toast.show('error', 'يرجى احتساب العملية أولاً'); return; }
      PrintService.printRecord(lastResult);
    });
    els.firstTransitionInput.addEventListener('input', onParamChanged);
    els.clientNameInput.addEventListener('input', onParamChanged);
    els.clientIdInput.addEventListener('input', onParamChanged);
    document.addEventListener('tieriq:history-changed', updateMiniStats);
  }

  function openSettingsIfHashed() { if (window.location.hash === '#settings') Drawer.open('settingsDrawer'); }

  function init() {
    cacheEls();
    renderVipUI();
    wireVipSteppers();
    wirePills();
    wireLock();
    wireActions();
    ToolsConsole.init();
    SettingsPanel.init();
    updateMiniStats();
    openSettingsIfHashed();
  }
  return { init };
})();

/* == MODULE: HistoryPage — history dashboard ================================= */
const HistoryPage = (function () {
  let searchTimer = null;

  function pageEls() {
    return {
      search: document.getElementById('historySearchInput'),
      list: document.getElementById('historyList'),
      empty: document.getElementById('historyEmpty'),
      clearAllBtn: document.getElementById('clearAllHistoryBtn'),
      exportBtn: document.getElementById('exportHistoryBtn'),
    };
  }

  function renderStats(history) {
    const s = Stats.computeStats(history);
    const map = {
      histTotalOps: Format.formatNumber(s.totalOps),
      histTotalCustomers: Format.formatNumber(s.totalCustomers),
      histTotalCoins: Format.formatNumber(s.totalCoins),
      histTotalSupport: Format.formatNumber(s.totalSupport),
      histTotalVipXp: Format.formatNumber(s.totalVipXp),
      histTotalJod: Format.formatMoney(s.totalJod),
      histTotalUsd: Format.formatMoney(s.totalUsd),
      histHighestVip: s.highestVip ? ('VIP ' + s.highestVip) : '—',
    };
    Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.textContent = val; });
  }

  function matches(record, q) {
    if (!q) return true;
    q = q.toLowerCase();
    return (record.clientName || '').toLowerCase().includes(q)
      || (record.clientId || '').toLowerCase().includes(q)
      || ('vip ' + record.currentVip).includes(q)
      || ('vip ' + record.targetVip).includes(q)
      || String(record.currentVip).includes(q)
      || String(record.targetVip).includes(q);
  }

  function renderList() {
    const { list, empty, search } = pageEls();
    const history = Store.getHistory();
    renderStats(history);
    const q = search ? search.value.trim() : '';
    const filtered = history.filter((r) => matches(r, q));
    list.innerHTML = '';
    if (filtered.length === 0) {
      empty.hidden = false;
      empty.querySelector('.empty-state__desc').textContent = history.length === 0
        ? 'لم يتم حفظ أي عملية بعد. ابدأ باحتساب عملية VIP من لوحة الحاسبة الرئيسية.'
        : 'لا توجد نتائج مطابقة لبحثك.';
      return;
    }
    empty.hidden = true;
    filtered.forEach((r) => {
      const row = document.createElement('div');
      row.className = 'history-row';
      row.dataset.id = r.id;
      row.innerHTML = `
        <div class="history-row__client">
          <span class="history-row__name">${Utils.escapeHtml(r.clientName || 'بدون اسم')}</span>
          <span class="history-row__id">${Utils.escapeHtml(r.clientId || '—')}</span>
        </div>
        <div class="history-row__meta">
          <div class="history-row__meta-item"><span class="history-row__meta-label">VIP</span><span class="history-row__meta-value">VIP ${r.currentVip} → VIP ${r.targetVip}</span></div>
          <div class="history-row__meta-item"><span class="history-row__meta-label">الشحن الفعلي</span><span class="history-row__meta-value num">${Format.formatNumber(r.actualCharge)}</span></div>
          <div class="history-row__meta-item"><span class="history-row__meta-label">الدعم</span><span class="history-row__meta-value num">${Format.formatNumber(r.supportNeeded)}</span></div>
          <div class="history-row__meta-item"><span class="history-row__meta-label">JOD / USD</span><span class="history-row__meta-value num">${Format.formatMoney(r.jod)} / ${Format.formatMoney(r.usd)}</span></div>
        </div>
        <div class="history-row__footer">
          <span class="history-row__date">${new Date(r.createdAt).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
          <div class="history-row__actions">
            <button class="btn btn--secondary btn--sm" data-action="open" type="button">فتح التفاصيل</button>
            <button class="btn-icon" data-action="delete" aria-label="حذف العملية" type="button">${ICONS.trash}</button>
          </div>
        </div>`;
      list.appendChild(row);
    });
  }

  function openDetail(id) {
    const record = Store.getHistory().find((r) => r.id === id);
    if (!record) return;
    const body = document.getElementById('detailDrawerBody');
    const title = document.getElementById('detailDrawerTitle');
    title.textContent = record.clientName || 'تفاصيل العملية';
    const transitionsHtml = record.transitions.map((t) =>
      `<div class="detail-list__row"><span>VIP ${t.from} → VIP ${t.to} (${t.type === 'manual' ? 'يدوي' : 'تلقائي'})</span><span class="num">${Format.formatNumber(t.value)}</span></div>`
    ).join('');
    body.innerHTML = `
      <div class="detail-section">
        <div class="detail-section__title">بيانات العميل</div>
        <div class="detail-list">
          <div class="detail-list__row"><span>الاسم</span><span>${Utils.escapeHtml(record.clientName || '—')}</span></div>
          <div class="detail-list__row"><span>المعرف</span><span>${Utils.escapeHtml(record.clientId || '—')}</span></div>
          <div class="detail-list__row"><span>تاريخ العملية</span><span>${new Date(record.createdAt).toLocaleString('ar-EG')}</span></div>
        </div>
      </div>
      <div class="detail-section">
        <div class="detail-section__title">رحلة VIP</div>
        <div class="detail-list">${transitionsHtml}</div>
      </div>
      <div class="detail-section">
        <div class="detail-section_
