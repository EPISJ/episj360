/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.187 — ecrã do módulo «econo», carregado quando é aberto */
"use strict";
// ===== src/js/econo/econo.js =====
/* Econo360 — ecrã do módulo (carregado só quando o Econo360 é aberto; os dados estão em econo/econo-dados.js) */
// ---------- stock e custo médio ponderado (refeito a partir dos movimentos) ----------
function ecoOrd(a,b){return(a.data||"").localeCompare(b.data||"")||(a.cr||0)-(b.cr||0)}
function ecoCalc(){if(ecoCalcC)return ecoCalcC;const S=new Map(),V=new Map(),porArt=new Map();
  for(const m of ECO.mov){let L=porArt.get(m.art);if(!L)porArt.set(m.art,L=[]);L.push(m)}
  for(const [aid,L] of porArt){L.sort(ecoOrd);let q=0,v=0,ult=0,uData="",sData="";
    for(const m of L){const mq=+m.q||0;
      if(m.tipo==="ent"){const pu=+m.pu||0;q+=mq;v+=mq*pu;if(mq>0&&pu)ult=pu;V.set(m.id,mq*pu);if(mq>0)uData=m.data}
      else{const s=m.tipo==="ace"?1:-1,d=s*mq,cmp=q>0?v/q:(ult||(ecoArt(aid)||{}).pu0||0);
        if(d<0){const c=cmp*-d;q+=d;v-=c;V.set(m.id,c);if(m.tipo==="sai")sData=m.data}else{const c=cmp*d;q+=d;v+=c;V.set(m.id,-c)}}
      if(Math.abs(q)<1e-9){q=0;v=0}if(q<0)v=0}
    S.set(aid,{q,v,cmp:q>0?v/q:(ult||0),ult,uData,sData,n:L.length})}
  return ecoCalcC={S,V}}
function ecoSt(aid){return ecoCalc().S.get(aid)||{q:0,v:0,cmp:(ecoArt(aid)||{}).pu0||0,ult:0,n:0}}
function ecoVal(m){const v=ecoCalc().V.get(m.id);return v===undefined?0:v}
function ecoArt(id){return ECO.art.find(a=>a.id===id)||null}
function ecoArtTxt(a){return a?(a.cod?a.cod+" — ":"")+a.nome:"(artigo apagado)"}
function ecoArtDe(v){const s=String(v||"").trim();if(!s)return null;const n=norm(s);
  return ECO.art.find(a=>ecoArtTxt(a)===s)||ECO.art.find(a=>a.cod&&norm(a.cod)===n)||ECO.art.find(a=>a.cb&&String(a.cb)===s)||ECO.art.find(a=>norm(a.nome)===n)||null}
function ecoEstado(a){const s=ecoSt(a.id);if(a.ativo===false)return{k:"mu",t:"desativado"};if(s.q<=0)return{k:"ba",t:"sem stock"};if(+a.min&&s.q<+a.min)return{k:"wa",t:"abaixo do mínimo"};return{k:"",t:""}}
function ecoChip(e){return e&&e.t?`<span class="pp-chip ${e.k}">${esc(e.t)}</span>`:""}
function ecoProxCod(){const p=ecoDef().pref||"EC";let n=0;for(const a of ECO.art){const m=String(a.cod||"").match(new RegExp("^"+p.replace(/[^\w]/g,"")+"(\\d+)$"));if(m)n=Math.max(n,+m[1])}return p+String(n+1).padStart(4,"0")}
function ecoNovoArt(b){b=b||{};const E=ecoDef();const a={id:uid()+uid(),cod:b.cod||ecoProxCod(),nome:b.nome||"Novo artigo",cat:b.cat||ECO_UI.cat||E.cats[0],un:b.un||"unidade",loc:b.loc||ECO_UI.loc||E.locs[0],
  min:b.min??"",max:b.max??"",forn:b.forn||"",ref:b.ref||"",cb:b.cb||"",pu0:b.pu0??"",ativo:true,obs:b.obs||"",cr:Date.now(),por:String(EU&&EU.email||"")};ECO.art.push(a);ecoGuardar(a);return a}
function ecoMov(o){const m=Object.assign({id:uid()+uid(),g:"",tipo:"sai",data:ecoHoje(),art:"",q:0,pu:0,doc:"",forn:"",turmaId:"",turma:"",fse:"",curso:"",ufcd:"",quem:"",req:"",enc:"",inv:"",obs:"",cr:Date.now(),por:String(EU&&EU.email||"")},o);ECO.mov.push(m);return m}
function ecoAnular(m){if(!m||m.anulado||m.anula)return null;const n=ecoMov(Object.assign({},m,{id:uid()+uid(),q:-(+m.q||0),anula:m.id,anulado:"",cr:Date.now(),data:ecoHoje(),obs:"Anula o movimento de "+calDM(m.data,{day:"numeric",month:"short",year:"numeric"}),por:String(EU&&EU.email||"")}));
  m.anulado=n.id;ecoGuardar(m);ecoGuardar(n);return n}
function ecoForn(id){return ECO.forn.find(f=>f.id===id)||null}
function ecoFornNome(id){const f=ecoForn(id);return f?f.nome:""}
// ---------- turmas, UFCD e formadores (da Escola360) ----------
function ecoTurmas(){let L=[];try{L=turmasDoAno()}catch(e){}return L}
function ecoTurmaInfo(id){try{const t=escData().turmas.find(x=>x.id===id);if(!t)return{turmaId:"",turma:"",fse:"",curso:""};const c=cursoById(t.cursoId);return{turmaId:t.id,turma:turmaNome(t),fse:t.fse?String(t.fse):"",curso:c?c.nome:""}}catch(e){return{turmaId:"",turma:"",fse:"",curso:""}}}
function ecoUfcds(tid,profId){try{const p=pcDe(tid);if(!p)return[];return ecoUniq(p.linhas.filter(l=>!profId||l.f===profId).map(l=>[l.disc,l.mod].filter(Boolean).join(" — ")))}catch(e){return[]}}
function ecoEuProf(){try{const e=norm(EU&&EU.email||"");return e?(cfg.profs||[]).find(p=>norm(p.email||"")===e)||null:null}catch(e){return null}}
function ecoTurmasDoProf(p){if(!p)return ecoTurmas();try{const ids=new Set(pcPlanos().filter(x=>x.anoId===anoAtivo().id&&x.linhas.some(l=>l.f===p.id)).map(x=>x.turmaId));const L=ecoTurmas().filter(t=>ids.has(t.id));return L.length?L:ecoTurmas()}catch(e){return ecoTurmas()}}
function ecoProfsNomes(){try{return(cfg.profs||[]).map(p=>p.nome).filter(Boolean).sort(COLL_PT.compare)}catch(e){return[]}}
function ecoPeriodoAno(){const a=anoAtivo();const i=a&&a.ini?+a.ini:new Date().getFullYear();return[i+"-09-01",(i+1)+"-08-31",a&&a.nome||""]}

// ---------- render ----------
function ecoRender(t){Promise.all([ecoCarregar(),ecfCarregar()]).then(()=>{try{ecoDef();if(typeof ecoMovel==="function")ecoMovel(t);
  if(ecoEcon()){if(Date.now()-(ecoRender._n||0)>20000){ecoRender._n=Date.now();ecoTrazerNuvem()}
    if(!ecoRender._iv)ecoRender._iv=setInterval(()=>{try{if(ecoEcon()&&document.visibilityState==="visible"&&!aEscrever())ecoTrazerNuvem()}catch(e){}},60000)}
  document.querySelectorAll("[data-ecodir]").forEach(x=>x.disabled=!ecoEd());
  if(t==="ecoInicio"){ecoInicioUI();if(ecoEd()&&ECO_REQ===null&&!ECO_REQERR&&!ecoRender._r){ecoRender._r=1;ecoReqCarregar().then(()=>{ecoRender._r=0;if(curTab==="ecoInicio")ecoInicioUI()})}}else if(t==="ecoFat")ecoFatUI();else if(t==="ecoMovs")ecoMovsUI();else if(t==="ecoReq")ecoReqUI();else if(t==="ecoCompras")ecoComprasUI();else if(t==="ecoInv")ecoInvUI();else if(t==="ecoCustos")ecoCustosUI();else if(t==="ecoDef")ecoDefUI()}
  catch(e){console.warn("Econo360",e)}})}
function ecoModal(html,onClick,larga){const box=document.createElement("div");box.className="fd-modal eco-modal";box.innerHTML=`<div class="card fd-mcard${larga?" eco-mlarga":""}">${html}</div>`;document.body.appendChild(box);
  box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-ecofechar]")){box.remove();return}if(onClick)onClick(e,box)});
  setTimeout(()=>{const i=box.querySelector("input:not([type=checkbox]):not([readonly]),select,textarea");if(i)i.focus()},40);return box}

// ----- Artigos (início) -----
function ecoFiltrados(){const U=ECO_UI,q=norm(U.q||"");return ECO.art.filter(a=>{
  if(U.cat&&a.cat!==U.cat)return false;if(U.loc&&a.loc!==U.loc)return false;
  if(U.est){const e=ecoEstado(a);if(U.est==="min"&&e.k!=="wa"&&e.k!=="ba")return false;if(U.est==="sem"&&e.k!=="ba")return false;if(U.est==="off"&&a.ativo!==false)return false;if(U.est==="on"&&a.ativo===false)return false}
  else if(a.ativo===false)return false;
  if(q){const h=norm([a.cod,a.nome,a.cat,a.loc,a.ref,a.cb,ecoFornNome(a.forn),a.obs].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}
  return true}).sort((a,b)=>COLL_PTN.compare(a.nome||"",b.nome||""))}
function ecoGastoPeriodo(de,ate){let v=0;for(const m of ECO.mov)if(m.tipo==="sai"&&m.data>=de&&m.data<=ate)v+=ecoVal(m);return v}
function ecoInicioUI(){const A=ECO.art.filter(a=>a.ativo!==false),E=ecoDef(),U=ECO_UI;let val=0,abx=0,sem=0;
  for(const a of A){const s=ecoSt(a.id),e=ecoEstado(a);val+=s.v;if(e.k==="wa")abx++;if(e.k==="ba")sem++}
  const hj=ecoHoje(),mes=hj.slice(0,8)+"01",gm=ecoGastoPeriodo(mes,hj),[ai,af,an]=ecoPeriodoAno(),ga=ecoGastoPeriodo(ai,af);
  const pend=ECO_REQ?ECO_REQ.filter(r=>r.estado==="pendente"||r.estado==="aprovada").length:null;
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  $("#ecoHero").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Economato</h1><div class="sub">Material de consumo da escola e dos cursos: o que há, onde está, quanto vale e para que turma e projeto foi.</div></div></div>
    <div class="ay-stats">${st("Artigos",A.length,`em ${ecoUniq(A.map(a=>a.cat)).length} categorias`)}${st("Valor em stock",ecoEur(val),"a custo médio, sem IVA")}${st("Para repor",abx+sem,sem?`${sem} sem stock`:"nenhum esgotado")}${st("Gasto este mês",ecoEur(gm),an?`${ecoEur(ga)} em ${esc(an)}`:"")}${pend!==null?st("Requisições por tratar",pend,pend?"dos formadores":"nenhuma"):""}</div></div>`;
  $("#ecoFiltros").innerHTML=`<label class="grow" style="min-width:220px">Procurar<input type="text" id="ecoQ" value="${esc(U.q)}" placeholder="código, nome, referência… ou leia o código de barras"></label><button class="b s eco-somob eco-scanb" data-ecoscan type="button">Ler código</button>
    <label>Categoria<select data-ecof="cat">${ecoOpts(ecoUniq(E.cats.concat(ECO.art.map(a=>a.cat))),U.cat,"Todas")}</select></label>
    <label>Local<select data-ecof="loc">${ecoOpts(ecoUniq(E.locs.concat(ECO.art.map(a=>a.loc))),U.loc,"Todos")}</select></label>
    <label>Estado<select data-ecof="est">${ecoOpts([{v:"min",t:"Para repor"},{v:"sem",t:"Sem stock"},{v:"on",t:"Ativos"},{v:"off",t:"Desativados"}],U.est,"Ativos")}</select></label>`;
  ecoListaUI();ecoFichaUI()}
function ecoListaUI(){const L=ecoFiltrados(),U=ECO_UI,ed=ecoEd(),N=Math.min(L.length,U.n);
  $("#ecoAcoes").innerHTML=`<span class="hint" style="margin:0">${L.length} artigo${L.length===1?"":"s"}</span><span class="grow"></span>
    ${ed?`<button class="b s" data-ecoabrir="ent">Entrada</button><button class="b s" data-ecoabrir="sai">Saída</button><button class="b s" data-ecoabrir="aba">Abate</button>`:""}
    <button class="b s eco-sopc" data-ecopdfexist title="Mapa de existências valorizado, em PDF">Mapa de existências</button><button class="b s eco-sopc" data-ecoxls>Excel</button>`;
  $("#ecoLista").innerHTML=L.length&&ecoMob()?`<div class="eco-cards">${L.slice(0,N).map(a=>{const s=ecoSt(a.id),e=ecoEstado(a);return `<button type="button" class="eco-card" data-ecoc="${a.id}"><span class="eco-cm"><b>${esc(a.nome)}</b><small>${esc([a.cod,a.cat,ecoDef().locs.length>1?a.loc:""].filter(Boolean).join(" · "))}</small></span><span class="eco-cq"><b>${ecoN(s.q)}</b><small>${esc(a.un||"")}</small>${ecoChip(e)}</span></button>`}).join("")}</div>${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecomais>Mostrar mais ${Math.min(150,L.length-N)} (de ${L.length-N})</button></div>`:""}`
    :L.length?`<div class="tw"><table class="rt fd-t eco-t"><thead><tr><th>Código</th><th>Artigo</th><th>Categoria</th><th class="eco-r">Stock</th><th class="eco-r">Mínimo</th><th class="eco-r">Custo médio</th><th class="eco-r">Valor</th><th></th></tr></thead><tbody>${L.slice(0,N).map(a=>{const s=ecoSt(a.id),e=ecoEstado(a);
      return `<tr data-eco="${a.id}" class="${U.sel===a.id?"on":""}"><td class="fd-cod">${esc(a.cod||"")}</td><td>${esc(a.nome)}${a.loc&&ecoDef().locs.length>1?`<br><span class="hint" style="margin:0">${esc(a.loc)}</span>`:""}</td><td class="fd-cur"><span>${esc(a.cat||"")}</span></td><td class="eco-r fd-nw"><b>${ecoN(s.q)}</b> ${esc(a.un||"")}</td><td class="eco-r">${a.min!==""&&a.min!=null?ecoN(a.min):"—"}</td><td class="eco-r fd-nw">${s.cmp?ecoEur(s.cmp):"—"}</td><td class="eco-r fd-nw">${ecoEur(s.v)}</td><td>${ecoChip(e)}</td></tr>`}).join("")}</tbody></table></div>
      ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecomais>Mostrar mais ${Math.min(150,L.length-N)} (de ${L.length-N})</button></div>`:""}`
    :ecoVz("caixa",ECO.art.length?"Nenhum artigo com estes filtros.":"Ainda não há artigos no economato."+(ed?` Carregue em «Novo artigo» ou traga a lista que já tem em Excel:<br><label class="b imp" style="margin-top:10px">Importar artigos (Excel)<input type="file" accept=".xlsx,.xls,.xlsm,.csv" data-ecoimp hidden></label><div id="ecoImpMsg"></div>`:""))}
function ecoSel(){return ECO.art.find(a=>a.id===ECO_UI.sel)||null}
function ecoFichaUI(){const a=ecoSel(),el=$("#ecoFicha");if(!el)return;
  if(!a){el.innerHTML=`<div class="card fd-fvz">${ecoVz("caixa","Escolha um artigo da lista para ver o stock, os movimentos e mudar os dados.")}</div>`;return}
  const E=ecoDef(),ed=ecoEd(),dis=ed?"":"disabled",s=ecoSt(a.id),e=ecoEstado(a),H=ECO.mov.filter(m=>m.art===a.id).sort((x,y)=>ecoOrd(y,x));
  const inp=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-ecok="${k}" value="${esc(a[k]??"")}"${o&&o.dl?` list="${o.dl}"`:""}${o&&o.ph?` placeholder="${esc(o.ph)}"`:""}${o&&o.type==="number"?' step="any" min="0"':""} ${dis}></label>`;
  const sel=(k,l,L)=>`<label>${l}<select data-ecok="${k}" ${dis}>${ecoOpts(ecoUniq(L.concat([a[k]])),a[k]||"","—")}</select></label>`;
  el.innerHTML=`<div class="card fd-ficha"><button type="button" class="b s eco-voltar" data-ecovoltar>‹ Artigos</button>
    <div class="fd-fh"><div><div class="fd-fcod">${esc(a.cod||"—")}</div><div class="hint" style="margin:2px 0 0">${esc(a.nome)}</div></div><span class="grow"></span>${ecoChip(e)}</div>
    <div class="eco-big"><div><small>Em stock</small><b>${ecoN(s.q)}</b><span>${esc(a.un||"")}</span></div><div><small>Custo médio</small><b>${s.cmp?ecoEur(s.cmp):"—"}</b><span>sem IVA</span></div><div><small>Valor</small><b>${ecoEur(s.v)}</b><span>${s.n} movimento${s.n===1?"":"s"}</span></div></div>
    ${ed?`<div class="fd-btns" style="margin-top:6px"><button class="b s" data-ecoabrir="ent" data-ecoart="${a.id}">Entrada</button><button class="b s" data-ecoabrir="sai" data-ecoart="${a.id}">Saída</button><button class="b s" data-ecoabrir="aba" data-ecoart="${a.id}">Abate</button></div>`:""}
    <div class="pp-form fd-form">
      ${inp("nome","Artigo",{w2:1})}${inp("cod","Código")}${inp("cb","Código de barras (EAN)")}
      ${sel("cat","Categoria",E.cats)}${sel("un","Unidade",E.uns)}
      ${sel("loc","Local",E.locs)}<label>Fornecedor habitual<select data-ecok="forn" ${dis}>${ecoOpts(ECO.forn.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(f=>({v:f.id,t:f.nome})),a.forn||"","—")}</select></label>
      ${inp("min","Stock mínimo",{type:"number"})}${inp("max","Stock máximo (para encomendar)",{type:"number"})}
      ${inp("ref","Referência do fornecedor")}${inp("pu0","Preço de referência (sem IVA)",{type:"number"})}
      <label class="w2">Observações<textarea data-ecok="obs" rows="2" ${dis}>${esc(a.obs||"")}</textarea></label>
    </div>
    <div class="fd-btns"><span class="grow"></span>${ed?`<button class="b s" data-ecoativo>${a.ativo===false?"Voltar a ativar":"Desativar"}</button>${s.n?"":`<button class="b s danger" data-ecoapagar>Apagar</button>`}`:""}</div>
    <p class="hint fd-meta">Criado ${a.cr?esc(new Date(a.cr).toLocaleDateString("pt-PT")):"—"}${a.por?" por "+esc(a.por):""} · alterado ${a.em?esc(new Date(a.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):"—"}${a.mod?" por "+esc(a.mod):""}${s.n?" · com movimentos não se apaga: pode desativá-lo":""}</p>
    ${H.length?`<h3 class="fd-h3">Últimos movimentos</h3><div class="fd-hist">${H.slice(0,10).map(m=>`<div>${ecoTipoChip(m)} <b>${ecoSinal(m)}${ecoN(Math.abs(m.q))}</b> · ${esc(calDM(m.data,{day:"numeric",month:"short",year:"numeric"}))} · ${esc(ecoDestino(m))}</div>`).join("")}</div>`:""}
  </div>`;ecoDatalists()}
function ecoTipoChip(m){const T=ECO_TIPOS[m.tipo]||{n:m.tipo,c:"mu"};return `<span class="pp-chip ${T.c}">${esc(m.anula?"Anulação":T.n)}</span>`}
function ecoDelta(m){const q=+m.q||0;return m.tipo==="ent"||m.tipo==="ace"?q:-q}
function ecoSinal(m){return ecoDelta(m)>=0?"+":"−"}
function ecoDestino(m){if(m.tipo==="ent")return[ecoFornNome(m.forn)||"",m.doc?"doc. "+m.doc:"",m.obs].filter(Boolean).join(" · ")||"entrada";
  if(m.tipo==="sai")return[m.turma,m.ufcd,m.quem,m.obs].filter(Boolean).join(" · ")||"saída";if(m.tipo==="aba")return m.obs||"abate";return m.obs||"acerto de inventário"}
function ecoDatalists(){const dl=(id,L)=>{let x=document.getElementById(id);if(!x){x=document.createElement("datalist");x.id=id;document.body.appendChild(x)}x.innerHTML=ecoUniq(L).map(v=>`<option value="${esc(v)}">`).join("")};
  dl("ecoArtDL",ECO.art.filter(a=>a.ativo!==false).map(ecoArtTxt));dl("ecoProfDL",ecoProfsNomes())}
function ecoMudar(a,k,v){if(["min","max","pu0"].includes(k)){const n=ecoNum(v);a[k]=isNaN(n)?"":n}else a[k]=v;ecoGuardar(a)}
(function(){const S=document.getElementById("ecoInicio");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ecoQ"){ECO_UI.q=e.target.value;ECO_UI.n=150;clearTimeout(S._h);S._h=setTimeout(()=>{const q=ECO_UI.q.trim(),a=q&&ECO.art.find(x=>(x.cb&&String(x.cb)===q)||(x.cod&&norm(x.cod)===norm(q)));if(a){ECO_UI.sel=a.id;ECO_UI.q="";ecoInicioUI();return}ecoListaUI()},180)}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-ecof]");if(f){ECO_UI[f.dataset.ecof]=f.value;ECO_UI.n=150;ecoInicioUI();return}
    const k=e.target.closest("[data-ecok]");if(k&&ecoEd()){const a=ecoSel();if(a){ecoMudar(a,k.dataset.ecok,k.value);ecoListaUI();if(["min","cat","un","forn"].includes(k.dataset.ecok))ecoFichaUI()}return}
    const x=e.target.closest("[data-ecoimp]");if(x&&x.files&&x.files[0]){ecoImportar(x.files[0]);x.value=""}});
  S.addEventListener("click",e=>{const tr=e.target.closest("tr[data-eco],[data-ecoc]");if(tr){ECO_UI.sel=tr.dataset.eco||tr.dataset.ecoc;ecoListaUI();ecoFichaUI();ecoFichaAbrir();return}
    const b=e.target.closest("button");if(!b)return;
    if(b.matches("[data-ecovoltar]")){document.body.classList.remove("ecofic");return}
    if(b.matches("[data-ecoscan]")){ecoScanArtigo();return}
    if(b.id==="ecoNovoB"){if(!ecoEd())return;const a=ecoNovoArt();ECO_UI.sel=a.id;ecoInicioUI();toast("Artigo criado — complete os dados");setTimeout(()=>{const i=document.querySelector('#ecoFicha [data-ecok="nome"]');if(i){i.focus();i.select()}},60);return}
    if(b.matches("[data-ecomais]")){ECO_UI.n+=150;ecoListaUI();return}
    if(b.dataset.ecoabrir){ecoMovNovo(b.dataset.ecoabrir,b.dataset.ecoart||"");return}
    if(b.matches("[data-ecoxls]")){ecoExcelArt(ecoFiltrados());return}
    if(b.matches("[data-ecopdfexist]")){ecoPdfExist(ecoFiltrados());return}
    const a=ecoSel();if(!a||!ecoEd())return;
    if(b.matches("[data-ecoativo]")){a.ativo=a.ativo===false;ecoGuardar(a);ecoInicioUI();toast(a.ativo?"Artigo ativo":"Artigo desativado (continua nos registos)");return}
    if(b.matches("[data-ecoapagar]")){if(ecoSt(a.id).n||!confirm(`Apagar o artigo «${a.nome}»? Ainda não tem movimentos.`))return;ECO.art=ECO.art.filter(x=>x!==a);ECO.del[a.id]=Date.now();ECO_UI.sel="";ecoGuardar();ecoInicioUI();toast("Artigo apagado")}})})();

// ----- novo movimento (entrada, saída, abate) com várias linhas -----
function ecoMovNovo(tipo,artId,pre){if(!ecoEd())return;ecoDatalists();const E=ecoDef(),T=ECO_TIPOS[tipo],P=pre||{};
  const L=(P.linhas||[artId?{art:artId,q:"",pu:""}:{art:"",q:"",pu:""}]).map(l=>Object.assign({k:uid()},l));
  const turmas=ecoTurmas();
  const cab=tipo==="ent"?`<label>Fornecedor<select data-em="forn">${ecoOpts(ECO.forn.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(f=>({v:f.id,t:f.nome})),P.forn||"","—")}</select></label>
      <label>Documento (fatura ou guia)<input type="text" data-em="doc" value="${esc(P.doc||"")}" placeholder="FT 2026/123"></label><label>IVA (%)<input type="number" step="any" min="0" data-em="iva" value="${esc(P.iva??E.iva)}"></label>`
    :tipo==="sai"?`<label class="w2">Turma<select data-em="turmaId"><option value="">Sem turma (serviços da escola)</option>${turmas.map(t=>`<option value="${t.id}"${P.turmaId===t.id?" selected":""}>${esc(turmaNome(t))}${t.fse?" · projeto "+esc(t.fse):""}</option>`).join("")}</select></label>
      <label>UFCD / módulo<input type="text" data-em="ufcd" list="ecoUfcdDL" value="${esc(P.ufcd||"")}" placeholder="opcional"></label><label>Para quem (formador ou serviço)<input type="text" data-em="quem" list="ecoProfDL" value="${esc(P.quem||"")}"></label>`
    :`<label class="w2">Motivo<input type="text" data-em="obs" value="${esc(P.obs||"")}" placeholder="partido, fora de validade, perdido…"></label>`;
  const box=ecoModal(`<h2>${tipo==="ent"?"Nova entrada (compra ou oferta)":tipo==="sai"?"Nova saída":"Abate (quebra, perda ou validade)"}</h2>
    <div class="pp-form fd-form"><label>Data<input type="date" data-em="data" value="${esc(P.data||ecoHoje())}"></label>${cab}${tipo!=="aba"?`<label class="w2">Observações<input type="text" data-em="obs" value="${esc(tipo==="aba"?"":P.obs||"")}"></label>`:""}</div>
    <h3 class="fd-h3">Artigos</h3><div id="ecoLins"></div><button class="b s" data-ecolin style="margin-top:6px">Mais uma linha</button>
    <div id="ecoMovMsg"></div>
    <div class="fd-btns"><span class="hint" id="ecoTot" style="margin:0"></span><span class="grow"></span><button class="b s" data-ecofechar>Cancelar</button><button class="b" data-ecoguardar>Registar ${esc(T.n.toLowerCase())}</button></div>
    <datalist id="ecoUfcdDL"></datalist>`,(e,bx)=>{const b=e.target.closest("button");if(!b)return;
      if(b.matches("[data-ecolin]")){ler();L.push({k:uid(),art:"",q:"",pu:""});desenhar();const i=[...bx.querySelectorAll("[data-ell=art]")].pop();if(i)i.focus();return}
      if(b.dataset.ecolx){ler();const i=L.findIndex(x=>x.k===b.dataset.ecolx);if(i>=0)L.splice(i,1);if(!L.length)L.push({k:uid(),art:"",q:"",pu:""});desenhar();return}
      if(b.matches("[data-ecoguardar]"))guardar()},true);
  const H=k=>box.querySelector(`[data-em="${k}"]`);
  function ler(){box.querySelectorAll("[data-elk]").forEach(r=>{const l=L.find(x=>x.k===r.dataset.elk);if(!l)return;const a=ecoArtDe(r.querySelector("[data-ell=art]").value);l.txt=r.querySelector("[data-ell=art]").value;l.art=a?a.id:"";l.q=r.querySelector("[data-ell=q]").value;const p=r.querySelector("[data-ell=pu]");if(p)l.pu=p.value})}
  function desenhar(){$("#ecoLins").innerHTML=`<div class="eco-lin eco-lh${tipo==="ent"?" ent":""}"><span>Artigo</span><span>Quantidade</span>${tipo==="ent"?"<span>Preço unit. (sem IVA)</span>":"<span>Em stock</span>"}<span></span></div>`+L.map(l=>{const a=ecoArt(l.art),s=a?ecoSt(a.id):null;
      return `<div class="eco-lin${tipo==="ent"?" ent":""}" data-elk="${l.k}"><input type="text" data-ell="art" list="ecoArtDL" value="${esc(a?ecoArtTxt(a):l.txt||"")}" placeholder="código, nome ou leitor"><input type="text" inputmode="decimal" data-ell="q" value="${esc(l.q)}" placeholder="${a?esc(a.un||""):""}">${tipo==="ent"?`<input type="text" inputmode="decimal" data-ell="pu" value="${esc(l.pu)}" placeholder="${a&&(a.pu0||ecoSt(a.id).ult)?esc(ecoN(a.pu0||ecoSt(a.id).ult)):"0,00"}">`:`<span class="eco-disp${s&&+l.q>s.q?" ko":""}">${a?ecoN(s.q)+" "+esc(a.un||""):"—"}</span>`}<button class="b s" data-ecolx="${l.k}" title="Tirar esta linha" aria-label="Tirar">×</button></div>`}).join("");tot()}
  function tot(){let n=0,v=0;for(const l of L){const q=ecoNum(l.q),a=ecoArt(l.art);if(!a||!(q>0))continue;n++;v+=q*(tipo==="ent"?(isNaN(ecoNum(l.pu))?0:ecoNum(l.pu)):ecoSt(a.id).cmp)}$("#ecoTot").textContent=n?`${n} artigo${n===1?"":"s"} · ${ecoEur(v)}${tipo==="ent"?" sem IVA":" a custo médio"}`:""}
  function ufcdDL(){const t=H("turmaId");$("#ecoUfcdDL").innerHTML=t?ecoUfcds(t.value).map(v=>`<option value="${esc(v)}">`).join(""):""}
  box.addEventListener("input",e=>{if(e.target.closest("[data-elk]")){ler();const r=e.target.closest("[data-elk]");if(e.target.dataset.ell==="art"){const l=L.find(x=>x.k===r.dataset.elk);if(l&&l.art){desenhar();const n=box.querySelector(`[data-elk="${l.k}"] [data-ell=q]`);if(n)n.focus()}}else tot()}});
  box.addEventListener("change",e=>{if(e.target.dataset.em==="turmaId")ufcdDL()});
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.ell){e.preventDefault();ler();const l=L[L.length-1];if(l.art&&l.q){L.push({k:uid(),art:"",q:"",pu:""});desenhar();const i=[...box.querySelectorAll("[data-ell=art]")].pop();if(i)i.focus()}}});
  function guardar(){ler();const msg=t=>escLinhaMsg("#ecoMovMsg",t,"bad"),ok=[],bad=[];
    for(const l of L){if(!l.art&&!String(l.txt||"").trim()&&!String(l.q).trim())continue;const q=ecoNum(l.q);if(!l.art){bad.push(`«${esc(l.txt||"")}» não é um artigo do economato`);continue}if(!(q>0)){bad.push(`falta a quantidade de ${esc(ecoArt(l.art).nome)}`);continue}ok.push({a:ecoArt(l.art),q,pu:ecoNum(l.pu)})}
    if(bad.length)return msg(bad.join("<br>"));if(!ok.length)return msg("Escolha pelo menos um artigo.");
    const data=H("data").value||ecoHoje();
    if(tipo!=="ent"){const falta=ok.filter(o=>o.q>ecoSt(o.a.id).q+1e-9);if(falta.length&&!confirm(`Não há stock suficiente de: ${falta.map(o=>o.a.nome+" (há "+ecoN(ecoSt(o.a.id).q)+")").join(", ")}.\n\nRegistar mesmo assim? O stock fica negativo até registar a entrada.`))return}
    const g=uid()+uid(),base={g,tipo,data,obs:(H("obs")||{}).value||""};
    if(tipo==="ent"){base.forn=H("forn").value;base.doc=H("doc").value.trim();base.iva=ecoNum(H("iva").value)}
    if(tipo==="sai"){Object.assign(base,ecoTurmaInfo(H("turmaId").value));base.ufcd=H("ufcd").value.trim();base.quem=H("quem").value.trim()}
    Object.assign(base,P.extra||{});
    const novos=ok.map(o=>{const pu=tipo==="ent"?(isNaN(o.pu)?(+o.a.pu0||ecoSt(o.a.id).ult||0):o.pu):0;if(tipo==="ent"&&!isNaN(o.pu)&&o.pu>0&&base.forn&&!o.a.forn){o.a.forn=base.forn;ecoGuardar(o.a)}return ecoMov(Object.assign({},base,{art:o.a.id,q:o.q,pu}))});
    novos.forEach(m=>ecoGuardar(m));box.remove();toast(`${T.n} registada: ${novos.length} artigo${novos.length===1?"":"s"}`);if(P.feito)P.feito(novos);if(curTab)ecoRender(curTab);
    if(tipo==="sai"&&!P.feito&&confirm("Imprimir a guia de saída (para assinar quem recebe)?"))ecoPdfGuia(g)}
  desenhar();ufcdDL();return box}

// ----- Movimentos -----
function ecoMovFiltr(){const U=ECO_UI,q=norm(U.mq||"");return ECO.mov.filter(m=>{if(U.mtipo){if(U.mtipo==="anul"){if(!m.anula&&!m.anulado)return false}else if(m.tipo!==U.mtipo)return false}
  if(U.mde&&m.data<U.mde)return false;if(U.mate&&m.data>U.mate)return false;
  if(q){const a=ecoArt(m.art),h=norm([a&&a.cod,a&&a.nome,m.doc,ecoFornNome(m.forn),m.turma,m.fse,m.ufcd,m.quem,m.obs,m.curso].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}return true}).sort((a,b)=>ecoOrd(b,a))}
function ecoMovsUI(){const U=ECO_UI,L=ecoMovFiltr(),N=Math.min(L.length,U.mn),ed=ecoEd();let vE=0,vS=0;for(const m of L){if(m.tipo==="ent")vE+=ecoVal(m);if(m.tipo==="sai")vS+=ecoVal(m)}
  $("#ecoMovsOut").innerHTML=`<div class="card"><div class="pp-head"><div><h2>Movimentos</h2><p class="hint">Cada entrada, saída, abate ou acerto fica registado para sempre. Para corrigir um erro, use «Anular»: entra um movimento ao contrário e os dois ficam à vista.</p></div>
      <div class="pp-acts">${ed?`<button class="b s" data-ecoabrir="ent">Entrada</button><button class="b s" data-ecoabrir="sai">Saída</button><button class="b s" data-ecoabrir="aba">Abate</button>`:""}<button class="b s eco-sopc" data-ecomxls>Excel</button></div></div>
    <div class="row fd-filtros"><label class="grow" style="min-width:200px">Procurar<input type="text" id="ecoMQ" value="${esc(U.mq)}" placeholder="artigo, documento, turma, projeto, formador…"></label>
      <label>Tipo<select data-ecomf="mtipo">${ecoOpts([{v:"ent",t:"Entradas"},{v:"sai",t:"Saídas"},{v:"aba",t:"Abates"},{v:"ace",t:"Acertos"},{v:"anul",t:"Anulados e anulações"}],U.mtipo,"Todos")}</select></label>
      <label>De<input type="date" data-ecomf="mde" value="${esc(U.mde)}"></label><label>Até<input type="date" data-ecomf="mate" value="${esc(U.mate)}"></label></div>
    <p class="hint">${L.length} movimento${L.length===1?"":"s"} · entradas ${ecoEur(vE)} · saídas ${ecoEur(vS)} (sem IVA)</p>
    ${L.length&&ecoMob()?`<div class="eco-cards">${L.slice(0,N).map(m=>{const a=ecoArt(m.art);return `<div class="eco-card eco-mc${m.anulado||m.anula?" eco-anul":""}"><span class="eco-cm"><b>${esc(a?a.nome:"(artigo apagado)")}</b><small>${esc(calDM(m.data,{day:"2-digit",month:"2-digit",year:"numeric"}))} · ${esc(ecoDestino(m))}</small>
        <span class="eco-cb">${m.tipo==="sai"&&m.g?`<button class="b s" data-ecoguia="${m.g}">Guia</button>`:""}${m.fat?`<button class="b s" data-ecofat="${m.fat}">Fatura</button>`:""}${ed&&!m.anulado&&!m.anula?`<button class="b s" data-ecoanul="${m.id}">Anular</button>`:m.anulado?`<span class="hint" style="margin:0">anulado</span>`:""}</span></span>
        <span class="eco-cq"><b>${ecoSinal(m)}${ecoN(Math.abs(m.q))}</b><small>${esc(a?a.un||"":"")} · ${ecoEur(Math.abs(ecoVal(m)))}</small>${ecoTipoChip(m)}</span></div>`}).join("")}</div>${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecommais>Mostrar mais ${Math.min(200,L.length-N)} (de ${L.length-N})</button></div>`:""}`
    :L.length?`<div class="tw"><table class="rt eco-t"><thead><tr><th>Data</th><th>Tipo</th><th>Artigo</th><th class="eco-r">Qtd.</th><th class="eco-r">Valor</th><th>Origem / destino</th><th></th></tr></thead><tbody>${L.slice(0,N).map(m=>{const a=ecoArt(m.art);
      return `<tr class="${m.anulado||m.anula?"eco-anul":""}"><td class="fd-nw">${esc(calDM(m.data,{day:"2-digit",month:"2-digit",year:"numeric"}))}</td><td>${ecoTipoChip(m)}</td><td>${esc(a?a.nome:"(artigo apagado)")}<br><span class="hint fd-cod" style="margin:0">${esc(a?a.cod||"":"")}</span></td><td class="eco-r fd-nw"><b>${ecoSinal(m)}${ecoN(Math.abs(m.q))}</b> ${esc(a?a.un||"":"")}</td><td class="eco-r fd-nw">${ecoEur(Math.abs(ecoVal(m)))}</td><td>${esc(ecoDestino(m))}${m.fse?`<br><span class="hint" style="margin:0">projeto ${esc(m.fse)}</span>`:""}${m.req?` <span class="pp-chip mu">requisição</span>`:""}</td>
        <td class="fd-nw">${m.tipo==="sai"&&m.g?`<button class="b s" data-ecoguia="${m.g}" title="Guia de saída em PDF">Guia</button> `:""}${m.fat?`<button class="b s" data-ecofat="${m.fat}" title="Abrir a fatura desta entrada">Fatura</button> `:""}${ed&&!m.anulado&&!m.anula?`<button class="b s" data-ecoanul="${m.id}">Anular</button>`:m.anulado?`<span class="hint" style="margin:0">anulado</span>`:""}</td></tr>`}).join("")}</tbody></table></div>
      ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecommais>Mostrar mais ${Math.min(200,L.length-N)} (de ${L.length-N})</button></div>`:""}`:ecoVz("lista",ECO.mov.length?"Nenhum movimento com estes filtros.":"Ainda não há movimentos. Registe a primeira entrada (ou importe os artigos com o stock que já tem).")}</div>`}
(function(){const S=document.getElementById("ecoMovs");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ecoMQ"){ECO_UI.mq=e.target.value;ECO_UI.mn=200;clearTimeout(S._h);S._h=setTimeout(()=>{ecoMovsUI();const i=$("#ecoMQ");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-ecomf]");if(f){ECO_UI[f.dataset.ecomf]=f.value;ECO_UI.mn=200;ecoMovsUI()}});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.ecoabrir){ecoMovNovo(b.dataset.ecoabrir);return}if(b.matches("[data-ecommais]")){ECO_UI.mn+=200;ecoMovsUI();return}
    if(b.matches("[data-ecomxls]")){ecoExcelMov(ecoMovFiltr());return}if(b.dataset.ecoguia){ecoPdfGuia(b.dataset.ecoguia);return}if(b.dataset.ecofat){const f=ecfFat(b.dataset.ecofat);if(f)ecfAbrir(f);else toast("A fatura ainda não chegou a este aparelho");return}
    if(b.dataset.ecoanul&&ecoEd()){const m=ECO.mov.find(x=>x.id===b.dataset.ecoanul),a=m&&ecoArt(m.art);if(!m||!confirm(`Anular este movimento?\n\n${(ECO_TIPOS[m.tipo]||{}).n}: ${ecoN(Math.abs(m.q))} ${a?a.un+" de "+a.nome:""} (${calDMA(m.data)})\n\nEntra um movimento ao contrário, com a data de hoje. Os dois ficam registados.`))return;ecoAnular(m);ecoMovsUI();toast("Movimento anulado")}})})();

// ----- Requisições (formadores: as suas; Direção: todas) — tabela eco_req no Supabase -----
function ecoReqPronto(){try{return sbAtivo()}catch(e){return false}}
async function ecoReqCarregar(){if(!ecoReqPronto()){ECO_REQ=null;ECO_REQERR="Para as requisições é preciso ter entrado com o Office 365.";return}
  try{const sb=await sbCliente();const {data,error}=await sb.from("eco_req").select("*").order("criado",{ascending:false}).limit(1000);
    if(error)throw error;ECO_REQ=data||[];ECO_REQERR=""}
  catch(e){ECO_REQ=null;const m=(e&&e.message)||String(e);ECO_REQERR=(e&&(e.code==="42P01"||e.code==="PGRST205"))||/does not exist|schema cache/i.test(m)?"As requisições dos formadores ainda não estão ligadas: falta preparar a base de dados (tabelas eco_req e eco_cat).":"Não foi possível ler as requisições: "+sbErroMsg(e)}}
async function ecoReqGravar(r,novo){const sb=await sbCliente();const row={id:r.id,email:r.email,nome:r.nome||"",dados:r.dados||{},estado:r.estado,resp:r.resp||{}};
  const {error}=novo?await sb.from("eco_req").insert(row):await sb.from("eco_req").update({nome:row.nome,dados:row.dados,estado:row.estado,resp:row.resp}).eq("id",r.id);if(error)throw new Error(sbErroMsg(error))}
async function ecoCatLer(){if(ECO_CAT)return ECO_CAT;if(ecoEd()){ECO_CAT=ECO.art.filter(a=>a.ativo!==false).map(ecoCatItem);return ECO_CAT}
  try{const sb=await sbCliente();const {data}=await sb.from("eco_cat").select("dados").eq("k","cat").maybeSingle();ECO_CAT=data&&Array.isArray(data.dados)?data.dados:[]}catch(e){ECO_CAT=[]}return ECO_CAT}
function ecoCatItem(a){const s=ecoSt(a.id);return{id:a.id,cod:a.cod||"",nome:a.nome,cat:a.cat||"",un:a.un||"",disp:s.q>0}}
function ecoCatAgendar(){clearTimeout(ecoCatH);ECO_CAT=null;ecoCatH=setTimeout(ecoCatPublicar,4000)}
async function ecoCatPublicar(forcar){try{if(!ecoEd()||!(nuvSB()||ecoEcon()))return false;const dados=ECO.art.filter(a=>a.ativo!==false).map(ecoCatItem).sort((a,b)=>COLL_PT.compare(a.nome,b.nome));
    const sig=JSON.stringify(dados);if(!forcar&&sig===ecoCatPublicar._s)return true;const sb=await sbCliente();
    const {error}=await sb.from("eco_cat").upsert({k:"cat",dados,t:Date.now(),por:String(EU&&EU.email||"")},{onConflict:"k"});if(error)throw error;ecoCatPublicar._s=sig;return true}catch(e){if(forcar)throw e;return false}}
var ECO_RE={pendente:{t:"pendente",k:"wa"},aprovada:{t:"aprovada",k:""},entregue:{t:"entregue",k:"mu"},recusada:{t:"recusada",k:"ba"},cancelada:{t:"cancelada",k:"mu"}};
function ecoReqUI(){const out=$("#ecoReqOut");if(!out)return;const dir=ecoEd();
  if(ECO_REQ===null&&!ECO_REQERR){out.innerHTML=`<div class="card"><p class="hint">A carregar as requisições…</p></div>`;ecoReqCarregar().then(()=>{if(curTab==="ecoReq")ecoReqUI()});return}
  const U=ECO_UI,R=ECO_REQ||[],cnt=k=>R.filter(r=>k==="pend"?(r.estado==="pendente"||r.estado==="aprovada"):k==="todas"?true:r.estado===k).length;
  const ver=dir?U.rver:"todas",L=R.filter(r=>ver==="pend"?(r.estado==="pendente"||r.estado==="aprovada"):ver==="todas"?true:r.estado===ver);
  out.innerHTML=`<div id="ecoReqHero"></div><div class="card"><div class="pp-head"><div><h2>${dir?"Requisições dos formadores":"As minhas requisições"}</h2><p class="hint">${dir?"O formador pede o material para uma turma e uma UFCD. A Direção aprova, o economato entrega e a saída fica imputada à turma e ao projeto.":"Peça o material de que precisa para as suas aulas. Recebe um email quando a requisição for tratada."}</p></div>
      <div class="pp-acts"><button class="b s" data-ecoratual>Atualizar</button>${ECO_REQERR?"":`<button class="b" data-econova>Nova requisição</button>`}</div></div>
    ${ECO_REQERR?`<div class="msg info">${esc(ECO_REQERR)}</div>`:""}
    ${dir&&!ECO_REQERR?`<div class="fd-tabs">${[["pend","Por tratar"],["entregue","Entregues"],["recusada","Recusadas"],["cancelada","Canceladas"],["todas","Todas"]].map(([k,t])=>`<button class="fd-tab${U.rver===k?" on":""}" data-ecorver="${k}">${t} <span>${cnt(k)}</span></button>`).join("")}</div>`:""}
    ${ECO_REQERR?"":L.length?`<div class="eco-reqs">${L.map(r=>ecoReqCard(r,dir)).join("")}</div>`:ecoVz("mao",dir?"Nenhuma requisição aqui.":"Ainda não fez nenhuma requisição.")}</div>`}
function ecoReqCard(r,dir){const d=r.dados||{},e=ECO_RE[r.estado]||{t:r.estado,k:"mu"},L=Array.isArray(d.linhas)?d.linhas:[],rs=r.resp||{},E=ecoDef();
  const podeEnt=dir&&(r.estado==="aprovada"||(r.estado==="pendente"&&!E.aprovar));
  return `<div class="eco-req" data-ecoreq="${esc(r.id)}"><div class="eco-rh"><div><b>${esc(r.nome||r.email)}</b>${d.turma?` · ${esc(d.turma)}`:""}<div class="hint" style="margin:2px 0 0">${[d.ufcd,d.fse?"projeto "+d.fse:"",d.para?"para "+calDM(d.para,{day:"numeric",month:"short",year:"numeric"}):"","pedida a "+new Date(r.criado).toLocaleDateString("pt-PT")].filter(Boolean).map(esc).join(" · ")}</div></div><span class="grow"></span><span class="pp-chip ${e.k}">${esc(e.t)}</span></div>
    <ul class="eco-rl">${L.map(l=>{const a=l.art&&ecoArt(l.art),s=dir&&a?ecoSt(a.id):null;return `<li><b>${ecoN(l.q)}</b> ${esc(l.un||(a&&a.un)||"")} · ${esc(a?a.nome:l.nome||"")}${s?` <span class="hint${s.q<+l.q?" eco-ko":""}" style="margin:0">(há ${ecoN(s.q)})</span>`:""}${!a&&dir?' <span class="pp-chip wa">fora do catálogo</span>':""}</li>`}).join("")}</ul>
    ${d.obs?`<p class="hint" style="margin:4px 0 0">${esc(d.obs)}</p>`:""}${rs.msg?`<p class="hint" style="margin:4px 0 0"><b>Resposta:</b> ${esc(rs.msg)}</p>`:""}
    <div class="fd-btns">${dir?`${r.estado==="pendente"&&E.aprovar?`<button class="b s" data-ecoraprov>Aprovar</button>`:""}${podeEnt?`<button class="b" data-ecorent>Entregar</button>`:""}${r.estado==="pendente"||r.estado==="aprovada"?`<button class="b s danger" data-ecorrec>Recusar</button>`:""}${r.estado==="entregue"&&rs.g?`<button class="b s" data-ecoguia="${esc(rs.g)}">Guia</button>`:""}`
      :r.estado==="pendente"?`<button class="b s" data-ecoredit>Corrigir</button><button class="b s danger" data-ecorcanc>Cancelar</button>`:""}</div></div>`}
async function ecoReqForm(r){await ecoCatLer();const dir=ecoEd(),eu=ecoEuProf(),d=r?r.dados||{}:{},cat=(ECO_CAT||[]).slice().sort((a,b)=>COLL_PT.compare(a.nome,b.nome));
  const turmas=dir?ecoTurmas():ecoTurmasDoProf(eu),L=(Array.isArray(d.linhas)&&d.linhas.length?d.linhas:[{}]).map(l=>Object.assign({k:uid()},l));
  const txt=c=>(c.cod?c.cod+" — ":"")+c.nome,de=v=>{const s=String(v||"").trim();return cat.find(c=>txt(c)===s)||cat.find(c=>norm(c.nome)===norm(s))||cat.find(c=>c.cod&&norm(c.cod)===norm(s))||null};
  const box=ecoModal(`<h2>${r?"Corrigir a requisição":"Nova requisição de material"}</h2>
    <div class="pp-form fd-form">${dir&&!r?`<label class="w2">Formador<input type="text" data-er="quem" list="ecoProfDL" placeholder="nome do formador (o email procura-se na Escola360)"></label>`:""}
      <label class="w2">Turma<select data-er="turmaId"><option value="">Sem turma</option>${turmas.map(t=>`<option value="${t.id}"${d.turmaId===t.id?" selected":""}>${esc(turmaNome(t))}</option>`).join("")}</select></label>
      <label>UFCD / módulo<input type="text" data-er="ufcd" list="ecoRUfcd" value="${esc(d.ufcd||"")}"></label><label>Para quando<input type="date" data-er="para" value="${esc(d.para||"")}"></label>
      <label class="w2">Observações<input type="text" data-er="obs" value="${esc(d.obs||"")}" placeholder="para que aula, cor, tamanho…"></label></div>
    <h3 class="fd-h3">Material</h3><p class="hint" style="margin-top:0">${cat.length?"Escreva para procurar no catálogo do economato. Se não estiver lá, escreva o que precisa.":"O catálogo ainda está vazio: escreva o que precisa."}</p>
    <div id="ecoRLins"></div><button class="b s" data-ecorlin style="margin-top:6px">Mais uma linha</button><div id="ecoRMsg"></div>
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-ecofechar>Cancelar</button><button class="b" data-ecorgo>${r?"Guardar":"Enviar requisição"}</button></div>
    <datalist id="ecoCatDL">${cat.map(c=>`<option value="${esc(txt(c))}">${c.disp?"":"esgotado"}</option>`).join("")}</datalist><datalist id="ecoRUfcd"></datalist>`,async(e,bx)=>{const b=e.target.closest("button");if(!b)return;
      if(b.matches("[data-ecorlin]")){ler();L.push({k:uid()});desenhar();return}
      if(b.dataset.ecorlx){ler();const i=L.findIndex(x=>x.k===b.dataset.ecorlx);if(i>=0)L.splice(i,1);if(!L.length)L.push({k:uid()});desenhar();return}
      if(b.matches("[data-ecorgo]")){ler();const ok=L.filter(l=>String(l.nome||"").trim()&&ecoNum(l.q)>0);if(!ok.length)return escLinhaMsg("#ecoRMsg","Indique pelo menos um material e a quantidade.","bad");
        const H=k=>bx.querySelector(`[data-er="${k}"]`),ti=ecoTurmaInfo(H("turmaId").value);
        let email=String(EU&&EU.email||"").toLowerCase(),nome=(eu&&eu.nome)||(EU&&EU.nome)||email;
        if(dir&&!r){const q=H("quem").value.trim();if(q){const p=(cfg.profs||[]).find(x=>norm(x.nome)===norm(q));if(!p||!p.email)return escLinhaMsg("#ecoRMsg","Não encontrei o email desse formador na Escola360 › Formadores.","bad");email=String(p.email).toLowerCase();nome=p.nome}}
        const dados={turmaId:ti.turmaId,turma:ti.turma,fse:ti.fse,curso:ti.curso,ufcd:H("ufcd").value.trim(),para:H("para").value,obs:H("obs").value.trim(),linhas:ok.map(l=>({art:l.art||"",cod:l.cod||"",nome:l.nome.trim(),q:ecoNum(l.q),un:l.un||""}))};
        b.disabled=true;try{if(r){r.dados=dados;await ecoReqGravar(r,false)}else await ecoReqGravar({id:uid()+uid()+uid(),email,nome,dados,estado:"pendente"},true);bx.remove();toast(r?"Requisição corrigida":"Requisição enviada");await ecoReqCarregar();ecoReqUI()}
        catch(x){b.disabled=false;escLinhaMsg("#ecoRMsg","Não foi possível guardar: "+esc(x.message||x),"bad")}}},true);
  function ler(){box.querySelectorAll("[data-erk]").forEach(rw=>{const l=L.find(x=>x.k===rw.dataset.erk);if(!l)return;const v=rw.querySelector("[data-erl=n]").value,c=de(v);l.q=rw.querySelector("[data-erl=q]").value;if(c){l.art=c.id;l.cod=c.cod;l.nome=c.nome;l.un=c.un}else{l.art="";l.cod="";l.nome=v;l.un=""}})}
  function desenhar(){$("#ecoRLins").innerHTML=L.map(l=>{const c=l.art&&cat.find(x=>x.id===l.art);return `<div class="eco-lin eco-rlin" data-erk="${l.k}"><input type="text" data-erl="n" list="ecoCatDL" value="${esc(c?txt(c):l.nome||"")}" placeholder="material"><input type="text" inputmode="decimal" data-erl="q" value="${esc(l.q??"")}" placeholder="${esc(c?c.un:"qtd.")}"><button class="b s" data-ecorlx="${l.k}" aria-label="Tirar">×</button></div>`}).join("")}
  function ufcd(){const t=box.querySelector('[data-er="turmaId"]').value;$("#ecoRUfcd").innerHTML=t?ecoUfcds(t,dir?null:eu&&eu.id).map(v=>`<option value="${esc(v)}">`).join(""):""}
  box.addEventListener("change",e=>{if(e.target.dataset.er==="turmaId")ufcd()});desenhar();ufcd();ecoDatalists()}
function ecoReqEntregar(r){const d=r.dados||{},E=ecoDef();
  const linhas=(d.linhas||[]).map(l=>{const a=(l.art&&ecoArt(l.art))||ecoArtDe(l.cod)||ecoArtDe(l.nome);return{art:a?a.id:"",txt:a?"":l.nome,q:String(l.q).replace(".",",")}});
  ecoMovNovo("sai","",{linhas,turmaId:d.turmaId,ufcd:d.ufcd,quem:r.nome||r.email,obs:d.obs?"Requisição: "+d.obs:"Requisição",extra:{req:r.id},
    feito:async novos=>{const g=novos[0]&&novos[0].g;r.estado="entregue";r.resp=Object.assign({},r.resp,{por:String(EU&&EU.email||""),t:Date.now(),g,mov:novos.map(m=>m.id)});
      try{await ecoReqGravar(r,false)}catch(x){toast("Saída registada, mas a requisição não ficou marcada: "+(x.message||x))}
      if(E.avisar)ecoReqAvisar(r,"entregue");ecoReqUI();if(confirm("Imprimir a guia de saída (para o formador assinar)?"))ecoPdfGuia(g)}})}
async function ecoReqAvisar(r,estado,msg){try{const d=r.dados||{},L=(d.linhas||[]).map(l=>`- ${ecoN(l.q)} ${l.un||""} ${l.nome}`).join("\n");
  const txt=estado==="entregue"?`O material da sua requisição${d.turma?" para a turma "+d.turma:""} está entregue e pode ser levantado no economato.`:estado==="aprovada"?`A sua requisição${d.turma?" para a turma "+d.turma:""} foi aprovada. Avisamos quando estiver pronta.`:`A sua requisição${d.turma?" para a turma "+d.turma:""} não foi aprovada.${msg?"\n\nMotivo: "+msg:""}`;
  await msEnviar({to:r.email,subject:"Econo360 — requisição "+(ECO_RE[estado]||{t:estado}).t,body:`Olá ${r.nome||""},\n\n${txt}\n\n${L}\n\nEPISJ 360 · Econo360`});toast("Formador avisado por email")}catch(e){toast("Não foi possível avisar por email: "+(e.message||e))}}
(function(){const S=document.getElementById("ecoReq");if(!S)return;
  S.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
    if(b.matches("[data-ecoratual]")){ECO_REQ=null;ECO_REQERR="";ecoReqUI();return}if(b.matches("[data-econova]")){ecoReqForm(null);return}
    if(b.dataset.ecorver){ECO_UI.rver=b.dataset.ecorver;ecoReqUI();return}if(b.dataset.ecoguia){ecoPdfGuia(b.dataset.ecoguia);return}
    const c=b.closest("[data-ecoreq]"),r=c&&(ECO_REQ||[]).find(x=>x.id===c.dataset.ecoreq);if(!r)return;
    if(b.matches("[data-ecoredit]")){ecoReqForm(r);return}
    if(b.matches("[data-ecorent]")){ecoReqEntregar(r);return}
    const muda=async(est,msg,aviso)=>{const ant=r.estado;r.estado=est;r.resp=Object.assign({},r.resp,{por:String(EU&&EU.email||""),t:Date.now()},msg?{msg}:{});b.disabled=true;
      try{await ecoReqGravar(r,false);toast("Requisição "+(ECO_RE[est]||{t:est}).t);if(aviso&&ecoDef().avisar)ecoReqAvisar(r,est,msg)}catch(x){r.estado=ant;toast("Não foi possível: "+(x.message||x))}ecoReqUI()};
    if(b.matches("[data-ecoraprov]")){muda("aprovada","",true);return}
    if(b.matches("[data-ecorrec]")){const m=prompt("Motivo da recusa (o formador recebe esta mensagem):","");if(m===null)return;muda("recusada",m.trim(),true);return}
    if(b.matches("[data-ecorcanc]")){if(confirm("Cancelar esta requisição?"))muda("cancelada","",false)}})})();

// ----- Compras: o que encomendar, encomendas e fornecedores -----
function ecoRepor(){return ECO.art.filter(a=>a.ativo!==false&&+a.min>0&&ecoSt(a.id).q<+a.min).map(a=>{const s=ecoSt(a.id).q,alvo=+a.max>+a.min?+a.max:+a.min*2;return{a,s,q:Math.max(0,Math.ceil(alvo-s))}}).sort((x,y)=>COLL_PT.compare(ecoFornNome(x.a.forn)||"~",ecoFornNome(y.a.forn)||"~")||COLL_PT.compare(x.a.nome,y.a.nome))}
var ECO_ENC={rascunho:{t:"rascunho",k:"mu"},enviada:{t:"enviada",k:"wa"},parcial:{t:"recebida em parte",k:"wa"},recebida:{t:"recebida",k:""},anulada:{t:"anulada",k:"ba"}};
function ecoEncN(){const y=new Date().getFullYear();const n=ECO.enc.filter(e=>String(e.n||"").startsWith("ENC "+y)).length+1;return `ENC ${y}/${String(n).padStart(3,"0")}`}
function ecoEncTot(e){return(e.linhas||[]).reduce((s,l)=>s+(+l.q||0)*(+l.pu||0),0)}
function ecoComprasUI(){const out=$("#ecoComprasOut"),ed=ecoEd(),R=ecoRepor(),EN=ECO.enc.slice().sort((a,b)=>(b.cr||0)-(a.cr||0));
  out.innerHTML=`<div class="card"><div class="pp-head"><div><h2>Para repor</h2><p class="hint">Artigos abaixo do stock mínimo. A quantidade sugerida leva o stock até ao máximo (ou ao dobro do mínimo, se não houver máximo).</p></div>
      <div class="pp-acts">${ed&&R.length?`<button class="b" data-ecoencfaz>Criar encomendas com os marcados</button>`:""}</div></div>
    ${R.length?`<div class="tw"><table class="rt eco-t"><thead><tr><th style="width:30px"><input type="checkbox" data-ecorall checked aria-label="Marcar todos"></th><th>Artigo</th><th>Fornecedor habitual</th><th class="eco-r">Stock</th><th class="eco-r">Mínimo</th><th class="eco-r">Encomendar</th></tr></thead><tbody>${R.map(x=>`<tr><td><input type="checkbox" data-ecorm="${x.a.id}" checked aria-label="Marcar"></td><td>${esc(x.a.nome)}<br><span class="hint fd-cod" style="margin:0">${esc(x.a.cod||"")}</span></td><td>${esc(ecoFornNome(x.a.forn)||"—")}</td><td class="eco-r">${ecoN(x.s)}</td><td class="eco-r">${ecoN(x.a.min)}</td><td class="eco-r"><input type="text" inputmode="decimal" class="eco-qi" data-ecorq="${x.a.id}" value="${x.q}"> ${esc(x.a.un||"")}</td></tr>`).join("")}</tbody></table></div>`
      :ecoVz("carrinho","Nada para repor. Os artigos com stock mínimo definido estão todos acima dele.")}</div>
  <div class="card"><div class="pp-head"><div><h2>Encomendas</h2><p class="hint">Nota de encomenda em PDF para enviar ao fornecedor. Ao receber, as entradas ficam registadas no stock com o preço da encomenda.</p></div><div class="pp-acts">${ed?`<button class="b s" data-ecoencnova>Nova encomenda</button>`:""}</div></div>
    ${EN.length?`<div class="tw"><table class="rt eco-t"><thead><tr><th>Número</th><th>Data</th><th>Fornecedor</th><th class="eco-r">Linhas</th><th class="eco-r">Total s/ IVA</th><th>Estado</th><th></th></tr></thead><tbody>${EN.map(e=>{const s=ECO_ENC[e.estado]||{t:e.estado,k:"mu"};return `<tr data-ecoenc="${e.id}"><td class="fd-cod">${esc(e.n)}</td><td class="fd-nw">${esc(calDM(e.data,{day:"2-digit",month:"2-digit",year:"numeric"}))}</td><td>${esc(ecoFornNome(e.forn)||"—")}</td><td class="eco-r">${(e.linhas||[]).length}</td><td class="eco-r fd-nw">${ecoEur(ecoEncTot(e))}</td><td><span class="pp-chip ${s.k}">${esc(s.t)}</span></td><td class="fd-nw"><button class="b s" data-ecoencabrir>Abrir</button> <button class="b s" data-ecoencpdf>PDF</button></td></tr>`}).join("")}</tbody></table></div>`:ecoVz("carrinho","Ainda não há encomendas.")}</div>
  <div class="card"><div class="pp-head"><div><h2>Fornecedores</h2></div><div class="pp-acts">${ed?`<button class="b s" data-ecofornnovo>Novo fornecedor</button>`:""}</div></div>
    ${ECO.forn.length?`<div class="tw"><table class="rt eco-t eco-forn"><thead><tr><th>Nome</th><th>NIF</th><th>Contacto</th><th>Email</th><th>Telefone</th><th class="eco-r">Artigos</th><th></th></tr></thead><tbody>${ECO.forn.slice().sort((a,b)=>COLL_PT.compare(a.nome,b.nome)).map(f=>`<tr data-ecoforn="${f.id}">${["nome","nif","contacto","email","tel"].map(k=>`<td><input type="text" data-ecofk="${k}" value="${esc(f[k]||"")}" ${ed?"":"disabled"}></td>`).join("")}<td class="eco-r">${ECO.art.filter(a=>a.forn===f.id).length}</td><td>${ed&&!ECO.art.some(a=>a.forn===f.id)&&!ECO.mov.some(m=>m.forn===f.id)&&!ECO.enc.some(e=>e.forn===f.id)?`<button class="b s danger" data-ecofdel>Apagar</button>`:""}</td></tr>`).join("")}</tbody></table></div>`:ecoVz("lista","Ainda não há fornecedores.")}</div>`}
function ecoEncAbrir(e){const ed=ecoEd()&&e.estado!=="anulada"&&e.estado!=="recebida",dis=ed?"":"disabled",fx=ecoEd()&&(e.estado==="rascunho"||e.estado==="enviada");ecoDatalists();
  const box=ecoModal(`<h2>Encomenda ${esc(e.n)}</h2><div class="pp-form fd-form"><label>Fornecedor<select data-ee="forn" ${fx?"":"disabled"}>${ecoOpts(ECO.forn.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(f=>({v:f.id,t:f.nome})),e.forn||"","—")}</select></label><label>Data<input type="date" data-ee="data" value="${esc(e.data)}" ${fx?"":"disabled"}></label><label class="w2">Observações<input type="text" data-ee="obs" value="${esc(e.obs||"")}" ${dis}></label></div>
    <h3 class="fd-h3">Linhas</h3><div id="ecoEL"></div>${fx?`<button class="b s" data-ecoelin style="margin-top:6px">Mais uma linha</button>`:""}<div id="ecoEMsg"></div>
    <div class="fd-btns"><span class="hint" id="ecoETot" style="margin:0"></span><span class="grow"></span>${ecoEd()&&e.estado!=="anulada"&&e.estado!=="recebida"&&!(e.linhas||[]).some(l=>+l.rec>0)?`<button class="b s danger" data-ecoeanul>Anular</button>`:""}<button class="b s" data-ecoepdf>PDF</button>${ecoEd()?`<button class="b s" data-ecoemail>Enviar por email</button>`:""}${fx&&e.estado==="rascunho"?`<button class="b s" data-ecoeenv>Marcar como enviada</button>`:""}${ecoEd()&&(e.estado==="enviada"||e.estado==="parcial"||e.estado==="rascunho")?`<button class="b" data-ecoerec>Receber</button>`:""}<button class="b s" data-ecofechar>Fechar</button></div>`,(ev,bx)=>{const b=ev.target.closest("button");if(!b)return;
      if(b.matches("[data-ecoelin]")){ler();e.linhas.push({id:uid(),art:"",q:"",pu:"",rec:0});ecoGuardar(e);desenhar();return}
      if(b.dataset.ecoelx){ler();e.linhas=e.linhas.filter(l=>l.id!==b.dataset.ecoelx);ecoGuardar(e);desenhar();return}
      if(b.matches("[data-ecoepdf]")){ler();ecoPdfEnc(e);return}
      if(b.matches("[data-ecoemail]")){ler();ecoEncEmail(e);return}
      if(b.matches("[data-ecoeenv]")){ler();e.estado="enviada";ecoGuardar(e);bx.remove();ecoComprasUI();toast("Encomenda marcada como enviada");return}
      if(b.matches("[data-ecoeanul]")){if(!confirm("Anular esta encomenda? Fica registada como anulada."))return;e.estado="anulada";ecoGuardar(e);bx.remove();ecoComprasUI();return}
      if(b.matches("[data-ecoerec]")){ler();bx.remove();ecoEncReceber(e)}},true);
  function ler(){if(!fx)return;const H=k=>box.querySelector(`[data-ee="${k}"]`);e.forn=H("forn").value;e.data=H("data").value||e.data;e.obs=H("obs").value;
    box.querySelectorAll("[data-eek]").forEach(r=>{const l=e.linhas.find(x=>x.id===r.dataset.eek);if(!l)return;const a=ecoArtDe(r.querySelector("[data-eel=a]").value);l.art=a?a.id:"";l.txt=r.querySelector("[data-eel=a]").value;l.q=ecoNum(r.querySelector("[data-eel=q]").value)||"";const p=ecoNum(r.querySelector("[data-eel=p]").value);l.pu=isNaN(p)?"":p});ecoGuardar(e)}
  function desenhar(){$("#ecoEL").innerHTML=`<div class="eco-lin eco-lh ent"><span>Artigo</span><span>Quantidade</span><span>Preço unit. (sem IVA)</span><span>Recebido</span></div>`+(e.linhas||[]).map(l=>{const a=ecoArt(l.art);return `<div class="eco-lin ent" data-eek="${l.id}"><input type="text" data-eel="a" list="ecoArtDL" value="${esc(a?ecoArtTxt(a):l.txt||"")}" ${fx?"":"disabled"}><input type="text" inputmode="decimal" data-eel="q" value="${esc(l.q===""?"":ecoN(l.q))}" ${fx?"":"disabled"}><input type="text" inputmode="decimal" data-eel="p" value="${esc(l.pu===""||l.pu==null?"":String(l.pu).replace(".",","))}" ${fx?"":"disabled"}><span class="eco-disp">${ecoN(l.rec||0)}${fx?` <button class="b s" data-ecoelx="${l.id}" aria-label="Tirar">×</button>`:""}</span></div>`}).join("");$("#ecoETot").textContent="Total sem IVA: "+ecoEur(ecoEncTot(e))}
  box.addEventListener("change",()=>{ler();$("#ecoETot").textContent="Total sem IVA: "+ecoEur(ecoEncTot(e))});desenhar()}
function ecoEncReceber(e){const L=(e.linhas||[]).filter(l=>l.art&&(+l.q||0)>(+l.rec||0));if(!L.length){toast("Não há nada por receber nesta encomenda");return}
  const box=ecoModal(`<h2>Receber ${esc(e.n)}</h2><p class="hint">${esc(ecoFornNome(e.forn)||"")} · indique o que chegou. O que faltar fica por receber.</p>
    <div class="pp-form fd-form"><label>Data<input type="date" data-erc="data" value="${ecoHoje()}"></label><label>Documento (fatura ou guia)<input type="text" data-erc="doc" placeholder="FT 2026/123"></label></div>
    <div class="eco-lin eco-lh"><span>Artigo</span><span>Chegou</span><span>Em falta</span><span></span></div>${L.map(l=>{const a=ecoArt(l.art),f=(+l.q||0)-(+l.rec||0);return `<div class="eco-lin" data-erl="${l.id}"><span>${esc(a.nome)}</span><input type="text" inputmode="decimal" value="${ecoN(f)}"><span class="eco-disp">${ecoN(f)} ${esc(a.un||"")}</span><span></span></div>`}).join("")}
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-ecofechar>Cancelar</button><button class="b" data-ecorecok>Registar entrada</button></div>`,(ev,bx)=>{const b=ev.target.closest("[data-ecorecok]");if(!b)return;
      const data=bx.querySelector('[data-erc="data"]').value||ecoHoje(),doc=bx.querySelector('[data-erc="doc"]').value.trim(),g=uid()+uid(),novos=[];
      bx.querySelectorAll("[data-erl]").forEach(r=>{const l=e.linhas.find(x=>x.id===r.dataset.erl),q=ecoNum(r.querySelector("input").value);if(!l||!(q>0))return;const a=ecoArt(l.art);
        novos.push(ecoMov({g,tipo:"ent",data,art:l.art,q,pu:+l.pu||+a.pu0||ecoSt(a.id).ult||0,doc,forn:e.forn,enc:e.id,iva:ecoDef().iva,obs:"Encomenda "+e.n}));l.rec=(+l.rec||0)+q;if(!a.forn&&e.forn){a.forn=e.forn;ecoGuardar(a)}});
      if(!novos.length){toast("Indique as quantidades que chegaram");return}
      e.estado=e.linhas.every(l=>!l.art||(+l.rec||0)>=(+l.q||0))?"recebida":"parcial";novos.forEach(m=>ecoGuardar(m));ecoGuardar(e);bx.remove();ecoComprasUI();toast(`Entrada registada: ${novos.length} artigo${novos.length===1?"":"s"}`)})}
async function ecoEncEmail(e){const f=ecoForn(e.forn);if(!f||!f.email){toast("Este fornecedor não tem email (Compras › Fornecedores)");return}
  try{const doc=await ecoPdfEnc(e,true),b64=doc.output("datauristring").split(",")[1];
    await msEnviar({to:f.email,subject:`Nota de encomenda ${e.n} — Escola Profissional da Ilha de São Jorge`,body:`Bom dia,\n\nSegue em anexo a nossa nota de encomenda ${e.n}.\n\nCom os melhores cumprimentos,\n${(EU&&EU.nome)||""}\nEscola Profissional da Ilha de São Jorge`,anexo:{name:`Nota de encomenda ${e.n.replace(/\//g,"-")}.pdf`,b64}});
    if(e.estado==="rascunho"){e.estado="enviada";ecoGuardar(e);if(curTab==="ecoCompras")ecoComprasUI()}toast("Encomenda enviada para "+f.email)}catch(x){toast("Não foi possível enviar: "+(x.message||x))}}
(function(){const S=document.getElementById("ecoCompras");if(!S)return;
  S.addEventListener("change",e=>{const fk=e.target.closest("[data-ecofk]");if(fk&&ecoEd()){const f=ecoForn(fk.closest("[data-ecoforn]").dataset.ecoforn);if(f){f[fk.dataset.ecofk]=fk.value.trim();ecoGuardar(f)}return}
    if(e.target.matches("[data-ecorall]"))S.querySelectorAll("[data-ecorm]").forEach(c=>c.checked=e.target.checked)});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.matches("[data-ecofornnovo]")){const f={id:uid()+uid(),nome:"Novo fornecedor",nif:"",contacto:"",email:"",tel:"",cr:Date.now()};ECO.forn.push(f);ecoGuardar(f);ecoComprasUI();const i=S.querySelector(`[data-ecoforn="${f.id}"] input`);if(i){i.focus();i.select()}return}
    if(b.matches("[data-ecofdel]")){const f=ecoForn(b.closest("[data-ecoforn]").dataset.ecoforn);if(!f||!confirm(`Apagar o fornecedor «${f.nome}»?`))return;ECO.forn=ECO.forn.filter(x=>x!==f);ECO.del[f.id]=Date.now();ecoGuardar();ecoComprasUI();return}
    if(b.matches("[data-ecoencnova]")){const en={id:uid()+uid(),n:ecoEncN(),forn:"",data:ecoHoje(),estado:"rascunho",linhas:[{id:uid(),art:"",q:"",pu:"",rec:0}],obs:"",cr:Date.now(),por:String(EU&&EU.email||"")};ECO.enc.push(en);ecoGuardar(en);ecoComprasUI();ecoEncAbrir(en);return}
    if(b.matches("[data-ecoencfaz]")){const sel=[...S.querySelectorAll("[data-ecorm]:checked")].map(c=>{const a=ecoArt(c.dataset.ecorm),q=ecoNum((S.querySelector(`[data-ecorq="${a.id}"]`)||{}).value);return{a,q}}).filter(x=>x.a&&x.q>0);
      if(!sel.length){toast("Marque os artigos e as quantidades");return}const G=new Map();for(const x of sel){const k=x.a.forn||"";if(!G.has(k))G.set(k,[]);G.get(k).push(x)}
      for(const [forn,L] of G){const en={id:uid()+uid(),n:ecoEncN(),forn,data:ecoHoje(),estado:"rascunho",linhas:L.map(x=>({id:uid(),art:x.a.id,q:x.q,pu:+x.a.pu0||ecoSt(x.a.id).ult||"",rec:0})),obs:"",cr:Date.now(),por:String(EU&&EU.email||"")};ECO.enc.push(en);ecoGuardar(en)}
      ecoComprasUI();toast(`${G.size} encomenda${G.size===1?"":"s"} criada${G.size===1?"":"s"} (rascunho)`);return}
    const tr=b.closest("[data-ecoenc]"),en=tr&&ECO.enc.find(x=>x.id===tr.dataset.ecoenc);if(!en)return;
    if(b.matches("[data-ecoencabrir]"))ecoEncAbrir(en);if(b.matches("[data-ecoencpdf]"))ecoPdfEnc(en)})})();

// ----- Inventário -----
function ecoInvUI(){const out=$("#ecoInvOut"),ed=ecoEd(),I=ECO.inv.slice().sort((a,b)=>(b.cr||0)-(a.cr||0)),cur=ECO.inv.find(x=>x.id===ECO_UI.invSel);
  if(cur){ecoInvContagem(cur);return}
  out.innerHTML=`<div class="card"><div class="pp-head"><div><h2>Inventário</h2><p class="hint">Conte o que está nas prateleiras. Ao fechar a contagem, as diferenças entram como acertos de inventário (o registo fica com o que havia e o que se contou).</p></div>
      <div class="pp-acts"><button class="b s" data-ecopdfexist>Mapa de existências</button>${ed?`<button class="b" data-ecoinvnovo>Nova contagem</button>`:""}</div></div>
    ${I.length?`<div class="tw"><table class="rt eco-t"><thead><tr><th>Data</th><th>Local</th><th class="eco-r">Contados</th><th class="eco-r">Com diferença</th><th>Estado</th><th></th></tr></thead><tbody>${I.map(v=>{const n=Object.keys(v.cont||{}).length,d=v.estado==="fechado"?(v.dif||0):"—";return `<tr data-ecoinv="${v.id}"><td class="fd-nw">${esc(calDM(v.data,{day:"2-digit",month:"2-digit",year:"numeric"}))}</td><td>${esc(v.loc||"Todos os locais")}</td><td class="eco-r">${n}</td><td class="eco-r">${d}</td><td><span class="pp-chip ${v.estado==="fechado"?"mu":"wa"}">${v.estado==="fechado"?"fechado":"a contar"}</span></td><td><button class="b s" data-ecoinvabrir>Abrir</button></td></tr>`}).join("")}</tbody></table></div>`:ecoVz("lista","Ainda não fez nenhuma contagem.")}</div>`}
function ecoInvArts(v){return ECO.art.filter(a=>a.ativo!==false&&(!v.loc||a.loc===v.loc)).sort((a,b)=>COLL_PT.compare(a.cat||"",b.cat||"")||COLL_PTN.compare(a.nome,b.nome))}
function ecoInvContagem(v){const out=$("#ecoInvOut"),ab=v.estado!=="fechado"&&ecoEd(),A=ecoInvArts(v),C=v.cont||(v.cont={});
  out.innerHTML=`<div class="card"><div class="pp-head"><div><h2>Contagem de ${esc(calDMA(v.data))}</h2><p class="hint">${esc(v.loc||"Todos os locais")} · ${Object.keys(C).length} de ${A.length} artigos contados${v.estado==="fechado"?` · fechada${v.fechadoPor?" por "+esc(v.fechadoPor):""}`:". Pode contar aos poucos: fica guardado. Deixe em branco o que não contou (não mexe no stock)."}</p></div>
      <div class="pp-acts"><button class="b s" data-ecoinvvolta>Voltar</button><button class="b s" data-ecoinvfolha>Folha de contagem (PDF)</button>${ab?`<button class="b" data-ecoinvfecha>Fechar e acertar o stock</button>`:""}</div></div>
    <div class="tw"><table class="rt eco-t"><thead><tr><th>Artigo</th><th>Categoria</th><th class="eco-r">${v.estado==="fechado"?"Havia":"No sistema"}</th><th class="eco-r">Contado</th><th class="eco-r">Diferença</th></tr></thead><tbody>${A.map(a=>{const teo=v.estado==="fechado"&&v.teo&&v.teo[a.id]!==undefined?v.teo[a.id]:ecoSt(a.id).q,c=C[a.id],d=c===undefined?null:c-teo;
      return `<tr><td>${esc(a.nome)}<br><span class="hint fd-cod" style="margin:0">${esc(a.cod||"")}</span></td><td>${esc(a.cat||"")}</td><td class="eco-r">${ecoN(teo)} ${esc(a.un||"")}</td><td class="eco-r"><input type="text" inputmode="decimal" class="eco-qi" data-ecoinvq="${a.id}" value="${c===undefined?"":ecoN(c)}" ${ab?"":"disabled"}></td><td class="eco-r ${d?"eco-ko":""}">${d===null?"":(d>0?"+":"")+ecoN(d)}</td></tr>`}).join("")}</tbody></table></div></div>`}
(function(){const S=document.getElementById("ecoInv");if(!S)return;
  S.addEventListener("change",e=>{const q=e.target.closest("[data-ecoinvq]");if(!q||!ecoEd())return;const v=ECO.inv.find(x=>x.id===ECO_UI.invSel);if(!v||v.estado==="fechado")return;const n=ecoNum(q.value);
    if(isNaN(n))delete v.cont[q.dataset.ecoinvq];else v.cont[q.dataset.ecoinvq]=n;ecoGuardar(v);const y=window.scrollY;ecoInvContagem(v);window.scrollTo(0,y);const nx=S.querySelector(`[data-ecoinvq="${q.dataset.ecoinvq}"]`);const all=[...S.querySelectorAll("[data-ecoinvq]")],i=all.indexOf(nx);if(all[i+1])all[i+1].focus()});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.matches("[data-ecopdfexist]")){ecoPdfExist(ECO.art.filter(a=>a.ativo!==false));return}
    if(b.matches("[data-ecoinvnovo]")){const E=ecoDef();const box=ecoModal(`<h2>Nova contagem</h2><div class="pp-form fd-form"><label>Data<input type="date" data-ein="data" value="${ecoHoje()}"></label><label>Local<select data-ein="loc"><option value="">Todos os locais</option>${E.locs.map(l=>`<option>${esc(l)}</option>`).join("")}</select></label></div><div class="fd-btns"><span class="grow"></span><button class="b s" data-ecofechar>Cancelar</button><button class="b" data-ecoinvcria>Começar</button></div>`,(ev,bx)=>{if(!ev.target.closest("[data-ecoinvcria]"))return;
      const v={id:uid()+uid(),data:bx.querySelector('[data-ein="data"]').value||ecoHoje(),loc:bx.querySelector('[data-ein="loc"]').value,estado:"aberto",cont:{},cr:Date.now(),por:String(EU&&EU.email||"")};ECO.inv.push(v);ecoGuardar(v);bx.remove();ECO_UI.invSel=v.id;ecoInvUI()});return}
    if(b.matches("[data-ecoinvabrir]")){ECO_UI.invSel=b.closest("[data-ecoinv]").dataset.ecoinv;ecoInvUI();return}
    if(b.matches("[data-ecoinvvolta]")){ECO_UI.invSel="";ecoInvUI();return}
    const v=ECO.inv.find(x=>x.id===ECO_UI.invSel);if(!v)return;
    if(b.matches("[data-ecoinvfolha]")){ecoPdfFolha(v);return}
    if(b.matches("[data-ecoinvfecha]")){const A=ecoInvArts(v).filter(a=>v.cont[a.id]!==undefined),D=A.map(a=>({a,d:v.cont[a.id]-ecoSt(a.id).q})).filter(x=>Math.abs(x.d)>1e-9);
      if(!A.length){toast("Ainda não contou nenhum artigo");return}
      if(!confirm(`Fechar a contagem?\n\n${A.length} artigos contados, ${D.length} com diferença. As diferenças entram como acertos com a data da contagem e a contagem deixa de se poder mudar.`))return;
      const g=uid()+uid();v.teo={};A.forEach(a=>v.teo[a.id]=ecoSt(a.id).q);D.forEach(x=>ecoGuardar(ecoMov({g,tipo:"ace",data:v.data,art:x.a.id,q:x.d,inv:v.id,obs:"Inventário de "+calDM(v.data,{day:"numeric",month:"short",year:"numeric"})})));
      v.estado="fechado";v.dif=D.length;v.fechado=Date.now();v.fechadoPor=String(EU&&EU.email||"");ecoGuardar(v);ecoInvUI();toast(D.length?`Stock acertado em ${D.length} artigo${D.length===1?"":"s"}`:"Contagem fechada: tudo certo")}})})();

// ----- Custos (por projeto FSE, turma, curso, UFCD, categoria, formador) -----
var ECO_CPOR={fse:"Projeto FSE",turma:"Turma",curso:"Curso",ufcd:"UFCD / módulo",cat:"Categoria",quem:"Formador / serviço"};
function ecoCPer(){const U=ECO_UI;if(U.cper==="ano"){const [d,a,n]=ecoPeriodoAno();return{de:d,ate:a,t:"Ano letivo "+n}}
  if(U.cper==="mes"){const h=ecoHoje();return{de:h.slice(0,8)+"01",ate:h,t:"Este mês"}}return{de:U.cde||"0000-01-01",ate:U.cate||"9999-12-31",t:(U.cde?calDMA(U.cde):"início")+" a "+(U.cate?calDMA(U.cate):"hoje")}}
function ecoCGrupo(m,por){if(por==="cat"){const a=ecoArt(m.art);return a&&a.cat||"Sem categoria"}if(por==="fse")return m.fse||(m.turma?"Turma sem n.º de projeto":"Serviços da escola (sem turma)");
  if(por==="turma")return m.turma||"Serviços da escola (sem turma)";if(por==="curso")return m.curso||"Sem curso";if(por==="ufcd")return m.ufcd||"Sem UFCD";return m.quem||"Sem indicação"}
function ecoCDados(){const P=ecoCPer(),por=ECO_UI.cpor,G=new Map();let tot=0,ab=0;
  for(const m of ECO.mov){if(m.data<P.de||m.data>P.ate)continue;if(m.tipo==="aba"){ab+=ecoVal(m);continue}if(m.tipo!=="sai")continue;const k=ecoCGrupo(m,por),v=ecoVal(m);tot+=v;let g=G.get(k);if(!g)G.set(k,g={k,v:0,n:0,M:[]});g.v+=v;g.n++;g.M.push(m)}
  return{P,por,G:[...G.values()].sort((a,b)=>b.v-a.v),tot,ab}}
function ecoCustosUI(){const U=ECO_UI,D=ecoCDados(),sel=D.G.find(g=>g.k===U.csel);
  $("#ecoCustosOut").innerHTML=`<div class="card"><div class="pp-head"><div><h2>Custos do material</h2><p class="hint">O que saiu do economato, a custo médio e sem IVA. Cada saída fica com a turma, o projeto FSE e a UFCD, para o dossier financeiro.</p></div>
      <div class="pp-acts"><button class="b s" data-ecocpdf>PDF</button><button class="b s" data-ecocxls>Excel</button></div></div>
    <div class="row fd-filtros"><label>Período<select data-ecocf="cper">${ecoOpts([{v:"ano",t:"Ano letivo ativo"},{v:"mes",t:"Este mês"},{v:"out",t:"Outro período"}],U.cper)}</select></label>${U.cper==="out"?`<label>De<input type="date" data-ecocf="cde" value="${esc(U.cde)}"></label><label>Até<input type="date" data-ecocf="cate" value="${esc(U.cate)}"></label>`:""}
      <label>Agrupar por<select data-ecocf="cpor">${ecoOpts(Object.entries(ECO_CPOR).map(([v,t])=>({v,t})),U.cpor)}</select></label></div>
    <div class="ay-stats" style="margin:10px 0 14px"><div class="ay-st"><small>Consumo</small><b>${ecoEur(D.tot)}</b><em>${esc(D.P.t)}</em></div><div class="ay-st"><small>Abates</small><b>${ecoEur(D.ab)}</b><em>quebras e perdas</em></div><div class="ay-st"><small>${esc(ECO_CPOR[D.por])}</small><b>${D.G.length}</b><em>com consumo</em></div></div>
    ${D.G.length?`<div class="tw"><table class="rt fd-t eco-t"><thead><tr><th>${esc(ECO_CPOR[D.por])}</th><th class="eco-r">Saídas</th><th class="eco-r">Valor</th><th class="eco-r">%</th></tr></thead><tbody>${D.G.map(g=>`<tr data-ecocg="${esc(g.k)}" class="${U.csel===g.k?"on":""}"><td>${esc(g.k)}${D.por==="fse"&&g.M[0]&&g.M[0].fse?`<br><span class="hint" style="margin:0">${esc(ecoUniq(g.M.map(m=>m.turma)).join(" · "))}</span>`:""}</td><td class="eco-r">${g.n}</td><td class="eco-r fd-nw"><b>${ecoEur(g.v)}</b></td><td class="eco-r">${D.tot?Math.round(g.v/D.tot*100):0}%</td></tr>`).join("")}</tbody></table></div>`:ecoVz("lista","Não houve saídas neste período.")}
    ${sel?`<h3 class="fd-h3">${esc(sel.k)} — detalhe</h3><div class="tw"><table class="rt eco-t"><thead><tr><th>Data</th><th>Artigo</th><th class="eco-r">Qtd.</th><th class="eco-r">Valor</th><th>Turma · UFCD · quem</th></tr></thead><tbody>${sel.M.slice().sort(ecoOrd).map(m=>{const a=ecoArt(m.art);return `<tr><td class="fd-nw">${esc(calDM(m.data,{day:"2-digit",month:"2-digit",year:"numeric"}))}</td><td>${esc(a?a.nome:"")}</td><td class="eco-r">${ecoN(m.q)} ${esc(a?a.un||"":"")}</td><td class="eco-r fd-nw">${ecoEur(ecoVal(m))}</td><td>${esc([m.turma,m.ufcd,m.quem].filter(Boolean).join(" · "))}</td></tr>`}).join("")}</tbody></table></div>`:D.G.length?`<p class="hint">Clique numa linha para ver as saídas.</p>`:""}</div>`}
(function(){const S=document.getElementById("ecoCustos");if(!S)return;
  S.addEventListener("change",e=>{const f=e.target.closest("[data-ecocf]");if(f){ECO_UI[f.dataset.ecocf]=f.value;ECO_UI.csel="";ecoCustosUI()}});
  S.addEventListener("click",e=>{const tr=e.target.closest("tr[data-ecocg]");if(tr){ECO_UI.csel=ECO_UI.csel===tr.dataset.ecocg?"":tr.dataset.ecocg;ecoCustosUI();return}
    const b=e.target.closest("button");if(!b)return;if(b.matches("[data-ecocpdf]"))ecoPdfCustos();if(b.matches("[data-ecocxls]"))ecoExcelCustos()})})();

// ----- Definições -----
function ecoDefUI(){const E=ecoDef(),ed=ecoEd(),dis=ed?"":"disabled",ta=(k,l,h)=>`<label>${l}<textarea data-ecodk="${k}" rows="8" ${dis}>${esc(E[k].join("\n"))}</textarea><span class="hint" style="margin:2px 0 0">${h}</span></label>`;
  $("#ecoDefOut").innerHTML=`<div class="card"><div class="pp-head"><div><h2>Definições do Econo360</h2></div></div>
    <div class="pp-form">${ta("cats","Categorias","uma por linha")}${ta("locs","Locais (onde se guarda)","armazém, laboratório, cozinha…")}${ta("uns","Unidades","uma por linha")}</div>
    <div class="pp-form"><label>IVA habitual (%)<input type="number" step="any" min="0" data-ecodk="iva" value="${esc(E.iva)}" ${dis}><span class="hint" style="margin:2px 0 0">Nos Açores a taxa normal é 16%. Os valores do stock são sempre sem IVA.</span></label>
      <label>Prefixo dos códigos novos<input type="text" data-ecodk="pref" value="${esc(E.pref)}" ${dis}><span class="hint" style="margin:2px 0 0">Próximo: ${esc(ecoProxCod())}</span></label></div>
    <div class="fd-chk" style="margin-top:12px"><label class="fd-ck"><input type="checkbox" data-ecodk="aprovar"${E.aprovar?" checked":""} ${dis}> As requisições têm de ser aprovadas antes de se entregarem</label>
      <label class="fd-ck"><input type="checkbox" data-ecodk="avisar"${E.avisar?" checked":""} ${dis}> Avisar o formador por email (Office 365) quando a requisição é aprovada, entregue ou recusada</label></div></div>
  <div class="card"><div class="pp-head"><div><h2>Catálogo dos formadores</h2><p class="hint">Os formadores veem o nome, a unidade e se há stock dos artigos ativos (não veem preços nem quantidades). O catálogo atualiza-se sozinho quando os artigos mudam.</p></div>
      <div class="pp-acts">${ed?`<button class="b s" data-ecocatpub>Atualizar agora</button>`:""}</div></div><div id="ecoCatMsg"></div></div>
  <div class="card"><div class="pp-head"><div><h2>Importar e exportar</h2><p class="hint">Importar junta os artigos ao que já existe (não apaga nada). Colunas reconhecidas: código, artigo/designação, categoria, unidade, stock/quantidade, mínimo, máximo, preço/custo, local, fornecedor, referência, código de barras. O stock da folha só entra nos artigos que ainda não têm movimentos.</p></div>
      <div class="pp-acts">${ed?`<label class="b imp">Importar artigos (Excel)<input type="file" accept=".xlsx,.xls,.xlsm,.csv" data-ecoimp hidden></label>`:""}<button class="b s" data-ecojson>Cópia de segurança (.json)</button></div></div><div id="ecoImpMsg"></div></div>`}
(function(){const S=document.getElementById("ecoDef");if(!S)return;
  S.addEventListener("change",e=>{const x=e.target.closest("[data-ecoimp]");if(x&&x.files&&x.files[0]){ecoImportar(x.files[0]);x.value="";return}
    const k=e.target.closest("[data-ecodk]");if(!k||!ecoEd())return;const E=ecoDef(),key=k.dataset.ecodk;
    if(["cats","locs","uns"].includes(key)){const L=ecoUniq(k.value.split("\n").map(s=>s.trim()));if(L.length)E[key]=L}else if(key==="iva"){const n=ecoNum(k.value);if(!isNaN(n))E.iva=n}else if(key==="aprovar"||key==="avisar")E[key]=k.checked;else E[key]=k.value.trim().toUpperCase()||"EC";
    E.em=Date.now();ecoGuardar(E);ecoDefUI();toast("Guardado")});
  S.addEventListener("click",async e=>{const b=e.target.closest("button");if(!b)return;
    if(b.matches("[data-ecocatpub]")){b.disabled=true;try{await ecoCatPublicar(true);escLinhaMsg("#ecoCatMsg",`Catálogo atualizado: ${ECO.art.filter(a=>a.ativo!==false).length} artigos.`,"ok")}catch(x){escLinhaMsg("#ecoCatMsg","Não foi possível atualizar o catálogo: "+esc(sbErroMsg(x)),"bad")}b.disabled=false;return}
    if(b.matches("[data-ecojson]")){const bl=new Blob([JSON.stringify(ECO)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(bl);a.download=`Econo360 ${ecoHoje()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}})})();

// ----- importar artigos do Excel -----
async function ecoImportar(f){if(!ecoEd())return;try{const X=await loadXLSX(),wb=X.read(new Uint8Array(await f.arrayBuffer()),{type:"array"});let rows=[];
    for(const n of wb.SheetNames){const R=X.utils.sheet_to_json(wb.Sheets[n],{header:1,defval:"",raw:true});const hi=R.findIndex(r=>r.filter(c=>String(c).trim()).length>=2&&r.some(c=>/artigo|designa|descri|produto|nome|material/i.test(String(c))));if(hi<0)continue;
      const H=R[hi].map(c=>norm(String(c))),col=(...k)=>H.findIndex(h=>k.some(x=>h.includes(x)));
      const ix={cod:col("codigo","cod.","ref. interna"),nome:col("artigo","designa","descri","produto","material","nome"),cat:col("categoria","familia","tipo"),un:col("unidade","un."),q:col("stock","quantidade","existencia","qtd"),min:col("minimo"),max:col("maximo"),pu:col("preco","custo","valor unit"),loc:col("local","armazem","localiza"),forn:col("fornecedor"),ref:col("referencia"),cb:col("barras","ean")};
      if(ix.cb===ix.cod)ix.cb=-1;if(ix.ref===ix.cod)ix.ref=-1;
      for(const r of R.slice(hi+1)){const g=k=>ix[k]>=0?r[ix[k]]:"";const nome=String(g("nome")).trim();if(!nome)continue;rows.push({cod:String(g("cod")).trim(),nome,cat:String(g("cat")).trim(),un:String(g("un")).trim(),q:ecoNum(g("q")),min:ecoNum(g("min")),max:ecoNum(g("max")),pu:ecoNum(g("pu")),loc:String(g("loc")).trim(),forn:String(g("forn")).trim(),ref:String(g("ref")).trim(),cb:String(g("cb")).trim()})}
      if(rows.length)break}
    if(!rows.length){escLinhaMsg("#ecoImpMsg","Não encontrei uma lista de artigos nesse ficheiro (falta uma coluna «Artigo» ou «Designação»).","bad");return}
    const E=ecoDef();let novos=0,atual=0,st=0;const g=uid()+uid();
    for(const r of rows){let fid="";if(r.forn){let fo=ECO.forn.find(x=>norm(x.nome)===norm(r.forn));if(!fo){fo={id:uid()+uid(),nome:r.forn,nif:"",contacto:"",email:"",tel:"",cr:Date.now()};ECO.forn.push(fo);ecoGuardar(fo)}fid=fo.id}
      if(r.cat&&!E.cats.includes(r.cat))E.cats.push(r.cat);if(r.loc&&!E.locs.includes(r.loc))E.locs.push(r.loc);if(r.un&&!E.uns.includes(r.un.toLowerCase()))E.uns.push(r.un.toLowerCase());
      let a=(r.cod&&ECO.art.find(x=>x.cod&&norm(x.cod)===norm(r.cod)))||ECO.art.find(x=>norm(x.nome)===norm(r.nome));
      if(!a){a=ecoNovoArt({cod:r.cod||undefined,nome:r.nome,cat:r.cat||E.cats[E.cats.length-1],un:(r.un||"unidade").toLowerCase(),loc:r.loc||E.locs[0],min:isNaN(r.min)?"":r.min,max:isNaN(r.max)?"":r.max,forn:fid,ref:r.ref,cb:r.cb,pu0:isNaN(r.pu)?"":r.pu});novos++}
      else{let mud=false;const set=(k,v)=>{if(v!==""&&v!==undefined&&!(typeof v==="number"&&isNaN(v))&&(a[k]===""||a[k]===undefined||a[k]===null)){a[k]=v;mud=true}};set("cat",r.cat);set("un",r.un&&r.un.toLowerCase());set("loc",r.loc);set("min",r.min);set("max",r.max);set("forn",fid);set("ref",r.ref);set("cb",r.cb);set("pu0",r.pu);if(mud){ecoGuardar(a);atual++}}
      if(r.q>0&&!ECO.mov.some(m=>m.art===a.id)){ecoGuardar(ecoMov({g,tipo:"ent",data:ecoHoje(),art:a.id,q:r.q,pu:isNaN(r.pu)?0:r.pu,doc:"Stock inicial (importação)",obs:"Importado de "+f.name}));st++}}
    E.em=Date.now();ecoGuardar(E);const m=`${rows.length} linhas lidas: ${novos} artigo${novos===1?"":"s"} novo${novos===1?"":"s"}, ${atual} completado${atual===1?"":"s"}, ${st} com stock inicial.`;toast(m);if(curTab)ecoRender(curTab);setTimeout(()=>escLinhaMsg("#ecoImpMsg",m,"ok"),80)}
  catch(e){console.warn(e);escLinhaMsg("#ecoImpMsg","Não foi possível ler o ficheiro: "+esc(e.message||e),"bad")}}

// ----- Excel -----
async function ecoXls(nome,folhas){try{const X=await loadXLSX(),wb=X.utils.book_new();for(const [n,R,w] of folhas){const ws=X.utils.json_to_sheet(R.length?R:[{"":"(vazio)"}]);if(w)ws["!cols"]=w.map(x=>({wch:x}));X.utils.book_append_sheet(wb,ws,n)}X.writeFile(wb,`${nome} ${ecoHoje()}.xlsx`);toast("Excel criado")}catch(e){toast("Não foi possível criar o Excel: "+(e.message||e))}}
function ecoExcelArt(L){ecoXls("Econo360 artigos",[["Artigos",L.map(a=>{const s=ecoSt(a.id);return{"Código":a.cod,"Artigo":a.nome,"Categoria":a.cat,"Local":a.loc,"Unidade":a.un,"Stock":+s.q.toFixed(3),"Mínimo":a.min,"Máximo":a.max,"Custo médio":+(s.cmp||0).toFixed(4),"Valor":+s.v.toFixed(2),"Fornecedor":ecoFornNome(a.forn),"Referência":a.ref,"Código de barras":a.cb,"Ativo":a.ativo===false?"Não":"Sim"}}),[10,40,22,14,10,9,9,9,11,11,24,14,16,7]]])}
function ecoExcelMov(L){ecoXls("Econo360 movimentos",[["Movimentos",L.map(m=>{const a=ecoArt(m.art);return{"Data":m.data,"Tipo":(m.anula?"Anulação de ":"")+(ECO_TIPOS[m.tipo]||{}).n,"Código":a?a.cod:"","Artigo":a?a.nome:"","Quantidade":ecoDelta(m),"Unidade":a?a.un:"","Valor (sem IVA)":+Math.abs(ecoVal(m)).toFixed(2),"Fornecedor":ecoFornNome(m.forn),"Documento":m.doc,"Turma":m.turma,"N.º de projeto":m.fse,"Curso":m.curso,"UFCD / módulo":m.ufcd,"Para quem":m.quem,"Observações":m.obs,"Registado por":m.por}}),[11,14,10,36,10,9,12,22,14,34,16,28,28,22,30,26]]])}
function ecoExcelCustos(){const D=ecoCDados();ecoXls("Econo360 custos",[["Resumo",D.G.map(g=>({[ECO_CPOR[D.por]]:g.k,"Saídas":g.n,"Valor (sem IVA)":+g.v.toFixed(2)})),[44,8,14]],["Saídas",D.G.flatMap(g=>g.M).sort(ecoOrd).map(m=>{const a=ecoArt(m.art);return{"Data":m.data,"Artigo":a?a.nome:"","Categoria":a?a.cat:"","Quantidade":+m.q,"Unidade":a?a.un:"","Valor (sem IVA)":+ecoVal(m).toFixed(2),"Turma":m.turma,"N.º de projeto":m.fse,"Curso":m.curso,"UFCD / módulo":m.ufcd,"Para quem":m.quem}}),[11,36,22,10,9,12,34,16,28,28,22]]])}

// ----- PDF -----
var ECO_ROD="Escola Profissional da Ilha de São Jorge · EPISJ 360 · Econo360";
function ecoPdfDoc(J){return new J({unit:"mm",format:"a4"})}
async function ecoPdfExist(L){try{const J=await loadPDF(),doc=ecoPdfDoc(J);let tot=0;
  const body=L.slice().sort((a,b)=>COLL_PT.compare(a.cat||"",b.cat||"")||COLL_PTN.compare(a.nome,b.nome)).map(a=>{const s=ecoSt(a.id);tot+=s.v;return[a.cod||"",a.nome,a.cat||"",a.un||"",ecoN(s.q),s.cmp?ecoEurP(s.cmp):"",ecoEurP(s.v)].map(pdfTxt)});
  const y=pdfTitulo(doc,"Mapa de existências",`${pdfData()} · ${L.length} artigos · valor total ${ecoEurP(tot)} (custo médio ponderado, sem IVA)`);
  pdfTabela(doc,y,["Código","Artigo","Categoria","Un.","Stock","Custo médio","Valor"],body,{0:{cellWidth:18},1:{cellWidth:62},2:{cellWidth:32},3:{cellWidth:16},4:{halign:"right",cellWidth:14},5:{halign:"right",cellWidth:20},6:{halign:"right"}});
  pdfMoldura(doc,ECO_ROD);doc.save(`Econo360 mapa de existências ${ecoHoje()}.pdf`)}catch(e){toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function ecoPdfGuia(g){try{const M=ECO.mov.filter(m=>m.g===g&&m.tipo==="sai"&&!m.anula);if(!M.length){toast("Esta saída já não existe");return}const m0=M[0],J=await loadPDF(),doc=ecoPdfDoc(J);
  let y=pdfTitulo(doc,"Guia de saída de material",`${calDMA(m0.data)}${m0.req?" · requisição do formador":""}`);doc.setFontSize(9.5);doc.setTextColor(40);
  [["Turma",m0.turma||"Serviços da escola"],["N.º de projeto",m0.fse||"—"],["UFCD / módulo",m0.ufcd||"—"],["Para",m0.quem||"—"],["Observações",m0.obs||""]].filter(x=>x[1]).forEach(([k,v])=>{doc.setFont("helvetica","bold");doc.text(pdfTxt(k+":"),14,y);doc.setFont("helvetica","normal");doc.text(pdfTxt(v),48,y,{maxWidth:148});y+=5.5});
  let tot=0;const body=M.map(m=>{const a=ecoArt(m.art),v=ecoVal(m);tot+=v;return[a?a.cod||"":"",a?a.nome:"",ecoN(m.q),a?a.un||"":"",ecoEurP(v)].map(pdfTxt)});body.push(["","Total","","",ecoEurP(tot)].map(pdfTxt));
  y=pdfTabela(doc,y+3,["Código","Artigo","Qtd.","Un.","Valor (custo)"],body,{0:{cellWidth:22},2:{halign:"right",cellWidth:16},3:{cellWidth:20},4:{halign:"right",cellWidth:28}})+18;
  if(y>250){doc.addPage();y=PDF_TOP+20}doc.setDrawColor(150);doc.setLineWidth(.2);doc.line(20,y,90,y);doc.line(120,y,190,y);doc.setFontSize(8.5);doc.setTextColor(90);doc.text("Entregou (economato)",55,y+4.5,{align:"center"});doc.text("Recebeu",155,y+4.5,{align:"center"});
  pdfMoldura(doc,ECO_ROD);doc.save(`Econo360 guia de saída ${m0.data}.pdf`)}catch(e){toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function ecoPdfEnc(e,so){try{const J=await loadPDF(),doc=ecoPdfDoc(J),f=ecoForn(e.forn)||{},iva=+ecoDef().iva||0;
  let y=pdfTitulo(doc,"Nota de encomenda "+e.n,calDMA(e.data));doc.setFontSize(9.5);doc.setTextColor(40);
  [["Fornecedor",f.nome||"—"],["NIF",f.nif||""],["Contacto",[f.contacto,f.tel,f.email].filter(Boolean).join(" · ")],["Observações",e.obs||""]].filter(x=>x[1]).forEach(([k,v])=>{doc.setFont("helvetica","bold");doc.text(pdfTxt(k+":"),14,y);doc.setFont("helvetica","normal");doc.text(pdfTxt(v),42,y,{maxWidth:154});y+=5.5});
  const L=(e.linhas||[]).filter(l=>l.art&&+l.q>0),st=ecoEncTot(e);const body=L.map(l=>{const a=ecoArt(l.art);return[a.ref||a.cod||"",a.nome,ecoN(l.q),a.un||"",l.pu!==""&&l.pu!=null?ecoEurP(l.pu):"",l.pu?ecoEurP(l.q*l.pu):""].map(pdfTxt)});
  body.push(["","Total sem IVA","","","",ecoEurP(st)],["",`IVA (${ecoN(iva)}%)`,"","","",ecoEurP(st*iva/100)],["","Total","","","",ecoEurP(st*(1+iva/100))]);
  y=pdfTabela(doc,y+3,["Ref.","Artigo","Qtd.","Un.","Preço unit.","Total"],body.map(r=>r.map(pdfTxt)),{0:{cellWidth:22},2:{halign:"right",cellWidth:14},3:{cellWidth:18},4:{halign:"right",cellWidth:24},5:{halign:"right",cellWidth:26}})+8;
  doc.setFontSize(8.5);doc.setTextColor(90);doc.text(pdfTxt("Faturar a: Escola Profissional da Ilha de São Jorge. Por favor indique o n.º desta encomenda na fatura."),14,y);
  pdfMoldura(doc,ECO_ROD);if(so)return doc;doc.save(`Econo360 ${e.n.replace(/\//g,"-")}.pdf`)}catch(x){toast("Não foi possível criar o PDF: "+(x.message||x));if(so)throw x}}
async function ecoPdfFolha(v){try{const J=await loadPDF(),doc=ecoPdfDoc(J),A=ecoInvArts(v);const y=pdfTitulo(doc,"Folha de contagem",`${calDMA(v.data)} · ${v.loc||"Todos os locais"} · ${A.length} artigos`);
  pdfTabela(doc,y,["Código","Artigo","Categoria","Un.","No sistema","Contado"],A.map(a=>[a.cod||"",a.nome,a.cat||"",a.un||"",ecoN(v.estado==="fechado"&&v.teo&&v.teo[a.id]!==undefined?v.teo[a.id]:ecoSt(a.id).q),v.cont&&v.cont[a.id]!==undefined?ecoN(v.cont[a.id]):""].map(pdfTxt)),{0:{cellWidth:20},1:{cellWidth:66},2:{cellWidth:34},3:{cellWidth:16},4:{halign:"right",cellWidth:20},5:{halign:"right"}});
  pdfMoldura(doc,ECO_ROD);doc.save(`Econo360 folha de contagem ${v.data}.pdf`)}catch(e){toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function ecoPdfCustos(){try{const D=ecoCDados(),J=await loadPDF(),doc=ecoPdfDoc(J);let y=pdfTitulo(doc,"Custos do material por "+ECO_CPOR[D.por].toLowerCase(),`${D.P.t} · consumo ${ecoEurP(D.tot)} · abates ${ecoEurP(D.ab)} · custo médio, sem IVA`);
  y=pdfTabela(doc,y,[ECO_CPOR[D.por],"Saídas","Valor","%"],D.G.map(g=>[g.k,String(g.n),ecoEurP(g.v),(D.tot?Math.round(g.v/D.tot*100):0)+"%"].map(pdfTxt)),{1:{halign:"right",cellWidth:18},2:{halign:"right",cellWidth:30},3:{halign:"right",cellWidth:14}})+8;
  for(const g of D.G){if(y>255){doc.addPage();y=PDF_TOP+4}doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(22,40,80);doc.text(pdfTxt(`${g.k} — ${ecoEurP(g.v)}`),14,y+2);
    y=pdfTabela(doc,y+5,["Data","Artigo","Qtd.","Valor","Turma / UFCD / quem"],g.M.slice().sort(ecoOrd).map(m=>{const a=ecoArt(m.art);return[calDM(m.data,{day:"2-digit",month:"2-digit",year:"numeric"}),a?a.nome:"",ecoN(m.q)+" "+(a?a.un||"":""),ecoEurP(ecoVal(m)),[m.turma,m.ufcd,m.quem].filter(Boolean).join(" / ")].map(pdfTxt)}),{0:{cellWidth:20},1:{cellWidth:56},2:{halign:"right",cellWidth:22},3:{halign:"right",cellWidth:24}},true)+7}
  pdfMoldura(doc,ECO_ROD);doc.save(`Econo360 custos por ${ECO_CPOR[D.por].toLowerCase().replace(/[^a-z0-9]+/g," ").trim()} ${ecoHoje()}.pdf`)}catch(e){toast("Não foi possível criar o PDF: "+(e.message||e))}}

// ----- widget do Painel: conteúdo (o registo do widget está em econo/econo-dados.js) -----
WG_R.ecorep=function(){
  if(!ECO.art.length)return wgVazio("Ainda sem artigos no Econo360.")+wgIr("ecoInicio","Abrir o Econo360");
  const R=ecoRepor(),P=ECO_REQ?ECO_REQ.filter(r=>r.estado==="pendente"||r.estado==="aprovada").length:0;
  if(!R.length&&!P)return `<div class="wg-big">${ECO.art.filter(a=>a.ativo!==false).length}</div><p class="wg-t">artigos no economato, nenhum abaixo do mínimo.</p>`+wgIr("ecoInicio","Abrir o Econo360");
  return `${P?`<p class="wg-t"><b>${P}</b> requisiç${P===1?"ão":"ões"} por tratar.</p>`:""}<div class="wg-lst">${R.slice(0,6).map(x=>`<div class="wg-li"><i class="wg-dot" style="background:${x.s<=0?"#dc2626":"#d97706"}"></i><span class="wg-el"><b>${esc(x.a.nome)}</b><br><span class="wg-sub">há ${esc(ecoN(x.s))} ${esc(x.a.un||"")} · mínimo ${esc(ecoN(x.a.min))}</span></span></div>`).join("")}</div>`+wgIr(P?"ecoReq":"ecoCompras",P?"Requisições":"Compras")};
// ===== src/js/econo/econo-faturas.js =====
/* Econo360 — faturas (0.9.160): fotografia da fatura (no telemóvel abre a câmara) ou importação do PDF.
   Lê o QR code da AT (Portaria 195/2020: NIF do emitente, data, n.º do documento, ATCUD, bases, IVA e total); nos PDF sem QR
   lê o texto. Os ficheiros vão para o bucket privado «eco-faturas» do Supabase (só Direção e Economato; nada se apaga).
   A lista das faturas é a peça «EF» (ECF, em econo/econo-dados.js). «Lançar no stock» cria as entradas (movimentos com fat=id). */
var ECF_UI=ECF_UI||{q:"",est:"",mes:"",n:100};
var ECF_EST={porlancar:{t:"por lançar",k:"wa"},lancada:{t:"lançada no stock",k:"in"},semstock:{t:"sem artigos de stock",k:"mu"},anulada:{t:"anulada",k:"ba"}};
var ECF_TIPOS=[{v:"FT",t:"Fatura"},{v:"FR",t:"Fatura-recibo"},{v:"FS",t:"Fatura simplificada"},{v:"NC",t:"Nota de crédito"},{v:"ND",t:"Nota de débito"},{v:"GT",t:"Guia de transporte"},{v:"GR",t:"Guia de remessa"},{v:"OU",t:"Outro documento"}];
var ECF_URL=new Map(); // caminho → {u, ate}: endereços temporários (assinados) dos ficheiros
var ECF_ICO='<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>';
var ECF_CAM='<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>';
function ecfFat(id){return ECF.fat.find(f=>f.id===id)||null}
function ecfTipoN(v){const t=ECF_TIPOS.find(x=>x.v===v);return t?t.t:(v||"Documento")}
function ecfDig(s){return String(s||"").replace(/\D/g,"")}
function ecfFornPorNif(nif){const n=ecfDig(nif);return n?ECO.forn.find(f=>ecfDig(f.nif)===n)||null:null}
function ecfNome(f){return(f.forn&&ecoFornNome(f.forn))||f.fornNome||(f.nif?"NIF "+f.nif:"Fornecedor por indicar")}
function ecfChip(f){const e=ECF_EST[f.estado]||{t:f.estado,k:"mu"};return `<span class="pp-chip ${e.k}">${esc(e.t)}</span>`}
function ecfMovs(f){return ECO.mov.filter(m=>m.fat===f.id)}
function ecfPodeSb(){try{return sbAtivo()}catch(e){return false}}

// ---------- ler a fatura: QR code da AT, texto do PDF ----------
function ecfQrAT(s){const o={};String(s||"").split("*").forEach(p=>{const i=p.indexOf(":");if(i>0)o[p.slice(0,i).trim()]=p.slice(i+1).trim()});if(!/^\d{9}$/.test(o.A||""))return null;
  const n=k=>{const v=parseFloat(String(o[k]||"").replace(",","."));return isNaN(v)?0:v};
  const TX={"PT":[6,13,23],"PT-AC":[4,9,16],"PT-MA":[4,12,22]};let base=n("L"),iva=0,tx="",mx=0;
  for(const e of["I","J","K"]){base+=n(e+"2")+n(e+"3")+n(e+"5")+n(e+"7");iva+=n(e+"4")+n(e+"6")+n(e+"8");const T=TX[o[e+"1"]]||null;
    [[3,0],[5,1],[7,2]].forEach(([b,j])=>{if(n(e+b)>mx){mx=n(e+b);tx=T?T[j]:""}})}
  const F=o.F||"",data=/^\d{8}$/.test(F)?F.slice(0,4)+"-"+F.slice(4,6)+"-"+F.slice(6,8):"";
  return{nif:o.A,nifAdq:o.B||"",tipo:o.D||"",data,n:o.G||"",atcud:o.H||"",base:Math.round(base*100)/100,iva:Math.round(iva*100)/100,total:n("O"),tx}}
function ecfTexto(txt){const T=String(txt||""),r={};
  const nifs=[...T.matchAll(/(?:NIF|NIPC|N\.?\s?I\.?\s?F\.?|Contribuinte|VAT|Contrib\.?)\s*(?:n\.?\s*º|nº|no\.?)?\s*[:.]?\s*(?:PT\s?)?(\d{3}\s?\d{3}\s?\d{3})\b/gi)].map(m=>ecfDig(m[1]));
  if(nifs.length)r.nif=nifs[0];
  const d=T.match(/\b(FT|FR|FS|NC|ND|VD|GT|GR)\s+([A-Z0-9][\w.\-]*\/\d{1,9})\b/);if(d){r.tipo=d[1];r.n=d[1]+" "+d[2]}
  const at=T.match(/ATCUD\s*[:\-]?\s*([A-Z0-9]{8,}-\d+)/i);if(at)r.atcud=at[1];
  const di=T.match(/\b(20\d{2})[-/.](\d{2})[-/.](\d{2})\b/)||null,dp=T.match(/\b(\d{2})[-/.](\d{2})[-/.](20\d{2})\b/)||null;
  if(di)r.data=`${di[1]}-${di[2]}-${di[3]}`;else if(dp)r.data=`${dp[3]}-${dp[2]}-${dp[1]}`;
  const tots=[...T.matchAll(/Total(?:\s+a\s+pagar|\s+do\s+documento|\s+documento|\s+geral|\s*\(EUR\)|\s+EUR|\s+c\/\s*IVA|\s+com\s+IVA)?\s*[:€]?\s*(?:EUR|€)?\s*(\d{1,3}(?:[ .]\d{3})*,\d{2}|\d+\.\d{2})\b/gi)].map(m=>ecoNum(m[1])).filter(x=>x>0);
  if(tots.length)r.total=Math.max(...tots);
  const L=T.split(/\n/).map(x=>x.trim()).filter(x=>/[A-Za-zÀ-ú]{3}/.test(x)&&x.length<70&&!/^(original|duplicado|fatura|factura|página|pag\.|recibo|nota|guia|data|n\.?º|cliente|exmo)/i.test(x));
  if(L.length)r.nome=L[0].replace(/\s{2,}/g," ");
  return r}
async function ecfQrDe(cv){const ok=t=>/^A:\d{9}\*B:/.test(t||"")?t:"";
  try{if("BarcodeDetector" in window){const d=new BarcodeDetector({formats:["qr_code"]});const r=await d.detect(cv);for(const x of r||[])if(ok(x.rawValue))return x.rawValue}}catch(e){}
  try{if(!window.jsQR)await loadScript("lib/jsQR.js")}catch(e){return""}if(!window.jsQR)return"";
  const W=cv.width,H=cv.height,cx=cv.getContext("2d",{willReadFrequently:true});
  const Z=[[0,0,W,H],[0,H/2,W,H/2],[0,H/2,W/2,H/2],[W/2,H/2,W/2,H/2],[0,0,W/2,H/2],[W/2,0,W/2,H/2],[0,H/4,W,H/2]];
  for(const [x,y,w,h] of Z){try{const d=cx.getImageData(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0)),r=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(r&&ok(r.data))return r.data}catch(e){}}
  return""}
// fotografia: comprimida para JPEG (no máximo 2200 px no lado maior) — uma página de fatura fica com ~300-600 KB
async function ecfImagem(file){let src=null;
  try{src=await createImageBitmap(file,{imageOrientation:"from-image"})}catch(e){try{src=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=URL.createObjectURL(file)})}catch(x){src=null}}
  if(!src)return{blob:file,tipo:file.type||"image/jpeg",cv:null};
  const W=src.width||src.naturalWidth,H=src.height||src.naturalHeight,k=Math.min(1,2200/Math.max(W,H)),cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(W*k));cv.height=Math.max(1,Math.round(H*k));const cx=cv.getContext("2d",{willReadFrequently:true});cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(src,0,0,cv.width,cv.height);
  const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.8));
  if(!blob||(/jpe?g/.test(file.type)&&file.size<=blob.size))return{blob:file,tipo:file.type||"image/jpeg",cv};
  return{blob,tipo:"image/jpeg",cv}}
async function ecfPdfLer(file){const r={txt:"",qr:""};try{const pdfjs=await calPdfJs(),doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,np=Math.min(doc.numPages,6);
    for(let i=1;i<=np;i++){const pg=await doc.getPage(i),tc=await pg.getTextContent();r.txt+=tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("")+"\n"}
    const q=r.txt.match(/A:\d{9}\*B:[^\s]+/);if(q)r.qr=q[0];
    for(const i of[...new Set([1,doc.numPages])]){if(r.qr)break;const pg=await doc.getPage(i),vp=pg.getViewport({scale:2.4}),cv=document.createElement("canvas");cv.width=vp.width|0;cv.height=vp.height|0;
      const cx=cv.getContext("2d",{willReadFrequently:true});cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:cx,viewport:vp}).promise;r.qr=await ecfQrDe(cv)}}
  catch(e){console.warn("Econo360/PDF da fatura",e)}return r}
// junta o que se leu à fatura (o QR manda; o texto só completa o que falta)
function ecfAplicar(f,qr,tx){const q=qr?ecfQrAT(qr):null,t=tx||{};if(q){f.qr=qr;f.lido="qr"}else if(Object.keys(t).length)f.lido=f.lido||"texto";
  const p=(k,v)=>{if(v!==undefined&&v!==null&&v!==""&&(f[k]===undefined||f[k]===""||f[k]===null))f[k]=v};
  if(q){p("nif",q.nif);p("tipo",q.tipo);p("data",q.data);p("n",q.n);p("atcud",q.atcud);if(q.base||q.total){p("base",q.base);p("iva",q.iva);p("total",q.total)}p("tx",q.tx)}
  p("nif",t.nif);p("tipo",t.tipo);p("data",t.data);p("n",t.n);p("atcud",t.atcud);p("total",t.total);p("fornNome",t.nome);
  if(!f.forn&&f.nif){const fo=ecfFornPorNif(f.nif);if(fo){f.forn=fo.id;f.fornNome=""}}
  if(!f.tipo)f.tipo="FT"}

// ---------- ficheiros no Supabase Storage ----------
async function ecfEnviar(f,blob,tipo,nome){const sb=await sbCliente(),ext=/pdf/.test(tipo)?"pdf":/png/.test(tipo)?"png":/webp/.test(tipo)?"webp":/hei[cf]/.test(tipo)?"heic":"jpg";
  const p=`${new Date().getFullYear()}/${f.id}/${Date.now().toString(36)}-${uid()}.${ext}`;
  const {error}=await sb.storage.from(ECF_B).upload(p,blob,{contentType:tipo,upsert:false,cacheControl:"3600"});
  if(error){const m=String(error.message||error);throw new Error(/bucket not found/i.test(m)?"o espaço das faturas na nuvem ainda não foi preparado (falta aplicar servidor/supabase-episj360-econo360-faturas.sql)":/row-level security|unauthorized|403/i.test(m)?"esta conta não pode guardar faturas (só a Direção e o perfil Economato)":m)}
  f.fich=f.fich||[];f.fich.push({p,tipo,nome:String(nome||"").slice(0,120),tam:blob.size||0,em:Date.now(),por:String(EU&&EU.email||"")});return p}
async function ecfUrls(f){const L=(f.fich||[]).map(x=>x.p).filter(p=>{const c=ECF_URL.get(p);return!c||c.ate<Date.now()+60000});
  if(L.length){try{const sb=await sbCliente(),{data,error}=await sb.storage.from(ECF_B).createSignedUrls(L,3600);if(!error)(data||[]).forEach(x=>{if(x.signedUrl)ECF_URL.set(x.path,{u:x.signedUrl,ate:Date.now()+3500000})})}catch(e){}}
  return(f.fich||[]).map(x=>Object.assign({u:(ECF_URL.get(x.p)||{}).u||""},x))}
async function ecfMiniaturas(f,el){if(!el)return;if(!(f.fich||[]).length){el.innerHTML=`<p class="hint" style="margin:0">Ainda sem ficheiro.</p>`;return}
  el.innerHTML=`<p class="hint" style="margin:0">A abrir os ficheiros…</p>`;const L=await ecfUrls(f);
  el.innerHTML=L.map((x,i)=>/pdf/.test(x.tipo)?`<a class="ecf-pdf" href="${escUrl(x.u)}" target="_blank" rel="noopener">${ECF_ICO}<span>PDF${L.length>1?" "+(i+1):""}<small>${esc(x.nome||"")}${x.tam?" · "+Math.round(x.tam/1024)+" KB":""}</small></span></a>`
    :`<a class="ecf-img" href="${escUrl(x.u)}" target="_blank" rel="noopener" title="Abrir a página ${i+1}">${x.u?`<img src="${escUrl(x.u)}" alt="Página ${i+1} da fatura" loading="lazy">`:""}<small>pág. ${i+1}</small></a>`).join("")}

// ---------- entrada de ficheiros: fotografar (câmara do telemóvel) ou importar PDF ----------
function ecfFotografar(f){if(!ecoEd())return;const i=document.createElement("input");i.type="file";i.accept="image/*";i.setAttribute("capture","environment");i.hidden=true;document.body.appendChild(i);
  i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)ecfReceber(L,f||null)});i.click();setTimeout(()=>{try{if(!i.files||!i.files.length)i.remove()}catch(e){}},120000)}
function ecfEscolherPdf(f){if(!ecoEd())return;const i=document.createElement("input");i.type="file";i.accept="application/pdf,.pdf,image/*";i.multiple=!f;i.hidden=true;document.body.appendChild(i);
  i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)ecfReceber(L,f||null)});i.click()}
// L: ficheiros escolhidos. f: fatura a que se juntam (página seguinte). Sem f: cada PDF é uma fatura; as fotografias juntas são uma fatura.
async function ecfReceber(L,f){if(!ecoEd())return;if(!ecfPodeSb()){toast("Para guardar faturas é preciso ter entrado com o Office 365.");return}
  const pdfs=L.filter(x=>/pdf$/i.test(x.type)||/\.pdf$/i.test(x.name)),imgs=L.filter(x=>!pdfs.includes(x)&&/^image\//.test(x.type||"image/"));
  if(!pdfs.length&&!imgs.length){toast("Escolha fotografias ou ficheiros PDF");return}
  const box=ecoModal(`<h2>A guardar a fatura…</h2><p class="hint" id="ecfProg">A preparar…</p>`);const prog=t=>{const e=box.querySelector("#ecfProg");if(e)e.textContent=t};
  const novas=[];
  try{const grupos=f?[{f,files:pdfs.concat(imgs)}]:pdfs.map(x=>({f:null,files:[x]})).concat(imgs.length?[{f:null,files:imgs}]:[]);
    let gi=0;for(const G of grupos){gi++;let fat=G.f;const nova=!fat;
      if(nova)fat={id:uid()+uid(),estado:"porlancar",tipo:"",n:"",data:"",nif:"",forn:"",fornNome:"",atcud:"",base:"",iva:"",total:"",tx:"",enc:"",obs:"",linhas:[],fich:[],origem:"",cr:Date.now(),por:String(EU&&EU.email||"")};
      let fi=0;for(const file of G.files){fi++;const pre=grupos.length>1?`Fatura ${gi} de ${grupos.length} · `:"";
        if(/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name)){prog(pre+"a ler o PDF…");const r=await ecfPdfLer(file);ecfAplicar(fat,r.qr,ecfTexto(r.txt));if(!fat.origem)fat.origem="pdf";
          prog(pre+"a guardar o PDF…");await ecfEnviar(fat,file,"application/pdf",file.name)}
        else{prog(pre+(G.files.length>1?`página ${fi} de ${G.files.length}: `:"")+"a preparar a fotografia…");const im=await ecfImagem(file);
          if(!fat.qr&&im.cv){prog(pre+"a procurar o QR code da fatura…");const q=await ecfQrDe(im.cv);if(q)ecfAplicar(fat,q,null)}if(!fat.origem)fat.origem="foto";
          prog(pre+"a guardar a fotografia…");await ecfEnviar(fat,im.blob,im.tipo,file.name||"fotografia.jpg")}}
      if(!fat.data)fat.data=ecoHoje();if(!fat.tipo)fat.tipo="FT";
      if(nova){ECF.fat.push(fat);novas.push(fat)}ecfGuardar(fat)}
    box.remove()}
  catch(e){box.remove();novas.forEach(x=>ecfGuardar(x));toast("Não foi possível guardar o ficheiro: "+(e.message||e));if(curTab==="ecoFat")ecoFatUI();return}
  if(curTab==="ecoFat")ecoFatUI();
  if(f){toast("Página juntada à fatura");ecfAbrir(f);return}
  if(novas.length===1){const x=novas[0];toast(x.lido==="qr"?"Fatura lida pelo QR code — confirme os dados":x.lido?"Confirme os dados lidos da fatura":"Fatura guardada — preencha os dados");ecfAbrir(x)}
  else{toast(`${novas.length} faturas guardadas, por lançar`);if(curTab!=="ecoFat")show("ecoFat")}}

// ---------- lista ----------
function ecfFiltradas(){const U=ECF_UI,q=norm(U.q||"");return ECF.fat.filter(f=>{if(U.est){if(f.estado!==U.est)return false}else if(f.estado==="anulada")return false;
  if(U.mes&&String(f.data||"").slice(0,7)!==U.mes)return false;
  if(q){const h=norm([f.n,f.nif,f.atcud,ecfNome(f),f.obs,ecfTipoN(f.tipo),f.total].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}return true})
  .sort((a,b)=>String(b.data||"").localeCompare(String(a.data||""))||(b.cr||0)-(a.cr||0))}
function ecfTot(f){const t=+f.total;if(t)return t;return(+f.base||0)+(+f.iva||0)}
function ecoFatUI(){const out=$("#ecoFatOut");if(!out)return;const ed=ecoEd(),U=ECF_UI,A=ECF.fat.filter(f=>f.estado!=="anulada"),L=ecfFiltradas(),N=Math.min(L.length,U.n),mob=ecoMob();
  const hj=ecoHoje(),mes=hj.slice(0,7),[ai,af,an]=ecoPeriodoAno(),pl=A.filter(f=>f.estado==="porlancar").length;
  let tm=0,ta=0;for(const f of A){if(f.tipo==="NC")continue;const d=String(f.data||"");if(d.slice(0,7)===mes)tm+=ecfTot(f);if(d>=ai&&d<=af)ta+=ecfTot(f)}
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  const meses=ecoUniq(ECF.fat.map(f=>String(f.data||"").slice(0,7)).filter(Boolean)).sort().reverse().map(m=>({v:m,t:new Date(m+"-15").toLocaleDateString("pt-PT",{month:"long",year:"numeric"})}));
  out.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Faturas</h1><div class="sub">Fotografe a fatura com o telemóvel ou importe o PDF: o QR code é lido sozinho e a fatura fica guardada, ligada às entradas no stock.</div></div></div>
    <div class="ay-stats">${st("Por lançar",pl,pl?"faltam entrar no stock":"tudo lançado")}${st("Este mês",ecoEur(tm),"com IVA")}${st("Ano letivo",ecoEur(ta),an?esc(an):"")}${st("Faturas",A.length,`${A.filter(f=>(f.fich||[]).length).length} com ficheiro`)}</div></div>
  ${ed?`<div class="card ecf-add" id="ecfDrop"><div class="ecf-addt"><b>Juntar uma fatura</b><span class="hint" style="margin:0">${mob?"Tire uma fotografia por página (com o QR code bem visível) ou escolha o PDF.":"Arraste para aqui os PDF das faturas, ou escolha-os. No telemóvel, use «Fotografar fatura»."}</span></div>
    <div class="ecf-addb"><button class="b ecf-foto" data-ecffoto>${ECF_CAM}Fotografar fatura</button><button class="b imp" data-ecfpdf>Importar PDF</button></div>${ecfPodeSb()?"":`<div class="msg info" style="margin:10px 0 0">Para guardar faturas é preciso ter entrado com o Office 365.</div>`}</div>`:""}
  <div class="card"><div class="pp-head"><div><h2>Faturas registadas</h2><p class="hint">Nada se apaga: uma fatura errada anula-se; os ficheiros ficam guardados.</p></div><div class="pp-acts"><button class="b s eco-sopc" data-ecfxls>Excel</button></div></div>
    <div class="row fd-filtros"><label class="grow" style="min-width:200px">Procurar<input type="text" id="ecfQ" value="${esc(U.q)}" placeholder="fornecedor, n.º, NIF, ATCUD…"></label>
      <label>Estado<select data-ecff="est">${ecoOpts([{v:"porlancar",t:"Por lançar"},{v:"lancada",t:"Lançadas no stock"},{v:"semstock",t:"Sem artigos de stock"},{v:"anulada",t:"Anuladas"}],U.est,"Todas (sem anuladas)")}</select></label>
      <label>Mês<select data-ecff="mes">${ecoOpts(meses,U.mes,"Todos")}</select></label></div>
    <p class="hint">${L.length} fatura${L.length===1?"":"s"} · ${ecoEur(L.filter(f=>f.tipo!=="NC").reduce((s,f)=>s+ecfTot(f),0))} com IVA</p>
    ${!L.length?ecoVz("lista",ECF.fat.length?"Nenhuma fatura com estes filtros.":"Ainda não há faturas. Fotografe a primeira ou importe o PDF."):mob
      ?`<div class="eco-cards">${L.slice(0,N).map(f=>`<button class="eco-card" data-ecfa="${f.id}"><span class="eco-cm"><b>${esc(ecfNome(f))}</b><small>${esc(f.n||ecfTipoN(f.tipo))} · ${esc(f.data?calDM(f.data,{day:"2-digit",month:"2-digit",year:"numeric"}):"sem data")}${(f.fich||[]).length?" · "+(f.fich.length)+" fich.":""}</small></span><span class="eco-cq"><b>${ecoEur(ecfTot(f))}</b>${ecfChip(f)}</span></button>`).join("")}</div>`
      :`<div class="tw"><table class="rt eco-t"><thead><tr><th>Data</th><th>Fornecedor</th><th>Documento</th><th class="eco-r">Sem IVA</th><th class="eco-r">Total</th><th>Estado</th><th>Ficheiros</th><th></th></tr></thead><tbody>${L.slice(0,N).map(f=>`<tr data-ecfa="${f.id}" class="${f.estado==="anulada"?"eco-anul":""}"><td class="fd-nw">${esc(f.data?calDM(f.data,{day:"2-digit",month:"2-digit",year:"numeric"}):"—")}</td><td>${esc(ecfNome(f))}${f.nif?`<br><span class="hint" style="margin:0">NIF ${esc(f.nif)}</span>`:""}</td><td>${esc(f.n||"—")}<br><span class="hint" style="margin:0">${esc(ecfTipoN(f.tipo))}${f.lido==="qr"?" · lida pelo QR":""}</span></td><td class="eco-r fd-nw">${f.base!==""&&f.base!=null?ecoEur(f.base):"—"}</td><td class="eco-r fd-nw"><b>${ecoEur(ecfTot(f))}</b></td><td>${ecfChip(f)}</td><td>${(f.fich||[]).length?`${(f.fich||[]).length} ${f.fich.some(x=>/pdf/.test(x.tipo))?"PDF":"foto"+(f.fich.length>1?"s":"")}`:"—"}</td><td class="fd-nw"><button class="b s" data-ecfabrir>Abrir</button></td></tr>`).join("")}</tbody></table></div>`}
    ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecfmais>Mostrar mais ${Math.min(100,L.length-N)} (de ${L.length-N})</button></div>`:""}</div>`}
(function(){const S=document.getElementById("ecoFat");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ecfQ"){ECF_UI.q=e.target.value;ECF_UI.n=100;clearTimeout(S._h);S._h=setTimeout(()=>{ecoFatUI();const i=$("#ecfQ");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-ecff]");if(f){ECF_UI[f.dataset.ecff]=f.value;ECF_UI.n=100;ecoFatUI()}});
  S.addEventListener("click",e=>{const b=e.target.closest("button,tr[data-ecfa]");if(!b)return;
    if(b.matches("[data-ecffoto]")){ecfFotografar();return}if(b.matches("[data-ecfpdf]")){ecfEscolherPdf();return}
    if(b.matches("[data-ecfmais]")){ECF_UI.n+=100;ecoFatUI();return}if(b.matches("[data-ecfxls]")){ecfXls(ecfFiltradas());return}
    const r=b.closest("[data-ecfa]"),f=r&&ecfFat(r.dataset.ecfa);if(f)ecfAbrir(f)});
  S.addEventListener("dragover",e=>{const d=e.target.closest("#ecfDrop");if(d&&ecoEd()){e.preventDefault();d.classList.add("on")}});
  S.addEventListener("dragleave",e=>{const d=e.target.closest("#ecfDrop");if(d)d.classList.remove("on")});
  S.addEventListener("drop",e=>{const d=e.target.closest("#ecfDrop");if(!d||!ecoEd())return;e.preventDefault();d.classList.remove("on");const L=[...(e.dataTransfer&&e.dataTransfer.files||[])];if(L.length)ecfReceber(L,null)})})();

// ---------- ficha da fatura ----------
function ecfEncsDe(forn){return ECO.enc.filter(e=>(!forn||e.forn===forn)&&e.estado!=="anulada"&&e.estado!=="recebida"||false)}
function ecfAbrir(f){ecoDatalists();const E=ecoDef(),ed=ecoEd(),ab=ed&&f.estado==="porlancar",dis=ab?"":"disabled",M=ecfMovs(f),ativos=M.filter(m=>!m.anula&&!m.anulado);
  const L=(Array.isArray(f.linhas)&&f.linhas.length?f.linhas:[{id:uid(),art:"",q:"",pu:""}]).map(l=>Object.assign({},l));
  const fornOpts=ECO.forn.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(o=>({v:o.id,t:o.nome+(o.nif?" · "+o.nif:"")}));
  const novoF=!f.forn&&(f.fornNome||f.nif);const encs=ecfEncsDe(f.forn).concat(f.enc&&!ecfEncsDe(f.forn).some(e=>e.id===f.enc)?ECO.enc.filter(e=>e.id===f.enc):[]);
  const num=v=>v===""||v===null||v===undefined||isNaN(+v)?"":String(v).replace(".",",");
  const box=ecoModal(`<div class="ecf-h"><h2>${esc(ecfTipoN(f.tipo))}${f.n?" "+esc(f.n):""}</h2>${ecfChip(f)}</div>
    ${f.lido==="qr"?`<div class="msg ok" style="margin:6px 0 10px">Dados lidos do QR code da fatura (NIF, data, n.º, ATCUD e valores). Confirme e indique os artigos.</div>`:f.lido==="texto"?`<div class="msg info" style="margin:6px 0 10px">Sem QR code legível: os dados foram lidos do texto do PDF. Confirme-os.</div>`:f.origem==="foto"&&f.estado==="porlancar"?`<div class="msg info" style="margin:6px 0 10px">Não foi possível ler o QR code da fotografia. Preencha os dados ou tire outra fotografia mais perto do QR code.</div>`:""}
    <div class="ecf-fich" id="ecfFich"></div>
    ${ed&&f.estado!=="anulada"?`<div class="fd-btns" style="margin:6px 0 4px"><button class="b s" data-ecfpag>${ECF_CAM}Mais uma página</button><button class="b s imp" data-ecfpdf2>Juntar PDF</button></div>`:""}
    <div class="pp-form fd-form">
      <label class="w2">Fornecedor<select data-ef="forn" ${dis}>${novoF?`<option value="">— novo fornecedor —</option>`:""}${ecoOpts(fornOpts,f.forn||"",novoF?undefined:"—")}</select></label>
      <label class="w2 ecf-novo"${f.forn?" hidden":""}>Nome do fornecedor novo<input type="text" data-ef="fornNome" value="${esc(f.fornNome||"")}" placeholder="fica em Compras › Fornecedores" ${dis}></label>
      <label>NIF do fornecedor<input type="text" inputmode="numeric" data-ef="nif" value="${esc(f.nif||"")}" ${dis}></label>
      <label>Tipo<select data-ef="tipo" ${dis}>${ecoOpts(ECF_TIPOS,f.tipo||"FT")}</select></label>
      <label>N.º do documento<input type="text" data-ef="n" value="${esc(f.n||"")}" placeholder="FT A/123" ${dis}></label>
      <label>Data<input type="date" data-ef="data" value="${esc(f.data||"")}" ${dis}></label>
      <label>Total sem IVA<input type="text" inputmode="decimal" data-ef="base" value="${esc(num(f.base))}" ${dis}></label>
      <label>IVA<input type="text" inputmode="decimal" data-ef="iva" value="${esc(num(f.iva))}" ${dis}></label>
      <label>Total com IVA<input type="text" inputmode="decimal" data-ef="total" value="${esc(num(f.total))}" ${dis}></label>
      <label>Taxa de IVA dos artigos (%)<input type="text" inputmode="decimal" data-ef="tx" value="${esc(num(f.tx===""||f.tx==null?E.iva:f.tx))}" ${dis}></label>
      <label>ATCUD<input type="text" data-ef="atcud" value="${esc(f.atcud||"")}" ${dis}></label>
      <label>Encomenda<select data-ef="enc" ${dis}>${ecoOpts(encs.map(e=>({v:e.id,t:e.n+" · "+(ecoFornNome(e.forn)||"sem fornecedor")})),f.enc||"","Nenhuma")}</select></label>
      <label class="w2">Observações<input type="text" data-ef="obs" value="${esc(f.obs||"")}" ${ed&&f.estado!=="anulada"?"":"disabled"}></label>
    </div>
    ${f.estado==="porlancar"?`<h3 class="fd-h3">Artigos da fatura (para o stock)</h3><p class="hint" style="margin-top:0">Só o que entra no economato. Serviços, reparações ou combustível: use «Sem artigos de stock».</p><div id="ecfLins"></div>${ab?`<button class="b s" data-ecflin style="margin-top:6px">Mais uma linha</button>`:""}`:""}
    ${M.length?`<h3 class="fd-h3">Entradas no stock</h3><div class="fd-hist">${M.map(m=>{const a=ecoArt(m.art);return `<div class="${m.anula||m.anulado?"eco-anul":""}">${ecoTipoChip(m)} <b>${ecoSinal(m)}${ecoN(Math.abs(m.q))}</b> ${esc(a?a.un||"":"")} · ${esc(a?a.nome:"(artigo apagado)")} · ${ecoEur(Math.abs(+m.q||0)*(+m.pu||0))}</div>`}).join("")}</div>`:""}
    <div id="ecfMsg"></div>
    <p class="hint fd-meta">Registada ${f.cr?esc(new Date(f.cr).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):"—"}${f.por?" por "+esc(f.por):""}${f.em?" · alterada "+esc(new Date(f.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):""}</p>
    <div class="fd-btns ecf-btns"><span class="hint" id="ecfTot" style="margin:0"></span><span class="grow"></span>
      ${ab&&!M.length?`<button class="b s danger" data-ecfanul>Anular fatura</button><button class="b s" data-ecfsem>Sem artigos de stock</button>`:""}
      ${ed&&f.estado==="semstock"?`<button class="b s" data-ecfvolta>Voltar a «por lançar»</button>`:""}
      ${ed&&f.estado==="lancada"&&ativos.length?`<button class="b s danger" data-ecfdesl>Anular o lançamento</button>`:""}
      <button class="b s" data-ecofechar>Fechar</button>${ed&&f.estado!=="anulada"?`<button class="b s" data-ecfguardar>Guardar</button>`:""}${ab?`<button class="b" data-ecflancar>Lançar no stock</button>`:""}</div>`,(ev,bx)=>{const b=ev.target.closest("button");if(!b)return;
      if(b.matches("[data-ecfpag]")){ler();ecfGravarCab(f);bx.remove();ecfFotografar(f);return}
      if(b.matches("[data-ecfpdf2]")){ler();ecfGravarCab(f);bx.remove();ecfEscolherPdf(f);return}
      if(b.matches("[data-ecflin]")){ler();L.push({id:uid(),art:"",q:"",pu:""});desenhar();const i=[...bx.querySelectorAll("[data-efl=a]")].pop();if(i)i.focus();return}
      if(b.dataset.ecflx){ler();const i=L.findIndex(x=>x.id===b.dataset.ecflx);if(i>=0)L.splice(i,1);if(!L.length)L.push({id:uid(),art:"",q:"",pu:""});desenhar();return}
      if(b.matches("[data-ecfguardar]")){ler();if(ecfGravarCab(f)===false)return;bx.remove();ecfDepois("Fatura guardada");return}
      if(b.matches("[data-ecfsem]")){ler();if(ecfGravarCab(f)===false)return;f.estado="semstock";ecfGuardar(f);bx.remove();ecfDepois("Fatura registada (sem artigos de stock)");return}
      if(b.matches("[data-ecfvolta]")){f.estado="porlancar";ecfGuardar(f);bx.remove();ecfAbrir(f);return}
      if(b.matches("[data-ecfanul]")){if(!confirm("Anular esta fatura? Fica registada como anulada (com os ficheiros)."))return;ler();ecfGravarCab(f,true);f.estado="anulada";ecfGuardar(f);bx.remove();ecfDepois("Fatura anulada");return}
      if(b.matches("[data-ecfdesl]")){if(!confirm("Anular o lançamento desta fatura no stock?\n\nEntram movimentos ao contrário (ficam todos registados) e a fatura volta a «por lançar»."))return;ecfDeslancar(f);bx.remove();ecfDepois("Lançamento anulado");ecfAbrir(f);return}
      if(b.matches("[data-ecflancar]")){ler();if(ecfGravarCab(f)===false)return;if(ecfLancar(f,bx)){bx.remove();ecfDepois("Fatura lançada no stock")}}},true);
  const H=k=>box.querySelector(`[data-ef="${k}"]`);
  function ler(){if(!ed||f.estado==="anulada")return;const g=k=>{const x=H(k);return x?x.value:undefined};
    if(ab){const n=k=>{const v=ecoNum(g(k));return isNaN(v)?"":Math.round(v*100)/100};f.forn=g("forn")||"";f.fornNome=f.forn?"":String(g("fornNome")||"").trim();f.nif=ecfDig(g("nif"));f.tipo=g("tipo");f.n=String(g("n")||"").trim();f.data=g("data")||f.data;
      f.base=n("base");f.iva=n("iva");f.total=n("total");const t=ecoNum(g("tx"));f.tx=isNaN(t)?"":t;f.atcud=String(g("atcud")||"").trim();f.enc=g("enc")||""}
    f.obs=String(g("obs")||"").trim();
    box.querySelectorAll("[data-eflk]").forEach(r=>{const l=L.find(x=>x.id===r.dataset.eflk);if(!l)return;const v=r.querySelector("[data-efl=a]").value,a=ecoArtDe(v);l.txt=v;l.art=a?a.id:"";l.q=r.querySelector("[data-efl=q]").value;l.pu=r.querySelector("[data-efl=p]").value});
    f.linhas=L.filter(l=>l.art||String(l.txt||"").trim()||String(l.q||"").trim()).map(l=>({id:l.id,art:l.art,txt:l.art?"":l.txt||"",q:l.q,pu:l.pu}))}
  function desenhar(){const el=box.querySelector("#ecfLins");if(!el)return;
    el.innerHTML=`<div class="eco-lin eco-lh ent"><span>Artigo</span><span>Quantidade</span><span>Preço unit. (sem IVA)</span><span></span></div>`+L.map(l=>{const a=ecoArt(l.art);
      return `<div class="eco-lin ent" data-eflk="${l.id}"><input type="text" data-efl="a" list="ecoArtDL" value="${esc(a?ecoArtTxt(a):l.txt||"")}" placeholder="código, nome ou leitor" ${dis}><input type="text" inputmode="decimal" data-efl="q" value="${esc(l.q??"")}" placeholder="${a?esc(a.un||""):""}" ${dis}><input type="text" inputmode="decimal" data-efl="p" value="${esc(l.pu??"")}" placeholder="${a&&(a.pu0||ecoSt(a.id).ult)?esc(ecoN(a.pu0||ecoSt(a.id).ult)):"0,00"}" ${dis}>${ab?`<button class="b s" data-ecflx="${l.id}" title="Tirar esta linha" aria-label="Tirar">×</button>`:"<span></span>"}</div>`}).join("");tot()}
  function tot(){const t=box.querySelector("#ecfTot");if(!t||f.estado!=="porlancar"){if(t)t.textContent="";return}let n=0,v=0;
    box.querySelectorAll("[data-eflk]").forEach(r=>{const a=ecoArtDe(r.querySelector("[data-efl=a]").value),q=ecoNum(r.querySelector("[data-efl=q]").value);let p=ecoNum(r.querySelector("[data-efl=p]").value);if(!a||!(q>0))return;if(isNaN(p))p=+a.pu0||ecoSt(a.id).ult||0;n++;v+=q*p});
    const b=ecoNum((H("base")||{}).value);t.innerHTML=n?`${n} artigo${n===1?"":"s"} · ${ecoEur(v)} sem IVA${b>0&&Math.abs(b-v)>.05?` <span class="eco-ko">(a fatura diz ${ecoEur(b)})</span>`:""}`:""}
  box.addEventListener("input",e=>{if(e.target.closest("[data-eflk]")||e.target.dataset.ef==="base"){const r=e.target.closest("[data-eflk]");if(r&&e.target.dataset.efl==="a"){ler();const l=L.find(x=>x.id===r.dataset.eflk);if(l&&l.art){desenhar();const n=box.querySelector(`[data-eflk="${l.id}"] [data-efl=q]`);if(n)n.focus();return}}tot()}});
  box.addEventListener("change",e=>{const k=e.target.dataset.ef;
    if(k==="forn"){const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=!!e.target.value;const fo=ecoForn(e.target.value);if(fo&&fo.nif&&H("nif"))H("nif").value=fo.nif;
      const s=H("enc");if(s){const cur=s.value;s.innerHTML=ecoOpts(ecfEncsDe(e.target.value).map(x=>({v:x.id,t:x.n+" · "+(ecoFornNome(x.forn)||"sem fornecedor")})),cur,"Nenhuma")}}
    if(k==="nif"&&!H("forn").value){const fo=ecfFornPorNif(e.target.value);if(fo){H("forn").value=fo.id;const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=true}}
    if(k==="enc"&&e.target.value){const en=ECO.enc.find(x=>x.id===e.target.value);ler();
      if(en&&!L.some(l=>l.art)){L.length=0;(en.linhas||[]).forEach(l=>{const fl=(+l.q||0)-(+l.rec||0);if(l.art&&fl>0)L.push({id:uid(),art:l.art,q:ecoN(fl),pu:l.pu===""||l.pu==null?"":String(l.pu).replace(".",",")})});if(!L.length)L.push({id:uid(),art:"",q:"",pu:""});desenhar()}
      if(en&&en.forn&&!H("forn").value){H("forn").value=en.forn;const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=true}}});
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.efl){e.preventDefault();ler();const l=L[L.length-1];if(l&&l.art&&l.q){L.push({id:uid(),art:"",q:"",pu:""});desenhar();const i=[...box.querySelectorAll("[data-efl=a]")].pop();if(i)i.focus()}}});
  desenhar();ecfMiniaturas(f,box.querySelector("#ecfFich"));return box}
function ecfDepois(t){toast(t);if(curTab==="ecoFat")ecoFatUI();else if(curTab&&/^eco[A-Z]/.test(curTab))ecoRender(curTab)}
// grava o cabeçalho: cria o fornecedor novo (com o NIF) e avisa se a mesma fatura já está registada
function ecfGravarCab(f,semAviso){if(!ecoEd())return false;
  if(f.estado==="porlancar"&&!f.forn&&(f.fornNome||f.nif)){const ja=ecfFornPorNif(f.nif);
    if(ja)f.forn=ja.id;else if(f.fornNome){const fo={id:uid()+uid(),nome:f.fornNome,nif:f.nif||"",contacto:"",email:"",tel:"",cr:Date.now()};ECO.forn.push(fo);ecoGuardar(fo);f.forn=fo.id;toast("Fornecedor novo: "+fo.nome)}
    if(f.forn)f.fornNome=""}
  if(!semAviso&&f.n){const d=ECF.fat.find(x=>x!==f&&x.estado!=="anulada"&&x.n&&norm(x.n)===norm(f.n)&&((x.forn&&x.forn===f.forn)||(x.nif&&x.nif===f.nif)));
    if(d&&!f._dupOk){if(!confirm(`Já está registada uma fatura ${d.n} deste fornecedor (${d.data?calDMA(d.data):"sem data"}).\n\nGuardar esta também?`))return false;f._dupOk=1}}
  const o=Object.assign({},f);delete o._dupOk;Object.assign(f,o);ecfGuardar(f);return true}
function ecfLancar(f,bx){const msg=t=>{const el=bx.querySelector("#ecfMsg");if(el)el.innerHTML=t?`<div class="msg bad" style="margin:10px 0 0">${t}</div>`:""};
  if(f.tipo==="NC")return msg("Uma nota de crédito não entra no stock. Guarde-a ou marque «Sem artigos de stock»; se o material foi devolvido, registe um abate."),false;
  const ok=[],bad=[];for(const l of f.linhas||[]){const q=ecoNum(l.q),a=ecoArt(l.art);if(!a){if(String(l.txt||"").trim())bad.push(`«${esc(l.txt)}» não é um artigo do economato (crie-o em Artigos)`);continue}
    if(!(q>0)){bad.push(`falta a quantidade de ${esc(a.nome)}`);continue}let p=ecoNum(l.pu);if(isNaN(p))p=+a.pu0||ecoSt(a.id).ult||0;ok.push({a,q,pu:p})}
  if(bad.length)return msg(bad.join("<br>")),false;if(!ok.length)return msg("Indique os artigos que entram no stock (ou use «Sem artigos de stock»)."),false;
  const soma=ok.reduce((s,o)=>s+o.q*o.pu,0),b=+f.base||0;
  if(b>0&&Math.abs(b-soma)>.05&&!confirm(`A soma das linhas (${ecoEur(soma)}) não bate com o total sem IVA da fatura (${ecoEur(b)}).\n\nLançar mesmo assim?`))return false;
  const g=uid()+uid(),en=f.enc?ECO.enc.find(x=>x.id===f.enc):null,tx=f.tx===""||f.tx==null?ecoDef().iva:+f.tx;
  const novos=ok.map(o=>ecoMov({g,tipo:"ent",data:f.data||ecoHoje(),art:o.a.id,q:o.q,pu:o.pu,doc:f.n||"",forn:f.forn||"",iva:tx,fat:f.id,enc:en?en.id:"",obs:en?"Encomenda "+en.n:(f.n?"":"Fatura sem número")}));
  for(const o of ok)if(f.forn&&!o.a.forn){o.a.forn=f.forn;ecoGuardar(o.a)}
  if(en){for(const o of ok){const l=(en.linhas||[]).find(x=>x.art===o.a.id&&(+x.rec||0)<(+x.q||0))||(en.linhas||[]).find(x=>x.art===o.a.id);if(l)l.rec=(+l.rec||0)+o.q}
    en.estado=(en.linhas||[]).every(l=>!l.art||(+l.rec||0)>=(+l.q||0))?"recebida":"parcial";ecoGuardar(en)}
  novos.forEach(m=>ecoGuardar(m));f.g=g;f.estado="lancada";ecfGuardar(f);return true}
function ecfDeslancar(f){const M=ecfMovs(f).filter(m=>!m.anula&&!m.anulado),en=f.enc?ECO.enc.find(x=>x.id===f.enc):null;
  for(const m of M){ecoAnular(m);if(en){const l=(en.linhas||[]).find(x=>x.art===m.art&&(+x.rec||0)>0);if(l)l.rec=Math.max(0,(+l.rec||0)-(+m.q||0))}}
  if(en){const L=en.linhas||[];en.estado=L.every(l=>!(+l.rec>0))?"enviada":L.every(l=>!l.art||(+l.rec||0)>=(+l.q||0))?"recebida":"parcial";ecoGuardar(en)}
  f.estado="porlancar";f.g="";ecfGuardar(f)}
function ecfXls(L){ecoXls("Econo360 faturas",[["Faturas",L.map(f=>({"Data":f.data||"","Fornecedor":ecfNome(f),"NIF":f.nif||"","Tipo":ecfTipoN(f.tipo),"N.º":f.n||"","ATCUD":f.atcud||"",
  "Sem IVA":f.base===""||f.base==null?"":+f.base,"IVA":f.iva===""||f.iva==null?"":+f.iva,"Total":ecfTot(f),"Estado":(ECF_EST[f.estado]||{}).t||f.estado,"Encomenda":f.enc?((ECO.enc.find(e=>e.id===f.enc)||{}).n||""):"",
  "Ficheiros":(f.fich||[]).length,"Observações":f.obs||"","Registada por":f.por||""})),[12,30,12,18,18,18,12,12,12,20,14,10,30,26]]])}
// ===== src/js/econo/econo-movel.js =====
/* Econo360 — versão para telemóvel (0.9.160). Em ecrãs até 760 px (body.ecom, posto por show()):
   barra de baixo com Artigos · Faturas · [câmara] · Movimentos · Mais (abre o menu do módulo), listas em cartões,
   ficha do artigo em ecrã inteiro, janelas em ecrã inteiro e leitor de códigos de barras com a câmara.
   O resto da app não muda (por agora só o Econo360 tem versão própria para telemóvel). */
var ECO_MOB_MQ="(max-width:760px)";
function ecoMob(){try{return matchMedia(ECO_MOB_MQ).matches}catch(e){return false}}
function ecoMovel(t){const B=document.body;B.classList.toggle("ecoed",ecoEd());if(t!=="ecoInicio")B.classList.remove("ecofic");
  let b=document.getElementById("ecoBar");
  if(!b){b=document.createElement("nav");b.id="ecoBar";b.className="eco-bar";b.setAttribute("aria-label","Econo360");
    const I=(p)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
    b.innerHTML=`<button type="button" data-t="ecoInicio">${I('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>')}<span>Artigos</span></button>
      <button type="button" data-t="ecoFat">${I('<path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>')}<span>Faturas</span></button>
      <button type="button" class="eco-bcam" data-ecobcam aria-label="Fotografar fatura">${I('<path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>')}</button>
      <button type="button" data-t="ecoMovs">${I('<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>')}<span>Movimentos</span></button>
      <button type="button" data-ecobmais>${I('<path d="M4 7h16M4 12h16M4 17h16"/>')}<span>Mais</span></button>`;
    document.body.appendChild(b);
    b.addEventListener("click",e=>{const x=e.target.closest("button");if(!x)return;document.body.classList.remove("ecofic");
      if(x.dataset.t){show(x.dataset.t);window.scrollTo({top:0});return}
      if(x.matches("[data-ecobcam]")){ecfFotografar();return}
      if(x.matches("[data-ecobmais]")){const n=document.getElementById("navBtn");if(n)n.click()}});
    try{const mq=matchMedia(ECO_MOB_MQ),f=()=>{document.body.classList.remove("ecofic");if(curTab&&/^eco[A-Z]/.test(curTab))ecoRender(curTab)};mq.addEventListener?mq.addEventListener("change",f):mq.addListener(f)}catch(e){}}
  b.querySelectorAll("button[data-t]").forEach(x=>{x.classList.toggle("on",x.dataset.t===t);x.hidden=!podeVer(x.dataset.t)});}
function ecoFichaAbrir(){if(!ecoMob())return;document.body.classList.add("ecofic");const f=document.getElementById("ecoFicha");if(f)f.scrollTop=0}
// leitor de códigos com a câmara (BarcodeDetector; nos navegadores sem ele, só QR com o jsQR) — reutiliza o aspeto do leitor do Folder360
var ECO_SCAN=null;
async function ecoScan(cb){ecoScanFechar();const box=document.createElement("div");box.className="fd-scan";
  box.innerHTML=`<div class="fd-scard"><div class="fd-sv"><video playsinline muted></video><i class="fd-sframe"></i></div><div class="fd-sbar"><span id="ecoScanMsg">A abrir a câmara…</span><span class="grow"></span><button class="b s" data-x>Fechar</button></div></div>`;
  document.body.appendChild(box);box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-x]"))ecoScanFechar()});
  const msg=t=>{const m=document.getElementById("ecoScanMsg");if(m)m.textContent=t};const S=ECO_SCAN={box,stream:null,on:true,ult:"",ultT:0};
  try{S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280}},audio:false})}catch(e){msg("Não foi possível usar a câmara ("+(e.message||e.name)+"). Escreva o código na caixa «Procurar».");return}
  if(!S.on){S.stream.getTracks().forEach(t=>t.stop());return}
  const v=box.querySelector("video");v.srcObject=S.stream;await v.play().catch(()=>{});
  let det=null;try{if("BarcodeDetector" in window){const f=await BarcodeDetector.getSupportedFormats();const q=["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"].filter(x=>f.includes(x));if(q.length)det=new BarcodeDetector({formats:q})}}catch(e){det=null}
  if(!det){try{if(!window.jsQR)await loadScript("lib/jsQR.js")}catch(e){}}
  msg(det?"Aponte para o código de barras do artigo":"Este navegador só lê QR codes pela câmara — para códigos de barras, escreva o número");
  const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
  const passo=async()=>{if(!S.on)return;let txt="";
    try{if(v.readyState>=2){if(det){const r=await det.detect(v);if(r&&r.length)txt=r[0].rawValue}
      else if(window.jsQR){const w=Math.min(800,v.videoWidth),h=Math.round(v.videoHeight*w/v.videoWidth);cv.width=w;cv.height=h;cx.drawImage(v,0,0,w,h);const r=jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:"dontInvert"});if(r)txt=r.data}}}catch(e){}
    if(txt&&(txt!==S.ult||Date.now()-S.ultT>2500)){S.ult=txt;S.ultT=Date.now();const ok=cb(txt);msg((ok?"Lido: ":"Não há nenhum artigo com o código ")+txt);box.classList.remove("ok","ko");void box.offsetWidth;box.classList.add(ok?"ok":"ko");if(ok){setTimeout(ecoScanFechar,350);return}}
    setTimeout(passo,det?120:180)};passo()}
function ecoScanFechar(){const S=ECO_SCAN;ECO_SCAN=null;if(!S)return;S.on=false;try{S.stream&&S.stream.getTracks().forEach(t=>t.stop())}catch(e){}S.box.remove()}
function ecoScanArtigo(){ecoScan(txt=>{const q=String(txt||"").trim(),a=ECO.art.find(x=>(x.cb&&String(x.cb)===q)||(x.cod&&norm(x.cod)===norm(q)));if(!a)return false;ECO_UI.sel=a.id;ECO_UI.q="";ecoInicioUI();ecoFichaAbrir();return true})}
