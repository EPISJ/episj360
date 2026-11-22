/* ---------- prazos de entrega e avisos automáticos (v1.14) ---------- */
// tipo do módulo: "mod" (Módulo), "uc" (UC) ou "ufcd" (UFCD)
const TIPOS_MOD=[["mod","Módulos"],["uc","UC"],["ufcd","UFCD"]];
function tipoMod(m){const n=norm(m.cod||m.nome||"");
  if(/^uc\s*\d/.test(n))return "uc";if(/^ufcd/.test(n))return "ufcd";if(/^(modulo|mod\.?)\s*/.test(n))return "mod";
  if(/^\d{4}(?!\d)/.test(n))return "ufcd";return "mod"}
const avCfg=()=>{cfg.avisosCfg=Object.assign({auto:false,hora:"09:00",para:"",servidor:false,url:"",remetente:""},cfg.avisosCfg||{});return cfg.avisosCfg};
const prazos=()=>cfg.prazos||(cfg.prazos=[]);
const AV_MAX=3;
const AVISO_TPL=[
  {nome:"Lembrete antes do prazo",quando:"antes",dias:7,rep:0,max:1,dest:"falta",
   subj:"Lembrete: {prazo_nome} — entrega até {prazo}",
   body:"Olá {primeiro_nome},\n\nLembro que o prazo para a entrega de {documentos} na Box termina no dia {prazo} (faltam {dias} dia(s)).\n\nDe acordo com a última verificação, ainda falta(m) {total} documento(s):\n\n{lista}\n\nObrigado,\nA Direção"},
  {nome:"No dia do prazo",quando:"dia",dias:0,rep:0,max:1,dest:"falta",
   subj:"Último dia: {prazo_nome}",
   body:"Olá {primeiro_nome},\n\nHoje, {prazo}, termina o prazo para a entrega de {documentos} na Box. Ainda falta(m):\n\n{lista}\n\nObrigado,\nA Direção"},
  {nome:"Incumprimento do prazo",quando:"depois",dias:1,rep:7,max:4,dest:"falta",
   subj:"Incumprimento do prazo: {prazo_nome}",
   body:"Caro(a) {nome},\n\nO prazo para a entrega de {documentos} na Box terminou no dia {prazo} (há {dias} dia(s)) e, de acordo com a verificação de hoje, continua(m) em falta {total} documento(s):\n\n{lista}\n\nSolicito a regularização com a maior brevidade possível.\n\nCom os melhores cumprimentos,\nA Direção"}];
function novoPrazo(){const plan=null;
  const d=new Date();d.setDate(d.getDate()+14);
  return{id:uid(),nome:plan?"Planificações":"Novo prazo",data:d.toISOString().slice(0,10),ativo:true,docs:plan?[plan.id]:[],tipos:["mod","uc","ufcd"],turmas:[],profs:[],disc:"",modq:"",resumo:true,
    avisos:AVISO_TPL.map(a=>({id:uid(),ativo:true,...a}))}}
// datas
const pd=s=>{const m=String(s||"").match(/^(\d{4})-(\d\d)-(\d\d)/);return m?[+m[1],+m[2]-1,+m[3]]:null};
const fimPrazo=p=>{const d=pd(p.data);return d?new Date(d[0],d[1],d[2],23,59,59,999).getTime():NaN};
const prazoPT=p=>{const d=pd(p.data);return d?new Date(d[0],d[1],d[2]).toLocaleDateString("pt-PT"):"(sem data)"};
const DIA=864e5;
const diasEntre=(a,b)=>Math.round((new Date(new Date(b).toDateString())-new Date(new Date(a).toDateString()))/DIA);
const horaEnvio=()=>{const m=String(avCfg().hora||"09:00").match(/^(\d\d?):(\d\d)/);return m?[+m[1],+m[2]]:[9,0]};
// data de entrega de um ficheiro: quando foi colocado na Box (created_at); nas análises antigas, a última alteração (aproximada)
const dataEntrega=f=>{if(f.ca){const t=Date.parse(f.ca);if(!isNaN(t))return{t,aprox:false}}const t=Date.parse(f.date||"");return{t:isNaN(t)?null:t,aprox:true}};
const splitQ=s=>String(s||"").split(/[,;]/).map(norm).filter(Boolean);
function prazoMods(p){const T=new Set(p.turmas||[]),P=new Set(p.profs||[]),tp=new Set(p.tipos&&p.tipos.length?p.tipos:["mod","uc","ufcd"]),dq=splitQ(p.disc),mq=splitQ(p.modq);
  return m=>{if(!tp.has(tipoMod(m)))return false;if(T.size&&!T.has(m.turma))return false;if(P.size&&!P.has(profOf(m)))return false;
    if(dq.length&&!dq.some(q=>norm(m.disc).includes(q)))return false;
    if(mq.length){const t=norm(modTitle(m)+" "+(m.cod||""));if(!mq.some(q=>t.includes(q)||modKey(q)===modKey(m.cod)))return false}
    return true}}
// estado de cada documento abrangido pelo prazo: prazo (entregue no prazo), atraso (fora do prazo), falta (prazo passou e não entregou), pendente (ainda dentro do prazo)
const EST_P={prazo:["No prazo","ok"],atraso:["Fora do prazo","late"],falta:["Não entregue","bad"],pendente:["Por entregar","pend"]};
function prazoItens(p,agora){agora=agora||Date.now();const fim=fimPrazo(p),ok=prazoMods(p),D=new Set(),out=[]; // 0.9.97: já não há «documentos exigidos» — o prazo vale para todas as pastas dos módulos
  for(const e of evaluate()){const m=e.mod;if(!ok(m))continue;
    for(const i of e.items){if(D.size&&!D.has(i.doc.id))continue;
      let est,ent=null,aprox=false;
      if(i.ok){const good=(i.q||[]).filter(x=>!x.q||x.q.lvl!=="bad").map(x=>dataEntrega(x.f)).filter(x=>x.t).sort((a,b)=>a.t-b.t);
        const need=Math.max(1,i.doc.min||1),g=good[Math.min(need,good.length)-1];
        if(g){ent=g.t;aprox=g.aprox}
        est=ent&&ent>fim?"atraso":"prazo"}
      else est=agora>fim?"falta":"pendente";
      out.push({e,m,i,pid:profOf(m)||"_",est,ent,aprox,atraso:ent&&ent>fim?diasEntre(fim,ent):(est==="falta"?diasEntre(fim,agora):0)})}}
  return out}
function prazoPorProf(L){const M=new Map();for(const x of L){if(!M.has(x.pid))M.set(x.pid,[]);M.get(x.pid).push(x)}
  return [...M.entries()].map(([pid,it])=>{const p=cfg.profs.find(q=>q.id===pid)||{id:"_",nome:"(sem formador atribuído)",email:""};
    const c={prazo:0,atraso:0,falta:0,pendente:0};for(const x of it)c[x.est]++;return{p,it,c,inc:c.falta+c.atraso}})
    .sort((a,b)=>cmpProf(a.p,b.p))}
const contar=L=>{const c={prazo:0,atraso:0,falta:0,pendente:0};for(const x of L)c[x.est]++;return c};

/* registo dos avisos enviados (fora da configuração, para "anular" nunca fazer reenviar) */
const AVLOG="boxcheck_avisos_log";
let AVL=lsJ(AVLOG,[])||[];
const avKeys=()=>new Set(AVL.map(x=>x.k));
function avGuardar(){AVL=AVL.slice(-3000);try{localStorage.setItem(AVLOG,JSON.stringify(AVL))}catch(e){}
  if(NUVOK()&&!nuvDesl())nuvemPut("avisos",AVL)}
function avJuntar(arr){if(!Array.isArray(arr))return 0;const K=new Set(AVL.map(x=>x.k+"|"+x.t));let n=0;
  for(const x of arr)if(x&&x.k&&!K.has(x.k+"|"+x.t)){AVL.push(x);n++}
  if(n){AVL.sort((a,b)=>a.t-b.t);try{localStorage.setItem(AVLOG,JSON.stringify(AVL))}catch(e){}}return n}
async function avTrazerNuvem(){if(!NUVOK()||nuvDesl())return;
  try{const idx=(await (await nuvem("GET","")).json()).itens||{};if(!idx.avisos)return;const arr=await nuvemGet("avisos");avJuntar(arr)}catch(e){}}
// já enviado para este formador (ok) nesta ocorrência?
const enviado=k=>AVL.some(x=>x.k===k&&x.ok);

/* calendário de cada aviso */
function ocorrencias(p,a){const d=pd(p.data);if(!d)return[];const [h,mi]=horaEnvio();
  const off=a.quando==="antes"?-(+a.dias||0):a.quando==="depois"?(+a.dias||0):0;
  const rep=Math.max(0,+a.rep||0),max=rep?Math.max(1,Math.min(52,+a.max||1)):1,fim=fimPrazo(p),out=[];
  for(let k=0;k<max;k++){const t=new Date(d[0],d[1],d[2]+off+k*rep,h,mi).getTime();if(a.quando!=="depois"&&t>fim)break;out.push(t)}
  return out}
// ocorrência que está na hora (a mais recente que já passou); os avisos "antes" deixam de valer quando o prazo termina
function ocorrenciaDevida(p,a,agora){const o=ocorrencias(p,a);let k=-1;for(let i=0;i<o.length;i++)if(o[i]<=agora)k=i;
  if(k<0)return null;if(a.quando!=="depois"&&agora>fimPrazo(p))return null;return{k,t:o[k]}}
const proxima=(p,a,agora)=>ocorrencias(p,a).find(t=>t>agora)||null;
function destinatarios(p,a,L){const G=prazoPorProf(L).filter(g=>g.p.id!=="_");
  return G.map(g=>{const it=g.it.filter(x=>a.dest==="incumpriu"?(x.est==="falta"||x.est==="atraso"):(x.est==="falta"||x.est==="pendente"));return{...g,alvo:it}}).filter(g=>g.alvo.length)}
// 0.9.97: nome de um item = a pasta (e a secção onde está), ex.: «Módulo 002 (012.1.3 - Pautas de Avaliação)»
function itemNome(i){const d=docNome(i&&i.doc&&i.doc.nome||"");return (docNome(i&&i.falta)||d)+(d&&i.falta&&d!==i.falta?` (${d})`:"")}
function linhaItem(x){const r=`• ${x.m.turma} | ${discShort(x.m.disc)} | ${modTitle(x.m)} → ${itemNome(x.i)}`;
  if(x.est==="atraso")return r+` — entregue a ${dataPT(x.ent)}, ${x.atraso} dia(s) depois do prazo`;
  return r+(x.i.state==="blank"?" — o ficheiro entregue não conta: "+motivoBad(x.i):x.i.loc?` (${x.i.loc})`:"")}
function preencherAviso(tpl,p,a,g,agora){agora=agora||Date.now();const fim=fimPrazo(p);
  const dias=a.quando==="depois"?Math.max(0,diasEntre(fim,agora)):Math.max(0,diasEntre(agora,fim));
  const docs=[];
  const first=String(g.p.nome||"").trim().split(/\s+/)[0]||"";
  return String(tpl||"").replace(/\{primeiro_nome\}/g,first).replace(/\{nome\}/g,g.p.nome).replace(/\{prazo_nome\}/g,p.nome||"")
    .replace(/\{prazo\}/g,prazoPT(p)).replace(/\{dias\}/g,dias).replace(/\{documentos\}/g,docs.length?docs.join(", ").replace(/, ([^,]*)$/," e $1").toLowerCase():"a documentação pedida")
    .replace(/\{total\}/g,g.alvo.length).replace(/\{ano\}/g,anoLetivo()).replace(/\{lista\}/g,g.alvo.map(linhaItem).join("\n"))}

/* envio */
let AVBUSY=false,AVMSG="";
async function msTokenSilencioso(){const p=await msInit();if(!MSACC)throw new Error("Office 365 sem sessão");return (await p.acquireTokenSilent({scopes:MS_SCOPES,account:MSACC})).accessToken}
function analiseFresca(){return lastListing&&Date.now()-(lastListing.t||0)<3*3600e3}
// lista do que está na hora de enviar (sem enviar)
function avisosDevidos(agora){agora=agora||Date.now();const out=[];
  for(const p of prazos()){if(!p.ativo||!pd(p.data))continue;let L=null;
    for(const a of p.avisos||[]){if(!a.ativo)continue;const o=ocorrenciaDevida(p,a,agora);if(!o)continue;
      L=L||prazoItens(p,agora);
      for(const g of destinatarios(p,a,L)){const k=p.id+"|"+a.id+"|"+g.p.id+"|"+o.k;if(enviado(k)||!g.p.email)continue;out.push({p,a,g,k,o})}}
    // resumo para a direção no dia seguinte ao prazo
    const para=(avCfg().para||cfg.mail.relatorio_para||"").trim(),fim=fimPrazo(p),[h,mi]=horaEnvio(),d=pd(p.data);
    if(p.resumo&&para&&d&&agora>=new Date(d[0],d[1],d[2]+1,h,mi).getTime()&&agora-fim<30*DIA){const k=p.id+"|resumo";if(!enviado(k))out.push({p,resumo:true,para,k})}}
  return out}
function resumoTexto(p,agora){const L=prazoItens(p,agora),c=contar(L),G=prazoPorProf(L).filter(g=>g.inc);
  let s=`${p.nome} — prazo: ${prazoPT(p)}\nSituação a ${new Date(agora||Date.now()).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}\n\n`+
    `Entregues no prazo: ${c.prazo}\nEntregues fora do prazo: ${c.atraso}\nNão entregues: ${c.falta+c.pendente}\nTotal de documentos: ${L.length}\n\n`;
  if(!G.length)return s+"Todos os formadores cumpriram o prazo.";
  s+=`Formadores que não cumpriram (${G.length}):\n`;
  for(const g of G){s+=`\n${g.p.nome}${g.p.email?" <"+g.p.email+">":""} — ${g.c.falta} não entregue(s), ${g.c.atraso} fora do prazo\n`;
    for(const x of g.it.filter(x=>x.est==="falta"||x.est==="atraso"))s+=linhaItem(x).replace(/^• /,"   • ")+"\n"}
  return s}
async function enviarItem(x,manual){const agora=Date.now();
  if(x.resumo){await msEnviar({to:x.para,cc:"",subject:`Prazo “${x.p.nome}” (${prazoPT(x.p)}) — quem não cumpriu`,body:resumoTexto(x.p,agora)+"\n\n— Enviado pela EPISJ 360 (módulo Box360)"});return}
  await msEnviar({to:x.g.p.email,cc:msCfg().cc,subject:preencherAviso(x.a.subj,x.p,x.a,x.g,agora),body:preencherAviso(x.a.body,x.p,x.a,x.g,agora)})}
async function enviarLista(lista,manual,onProg){let n=0;const falhas=[];
  for(const x of lista){onProg&&onProg(n+falhas.length+1,lista.length,x);
    const base={k:x.k,t:Date.now(),prazo:x.p.id,aviso:x.resumo?"resumo":x.a.id,prof:x.resumo?"":x.g.p.id,nome:x.resumo?"(resumo para "+x.para+")":x.g.p.nome,n:x.resumo?0:x.g.alvo.length,manual:!!manual};
    if(!x.resumo&&!x.g.p.email){AVL.push({...base,ok:false,err:"sem email"});falhas.push(x.g.p.nome+": sem email");continue}
    try{await enviarItem(x,manual);AVL.push({...base,ok:true});n++}
    catch(e){AVL.push({...base,ok:false,err:msErro(e)});falhas.push((x.resumo?"Resumo":x.g.p.nome)+": "+msErro(e))}
    await sleep(400)}
  avGuardar();return{n,falhas}}
// corre sozinho: depois de cada análise e de 20 em 20 minutos com a app aberta
async function correrAvisos(forcar){
  if(AVBUSY)return;const A=avCfg();
  if(A.servidor){enviarPlano();return} // quem envia é o serviço de avisos
  if(!A.auto&&!forcar)return;
  if(!prazos().some(p=>p.ativo))return;
  if(!analiseFresca()){if(SES&&!scanBusy&&lastListing&&lastListing.rootId===curFolder.id&&!forcar){runScan(false,true)}
    if(!forcar){AVMSG="";avEstadoUI();return}}
  AVBUSY=true;
  try{await avTrazerNuvem();
    const lista=avisosDevidos();if(!lista.length){AVMSG="";return}
    try{await msTokenSilencioso()}catch(e){AVMSG=`Há ${lista.length} aviso(s) na hora, mas falta entrar no Office 365 neste navegador (Definições › Office 365 ou o botão abaixo).`;return}
    const r=await enviarLista(lista,false);
    AVMSG=`${r.n} aviso(s) enviado(s) automaticamente às ${new Date().toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})}.`+(r.falhas.length?` Não enviados: ${r.falhas.join("; ")}`:"");
    if(r.n)toast(`${r.n} aviso(s) de prazos enviado(s)`)}
  catch(e){AVMSG="Erro nos avisos: "+e.message}
  finally{AVBUSY=false;avEstadoUI();if(curTab==="pra")renderPrazos()}}
setInterval(()=>correrAvisos(),20*60e3);

