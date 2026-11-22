/* ---------- estatísticas e gráficos animados ---------- */
const SVGNS="http://www.w3.org/2000/svg";
const reduz=()=>matchMedia("(prefers-reduced-motion: reduce)").matches;
const pctTxt=(a,b)=>b?Math.round(a/b*100):0;
// anima larguras/arcos: começa em 0 e no fotograma seguinte vai para o valor final
function animar(root){const els=root.querySelectorAll("[data-w],[data-off]");
  requestAnimationFrame(()=>requestAnimationFrame(()=>els.forEach(el=>{if(el.dataset.w!=null)el.style.width=el.dataset.w;if(el.dataset.off!=null)el.style.strokeDashoffset=el.dataset.off})))}
// dica ao passar o rato (todas as marcas com data-tip)
(()=>{const tip=$("#vtip");let on=null;
  const pos=e=>{const w=tip.offsetWidth,h=tip.offsetHeight;let x=e.clientX+14,y=e.clientY-h-12;if(x+w>innerWidth-8)x=e.clientX-w-14;if(y<8)y=e.clientY+16;tip.style.left=x+"px";tip.style.top=y+"px"};
  document.addEventListener("mousemove",e=>{const t=e.target.closest&&e.target.closest("#est [data-tip]");
    if(!t){if(on){tip.classList.remove("on");on=null}return}
    if(t!==on){on=t;tip.innerHTML=t.dataset.tip;tip.classList.add("on")}pos(e)});
  document.addEventListener("scroll",()=>{if(on){tip.classList.remove("on");on=null}},true)})();
// barras horizontais: [{nome, ok, tot}] → % entregue
function barras(el,rows,vazio,limite=12,lOk="entregues",lMiss="em falta"){
  if(!rows.length){el.innerHTML=`<p class="eempty">${vazio}</p>`;return}
  const mostrar=el.dataset.all==="1"?rows:rows.slice(0,limite);
  el.innerHTML=`<div class="hb">${mostrar.map(r=>{const p=pctTxt(r.ok,r.tot);
    const tip=`<b>${esc(r.nome)}</b><br>${r.ok} de ${r.tot} ${lOk} (${p}%)<br>${r.tot-r.ok} ${lMiss}`;
    return`<div class="row-h" data-tip="${esc(tip)}"><span class="n" title="${esc(r.nome)}">${esc(r.nome)}</span><span class="t"><i data-w="${p}%"></i></span><span class="v"><b>${p}%</b> · ${r.tot-r.ok}</span></div>`}).join("")}</div>`
    +(rows.length>limite?`<button class="b s hbmore">${el.dataset.all==="1"?"Mostrar menos":`Mostrar todos (${rows.length})`}</button>`:"");
  const mb=el.querySelector(".hbmore");if(mb)mb.onclick=()=>{el.dataset.all=el.dataset.all==="1"?"":"1";barras(el,rows,vazio,limite,lOk,lMiss)};
  animar(el)}
function agrupar(ev,chave){const m=new Map();
  for(const e of ev){const k=chave(e);if(k==null)continue;const o=m.get(k)||{nome:k,ok:0,tot:0};for(const i of e.items){o.tot++;if(i.ok)o.ok++}m.set(k,o)}
  return[...m.values()].filter(r=>r.tot)}
/* 0.9.194: no perfil Formador, as estatísticas são só as suas (publicadas pela Direção a partir da análise da Box) */
function renderEstMeu(BM){const sec=$("#est");if(!sec)return;let box=$("#estMeu");
  if(!box){box=document.createElement("div");box.id="estMeu";box.className="card";const head=sec.querySelector(".estHead");(head&&head.parentNode===sec?head:sec.firstElementChild).insertAdjacentElement("afterend",box)}
  [...sec.querySelectorAll(".cols,.tiles,.egrid,.blk")].forEach(x=>{if(!x.contains(box)&&!box.contains(x))x.hidden=true});box.hidden=false;
  const sub=$("#eSub");if(sub)sub.textContent=BM.vazio?"":"As suas estatísticas"+(BM.nome?" em "+BM.nome:"")+" — atualizadas quando a Direção analisa a Box"+(BM.t?" (análise de "+new Date(BM.t).toLocaleDateString("pt-PT")+")":"")+".";
  const SEL=boxSelHTML();
  if(BM.vazio||!(BM.m||[]).length){box.innerHTML=(SEL?`<div class="row" style="margin:0 0 10px">${SEL}</div>`:"")+`<p class="hint" style="margin:0">Ainda não há estatísticas suas: a Direção tem de analisar a Box e ter módulos atribuídos a si.</p>`;return}
  const it=BM.m.flatMap(m=>m.it.map(x=>({m,tipo:x[0],st:x[1],pasta:x[2],d:x[3]}))),ok=s=>s==="ok"||s==="warn"||s==="modelo",tot=it.length,ent=it.filter(x=>ok(x.st)).length,falta=tot-ent;
  const modsOk=BM.m.filter(m=>m.it.length&&m.it.every(x=>ok(x[1]))).length,pct=tot?Math.round(ent*100/tot):0,ult=it.map(x=>x.d).filter(Boolean).sort().pop()||"";
  const grp=(k)=>{const M=new Map();for(const x of it){const g=k(x)||"—";const o=M.get(g)||{t:0,e:0};o.t++;if(ok(x.st))o.e++;M.set(g,o)}return [...M].sort((a,b)=>(a[1].e/a[1].t)-(b[1].e/b[1].t)||COLL_PTN.compare(a[0],b[0]))};
  const barra=(L)=>L.map(([n,o])=>{const p=Math.round(o.e*100/o.t);return `<div class="em-bar"><span class="n">${esc(n)}</span><span class="b"><i style="width:${p}%;background:${p===100?"var(--ok)":p>=50?"#d99a18":"var(--bad)"}"></i></span><span class="v">${o.e}/${o.t}</span></div>`}).join("");
  const st=(l,v,c)=>`<div class="ay-st"><small>${esc(l)}</small><b${c?` style="color:${c}"`:""}>${v}</b></div>`;
  const faltam=it.filter(x=>!ok(x.st)).slice(0,200);
  box.innerHTML=(SEL?`<div class="row" style="margin:0 0 12px">${SEL}</div>`:"")+`<div class="ay-stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">${st("documentação entregue",pct+"%")}${st("documentos entregues (de "+tot+")",ent)}${st("documentos em falta",falta,falta?"var(--bad)":"")}${st("módulos completos (de "+BM.m.length+")",modsOk)}${st("última entrega",ult?new Date(ult+"T12:00").toLocaleDateString("pt-PT"):"—")}</div>
   <div class="em-cols"><div><h3>Por turma</h3>${barra(grp(x=>x.m.tu))}</div><div><h3>Por tipo de documento</h3>${barra(grp(x=>x.tipo))}</div></div>
   <h3 style="margin-top:16px">Por módulo / UFCD</h3>${barra(BM.m.map(m=>[[m.tu,m.mo].filter(Boolean).join(" · "),{t:m.it.length,e:m.it.filter(x=>ok(x[1])).length}]).sort((a,b)=>(a[1].e/a[1].t||0)-(b[1].e/b[1].t||0)))}
   ${faltam.length?estMeuFalta(faltam,falta):`<p class="msg ok" style="margin-top:14px">Tem tudo entregue.</p>`}`}
// 0.9.215: o que falta, agrupado por turma e módulo, com o documento em falta em cada linha
function estMeuFalta(L,n){const G=new Map();for(const x of L){const k=x.m.tu+"\u0001"+x.m.mo;if(!G.has(k))G.set(k,{m:x.m,it:[]});G.get(k).it.push(x)}
  const gs=[...G.values()].sort((a,b)=>COLL_PTN.compare(a.m.tu||"",b.m.tu||"")||COLL_PTN.compare(a.m.mo||"",b.m.mo||""));
  return `<div class="emf-h"><h3>Em falta</h3><span class="tag bad">${n} documento(s) em ${gs.length} módulo(s)</span><span class="grow"></span><button class="b s" data-emf-rel>Ver o relatório completo</button></div>
  <div class="emf">${gs.map(g=>`<div class="emf-g"><div class="emf-t"><span class="emf-dot" style="background:${esc(turCorNome(g.m.tu))}"></span><b>${esc(g.m.tu||"(sem turma)")}</b><span class="emf-mo">${esc(g.m.mo||"")}</span>${g.m.di?`<span class="hint">${esc(g.m.di)}</span>`:""}<span class="grow"></span><span class="tag bad">${g.it.length}</span></div>
    ${g.it.map(x=>{const [cl,tx]=(typeof RELM_EST!=="undefined"&&RELM_EST[x.st])||["bad","em falta"];return `<div class="emf-i"><span class="emf-doc">${esc(x.tipo||"Documento")}</span>${x.pasta&&norm(x.pasta)!==norm(g.m.mo||"")?`<span class="hint">${esc(x.pasta)}</span>`:""}<span class="tag ${cl}">${esc(tx)}</span></div>`}).join("")}</div>`).join("")}</div>`}
function turCorNome(cod){try{const t=(escData().turmas||[]).find(x=>x.cod===cod||norm(cod).startsWith(norm(x.cod)+" ")||norm(cod)===norm(x.cod));if(t)return turmaCor(t)}catch(e){}return "#9aa3b2"}
document.addEventListener("click",e=>{if(e.target.closest&&e.target.closest("[data-emf-rel]")){try{show("rel")}catch(x){}}});
function renderEst(){{let BM=null;try{BM=boxMeu()}catch(e){}if(BM){renderEstMeu(BM);return}const m=$("#estMeu");if(m){m.hidden=true;[...$("#est").querySelectorAll(".cols,.tiles,.egrid,.blk")].forEach(x=>x.hidden=false)}}
  const ev=evaluate(),T=byTeacher(ev),all=ev.flatMap(e=>e.items);
  const tot=all.length,ok=all.filter(i=>i.ok).length,pct=pctTxt(ok,tot);
  const n={ok:all.filter(i=>i.state==="ok").length,warn:all.filter(i=>i.state==="warn"||i.state==="modelo").length,blank:all.filter(i=>i.state==="blank").length,missing:all.filter(i=>i.state==="missing").length};
  const modsOk=ev.filter(e=>e.items.length&&e.items.every(i=>i.ok)).length,modsTot=ev.filter(e=>e.items.length).length;
  const profsMiss=T.filter(t=>t.miss>0&&t.p.id!=="_").length,profsTot=T.filter(t=>t.p.id!=="_").length;
  const j=lastListing;
  $("#eSub").textContent=j?`Análise em uso: ${nomePasta(j.pasta)} · ${j.quando}`:"Ainda não há nenhuma análise carregada (em Análise).";
  $("#eTiles").innerHTML=`
   <div class="tile"><div class="v">${pct}%</div><div class="l">documentação entregue</div></div>
   <div class="tile"><div class="v">${ok}</div><div class="l">documentos entregues (de ${tot})</div></div>
   <div class="tile"><div class="v" style="color:var(--bad)">${tot-ok}</div><div class="l">documentos em falta</div></div>
   <div class="tile"><div class="v">${modsOk}</div><div class="l">módulos completos (de ${modsTot})</div></div>
   <div class="tile"><div class="v">${profsMiss}</div><div class="l">formadores com falhas (de ${profsTot})</div></div>
   <div class="tile"><div class="v">${files.length}</div><div class="l">ficheiros na análise</div></div>`;countUp($("#eTiles"));
  // 0.9.86: sem anéis (regra de design): número grande à direita e barra, como nos Anos letivos
  $("#eRing").innerHTML=tot?`<div class="eprog"><div class="eprog-top"><div><div class="eprog-n">${ok}<small> de ${tot} documentos</small></div><div class="hint" style="margin:2px 0 0">entregues${lastEnvio()?` · ${all.filter(i=>i.since).length} desde o último envio`:""}</div></div><div class="ay-pct"><b>${pct}%</b>entregue</div></div>
    <div class="eprog-bar" data-tip="${esc(`<b>${pct}%</b> entregue<br>${ok} de ${tot} documentos`)}"><i style="width:${tot?ok/tot*100:0}%"></i></div>
    <div class="eprog-lg"><span>Entregues <b>${ok}</b></span><span>Em falta <b>${tot-ok}</b></span><span>Total exigido <b>${tot}</b></span></div></div>`
    :`<p class="eempty">Ainda não há pastas de módulos para avaliar. Detete os módulos em Atribuições.</p>`;
  animar($("#eRing"));
  // estado (barra segmentada + legenda)
  const S=[["ok","Entregue","var(--ok)"],["warn","Entregue — a confirmar","#d99a00"],["blank","Entregue, mas não conta","#e36a2e"],["missing","Em falta","var(--bad)"]];
  $("#eState").innerHTML=tot?`<div class="sbar">${S.filter(([k])=>n[k]).map(([k,l,c])=>`<i style="background:${c}" data-w="${n[k]/tot*100}%" data-tip="${esc(`<b>${l}</b><br>${n[k]} documento(s) · ${pctTxt(n[k],tot)}%`)}"></i>`).join("")}</div>
    <div class="slg">${S.map(([k,l,c])=>`<div><span class="sw" style="background:${c}"></span>${l}<b>${n[k]} · ${pctTxt(n[k],tot)}%</b></div>`).join("")}</div>`
    :`<p class="eempty">Sem dados.</p>`;
  animar($("#eState"));
  // por formador (os que têm mais em falta primeiro)
  barras($("#eProf"),T.map(t=>({nome:t.p.nome,ok:t.ok,tot:t.tot})).filter(r=>r.tot).sort((a,b)=>(b.tot-b.ok)-(a.tot-a.ok)||a.ok/a.tot-b.ok/b.tot),"Ainda sem formadores com módulos atribuídos.");
  barras($("#eTurma"),agrupar(ev,e=>e.mod.turma||"(sem turma)").sort((a,b)=>a.ok/a.tot-b.ok/b.tot||COLL_PT.compare(a.nome,b.nome)),"Sem turmas.");
  barras($("#eDoc"),(()=>{const m=new Map();for(const e of ev)for(const i of e.items){const k=i.doc&&i.doc.nome||i.falta;const o=m.get(k)||{nome:k,ok:0,tot:0};o.tot++;if(i.ok)o.ok++;m.set(k,o)}return[...m.values()].sort((a,b)=>a.ok/a.tot-b.ok/b.tot)})(),"Sem documentos exigidos.");
  // análises guardadas: n.º de ficheiros
  const r=resumos(),ids=Object.keys(r).sort((a,b)=>COLL_PT.compare(String(r[a].pasta),String(r[b].pasta)));
  const mx=Math.max(1,...ids.map(id=>r[id].n||0));
  $("#eAna").innerHTML=ids.length?`<div class="hb">${ids.map(id=>{const a=r[id],on=j&&j.rootId===id;
    return`<div class="row-h" data-tip="${esc(`<b>${esc(a.pasta)}</b><br>Análise de ${esc(a.quando||"")}<br>${a.n??0} ficheiros · ${a.np??0} pastas`)}"><span class="n">${on?"● ":""}${esc(nomePasta(a.pasta))}</span><span class="t"><i class="${on?"":"lo"}" data-w="${(a.n||0)/mx*100}%"></i></span><span class="v"><b>${a.n??0}</b></span></div>`}).join("")}</div>`
    :`<p class="eempty">Ainda não há análises guardadas.</p>`;
  animar($("#eAna"));
  // rankings: mais cumpridores e turmas mais completas
  const rk=rows=>rows.filter(r=>r.tot).sort((a,b)=>b.ok/b.tot-a.ok/a.tot||b.tot-a.tot||COLL_PT.compare(a.nome,b.nome)).map((r,i)=>({...r,nome:`${i+1}.º ${r.nome}`}));
  barras($("#eTopP"),rk(T.filter(t=>t.p.id!=="_").map(t=>({nome:t.p.nome,ok:t.ok,tot:t.tot}))),"Ainda sem formadores com módulos atribuídos.",10);
  barras($("#eTopT"),rk(agrupar(ev,e=>e.mod.turma||"(sem turma)")),"Sem turmas.",10);
  // ---- indicadores extra ----
  // 1) por disciplina (pior primeiro)
  barras($("#eDisc"),agrupar(ev,e=>discShort(e.mod.disc)||"(sem disciplina)").sort((a,b)=>a.ok/a.tot-b.ok/b.tot||COLL_PT.compare(a.nome,b.nome)),"Sem disciplinas.");
  // 5) módulos fechados por turma
  (()=>{const m=new Map();for(const e of ev){if(!e.items.length)continue;const k=e.mod.turma||"(sem turma)",o=m.get(k)||{nome:k,ok:0,tot:0};o.tot++;if(e.items.every(i=>i.ok))o.ok++;m.set(k,o)}
    barras($("#eModT"),[...m.values()].sort((a,b)=>b.ok/b.tot-a.ok/a.tot||COLL_PT.compare(a.nome,b.nome)),"Sem módulos.",12,"módulos fechados","por fechar")})();
  // 4) qualidade por formador: entregues sem problemas vs vazios/falsos/a confirmar
  barras($("#eQual"),T.filter(t=>t.p.id!=="_").map(t=>{let ok=0,tot=0;for(const e of t.list)for(const i of e.items){if(i.state==="missing")continue;tot++;if(i.state==="ok")ok++}return{nome:t.p.nome,ok,tot}}).filter(r=>r.tot).sort((a,b)=>(b.tot-b.ok)-(a.tot-a.ok)||a.ok/a.tot-b.ok/b.tot),
    "Ainda não há documentos entregues.",12,"sem problemas","vazios, falsos ou a confirmar");
  // 3) entregas fora do prazo (data do ficheiro mais antigo de cada documento entregue vs. prazo definido em Enviar)
  (()=>{const el=$("#ePrazo"),pz=prazoData();
    if(!pz){el.innerHTML=`<p class="eempty">Defina o prazo em <b>Enviar</b> (ex.: 27/11/2026) para ver quem entregou depois dele.</p>`;return}
    $("#ePrazoSub").textContent=`Documentos entregues depois de ${dataPT(pz)} (prazo definido em Enviar), pela data do ficheiro na Box.`;
    barras(el,T.filter(t=>t.p.id!=="_").map(t=>{let ok=0,tot=0;for(const e of t.list)for(const i of e.items){if(!i.ok)continue;const ds=(i.hits||[]).map(f=>Date.parse(f.date)).filter(x=>x>0);if(!ds.length)continue;tot++;if(Math.min(...ds)<=pz+864e5-1)ok++}return{nome:t.p.nome,ok,tot}}).filter(r=>r.tot).sort((a,b)=>(b.tot-b.ok)-(a.tot-a.ok)),
      "Ainda não há documentos entregues com data.",12,"dentro do prazo","fora do prazo")})();
  // 2) efeito dos lembretes: do que faltava no envio escolhido, quanto já foi entregue
  (()=>{const el=$("#eLemb"),E=(cfg.envios||[]).filter(v=>v.miss&&Object.keys(v.miss).length);
    if(!E.length){el.innerHTML=`<p class="eempty">Ainda não registou nenhum envio de emails (em Enviar). Depois de registar, aqui vê quem respondeu ao lembrete.</p>`;return}
    let v=E.find(x=>x.id===eLembSel)||E[0];const ok=new Map();for(const e of ev)for(const i of e.items)ok.set(i.key,i.ok);
    const rows=Object.entries(v.miss).map(([pid,ks])=>({nome:profName(pid)||"(formador removido)",ok:ks.filter(k=>ok.get(k)).length,tot:ks.length})).sort((a,b)=>b.ok/b.tot-a.ok/a.tot);
    const totR=rows.reduce((a,r)=>a+r.ok,0),totM=rows.reduce((a,r)=>a+r.tot,0);
    el.innerHTML=`<div class="row" style="margin-bottom:10px"><select id="eLembPick" style="width:auto">${E.map(x=>`<option value="${x.id}" ${x===v?"selected":""}>${esc(x.label||"Envio")} — ${dataPT(x.t)} (${x.n} em falta)</option>`).join("")}</select>
      <span class="hint" style="margin:0">Desde esse envio: <b>${totR}</b> de ${totM} entregues (${pctTxt(totR,totM)}%)</span></div><div id="eLembB"></div>`;
    barras($("#eLembB"),rows,"",12,"entregues desde o envio","ainda em falta");
    $("#eLembPick").onchange=e=>{eLembSel=e.target.value;renderEst()}})();
  // 9) formadores parados: última entrega de cada um
  (()=>{const el=$("#ePar"),hoje0=Date.now();const rows=T.filter(t=>t.p.id!=="_"&&t.tot).map(t=>{let u=0;for(const e of t.list)for(const i of e.items)for(const f of i.hits||[]){const d=Date.parse(f.date);if(d>u)u=d}return{t,u,d:u?Math.floor((hoje0-u)/864e5):null}})
      .sort((a,b)=>(b.d??1e9)-(a.d??1e9));
    el.innerHTML=rows.length?`<div class="parl">${rows.map(r=>{const c=r.d==null||r.d>60?"bad":r.d>30?"warn":"ok";
      return`<div class="parr" data-tip="${esc(`<b>${esc(r.t.p.nome)}</b><br>${r.u?"Última entrega: "+dataPT(r.u):"Ainda sem nenhuma entrega"}<br>${r.t.miss} documento(s) em falta`)}"><span class="n">${esc(r.t.p.nome)}</span><span class="tag ${c==="ok"?"ok":c==="bad"?"bad":""}"${c==="warn"?` style="background:var(--warnbg);color:var(--warn)"`:""}>${r.d==null?"sem entregas":r.d===0?"hoje":`há ${r.d} dia${r.d===1?"":"s"}`}</span><span class="hint" style="margin:0">${r.u?dataPT(r.u):""}</span><span class="hint" style="margin:0">${r.t.miss} em falta</span></div>`}).join("")}</div>`
      :`<p class="eempty">Ainda sem formadores com módulos atribuídos.</p>`})();
  // 6) mapa de calor turma × tipo de documento
  (()=>{const el=$("#eHeat"),m=new Map(),dm=new Map();
    for(const e of ev)for(const i of e.items){if(i.doc)dm.set(i.doc.id,i.doc);const k=(e.mod.turma||"(sem turma)")+"\u0001"+(i.doc&&i.doc.id);const o=m.get(k)||{ok:0,tot:0};o.tot++;if(i.ok)o.ok++;m.set(k,o)}
    const docs=[...dm.values()].sort((a,b)=>COLL_PTN.compare(a.nome,b.nome));
    const turmas=[...new Set(ev.map(e=>e.mod.turma||"(sem turma)"))].sort((a,b)=>COLL_PTN.compare(a,b));
    if(!turmas.length||!docs.length){el.innerHTML=`<p class="eempty">Sem dados.</p>`;return}
    const cor=p=>p==null?"#f3f4f6":`hsl(${Math.round(p*1.2)},70%,${88-Math.round(p*0.1)}%)`;
    el.innerHTML=`<div style="overflow-x:auto"><table class="heat"><thead><tr><th></th>${docs.map(d=>`<th title="${esc(d.nome)}">${esc(d.nome)}</th>`).join("")}<th>Total</th></tr></thead><tbody>${turmas.map(t=>{let a=0,b=0;
      return`<tr><th title="${esc(t)}">${esc(t)}</th>${docs.map(d=>{const o=m.get(t+"\u0001"+d.id);if(!o)return`<td style="background:${cor(null)}">—</td>`;a+=o.ok;b+=o.tot;const p=pctTxt(o.ok,o.tot);
        return`<td style="background:${cor(p)}" data-tip="${esc(`<b>${esc(t)}</b><br>${esc(d.nome)}: ${o.ok} de ${o.tot} entregues (${p}%)`)}">${p}%</td>`}).join("")}<td class="tot" style="background:${cor(b?pctTxt(a,b):null)}">${b?pctTxt(a,b)+"%":"—"}</td></tr>`}).join("")}</tbody></table></div>`})();
  linhaTempo($("#eTime"));
}
let eLembSel="";
// prazo definido em Enviar (dd/mm/aaaa ou aaaa-mm-dd) → data
function prazoData(){const v=String(cfg.mail.prazo||"").trim();let m=v.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})$/);
  if(m){const y=+m[3]<100?2000+ +m[3]:+m[3];return new Date(y,+m[2]-1,+m[1]).getTime()}m=v.match(/^(\d{4})-(\d\d)-(\d\d)$/);return m?new Date(+m[1],+m[2]-1,+m[3]).getTime():null}
// linha do tempo por ano letivo: de setembro a agosto (e meses seguintes, para entregas tardias), uma linha por ano letivo analisado
const TLC=new Map(),TL_COR=["#1a5fd0","#db2777","#d97706","#9333ea","#0891b2","#e11d48","#64748b"];
let TLsel=(()=>{try{return localStorage.getItem("boxcheck_tl")||""}catch(e){return""}})();
const anoDeDatas=ds=>{const s=ds.slice().sort((a,b)=>a-b),m=new Date(s[Math.floor(s.length/2)]),y=m.getMonth()>=8?m.getFullYear():m.getFullYear()-1;return y+"/"+(y+1)};
async function seriesTempo(){const out=[],R=resumos(),vistos=new Set();
  const add=(pasta,ds,cur)=>{if(ds.length<2)return;const ano=anoDe(pasta)||anoDeDatas(ds);if(vistos.has(ano))return;vistos.add(ano);out.push({pasta,ano,ds,cur})};
  if(lastListing)add(lastListing.pasta,files.map(f=>Date.parse(f.date)).filter(t=>t>0),true);
  for(const id in R){if(lastListing&&id===lastListing.rootId)continue;const k=id+"|"+(R[id].t||"");let ds=TLC.get(k);
    if(!ds){try{const j=await lerListagem(id);if(!j)continue;ds=toFF(j).fs.map(f=>Date.parse(f.date)).filter(t=>t>0);TLC.set(k,ds)}catch(e){continue}}
    add(R[id].pasta,ds,false)}
  out.sort((a,b)=>a.ano.localeCompare(b.ano));return out}
const MESES=["set","out","nov","dez","jan","fev","mar","abr","mai","jun","jul","ago"];
async function linhaTempo(el){
  const S=await seriesTempo();
  if(!S.length){el.innerHTML=`<p class="eempty">Sem datas suficientes na análise em uso.</p>`;return}
  const anos=S.map(x=>x.ano);if(TLsel&&!anos.includes(TLsel))TLsel="";
  const vis=TLsel?S.filter(x=>x.ano===TLsel):S;
  // índice do mês contado a partir de setembro do ano inicial (antes disso conta como setembro)
  const ser=vis.map((x,i)=>{const y0=+x.ano.slice(0,4),c=[];for(const t of x.ds){const d=new Date(t);let k=(d.getFullYear()-y0)*12+d.getMonth()-8;if(k<0)k=0;if(k>35)k=35;c[k]=(c[k]||0)+1}
    return{...x,c,last:c.length-1,cor:TL_COR[(x.cur?0:S.indexOf(x)+1)%TL_COR.length]}});
  const N=Math.max(12,...ser.map(x=>x.last+1));
  for(const x of ser){let a=0;x.v=Array.from({length:N},(_,k)=>{a+=x.c[k]||0;return k<=x.last?a:null});x.novos=Array.from({length:N},(_,k)=>x.c[k]||0)}
  const max=Math.max(1,...ser.map(x=>x.v[x.last]));
  const W=Math.max(320,el.clientWidth||700),H=250,ml=44,mr=12,mt=10,mb=26,iw=W-ml-mr,ih=H-mt-mb;
  const nice=(()=>{const st=Math.pow(10,Math.floor(Math.log10(max)));for(const m of[1,2,2.5,5,10])if(max/(st*m)<=5)return st*m;return st*10})(),top=Math.ceil(max/nice)*nice;
  const X=i=>ml+i/(N-1)*iw,Y=v=>mt+ih-v/top*ih;
  const lab=k=>MESES[k%12]+(k>=12?(k>=24?"⁺²":"⁺¹"):"");
  let g="";for(let v=0;v<=top;v+=nice)g+=`<line class="gl" x1="${ml}" x2="${W-mr}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="${ml-8}" y="${Y(v)+4}" text-anchor="end">${v.toLocaleString("pt-PT")}</text>`;
  const passo=N>18?3:N>12?2:1;for(let k=0;k<N;k+=passo)g+=`<text class="ax" x="${X(k)}" y="${H-6}" text-anchor="${k===0?"start":k>=N-1?"end":"middle"}">${lab(k)}</text>`;
  if(N>12)g+=`<line class="gl" x1="${X(11.5)}" x2="${X(11.5)}" y1="${mt}" y2="${mt+ih}" stroke-dasharray="3 4"/><text class="ax" x="${X(11.5)+4}" y="${mt+12}">depois de agosto</text>`;
  const path=x=>x.v.map((v,k)=>v==null?"":(k&&x.v[k-1]!=null?"L":"M")+X(k).toFixed(1)+","+Y(v).toFixed(1)).join("");
  const um=ser.length===1;
  el.innerHTML=`<div class="tlbar"><div class="tllg">${S.map(x=>{const s=ser.find(y=>y.ano===x.ano);return`<button class="tlk${TLsel===x.ano?" on":""}" data-tl="${esc(x.ano)}" title="${esc(x.pasta)}"><span class="sw" style="background:${s?s.cor:TL_COR[(x.cur?0:S.indexOf(x)+1)%TL_COR.length]}"></span>${esc(x.ano)}${x.cur?" (em uso)":""}</button>`}).join("")}${S.length>1?`<button class="tlk${TLsel?"":" on"}" data-tl="">Comparar todos</button>`:""}</div></div>
    <div class="tl"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ficheiros acumulados por ano letivo">${g}
    ${um?`<path class="ar" d="${path(ser[0])}L${X(ser[0].last)},${Y(0)}L${X(0)},${Y(0)}Z" style="opacity:0;transition:opacity .9s .6s"/>`:""}
    ${ser.map(x=>`<path class="ln" d="${path(x)}" style="stroke:${x.cor}"/>`).join("")}
    <line class="xh" y1="${mt}" y2="${mt+ih}" style="display:none"/>${ser.map(x=>`<circle class="dot" r="5" style="display:none;fill:${x.cor}"/>`).join("")}
    <rect x="${ml}" y="${mt}" width="${iw}" height="${ih}" fill="transparent" data-tip=""/></svg></div>`;
  el.querySelectorAll("[data-tl]").forEach(b=>b.onclick=()=>{TLsel=b.dataset.tl;try{localStorage.setItem("boxcheck_tl",TLsel)}catch(e){}linhaTempo(el)});
  const svg=el.querySelector("svg"),ar=svg.querySelector(".ar"),xh=svg.querySelector(".xh"),dots=[...svg.querySelectorAll(".dot")],hit=svg.querySelector("rect");
  svg.querySelectorAll(".ln").forEach(ln=>{const L=ln.getTotalLength();if(!reduz()){ln.style.strokeDasharray=L;ln.style.strokeDashoffset=L;requestAnimationFrame(()=>requestAnimationFrame(()=>{ln.style.transition="stroke-dashoffset 1.6s cubic-bezier(.4,0,.2,1)";ln.style.strokeDashoffset=0;if(ar)ar.style.opacity=""}))}else if(ar)ar.style.opacity=""});
  hit.addEventListener("mousemove",e=>{const b=svg.getBoundingClientRect(),x=(e.clientX-b.left)*W/b.width,k=Math.max(0,Math.min(N-1,Math.round((x-ml)/iw*(N-1))));
    xh.setAttribute("x1",X(k));xh.setAttribute("x2",X(k));xh.style.display="";
    ser.forEach((s,i)=>{const v=s.v[k];if(v==null){dots[i].style.display="none";return}dots[i].setAttribute("cx",X(k));dots[i].setAttribute("cy",Y(v));dots[i].style.display=""});
    hit.dataset.tip=ser.map(s=>{const v=s.v[k];if(v==null)return"";const y0=+s.ano.slice(0,4),d=new Date(y0,8+k,1);
      return`<b style="color:${s.cor}">${esc(s.ano)}</b> · ${d.toLocaleDateString("pt-PT",{month:"long",year:"numeric"})}<br>${s.novos[k]} novo(s) ou alterado(s) · total <b>${v}</b>`}).filter(Boolean).join("<br>");
    $("#vtip").innerHTML=hit.dataset.tip});
  hit.addEventListener("mouseleave",()=>{xh.style.display="none";dots.forEach(d=>d.style.display="none")});
}
$("#eReplay").onclick=()=>{NFV.clear();renderEst()};
let _estRz;addEventListener("resize",()=>{clearTimeout(_estRz);_estRz=setTimeout(()=>{if(curTab==="est")linhaTempo($("#eTime"))},200)});

/* ---------- disposição: quadros arrastáveis, em duas colunas quando há espaço ---------- */
const LAYKEY="boxcheck_layout";
let LAYOUT=(()=>{try{return JSON.parse(localStorage.getItem(LAYKEY)||"{}")||{}}catch(e){return{}}})();
const GRIP=`<svg viewBox="0 0 24 24" width="14" height="14"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg>`;
function blkKey(el,sec,used){let k=el.id||"";if(!k){const h=el.querySelector("h2,h3");k=sec.id+":"+(h?norm(h.textContent).slice(0,40):el.className.split(" ")[0]||"x")}
  let kk=k,i=2;while(used.has(kk))kk=k+"#"+i++;used.add(kk);return kk}
// cada quadro fica dentro de um invólucro com a pega (o conteúdo do quadro pode ser redesenhado à vontade)
function tornarBloco(el,key){const w=document.createElement("div");w.className="blk";w.dataset.blk=key;el.parentElement.insertBefore(w,el);w.appendChild(el);el=w;const h=document.createElement("button");h.type="button";h.className="dh";h.title="Arraste para mudar este quadro de sítio";h.setAttribute("aria-label","Mover quadro");h.innerHTML=GRIP;el.appendChild(h)}
function prepararDisposicao(){
  document.querySelectorAll("main>section").forEach(sec=>{if(sec.dataset.fixo)return;const used=new Set(),kids=[...sec.children];
    const cols=document.createElement("div");cols.className="cols";const A=document.createElement("div"),B=document.createElement("div");A.className="col";A.dataset.col="a";B.className="col";B.dataset.col="b";cols.append(A,B);
    for(const el of kids){(el.dataset.col==="b"?B:A).appendChild(el);
      if(el.classList.contains("egrid")){el.dataset.cont="g:"+blkKey(el,sec,used);[...el.children].forEach(c=>tornarBloco(c,blkKey(c,sec,used)))}
      else tornarBloco(el,blkKey(el,sec,used))}
    sec.appendChild(cols);
    const L=LAYOUT[sec.id];if(!L)return;
    for(const ck in L){const cont=ck==="a"?A:ck==="b"?B:sec.querySelector(`[data-cont="${CSS.escape(ck)}"]`);if(!cont)continue;
      for(const bk of L[ck]){const b=sec.querySelector(`[data-blk="${CSS.escape(bk)}"]`);if(b&&!b.contains(cont))cont.appendChild(b)}}})}
const contKey=c=>c.dataset.col||c.dataset.cont;
function guardarDisposicao(sec){const o={};sec.querySelectorAll(".col,[data-cont]").forEach(c=>{o[contKey(c)]=[...c.children].filter(x=>x.classList.contains("blk")).map(x=>x.dataset.blk)});
  LAYOUT[sec.id]=o;try{localStorage.setItem(LAYKEY,JSON.stringify(LAYOUT))}catch(e){}prefsAgendar()}
/* 0.9.187: arrastar os quadros com eventos do ponteiro (rato, trackpad e toque) em vez do arrastar-e-largar do HTML5, que no Safari
   ficava preso: o quadro ficava esbatido e não se deixava largar. Agarra-se pela pega (⠿), a barra azul mostra onde vai ficar,
   a página desliza sozinha perto das margens; Esc cancela. */
let DRG=null,MARK=null,DRG_PID=null,DRG_ROLA=0,DRG_XY=null;
function drgAlvo(x,y){if(!DRG)return;const sec=DRG.closest("section");DRG.style.pointerEvents="none";const el=document.elementFromPoint(x,y);DRG.style.pointerEvents="";
  if(!el)return;let c=el.closest(".col,[data-cont]");if(!c||c.closest("section")!==sec||DRG.contains(c))return;
  const grid=!!c.dataset.cont,bs=[...c.children].filter(z=>z.classList.contains("blk")&&z!==DRG);
  let antes=null;for(const z of bs){const r=z.getBoundingClientRect();if(grid?(y<r.bottom&&x<r.left+r.width/2)||y<r.top:y<r.top+r.height/2){antes=z;break}}
  if(MARK.parentElement!==c||MARK.nextElementSibling!==antes)c.insertBefore(MARK,antes)}
function drgRolar(){if(!DRG||!DRG_XY)return;const y=DRG_XY[1],m=70,h=innerHeight;let d=0;if(y<m+60)d=-Math.ceil((m+60-y)/6);else if(y>h-m)d=Math.ceil((y-(h-m))/6);
  if(d){scrollBy(0,d);drgAlvo(DRG_XY[0],DRG_XY[1])}DRG_ROLA=requestAnimationFrame(drgRolar)}
function drgFim(ok){if(!DRG)return;cancelAnimationFrame(DRG_ROLA);const b=DRG;b.classList.remove("dragging");
  if(ok&&MARK&&MARK.parentElement){MARK.parentElement.insertBefore(b,MARK);guardarDisposicao(b.closest("section"));if(curTab==="est")try{linhaTempo($("#eTime"))}catch(e){}}
  if(MARK)MARK.remove();MARK=null;DRG=null;DRG_PID=null;DRG_XY=null;document.body.classList.remove("arrastar")}
document.querySelector("main").addEventListener("pointerdown",e=>{const h=e.target.closest(".dh");if(!h||e.button>0)return;const b=h.parentElement;if(!b||!b.classList.contains("blk"))return;
  e.preventDefault();DRG=b;DRG_PID=e.pointerId;DRG_XY=[e.clientX,e.clientY];try{h.setPointerCapture(e.pointerId)}catch(x){}
  MARK=document.createElement("div");MARK.className="dropmark";document.body.classList.add("arrastar");b.classList.add("dragging");b.parentElement.insertBefore(MARK,b.nextElementSibling);
  DRG_ROLA=requestAnimationFrame(drgRolar)});
addEventListener("pointermove",e=>{if(!DRG||e.pointerId!==DRG_PID)return;e.preventDefault();DRG_XY=[e.clientX,e.clientY];drgAlvo(e.clientX,e.clientY)},{passive:false});
addEventListener("pointerup",e=>{if(DRG&&e.pointerId===DRG_PID)drgFim(true)});
addEventListener("pointercancel",e=>{if(DRG&&e.pointerId===DRG_PID)drgFim(false)});
addEventListener("keydown",e=>{if(DRG&&e.key==="Escape")drgFim(false)});
$("#layReset").onclick=()=>{LAYOUT={};try{localStorage.removeItem(LAYKEY)}catch(e){}prefsAgendar();prefsEnviar().finally(()=>setTimeout(()=>location.reload(),300))};
prepararDisposicao();


