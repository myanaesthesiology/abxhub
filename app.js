'use strict';

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];
const esc = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const slug = s => String(s||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const uniq = arr => [...new Set(arr.filter(Boolean))];

function storedJSON(primary, legacy, fallback=[]){
  try { const raw=localStorage.getItem(primary) ?? (legacy?localStorage.getItem(legacy):null); return raw?JSON.parse(raw):fallback; } catch(e){ return fallback; }
}
function storedText(primary, legacy, fallback=''){ return localStorage.getItem(primary) || (legacy?localStorage.getItem(legacy):null) || fallback; }
const state = {
  db:null, nag:null, nav:'home',
  theme:storedText('abxhub-theme','abx-theme',matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'),
  favorites:storedJSON('abxhub-favorites','abx-favorites',[]),
  recent:storedJSON('abxhub-recent','abx-recent',[]),
  lastView:null, installPrompt:null, restoringHistory:false, currentRoute:null
};

function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(()=>t.classList.remove('show'),1800); }
function applyTheme(){ document.documentElement.dataset.theme=state.theme; localStorage.setItem('abxhub-theme',state.theme); }
function modeLens(){ return ''; }
function navActive(){ $$('[data-nav]').forEach(b=>b.classList.toggle('active', b.dataset.nav===state.nav)); }

function sameRoute(a,b){ try{return JSON.stringify(a)===JSON.stringify(b)}catch(e){return false} }
function rememberScroll(){
  const st=history.state;
  if(st?.abxRoute) history.replaceState({...st,scrollY:window.scrollY},'');
}
function recordRoute(route){
  state.currentRoute=route;
  if(state.restoringHistory) return;
  const st=history.state;
  if(st?.abxRoute && sameRoute(st.abxRoute,route)) return;
  if(st?.abxRoute){ rememberScroll(); history.pushState({abxRoute:route,scrollY:0},''); }
  else history.replaceState({abxRoute:route,scrollY:0},'');
}
function restoreRoute(route,scrollY=0){
  if(!route) return;
  state.restoringHistory=true;
  try{
    if(route.view==='home') renderHome();
    else if(route.view==='directory') renderDirectory(route.kind);
    else if(route.view==='tools') renderTools();
    else if(route.view==='tool') renderTool(route.id,route.opts||{});
    else if(route.view==='synthesis') renderSynthesis(route.q||'');
    else if(route.view==='entity') renderEntity(route.type,route.id);
    else renderHome();
  } finally {
    state.restoringHistory=false;
    state.currentRoute=route;
    requestAnimationFrame(()=>scrollTo(0,Number(scrollY)||0));
  }
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
function nagSnapshot(){ return state.db?.nagSnapshot || {officialLatestUpdate:state.nag?.latestUpdate, snapshotReviewed:state.nag?.lastChecked, sourceUrl:state.nag?.sourceUrl, whatsNewUrl:state.nag?.whatsNewUrl}; }
function currentNagLinks(entity){
  const hits=nagMatches(entity); const n=nagSnapshot();
  if(!hits.length) return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Check current NAG</h3>${sourcePill('nag')}</div><p class="small muted">NAG recommendations are structured inside this PWA for offline search. These official MOH links are retained as the freshness check because NAG is periodically updated online.</p><div class="list">${hits.map(x=>`<a class="list-row" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(x.title)}</strong><small>Official NAG · ${esc(x.section)}</small></div><span class="chev">↗</span></a>`).join('')}</div><div class="tiny muted" style="margin-top:8px">Structured snapshot reviewed ${esc(n.snapshotReviewed||'during build')} · official latest noted ${esc(n.officialLatestUpdate||'check live')}</div></div>`;
}

// IndexedDB cache: JSON datasets are fetched normally, then copied locally. If a network/cache fetch fails,
// the application can still load the last successful structured dataset from IndexedDB.
function idbOpen(){
  return new Promise((resolve,reject)=>{
    const r=indexedDB.open('abxhub-db',1);
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
  const s=source(id);
  const live=ref.url || s.url;
  const pdf=ref.pdfUrl || s.pdfUrl;
  const pdfPage=ref.pdfPage || ref.page;
  const pdfHref=pdf ? `${pdf}${pdfPage?`#page=${encodeURIComponent(pdfPage)}`:''}` : '';
  const bundledPdf=!!(pdf && String(pdf).startsWith('./references/'));
  openModal(s.name, `
    <div class="tag-row">${sourcePill(id)}${s.year?`<span class="pill">${esc(s.year)}</span>`:''}${pdf?`<span class="pill good-pill">${bundledPdf?'Bundled PDF':'Official PDF'}</span>`:''}</div>
    <h3 style="margin-bottom:4px">${esc(s.full||s.name)}</h3>
    <p class="small muted">${esc(s.note||'')}</p>
    ${ref.page?`<div class="notice"><b>Referenced location</b><br>Source page ${esc(ref.page)}${ref.pdfPage?` · PDF page ${esc(ref.pdfPage)}`:''}</div>`:''}
    ${id==='nag'?`<div class="notice warn"><b>Offline structured NAG + live verification:</b> NAG-derived records participate fully in this PWA, while the official MOH site remains the freshness authority for later updates.</div>`:''}
    <div class="btn-row">
      ${pdfHref?`<a class="primary-btn" href="${esc(pdfHref)}" target="_blank" rel="noopener">Open ${bundledPdf?'bundled':'official'} PDF${pdfPage?` · page ${esc(pdfPage)}`:''} ↗</a>`:''}
      ${live?`<a class="secondary-btn" href="${esc(live)}" target="_blank" rel="noopener">${id==='nag'?'Check latest official NAG':'Open official/source site'} ↗</a>`:''}
    </div>
    ${!pdf && !live?`<div class="notice">No bundled or live source link is configured for this record.</div>`:''}
  `);
}

function openModal(title,body){ $('#modalTitle').textContent=title; $('#modalBody').innerHTML=body; $('#modal').classList.add('open'); $('#modal').setAttribute('aria-hidden','false'); }
function closeModal(){ $('#modal').classList.remove('open'); $('#modal').setAttribute('aria-hidden','true'); }

function pageHeader(title,sub=''){
  return `<div class="section-head" style="margin-top:2px"><div><h2 style="font-size:20px">${esc(title)}</h2>${sub?`<p>${esc(sub)}</p>`:''}</div></div>`;
}
function footer(){
  const m=state.db.meta;
  return `<div class="source-footer"><b>${esc(m.appName)} ${esc(m.version)}</b> · Clinical DB ${esc(m.dbVersion)}<br>${esc(m.disclaimer)}<br>NAG is structured for offline search; use its official MOH link to check for updates after the stored snapshot.</div>`;
}

function renderHome(){
  recordRoute({view:'home'});
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
      <button class="pill nag" data-tool="nag">NAG structured · latest noted ${esc(nagMeta.latestUpdate||nagSnapshot().officialLatestUpdate||'check live')} ↗</button>
    </div>

    <div class="section-head"><div><h2>Clinical shortcuts</h2><p>Designed for rounds, bedside decisions and training</p></div></div>
    <div class="cards">
      ${quick('∑','Patient dose','CrCl, IBW/AdjBW and renal context','dose')}
      ${quick('↻','Renal / RRT','CrCl, HD and CRRT dose reference','renal')}
      ${quick('◎','TDM','Vancomycin & aminoglycoside monitoring','tdm')}
    </div>

    <div class="section-head"><div><h2>Stewardship</h2><p>Turn references into a repeatable ICU workflow</p></div></div>
    <div class="cards">
      ${quick('48h','AMS review','48–72 h de-escalation checklist','rounds')}
      ${quick('⇄','IV → PO','Eligibility and syndrome exclusions','ivpo')}
      ${quick('≈','Spectrum','Interactive expected-spectrum explorer','spectrum')}
      ${quick('≡','Compare','Compare up to 5 antimicrobials','compare')}
    </div>

    ${favorites.length?`<div class="section-head"><div><h2>Favourites</h2><p>Saved locally on this device</p></div></div><div class="list">${favorites.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>★ ${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}

    ${recent.length?`<div class="section-head"><div><h2>Recent</h2></div></div><div class="list">${recent.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}

    <div class="notice warn"><b>Source priority ≠ automatic truth.</b> Local HPUSM guidance is shown first where applicable, NAG participates as a structured national source with a live update-check link, and dedicated MSIDC guidance is highlighted for MDR Gram-negative organisms. Conflicting regimens remain visibly source-specific.</div>
    ${footer()}`;
  $('#universalSearch').focus({preventScroll:true});
}
function quick(icon,title,sub,tool){ return `<button class="quick-card" data-tool="${tool}"><div class="qicon">${icon}</div><strong>${esc(title)}</strong><small>${esc(sub)}</small></button>`; }

function allSearchItems(){
  const items=[];
  state.db.drugs.forEach(x=>{const p=x.clinicalProfile||{};const bb=p.blueBook?.entries||[];const prep=p.preparation||{}, fluid=p.fluidRestrictedPreparation||{};const searchable=[x.class,x.quickDose,p.mechanism,...(p.adverseEffects||[]),...(p.precautions||[]),...(p.contraindications||[]),...(p.interactions||[]),...bb.flatMap(e=>[e.indications,e.dose,e.adverseReactions,e.contraindications,e.interactions,e.precautions,e.category,e.restriction]),p.paediatric?.dose,...((p.paediatric?.nagCurrent||[]).flatMap(e=>[e.label,e.dose,e.context])),prep.reconstitution,prep.dilution,prep.diluent,prep.administration,prep.stability,prep.compatibility,prep.comments,fluid.reconstitution,fluid.dilution,fluid.diluent,fluid.administration,fluid.stability,fluid.comments].filter(Boolean).join(' ');items.push({type:'drug',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.class,searchable});});
  state.db.conditions.forEach(x=>items.push({type:'condition',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.category,searchable:[x.summary,x.diseaseMechanism,...(x.diagnosticMicrobiology||[])].filter(Boolean).join(' ')}));
  state.db.organisms.forEach(x=>{const m=x.microbiology||{};items.push({type:'organism',id:x.id,name:x.name,aliases:x.aliases||[],sub:x.gram,searchable:[m.familyOrGroup,m.morphology,m.reservoirTransmission,m.pathogenesis,m.resistanceSummary,...(m.commonDiseases||[])].filter(Boolean).join(' ')});});
  state.db.resistance.forEach(x=>items.push({type:'resistance',id:x.id,name:x.name,aliases:x.aliases||[],sub:'Resistance / phenotype',searchable:[x.summary,...(x.sourceCards||[]).flatMap(s=>[s.title,s.text,...(s.bullets||[])])].filter(Boolean).join(' ')}));
  // Official NAG topic links remain searchable as a freshness/navigation layer; structured NAG content lives in normal drug/condition entities above.
  (state.nag?.topics||[]).forEach((x,i)=>items.push({type:'naglink',id:String(i),name:x.title,aliases:[],sub:`Official NAG link · ${x.section}`,url:x.url}));
  return items;
}
function scoreItem(item,q){
  const nq=slug(q), tokens=nq.split(' ').filter(Boolean), names=[item.name,...(item.aliases||[])].map(slug);
  let score=0;
  for(const n of names){ if(n===nq) score=Math.max(score,120); if(n.startsWith(nq)) score=Math.max(score,90); if(n.includes(nq)) score=Math.max(score,70); const hit=tokens.filter(t=>n.includes(t)).length; score=Math.max(score,hit*18); }
  if(slug(item.sub).includes(nq)) score=Math.max(score,40);
  const hay=slug(item.searchable||''); if(hay.includes(nq)) score=Math.max(score,55); else {const hit=tokens.filter(t=>t.length>2&&hay.includes(t)).length; score=Math.max(score,hit*12);}
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
  recordRoute({view:'synthesis',q});
  const s=parseSynthesis(q); state.lastView={type:'synthesis',id:q};
  const cond=s.entities.find(e=>e.type==='condition'); const drug=s.entities.find(e=>e.type==='drug'); const org=s.entities.find(e=>e.type==='organism'); const res=s.entities.find(e=>e.type==='resistance');
  const c=cond&&state.db.conditions.find(x=>x.id===cond.id); const d=drug&&state.db.drugs.find(x=>x.id===drug.id); const rr=d?.renalKey&&state.db.renal[d.renalKey];
  let dose='';
  if(d && rr && (s.crcl!=null || s.rrt)) dose=renalResultHTML(d,rr,s.crcl,s.rrt);
  $('#main').innerHTML=`
    <div class="entity-title"><button class="back-btn" data-back>‹</button><div class="grow"><h1>Clinical synthesis</h1><p>${esc(q)}</p></div></div>
    <section class="synthesis"><h3>Recognised context</h3><div class="token-row">${s.tokens.map(t=>`<span class="token">${esc(t)}</span>`).join('')||'<span class="muted small">No structured context recognised.</span>'}</div></section>
    ${c?`<div class="card"><h3>${esc(c.name)}</h3><p>${esc(c.summary)}</p><div class="btn-row"><button class="primary-btn" data-open="condition" data-id="${c.id}">Open syndrome pathway</button></div></div>`:''}
    ${org?`<div class="card"><h3>Organism: ${esc(org.name)}</h3><p>${esc(state.db.organisms.find(x=>x.id===org.id)?.gram||'')}</p><button class="secondary-btn" data-open="organism" data-id="${org.id}">Organism view</button></div>`:''}
    ${res?`<div class="card"><h3>Resistance: ${esc(res.name)}</h3><p>${esc(state.db.resistance.find(x=>x.id===res.id)?.summary||'')}</p><button class="secondary-btn" data-open="resistance" data-id="${res.id}">Resistance view</button></div>`:''}
    ${d?`<div class="card"><h3>Drug: ${esc(d.name)}</h3><p>${esc(d.quickDose)}</p><button class="secondary-btn" data-open="drug" data-id="${d.id}">Drug monograph</button></div>`:''}
    ${dose}
    ${s.pregnancy&&d?pregnancyBox(d):''}
    ${s.pregnancy&&c&&!d?pregnancyCandidatesHTML(c):''}
    ${c?beforeBox(c.before):''}
    ${c?recommendationsHTML(c):''}
    <div class="notice warn"><b>Clinical synthesis is rule-based, not generative prescribing.</b> It links structured source records and patient modifiers. Verify susceptibility, current NAG/local policy, organ function and source control before treatment.</div>
    ${footer()}`;
  scrollTo(0,0);
}

function addRecent(type,id,name){
  state.recent=[{type,id,name},...state.recent.filter(x=>!(x.type===type&&x.id===id))].slice(0,8); save('abxhub-recent',state.recent);
}
function isFav(type,id){ return state.favorites.some(x=>x.type===type&&x.id===id); }
function toggleFav(type,id,name){
  if(isFav(type,id)) state.favorites=state.favorites.filter(x=>!(x.type===type&&x.id===id)); else state.favorites.unshift({type,id,name});
  save('abxhub-favorites',state.favorites); toast(isFav(type,id)?'Saved to favourites':'Removed from favourites'); renderEntity(type,id);
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
  const p=d.pregnancy;
  const ref={source:p.source,page:p.page,pdfPage:p.pdfPage,url:p.url,pdfUrl:p.pdfUrl};
  const current=(p.currentNagNotes||[]).map(x=>`<div class="notice good"><b>Current NAG context:</b> ${esc(x.text||'')}${x.url?`<div class="btn-row"><a class="secondary-btn" href="${esc(x.url)}" target="_blank" rel="noopener">Check indication-specific NAG ↗</a></div>`:''}</div>`).join('');
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Pregnancy / lactation</h3>${sourcePill(p.source)}</div><div class="form-grid"><div class="result-box"><strong>Pregnancy</strong><div class="small" style="margin-top:4px">Legacy category: ${esc(p.category)}</div></div><div class="result-box"><strong>Lactation</strong><div class="small" style="margin-top:4px">${esc(p.lactation)}</div></div></div>${p.note?`<div class="notice warn">${esc(p.note)}</div>`:''}${current}<div class="notice warn">The Appendix 4 table uses legacy FDA pregnancy categories. AbxHub preserves the source wording and does not convert it into a modern universal pregnancy-risk class. Interpret with gestation, indication, alternatives and current product/specialist information.</div><button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify(ref))}'>${refText(ref)} · check latest ↗</button></div>`;
}
function pregnancyCandidatesHTML(c){
  if(!c) return '';
  const text=(c.recommendations||[]).flatMap(r=>[...(r.preferred||[]),...(r.alternative||[])]).join(' ').toLowerCase();
  const hits=state.db.drugs.filter(d=>d.pregnancy && (text.includes(d.name.toLowerCase()) || (d.aliases||[]).some(a=>a.length>3&&text.includes(a.toLowerCase())))).slice(0,10);
  if(!hits.length) return `<div class="card"><h3>Pregnancy considerations</h3><p class="small muted">This syndrome has no directly matched pregnancy-labelled drug record in the current structured set. Open the NAG pregnancy appendix and syndrome source before prescribing.</p><a class="secondary-btn" href="${esc(nagSnapshot().pregnancyUrl||'https://sites.google.com/moh.gov.my/nag/appendices/appendix-4-antibiotic-in-pregnancy-lactation')}" target="_blank" rel="noopener">Check NAG pregnancy appendix ↗</a></div>`;
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Pregnancy cross-check for agents appearing in this pathway</h3>${sourcePill('nag')}</div><div class="list">${hits.map(d=>`<button class="list-row" data-open="drug" data-id="${d.id}"><div class="grow"><strong>${esc(d.name)}</strong><small>Legacy pregnancy category ${esc(d.pregnancy.category)} · ${esc(d.pregnancy.lactation)}</small></div><span class="chev">›</span></button>`).join('')}</div><div class="notice warn">This is a cross-reference, not an automatic pregnancy recommendation. Gestation, indication and alternatives still determine the decision.</div></div>`;
}


function refButtons(refs=[]){
  return refs.length?`<div class="tag-row">${refs.map(x=>`<button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify(x))}'>${refText(x)}</button>`).join('')}</div>`:'';
}
function prepCardHTML(prep,title='Standard preparation / dilution',tone=''){
  if(!prep) return '';
  const src=prep.ref?.source||'dailymed';
  return `<div class="card ${tone}"><div class="source-meta"><h3 style="margin-right:auto">${esc(title)}</h3>${sourcePill(src)}</div>
    ${prep.reconstitution?`<div class="prep-row"><b>Reconstitution</b><span>${esc(prep.reconstitution)}</span></div>`:''}
    ${prep.dilution?`<div class="prep-row"><b>Dilution</b><span>${esc(prep.dilution)}</span></div>`:''}
    ${prep.diluent?`<div class="prep-row"><b>Diluent</b><span>${esc(prep.diluent)}</span></div>`:''}
    ${prep.administration?`<div class="prep-row"><b>Administration</b><span>${esc(prep.administration)}</span></div>`:''}
    ${prep.stability?`<div class="prep-row"><b>Stability</b><span>${esc(prep.stability)}</span></div>`:''}
    ${prep.compatibility?`<div class="prep-row"><b>Compatibility / incompatibility</b><span>${esc(prep.compatibility)}</span></div>`:''}
    ${prep.comments?`<div class="notice">${esc(prep.comments)}</div>`:''}
    ${prep.sourceStatus?`<div class="tiny muted" style="margin-top:8px">${esc(prep.sourceStatus)}</div>`:''}
    <div class="notice warn"><b>Source-specific preparation:</b> dilution, stability and compatibility may vary by product/formulation. If the product used differs from the cited source, check its current product information.</div>
    ${prep.ref?`<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify(prep.ref))}'>Open dilution source ↗</button>`:''}
  </div>`;
}
function preparationHTML(p){
  const prep=p?.preparation, fluid=p?.fluidRestrictedPreparation;
  let out='';
  if(prep) out+=prepCardHTML(prep,'Standard preparation / dilution');
  else if(p?.preparationIndex){
    const sid=p.preparationIndex.source||'sabah-dilution';
    out+=`<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Preparation / dilution</h3>${sourcePill(sid)}</div><p class="small">${esc(p.preparationIndex.status||'Preparation source not yet structured.')}</p>${p.preparationIndex.url?`<a class="secondary-btn" href="${esc(p.preparationIndex.url)}" target="_blank" rel="noopener">Open source ↗</a>`:''}</div>`;
  }
  if(fluid) out+=`<div class="notice warn"><b>Fluid-restricted ICU option:</b> the following is a special minimum-volume strategy for critically ill adults when usual dilution volumes are not feasible. It does not replace the standard preparation instructions.</div>${prepCardHTML(fluid,'Fluid-restricted ICU option','fluid-prep')}`;
  return out;
}
function drugProfileHTML(d){
  const p=d.clinicalProfile; if(!p) return '';
  const prep=p.preparation; const formulary=p.formulary; const bb=p.blueBook; const paed=p.paediatric;
  const blueRows=(bb?.entries||[]).map(e=>`<div class="source-card"><div class="source-meta">${sourcePill('bluebook')}<span class="pill">${esc(e.formulation||e.genericName||'Formulary entry')}</span></div>${e.brandName?`<div class="prep-row"><b>Brand in snapshot</b><span>${esc(e.brandName)}</span></div>`:''}${e.category?`<div class="prep-row"><b>Prescriber category</b><span>${esc(e.category)}</span></div>`:''}${e.indications?`<div class="prep-row"><b>Indications</b><span>${esc(e.indications)}</span></div>`:''}${e.dose?`<div class="prep-row"><b>Dose</b><span>${esc(e.dose)}</span></div>`:''}${e.adverseReactions?`<details><summary><b>Adverse reactions</b></summary><p class="small">${esc(e.adverseReactions)}</p></details>`:''}${e.contraindications?`<details><summary><b>Contraindications</b></summary><p class="small">${esc(e.contraindications)}</p></details>`:''}${e.interactions?`<details><summary><b>Interactions</b></summary><p class="small">${esc(e.interactions)}</p></details>`:''}${e.precautions?`<details><summary><b>Precautions</b></summary><p class="small">${esc(e.precautions)}</p></details>`:''}<div class="prep-row"><b>Restriction</b><span>${esc(e.restriction||'None stated')}</span></div>${e.neml?`<div class="prep-row"><b>NEML</b><span>${esc(e.neml)}</span></div>`:''}</div>`).join('');
  return `<div class="card drug-profile"><h3>Pharmacology & safety</h3>
    <details open><summary><b>Mechanism of action</b></summary><p class="small">${esc(p.mechanism||'Not yet structured.')}</p></details>
    ${p.adverseEffects?.length?`<details><summary><b>Important adverse effects — clinical summary</b></summary><ul>${p.adverseEffects.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${p.precautions?.length?`<details><summary><b>Precautions / monitoring — clinical summary</b></summary><ul>${p.precautions.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${p.contraindications?.length?`<details><summary><b>Contraindications — clinical summary</b></summary><ul>${p.contraindications.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${p.interactions?.length?`<details><summary><b>Interactions — clinical summary</b></summary><ul>${p.interactions.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}
    ${blueRows?`<details><summary><b>Blue Book formulary & safety snapshot</b> ${sourcePill('bluebook')}</summary><div class="notice warn">Offline snapshot from the APK supplied for this build. For current MOH formulary category/restrictions, check live MyFormulary/FUKKM.</div>${blueRows}<div class="btn-row"><a class="secondary-btn" href="https://myformulary.pharmacy.gov.my/" target="_blank" rel="noopener">Check current MyFormulary ↗</a></div></details>`:`<details><summary><b>Blue Book formulary snapshot</b> ${sourcePill('bluebook')}</summary><div class="notice">${esc(bb?.note||'No matching Blue Book record in the supplied snapshot.')}</div><a class="secondary-btn" href="https://myformulary.pharmacy.gov.my/" target="_blank" rel="noopener">Check current MyFormulary ↗</a></details>`}
    ${formulary&&!blueRows?`<details><summary><b>MOH formulary / restriction</b></summary>${formulary.category?`<div class="prep-row"><b>Prescriber category</b><span>${esc(formulary.category)}</span></div>`:''}${formulary.indications?`<div class="prep-row"><b>Listed indication(s)</b><span>${esc(formulary.indications)}</span></div>`:''}${formulary.restriction?`<div class="prep-row"><b>Restriction</b><span>${esc(formulary.restriction)}</span></div>`:''}${formulary.dose?`<div class="prep-row"><b>Formulary dose</b><span>${esc(formulary.dose)}</span></div>`:''}<p class="small muted">${esc(formulary.status||'Check current MyFormulary/FUKKM.')}</p></details>`:''}
    ${paed?`<details><summary><b>Paediatric / neonatal dose cross-check</b> ${sourcePill('shann')} ${(paed.nagCurrent||[]).length?sourcePill('nag'):''}</summary>${paed.unavailable?`<div class="notice">${esc(paed.note||'No direct DrugDoses v5.5 match.')}</div>`:`<div class="prep-row"><b>Frank Shann DrugDoses v5.5</b><span>${esc(paed.dose||'')}</span></div>`}${paed.blueBookDose?`<details><summary><b>Blue Book/FUKKM dose field for comparison</b></summary><p class="small">${esc(paed.blueBookDose)}</p></details>`:''}${(paed.nagCurrent||[]).length?`<div class="notice good"><b>Current NAG cross-check:</b> population/indication-specific NAG regimens are kept separate from Frank Shann rather than merged.</div>${paed.nagCurrent.map(e=>`<div class="source-card"><div class="source-meta">${sourcePill('nag')}<span class="pill">${esc(e.label||'NAG paediatric')}</span></div><div class="prep-row"><b>Dose / regimen</b><span>${esc(e.dose||'')}</span></div>${e.context?`<p class="small muted">${esc(e.context)}</p>`:''}${e.url?`<a class="secondary-btn" href="${esc(e.url)}" target="_blank" rel="noopener">Check latest official NAG ↗</a>`:''}</div>`).join('')}`:''}<div class="notice warn">${esc(paed.note||'Cross-check only. Confirm age/gestation, indication, organ function and current local protocol.')}</div></details>`:''}
    ${refButtons(p.refs||[])}
  </div>
  ${preparationHTML(p)}`;
}

function clinicalReconciliationHTML(d){
  const rows=d.clinicalProfile?.clinicalReconciliation||[]; if(!rows.length)return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">High-risk clinical reconciliation</h3><span class="pill mdr">SOURCE-SPECIFIC</span></div>${rows.map(x=>`<details><summary><b>${esc(x.title||'Clinical reconciliation')}</b> <span class="pill">${esc(x.status||'REVIEW')}</span></summary><p class="small">${esc(x.summary||'')}</p>${x.points?.length?`<ul>${x.points.map(v=>`<li class="small">${esc(v)}</li>`).join('')}</ul>`:''}${refButtons(x.refs||[])}</details>`).join('')}<div class="notice warn"><b>Reconciliation does not mean automatic prescribing.</b> These cards preserve where high-risk sources agree, differ, or require a local protocol. Patient-specific indication, susceptibility, organ support, TDM and current pharmacy/ID policy still apply.</div></div>`;
}
function specialPopulationHTML(d){
  const keys=d.clinicalProfile?.specialPopulationKeys||[]; if(!keys.length)return '';
  const rows=keys.map(k=>{const x=state.db.specialPopulations?.[k]; if(!x)return ''; const s=source(x.source); return `<details><summary><b>${esc(x.name)}</b> <span class="pill">${esc(s.short)}</span></summary><p class="small">${esc(x.summary||'')}</p>${x.principles?.length?`<ul>${x.principles.map(v=>`<li class="small">${esc(v)}</li>`).join('')}</ul>`:''}${x.page?`<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:x.source,page:x.page,pdfPage:x.pdfPage}))}'>${refText({source:x.source,page:x.page,pdfPage:x.pdfPage})} ↗</button>`:''}</details>`}).join('');
  return `<div class="card"><h3>Special populations / altered PK</h3>${rows}<div class="notice warn">These are source-linked considerations, not automatic dose changes. Apply the drug-specific syndrome, renal/RRT and TDM recommendation where available.</div></div>`;
}

function organismMicrobiologyHTML(o){
  const m=o.microbiology; if(!m) return '';
  return `<div class="card"><h3>Microbiology & pathogenesis</h3>
    <dl class="profile-dl"><dt>Family / group</dt><dd>${esc(m.familyOrGroup||'')}</dd>${m.morphology?`<dt>Morphology / key features</dt><dd>${esc(m.morphology)}</dd>`:''}<dt>Reservoir / transmission</dt><dd>${esc(m.reservoirTransmission||'')}</dd><dt>How it harms the host</dt><dd>${esc(m.pathogenesis||'')}</dd>${m.resistanceSummary?`<dt>Resistance relevance</dt><dd>${esc(m.resistanceSummary)}</dd>`:''}</dl>
    ${m.commonDiseases?.length?`<h4>Typical clinical disease</h4><div class="tag-row">${m.commonDiseases.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}
    ${m.clinicalPearl?`<div class="notice"><b>Clinical pearl:</b> ${esc(m.clinicalPearl)}</div>`:''}
    ${refButtons(m.refs||[])}
  </div>`;
}
function conditionMicrobiologyHTML(c){
  if(!c.diseaseMechanism && !c.organisms?.length && !c.diagnosticMicrobiology?.length) return '';
  return `<div class="card"><h3>Microbiology / disease mechanism</h3>${c.diseaseMechanism?`<p class="small">${esc(c.diseaseMechanism)}</p>`:''}${c.diagnosticMicrobiology?.length?`<h4>Diagnostic microbiology</h4><ul>${c.diagnosticMicrobiology.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>`:''}
    ${c.organisms?.length?`<h4>Linked organisms</h4><div class="list">${c.organisms.map(id=>{const o=state.db.organisms.find(x=>x.id===id);return o?`<button class="list-row" data-open="organism" data-id="${o.id}"><div class="grow"><strong>${esc(o.name)}</strong><small>${esc(o.gram||'')}</small></div><span class="chev">›</span></button>`:''}).join('')}</div>`:''}
    ${refButtons(c.microbiologyRefs||[])}
  </div>`;
}

function renderDrug(id){
  recordRoute({view:'entity',type:'drug',id});
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
    <div id="pkpdSec" class="card"><h3>PK/PD & critical-care optimisation</h3><p>${esc(d.pkpd||'')}</p>${(d.warnings||[]).map(x=>`<div class="notice ${/not|risk|avoid|tox/i.test(x)?'warn':''}">${esc(x)}</div>`).join('')}</div>
    ${drugProfileHTML(d)}
    ${clinicalReconciliationHTML(d)}
    ${specialPopulationHTML(d)}
    ${pregnancyBox(d)}
    <div class="card"><h3>Where this drug appears</h3><div class="list">${(d.indications||[]).map(cid=>{const c=state.db.conditions.find(x=>x.id===cid)||state.db.resistance.find(x=>x.id===cid);return c?`<button class="list-row" data-open="${state.db.conditions.some(x=>x.id===cid)?'condition':'resistance'}" data-id="${cid}"><div class="grow"><strong>${esc(c.name)}</strong><small>Open linked clinical pathway</small></div><span class="chev">›</span></button>`:''}).join('')||'<span class="muted small">No linked pathway in the current structured database.</span>'}</div></div>
    ${currentNagLinks(d)}
    <div id="sourceSec" class="card"><h3>Sources</h3><div class="tag-row">${(d.refs||[]).map(r=>`<button class="pill ${r.source==='hpusm'?'local':r.source==='msidc'?'mdr':r.source==='msic'?'icu':''}" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div><div class="notice">Expected-spectrum visualization is a reference layer; isolate susceptibility and local epidemiology take precedence.</div></div>
    ${footer()}`;
  scrollTo(0,0);
}
function beforeBox(items=[]){ return `<div class="card"><h3>Before / with first dose</h3><div class="checklist">${items.map((x,i)=>`<label class="check-item"><input type="checkbox" /><span>${esc(x)}</span></label>`).join('')}</div></div>`; }
function recommendationsHTML(c){
  return `<div class="section-head"><div><h2>Empirical / targeted source cards</h2><p>Recommendations remain separated by guideline</p></div></div>${c.recommendations.map(r=>{
    const s=source(r.source); const cls=r.source==='hpusm'?'local':r.source==='nag'?'nag':r.source==='msidc'?'mdr':'';
    return `<article class="source-card ${cls}"><div class="source-meta">${sourcePill(r.source)}<span class="pill">${esc(r.label)}</span></div><h4>Preferred</h4><ul>${(r.preferred||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${r.alternative?.length?`<h4>Alternative / additional</h4><ul>${r.alternative.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${r.duration?`<div class="notice"><b>Duration / review:</b> ${esc(r.duration)}</div>`:''}${r.notes?.length?r.notes.map(x=>`<div class="notice">${esc(x)}</div>`).join(''):''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:r.source,page:r.page,pdfPage:r.pdfPage,url:r.url,pdfUrl:r.pdfUrl}))}'>${refText({source:r.source,page:r.page,pdfPage:r.pdfPage})} →</button></article>`;
  }).join('')}`;
}
function conditionReconciliationHTML(c){
  const rows=c.sourceReconciliation||[]; if(!rows.length)return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Source reconciliation</h3><span class="pill mdr">DO NOT AUTO-MERGE</span></div>${rows.map(x=>`<details><summary><b>${esc(x.title||'Source reconciliation')}</b> <span class="pill">${esc(x.status||'REVIEW')}</span></summary><p class="small">${esc(x.summary||'')}</p>${x.points?.length?`<ul>${x.points.map(v=>`<li class="small">${esc(v)}</li>`).join('')}</ul>`:''}${refButtons(x.refs||[])}</details>`).join('')}<div class="notice warn"><b>Why this is shown:</b> source-specific regimens may differ because of local epidemiology, publication date, syndrome definition, severity or intended population. AbxHub preserves those differences rather than generating an unsupported consensus prescription.</div></div>`;
}

function conditionDecisionAid(c){
  if(c.id!=='hap-vap') return '';
  return `<div class="card decision-aid"><h3>Rapid HAP/VAP risk screen</h3><p class="small muted">This screen surfaces the risk modifiers explicitly listed in the MSIC ICU source; it does not replace patient-specific microbiology or clinical judgement.</p><div class="checklist">${(c.riskFactors||[]).map((x,i)=>`<label class="check-item"><input type="checkbox" class="hap-risk" data-risk="${i}"><span>${esc(x)}</span></label>`).join('')}</div><div id="hapRiskOut" class="result-box"><strong>No MDR modifier selected</strong><div class="small" style="margin-top:4px">Review acquisition timing, clinical severity, prior cultures and current microbiology.</div></div></div>`;
}
function bindConditionDecisionAid(c){
  if(c.id!=='hap-vap') return;
  const inputs=$$('.hap-risk'); const out=$('#hapRiskOut');
  const draw=()=>{const n=inputs.filter(x=>x.checked).length;out.innerHTML=n?`<strong>${n} MDR risk modifier${n>1?'s':''} selected</strong><div class="small" style="margin-top:4px">Use the MDR-risk source cards and verify current HPUSM/NAG guidance and patient-specific microbiology before choosing empirical therapy.</div>`:`<strong>No MDR modifier selected</strong><div class="small" style="margin-top:4px">Review acquisition timing, severity, prior cultures and current microbiology.</div>`};
  inputs.forEach(x=>x.addEventListener('change',draw)); draw();
}
function renderCondition(id){
  recordRoute({view:'entity',type:'condition',id});
  const c=state.db.conditions.find(x=>x.id===id); if(!c)return; state.lastView={type:'condition',id};addRecent('condition',id,c.name);state.nav='diseases';navActive();
  const sourceCount=uniq((c.recommendations||[]).map(r=>r.source)).length;
  $('#main').innerHTML=`${entityTop('condition',c,c.category+(c.icu?' · ICU':'') )}${modeLens()}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(c.summary)}</p>${c.riskFactors?.length?`<h3 style="margin-top:12px">Key risk modifiers</h3><div class="tag-row">${c.riskFactors.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${conditionMicrobiologyHTML(c)}${conditionDecisionAid(c)}${sourceCount>1?`<div class="notice warn"><b>Guideline comparison:</b> ${sourceCount} source sets are shown below. They are intentionally not merged into one synthetic regimen.</div>`:''}${beforeBox(c.before||[])}${recommendationsHTML(c)}${conditionReconciliationHTML(c)}${c.why?.length?`<details class="card teaching-details"><summary><b>Why this approach?</b> <span class="muted small">Teaching layer</span></summary><ul style="margin-top:10px">${c.why.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}${currentNagLinks(c)}<div class="card"><h3>Source provenance</h3><div class="tag-row">${(c.refs||[]).map(r=>`<button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div></div>${footer()}`;
  bindConditionDecisionAid(c); scrollTo(0,0);
}
function renderOrganism(id){
  recordRoute({view:'entity',type:'organism',id});
  const o=state.db.organisms.find(x=>x.id===id); if(!o)return;state.lastView={type:'organism',id};addRecent('organism',id,o.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('organism',o,o.gram)}${organismMicrobiologyHTML(o)}<div class="card"><h3>Important phenotypes</h3><div class="tag-row">${(o.phenotypes||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>${(o.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}</div><div class="card"><h3>Linked pathways</h3><div class="list">${(o.links||[]).map(id=>{const r=state.db.resistance.find(x=>x.id===id);const c=state.db.conditions.find(x=>x.id===id);const x=r||c;if(!x)return '';return `<button class="list-row" data-open="${r?'resistance':'condition'}" data-id="${x.id}"><div class="grow"><strong>${esc(x.name)}</strong><small>${r?'Resistance mechanism / phenotype':'Clinical syndrome'}</small></div><span class="chev">›</span></button>`}).join('')}</div></div>${currentNagLinks(o)}<div class="notice warn">Do not infer treatment from organism name alone. Site, resistance mechanism, susceptibility, colonisation vs infection and severity all matter.</div>${footer()}`;scrollTo(0,0);
}
function renderResistance(id){
  recordRoute({view:'entity',type:'resistance',id});
  const r=state.db.resistance.find(x=>x.id===id);if(!r)return;state.lastView={type:'resistance',id};addRecent('resistance',id,r.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('resistance',r,'Resistance / phenotype')}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(r.summary)}</p>${r.phenotypes?.length?`<div class="tag-row">${r.phenotypes.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${(r.sourceCards||[]).map(sc=>`<article class="source-card ${sc.source==='hpusm'?'local':sc.source==='msidc'?'mdr':''}">${sourcePill(sc.source)}<h4>${esc(sc.title)}</h4><p>${esc(sc.text)}</p>${sc.bullets?.length?`<ul>${sc.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:sc.source,page:sc.page,pdfPage:sc.pdfPage,url:sc.url,pdfUrl:sc.pdfUrl}))}'>${refText({source:sc.source,page:sc.page})} →</button></article>`).join('')}${currentNagLinks(r)}<div class="notice danger"><b>Resistance mechanism ≠ prescription.</b> Confirm infection vs colonisation, infection site, severity, susceptibility and current dedicated MDR guidance.</div>${footer()}`;scrollTo(0,0);
}

function renderDirectory(kind){
  recordRoute({view:'directory',kind});
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
  recordRoute({view:'tools'});
  state.nav='tools';navActive();
  $('#main').innerHTML=`${pageHeader('Tools','Offline clinical utilities and stewardship workflows')}<div class="tool-grid">
  ${toolCard('∑','Patient dose','Cockcroft–Gault, BMI, IBW/AdjBW','dose')}${toolCard('↻','Renal / RRT','Structured ICU dosing + NAG cross-check','renal')}${toolCard('◎','TDM','NAG + MSIC vancomycin/aminoglycoside monitoring','tdm')}${toolCard('≈','Spectrum explorer','Expected activity, not susceptibility','spectrum')}${toolCard('≡','Compare antibiotics','Side-by-side spectrum and properties','compare')}${toolCard('♀','Pregnancy / lactation','Structured NAG Appendix 4 attributes','pregnancy')}${toolCard('⇄','IV → PO','Structured NAG + ICU switch criteria','ivpo')}${toolCard('⏱','Prolonged infusion','β-lactam ICU administration','infusion')}${toolCard('48h','AMS round','Local, temporary 48–72 h review cards','rounds')}${toolCard('NAG','NAG structured','Offline recommendations + official update check','nag')}${toolCard('ⓘ','Sources & app','Guideline hierarchy, freshness and scope','sources')}
  </div>${footer()}`;
}
function toolCard(icon,title,sub,id){return `<button class="tool-card" data-tool="${id}"><div class="qicon">${icon}</div><strong>${esc(title)}</strong><small>${esc(sub)}</small></button>`}
function renderTool(id,opts={}){
  recordRoute({view:'tool',id,opts});
  state.nav='tools';navActive();
  const map={dose:toolDose,renal:toolRenal,tdm:toolTDM,spectrum:toolSpectrum,compare:toolCompare,pregnancy:toolPregnancy,ivpo:toolIVPO,infusion:toolInfusion,rounds:toolRounds,nag:toolNAG,sources:toolSources};
  (map[id]||renderTools)(opts);
}
function toolHeader(title,sub){return `<div class="entity-title"><button class="back-btn" data-back>‹</button><div class="grow"><h1>${esc(title)}</h1><p>${esc(sub||'')}</p></div></div>`}

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
function renalResultHTML(d,rr,crcl,rrt,ctx={}){
  const isCrrt=['CVVH','CVVHD','CVVHDF'].includes(rrt);
  const eff=ctx.effluent===''||ctx.effluent==null?null:Number(ctx.effluent);
  const running=ctx.running||'running';
  let text='';
  if(isCrrt && running!=='running'){
    text='CRRT-specific maintenance regimen should not be continued automatically while CRRT is interrupted/stopped. Reassess current renal function, timing of the last RRT session and TDM where applicable.';
  } else if(rrt && rr.rrt?.[rrt]) text=rr.rrt[rrt];
  else if(crcl!=null){ const b=renalRuleForCrcl(rr,crcl); text=b?.text||'No structured rule'; }
  const rv=state.db.rrtValidation||{};
  const effNeeded=isCrrt && (rv.effluentSensitiveAgents||[]).includes(d.id);
  let vancoExample='';
  if(d.id==='vancomycin' && isCrrt && running==='running'){
    const vx=state.db.tdm?.vancomycin?.msicCrrtRegimens;
    if(eff!=null && Number.isFinite(eff)){
      const ex=eff<30?'MSIC example when MIC ≤1 mg/L and effluent <30 mL/kg/h: 500 mg q8h.':'MSIC example when MIC ≤1 mg/L and effluent >30 mL/kg/h: 1 g q12h.';
      vancoExample=`<div class="notice good"><b>Effluent-aware source example:</b> ${esc(ex)} This is an example to be reconciled with MIC, residual renal function and TDM—not an automatic prescription.</div>`;
    } else {
      vancoExample='<div class="notice warn"><b>Effluent rate required:</b> MSIC vancomycin CRRT examples change at 30 mL/kg/h. Enter the actual prescribed effluent rate before interpreting those examples.</div>';
    }
  }
  const nagRenal=nagSnapshot().renalUrl||'https://sites.google.com/moh.gov.my/nag/appendices/appendix-2-antibiotic-dosages-in-patients-with-impaired-renal-function';
  const ctxRows=isCrrt?`<dt>CRRT status</dt><dd>${esc(running==='running'?'Running':'Interrupted / stopped')}</dd>${eff!=null&&Number.isFinite(eff)?`<dt>Effluent</dt><dd>${eff.toFixed(1)} mL/kg/h</dd>`:''}${ctx.residual?`<dt>Residual renal function</dt><dd>${esc(ctx.residual)}</dd>`:''}`:'';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">Patient-specific renal reference</h3>${sourcePill(rr.source)}</div><div class="result-box"><strong>${esc(d.name)}</strong><dl>${crcl!=null?`<dt>CrCl</dt><dd>${Number(crcl).toFixed(1)} mL/min</dd>`:''}${rrt?`<dt>RRT</dt><dd>${esc(rrt)}</dd>`:''}${ctxRows}<dt>Regimen</dt><dd>${esc(text||rr.normal)}</dd></dl></div>${vancoExample}${effNeeded&&eff==null?`<div class="notice warn"><b>Validation gate:</b> actual effluent rate is needed for this source-dependent CRRT interpretation.</div>`:''}${isCrrt?`<div class="notice"><b>CRRT context minimum:</b> ${(rv.minimumContext||[]).map(esc).join(' · ')}</div>`:''}${rr.high?`<div class="notice"><b>High-dose context:</b> ${esc(rr.high)}</div>`:''}${rr.rrtContext?`<div class="notice good"><b>RRT context:</b> ${esc(rr.rrtContext)}</div>`:''}${rr.unitConvention?`<div class="notice warn"><b>Unit / formulation guard:</b> ${esc(rr.unitConvention)}</div>`:''}${rr.note?`<div class="notice warn">${esc(rr.note)}</div>`:''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:rr.source,page:rr.page,pdfPage:rr.pdfPage}))}'>${refText({source:rr.source,page:rr.page,pdfPage:rr.pdfPage})} →</button><div class="notice"><b>NAG renal cross-check:</b> NAG Appendix 2 remains a live national cross-check. AbxHub preserves verified source-specific numeric rules rather than guessing values from an image-only table.</div><a class="secondary-btn" href="${esc(nagRenal)}" target="_blank" rel="noopener">Check latest NAG renal table ↗</a></div>`;
}
function toolRenal(opts={}){
  const drug=opts.drug||''; const crcl=opts.crcl??''; const rrt=opts.rrt||'';
  const selectable=state.db.drugs.filter(d=>d.renalKey&&state.db.renal[d.renalKey]);
  $('#main').innerHTML=`${toolHeader('Renal / RRT dosing','Source-specific ICU dosing with CRRT validation context')}<div class="card"><div class="form-grid"><div class="field full"><label>Antimicrobial</label><select id="renalDrug"><option value="">Select…</option>${selectable.map(d=>`<option value="${d.id}" ${d.id===drug?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div><div class="field"><label>CrCl (mL/min)</label><input id="renalCrcl" type="number" value="${esc(crcl)}" placeholder="e.g. 25"></div><div class="field"><label>Renal replacement therapy</label><select id="renalRrt"><option value="">None</option>${['HD','CVVH','CVVHD','CVVHDF'].map(x=>`<option ${x===rrt?'selected':''}>${x}</option>`).join('')}</select></div><div id="crrtContext" class="field full" style="display:none"><div class="form-grid"><div class="field"><label>Actual effluent rate (mL/kg/h)</label><input id="renalEffluent" type="number" min="0" step="0.1" placeholder="e.g. 25"></div><div class="field"><label>CRRT status</label><select id="renalRunning"><option value="running">Running</option><option value="interrupted">Interrupted / stopped</option></select></div><div class="field full"><label>Residual renal function</label><select id="renalResidual"><option value="unknown">Unknown</option><option value="minimal/anuric">Minimal / anuric</option><option value="present">Present / meaningful urine output</option></select></div></div></div></div><div class="btn-row"><button id="renalCalc" class="primary-btn">Show regimen</button><button class="secondary-btn" data-tool="dose">Calculate CrCl</button></div><div id="renalOut"></div></div><div class="notice warn"><b>Maintenance-dose tool.</b> Critical illness often still requires a full/stat or source-specified loading dose. CRRT modality, effluent, downtime, residual renal function and TDM can materially alter exposure.</div>${footer()}`;
  const toggle=()=>{const cr=['CVVH','CVVHD','CVVHDF'].includes($('#renalRrt').value);$('#crrtContext').style.display=cr?'block':'none'};
  const calc=()=>{const d=state.db.drugs.find(x=>x.id===$('#renalDrug').value);if(!d){toast('Select an antimicrobial');return}const rr=state.db.renal[d.renalKey];const c=$('#renalCrcl').value===''?null:+$('#renalCrcl').value;const r=$('#renalRrt').value;const ctx={effluent:$('#renalEffluent')?.value??'',running:$('#renalRunning')?.value||'running',residual:$('#renalResidual')?.value||''};$('#renalOut').innerHTML=renalResultHTML(d,rr,c,r,ctx)};
  $('#renalRrt').addEventListener('change',toggle); $('#renalCalc').addEventListener('click',calc); toggle(); if(drug) calc();
}
function toolTDM(){
  const pkUrl=nagSnapshot().pkUrl||'https://sites.google.com/moh.gov.my/nag/appendices/appendix-1-clinical-pharmacokinetic-guide-aminoglycoside-vancomycin';
  const tv=state.db.tdm?.vancomycin||{}, ta=state.db.tdm?.aminoglycoside||{};
  $('#main').innerHTML=`${toolHeader('Therapeutic drug monitoring','Current NAG + MSIC source-specific monitoring; not a Bayesian dosing engine')}<div class="card"><div class="field"><label>Antimicrobial</label><select id="tdmDrug"><option value="vancomycin">Vancomycin</option><option value="aminoglycoside">Gentamicin / Amikacin</option></select></div><div id="tdmBody"></div></div>${footer()}`;
  const draw=()=>{const v=$('#tdmDrug').value;$('#tdmBody').innerHTML=v==='vancomycin'?`
    <div class="quick-dose"><label>VANCOMYCIN</label><strong>${esc(tv.efficacyMetric||'24-hour AUC/MIC')} · individualise by TDM</strong></div>
    <div class="notice good"><b>National NAG:</b> ${esc(tv.monitoringIndication||'TDM when therapy is expected >48 h.')} ${esc(tv.monitoringFrequency||'')}</div>
    <ul class="small">${(tv.aucMethods||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
    <div class="notice good"><b>MSIC ICU:</b> ${esc(tv.msicTarget||'Source-specific loading, renal/RRT and sampling schedules apply.')}</div>
    <ul class="small"><li>${esc(tv.msicSampling?.normalRenal||'')}</li><li>${esc(tv.msicSampling?.crcl30to50||'')}</li><li>${esc(tv.msicSampling?.crclBelow30||'')}</li><li>${esc(tv.msicSampling?.HD||'')}</li><li>${esc(tv.msicSampling?.CRRT||'')}</li></ul>
    ${(tv.msicCrrtRegimens?.maintenance||[]).length?`<details><summary><b>MSIC CRRT example regimens — effluent/MIC/TDM dependent</b></summary><div class="prep-row"><b>Loading</b><span>${esc(tv.msicCrrtRegimens.loading||'')}</span></div><ul class="small">${tv.msicCrrtRegimens.maintenance.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="small">${esc(tv.msicCrrtRegimens.sampling||'')}</p><div class="notice warn">${esc(tv.msicCrrtRegimens.warning||'')}</div></details>`:''}
    ${(tv.nagPaediatric||[]).length?`<details><summary><b>Current NAG paediatric/neonatal framework</b> ${sourcePill('nag')}</summary><ul class="small">${tv.nagPaediatric.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><a class="secondary-btn" href="${esc(pkUrl)}" target="_blank" rel="noopener">Check latest official NAG ↗</a></details>`:''}
    ${tv.workflowValidation?`<details><summary><b>TDM workflow validation gate</b> <span class="pill">${esc(tv.workflowValidation.status||'REVIEW')}</span></summary><h4>Required inputs</h4><ul class="small">${(tv.workflowValidation.requiredInputs||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>Accepted source methods</h4><ul class="small">${(tv.workflowValidation.acceptedSourceMethods||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="notice warn"><b>Local configuration still needed:</b> ${(tv.workflowValidation.localConfigurationNeeded||[]).map(esc).join(' · ')}</div></details>`:''}
    <div class="notice warn"><b>No unvalidated AUC calculator:</b> AbxHub deliberately does not estimate AUC from a single trough. Use a validated Bayesian platform or validated two-concentration PK/AUC method.</div>
    <div class="btn-row"><button class="primary-btn" data-tool="renal" data-drug="vancomycin">Open vancomycin renal/RRT</button><a class="secondary-btn" href="${esc(pkUrl)}" target="_blank" rel="noopener">Check latest NAG TDM ↗</a></div>`:`
    <div class="quick-dose"><label>AMINOGLYCOSIDES</label><strong>${esc(ta.pkpd||'Concentration-dependent therapy requires timed sampling and renal-aware redosing.')}</strong></div>
    <div class="notice good"><b>NAG EID/SDD exclusions:</b> ${esc((ta.eidExclusions||[]).join(' · '))}</div>
    <ul class="small"><li>${esc(ta.msicSampling?.singleDaily||'')}</li><li>${esc(ta.msicSampling?.conventional||'')}</li><li>${esc(ta.msicSampling?.repeat||'')}</li></ul>
    ${ta.nagChildrenMonitoring?`<div class="notice good"><b>Children:</b> ${esc(ta.nagChildrenMonitoring)}</div>`:''}
    ${ta.neonatalGuard?`<div class="notice warn"><b>Neonatal population guard:</b> ${esc(ta.neonatalGuard)}</div>`:''}
    ${ta.workflowValidation?`<details><summary><b>TDM workflow validation gate</b> <span class="pill">${esc(ta.workflowValidation.status||'REVIEW')}</span></summary><h4>Required inputs</h4><ul class="small">${(ta.workflowValidation.requiredInputs||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><h4>Routing rules</h4><ul class="small">${(ta.workflowValidation.routingRules||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="notice warn"><b>Local configuration still needed:</b> ${(ta.workflowValidation.localConfigurationNeeded||[]).map(esc).join(' · ')}</div></details>`:''}
    <div class="notice warn">Use your institution's validated aminoglycoside nomogram/TDM workflow for dose adjustment. AbxHub does not derive an interval from a single serum creatinine when EID/SDD exclusions apply.</div>
    <div class="btn-row"><button class="secondary-btn" data-tool="renal" data-drug="gentamicin">Gentamicin renal/TDM guard</button><button class="secondary-btn" data-tool="renal" data-drug="amikacin">Amikacin renal/RRT</button><a class="secondary-btn" href="${esc(pkUrl)}" target="_blank" rel="noopener">Check latest NAG aminoglycoside guide ↗</a></div>`;
  }; $('#tdmDrug').addEventListener('change',draw);draw();
}
function statusText(v){return typeof v==='number'?`${'●'.repeat(v)}${'○'.repeat(3-v)}`:v==='yes'?'✓':v==='no'?'✕':'◐'}
function toolSpectrum(){
  $('#main').innerHTML=`${toolHeader('Spectrum explorer','Wellington-style expected activity, converted to an interactive layer')}<div class="notice warn"><b>Spectrum ≠ susceptibility.</b> Isolate-specific susceptibility and current microbiology should override an expected-spectrum display.</div><div class="card"><div class="field"><label>Antimicrobial</label><select id="specDrug">${state.db.drugs.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div><div id="specOut"></div></div>${footer()}`;
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
  const x=state.db.ivpo; const refs=x.sources||[{source:x.source,page:x.page}];
  $('#main').innerHTML=`${toolHeader('IV → PO switch','Structured national + ICU stewardship criteria')}<div class="card"><h3>Switch checklist</h3><div class="checklist">${x.checklist.map(i=>`<label class="check-item"><input type="checkbox"><span>${esc(i)}</span></label>`).join('')}</div></div><div class="form-grid"><div class="card"><h3>Commonly suitable when stable</h3><ul>${x.consider.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div><div class="card"><h3>Do not make an early routine switch</h3><ul>${x.avoid.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div></div>${(x.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}<div class="tag-row">${refs.map(r=>`<button class="pill ${r.source==='nag'?'nag':''}" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}${r.source==='nag'?' · check latest ↗':''}</button>`).join('')}</div>${footer()}`;
}
function toolInfusion(){
  const inf=state.db.infusionStrategies||{}; const agents=inf.agents||{};
  const rows=Object.entries(agents).map(([id,x])=>({d:state.db.drugs.find(d=>d.id===id),x})).filter(z=>z.d);
  $('#main').innerHTML=`${toolHeader('Prolonged β-lactam infusion','Source-reconciled ICU dose + MOH preparation layer')}<div class="notice good"><b>MSIC ICU principle:</b> ${esc(inf.principle||'Use a loading dose before prolonged-infusion maintenance.')}</div><div class="list">${rows.map(({d,x})=>`<button class="list-row" data-open="drug" data-id="${d.id}"><div class="grow"><strong>${esc(d.name)}</strong><small>Load: ${esc(x.loading||'')} · Maintenance: ${esc(x.maintenance||'')}</small>${x.highDoseContext?`<small>${esc(x.highDoseContext)}</small>`:''}</div><span class="chev">›</span></button>`).join('')}</div><div class="notice warn"><b>Do not separate infusion time from dose selection.</b> Renal/RRT maintenance adjustment, infection site, MIC/susceptibility and source-linked preparation constraints still apply. The MOH fluid-restricted guide is a preparation overlay, not a dosing guideline.</div>${inf.page?`<div class="tag-row"><button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify({source:inf.source,page:inf.page,pdfPage:inf.pdfPage}))}'>${refText({source:inf.source,page:inf.page,pdfPage:inf.pdfPage})}</button><button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify({source:'moh-dilution-fluid',url:source('moh-dilution-fluid').url,pdfUrl:source('moh-dilution-fluid').pdfUrl}))}'>MOH ICU dilution · check current ↗</button></div>`:''}${footer()}`;
}
function getRounds(){return JSON.parse(localStorage.getItem('abx-rounds')||'[]')}
function setRounds(x){localStorage.setItem('abx-rounds',JSON.stringify(x))}
function toolRounds(){
  const rounds=getRounds(); $('#main').innerHTML=`${toolHeader('AMS round','Temporary local-only cards; avoid patient identifiers')}<div class="card"><div class="form-grid"><div class="field"><label>Bed / location</label><input id="rBed" placeholder="e.g. Bed 3"></div><div class="field"><label>Syndrome</label><input id="rSynd" placeholder="e.g. VAP"></div><div class="field"><label>Antimicrobial</label><input id="rDrug" placeholder="e.g. meropenem"></div><div class="field"><label>Day</label><input id="rDay" type="number" min="1" placeholder="4"></div><div class="field full"><label>Culture / key result (no patient identifiers)</label><input id="rCult" placeholder="e.g. P. aeruginosa; susceptible to cefepime"></div></div><div class="btn-row"><button id="rAdd" class="primary-btn">Add review card</button>${rounds.length?'<button id="rClear" class="danger-btn">Clear all</button>':''}</div></div><div id="roundList">${roundRows(rounds)}</div><div class="notice">Round cards stay in this browser's local storage. The PWA does not send them to a server.</div>${footer()}`;
  $('#rAdd').addEventListener('click',()=>{const x={id:Date.now(),bed:$('#rBed').value.trim(),syndrome:$('#rSynd').value.trim(),drug:$('#rDrug').value.trim(),day:$('#rDay').value.trim(),culture:$('#rCult').value.trim(),checks:{}};if(!x.bed&&!x.syndrome&&!x.drug){toast('Add at least bed, syndrome or antimicrobial');return}const a=getRounds();a.push(x);setRounds(a);toolRounds()});
  $('#rClear')?.addEventListener('click',()=>{if(confirm('Clear all local AMS round cards?')){setRounds([]);toolRounds()}});
}
function roundRows(a){if(!a.length)return '<div class="empty"><b>No round cards yet</b>Add a temporary antibiotic review card above.</div>';const checks=['Infection still likely?','Cultures available/reviewed?','Can spectrum be narrowed?','Source controlled?','IV → PO possible?','Duration/stop date documented?'];return a.map(x=>`<div class="card round-card"><div class="source-meta"><h4 style="margin-right:auto">${esc(x.bed||'Round card')}</h4><button class="link-btn" data-round-del="${x.id}">Delete</button></div><div class="round-meta">${esc([x.syndrome,x.drug,x.day&&`Day ${x.day}`,x.culture].filter(Boolean).join(' · '))}</div><div class="checklist" style="margin-top:10px">${checks.map((c,i)=>`<label class="check-item"><input type="checkbox" data-round-check="${x.id}" data-check-index="${i}" ${x.checks?.[i]?'checked':''}><span>${esc(c)}</span></label>`).join('')}</div></div>`).join('')}
function structuredNagEntries(q=''){
  const nq=slug(q); const out=[];
  state.db.conditions.forEach(c=>{const recs=(c.recommendations||[]).filter(r=>r.source==='nag');if(!recs.length)return;const hay=slug([c.name,c.category,...(c.aliases||[]),...recs.flatMap(r=>[r.label,...(r.preferred||[]),...(r.alternative||[]),r.duration||''])].join(' '));if(!nq||hay.includes(nq)||nq.split(' ').every(t=>hay.includes(t)))out.push({kind:'condition',id:c.id,name:c.name,sub:`${recs.length} structured NAG pathway${recs.length>1?'s':''}`,recs});});
  state.db.drugs.forEach(d=>{const has=(d.refs||[]).some(r=>r.source==='nag')||d.pregnancy?.source==='nag';if(!has)return;const hay=slug([d.name,d.class,...(d.aliases||[]),d.quickDose,d.pregnancy?.category,d.pregnancy?.lactation,...(d.indications||[])].join(' '));if(!nq||hay.includes(nq)||nq.split(' ').every(t=>hay.includes(t)))out.push({kind:'drug',id:d.id,name:d.name,sub:d.pregnancy?.source==='nag'?`Drug record · NAG pregnancy/special reference`:'Drug record · NAG-linked'});});
  return out;
}
function nagStructuredRows(a){return a.slice(0,80).map(x=>`<button class="list-row" data-open="${x.kind}" data-id="${x.id}"><div class="grow"><strong>${esc(x.name)}</strong><small>${esc(x.sub)}</small></div><span class="chev">›</span></button>`).join('')||'<div class="empty"><b>No structured NAG match</b><br>Try a disease, antimicrobial, pregnancy, renal, TDM or resistance term.</div>'}
function toolNAG(){
  const n=state.nag||{}, snap=nagSnapshot(), all=structuredNagEntries('');
  const cN=state.db.conditions.filter(c=>(c.recommendations||[]).some(r=>r.source==='nag')).length;
  const dN=state.db.drugs.filter(d=>(d.refs||[]).some(r=>r.source==='nag')||d.pregnancy?.source==='nag').length;
  $('#main').innerHTML=`${toolHeader('NAG structured reference','Offline searchable national recommendations + official MOH freshness check')}<div class="notice good"><b>NAG is now a first-class source.</b> Structured NAG records participate in universal search, syndrome comparisons, drug indications, pregnancy/TDM/IV→PO views and clinical synthesis. They no longer function only as external links.</div><div class="home-status"><span class="pill nag">${cN} syndrome records</span><span class="pill nag">${dN} NAG-linked drug records</span><span class="pill">Snapshot ${esc(snap.snapshotReviewed||n.structuredSnapshot||'')}</span></div><div class="notice warn"><b>Freshness rule.</b> Official latest update noted at this build: <b>${esc(snap.officialLatestUpdate||n.latestUpdate||'check live')}</b>. MOH maintains NAG online and recommendations can change, so each NAG result retains an official live link.</div><div class="btn-row"><a class="primary-btn" href="${esc(snap.sourceUrl||n.sourceUrl||'https://sites.google.com/moh.gov.my/nag')}" target="_blank" rel="noopener">Check latest official NAG ↗</a>${(snap.whatsNewUrl||n.whatsNewUrl)?`<a class="secondary-btn" href="${esc(snap.whatsNewUrl||n.whatsNewUrl)}" target="_blank" rel="noopener">What's new ↗</a>`:''}</div><div class="field" style="margin-top:12px"><label>Search structured NAG data</label><input id="nagFilter" placeholder="e.g. VAP, melioidosis, meropenem, pregnancy…"></div><div id="nagStructured" class="list" style="margin-top:10px">${nagStructuredRows(all)}</div><details class="card teaching-details" style="margin-top:12px"><summary><b>Official NAG topic links</b> <span class="muted small">live navigation / update check</span></summary><div id="nagList" class="list" style="margin-top:10px">${nagRows((state.nag?.topics||[]).slice(0,30))}</div></details>${footer()}`;
  $('#nagFilter').addEventListener('input',e=>{const q=e.target.value;$('#nagStructured').innerHTML=nagStructuredRows(structuredNagEntries(q));const nq=slug(q);const f=(state.nag?.topics||[]).filter(x=>slug(x.title+' '+x.section).includes(nq)).slice(0,60);$('#nagList').innerHTML=nagRows(f)});
}
function toolSources(){
  const ids=['hpusm','nag','msic','msidc','bluebook','myformulary','moh-dilution-standard','moh-dilution-fluid','sabah-dilution','shann','wellington','ncbi-mm','dailymed'];
  $('#main').innerHTML=`${toolHeader('Sources & app','Source provenance is part of every clinical record · national MOH dilution baseline + ICU fluid-restricted overlay')}<div class="card"><h3>Default display hierarchy</h3><ol class="small"><li>HPUSM ASP 2025 — local guidance where applicable</li><li>Malaysia NAG — structured national snapshot + official live freshness link</li><li>MSIC Adult ICU 2023 — ICU dosing, PK/PD, RRT, TDM and special populations</li><li>MSIDC MDR Gram-Negative 2024 — dedicated MDR mechanism/phenotype guidance</li><li>Wellington ICU spectrum chart — rapid expected-spectrum reference only</li></ol><div class="notice">Dedicated guidance may outrank the general hierarchy for its own domain, especially MSIDC for MDR Gram-negative infections. The app keeps source-specific recommendations separate rather than silently reconciling them.</div></div><div class="list">${ids.map(id=>{const s=source(id);return `<button class="list-row" data-source="${esc(id)}"><div class="grow"><strong>${esc(s.name)}</strong><small>${esc(s.note||'')}</small></div><span class="chev">›</span></button>`}).join('')}</div><div class="section-head"><div><h2>Bundled PDF reference library</h2><p>Every uploaded PDF source is included in this GitHub build; PDFs cache on demand after first opening.</p></div></div><div class="list">${(state.db.bundledReferences||[]).map(r=>`<a class="list-row" href="${esc(r.file)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(r.label)}</strong><small>Bundled source PDF</small></div><span class="chev">PDF ↗</span></a>`).join('')}</div><div class="notice good"><b>v0.20 expanded clinical-layer release candidate.</b> The current database has completed automated provenance, internal-link and bundled-PDF page checks. Institution-specific antibiogram/TDM/CRRT/product layers are intentionally outside the current v1.0 scope and may be added later without changing the core reference architecture.</div>${footer()}`;
}
function nagRows(a){return a.map(x=>`<a class="list-row" href="${esc(x.url)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(x.title)}</strong><small>Official NAG live · ${esc(x.section)}</small></div><span class="chev">↗</span></a>`).join('')||'<div class="empty"><b>No official NAG topic match</b></div>'}

function back(){
  if(history.state?.abxRoute && history.length>1){ history.back(); return; }
  renderHome();
}


function bindGlobal(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;const b=$('#installBtn');if(b)b.hidden=false;});
  window.addEventListener('appinstalled',()=>{state.installPrompt=null;const b=$('#installBtn');if(b)b.hidden=true;toast('AbxHub installed');});
  window.addEventListener('online',()=>toast('Back online'));
  window.addEventListener('offline',()=>toast('Offline mode — cached reference remains available'));
  history.scrollRestoration='manual';
  window.addEventListener('popstate',e=>{if(e.state?.abxRoute)restoreRoute(e.state.abxRoute,e.state.scrollY||0);});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button,a'); if(!b)return;
    if(b.matches('[data-close-modal]')) return closeModal();
    if(b.dataset.nav){ if(b.dataset.nav==='home')renderHome();else if(b.dataset.nav==='diseases')renderDirectory('condition');else if(b.dataset.nav==='drugs')renderDirectory('drug');else if(b.dataset.nav==='organisms')renderDirectory('mixed');else renderTools(); return; }
    if(b.dataset.go==='home'){renderHome();return}
    if(b.hasAttribute('data-back')){back();return}
    if(b.id==='themeBtn'){state.theme=state.theme==='dark'?'light':'dark';applyTheme();return}
    if(b.id==='installBtn'){if(state.installPrompt){state.installPrompt.prompt();state.installPrompt.userChoice.finally(()=>{state.installPrompt=null;b.hidden=true})}return}
    if(b.dataset.query){const q=b.dataset.query;const inp=$('#universalSearch');if(inp){inp.value=q;renderLiveSearch(q)}return}
    if(b.dataset.hitType){if(b.dataset.hitType==='naglink'){window.open(b.dataset.hitUrl,'_blank','noopener');return}renderEntity(b.dataset.hitType,b.dataset.hitId);return}
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
    if(e.key==='Enter'&&e.target.id==='universalSearch'){const q=e.target.value.trim();if(q)renderSearchResults(q)}
  });
  document.addEventListener('click',e=>{if(e.target.id==='searchGo'){const q=$('#universalSearch')?.value.trim();if(q)renderSearchResults(q)}});
}



/* ==================== v0.20.0 interaction/content overrides ==================== */
state.tabScroll = storedJSON('abxhub-tab-scroll', null, {});

function replaceRoute(route){
  state.currentRoute=route;
  const st=history.state||{};
  history.replaceState({...st,abxRoute:route,scrollY:window.scrollY},'');
}
function rootTabFromRoute(route){
  if(!route)return null;
  if(route.view==='home')return 'home';
  if(route.view==='tools')return 'tools';
  if(route.view==='directory')return route.kind==='condition'?'diseases':route.kind==='drug'?'drugs':'organisms';
  return null;
}
function savePrimaryTabScroll(){
  const tab=rootTabFromRoute(state.currentRoute); if(!tab)return;
  state.tabScroll[tab]=window.scrollY; save('abxhub-tab-scroll',state.tabScroll);
}
function restorePrimaryTabScroll(tab){
  requestAnimationFrame(()=>scrollTo(0,Number(state.tabScroll[tab]||0)));
}
function switchPrimaryNav(tab){
  savePrimaryTabScroll();
  if(tab==='home')renderHome();
  else if(tab==='diseases')renderDirectory('condition');
  else if(tab==='drugs')renderDirectory('drug');
  else if(tab==='organisms')renderDirectory('mixed');
  else renderTools();
  restorePrimaryTabScroll(tab);
}
function updateHomeSearchRoute(q){
  if(state.currentRoute?.view!=='home')return;
  replaceRoute({view:'home',search:q||''});
}
function updateSearchRoute(q){
  if(state.currentRoute?.view!=='search')return;
  replaceRoute({view:'search',q:q||''});
}
function searchHitHTML(h){
  return `<button class="search-hit" data-hit-type="${h.type}" data-hit-id="${h.id}" ${h.url?`data-hit-url="${esc(h.url)}"`:''}><span class="type">${esc(h.type)}</span><span class="grow"><strong>${esc(h.name)}</strong><small>${esc(h.sub||'')}</small></span><span class="chev">›</span></button>`;
}
function searchResultsHTML(q){
  const hits=search(q); const syn=parseSynthesis(q);
  return `${syn.tokens.length>=2?renderSynthesisPreview(syn):''}${hits.length?`<div class="search-results">${hits.map(searchHitHTML).join('')}</div>`:`<div class="search-results"><div class="empty"><b>No structured match</b>Try an antibiotic, disease, organism, resistance phenotype or NAG topic.</div></div>`}`;
}
function renderSearchResults(q){
  q=String(q||'').trim(); if(!q)return renderHome();
  recordRoute({view:'search',q}); state.nav='home';navActive();
  $('#main').innerHTML=`<div class="search-page-head"><div class="entity-title"><button class="back-btn" data-back>‹</button><div class="grow"><h1>Search</h1><p>Structured AbxHub results</p></div></div><div class="search-wrap"><input id="searchPageInput" class="search" autocomplete="off" spellcheck="false" value="${esc(q)}" placeholder="Search AbxHub…"><button id="searchPageGo" class="search-btn" aria-label="Search">⌕</button></div></div><div id="searchPageResults">${searchResultsHTML(q)}</div>${footer()}`;
  $('#searchPageInput')?.focus({preventScroll:true});
}
function restoreRoute(route,scrollY=0){
  if(!route)return;
  state.restoringHistory=true;
  try{
    if(route.view==='home')renderHome({search:route.search||''});
    else if(route.view==='directory')renderDirectory(route.kind);
    else if(route.view==='tools')renderTools();
    else if(route.view==='tool')renderTool(route.id,route.opts||{});
    else if(route.view==='search')renderSearchResults(route.q||'');
    else if(route.view==='synthesis')renderSynthesis(route.q||'');
    else if(route.view==='entity')renderEntity(route.type,route.id);
    else renderHome();
  }finally{
    state.restoringHistory=false; state.currentRoute=route;
    requestAnimationFrame(()=>scrollTo(0,Number(scrollY)||0));
  }
}
function renderHome(opts={}){
  const searchQ=opts.search||'';
  recordRoute({view:'home',search:searchQ});
  state.nav='home';navActive();
  const recent=state.recent.slice(0,5), favorites=state.favorites.slice(0,6), nagMeta=state.nag||{};
  $('#main').innerHTML=`
    <section class="hero">
      <h1>Antimicrobial decisions, faster.</h1>
      <p>Search a drug, infection, organism, resistance mechanism or combined ICU scenario. Results keep each guideline source separate.</p>
      <div class="search-wrap"><input id="universalSearch" class="search" autocomplete="off" spellcheck="false" value="${esc(searchQ)}" placeholder="e.g. VAP, meropenem, CRAB, pregnant pyelonephritis…"><button id="searchGo" class="search-btn" aria-label="Search">⌕</button></div>
      <div id="liveSearch"></div>
      <div class="chips">${['Meropenem','VAP','Septic shock','ESBL E. coli','CRAB','Pseudomonas','Meningitis','Pregnancy','CRRT'].map(q=>`<button class="chip" data-query="${esc(q)}">${esc(q)}</button>`).join('')}</div>
    </section>
    <div class="home-status"><span class="pill good-pill">✓ Offline-first</span><span class="pill">Clinical DB ${esc(state.db.meta.dbVersion)}</span><button class="pill nag" data-tool="nag">NAG structured · latest noted ${esc(nagMeta.latestUpdate||nagSnapshot().officialLatestUpdate||'check live')} ↗</button></div>
    <div class="section-head"><div><h2>Clinical shortcuts</h2><p>Designed for rounds, bedside decisions and training</p></div></div>
    <div class="cards">${quick('∑','Patient dose','CrCl, IBW/AdjBW and current-drug context','dose')}${quick('↻','Renal / RRT','CrCl, HD and CRRT dose reference','renal')}${quick('◎','TDM','Guided vancomycin & aminoglycoside monitoring','tdm')}${quick('⏱','Prolonged infusion','Loading, maintenance and preparation','infusion')}</div>
    <div class="section-head"><div><h2>Stewardship</h2><p>Turn references into a repeatable ICU workflow</p></div></div>
    <div class="cards">${quick('48h','AMS review','48–72 h diagnosis, culture, source-control and duration review','rounds')}${quick('⇄','IV → PO','Interactive NAG switch criteria + step-down table','ivpo')}${quick('≈','Spectrum','Interactive expected-spectrum explorer','spectrum')}${quick('≡','Compare','Compare up to 5 antimicrobials','compare')}</div>
    ${favorites.length?`<div class="section-head"><div><h2>Favourites</h2><p>Saved locally on this device</p></div></div><div class="list">${favorites.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>★ ${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}
    ${recent.length?`<div class="section-head"><div><h2>Recent</h2></div></div><div class="list">${recent.map(r=>`<button class="list-row" data-recent-type="${r.type}" data-recent-id="${r.id}"><div class="grow"><strong>${esc(r.name)}</strong><small>${esc(r.type)}</small></div><span class="chev">›</span></button>`).join('')}</div>`:''}
    <div class="notice warn"><b>Source priority ≠ automatic truth.</b> Local HPUSM guidance is shown first where applicable, NAG participates as a structured national source with a live update-check link, and dedicated MSIDC guidance is highlighted for MDR Gram-negative organisms. Conflicting regimens remain visibly source-specific.</div>${footer()}`;
  if(searchQ)renderLiveSearch(searchQ);
  $('#universalSearch')?.focus({preventScroll:true});
}
function renderLiveSearch(q){
  const host=$('#liveSearch'); if(!host)return;
  if(!q.trim()){host.innerHTML='';return;}
  const hits=search(q).slice(0,7), syn=parseSynthesis(q);
  host.innerHTML=`${syn.tokens.length>=2?renderSynthesisPreview(syn):''}${hits.length?`<div class="search-results">${hits.map(searchHitHTML).join('')}</div>`:`<div class="search-results"><div class="empty"><b>No structured match</b>Try an antibiotic, disease, organism, resistance phenotype or NAG topic.</div></div>`}`;
}

function textMentionsDrug(d,text=''){
  const hay=slug(text); if(!hay)return false;
  const terms=uniq([d.name,d.id,...(d.aliases||[])]).map(slug).filter(x=>x.length>=4);
  return terms.some(t=>hay.includes(t));
}
function drugIdsInGuidanceText(text=''){
  return state.db.drugs.filter(d=>textMentionsDrug(d,text)).map(d=>d.id);
}
function regimenOccurrences(d){
  const out=[];
  state.db.conditions.forEach(c=>(c.recommendations||[]).forEach(r=>{
    const parts=[r.label,...(r.preferred||[]),...(r.alternative||[]),...(r.notes||[]),r.duration||''];
    if(textMentionsDrug(d,parts.join(' '))){
      const matched=[...(r.preferred||[]),...(r.alternative||[])].filter(x=>textMentionsDrug(d,x));
      out.push({kind:'condition',id:c.id,name:c.name,source:r.source,label:r.label,lines:matched.length?matched:[...r.preferred||[],...r.alternative||[]],duration:r.duration,notes:(r.notes||[]).filter(x=>textMentionsDrug(d,x)),ref:{source:r.source,page:r.page,pdfPage:r.pdfPage,url:r.url,pdfUrl:r.pdfUrl}});
    }
  }));
  state.db.resistance.forEach(r=>(r.sourceCards||[]).forEach(sc=>{
    const txt=[sc.title,sc.text,...(sc.bullets||[])].join(' ');
    if(textMentionsDrug(d,txt))out.push({kind:'resistance',id:r.id,name:r.name,source:sc.source,label:sc.title,lines:(sc.bullets||[]).filter(x=>textMentionsDrug(d,x)),notes:sc.text&&textMentionsDrug(d,sc.text)?[sc.text]:[],ref:{source:sc.source,page:sc.page,pdfPage:sc.pdfPage,url:sc.url,pdfUrl:sc.pdfUrl}});
  }));
  return out;
}
function regimenOccurrencesHTML(d){
  const rows=regimenOccurrences(d); if(!rows.length)return '';
  return `<div class="section-head"><div><h2>Source-specific regimen occurrences</h2><p>${rows.length} linked use${rows.length===1?'':'s'} found across disease and resistance pathways</p></div></div><div class="regimen-occurrences">${rows.map(x=>`<article class="source-card ${x.source==='hpusm'?'local':x.source==='nag'?'nag':x.source==='msidc'?'mdr':''}"><div class="source-meta"><button class="link-btn" data-open="${x.kind}" data-id="${x.id}"><b>${esc(x.name)}</b> ›</button>${sourcePill(x.source)}<span class="pill">${esc(x.label||'Regimen')}</span></div>${x.lines?.length?`<ul>${x.lines.map(v=>`<li>${esc(v)}</li>`).join('')}</ul>`:''}${x.duration?`<div class="notice"><b>Duration / review:</b> ${esc(x.duration)}</div>`:''}${x.notes?.map(v=>`<div class="notice">${esc(v)}</div>`).join('')||''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify(x.ref))}'>${refText(x.ref)} →</button></article>`).join('')}</div>`;
}
function nagDetailHTML(c){
  const n=c.nagDetail;if(!n)return '';
  return `<div class="card nag-detail"><div class="source-meta"><h3 style="margin-right:auto">${esc(n.title||'Detailed NAG notes')}</h3>${sourcePill(n.source||'nag')}</div>${n.points?.length?`<ul>${n.points.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>`:''}${n.url?`<a class="secondary-btn" href="${esc(n.url)}" target="_blank" rel="noopener">Check this NAG page ↗</a>`:''}</div>`;
}
function drugLinkButtons(ids=[],kind='pill'){
  const clean=uniq((ids||[]).filter(id=>state.db.drugs.some(d=>d.id===id)));
  return clean.map(id=>{const d=state.db.drugs.find(x=>x.id===id);return `<button class="${kind}" data-open="drug" data-id="${id}">${esc(d.name)} ›</button>`}).join('');
}
function pathwayRefButtons(refs=[]){
  return uniq((refs||[]).map(r=>JSON.stringify(r))).map(raw=>{const r=JSON.parse(raw);return `<button class="pill" data-source-ref='${encodeURIComponent(raw)}'>${refText(r)} →</button>`}).join('');
}
function practicalPathwayHTML(c){
  const p=c.practicalPathway;if(!p)return '';
  return `<details class="card practical-pathway" open><summary><span><b>${esc(p.title||'Practical clinical pathway')}</b><small>Assessment · source-specific regimen map · duration · 48–72 h review</small></span><span class="pill good-pill">${esc(p.status||'SOURCE-GROUNDED')}</span></summary><div class="pathway-body">${p.assessment?.length?`<section><h4>Initial assessment / before therapy</h4><ul>${p.assessment.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></section>`:''}${p.diagnostics?.length?`<section><h4>Diagnostic / microbiology plan</h4><ul>${p.diagnostics.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></section>`:''}${p.regimens?.length?`<section><h4>Source-specific regimen map</h4><div class="pathway-regimens">${p.regimens.map(r=>`<div class="pathway-regimen"><div class="source-meta">${sourcePill(r.source)}<b>${esc(r.label||'Regimen')}</b></div>${r.drugIds?.length?`<div class="tag-row">${drugLinkButtons(r.drugIds)}</div>`:'<p class="small muted">No drug-specific monograph link is required for this source row.</p>'}${r.duration?`<div class="notice"><b>Duration / review:</b> ${esc(r.duration)}</div>`:''}${r.ref?`<div class="tag-row">${pathwayRefButtons([r.ref])}</div>`:''}</div>`).join('')}</div></section>`:''}<section><h4>48–72 h review</h4><div class="checklist static-checklist">${(p.review||[]).map(x=>`<div class="check-item"><span>✓</span><span>${esc(x)}</span></div>`).join('')}</div></section>${p.notes?.length?`<details class="inset-card"><summary><b>Additional risk / teaching notes</b></summary><ul>${p.notes.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}</div></details>`;
}
function recommendationsHTML(c){
  return `<div class="section-head"><div><h2>Empirical / targeted source cards</h2><p>Full structured recommendations remain separated by guideline</p></div></div>${(c.recommendations||[]).map(r=>{
    const cls=r.source==='hpusm'?'local':r.source==='nag'?'nag':r.source==='msidc'?'mdr':'';
    const txt=[r.label,...(r.preferred||[]),...(r.alternative||[]),...(r.notes||[])].join(' ');
    const pr=(c.practicalPathway?.regimens||[]).find(x=>x.source===r.source&&x.label===r.label);
    const ids=pr?.drugIds||drugIdsInGuidanceText(txt);
    const rr={source:r.source,page:r.page,pdfPage:r.pdfPage,url:r.url,pdfUrl:r.pdfUrl};
    return `<article class="source-card ${cls}"><div class="source-meta">${sourcePill(r.source)}<span class="pill">${esc(r.label)}</span></div><h4>Preferred</h4><ul>${(r.preferred||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>${r.alternative?.length?`<h4>Alternative / additional</h4><ul>${r.alternative.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}${ids.length?`<div class="drug-link-strip"><b>Open drug monographs</b><div class="tag-row">${drugLinkButtons(ids)}</div></div>`:''}${r.duration?`<div class="notice"><b>Duration / review:</b> ${esc(r.duration)}</div>`:''}${r.notes?.length?r.notes.map(x=>`<div class="notice">${esc(x)}</div>`).join(''):''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify(rr))}'>${refText(rr)} →</button></article>`;
  }).join('')}`;
}
function organismGuideHTML(o){
  const g=o.antimicrobialGuide;
  let guide='';
  if(g){
    guide=`<div class="card organism-guide"><div class="source-meta"><h3 style="margin-right:auto">Antimicrobial quick guide</h3>${sourcePill(g.source||'nag')}</div><div class="notice good"><b>Guideline-linked choices, not an isolate susceptibility report.</b> Use site, phenotype/MIC and patient context before selecting therapy.</div>${(g.groups||[]).map(gr=>`<div class="guide-group"><h4>${esc(gr.label)}</h4><p class="small">${esc(gr.text||'')}</p><div class="tag-row">${drugLinkButtons(gr.drugIds||[],'pill good-pill')}</div></div>`).join('')}${g.comment?`<div class="notice warn">${esc(g.comment)}</div>`:''}${g.guard?`<div class="notice">${esc(g.guard)}</div>`:''}${g.url?`<a class="secondary-btn" href="${esc(g.url)}" target="_blank" rel="noopener">Check current NAG organism guide ↗</a>`:''}</div>`;
  }
  const pg=o.pathwayAntimicrobialGuide;
  const pathway=pg?`<div class="card organism-pathway-guide"><h3>${esc(pg.title||'Syndrome / resistance-linked antimicrobial guide')}</h3><p class="small muted">Every group below comes from a source-labelled AbxHub disease or resistance pathway.</p>${(pg.groups||[]).map(gr=>`<details class="organism-path-group"><summary><span><b>${esc(gr.label)}</b><small>${gr.kind==='resistance'?'Resistance / phenotype pathway':'Clinical syndrome'}</small></span><span class="chev">＋</span></summary><div class="tag-row">${drugLinkButtons(gr.drugIds||[])}</div><div class="btn-row"><button class="secondary-btn" data-open="${gr.kind}" data-id="${gr.targetId}">Open full pathway</button></div>${gr.refs?.length?`<div class="tag-row source-link-row">${pathwayRefButtons(gr.refs)}</div>`:''}</details>`).join('')}<div class="notice warn">${esc(pg.guard||'These links do not imply isolate susceptibility.')}</div></div>`:'';
  return guide+pathway;
}
function resistanceManagementGuideHTML(r){
  const g=r.managementGuide;if(!g)return '';
  return `<div class="section-head"><div><h2>Practical resistance-management pathway</h2><p>Site/severity strategy, dosing, cautions and source links</p></div></div><div class="card resistance-guide"><div class="source-meta"><h3 style="margin-right:auto">${esc(g.title||r.name)}</h3>${sourcePill(g.source)}</div>${g.definition?.length?`<section><h4>Definition / interpretation</h4><ul>${g.definition.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></section>`:''}${g.siteRows?.length?`<section><h4>Infection-site / severity strategy</h4><div class="management-sites">${g.siteRows.map((row,i)=>`<details class="management-site" ${i===0?'open':''}><summary><b>${esc(row.site)}</b><span class="chev">＋</span></summary><div class="management-choice preferred"><b>Preferred</b><p>${esc(row.preferred||'')}</p></div>${row.alternative?`<div class="management-choice"><b>Alternative / additional</b><p>${esc(row.alternative)}</p></div>`:''}${row.drugIds?.length?`<div class="drug-link-strip"><b>Drug monographs</b><div class="tag-row">${drugLinkButtons(row.drugIds)}</div></div>`:''}${row.ref?`<div class="tag-row source-link-row">${pathwayRefButtons([row.ref])}</div>`:''}</details>`).join('')}</div></section>`:''}${g.dosing?.length?`<details class="inset-card" open><summary><b>Dosing / administration highlights</b></summary><ul>${g.dosing.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}${g.pearls?.length?`<details class="inset-card"><summary><b>Clinical pearls / avoid</b></summary><ul>${g.pearls.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}${g.duration?`<div class="notice"><b>Duration principle:</b> ${esc(g.duration)}</div>`:''}${g.ipc?.length?`<div class="notice warn"><b>Infection prevention / colonisation:</b> ${g.ipc.map(esc).join(' ')}</div>`:''}${g.refs?.length?`<div class="tag-row source-link-row">${pathwayRefButtons(g.refs)}</div>`:''}</div>`;
}
function sulbactamGuideHTML(r){
  const g=r.sulbactamGuide;if(!g)return '';
  return `<div class="card"><div class="source-meta"><h3 style="margin-right:auto">${esc(g.title||'Sulbactam administration guide')}</h3>${sourcePill(g.source)}</div>${g.formulations?.length?`<h4>Formulations</h4><ul>${g.formulations.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>`:''}<h4>Renal / RRT regimen table</h4><div class="compare-wrap"><table class="compare-table sulb-table"><thead><tr><th>Renal context</th><th>Sulbactam target</th><th>Unasyn</th><th>Sulperazone</th></tr></thead><tbody>${(g.renalRows||[]).map(x=>`<tr><td>${esc(x.renal)}</td><td>${esc(x.sulbactamTarget)}</td><td>${esc(x.unasyn)}</td><td>${esc(x.sulperazone)}</td></tr>`).join('')}</tbody></table></div>${g.administration?.length?`<h4>Preparation / administration</h4><ul>${g.administration.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>`:''}${g.precautions?.map(x=>`<div class="notice warn">${esc(x)}</div>`).join('')||''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:g.source,page:g.page,pdfPage:g.pdfPage}))}'>${refText({source:g.source,page:g.page,pdfPage:g.pdfPage})} →</button></div>`;
}
function renderDrug(id){
  recordRoute({view:'entity',type:'drug',id}); const d=state.db.drugs.find(x=>x.id===id);if(!d)return;state.lastView={type:'drug',id};addRecent('drug',id,d.name);state.nav='drugs';navActive();const s=d.spectrum||{};
  $('#main').innerHTML=`${entityTop('drug',d,d.class)}${modeLens()}<div class="quick-dose"><label>ICU QUICK DOSE</label><strong>${esc(d.quickDose)}</strong></div><div class="metric-grid">${spectrumMetric('Gram +',s.gramPositive||0)}${spectrumMetric('Gram −',s.gramNegative||0)}${spectrumMetric('Pseudomonas',s.pseudomonas||'no')}${spectrumMetric('Anaerobes',s.anaerobes||'no')}${spectrumMetric('MRSA',s.mrsa||'no')}${spectrumMetric('Atypicals',s.atypicals||'no')}</div><div class="tabs"><button class="tab-btn active">Overview</button><button class="tab-btn" data-jump="#doseSec">Dosing</button>${d.renalKey?`<button class="tab-btn" data-tool="renal" data-drug="${d.id}">Renal/RRT</button>`:''}<button class="tab-btn" data-jump="#pkpdSec">PK/PD</button><button class="tab-btn" data-jump="#sourceSec">Sources</button></div><div id="doseSec" class="card"><h3>Dosing / administration</h3><ul>${(d.doseNotes||[]).map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul>${d.renalKey?`<div class="btn-row"><button class="primary-btn" data-tool="renal" data-drug="${d.id}">Calculate renal/RRT regimen</button><button class="secondary-btn" data-tool="dose" data-drug="${d.id}">Patient dose context</button></div>`:''}</div>${regimenOccurrencesHTML(d)}<div id="pkpdSec" class="card"><h3>PK/PD & critical-care optimisation</h3><p>${esc(d.pkpd||'')}</p>${(d.warnings||[]).map(x=>`<div class="notice ${/not|risk|avoid|tox/i.test(x)?'warn':''}">${esc(x)}</div>`).join('')}</div>${drugProfileHTML(d)}${clinicalReconciliationHTML(d)}${specialPopulationHTML(d)}${pregnancyBox(d)}<div class="card"><h3>Where this drug appears</h3><div class="list">${(d.indications||[]).map(cid=>{const c=state.db.conditions.find(x=>x.id===cid)||state.db.resistance.find(x=>x.id===cid);return c?`<button class="list-row" data-open="${state.db.conditions.some(x=>x.id===cid)?'condition':'resistance'}" data-id="${cid}"><div class="grow"><strong>${esc(c.name)}</strong><small>Open linked clinical pathway</small></div><span class="chev">›</span></button>`:''}).join('')||'<span class="muted small">No linked pathway in the current structured database.</span>'}</div></div>${currentNagLinks(d)}<div id="sourceSec" class="card"><h3>Sources</h3><div class="tag-row">${(d.refs||[]).map(r=>`<button class="pill ${r.source==='hpusm'?'local':r.source==='msidc'?'mdr':r.source==='msic'?'icu':''}" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div><div class="notice">Expected-spectrum visualization is a reference layer; isolate susceptibility and local epidemiology take precedence.</div></div>${footer()}`;scrollTo(0,0);
}
function renderCondition(id){
  recordRoute({view:'entity',type:'condition',id});const c=state.db.conditions.find(x=>x.id===id);if(!c)return;state.lastView={type:'condition',id};addRecent('condition',id,c.name);state.nav='diseases';navActive();const sourceCount=uniq((c.recommendations||[]).map(r=>r.source)).length;
  $('#main').innerHTML=`${entityTop('condition',c,c.category+(c.icu?' · ICU':''))}${modeLens()}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(c.summary)}</p>${c.riskFactors?.length?`<h3 style="margin-top:12px">Key risk modifiers</h3><div class="tag-row">${c.riskFactors.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${conditionMicrobiologyHTML(c)}${conditionDecisionAid(c)}${sourceCount>1?`<div class="notice warn"><b>Guideline comparison:</b> ${sourceCount} source sets are shown below. They are intentionally not merged into one synthetic regimen.</div>`:''}${practicalPathwayHTML(c)}${beforeBox(c.before||[])}${recommendationsHTML(c)}${nagDetailHTML(c)}${conditionReconciliationHTML(c)}${c.why?.length?`<details class="card teaching-details"><summary><b>Why this approach?</b> <span class="muted small">Teaching layer</span></summary><ul style="margin-top:10px">${c.why.map(x=>`<li class="small">${esc(x)}</li>`).join('')}</ul></details>`:''}${currentNagLinks(c)}<div class="card"><h3>Source provenance</h3><div class="tag-row">${(c.refs||[]).map(r=>`<button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}</button>`).join('')}</div></div>${footer()}`;bindConditionDecisionAid(c);scrollTo(0,0);
}
function renderOrganism(id){
  recordRoute({view:'entity',type:'organism',id});const o=state.db.organisms.find(x=>x.id===id);if(!o)return;state.lastView={type:'organism',id};addRecent('organism',id,o.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('organism',o,o.gram)}${organismMicrobiologyHTML(o)}${organismGuideHTML(o)}<div class="card"><h3>Important phenotypes</h3><div class="tag-row">${(o.phenotypes||[]).map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>${(o.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}</div><div class="card"><h3>Linked pathways</h3><div class="list">${(o.links||[]).map(id=>{const r=state.db.resistance.find(x=>x.id===id),c=state.db.conditions.find(x=>x.id===id),x=r||c;if(!x)return '';return `<button class="list-row" data-open="${r?'resistance':'condition'}" data-id="${x.id}"><div class="grow"><strong>${esc(x.name)}</strong><small>${r?'Resistance mechanism / phenotype':'Clinical syndrome'}</small></div><span class="chev">›</span></button>`}).join('')}</div></div>${currentNagLinks(o)}<div class="notice warn">Do not infer treatment from organism name alone. Site, resistance mechanism, isolate susceptibility, colonisation vs infection and severity all matter.</div>${footer()}`;scrollTo(0,0);
}
function renderResistance(id){
  recordRoute({view:'entity',type:'resistance',id});const r=state.db.resistance.find(x=>x.id===id);if(!r)return;state.lastView={type:'resistance',id};addRecent('resistance',id,r.name);state.nav='organisms';navActive();
  $('#main').innerHTML=`${entityTop('resistance',r,'Resistance / phenotype')}<div class="card"><p style="font-size:13px;color:var(--ink)">${esc(r.summary)}</p>${r.phenotypes?.length?`<div class="tag-row">${r.phenotypes.map(x=>`<span class="pill">${esc(x)}</span>`).join('')}</div>`:''}</div>${resistanceManagementGuideHTML(r)}${(r.sourceCards||[]).map(sc=>`<article class="source-card ${sc.source==='hpusm'?'local':sc.source==='nag'?'nag':sc.source==='msidc'?'mdr':''}">${sourcePill(sc.source)}<h4>${esc(sc.title)}</h4><p>${esc(sc.text)}</p>${sc.bullets?.length?`<ul>${sc.bullets.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify({source:sc.source,page:sc.page,pdfPage:sc.pdfPage,url:sc.url,pdfUrl:sc.pdfUrl}))}'>${refText({source:sc.source,page:sc.page,pdfPage:sc.pdfPage})} →</button></article>`).join('')}${sulbactamGuideHTML(r)}${currentNagLinks(r)}<div class="notice danger"><b>Resistance mechanism ≠ prescription.</b> Confirm infection vs colonisation, infection site, severity, susceptibility and current dedicated MDR guidance.</div>${footer()}`;scrollTo(0,0);
}

function renderTools(){
  recordRoute({view:'tools'});state.nav='tools';navActive();
  $('#main').innerHTML=`${pageHeader('Tools','Offline clinical utilities and stewardship workflows')}<div class="tool-grid">${toolCard('∑','Patient dose','Cockcroft–Gault, BMI, IBW/AdjBW + drug context','dose')}${toolCard('↻','Renal / RRT','Structured ICU dosing + NAG cross-check','renal')}${toolCard('◎','TDM','Guided NAG + MSIC monitoring workflow','tdm')}${toolCard('≈','Spectrum explorer','Expected activity with symbol legend','spectrum')}${toolCard('≡','Compare antibiotics','Up to five agents side-by-side','compare')}${toolCard('♀','Pregnancy / lactation','Collapsible structured NAG table','pregnancy')}${toolCard('⇄','IV → PO','Interactive NAG criteria + conversion table','ivpo')}${toolCard('⏱','Prolonged infusion','Loading, maintenance, preparation + drug links','infusion')}${toolCard('48h','AMS round','Structured 48–72 h stewardship review cards','rounds')}${toolCard('NAG','NAG structured','Offline recommendations + official update check','nag')}${toolCard('ⓘ','Sources & app','Guideline hierarchy, freshness and scope','sources')}</div>${footer()}`;
}
function renderTool(id,opts={}){
  recordRoute({view:'tool',id,opts});state.nav='tools';navActive();
  const map={dose:toolDose,renal:toolRenal,tdm:toolTDM,spectrum:toolSpectrum,compare:toolCompare,pregnancy:toolPregnancy,ivpo:toolIVPO,infusion:toolInfusion,rounds:toolRounds,nag:toolNAG,sources:toolSources};
  (map[id]||renderTools)(opts);
}
function toolDose(opts={}){
  const linked=opts.drug||'';const renalDrugs=state.db.drugs.filter(d=>d.renalKey&&state.db.renal[d.renalKey]);
  $('#main').innerHTML=`${toolHeader('Patient dose context','Cockcroft–Gault + weight descriptors + current-antimicrobial handoff; no cloud patient data')}<div class="card">${linked?`<div class="notice good"><b>Current antimicrobial:</b> ${esc(state.db.drugs.find(d=>d.id===linked)?.name||linked)}. The renal-dose handoff will preserve this selection.</div>`:''}<div class="form-grid"><div class="field full"><label>Antimicrobial context (optional)</label><select id="doseDrug"><option value="">— no linked drug —</option>${renalDrugs.map(d=>`<option value="${d.id}" ${d.id===linked?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div><div class="field"><label>Age (years)</label><input id="age" type="number" min="16" max="120" inputmode="decimal"></div><div class="field"><label>Sex</label><select id="sex"><option value="male">Male</option><option value="female">Female</option></select></div><div class="field"><label>Height (cm)</label><input id="height" type="number" min="100" max="230" inputmode="decimal"></div><div class="field"><label>Actual weight (kg)</label><input id="weight" type="number" min="20" max="400" inputmode="decimal"></div><div class="field"><label>Serum creatinine (µmol/L)</label><input id="scr" type="number" min="10" max="3000" inputmode="decimal"></div><div class="field"><label>Renal support</label><select id="doseRrt"><option value="">None</option><option>HD</option><option>CVVH</option><option>CVVHD</option><option>CVVHDF</option></select></div><div class="field full"><label>Special context</label><div class="tag-row"><label class="pill"><input type="checkbox" id="shock"> Septic shock</label><label class="pill"><input type="checkbox" id="ecmo"> ECMO</label><label class="pill"><input type="checkbox" id="hypo"> Hypoalbuminaemia</label><label class="pill"><input type="checkbox" id="cns"> CNS infection</label></div></div></div><div class="btn-row"><button id="calcCrcl" class="primary-btn">Calculate</button></div><div id="doseResult"></div></div><div class="notice">MSIC Appendix A uses Cockcroft–Gault with IBW, adjusted body weight in obesity and actual body weight when BMI &lt;18.5 kg/m². This tool follows that source logic; renal/RRT dosing remains source- and indication-specific.</div>${footer()}`;
  $('#calcCrcl').addEventListener('click',()=>{const age=+$('#age').value,h=+$('#height').value,w=+$('#weight').value,scr=+$('#scr').value,sex=$('#sex').value;if(!age||!h||!w||!scr){toast('Enter age, height, weight and creatinine');return}const bmi=w/((h/100)**2),inch=h/2.54,ibw=(sex==='male'?50:45.5)+2.3*(inch-60),adj=ibw+0.4*(w-ibw),calcW=bmi<18.5?w:bmi>=30?adj:ibw,factor=sex==='male'?1.23:1.04,crcl=((140-age)*calcW*factor)/scr;const flags=[];if($('#shock').checked)flags.push('Septic shock: preserve adequate early exposure/loading strategy and reassess PK.');if($('#ecmo').checked)flags.push('ECMO: drug-specific PK may be altered; source data are limited.');if($('#hypo').checked)flags.push('Hypoalbuminaemia: highly protein-bound drugs may have altered Vd/clearance.');if($('#cns').checked)flags.push('CNS infection: use CNS-specific high-dose regimens where the source specifies them.');const did=$('#doseDrug').value;$('#doseResult').innerHTML=`<div class="result-box"><strong>Estimated CrCl ${crcl.toFixed(1)} mL/min</strong><dl><dt>Weight rule</dt><dd>${bmi<18.5?'Actual body weight':bmi>=30?'Adjusted body weight':'Ideal body weight'}</dd><dt>BMI</dt><dd>${bmi.toFixed(1)} kg/m²</dd><dt>IBW</dt><dd>${ibw.toFixed(1)} kg</dd><dt>AdjBW</dt><dd>${adj.toFixed(1)} kg</dd><dt>CrCl weight</dt><dd>${calcW.toFixed(1)} kg</dd></dl></div>${flags.map(x=>`<div class="notice warn">${esc(x)}</div>`).join('')}<div class="btn-row"><button class="primary-btn" data-tool="renal" data-drug="${esc(did)}" data-crcl="${crcl.toFixed(1)}" data-rrt="${esc($('#doseRrt').value)}">Use in renal dose tool${did?' · '+esc(state.db.drugs.find(d=>d.id===did)?.name||''):''}</button>${did?`<button class="secondary-btn" data-open="drug" data-id="${did}">Open drug monograph</button>`:''}</div>`;});
}
function toolRenal(opts={}){
  const drug=opts.drug||'',crcl=opts.crcl??'',rrt=opts.rrt||'',selectable=state.db.drugs.filter(d=>d.renalKey&&state.db.renal[d.renalKey]);
  $('#main').innerHTML=`${toolHeader('Renal / RRT dosing','Source-specific ICU dosing with contextual return to CrCl calculator')}<div class="card"><div class="form-grid"><div class="field full"><label>Antimicrobial</label><select id="renalDrug"><option value="">Select…</option>${selectable.map(d=>`<option value="${d.id}" ${d.id===drug?'selected':''}>${esc(d.name)}</option>`).join('')}</select></div><div class="field"><label>CrCl (mL/min)</label><input id="renalCrcl" type="number" value="${esc(crcl)}" placeholder="e.g. 25"></div><div class="field"><label>Renal replacement therapy</label><select id="renalRrt"><option value="">None</option>${['HD','CVVH','CVVHD','CVVHDF'].map(x=>`<option ${x===rrt?'selected':''}>${x}</option>`).join('')}</select></div><div id="crrtContext" class="field full" style="display:none"><div class="form-grid"><div class="field"><label>Actual effluent rate (mL/kg/h)</label><input id="renalEffluent" type="number" min="0" step="0.1" placeholder="e.g. 25"></div><div class="field"><label>CRRT status</label><select id="renalRunning"><option value="running">Running</option><option value="interrupted">Interrupted / stopped</option></select></div><div class="field full"><label>Residual renal function</label><select id="renalResidual"><option value="unknown">Unknown</option><option value="minimal/anuric">Minimal / anuric</option><option value="present">Present / meaningful urine output</option></select></div></div></div></div><div class="btn-row"><button id="renalCalc" class="primary-btn">Show regimen</button><button id="renalToCrcl" class="secondary-btn" data-tool="dose" data-drug="${esc(drug)}">Calculate CrCl${drug?' for current drug':''}</button></div><div id="renalOut"></div></div><div class="notice warn"><b>Maintenance-dose tool.</b> Critical illness often still requires a full/stat or source-specified loading dose. CRRT modality, effluent, downtime, residual renal function and TDM can materially alter exposure.</div>${footer()}`;
  const toggle=()=>{const cr=['CVVH','CVVHD','CVVHDF'].includes($('#renalRrt').value);$('#crrtContext').style.display=cr?'block':'none'};const syncDrug=()=>{$('#renalToCrcl').dataset.drug=$('#renalDrug').value};const calc=()=>{const d=state.db.drugs.find(x=>x.id===$('#renalDrug').value);if(!d){toast('Select an antimicrobial');return}const rr=state.db.renal[d.renalKey],c=$('#renalCrcl').value===''?null:+$('#renalCrcl').value,r=$('#renalRrt').value,ctx={effluent:$('#renalEffluent')?.value??'',running:$('#renalRunning')?.value||'running',residual:$('#renalResidual')?.value||''};$('#renalOut').innerHTML=renalResultHTML(d,rr,c,r,ctx)};$('#renalRrt').addEventListener('change',toggle);$('#renalDrug').addEventListener('change',syncDrug);$('#renalCalc').addEventListener('click',calc);toggle();syncDrug();if(drug)calc();
}
function toolTDM(){
  const pkUrl=nagSnapshot().pkUrl||'https://sites.google.com/moh.gov.my/nag/appendices/appendix-1-clinical-pharmacokinetic-guide-aminoglycoside-vancomycin',tv=state.db.tdm?.vancomycin||{},ta=state.db.tdm?.aminoglycoside||{};
  $('#main').innerHTML=`${toolHeader('Therapeutic drug monitoring','Guided workflow using current NAG + MSIC source-specific monitoring; not a Bayesian dosing engine')}<div class="card"><div class="field"><label>Antimicrobial</label><select id="tdmDrug"><option value="vancomycin">Vancomycin</option><option value="aminoglycoside">Gentamicin / Amikacin</option></select></div><div id="tdmBody"></div></div>${footer()}`;
  const draw=()=>{const v=$('#tdmDrug').value;if(v==='vancomycin'){$('#tdmBody').innerHTML=`<div class="quick-dose"><label>VANCOMYCIN</label><strong>${esc(tv.efficacyMetric||'24-hour AUC/MIC')} · individualise by TDM</strong></div><div class="notice good"><b>NAG:</b> ${esc(tv.monitoringIndication||'TDM when therapy is expected >48 h.')} ${esc(tv.monitoringFrequency||'')}</div><div class="card inset-card"><h4>Workflow selector</h4><div class="form-grid"><div class="field"><label>Renal / RRT context</label><select id="vancContext"><option value="normal">Normal/stable renal function</option><option value="30-50">CrCl 30–50 mL/min</option><option value="lt30">CrCl &lt;30 mL/min</option><option value="HD">Intermittent HD</option><option value="CRRT">CRRT</option></select></div><div class="field"><label>AUC method available</label><select id="vancMethod"><option value="bayesian">Validated Bayesian platform</option><option value="two">Validated two-concentration PK/AUC method</option><option value="trough">Trough only</option></select></div></div><button id="vancGuide" class="primary-btn">Show monitoring approach</button><div id="vancGuideOut"></div></div><ul class="small">${(tv.aucMethods||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul><div class="notice good"><b>MSIC ICU:</b> ${esc(tv.msicTarget||'Source-specific loading, renal/RRT and sampling schedules apply.')}</div>${(tv.msicCrrtRegimens?.maintenance||[]).length?`<details><summary><b>MSIC CRRT example regimens — effluent/MIC/TDM dependent</b></summary><div class="prep-row"><b>Loading</b><span>${esc(tv.msicCrrtRegimens.loading||'')}</span></div><ul class="small">${tv.msicCrrtRegimens.maintenance.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p class="small">${esc(tv.msicCrrtRegimens.sampling||'')}</p><div class="notice warn">${esc(tv.msicCrrtRegimens.warning||'')}</div></details>`:''}<div class="notice warn"><b>No single-trough AUC shortcut.</b> AbxHub deliberately does not estimate AUC from one trough; use a validated Bayesian or validated two-concentration method.</div><div class="btn-row"><button class="primary-btn" data-tool="renal" data-drug="vancomycin">Open vancomycin renal/RRT</button><a class="secondary-btn" href="${esc(pkUrl)}" target="_blank" rel="noopener">Check latest NAG TDM ↗</a></div>`;$('#vancGuide').addEventListener('click',()=>{const ctx=$('#vancContext').value,method=$('#vancMethod').value;const sample=ctx==='normal'?tv.msicSampling?.normalRenal:ctx==='30-50'?tv.msicSampling?.crcl30to50:ctx==='lt30'?tv.msicSampling?.crclBelow30:ctx==='HD'?tv.msicSampling?.HD:tv.msicSampling?.CRRT;$('#vancGuideOut').innerHTML=`<div class="notice ${method==='trough'?'danger':'good'}"><b>${method==='trough'?'AUC method incomplete':'Source-aligned next step'}</b><br>${esc(sample||'Follow current local validated sampling protocol.')} ${method==='trough'?'A trough can be clinically useful in some workflows, but AbxHub will not infer AUC24/MIC from it alone.':'Proceed with the selected validated AUC method and reconcile dose with renal/RRT status, MIC and clinical response.'}</div>`;});}
    else{$('#tdmBody').innerHTML=`<div class="quick-dose"><label>AMINOGLYCOSIDES</label><strong>${esc(ta.pkpd||'Concentration-dependent therapy requires timed sampling and renal-aware redosing.')}</strong></div><div class="notice good"><b>NAG EID/SDD exclusions:</b> ${esc((ta.eidExclusions||[]).join(' · '))}</div><div class="card inset-card"><h4>EID suitability screen</h4><p class="small muted">Tick any exclusion that applies.</p><div class="checklist">${(ta.eidExclusions||[]).map((x,i)=>`<label class="check-item"><input type="checkbox" class="ag-ex" value="${i}"><span>${esc(x)}</span></label>`).join('')}</div><button id="agAssess" class="primary-btn">Assess route</button><div id="agOut"></div></div><ul class="small"><li>${esc(ta.msicSampling?.singleDaily||'')}</li><li>${esc(ta.msicSampling?.conventional||'')}</li><li>${esc(ta.msicSampling?.repeat||'')}</li></ul>${ta.nagChildrenMonitoring?`<div class="notice good"><b>Children:</b> ${esc(ta.nagChildrenMonitoring)}</div>`:''}${ta.neonatalGuard?`<div class="notice warn"><b>Neonatal population guard:</b> ${esc(ta.neonatalGuard)}</div>`:''}<div class="notice warn">Use the institution's validated aminoglycoside nomogram/TDM workflow for adjustment. AbxHub does not derive an interval from serum creatinine alone when EID/SDD exclusions apply.</div><div class="btn-row"><button class="secondary-btn" data-tool="renal" data-drug="gentamicin">Gentamicin renal/TDM guard</button><button class="secondary-btn" data-tool="renal" data-drug="amikacin">Amikacin renal/RRT</button><a class="secondary-btn" href="${esc(pkUrl)}" target="_blank" rel="noopener">Check latest NAG guide ↗</a></div>`;$('#agAssess').addEventListener('click',()=>{const n=$$('.ag-ex:checked').length;$('#agOut').innerHTML=`<div class="notice ${n?'warn':'good'}"><b>${n?'Do not use the standard EID pathway automatically':'No listed exclusion selected'}</b><br>${n?'Use conventional/population-specific dosing and validated TDM guidance for the applicable exclusion.':'Confirm indication, renal function, age/population and local nomogram before using EID/SDD.'}</div>`;});}}
  $('#tdmDrug').addEventListener('change',draw);draw();
}
function toolSpectrum(){
  $('#main').innerHTML=`${toolHeader('Spectrum explorer','Expected activity reference with explicit symbol legend')}<div class="notice warn"><b>Spectrum ≠ susceptibility.</b> Isolate-specific susceptibility and current microbiology override this expected-spectrum display.</div><div class="card spectrum-legend"><h3>Legend</h3><div class="legend-grid"><span><b>●●●</b> stronger expected activity</span><span><b>●●○</b> intermediate expected activity</span><span><b>●○○</b> limited expected activity</span><span><b>○○○</b> little/no expected activity in this reference layer</span><span><b>✓</b> expected activity</span><span><b>◐</b> partial / conditional</span><span><b>✕</b> not expected</span></div></div><div class="card"><div class="field"><label>Antimicrobial</label><select id="specDrug">${state.db.drugs.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('')}</select></div><div id="specOut"></div></div>${footer()}`;const draw=()=>{const d=state.db.drugs.find(x=>x.id===$('#specDrug').value),s=d.spectrum;$('#specOut').innerHTML=`<div class="metric-grid">${spectrumMetric('Gram +',s.gramPositive)}${spectrumMetric('Gram −',s.gramNegative)}${spectrumMetric('Pseudomonas',s.pseudomonas)}${spectrumMetric('Anaerobes',s.anaerobes)}${spectrumMetric('MRSA',s.mrsa)}${spectrumMetric('Atypicals',s.atypicals)}</div><div class="btn-row"><button class="secondary-btn" data-open="drug" data-id="${d.id}">Open ${esc(d.name)}</button></div>`};$('#specDrug').addEventListener('change',draw);draw();
}
function toolCompare(){
  const opts=state.db.drugs.map(d=>`<option value="${d.id}">${esc(d.name)}</option>`).join('');
  $('#main').innerHTML=`${toolHeader('Compare antimicrobials','Add up to five agents side-by-side')}<div class="card"><div id="cmpSelectors" class="form-grid"></div><div class="btn-row"><button id="cmpAdd" class="secondary-btn">＋ Add drug</button></div><div id="cmpOut" style="margin-top:12px"></div></div>${footer()}`;
  const host=$('#cmpSelectors');let count=3;const defaults=['cefepime','piperacillin-tazobactam','meropenem','',''];
  const rebuild=()=>{host.innerHTML=Array.from({length:count},(_,i)=>`<div class="field"><label>Drug ${i+1}</label><div class="select-action"><select class="cmp"><option value="">— none —</option>${opts}</select>${i>=3?`<button class="icon-btn cmp-remove" data-cmp-index="${i}" aria-label="Remove drug">×</button>`:''}</div></div>`).join('');$$('.cmp',host).forEach((s,i)=>{s.value=defaults[i]||'';s.addEventListener('change',()=>{defaults[i]=s.value;draw();});});$('#cmpAdd').disabled=count>=5;draw();};
  const draw=()=>{const ds=$$('.cmp',host).map(s=>state.db.drugs.find(d=>d.id===s.value)).filter(Boolean);const rows=[['Gram +',d=>statusText(d.spectrum.gramPositive)],['Gram −',d=>statusText(d.spectrum.gramNegative)],['Pseudomonas',d=>statusText(d.spectrum.pseudomonas)],['Anaerobes',d=>statusText(d.spectrum.anaerobes)],['MRSA',d=>statusText(d.spectrum.mrsa)],['Atypicals',d=>statusText(d.spectrum.atypicals)],['Renal tool',d=>d.renalKey?'Yes':'Source-specific'],['Quick dose',d=>d.quickDose],['PK/PD',d=>d.pkpd]];$('#cmpOut').innerHTML=ds.length?`<div class="compare-wrap"><table class="compare-table"><thead><tr><th>Attribute</th>${ds.map(d=>`<th><button class="link-btn" data-open="drug" data-id="${d.id}">${esc(d.name)}</button></th>`).join('')}</tr></thead><tbody>${rows.map(([n,f])=>`<tr><td>${esc(n)}</td>${ds.map(d=>`<td>${esc(f(d)||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="notice">Comparison is a teaching/reference view. It does not determine the preferred drug for a specific infection.</div>`:'<div class="empty"><b>Select at least one drug</b></div>';};
  $('#cmpAdd').addEventListener('click',()=>{if(count<5){count++;rebuild();}});host.addEventListener('click',e=>{const b=e.target.closest('.cmp-remove');if(!b)return;const idx=+b.dataset.cmpIndex;defaults.splice(idx,1);defaults.push('');count--;rebuild();});rebuild();
}
function pregnancyRows(filter=''){
  const q=slug(filter);return state.db.drugs.filter(d=>d.pregnancy&&(!q||slug(`${d.name} ${d.pregnancy.category} ${d.pregnancy.lactation}`).includes(q))).map(d=>{const p=d.pregnancy,ref={source:p.source,page:p.page,pdfPage:p.pdfPage,url:p.url,pdfUrl:p.pdfUrl};return `<details class="card preg-table-row"><summary><span class="preg-name">${esc(d.name)}</span><span class="pill">Preg ${esc(p.category||'—')}</span><span class="preg-lact">${esc(p.lactation||'')}</span></summary><div class="btn-row"><button class="secondary-btn" data-open="drug" data-id="${d.id}">Open drug</button></div>${p.note?`<div class="notice warn">${esc(p.note)}</div>`:''}${(p.currentNagNotes||[]).map(x=>`<div class="notice good">${esc(x.text||'')}${x.url?`<div class="btn-row"><a class="secondary-btn" href="${esc(x.url)}" target="_blank" rel="noopener">Check indication-specific NAG ↗</a></div>`:''}</div>`).join('')}<button class="link-btn" data-source-ref='${encodeURIComponent(JSON.stringify(ref))}'>${refText(ref)} · check latest ↗</button></details>`;}).join('')||'<div class="empty"><b>No matching antimicrobial</b></div>';
}
function toolPregnancy(){
  $('#main').innerHTML=`${toolHeader('Pregnancy / lactation','Collapsible table using the same structured NAG attributes as drug monographs')}<div class="field"><input id="pregFilter" placeholder="Filter drug, pregnancy category or lactation note…"></div><div class="preg-table-head"><b>Antimicrobial</b><b>Pregnancy</b><b>Lactation</b></div><div id="pregTable">${pregnancyRows('')}</div><div class="notice warn">The uploaded pregnancy/lactation appendix uses legacy FDA categories. AbxHub preserves that source terminology; interpret with gestation, indication, alternatives and current product/specialist information.</div>${footer()}`;$('#pregFilter').addEventListener('input',e=>$('#pregTable').innerHTML=pregnancyRows(e.target.value));
}
function ivpoStepdownRows(filter=''){
  const q=slug(filter),rows=(state.db.ivpo.stepdown||[]).filter(x=>!q||slug(`${x.ivDrug} ${x.ivDose} ${x.oral} ${x.bioavailability} ${x.conversionType}`).includes(q));return rows.map(x=>`<details class="card ivpo-row"><summary><span><b>${esc(x.ivDrug)}</b><small>${esc(x.conversionType||'')}</small></span><span class="chev">＋</span></summary><div class="prep-row"><b>IV regimen</b><span>${esc(x.ivDose||'')}</span></div><div class="prep-row"><b>Oral conversion / step-down</b><span>${esc(x.oral||'')}</span></div>${x.bioavailability?`<div class="prep-row"><b>Oral bioavailability</b><span>${esc(x.bioavailability)}</span></div>`:''}<div class="btn-row">${x.ivDrugId&&state.db.drugs.some(d=>d.id===x.ivDrugId)?`<button class="secondary-btn" data-open="drug" data-id="${x.ivDrugId}">Open IV drug</button>`:''}${x.oralDrugId&&state.db.drugs.some(d=>d.id===x.oralDrugId)?`<button class="secondary-btn" data-open="drug" data-id="${x.oralDrugId}">Open oral drug</button>`:''}<a class="secondary-btn" href="${esc(x.url)}" target="_blank" rel="noopener">NAG Appendix 6 ↗</a></div></details>`).join('')||'<div class="empty"><b>No matching conversion row</b></div>';
}
function toolIVPO(){
  const x=state.db.ivpo,refs=x.sources||[{source:x.source,page:x.page}];
  $('#main').innerHTML=`${toolHeader('IV → PO switch','Interactive current-NAG criteria + conversion/step-down table')}<div class="card"><div class="source-meta"><h3 style="margin-right:auto">48–72 h switch screen</h3>${sourcePill('nag')}</div><p class="small muted">Confirm every stability/oral-absorption criterion that applies, then select whether an early-switch exclusion is present.</p><div class="checklist">${x.checklist.map((i,n)=>`<label class="check-item"><input class="ivpo-check" type="checkbox" value="${n}"><span>${esc(i)}</span></label>`).join('')}</div><div class="field" style="margin-top:10px"><label>Early-switch exclusion / special infection</label><select id="ivpoExclude"><option value="">None identified / not applicable</option>${x.avoid.map(i=>`<option value="${esc(i)}">${esc(i)}</option>`).join('')}</select></div><button id="ivpoAssess" class="primary-btn">Assess switch readiness</button><div id="ivpoDecision"></div></div><div class="form-grid"><div class="card"><h3>Commonly suitable when stable</h3><ul>${x.consider.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div><div class="card"><h3>Do not make an early routine switch</h3><ul>${x.avoid.map(i=>`<li class="small">${esc(i)}</li>`).join('')}</ul></div></div><div class="section-head"><div><h2>Conversion / step-down table</h2><p>NAG Appendix 6; each row is collapsible</p></div></div><div class="field"><input id="ivpoFilter" placeholder="Filter IV or oral antimicrobial…"></div><div id="ivpoTable">${ivpoStepdownRows('')}</div>${(x.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}<div class="tag-row">${refs.map(r=>`<button class="pill ${r.source==='nag'?'nag':''}" data-source-ref='${encodeURIComponent(JSON.stringify(r))}'>${refText(r)}${r.source==='nag'?' · check latest ↗':''}</button>`).join('')}</div>${footer()}`;
  $('#ivpoAssess').addEventListener('click',()=>{const n=$$('.ivpo-check:checked').length,total=x.checklist.length,ex=$('#ivpoExclude').value;const ready=n===total&&!ex;$('#ivpoDecision').innerHTML=`<div class="notice ${ready?'good':'warn'}"><b>${ready?'Criteria support considering IV → PO switch':'Do not switch automatically yet'}</b><br>${n}/${total} stability/absorption criteria confirmed.${ex?` Selected exclusion: ${esc(ex)}.`:''} ${ready?'Now verify microbiology, oral spectrum/bioavailability, dose, interactions and adherence using the table below.':'Address unmet criteria or follow the infection-specific minimum IV course/source guidance.'}</div>`;});$('#ivpoFilter').addEventListener('input',e=>$('#ivpoTable').innerHTML=ivpoStepdownRows(e.target.value));
}
function toolInfusion(){
  const inf=state.db.infusionStrategies||{},agents=inf.agents||{},rows=Object.entries(agents).map(([id,x])=>({d:state.db.drugs.find(d=>d.id===id),x})).filter(z=>z.d);
  $('#main').innerHTML=`${toolHeader('Prolonged β-lactam infusion','MSIC loading + maintenance + Appendix C preparation, linked back to each monograph')}<div class="notice good"><b>MSIC ICU principle:</b> ${esc(inf.principle||'Use an appropriate loading dose before prolonged-infusion maintenance.')}</div>${(inf.notes||[]).map(n=>`<div class="notice">${esc(n)}</div>`).join('')}<div class="list infusion-list">${rows.map(({d,x})=>`<details class="card infusion-card"><summary><b>${esc(d.name)}</b><span class="pill">4 h maintenance</span></summary><div class="prep-row"><b>Loading dose</b><span>${esc(x.appendixCLoading||x.loading||'')}</span></div><div class="prep-row"><b>Maintenance</b><span>${esc(x.maintenance||'')}</span></div>${x.highDoseContext?`<div class="notice good"><b>Higher-exposure context:</b> ${esc(x.highDoseContext)}</div>`:''}${x.appendixCPreparation?`<div class="prep-row"><b>Appendix C preparation</b><span>${esc(x.appendixCPreparation)}</span></div>`:''}${x.appendixCAdministration?`<div class="prep-row"><b>Administration</b><span>${esc(x.appendixCAdministration)}</span></div>`:''}<div class="btn-row"><button class="primary-btn" data-open="drug" data-id="${d.id}">Open drug details</button>${d.renalKey?`<button class="secondary-btn" data-tool="renal" data-drug="${d.id}">Renal / RRT dose</button>`:''}${x.preparationRef?`<button class="secondary-btn" data-source-ref='${encodeURIComponent(JSON.stringify(x.preparationRef))}'>Open MSIC preparation source</button>`:''}</div></details>`).join('')}</div><div class="notice warn"><b>Do not separate infusion time from dose selection.</b> Renal/RRT maintenance adjustment, infection site, MIC/susceptibility and product-specific stability/compatibility still apply.</div>${inf.page?`<div class="tag-row"><button class="pill" data-source-ref='${encodeURIComponent(JSON.stringify({source:inf.source,page:inf.page,pdfPage:inf.pdfPage}))}'>${refText({source:inf.source,page:inf.page,pdfPage:inf.pdfPage})}</button></div>`:''}${footer()}`;
}
function toolRounds(){
  const rounds=getRounds();$('#main').innerHTML=`${toolHeader('AMS round','Structured 48–72 h review cards stored only in this browser; avoid patient identifiers')}<div class="card"><div class="form-grid"><div class="field"><label>Bed / location</label><input id="rBed" placeholder="e.g. Bed 3"></div><div class="field"><label>Syndrome / indication</label><input id="rSynd" placeholder="e.g. VAP"></div><div class="field"><label>Antimicrobial</label><input id="rDrug" placeholder="e.g. meropenem"></div><div class="field"><label>Therapy day</label><input id="rDay" type="number" min="1" placeholder="4"></div><div class="field full"><label>Culture / key microbiology (no identifiers)</label><input id="rCult" placeholder="e.g. P. aeruginosa; cefepime susceptible"></div><div class="field"><label>Stewardship decision</label><select id="rDecision"><option>Review pending</option><option>Continue current therapy</option><option>Narrow / de-escalate</option><option>IV → PO switch</option><option>Stop antimicrobial</option><option>Escalate / specialist review</option></select></div><div class="field"><label>Planned stop/review date</label><input id="rStop" type="date"></div><div class="field full"><label>Decision rationale / source control</label><textarea id="rReason" placeholder="Diagnosis confidence, source control, cultures, organ function, duration rationale…"></textarea></div></div><div class="btn-row"><button id="rAdd" class="primary-btn">Add review card</button>${rounds.length?'<button id="rClear" class="danger-btn">Clear all</button>':''}</div></div><div id="roundList">${roundRows(rounds)}</div><div class="notice">Round cards stay in this browser's local storage and are intended as a stewardship checklist, not as a patient record.</div>${footer()}`;
  $('#rAdd').addEventListener('click',()=>{const x={id:Date.now(),bed:$('#rBed').value.trim(),syndrome:$('#rSynd').value.trim(),drug:$('#rDrug').value.trim(),day:$('#rDay').value.trim(),culture:$('#rCult').value.trim(),decision:$('#rDecision').value,stop:$('#rStop').value,reason:$('#rReason').value.trim(),checks:{}};if(!x.bed&&!x.syndrome&&!x.drug){toast('Add at least bed, syndrome or antimicrobial');return}const a=getRounds();a.push(x);setRounds(a);toolRounds()});$('#rClear')?.addEventListener('click',()=>{if(confirm('Clear all local AMS round cards?')){setRounds([]);toolRounds()}});
}
function roundRows(a){
  if(!a.length)return '<div class="empty"><b>No round cards yet</b>Add a temporary antimicrobial review card above.</div>';
  const checks=['Diagnosis / infection still likely?','Cultures and susceptibilities reviewed?','Spectrum can be narrowed or antimicrobial stopped?','Source control adequate / planned?','Dose rechecked for renal/RRT/TDM and current physiology?','IV → PO eligibility reviewed?','Duration / stop or review date documented?','Allergy, toxicity and interactions reviewed?'];
  return a.map(x=>`<div class="card round-card"><div class="source-meta"><h4 style="margin-right:auto">${esc(x.bed||'Round card')}</h4><span class="pill">${esc(x.decision||'Review pending')}</span><button class="link-btn" data-round-del="${x.id}">Delete</button></div><div class="round-meta">${esc([x.syndrome,x.drug,x.day&&`Day ${x.day}`,x.culture].filter(Boolean).join(' · '))}</div>${x.stop?`<div class="notice"><b>Planned stop/review:</b> ${esc(x.stop)}</div>`:''}${x.reason?`<div class="notice"><b>Rationale / source control:</b> ${esc(x.reason)}</div>`:''}<div class="checklist" style="margin-top:10px">${checks.map((c,i)=>`<label class="check-item"><input type="checkbox" data-round-check="${x.id}" data-check-index="${i}" ${x.checks?.[i]?'checked':''}><span>${esc(c)}</span></label>`).join('')}</div><div class="btn-row">${x.drug?`<button class="secondary-btn" data-synthesis="${esc(x.drug+' '+(x.syndrome||''))}">Search / synthesise this regimen</button>`:''}</div></div>`).join('');
}
function toolSources(){
  const ids=['hpusm','nag','msic','msidc','bluebook','myformulary','moh-dilution-standard','moh-dilution-fluid','sabah-dilution','shann','wellington','ncbi-mm','dailymed'];
  $('#main').innerHTML=`${toolHeader('Sources & app','Source provenance is part of every clinical record · national MOH dilution baseline + ICU fluid-restricted overlay')}<div class="card"><h3>Default display hierarchy</h3><ol class="small"><li>HPUSM ASP 2025 — local guidance where applicable</li><li>Malaysia NAG — structured national snapshot + official live freshness link</li><li>MSIC Adult ICU 2023 — ICU dosing, PK/PD, RRT, TDM and special populations</li><li>MSIDC MDR Gram-Negative 2024 — dedicated MDR mechanism/phenotype guidance</li><li>Wellington ICU spectrum chart — rapid expected-spectrum reference only</li></ol><div class="notice">Dedicated guidance may outrank the general hierarchy for its own domain. The app keeps source-specific recommendations separate rather than silently reconciling them.</div></div><div class="list">${ids.map(id=>{const s=source(id);return `<button class="list-row" data-source="${esc(id)}"><div class="grow"><strong>${esc(s.name)}</strong><small>${esc(s.note||'')}</small></div><span class="chev">›</span></button>`}).join('')}</div><div class="section-head"><div><h2>Bundled PDF reference library</h2><p>Every requested PDF source is included in this GitHub build and caches on demand after first opening.</p></div></div><div class="list">${(state.db.bundledReferences||[]).map(r=>`<a class="list-row" href="${esc(r.file)}" target="_blank" rel="noopener" style="text-decoration:none"><div class="grow"><strong>${esc(r.label)}</strong><small>Bundled source PDF</small></div><span class="chev">PDF ↗</span></a>`).join('')}</div><div class="notice good"><b>v0.20 clinical-depth/navigation release candidate.</b> Automated provenance, internal-link, JavaScript/JSON and bundled-PDF checks are supplemented by manual high-risk spot-checks. Deployment-specific install/offline/cache-upgrade verification remains a separate release gate.</div>${footer()}`;
}
function bindGlobal(){
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;const b=$('#installBtn');if(b)b.hidden=false;});window.addEventListener('appinstalled',()=>{state.installPrompt=null;const b=$('#installBtn');if(b)b.hidden=true;toast('AbxHub installed');});window.addEventListener('online',()=>toast('Back online'));window.addEventListener('offline',()=>toast('Offline mode — cached reference remains available'));history.scrollRestoration='manual';window.addEventListener('popstate',e=>{if(e.state?.abxRoute)restoreRoute(e.state.abxRoute,e.state.scrollY||0);});
  let scrollTick=false;window.addEventListener('scroll',()=>{if(scrollTick)return;scrollTick=true;requestAnimationFrame(()=>{scrollTick=false;$('#goTop')?.classList.toggle('show',window.scrollY>520);});},{passive:true});
  document.addEventListener('click',e=>{const b=e.target.closest('button,a');if(!b)return;if(b.matches('[data-close-modal]'))return closeModal();if(b.id==='goTop'){scrollTo({top:0,behavior:'smooth'});return}if(b.dataset.nav){switchPrimaryNav(b.dataset.nav);return}if(b.dataset.go==='home'){switchPrimaryNav('home');return}if(b.hasAttribute('data-back')){back();return}if(b.id==='themeBtn'){state.theme=state.theme==='dark'?'light':'dark';applyTheme();return}if(b.id==='installBtn'){if(state.installPrompt){state.installPrompt.prompt();state.installPrompt.userChoice.finally(()=>{state.installPrompt=null;b.hidden=true})}return}if(b.dataset.query){const q=b.dataset.query,inp=$('#universalSearch');if(inp){inp.value=q;updateHomeSearchRoute(q);renderLiveSearch(q)}return}if(b.dataset.hitType){if(b.dataset.hitType==='naglink'){window.open(b.dataset.hitUrl,'_blank','noopener');return}renderEntity(b.dataset.hitType,b.dataset.hitId);return}if(b.dataset.open){renderEntity(b.dataset.open,b.dataset.id);return}if(b.dataset.tool){if(b.dataset.tool==='back-tools'){renderTools();return}const opts={drug:b.dataset.drug,crcl:b.dataset.crcl,rrt:b.dataset.rrt};renderTool(b.dataset.tool,opts);return}if(b.dataset.source){openSource(b.dataset.source);return}if(b.dataset.sourceRef){const r=JSON.parse(decodeURIComponent(b.dataset.sourceRef));openSource(r.source,r);return}if(b.dataset.favType){toggleFav(b.dataset.favType,b.dataset.favId,b.dataset.favName);return}if(b.dataset.recentType){renderEntity(b.dataset.recentType,b.dataset.recentId);return}if(b.dataset.synthesis){renderSynthesis(b.dataset.synthesis);return}if(b.dataset.jump){$(b.dataset.jump)?.scrollIntoView({behavior:'smooth',block:'start'});return}if(b.dataset.roundDel){const a=getRounds().filter(x=>String(x.id)!==String(b.dataset.roundDel));setRounds(a);toolRounds();return}if(b.id==='searchGo'){const q=$('#universalSearch')?.value.trim();if(q)renderSearchResults(q);return}if(b.id==='searchPageGo'){const q=$('#searchPageInput')?.value.trim();if(q){updateSearchRoute(q);$('#searchPageResults').innerHTML=searchResultsHTML(q)}return}});
  document.addEventListener('change',e=>{const c=e.target;if(c.matches('[data-round-check]')){const a=getRounds(),x=a.find(r=>String(r.id)===String(c.dataset.roundCheck));if(x){x.checks=x.checks||{};x.checks[c.dataset.checkIndex]=c.checked;setRounds(a)}}});
  document.addEventListener('input',e=>{if(e.target.id==='universalSearch'){updateHomeSearchRoute(e.target.value);renderLiveSearch(e.target.value)}if(e.target.id==='searchPageInput'){updateSearchRoute(e.target.value);$('#searchPageResults').innerHTML=searchResultsHTML(e.target.value)}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='Enter'&&e.target.id==='universalSearch'){e.preventDefault();const q=e.target.value.trim();if(q)renderSearchResults(q)}if(e.key==='Enter'&&e.target.id==='searchPageInput'){e.preventDefault();const q=e.target.value.trim();if(q){updateSearchRoute(q);$('#searchPageResults').innerHTML=searchResultsHTML(q)}}});
}
/* ==================== end v0.20.0 overrides ==================== */

async function init(){
  applyTheme(); bindGlobal();
  try{
    const [db,nag]=await Promise.all([loadDataset('./data/clinical-data.json','clinical'),loadDataset('./data/nag-topics.json','nag')]); state.db=db;state.nag=nag; if(history.state?.abxRoute) restoreRoute(history.state.abxRoute,history.state.scrollY||0); else renderHome();
    if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js?v=0.20.0',{updateViaCache:'none'}).then(reg=>{reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)toast('App update ready — reopen to refresh')})})}).catch(()=>{});
  }catch(e){
    $('#main').innerHTML=`<div class="empty"><b>Unable to initialise AbxHub</b>${esc(e.message)}<br><br>If this is a GitHub Pages deployment, hard-refresh once after the service worker update (or clear the old site cache if upgrading from v0.6). If testing locally, serve the folder through HTTPS/localhost rather than opening index.html directly.</div>`;
  }
}
init();
