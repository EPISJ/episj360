/* ===================== 0.9.73: Social360 — planeamento das redes sociais =====================
   A página do módulo está em social360/ e abre numa janela dentro da EPISJ 360 (como o Horários360).
   A EPISJ 360 dá-lhe só o que precisa: a sessão do Office 365 (para ler e gravar na tabela s360_docs do Supabase,
   protegida por regras: a Direção vê tudo, os outros só os espaços onde foram juntados), quem é a conta e a lista de formadores. */
var S3_VER="0.4",S3_OK=false,S3_PEND="feed",S3_RES=null; // var e funções: o arranque pode abrir o Social360 antes de este bloco correr
function s3View(t){return ({s3feed:"feed",s3cal:"calendario",s3grid:"grelha",s3list:"lista",s3ap:"aprovacoes",s3inbox:"inbox",s3an:"analise",s3media:"media",s3def:"definicoes"})[t]||"feed"}
function s3Tab(v){return ({feed:"s3feed",calendario:"s3cal",grelha:"s3grid",lista:"s3list",aprovacoes:"s3ap",inbox:"s3inbox",analise:"s3an",media:"s3media",definicoes:"s3def"})[v]||""}
document.querySelectorAll("[data-s3ver]").forEach(e=>e.textContent=S3_VER);
function s3Post(m){try{const fr=$("#s3Fr");fr&&fr.contentWindow&&fr.contentWindow.postMessage(Object.assign({s360p:1},m),location.origin)}catch(e){}}
function s3Mostrar(t){const sec=$("#s360");if(sec)sec.classList.add("on");document.body.classList.add("s360");const fr=$("#s3Fr"),v=s3View(t);
  if(!fr.getAttribute("src")){S3_PEND=v;fr.src="social360/index.html?v="+(S3_VER||"0.1")}else s3Post({t:"view",v})}
async function s3Token(){try{if(!sbAtivo())return {};const sb=await sbCliente();const {data}=await sb.auth.getSession();const x=data&&data.session;return x?{token:x.access_token,exp:x.expires_at||0}:{}}catch(e){return {}}}
function s3Eu(){const e=EU||{},m=SBMEMBRO||SBEU||{};const em=String(e.email||(SBSES&&SBSES.user&&SBSES.user.email)||"").toLowerCase();const perfil=m.perfil||e.perfil||"";const admin=!!(m.admin||e.admin);
  return {email:em,nome:e.nome||"",perfil,admin,direcao:admin||perfil==="dexec"||perfil==="dped"}}
function s3Pessoas(){const M=new Map();try{(cfg.profs||[]).forEach(p=>{const em=String(p.email||"").toLowerCase();if(/@/.test(em))M.set(em,p.nome||"")})}catch(e){}return [...M].map(([email,nome])=>({email,nome}))}
function s3Badge(n,ap){document.querySelectorAll("[data-s3b]").forEach(b=>{const v=b.dataset.s3b==="n"?n:ap;b.textContent=v?String(v>99?"99+":v):""})}
window.addEventListener("message",async e=>{const fr=$("#s3Fr");if(e.origin!==location.origin||!e.data||!e.data.s360||!fr||e.source!==fr.contentWindow)return;const d=e.data;
  if(d.t==="hello"){const tk=await s3Token(),c=sbCfg();s3Post({rid:d.rid,mode:tk.token?"sb":"local",url:c&&c.url,key:c&&c.key,token:tk.token||"",exp:tk.exp||0,me:s3Eu(),pessoas:s3Pessoas(),view:S3_PEND,ro:!!(RO||PREV)});return}
  if(d.t==="token"){const tk=await s3Token();s3Post(Object.assign({rid:d.rid},tk));return}
  if(d.t==="view"){const t=s3Tab(d.v);if(t&&curTab!==t){curTab=t;document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("on",b.dataset.t===t))}return}
  if(d.t==="badge")s3Badge(+d.n||0,+d.ap||0)});
// quem não é da Direção vê o Social360 se estiver num espaço de trabalho; e um resumo para o widget do Painel
(async()=>{try{await SB_PRONTO;if(!sbAtivo())return;S3_OK=!!(await sbRpc("s360_acesso"));if(!S3_OK)return;
  try{aplicarPerfil()}catch(e){}
  const sb=await sbCliente();const {data}=await sb.from("s360_docs").select("id,ws,st:dados->>status,dt:dados->>date").eq("col","posts").limit(5000);S3_RES=data||[];
  if(curTab==="esc")try{renderEscPainel()}catch(e){}}catch(e){}})();
WG_MOD.social={l:"So",c:"#ff6f9e",n:"Social360"};
WIDGETS.push({id:"s3sem",mod:"social",nome:"Redes sociais esta semana",desc:"Publicações agendadas para os próximos 7 dias e as que esperam aprovação no Social360",r(){
  if(!S3_RES)return wgVazio("A carregar o Social360…")+wgIr("s3feed","Abrir o Social360");
  const ag=Date.now(),fim=ag+7*864e5,sem=S3_RES.filter(p=>p.st==="scheduled"&&p.dt&&+new Date(p.dt)>=ag&&+new Date(p.dt)<=fim),rev=S3_RES.filter(p=>p.st==="review");
  if(!sem.length&&!rev.length)return wgVazio("Nada agendado para os próximos 7 dias.")+wgIr("s3cal","Abrir o calendário");
  return `<div class="wg-lst"><div class="wg-li"><i class="wg-dot" style="background:#2563eb"></i><span class="wg-el"><b>${sem.length}</b> agendada${sem.length===1?"":"s"} para os próximos 7 dias</span></div><div class="wg-li"><i class="wg-dot" style="background:#d97706"></i><span class="wg-el"><b>${rev.length}</b> à espera de aprovação</span></div></div>`+wgIr(rev.length?"s3ap":"s3cal",rev.length?"Ver as aprovações":"Abrir o calendário")}});
