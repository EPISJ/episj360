/* ---------- módulos da EPISJ 360 ---------- */
const MODULOS=[{id:"escola",nome:"Escola360",inicio:"esc"},{id:"boxcheck",nome:"Box360",inicio:"box"},{id:"eduschedule",nome:"Horários360",inicio:(()=>{try{return localStorage.getItem("h360_modo")==="completa"?"esch":"hsSem"}catch(e){return "hsSem"}})()},{id:"roomcheck",nome:"Sala360",inicio:"rcMapa"},{id:"crono",nome:"Crono360",inicio:"crPs"},{id:"social",nome:"Social360",inicio:"s3feed"},{id:"pap",nome:"PAP360",inicio:"papInicio"},{id:"pass",nome:"Pass360",inicio:"pwCofre"},{id:"folder",nome:"Folder360",inicio:"foInicio"},{id:"econo",nome:"Econo360",inicio:"ecoInicio"}]; // novos módulos entram aqui, com um grupo .mgrp[data-m] no menu lateral
/* ---------- 0.9.133: módulos carregados só quando são abertos (PAP360, Pass360, Folder360, Econo360) ----------
   Os dados destes módulos (estado, nuvem, cópias, widgets) vêm sempre com a app (ficheiros *-dados.js); o ecrã de cada um
   está num ficheiro à parte (app/m/<id>.js), carregado na primeira vez que o módulo é aberto. Quem não tem acesso nunca o descarrega. */
const MOD_LAZY={pap:"app/m/pap.js",pass:"app/m/pass.js",folder:"app/m/folder.js",econo:"app/m/econo.js"};
const MOD_P={};
function modCarregado(m){return MOD_P[m]&&MOD_P[m].ok===true}
function modCarregar(m){if(!MOD_LAZY[m])return Promise.resolve();if(MOD_P[m])return MOD_P[m].p;
  const r={ok:false};r.p=new Promise((ok,ko)=>{const s=document.createElement("script");s.src=MOD_LAZY[m]+"?v="+encodeURIComponent(VERSAO);s.async=true;
    s.onload=()=>{r.ok=true;ok()};
    s.onerror=()=>{delete MOD_P[m];s.remove();ko(new Error("Não foi possível carregar este módulo. Verifique a ligação à Internet e tente outra vez."))};
    document.head.appendChild(s)});MOD_P[m]=r;return r.p}
// o primeiro desenho de um destes módulos carrega o ficheiro e depois chama o desenho verdadeiro (que substitui este)
function modStub(m,nome){const st=function(...a){return modCarregar(m).then(()=>{const f=window[nome];if(typeof f!=="function"||f===st)throw new Error("O módulo "+m+" não arrancou.");return f.apply(this,a)})
  .catch(e=>{console.warn(e);try{toast(e.message||String(e))}catch(x){}})};return st}
var papRender=modStub("pap","papRender"),pwRender=modStub("pass","pwRender"),foRender=modStub("folder","foRender"),ecoRender=modStub("econo","ecoRender");
// depois de a app abrir, quem pode ver estes módulos (Direção, Economato) recebe-os em segundo plano, para abrirem logo
function modPreCarregar(){try{const ir=()=>{for(const m of Object.keys(MOD_LAZY)){const M=MODULOS.find(x=>x.id===m);if(M&&podeVer(M.inicio))modCarregar(m).catch(()=>{})}};
  (window.requestIdleCallback||(f=>setTimeout(f,1500)))(ir,{timeout:8000})}catch(e){}}
let curMod=(()=>{try{const m=localStorage.getItem("guide_mod");return MODULOS.some(x=>x.id===m)?m:MODULOS[0].id}catch(e){return MODULOS[0].id}})();
function mostrarModulo(id,abrir){curMod=id;try{localStorage.setItem("guide_mod",id)}catch(e){}
  document.querySelectorAll("#mods button").forEach(b=>b.classList.toggle("on",b.dataset.m===id));
  document.querySelectorAll("#nav .mgrp[data-m]").forEach(g=>g.hidden=g.dataset.m!==id);
  if(abrir){const t=primeiroPermitido(id);if(t)show(t)}}
// separador → módulo (pelo grupo do menu lateral); o primeiro separador que o perfil pode abrir em cada módulo
function modDeTab(t){const b=document.querySelector(`#nav button[data-t="${t}"]`);const g=b&&b.closest(".mgrp[data-m]");return g?g.dataset.m:null}
function primeiroPermitido(m){const M=MODULOS.find(x=>x.id===m);if(M&&podeVer(M.inicio))return M.inicio;
  const b=[...document.querySelectorAll(`#nav .mgrp[data-m="${m}"] button[data-t]`)].find(x=>podeVer(x.dataset.t));return b?b.dataset.t:null}
function visAtual(){if(PREV&&UTI)return new Set(UTI.loja.vis[PREV]||UTI.visOmissao[PREV]||[]);if(!EU||!EU.vis)return null;return new Set(EU.vis)}
// 0.9.19: módulos desligados pelo administrador — ninguém os vê, só os administradores (e não na pré-visualização de um perfil)
function modEscondido(m){return !!m&&MODS_OFF.includes(m)&&!!EU&&(!EU.admin||!!PREV)}
// 0.9.28: enquanto o serviço da Cloudflare não conhecer os separadores novos, vê-os quem vê o separador "pai" (e cada formador a sua DSD)
const TAB_PAI={pc:"tur",dsd:"prof"};
function podeVer(t){if(t==="per")return podeVer("uti"); // 0.9.176: «Perfis» saiu de «Utilizadores e perfis» — vê-o quem vê Utilizadores
if(t==="esch"&&!h3EschOk())return false; // 0.9.136: o editor completo só na versão completa do Horários360 (ou a importar do Untis)
  if(/^pw/.test(t))return pwPode()&&!(MODS_OFF.length&&modEscondido("pass"))&&!visNeg(t); // 0.9.98: Pass360 — só a Direção, sempre
  const v=visAtual();if(MODS_OFF.length&&modEscondido(modDeTab(t)))return false;if(!v||v.has(t))return true;
  if(v.has("!"+t))return false; // 0.9.182: desmarcado em Perfis › O que cada perfil vê — vale mais do que a regra por omissão dos separadores novos
  if(TAB_PAI[t]&&!Object.keys(TAB_PAI).some(k=>v.has(k))&&!tabSrv(t))return v.has(TAB_PAI[t])||(t==="dsd"&&perfilAtual()==="prof");{const r=tabNovo(t,v);if(r!==null)return r}return false} // 0.9.183: pc/dsd pelo «pai» só enquanto o servidor não os conhecer
// 0.9.54: separadores novos (Calendário Escolar, Crono360) — enquanto o servidor não os conhecer, vê-os quem tem o perfil certo
/* 0.9.182: em Perfis, desmarcar um separador grava «!separador» na lista do perfil: assim o desmarcado é respeitado mesmo nos
   separadores que o servidor ainda não conhece (que, sem marca, seguem a regra por omissão de tabNovo) */
/* 0.9.183: separadores que o servidor (Supabase, g360_const().separadores) já conhece — para estes vale só o que está marcado
   em Perfis. A lista vem de UTI quando há (administradores); para as outras contas usa-se esta cópia (o g360_eu não a devolve). */
var TAB_SRV0=["esc","anos","cal","cur","tur","pc","prof","dsd","for","box","alt","pas","config","rel","est","env","pra","cop","meu","esch","mh","rcMapa","rcLista","rcEsp","crPs","crCron","crCump","crHist","crDef","ecoInicio","ecoMovs","ecoReq","ecoCompras","ecoInv","ecoCustos","ecoDef","def"];
function tabSrv(t){let srv=null;try{srv=UTI&&UTI.separadores||(EU&&EU.separadores)}catch(e){}if(!Array.isArray(srv))srv=TAB_SRV0;return srv.includes(t)}
function visNeg(t){const v=visAtual();return !!(v&&v.has("!"+t))}
function tabNovo(t,v,pfX){
  /* 0.9.183: revisto a pente fino. Antes, «v.has("esc")» servia para saber se era Direção — mas o Formador também pode ter
     o Dashboard (esc) e passava a ver Comunicar, Folder360, PAP360, Social360 e o Cumprimento/Definições do Crono360.
     Agora: se o servidor já conhece o separador, vale só o que está marcado em Perfis (null = não há regra extra);
     para os separadores que o servidor ainda não conhece, a regra por omissão é pelo perfil (Direção = Executiva/Pedagógica/administrador). */
  if(t==="esc")return (pfX||perfilAtual())!=="econ"; // 0.9.184: cada perfil tem o seu Dashboard (desmarcar em Perfis esconde-o); o Economato só vê o Econo360 (o seu painel é o Início do Econo360)
  if(tabSrv(t))return null;
  const PF=()=>pfX||perfilAtual(),DIR=()=>pfX?(pfX==="dexec"||pfX==="dped"):podePublicar(),PROF=()=>PF()==="prof";
  if(t==="cal")return true;
  if(t==="crPs"||t==="crCron"||t==="crHist"||t==="crAno")return DIR()||PROF();
  if(t==="crCump"||t==="crDef")return DIR();
  if(/^s3/.test(t))return DIR()||(!pfX&&(()=>{try{return !!S3_OK}catch(e){return false}})());
  if(/^pw/.test(t))return DIR(); // Pass360 — só a Direção
  if(/^fo[A-Z]/.test(t))return DIR(); // Folder360 — só a Direção
  if(/^eco[A-Z]/.test(t))return DIR()||PF()==="econ"||(t==="ecoReq"&&PROF()); // Econo360 — Direção e Economato; os formadores só as suas requisições
  if(/^pap/.test(t))return DIR();
  if(t==="hsVer")return PF()!=="form"&&PF()!=="econ"; // 0.9.191: Horários (ver o horário de qualquer formador ou turma) — formadores e Direção
  if(t==="hsSem")return PF()!=="econ"; // Horários360 › Semana — toda a gente vê o horário publicado (menos o Economato)
  if(t==="hsFor")return PF()!=="form"&&PF()!=="econ"; // Por formadores — formadores e Direção
  if(t==="hsCom")return DIR(); // Comunicar — só a Direção
  if(t==="mof")return false;
  return null}
$("#mods").addEventListener("click",e=>{const b=e.target.closest("button[data-m]");if(b)mostrarModulo(b.dataset.m,true)});
mostrarModulo(curMod,false);

/* ---------- tabs ---------- */
let curTab="box";
$("#nav").addEventListener("click",e=>{const b=e.target.closest("button[data-t]");if(!b)return;show(b.dataset.t)});
function show(t){if(!podeVer(t)){const f=primeiroPermitido(modDeTab(t)||curMod);if(!f||f===t)return;t=f}
  curTab=t;document.body.classList.toggle("esch",t==="esch");document.body.classList.toggle("s360",/^s3/.test(t));document.body.classList.toggle("ecom",/^eco[A-Z]/.test(t));try{if(!(LOGOS.anos&&LOGOS.anos.__ok))lgMigrar();aplicarLogos()}catch(e){}{const m=modDeTab(t);if(m&&m!==curMod)mostrarModulo(m,false)}document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t));
  document.querySelectorAll("main>section").forEach(s=>s.classList.toggle("on",s.id===(t==="hsVer"?"mh":t))); // 0.9.191: «Horários» usa o mesmo ecrã de «O meu horário», com a procura
  if(t==="hsVer"||t==="mh")try{renderMh()}catch(e){}
  if(t==="prof"&&typeof GRID_SUJO!=="undefined"&&GRID_SUJO.profs){GRID_SUJO.profs=0;try{renderProfs()}catch(e){}} if(t==="rel")renderReport(); if(t==="box")try{buUI();locUI()}catch(e){} if(t==="est")renderEst(); if(t==="pas")renderTree(); if(t==="alt"){renderAlt();if(SES&&lastListing&&!scanBusy&&Date.now()-(lastListing.t||0)>120000)altAtualizar(true)} if(t==="rel"||t==="alt")verificarFundo(); if(t==="env")renderSend(); if(t==="def")renderDef(); if(t==="cop")renderRP(); if(t==="pra")renderPrazos(); if(t==="mof"){verificarFundo()} if(t==="esc")renderEscPainel(); if(t==="anos")renderAnos(); if(t==="cur")renderCursos(); if(t==="tur")renderTurmas(); if(t==="for")renderFormandos(); if(t==="pc")renderPC(); if(t==="cal")renderCal(); if(t.startsWith("cr"))crRender(t); if(t.startsWith("pap"))papRender(t); if(/^pw/.test(t))pwRender(t); if(/^fo[A-Z]/.test(t))foRender(t);if(/^eco[A-Z]/.test(t))ecoRender(t); if(t==="dsd")renderDSD(); if(t!=="esch"&&H3_IMP){H3_IMP=false;const b=document.querySelector('#nav button[data-t="esch"]');if(b)b.hidden=!podeVer("esch")} if(t==="esch")esMostrar(); if(t==="hsSem")hsRender(); if(t==="hsCom")hsComRender(); if(t==="hsFor")hsForRender(); if(t==="meu")renderMeu(); if(t==="mh")renderMh(); if(t==="uti"||t==="per")renderUti(); if(t.startsWith("rc"))try{rcRender(t)}catch(e){console.warn(e)} if(/^s3/.test(t))s3Mostrar(t);try{mvShow(t)}catch(e){console.warn(e)}} // 0.9.212: versão para telemóvel (core/movel.js)
function refreshAll(){renderAll();if(curTab&&curTab.startsWith("rc"))try{rcRender(curTab)}catch(_){}try{escRender();esRecarregar()}catch(_){}if(curTab==="pra")renderPrazos();if(curTab==="rel")renderReport();if(curTab==="est")renderEst();if(curTab==="env")renderSend();if(curTab==="pas")renderTree();if(curTab==="alt")renderAlt();if(curTab==="cop")renderRP()}
const debounce=(fn,ms)=>{let h;return()=>{clearTimeout(h);h=setTimeout(fn,ms)}};

