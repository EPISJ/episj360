/* ---------- documentos exigidos ---------- */
function renderDocs(){
  $("#tbDocs").innerHTML=cfg.docTypes.map(d=>`<tr data-id="${d.id}">
   <td><input type="text" data-k="nome" value="${esc(d.nome)}"></td>
   <td><input type="text" data-k="subpasta" value="${esc(d.subpasta)}" placeholder="—"></td>
   <td><input type="text" data-k="palavras" value="${esc(d.palavras)}" placeholder="qualquer nome"></td>
   <td><input type="text" data-k="conteudo" value="${esc(d.conteudo||"")}" placeholder="não verificar"></td>
   <td class="hm"><input type="text" data-k="ext" value="${esc(d.ext)}" placeholder="qualquer" style="width:110px"></td>
   <td class="hm"><input type="number" min="1" data-k="min" value="${d.min||1}"></td>
   <td><button class="x" title="Remover" data-del>×</button></td></tr>`).join("");
}
$("#tbDocs").addEventListener("input",e=>{const tr=e.target.closest("tr");const d=cfg.docTypes.find(x=>x.id===tr.dataset.id);const k=e.target.dataset.k;d[k]=k==="min"?Math.max(1,parseInt(e.target.value)||1):e.target.value;save();if(k==="nome")renderMods()});
$("#tbDocs").addEventListener("click",e=>{if(!e.target.hasAttribute("data-del"))return;const id=e.target.closest("tr").dataset.id;cfg.docTypes=cfg.docTypes.filter(x=>x.id!==id);cfg.mods.forEach(m=>m.docs=m.docs.filter(x=>x!==id));save();renderAll()});
$("#addDoc").onclick=()=>{const d={id:uid(),nome:"Novo documento",subpasta:"",palavras:"",conteudo:"",ext:"",min:1};cfg.docTypes.push(d);cfg.mods.forEach(m=>m.docs.push(d.id));save();renderAll()};
$("#dtpPreset").onclick=()=>{ponto("Antes de aplicar o modelo DTP EPISJ");cfg.docTypes=dtpTypes();cfg.mods.forEach(m=>m.docs=cfg.docTypes.map(d=>d.id));save();renderAll();toast("Modelo DTP EPISJ aplicado (pode anular)")};

/* ---------- formadores ---------- */
// 0.9.131: email da escola por defeito — primeiro nome + último apelido, sem acentos (Joel Lima da Cunha → joel.cunha@episj.com)
const EMAIL_DOM="episj.com";
function emailAuto(nome){const w=String(nome||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z\s'-]/g," ").split(/\s+/).map(x=>x.replace(/['-]/g,"")).filter(x=>x&&!/^(da|de|do|das|dos|e|d)$/.test(x));
  if(!w.length)return "";return (w.length>1?w[0]+"."+w[w.length-1]:w[0])+"@"+EMAIL_DOM}
// só preenche quem não tem email — nunca muda um email escrito à mão
function emailsAuto(){let n=0;(cfg.profs||[]).forEach(p=>{if(!String(p.email||"").trim()){const e=emailAuto(p.nome);if(e){p.email=e;n++}}});return n}
function renderProfs(){if(!renderProfs.wa){renderProfs.wa=1;waPronto().then(()=>{if(curTab==="prof")renderProfs()})} // 0.9.170: telemóveis (peça H3)
  if(emailsAuto())save();
  const q=norm(($("#profFilter")||{}).value||"");
  const list=cfg.profs.filter(p=>!q||norm((p.cod||"")+" "+p.nome+" "+p.email).includes(q));
  const semMail=cfg.profs.filter(p=>!/\S+@\S+\.\S+/.test(p.email||"")).length;
  const cnt={};ativos().forEach(m=>{const p=profOf(m);if(p)cnt[p]=(cnt[p]||0)+1});
  const wEl=$("#profWarn");if(wEl)wEl.innerHTML=cfg.profs.length?(semMail?`<div class="msg bad">${semMail} formador(es) sem email válido — não vão receber mensagens.</div>`:`<div class="msg ok">${cfg.profs.length} formador(es), todos com email.</div>`):"";
  PROF_N=PROF_N||200;const resto=list.length-PROF_N; // 0.9.53: com 1000 formadores, 200 linhas de cada vez (eram 4000 caixas de texto a cada redesenho)
  $("#tbProfs").innerHTML=list.slice(0,PROF_N).map(p=>`<tr data-id="${p.id}">
   <td><input type="text" data-k="cod" value="${esc(p.cod||"")}"></td>
   <td><input type="text" data-k="nome" value="${esc(p.nome)}"></td>
   <td><input type="text" data-k="abrev" value="${esc(p.abrev||"")}" maxlength="8"></td>
   <td><input type="email" data-k="email" value="${esc(p.email)}"></td>
   <td><input type="date" data-k="nasc" value="${esc(p.nasc||"")}" title="Data de nascimento (só para o widget Aniversários do Dashboard; não é publicada)"></td>
   <td><input type="tel" data-wtel="${esc(p.id)}" value="${esc(waTelVer(H3&&H3.tel[p.id]))}" placeholder="9xx xxx xxx" inputmode="tel" title="Para o SMS e o WhatsApp (só a Direção; não é publicado)"></td>
   <td class="hm" style="color:var(--muted)">${cnt[p.id]||0}</td>
   <td><button class="x" title="Remover" data-del>×</button></td></tr>`).join("")+(resto>0?`<tr><td colspan="8" style="text-align:center"><button class="b s" type="button" data-profmais>Mostrar mais ${Math.min(resto,500)} (faltam ${resto}) — ou procure acima</button></td></tr>`:"")||`<tr><td colspan="8" class="hint">${cfg.profs.length?"Ninguém corresponde à procura.":"Ainda sem formadores — adicione no formulário acima ou cole uma lista abaixo."}</td></tr>`;
}
var PROF_N=200;
// 0.9.170: telemóvel do formador (o mesmo do Horários360 › Comunicar) — peça H3, só a Direção
$("#tbProfs").addEventListener("change",async e=>{const i=e.target.closest("[data-wtel]");if(!i)return;await waPronto();if(!waTelGravar("p",i.dataset.wtel,i.value)){toast("Número de telemóvel inválido");return}i.value=waTelVer(H3.tel[i.dataset.wtel])});
$("#tbProfs").addEventListener("input",e=>{if(!e.target.dataset.k)return;const tr=e.target.closest("tr");const p=cfg.profs.find(x=>x.id===tr.dataset.id);
  if(e.target.dataset.k==="nome"){const ant=emailAuto(p.nome);if(!String(p.email||"").trim()||p.email===ant){p.email=emailAuto(e.target.value);const ie=tr.querySelector('[data-k="email"]');if(ie)ie.value=p.email}}
  p[e.target.dataset.k]=e.target.value;save();if(e.target.dataset.k==="nome")nomesMudaram();try{esRecarregar()}catch(_){}});
const nomesMudaram=debounce(()=>{renderMods();renderGrid()},300);
$("#tbProfs").addEventListener("click",e=>{if(e.target.hasAttribute("data-profmais")){PROF_N+=500;renderProfs();return}if(!e.target.hasAttribute("data-del"))return;const id=e.target.closest("tr").dataset.id;
  cfg.profs=cfg.profs.filter(x=>x.id!==id);cfg.mods.forEach(m=>{if(m.profId===id)m.profId=""});for(const k in cfg.grid)if(cfg.grid[k]===id)delete cfg.grid[k];save();renderAll();toast("Formador removido (pode anular)")});
$("#profForm").addEventListener("input",()=>{$("#pFormMsg").innerHTML="";$("#pEmail").placeholder=emailAuto($("#pNome").value)||"nome.apelido@"+EMAIL_DOM});
$("#profForm").addEventListener("submit",e=>{e.preventDefault();
  const cod=$("#pCod").value.trim(),nome=$("#pNome").value.trim(),email=$("#pEmail").value.trim()||emailAuto(nome),abrev=$("#pAbrev").value.trim();
  const msg=(t,k)=>{$("#pFormMsg").innerHTML=`<div class="msg ${k}" style="margin:0 0 12px">${esc(t)}</div>`};
  if(!nome){msg("Indique o nome do formador.","bad");$("#pNome").focus();return}
  if(email&&!/^\S+@\S+\.\S+$/.test(email)){msg("O email não parece válido.","bad");$("#pEmail").focus();return}
  const dup=cfg.profs.find(p=>(cod&&norm(p.cod)===norm(cod))||(email&&norm(p.email)===norm(email)));
  if(dup){msg(`Já existe um formador com ${cod&&norm(dup.cod)===norm(cod)?"esse código":"esse email"}: ${dup.nome}.`,"bad");return}
  cfg.profs.push({id:uid(),cod,nome,email,abrev});cfg.profs.sort(cmpProf);save();renderAll();
  msg(`${nome} adicionado(a).`,"ok");$("#profForm").reset();$("#pCod").focus();});
{let h=null;$("#profFilter").addEventListener("input",()=>{PROF_N=200;clearTimeout(h);h=setTimeout(renderProfs,120)})}
$("#profImport").onclick=()=>{
  const lines=$("#profBulk").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
  ponto("Antes de colar uma lista de formadores");
  let add=0,upd=0,bad=0;
  for(const l of lines){
    const em=(l.match(/[^\s;,<>"]+@[^\s;,<>"]+\.[^\s;,<>"]+/)||[])[0]||"";
    if(!em&&(/e-?mail|c[oó]digo/i.test(l)||/^(nome|name|professor(es)?|formador(es)?)$/i.test(l.trim())))continue; // linha de cabeçalho
    let parts=l.replace(em,"").replace(/[<>"]/g,"").split(/\t|;|,/).map(x=>x.trim()).filter(Boolean);
    let cod="";if(parts.length>=2&&/^[\w.\-\/]{1,12}$/.test(parts[0])&&/\d/.test(parts[0])){cod=parts.shift()}
    let nm=parts.join(" ").trim();
    if(!nm&&!em){bad++;continue}
    if(!nm)nm=em.split("@")[0];
    const ex=cfg.profs.find(p=>(cod&&p.cod&&norm(p.cod)===norm(cod))||(em&&norm(p.email)===norm(em))||norm(p.nome)===norm(nm));
    if(ex){if(em)ex.email=em;if(cod)ex.cod=cod;if(nm)ex.nome=ex.nome||nm;if(!ex.email)ex.email=emailAuto(ex.nome);upd++}else{cfg.profs.push({id:uid(),cod,nome:nm,email:em||emailAuto(nm)});add++}
  }
  cfg.profs.sort(cmpProf);
  save();renderAll();
  $("#profMsg").textContent=`${add} adicionado(s), ${upd} atualizado(s)${bad?`, ${bad} linha(s) ignorada(s)`:""}.`;
  if(add||upd)$("#profBulk").value="";
};

/* ===================== 0.9.48: listas preguiçosas (1000 formadores) =====================
   Os menus de formador/turma em tabelas grandes só têm a opção escolhida até se tocar neles; aí enchem-se de uma vez (lista em cache).
   Com 1000 formadores e 60 turmas, a página de Turmas passava de dezenas de milhares de opções para uma por linha. */
const LZ={first:[],cache:{}};
function lzLista(kind){const k=kind+":"+cfgRev+":"+(kind==="turma"||kind==="tcod"?(anoAtivo()||{}).id:"");const c=LZ.cache[kind];if(c&&c.k===k)return c.h;let h="";
  if(kind==="prof")h=cfg.profs.slice().sort(cmpProf).map(p=>`<option value="${p.id}">${esc(p.nome||"(sem nome)")}${p.cod?` (${esc(p.cod)})`:""}</option>`).join("");
  else if(kind==="tcod")h=[...new Set(turmasDoAno().map(t=>t.cod))].map(c=>`<option>${esc(c)}</option>`).join("");
  else if(kind==="turma"){const a=anoAtivo();h=escData().turmas.slice().sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod))).map(t=>`<option value="${t.id}">${esc(t.cod)}${turmaNoAno(t,a)?"":" (outro ano)"}</option>`).join("")}
  LZ.cache[kind]={k,h};return h}
function lzOpts(kind,sel,first){first=first??(kind==="turma"?`<option value="">— sem turma —</option>`:`<option value="">— escolher —</option>`);let i=LZ.first.indexOf(first);if(i<0){LZ.first.push(first);i=LZ.first.length-1}
  let lbl="";if(sel){if(kind==="prof"){const p=cfg.profs.find(x=>x.id===sel);lbl=p?(p.nome||"(sem nome)")+(p.cod?` (${p.cod})`:""):"(formador apagado)"}else{const t=escData().turmas.find(x=>x.id===sel);lbl=t?t.cod+(turmaNoAno(t,anoAtivo())?"":" (outro ano)"):"(turma apagada)"}}
  return first.replace("<option",`<option data-lzk="${kind}" data-lzf="${i}"`)+(sel?`<option value="${esc(sel)}" selected>${esc(lbl)}</option>`:"")}
function lzEncher(sel){if(!sel||sel.dataset.lzok)return;const o=sel.querySelector("option[data-lzk]");if(!o)return;sel.dataset.lzok=1;
  const v=sel.value,kind=o.dataset.lzk,f=LZ.first[+o.dataset.lzf]||"",lab=v?(sel.selectedOptions[0]||{}).textContent:"";sel.innerHTML=f+lzLista(kind);
  if(v&&![...sel.options].some(x=>x.value===v))sel.insertAdjacentHTML("beforeend",`<option value="${esc(v)}">${esc(lab||"(apagado)")}</option>`);sel.value=v}
["pointerdown","mousedown","touchstart","focusin","keydown"].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target;if(t&&t.tagName==="SELECT"&&!t.dataset.lzok)lzEncher(t)},true));
function profOpts(sel,first){return (first??`<option value="">— escolher —</option>`)+cfg.profs.slice().sort(cmpProf).map(p=>`<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.nome||"(sem nome)")}${p.cod?` (${esc(p.cod)})`:""}</option>`).join("")}

/* ---------- módulos do(s) ano(s) letivo(s) da análise carregada ---------- */
let _atv=null,_atvK="";
function ativos(){const k=filesRev+"|"+cfgRev;if(_atv&&_atvK===k)return _atv;
  const idx=getIdx();
  _atv=!idx.recs.length?cfg.mods:cfg.mods.filter(m=>m.ano?idx.anos.has(m.ano):(idx.anos.size===0||idx.pick(segs(m.pasta),"folders").length>0));
  _atvK=k;return _atv}
// módulos antigos (sem ano letivo): ficam associados ao ano da análise onde as suas pastas existem
function adotar(){const idx=getIdx();if(!idx.anos.size)return 0;let n=0;
  for(const m of cfg.mods){if(m.ano)continue;const ss=segs(m.pasta);if(!ss.length)continue;
    for(const [ano,dir] of idx.anos){if(idx.pick([norm(dir),...ss],"folders").length){m.ano=ano;m.anoDir=dir;m.pasta=dir+" / "+m.pasta;n++;break}}}
  if(n){cfgRev++;const s=JSON.stringify(cfg);lastJSON=s;try{localStorage.setItem(KEY,s)}catch(e){}}
  return n}
const anoRef=()=>[...getIdx().anos.keys()].sort().join(",");

/* ---------- grelha turma × disciplina ---------- */
function gridRows(){
  const map=new Map();
  for(const m of ativos()){const k=gridKey(m);let r=map.get(k);if(!r)map.set(k,r={k,turma:m.turma,disc:m.disc,ano:m.ano||"",ref:m,mods:[]});r.mods.push(m)}
  return [...map.values()].sort((a,b)=>a.ano.localeCompare(b.ano)||COLL_PTN.compare(a.turma,b.turma)||COLL_PTN.compare(a.disc,b.disc));
}
function gridRowHTML(r){let html="";
    const exc=r.mods.filter(isExc),g=gridGet(r.ref),gp=g?"":planoProf(r.ref);
    const ab=GOPEN.has(r.k);
    html+=`<div class="grow2${g||gp?"":" vazio"}${ab?" open":""}" data-g="${esc(r.k)}"${gp?` title="Formador tirado do Plano Curricular da turma — escolha outro para mudar"`:""}><span>${esc(r.disc||"(sem disciplina)")}</span><button class="n gopen" data-gopen title="Ver os módulos e atribuir cada um a um formador">${r.mods.length} ${r.mods.length===1?"módulo":"módulos"} <span class="car">▾</span></button>
      <select data-grid>${lzOpts("prof",g,gp?`<option value="">↳ do Plano Curricular: ${esc(profName(gp))}</option>`:`<option value="">— sem formador —</option>`)}</select>
      <span class="exc">${exc.length?`<a href="#" data-excf="${esc(r.turma+" "+discShort(r.disc))}">${exc.length} exceção${exc.length===1?"":"ões"}: ${esc([...new Set(exc.map(m=>profName(m.profId)))].join(", "))}</a>`:""}</span></div>`;
    if(ab)html+=`<div class="gsub">${r.mods.slice().sort((a,b)=>COLL_PTN.compare(String(a.cod),String(b.cod))).map(m=>`<div class="gsubr${isExc(m)?" exc":""}" data-mid="${m.id}"><span>${esc(modTitle(m))}</span>
      <select data-mprof>${lzOpts("prof",m.profId||"",`<option value="">↳ o da disciplina (${esc(profName(g||gp)||"sem formador")})</option>`)}</select></div>`).join("")}</div>`;
  return html}
function renderGrid(){
  const q=norm($("#gFilter").value),only=$("#gEmpty").checked,gp=$("#gProf"),pf=gp.value;
  gp.innerHTML=profOpts(pf,`<option value="">Todos os formadores</option>`);gp.value=cfg.profs.some(p=>p.id===pf)?pf:"";const pid=gp.value;
  const all=gridRows(),multi=new Set(all.map(r=>r.ano)).size>1;
  const rows=all.filter(r=>(!q||q.split(" ").every(w=>norm(r.turma+" "+r.disc+" "+r.ano+" "+profName(gridEf(r.ref))).includes(w)))&&(!only||!gridEf(r.ref))&&(!pid||gridEf(r.ref)===pid||r.mods.some(m=>profOf(m)===pid)));
  let html="",last=null;
  for(const r of rows){
    const tk=r.ano+"|"+r.turma;
    if(tk!==last){html+=`<div class="gturma">${esc(r.turma||"(sem turma)")}${multi&&r.ano?` <span class="tag" style="background:#eef1f5;color:#4a5260">${esc(r.ano)}</span>`:""}</div>`;last=tk}
    html+=gridRowHTML(r);
  }
  const sem=all.filter(r=>!gridEf(r.ref)).length,doPlano=all.filter(r=>!gridGet(r.ref)&&planoProf(r.ref)).length,outros=cfg.mods.length-ativos().length,anos=[...getIdx().anos.keys()].sort();
  $("#anoInfo").innerHTML=anos.length?`Ano letivo da análise carregada: <b>${esc(anos.join(", "))}</b>${outros?` · ${outros} módulo(s) de outros anos letivos estão guardados, mas não aparecem aqui nem no relatório`:""}`:(outros?`${outros} módulo(s) de outras análises não aparecem aqui`:"");
  $("#grid").innerHTML=(all.length?`<p class="hint" id="gridRes">${all.length} disciplinas em ${new Set(all.map(r=>r.ano+"|"+r.turma)).size} turmas · ${sem} sem formador${doPlano?` · ${doPlano} com o formador do Plano Curricular`:""}</p>`:"")+(html||`<p class="hint">${all.length?"Nada corresponde ao filtro.":"Ainda sem módulos nesta análise: carregue a listagem da Box e clique em “Detetar módulos e UFCD”."}</p>`);
}

/* 0.9.85: escolher o formador na grelha é imediato — troca-se só a linha; gravar, o resumo, os Módulos e os Formadores vêm a seguir, sem prender o menu */
function gridTrocarLinha(k){const el=[...document.querySelectorAll("#grid [data-g]")].find(x=>x.dataset.g===k);const r=gridRows().find(x=>x.k===k);if(!el||!r)return;
  const nx=el.nextElementSibling,sub=nx&&nx.classList.contains("gsub")?nx:null,foc=document.activeElement&&el.contains(document.activeElement)?"[data-grid]":null;
  const t=document.createElement("div");t.innerHTML=gridRowHTML(r);if(sub)sub.remove();el.replaceWith(...t.childNodes);
  if(foc){const n=[...document.querySelectorAll("#grid [data-g]")].find(x=>x.dataset.g===k);const sl=n&&n.querySelector(foc);if(sl)sl.focus({preventScroll:true})}}
let GRID_H=0,GRID_SUJO={mods:0,profs:0};addEventListener("pagehide",()=>{if(GRID_H){clearTimeout(GRID_H);GRID_H=0;try{save()}catch(e){}}});
function gridDepois(){clearTimeout(GRID_H);GRID_H=setTimeout(()=>{save();
  try{const all=gridRows(),sem=all.filter(r=>!gridEf(r.ref)).length,doPlano=all.filter(r=>!gridGet(r.ref)&&planoProf(r.ref)).length,el=$("#gridRes");
    if(el)el.textContent=`${all.length} disciplinas em ${new Set(all.map(r=>r.ano+"|"+r.turma)).size} turmas · ${sem} sem formador${doPlano?` · ${doPlano} com o formador do Plano Curricular`:""}`;
    if($("#gEmpty").checked||$("#gProf").value)renderGrid()}catch(e){}
  GRID_SUJO.mods=1;GRID_SUJO.profs=1;const idle=window.requestIdleCallback||(f=>setTimeout(f,200));
  idle(()=>{if(GRID_SUJO.mods){GRID_SUJO.mods=0;try{renderMods()}catch(e){}}if(GRID_SUJO.profs&&curTab==="prof"){GRID_SUJO.profs=0;try{renderProfs()}catch(e){}}})},250)}
$("#gFilter").addEventListener("input",debounce(()=>renderGrid(),140));$("#gEmpty").addEventListener("change",renderGrid);$("#gProf").addEventListener("change",renderGrid);
$("#grid").addEventListener("change",e=>{if(e.target.matches("[data-mprof]")){const m=cfg.mods.find(x=>x.id===e.target.closest("[data-mid]").dataset.mid);if(!m)return;
    m.profId=e.target.value===gridEf(m)?"":e.target.value;gridTrocarLinha(gridKey(m));gridDepois();toast(m.profId?"Módulo atribuído a "+profName(m.profId)+" (exceção)":"O módulo volta a seguir a disciplina");return}
  if(!e.target.matches("[data-grid]"))return;const k=e.target.closest("[data-g]").dataset.g,v=e.target.value;
  const row=gridRows().find(r=>r.k===k);if(!row)return;const leg=legKey(row.ref);
  if(v)cfg.grid[k]=v;else if(k!==leg&&cfg.grid[leg])cfg.grid[k]="";else delete cfg.grid[k];
  row.mods.forEach(m=>{if(m.profId===v)m.profId=""}); // deixa de ser exceção se coincidir
  gridTrocarLinha(k);gridDepois()});
$("#grid").addEventListener("click",e=>{const o=e.target.closest("[data-gopen]");if(o){const k=o.closest("[data-g]").dataset.g;GOPEN.has(k)?GOPEN.delete(k):GOPEN.add(k);renderGrid();return}
  const a=e.target.closest("[data-excf]");if(!a)return;e.preventDefault();$("#modFilter").value="!exc "+a.dataset.excf;renderMods();$("#tbMods").scrollIntoView({behavior:"smooth",block:"start"})});

/* ---------- lista de módulos (exceções) ---------- */
function modVisible(m){const q=norm($("#modFilter").value);if(!q)return true;
  let rest=q;const noProf=rest.includes("!prof"),exc=rest.includes("!exc");rest=rest.replace("!prof","").replace("!exc","").trim();
  if(noProf&&profOf(m))return false;if(exc&&!isExc(m))return false;
  const hay=norm([m.turma,m.disc,m.cod,desigOf(m),m.pasta,profName(profOf(m))].join(" "));
  return rest.split(" ").filter(Boolean).every(w=>hay.includes(w));}
function renderMods(){
  $("#bulkProf").innerHTML=profOpts("",`<option value="">— escolher —</option><option value="__grid">↩ segue a grelha (desfazer exceções)</option>`);
  const atv=ativos(),vis=atv.filter(modVisible);
  $("#detMsg").textContent=atv.length?`${atv.length} módulos · ${atv.filter(m=>!profOf(m)).length} sem formador · ${atv.filter(isExc).length} exceções`:"";
  MODS_N=MODS_N||100;EXC_ABRE=EXC_ABRE||new Set();$("#tbMods").innerHTML=vis.slice(0,MODS_N).map(m=>{const g=gridEf(m),exc=isExc(m),segue=!m.profId&&!EXC_ABRE.has(m.id);
    return `<div class="mcard${profOf(m)?"":" noprof"}${exc?" exc":""}" data-id="${m.id}">
   <label class="f-nome"><span>Módulo / UFCD${exc?` <span class="tag exc">exceção</span>`:""}</span><input type="text" data-k="cod" value="${esc(m.cod)}"></label>
   <label class="f-turma"><span>Turma · disciplina</span><input type="text" value="${esc(m.turma+" · "+m.disc)}" title="${esc(m.turma+" · "+m.disc)}" disabled></label>
   <div class="f-prof"><span>Formador</span><div class="profrow">${segue?`<label class="chip tog" title="Desligue para escolher outro formador só para este módulo (exceção)"><input type="checkbox" data-segue checked> Segue a grelha</label><select disabled title="Formador da grelha"><option>${g?esc(profName(g)):"sem formador"}</option></select>`:`<label class="chip tog" title="Ligue para o módulo voltar a seguir o formador da grelha${g?" ("+esc(profName(g))+")":""}"><input type="checkbox" data-segue> Segue a grelha</label><select data-k="profId">${lzOpts("prof",m.profId||"",`<option value="">— escolher —</option>`)}</select>`}</div></div>
   <button class="x f-del" title="Remover módulo" data-del>×</button>
   <label class="f-pasta"><span>Designação</span><input type="text" data-des value="${esc(desigOf(m))}" placeholder="ex.: Probabilidade"></label>
   <div class="f-docs"><span>Pastas: ${esc(m.pasta)}</span></div>
  </div>`}).join("")+(vis.length>MODS_N?`<div style="text-align:center;margin:8px 0"><span class="hint" style="margin:0 10px 0 0">A mostrar ${MODS_N} de ${vis.length} (use o filtro para encontrar um módulo).</span><button class="b s" type="button" data-modmais>Mostrar mais ${Math.min(100,vis.length-MODS_N)}</button></div>`:"")||`<p class="hint">${atv.length?"Nenhum módulo corresponde ao filtro.":"Ainda sem módulos nesta análise."}</p>`;
  const bm=$("#tbMods").querySelector("[data-modmais]");if(bm)bm.onclick=()=>{MODS_N+=100;renderMods()};
}
var EXC_ABRE=EXC_ABRE||new Set(); // 0.9.103: módulos com «Segue a grelha» desligado mas ainda sem formador escolhido
var MODS_N=100; // 0.9.86: 100 cartões de cada vez (eram 300 de uma vez, ~9000 elementos)
$("#modFilter").addEventListener("input",debounce(()=>{MODS_N=100;renderMods()},140));
$("#bulkAssign").onclick=()=>{const pid=$("#bulkProf").value;if(!pid){toast("Escolha um formador");return}
  const vis=ativos().filter(modVisible);if(!vis.length)return;
  ponto(`Antes de mudar o formador de ${vis.length} módulo(s)`);
  vis.forEach(m=>{m.profId=pid==="__grid"?"":(pid===gridEf(m)?"":pid)});save();renderAll();
  toast(pid==="__grid"?`${vis.length} módulo(s) voltaram a seguir a grelha`:`${vis.length} módulo(s) mudados`)};
const modId=m=>(m.ano||"")+"|"+norm(m.turma)+"|"+discCode(m.disc)+"|"+modKey(m.cod);
function detetar(){
  // só procura módulos nas secções usadas pelos documentos exigidos (ex.: 006, 007, 008, 012); ignora as pastas dos formandos
  const idx=getIdx();
  const secs=[]; // 0.9.97: procura em todas as secções (antes só nas dos «documentos exigidos»)
  const found=new Map();
  for(const rec of idx.recs){const comps=rec.r,nc=rec.n;
    if(secs.length&&!secs.some(s=>nc.some(c=>segMatch(c,s))))continue;
    if(nc.some(c=>/^0*3(\.\d+)*\s*-\s*formandos/.test(c)||c==="formandos"))continue; // 003 - Formandos (dados dos formandos); «008.1 - Formandos» tem os módulos
    for(let i=1;i<comps.length;i++){
      let disc=null,mod=null;
      if(isDisc(comps[i-1])){disc=comps[i-1];mod=comps[i]}else if(isModName(comps[i])&&!isDisc(comps[i])){disc=comps[i-1];mod=comps[i]}
      if(!mod)continue;
      const turma=comps.slice(0,i).find(isTurma);if(!turma)break; // 0.9.97: só dentro da pasta de uma turma
      const anoDir=comps.slice(0,i).find(c=>anoDe(c))||"";
      const key=anoDe(anoDir)+"|"+norm(turma)+"|"+discCode(disc)+"|"+modKey(mod);
      if(!found.has(key))found.set(key,{turma,disc,mod,anoDir});break;}}
  return found}
$("#detect").onclick=()=>{
  if(!files.length&&!folders.length){$("#detMsg").textContent="Carregue primeiro a listagem da Box em Análise.";return}
  adotar();
  const found=detetar(),have=new Set(cfg.mods.map(modId));
  const novos=[...found.entries()].filter(([k])=>!have.has(k)).map(([,v])=>v);
  if(novos.length)ponto(`Antes de detetar ${novos.length} módulo(s)`);
  for(const v of novos){const m={id:uid(),nome:"",turma:v.turma,disc:v.disc,cod:v.mod,ano:anoDe(v.anoDir),anoDir:v.anoDir,profId:"",docs:cfg.docTypes.map(d=>d.id)};m.pasta=pastaDe(m);cfg.mods.push(m)}
  const sk=m=>(m.ano||"")+"|"+m.turma+"|"+m.disc+"|"+m.cod;
  cfg.mods.sort((a,b)=>COLL_PTN.compare(sk(a),sk(b)));
  save();renderAll();toast(novos.length?`${novos.length} módulo(s)/UFCD novos detetados (pode anular)`:"Nenhum módulo novo encontrado");
  verificarFundo();
};
$("#tbMods").addEventListener("input",e=>{const tr=e.target.closest("[data-id]");if(!tr)return;const m=cfg.mods.find(x=>x.id===tr.dataset.id);
  if(e.target.dataset.doc){const id=e.target.dataset.doc;if(e.target.checked){if(!m.docs.includes(id))m.docs.push(id)}else m.docs=m.docs.filter(x=>x!==id);e.target.parentElement.classList.toggle("on",e.target.checked);save();return}
  if(e.target.hasAttribute("data-des")){const k=discCode(m.disc)+"|"+modKey(m.cod);if(e.target.value.trim())cfg.desig[k]=e.target.value.trim();else delete cfg.desig[k];save();return}
  const k=e.target.dataset.k;if(!k)return;
  if(k==="profId"){if(!e.target.value)return;m.profId=e.target.value===gridEf(m)?"":e.target.value;EXC_ABRE.delete(m.id);save();renderMods();renderGrid();renderProfs();
    toast(m.profId?"Módulo atribuído a "+profName(m.profId)+" (exceção)":"É o formador da grelha — o módulo volta a seguir a grelha");return}
  m[k]=e.target.value;if(k==="cod")m.pasta=pastaDe(m);save();});
// 0.9.103: interruptor «Segue a grelha» em cada módulo
$("#tbMods").addEventListener("change",e=>{if(!e.target.hasAttribute("data-segue"))return;const tr=e.target.closest("[data-id]");const m=tr&&cfg.mods.find(x=>x.id===tr.dataset.id);if(!m)return;
  if(e.target.checked){EXC_ABRE.delete(m.id);const tinha=!!m.profId;m.profId="";if(tinha){save();renderGrid();renderProfs()}renderMods();if(tinha)toast("O módulo volta a seguir a grelha");return}
  EXC_ABRE.add(m.id);renderMods();const s=$("#tbMods").querySelector(`[data-id="${m.id}"] select[data-k="profId"]`);if(s){s.focus();try{s.showPicker&&s.showPicker()}catch(_){}}});
$("#tbMods").addEventListener("click",e=>{if(!e.target.hasAttribute("data-del"))return;const id=e.target.closest("[data-id]").dataset.id;cfg.mods=cfg.mods.filter(x=>x.id!==id);save();renderAll();toast("Módulo removido (pode anular)")});
$("#addMod").onclick=()=>{const r=gridRows()[0],idx=getIdx(),a=[...idx.anos][0]||["",""];
  const m={id:uid(),nome:"",turma:r?r.turma:"Turma",disc:r?r.disc:"0000 - Disciplina",cod:"Novo módulo",ano:r?r.ano:a[0],anoDir:r?(r.ref.anoDir||""):a[1],profId:"",docs:cfg.docTypes.map(d=>d.id)};
  m.pasta=pastaDe(m);cfg.mods.unshift(m);save();$("#modFilter").value="";renderAll()};

/* ---------- Catálogo Nacional de Qualificações (catalogo.snq.gov.pt) — só leitura ---------- */
const SNQ="https://bocatalogo.snq.gov.pt/webapi/api",SNQ_REP="https://bocatalogo.snq.gov.pt/reports//TecnologicaHtml";
const cursoDe=t=>String(t||"").replace(/\(\s*\d{2,4}\s*[-\/]\s*\d{2,4}\s*\)/,"").trim().replace(/^[a-z]?\d{1,4}[a-z]?\s*[-–:]?\s+/i,"").trim();
const inicioDe=t=>{const m=String(t||"").match(/\(\s*(\d{2,4})\s*[-\/]/);if(!m)return null;let y=+m[1];return y<100?y+2000:y};
const semTecnico=n=>norm(n).replace(/^tecnico\/?a?\s*(especialista\s*)?(de|em|do|da)?\s*/,"").replace(/[^a-z0-9 ]/g," ").replace(/\s+/g," ").trim();
let _snqIx=null,_snqRev=-1;
function snqDesig(m){if(_snqRev!==cfgRev||!_snqIx){_snqIx=new Map();_snqRev=cfgRev;
    for(const k in cfg.snq||{})for(const it of cfg.snq[k].itens||[])_snqIx.set(k+"|"+modKey(it.cod),it.nome)}
  return _snqIx.get(norm(m.turma)+"|"+modKey(m.cod))||""}
async function snqProcura(nome){const out=[],vistos=new Set();
  for(const ex of[false,true]){const r=await fetch(SNQ+"/qualificacoes/searchSite",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({currentPage:1,itemsPerPage:50,codigo:"",designacao:nome,areasFormacaoId:[],conselhosSetoriaisId:[],nivelQEQ:[],rvcc:false,adaptada:false,baseadoEmRA:false,regulamentada:false,outrosReferencias:false,excluida:ex,excluidasId:ex?1:0})});
    if(!r.ok)throw new Error("o catálogo respondeu "+r.status);const j=await r.json();
    for(const it of j.items||[])for(const d of it.details||[])if(!vistos.has(d.qualificacoesVersoesId)){vistos.add(d.qualificacoesVersoesId);out.push({cod:it.codigo,nivel:it.nivel,id:d.qualificacoesVersoesId,nome:d.designacao,conceito:d.conceito})}}
  return out}
function snqScore(curso,c){const a=semTecnico(curso),b=semTecnico(c.nome);if(a===b)return 100+(c.nivel==="4"?5:0);
  const A=new Set(a.split(" ").filter(w=>w.length>2)),B=new Set(b.split(" ").filter(w=>w.length>2));let k=0;for(const w of A)if(B.has(w))k++;
  return Math.round(k/Math.max(1,new Set([...A,...B]).size)*80)+(c.nivel==="4"?5:0)}
// componente tecnológica: UFCD/UC obrigatórias e opcionais (por bolsa) + horas de opcionais exigidas
const snqTxt=x=>String(x||"").replace(/\s+/g," ").trim();
async function snqTec(id,tipo){
  const t=await fetch(`${SNQ_REP}?preview=true&id=${id}&faq=false&tipo=${encodeURIComponent(tipo||"PP")}&tipoReport=FORMACAO`).then(r=>{if(!r.ok)throw new Error("referencial: "+r.status);return r.text()});
  const d=new DOMParser().parseFromString(t,"text/html"),out=[],vistos=new Set();let opc=false,bolsa="";
  for(const tb of d.querySelectorAll("table")){
    const hs=[...tb.querySelectorAll(":scope > thead th[colspan]")].map(x=>snqTxt(x.textContent)).filter(Boolean);
    if(hs.some(h=>/opcion/i.test(h)))opc=true;
    const b=hs.filter(h=>!/opcionais$|^forma[cç][aã]o tecnol/i.test(h));if(opc&&b.length)bolsa=b[b.length-1];
    for(const tr of tb.querySelectorAll(":scope > tbody > tr")){const c=[...tr.cells].map(x=>snqTxt(x.textContent));if(c.length<3)continue;
      if(!/^(UC\d{3,6}|\d{4,5})$/i.test(c[0])||vistos.has(c[0]))continue;vistos.add(c[0]);
      const it={cod:c[0].toUpperCase(),nome:c[2],h:/^\d+$/.test(c[3]||"")?+c[3]:null};if(opc){it.opc=true;if(bolsa&&!/^bolsa$/i.test(bolsa))it.bolsa=bolsa}out.push(it)}}
  const m=snqTxt(d.body&&d.body.textContent).match(/realizadas\s+(\d+)\s+horas\s+d[aeo]s?\s+(?:UFCD|UC)\s+opcionais/i);
  return{itens:out,opcH:m?+m[1]:null}}
async function snqReferencial(id,tipo){return(await snqTec(id,tipo)).itens}
// componentes sociocultural e científica (Cursos Profissionais), ou de base (Aprendizagem, EFA)
const SNQ_MOD={Profissional:"CP",Aprendizagem:"CA",EFA:"EFA"};
async function snqEscolar(id,mod){
  const t=await fetch(`https://bocatalogo.snq.gov.pt/reports//EscolarHtml?id=${id}&modalidade=${mod}&preview=true&diplomaId=3&dateVersionNivel2=null`).then(r=>{if(!r.ok)throw new Error("referencial escolar: "+r.status);return r.text()});
  const d=new DOMParser().parseFromString(t,"text/html"),comps=[];let C=null,G=null;
  for(const tr of d.querySelectorAll("tr")){if(tr.closest("table.footer"))continue;
    const sub=tr.querySelector("th.report-subtitle");
    if(sub){if(!C){C={nome:"Formação",grupos:[]};comps.push(C)}G={nome:snqTxt(sub.textContent),discs:[]};C.grupos.push(G);continue}
    const th=tr.querySelector("th[colspan]");
    if(th&&tr.parentElement&&tr.parentElement.tagName==="THEAD"){const n=snqTxt(th.textContent);if(n){C={nome:n,grupos:[]};comps.push(C);G=null}continue}
    if(tr.classList.contains("header")||!C)continue;
    const c=[...tr.cells].map(x=>snqTxt(x.textContent));if(c.length<3||!c[0]||/\s/.test(c[0])||!c[1]||/^c[oó]digo$/i.test(c[0]))continue;
    if(!G){G={nome:"",discs:[]};C.grupos.push(G)}
    G.discs.push({cod:c[0],nome:c[1],h:/^\d+$/.test(c[2])?+c[2]:null})}
  comps.forEach(c=>c.grupos=c.grupos.filter(g=>g.discs.length));
  const L=comps.filter(c=>c.grupos.length),k=n=>/sociocultural|de base/i.test(n)?0:/cient/i.test(n)?1:2;
  return L.sort((a,b)=>k(a.nome)-k(b.nome))}
// escolhe a versão do referencial em vigor no início da turma (setembro do ano inicial)
async function snqVersao(cands,ano){const lim=(ano||new Date().getFullYear())+"-09-01",vs=[];
  for(const c of cands){const d=await fetch(`${SNQ}/qualificacoes/qualificacoesVersoes/${c.id}/false`).then(r=>r.json());
    for(const v of d.versoes||[{qualificacoesVersoesId:c.id,dataInicio:d.dataInicio,tipoAlteracao:""}])if(v.tipoAlteracao!=="EXC")vs.push({id:v.qualificacoesVersoesId,data:String(v.dataInicio||"").slice(0,10),conceito:d.conceito||c.conceito,qual:c})}
  vs.sort((a,b)=>b.data.localeCompare(a.data));return vs.find(v=>v.data&&v.data<=lim)||vs[vs.length-1]||null}
async function snqTurma(turma,forcar){const k=norm(turma),curso=cursoDe(turma),ano=inicioDe(turma);
  let cands=await snqProcura(curso);
  if(!cands.length){const w=curso.split(/\s+/).filter(x=>x.length>2);if(w.length>1)cands=await snqProcura(w.slice(0,2).join(" "))}
  cands.forEach(c=>c.sc=snqScore(curso,c));cands.sort((a,b)=>b.sc-a.sc);
  let esc=forcar?cands.filter(c=>c.cod===forcar):[];
  if(!esc.length&&cands.length){const top=cands[0],nb=semTecnico(top.nome);esc=cands.filter(c=>semTecnico(c.nome)===nb&&c.nivel===top.nivel);if(!esc.length)esc=[top]}
  const r={curso,ano,cands:cands.slice(0,12).map(({cod,nivel,id,nome,conceito})=>({cod,nivel,id,nome,conceito})),t:Date.now(),forcar:forcar||""};
  if(esc.length){const v=await snqVersao(esc,ano);if(v){r.qual={cod:v.qual.cod,nome:v.qual.nome,nivel:v.qual.nivel,id:v.id,data:v.data,conceito:v.conceito};const T=await snqTec(v.id,v.conceito);r.itens=T.itens;r.opcH=T.opcH}}
  (cfg.snq=cfg.snq||{})[k]=r;return r}
function turmasSNQ(){return [...new Set(ativos().map(m=>m.turma).filter(isTurma))].sort((a,b)=>COLL_PTN.compare(a,b))}
function renderSNQ(){const el=$("#snqList");if(!el)return;const T=turmasSNQ();
  if(!T.length){el.innerHTML=`<p class="hint">Ainda não há turmas no formato <code>A01 - Nome do curso (25/28)</code> nesta análise.</p>`;return}
  // 0.9.86: "com pasta na Box" conta as pastas que existem mesmo na análise (e não só os módulos já detetados em Atribuições)
  const PT=new Map();for(const rec of getIdx().recs){const c=rec.n[rec.n.length-1];if(!isModLike(c))continue;const tu=rec.n.find(x=>isTurma(x));if(!tu)continue;const k=(turmaCod(tu)||tu).toLowerCase()+"|"+turmaAnos(tu);let S=PT.get(k);if(!S)PT.set(k,S=new Set());S.add(modKey(c))}
  el.innerHTML=T.map(t=>{const r=(cfg.snq||{})[norm(t)],mods=ativos().filter(m=>m.turma===t);
    if(!r)return `<div class="snq"><div class="snqh"><b>${esc(t)}</b><span class="hint" style="margin:0">ainda não cruzado</span></div></div>`;
    const tem=new Set(mods.map(m=>modKey(m.cod)));{const nt=norm(t),S=PT.get((turmaCod(nt)||nt).toLowerCase()+"|"+turmaAnos(nt));if(S)S.forEach(k=>tem.add(k))}const todos=r.itens||[],cu=cursoDaTurma(t),escO=cu&&Array.isArray(cu.opcEsc)&&cu.opcEsc.length?new Set(cu.opcEsc):null;
    // as opcionais só contam como em falta se a escola as escolheu (Escola › Cursos); sem escolha, contam só as que já têm pasta
    const it=todos.filter(i=>!i.opc||(escO?escO.has(i.cod):tem.has(modKey(i.cod)))),na=it.filter(i=>tem.has(modKey(i.cod))),sem=it.filter(i=>!tem.has(modKey(i.cod))),nOpc=todos.filter(i=>i.opc).length;
    const fora=mods.filter(m=>/^(uc)?\d{4,}$/.test(modKey(m.cod))&&!todos.some(i=>modKey(i.cod)===modKey(m.cod)));
    return `<div class="snq" data-snq="${esc(t)}"><div class="snqh"><b>${esc(t)}</b>
      ${r.qual?`<a href="https://catalogo.snq.gov.pt/qualificacoesDetalhe/${r.qual.id}" target="_blank" rel="noopener">${esc(r.qual.nome)}</a><span class="tag" style="background:#eef1f5;color:#4a5260">${esc(r.qual.cod)} · nível ${esc(r.qual.nivel||"?")} · ${r.qual.conceito==="RA"?"UC":"UFCD"} · referencial de ${esc(r.qual.data)}</span>`:`<span class="tag bad">não encontrado no catálogo</span>`}
      <span class="grow"></span>${r.cands&&r.cands.length>1?`<select data-snqpick><option value="">outra qualificação…</option>${r.cands.map(c=>`<option value="${esc(c.cod)}">${esc(c.nome)} (${esc(c.cod)}, nível ${esc(c.nivel)})</option>`).join("")}</select>`:""}</div>
      ${r.qual?`<p class="hint" style="margin:6px 0 0"><b>${it.length}</b> ${r.qual.conceito==="RA"?"UC":"UFCD"} no referencial · <b>${na.length}</b> com pasta na Box · <b>${sem.length}</b> sem pasta${fora.length?` · <b>${fora.length}</b> pasta(s) na Box fora do referencial`:""}${nOpc?` · ${escO?`opcionais escolhidas pela escola: <b>${escO.size}</b>`:`opcionais ainda por escolher em Escola › Cursos (${nOpc} na bolsa)`}`:""}</p>
      ${sem.length?`<details><summary class="hint" style="cursor:pointer;margin:4px 0 0">Ver as ${sem.length} sem pasta na Box</summary><div class="snqi">${sem.map(i=>`<span><b>${esc(i.cod)}</b> ${esc(i.nome)}${i.h?` · ${i.h} h`:""}${i.opc?` <span class="tag" style="background:#eef1f5;color:#4a5260">opcional</span>`:""}</span>`).join("")}</div></details>`:""}
      ${fora.length?`<details><summary class="hint" style="cursor:pointer;margin:4px 0 0">Ver as ${fora.length} fora do referencial</summary><div class="snqi">${fora.map(m=>`<span>${esc(discShort(m.disc))} · <b>${esc(codCurto(m.cod))}</b></span>`).join("")}</div></details>`:""}`:""}</div>`}).join("")}
async function cruzarSNQ(soTurma,forcar){const T=soTurma?[soTurma]:turmasSNQ();if(!T.length){renderSNQ();return}
  const b=$("#snqGo");b.disabled=true;let n=0,f=[];ponto("Antes de cruzar com o catálogo");
  for(const t of T){$("#snqMsg").textContent=`A consultar o catálogo: ${++n} de ${T.length} — ${t}…`;
    try{await snqTurma(t,soTurma?forcar:((cfg.snq||{})[norm(t)]||{}).forcar)}catch(e){f.push(t+": "+e.message)}}
  save();renderSNQ();renderAll();b.disabled=false;
  $("#snqMsg").textContent=f.length?`Concluído com ${f.length} erro(s): ${f.join(" · ")}`:`Concluído: ${T.length} turma(s). As designações das UFCD/UC passam a vir do catálogo (as que escreveu à mão têm prioridade).`}
$("#snqGo").onclick=()=>cruzarSNQ();
$("#snqList").addEventListener("change",e=>{if(!e.target.matches("[data-snqpick]")||!e.target.value)return;cruzarSNQ(e.target.closest("[data-snq]").dataset.snq,e.target.value)});

/* ---------- designações ---------- */
$("#desImport").onclick=()=>{
  const lines=$("#desBulk").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
  ponto("Antes de guardar designações");let n=0,bad=0;
  for(const l of lines){const p=l.split(/\t|;/).map(x=>x.trim()).filter(Boolean);
    if(/designa/i.test(l)&&p.length<=3&&!/\d/.test(p[0]||""))continue;
    if(p.length>=3){cfg.desig[discCode(p[0])+"|"+modKey(p[1])]=p.slice(2).join(" ");n++}
    else if(p.length===2){cfg.desig["*|"+modKey(p[0])]=p[1];n++}else bad++}
  save();renderAll();$("#desMsg").textContent=`${n} designação(ões) guardada(s)${bad?`, ${bad} linha(s) ignorada(s)`:""}.`;if(n)$("#desBulk").value="";
};
function renderAll(){renderDocs();renderProfs();renderGrid();renderMods();renderSNQ();undoUI()}


/* ---------- CSV ---------- */
function parseCSV(text){
  text=text.replace(/^﻿/,"");
  const first=text.split(/\r?\n/)[0]||"";
  const cnt=ch=>first.split(ch).length-1;
  const sep=[["\t",cnt("\t")],[";",cnt(";")],[",",cnt(",")]].sort((a,b)=>b[1]-a[1])[0];
  const d=sep[1]>0?sep[0]:"\u0000";
  const rows=[];let row=[],f="",q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"'&&f==="")q=true;
    else if(c===d){row.push(f);f=""}
    else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(f);f="";if(row.some(x=>x!==""))rows.push(row);row=[]}
    else f+=c;}
  row.push(f);if(row.some(x=>x!==""))rows.push(row);
  return rows;
}
function guess(head,pats){const h=head.map(norm);for(const p of pats){const i=h.findIndex(x=>x===p);if(i>=0)return i}for(const p of pats){const i=h.findIndex(x=>x.includes(p));if(i>=0)return i}return -1}
function ingest(text,source){
  const rows=parseCSV(text);if(!rows.length){boxMsg("O ficheiro está vazio.","bad");return}
  const looksHeader=rows[0].some(c=>/path|caminho|name|nome|file|ficheiro|item|pasta|folder/i.test(c))&&rows[0].every(c=>!/[\/\\]/.test(c));
  if(!looksHeader&&rows[0].length===1)ingestRows(["Caminho"],rows,source);
  else if(!looksHeader)ingestRows(rows[0].map((_,i)=>"Coluna "+(i+1)),rows,source);
  else ingestRows(rows[0],rows.slice(1),source);
}
function ingestRows(head,rows,source){
  rawHead=head;rawRows=rows;
  const iPath=guess(rawHead,["path","full path","caminho","item path","folder path","parent path","pasta","caminho completo","caminho"]);
  const iName=guess(rawHead,["item name","file name","name","nome","ficheiro","nome do ficheiro"]);
  const iDate=guess(rawHead,["modified_at","modified at","modified","content modified","data de modificacao","modificado","updated","created"]);
  const iType=guess(rawHead,["item type","type","tipo"]);
  const opt=(sel,none)=>(none?`<option value="-1">— nenhuma —</option>`:"")+rawHead.map((h,i)=>`<option value="${i}" ${i===sel?"selected":""}>${esc(h)}</option>`).join("");
  $("#colPath").innerHTML=opt(iPath>=0?iPath:0,false);
  $("#colName").innerHTML=opt(iName!==iPath?iName:-1,true);
  $("#colDate").innerHTML=opt(iDate,true);
  $("#colType").innerHTML=opt(iType,true);
  $("#colPick").style.display="block";
  applyCols();
  boxMsg(`Lido ${source}: ${rawRows.length} linhas. Confirme as colunas se necessário.`,"ok");
}
function applyCols(){
  const ip=+$("#colPath").value,inn=+$("#colName").value,id=+$("#colDate").value,it=+$("#colType").value;
  files=[];folders=[];
  const hx=k=>rawHead.findIndex(h=>norm(h)===k),iId=hx("id"),iSz=hx("size"),iSh=hx("sha1"),iCm=hx("cmod");
  for(const r of rawRows){
    let p=(r[ip]||"").replace(/\\/g,"/").trim(); const nm=inn>=0?(r[inn]||"").trim():"";
    if(!p&&!nm)continue;
    if(nm){const last=p.split("/").filter(Boolean).pop()||"";if(last!==nm)p=p.replace(/\/+$/,"")+"/"+nm}
    const segs=p.split("/").map(s=>s.trim()).filter(Boolean); if(!segs.length)continue;
    const name=segs[segs.length-1]; const rawDir=segs.slice(0,-1).join("/");
    const isFolder=it>=0?/folder|pasta/i.test(r[it]||""):!/\.[a-z0-9]{1,6}$/i.test(name);
    if(isFolder){folders.push(segs.join("/"));continue}
    files.push({path:segs.join("/"),rawDir,comps:segs.slice(0,-1).map(norm),name,nname:norm(name),date:id>=0?(r[id]||""):"",
      fid:iId>=0?String(r[iId]||""):"",size:iSz>=0&&r[iSz]!==""&&r[iSz]!=null?+r[iSz]:null,sha1:iSh>=0?String(r[iSh]||""):"",cmod:iCm>=0?String(r[iCm]||""):""});
  }
  lastListing=null;dadosMudaram();
}
// os ficheiros/pastas carregados mudaram: refaz o índice e atualiza o que está à vista
function dadosMudaram(){filesRev++;IDX=null;adotar();refreshAll();renderPreview()}
function renderPreview(){
  $("#previewCard").style.display=files.length?"block":"none";
  $("#previewInfo").textContent=`${files.length} ficheiro(s) prontos para comparação. Primeiros 15:`;
  $("#tbPrev").innerHTML=files.slice(0,15).map(f=>`<tr><td>${esc(f.path)}</td><td class="hm">${esc(f.date)}</td></tr>`).join("");
}
function boxMsg(t,k){$("#boxMsg").innerHTML=`<div class="msg ${k}">${esc(t)}</div>`}
$("#applyCols").onclick=()=>{applyCols();boxMsg(`${files.length} ficheiro(s) prontos. Veja o separador Relatório.`,"ok")};
$("#fileCsv").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>ingest(r.result,`“${f.name}”`);r.readAsText(f)};
$("#parsePaste").onclick=()=>{const t=$("#csvPaste").value;if(t.trim())ingest(t,"o texto colado")};

/* ---------- matching ---------- */
// uma pasta "corresponde" se o nome for igual ou começar pelo texto indicado seguido de espaço, hífen, parêntese, ponto…
const segs=s=>String(s||"").split("/").map(norm).filter(Boolean);
// 0.9.94: um código numérico ("008", "012", "012.1.1") só corresponde ao mesmo código — "012" já não apanha "012.1.1 - Enunciados…"
// (antes a Orientação Educativa contava os enunciados); uma palavra também corresponde depois do código da pasta:
// "enunciados" = "012.1.1 - Enunciados de Avaliação", "planificacoes" = "006 - Planificações"
const SEG_COD=/^\d{2,4}(?:\.\d+)*$/,SEG_PRE=/^(\d{2,4}(?:\.\d+)*)(?:\s*[-–:.)]\s*|\s+)/;
const segIni=(c,s)=>c===s||(c.startsWith(s)&&/[\s\-(_.]/.test(c[s.length]));
function segMatch(c,s){if(c===s)return true;
  if(SEG_COD.test(s)){const m=c.match(SEG_PRE);return m?m[1]===s:false}
  if(segIni(c,s))return true;
  const m=c.match(SEG_PRE);return !!m&&segIni(c.slice(m[0].length),s)}
function allIn(comps,ss){return ss.every(s=>comps.some(c=>segMatch(c,s)))}
// 0.9.86: comparação tolerante, para não dizer que falta uma pasta que só mudou de nome ou de escrita:
// "Módulo 1" = "Módulo 01 - Nome", "UFCD 0349" = "UFCD 349 (Ambiente)", "1600 - Matemática" = "1600 - Matemática e Ciências",
// "A23 - Curso (23/26)" = "A23 - Outro nome do curso (2023-2026)", "DTP 2026.2027" = "2026-2027"
const isModLike=c=>isModName(c)||(/^\d{4,6}(?![\d])/.test(c)&&!isDisc(c));
const turmaCod=c=>(String(c).match(/^([a-z]{1,2}\d{1,3})(?![a-z0-9])/i)||[])[1];
const turmaAnos=c=>{const m=String(c).match(/\(\s*(\d{2,4})\s*[-\/.]\s*(\d{2,4})\s*\)/);return m?m[1].slice(-2)+"-"+m[2].slice(-2):""};
function flexEq(c,s){if(segMatch(c,s))return true;
  if(isModLike(s)&&isModLike(c))return modKey(s)===modKey(c);
  if(isDisc(s)&&isDisc(c))return discCode(s)===discCode(c);
  const a=anoDe(s);if(a)return a===anoDe(c);
  if(isTurma(s)&&isTurma(c)){const k=turmaCod(s);return !!k&&k.toLowerCase()===String(turmaCod(c)||"").toLowerCase()&&turmaAnos(s)===turmaAnos(c)}
  return false}
