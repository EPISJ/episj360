/* ---------- módulos: turma, disciplina, código, formador, designação, ano letivo ---------- */
const isDisc=c=>/^\d{4}\s*-\s*\S/.test(String(c).trim());
const isTurma=c=>/\(\s*\d{2,4}\s*[-\/]\s*\d{2,4}\s*\)/.test(c);
const isModName=c=>{const n=norm(c);return /^(modulo|mod\.?|ufcd)\s*[a-z0-9]/.test(n)||/^uc\s*\d/.test(n)};
const discCode=d=>(String(d||"").match(/^\s*(\d{3,5})/)||[])[1]||norm(d);
const discShort=d=>String(d||"").replace(/^\s*\d+\s*-\s*/,"");
// chave do módulo: "Módulo 1" = "Módulo 01" = "Módulo 001" → "1"; "UFCD 0349 (nome)" → "349"; "UC03611 - nome" → "uc3611"
const modKey=c=>{let n=norm(c),uc=false;
  if(/^uc\s*\d/.test(n)){uc=true;n=n.replace(/^uc\s*/,"")}else n=n.replace(/^(modulo|mod\.?|ufcd)\s*/,"");
  const m=n.match(/^0*(\d+)(?=$|[\s\-–(:.,_])/);if(m)return (uc?"uc":"")+m[1];
  return (uc?"uc":"")+n.replace(/^0+(?=[a-z0-9])/,"")};
// código curto (sem o nome) e nome tirado da própria pasta: "UFCD 0349 (Ambiente)" → "UFCD 0349" + "Ambiente"
const COD_RE=/^\s*((?:m[oó]dulo|mod\.?|ufcd|uc)\s*[a-z]{0,2}\s*\d+|[a-z]?\d{3,6})/i;
const codCurto=c=>{const m=String(c||"").match(COD_RE);return m?m[1].trim():String(c||"")};
const nomeDaPasta=c=>{const m=String(c||"").match(COD_RE);if(!m)return "";return String(c).slice(m[0].length).replace(/^[\s\-–:.)]+/,"").replace(/^\((.*)\)$/,"$1").trim()};
// ano letivo tirado do nome de uma pasta (ex.: "DTP 2025.2026" → "2025/2026")
const anoDe=p=>{const m=String(p||"").match(/(20\d\d)\s*[.\-\/_ ]\s*(20\d\d)/);return m&&+m[2]===+m[1]+1?m[1]+"/"+m[2]:""};
// a grelha turma × disciplina é guardada por ano letivo; as atribuições antigas (sem ano) servem de valor por omissão
const legKey=m=>norm(m.turma)+"|"+discCode(m.disc);
const gridKey=m=>(m.ano?m.ano+"|":"")+legKey(m);
const gridGet=m=>{const k=gridKey(m);if(k in cfg.grid)return cfg.grid[k]||"";return (m.ano&&cfg.grid[legKey(m)])||""};
const pastaDe=m=>[m.anoDir,m.turma,m.disc,m.cod].filter(Boolean).join(" / ");
function fillModFields(m){
  if(m.disc&&m.cod)return;
  const parts=String(m.pasta||"").split("/").map(x=>x.trim()).filter(Boolean);
  if(!m.disc)m.disc=parts.find(isDisc)||(parts.length>=2?parts[parts.length-2]:"");
  if(!m.cod)m.cod=parts.filter(p=>p!==m.disc&&p!==m.turma&&!isTurma(p)).pop()||m.nome||"";
}
/* 0.9.52: Box360 ← Plano Curricular — quem dá cada disciplina a cada turma (o formador com mais horas no plano desse ano letivo)
   vale como atribuição enquanto a Direção não escolher outro na grelha. Nada é gravado: é só o que se usa quando a grelha está vazia. */
var PLP=null;
function planoMapa(){const k=String(cfgRev);if(PLP&&PLP.k===k)return PLP.m;const M=new Map();
  try{const E=escData(),anoN=new Map(E.anos.map(a=>[a.id,a.nome])),tById=new Map(E.turmas.map(t=>[t.id,t]));
    for(const p of pcPlanos()){const t=tById.get(p.turmaId),an=anoN.get(p.anoId);if(!t||!an||!t.cod)continue;const h=new Map();
      for(const l of p.linhas||[]){if(!l||!l.f||!l.disc)continue;const kk=an+"|"+norm(t.cod)+"|"+discCode(l.disc);const o=h.get(kk)||new Map();o.set(l.f,(o.get(l.f)||0)+(+l.h||0));h.set(kk,o)}
      for(const [kk,o] of h){let best="",mx=-1;for(const [f,v] of o)if(v>mx){mx=v;best=f}if(best)M.set(kk,best)}}}catch(e){}
  PLP={k,m:M};return M}
function planoProf(m){if(!m||!m.ano)return"";const M=planoMapa();if(!M.size)return"";const tc=norm(m.turma),dc=discCode(m.disc);let v=M.get(m.ano+"|"+tc+"|"+dc);
  if(!v){const t0=tc.split(/[\s\-–—]+/)[0];if(t0&&t0!==tc)v=M.get(m.ano+"|"+t0+"|"+dc)}
  return v&&cfg.profs.some(p=>p.id===v)?v:""}
const gridEf=m=>gridGet(m)||planoProf(m);
const profOf=m=>m.profId||gridEf(m)||"";
const isExc=m=>!!m.profId&&m.profId!==gridEf(m);
const profName=id=>(cfg.profs.find(p=>p.id===id)||{}).nome||"";
const desigOf=m=>cfg.desig[discCode(m.disc)+"|"+modKey(m.cod)]||cfg.desig["*|"+modKey(m.cod)]||snqDesig(m)||nomeDaPasta(m.cod)||"";
const modTitle=m=>(m.cod?codCurto(m.cod):(m.nome||"(módulo)"))+(desigOf(m)?" — "+desigOf(m):"");
const modLabel=m=>[discShort(m.disc),modTitle(m),m.turma].filter(Boolean).join(" · ");

/* ---------- atualização da configuração antiga ---------- */
function migrate(){
  cfg.grid=cfg.grid||{};cfg.desig=cfg.desig||{};cfg.envios=cfg.envios||[];cfg.snq=cfg.snq||{};
  if(!cfg.keyV2){const d={};for(const k in cfg.desig){const i=k.indexOf("|");d[k.slice(0,i)+"|"+modKey(k.slice(i+1))]=cfg.desig[k]}cfg.desig=d;cfg.keyV2=1}
  cfg.qual=Object.assign({min:40,dup:true},cfg.qual||{});
  cfg.mail=Object.assign({subj:MAIL_SUBJ,prazo:"",ano:"",body:MAIL_BODY,relatorio_para:""},cfg.mail||{});
  cfg.mods.forEach(fillModFields);
  const s0=cfg.schema||1;
  if(s0<2){
    ponto("Antes da atualização para a v"+VERSAO);
    const old=["Planificação","Recursos didáticos / fichas","Teste / prova do módulo"];
    if(cfg.docTypes.length===3&&cfg.docTypes.every((d,i)=>d.nome===old[i])){cfg.docTypes=dtpTypes();cfg.mods.forEach(m=>m.docs=cfg.docTypes.map(d=>d.id))}
    if(cfg.mail.body===OLD_BODY)cfg.mail.body=MAIL_BODY;
    if(cfg.mail.subj==="Documentação em falta na Box")cfg.mail.subj=MAIL_SUBJ;
    // atribuições feitas módulo a módulo → grelha (quando todos os módulos da turma/disciplina têm o mesmo formador)
    const g=new Map();cfg.mods.forEach(m=>{const k=gridKey(m);if(!g.has(k))g.set(k,[]);g.get(k).push(m)});
    for(const [k,list] of g){const ids=[...new Set(list.map(m=>m.profId||""))];
      if(ids.length===1&&ids[0]&&!cfg.grid[k]){cfg.grid[k]=ids[0];list.forEach(m=>m.profId="")}}
    cfg.schema=2;
  }
  if(s0<3){
    if(s0===2&&cfg.mods.length)ponto("Antes da atualização para a v"+VERSAO);
    cfg.schema=3;
  }
  acertos094();
  // "o texto deve conter": valores por omissão para os documentos do modelo DTP EPISJ
  cfg.docTypes.forEach(d=>{if(d.conteudo===undefined){const p=DTP_TYPES.find(x=>x[0]===d.nome);d.conteudo=p?p[2]:""}});
}
/* 0.9.94: (a) a regra antiga da Matriz pedia uma pasta «008 / Matrizes», que não existe na Box da escola — passa a procurar
   «matriz» no nome do ficheiro ou da pasta, dentro da Avaliação (só uma vez; se a Direção voltar a mudar, fica como escolheu);
   (b) o mesmo módulo detetado em dois computadores ficava duas vezes (ids diferentes) e o relatório repetia as linhas:
   juntam-se num só, sem perder nada (formador, designação, documentos — o que estiver preenchido numa das cópias fica) */
function juntarModsRepetidos(c){if(!c||!Array.isArray(c.mods)||c.mods.length<2)return 0;
  const env=new Set();(c.envios||[]).forEach(v=>Object.values(v.miss||{}).forEach(L=>(L||[]).forEach(k=>env.add(String(k).split("|")[0]))));
  const by=new Map(),out=[];let n=0;
  for(const m of c.mods){const k=(m.ano||"")+"|"+norm(m.turma)+"|"+discCode(m.disc)+"|"+modKey(m.cod);const i=by.get(k);if(i===undefined){by.set(k,out.length);out.push(m);continue}
    n++;const a=out[i],ka=env.has(a.id)||!env.has(m.id)?a:m,kb=ka===a?m:a; // fica o id que consta dos envios
    for(const f in kb){const v=ka[f];if(v===undefined||v===null||v==="")ka[f]=kb[f]}
    if(Array.isArray(kb.docs)&&(!Array.isArray(ka.docs)||!ka.docs.length))ka.docs=kb.docs.slice();
    out[i]=ka}
  if(n)c.mods=out;return n}
/* 0.9.96: cada computador que começou do zero criou a sua lista de documentos exigidos (ids diferentes) e, ao juntar,
   ficaram todas — cada módulo pedia várias vezes «Matrizes», «Enunciados…» e o relatório repetia as linhas.
   Juntam-se pelo nome; os ids antigos passam para o que fica nos módulos, nos prazos e nos envios registados (nada se perde). */
function juntarDocsRepetidos(c){const L=c&&c.docTypes;if(!Array.isArray(L)||L.length<2)return 0;
  const envD=new Set();(c.envios||[]).forEach(v=>Object.values(v.miss||{}).forEach(K=>(K||[]).forEach(k=>envD.add(String(k).split("|")[1]))));
  const by=new Map(),map={},out=[];
  for(const d of L){if(!d||typeof d!=="object")continue;const k=norm(d.nome||"");const i=by.get(k);if(i===undefined){by.set(k,out.length);out.push(d);continue}
    const a=out[i];if(envD.has(d.id)&&!envD.has(a.id)){map[a.id]=d.id;out[i]=d}else map[d.id]=a.id}
  const n=L.length-out.length;if(!n)return 0;
  const R=id=>{let x=id,g=0;while(map[x]&&g++<50)x=map[x];return x},fix=A=>Array.isArray(A)?[...new Set(A.map(R))]:A;
  c.docTypes=out;(c.mods||[]).forEach(m=>{m.docs=fix(m.docs)});(c.prazos||[]).forEach(p=>{if(p&&p.docs)p.docs=fix(p.docs)});
  (c.envios||[]).forEach(v=>{for(const pid in v.miss||{})v.miss[pid]=[...new Set((v.miss[pid]||[]).map(k=>{const q=String(k).split("|");return q.length===2?q[0]+"|"+R(q[1]):k}))]});
  return n}
function acertos094(){let mud=0;
  const nd=juntarDocsRepetidos(cfg);if(nd){mud++;console.info("EPISJ 360: "+nd+" documento(s) exigido(s) repetido(s) juntado(s)")}
  // 0.9.96: corre sempre (não só uma vez) — um computador com uma versão antiga aberta podia repor «008 / Matrizes» ao gravar
  for(const d of cfg.docTypes||[])if(String(d.subpasta||"").split("/").map(norm).filter(Boolean).join("/")==="008/matrizes"&&!String(d.palavras||"").trim()){
    if(!mud)ponto("Antes da correção da regra das Matrizes");d.subpasta="008";d.palavras="matriz";mud++}
  cfg.acerto094=1;
  const n=juntarModsRepetidos(cfg);if(n){mud++;console.info("EPISJ 360: "+n+" módulo(s) repetido(s) juntado(s)")}
  if(mud)cfgRev++;return mud}
migrate();persist();lastJSON=JSON.stringify(cfg);

