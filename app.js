'use strict';
const KEY='girly-skincare-v1';
const defaults={start:'2026-11-03',nia:true,bep:true,dailyAz:false,checks:{},overrides:{}};
let state;try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{state={...defaults}};
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const parse=s=>new Date(`${s}T12:00:00`);
const add=(s,n)=>{let d=parse(s);d.setDate(d.getDate()+n);return iso(d)};
const daysBetween=(a,b)=>Math.round((Date.UTC(...a.split('-').map((v,i)=>i===1?Number(v)-1:Number(v)))-Date.UTC(...b.split('-').map((v,i)=>i===1?Number(v)-1:Number(v))))/86400000);
const dow=s=>(parse(s).getDay()+6)%7;
const dateFmt=s=>parse(s).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
// Conservative example, not a prescription. Later increases only if skin tolerates them.
function actives(date){let elapsed=daysBetween(date,state.start),week=Math.floor(elapsed/7);let a=[];if(elapsed<0)return a;
 const wd=dow(date);
 // Weeks 1-2: Saturday; weeks 3-4: Wed/Sat; weeks 5-6: Mon/Wed/Sat;
 // weeks 7-8: alternate days from week 7; after: same alternate-day baseline (no forced daily escalation).
 let adap=week<2?wd===5:week<4?[2,5].includes(wd):week<6?[0,2,5].includes(wd):(elapsed-42)%2===0;
 if(adap)a.push('adap');
 // Azelaic acid remains separate from adapalene days; gentle 2-3 days/week.
 let az=week<2?[1,3].includes(wd):week<4?[1,4].includes(wd):week<6?[1,4,6].includes(wd):[1,3,6].includes(wd);
 if(state.dailyAz&&week>=8)az=!adap;
 if(az&&!adap)a.push('azel');
 if(state.nia&&wd===4&&!adap&&!az)a.push('nia');
 if(state.bep&&wd===6&&!adap&&!az)a.push('bep');
 return state.overrides[date]||a;
}
const morning=[['clean-am','Мягкое очищение (по необходимости)'],['toner-am','Тонер Manyo Bifida'],['purito-am','Крем Purito'],['spf','SPF 50']];
function tasks(date){let active=actives(date);let am=[...morning],pm=[['clean-pm','Мягкое очищение'],['toner-pm','Тонер Manyo Bifida (если комфортно)']];if(active.includes('azel'))pm.push(['azel','Азелаиновая кислота 15%']);if(active.includes('nia'))pm.push(['nia','Ниацинамид (необязательно)']);if(active.includes('adap'))pm.push(['adap','Адапален: горошина на всё лицо, на сухую кожу']);pm.push(['purito-pm','Крем Purito']);if(active.includes('bep'))pm.push(['bep','Бепантен Baby: локально при сухости, тонко (необязательно)']);return {am,pm}}
let selected=iso(new Date()),month=new Date(parse(selected).getFullYear(),parse(selected).getMonth(),1);
const $=id=>document.getElementById(id);
function routineHtml(date){const {am,pm}=tasks(date);let html='';for(const [title,items] of [['☀️ Утро',am],['🌙 Вечер',pm]]){html+=`<div class="routine-title">${title}</div>`;for(const [id,label] of items){let key=`${date}|${id}`,checked=!!state.checks[key];html+=`<label class="task ${checked?'checked':''}"><input type="checkbox" data-key="${key}" ${checked?'checked':''}><span>${label}</span></label>`}}html+='<p class="note">Адапален и азелаиновая разведены по разным вечерам. При раздражении пропускай активы и ориентируйся на рекомендации дерматолога. Бепантен не нужен при отсутствии сухости.</p>';return html}
function bindChecks(root){root.querySelectorAll('input[data-key]').forEach(el=>el.addEventListener('change',()=>{state.checks[el.dataset.key]=el.checked;save();render()}))}
function render(){const title=month.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});$('monthLabel').textContent=title.charAt(0).toUpperCase()+title.slice(1);const year=month.getFullYear(),mo=month.getMonth(),first=(new Date(year,mo,1).getDay()+6)%7,count=new Date(year,mo+1,0).getDate();let html='';for(let i=0;i<first;i++)html+='<div class="cell blank"></div>';for(let day=1;day<=count;day++){const date=iso(new Date(year,mo,day)),acts=actives(date),keys=Object.keys(state.checks).filter(k=>k.startsWith(date+'|')),done=keys.filter(k=>state.checks[k]).length;html+=`<button class="cell ${date===selected?'selected':''}" data-date="${date}" aria-label="${dateFmt(date)}"><span class="num">${day}</span><span class="marks">${acts.filter(a=>a!=='bep').map(a=>`<i class="dot ${a}"></i>`).join('')}</span>${done?`<span class="done">✓ ${done}</span>`:''}</button>`} $('monthGrid').innerHTML=html;$('monthGrid').querySelectorAll('[data-date]').forEach(el=>el.addEventListener('click',()=>{selected=el.dataset.date;$('dayPicker').value=selected;render()}));$('selectedLabel').textContent=dateFmt(selected);$('selectedRoutine').innerHTML=routineHtml(selected);bindChecks($('selectedRoutine'));$('dayPicker').value=selected;$('todayRoutine').innerHTML=routineHtml(selected);bindChecks($('todayRoutine'))}
$('prev').onclick=()=>{month.setMonth(month.getMonth()-1);render()};$('next').onclick=()=>{month.setMonth(month.getMonth()+1);render()};$('dayPicker').onchange=e=>{if(!e.target.value)return;selected=e.target.value;month=new Date(parse(selected).getFullYear(),parse(selected).getMonth(),1);render()};document.querySelectorAll('.tab').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b===btn));document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('hidden',s.id!==btn.dataset.tab));render()});
function showSettings(){$('startDate').value=state.start;$('useNia').checked=state.nia;$('useBep').checked=state.bep;$('dailyAz').checked=state.dailyAz}showSettings();$('saveSettings').onclick=()=>{const d=$('startDate').value;if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return alert('Выбери дату начала');state.start=d;state.nia=$('useNia').checked;state.bep=$('useBep').checked;state.dailyAz=$('dailyAz').checked;save();render();alert('Сохранено ♡')};$('exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify({version:1,...state},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='skincare-diary-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('importFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const x=JSON.parse(await file.text());if(typeof x.start!=='string'||typeof x.checks!=='object'||!x.checks||Array.isArray(x.checks))throw Error('bad');if(!confirm('Заменить текущие отметки резервной копией?'))return;state={...defaults,...x};save();showSettings();render();alert('Восстановлено ♡')}catch{alert('Не удалось прочитать резервную копию')}};$('resetBtn').onclick=()=>{if(confirm('Удалить все отметки ухода?')){state.checks={};save();render()}};
render();if('serviceWorker'in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./sw.js').catch(()=>{});
