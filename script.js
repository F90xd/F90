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
const $ = id => document.getElementById(id);
const KEY = "vip_manager_data_v2";

function initialData(){
 return {
  theme:"dark",
  currencies:[
   {id:"ils",name:"شيكل",symbol:"₪"},
   {id:"jod",name:"دينار",symbol:"د.أ"},
   {id:"usd",name:"دولار",symbol:"$"},
   {id:"egp",name:"جنيه",symbol:"ج.م"}
  ],
  levels:Array.from({length:20},(_,i)=>({level:i+1,total:""})),
  clients:[],prices:[],
  business:{name:"",phone:"",footer:""}
 };
}

function load(){
 try{
  const old=JSON.parse(localStorage.getItem(KEY));
  return old?{...initialData(),...old}:initialData();
 }catch{return initialData();}
}
let data=load();

function save(){
 localStorage.setItem(KEY,JSON.stringify(data));
}
function notify(message){
 const t=$("toast");
 t.textContent=message;
 t.classList.add("show");
 clearTimeout(window.toastTimer);
 window.toastTimer=setTimeout(()=>t.classList.remove("show"),2500);
}
function clean(value){
 return String(value??"").replace(/[&<>"']/g,c=>({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
 }[c]));
}
function number(value){
 const n=Number(value);
 return Number.isFinite(n)?n:0;
}
function format(value){
 return new Intl.NumberFormat("ar",{maximumFractionDigits:2}).format(number(value));
}
function getCurrency(id){
 return data.currencies.find(c=>c.id===id)||data.currencies[0];
}
function money(value,id){
 return format(value)+" "+(getCurrency(id)?.symbol||"");
}

/* التنقل */
function openPage(id){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
 document.querySelectorAll(".nav[data-page]").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
 const names={
  dashboard:"الملخص والإحصائيات",
  calculator:"حاسبة VIP",
  levels:"جدول VIP",
  clients:"سجل العملاء",
  target:"التارجت ومكاسب اللعب",
  settings:"العملات والإعدادات"
 };
 $("pageTitle").textContent=names[id]||"لوحة التحكم";
 $("sidebar").classList.remove("open");
 $("scrim").classList.remove("show");
 window.scrollTo({top:0,behavior:"smooth"});
}
document.querySelectorAll("[data-page]").forEach(b=>b.onclick=()=>openPage(b.dataset.page));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>openPage(b.dataset.go));

$("menu").onclick=()=>{
 $("sidebar").classList.add("open");
 $("scrim").classList.add("show");
};
$("scrim").onclick=()=>{
 $("sidebar").classList.remove("open");
 $("scrim").classList.remove("show");
};

/* المظهر */
function applyTheme(){
 document.body.classList.toggle("light",data.theme==="light");
}
$("theme").onclick=()=>{
 data.theme=data.theme==="dark"?"light":"dark";
 applyTheme();save();
};

/* العملات */
function fillCurrencies(){
 ["calcCurrency","clientCurrency","targetCurrency","savedCurrency"].forEach(id=>{
  const el=$(id),old=el.value;
  el.innerHTML=data.currencies.map(c=>
   `<option value="${clean(c.id)}">${clean(c.name)} (${clean(c.symbol)})</option>`
  ).join("");
  if(data.currencies.some(c=>c.id===old))el.value=old;
 });
}
function renderCurrencies(){
 $("currencyList").innerHTML=data.currencies.map(c=>`
  <div class="currency-row">
   <b>${clean(c.name)} (${clean(c.symbol)})</b>
   <button class="mini" data-remove-currency="${clean(c.id)}">حذف</button>
  </div>`).join("");
 document.querySelectorAll("[data-remove-currency]").forEach(b=>{
  b.onclick=()=>{
   if(data.currencies.length===1){notify("يجب الاحتفاظ بعملة واحدة على الأقل");return;}
   if(!confirm("حذف هذه العملة؟"))return;
   data.currencies=data.currencies.filter(c=>c.id!==b.dataset.removeCurrency);
   save();fillCurrencies();renderCurrencies();renderClients();
  };
 });
}
$("addCurrency").onclick=()=>{
 const name=$("currencyName").value.trim();
 const symbol=$("currencySymbol").value.trim();
 if(!name||!symbol){notify("أدخل اسم العملة ورمزها");return;}
 data.currencies.push({id:"c"+Date.now(),name,symbol});
 $("currencyName").value="";
 $("currencySymbol").value="";
 save();fillCurrencies();renderCurrencies();
 notify("تمت إضافة العملة");
};

/* جدول المستويات */
function fillLevels(){
 const options=data.levels.map(l=>`<option value="${l.level}">VIP ${l.level}</option>`).join("");
 ["currentLevel","desiredLevel"].forEach(id=>$(id).innerHTML=options);
 $("currentLevel").value="1";
 $("desiredLevel").value="2";
}
function renderLevels(){
 $("levelsTable").innerHTML=data.levels.map((l,i)=>{
  const previous=i?number(data.levels[i-1].total):0;
  const diff=l.total===""?"—":format(number(l.total)-previous);
  return `<tr>
   <td>VIP ${l.level}</td>
   <td><input type="number" min="0" step="any" data-level="${i}" value="${clean(l.total)}" placeholder="القيمة الأصلية"></td>
   <td>${diff}</td>
  </tr>`;
 }).join("");
 document.querySelectorAll("[data-level]").forEach(input=>{
  input.onchange=()=>{
   data.levels[Number(input.dataset.level)].total=input.value;
   save();renderLevels();
  };
 });
}
$("saveLevels").onclick=()=>{save();notify("تم حفظ جدول VIP");};
$("clearLevels").onclick=()=>{
 if(!confirm("هل تريد مسح جميع قيم المستويات؟"))return;
 data.levels.forEach(l=>l.total="");
 save();renderLevels();notify("تم مسح القيم");
};

/* حاسبة VIP */
$("calcVip").onclick=()=>{
 const current=Number($("currentLevel").value);
 const desired=Number($("desiredLevel").value);
 const progress=number($("progress").value);
 const from=data.levels.find(l=>l.level===current);
 const to=data.levels.find(l=>l.level===desired);
 if(!from||!to||from.total===""||to.total===""){
  notify("أدخل قيم المستويات في جدول VIP أولاً");return;
 }
 if(desired<current){notify("المستوى المطلوب أقل من الحالي");return;}
 const total=number(to.total);
 const remaining=Math.max(0,total-progress);
 $("vipResult").textContent=format(remaining);
 $("vipLabel").textContent="المتبقي للوصول إلى VIP "+desired;
 $("vipTotal").textContent=format(total);
 $("vipRemain").textContent=money(remaining,$("calcCurrency").value);
};

/* العملاء */
function resetForm(){
 ["editId","clientName","clientId","clientPhone","clientAmount","clientNotes"].forEach(id=>$(id).value="");
 $("operationType").selectedIndex=0;
 $("formTitle").textContent="إضافة عملية جديدة";
 $("saveClient").textContent="حفظ العملية";
 $("cancelEdit").classList.add("hidden");
}
$("saveClient").onclick=()=>{
 const name=$("clientName").value.trim();
 const amount=$("clientAmount").value;
 if(!name){notify("أدخل اسم العميل");return;}
 if(amount===""||number(amount)<0){notify("أدخل مبلغاً صحيحاً");return;}
 const edit=$("editId").value;
 const old=data.clients.find(c=>c.id===edit);
 const record={
  id:edit||String(Date.now())+Math.random(),
  name,
  clientId:$("clientId").value.trim(),
  phone:$("clientPhone").value.trim(),
  type:$("operationType").value,
  amount:number(amount),
  currency:$("clientCurrency").value,
  notes:$("clientNotes").value.trim(),
  created:old?old.created:Date.now()
 };
 if(edit)data.clients=data.clients.map(c=>c.id===edit?record:c);
 else data.clients.push(record);
 save();resetForm();renderClients();notify("تم حفظ العملية");
};
$("cancelEdit").onclick=resetForm;

function renderClients(){
 const q=$("search").value.trim().toLowerCase();
 const list=data.clients.filter(c=>
  [c.name,c.clientId,c.phone,c.type,c.notes].join(" ").toLowerCase().includes(q)
 ).sort((a,b)=>b.created-a.created);

 $("clientsList").innerHTML=list.length?list.map(c=>`
  <div class="client-row">
   <div class="avatar">${clean((c.name||"?").slice(0,1))}</div>
   <div class="client-info">
    <b>${clean(c.name)} · ${clean(c.type)}</b>
    <small>${new Date(c.created).toLocaleString("ar")}</small>
    <p>${c.clientId?"ID: "+clean(c.clientId)+" · ":""}${clean(c.phone||"")}</p>
    <p>${clean(c.notes||"")}</p>
   </div>
   <div>
    <b>${money(c.amount,c.currency)}</b>
    <div class="client-buttons">
     <button class="mini" data-share="${clean(c.id)}">مشاركة</button>
     <button class="mini" data-edit="${clean(c.id)}">تعديل</button>
     <button class="mini" data-delete="${clean(c.id)}">حذف</button>
    </div>
   </div>
  </div>`).join(""):'<div class="empty">لا توجد عمليات مطابقة.</div>';

 document.querySelectorAll("[data-share]").forEach(b=>b.onclick=()=>shareClient(b.dataset.share));
 document.querySelectorAll("[data-edit]").forEach(b=>b.onclick=()=>editClient(b.dataset.edit));
 document.querySelectorAll("[data-delete]").forEach(b=>b.onclick=()=>deleteClient(b.dataset.delete));
 renderDashboard();
}
$("search").oninput=renderClients;

function editClient(id){
 const c=data.clients.find(x=>x.id===id);
 if(!c)return;
 $("editId").value=c.id;
 $("clientName").value=c.name;
 $("clientId").value=c.clientId||"";
 $("clientPhone").value=c.phone||"";
 $("operationType").value=c.type;
 $("clientAmount").value=c.amount;
 $("clientCurrency").value=c.currency;
 $("clientNotes").value=c.notes||"";
 $("formTitle").textContent="تعديل العملية";
 $("saveClient").textContent="حفظ التعديلات";
 $("cancelEdit").classList.remove("hidden");
 window.scrollTo({top:0,behavior:"smooth"});
}
function deleteClient(id){
 if(!confirm("حذف هذه العملية؟"))return;
 data.clients=data.clients.filter(c=>c.id!==id);
 save();renderClients();notify("تم حذف العملية");
}
function shareClient(id){
 const c=data.clients.find(x=>x.id===id);
 if(!c)return;
 const b=data.business;
 const message=[
  b.name||"تفاصيل العملية",
  "تفاصيل العملية",
  "العميل: "+c.name,
  c.clientId?"ID: "+c.clientId:"",
  c.phone?"رقم التواصل: "+c.phone:"",
  "نوع العملية: "+c.type,
  "المبلغ: "+money(c.amount,c.currency),
  c.notes?"ملاحظات: "+c.notes:"",
  b.footer||""
 ].filter(Boolean).join("\n");
 const phone=(c.phone||"").replace(/\D/g,"");
 const url=phone
  ?"https://wa.me/"+phone+"?text="+encodeURIComponent(message)
  :"https://wa.me/?text="+encodeURIComponent(message);
 window.open(url,"_blank","noopener");
}

/* الملخص */
function renderDashboard(){
 const unique=new Set(data.clients.map(c=>c.clientId||c.name));
 $("sClients").textContent=unique.size;
 $("sOps").textContent=data.clients.length;
 const mainCurrency=data.currencies[0]?.id;
 const total=data.clients.filter(c=>c.currency===mainCurrency)
  .reduce((sum,c)=>sum+number(c.amount),0);
 $("sTotal").textContent=format(total)+" "+(getCurrency(mainCurrency)?.symbol||"");
 const now=new Date();
 $("sMonth").textContent=data.clients.filter(c=>{
  const d=new Date(c.created);
  return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();
 }).length;
 const recent=[...data.clients].sort((a,b)=>b.created-a.created).slice(0,5);
 $("recent").innerHTML=recent.length?recent.map(c=>`
  <div class="recent-row">
   <div class="avatar">${clean(c.name.slice(0,1))}</div>
   <div class="client-info"><b>${clean(c.name)} · ${clean(c.type)}</b>
   <small>${new Date(c.created).toLocaleDateString("ar")}</small></div>
   <b>${money(c.amount,c.currency)}</b>
  </div>`).join(""):'<div class="empty">لا توجد عمليات مسجلة.</div>';
}

/* التارجت ومكاسب اللعب */
$("calcTarget").onclick=()=>{
 const amount=number($("targetAmount").value);
 const price=number($("targetPrice").value);
 const profit=number($("gameProfit").value);
 if(!amount||!price){notify("أدخل قيمة التارجت وسعر المليون");return;}
 const multiplier=amount/1000000;
 const cost=multiplier*price;
 const game=multiplier*profit;
 const cur=$("targetCurrency").value;
 $("targetCost").textContent=money(cost,cur);
 $("targetGame").textContent=money(game,cur);
 $("targetDiff").textContent=money(cost-game,cur);
};
$("savePrice").onclick=()=>{
 const name=$("priceName").value.trim();
 const price=$("priceSaved").value;
 if(!name||price===""){notify("أدخل اسم التسعيرة وسعرها");return;}
 data.prices.push({
  id:String(Date.now()),name,price:number(price),
  profit:number($("profitSaved").value),
  currency:$("savedCurrency").value
 });
 save();renderPrices();
 $("priceName").value="";$("priceSaved").value="";$("profitSaved").value="";
 notify("تم حفظ التسعيرة");
};
function renderPrices(){
 $("savedPrices").innerHTML=data.prices.map(p=>`
  <div class="saved-row">
   <b>${clean(p.name)}</b>
   <span>المليون: ${money(p.price,p.currency)} · اللعب: ${money(p.profit,p.currency)}</span>
   <button class="mini" data-use="${clean(p.id)}">استخدام</button>
   <button class="mini" data-remove="${clean(p.id)}">حذف</button>
  </div>`).join("")||'<div class="empty">لا توجد تسعيرات محفوظة.</div>';
 document.querySelectorAll("[data-use]").forEach(b=>b.onclick=()=>{
  const p=data.prices.find(x=>x.id===b.dataset.use);
  $("targetPrice").value=p.price;
  $("gameProfit").value=p.profit;
  $("targetCurrency").value=p.currency;
  notify("تم تحميل التسعيرة");
 });
 document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{
  data.prices=data.prices.filter(p=>p.id!==b.dataset.remove);
  save();renderPrices();
 });
}

/* بيانات النشاط */
$("saveBusiness").onclick=()=>{
 data.business={
  name:$("businessName").value.trim(),
  phone:$("businessPhone").value.trim(),
  footer:$("shareFooter").value.trim()
 };
 save();notify("تم حفظ بيانات التواصل");
};

/* النسخ الاحتياطي */
function exportBackup(){
 const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
 const url=URL.createObjectURL(blob);
 const a=document.createElement("a");
 a.href=url;a.download="VIP-backup-"+new Date().toISOString().slice(0,10)+".json";
 a.click();URL.revokeObjectURL(url);
 notify("تم تصدير النسخة الاحتياطية");
}
$("exportData").onclick=exportBackup;
$("exportTop").onclick=exportBackup;

$("importData").onchange=async e=>{
 const file=e.target.files[0];
 if(!file)return;
 try{
  const imported=JSON.parse(await file.text());
  if(!confirm("سيتم استبدال البيانات الحالية. هل تريد المتابعة؟"))return;
  data={
   ...initialData(),...imported,
   business:{...initialData().business,...(imported.business||{})}
  };
  save();refreshAll();notify("تم استيراد البيانات");
 }catch(error){notify("ملف JSON غير صالح");}
 e.target.value="";
};

$("clearAll").onclick=()=>{
 if(!confirm("سيتم حذف جميع بيانات هذا الجهاز. هل أنت متأكد؟"))return;
 if(!confirm("تأكيد أخير: هل قمت بحفظ نسخة احتياطية؟"))return;
 data=initialData();save();refreshAll();notify("تم مسح البيانات");
};

/* تشغيل */
function refreshAll(){
 applyTheme();
 fillCurrencies();
 fillLevels();
 renderLevels();
 renderCurrencies();
 renderClients();
 renderPrices();
 $("businessName").value=data.business.name||"";
 $("businessPhone").value=data.business.phone||"";
 $("shareFooter").value=data.business.footer||"";
}
refreshAll();

/* دعم التثبيت */
if("serviceWorker" in navigator && location.protocol.startsWith("http")){
 window.addEventListener("load",()=>{
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
 });
      }
