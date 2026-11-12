"use strict";
(() => {
  const VIP_TABLE = [
    {level:1,total:50000,upgrade:50000,maintain:30000},
    {level:2,total:100000,upgrade:50000,maintain:30000},
    {level:3,total:300000,upgrade:100000,maintain:90000},
    {level:4,total:1000000,upgrade:800000,maintain:500000},
    {level:5,total:3000000,upgrade:2000000,maintain:1300000},
    {level:6,total:7000000,upgrade:4000000,maintain:2600000},
    {level:7,total:14000000,upgrade:7000000,maintain:4500000},
    {level:8,total:26000000,upgrade:12000000,maintain:7800000},
    {level:9,total:42000000,upgrade:16000000,maintain:11200000},
    {level:10,total:62000000,upgrade:20000000,maintain:14000000},
    {level:11,total:102000000,upgrade:40000000,maintain:28000000},
    {level:12,total:220000000,upgrade:118000000,maintain:83000000},
    {level:13,total:430000000,upgrade:210000000,maintain:150000000},
    {level:14,total:820000000,upgrade:390000000,maintain:310000000},
    {level:15,total:1820000000,upgrade:1000000000,maintain:700000000},
    {level:16,total:3820000000,upgrade:2000000000,maintain:1400000000},
    {level:17,total:7382000000,upgrade:3500000000,maintain:3000000000},
    {level:18,total:11882000000,upgrade:4500000000,maintain:4000000000},
    {level:19,total:17382000000,upgrade:5500000000,maintain:5000000000},
    {level:20,total:27382000000,upgrade:10000000000,maintain:9000000000}
  ];
  const RECORD_KEY = "majlis_alqimma_vip_records_v5";
  const CURRENCY_KEY = "majlis_alqimma_currencies_v1";
  const THEME_KEY = "majlis_alqimma_theme";
  const SUPPORT_DEFAULT = 130000;
  const DEFAULT_CURRENCIES = [
    {id:"JOD",name:"الدينار الأردني",code:"JOD",vip:11,target:73,games:62,enabled:true},
    {id:"USD",name:"الدولار الأمريكي",code:"USD",vip:15,target:100,games:85,enabled:true},
    {id:"EGP",name:"الجنيه المصري",code:"EGP",vip:1,target:5800,games:4500,enabled:true},
    {id:"TRY",name:"الليرة التركية",code:"TRY",vip:800,target:0,games:0,enabled:true}
  ];
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const state = {mode:"reach",records:loadRecords(),currencies:loadCurrencies(),last:null};
  let deferredInstall = null;
  function safeParse(value,fallback){try{return JSON.parse(value)||fallback}catch{return fallback}}
  function loadRecords(){const v=safeParse(localStorage.getItem(RECORD_KEY)||"[]",[]);return Array.isArray(v)?v.filter(x=>x&&Number.isFinite(Number(x.actualCharge))):[]}
  function loadCurrencies(){
    const saved=safeParse(localStorage.getItem(CURRENCY_KEY),"");
    if(!Array.isArray(saved)||!saved.length)return DEFAULT_CURRENCIES.map(x=>({...x}));
    const merged=saved.filter(x=>x&&x.code).map(x=>({id:String(x.id||x.code),name:String(x.name||x.code),code:String(x.code).toUpperCase(),vip:num(x.vip),target:num(x.target),games:num(x.games),enabled:x.enabled!==false}));
    return merged.length?merged:DEFAULT_CURRENCIES.map(x=>({...x}));
  }
  function persist(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{toast("تعذر الحفظ في مساحة المتصفح.","error");return false}}
  function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
  function fmt(v,d=0){return Number.isFinite(Number(v))?Number(v).toLocaleString("en-US",{minimumFractionDigits:d,maximumFractionDigits:d}):"—"}
  function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function toast(message,type=""){const el=document.createElement("div");el.className="toast "+type;el.textContent=message;$("#toastRegion").append(el);setTimeout(()=>el.remove(),3000)}
  function vip(level){return VIP_TABLE[level-1]||null}
  function activeCurrencies(){return state.currencies.filter(c=>c.enabled)}
  function buildSelects(){
    $("#currentVip").innerHTML=VIP_TABLE.map(x=>`<option value="${x.level}">VIP ${x.level}</option>`).join("");
    $("#targetVip").innerHTML=VIP_TABLE.map(x=>`<option value="${x.level}">VIP ${x.level}</option>`).join("");
    $("#multiplier").innerHTML=Array.from({length:50},(_,i)=>`<option value="${i+1}">×${i+1}</option>`).join("");
    $("#currentVip").value="10";$("#targetVip").value="11";$("#multiplier").value="5";
  }
  function drawCurrencyFields(){
    $("#vipRates").innerHTML=activeCurrencies().map(c=>`<label class="field"><span>${esc(c.name)} · VIP</span><div class="unit-input"><input data-vip-rate="${esc(c.code)}" type="number" min="0" step="any" value="${c.vip}"><b>${esc(c.code)}</b></div></label>`).join("");
    $("#vipCurrencyResults").innerHTML=activeCurrencies().map(c=>`<div class="result-cell"><span>قيمة الدعم · ${esc(c.code)}</span><b id="vipOut-${esc(c.code)}">0.00</b></div>`).join("");
    renderCurrencyTable();
  }
  function updateCurrencyValuesFromInputs(){state.currencies.forEach(c=>{const input=$(`[data-vip-rate="${CSS.escape(c.code)}"]`);if(input)c.vip=num(input.value)})}
  function renderCurrencyTable(){
    $("#currencyTable").innerHTML=state.currencies.map(c=>`<tr data-currency="${esc(c.code)}"><td>${esc(c.name)}</td><td dir="ltr">${esc(c.code)}</td><td><input data-rate="vip" type="number" min="0" step="any" value="${c.vip}"></td><td><input data-rate="target" type="number" min="0" step="any" value="${c.target}"></td><td><input data-rate="games" type="number" min="0" step="any" value="${c.games}"></td><td><button type="button" data-toggle="${esc(c.code)}">${c.enabled?"إخفاء":"تفعيل"}</button> <button type="button" data-delete="${esc(c.code)}">حذف</button></td></tr>`).join("");
  }
  function readForm(){
    const currencies={};activeCurrencies().forEach(c=>{const el=$(`[data-vip-rate="${CSS.escape(c.code)}"]`);currencies[c.code]=el?num(el.value):c.vip});
    return {clientName:$("#clientName")?.value?.trim()||"",clientId:$("#clientId")?.value?.trim()||"",currentVip:num($("#currentVip").value),targetVip:num($("#targetVip").value),multiplier:num($("#multiplier").value),firstTransition:$("#firstTransitionInput").value.trim()===""?null:num($("#firstTransitionInput").value),supportRate:num($("#supportRate").value),enableTargetLock:$("#enableTargetLock").checked,mode:state.mode,currencies};
  }
  function calculateValues(v){
    if(!Number.isInteger(v.currentVip)||v.currentVip<1||v.currentVip>20)throw Error("اختر مستوى حالي صحيحاً.");
    if(!Number.isInteger(v.targetVip)||v.targetVip<1||v.targetVip>20)throw Error("اختر مستوى مطلوباً صحيحاً.");
    if(!Number.isInteger(v.multiplier)||v.multiplier<1||v.multiplier>50)throw Error("اختر عرضاً من ×1 إلى ×50.");
    if(!Number.isFinite(v.supportRate)||v.supportRate<0)throw Error("أدخل قيمة دعم صحيحة.");
    let reachPoints=0,lockPoints=0;
    if(v.mode==="reach"){
      if(v.targetVip<v.currentVip)throw Error("المستوى المطلوب يجب أن يساوي الحالي أو أعلى منه.");
      if(v.targetVip>v.currentVip){
        if(v.firstTransition===null||!Number.isFinite(v.firstTransition)||v.firstTransition<0)throw Error("أدخل نقاط أول انتقال.");
        for(let level=v.currentVip;level<v.targetVip;level++)reachPoints+=level===v.currentVip?v.firstTransition:vip(level+1).upgrade;
      }
      if(v.enableTargetLock)lockPoints=vip(v.targetVip).maintain;
    }else lockPoints=vip(v.currentVip).maintain;
    const totalVipPoints=reachPoints+lockPoints;
    const actualCharge=totalVipPoints/v.multiplier;
    const supportNeeded=actualCharge/1000000*v.supportRate;
    const currencyTotals={};
    state.currencies.forEach(c=>{const rate=v.currencies[c.code]??c.vip;currencyTotals[c.code]=v.supportRate===0?0:supportNeeded/v.supportRate*rate});
    return {...v,reachPoints,lockPoints,totalVipPoints,actualCharge,supportNeeded,currencyTotals,createdAt:new Date().toISOString()};
  }
  function updateLockPreview(){
    const current=num($("#currentVip").value),target=num($("#targetVip").value);
    $("#currentLockValue").textContent=fmt(vip(current).maintain)+" XP";
    $("#currentLockDescription").textContent=`VIP ${current} · نقاط الحفاظ من جدول VIP`;
    $("#targetLockValue").textContent=fmt(vip(target).maintain)+" XP";
    $("#targetLockLevel").textContent="VIP "+target;
    $("#targetLockBox").hidden=state.mode!=="reach"||!$("#enableTargetLock").checked;
    $("#transitionRoute").innerHTML=`VIP ${current} <span>→</span> VIP ${Math.min(current+1,20)}`;
  }
  function renderResult(r){
    $("#resultMultiplier").textContent="×"+r.multiplier;$("#resultRoute").textContent=`VIP ${r.currentVip} → VIP ${r.targetVip}`;
    $("#actualCharge").textContent=fmt(r.actualCharge);$("#reachPoints").textContent=fmt(r.reachPoints);$("#lockPoints").textContent=fmt(r.lockPoints);$("#totalVipPoints").textContent=fmt(r.totalVipPoints);$("#supportNeeded").textContent=fmt(r.supportNeeded);
    state.currencies.forEach(c=>{const el=$("#vipOut-"+CSS.escape(c.code));if(el)el.textContent=fmt(r.currencyTotals[c.code]||0,2)});
    $("#vipFormula").textContent=`${fmt(r.reachPoints)} + ${fmt(r.lockPoints)} = ${fmt(r.totalVipPoints)} ÷ ×${r.multiplier} = ${fmt(r.actualCharge)}`;
    $("#supportFormula").textContent=`${fmt(r.actualCharge)} ÷ 1,000,000 × ${fmt(r.supportRate)} = ${fmt(r.supportNeeded)} دعم`;
  }
  function calculate(showError=false){
    $("#calculationError").hidden=true;updateLockPreview();
    try{const r=calculateValues(readForm());state.last=r;renderResult(r);return r}
    catch(e){state.last=null;if(showError){$("#calculationError").textContent=e.message;$("#calculationError").hidden=false}return null}
  }
  function setMode(mode){state.mode=mode==="currentLock"?"currentLock":"reach";$$(".mode-tab").forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle("active",on);b.setAttribute("aria-pressed",String(on))});$("#reachFields").hidden=state.mode!=="reach";$("#currentLockBox").hidden=state.mode!=="currentLock";if(state.mode==="currentLock")$("#enableTargetLock").checked=false;calculate()}
  function renderExtra(kind){
    const input=$("#"+kind+"Input"),target=$("#"+kind+"Results"),value=Math.max(0,num(input.value));
    target.innerHTML=activeCurrencies().map(c=>`<div class="output-item"><span>${esc(c.name)} · ${esc(c.code)}</span><b>${fmt(value/1000000*(kind==="target"?c.target:c.games),2)} ${esc(c.code)}</b></div>`).join("");
  }
  function saveRecord(){
    const r=calculate(true);if(!r)return;
    if(!r.clientName&&!r.clientId){toast("أدخل اسم العميل أو ID قبل الحفظ.","error");return}
    state.records.unshift({id:crypto.randomUUID?.()||String(Date.now()),...r});
    if(persist(RECORD_KEY,state.records)){renderHistory();toast("تم حفظ العملية.");$("#history").scrollIntoView({behavior:"smooth",block:"start"})}
  }
  function renderHistory(){
    const q=$("#historySearch").value.trim().toLowerCase();
    const rows=state.records.filter(r=>(`${r.clientName||""} ${r.clientId||""}`).toLowerCase().includes(q));
    $("#history").innerHTML=rows.map(r=>`<article class="history-record"><div class="record-main"><b>${esc(r.clientName||"عميل بدون اسم")}</b><small>ID: ${esc(r.clientId||"—")} · ${new Date(r.createdAt).toLocaleString("ar")}</small></div><div class="record-route">VIP ${Number(r.currentVip)} → VIP ${Number(r.targetVip)} · ×${Number(r.multiplier)}</div><div class="record-meta"><span>الشحن: ${fmt(r.actualCharge)}</span><span>الدعم: ${fmt(r.supportNeeded)}</span></div><div class="record-actions"><button data-restore="${esc(r.id)}">استرجاع</button><button data-delete-record="${esc(r.id)}">حذف</button></div></article>`).join("");
    $("#historyEmpty").hidden=rows.length>0;
  }
  function restoreRecord(id){
    const r=state.records.find(x=>x.id===id);if(!r)return;
    $("#clientName").value=r.clientName||"";$("#clientId").value=r.clientId||"";
    $("#currentVip").value=r.currentVip;$("#targetVip").value=r.targetVip;$("#multiplier").value=r.multiplier;
    $("#firstTransitionInput").value=r.firstTransition??"";$("#supportRate").value=r.supportRate??SUPPORT_DEFAULT;$("#enableTargetLock").checked=!!r.enableTargetLock;
    state.mode=r.mode||"reach";setMode(state.mode);
    state.currencies.forEach(c=>{const el=$(`[data-vip-rate="${CSS.escape(c.code)}"]`);if(el&&r.currencies?.[c.code]!=null)el.value=r.currencies[c.code]});
    calculate();$("#vip").scrollIntoView({behavior:"smooth"});
  }
  function renderSettings(){
    renderCurrencyTable();drawCurrencyFields();renderExtra("target");renderExtra("games");
  }
  function saveCurrencyTable(){
    $$("#currencyTable tr").forEach(row=>{
      const c=state.currencies.find(x=>x.code===row.dataset.currency);if(!c)return;
      row.querySelectorAll("input").forEach(input=>c[input.dataset.rate]=Math.max(0,num(input.value)));
    });
    persist(CURRENCY_KEY,state.currencies);drawCurrencyFields();calculate();renderExtra("target");renderExtra("games");toast("تم حفظ أسعار العملات.");
  }
  function downloadJSON(name,data){
    const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);
  }
  function initEvents(){
    $$(".mode-tab").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
    ["currentVip","targetVip","multiplier","firstTransitionInput","supportRate","enableTargetLock"].forEach(id=>$("#"+id).addEventListener("input",()=>calculate()));
    $("#vipRates").addEventListener("input",()=>calculate());
    $("#calculateBtn").addEventListener("click",()=>{if(calculate(true))toast("تم تحديث الحساب.")});
    $("#saveBtn").addEventListener("click",saveRecord);
    $("#newBtn").addEventListener("click",()=>{$("#clientName").value="";$("#clientId").value="";$("#firstTransitionInput").value="";$("#enableTargetLock").checked=false;calculate();toast("تم مسح مدخلات العملية.")});
    $("#targetInput").addEventListener("input",()=>renderExtra("target"));$("#gamesInput").addEventListener("input",()=>renderExtra("games"));
    $("#historySearch").addEventListener("input",renderHistory);
    $("#history").addEventListener("click",e=>{const restore=e.target.closest("[data-restore]"),del=e.target.closest("[data-delete-record]");if(restore)restoreRecord(restore.dataset.restore);if(del){state.records=state.records.filter(r=>r.id!==del.dataset.deleteRecord);persist(RECORD_KEY,state.records);renderHistory()}});
    $("#clearHistory").addEventListener("click",()=>{if(confirm("هل تريد حذف جميع العمليات المحفوظة نهائياً؟")){state.records=[];persist(RECORD_KEY,state.records);renderHistory();toast("تم حذف السجل.")}});
    $("#currencyForm").addEventListener("submit",e=>{e.preventDefault();const name=$("#newCurrencyName").value.trim(),code=$("#newCurrencyCode").value.trim().toUpperCase();if(!/^[A-Z0-9]{2,8}$/.test(code)){toast("رمز العملة يجب أن يكون أحرفاً أو أرقاماً لاتينية.","error");return}if(state.currencies.some(c=>c.code===code)){toast("هذه العملة موجودة مسبقاً.","error");return}state.currencies.push({id:code,name,code,vip:num($("#newCurrencyVip").value),target:num($("#newCurrencyTarget").value),games:num($("#newCurrencyGames").value),enabled:true});persist(CURRENCY_KEY,state.currencies);e.target.reset();renderSettings();calculate();toast("تمت إضافة العملة.")});
    $("#currencyTable").addEventListener("change",e=>{if(e.target.matches("input"))saveCurrencyTable()});
    $("#currencyTable").addEventListener("click",e=>{const toggle=e.target.closest("[data-toggle]"),del=e.target.closest("[data-delete]");if(toggle){const c=state.currencies.find(x=>x.code===toggle.dataset.toggle);if(c)c.enabled=!c.enabled;persist(CURRENCY_KEY,state.currencies);renderSettings();calculate()}if(del){if(state.currencies.length<=1){toast("يجب إبقاء عملة واحدة على الأقل.","error");return}if(confirm("حذف العملة وأسعارها؟")){state.currencies=state.currencies.filter(x=>x.code!==del.dataset.delete);persist(CURRENCY_KEY,state.currencies);renderSettings();calculate()}}});
    $("#resetRates").addEventListener("click",()=>{if(confirm("استعادة العملات والأسعار الافتراضية؟")){state.currencies=DEFAULT_CURRENCIES.map(x=>({...x}));persist(CURRENCY_KEY,state.currencies);renderSettings();calculate();toast("تمت استعادة الأسعار الافتراضية.")}});
    $("#exportSettings").addEventListener("click",()=>downloadJSON("majlis-settings.json",{currencies:state.currencies}));
    $("#exportRecords").addEventListener("click",()=>downloadJSON("majlis-records.json",state.records));
    $("#importSettings").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!Array.isArray(data.currencies))throw Error();state.currencies=data.currencies;persist(CURRENCY_KEY,state.currencies);renderSettings();calculate();toast("تم استيراد الإعدادات.")}catch{toast("ملف الإعدادات غير صالح.","error")}e.target.value=""});
    $("#themeToggle").addEventListener("click",()=>{document.body.classList.toggle("light");localStorage.setItem(THEME_KEY,document.body.classList.contains("light")?"light":"dark")});
    $("#goSettings").addEventListener("click",()=>$("#settings").scrollIntoView({behavior:"smooth"}));
    $("#menuToggle").addEventListener("click",()=>{const nav=$(".desktop-nav");nav.style.display=nav.style.display==="flex"?"none":"flex";nav.style.position="absolute";nav.style.top="64px";nav.style.left="12px";nav.style.right="12px";nav.style.padding="15px";nav.style.flexDirection="column";nav.style.background="var(--panel)";nav.style.border="1px solid var(--line)";nav.style.borderRadius="12px"});
    document.addEventListener("click",e=>{const copy=e.target.closest("[data-copy]");if(copy)navigator.clipboard?.writeText(copy.dataset.copy).then(()=>toast("تم النسخ."))});
    window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstall=e;$("#installBanner").hidden=false});
    $("#installBtn").addEventListener("click",async()=>{if(!deferredInstall)return;deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;$("#installBanner").hidden=true});
    $("#dismissInstall").addEventListener("click",()=>$("#installBanner").hidden=true);
  }
  function initPWA(){if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("sw.js").catch(()=>{});if(localStorage.getItem(THEME_KEY)==="light")document.body.classList.add("light");if(window.matchMedia("(display-mode: standalone)").matches)$("#installBanner").hidden=true}
  function init(){buildSelects();drawCurrencyFields();renderSettings();initEvents();renderHistory();setMode("reach");calculate();initPWA()}
  document.addEventListener("DOMContentLoaded",init);
})();