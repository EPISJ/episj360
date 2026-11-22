/* ---------- anos letivos ---------- */
/* 0.9.78: Anos letivos redesenhados — o ano ativo em destaque com a linha do tempo do ano (períodos, interrupções, feriados, hoje),
   os outros anos em cartões, um cartão para preparar o ano seguinte com datas sugeridas, e o percurso de cada turma ano a ano. */
function ayEstado(a){const e=escData(),at=anoAtivo();return a.id===e.ativo?"ativo":a.ini>at.ini?"prep":"enc"}
function ayTag(a){const s=ayEstado(a);return s==="ativo"?`<span class="tag" style="background:var(--okbg);color:var(--ok)">Ativo</span>`:s==="prep"?`<span class="tag" style="background:var(--brandbg);color:var(--brand)">Em preparação</span>`:`<span class="tag" style="background:#eef1f5;color:#4a5260">Encerrado</span>`}
// a Páscoa do ano civil em que calha o 2.º período do ano letivo
const ayPascoa=a=>calS(calPascoa((+a.ini||0)+1));
// datas sugeridas para o ano seguinte: o mesmo dia da semana do início deste ano; o fim no mesmo dia e mês
function aySugestao(y){const ant=escData().anos.find(x=>x.ini===y-1);if(!ant||!ant.inicio)return{ini:y+"-09-01",fim:(y+1)+"-06-30"};
  const d=calD(ant.inicio),n=calD((+ant.inicio.slice(0,4)+1)+ant.inicio.slice(4));let df=d.getDay()-n.getDay();if(df>3)df-=7;if(df<-3)df+=7;n.setDate(n.getDate()+df);
  return{ini:calS(n),fim:ant.fim?(+ant.fim.slice(0,4)+1)+ant.fim.slice(4):(y+1)+"-06-30"}}
// interrupções do ano anterior com as datas no ano novo: as que andam com a Páscoa (Carnaval, Páscoa) acompanham-na; as outras avançam um ano
function ayCopiarFerias(ant,a){const p0=ayPascoa(ant),p1=ayPascoa(a),mais1=s=>s?(+s.slice(0,4)+1)+s.slice(4):"";
  return (ant.ferias||[]).filter(f=>f).map(f=>{const off=f.de?calDias(p0,f.de):999,mov=off>=-50&&off<=15,o={nome:f.nome,de:"",ate:""};if(f.tipo)o.tipo=f.tipo;
    if(mov){o.de=calMais(p1,off);o.ate=f.ate?calMais(p1,calDias(p0,f.ate)):o.de}else{o.de=mais1(f.de);o.ate=mais1(f.ate)}return o})}
function ayNumeros(a){const hj=calHoje(),o={tot:0,feitos:0,falta:0,pct:0};if(!a.inicio||!a.fim||a.fim<a.inicio)return o;let NL;try{NL=calNaoLetivos(a)}catch(e){NL=new Map()}
  o.NL=NL;o.tot=calLetivos(a,a.inicio,a.fim,NL);o.feitos=hj<a.inicio?0:hj>a.fim?o.tot:calLetivos(a,a.inicio,calMais(hj,-1),NL);o.falta=o.tot-o.feitos;o.pct=o.tot?Math.round(o.feitos/o.tot*100):0;return o}
function ayFita(a,N){if(!a.inicio||!a.fim||a.fim<=a.inicio)return `<div class="msg info" style="margin:14px 0">Indique o início e o fim das aulas para ver a linha do tempo do ano.</div>`;
  const T=calDias(a.inicio,a.fim)+1,pos=d=>Math.max(0,Math.min(100,calDias(a.inicio,d)/T*100)),w=(x,y)=>Math.max(0,(calDias(x,y)+1)/T*100),hj=calHoje();
  let P=[];try{P=calPeriodos(a).filter(p=>p.ini&&p.fim)}catch(e){}
  let h=P.length?P.map(p=>`<div class="seg per" style="left:${pos(p.ini)}%;width:${w(p.ini>a.inicio?p.ini:a.inicio,p.fim<a.fim?p.fim:a.fim)}%" title="${p.n}.º período · ${calDM(p.ini)} a ${calDM(p.fim)}"><span>${p.n}.º período</span></div>`).join("")
    :`<div class="seg per" style="left:0;width:100%"></div>`;
  // dias sem aulas seguidos (interrupções) e feriados soltos
  const NL=N.NL||new Map(),run=[];let cur=null;
  for(let d=a.inicio,k=0;d<=a.fim&&k<500;d=calMais(d,1),k++){const x=NL.get(d);if(x){if(cur&&cur.t===x.t&&cur.n===x.n&&calMais(cur.ate,1)===d)cur.ate=d;else{cur={t:x.t,n:x.n,de:d,ate:d};run.push(cur)}}}
  for(const r of run){const wd=calD(r.de).getDay();if(r.t==="fer"&&(wd===0||wd===6))continue;
    h+=r.t==="fer"?`<div class="seg fer" style="left:${pos(r.de)}%;width:${w(r.de,r.ate)}%" title="${esc(r.n)} · ${calDM(r.de,{weekday:"short",day:"numeric",month:"short"})}"></div>`
      :`<div class="seg int" style="left:${pos(r.de)}%;width:${w(r.de,r.ate)}%" title="${esc(r.n)} · ${calDM(r.de)}${r.ate!==r.de?" a "+calDM(r.ate):""}"></div>`}
  if(hj>a.inicio)h+=`<div class="seg done" style="left:0;width:${hj>a.fim?100:pos(hj)}%"></div>`;
  for(let m=calD(a.inicio);;){m=new Date(m.getFullYear(),m.getMonth()+1,1,12);const s=calS(m);if(s>a.fim)break;h+=`<span class="mes" style="left:${pos(s)}%">${m.toLocaleDateString("pt-PT",{month:"short"}).replace(".","")}</span>`}
  if(hj>=a.inicio&&hj<=a.fim)h+=`<div class="hoje" style="left:${pos(hj)}%" title="Hoje, ${calDM(hj,{weekday:"long",day:"numeric",month:"long"})}"></div>`;
  return `<div class="ay-rib">${h}</div><div class="ay-leg"><span><i style="background:var(--sky)"></i>Aulas${P.length?" (por período)":""}</span><span><i style="background:repeating-linear-gradient(135deg,#f5b84a 0 3px,#fde7bd 3px 6px)"></i>Interrupções</span><span><i style="background:#dc4a4a;width:4px"></i>Feriados</span>${P.length?"":`<span>Os períodos aparecem quando importar o <a href="#" data-ayir="cal">Calendário Escolar</a></span>`}</div>`}
function ayStats(a,N){const hj=calHoje(),st=[],s=(t,v,em)=>st.push(`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`);
  if(!N.tot)return "";
  if(hj<a.inicio){const d=calDias(hj,a.inicio);s("As aulas começam",d===1?"amanhã":`daqui a ${d} dias`,calDM(a.inicio,{weekday:"long",day:"numeric",month:"long"}));s("Dias letivos no ano",N.tot,`≈ ${Math.round(N.tot/5)} semanas de aulas`)}
  else if(hj>a.fim){s("Ano concluído",N.tot+" dias letivos",`${calDM(a.inicio)} a ${calDM(a.fim)}`)}
  else{s("Dias letivos que faltam",N.falta,`de ${N.tot} · ≈ ${Math.round(N.falta/5)} semanas`);
    let P=[];try{P=calPeriodos(a)}catch(e){}const np=calPeriodoDe(a,hj,P),p=P.find(x=>x.n===np);
    if(p){const f=calLetivos(a,hj,p.fim,N.NL);s(`${np}.º período`,f===1?"último dia":`faltam ${f} dias`,`termina a ${calDM(p.fim,{weekday:"short",day:"numeric",month:"short"})}`)}
    let FER=[];try{FER=calFeriados(a)}catch(e){}
    const prox=(a.ferias||[]).filter(f=>f&&f.de&&f.de>hj&&!calEhFeriado(f,FER)).sort((x,y)=>x.de.localeCompare(y.de))[0];
    if(prox){const d=calLetivos(a,hj,calMais(prox.de,-1),N.NL);s("Próxima pausa",esc(prox.nome||"Interrupção"),`${d===0?"começa já":`daqui a ${d} dia${d===1?"":"s"} de aulas`} · ${calDM(prox.de)}${prox.ate&&prox.ate!==prox.de?" a "+calDM(prox.ate):""}`)}
    const pf=FER.filter(f=>f.data>=hj&&f.data<=a.fim&&calD(f.data).getDay()%6!==0)[0];
    if(pf)s("Próximo feriado",esc(pf.nome),calDM(pf.data,{weekday:"long",day:"numeric",month:"long"}))}
  return `<div class="ay-stats">${st.join("")}</div>`}
function ayTurmas(a){const T=turmasDoAno(a);if(!T.length)return `<p class="hint" style="margin:14px 0 0">Ainda não há turmas neste ano letivo — crie-as em <a href="#" data-ayir="tur">Turmas</a>.</p>`;
  const G=new Map();for(const t of T){const fin=t.anoFim&&t.anoFim===a.ini+1,k=fin?"fin":anoCurricular(t,a)||"—";if(!G.has(k))G.set(k,[]);G.get(k).push(t)}
  const ord=[...G.keys()].sort((x,y)=>x==="fin"?1:y==="fin"?-1:COLL_PTN.compare(String(x),String(y)));
  return `<div class="ay-tur">${ord.map(k=>`<div class="ay-tg"><span>${k==="fin"?"Finalistas":k==="1.º ano"?"Entram este ano":esc(k)}</span>${G.get(k).map(t=>`<span class="ay-chip ${k==="fin"?"fin":k==="1.º ano"?"c1":"c2"}" title="${esc(turmaNome(t))}">${esc(t.cod)}</span>`).join("")}</div>`).join("")}</div>`}
function ayDatas(a,ed){return `<span class="ay-dates"><input type="date" data-k="inicio" value="${esc(a.inicio||"")}" title="Início das aulas" ${ed?"":"disabled"}> → <input type="date" data-k="fim" value="${esc(a.fim||"")}" title="Fim das aulas" ${ed?"":"disabled"}></span>`}
// 0.9.132: escolha do ano letivo que se vê (não muda o ano ativo) e apagar anos letivos
var AY_VER=null;
function anoResumo(a){let pl=0,hor=false,pap=0,cr=0;try{pl=pcPlanos().filter(p=>p.anoId===a.id).length}catch(e){}try{hor=!!(ESD.porAno&&ESD.porAno[a.id]&&ESD.porAno[a.id].estado)}catch(e){}
  try{pap=PAP.provas.filter(p=>p&&p.anoId===a.id).length}catch(e){}try{const c=crCfg();cr=(c.corr||[]).filter(x=>x&&x.anoId===a.id).length+(c.man||[]).filter(x=>x&&x.anoId===a.id).length}catch(e){}
  const f=(a.ferias||[]).length,p=[`${f} interrupç${f===1?"ão":"ões"} e feriados`];if(pl)p.push(`${pl} plano${pl===1?"":"s"} curricular${pl===1?"":"es"}`);p.push(hor?"com horário":"sem horário");if(pap)p.push(`${pap} PAP`);if(cr)p.push(`${cr} registo${cr===1?"":"s"} do Crono360`);
  return{n:f+pl*5+(hor?10:0)+pap*3+cr,txt:p.join(" · ")}}
function anoApagar(a){const E=escData();if(E.anos.length<2){toast("Tem de ficar pelo menos um ano letivo");return}
  const r=anoResumo(a),eraAtivo=a.id===E.ativo,cy=anoCorrente();let novo=null;
  if(eraAtivo)novo=E.anos.filter(x=>x!==a).sort((x,y)=>Math.abs(x.ini-cy)-Math.abs(y.ini-cy)||y.ini-x.ini)[0];
  if(!confirm(`Apagar o ano letivo ${a.nome}?\n\nTem: ${r.txt}.\n\nAs turmas, os cursos e os dados ligados a este ano (planos, horário, cronogramas, PAP) não são apagados — só deixam de aparecer. Pode anular com Ctrl+Z ou num ponto de restauro.${eraAtivo?`\n\nÉ o ano ativo: o ano ativo passa a ser ${novo.nome}.`:""}`))return;
  ponto("Antes de apagar o ano letivo "+a.nome);E.anos=E.anos.filter(x=>x!==a);if(eraAtivo)E.ativo=novo.id;if(AY_VER===a.id)AY_VER=null;
  save();escRender();if(eraAtivo){try{esRecarregar()}catch(x){}try{aplicarLogos()}catch(x){}}toast(`Ano letivo ${a.nome} apagado${eraAtivo?` · ativo: ${novo.nome}`:""} (pode anular)`)}
// troca um id de ano letivo por outro em todos os dados; se o outro já tiver dados nessa chave, os do primeiro ficam como estão (nada se perde)
function anoRemap(o,de,para,top){if(Array.isArray(o))return o.map(x=>anoRemap(x,de,para));
  if(o&&typeof o==="object"){const r={};for(const k of Object.keys(o)){if(top&&k==="_del"){r[k]=o[k];continue}r[k===de&&!(para in o)?para:k]=anoRemap(o[k],de,para)}return r}
  return o===de?para:o}
function juntarAnos(ficaId,saiIds){const E=escData(),f=E.anos.find(a=>a.id===ficaId);if(!f)return;const S=E.anos.filter(a=>a!==f&&saiIds.includes(a.id));if(!S.length)return;
  ponto(`Antes de juntar os anos letivos repetidos ${f.nome}`);
  const ch=x=>[x.de||"",x.ate||"",norm(String(x.nome||""))].join("|");
  for(const s of S){const tem=new Set((f.ferias||[]).map(ch));f.ferias=(f.ferias||[]).concat((s.ferias||[]).filter(x=>x&&!tem.has(ch(x))));
    for(const k in s)if(!(k in f)&&k!=="auto"&&k!=="id")f[k]=s[k];
    if(!f.inicio&&s.inicio)f.inicio=s.inicio;if(!f.fim&&s.fim)f.fim=s.fim;
    E.anos=E.anos.filter(a=>a!==s);if(E.ativo===s.id)E.ativo=f.id}
  delete f.auto;
  for(const s of S){cfg=anoRemap(cfg,s.id,f.id,true);try{ESD=anoRemap(ESD,s.id,f.id)}catch(e){}try{CR=anoRemap(CR,s.id,f.id)}catch(e){}try{PAP=anoRemap(PAP,s.id,f.id)}catch(e){}try{LOGOS=anoRemap(LOGOS,s.id,f.id)}catch(e){}}
  try{esdGuardar()}catch(e){}try{crGuardar()}catch(e){}try{papGuardar()}catch(e){}try{localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}catch(e){}
  AY_VER=null;save();escRender();try{esRecarregar()}catch(e){}try{aplicarLogos()}catch(e){}
  toast(`Ficou um só ano letivo ${f.nome}: as interrupções e os dados dos repetidos passaram para ele`)}
function ayRepetidosHTML(ed){const R=anosRepetidos();if(!R.size)return"";const vistos=new Set(),at=escData().ativo;let h="";
  for(const L of R.values()){if(vistos.has(L[0].id))continue;L.forEach(a=>vistos.add(a.id));
    const rs=L.map(a=>({a,r:anoResumo(a)})),melhor=rs.slice().sort((x,y)=>y.r.n-x.r.n||(y.a.id===at)-(x.a.id===at))[0].a;
    h+=`<div class="msg warn ay-rep"><b>Há ${L.length} anos letivos ${esc(L[0].nome)} repetidos</b> (mesmo ano de início e de fim). Escolha com qual fica: as interrupções, os planos, o horário e os outros dados dos restantes passam para ele — não se perde nada.
      <div class="ay-rep-l">${rs.map(({a,r})=>`<div class="ay-rep-i"><span><b>${esc(a.nome)}</b>${a.id===at?` <span class="tag" style="background:var(--okbg);color:var(--ok)">Ativo</span>`:""}${a===melhor?` <span class="tag" style="background:var(--brandbg);color:var(--brand)">tem mais dados</span>`:""}<br><small>${esc(a.inicio||"?")} → ${esc(a.fim||"?")} · ${esc(r.txt)}</small></span>
        ${ed?`<button class="b s" data-ayjuntar="${a.id}" data-ayrep="${L.map(x=>x.id).join(",")}">Ficar com este</button>`:""}</div>`).join("")}</div></div>`}
  return h}
function renderAnos(){const e=escData(),at0=anoAtivo(),ed=!RO;
  // ---- a escolha do ano letivo (o que se vê aqui; o ativo muda-se com «Tornar ativo») ----
  const at=e.anos.find(a=>a.id===AY_VER)||at0;if(at.id===at0.id)AY_VER=null;const ehAtivo=at.id===e.ativo,R=anosRepetidos();
  $("#ayEsc").innerHTML=`<div class="ay-esc" role="tablist" aria-label="Escolher o ano letivo">${anosOrd().map(a=>`<button type="button" role="tab" aria-selected="${a.id===at.id}" class="ay-ch ${a.id===at.id?"on":""} ${R.has(a.id)?"rep":""}" data-ayver="${a.id}" title="${esc(a.nome)} · ${ayEstado(a)==="ativo"?"ano ativo":ayEstado(a)==="prep"?"em preparação":"encerrado"}${R.has(a.id)?" · repetido":""}">${esc(a.nome)}${a.id===e.ativo?`<i>ativo</i>`:""}</button>`).join("")}</div>`+ayRepetidosHTML(ed);
  // ---- o ano escolhido ----
  const N=ayNumeros(at),nT=turmasDoAno(at).length,tem=ESD.porAno&&ESD.porAno[at.id]&&ESD.porAno[at.id].estado;
  $("#ayHero").innerHTML=`<div class="ay-hero ${ehAtivo?"":"ver"}" data-ano="${at.id}">
    <div class="ay-top"><input class="ay-name" data-k="nome" value="${esc(at.nome)}" ${ed?"":"disabled"} aria-label="Ano letivo">${ayTag(at)}${ayDatas(at,ed)}<span class="grow"></span>
      ${N.tot?`<div class="ay-pct"><b>${N.pct}%</b>${N.feitos} de ${N.tot} dias letivos dados</div>`:""}</div>
    ${ayFita(at,N)}${ayStats(at,N)}${ayTurmas(at)}
    <div class="ay-acts"><button class="b s" data-ayir="cal">Calendário Escolar</button><button class="b s" data-ayir="ferias">Interrupções e feriados (${(at.ferias||[]).length})</button><button class="b s" data-ayir="tur">${nT} turma${nT===1?"":"s"}</button>${tem?`<button class="b s" data-ayir="esch">Horário</button>`:""}
      ${ed?`<span class="grow"></span>${ehAtivo?"":`<button class="b s" data-ativar>Tornar ativo</button>`}${e.anos.length>1?`<button class="b s danger" data-del title="Apagar o ano letivo ${esc(at.nome)}">Apagar ano letivo</button>`:""}`:""}</div></div>`;
  // ---- os outros anos e o seguinte ----
  const outros=anosOrd().reverse().filter(a=>a.id!==at.id);
  const y=Math.max(...e.anos.map(a=>a.ini))+1,sg=aySugestao(y),seg={ini:y},ant=e.anos.find(x=>x.ini===y-1);
  const Tn=turmasDoAno(seg),cont=Tn.filter(t=>t.anoIni&&t.anoIni<y).length,novas=Tn.filter(t=>t.anoIni===y).length,acabam=ant?turmasDoAno(ant).filter(t=>t.anoFim===y).length:0;
  const nf=ant?(ant.ferias||[]).length:0;
  const dC=d=>{const m=/^(\d{4})-(\d\d)-(\d\d)$/.exec(d||"");return m?`${m[3]}/${m[2]}/${m[1]}`:""};
  const resumo=[dC(sg.ini)?`começa a ${dC(sg.ini)}`:"",`${cont} turma${cont===1?"":"s"} continua${cont===1?"":"m"}`,acabam?`${acabam} conclu${acabam===1?"i":"em"}`:""].filter(Boolean).join(" · ");
  const novo=ed?`<details class="ay-new" id="ayNew"><summary title="Criar o ano letivo ${y}/${y+1}">
      <span class="pl" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>
      <span class="tx"><b>Preparar ${y}/${y+1}</b><small>${esc(resumo.charAt(0).toUpperCase()+resumo.slice(1))}</small></span>
      <svg class="chev" aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></summary>
    <form id="naForm" autocomplete="off">
      <label>Ano letivo<input type="text" id="naNome" placeholder="${y}/${y+1}"></label>
      <div class="r2"><label>Início<input type="date" id="naIni" value="${sg.ini}"></label><label>Fim<input type="date" id="naFim" value="${sg.fim}"></label></div>
      <label class="chip"><input type="checkbox" id="naCopiar" ${nf?"checked":"disabled"}> copiar as ${nf} interrupções de ${esc(ant?ant.nome:"—")}</label>
      <label class="chip"><input type="checkbox" id="naAtivo"> tornar ativo já</label>
      <div class="prev">${cont} turma${cont===1?"":"s"} continua${cont===1?"":"m"} · ${acabam} conclu${acabam===1?"i":"em"} em ${y-1}/${y}${novas?` · ${novas} nova${novas===1?"":"s"} já registada${novas===1?"":"s"}`:""}.<br>O início sugerido cai no mesmo dia da semana do deste ano; o Carnaval e a Páscoa acompanham a data da Páscoa de ${y+1}.</div>
      <button class="b" type="submit">Criar ${y}/${y+1}</button></form></details>`:"";
  $("#ayOthers").innerHTML=outros.map(a=>{const n=ayNumeros(a),s=ayEstado(a),nt=turmasDoAno(a).length;
    return `<div class="ay-o ${s==="prep"?"prep":""}" data-ano="${a.id}">
      <div style="display:flex;align-items:center;gap:8px"><input class="ay-name" data-k="nome" value="${esc(a.nome)}" ${ed?"":"disabled"} aria-label="Ano letivo">${ayTag(a)}</div>
      ${ayDatas(a,ed)}<div class="ay-mini" title="${n.pct}% dos dias letivos"><i style="width:${n.pct}%"></i></div>
      <span class="hint" style="margin:0">${nt} turma${nt===1?"":"s"} · ${n.tot||"—"} dias letivos · ${(a.ferias||[]).length} interrupções/feriados</span>
      ${ed?`<div style="display:flex;gap:6px"><button class="b s" data-ayver="${a.id}">Ver</button>${a.id===e.ativo?"":`<button class="b s" data-ativar>Tornar ativo</button>`}</div>${e.anos.length>1?`<button class="x" title="Apagar o ano letivo ${esc(a.nome)}" data-del>×</button>`:""}`:""}</div>`}).join("")+novo;
  // ---- interrupções (o seletor de ano) ----
  const sel=$("#ferAno");const cur=sel.value;sel.innerHTML=anosOrd().map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join("");sel.value=anosOrd().some(a=>a.id===cur)?cur:e.ativo;
  renderFerias();ayGantt()}
// percurso das turmas: uma linha por turma, uma coluna por ano letivo
function ayGantt(){const e=escData(),at=anoAtivo(),T=e.turmas.filter(t=>t.anoIni&&t.anoFim&&t.anoFim>t.anoIni);
  if(!T.length){$("#ayGantt").innerHTML=`<p class="hint">As turmas aparecem aqui quando tiverem ano de início e de fim (em <a href="#" data-ayir="tur">Turmas</a>).</p>`;return}
  const ys=[...e.anos.map(a=>a.ini),...T.map(t=>t.anoIni),...T.map(t=>t.anoFim-1)],y0=Math.min(...ys),y1=Math.max(...ys),Y=[];for(let y=y0;y<=y1&&Y.length<12;y++)Y.push(y);
  const L=T.slice().sort((a,b)=>a.anoIni-b.anoIni||COLL_PTN.compare(String(a.cod),String(b.cod)));const sem=e.turmas.length-T.length;
  const yy=n=>String(n).slice(-2);
  $("#ayGantt").innerHTML=`<div class="ay-g"><table><thead><tr><th></th>${Y.map(y=>`<th class="${y===at.ini?"on":""} ${e.anos.some(a=>a.ini===y)?"":"nx"}" ${e.anos.some(a=>a.ini===y)?"":`title="Ano letivo ainda não criado"`}>${yy(y)}/${yy(y+1)}</th>`).join("")}</tr></thead><tbody>
    ${L.map(t=>{const c=cursoById(t.cursoId),dur=t.anoFim-t.anoIni;return `<tr><td class="nm" title="${esc(turmaNome(t))}">${turDot(t)}<b>${esc(t.cod)}</b> <span>${esc(c?c.nome:"")}</span></td>${Y.map(y=>{const i=y-t.anoIni;if(i<0||i>=dur)return `<td class="${y===at.ini?"on":""}"></td>`;
      return `<td class="${y===at.ini?"on":""}"><div class="bar y${Math.min(3,i+1)} ${i===0?"s":""} ${i===dur-1?"e fin":""} ${y<at.ini?"past":""}" style="background:${esc(turmaCor(t))}" title="${esc(t.cod)} · ${i+1}.º ano em ${y}/${y+1}">${i+1}.º</div></td>`}).join("")}</tr>`}).join("")}</tbody></table></div>
    ${sem?`<p class="hint" style="margin:8px 0 0">${sem} turma${sem===1?"":"s"} sem ano de início e de fim não aparece${sem===1?"":"m"} aqui.</p>`:""}`}

function renderFerias(){const a=escData().anos.find(x=>x.id===$("#ferAno").value)||anoAtivo(),FER=calFeriados(a),SEM=["dom","seg","ter","qua","qui","sex","sáb"];
  // mostra por ordem de data (sem mexer na ordem guardada); as linhas sem data ficam no fim
  const L=(a.ferias||[]).map((f,i)=>({f,i})).filter(x=>x.f).sort((x,y)=>(x.f.de?0:1)-(y.f.de?0:1)||String(x.f.de).localeCompare(String(y.f.de)));
  const util=d=>{const w=calD(d).getDay();return w>0&&w<6};let nInt=0,nFer=0,nUteis=0;
  const linhas=L.map(({f,i})=>{const ate=f.ate||f.de,fer=calEhFeriado(f,FER);let dur="",av="",cls="";
    if(f.de){if(ate<f.de){av="«Até» é antes de «De»";cls="bad"}else{let n=0,u=0;for(let d=f.de,k=0;d<=ate&&k<400;d=calMais(d,1),k++){n++;if(util(d))u++}
      fer?nFer++:nInt++;nUteis+=u;
      dur=n===1?`1 dia · ${SEM[calD(f.de).getDay()]}`:`${n} dias · ${u} út${u===1?"il":"eis"}`;
      if(!u){av=n===1?"calha ao fim de semana: não tira aulas":"só fim de semana: não tira aulas";cls="warn"}
      else if((a.inicio&&ate<a.inicio)||(a.fim&&f.de>a.fim)){av="fora das aulas do ano letivo";cls="warn"}
      else{const sob=L.find(y=>y.i!==i&&y.f.de&&f.de<=(y.f.ate||y.f.de)&&ate>=y.f.de&&!(calEhFeriado(y.f,FER)!==fer));if(sob){av=`sobrepõe-se a «${sob.f.nome||"?"}»`;cls="warn"}}}}
    else{av="falta a data";cls="warn"}
    return `<tr data-i="${i}" class="${cls?"fer-"+cls:""}"><td><span class="fer-tp ${fer?"f":"i"}">${fer?"Feriado":"Interrupção"}</span></td><td><input type="text" data-k="nome" value="${esc(f.nome)}"></td><td><input type="date" data-k="de" value="${esc(f.de)}"></td><td><input type="date" data-k="ate" value="${esc(f.ate)}"${f.de?` min="${esc(f.de)}"`:""}></td><td class="fer-dur">${esc(dur)}${av?`<small class="${cls}">${esc(av)}</small>`:""}</td><td><button class="x" data-del title="Remover">×</button></td></tr>`}).join("");
  $("#tbFer").innerHTML=linhas||`<tr><td colspan="6" class="hint">Sem interrupções letivas nem feriados registados em ${esc(a.nome)}.</td></tr>`;
  // resumo e feriados que faltam (dias úteis dentro das aulas, sem estarem cobertos por nenhuma linha)
  const falta=FER.filter(x=>util(x.data)&&(!a.inicio||x.data>=a.inicio)&&(!a.fim||x.data<=a.fim)&&!(a.ferias||[]).some(f=>f&&f.de&&x.data>=f.de&&x.data<=(f.ate||f.de)));
  let let_="";try{if(a.inicio&&a.fim)let_=calLetivos(a,a.inicio,a.fim)}catch(e){}
  $("#ferRes").innerHTML=`<div class="fer-res"><span><b>${nInt}</b> interrupç${nInt===1?"ão":"ões"}</span><span><b>${nFer}</b> feriado${nFer===1?"":"s"}</span><span><b>${nUteis}</b> dia${nUteis===1?"":"s"} úte${nUteis===1?"l":"is"} sem aulas</span>${let_!==""?`<span><b>${let_}</b> dias letivos no ano</span>`:""}</div>`
    +(falta.length?`<div class="msg info" style="margin:0 0 10px">Falta${falta.length===1?"":"m"} ${falta.length} feriado${falta.length===1?"":"s"} em dia útil: ${falta.map(x=>`${esc(x.nome)} (${esc(calDM(x.data,{weekday:"short",day:"numeric",month:"short"}))})`).join(", ")}. O Horários360 conta-${falta.length===1?"o":"os"} como dia${falta.length===1?"":"s"} de aulas. <button class="b s" id="ferFaltaAdd" style="margin-left:6px">Acrescentar</button></div>`:"");
  const fb=$("#ferFaltaAdd");if(fb)fb.onclick=()=>{ponto("Antes de acrescentar feriados");falta.forEach(x=>a.ferias.push({id:"cal-f-"+x.data,nome:x.nome,de:x.data,ate:x.data,tipo:"feriado"}));save();renderFerias();try{esRecarregar()}catch(e){}toast(falta.length+" feriado(s) acrescentado(s)")}}
function ayIr(k){if(k==="ferias"){const c=$("#ferAno");if(c){c.value=AY_VER||escData().ativo;renderFerias();c.closest(".card").scrollIntoView({behavior:"smooth",block:"start"})}return}show(k)}
$("#anos").addEventListener("click",e=>{const l=e.target.closest("[data-ayir]");if(l){e.preventDefault();ayIr(l.dataset.ayir);return}
  const v=e.target.closest("[data-ayver]");if(v){AY_VER=v.dataset.ayver;renderAnos();const h=$("#ayHero");if(h&&e.target.closest(".ay-o"))h.scrollIntoView({behavior:"smooth",block:"nearest"});return}
  const j=e.target.closest("[data-ayjuntar]");if(j){const E=escData(),f=E.anos.find(x=>x.id===j.dataset.ayjuntar),sai=j.dataset.ayrep.split(",").filter(x=>x!==j.dataset.ayjuntar);if(!f)return;
    if(!confirm(`Ficar só com o ano letivo ${f.nome} escolhido?\n\nOs outros ${sai.length} repetido(s) juntam-se a este: as interrupções e os feriados que faltam e os dados ligados (planos, horário, cronogramas, PAP) passam para ele. Não se perde nada; é criado um ponto de restauro antes.`))return;
    juntarAnos(f.id,sai);return}
  const box=e.target.closest("[data-ano]");if(!box)return;const E=escData(),a=E.anos.find(x=>x.id===box.dataset.ano);if(!a)return;
  if(e.target.closest("[data-ativar]")){mudarAnoAtivo(a.id);return}
  if(e.target.closest("[data-del]")){anoApagar(a);return}});
$("#anos").addEventListener("change",e=>{const box=e.target.closest("[data-ano]"),k=e.target.dataset.k;if(!box||!k)return;const a=escData().anos.find(x=>x.id===box.dataset.ano);if(!a)return;
  const v=e.target.value.trim();if(k==="nome"&&!v){e.target.value=a.nome;return}
  if(k==="nome"){const o=anoIgual(v,a.id);if(o){e.target.value=a.nome;toast(`Já existe o ano letivo ${o.nome}: não pode haver dois com o mesmo nome ou com o mesmo ano de início e de fim`);return}}
  delete a.auto;a[k]=v;if(k==="nome"){const m=a.nome.match(/(\d{4})/);if(m)a.ini=+m[1]}save();escRender();esRecarregar()});
$("#anos").addEventListener("submit",e=>{if(e.target.id!=="naForm")return;e.preventDefault();const E=escData();const y0=Math.max(...E.anos.map(a=>a.ini))+1;
  const nome=$("#naNome").value.trim()||(y0+"/"+(y0+1)),m=nome.match(/(\d{4})/),y=m?+m[1]:y0;
  {const o=anoIgual(nome);if(o){escLinhaMsg("#naMsg",`O ano letivo ${esc(o.nome)} já existe — não pode haver dois com o mesmo nome ou com o mesmo ano de início e de fim.`,"bad");return}}
  const a=novoAno(y);a.nome=nome;if($("#naIni").value)a.inicio=$("#naIni").value;if($("#naFim").value)a.fim=$("#naFim").value;
  const ant=E.anos.find(x=>x.ini===y-1);if(ant&&$("#naCopiar").checked)a.ferias=ayCopiarFerias(ant,a);
  const ativar=$("#naAtivo").checked;E.anos.push(a);if(ativar)E.ativo=a.id;save();escRender();if(ativar)esRecarregar();
  const nT=turmasDoAno(a).length;escLinhaMsg("#naMsg",`Ano letivo ${esc(nome)} criado${ativar?" e ativo":""} com ${a.ferias.length} interrupções. ${nT} turma(s) estão nesse ano (pelas datas de início e fim de cada turma).`,"ok")});

$("#ferAno").addEventListener("change",renderFerias);
$("#tbFer").addEventListener("change",e=>{const a=escData().anos.find(x=>x.id===$("#ferAno").value);const tr=e.target.closest("tr");if(!a||!tr||!e.target.dataset.k)return;delete a.auto;const f=a.ferias[+tr.dataset.i],k=e.target.dataset.k;f[k]=e.target.value;
  if(k==="de"&&f.de&&(!f.ate||f.ate<f.de))f.ate=f.de;save();if(k!=="nome")renderFerias();esRecarregar()});
$("#tbFer").addEventListener("click",e=>{if(!e.target.hasAttribute("data-del"))return;const a=escData().anos.find(x=>x.id===$("#ferAno").value);a.ferias.splice(+e.target.closest("tr").dataset.i,1);save();renderFerias();esRecarregar()});
$("#ferAdd").onclick=()=>{const a=escData().anos.find(x=>x.id===$("#ferAno").value);delete a.auto;a.ferias.push({nome:"Interrupção letiva",de:"",ate:""});save();renderFerias();const r=$("#tbFer tr:last-child input[data-k=nome]");if(r){r.focus();r.select()}};

