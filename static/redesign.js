/* Presentation-only navigation; original v0.5 project/API logic remains intact. */
(() => {
const $$ = (s) => [...document.querySelectorAll(s)];
const home = document.getElementById('home-dashboard');
const editor = document.getElementById('editor');
const header = document.querySelector('.header');
const empty = document.getElementById('empty');
const nav = $$('.side-item');
const pageNames={evidence:'Acceptance Evidence','ai-review':'AI Review',handoff:'Handoff Profiles',history:'Contract History',trace:'Traceability',home:'Overview',projects:'Projects',intent:'Project Intent',requirements:'Requirements',tasks:'Execution Plan',references:'References',visual:'Visual Intent',journeys:'User Journeys',bank:'Skill & Agent Roles',context:'Documentation',review:'Contract Review'};
function selectNav(page){nav.forEach(b=>b.classList.toggle('active',b.dataset.nav===page));document.getElementById('topbar-page').textContent=pageNames[page]||page;document.body.classList.remove('sidebar-open');}
function showHome(){if(typeof dirty!=='undefined'&&dirty&&!confirm('تغییرات ذخیره‌نشده داری. به داشبورد برگردی؟'))return;home.hidden=false;editor.hidden=true;empty.hidden=true;header.hidden=true;selectNav('home');refreshDashboard();}
function showEditorTab(page){if(typeof active==='undefined'||!active){showHome();window.toast?.('ابتدا یک پروژه بساز یا باز کن.');return;}home.hidden=true;header.hidden=false;editor.hidden=false;empty.hidden=true;if(typeof gather==='function')gather();if(typeof switchTab==='function')switchTab(page);selectNav(page)}
function refreshDashboard(){const pp=typeof projects==='undefined'?[]:projects;document.getElementById('home-project-count').textContent=pp.length;document.getElementById('home-active').textContent=typeof active!=='undefined'&&active?active.title:'—';document.getElementById('home-req-count').textContent=typeof active!=='undefined'&&active?active.requirements.length:'—';document.getElementById('home-review-count').textContent=pp.filter(p=>p.status==='approved').length;let list=document.getElementById('home-recent');list.innerHTML=pp.length?pp.slice(0,5).map((p,i)=>`<button class="recent-entry" data-home-project="${String(p.id).replace(/["<>]/g,'')}"><span class="recent-icon">${['▢','◇','▤','◎','▦'][i%5]}</span><span class="recent-text"><b>${typeof esc==='function'?esc(p.title):p.title}</b><small>${p.status==='approved'?'Approved contract':'Draft project'} · v${p.version||1}</small></span><span class="recent-chevron">›</span></button>`).join(''):'<div class="empty-recent">هنوز پروژه‌ای نداری. از «پروژه جدید» شروع کن.</div>';list.querySelectorAll('[data-home-project]').forEach(b=>b.onclick=async()=>{await openProject(b.dataset.homeProject);});}
nav.forEach(b=>b.addEventListener('click',()=>{let page=b.dataset.nav;if(page==='home'||page==='projects'){showHome();if(page==='projects')document.querySelector('.home-lower')?.scrollIntoView({behavior:'smooth',block:'start'});return;}showEditorTab(page)}));
$$('[data-home-action]').forEach(b=>b.addEventListener('click',()=>{let a=b.dataset.homeAction;if(a==='new')document.getElementById('new').click();else if(a==='import')document.getElementById('import-launch').click();else if(a==='templates')document.getElementById('template').click();else document.querySelector('.home-lower')?.scrollIntoView({behavior:'smooth'})}));
$$('[data-quick]').forEach(b=>b.addEventListener('click',()=>showEditorTab(b.dataset.quick)));
window.iwbOnProjectTrash=showHome;
window.iwbOnProjectOpen=()=>{home.hidden=true;header.hidden=false;editor.hidden=false;selectNav(currentTab);refreshDashboard();};
const oldSwitch=window.switchTab;window.switchTab=function(tab){oldSwitch(tab);selectNav(tab);};
// Existing listeners capture function declarations directly, so keep their behavior and reflect view state after clicks.
$$('.tab').forEach(b=>b.addEventListener('click',()=>selectNav(b.dataset.tab)));
const list=document.getElementById('project-list');
new MutationObserver(refreshDashboard).observe(list,{childList:true});
const search=document.getElementById('global-search');search.addEventListener('keydown',e=>{if(e.key==='Enter'){let q=search.value.trim().toLowerCase();if(!q)return;let item=(typeof projects==='undefined'?[]:projects).find(p=>p.title.toLowerCase().includes(q));if(item){openProject(item.id);return;}if(typeof active!=='undefined'&&active){showEditorTab('requirements');document.getElementById('req-search').value=search.value;renderReqs();}else window.toast?.('پروژه‌ای پیدا نشد.');}});
document.getElementById('mobile-menu').onclick=()=>document.body.classList.toggle('sidebar-open');
// Initial screen remains the dashboard, even for an empty workspace.
home.hidden=false;header.hidden=true;empty.hidden=true;editor.hidden=true;selectNav('home');refreshDashboard();
})();
