/* ===================== EPISJ 360 0.9.67: Crono360 › Cumprir o plano — o motor =====================
   O diretor pedagógico faz o ponto de situação numa data (X), vê o que falta de cada disciplina e o que o horário ainda dá até ao fim
   das aulas da turma, e cria o horário novo a partir de uma data (S) — automático, ou com os tempos por semana escolhidos à mão — até
   ao fim das aulas ou até uma data. Quando uma disciplina acaba o plano, os tempos dela passam para as que ainda precisam (fases).
   Ao aplicar, o Horários360 recebe períodos do ano novos (cópias do horário em vigor, só com a turma mudada): o horário antigo fica como
   estava até à véspera, as outras turmas não mudam, nada é apagado e pode anular-se.
   Regras: um formador, uma sala e uma turma nunca ficam em dois sítios ao mesmo tempo (em nenhum dos horários do período); os tempos
   impossíveis (−3) dos formadores, das turmas, das disciplinas e das salas respeitam-se; não se mexe em tempos fixos, aulas de várias
   turmas, aulas só de semanas A/B ou de grupos de semanas. */
const cpCopia=o=>JSON.parse(JSON.stringify(o));
const cpSegDe=s=>{let x=s;for(let i=0;i<7&&((calD(x).getDay()+6)%7)!==0;i++)x=calMais(x,1);return x}; // a própria segunda-feira ou a seguinte
const cpProxSeg=s=>cpSegDe(calMais(s,1)); // a primeira segunda-feira depois de s
const cpPop=m=>{let c=0;while(m){m&=m-1;c++}return c};
function cpOpc(){const d=crCfg().def;if(!d.cp||typeof d.cp!=="object")d.cp={};const o=d.cp;
  for(const [k,v] of Object.entries({fases:true,livres:true,ceder:true,trocas:true,seg:true}))if(typeof o[k]!=="boolean")o[k]=v;
  o.maxDia=Math.max(0,Math.min(16,parseInt(o.maxDia)||0));return o}

/* ---------- versões do horário (períodos do ano do Horários360) ---------- */
// lista em que cada versão tem as suas aulas e tempos (a ativa traz as de st.lessons/st.cards)
function cpVersoes(st){if(!Array.isArray(st.horarios)||!st.horarios.length)return[{id:"",nome:"Horário único",de:st.inicio||"",ate:st.fim||"",lessons:st.lessons||[],cards:st.cards||[],_unico:true,_ativo:true}];
  return st.horarios.map(v=>v.id===st.hAtivo?Object.assign({},v,{lessons:st.lessons||[],cards:st.cards||[],_ativo:true}):Object.assign({},v,{lessons:v.lessons||[],cards:v.cards||[]}))}
function cpGravarVersoes(st,L){if(L.length===1&&L[0]._unico){st.lessons=L[0].lessons;st.cards=L[0].cards;return}
  const at=L.find(v=>v._ativo)||L[0];st.hAtivo=at.id;st.lessons=at.lessons;st.cards=at.cards;
  st.horarios=L.map(v=>{const o=Object.assign({},v);delete o._ativo;delete o._unico;if(v===at){delete o.lessons;delete o.cards}return o})}
const cpVersaoEm=(L,x)=>L.find(v=>(!v.de||x>=v.de)&&(!v.ate||x<=v.ate))||null;
// garante uma versão a começar em x (cópia da que estava em vigor); devolve-a
function cpPartir(L,x,nome,fimAno){let i=L.findIndex(v=>(!v.de||x>=v.de)&&(!v.ate||x<=v.ate));
  if(i<0){ // x num buraco entre versões: copia a última versão antes de x
    const ant=L.filter(v=>v.ate&&v.ate<x).sort((p,q)=>q.ate.localeCompare(p.ate))[0]||L[0],seg=L.filter(v=>v.de&&v.de>x).sort((p,q)=>p.de.localeCompare(q.de))[0];
    const n={id:uid(),nome,de:x,ate:seg?calMais(seg.de,-1):(fimAno||""),lessons:cpCopia(ant.lessons||[]),cards:cpCopia(ant.cards||[])};L.push(n);return n}
  const v=L[i];if(v.de===x)return v;
  if(v._unico){v._unico=false;v.id=uid();v.nome="Horário inicial";v.de=v.de||"";}
  const n={id:uid(),nome,de:x,ate:v.ate||"",lessons:cpCopia(v.lessons||[]),cards:cpCopia(v.cards||[])};v.ate=calMais(x,-1);L.splice(i+1,0,n);return n}

/* ---------- contexto: o estado do Horários360 (cópia de trabalho) e a situação a X ---------- */
function cpCtx(a,asof,stBase){const st0=stBase||crEstado(a);if(!st0)return null;const st=cpCopia(st0);
  for(const k of["lessons","cards","classes","teachers","rooms","subjects","horarios","gsem"])if(!Array.isArray(st[k]))st[k]=[];
  const M=crMotor(a,asof);if(!M.st||!M.dda)return null;
  const P=(st.periods||[]).length,Dn=(st.days||[]).length,K=crK(st),FULL=(1<<(2*K))-1;
  const ctx={a,asof,st,M,P,Dn,NS:Dn*P,K,FULL,L:cpVersoes(st),cid:new Map(),t2p:new Map(),p2t:new Map(),offC:new Map(),
    sub:new Map(st.subjects.map(x=>[x.id,x])),cls:new Map(st.classes.map(x=>[x.id,x])),tch:new Map(st.teachers.map(x=>[x.id,x])),rms:new Map(st.rooms.map(x=>[x.id,x])),
    brk:(st.periods||[]).map(p=>!!p.breakAfter),dias:new Map(),fimAno:st.fim||a.fim||""};
  const tIds=new Set(escData().turmas.map(t=>t.id));
  for(const c of st.classes){const tid=tIds.has(c.id)?c.id:(ESD.mapaC||{})[c.id];if(tid&&!ctx.cid.has(tid))ctx.cid.set(tid,c.id)}
  const pIds=new Set(cfg.profs.map(p=>p.id));for(const t of st.teachers){const pid=pIds.has(t.id)?t.id:(ESD.mapaT||{})[t.id];if(pid){ctx.t2p.set(t.id,pid);if(!ctx.p2t.has(pid))ctx.p2t.set(pid,t.id)}}
  // tempos impossíveis (−3) e preferências de cada recurso
  for(const key in st.off||{}){const o=st.off[key];if(!o||typeof o!=="object")continue;const arr=new Int8Array(ctx.NS);let tem=false;
    for(const sl in o){const j=sl.indexOf("-"),d=+sl.slice(0,j),p=+sl.slice(j+1);if(d>=0&&d<Dn&&p>=0&&p<P){arr[d*P+p]=+o[sl]||0;tem=true}}if(tem)ctx.offC.set(key[0]+"|"+key.slice(2),arr)}
  return ctx}
const cpNivel=(ctx,kind,id,s)=>{const a=ctx.offC.get(kind+"|"+id);return a?a[s]:0};
function cpSala(ctx,l,ln){if(ln.r)return ln.r;const s=ctx.sub.get(ln.s);if(s&&s.roomId)return s.roomId;const c=ctx.cls.get((l.classIds||[])[0]);return c&&c.roomId||""}
function cpCadeia(ctx,r){const out=[];let x=ctx.rms.get(r);while(x&&out.length<32&&!out.includes(x.id)){out.push(x.id);x=x.alt?ctx.rms.get(x.alt):null}return out}
// dias de aulas da turma (sem interrupções, feriados, FCT, nem depois do fim das aulas)
function cpDias(ctx,tid){if(ctx.dias.has(tid))return ctx.dias.get(tid);const M=ctx.M,T=M.turmas.get(tid),out=[];
  if(T)for(let i=0;i<M.D.length;i++){if(T.fora[i])continue;const x=M.D[i];out.push({i,x,wd:(calD(x).getDay()+6)%7,par:M.par[i]|0,sem:x<M.mid?0:1})}
  ctx.dias.set(tid,out);return out}
const cpFimAulas=(ctx,tid)=>{const d=cpDias(ctx,tid);return d.length?d[d.length-1].x:""};
// o tempo da turma pode mexer-se? (aula só desta turma, todas as semanas, não fixa, uma só disciplina do plano)
function cpEditavel(ctx,l,c,cid,tid){if(!l||(l.classIds||[]).length!==1||l.classIds[0]!==cid||l.per||l.gsem||l.fixa||(c&&c.locked))return false;
  const ks=ctx.M.dda(l,cid,tid);return ks.size===1}
function cpItens(ctx,v,tid){const cid=ctx.cid.get(tid),out=[];if(!cid||!v)return out;const lm=new Map((v.lessons||[]).map(l=>[l.id,l]));
  for(const c of v.cards||[]){if(c.day==null||c.period==null)continue;const l=lm.get(c.lessonId);if(!l||l.ign||!(l.classIds||[]).includes(cid))continue;
    const ks=[...ctx.M.dda(l,cid,tid).keys()];
    out.push({cid:c.id,l,lid:l.id,k:ks[0]||"",ks,day:+c.day,period:+c.period,len:+c.len||1,mask:crPerMask(l.per,ctx.K),ed:cpEditavel(ctx,l,c,cid,tid),r:Array.isArray(c.r)?c.r.slice():null})}
  return out}
const cpCopiaItem=it=>Object.assign({},it,{ks:it.ks.slice(),r:it.r?it.r.slice():null});
// ocupação dos formadores, das salas e da turma por tudo o que não vai ser replaneado, em todos os horários entre de e ate
function cpOcupacao(ctx,tid,de,ate){const {NS,P,K}=ctx,cid=ctx.cid.get(tid),occT=new Map(),occR=new Map(),occC=new Int32Array(NS);
  const add=(m,id,s,len,mk)=>{let x=m.get(id);if(!x)m.set(id,x=new Int32Array(NS));for(let k=0;k<len;k++)if(s+k<NS)x[s+k]|=mk};
  for(const v of ctx.L){if((v.ate&&v.ate<de)||(v.de&&v.de>ate))continue;const lm=new Map((v.lessons||[]).map(l=>[l.id,l]));
    for(const c of v.cards||[]){if(c.day==null||c.period==null)continue;const l=lm.get(c.lessonId);if(!l||l.ign)continue;const len=+c.len||1,s=c.day*P+c.period,mk=crPerMask(l.per,K),daT=(l.classIds||[]).includes(cid);
      if(daT&&cpEditavel(ctx,l,c,cid,tid))continue;
      if(daT)for(let k=0;k<len;k++)if(s+k<NS)occC[s+k]|=mk;
      (l.linhas||[]).forEach((ln,i)=>{if(ln.t)add(occT,ln.t,s,len,mk);const r=(Array.isArray(c.r)&&c.r[i])||cpSala(ctx,l,ln);if(r)add(occR,r,s,len,mk)})}}
  return{occT,occR,occC}}
// entregas entre de e ate com estes tempos: total por disciplina e o dia em que cada uma chega ao que precisa (R)
function cpEntrega(ctx,tid,itens,de,ate,R){const dias=cpDias(ctx,tid),tot=new Map(),fim=new Map(),wd=[];for(const it of itens)(wd[it.day]||(wd[it.day]=[])).push(it);
  for(const d of dias){if(d.x<de||d.x>ate)continue;const L=wd[d.wd];if(!L)continue;const bit=crPerBit(d.par,d.sem,ctx.K);
    for(const it of L){if(it.mask!==ctx.FULL&&!(it.mask>>bit&1))continue;const l=it.l;
      if(l&&!it.novo){if(l.de&&d.x<l.de)continue;if(l.ate&&!l.crAte&&d.x>l.ate)continue;if(l.gsem&&ctx.M.gs&&ctx.M.gs.has(l.gsem)&&!ctx.M.gs.get(l.gsem).has(crSeg(d.x)))continue}
      for(const k of it.ks){const v=(tot.get(k)||0)+it.len;tot.set(k,v);if(R&&!fim.has(k)&&R.has(k)&&v>=R.get(k)-1e-6)fim.set(k,d.x)}}}
  return{tot,fim}}
function cpDiasSemana(ctx,tid,de,ate){const n=new Array(7).fill(0),sem=new Set();for(const d of cpDias(ctx,tid))if(d.x>=de&&d.x<=ate){n[d.wd]++;sem.add(crSeg(d.x))}return{n,sem:sem.size}}
function cpListaSlots(ctx,its){const P=ctx.P,por=new Map();for(const it of its){const m=(por.get(it.day)||0)|(((1<<it.len)-1)<<it.period);por.set(it.day,m)}
  const lab=p=>((ctx.st.periods[p]||{}).label||p+1)+".º";
  return [...por.keys()].sort((a,b)=>a-b).map(d=>{const m=por.get(d),rs=[];for(let p=0;p<P;p++){if(!(m>>p&1))continue;let q=p;while(q+1<P&&(m>>(q+1)&1))q++;rs.push(q>p?lab(p)+"–"+lab(q):lab(p));p=q}
    return ((ctx.st.days||[])[d]||"?")+" "+(rs.length>1?rs.slice(0,-1).join(", ")+" e "+rs[rs.length-1]:rs[0])}).join("; ")}
const cpRotSlot=(ctx,d,p,len)=>`${(ctx.st.days||[])[d]||"?"} ${(ctx.st.periods[p]||{}).label||p+1}.º`+(len>1?`–${(ctx.st.periods[p+len-1]||{}).label||p+len}.º`:"");

/* ---------- a aula onde entram os tempos novos de uma disciplina ---------- */
function cpAulaDe(ctx,v0,tid,k,base){const cid=ctx.cid.get(tid),M=ctx.M,T=M.turmas.get(tid),o=T&&T.discs.get(k);
  const mine=(v0.lessons||[]).filter(l=>!l.ign&&(l.classIds||[]).includes(cid)&&M.dda(l,cid,tid).has(k));
  const ed=mine.filter(l=>cpEditavel(ctx,l,null,cid,tid));
  if(ed.length){const tl=l=>base.filter(it=>it.lid===l.id).reduce((s,it)=>s+it.len,0)||l.tl||0;return{l:ed.slice().sort((p,q)=>tl(q)-tl(p))[0],novo:false}}
  // sem aula própria: cria-se a aula de reforço da turma (com a disciplina e o formador da aula conjunta, ou do plano)
  const ref=mine[0];let sid="",tch="";
  if(ref){const ln=(ref.linhas||[]).find(x=>M.discDe(tid,x.s)===k)||ref.linhas[0];sid=ln.s;tch=ln.t||""}
  else{const want="pc_"+esHash(k);sid=ctx.sub.has(want)?want:((ctx.st.subjects.find(x=>norm(x.name)===k)||{}).id||"");
    if(!sid&&o){sid=want;const usadas=new Set(ctx.st.subjects.map(x=>String(x.short||"").toUpperCase()));const sj={id:sid,short:esSiglaDisc(o.disc,usadas),name:o.disc,color:ES_CORES[ctx.st.subjects.length%ES_CORES.length],roomId:"",fator:ctx.st.tlMin||50,seq:"",marg:false,cnl:false};ctx.st.subjects.push(sj);ctx.sub.set(sid,sj);ctx.subNovas=(ctx.subNovas||[]).concat(sj)}
    if(o){let pid="",mx=-1;for(const [f,h] of o.f)if(h>mx){mx=h;pid=f}tch=ctx.p2t.get(pid)||""}}
  if(!sid)return null;
  return{l:{id:"cr_"+esHash(ctx.a.id+"|"+tid+"|"+k),classIds:[cid],linhas:[{s:sid,t:tch,r:"",tip:""}],tl:0,duplos:0,blocos:"",per:"",crRef:1},novo:true}}

/* ---------- o plano de uma turma: fases, com os tempos de cada disciplina ---------- */
// opt: {de, ate (válido até; vazio = fim das aulas), alvo: Map(disciplina → tempos/semana na 1.ª fase) ou null (automático)}
function cpPlanear(ctx,tid,opt){const M=ctx.M,T=M.turmas.get(tid),opc=Object.assign({},cpOpc(),opt.opc||{});
  if(!T)return{erro:"Esta turma não tem plano curricular neste ano letivo."};const cid=ctx.cid.get(tid);
  if(!cid)return{erro:"Esta turma ainda não está no Horários360."};
  const E=cpFimAulas(ctx,tid),S=opt.de;if(!E)return{erro:"A turma não tem dias de aulas neste ano letivo."};
  if(S>E)return{erro:`A turma já não tem aulas depois de ${calDM(S,{day:"numeric",month:"long"})} (as aulas acabam a ${calDM(E,{day:"numeric",month:"long"})}).`};
  const Y=opt.ate&&opt.ate<E?opt.ate:E;
  // o que falta a partir de S (o que já foi dado até X e o que o horário ainda dá até à véspera de S)
  const iS=M.ix.has(S)?M.ix.get(S):(S<M.D[0]?0:M.D.length),need=new Map(),disc=new Map();
  for(const o of T.discs.values()){if(o.P<=0)continue;const ant=iS>0?Math.max(0,o.cum[Math.min(iS,o.cum.length)-1]):0;need.set(o.k,Math.max(0,o.P-ant));disc.set(o.k,o)}
  const v0=cpVersaoEm(ctx.L,S);if(!v0)return{erro:"Não há horário em vigor no Horários360 a "+calDMA(S)+"."};
  const base=cpItens(ctx,v0,tid),occ=cpOcupacao(ctx,tid,S,Y),cls=ctx.cls.get(cid)||{},maxDia=opc.maxDia||Math.min(ctx.P,(cls.maxDay|0)||ctx.P);
  const aulas=new Map(),aulaDe=k=>{if(!aulas.has(k))aulas.set(k,cpAulaDe(ctx,v0,tid,k,base));return aulas.get(k)};
  const res={tid,cid,S,E,Y,need,disc,base,v0,fases:[],prob:[],aulas,maxDia};
  let ini=S,pat=base.map(cpCopiaItem);const dados=new Map();
  for(let f=0;f<10;f++){
    const R=new Map([...need].map(([k,v])=>[k,Math.max(0,v-(dados.get(k)||0))]));
    // 1) sai do horário da turma o que já está cumprido (ou cuja aula já acabou): esses tempos ficam livres
    const lib=new Set();pat=pat.filter(it=>{if(!it.ed)return true;const feita=need.has(it.k)&&(R.get(it.k)||0)<=1e-6,acabou=it.l&&it.l.ate&&!it.l.crAte&&it.l.ate<ini;
      if(feita||acabou){for(let q=0;q<it.len;q++)lib.add(it.day*ctx.P+it.period+q);return false}return true});
    const W=cpDiasSemana(ctx,tid,ini,E);
    // 2) os tempos: à mão (1.ª fase, quando se escolheu) ou automáticos
    const mud=[];
    if(f===0&&opt.alvo)cpManual(ctx,tid,{pat,R,W,occ,lib,aulaDe,opc,maxDia,ini,E,mud,alvo:opt.alvo,disc});
    else cpAuto(ctx,tid,{pat,R,W,occ,lib,aulaDe,opc,maxDia,ini,E,mud,disc});
    // 3) quando acaba cada disciplina com este horário, e se há uma fase seguinte (os tempos de quem acaba passam para quem precisa)
    const sim=cpEntrega(ctx,tid,pat,ini,E,R);let prox="";
    const falta=[...R].filter(([k,v])=>v-(sim.tot.get(k)||0)>1e-6);
    if(opc.fases&&falta.length&&f<9){const fins=[...sim.fim.entries()].filter(([k,x])=>x<E).sort((p,q)=>p[1].localeCompare(q[1]));
      for(const [k,x] of fins){const nx=opc.seg?cpProxSeg(x):calMais(x,1);if(nx>Y||nx>E)continue;
        const ts=new Set();for(const [kk] of falta){const A=aulaDe(kk);if(A)(A.l.linhas||[]).forEach(ln=>ts.add(ln.t||""))}
        const serve=pat.some(it=>it.ed&&it.k===k&&[...ts].some(t=>{if(!t)return true;const o=occ.occT.get(t);for(let q=0;q<it.len;q++){const s=it.day*ctx.P+it.period+q;if(o&&o[s])return false;if(cpNivel(ctx,"t",t,s)===-3)return false}return true}));
        if(serve){prox=nx;break}}}
    const fimF=prox?calMais(prox,-1):Y,simF=cpEntrega(ctx,tid,pat,ini,fimF,R);
    for(const [k,v] of simF.tot)dados.set(k,(dados.get(k)||0)+Math.min(v,R.get(k)||0));
    res.fases.push({de:ini,ate:fimF,itens:pat.map(cpCopiaItem),R,sim,W,mud,lib:[...lib]});
    if(!prox)break;ini=prox}
  // o que fica por resolver (com as regras escolhidas)
  const tot=new Map(),ult=res.fases[res.fases.length-1];for(const F of res.fases){const s=cpEntrega(ctx,tid,F.itens,F.de,F===ult?E:F.ate,null);for(const [k,v] of s.tot)tot.set(k,(tot.get(k)||0)+v)}
  for(const [k,v] of need){const t=tot.get(k)||0;if(v-t>1e-6)res.prob.push({k,falta:v-t,disc:disc.get(k),semAula:!aulaDe(k)})}
  // porque é que fica por resolver: a turma está cheia, o formador não pode nos tempos livres, ou as regras escolhidas não deixam
  {const F=ult,P=ctx.P,ps=new Array(ctx.NS).fill(null),dm=new Array(ctx.Dn).fill(0);for(const it of F.itens)for(let q=0;q<it.len;q++){ps[it.day*P+it.period+q]=it;dm[it.day]|=1<<(it.period+q)}
    for(let x=0;x<ctx.NS;x++)if(occ.occC[x])dm[(x/P)|0]|=1<<(x%P);
    const livres=[];for(let x=0;x<ctx.NS;x++){const d=(x/P)|0;if(!ps[x]&&!occ.occC[x]&&F.W.n[d]&&cpPop(dm[d])<maxDia&&cpNivel(ctx,"c",cid,x)!==-3)livres.push(x)}
    for(const pr of res.prob){if(pr.semAula){pr.motivo="semaula";continue}if(!livres.length){pr.motivo="cheia";continue}
      const A=aulaDe(pr.k),ts=cpTsDe(A);pr.motivo=livres.some(x=>ts.every(t=>{const o=occ.occT.get(t);return!(o&&o[x])&&cpNivel(ctx,"t",t,x)!==-3}))?"regras":"formador"}}
  res.dias=cpDias(ctx,tid).filter(d=>d.x>=S&&d.x<=E).length;res.cap=res.dias*maxDia;res.falta=[...need.values()].reduce((a,b)=>a+b,0);
  return res}

// custo de pôr um tempo da disciplina numa posição (quanto menor, melhor): forma do dia da turma e dos formadores, preferências, repetições
function cpCusto(ctx,tid,k,ts,d,p,len,diaT,diaTch,patK,maxDia){const P=ctx.P;let c=0;
  const m0=diaT[d],add=((1<<len)-1)<<p,m1=m0|add,lo=x=>x?31-Math.clz32(x&-x):-1,hi=x=>x?31-Math.clz32(x):-1,gaps=x=>x?hi(x)-lo(x)+1-cpPop(x):0;
  c+=(gaps(m1)-gaps(m0))*2;if(m0){c+=Math.max(0,(hi(m1)-lo(m1))-(hi(m0)-lo(m0))-len)*0.8}else c+=3;
  const n1=cpPop(m1);if(n1>maxDia)c+=8*(n1-maxDia);
  for(const t of ts){if(!t)continue;const tm=diaTch(t,d);if(!tm)c+=1.5;else c+=Math.max(0,gaps(tm|add)-gaps(tm))*0.5;const tt=ctx.tch.get(t);if(tt&&tt.maxDay>0&&cpPop(tm|add)>tt.maxDay)c+=2;
    for(let q=0;q<len;q++){const v=cpNivel(ctx,"t",t,d*P+p+q);c+=v<0?-v*0.8:-v*0.2}}
  const km=patK(d);if(km){if((km&(add<<1))||(km&(add>>1)))c-=0.3;else c+=1.0;if(cpPop(km|add)>3)c+=1.5}
  return c+p*0.02}
// estrutura de trabalho de uma fase
function cpBase(ctx,tid,W){const P=ctx.P,NS=ctx.NS;return{
  slot(pat){const ps=new Array(NS).fill(null);for(const it of pat)if(it.ed)for(let q=0;q<it.len;q++)ps[it.day*P+it.period+q]=it;return ps},
  diaT(pat,occ){const m=new Array(ctx.Dn).fill(0);for(let s=0;s<NS;s++)if(occ.occC[s])m[(s/P)|0]|=1<<(s%P);for(const it of pat)m[it.day]|=((1<<it.len)-1)<<it.period;return m},
  ganho(d,len){return len*W.n[d]}}}
// pode pôr-se a aula A em d,p com len tempos? (formadores livres, turma e disciplina sem impedimentos, sala livre) → salas escolhidas ou null
function cpCabe(ctx,tid,A,d,p,len,occ,ignorarT){const P=ctx.P,cid=ctx.cid.get(tid);if(p+len>P)return null;for(let q=0;q<len-1;q++)if(ctx.brk[p+q])return null;
  for(let q=0;q<len;q++){const s=d*P+p+q;if(occ.occC[s])return null;if(cpNivel(ctx,"c",cid,s)===-3)return null}
  const l=A.l,salas=[];let temSala=false;
  for(const ln of l.linhas||[]){if(ln.t&&!(ignorarT&&ignorarT.has(ln.t))){const o=occ.occT.get(ln.t);for(let q=0;q<len;q++){const s=d*P+p+q;if(o&&o[s])return null;if(cpNivel(ctx,"t",ln.t,s)===-3)return null}}
    for(let q=0;q<len;q++)if(cpNivel(ctx,"s",ln.s,d*P+p+q)===-3)return null;
    const r0=cpSala(ctx,l,ln);if(!r0){salas.push("");continue}temSala=true;let esc="";
    for(const r of cpCadeia(ctx,r0)){if(salas.includes(r))continue;const o=occ.occR.get(r);let ok=true;for(let q=0;q<len;q++){const s=d*P+p+q;if((o&&o[s])||cpNivel(ctx,"r",r,s)===-3){ok=false;break}}if(ok){esc=r;break}}
    if(!esc)return null;salas.push(esc)}
  return temSala?salas:[]}
const cpTsDe=A=>A?(A.l.linhas||[]).map(ln=>ln.t||"").filter(Boolean):[];
function cpDiaTch(ctx,occ,pat){const P=ctx.P,cache=new Map();return(t,d)=>{const key=t+"|"+d;if(cache.has(key))return cache.get(key);let m=0;const o=occ.occT.get(t);if(o)for(let p=0;p<P;p++)if(o[d*P+p])m|=1<<p;
  for(const it of pat)if(it.day===d&&(it.l.linhas||[]).some(ln=>ln.t===t))m|=((1<<it.len)-1)<<it.period;cache.set(key,m);return m}}
function cpPatK(pat,k){return d=>{let m=0;for(const it of pat)if(it.day===d&&it.ks.includes(k))m|=((1<<it.len)-1)<<it.period;return m}}
function cpNovoItem(A,k,d,p,len,salas,FULL){return{cid:"",l:A.l,lid:A.l.id,k,ks:[k],day:d,period:p,len,mask:FULL,ed:true,novo:true,r:salas&&salas.length?salas:null}}

// os melhores sítios para mais tempos da disciplina k (tipos: liberado, ceder, livre; troca só se não houver outro)
function cpMelhor(ctx,tid,k,F,len,comTrocas){const {pat,W,occ,lib,aulaDe,opc,maxDia,surplus}=F,A=aulaDe(k);if(!A)return null;const P=ctx.P,B=cpBase(ctx,tid,W);
  const ps=B.slot(pat),diaT=B.diaT(pat,occ),diaTch=cpDiaTch(ctx,occ,pat),patK=cpPatK(pat,k),ts=cpTsDe(A),cabe=new Map();let best=null;
  const cabeEm=(AA,d,p,n)=>{const key=AA.l.id+"|"+d+"|"+p+"|"+n;if(!cabe.has(key))cabe.set(key,cpCabe(ctx,tid,AA,d,p,n,occ));return cabe.get(key)};
  const prova=cand=>{if(!best||cand.custo<best.custo-1e-9||(Math.abs(cand.custo-best.custo)<1e-9&&cand.ganho>best.ganho))best=cand};
  const semBrk=(p,n)=>{for(let q=0;q<n-1;q++)if(ctx.brk[p+q])return false;return p+n<=P};
  const livresT=[];for(let d=0;d<ctx.Dn;d++)if(W.n[d])for(let p=0;p+len<=P;p++){if(!semBrk(p,len))continue;let ok=true;for(let q=0;q<len;q++)if(ps[d*P+p+q])ok=false;if(ok)livresT.push([d,p])}
  for(let d=0;d<ctx.Dn;d++){if(!W.n[d])continue;
    for(let p=0;p+len<=P;p++){if(!semBrk(p,len))continue;const ganho=B.ganho(d,len);if(!ganho)continue;
      const occs=[];for(let q=0;q<len;q++)occs.push(ps[d*P+p+q]);
      if(occs.every(x=>!x)){ // tempo livre da turma (ou que ficou livre)
        let lv=true;for(let q=0;q<len;q++)if(!lib.has(d*P+p+q))lv=false;if(!lv&&!opc.livres)continue;
        if(cpPop(diaT[d]|(((1<<len)-1)<<p))>maxDia)continue; // a turma não passa do máximo de tempos por dia
        const salas=cabeEm(A,d,p,len);if(!salas)continue;
        prova({tipo:lv?"liberado":"livre",d,p,len,salas,ganho,custo:(lv?0:1.5)+cpCusto(ctx,tid,k,ts,d,p,len,diaT,diaTch,patK,maxDia)-(len>1?0.4:0)});continue}
      const X=occs[0];if(!X||occs.some(y=>y!==X)||X.k===k)continue;
      // ceder: tira-se a uma disciplina com tempos a mais (que continua a acabar a tempo) e dá-se a esta
      if(opc.ceder&&surplus&&surplus(X.k)>=ganho-1e-6&&(p===X.period||p+len===X.period+X.len)){const salas=cabeEm(A,d,p,len);
        if(salas){const dT=diaT.slice();dT[d]&=~(((1<<len)-1)<<p);prova({tipo:"ceder",d,p,len,salas,ganho,X,custo:1+cpCusto(ctx,tid,k,ts,d,p,len,dT,diaTch,patK,maxDia)-(len>1?0.4:0)});continue}}
      // troca: o tempo X (de outra disciplina, do mesmo tamanho) muda para um tempo livre onde o formador dele pode; esta fica aqui
      if(comTrocas&&opc.trocas&&X.len===len&&X.period===p){const salasK=cabeEm(A,d,p,len);if(!salasK)continue;const AX={l:X.l},g0=B.ganho(X.day,X.len);let bx=null;
        const dT=diaT.slice();dT[d]&=~(((1<<len)-1)<<p);
        for(const [d1,p1] of livresT){if(d1===d&&p1<p+len&&p1+len>p)continue;
          if(!opc.livres){let lv=true;for(let q=0;q<len;q++)if(!lib.has(d1*P+p1+q))lv=false;if(!lv)continue}
          const dg=B.ganho(d1,len)-g0;if(dg<0&&(!surplus||surplus(X.k)+dg<-1e-6))continue;
          if(cpPop((d1===d?dT[d]|(((1<<len)-1)<<p):dT[d1])|(((1<<len)-1)<<p1))>maxDia)continue;
          const salasX=cabeEm(AX,d1,p1,len);if(!salasX)continue;
          const c=cpCusto(ctx,tid,X.k,cpTsDe(AX),d1,p1,len,dT,diaTch,cpPatK(pat,X.k),maxDia);if(!bx||c<bx.c)bx={d1,p1,salasX,c}}
        if(bx)prova({tipo:"troca",d,p,len,salas:salasK,ganho,X,mv:bx,custo:4+bx.c+cpCusto(ctx,tid,k,ts,d,p,len,dT,diaTch,patK,maxDia)})}}}
  return best}
// o melhor sítio, tentando primeiro sem trocas; blocos de 2 quando a aula os usa e é preciso
function cpEscolher(ctx,tid,k,F,precisa2){const A=F.aulaDe(k);if(!A)return null;
  const duplos=precisa2&&((A.l.duplos|0)>0||F.pat.some(i=>i.lid===A.l.id&&i.len===2));
  for(const tr of[false,true]){let c=duplos?cpMelhor(ctx,tid,k,F,2,tr):null;const c1=cpMelhor(ctx,tid,k,F,1,tr);if(!c||(c1&&c1.custo<c.custo-1.2))c=c1;if(c)return c}
  return null}
function cpAplicarCand(ctx,F,k,c){const A=F.aulaDe(k),it=cpNovoItem(A,k,c.d,c.p,c.len,c.salas,ctx.FULL);
  if(c.tipo==="ceder"||c.tipo==="troca"){const X=c.X;it.era=X.k;
    if(c.tipo==="ceder"){const i=F.pat.indexOf(X);if(X.len===c.len&&X.period===c.p)F.pat.splice(i,1);
      else{ // fica com o resto do bloco
        if(c.p===X.period){X.period+=c.len;X.len-=c.len}else X.len=c.p-X.period;X.mexido=true}
      F.mud.push({t:"ceder",k,de:X.k,d:c.d,p:c.p,len:c.len})}
    else{X.day=c.mv.d1;X.period=c.mv.p1;X.r=c.mv.salasX&&c.mv.salasX.length?c.mv.salasX:null;X.movido=true;F.mud.push({t:"troca",k,de:X.k,d:c.d,p:c.p,len:c.len,d1:c.mv.d1,p1:c.mv.p1})}}
  else F.mud.push({t:c.tipo,k,d:c.d,p:c.p,len:c.len});
  F.pat.push(it);return it}
// automático: enquanto houver disciplinas sem tempos para acabar, junta-lhes o melhor tempo (as mais atrasadas primeiro)
function cpAuto(ctx,tid,F){const desist=new Set();
  for(let it=0;it<ctx.NS*2+20;it++){const sim=cpEntrega(ctx,tid,F.pat,F.ini,F.E,F.R),tot=sim.tot;F.tot=tot;
    F.surplus=j=>(tot.get(j)||0)-(F.R.has(j)?F.R.get(j):Infinity);
    const def=[...F.R].map(([k,v])=>[k,v-(tot.get(k)||0)]).filter(([k,x])=>x>1e-6&&!desist.has(k)).sort((p,q)=>q[1]-p[1]);if(!def.length)break;
    const [k,x]=def[0];const c=cpEscolher(ctx,tid,k,F,x/Math.max(1,F.W.sem)>1.2);
    if(!c){desist.add(k);continue}cpAplicarCand(ctx,F,k,c)}
  F.surplus=null}
// à mão: os tempos por semana de cada disciplina na 1.ª fase são os escolhidos (primeiro tira-se, depois põe-se)
function cpManual(ctx,tid,F){const P=ctx.P,alvo=F.alvo,cur=k=>F.pat.filter(it=>it.ed&&it.k===k).reduce((s,it)=>s+it.len,0);F.manual=true;
  // tirar: primeiro os tempos que servem a quem precisa de mais, depois os das pontas do dia
  const precisa=[...alvo].filter(([k,w])=>w>cur(k)).map(([k])=>k);
  for(const [k,w] of alvo){let tira=cur(k)-w;
    while(tira>0){const its=F.pat.filter(it=>it.ed&&it.k===k);if(!its.length)break;const B=cpBase(ctx,tid,F.W),diaT=B.diaT(F.pat,F.occ);
      const util=it=>precisa.some(k2=>{const A=F.aulaDe(k2);return A&&cpCabe(ctx,tid,A,it.day,it.period,1,{occT:F.occ.occT,occR:F.occ.occR,occC:F.occ.occC})})?1:0;
      const ponta=it=>{const m=diaT[it.day],lo=31-Math.clz32(m&-m),hi=31-Math.clz32(m);return it.period===lo||it.period+it.len-1===hi?1:0};
      its.sort((p,q)=>util(q)-util(p)||ponta(q)-ponta(p)||(q.len===1)-(p.len===1)||q.period-p.period);const X=its[0];
      if(X.len<=tira){F.pat.splice(F.pat.indexOf(X),1);for(let q=0;q<X.len;q++)F.lib.add(X.day*P+X.period+q);tira-=X.len;F.mud.push({t:"tirar",k,d:X.day,p:X.period,len:X.len})}
      else{const sai=X.period+X.len-tira;for(let q=0;q<tira;q++)F.lib.add(X.day*P+sai+q);F.mud.push({t:"tirar",k,d:X.day,p:sai,len:tira});X.len-=tira;X.mexido=true;tira=0}}}
  // pôr: os tempos que faltam a cada disciplina (sem tirar a outras: nas que se escolheram, os números ficam como estão)
  F.podeTirar=()=>false;F.surplus=()=>-Infinity;const desist=new Set();
  for(let n=0;n<ctx.NS*2;n++){const falta=[...alvo].map(([k,w])=>[k,w-cur(k)]).filter(([k,x])=>x>0&&!desist.has(k)&&(F.R.get(k)||0)>1e-6).sort((p,q)=>q[1]-p[1]);if(!falta.length)break;
    const [k,x]=falta[0];const c=cpEscolher(ctx,tid,k,F,x>=2);if(!c){desist.add(k);continue}cpAplicarCand(ctx,F,k,c)}
  F.manualFalta=[...alvo].map(([k,w])=>[k,w-cur(k)]).filter(([k,x])=>x>0&&(F.R.get(k)||0)>1e-6);F.manual=false;F.podeTirar=null;F.surplus=null}

/* ---------- aplicar o plano às versões (cópia de trabalho) ---------- */
// cada versão entre S e o fim da validade recebe, para esta turma, os tempos da fase em que começa; o resto fica como estava
function cpAplicarPlano(ctx,res,nomeFase){const L=ctx.L,tid=res.tid,Y=res.Y,E=res.E,ultima=res.fases[res.fases.length-1],fimVal=Y<E?Y:"";
  // só se criam períodos novos onde os tempos da turma mudam (de resto, só se acertam as datas em que as aulas acabam)
  const sig=its=>its.filter(it=>it.ed).map(it=>it.lid+"@"+it.day+"."+it.period+"x"+it.len).sort().join(" ");let ant=sig(res.base);
  for(const F of res.fases){const x=sig(F.itens);F.muda=x!==ant;ant=x}
  const partir=res.fases.some(F=>F.muda);res.mudaCartoes=partir;
  if(partir){for(const F of res.fases)if(F.muda)cpPartir(L,F.de,nomeFase(F.de),ctx.fimAno);
    if(fimVal){const nx=calMais(fimVal,1);if(!ctx.fimAno||nx<=ctx.fimAno)cpPartir(L,nx,"Horário anterior (desde "+calDM(nx)+")",ctx.fimAno)}}
  // aulas que o plano gere (as editáveis da turma no horário de S e as de reforço)
  const geridas=new Map();for(const it of res.base)if(it.ed)geridas.set(it.lid,it.l);for(const [k,A] of res.aulas)if(A&&A.novo)geridas.set(A.l.id,A.l);
  for(const F of res.fases)for(const it of F.itens)if(it.ed&&!geridas.has(it.lid))geridas.set(it.lid,it.l);
  const kDe=new Map();for(const F of [{itens:res.base}].concat(res.fases))for(const it of F.itens)if(it.ed&&!kDe.has(it.lid))kDe.set(it.lid,it.k);for(const [k,A] of res.aulas)if(A&&!kDe.has(A.l.id))kDe.set(A.l.id,k);
  // quando acaba cada disciplina (para pôr «acaba em» nas aulas e não passar do plano)
  const fimK=new Map(),acc=new Map();for(const F of res.fases){const fimF=F===ultima?E:F.ate,R0=new Map([...res.need].map(([k,v])=>[k,Math.max(0,v-(acc.get(k)||0))])),s2=cpEntrega(ctx,tid,F.itens,F.de,fimF,R0);
    for(const [k,x] of s2.fim)if(!fimK.has(k))fimK.set(k,x);for(const [k,v] of s2.tot)acc.set(k,(acc.get(k)||0)+v)}
  res.fimK=fimK;
  const acerta=l=>{const k=kDe.get(l.id),fk=k&&fimK.get(k);if(fk&&fk<E){if(!l.ate||l.crAte||fk<l.ate){l.ate=fk;l.crAte=1}}else if(l.crAte){delete l.ate;delete l.crAte}};
  for(const v of L){if((v.ate&&v.ate<res.S)||(v.de&&v.de>E))continue;if(fimVal&&v.de&&v.de>fimVal)continue;
    const vm=new Map((v.lessons||[]).map(l=>[l.id,l]));
    if(!v.de||v.de<res.S){for(const [lid] of geridas){const l=vm.get(lid);if(l)acerta(l)}continue} // começa antes de S: os tempos ficam, acertam-se as datas
    const F=res.fases.filter(F=>F.de<=v.de).pop();if(!F)continue;
    const travadas=new Set((v.cards||[]).filter(c=>c.locked&&geridas.has(c.lessonId)).map(c=>c.lessonId));
    const antigos=new Map();for(const c of v.cards||[])if(geridas.has(c.lessonId)&&!travadas.has(c.lessonId))antigos.set(c.lessonId+"|"+c.day+"|"+c.period+"|"+c.len,c);
    v.cards=(v.cards||[]).filter(c=>!geridas.has(c.lessonId)||travadas.has(c.lessonId));
    for(const [lid,lt] of geridas){if(travadas.has(lid))continue;let l=vm.get(lid);
      const its=F.itens.filter(it=>it.ed&&it.lid===lid);
      if(!l){if(!its.length||!lt.crRef)continue; // aula apagada à mão neste horário: não volta
        if(!lt.n){let mx=0;for(const w of L)for(const q of w.lessons||[])if((q.n|0)>mx)mx=q.n|0;lt.n=mx+1}
        l=cpCopia(lt);v.lessons.push(l);vm.set(lid,l)}
      const lens=its.map(it=>it.len),tl=lens.reduce((a,b)=>a+b,0);
      if(!tl){if(!l.ign){l.ign=true;l.crIgn=1}continue}
      if(l.ign)delete l.ign;if(l.crIgn)delete l.crIgn;
      l.tl=tl;l.duplos=lens.filter(x=>x===2).length;l.blocos=lens.filter(x=>x>=3).join(",");acerta(l);
      for(const it of its){const a0=antigos.get(lid+"|"+it.day+"|"+it.period+"|"+it.len),c={id:a0&&!a0._usado?a0.id:uid(),lessonId:lid,len:it.len,day:it.day,period:it.period,locked:false};
        if(a0)a0._usado=1;const r=it.r||(a0&&a0.r);if(Array.isArray(r)&&r.length===(l.linhas||[]).length)c.r=r.slice();v.cards.push(c)}}}
  for(const v of L)for(const c of v.cards||[])if(c._usado)delete c._usado;
  return L}

/* ---------- verificação: choques de formadores, salas e turmas em cada horário ---------- */
function cpChoques(ctx,L,de,ate){const {P,K}=ctx,out=[];
  for(const v of L){if((v.ate&&v.ate<de)||(v.de&&v.de>ate))continue;const lm=new Map((v.lessons||[]).map(l=>[l.id,l])),occ=new Map();
    for(const c of v.cards||[]){if(c.day==null||c.period==null)continue;const l=lm.get(c.lessonId);if(!l||l.ign)continue;const mk=crPerMask(l.per,K),len=+c.len||1;
      const rs=(l.classIds||[]).map(x=>"c|"+x).concat((l.linhas||[]).map((ln,i)=>ln.t?"t|"+ln.t:"").filter(Boolean)).concat((l.linhas||[]).map((ln,i)=>{const r=(Array.isArray(c.r)&&c.r[i])||cpSala(ctx,l,ln);return r?"r|"+r:""}).filter(Boolean));
      for(const r of new Set(rs))for(let q=0;q<len;q++){const key=r+"|"+(c.day*P+c.period+q),o=occ.get(key);if(o&&(o.mk&mk)){if(o.l!==l.id)out.push({v:v.id,nome:v.nome,r,d:c.day,p:c.period+q,a:o.l,b:l.id,k:r+"|"+c.day+"|"+(c.period+q)+"|"+[o.l,l.id].sort().join("~")})}else occ.set(key,{mk:(o?o.mk:0)|mk,l:l.id})}}}
  return out}
const cpChoquesNovos=(antes,depois)=>{const A=new Set(antes.map(x=>x.k)),vist=new Set();return depois.filter(x=>{if(A.has(x.k)||vist.has(x.k))return false;vist.add(x.k);return true})};

/* ---------- Cumprir o plano — a página ---------- */
// no telemóvel as tabelas viram cartões: cada número leva o título da sua coluna
function crRotulos(root){(root||document).querySelectorAll("table.crlab").forEach(t=>{const h=[...t.querySelectorAll(":scope>thead th")].map(th=>(th.childNodes[0]&&th.childNodes[0].textContent||th.textContent).trim());
  t.querySelectorAll(":scope>tbody>tr").forEach(tr=>{if(tr.cells.length!==h.length)return;[...tr.cells].forEach((td,i)=>{if(h[i])td.dataset.l=h[i]})})})}
var CP={t:null,de:"",ateModo:"",ate:"",alvo:null,fase:0,anular:null,k:"",cache:null};
try{DB.get("kv","crono_anular").then(v=>{if(v&&v.depois)CP.anular=v}).catch(()=>{})}catch(e){}
// 0.9.148: o «Anular» da última aplicação também fica na base de dados (peça «CRA»), porque já nada fica no computador
function cpAnularNuvem(){try{if(NUVOK()&&!nuvDesl())nuvemPut("CRA",{t:Date.now(),a:CP.anular||null},Date.now())}catch(e){}}
async function cpAnularTrazer(){if(RO||!nuvSB())return;try{const idx=(await (await nuvem("GET","")).json()).itens||{};if(!idx.CRA)return;const r=await nuvemGet("CRA");
  if(r&&r.a&&r.a.depois){if(!CP.anular||(r.a.em||0)>(CP.anular.em||0)){CP.anular=r.a;try{DB.put("kv","crono_anular",r.a)}catch(e){}}}else if(r&&!r.a&&CP.anular&&(r.t||0)>(CP.anular.em||0)){CP.anular=null}}catch(e){}}
const cpNomeFase=x=>"Crono360 · desde "+calDM(x,{day:"2-digit",month:"2-digit"});
const cpH=(v,f)=>crNum(crH1(v,f));
// tempos por semana de um conjunto de tempos (os de semanas A/B contam a parte do ciclo)
function cpSemanal(ctx,itens,k,x){const K=ctx.K,sem=x<ctx.M.mid?0:1;let m=0;for(let w=0;w<K;w++)m|=1<<crPerBit(w,sem,K);let t=0;
  for(const it of itens)if(it.ks.includes(k))t+=it.len*(it.mask===ctx.FULL?1:cpPop(it.mask&m)/K);return Math.round(t*10)/10}
function cpDataPadrao(a,asof){let s=cpProxSeg(asof);if(a.fim&&s>a.fim)s=calMais(asof,1);return s}
// as turmas do ano com plano curricular, pela gravidade (as que precisam primeiro)
function cpTurmasOrd(M){return [...M.turmas.values()].map(T=>{let def=0,n=0;for(const o of T.discs.values())if(o.P>0&&(o.saldo<-1e-6||o.est==="semhorario")){def+=Math.max(0,-o.saldo)||o.P-o.G;n++}return{T,def,n}})
  .sort((p,q)=>q.def-p.def||COLL_PTN.compare(String(p.T.t.cod),String(q.T.t.cod)))}
function cpOpt(tid){return{de:CP.de,ate:CP.ateModo==="d"&&CP.ate?CP.ate:"",alvo:tid===CP.t&&CP.alvo?new Map(Object.entries(CP.alvo)):null}}
// planear (e simular no próprio motor do Crono360) uma turma ou todas as que precisam
function cpCalcular(a,asof,tids){const ctx=cpCtx(a,asof);if(!ctx)return null;const lista=[];
  for(const tid of tids){const r=cpPlanear(ctx,tid,cpOpt(tid));if(r.erro){lista.push(r);continue}
    // os números escolhidos à mão incluem os tempos que não se mexem (aulas conjuntas, semanas A/B): o motor só recebe os que se mexem
    cpAplicarPlano(ctx,r,cpNomeFase);lista.push(r)}
  const antes=cpChoques(ctx,cpVersoes(ctx.M.st),CP.de,"9999-12-31");
  cpGravarVersoes(ctx.st,ctx.L);const Mn=crMotor(a,asof,ctx.st),novos=cpChoquesNovos(antes,cpChoques(ctx,ctx.L,CP.de,"9999-12-31"));
  const x=ESD.porAno[a.id];return{ctx,lista,Mn,choques:novos.length,choquesL:novos,igual:!!x&&JSON.stringify(ctx.st)===x.estado}}

function cpRender(){const sec=$("#crCump");if(!sec)return;const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),ed=crPodeEditar(),M=crMotor(a,asof);
  $("#cpAviso").innerHTML=crAvisoBase(a,M);
  const ord=cpTurmasOrd(M);if(CP.t&&!M.turmas.has(CP.t))CP.t=null;if(CP.t===null)CP.t=(ord.find(x=>x.n)||ord[0]||{T:{t:{id:""}}}).T.t.id;
  $("#cpT").innerHTML=`<option value="">Todas as turmas que precisam</option>`+ord.map(x=>`<option value="${x.T.t.id}"${x.T.t.id===CP.t?" selected":""}>${esc(calTurmaCurta(x.T.t))}${x.n?` — ${x.n} em risco`:" — em dia"}</option>`).join("");
  if(!CP.de||CP.de<=asof)CP.de=cpDataPadrao(a,asof);if(document.activeElement!==$("#cpDe"))$("#cpDe").value=CP.de;
  $("#cpAteModo").value=CP.ateModo;$("#cpAteL").style.display=CP.ateModo==="d"?"":"none";if(CP.ateModo==="d"&&!CP.ate)CP.ate=a.fim||"";if(document.activeElement!==$("#cpAte"))$("#cpAte").value=CP.ate;
  const o=cpOpc();document.querySelectorAll("[data-cpo]").forEach(i=>{const k=i.dataset.cpo;if(i.type==="checkbox")i.checked=!!o[k];else i.value=String(o[k]||0);i.disabled=!ed});
  ["#cpAplicar"].forEach(s=>{const b=$(s);if(b)b.style.display=ed?"":"none"});
  if(!M.st||!ord.length){["#cpTiles","#cpTab","#cpFases","#cpGrelha","#cpMud","#cpProb"].forEach(s=>$(s).innerHTML="");$("#cpCDisc").hidden=$("#cpCHor").hidden=true;$("#cpCApl").hidden=!CP.anular;cpHist();return}
  $("#cpCDisc").hidden=$("#cpCHor").hidden=$("#cpCApl").hidden=false;
  const tids=CP.t?[CP.t]:ord.filter(x=>x.n).map(x=>x.T.t.id);
  const key=[a.id,asof,CP.de,CP.ateModo,CP.ate,CP.t,JSON.stringify(CP.alvo),JSON.stringify(o),CR_CACHE.k,(CR_CACHE.est||{}).k,tids.join(",")].join("|");
  let C=CP.cache&&CP.cache.key===key?CP.cache.C:null;if(!C){C=cpCalcular(a,asof,tids);CP.cache={key,C}}
  if(!C){$("#cpTiles").innerHTML="";$("#cpTab").innerHTML=`<p class="hint">Falta o horário do Horários360.</p>`;return}
  if(CP.t)cpTurma(a,asof,M,C,ed);else cpLote(a,asof,M,C,ord,ed);cpHist()}

// uma turma
function cpTurma(a,asof,M,C,ed){const res=C.lista[0],f=M.fator,T=M.turmas.get(CP.t),Mn=C.Mn,Tn=Mn.turmas.get(CP.t);$("#cpCHor").hidden=false;
  if(!res||res.erro){$("#cpTiles").innerHTML="";$("#cpTab").innerHTML=`<div class="msg info">${esc(res?res.erro:"Sem dados.")}</div>`;["#cpFases","#cpGrelha","#cpMud","#cpProb"].forEach(s=>$(s).innerHTML="");$("#cpCHor").hidden=true;return}
  const ctx=C.ctx,L=[...T.discs.values()].filter(o=>o.P>0).sort(crOrdArea),F0=res.fases[0],nf=res.fases.length;
  {const b=$("#cpAplicar");if(b){b.textContent="Aplicar no Horários360";b.disabled=!!C.igual;b.title=C.igual?"Com o horário atual não há nada a mudar nesta turma":""}}
  const falta=[...res.need.values()].reduce((s,v)=>s+v,0),pior=L.filter(o=>o.saldo<-1e-6||o.est==="semhorario"),piorN=L.filter(o=>{const n=Tn&&Tn.discs.get(o.k);return n&&(n.saldo<-1e-6||n.est==="semhorario")});
  const defA=pior.reduce((s,o)=>s+Math.max(0,-o.saldo),0),defN=piorN.reduce((s,o)=>{const n=Tn.discs.get(o.k);return s+Math.max(0,-n.saldo)},0);
  const W=cpDiasSemana(ctx,CP.t,res.S,res.E),fm=res.fases.filter(F=>F.muda),mudS=fm.length?cpMudancas(ctx,res.base,fm[0].itens).length:0;
  if(res.falta>res.cap+1e-6)$("#cpAviso").innerHTML+=`<div class="msg bad">Faltam dar ${cpH(res.falta,f)} h e, até ${calDMA(res.E)}, a turma só tem ${res.dias} dias de aulas — no máximo ${res.cap} tempos com ${res.maxDia} por dia. Mesmo com o horário cheio não dá para acabar tudo: é preciso prolongar o fim das aulas da turma (Definições), marcar compensações ou aumentar o máximo de tempos por dia (Regras).</div>`;
  $("#cpTiles").innerHTML=[[cpH(falta,f)+" h","Faltam dar a partir de "+calDM(res.S),""],[String(W.sem),`Semanas de aulas até ${calDM(res.E)} (fim das aulas)`,""],
    [pior.length?String(pior.length):"✓",pior.length?`Não acabam com o horário atual (faltam ${cpH(defA,f)} h)`:"Com o horário atual tudo acaba",pior.length?"crtb":""],
    [piorN.length?String(piorN.length):"✓",piorN.length?`Ainda não acabam com o horário novo (faltam ${cpH(defN,f)} h)`:"Com o horário novo tudo acaba a tempo",piorN.length?"crtw":"cptok"],
    fm.length>1?[String(fm.length),"Mudanças de horário: "+fm.map(F=>calDM(F.de)).join(", "),""]:[String(mudS),fm.length?"Tempos por semana que mudam a partir de "+calDM(fm[0].de):"Sem mudanças nos tempos da turma",""]].map(([v,l,c])=>`<div class="tile ${c}"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
  // tabela das disciplinas
  const fixo=k=>cpSemanal(ctx,res.base.filter(it=>!it.ed),k,res.S),manual=!!CP.alvo;
  let h=`<div class="row" style="margin-bottom:10px;align-items:center">${ed?`<button class="b s" id="cpAuto"${manual?"":" disabled"}>Proposta automática</button><button class="b s" id="cpRepor" title="Os botões − e + partem dos tempos que a turma tem agora">Partir do horário atual</button>`:""}<span class="grow"></span><span class="hint" style="margin:0">${manual?"Tempos escolhidos à mão (−/+)":"Proposta automática — mude com − e + para escolher à mão"}</span></div>`;
  h+=`<table class="rt crdt cpt crlab"><thead><tr><th>Disciplina</th><th class="crn">Plano</th><th class="crn" title="Horas dadas até ${esc(calDM(asof))}">Dadas</th><th class="crn" title="O que falta dar a partir de ${esc(calDM(res.S))}">Faltam</th><th>Horário atual</th><th>Horário novo <span class="hint" style="margin:0;font-weight:400">tempos por semana</span></th><th>Estado</th></tr></thead><tbody>`;
  for(const o of L){const n=Tn&&Tn.discs.get(o.k),R=res.need.get(o.k)||0,wA=cpSemanal(ctx,res.base,o.k,res.S),wN=cpSemanal(ctx,F0.itens,o.k,res.S),fx=fixo(o.k);
    const fs=[...o.f.entries()].sort((x,y)=>y[1]-x[1]).map(([id])=>(cfg.profs.find(p=>p.id===id)||{}).nome).filter(Boolean);
    const out=[];res.fases.slice(1).forEach((F,i)=>{const w=cpSemanal(ctx,F.itens,o.k,F.de),w0=cpSemanal(ctx,res.fases[i].itens,o.k,res.fases[i].de);if(w!==w0)out.push(`desde ${calDM(F.de)}: ${crNum(w)}`)});
    const acabou=R<=1e-6,podeMenos=ed&&!acabou&&wN>fx,podeMais=ed&&!acabou;
    const fimTxt=(x,est,sal)=>est==="concluida"?"já acabou":x?"acaba "+calDM(x):sal<-1e-6||est==="semhorario"?`<span class="crneg">não acaba</span>`:"—";
    h+=`<tr${wN!==wA?` class="cpmud"`:""}><td><b>${esc(o.disc)}</b><div class="hint" style="margin:0">${esc(fs.slice(0,2).join(", ")||"—")}</div></td><td class="crn">${cpH(o.P,f)}</td><td class="crn">${cpH(o.G,f)}</td><td class="crn"><b>${cpH(R,f)}</b></td>
      <td><b>${crNum(wA)}</b> <span class="hint" style="margin:0">por semana</span><div class="hint" style="margin:0">${o.saldo<-1e-6?`<span class="crneg">faltam ${cpH(-o.saldo,f)} h</span> · `:""}${fimTxt(o.fimPrev,o.est,o.saldo)}</div></td>
      <td><span class="cpst${wN!==wA?" mud":""}"><button type="button" data-cpm="${esc(o.k)}" data-d="-1"${podeMenos?"":" disabled"} aria-label="Menos um tempo por semana de ${esc(o.disc)}">−</button><b>${crNum(wN)}</b><button type="button" data-cpm="${esc(o.k)}" data-d="1"${podeMais?"":" disabled"} aria-label="Mais um tempo por semana de ${esc(o.disc)}">+</button></span>
        ${wN!==wA?`<span class="hint" style="margin:0 0 0 6px">${wN>wA?"+":""}${crNum(Math.round((wN-wA)*10)/10)}</span>`:""}<div class="hint" style="margin:2px 0 0">${n?(n.saldo<-1e-6||n.est==="semhorario"?`<span class="crneg">faltam ${cpH(Math.max(0,-n.saldo)||n.P-n.G,f)} h</span> · `:"")+fimTxt(n.fimPrev,n.est,n.saldo):""}${out.length?"<br>"+esc(out.join(" · ")):""}</div></td>
      <td>${n?crTag(n.est):""}</td></tr>`}
  h+=`</tbody></table>`;
  $("#cpTab").innerHTML=h;crRotulos($("#cpTab"));
  // fases e grelha
  if(CP.fase>=nf)CP.fase=0;
  $("#cpFases").innerHTML=`<div class="cpfs" role="tablist"><button type="button" class="cpf${CP.fase===-1?" on":""}" data-cpf="-1" role="tab">Agora<small>até ${esc(calDM(calMais(res.S,-1)))}</small></button>`+res.fases.map((F,i)=>`<button type="button" class="cpf${CP.fase===i?" on":""}" data-cpf="${i}" role="tab">${nf>1?"Fase "+(i+1):"Horário novo"}<small>${esc(calDM(F.de))} → ${esc(F.ate>=res.E?"fim das aulas":calDM(F.ate))}</small></button>`).join("")+`</div>`;
  const fixos=res.base.filter(it=>!it.ed),ant=CP.fase<=0?res.base:fixos.concat(res.fases[CP.fase-1].itens.filter(it=>it.ed)),agora=CP.fase===-1?res.base:fixos.concat(res.fases[CP.fase].itens.filter(it=>it.ed));
  $("#cpGrelha").innerHTML=cpGrelha(ctx,CP.t,agora,CP.fase===-1?null:ant);
  $("#cpMud").innerHTML=cpTextoMud(ctx,res,f);
  cpProblemas(ctx,res,C,f)}

// tempos que mudam entre dois horários da turma (posições com outra disciplina)
function cpMudancas(ctx,A,B){const P=ctx.P,map=its=>{const m=new Map();for(const it of its)for(let q=0;q<it.len;q++)m.set(it.day*P+it.period+q,it.k);return m},a=map(A),b=map(B),out=[];
  for(const s of new Set([...a.keys(),...b.keys()]))if(a.get(s)!==b.get(s))out.push(s);return out}
function cpGrelha(ctx,tid,itens,ant){const st=ctx.st,P=ctx.P,D=st.days||[],per=st.periods||[],cid=ctx.cid.get(tid),cel=new Map(),antK=new Map();
  if(ant)for(const it of ant)for(let q=0;q<it.len;q++)antK.set(it.day*P+it.period+q,it);
  const nomeK=k=>{const T=ctx.M.turmas.get(tid),o=T&&T.discs.get(k);return o?o.disc:k};
  for(const it of itens){const l=it.l,lin=(l.linhas||[]).filter(x=>!x.cls||!x.cls.length||x.cls.includes(cid));
    for(let q=0;q<it.len;q++){const s=it.day*P+it.period+q,a0=antK.get(s),mud=ant&&(!a0||a0.k!==it.k),mov=ant&&!mud&&a0&&(a0.day!==it.day||a0.period!==it.period)&&false;
      const sj=ctx.sub.get((lin[0]||{}).s)||{},cor=sj.color||"#2f5fb8",prof=lin.map(x=>(ctx.tch.get(x.t)||{}).short||"").filter(Boolean).join("/");
      cel.set(s,`<div class="a${mud?" n":""}${!it.ed?" fx":""}" style="--c:${esc(cor)}" title="${esc((sj.name||nomeK(it.k))+(prof?" · "+prof:"")+(mud?a0?" — antes: "+nomeK(a0.k):" — tempo novo":"")+(!it.ed?" — não se mexe (aula conjunta, fixa ou de semanas A/B)":""))}">${mud?`<i class="nv">${a0?"mudou":"novo"}</i>`:""}<b>${esc(sj.short||sj.name||"—")}</b><span>${esc(prof)}</span>${mud&&a0?`<i class="era">era ${esc(((ctx.sub.get(((a0.l.linhas||[])[0]||{}).s)||{}).short)||nomeK(a0.k))}</i>`:""}</div>`)}}
  if(ant)for(const [s,a0] of antK)if(!cel.has(s))cel.set(s,`<div class="lv" title="Fica livre (era ${esc(nomeK(a0.k))})">livre<br><s>${esc(((ctx.sub.get(((a0.l.linhas||[])[0]||{}).s)||{}).short)||nomeK(a0.k))}</s></div>`);
  let h=`<div class="mzh cpg" style="grid-template-columns:64px repeat(${D.length},minmax(84px,1fr))"><div class="h"></div>${D.map(d=>`<div class="h">${esc(d)}</div>`).join("")}`;
  per.forEach((p,pi)=>{h+=`<div class="p">${esc(p.label||pi+1)}<div class="hint" style="margin:0;font-weight:400">${esc(p.start||"")}</div></div>`;D.forEach((d,di)=>{h+=`<div class="c">${cel.get(di*P+pi)||""}</div>`})});
  return h+`</div><div class="cal-leg" style="margin-top:8px"><span><b style="background:var(--brandbg);outline:2px solid var(--brand);outline-offset:-2px"></b>tempo novo ou que mudou de disciplina («novo», «mudou»)</span><span><b style="background:#fff;border:1.5px dashed var(--line2)"></b>fica livre</span><span><b style="background:#f1f3f6;border-left:3px solid #c3cad6"></b>não se mexe</span></div>`}
// o que muda, por palavras
function cpTextoMud(ctx,res,f){const nm=k=>{const T=ctx.M.turmas.get(res.tid),o=T&&T.discs.get(k);return o?o.disc:k},rot=(d,p,n)=>cpRotSlot(ctx,d,p,n);let h="";
  res.fases.forEach((F,i)=>{const ant=i?res.fases[i-1].itens:res.base,linhas=[];
    const ks=new Set([...ant,...F.itens].filter(it=>it.ed).map(it=>it.k));
    for(const k of ks){const w0=cpSemanal(ctx,ant,k,F.de),w1=cpSemanal(ctx,F.itens,k,F.de);if(w0===w1&&!F.mud.some(m=>m.k===k||m.de===k))continue;
      const R=F.R.get(k);let txt=`<b>${esc(nm(k))}</b>: ${crNum(w0)} → <b>${crNum(w1)}</b> tempos por semana`;
      const ev=F.mud.filter(m=>m.k===k).sort((a,b)=>a.d-b.d||a.p-b.p).map(m=>m.t==="ceder"?`${rot(m.d,m.p,m.len)} (era ${esc(nm(m.de))})`:m.t==="troca"?`${rot(m.d,m.p,m.len)} (${esc(nm(m.de))} passa para ${rot(m.d1,m.p1,m.len)})`:m.t==="tirar"?"":`${rot(m.d,m.p,m.len)}${m.t==="liberado"?" (ficou livre)":""}`).filter(Boolean);
      const sai=F.mud.filter(m=>m.t==="tirar"&&m.k===k).sort((a,b)=>a.d-b.d||a.p-b.p).map(m=>rot(m.d,m.p,m.len));
      if(R!=null&&R<=1e-6&&w1===0)txt+=` — já cumpriu o plano: sai do horário`;
      if(ev.length)txt+=` — entra: ${ev.join(", ")}`;if(sai.length)txt+=` — sai: ${sai.join(", ")}`;
      const cede=F.mud.filter(m=>m.de===k&&m.t==="ceder");if(cede.length&&w1<w0)txt+=` (cede ${crPl(cede.reduce((s,m)=>s+m.len,0),"tempo","tempos")} e continua a acabar a tempo)`;
      linhas.push(`<li>${txt}.</li>`)}
    const acab=[...(F.sim.fim||new Map())].filter(([k,x])=>x<=F.ate&&(F.R.get(k)||0)>0).sort((p,q)=>p[1].localeCompare(q[1]));
    if(acab.length)linhas.push(`<li class="hint" style="margin:0">Acabam o plano nesta fase: ${acab.map(([k,x])=>`${esc(nm(k))} a ${calDM(x)}`).join(", ")}.</li>`);
    h+=`<div class="cpfx"><b>${res.fases.length>1?`Fase ${i+1} — `:""}de ${calDMA(F.de)} ${F.ate>=res.E?"até ao fim das aulas":"a "+calDMA(F.ate)}</b>${linhas.length?`<ul>${linhas.join("")}</ul>`:`<p class="hint" style="margin:4px 0 0">Sem mudanças nos tempos da turma.</p>`}</div>`});
  if(res.Y<res.E)h+=`<div class="msg info">Depois de ${calDMA(res.Y)} volta o horário que estava. Faça um novo ponto de situação antes dessa data para ver o que ainda falta.</div>`;
  return h}
function cpProblemas(ctx,res,C,f){const nm=k=>{const T=ctx.M.turmas.get(res.tid),o=T&&T.discs.get(k);return o?o.disc:k},o=cpOpc(),out=[];
  for(const p of res.prob){const A=res.aulas.get(p.k),ts=A?cpTsDe(A).map(t=>(ctx.tch.get(t)||{}).name||"").filter(Boolean):[];const dicas=[];
    if(!o.livres)dicas.push("ligar «Pode acrescentar tempos nos tempos livres da turma»");if(!o.ceder)dicas.push("ligar «Pode tirar tempos às disciplinas que têm tempos a mais»");if(!o.trocas)dicas.push("ligar «Pode trocar aulas de lugar»");
    dicas.push("marcar aulas de compensação no Horários360","prolongar o fim das aulas da turma (Definições)");
    const mot=p.motivo==="semaula"?"Não há aula desta disciplina no horário nem formador no plano.":p.motivo==="cheia"?`A turma já não tem tempos livres (no máximo ${res.maxDia} por dia).`:p.motivo==="formador"?`${esc(ts.join(", ")||"O formador")} não está livre em nenhum dos tempos livres da turma.`:"Com as regras escolhidas não há mais onde pôr tempos.";
    out.push(`<li><b>${esc(nm(p.k))}</b>: ainda faltam <b>${cpH(p.falta,f)} h</b> no fim. ${mot} Pode ${dicas.join(", ")}.</li>`)}
  if(CP.t&&CP.alvo){const F=res.fases[0];for(const [k,w] of Object.entries(CP.alvo)){if(!((F.R.get(k)||0)>1e-6))continue;const fx=cpSemanal(ctx,res.base.filter(it=>!it.ed),k,res.S),wN=cpSemanal(ctx,F.itens.filter(it=>it.ed),k,res.S);if(wN<w-1e-6)out.push(`<li><b>${esc(nm(k))}</b>: pediu ${crNum(w+fx)} tempos por semana e só foi possível pôr ${crNum(wN+fx)}.</li>`)}}
  if(C.choques>0)out.push(`<li class="crneg">Atenção: o horário novo tem ${C.choques} sobreposição(ões) de formadores ou salas. Não aplique sem ver no Horários360.</li>`);
  $("#cpProb").innerHTML=out.length?`<div class="msg bad" style="margin:0 0 12px"><b>Por resolver</b><ul style="margin:6px 0 0 18px;padding:0">${out.join("")}</ul></div>`:`<div class="wg-okm" style="margin-bottom:12px">✓ Sem sobreposições de formadores, salas ou turmas.${res.prob.length?"":" Com o horário novo, todas as disciplinas desta turma acabam o plano a tempo."}</div>`}

// todas as turmas que precisam
function cpLote(a,asof,M,C,ord,ed){const f=M.fator,Mn=C.Mn;$("#cpCHor").hidden=true;["#cpFases","#cpGrelha","#cpMud"].forEach(s=>$(s).innerHTML="");
  const lin=C.lista.filter(r=>!r.erro),defA=ord.reduce((s,x)=>s+x.def,0);let defN=0,nOk=0;
  const rows=lin.map(r=>{const T=M.turmas.get(r.tid),Tn=Mn.turmas.get(r.tid);let dA=0,dN=0,nA=0,nN=0;
    for(const o of T.discs.values()){if(o.P<=0)continue;if(o.saldo<-1e-6||o.est==="semhorario"){dA+=Math.max(0,-o.saldo)||o.P-o.G;nA++}const n=Tn&&Tn.discs.get(o.k);if(n&&(n.saldo<-1e-6||n.est==="semhorario")){dN+=Math.max(0,-n.saldo)||n.P-n.G;nN++}}
    defN+=dN;if(!nN)nOk++;const mud=cpMudancas(C.ctx,r.base,r.fases[0].itens).length;
    return `<tr><td><b>${esc(T.t.cod)}</b> <span class="hint" style="margin:0">${esc(calTurmaCurta(T.t).replace(/^[^·]*·\s*/,""))}</span></td><td class="crn">${nA} <span class="hint" style="margin:0">(${cpH(dA,f)} h)</span></td><td class="crn">${nN?`<span class="crneg">${nN} (${cpH(dN,f)} h)</span>`:"✓ tudo acaba"}</td><td class="crn">${r.fases.length}</td><td class="crn">${mud}</td><td><button class="b s" data-cpver="${r.tid}">Ver a turma</button></td></tr>`});
  $("#cpTiles").innerHTML=[[String(lin.length),"Turmas com disciplinas que não acabam",lin.length?"crtb":""],[cpH(defA,f)+" h","Em falta com o horário atual",defA?"crtb":""],[lin.length?nOk+" de "+lin.length:"—","Turmas em que tudo acaba com o horário novo",nOk===lin.length?"cptok":"crtw"],[cpH(defN,f)+" h","Ainda em falta com o horário novo",defN>1e-6?"crtw":"cptok"]].map(([v,l,c])=>`<div class="tile ${c}"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
  $("#cpTab").innerHTML=lin.length?`<p class="hint">As turmas são tratadas da mais atrasada para a menos atrasada; os formadores partilhados nunca ficam em duas turmas ao mesmo tempo. Abra uma turma para ver o horário e escolher os tempos à mão.</p><table class="rt crt crlab"><thead><tr><th>Turma</th><th class="crn">Não acabam agora</th><th class="crn">Com o horário novo</th><th class="crn">Fases</th><th class="crn" title="Tempos por semana que mudam na 1.ª fase">Tempos que mudam</th><th></th></tr></thead><tbody>${rows.join("")}</tbody></table>`:`<div class="wg-okm">✓ Com o horário atual, todas as turmas cumprem o plano até ao fim das aulas.</div>`;
  crRotulos($("#cpTab"));
  const prob=[];for(const r of lin)for(const p of r.prob)prob.push(`${esc(M.turmas.get(r.tid).t.cod)} · ${esc(p.disc?p.disc.disc:p.k)}: faltam ${cpH(p.falta,f)} h`);
  $("#cpProb").innerHTML=(prob.length?`<div class="msg bad" style="margin:0 0 12px"><b>Por resolver com as regras escolhidas</b><ul style="margin:6px 0 0 18px;padding:0">${prob.slice(0,30).map(x=>`<li>${x}</li>`).join("")}</ul></div>`:"")+(C.choques>0?`<div class="msg bad">Atenção: ${C.choques} sobreposição(ões) de formadores ou salas.</div>`:lin.length?`<div class="wg-okm" style="margin-bottom:12px">✓ Sem sobreposições de formadores, salas ou turmas.</div>`:"");
  const b=$("#cpAplicar");if(b){b.textContent=lin.length>1?`Aplicar às ${lin.length} turmas no Horários360`:"Aplicar no Horários360";b.disabled=!lin.length||!!C.igual;b.title=lin.length?"":"Nenhuma turma precisa de mudanças"}}

// aplicar: grava no Horários360 (com cópia para anular)
async function cpAplicar(){if(!crPodeEditar())return;const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),M=crMotor(a,asof);
  const tids=CP.t?[CP.t]:cpTurmasOrd(M).filter(x=>x.n).map(x=>x.T.t.id);if(!tids.length){toast("Nada para aplicar");return}
  const C=cpCalcular(a,asof,tids);if(!C){toast("Falta o horário do Horários360");return}const ok=C.lista.filter(r=>!r.erro);if(!ok.length){toast(C.lista[0]&&C.lista[0].erro||"Nada para aplicar");return}
  const nf=new Set(ok.flatMap(r=>r.fases.filter(F=>F.muda).map(F=>F.de))),cods=ok.map(r=>M.turmas.get(r.tid).t.cod);
  const txt=`Aplicar o horário novo ${cods.length>1?"às turmas "+cods.join(", "):"da turma "+cods[0]} no Horários360, a partir de ${calDMA(CP.de)}${CP.ateModo==="d"&&CP.ate?" e até "+calDMA(CP.ate):""}?\n\n`+
    (nf.size?`· ${nf.size===1?"Fica um período do ano novo":"Ficam "+nf.size+" períodos do ano novos"} no Horários360 (${[...nf].sort().map(x=>calDM(x)).join(", ")}): até à véspera fica tudo como estava.\n`:"· Só mudam as datas em que as aulas acabam (o horário fica igual).\n")+
    `· As outras turmas não mudam e nada é apagado.\n`+(C.choques>0?`· ATENÇÃO: ${C.choques} sobreposição(ões) de formadores ou salas.\n`:"")+`· Pode anular em «Anular a última aplicação».`;
  if(!confirm(txt))return;
  const x=ESD.porAno[a.id];if(!x||!x.estado){toast("Falta o horário do Horários360");return}
  const antes=x.estado,depois=JSON.stringify(C.ctx.st);x.estado=depois;x.quando=Date.now();esdGuardar();
  const resumo=ok.map(r=>{const T=M.turmas.get(r.tid),ks=new Set();for(const F of r.fases)for(const it of F.itens)if(it.ed)ks.add(it.k);
    const m=[...ks].map(k=>{const ws=[cpSemanal(C.ctx,r.base,k,r.S)];for(const F of r.fases){const w=cpSemanal(C.ctx,F.itens,k,F.de);if(w!==ws[ws.length-1])ws.push(w)}return ws.length>1?`${(T.discs.get(k)||{}).disc||k} ${ws.map(crNum).join("→")}`:""}).filter(Boolean);
    return `${T.t.cod}${r.fases.length>1?` (${r.fases.length} fases)`:""}${m.length?": "+m.join(", "):""}`}).join(" · ");
  CP.anular={anoId:a.id,antes,depois,em:Date.now(),por:String(EU&&EU.email||""),resumo,id:uid()};try{DB.put("kv","crono_anular",CP.anular)}catch(e){}cpAnularNuvem();
  let avisos=[];try{avisos=cpAvisos(C,M)}catch(e){console.warn(e)}
  CR.apl=CR.apl||[];CR.apl.unshift({id:CP.anular.id,anoId:a.id,em:CP.anular.em,por:CP.anular.por,de:CP.de,ate:CP.ateModo==="d"?CP.ate:"",turmas:cods,resumo,fases:[...nf].sort(),avisos});CR.apl=CR.apl.slice(0,60);crGuardar();
  CR_CACHE.k="";CP.cache=null;CP.alvo=null;cpRecarregarHorario();
  cpRender();escLinhaMsg("#cpMsg",`✓ Aplicado no Horários360: ${esc(resumo||cods.join(", "))}. <a href="#" data-cpabrir="1">Abrir no Horários360</a>`,"ok");toast("Horário novo aplicado")}
// o que muda para cada formador (para o avisar por email): tempos que entram e saem em cada fase, e quando acaba o plano da disciplina
function cpAvisos(C,M){const porP=new Map();
  for(const r of C.lista){if(!r||r.erro)continue;const T=M.turmas.get(r.tid),ctx=C.ctx,rot=(d,p,n)=>cpRotSlot(ctx,d,p,n),nm=k=>(T.discs.get(k)||{}).disc||k,ch=it=>it.day+"."+it.period+"."+it.len;
    const tsDe=its=>[...new Set(its.flatMap(it=>(it.l.linhas||[]).map(ln=>ln.t).filter(Boolean)))],add=(t,txt)=>{const pid=ctx.t2p.get(t);if(!pid)return;if(!porP.has(pid))porP.set(pid,[]);porP.get(pid).push(txt)};
    let ant=r.base;
    for(const F of r.fases){const ks=new Set([...ant,...F.itens].filter(it=>it.ed).map(it=>it.k));
      for(const k of ks){const a0=ant.filter(it=>it.ed&&it.k===k),b0=F.itens.filter(it=>it.ed&&it.k===k),sa=new Set(a0.map(ch)),sb=new Set(b0.map(ch));
        const entra=b0.filter(it=>!sa.has(ch(it))),sai=a0.filter(it=>!sb.has(ch(it)));if(!entra.length&&!sai.length)continue;
        const w0=cpSemanal(ctx,ant,k,F.de),w1=cpSemanal(ctx,F.itens,k,F.de);
        let txt=`Turma ${T.t.cod} — ${nm(k)}, a partir de ${calDMA(F.de)}: `+(w1===0?"sai do horário (o plano está cumprido).":w0!==w1?`passa de ${crNum(w0)} para ${crNum(w1)} tempos por semana.`:"os tempos mudam de lugar.");
        if(entra.length&&w1)txt+=`\nEntram: ${cpListaSlots(ctx,entra)}.`;if(sai.length&&w1)txt+=`\nSaem: ${cpListaSlots(ctx,sai)}.`;
        for(const t of tsDe(a0.concat(b0)))add(t,{m:1,t:txt})}
      ant=F.itens}
    for(const [k,x] of r.fimK||new Map()){if(x>=r.E)continue;const its=r.base.concat(...r.fases.map(F=>F.itens)).filter(it=>it.ks.includes(k)&&it.ed);for(const t of tsDe(its))add(t,{m:0,t:`Turma ${T.t.cod} — ${nm(k)}: com este horário, o plano fica cumprido a ${calDMA(x)} (a última aula é nesse dia).`})}}
  return [...porP].map(([pid,L])=>{const p=cfg.profs.find(q=>q.id===pid)||{},vis=new Set(),linhas=L.filter(x=>!vis.has(x.t)&&vis.add(x.t)).sort((a,b)=>b.m-a.m);return{pid,nome:p.nome||"",email:String(p.email||"").trim(),muda:linhas.some(x=>x.m),linhas:linhas.map(x=>x.t)}}).sort((p,q)=>(q.muda-p.muda)||COLL_PT.compare(p.nome,q.nome))}
async function cpAvisar(id){const r=(CR.apl||[]).find(x=>x.id===id);if(!r||!r.avisos||!crPodeEditar())return;
  const ok=x=>/\S+@\S+\.\S+/.test(x.email||""),L=r.avisos.filter(ok),sem=r.avisos.filter(x=>!ok(x));if(!L.length){toast("Nenhum destes formadores tem email (Escola › Formadores)");return}
  if(!confirm(`Enviar a ${L.length} formador(es) o que muda no horário de cada um, a partir da sua conta do Office 365?${sem.length?`\n\nSem email: ${sem.map(x=>x.nome).join(", ")}.`:""}`))return;
  ovAbrir("A avisar os formadores");let n=0;const falhas=[],d0=(r.fases&&r.fases[0])||r.de;
  for(const x of L){await ovPasso(4+92*n/L.length,x.nome);
    try{await msEnviar({to:x.email,cc:"",subject:x.muda!==false?`Horário: mudanças a partir de ${calDM(d0,{day:"numeric",month:"long"})}`:"Plano curricular: quando fica cumprido",body:`Olá ${String(x.nome||"").split(/\s+/)[0]},\n\n${x.muda!==false?"Para cumprir os planos curriculares até ao fim das aulas, a Direção Pedagógica ajustou o horário:":"Com o horário em vigor, fica prevista a data em que o plano da sua disciplina é cumprido:"}\n\n${x.linhas.map(l=>"• "+l.replace(/\n/g,"\n   ")).join("\n\n")}\n\nO horário atualizado está na EPISJ 360 (Horários360 › O meu horário).\n\nA Direção Pedagógica`});n++}
    catch(e){falhas.push(x.nome+": "+(e.message||e))}}
  await ovPasso(100,"Enviado");ovFechar(400);if(n){r.avisado=Date.now();crGuardar()}cpHist();
  escLinhaMsg("#cpMsg",`${n} formador(es) avisado(s) por email.${falhas.length?"<br>Falhou: "+esc(falhas.join("; ")):""}`,falhas.length?"bad":"ok")}
function cpMesmoEstado(ta,tb){if(ta===tb)return true;try{const A=JSON.parse(ta),B=JSON.parse(tb),byId=(p,q)=>String(p.id).localeCompare(String(q.id));
    const vs=st=>JSON.stringify(cpVersoes(st).map(v=>({de:v.de||"",ate:v.ate||"",nome:v.nome||"",l:(v.lessons||[]).map(l=>{const o=Object.assign({},l);delete o.n;return o}).sort(byId),
      c:(v.cards||[]).map(c=>[c.id,c.lessonId,c.day,c.period,c.len,!!c.locked,Array.isArray(c.r)?c.r:null]).sort((p,q)=>String(p[0]).localeCompare(String(q[0])))})).sort((p,q)=>p.de.localeCompare(q.de)));
    if(vs(A)!==vs(B))return false;const vazio=v=>v==null||(Array.isArray(v)&&!v.length)||(typeof v==="object"&&!Array.isArray(v)&&!Object.keys(v).length);
    // além dos horários, o que se muda à mão no Horários360 (formadores, turmas, disciplinas e salas voltam a vir da EPISJ 360 sempre que se abre)
    for(const k of["plano","cover","vig","coverM","exames","eventos","pontuais","off","gsem","reunioes"]){if(vazio(A[k])&&vazio(B[k]))continue;if(JSON.stringify(A[k])!==JSON.stringify(B[k]))return false}
    return true}catch(e){return false}}
function cpRecarregarHorario(){try{const fr=$("#esFr");if(curTab==="esch")esAbrir();else{if(fr&&(fr.getAttribute("src")||fr.getAttribute("srcdoc"))){fr.removeAttribute("srcdoc");fr.src="about:blank"}ES_SIG=""}}catch(e){}}
function cpAnular(){const u=CP.anular;if(!u||!crPodeEditar())return;const x=ESD.porAno[u.anoId];
  if(!x||!cpMesmoEstado(u.depois,x.estado)){alert("Depois desta aplicação o Horários360 já teve outras mudanças, por isso não se pode anular automaticamente sem as perder.\n\nPode desfazer à mão no Horários360 (Planificação anual › Períodos do ano) ou repor uma das cópias diárias do Horários360.");return}
  if(!confirm(`Anular a aplicação de ${new Date(u.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}?\n\n${u.resumo||""}\n\nO Horários360 volta a ficar exatamente como estava antes.`))return;
  x.estado=u.antes;x.quando=Date.now();esdGuardar();const r=(CR.apl||[]).find(q=>q.id===u.id);if(r){r.anulada=Date.now();crGuardar()}
  CP.anular=null;try{DB.put("kv","crono_anular",null)}catch(e){}cpAnularNuvem();CR_CACHE.k="";CP.cache=null;cpRecarregarHorario();cpRender();escLinhaMsg("#cpMsg","Aplicação anulada: o Horários360 voltou a ficar como estava.","ok")}
function cpHist(){const a=crAnoSel(),L=(CR.apl||[]).filter(x=>x.anoId===a.id).slice(0,8),u=CP.anular,b=$("#cpAnular");
  if(b){const pode=!!u&&u.anoId===a.id&&ESD.porAno[a.id]&&cpMesmoEstado(u.depois,ESD.porAno[a.id].estado);b.style.display=crPodeEditar()&&u&&u.anoId===a.id?"":"none";b.disabled=!pode;b.title=pode?"Repõe o Horários360 como estava antes da última aplicação":"O Horários360 já mudou depois da última aplicação"}
  const ult=L.find(x=>!x.anulada);
  const av=ult&&ult.avisos&&ult.avisos.length&&crPodeEditar()?`<div class="cpav"><div class="row" style="align-items:center;margin:12px 0 6px"><b style="font-size:14px">Avisar os formadores</b><span class="grow"></span>${ult.avisado?`<span class="hint" style="margin:0">Avisados a ${new Date(ult.avisado).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}</span>`:""}<button class="b s" type="button" data-cpavisar="${esc(ult.id)}">${ult.avisado?"Avisar outra vez":"Avisar por email"} (${ult.avisos.length})</button></div>
    <details><summary class="hint" style="cursor:pointer;margin:0">Ver o que vai para cada formador</summary>${ult.avisos.map(x=>`<div class="cpavf"><b>${esc(x.nome||"?")}</b> <span class="hint" style="margin:0">${esc(x.email||"sem email")}${x.muda===false?" · só a data em que o plano fica cumprido":""}</span><ul>${x.linhas.map(l=>`<li>${esc(l).replace(/\n\s*/g,"<br>")}</li>`).join("")}</ul></div>`).join("")}</details></div>`:"";
  $("#cpHistApl").innerHTML=av+(L.length?`<p class="hint" style="margin:12px 0 4px">Últimas aplicações</p><ul class="cphl">${L.map(x=>`<li><b>${new Date(x.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}</b> · ${esc(x.resumo||x.turmas.join(", "))} · ${x.fases&&x.fases.length?"horário novo a "+x.fases.map(d=>calDM(d)).join(", "):"desde "+calDM(x.de)}${x.ate?" até "+calDM(x.ate):""}${x.anulada?` <span class="tag pend">anulada</span>`:""}${x.avisado?` <span class="tag ok">formadores avisados</span>`:""} <span class="hint" style="margin:0">${esc(x.por||"")}</span></li>`).join("")}</ul>`:"")}

/* ---------- eventos ---------- */
$("#cpT").addEventListener("change",e=>{CP.t=e.target.value;CP.alvo=null;CP.fase=0;$("#cpMsg").innerHTML="";cpRender()});
document.querySelectorAll("#cpDe,#cpAteModo,#cpAte,[data-cpo]").forEach(x=>x.addEventListener("change",()=>{$("#cpMsg").innerHTML=""}));
$("#cpDe").addEventListener("change",e=>{const v=e.target.value,asof=CR_SEL.asof||calHoje();if(!v)return;if(v<=asof){toast("O horário novo começa depois da data da situação");e.target.value=CP.de;return}CP.de=v;CP.alvo=null;CP.fase=0;cpRender()});
$("#cpAteModo").addEventListener("change",e=>{CP.ateModo=e.target.value;cpRender()});
$("#cpAte").addEventListener("change",e=>{if(e.target.value&&e.target.value<CP.de){toast("A data tem de ser depois do início do horário novo");e.target.value=CP.ate;return}CP.ate=e.target.value;cpRender()});
document.querySelectorAll("[data-cpo]").forEach(i=>i.addEventListener("change",()=>{if(!crPodeEditar())return;const o=cpOpc(),k=i.dataset.cpo;o[k]=i.type==="checkbox"?i.checked:Math.max(0,parseInt(i.value)||0);save();CP.cache=null;cpRender()}));
$("#crCump").addEventListener("click",e=>{const m=e.target.closest("[data-cpm]");
  if(m){if(!crPodeEditar())return;const a=crAnoSel(),asof=CR_SEL.asof||calHoje(),C=CP.cache&&CP.cache.C,res=C&&C.lista[0];if(!res||res.erro)return;
    const ctx=C.ctx,F0=res.fases[0],alvo={};for(const o of ctx.M.turmas.get(CP.t).discs.values()){if(o.P<=0)continue;alvo[o.k]=cpSemanal(ctx,F0.itens.filter(it=>it.ed),o.k,res.S)}
    if(CP.alvo)Object.assign(alvo,CP.alvo);const k=m.dataset.cpm;alvo[k]=Math.max(0,(alvo[k]||0)+(+m.dataset.d));CP.alvo=alvo;$("#cpMsg").innerHTML="";cpRender();return}
  const fb=e.target.closest("[data-cpf]");if(fb){CP.fase=+fb.dataset.cpf;cpRender();return}
  const v=e.target.closest("[data-cpver]");if(v){CP.t=v.dataset.cpver;CP.alvo=null;CP.fase=0;cpRender();$("#crCump").scrollIntoView({behavior:"smooth",block:"start"});return}
  if(e.target.closest("#cpAuto")){CP.alvo=null;cpRender();return}
  if(e.target.closest("#cpRepor")){const C=CP.cache&&CP.cache.C,res=C&&C.lista[0];if(!res||res.erro)return;const alvo={};for(const o of C.ctx.M.turmas.get(CP.t).discs.values())if(o.P>0)alvo[o.k]=cpSemanal(C.ctx,res.base.filter(it=>it.ed),o.k,res.S);CP.alvo=alvo;cpRender();return}
  if(e.target.closest("[data-cpabrir]")||e.target.closest("#cpAbrirH")){e.preventDefault();cpAbrirHorario();return}
  const av=e.target.closest("[data-cpavisar]");if(av){cpAvisar(av.dataset.cpavisar).catch(err=>{ovFechar();toast(err.message||String(err))});return}});
$("#cpAplicar").onclick=()=>cpAplicar().catch(err=>{console.warn(err);toast("Não foi possível aplicar: "+(err.message||err))});
$("#cpAnular").onclick=cpAnular;
// 0.9.67: se a app abriu já num separador do Crono360, desenha-o agora que o módulo está pronto
if(curTab&&curTab.startsWith("cr"))setTimeout(()=>{try{crRender(curTab)}catch(e){console.warn(e)}},0);
// abre o Horários360 já no período do horário novo (o período ativo passa a ser o que está em vigor a partir da data escolhida)
function cpAbrirHorario(){const a=crAnoSel(),x=ESD.porAno[a.id];if(x&&x.estado&&crPodeEditar())try{const st=JSON.parse(x.estado),L=cpVersoes(st),v=cpVersaoEm(L,CP.de||calHoje());
    if(v&&!v._ativo&&!v._unico){L.forEach(q=>delete q._ativo);v._ativo=true;cpGravarVersoes(st,L);x.estado=JSON.stringify(st);x.quando=Date.now();esdGuardar();ES_SIG=""}}catch(e){console.warn(e)}
  try{if(!h3EschOk()){H3_IMP=true;aplicarPerfil()}}catch(e){} // 0.9.136: na versão simples do Horários360 o editor abre na mesma para isto
  mostrarModulo("eduschedule",false);show("esch")}

/* ---------- widgets do Painel ---------- */
WG_MOD.crono={l:"C",c:"#2fd0c4",n:"Crono360"};
WIDGETS.push({id:"crcump",mod:"crono",nome:"Cumprimento dos planos",desc:"Quanto do plano curricular já foi dado e as turmas e disciplinas em risco de não cumprir com o horário atual",r(){
  const a=anoAtivo(),M=crMotor(a),me=crMeuId(),f=M.fator,res=[...M.turmas.values()].map(T=>({T,r:crTurmaRes(T,me)})).filter(x=>x.r.L.length);
  if(!res.length)return wgVazio(pcPlanos().some(p=>p.anoId===a.id)?"Sem horário no Horários360 ainda.":"Ainda sem planos curriculares.")+wgIr("crPs","Abrir o Crono360");
  const P=res.reduce((s,x)=>s+x.r.P,0),G=res.reduce((s,x)=>s+x.r.G,0),risco=res.flatMap(x=>x.r.L.filter(o=>o.est==="risco"||o.est==="semhorario").map(o=>({o,t:x.T.t}))).sort((p,q)=>p.o.saldo-q.o.saldo);
  return `<div class="wg-big">${P?Math.round(G/P*100):0}%</div>${wgBarra(P?G/P*100:0,"#0f8b8d")}<p class="wg-t">${crNum(crH1(G,f))} de ${crNum(crH1(P,f))} h do plano já dadas${me?" (as suas disciplinas)":""}.</p>`+
    (risco.length?`<p class="wg-k2">Em risco</p><div class="wg-lst">${risco.slice(0,4).map(x=>`<div class="wg-li"><i class="wg-dot" style="background:#dc2626"></i><span class="wg-el"><b>${esc(x.t.cod)}</b> · ${esc(x.o.disc)}<br><span class="wg-sub">${x.o.est==="semhorario"?"sem aulas no horário":"faltam "+crNum(crH1(-x.o.saldo,f))+" h no fim do ano"}</span></span></div>`).join("")}</div>`:`<div class="wg-okm">✓ Nenhuma disciplina em risco.</div>`)+(risco.length&&!me&&crPodeEditar()?wgIr("crCump",crManual()?"Ajustar":"Cumprir o plano"):"")+wgIr("crPs","Ponto de situação")}});
WIDGETS.push({id:"crmods",mod:"crono",nome:"Módulos desta semana",desc:"Os módulos/UFCD que começam ou acabam esta semana, pelo cronograma",r(){
  const a=anoAtivo(),M=crMotor(a),me=crMeuId(),hj=calHoje(),s0=crSeg(hj),s1=calMais(s0,6),L=[];
  for(const T of M.turmas.values())for(const o of T.discs.values()){if(!crDoFormador(o,me))continue;for(const m of o.mods){if(m.ini>=s0&&m.ini<=s1)L.push({t:T.t,o,m,k:"começa",d:m.ini});if(m.fim>=s0&&m.fim<=s1)L.push({t:T.t,o,m,k:"acaba",d:m.fim})}}
  L.sort((p,q)=>p.d.localeCompare(q.d));if(!L.length)return wgVazio("Nenhum módulo começa ou acaba esta semana.")+wgIr("crCron","Ver os cronogramas");
  return `<div class="wg-lst">${L.slice(0,7).map(x=>`<div class="wg-li"><i class="wg-dot" style="background:${x.k==="começa"?"#2563eb":"#16a34a"}"></i><span class="wg-el"><b>${esc(x.t.cod)}</b> · ${esc(x.o.disc)}<br><span class="wg-sub">${esc(x.m.mod)} ${x.k} ${esc(calDM(x.d,{weekday:"short",day:"numeric"}))}</span></span></div>`).join("")}</div>`+wgIr("crCron","Ver os cronogramas")}});

try{if(!localStorage.getItem("guide_wg_crono")){localStorage.setItem("guide_wg_crono","1");if(!WG_SEL.includes("crcump")&&!WG_SEL2.includes("crcump")){WG_SEL2.unshift("crcump");localStorage.setItem(WG_KEY+"2",JSON.stringify(WG_SEL2))}}}catch(e){}

