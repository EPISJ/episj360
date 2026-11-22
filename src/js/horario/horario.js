/* ===================== módulo EduSchedule — o mesmo EduSchedule da EduSpruce (/eduschedule.html), aberto dentro da EPISJ 360 ===================== */
// Não há cópia do código: a EPISJ 360 abre sempre a versão publicada do EduSchedule, por isso cada melhoria feita na EduSpruce aparece logo aqui.
// A EPISJ 360 faz o papel da EduSpruce na "ponte" do EduSchedule (window.__esched): guarda o horário de cada ano letivo
// (no navegador e na nuvem da EPISJ 360) e entrega-lhe a escola, o ano letivo, o calendário, os formadores e as turmas do módulo Escola.
// O que se acrescentar no EduSchedule (formadores, turmas) volta para o módulo Escola.
// 0.9.136: o Horário360 é servido pela própria EPISJ 360 (cópia do EduSchedule em /eduschedule.html, com as letras em /fontes/).
// Antes vinha de eduspruce.github.io e corria como srcdoc na mesma origem da app: código de outro site com acesso total à EPISJ 360.
const ES_URL=new URL("eduschedule.html",location.href).href;
let ESD={t:0,porAno:{},copias:{},mapaT:{},mapaC:{},ligT:{},ligC:{},mapaA:{},ligA:{}};
const esdPronto=DB.get("kv","esched").then(v=>{if(v&&typeof v==="object")ESD=Object.assign(ESD,v)}).catch(()=>{});
let esdH=null;
function esdGuardar(){if(RO||LIMPAR)return;guidePubAgendar();ESD.t=Date.now();DB.put("kv","esched",ESD);clearTimeout(esdH);nuvFila("esdH",()=>{if(NUVOK()&&!nuvDesl())nuvemPut("ES",ESD,ESD.t)},8000)}
async function esTrazerNuvem(){try{await esdPronto;if(!NUVOK()||nuvDesl())return;
  const idx=(await (await nuvem("GET","")).json()).itens||{};
  if(idx.ES&&(idx.ES.t||0)>(ESD.t||0)){const j=await nuvemGet("ES");if(j&&typeof j==="object"){ESD=Object.assign({t:0,porAno:{},copias:{},mapaT:{},mapaC:{},ligT:{},ligC:{},mapaA:{},ligA:{}},j);DB.put("kv","esched",ESD);esRecarregar(true)}}
  else if((ESD.t||0)>((idx.ES||{}).t||0))await nuvemPut("ES",ESD,ESD.t)}catch(e){if(e.kind!=="nokv")console.warn("Horários360/nuvem",e)}}

let ES_ANO=null,ES_SIG="";
function esAno(){return escData().anos.find(a=>a.id===ES_ANO)||anoAtivo()}
// assinatura do que a EPISJ 360 entrega ao EduSchedule: se mudar, o EduSchedule é reaberto com os dados novos
function esSig(){const e=escData(),a=anoAtivo();let pl=[],es=[];try{pl=pcPlanos().filter(p=>p.anoId===a.id).map(p=>[p.turmaId,p.semanas,(p.linhas||[]).map(l=>[l.disc,l.h,l.f])])}catch(x){}try{es=RC.esp.filter(x=>x.on).map(x=>[x.id,x.n])}catch(x){}
  return JSON.stringify([e.nome,a.id,a.nome,a.inicio,a.fim,a.ferias,cfg.profs.map(p=>[p.id,p.nome,p.abrev||""]),turmasDoAno(a).map(t=>[t.id,t.cod,turmaNome(t),turmaOE(t,a.id)]),(e.formandos||[]).map(f=>[f.id,f.num,f.nome,f.turmaId]),pl,es])}
const GRELHA_ES=[["08:30","09:20"],["09:20","10:10",1],["10:30","11:20"],["11:20","12:10"],["12:10","13:00",1],["14:00","14:50"],["14:50","15:40",1],["15:50","16:40"]];
function esNovoEstado(a){const e=escData();
  return{v:3,name:e.nome,ano:a.nome,tlMin:50,alvo:1100,tarde:0,days:["Seg","Ter","Qua","Qui","Sex"],periods:GRELHA_ES.map((t,i)=>({label:String(i+1),start:t[0],end:t[1],breakAfter:!!t[2]})),
    classes:[],teachers:[],rooms:[],subjects:[],lessons:[],off:{},cards:[],cover:{},vig:{},print:{},almoco:{de:0,ate:0},reunioes:[],locais:[],exports:[],
    inicio:a.inicio||a.ini+"-09-01",fim:a.fim||(a.ini+1)+"-06-30",ferias:[]}}
/* EPISJ 360 → EduSchedule: formadores e turmas do ano letivo */
function esInjetar(st,a){const e=escData(),P=cfg.profs,byId=new Map(P.map(p=>[p.id,p]));
  st.name=e.nome;st.ano=a.nome;
  // formadores (todos os da EPISJ 360)
  if(!Array.isArray(st.teachers))st.teachers=[];const usados=new Set(),sig=new Set(st.teachers.map(t=>t.short).filter(Boolean)),t2p=new Map();
  st.teachers=st.teachers.filter(t=>{let pid=byId.has(t.id)?t.id:ESD.mapaT[t.id];let p=pid&&byId.get(pid);
    if(p&&usados.has(p.id))p=null;
    if(!p){if(ESD.ligT[t.id])return false; // era da EPISJ 360 e foi apagado no módulo Escola
      p=P.find(x=>!usados.has(x.id)&&norm(x.nome)===norm(t.name));if(!p)return true;ESD.mapaT[t.id]=p.id}
    usados.add(p.id);ESD.ligT[t.id]=1;t2p.set(p.id,t.id);t.name=p.nome;if(p.abrev)t.short=p.abrev;else if(!t.short)t.short=sigla(p.nome,sig);return true});
  for(const p of P)if(!usados.has(p.id)){st.teachers.push({id:p.id,short:p.abrev||sigla(p.nome,sig),name:p.nome,proc:"",prev:22,maxDay:6,maxSeg:0,maxSpan:0,umTurno:false,diasLivres:0,dep:""});ESD.ligT[p.id]=1;t2p.set(p.id,p.id)}
  // turmas do ano letivo
  const T=turmasDoAno(a),tById=new Map(T.map(t=>[t.id,t])),tTodas=new Map(e.turmas.map(t=>[t.id,t])),tu=new Set();
  if(!Array.isArray(st.classes))st.classes=[];
  st.classes=st.classes.filter(c=>{let tid=tTodas.has(c.id)?c.id:ESD.mapaC[c.id];let t=tid&&tById.get(tid);
    if(t&&tu.has(t.id))t=null;
    if(!t){if(ESD.ligC[c.id])return false; // turma apagada ou que já não é deste ano letivo
      t=T.find(x=>!tu.has(x.id)&&norm(x.cod)===norm(c.name));if(!t)return true;ESD.mapaC[c.id]=t.id}
    tu.add(t.id);ESD.ligC[c.id]=1;c.name=t.cod;c.full=turmaNome(t);{const oe=turmaOE(t,a.id);if(oe&&t2p.has(oe))c.dt=t2p.get(oe)}return true});
  for(const t of T)if(!tu.has(t.id)){st.classes.push({id:t.id,name:t.cod,full:turmaNome(t),roomId:"",dt:(oe=>oe&&t2p.has(oe)?t2p.get(oe):"")(turmaOE(t,a.id)),minDay:0,maxDay:7,tardesLivres:0,dep:""});ESD.ligC[t.id]=1}
  // 0.9.47: espaços do Sala360 → salas do Horários360
  esInjetarLigacoes(st,a,T,tTodas,t2p);
  // formandos da GUIDE → formandos do EduSchedule (nome, número e turma vêm da GUIDE; aulas e opções ficam no EduSchedule)
  ESD.mapaA=ESD.mapaA||{};ESD.ligA=ESD.ligA||{};const t2c=new Map();
  for(const c of st.classes){const tid=tTodas.has(c.id)?c.id:ESD.mapaC[c.id];if(tid)t2c.set(tid,c.id)}
  const F=(e.formandos||[]).filter(f=>t2c.has(f.turmaId)),fById=new Map(F.map(f=>[f.id,f])),fu=new Set();
  if(!Array.isArray(st.alunos))st.alunos=[];
  st.alunos=st.alunos.filter(al=>{const fid=fById.has(al.id)?al.id:ESD.mapaA[al.id];let f=fid&&fById.get(fid);if(f&&fu.has(f.id))f=null;
    if(!f){if(ESD.ligA[al.id])return false;f=F.find(x=>!fu.has(x.id)&&norm(x.nome)===norm(al.nome));if(!f)return true;ESD.mapaA[al.id]=f.id}
    fu.add(f.id);ESD.ligA[al.id]=1;al.nome=f.nome;al.num=f.num||"";al.classId=t2c.get(f.turmaId);return true});
  for(const f of F)if(!fu.has(f.id)){st.alunos.push({id:f.id,num:f.num||"",nome:f.nome,classId:t2c.get(f.turmaId),fora:[],extra:[]});ESD.ligA[f.id]=1}
  return st}

/* ===================== 0.9.47: Planos Curriculares (DSD) e Sala360 → Horários360 =====================
   · cada disciplina dos planos do ano letivo passa a disciplina do Horários360 (sigla automática);
   · cada turma × disciplina passa a aula: TL por semana = horas do plano ÷ semanas de aulas (arredondado para cima, como na folha da escola),
     formador = quem dá mais horas dessa disciplina na turma;
   · o que se mudar à mão no Horários360 (formador, TL, sala, duplos…) fica: só se atualiza o que ainda está como a EPISJ 360 o pôs;
   · os espaços do Sala360 (Auditório, Laboratórios) passam a salas do Horários360. */
const ES_CORES=["#2563eb","#16a34a","#dc2626","#9333ea","#ea580c","#0891b2","#ca8a04","#db2777","#4f46e5","#059669","#b91c1c","#7c3aed","#0d9488","#c2410c","#65a30d","#be185d"];
const esHash=v=>{let h=2166136261;for(const ch of String(v)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
function esSiglaDisc(d,usadas){let n=String(d||"").replace(/^\s*[\dA-Z]{3,6}\s*[-–]\s*/,"").replace(/\(.*?\)/g,"").trim();
  const partes=n.split(/\s+[-–]\s+/);if(partes.length>1)n=partes[partes.length-1];
  const sem=x=>x.normalize("NFD").replace(/[̀-ͯ]/g,"");
  const pal=sem(n).split(/\s+/).filter(w=>w&&!/^(de|da|do|das|dos|e|a|o|em|para|na|no|I|II|III|IV)$/i.test(w));
  let s=pal.length>1?pal.map(w=>w[0]).join("").slice(0,4):(pal[0]||"D").slice(0,4);s=s.toUpperCase();let k=s,i=2;while(usadas.has(k))k=s+i++;usadas.add(k);return k}
function esSemanas(p,a){if(+p.semanas>0)return +p.semanas;
  try{const d0=new Date(a.inicio+"T12:00"),d1=new Date(a.fim+"T12:00");let w=(d1-d0)/6048e5;(a.ferias||[]).forEach(f=>{if(f.de&&f.ate)w-=((new Date(f.ate+"T12:00")-new Date(f.de+"T12:00"))/864e5+1)/7});if(w>5)return Math.round(w)}catch(e){}return 30}
function esInjetarLigacoes(st,a,T,tTodas,t2p){
  ESD.ligS=ESD.ligS||{};ESD.ligL=ESD.ligL||{};ESD.pcL=ESD.pcL||{};ESD.ligR=ESD.ligR||{};
  for(const k of["subjects","lessons","rooms","cards"])if(!Array.isArray(st[k]))st[k]=[];
  // salas: espaços do Sala360
  try{const rById=new Map(st.rooms.map(r=>[r.id,r]));for(const e of RC.esp){if(!e||!e.on)continue;const id="rc_"+e.id;const r=rById.get(id);
      if(!r){st.rooms.push({id,name:e.n,alt:"",ed:""});ESD.ligR[id]=1}else if(ESD.ligR[id])r.name=e.n}}catch(e){}
  // turma da EPISJ 360 → turma do Horários360
  const t2c=new Map();for(const c of st.classes){const tid=tTodas.has(c.id)?c.id:ESD.mapaC[c.id];if(tid)t2c.set(tid,c.id)}
  const sById=new Map(st.subjects.map(x=>[x.id,x])),usadas=new Set(st.subjects.map(x=>String(x.short||"").toUpperCase())),want=new Map();
  for(const t of T){let p=null;try{p=pcDe(t.id,a.id)}catch(e){}const cid=t2c.get(t.id);if(!p||!cid)continue;const sem=esSemanas(p,a),porD=new Map();
    for(const l of p.linhas||[]){if(!l||!l.disc)continue;const o=porD.get(l.disc)||{h:0,f:new Map()};const h=+l.h||0;o.h+=h;if(l.f)o.f.set(l.f,(o.f.get(l.f)||0)+h);porD.set(l.disc,o)}
    for(const [d,o] of porD){if(o.h<=0)continue;const sid="pc_"+esHash(norm(d));
      if(!sById.has(sid)){const sj={id:sid,short:esSiglaDisc(d,usadas),name:d,color:ES_CORES[sById.size%ES_CORES.length],roomId:"",fator:st.tlMin||50,seq:"",marg:false,cnl:false};st.subjects.push(sj);sById.set(sid,sj);ESD.ligS[sid]=1}
      else if(ESD.ligS[sid])sById.get(sid).name=d;
      let pid="",mx=-1;for(const [f,h] of o.f)if(h>mx){mx=h;pid=f}
      want.set("pc_"+esHash(a.id+"|"+t.id+"|"+norm(d)),{cid,sid,tid:pid&&t2p.has(pid)?t2p.get(pid):"",tl:Math.max(1,Math.min(40,Math.ceil(o.h/sem-1e-9)))})}}
  const lById=new Map(st.lessons.map(l=>[l.id,l]));
  for(const [id,w] of want){let l=lById.get(id);const pv=ESD.pcL[id]||{};
    if(!l){if(ESD.ligL[id]===0)continue; // apagada à mão no Horários360: não volta
      if(ESD.pcL[id]&&lById.size){ESD.ligL[id]=0;continue} // já tinha sido posta neste horário e não está: foi apagada no Horários360
      l={id,classIds:[w.cid],linhas:[{s:w.sid,t:w.tid,r:"",tip:""}],tl:w.tl,duplos:0,blocos:"",per:""};st.lessons.push(l);ESD.ligL[id]=1}
    else{if(!Array.isArray(l.linhas)||!l.linhas.length)l.linhas=[{s:w.sid,t:w.tid,r:"",tip:""}];const ln=l.linhas[0];
      if(!l.classIds||!l.classIds.length||(pv.cid&&l.classIds.length===1&&l.classIds[0]===pv.cid))l.classIds=[w.cid];
      if(!ln.s||ln.s===pv.s)ln.s=w.sid;if(!ln.t||ln.t===pv.t)ln.t=w.tid;if(!l.tl||l.tl===pv.tl)l.tl=w.tl}
    ESD.pcL[id]={cid:w.cid,s:w.sid,t:w.tid,tl:w.tl}}
  // aulas que vieram dos planos e cujo plano já não as tem: saem se ainda não estiverem no horário (as que já têm tempos marcados ficam)
  const comTempos=new Set(st.cards.map(c=>c.lessonId));
  st.lessons=st.lessons.filter(l=>{if(!ESD.pcL[l.id]||want.has(l.id))return true;if(comTempos.has(l.id))return true;delete ESD.pcL[l.id];delete ESD.ligL[l.id];return false});
}
/* ===================== 0.9.47: as aulas do Horários360 ocupam os espaços do Sala360 ===================== */
let RCAULAS={k:"",m:null};
function rcAulasMapa(){let a,x=null;try{a=anoAtivo();x=ESD.porAno[a.id]}catch(e){return null}const txt=x&&x.estado||"",k=a.id+":"+txt.length+":"+(x&&x.quando||0);
  if(RCAULAS.k===k)return RCAULAS.m;let m=[];
  // 0.9.67: um mapa por período do ano (os do Crono360 incluídos): em cada dia contam as aulas do horário em vigor nesse dia
  try{const st=txt?JSON.parse(txt):null;if(st&&!st.example){const S=new Map((st.subjects||[]).map(z=>[z.id,z])),C=new Map((st.classes||[]).map(c=>[c.id,c])),P=new Map((st.teachers||[]).map(t=>[t.id,t]));
    const per=st.periods||[],hm=v=>{const q=String(v||"").split(":").map(Number);return q[0]*60+(q[1]||0)};
    for(const v of cpVersoes(st)){const L=new Map((v.lessons||[]).map(l=>[l.id,l])),mv=[];
      for(const cd of v.cards||[]){const l=L.get(cd.lessonId);if(!l||l.ign||!per[cd.period])continue;const fp=per[Math.min(per.length-1,cd.period+(cd.len||1)-1)],h0=hm(per[cd.period].start),h1=hm(fp.end);if(!(h1>h0))continue;
        const salas=new Set();(l.linhas||[]).forEach((ln,i)=>{const r=(cd.r&&cd.r[i])||ln.r||(S.get(ln.s)||{}).roomId;if(r)salas.add(String(r))});
        const sg=(l.linhas||[]).map(ln=>(S.get(ln.s)||{}).short).filter(Boolean).join("/"),tu=(l.classIds||[]).map(c=>(C.get(c)||{}).name).filter(Boolean).join(", "),fo=(l.linhas||[]).map(ln=>(P.get(ln.t)||{}).name).filter(Boolean).join(", ");
        for(const r of salas)if(r.startsWith("rc_"))mv.push({dia:cd.day,e:r.slice(3),h0,h1,p:"Aula"+(sg?" · "+sg:""),t:tu,m:fo,id:"aula:"+cd.id+":"+r,lde:l.de||"",late:l.ate||""})}
      m.push({de:v.de||"",ate:v.ate||"",m:mv})}}}catch(e){m=[]}
  RCAULAS={k,m};return m}
function rcAulas(d){const m=rcAulasMapa();if(!m||!m.length||!d)return[];let a;try{a=anoAtivo()}catch(e){return[]}
  if(a.inicio&&d<a.inicio||a.fim&&d>a.fim)return[];if((a.ferias||[]).some(f=>f.de&&f.ate&&d>=f.de&&d<=f.ate))return[];
  const v=m.find(x=>(!x.de||d>=x.de)&&(!x.ate||d<=x.ate));if(!v)return[];
  const wd=(rcData(d).getDay()+6)%7;return v.m.filter(x=>x.dia===wd&&(!x.lde||d>=x.lde)&&(!x.late||d<=x.late)).map(x=>({...x,id:x.id+":"+d,d,aula:true}))}
/* EduSchedule → EPISJ 360: formadores e turmas criados ou mudados no EduSchedule passam para o módulo Escola */
let esRetH=null;
function esRetorno(txt,a){clearTimeout(esRetH);esRetH=setTimeout(()=>{let st;try{st=JSON.parse(txt)}catch(e){return}
  const e=escData(),P=cfg.profs,byId=new Map(P.map(p=>[p.id,p])),tTodas=new Map(e.turmas.map(t=>[t.id,t]));let mud=0;const t2p=new Map();
  for(const t of st.teachers||[]){const pid=byId.has(t.id)?t.id:ESD.mapaT[t.id];let p=pid&&byId.get(pid);
    if(!p){if(ESD.ligT[t.id]&&!ESD.mapaT[t.id]&&!byId.has(t.id))continue;
      p={id:uid(),cod:"",nome:String(t.name||t.short||"Formador").trim(),abrev:t.short||"",email:""};P.push(p);byId.set(p.id,p);ESD.mapaT[t.id]=p.id;ESD.ligT[t.id]=1;mud=1}
    else{if(t.name&&t.name.trim()&&t.name.trim()!==p.nome){p.nome=t.name.trim();mud=1}if(t.short&&t.short!==(p.abrev||"")){p.abrev=t.short;mud=1}}
    t2p.set(t.id,p.id)}
  for(const c of st.classes||[]){const tid=tTodas.has(c.id)?c.id:ESD.mapaC[c.id];let t=tid&&tTodas.get(tid);
    if(!t){if(ESD.ligC[c.id]&&!ESD.mapaC[c.id]&&!tTodas.has(c.id))continue;
      t={id:uid(),cod:String(c.name||"T").trim().toUpperCase(),nome:"",cursoId:"",anoIni:a.ini,anoFim:a.ini+1,dt:""};e.turmas.push(t);tTodas.set(t.id,t);ESD.mapaC[c.id]=t.id;ESD.ligC[c.id]=1;mud=1}
    else if(c.name&&c.name.trim()&&c.name.trim()!==t.cod){t.cod=c.name.trim();mud=1}
    const dt=c.dt&&t2p.get(c.dt)||"";if(dt&&dt!==(t.dt||"")&&!turmaCargoPlano(t,"dt",a.id)){t.dt=dt;mud=1}}
  ESD.mapaA=ESD.mapaA||{};ESD.ligA=ESD.ligA||{};const F=e.formandos||(e.formandos=[]),fById=new Map(F.map(f=>[f.id,f]));
  const c2t=new Map();for(const c of st.classes||[])c2t.set(c.id,tTodas.has(c.id)?c.id:ESD.mapaC[c.id]);
  for(const al of st.alunos||[]){if(fById.has(al.id)||ESD.mapaA[al.id]||ESD.ligA[al.id])continue;
    const f={id:uid(),num:String(al.num||""),nome:String(al.nome||"Formando").trim(),turmaId:c2t.get(al.classId)||""};F.push(f);ESD.mapaA[al.id]=f.id;ESD.ligA[al.id]=1;mud=1}
  if(mud){P.sort((x,y)=>COLL_PT.compare(x.nome,y.nome));save();esdGuardar();ES_SIG=esSig();try{renderProfs()}catch(_){}escRender()}},1200)}

window.__esched={
  equipa:false,_email:"",
  ler:()=>{const a=esAno(),x=ESD.porAno[a.id];let st=null;try{st=x&&x.estado?JSON.parse(x.estado):null}catch(e){}
    if(!st||st.example)st=esNovoEstado(a);esInjetar(st,a);const t=JSON.stringify(st);return t},
  gravar:txt=>{const a=esAno(),x=ESD.porAno[a.id]||(ESD.porAno[a.id]={});if(x.estado===txt)return;x.estado=txt;x.quando=Date.now();esdGuardar();esRetorno(txt,a)},
  copias:()=>ESD.copias,
  copia:(k,v)=>{const c=ESD.copias;if(v==null)delete c[k];else c[k]=v;const ks=Object.keys(c).sort();while(ks.length>10)delete c[ks.shift()];esdGuardar()},
  // a partilha com colegas e a publicação dos horários usam a base de dados da EduSpruce: na EPISJ 360 o horário é da escola e fica na nuvem da EPISJ 360
  rpc:async fn=>{if(fn==="eduschedule_eu")return null;throw new Error("a partilha com colegas e a publicação dos horários fazem-se na EduSpruce")},
  email:()=>String(window.__guideLogin||""),
  sge:()=>false,
  voltar:()=>mostrarModulo("escola",true),
  escola:()=>{const e=escData(),a=esAno();
    return{chave:a.id,escola:e.nome,ano:a.nome,calendario:a.inicio&&a.fim?{inicio:a.inicio,fim:a.fim,ferias:(a.ferias||[]).filter(f=>f.de&&f.ate).map(f=>({nome:f.nome||"Interrupção letiva",de:f.de,ate:f.ate}))}:null}},
  publico:c=>"https://eduspruce.github.io/horarios.html#"+c
};
// mesmo endereço que a EduSpruce → abre o ficheiro diretamente; noutro endereço (boxcheck.episj.pt) vai buscá-lo e abre-o como documento da própria EPISJ 360
const esMesmaOrigem=()=>location.origin===new URL(ES_URL).origin;
async function esAbrir(){await esdPronto;const fr=$("#esFr");fr.classList.remove("pronto");ES_ANO=anoAtivo().id;ES_SIG=esSig();$("#esMsg").textContent="";
  fr.onload=()=>esAjustar(fr);
  if(esMesmaOrigem()){fr.removeAttribute("srcdoc");fr.src=ES_URL.replace(location.origin,"")+"?guide="+encodeURIComponent(VERSAO)+"&t="+Date.now();return}
  try{let h=await (await fetch(ES_URL+"?t="+Date.now(),{cache:"no-store"})).text();h=h.replace(/<head([^>]*)>/i,`<head$1><base href="${ES_URL.replace(/[^/]*$/,"")}">`);
    // 0.9.110: a política de segurança do Horários360 só aceita o próprio endereço — acrescenta o da EduSpruce (base, letra, imagens), senão noutro endereço fica em branco
    {const o=new URL(ES_URL).origin;h=h.replace(/(<meta[^>]+Content-Security-Policy[^>]+content=")([^"]*)"/i,(x,a,c)=>a+c.replace(/(style-src|font-src|img-src|base-uri) 'self'/g,"$1 'self' "+o)+'"')}
    fr.removeAttribute("src");fr.srcdoc=h}
  catch(e){$("#esMsg").innerHTML=`<div class="msg bad">Não foi possível abrir o Horários360 (${esc(e.message)}). Verifique a ligação à Internet.</div>`}}
/* ---------- EPISJ 360 0.6: o EduSchedule com o aspeto e as animações da EPISJ 360 ---------- */
// O tema é posto pela EPISJ 360 no documento do EduSchedule quando ele abre: o ficheiro do EduSchedule (e a EduSpruce) não muda.
const ES_TEMA="/* EPISJ 360 0.6 \u2014 o EduSchedule com o aspeto da EPISJ 360 (posto pela EPISJ 360 ao abrir; o EduSchedule da EduSpruce n\u00e3o muda) */\n[data-theme=guide]{color-scheme:light;\n  --color-base-100:#fff;--color-base-200:#f8f9fb;--color-base-300:#e3e7ee;--color-base-content:#1b2333;\n  --color-primary:#163269;--color-primary-content:#fff;--color-secondary:#2f5fb8;--color-secondary-content:#fff;\n  --color-accent:#3db166;--color-accent-content:#fff;--color-neutral:#1b2333;--color-neutral-content:#f8f9fb;\n  --color-info:#2f5fb8;--color-info-content:#fff;--color-success:#2f9e57;--color-success-content:#fff;\n  --color-warning:#b45309;--color-warning-content:#fff;--color-error:#dc2626;--color-error-content:#fff;\n  --radius-selector:7px;--radius-field:7px;--radius-box:10px;--size-selector:.25rem;--size-field:.25rem;--border:1px;--depth:0;--noise:0;\n  --fbody:Poppins,system-ui,sans-serif;--fdisplay:Poppins,system-ui,sans-serif;\n  --g-brand:#163269;--g-brand2:#0f2552;--g-brandbg:#eef3fc;--g-sky:#d4e1fa;--g-accent:#3db166;--g-accent2:#2f9e57;--g-ink:#1b2333;--g-muted:#6b7385;--g-line:#e3e7ee;--g-line2:#d3d9e3;--g-ring:rgba(22,50,105,.25);\n  --g-sh-sm:0 1px 2px rgba(15,23,42,.05);--g-sh:0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04)}\n[data-theme=guide] body{font-family:Poppins,system-ui,sans-serif;font-size:13.5px;letter-spacing:0;-webkit-font-smoothing:antialiased;background:#f8f9fb;color:var(--g-ink)}\n[data-theme=guide] h1,[data-theme=guide] h2,[data-theme=guide] h3,[data-theme=guide] .fd{font-family:Poppins,system-ui,sans-serif;letter-spacing:-.01em}\n/* o que j\u00e1 est\u00e1 no topo da EPISJ 360 (escola, ano letivo, tema) n\u00e3o se repete */\n[data-theme=guide] #school,[data-theme=guide] #ano,[data-theme=guide] #tema,[data-theme=guide] #es-casa{display:none!important}\n/* barra de cima: como o topo da EPISJ 360 */\n[data-theme=guide] header.navbar{min-height:52px;background:rgba(255,255,255,.85);backdrop-filter:saturate(1.6) blur(10px);border-bottom:1px solid var(--g-line)!important;padding:0 18px}\n[data-theme=guide] #status{font-size:12.5px;color:var(--g-muted);opacity:1}\n[data-theme=guide] header .join{border:1px solid var(--g-line);border-radius:999px;overflow:hidden;background:#fff}\n[data-theme=guide] header .join .btn{border:0;border-radius:0;background:#fff;color:#3d434b;font-weight:600;font-size:12.5px;box-shadow:none;height:30px;min-height:30px}\n[data-theme=guide] header .join .btn+.btn{border-left:1px solid var(--g-line)}\n[data-theme=guide] header .join .btn:hover:not(:disabled){background:#f2f5fa}\n[data-theme=guide] header .join .btn:disabled{color:#b8bec7;background:#fff}\n/* menu lateral: como o menu da EPISJ 360 */\n[data-theme=guide] .drawer-side aside{background:#fbfcfd;border-right:1px solid var(--g-line)!important;width:236px}\n[data-theme=guide] aside>div:first-child{border-bottom:0!important;padding:18px 18px 6px}\n[data-theme=guide] aside>div:first-child>span:last-child{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted)}\n[data-theme=guide] aside>div:first-child>span:last-child span{display:block;text-transform:none;letter-spacing:0;font-weight:500;font-size:11.5px;color:#9aa1ad;opacity:1}\n[data-theme=guide] #logo{display:none!important}\n[data-theme=guide] #logo-x{width:26px;height:26px;border-radius:7px;background:linear-gradient(135deg,#2f5fb8,#163269 55%,#0c1d40);box-shadow:0 1px 2px rgba(22,50,105,.3)}\n[data-theme=guide] #logo svg{width:15px;height:15px}\n[data-theme=guide] #nav{padding:6px 12px 16px;gap:3px}\n[data-theme=guide] #nav .menu-title{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted);padding:14px 11px 6px;opacity:1}\n[data-theme=guide] #nav li>a{position:relative;display:flex;align-items:center;gap:11px;border-radius:7px;padding:8px 11px;font-size:13px;font-weight:500;color:#3b4456;transition:background .15s,color .15s,box-shadow .2s}\n[data-theme=guide] #nav li>a svg{width:18px;height:18px;transition:transform .2s}\n[data-theme=guide] #nav li>a:hover{background:#f1f4f8;color:var(--g-ink)}\n[data-theme=guide] #nav li>a:hover svg{transform:translateX(2px)}\n[data-theme=guide] #nav li>a.menu-active{background:#fff!important;color:var(--g-brand)!important;font-weight:600;box-shadow:var(--g-sh),inset 3px 0 0 var(--g-brand),inset 0 0 0 1px var(--g-line)}\n[data-theme=guide] #foot{border-top:1px solid var(--g-line)!important;color:var(--g-muted);opacity:1;font-size:11.5px;line-height:1.5;padding:12px 18px}\n/* p\u00e1gina */\n[data-theme=guide] #main{max-width:none;padding:24px 28px 60px;gap:18px}\n[data-theme=guide] #main>div:first-child h2,[data-theme=guide] #main h2.text-xl{font-size:20px;font-weight:600;color:var(--g-brand)}\n[data-theme=guide] .text-sm.opacity-70{color:var(--g-muted);opacity:1}\n/* cart\u00f5es e n\u00fameros: como os cart\u00f5es e os mosaicos da EPISJ 360 */\n[data-theme=guide] .card,[data-theme=guide] .stat,[data-theme=guide] .rounded-box.border{border-color:var(--g-line)!important;border-radius:10px;box-shadow:var(--g-sh-sm);transition:box-shadow .2s,transform .2s,border-color .2s}\n[data-theme=guide] .card:hover{box-shadow:0 6px 18px rgba(16,24,40,.07);border-color:#d9dee5!important}\n[data-theme=guide] .card-title{font-size:16px;font-weight:600;color:var(--g-brand)}\n[data-theme=guide] .stat{background:#fff}\n[data-theme=guide] .stat:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(16,24,40,.08)}\n[data-theme=guide] .stat-title{font-size:13px;color:var(--g-muted);opacity:1}\n[data-theme=guide] .stat-value{font-weight:600;color:var(--g-ink);font-variant-numeric:tabular-nums}\n[data-theme=guide] .stat-desc{color:var(--g-muted);opacity:1}\n/* bot\u00f5es */\n[data-theme=guide] .btn{font-family:inherit;font-weight:500;font-size:13px;border-radius:7px;border:1px solid var(--g-line2);background:#fff;color:var(--g-ink);box-shadow:var(--g-sh-sm);transition:background .15s,border-color .15s,transform .08s,box-shadow .15s}\n[data-theme=guide] .btn:hover{background:#f4f6f9;border-color:var(--g-line2)}\n[data-theme=guide] .btn:active:not(:disabled){transform:scale(.96)}\n[data-theme=guide] .btn-primary{background:var(--g-brand);border-color:var(--g-brand);color:#fff;box-shadow:0 1px 2px rgba(22,50,105,.25),inset 0 1px 0 rgba(255,255,255,.12)}\n[data-theme=guide] .btn-primary:hover{background:var(--g-brand2);border-color:var(--g-brand2)}\n[data-theme=guide] .btn-ghost{background:transparent;border-color:transparent;box-shadow:none}\n[data-theme=guide] .btn-ghost:hover{background:#f1f4f8}\n[data-theme=guide] .btn-error{background:#fff;color:#dc2626;border-color:#e3b4b4}\n[data-theme=guide] .btn-error:hover{background:#fef2f2;border-color:#dc2626}\n/* 0.9.60: verde só nos botões de importar */\n[data-theme=guide] .btn-imp,[data-theme=guide] label.btn-imp{background:#2f9e57!important;border-color:#2f9e57!important;color:#fff!important;box-shadow:0 1px 2px rgba(47,158,87,.3)!important}\n[data-theme=guide] .btn-imp:hover:not(:disabled){background:#268a4b!important;border-color:#268a4b!important}\n[data-theme=guide] .btn-success,[data-theme=guide] .btn-accent{background:var(--g-brand)!important;border-color:var(--g-brand)!important;color:#fff!important}\n[data-theme=guide] input[type=file]::file-selector-button{background:#2f9e57;border:1px solid #2f9e57;color:#fff}\n[data-theme=guide] .btn:focus-visible{outline:none;box-shadow:0 0 0 2px #fff,0 0 0 4px var(--g-ring)}\n/* campos */\n[data-theme=guide] .input,[data-theme=guide] .select,[data-theme=guide] .textarea{border:1px solid var(--g-line2);border-radius:7px;background:#fff;box-shadow:var(--g-sh-sm);font-size:13.5px;color:var(--g-ink);transition:border-color .15s,box-shadow .15s}\n[data-theme=guide] .input:focus,[data-theme=guide] .input:focus-within,[data-theme=guide] .select:focus,[data-theme=guide] .textarea:focus{outline:none;border-color:var(--g-brand);box-shadow:0 0 0 3px var(--g-ring)}\n[data-theme=guide] .checkbox,[data-theme=guide] .radio,[data-theme=guide] .toggle{--input-color:var(--g-brand)}\n[data-theme=guide] .checkbox:checked,[data-theme=guide] .radio:checked,[data-theme=guide] .toggle:checked{border-color:var(--g-brand)}\n/* tabelas */\n[data-theme=guide] .table{font-size:13.5px}\n[data-theme=guide] .table th{font-size:12.5px;font-weight:500;color:var(--g-muted);text-transform:none;letter-spacing:0;border-bottom:1px solid var(--g-line)}\n[data-theme=guide] .table td{border-color:var(--g-line)}\n[data-theme=guide] .table tbody tr{transition:background .12s}\n[data-theme=guide] .table tbody tr:hover{background:#f8fafc}\n/* separadores, avisos, etiquetas */\n[data-theme=guide] .tabs .tab{font-size:13px;font-weight:500;color:#3b4456;transition:color .15s,background .15s}\n[data-theme=guide] .tabs .tab.tab-active,[data-theme=guide] .tabs .tab[aria-selected=true]{color:var(--g-brand);font-weight:600}\n[data-theme=guide] .tabs-box{background:#f1f4f8;border-radius:10px}\n[data-theme=guide] .alert{border-radius:8px;font-size:13.5px}\n[data-theme=guide] .alert-info{background:var(--g-brandbg);border-color:var(--g-sky);color:var(--g-brand)}\n[data-theme=guide] .alert-success{background:#eefaf2;border-color:#c5ecd3;color:#2f9e57}\n[data-theme=guide] .alert-warning{background:#fffbeb;border-color:#fde68a;color:#92400e}\n[data-theme=guide] .alert-error{background:#fef2f2;border-color:#fecaca;color:#b91c1c}\n[data-theme=guide] .badge{font-weight:600;border-radius:12px}\n[data-theme=guide] .progress{background:#eef1f5}\n[data-theme=guide] .progress::-webkit-progress-value{background:linear-gradient(90deg,var(--g-brand),var(--g-accent))}\n[data-theme=guide] .progress::-moz-progress-bar{background:linear-gradient(90deg,var(--g-brand),var(--g-accent))}\n/* janelas e avisos: como na EPISJ 360 */\n[data-theme=guide] .modal-box{border-radius:12px;border:1px solid var(--g-line);box-shadow:0 20px 50px rgba(15,23,42,.18)}\n[data-theme=guide] .modal[open] .modal-box{animation:gPop .28s cubic-bezier(.2,.8,.2,1.15)}\n[data-theme=guide] .modal-backdrop{background:rgba(15,23,42,.28);backdrop-filter:blur(2px)}\n[data-theme=guide] #toast .alert{background:var(--g-ink);color:#fff;border:0;border-radius:10px;box-shadow:0 10px 30px rgba(15,23,42,.25);animation:gToast .3s cubic-bezier(.2,.8,.2,1.1)}\n[data-theme=guide] #toast .alert-error{background:#dc2626}\n[data-theme=guide] #toast .alert-success{background:#2f9e57}\n/* ---------- anima\u00e7\u00f5es (como na EPISJ 360) ---------- */\n@keyframes gUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}\n@keyframes gPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:none}}\n@keyframes gToast{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}\n@keyframes gIn{from{opacity:0}to{opacity:1}}\n[data-theme=guide] body{animation:gIn .35s ease both}\n/* ao mudar de p\u00e1gina no menu: o conte\u00fado entra como as sec\u00e7\u00f5es da EPISJ 360, quadro a quadro */\n[data-theme=guide] #main.g-anim>*{animation:gUp .34s cubic-bezier(.2,.7,.2,1) both}\n[data-theme=guide] #main.g-anim>*:nth-child(2){animation-delay:.04s}\n[data-theme=guide] #main.g-anim>*:nth-child(3){animation-delay:.08s}\n[data-theme=guide] #main.g-anim>*:nth-child(4){animation-delay:.12s}\n[data-theme=guide] #main.g-anim>*:nth-child(n+5){animation-delay:.16s}\n[data-theme=guide] #main.g-anim .stat{animation:gPop .4s cubic-bezier(.2,.8,.2,1.2) both}\n[data-theme=guide] #main.g-anim .stat:nth-child(2){animation-delay:.05s}\n[data-theme=guide] #main.g-anim .stat:nth-child(3){animation-delay:.1s}\n[data-theme=guide] #main.g-anim .stat:nth-child(4){animation-delay:.15s}\n[data-theme=guide] #main.g-anim .stat:nth-child(n+5){animation-delay:.2s}\n[data-theme=guide] .g-num{display:inline-block;animation:gPop .35s cubic-bezier(.2,.8,.2,1.2)}\n@media (prefers-reduced-motion:reduce){[data-theme=guide] *{animation:none!important;transition:none!important}}\n\n[data-theme=guide] .g-lock{background:#f6f8fb!important;color:#4a5260!important;cursor:not-allowed;box-shadow:none!important}\n[data-theme=guide] .g-nota{display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#eef3fc;border:1px solid #d4e1fa;color:#163269;border-radius:8px;padding:10px 14px;font-size:13px;animation:gUp .3s cubic-bezier(.2,.7,.2,1) both}\n[data-theme=guide] .g-nota span{flex:1;min-width:240px}\n";
let ES_FONTES=null;
function esFontes(w,d){try{if(!w.FontFace||!d.fonts)return;
  ES_FONTES=ES_FONTES||Promise.all([400,500,600,700].map(p=>fetch(new URL("fonts/poppins-latin-"+p+".woff2",location.href)).then(r=>r.ok?r.arrayBuffer():null).then(b=>[p,b],()=>[p,null])));
  ES_FONTES.then(L=>{for(const [p,b] of L){if(!b)continue;try{const f=new w.FontFace("Poppins",b.slice(0),{weight:String(p),style:"normal",display:"swap"});d.fonts.add(f);f.load().catch(()=>{})}catch(e){}}})}catch(e){}}
function esAjustar(fr){try{const w=fr.contentWindow,d=fr.contentDocument;if(!d||!d.documentElement)return;const R=d.documentElement;
  if(!d.getElementById("guide-tema")){
    esFontes(w,d); // 0.9.50: a Poppins entra pelos bytes (o CSP do EduSchedule não deixa carregar letras de outros sites)
    ["pointerdown","keydown","input","wheel"].forEach(ev=>d.addEventListener(ev,()=>{ULT_ES=Date.now()},{capture:true,passive:true})); // 0.9.56
    const st=d.createElement("style");st.id="guide-tema";st.textContent=ES_TEMA;d.head.appendChild(st);
    // fica sempre com o tema da EPISJ 360 (sem mexer na preferência de tema guardada pela EduSpruce)
    R.setAttribute("data-theme","guide");new w.MutationObserver(()=>{if(R.getAttribute("data-theme")!=="guide")R.setAttribute("data-theme","guide")}).observe(R,{attributes:true,attributeFilter:["data-theme"]});
    const main=d.getElementById("main");
    // ao mudar de página: o conteúdo entra quadro a quadro
    const anim=()=>{if(!main)return;main.classList.remove("g-anim");void main.offsetWidth;main.classList.add("g-anim");clearTimeout(main._ga);main._ga=setTimeout(()=>main.classList.remove("g-anim"),700)};
    w.addEventListener("hashchange",anim);anim();
    // números dos mosaicos: contam até ao valor novo, como no resto da EPISJ 360
    if(main){const ant=new Map();let pend=false;
      const ver=()=>{pend=false;main.querySelectorAll(".stat").forEach(s=>{const t=(s.querySelector(".stat-title")||{}).textContent||"",v=s.querySelector(".stat-value");if(!v)return;
        const txt=v.textContent,old=ant.get(t);ant.set(t,txt);if(old==null||old===txt||v._g)return;
        const a=parseFloat(String(old).replace(",",".")),b=parseFloat(String(txt).replace(",",".")),m=String(txt).match(/^(\D*)(-?\d+)(\D*)$/);
        if(m&&isFinite(a)&&isFinite(b)&&String(old).match(/^(\D*)(-?\d+)(\D*)$/)){v._g=1;const t0=performance.now(),D=450;
          const passo=n=>{const k=Math.min(1,(n-t0)/D),e=1-Math.pow(1-k,3);v.firstChild&&v.childNodes.length===1?v.textContent=m[1]+Math.round(a+(b-a)*e)+m[3]:0;if(k<1)w.requestAnimationFrame(passo);else{v.textContent=txt;v._g=0}};w.requestAnimationFrame(passo)}
        else{v.classList.remove("g-num");void v.offsetWidth;v.classList.add("g-num")}})};
      new w.MutationObserver(()=>{if(!pend){pend=true;w.requestAnimationFrame(ver)}}).observe(main,{childList:true,subtree:true,characterData:true});ver()}}
  {let pb=false;const bl=()=>{pb=false;try{esBloquear(d)}catch(e){}};new w.MutationObserver(()=>{if(!pb){pb=true;w.requestAnimationFrame(bl)}}).observe(d.body,{childList:true,subtree:true});bl()}
  const f=d.querySelector("#foot");if(f)f.textContent="Os dados ficam guardados na EPISJ 360 (neste navegador e na nuvem da EPISJ 360).";
  // 0.9.27: no menu do Horários360, o logótipo e o nome do módulo ficam iguais aos das outras páginas (logótipo centrado, linha por baixo, nome do módulo em maiúsculas pequenas)
  {const lg=d.getElementById("logo"),cx=lg&&lg.parentElement;if(cx&&!cx.dataset.guide){cx.dataset.guide="1";cx.style.cssText+=";display:flex;flex-direction:column;align-items:stretch;gap:0";
    const cab=d.createElement("a");cab.href="https://www.episj.com";cab.target="_blank";cab.rel="noopener";cab.title="Escola Profissional da Ilha de São Jorge";
    cab.style.cssText="display:block;margin:0 0 12px;padding:0 4px 12px;border-bottom:1px solid #e3e7ee";
    const im=d.createElement("img");im.src=new URL("img/logo-episj.png",location.href).href;im.alt="Escola Profissional da Ilha de São Jorge";im.style.cssText="display:block;width:100%;max-width:92px;height:auto;margin:0 auto";im.onerror=()=>cab.remove();
    cab.appendChild(im);lg.replaceWith(cab);const nm=cx.querySelector(".fd");
    if(nm){nm.style.cssText+=";line-height:normal;padding:9px 5px 8px;font-weight:600";nm.className="g-mh";nm.removeAttribute("style");nm.innerHTML='<span>Horários360</span><span class="g-msub">horários da escola</span>'}cab.classList.add("g-logo")}} // 0.9.101: classes (as cores vêm do tema)
  if(!d.getElementById("guide-tema2")){const s2=d.createElement("style");s2.id="guide-tema2";s2.textContent=esTema2();d.head.appendChild(s2)}
  try{h3EsMenu(d)}catch(e){console.warn(e)} // 0.9.136: Simples / Completa e o caminho de volta também no menu do editor
  esTemaSinc();
  fr.classList.add("pronto")}catch(e){console.warn("Horários360/tema",e);fr.classList.add("pronto")}}
/* ---------- 0.9.101: o Horários360 congruente com o resto da EPISJ 360 ----------
   O tema do Horários360 segue o tema escolhido nas Definições («360» ou «Cobalto»): cores, letra, menu lateral igual ao
   dos outros módulos (barra lilás no item ativo), cartões de números e bloco de destaque como nos Anos letivos, sem
   anéis e sem verde (o verde é só dos botões de importar). No Cobalto o logótipo da EPISJ 360 fica no topo do menu,
   como nos outros módulos. Tudo é posto pela EPISJ 360 ao abrir: o EduSchedule da EduSpruce não muda. */
function esTemaSinc(){try{const fr=$("#esFr"),d=fr&&fr.contentDocument;
  const dsk=innerWidth>=1024,cob=document.documentElement.getAttribute("data-tema")==="cobalto";
  // bloco do logótipo da EPISJ 360 (Cobalto, computador): o mesmo do menu lateral dos outros módulos
  let eb=$("#esBrand");
  if(!eb){const sb=document.querySelector("nav.side .sbrand");if(sb){eb=document.createElement("div");eb.id="esBrand";const c=sb.cloneNode(true);eb.appendChild(c);
      c.querySelectorAll("[data-ver]").forEach(x=>x.textContent="v"+VERSAO);
      const v=c.querySelector(".ver");if(v){v.title="Ver as novidades";v.addEventListener("click",e=>{e.stopPropagation();novAbrir("",true)})}
      document.body.appendChild(eb);if(window.ResizeObserver)new ResizeObserver(()=>esTemaSinc()).observe(eb)}}
  if(!d||!d.documentElement)return;const R=d.documentElement,cs=getComputedStyle(document.documentElement),V=n=>cs.getPropertyValue(n).trim();
  R.setAttribute("data-gtema",document.documentElement.getAttribute("data-tema")||"360");
  const m={"--g-brand":"--brand","--g-brand2":"--brand2","--g-brandbg":"--brandbg","--g-ink":"--ink","--g-muted":"--muted","--g-line":"--line","--g-line2":"--line2","--g-ring":"--ring","--g-sky":"--sky","--g-bg":"--bg","--g-side":"--side","--g-side2":"--side2","--g-sideh":"--sideh"};
  for(const k in m){const v=V(m[k]);if(v)R.style.setProperty(k,v);else R.style.removeProperty(k)}
  R.style.setProperty("--g-font",getComputedStyle(document.body).fontFamily||"Poppins,system-ui,sans-serif");
  const fb=$("#fundos"),pe=dsk&&document.body.classList.contains("temfundos")&&fb&&!fb.hidden?Math.round(fb.getBoundingClientRect().height):0;
  R.style.setProperty("--g-pe",pe+"px");
  if(dsk&&cob&&eb&&document.body.classList.contains("esch")){const t=eb.getBoundingClientRect().bottom-fr.getBoundingClientRect().top;R.style.setProperty("--g-topo",Math.max(16,Math.round(t))+"px")}else R.style.removeProperty("--g-topo")}catch(e){console.warn("Horários360/tema",e)}}
addEventListener("resize",()=>{clearTimeout(esTemaSinc._t);esTemaSinc._t=setTimeout(esTemaSinc,120)});
function esTema2(){return `/* EPISJ 360 0.9.101 \u2014 o Hor\u00e1rio360 com o aspeto atual da EPISJ 360 (segue o tema das Defini\u00e7\u00f5es) */
[data-theme=guide]{--g-mc:#9b8cff;--g-font:Poppins,system-ui,sans-serif;
  --color-primary:var(--g-brand);--color-secondary:var(--g-brand);--color-info:var(--g-brand);
  --color-accent:var(--g-brand);--color-success:var(--g-brand);--color-success-content:#fff;
  --fbody:var(--g-font);--fdisplay:var(--g-font)}
[data-theme=guide] body{font-family:var(--g-font);background:var(--g-bg,#f8f9fb);color:var(--g-ink)}
[data-theme=guide] h1,[data-theme=guide] h2,[data-theme=guide] h3,[data-theme=guide] .fd{font-family:var(--g-font)}
/* menu lateral: igual ao dos outros m\u00f3dulos */
[data-theme=guide] .drawer-side aside{width:var(--g-navw,220px)}
[data-theme=guide] aside>div:first-child{padding:16px 12px 2px!important}
[data-theme=guide] aside .g-logo{border-bottom-color:var(--g-line)!important}
[data-theme=guide] aside>div:first-child>span.g-mh{display:block;padding:6px 11px 8px!important;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--g-muted);line-height:1.35}
[data-theme=guide] aside>div:first-child>span.g-mh>span:first-child{display:block;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:inherit}
[data-theme=guide] aside>div:first-child>span.g-mh>span.g-msub{display:block;margin-top:1px;font-size:11.5px;font-weight:500;letter-spacing:0;text-transform:none;color:#9aa1ad}
[data-theme=guide] #nav{padding:0 12px 16px;gap:3px}
[data-theme=guide] #nav .menu-title{padding:14px 11px 6px;font-size:11px;letter-spacing:.06em}
[data-theme=guide] #nav li>a{min-height:38px;padding:5px 11px;gap:10px;border-radius:7px;font-size:13px;font-weight:500;color:#3b4456}
[data-theme=guide] #nav li>a svg{box-sizing:border-box;width:28px;height:28px;padding:5.5px;border-radius:9px;flex:none;background:linear-gradient(#f6f8fc,#edf1f8);box-shadow:inset 0 0 0 1px rgba(22,50,105,.07);color:#41506b}
[data-theme=guide] #nav li>a:hover svg{transform:none}
[data-theme=guide] #nav li>a.menu-active{background:#fff!important;color:var(--g-brand)!important;font-weight:600;box-shadow:0 1px 3px rgba(15,23,42,.06),0 1px 2px rgba(15,23,42,.04),inset 3px 0 0 var(--g-mc),inset 0 0 0 1px var(--g-line)}
[data-theme=guide] #nav li>a.menu-active svg{background:#fff;color:var(--g-brand);box-shadow:inset 0 0 0 1px var(--g-line2),0 1px 2px rgba(16,24,40,.06)}
[data-theme=guide] #nav .badge{margin-left:auto;min-width:18px;height:18px;border:0;border-radius:9px;background:var(--g-brand);color:#fff;font-size:11px;font-weight:700;padding:0 5px}
/* Cobalto: menu azul, texto branco, \u00edcones sem p\u00edlula, item ativo com a barra lil\u00e1s; o log\u00f3tipo da EPISJ 360 fica por cima (posto pela EPISJ 360) */
[data-gtema=cobalto] .drawer-side aside{background:var(--g-side)!important;border-right:0!important;color:#fff}
[data-gtema=cobalto] aside .g-logo{display:none!important}
@media (min-width:1024px){[data-gtema=cobalto] aside>div:first-child{padding-top:var(--g-topo,16px)!important}}
[data-gtema=cobalto] aside>div:first-child>span.g-mh,[data-gtema=cobalto] aside>div:first-child>span.g-mh>span.g-msub,[data-gtema=cobalto] #nav .menu-title{color:rgba(255,255,255,.62)}
[data-gtema=cobalto] #nav li>a{color:#fff;border-radius:10px}
[data-gtema=cobalto] #nav li>a svg,[data-gtema=cobalto] #nav li>a.menu-active svg{background:none;box-shadow:none;color:#fff}
[data-gtema=cobalto] #nav li>a:hover{background:var(--g-sideh,rgba(255,255,255,.09))}
[data-gtema=cobalto] #nav li>a.menu-active{background:var(--g-side2)!important;color:#fff!important;box-shadow:inset 3px 0 0 var(--g-mc)}
[data-gtema=cobalto] #nav .badge{background:#fff;color:var(--g-side2)}
[data-gtema=cobalto] #foot{color:rgba(255,255,255,.7);border-top-color:rgba(255,255,255,.14)!important}
[data-gtema=cobalto] header.navbar{background:#fff}
[data-gtema=cobalto] .card,[data-gtema=cobalto] .stat{border-radius:8px}
[data-gtema=cobalto] .btn{border-radius:8px;font-weight:600;box-shadow:none}
[data-gtema=cobalto] .table th{font-size:11.5px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:#767676}
[data-gtema=cobalto] .table td{border-color:#ececec}
/* p\u00e1gina: a barra dos log\u00f3tipos fica por cima do fundo da janela (como nos outros m\u00f3dulos) */
[data-theme=guide] #main{padding-bottom:calc(60px + var(--g-pe,0px))}
[data-theme=guide] #toast{margin-bottom:var(--g-pe,0px)}
/* 0.9.134: as janelas tamb\u00e9m ficam acima da barra dos log\u00f3tipos */
[data-theme=guide] .modal{padding-bottom:var(--g-pe,0px)}
[data-theme=guide] .modal-box{max-height:calc(100vh - 5em - var(--g-pe,0px))}
/* t\u00edtulo de cada p\u00e1gina: bloco de destaque como nos Anos letivos (t\u00edtulo grande e linha de apoio por baixo) */
[data-theme=guide] #main>div:first-child:has(>h2){padding:18px 20px;border:1px solid var(--g-line);border-radius:14px;background:linear-gradient(var(--g-brandbg),transparent 70%);row-gap:6px}
[data-theme=guide] #main>div:first-child>h2:has(+span.text-sm){flex-basis:100%}
[data-theme=guide] #main>div:first-child>h2{font-size:30px!important;font-weight:650!important;letter-spacing:-.03em;line-height:1.1;color:var(--g-ink)!important}
[data-theme=guide] #main>div:first-child>h2+span.text-sm{font-size:13.5px}
@media (max-width:640px){[data-theme=guide] #main>div:first-child:has(>h2),[data-theme=guide] #main>div:first-child:has(>h2)+.grid:has(>.stat){padding-left:14px;padding-right:14px}[data-theme=guide] #main>div:first-child>h2{font-size:25px!important}}
/* Painel: o t\u00edtulo e os n\u00fameros principais formam um s\u00f3 bloco de destaque */
[data-theme=guide] #main>div:first-child:has(>h2):has(+.grid>.stat){border-bottom:0;border-radius:14px 14px 0 0;padding-bottom:6px;background:linear-gradient(var(--g-brandbg),color-mix(in srgb,var(--g-brandbg) 55%,transparent))}
[data-theme=guide] #main>div:first-child:has(>h2)+.grid:has(>.stat){margin-top:-18px;padding:12px 20px 18px;gap:10px;border:1px solid var(--g-line);border-top:0;border-radius:0 0 14px 14px;background:linear-gradient(color-mix(in srgb,var(--g-brandbg) 55%,transparent),transparent 60%)}
/* cart\u00f5es de n\u00fameros: r\u00f3tulo pequeno em cima, n\u00famero a seguir, sem sombra */
[data-theme=guide] .stat{padding:10px 12px!important;border-radius:10px;box-shadow:none!important;background:#fff}
[data-theme=guide] .stat:hover{transform:none;box-shadow:none!important}
[data-theme=guide] .stat-title{font-size:12px;line-height:1.3}
[data-theme=guide] .stat-value{font-size:21px!important;font-weight:650;line-height:1.25;margin-top:2px;letter-spacing:-.01em}
[data-theme=guide] .stat-desc{font-size:12px;line-height:1.35;margin-top:1px}
[data-theme=guide] .stat .progress{height:4px;margin-top:6px}
[data-theme=guide] .progress::-webkit-progress-value{background:var(--g-brand)}
[data-theme=guide] .progress::-moz-progress-bar{background:var(--g-brand)}
[data-theme=guide] .card .grid>.bg-base-200.rounded-box{background:#fff;border:1px solid var(--g-line);border-radius:10px;padding:10px 12px;transition:border-color .15s}
[data-theme=guide] .card .grid>a.bg-base-200.rounded-box:hover{border-color:var(--g-brand)}
[data-theme=guide] .card .grid>.bg-base-200.rounded-box>.text-xs{font-size:12px;color:var(--g-muted);opacity:1}
[data-theme=guide] .card .grid>.bg-base-200.rounded-box>.text-xl{font-size:20px;font-weight:650;line-height:1.3}
/* mosaicos com barra de estado (Diagn\u00f3stico, etc.): r\u00f3tulo em cima e n\u00famero a seguir, como os outros */
[data-theme=guide] #main .grid>.rounded-box.border-l-4{display:flex;flex-direction:column-reverse;justify-content:flex-end;gap:2px;padding:10px 12px;border-left-width:3px;box-shadow:none}
[data-theme=guide] #main .grid>.rounded-box.border-l-4>.text-2xl{font-size:21px;font-weight:650;line-height:1.25;text-align:left!important}
[data-theme=guide] #main .grid>.rounded-box.border-l-4>.text-xs{font-size:12px;color:var(--g-muted);opacity:1}
[data-theme=guide] .rounded-box.border{box-shadow:none}
/* cart\u00f5es e widgets: cantos de 10 px, sem sombra */
[data-theme=guide] .card{border-radius:10px;box-shadow:none}
[data-theme=guide] .card:hover{box-shadow:none;border-color:var(--g-line)!important}
/* \u00edndice de qualidade: n\u00famero grande, sem anel */
[data-theme=guide] .radial-progress{width:auto!important;height:auto!important;display:block;background:none}
[data-theme=guide] .radial-progress::before,[data-theme=guide] .radial-progress::after{display:none!important}
[data-theme=guide] .radial-progress>span{color:inherit!important;font-size:30px!important;font-weight:650!important;letter-spacing:-.03em;line-height:1.05}
[data-theme=guide] #pn-indice{background:#fff!important;border:1px solid var(--g-line);border-radius:10px;align-items:flex-start!important;padding:14px 16px!important;gap:2px!important}
[data-theme=guide] #pn-indice .text-center{text-align:left}
[data-theme=guide] #pn-crit .bg-success{background:color-mix(in srgb,var(--g-brand) 40%,#fff)}
[data-theme=guide] #pn-crit .bg-base-200{background:#eef1f5}
/* sem verde fora dos bot\u00f5es de importar */
[data-theme=guide] .alert-success{background:var(--g-brandbg);border-color:var(--g-sky);color:var(--g-brand)}
[data-theme=guide] #toast .alert-success{background:var(--g-ink)}
`}
/* ---------- no EduSchedule, formadores, turmas e formandos só se veem: são dados gerais da EPISJ 360 (mudam-se no módulo Escola) ---------- */
function esBloquear(d){if(!d||!d.body)return;const TIT="Dado geral da EPISJ 360 — muda-se no módulo Escola";
  d.querySelectorAll('[id^="d-classes-"][id$="-name"],[id^="d-classes-"][id$="-full"],[id^="d-classes-"][id$="-dt"],[id^="d-teachers-"][id$="-name"],[id^="d-teachers-"][id$="-short"],#al-nome,#al-num,#al-cls').forEach(el=>{
    if(el.dataset.glock)return;el.dataset.glock="1";if(el.tagName==="SELECT")el.disabled=true;else el.readOnly=true;el.classList.add("g-lock");el.title=TIT;
    const tr=el.closest("tr");if(tr)tr.querySelectorAll("button").forEach(b=>{if(/^Apagar$/.test(b.textContent.trim()))b.style.display="none"})});
  // formandos: sem apagar nas linhas (o horário e as aulas continuam)
  d.querySelectorAll("#main tr").forEach(tr=>{const bs=[...tr.querySelectorAll("button")];if(bs.some(b=>b.textContent.trim()==="Horário"))bs.forEach(b=>{if(b.textContent.trim()==="Apagar")b.style.display="none"})});
  const sel=d.querySelector("#se-col-classes");if(sel)[...sel.options].forEach(o=>{if(o.value==="dt")o.remove()});
  const nota=(b,txt,tab,lbl)=>{if(b.dataset.glock)return;b.dataset.glock="1";b.style.display="none";const n=d.createElement("div");n.className="g-nota";
    n.innerHTML=`<span>${txt}</span>`;const a=d.createElement("button");a.type="button";a.className="btn btn-sm";a.textContent=lbl;a.onclick=()=>{mostrarModulo("escola",false);show(tab)};n.appendChild(a);
    const row=b.parentElement;row.parentElement.insertBefore(n,row.nextSibling)};
  d.querySelectorAll("#main button").forEach(b=>{const t=b.textContent.trim();
    if(t==="Acrescentar turma")nota(b,"As turmas são dados gerais da EPISJ 360: acrescentam-se, mudam de nome, de orientador educativo e apagam-se no módulo Escola. Aqui escolhe-se só o que é do horário (sala, limites por dia, grelha…).","tur","Abrir Escola › Turmas");
    else if(/^Acrescentar (professor|formador)$/.test(t))nota(b,"Os formadores são dados gerais da EPISJ 360: acrescentam-se, mudam de nome ou sigla e apagam-se no módulo Escola. Aqui escolhe-se só o que é do horário.","prof","Abrir Escola › Formadores");
    else if(/^Novo (aluno|formando)$/.test(t)){nota(b,"Os formandos são dados gerais da EPISJ 360: acrescentam-se, mudam de turma e apagam-se no módulo Escola. Aqui escolhem-se só as aulas e as opções de cada um.","for","Abrir Escola › Formandos")}
    else if(t==="Importar lista"&&!b.dataset.glock){b.dataset.glock="1";b.style.display="none"}});
  esRotular(d)}
/* 0.9.28: na EPISJ 360 diz-se "formador" e "formando" — também no Horários360 (só no ecrã; o EduSchedule da EduSpruce fica igual) */
const ES_PAL={Professores:"Formadores",professores:"formadores",Professoras:"Formadoras",professoras:"formadoras",Professora:"Formadora",professora:"formadora",Professor:"Formador",professor:"formador",Alunos:"Formandos",alunos:"formandos",Alunas:"Formandas",alunas:"formandas",Aluno:"Formando",aluno:"formando",Aluna:"Formanda",aluna:"formanda",PROFESSORES:"FORMADORES",PROFESSOR:"FORMADOR",ALUNOS:"FORMANDOS",ALUNO:"FORMANDO"};
const ES_PAL_RE=/(^|[^\p{L}])(Professor(?:es|as|a)?|professor(?:es|as|a)?|PROFESSOR(?:ES)?|Alun[oa]s?|alun[oa]s?|ALUNOS?)(?=[^\p{L}]|$)/gu;
/* 0.9.112: na EPISJ 360 os diretores de turma chamam-se "orientadores educativos" — também no Horários360 (só no ecrã) */
const ES_OE_RE=/(^|[^\p{L}])([Dd])iretor(es|as?)? d[ae] [Tt]urma(?=[^\p{L}]|$)/gu;
function esOE(v){return v.replace(ES_OE_RE,(m,a,d,f)=>a+(d==="D"?"O":"o")+"rientador"+(f==="es"?"es educativos":f==="as"?"as educativas":f==="a"?"a educativa":" educativo"))
  .replace(/(^|[^\p{L}])(do|o|ao|pelo) DT(?=[^\p{L}]|$)/gu,"$1$2 orientador educativo").replace(/\(DT\)/g,"(OE)").replace(/(^|[^\p{L}])DT:/gu,"$1Orientador educativo:")}
// 0.9.136: também as abreviaturas («profs», «prof.») e «docente(s)» sozinho (fica «serviço docente», o nome oficial da DSD)
const ES_PAL2_RE=/(^|[^\p{L}])(Profs|profs|Prof\.|prof\.|Docentes|docentes|Docente|docente)(?=[^\p{L}]|$)/gu,ES_PAL2={Profs:"Formadores",profs:"formadores","Prof.":"Form.","prof.":"form.",Docentes:"Formadores",docentes:"formadores",Docente:"Formador",docente:"formador"};
function esRotularTxt(v){return esOE(v.replace(ES_PAL_RE,(m,a,w)=>a+(ES_PAL[w]||w)).replace(ES_PAL2_RE,(m,a,w,o,str)=>/servi[çc]o\s*$/i.test(str.slice(0,o+a.length))?m:a+(ES_PAL2[w]||w)))}
function esRotular(d){if(!d||!d.body)return;const w=d.createTreeWalker(d.body,4);let n;
  while(n=w.nextNode()){const v=n.nodeValue;if(!v||!/rof|lun|ROF|LUN|iretor|DT|ocente/.test(v))continue;const p=n.parentNode;if(p&&/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName))continue;const r=esRotularTxt(v);if(r!==v)n.nodeValue=r}
  d.querySelectorAll("[placeholder],[title],[aria-label]").forEach(el=>{for(const a of["placeholder","title","aria-label"]){const v=el.getAttribute(a);if(v&&/rof|lun|iretor|DT|ocente/i.test(v)){const r=esRotularTxt(v);if(r!==v)el.setAttribute(a,r)}}});
  d.querySelectorAll("option").forEach(o=>{const v=o.textContent;if(/rof|lun|iretor|DT|ocente/i.test(v)){const r=esRotularTxt(v);if(r!==v)o.textContent=r}})}

function esRecarregar(forcar){if(!$("#esFr"))return;if(curTab!=="esch"){if(forcar)ES_SIG="";return}if(forcar||ES_SIG!==esSig())esAbrir()}
function esMostrar(){document.body.classList.add("esch");const fr=$("#esFr");if(!fr.src&&!fr.srcdoc||ES_ANO!==anoAtivo().id||ES_SIG!==esSig())esAbrir()}

renderAnoTopo();
if(curMod!=="boxcheck"){const M=MODULOS.find(x=>x.id===curMod);if(M)try{show(M.inicio)}catch(e){console.error("EPISJ 360: não foi possível abrir "+M.nome+" no arranque",e)}} // 0.9.93: um módulo com erro nunca impede a entrada

/* ---------- 0.10: menu e barra de cada módulo como no EduSchedule ---------- */
{const SUB={econo:"economato da escola",folder:"arquivo físico dos dossiers",pass:"palavras-passe da escola",pap:"provas de aptidão profissional",social:"redes sociais",escola:"dados comuns da escola",eduschedule:"horários da escola",roomcheck:"reservas de espaços",boxcheck:"entregas na Box"};
 document.querySelectorAll("#nav .mgrp").forEach(g=>{const h=g.querySelector(".mh");if(!h||h.querySelector(".msub"))return;const t=g.dataset.m?SUB[g.dataset.m]:"definições gerais";if(t)h.insertAdjacentHTML("beforeend",`<span class="msub">${t}</span>`)});
 const sb=document.createElement("div");sb.id="subbar";sb.innerHTML=`<span class="sst" id="subSt"></span>`;const mn=document.querySelector("main");mn.insertBefore(sb,mn.firstChild);
 const u=document.querySelector(".top .undo"),f=document.querySelector(".top .fsz");if(u)sb.appendChild(u);if(f)sb.appendChild(f);
 const ic=d=>`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"/></svg>`;
 const ub=document.getElementById("undoBtn"),rb=document.getElementById("redoBtn");if(ub){ub.innerHTML=ic("M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11");ub.setAttribute("aria-label","Anular")}if(rb){rb.innerHTML=ic("m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13");rb.setAttribute("aria-label","Refazer")}
 // 0.9.39: o estado diz onde está mesmo guardado (navegador, nuvem da EPISJ 360 com o Office 365, OneDrive) e há um botão para enviar já
 {const b=document.createElement("button");b.id="subUp";b.className="subup";b.title="Guardar já tudo na base de dados da EPISJ 360 (e uma cópia no seu OneDrive)";
   b.innerHTML=ic("M12 16V4m0 0-4.5 4.5M12 4l4.5 4.5M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3")+"<span>Guardar agora</span>";document.getElementById("subSt").after(b);b.onclick=()=>guardarAgora()}
 const est=()=>{const el=document.getElementById("subSt");if(!el)return;const hm=t=>new Date(t).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"});let t="Guardado só neste navegador",tit="";
   try{const ms=nuvMS(),od=+(localStorage.getItem("g360_od_t")||0);
     if(nuvDesl()&&ms&&!nuvSB()){t="Guardado só neste navegador";tit="A nuvem com o Office 365 só funciona depois de atualizar o serviço de avisos na Cloudflare (ficheiro servidor/boxcheck-avisos.js)."}
     else if(NUV.erro)t="Guardado neste navegador (a nuvem volta a tentar)";
     else if(NUV.ultimo)t="Guardado "+(NUV.via==="sb"?"na base de dados (Supabase)":"na nuvem"+(ms?" (Office 365)":""))+" às "+hm(NUV.ultimo);
     else if(NUV.ativo)t="Guardado "+(NUV.via==="sb"?"na base de dados (Supabase)":"na nuvem"+(ms?" (Office 365)":""));
     if(od)tit=(tit?tit+"\n":"")+"Última cópia no OneDrive: "+new Date(od).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"});
     if(RO){t=PUB&&PUB.t?"Só leitura · publicado a "+new Date(PUB.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):"Só leitura";tit="Os dados são os que a Direção publicou; só a Direção os muda."} // 0.9.50
     const b=document.getElementById("subUp");if(b)b.hidden=!!RO}catch(e){}el.textContent=t;el.title=tit};
 window.__subEst=est;
 est();setInterval(est,4000)}
loginUI();
