/* ===================== EPISJ 360 0.9.59: Crono360 — cronogramas e pontos de situação =====================
   Junta o Plano Curricular de cada turma (módulos/UFCD/UC e horas), o horário do Horários360 (aulas, versões ao longo do ano,
   semanas A/B, semestres, grupos de semanas e acertos do plano anual), o Calendário Escolar (interrupções, feriados e a FCT de
   cada turma) e o que já aconteceu (aulas anuladas, eventos e exames do Horários360, correções das horas dadas) e responde a:
   · quando começa e acaba cada módulo (cronograma), e se cabe no ano;
   · quantas horas já foram dadas, quantas faltam e se o horário chega para cumprir o plano (ponto de situação);
   · o que mudar no horário para cumprir (ajustes).
   Os pontos de situação ficam guardados (manuais e automáticos) para se ver a evolução. Unidades: tempos letivos do horário;
   as horas do plano valem 1 tempo cada (ou 60 minutos, nas Definições). */
var CR={t:0,pontos:[],del:{}},CR_SEL={ano:"",t:"",tc:"",asof:"",ver:"",cmp:""},CR_CACHE={k:"",m:null};
const crPronto=DB.get("kv","crono").then(v=>{if(!RO)CR=crNorm(v)}).catch(()=>{});
function crNorm(v){const o=v&&typeof v==="object"?v:{};return{t:+o.t||0,pontos:Array.isArray(o.pontos)?o.pontos.filter(p=>p&&p.id):[],del:o.del&&typeof o.del==="object"?o.del:{},apl:Array.isArray(o.apl)?o.apl.filter(p=>p&&p.id):[]}}
function crJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{}),m=new Map();for(const p of(b.pontos||[]).concat(a.pontos||[]))if(p&&p.id&&!del[p.id]){const q=m.get(p.id);if(!q||(p.em||0)>=(q.em||0))m.set(p.id,p)}
  const ma=new Map();for(const p of(b.apl||[]).concat(a.apl||[]))if(p&&p.id){const q=ma.get(p.id);if(!q||(p.anulada||0)>=(q.anulada||0))ma.set(p.id,p)}
  return{t:Math.max(a.t||0,b.t||0),pontos:[...m.values()].sort((x,y)=>String(y.data).localeCompare(String(x.data))||(y.em||0)-(x.em||0)),del,apl:[...ma.values()].sort((x,y)=>(y.em||0)-(x.em||0)).slice(0,60)}}
var crH=null;
function crGuardar(){if(RO||LIMPAR)return;CR.t=Date.now();DB.put("kv","crono",CR);clearTimeout(crH);nuvFila("crH",()=>{try{if(NUVOK()&&!nuvDesl())nuvemPut("CR",CR,CR.t)}catch(e){}},3000);try{guidePubAgendar()}catch(e){}}
async function crTrazerNuvem(){try{await crPronto;if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{};
    if(idx.CR&&(idx.CR.t||0)>(CR.t||0)){const j=crNorm(await nuvemGet("CR")),n=crJuntar(CR,j);const mais=n.pontos.length>j.pontos.length;CR=n;DB.put("kv","crono",CR);if(mais)nuvemPut("CR",CR,Date.now());if(curTab&&curTab.startsWith("cr"))crRender(curTab)}
    else if((CR.t||0)>((idx.CR||{}).t||0)&&CR.pontos.length)await nuvemPut("CR",CR,CR.t)}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Crono360/nuvem",e)}
  crAutoAgendar()}
function crPublico(){return{pontos:CR.pontos.slice(0,16)}}
// definições e correções (em cfg.escola.crono: juntam-se, anulam-se e publicam-se com o resto da escola)
function crCfg(){const E=escData();if(!E.crono||typeof E.crono!=="object")E.crono={};const c=E.crono;if(!c.def||typeof c.def!=="object")c.def={};const d=c.def;
  if(d.hora!=="60")d.hora="tl";if(d.fct!==false)d.fct=true;if(d.anul!==false)d.anul=true;if(!["desligado","semanal","quinzenal","mensal","periodo"].includes(d.auto))d.auto="semanal";if(!(d.dia>=1&&d.dia<=5))d.dia=5;
  if(!d.fimT||typeof d.fimT!=="object")d.fimT={};if(!d.mapa||typeof d.mapa!=="object")d.mapa={};if(!Array.isArray(c.corr))c.corr=[];
  // 0.9.117: cronograma escrito à mão (por omissão) — os tempos por semana não vêm do Horários360
  if(d.fonte!=="horario")d.fonte="manual";if(!d.tlT||typeof d.tlT!=="object")d.tlT={};if(!Array.isArray(c.man))c.man=[];if(!Array.isArray(c.dia))c.dia=[];return c}
const crPodeEditar=()=>!RO&&podePublicar();
function crAnoSel(){const E=escData();return E.anos.find(x=>x.id===CR_SEL.ano)||anoAtivo()}
// estado do Horários360 de um ano letivo (lido uma vez por versão gravada)
function crEstado(a){const x=ESD.porAno&&ESD.porAno[a.id];if(!x||!x.estado)return null;const k=a.id+":"+x.estado.length+":"+(x.quando||0);
  if(CR_CACHE.est&&CR_CACHE.est.k===k)return CR_CACHE.est.st;let st=null;try{st=JSON.parse(x.estado);if(st&&st.example)st=null}catch(e){st=null}CR_CACHE.est={k,st};return st}
// periodicidade (igual ao Horários360: ciclo de K semanas e dois semestres)
const crK=st=>Math.max(2,Math.min(4,(st&&st.ciclo)|0||2));
function crPerParts(per,K){per=per||"";const out={w:null,s:null};for(const x of per.split("/")){if(x==="A")out.w=[0];else if(x==="B")out.w=[1];else if(x[0]==="W")out.w=[...new Set(x.slice(1).split("").map(d=>+d-1).filter(d=>d>=0&&d<K))];else if(x==="S1")out.s=0;else if(x==="S2")out.s=1}if(out.w&&(!out.w.length||out.w.length>=K))out.w=null;return out}
function crPerMask(per,K){K=K||2;const full=(1<<(2*K))-1;if(!per)return full;const pp=crPerParts(per,K);let m=0;for(let sem=0;sem<2;sem++){if(pp.s!=null&&pp.s!==sem)continue;for(let w=0;w<K;w++){if(pp.w&&!pp.w.includes(w))continue;m|=1<<((sem===0?K:0)+(K-1-w))}}return m||full}
const crPerBit=(w,sem,K)=>(sem===0?K:0)+(K-1-w);
function crVersoes(st){if(!Array.isArray(st.horarios)||!st.horarios.length)return[{id:"",nome:"Horário único",de:st.inicio||"",ate:st.fim||"",lessons:st.lessons||[],cards:st.cards||[]}];
  return st.horarios.map(v=>v.id===st.hAtivo?Object.assign({},v,{lessons:st.lessons||[],cards:st.cards||[]}):v)}
const crSeg=s=>{const d=calD(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return calS(d)};
const crH1=(v,f)=>Math.round((v/(f||1))*10)/10; // tempos → horas do plano (1 casa decimal)
const crNum=v=>(Math.round((+v||0)*10)/10).toLocaleString("pt-PT");
/* ---------- o motor ---------- */
function crMotor(a,asof,stX,op){asof=asof||calHoje();const st=stX||crEstado(a),cc=crCfg(),d=cc.def,E=escData(),man=((op&&op.fonte)||d.fonte)!=="horario"; // op (0.9.117): {fonte, ovr} — simulações, sem cache
  const ck=[a.id,asof,a.inicio,a.fim,JSON.stringify(a.ferias||[]),JSON.stringify(calDe(a).marcos.filter(m=>m.tipo==="fct")),JSON.stringify(d),JSON.stringify(cc.corr.filter(x=>x.anoId===a.id)),
    pcPlanos().filter(p=>p.anoId===a.id).map(p=>p.id+":"+p.turmaId+":"+esHash(JSON.stringify(p.linhas||[]))).join(","),CR_CACHE.est&&CR_CACHE.est.k||"",st?1:0,turmasDoAno(a).map(t=>t.id).join(","),esHash(JSON.stringify(ESD.mapaC||{})),man?esHash(JSON.stringify(cc.man.filter(x=>x&&x.anoId===a.id)))+esHash(JSON.stringify((cc.dia||[]).filter(x=>x&&x.anoId===a.id))):""].join("|");
  if(!stX&&!op&&CR_CACHE.k===ck&&CR_CACHE.m)return CR_CACHE.m;
  const NL=calNaoLetivos(a),ini=a.inicio||(st&&st.inicio)||"",fim=a.fim||(st&&st.fim)||"";
  const R={manual:man,a,asof,st,ini,fim,turmas:new Map(),semPar:new Map(),fator:d.hora==="60"?60/((st&&+st.tlMin)||50):1,D:[],ix:new Map(),letivo:[],semanas:[]};
  if(!ini||!fim||fim<ini){if(!stX&&!op)CR_CACHE={k:ck,m:R,est:CR_CACHE.est};return R}
  for(let x=ini,i=0;x<=fim&&i<420;x=calMais(x,1),i++){R.D.push(x);R.ix.set(x,R.D.length-1)}
  const nD=(st&&Array.isArray(st.days)&&st.days.length)||5,D=R.D,N=D.length;R.nD=nD;R.NL=NL;const WD=D.map(x=>(calD(x).getDay()+6)%7);R.WD=WD;
  R.letivo=D.map(x=>{const w=(calD(x).getDay()+6)%7;return w<nD&&!NL.has(x)});
  // semanas: paridade A/B como no Horários360 (só contam as semanas com dias letivos)
  const semIdx=new Array(N),par=new Array(N);{let tw=0,ultima="",p=0;const K=crK(st);for(let i=0;i<N;i++){const s=crSeg(D[i]);if(s!==ultima){ultima=s;const tem=D.slice(i,i+7).some((x,k)=>crSeg(x)===s&&R.letivo[i+k]);p=tem?(tw++)%K:0;R.semanas.push({seg:s,i})}semIdx[i]=R.semanas.length-1;par[i]=p}}
  // planos: disciplinas e módulos de cada turma (horas do plano → tempos)
  for(const t of turmasDoAno(a)){const p=pcDe(t.id,a.id);if(!p)continue;pcNorm(p);const discs=new Map();
    for(const l of p.linhas){if(!l||!l.disc)continue;const k=norm(l.disc);let o=discs.get(k);if(!o)discs.set(k,o={k,disc:l.disc,area:l.area||"",mods:[],P:0,f:new Map(),sch:new Float32Array(N),adj:new Float32Array(N),lic:new Set(),semH:0});
      const h=(+l.h||0)*R.fator;o.mods.push({mod:l.mod||"",h,f:l.f||""});o.P+=h;if(l.f)o.f.set(l.f,(o.f.get(l.f)||0)+h)}
    const fimT=(d.fimT[a.id]||{})[t.id]||"",fct=d.fct?calFctDe(a,t):[];
    const fora=new Uint8Array(N);for(let i=0;i<N;i++)if(!R.letivo[i]||(fimT&&D[i]>fimT)||fct.some(m=>D[i]>=m.de&&D[i]<=m.ate))fora[i]=1;
    R.turmas.set(t.id,{t,p,discs,fora,fct,fimT,semDisc:new Map()})}
  // 0.9.117: cronograma escrito à mão — cada número de tempos por semana vale dessa semana em diante; cada dia com aulas da turma conta 1/5 da semana
  if(man){const MM=crManMapa(a,op&&op.ovr);for(const T of R.turmas.values())for(const o of T.discs.values()){const lst=MM.get(T.t.id+"|"+o.k)||[];o.manL=lst;o.manTem=lst.length>0;o.manW=new Float32Array(R.semanas.length);const EW=new Array(R.semanas.length);
      for(let w=0;w<R.semanas.length;w++){const e=crManEnt(lst,R.semanas[w].seg);EW[w]=e;o.manW[w]=e?+e.tl||0:0}o.manE=EW;
      // 0.9.117: com tempos por dia da semana (e.dias) conta o dia certo; sem eles, cada dia com aulas vale 1/5 da semana
      for(let i=0;i<N;i++)if(!T.fora[i]){const e=EW[semIdx[i]];o.sch[i]=e&&Array.isArray(e.dias)?(+e.dias[WD[i]]||0):o.manW[semIdx[i]]/nD}}
    // 0.9.120: acertos de um dia (aula a mais, aula que não houve) — o número escrito substitui o do cronograma nesse dia
    for(const x of cc.dia||[]){if(!x||x.anoId!==a.id)continue;const T=R.turmas.get(x.turmaId),o=T&&T.discs.get(x.disc),i=R.ix.get(x.data);if(!o||i==null)continue;
      if(!o.diaM)o.diaM=new Map();o.diaM.set(i,{tl:+x.tl||0,base:o.sch[i],nota:x.nota||"",id:x.id});o.sch[i]=+x.tl||0}}
  else if(st){const K=crK(st),mid=calS(new Date((calD(ini).getTime()+calD(fim).getTime())/2)),vs=crVersoes(st),sById=new Map((st.subjects||[]).map(x=>[x.id,x]));
    const tIds=new Set(E.turmas.map(t=>t.id)),c2t=c=>tIds.has(c)?c:(ESD.mapaC||{})[c]||"";
    const discDe=(tid,sid)=>{const T=R.turmas.get(tid);if(!T)return null;const ky=tid+"|"+sid;if(T.semDisc.has(ky))return T.semDisc.get(ky);const s=sById.get(sid);let r=null;
      if(s){for(const k of T.discs.keys())if(sid==="pc_"+esHash(k)){r=k;break}
        const ns=norm(s.name||"");if(!r&&T.discs.has(ns))r=ns;if(!r&&d.mapa[ns]&&T.discs.has(d.mapa[ns]))r=d.mapa[ns];
        if(!r&&ns.length>=4)for(const k of T.discs.keys())if(k.includes(ns)||ns.includes(k)){r=k;break}}
      T.semDisc.set(ky,r);if(!r&&s){const g=R.semPar.get(norm(s.name||sid))||{nome:s.name||s.short||"?",short:s.short||"",turmas:new Set(),sid};g.turmas.add(tid);R.semPar.set(norm(s.name||sid),g)}return r};
    // cada versão do horário: aulas por dia da semana
    const porV=vs.map(v=>{const lm=new Map((v.lessons||[]).map(l=>[l.id,l])),dia=new Map();for(const c of v.cards||[]){if(c.day==null)continue;const l=lm.get(c.lessonId);if(!l||l.ign)continue;(dia.get(c.day)||dia.set(c.day,[]).get(c.day)).push([l,+c.len||1,c])}return{v,dia,lm}});
    const vDe=x=>porV.find(o=>(!o.v.de||x>=o.v.de)&&(!o.v.ate||x<=o.v.ate))||null;
    const gs=new Map((st.gsem||[]).map(g=>[g.id,new Set(g.semanas||[])]));
    // aulas de cada aula (lesson) dia a dia, para aplicar os acertos do plano anual por semana
    const porL=new Map();
    for(let i=0;i<N;i++){if(!R.letivo[i])continue;const x=D[i],o=vDe(x);if(!o)continue;const wd=(calD(x).getDay()+6)%7,seg=R.semanas[semIdx[i]].seg;
      for(const [l,len] of o.dia.get(wd)||[]){if((l.de&&x<l.de)||(l.ate&&x>l.ate))continue;if(l.gsem&&gs.has(l.gsem)&&!gs.get(l.gsem).has(seg))continue;
        if(l.per&&!(crPerMask(l.per,K)>>crPerBit(par[i],x<mid?0:1,K)&1))continue;let q=porL.get(l.id);if(!q)porL.set(l.id,q={l,dias:new Map()});q.dias.set(i,(q.dias.get(i)||0)+len)}}
    // acertos do plano anual do Horários360 (tempos numa semana): o que se escreveu à mão vale
    const pl=st.plano||{};for(const lid in pl){const q=porL.get(lid)||(()=>{for(const o of porV){const l=o.lm.get(lid);if(l)return porL.set(lid,{l,dias:new Map()}).get(lid)}return null})();if(!q)continue;
      for(const seg in pl[lid]){const wi=R.semanas.findIndex(w=>w.seg===seg);if(wi<0)continue;const i0=R.semanas[wi].i,i1=wi+1<R.semanas.length?R.semanas[wi+1].i:N,alvo=+pl[lid][seg]||0;
        const dias=[];for(let i=i0;i<i1;i++)if(R.letivo[i])dias.push(i);let tot=dias.reduce((s,i)=>s+(q.dias.get(i)||0),0);
        if(alvo>tot&&dias.length){const u=dias.filter(i=>q.dias.has(i)).pop()??dias[dias.length-1];q.dias.set(u,(q.dias.get(u)||0)+alvo-tot)}
        else for(let k=dias.length-1;k>=0&&tot>alvo;k--){const i=dias[k],v=q.dias.get(i)||0,tira=Math.min(v,tot-alvo);if(tira){q.dias.set(i,v-tira);tot-=tira}}}}
    // de cada aula para a turma × disciplina (sem os dias de FCT e depois do fim das aulas da turma)
    const dda=(l,c,tid)=>{const m=new Map();for(const ln of l.linhas||[]){if(ln.cls&&ln.cls.length&&!ln.cls.includes(c))continue;const k=discDe(tid,ln.s);if(k)m.set(k,(m.get(k)||0)+1)}return m};R.dda=dda;R.K=K;R.mid=mid;R.vDe=vDe;R.gs=gs;R.discDe=discDe;R.c2t=c2t; // 0.9.67: para o Cumprir o plano
    for(const {l,dias} of porL.values())for(const c of l.classIds||[]){const tid=c2t(c),T=R.turmas.get(tid);if(!T)continue;
      for(const k of dda(l,c,tid).keys()){const o=T.discs.get(k);o.lic.add(l.id);for(const [i,v] of dias)if(!T.fora[i])o.sch[i]+=v}}
    // tempos por semana no horário em vigor depois da data da situação (média do ciclo de semanas A/B; os feriados não contam)
    {const iN=Math.min(N-1,R.D.filter(x=>x<=asof).length),xN=D[iN],oN=vDe(xN),sN=xN<mid?0:1,segN=crSeg(xN),nSem=R.semanas.filter(w=>w.seg>=segN).length||1;
      if(oN)for(const lst of oN.dia.values())for(const [l,len] of lst){if((l.ate&&l.ate<xN)||(l.de&&l.de>xN))continue;let w=1;
        if(l.per){const m=crPerMask(l.per,K);let q=0;for(let s=0;s<K;s++)if(m>>crPerBit(s,sN,K)&1)q++;w=q/K}
        if(l.gsem&&gs.has(l.gsem)){const g=gs.get(l.gsem);w*=R.semanas.filter(x=>x.seg>=segN&&g.has(x.seg)).length/nSem}
        for(const c of l.classIds||[]){const tid=c2t(c),T=R.turmas.get(tid);if(!T)continue;for(const k of dda(l,c,tid).keys())T.discs.get(k).semH+=len*w}}}
    // o que já aconteceu (até à data do ponto de situação): aulas anuladas, eventos e exames, compensações
    if(d.anul){const cardL=new Map();for(const o of porV)for(const c of o.v.cards||[])cardL.set(c.id,[o.lm.get(c.lessonId),c]);
      const tira=(l,i,c,tid0,prof,forca)=>{if(!l)return;for(const cl of l.classIds||[]){const tid=c2t(cl),T=R.turmas.get(tid);if(!T||(tid0&&tid0!==tid)||(T.fora[i]&&!forca))continue;const m=dda(l,cl,tid);
        (l.linhas||[]).forEach(ln=>{if(prof&&ln.t&&ln.t!==prof)return;if(ln.cls&&ln.cls.length&&!ln.cls.includes(cl))return;const k=discDe(tid,ln.s);if(k)T.discs.get(k).adj[i]-=c/(m.get(k)||1)})}};
      for(const key in st.cover||{}){const [x,prof]=key.split("|"),i=R.ix.get(x);if(i==null||x>asof)continue;const rec=st.cover[key]||{};for(const sk in rec){if(rec[sk]!=="x")continue;const lc=cardL.get(sk.split("|")[0]);if(lc)tira(lc[0],i,1,"",prof)}}
      for(const ev of(st.exames||[]).concat(st.eventos||[])){if(!ev||!ev.data||ev.data>asof)continue;const i=R.ix.get(ev.data);if(i==null||!R.letivo[i])continue;const o=vDe(ev.data);if(!o)continue;const wd=(calD(ev.data).getDay()+6)%7;
        for(const [l,len,c] of o.dia.get(wd)||[]){if(!(l.classIds||[]).some(x=>(ev.classIds||[]).includes(x)))continue;let n=0;for(let q=0;q<len;q++)if(c.period+q>=ev.period&&c.period+q<ev.period+(ev.len||1))n++;
          if(n)for(const cl of l.classIds)if((ev.classIds||[]).includes(cl))tira({classIds:[cl],linhas:l.linhas},i,n,"","")}}
      for(const x of st.pontuais||[]){if(!x.comp||!x.nd||x.nd>asof)continue;const lc=cardL.get(x.cardId),i=R.ix.has(x.nd)?R.ix.get(x.nd):R.ix.get(x.data);if(lc&&i!=null)tira(lc[0],i,-(+lc[1].len||1),"","",true)}}}
  // correções das horas dadas (sumários): na data indicada, o total dado passa a ser o escrito
  const iA=Math.min(N-1,Math.max(-1,R.D.filter(x=>x<=asof).length-1));R.iA=iA;
  for(const T of R.turmas.values())for(const o of T.discs.values()){
    const cum=new Float32Array(N);let s=0;for(let i=0;i<N;i++){s+=o.sch[i]+(i<=iA?o.adj[i]:0);cum[i]=s}
    const cs=cc.corr.filter(x=>x.anoId===a.id&&x.turmaId===T.t.id&&norm(x.disc)===o.k&&x.data&&R.ix.has(x.data)&&x.data<=asof).sort((p,q)=>p.data.localeCompare(q.data));
    for(const x of cs){const i=R.ix.get(x.data),dif=(+x.dados||0)*R.fator-cum[i];for(let j=i;j<N;j++)cum[j]+=dif}
    o.cum=cum;o.G=iA>=0?Math.max(0,cum[iA]):0;let prev=0,cap=0,tot=0;for(let i=0;i<N;i++){tot+=o.sch[i];if(i<=iA)prev+=o.sch[i];else cap+=o.sch[i]}
    o.prev=prev;o.cap=cap;o.totHor=tot;o.proj=o.G+cap;o.saldo=o.proj-o.P;
    // cronograma dos módulos: data em que o acumulado passa o início e chega ao fim de cada módulo
    // 0.9.67: até à data da situação o acumulado nunca passa do que foi corrigido depois (as correções dos sumários podem baixar as horas)
    const sm=new Float32Array(N);if(iA>=0){let mn=Infinity;for(let i=iA;i>=0;i--){mn=Math.min(mn,cum[i]);sm[i]=Math.max(0,mn)}}
    const C=i=>i<=iA?sm[i]:o.G+(cumF(i));let fut=0;const cf=new Float32Array(N);for(let i=0;i<N;i++){if(i>iA)fut+=o.sch[i];cf[i]=fut}const cumF=i=>cf[i];
    let ac=0;o.mods.forEach(m=>{const a0=ac,a1=ac+m.h;ac=a1;let i0=-1,i1=-1;for(let i=0;i<N;i++){const v=C(i),antes=i?C(i-1):0;if(i0<0&&v>a0+1e-6&&v>antes)i0=i;if(v>=a1-1e-6){i1=i;break}}
      m.ini=i0>=0?D[i0]:"";m.fim=i1>=0?D[i1]:"";const gA=o.G;m.estado=gA>=a1-1e-6?"feito":o.totHor<=0&&i1<0?"semaula":i1<0?"naocabe":gA>a0+1e-6?"curso":"espera";m.a0=a0;m.a1=a1});
    o.fimPrev=o.P>0&&o.mods.length?o.mods[o.mods.length-1].fim:"";
    // tempos por semana agora e o ritmo necessário até ao fim
    const semRest=new Set();for(let i=iA+1;i<N;i++)if(!T.fora[i])semRest.add(semIdx[i]);o.semRest=semRest.size;
    if(man)o.semH=o.manW[semIdx[Math.min(N-1,iA+1)]]||0;o.tlSem=o.semH;
    o.tlNec=o.semRest?Math.max(0,(o.P-o.G)/o.semRest):0;
    const folga=Math.max(2*R.fator,o.P*.05);o.est=o.P<=0?"":o.totHor<=0&&o.G<=0?"semhorario":o.G>=o.P-1e-6?"concluida":o.saldo>Math.max(4*R.fator,o.P*.1)?"excesso":o.saldo>=-1e-6?"emdia":-o.saldo<=folga?"atencao":"risco"}
  try{CR_EST.semhorario[0]=man?"Sem tempos":"Sem horário";CR_MOD.semaula[0]=man?"sem tempos no cronograma":"sem aulas no horário"}catch(e){}
  R.par=par;R.semIdx=semIdx;if(!stX&&!op)CR_CACHE={k:ck,m:R,est:CR_CACHE.est};return R}
const CR_EST={concluida:["Concluída","ok"],emdia:["Em dia","ok"],excesso:["Sobram tempos","pend"],atencao:["Atenção","warn"],risco:["Em risco","bad"],semhorario:["Sem horário","bad"]};
const CR_ORD={risco:0,semhorario:1,atencao:2,excesso:3,emdia:4,concluida:5,"":6};
const crTag=e=>{const x=CR_EST[e];return x?`<span class="tag ${x[1]}">${x[0]}</span>`:""};
const CR_MOD={feito:["concluído","#16a34a"],curso:["em curso","#2563eb"],espera:["por começar","#94a3b8"],naocabe:["não cabe no ano","#dc2626"],semaula:["sem aulas no horário","#dc2626"]};
const crPl=(n,s,p)=>n+" "+(Math.abs(n)===1?s:p);
const crOrdArea=(x,z)=>{const ia=k=>{const i=PC_AREAS.findIndex(a=>a[0]===k);return i<0?99:i};return ia(x.area)-ia(z.area)||COLL_PT.compare(x.disc,z.disc)};
const crModCurto=m=>String(m||"").replace(/^m[oó]dulo\s*/i,"Mód. ").replace(/^ufcd\s*/i,"").replace(/^unidade de compet[eê]ncia\s*/i,"UC ");
// o formador só vê as suas disciplinas
function crMeuId(){if(perfilAtual()!=="prof")return "";try{const me=dsdEu();return me?me.id:"-"}catch(e){return "-"}}
const crDoFormador=(o,me)=>!me||o.mods.some(m=>m.f===me);
function crTurmaRes(T,me){let P=0,G=0,prev=0;const L=[];for(const o of T.discs.values()){if(!crDoFormador(o,me)||o.P<=0)continue;L.push(o);P+=o.P;G+=Math.min(o.G,o.P);prev+=Math.min(o.prev,o.P)}
  const ests=L.map(o=>o.est),pior=ests.slice().sort((x,y)=>CR_ORD[x]-CR_ORD[y])[0]||"";return{P,G,prev,L,risco:ests.filter(e=>e==="risco"||e==="semhorario").length,atencao:ests.filter(e=>e==="atencao").length,pior}}
/* ---------- pontos de situação guardados ---------- */
function crFoto(a,asof,auto){const M=crMotor(a,asof),linhas=[];
  for(const T of M.turmas.values())for(const o of T.discs.values()){if(o.P<=0)continue;linhas.push([T.t.id,o.disc,+o.P.toFixed(2),+o.G.toFixed(2),+o.prev.toFixed(2),+o.cap.toFixed(2),o.fimPrev||"",o.est,o.mods.filter(m=>m.estado==="feito").length,o.mods.length,[...new Set(o.mods.map(m=>m.f).filter(Boolean))].join(",")])}
  const tot=linhas.reduce((s,l)=>({P:s.P+l[2],G:s.G+l[3],prev:s.prev+l[4]}),{P:0,G:0,prev:0});
  return{id:(auto?"auto-":"m-")+a.id+"-"+asof+(auto?"":"-"+uid()),anoId:a.id,data:asof,em:Date.now(),por:String(EU&&EU.email||""),auto:!!auto,nome:(auto?"Ponto de situação automático":"Ponto de situação")+" de "+calDMA(asof),fator:M.fator,linhas,tot,
    turmas:[...M.turmas.values()].map(T=>[T.t.id,T.t.cod,turmaNome(T.t)])}}
function crRegistar(asof,auto){const a=crAnoSel(),p=crFoto(a,asof||calHoje(),auto);if(auto&&CR.pontos.some(x=>x.id===p.id))return null;
  if(!p.linhas.length){if(!auto)toast("Ainda não há planos curriculares neste ano letivo");return null}
  CR.pontos.unshift(p);CR.pontos.sort((x,y)=>String(y.data).localeCompare(String(x.data))||(y.em||0)-(x.em||0));crGuardar();return p}
// pontos de situação automáticos (amiúde): ao entrar, a Direção regista o que estiver em falta (o mais recente)
var crAutoH=null;function crAutoAgendar(){clearTimeout(crAutoH);crAutoH=setTimeout(()=>{try{crAuto()}catch(e){console.warn(e)}},6000)}
function crAuto(){if(RO||!podePublicar())return;const d=crCfg().def;if(d.auto==="desligado")return;const a=anoAtivo(),hj=calHoje();if(!a.inicio||hj<a.inicio)return;
  if(!pcPlanos().some(p=>p.anoId===a.id))return;const ate=a.fim&&a.fim<hj?a.fim:hj;let alvo="";
  if(d.auto==="periodo"){for(const p of calPeriodos(a))if(p.fim<=ate)alvo=p.fim}
  else if(d.auto==="mensal"){for(let x=calMais(a.inicio,1),i=0;x<=ate&&i<400;x=calMais(x,1),i++)if(calMais(x,1).slice(5,7)!==x.slice(5,7))alvo=x}
  else{const passo=d.auto==="quinzenal"?14:7;let x=a.inicio;while(((calD(x).getDay()+6)%7)+1!==d.dia)x=calMais(x,1);for(let i=0;x<=ate&&i<60;x=calMais(x,passo),i++)alvo=x}
  if(!alvo)return;const id="auto-"+a.id+"-"+alvo;if(CR.pontos.some(p=>p.id===id)||CR.del[id])return;
  const ant=CR_SEL.ano;CR_SEL.ano=a.id;const p=crRegistar(alvo,true);CR_SEL.ano=ant;if(p&&curTab&&curTab.startsWith("cr"))crRender(curTab)}

/* ---------- páginas ---------- */
function crRender(t){t=t||curTab;if(!$("#"+t))return;if(!CR_SEL||!CR_CACHE||!CP)return; // 0.9.67: ao arrancar no Crono360, espera que o módulo esteja pronto (antes rebentava o arranque)
  crBarras();
  if(t==="crPs")crPs();else if(t==="crCron")crCron();else if(t==="crAno")crAno();else if(t==="crCump")crCump();else if(t==="crHist")crHist();else if(t==="crDef")crDef()}
// barra comum: ano letivo, data do ponto de situação e turma
function crBarras(){const E=escData(),a=crAnoSel(),T=turmasDoAno(a),me=crMeuId();if(CR_SEL.t&&!T.some(t=>t.id===CR_SEL.t))CR_SEL.t="";
  const optA=anosOrd().slice().reverse().map(x=>`<option value="${x.id}"${x.id===a.id?" selected":""}>${esc(x.nome)}${x.id===E.ativo?" (ativo)":""}</option>`).join("");
  let TT=T;if(me){const M=crMotor(a,CR_SEL.asof||calHoje());TT=T.filter(t=>{const R=M.turmas.get(t.id);return R&&[...R.discs.values()].some(o=>crDoFormador(o,me))})}
  const optT=`<option value="">Todas as turmas</option>`+TT.map(t=>`<option value="${t.id}"${t.id===CR_SEL.t?" selected":""}>${esc(calTurmaCurta(t))}</option>`).join("");
  document.querySelectorAll("[data-crano]").forEach(s=>{s.innerHTML=optA});const tc=[CR_SEL.tc,CR_SEL.t].find(id=>id&&TT.some(t=>t.id===id))||(TT[0]||{}).id;document.querySelectorAll("[data-crtur]").forEach(s=>{s.innerHTML=s.dataset.crtur==="obrig"?TT.map(t=>`<option value="${t.id}"${t.id===tc?" selected":""}>${esc(calTurmaCurta(t))}</option>`).join(""):optT});
  document.querySelectorAll("[data-crasof]").forEach(i=>{if(document.activeElement!==i)i.value=CR_SEL.asof||calHoje()});
  document.querySelectorAll("[data-crdir]").forEach(b=>{b.style.display=crPodeEditar()?"":"none"});crTextos()}
function crAvisoBase(a,M){const out=[];if(M.manual){if(crPodeEditar()&&!crMeuId()){let n=0;const tt=new Set();for(const T of M.turmas.values())for(const o of T.discs.values())if(o.P>0&&!o.manTem){n++;tt.add(T.t.cod)}
      if(n)out.push(`${n} disciplina${n===1?" ainda não tem":"s ainda não têm"} tempos por semana no cronograma (${esc([...tt].slice(0,8).join(", "))}${tt.size>8?"…":""}). Escreva-os em <a href="#" data-crir="crCron">Cronogramas › Tempos por semana</a>.`)}}
  else if(!M.st)out.push(`Ainda não há horário de ${esc(a.nome)} no <b>Horários360</b>: os cronogramas precisam das aulas de cada turma.`);
  if(!pcPlanos().some(p=>p.anoId===a.id))out.push(`Ainda não há <b>Planos Curriculares</b> em ${esc(a.nome)} (Escola360 › Turmas › Planos Curriculares).`);
  if(!calPeriodos(a).length)out.push(`O <b>Calendário Escolar</b> de ${esc(a.nome)} ainda não foi importado: a FCT das turmas e os períodos ficam por contar.`);
  return out.length?`<div class="msg info">${out.join("<br>")}</div>`:""}
// Ponto de situação
function crPs(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),me=crMeuId(),f=M.fator;
  const TT=[...M.turmas.values()].filter(T=>!CR_SEL.t||T.t.id===CR_SEL.t),res=TT.map(T=>({T,r:crTurmaRes(T,me)})).filter(x=>x.r.L.length);
  const P=res.reduce((s,x)=>s+x.r.P,0),G=res.reduce((s,x)=>s+x.r.G,0),prev=res.reduce((s,x)=>s+x.r.prev,0),L=res.flatMap(x=>x.r.L);
  const nTR=res.filter(x=>x.r.risco).length,nDR=L.filter(o=>o.est==="risco"||o.est==="semhorario").length,nDA=L.filter(o=>o.est==="atencao").length;
  $("#crPsAviso").innerHTML=crAvisoBase(a,M);
  $("#crPsTiles").innerHTML=[[P?Math.round(G/P*100)+"%":"—","Do plano já dado",""],[crNum(crH1(G,f))+" h","Dadas, de "+crNum(crH1(P,f))+" h",""],[prev?Math.round(G/prev*100)+"%":"—","Do previsto pelo "+(M.manual?"cronograma":"horário")+" até à data",""],
    [String(nDR),"Disciplinas em risco"+(nDA?" · "+nDA+" em atenção":""),nDR?"crtb":nDA?"crtw":""],[nTR+" de "+res.length,"Turmas com disciplinas em risco",nTR?"crtb":""]]
    .map(([v,l,c])=>`<div class="tile ${c}"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
  // por turma
  let h=`<table class="rt crt crlab"><thead><tr><th>Turma</th><th class="crn">Plano</th><th class="crn">Dadas</th><th class="crn">%</th><th class="crn" title="O que o ${M.manual?"cronograma":"horário"} previa dar até à data">Previsto</th><th class="crn" title="Horas que sobram (+) ou faltam (−) no fim do ano com o ${M.manual?"cronograma":"horário atual"}">Saldo no fim</th><th>Estado</th><th></th></tr></thead><tbody>`;
  for(const {T,r} of res.sort((x,y)=>CR_ORD[x.r.pior]-CR_ORD[y.r.pior]||COLL_PTN.compare(String(x.T.t.cod),String(y.T.t.cod)))){
    const sal=r.L.reduce((s,o)=>s+Math.min(0,o.saldo),0),aberto=CR_SEL.ver===T.t.id;
    h+=`<tr class="crrow${aberto?" on":""}" data-crv="${T.t.id}"><td><b>${esc(T.t.cod)}</b> <span class="hint" style="margin:0">${esc(calTurmaCurta(T.t).replace(/^[^·]*·\s*/,""))}</span></td><td class="crn">${crNum(crH1(r.P,f))} h</td><td class="crn">${crNum(crH1(r.G,f))} h</td><td class="crn"><b>${r.P?Math.round(r.G/r.P*100):0}%</b><div class="crbar"><i style="width:${r.P?Math.min(100,r.G/r.P*100):0}%"></i></div></td><td class="crn">${crNum(crH1(r.prev,f))} h</td><td class="crn${sal<0?" crneg":""}">${sal<0?crNum(crH1(sal,f))+" h":"✓"}</td><td>${crTag(r.pior)}${r.risco?` <span class="hint" style="margin:0">${r.risco} em risco</span>`:""}${r.atencao?` <span class="hint" style="margin:0">${r.atencao} em atenção</span>`:""}</td><td style="white-space:nowrap"><button class="b s" data-crv="${T.t.id}">${aberto?"Fechar":"Ver"}</button>${!me&&crPodeEditar()&&(r.risco||r.atencao)?` <button class="b s" data-crcump="${T.t.id}" title="O que é preciso para acabar ${M.manual?"e os tempos por semana novos":"e o horário novo"}">${M.manual?"Ajustar":"Cumprir o plano"}</button>`:""}</td></tr>`;
    if(aberto)h+=`<tr class="crdet"><td colspan="8">${crDetalhe(T,r,M)}</td></tr>`}
  h+=`</tbody></table>`;if(!res.length)h=`<p class="hint">${me?"Não encontrei disciplinas suas nos planos curriculares deste ano letivo.":"Sem planos curriculares para mostrar."}</p>`;
  $("#crPsOut").innerHTML=h;crRotulos($("#crPsOut"));
  // alertas
  const al=L.filter(o=>o.est==="risco"||o.est==="semhorario"||o.est==="atencao").sort((x,y)=>CR_ORD[x.est]-CR_ORD[y.est]||x.saldo-y.saldo).slice(0,14);
  const tOf=o=>{for(const T of M.turmas.values())for(const x of T.discs.values())if(x===o)return T.t;return null};
  $("#crPsAl").innerHTML=(al.length?al.map(o=>{const t=tOf(o);return `<div class="cral"><div>${crTag(o.est)} <b>${esc(t?t.cod:"")}</b> · ${esc(o.disc)}</div><div class="hint" style="margin:2px 0 0">${o.est==="semhorario"?`${crNum(crH1(o.P,f))} h no plano e ${M.manual?"nenhum tempo no cronograma":"nenhuma aula no horário"}.`:`Faltam ${crNum(crH1(-o.saldo,f))} h no fim do ano. ${o.semRest?`Precisa de ${crNum(o.tlNec/ (f||1))} h/semana (tem ${crNum(crH1(o.tlSem,f))}).`:""}`}</div></div>`}).join(""):`<div class="wg-okm">✓ Nenhuma disciplina em risco${me?" nas suas turmas":""}.</div>`)
    +(M.semPar.size&&!me&&!M.manual?`<div class="msg info" style="margin-top:10px">${M.semPar.size} disciplina(s) do horário sem par no plano: ${esc([...M.semPar.values()].slice(0,6).map(x=>x.nome).join(", "))}. <a href="#" data-crir="crDef">Ligar nas Definições</a></div>`:"");
  const ult=CR.pontos.filter(p=>p.anoId===a.id)[0];crDadRender(M);$("#crPsUlt").innerHTML=ult?`Último ponto de situação registado: <b>${esc(ult.nome)}</b>${ult.auto?" (automático)":""} — <a href="#" data-crir="crHist">ver o histórico</a>.`:`Ainda não há pontos de situação registados em ${esc(a.nome)}.`}
function crDetalhe(T,r,M){const f=M.fator,me=crMeuId();
  const pd=crPodeEditar()&&!me,ult=new Map();for(const x of crCfg().corr)if(x&&x.anoId===M.a.id&&x.turmaId===T.t.id&&x.data&&x.data<=M.asof){const q=ult.get(x.disc);if(!q||x.data>q.data||(x.data===q.data&&(x.em||0)>(q.em||0)))ult.set(x.disc,x)}return `<table class="rt crdt crlab"><thead><tr><th>Disciplina</th><th>Formador</th><th class="crn">Plano</th><th class="crn">Dadas</th><th class="crn">Por dar</th><th class="crn" title="Horas que o ${M.manual?"cronograma":"horário"} ainda dá até ao fim das aulas da turma">${M.manual?"No cronograma":"No horário"} até ao fim</th><th class="crn">Saldo</th><th class="crn" title="Tempos por semana: os que o ${M.manual?"cronograma":"horário"} tem agora → os que seriam precisos para acabar a tempo">Por semana</th><th>Módulos</th><th>Fim previsto</th><th>Estado</th></tr></thead><tbody>`+
    r.L.slice().sort(crOrdArea).map(o=>{const fs=[...o.f.entries()].sort((x,y)=>y[1]-x[1]).map(([id])=>(cfg.profs.find(p=>p.id===id)||{}).nome).filter(Boolean),fe=o.mods.filter(m=>m.estado==="feito").length,cur=o.mods.find(m=>m.estado==="curso");
      return `<tr><td><b>${esc(o.disc)}</b><div class="hint" style="margin:0">${esc(PC_AREA_NOME[o.area]||"")}${cur?" · agora: "+esc(cur.mod):""}</div></td><td>${esc(fs.slice(0,2).join(", ")||"—")}</td><td class="crn">${crNum(crH1(o.P,f))}</td><td class="crn">${crNum(crH1(o.G,f))}${pd?`<button class="crdd" type="button" data-crdd="${T.t.id}|${esc(o.k)}" title="Corrigir as horas dadas até ${esc(calDM(M.asof))} (por exemplo, pelos sumários do pleon)">${ico("pencil")}</button>`:""}${M.manual?(ult.get(o.k)?`<div class="hint" style="margin:0" title="Último registo das horas dadas">registo ${esc(calDM(ult.get(o.k).data))}</div>`:`<div class="hint" style="margin:0" title="Sem registo das horas dadas: conta o previsto no cronograma">sem registo</div>`):""}</td><td class="crn">${crNum(crH1(Math.max(0,o.P-o.G),f))}</td><td class="crn">${crNum(crH1(o.cap,f))}</td><td class="crn${o.saldo<0?" crneg":""}">${o.saldo>=0?"+":""}${crNum(crH1(o.saldo,f))}</td><td class="crn">${o.est==="concluida"?"—":`${crNum(o.tlSem)} → <b${o.tlNec>o.tlSem+1e-6?' class="crneg"':""}>${crNum(Math.ceil(o.tlNec*10-1e-6)/10)}</b>`}</td><td>${fe}/${o.mods.length}</td><td>${o.fimPrev?calDM(o.fimPrev):o.est==="concluida"?"—":`<span class="crneg">não acaba</span>`}</td><td>${crTag(o.est)}</td></tr>`}).join("")+`</tbody></table>`}
// Cronogramas (diagrama de Gantt dos módulos de cada disciplina, ao longo do ano)
function crCron(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),me=crMeuId(),f=M.fator,sel=$("#crCronT").value||"";
  const T=M.turmas.get(sel)||[...M.turmas.values()].find(T=>[...T.discs.values()].some(o=>crDoFormador(o,me)));$("#crCronAviso").innerHTML=crAvisoBase(a,M);
  if(!T||!M.D.length){$("#crCronOut").innerHTML=`<p class="hint">Escolha uma turma com plano curricular.</p>`;$("#crCronTab").innerHTML="";crManRender(null,M);return}
  CR_SEL.tc=T.t.id;const D=M.D,N=D.length,x=i=>i/N*100,ix=s=>M.ix.has(s)?M.ix.get(s):s<D[0]?0:N-1;
  const ints=(a.ferias||[]).filter(q=>q&&q.de&&!calEhFeriado(q,calFeriados(a))),iA=M.iA;
  const meses=[],grelha=[];for(let d=new Date(calD(D[0]).getFullYear(),calD(D[0]).getMonth(),1,12);calS(d)<=D[N-1];d.setMonth(d.getMonth()+1)){const s=calS(d)<D[0]?D[0]:calS(d),n=d.toLocaleDateString("pt-PT",{month:"short"}).replace(".","");meses.push(`<span style="left:${x(ix(s))}%">${n.charAt(0).toUpperCase()+n.slice(1)}</span>`);if(s>D[0])grelha.push(`<i class="crgl" style="left:${x(ix(s))}%"></i>`)}
  const fundo=grelha.join("")+ints.map(q=>`<i class="cal-ls" style="left:${x(ix(q.de))}%;width:${Math.max(.3,(ix(q.ate||q.de)-ix(q.de)+1)/N*100)}%" title="${esc(q.nome||"Interrupção")}"></i>`).join("")
    +T.fct.map(m=>`<i class="crfct" style="left:${x(ix(m.de))}%;width:${Math.max(.3,(ix(m.ate)-ix(m.de)+1)/N*100)}%" title="FCT · ${esc(calDatasTxt(m))}"></i>`).join("")+(iA>=0&&iA<N-1?`<i class="cal-lh" style="left:${x(iA+1)}%" title="Situação a ${esc(calDMA(asof))}"></i>`:"");
  const L=[...T.discs.values()].filter(o=>o.P>0&&crDoFormador(o,me)).sort(crOrdArea);
  const hoje=iA>=0&&iA<N-1?`<em class="crhoje" style="left:${x(iA+1)}%">${esc(calDM(asof))}</em>`:"";
  // turma sem aulas no horário: dizer porquê o diagrama está vazio e para onde ir
  const semAula=L.filter(o=>o.totHor<=0&&o.G<o.P-1e-6);
  if(M.manual){if(L.length&&semAula.length===L.length)$("#crCronAviso").innerHTML+=`<div class="msg warn" style="margin:8px 0">A <b>${esc(T.t.cod)}</b> ainda não tem tempos por semana no cronograma, por isso não há previsão. ${crPodeEditar()&&!me?"Escreva-os na grelha <b>Tempos por semana</b>, mais abaixo.":""}</div>`;
    else if(semAula.length)$("#crCronAviso").innerHTML+=`<div class="msg info" style="margin:8px 0">${semAula.length} disciplina${semAula.length===1?" ainda não tem":"s ainda não têm"} tempos por semana: ${esc(semAula.map(o=>o.disc).join(", "))}.</div>`}
  else if(L.length&&semAula.length===L.length)$("#crCronAviso").innerHTML+=`<div class="msg warn" style="margin:8px 0">A <b>${esc(T.t.cod)}</b> não tem aulas no horário do Horários360, por isso não há previsão para nenhuma disciplina. <a href="#" data-cres>Abrir o Horários360</a> ou <a href="#" data-crir="crCump" data-crcp="${esc(T.t.id)}">criar o horário em Cumprir o plano</a>.</div>`;
  else if(semAula.length)$("#crCronAviso").innerHTML+=`<div class="msg info" style="margin:8px 0">${semAula.length} disciplina${semAula.length===1?" não tem":"s não têm"} aulas no horário: ${esc(semAula.map(o=>o.disc).join(", "))}.</div>`;
  const tot=L.reduce((t,o)=>(t.P+=o.P,t.G+=Math.min(o.G,o.P),t),{P:0,G:0}),fins=L.map(o=>o.fimPrev).filter(Boolean).sort(),nc=L.filter(o=>o.mods.some(m=>m.estado==="naocabe"||m.estado==="semaula")).length;
  let h=`<div class="crres"><span><b>${crNum(crH1(tot.G,f))}</b> de ${crNum(crH1(tot.P,f))} h dadas (${tot.P?Math.round(tot.G/tot.P*100):0}%)</span><span><b>${L.filter(o=>o.G>=o.P-1e-6).length}</b>/${L.length} disciplinas concluídas</span>${fins.length===L.length&&fins.length?`<span>Última acaba a <b>${esc(calDM(fins[fins.length-1],{day:"numeric",month:"short"}))}</b></span>`:""}${nc?`<span class="bad"><b>${nc}</b> não acaba${nc===1?"":"m"} no ano</span>`:""}</div>`
    +`<div class="crg"><div class="crgr crgm"><b></b><div class="crgt">${meses.join("")}${hoje}</div></div>`;let area="";
  for(const o of L){if(o.area!==area){area=o.area;h+=`<div class="crga">${esc(PC_AREAS.find(z=>z[0]===area)?.[1]||"Outras")}</div>`}
    const seg=o.mods.map((m,j)=>{if(!m.ini)return "";const i0=ix(m.ini),i1=m.fim?ix(m.fim):N-1,c=CR_MOD[m.estado][1];
      return `<i class="crgm${m.estado==="naocabe"?" nc":""}" style="left:${x(i0)}%;width:${Math.max(.4,(i1-i0+1)/N*100)}%;--c:${c}" title="${esc(m.mod+" · "+crNum(crH1(m.h,f))+" h · "+(m.ini?calDM(m.ini):"")+(m.fim?" a "+calDM(m.fim):" — não acaba no ano")+" · "+CR_MOD[m.estado][0])}"><span>${esc(crModCurto(m.mod))}</span></i>`}).join("");
    const vazio=!o.mods.some(m=>m.ini)&&o.G<o.P-1e-6?`<span class="crsem" style="left:${x(Math.max(0,iA+1))}%">${M.manual?"sem tempos no cronograma":"sem aulas no horário"} — sem previsão</span>`:"";
    const fim=o.G>=o.P-1e-6?"concluída":o.fimPrev?"acaba "+calDM(o.fimPrev):o.totHor<=0?"":"não acaba no ano";
    h+=`<div class="crgr"><b title="${esc(o.disc+" · "+crNum(crH1(o.G,f))+" de "+crNum(crH1(o.P,f))+" h"+(o.tlSem?" · "+crNum(crH1(o.tlSem,f))+" h/semana":""))}"><span class="crnm">${esc(o.disc)}</span><small>${crNum(crH1(o.G,f))}/${crNum(crH1(o.P,f))} h${fim?` · <span class="${fim==="não acaba no ano"?"crneg":""}">${esc(fim)}</span>`:""}</small></b><div class="crgt">${fundo}${seg}${vazio}</div></div>`}
  h+=`</div><div class="cal-leg">${Object.entries(CR_MOD).filter(([k])=>k!=="semaula").map(([k,v])=>`<span><b style="background:${v[1]}"></b>${esc(v[0])}</span>`).join("")}<span><b class="crfctl"></b>FCT</span><span><b class="int"></b>Interrupção</span><span><i style="background:var(--brand);width:3px;height:12px;border-radius:1px"></i>Data da situação</span></div>`;
  $("#crCronOut").innerHTML=L.length?h:`<p class="hint">Sem disciplinas para mostrar.</p>`;try{crManRender(T,M)}catch(e){console.warn("Crono360/tempos por semana",e)}
  $("#crCronTab").innerHTML=`<table class="rt crct"><thead><tr><th>Disciplina</th><th>Módulo / UFCD / UC</th><th class="crn">Horas</th><th>Início</th><th>Fim</th><th>Estado</th></tr></thead><tbody>`+L.map(o=>o.mods.map((m,j)=>`<tr>${j===0?`<td rowspan="${o.mods.length}"><b>${esc(o.disc)}</b><div class="hint" style="margin:0">${crNum(crH1(o.tlSem,f))} h/semana agora</div></td>`:""}<td>${esc(m.mod)}</td><td class="crn">${crNum(crH1(m.h,f))}</td><td>${m.ini?calDM(m.ini,{weekday:"short",day:"numeric",month:"short"}):"—"}</td><td>${m.fim?calDM(m.fim,{weekday:"short",day:"numeric",month:"short"}):"—"}</td><td><span class="crmt" style="--c:${CR_MOD[m.estado][1]}">${CR_MOD[m.estado][0]}</span></td></tr>`).join("")).join("")+`</tbody></table>`}
// Cumprir o plano (0.9.67): ver «Crono360 › Cumprir o plano», mais abaixo
function crCump(){const man=crManual(),sec=$("#crCump");if(sec)sec.classList.toggle("crman",man);if(man)crAjRender();else cpRender()}
// Histórico dos pontos de situação
function crHist(){const a=crAnoSel(),L=CR.pontos.filter(p=>p.anoId===a.id),ed=crPodeEditar(),me=crMeuId();
  const sel=L.find(p=>p.id===CR_SEL.ver)||L[0],cmp=L.find(p=>p.id===CR_SEL.cmp)||null;
  const tot=p=>{const ls=me?p.linhas.filter(l=>(l[10]||"").split(",").includes(me)):p.linhas;const P=ls.reduce((s,l)=>s+l[2],0),G=ls.reduce((s,l)=>s+l[3],0);return{P,G,pc:P?Math.round(G/P*100):0,risco:ls.filter(l=>l[7]==="risco"||l[7]==="semhorario").length,ls}};
  $("#crHistLista").innerHTML=L.length?`<table class="rt"><thead><tr><th>Ponto de situação</th><th>Data</th><th class="crn">Do plano dado</th><th class="crn">Em risco</th><th>Registado por</th>${ed?"<th></th>":""}</tr></thead><tbody>${L.map(p=>{const t=tot(p);return `<tr class="crrow${sel&&p.id===sel.id?" on":""}" data-crh="${esc(p.id)}"><td><b>${esc(p.nome)}</b>${p.auto?` <span class="tag pend">automático</span>`:""}</td><td>${calDM(p.data,{weekday:"short",day:"numeric",month:"short",year:"numeric"})}</td><td class="crn">${t.pc}%</td><td class="crn">${t.risco||"—"}</td><td>${esc(p.por||"")}</td>${ed?`<td><button class="x" data-crhdel="${esc(p.id)}" title="Apagar este ponto de situação">×</button></td>`:""}</tr>`}).join("")}</tbody></table>`:`<p class="hint">Ainda sem pontos de situação neste ano letivo. ${ed?"Registe um em <b>Ponto de situação</b>, ou espere pelo automático.":""}</p>`;
  if(!sel){$("#crHistOut").innerHTML="";return}
  $("#crHistCmp").innerHTML=`<option value="">Comparar com…</option>`+L.filter(p=>p.id!==sel.id).map(p=>`<option value="${esc(p.id)}"${cmp&&p.id===cmp.id?" selected":""}>${esc(p.nome)}</option>`).join("");
  const f=sel.fator||1,nmT=new Map((sel.turmas||[]).map(x=>[x[0],x[1]])),ant=new Map(cmp?tot(cmp).ls.map(l=>[l[0]+"|"+l[1],l]):[]);
  const ls=tot(sel).ls.slice().sort((p,q)=>COLL_PTN.compare(String(nmT.get(p[0])||""),String(nmT.get(q[0])||""))||CR_ORD[p[7]]-CR_ORD[q[7]]);
  $("#crHistOut").innerHTML=`<h3 style="margin-top:0">${esc(sel.nome)}</h3><table class="rt crdt"><thead><tr><th>Turma</th><th>Disciplina</th><th class="crn">Plano</th><th class="crn">Dadas</th>${cmp?`<th class="crn">Desde ${esc(calDM(cmp.data))}</th>`:""}<th class="crn">Previsto</th><th class="crn">Saldo no fim</th><th>Módulos</th><th>Fim previsto</th><th>Estado</th></tr></thead><tbody>`+
    ls.map(l=>{const o=ant.get(l[0]+"|"+l[1]),sal=l[3]+l[5]-l[2];return `<tr><td><b>${esc(nmT.get(l[0])||"")}</b></td><td>${esc(l[1])}</td><td class="crn">${crNum(crH1(l[2],f))}</td><td class="crn">${crNum(crH1(l[3],f))}</td>${cmp?`<td class="crn">${o?(l[3]-o[3]>=0?"+":"")+crNum(crH1(l[3]-o[3],f)):"—"}${o&&o[7]!==l[7]?` <span class="hint" style="margin:0">(${esc((CR_EST[o[7]]||[""])[0])} → ${esc((CR_EST[l[7]]||[""])[0])})</span>`:""}</td>`:""}<td class="crn">${crNum(crH1(l[4],f))}</td><td class="crn${sal<0?" crneg":""}">${sal>=0?"+":""}${crNum(crH1(sal,f))}</td><td>${l[8]}/${l[9]}</td><td>${l[6]?calDM(l[6]):"—"}</td><td>${crTag(l[7])}</td></tr>`}).join("")+`</tbody></table>`}
// Definições: contagem, FCT, anuladas, automáticos, fim das aulas por turma, correspondência de disciplinas, horas dadas
function crDef(){const a=crAnoSel(),cc=crCfg(),d=cc.def,ed=crPodeEditar(),M=crMotor(a,CR_SEL.asof||calHoje()),T=turmasDoAno(a);
  $("#crDefFonte").value=d.fonte;$("#crDefAnulL").style.display=d.fonte==="horario"?"":"none";$("#crDefMapaC").style.display=d.fonte==="horario"?"":"none";
  $("#crDefHora").value=d.hora;$("#crDefFct").checked=d.fct;$("#crDefAnul").checked=d.anul;$("#crDefAuto").value=d.auto;$("#crDefDia").value=String(d.dia);$("#crDefDiaL").style.display=d.auto==="semanal"||d.auto==="quinzenal"?"":"none";
  document.querySelectorAll("#crDef input,#crDef select,#crDef button,#crDef textarea").forEach(x=>{if(!x.closest(".crro"))x.disabled=!ed});
  const ft=d.fimT[a.id]||{};
  $("#crDefFim").innerHTML=T.length?`<table class="rt"><thead><tr><th>Turma</th><th>Fim das aulas</th><th class="hm">FCT (calendário)</th></tr></thead><tbody>${T.map(t=>{const fct=calFctDe(a,t);return `<tr><td><b>${esc(t.cod)}</b> <span class="hint" style="margin:0">${esc(calTurmaCurta(t).replace(/^[^·]*·\s*/,""))}</span></td><td><input type="date" data-crfim="${t.id}" value="${esc(ft[t.id]||"")}" placeholder="${esc(a.fim||"")}" ${ed?"":"disabled"}> <span class="hint" style="margin:0">${ft[t.id]?"":"(fim do ano letivo: "+calDM(a.fim)+")"}</span></td><td class="hm">${fct.length?fct.map(m=>calDatasTxt(m)).join("; "):`<span class="hint" style="margin:0">—</span>`}</td></tr>`}).join("")}</tbody></table>`:`<p class="hint">Sem turmas neste ano letivo.</p>`;
  // correspondência de disciplinas do horário sem par no plano
  const opDisc=new Map();for(const R of M.turmas.values())for(const [k,o] of R.discs)opDisc.set(k,o.disc);
  $("#crDefMapa").innerHTML=M.semPar.size?`<table class="rt"><thead><tr><th>Disciplina do Horários360</th><th>Turmas</th><th>É a disciplina do plano…</th></tr></thead><tbody>${[...M.semPar.entries()].map(([k,g])=>`<tr><td><b>${esc(g.nome)}</b>${g.short?` <span class="hint" style="margin:0">(${esc(g.short)})</span>`:""}</td><td>${esc([...g.turmas].map(id=>(escData().turmas.find(t=>t.id===id)||{}).cod).filter(Boolean).join(", "))}</td><td><select data-crmapa="${esc(k)}" ${ed?"":"disabled"}><option value="">— não contar —</option>${[...opDisc.entries()].sort((x,y)=>COLL_PT.compare(x[1],y[1])).map(([dk,dn])=>`<option value="${esc(dk)}"${d.mapa[k]===dk?" selected":""}>${esc(dn)}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table>`
    :`<p class="hint">${M.st?"Todas as disciplinas do horário têm par nos planos curriculares.":"Falta o horário do Horários360."}</p>`;
  const mp=Object.entries(d.mapa).filter(([k,v])=>v);$("#crDefMapaFeitos").innerHTML=mp.length?`<p class="hint" style="margin:8px 0 0">Ligadas à mão: ${mp.map(([k,v])=>`${esc(k)} → ${esc(opDisc.get(v)||v)} <a href="#" data-crmapax="${esc(k)}" ${ed?"":"hidden"}>desfazer</a>`).join(" · ")}</p>`:"";
  // correções das horas dadas
  const C=cc.corr.filter(x=>x.anoId===a.id).sort((p,q)=>String(q.data).localeCompare(String(p.data)));
  $("#crDefCorr").innerHTML=(C.length?`<table class="rt"><thead><tr><th>Turma</th><th>Disciplina</th><th>Data</th><th class="crn">Horas dadas até essa data</th><th>Nota</th>${ed?"<th></th>":""}</tr></thead><tbody>${C.map(x=>`<tr><td><b>${esc((escData().turmas.find(t=>t.id===x.turmaId)||{}).cod||"?")}</b></td><td>${esc(x.discNome||x.disc)}</td><td>${calDM(x.data,{day:"numeric",month:"short",year:"numeric"})}</td><td class="crn">${crNum(x.dados)}</td><td>${esc(x.nota||"")}</td>${ed?`<td><button class="x" data-crcorrdel="${esc(x.id)}" title="Apagar">×</button></td>`:""}</tr>`).join("")}</tbody></table>`:`<p class="hint">${d.fonte==="horario"?"Sem correções: as horas dadas vêm do horário (menos as aulas anuladas, os eventos e os exames do Horários360).":"Sem registos: as horas dadas são as previstas no cronograma."}</p>`);
  $("#crCorrT").innerHTML=T.map(t=>`<option value="${t.id}">${esc(t.cod)}</option>`).join("");crCorrDiscs()}
function crCorrDiscs(){const a=crAnoSel(),M=crMotor(a,CR_SEL.asof||calHoje()),R=M.turmas.get($("#crCorrT").value);$("#crCorrD").innerHTML=R?[...R.discs.values()].filter(o=>o.P>0).map(o=>`<option value="${esc(o.k)}">${esc(o.disc)}</option>`).join(""):""}
/* ---------- PDF do ponto de situação (uma turma ou todas) e envio aos orientadores educativos ---------- */
async function crPdf(tid,doc0){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),f=M.fator,J=doc0?null:await loadPDF(),doc=doc0||new J({unit:"mm",format:"a4"});
  const TT=[...M.turmas.values()].filter(T=>tid?T.t.id===tid:(!CR_SEL.t||T.t.id===CR_SEL.t)).sort((p,q)=>COLL_PTN.compare(String(p.t.cod),String(q.t.cod)));let prim=true;
  for(const T of TT){const r=crTurmaRes(T,"");if(!r.L.length)continue;if(!prim)doc.addPage();prim=false;pdfProjDesde(doc,T.t.fse);
    let y=pdfTitulo(doc,"Ponto de situação — "+T.t.cod,`${turmaNome(T.t)} · Ano letivo ${a.nome} · situação a ${calDMA(asof)}`);
    y=pdfTabela(doc,y,["Disciplina","Plano","Dadas","Por dar","Até ao fim","Saldo","Módulos","Fim previsto","Estado"],
      r.L.slice().sort(crOrdArea).map(o=>[o.disc,crNum(crH1(o.P,f)),crNum(crH1(o.G,f)),crNum(crH1(Math.max(0,o.P-o.G),f)),crNum(crH1(o.cap,f)),(o.saldo>=0?"+":"")+crNum(crH1(o.saldo,f)),o.mods.filter(m=>m.estado==="feito").length+"/"+o.mods.length,o.fimPrev?calDM(o.fimPrev):"-",(CR_EST[o.est]||[""])[0]].map(pdfTxt)),
      {1:{halign:"right",cellWidth:14},2:{halign:"right",cellWidth:14},3:{halign:"right",cellWidth:15},4:{halign:"right",cellWidth:17},5:{halign:"right",cellWidth:15},6:{halign:"center",cellWidth:17},7:{cellWidth:20},8:{cellWidth:22}})+6;
    const prob=r.L.filter(o=>o.est==="risco"||o.est==="atencao"||o.est==="semhorario");
    if(prob.length){if(y>297-PDF_BOT-30){doc.addPage();y=PDF_TOP+6}doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(25);doc.text("A acompanhar",14,y);y+=5;doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(60);
      for(const o of prob){const t=pdfTxt(`${o.disc}: ${o.est==="semhorario"?(M.manual?"sem tempos no cronograma":"sem aulas no horário"):"faltam "+crNum(crH1(-o.saldo,f))+" h no fim do ano"+(o.semRest?" (precisa de "+crNum(o.tlNec/(f||1))+" h/semana; tem "+crNum(crH1(o.tlSem,f))+")":"")}.`);const ls=doc.splitTextToSize(t,180);if(y+ls.length*4.4>297-PDF_BOT){doc.addPage();y=PDF_TOP+6}doc.text(ls,16,y);y+=ls.length*4.4+1.5}}
    // cronograma dos módulos
    y=crPdfGantt(doc,y+4,T,M,r.L.slice().sort(crOrdArea));
    if(y>297-PDF_BOT-40){doc.addPage();y=PDF_TOP+6}else y+=2;doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(25);doc.text("Módulos",14,y);
    y=pdfTabela(doc,y+3,["Disciplina","Módulo / UFCD / UC","Horas","Início","Fim","Estado"],r.L.slice().sort(crOrdArea).flatMap(o=>o.mods.map(m=>[o.disc,m.mod,crNum(crH1(m.h,f)),m.ini?calDM(m.ini):"-",m.fim?calDM(m.fim):"-",CR_MOD[m.estado][0]].map(pdfTxt))),{2:{halign:"right",cellWidth:14},3:{cellWidth:18},4:{cellWidth:18},5:{cellWidth:26}})+4}
  if(prim){toast("Sem planos curriculares para o PDF");return null}
  if(!doc0){pdfMoldura(doc,"Escola Profissional da Ilha de São Jorge · EPISJ 360 · Crono360 · ponto de situação a "+calDMA(asof));doc.save(pdfTxt(`Ponto de situacao ${asof}${tid||CR_SEL.t?" - "+(escData().turmas.find(t=>t.id===(tid||CR_SEL.t))||{}).cod:""}.pdf`))}
  return doc}
function crPdfGantt(doc,y,T,M,L){const D=M.D,N=D.length;if(!N||!L.length)return y;const a=M.a,x0=62,x1=196,W=x1-x0,X=i=>x0+i/N*W,ix=s=>M.ix.has(s)?M.ix.get(s):s<D[0]?0:N-1,alt=8,hT=L.length*alt;
  if(y+hT+18>297-PDF_BOT){doc.addPage();y=PDF_TOP+6}
  doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.setTextColor(25);doc.text("Cronograma",14,y);y+=4.5;const yT=y+3.5;
  const FER=calFeriados(a);for(const q of(a.ferias||[]).filter(q=>q&&q.de&&!calEhFeriado(q,FER))){doc.setFillColor(254,243,199);doc.rect(X(ix(q.de)),yT,Math.max(.4,(ix(q.ate||q.de)-ix(q.de)+1)/N*W),hT,"F")}
  for(const m of T.fct){doc.setFillColor(220,252,231);doc.rect(X(ix(m.de)),yT,Math.max(.4,(ix(m.ate)-ix(m.de)+1)/N*W),hT,"F")}
  doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(110);doc.setDrawColor(222);doc.setLineWidth(.2);
  for(let d=new Date(calD(D[0]).getFullYear(),calD(D[0]).getMonth(),1,12);calS(d)<=D[N-1];d.setMonth(d.getMonth()+1)){const s=calS(d)<D[0]?D[0]:calS(d),xx=X(ix(s)),n=d.toLocaleDateString("pt-PT",{month:"short"}).replace(".","");doc.line(xx,y,xx,yT+hT);doc.text(pdfTxt(n.charAt(0).toUpperCase()+n.slice(1)),xx+.8,y+2.5)}
  const COR={feito:[22,163,74],curso:[37,99,235],espera:[148,163,184],naocabe:[220,38,38],semaula:[220,38,38]},cl=c=>c.map(v=>Math.round(v+(255-v)*.75)),es=c=>c.map(v=>Math.round(v*.62));
  L.forEach((o,r)=>{const yy=yT+r*alt;doc.setFontSize(7.6);doc.setTextColor(40);doc.text(doc.splitTextToSize(pdfTxt(o.disc),46)[0],14,yy+3.5);doc.setFontSize(6.3);doc.setTextColor(125);doc.text(pdfTxt(crNum(crH1(o.G,M.fator))+" de "+crNum(crH1(o.P,M.fator))+" h"),14,yy+6.7);
    for(const m of o.mods){if(!m.ini)continue;const i0=ix(m.ini),i1=m.fim?ix(m.fim):N-1,c=COR[m.estado]||COR.espera,xx=X(i0),w=Math.max(.6,(i1-i0+1)/N*W);
      doc.setFillColor(...cl(c));doc.setDrawColor(...c);doc.setLineWidth(.25);doc.rect(xx,yy+1.6,w,alt-3.2,"FD");
      if(w>7){doc.setFontSize(6);doc.setTextColor(...es(c));doc.text(doc.splitTextToSize(pdfTxt(crModCurto(m.mod)),w-1.4)[0]||"",xx+.7,yy+alt/2+.9)}}
    doc.setDrawColor(236);doc.setLineWidth(.15);doc.line(14,yy+alt,x1,yy+alt)});
  if(M.iA>=0&&M.iA<N-1){const xx=X(M.iA+1);doc.setDrawColor(22,50,105);doc.setLineWidth(.5);doc.line(xx,yT-1,xx,yT+hT+1)}
  y=yT+hT+5;doc.setFontSize(7);doc.setTextColor(100);let lx=14;
  for(const [k,t] of [["feito","concluído"],["curso","em curso"],["espera","por começar"],["naocabe","não cabe no ano"]]){const c=COR[k];doc.setFillColor(...cl(c));doc.setDrawColor(...c);doc.setLineWidth(.25);doc.rect(lx,y-2.4,3,3,"FD");doc.text(pdfTxt(t),lx+4.2,y);lx+=doc.getTextWidth(pdfTxt(t))+9}
  doc.setFillColor(220,252,231);doc.rect(lx,y-2.4,3,3,"F");doc.text("FCT",lx+4.2,y);lx+=doc.getTextWidth("FCT")+9;doc.setFillColor(254,243,199);doc.rect(lx,y-2.4,3,3,"F");doc.text(pdfTxt("Interrupção"),lx+4.2,y);lx+=doc.getTextWidth(pdfTxt("Interrupção"))+9;
  doc.setDrawColor(22,50,105);doc.setLineWidth(.5);doc.line(lx+1.5,y-2.6,lx+1.5,y+.6);doc.text(pdfTxt("data da situação"),lx+3.4,y);
  return y+5}
async function crEnviarDT(){const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof);
  const L=[...M.turmas.values()].filter(T=>crTurmaRes(T,"").L.length).map(T=>({T,dt:cfg.profs.find(p=>p.id===T.t.dt)})).filter(x=>x.dt&&/\S+@\S+\.\S+/.test(x.dt.email||""));
  const sem=[...M.turmas.values()].filter(T=>crTurmaRes(T,"").L.length&&!L.some(x=>x.T===T)).map(T=>T.t.cod);
  if(!L.length){toast("Nenhuma turma com orientador educativo com email (Escola › Turmas)");return}
  if(!confirm(`Enviar o ponto de situação a ${calDMA(asof)} aos orientadores educativos de ${L.length} turma(s), com o PDF da turma em anexo (a partir da sua conta do Office 365)?${sem.length?`\n\nSem orientador educativo com email: ${sem.join(", ")}.`:""}`))return;
  ovAbrir("A enviar os pontos de situação");let n=0;const falhas=[];
  for(const {T,dt} of L){await ovPasso(4+92*n/L.length,`${T.t.cod}: ${dt.nome}`);try{const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});await crPdf(T.t.id,doc);pdfMoldura(doc,"EPISJ 360 · Crono360 · ponto de situação a "+calDMA(asof));
      const r=crTurmaRes(T,""),prob=r.L.filter(o=>o.est==="risco"||o.est==="semhorario").map(o=>o.disc);
      await msEnviar({to:dt.email,cc:(msCfg&&msCfg().cc)||"",subject:`Ponto de situação ${T.t.cod} — ${calDMA(asof)}`,body:`Olá ${String(dt.nome||"").split(/\s+/)[0]},\n\nSegue o ponto de situação da turma ${turmaNome(T.t)} a ${calDMA(asof)}: ${r.P?Math.round(r.G/r.P*100):0}% do plano já dado.${prob.length?"\n\nDisciplinas em risco: "+prob.join(", ")+".":"\n\nNenhuma disciplina em risco."}\n\nO cronograma dos módulos está no PDF em anexo.\n\nA Direção`,anexo:{name:pdfTxt(`Ponto de situacao ${T.t.cod} ${asof}.pdf`),b64:pdfB64(doc)}});n++}
    catch(e){falhas.push(T.t.cod+": "+(e.message||e))}}
  await ovPasso(100,"Enviado");ovFechar(400);escLinhaMsg("#crPsMsg",`${n} email(s) enviado(s) aos orientadores educativos.${falhas.length?"<br>Falhou: "+esc(falhas.join("; ")):""}`,falhas.length?"bad":"ok")}

/* ---------- eventos ---------- */
document.querySelectorAll("[data-crano]").forEach(s=>s.addEventListener("change",e=>{CR_SEL.ano=e.target.value;CR_SEL.ver="";crRender()}));
document.querySelectorAll("[data-crtur]").forEach(s=>s.addEventListener("change",e=>{CR_SEL[s.dataset.crtur==="obrig"?"tc":"t"]=e.target.value;crRender()}));
document.querySelectorAll("[data-crasof]").forEach(i=>i.addEventListener("change",e=>{CR_SEL.asof=e.target.value&&e.target.value!==calHoje()?e.target.value:"";crRender()}));
$("#crPsOut").addEventListener("click",e=>{const b=e.target.closest("[data-crv]");if(!b||e.target.closest(".crdet")||e.target.closest("[data-crcump]"))return;CR_SEL.ver=CR_SEL.ver===b.dataset.crv?"":b.dataset.crv;crPs()});
$("#crPsOut").addEventListener("click",e=>{const c=e.target.closest("[data-crcump]");if(c){e.stopPropagation();CP.t=c.dataset.crcump;CP.alvo=null;CP.fase=0;AJ.t=c.dataset.crcump;AJ.alvo={};show("crCump");return}
  const d=e.target.closest("[data-crdd]");if(!d||!crPodeEditar())return;e.stopPropagation();const [tid,k]=d.dataset.crdd.split("|"),a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof),o=M.turmas.get(tid)&&M.turmas.get(tid).discs.get(k),t=escData().turmas.find(x=>x.id===tid);if(!o||!t)return;
  const v=prompt(`Horas de ${o.disc} dadas na turma ${t.cod} até ${calDMA(asof)} (por exemplo, pelos sumários do pleon).\n\nA EPISJ 360 conta ${crNum(crH1(o.G,M.fator))} h ${M.manual?"(último registo e, depois dele, o previsto no cronograma)":"a partir do horário"}.`,crNum(crH1(o.G,M.fator)).replace(/\s/g,""));if(v==null)return;
  const h=parseFloat(String(v).replace(",","."));if(!(h>=0)){toast("Número inválido");return}
  crCfg().corr.push({id:uid(),anoId:a.id,turmaId:tid,disc:k,discNome:o.disc,data:asof,dados:h,nota:"ponto de situação",por:String(EU&&EU.email||""),em:Date.now()});save();CR_CACHE.k="";crPs();toast("Horas dadas corrigidas")});
document.querySelectorAll("#crPs,#crHist,#crCump,#crCron,#crDef,#crAno").forEach(s=>s.addEventListener("click",e=>{const l=e.target.closest("[data-crir]");if(l){e.preventDefault();if(l.dataset.crcp){CP.t=l.dataset.crcp;CP.alvo=null;CP.fase=0}if(s.id==="crAno"&&CRA.t){CR_SEL.tc=CRA.t;document.body.classList.remove("cramplo");crAnoAmpSync()}show(l.dataset.crir);if(l.dataset.crir==="crCron"&&/Tempos por semana/.test(l.textContent))setTimeout(()=>{const c=$("#crManC");if(c&&c.offsetParent)c.scrollIntoView({behavior:"smooth",block:"start"})},80)}
  if(e.target.closest("[data-cres]"))e.preventDefault();
  if(e.target.closest("[data-cres]"))mostrarModulo("eduschedule",true)}));
$("#crPsReg").onclick=()=>{const asof=CR_SEL.asof||calHoje(),p=crRegistar(asof,false);if(p){escLinhaMsg("#crPsMsg",`✓ Registado: <b>${esc(p.nome)}</b>. Fica no <a href="#" data-crir="crHist">histórico</a> para comparar com os próximos.`,"ok");crPs()}};
$("#crPsPdf").onclick=()=>crPdf().catch(e=>toast("Não foi possível fazer o PDF: "+e.message));
$("#crPsEnv").onclick=()=>crEnviarDT().catch(e=>{ovFechar();toast(e.message||String(e))});
$("#crCronPdf").onclick=()=>crPdf($("#crCronT").value).catch(e=>toast("Não foi possível fazer o PDF: "+e.message));
$("#crHistLista").addEventListener("click",e=>{const x=e.target.closest("[data-crhdel]");if(x){if(!crPodeEditar())return;const p=CR.pontos.find(q=>q.id===x.dataset.crhdel);if(!p||!confirm(`Apagar «${p.nome}»?`))return;CR.pontos=CR.pontos.filter(q=>q.id!==p.id);CR.del[p.id]=Date.now();crGuardar();crHist();toast("Ponto de situação apagado");return}
  const r=e.target.closest("[data-crh]");if(r){CR_SEL.ver=r.dataset.crh;CR_SEL.cmp="";crHist()}});
$("#crHistCmp").addEventListener("change",e=>{CR_SEL.cmp=e.target.value;crHist()});
$("#crHistPdf").onclick=async()=>{const a=crAnoSel(),p=CR.pontos.filter(q=>q.anoId===a.id).find(q=>q.id===CR_SEL.ver)||CR.pontos.filter(q=>q.anoId===a.id)[0];if(!p){toast("Sem pontos de situação");return}
  const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"}),f=p.fator||1,nmT=new Map((p.turmas||[]).map(x=>[x[0],x[1]]));let y=pdfTitulo(doc,p.nome,`Ano letivo ${a.nome} · registado por ${p.por||"-"}`);
  pdfTabela(doc,y,["Turma","Disciplina","Plano","Dadas","Saldo","Módulos","Estado"],p.linhas.slice().sort((x,z)=>COLL_PTN.compare(String(nmT.get(x[0])),String(nmT.get(z[0])))).map(l=>[nmT.get(l[0])||"",l[1],crNum(crH1(l[2],f)),crNum(crH1(l[3],f)),crNum(crH1(l[3]+l[5]-l[2],f)),l[8]+"/"+l[9],(CR_EST[l[7]]||[""])[0]].map(pdfTxt)),{0:{cellWidth:16},2:{halign:"right",cellWidth:16},3:{halign:"right",cellWidth:16},4:{halign:"right",cellWidth:16},5:{halign:"center",cellWidth:18},6:{cellWidth:26}});
  pdfMoldura(doc,"EPISJ 360 · Crono360");doc.save(pdfTxt(p.nome+".pdf"))};
const crDefMud=fn=>{if(!crPodeEditar())return;fn(crCfg().def);save();CR_CACHE.k="";crRender()};
$("#crDefHora").onchange=e=>crDefMud(d=>d.hora=e.target.value);$("#crDefFonte").onchange=e=>crDefMud(d=>d.fonte=e.target.value);$("#crDefFct").onchange=e=>crDefMud(d=>d.fct=e.target.checked);$("#crDefAnul").onchange=e=>crDefMud(d=>d.anul=e.target.checked);
$("#crDefAuto").onchange=e=>crDefMud(d=>d.auto=e.target.value);$("#crDefDia").onchange=e=>crDefMud(d=>d.dia=+e.target.value);
$("#crDefFim").addEventListener("change",e=>{const i=e.target.closest("[data-crfim]");if(!i)return;crDefMud(d=>{const a=crAnoSel();d.fimT[a.id]=d.fimT[a.id]||{};if(i.value)d.fimT[a.id][i.dataset.crfim]=i.value;else delete d.fimT[a.id][i.dataset.crfim]})});
$("#crDefMapa").addEventListener("change",e=>{const s=e.target.closest("[data-crmapa]");if(!s)return;crDefMud(d=>{if(s.value)d.mapa[s.dataset.crmapa]=s.value;else delete d.mapa[s.dataset.crmapa]})});
$("#crDefMapaFeitos").addEventListener("click",e=>{const x=e.target.closest("[data-crmapax]");if(!x)return;e.preventDefault();crDefMud(d=>{delete d.mapa[x.dataset.crmapax]})});
$("#crCorrT").onchange=crCorrDiscs;
$("#crCorrF").addEventListener("submit",e=>{e.preventDefault();if(!crPodeEditar())return;const a=crAnoSel(),tid=$("#crCorrT").value,k=$("#crCorrD").value,dt=$("#crCorrData").value,v=$("#crCorrH").value;
  if(!tid||!k||!dt||v===""){toast("Escolha a turma, a disciplina, a data e as horas dadas");return}const o=crMotor(a).turmas.get(tid)?.discs.get(k);
  crCfg().corr.push({id:uid(),anoId:a.id,turmaId:tid,disc:k,discNome:o?o.disc:k,data:dt,dados:Math.max(0,+v||0),nota:$("#crCorrNota").value.trim(),por:String(EU&&EU.email||""),em:Date.now()});save();CR_CACHE.k="";crDef();toast("Correção registada");e.target.reset()});
$("#crDefCorr").addEventListener("click",e=>{const x=e.target.closest("[data-crcorrdel]");if(!x||!crPodeEditar())return;if(!confirm("Apagar esta correção das horas dadas?"))return;const c=crCfg();c.corr=c.corr.filter(q=>q.id!==x.dataset.crcorrdel);save();CR_CACHE.k="";crDef()});
// colar horas dadas (do pleon ou do Excel): turma; disciplina; data; horas dadas
$("#crCorrColar").onclick=()=>{if(!crPodeEditar())return;const a=crAnoSel(),M=crMotor(a),E=escData();let n=0,mal=0;const hj=calHoje();
  for(const l of $("#crCorrTxt").value.split(/\n/)){const c=l.split(/[;\t]/).map(x=>x.trim());if(c.length<3||!c[0])continue;const t=E.turmas.find(x=>norm(x.cod)===norm(c[0])&&turmaNoAno(x,a)),R=t&&M.turmas.get(t.id);
    const dk=R&&([...R.discs.keys()].find(k=>k===norm(c[1]))||[...R.discs.keys()].find(k=>k.includes(norm(c[1]))||norm(c[1]).includes(k)));
    let dt=hj,hv=c[2];if(c.length>=4){const m=c[2].match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})$/);dt=m?calIsoD(+m[3]<100?2000+(+m[3]):+m[3],+m[2],+m[1]):(/^\d{4}-\d{2}-\d{2}$/.test(c[2])?c[2]:null);hv=c[3]}
    const v=parseFloat(String(hv).replace(",","."));if(!t||!dk||!dt||!(v>=0)){mal++;continue}
    crCfg().corr.push({id:uid(),anoId:a.id,turmaId:t.id,disc:dk,discNome:R.discs.get(dk).disc,data:dt,dados:v,nota:"colado",por:String(EU&&EU.email||""),em:Date.now()});n++}
  if(n){save();CR_CACHE.k="";$("#crCorrTxt").value=""}crDef();toast(`${n} correção(ões) registada(s)${mal?` · ${mal} linha(s) não percebida(s)`:""}`)};

