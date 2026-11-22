/* ===================== PAP360 › Organizar os dias da PAP (0.9.222) =====================
   Planeador por cima da tabela «Formandos, júri e horário»: uma coluna por dia (cada dia com a sua cor), uma coluna «Sem data»,
   e um cartão por formando com a hora de início e de fim.
   - Arrastar um cartão (rato, ou pela pega no telemóvel/iPad) para outro sítio do mesmo dia ou de outro dia: as horas desse(s) dia(s)
     são refeitas pela nova ordem (início do dia, duração de cada prova e pausa do almoço, afináveis em cada dia).
   - Largar em cima de outro cartão troca os dois (data e hora).
   - Tocar num cartão e depois noutro também troca; tocar em «Mover para aqui» num dia move-o para o fim desse dia.
   - «Anular» desfaz a última mudança. Início e fim da PAP (primeiro e último dia, primeira e última hora) no topo.
   Os dados continuam a ser c.data e c.hora de cada formando (documentos, atas e envio ao júri não mudam). Os acertos de cada dia
   (início, duração, pausa, cor) e os dias acrescentados à mão ficam em P.plano = {dias:{"AAAA-MM-DD":{ini,dur,pde,pate,cor}},ocultos:{}}. */
const PAP_PL_COR=["#4da3ff","#ff8a5c","#9b8cff","#ffb547","#ff6f9e","#e06cf0","#5b7cfa","#c08457","#e5484d","#7a8699"]; // sem verde (é dos botões de importar)
const PAP_PL_DS=["dom","seg","ter","qua","qui","sex","sáb"];
var PAP_PL_UNDO={},PAP_PL_SEL=null,PAP_PL_ARR=null;
function papPl(P){if(!P.plano||typeof P.plano!=="object")P.plano={};if(!P.plano.dias||typeof P.plano.dias!=="object")P.plano.dias={};if(!P.plano.ocultos||typeof P.plano.ocultos!=="object")P.plano.ocultos={};return P.plano}
// valores por omissão de cada dia, tirados das horas em PAP360 › Definições (início da 1.ª hora, duração, intervalo do almoço)
function papPlBase(){const H=papDef().horas||[],h0=H[0]||"08:30 - 09:30",ini=papHIni(h0)??510,fim=papHFim(h0),dur=fim&&fim>ini?fim-ini:60;let pde=null,pate=null;
  for(let i=0;i+1<H.length;i++){const a=papHFim(H[i]),b=papHIni(H[i+1]);if(a!=null&&b!=null&&b-a>=30){pde=a;pate=b;break}}return {ini,dur,pde,pate}}
function papPlDia(P,d){const b=papPlBase(),x=papPl(P).dias[d]||{},m=s=>s===""?null:(papHIni(s)??null);
  return {ini:x.ini?m(x.ini)??b.ini:b.ini,dur:+x.dur>0?+x.dur:b.dur,pde:x.pde!==undefined?m(x.pde):b.pde,pate:x.pate!==undefined?m(x.pate):b.pate,cor:x.cor}}
function papPlDias(P){const pl=papPl(P),I=papInc(P),S=new Set();I.forEach(c=>{if(c.data)S.add(c.data)});Object.keys(pl.dias).forEach(d=>{if(pl.dias[d]&&pl.dias[d].manual)S.add(d)});
  papDatasCal(P).forEach(d=>{if(!pl.ocultos[d])S.add(d)});return [...S].filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)).sort()}
function papPlCor(P,d,i){const x=papPl(P).dias[d];return PAP_PL_COR[(x&&x.cor!=null?x.cor:i)%PAP_PL_COR.length]}
function papPlDoDia(P,d){return papInc(P).filter(c=>(c.data||"")===d).sort((a,b)=>((papHIni(a.hora)??9999)-(papHIni(b.hora)??9999))||papOrdNome(a,b))}
// refaz as horas de um dia pela ordem dada
function papPlRefazer(P,d,L){if(!d){L.forEach(c=>{c.data="";c.hora=""});return}const X=papPlDia(P,d);let t=X.ini;
  for(const c of L){if(X.pde!=null&&X.pate!=null&&X.pate>X.pde&&t<X.pate&&t+X.dur>X.pde)t=X.pate;c.data=d;c.hora=papHM(t)+" - "+papHM(t+X.dur);t+=X.dur}}
function papPlFoto(P){PAP_PL_UNDO[P.id]=(PAP_PL_UNDO[P.id]||[]).slice(-29);PAP_PL_UNDO[P.id].push(P.cands.map(c=>[c.id,c.data||"",c.hora||""]))}
function papPlAnular(P){const L=PAP_PL_UNDO[P.id];if(!L||!L.length)return;const f=new Map(L.pop().map(x=>[x[0],x]));P.cands.forEach(c=>{const x=f.get(c.id);if(x){c.data=x[1];c.hora=x[2]}});papPlFim(P,"Mudança anulada.")}
function papPlFim(P,msg){PAP_PL_SEL=null;papGuardar(P);papCandsUI(P);if(msg)try{toast(msg)}catch(e){}}
function papPlTrocar(P,a,b){if(a===b)return;papPlFoto(P);const d=a.data,h=a.hora;a.data=b.data;a.hora=b.hora;b.data=d;b.hora=h;
  // se um dos dois estava «sem data», o outro passa a «sem data» e o dia é refeito
  papPlFim(P,`Trocados: ${a.nome} e ${b.nome}.`)}
function papPlMover(P,c,d,idx){papPlFoto(P);const de=c.data||"";const alvo=papPlDoDia(P,d).filter(x=>x!==c);idx=Math.max(0,Math.min(idx==null?alvo.length:idx,alvo.length));alvo.splice(idx,0,c);
  if(de&&de!==d)papPlRefazer(P,de,papPlDoDia(P,de).filter(x=>x!==c));if(d)papPlRefazer(P,d,alvo);else{c.data="";c.hora=""}
  papPlFim(P,d?`${c.nome}: ${calDM(d,{weekday:"short",day:"numeric",month:"short"})}, ${c.hora}.`:`${c.nome} ficou sem data.`)}
// sobreposições de horas no mesmo dia (quando as horas foram escritas à mão)
function papPlSobre(L){const S=new Set();for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j],ai=papHIni(a.hora),af=papHFim(a.hora),bi=papHIni(b.hora),bf=papHFim(b.hora);
  if(ai!=null&&bi!=null&&af!=null&&bf!=null&&ai<bf&&bi<af){S.add(a.id);S.add(b.id)}}return S}
function papPlDiaNome(d,longo){const x=calD(d);if(!longo)return PAP_PL_DS[x.getDay()]+" "+calDM(d);const t=x.toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"});return t.charAt(0).toUpperCase()+t.slice(1)}

// quantas provas cabem num dia com os acertos por omissão (início, duração, pausa) — por omissão, as horas das Definições
function papPlCap(){const n=(papDef().horas||[]).length;return n||8}
// substitui as datas de todas as provas pelas datas da PAP do Calendário Escolar (pela ordem atual: dia, hora, nome)
function papPlCalendario(P,modo){const C=papDatasCal(P);if(!C.length)return;const L=papInc(P).slice().sort(papOrdHora);if(!L.length)return;
  papPlFoto(P);const pl=papPl(P),cap=papPlCap(),G=C.map(()=>[]);
  if(modo==="igual"){const n=C.length,base=Math.floor(L.length/n),r=L.length%n;let k=0;C.forEach((d,i)=>{const q=base+(i<r?1:0);for(let j=0;j<q;j++)G[i].push(L[k++])})}
  else{let i=0;L.forEach(c=>{if(G[i].length>=cap&&i<C.length-1)i++;G[i].push(c)})}
  C.forEach((d,i)=>papPlRefazer(P,d,G[i]));
  Object.keys(pl.dias).forEach(d=>{if(!C.includes(d)&&pl.dias[d])delete pl.dias[d].manual});C.forEach(d=>{delete pl.ocultos[d]});
  const usados=C.filter((d,i)=>G[i].length).length;papPlFim(P,`Datas do Calendário Escolar aplicadas: ${L.length} prova(s) em ${usados} dia(s).`)}
function papPlanoUI(P){const box=document.getElementById("papPlano");if(!box)return;P=P||papProva();if(!P){box.innerHTML="";return}
  const ed=papEd(),I=papInc(P),dias=papPlDias(P),sem=I.filter(c=>!c.data),cal=new Set(papDatasCal(P)),pl=papPl(P);
  const marc=I.filter(c=>c.data&&papHIni(c.hora)!=null).sort(papOrdHora),pri=marc[0],ult=marc[marc.length-1];
  const fimDe=c=>papHM(papHFim(c.hora));
  const resumo=pri?`<div class="pl-ini"><span>Início</span><b>${esc(papPlDiaNome(pri.data,true))}</b><small>às ${esc(papHM(papHIni(pri.hora)))}</small></div>
    <div class="pl-ini"><span>Fim</span><b>${esc(papPlDiaNome(ult.data,true))}</b><small>às ${esc(fimDe(ult))}</small></div>
    <div class="pl-ini"><span>Provas</span><b>${marc.length} em ${new Set(marc.map(c=>c.data)).size} dia${new Set(marc.map(c=>c.data)).size===1?"":"s"}</b><small>${sem.length?sem.length+" sem data":"todas com data"}</small></div>`
    :`<div class="pl-ini"><span>Início e fim</span><b>Ainda sem provas marcadas</b><small>arraste os formandos de «Sem data» para um dia</small></div>`;
  const cartao=(c,cor,sob)=>{const e=papEstado(c),hi=papHIni(c.hora),hf=papHFim(c.hora),j=[c.j1,c.j2].map(x=>String(x||"").trim()).filter(Boolean);
    return `<div class="pl-c${PAP_PL_SEL===c.id?" sel":""}${sob.has(c.id)?" sob":""}" data-plc="${esc(c.id)}" style="--pc:${cor}" ${ed?'tabindex="0"':""} title="${esc(c.nome)}${c.tema?" — "+esc(c.tema):""}">
      ${ed?`<span class="pl-pega" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/></svg></span>`:""}
      <span class="pl-h">${hi!=null?`<b>${papHM(hi)}</b><small>${hf!=null?papHM(hf):""}</small>`:`<b>—</b>`}</span>
      <span class="pl-t"><b>${esc(c.nome)}</b>${String(c.tema||"").trim()?`<em class="pl-tema">${esc(c.tema)}</em>`:""}<small>${c.num?"n.º "+esc(c.num):""}${j.length?(c.num?" · ":"")+"júri: "+esc(j.join(", ")):(c.num?" · ":"")+'<i class="pl-sj">sem júri</i>'}</small></span>
      ${e.k!=="mu"?`<span class="pp-chip ${e.k} pl-e">${e.f!=null?e.f:e.txt.replace(/ \(.*/,"")}</span>`:""}</div>`};
  const col=(d,i)=>{const L=d?papPlDoDia(P,d):sem,cor=d?papPlCor(P,d,i):"#9aa3b2",sob=papPlSobre(L),X=d?papPlDia(P,d):null,f=L.filter(c=>papHIni(c.hora)!=null);
    const ab=d&&PAP_PL_ARR&&PAP_PL_ARR.cfg===d;
    return `<section class="pl-d${d?"":" pl-sem"}" data-pld="${esc(d)}" style="--pc:${cor}">
      <header>${d?`<button type="button" class="pl-cor" data-plcor="${esc(d)}" title="Mudar a cor deste dia" ${ed?"":"disabled"} aria-label="Mudar a cor do dia"></button>`:""}
        <div class="pl-dt"><b>${d?esc(papPlDiaNome(d,true)):"Sem data"}</b><small>${d?(f.length?`${papHM(papHIni(f[0].hora))} – ${papHM(papHFim(f[f.length-1].hora))} · `:"")+L.length+" prova"+(L.length===1?"":"s")+(cal.has(d)?" · Calendário Escolar":""):L.length?L.length+" por marcar":"todos marcados"}</small></div>
        ${d&&ed?`<button type="button" class="pl-ic" data-plcfg="${esc(d)}" title="Início, duração das provas e pausa deste dia" aria-label="Acertos do dia" aria-expanded="${ab?"true":"false"}"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg></button>`:""}</header>
      ${ab?`<div class="pl-cfg" data-plcfgd="${esc(d)}"><label>Início<input type="time" data-plk="ini" value="${papHM(X.ini)}"></label><label>Cada prova (min)<input type="number" min="10" max="240" step="5" data-plk="dur" value="${X.dur}"></label>
        <label>Pausa das<input type="time" data-plk="pde" value="${X.pde!=null?papHM(X.pde):""}"></label><label>às<input type="time" data-plk="pate" value="${X.pate!=null?papHM(X.pate):""}"></label>
        <div class="pl-cfgb"><button type="button" class="b s" data-plrefaz="${esc(d)}">Refazer as horas deste dia</button><button type="button" class="b s" data-plrem="${esc(d)}" title="As provas deste dia passam para «Sem data»">Tirar este dia</button></div></div>`:""}
      <div class="pl-l" data-pll="${esc(d)}">${L.map(c=>cartao(c,cor,sob)).join("")||`<div class="pl-vz">${d?"Arraste formandos para aqui":"Nenhum formando sem data"}</div>`}</div>
      ${ed&&PAP_PL_SEL&&(()=>{const s=P.cands.find(x=>x.id===PAP_PL_SEL);return s&&(s.data||"")!==d})()?`<button type="button" class="b s pl-aqui" data-plaqui="${esc(d)}">Mover para aqui</button>`:""}
    </section>`};
  const nU=(PAP_PL_UNDO[P.id]||[]).length;
  box.innerHTML=`<div class="pp-head"><div><h2>Organizar os dias da PAP</h2><p class="hint">${ed?"Arraste cada prova para a mudar de hora ou de dia (no telemóvel, pela pega à esquerda): as horas do dia são refeitas. Largue em cima de outra prova para as <b>trocar</b> — ou toque numa prova e depois noutra.":"Dias e horas das provas desta turma."}</p></div>
    ${ed?`<div class="pp-acts"><label class="pl-add">Acrescentar dia<input type="date" id="plNovoDia"></label>
      <button type="button" class="b s" id="plTema" title="Em cada dia, põe as provas por ordem do tema (as do mesmo tema ficam seguidas) e refaz as horas">Ordenar por tema</button>
      ${cal.size?`<button type="button" class="b s" id="plCal" aria-expanded="${PAP_PL_ARR&&PAP_PL_ARR.cal?"true":"false"}" title="Passa as provas para os dias da PAP marcados no Calendário Escolar">Usar as datas do Calendário</button>`:""}
      <button type="button" class="b s" id="plAnular"${nU?"":" disabled"} title="Desfaz a última mudança feita aqui">Anular</button></div>`:""}</div>
    ${ed&&cal.size&&PAP_PL_ARR&&PAP_PL_ARR.cal?`<div class="pl-calp"><div><b>Usar as datas do Calendário Escolar</b><span>${[...cal].sort().map(d=>esc(papPlDiaNome(d))).join(" · ")} — substitui as datas de todas as provas (pela ordem atual) e tira os dias que não estão no Calendário.</span></div>
      <div class="pl-calb"><button type="button" class="b s" data-plcal="encher">Encher os dias por ordem (até ${papPlCap()} por dia)</button><button type="button" class="b s" data-plcal="igual">Repartir por igual pelos ${cal.size} dias</button><button type="button" class="b s" data-plcal="x">Cancelar</button></div></div>`:""}
    <div class="pl-res">${resumo}</div>
    ${PAP_PL_SEL?`<div class="pl-selb">A trocar <b>${esc((P.cands.find(x=>x.id===PAP_PL_SEL)||{}).nome||"")}</b>: toque noutra prova para as trocar, ou em «Mover para aqui» num dia. <button type="button" class="b s" data-plcanc>Cancelar</button></div>`:""}
    <div class="pl-g">${dias.map(col).join("")}${col("",dias.length)}</div>`;
  // cores dos dias também na tabela de baixo
  document.querySelectorAll("#papCands tr[data-c]").forEach(tr=>{const c=P.cands.find(x=>x.id===tr.dataset.c),i=c&&c.data?dias.indexOf(c.data):-1;
    if(i>=0)tr.style.setProperty("--pd",papPlCor(P,c.data,i));else tr.style.removeProperty("--pd");tr.classList.toggle("pl-tem",i>=0)})}

/* ---------- eventos (ligados uma vez; o conteúdo é redesenhado) ---------- */
function papPlLigar(){const box=document.getElementById("papPlano");if(!box||box.__pl)return;box.__pl=1;
  box.addEventListener("click",e=>{const P=papProva();if(!P||!papEd())return;const t=e.target;
    if(t.closest("#plAnular")){papPlAnular(P);return}
    if(t.closest("#plTema")){papPlFoto(P);papPlDias(P).forEach(d=>papPlRefazer(P,d,papPlDoDia(P,d).sort((a,b)=>{const x=String(a.tema||"").trim(),y=String(b.tema||"").trim();return (!x)-(!y)||COLL_PT.compare(x,y)||papOrdNome(a,b)})));papPlFim(P,"Provas ordenadas por tema em cada dia.");return}
    if(t.closest("#plCal")){PAP_PL_ARR=PAP_PL_ARR&&PAP_PL_ARR.cal?null:{cal:1};papPlanoUI(P);return}
    const pc=t.closest("[data-plcal]");if(pc){const m=pc.dataset.plcal;PAP_PL_ARR=null;if(m==="x"){papPlanoUI(P);return}papPlCalendario(P,m);return}
    if(t.closest("[data-plcanc]")){PAP_PL_SEL=null;papPlanoUI(P);return}
    const cor=t.closest("[data-plcor]");if(cor){const d=cor.dataset.plcor,pl=papPl(P),i=papPlDias(P).indexOf(d),x=pl.dias[d]=pl.dias[d]||{};x.cor=((x.cor!=null?x.cor:i)+1)%PAP_PL_COR.length;papGuardar(P);papCandsUI(P);return}
    const cfg=t.closest("[data-plcfg]");if(cfg){const d=cfg.dataset.plcfg;PAP_PL_ARR=PAP_PL_ARR&&PAP_PL_ARR.cfg===d?null:{cfg:d};papPlanoUI(P);return}
    const rf=t.closest("[data-plrefaz]");if(rf){const d=rf.dataset.plrefaz;papPlFoto(P);papPlRefazer(P,d,papPlDoDia(P,d));papPlFim(P,"Horas do dia refeitas.");return}
    const rm=t.closest("[data-plrem]");if(rm){const d=rm.dataset.plrem,L=papPlDoDia(P,d);if(L.length&&!confirm(`Tirar ${papPlDiaNome(d,true)}? As ${L.length} prova(s) deste dia passam para «Sem data».`))return;
      papPlFoto(P);L.forEach(c=>{c.data="";c.hora=""});const pl=papPl(P);delete pl.dias[d];pl.ocultos[d]=1;PAP_PL_ARR=null;papPlFim(P,"Dia retirado.");return}
    const aq=t.closest("[data-plaqui]");if(aq){const c=P.cands.find(x=>x.id===PAP_PL_SEL);if(c)papPlMover(P,c,aq.dataset.plaqui,null);return}
    const cd=t.closest("[data-plc]");if(cd&&!box.__arrastou){const c=P.cands.find(x=>x.id===cd.dataset.plc);if(!c)return;
      if(!PAP_PL_SEL||PAP_PL_SEL===c.id){PAP_PL_SEL=PAP_PL_SEL===c.id?null:c.id;papPlanoUI(P);return}
      const a=P.cands.find(x=>x.id===PAP_PL_SEL);if(a)papPlTrocar(P,a,c)}});
  box.addEventListener("keydown",e=>{const cd=e.target.closest&&e.target.closest("[data-plc]");if(cd&&(e.key==="Enter"||e.key===" ")){e.preventDefault();cd.click()}
    if(e.key==="Escape"&&PAP_PL_SEL){PAP_PL_SEL=null;papPlanoUI()}});
  box.addEventListener("change",e=>{const P=papProva();if(!P||!papEd())return;const t=e.target;
    if(t.id==="plNovoDia"&&t.value){const pl=papPl(P),d=t.value;pl.dias[d]=Object.assign(pl.dias[d]||{},{manual:1});delete pl.ocultos[d];papGuardar(P);papPlanoUI(P);return}
    const k=t.dataset.plk,w=t.closest("[data-plcfgd]");if(k&&w){const d=w.dataset.plcfgd,pl=papPl(P),x=pl.dias[d]=pl.dias[d]||{};x[k]=k==="dur"?Math.max(10,Math.min(240,+t.value||60)):t.value;papGuardar(P)}});
  // arrastar: rato (em qualquer sítio do cartão) ou toque (só pela pega, para a página continuar a deslizar)
  box.addEventListener("pointerdown",e=>{if(e.button>0||!papEd())return;const cd=e.target.closest("[data-plc]");if(!cd)return;
    if(e.pointerType!=="mouse"&&!e.target.closest(".pl-pega"))return;
    if(e.pointerType==="mouse")e.preventDefault(); // sem selecionar texto ao arrastar
    const P=papProva(),c=P&&P.cands.find(x=>x.id===cd.dataset.plc);if(!c)return;
    const x0=e.clientX,y0=e.clientY;let ativo=false,fan=null,ind=null,alvo=null,raf=0,auto=0;box.__arrastou=false;
    const pid=e.pointerId;try{cd.setPointerCapture(pid)}catch(x){}
    const comecar=()=>{ativo=true;try{getSelection().removeAllRanges()}catch(x){}box.__arrastou=true;const r=cd.getBoundingClientRect();fan=cd.cloneNode(true);fan.classList.add("pl-fan");fan.style.width=r.width+"px";
      document.body.appendChild(fan);cd.classList.add("pl-orig");ind=document.createElement("div");ind.className="pl-ind";document.body.classList.add("pl-arrastar")};
    const onde=(x,y)=>{fan.style.transform=`translate(${x-fan.offsetWidth/2}px,${y-18}px) rotate(1.5deg)`;
      const el=document.elementFromPoint(x,y);box.querySelectorAll(".pl-troca").forEach(z=>z.classList.remove("pl-troca"));box.querySelectorAll(".pl-sobre").forEach(z=>z.classList.remove("pl-sobre"));ind.remove();alvo=null;
      const sec=el&&el.closest&&el.closest(".pl-d");if(!sec||!box.contains(sec))return;const d=sec.dataset.pld,lst=sec.querySelector(".pl-l");sec.classList.add("pl-sobre");
      const cs=[...lst.querySelectorAll("[data-plc]")].filter(z=>z!==cd),sob=el.closest("[data-plc]");
      if(sob&&sob!==cd){const r=sob.getBoundingClientRect(),f=(y-r.top)/r.height;if(f>.28&&f<.72){sob.classList.add("pl-troca");alvo={tipo:"troca",id:sob.dataset.plc};return}}
      let idx=cs.length;for(let i=0;i<cs.length;i++){const r=cs[i].getBoundingClientRect();if(y<r.top+r.height/2){idx=i;break}}
      alvo={tipo:"mover",d,idx};const ref=cs[idx];if(ref)lst.insertBefore(ind,ref);else lst.appendChild(ind)};
    const passo=()=>{raf=0;if(!ativo)return;if(auto){window.scrollBy(0,auto);raf=requestAnimationFrame(passo)}};
    const mv=ev=>{if(ev.pointerId!==pid)return;const dx=ev.clientX-x0,dy=ev.clientY-y0;if(!ativo){if(Math.hypot(dx,dy)<5)return;comecar()}ev.preventDefault();
      onde(ev.clientX,ev.clientY);const fu=document.querySelector(".fundos"),fr=fu&&getComputedStyle(fu).position==="fixed"?fu.getBoundingClientRect().top:innerHeight,H=Math.min(innerHeight,fr);auto=ev.clientY<90?-12:ev.clientY>H-70?12:0;if(auto&&!raf)raf=requestAnimationFrame(passo)};
    const fim=ev=>{if(ev.pointerId!==pid)return;document.removeEventListener("pointermove",mv);document.removeEventListener("pointerup",fim);document.removeEventListener("pointercancel",fim);auto=0;
      if(!ativo)return;ativo=false;fan.remove();ind.remove();cd.classList.remove("pl-orig");document.body.classList.remove("pl-arrastar");box.querySelectorAll(".pl-troca,.pl-sobre").forEach(z=>z.classList.remove("pl-troca","pl-sobre"));
      setTimeout(()=>{box.__arrastou=false},0);if(ev.type==="pointercancel"||!alvo)return;
      if(alvo.tipo==="troca"){const b=P.cands.find(x=>x.id===alvo.id);if(b)papPlTrocar(P,c,b);return}
      const atual=papPlDoDia(P,alvo.d).filter(x=>x!==c);if((c.data||"")===alvo.d&&papPlDoDia(P,alvo.d).indexOf(c)===alvo.idx)return;papPlMover(P,c,alvo.d,alvo.idx)};
    document.addEventListener("pointermove",mv,{passive:false});document.addEventListener("pointerup",fim);document.addEventListener("pointercancel",fim)})}
