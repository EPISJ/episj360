
/* ---------- guardar tudo no serviço de login (Cloudflare) para continuar noutro computador ---------- */
// Nada disto escreve na Box. Fica guardado: configuração (formadores, atribuições, exceções, envios, falsos positivos),
// pontos de restauro, modelos oficiais, análises de cada pasta, contagens e o resultado da leitura dos documentos.
const NUV={ativo:null,ultimo:0,erro:"",ocupado:false};
const nuvT=()=>lsJ("boxcheck_nuvem",{});
function nuvSetT(k,t){const o=nuvT();o[k]=t;try{localStorage.setItem("boxcheck_nuvem",JSON.stringify(o))}catch(e){}}
function marcarCfg(){if(RO)return;try{guidePubAgendar()}catch(e){}try{localStorage.setItem("boxcheck_cfg_t",String(Date.now()))}catch(e){}nuvemAgendar();try{agendarPlano()}catch(e){}}
const cfgT=()=>+(localStorage.getItem("boxcheck_cfg_t")||0);
async function gz(obj){const s=new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream("gzip"));return new Response(s).arrayBuffer()}
async function ungz(buf){const s=new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip"));return JSON.parse(await new Response(s).text())}
/* ===================== 0.9.41: transição para o Supabase (fase 1) =====================
   Quando a base de dados da EPISJ 360 no Supabase está configurada (Definições › Base de dados) e se entra com a conta da Microsoft,
   a "nuvem" passa a ser o Supabase: as mesmas peças (estado, rc, ES, avisos, L_…, B_…) na tabela g360_estado, com histórico de versões.
   Sem Supabase, tudo continua como antes (nuvem da Cloudflare com o Office 365, ou com a Box). */
var SB_CFG_KEY="g360_sb",SB_SES_KEY="episj360.sb";
// 0.9.42: projeto "episj360" já criado; a chave publicável é pública por natureza (a proteção está nas regras RLS)
var SB_PADRAO={url:"https://oovqekytlhkbinfdxjwf.supabase.co",key:"sb_publishable_-RFfe7R5-JQ6ok2Hfmdmmw_YTlcnYpr"};
function sbCfg(){try{const c=JSON.parse(localStorage.getItem(SB_CFG_KEY)||"null");return c&&c.url&&c.key?c:SB_PADRAO}catch(e){return SB_PADRAO}}
var SBC=null,SBSES=null,SBMEMBRO=null,SBERR="",SBEU=null,SBSID=Math.random().toString(36).slice(2,10),SBRT=null; // var: usadas cedo no arranque (sem TDZ)
// 0.9.148: a sessão de entrada é a única coisa que fica no navegador, e só no sessionStorage verdadeiro (apaga-se ao fechar o navegador).
// É preciso porque a entrada com a Microsoft sai da página e volta. A sessão das versões antigas (localStorage) passa para lá uma vez.
function sbArmazem(){const R=(window.__g360Mem&&window.__g360Mem.real)||{},ss=R.ss,ls=R.ls;
  if(!ss)return {getItem:k=>null,setItem:()=>{},removeItem:()=>{}};
  try{if(ls)for(const k of [SB_SES_KEY,SB_SES_KEY+"-code-verifier",SB_SES_KEY+"-user"]){const v=ls.getItem(k);if(v!=null){if(ss.getItem(k)==null)ss.setItem(k,v);ls.removeItem(k)}}}catch(e){}
  return {getItem:k=>{try{return ss.getItem(k)}catch(e){return null}},setItem:(k,v)=>{try{ss.setItem(k,v)}catch(e){}},removeItem:k=>{try{ss.removeItem(k)}catch(e){}}}}
async function sbCliente(){if(SBC)return SBC;const c=sbCfg();if(!c)throw new Error("A base de dados (Supabase) ainda não está configurada.");
  const {createClient}=await import(new URL("../esm/supabase-2.117.3.min.js",location.href).href);
  SBC=createClient(c.url,c.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:"pkce",storageKey:SB_SES_KEY,storage:sbArmazem()}});
  SBC.auth.onAuthStateChange((ev,ses)=>{SBSES=ses||null;if(!ses)SBMEMBRO=null;try{sbUI()}catch(e){}});return SBC}
const SB_PRONTO=(async()=>{if(!sbCfg())return;try{const sb=await sbCliente();const {data}=await sb.auth.getSession();SBSES=data&&data.session||null;
  if(SBSES){try{await sb.rpc("g360_reclamar_admin")}catch(e){} // o primeiro a entrar, sem administradores, fica administrador
    const r=await sb.rpc("g360_eu");if(r.error)SBERR=sbErroMsg(r.error);else{SBEU=r.data||null;SBMEMBRO=SBEU&&SBEU.perfil?SBEU:null}}
  if(/[?&]code=/.test(location.search))history.replaceState(null,"",location.pathname+location.hash)}catch(e){SBERR=e.message||String(e)}try{sbUI()}catch(e){}})();
function sbErroMsg(e){const m=(e&&e.message)||String(e);if(e&&(e.code==="42501"||/row-level security|permission denied/i.test(m)))return "a sua conta não tem permissão na base de dados (não está em g360_membros como Direção)";
  if(e&&(e.code==="PGRST205"||e.code==="42P01")||/does not exist|schema cache/i.test(m))return "a base de dados ainda não foi preparada (falta correr o script SQL)";
  if(/JWT|401|not authenticated/i.test(m))return "a sessão da base de dados terminou — entre de novo";return m}
function nuvSB(){try{return !!(SBSES&&sbCfg()&&!RO&&SBMEMBRO&&(SBMEMBRO.admin||SBMEMBRO.perfil==="dexec"||SBMEMBRO.perfil==="dped"))}catch(e){return false}}

/* 0.9.49: tempo real — quando outro computador (ou o iPad) da Direção grava, este vai buscar logo a alteração */
// 0.9.52: não interrompe quem está a escrever — espera que pare (ou saia da caixa) antes de trazer a alteração do outro computador
var ULT_ESCRITA=0,ULT_ES=0; // ULT_ES: último toque dentro do Horários360 (não se recarrega o horário enquanto se mexe nele)
["input","keydown","compositionstart"].forEach(ev=>document.addEventListener(ev,e=>{const t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))ULT_ESCRITA=Date.now()},true));
const aEscrever=()=>{const a=document.activeElement,dt=Date.now()-ULT_ESCRITA;return dt<4000||(dt<30000&&!!(a&&/^(INPUT|TEXTAREA)$/.test(a.tagName)&&!/^(checkbox|radio|button|submit|file|range|color)$/i.test(a.type||"")&&a.closest&&a.closest("main")))};
function sbTempoReal(){if(SBRT||!nuvSB())return;let h=null;
  const trazer=()=>{clearTimeout(h);h=setTimeout(()=>{if(NUV.ocupado||aEscrever()||document.querySelector(".impov.on")||(curTab==="esch"&&Date.now()-(ULT_ES||0)<20000)){trazer();return}nuvemSincMS().catch(()=>{})},1500)};
  sbCliente().then(sb=>{SBRT=sb.channel("g360-estado").on("postgres_changes",{event:"*",schema:"public",table:"g360_estado"},p=>{const r=p.new||{};if(String(r.por||"").endsWith("#"+SBSID))return;trazer()}).subscribe()}).catch(()=>{})}
function sbAtivo(){try{return !!(SBSES&&sbCfg())}catch(e){return false}}
// 0.9.113: trinco entre computadores (Supabase): só um computador de cada vez faz as leituras automáticas da Box. Se falhar, não impede.
async function trincoNuvem(nome,seg){try{if(!nuvSB())return true;const r=await sbRpc("g360_trinco",{p_nome:nome,p_dono:BU_DEV,p_seg:seg});return r!==false}catch(e){return true}}
async function sbRpc(f,a){const sb=await sbCliente();const {data,error}=await sb.rpc(f,a||{});if(error){const x=new Error(error.code==="42501"?(error.message||"Sem permissão."):sbErroMsg(error));x.code=error.code;throw x}return data}
const b64DeBuf=buf=>{const u=new Uint8Array(buf);let s="";for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s)};
const bufDeB64=b=>{const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u.buffer};
async function sbNuvem(method,name,body,t){const sb=await sbCliente();
  if(method==="GET"&&!name){const {data,error}=await sb.from("g360_estado").select("nome,t");if(error)throw new Error(sbErroMsg(error));
    const itens={};(data||[]).forEach(x=>{itens[x.nome]={t:+x.t||0}});return new Response(JSON.stringify({ok:true,itens}),{headers:{"Content-Type":"application/json"}})}
  if(method==="GET"){const {data,error}=await sb.from("g360_estado").select("dados").eq("nome",name).maybeSingle();if(error)throw new Error(sbErroMsg(error));
    if(!data)return new Response(null,{status:404});return new Response(bufDeB64(data.dados))}
  NUV_VOO=(NUV_VOO||0)+1;try{
  const buf=body instanceof ArrayBuffer?body:await new Response(body).arrayBuffer();
  const {error}=await sb.from("g360_estado").upsert({nome:name,dados:b64DeBuf(buf),t:t||Date.now(),por:String(SBSES&&SBSES.user&&SBSES.user.email||"")+"#"+SBSID},{onConflict:"nome"});
  if(error)throw new Error(sbErroMsg(error));return new Response(JSON.stringify({ok:true}),{headers:{"Content-Type":"application/json"}})}finally{NUV_VOO--}}
async function sbEntrar(){const sb=await sbCliente();let hint="";try{hint=EU&&EU.email||""}catch(e){}
  const {error}=await sb.auth.signInWithOAuth({provider:"azure",options:{scopes:"email openid profile offline_access",redirectTo:location.origin+location.pathname,queryParams:hint?{login_hint:hint}:{}}});if(error)throw error}
async function sbSair(){try{const sb=await sbCliente();await sb.auth.signOut()}catch(e){}SBSES=null;SBMEMBRO=null;sbUI()}
function sbUI(){const el=$("#sbEstado");if(!el)return;const c=sbCfg();if($("#sbUrl")&&c&&!$("#sbUrl").value){$("#sbUrl").value=c.url;$("#sbKey").value=c.key}
  const em=SBSES&&SBSES.user&&SBSES.user.email;
  el.innerHTML=!c?`<div class="msg info" style="margin:10px 0 0">Ainda não configurada: a app continua a guardar como antes. Siga os passos abaixo e cole aqui o endereço e a chave publicável do projeto.</div>`
   :!em?`<div class="msg info" style="margin:10px 0 0">Configurada. Falta entrar com a conta da Microsoft da escola. <button class="b s" id="sbGo" style="margin-left:6px">Entrar com a Microsoft</button></div>`
   :SBERR?`<div class="msg bad" style="margin:10px 0 0">Entrou como <b>${esc(em)}</b>, mas: ${esc(SBERR)}. <button class="b s" id="sbOut" style="margin-left:6px">Sair</button></div>`
   :nuvSB()?`<div class="msg ok" style="margin:10px 0 0">${ico("cloud")} Ligada como <b>${esc(em)}</b> (${esc(SBMEMBRO.admin?"administrador":PERFIL_CURTO[SBMEMBRO.perfil]||SBMEMBRO.perfil)}). A nuvem da EPISJ 360 é agora esta base de dados. <button class="b s" id="sbPush" style="margin-left:6px">Enviar tudo agora</button><button class="b s" id="sbOut" style="margin-left:6px">Sair</button></div>`
   :`<div class="msg bad" style="margin:10px 0 0">Entrou como <b>${esc(em)}</b>, mas esta conta não está na tabela <code>g360_membros</code> como Direção. Acrescente-a no Supabase (Table Editor › g360_membros). <button class="b s" id="sbOut" style="margin-left:6px">Sair</button></div>`;
  const g=$("#sbGo");if(g)g.onclick=()=>sbEntrar().catch(e=>toast(e.message||String(e)));
  const o=$("#sbOut");if(o)o.onclick=()=>sbSair();
  const pu=$("#sbPush");if(pu)pu.onclick=()=>guardarAgora()}

/* 0.9.44: se a Direção entra e não há dados nem aqui nem na base de dados, vai buscá-los às cópias que ficaram neste computador
   (cópia no IndexedDB, pontos de restauro, incluindo os antigos) — junta a mais completa, sem apagar nada, e envia para a base de dados */
async function recuperarLocal(){if(RO||!podePublicar())return;const tem=c=>{try{const e=c.escola||{};return (c.profs||[]).length+(e.turmas||[]).length+(e.planos||[]).length+(c.mods||[]).length}catch(x){return 0}};
  if(tem(cfg)>0){nuvemAgendar();return}
  const cands=[];try{const c=await DB.get("kv","cfgCopia");if(c&&c.s)cands.push({t:c.t||0,cfg:c.s,label:"cópia guardada neste navegador"})}catch(e){}
  try{rpList().forEach(p=>cands.push(p))}catch(e){}
  try{const v=await DB.get("kv","pontosAntigos");if(Array.isArray(v))v.forEach(p=>cands.push(p))}catch(e){}
  let melhor=null,mn=0;for(const p of cands){try{const c=JSON.parse(p.cfg),n=tem(c);if(n>mn||(n===mn&&n>0&&(p.t||0)>(melhor.t||0))){melhor={...p,o:c};mn=n}}catch(e){}}
  if(!melhor||!mn)return;
  cfg=juntarCfg(cfg,melhor.o);migrate();save();try{localStorage.setItem("boxcheck_cfg_t",String(Date.now()))}catch(e){}
  try{refreshAll()}catch(e){}nuvemAgendar();toast("Recuperei os dados da escola que estavam guardados neste computador ("+(melhor.label||"ponto de restauro")+")")}
/* 0.9.37: a nuvem da EPISJ 360 passa a funcionar com a conta do Office 365 da Direção (serviço de avisos, /guide/sync),
   sem precisar de a Box estar ligada; sem Office 365, continua a usar o serviço de login da Box como antes */
function nuvMS(){try{return !!(MSACC&&EU&&!EU.provisorio&&!RO&&(EU.admin||EU.perfil==="dexec"||EU.perfil==="dped"))}catch(e){return false}}
function nuvDesl(){try{return NUV.ativo===false&&!nuvSB()}catch(e){return false}}
function NUVOK(){try{return nuvSB()||nuvMS()||!!(SES&&workerUrl())}catch(e){return false}}
async function nuvemSincMS(){if(!nuvMS()&&!nuvSB())return;
  try{await nuvemTrazer()}catch(e){}try{await avTrazerNuvem()}catch(e){}try{await rcTrazer(false)}catch(e){}try{await esTrazerNuvem()}catch(e){}try{await crTrazerNuvem()}catch(e){}try{await papTrazerNuvem()}catch(e){}try{await pwTrazerNuvem()}catch(e){}try{await foTrazerNuvem()}catch(e){}try{await ecoTrazerNuvem()}catch(e){}try{await h3TrazerNuvem()}catch(e){}try{await cpAnularTrazer()}catch(e){}try{await rpTrazer()}catch(e){}
  try{guidePubAgendar()}catch(e){}nuvemUI()}
async function nuvem(method,name,body,t){
  if(nuvSB()){const r=await sbNuvem(method,name,body,t);NUV.ativo=true;NUV.via="sb";if(method==="GET"&&!name)return nuvListaPos(r);return r}
  NUV.via=nuvMS()?"ms":"box";
  const M=nuvMS(),w=M?AVISOS_WORKER+"/guide":workerUrl();if(!w||(!M&&!SES))throw new Error("sem sessão");
  const H={Authorization:"Bearer "+(M?await guideTok():await accessToken())};if(t)H["X-T"]=String(t);
  let r;try{r=await fetch(w+"/sync"+(name?"/"+encodeURIComponent(name):""),{method,headers:H,body})}
  catch(e){if(NUV.ativo!==true){NUV.ativo=false;nuvemUI();const x=new Error("serviço sem armazenamento");x.kind="nokv";throw x}throw e} // serviço antigo: recusa o pedido
  if(r.status===501){NUV.ativo=false;nuvemUI();const e=new Error("sem armazenamento");e.kind="nokv";throw e}
  if(r.status===404&&method==="GET"&&!name){NUV.ativo=false;nuvemUI();const e=new Error("serviço antigo");e.kind="nokv";throw e}
  if(!r.ok)throw new Error("o serviço respondeu "+r.status);
  NUV.ativo=true;
  if(method==="GET"&&!name)return nuvListaPos(r);
  return r}
async function nuvListaPos(r){{const j=await r.json(),it=j.itens||{};let g=gerLocal();
    // 0.9.148: com a memória vazia (nada guardado no computador) basta passar a contar a partir do último recomeço, sem recarregar
    if(it.reset&&(it.reset.t||0)>g&&!g){try{localStorage.setItem("episj_ger",String(it.reset.t))}catch(e){}g=it.reset.t}
    if(it.reset&&(it.reset.t||0)>g){await limparLocal(it.reset.t);toast("Foi apagado tudo noutro computador — a recomeçar");setTimeout(()=>location.reload(),900);const x=new Error("recomeço");x.kind="nokv";throw x}
    if(g)for(const k in it)if(k!=="reset"&&(it[k].t||0)<g)delete it[k]; // o que ficou na nuvem de antes do recomeço já não conta
    return new Response(JSON.stringify(j),{headers:{"Content-Type":"application/json"}})}}
/* ---------- 0.9.22: Apagar tudo e começar de novo (fica só a ligação à Box e ao Office 365) ---------- */
const gerLocal=()=>+(localStorage.getItem("episj_ger")||0);
const MANTER=k=>["boxdoc_ses","boxdoc_worker","guide_ms","episj_ger","boxcheck_letra","g360_sb","episj360.sb"].includes(k)||/^msal|login\.windows|login\.microsoftonline/i.test(k);
async function limparLocal(ger){LIMPAR=true;try{await legadoApagar()}catch(e){}
  try{const ks=[];for(let i=0;i<localStorage.length;i++)ks.push(localStorage.key(i));ks.forEach(k=>{if(!MANTER(k))localStorage.removeItem(k)});localStorage.setItem("episj_ger",String(ger))}catch(e){}
  await new Promise(ok=>{try{const r=indexedDB.deleteDatabase("boxcheck");r.onsuccess=r.onerror=r.onblocked=()=>ok()}catch(e){ok()}setTimeout(ok,3000)})}
async function apagarTudoRecomecar(){
  try{if(NUVOK()&&!nuvDesl())await nuvem("PUT","copia_antes_de_apagar",await gz({cfg:JSON.stringify(cfg),logos:LOGOS,roomcheck:RC,horarios:ESD,pontos:rpList(),modelos:TPL,t:Date.now()}),Date.now())}catch(e){} // 0.9.148: cópia de segurança na base de dados (antes era um ficheiro descarregado para o computador)
  const ger=Date.now();
  if(NUVOK()&&!nuvDesl()){try{
    await nuvem("PUT","reset",await gz({ger}),ger);
    await nuvem("PUT","estado",await gz({cfg:JSON.stringify({...defaultCfg(),ger}),logos:{},pontos:[],tpl:null,folder:null,root:"",bases:{},resumos:{}}),ger);
    await nuvem("PUT","rc",await gz({esp:RC_ESP0.map(x=>({...x})),cfg:{abre:480,fecha:1140,sab:false},res:{},et:ger,ger}),ger);
    await nuvem("PUT","ES",await gz({t:ger,ger,porAno:{},copias:{},mapaT:{},mapaC:{},ligT:{},ligC:{},mapaA:{},ligA:{}}),ger)}
    catch(e){if(!confirm("Não foi possível apagar na nuvem ("+(e.message||e)+"). Apagar só neste computador? (noutro computador os dados voltariam a aparecer)"))return}}
  await limparLocal(ger);location.reload()}
/* 0.9.148: nada fica no computador, por isso o que ainda não foi para a nuvem perde-se se a página fechar.
   Os envios adiados (alguns segundos depois de cada alteração) ficam numa fila: ao esconder ou fechar a página saem logo,
   e o navegador pergunta antes de fechar enquanto houver envios por acabar. */
var NUV_FILA=NUV_FILA||new Map(),NUV_VOO=NUV_VOO||0; // var: podem ser usadas no arranque, antes de esta linha correr
function nuvFila(nome,fn,ms){NUV_FILA=NUV_FILA||new Map();const x=NUV_FILA.get(nome);if(x)clearTimeout(x.h);const o={fn};o.h=setTimeout(()=>{NUV_FILA.delete(nome);try{fn()}catch(e){}},ms);NUV_FILA.set(nome,o);return o.h}
function nuvFilaJa(){if(!NUV_FILA)return;for(const [n,o] of [...NUV_FILA]){clearTimeout(o.h);NUV_FILA.delete(n);try{o.fn()}catch(e){}}}
function nuvPorEnviar(){return (NUV_FILA?NUV_FILA.size:0)+(NUV_VOO||0)}
addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")nuvFilaJa()});
addEventListener("pagehide",()=>{nuvFilaJa()});
addEventListener("beforeunload",e=>{if(LIMPAR)return;nuvFilaJa();if(nuvPorEnviar()>0){e.preventDefault();e.returnValue="A EPISJ 360 ainda está a guardar na nuvem. Se sair agora, as últimas alterações perdem-se."}});
async function nuvemPut(name,obj,t){if(nuvDesl()||LIMPAR)return;t=t||Date.now();
  try{await nuvem("PUT",name,await gz(obj),t);nuvSetT(name,t);NUV.ultimo=Date.now();NUV.erro=""}
  catch(e){if(e.kind!=="nokv")NUV.erro=e.message}
  nuvemUI()}
async function nuvemGet(name){return ungz(await (await nuvem("GET",name)).arrayBuffer())}
function nuvemUI(){const el=$("#nuvemMsg");if(!el)return;
  if(!NUVOK()){el.innerHTML="";return}
  if(nuvDesl()){el.innerHTML=nuvMS()?`<div class="msg info">Para guardar tudo na nuvem com a conta do Office 365, atualize o serviço de avisos na Cloudflare com o ficheiro <code>servidor/boxcheck-avisos.js</code> da EPISJ 360 (versão 0.9.37 ou mais recente). Até lá, fica tudo guardado só neste navegador.</div>`:`<div class="msg info">Para guardar tudo na nuvem e continuar noutro computador sem repetir a análise, falta ligar o armazenamento ao serviço de login (3 passos no LEIA-ME). Até lá, fica tudo guardado só neste navegador.</div>`;return}
  if(NUV.erro){el.innerHTML=`<div class="msg bad">Não foi possível guardar na nuvem (${esc(NUV.erro)}). Fica guardado neste navegador; volta a tentar sozinho.</div>`;return}
  el.innerHTML=NUV.ultimo?`<div class="msg ok">${ico("cloud")} Tudo guardado na nuvem às ${new Date(NUV.ultimo).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})} — noutro computador basta entrar com ${nuvMS()?"a conta do Office 365":"a Box"}.</div>`:NUV.ativo?`<div class="msg ok">${ico("cloud")} Guardado na nuvem — noutro computador basta entrar com ${nuvMS()?"a conta do Office 365":"a Box"}.</div>`:""}
// configuração e o resto do estado (pequeno): enviado alguns segundos depois de cada alteração
function estadoAtual(){lgDoNavegador();let root="";try{root=localStorage.getItem("box_last_root")||""}catch(e){}
  return{cfg:JSON.stringify(cfg),logos:LOGOS,pontos:(()=>{try{if(nuvSB())return[]}catch(e){}return rpList()})(),tpl:TPL,folder:curFolder,root,bases:basesIdx(),resumos:resumos()}} // 0.9.48: no Supabase os pontos de restauro não viajam (a base de dados guarda o histórico de versões)
let nuvH=null;
function nuvemAgendar(){try{NUV}catch(e){setTimeout(nuvemAgendar,0);return} // pode ser chamada ao arrancar, antes de NUV existir
  if(nuvDesl()||!NUVOK()||NUV.ocupado)return;clearTimeout(nuvH);nuvFila("nuvH",()=>nuvemPut("estado",estadoAtual(),cfgT()||Date.now()),8000)}
function nuvemListagem(j){if(!NUVOK())return;nuvemPut("L_"+j.rootId,j,j.t).then(()=>nuvemAgendar())}
async function nuvemBases(rootId){if(!NUVOK()||nuvDesl())return;const l=basesIdx()[rootId]||[];const out=[];
  for(const b of l){const x=await lerBase(rootId,b.t);if(x)out.push(x)}
  await nuvemPut("B_"+rootId,out);nuvemAgendar()}
const b64=u=>{let s="";const a=new Uint8Array(u.buffer,u.byteOffset,u.byteLength);for(let i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s)};
const unb64=s=>{const b=atob(s),a=new Uint8Array(b.length);for(let i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return new Uint32Array(a.buffer)};
let nuvTxN=-1;
/* 0.9.175: os textos dos documentos já lidos deixaram de ir numa só peça «tx» reescrita inteira a cada leitura (passava dos 6 MB e a base de
   dados cancelava a gravação: «statement timeout»). A «tx» antiga fica como está (só se lê) e os textos novos vão em peças pequenas
   «tx1», «tx2»… (até ~2,5 MB cada): só se reescreve a última peça, enquanto for pequena. Só se grava depois de ler as peças da nuvem,
   para saber o que já lá está. */
var TX_NUV=TX_NUV||new Set(),TX_LIDO=TX_LIDO||false,TX_PECA=TX_PECA||null; // assinaturas já na nuvem; peças lidas; última peça pequena {nome,arr,len}
const TX_MAX=2500000,txAss=r=>r.sha1+"|"+(r.c!=null?1:0),txReg=r=>r.sig?{...r,sig:b64(r.sig)}:r;
async function nuvemTextos(force){if(!NUVOK()||nuvDesl()||!TX_LIDO)return;if(!force&&TX.size===nuvTxN)return;nuvTxN=TX.size;
  const novos=[];for(const r of TX.values())if(r&&r.sha1&&!TX_NUV.has(txAss(r)))novos.push(txReg(r));if(!novos.length)return;
  let idx={};try{idx=(await (await nuvem("GET","")).json()).itens||{}}catch(e){return}
  let max=0;for(const k in idx){const m=/^tx(\d+)$/.exec(k);if(m)max=Math.max(max,+m[1])}
  let peca=TX_PECA&&TX_PECA.nome==="tx"+max?TX_PECA:{nome:"tx"+(max+1),arr:[],len:0};
  for(const r of novos){const n=JSON.stringify(r).length;if(peca.arr.length&&peca.len+n>TX_MAX){await txGravar(peca);peca={nome:"tx"+(+peca.nome.slice(2)+1),arr:[],len:0}}peca.arr.push(r);peca.len+=n}
  await txGravar(peca)}
async function nuvemTextosJa(f){try{await nuvemTextos(f)}catch(e){console.warn("textos na nuvem",e)}}
async function txGravar(p){const t=Date.now();NUV.erro="";await nuvemPut(p.nome,p.arr,t);if(NUV.erro)throw new Error(NUV.erro);
  for(const r of p.arr)TX_NUV.add(txAss(r));nuvSetT(p.nome,t);TX_PECA=p.len<TX_MAX?p:null}
// ao entrar: traz o que for mais recente na nuvem e envia o que for mais recente aqui
// 0.9.154: nuvemTrazer(true) traz só a configuração (formadores, escola, atribuições) — o que a entrada precisa; as análises das pastas,
// as contagens e os textos dos documentos (o que pesa) vêm depois, em segundo plano, com nuvemTrazer()
async function nuvemTrazer(so1){
  if(!NUVOK())return;if(!so1&&NUV.ocupado){for(let i=0;i<60&&NUV.ocupado;i++)await new Promise(r=>setTimeout(r,500))}NUV.ocupado=true;let mudou=false;
  try{
    const idx=(await (await nuvem("GET","")).json()).itens||{},L=nuvT();
    // 1) configuração, pontos de restauro, modelos, pasta
    const E=idx.estado;
    if(E&&(E.t||0)>cfgT()){const e=await nuvemGet("estado");
      const vazio=!cfg.mods.length&&!cfg.profs.length;
      if(!vazio&&e.cfg!==JSON.stringify(cfg)&&Date.now()-(window.__pontoNuv||0)>30*60e3){window.__pontoNuv=Date.now();ponto("Antes de trazer da nuvem a configuração de outro computador")} // 0.9.49: no máximo um ponto por meia hora (com o tempo real)
      cfg=juntarCfg(JSON.parse(e.cfg),cfg);migrate();lastJSON=JSON.stringify(cfg);cfgRev++;persist(lastJSON); // 0.9.22: junta, não substitui
      const fica=lastJSON!==e.cfg; // havia aqui coisas que a nuvem não tinha: voltam a ser enviadas
      try{localStorage.setItem("boxcheck_cfg_t",String(fica?Date.now():E.t));if(fica)setTimeout(nuvemAgendar,0);
        const rp=rpList(),ts=new Set(rp.map(p=>p.t));const juntos=rp.concat((e.pontos||[]).filter(p=>!ts.has(p.t))).sort((a,b)=>b.t-a.t).slice(0,25);localStorage.setItem(RPKEY,JSON.stringify(juntos));
        if(e.logos&&typeof e.logos==="object"){if(lgJuntar(e.logos))mudou=true}
        if(e.tpl&&e.tpl.itens){TPL=e.tpl;tplRev++;localStorage.setItem("boxcheck_modelos",JSON.stringify(TPL))}
        if(e.bases){const bi=basesIdx();for(const k in e.bases)if(!bi[k]||!bi[k].length)bi[k]=e.bases[k];localStorage.setItem("box_bases",JSON.stringify(bi))}
        if(e.folder&&e.folder.id&&curFolder.id==="0"){curFolder=e.folder;localStorage.setItem("box_last_folder",JSON.stringify(curFolder))}
        if(e.root&&!localStorage.getItem("box_last_root"))localStorage.setItem("box_last_root",e.root)}catch(x){}
      mudou=true}
    // 0.9.91: os logótipos das Definições vêm sempre da nuvem quando faltam aqui (antes só vinham se a configuração da nuvem fosse mais recente,
    // e um computador com configuração própria mais recente ficava sem os logótipos do canto esquerdo e do canto direito)
    else if(E&&(!LOGOS.main||!LOGOS.right)&&!window.__lgNuv){window.__lgNuv=1;try{const e=await nuvemGet("estado");if(e&&e.logos&&typeof e.logos==="object"&&lgJuntar(e.logos))mudou=true}catch(x){}}
    else if(!E?(cfg.mods.length||cfg.profs.length):cfgT()>(E.t||0)){if(!cfgT())localStorage.setItem("boxcheck_cfg_t",String(Date.now()));await nuvemPut("estado",estadoAtual(),cfgT())}
    if(!so1){
    // 2) análises de cada pasta
    const R=resumos();
    for(const k in idx){if(!k.startsWith("L_"))continue;const root=k.slice(2),loc=R[root];
      if(!loc||(idx[k].t||0)>(loc.t||0)){const j=await nuvemGet(k);
        if(j&&j.apagada){if(loc){await apagarAnaliseLocal(root);mudou=true}nuvSetT(k,j.t);continue} // 0.9.88: apagada noutro computador
        const last=localStorage.getItem("box_last_root");await guardarListagem(j);
        if(last)try{localStorage.setItem("box_last_root",last)}catch(x){}
        nuvSetT(k,j.t);if(!lastListing||lastListing.rootId===root||(!last&&curFolder.id===root))useListing(j,true);mudou=true}}
    for(const root in R){const k="L_"+root;if(!idx[k]||(R[root].t||0)>(idx[k].t||0)){const j=await lerListagem(root);if(j)await nuvemPut(k,j,j.t)}}
    // 3) contagens do painel Alterações
    for(const k in idx){if(!k.startsWith("B_"))continue;const root=k.slice(2);
      if((idx[k].t||0)>(L[k]||0)){const arr=await nuvemGet(k);const bi=basesIdx();const have=new Set((bi[root]||[]).map(b=>b.t));
        for(const b of arr){await DB.put("listagens","B|"+root+"|"+b.t,b);if(!have.has(b.t))(bi[root]=bi[root]||[]).push({t:b.t,quando:b.quando,label:b.label,n:b.itens.length})}
        if(bi[root])bi[root].sort((a,b)=>b.t-a.t);try{localStorage.setItem("box_bases",JSON.stringify(bi))}catch(x){}nuvSetT(k,idx[k].t)}}
    for(const root in basesIdx())if(!idx["B_"+root])await nuvemBases(root);
    // 4) documentos já lidos (não voltam a ser pedidos à Box)
    await textosProntos;
    // 0.9.175: «tx» (antiga, só leitura) e as peças «tx1», «tx2»…
    {const ks=Object.keys(idx).filter(k=>/^tx\d*$/.test(k)).sort((a,b)=>(+a.slice(2)||0)-(+b.slice(2)||0));let n=0,ok=true;
      for(const k of ks){if((idx[k].t||0)<=(L[k]||0))continue;let arr;try{arr=await nuvemGet(k)}catch(e){ok=false;break}if(!Array.isArray(arr))continue;let len=0;
        for(const r of arr){if(!r||!r.sha1)continue;TX_NUV.add(txAss(r));if(k!=="tx")len+=JSON.stringify(r).length;
          if(TX.has(r.sha1)){const o=TX.get(r.sha1);if(r.c!=null&&o.c==null){o.c=r.c;delete o.cx;await DB.put("textos",r.sha1,o);n++}continue} // 0.9.101: cabeçalho lido noutro computador
          const x=Object.assign({},r);if(x.sig)x.sig=unb64(x.sig);TX.set(x.sha1,x);await DB.put("textos",x.sha1,x);n++}
        if(k!=="tx"&&k===ks[ks.length-1]&&len<TX_MAX)TX_PECA={nome:k,arr,len};nuvSetT(k,idx[k].t)}
      if(n){txRev++;mudou=true}if(ok)TX_LIDO=true}
    if(TX.size&&TX_LIDO)await nuvemTextosJa(true);
    // 0.9.113: contador dos pedidos à Box (somado entre computadores)
    if(idx.BU&&(idx.BU.t||0)>(L.BU||0)){try{buJuntar(await nuvemGet("BU"))}catch(x){}nuvSetT("BU",idx.BU.t)}
    }
    NUV.ultimo=NUV.ultimo||Date.now();
  }catch(e){if(e.kind!=="nokv"){NUV.erro=e.message;console.warn(e)}}
  finally{NUV.ocupado=false;nuvemUI()}
  if(mudou){refreshAll();renderRP();showLast();scanHint();await carregarRef();if(Date.now()-(window.__toastNuv||0)>60000){window.__toastNuv=Date.now();toast("Trazida da nuvem a informação guardada noutro computador")}}
  return mudou}

