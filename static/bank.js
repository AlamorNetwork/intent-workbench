/* Intent Workbench v0.5: local, non-executable instructions catalog. */
(() => {
  const safe = s => esc(s ?? '');
  const docNames=['BASE_DOCUMENTATION.md','IMPLEMENTATION_NOTES.md','DESIGN_GUIDELINES.md','SECURITY_NOTES.md','AGENT_HANDOFF.md'];
  let catalog={roles:[],skills:[]};
  let importedRoles=[];
  const current=()=>{if(!active)return null;active.bank ||= {skills:[],roles:[],documents:{}};active.bank.skills ||= [];active.bank.roles ||= [];active.bank.documents ||= {};return active.bank};
  const validId=x=>/^[a-z][a-z0-9-]{1,62}$/.test(x);
  function optionsFor(type){const base=type==='roles'?catalog.roles:catalog.skills;return [...base,...(type==='roles'?importedRoles:[])].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i)}
  window.renderBank=()=>{
    const bank=current();if(!bank)return;
    const q=(document.getElementById('bank-search')?.value||'').toLowerCase();
    for(const type of ['skills','roles']){
      const selected=bank[type];const found=new Map([...optionsFor(type),...selected].map(v=>[v.id,v]));
      const list=[...found.values()].filter(v=>`${v.name} ${v.id} ${v.category} ${v.description}`.toLowerCase().includes(q));
      const target=document.getElementById(type==='skills'?'skill-catalog':'role-catalog');if(!target)continue;
      target.innerHTML=list.map(v=>`<div class="bank-entry"><label><input type="checkbox" data-bank-type="${type}" data-bank-id="${safe(v.id)}" ${selected.some(x=>x.id===v.id)?'checked':''}> <strong>${safe(v.name||v.id)}</strong></label><small>${safe(v.category||'other')} · ${safe(v.description||'')}</small>${selected.some(x=>x.id===v.id)?`<button class="mini" data-bank-edit="${type}" data-bank-edit-id="${safe(v.id)}">ویرایش</button>`:''}</div>`).join('')||'<p class="hint">نتیجه‌ای پیدا نشد.</p>';
    }
    const el=document.getElementById('bank-documents');
    if(el)el.innerHTML=docNames.map(name=>`<details class="bank-document"><summary>${safe(name)} <span class="hint">${bank.documents[name]?'دارای محتوا':'خالی'}</span></summary><textarea rows="8" data-bank-doc="${name}" placeholder="متن Markdown سند…">${safe(bank.documents[name]||'')}</textarea><button data-bank-clear="${name}" class="button subtle">پاک کردن محتوا</button>${name==='BASE_DOCUMENTATION.md'?'<button class="button secondary" id="bank-load-playbook">بارگذاری Playbook پایه</button>':''}</details>`).join('');
    document.querySelectorAll('[data-bank-type]').forEach(cb=>cb.onchange=()=>{
      const b=current(),type=cb.dataset.bankType,id=cb.dataset.bankId;
      if(cb.checked){const item=[...optionsFor(type),...b[type]].find(x=>x.id===id);if(item&&!b[type].some(x=>x.id===id))b[type].push({...item});}
      else b[type]=b[type].filter(x=>x.id!==id);
      markDirty();window.renderBank();
    });
    document.querySelectorAll('[data-bank-edit]').forEach(btn=>btn.onclick=()=>{
      const b=current(),entry=b[btn.dataset.bankEdit].find(x=>x.id===btn.dataset.bankEditId);if(!entry)return;
      const name=prompt('نام نمایشی:',entry.name);if(name===null)return;const desc=prompt('توضیح وظیفه:',entry.description);if(desc===null)return;
      entry.name=name.slice(0,160);entry.description=desc.slice(0,1500);
      if(btn.dataset.bankEdit==='skills'){const content=prompt('محتوای دستورالعمل Skill:',entry.content||'');if(content!==null)entry.content=content.slice(0,18000);}
      markDirty();window.renderBank();
    });
    document.querySelectorAll('[data-bank-doc]').forEach(area=>area.oninput=()=>{current().documents[area.dataset.bankDoc]=area.value;markDirty()});
    document.querySelectorAll('[data-bank-clear]').forEach(btn=>btn.onclick=()=>{if(!confirm('محتوای این سند پاک شود؟'))return;delete current().documents[btn.dataset.bankClear];markDirty();window.renderBank()});
    const load=document.getElementById('bank-load-playbook');if(load)load.onclick=async()=>{try{const d=await api('/api/bank/playbook');if(!d.available)throw Error('Playbook موجود نیست');current().documents['BASE_DOCUMENTATION.md']=d.text;markDirty();window.renderBank();toast('Playbook پایه وارد شد')}catch(e){toast(e.message)}};
  };
  async function fetchCatalog(){try{catalog=await api('/api/bank/catalog');window.renderBank();toast('بانک نمونه بارگذاری شد')}catch(e){toast(e.message)}}
  function addCustom(type){if(!active)return;const id=(prompt('شناسه انگلیسی کوتاه (مثلاً custom-ui-review):')||'').trim().toLowerCase();if(!id)return;if(!validId(id)){toast('شناسه نامعتبر است');return}if(current()[type].some(x=>x.id===id)){toast('شناسه تکراری است');return}const name=(prompt('نام نقش یا Skill:',id)||id).slice(0,160);const desc=(prompt('توضیح کاربرد:',name)||'').slice(0,1500);const item={id,name,description:desc,category:'custom',source:'user'};if(type==='skills')item.content=(prompt('متن دستورات Skill:',desc)||'').slice(0,18000);current()[type].push(item);markDirty();window.renderBank()}
  function normalizeExternalCatalog(data){
    // Supports root arrays, {roles:[...]}, or 200-agent catalog with nested items.
    const arr=Array.isArray(data)?data:Array.isArray(data.roles)?data.roles:Array.isArray(data.agents)?data.agents:Array.isArray(data.items)?data.items:[];
    return arr.filter(x=>x&&typeof x==='object').slice(0,300).map(x=>{
      const raw=String(x.id||x.slug||x.key||x.name||'').toLowerCase();const clean=raw.replace(/[^a-z0-9-]/g,'-');
      let first=0,last=clean.length;
      while(first<last && clean[first]==='-') first++;
      while(last>first && clean[last-1]==='-') last--;
      const id=clean.slice(first,Math.min(last,first+63));
      return {id,name:String(x.nameEn||x.name||x.title||id).slice(0,160),category:String(x.domain||x.category||'external').slice(0,80),description:String(x.descriptionEn||x.description||x.summary||x.role||'Imported specialist role').slice(0,1500),source:'imported-catalog'}
    }).filter(x=>validId(x.id));
  }
  async function importRoles(file){try{if(!file)return;const data=JSON.parse(await file.text());const roles=normalizeExternalCatalog(data);if(!roles.length)throw Error('فرمت نقش‌ها شناسایی نشد. آرایه JSON یا roles/items لازم است.');importedRoles=roles;window.renderBank();toast(`${roles.length} نقش در بانک موقت بارگذاری شد؛ برای خروجی موارد موردنظر را انتخاب کن`)}catch(e){toast(e.message)}}
  document.getElementById('bank-sync').onclick=fetchCatalog;
  document.getElementById('bank-search').oninput=()=>window.renderBank();
  document.getElementById('bank-add-skill').onclick=()=>addCustom('skills');
  document.getElementById('bank-add-role').onclick=()=>addCustom('roles');
  document.getElementById('bank-import-roles').onclick=()=>document.getElementById('bank-catalog-file').click();
  document.getElementById('bank-catalog-file').onchange=e=>importRoles(e.target.files[0]);
  async function installInProject(){
    if(!active)return;
    if(typeof window.showDirectoryPicker!=='function'){
      toast('این مرورگر انتخاب پوشه را پشتیبانی نمی‌کند؛ خروجی ZIP را استخراج کن.');return;
    }
    if(dirty && !(await save()))return;
    if(!confirm('فایل‌های قرارداد و Skillهای انتخابی در پوشه‌ای که انتخاب می‌کنی نصب شوند؟ فایل‌های موجود پیش از جایگزینی بکاپ خواهند شد.'))return;
    try{
      const destination=await window.showDirectoryPicker({mode:'readwrite'});
      const manifest=await api(`/api/projects/${active.id}/install-manifest`);
      if(manifest.status!=='approved'&&!confirm('قرارداد هنوز Draft است. نصب همین نسخه پیش‌نویس انجام شود؟'))return;
      if(manifest.files.length>200)throw Error('تعداد فایل‌ها زیاد است؛ از ZIP استفاده کن');
      const timestamp=`update-v${manifest.version}-${new Date().toISOString().replace(/[:.]/g,'-')}`;
      let installed=0,backedUp=0;
      async function locate(root,parts){let cur=root;for(const part of parts)cur=await cur.getDirectoryHandle(part,{create:true});return cur}
      async function existingFile(dir,name){try{return await dir.getFileHandle(name,{create:false})}catch(e){if(e.name==='NotFoundError')return null;throw e}}
      for(const item of manifest.files){
        const parts=item.path.split('/');if(parts.some(x=>!x||x==='.'||x==='..'))throw Error('Invalid package path');
        const filename=parts.pop();const dir=await locate(destination,parts);
        const previous=await existingFile(dir,filename);
        if(previous){
          const backups=await locate(destination,['.intent-workbench-backups',timestamp,...parts]);
          const backupFile=await backups.getFileHandle(filename,{create:true});
          const w=await backupFile.createWritable();await w.write(await (await previous.getFile()).arrayBuffer());await w.close();backedUp++;
        }
        const bytes=Uint8Array.from(atob(item.data),c=>c.charCodeAt(0));
        const target=await dir.getFileHandle(filename,{create:true});const writable=await target.createWritable();await writable.write(bytes);await writable.close();installed++;
      }
      toast(`${installed} فایل نصب شد؛ ${backedUp} نسخه پشتیبان ساخته شد.`);
    }catch(e){if(e.name==='AbortError')return;toast('نصب متوقف شد: '+e.message)}
  }
  document.getElementById('install-project').onclick=installInProject;
  void fetchCatalog();
})();
