/* ---------- índice de pastas e ficheiros: o relatório deixa de percorrer tudo de cada vez ---------- */
function buildIndex(fs,fo){
  const comp=new Map(); // nome de pasta (normalizado) -> {raw, files:[], folders:[]}
  const ent=(c,raw)=>{let e=comp.get(c);if(!e){e={raw,files:[],folders:[]};comp.set(c,e)}return e};
  const nc=new Map(),nrm=s=>{let v=nc.get(s);if(v===undefined){v=norm(s);nc.set(s,v)}return v};
  const seen=new Set(),recs=[];
  const addDir=p=>{ // regista a pasta e as pastas acima dela
    if(!p||seen.has(p))return;const parts=p.split("/").map(x=>x.trim()).filter(Boolean);
    for(let i=parts.length;i>=1;i--){const q=parts.slice(0,i).join("/");if(seen.has(q))break;seen.add(q);
      const r=parts.slice(0,i),n=r.map(nrm),rec={r,n};recs.push(rec);
      for(let k=0;k<n.length;k++){if(n.indexOf(n[k])!==k)continue;ent(n[k],r[k]).folders.push(rec)}}
    seen.add(p)};
  for(const p of fo)addDir(p);
  for(const f of fs){addDir(f.rawDir);const c=f.comps;for(let k=0;k<c.length;k++){if(c.indexOf(c[k])!==k)continue;ent(c[k],c[k]).files.push(f)}}
  // um segmento escrito pelo utilizador ("008", "modulo a07") corresponde às pastas com esse nome ou que começam por ele
  const segCache=new Map();
  const matching=s=>{let r=segCache.get(s);if(!r){r=[];const e0=comp.get(s);if(e0)r.push(e0);
      for(const [c,e] of comp)if(c!==s&&segMatch(c,s))r.push(e);segCache.set(s,r)}return r};
  const pick=(ss,kind)=>{if(!ss.length)return[];let best=null,bn=Infinity;
    for(const s of ss){const m=matching(s);let n=0;for(const e of m)n+=e[kind].length;if(n<bn){bn=n;best=m}}
    if(!bn)return[];const key=kind==="files"?"comps":"n",out=[];
    if(best.length===1){for(const x of best[0][kind])if(allIn(x[key],ss))out.push(x)}
    else{const sn=new Set();for(const e of best)for(const x of e[kind]){if(sn.has(x))continue;sn.add(x);if(allIn(x[key],ss))out.push(x)}}
    return out};
  const realName=s=>{const m=matching(s);return m.length?m[0].raw:s};
  // anos letivos presentes na listagem (pastas com "2025.2026" no nome); fica a pasta com mais subpastas
  const anos=new Map(),cnt=new Map();
  for(const e of comp.values()){if(!e.folders.length)continue;const a=anoDe(e.raw);if(a&&(cnt.get(a)||0)<e.folders.length){anos.set(a,e.raw);cnt.set(a,e.folders.length)}}
  // 0.9.86: quando a pasta de um módulo não aparece pelo nome exato, procura-a pelo código (só nos casos em falta)
  let byMod=null;const flexC=new Map();
  const flex=ss=>{const key=ss.join("/");if(flexC.has(key))return flexC.get(key);let res=null;
    const last=ss[ss.length-1];
    if(last&&isModLike(last)){
      if(!byMod){byMod=new Map();for(const r of recs){const c=r.n[r.n.length-1];if(!isModLike(c))continue;const k=modKey(c);let a=byMod.get(k);if(!a)byMod.set(k,a=[]);a.push(r)}}
      const rest=ss.slice(0,-1),ok=(byMod.get(modKey(last))||[]).filter(r=>rest.every(s=>r.n.some(c=>flexEq(c,s))));
      if(ok.length){const r0=ok[0];res={ss:ss.map(s=>r0.n.find(c=>flexEq(c,s))||s),nome:r0.r[r0.r.length-1]}}}
    flexC.set(key,res);return res};
  const tem=s=>matching(s).some(e=>e.folders.length);
  return{comp,recs,pick,realName,anos,flex,tem,nFiles:fs.length};
}
function getIdx(){return IDX||(IDX=buildIndex(files,folders))}

/* ---------- verificações de qualidade: documentos vazios, falsos, trocados ou copiados ---------- */
let CT={};try{CT=JSON.parse(localStorage.getItem("boxcheck_texto")||"{}")}catch(e){} // contagens antigas (versões 0.2–0.9)
const QC=()=>cfg.qual||{};
const minPal=()=>Math.max(1,+QC().min||40);
const qOn=k=>k==="antigo"?QC()[k]===true:QC()[k]!==false; // tudo ligado por omissão, exceto a data de edição (dá muitos avisos em recursos reutilizados)
const palavras=sha1=>{const t=sha1&&TX.get(sha1);if(t)return t.w;const c=sha1&&CT[sha1];return c&&c.w!=null?c.w:null};
let TPL=lsJ("boxcheck_modelos",null)||{itens:[]}; // modelos oficiais da escola: {id, pasta, quando, itens:[{nome, sha1}]}
let REF=null;                                      // ano de referência (anterior): {rootId, pasta, shas: Map(sha1 -> caminho)}
async function carregarRef(){const id=QC().refRoot;REF=null;
  if(id){const j=await lerListagem(id);if(j){const shas=new Map();for(const x of j.itens)if(x.type!=="folder"&&x.sha1&&x.size!==0&&!shas.has(x.sha1))shas.set(x.sha1,x.path+"/"+x.name);REF={rootId:id,pasta:j.pasta,shas}}}
  refRev++}
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
// como um módulo/UFCD costuma aparecer escrito no nome ou no texto de um documento
function modRegex(cod){
  const k=modKey(cod);let m;
  if((m=k.match(/^uc(\d+)$/)))return new RegExp("(?:^|[^a-z0-9])uc\\s*0*"+m[1]+"(?!\\d)");
  if(/^\d{4,}$/.test(k))return /^(19|20)\d\d$/.test(k)?new RegExp("ufcd\\s*(?:n\\.?\\s*[oº°]?\\.?\\s*)?0*"+k+"(?!\\d)"):new RegExp("(?:^|[^0-9])0*"+k+"(?!\\d)");
  if((m=k.match(/^([a-z]{0,2})0*(\d{1,3})$/))){
    const alt=["(?:modulos?|mod|ufcd|\\bm)\\.?\\s*(?:n\\.?\\s*[oº°]?\\.?\\s*)?"+m[1]+"\\s*0*"+m[2]+"(?!\\d)"];
    if(m[1]&&k.length>=3)alt.push("(?:^|[^a-z0-9])"+escRe(k)+"(?![a-z0-9])");
    return new RegExp(alt.join("|"))}
  return k.length>=4?new RegExp(escRe(k)):null;
}
let MENT=new Map(),MENTK=null;
function mencoes(f,t,dc,sibs){ // módulos da mesma disciplina referidos no nome ou no texto do ficheiro
  const key=f.sha1+"|"+f.nname+"|"+dc;let s=MENT.get(key);if(s)return s;
  s=new Set();const hay=f.nname+" \n "+t.n;
  for(const [mk,x] of sibs)if((x.re&&x.re.test(hay))||(x.des.length>=8&&hay.includes(x.des)))s.add(mk);
  MENT.set(key,s);return s}
function qualCtx(idx,slotOf,mods){
  const bySha=new Map(),lsh=new Map(),near=qOn("quase");
  const addL=(t,e)=>{for(const k of bandKeys(t)){let a=lsh.get(k);if(!a)lsh.set(k,a=[]);a.push(e)}};
  for(const [f,slot] of slotOf){
    if(f.sha1&&f.size!==0){let a=bySha.get(f.sha1);if(!a)bySha.set(f.sha1,a=[]);a.push({f,slot})}
    if(near){const t=f.sha1&&TX.get(f.sha1);if(t&&t.w>=60)addL(t,{f,slot,sha1:f.sha1,sg:slot.sg,sig:t.sig})}}
  const ref=REF&&!(lastListing&&lastListing.rootId===REF.rootId)?REF:null;
  if(near&&ref){const nome=ref.pasta.split("/").pop();for(const [sha,path] of ref.shas){const t=TX.get(sha);if(t&&t.w>=60)addL(t,{f:null,slot:null,sha1:sha,sg:"§ref",sig:t.sig,label:`“${nome}”: ${path.split("/").slice(-2).join("/")}`})}}
  const sib=new Map(); // disciplina -> Map(módulo -> {cod, re, des})
  for(const m of mods){const dc=discCode(m.disc),mk=modKey(m.cod);let s=sib.get(dc);if(!s)sib.set(dc,s=new Map());if(!s.has(mk))s.set(mk,{cod:m.cod,re:modRegex(m.cod),des:norm(desigOf(m))})}
  const tpls=[],tplSha=new Map();
  // 0.9.113: a comparação com os modelos oficiais foi retirada (tpls fica vazio)
  if(false)for(const i of TPL.itens||[]){tplSha.set(i.sha1,i.nome);const t=TX.get(i.sha1);if(t&&t.w>=30)tpls.push({nome:i.nome,t})}
  let inicio="";if(qOn("antigo")){inicio=QC().inicio||"";if(!/^\d{4}-\d\d-\d\d$/.test(inicio)){inicio="";if(idx.anos.size===1)inicio=[...idx.anos.keys()][0].slice(0,4)+"-07-01"}}
  return{bySha,lsh,sib,tpls,tplSha,ref,inicio};
}
// devolve null (nada a apontar), {lvl:"bad"} (não conta como entregue) ou {lvl:"warn"} (conta, mas fica "a confirmar")
// falsos positivos: o diretor confirma que um ficheiro assinalado é válido (fica ligado a esta versão do ficheiro)
const fpKey=f=>(f.fid||f.name)+"|"+(f.sha1||"");
function marcarFP(keys,on,txt){cfg.fp=cfg.fp||{};for(const k of keys){if(on)cfg.fp[k]={t:Date.now(),txt:txt||""};else delete cfg.fp[k]}save();renderAll();if(curTab==="rel")renderReport();if(curTab==="alt")renderAlt();
  toast(on?"Assinalado como falso positivo — passa a contar como entregue (pode anular)":"Anulado — o aviso volta a aparecer")}
function qualOf(f,slot,X){
  if(f.size===0)return{lvl:"bad",txt:"ficheiro vazio (0 bytes)"};
  if(f.sha1&&X.tplSha.has(f.sha1))return{lvl:"bad",txt:`é o modelo «${X.tplSha.get(f.sha1)}» por preencher (ficheiro igual ao modelo)`};
  const t0=f.sha1?TX.get(f.sha1):null,t=t0&&t0.w!=null?t0:null,w=t?t.w:palavras(f.sha1),W=[];
  if(w!=null&&w<minPal()){
    if((f.size||0)<150000)return{lvl:"bad",txt:`em branco ou quase vazio (${w} palavra${w===1?"":"s"})`};
    W.push("sem texto — pode ser um documento digitalizado")}
  if(t&&t.w>=minPal()){
    if(qOn("enchimento")){
      if(t.lorem)return{lvl:"bad",txt:"texto de enchimento (lorem ipsum)"};
      if(t.top>0.5&&t.w>=20)return{lvl:"bad",txt:"texto de enchimento (a mesma palavra repetida)"};
      if(t.rep||(t.u<0.12&&t.w>=80))W.push("texto muito repetitivo (enchimento?)")}
    if(X.tpls.length&&t.w>=30){let best=0,bt=null;for(const m of X.tpls){const s=simSig(t.sig,m.t.sig);if(s>best){best=s;bt=m}}
      if(bt&&best>=0.9&&t.w-bt.t.w<Math.max(20,bt.t.w*0.1))return{lvl:"bad",txt:`é o modelo «${bt.nome}» por preencher (${Math.round(best*100)}% igual ao modelo)`};
      if(bt&&best>=0.75)W.push(`${Math.round(best*100)}% igual ao modelo «${bt.nome}» — pouco preenchido?`)}
    if(slot){const hay=f.nname+" \n "+t.n;
      if(qOn("tipo")&&slot.T.cont.length&&!slot.T.cont.some(k=>hay.includes(k)))W.push(`o conteúdo não parece ser «${slot.T.d.nome}»`);
      if(qOn("modulo")){const dc=discCode(slot.m.disc),sibs=X.sib.get(dc);
        if(sibs&&sibs.size>1){const men=mencoes(f,t,dc,sibs);
          if(men.size&&!men.has(modKey(slot.m.cod)))W.push(`parece ser de outro módulo (${[...men].slice(0,2).map(k=>sibs.get(k).cod).join(", ")})`)}}}}
  if(slot&&f.sha1){
    if(qOn("dup")){const o=(X.bySha.get(f.sha1)||[]).find(x=>x.f!==f&&x.slot.sg!==slot.sg);
      if(o)W.push(`ficheiro igual ao de ${modLabel(o.slot.m)} › ${o.slot.T.d.nome}`)}
    if(qOn("quase")&&t&&t.w>=60){let best=0,bo=null;
      for(const k of bandKeys(t)){const arr=X.lsh.get(k);if(!arr)continue;
        for(let i=0,n=Math.min(arr.length,80);i<n;i++){const x=arr[i];if(x.f===f||x.sha1===f.sha1||x.sg===slot.sg)continue;const s=simSig(t.sig,x.sig);if(s>best){best=s;bo=x}}
        if(best>=0.97)break}
      if(bo&&best>=0.85)W.push(`texto ${Math.round(best*100)}% igual ao de ${bo.slot?`${modLabel(bo.slot.m)} › ${bo.slot.T.d.nome} (${bo.f.name})`:bo.label}`)}}
  if(f.sha1&&X.ref&&qOn("anterior")&&X.ref.shas.has(f.sha1))W.push(`mesmo ficheiro já entregue em “${X.ref.pasta.split("/").pop()}”`);
  if(X.inicio&&f.cmod&&f.cmod.slice(0,10)<X.inicio)W.push(`última edição em ${f.cmod.slice(5,7)}/${f.cmod.slice(0,4)}, antes do ano letivo`);
  return W.length?{lvl:"warn",txt:W.slice(0,3).join("; ")}:null;
}
// 0.9.94: caminho real de uma pasta, a partir da pasta da turma (ex.: «008 - Avaliação > 008.1 - Formandos > 012.1.1 - Enunciados de Avaliação > 1400 - TIC > Módulo 001»)
function locReal(r){r=(r||[]).filter(Boolean);let i=-1;for(let k=0;k<r.length;k++)if(isTurma(r[k]))i=k;return (i>=0?r.slice(i+1):r).join(" > ")}
function prefixoComum(L){if(!L.length)return[];let p=L[0].slice();for(const x of L){let k=0;while(k<p.length&&k<x.length&&p[k]===x[k])k++;p=p.slice(0,k)}return p}
// quantos ficheiros do módulo estão dentro desta pasta (prefere-se a pasta onde o formador já pôs documentos)
function locPeso(rec,fs){const pre=rec.r.join("/")+"/";let n=0;for(const f of fs||[])if((f.rawDir+"/").startsWith(pre))n++;return n}
/* 0.9.97: o Box360 deixa de adivinhar «documentos exigidos». Para cada módulo vê todas as pastas do módulo na Box
   (em todas as secções: 006, 007, 008 › 012.1.x, 012…) e aponta:
   · cada PASTA VAZIA (a de cima: se uma pasta está vazia, as de dentro também estão) — ex.: «012.1.3 - Pautas › 1400 - TIC ›
     Módulo 002», ou a pasta de um formando dentro de «Teste Prático»;
   · cada pasta que só tem ficheiros que NÃO CONTAM (vazios, modelos por preencher, em branco, iguais aos de outro módulo…),
     pela análise dos documentos (qualOf) — para apanhar documentos postos só para a pasta não ficar vazia.
   As pastas com ficheiros válidos contam como entregues. Os itens mantêm a forma antiga ({doc,key,ok,state,…}) para o
   relatório, os PDF, os envios, os prazos e as estatísticas continuarem a funcionar. doc = a secção (ex.: «012.1.3 - Pautas…»). */
var CNT=null,CNTK=-1; // ficheiros por pasta (com as subpastas) e ficheiros de cada pasta
function contagens(){if(CNT&&CNTK===filesRev)return CNT;const tot=new Map(),own=new Map();
  for(const f of files){const d=f.rawDir||"";let L=own.get(d);if(!L)own.set(d,L=[]);L.push(f);
    let q=d;while(q){tot.set(q,(tot.get(q)||0)+1);const i=q.lastIndexOf("/");q=i>0?q.slice(0,i):""}}
  CNT={tot,own};CNTK=filesRev;return CNT}
// secção da pasta: a pasta numerada mais funda do caminho a seguir à turma (ex.: «012.1.3 - Pautas de Avaliação», «007 - Recursos Didáticos»)
function secDe(r){let i=-1;for(let k=0;k<r.length;k++)if(isTurma(r[k]))i=k;const L=r.slice(i+1);let sec="";for(const c of L){if(isDisc(c))break;if(/^\d{2,3}(\.\d+)*\s*[-–]/.test(c))sec=c}return sec||L[0]||"(pasta)"}
function evalCore(idx,mods){
  const out=[];
  const ref=lastEnvio(),refSet=ref?new Set(Object.values(ref.miss).flat()):null;
  const C=contagens(),FP=cfg.fp||{};
  const raiz=lastListing&&lastListing.pasta?segs(lastListing.pasta):[];
  const relDe=p=>{const q=segs(p);let k=0;while(k<raiz.length&&k<q.length&&q[k]===raiz[k])k++;return k===raiz.length?q.slice(k):null};
  const EXR=Object.values(cfg.excluir||{}).map(x=>relDe(x.path)).filter(x=>x&&x.length),FAR=((lastListing&&lastListing.failed)||[]).map(relDe).filter(x=>x&&x.length);
  const cobre=(L,esp)=>L.find(r=>r.every(x=>esp.some(c=>flexEq(x,c))));
  // 1.ª passagem: pastas de cada módulo e os ficheiros de cada uma (para a análise dos documentos comparar entre módulos)
  const slotOf=new Map(),PAIS=new Set();for(const f of folders||[]){const i=String(f).lastIndexOf("/");if(i>0)PAIS.add(String(f).slice(0,i))}
  for(const m of mods){
    let ms=segs(m.pasta),modFolders=idx.pick(ms,"folders"),flexNome="";
    if(!modFolders.length&&ms.length){const alt=idx.flex(ms);if(alt){ms=alt.ss;modFolders=idx.pick(ms,"folders");flexNome=alt.nome}}
    const sgm=discCode(m.disc)+"|"+modKey(m.cod)+"|",S=new Set(modFolders.map(r=>r.r.join("/"))),pastas=[];
    for(const rec of modFolders){const p=rec.r.join("/"),own=C.own.get(p)||[],tot=C.tot.get(p)||0,nome=rec.r[rec.r.length-1];
      const T={cont:[],d:{id:"sec:"+norm(secDe(rec.r)),nome:secDe(rec.r),min:1,subpasta:""}};
      if(own.length){const slot={m,T:{...T,d:{...T.d,nome:nome}},hits:own,sg:sgm+p};for(const f of own)if(!slotOf.has(f))slotOf.set(f,slot);pastas.push({rec,p,nome,T,own,slot})}
      else if(!tot&&!PAIS.has(p))pastas.push({rec,p,nome,T,own:[],vazia:true})} // 0.9.203: só a última pasta de cada ramo (sem subpastas) conta como vazia
    out.push({mod:m,pastas,modFolders,nFiles:modFolders.reduce((a,r)=>a+(C.own.get(r.r.join("/"))||[]).length,0),folder:ms.join(" / "),ms,flexNome});
  }
  const ck=cfgEvalKey();if(MENTK!==ck){MENT=new Map();MENTK=ck}
  const X=qualCtx(idx,slotOf,mods);
  // 2.ª passagem: estado de cada pasta
  for(const e of out){const m=e.mod,items=[];
    const relTurma=r=>{let i=-1;for(let k=0;k<r.length;k++)if(isTurma(r[k]))i=k;return r.slice(i+1).map(norm).join("/")};
    for(const x of e.pastas){const esp=x.rec.n;
      if(EXR.length&&cobre(EXR,esp))continue; // pasta excluída da análise
      const key=m.id+"|p:"+relTurma(x.rec.r),loc=locReal(x.rec.r.slice(0,-1));let state,reasons=[],q=[],pastaObs="";
      if(x.vazia){state="missing";pastaObs=FAR.length&&cobre(FAR,esp)?"a Box não deixou abrir esta pasta (sem acesso) — não foi possível confirmar":"pasta vazia"}
      else{q=x.own.map(f=>{const r=qualOf(f,x.slot,X);if(r&&FP[fpKey(f)])return{f,q:null,fp:r.txt};return{f,q:r}});
        const good=q.filter(y=>!y.q||y.q.lvl!=="bad"),clean=q.filter(y=>!y.q),moF=[],rz=L=>L.map(y=>`${y.f.name}: ${y.q.txt}`);
        // 0.9.104: um teste/exame/grelha que não segue o modelo oficial aparece mesmo que a pasta tenha outros ficheiros bons
        if(moF.length&&cfg.mo&&cfg.mo.falta===true){state="blank";reasons=rz(moF)}
        else if(moF.length&&cfg.mo&&cfg.mo.falta==="modelo"){state="modelo";reasons=rz(moF)} // 0.9.106: estado próprio «não segue o modelo oficial» (conta como entregue)
        else if(good.length){state=clean.length&&!moF.length?"ok":"warn";if(state==="warn")reasons=rz(clean.length?moF:good.filter(y=>y.q))}
        else{state="blank";reasons=rz(q.filter(y=>y.q))}}
      let fpi=null;const fpI=FP["i:"+key]; // 0.9.102: a Direção deu este item como entregue (falso positivo), mesmo sem ficheiros válidos
      if(fpI&&state!=="ok"){fpi={era:fpI.txt||pastaObs||reasons.join("; ")||ESTADO[state],t:fpI.t};state="ok";reasons=[];pastaObs="falso positivo — conta como entregue"}
      let seg="";
      if(ref){const was=refSet.has(key);
        if(state==="ok"||state==="warn"||state==="modelo"){if(was)seg="entregue desde o envio de "+dataPT(ref.t)}
        else seg=was?"pedido a "+dataPT(ref.t)+" — continua em falta":"novo (não constava do envio de "+dataPT(ref.t)+")"}
      items.push({doc:x.T.d,key,ok:state==="ok"||state==="warn"||state==="modelo",state,reasons,hits:x.own,q,loc,falta:x.nome,pastaObs,seg,since:!!(ref&&seg.startsWith("entregue desde")),fora:false,fpi})}
    if(!e.modFolders.length)items.push({doc:{id:"sec:modulo",nome:"Pasta do módulo",min:1,subpasta:""},key:m.id+"|p:",ok:false,state:"missing",reasons:[],hits:[],q:[],
      loc:[m.turma,m.disc].filter(Boolean).join(" > "),falta:m.cod,pastaObs:"não há nenhuma pasta deste módulo na análise",seg:"",since:false,fora:false});
    if(!e.modFolders.length&&FP["i:"+m.id+"|p:"]){const it=items[items.length-1],v=FP["i:"+m.id+"|p:"];Object.assign(it,{ok:true,state:"ok",fpi:{era:v.txt||it.pastaObs,t:v.t},pastaObs:"falso positivo — conta como entregue"})}
    // as faltas primeiro, pela ordem das pastas
    e.items=items.sort((a,b)=>(a.ok-b.ok)||COLL_PTN.compare(a.loc+" > "+a.falta,b.loc+" > "+b.falta));
    delete e.pastas;delete e.modFolders;delete e.ms}
  return out;
}
// o resultado fica guardado enquanto nada mudar (ficheiros, textos lidos, módulos, documentos exigidos, opções)
let EV=null,EVK=null,_ekRev=-1,_ek="",QF=null;
function cfgEvalKey(){if(_ekRev!==cfgRev){_ek=JSON.stringify([cfg.docTypes,cfg.mods,cfg.desig,cfg.qual,(cfg.envios||[]).map(v=>v.id),cfg.fp||{}]);_ekRev=cfgRev}return _ek}
function evaluate(){const idx=getIdx(),ck=cfgEvalKey(),k=filesRev+"|"+txRev+"|"+refRev+"|"+tplRev;
  if(EV&&EVK&&EVK.k===k&&EVK.ck===ck)return EV;
  EV=evalCore(idx,ativos());EVK={k,ck};QF=null;return EV}
// estado de cada ficheiro (para o painel Alterações): id do ficheiro -> {lvl, txt}
function qualFicheiros(){if(QF)return QF;const ev=evaluate();QF=new Map();for(const e of ev)for(const i of e.items)for(const x of i.q)if(x.f.fid)QF.set(x.f.fid,x.q||{lvl:"ok",txt:""});return QF}
function byTeacher(ev){
  const map=new Map();
  for(const e of ev){const k=profOf(e.mod)||"_";if(!map.has(k))map.set(k,[]);map.get(k).push(e)}
  const arr=[...map.entries()].map(([pid,list])=>{const p=cfg.profs.find(x=>x.id===pid)||{id:"_",nome:"(sem formador atribuído)",email:""};
    const tot=list.reduce((a,e)=>a+e.items.length,0),ok=list.reduce((a,e)=>a+e.items.filter(i=>i.ok).length,0);return {p,list,tot,ok,miss:tot-ok}});
  arr.sort((a,b)=>b.miss-a.miss||COLL_PT.compare(a.p.nome,b.p.nome));return arr;
}
const motivoBad=i=>{const x=(i.q||[]).find(x=>x.q&&x.q.lvl==="bad");return x?x.q.txt:"sem conteúdo válido"};
const obsOf=i=>[i.state==="blank"?"os ficheiros desta pasta não contam: "+i.reasons.join("; "):"",i.pastaObs,i.state==="warn"?"a confirmar: "+i.reasons.join("; "):"",i.state==="modelo"?"não segue o modelo oficial — "+i.reasons.join("; "):"",i.seg].filter(Boolean).join(" · ");
const ESTADO={ok:"Entregue",warn:"Entregue — a confirmar",modelo:"Entregue — não segue o modelo oficial",blank:"Entregue, mas não conta (vazio ou falso)",missing:"Em falta"};

/* linhas no formato do Excel da escola */
function rowsFor(t,onlyMissing){const r=[];
  for(const e of t.list)for(const i of e.items){if(onlyMissing&&i.ok)continue;
    r.push({turma:e.mod.turma,disc:e.mod.disc,mod:modTitle(e.mod),loc:i.loc,falta:i.falta,obs:obsOf(i),state:i.state,item:i,e})}
  return r;}

/* ---------- envios registados (acompanhamento) ---------- */
// último envio registado para o(s) ano(s) letivo(s) da análise carregada
function lastEnvio(){const a=anoRef();return (cfg.envios||[]).find(v=>!v.anoRef||!a||v.anoRef===a)||null}
function registarEnvio(label){
  const T=byTeacher(evaluate());const miss={};let n=0;
  for(const t of T){if(t.p.id==="_")continue;const k=[];for(const e of t.list)for(const i of e.items)if(!i.ok)k.push(i.key);if(k.length){miss[t.p.id]=k;n+=k.length}}
  ponto("Antes de registar o envio");
  cfg.envios=[{id:uid(),t:Date.now(),label:label||"Envio de emails",miss,n,ano:cfg.mail.ano,anoRef:anoRef(),prazo:cfg.mail.prazo},...(cfg.envios||[])].slice(0,30);
  save();renderEnvios();toast(`Envio registado: ${n} item(ns) em falta`);
  if(lastListing)criarBase(lastListing,"Envio registado").then(()=>{if(curTab==="alt")renderAlt()}); // nova contagem para o painel Alterações
}
function renderEnvios(){const el=$("#envios");if(!el)return;
  el.innerHTML=(cfg.envios||[]).map((v,i)=>`<div class="rp"><span class="d">${new Date(v.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}</span><span class="l">${esc(v.label)} · ${v.n} item(ns) em falta${v.prazo?` · prazo ${esc(v.prazo)}`:""}${v===lastEnvio()?` <span class="tag ok">referência atual</span>`:""}</span><button class="x" title="Apagar este registo" data-envdel="${i}">×</button></div>`).join("")||`<p class="hint">Ainda não registou nenhum envio.</p>`}
$("#envios").addEventListener("click",e=>{const b=e.target.closest("[data-envdel]");if(!b)return;cfg.envios.splice(+b.dataset.envdel,1);save();renderEnvios();toast("Registo apagado (pode anular)")});

