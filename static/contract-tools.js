const projectPath=(part, id=active.id)=>`/api/projects/${id}/${part}`;
const toolRenderers={};
window.loadContractTool=async name=>{
  if(!toolRenderers[name] || !active) return;
  const id=active.id;
  const status=$(name).querySelector('[data-tool-status]');
  if(!status) return toolRenderers[name](id);
  status.textContent='در حال بارگیری…';
  try {
    await toolRenderers[name](id);
    if(active?.id===id && currentTab===name) status.textContent='';
  } catch(e) {
    if(active?.id===id && currentTab===name) status.textContent=e.message;
  }
};
function toolAction(name, action){
  return async event=>{
    const control=event.currentTarget;
    control.disabled=true;
    const status=$(name).querySelector('[data-tool-status]');
    status.textContent='در حال پردازش…';
    try { status.textContent=await action() || ''; }
    catch(e) { status.textContent=e.message; }
    finally {
      if(control.id==='ai-send') control.disabled=!aiPreview;
      else if(control.id==='evidence-apply') control.disabled=!evidencePreview;
      else control.disabled=false;
    }
  };
}
const traceCollections={
  requirements:['requirements','req',renderReqs],
  screens:['visual','screen',renderScreens],
  references:['references','ref',renderRefs],
  tasks:['tasks','task',renderTasks],
  journeys:['journeys','journey',renderJourneys]
};
function jumpToContractItem(kind,id){
  const [tab,attribute,render]=traceCollections[kind];
  const index=active[kind].findIndex(item=>item.id===id);
  if(index<0) return;
  gather();
  if(kind==='requirements'){
    for(const field of ['req-search','category-filter','policy-filter']) $(field).value='';
    openReq.add(id);
  }
  if(kind==='tasks') for(const field of ['task-search','task-filter']) $(field).value='';
  switchTab(tab);
  render();
  const target=document.querySelector(`[data-${attribute}-index="${index}"]`);
  if(target){
    target.tabIndex=-1;
    target.focus();
    target.scrollIntoView({block:'start'});
  }
}
toolRenderers.trace=async id=>{
  const report=await api(projectPath('traceability',id));
  if(active?.id!==id || currentTab!=='trace') return;
  const result=$('trace-result');
  const order=['screens','references','tasks','journeys'];
  const captions=['صفحه','مرجع','وظیفه','مسیر تست'];
  const link=(kind,key)=>`<button class="mini" data-trace-kind="${kind}" data-trace-id="${esc(key)}"><bdi>${esc(key)}</bdi></button>`;
  const draw=()=>{
    const query=$('trace-search').value.toLowerCase();
    const gap=$('trace-gap').value, group=$('trace-group').value;
    const rows=report.rows.filter(row=>
      `${row.id} ${row.title}`.toLowerCase().includes(query) &&
      (!gap || row.gaps.includes(gap)) && (!group || row.coverage===group));
    const orderBy=$('trace-sort').value;
    rows.sort((a,b)=> orderBy==='gaps' ? b.gaps.length-a.gaps.length || a.id.localeCompare(b.id)
      : a[orderBy].localeCompare(b[orderBy],undefined,{numeric:true}));
    const body=rows.map(row=>`<tr><th scope="row">${link('requirements',row.id)} ${esc(row.title)}</th>
      ${order.map(kind=>`<td>${row.links[kind].map(key=>link(kind,key)).join(' ') || '—'}</td>`).join('')}
      <td>${row.gaps.includes('acceptance')?'—':`<details><summary>مشاهده</summary>${esc(row.acceptance)}</details>`}</td>
      <td>${{complete:'کامل',partial:'ناقص',missing:'بدون پوشش'}[row.coverage]}</td></tr>`).join('');
    result.innerHTML=(dirty?'<p class="hint">جدول بر اساس آخرین ذخیره است.</p>':'')+
      (body?`<div class="tool-scroll" role="region" aria-label="جدول ردیابی" tabindex="0"><table><thead><tr><th scope="col">نیازمندی</th>${captions.map(c=>`<th scope="col">${c}</th>`).join('')}<th scope="col">پذیرش</th><th scope="col">پوشش</th></tr></thead><tbody>${body}</tbody></table></div>`:'<p>نیازمندی مطابق فیلتر وجود ندارد.</p>')+
      (report.issues.length?`<h3>پیوندهای نیازمند بررسی</h3><ul>${report.issues.map(issue=>`<li>${link(issue.kind,issue.id)} <bdi>${esc(issue.message)}</bdi></li>`).join('')}</ul>`:'');
    result.querySelectorAll('[data-trace-kind]').forEach(button=>{
      button.onclick=()=>jumpToContractItem(button.dataset.traceKind,button.dataset.traceId);
    });
  };
  $('trace-search').oninput=draw;
  $('trace-sort').onchange=$('trace-gap').onchange=$('trace-group').onchange=draw;
  draw();
};
toolRenderers.history=async id=>{
  const rows=await api(projectPath('history',id));
  if(active?.id!==id || currentTab!=='history') return;
  const options=rows.map(row=>`<option value="${row.id}">${esc(row.label)}</option>`).join('');
  $('history-from').innerHTML=options;
  $('history-to').innerHTML='<option value="current">نسخه جاری</option>'+options;
  $('history-list').innerHTML=rows.length?`<ul>${rows.map(row=>`<li><bdi>${esc(row.label)} · ${esc(row.timestamp)} · ${row.hash.slice(0,12)}</bdi> ${esc(row.notes)} <button class="mini" data-snapshot="${row.id}">حذف نسخه</button></li>`).join('')}</ul>`:'<p>هنوز نسخه‌ای ثبت نشده است.</p>';
  $('history-diff').replaceChildren();
  $('history-compare').disabled=$('history-restore').disabled=!rows.length;
  $('history-list').querySelectorAll('[data-snapshot]').forEach(button=>{
    button.onclick=toolAction('history',async()=>{
      if(!confirm('این نسخه از تاریخچه حذف شود؟')) return;
      await api(projectPath('history/remove',id),json('POST',{id:button.dataset.snapshot,confirm:true}));
      await toolRenderers.history(id);
    });
  });
};
$('history-create').onclick=toolAction('history',async()=>{
  const id=active.id;
  if(dirty && !await save()) return;
  await api(projectPath('history',id),json('POST',{label:$('history-label').value,notes:$('history-notes').value}));
  await toolRenderers.history(id);
  return 'نسخه ثبت شد.';
});
$('history-backup').onclick=toolAction('history',async()=>{
  if(!confirm('پشتیبان شامل داده‌های خصوصی پروژه است. دانلود شود؟')) return;
  downloadBlob(await api(projectPath('history/backup')),'intent-history-backup.zip');
});
async function showDiff(to){
  const from=$('history-from').value, id=active.id;
  const params=new URLSearchParams({from,to});
  const report=await api(projectPath('history/diff?'+params,id));
  if(active?.id!==id || currentTab!=='history') return null;
  const target=$('history-diff');
  target.replaceChildren();
  if(report.missing_assets.length){
    const warning=document.createElement('p');
    warning.textContent='تصویر ناموجود: '+report.missing_assets.join(', ');
    target.append(warning);
  }
  if(!report.changes.length) target.append('تغییر معنایی پیدا نشد.');
  for(const change of report.changes){
    const details=document.createElement('details'), heading=document.createElement('summary');
    const pre=document.createElement('pre');
    heading.textContent=change.type+' '+change.path;
    heading.dir=pre.dir='ltr';
    pre.textContent=JSON.stringify(change,null,2);
    details.append(heading,pre);
    target.append(details);
  }
  return {from,report,id};
}
$('history-compare').onclick=toolAction('history',async()=>{ await showDiff($('history-to').value); });
$('history-restore').onclick=toolAction('history',async()=>{
  if(dirty) throw Error('ابتدا تغییرات فعلی را ذخیره کنید.');
  const preview=await showDiff('current');
  if(!preview) return;
  const status=$('history').querySelector('[data-tool-status]');
  status.textContent='';
  const apply=document.createElement('button');
  apply.className='button primary';
  apply.textContent='تأیید بازیابی';
  const explanation=document.createElement('p');
  explanation.textContent='بازیابی، یک نسخه جدید در حالت پیش‌نویس می‌سازد.';
  $('history-diff').prepend(explanation,apply);
  apply.onclick=toolAction('history',async()=>{
    if(active?.id!==preview.id || dirty) throw Error('پروژه یا پیش‌نویس تغییر کرده است. دوباره پیش‌نمایش کنید.');
    await api(projectPath('history/restore',preview.id),json('POST',{id:preview.from,version:preview.report.version,confirm:true}));
    await openProject(preview.id);
    switchTab('history');
    return 'نسخهٔ جدید بازیابی شد.';
  });
});
let handoffPreview;
toolRenderers.handoff=async id=>{
  handoffPreview=null;
  $('handoff-export').disabled=true;
  $('handoff-manifest').replaceChildren();
  if(dirty) throw Error('برای ساخت پیش‌نمایش، ابتدا پروژه را ذخیره کنید.');
  const profile=$('handoff-profile').value;
  const query=new URLSearchParams({profile});
  const manifest=await api(projectPath('handoff?'+query,id));
  if(active?.id!==id || currentTab!=='handoff' || $('handoff-profile').value!==profile) return;
  handoffPreview={id,profile,version:manifest.version};
  $('handoff-manifest').innerHTML=`<p><bdi>${esc(manifest.profile)} · v${manifest.version} · Schema ${esc(manifest.schema_version)} · ${esc(manifest.status)}</bdi></p>
    <p dir="auto">${esc(manifest.scope)}</p>
    <ul>${manifest.warnings.map(w=>`<li dir="auto">${esc(w)}</li>`).join('')}</ul>
    <h3>وضعیت تصاویر</h3><ul>${manifest.images.map(img=>`<li><bdi>${esc(img.id)} · ${esc(img.status)}</bdi></li>`).join('')}</ul>
    <h3>فایل‌های بسته</h3><ul>${manifest.files.map(file=>`<li><bdi>${esc(file)}</bdi></li>`).join('')}</ul>`;
  $('handoff-export').disabled=false;
};
$('handoff-profile').onchange=()=>loadContractTool('handoff');
$('handoff-export').onclick=toolAction('handoff',async()=>{
  const preview=handoffPreview;
  if(!preview || preview.id!==active.id || preview.profile!==$('handoff-profile').value || dirty || preview.version!==active.version){
    throw Error('پروژه تغییر کرده است. پیش‌نمایش را دوباره باز کنید.');
  }
  const query=new URLSearchParams({profile:preview.profile,version:preview.version});
  downloadBlob(await api(projectPath('export?'+query,preview.id)),`intent-${preview.profile}.zip`);
});
let aiPreview, aiReports=[], aiPreviewGeneration=0;
function clearAiPreview(){
  aiPreview=null;
  aiPreviewGeneration++;
  $('ai-send').disabled=true;
  $('ai-preview-details').hidden=true;
  $('ai-preview-data').textContent='';
}
function drawAiReport(report){
  const root=$('ai-report');
  root.replaceChildren();
  if(!report) return;
  root.innerHTML=`<p dir="auto">${esc(report.model)} · ${esc(report.timestamp)} · v${report.version} · ${report.weighted_score ?? 'N/A'}</p>
  <dl>${Object.entries(report.ratings).map(([name,r])=>`<dt dir="auto">${esc(name)} · ${r.score ?? 'N/A'} · وزن ${r.weight}</dt><dd dir="auto">${esc(r.reason)}</dd>`).join('')}</dl>
  <ul>${report.visual.map(r=>`<li><bdi>${esc(r.id)} · ${esc(r.status)}</bdi></li>`).join('')}</ul>
  <ul>${report.limitations.map(note=>`<li dir="auto">${esc(note)}</li>`).join('')}</ul>
  ${report.findings.map((f,i)=>`<article class="audit-item"><bdi>${esc(f.id)} · ${esc(f.severity)} · ${esc(f.decision)}</bdi><p dir="auto">${esc(f.detail)}</p><p dir="auto">${esc(f.recommendation)}</p><button class="mini" data-review-decision="draft" data-index="${i}">ثبت پیشنهاد پیش‌نویس</button> <button class="mini" data-review-decision="rejected" data-index="${i}">رد پیشنهاد</button></article>`).join('')}`;
  const project=active.id;
  root.querySelectorAll('[data-review-decision]').forEach(button=>{
    button.onclick=toolAction('ai-review',async()=>{
      const updated=await api(projectPath('ai-review/decision',project),json('POST',{
        id:report.id,index:Number(button.dataset.index),decision:button.dataset.reviewDecision
      }));
      if(active?.id!==project || currentTab!=='ai-review') return;
      aiReports=aiReports.map(row=>row.id===updated.id?updated:row);
      drawAiReport(updated);
    });
  });
}
toolRenderers['ai-review']=async id=>{
  clearAiPreview();
  $('ai-preview').disabled=true;
  $('ai-report').replaceChildren();
  const data=await api(projectPath('ai-review',id));
  if(active?.id!==id || currentTab!=='ai-review') return;
  $('ai-provider').textContent=data.enabled?`${data.model} · ${data.endpoint}`:'AI غیرفعال است. IW_AI_API_KEY و IW_AI_MODEL را روی سرور تنظیم کنید.';
  const fields=$('ai-redactions');
  fields.querySelectorAll('label').forEach(label=>label.remove());
  fields.insertAdjacentHTML('beforeend',data.fields.map(name=>`<label><input type="checkbox" value="${esc(name)}" ${['bank','notes','conflicts'].includes(name)?'checked':''}> <bdi>${esc(name)}</bdi></label>`).join(''));
  $('ai-images').innerHTML=active.references.map(ref=>`<label><input type="checkbox" value="${esc(ref.id)}" ${ref.filename?'':'disabled'}> <bdi>${esc(ref.id)} ${esc(ref.name || '')}</bdi> ${ref.filename?'':'(بررسی‌نشده)'}</label>`).join('');
  $('ai-weights').querySelectorAll('label').forEach(label=>label.remove());
  $('ai-weights').insertAdjacentHTML('beforeend',data.dimensions.map(name=>`<label><bdi>${esc(name)}</bdi><input type="number" min="0" max="100" value="1" data-dimension="${esc(name)}"></label>`).join(''));
  $('ai-vision').checked=false;
  $('ai-preview').disabled=!data.enabled;
  aiReports=data.reports;
  $('ai-reports').innerHTML='<option value="">انتخاب گزارش</option>'+aiReports.map((report,i)=>`<option value="${i}">${esc(report.timestamp)} · ${esc(report.model)} · v${report.version}</option>`).join('');
  if(aiReports.length){ $('ai-reports').value='0'; drawAiReport(aiReports[0]); }
};
$('ai-reports').onchange=()=>drawAiReport(aiReports[$('ai-reports').value]);
$('ai-review').addEventListener('input',event=>{
  if(event.target.matches('input')) clearAiPreview();
});
$('ai-preview').onclick=toolAction('ai-review',async()=>{
  clearAiPreview();
  if(dirty) throw Error('ابتدا پروژه را ذخیره کنید.');
  const id=active.id;
  const options={
    redact:[...$('ai-redactions').querySelectorAll('input:checked')].map(input=>input.value),
    images:[...$('ai-images').querySelectorAll('input:checked')].map(input=>input.value),
    vision:$('ai-vision').checked,
    weights:Object.fromEntries([...$('ai-weights').querySelectorAll('input')].map(input=>[input.dataset.dimension,input.valueAsNumber]))
  };
  const generation=aiPreviewGeneration;
  const preview=await api(projectPath('ai-review/preview',id),json('POST',options));
  if(active?.id!==id || currentTab!=='ai-review' || generation!==aiPreviewGeneration) return;
  aiPreview={id,options,digest:preview.digest};
  $('ai-preview-data').textContent=JSON.stringify({endpoint:preview.endpoint,model:preview.model,
    instruction:preview.instruction,images:preview.images,contract:preview.contract},null,2);
  $('ai-preview-details').hidden=false;
  $('ai-preview-details').open=true;
  $('ai-send').disabled=false;
});
$('ai-send').onclick=toolAction('ai-review',async()=>{
  const preview=aiPreview;
  if(!preview || preview.id!==active.id || dirty) throw Error('پیش‌نمایش را دوباره بسازید.');
  if(!confirm('متن و تصاویر نمایش‌داده‌شده به ارائه‌دهنده ارسال شوند؟')) return;
  const report=await api(projectPath('ai-review',preview.id),json('POST',{
    ...preview.options,digest:preview.digest,consent:true
  }));
  if(active?.id!==preview.id || currentTab!=='ai-review') return;
  await toolRenderers['ai-review'](preview.id);
  drawAiReport(report);
  return 'گزارش مشورتی دریافت شد.';
});
let evidencePreview;
function clearEvidencePreview(){
  evidencePreview=null;
  $('evidence-apply').disabled=true;
  $('evidence-preview-details').hidden=true;
  $('evidence-preview-data').textContent='';
}
function evidenceQuery(){
  return new URLSearchParams({requirement_id:$('evidence-req').value.trim(),status:$('evidence-status').value,
    source:$('evidence-source').value.trim(),type:$('evidence-type').value.trim(),timestamp:$('evidence-date').value});
}
toolRenderers.evidence=async id=>{
  const report=await api(projectPath('evidence?'+evidenceQuery(),id));
  if(active?.id!==id || currentTab!=='evidence') return;
  const documented=report.coverage.filter(row=>row.coverage==='reported').length;
  $('evidence-summary').textContent=`گزارش نتیجه برای ${documented} از ${report.coverage.length} نیازمندی ثبت شده است (کل پروژه).`;
  $('evidence-batches').innerHTML=report.batches.map(batch=>`<li><bdi>${batch.id} · ${esc(batch.timestamp)} · v${batch.version}</bdi></li>`).join('') || '<li>هنوز گزارشی وارد نشده است.</li>';
  const rows=report.rows.map(row=>`<tr><th scope="row"><bdi>${esc(row.requirement_ids.join(', ') || '—')}</bdi></th><td><bdi>${esc(row.journey_id || '—')} ${esc((row.task_ids || []).join(', '))}</bdi></td><td><bdi>${esc(row.status)}${row.reported_status && row.status!==row.reported_status ? ` (reported ${esc(row.reported_status)})`:''}</bdi></td><td dir="auto">${esc(row.source || row.tester || '—')}</td><td><bdi>${esc(row.timestamp || '—')}</bdi></td><td dir="auto">${esc(row.type || '—')}</td><td dir="auto">${esc(row.description || '')} <bdi>${esc(row.artifact || '')}</bdi></td></tr>`).join('');
  $('evidence-report').innerHTML=rows?`<div class="tool-scroll" role="region" aria-label="جدول شواهد" tabindex="0"><table><thead><tr>${['نیازمندی','مسیر و وظیفه','وضعیت ثبت‌شده','منبع','زمان','نوع','مشاهده و مدرک'].map(label=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`:'<p>نتیجه‌ای مطابق فیلتر وجود ندارد.</p>';
};
$('evidence-file').onchange=clearEvidencePreview;
$('evidence-preview').onclick=toolAction('evidence',async()=>{
  clearEvidencePreview();
  if(dirty) throw Error('ابتدا قرارداد را ذخیره کنید.');
  const file=$('evidence-file').files[0], id=active.id;
  if(!file || file.size>2*1024*1024) throw Error('فایل JSON یا CSV تا ۲ مگابایت انتخاب کنید.');
  const input={format:file.name.split('.').pop().toLowerCase(),text:await file.text()};
  const result=await api(projectPath('evidence/preview',id),json('POST',input));
  if(active?.id!==id || currentTab!=='evidence' || $('evidence-file').files[0]!==file) return;
  $('evidence-preview-data').textContent=JSON.stringify(result,null,2);
  $('evidence-preview-details').hidden=false;
  $('evidence-preview-details').open=true;
  if(result.errors.length) return 'خطاهای فایل را اصلاح کنید.';
  evidencePreview={id,input,digest:result.digest};
  $('evidence-apply').disabled=false;
});
$('evidence-apply').onclick=toolAction('evidence',async()=>{
  const preview=evidencePreview;
  if(!preview || preview.id!==active.id || dirty) throw Error('پیش‌نمایش جدید لازم است.');
  const result=await api(projectPath('evidence/apply',preview.id),json('POST',{
    ...preview.input,digest:preview.digest,confirm:true
  }));
  clearEvidencePreview();
  await toolRenderers.evidence(preview.id);
  return result.duplicate?'این گزارش قبلاً وارد شده است.':`${result.count} نتیجه وارد شد.`;
});
$('evidence-filter').onclick=()=>loadContractTool('evidence');
$('evidence-export').onclick=toolAction('evidence',async()=>{
  if(!confirm('گزارش می‌تواند حاوی شواهد خصوصی باشد. گزارش فیلترشده دانلود شود؟')) return;
  const format=$('evidence-format').value, query=evidenceQuery();
  query.set('format',format);
  downloadBlob(await api(projectPath('evidence?'+query)),`acceptance-coverage.${format}`);
});
toolRenderers.intent=async id=>{
  const status=$('overview-checks');
  status.textContent='در حال بارگیری آخرین وضعیت ذخیره‌شده…';
  try {
    const [audit,history]=await Promise.all([api(projectPath('audit',id)),api(projectPath('history',id))]);
    if(active?.id!==id || currentTab!=='intent') return;
    const last=history[0];
    status.textContent=`Preflight ذخیره‌شده · ${audit.summary.blocker} مانع · ${audit.summary.warning} هشدار · ${last ? 'آخرین نسخه: '+last.label : 'بدون نسخهٔ ثبت‌شده'}`;
  } catch(e) {
    if(active?.id===id && currentTab==='intent') status.textContent=e.message;
  }
};
document.querySelectorAll('[data-tool-link]').forEach(button=>{
  button.onclick=()=>{ gather(); switchTab(button.dataset.toolLink); };
});
