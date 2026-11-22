/* ===================== 0.9.213: versão para telemóvel de toda a EPISJ 360 =====================
   Em ecrãs de telemóvel (até 760 px de largura, ou telemóvel deitado) a app deixa de ser a versão de computador encolhida
   e passa a ter a estrutura de uma app móvel (html.mv):
   - barra de cima própria (#mvTop): ícone do módulo (abre a troca de módulo), título do ecrã, botão da conta;
   - barra de separadores em baixo (#mvTabs) com os separadores principais do módulo e «Mais» (resto do módulo e outros módulos);
   - folhas que sobem de baixo (mvFolha) para «Mais», conta, troca de módulo — fecham a deslizar para baixo, no fundo ou com «voltar»;
   - o botão «voltar» do telemóvel (e o gesto de voltar) anda para trás nos ecrãs e fecha folhas e janelas (history.pushState);
   - tabelas passam a cartões, formulários de criação ficam atrás de um botão, textos de ajuda resumidos (mvArrumar).
   No computador e no iPad nada muda. Só se usa `function` e `var` aqui (show() chama mvShow no arranque, antes desta parte correr). */
var MV=null;
var MV_MQ="(max-width:760px), (pointer:coarse) and (max-height:500px) and (max-width:1000px)";
// separadores principais de cada módulo (os primeiros que o perfil pode ver vão para a barra de baixo; o resto fica em «Mais»)
var MV_PRIM={escola:["esc","tur","prof","for"],boxcheck:["box","meu","rel","est"],eduschedule:["hsSem","mh","hsFor","hsVer"],roomcheck:["rcMapa","rcLista","rcEsp"],
  crono:["crPs","crCron","crAno","crHist"],social:["s3feed","s3cal","s3ap","s3inbox"],pap:["papInicio","papProva","papGrelha","papDocs"],pass:["pwCofre","pwGerar","pwSaude","pwDef"],
  folder:["foInicio","foMapa","foMov","foConf"],econo:["ecoInicio","ecoFat","ecoMovs","ecoReq"]};
// nomes curtos para a barra de baixo (o título do ecrã usa sempre o nome completo)
var MV_CURTO={esc:"Início",anos:"Anos",cal:"Calendário",pc:"Planos",dsd:"DSD",hsFor:"Formadores",mh:"O meu",hsVer:"Procurar",esch:"Editor",hsCom:"Comunicar",
  rcLista:"Reservas",crPs:"Situação",crCron:"Cronogr.",crAno:"Ano",crHist:"Histórico",crCump:"Ajustar",papInicio:"Provas",papProva:"Prova",papGrelha:"Grelhas",papDocs:"Documentos",papJuri:"Júri",
  foInicio:"Arquivo",foMapa:"Mapa",foMov:"Requisições",foConf:"Conferir",foImp:"Etiquetas",foRel:"Relatórios",ecoInicio:"Artigos",ecoMovs:"Movimentos",ecoReq:"Requisições",ecoCompras:"Compras",ecoInv:"Inventário",
  meu:"Entregas",est:"Números",rel:"Relatório",box:"Análise",alt:"Alterações",config:"Atribuições",s3feed:"Feed",s3cal:"Calendário",s3ap:"Aprovar",s3inbox:"Mensagens",s3media:"Media",s3an:"Análise",
  pwCofre:"Cofre",pwGerar:"Gerador",pwSaude:"Saúde",def:"Definições",pwDef:"Definições",crDef:"Definições",papDef:"Definições",foDef:"Definições",ecoDef:"Definições",s3def:"Definições"};
// separadores «filhos» (no menu aparecem por baixo do pai): no telemóvel têm seta para voltar ao pai
var MV_PAI={cal:"anos",pc:"tur",dsd:"prof"};
// formulários de criação que no telemóvel ficam recolhidos atrás de um botão
var MV_FORM={curForm:"Novo curso",turForm:"Nova turma",forForm:"Novo formando",profForm:"Novo formador",papJForm:"Novo contacto do júri"};
var MV_ICO={mais:'<path d="M4 7h16M4 12h16M4 17h16"/>',voltar:'<path d="M15 18l-6-6 6-6"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',
  sair:'<path d="M9 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3M16 17l5-5-5-5M21 12H9"/>',cad:'<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',
  undo:'<path d="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',redo:'<path d="m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',nuvem:'<path d="M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  cam:'<path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>',mais2:'<path d="M12 5v14M5 12h14"/>',
  instalar:'<path d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"/>',ext:'<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',seta:'<path d="m9 18 6-6-6-6"/>'};
function mvSvg(p,cls){return `<svg viewBox="0 0 24 24" class="${cls||""}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`}
function mvLigado(){return !!(MV&&MV.on)}
function mvTabBtn(t){return document.querySelector(`#nav button[data-t="${t}"]`)}
function mvTabNome(t){const b=mvTabBtn(t);if(!b)return "";const s=b.querySelector("[data-mhlbl]");return ((s||b).textContent||"").replace(/\s+/g," ").trim()}
function mvTabVis(t){const b=mvTabBtn(t);if(!b||b.hidden)return false;try{return podeVer(t)}catch(e){return true}}
function mvModNome(m){const M=(typeof MODULOS!=="undefined"?MODULOS:[]).find(x=>x.id===m);return M?M.nome:""}
function mvModSvg(m){const b=document.querySelector(`#mods button[data-m="${m}"] svg`);return b?b.outerHTML:""}
function mvModsVis(){return [...document.querySelectorAll("#mods button[data-m]")].filter(b=>!b.hidden&&getComputedStyle(b).display!=="none").map(b=>b.dataset.m)}
function mvTabsDoMod(m){return [...document.querySelectorAll(`#nav .mgrp[data-m="${m}"] button[data-t]`)].map(b=>b.dataset.t).filter((t,i,a)=>a.indexOf(t)===i&&mvTabVis(t))}

/* ---------- arranque ---------- */
function mvIniciar(){if(MV)return;MV={on:false,mq:null,tab:null,pop:false,scroll:{},folha:null,arr:0,obs:null,inst:null};
  try{MV.mq=matchMedia(MV_MQ)}catch(e){return}
  const top=document.createElement("header");top.id="mvTop";top.className="mv-top";
  top.innerHTML=`<button type="button" class="mv-voltar" id="mvVoltar" aria-label="Voltar" hidden>${mvSvg(MV_ICO.voltar)}</button>
    <button type="button" class="mv-mod" id="mvMod" aria-label="Mudar de módulo" aria-haspopup="dialog"></button>
    <div class="mv-tt"><small id="mvModN"></small><h1 id="mvTit"></h1></div>
    <button type="button" class="mv-av" id="mvConta" aria-label="A sua conta, ano letivo e definições" aria-haspopup="dialog"><span id="mvAvI"></span><i class="mv-sinc" id="mvSinc" aria-hidden="true"></i></button>`;
  document.body.insertBefore(top,document.body.firstChild);
  const bar=document.createElement("nav");bar.id="mvTabs";bar.className="mv-tabs";bar.setAttribute("aria-label","Separadores do módulo");document.body.appendChild(bar);
  top.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.id==="mvMod")mvFolhaModulos();else if(b.id==="mvConta")mvFolhaConta();else if(b.id==="mvVoltar")mvVoltar()});
  bar.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.t){if(b.dataset.t===curTab){window.scrollTo({top:0,behavior:"smooth"});return}show(b.dataset.t);return}
    if(b.dataset.mvfab){const F=mvFab();if(F)F.fn();return}
    if(b.dataset.mvmais)mvFolhaMais()});
  window.addEventListener("popstate",mvPop);
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();MV.inst=e});
  const f=()=>mvModo(MV.mq.matches);MV.mq.addEventListener?MV.mq.addEventListener("change",f):MV.mq.addListener(f);
  mvModo(MV.mq.matches)}
function mvModo(on){if(!MV)return;MV.on=!!on;const H=document.documentElement;H.classList.toggle("mv",MV.on);
  if(!MV.on){mvFolhaFechar(true);document.body.classList.remove("navopen");return}
  document.body.classList.remove("navopen");const v=document.getElementById("navVeu");if(v)v.hidden=true;
  try{if(!history.state||!history.state.mv)history.replaceState({mv:curTab},"")}catch(e){}
  mvAtualizar();mvArrumarJa();
  if(!MV.obs){const m=document.querySelector("main");if(m){MV.obs=new MutationObserver(()=>{if(MV.on&&!MV.arr)MV.arr=requestAnimationFrame(mvArrumarJa)});MV.obs.observe(m,{childList:true,subtree:true})}}
  // o estado de «guardado» e o utilizador mudam sem passar por show(): acompanhar de vez em quando (barato)
  if(!MV.tick)MV.tick=setInterval(()=>{if(MV.on&&!document.hidden)mvConta0()},4000)}

/* ---------- chamado por show() a cada mudança de separador ---------- */
function mvShow(t){if(!MV||!MV.on)return;
  if(MV.tab&&MV.tab!==t)MV.scroll[MV.tab]=window.scrollY;
  if(!MV.pop){try{const s=history.state;if(!s||s.mv!==t){if(s&&s.mv&&!s.sh)history.pushState({mv:t},"");else history.replaceState({mv:t},"")}}catch(e){}}
  const ant=MV.tab;MV.tab=t;mvAtualizar();
  if(ant!==t)requestAnimationFrame(()=>{window.scrollTo(0,MV.pop&&MV.scroll[t]?MV.scroll[t]:0)})}
function mvPop(e){if(!MV||!MV.on)return;const s=e.state||{};
  if(MV.folha){mvFolhaFechar(true);if(s.sh)return} // «voltar» com uma folha aberta só a fecha
  // janelas da app (Folder360/Econo360, WhatsApp, Sala360, ficha do artigo…) fecham com «voltar»; o ecrã fica onde estava
  if(mvJanelaFechar()){try{history.pushState({mv:curTab},"")}catch(x){}return}
  if(s.mv&&s.mv!==curTab){MV.pop=true;try{show(s.mv)}catch(x){}MV.pop=false}}
function mvVoltar(){const p=MV_PAI[curTab];if(p&&mvTabVis(p)){show(p);return}history.back()}
// fecha a janela que estiver aberta por cima da página (as que a app já tem); devolve true se fechou alguma
function mvJanelaFechar(){
  const B=document.body;if(B.classList.contains("ecofic")){B.classList.remove("ecofic");return true}
  const rc=document.getElementById("rcDw");if(rc&&!rc.hidden&&typeof rcFechar==="function"){rcFechar();return true}
  if(document.getElementById("waBg")&&typeof waFechar==="function"){waFechar();return true}
  const sc=document.querySelector(".fd-scan");if(sc){const x=sc.querySelector("[data-x]");if(x)x.click();else sc.remove();return true}
  const L=document.querySelectorAll(".fd-modal");if(L.length){L[L.length-1].remove();return true}
  const nv=document.getElementById("novBg");if(nv&&!nv.hidden){const x=document.getElementById("novOk");if(x)x.click();else nv.hidden=true;return true}
  return false}

/* ---------- barra de cima e barra de baixo ---------- */
function mvAtualizar(){if(!MV||!MV.on)return;const t=curTab,m=(typeof modDeTab==="function"&&modDeTab(t))||curMod;
  const tit=document.getElementById("mvTit"),mn=document.getElementById("mvModN"),mb=document.getElementById("mvMod"),vb=document.getElementById("mvVoltar");
  if(tit)tit.textContent=mvTabNome(t)||mvModNome(m);if(mn)mn.textContent=mvModNome(m);
  if(mb&&mb.dataset.m!==m){mb.dataset.m=m;mb.innerHTML=mvModSvg(m)}
  const pai=MV_PAI[t];if(vb){vb.hidden=!(pai&&mvTabVis(pai));if(!vb.hidden)vb.setAttribute("aria-label","Voltar a "+mvTabNome(pai))}
  if(mb)mb.hidden=!!(vb&&!vb.hidden);
  document.documentElement.style.setProperty("--mvc",getComputedStyle(document.querySelector(`#mods button[data-m="${m}"]`)||document.body).getPropertyValue("--mc").trim()||"var(--brand)");
  mvBarra(m,t);mvConta0()}
function mvFab(){const m=curMod;
  if(m==="econo"&&typeof ecoEd==="function"&&typeof ecfFotografar==="function"&&(()=>{try{return ecoEd()}catch(e){return false}})()&&mvTabVis("ecoFat"))
    return {ico:MV_ICO.cam,nome:"Fotografar fatura",fn:()=>ecfFotografar()};
  return null}
function mvBarra(m,t){const bar=document.getElementById("mvTabs");if(!bar)return;
  const vis=mvTabsDoMod(m),F=mvFab(),max=F?3:4;
  let prim=(MV_PRIM[m]||[]).filter(x=>vis.includes(x));for(const x of vis){if(prim.length>=max)break;if(!prim.includes(x))prim.push(x)}prim=prim.slice(0,max);
  // o separador aberto, se não estiver na barra, aparece no «Mais» realçado
  const btn=x=>{const b=mvTabBtn(x),sv=b&&b.querySelector("svg");return `<button type="button" data-t="${x}" class="${x===t||MV_PAI[t]===x?"on":""}" aria-label="${esc(mvTabNome(x))}"${x===t?' aria-current="page"':""}>${sv?sv.outerHTML:""}<span>${esc(MV_CURTO[x]||mvTabNome(x))}</span></button>`};
  const L=prim.map(btn);if(F)L.splice(Math.min(2,L.length),0,`<button type="button" class="mv-fab" data-mvfab="1" aria-label="${esc(F.nome)}">${mvSvg(F.ico)}</button>`);
  const noMais=!prim.includes(t)&&!prim.includes(MV_PAI[t]);
  L.push(`<button type="button" data-mvmais="1" class="${noMais?"on":""}" aria-label="Mais separadores e módulos">${mvSvg(MV_ICO.mais)}<span>Mais</span></button>`);
  const h=L.join("");if(bar.__h!==h){bar.innerHTML=h;bar.__h=h}
  document.documentElement.classList.toggle("mv-sembar",!vis.length)}
// avatar (iniciais), sinal de «a guardar / por guardar»
function mvConta0(){const a=document.getElementById("mvAvI");if(!a)return;let ini="";try{if(EU&&(EU.nome||EU.email)){const n=String(EU.nome||EU.email.split("@")[0]).replace(/[._]/g," ").trim().split(/\s+/);ini=(n[0][0]+(n.length>1?n[n.length-1][0]:"")).toUpperCase()}}catch(e){}
  if(a.textContent!==ini)a.textContent=ini;
  const s=document.getElementById("mvSinc"),st=(document.getElementById("subSt")||{}).textContent||"";if(s){const err=/volta a tentar|só neste navegador/i.test(st)&&!/Só leitura/.test(st);s.classList.toggle("err",err);s.title=st}}

/* ---------- folhas que sobem de baixo ---------- */
function mvFolha(titulo,html,cls){mvFolhaFechar(true);const bg=document.createElement("div");bg.className="mv-folha "+(cls||"");bg.setAttribute("role","dialog");bg.setAttribute("aria-modal","true");bg.setAttribute("aria-label",titulo);
  bg.innerHTML=`<div class="mv-fp"><div class="mv-fpega" aria-hidden="true"><i></i></div><div class="mv-fh"><h2>${esc(titulo)}</h2><button type="button" class="mv-fx" data-mvx aria-label="Fechar">${mvSvg(MV_ICO.x)}</button></div><div class="mv-fc">${html}</div></div>`;
  document.body.appendChild(bg);document.documentElement.classList.add("mv-trava");MV.folha=bg;
  try{history.pushState({mv:curTab,sh:1},"")}catch(e){}
  requestAnimationFrame(()=>bg.classList.add("in"));
  bg.addEventListener("click",e=>{if(e.target===bg||e.target.closest("[data-mvx]"))mvFolhaFechar()});
  const kd=e=>{if(e.key==="Escape"&&MV.folha===bg)mvFolhaFechar()};document.addEventListener("keydown",kd);bg.__kd=kd;
  // deslizar para baixo pela pega/cabeçalho (ou pelo conteúdo quando está no topo) fecha
  const p=bg.querySelector(".mv-fp"),c=bg.querySelector(".mv-fc");let y0=null,dy=0;
  p.addEventListener("touchstart",e=>{const naPega=e.target.closest(".mv-fpega,.mv-fh");if(!naPega&&c.scrollTop>0){y0=null;return}y0=e.touches[0].clientY;dy=0;p.style.transition="none"},{passive:true});
  p.addEventListener("touchmove",e=>{if(y0==null)return;dy=Math.max(0,e.touches[0].clientY-y0);if(dy>0)p.style.transform=`translateY(${dy}px)`},{passive:true});
  p.addEventListener("touchend",()=>{if(y0==null)return;p.style.transition="";if(dy>90)mvFolhaFechar();else p.style.transform="";y0=null},{passive:true});
  p.tabIndex=-1;setTimeout(()=>{try{p.focus({preventScroll:true})}catch(e){}},60);
  return bg}
function mvFolhaFechar(semHist){if(!MV||!MV.folha)return;const bg=MV.folha;MV.folha=null;document.removeEventListener("keydown",bg.__kd);
  bg.classList.remove("in");setTimeout(()=>bg.remove(),220);document.documentElement.classList.remove("mv-trava");
  if(!semHist){try{if(history.state&&history.state.sh)history.back()}catch(e){}}}

// «Mais»: o resto dos separadores do módulo + os outros módulos
function mvFolhaMais(){const m=curMod,vis=mvTabsDoMod(m);
  const lin=vis.map(t=>{const b=mvTabBtn(t),sv=b&&b.querySelector("svg"),d=(b&&b.getAttribute("title"))||"";
    return `<button type="button" class="mv-li${t===curTab?" on":""}${MV_PAI[t]?" fil":""}" data-mvt="${t}"><span class="mv-lic">${sv?sv.outerHTML:""}</span><span class="mv-lit"><b>${esc(mvTabNome(t))}</b>${d?`<small>${esc(d)}</small>`:""}</span>${mvSvg(MV_ICO.seta,"mv-lis")}</button>`}).join("");
  const f=mvFolha(mvModNome(m),`<div class="mv-lista">${lin||'<p class="hint">Este módulo não tem separadores para o seu perfil.</p>'}</div>${mvGrelhaMods()}`,"mv-fmais");
  mvLigarFolha(f)}
function mvGrelhaMods(){const L=mvModsVis();if(L.length<2)return "";
  return `<div class="mv-sec">Módulos</div><div class="mv-mods">${L.map(m=>`<button type="button" class="mv-ma${m===curMod?" on":""}" data-mvm="${m}" aria-label="${esc(mvModNome(m))}"><span class="mv-mai">${mvModSvg(m)}</span><span class="mv-mal">${esc(mvModNome(m).replace(/360$/,""))}<i>360</i></span></button>`).join("")}</div>`}
function mvFolhaModulos(){const f=mvFolha("Módulos",mvGrelhaMods().replace('<div class="mv-sec">Módulos</div>',"")||'<p class="hint">Não há outros módulos para o seu perfil.</p>',"mv-fmods");mvLigarFolha(f)}
function mvLigarFolha(f){f.addEventListener("click",e=>{const t=e.target.closest("[data-mvt]"),m=e.target.closest("[data-mvm]"),a=e.target.closest("[data-mvacao]");
  if(t){mvFolhaFechar(true);try{history.replaceState({mv:curTab},"")}catch(x){}show(t.dataset.mvt);return}
  if(m){mvFolhaFechar(true);try{history.replaceState({mv:curTab},"")}catch(x){}const b=document.querySelector(`#mods button[data-m="${m.dataset.mvm}"]`);if(b)b.click();return}
  if(a)mvAcao(a.dataset.mvacao,a)})}

// conta: quem entrou, ano letivo, guardar, anular, bloquear, páginas gerais, ligações da escola, instalar, sair
function mvFolhaConta(){let nome="",mail="",pf="";try{nome=EU&&EU.nome||"";mail=EU&&EU.email||"";pf=EU?(EU.admin?"Administrador":(EU.perfilNome||PERFIL_CURTO[EU.perfil]||"")):""}catch(e){}
  const sel=document.getElementById("anoSel"),st=(document.getElementById("subSt")||{}).textContent||"",up=document.getElementById("subUp"),ub=document.getElementById("undoBtn"),rb=document.getElementById("redoBtn"),pv=document.getElementById("privBtn");
  const anos=sel?[...sel.options].map(o=>`<option value="${esc(o.value)}"${o.selected?" selected":""}>${esc(o.textContent)}</option>`).join(""):"";
  const li=(acao,ico,txt,sub,ext)=>`<button type="button" class="mv-li" data-mvacao="${acao}"><span class="mv-lic">${mvSvg(ico)}</span><span class="mv-lit"><b>${esc(txt)}</b>${sub?`<small>${esc(sub)}</small>`:""}</span>${mvSvg(ext?MV_ICO.ext:MV_ICO.seta,"mv-lis")}</button>`;
  const ger=[["uti","Utilizadores"],["per","Perfis"],["def","Definições"]].filter(([t])=>mvTabVis(t)).map(([t,n])=>{const b=mvTabBtn(t),sv=b&&b.querySelector("svg");
    return `<button type="button" class="mv-li" data-mvt="${t}"><span class="mv-lic">${sv?sv.outerHTML:""}</span><span class="mv-lit"><b>${n}</b></span>${mvSvg(MV_ICO.seta,"mv-lis")}</button>`}).join("");
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent||""),inst=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
  const lig=[["https://outlook.office.com/mail/","Outlook","Email da escola"],["https://teams.microsoft.com","Teams","Conversas e reuniões"],["https://app.box.com","Box","Gestão Documental (só leitura na EPISJ 360)"],["https://www.episj.com","Site da EPISJ","episj.com"]]
    .map(([u,n,d])=>`<a class="mv-li" href="${u}" target="_blank" rel="noopener"><span class="mv-lic">${mvSvg(MV_ICO.ext)}</span><span class="mv-lit"><b>${n}</b><small>${d}</small></span></a>`).join("");
  const html=`<div class="mv-eu"><span class="mv-eav">${esc((document.getElementById("mvAvI")||{}).textContent||"")}</span><div><b>${esc(nome||mail||"Sem sessão")}</b>${mail&&nome?`<small>${esc(mail)}</small>`:""}${pf?`<span class="mv-pf">${esc(pf)}</span>`:""}</div></div>
    ${anos?`<label class="mv-ano">Ano letivo<select data-mvano>${anos}</select></label>`:""}
    <div class="mv-est"><span>${esc(st)}</span>${up&&!up.hidden?`<button type="button" class="b s" data-mvacao="guardar">${mvSvg(MV_ICO.nuvem)} Guardar agora</button>`:""}</div>
    ${ub||rb?`<div class="mv-par"><button type="button" class="b s" data-mvacao="undo"${ub&&ub.disabled?" disabled":""}>${mvSvg(MV_ICO.undo)} Anular</button><button type="button" class="b s" data-mvacao="redo"${rb&&rb.disabled?" disabled":""}>${mvSvg(MV_ICO.redo)} Refazer</button></div>`:""}
    <div class="mv-lista">${ger}${pv&&!pv.hidden?li("bloquear",MV_ICO.cad,"Bloquear o ecrã","Modo de privacidade — é preciso o código para voltar"):""}
    ${inst?"":li("instalar",MV_ICO.instalar,"Pôr no ecrã principal",ios?"No Safari: Partilhar › Adicionar ao ecrã principal":"Abre como uma app, em ecrã inteiro")}</div>
    <div class="mv-sec">Ligações da escola</div><div class="mv-lista">${lig}</div>
    ${EU?`<button type="button" class="b s mv-sair" data-mvacao="sair">${mvSvg(MV_ICO.sair)} Terminar sessão</button>`:""}
    <p class="mv-ver">EPISJ 360 ${esc(typeof VERSAO!=="undefined"?VERSAO:"")}</p>`;
  const f=mvFolha("Conta",html,"mv-fconta");mvLigarFolha(f);
  const s=f.querySelector("[data-mvano]");if(s)s.addEventListener("change",()=>{try{sel.value=s.value;mudarAnoAtivo(s.value)}catch(e){console.warn(e)}})}
function mvAcao(a,el){
  if(a==="guardar"){try{guardarAgora()}catch(e){}el.disabled=true;return}
  if(a==="undo"||a==="redo"){const b=document.getElementById(a==="undo"?"undoBtn":"redoBtn");if(b&&!b.disabled)b.click();mvFolhaFechar();return}
  if(a==="bloquear"){mvFolhaFechar();try{privBloquear()}catch(e){}return}
  if(a==="sair"){mvFolhaFechar(true);try{guideSair()}catch(e){}return}
  if(a==="instalar"){if(MV.inst){const p=MV.inst;MV.inst=null;p.prompt();mvFolhaFechar();return}
    const ios=/iPhone|iPad|iPod/.test(navigator.userAgent||"");
    try{toast(ios?"No Safari, carregue em Partilhar (o quadrado com a seta) e depois em «Adicionar ao ecrã principal».":"No menu do navegador (⋮), escolha «Instalar app» ou «Adicionar ao ecrã principal».")}catch(e){}}}

/* ---------- conteúdo: tabelas em cartões, formulários recolhidos, ajudas resumidas ---------- */
function mvArrumarJa(){if(!MV)return;MV.arr=0;if(!MV.on)return;const m=document.querySelector("main");if(!m)return;
  m.querySelectorAll("table:not([data-mvc])").forEach(mvTabela);
  for(const id in MV_FORM){const f=document.getElementById(id);if(f&&!f.dataset.mvf)mvForm(f,MV_FORM[id])}
  m.querySelectorAll("section .card>h2+p.hint:not([data-mvh]),section .card>h2+.hint:not([data-mvh])").forEach(mvAjuda);
  m.querySelectorAll(".row:not(.mv-filt),.fd-filtros:not(.mv-filt)").forEach(mvFiltros)}
// filas de filtros com várias listas: a caixa de procura fica à vista, as listas ficam atrás de «Filtros» (com o n.º dos que estão escolhidos)
function mvFiltros(r){const k=String(r.children.length);if(r.dataset.mvfi===k)return;r.dataset.mvfi=k;if(r.closest("form,.fd-modal,.wa-bg,.rc-dw,.mv-folha,table"))return;
  const labs=[...r.children].filter(c=>c.tagName==="LABEL"&&c.querySelector("select")&&!c.querySelector("input[type=text],input[type=search]"));
  const proc=[...r.children].some(c=>c.tagName==="LABEL"&&c.querySelector("input[type=text],input[type=search]"));
  if(labs.length<3&&!(proc&&labs.length>=2))return;
  labs.forEach(l=>l.classList.add("mv-fl"));r.classList.add("mv-filt");
  const b=document.createElement("button");b.type="button";b.className="b s mv-fbt";b.setAttribute("aria-expanded","false");
  const cont=()=>{const n=labs.filter(l=>{const s=l.querySelector("select");return s&&s.selectedIndex>0}).length;b.innerHTML=mvSvg('<path d="M4 6h16M7 12h10M10 18h4"/>')+`<span>Filtros</span>${n?`<i>${n}</i>`:""}`};
  cont();b.addEventListener("click",()=>{const ab=r.classList.toggle("mv-fab");b.setAttribute("aria-expanded",ab?"true":"false")});
  r.addEventListener("change",e=>{if(e.target.tagName==="SELECT")cont()});
  const first=labs[0];r.insertBefore(b,first)}
// tabela → cartões: cada linha é um cartão; cada célula mostra o nome da coluna. Só tabelas simples (lista de registos);
// grelhas (horários, cronogramas, mapas, calendários) continuam tabela e deslizam na horizontal.
var MV_GRELHA=/grid|grelha|hor|cron|cal|mapa|mes|ano|sem|dsd|pc-|pcg|rc-|cr-|hs-|mh|matriz|ufcd/i;
function mvTabela(t){t.dataset.mvc="0";if(t.closest(".wg,.rc-grid,.lghd,.mv-nao,[data-mvnao]"))return;
  if(MV_GRELHA.test((t.className||"")+" "+(t.id||"")+" "+((t.parentElement&&t.parentElement.className)||"").replace(/\btw\b/,"")))return;
  const hr=t.tHead&&t.tHead.rows[t.tHead.rows.length-1];if(!hr||!t.tBodies[0])return;const n=hr.cells.length;if(n<2||n>12)return;
  if(t.tHead.rows.length>1)return;
  const nomes=[...hr.cells].map(c=>(c.getAttribute("aria-label")||c.textContent||"").replace(/\s+/g," ").replace(/[▲▼↑↓⇅]/g,"").trim());
  const rows=t.tBodies[0].rows;if(rows.length>4000)return;
  for(const tr of rows){for(const c of tr.cells){if(c.colSpan>1||c.rowSpan>1){if(tr.cells.length===1)continue;return}}}
  t.dataset.mvc="1";t.classList.add("mvc");
  for(const tb of t.tBodies)for(const tr of tb.rows){if(tr.cells.length!==n){tr.classList.add("mv-tl");continue}for(let i=0;i<n;i++){const c=tr.cells[i];if(!c.dataset.l&&nomes[i])c.dataset.l=nomes[i]}}
  // quando a tabela é redesenhada por dentro (linhas novas), voltar a pôr os nomes
  if(!t.__mvo){t.__mvo=new MutationObserver(()=>{if(!MV||!MV.on)return;for(const tb of t.tBodies)for(const tr of tb.rows){if(tr.cells.length!==n)continue;for(let i=0;i<n;i++){const c=tr.cells[i];if(!c.dataset.l&&nomes[i])c.dataset.l=nomes[i]}}});t.__mvo.observe(t,{childList:true,subtree:true})}}
function mvForm(f,nome){f.dataset.mvf="1";const b=document.createElement("button");b.type="button";b.className="b mv-novo";b.innerHTML=mvSvg(MV_ICO.mais2)+`<span>${esc(nome)}</span>`;
  b.setAttribute("aria-expanded","false");f.parentNode.insertBefore(b,f);f.classList.add("mv-recolhido");
  b.addEventListener("click",()=>{const ab=f.classList.toggle("mv-recolhido")===false;b.setAttribute("aria-expanded",ab?"true":"false");b.classList.toggle("ab",ab);b.querySelector("span").textContent=ab?"Fechar":nome;
    if(ab){const i=f.querySelector("input:not([type=hidden]),select");setTimeout(()=>{try{i&&i.focus()}catch(e){}},50)}})}
function mvAjuda(p){p.dataset.mvh="1";if((p.textContent||"").length<150)return;p.classList.add("mv-res");
  p.addEventListener("click",e=>{if(!p.classList.contains("mv-res"))return;e.preventDefault();e.stopPropagation();p.classList.remove("mv-res")},true)}

mvIniciar();
