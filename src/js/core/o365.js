/* ---------- Office 365 (Microsoft Graph, só Mail.Send) ---------- */
const msCfg=()=>{const c=cfg.ms||(cfg.ms={clientId:"",tenant:"",cc:"",lista:false});try{if(!c.clientId&&GMS&&GMS.clientId)c.clientId=GMS.clientId;if(!c.tenant&&GMS&&GMS.tenant)c.tenant=GMS.tenant}catch(e){}return c};
const MS_REDIR=location.origin+location.pathname.replace(/[^/]*$/,"")+"ms.html";
const MS_SCOPES=["Mail.Send","User.Read"];
let MSAL=null,MSACC=null;
// entrada na EPISJ 360: só o nome e o email da conta (User.Read). O Mail.Send só é pedido ao enviar emails no BoxCheck.
const LOGIN_SCOPES=["User.Read"];
let GMS=lsJ("guide_ms",null)||{clientId:"8ed0cf26-753c-4bba-aa1a-f9ca0d799cae",tenant:"1f5546c5-0267-4003-b3fa-80c4372f6d2d"}; // 0.9.45: a aplicação da escola já vem configurada
 // ID da aplicação e do diretório, vindos do serviço da EPISJ 360 (não são segredos)
function msIds(){const c=cfg.ms||{};return{id:(c.clientId||"").trim()||(GMS&&GMS.clientId)||"",ten:(c.tenant||"").trim()||(GMS&&GMS.tenant)||""}}
async function msInit(){const {id,ten}=msIds();
  if(!id||!ten)throw new Error("Falta ligar o Office 365: em Definições, indique o ID da aplicação e o ID do diretório.");
  const k=id+"|"+ten;if(MSAL&&MSAL._k===k)return MSAL;
  if(!window.msal)await loadScript("lib/msal-browser.min.js");
  const p=new msal.PublicClientApplication({auth:{clientId:id,authority:"https://login.microsoftonline.com/"+ten,redirectUri:MS_REDIR,navigateToLoginRequestUrl:false},cache:{cacheLocation:(window.__g360Mem&&window.__g360Mem.real&&window.__g360Mem.real.ss)?"sessionStorage":"memoryStorage"}});
  await p.initialize();p._k=k;MSAL=p;MSACC=p.getActiveAccount()||p.getAllAccounts()[0]||null;return p}
async function msLoginPopup(){const p=await msInit();const r=await p.loginPopup({scopes:MS_SCOPES,prompt:"select_account",redirectUri:MS_REDIR});MSACC=r.account;p.setActiveAccount(r.account);msUI();return r.accessToken}
async function msToken(){const p=await msInit();
  // 0.9.155: a entrada silenciosa só se tenta uma vez por página — se falhou, o clique seguinte abre logo a janela da Microsoft (sem esperar e sem ser bloqueada)
  if(!MSACC&&!window.__msSsoFalhou){try{if(EU&&EU.email)await msSilencioso(EU.email)}catch(e){}if(!MSACC)window.__msSsoFalhou=1}
  if(MSACC){try{return (await p.acquireTokenSilent({scopes:MS_SCOPES,account:MSACC})).accessToken}catch(e){}
    try{return (await p.acquireTokenPopup({scopes:MS_SCOPES,account:MSACC,loginHint:MSACC.username,redirectUri:MS_REDIR})).accessToken}catch(e){}}
  return msLoginPopup()}
function msErro(e){const m=String(e&&(e.errorMessage||e.message)||e);
  if(/popup_window_error|BrowserAuthError: popup/i.test(m))return "O navegador bloqueou a janela de login da Microsoft — permita pop-ups para este site.";
  if(/user_cancelled/i.test(m))return "Login cancelado.";
  if(/AADSTS50011/.test(m))return "O endereço de redirecionamento não está registado na aplicação do Entra. Registe exatamente: "+MS_REDIR;
  if(/AADSTS700016|AADSTS90002/.test(m))return "ID da aplicação ou do diretório errado.";
  if(/AADSTS65001|consent/i.test(m))return "Falta o consentimento do administrador para Mail.Send (Entra › Permissões de API).";
  return m}
function msUI(quiet){const st=$("#msState"),li=$("#msLogin"),lo=$("#msLogout");if(!st)return;const c=msCfg();
  if(!c.clientId||!c.tenant){st.textContent="Ainda não configurado.";li.style.display="";lo.style.display="none";return}
  if(quiet&&!MSAL){msInit().then(()=>msUI()).catch(()=>{});}
  if(MSACC){st.innerHTML=`<span class="tag ok">ligado</span> ${esc(MSACC.name||"")} &lt;${esc(MSACC.username||"")}&gt;`;li.style.display="none";lo.style.display=""}
  else{st.textContent="Não ligado.";li.style.display="";lo.style.display="none"}
  const g=$("#msWho");if(g)g.innerHTML=MSACC?`Os emails saem de <b>${esc(MSACC.username)}</b>.`:(c.clientId?`Office 365 configurado — ao enviar pede-lhe para entrar.`:`Para enviar com PDF em anexo, ligue o Office 365 em <b>Definições</b>.`)}
[["#msClient","clientId"],["#msTenant","tenant"],["#msCc","cc"]].forEach(([s,k])=>$(s).addEventListener("change",e=>{msCfg()[k]=e.target.value.trim();save();MSAL=null;MSACC=null;msUI(true)}));
$("#msLista").addEventListener("change",e=>{msCfg().lista=e.target.checked;save()});
$("#msLogin").onclick=async()=>{try{await msLoginPopup();toast("Ligado ao Office 365")}catch(e){$("#msState").textContent=msErro(e)}};
$("#msLogout").onclick=async()=>{try{const p=await msInit();await p.clearCache({account:MSACC})}catch(e){}MSACC=null;msUI();toast("Sessão Microsoft terminada neste navegador")};
async function msEnviar({to,cc,subject,body,html,anexo}){
  const rec=s=>String(s||"").split(/[;,]/).map(x=>x.trim()).filter(Boolean).map(address=>({emailAddress:{address}}));
  if(!rec(to).length)throw new Error("Sem endereço de email.");
  let emb=[];if(html){const r=msEmbutir(html);html=r.html;emb=r.att}
  const message={subject,body:html?{contentType:"HTML",content:html}:{contentType:"Text",content:body},toRecipients:rec(to)};
  if(emb.length)message.attachments=emb; // 0.9.151: html opcional (o Horários360 envia o horário desenhado)
  if(rec(cc).length)message.ccRecipients=rec(cc);
  if(anexo)message.attachments=(message.attachments||[]).concat([{"@odata.type":"#microsoft.graph.fileAttachment",name:anexo.name,contentType:"application/pdf",contentBytes:anexo.b64}]);
  for(let t=0;;t++){const tok=await msToken();
    const r=await fetch("https://graph.microsoft.com/v1.0/me/sendMail",{method:"POST",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:JSON.stringify({message,saveToSentItems:true})});
    if(r.status===202)return;
    if((r.status===429||r.status>=500)&&t<3){await new Promise(ok=>setTimeout(ok,(+r.headers.get("Retry-After")||3)*1000));continue}
    let m="";try{m=(await r.json()).error.message}catch(e){}
    if(r.status===401&&t<1){MSACC=null;continue}
    throw new Error(`O Office 365 recusou o envio (${r.status})${m?": "+m:""}`)}}
/* 0.9.169: imagens data: num email HTML passam a anexos embutidos (cid:) — o Outlook e o Gmail não mostram imagens data:.
   Imagens iguais vão uma só vez. */
function msEmbutir(html){const att=[],por={};let n=0;
  html=String(html).replace(/src="data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)"/gi,(t,tipo,b64)=>{let id=por[b64];
    if(!id){id=por[b64]="img"+(++n)+"@episj360";const ext=(tipo.split("/")[1]||"png").replace("jpeg","jpg").replace(/\+.*/,"");
      att.push({"@odata.type":"#microsoft.graph.fileAttachment",name:"logotipo-"+n+"."+ext,contentType:tipo,contentBytes:b64,contentId:id,isInline:true})}
    return `src="cid:${id}"`});return{html,att}}
const ENV_OK={};
async function enviarFormador(t){const doc=await pdfFormador(t);
  await msEnviar({to:t.p.email,cc:msCfg().cc,subject:subj(t),body:fill(cfg.mail.body,t,!msCfg().lista),anexo:{name:pdfNomeF(t),b64:pdfB64(doc)}});
  ENV_OK[t.p.id]=Date.now()}
function sendMsg(h,k){$("#sendMsg").innerHTML=h?`<div class="msg ${k||"ok"}">${h}</div>`:""}
// 0.9.50: o Office 365 só deixa enviar cerca de 30 emails por minuto — com muitos formadores o envio vai a esse ritmo, e pode parar-se a meio
var ENVIO_A=false,ENVIO_PARAR=false;
$("#sendAll").onclick=async e=>{if(ENVIO_A){ENVIO_PARAR=true;e.currentTarget.textContent="A parar…";return}
  const L=mailCache.filter(t=>t.p.email),sem=mailCache.length-L.length;
  if(!L.length){sendMsg("Nenhum formador com email para enviar.","bad");return}
  const pausa=L.length>25?2100:400,min=Math.ceil(L.length*(pausa+900)/60000);
  if(!confirm(`Enviar ${L.length} email(s) com o PDF em anexo, a partir da sua conta Office 365?${sem?`\n(${sem} formador(es) sem email ficam de fora.)`:""}${L.length>25?`\n\nO Office 365 só deixa enviar cerca de 30 emails por minuto: demora uns ${min} minuto(s). Deixe esta página aberta; pode parar a meio.`:""}`))return;
  const btn=e.currentTarget;const falhas=[];let n=0;
  try{await msToken()}catch(x){sendMsg(esc(msErro(x)),"bad");return}
  ENVIO_A=true;ENVIO_PARAR=false;btn.textContent="Parar o envio";
  try{for(const t of L){if(ENVIO_PARAR)break;sendMsg(`A enviar ${n+falhas.length+1} de ${L.length}: ${esc(t.p.nome)}…`,"warn");
    try{await enviarFormador(t);n++}catch(x){falhas.push(`${esc(t.p.nome)}: ${esc(msErro(x))}`)}
    await new Promise(ok=>setTimeout(ok,pausa))}}
  finally{ENVIO_A=false}
  const parou=ENVIO_PARAR&&n+falhas.length<L.length;ENVIO_PARAR=false;
  btn.disabled=false;renderMails();if(parou)toast(`Envio parado: ${n} enviado(s), ${L.length-n-falhas.length} por enviar`);
  if(n&&$("#sendReg").checked)registarEnvio("Envio por email com PDF (Office 365)");
  sendMsg(`${n} email(s) enviado(s) com PDF em anexo.${falhas.length?`<br><b>Não enviados (${falhas.length}):</b><br>${falhas.join("<br>")}`:""}`,falhas.length?"warn":"ok")};
$("#mProf").addEventListener("change",renderMails);
$("#gSend").onclick=async e=>{const to=$("#gTo").value.trim();if(!to){toast("Escreva para quem enviar o relatório geral");$("#gTo").focus();return}
  const btn=e.currentTarget;btn.disabled=true;sendMsg("A enviar o relatório geral…","warn");
  try{const doc=await pdfGeral(),txt=geralText().split("\n").slice(0,2).join("\n");
    await msEnviar({to,cc:msCfg().cc,subject:"Relatório de documentação não entregue — "+pdfData(),body:`${txt}\n\nSegue em anexo o relatório completo, em PDF.\n\nCom os melhores cumprimentos,`,anexo:{name:pdfNomeG(),b64:pdfB64(doc)}});
    sendMsg(`Relatório geral enviado para ${esc(to)}, com o PDF em anexo.`)}
  catch(x){sendMsg(esc(msErro(x)),"bad")}finally{btn.disabled=false}};

/* ---------- exportar relatório ---------- */
const profT=id=>byTeacher(evaluate()).find(t=>t.p.id===id);
$("#report").addEventListener("click",e=>{const b=e.target.closest("[data-rpdf]");if(!b)return;const t=profT(b.dataset.rpdf);if(t)baixarPDF(()=>pdfFormador(t),pdfNomeF(t))});
$("#fPdf").onclick=()=>{const id=$("#fProf").value,t=id&&profT(id);if(t&&t.miss)baixarPDF(()=>pdfFormador(t),pdfNomeF(t));else if(t)toast("Este formador não tem nada em falta");else baixarPDF(pdfGeral,pdfNomeG())};
$("#dlCsv").onclick=()=>download(`relatorio_entregas_${hoje()}.csv`,"﻿"+geralCSV(),"text/csv;charset=utf-8");
$("#prRep").onclick=()=>baixarPDF(pdfGeral,pdfNomeG());
$("#gTo").addEventListener("input",e=>{cfg.mail.relatorio_para=e.target.value;save()});
$("#gMail").addEventListener("click",e=>{const to=$("#gTo").value.trim();let body=geralText();
  if(body.length>1800)body=body.slice(0,1800)+"\n\n[…relatório cortado — anexe o ficheiro “Descarregar Excel (CSV)” para a versão completa]";
  e.currentTarget.href=`mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent("Relatório de documentação não entregue — "+new Date().toLocaleDateString("pt-PT"))}&body=${encodeURIComponent(body)}`});
$("#dlCfg").onclick=()=>download(`entregas_config_${hoje()}.json`,JSON.stringify(Object.keys(LOGOS).length?{...cfg,logos:LOGOS}:cfg,null,2),"application/json");

$("#csvToggle").onclick=()=>{const b=$("#csvBody"),open=b.style.display==="none";b.style.display=open?"":"none";$("#csvToggle").setAttribute("aria-expanded",open)};
