const COLL_PT=new Intl.Collator("pt"),COLL_PTN=new Intl.Collator("pt",{numeric:true}); // 0.9.86: ordenar com um só comparador (muito mais rápido do que localeCompare a cada comparação)
const ICO={"cloud": "<svg class=\"ico\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M17.5 19H8a5 5 0 1 1 1.1-9.9A6 6 0 0 1 20.5 11a4 4 0 0 1-3 8z\"/></svg>", "alert": "<svg class=\"ico\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z\"/><path d=\"M12 9v4M12 17h.01\"/></svg>", "cal": "<svg class=\"ico\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"5\" width=\"18\" height=\"16\" rx=\"2\"/><path d=\"M3 10h18M8 3v4M16 3v4\"/></svg>", "eye": "<svg class=\"ico\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>", "pencil": "<svg class=\"ico\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M12 20h9\"/><path d=\"M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z\"/></svg>"};const ico=k=>ICO[k]||""; // 0.9.82: ícones de linha em vez de emojis
const VERSAO="0.9.221"; // versão da EPISJ 360 — sobe a cada alteração publicada
const BC_VER="1.25"; // versão do módulo Box360
/* 0.9.193: os formadores aparecem sempre ordenados pelo código (AG, AM, CB…); sem código ficam no fim, pelo nome */
function cmpCod(ca,cb,na,nb){ca=String(ca||"").trim();cb=String(cb||"").trim();if(!ca!==!cb)return ca?-1:1;return COLL_PTN.compare(ca,cb)||COLL_PT.compare(String(na||""),String(nb||""))}
const cmpProf=(a,b)=>cmpCod(a&&a.cod,b&&b.cod,a&&a.nome,b&&b.nome); // formadores da Escola360 (cfg.profs)
// 0.9.216: as subpastas de «006 - Planificações» (ex.: «006.3 - Módulo e UFCDs») mostram que são planificações
const docNome=n=>{n=String(n||"");return /^006(\.\d+)+\s*-\s*/.test(n)&&!/planifica/i.test(n)?n.replace(/^(006(?:\.\d+)+)\s*-\s*/,"$1 - Planificações: "):n};
// 0.9.218: estado de cada documento publicado para o formador — entregue (conta), em falta (pasta vazia, inexistente ou só com ficheiros que não contam) ou por confirmar
const boxOkS=s=>s==="ok"||s==="warn"||s==="modelo",boxFaltaS=s=>s==="missing"||s==="blank";
// item publicado [secção, estado, pasta, data, subpasta, obs] → objeto; «onde» = a subpasta dentro do módulo (ex.: «Teste Prático › Ana»), nunca o nome do próprio módulo
function boxItem(x,m){const pasta=x[2]||"",sub=x[4]||"",pm=norm(pasta);let onde=sub;if(!onde&&pasta&&pm!==norm(m&&m.mo||"")){let mod=false;try{mod=isModLike(pm)}catch(e){}if(!mod)onde=pasta}
  return{tipo:docNome(x[0]),st:x[1],pasta,d:x[3]||"",sub,obs:x[5]||"",onde}}
const profRot=p=>p?(p.cod?String(p.cod).trim()+" · ":"")+(p.nome||"(sem nome)"):""; // 0.9.215: «código · nome» em toda a app
const cmpTch=(a,b)=>cmpCod(a&&a.short,b&&b.short,a&&a.name,b&&b.name); // formadores do horário (st.teachers)
/* 0.9.190: versões dos módulos que ainda não tinham número próprio (sobem quando o módulo muda) */
var MOD_VER0={escola:"1.0",eduschedule:"1.1",crono:"1.1",pass:"1.0"};
function modVer(m){const F={boxcheck:()=>BC_VER,roomcheck:()=>RC_VER,social:()=>S3_VER,pap:()=>PAP_VER,folder:()=>FO_VER,econo:()=>ECO_VER}[m];let v="";try{v=F?F():""}catch(e){}return v||MOD_VER0[m]||""}
/* rodapé: a versão da EPISJ 360 e a de cada módulo a que esta conta tem acesso (o administrador vê todas) */
function fundosVersoes(){const el=document.getElementById("fVers");if(!el)return;let L=[];
  try{const adm=!!(EU&&EU.admin&&!PREV);L=MODULOS.filter(M=>adm||(!modEscondido(M.id)&&!!primeiroPermitido(M.id)))}catch(e){L=[]}
  el.innerHTML=`EPISJ 360 v${esc(VERSAO)}`+L.map(M=>{const v=modVer(M.id);return v?` · ${esc(M.nome)} v${esc(v)}`:""}).join("")}
document.querySelectorAll("[data-ver]").forEach(el=>el.textContent="v"+VERSAO);
document.querySelectorAll("[data-bcver]").forEach(el=>el.textContent="v"+BC_VER);
const $=s=>document.querySelector(s);
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// 0.9.145: ligações vindas de dados (importados ou escritos) — só http(s), mailto, tel e sms; «javascript:» e afins dão "#"
const escUrl=u=>{const s=String(u??"").trim();return esc(/^(https?:|mailto:|tel:|sms:)/i.test(s)?s:"#")};
const norm0=s=>String(s??"").normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/\\/g,"/").replace(/\s+/g," ").trim();
// 0.9.86: os mesmos nomes (pastas, módulos, turmas) são normalizados milhares de vezes por relatório: guarda-se o resultado
const NORM_C=new Map();const norm=s=>{if(typeof s!=="string")return norm0(s);if(s.length>300)return norm0(s);let v=NORM_C.get(s);if(v===undefined){if(NORM_C.size>120000)NORM_C.clear();v=norm0(s);NORM_C.set(s,v)}return v};
const normPath=s=>norm(s).split("/").map(x=>x.trim()).filter(Boolean).join("/");
const splitList=s=>String(s||"").split(/[,;]/).map(x=>norm(x).replace(/^\./,"")).filter(Boolean);

const KEY="entregas_box_v1";
// EPISJ 360 0.9 — perfis: EU = conta do Office 365 e o seu perfil; RO = só leitura (Formador, Formando: os dados vêm do que a Direção publicou)
let EU=null,RO=false,PREV="",UTI=null,MODS_OFF=[];
/* ---------- modelos por omissão (EPISJ) ---------- */
// [nome, secção/subpasta, "o texto deve conter" (pelo menos uma destas palavras)]
const DTP_TYPES=[["Planificação","006","planifica, objetivos, objectivos, conteudos, competencias, estrategias, calendariza, carga horaria, aulas previstas, sumario"],
  ["Recursos Didáticos","007",""],["Orientação Educativa","012",""],
  ["Enunciados e Prop. de Correção","008 / Enunciados","correc, cotac, resoluc, soluc, enunciado, criterios, questao, grupo, pergunta, responde, exercicio"],
  ["Matrizes","008","matriz, cotac, conteudos, objetivos, objectivos, competencias, estrutura, criterios, ponderac, dominio"],
  ["Testes e Fichas de Avaliação","008 / Testes","teste, ficha, avaliac, questao, grupo, cotac, pergunta, responde, exercicio, classificac"]];
const DTP_PAL={"Matrizes":"matriz"}; // 0.9.94: a matriz é um ficheiro (ex.: «M01 - Excel - TIC - Matriz.pdf») ou uma pasta «Matrizes»
const dtpTypes=()=>DTP_TYPES.map(([nome,subpasta,conteudo])=>({id:uid(),nome,subpasta,palavras:DTP_PAL[nome]||"",conteudo,ext:"",min:1}));
const MAIL_SUBJ="Documentos em falta na Box — Ano letivo {ano}";
const MAIL_BODY="Olá {primeiro_nome},\n\nRemeto a lista de materiais e documentos referentes ao ano letivo {ano} que ainda não foram submetidos na Box ({total} item(ns)):\n\n{lista}\n\nEsta solicitação já foi reiterada em diversas ocasiões nos últimos meses, sem que se tenha verificado a respetiva regularização. Tratando-se de documentação essencial para a organização pedagógica da Escola e para os processos de financiamento e certificação, solicito que a submissão seja concluída até ao dia {prazo}.\n\nSolicito ainda feedback escrito, confirmando a conclusão da submissão ou, na sua ausência, a devida justificação para a inexistência do documento.\n\nDada a necessidade de encerrar definitivamente o processo relativo ao ano letivo {ano}, agradeço que este pedido não necessite de ser novamente reiterado.\n\nCom os melhores cumprimentos,";
const OLD_BODY="Caro(a) {nome},\n\nNa verificação das pastas da Box, constatei que ainda falta entregar a seguinte documentação ({total} documento(s)):\n\n{lista}\n\nPeço que a coloque nas pastas respetivas até {prazo}.\n\nObrigado,\nA Direção";
const defaultCfg=()=>({schema:2,docTypes:dtpTypes(),profs:[],mods:[],grid:{},desig:{},envios:[],
  mail:{subj:MAIL_SUBJ,prazo:"",ano:"",body:MAIL_BODY,relatorio_para:""},qual:{min:40,dup:true}});
let LIMPAR=false,lastStored=null; // 0.9.22: o que esta página leu/escreveu da última vez (para não esmagar o que outro separador gravou)
// 0.9.35: tem de estar declarado ANTES de load(); se não, load() dava erro (TDZ), devolvia null e a app arrancava vazia e gravava por cima
let cfg=load()||defaultCfg();
{const g=+(localStorage.getItem("episj_ger")||0);if(g&&!cfg.ger)cfg.ger=g} // 0.9.22: geração (recomeço) a que estes dados pertencem
const GOPEN=new Set(); // disciplinas abertas na grelha
const LGKEY="boxcheck_logos"; // logótipos dos documentos (guardados à parte: não entram no histórico de anular)
let LOGOS=(()=>{try{return JSON.parse(localStorage.getItem(LGKEY)||"{}")||{}}catch(e){return{}}})();
let files=[]; // {path, rawDir, comps, name, nname, date, fid, size, sha1}
let folders=[]; // caminhos de pastas (para detetar módulos e saber se uma pasta existe)
let rawRows=null, rawHead=null;
// contadores de alterações: servem para o relatório só ser recalculado quando alguma coisa mudou
let filesRev=0,IDX=null,cfgRev=0,txRev=0,refRev=0,tplRev=0;

// (LIMPAR e lastStored passaram para antes de let cfg=load(): declarados depois, o load() falhava e a app arrancava com a configuração vazia)
function load(){try{const t=localStorage.getItem(KEY);lastStored=t;return t?JSON.parse(t):null}catch(e){return null}}
/* 0.9.35: gravar sem perder nada — se o localStorage estiver cheio (os pontos de restauro guardam cópias inteiras), os pontos mais antigos
   passam para a base de dados do navegador (IndexedDB) e volta-se a tentar; além disso, cada gravação fica também copiada no IndexedDB,
   e ao abrir a app, se essa cópia for mais recente do que o localStorage, junta-se (nada se perde ao atualizar a app). */
let PERSIST_OK=true,persistAviso=false,cfgCopiaH=null;
function rpPassarParaIDB(manter){try{const l=JSON.parse(localStorage.getItem("boxcheck_pontos")||"[]");if(l.length<=manter)return false;
  const sai=l.slice(manter);localStorage.setItem("boxcheck_pontos",JSON.stringify(l.slice(0,manter)));
  try{DB.get("kv","pontosAntigos").then(v=>DB.put("kv","pontosAntigos",[...sai,...(Array.isArray(v)?v:[])].slice(0,60)))}catch(e){}return true}catch(e){try{const l=JSON.parse(localStorage.getItem("boxcheck_pontos")||"[]");try{DB.put("kv","pontosAntigos",l)}catch(x){}localStorage.removeItem("boxcheck_pontos");return true}catch(x){return false}}}
function cfgCopiaIDB(s){clearTimeout(cfgCopiaH);cfgCopiaH=setTimeout(()=>{try{DB.put("kv","cfgCopia",{t:Date.now(),s})}catch(e){}},250)}
function persist(s){if(RO||LIMPAR)return false;s=s||JSON.stringify(cfg);let ok=false;
  for(const manter of[null,8,3,0]){if(manter!==null&&!rpPassarParaIDB(manter))continue;try{localStorage.setItem(KEY,s);lastStored=s;ok=true;break}catch(e){}}
  if(ok){try{localStorage.setItem(KEY+"_t",String(Date.now()))}catch(e){}}
  PERSIST_OK=ok;cfgCopiaIDB(s);
  if(!ok&&!persistAviso){persistAviso=true;setTimeout(()=>{try{toast("O espaço do navegador está cheio: os dados ficam guardados na base de dados do navegador")}catch(e){}},0)}
  return ok}
/* ---------- 0.9.22: a informação do utilizador nunca se perde ----------
   Antes, ao trazer da nuvem (ou com outro separador aberto, por exemplo depois de uma atualização da app), a configuração
   mais recente substituía a outra por inteiro — e o que só existia na outra perdia-se. Agora junta-se tudo:
   · listas com "id" (formadores, módulos, anos letivos, cursos, turmas, formandos…) juntam-se elemento a elemento;
   · nos conflitos ganha a versão mais recente, mas nada que só exista de um lado desaparece;
   · só sai o que o utilizador apagou (fica registado em cfg._del) — ou o botão "Apagar tudo e começar de novo". */
function idsDe(o,S){S=S||new Set();if(Array.isArray(o)){for(const x of o)if(x&&typeof x==="object"){if(x.id!=null&&x.id!=="")S.add(String(x.id));idsDe(x,S)}}
  else if(o&&typeof o==="object"){for(const k in o)if(k!=="_del")idsDe(o[k],S)}return S}
const comId=v=>v.every(x=>x&&typeof x==="object"&&!Array.isArray(x)&&x.id!=null&&x.id!=="");
function juntarVal(a,b,del){ // a: a versão mais recente (ganha nos conflitos) · b: a outra
  if(a===undefined)return b;if(b===undefined||a===null||b===null)return a;
  if(Array.isArray(a)&&Array.isArray(b)){
    if((a.length||b.length)&&comId(a)&&comId(b)){const mb=new Map(b.map(x=>[String(x.id),x])),ja=new Set();
      const out=a.filter(x=>!del.has(String(x.id))).map(x=>{const k=String(x.id);ja.add(k);return mb.has(k)?juntarVal(x,mb.get(k),del):x});
      b.forEach(x=>{const k=String(x.id);if(!ja.has(k)&&!del.has(k))out.push(x)});return out}
    return a}
  if(typeof a==="object"&&typeof b==="object"&&!Array.isArray(a)&&!Array.isArray(b)){const o={...b,...a};for(const k in a)if(k in b)o[k]=juntarVal(a[k],b[k],del);return o}
  return a}
function juntarCfg(a,b){if(!b||typeof b!=="object")return a;if(!a||typeof a!=="object")return b;
  if((a.ger||0)!==(b.ger||0))return (a.ger||0)>(b.ger||0)?a:b; // depois de "Apagar tudo e começar de novo" vale só o recomeço
  const d=Object.assign({},b._del||{},a._del||{}),del=new Set(Object.keys(d));const o=juntarVal(a,b,del);o._del=d;return o}
// 0.9.86: os ids da versão anterior ficam guardados (antes lia-se outra vez toda a configuração a cada tecla)
var IDS_ANT={s:null,ids:null};
function notarApagados(antes){let mud=false;try{const A=IDS_ANT.s===antes&&IDS_ANT.ids?IDS_ANT.ids:idsDe(JSON.parse(antes)),B=idsDe(cfg),d=cfg._del&&typeof cfg._del==="object"?cfg._del:(cfg._del={}),t=Date.now();
  A.forEach(k=>{if(!B.has(k)){d[k]=t;mud=true}});B.forEach(k=>{if(k in d){delete d[k];mud=true}});
  const lim=t-400*864e5;for(const k in d)if(d[k]<lim){delete d[k];mud=true}IDS_ANT={s:null,ids:B}}catch(e){mud=true}return mud}
// se outro separador gravou entretanto (por exemplo, a versão nova aberta ao lado da antiga), junta-se em vez de esmagar
function juntarOutroSeparador(){try{const st=localStorage.getItem(KEY);if(st&&lastStored!==null&&st!==lastStored){cfg=juntarCfg(cfg,JSON.parse(st));lastStored=st;return true}}catch(e){}return false}
window.addEventListener("storage",e=>{if(RO||!e.newValue)return;
  if(e.key===KEY){try{cfg=juntarCfg(JSON.parse(e.newValue),cfg);lastStored=e.newValue;lastJSON=JSON.stringify(cfg);cfgRev++;if(lastJSON!==e.newValue)persist(lastJSON);refreshAll()}catch(x){}}
  else if(e.key==="roomcheck"){try{RC=rcJuntar(RC,JSON.parse(e.newValue));if(curTab&&curTab.startsWith("rc"))rcRender(curTab)}catch(x){}}});

/* ---------- histórico: anular / refazer ---------- */
let undoS=[],redoS=[],lastJSON=JSON.stringify(cfg),lastPush=0;
function save(){
  if(RO)return;juntarOutroSeparador();
  let cur=JSON.stringify(cfg);
  if(cur!==lastJSON){if(notarApagados(lastJSON))cur=JSON.stringify(cfg);
    if(Date.now()-lastPush>1500||!undoS.length){undoS.push(lastJSON);const mx=cur.length>200000?30:80;while(undoS.length>mx)undoS.shift()}
    redoS=[];lastPush=Date.now();lastJSON=cur;IDS_ANT.s=cur;cfgRev++;marcarCfg();
  }
  persist(cur);undoUI();
}
function undoUI(){$("#undoBtn").disabled=!undoS.length;$("#redoBtn").disabled=!redoS.length}
function goHist(from,to,msg){if(!from.length)return;to.push(lastJSON);const antes=lastJSON;cfg=JSON.parse(from.pop());notarApagados(antes);lastJSON=JSON.stringify(cfg);lastPush=0;cfgRev++;persist(lastJSON);marcarCfg();undoUI();refreshAll();toast(msg)}
const undo=()=>goHist(undoS,redoS,"Alteração anulada");
const redo=()=>goHist(redoS,undoS,"Alteração refeita");
$("#undoBtn").onclick=undo;$("#redoBtn").onclick=redo;
document.addEventListener("keydown",e=>{
  if(!(e.ctrlKey||e.metaKey)||/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))return;
  const k=e.key.toLowerCase();
  if(k==="z"&&!e.shiftKey){e.preventDefault();undo()}else if((k==="z"&&e.shiftKey)||k==="y"){e.preventDefault();redo()}});

/* ---------- pontos de restauro ---------- */
const RPKEY="boxcheck_pontos";
function rpList(){try{return JSON.parse(localStorage.getItem(RPKEY)||"[]")}catch(e){return[]}}
function ponto(label){const P={t:Date.now(),label,cfg:JSON.stringify(cfg)};try{const l=rpList();l.unshift(P);if(l.length>9)rpPassarParaIDB(9);const k=rpList();k.unshift(P);
  try{localStorage.setItem(RPKEY,JSON.stringify(k.slice(0,10)))}catch(e){rpPassarParaIDB(2);try{const k2=rpList();k2.unshift(P);localStorage.setItem(RPKEY,JSON.stringify(k2.slice(0,3)))}catch(x){try{DB.get("kv","pontosAntigos").then(v=>DB.put("kv","pontosAntigos",[P,...(Array.isArray(v)?v:[])].slice(0,60)))}catch(y){}}}}catch(e){}renderRP();nuvemAgendar()}
var RP_N=null;
function renderRP(){const el=$("#rpList");if(!el)return;const l=rpList();RP_N=RP_N||new Map();
  el.innerHTML=l.map((p,i)=>{let n=RP_N.get(p.t+":"+(p.cfg||"").length);if(n==null){n="";try{const c=JSON.parse(p.cfg);n=`${c.profs.length} formadores · ${c.mods.length} módulos`}catch(e){}RP_N.set(p.t+":"+(p.cfg||"").length,n)}
    return `<div class="rp"><span class="d">${new Date(p.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}</span><span class="l">${esc(p.label)} <span class="hint" style="margin:0">· ${n}</span></span><button class="b s" data-rp="${i}">Restaurar</button></div>`}).join("")||`<p class="hint">Ainda não há pontos de restauro.</p>`}
$("#rpList").addEventListener("click",e=>{const b=e.target.closest("[data-rp]");if(!b)return;const p=rpList()[+b.dataset.rp];if(!p)return;
  ponto("Antes de restaurar “"+p.label+"”");cfg=JSON.parse(p.cfg);migrate();save();refreshAll();toast("Configuração restaurada")});
$("#rpNow").onclick=()=>{ponto("Ponto criado manualmente");toast("Ponto de restauro criado")};

/* 0.9.39: "Enviar para o Office 365" — envia já para a nuvem da EPISJ 360 e faz uma cópia no OneDrive (pede a permissão da pasta da app, se faltar) */
async function guardarAgora(){const b=$("#subUp");if(b)b.disabled=true;const out=[];
  try{save();
    if(NUVOK()){try{NUV.erro="";await nuvemPut("estado",estadoAtual(),cfgT()||Date.now());try{await rcTrazer(true)}catch(e){}try{if(ESD&&ESD.t)await nuvemPut("ES",ESD,ESD.t)}catch(e){}
      out.push(nuvDesl()?"nuvem: falta atualizar o serviço de avisos na Cloudflare":NUV.erro?"nuvem: "+NUV.erro:"base de dados ✓")}catch(e){out.push("base de dados: "+(e.message||e))}}
    else out.push("nuvem: entre com a conta do Office 365 da Direção");
    if(odPode()){try{await odCopia(true);try{localStorage.removeItem("g360_od_falta")}catch(e){}out.push("OneDrive ✓")}catch(e){out.push("OneDrive: "+(e.message||e))}}else out.push("OneDrive: só para a Direção, com a conta do Office 365")
  }finally{if(b)b.disabled=false;try{window.__subEst&&window.__subEst()}catch(e){}}
  toast("Guardar agora — "+out.join(" · "))}
