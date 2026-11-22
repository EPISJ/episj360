/* ===================== EPISJ 360 0.9 — entrada com o Office 365 e perfis de utilizador ===================== */
// Todos entram com a conta do Office 365 da escola. O serviço da EPISJ 360 (o mesmo dos avisos, na Cloudflare) confirma a conta
// junto da Microsoft e devolve o perfil — Direção Executiva, Direção Pedagógica, Formador ou Formando — e os separadores que pode abrir.
// A Box deixa de ser a porta de entrada: liga-se só dentro do módulo BoxCheck.
const PERFIL_CURTO={dexec:"Direção Executiva",dped:"Direção Pedagógica",prof:"Formador",form:"Formando",econ:"Economato"};
const perfilAtual=()=>PREV||(EU&&EU.perfil)||"";
const soLeitura=()=>!!EU&&!EU.admin&&(EU.perfil==="prof"||EU.perfil==="form");
const podePublicar=()=>!!EU&&!EU.provisorio&&(EU.admin||EU.perfil==="dexec"||EU.perfil==="dped");
async function guideTok(force){const p=await msInit();if(!MSACC&&sbAtivo()&&EU)await msSilencioso(EU.email);if(!MSACC)throw new Error("Sem sessão Microsoft — volte a entrar.");
  try{return (await p.acquireTokenSilent({scopes:LOGIN_SCOPES,account:MSACC,forceRefresh:!!force})).accessToken}
  catch(e){return (await p.acquireTokenPopup({scopes:LOGIN_SCOPES,account:MSACC,redirectUri:MS_REDIR})).accessToken}}
async function guideApi(path,opts,again){opts=opts||{};
  if(sbAtivo()){const m=(opts.method||"GET").toUpperCase(),b=opts.body?JSON.parse(opts.body):null;
    if(path==="/guide/eu")return sbRpc("g360_eu");
    if(path==="/guide/perfis")return m==="GET"?sbRpc("g360_perfis_ler"):sbRpc("g360_perfis_gravar",{p_loja:b});
    if(path==="/guide/publico")return m==="GET"?sbRpc("g360_publico_ler"):sbRpc("g360_publico_gravar",{p:b})}
  const tok=await guideTok(again);let r;
  try{r=await fetch(srvUrl()+path,{method:opts.method||"GET",body:opts.body,cache:"no-store",headers:Object.assign({Authorization:"Bearer "+tok},opts.body?{"Content-Type":"application/json"}:{})})}
  catch(e){throw new Error("Não foi possível contactar o serviço da EPISJ 360.")}
  if(r.status===401&&!again)return guideApi(path,opts,true);
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.erro||("o serviço respondeu "+r.status));return j}

async function guideArranque(){
  gateState("wait","");prog(4,"A ligar ao serviço da EPISJ 360…");
  if(sbCfg()){prog(10,"A confirmar a sessão…");try{await gpAte(SB_PRONTO,12000)}catch(e){}
    if(SBSES)return guideEntrarSB();
    $("#msSetup").style.display="none";$("#msGo").disabled=false;gateState("login",SBERR?esc(SBERR):"");return}
  try{const r=await fetch(srvUrl()+"/guide/config",{cache:"no-store"});if(r.ok){const j=await r.json();if(j.clientId&&j.tenant){GMS={clientId:j.clientId,tenant:j.tenant};try{localStorage.setItem("guide_ms",JSON.stringify(GMS))}catch(e){}}}}catch(e){}
  const {id,ten}=msIds();
  if(!id||!ten){$("#msSetup").style.display="";$("#msSetup").open=true;$("#msGo").disabled=true;gateState("login","");return}
  $("#msSetup").style.display="none";$("#msGo").disabled=false;prog(14,"A ligar ao Office 365…");
  try{const p=await msInit();prog(22,"A confirmar a sessão…");
    if(MSACC){try{const t=(await p.acquireTokenSilent({scopes:LOGIN_SCOPES,account:MSACC})).accessToken;return guideEntrar(t)}catch(e){}}}
  catch(e){gateState("login",msErro(e));return}
  gateState("login","")}
$("#msGo").onclick=async()=>{if(sbCfg()){gateState("wait","");prog(18,"A abrir o login do Office 365…");try{await sbEntrar()}catch(e){gateState("login",esc(e.message||String(e)))}return}
  try{const p=await msInit();gateState("wait","");prog(22,"À espera do Office 365…");
    const r=await p.loginPopup({scopes:LOGIN_SCOPES,prompt:"select_account",redirectUri:MS_REDIR});MSACC=r.account;p.setActiveAccount(r.account);await guideEntrar(r.accessToken)}
  catch(e){gateState("login",msErro(e))}};
$("#gMsSave").onclick=()=>{const id=$("#gMsClient").value.trim(),ten=$("#gMsTenant").value.trim();if(!id||!ten){toast("Preencha os dois campos");return}
  GMS={clientId:id,tenant:ten};try{localStorage.setItem("guide_ms",JSON.stringify(GMS))}catch(e){}MSAL=null;guideArranque()};

async function guideEntrarSB(){
  gateState("wait","");prog(30,"A confirmar o perfil…");
  let j=SBEU;if(!j||!j.perfil){try{j=await sbRpc("g360_eu");SBEU=j}catch(e){gateState("login",esc(e.message||String(e)));return}}
  if(!j||!j.perfil){const em=SBSES&&SBSES.user&&SBSES.user.email||"";gateState("login",`A conta <b>${esc(em)}</b> ainda não tem perfil na EPISJ 360. Peça à Direção que lho atribua. <a href="#" id="gSairSB">Entrar com outra conta</a>`);
    const a=$("#gSairSB");if(a)a.onclick=e=>{e.preventDefault();sbSair().then(()=>location.reload())};return}
  SBMEMBRO=j;EU=j;MODS_OFF=Array.isArray(j.modsOff)?j.modsOff:[];window.__guideLogin=EU.email;
  msSilencioso(EU.email); // o Office 365 (email e OneDrive) liga-se em segundo plano, sem pedir nada
  prog(40,"Perfil: "+(EU.admin?"Administrador":(EU.perfilNome||PERFIL_CURTO[EU.perfil]||"")));
  whoUI();aplicarPerfil();
  if(EU.admin)perfisMigrar();
  await guideCarregarModulos();
  try{await lgMigrar();aplicarLogos()}catch(e){}
  if(curTab&&curTab.startsWith("rc"))try{rcRender(curTab)}catch(e){}
  prog(100,"Pronto!");await gpEspera(GP.v<99?650:350);
  gateState("off");try{sbUI();window.__subEst&&window.__subEst()}catch(e){}
  try{sbTempoReal()}catch(e){}
  try{if(curTab==="esc")renderEscPainel()}catch(e){}Promise.resolve(prefsTrazer()).catch(()=>{}).finally(()=>setTimeout(novVer,700)); // 0.9.50: widgets desenhados com os dados da escola e preferências da conta
  if(window.__goBox&&podeVer("box"))show("box")}
// liga o MSAL sem janelas (para enviar email e copiar para o OneDrive), aproveitando a sessão do Office 365 que já existe no navegador
async function msSilencioso(email){try{const p=await msInit();if(MSACC)return;const acc=p.getAllAccounts().find(a=>String(a.username).toLowerCase()===String(email).toLowerCase());
  if(acc){MSACC=acc;p.setActiveAccount(acc);return}
  const r=await p.ssoSilent({scopes:LOGIN_SCOPES,loginHint:email,redirectUri:MS_REDIR});if(r&&r.account){MSACC=r.account;p.setActiveAccount(r.account)}}catch(e){}}
// os perfis que estavam no serviço da Cloudflare passam para o Supabase (uma vez, sem apagar os de lá)
async function perfisMigrar(){try{const L=await sbRpc("g360_perfis_ler");const lj=L&&L.loja||{};
  if((lj.admins&&lj.admins.length>0)||Object.keys(lj.utilizadores||{}).length||(lj.formandos&&(lj.formandos.padrao||(lj.formandos.dominios||[]).length)))return;
  await msSilencioso(EU.email);if(!MSACC)return;const tok=await guideTok();const r=await fetch(srvUrl()+"/guide/perfis",{headers:{Authorization:"Bearer "+tok},cache:"no-store"});
  if(!r.ok)return;const j=await r.json();if(j&&j.loja){await sbRpc("g360_perfis_gravar",{p_loja:j.loja});toast("Perfis trazidos do serviço antigo para a base de dados")}}catch(e){}}
async function guideEntrar(tok){
  gateState("wait","");prog(30,"A confirmar o perfil…");
  let r=null,j={};
  try{r=await fetch(srvUrl()+"/guide/eu",{headers:{Authorization:"Bearer "+tok},cache:"no-store"});j=await r.json().catch(()=>({}))}catch(e){}
  const servicoNovo=r&&(r.ok||j.semPerfil||/Microsoft|Office 365|MS_TENANT|perfil/i.test(j.erro||""));
  if(r&&r.ok&&j.perfil){EU=j;MODS_OFF=Array.isArray(j.modsOff)?j.modsOff:[]}
  else if(servicoNovo){gateState("login",j.erro||"Sem acesso à EPISJ 360.");return}
  else{ // o serviço ainda não tem as rotas da EPISJ 360: entra só quem já usa a EPISJ 360 neste navegador (a Direção), como administrador provisório
    if(!(cfg.profs.length||cfg.mods.length)){gateState("login","O serviço da EPISJ 360 ainda não conhece os perfis (falta atualizar o serviço de avisos na Cloudflare). Fale com a Direção.");return}
    EU={email:String(MSACC&&MSACC.username||"").toLowerCase(),nome:MSACC&&(MSACC.name||MSACC.username)||"",perfil:"dexec",perfilNome:"Direção Executiva",admin:true,vis:null,provisorio:true}}
  window.__guideLogin=EU.email;
  prog(40,"Perfil: "+(EU.admin?"Administrador":(EU.perfilNome||PERFIL_CURTO[EU.perfil]||"")));
  whoUI();aplicarPerfil();
  await guideCarregarModulos();
  try{await lgMigrar();aplicarLogos()}catch(e){}
  if(curTab&&curTab.startsWith("rc"))try{rcRender(curTab)}catch(e){}
  prog(100,"Pronto!");await gpEspera(GP.v<99?650:350);
  gateState("off");try{if(curTab==="esc")renderEscPainel()}catch(e){}
  if(window.__goBox&&podeVer("box"))show("box");
  if(EU.provisorio)setTimeout(()=>toast("Perfis provisórios: falta atualizar o serviço de avisos na Cloudflare"),800);
  pubUI()}
// 0.9.13: carrega os módulos um a um, com a barra de 0 a 100%; nenhum passo prende a entrada (há sempre um limite de tempo)
// 0.9.87: os módulos sem passo de carregamento próprio (Crono360, Social360 e os que vierem) ficam prontos no fim
async function guideCarregarModulos(){try{return await guideCarregarModulos0()}finally{Object.keys(GP.mods).forEach(m=>{if(GP.mods[m]==="wait"&&!["escola","eduschedule","boxcheck","roomcheck"].includes(m))progMod(m,"ok")})}}
async function guideCarregarModulos0(){
  const vis=new Set(GP_MODS.map(([m])=>m).filter(m=>primeiroPermitido(m)));
  vis.forEach(m=>progMod(m,"wait"));
  const fim=(m,st)=>{if(vis.has(m))progMod(m,st)};
  // Escola (e, para quem só lê, também o que a Direção publicou do EduSchedule)
  prog(46,"A carregar a Escola…");
  try{if(soLeitura())await gpAte(carregarPublico(),20000);
    else if(podePublicar()&&!cfg.profs.length&&!escData().turmas.length&&!SES&&!sbAtivo())await gpAte(carregarPublico(),20000); // computador novo da Direção: mostra o publicado até ligar a Box
    fim("escola","ok")}catch(e){fim("escola",e.tempo?"bg":"erro")}
  prog(56,"A carregar o Horários360…");
  try{await gpAte(esdPronto,10000);fim("eduschedule","ok")}catch(e){fim("eduschedule",e.tempo?"bg":"erro")}
  prog(64,"A carregar o Box360…");
  try{await gpAte(pronto,15000)}catch(e){}
  if(soLeitura()){fim("boxcheck","ok");fim("roomcheck","ok");return}
  if(!podeVer("box")){loginUI();fim("boxcheck","ok");fim("roomcheck","ok");return}
  try{if(SES&&SES.mode==="oauth"&&!sesMinha(SES))SES=null}catch(e){} // 0.9.50: a sessão guardada é de outra conta da Direção
  if(!SES){prog(66,"Box360: a procurar a ligação à Box…");try{await gpAte(boxRecuperar(),9000)}catch(e){}}
  if(!SES){boxArrancar();fim("boxcheck","off");
    try{await gpAte(SB_PRONTO,6000)}catch(e){}
    if(nuvSB()||nuvMS()){prog(72,"A trazer os dados da escola…");try{await gpAte(nuvemSincMS(),40000)}catch(e){}}
    if(nuvSB())try{await gpAte(recuperarLocal(),15000)}catch(e){}
    fim("roomcheck","ok");odCopiaDiaria();return} // sem sessão da Box: o que está neste computador, junto com a nuvem da EPISJ 360 (Office 365)
  loginUI();boxEstado("wait");prog(70,"Box360: a ligar à Box…");
  const pMe=boxEuGuardado()?Promise.resolve(boxEuGuardado()):boxGet("users/me",{fields:"name,login"});pMe.catch(e=>boxEstado("login",e.message)); // 0.9.113: sem pedido se a sessão já sabe de quem é // como antes: se a Box falhar, pede para voltar a ligar
  const pBox=pMe.then(me=>{gpPasso(76,"Box360: ligado à Box");return connected(me)}).then(async()=>{if(nuvSB())try{await recuperarLocal()}catch(e){}});pBox.catch(()=>{});
  try{await gpAte(pBox,45000);fim("boxcheck","ok");fim("roomcheck","ok");fim("escola","ok");fim("eduschedule","ok");odCopiaDiaria()}
  catch(e){fim("boxcheck",e.tempo?"bg":"erro");fim("roomcheck",e.tempo?"bg":"ok")}}
function whoUI(){const n=EU.nome||EU.email,ini=n.split(/\s+/).filter(Boolean).map(w=>w[0]).slice(0,2).join("").toUpperCase();
  $("#who").innerHTML=`<span class="av">${esc(ini)}</span><span title="${esc(EU.email)}">${esc(n)}</span><span class="pf${EU.admin?" adm":""}" title="${esc(EU.admin?"Administrador da EPISJ 360 — perfil: "+(EU.perfilNome||PERFIL_CURTO[EU.perfil]||""):"Perfil da conta")}">${esc(EU.admin?"Administrador":(EU.perfilNome||PERFIL_CURTO[EU.perfil]||""))}</span><a href="#" id="whoOut" title="Terminar sessão" aria-label="Terminar sessão">Terminar sessão</a>`;
  $("#who").style.display="flex";$("#whoOut").onclick=e=>{e.preventDefault();sairAbrir()};
  try{$("#privBtn").hidden=false;renderPriv();const lk=localStorage.getItem(PRIV_ON);if(lk&&lk!==String(EU.email||"").toLowerCase())privDesbloquear()}catch(e){}}
/* ---------- 0.9.136: Terminar sessão e limpar este computador ----------
   Só apaga a cópia local (localStorage, IndexedDB «boxcheck», sessionStorage) depois de confirmar que a nuvem tem tudo:
   · quem é da Direção: sincroniza agora (junta com a nuvem e envia o que só está aqui) e confere peça a peça com a base de dados;
   · as outras contas não gravam na nuvem: se este computador tiver alterações da Direção ainda por enviar, não limpa.
   Fica só a marca «episj_ger» (geração dos dados), para a nuvem continuar a valer por inteiro na próxima entrada. */
function sairAbrir(){const bg=$("#sairBg");if(!bg){guideSair();return}$("#sairMsg").innerHTML="";bg.querySelectorAll("button").forEach(b=>b.disabled=false);bg.hidden=false;setTimeout(()=>{try{$("#sairSim").focus()}catch(e){}},50)}
function sairFechar(){const bg=$("#sairBg");if(bg)bg.hidden=true}
async function sairLocais(){ // [peça na nuvem, rótulo, data da cópia local]
  const kv=async k=>{try{const v=await DB.get("kv",k);return v&&+v.t||0}catch(e){return 0}};
  return [["estado","Configuração da escola",cfgT()],["ES","Horários360",await kv("esched")],["CR","Crono360",await kv("crono")],["PAP","PAP360",await kv("pap")],
    ["FD","Folder360",await kv("folder")],["EC","Econo360",await kv("econo")],["PW","Pass360",await kv("pw")]]}
async function sairVerificar(msg){
  if(!navigator.onLine)return{ok:false,porque:"Este computador está sem Internet: não dá para confirmar que está tudo na nuvem."};
  let L=await sairLocais();
  if(nuvSB()){
    msg("A juntar com a nuvem e a enviar o que só está neste computador…");
    try{await nuvemSincMS()}catch(e){}
    try{let idx=(await (await nuvem("GET","")).json()).itens||{};
      if(cfgT()>((idx.estado&&idx.estado.t)||0)){await nuvemPut("estado",estadoAtual(),cfgT());idx=(await (await nuvem("GET","")).json()).itens||{}}
      L=await sairLocais();
      const falta=L.filter(([n,,t])=>t>0&&t>((idx[n]&&idx[n].t)||0)).map(x=>x[1]);
      if(typeof rcNuvErr!=="undefined"&&rcNuvErr)falta.push("Sala360");
      if(NUV.erro)falta.push("("+NUV.erro+")");
      return falta.length?{ok:false,porque:"Ainda não está na nuvem: "+falta.join(", ")+"."}:{ok:true}}
    catch(e){return{ok:false,porque:"Não foi possível falar com a base de dados ("+(e.message||e)+")."}}}
  // outras contas: confere com o registo do que este computador já enviou para a nuvem
  const env=nuvT(),falta=L.filter(([n,,t])=>t>0&&t>(+env[n]||0)).map(x=>x[1]);
  let rcLocal=false;try{const r=JSON.parse(localStorage.getItem("roomcheck")||"null");rcLocal=!!(r&&r.res&&Object.keys(r.res).length&&!(+env.rc||0))}catch(e){}
  if(rcLocal)falta.push("Sala360");
  return falta.length?{ok:false,porque:"Este computador tem dados da Direção que podem ainda não estar na nuvem ("+falta.join(", ")+"). Peça a quem é da Direção para entrar aqui e usar «Terminar e limpar este computador»."}:{ok:true}}
async function sairLimpar(){const bg=$("#sairBg"),M=$("#sairMsg");const msg=t=>{M.innerHTML=`<div class="msg info">${esc(t)}</div>`};
  bg.querySelectorAll("button").forEach(b=>b.disabled=true);
  try{const v=await sairVerificar(msg);
    if(!v.ok){M.innerHTML=`<div class="msg bad">Não limpei este computador. ${esc(v.porque)}</div>`;bg.querySelectorAll("button").forEach(b=>b.disabled=false);return}
    msg("Está tudo na nuvem. A apagar a cópia deste computador…");LIMPAR=true;
    try{await sbSair()}catch(e){}try{const p=await msInit();await p.clearCache({account:MSACC})}catch(e){}MSACC=null;EU=null;
    let ger=null;try{ger=localStorage.getItem("episj_ger")}catch(e){}
    try{localStorage.clear();if(ger)localStorage.setItem("episj_ger",ger)}catch(e){}
    try{sessionStorage.clear()}catch(e){}
    await new Promise(ok=>{try{const r=indexedDB.deleteDatabase("boxcheck");r.onsuccess=r.onerror=r.onblocked=()=>ok()}catch(e){ok()}setTimeout(ok,4000)});
    location.reload()}
  catch(e){M.innerHTML=`<div class="msg bad">Não foi possível limpar (${esc(e.message||e)}).</div>`;bg.querySelectorAll("button").forEach(b=>b.disabled=false)}}
(function(){const bg=document.getElementById("sairBg");if(!bg)return;
  $("#sairNao").onclick=sairFechar;$("#sairSim").onclick=()=>{sairFechar();guideSair()};$("#sairLimpa").onclick=()=>sairLimpar();
  bg.addEventListener("click",e=>{if(e.target===bg&&!$("#sairNao").disabled)sairFechar()});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!bg.hidden&&!$("#sairNao").disabled)sairFechar()})})();
async function guideSair(){ // 0.9.50: a Box fica ligada (só «Desligar a Box» a desliga)
  try{await sbSair()}catch(e){}try{const p=await msInit();await p.clearCache({account:MSACC})}catch(e){}MSACC=null;EU=null;location.reload()}

// esconde os módulos e separadores que o perfil não pode abrir
function aplicarPerfil(){
  if(EU&&EU.email&&!PREV)modPreCarregar(); // 0.9.133: os módulos que esta conta pode abrir vêm em segundo plano
  document.querySelectorAll("#nav button[data-t]").forEach(b=>b.hidden=!podeVer(b.dataset.t));
  document.querySelectorAll("#mods button[data-m]").forEach(b=>{b.hidden=!primeiroPermitido(b.dataset.m);const off=MODS_OFF.includes(b.dataset.m)&&!b.hidden;b.classList.toggle("moff",off);
    if(!b.dataset.t0)b.dataset.t0=b.title;b.title=off?b.dataset.t0+" — DESLIGADO: só os administradores o veem":b.dataset.t0});
  document.querySelectorAll("#nav .mgrp.gl").forEach(g=>g.hidden=![...g.querySelectorAll("button[data-t]")].some(b=>!b.hidden));
  const ro=soLeitura()&&!PREV;document.body.classList.toggle("ro",ro);const u=document.querySelector(".undo");if(u)u.style.display=ro||RO?"none":"";
  try{h3ModoAplicar()}catch(e){} // 0.9.136: Horários360 Simples / Completa (só a Direção escolhe)
  const pf=perfilAtual(),l=$("[data-mhlbl]");if(l)l.textContent=pf==="form"?"Horário da turma":pf==="prof"?"O meu horário":"Horários publicados";
  let bar=$("#pvbar");if(PREV){if(!bar){bar=document.createElement("div");bar.id="pvbar";bar.className="pvbar";document.querySelector("main").prepend(bar)}
    bar.innerHTML=`${ico("eye")} A pré-visualizar como <b>${esc(PERFIL_CURTO[PREV])}</b> — é só o que aparece; os dados continuam os seus.<button class="b s" id="pvOut">Sair da pré-visualização</button>`;$("#pvOut").onclick=()=>{PREV="";aplicarPerfil();show("uti")}}
  else if(bar)bar.remove();
  if(!primeiroPermitido(curMod)){const m=MODULOS.find(x=>primeiroPermitido(x.id));if(m)mostrarModulo(m.id,true);else if(podeVer("def"))show("def")}
  else if(!podeVer(curTab))mostrarModulo(curMod,true)}

/* dados publicados pela Direção (só leitura para Formador e Formando) */
let PUB=null;
// 0.9.55: o que a Direção publicou fica guardado no aparelho e só se descarrega de novo quando há outra publicação
// (com 1000 formadores são ~1 MB por entrada: assim entra-se logo e gasta-se muito menos rede)
async function publicoLer(){if(!sbAtivo())return guideApi("/guide/publico");
  const ck="g360_pub:"+String(EU&&EU.email||"").toLowerCase()+":"+(EU&&EU.perfil||"");let c=null,v=null;
  try{c=await DB.get("kv",ck)}catch(e){}
  try{v=await sbRpc("g360_publico_versao")}catch(e){}
  if(c&&c.j&&v!=null&&+c.t===+v)return c.j;
  try{const j=await guideApi("/guide/publico");try{if(j&&typeof j==="object"&&v!=null)await DB.put("kv",ck,{t:+v,j})}catch(e){}return j}
  catch(e){if(c&&c.j){toast("Sem ligação: a mostrar o que foi publicado da última vez");return c.j}throw e}}
async function carregarPublico(){
  let j={};try{j=await publicoLer()}catch(e){toast("Não foi possível trazer os dados da escola: "+e.message)}
  RO=true;PUB=j||{};
  cfg=Object.assign(defaultCfg(),j&&j.escola?{escola:j.escola,profs:Array.isArray(j.profs)?j.profs:[]}:{});lastJSON=JSON.stringify(cfg);undoS=[];redoS=[];undoUI();
  try{await esdPronto}catch(e){}
  ESD=Object.assign({t:0,porAno:{},copias:{},mapaT:{},mapaC:{},ligT:{},ligC:{}},j&&j.es||{});try{CR=crNorm(j&&j.cr);CR_CACHE.k=""}catch(e){}
  try{renderAnoTopo();refreshAll()}catch(e){console.warn(e)}aplicarPerfil();if(curTab==="mh")renderMh();try{window.__subEst&&window.__subEst()}catch(e){}}
function sairSoLeitura(){RO=false;PUB=null;cfg=load()||defaultCfg();lastJSON=JSON.stringify(cfg);try{DB.get("kv","econo").then(v=>{ECO=ecoNorm(v);ecoCalcC=null}).catch(()=>{})}catch(e){}try{DB.get("kv","folder").then(v=>{FOL=foNorm(v);foIdxC=null}).catch(()=>{})}catch(e){}try{DB.get("kv","pap").then(v=>{PAP=papNorm(v)}).catch(()=>{})}catch(e){}try{DB.get("kv","crono").then(v=>{CR=crNorm(v);CR_CACHE.k=""}).catch(()=>{})}catch(e){}
  DB.get("kv","esched").then(v=>{ESD=Object.assign({t:0,porAno:{},copias:{},mapaT:{},mapaC:{},ligT:{},ligC:{}},v&&typeof v==="object"?v:{})}).catch(()=>{});
  try{renderAnoTopo();refreshAll()}catch(e){}aplicarPerfil()}

/* a Direção publica para os outros perfis: turmas, cursos, anos letivos, formadores e horários */
let pubH=null,PUBT=+(localStorage.getItem("guide_pub_t")||0),PUBERR="";
function guidePubAgendar(){if(!podePublicar()||RO)return;clearTimeout(pubH);pubH=setTimeout(()=>guidePublicar(false),15000)}
async function guidePublicar(manual){if(!podePublicar()||RO)return;
  if(!cfg.profs.length&&!escData().turmas.length){if(manual)toast("Ainda não há turmas nem formadores para publicar");return}
  const porAno={},E0=escData(),hj=hoje(),anoOk=k=>{if(k===E0.ativo)return true;const a=E0.anos.find(x=>x.id===k);return !!(a&&a.inicio&&a.inicio>hj)}; // 0.9.55: só o ano ativo e os que ainda vão começar
  for(const [k,v] of Object.entries(ESD.porAno||{}))if(v&&v.estado&&anoOk(k))porAno[k]={estado:v.estado,quando:v.quando||0};
  const body={v:1,t:Date.now(),por:EU.email,escola:cfg.escola,profs:cfg.profs.map(p=>({id:p.id,nome:p.nome,abrev:p.abrev||"",email:String(p.email||"").trim().toLowerCase()})),es:{porAno,mapaT:ESD.mapaT||{},mapaC:ESD.mapaC||{}}};try{body.cr=crPublico()}catch(e){}try{if(H3&&H3.sal)body.h3={sal:H3.sal}}catch(e){} // 0.9.136: tópicos das notificações dos formadores (Horários360) // 0.9.59: pontos de situação do Crono360
  // 0.9.50: o que já está publicado não volta a ser enviado (com o tempo real, cada computador da Direção publicaria o mesmo)
  const sx=JSON.stringify({...body,t:0,por:""}),sig=sx.length+":"+esHash(sx);let sig0="";try{sig0=localStorage.getItem("guide_pub_sig")||""}catch(e){}
  if(!manual&&sig===sig0&&PUBT&&!PUBERR){pubUI();return}
  try{await guideApi("/guide/publico",{method:"POST",body:JSON.stringify(body)});PUBT=Date.now();PUBERR="";try{localStorage.setItem("guide_pub_t",String(PUBT));localStorage.setItem("guide_pub_sig",sig)}catch(e){}if(manual)toast("Publicado")}
  catch(e){PUBERR=e.message;if(manual)toast("Não foi possível publicar: "+e.message)}
  pubUI()}
function pubUI(){const b=$("#pubBox");if(!b)return;b.style.display=podePublicar()&&!RO?"flex":"none";
  $("#pubMsg").innerHTML=PUBERR?`<span style="color:var(--bad)">Não publicado: ${esc(PUBERR)}</span>`:PUBT?`Publicado às ${new Date(PUBT).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})} — volta a publicar sozinho a cada alteração.`:"Ainda não publicado: Formadores e Formandos não veem turmas nem horários."}
$("#pubGo").onclick=()=>guidePublicar(true);

/* As minhas entregas */
let MEU_SEL="";
const EST_TAG={prazo:["ok","entregue"],atraso:["warn","entregue com atraso"],falta:["bad","em falta"],pendente:["","por entregar"]};
async function renderMeu(){const out=$("#meuOut");if(!EU)return;
  if(EU.provisorio){out.innerHTML=`<div class="msg info">Para ver as entregas por formador, falta atualizar o serviço de avisos na Cloudflare (EPISJ 360 0.9).</div>`;return}
  out.innerHTML=`<p class="hint"><span class="spin"></span> A carregar…</p>`;
  let j;try{j=await guideApi("/guide/entregas"+(MEU_SEL?"?email="+encodeURIComponent(MEU_SEL):""))}catch(e){out.innerHTML=`<div class="msg bad">${esc(e.message)}</div>`;return}
  const row=$("#meuSelRow");
  if(j.professores&&j.professores.length){row.style.display="";$("#meuSel").innerHTML=`<option value="">${esc(EU.nome)} (a minha conta)</option>`+j.professores.slice().sort((a,b)=>COLL_PT.compare(a.nome,b.nome)).map(p=>`<option value="${esc(p.email)}"${p.email===MEU_SEL?" selected":""}>${esc(p.nome)}</option>`).join("")}else row.style.display="none";
  $("#meuQuem").textContent=MEU_SEL&&j.prof?j.prof.nome:"lhe";
  if(j.semPlano){out.innerHTML=`<div class="msg info">Ainda não há prazos no serviço da EPISJ 360: a Direção tem de ligar o envio pelo servidor em <b>Box360 › Prazos</b>.</div>`;return}
  if(j.semProf){out.innerHTML=`<div class="msg info">${MEU_SEL?"Este formador":"A sua conta (<b>"+esc(EU.email)+"</b>)"} não aparece entre os formadores com prazos. O email em <b>Escola › Formadores</b> tem de ser o do Office 365.</div>`;return}
  if(!Array.isArray(j.prazos)||!j.prazos.length){out.innerHTML=`<div class="msg ok">Não há documentos com prazo atribuídos${MEU_SEL?" a "+esc(j.prof.nome):""}.</div>`;return}
  const ord={falta:0,pendente:1,atraso:2,prazo:3};
  out.innerHTML=j.prazos.map(p=>{const c=p.c,tot=c.prazo+c.atraso+c.falta+c.pendente,ok=c.prazo+c.atraso;
    return `<div class="card ment" style="margin:0 0 12px;box-shadow:none"><h3 style="margin:0 0 4px">${esc(p.nome||"Prazo")} <span class="hint" style="font-weight:400">· até ${esc(p.prazoPT)}</span></h3>
      <p class="hint" style="margin:0 0 8px"><b>${ok}</b> de <b>${tot}</b> entregues${c.falta?` · <span style="color:var(--bad)"><b>${c.falta}</b> em falta</span>`:""}${c.pendente?` · <b>${c.pendente}</b> por entregar`:""}${c.atraso?` · ${c.atraso} com atraso`:""}</p>
      ${p.itens.slice().sort((a,b)=>ord[a.est]-ord[b.est]).map(x=>{const [cl,tx]=EST_TAG[x.est]||["",x.est];
        const det=x.est==="prazo"||x.est==="atraso"?`entregue a ${dataPT(x.ent)}${x.atraso?` (${x.atraso} dia(s) depois do prazo)`:""}`:x.est==="falta"?`${x.atraso} dia(s) depois do prazo${x.naoConta?" — o ficheiro que lá está não conta (vazio ou repetido)":""}`:(x.naoConta?"o ficheiro que lá está não conta (vazio ou repetido)":"");
        return `<div class="mit"><span class="tag ${cl}" style="flex:none">${tx}</span><div><div>${esc(x.linha)}</div>${x.loc?`<div class="hint" style="margin:0">${esc(x.loc)}</div>`:""}${det?`<div class="hint" style="margin:0">${esc(det)}</div>`:""}</div></div>`}).join("")}</div>`}).join("")
    +`<p class="hint">Ano letivo ${esc(j.ano||"")} · a Box foi verificada pela última vez ${j.verificado?"a "+new Date(j.verificado).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):"— ainda não"}.</p>`}
$("#meuSel").onchange=e=>{MEU_SEL=e.target.value;renderMeu()};$("#meuAtual").onclick=()=>renderMeu();


