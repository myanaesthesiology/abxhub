'use strict';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const slug = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const uniq = arr => [...new Set(arr.filter(Boolean))];

const state = {
  db:null, nag:null, nav:'home', mode:localStorage.getItem('abx-mode') || 'icu',
  theme:localStorage.getItem('abx-theme') || (matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),
  favorites:JSON.parse(localStorage.getItem('abx-favorites')||'[]'),
  recent:JSON.parse(localStorage.getItem('abx-recent')||'[]'),
  lastView:null, installPrompt:null
};

function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),1800); }
function applyTheme(){ document.documentElement.dataset.theme=state.theme; localStorage.setItem('abx-theme',state.theme); }
function applyMode(){
  localStorage.setItem('abx-mode',state.mode);
  $$('#standardMode,#icuMode').forEach(b=>b.classList.toggle('active',b.dataset.mode===state.mode));
}
function navActive(){ $$('.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.nav===state.nav)); }

function modeLens(){
  return state.mode==='icu'
    ? '<div class="notice good mode-lens"><b>ICU lens active.</b> Critical-illness dosing, loading dose, RRT, PK/PD, TDM, MDR risk and stewardship modifiers are prioritised where structured data are available.</div>'
    : '<div class="notice mode-lens"><b>Standard lens.</b> Core indication and usual regimen are prioritised. Switch to ICU for critical-illness modifiers.</div>';
}
function nagMatches(entity, limit=4){
  if(!state.nag?.topics?.length || !entity) return [];
  const terms=uniq([entity.name,entity.category,entity.class,...(entity.aliases||[])]).map(slug).filter(x=>x.length>3);
  return state.nag.topics.map(x=>{
    const hay=slug(`${x.title} ${x.section}`); let score=0;
    terms.forEach(t=>{ if(hay===t)score=Math.max(score,100); else if(hay.includes(t)||t.includes(hay))score=Math.max(score,70); else {const ts=t.split(' ').filter(z=>z.length>3);score=Math.max(score,ts.filter(z=>hay.includes(z)).length*12);} });
    return {...x,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function currentNagLinks(entity){
  const hits=nagMatches(entity);
  if(!hits.length) return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Current NAG</h3>${sourcePill('nag')}</div><p class="small muted">Official MOH NAG is online-only and periodically updated. Open the live topic before applying a recommendation.</p><div class="list">${hits.map(x=>`<a class="list-row" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(x.title)}</strong><small>${esc(x.section)}</small></div><span class="chev">↗</span></a>`).join('')}</div></div>`;
}

// IndexedDB cache: JSON datasets are fetched normally, then copied locally. If a network/cache fetch fails,
// the application can still load the last successful structured dataset from IndexedDB.
function idbOpen(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open('abx-critical-db',1);
    r.onupgradeneeded=()=>{ if(!r.result.objectStoreNames.contains('datasets')) r.result.createObjectStore('datasets'); };
    r.onsuccess=()=>resolve(r.result); r.onerror=()=>reject(r.error);
  });
}
async function idbSet(key,val){ try{const db=await idbOpen(); const tx=db.transaction('datasets','readwrite'); tx.objectStore('datasets').put(val,key); await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});db.close();}catch(e){} }
async function idbGet(key){ try{const db=await idbOpen(); const tx=db.transaction('datasets','readonly'); const r=tx.objectStore('datasets').get(key); const v=await new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});db.close();return v;}catch(e){return null;} }
async function loadDataset(url,key){
  try{
    const res=await fetch(url,{cache:'no-cache'}); if(!res.ok) throw new Error('HTTP '+res.status); const data=await res.json(); idbSet(key,data); return data;
  }catch(e){
    const cached=await idbGet(key); if(cached) return cached; throw e;
  }
}

function source(id){ return state.db.sources[id] || {id,name:id,short:id.toUpperCase()}; }
function sourcePill(id){
  const s=source(id); const cls=id==='hpusm'?'local':id==='nag'?'nag':id==='msidc'?'mdr':id==='msic'?'icu':'';
  return `<button class="pill ${cls}" data-source="${esc(id)}">${esc(s.short)} · ${esc(s.name)}</button>`;
}
function refText(r){
  if(!r) return '';
  const s=source(r.source); let p='';
  if(r.page) p+=` · p.${esc(r.page)}`;
  if(r.pdfPage && r.pdfPage!==r.page) p+=` (PDF ${esc(r.pdfPage)})`;
  return `${esc(s.name)}${p}`;
}
function openSource(id, ref={}){
  const s=source(id); const live=ref.url || s.url;
  openModal(s.name, `
    <div class="tag-row">${sourcePill(id)}${s.year?`<span class="pill">${esc(s.year)}</span>`:''}</div>
    <h3 style="margin-bottom:4px">${esc(s.full||s.name)}</h3>
    <p class="small muted">${esc(s.note||'')}</p>
    ${ref.page?`<div class="notice"><b>Referenced location</b><br>Page ${esc(ref.page)}${ref.pdfPage?` · PDF page ${esc(ref.pdfPage)}`:''}</div>`:''}
    ${id==='nag'?`<div class="notice warn"><b>Current-source rule:</b> NAG is maintained online. The live MOH page should be checked before applying a recommendation.</div>`:''}
    ${live?`<div class="btn-row"><a class="primary-btn" href="${esc(live)}" target="_blank" rel="noopener">Open live source ↗</a></div>`:''}
    ${!live && id!=='nag'?`<div class="notice">The copyrighted source PDF is not bundled in this public GitHub package. The app retains source title and page provenance.</div>`:''}
  `);
}

function openModal(title,body){ $('#modalTitle').textContent=title; $('#modalBody').innerHTML=body; $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden','true'); }

function pageHeader(title,sub=''){
  return `<div class="section-head" style="margin-top:2px"><div><h2 style="font-size:20px">${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div></div>`;
}
function footer(){
  const m=state.db.meta;
  return `<div class="source-footer"><b>${esc(m.appName)} ${esc(m.version)}</b> · Clinical DB ${esc(m.dbVersion)}<br>${esc(m.disclaimer)}<br>Current NAG recommendations should be verified on the live MOH site.</div>`;
}

function renderHome(){
  state.nav='home'; navActive();
  const recent=state.recent.slice(0,5);
  const favorites=state.favorites.slice(0,6);
  const nagMeta=state.nag||{};
  $('#main').innerHTML=`
    <section class="hero">
      <h1>Antimicrobial decisions, faster.</h1>
      <p>Search a drug, infection, organism, resistance mechanism or combined ICU scenario. Results keep each guideline source separate.</p>
      <div class="search-wrap">
        <input id="universalSearch" class="search" autocomplete="off" spellcheck="false" placeholder="e.g. VAP, meropenem, CRAB, pregnant pyelonephritis…" />
        <button id="searchGo" class="search-btn" aria-label="Search">⌕</button>
      </div>
      <div id="liveSearch"></div>
      <div class="chips">
        ${['Meropenem','VAP','Septic shock','ESBL E. coli','CRAB','Pseudomonas','Meningitis','Pregnancy','CRRT'].map(q=>`<button class="chip" data-query="${esc(q)}">${esc(q)}</button>`).join('')}
      </div>
    </section>

    <div class="home-status">
      <span class="pill good-pill">✓ Offline-first</span>
      <span class="pill">Clinical DB ${esc(state.db.meta.dbVersion)}</span>
      <button class="pill nag" data-tool="nag">NAG latest noted: ${esc(nagMeta.latestUpdate||'live online')} ↗</button>
    </div>

    <div class="section-head"><div><h2>Clinical shortcuts</h2><p>Designed for rounds, bedside decisions and training</p></div></div>
    <div class="cards">
      ${quick('🧫','Culture interpreter','Organism + phenotype + syndrome','culture')}
      ${quick('∑','Patient dose','CrCl, IBW/AdjBW and renal context','dose')}
      ${quick('↻','Renal / RRT','CrCl, HD and CRRT dose reference','renal')}
      ${quick('◎','TDM','Vancomycin & aminoglycoside monitoring','tdm')}
    </div>

    <div class="section-head"><div><h2>Stewardship</h2><p>Turn references into a repeatable ICU workflow</p></div></div>
    <div class="cards">
      ${quick('48h','AMS review','48–72 h de-escalation checklist','rounds')}
      ${quick('⇄','IV → PO','Eligibility and syndrome exclusions','ivpo')}
      ${quick('≈','Spectrum','Interactive expected-spectrum explorer','spectrum')}
      ${quick('≡','Compare','Compare up to 3 antimicrobials','compare')}
    </div>

    ${favorites.length?`<div class="section-head"><div><h2>Favourites</h2><p>Saved locally on this device</p></div></div><div class="list">${favorites.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>★ ${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}

    ${recent.length?`<div class="section-head"><div><h2>Recent</h2></div></div><div class="list">${recent.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}

    <div class="notice warn"><b>Source priority ≠ automatic truth.</b> Local HPUSM guidance is shown first where applicable, current NAG is linked live, and dedicated MSIDC MDR guidance is highlighted for resistant Gram-negative organisms. Conflicting regimens remain visibly source-specific.</div>
    ${footer()}`;
  $('#universalSearch').focus({preventScroll:true});
}
function quick(icon,title,sub,tool){ return `<button class="quick-card" data-tool="${tool}"><div class="qicon">${icon}</div><strong>${esc(title)}</strong><small>${esc(sub)}</small></button>`; }

function allSearchItems(){
  const items=[];
  state.db.drugs.forEach(x=>items.push({type:'drug',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.class}));
  state.db.conditions.forEach(x=>items.push({type:'condition',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.category}));
  state.db.organisms.forEach(x=>items.push({type:'organism',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.gram}));
  state.db.resistance.forEach(x=>items.push({type:'resistance',id:x.id,name:x.name,aliases:x.aliases||[],sub:'Resistance / phenotype'}));
  (state.nag?.topics||[]).forEach((x,i)=>items.push({type:'nag',id:String(i),name:x.title,aliases:[],sub:`NAG · ${x.section}`,url:x.url}));
  return items;
}
function scoreItem(item,q){
  const nq=slug(q), tokens=nq.split(' ').filter(Boolean), names=[item.name,...(item.aliases||[])].map(slug);
  let score=0;
  for(const n of names){ if(n===nq) score=Math.max(score,120); if(n.startsWith(nq)) score=Math.max(score,90); if(n.includes(nq)) score=Math.max(score,70); const hit=tokens.filter(t=>n.includes(t)).length; score=Math.max(score,hit*18); }
  if(slug(item.sub).includes(nq)) score=Math.max(score,40);
  return score;
}
function search(q){
  if(!q.trim()) return [];
  return allSearchItems().map(x=>({...x,score:scoreItem(x,q)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name)).slice(0,12);
}
function renderLiveSearch(q){
  const host=$('#liveSearch'); if(!host) return;
  if(!q.trim()){host.innerHTML='';return;}
  const hits=search(q).slice(0,7); const syn=parseSynthesis(q);
  host.innerHTML=`${syn.tokens.length>=2?renderSynthesisPreview(syn):''}${hits.length?`<div class="search-results">${hits.map(h=>`<button class="search-hit" data-hit-type="${h.type}" data-hit-id="${h.id}" ${h.url?`data-hit-url="${esc(h.url)}"`:''}><span class="type">${esc(h.type)}</span><span class="grow"><strong>${esc(h.name)}</strong><small>${esc(h.sub||'')}</small></span><span class="chev">›</span></button>`).join('')}</div>`:`<div class="search-results"><div class="empty"><b>No structured match</b>Try an antibiotic, disease, organism, resistance phenotype or NAG topic.</div></div>`}`;
}
function parseSynthesis(q){
  const nq=slug(q); const tokens=[]; const entities=[];
  const groups=[['condition',state.db.conditions],['drug',state.db.drugs],['organism',state.db.organisms],['resistance',state.db.resistance]];
  for(const [type,arr] of groups){
    for(const x of arr){ const terms=[x.name,...(x.aliases||[])].map(slug).sort((a,b)=>b.length-a.length); if(terms.some(t=>t && nq.includes(t))){ if(!entities.some(e=>e.type===type&&e.id===x.id)){entities.push({type,id:x.id,name:x.name});tokens.push(x.name);} } }
  }
  const mCr=q.match(/(?:crcl|creatinine clearance)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*(?:ml\/?min)?/i); if(mCr) tokens.push(`CrCl ${mCr[1]} mL/min`);
  const preg=q.match(/pregnan\w*\s*(\d{1,2})?\s*(?:weeks?|wks?)?/i); if(preg){tokens.push(preg[1]?`Pregnancy ${preg[1]} weeks`:'Pregnancy');}
  if(/septic shock/i.test(q) && !tokens.some(t=>/septic shock/i.test(t))) tokens.push('Septic shock');
  const rrt=['CVVHDF','CVVHD','CVVH','SLED','IHD','HD','CRRT'].find(x=>new RegExp(`\\b${x}\\b`,'i').test(q)); if(rrt) tokens.push(rrt.toUpperCase());
  if(/hypoalbumin/i.test(q)) tokens.push('Hypoalbuminaemia'); if(/ecmo/i.test(q)) tokens.push('ECMO'); if(/obes/i.test(q)) tokens.push('Obesity');
  return {q,entities,tokens:uniq(tokens),crcl:mCr?Number(mCr[1]):null,rrt,pregnancy:!!preg};
}
function renderSynthesisPreview(s){ return `<button class="synthesis" data-synthesis="${esc(s.q)}" style="width:100%;text-align:left;color:var(--ink)"><h3>Clinical synthesis</h3><div class="token-row">${s.tokens.map(t=>`<span class="token">${esc(t)}</span>`).join('')}</div><div class="tiny muted" style="margin-top:7px">Open an integrated result →</div></button>`; }
function renderSynthesis(q){
  const s=parseSynthesis(q); state.lastView={type:'synthesis',id:q};
  const cond=s.entities.find(e=>e.type==='condition'); const drug=s.entities.find(e=>e.type==='drug'); const org=s.entities.find(e=>e.type==='organism'); const res=s.entities.find(e=>e.type==='resistance');
  const c=cond&&state.db.conditions.find(x=>x.id===cond.id); const d=drug&&state.db.drugs.find(x=>x.id===drug.id); const rr=d?.renalKey&&state.db.renal[d.renalKey];
  let dose='';
  if(d && rr && (s.crcl!=null || s.rrt)) dose=renalResultHTML(d,rr,s.crcl,s.rrt);
  $('#main').innerHTML=`
    <div class="entity-title"><button class="back-btn" data-go="home">‹</button><div class="grow"><h1>Clinical synthesis</h1><p>${esc(q)}</p></div></div>
    <section class="synthesis"><h3>Recognised context</h3><div class="token-row">${s.tokens.map(t=>`<span class="token">${esc(t)}</span>`).join('')||'<span class="muted small">No structured context recognised.</span>'}</div></section>
    ${c?`<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.summary)}</p><div class="btn-row"><button class="primary-btn" data-open="condition" data-id="${c.id}">Open syndrome pathway</button></div></div>`:''}
    ${org?`<div class="card"><h3>Organism: ${esc(org.name)}</h3><p>${esc(state.db.organisms.find(x=>x.id===org.id)?.gram||'')}</p><button class="secondary-btn" data-open="organism" data-id="${org.id}">Organism view</button></div>`:''}
    ${res?`<div class="card"><h3>Resistance: ${esc(res.name)}</h3><p>${esc(state.db.resistance.find(x=>x.id===res.id)?.summary||'')}</p><button class="secondary-btn" data-open="resistance" data-id="${res.id}">Resistance view</button></div>`:''}
    ${d?`<div class="card"><h3>Drug: ${esc(d.name)}</h3><p>${esc(d.quickDose)}</p><button class="secondary-btn" data-open="drug" data-id="${d.id}">Drug monograph</button></div>`:''}
    ${dose}
    ${s.pregnancy&&d?pregnancyBox(d):''}
    ${c?beforeBox(c.before):''}
    ${c?recommendationsHTML(c):''}
    <div class="notice warn"><b>Clinical synthesis is rule-based, not generative prescribing.</b> It links structured source records and patient modifiers. Verify susceptibility, current NAG/local policy, organ function and source control before treatment.</div>
    ${footer()}`;
  scrollTo(0,0);
}

function addRecent(type,id,name){
  state.recent=[{type,id,name},...state.recent.filter(x=>!(x.type===type&&x.id===id))].slice(0,8); save('abx-recent',state.recent);
}
function isFav(type,id){ return state.favorites.some(x=>x.type===type&&x.id===id); }
function toggleFav(type,id,name){
  if(isFav(type,id)) state.favorites=state.favorites.filter(x=>!(x.type===type&&x.id===id)); else state.favorites.unshift({type,id,name});
  save('abx-favorites',state.favorites); toast(isFav(type,id)?'Saved to favourites':'Removed from favourites'); renderEntity(type,id);
}

function renderEntity(type,id){
  if(type==='drug') return renderDrug(id);
  if(type==='condition') return renderCondition(id);
  if(type==='organism') return renderOrganism(id);
  if(type==='resistance') return renderResistance(id);
}
function entityTop(type,x,sub){
  const fav=isFav(type,x.id);
  return `<div class="entity-title"><button class="back-btn" data-back>‹</button><div class="grow"><h1>${esc(x.name)}</h1><p>${esc(sub||'')}</p></div><button class="fav-btn ${fav?'active':''}" data-fav-type="${type}" data-fav-id="${x.id}" data-fav-name="${esc(x.name)}">${fav?'★':'☆'}</button></div>`;
}
function spectrumMetric(label,val){
  let out=''; if(typeof val==='number') out=`<span class="dots">${'●'.repeat(val)}${'○'.repeat(Math.max(0,3-val))}</span>`; else {const cls=val==='yes'?'yes':val==='no'?'no':'partial';out=`<span class="${cls}">${val==='yes'?'✓':val==='no'?'✕':'◐'}</span>`;}
  return `<div class="metric"><b>${out}</b><small>${esc(label)}</small></div>`;
}
function pregnancyBox(d){
  if(!d.pregnancy) return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Pregnancy / lactation</h3>${sourcePill(d.pregnancy.source)}</div><div class="form-grid"><div class="result-box"><strong>Pregnancy</strong><div class="small" style="margin-top:4px">Legacy category: ${esc(d.pregnancy.category)}</div></div><div class="result-box"><strong>Lactation</strong><div class="small" style="margin-top:4px">${esc(d.pregnancy.lactation)}</div></div></div><div class="notice warn">The source uses legacy FDA pregnancy categories. Interpret with gestation, indication, alternatives and current product/specialist information.</div></div>`;
}
function renderDrug(id){
  const d=state.db.drugs.find(x=>x.id===id); if(!d) return; state.lastView={type:'drug',id}; addRecent('drug',id,d.name); state.nav='drugs';navActive();
  const s=d.spectrum||{};
  $('#main').innerHTML=`
    ${entityTop('drug',d,d.class)}
    ${modeLens()}
    <div class="quick-dose"><label>ICU QUICK DOSE</label><strong>${esc(d.quickDose)}</strong></div>
    <div class="metric-grid">
      ${spectrumMetric('Gram +',s.gramPositive||0)}${spectrumMetric('Gram −',s.gramNegative||0)}${spectrumMetric('Pseudomonas',s.pseudomonas||'no')}${spectrumMetric('Anaerobes',s.anaerobes||'no')}${spectrumMetric('MRSA',s.mrsa||'no')}${spectrumMetric('Atypicals',s.atypicals||'no')}
    </div>
    <div class="tabs"><button class="tab-btn active">Overview</button><button class="tab-btn" data-jump="#doseSec">Dosing</button>${d.renalKey?'<button class="tab-btn" data-tool="renal" data-drug="'+d.id+'">Renal/RRT</button>':''}<button class="tab-btn" data-jump="#pkpdSec">PK/PD</button><button class="tab-btn" data-jump="#sourceSec">Sources</button></div>
    <div id="doseSec" class="card"><h3>Dosing / administration</h3><ul>${(d.doseNotes||[]).map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>${d.renalKey?`<div class="btn-row"><button class="primary-btn" data-tool="renal" data-drug="${d.id}">Calculate renal/RRT regimen</button></div>`:''}</div>
    ${state.mode==='icu'?`<div id="pkpdSec" class="card"><h3>PK/PD & ICU optimisation</h3><p>${esc(d.pkpd||'')}</p>${(d.warnings||[]).map(x=>`<div class="notice ${/not|risk|avoid|tox/i.test(x)?'warn':''}">${esc(x)}</div>`).join('')}</div>`:`<div id="pkpdSec" class="card"><h3>Key cautions</h3>${(d.warnings||[]).slice(0,2).map(x=>`<div class="notice ${/not|risk|avoid|tox/i.test(x)?'warn':''}">${esc(x)}</div>`).join('')||'<p class="small muted">No additional structured caution in this seed record.</p>'}</div>`}
    ${pregnancyBox(d)}
    <div class="card"><h3>Where this drug appears</h3><div class="list">${(d.indications||[]).map(cid=>{const c=state.db.conditions.find(x=>x.id===cid)||state.db.resistance.find(x=>x.id===cid);return c?`<button class="list-row" data-open="${state.db.conditions.some(x=>x.id===cid)?'condition':'resistance'}" data-id="${cid}"><div class="grow"><strong>${esc(c.name)}</strong><small>Open linked clinical pathway</small></div><span class="chev">›</span></button>`:''}).join('')||'<span class="muted small">No linked pathway in this seed database.</span>'}</div></div>
    ${currentNagLinks(d)}
    <div id="sourceSec" class="card"><h3>Sources</h3><div class="tag-row">${(d.refs||[]).map(r=>`<button class="pill ${r.source==='hpusm'?'local':r.source==='msidc'?'mdr':r.source==='msic'?'icu':''}" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div><div class="notice">Expected-spectrum visualization is a reference layer; isolate susceptibility and local epidemiology take precedence.</div></div>
    ${footer()}`;
  scrollTo(0,0);
}
function beforeBox(items=[]){ return `<div class="card"><h3>Before / with first dose</h3><div class="checklist">${items.map((x,i)=>`<label class="check-item"><input type="checkbox" /><span>${esc(x)}</span></label>`).join('')}</div></div>`; }
function recommendationsHTML(c){
  return `<div class="section-head"><div><h2>Empirical / targeted source cards</h2><p>Recommendations remain separated by guideline</p></div></div>${c.recommendations.map(r=>{
    const s=source(r.source); const cls=r.source==='hpusm'?'local':r.source==='nag'?'nag':r.source==='msidc'?'mdr':'';
    return `<article class="source-card ${cls}"><div class="source-meta">${sourcePill(r.source)}<span class="pill">${esc(r.label)}</span></div><h4>Preferred</h4><ul>${(r.preferred||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${r.alternative?.length?`<h4>Alternative / additional</h4><ul>${r.alternative.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${r.duration?`<div class="notice"><b>Duration / review:</b> ${esc(r.duration)}</div>`:''}${r.notes?.length?r.notes.map(x=>`<div class="notice">${esc(x)}</div>`).join(''):''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:r.source,page:r.page,pdfPage:r.pdfPage,url:r.url}))}'>${refText({source:r.source,page:r.page,pdfPage:r.pdfPage})} →</button></article>`;
  }).join('')}`;
}
function conditionDecisionAid(c){
  if(c.id!=='hap-vap') return '';
  return `<div class="card decision-aid"><h3>Rapid HAP/VAP risk screen</h3><p class="small muted">This screen surfaces the risk modifiers explicitly listed in the MSIC ICU source; it does not replace local antibiogram or clinical judgement.</p><div class="checklist">${(c.riskFactors||[]).map((x,i)=>`<label class="check-item"><input type="checkbox" class="hap-risk" data-risk="${i}"><span>${esc(x)}</span></label>`).join('')}</div><div id="hapRiskOut" class="result-box"><strong>No MDR modifier selected</strong><div class="small" style="margin-top:4px">Review acquisition timing, clinical severity and local microbiology.</div></div></div>`;
}
function bindConditionDecisionAid(c){
  if(c.id!=='hap-vap') return;
  const inputs=$$('.hap-risk'); const out=$('#hapRiskOut');
  const draw=()=>{const n=inputs.filter(x=>x.checked).length;out.innerHTML=n?`<strong>${n} MDR risk modifier${n>1?'s':''} selected</strong><div class="small" style="margin-top:4px">Use the MDR-risk source cards and verify current local/NAG guidance before choosing empirical therapy.</div>`:`<strong>No MDR modifier selected</strong><div class="small" style="margin-top:4px">Review acquisition timing, severity and local microbiology.</div>`};
  inputs.forEach(x=>x.addEventListener('change',draw)); draw();
}
function renderCondition(id){
  const c=state.db.conditions.find(x=>x.id===id); if(!c)return; state.lastView={type:'condition',id};addRecent('condition',id,c.name);state.nav='diseases';navActive();
  const sourceCount=uniq((c.recommendations||[]).map(r=>r.source)).length;
  $('#main').innerHTML=`${entityTop('condition',c,c.category+(c.icu?' · ICU':'') )}${modeLens()}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(c.summary)}</p>${c.riskFactors?.length?`<h3 style="margin-top:12px">Key risk modifiers</h3><div class="tag-row">${c.riskFactors.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${conditionDecisionAid(c)}${sourceCount>1?`<div class="notice warn"><b>Guideline comparison:</b> ${sourceCount} source sets are shown below. They are intentionally not merged into one synthetic regimen.</div>`:''}${beforeBox(c.before||[])}${recommendationsHTML(c)}${c.why?.length?`<details class="card teaching-details"><summary><b>Why this approach?</b> <span class="muted small">Teaching layer</span></summary><ul style="margin-top:10px">${c.why.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}${currentNagLinks(c)}<div class="card"><h3>Source provenance</h3><div class="tag-row">${(c.refs||[]).map(r=>`<button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div></div>${footer()}`;
  bindConditionDecisionAid(c); scrollTo(0,0);
}
function renderOrganism(id){
  const o=state.db.organisms.find(x=>x.id===id); if(!o)return;state.lastView={type:'organism',id};addRecent('organism',id,o.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('organism',o,o.gram)}<div class="card"><h3>Important phenotypes</h3><div class="tag-row">${(o.phenotypes||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>${(o.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}</div><div class="card"><h3>Linked pathways</h3><div class="list">${(o.links||[]).map(id=>{const r=state.db.resistance.find(x=>x.id===id);const c=state.db.conditions.find(x=>x.id===id);const x=r||c;if(!x)return '';return `<button class="list-row" data-open="${r?'resistance':'condition'}" data-id="${x.id}"><div class="grow"><strong>${esc(x.name)}</strong><small>${r?'Resistance mechanism / phenotype':'Clinical syndrome'}</small></div><span class="chev">›</span></button>`}).join('')}</div></div>${currentNagLinks(o)}<div class="notice warn">Do not infer treatment from organism name alone. Site, resistance mechanism, susceptibility, colonisation vs infection and severity all matter.</div>${footer()}`;scrollTo(0,0);
}
function renderResistance(id){
  const r=state.db.resistance.find(x=>x.id===id);if(!r)return;state.lastView={type:'resistance',id};addRecent('resistance',id,r.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('resistance',r,'Resistance / phenotype')}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(r.summary)}</p>${r.phenotypes?.length?`<div class="tag-row">${r.phenotypes.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${(r.sourceCards||[]).map(sc=>`<article class="source-card ${sc.source==='hpusm'?'local':sc.source==='msidc'?'mdr':''}">${sourcePill(sc.source)}<h4>${esc(sc.title)}</h4><p>${esc(sc.text)}</p><button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:sc.source,page:sc.page}))}'>${refText({source:sc.source,page:sc.page})} →</button></article>`).join('')}${currentNagLinks(r)}<div class="notice danger"><b>Resistance mechanism ≠ prescription.</b> Confirm infection vs colonisation, infection site, severity, susceptibility and current dedicated MDR guidance.</div>${footer()}`;scrollTo(0,0);
}

function renderDirectory(kind){
  state.nav=kind==='condition'?'diseases':kind==='drug'?'drugs':'organisms';navActive();
  let arr,title,sub;
  if(kind==='drug'){arr=state.db.drugs;title='Drugs';sub='Antimicrobial monographs, dosing and linked indications';}
  else if(kind==='condition'){arr=state.db.conditions;title='Diseases & syndromes';sub='Source-specific empirical and targeted pathways';}
  else {arr=[...state.db.organisms.map(x=>({...x,_type:'organism'})),...state.db.resistance.map(x=>({...x,_type:'resistance'}))];title='Organisms & resistance';sub='Organism profiles, phenotypes and MDR pathways';}
  $('#main').innerHTML=`${pageHeader(title,sub)}<div class="field"><input id="dirFilter" placeholder="Filter ${esc(title.toLowerCase())}…"></div><div id="dirList" class="list" style="margin-top:10px">${directoryRows(arr,kind)}</div>${footer()}`;
  $('#dirFilter').addEventListener('input',e=>{const q=slug(e.target.value);const f=arr.filter(x=>slug([x.name,...(x.aliases||[])].join(' ')).includes(q));$('#dirList').innerHTML=directoryRows(f,kind)});
}
function directoryRows(arr,kind){ return arr.map(x=>{const t=kind==='mixed'?(x._type||'organism'):kind;return `<button class="list-row" data-open="${t}" data-id="${x.id}"><div class="grow"><strong>${esc(x.name)}</strong><small>${esc(x.class||x.category||x.gram||(t==='resistance'?'Resistance / phenotype':''))}</small></div><span class="chev">›</span></button>`}).join('')||'<div class="empty"><b>No matches</b></div>'; }

function renderTools(){
  state.nav='tools';navActive();
  $('#main').innerHTML=`${pageHeader('Tools','Offline clinical utilities and stewardship workflows')}<div class="tool-grid">
  ${toolCard('∑','Patient dose','Cockcroft–Gault, BMI, IBW/AdjBW','dose')}${toolCard('↻','Renal / RRT','Structured MSIC renal dose tables','renal')}${toolCard('◎','TDM','Vancomycin and aminoglycoside monitoring','tdm')}${toolCard('≈','Spectrum explorer','Expected activity, not susceptibility','spectrum')}${toolCard('≡','Compare antibiotics','Side-by-side spectrum and properties','compare')}${toolCard('♀','Pregnancy / lactation','Legacy category + lactation note','pregnancy')}${toolCard('⇄','IV → PO','Switch eligibility checklist','ivpo')}${toolCard('⏱','Prolonged infusion','β-lactam ICU administration','infusion')}${toolCard('🧫','Culture interpreter','Organism + phenotype + site','culture')}${toolCard('48h','AMS round','Local, temporary 48–72 h review cards','rounds')}${toolCard('🎓','Teaching cases','Source-grounded quick revision cases','teaching')}${toolCard('NAG','Current NAG','Search live MOH topic links','nag')}${toolCard('ⓘ','Sources & app','Guideline hierarchy, freshness and scope','sources')}
  </div>${footer()}`;
}
function toolCard(icon,title,sub,id){return `<button class="tool-card" data-tool="${id}"><div class="qicon">${icon}</div><strong>${esc(title)}</strong><small>${esc(sub)}</small></button>`}
function renderTool(id,opts={}){
  state.nav='tools';navActive();
  const map={dose:toolDose,renal:toolRenal,tdm:toolTDM,spectrum:toolSpectrum,compare:toolCompare,pregnancy:toolPregnancy,ivpo:toolIVPO,infusion:toolInfusion,culture:toolCulture,rounds:toolRounds,teaching:toolTeaching,nag:toolNAG,sources:toolSources};
  (map[id]||renderTools)(opts);
}
function toolHeader(title,sub){return `<div class="entity-title"><button class="back-btn" data-tool="back-tools">‹</button><div class="grow"><h1>${esc(title)}</h1><p>${esc(sub||'')}</p></div></div>`}

function toolDose(){
  $('#main').innerHTML=`${toolHeader('Patient dose context','Cockcroft–Gault + weight descriptors; no cloud patient data')}<div class="card"><div class="form-grid">
    <div class="field"><label>Age (years)</label><input id="age" type="number" min="16" max="120" inputmode="decimal"></div>
    <div class="field"><label>Sex</label><select id="sex"><option value="male">Male</option><option value="female">Female</option></select></div>
    <div class="field"><label>Height (cm)</label><input id="height" type="number" min="100" max="230" inputmode="decimal"></div>
    <div class="field"><label>Actual weight (kg)</label><input id="weight" type="number" min="20" max="400" inputmode="decimal"></div>
    <div class="field"><label>Serum creatinine (µmol/L)</label><input id="scr" type="number" min="10" max="3000" inputmode="decimal"></div>
    <div class="field"><label>Renal support</label><select id="doseRrt"><option value="">None</option><option>HD</option><option>CVVH</option><option>CVVHD</option><option>CVVHDF</option></select></div>
    <div class="field full"><label>Special context</label><div class="tag-row"><label class="pill"><input type="checkbox" id="shock"> Septic shock</label><label class="pill"><input type="checkbox" id="ecmo"> ECMO</label><label class="pill"><input type="checkbox" id="hypo"> Hypoalbuminaemia</label><label class="pill"><input type="checkbox" id="cns"> CNS infection</label></div></div>
  </div><div class="btn-row"><button id="calcCrcl" class="primary-btn">Calculate</button></div><div id="doseResult"></div></div>
  <div class="notice">MSIC Appendix A uses Cockcroft–Gault with IBW, adjusted body weight in obesity and actual body weight when BMI &lt;18.5 kg/m². This tool follows that source logic.</div>${footer()}`;
  $('#calcCrcl').addEventListener('click',()=>{
    const age=+$('#age').value, h=+$('#height').value, w=+$('#weight').value, scr=+$('#scr').value, sex=$('#sex').value;
    if(!age||!h||!w||!scr){toast('Enter age, height, weight and creatinine');return;}
    const bmi=w/((h/100)**2); const inch=h/2.54; const ibw=(sex==='male'?50:45.5)+2.3*(inch-60); const adj=ibw+0.4*(w-ibw); const calcW=bmi<18.5?w:bmi>=30?adj:ibw; const factor=sex==='male'?1.23:1.04; const crcl=((140-age)*calcW*factor)/scr;
    const context=[`BMI ${bmi.toFixed(1)}`,`IBW ${ibw.toFixed(1)} kg`,`AdjBW ${adj.toFixed(1)} kg`,`CrCl weight ${calcW.toFixed(1)} kg`];
    const flags=[]; if($('#shock').checked)flags.push('Septic shock: preserve adequate early exposure/loading strategy and reassess PK.');if($('#ecmo').checked)flags.push('ECMO: drug-specific PK may be altered; source data are limited.');if($('#hypo').checked)flags.push('Hypoalbuminaemia: highly protein-bound drugs may have altered Vd/clearance.');if($('#cns').checked)flags.push('CNS infection: use CNS-specific high-dose regimens where the source specifies them.');
    $('#doseResult').innerHTML=`<div class="result-box"><strong>Estimated CrCl ${crcl.toFixed(1)} mL/min</strong><dl><dt>Weight rule</dt><dd>${bmi<18.5?'Actual body weight':bmi>=30?'Adjusted body weight':'Ideal body weight'}</dd><dt>BMI</dt><dd>${bmi.toFixed(1)} kg/m²</dd><dt>IBW</dt><dd>${ibw.toFixed(1)} kg</dd><dt>AdjBW</dt><dd>${adj.toFixed(1)} kg</dd></dl></div>${flags.map(x=>`<div class="notice warn">${esc(x)}</div>`).join('')}<div class="btn-row"><button class="primary-btn" data-tool="renal" data-crcl="${crcl.toFixed(1)}" data-rrt="${esc($('#doseRrt').value)}">Use in renal dose tool</button></div>`;
  });
}
function renalRuleForCrcl(rr,crcl){ if(crcl==null||Number.isNaN(crcl))return null;return rr.bins.find(b=>(b.min==null||crcl>=b.min)&&(b.max==null||crcl<=b.max)); }
function renalResultHTML(d,rr,crcl,rrt){
  let text=''; if(rrt && rr.rrt?.[rrt]) text=rr.rrt[rrt]; else if(crcl!=null){ const b=renalRuleForCrcl(rr,crcl); text=b?.text||'No structured rule'; }
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Patient-specific renal reference</h3>${sourcePill(rr.source)}</div><div class="result-box"><strong>${esc(d.name)}</strong><dl>${crcl!=null?`<dt>CrCl</dt><dd>${Number(crcl).toFixed(1)} mL/min</dd>`:''}${rrt?`<dt>RRT</dt><dd>${esc(rrt)}</dd>`:''}<dt>Regimen</dt><dd>${esc(text||rr.normal)}</dd></dl></div>${rr.high?`<div class="notice"><b>High-dose context:</b> ${esc(rr.high)}</div>`:''}${rr.note?`<div class="notice warn">${esc(rr.note)}</div>`:''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:rr.source,page:rr.page,pdfPage:rr.pdfPage}))}'>${refText({source:rr.source,page:rr.page,pdfPage:rr.pdfPage})} →</button></div>`;
}
function toolRenal(opts={}){
  const drug=opts.drug||''; const crcl=opts.crcl??''; const rrt=opts.rrt||'';
  const selectable=state.db.drugs.filter(d=>d.renalKey&&state.db.renal[d.renalKey]);
  $('#main').innerHTML=`${toolHeader('Renal / RRT dosing','Structured MSIC Adult ICU renal appendix')}<div class="card"><div class="form-grid"><div class="field full"><label>Antimicrobial</label><select id="renalDrug"><option value="">Select…</option>${selectable.map(d=>`<option value="${d.id}" ${d.id===drug?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div><div class="field"><label>CrCl (mL/min)</label><input id="renalCrcl" type="number" value="${esc(crcl)}" placeholder="e.g. 25"></div><div class="field"><label>Renal replacement therapy</label><select id="renalRrt"><option value="">None</option>${['HD','CVVH','CVVHD','CVVHDF'].map(x=>`<option ${x===rrt?'selected':''}>${x}</option>`).join('')}</select></div></div><div class="btn-row"><button id="renalCalc" class="primary-btn">Show regimen</button><button class="secondary-btn" data-tool="dose">Calculate CrCl</button></div><div id="renalOut"></div></div><div class="notice warn"><b>Maintenance-dose tool.</b> Critical illness often still requires a full/stat or source-specified loading dose. RRT settings, effluent rate, residual renal function and TDM can materially alter exposure.</div>${footer()}`;
  const calc=()=>{const d=state.db.drugs.find(x=>x.id===$('#renalDrug').value);if(!d){toast('Select an antimicrobial');return}const rr=state.db.renal[d.renalKey];const c=$('#renalCrcl').value===''?null:+$('#renalCrcl').value;const r=$('#renalRrt').value;$('#renalOut').innerHTML=renalResultHTML(d,rr,c,r)};
  $('#renalCalc').addEventListener('click',calc); if(drug) calc();
}
function toolTDM(){
  $('#main').innerHTML=`${toolHeader('Therapeutic drug monitoring','Guideline-derived timing reminders; not a Bayesian dosing engine')}<div class="card"><div class="field"><label>Antimicrobial</label><select id="tdmDrug"><option value="vancomycin">Vancomycin</option><option value="aminoglycoside">Gentamicin / Amikacin</option></select></div><div id="tdmBody"></div></div>${footer()}`;
  const draw=()=>{const v=$('#tdmDrug').value;$('#tdmBody').innerHTML=v==='vancomycin'?`
    <div class="quick-dose"><label>VANCOMYCIN</label><strong>LD 20–25 mg/kg actual body weight (max 2 g/dose), then maintenance by renal function + TDM.</strong></div>
    <div class="notice good"><b>Exposure target:</b> MSIC source shows AUC24/MIC 400–600 in its ICU dosing appendix; AUC-guided monitoring is preferred where feasible.</div>
    <ul class="small"><li>Normal renal function: initial pre-level 30 min before 4th dose and post-level 1 h after completion of 4th dose in the cited MSIC approach.</li><li>CrCl 30–50: initial assay 24 h after first maintenance dose.</li><li>CrCl &lt;30: initial assay 24 h after loading dose, then redose by TDM.</li><li>HD/CRRT: use the dedicated RRT schedule and TDM; effluent rate matters in CRRT.</li></ul>
    <button class="primary-btn" data-tool="renal" data-drug="vancomycin">Open vancomycin renal/RRT tool</button>`:`
    <div class="quick-dose"><label>AMINOGLYCOSIDES</label><strong>Concentration-dependent therapy requires timed sampling and renal-function-aware redosing.</strong></div>
    <ul class="small"><li>Single-daily dosing: MSIC sampling guidance includes post-dose concentrations after the 2nd dose (2 h and 6 h).</li><li>Conventional dosing: trough 30 min before next dose; peak 30 min after completion of a 30-min infusion.</li><li>Repeat more frequently with changing renal function or concurrent nephrotoxic drugs.</li></ul><div class="notice warn">Use your institution's validated aminoglycoside nomogram/TDM workflow for dose adjustment.</div>`;
  }; $('#tdmDrug').addEventListener('change',draw);draw();
}
function statusText(v){return typeof v==='number'?`${'●'.repeat(v)}${'○'.repeat(3-v)}`:v==='yes'?'✓':v==='no'?'✕':'◐'}
function toolSpectrum(){
  $('#main').innerHTML=`${toolHeader('Spectrum explorer','Wellington-style expected activity, converted to an interactive layer')}<div class="notice warn"><b>Spectrum ≠ susceptibility.</b> Local antibiogram and isolate-specific susceptibility override this display.</div><div class="card"><div class="field"><label>Antimicrobial</label><select id="specDrug">${state.db.drugs.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div><div id="specOut"></div></div>${footer()}`;
  const draw=()=>{const d=state.db.drugs.find(x=>x.id===$('#specDrug').value),s=d.spectrum;$('#specOut').innerHTML=`<div class="metric-grid">${spectrumMetric('Gram +',s.gramPositive)}${spectrumMetric('Gram −',s.gramNegative)}${spectrumMetric('Pseudomonas',s.pseudomonas)}${spectrumMetric('Anaerobes',s.anaerobes)}${spectrumMetric('MRSA',s.mrsa)}${spectrumMetric('Atypicals',s.atypicals)}</div><div class="btn-row"><button class="secondary-btn" data-open="drug" data-id="${d.id}">Open ${esc(d.name)}</button></div>`};$('#specDrug').addEventListener('change',draw);draw();
}
function toolCompare(){
  const opts=state.db.drugs.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('');
  $('#main').innerHTML=`${toolHeader('Compare antimicrobials','Up to three agents side-by-side')}<div class="card"><div class="form-grid"><div class="field"><label>Drug 1</label><select class="cmp">${opts}</select></div><div class="field"><label>Drug 2</label><select class="cmp">${opts}</select></div><div class="field"><label>Drug 3</label><select class="cmp"><option value="">— none —</option>${opts}</select></div></div><div id="cmpOut" style="margin-top:12px"></div></div>${footer()}`;
  const sels=$$('.cmp'); sels[0].value='cefepime';sels[1].value='piperacillin-tazobactam';sels[2].value='meropenem';
  const draw=()=>{const ds=sels.map(s=>state.db.drugs.find(d=>d.id===s.value)).filter(Boolean);const rows=[['Gram +',d=>statusText(d.spectrum.gramPositive)],['Gram −',d=>statusText(d.spectrum.gramNegative)],['Pseudomonas',d=>statusText(d.spectrum.pseudomonas)],['Anaerobes',d=>statusText(d.spectrum.anaerobes)],['MRSA',d=>statusText(d.spectrum.mrsa)],['Atypicals',d=>statusText(d.spectrum.atypicals)],['Renal tool',d=>d.renalKey?'Yes':'Source-specific'],['PK/PD',d=>d.pkpd]];$('#cmpOut').innerHTML=`<div class="compare-wrap"><table class="compare-table"><thead><tr><th>Attribute</th>${ds.map(d=>`<th>${esc(d.name)}</th>`).join('')}</tr></thead><tbody>${rows.map(([n,f])=>`<tr><td>${esc(n)}</td>${ds.map(d=>`<td>${esc(f(d))}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="notice">Comparison is a teaching/reference view. It does not determine the preferred drug for a specific infection.</div>`};sels.forEach(s=>s.addEventListener('change',draw));draw();
}
function toolPregnancy(){
  $('#main').innerHTML=`${toolHeader('Pregnancy / lactation','Search the pregnancy attribute of the same antimicrobial record')}<div class="card"><div class="field"><label>Antimicrobial</label><select id="pregDrug"><option value="">Select…</option>${state.db.drugs.filter(d=>d.pregnancy).map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div><div id="pregOut"></div></div><div class="notice warn">The uploaded pregnancy/lactation appendix uses legacy FDA categories. This PWA preserves that source terminology rather than silently replacing it with a different classification.</div>${footer()}`;
  $('#pregDrug').addEventListener('change',()=>{const d=state.db.drugs.find(x=>x.id===$('#pregDrug').value);$('#pregOut').innerHTML=d?pregnancyBox(d):''});
}
function toolIVPO(){
  const x=state.db.ivpo; $('#main').innerHTML=`${toolHeader('IV → PO switch','Stewardship eligibility and syndrome exclusions')}<div class="card"><h3>Switch checklist</h3><div class="checklist">${x.checklist.map(i=>`<label class="check-item"><input type="checkbox"><span>${esc(i)}</span></label>`).join('')}</div></div><div class="form-grid"><div class="card"><h3>May be considered after adequate parenteral therapy</h3><ul>${x.consider.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div><div class="card"><h3>Not recommended for routine IV → PO conversion in the cited ICU guide</h3><ul>${x.avoid.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div></div><button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:x.source,page:x.page}))}'>${refText({source:x.source,page:x.page})} →</button>${footer()}`;
}
function toolInfusion(){
  const rows=['cefepime','ceftazidime','imipenem','meropenem','piperacillin-tazobactam'].map(id=>state.db.drugs.find(d=>d.id===id));
  $('#main').innerHTML=`${toolHeader('Prolonged β-lactam infusion','ICU administration layer from MSIC source')}<div class="notice good">MSIC states that cefepime, ceftazidime, imipenem, meropenem and piperacillin/tazobactam require loading doses when using extended infusion.</div><div class="list">${rows.map(d=>`<button class="list-row" data-open="drug" data-id="${d.id}"><div class="grow"><strong>${esc(d.name)}</strong><small>${esc(d.quickDose)}</small></div><span class="chev">›</span></button>`).join('')}</div><div class="notice warn">Compatibility, line access, stability, local infusion policy and renal/RRT dose must be checked before implementation.</div>${footer()}`;
}
function toolCulture(){
  $('#main').innerHTML=`${toolHeader('Culture interpreter','Rule-based links to organism, resistance and syndrome records')}<div class="card"><div class="form-grid"><div class="field"><label>Organism</label><select id="cultOrg"><option value="">Select…</option>${state.db.organisms.map(o=>`<option value="${o.id}">${esc(o.name)}</option>`).join('')}</select></div><div class="field"><label>Resistance phenotype</label><select id="cultRes"><option value="">None / unknown</option>${state.db.resistance.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></div><div class="field"><label>Site / syndrome</label><select id="cultSite"><option value="">Select…</option>${state.db.conditions.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Severity</label><select id="cultSev"><option>Stable / mild-moderate</option><option>Severe / critically ill</option><option>Septic shock</option></select></div><div class="field full"><label>Susceptible agents (optional free text)</label><input id="cultSus" placeholder="e.g. amikacin, ceftazidime-avibactam"></div></div><div class="btn-row"><button id="cultRun" class="primary-btn">Interpret</button></div><div id="cultOut"></div></div>${footer()}`;
  $('#cultRun').addEventListener('click',()=>{const o=state.db.organisms.find(x=>x.id===$('#cultOrg').value),r=state.db.resistance.find(x=>x.id===$('#cultRes').value),c=state.db.conditions.find(x=>x.id===$('#cultSite').value),sev=$('#cultSev').value,sus=$('#cultSus').value;if(!o&&!r&&!c){toast('Select at least an organism, phenotype or site');return}$('#cultOut').innerHTML=`<div class="synthesis"><h3>Interpretation context</h3><div class="token-row">${[o?.name,r?.name,c?.name,sev,sus&&`Susceptible: ${sus}`].filter(Boolean).map(x=>`<span class="token">${esc(x)}</span>`).join('')}</div></div>${r?`<div class="card"><h3>${esc(r.name)}</h3><p>${esc(r.summary)}</p><button class="secondary-btn" data-open="resistance" data-id="${r.id}">Open resistance guidance</button></div>`:''}${c?`<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.summary)}</p><button class="secondary-btn" data-open="condition" data-id="${c.id}">Open syndrome guidance</button></div>`:''}${o?`<div class="card"><h3>${esc(o.name)}</h3><p>${esc(o.gram)}</p><button class="secondary-btn" data-open="organism" data-id="${o.id}">Open organism</button></div>`:''}<div class="notice danger">The interpreter does not infer susceptibility or prescribe an agent from the antibiogram. Confirm infection vs colonisation/contamination, MIC/susceptibility, site penetration, severity and current MDR guidance.</div>`});
}
function getRounds(){return JSON.parse(localStorage.getItem('abx-rounds')||'[]')}
function setRounds(x){localStorage.setItem('abx-rounds',JSON.stringify(x))}
function toolRounds(){
  const rounds=getRounds(); $('#main').innerHTML=`${toolHeader('AMS round','Temporary local-only cards; avoid patient identifiers')}<div class="card"><div class="form-grid"><div class="field"><label>Bed / location</label><input id="rBed" placeholder="e.g. Bed 3"></div><div class="field"><label>Syndrome</label><input id="rSynd" placeholder="e.g. VAP"></div><div class="field"><label>Antimicrobial</label><input id="rDrug" placeholder="e.g. meropenem"></div><div class="field"><label>Day</label><input id="rDay" type="number" min="1" placeholder="4"></div><div class="field full"><label>Culture / key result (no patient identifiers)</label><input id="rCult" placeholder="e.g. P. aeruginosa; susceptible to cefepime"></div></div><div class="btn-row"><button id="rAdd" class="primary-btn">Add review card</button>${rounds.length?'<button id="rClear" class="danger-btn">Clear all</button>':''}</div></div><div id="roundList">${roundRows(rounds)}</div><div class="notice">Round cards stay in this browser's local storage. The PWA does not send them to a server.</div>${footer()}`;
  $('#rAdd').addEventListener('click',()=>{const x={id:Date.now(),bed:$('#rBed').value.trim(),syndrome:$('#rSynd').value.trim(),drug:$('#rDrug').value.trim(),day:$('#rDay').value.trim(),culture:$('#rCult').value.trim(),checks:{}};if(!x.bed&&!x.syndrome&&!x.drug){toast('Add at least bed, syndrome or antimicrobial');return}const a=getRounds();a.push(x);setRounds(a);toolRounds()});
  $('#rClear')?.addEventListener('click',()=>{if(confirm('Clear all local AMS round cards?')){setRounds([]);toolRounds()}});
}
function roundRows(a){if(!a.length)return '<div class="empty"><b>No round cards yet</b>Add a temporary antibiotic review card above.</div>';const checks=['Infection still likely?','Cultures available/reviewed?','Can spectrum be narrowed?','Source controlled?','IV → PO possible?','Duration/stop date documented?'];return a.map(x=>`<div class="card round-card"><div class="source-meta"><h4 style="margin-right:auto">${esc(x.bed||'Round card')}</h4><button class="link-btn" data-round-del="${x.id}">Delete</button></div><div class="round-meta">${esc([x.syndrome,x.drug,x.day&&`Day ${x.day}`,x.culture].filter(Boolean).join(' · '))}</div><div class="checklist" style="margin-top:10px">${checks.map((c,i)=>`<label class="check-item"><input type="checkbox" data-round-check="${x.id}" data-check-index="${i}" ${x.checks?.[i]?'checked':''}><span>${esc(c)}</span></label>`).join('')}</div></div>`).join('')}
function toolTeaching(){
  const cases=[
    {q:'A ventilated ICU patient develops pneumonia after ≥5 hospital days and had IV antibiotics within 90 days. What changes in your empirical approach?',a:'Treat this as MDR-risk HAP/VAP. Review the separate HPUSM late-onset and MSIC MDR-risk source cards, prior microbiology, local susceptibility and need for MRSA/MDR Gram-negative coverage.',open:'hap-vap'},
    {q:'Why should meropenem maintenance dosing be reconsidered when CrCl falls, while an initial loading dose may still be required?',a:'Critical illness changes volume of distribution while renal dysfunction changes clearance. The structured MSIC record preserves loading-dose plus renal-adjusted maintenance logic and prolonged infusion where cited.',drug:'meropenem'},
    {q:'A CRE isolate is reported. What information is still needed before selecting definitive therapy?',a:'Infection versus colonisation/contamination, infection site, severity, full susceptibility/MIC data and—when available—the carbapenemase mechanism such as NDM/MBL, KPC or OXA-48-like.',res:'cre'},
    {q:'What should happen at 48–72 hours after empirical antimicrobial initiation?',a:'Reassess the diagnosis, review cultures, narrow or stop therapy where appropriate, confirm source control, review dosing/organ function and establish duration/stop date.',tool:'rounds'},
    {q:'Why is the spectrum explorer not a susceptibility report?',a:'Expected spectrum is a class/drug reference only. The Wellington source itself cautions that local susceptibility and isolate-specific results vary and should guide definitive therapy.',tool:'spectrum'}
  ];
  $('#main').innerHTML=`${toolHeader('Teaching cases','Quick source-grounded revision; reveal the reasoning after answering')}<div class="list">${cases.map((c,i)=>`<details class="card teaching-details"><summary><b>Case ${i+1}</b><div class="small" style="margin-top:6px">${esc(c.q)}</div></summary><div class="notice good" style="margin-top:10px"><b>Answer / reasoning</b><br>${esc(c.a)}</div><div class="btn-row">${c.open?`<button class="secondary-btn" data-open="condition" data-id="${c.open}">Open syndrome</button>`:''}${c.drug?`<button class="secondary-btn" data-open="drug" data-id="${c.drug}">Open drug</button>`:''}${c.res?`<button class="secondary-btn" data-open="resistance" data-id="${c.res}">Open resistance</button>`:''}${c.tool?`<button class="secondary-btn" data-tool="${c.tool}">Open tool</button>`:''}</div></details>`).join('')}</div><div class="notice">Cases are derived from the structured database and are intended for revision, not patient-specific prescribing.</div>${footer()}`;
}

function toolNAG(){
  const n=state.nag||{};
  $('#main').innerHTML=`${toolHeader('Current NAG topic index','Live MOH links; NAG page text is not redistributed in this public GitHub package')}<div class="notice warn"><b>Official online source.</b> MOH states the 4th Edition NAG is online-only so users receive periodic updates. Latest update shown by the official site at this build: <b>${esc(n.latestUpdate||'check live site')}</b>. Topic index last checked ${esc(n.lastChecked||'') || 'during build'}.</div><div class="btn-row"><a class="primary-btn" href="${esc(n.sourceUrl||'https://sites.google.com/moh.gov.my/nag')}" target="_blank" rel="noopener">Open official NAG ↗</a>${n.whatsNewUrl?`<a class="secondary-btn" href="${esc(n.whatsNewUrl)}" target="_blank" rel="noopener">What's new ↗</a>`:''}</div><div class="field" style="margin-top:12px"><input id="nagFilter" placeholder="Search NAG topics…"></div><div id="nagList" class="list" style="margin-top:10px">${nagRows(state.nag.topics.slice(0,30))}</div>${footer()}`;
  $('#nagFilter').addEventListener('input',e=>{const q=slug(e.target.value);const f=state.nag.topics.filter(x=>slug(x.title+' '+x.section).includes(q)).slice(0,60);$('#nagList').innerHTML=nagRows(f)});
}
function toolSources(){
  const ids=['hpusm','nag','msic','msidc','preg','wellington'];
  $('#main').innerHTML=`${toolHeader('Sources & app','Source provenance is part of every clinical record')}<div class="card"><h3>Default display hierarchy</h3><ol class="small"><li>HPUSM ASP 2025 — local guidance where applicable</li><li>Current Malaysia NAG — official live online source</li><li>MSIC Adult ICU 2023 — ICU dosing, PK/PD, RRT, TDM and special populations</li><li>MSIDC MDR Gram-Negative 2024 — dedicated MDR mechanism/phenotype guidance</li><li>Wellington ICU spectrum chart — rapid expected-spectrum reference only</li></ol><div class="notice">Dedicated guidance may outrank the general hierarchy for its own domain, especially MSIDC for MDR Gram-negative infections. The app keeps source-specific recommendations separate rather than silently reconciling them.</div></div><div class="list">${ids.map(id=>{const s=source(id);return `<button class="list-row" data-source="${esc(id)}"><div class="grow"><strong>${esc(s.name)}</strong><small>${esc(s.note||'')}</small></div><span class="chev">›</span></button>`}).join('')}</div><div class="notice warn"><b>Seed database.</b> This build implements the full app architecture and core high-yield ICU content, but it is not yet a complete transcription of every drug and every disease chapter from all references.</div>${footer()}`;
}
function nagRows(a){return a.map(x=>`<a class="list-row" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(x.title)}</strong><small>Current NAG · ${esc(x.section)}</small></div><span class="chev">↗</span></a>`).join('')||'<div class="empty"><b>No NAG topic match</b></div>'}

function back(){
  if(state.lastView?.type && state.lastView.type!=='synthesis'){renderDirectory(state.lastView.type==='condition'?'condition':state.lastView.type==='drug'?'drug':'mixed');} else renderHome();
}

function bindGlobal(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;const b=$('#installBtn');if(b)b.hidden=false;});
  window.addEventListener('appinstalled',()=>{state.installPrompt=null;const b=$('#installBtn');if(b)b.hidden=true;toast('ABX Critical installed');});
  window.addEventListener('online',()=>toast('Back online'));
  window.addEventListener('offline',()=>toast('Offline mode — cached reference remains available'));
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a'); if(!b)return;
    if(b.matches('[data-close-modal]')) return closeModal();
    if(b.dataset.nav){ if(b.dataset.nav==='home')renderHome();else if(b.dataset.nav==='diseases')renderDirectory('condition');else if(b.dataset.nav==='drugs')renderDirectory('drug');else if(b.dataset.nav==='organisms')renderDirectory('mixed');else renderTools(); return; }
    if(b.dataset.go==='home'){renderHome();return}
    if(b.hasAttribute('data-back')){back();return}
    if(b.dataset.mode){state.mode=b.dataset.mode;applyMode();toast(`${state.mode==='icu'?'ICU':'Standard'} mode`); if(state.lastView?.type==='drug'||state.lastView?.type==='condition') renderEntity(state.lastView.type,state.lastView.id); else if(state.nav==='home') renderHome(); return}
    if(b.id==='themeBtn'){state.theme=state.theme==='dark'?'light':'dark';applyTheme();return}
    if(b.id==='installBtn'){if(state.installPrompt){state.installPrompt.prompt();state.installPrompt.userChoice.finally(()=>{state.installPrompt=null;b.hidden=true})}return}
    if(b.dataset.query){const q=b.dataset.query;const inp=$('#universalSearch');if(inp){inp.value=q;renderLiveSearch(q)}return}
    if(b.dataset.hitType){if(b.dataset.hitType==='nag'){window.open(b.dataset.hitUrl,'_blank','noopener');return}renderEntity(b.dataset.hitType,b.dataset.hitId);return}
    if(b.dataset.open){renderEntity(b.dataset.open,b.dataset.id);return}
    if(b.dataset.tool){if(b.dataset.tool==='back-tools'){renderTools();return}const opts={drug:b.dataset.drug,crcl:b.dataset.crcl,rrt:b.dataset.rrt};renderTool(b.dataset.tool,opts);return}
    if(b.dataset.source){openSource(b.dataset.source);return}
    if(b.dataset.sourceRef){const r=JSON.parse(decodeURIComponent(b.dataset.sourceRef));openSource(r.source,r);return}
    if(b.dataset.favType){toggleFav(b.dataset.favType,b.dataset.favId,b.dataset.favName);return}
    if(b.dataset.recentType){renderEntity(b.dataset.recentType,b.dataset.recentId);return}
    if(b.dataset.synthesis){renderSynthesis(b.dataset.synthesis);return}
    if(b.dataset.jump){$(b.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'});return}
    if(b.dataset.roundDel){const a=getRounds().filter(x=>String(x.id)!==String(b.dataset.roundDel));setRounds(a);toolRounds();return}
  });
  document.addEventListener('change',e=>{
    const c=e.target;
    if(c.matches('[data-round-check]')){const a=getRounds();const x=a.find(r=>String(r.id)===String(c.dataset.roundCheck));if(x){x.checks=x.checks||{};x.checks[c.dataset.checkIndex]=c.checked;setRounds(a)}}
  });
  document.addEventListener('input',e=>{ if(e.target.id==='universalSearch')renderLiveSearch(e.target.value); });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape')closeModal();
    if(e.key==='Enter'&&e.target.id==='universalSearch'){const q=e.target.value.trim();if(q)renderSynthesis(q)}
  });
  document.addEventListener('click',e=>{if(e.target.id==='searchGo'){const q=$('#universalSearch')?.value.trim();if(q)renderSynthesis(q)}});
}

async function init(){
  applyTheme(); applyMode(); bindGlobal();
  try{
    const [db,nag]=await Promise.all([loadDataset('./data/clinical-data.json','clinical'),loadDataset('./data/nag-topics.json','nag')]); state.db=db;state.nag=nag;renderHome();
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('App update ready — reopen to refresh')})})}).catch(()=>{});
  }catch(e){
    $('#main').innerHTML=`<div class="empty"><b>Unable to load clinical database</b>${esc(e.message)}<br><br>Serve the folder through HTTPS/localhost rather than opening index.html directly.</div>`;
  }
}
init();
