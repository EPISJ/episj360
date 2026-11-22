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
function utiPerfilDe(t){t=norm(t);return /econom/.test(t)?"econ":/exec/.test(t)?"dexec":/pedag/.test(t)?"dped":/prof|formador|docente/.test(t)?"prof":/forman|alun|estud/.test(t)?"form":""}
function utiSujo(){UTI_SUJO=true;$("#utiEstado").innerHTML=`<span style="color:var(--warn)">Alterações por guardar.</span>`}
async function renderUti(force){const m=$("#utiMsg");
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
  const sem=cfg.profs.filter(p=>!p.email).length;
  $("#utiProfs").innerHTML=`Ficam <b>Formador</b> automaticamente os ${cfg.profs.filter(p=>p.email).length} formadores com email em <b>Escola › Formadores</b>${sem?` — <span style="color:var(--warn)">${sem} sem email não conseguem entrar</span>`:""}.`;
  $("#utiPrev").innerHTML=`<option value="">— escolha —</option>`+Object.entries(UTI.perfis).map(([k,n])=>`<option value="${k}">${esc(n)}</option>`).join("");
  $("#utiEstado").innerHTML=UTI_SUJO?`<span style="color:var(--warn)">Alterações por guardar.</span>`:L.t?`Guardado a ${new Date(L.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}${L.por?" por "+esc(L.por):""}.`:""}
// 0.9.50: com 1300 contas — 200 linhas de cada vez, a lista de turmas só se enche quando se toca nela, e mudar uma linha só redesenha essa linha
var UTI_N=200;
// 0.9.110: sem a lista carregada do servidor (sem rede ou ainda a carregar), os botões avisam em vez de dar erro
function utiOk(cala){if(UTI&&UTI.loja)return true;if(!cala)toast("A lista de utilizadores ainda não foi carregada — verifique a ligação à internet e volte a abrir este separador.");return false}
function utiLinha(e,u){const PO=Object.entries(UTI.perfis).map(([k,n])=>`<option value="${k}"${k===u.perfil?" selected":""}>${esc(n)}</option>`).join("");
  return `<tr data-ur="${esc(e)}"><td>${esc(e)}</td><td><select data-ue="${esc(e)}" data-k="perfil">${PO}</select></td>
    <td>${u.perfil==="form"?`<select data-ue="${esc(e)}" data-k="turma"><option value="" data-lzk="tcod" data-lzf="${utiLzF()}">—</option>${u.turma?`<option selected>${esc(u.turma)}</option>`:""}</select>`:""}</td>
    <td><button class="b s" data-udel="${esc(e)}" title="Tirar da lista">✕</button></td></tr>`}
function utiLzF(){const f=`<option value="">—</option>`;let i=LZ.first.indexOf(f);if(i<0){LZ.first.push(f);i=LZ.first.length-1}return i}
function utiTabela(){if(!utiOk(1))return;const L=UTI.loja,f=norm($("#utiFiltro").value);
  const rows=Object.entries(L.utilizadores).filter(([e,u])=>!f||norm(e+" "+UTI.perfis[u.perfil]+" "+(u.turma||"")).includes(f)).sort((a,b)=>a[0].localeCompare(b[0]));
  UTI_N=UTI_N||200;const mais=rows.length-UTI_N;
  $("#tbUti").innerHTML=rows.slice(0,UTI_N).map(([e,u])=>utiLinha(e,u)).join("")+(mais>0?`<tr><td colspan="4" style="text-align:center"><button class="b s" id="utiMais" type="button">Mostrar mais ${Math.min(mais,500)} (faltam ${mais})</button></td></tr>`:"")
    ||`<tr><td colspan="4" class="hint">${f?"Ninguém com este filtro.":"Ninguém na lista — valem as regras automáticas."}</td></tr>`;
  const b=$("#utiMais");if(b)b.onclick=()=>{UTI_N+=500;utiTabela()}}
function utiMods(){if(!utiOk(1))return;const off=new Set(UTI.loja.modsOff||[]);
  $("#utiMods").innerHTML=MODULOS.map(M=>`<label class="${off.has(M.id)?"off":""}"><input type="checkbox" data-mod="${M.id}"${off.has(M.id)?"":" checked"}><span><b>${esc(M.nome)}</b><br><span class="hint" style="margin:0">${off.has(M.id)?"Desligado — só os administradores":"Ligado para os perfis com acesso"}</span></span></label>`).join("");
  $("#utiModsAviso").innerHTML=("modsOff" in UTI.loja)?"":`<span style="color:var(--warn)">Para isto funcionar para toda a gente, atualize o serviço na Cloudflare com o ficheiro <code>servidor/boxcheck-avisos.js</code> da EPISJ 360 0.9.19.</span>`}
$("#utiMods").addEventListener("change",e=>{const x=e.target.closest("[data-mod]");if(!x||!utiOk())return;const off=new Set(UTI.loja.modsOff||[]);if(x.checked)off.delete(x.dataset.mod);else off.add(x.dataset.mod);
  UTI.loja.modsOff=MODULOS.map(M=>M.id).filter(m=>off.has(m));utiMods();utiSujo()});
function utiVis(){if(!utiOk(1))return;const L=UTI.loja,P=Object.keys(UTI.perfis);let h=`<thead><tr><th>Separador</th>${P.map(k=>`<th>${esc(UTI.perfis[k])}</th>`).join("")}</tr></thead><tbody>`;
  document.querySelectorAll("#nav .mgrp").forEach(g=>{const bs=[...g.querySelectorAll("button[data-t]")].filter(b=>b.dataset.t!=="uti");if(!bs.length)return;
    h+=`<tr class="grp"><td colspan="${P.length+1}">${esc(g.querySelector(".mh").childNodes[0].textContent.trim())}</td></tr>`;
    for(const b of bs){const t=b.dataset.t;h+=`<tr><td>${esc(b.textContent.trim())}</td>${P.map(k=>`<td><input type="checkbox" data-vp="${k}" data-vt="${t}"${(L.vis[k]||UTI.visOmissao[k]).includes(t)?" checked":""}></td>`).join("")}</tr>`}});
  $("#utiVis").innerHTML=h+"</tbody>"}
{let h=null;$("#utiFiltro").oninput=()=>{clearTimeout(h);h=setTimeout(()=>{UTI_N=200;utiTabela()},120)}}
$("#utiForm").onsubmit=e=>{e.preventDefault();if(!utiOk())return;const em=$("#utiEmail").value.trim().toLowerCase();if(!/@/.test(em)){toast("Email inválido");return}
  const pf=$("#utiPerfil").value;UTI.loja.utilizadores[em]={perfil:pf,turma:pf==="form"?$("#utiTurma").value:"",nome:""};$("#utiEmail").value="";utiTabela();utiSujo()};
$("#tbUti").addEventListener("change",e=>{const x=e.target.closest("[data-ue]");if(!x||!utiOk())return;const em=x.dataset.ue,u=UTI.loja.utilizadores[em];if(!u)return;u[x.dataset.k]=x.value;
  if(x.dataset.k==="perfil"){if(x.value!=="form")u.turma="";const tr=x.closest("tr");if(tr)tr.outerHTML=utiLinha(em,u)}utiSujo()});
$("#tbUti").addEventListener("click",e=>{const b=e.target.closest("[data-udel]");if(!b||!utiOk())return;delete UTI.loja.utilizadores[b.dataset.udel];const tr=b.closest("tr");if(tr)tr.remove();utiSujo()});
$("#utiBulkGo").onclick=()=>{if(!utiOk())return;let n=0,mal=0;for(const l of $("#utiBulk").value.split(/\n/)){const c=l.split(/[;\t,]/).map(x=>x.trim());if(!c[0])continue;const em=c[0].toLowerCase(),pf=utiPerfilDe(c[1]||"");
    if(!/@/.test(em)||!pf){mal++;continue}UTI.loja.utilizadores[em]={perfil:pf,turma:pf==="form"?(c[2]||"").toUpperCase():"",nome:""};n++}
  utiTabela();if(n){utiSujo();$("#utiBulk").value=""}toast(`${n} conta(s) juntada(s)${mal?` · ${mal} linha(s) não percebida(s)`:""}`)};
$("#utiVis").addEventListener("change",e=>{const x=e.target.closest("[data-vp]");if(!x||!utiOk())return;const L=UTI.loja,k=x.dataset.vp;const v=new Set(L.vis[k]||UTI.visOmissao[k]);if(x.checked)v.add(x.dataset.vt);else v.delete(x.dataset.vt);L.vis[k]=[...v];utiSujo()});
$("#utiVisRepor").onclick=()=>{if(!utiOk())return;UTI.loja.vis={};utiVis();utiSujo()};
["#utiAdmins","#utiDom","#utiPad"].forEach(x=>$(x).addEventListener("input",utiSujo));
$("#utiPrev").onchange=e=>{const v=e.target.value;if(!v)return;if(!utiOk()){e.target.value="";return}utiLerCampos();PREV=v;aplicarPerfil();toast("A pré-visualizar como "+PERFIL_CURTO[v]);e.target.value=""};
function utiLerCampos(){if(!utiOk(1))return;const L=UTI.loja;L.admins=$("#utiAdmins").value.split(/[\s,;]+/).map(x=>x.trim().toLowerCase()).filter(x=>x.includes("@"));
  L.formandos={dominios:$("#utiDom").value.split(/[\s,;]+/).map(x=>x.trim().toLowerCase().replace(/^@/,"")).filter(Boolean),padrao:$("#utiPad").value.trim()}}
$("#utiGuardar").onclick=async()=>{if(!UTI)return;utiLerCampos();const pad=UTI.loja.formandos.padrao;if(pad){try{new RegExp(pad)}catch(e){toast("O padrão dos formandos não é uma expressão regular válida");return}}
  $("#utiEstado").textContent="A guardar…";try{const j=await guideApi("/guide/perfis",{method:"POST",body:JSON.stringify(UTI.loja)});UTI.loja=j.loja;UTI_SUJO=false;MODS_OFF=Array.isArray(j.loja.modsOff)?j.loja.modsOff:[];aplicarPerfil();renderUti();toast("modsOff" in j.loja?"Perfis e módulos guardados":"Perfis guardados — falta atualizar o serviço na Cloudflare para desligar módulos")}
  catch(e){$("#utiEstado").innerHTML=`<span style="color:var(--bad)">${esc(e.message)}</span>`}};

