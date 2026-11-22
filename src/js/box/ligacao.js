/* ---------- ligação direta à Box (só leitura, token de programador) ---------- */
// ÚNICA porta de acesso à Box: só pedidos GET (leitura). Não há neste código nada que escreva na Box.
// Endereço do serviço de login na Cloudflare. Pode ser escrito aqui (recomendado ao publicar)
// ou indicado na própria página, no separador "Gestão Documental".
const BOXDOC_WORKER="https://boxdoc-login.joel-cunha83.workers.dev";
const workerUrl=()=>{let u=BOXDOC_WORKER;try{u=u||localStorage.getItem("boxdoc_worker")||""}catch(e){}return u.replace(/\/+$/,"")};
// Sessão: {mode:"oauth"|"dev", a: access token, r: refresh token, exp: ms, t: quando foi obtida, dono: conta do Office 365, login: conta da Box}
/* 0.9.50: a ligação à Box nunca se perde —
   · «Terminar sessão» na EPISJ 360 já não desliga a Box (só «Desligar a Box», no Box360, o faz — e pede confirmação);
   · a renovação faz-se uma de cada vez, mesmo com várias janelas abertas (a Box só aceita cada código de renovação uma vez:
     antes, duas janelas a renovar ao mesmo tempo deitavam a sessão fora);
   · uma falha passageira (rede, Box ocupada, serviço de login lento) já não apaga a sessão — volta a tentar mais tarde;
   · a sessão fica também no cofre da EPISJ 360 no Supabase (só a própria conta da Direção a lê): outra janela, outro computador
     ou o iPad continuam com ela, e o Supabase renova-a sozinho todos os dias, para nunca caducar por falta de uso. */
let SES=null;
const BOX_LS="boxdoc_ses";
const euEmailBox=()=>{try{return String(EU&&EU.email||"").toLowerCase()}catch(e){return ""}};
const sesMinha=s=>!!s&&(!s.dono||!euEmailBox()||s.dono===euEmailBox());
function lerSesLocal(){try{const s=JSON.parse(localStorage.getItem(BOX_LS)||"null");return s&&s.mode==="oauth"&&s.r?s:null}catch(e){return null}}
function loadSes(){SES=lerSesLocal();
  if(!SES){try{const t=sessionStorage.getItem("box_tok");if(t)SES={mode:"dev",a:t,exp:Date.now()+3600e3}}catch(e){}}}
// só se apaga a sessão da Box guardada quando o utilizador a desliga (logout); um token de programador não a apaga
function saveSes(){try{if(SES&&SES.mode==="oauth")localStorage.setItem(BOX_LS,JSON.stringify(SES));
  if(SES&&SES.mode==="dev")sessionStorage.setItem("box_tok",SES.a);else sessionStorage.removeItem("box_tok")}catch(e){}}
function sesNova(j,base){return{mode:"oauth",a:j.access_token||j.a,r:j.refresh_token||j.r||(base&&base.r),exp:j.expires_in?Date.now()+(+j.expires_in||3600)*1000-120e3:(+j.exp||Date.now()+3480e3),
  t:j.access_token?Date.now():(+j.t||Date.now()),dono:(base&&base.dono)||euEmailBox(),login:j.login||(base&&base.login)||"",nome:j.nome||(base&&base.nome)||""}}
// regresso do login (o serviço devolve o acesso no fim do endereço, depois de #)
(function(){const h=location.hash;
  // 0.9.145: só aceita a sessão da Box se esta janela foi para o login da Box há menos de 15 min (um link de outra pessoa com «#boxdoc_auth=» deixa de ligar a conta Box dela)
  // a marca vai no sessionStorage verdadeiro do separador (só um número com a hora; apaga-se logo ao voltar), porque a página sai para a Box e volta
  let pend=0;try{const ss=(window.__g360Mem&&window.__g360Mem.real&&window.__g360Mem.real.ss)||sessionStorage;pend=+ss.getItem("box_oauth_pend")||0;ss.removeItem("box_oauth_pend")}catch(e){}
  if(h.startsWith("#boxdoc_auth=")&&!(Date.now()-pend<15*60000)){history.replaceState(null,"",location.pathname+location.search);window.__authErr="A ligação à Box não foi pedida neste separador. Carregue em «Entrar com a Box» para ligar.";window.__goBox=true;loadSes()}
  else if(h.startsWith("#boxdoc_auth=")){try{const p=JSON.parse(atob(decodeURIComponent(h.slice(13))));SES={mode:"oauth",a:p.a,r:p.r,exp:Date.now()+(p.e||3600)*1000-120e3,t:Date.now(),dono:"",login:""};saveSes();localStorage.removeItem("boxdoc_morta")}catch(e){}
    history.replaceState(null,"",location.pathname+location.search);window.__goBox=true;window.__boxNova=true}
  else if(h.startsWith("#boxdoc_erro=")){window.__authErr=decodeURIComponent(h.slice(13));history.replaceState(null,"",location.pathname+location.search);window.__goBox=true}
  else loadSes();})();
// outra janela renovou ou voltou a ligar: esta passa a usar a mesma sessão
window.addEventListener("storage",e=>{if(e.key!==BOX_LS||!e.newValue)return;try{const n=JSON.parse(e.newValue);if(n&&n.mode==="oauth"&&n.r&&sesMinha(n)&&(!SES||SES.mode!=="oauth"||(n.t||0)>=(SES.t||0)))SES=n}catch(x){}});
// uma renovação de cada vez em todas as janelas deste navegador
async function boxTrinco(fn){if(navigator.locks&&navigator.locks.request)return navigator.locks.request("episj360-box-renovar",{mode:"exclusive"},fn);
  for(let i=0;i<60;i++){let l=0;try{l=+localStorage.getItem("boxdoc_trinco")||0}catch(e){}if(Date.now()-l>15000)break;await new Promise(r=>setTimeout(r,250))}
  try{localStorage.setItem("boxdoc_trinco",String(Date.now()))}catch(e){}
  try{return await fn()}finally{try{localStorage.removeItem("boxdoc_trinco")}catch(e){}}}
// cofre da sessão no Supabase (g360_box): só a própria conta, e só a Direção
const boxCofreOk=()=>{try{return !!(SBSES&&SBMEMBRO&&(SBMEMBRO.admin||SBMEMBRO.perfil==="dexec"||SBMEMBRO.perfil==="dped"))}catch(e){return false}};
async function boxCofreLer(){if(!boxCofreOk())return null;try{const c=await sbRpc("g360_box_ler");return c&&c.r?c:null}catch(e){return null}}
async function boxCofreGuardar(x){if(!boxCofreOk()||!x||x.mode!=="oauth"||!x.r)return;
  try{const j=await sbRpc("g360_box_guardar",{p:{a:x.a,r:x.r,exp:x.exp,t:x.t||Date.now(),login:x.login||"",nome:x.nome||""}});
    if(j&&j.ok===false&&j.r&&(+j.t||0)>(x.t||0)&&SES&&SES.r===x.r){SES=sesNova(j,SES);saveSes()}}catch(e){}}
async function boxCofreReclamar(r){if(!boxCofreOk())return{ok:true,sem:true};try{return (await sbRpc("g360_box_reclamar",{p_r:r,p_ms:20000}))||{ok:true}}catch(e){return{ok:true,sem:true}}}
// sem sessão neste navegador: vai buscá-la ao cofre (outro computador ou o iPad)
async function boxRecuperar(){if(SES&&sesMinha(SES))return SES;const l=lerSesLocal();if(l&&sesMinha(l)){SES=l;return SES}
  try{await gpAte(SB_PRONTO,8000)}catch(e){}
  const c=await boxCofreLer();if(c&&!c.morta){SES=sesNova(c,null);saveSes();return SES}return null}
let refreshing=null;
async function accessToken(force){
  if(!SES){const l=lerSesLocal();if(l&&sesMinha(l))SES=l}
  if(!SES)throw new Error("Não está ligado à Box.");
  if(!force&&Date.now()<SES.exp)return SES.a;
  if(SES.mode!=="oauth"){const m="O token de programador expirou. Gere um novo ou use “Entrar com a Box”.";logout(false,m);throw new Error(m)}
  if(!refreshing)refreshing=boxTrinco(()=>boxRenovar(force,false)).finally(()=>{refreshing=null});
  return refreshing;
}
const boxAdotar=(c,base)=>{SES=sesNova(c,base);saveSes();return SES};
async function boxRenovar(force,volta){
  const w=workerUrl();if(!w)throw new Error("Falta o endereço do serviço de login.");
  // 1) outra janela pode já ter renovado
  const l=lerSesLocal();if(l&&sesMinha(l)&&(l.t||0)>(SES.t||0))SES=Object.assign({},l,{dono:SES.dono||l.dono});
  if(!force&&Date.now()<SES.exp)return SES.a;
  // 2) outro computador pode ter uma sessão mais recente no cofre (a renovação diária no Supabase foi desligada na 0.9.70)
  let c=await boxCofreLer();
  if(c&&!c.morta&&c.r!==SES.r&&(+c.t||0)>(SES.t||0)){boxAdotar(c,SES);if(!force&&Date.now()<SES.exp)return SES.a}
  else if(c&&c.r!==SES.r&&(SES.t||0)>(+c.t||0))await boxCofreGuardar(SES); // a deste navegador é mais recente: passa a ser a do cofre
  // 3) só um computador renova de cada vez: os outros esperam e usam o resultado
  for(let i=0;i<10;i++){const k=await boxCofreReclamar(SES.r);if(k.ok)break;
    if(k.r&&k.r!==SES.r){if(!k.morta&&(+k.t||0)>=(SES.t||0)){boxAdotar(k,SES);if(Date.now()<SES.exp)return SES.a;continue}await boxCofreGuardar(SES);continue}
    await new Promise(r=>setTimeout(r,Math.min(4000,Math.max(800,+k.espera||1500))));
    c=await boxCofreLer();if(c&&!c.morta&&c.r!==SES.r&&(+c.t||0)>=(SES.t||0)){boxAdotar(c,SES);if(Date.now()<SES.exp)return SES.a}}
  // 4) renovar
  let r;buConta("me");try{r=await fetch(w+"/refresh",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({refresh_token:SES.r})})}
  catch(e){const x=new Error("Não foi possível contactar o serviço de login da Box — a ligação mantém-se e volto a tentar sozinho.");x.kind="net";throw x}
  const j=await r.json().catch(()=>({}));
  if(r.ok&&j.access_token){SES=sesNova(j,SES);saveSes();boxCofreGuardar(SES);try{localStorage.removeItem("boxdoc_morta")}catch(e){}return SES.a}
  const txt=JSON.stringify(j||{}),definitivo=r.status===400||r.status===401||/invalid_grant|invalid_token|expired|revoked|refresh token/i.test(txt);
  if(!definitivo){const x=new Error("A Box não respondeu agora ("+r.status+") — a ligação mantém-se e volto a tentar sozinho.");x.kind="net";throw x}
  // 5) o código foi recusado: pode haver um mais recente noutra janela ou no cofre
  if(!volta){const l2=lerSesLocal(),c2=await boxCofreLer(),alt=[l2,c2].filter(x=>x&&x.r&&x.r!==SES.r&&!x.morta&&sesMinha(x)).sort((p,q)=>(+q.t||0)-(+p.t||0))[0];
    if(alt){boxAdotar(alt,SES);if(Date.now()<SES.exp)return SES.a;return boxRenovar(true,true)}}
  // 0.9.70: um código recusado nunca volta a ser enviado à Box (cada código só serve uma vez); pede-se nova entrada, só com um clique
  boxSessaoMorta(j.erro||j.error_description||j.error||("a Box respondeu "+r.status));
  const x=new Error("A Box pediu para voltar a ligar a conta (a autorização foi retirada ou caducou). Carregue em «Entrar com a Box».");x.kind="auth";throw x;
}
// a Box recusou mesmo o acesso: fica registado de quem era, para voltar a ligar com um clique (sem revogar nada)
function boxSessaoMorta(msg){const old=SES;
  try{localStorage.setItem("boxdoc_morta",JSON.stringify({dono:old&&old.dono||"",login:old&&old.login||"",quando:Date.now(),msg:String(msg||"")}))}catch(e){}
  try{if(old&&old.r&&boxCofreOk())sbRpc("g360_box_morta",{p_r:old.r,p_erro:String(msg||"").slice(0,300)}).catch(()=>{})}catch(e){}
  SES=null;try{localStorage.removeItem(BOX_LS)}catch(e){}bgRun++;
  try{$("#boxBrowse").style.display="none";$("#tokOut").style.display="none";$("#loginBox").style.display="";$("#devTok").style.display="";$("#boxAuth").innerHTML="";loginUI();
    boxEstado("login","A Box pediu para voltar a ligar a conta"+(old&&old.login?" "+old.login:"")+". Carregue em «Entrar com a Box» para continuar.")}catch(e){}}
// ÚNICA porta de acesso aos ficheiros da Box: só pedidos GET (leitura). Não há neste código nada que escreva na Box.
// ritmo (0.9.70, regras da Box): a Box aceita cerca de 1000 pedidos por minuto por utilizador. A app fica muito abaixo:
// 0.9.86: no máximo 6 pedidos por segundo (~360/min, cerca de um terço do limite), nunca mais de 8 — sobra margem para
// dois computadores e o iPad ao mesmo tempo com a mesma conta. Só uma janela de cada vez lê as pastas (trinco entre
// separadores, «episj360-box-leitura»). Quando a Box pede para abrandar (HTTP 429) espera o tempo que ela indica
// (Retry-After) e baixa o ritmo antes de voltar.
/* 0.9.113: CONTADOR DOS PEDIDOS À BOX (api.box.com), por mês e por tipo, somado em todos os computadores (peça «BU» na nuvem).
   A Box conta os pedidos de cada mês e o plano da escola tem 10 000. Com 80% gastos, as leituras automáticas param sozinhas
   (análises e leituras pedidas à mão continuam, com aviso). As descargas dos servidores de conteúdo (boxcloud.com) contam-se à parte. */
var BU_ORC=10000,BU_TRAVAO=0.8;
var BU_TIPOS={lst:"Abrir pastas",ev:"Registo de alterações",tx:"Texto dos documentos",me:"Ligação e sessão",av:"Serviço de avisos",ou:"Outros"};
function buMes(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")}
var BU_DEV=(function(){try{var v=localStorage.getItem("g360_dev");if(!v){v=Math.random().toString(36).slice(2,10);localStorage.setItem("g360_dev",v)}return v}catch(e){return"x"}})();
var BU=(function(){try{var b=JSON.parse(localStorage.getItem("g360_bu")||"null");if(b&&b.mes===buMes()&&b.dev)return b}catch(e){}return{mes:buMes(),dev:{}}})();
var BU_H=0,BU_NH=0,BU_NT=0;
function buMeu(){if(BU.mes!==buMes())BU={mes:buMes(),dev:{}};var d=BU.dev[BU_DEV];if(!d)d=BU.dev[BU_DEV]={t:0,c:{}};return d}
function buConta(tipo,n){var d=buMeu();d.c[tipo]=(d.c[tipo]||0)+(n||1);d.t=Date.now();clearTimeout(BU_H);BU_H=setTimeout(buGuardar,2000)}
function buGuardar(){try{localStorage.setItem("g360_bu",JSON.stringify(BU))}catch(e){}buUI();
  var falta=10*60e3-(Date.now()-BU_NT);if(falta<=0){BU_NT=Date.now();buNuvem()}else if(!BU_NH)BU_NH=setTimeout(function(){BU_NH=0;BU_NT=Date.now();buNuvem()},falta)}
function buNuvem(){try{if(NUVOK()&&!nuvDesl())nuvemPut("BU",BU)}catch(e){}}
function buSoma(x){var s=0,c=(x&&x.c)||{};for(var t in c)if(t!=="dl")s+=c[t];return s}
function buJuntar(b){if(!b||!b.dev||b.mes!==buMes())return false;if(BU.mes!==b.mes)BU={mes:b.mes,dev:{}};var m=false;
  for(var k in b.dev)if(buSoma(b.dev[k])>buSoma(BU.dev[k])){BU.dev[k]=b.dev[k];m=true}
  if(m){try{localStorage.setItem("g360_bu",JSON.stringify(BU))}catch(e){}buUI()}return m}
function buTotal(){if(BU.mes!==buMes())return 0;var s=0;for(var k in BU.dev)s+=buSoma(BU.dev[k]);return s}
function buPorTipo(){var o={};if(BU.mes!==buMes())return o;for(var k in BU.dev){var c=BU.dev[k].c||{};for(var t in c)o[t]=(o[t]||0)+c[t]}return o}
function buTravado(){return buTotal()>=BU_ORC*BU_TRAVAO}
function buN(n){return Number(n||0).toLocaleString("pt-PT")}
function buUI(){var el=document.getElementById("buBody");if(!el||!BU||!BU_TIPOS)return;var tot=buTotal(),pc=Math.round(tot/BU_ORC*100),T=buPorTipo(),trav=buTravado();
  var mes=new Date().toLocaleDateString("pt-PT",{month:"long"});
  var linhas=Object.keys(BU_TIPOS).filter(function(k){return T[k]}).map(function(k){return"<tr><td>"+BU_TIPOS[k]+"</td><td class=\"num\">"+buN(T[k])+"</td></tr>"}).join("");
  el.innerHTML='<div class="bu-num"><b>'+buN(tot)+'</b> de '+buN(BU_ORC)+' pedidos em '+mes+(pc?' <span class="hint" style="margin:0">('+pc+'%)</span>':'')+'</div>'
    +'<div class="bu-bar"><i style="width:'+Math.min(100,Math.max(tot?1:0,pc))+'%"'+(trav?' class="bad"':'')+'></i><b style="left:'+(BU_TRAVAO*100)+'%" title="Aos '+(BU_TRAVAO*100)+'% as leituras automáticas param"></b></div>'
    +(trav?'<div class="msg bad" style="margin-top:10px">Já se gastaram '+Math.round(BU_TRAVAO*100)+'% dos pedidos do mês: as leituras automáticas (alterações ao entrar e texto dos documentos) estão paradas até ao dia 1. As análises que pedir continuam a funcionar.</div>':'')
    +(linhas?'<table class="rt bu-tab"><tbody>'+linhas+'</tbody></table>':'')
    +(T.dl?'<p class="hint" style="margin:8px 0 0">Mais '+buN(T.dl)+' descargas de texto dos servidores de conteúdo da Box (contadas à parte).</p>':'')}
setTimeout(function(){try{buUI()}catch(e){}},0);
const RPS_TETO=8;
const RPS0=Math.min(RPS_TETO,+lsJ("boxcheck_rps",0)||6);
const RATE={rps:RPS0,max:RPS0,min:2,ok:0,hits:0,pauseUntil:0,next:0,cut:0};
// pedidos aos servidores de conteúdo da Box (texto dos documentos): ritmo próprio, mais lento, para não parecer descarga em massa
const RATE_CONT={next:0,int:700};
async function vezConteudo(){for(;;){const now=Date.now(),t=Math.max(RATE_CONT.next,now,RATE.pauseUntil);RATE_CONT.next=t+RATE_CONT.int;if(t>now)await sleep(t-now);if(Date.now()>=RATE.pauseUntil)return}}
const esperaBox=r=>{const v=+r.headers.get("Retry-After");return (v>0?v:10)*1000};
const sleep=ms=>new Promise(s=>setTimeout(s,ms));
// 0.9.86: cada pedido tem a sua vez, também depois de uma pausa pedida pela Box (antes, os pedidos que esperavam a pausa
// saíam todos juntos no fim dela — rajadas de 10 a 13 por segundo)
async function vez(){for(;;){const now=Date.now(),t=Math.max(RATE.next,now,RATE.pauseUntil);RATE.next=t+1000/RATE.rps;
  if(t>now)await sleep(t-now);if(Date.now()>=RATE.pauseUntil)return}}
function travar(ms){RATE.hits++;RATE.ok=0;const now=Date.now();if(now-RATE.cut>2500){RATE.rps=Math.max(RATE.min,RATE.rps*0.75);RATE.cut=now}RATE.pauseUntil=Math.max(RATE.pauseUntil,now+ms)}
function boxHdr(tok,hdr){const H={Authorization:"Bearer "+tok};if(hdr)for(const k in hdr)if(!k.startsWith("__"))H[k]=hdr[k];return H}
async function boxGet(path,params,hdr){
  const url="https://api.box.com/2.0/"+path+(params?"?"+new URLSearchParams(params):"");
  const tipo=path.startsWith("folders/")?"lst":path.startsWith("events")?"ev":path.startsWith("users/me")?"me":"ou";
  let renewed=false;
  for(let t=0;t<12;t++){
    await vez();
    const tok=await accessToken();
    let r;buConta(tipo);
    try{r=await fetch(url,{method:"GET",headers:boxHdr(tok,hdr)})}
    catch(e){ // a Box, quando recusa pedidos a mais, às vezes responde sem as autorizações do navegador: parece uma falha de rede
      travar(1200*(t+1));
      if(t<5)continue;
      const er=new Error("O navegador não conseguiu falar com a Box. Se acontecer logo ao entrar, confirme que o endereço deste site ("+location.origin+") está em “CORS Domains” na sua aplicação da Box.");er.kind="net";throw er}
    if(r.ok){if(++RATE.ok>=200&&RATE.rps<RATE.max){RATE.rps=Math.min(RATE.max,RATE.rps+1);RATE.ok=0}return r.json()}
    if(r.status===429){travar(esperaBox(r));continue}
    if(r.status===401){if(!renewed&&SES&&SES.mode==="oauth"){renewed=true;await accessToken(true);continue}
      if(SES&&SES.mode==="oauth")boxSessaoMorta("a Box recusou o acesso (401)");else logout(false,"O acesso à Box expirou. Volte a entrar.");const er=new Error("O acesso à Box expirou. Volte a entrar.");er.kind="auth";throw er}
    if(r.status>=500){await sleep(Math.min(20,0.5*2**t)*1000);continue}
    if(r.status===400&&hdr&&hdr.__rep){const er=new Error("rep");er.kind="rep";throw er} // 0.9.113: a Box não aceitou as representações na listagem
    const er=new Error("A Box respondeu "+r.status+(r.status===403?" (sem permissão para esta pasta)":"")+".");er.kind="http";er.status=r.status;throw er;
  }
  const er=new Error("A Box está a limitar os pedidos. Tente daqui a pouco.");er.kind="net";throw er;
}
/* 0.9.113: a listagem das pastas pede também a representação «extracted_text» de cada ficheiro (o endereço do texto que a Box
   já extraiu). Assim, ler o texto de um documento novo deixa de precisar de um pedido à API. Se a Box não aceitar, desliga-se
   sozinho (fica registado neste navegador) e tudo funciona como antes. Os endereços ficam só em memória (REP). */
var REP=new Map(),REP_OFF=(function(){try{return localStorage.getItem("g360_rep_off")==="1"}catch(e){return false}})();
function repGuardar(list){for(const x of list){if(x.type!=="file"||!x.representations)continue;
  const r=(x.representations.entries||[]).find(e=>e.representation==="extracted_text");if(!r||!r.content||!r.content.url_template)continue;
  const st=r.status&&r.status.state;REP.set(String(x.id),{url:r.content.url_template.replace("{+asset_path}",""),ok:st==="success"||st==="viewable",info:r.info&&r.info.url,st,sha1:x.sha1||""});
  delete x.representations}}
async function listFolder(id){
  let out=[],marker=null;
  for(;;){const comRep=!REP_OFF,p={fields:"id,type,name,created_at,modified_at,content_modified_at,size,sha1,created_by,modified_by"+(comRep?",representations":""),limit:1000,usemarker:"true"};if(marker)p.marker=marker;
    let j;try{j=await boxGet(`folders/${id}/items`,p,comRep?{"x-rep-hints":"[extracted_text]",__rep:1}:null)}
    catch(e){if(e.kind!=="rep")throw e;REP_OFF=true;try{localStorage.setItem("g360_rep_off","1")}catch(x){}continue}
    const L=j.entries||[];if(comRep)repGuardar(L);out=out.concat(L);marker=j.next_marker||null;if(!marker)break}
  return out;
}
let curFolder={id:"0",path:[{id:"0",name:"Todos os ficheiros"}]};
try{const s=JSON.parse(localStorage.getItem("box_last_folder")||"null");if(s&&s.id)curFolder=s}catch(e){}
function loginUI(){
  const w=workerUrl();
  $("#wkSet").style.display=w?"none":"block";$("#oaGo").disabled=!w;
  if(!BOXDOC_WORKER&&w)$("#wkUrl").value=w;
}
$("#oaGo").onclick=()=>{const w=workerUrl();if(!w){loginUI();return}try{((window.__g360Mem&&window.__g360Mem.real&&window.__g360Mem.real.ss)||sessionStorage).setItem("box_oauth_pend",String(Date.now()))}catch(e){}location.href=w+"/login"};
$("#wkSave").onclick=()=>{let v=$("#wkUrl").value.trim();if(!/^https:\/\//.test(v)){toast("O endereço tem de começar por https://");return}
  try{localStorage.setItem("boxdoc_worker",v.replace(/\/+$/,""))}catch(e){}loginUI();toast("Guardado")};
async function tokGo(){
  const v=$("#tok").value.trim();if(!v){toast("Cole o token");return}
  SES={mode:"dev",a:v,exp:Date.now()+3600e3};boxEstado("wait");
  try{const me=await boxGet("users/me",{fields:"name,login"});saveSes();connected(me)}
  catch(e){SES=null;boxEstado("login",e.message)}
}
function boxEstado(st,msg){$("#boxWait").style.display=st==="wait"?"block":"none";$("#loginBox").style.display=st==="off"?"none":"";
  ["#oaGo","#tokGo"].forEach(x=>$(x).disabled=st==="wait");if(msg)$("#boxAuth").innerHTML=`<div class="msg bad">${esc(msg)}</div>`}
function boxEuGuardado(){try{return SES&&SES.mode==="oauth"&&SES.login&&SES.nome?{name:SES.nome,login:SES.login}:null}catch(e){return null}}
function boxArrancar(){loginUI();
  if(SES&&boxEuGuardado()){boxEstado("wait");Promise.resolve(boxEuGuardado()).then(connected).catch(e=>boxEstado("login",e.message));return}
  if(SES){boxEstado("wait");boxGet("users/me",{fields:"name,login"}).then(connected).catch(e=>boxEstado("login",e.message))}
  else boxEstado("login",window.__authErr||"")}
/* EPISJ 360 0.9.13 — barra de progresso 0–100% enquanto os módulos carregam */
const GP={alvo:0,v:0,raf:0,mods:{}};
const GP_MODS=MODULOS.map(m=>[m.id,m.nome]); // 0.9.87: todos os módulos aparecem no ecrã de entrada (os novos entram sozinhos, pela lista MODULOS)
const GP_EST={wait:"",ok:"",erro:"com erro",off:"por ligar",bg:"em fundo"};
function gpDesenhar(){const d=GP.alvo-GP.v;GP.v=Math.abs(d)<.3?GP.alvo:GP.v+d*.14;const p=Math.round(GP.v);
  $("#gpFill").style.width=GP.v+"%";$("#gpPct").textContent=p+"%";$("#gpBar").setAttribute("aria-valuenow",p);
  GP.raf=GP.v!==GP.alvo?requestAnimationFrame(gpDesenhar):0}
function prog(p,txt){if(txt)$("#gateWaitTxt").textContent=txt;GP.alvo=Math.max(GP.alvo,Math.min(100,p));if(!GP.raf)GP.raf=requestAnimationFrame(gpDesenhar)}
function gpPasso(p,txt){if(!$("#gate").classList.contains("off"))prog(p,txt)} // só mexe na barra enquanto o ecrã de entrada está visível
/* 0.9.141: no ecrã de entrada os módulos já não aparecem todos de uma vez: passa um de cada vez, a aparecer e a desaparecer
   (o que está a carregar e o que acabou de ficar pronto); os que dão erro ficam à vista por baixo */
function progMod(id,st){const ant=GP.mods[id];if(st)GP.mods[id]=st;else delete GP.mods[id];
  GP.fila=GP.fila||[];if(st&&st!==ant&&st!=="wait")GP.fila.push(id);gpTick(true)}
function gpTickHTML(m){const n=(GP_MODS.find(x=>x[0]===m)||[m,m])[1],e=GP.mods[m]||"wait";
  return `<span class="gpt ${e}"><span class="ic">${e==="ok"?"✓":e==="erro"?"!":e==="wait"?'<span class="spin"></span>':"–"}</span><b>${esc(n)}</b><em>${e==="ok"?"pronto":e==="wait"?"a carregar…":GP_EST[e]||""}</em></span>`}
function gpTick(novo){const el=document.getElementById("gpMods");if(!el)return;const ids=GP_MODS.map(x=>x[0]).filter(m=>GP.mods[m]);
  const ok=ids.filter(m=>GP.mods[m]==="ok").length,er=ids.filter(m=>GP.mods[m]==="erro");
  if(!el.firstChild)el.innerHTML=`<div class="gptl"></div><div class="gptn"></div><div class="gpte"></div>`;
  el.querySelector(".gptn").textContent=ids.length?`${ok} de ${ids.length} módulos prontos`:"";
  el.querySelector(".gpte").innerHTML=er.map(gpTickHTML).join("");
  if(novo&&GP.tickT)return; // já está a passar: a fila é vista na próxima volta
  const prox=()=>{let m=null;while(GP.fila&&GP.fila.length&&!m){const x=GP.fila.shift();if(GP.mods[x]&&GP.mods[x]!=="erro")m=x}
    if(!m){const w=ids.filter(x=>GP.mods[x]==="wait");if(w.length){GP.rod=((GP.rod||0)+1)%w.length;m=w[GP.rod]}}return m};
  const m=prox(),L=el.querySelector(".gptl");if(!m){GP.tickT=0;return}
  if(L.dataset.m===m&&L.innerHTML){L.innerHTML=gpTickHTML(m)}
  else{L.classList.add("fora");setTimeout(()=>{L.dataset.m=m;L.innerHTML=gpTickHTML(m);L.classList.remove("fora")},220)}
  clearTimeout(GP.tickT);GP.tickT=setTimeout(()=>{GP.tickT=0;if(!document.getElementById("gate").classList.contains("off"))gpTick()},1300)}
const gpAte=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(Object.assign(new Error("demorou demasiado"),{tempo:true})),ms))]);
const gpEspera=ms=>new Promise(r=>setTimeout(r,ms));
function gateState(st,msg,txt){if(txt)$("#gateWaitTxt").textContent=txt;
  $("#gate").classList.toggle("off",st==="off");
  $("#gateWait").style.display=st==="wait"?"flex":"none";
  $("#gateLogin").style.display=st==="login"?"":"none";
  $("#gateMsg").innerHTML=msg?`<div class="msg bad" style="text-align:left">${esc(msg)}</div>`:"";
}
function connected(me){
  try{if(SES&&SES.mode==="oauth"){const em=euEmailBox();if(em&&!SES.dono)SES.dono=em;if(me&&me.login)SES.login=me.login;if(me&&me.name)SES.nome=me.name;if(!SES.t)SES.t=Date.now();saveSes();boxCofreGuardar(SES);window.__boxNova=false;
    if(Date.now()-(SES.t||0)>3*864e5)setTimeout(()=>accessToken(true).catch(()=>{}),6000)}}catch(e){} // 0.9.50
  boxEstado("off");if(RO&&!soLeitura())sairSoLeitura();
  if(!window.__guideLogin)window.__guideLogin=String(me.login||"").toLowerCase();
  $("#tokOut").style.display="";
  $("#boxAuth").innerHTML=`<div class="msg ok">Ligado à Box como <b>${esc(me.name)}</b> (${esc(me.login)})${SES.mode==="oauth"?" — a sessão renova-se automaticamente.":" com token de programador (válido 60 minutos)."}</div>`;
  $("#tok").value="";$("#loginBox").style.display="none";$("#devTok").style.display="none";
  $("#boxBrowse").style.display="block";
  // ao entrar: procura sozinha o que mudou desde a última análise (poucos pedidos) e continua a leitura dos documentos
  nuvemUI();
  // 0.9.152: cada passo tem um limite de tempo — se um não responder, a entrada continua (o passo acaba em segundo plano)
  const passo=(f,ms,nm)=>()=>gpAte(Promise.resolve().then(f),ms).catch(e=>{console.warn("entrada: "+nm,e&&e.message||e)});
  // 0.9.154: a entrada só espera pelo essencial (configuração, prazos, reservas, escola e horários); as análises das pastas e os textos
  // dos documentos chegam a seguir, em segundo plano (a app já está aberta e atualiza-se sozinha quando chegam)
  const sinc=pronto.then(()=>gpPasso(80,"Box360: a trazer formadores e atribuições…")).then(passo(()=>nuvemTrazer(true),20000,"configuração"))
    .then(()=>gpPasso(85,"Box360: a trazer prazos e avisos…")).then(passo(avTrazerNuvem,15000,"prazos"))
    .then(()=>gpPasso(89,"Sala360: a trazer as reservas…")).then(passo(()=>rcTrazer(false),15000,"reservas"))
    .then(()=>gpPasso(94,"A sincronizar a Escola e o Horários360…")).then(passo(esTrazerNuvem,20000,"escola"));
  const analises=sinc.then(()=>nuvemTrazer()).catch(e=>console.warn("análises",e));
  // 0.9.113: a atualização automática ao entrar só corre se a análise (feita aqui ou noutro computador) tiver mais de 30 minutos
  analises.then(()=>{guidePubAgendar();return browse(curFolder.id,curFolder.path)}).then(()=>{if(lastListing&&lastListing.rootId===curFolder.id&&Date.now()-(lastListing.t||0)>30*60e3)runScan(false,true);else verificarFundo()});
  return sinc; // 0.9.13: o arranque espera por isto para chegar aos 100%
}
function logout(revoke,msg){
  const old=SES;SES=null;try{sessionStorage.removeItem("box_tok");if(revoke||(old&&old.mode==="oauth"))localStorage.removeItem(BOX_LS)}catch(e){}bgRun++;
  if(revoke)try{if(boxCofreOk())sbRpc("g360_box_esquecer").catch(()=>{})}catch(e){}
  if(revoke&&old&&old.mode==="oauth"&&workerUrl())fetch(workerUrl()+"/logout",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:old.r||old.a})}).catch(()=>{});
  $("#boxBrowse").style.display="none";$("#tokOut").style.display="none";$("#loginBox").style.display="";$("#devTok").style.display="";$("#boxAuth").innerHTML="";loginUI();
  boxEstado("login",msg||"");
}
$("#tokGo").onclick=tokGo;$("#tok").addEventListener("keydown",e=>{if(e.key==="Enter")tokGo()});
$("#tokOut").onclick=()=>{if(confirm("Desligar a Box?\n\nA EPISJ 360 deixa de ler a Box com esta conta em todos os computadores e no iPad, até voltar a carregar em «Entrar com a Box».\n(Para sair da EPISJ 360 use «Terminar sessão», em cima — a Box fica ligada.)"))logout(true)};
// 0.9.113: as subpastas vêm da análise guardada quando ela as conhece (pastas lidas e não excluídas); só se não, pergunta à Box.
// O que já foi pedido à Box nesta sessão também fica guardado (voltar atrás nas pastas não gasta pedidos).
var BROWSE_C=new Map();
function pastasConhecidas(id){id=String(id);if(BROWSE_C.has(id))return BROWSE_C.get(id);const L=lastListing;if(!L||!Array.isArray(L.itens))return null;
  const fo=new Map();for(const x of L.itens)if(x.type==="folder")fo.set(String(x.id),x);
  if(id!==String(L.rootId)){let c=fo.get(id),X=EXC();if(!c)return null;for(let g=0;c&&g<80;g++){if(X.has(String(c.id)))return null;c=fo.get(String(c.pid))}}
  return L.itens.filter(x=>x.type==="folder"&&String(x.pid)===id).map(x=>({type:"folder",id:String(x.id),name:x.path.split("/").pop()}))}
async function browse(id,path,forcar){
  $("#subfolders").innerHTML='<div class="sk"></div><div class="sk"></div><div class="sk"></div>';
  try{let it=forcar?null:pastasConhecidas(id);if(!it){it=await listFolder(id);BROWSE_C.set(String(id),it.filter(x=>x.type==="folder").map(x=>({type:"folder",id:String(x.id),name:x.name})))}
    curFolder={id,path};
    $("#crumbs").innerHTML=path.map((p,i)=>`${i?"<span>›</span>":""}<a href="#" data-ci="${i}">${esc(p.name)}</a>`).join("");
    const pastas=it.filter(x=>x.type==="folder").sort((a,b)=>COLL_PTN.compare(a.name,b.name));
    const pref=path.slice(1).map(p=>p.name).join("/"),X=cfg.excluir||{};
    $("#subfolders").innerHTML=pastas.map(f=>{const off=!!X[f.id];return`<span class="chip${off?" off":""}" data-fid="${f.id}" data-nm="${esc(f.name)}"><svg viewBox="0 0 24 24"><path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.2h8.4A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" fill="#6aa0f0"/></svg><span class="nm">${esc(f.name)}</span>${off?`<span class="xt">excluída da análise</span>`:""}<button class="exb${off?" inc":""}" data-x="${f.id}" data-p="${esc((pref?pref+"/":"")+f.name)}" title="${off?"Voltar a incluir na análise":"Excluir esta pasta (e subpastas) da análise"}">${off?"+":"−"}</button></span>`}).join("")||`<span class="hint">Sem subpastas.</span>`;
    renderExc();
    $("#scanBtn").textContent=`Analisar “${path[path.length-1].name}” e subpastas`;scanHint();
  }catch(e){$("#subfolders").innerHTML=`<div class="msg bad">${esc(e.message)}</div>`}
}
$("#crumbs").addEventListener("click",e=>{const a=e.target.closest("[data-ci]");if(!a)return;e.preventDefault();const p=curFolder.path.slice(0,+a.dataset.ci+1);browse(p[p.length-1].id,p)});
// excluir pastas da análise: não são abertas nas leituras e o seu conteúdo não entra no relatório
const EXC=()=>new Set(Object.keys(cfg.excluir||{}));
const dentro=(path,P)=>path===P||path.startsWith(P+"/");
function semExcluidas(j){const X=Object.values(cfg.excluir||{});if(!X.length)return j;
  return{...j,itens:j.itens.filter(x=>!X.some(e=>dentro(x.type==="folder"?x.path:x.path,e.path)&&!(x.type==="folder"&&x.path===e.path)))}}
// 0.9.95: só mostra as exclusões da pasta que está aberta (ou das pastas acima dela); as de outras pastas
// (ex.: DTP 2025.2026 quando se está em DTP 2026.2027) não contam para esta análise e ficam recolhidas à parte
function renderExc(){const X=cfg.excluir||{},k=Object.keys(X);
  const pref=curFolder&&Array.isArray(curFolder.path)?curFolder.path.slice(1).map(p=>p.name).join("/"):"";
  const aqui=k.filter(id=>!pref||dentro(X[id].path,pref)||dentro(pref,X[id].path)),fora=k.filter(id=>!aqui.includes(id));
  const chip=id=>`<span class="chip">${esc(X[id].path)} <button class="exb inc" data-x="${id}" data-p="${esc(X[id].path)}" title="Voltar a incluir">+</button></span>`;
  let h="";
  if(aqui.length)h+=`<div class="hint" style="margin:0 0 4px">Pastas excluídas da análise (${aqui.length}):</div><div class="chips">${aqui.map(chip).join("")}</div>`;
  if(fora.length)h+=`<details class="excfora"${aqui.length?"":" data-so"}><summary>${fora.length} pasta${fora.length===1?"":"s"} excluída${fora.length===1?"":"s"} noutras pastas — não ${fora.length===1?"conta":"contam"} para «${esc(pref.split("/").pop()||"esta pasta")}»</summary><div class="chips">${fora.map(chip).join("")}</div></details>`;
  const el=$("#excList");el.innerHTML=h;el.classList.toggle("so-fora",!aqui.length&&!!fora.length)}
async function alternarExc(id,P){cfg.excluir=cfg.excluir||{};const on=!cfg.excluir[id];
  if(on)cfg.excluir[id]={path:P,nome:P.split("/").pop(),t:Date.now()};else delete cfg.excluir[id];
  save();browse(curFolder.id,curFolder.path);
  if(lastListing){useListing(lastListing,true);showLast()}
  toast(on?`“${P.split("/").pop()}” excluída da análise (pode voltar a incluir com +)`:`“${P.split("/").pop()}” incluída outra vez`);
  if(on||!lastListing||!dentro(P,lastListing.pasta)||P===lastListing.pasta)return;
  // voltou a incluir: se esta pasta nunca foi lida, lê-a agora (só ela e as subpastas)
  if(lastListing.itens.some(x=>x.path.startsWith(P+"/")))return;
  if(scanBusy){toast("Quando a análise terminar, faça “Leitura completa” para ler esta pasta");return}
  scanBusy=true;const run=++scanRun,st={nP:0,nF:0,opened:0,retries:0,failed:[],t0:Date.now(),modo:"a ler a pasta incluída"};
  $("#scanProg").style.display="block";
  try{const itens=[];await crawl(run,[{id,path:P}],itens,st);const j=lastListing;
    const ids=new Set(j.itens.map(x=>x.type+x.id));for(const x of itens)if(!ids.has(x.type+x.id))j.itens.push(x);
    j.nP=j.itens.filter(x=>x.type==="folder").length;j.nF=j.itens.length-j.nP;
    await guardarListagem(j);nuvemListagem(j);scanRun++;useListing(j,true);showLast();
    $("#scanMsg").textContent=`Lida a pasta “${P.split("/").pop()}”: ${st.nP} pastas, ${st.nF} ficheiros.`;verificarFundo()}
  catch(e){scanRun++;$("#scanMsg").textContent="Erro ao ler a pasta incluída: "+e.message}
  finally{scanBusy=false;$("#scanProg").style.display="none"}}
$("#excList").addEventListener("click",e=>{const b=e.target.closest(".exb");if(b)alternarExc(b.dataset.x,b.dataset.p)});
$("#subfolders").addEventListener("click",e=>{const x=e.target.closest(".exb");if(x){e.stopPropagation();alternarExc(x.dataset.x,x.dataset.p);return}const c=e.target.closest("[data-fid]");if(!c)return;browse(c.dataset.fid,[...curFolder.path,{id:c.dataset.fid,name:c.dataset.nm}])});
let lastListing=null;
// carrega uma listagem da Box (da análise ou guardada) para o relatório
function useListing(j,quiet){
  lastListing=j;const t=toFF(semExcluidas(j));files=t.fs;folders=t.fo;rawRows=null;$("#colPick").style.display="none";
  dadosMudaram();
  if(!quiet)boxMsg(`${files.length} ficheiros e ${folders.length} pastas de “${j.pasta}” (${j.quando}).`,"ok");
  $("#dlList").style.display="";qualInit();
}
/* ---------- leitura da Box: completa (uma vez) ou só o que mudou ---------- */
let scanRun=0,scanBusy=false;
const pool=async(items,fn,n)=>{let i=0;await Promise.all(Array.from({length:Math.min(n,items.length)},async()=>{while(i<items.length){const x=items[i++];await fn(x)}}))};
const fileItem=(x,path,pid)=>({path,name:x.name,type:"file",modified_at:x.modified_at||"",cm:x.content_modified_at||"",ca:x.created_at||"",id:x.id,pid,size:x.size,sha1:x.sha1||"",by:byOf(x),cb:cbOf(x)});
function progress(run,st,pending){if(run!==scanRun||st.stop)return;
  const sec=(Date.now()-st.t0)/1000,o=st.opened,mm=Math.floor(sec/60),ss=String(Math.floor(sec%60)).padStart(2,"0"),rate=(o-(st.o0||0))/Math.max(sec,1);
  const falta=pending>0&&sec>8&&rate>0?Math.ceil(pending/rate/60):0;
  $("#scanMsg").textContent=`${mm}:${ss} · ${st.modo} · abertas ${o} de ${o+pending} pastas · ${st.nF} ficheiros · ${sec>3?rate.toFixed(1):"…"} pastas/s${falta?` · falta pelo menos ${falta} min`:""}${RATE.hits?` · ${RATE.hits} pausa(s) pedidas pela Box`:""}${RATE.pauseUntil>Date.now()?" · em pausa":""}${st.retries?` · ${st.retries} repetição(ões)`:""}`;
  $("#scanProg i").style.width=Math.max(3,Math.min(99,Math.round(o/(o+pending||1)*100)))+"%";}
// percorre pastas e subpastas a partir de "starts". Erros temporários são repetidos; com "ck" o progresso fica guardado
// de 8 em 8 segundos, para a leitura poder continuar de onde ficou se a página for fechada ou a ligação cair.
async function crawl(run,starts,itens,st,ck){
  const queue=starts.slice(),tries=new Map(),infl=new Map();let active=0,lastCk=Date.now(),saving=false;
  const checkpoint=()=>{if(!ck||saving||Date.now()-lastCk<8000)return;lastCk=Date.now();saving=true;
    DB.put("kv",ck.key,{t:Date.now(),rootId:ck.rootId,root:ck.root,pos:ck.pos,opened:st.opened,itens:itens.slice(),queue:[...queue,...infl.values()]}).finally(()=>{saving=false})};
  await new Promise(resolve=>{
    const pump=()=>{
      if(st.fatal||st.stop){if(!active)resolve();return}
      if(!queue.length&&!active){resolve();return}
      while(active<8&&queue.length){const f=queue.shift();active++;infl.set(f.id,f);
        listFolder(f.id).then(list=>{st.opened++;for(const x of list){
            if(x.type==="folder"){const p=f.path+"/"+x.name;itens.push({path:p,name:"",type:"folder",id:x.id,pid:f.id});if(!EXC().has(x.id))queue.push({id:x.id,path:p});st.nP++}
            else if(x.type==="file"){itens.push(fileItem(x,f.path,f.id));st.nF++}}})
        .catch(e=>{
          if(e.kind==="auth"){st.fatal=e;return}
          if(e.kind==="http"&&(e.status===403||e.status===404)){st.failed.push(f.path);st.opened++;return}
          const n=(tries.get(f.id)||0)+1;tries.set(f.id,n);st.retries++;
          if(n<=8){travar(800*n);queue.push(f)}else{st.failed.push(f.path);st.opened++}})
        .finally(()=>{active--;infl.delete(f.id);progress(run,st,queue.length+active);checkpoint();pump()})}
    };pump();});
  if(st.fatal)throw st.fatal;
  if(st.stop){if(ck)await DB.put("kv",ck.key,{t:Date.now(),rootId:ck.rootId,root:ck.root,pos:ck.pos,opened:st.opened,itens:itens.slice(),queue:queue.slice()});
    const er=new Error("parada");er.kind="stop";er.full=!!ck;throw er}
}
async function streamNow(){try{return (await boxGet("events",{stream_position:"now"})).next_stream_position||null}catch(e){return null}}
async function fullScan(run,rootId,root,st,fresh){
  const key="scan|"+rootId;let part=fresh?null:await DB.get("kv",key);
  if(part&&(Date.now()-part.t>48*3600e3||!part.queue||!part.queue.length||!part.itens))part=null;
  let itens,starts,pos;
  if(part){itens=part.itens;starts=part.queue;pos=part.pos;st.opened=st.o0=part.opened||0;st.nP=itens.filter(x=>x.type==="folder").length;st.nF=itens.length-st.nP;st.modo="leitura completa (a continuar de onde ficou)"}
  else{pos=await streamNow();itens=[];starts=[{id:rootId,path:root}];st.modo="leitura completa"}
  await crawl(run,starts,itens,st,{key,rootId,root,pos});
  await DB.del("kv",key);
  const seen=new Set(),out=[];for(const x of itens){const k=x.type+x.id;if(seen.has(k))continue;seen.add(k);out.push(x)}
  return{itens:out,pos,full:true};
}
// só volta a abrir as pastas onde a Box registou alterações desde a última análise
async function updateScan(run,prev,st){
  st.modo="só o que mudou";
  let pos=prev.pos;const evs=[];
  for(let k=0;k<400;k++){const j=await boxGet("events",{stream_type:"changes",stream_position:pos,limit:500});
    const e=j.entries||[];for(const x of e)evs.push(x);pos=j.next_stream_position||pos;if(e.length<500||!j.chunk_size)break;if(evs.length>20000)return null} // 0.9.113: página incompleta = fim (o que faltar vem na próxima atualização, a posição guardada é a devolvida)
  // estado anterior, indexado
  const fo=new Map([[prev.rootId,{id:prev.rootId,path:prev.pasta,pid:null,root:true}]]),kids=new Map(),filesBy=new Map(),fileById=new Map();
  const arr=(m,k)=>{let a=m.get(k);if(!a)m.set(k,a=[]);return a};
  for(const x of prev.itens){if(x.type==="folder"){fo.set(x.id,x);arr(kids,x.pid).push(x)}else{arr(filesBy,x.pid).push(x);fileById.set(x.id,x)}}
  // pastas a reler — 0.9.113: nunca uma pasta excluída da análise nem o que está dentro dela (antes, um ficheiro posto numa
  // pasta excluída fazia-a reabrir e as subpastas novas eram lidas uma a uma)
  const X=EXC(),excl=new Map(),naExcluida=id=>{if(excl.has(id))return excl.get(id);let c=fo.get(id),r=false;for(let g=0;c&&g<80;g++){if(X.has(String(c.id))){r=true;break}c=c.pid?fo.get(c.pid):null}excl.set(id,r);return r};
  const relist=new Set();
  for(const ev of evs){const s=ev.source;if(!s||!s.id)continue;const pid=s.parent&&s.parent.id;
    if(pid&&fo.has(pid))relist.add(pid);
    if(s.type==="file"){const o=fileById.get(s.id);if(o&&fo.has(o.pid))relist.add(o.pid)}
    else if(s.type==="folder"&&fo.has(s.id)){const o=fo.get(s.id);if(o.pid&&fo.has(o.pid))relist.add(o.pid);relist.add(s.id)}}
  for(const id of [...relist])if(naExcluida(id))relist.delete(id);
  st.mudancas=evs.length;
  st.deleted=evs.filter(ev=>/TRASH|DELETE/.test(ev.event_type||"")&&ev.source&&ev.source.type==="file").map(ev=>({id:ev.source.id,by:pes(ev.created_by)}));
  // relê essas pastas (em paralelo, ao ritmo que a Box permite)
  const lists=new Map(),total=relist.size;
  await pool([...relist],async fid=>{
    if(st.stop){const er=new Error("parada");er.kind="stop";throw er}
    try{lists.set(fid,await listFolder(fid))}
    catch(e){if(e.kind==="http"&&(e.status===404||e.status===403))lists.set(fid,null);else throw e}
    st.opened++;progress(run,st,total-st.opened)},8);
  // aplica as diferenças, das pastas de cima para as de baixo
  const dropTree=id=>{const s=[id];while(s.length){const c=s.pop();for(const k of kids.get(c)||[])s.push(k.id);for(const f of filesBy.get(c)||[])fileById.delete(f.id);filesBy.delete(c);kids.delete(c);fo.delete(c)}};
  const unlink=(pid,id)=>{const a=kids.get(pid);if(a)kids.set(pid,a.filter(k=>k.id!==id))};
  const depth=id=>fo.get(id).path.split("/").length,newStarts=[];
  for(const fid of [...lists.keys()].filter(id=>fo.has(id)).sort((a,b)=>depth(a)-depth(b))){
    const F=fo.get(fid);if(!F)continue; // já foi retirada com a pasta de cima
    const list=lists.get(fid);
    if(list===null){if(!F.root){unlink(F.pid,fid);dropTree(fid)}continue}
    // ficheiros diretos
    for(const f of filesBy.get(fid)||[])fileById.delete(f.id);
    const nf=[];
    for(const x of list)if(x.type==="file"){const o=fileById.get(x.id);if(o){const a=filesBy.get(o.pid);if(a)filesBy.set(o.pid,a.filter(y=>y.id!==x.id))} // veio de outra pasta
      const it=fileItem(x,F.path,fid);nf.push(it);fileById.set(x.id,it);st.nF++}
    filesBy.set(fid,nf);
    // subpastas: desaparecidas, renomeadas, novas ou movidas
    const now=new Map();for(const x of list)if(x.type==="folder")now.set(x.id,x);
    const keep=[],kept=new Set();
    for(const k of kids.get(fid)||[]){const n=now.get(k.id);if(!n||n.name!==k.path.split("/").pop())dropTree(k.id);else{keep.push(k);kept.add(k.id)}}
    for(const [id,x] of now){if(kept.has(id))continue;
      if(fo.has(id)){unlink(fo.get(id).pid,id);dropTree(id)}
      const it={path:F.path+"/"+x.name,name:"",type:"folder",id,pid:fid};fo.set(id,it);keep.push(it);st.nP++;if(!EXC().has(id))newStarts.push({id,path:it.path})}
    kids.set(fid,keep);
  }
  const itens=[];for(const x of fo.values())if(!x.root)itens.push(x);for(const a of filesBy.values())for(const f of a)itens.push(f);
  if(newStarts.length)await crawl(run,newStarts,itens,st);
  return{itens,pos,full:false};
}
// auto=true: atualização automática ao abrir a app (só o que mudou; nunca começa sozinha uma leitura completa)
// 0.9.86: só uma janela (ou separador) de cada vez lê as pastas da Box com esta conta; a outra espera ou, se for automático, desiste
const BOX_OCUPADA={ocupada:true};
function boxLer(nome,fn,esperar){if(!(navigator.locks&&navigator.locks.request))return fn();
  return navigator.locks.request("episj360-box-"+nome,esperar?{mode:"exclusive"}:{mode:"exclusive",ifAvailable:true},l=>l===null?BOX_OCUPADA:fn())}
async function runScan(full,auto){
  if(scanBusy)return;
  if(auto&&buTravado()){$("#scanMsg").textContent="As atualizações automáticas estão paradas: já se gastaram "+Math.round(BU_TRAVAO*100)+"% dos pedidos à Box deste mês. Carregue em «Analisar» para ver o que mudou.";return}
  if(auto&&!(await trincoNuvem("box-leitura",600))){verificarFundo();return} // 0.9.113: outro computador está a atualizar agora (o resultado chega pela nuvem)
  if(!auto&&navigator.locks&&navigator.locks.query){try{const q=await navigator.locks.query();if((q.held||[]).some(x=>x.name==="episj360-box-leitura"))$("#scanMsg").textContent="Outra janela da EPISJ 360 está a ler a Box — começa logo que ela termine…"}catch(e){}}
  const r=await boxLer("leitura",()=>runScan0(full,auto),!auto);
  if(r===BOX_OCUPADA){if(!scanBusy)$("#scanMsg").textContent="Outra janela da EPISJ 360 está a ler a Box neste momento — esta mostra o resultado quando ela terminar.";
    const id=curFolder.id;boxLer("leitura",async()=>{try{const j=await lerListagem(id);if(j&&!scanBusy&&(!lastListing||(j.t||0)>(lastListing.t||0))&&(!lastListing||lastListing.rootId===id)){useListing(j,true);showLast();$("#scanMsg").textContent=`Atualizado pela outra janela: ${j.pasta} · ${j.quando}.`}}catch(e){}},true);return}
  verificarFundo();return r}
async function runScan0(full,auto){
  if(scanBusy)return;scanBusy=true;bgRun++;
  const run=++scanRun,b=$("#scanBtn");b.disabled=true;$("#scanUpd").disabled=true;
  $("#scanMsg").textContent=auto?"A procurar alterações desde a última análise…":"A ler…";$("#scanProg").style.display="block";$("#scanProg i").style.width="3%";
  const rootId=curFolder.id,root=curFolder.path.slice(1).map(p=>p.name).join("/")||"Box";
  const st={nP:0,nF:0,opened:0,retries:0,failed:[],t0:Date.now(),modo:""};RATE.hits=0;curSt=st;$("#scanStop").style.display="";$("#scanStop").disabled=false;
  try{
    try{localStorage.setItem("box_last_folder",JSON.stringify(curFolder))}catch(e){}
    const prev=await lerListagem(rootId);
    // 0.9.113: a análise fica sempre em dia pelo registo de alterações da Box (já não há leitura completa automática ao fim de 7 dias)
    const fresco=prev&&prev.v===2&&prev.pos;
    let res=null,falhou=false;
    if(!full&&fresco){try{res=await updateScan(run,prev,st)}catch(e){if(e.kind==="auth"||e.kind==="stop")throw e;console.warn(e);res=null;falhou=true}}
    if(!res&&auto){scanRun++;$("#scanMsg").textContent=prev?"Não foi possível ver o que mudou na Box desde a última análise. Carregue em “Analisar” quando quiser.":"";return}
    if(st.stop){const er=new Error("parada");er.kind="stop";throw er}
    if(!res){const ok=await confirmarLeitura(rootId,root,prev,full,falhou);if(!ok){scanRun++;$("#scanMsg").textContent="Leitura completa cancelada. Nenhum pedido foi feito à Box.";return}
      st.opened=0;st.nF=0;st.nP=0;res=await fullScan(run,rootId,root,st,full)}
    const nP=res.itens.reduce((a,x)=>a+(x.type==="folder"?1:0),0),nF=res.itens.length-nP,agora=Date.now();
    const delBy=Object.assign({},prev&&prev.delBy);for(const d of st.deleted||[])if(d.by)delBy[d.id]=d.by;
    const dk=Object.keys(delBy);if(dk.length>3000)for(const k of dk.slice(0,dk.length-3000))delete delBy[k];
    const j={v:2,pasta:root,rootId,t:agora,tFull:res.full?agora:(prev.tFull||prev.t),quando:new Date(agora).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}),itens:res.itens,pos:res.pos,failed:st.failed,nF,nP,delBy};
    const d=prev&&prev.v===2?diffFicheiros(prev,j):null;
    await guardarListagem(j);nuvemListagem(j);
    // contagem inicial para o painel Alterações: o estado antes desta análise (ou este, se for a primeira)
    if(!(basesIdx()[rootId]||[]).length){await criarBase(prev&&prev.v===2?prev:j,prev&&prev.v===2?"Análise de "+prev.quando:"Primeira análise")}
    scanRun++; // impede atualizações tardias da mensagem
    useListing(j);showLast();scanHint();setTimeout(()=>correrAvisos(),800);
    const secs=Math.round((agora-st.t0)/1000);
    let msg=`Concluído em ${secs} s (${st.modo}${res.full?"":`: ${st.mudancas} alteração(ões) registadas pela Box, ${st.opened} pasta(s) relidas`}) · ${nP} pastas, ${nF} ficheiros${RATE.hits?` · a Box pediu ${RATE.hits} pausa(s)`:""}${st.failed.length?` · ${ico("alert")} ${st.failed.length} pasta(s) sem acesso: ${st.failed.slice(0,3).join("; ")}${st.failed.length>3?"…":""}`:""}.`;
    if(d){const n=d.novos.length+d.alterados.length+d.apagados.length;msg+=n?` Desde ${prev.quando}: ${d.novos.length} colocado(s), ${d.alterados.length} substituído(s) ou movido(s), ${d.apagados.length} apagado(s) — veja “Alterações”.`:` Nada mudou desde ${prev.quando}.`;
      if(n&&!auto)toast(`${n} alteração(ões) desde a última análise — veja “Alterações”`)}
    $("#scanMsg").textContent=msg;
    if(!ativos().length&&detetar().size)toast("Agora use “Detetar módulos e UFCD” em Atribuições");
  }catch(e){scanRun++;
    if(e.kind==="stop"){$("#scanMsg").textContent=e.full?`Análise parada (${st.opened} pastas lidas). O que já foi lido ficou guardado: “Analisar” continua de onde ficou.`:"Atualização parada. Continua carregada a análise anterior; “Analisar” volta a procurar as alterações.";scanHint();return}
    $("#scanMsg").textContent="Erro: "+e.message+(e.kind==="auth"?"":" — o que já foi lido ficou guardado: carregue em “Analisar” para continuar de onde ficou.")}
  finally{scanBusy=false;curSt=null;$("#scanStop").style.display="none";b.disabled=false;$("#scanUpd").disabled=false;$("#scanProg i").style.width="100%";setTimeout(()=>{if(!scanBusy)$("#scanProg").style.display="none"},900)}
}
// 0.9.113: antes de uma leitura completa, diz quantos pedidos à Box vai gastar (1 por pasta) e pede confirmação
function pastasNaAnalise(j){return j&&Array.isArray(j.itens)?j.itens.reduce((a,x)=>a+(x.type==="folder"?1:0),0)+1:0}
async function confirmarLeitura(rootId,root,prev,full,falhou){
  let part=null;if(!full)try{part=await DB.get("kv","scan|"+rootId);if(part&&(Date.now()-part.t>48*3600e3||!part.queue||!part.queue.length))part=null}catch(e){part=null}
  const tot=buTotal(),usados=tot?` Este mês já foram feitos ${buN(tot)} pedidos (o plano tem ${buN(BU_ORC)}).`:` O plano da Box tem ${buN(BU_ORC)} pedidos por mês.`;
  let msg;
  if(part)msg=`Continuar a leitura de “${nomePasta(root)}” que ficou a meio? Faltam pelo menos ${buN(part.queue.length)} pastas (cerca de ${buN(part.queue.length)} pedidos à Box).`;
  else if(prev)msg=`${falhou?"Não foi possível ver na Box o que mudou desde a última análise. ":""}A leitura completa abre outra vez todas as pastas de “${nomePasta(root)}”, uma a uma: cerca de ${buN(pastasNaAnalise(prev))} pedidos à Box.`;
  else msg=`“${nomePasta(root)}” ainda não foi analisada. A primeira leitura abre todas as pastas e subpastas, uma a uma (1 pedido à Box por pasta): numa pasta grande, como um ano letivo inteiro, são milhares de pedidos. Depois disso, só se lê o que muda.`;
  return confirm(msg+usados+"\n\nContinuar?")}
/* ===== 0.9.115: Box360 › análise pelas pastas do computador (Box Drive) — nenhum pedido à Box =====
   Lê com a File System Access API (Chrome/Edge) a pasta que o Box Drive põe no disco: só nomes, tamanhos e datas (getFile() lê
   os dados do ficheiro, não o conteúdo; com o Box Drive não descarrega nada). A análise fica guardada como as outras, com o
   identificador «local|<caminho>» e o mesmo caminho da pasta na Box, para as pastas excluídas e o relatório funcionarem igual.
   Os ficheiros não têm identificador nem impressão digital da Box: o texto dos documentos não é lido (isso precisa da Box). */
var LOC_OK=typeof window.showDirectoryPicker==="function",LOC_RUN=null;
var LOC_IGN=/^(\.|~\$)|^(desktop\.ini|thumbs\.db|icon\r?)$/i;
function locRaiz(nome){const n=norm(nome),r=resumos();
  for(const id in r){const p=String(r[id].pasta||"");if(!id.startsWith("local|")&&norm(p.split("/").pop())===n)return p}
  try{const cp=curFolder.path.slice(1).map(p=>p.name);if(cp.length&&norm(cp[cp.length-1])===n)return cp.join("/")}catch(e){}
  return nome}
function locExcluida(p){return Object.values(cfg.excluir||{}).some(e=>e&&e.path&&dentro(p,e.path))}
async function locPasta(nova){
  let h=nova?null:await DB.get("kv","locDir");
  if(h&&h.queryPermission){let ok=await h.queryPermission({mode:"read"});if(ok!=="granted")ok=await h.requestPermission({mode:"read"});if(ok!=="granted")h=null}
  else h=null;
  if(!h){h=await window.showDirectoryPicker({id:"box360-local",mode:"read"});await DB.put("kv","locDir",h)}
  return h}
async function locAnalisar(nova){
  if(!LOC_OK){toast("Este navegador não deixa ler pastas do computador. Use o Chrome ou o Edge num computador.");return}
  if(LOC_RUN||scanBusy){toast("Espere que a análise em curso termine");return}
  let dir;try{dir=await locPasta(nova)}catch(e){if(e&&e.name==="AbortError")return;$("#locMsg").textContent="Não foi possível abrir a pasta: "+(e.message||e);return}
  const root=locRaiz(dir.name),rootId="local|"+root,st={nP:0,nF:0,stop:false,t0:Date.now()};LOC_RUN=st;
  $("#locGo").disabled=true;$("#locOutra").disabled=true;$("#locStop").style.display="";$("#locProg").style.display="block";$("#locProg i").style.width="3%";
  const itens=[],fila=[{h:dir,path:root,id:rootId}];let nid=0,ativos=0,ult=0;
  const msg=()=>{if(Date.now()-ult<250)return;ult=Date.now();const seg=Math.round((Date.now()-st.t0)/1000);
    $("#locMsg").textContent=`A ler “${dir.name}” no computador… ${st.nP} pastas, ${st.nF} ficheiros (${seg} s)`;$("#locProg i").style.width=Math.min(95,3+Math.log10(1+st.nP)*25)+"%"};
  const ler=async f=>{for await(const [nome,h] of f.h.entries()){if(st.stop)return;if(LOC_IGN.test(nome))continue;
      if(h.kind==="directory"){const p=f.path+"/"+nome,id="loc:"+(++nid);itens.push({path:p,name:"",type:"folder",id,pid:f.id});st.nP++;if(!locExcluida(p))fila.push({h,path:p,id})}
      else{let fl=null;try{fl=await h.getFile()}catch(e){}const d=fl&&fl.lastModified?new Date(fl.lastModified).toISOString():"";
        itens.push({path:f.path,name:nome,type:"file",modified_at:d,cm:d,ca:"",id:"",pid:f.id,size:fl?fl.size:null,sha1:"",by:"",cb:""});st.nF++}
      msg()}};
  try{
    await new Promise((ok,ko)=>{const bomba=()=>{if(st.stop||(!fila.length&&!ativos)){if(!ativos)ok();return}
        while(ativos<6&&fila.length){const f=fila.shift();ativos++;ler(f).catch(e=>{st.erros=(st.erros||0)+1;console.warn(e)}).finally(()=>{ativos--;bomba()})}};bomba()});
    if(st.stop){$("#locMsg").textContent="Leitura parada. Nada foi guardado.";return}
    const agora=Date.now(),j={v:2,local:true,pasta:root,rootId,t:agora,tFull:agora,quando:new Date(agora).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}),itens,pos:null,failed:[],nF:st.nF,nP:st.nP,delBy:{}};
    await guardarListagem(j);nuvemListagem(j);scanRun++;useListing(j,true);showLast();
    $("#locMsg").textContent=`Concluído em ${Math.round((agora-st.t0)/1000)} s: ${st.nP} pastas e ${st.nF} ficheiros de “${dir.name}”, lidos no computador (0 pedidos à Box).${st.erros?` ${st.erros} pasta(s) não se deixaram ler.`:""} Veja o Relatório.`;
    toast("Análise das pastas do computador concluída");
  }finally{LOC_RUN=null;$("#locGo").disabled=false;$("#locOutra").disabled=false;$("#locStop").style.display="none";$("#locProg i").style.width="100%";setTimeout(()=>{if(!LOC_RUN)$("#locProg").style.display="none"},900)}}
function locUI(){const c=document.getElementById("locCard");if(!c)return;
  if(!LOC_OK){$("#locGo").disabled=true;$("#locOutra").style.display="none";$("#locMsg").textContent="Este navegador não deixa ler pastas do computador: use o Chrome ou o Edge num computador (no iPad não é possível).";return}
  DB.get("kv","locDir").then(h=>{if(!LOC_RUN&&!$("#locMsg").textContent)$("#locMsg").textContent=h?`Pasta escolhida: “${h.name}”.`:"";$("#locOutra").style.display=h?"":"none"})}
$("#locGo").onclick=()=>locAnalisar(false);
$("#locOutra").onclick=()=>locAnalisar(true);
$("#locStop").onclick=()=>{if(LOC_RUN)LOC_RUN.stop=true};
setTimeout(function(){try{locUI()}catch(e){}},0);
let curSt=null;
$("#scanStop").onclick=()=>{if(!curSt)return;curSt.stop=true;bgRun++;$("#scanStop").disabled=true;$("#scanMsg").textContent="A parar… (a terminar os pedidos que já estavam a meio)"};
$("#scanBtn").onclick=()=>runScan(false);
$("#scanUpd").onclick=()=>runScan(true);
function scanHint(){const p=resumos()[curFolder.id],el=$("#scanHint");
  DB.get("kv","scan|"+curFolder.id).then(part=>{
    if(part&&part.queue&&part.queue.length&&Date.now()-part.t<48*3600e3&&!scanBusy){el.textContent=`Há uma leitura desta pasta por acabar (${part.opened||0} pastas já lidas): “Analisar” continua de onde ficou.`;return}
    const ok=p&&p.pos;
    el.textContent=ok?`Esta pasta foi lida a ${p.quando}: “Analisar” só abre as pastas que mudaram desde então (poucos pedidos à Box). A “Leitura completa” abre todas as pastas outra vez${p.np!=null?` (cerca de ${buN(p.np+1)} pedidos)`:""} e só é precisa se algo parecer errado.`
      :p?"“Analisar” procura o que mudou desde a última análise desta pasta."
      :"A primeira análise de uma pasta abre todas as pastas e subpastas, uma a uma (1 pedido à Box por pasta). Depois disso, só lê o que muda."});
  const outro=p&&(!lastListing||lastListing.rootId!==curFolder.id);
  $("#lastScan").style.display=outro?"":"none";if(outro)$("#lastScan").textContent=`Usar a análise guardada desta pasta (${p.quando})`;}
function showLast(){const j=lastListing;$("#lastInfo").textContent=j?`Análise carregada: ${j.pasta} · ${j.quando} · ${files.length} ficheiros`:"";renderAnalises()}
/* ---------- lista das análises guardadas (uma por pasta analisada, ex.: um ano letivo cada) ---------- */
const nomePasta=p=>String(p||"Box").split("/").filter(Boolean).pop()||"Box";
function renderAnalises(){
  const r=resumos(),ids=Object.keys(r).sort((a,b)=>(r[b].t||0)-(r[a].t||0)),cur=lastListing&&lastListing.rootId;
  $("#anaTop").style.display=ids.length?"":"none";$("#anaCard").style.display=ids.length?"":"none";
  const sel=$("#anaSel");
  sel.innerHTML=(cur&&!r[cur]?`<option value="">—</option>`:"")+ids.map(id=>`<option value="${esc(id)}"${id===cur?" selected":""} title="${esc(r[id].pasta)}">${esc(nomePasta(r[id].pasta))} · ${esc(r[id].quando||"")}</option>`).join("");
  if(!cur)sel.insertAdjacentHTML("afterbegin",`<option value="" selected>Nenhuma carregada</option>`);
  $("#anaList").innerHTML=ids.map(id=>{const a=r[id],on=id===cur;
    return`<tr class="${on?"on":""}"><td><div class="pn">${esc(nomePasta(a.pasta))}${id.startsWith("local|")?`<span class="tag ok" title="Lida nas pastas do computador (Box Drive), sem pedidos à Box">computador</span>`:""}${on?`<span class="tag">em uso</span>`:""}</div><div class="pp">${esc(a.pasta||"")}</div></td><td>${esc(a.quando||"")}</td><td>${a.n!=null?`${a.n} ficheiros`:""}${a.np!=null?` · ${a.np} pastas`:""}</td><td style="text-align:right;white-space:nowrap">${on?"":`<button class="b s" data-ana="${esc(id)}">Usar esta análise</button> `}<button class="b s" data-anadel="${esc(id)}" style="border-color:var(--bad);color:var(--bad)" title="Apaga esta análise da EPISJ 360 (neste e nos outros computadores). Os documentos na Box não são tocados.">Apagar</button></td></tr>`}).join("")}
// 0.9.88: apagar uma análise guardada — só a cópia da EPISJ 360 (a Box nunca é tocada). Na nuvem fica uma marca «apagada»,
// para os outros computadores também a apagarem; se a pasta voltar a ser analisada, a análise nova substitui a marca.
async function apagarAnaliseLocal(id){await DB.del("listagens","L|"+id);
  try{const r=resumos();delete r[id];localStorage.setItem("box_resumos",JSON.stringify(r));
    if(localStorage.getItem("box_last_root")===id)localStorage.removeItem("box_last_root");
    const o=lsJ("box_last_listing",null);if(o&&(o.rootId||"legacy")===id)localStorage.removeItem("box_last_listing")}catch(e){}}
async function apagarAnalise(id){
  const a=resumos()[id];if(!a)return;
  if(scanBusy){toast("Espere que a análise termine");return}
  const emUso=lastListing&&lastListing.rootId===id;
  if(!confirm(`Apagar a análise guardada de «${nomePasta(a.pasta)}» (${a.quando||""})?\n\nSai deste e dos outros computadores. Os documentos na Box não são tocados.\n\nAtenção: voltar a analisar esta pasta obriga a lê-la toda outra vez${a.np!=null?` (cerca de ${buN(a.np+1)} pedidos à Box; o plano tem ${buN(BU_ORC)} por mês)`:" (1 pedido à Box por pasta)"}.${emUso?"\n\nÉ a análise em uso: a página volta a abrir no fim.":""}`))return;
  await apagarAnaliseLocal(id);
  if(NUVOK())try{await nuvemPut("L_"+id,{apagada:true,rootId:id,pasta:a.pasta,t:Date.now()},Date.now())}catch(e){}
  if(emUso){toast("Análise apagada");setTimeout(()=>location.reload(),700);return}
  renderAnalises();scanHint();toast(`Apagada a análise de ${nomePasta(a.pasta)}`)}
async function abrirAnalise(id){
  if(!id||(lastListing&&lastListing.rootId===id))return;
  if(scanBusy){toast("Espere que a análise termine");renderAnalises();return}
  const j=await lerListagem(id);if(!j){toast("Esta análise já não está guardada neste navegador");renderAnalises();return}
  try{localStorage.setItem("box_last_root",id)}catch(e){}
  useListing(j,true);showLast();if(curFolder)scanHint();await carregarRef();
  boxMsg(`Aberta a análise guardada de “${j.pasta}” (${j.quando}): ${files.length} ficheiros e ${folders.length} pastas.`,"ok");
  toast(`Em uso: ${nomePasta(j.pasta)} · ${j.quando}`)}
$("#anaSel").addEventListener("change",e=>abrirAnalise(e.target.value));
$("#anaList").addEventListener("click",e=>{const d=e.target.closest("[data-anadel]");if(d){apagarAnalise(d.dataset.anadel);return}const b=e.target.closest("[data-ana]");if(b)abrirAnalise(b.dataset.ana)});
$("#lastScan").onclick=async()=>{const j=await lerListagem(curFolder.id);if(!j){toast("Sem análise guardada desta pasta");return}try{localStorage.setItem("box_last_root",j.rootId)}catch(e){}useListing(j);showLast();scanHint();carregarRef()};
$("#dlList").onclick=()=>{if(!lastListing)return;const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  download(`listagem_box_${hoje()}.csv`,"﻿"+["path,name,type,modified_at,id,size,sha1,cmod"].concat(lastListing.itens.map(x=>[x.path,x.name,x.type,x.modified_at||"",x.id||"",x.size??"",x.sha1||"",x.cm||""].map(q).join(","))).join("\n"),"text/csv;charset=utf-8")};
