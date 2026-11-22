/* O meu horário / Horário da turma — o horário publicado, só leitura */
function mhEstado(){const a=anoAtivo(),x=a&&ESD.porAno&&ESD.porAno[a.id];if(!x||!x.estado)return null;try{const st=JSON.parse(x.estado);return st&&!st.example?st:null}catch(e){return null}}
const corTexto=hex=>{const m=String(hex||"").match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);if(!m)return"#fff";const [r,g,b]=m.slice(1).map(x=>parseInt(x,16)/255);return 0.2126*r+0.7152*g+0.0722*b>0.6?"#1d2433":"#fff"};
async function renderMh(){try{await esdPronto}catch(e){}const st=mhEstado(),out=$("#mhOut"),pf=perfilAtual(),tipoEl=$("#mhTipo"),quemEl=$("#mhQuem");
  $("#mhTit").textContent=pf==="form"?"Horário da turma":pf==="prof"?"O meu horário":"Horários publicados";
  if(!st){out.innerHTML=`<div class="msg info">${RO?"A Direção ainda não publicou o horário de "+esc(anoAtivo().nome)+".":"Ainda não há horário para "+esc(anoAtivo().nome)+" — faça-o no Horários360."}</div>`;quemEl.innerHTML="";return}
  tipoEl.parentNode.style.display=pf==="form"?"none":"";
  if(pf==="form")tipoEl.value="c";
  const T=st.teachers||[],C=(st.classes||[]).slice().sort((a,b)=>COLL_PTN.compare(String(a.name),String(b.name)));
  if(!quemEl.dataset.init){quemEl.dataset.init="1";
    if(pf==="prof"){const me=cfg.profs.find(p=>String(p.email||"").toLowerCase()===String(EU&&EU.email||""));const t=me&&T.find(t=>t.id===me.id||(ESD.mapaT||{})[t.id]===me.id);if(t){tipoEl.value="t";quemEl.dataset.v=t.id}}
    if(pf==="form"){const tc=(EU&&EU.turma)||lsJ("guide_mh_turma","");const c=C.find(c=>norm(c.name)===norm(tc));if(c)quemEl.dataset.v=c.id}}
  const tipo=tipoEl.value,L=tipo==="t"?T.slice().sort((a,b)=>COLL_PT.compare(String(a.name),String(b.name))).map(t=>[t.id,t.name+(t.short?" ("+t.short+")":"")]):C.map(c=>[c.id,c.name+(c.full&&c.full!==c.name?" — "+c.full:"")]);
  const v=L.some(x=>x[0]===quemEl.dataset.v)?quemEl.dataset.v:(L[0]||[""])[0];
  quemEl.innerHTML=L.map(([id,n])=>`<option value="${esc(id)}"${id===v?" selected":""}>${esc(n)}</option>`).join("");quemEl.dataset.v=v;
  if(!v){out.innerHTML=`<p class="hint">Sem ${tipo==="t"?"formadores":"turmas"} no horário.</p>`;return}
  // 0.9.67: com vários períodos do ano (por exemplo, os do Crono360), mostra-se o horário em vigor — e pode escolher-se o seguinte
  const VL=cpVersoes(st).slice().sort((p,q)=>String(p.de||"").localeCompare(String(q.de||""))),hj=calHoje(),perEl=$("#mhPer");
  const vHoje=cpVersaoEm(VL,hj)||VL.find(v=>v.de&&v.de>hj)||VL[VL.length-1],V=VL.find(v=>(v.id||"")===perEl.dataset.v)||vHoje;
  $("#mhPerL").style.display=VL.length>1?"":"none";
  perEl.innerHTML=VL.map(v=>`<option value="${esc(v.id||"")}"${v===V?" selected":""}>${v.de?"desde "+esc(calDM(v.de,{day:"numeric",month:"short",year:"2-digit"})):"desde o início"}${v===vHoje?" (em vigor)":v.de&&v.de>hj?" (a seguir)":""}</option>`).join("");
  const prox=VL.find(v=>v.de&&v.de>hj&&(!V.de||v.de>V.de));
  const les=new Map((V.lessons||[]).map(l=>[l.id,l])),TT=new Map(T.map(t=>[t.id,t])),CC=new Map(C.map(c=>[c.id,c])),SS=new Map((st.subjects||[]).map(x=>[x.id,x])),RR=new Map((st.rooms||[]).map(x=>[x.id,x]));
  const cel=new Map();let n=0;
  for(const cd of V.cards||[]){const l=les.get(cd.lessonId);if(!l)continue;const lin=(l.linhas||[]).map((x,i)=>Object.assign({i},x));
    const sel=tipo==="t"?lin.filter(x=>x.t===v):((l.classIds||[]).includes(v)?lin.filter(x=>!x.cls||x.cls.includes(v)):[]);if(!sel.length)continue;
    for(let k=0;k<(cd.len||1);k++){const key=cd.day+"|"+(cd.period+k),rr=(cd.rx&&cd.rx[k])||cd.r||[];
      for(const x of sel){const s=SS.get(x.s)||{},sala=RR.get(rr[x.i])||RR.get(x.r);n++;
        const sub=tipo==="t"?(l.classIds||[]).map(id=>(CC.get(id)||{}).name).filter(Boolean).join(", "):(TT.get(x.t)||{}).short||(TT.get(x.t)||{}).name||"";
        (cel.get(key)||cel.set(key,[]).get(key)).push(`<div class="a" style="background:${esc(s.color||"#2f5fb8")};color:${corTexto(s.color||"#2f5fb8")}" title="${esc(s.name||"")}"><b>${esc(s.short||s.name||"—")}</b><span>${esc([sub,sala&&sala.name].filter(Boolean).join(" · "))}</span></div>`)}}}
  const D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[];
  let h=`<div class="mzh" style="grid-template-columns:76px repeat(${D.length},minmax(104px,1fr))"><div class="h"></div>${D.map(d=>`<div class="h">${esc(d)}</div>`).join("")}`;
  P.forEach((p,pi)=>{h+=`<div class="p">${esc(p.label||pi+1)}<div class="hint" style="margin:0;font-weight:400">${esc(p.start||"")}${p.end?"–"+esc(p.end):""}</div></div>`;
    D.forEach((d,di)=>{const c=cel.get(di+"|"+pi);h+=`<div class="c">${c?c.join(""):""}</div>`})});
  out.innerHTML=(VL.length>1?`<div class="msg info" style="margin:0 0 10px">${V===vHoje?"Horário em vigor":"Horário"} ${V.de?"desde "+esc(calDMA(V.de)):""}${V.ate?" até "+esc(calDMA(V.ate)):""}.${prox&&V===vHoje?` Muda a <b>${esc(calDMA(prox.de))}</b> — escolha em «Horário» para o ver.`:""}</div>`:"")+h+`</div>`+(n?"":`<p class="hint">Sem aulas marcadas.</p>`)+`<p class="hint">${esc(st.name||"")} · ${esc(st.ano||anoAtivo().nome)}${PUB&&PUB.t?" · publicado a "+new Date(PUB.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):""}</p>`}
$("#mhPer").onchange=e=>{$("#mhPer").dataset.v=e.target.value;renderMh()};
$("#mhTipo").onchange=()=>{$("#mhQuem").dataset.v="";renderMh()};
$("#mhQuem").onchange=e=>{$("#mhQuem").dataset.v=e.target.value;if(perfilAtual()==="form")try{localStorage.setItem("guide_mh_turma",JSON.stringify(e.target.selectedOptions[0].textContent.split(" — ")[0]))}catch(x){}renderMh()};

/* Utilizadores e perfis (administradores) */
let UTI_SUJO=false;
// 0.9.157: contas automáticas — cada formador e cada formando da Escola360 tem perfil sem ser preciso pô-lo na lista
function profEmail(p){return p?(String(p.email||"").trim().toLowerCase()||(typeof emailAuto==="function"?emailAuto(p.nome):"")):""}
// formandos com conta: sem «desistente»/«transferido», numa turma do ano ativo ou de um ano que ainda vem (as turmas que já acabaram não contam)
function forTurmaViva(t){const a=anoAtivo();if(!t)return false;if(!a||!a.ini)return true;return t.anoFim?t.anoFim>a.ini:(t.anoIni?t.anoIni>=a.ini:true)}
function forContas(){const E=escData(),TM=new Map((E.turmas||[]).map(t=>[t.id,t])),out=[],vis=new Set();
  for(const f of E.formandos||[]){if(f.estado)continue;const t=TM.get(f.turmaId);if(!forTurmaViva(t))continue;const em=formandoEmail(f);if(!em||!em.includes("@")||vis.has(em))continue;vis.add(em);out.push({email:em,nome:f.nome||"",turma:t.cod||"",fid:f.id})}
  return out}
// mapa email → {perfil, nome, turma, org:"formador"|"formando"}; o formador ganha se o email for igual (como no servidor)
function utiAuto(){const M=new Map(),rep=new Set();
  for(const p of cfg.profs||[]){const e=profEmail(p);if(!e||!e.includes("@"))continue;if(M.has(e)){rep.add(e);continue}M.set(e,{perfil:"prof",nome:p.nome||"",turma:"",org:"formador"})}
  for(const c of forContas()){if(M.has(c.email)){rep.add(c.email);continue}M.set(c.email,{perfil:"form",nome:c.nome,turma:c.turma,org:"formando"})}
  return {M,rep}}
var UTI_ORG="";
function utiPerfilDe(t){t=norm(t);return /econom/.test(t)?"econ":/exec/.test(t)?"dexec":/pedag/.test(t)?"dped":/prof|formador|docente/.test(t)?"prof":/forman|alun|estud/.test(t)?"form":""}
function utiSujo(){UTI_SUJO=true;utiEst(`<span style="color:var(--warn)">Alterações por guardar.</span>`)}
/* 0.9.176: Utilizadores e Perfis em separadores diferentes — a mensagem, o estado e o botão «Guardar perfis» aparecem nos dois */
function utiEst(h){for(const id of["utiEstado","utiEstado2"]){const e=document.getElementById(id);if(e)e.innerHTML=h}}
async function renderUti(force){const m={set innerHTML(h){for(const id of["utiMsg","utiMsg2"]){const e=document.getElementById(id);if(e)e.innerHTML=h}}};
  if(!EU||!EU.admin){m.innerHTML=`<div class="msg bad">Só os administradores da EPISJ 360 gerem os perfis.</div>`;return}
  if(EU.provisorio){m.innerHTML=`<div class="msg info">Para gerir os perfis, atualize primeiro o serviço de avisos na Cloudflare com o ficheiro <code>servidor/boxcheck-avisos.js</code> da EPISJ 360 0.9 (ver LEIA-ME).</div>`;return}
  if(!UTI||force){m.innerHTML=`<p class="hint"><span class="spin"></span> A carregar…</p>`;try{UTI=await guideApi("/guide/perfis");UTI_SUJO=false}catch(e){m.innerHTML=`<div class="msg bad">${esc(e.message)}</div>`;return}}
  m.innerHTML="";const L=UTI.loja;
  $("#utiAdmins").value=L.admins.join("\n");
  $("#utiAdmInfo").innerHTML=UTI.adminsServico.length?`Também administradores (definidos no serviço, em GUIDE_ADMINS): <b>${UTI.adminsServico.map(esc).join(", ")}</b>.`:L.admins.length?"":`Sem administradores na lista, é administrador quem ligou a Box ao serviço de avisos${UTI.adminAuto?` (<b>${esc(UTI.adminAuto)}</b>)`:""}. Ao guardar, a sua conta fica na lista.`;
  $("#utiPerfil").innerHTML=Object.entries(UTI.perfis).map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join("");
  const turmas=turmasDoAno().map(t=>t.cod);$("#utiTurma").innerHTML=`<option value="">—</option>`+turmas.map(c=>`<option>${esc(c)}</option>`).join("");
  $("#utiDom").value=L.formandos.dominios.join(", ");$("#utiPad").value=L.formandos.padrao||"";
  utiTabela();utiVis();utiMods();
  $("#utiPrev").innerHTML=`<option value="">— escolha —</option>`+Object.entries(UTI.perfis).map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join("");
  utiEst(UTI_SUJO?`<span style="color:var(--warn)">Alterações por guardar.</span>`:L.t?`Guardado a ${new Date(L.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}${L.por?" por "+esc(L.por):""}.`:"")}
// 0.9.50: com 1300 contas — 200 linhas de cada vez, a lista de turmas só se enche quando se toca nela, e mudar uma linha só redesenha essa linha
var UTI_N=200;
// 0.9.110: sem a lista carregada do servidor (sem rede ou ainda a carregar), os botões avisam em vez de dar erro
function utiOk(cala){if(UTI&&UTI.loja)return true;if(!cala)toast("A lista de utilizadores ainda não foi carregada — verifique a ligação à internet e volte a abrir este separador.");return false}
function utiLinha(e,u,au,rep){const man=!!UTI.loja.utilizadores[e],pf=u.perfil;
  const PO=Object.entries(UTI.perfis).map(([k,n])=>`<option value="${k}"${k===pf?" selected":""}>${esc(n)}</option>`).join("");
  const orgT=au?(au.org==="formador"?"Escola360 › Formadores":"Escola360 › Formandos"):"";
  const org=man?(au?`<span class="tag exc" title="Na Escola360 seria ${esc(UTI.perfis[au.perfil]||"")}${au.turma?" ("+esc(au.turma)+")":""}">mudado à mão</span>`:`<span class="tag">atribuído à mão</span>`):`<span class="hint" style="margin:0">automático · ${esc(orgT)}</span>`;
  const turma=pf!=="form"?"":man?`<select data-ue="${esc(e)}" data-k="turma"><option value="" data-lzk="tcod" data-lzf="${utiLzF()}">—</option>${u.turma?`<option selected>${esc(u.turma)}</option>`:""}</select>`:esc(u.turma||"—");
  const acc=man?(au?`<button class="b s" data-udel="${esc(e)}" title="Voltar ao perfil automático da Escola360">Automático</button>`:`<button class="b s" data-udel="${esc(e)}" title="Tirar da lista">✕</button>`):"";
  return `<tr data-ur="${esc(e)}"><td>${esc(e)}${rep&&rep.has(e)?` <span class="tag exc" title="Este email aparece mais do que uma vez em Formadores/Formandos — confirme na Escola360">repetido</span>`:""}</td><td>${esc(u.nome||(au&&au.nome)||"")}</td><td><select data-ue="${esc(e)}" data-k="perfil">${PO}</select></td>
    <td>${turma}</td><td>${org}</td><td>${acc}</td></tr>`}
function utiLzF(){const f=`<option value="">—</option>`;let i=LZ.first.indexOf(f);if(i<0){LZ.first.push(f);i=LZ.first.length-1}return i}
function utiTabela(){if(!utiOk(1))return;const L=UTI.loja,f=norm($("#utiFiltro").value),{M,rep}=utiAuto();UTI_AUTO={M,rep};
  const todos=new Map(M);for(const [e,u] of Object.entries(L.utilizadores))todos.set(e,u);
  document.querySelectorAll("#utiOrg [data-uo]").forEach(b=>b.classList.toggle("on",b.dataset.uo===UTI_ORG));
  const rows=[...todos].filter(([e,u])=>{const au=M.get(e),man=!!L.utilizadores[e];
      if(UTI_ORG==="mao"&&!man)return false;if(UTI_ORG==="prof"&&!(au&&au.org==="formador"))return false;if(UTI_ORG==="form"&&!(au&&au.org==="formando"))return false;if(UTI_ORG==="rep"&&!rep.has(e))return false;
      return !f||norm(e+" "+(u.nome||(au&&au.nome)||"")+" "+UTI.perfis[u.perfil]+" "+(u.turma||"")).includes(f)})
    .sort((a,b)=>(!!L.utilizadores[b[0]]-!!L.utilizadores[a[0]])||a[0].localeCompare(b[0]));
  UTI_N=UTI_N||200;const mais=rows.length-UTI_N;
  $("#tbUti").innerHTML=rows.slice(0,UTI_N).map(([e,u])=>utiLinha(e,u,M.get(e),rep)).join("")+(mais>0?`<tr><td colspan="6" style="text-align:center"><button class="b s" id="utiMais" type="button">Mostrar mais ${Math.min(mais,500)} (faltam ${mais})</button></td></tr>`:"")
    ||`<tr><td colspan="6" class="hint">${f||UTI_ORG?"Ninguém com este filtro.":"Ainda não há formadores nem formandos na Escola360."}</td></tr>`;
  const b=$("#utiMais");if(b)b.onclick=()=>{UTI_N+=500;utiTabela()};utiResumo()}
var UTI_AUTO=null;
function utiResumo(){const el=$("#utiProfs");if(!el||!UTI_AUTO)return;const {M,rep}=UTI_AUTO,L=UTI.loja,E=escData(),TM=new Map((E.turmas||[]).map(t=>[t.id,t]));
  let np=0,nf=0,mud=0;for(const [e,a] of M){if(L.utilizadores[e]){mud++;continue}if(a.org==="formador")np++;else nf++}
  const fora=(E.formandos||[]).filter(f=>!f.estado&&!forTurmaViva(TM.get(f.turmaId))).length,saidos=(E.formandos||[]).filter(f=>f.estado).length,man=Object.keys(L.utilizadores).filter(e=>!M.has(e)).length;
  el.innerHTML=`Com perfil automático, vindos da Escola360: <b>${np}</b> formador(es) e <b>${nf}</b> formando(s) (com a turma)${mud?` · <b>${mud}</b> com o perfil mudado à mão`:""}${man?` · <b>${man}</b> conta(s) só desta lista`:""}.`+
    (rep.size?` <span style="color:var(--warn)">${rep.size} email(s) repetido(s) — fica o primeiro (formador antes de formando); corrija em Escola360.</span>`:"")+
    (fora||saidos?`<br>Sem conta: ${saidos?`${saidos} desistente(s)/transferido(s)`:""}${saidos&&fora?" e ":""}${fora?`${fora} formando(s) sem turma deste ano letivo (turmas já concluídas ou sem turma)`:""}.`:"")+
    `<br>A lista chega ao servidor quando a Direção publica (é automático a cada alteração).`}
$("#utiOrg").addEventListener("click",e=>{const b=e.target.closest("[data-uo]");if(!b)return;UTI_ORG=b.dataset.uo;UTI_N=200;utiTabela()});
function utiMods(){if(!utiOk(1))return;const off=new Set(UTI.loja.modsOff||[]);
  $("#utiMods").innerHTML=MODULOS.map(M=>`<label class="${off.has(M.id)?"off":""}"><input type="checkbox" data-mod="${M.id}"${off.has(M.id)?"":" checked"}><span><b>${esc(M.nome)}</b><br><span class="hint" style="margin:0">${off.has(M.id)?"Desligado — só os administradores":"Ligado para os perfis com acesso"}</span></span></label>`).join("");
  $("#utiModsAviso").innerHTML=("modsOff" in UTI.loja)?"":`<span style="color:var(--warn)">Para isto funcionar para toda a gente, atualize o serviço na Cloudflare com o ficheiro <code>servidor/boxcheck-avisos.js</code> da EPISJ 360 0.9.19.</span>`}
$("#utiMods").addEventListener("change",e=>{const x=e.target.closest("[data-mod]");if(!x||!utiOk())return;const off=new Set(UTI.loja.modsOff||[]);if(x.checked)off.delete(x.dataset.mod);else off.add(x.dataset.mod);
  UTI.loja.modsOff=MODULOS.map(M=>M.id).filter(m=>off.has(m));utiMods();utiSujo()});
function utiVis(){if(!utiOk(1))return;const L=UTI.loja,P=Object.keys(UTI.perfis);let h=`<thead><tr><th>Separador</th>${P.map(k=>`<th>${esc(UTI.perfis[k])}</th>`).join("")}</tr></thead><tbody>`;
  document.querySelectorAll("#nav .mgrp").forEach(g=>{const bs=[...g.querySelectorAll("button[data-t]")].filter(b=>b.dataset.t!=="uti"&&b.dataset.t!=="per");if(!bs.length)return;
    h+=`<tr class="grp"><td colspan="${P.length+1}">${esc(g.querySelector(".mh").childNodes[0].textContent.trim())}</td></tr>`;
    for(const b of bs){const t=b.dataset.t;h+=`<tr><td>${esc(b.textContent.trim())}</td>${P.map(k=>`<td><input type="checkbox" data-vp="${k}" data-vt="${t}"${utiVisEf(k,t)?" checked":""}></td>`).join("")}</tr>`}});
  $("#utiVis").innerHTML=h+"</tbody>"}
{let h=null;$("#utiFiltro").oninput=()=>{clearTimeout(h);h=setTimeout(()=>{UTI_N=200;utiTabela()},120)}}
$("#utiForm").onsubmit=e=>{e.preventDefault();if(!utiOk())return;const em=$("#utiEmail").value.trim().toLowerCase();if(!/@/.test(em)){toast("Email inválido");return}
  const pf=$("#utiPerfil").value;UTI.loja.utilizadores[em]={perfil:pf,turma:pf==="form"?$("#utiTurma").value:"",nome:""};$("#utiEmail").value="";utiTabela();utiSujo()};
$("#tbUti").addEventListener("change",e=>{const x=e.target.closest("[data-ue]");if(!x||!utiOk())return;const em=x.dataset.ue,A=UTI_AUTO||utiAuto(),au=A.M.get(em);let u=UTI.loja.utilizadores[em];
  if(!u){if(!au)return;if(x.dataset.k==="perfil"&&x.value===au.perfil)return;u=UTI.loja.utilizadores[em]={perfil:au.perfil,turma:au.turma||"",nome:au.nome||""}} // 0.9.157: mudar uma conta automática cria a exceção
  u[x.dataset.k]=x.value;
  if(x.dataset.k==="perfil"){if(x.value!=="form")u.turma="";else if(!u.turma&&au&&au.turma)u.turma=au.turma}
  const tr=x.closest("tr");if(tr)tr.outerHTML=utiLinha(em,u,au,A.rep);utiResumo();utiSujo()});
$("#tbUti").addEventListener("click",e=>{const b=e.target.closest("[data-udel]");if(!b||!utiOk())return;const em=b.dataset.udel;delete UTI.loja.utilizadores[em];const A=UTI_AUTO||utiAuto(),au=A.M.get(em),tr=b.closest("tr");
  if(tr){if(au)tr.outerHTML=utiLinha(em,{perfil:au.perfil,turma:au.turma,nome:au.nome},au,A.rep);else tr.remove()}utiResumo();utiSujo()});
$("#utiBulkGo").onclick=()=>{if(!utiOk())return;let n=0,mal=0;for(const l of $("#utiBulk").value.split(/\n/)){const c=l.split(/[;\t,]/).map(x=>x.trim());if(!c[0])continue;const em=c[0].toLowerCase(),pf=utiPerfilDe(c[1]||"");
    if(!/@/.test(em)||!pf){mal++;continue}UTI.loja.utilizadores[em]={perfil:pf,turma:pf==="form"?(c[2]||"").toUpperCase():"",nome:""};n++}
  utiTabela();if(n){utiSujo();$("#utiBulk").value=""}toast(`${n} conta(s) juntada(s)${mal?` · ${mal} linha(s) não percebida(s)`:""}`)};
/* 0.9.182: a tabela mostra o que cada perfil vê de facto (também os separadores novos, que seguem uma regra por omissão);
   desmarcar grava «!separador», que esconde mesmo os separadores dessa regra */
function utiVisEf(k,t){const L=UTI.loja,l=L.vis[k]||UTI.visOmissao[k]||[];if(l.includes(t))return true;if(l.includes("!"+t))return false;
  try{const r=tabNovo(t,new Set(l),k);return r===true}catch(e){return false}}
$("#utiVis").addEventListener("change",e=>{const x=e.target.closest("[data-vp]");if(!x||!utiOk())return;const L=UTI.loja,k=x.dataset.vp,t=x.dataset.vt;const v=new Set(L.vis[k]||UTI.visOmissao[k]);
  if(x.checked){v.add(t);v.delete("!"+t)}else{v.delete(t);v.add("!"+t)}L.vis[k]=[...v];utiSujo()});
$("#utiVisRepor").onclick=()=>{if(!utiOk())return;UTI.loja.vis={};utiVis();utiSujo()};
["#utiAdmins","#utiDom","#utiPad"].forEach(x=>$(x).addEventListener("input",utiSujo));
$("#utiPrev").onchange=e=>{const v=e.target.value;if(!v)return;if(!utiOk()){e.target.value="";return}utiLerCampos();PREV=v;aplicarPerfil();toast("A pré-visualizar como "+PERFIL_CURTO[v]);e.target.value=""};
function utiLerCampos(){if(!utiOk(1))return;const L=UTI.loja;L.admins=$("#utiAdmins").value.split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(x=>x.includes("@"));
  L.formandos={dominios:$("#utiDom").value.split(/[\s,;]+/).map(x=>x.trim().toLowerCase().replace(/^@/,"")).filter(Boolean),padrao:$("#utiPad").value.trim()}}
{const g2=document.getElementById("utiGuardar2");if(g2)g2.onclick=()=>$("#utiGuardar").click()}
/* 0.9.179: botão «Aplicar» ao lado dos administradores — grava logo; quem perde (ou ganha) o acesso de administrador sai da app
   para o acesso novo se aplicar (a própria conta sai já; as outras saem na verificação seguinte, até 1 minuto) */
$("#utiAdmAplicar").onclick=async()=>{if(!utiOk())return;const antes=new Set(UTI.loja.admins||[]);utiLerCampos();const depois=new Set(UTI.loja.admins||[]);
  const sai=[...antes].filter(x=>!depois.has(x)),entra=[...depois].filter(x=>!antes.has(x));
  if(!sai.length&&!entra.length){toast("A lista de administradores não mudou");return}
  const eu=String(EU&&EU.email||"").toLowerCase(),euSai=sai.includes(eu);
  if(!confirm(`Aplicar a lista de administradores?${entra.length?"\n\nPassam a administradores: "+entra.join(", "):""}${sai.length?"\n\nDeixam de ser administradores: "+sai.join(", "):""}\n\nQuem muda sai da EPISJ 360 e volta a entrar já com o acesso novo.${euSai?"\n\nA sua conta está entre as que deixam de ser administradoras: vai sair agora.":""}`))return;
  await utiGravar();if(UTI_SUJO)return; // a gravação falhou
  const ok=(UTI.loja.admins||[]).map(x=>String(x).toLowerCase());
  if(euSai&&ok.includes(eu)){toast("O servidor manteve a sua conta como administradora (para não ficar a escola sem administradores)");return}
  if(euSai){toast("Lista aplicada — a sair para aplicar o acesso novo…");setTimeout(()=>guideSair(),1200)}else toast("Lista de administradores aplicada")};
$("#utiGuardar").onclick=()=>utiGravar();
async function utiGravar(){if(!UTI)return;utiLerCampos();const pad=UTI.loja.formandos.padrao;if(pad){try{new RegExp(pad)}catch(e){UTI_SUJO=true;toast("O padrão dos formandos não é uma expressão regular válida");return}}
  utiEst("A guardar…");try{const j=await guideApi("/guide/perfis",{method:"POST",body:JSON.stringify(UTI.loja)});UTI.loja=j.loja;UTI_SUJO=false;MODS_OFF=Array.isArray(j.loja.modsOff)?j.loja.modsOff:[];aplicarPerfil();renderUti();toast("modsOff" in j.loja?"Perfis e módulos guardados":"Perfis guardados — falta atualizar o serviço na Cloudflare para desligar módulos")}
  catch(e){UTI_SUJO=true;utiEst(`<span style="color:var(--bad)">${esc(e.message)}</span>`)}}

