'use strict';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const categories={functional:'قابلیت‌ها',ui:'رابط کاربری (UI)',ux:'تجربه کاربری (UX)',technical:'فنی',architecture:'معماری',security:'امنیت',privacy:'حریم خصوصی',accessibility:'دسترس‌پذیری',performance:'عملکرد',data:'داده',integration:'یکپارچه‌سازی',testing:'آزمون و QA',deployment:'ساخت و انتشار',localization:'بومی‌سازی',media:'صوت و تصویر',storage:'ذخیره‌سازی',cryptography:'رمزنگاری',authentication:'احراز هویت',compatibility:'سازگاری',reliability:'پایداری',compliance:'انطباق و مجوز',documentation:'مستندسازی',maintenance:'نگهداری',other:'سایر'};
const policies={locked:'ثابت (Locked)',approval:'نیازمند تأیید',flexible:'انعطاف‌پذیر'},sources={user:'تصریح کاربر',approved:'تأیید کاربر',document:'مستند',image:'مرجع تصویری',inferred:'استنباط AI',unspecified:'نامشخص'},priorities={critical:'بحرانی',high:'بالا',medium:'متوسط',low:'پایین'},modes={inspiration:'الهام',structure:'حفظ ساختار',strict:'مرجع دقیق'};
const identityFields=['title','summary','audience','technical','goals','non_goals','constraints'];const extraFields=['design_system','architecture','workflow','conflicts','notes'];let active=null,dirty=false,openReq=new Set(),currentTab='intent',projects=[];
async function api(path,options){const r=await fetch(path,options);if(!r.ok){let obj;try{obj=await r.json()}catch{}throw Error(obj?.error||`HTTP ${r.status}`)}return r.headers.get('content-type')?.includes('json')?r.json():r.blob()}
const json=(method,data)=>({method,headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
function toast(msg){const b=$('toast');b.textContent=msg;b.hidden=false;clearTimeout(b.timer);b.timer=setTimeout(()=>b.hidden=true,3500)}
function markDirty(){dirty=true;$('save').disabled=false;$('save-indicator').textContent='تغییرات ذخیره‌نشده';}
function options(o,value){return Object.entries(o).map(([k,v])=>`<option value="${esc(k)}" ${k===value?'selected':''}>${esc(v)}</option>`).join('')}
function textReq(r){return `${r.id||''} ${r.title||''} ${r.text||''} ${r.acceptance||''}`.toLowerCase()}
function gather(){if(!active)return;for(const k of [...identityFields,...extraFields]){const e=document.querySelector(`[data-field="${k}"]`);if(e)active[k]=e.value}active.status=$('approved').checked?'approved':'draft';for(const card of document.querySelectorAll('[data-req-index]')){const i=Number(card.dataset.reqIndex);for(const el of card.querySelectorAll('[data-rfield]')){const k=el.dataset.rfield;if(k==='dependencies'||k==='reference_ids')active.requirements[i][k]=el.value.split(/[\s,]+/).filter(Boolean);else active.requirements[i][k]=el.value}}for(const card of document.querySelectorAll('[data-screen-index]')){const i=Number(card.dataset.screenIndex);for(const el of card.querySelectorAll('[data-sfield]')){const k=el.dataset.sfield;active.screens[i][k]=k==='related_requirements'?el.value.split(/[\s,]+/).filter(Boolean):el.value}}for(const card of document.querySelectorAll('[data-journey-index]')){const i=Number(card.dataset.journeyIndex);for(const el of card.querySelectorAll('[data-jfield]')){const k=el.dataset.jfield;active.journeys[i][k]=k==='related_requirements'?el.value.split(/[\s,]+/).filter(Boolean):el.value}}for(const card of document.querySelectorAll('[data-task-index]')){const i=Number(card.dataset.taskIndex);for(const el of card.querySelectorAll('[data-tfield]')){const k=el.dataset.tfield;if(k==='depends_on'||k==='requirement_ids')active.tasks[i][k]=el.value.split(/[\s,]+/).filter(Boolean);else active.tasks[i][k]=el.value}}for(const card of document.querySelectorAll('[data-ref-index]')){const i=Number(card.dataset.refIndex);for(const el of card.querySelectorAll('[data-ffield]')){const k=el.dataset.ffield;if(k==='related_requirements')active.references[i][k]=el.value.split(/[\s,]+/).filter(Boolean);else active.references[i][k]=el.value}}}
async function loadProjects(){projects=await api('/api/projects');$('project-list').innerHTML=projects.map(p=>`<button class="project ${active?.id===p.id?'active':''}" data-pid="${p.id}"><strong>${esc(p.title)}</strong><small>${esc(p.status||'draft')} · v${p.version||1}</small></button>`).join('');document.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>openProject(b.dataset.pid))}
async function openProject(id){if(dirty&&!confirm('تغییرات ذخیره نشده‌اند. بدون ذخیره خارج می‌شوی؟'))return;active=await api('/api/projects/'+id);active.screens=active.screens||[];active.journeys=active.journeys||[];active.tasks=active.tasks||[];active.bank=active.bank||{skills:[],roles:[],documents:{}};dirty=false;openReq=new Set();$('empty').hidden=true;$('editor').hidden=false;$('save').disabled=true;$('export').disabled=false;$('install-project').disabled=false;$('save-indicator').textContent='ذخیره‌شده';$('heading').textContent=active.title;$('subtitle').textContent=`قرارداد پروژه · نسخه ${active.version} · ${active.status==='approved'?'تأییدشده':'پیش‌نویس'}`;for(const k of [...identityFields,...extraFields]){const el=document.querySelector(`[data-field="${k}"]`);if(el)el.value=active[k]||''}$('approved').checked=active.status==='approved';renderReqs();renderRefs();renderScreens();renderJourneys();renderTasks();renderReview();if(window.renderBank)window.renderBank();switchTab('intent');await loadProjects();window.iwbOnProjectOpen?.()}
async function create(){const title=prompt('نام پروژه جدید چیست؟');if(!title?.trim())return;try{const p=await api('/api/projects',json('POST',{title}));await openProject(p.id);toast('پروژه ایجاد شد')}catch(e){toast(e.message)}}
async function save(){if(!active)return false;gather();try{active=await api(`/api/projects/${active.id}`,json('PUT',active));dirty=false;$('save').disabled=true;$('save-indicator').textContent='ذخیره‌شده';$('subtitle').textContent=`قرارداد پروژه · نسخه ${active.version} · ${active.status==='approved'?'تأییدشده':'پیش‌نویس'}`;await loadProjects();return true}catch(e){toast(e.message);return false}}
function downloadBlob(data,filename){const blob=data instanceof Blob?data:new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),5000)}
async function downloadContract(){if(!active)return;if(dirty&&!(await save()))return;try{const data=await api(`/api/projects/${active.id}/export`);downloadBlob(data,'intent-contract-'+active.id.slice(0,8)+'.zip');toast('بسته قرارداد دریافت شد')}catch(e){toast(e.message)}}
async function downloadJSON(){if(!active)return;if(dirty&&!(await save()))return;try{downloadBlob(await api(`/api/projects/${active.id}/json?include_images=1`),'project-'+active.id.slice(0,8)+'.json')}catch(e){toast(e.message)}}
async function template(){try{downloadBlob(await api('/api/template'),'intent-workbench-template.json')}catch(e){toast(e.message)}}
function switchTab(tab){currentTab=tab;document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));document.querySelectorAll('.panel').forEach(x=>x.hidden=x.id!==tab);if(tab==='review')renderReview();if(tab==='tasks')renderTasks();if(tab==='bank'&&window.renderBank)window.renderBank();window.loadContractTool?.(tab)}
function effectiveRefIds(req){return new Set([...(req.reference_ids||[]), ...active.references.filter(ref=>(ref.related_requirements||[]).includes(req.id)).map(ref=>ref.id)])}
function reqCard(r,i){let expanded=openReq.has(r.id);return `<article class="req-card ${expanded?'':'collapsed'}" data-req-index="${i}"><div class="req-head"><span class="req-id">${esc(r.id||`REQ-${i+1}`)}</span><button class="req-title" data-toggle="${i}" title="باز و بسته کردن">${esc(r.title||r.text?.slice(0,90)||'نیازمندی جدید')} ${expanded?'⌃':'⌄'}</button><span class="req-sub">${esc(categories[r.category]||r.category)} · ${esc(policies[r.policy]||'')}</span><button class="mini danger" data-delete="${i}">حذف</button></div><div class="req-body"><div class="req-grid"><label>عنوان کوتاه<input data-rfield="title" value="${esc(r.title)}"></label><label>حوزه<select data-rfield="category">${options(categories,r.category)}</select></label><label class="wide">شرح دقیق نیازمندی<textarea data-rfield="text" rows="3">${esc(r.text)}</textarea></label><label>سیاست تغییر<select data-rfield="policy">${options(policies,r.policy)}</select></label><label>اولویت<select data-rfield="priority">${options(priorities,r.priority||'medium')}</select></label><label>منشأ<select data-rfield="source">${options(sources,r.source)}</select></label><label>وابستگی‌ها (شناسه‌ها با کاما)<input data-rfield="dependencies" value="${esc((r.dependencies||[]).join(', '))}"></label><label class="wide">شواهد منشأ<input data-rfield="source_note" value="${esc(r.source_note||'')}"></label><label class="wide">معیارهای پذیرش<textarea data-rfield="acceptance" rows="4">${esc(r.acceptance)}</textarea></label><label>فاز اجرا<input data-rfield="phase" value="${esc(r.phase||'')}"></label></div><div class="req-images"><b>🖼 تصاویر و مراجع همین نیازمندی</b><p class="hint">بعد از Import JSON یا ثبت دستی، می‌توانی برای این نیازمندی تصویر اضافه کنی یا یکی از مراجع موجود را لینک بدهی.</p><div class="req-image-actions"><button class="button secondary" type="button" data-add-req-image="${i}">+ آپلود تصویر برای این نیازمندی</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-req-file="${i}" hidden multiple></div><div class="req-ref-list">${active.references.map(ref=>`<label class="req-ref-option"><input type="checkbox" data-ref-link="${esc(ref.id)}" ${effectiveRefIds(r).has(ref.id)?'checked':''}><span>${ref.filename?`<img src="/api/projects/${active.id}/images/${esc(ref.filename)}" alt="تصویر">`:`<span class="image-missing">${ref.url?'لینک فقط':'بدون تصویر'}</span>`}${esc(ref.id)} — ${esc(ref.name||'مرجع')}</span></label>`).join('')||'<p class="hint">هنوز مرجعی نیست؛ با دکمه بالا اضافه کن.</p>'}</div></div></div></article>`}
function renderReqs(){if(!active)return;const count=active.requirements.length;$('req-count').textContent=count;const q=$('req-search').value.toLowerCase(),cat=$('category-filter').value,pol=$('policy-filter').value;let matches=0;$('req-list').innerHTML=active.requirements.map((r,i)=>{if(q&&!textReq(r).includes(q)||cat&&r.category!==cat||pol&&r.policy!==pol)return '';matches++;return reqCard(r,i)}).join('')||'<div class="hint">در این فیلتر موردی یافت نشد.</div>';$('req-stats').innerHTML=`<span class="chip">${matches} از ${count} نیازمندی</span>`+Object.entries(priorities).map(([k,v])=>`<span class="chip">${v}: ${active.requirements.filter(r=>r.priority===k).length}</span>`).join('');document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>{gather();const id=active.requirements[Number(b.dataset.toggle)].id;if(openReq.has(id))openReq.delete(id);else openReq.add(id);renderReqs()});document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>{if(!confirm('این نیازمندی حذف شود؟'))return;gather();active.requirements.splice(Number(b.dataset.delete),1);markDirty();renderReqs()});document.querySelectorAll('[data-rfield]').forEach(e=>e.addEventListener('input',()=>{markDirty();const card=e.closest('[data-req-index]'),i=Number(card.dataset.reqIndex),k=e.dataset.rfield;if(k==='dependencies'||k==='reference_ids')active.requirements[i][k]=e.value.split(/[\s,]+/).filter(Boolean);else active.requirements[i][k]=e.value;if(k==='title')card.querySelector('.req-title').textContent=e.value||'نیازمندی جدید'}))
  document.querySelectorAll('[data-add-req-image]').forEach(b=>b.onclick=()=>document.querySelector(`[data-req-file="${b.dataset.addReqImage}"]`)?.click());
  document.querySelectorAll('[data-req-file]').forEach(e=>e.onchange=async()=>{const index=Number(e.dataset.reqFile);await upload(e.files,index);e.value=''});
  document.querySelectorAll('[data-ref-link]').forEach(e=>e.onchange=()=>{gather();const card=e.closest('[data-req-index]');const r=active.requirements[Number(card.dataset.reqIndex)];const ref=e.dataset.refLink;const ids=effectiveRefIds(r);if(e.checked)ids.add(ref);else ids.delete(ref);r.reference_ids=[...ids];const source=active.references.find(x=>x.id===ref);if(source){const back=new Set(source.related_requirements||[]);if(e.checked)back.add(r.id);else back.delete(r.id);source.related_requirements=[...back]}markDirty();});
}
function addReq(){gather();const nums=active.requirements.map(r=>Number((r.id||'').match(/\d+$/)?.[0]||0));const id='REQ-'+String(Math.max(0,...nums)+1).padStart(3,'0');active.requirements.push({id,title:'',text:'',category:'functional',policy:'approval',source:'user',source_note:'',acceptance:'',priority:'medium',dependencies:[],phase:'',reference_ids:[]});openReq.add(id);$('req-search').value='';$('category-filter').value='';$('policy-filter').value='';markDirty();renderReqs();document.querySelector('[data-req-index="'+(active.requirements.length-1)+'"]')?.scrollIntoView({behavior:'smooth',block:'center'})}
function renderRefs(){if(!active)return;$('ref-count').textContent=active.references.length;$('ref-list').innerHTML=active.references.map((r,i)=>`<article class="ref-card" data-ref-index="${i}"><div class="ref-head"><b>${esc(r.id)} — ${esc(r.name||'مرجع')}</b><button class="mini danger" data-delete-ref="${i}">حذف</button></div><div class="ref-body">${r.filename?`<div class="wide"><img class="ref-preview" src="/api/projects/${active.id}/images/${esc(r.filename)}" alt="مرجع تصویری"></div>`:`<div class="wide hint">⚠ فایل تصویر به این مرجع ضمیمه نشده${r.url?'؛ فقط آدرس آن ثبت شده است.':''}</div>`}<label>نام مرجع<input data-ffield="name" value="${esc(r.name)}"></label><label>نقش<select data-ffield="mode">${options(modes,r.mode||'inspiration')}</select></label><label class="wide">URL یا شناسه منبع<input data-ffield="url" value="${esc(r.url||'')}"></label><label class="wide">شرح منبع<textarea data-ffield="notes" rows="2">${esc(r.notes)}</textarea></label><label>ویژگی‌های قابل حفظ<textarea data-ffield="preserve" rows="3">${esc(r.preserve)}</textarea></label><label>تغییرات مجاز<textarea data-ffield="modify" rows="3">${esc(r.modify)}</textarea></label><label class="wide">تغییرات ممنوع<textarea data-ffield="forbidden" rows="2">${esc(r.forbidden||'')}</textarea></label><label>وضعیت دسترسی<input data-ffield="availability" value="${esc(r.availability||'mentioned_only')}"></label><label>نیازمندی‌های مرتبط<input data-ffield="related_requirements" value="${esc((r.related_requirements||[]).join(', '))}"></label></div></article>`).join('');document.querySelectorAll('[data-delete-ref]').forEach(b=>b.onclick=()=>{gather();active.references.splice(Number(b.dataset.deleteRef),1);markDirty();renderRefs()});document.querySelectorAll('[data-ffield]').forEach(e=>e.addEventListener('input',markDirty))}
function addRef(){gather();const ids=active.references.map(r=>Number((r.id||'').match(/\d+$/)?.[0]||0)),id='REF-'+String(Math.max(0,...ids)+1).padStart(3,'0');active.references.push({id,name:'',filename:'',url:'',notes:'',preserve:'',modify:'',forbidden:'',related_requirements:[],availability:'mentioned_only',mode:'inspiration'});markDirty();renderRefs()}
async function upload(files,requirementIndex=null){if(!active)return;for(const file of files){if(file.size>12*1024*1024||!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)){toast('فرمت یا اندازه تصویر معتبر نیست');continue}try{if(dirty&&!(await save()))return;active=await api(`/api/projects/${active.id}/references`,{method:'POST',headers:{'Content-Type':file.type,'X-File-Name':file.name.replace(/[^\x20-\x7E]/g,'_')},body:file});if(requirementIndex!==null){const ref=active.references[active.references.length-1];const req=active.requirements[requirementIndex];if(req&&ref){req.reference_ids=[...new Set([...(req.reference_ids||[]),ref.id])];ref.related_requirements=[req.id];active=await api(`/api/projects/${active.id}`,json('PUT',active));dirty=false;openReq.add(req.id)}}markDirty();renderRefs();renderReqs();toast('تصویر و ارتباط نیازمندی ثبت شد')}catch(e){toast(e.message)}}}

const screenLabels={name:'نام صفحه',purpose:'هدف صفحه',layout:'چیدمان و سلسله‌مراتب بصری',components:'کامپوننت‌های ضروری',interactions:'تعامل‌ها و ناوبری',states:'Loading / Empty / Error / Success',responsive:'رفتار در عرض‌های مختلف',tokens:'رنگ‌ها، تایپوگرافی و فاصله‌ها',acceptance:'معیار پذیرش قابل بررسی',related_requirements:'شناسه نیازمندی‌های مرتبط'};
const journeyLabels={name:'نام مسیر',preconditions:'پیش‌شرط',steps:'مراحل (هر خط یک قدم)',expected:'نتیجه مورد انتظار',actual:'نتیجه واقعی کاربر',related_requirements:'نیازمندی‌های مرتبط'};
function cards(collection,container,field,labels){
 const a=active?.[collection]||[];
 $(container).innerHTML=a.map((v,i)=>`<article class="detail-card" data-${field}-index="${i}"><div class="ref-head"><b>${esc(v.id)} — ${esc(v.name||'مورد جدید')}</b><button class="mini danger" data-remove-${field}="${i}">حذف</button></div><div class="detail-grid">${Object.entries(labels).map(([k,label])=>`<label>${label}${k==='name'?`<input data-${field[0]}field="${k}" value="${esc(v[k]||'')}">`:`<textarea rows="${k==='steps'||k==='layout'?4:2}" data-${field[0]}field="${k}">${esc(Array.isArray(v[k])?v[k].join(', '):v[k]||'')}</textarea>`}</label>`).join('')}<label> ${collection==='screens'?'سطح الزام':'نتیجه تست'} <select data-${field[0]}field="${collection==='screens'?'role':'status'}">${options(collection==='screens'?{unspecified:'نامشخص',inspiration:'الهام',required:'الزامی'}:{not_run:'تست‌نشده',pass:'موفق',fail:'ناموفق',blocked:'مسدود',unverified:'تأییدنشده'},v[collection==='screens'?'role':'status'])}</select></label></div></article>`).join('')||'<p class="hint">هنوز موردی ثبت نشده؛ برای افزودن روی دکمه بالا بزن.</p>';
 document.querySelectorAll(`[data-remove-${field}]`).forEach(b=>b.onclick=()=>{gather();a.splice(Number(b.getAttribute(`data-remove-${field}`)),1);markDirty();collection==='screens'?renderScreens():renderJourneys()});
 document.querySelectorAll(`[data-${field[0]}field]`).forEach(e=>{if(e.closest(`[data-${field}-index]`))e.oninput=markDirty});
}
function renderScreens(){cards('screens','screen-list','screen',screenLabels)}
function renderJourneys(){cards('journeys','journey-list','journey',journeyLabels)}
function addScreen(){gather();active.screens=active.screens||[];active.screens.push({id:'UI-'+String(active.screens.length+1).padStart(3,'0'),name:'',purpose:'',layout:'',components:'',interactions:'',states:'',responsive:'',tokens:'',acceptance:'',role:'unspecified',related_requirements:[]});markDirty();renderScreens()}
function addJourney(){gather();active.journeys=active.journeys||[];active.journeys.push({id:'UAT-'+String(active.journeys.length+1).padStart(3,'0'),name:'',preconditions:'',steps:'',expected:'',actual:'',status:'not_run',related_requirements:[]});markDirty();renderJourneys()}

const taskStatusLabels={todo:'انجام‌نشده',in_progress:'در حال اجرا',blocked:'مسدود',done:'تکمیل‌شده'},taskOwnerLabels={agent:'ایجنت',user:'کاربر',reviewer:'بازبین',unassigned:'تخصیص‌نیافته'};
function taskCard(t,i){return `<article class="task-card" data-task-index="${i}"><div class="task-card-head"><span class="req-id">${esc(t.id)}</span><strong>${esc(t.title||'وظیفه بدون عنوان')}</strong><span class="task-pill task-${esc(t.status)}">${esc(taskStatusLabels[t.status]||t.status)}</span><button class="mini danger" type="button" data-remove-task="${i}">حذف</button></div><div class="task-grid">
<label class="wide">عنوان<input data-tfield="title" value="${esc(t.title)}"></label>
<label>مرحله / فاز<input data-tfield="phase" value="${esc(t.phase||'')}" placeholder="PHASE-01"></label>
<label>وضعیت<select data-tfield="status">${options(taskStatusLabels,t.status)}</select></label>
<label>اولویت<select data-tfield="priority">${options(priorities,t.priority)}</select></label>
<label>مسئول<select data-tfield="owner">${options(taskOwnerLabels,t.owner||'agent')}</select></label>
<label>وابستگی به وظایف (شناسه‌ها)<input data-tfield="depends_on" value="${esc((t.depends_on||[]).join(', '))}"></label>
<label>نیازمندی‌های مرتبط<input data-tfield="requirement_ids" value="${esc((t.requirement_ids||[]).join(', '))}"></label>
<label class="wide">شرح کار<textarea data-tfield="description" rows="2">${esc(t.description||'')}</textarea></label>
<label class="wide">معیار تکمیل / Definition of Done<textarea data-tfield="acceptance" rows="2">${esc(t.acceptance||'')}</textarea></label>
<label class="wide">شواهد واقعی اجرای تست (برای DONE اجباری)<textarea data-tfield="evidence" rows="2" placeholder="مثلاً: unit tests PASS; file:...">${esc(t.evidence||'')}</textarea></label>
<label class="wide">یادداشت یا مانع<textarea data-tfield="notes" rows="2">${esc(t.notes||'')}</textarea></label>
</div></article>`}
function renderTasks(){if(!active)return;let tasks=active.tasks||[];$('task-count').textContent=tasks.length;let counts=Object.fromEntries(Object.keys(taskStatusLabels).map(k=>[k,tasks.filter(t=>t.status===k).length]));$('task-stats').innerHTML=Object.entries(taskStatusLabels).map(([k,v])=>`<div class="task-stat"><strong>${counts[k]}</strong><span>${v}</span></div>`).join('');const q=$('task-search').value.trim().toLowerCase(),status=$('task-filter').value;$('task-list').innerHTML=tasks.map((t,i)=>((status&&t.status!==status)||(q&&!(`${t.id} ${t.title} ${t.description} ${t.phase} ${(t.requirement_ids||[]).join(' ')}`.toLowerCase().includes(q))))?'':taskCard(t,i)).join('')||'<p class="hint">وظیفه‌ای برای نمایش وجود ندارد.</p>';document.querySelectorAll('[data-remove-task]').forEach(b=>b.onclick=()=>{if(!confirm('این وظیفه حذف شود؟'))return;gather();active.tasks.splice(Number(b.dataset.removeTask),1);markDirty();renderTasks()});document.querySelectorAll('[data-tfield]').forEach(e=>e.addEventListener('input',()=>{let t=active.tasks[Number(e.closest('[data-task-index]').dataset.taskIndex)],k=e.dataset.tfield;t[k]=k==='depends_on'||k==='requirement_ids'?e.value.split(/[\s,]+/).filter(Boolean):e.value;markDirty()}));document.querySelectorAll('[data-tfield="status"]').forEach(e=>e.addEventListener('change',()=>{gather();renderTasks()}))}
function addTask(){if(!active)return;gather();const nums=active.tasks.map(t=>Number((t.id||'').match(/^TASK-(\d+)$/)?.[1]||0));let next=Math.max(0,...nums)+1;active.tasks.push({id:'TASK-'+String(next).padStart(3,'0'),title:'',description:'',phase:'',status:'todo',priority:'medium',owner:'agent',depends_on:[],requirement_ids:[],acceptance:'',evidence:'',notes:''});markDirty();$('task-search').value='';$('task-filter').value='';renderTasks()}
async function importTaskBoard(file){if(!file||!active)return;try{const raw=await file.text();if(raw.length>5_000_000)throw Error('فایل بزرگ است');const o=JSON.parse(raw);if(!Array.isArray(o.tasks)||o.tasks.length>500)throw Error('TASK_BOARD.json معتبر نیست');gather();const current=new Map(active.tasks.map(t=>[t.id,t]));let updated=0;for(const incoming of o.tasks){if(!incoming||typeof incoming.id!=='string')continue;const t=current.get(incoming.id);if(!t)continue;if(!Object.keys(taskStatusLabels).includes(incoming.status))continue;if(incoming.status==='done'&&!String(incoming.evidence||'').trim())continue;t.status=incoming.status;t.evidence=String(incoming.evidence||'').slice(0,6000);t.notes=String(incoming.notes||'').slice(0,6000);updated++;}if(!updated)throw Error('وظیفه مشابه معتبری پیدا نشد');markDirty();renderTasks();toast(`${updated} وضعیت از Task Board به‌روز شد. برای ثبت نهایی روی ذخیره کلیک کن.`)}catch(e){toast(e.message)}}
function generateTasks(){if(!active)return;gather();if(!active.requirements.length){toast('اول نیازمندی ثبت کن.');return}const existing=new Set(active.tasks.flatMap(t=>t.requirement_ids||[]));const missing=active.requirements.filter(r=>!existing.has(r.id));if(!missing.length){toast('همه نیازمندی‌ها وظیفه مرتبط دارند.');return}const nums=active.tasks.map(t=>Number((t.id||'').match(/^TASK-(\d+)$/)?.[1]||0));let n=Math.max(0,...nums)+1;for(const r of missing){active.tasks.push({id:'TASK-'+String(n++).padStart(3,'0'),title:r.title||r.id,description:r.text||'',phase:r.phase||'',status:'todo',priority:r.priority||'medium',owner:'agent',depends_on:[],requirement_ids:[r.id],acceptance:r.acceptance||'',evidence:'',notes:'پیشنهاد اولیه از نیازمندی؛ وابستگی‌ها را قبل از اجرا بازبینی کنید.'})}markDirty();renderTasks();toast(`${missing.length} وظیفه پیشنهادی ایجاد شد؛ قبل از خروجی بازبینی کن.`)}
function renderReview(){if(!active)return;$('stat-req').textContent=active.requirements.length;$('stat-ref').textContent=active.references.length;$('stat-missing').textContent=active.requirements.filter(r=>!r.acceptance?.trim()).length}
async function audit(){if(!active)return;if(dirty&&!(await save()))return;try{const r=await api(`/api/projects/${active.id}/audit`);$('audit-results').innerHTML=`<p>نتیجه: <b>${r.summary.blocker}</b> مانع · <b>${r.summary.warning}</b> هشدار · <b>${r.summary.info}</b> اطلاعیه</p>`+r.issues.map(x=>`<div class="audit-item ${esc(x.severity)}"><b>${esc(x.code)}</b>${esc(x.message)}<small>${esc(x.location)}</small></div>`).join('')+`<p class="hint">بررسی ساختاری؛ تشخیص تمام تعارض‌های معنایی یا تحلیل بصری تضمین نمی‌شود.</p>`}catch(e){toast(e.message)}}
function aiAudit(){if(active) switchTab('ai-review');}
let importUpdateId=null;
function openContractImport(project=null){
  importUpdateId=project?.id ?? null;
  $('import-heading').textContent=project?'به‌روزرسانی این پروژه با JSON':'ساخت پروژهٔ جدید از JSON';
  $('import-description').textContent=project
    ? `پروژهٔ مقصد: ${project.title}. نسخهٔ قبلی در تاریخچه می‌ماند.`
    : 'فایل JSON تولیدشده توسط مدل یا قالب استاندارد را وارد کن.';
  $('import-feedback').textContent='';
  $('import-file').value='';
  $('import-text').value='';
  $('import-dialog').showModal();
}
function importDialog(){ openContractImport(); }
$('update-open-project').onclick=()=>{ if(active) openContractImport(active); };

$('trash-open-project').onclick=async()=>{
  if(!active) return;
  if(dirty){ toast('پیش از حذف پروژه، تغییرات فعلی را ذخیره کنید.'); return; }
  const {id,title,version}=active;
  if(!confirm(`«${title}» به سطل زباله منتقل شود؟ می‌توانید آن را بازگردانید.`)) return;
  const button=$('trash-open-project');
  button.disabled=true;
  try {
    await api(`/api/projects/${id}/trash`,json('POST',{confirm:true,version}));
    if(active?.id===id){
      active=null;
      dirty=false;
      window.iwbOnProjectTrash?.();
    }
    await loadProjects();
    toast('پروژه به سطل زباله منتقل شد.');
  } catch(e) { toast(e.message); }
  finally { button.disabled=false; }
};

async function renderProjectTrash(){
  const status=$('trash-status'), list=$('trash-list');
  status.textContent='در حال بارگیری…';
  list.replaceChildren();
  try {
    const entries=await api('/api/trash');
    status.textContent=entries.length?'':'سطل زباله خالی است.';
    for(const entry of entries){
      const row=document.createElement('li');
      const title=document.createElement('bdi');
      title.textContent=entry.title;
      const restore=document.createElement('button');
      restore.type='button';
      restore.className='button secondary';
      restore.textContent='بازگردانی';
      restore.onclick=async()=>{
        restore.disabled=true;
        try {
          await api(`/api/projects/${entry.id}/restore`,json('POST',{confirm:true,deleted_at:entry.deleted_at}));
          await loadProjects();
          await renderProjectTrash();
          toast('پروژه بازگردانی شد.');
        } catch(e) {
          status.textContent=e.message;
          restore.disabled=false;
        }
      };
      row.append(title,' ',restore);
      list.append(row);
    }
  } catch(e) { status.textContent=e.message; }
}
$('open-trash').onclick=()=>{
  $('project-trash').showModal();
  void renderProjectTrash();
};
function describeUpdate(preview){
  const changes=preview.changes.map(change=>{
    const before=change.before===undefined?'':JSON.stringify(change.before).slice(0,250);
    const after=change.after===undefined?'':JSON.stringify(change.after).slice(0,250);
    return `${change.path}  ${before}${before?' → ':''}${after}`;
  });
  return [
    `${preview.title} · پیش‌نویس نسخهٔ ${preview.version}`,
    ...changes,
    ...preview.embedded_images.map(id=>`تصویر جاسازی‌شده: ${id}`),
    ...preview.warnings
  ].join('\n');
}
async function importJSON(){
  const button=$('do-import'), feedback=$('import-feedback');
  button.disabled=true;
  try {
    const raw=$('import-text').hidden ? await $('import-file').files[0]?.text() : $('import-text').value;
    if(!raw) throw Error('ابتدا فایل یا متن JSON را وارد کن.');
    if(raw.length>10_000_000) throw Error('فایل JSON بسیار بزرگ است.');
    const data=JSON.parse(raw);
    if(importUpdateId){
      const id=importUpdateId;
      if(active?.id!==id || dirty) throw Error('پیش از به‌روزرسانی، پروژه را باز و تغییرات فعلی را ذخیره کنید.');
      const url=`/api/projects/${id}/import-update`;
      const preview=await api(url+'/preview',json('POST',{contract:data}));
      if(preview.errors.length) throw Error([...preview.errors,...(preview.warnings||[])].join('\n'));
      const summary=describeUpdate(preview);
      feedback.textContent=summary;
      if(!confirm('به‌روزرسانی به‌عنوان پیش‌نویس ثبت شود؟\n'+summary.slice(0,3000))) return;
      if(active?.id!==id || dirty) throw Error('پروژه تغییر کرده است؛ دوباره پیش‌نمایش کنید.');
      const updated=await api(url,json('POST',{contract:data,digest:preview.digest,confirm:true}));
      $('import-dialog').close();
      await openProject(updated.id);
      toast(`پیش‌نویس نسخهٔ ${updated.version} ثبت شد. برای انتقال به پوشهٔ قبلی، «نصب در پوشه پروژه» را بزنید.`);
      return;
    }
    const preview=await api('/api/import/preview',json('POST',data));
    if(preview.errors.length) throw Error(preview.errors.join('\n'));
    feedback.textContent=JSON.stringify(preview,null,2);
    if(!confirm('پیش‌نمایش معتبر است. یک پروژهٔ پیش‌نویس جدید ساخته شود؟\n'+JSON.stringify(preview,null,2))) return;
    const p=await api('/api/import',json('POST',data));
    $('import-dialog').close();
    await openProject(p.id);
    toast('پروژه در حالت پیش‌نویس وارد شد.');
  } catch(e) {
    feedback.textContent=e.message;
  } finally {
    button.disabled=false;
  }
}
$('copy-extraction').onclick=async()=>{
  try {
    const kit=await api('/api/extraction-kit');
    await navigator.clipboard.writeText(kit.instructions);
    toast('پرامپت کپی شد');
  } catch(e) { $('import-feedback').textContent=e.message; }
};
function bind(){ $('new').onclick=$('empty-new').onclick=create;$('import-launch').onclick=$('empty-import').onclick=$('open-json').onclick=importDialog;$('template').onclick=$('template-modal').onclick=template;$('extraction-kit').onclick=async()=>{try{const kit=await api('/api/extraction-kit');const blob=new Blob([JSON.stringify(kit,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Intent_Workbench_AI_Extraction_Kit_v0.9.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('بسته مدل شامل قالب و بانک مهارت و نقش دانلود شد')}catch(e){toast(e.message)}};$('save').onclick=save;$('export').onclick=$('export-bottom').onclick=downloadContract;$('json-export').onclick=downloadJSON;$('add-req').onclick=addReq;$('add-screen').onclick=addScreen;$('add-journey').onclick=addJourney;$('add-task').onclick=addTask;$('auto-tasks').onclick=generateTasks;$('import-task-board').onclick=()=>$('task-board-file').click();$('task-board-file').onchange=async e=>{await importTaskBoard(e.target.files[0]);e.target.value=''};$('task-search').oninput=()=>{gather();renderTasks()};$('task-filter').onchange=()=>{gather();renderTasks()};$('add-ref').onclick=addRef;$('audit').onclick=audit;$('audit-ai').onclick=aiAudit;$('approved').onchange=markDirty;$('do-import').onclick=importJSON;$('import-file-tab').onclick=()=>{$('import-text').hidden=true;$('import-file').hidden=false};$('import-text-tab').onclick=()=>{$('import-file').hidden=true;$('import-text').hidden=false};for(const t of document.querySelectorAll('.tab'))t.onclick=()=>{gather();switchTab(t.dataset.tab)};for(const x of document.querySelectorAll('[data-field]'))x.addEventListener('input',markDirty);$('req-search').oninput=()=>{gather();renderReqs()};$('category-filter').onchange=$('policy-filter').onchange=()=>{gather();renderReqs()};$('file').onchange=e=>upload(e.target.files);$('drop').onclick=()=>$('file').click();$('drop').ondragover=e=>{e.preventDefault();$('drop').classList.add('drag')};$('drop').ondragleave=()=>$('drop').classList.remove('drag');$('drop').ondrop=e=>{e.preventDefault();e.stopPropagation();$('drop').classList.remove('drag');upload(e.dataTransfer.files)};window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue=''}})}
(function(){for(const [k,v] of Object.entries(categories))$('category-filter').insertAdjacentHTML('beforeend',`<option value="${k}">${v}</option>`);bind();loadProjects().catch(e=>toast(e.message))})();
