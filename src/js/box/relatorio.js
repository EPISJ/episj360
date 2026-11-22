/* ---------- report ---------- */
{let h=null;["#fProf","#fShow","#fTxt","#chkFiles"].forEach(s=>$(s).addEventListener("input",()=>{REL_N=30;REL_L={};clearTimeout(h);h=setTimeout(renderReport,s==="#fTxt"?150:0)}))}
// 0.9.102: interruptor «Falso positivo em todas as linhas» (guardado neste navegador)
const fpTodos=()=>{const c=$("#chkFp");return!!(c&&c.checked)};
{const c=$("#chkFp");try{c.checked=localStorage.getItem("box_fp_todos")==="1"}catch(e){}
  c.addEventListener("change",()=>{try{localStorage.setItem("box_fp_todos",c.checked?"1":"0")}catch(e){};renderReport()})}
function fpBtns(i){const fl=(i.q||[]).filter(x=>x.q),mk=(i.q||[]).filter(x=>x.fp);let h="";
  if(i.fpi)h+=`<br><span class="hint" style="margin:0">Dado como entregue pela Direção (era: ${esc(i.fpi.era)})</span> <button class="b s fpb" data-on="0" data-k="${esc(JSON.stringify(["i:"+i.key]))}">Anular</button>`;
  else if(fpTodos()&&i.state!=="ok"&&!(fl.length&&(i.state==="warn"||i.state==="blank"||i.state==="modelo")))h+=`<br><button class="b s fpb" data-on="1" data-k="${esc(JSON.stringify(["i:"+i.key]))}" data-t="${esc(obsOf(i)||ESTADO[i.state])}">Falso positivo — conta como entregue</button>`;
  if(fl.length&&(i.state==="warn"||i.state==="blank"||i.state==="modelo"))h+=`<br><button class="b s fpb" data-on="1" data-k="${esc(JSON.stringify(fl.map(x=>fpKey(x.f))))}" data-t="${esc(fl.map(x=>x.f.name+": "+x.q.txt).join("; "))}">Falso positivo — conta como entregue</button>`;
  if(mk.length)h+=`<br><span class="hint" style="margin:0">Assinalado como falso positivo: ${esc(mk.map(x=>x.f.name+" ("+x.fp+")").join("; "))}</span> <button class="b s fpb" data-on="0" data-k="${esc(JSON.stringify(mk.map(x=>fpKey(x.f))))}">Anular</button>`;
  return h}
$("#report").addEventListener("click",e=>{const b=e.target.closest(".fpb");if(!b)return;marcarFP(JSON.parse(b.dataset.k),b.dataset.on==="1",b.dataset.t)});
/* 0.9.202: Relatório do Formador — uma vista própria (a da Direção fica igual): o que lhe falta entregar, por turma e módulo,
   a partir da análise da Box publicada pela Direção; pode ver só o que falta ou tudo, copiar e imprimir / guardar em PDF */
var RELM={so:"falta",q:""};
const RELM_EST={ok:["ok","entregue"],warn:["warn","entregue — a confirmar"],modelo:["warn","entregue — não segue o modelo"],blank:["bad","não conta (vazio ou falso)"],missing:["bad","em falta"]};
function relMeuDados(BM){const okS=s=>s==="ok"||s==="warn"||s==="modelo",q=norm(RELM.q||"");
  return BM.m.map(m=>({m,it:m.it.map(x=>({tipo:docNome(x[0]),st:x[1],pasta:x[2],d:x[3]})).filter(x=>(RELM.so!=="falta"||!okS(x.st))&&(!q||norm([m.tu,m.di,m.mo,x.tipo,x.pasta].join(" ")).includes(q)))})).filter(g=>g.it.length)
    .sort((a,b)=>COLL_PTN.compare(a.m.tu+" "+a.m.mo,b.m.tu+" "+b.m.mo))}
function relMeuTexto(BM){const L=relMeuDados(BM);return `DOCUMENTOS EM FALTA — ${(BM.me&&BM.me.nome)||""}\nAnálise: ${BM.nome||""}${BM.t?" ("+new Date(BM.t).toLocaleDateString("pt-PT")+")":""}\n${RELM.so==="falta"?"Só o que falta":"Todos os documentos"}\n\n`+
  L.map(g=>`${[g.m.tu,g.m.di,g.m.mo].filter(Boolean).join(" · ")}\n`+g.it.map(x=>`  [${(RELM_EST[x.st]||["",x.st])[1]}] ${[x.tipo,x.pasta].filter(Boolean).join(" › ")}${x.d?" — "+new Date(x.d+"T12:00").toLocaleDateString("pt-PT"):""}`).join("\n")).join("\n\n")}
/* 0.9.208: relatório de entregas para imprimir / guardar em PDF — A4, com os logótipos da escola e do ano letivo, resumo e
   uma tabela por turma e módulo com o estado de cada documento a cores */
function relMeuImprimir(BM){const w=window.open("","_blank");if(!w){toast("O navegador bloqueou a janela — permita janelas deste site");return}
  const abs=u=>new URL(u,location.href).href;let lm=null,lr=null,lf=null;try{lm=lgGet("main");lr=lgGet("right")}catch(e){}try{lf=lgFootBarra()}catch(e){}
  const PL=(PUB&&PUB.logos)||{},main=lm&&lm.src||PL.main&&PL.main.src||abs("img/logo-episj.png"),right=lr&&lr.src||PL.right&&PL.right.src||"",foot=lf&&lf.src||abs("img/fundos-2026-2027.png");
  const okS=s=>s==="ok"||s==="warn"||s==="modelo",it=BM.m.flatMap(m=>m.it),tot=it.length,ent=it.filter(x=>okS(x[1])).length,pct=tot?Math.round(ent*100/tot):0;
  const L=relMeuDados(BM),cor={ok:"#0f7b3f",warn:"#a15c00",modelo:"#a15c00",blank:"#b42318",missing:"#b42318"},fundo={ok:"#e6f4ea",warn:"#fff4e0",modelo:"#fff4e0",blank:"#fdecec",missing:"#fdecec"};
  const hoje=new Date().toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"}),nome=(BM.me&&BM.me.nome)||"";
  const caixa=(l,v,c)=>`<div class="bx"><small>${esc(l)}</small><b style="color:${c||"#1b2333"}">${v}</b></div>`;
  const nLin=L.reduce((a,g)=>a+g.it.length,0),compacto=nLin>25; // 0.9.210: com muitas linhas, uma só tabela compacta
  const tabelas=compacto?`<table class="cp"><thead><tr><th style="width:132px">Estado</th><th>Documento</th><th style="width:150px">Pasta</th><th style="width:88px">Entregue a</th></tr></thead><tbody>${L.map(g=>{const f=g.it.filter(x=>!okS(x.st)).length;
      return `<tr class="gh"><td colspan="4">${esc([g.m.tu,g.m.mo].filter(Boolean).join(" · "))}<span class="di">${esc(g.m.di||"")}</span><span class="pl" style="color:${f?"#b42318":"#0f7b3f"}">${f?f+" em falta":"completo"}</span></td></tr>`+g.it.map(x=>`<tr><td><span class="st" style="background:${fundo[x.st]||"#eef1f6"};color:${cor[x.st]||"#333"}">${esc((RELM_EST[x.st]||["",x.st])[1])}</span></td><td>${esc(x.tipo||"")}</td><td class="mu">${esc(x.pasta||"")}</td><td class="mu">${x.d?esc(new Date(x.d+"T12:00").toLocaleDateString("pt-PT")):"—"}</td></tr>`).join("")}).join("")}</tbody></table>`:L.length?"":`<p class="ok">${RELM.so==="falta"?"Não falta entregar nenhum documento nesta análise.":"Sem documentos."}</p>`;
  const tabelasN=compacto||!L.length?"":L.map(g=>{const f=g.it.filter(x=>!okS(x.st)).length;return `<section class="g"><h3>${esc([g.m.tu,g.m.mo].filter(Boolean).join(" · "))}<span class="di">${esc(g.m.di||"")}</span><span class="pl" style="background:${f?"#fdecec":"#e6f4ea"};color:${f?"#b42318":"#0f7b3f"}">${f?f+" em falta":"completo"}</span></h3>
    <table><thead><tr><th style="width:130px">Estado</th><th>Documento</th><th style="width:170px">Pasta</th><th style="width:90px">Entregue a</th></tr></thead><tbody>${g.it.map(x=>`<tr><td><span class="st" style="background:${fundo[x.st]||"#eef1f6"};color:${cor[x.st]||"#333"}">${esc((RELM_EST[x.st]||["",x.st])[1])}</span></td><td>${esc(x.tipo||"")}</td><td class="mu">${esc(x.pasta||"")}</td><td class="mu">${x.d?esc(new Date(x.d+"T12:00").toLocaleDateString("pt-PT")):"—"}</td></tr>`).join("")}</tbody></table></section>`}).join("");
  w.document.write(`<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><title>Documentos em falta — ${esc(nome)}</title><style>
    @page{size:A4;margin:14mm 12mm 16mm}*{box-sizing:border-box}body{font:11.5px/1.45 "Segoe UI",Helvetica,Arial,sans-serif;color:#1b2333;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    header{display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #163269;padding-bottom:10px;margin-bottom:14px}header img{max-height:52px;max-width:200px}
    .tit{text-align:center;flex:1}.tit h1{font-size:18px;margin:0;color:#163269}.tit div{font-size:12px;color:#4a5262;margin-top:2px}
    .meta{display:flex;flex-wrap:wrap;gap:6px 22px;font-size:12px;margin:0 0 12px}.meta b{color:#163269}
    .bxs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0 0 16px}.bx{border:1px solid #e3e7ee;border-radius:8px;padding:8px 10px}.bx small{display:block;font-size:10.5px;color:#6b7385}.bx b{font-size:18px}
    .barra{height:8px;border-radius:4px;background:#eef1f6;overflow:hidden;margin:-6px 0 16px}.barra i{display:block;height:100%;background:${pct===100?"#1f9d55":pct>=50?"#d99a18":"#d64545"}}
    section.g{break-inside:avoid;margin:0 0 14px}h3{font-size:13px;margin:0 0 6px;display:flex;align-items:center;gap:8px;color:#163269}h3 .di{font-weight:400;color:#6b7385;font-size:11.5px}h3 .pl{margin-left:auto;font-size:10.5px;border-radius:10px;padding:2px 9px}
    table{width:100%;border-collapse:collapse;table-layout:fixed}th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#6b7385;border-bottom:1px solid #d6dbe4;padding:4px 6px}td{border-bottom:1px solid #eef1f6;padding:5px 6px;vertical-align:top}td.mu{color:#4a5262}
    .st{display:inline-block;border-radius:10px;padding:1px 8px;font-size:10.5px;font-weight:600;white-space:nowrap}.ok{color:#0f7b3f;font-weight:600}
    footer{margin-top:18px;border-top:1px solid #e3e7ee;padding-top:10px;text-align:center}footer img{max-width:520px;max-height:56px}footer div{font-size:10px;color:#8a92a3;margin-top:6px}
    table.cp{font-size:10.5px}table.cp td{padding:2px 6px;line-height:1.3}table.cp .st{font-size:9.5px;padding:0 7px}
    table.cp tr.gh td{background:#f3f5f9;color:#163269;font-weight:700;font-size:11px;padding:4px 6px;border-top:6px solid #fff;break-after:avoid}table.cp tr.gh .di{font-weight:400;color:#6b7385;margin-left:8px}table.cp tr.gh .pl{float:right;font-weight:600;font-size:10px}
    table.cp tr{break-inside:avoid}
    @media screen{body{max-width:820px;margin:20px auto;padding:0 16px}}</style></head><body>
    <header><img src="${esc(main)}" alt=""><div class="tit"><h1>Documentos em falta</h1><div>Escola Profissional da Ilha de São Jorge</div></div>${right?`<img src="${esc(right)}" alt="">`:`<span style="width:120px"></span>`}</header>
    <div class="meta"><span>Formador: <b>${esc(nome)}</b></span><span>Análise da Box: <b>${esc(BM.nome||"")}</b>${BM.t?" ("+esc(new Date(BM.t).toLocaleDateString("pt-PT"))+")":""}</span><span>${RELM.so==="falta"?"Só os documentos em falta":"Todos os documentos"}</span><span>Emitido a ${esc(hoje)}</span></div>
    <div class="bxs">${caixa("Documentação entregue",pct+"%")}${caixa("Documentos em falta",tot-ent,tot-ent?"#b42318":"")}${caixa("Entregues",ent+" de "+tot)}${caixa("Módulos completos",BM.m.filter(m=>m.it.length&&m.it.every(x=>okS(x[1]))).length+" de "+BM.m.length)}</div>
    <div class="barra"><i style="width:${pct}%"></i></div>${tabelas}${tabelasN}
    <footer><img src="${esc(foot)}" alt=""><div>EPISJ 360 · Box360 — relatório gerado a partir da análise da Box feita pela Direção</div></footer>
    </body></html>`);w.document.close();w.focus();
  const imgs=[...w.document.images];Promise.all(imgs.map(i=>i.complete?1:new Promise(r=>{i.onload=i.onerror=r;setTimeout(r,2500)}))).then(()=>setTimeout(()=>{try{w.print()}catch(e){}},200))}
function renderRelMeu(BM){const sec=$("#rel");if(!sec)return;let box=$("#relMeu");
  if(!box){box=document.createElement("div");box.id="relMeu";sec.insertAdjacentElement("afterbegin",box);
    box.addEventListener("input",e=>{if(e.target.id==="rmQ"){RELM.q=e.target.value;relMeuLista()}});
    box.addEventListener("change",e=>{if(e.target.id==="rmSo"){RELM.so=e.target.value;relMeuLista()}});
    box.addEventListener("click",e=>{const b=e.target.closest("[data-rm]");if(!b)return;const BM2=boxMeu();if(!BM2||BM2.vazio)return;
      if(b.dataset.rm==="cp")copy(relMeuTexto(BM2));else relMeuImprimir(BM2)})}
  [...sec.querySelectorAll(".cols,.tiles,.card,.blk")].forEach(x=>{if(!x.contains(box)&&!box.contains(x))x.hidden=true});box.hidden=false;
  const SEL=boxSelHTML();
  if(BM.vazio||!(BM.m||[]).length){box.innerHTML=`<div class="card"><h2>Documentos em falta</h2>${SEL?`<div class="row">${SEL}</div>`:""}<p class="hint">Ainda não há dados seus publicados pela Direção (a Direção tem de analisar a Box e ter módulos atribuídos a si).</p></div>`;return}
  const okS=s=>s==="ok"||s==="warn"||s==="modelo",it=BM.m.flatMap(m=>m.it),tot=it.length,ent=it.filter(x=>okS(x[1])).length,nc=it.filter(x=>x[1]==="blank").length,conf=it.filter(x=>x[1]==="warn"||x[1]==="modelo").length;
  const st=(l,v,c)=>`<div class="ay-st"><small>${esc(l)}</small><b${c?` style="color:${c}"`:""}>${v}</b></div>`;
  box.innerHTML=`<div class="card"><h2>Documentos em falta</h2><p class="hint">Os documentos dos módulos atribuídos a si, ${esc(BM.nome?"na análise «"+BM.nome+"»":"")}${BM.t?" de "+new Date(BM.t).toLocaleDateString("pt-PT"):""}. Atualizado quando a Direção analisa a Box.</p>
    <div class="ay-stats" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:8px 0 12px">${st("documentação entregue",(tot?Math.round(ent*100/tot):0)+"%")}${st("em falta",tot-ent,tot-ent?"var(--bad)":"")}${st("entregues (de "+tot+")",ent)}${st("a confirmar",conf,conf?"#b45309":"")}${st("não contam (vazios/falsos)",nc,nc?"var(--bad)":"")}</div>
    <div class="row" style="align-items:flex-end">${SEL}<label style="width:200px">Mostrar<select id="rmSo"><option value="falta"${RELM.so==="falta"?" selected":""}>Só o que falta</option><option value="tudo"${RELM.so!=="falta"?" selected":""}>Todos os documentos</option></select></label>
      <label class="grow">Procurar<input type="text" id="rmQ" value="${esc(RELM.q)}" placeholder="turma, módulo ou documento"></label><button class="b s" data-rm="cp" type="button">Copiar</button><button class="b s" data-rm="pdf" type="button">Imprimir / guardar PDF</button></div></div>
    <div id="rmLista"></div>`;relMeuLista()}
function relMeuLista(){const el=$("#rmLista"),BM=boxMeu();if(!el||!BM||BM.vazio)return;const L=relMeuDados(BM);
  el.innerHTML=L.length?L.map(g=>{const f=g.it.filter(x=>!(x.st==="ok"||x.st==="warn"||x.st==="modelo")).length;
    return `<div class="card rm-g"><h3>${esc([g.m.tu,g.m.mo].filter(Boolean).join(" · "))}${g.m.di?` <span class="hint" style="font-weight:400">· ${esc(g.m.di)}</span>`:""}${f?` <span class="tag bad">${f} em falta</span>`:` <span class="tag ok">completo</span>`}</h3>${g.it.map(x=>{const [cl,tx]=RELM_EST[x.st]||["",x.st];return `<div class="mit"><span class="tag ${cl}" style="flex:none">${esc(tx)}</span><div><div>${esc(x.tipo||x.pasta||"")}</div>${x.pasta&&x.pasta!==x.tipo?`<div class="hint" style="margin:0">${esc(x.pasta)}</div>`:""}${x.d?`<div class="hint" style="margin:0">entregue a ${esc(new Date(x.d+"T12:00").toLocaleDateString("pt-PT"))}</div>`:""}</div></div>`}).join("")}</div>`}).join("")
    :`<div class="card"><p class="msg ok" style="margin:0">${RELM.so==="falta"?"Não lhe falta entregar nada nesta análise.":"Nada encontrado."}</p></div>`}
function renderReport(){{let BM=null;try{BM=boxMeu()}catch(e){}if(BM){renderRelMeu(BM);return}const m=$("#relMeu");if(m){m.hidden=true;[...$("#rel").querySelectorAll(".cols,.tiles,.card,.blk")].forEach(x=>{if(!m.contains(x))x.hidden=false})}}
  const ev=evaluate(),T=byTeacher(ev);
  const fp=$("#fProf").value;
  $("#fProf").innerHTML=`<option value="">Todos</option>`+T.slice().sort((a,b)=>cmpProf(a.p,b.p)).map(t=>`<option value="${t.p.id}" ${t.p.id===fp?"selected":""}>${esc(profRot(t.p))}</option>`).join("");
  const tot=T.reduce((a,t)=>a+t.tot,0),ok=T.reduce((a,t)=>a+t.ok,0),profsMiss=T.filter(t=>t.miss>0&&t.p.id!=="_").length;
  const all=ev.flatMap(e=>e.items);
  const nBlank=all.filter(i=>i.state==="blank").length,nWarn=all.filter(i=>i.state==="warn").length,nSince=all.filter(i=>i.since).length,nMod=all.filter(i=>i.state==="modelo").length;
  const ref=lastEnvio();
  const pct=tot?Math.round(ok/tot*100):0;
  $("#tiles").innerHTML=`
   <div class="tile"><div class="v">${pct}%</div><div class="l">documentação entregue</div></div>
   <div class="tile"><div class="v" style="color:var(--bad)">${tot-ok}</div><div class="l">itens em falta</div></div>
   <div class="tile"><div class="v">${profsMiss}</div><div class="l">formadores com falhas</div></div>
   ${ref?`<div class="tile"><div class="v" style="color:var(--ok)">${nSince}</div><div class="l">entregues desde o envio de ${dataPT(ref.t)}</div></div>`:""}
   ${nMod?`<div class="tile"><div class="v" style="color:var(--bad)">${nMod}</div><div class="l">não seguem o modelo oficial</div></div>`:""}
   <div class="tile"><div class="v" style="color:#b26a00">${nBlank+nWarn}</div><div class="l">em branco (${nBlank}) ou a confirmar (${nWarn})</div></div>`;countUp($("#tiles"));
  const w=[];
  if(!files.length)w.push(["info","Ainda não carregou a listagem da Box (em Análise). Sem ela, tudo aparece em falta."]);
  const atv=ativos(),noprof=atv.filter(m=>!profOf(m)).length;if(noprof)w.push(["warn",`${noprof} módulo(s) sem formador atribuído — veja a grelha em Atribuições.`]);
  const outros=cfg.mods.length-atv.length;if(outros&&files.length)w.push(["info",`${outros} módulo(s) de outros anos letivos não entram neste relatório (só contam os do ano da análise carregada).`]);
  const pend=porLer().length;if(pend)w.push(["info",`Falta ler o conteúdo de ${pend} documento(s)${bgOn?" — a leitura está a correr em segundo plano e o relatório atualiza-se sozinho":SES?" — clique em “Ler os documentos agora”":" — entre na Box para os ler"}. Até lá, esses documentos contam como entregues.`]);
  const nfp=Object.keys(cfg.fp||{}).length;if(nfp)w.push(["info",`${nfp} documento(s) ou linha(s) assinalados como falso positivo contam como entregues. Para anular, mostre “Tudo” e carregue em “Anular” na linha. Se o formador substituir o ficheiro, a verificação volta a ser feita.`]);
  $("#warns").innerHTML=w.map(([k,t])=>`<div class="msg ${k==="warn"?"bad":"info"}">${esc(t)}</div>`).join("");
  const mode=$("#fShow").value,q=norm($("#fTxt").value),sf=$("#chkFiles").checked;
  const show=i=>mode==="tudo"||(mode==="desde"?i.since:(!i.ok||(mode==="aviso"&&(i.state==="warn"||i.state==="modelo"))));
  REL_N=REL_N||30;REL_L=REL_L||{};let html="",nVis=0,nTot=0; // 0.9.50: com 1000 formadores, 30 de cada vez (eram 111 000 elementos e 2 s)
  for(const t of T){ if(fp&&t.p.id!==fp)continue;
    const rows=rowsFor(t,false).filter(r=>show(r.item)&&(!q||norm(r.turma+" "+r.disc+" "+r.mod+" "+r.loc).includes(q)));
    if(!rows.length)continue;nTot++;if(nVis>=REL_N)continue;nVis++;
    const lim=REL_L[t.p.id]||150,resto=rows.length-lim;if(resto>0)rows.length=lim; // e no máximo 150 linhas por formador de cada vez (o grupo "sem formador" pode ter milhares)
    const pc=t.tot?Math.round(t.ok/t.tot*100):100;
    html+=`<div class="prof"><div class="hd"><b>${esc(t.p.nome)}</b>${t.p.cod?`<span class="tag" style="background:#eef1f5;color:#4a5260">${esc(t.p.cod)}</span>`:""}<span class="hint" style="margin:0">${esc(t.p.email)}</span><span class="grow"></span>
      <div class="bar"><i style="width:${pc}%"></i></div><span>${t.ok}/${t.tot}</span>
      ${t.miss?`<span class="tag bad">${t.miss} em falta</span>`:`<span class="tag ok">completo</span>`}${t.miss&&t.p.id!=="_"?`<button class="b s pdfb" data-rpdf="${t.p.id}" title="Exportar em PDF o que este formador tem em falta">PDF</button>`:""}</div>
      <div style="padding:4px 12px 10px;overflow-x:auto"><table class="rtab rt"><thead><tr><th>Turma</th><th>Disciplina</th><th>Módulo/UFCD</th><th>Localização na Box</th><th>O que está em falta</th><th>Observações</th></tr></thead><tbody>
      ${rows.map(r=>`<tr class="s-${r.state}"><td>${esc(r.turma)}</td><td>${esc(r.disc)}</td><td>${esc(r.mod)}</td><td>${esc(r.loc)}</td><td class="f">${{ok:"✓",warn:ico("alert"),modelo:ico("alert"),blank:"✗",missing:"✗"}[r.state]} <span title="${esc(r.falta)}">${esc(faltaDesc(r))}</span></td><td class="o">${esc(r.obs||(r.state==="ok"?"entregue":""))}${sf&&r.item.hits.length?`<br><b>Ficheiros:</b> ${r.item.hits.map(h=>esc(h.name)).join(", ")}`:""}${fpBtns(r.item)}</td></tr>`).join("")}
      </tbody></table>${resto>0?`<div style="text-align:center;margin:8px 0 2px"><button class="b s" data-relmais="${esc(t.p.id)}" type="button">Mostrar mais ${Math.min(500,resto)} linhas (faltam ${resto})</button></div>`:""}</div></div>`;}
  if(nTot>nVis)html+=`<div style="text-align:center;margin:6px 0 18px"><button class="b s" id="relMais" type="button">Mostrar mais ${Math.min(30,nTot-nVis)} formadores (faltam ${nTot-nVis})</button></div>`;
  $("#report").innerHTML=html||`<div class="card"><p class="hint" style="margin:0">${ativos().length?"Nada a mostrar com estes filtros.":"Defina primeiro os módulos em Atribuições."}</p></div>`;
  const bm=$("#relMais");if(bm)bm.onclick=()=>{REL_N+=30;renderReport()};
  $("#report").querySelectorAll("[data-relmais]").forEach(b=>b.onclick=()=>{const k=b.dataset.relmais;REL_L[k]=(REL_L[k]||150)+500;renderReport()});
}
var REL_N=30,REL_L={};

/* ---------- opções das verificações ---------- */
function qualInit(){
  cfg.qual=cfg.qual||{min:40,dup:true};
  $("#qMin").value=cfg.qual.min||40;$("#qInicio").value=cfg.qual.inicio||"";
  document.querySelectorAll("#qChecks [data-q]").forEach(c=>{c.checked=qOn(c.dataset.q);c.parentElement.classList.toggle("on",c.checked)});
  const cur=lastListing&&lastListing.rootId,r=resumos();
  $("#qRef").innerHTML=`<option value="">— nenhum —</option>`+Object.keys(r).filter(id=>id!==cur).map(id=>`<option value="${esc(id)}" ${cfg.qual.refRoot===id?"selected":""}>${esc(r[id].pasta)} (analisada a ${esc(r[id].quando)})</option>`).join("");
  const idx=getIdx();$("#qInicio").placeholder=idx.anos.size===1?[...idx.anos.keys()][0].slice(0,4)+"-07-01":"AAAA-MM-DD";
}
$("#qMin").addEventListener("change",e=>{cfg.qual.min=Math.max(1,+e.target.value||40);save();renderReport()});
$("#qInicio").addEventListener("change",e=>{const v=e.target.value.trim();if(v&&!/^\d{4}-\d\d-\d\d$/.test(v)){toast("Escreva a data como AAAA-MM-DD");return}cfg.qual.inicio=v;save();renderReport()});
$("#qChecks").addEventListener("change",e=>{const k=e.target.dataset.q;if(!k)return;cfg.qual[k]=e.target.checked;e.target.parentElement.classList.toggle("on",e.target.checked);save();renderReport()});
$("#qRef").addEventListener("change",async e=>{cfg.qual.refRoot=e.target.value;save();await carregarRef();renderReport()});

/* ---------- leitura do texto dos documentos (só leitura) ---------- */
// pedido de leitura a um endereço da Box (API ou servidor de conteúdos), só GET
async function boxRaw(url,hints,asText){
  const h=new URL(url).hostname;if(!/(^|\.)box\.com$|(^|\.)boxcloud\.com$/.test(h))throw new Error("endereço inesperado");
  const api=/(^|\.)api\.box\.com$/.test(h);
  for(let t=0;t<6;t++){if(api)await vez();else await vezConteudo();const tok=await accessToken();const H={Authorization:"Bearer "+tok};if(hints)H["x-rep-hints"]=hints;
    let r;buConta(api?"tx":"dl");try{r=await fetch(url,{method:"GET",headers:H})}catch(e){if(api)travar(1500*(t+1));else await sleep(1500*(t+1));if(t<3)continue;throw new Error("rede")}
    if(r.status===202){await sleep(1500);continue}
    if(r.status===429){travar(esperaBox(r));continue}
    if(r.status>=500){await sleep(800*2**t);continue}
    if(r.status===401&&SES&&SES.mode==="oauth"&&t===0){await accessToken(true);continue}
    if(!r.ok){const er=new Error("Box "+r.status);er.status=r.status;throw er}
    if(api)RATE.ok++;
    return asText===2?r.arrayBuffer():asText?r.text():r.json()} // 0.9.105: 2 = ficheiro (PDF de pré-visualização)
  throw new Error("Box ocupada");
}
// texto de um ficheiro, extraído pela própria Box: devolve {txt} ou {err}
// 0.9.113: no máximo 1 pedido à API por documento (0 se a listagem das pastas já trouxe o endereço do texto). Se a Box ainda não
// tiver o texto pronto, não se volta a perguntar logo (antes eram até 11 perguntas seguidas): fica para uma próxima passagem.
async function textoDe(fid,sha1){
  const r0=REP.get(String(fid));
  if(r0&&r0.ok&&(!sha1||!r0.sha1||r0.sha1===sha1)){try{return{txt:await boxRaw(r0.url,null,true)}}catch(e){if(e.kind==="auth")throw e;REP.delete(String(fid))}}
  const info=await boxRaw(`https://api.box.com/2.0/files/${fid}?fields=representations`,"[extracted_text]");
  const rep=((info.representations||{}).entries||[]).find(x=>x.representation==="extracted_text");
  if(!rep)return{err:"sem texto disponível para este tipo",fim:true};
  const st=rep.status&&rep.status.state;
  if(st==="error")return{err:"a Box não conseguiu ler o texto",fim:true};
  if(st&&st!=="success"&&st!=="viewable"){
    if(st==="none"&&rep.info&&rep.info.url){try{await boxRaw(rep.info.url)}catch(e){if(e.kind==="auth")throw e}} // pede à Box que prepare o texto (1 pedido, só uma vez)
    return{err:"texto ainda não disponível",pend:true}}
  return{txt:await boxRaw(rep.content.url_template.replace("{+asset_path}",""),null,true)};
}
/* 0.9.113: documentos cujo texto ainda não se conseguiu ler — esperam cada vez mais antes de nova tentativa
   (15 min → 2 h → 1 dia → 7 dias; à 5.ª fica «sem texto»). Antes eram tentados outra vez sempre que a app abria. */
var TXF=(function(){try{return JSON.parse(localStorage.getItem("g360_txf")||"{}")||{}}catch(e){return{}}})();
var TXF_ESP=[15*60e3,2*3600e3,864e5,7*864e5];
function txfEspera(sha1){const f=TXF[sha1];return!!(f&&Date.now()<f.prox)}
function txfGuardar(){try{const k=Object.keys(TXF);if(k.length>6000)for(const x of k.sort((a,b)=>TXF[a].prox-TXF[b].prox).slice(0,k.length-6000))delete TXF[x];localStorage.setItem("g360_txf",JSON.stringify(TXF))}catch(e){}}
async function txfFalhou(sha1){const f=TXF[sha1]||{n:0};f.n++;if(f.n>TXF_ESP.length){delete TXF[sha1];txfGuardar();await guardarSemTexto(sha1);return}
  f.prox=Date.now()+TXF_ESP[f.n-1];TXF[sha1]=f;txfGuardar()}
const TEXT_EXT=/\.(pdf|docx?|odt|rtf|pptx?|odp|xlsx?|ods|txt)$/i;
const precisaLer=f=>!!(f&&f.fid&&f.sha1&&TEXT_EXT.test(f.name||f.n||"")&&f.size!==0&&!TX.has(f.sha1)&&!txfEspera(f.sha1));
// lê o texto de uma lista de ficheiros {fid, sha1, name, size} e guarda-o (por impressão digital) neste navegador
async function checkFiles(list,onProg,cancel,conc){
  let done=0,err=0,idx=0;
  // 0.9.113: com 2 ou mais documentos por ler na mesma pasta, abre-se a pasta uma vez (1 pedido) e a listagem traz o endereço
  // do texto de todos eles — em vez de 1 pedido por documento
  if(!REP_OFF){const G=new Map();for(const f of list)if(f.pid&&!REP.has(String(f.fid))){const g=G.get(f.pid)||0;G.set(f.pid,g+1)}
    const pastas=[...G].filter(([,n])=>n>=2).map(([pid])=>pid);
    await pool(pastas,async pid=>{if(!SES||(cancel&&cancel())||REP_OFF)return;try{await listFolder(pid)}catch(e){if(e.kind==="auth")throw e}},2)}
  const worker=async()=>{while(idx<list.length&&SES&&!(cancel&&cancel())){
    if(cancel&&document.visibilityState==="hidden"){await sleep(3000);continue} // 0.9.70: leitura de fundo pára com a janela escondida
    const f=list[idx++];
    try{if(!TX.has(f.sha1)){const r=await textoDe(f.fid,f.sha1);if(r.txt!=null){await guardarTexto(f.sha1,r.txt);if(TXF[f.sha1]){delete TXF[f.sha1];txfGuardar()}}
        else{err++;if(r.fim)await guardarSemTexto(f.sha1);else await txfFalhou(f.sha1)}}}
    catch(e){if(e.kind==="auth")throw e;err++;
      if(e.status===403||e.status===404)await guardarSemTexto(f.sha1);else await txfFalhou(f.sha1)}
    done++;onProg&&onProg(done,list.length)}};
  await Promise.all(Array.from({length:Math.min(conc||3,list.length)},worker));
  return{done,err};
}
function porLer(){const todo=new Map();for(const e of evaluate())for(const i of e.items)for(const f of i.hits)if(precisaLer(f))todo.set(f.sha1,f);return[...todo.values()]}
// verificação em segundo plano: a app continua utilizável e o relatório atualiza-se no fim
let bgRun=0,bgOn=false;
function verificarFundo(){if(!SES||bgOn||buTravado())return;return boxLer("texto",verificarFundo0,false)} // 0.9.113: parada com 80% dos pedidos do mês gastos // 0.9.86: a leitura de fundo corre só numa janela
async function verificarFundo0(){
  if(!SES||bgOn)return;const list=porLer(),el=$("#bg")||$("#bgp")||document.createElement("span");if(!list.length){el.style.display="none";return}
  if(!(await trincoNuvem("box-texto",900)))return; // 0.9.113: outro computador já está a ler o texto (chega pela nuvem) // 0.9.101: também os cabeçalhos dos modelos oficiais // 0.9.50: o indicador chama-se #bgp
  const my=++bgRun;bgOn=true;el.style.display="";let last=0;
  let trinco=Date.now();
  try{const r=await checkFiles(list,(d,n)=>{el.textContent=`a ler documentos ${d}/${n}`;
      if(Date.now()-trinco>5*60e3){trinco=Date.now();trincoNuvem("box-texto",900)}
      if(Date.now()-last>15000){last=Date.now();if(curTab==="rel")renderReport();if(curTab==="alt")renderAlt()}},()=>my!==bgRun||buTravado(),2);
    el.textContent=`${r.done-r.err} documentos lidos`;setTimeout(()=>{if(!bgOn)el.style.display="none"},6000)}
  catch(e){el.textContent="leitura interrompida"}
  bgOn=false;nuvemTextosJa();try{guidePubAgendar()}catch(e){} /* 0.9.194: pastas e estatísticas dos formadores */if(curTab==="rel")renderReport();if(curTab==="alt")renderAlt();
}
$("#qGo").onclick=async()=>{
  if(!SES){toast("Entre primeiro na Box");return}
  if(!files.some(f=>f.fid)){$("#qMsg").textContent="Faça primeiro uma análise no separador Análise.";return}
  bgRun++;const list=porLer();
  if(!list.length){$("#qMsg").textContent="Todos os documentos já foram lidos.";renderReport();return}
  if(buTravado()&&!confirm(`Já se gastaram ${buN(buTotal())} dos ${buN(BU_ORC)} pedidos à Box deste mês. Ler ${buN(list.length)} documento(s) gasta até ${buN(list.length)} pedidos. Continuar?`))return;
  const b=$("#qGo");b.disabled=true;$("#qProg").style.display="block";$("#qProg i").style.width="2%";const t0=Date.now();
  try{const r=await checkFiles(list,(d,n)=>{$("#qMsg").textContent=`A ler o texto… ${d}/${n}`;$("#qProg i").style.width=Math.max(2,Math.round(d/n*100))+"%"});
    $("#qMsg").textContent=`Concluído em ${Math.round((Date.now()-t0)/1000)} s: ${r.done-r.err} documento(s) lidos${r.err?`, ${r.err} sem texto disponível (não foram avaliados)`:""}.`}
  catch(e){$("#qMsg").textContent="Erro: "+e.message}
  b.disabled=false;setTimeout(()=>{$("#qProg").style.display="none"},800);
  renderReport();
};

/* 0.9.113: a zona «Modelos oficiais» do Box360 foi retirada (gastava muitos pedidos à Box). Os dados guardados (cfg.mo) ficam. */
function moAtivo(){return false}
function moModelos(){return[]}

/* ---------- send ---------- */
const anoLetivo=()=>cfg.mail.ano||(()=>{try{return anoAtivo().nome}catch(e){return""}})()||(()=>{const a=[...getIdx().anos.keys()];return a.length===1?a[0]:"[ano letivo]"})();
function listText(t){return rowsFor(t,true).map(r=>`• ${r.turma} | ${discShort(r.disc)} | ${r.mod} → ${faltaDesc(r)}${r.loc?` (${r.loc})`:""}${r.state==="missing"?" — "+(r.item.pastaObs||"pasta vazia"):r.state==="blank"?" — os ficheiros desta pasta não contam: "+motivoBad(r.item):""}`).join("\n")}
function fill(tpl,t,semLista){
  const first=String(t.p.nome||"").trim().split(/\s+/)[0]||"";
  let s=tpl.replace(/\{primeiro_nome\}/g,first).replace(/\{nome\}/g,t.p.nome).replace(/\{ano\}/g,anoLetivo()).replace(/\{prazo\}/g,cfg.mail.prazo||"[prazo]").replace(/\{total\}/g,t.miss);
  s=semLista?s.replace(/[^\n]*\{lista\}[^\n]*\n?/g,"").replace(/\(\d+ item\(ns\)\):/,"(lista em anexo).").replace(/\n{3,}/g,"\n\n"):s.replace(/\{lista\}/g,listText(t));
  return s;}
const subj=t=>fill(cfg.mail.subj,t);
function geralText(){
  const T=byTeacher(evaluate());const d=new Date().toLocaleDateString("pt-PT");
  let s=`RELATÓRIO DE DOCUMENTAÇÃO NÃO ENTREGUE — Ano letivo ${anoLetivo()} — ${d}\n`;
  const tot=T.reduce((a,t)=>a+t.tot,0),ok=T.reduce((a,t)=>a+t.ok,0);
  s+=`Entregue: ${ok}/${tot} (${tot?Math.round(ok/tot*100):0}%) · Em falta: ${tot-ok}\n\n`;
  for(const t of T){if(!t.miss)continue;s+=`${t.p.nome}${t.p.email?" <"+t.p.email+">":""} — ${t.miss} em falta\n${listText(t)}\n\n`}
  const done=T.filter(t=>!t.miss&&t.tot);if(done.length)s+=`Com tudo entregue: ${done.map(t=>t.p.nome).join(", ")}\n`;
  const conf=[];for(const t of T)for(const e of t.list)for(const i of e.items)if(i.state==="warn")conf.push(`• ${t.p.nome} — ${modLabel(e.mod)}: ${itemNome(i)} (${i.reasons.join("; ")})`);
  if(conf.length)s+=`\nA CONFIRMAR (${conf.length}):\n${conf.join("\n")}\n`;
  const nmo=[];for(const t of T)for(const e of t.list)for(const i of e.items)if(i.state==="modelo")nmo.push(`• ${t.p.nome} — ${modLabel(e.mod)}: ${itemNome(i)} (${i.reasons.join("; ")})`); // 0.9.106
  if(nmo.length)s+=`\nNÃO SEGUEM O MODELO OFICIAL (${nmo.length}):\n${nmo.join("\n")}\n`;
  return s;
}
function geralCSV(){
  const T=byTeacher(evaluate());const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const rows=[["Código","Formador","Email","Turma","Disciplina","Módulo/UFCD","Localização na Box","Documento","Estado","Observações"]];
  for(const t of T)for(const r of rowsFor(t,false))rows.push([t.p.cod||"",t.p.nome,t.p.email,r.turma,r.disc,r.mod,r.loc,r.falta,ESTADO[r.state],r.obs]);
  return rows.map(r=>r.map(q).join(";")).join("\n");
}
{const redes=debounce(()=>{save();renderMails();geralPrevUI()},300); // 0.9.86: com muitos formadores, só redesenha quando se pára de escrever
[["#mSubj","subj"],["#mPrazo","prazo"],["#mAno","ano"],["#mBody","body"]].forEach(([s,k])=>$(s).addEventListener("input",e=>{cfg.mail[k]=e.target.value;redes()}))}
$("#mReset").onclick=()=>{cfg.mail.subj=MAIL_SUBJ;cfg.mail.body=MAIL_BODY;save();renderSend();toast("Texto EPISJ reposto (pode anular)")};
function renderSend(){MAIL_N=30;$("#mSubj").value=cfg.mail.subj;$("#mPrazo").value=cfg.mail.prazo||"";$("#mAno").value=cfg.mail.ano||"";$("#mAno").placeholder=anoLetivo();$("#mBody").value=cfg.mail.body;$("#gTo").value=cfg.mail.relatorio_para||"";geralPrevUI();renderMails();renderEnvios()}
let mailCache=[];
// 0.9.86: a pré-visualização do resumo geral mostra só o princípio (o texto inteiro é o que se copia e envia)
function geralPrevUI(){const g=geralText(),L=g.split("\n");$("#geralPrev").textContent=L.length>300?L.slice(0,300).join("\n")+`\n\n… e mais ${L.length-300} linhas (o resumo completo vai no email e na cópia).`:g}
function renderMails(){
  const all=byTeacher(evaluate()).filter(t=>t.miss&&t.p.id!=="_"),sel=$("#mProf"),v=sel.value;
  sel.innerHTML=`<option value="">Todos os formadores com documentos em falta (${all.length})</option>`+all.slice().sort((a,b)=>cmpProf(a.p,b.p)).map(t=>`<option value="${t.p.id}">${esc(profRot(t.p))} — ${t.miss} em falta</option>`).join("");
  sel.value=all.some(t=>t.p.id===v)?v:"";
  const T=sel.value?all.filter(t=>t.p.id===sel.value):all;mailCache=T;
  const ne=T.filter(t=>t.p.email).length;$("#sendAll").textContent=ENVIO_A?"Parar o envio":sel.value?"Enviar a este formador com PDF":`Enviar a todos com PDF (${ne})`;$("#sendAll").disabled=!ne&&!ENVIO_A;
  MAIL_N=MAIL_N||30;const resto=T.length-MAIL_N; // 0.9.50: com muitos formadores, 30 mensagens de cada vez no ecrã (o envio "a todos" continua a ser para todos)
  $("#mails").innerHTML=`<p class="hint" id="msWho"></p>`+(T.slice(0,MAIL_N).map((t,i)=>{const body=fill(cfg.mail.body,t);
    let mb=fill(cfg.mail.body,t,true);
    const href=`mailto:${encodeURIComponent(t.p.email)}?subject=${encodeURIComponent(subj(t))}&body=${encodeURIComponent(mb)}`,ok=ENV_OK[t.p.id];
    return `<div class="prof"><div class="hd"><b>${esc(t.p.nome)}</b><span>${esc(t.p.email||"(sem email)")}</span><span class="grow"></span>${ok?`<span class="tag ok">✓ enviado às ${new Date(ok).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})}</span>`:""}<span class="tag bad">${t.miss} em falta</span>
     ${waTelProf(t.p)?`<button class="b s" data-wa="${i}" title="WhatsApp para ${esc(waTelVer(waTelProf(t.p)))}">WhatsApp</button>`:""}${waUltimo("box",t.p.id)?`<span class="tag" title="Aberto no WhatsApp">WhatsApp ${new Date(waUltimo("box",t.p.id)).toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"})}</span>`:""}<button class="b s" data-cp="${i}">Copiar mensagem</button><button class="b s" data-pdf="${i}">PDF</button>${t.p.email?`<a class="b s" style="text-decoration:none" data-mt="${i}" href="${href}">Abrir no email</a><button class="b" data-send="${i}">Enviar com PDF</button>`:""}</div>
     <div class="mailbox" style="margin:10px 14px 14px;max-height:260px;overflow:auto">${esc(msCfg().lista?body:mb)}</div></div>`}).join("")+(resto>0?`<div style="text-align:center;margin:6px 0 14px"><button class="b s" id="mailMais" type="button">Mostrar mais ${Math.min(30,resto)} mensagens (faltam ${resto})</button></div>`:"")||`<p class="hint">Nenhum formador com documentação em falta.</p>`);
  const bm=$("#mailMais");if(bm)bm.onclick=()=>{MAIL_N+=30;renderMails()};
  {const bw=$("#waAll"),nw=T.filter(t=>waTelProf(t.p)).length;if(bw){bw.textContent=nw?`WhatsApp um a um (${nw})`:"WhatsApp um a um";bw.title=nw?"Abre o WhatsApp com a mensagem de cada formador já escrita (gratuito)":"Escreva os telemóveis em Escola360 › Formadores"}}
  if(!H3&&!renderMails.wa){renderMails.wa=1;waPronto().then(()=>{if(curTab==="env")renderMails()})} // 0.9.170: telemóveis (peça H3)
  msUI(true);
}
var MAIL_N=30; // var: sem TDZ se a página for desenhada antes desta linha
/* 0.9.170: documentos em falta por WhatsApp (gratuito, um clique por formador) — texto curto, com a lista resumida */
function boxWaTxt(t){const R=rowsFor(t,true),max=12,L=R.slice(0,max).map(r=>`• ${r.turma} · ${discShort(r.disc)} · ${r.mod} — ${faltaDesc(r)}`);
  return `Olá ${waPrimeiro(t.p.nome)},\n\nNa Box ainda falta${t.miss===1?"":"m"} ${t.miss} documento${t.miss===1?"":"s"} do ano letivo ${anoLetivo()}${cfg.mail.prazo?` (prazo: ${cfg.mail.prazo})`:""}:\n\n${L.join("\n")}${R.length>max?`\n… e mais ${R.length-max} (a lista completa segue por email).`:""}\n\nObrigado,\nDireção Pedagógica — EPISJ`}
function boxWaFila(T){waFila(T.map(t=>({id:t.p.id,nome:t.p.nome,tel:waTelProf(t.p),txt:boxWaTxt(t)})),{titulo:"Documentos em falta — WhatsApp",onFeito:x=>waRegistar("box",x.id,x.nome),fim:n=>{if(n)renderMails()}})}
$("#waAll").onclick=async()=>{await waPronto();const T=mailCache.filter(t=>t.miss);if(!T.length){toast("Nenhum formador com documentação em falta");return}boxWaFila(T)};
$("#mails").addEventListener("click",async e=>{const bw=e.target.closest("[data-wa]");if(bw){boxWaFila([mailCache[+bw.dataset.wa]]);return}
  const b=e.target.closest("[data-cp],[data-pdf],[data-mt],[data-send]");if(!b)return;
  if(b.dataset.cp){const t=mailCache[+b.dataset.cp];copy(`Para: ${t.p.email}\nAssunto: ${subj(t)}\n\n${fill(cfg.mail.body,t)}`);return}
  if(b.dataset.pdf){const t=mailCache[+b.dataset.pdf];baixarPDF(()=>pdfFormador(t),pdfNomeF(t));return}
  if(b.dataset.mt){const t=mailCache[+b.dataset.mt];baixarPDF(()=>pdfFormador(t),pdfNomeF(t));toast("PDF descarregado — anexe-o ao email");return}
  if(b.dataset.send){const t=mailCache[+b.dataset.send];b.disabled=true;b.textContent="A enviar…";
    try{await enviarFormador(t);toast("Enviado para "+t.p.email);renderMails()}catch(x){sendMsg(esc(t.p.nome)+": "+esc(msErro(x)),"bad");b.disabled=false;b.textContent="Enviar com PDF"}}});
$("#cpTxt").onclick=()=>copy(geralText());
$("#cpCsv").onclick=()=>copy(geralCSV());

/* ---------- Excel de emails (formato da escola) ---------- */
// (0.9.110: o carregador do Excel é o loadXLSX mais abaixo, com a cópia local lib/xlsx.mini.min.js — o antigo, pela internet, nunca era usado)
async function gerarExcel(){
  const X=await loadXLSX();
  const T=byTeacher(evaluate()).filter(t=>t.miss&&t.p.id!=="_");
  if(!T.length){toast("Nenhum formador com documentação em falta");return false}
  const wb=X.utils.book_new(),used=new Set(["Índice"]);
  const sheetName=t=>{let b=(String(t.p.nome).trim().split(/\s+/)[0]||"Formador").replace(/[\[\]:*?\/\\]/g,"").slice(0,28),n=b,i=2;while(used.has(n))n=b+" "+(i++);used.add(n);return n};
  const names=T.map(sheetName);
  const idx=[[`Emails — Documentos em Falta na Box (Ano Letivo ${anoLetivo()})`],[`Gerado a ${new Date().toLocaleDateString("pt-PT")}. Prazo proposto nos emails: ${cfg.mail.prazo||"—"}. Cada folha tem o email pronto a copiar e a lista de itens desse formador.`],[],["Formador","Nº de Itens em Falta","Folha"],...T.map((t,i)=>[t.p.nome,t.miss,names[i]])];
  const wi=X.utils.aoa_to_sheet(idx);wi["!cols"]=[{wch:44},{wch:20},{wch:16}];X.utils.book_append_sheet(wb,wi,"Índice");
  T.forEach((t,i)=>{
    const rows=rowsFor(t,true);
    const aoa=[[`Email para ${t.p.nome}`],[`Nº de itens em falta: ${t.miss}  |  Copia o texto da caixa abaixo para o corpo do email.`],[],["Assunto:",subj(t)],[],["Corpo do email (copiar e colar):"],[fill(cfg.mail.body,t,true)],["Lista de documentos/pastas em falta (anexar ou citar no email):"],
      ["Turma","Disciplina","Módulo/UFCD","Localização na Box","O que está em falta","Observações"],
      ...rows.map(r=>[r.turma,r.disc,r.mod,r.loc,r.falta,r.obs])];
    const ws=X.utils.aoa_to_sheet(aoa);ws["!cols"]=[{wch:34},{wch:26},{wch:40},{wch:58},{wch:30},{wch:40}];
    ws["!merges"]=[{s:{r:6,c:0},e:{r:6,c:5}}];ws["!rows"]=[];ws["!rows"][6]={hpt:260};
    X.utils.book_append_sheet(wb,ws,names[i]);
  });
  const out=X.write(wb,{bookType:"xlsx",type:"array"});
  download(`Emails_Documentos_em_Falta_${hoje()}.xlsx`,new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  return true;
}
$("#xlsGo").onclick=async()=>{const b=$("#xlsGo");b.disabled=true;
  try{const ok=await gerarExcel();if(ok&&$("#xlsReg").checked)registarEnvio("Excel de emails gerado");}catch(e){toast(e.message)}b.disabled=false};
$("#regGo").onclick=()=>registarEnvio("Envio registado");

/* ---------- save/load ---------- */
$("#cpCfg").onclick=()=>copy(JSON.stringify(cfg,null,2));
function loadCfgText(t){try{const c=JSON.parse(t);if(!c.docTypes||!c.mods||!c.profs)throw 0;
  if(c.logos){LOGOS=c.logos;delete c.logos;try{localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}catch(e){}aplicarLogos();lgMigrar()}ponto("Antes de carregar uma configuração");cfg=c;migrate();save();refreshAll();$("#cfgMsg").innerHTML=`<div class="msg ok">Configuração carregada: ${c.profs.length} formadores, ${c.mods.length} módulos. (Pode voltar atrás em Pontos de restauro.)</div>`}catch(e){$("#cfgMsg").innerHTML=`<div class="msg bad">O texto não é uma configuração válida.</div>`}}
$("#loadCfg").onclick=()=>loadCfgText($("#cfgTxt").value);
$("#verCfg").onclick=()=>{const t=JSON.stringify(cfg);$("#cfgTxt").value=t.length>300000?t:JSON.stringify(cfg,null,2)}; // 0.9.50: só quando se pede
$("#fileCfg").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{$("#cfgTxt").value=r.result;loadCfgText(r.result)};r.readAsText(f)};
let resetArm=false;
$("#recTxt").oninput=e=>{$("#recBtn").disabled=e.target.value.trim().toUpperCase()!=="APAGAR"};
$("#recBtn").onclick=async e=>{if($("#recTxt").value.trim().toUpperCase()!=="APAGAR")return;if(!confirm("Apagar mesmo TODA a informação da EPISJ 360? Ficam só as ligações à Box e ao Office 365."))return;
  e.target.disabled=true;e.target.textContent="A apagar…";await apagarTudoRecomecar()};
$("#resetAll").onclick=e=>{if(!resetArm){resetArm=true;e.target.textContent="Clique de novo para confirmar";setTimeout(()=>{resetArm=false;e.target.textContent="Apagar tudo"},3000);return}
  ponto("Antes de apagar tudo");cfg=defaultCfg();files=[];folders=[];lastListing=null;save();dadosMudaram();e.target.textContent="Apagar tudo";resetArm=false;toast("Tudo apagado — pode restaurar em Pontos de restauro")};

/* ---------- demo ---------- */
$("#demo").onclick=()=>{
  ponto("Antes de carregar os dados de exemplo");
  const c=defaultCfg();
  c.profs=[["Ana Silva","ana.silva@escola.pt"],["Bruno Medeiros","bruno.medeiros@escola.pt"],["Carla Sousa","carla.sousa@escola.pt"]].map(([n,e])=>({id:uid(),nome:n,email:e}));
  cfg=c;save();
  const R="DTP 2025.2026/997 Mecatrónica Automóvel (23-26)";
  const L=["path,name,type",
   `${R}/006 - Planificações/006.3 - Módulo e UFCDs/1600 - Matemática/Módulo A07,Planificação A07.pdf,file`,
   `${R}/007 - Recursos Didáticos/1600 - Matemática/Módulo A07,Ficha 1.pdf,file`,
   `${R}/012 - Orientação Educativa/1600 - Matemática/Módulo A07,Registo.pdf,file`,
   `${R}/008 - Avaliação/1600 - Matemática/Módulo A07/Matrizes,Matriz A07.pdf,file`,
   `${R}/008 - Avaliação/1600 - Matemática/Módulo A07/Testes e Fichas de Avaliação,Teste A07.pdf,file`,
   `${R}/008 - Avaliação/1600 - Matemática/Módulo A07/Enunciados e Prop. de Correção,,folder`,
   `${R}/007 - Recursos Didáticos/8821 - TP/10861,Apresentação.pdf,file`,
   `${R}/012 - Orientação Educativa/8821 - TP/10861,,folder`].join("\n");
  ingest(L,"os dados de exemplo");
  $("#detect").click();
  for(const r of gridRows())cfg.grid[r.k]=/Matem/.test(r.disc)?c.profs[1].id:c.profs[0].id;
  cfg.desig["1600|a07"]="Probabilidade";cfg.desig["*|10861"]="Diagnóstico e Reparação de Sistemas de Iluminação e Aviso";
  save();renderAll();
};

// números dos indicadores animados com o NumberFlow (passam suavemente do valor anterior para o novo)
const NFV=new Map();
function countUp(root){const nf=!!(window.customElements&&customElements.get("number-flow"));
  root.querySelectorAll(".tile").forEach((tile,i)=>{const el=tile.querySelector(".v");if(!el)return;const m=el.textContent.trim().match(/^(\d+)(.*)$/);if(!m)return;
    const end=+m[1],rest=m[2],k=(root.id||"")+"|"+((tile.querySelector(".l")||{}).textContent||i),prev=NFV.get(k);NFV.set(k,end);
    if(!nf){if(end<2||matchMedia("(prefers-reduced-motion: reduce)").matches)return;const t0=performance.now(),d=650;const step=t=>{const q=Math.min(1,(t-t0)/d),e=1-Math.pow(1-q,3);el.textContent=Math.round(end*e)+rest;if(q<1)requestAnimationFrame(step)};requestAnimationFrame(step);return}
    const f=document.createElement("number-flow");f.locales="pt-PT";if(rest)f.numberSuffix=rest;
    el.textContent="";el.appendChild(f);f.update(prev==null?0:prev);requestAnimationFrame(()=>requestAnimationFrame(()=>f.update(end)))})}

/* 0.9.75: o NumberFlow passa a animar os números de todos os mosaicos (.tile .v) e dos resumos, em todos os módulos */
(()=>{let h=0;const corre=()=>{h=0;if(!(window.customElements&&customElements.get("number-flow")))return;
  document.querySelectorAll("main .tile .v,main .crres b,main .fer-res b").forEach((el,i)=>{if(el.querySelector("number-flow")||el.children.length)return;const m=(el.textContent||"").trim().match(/^(\d{1,7})(\s?[%h]?)$/);if(!m)return;
    const sec=el.closest("section"),lab=(el.closest(".tile")||el.parentElement).textContent.replace(/\d+/g,"").trim().slice(0,40),k="auto|"+(sec&&sec.id)+"|"+lab,end=+m[1],prev=NFV.get(k);NFV.set(k,end);
    const f=document.createElement("number-flow");f.locales="pt-PT";if(m[2])f.numberSuffix=m[2];el.textContent="";el.appendChild(f);f.update(prev==null?0:prev);if(prev!==end)requestAnimationFrame(()=>requestAnimationFrame(()=>f.update(end)))})};
  const mo=new MutationObserver(()=>{if(!h)h=requestAnimationFrame(corre)});const mn=document.querySelector("main");if(mn)mo.observe(mn,{childList:true,subtree:true});corre()})();
/* ---------- painel de alterações desde uma contagem ---------- */
const ALTKEY="boxcheck_alteracoes"; // comparações guardadas pelas versões 0.8/0.9
const pes=u=>u?{n:u.name||"",e:u.login||""}:null;
const byOf=x=>pes(x&&(x.modified_by||x.created_by));
const cbOf=x=>pes(x&&x.created_by);
// converte uma listagem guardada nas estruturas usadas pelo relatório
function toFF(L){const fs=[],fo=[];
  for(const x of L.itens){const sg=x.path.split("/").map(s=>s.trim()).filter(Boolean);
    if(x.type==="folder"){fo.push(sg.join("/"));continue}
    fs.push({path:[...sg,x.name].join("/"),rawDir:sg.join("/"),comps:sg.map(norm),name:x.name,nname:norm(x.name),date:x.modified_at||"",fid:x.id||"",pid:x.pid||"",size:x.size??null,sha1:x.sha1||"",cmod:x.cm||"",ca:x.ca||""})}
  return{fs,fo}}
let EVB=null;
function evalBase(b){const rev=txRev+"|"+refRev+"|"+tplRev+"|"+cfgRev+"|"+filesRev;if(EVB&&EVB.b===b&&EVB.rev===rev)return EVB.ev;
  if(!b._idx){const t=toFF(b);b._idx=buildIndex(t.fs,t.fo)}
  const ev=evalCore(b._idx,ativos());EVB={b,rev,ev};return ev}
// diferenças de ficheiros entre duas listagens (sem olhar ao relatório)
function diffFicheiros(prev,cur){
  const P=new Map(),C=new Map();for(const x of prev.itens)if(x.type!=="folder"&&x.id)P.set(x.id,x);for(const x of cur.itens)if(x.type!=="folder"&&x.id)C.set(x.id,x);
  const novos=[],alterados=[],apagados=[],delBy=cur.delBy||{};
  for(const [id,x] of C){const o=P.get(id);
    const base={p:x.path,n:x.name,t:x.modified_at||"",fid:x.id,sha1:x.sha1||"",size:x.size??null,name:x.name};
    if(!o)novos.push({...base,by:x.cb||x.by||null});
    else if((o.sha1&&x.sha1&&o.sha1!==x.sha1)||(o.size!==x.size&&o.size!=null&&x.size!=null))alterados.push({...base,by:x.by||null});
    else if(o.path!==x.path||o.name!==x.name)alterados.push({...base,by:x.by||null,mv:1})}
  for(const [id,o] of P)if(!C.has(id))apagados.push({p:o.path,n:o.name,by:delBy[id]||null});
  return{novos,alterados,apagados}}
function diffListings(base,cur){
  const d=diffFicheiros(base,cur),before=new Map(),entregues={},perdidos={};
  for(const e of evalBase(base))for(const i of e.items)before.set(i.key,i.ok);
  for(const e of evaluate())for(const i of e.items){const was=before.get(i.key);if(was===undefined)continue;
    const pid=profOf(e.mod)||"_";
    if(!was&&i.ok)(entregues[pid]=entregues[pid]||[]).push({k:i.key,t:modLabel(e.mod),d:itemNome(i)});
    if(was&&!i.ok)(perdidos[pid]=perdidos[pid]||[]).push({k:i.key,t:modLabel(e.mod),d:itemNome(i)})}
  return{...d,desde:base.quando,ate:cur.quando,pasta:cur.pasta,entregues,perdidos,vivo:true};
}
const altList=()=>lsJ(ALTKEY,[]);
const pessoaKey=b=>b?(b.e||b.n||"?").toLowerCase():"?";
function formadorDe(b){if(!b)return null;emailsAuto();const e=norm(b.e),n=norm(b.n);
  return cfg.profs.find(p=>(e&&norm(p.email)===e))||cfg.profs.find(p=>n&&norm(p.nome)===n)||null}
// estado do conteúdo de um ficheiro do painel: {lvl:"bad"|"warn"|"ok"|"?"|"", txt}
function conteudo(x){
  const q=x.fid&&qualFicheiros().get(x.fid);if(q)return q;
  if(x.size===0)return{lvl:"bad",txt:"ficheiro vazio (0 bytes)"};
  const w=palavras(x.sha1);
  if(w==null)return{lvl:TEXT_EXT.test(x.n||"")&&!(x.sha1&&TX.has(x.sha1))?"?":"",txt:""};
  if(w<minPal())return (x.size||0)<150000?{lvl:"bad",txt:`em branco ou quase vazio (${w} palavras)`}:{lvl:"warn",txt:"sem texto — pode ser um documento digitalizado"};
  return{lvl:"ok",txt:""}}
let altSel="",BASEC=null,altBusy=0;
async function renderAlt(){
  const my=++altBusy,el=$("#altBody"),root=lastListing&&lastListing.rootId;
  const bases=root?(basesIdx()[root]||[]):[],legacy=altList();
  const opts=bases.map(b=>({k:"B|"+b.t,txt:`Desde ${b.quando} — ${b.label}`})).concat(legacy.map((d,i)=>({k:"L|"+i,txt:`(guardada antes) ${d.desde} → ${d.ate}`})));
  if(!opts.some(o=>o.k===altSel))altSel=opts.length?opts[0].k:"";
  $("#altPick").innerHTML=opts.map(o=>`<option value="${o.k}" ${o.k===altSel?"selected":""}>${esc(o.txt)}</option>`).join("");
  $("#altPick").parentElement.style.display=opts.length?"":"none";$("#altNova").style.display=root?"":"none";
  $("#altEstado").style.display=root?"flex":"none";
  if(root)$("#altQuando").innerHTML=scanBusy?`<span class="spin" style="width:13px;height:13px;vertical-align:-2px"></span> A ler as alterações na Box…`:`Estado atual: leitura da Box de <b>${esc(lastListing.quando)}</b>.`;
  $("#altAtual").disabled=!!scanBusy;
  let d=null;
  if(altSel.startsWith("L|"))d=legacy[+altSel.slice(2)];
  else if(altSel&&root){const t=+altSel.slice(2),k=root+"|"+t;if(!BASEC||BASEC.k!==k){const b=await lerBase(root,t);if(my!==altBusy)return;BASEC={k,b}}
    if(BASEC.b)d=diffListings(BASEC.b,lastListing)}
  if(!d){el.innerHTML=`<div class="card"><p class="hint" style="margin:0">${root?"Ainda não há uma contagem para comparar.":"Ainda não há alterações para mostrar. Faça uma análise no separador Análise: a primeira serve de ponto de partida (contagem) e, a partir daí, aparece aqui quem colocou, alterou ou apagou documentos e o efeito no relatório de cada formador."}</p></div>`;$("#altTiles").innerHTML="";return}
  const nE=Object.values(d.entregues).reduce((a,x)=>a+x.length,0),nP=Object.values(d.perdidos).reduce((a,x)=>a+x.length,0);
  const postos=[...d.novos,...d.alterados.filter(x=>!x.mv)],C=new Map(postos.map(x=>[x,conteudo(x)])),lv=x=>(C.get(x)||{}).lvl;
  const nB=postos.filter(x=>lv(x)==="bad").length,nS=postos.filter(x=>lv(x)==="warn").length,nQ=postos.filter(x=>lv(x)==="?").length;
  $("#altTiles").innerHTML=`
   <div class="tile"><div class="v" style="color:var(--ok)">${d.novos.length}</div><div class="l">documentos colocados</div></div>
   <div class="tile"><div class="v">${d.alterados.length}</div><div class="l">substituídos ou movidos</div></div>
   <div class="tile"><div class="v" style="color:var(--bad)">${d.apagados.length}</div><div class="l">apagados</div></div>
   <div class="tile"><div class="v" style="color:var(--bad)">${nB}</div><div class="l">vazios ou falsos${nS?` · ${nS} a confirmar`:""}${nQ?` · ${nQ} por ler`:""}</div></div>
   <div class="tile"><div class="v" style="color:var(--ok)">${nE}</div><div class="l">itens do relatório passaram a entregues</div></div>
   ${nP?`<div class="tile"><div class="v" style="color:var(--bad)">${nP}</div><div class="l">itens deixaram de estar entregues</div></div>`:""}`;countUp($("#altTiles"));
  // por pessoa (quem fez)
  const P=new Map(),add=(k,arr)=>{for(const x of arr){const key=pessoaKey(x.by);if(!P.has(key))P.set(key,{by:x.by,novos:[],alterados:[],apagados:[],ult:""});const r=P.get(key);r[k].push(x);if(x.t&&x.t>r.ult)r.ult=x.t}};
  add("novos",d.novos);add("alterados",d.alterados);add("apagados",d.apagados);
  const pessoas=[...P.values()].sort((a,b)=>(b.novos.length+b.alterados.length+b.apagados.length)-(a.novos.length+a.alterados.length+a.apagados.length));
  const tagC=x=>{const c=C.get(x)||conteudo(x);return c.lvl==="bad"?` <span class="tag bad">${esc(c.txt)}</span>`:c.lvl==="warn"?` <span class="tag warn">a confirmar: ${esc(c.txt)}</span>`:c.lvl==="?"?` <span class="tag" style="background:#eef1f5;color:#4a5260">por ler</span>`:""};
  const fl=(arr,del)=>arr.slice(0,200).map(x=>`<div class="files">${x.mv?"↪ movido: ":""}<b>${esc(x.n)}</b>${x.mv||del?"":tagC(x)} — ${esc(x.p)}</div>`).join("")+(arr.length>200?`<div class="files">… e mais ${arr.length-200}</div>`:"");
  const rowsP=pessoas.map(r=>{const f=formadorDe(r.by),nome=r.by?(r.by.n||r.by.e):"(desconhecido)",put=[...r.novos,...r.alterados.filter(x=>!x.mv)];
    return `<details class="altp"><summary><span class="who2"><span class="av">${esc((nome||"?").split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase())}</span><span><b>${esc(nome)}</b>${r.by&&r.by.e?`<br><span class="hint" style="margin:0">${esc(r.by.e)}</span>`:""}</span>${f?`<span class="tag ok">formador</span>`:""}</span>
      <span class="num ok">+${r.novos.length}<small>colocou</small></span><span class="num">${r.alterados.length}<small>substituiu</small></span><span class="num bad">${r.apagados.length}<small>apagou</small></span><span class="num bad">${put.filter(x=>lv(x)==="bad").length}<small>vazios / falsos</small></span><span class="num" style="color:#b26a00">${put.filter(x=>lv(x)==="warn").length}<small>a confirmar</small></span><span class="hint" style="margin:0">${r.ult?new Date(r.ult).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):""}</span></summary>
      <div style="padding:6px 14px 12px">${r.novos.length?`<h3 style="margin:6px 0">Colocou</h3>${fl(r.novos)}`:""}${r.alterados.length?`<h3 style="margin:6px 0">Substituiu / moveu</h3>${fl(r.alterados)}`:""}${r.apagados.length?`<h3 style="margin:6px 0">Apagou</h3>${fl(r.apagados,true)}`:""}</div></details>`}).join("");
  // por formador (efeito no relatório)
  const ids=new Set([...Object.keys(d.entregues),...Object.keys(d.perdidos)]);
  const faltaAgora=new Map(byTeacher(evaluate()).map(t=>[t.p.id,t.miss]));
  const rowsF=[...ids].map(id=>({id,p:cfg.profs.find(p=>p.id===id)||{nome:id==="_"?"(sem formador atribuído)":"(formador removido)"},e:d.entregues[id]||[],x:d.perdidos[id]||[]}))
    .sort((a,b)=>cmpProf(a.p,b.p)).map(r=>`<details class="altp"><summary><span class="who2"><b>${esc(profRot(r.p))}</b></span><span class="num ok">+${r.e.length}<small>entregues</small></span><span class="num bad">${r.x.length?"−"+r.x.length:"0"}<small>deixaram de estar</small></span><span class="num">${faltaAgora.get(r.id)??"—"}<small>ainda em falta</small></span><span></span><span></span><span></span></summary>
      <div style="padding:6px 14px 12px">${r.e.map(x=>`<div class="files" style="color:var(--ok)">✓ ${esc(x.t)} — ${esc(x.d)}</div>`).join("")}${r.x.map(x=>`<div class="files" style="color:var(--bad)">✗ ${esc(x.t)} — ${esc(x.d)}</div>`).join("")}</div></details>`).join("");
  const igual=BASEC&&BASEC.b&&lastListing&&BASEC.b.t>=(lastListing.t||0)&&!altSel.startsWith("L|");
  el.innerHTML=(igual?`<div class="msg info" style="margin-bottom:14px">A contagem foi feita a partir da última leitura da Box (${esc(lastListing.quando)}), por isso ainda não há nada para comparar. Carregue em <b>↻ Atualizar agora a partir da Box</b> para ver o que mudou desde então.</div>`:"")+`<div class="card"><h2>Quem fez o quê</h2><p class="hint">Entre ${esc(d.desde)} e ${esc(d.ate)}. Clique numa pessoa para ver os ficheiros. “Vazios / falsos” = documentos colocados ou substituídos que não contam (em branco, texto de enchimento ou modelo por preencher).${nQ?` Há ${nQ} documento(s) ainda por ler — a leitura corre em segundo plano.`:""}</p>${rowsP||`<p class="hint">Nenhum documento colocado, alterado ou apagado.</p>`}</div>
    <div class="card"><h2>Efeito no relatório, por formador</h2><p class="hint">Itens exigidos (turma · disciplina · módulo · documento) que mudaram de estado desde a contagem.</p>${rowsF||`<p class="hint">Nenhum item mudou de estado.</p>`}</div>`;
}
$("#altPick").addEventListener("change",e=>{altSel=e.target.value;renderAlt()});
// lê na Box o que mudou desde a última análise e volta a comparar (só leitura)
async function altAtualizar(auto){
  if(!SES){if(!auto)toast("Entre primeiro na Box");return}
  if(!lastListing){if(!auto)toast("Faça primeiro uma análise no separador Análise");return}
  if(scanBusy){if(!auto)toast("Já está a decorrer uma leitura da Box");return}
  const L=lastListing,t0=L.t||0;
  if(curFolder.id!==L.rootId){let f=null;try{f=JSON.parse(localStorage.getItem("box_last_folder")||"null")}catch(e){}
    curFolder=f&&f.id===L.rootId?f:{id:L.rootId,path:[{id:"0",name:"Box"},{id:L.rootId,name:L.pasta}]}}
  const pr=runScan(false,auto);renderAlt();await pr;
  if(lastListing&&(lastListing.t||0)===t0&&!auto)toast($("#scanMsg").textContent||"Não foi possível atualizar");
  else if(lastListing&&(lastListing.t||0)===t0&&auto&&/7 dias/.test($("#scanMsg").textContent))toast("A última leitura completa tem mais de 7 dias: faça “Analisar” em Análise");
  if(curTab==="alt")renderAlt()}
$("#altAtual").onclick=()=>altAtualizar(false);
$("#altNova").onclick=async()=>{if(!lastListing)return;const b=await criarBase(lastListing,"Contagem iniciada à mão");
  if(b){altSel="B|"+b.t;BASEC=null;toast("Nova contagem iniciada: as alterações passam a contar a partir de agora")}else toast("Não foi possível guardar a contagem");renderAlt()};

/* ---------- relatório de pastas ---------- */
/* 0.9.194: o que cada formador vê do Box360 (pastas e estatísticas só suas) — a Direção calcula a partir da análise e publica
   em PUB.box.profs[id do formador] = {p:[[caminho, ficheiros na pasta], …], m:[{tu,di,mo,it:[[tipo, estado, pasta, data]]}]} */
/* 0.9.201: a turma tem outro código noutro ano (ex.: «A01 Mecatrónica Automóvel (24-27)» em 2026/2027 e «998 Mecatrónica Automóvel (24-27)»
   em 2025/2026): procura a pasta do módulo pelo nome do curso e anos da turma, pela disciplina e pelo módulo */
function modPastasOutroAno(ss,idx){if(ss.length<2)return[];const last=ss[ss.length-1],tur=ss[0],rem=tur.replace(/^[a-z]{0,2}\d+\s*[-–.]?\s*/,"").trim(),mid=ss.slice(1,-1);
  const temTur=n=>n.some(c=>c===tur||(rem.length>4&&c.endsWith(rem)));
  let ok=idx.recs.filter(r=>{const n=r.n;return n[n.length-1]===last&&temTur(n)&&mid.every(x=>n.includes(x))});
  if(!ok.length){const disc=mid[mid.length-1];ok=idx.recs.filter(r=>{const n=r.n;return n[n.length-1]===last&&temTur(n)&&(!disc||n.includes(disc))})}
  return ok}
function boxPublico(){if(!lastListing||!folders||!folders.length)return null;let ev=null;try{ev=evaluate()}catch(e){return null}if(!ev)return null;
  const own=new Map();for(const f of files)if(f.rawDir)own.set(f.rawDir,(own.get(f.rawDir)||0)+1);
  const todas=[...new Set(folders)],out={};
  for(const e of ev){const pid=profOf(e.mod);if(!pid)continue;const o=out[pid]||(out[pid]={raiz:new Set(),m:[]});
    let mf=e.modFolders||[];
    // 0.9.200: numa análise de outro ano letivo a pasta do módulo não tem o mesmo ano no caminho (ex.: o módulo está em «DTP 2026.2027 / A01…»
    // e a análise é a de «DTP 2025.2026»): procura-a sem as pastas do ano, pelo resto do caminho (turma, disciplina, módulo)
    if(!mf.length){try{const idx=getIdx(),ss=segs(e.mod.pasta).filter(x=>!anoDe(x));if(ss.length){mf=idx.pick(ss,"folders");if(!mf.length){const f=idx.flex(ss);if(f)mf=idx.pick(f.ss,"folders")}if(!mf.length)mf=modPastasOutroAno(ss,idx)}}catch(x){}}
    for(const r of mf)o.raiz.add(r.r.join("/"));
    o.m.push({tu:e.mod.turma||"",di:e.mod.disc||"",mo:modTitle(e.mod),it:e.items.map(i=>{let d="";for(const f of i.hits||[]){const x=(f.f||f).date||"";if(x>d)d=x}return[(i.doc&&i.doc.nome)||"",i.state,i.falta||"",d.slice(0,10)]})})}
  const R={t:lastListing.t||Date.now(),pasta:lastListing.pasta||"",nome:String(lastListing.pasta||"").split("/").filter(Boolean).pop()||"Análise",profs:{}};
  for(const pid in out){const raiz=[...out[pid].raiz],S=new Set();
    for(const p of todas)if(raiz.some(r=>p===r||p.startsWith(r+"/")))S.add(p);
    for(const p of [...S]){const q=p.split("/");for(let i=1;i<q.length;i++)S.add(q.slice(0,i).join("/"))}
    R.profs[pid]={p:[...S].sort().map(p=>[p,own.get(p)||0]),m:out[pid].m}}
  return {id:String(lastListing.rootId||R.nome),d:R}}
/* todas as análises guardadas neste computador (ex.: DTP 2025.2026 e DTP 2026.2027): cada uma é calculada à vez, trocando por
   momentos a análise carregada, e no fim volta tudo ao que estava (nada é gravado nem apagado) */
async function boxPublicoTodas(){const out=[],cur=lastListing&&String(lastListing.rootId||"");
  try{const b=boxPublico();if(b)out.push(b)}catch(e){}
  let ids=[];try{ids=Object.keys(resumos()).filter(id=>id!==cur)}catch(e){}
  if(!ids.length)return out;
  const S={lastListing,files,folders};
  try{for(const id of ids){let j=null;try{j=await lerListagem(id)}catch(e){}if(!j||!j.itens)continue;
      const t=toFF(semExcluidas(j));lastListing=j;files=t.fs;folders=t.fo;filesRev++;IDX=null;EV=null;
      try{const b=boxPublico();if(b)out.push(b)}catch(e){console.warn("análise "+id,e)}}}
  finally{lastListing=S.lastListing;files=S.files;folders=S.folders;filesRev++;IDX=null;EV=null}
  return out}
var BOX_SEL="";
function boxAnalises(){const A=PUB&&PUB.box&&PUB.box.anal||{};return Object.entries(A).map(([id,d])=>({id,d})).sort((a,b)=>COLL_PTN.compare(String(b.d.nome||""),String(a.d.nome||""))||(b.d.t||0)-(a.d.t||0))}
// escolha da análise guardada (formador): a mais recente por omissão
function boxSelHTML(){const L=boxAnalises();if(!L.length)return "";const cur=boxAtual(); // 0.9.198: sempre à vista (também com uma só análise), para se saber qual está a ser vista
  return `<label class="boxsel" style="width:260px">Análise guardada<select data-boxsel>${L.map(x=>`<option value="${esc(x.id)}"${cur&&cur.id===x.id?" selected":""}>${esc(x.d.nome||x.id)}${x.d.t?" · "+new Date(x.d.t).toLocaleDateString("pt-PT"):""}</option>`).join("")}</select></label>`}
function boxAtual(){const L=boxAnalises();return L.find(x=>x.id===BOX_SEL)||L[0]||null}
document.addEventListener("change",e=>{const s=e.target.closest&&e.target.closest("[data-boxsel]");if(!s)return;BOX_SEL=s.value;try{if(curTab==="pas")renderTree();if(curTab==="est")renderEst();if(curTab==="rel")renderReport()}catch(x){}});
// formador (ou pré-visualização de um perfil sem Direção): só o que está publicado para si
function boxMeu(){try{if(typeof podePublicar==="function"&&podePublicar()&&!PREV)return null}catch(e){}const X=boxAtual(),B=X&&X.d;if(!B||!B.profs)return {vazio:true};
  const em=String(EU&&EU.email||"").toLowerCase(),me=(cfg.profs||[]).find(p=>String(profEmail(p)||p.email||"").toLowerCase()===em);
  return me&&B.profs[me.id]?Object.assign({me,t:B.t,nome:B.nome},B.profs[me.id]):{vazio:true,me,nome:B.nome}}
function buildTree(){const BM=boxMeu();if(BM)return buildTreeMeu(BM);return buildTree0()}
function buildTreeMeu(BM){const nodes=new Map();
  const ensure=p=>{if(nodes.has(p))return nodes.get(p);const parts=p.split("/");const n={path:p,name:parts[parts.length-1],kids:[],own:0,total:0,depth:parts.length};nodes.set(p,n);if(parts.length>1)ensure(parts.slice(0,-1).join("/")).kids.push(n);return n};
  for(const [p,o] of BM.p||[])ensure(p).own=o;
  let roots=[...nodes.values()].filter(n=>n.depth===1);const sum=n=>{n.kids.sort((a,b)=>COLL_PTN.compare(a.name,b.name));n.total=n.own+n.kids.reduce((a,k)=>a+sum(k),0);return n.total};roots.forEach(sum);
  // o caminho completo a partir da pasta da análise (ex.: «DTP 2026.2027 › 997 Mecatrónica… › …»); só se saltam os níveis acima dela
  while(roots.length===1&&roots[0].own===0&&roots[0].kids.length===1&&norm(roots[0].name)!==norm(BM.nome||""))roots=roots[0].kids;
  const list=[];const walk=n=>{list.push(n);n.kids.forEach(walk)};roots.forEach(walk);return {nodes,roots,list,base:roots.length?roots[0].depth:1,meu:true}}
function buildTree0(){
  const nodes=new Map();
  const ensure=p=>{if(nodes.has(p))return nodes.get(p);const parts=p.split("/");
    const n={path:p,name:parts[parts.length-1],kids:[],own:0,total:0,depth:parts.length};nodes.set(p,n);
    if(parts.length>1)ensure(parts.slice(0,-1).join("/")).kids.push(n);return n};
  folders.forEach(p=>ensure(p));
  files.forEach(f=>{if(f.rawDir)ensure(f.rawDir).own++});
  let roots=[...nodes.values()].filter(n=>n.depth===1);
  const sum=n=>{n.kids.sort((a,b)=>COLL_PTN.compare(a.name,b.name));n.total=n.own+n.kids.reduce((a,k)=>a+sum(k),0);return n.total};
  roots.forEach(sum);
  // salta os níveis de topo que são só caminho (ex.: "Gestão Documental" › "DTP 2026.2027")
  while(roots.length===1&&roots[0].own===0&&roots[0].kids.length===1)roots=roots[0].kids;
  const list=[];const walk=n=>{list.push(n);n.kids.forEach(walk)};roots.forEach(walk);
  return {nodes,roots,list,base:roots.length?roots[0].depth:1};
}
/* 0.9.203: só a última pasta da árvore (sem subpastas) conta como vazia — uma pasta-mãe nunca aparece como vazia */
const tVazia=n=>!n.kids.length&&!n.total;
function treeLines(n,ind,out){out.push(`${"  ".repeat(ind)}${n.name}  [${n.own} na pasta · ${n.total} no total]${tVazia(n)?"  — VAZIA":""}`);n.kids.forEach(k=>treeLines(k,ind+1,out));return out}
function treeText(){const {roots,list:all}=buildTree();
  return `RELATÓRIO DE PASTAS — ${new Date().toLocaleDateString("pt-PT")}\n${all.length} pastas · ${all.filter(tVazia).length} vazias · ${files.length} ficheiros\n\n`+roots.flatMap(r=>treeLines(r,0,[])).join("\n")}
function treeCSV(){const {list,base}=buildTree();const q=v=>`"${String(v).replace(/"/g,'""')}"`;
  return [["Caminho","Pasta","Nível","Subpastas","Ficheiros na pasta","Ficheiros no total","Estado"]].concat(
    list.map(n=>[n.path,n.name,n.depth-base,n.kids.length,n.own,n.total,tVazia(n)?"Vazia":n.total?"Com ficheiros":"Sem ficheiros (tem subpastas)"])).map(r=>r.map(q).join(";")).join("\n")}
$("#pTxt").addEventListener("input",debounce(()=>renderTree(),160));["#pLvl","#pShow"].forEach(s=>$(s).addEventListener("input",()=>renderTree()));
// 0.9.86: a árvore abre-se aos poucos — só se desenham as pastas abertas (com 13 000 pastas eram 7 s no iPad);
// as fechadas desenham-se quando se carrega nelas
let TREE=null;
const treeNo=(n,open,inner)=>`<details class="fd${n.kids.length?"":" leaf"}${tVazia(n)?" empty":""}"${open?" open":""} data-p="${esc(n.path)}"${!open&&n.kids.length?' data-lz="1"':""}><summary><span class="nm">${esc(n.name)}</span><span class="cnt">${n.own} na pasta · ${n.total} no total${n.kids.length?` · ${n.kids.length} subpasta(s)`:""}</span></summary>${inner}</details>`;
function renderTree(){
  const T=buildTree(),{nodes,roots,list:all,base}=T;TREE=T;
  const empty=all.filter(tVazia);
  $("#pTiles").innerHTML=`<div class="tile"><div class="v">${all.length}</div><div class="l">pastas</div></div>
   <div class="tile"><div class="v" style="color:var(--bad)">${empty.length}</div><div class="l">pastas vazias</div></div>
   <div class="tile"><div class="v">${T.meu?T.roots.reduce((a,r)=>a+r.total,0):files.length}</div><div class="l">ficheiros</div></div>`;countUp($("#pTiles"));
  {const h2=$("#pas h2"),hn=$("#pas h2+.hint");if(h2&&!h2.dataset.o){h2.dataset.o=h2.textContent;if(hn)hn.dataset.o=hn.textContent}
   if(h2)h2.textContent=T.meu?"As minhas pastas na Box":h2.dataset.o;
   {let sl=$("#pBoxSel");if(!sl){sl=document.createElement("div");sl.id="pBoxSel";sl.className="row";sl.style.margin="0 0 10px";$("#pTiles").insertAdjacentElement("beforebegin",sl)}sl.innerHTML=boxMeu()?boxSelHTML():"";sl.hidden=!sl.innerHTML}if(hn)hn.textContent=T.meu?"As pastas dos módulos atribuídos a si, com o caminho completo e o número de ficheiros em cada uma (na própria pasta e no total). As pastas sem nenhum ficheiro aparecem a vermelho. Atualizado quando a Direção analisa a Box.":hn.dataset.o}
  $("#pMsg").textContent="";
  if(!all.length){const BM=boxMeu();let msg="Faça primeiro a análise da Box (em Análise).";
    if(BM){const n=(BM.m||[]).length;msg=!boxAnalises().length?"Ainda não há análises publicadas pela Direção (a Direção tem de analisar a Box).":n?`Na análise «${esc(BM.nome||"")}» não foi encontrada nenhuma pasta dos seus ${n} módulo(s) — por exemplo, se são de turmas de outro ano letivo. Escolha outra análise acima, se houver.`+`<div class="em-falta" style="margin-top:8px">${BM.m.slice(0,30).map(m=>`<div>${esc([m.tu,m.mo].filter(Boolean).join(" · "))}</div>`).join("")}</div>`:`Na análise «${esc(BM.nome||"")}» não há módulos atribuídos a si.`}
    $("#pTree").innerHTML=`<p class="hint" style="margin:0">${msg}</p>`;return}
  const q=norm($("#pTxt").value),lvl=+$("#pLvl").value;
  if($("#pShow").value==="vazias"){
    // só as pastas vazias de nível mais alto (se uma pasta está vazia, as subpastas também estão)
    const tops=empty.filter(n=>!q||norm(n.path).includes(q)); // 0.9.203: as últimas pastas da árvore que estão vazias
    const L=tops.slice(0,2000);
    $("#pTree").innerHTML=`<p class="hint">${tops.length} pasta(s) vazia(s) (só as últimas pastas de cada ramo)${tops.length>L.length?` — a mostrar as primeiras ${L.length}; use «Procurar pasta» ou descarregue o Excel para ver todas`:""}:</p>`+L.map(n=>`<div style="padding:3px 0;border-bottom:1px dashed var(--line)">${esc(n.path)}${n.kids.length?` <span class="cnt hint">(+${n.kids.length} subpasta(s))</span>`:""}</div>`).join("");return}
  // pastas que interessam à procura (a própria e as de cima), calculado uma só vez
  let keep=null;
  if(q){keep=new Set();for(const n of all)if(norm(n.name).includes(q)){let p=n.path;while(p&&!keep.has(p)){keep.add(p);const i=p.lastIndexOf("/");p=i>0?p.slice(0,i):""}}}
  // até que nível se abre sem desenhar mais de ~1200 pastas de uma vez
  const porNivel=[];for(const n of all){if(keep&&!keep.has(n.path))continue;const d=n.depth-base;porNivel[d]=(porNivel[d]||0)+1}
  let ate=q?99:lvl,soma=0;for(let d=0;d<porNivel.length;d++){soma+=porNivel[d]||0;if(soma>(q?3000:1200)&&d<=ate){ate=Math.max(1,d-1);break}} // desenham-se os níveis 0…ate
  const run=++TREE_RUN;
  if(ate<(q?99:lvl)&&q)$("#pMsg").textContent=`São muitas pastas: abriu-se até ao nível ${ate}. Carregue numa pasta para a abrir.`;
  const html=n=>{if(keep&&!keep.has(n.path))return"";const open=(n.depth-base)<ate;return treeNo(n,open,open?n.kids.map(html).join(""):"")};
  $("#pTree").innerHTML=roots.map(html).join("")||`<p class="hint" style="margin:0">Nenhuma pasta com esse nome.</p>`;
  // 0.9.95: o nível escolhido (ex.: «Tudo») abre-se mesmo todo — o que passa das primeiras ~1200 pastas abre-se aos poucos,
  // 250 de cada vez, sem prender a página (antes ficava no nível 3 e era preciso abrir pasta a pasta)
  if(!q&&ate<lvl)treeAbrirResto(lvl,run);
}
let TREE_RUN=0;
function treeAbrirResto(alvo,run){const el=$("#pTree");
  const passo=()=>{if(run!==TREE_RUN||!TREE)return;
    const L=[];for(const d of el.querySelectorAll("details[data-lz]")){const n=TREE.nodes.get(d.dataset.p);if(n&&n.depth-TREE.base<alvo)L.push([d,n]);if(L.length>=250)break}
    if(!L.length){$("#pMsg").textContent="";return}
    for(const [d,n] of L){delete d.dataset.lz;d.insertAdjacentHTML("beforeend",n.kids.map(k=>treeNo(k,false,"")).join(""));d.open=true}
    $("#pMsg").textContent=`A abrir todas as pastas… ${el.querySelectorAll("details[open]").length} de ${TREE.list.filter(n=>n.kids.length).length}`;
    setTimeout(()=>requestAnimationFrame(passo),0)};
  passo()}
$("#pTree").addEventListener("toggle",e=>{const d=e.target;if(!d||!d.open||!d.dataset||!d.dataset.lz||!TREE)return;
  const n=TREE.nodes.get(d.dataset.p);delete d.dataset.lz;if(n)d.insertAdjacentHTML("beforeend",n.kids.map(k=>treeNo(k,false,"")).join(""))},true);
$("#pCpTxt").onclick=()=>copy(treeText());
$("#pCpCsv").onclick=()=>copy(treeCSV());
$("#pDl").onclick=()=>download(`pastas_box_${hoje()}.csv`,"﻿"+treeCSV(),"text/csv;charset=utf-8");
$("#pPr").onclick=()=>printText("Relatório de pastas da Box",treeText());
function printText(title,text){
  const w=window.open("","_blank");if(!w){toast("O navegador bloqueou a janela — permita pop-ups");return}
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font:12px/1.45 system-ui,sans-serif;margin:24px}pre{white-space:pre-wrap;font:inherit}</style></head><body><pre>${esc(text)}</pre></body></html>`);
  w.document.close();w.focus();setTimeout(()=>w.print(),300);}

