/* ===================== EPISJ 360 0.9.117: Crono360 — cronograma escrito à mão =====================
   A Direção Pedagógica escreve, por turma, os tempos por semana de cada disciplina (cada número vale dessa semana em diante,
   até à próxima mudança) e lança as horas dadas. Os tempos por semana deixam de vir do Horários360 (salvo se se escolher o
   contrário nas Definições) e o Crono360 nunca mexe no Horários360: em «Ajustar» vê-se o que mudar e grava-se no cronograma.
   Dados em cfg.escola.crono: man=[{id,anoId,turmaId,disc,discNome,de (segunda-feira),tl,por,em}], def.tlT[anoId][turmaId]
   = tempos por semana da turma (para avisar quando a soma passa). As horas dadas continuam em corr (como as correções). */
var CRM_FOCO="",AJ={t:null,de:"",alvo:{}};
function crManual(){return crCfg().def.fonte!=="horario"}
function crManMapa(a,ovr){const m=new Map();for(const x of crCfg().man){if(!x||x.anoId!==a.id||!x.de)continue;const k=x.turmaId+"|"+x.disc;(m.get(k)||m.set(k,[]).get(k)).push(x)}
  if(ovr)for(const k in ovr)m.set(k,(m.get(k)||[]).filter(x=>!ovr[k].some(y=>y.de===x.de)).concat(ovr[k]));
  for(const l of m.values())l.sort((p,q)=>p.de.localeCompare(q.de)||(p.em||0)-(q.em||0));return m}
function crManVal(lst,seg){let v=null;for(const x of lst||[]){if(x.de>seg)break;v=+x.tl||0}return v}
function crManEnt(lst,seg){let v=null;for(const x of lst||[]){if(x.de>seg)break;v=x}return v}
// grava (ou muda) o número de uma semana; vazio tira a mudança dessa semana
function crManPor(a,tid,k,disc,seg,v,dias){const c=crCfg(),i=c.man.findIndex(x=>x&&x.anoId===a.id&&x.turmaId===tid&&x.disc===k&&x.de===seg);
  if(v==null){if(i>=0)c.man.splice(i,1);return}
  const o={id:i>=0?c.man[i].id:uid(),anoId:a.id,turmaId:tid,disc:k,discNome:disc,de:seg,tl:Math.round(v*10)/10,por:String(EU&&EU.email||""),em:Date.now()};if(Array.isArray(dias))o.dias=dias.map(x=>Math.round((+x||0)*10)/10);if(i>=0)c.man[i]=o;else c.man.push(o)}
// textos que mudam com a origem dos tempos (cronograma à mão ou Horários360)
const CR_TXT={ps:"Quanto de cada plano curricular já foi dado e se o cronograma chega para o cumprir até ao fim do ano — turma a turma e disciplina a disciplina. Junta os <b>Planos Curriculares</b>, os <b>tempos por semana</b> escritos em Cronogramas, as <b>horas dadas</b> lançadas pela Direção Pedagógica e o <b>Calendário Escolar</b> (interrupções, feriados e a FCT de cada turma).",
  cron:"Quando começa e acaba cada módulo, UFCD ou UC, pelos tempos por semana escritos mais abaixo e pelo calendário (sem as interrupções, os feriados e a FCT da turma). O que já foi dado conta como dado; o resto é a previsão com o cronograma.",
  tur:"Carregue numa turma para ver cada disciplina: horas dadas (e o último registo) e por dar, o que o cronograma ainda dá até ao fim, o saldo, os módulos concluídos e quando acaba.",
  corr:"Os totais de horas dadas registados (em Ponto de situação › Lançar as horas dadas, no lápis da tabela, aqui ou colados do pleon). A partir de cada registo, o ponto de situação e o cronograma partem desse número; depois dele conta o previsto no cronograma."};
function crTextos(){const man=crManual();document.querySelectorAll("[data-crcumpl]").forEach(x=>{x.textContent=man?"Ajustar":"Cumprir o plano"});
  document.querySelectorAll("[data-crfh]").forEach(p=>{if(p.dataset.o==null)p.dataset.o=p.innerHTML;const h=man?CR_TXT[p.dataset.crfh]:p.dataset.o;if(h&&p.innerHTML!==h)p.innerHTML=h})}
// semanas do ano para uma turma: dias com aulas (n), dias úteis do ano nessa semana (nom), primeiro e último índice
function crManSemanas(M,T){const W=M.semanas,N=M.D.length,out=[];for(let w=0;w<W.length;w++){const i0=W[w].i,i1=w+1<W.length?W[w+1].i:N;let n=0,nom=0;
    for(let i=i0;i<i1;i++){if((calD(M.D[i]).getDay()+6)%7<M.nD){nom++;if(!T.fora[i])n++}}out.push({w,seg:W[w].seg,i0,i1,n,nom,d0:M.D[i0]})}return out}
// porque não há aulas numa semana (para o título da célula)
function crManPorque(M,T,s){const ints=(M.a.ferias||[]).filter(q=>q&&q.de);for(let i=s.i0;i<s.i1;i++){const x=M.D[i];const f=T.fct.find(m=>x>=m.de&&x<=m.ate);if(f)return "FCT";if(T.fimT&&x>T.fimT)return "Depois do fim das aulas da turma";const q=ints.find(q=>x>=q.de&&x<=(q.ate||q.de));if(q)return q.nome||"Interrupção"}return "Sem aulas"}
/* ---------- Cronogramas › Tempos por semana (a grelha) ---------- */
function crManRender(T,M){const c=$("#crManC");if(!c)return;if(!M||!M.manual||!T){c.style.display="none";return}c.style.display="";
  const me=crMeuId(),ed=crPodeEditar()&&!me,a=M.a,f=M.fator,d=crCfg().def,lim=+((d.tlT[a.id]||{})[T.t.id])||0,tid=T.t.id;
  const L=[...T.discs.values()].filter(o=>o.P>0&&crDoFormador(o,me)).sort(crOrdArea),S=crManSemanas(M,T),iA=M.iA;
  $("#crManHint").innerHTML=ed?"Escreva os tempos por semana de cada disciplina. Cada número vale dessa semana em diante, até à próxima mudança (a azul, onde escreveu; a cinzento, a continuação). Para tirar uma mudança, apague o número. Enter passa à semana seguinte; ↑ e ↓ mudam de disciplina. A tracejado, as semanas sem aulas da turma; sublinhadas, as semanas com menos dias de aulas; riscados, os tempos depois de a disciplina acabar o plano (ficam livres)."
    :"Os tempos por semana de cada disciplina, escritos pela Direção Pedagógica. A tracejado, as semanas sem aulas da turma.";
  const falta=L.filter(o=>!o.manTem).length;
  $("#crManBar").innerHTML=ed?`<label style="width:230px" title="Quantos tempos por semana a turma pode ter: a linha do total fica a vermelho nas semanas que passam deste número">Tempos por semana da turma<input type="number" id="crManLim" min="0" max="80" step="1" value="${lim||""}" placeholder="sem limite"></label><span class="grow"></span>`
    +(falta?`<button class="b s" id="crManSug" type="button" title="As disciplinas sem tempos escritos ficam com as horas do plano a dividir pelas semanas de aulas da turma (arredondado para cima)">Preencher as que faltam (horas ÷ semanas)</button>`:"")
    +(falta&&M.st?` <button class="b imp" id="crManHor" type="button" title="As disciplinas sem tempos escritos ficam com os tempos por semana do horário atual do Horários360. É uma cópia feita uma vez: depois, o cronograma não fica ligado ao horário.">Importar do Horários360 as que faltam</button>`:""):"";
  if(!L.length){$("#crManOut").innerHTML=`<p class="hint">Sem disciplinas para mostrar.</p>`;return}
  // cabeçalho: meses e dia da segunda-feira de cada semana
  const mes=x=>{const n=calD(x).toLocaleDateString("pt-PT",{month:"short"}).replace(".","");return n.charAt(0).toUpperCase()+n.slice(1)};
  let h1="",h2="",run=null;for(const s of S){const m=s.d0.slice(0,7);if(!run||run.m!==m){if(run)h1+=`<th colspan="${run.n}" class="crmm">${esc(run.t)}</th>`;run={m,n:0,t:mes(s.d0)}}run.n++;
    const past=s.i1-1<=iA;h2+=`<th class="${past?"past":""}" title="Semana de ${esc(calDM(s.seg,{day:"numeric",month:"short"}))}${s.n&&s.n<s.nom?" · "+s.n+" de "+s.nom+" dias com aulas":""}">${+s.seg.slice(8,10)}</th>`}
  if(run)h1+=`<th colspan="${run.n}" class="crmm">${esc(run.t)}</th>`;
  const tot=new Float32Array(S.length);let rows="",area="";
  for(const o of L){if(o.area!==area){area=o.area;rows+=`<tr class="crma"><td class="crmn">${esc(PC_AREAS.find(z=>z[0]===area)?.[1]||"Outras")}</td><td colspan="${S.length}"></td></tr>`}
    const ex=new Set((o.manL||[]).map(x=>x.de)),fimP=o.fimPrev||"";
    let cells="";for(const s of S){const v=o.manW[s.w]||0;tot[s.w]+=s.n?v:0;const past=s.i1-1<=iA,acabou=fimP&&s.d0>fimP,e1=ex.has(s.seg);
      if(!s.n){cells+=`<td class="w fora${past?" past":""}" title="${esc(crManPorque(M,T,s))}">${e1?`<span class="crmx">${crNum(v)}</span>`:""}</td>`;continue}
      let ct=0;for(let i=s.i0;i<s.i1;i++)ct+=o.sch[i];const en=o.manE&&o.manE[s.w],dt=en&&Array.isArray(en.dias)?" · "+CR_DSEM.slice(0,M.nD).map((n,q)=>en.dias[q]?n+" "+crNum(en.dias[q]):"").filter(Boolean).join(", "):"";
      const cls=`w${past?" past":""}${s.n<s.nom?" parc":""}${acabou?" fim":""}${e1?" ex":""}`,tt=`${o.disc} · semana de ${calDM(s.seg,{day:"numeric",month:"short"})}${dt}${s.n<s.nom?` · ${s.n} de ${s.nom} dias com aulas (conta ${crNum(Math.round(ct*10)/10)})`:""}${acabou?" · a disciplina já acabou o plano":""}`;
      const txt=v||e1?crNum(v):"";
      cells+=ed?`<td class="${cls}"><input class="crmi${e1?" ex":" her"}" data-crmk="${esc(tid+"|"+o.k+"|"+s.seg)}" value="${esc(txt)}" inputmode="decimal" autocomplete="off" aria-label="${esc(tt)}" title="${esc(tt)}"></td>`
        :`<td class="${cls}" title="${esc(tt)}"><span class="crmv${e1?" ex":" her"}">${esc(txt)}</span></td>`}
    const est=o.G>=o.P-1e-6?"concluída":o.saldo<-1e-6?`<span class="crneg">faltam ${crNum(crH1(-o.saldo,f))} h</span>`:o.fimPrev?"acaba "+calDM(o.fimPrev):"";
    rows+=`<tr><td class="crmn"><span class="crnm">${esc(o.disc)}</span><small>${crNum(crH1(o.P,f))} h${est?" · "+est:""}</small></td>${cells}</tr>`}
  if(!me)rows+=`<tr class="crmtot"><td class="crmn">Total da turma${lim?`<small>máximo ${lim} por semana</small>`:""}</td>${S.map(s=>{const v=Math.round(tot[s.w]*10)/10;return `<td class="w${s.n?"":" fora"}${lim&&v>lim+1e-6?" sobe":""}" title="${s.n?esc(crNum(v)+(lim?" de "+lim:"")+" tempos"):""}">${s.n&&v?crNum(v):""}</td>`}).join("")}</tr>`;
  $("#crManOut").innerHTML=`<div class="crmw tw"><table class="crmg"><thead><tr><th class="crmn" rowspan="2">Disciplina</th>${h1}</tr><tr>${h2}</tr></thead><tbody>${rows}</tbody></table></div>`;
  // depois de gravar uma célula, volta a pôr o cursor onde estava (ou na seguinte)
  if(CRM_FOCO){const i=$("#crManOut").querySelector(`[data-crmk="${CSS.escape(CRM_FOCO)}"]`);CRM_FOCO="";if(i){i.focus();try{i.select()}catch(e){}}}
  else{const w=$("#crManOut .crmw"),hj=$("#crManOut thead tr:nth-child(2) th:not(.past)");if(w&&hj&&!w.dataset.rolou){w.dataset.rolou="1";w.scrollLeft=Math.max(0,hj.offsetLeft-260)}}}
function crManCel(inp){if(!crPodeEditar())return;const [tid,k,seg]=inp.dataset.crmk.split("|"),a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(tid),o=T&&T.discs.get(k);if(!o)return;
  const tx=inp.value.trim().replace(",","."),ex=(o.manL||[]).some(x=>x.de===seg),w=M.semanas.findIndex(x=>x.seg===seg),her=w>0?crManVal(o.manL,M.semanas[w-1].seg):null;
  if(tx===""){if(!ex)return;crManPor(a,tid,k,o.disc,seg,null)}
  else{const v=parseFloat(tx);if(!(v>=0&&v<=40)){toast("Escreva um número de tempos por semana (0 a 40)");CRM_FOCO=inp.dataset.crmk;crCron();return}
    if(!ex&&Math.abs(v-(o.manW[w]||0))<1e-6&&o.manTem)return; // igual ao que já continuava
    crManPor(a,tid,k,o.disc,seg,v);
    // se ficou igual à semana anterior, a mudança não serve para nada: tira-se
    if(her!=null&&Math.abs(her-v)<1e-6){crManPor(a,tid,k,o.disc,seg,null)}}
  save();CR_CACHE.k="";setTimeout(()=>{const ae=document.activeElement;CRM_FOCO=ae&&ae.dataset&&ae.dataset.crmk||"";crCron()},0)}
$("#crManOut").addEventListener("change",e=>{const i=e.target.closest(".crmi");if(i)crManCel(i)});
$("#crManOut").addEventListener("focusin",e=>{const i=e.target.closest(".crmi");if(i)try{i.select()}catch(x){}});
$("#crManOut").addEventListener("keydown",e=>{const i=e.target.closest(".crmi");if(!i)return;let alvo=null;const td=i.closest("td"),tr=td.parentNode,col=[...tr.children].indexOf(td);
  if(e.key==="Enter"){e.preventDefault();let n=td.nextElementSibling;while(n&&!n.querySelector(".crmi"))n=n.nextElementSibling;alvo=n&&n.querySelector(".crmi")}
  else if(e.key==="ArrowDown"||e.key==="ArrowUp"){e.preventDefault();let r=e.key==="ArrowDown"?tr.nextElementSibling:tr.previousElementSibling;while(r&&!(r.children[col]&&r.children[col].querySelector(".crmi")))r=e.key==="ArrowDown"?r.nextElementSibling:r.previousElementSibling;alvo=r&&r.children[col].querySelector(".crmi")}
  if(alvo)alvo.focus()});
$("#crManBar").addEventListener("change",e=>{if(e.target.id!=="crManLim"||!crPodeEditar())return;const a=crAnoSel(),tid=CR_SEL.tc,v=parseInt(e.target.value,10),d=crCfg().def;d.tlT[a.id]=d.tlT[a.id]||{};if(v>0)d.tlT[a.id][tid]=v;else delete d.tlT[a.id][tid];save();crCron()});
$("#crManBar").addEventListener("click",e=>{const b=e.target.closest("#crManSug,#crManHor");if(!b||!crPodeEditar())return;const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),T=M.turmas.get(CR_SEL.tc);if(!T)return;
  const S=crManSemanas(M,T),s0=(S.find(s=>s.n)||S[0]||{}).seg;if(!s0)return;let n=0,zero=0;const Mh=b.id==="crManHor"?crMotor(a,asof,null,{fonte:"horario"}):null;
  for(const o of T.discs.values()){if(o.P<=0||o.manTem)continue;let v;
    if(Mh){const oh=Mh.turmas.get(T.t.id)&&Mh.turmas.get(T.t.id).discs.get(o.k);v=oh?Math.round(oh.semH*10)/10:0;if(!v){zero++;continue}}
    else{let ef=0;for(let i=0;i<M.D.length;i++)if(!T.fora[i])ef+=1/M.nD;v=ef?Math.ceil(o.P/ef-1e-6):0;if(!v)continue}
    crManPor(a,T.t.id,o.k,o.disc,s0,v);n++}
  if(n){save();CR_CACHE.k=""}crCron();escLinhaMsg("#crManMsg",n?`✓ ${n} disciplina${n===1?"":"s"} preenchida${n===1?"":"s"} desde a semana de ${esc(calDM(s0))}${Mh?" com os tempos do Horários360 (cópia; o cronograma não fica ligado ao horário)":""}.${zero?` ${zero} sem aulas no horário ficaram por preencher.`:""} Pode mudar qualquer número na grelha.`:`Nada para preencher.${zero?` As ${zero} que faltam não têm aulas no horário.`:""}`,n?"ok":"info")});
/* ---------- Ponto de situação › Lançar as horas dadas ---------- */
function crDadRender(M){const c=$("#crDadC");if(!c)return;const ok=M.manual&&crPodeEditar()&&!crMeuId();c.style.display=ok?"":"none";if(!ok)return;
  const a=M.a,TT=[...M.turmas.values()].filter(T=>[...T.discs.values()].some(o=>o.P>0)).sort((p,q)=>COLL_PTN.compare(String(p.t.cod),String(q.t.cod)));
  if(!CR_SEL.dt||!M.turmas.has(CR_SEL.dt))CR_SEL.dt=CR_SEL.t&&M.turmas.has(CR_SEL.t)?CR_SEL.t:(TT[0]||{t:{id:""}}).t.id;
  $("#crDadT").innerHTML=TT.map(T=>`<option value="${T.t.id}"${T.t.id===CR_SEL.dt?" selected":""}>${esc(calTurmaCurta(T.t))}</option>`).join("");
  const di=$("#crDadData"),data=CR_SEL.dd||M.asof;if(document.activeElement!==di)di.value=data;
  const T=M.turmas.get(CR_SEL.dt);if(!T){$("#crDadOut").innerHTML=`<p class="hint">Sem turmas com plano curricular.</p>`;return}
  const Md=data===M.asof?M:crMotor(a,data),Td=Md.turmas.get(T.t.id),f=M.fator,C=crCfg().corr.filter(x=>x&&x.anoId===a.id&&x.turmaId===T.t.id&&x.data&&x.data<=data);
  const ultDe=k=>C.filter(x=>x.disc===k).sort((p,q)=>p.data.localeCompare(q.data)||(p.em||0)-(q.em||0)).pop();
  const L=[...T.discs.values()].filter(o=>o.P>0).sort(crOrdArea);
  $("#crDadOut").innerHTML=`<div class="tw"><table class="rt crdt crlab"><thead><tr><th>Disciplina</th><th class="crn">Plano</th><th>Último registo</th><th class="crn" title="O que a EPISJ 360 conta até ao dia escolhido: o último registo e, depois dele, o previsto no cronograma">Conta agora</th><th class="crn">Dadas até ${esc(calDM(data))}</th></tr></thead><tbody>`
    +L.map(o=>{const u=ultDe(o.k),od=Td&&Td.discs.get(o.k),G=od?od.G:0,neste=u&&u.data===data;
      return `<tr><td><b>${esc(o.disc)}</b></td><td class="crn">${crNum(crH1(o.P,f))}</td><td>${u?`${crNum(u.dados)} h a ${esc(calDM(u.data))}`:`<span class="hint" style="margin:0">sem registo</span>`}</td><td class="crn">${crNum(crH1(G,f))}</td><td class="crn"><input type="text" inputmode="decimal" class="crdadi" data-crdad="${esc(o.k)}" value="${neste?esc(crNum(u.dados)):""}" placeholder="${esc(crNum(crH1(G,f)))}" style="width:90px;text-align:right" autocomplete="off" aria-label="Horas de ${esc(o.disc)} dadas até ${esc(calDM(data))}"></td></tr>`}).join("")+`</tbody></table></div>`;crRotulos($("#crDadOut"))}
$("#crDadT").onchange=e=>{CR_SEL.dt=e.target.value;crPs()};
$("#crDadData").onchange=e=>{CR_SEL.dd=e.target.value||"";crPs()};
$("#crDadOut").addEventListener("keydown",e=>{const i=e.target.closest(".crdadi");if(!i||e.key!=="Enter")return;e.preventDefault();const L=[...$("#crDadOut").querySelectorAll(".crdadi")],n=L[L.indexOf(i)+1];if(n)n.focus();else $("#crDadGrava").focus()});
$("#crDadGrava").onclick=()=>{if(!crPodeEditar())return;const a=crAnoSel(),tid=CR_SEL.dt,data=$("#crDadData").value||CR_SEL.asof||calHoje(),M=crMotor(a,data),T=M.turmas.get(tid);if(!T)return;
  const c=crCfg();let n=0,mal=0;
  for(const i of $("#crDadOut").querySelectorAll(".crdadi")){const tx=i.value.trim().replace(/\s/g,"").replace(",",".");if(tx==="")continue;const v=parseFloat(tx),o=T.discs.get(i.dataset.crdad);if(!(v>=0)||!o){mal++;continue}
    const j=c.corr.findIndex(x=>x&&x.anoId===a.id&&x.turmaId===tid&&x.disc===o.k&&x.data===data),r={id:j>=0?c.corr[j].id:uid(),anoId:a.id,turmaId:tid,disc:o.k,discNome:o.disc,data,dados:v,nota:"horas dadas",por:String(EU&&EU.email||""),em:Date.now()};
    if(j>=0)c.corr[j]=r;else c.corr.push(r);n++}
  if(!n){toast(mal?"Há números que não percebi":"Escreva as horas dadas de pelo menos uma disciplina");return}
  save();CR_CACHE.k="";crPs();escLinhaMsg("#crDadMsg",`✓ Horas dadas de ${n} disciplina${n===1?"":"s"} da ${esc(T.t.cod)} registadas até ${esc(calDMA(data))}.${mal?` ${mal} número(s) não percebido(s).`:""}`,"ok")};
/* ---------- Ano inteiro (0.9.117; redesenhado na 0.9.125 para ser mais simples) ----------
   Cabeçalho com turma e disciplina; bloco de destaque com o progresso (dadas/plano, previsto), início e fim; ponto de situação e dias
   de aula lado a lado; legenda por cima; grelha com 2 linhas por mês (dia + dia da semana, tempos). Carregar num dia abre o painel do
   dia (acerto de tempos, nota, «ponto de situação neste dia»), sem mudar a situação sozinho. «Ampliar» = body.cramplo. */
var CR_DSEM=["seg","ter","qua","qui","sex","sáb","dom"],CR_DCUR=["seg","ter","qua","qui","sex","sáb","dom"],CRA={t:"",d:"",dde:"",dia:"",diasAb:false};
function crAnoDados(M,T,k){const N=M.D.length,todas=k==="__t",L=todas?[...T.discs.values()].filter(o=>o.P>0):[T.discs.get(k)].filter(Boolean);
  const v=new Float32Array(N),ac=new Float32Array(N),pl=new Float32Array(N);let ini=-1,fim=-1;
  for(const o of L){let pc=0;for(let i=0;i<N;i++){const c=o.cum?o.cum[i]:0,base=c-o.sch[i];let x=0;if(base<o.P-1e-6)x=Math.max(0,Math.min(o.sch[i],o.P-base));v[i]+=x;ac[i]+=Math.min(o.P,Math.max(0,c));
      pc=Math.min(o.P,pc+o.sch[i]);pl[i]+=pc;
      if(!todas){if(x>1e-6&&ini<0)ini=i;if(fim<0&&c>=o.P-1e-6&&o.P>0)fim=i}}}
  return{L,v,ac,pl,ini,fim}}
function crAnoAmpSync(){const b=$("#crAnoAmp");if(b)b.textContent=document.body.classList.contains("cramplo")?"Sair do modo ampliado":"Ampliar"}
function crAnoDiasTxt(e,nD){return e?(Array.isArray(e.dias)?CR_DSEM.slice(0,nD).map((n,q)=>e.dias[q]?`<span class="cra-dchip"><b>${n}</b> ${crNum(e.dias[q])} tempo${e.dias[q]===1?"":"s"}</span>`:"").join("")||`<span class="hint" style="margin:0">sem aulas</span>`
  :`<span class="cra-dchip"><b>${crNum(e.tl)}</b> tempos por semana</span> <span class="hint" style="margin:0">sem dias certos (repartidos por igual)</span>`):`<span class="hint" style="margin:0">Ainda sem tempos no cronograma.</span>`}
function crAno(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),me=crMeuId(),ed=crPodeEditar()&&!me,f=M.fator,HJ=calHoje();crAnoAmpSync();
  const TT=[...M.turmas.values()].filter(T=>[...T.discs.values()].some(o=>o.P>0&&crDoFormador(o,me))).sort((p,q)=>COLL_PTN.compare(String(p.t.cod),String(q.t.cod)));
  if(!CRA.t||!TT.some(T=>T.t.id===CRA.t))CRA.t=CR_SEL.tc&&TT.some(T=>T.t.id===CR_SEL.tc)?CR_SEL.tc:(TT[0]||{t:{id:""}}).t.id;
  $("#crAnoT").innerHTML=TT.map(T=>`<option value="${T.t.id}"${T.t.id===CRA.t?" selected":""}>${esc(calTurmaCurta(T.t))}</option>`).join("");
  const T=M.turmas.get(CRA.t);
  if(!T||!M.D.length){$("#crAnoD").innerHTML="";["#crAnoHero","#crAnoDia","#crAnoLeg","#crAnoAviso"].forEach(q=>$(q).innerHTML="");$("#crAnoOut").innerHTML=`<p class="hint">${M.D.length?"Ainda não há turmas com plano curricular neste ano letivo.":"Falta o início e o fim do ano letivo (Escola360 › Anos letivos)."}</p>`;return}
  const L=[...T.discs.values()].filter(o=>o.P>0&&crDoFormador(o,me)).sort(crOrdArea);
  if(!CRA.d||(CRA.d==="__t"?!!me:!L.some(o=>o.k===CRA.d)))CRA.d=(L[0]||{}).k||"";
  $("#crAnoD").innerHTML=L.map(o=>`<option value="${esc(o.k)}"${o.k===CRA.d?" selected":""}>${esc(o.disc)}</option>`).join("")+(me?"":`<option value="__t"${CRA.d==="__t"?" selected":""}>Todas as disciplinas da turma</option>`);
  const k=CRA.d,o=k==="__t"?null:T.discs.get(k),R=crAnoDados(M,T,k),D=M.D,N=D.length,iA=M.iA,NL=M.NL||new Map(),P=R.L.reduce((s,x)=>s+x.P,0);
  const papD=new Set();for(const m of calMarcos(a,T.t.id))if(m.tipo==="pap")for(const x of calDatasDe(m))papD.add(x);
  const emFct=x=>T.fct.some(m=>x>=m.de&&x<=m.ate),h1=x=>crNum(Math.round(crH1(x,f)*10)/10);
  // avisos: só os desta turma e desta disciplina
  const av=[];if(M.manual){const sem=R.L.filter(x=>!x.manTem);if(o&&!o.manTem)av.push(`Esta disciplina ainda não tem tempos no cronograma, por isso ainda não há contagem.${ed?` <a href="#" data-craab>Escrever os dias de aula</a>`:""}`);
      else if(!o&&sem.length)av.push(`${sem.length} disciplina${sem.length===1?" desta turma ainda não tem":"s desta turma ainda não têm"} tempos no cronograma: ${esc(sem.map(x=>x.disc).join(", "))}.`)}
  else if(!M.st)av.push(`Ainda não há horário de ${esc(a.nome)} no <b>Horários360</b>.`);
  if(!calPeriodos(a).length)av.push(`O <b>Calendário Escolar</b> de ${esc(a.nome)} ainda não foi importado: a FCT e os períodos ficam por contar.`);
  $("#crAnoAviso").innerHTML=av.length?`<div class="msg info" style="margin:0 0 12px">${av.join("<br>")}</div>`:"";
  // números
  let df=0;const sem=new Set();for(let i=0;i<N;i++)if(R.v[i]>1e-6){df++;sem.add(crSeg(D[i]))}
  const G=R.L.reduce((s,x)=>s+(x.G||0),0),prevA=iA>=0?R.pl[iA]:0,dif=G-prevA,falta=Math.max(0,P-G),pct=P?Math.min(1,G/P):0,ppc=P?Math.min(1,prevA/P):0;
  const ult=o?crCfg().corr.filter(x=>x&&x.anoId===a.id&&x.turmaId===T.t.id&&x.disc===o.k&&x.data&&x.data<=asof).sort((p,q)=>p.data.localeCompare(q.data)||(p.em||0)-(q.em||0)).pop():null;
  const forms=o?[...o.f.entries()].sort((x,y)=>y[1]-x[1]).map(([id])=>(cfg.profs.find(p=>p.id===id)||{}).nome).filter(Boolean):[];
  const dA=x=>calDM(x,{day:"numeric",month:"short"});
  const semT=M.manual&&o&&!o.manTem;
  const est=semT?`<span class="cra-chip mau">Sem tempos</span>`:!P?"":o&&o.G>=o.P-1e-6?`<span class="cra-chip bom">Concluída</span>`:dif<-0.5?`<span class="cra-chip mau">Atrasada ${h1(-dif)} h</span>`:dif>0.5?`<span class="cra-chip bom">Adiantada ${h1(dif)} h</span>`:`<span class="cra-chip bom">Em dia</span>`;
  const fimC=o?(semT?"":R.fim>=0?`<span class="cra-chip fim">${R.fim<=iA?"Acabou":"Acaba"} ${esc(dA(D[R.fim]))}</span>`:`<span class="cra-chip mau">Não acaba até ao fim do ano</span>`):"";
  const iniC=o&&R.ini>=0?`<span class="cra-chip ini">${R.ini<=iA?"Começou":"Começa"} ${esc(dA(D[R.ini]))}</span>`:"";
  const eDias=o&&M.manual?crManEnt(o.manL,crSeg(CRA.dde||asof)):null;
  const S=M.semanas,first=(S.find(w=>M.D.slice(w.i,w.i+7).some((x,q)=>M.letivo[w.i+q]))||S[0]||{}).seg||"";
  let deD=CRA.dde||((o&&(o.manL||[]).some(x=>Array.isArray(x.dias)))?crSeg(asof):first);if(deD<first)deD=first;const eEd=o?crManEnt(o.manL,crSeg(deD)):null;
  $("#crAnoHero").innerHTML=`<div class="cra-hero"><div class="cra-hl"><div class="cra-kick">${esc(T.t.cod)}${o&&forms.length?" · "+esc(forms.join(", ")):""}</div><div class="cra-tit">${esc(o?o.disc:"Todas as disciplinas")}</div>
      <div class="cra-sub">${h1(P)} h no plano${df?` · ${df} dias de formação em ${sem.size} semanas`:""}</div><div class="cra-chips">${est}${iniC}${fimC}</div></div>
      <div class="cra-pct"><b>${Math.round(pct*100)}%</b><span>${h1(G)} de ${h1(P)} h dadas</span></div></div>
    <div class="cra-prog" title="Dadas: ${h1(G)} h · previsto até ${esc(calDM(asof))}: ${h1(prevA)} h"><i class="g" style="width:${(pct*100).toFixed(1)}%"></i><i class="p" style="left:${(ppc*100).toFixed(1)}%"></i></div>
    <div class="cra-boxes"><div class="cra-box"><div class="cra-bt"><span>Ponto de situação a</span><input type="date" id="crAnoAsof" value="${asof}">${asof!==HJ?`<button class="b s" type="button" data-crahoje>Hoje</button>`:""}</div>
        <div class="cra-nums"><div><span>Previsto</span><b>${h1(prevA)} h</b></div><div><span>Dadas</span><b>${h1(G)} h</b><small>${o?(ult?`registo de ${esc(calDM(ult.data))}`:"sem registo"):""}</small></div><div><span>Diferença</span><b class="${dif<-0.05?"crneg":""}">${dif>=0?"+":"−"}${h1(Math.abs(dif))} h</b></div><div><span>Falta dar</span><b>${h1(falta)} h</b></div></div>
        ${ed&&o?`<div class="cra-act"><label>Horas dadas até ${esc(calDM(asof))}<input type="text" inputmode="decimal" id="crAnoG" value="${ult&&ult.data===asof?esc(crNum(ult.dados)):""}" placeholder="${esc(h1(G))}" autocomplete="off"></label><button class="b s" id="crAnoGGrava" type="button">Gravar</button></div>`:""}
        ${ed?`<button class="b s cra-lnk" id="crAnoReg" type="button" title="Guarda o ponto de situação de todas as turmas nesta data, para comparar mais tarde (Pontos de situação)">Guardar este ponto de situação no histórico</button>`:""}</div>
</div><div id="crAnoMsg"></div>`;
  // 0.9.128: horário semanal da turma (todas as disciplinas)
  crAnoHs(M,T,k,ed,asof,first);
  // dias de aula, na barra de cima (também no modo ampliado)
  const db=$("#crAnoDiasBar");
  if(!(o&&M.manual)){db.innerHTML="";db.style.display="none"}else{db.style.display="";const fut=(o.manL||[]).filter(x=>x.de>crSeg(deD));
    const dv=CR_DSEM.slice(0,M.nD).map((n,q)=>eEd&&Array.isArray(eEd.dias)?(+eEd.dias[q]||0):null),tot=dv.reduce((x,v)=>x+(v||0),0);
    db.innerHTML=ed?`<span class="cra-dbl" title="Quantos tempos tem em cada dia da semana. Um feriado ou uma interrupção só tira as aulas do dia em que calha.">Dias de aula</span><div class="cra-dgrp">${CR_DSEM.slice(0,M.nD).map((n,q)=>`<label class="cra-dd${dv[q]>0?" on":""}"><span>${n}</span><input type="text" inputmode="decimal" data-cradia="${q}" value="${dv[q]==null?"":esc(crNum(dv[q]))}" placeholder="0" autocomplete="off" aria-label="Tempos à ${n}"></label>`).join("")}</div><span class="cra-dtot" id="crAnoDiasTot">${dv.some(v=>v!=null)?`= <b>${crNum(tot)}</b> por semana`:eEd&&eEd.tl?`agora ${crNum(eEd.tl)} por semana, sem dias certos`:"escreva os tempos de cada dia"}</span><label class="cra-dde" title="A partir desta semana, até à próxima mudança${fut.length?" (muda outra vez a "+fut.map(x=>calDM(x.de)).join(", ")+")":""}">desde<input type="date" id="crAnoDiasDe" value="${deD}"></label><button class="b s" id="crAnoDiasGrava" type="button" disabled>Gravar</button>`
      :`<span class="cra-dbl">Dias de aula</span>${crAnoDiasTxt(eDias,M.nD)}`}
  // legenda
  $("#crAnoLeg").innerHTML=`<div class="crano-leg">${o?`<span><i class="aula"></i>Dia com aulas</span><span><i class="ini"></i>Início</span><span><i class="ifim"></i>Fim</span>`:`<span><i class="aula"></i>Dia com aulas</span>`}<span><i class="fer"></i>Feriado</span><span><i class="int"></i>Interrupção</span><span><i class="fct"></i>FCT</span><span><i class="pap"></i>PAP</span><span><i class="fds"></i>Fim de semana</span><span><i class="hoje"></i>Hoje</span><span><i class="sit"></i>Ponto de situação</span><span><i class="dman"></i>Acerto num dia</span><span class="hint" style="margin:0">Carregue num dia para ver ou mudar esse dia.</span></div>`;
  // grelha: 2 linhas por mês
  const m0=D[0].slice(0,7),m1=D[N-1].slice(0,7),meses=[];for(let y=+m0.slice(0,4),m=+m0.slice(5,7),g=0;g<24;g++){const key=`${y}-${String(m).padStart(2,"0")}`;meses.push({y,m,key});if(key===m1)break;m++;if(m>12){m=1;y++}}
  const nomeMes=(y,m)=>{const n=calD(`${y}-${String(m).padStart(2,"0")}-01`).toLocaleDateString("pt-PT",{month:"long"});return n.charAt(0).toUpperCase()+n.slice(1)};
  let h=`<div class="tw crano-w"><table class="crano"><colgroup><col class="cm">${"<col>".repeat(31)}<col class="cdf"></colgroup><tbody>`;
  for(const mm of meses){const nd=new Date(mm.y,mm.m,0).getDate();let r1="",r2="",dfm=0,last=-1;
    for(let d=1;d<=31;d++){if(d>nd){r1+=`<td class="nx"></td>`;r2+=`<td class="nx"></td>`;continue}
      const x=`${mm.key}-${String(d).padStart(2,"0")}`,i=M.ix.get(x),wd=(calD(x).getDay()+6)%7,nl=NL.get(x),fds=wd>=M.nD,aula=i!=null&&R.v[i]>1e-6;
      let c=i==null?"out":"";const red=i!=null&&o&&(i===R.ini||i===R.fim),fct=!fds&&!nl&&emFct(x);
      if(red)c+=i===R.ini?" ini":" ifim";else if(nl&&nl.t==="fer"&&!fds)c+=" fer";else if(fds)c+=" fds";else if(nl)c+=" int";else if(papD.has(x))c+=" pap";else if(aula)c+=" aula";else if(fct)c+=" fct";
      if(x===asof)c+=" sit";if(x===HJ)c+=" hoje";if(i!=null)c+=i>iA?" fut":" pas";if(x===CRA.dia)c+=" dsel";
      const dm=o&&o.diaM&&i!=null?o.diaM.get(i):null;if(dm)c+=" dman";if(i!=null&&aula)dfm++;if(i!=null)last=i;
      const tt=`${calDMA(x)} (${CR_DSEM[wd]})${nl?" · "+nl.n:""}${fct?" · FCT":""}${papD.has(x)?" · PAP":""}${aula?` · ${crNum(Math.round(R.v[i]*10)/10)} tempo(s)`:""}${red?(i===R.ini?" · início":" · fim"):""}${dm?` · acerto à mão${dm.nota?": "+dm.nota:""}`:""}`;
      const at=i!=null?` data-crad="${x}" title="${esc(tt)}"`:"";
      r1+=`<td class="d${c}"${at}><span class="dn">${d}</span><span class="dw">${x===HJ?"hoje":CR_DCUR[wd]}</span></td>`;
      r2+=`<td class="d t${c}"${at}>${aula?crNum(Math.round(R.v[i]*10)/10):fct?"FCT":papD.has(x)?"PAP":""}</td>`}
    h+=`<tr class="r1"><td class="crm" rowspan="2"><b>${esc(nomeMes(mm.y,mm.m))}</b><small>${mm.y}</small></td>${r1}<td class="df" title="Dias com aulas neste mês">${dfm?dfm+" d":"—"}</td></tr><tr class="r2">${r2}<td class="df dft" title="Total de horas no fim do mês">${last>=0?h1(R.ac[last])+" h":""}</td></tr>`}
  $("#crAnoOut").innerHTML=h+`</tbody></table></div>`;
  crAnoDia(M,T,o,ed)}

// 0.9.128: horário semanal da turma — disciplinas × dias da semana, gravado como «dias de aula» de cada disciplina
function crAnoHs(M,T,k,ed,asof,first){const c=$("#crAnoHs");if(!c)return;if(k!=="__t"||!M.manual){c.innerHTML="";return}
  const a=M.a,nD=M.nD,L=[...T.discs.values()].filter(o=>o.P>0).sort(crOrdArea),lim=+((crCfg().def.tlT[a.id]||{})[T.t.id])||0;
  let de=CRA.dde||(L.some(o=>(o.manL||[]).some(x=>Array.isArray(x.dias)))?crSeg(asof):first);if(de<first)de=first;const seg=crSeg(de);
  const rows=L.map(o=>{const e=crManEnt(o.manL,seg);return{o,e,d:CR_DSEM.slice(0,nD).map((n,q)=>e&&Array.isArray(e.dias)?(+e.dias[q]||0):null)}});
  const tD=CR_DSEM.slice(0,nD).map((n,q)=>rows.reduce((x,r)=>x+(r.d[q]||0),0)),tt=tD.reduce((x,v)=>x+v,0);
  c.innerHTML=`<div class="cra-box cra-hs"><div class="cra-bt"><span>Horário semanal da turma</span><span class="hint" style="margin:0;font-weight:400">tempos de cada disciplina em cada dia da semana</span><span class="grow"></span>${ed?`<label class="cra-dde">desde<input type="date" id="crAnoHsDe" value="${seg}"></label><button class="b s" id="crAnoHsGrava" type="button" disabled>Gravar o horário</button>`:""}</div>
    <div class="tw"><table class="cra-hst"><thead><tr><th>Disciplina</th>${CR_DSEM.slice(0,nD).map(n=>`<th>${n}</th>`).join("")}<th>Total</th></tr></thead><tbody>${rows.map(r=>{const sm=r.d.reduce((x,v)=>x+(v||0),0);
      return `<tr><td class="hn"><a href="#" data-crhsd="${esc(r.o.k)}" title="Ver esta disciplina">${esc(r.o.disc)}</a>${!r.d.some(v=>v!=null)&&r.e&&r.e.tl?`<small>${crNum(r.e.tl)} por semana, sem dias certos</small>`:""}</td>${r.d.map((v,q)=>ed?`<td class="${v>0?"on":""}"><input type="text" inputmode="decimal" data-crhs="${esc(r.o.k)}|${q}" value="${v==null?"":esc(crNum(v))}" placeholder="0" autocomplete="off" aria-label="${esc(r.o.disc)} à ${CR_DSEM[q]}"></td>`:`<td class="${v>0?"on":""}">${v?crNum(v):""}</td>`).join("")}<td class="ht" data-crhst="${esc(r.o.k)}">${sm?crNum(sm):""}</td></tr>`}).join("")}</tbody>
      <tfoot><tr><td>Total da turma${lim?` <small>(máximo ${lim})</small>`:""}</td>${tD.map((v,q)=>`<td data-crhsdia="${q}">${crNum(v)}</td>`).join("")}<td class="ht${lim&&tt>lim?" crneg":""}" id="crAnoHsTot">${crNum(tt)}</td></tr></tfoot></table></div>
    ${ed?`<p class="hint" style="margin:0">Cada número vale a partir da semana escolhida, até à próxima mudança. Enter passa à casa seguinte.</p>`:""}</div>`}
$("#crAnoHs").addEventListener("input",e=>{const i=e.target.closest("[data-crhs]");if(!i)return;const nD=CR_DSEM.length,box=$("#crAnoHs");i.parentNode.classList.toggle("on",(parseFloat(i.value.replace(",","."))||0)>0);
  const val=x=>parseFloat(x.value.replace(",","."))||0,all=[...box.querySelectorAll("[data-crhs]")],byK={},byD={};let t=0;
  for(const x of all){const [k,q]=x.dataset.crhs.split("|"),v=val(x);byK[k]=(byK[k]||0)+v;byD[q]=(byD[q]||0)+v;t+=v}
  box.querySelectorAll("[data-crhst]").forEach(td=>td.textContent=byK[td.dataset.crhst]?crNum(Math.round(byK[td.dataset.crhst]*10)/10):"");
  box.querySelectorAll("[data-crhsdia]").forEach(td=>td.textContent=crNum(Math.round((byD[td.dataset.crhsdia]||0)*10)/10));$("#crAnoHsTot").textContent=crNum(Math.round(t*10)/10);$("#crAnoHsGrava").disabled=false});
$("#crAnoHs").addEventListener("focusin",e=>{const i=e.target.closest("[data-crhs]");if(i)try{i.select()}catch(x){}});
$("#crAnoHs").addEventListener("keydown",e=>{const i=e.target.closest("[data-crhs]");if(!i||e.key!=="Enter")return;e.preventDefault();const L=[...$("#crAnoHs").querySelectorAll("[data-crhs]")],n=L[L.indexOf(i)+1];if(n)n.focus();else $("#crAnoHsGrava").focus()});
$("#crAnoHs").addEventListener("change",e=>{if(e.target.id==="crAnoHsDe"){CRA.dde=e.target.value||"";crAno()}});
$("#crAnoHs").addEventListener("click",e=>{const d=e.target.closest("[data-crhsd]");if(d){e.preventDefault();CRA.d=d.dataset.crhsd;crAno();return}
  if(!e.target.closest("#crAnoHsGrava")||!crPodeEditar())return;const a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(CRA.t);if(!T)return;
  const seg=crSeg($("#crAnoHsDe").value||"");if(!M.semanas.some(w=>w.seg===seg)){toast("Essa semana está fora do ano letivo");return}
  const by={};let mal=false;$("#crAnoHs").querySelectorAll("[data-crhs]").forEach(x=>{const [k,q]=x.dataset.crhs.split("|"),t=x.value.trim().replace(",","."),v=t===""?null:parseFloat(t);if(v!=null&&!(v>=0&&v<=12))mal=true;(by[k]=by[k]||[])[+q]=v});
  if(mal){toast("Escreva de 0 a 12 tempos em cada casa");return}let n=0;
  for(const k in by){const o=T.discs.get(k);if(!o)continue;const d=by[k];if(d.every(v=>v==null))continue;const dias=CR_DSEM.slice(0,M.nD).map((x,q)=>d[q]||0),e0=crManEnt(o.manL,seg);
    if(e0&&Array.isArray(e0.dias)&&dias.every((v,q)=>Math.abs(v-(+e0.dias[q]||0))<1e-6))continue;crManPor(a,T.t.id,k,o.disc,seg,dias.reduce((x,v)=>x+v,0),dias);n++}
  if(!n){toast("Não há mudanças para gravar");return}save();CR_CACHE.k="";CRA.dde=seg;crAno();crAnoMsg(`✓ Horário semanal da ${esc(T.t.cod)} gravado a partir da semana de ${esc(calDM(seg))} (${n} disciplina${n===1?"":"s"}).`)});
// 0.9.129: PDF do Ano inteiro (A4 deitado, como a folha de cronograma da escola). Numa disciplina: 1 página. Em «Todas as disciplinas»: a turma, o horário semanal e uma página por disciplina.
async function crAnoPdf(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),T=M.turmas.get(CRA.t);if(!T||!M.D.length){toast("Escolha uma turma");return}
  const me=crMeuId(),L=[...T.discs.values()].filter(o=>o.P>0&&crDoFormador(o,me)).sort(crOrdArea);if(!L.length){toast("Sem disciplinas");return}
  const J=await loadPDF(),doc=new J({unit:"mm",format:"a4",orientation:"landscape"}),ks=CRA.d==="__t"?["__t",...L.map(o=>o.k)]:[CRA.d];
  ks.forEach((k,n)=>{if(n)doc.addPage();crAnoPdfPag(doc,M,T,k,asof);if(k==="__t"&&M.manual){doc.addPage();crAnoPdfHs(doc,M,T,asof)}});
  pdfMoldura(doc,`Escola Profissional da Ilha de São Jorge · EPISJ 360 · Crono360 · ano letivo ${a.nome} · situação a ${calDMA(asof)}`,T.t.fse);
  const o=T.discs.get(CRA.d);doc.save(pdfTxt(`Cronograma ${T.t.cod}${o?" - "+o.disc:""} ${asof}.pdf`).replace(/[\\/:*?"<>|]/g,"-"))}
function crAnoPdfPag(doc,M,T,k,asof){const a=M.a,f=M.fator,o=k==="__t"?null:T.discs.get(k),R=crAnoDados(M,T,k),D=M.D,N=D.length,iA=M.iA,NL=M.NL||new Map(),HJ=calHoje(),P=R.L.reduce((s,x)=>s+x.P,0);
  const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),h1=x=>crNum(Math.round(crH1(x,f)*10)/10),dA=x=>calD(x).toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit",year:"2-digit"});
  const papD=new Set();for(const m of calMarcos(a,T.t.id))if(m.tipo==="pap")for(const x of calDatasDe(m))papD.add(x);const emFct=x=>T.fct.some(m=>x>=m.de&&x<=m.ate);
  let df=0;const dfA={},sem=new Set();for(let i=0;i<N;i++)if(R.v[i]>1e-6){df++;const y=D[i].slice(0,4);dfA[y]=(dfA[y]||0)+1;sem.add(crSeg(D[i]))}
  const G=R.L.reduce((s,x)=>s+(x.G||0),0),prevA=iA>=0?R.pl[iA]:0,dif=G-prevA,forms=o?[...o.f.entries()].sort((x,y)=>y[1]-x[1]).map(([id])=>(cfg.profs.find(p=>p.id===id)||{}).nome).filter(Boolean):[];
  // cabeçalho
  let y=PDF_TOP+4;doc.setFont("helvetica","bold");doc.setFontSize(14);doc.setTextColor(22,40,80);doc.text(pdfTxt(`${T.t.cod} · ${o?o.disc:"Todas as disciplinas"}`),14,y);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);y+=5;
  const l1=[turmaNome(T.t),`Ano letivo ${a.nome}`,forms.length?"Formador: "+forms.join(", "):"",`Plano ${h1(P)} h`,o&&R.ini>=0?`Início ${dA(D[R.ini])}`:"",o?(R.fim>=0?`${R.fim<=iA?"Fim":"Fim previsto"} ${dA(D[R.fim])}`:"Não acaba até ao fim do ano"):"",`${df} dias de formação (${Object.keys(dfA).sort().map(y=>y+": "+dfA[y]).join(" · ")})`,`${sem.size} semanas`].filter(Boolean).join("  ·  ");
  doc.text(pdfTxt(l1),14,y,{maxWidth:W-28});y+=4.5;
  let l2=`Ponto de situação a ${calDMA(asof)}: previsto ${h1(prevA)} h · dadas ${h1(G)} h · diferença ${dif>=0?"+":"-"}${h1(Math.abs(dif))} h · falta dar ${h1(Math.max(0,P-G))} h`;
  if(o&&M.manual){const e=crManEnt(o.manL,crSeg(asof));if(e)l2+=`   ·   Dias de aula: ${Array.isArray(e.dias)?CR_DSEM.slice(0,M.nD).map((n,q)=>e.dias[q]?n+" "+crNum(e.dias[q]):"").filter(Boolean).join(", "):crNum(e.tl)+" tempos por semana"}`}
  doc.setTextColor(40);doc.text(pdfTxt(l2),14,y);y+=3.5;
  // grelha
  const m0=D[0].slice(0,7),m1=D[N-1].slice(0,7),meses=[];for(let yy=+m0.slice(0,4),m=+m0.slice(5,7),g=0;g<24;g++){const key=`${yy}-${String(m).padStart(2,"0")}`;meses.push({y:yy,m,key});if(key===m1)break;m++;if(m>12){m=1;yy++}}
  const legH=7,avail=H-PDF_BOT-2-legH-y,rh=Math.min(11,avail/meses.length),r1=rh*0.56,r2=rh-r1,x0=14,cm=22,cdf=16,cw=(W-28-cm-cdf)/31;
  const C={aula:[220,231,251],aula2:[169,194,242],ini:[15,159,148],ifim:[22,50,105],fer:[220,74,74],int:[253,226,170],fct:[239,236,255],pap:[246,220,250],fds:[238,241,245],nx:[243,245,248],out:[250,251,252],hoje:[47,208,196]};
  doc.setLineWidth(.15);
  meses.forEach((mm,r)=>{const yt=y+r*rh,nd=new Date(mm.y,mm.m,0).getDate();let dfm=0,last=-1;
    const nome=calD(`${mm.key}-01`).toLocaleDateString("pt-PT",{month:"long"});doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.setTextColor(25);doc.text(pdfTxt(nome.charAt(0).toUpperCase()+nome.slice(1)),x0+2,yt+rh/2-0.3);doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(110);doc.text(String(mm.y),x0+2,yt+rh/2+3);
    for(let d=1;d<=31;d++){const xc=x0+cm+(d-1)*cw;let fill=null,fill2=null,txt=null,tc=[22,50,105],dc=[25,25,25],wc=[110,110,110],wd=0,lab="";
      if(d>nd){fill=fill2=C.nx}else{const x=`${mm.key}-${String(d).padStart(2,"0")}`,i=M.ix.get(x),nl=NL.get(x);wd=(calD(x).getDay()+6)%7;const fds=wd>=M.nD,aula=i!=null&&R.v[i]>1e-6,fct=!fds&&!nl&&emFct(x),red=i!=null&&o&&(i===R.ini||i===R.fim);lab=x===HJ?"hoje":CR_DSEM[wd];
        if(i==null){fill=fill2=C.out;dc=wc=[195,200,210]}
        else if(red){fill=fill2=i===R.ini?C.ini:C.ifim;dc=wc=tc=[255,255,255]}
        else if(nl&&nl.t==="fer"&&!fds){fill=fill2=C.fer;dc=wc=tc=[255,255,255]}
        else if(fds){fill=fill2=C.fds;dc=wc=[165,172,186]}
        else if(nl){fill=fill2=C.int;wc=[122,75,0]}
        else if(papD.has(x)){fill=fill2=C.pap;tc=[162,28,175]}
        else if(aula){fill=C.aula;fill2=C.aula2}
        else if(fct){fill=fill2=C.fct;tc=[91,75,214]}
        if(x===HJ){fill=C.hoje;dc=wc=[11,42,58]}
        if(aula)txt=crNum(Math.round(R.v[i]*10)/10);else if(fct)txt="FCT";else if(papD.has(x))txt="PAP";
        if(i!=null){last=i;if(aula)dfm++}}
      if(fill){doc.setFillColor(...fill);doc.rect(xc,yt,cw,r1,"F")}if(fill2){doc.setFillColor(...fill2);doc.rect(xc,yt+r1,cw,r2,"F")}
      if(d<=nd){doc.setFont("helvetica","bold");doc.setFontSize(Math.min(7.5,r1*1.6));doc.setTextColor(...dc);doc.text(String(d),xc+cw/2,yt+r1*0.48,{align:"center"});
        doc.setFont("helvetica","normal");doc.setFontSize(Math.min(5.2,r1*1.1));doc.setTextColor(...wc);doc.text(pdfTxt(lab),xc+cw/2,yt+r1*0.9,{align:"center"});
        if(txt){doc.setFont("helvetica","bold");doc.setFontSize(txt.length>2?5.2:Math.min(8,r2*2));doc.setTextColor(...tc);doc.text(pdfTxt(txt),xc+cw/2,yt+r1+r2*0.72,{align:"center"})}}
      const x=`${mm.key}-${String(d).padStart(2,"0")}`;if(d<=nd&&x===asof){doc.setDrawColor(27,35,51);doc.setLineWidth(.6);doc.rect(xc+.3,yt+.3,cw-.6,rh-.6);doc.setLineWidth(.15)}}
    // DF/M
    const xd=x0+cm+31*cw;doc.setFillColor(237,242,251);doc.rect(xd,yt,cdf,rh,"F");doc.setTextColor(22,50,105);doc.setFont("helvetica","bold");doc.setFontSize(7);doc.text(dfm?dfm+" d":"-",xd+cdf/2,yt+r1*0.7,{align:"center"});
    doc.setFontSize(7.5);doc.setTextColor(25);doc.text(last>=0?h1(R.ac[last])+" h":"",xd+cdf/2,yt+r1+r2*0.72,{align:"center"});
    // linhas
    doc.setDrawColor(195,203,216);for(let d=0;d<=31;d++){const xx=x0+cm+d*cw;doc.line(xx,yt,xx,yt+rh)}doc.line(x0+cm,yt+r1,x0+cm+31*cw,yt+r1);
    doc.setDrawColor(125,137,156);doc.setLineWidth(.45);doc.line(x0,yt,W-14,yt);doc.setLineWidth(.15)});
  const yb=y+meses.length*rh;doc.setDrawColor(125,137,156);doc.setLineWidth(.6);doc.rect(x0,y,W-28,yb-y);doc.line(x0+cm,y,x0+cm,yb);doc.line(x0+cm+31*cw,y,x0+cm+31*cw,yb);doc.setLineWidth(.15);
  // legenda
  let xl=x0,yl=yb+4.5;doc.setFontSize(6.8);doc.setFont("helvetica","normal");
  for(const [c,t] of [[C.aula2,"Dia com aulas"],[C.ini,"Início"],[C.ifim,"Fim"],[C.fer,"Feriado"],[C.int,"Interrupção"],[C.fct,"FCT"],[C.pap,"PAP"],[C.fds,"Fim de semana"],[C.hoje,"Hoje"],[null,"Ponto de situação"],[null,"DF/M: dias com aulas no mês e total acumulado (h)"]]){
    if(c){doc.setFillColor(...c);doc.rect(xl,yl-2.4,3,3,"F");xl+=4}else if(t==="Ponto de situação"){doc.setDrawColor(27,35,51);doc.setLineWidth(.5);doc.rect(xl,yl-2.4,3,3);doc.setLineWidth(.15);xl+=4}
    doc.setTextColor(90);doc.text(pdfTxt(t),xl,yl);xl+=doc.getTextWidth(pdfTxt(t))+5}}
function crAnoPdfHs(doc,M,T,asof){const nD=M.nD,seg=crSeg(asof),L=[...T.discs.values()].filter(o=>o.P>0).sort(crOrdArea);
  let y=pdfTitulo(doc,"Horário semanal — "+T.t.cod,`${turmaNome(T.t)} · tempos por dia da semana na semana de ${calDM(seg)}`);
  const rows=L.map(o=>{const e=crManEnt(o.manL,seg),d=CR_DSEM.slice(0,nD).map((n,q)=>e&&Array.isArray(e.dias)?(+e.dias[q]||0):0),sm=e?(+e.tl||0):0;return[o.disc,...d.map(v=>v?crNum(v):""),sm?crNum(sm):""]});
  const tot=CR_DSEM.slice(0,nD).map((n,q)=>L.reduce((s,o)=>{const e=crManEnt(o.manL,seg);return s+(e&&Array.isArray(e.dias)?(+e.dias[q]||0):0)},0));
  rows.push(["Total da turma",...tot.map(v=>crNum(v)),crNum(L.reduce((s,o)=>{const e=crManEnt(o.manL,seg);return s+(e?(+e.tl||0):0)},0))]);
  const cols={};for(let q=1;q<=nD+1;q++)cols[q]={halign:"center",cellWidth:20};pdfTabela(doc,y,["Disciplina",...CR_DSEM.slice(0,nD),"Total"],rows.map(r=>r.map(pdfTxt)),cols)}
$("#crAnoPdf").onclick=async()=>{const b=$("#crAnoPdf");b.disabled=true;try{await crAnoPdf()}catch(e){console.warn(e);toast("Não foi possível criar o PDF")}finally{b.disabled=false}};
// painel do dia escolhido
function crAnoDia(M,T,o,ed){const c=$("#crAnoDia");if(!c)return;const x=CRA.dia,i=x?M.ix.get(x):null;if(i==null){c.innerHTML="";return}
  const wd=(calD(x).getDay()+6)%7,nl=(M.NL||new Map()).get(x),R=crAnoDados(M,T,CRA.d),fct=T.fct.some(m=>x>=m.de&&x<=m.ate)&&wd<M.nD&&!nl;
  const dm=o&&o.diaM&&o.diaM.get(i),base=o?(dm?dm.base:o.sch[i]):0,v=o?(dm?dm.tl:o.sch[i]):R.v[i],pode=M.manual&&ed&&o,asof=CR_SEL.asof||calHoje();
  const oque=nl?nl.n:fct?"FCT":wd>=M.nD?"Fim de semana":T.fora[i]?"Sem aulas da turma":"";
  c.innerHTML=`<div class="cra-dia"><div class="cra-dt"><b>${esc((t=>t.charAt(0).toUpperCase()+t.slice(1))(calD(x).toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"})))}</b>${oque?`<span class="cra-chip">${esc(oque)}</span>`:""}${dm?`<span class="cra-chip dman">acerto à mão${dm.nota?": "+esc(dm.nota):""}</span>`:""}<span class="grow"></span><button class="b s" type="button" data-crafecha aria-label="Fechar">×</button></div>
    <div class="cra-dr">${o?`<span>${esc(o.disc)}: o cronograma dá <b>${crNum(Math.round(base*10)/10)}</b> tempo(s) neste dia.</span>`:`<span>Toda a turma: <b>${crNum(Math.round(v*10)/10)}</b> tempo(s) neste dia.</span>`}
      ${pode?`<span class="grow"></span><label class="crano-g">Tempos neste dia<span class="cpst"><button type="button" data-crdm="-1" aria-label="Menos um tempo">−</button><b id="crAnoDiaV">${crNum(Math.round(v*10)/10)}</b><button type="button" data-crdm="1" aria-label="Mais um tempo">+</button></span></label><label class="crano-g">Nota<input type="text" id="crAnoDiaN" value="${esc(dm?dm.nota:"")}" placeholder="por exemplo, aula extra" style="width:170px"></label><button class="b s" id="crAnoDiaGrava" type="button">Gravar o dia</button>${dm?`<button class="b s" id="crAnoDiaRepor" type="button">Voltar ao cronograma</button>`:""}`:""}</div>
    ${x!==asof?`<button class="b s cra-lnk" type="button" data-crasit>Ver o ponto de situação neste dia</button>`:`<span class="hint" style="margin:0">É o dia do ponto de situação.</span>`}</div>`}
// eventos
$("#crAnoT").onchange=e=>{CRA.t=e.target.value;CRA.d="";CRA.dde="";CRA.dia="";crAno()};
$("#crAnoD").onchange=e=>{CRA.d=e.target.value;CRA.dde="";crAno()};
["#crAnoAnt","#crAnoSeg"].forEach((q,n)=>$(q).addEventListener("click",()=>{const op=[...$("#crAnoD").options].map(x=>x.value);if(!op.length)return;const i=op.indexOf(CRA.d);CRA.d=op[(i+(n?1:-1)+op.length)%op.length];CRA.dde="";crAno()}));
$("#crAnoHoje").onclick=()=>{CR_SEL.asof=calHoje();CRA.dia="";crBarras();crAno();const h=$("#crAnoOut td.hoje");if(h)h.scrollIntoView({block:"center",inline:"center",behavior:"smooth"})};
$("#crAnoOut").addEventListener("click",e=>{const td=e.target.closest("[data-crad]");if(!td)return;CRA.dia=CRA.dia===td.dataset.crad?"":td.dataset.crad;crAno();if(CRA.dia){const p=$("#crAnoDia");if(p&&p.getBoundingClientRect().top<70)p.scrollIntoView({block:"nearest",behavior:"smooth"})}});
function crAnoMsg(h,k){escLinhaMsg("#crAnoMsg",h,k||"ok")}
$("#crAno").addEventListener("change",e=>{if(e.target.id==="crAnoAsof"&&e.target.value){CR_SEL.asof=e.target.value;crBarras();crAno()}else if(e.target.id==="crAnoDiasDe"){CRA.dde=e.target.value||"";crAno()}});
$("#crAno").addEventListener("focusin",e=>{const i=e.target.closest("#crAnoDiasBar [data-cradia]");if(i)try{i.select()}catch(x){}});
$("#crAno").addEventListener("input",e=>{const i=e.target.closest("#crAnoDiasBar [data-cradia]");if(!i)return;const L=[...$("#crAnoDiasBar").querySelectorAll("[data-cradia]")];let t=0;L.forEach(x=>{const v=parseFloat(x.value.replace(",","."))||0;t+=v;x.parentNode.classList.toggle("on",v>0)});$("#crAnoDiasTot").innerHTML=`= <b>${crNum(Math.round(t*10)/10)}</b> por semana`;$("#crAnoDiasGrava").disabled=false});
$("#crAno").addEventListener("keydown",e=>{if(e.target.id==="crAnoG"&&e.key==="Enter"){e.preventDefault();$("#crAnoGGrava").click()}
  const i=e.target.closest("[data-cradia]");if(i&&e.key==="Enter"){e.preventDefault();const n=i.parentNode.nextElementSibling;if(n&&n.querySelector("input"))n.querySelector("input").focus();else{const g=$("#crAnoDiasGrava");g.disabled=false;g.click()}}});
document.querySelector("#crAno").addEventListener("click",e=>{if(e.target.closest("[data-craab]")){e.preventDefault();const i=$("#crAnoDiasBar [data-cradia]");if(i){i.focus();i.scrollIntoView({block:"center",behavior:"smooth"})}return}
  if(e.target.closest("[data-crahoje]")){CR_SEL.asof=calHoje();crBarras();crAno();return}});
$("#crAno").addEventListener("click",e=>{const a=crAnoSel();
  if(e.target.closest("#crAnoReg")){const asof=CR_SEL.asof||calHoje(),p=crRegistar(asof,false);if(p)crAnoMsg(`✓ Guardado: <b>${esc(p.nome)}</b>. Está nos <a href="#" data-crir="crHist">Pontos de situação</a>.`);return}
  if(e.target.closest("#crAnoGGrava")&&crPodeEditar()){const asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),T=M.turmas.get(CRA.t),o=T&&T.discs.get(CRA.d);if(!o)return;
    const v=parseFloat($("#crAnoG").value.trim().replace(/\s/g,"").replace(",","."));if(!(v>=0)){toast("Escreva as horas dadas (por exemplo, 42)");return}
    const c=crCfg(),j=c.corr.findIndex(x=>x&&x.anoId===a.id&&x.turmaId===T.t.id&&x.disc===o.k&&x.data===asof),r={id:j>=0?c.corr[j].id:uid(),anoId:a.id,turmaId:T.t.id,disc:o.k,discNome:o.disc,data:asof,dados:v,nota:"horas dadas",por:String(EU&&EU.email||""),em:Date.now()};
    if(j>=0)c.corr[j]=r;else c.corr.push(r);save();CR_CACHE.k="";crAno();crAnoMsg(`✓ ${esc(o.disc)}: ${crNum(v)} h dadas até ${esc(calDMA(asof))}.`);return}
  if(e.target.closest("#crAnoDiasGrava")&&crPodeEditar()){const M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(CRA.t),o=T&&T.discs.get(CRA.d);if(!o)return;
    const de=$("#crAnoDiasDe").value;if(!de){toast("Escolha a semana");return}const seg=crSeg(de);if(!M.semanas.some(w=>w.seg===seg)){toast("Essa semana está fora do ano letivo");return}
    const dias=[];let mal=false;$("#crAnoDiasBar").querySelectorAll("[data-cradia]").forEach(i=>{const t=i.value.trim().replace(",",".");const v=t===""?0:parseFloat(t);if(!(v>=0&&v<=12))mal=true;dias[+i.dataset.cradia]=v||0});
    if(mal){toast("Escreva de 0 a 12 tempos em cada dia");return}const tl=dias.reduce((s,x)=>s+x,0);
    crManPor(a,T.t.id,o.k,o.disc,seg,tl,dias);CRA.dde="";save();CR_CACHE.k="";crAno();
    crAnoMsg(`✓ ${esc(o.disc)}: ${esc(CR_DSEM.slice(0,M.nD).map((n,q)=>dias[q]?n+" "+crNum(dias[q]):"").filter(Boolean).join(", ")||"sem aulas")} a partir da semana de ${esc(calDM(seg))}.`)}});
$("#crAnoDia").addEventListener("click",e=>{const a=crAnoSel(),T0=CRA.t,k=CRA.d,x=CRA.dia;if(!x)return;
  if(e.target.closest("[data-crafecha]")){CRA.dia="";crAno();return}
  if(e.target.closest("[data-crasit]")){CR_SEL.asof=x;crBarras();crAno();return}
  if(!crPodeEditar())return;const st=e.target.closest("[data-crdm]");
  if(st){const b=$("#crAnoDiaV");const v=Math.max(0,Math.min(12,(parseFloat(String(b.textContent).replace(",","."))||0)+(+st.dataset.crdm)));b.textContent=crNum(Math.round(v*10)/10);return}
  const c=crCfg(),j=c.dia.findIndex(q=>q&&q.anoId===a.id&&q.turmaId===T0&&q.disc===k&&q.data===x);
  if(e.target.closest("#crAnoDiaRepor")){if(j>=0)c.dia.splice(j,1);save();CR_CACHE.k="";crAno();crAnoMsg(`✓ ${esc(calDMA(x))} volta a contar o que está no cronograma.`);return}
  if(!e.target.closest("#crAnoDiaGrava"))return;const M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(T0),o=T&&T.discs.get(k);if(!o)return;
  const ix=M.ix.get(x),v=parseFloat(String($("#crAnoDiaV").textContent).replace(",","."))||0,nota=$("#crAnoDiaN").value.trim().slice(0,120),dm=o.diaM&&o.diaM.get(ix),base=dm?dm.base:o.sch[ix];
  if(Math.abs(v-base)<1e-6&&!nota){if(j>=0)c.dia.splice(j,1)}else{const r={id:j>=0?c.dia[j].id:uid(),anoId:a.id,turmaId:T0,disc:k,discNome:o.disc,data:x,tl:v,nota,por:String(EU&&EU.email||""),em:Date.now()};if(j>=0)c.dia[j]=r;else c.dia.push(r)}
  save();CR_CACHE.k="";crAno();crAnoMsg(`✓ ${esc(o.disc)} a ${esc(calDMA(x))}: ${crNum(v)} tempo(s)${nota?` (${esc(nota)})`:""}. A contagem já conta com isto.`)});
$("#crAnoAmp").onclick=()=>{const on=!document.body.classList.contains("cramplo");document.body.classList.toggle("cramplo",on);
  try{if(on&&document.documentElement.requestFullscreen&&!document.fullscreenElement)document.documentElement.requestFullscreen().catch(()=>{});else if(!on&&document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(x){}crAnoAmpSync()};
document.addEventListener("fullscreenchange",()=>{if(!document.fullscreenElement&&document.body.classList.contains("cramplo")){document.body.classList.remove("cramplo");crAnoAmpSync()}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("cramplo")){document.body.classList.remove("cramplo");try{if(document.fullscreenElement)document.exitFullscreen().catch(()=>{})}catch(x){}crAnoAmpSync()}});
/* ---------- Ajustar (substitui «Cumprir o plano» quando o cronograma é escrito à mão) ---------- */
function crAjDados(M,T,seg){const D=M.D,N=D.length,iA=M.iA;let iDe=D.findIndex(x=>x>=seg);if(iDe<0)iDe=N;const wDe=M.semanas.findIndex(w=>w.seg===seg);
  let ef=0;for(let i=Math.max(iDe,iA+1);i<N;i++)if(!T.fora[i])ef+=1/M.nD;
  return [...T.discs.values()].filter(o=>o.P>0).sort(crOrdArea).map(o=>{let antes=0;for(let i=iA+1;i<Math.min(iDe,N);i++)antes+=o.sch[i];
    const falta=Math.max(0,o.P-o.G-antes),agora=wDe>=0?(o.manW[wDe]||0):0,precisa=falta<=1e-6?0:ef>0?falta/ef:Infinity;
    return{o,falta,agora,precisa,depois:(o.manL||[]).filter(x=>x.de>seg)}})}
function crAjRender(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),f=M.fator,ed=crPodeEditar(),d=crCfg().def;
  $("#ajAviso").innerHTML=crAvisoBase(a,M);
  const ord=[...M.turmas.values()].map(T=>{let def=0,n=0;for(const o of T.discs.values())if(o.P>0&&o.saldo<-1e-6){def+=-o.saldo;n++}return{T,def,n}}).filter(x=>[...x.T.discs.values()].some(o=>o.P>0)).sort((p,q)=>q.def-p.def||COLL_PTN.compare(String(p.T.t.cod),String(q.T.t.cod)));
  if(AJ.t&&!M.turmas.has(AJ.t))AJ.t=null;if(!AJ.t){AJ.t=(ord[0]||{T:{t:{id:""}}}).T.t.id;AJ.alvo={}}
  $("#ajT").innerHTML=ord.map(x=>`<option value="${x.T.t.id}"${x.T.t.id===AJ.t?" selected":""}>${esc(calTurmaCurta(x.T.t))}${x.n?` — ${x.n} não acaba${x.n===1?"":"m"}`:" — em dia"}</option>`).join("");
  if(!AJ.de)AJ.de=cpDataPadrao(a,asof);const seg=crSeg(AJ.de),di=$("#ajDe");if(document.activeElement!==di)di.value=AJ.de;
  ["#ajProp","#ajRepor","#ajGrava"].forEach(q=>{$(q).style.display=ed?"":"none"});
  const T=M.turmas.get(AJ.t);if(!T){$("#ajTab").innerHTML=`<p class="hint">Escolha uma turma com plano curricular.</p>`;$("#ajTiles").innerHTML="";return}
  if(!M.semanas.some(w=>w.seg===seg)){$("#ajTab").innerHTML=`<p class="hint">A data escolhida está fora do ano letivo ${esc(a.nome)}.</p>`;$("#ajTiles").innerHTML="";return}
  const rows=crAjDados(M,T,seg),nov=r=>AJ.alvo[r.o.k]!=null?AJ.alvo[r.o.k]:r.agora,ovr={};
  for(const r of rows)if(Math.abs(nov(r)-r.agora)>1e-6)ovr[T.t.id+"|"+r.o.k]=[{de:seg,tl:nov(r),em:Infinity}];
  const mud=Object.keys(ovr).length,Ms=mud?crMotor(a,asof,null,{ovr}):M,Ts=Ms.turmas.get(T.t.id),lim=+((d.tlT[a.id]||{})[T.t.id])||0;
  const sA=rows.reduce((s,r)=>s+r.agora,0),sN=rows.reduce((s,r)=>s+nov(r),0),naoA=rows.filter(r=>r.o.saldo<-1e-6).length,naoN=rows.filter(r=>Ts.discs.get(r.o.k).saldo<-1e-6).length;
  const fins=rows.map(r=>Ts.discs.get(r.o.k)).filter(o=>o.G<o.P-1e-6).map(o=>o.fimPrev);const ult=fins.includes("")?"":fins.sort().pop()||"";
  $("#ajTiles").innerHTML=[[String(naoN),mud?`Não acabam a tempo com as mudanças (agora ${naoA})`:"Disciplinas que não acabam a tempo",naoN?"crtb":""],[crNum(sN)+(lim?" / "+lim:""),"Tempos por semana da turma a partir de "+calDM(seg)+(mud?` (agora ${crNum(sA)})`:""),lim&&sN>lim+1e-6?"crtb":mud?"cptok":""],
    [ult?calDM(ult,{day:"numeric",month:"short"}):fins.length?"não acaba":"—","Fim previsto da última disciplina",!ult&&fins.length?"crtb":""]].map(([v,l,c])=>`<div class="tile ${c}"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
  $("#ajTab").innerHTML=`<div class="tw"><table class="rt crdt crlab cpt"><thead><tr><th>Disciplina</th><th class="crn">Plano</th><th class="crn">Dadas</th><th class="crn" title="O que falta dar a partir de ${esc(calDM(seg))} (já desconta o que o cronograma dá até lá)">Falta a ${esc(calDM(seg))}</th><th class="crn" title="Tempos por semana no cronograma a partir dessa semana">Tem</th><th class="crn" title="Tempos por semana precisos para acabar até ao fim das aulas da turma">Precisa</th><th class="crn">Novo</th><th>Acaba</th><th>Estado</th></tr></thead><tbody>`
    +rows.map(r=>{const o=r.o,os=Ts.discs.get(o.k),n=nov(r),m=Math.abs(n-r.agora)>1e-6,feita=o.G>=o.P-1e-6,pc=r.precisa===Infinity?"—":crNum(Math.ceil(r.precisa*10-1e-6)/10);
      return `<tr class="${m?"cpmud":""}"><td><b>${esc(o.disc)}</b>${r.depois.length?`<div class="hint" style="margin:0">no cronograma muda outra vez a ${esc(r.depois.map(x=>calDM(x.de)).join(", "))}</div>`:""}</td><td class="crn">${crNum(crH1(o.P,f))}</td><td class="crn">${crNum(crH1(o.G,f))}</td><td class="crn">${crNum(crH1(r.falta,f))}</td><td class="crn">${crNum(r.agora)}</td><td class="crn${r.precisa>r.agora+1e-6?" crneg":""}">${feita?"—":pc}</td>
        <td class="crn">${ed?`<span class="cpst${m?" mud":""}"><button type="button" data-ajm="${esc(o.k)}" data-d="-1"${n<=0?" disabled":""} aria-label="Menos um tempo por semana de ${esc(o.disc)}">−</button><b>${crNum(n)}</b><button type="button" data-ajm="${esc(o.k)}" data-d="1"${n>=40?" disabled":""} aria-label="Mais um tempo por semana de ${esc(o.disc)}">+</button></span>`:crNum(n)}</td>
        <td>${os.G>=os.P-1e-6?"concluída":os.fimPrev?calDM(os.fimPrev):`<span class="crneg">não acaba</span>`}${m&&o.fimPrev!==os.fimPrev?`<div class="hint" style="margin:0">antes: ${o.fimPrev?esc(calDM(o.fimPrev)):"não acabava"}</div>`:""}</td><td>${crTag(os.est)}</td></tr>`}).join("")
    +`</tbody></table></div>`;crRotulos($("#ajTab"))}
// proposta: as que não acabam passam para os tempos de que precisam; se a turma tiver máximo, tira-se às que têm tempos a mais
function crAjProposta(){const a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(AJ.t);if(!T)return;const seg=crSeg(AJ.de),rows=crAjDados(M,T,seg),d=crCfg().def,lim=+((d.tlT[a.id]||{})[T.t.id])||0,al={};
  for(const r of rows){const pc=r.precisa===Infinity?r.agora:Math.ceil(r.precisa-1e-6);al[r.o.k]=r.o.G>=r.o.P-1e-6?0:Math.max(r.agora,pc)}
  if(lim){let tot=rows.reduce((s,r)=>s+al[r.o.k],0),g=0;while(tot>lim&&g++<400){const r=rows.filter(r=>al[r.o.k]>Math.ceil(r.precisa-1e-6)).sort((p,q)=>(al[q.o.k]-q.precisa)-(al[p.o.k]-p.precisa))[0];if(!r)break;al[r.o.k]--;tot--}}
  AJ.alvo=al;crAjRender();const n=rows.filter(r=>Math.abs(al[r.o.k]-r.agora)>1e-6).length;escLinhaMsg("#ajMsg",n?`Proposta: ${n} disciplina${n===1?" muda":"s mudam"}. Veja quando passam a acabar e grave no cronograma.`:"Todas as disciplinas acabam a tempo com os tempos que têm.",n?"info":"ok")}
$("#ajT").onchange=e=>{AJ.t=e.target.value;AJ.alvo={};$("#ajMsg").innerHTML="";crAjRender()};
$("#ajDe").onchange=e=>{if(e.target.value){AJ.de=e.target.value;crAjRender()}};
$("#ajTab").addEventListener("click",e=>{const b=e.target.closest("[data-ajm]");if(!b||!crPodeEditar())return;const a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(AJ.t);if(!T)return;const r=crAjDados(M,T,crSeg(AJ.de)).find(x=>x.o.k===b.dataset.ajm);if(!r)return;
  const v=(AJ.alvo[r.o.k]!=null?AJ.alvo[r.o.k]:r.agora)+(+b.dataset.d);AJ.alvo[r.o.k]=Math.max(0,Math.min(40,Math.round(v*10)/10));crAjRender()});
$("#ajProp").onclick=crAjProposta;
$("#ajRepor").onclick=()=>{AJ.alvo={};$("#ajMsg").innerHTML="";crAjRender()};
$("#ajGrava").onclick=()=>{if(!crPodeEditar())return;const a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),T=M.turmas.get(AJ.t);if(!T)return;const seg=crSeg(AJ.de),rows=crAjDados(M,T,seg);
  const ms=rows.filter(r=>AJ.alvo[r.o.k]!=null&&Math.abs(AJ.alvo[r.o.k]-r.agora)>1e-6);if(!ms.length){toast("Não há mudanças para gravar");return}
  if(!confirm(`Gravar no cronograma da ${T.t.cod}, a partir da semana de ${calDM(seg)}:\n\n${ms.map(r=>`· ${r.o.disc}: ${crNum(r.agora)} → ${crNum(AJ.alvo[r.o.k])} tempos por semana`).join("\n")}\n\nO Horários360 não muda.`))return;
  for(const r of ms)crManPor(a,T.t.id,r.o.k,r.o.disc,seg,AJ.alvo[r.o.k]);AJ.alvo={};save();CR_CACHE.k="";crAjRender();
  escLinhaMsg("#ajMsg",`✓ Gravado no cronograma da ${esc(T.t.cod)} a partir de ${esc(calDM(seg))} (${ms.length} disciplina${ms.length===1?"":"s"}). Falta mudar o horário da turma no Horários360: <a href="#" data-cres>abrir o Horários360</a>. Os números ficam em <a href="#" data-crir="crCron">Cronogramas › Tempos por semana</a>.`,"ok")};

