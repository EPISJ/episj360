/* ===================== EPISJ 360 0.9.54: Calendário Escolar — leitura do documento (DOCX ou PDF) =====================
   O documento do calendário escolar (como o "Calendário Escolar 2026/2027 Detalhado") é lido no navegador, sem enviar nada:
   · ano letivo, início e termo; períodos letivos (início, termo e dias letivos indicados); interrupções (Natal, Carnaval, Páscoa…);
   · o "Detalhe" de cada turma (A01 - Curso (24-27)): FCT, momentos de avaliação, PAP e outros marcos, com as datas;
   · notas e base legal (ex.: Portaria n.º …).
   As datas aceitam "16 de dezembro de 2026", "De 21 a 31 de dezembro de 2026", "04 de janeiro a 12 de março de 2027",
   "12 e 13 de julho de 2027", "1, 2 e 3 de junho", "15/03/2027" e "15/03 a 03/05/2027"; sem ano, vale o do ano letivo. */
var CAL_MES={janeiro:1,fevereiro:2,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12,
  jan:1,fev:2,mar:3,abr:4,mai:5,jun:6,jul:7,ago:8,set:9,out:10,nov:11,dez:12};
function calNorm(s){return String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase().replace(/[   ]/g," ")}
// palavras e números com a posição no texto original (para se saber até onde foi lida cada data)
function calToks(s){const out=[],re=/\d{1,2}\s*\/\s*\d{1,2}(?:\s*\/\s*\d{2,4})?|\d+(?:\s*\.?\s*[ºª°])?|[A-Za-zÀ-ÖØ-öø-ÿ]+|[,;:|*()–—-]/g;let m;
  while((m=re.exec(s))){let v=calNorm(m[0]).replace(/\s+/g,"");v=v.replace(/^(\d+)\.?[ºª°]$/,"$1");if(v==="–"||v==="—")v="-";out.push({v,a:m.index,b:m.index+m[0].length})}
  return out}
const calIsoD=(y,m,d)=>{const dt=new Date(y,m-1,d);if(dt.getFullYear()!==y||dt.getMonth()!==m-1||dt.getDate()!==d)return null;return y+"-"+String(m).padStart(2,"0")+"-"+String(d).padStart(2,"0")};
// uma expressão de datas a partir do símbolo i: devolve {de, ate, datas (só nas listas), tipo, fim (símbolo seguinte)} ou null
function calExpr(T,i,y0){let k=i,tipo="um";const parts=[];
  const dia=t=>t&&/^\d{1,2}$/.test(t.v)&&+t.v>=1&&+t.v<=31,mes=t=>t&&CAL_MES[t.v]!=null,ano=t=>t&&/^\d{4}$/.test(t.v)&&+t.v>1990&&+t.v<2100,num=t=>t&&/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(t.v);
  if(T[k]&&(T[k].v==="de"||T[k].v==="entre"||T[k].v==="dia"||T[k].v==="dias"))k++;
  const parte=()=>{if(num(T[k])){const q=T[k].v.split("/");k++;const p={d:+q[0],m:+q[1]};if(q[2])p.y=+q[2]<100?2000+(+q[2]):+q[2];return p}
    if(!dia(T[k]))return null;const p={d:+T[k].v};k++;
    if(T[k]&&T[k].v==="de"&&mes(T[k+1])){p.m=CAL_MES[T[k+1].v];k+=2}else if(mes(T[k])){p.m=CAL_MES[T[k].v];k++}
    if(p.m){if(T[k]&&T[k].v==="de"&&ano(T[k+1])){p.y=+T[k+1].v;k+=2}else if(ano(T[k])){p.y=+T[k].v;k++}}
    return p};
  const p0=parte();if(!p0)return null;parts.push(p0);
  for(;;){const s=T[k];if(!s)break;const sepI=s.v==="a"||s.v==="ate"||s.v==="-",sepL=s.v===","||s.v==="e";
    if(!sepI&&!sepL)break;if(sepI&&(tipo==="lista"||parts.length>=2))break;if(sepL&&tipo==="intervalo")break;
    const k0=k;k++;if(sepI&&T[k]&&T[k].v==="de"&&dia(T[k+1]))k++;const p=parte();if(!p){k=k0;break}
    parts.push(p);tipo=sepI?"intervalo":"lista"}
  for(let j=parts.length-2;j>=0;j--){const a=parts[j],b=parts[j+1];if(!a.m)a.m=b.m;if(!a.y&&b.y)a.y=a.m>b.m?b.y-1:b.y}
  if(!parts[parts.length-1].m)return null;
  for(const p of parts)if(!p.y)p.y=y0?(p.m>=8?y0:y0+1):new Date().getFullYear();
  const L=parts.map(p=>calIsoD(p.y,p.m,p.d));if(L.some(x=>!x))return null;
  const ord=L.slice().sort();if(tipo==="intervalo"&&ord[0]!==L[0])return null; // "31 a 2 de dezembro": não faz sentido
  return{de:ord[0],ate:ord[ord.length-1],datas:tipo==="lista"?ord:null,tipo,fim:k}}
// tipo de marco pelo nome
function calTipo(nome){const n=calNorm(nome);
  const U=cfg&&cfg.escola&&Array.isArray(cfg.escola.calTipos)?cfg.escola.calTipos:[];for(const t of U){const tn=t&&calNorm(t.nome);if(tn&&tn.length>=3&&n.includes(tn))return t.k}
  if(/contexto de trabalho|\bfct\b|estagio|formacao pratica/.test(n))return"fct";
  if(/\bpap\b|aptidao profissional|anteprojeto|projeto final/.test(n))return"pap";
  if(/momento|avaliac|conselho de turma|reuniao|intercalar/.test(n))return"aval";
  if(/exame|prova|teste/.test(n))return"prova";
  if(/visita|atividade|viagem|semana |festa|dia aberto|desfile|feira/.test(n))return"ativ";
  return"outro"}
// marcos de um bloco de texto "Rótulo: datas Rótulo: datas …" (as linhas partidas do PDF não fazem mal)
function calMarcosDe(s,y0){const out=[];let pos=0;
  while(pos<s.length){const c=s.indexOf(":",pos);if(c<0)break;
    let nome=s.slice(pos,c);const corte=Math.max(nome.lastIndexOf(". "),nome.lastIndexOf("; "));if(corte>=0)nome=nome.slice(corte+2);
    nome=nome.replace(/^[\s;,.\-–—•*]+/,"").replace(/\s+/g," ").trim();
    const resto=s.slice(c+1),T=calToks(resto),e=calExpr(T,0,y0);
    if(e&&nome&&nome.length<=140&&/[a-zà-ÿ]/i.test(nome)){out.push({nome,tipo:calTipo(nome),de:e.de,ate:e.ate,datas:e.datas});pos=c+1+T[e.fim-1].b;while(pos<s.length&&/[\s;,.*]/.test(s[pos]))pos++}
    else pos=c+1}
  return out}
const calY4=v=>v?(+v<100?2000+(+v):+v):null;
const CAL_INT={natal:"Interrupção do Natal",carnaval:"Interrupção do Carnaval",entrudo:"Interrupção do Carnaval",pascoa:"Interrupção da Páscoa"};
// análise do texto do documento (linhas: parágrafos e linhas de tabela do DOCX, ou linhas do PDF)
function calAnalisar(linhas,anoRef){
  const R={y0:null,inicio:null,fim:null,periodos:[],interrupcoes:[],turmas:[],notas:[],base:"",avisos:[]};
  const L=linhas.map(x=>String(x==null?"":x).replace(/[\t ]+/g," ").replace(/\s+/g," ").trim()).filter(Boolean);
  const txt=L.join("\n"),tn=calNorm(txt);
  let m=tn.match(/ano letivo\s*(?:de\s*)?(\d{4})\s*[\/-]\s*(\d{2,4})/)||tn.match(/calendario escolar\s*(?:de\s*)?(\d{4})\s*[\/-]\s*(\d{2,4})/)||tn.match(/\b(20\d{2})\s*\/\s*(20\d{2})\b/);
  R.y0=m?+m[1]:(anoRef||null);
  // o "Detalhe" por turma começa no primeiro cabeçalho de turma
  const RE_T=/^\s*([A-Z]\d{2,3})\s*[-–—]+\s*(.+?)\s*\(\s*(\d{2,4})\s*[-\/]\s*(\d{2,4})\s*\)\s*\**\s*$/;
  let iDet=L.findIndex(x=>RE_T.test(x));if(iDet<0)iDet=L.length;
  const geral=L.slice(0,iDet).join("\n"),T=calToks(geral);
  // início e termo do ano letivo
  for(let i=0;i<T.length&&!(R.inicio&&R.fim);i++){const v=T[i].v;
    const pal=!R.inicio&&/^(inicio|inicia|comeca|arranque)$/.test(v)?"i":(!R.fim&&R.inicio&&/^(termo|termina|fim|final|encerramento)$/.test(v)?"f":"");if(!pal)continue;
    let k=i+1;while(T[k]&&/^(a|em|no|na|dia|as|letivo|ano)$/.test(T[k].v))k++;const e=calExpr(T,k,R.y0);if(!e)continue;
    if(pal==="i")R.inicio=e.de;else R.fim=e.ate}
  // períodos letivos: "1.º | 14 de setembro de 2026 | 18 de dezembro de 2026 | 67" (ou numa frase)
  for(let i=0;i<T.length;i++){const t=T[i];if(!/^[123]$/.test(t.v))continue;let k=i+1;
    while(T[k]&&/^(periodo|letivo|\||:|-)$/.test(T[k].v))k++;const e1=calExpr(T,k,R.y0);if(!e1)continue;
    let ini=e1.de,fim=e1.tipo==="intervalo"?e1.ate:null;k=e1.fim;
    if(!fim){let k2=k;while(T[k2]&&/^(\||a|ate|-|e|termo|fim|\*)$/.test(T[k2].v))k2++;const e2=calExpr(T,k2,R.y0);if(!e2)continue;fim=e2.ate;k=e2.fim}
    let k3=k,dias=null;while(T[k3]&&/^(\||\*|dias|letivos)$/.test(T[k3].v))k3++;if(T[k3]&&/^\d{1,3}$/.test(T[k3].v)&&+T[k3].v>=5&&+T[k3].v<=200&&!(T[k3+1]&&(CAL_MES[T[k3+1].v]||T[k3+1].v==="de")))dias=+T[k3].v;
    const n=+t.v;if(fim>ini&&!R.periodos.some(p=>p.n===n))R.periodos.push({n,ini,fim,diasDoc:dias});i=k-1}
  R.periodos.sort((a,b)=>a.n-b.n);
  // interrupções letivas
  for(let i=0;i<T.length;i++){const nm=CAL_INT[T[i].v];if(!nm)continue;let k=i+1;
    while(T[k]&&(/^(-|:|\||\*)$/.test(T[k].v)||(T[k].v==="de"&&!/^\d/.test((T[k+1]||{}).v||""))))k++;
    const e=calExpr(T,k,R.y0);if(!e)continue;if(!R.interrupcoes.some(x=>x.nome===nm))R.interrupcoes.push({nome:nm,de:e.de,ate:e.ate});i=e.fim-1}
  // outras interrupções escritas por extenso ("Interrupção letiva: 3 a 5 de novembro")
  for(let i=0;i<T.length;i++){if(!/^interrupc/.test(T[i].v))continue;let k=i+1,nome=[];
    while(T[k]&&k<i+8&&!/^\d/.test(T[k].v)){if(/^[a-z]+$/.test(T[k].v)&&!/^(de|da|do|das|dos|a|e|letiva|letivas|atividades)$/.test(T[k].v))nome.push(T[k].v);k++}
    const e=calExpr(T,k,R.y0);if(!e)continue;if(R.interrupcoes.some(x=>!(e.ate<x.de||e.de>x.ate)))continue;
    if(nome.some(w=>CAL_INT[w]))continue;R.interrupcoes.push({nome:"Interrupção letiva",de:e.de,ate:e.ate})}
  // notas (linhas com *) e base legal
  for(const x of L){if(/^\*(?!\*)/.test(x))R.notas.push(x.replace(/^\*+\s*/,""));
    const b=x.match(/(portaria|despacho normativo|despacho|decreto[- ]lei|decreto legislativo regional|resolu[cç][aã]o)\s+n\.?\s*[ºo°]?\s*[\d][\d\-\/A-Za-z.]*(?:\s+de\s+\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4})?/i);if(b&&!R.base)R.base=b[0].trim()}
  // detalhe de cada turma
  let cur=null;
  for(const x of L.slice(iDet)){const t=x.match(RE_T);if(t){cur={cod:t[1].toUpperCase(),curso:t[2].replace(/\s+/g," ").trim(),ai:calY4(t[3]),af:calY4(t[4]),titulo:x.replace(/\s*\**\s*$/,""),txt:[]};R.turmas.push(cur);continue}
    if(cur)cur.txt.push(x)}
  for(const t of R.turmas){t.marcos=calMarcosDe(t.txt.join(" "),R.y0);delete t.txt}
  if(!R.inicio&&R.periodos.length)R.inicio=R.periodos[0].ini;
  if(!R.fim&&R.periodos.length)R.fim=R.periodos[R.periodos.length-1].fim;
  return R}

/* ---------- texto do DOCX: leitor de ZIP do próprio navegador (DecompressionStream), com o da SheetJS como alternativa ---------- */
async function calZip(buf){const u=new Uint8Array(buf),dv=new DataView(u.buffer,u.byteOffset,u.byteLength);let e=-1;
  for(let i=u.length-22;i>=Math.max(0,u.length-70000);i--)if(dv.getUint32(i,true)===0x06054b50){e=i;break}
  if(e<0)throw new Error("o ficheiro não é um documento .docx válido");
  const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);const ent={};
  for(let k=0;k<n;k++){if(dv.getUint32(p,true)!==0x02014b50)break;const met=dv.getUint16(p+10,true),cs=dv.getUint32(p+20,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
    ent[new TextDecoder().decode(u.subarray(p+46,p+46+nl))]={met,cs,off};p+=46+nl+xl+cl}
  return async nome=>{const x=ent[nome];if(!x)return null;const nl=dv.getUint16(x.off+26,true),xl=dv.getUint16(x.off+28,true),ini=x.off+30+nl+xl,d=u.subarray(ini,ini+x.cs);
    if(x.met===0)return new TextDecoder().decode(d);if(x.met!==8)throw new Error("compressão do .docx não suportada");
    if(typeof DecompressionStream!=="undefined"){const s=new Blob([d]).stream().pipeThrough(new DecompressionStream("deflate-raw"));return await new Response(s).text()}
    const X=await loadXLSX(),cfb=X.CFB.read(u,{type:"array"}),f=X.CFB.find(cfb,"/"+nome)||X.CFB.find(cfb,nome);if(!f)return null;return new TextDecoder().decode(f.content instanceof Uint8Array?f.content:new Uint8Array(f.content))}}
const CAL_W="http://schemas.openxmlformats.org/wordprocessingml/2006/main";
function calXmlLinhas(xml){const d=new DOMParser().parseFromString(xml,"application/xml"),out=[];
  const txtP=p=>{let s="";const it=p.getElementsByTagNameNS(CAL_W,"*");for(let i=0;i<it.length;i++){const n=it[i];if(n.localName==="t")s+=n.textContent;else if(n.localName==="tab")s+=" ";else if(n.localName==="br"||n.localName==="cr")s+=" "}return s};
  const walk=el=>{for(const c of Array.from(el.childNodes)){if(c.nodeType!==1)continue;const ln=c.localName;
    if(ln==="p")out.push(txtP(c));
    else if(ln==="tbl"){for(const tr of Array.from(c.childNodes).filter(x=>x.localName==="tr")){out.push(Array.from(tr.childNodes).filter(x=>x.localName==="tc").map(tc=>Array.from(tc.getElementsByTagNameNS(CAL_W,"p")).map(txtP).join(" ").trim()).join(" | "))}}
    else if(ln==="sdt"||ln==="sdtContent"||ln==="body"||ln==="customXml"||ln==="smartTag")walk(c)}};
  const body=d.getElementsByTagNameNS(CAL_W,"body")[0]||d.documentElement;walk(body);return out}
async function calTextoDocx(buf){const Z=await calZip(buf),xml=await Z("word/document.xml");if(!xml)throw new Error("o ficheiro não parece um documento do Word (.docx)");
  const linhas=calXmlLinhas(xml);
  for(const h of ["word/header1.xml","word/header2.xml","word/header3.xml"]){const x=await Z(h).catch(()=>null);if(x){const t=calXmlLinhas(x).join(" ").trim();if(t)linhas.unshift(t)}}
  return linhas}
/* ---------- texto do PDF: pdf.js (Mozilla, Apache 2.0), carregado só quando é preciso (lib/pdf.min.mjs) ---------- */
var CAL_PDFJS=null;
async function calPdfJs(){if(CAL_PDFJS)return CAL_PDFJS;const base=new URL("lib/",location.href).href,m=await import(base+"pdf.min.mjs");m.GlobalWorkerOptions.workerSrc=base+"pdf.worker.min.mjs";return CAL_PDFJS=m}
async function calLinhasPdf(pdfjs,buf){const doc=await pdfjs.getDocument({data:new Uint8Array(buf),isEvalSupported:false,disableFontFace:true}).promise,out=[];
  for(let n=1;n<=doc.numPages;n++){const pg=await doc.getPage(n),tc=await pg.getTextContent();let cur="",y=null;
    for(const it of tc.items){if(!it||typeof it.str!=="string")continue;const yy=it.transform?it.transform[5]:0;
      if(y!==null&&Math.abs(yy-y)>2&&cur.trim()){out.push(cur);cur=""}
      if(it.str)cur+=(cur&&!/\s$/.test(cur)&&!/^\s/.test(it.str)?" ":"")+it.str;y=yy;if(it.hasEOL){if(cur.trim())out.push(cur);cur="";y=null}}
    if(cur.trim())out.push(cur)}
  try{doc.destroy()}catch(e){}return out}
async function calTextoPdf(buf){return calLinhasPdf(await calPdfJs(),buf)}

/* ===================== EPISJ 360 0.9.54: Calendário Escolar (Escola360 › Anos letivos › Calendário Escolar) =====================
   Cada ano letivo guarda o seu calendário em a.calendario = {periodos:[{id,n,ini,fim,diasDoc}], marcos:[{id,turmaId,cod,tipo,nome,de,ate,datas,obs}],
   fonte:{nome,tipo,em,por}, base, notas}. As interrupções e os feriados continuam em a.ferias (as mesmas que o Horários360 usa).
   O feriado municipal (Velas: 23 de abril) fica em escola.feriadoMunicipal. Nada se apaga ao importar: junta-se ao que existe. */
var CAL_ANO=(()=>{try{return localStorage.getItem("cal_ano")||""}catch(e){return ""}})(),CAL_T=(()=>{try{return localStorage.getItem("cal_t")||""}catch(e){return ""}})(),CAL_TIPO="",CAL_DIA="",CAL_IMP=null;
var CAL_TIPOS_BASE={fct:["FCT","#db2777"],pap:["PAP","#7c3aed"],aval:["Avaliação","#d97706"],prova:["Prova / exame","#dc2626"],ativ:["Atividade","#0891b2"],outro:["Outro","#64748b"]};
var CAL_TIPOS=Object.assign({},CAL_TIPOS_BASE),CAL_TIPOS_K="";
/* 0.9.134: tipos de marcos acrescentados pela escola (escola.calTipos = [{k,nome,cor}]); viajam com a peça «estado».
   «Outro» fica sempre no fim. Função (içada) e guardas: pode ser chamada pelo escData() antes de esta linha correr no arranque. */
function calTiposSync(){if(typeof CAL_TIPOS_BASE==="undefined"||!CAL_TIPOS_BASE||!cfg||!cfg.escola)return;const L=Array.isArray(cfg.escola.calTipos)?cfg.escola.calTipos:[];
  const k=JSON.stringify(L);if(k===CAL_TIPOS_K&&CAL_TIPOS)return;CAL_TIPOS_K=k;const o={};for(const [x,v] of Object.entries(CAL_TIPOS_BASE))if(x!=="outro")o[x]=v;
  for(const t of L)if(t&&t.k&&t.nome&&!o[t.k])o[t.k]=[t.nome,t.cor||"#64748b"];o.outro=CAL_TIPOS_BASE.outro;CAL_TIPOS=o}
const calD=s=>{const p=String(s||"").split("-");return new Date(+p[0],(+p[1]||1)-1,+p[2]||1,12)};
const calS=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const calMais=(s,n)=>{const d=calD(s);d.setDate(d.getDate()+n);return calS(d)};
const calHoje=()=>calS(new Date());
const calDM=(s,o)=>s?calD(s).toLocaleDateString("pt-PT",o||{day:"numeric",month:"short"}).replace(/\./g,""):"";
const calDMA=s=>s?calD(s).toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"}):"—";
const calDias=(a,b)=>Math.round((calD(b)-calD(a))/864e5);
const calPodeEditar=()=>!RO&&podePublicar();
function calAnoSel(){const E=escData();return E.anos.find(x=>x.id===CAL_ANO)||anoAtivo()}
function calDe(a){if(!a.calendario||typeof a.calendario!=="object")a.calendario={};const c=a.calendario;for(const k of["periodos","marcos","notas"])if(!Array.isArray(c[k]))c[k]=[];return c}
function calMunicipal(){const E=escData();if(!E.feriadoMunicipal||typeof E.feriadoMunicipal!=="object")E.feriadoMunicipal={data:"04-23",nome:"Dia de São Jorge (feriado municipal das Velas)"};return E.feriadoMunicipal}
function calPascoa(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  return new Date(y,Math.floor((h+l-7*m+114)/31)-1,((h+l-7*m+114)%31)+1,12)}
// feriados do ano letivo (1 de setembro a 31 de agosto): nacionais, o da Região Autónoma dos Açores e o municipal
function calFeriados(a){const y0=+a.ini||+(String(a.nome||"").match(/\d{4}/)||[])[0]||new Date().getFullYear(),out=[],mun=calMunicipal();
  const FIX=[["01-01","Ano Novo"],["04-25","Dia da Liberdade"],["05-01","Dia do Trabalhador"],["06-10","Dia de Portugal"],["08-15","Assunção de Nossa Senhora"],["10-05","Implantação da República"],["11-01","Dia de Todos os Santos"],["12-01","Restauração da Independência"],["12-08","Imaculada Conceição"],["12-25","Natal"]];
  for(const y of[y0,y0+1]){FIX.forEach(([md,n])=>out.push({data:y+"-"+md,nome:n,tipo:"nacional"}));const p=calPascoa(y),off=n=>{const d=new Date(p);d.setDate(d.getDate()+n);return calS(d)};
    out.push({data:off(-2),nome:"Sexta-feira Santa",tipo:"nacional"},{data:off(0),nome:"Páscoa",tipo:"nacional"},{data:off(60),nome:"Corpo de Deus",tipo:"nacional"},{data:off(50),nome:"Dia da Região Autónoma dos Açores",tipo:"regional"});
    if(mun&&/^\d{2}-\d{2}$/.test(mun.data||""))out.push({data:y+"-"+mun.data,nome:mun.nome||"Feriado municipal",tipo:"municipal"})}
  return out.filter(f=>f.data>=y0+"-09-01"&&f.data<=(y0+1)+"-08-31").sort((x,y)=>x.data.localeCompare(y.data))}
const calEhFeriado=(f,FER)=>f&&f.de&&(f.tipo==="feriado"||(f.de===(f.ate||f.de)&&FER.some(x=>x.data===f.de)));
// dias sem aulas: as interrupções e feriados de a.ferias e os feriados calculados
function calNaoLetivos(a){const M=new Map(),FER=calFeriados(a);
  for(const f of FER)M.set(f.data,{t:"fer",n:f.nome,calc:true});
  for(const f of a.ferias||[]){if(!f||!f.de)continue;const ate=f.ate||f.de,fer=calEhFeriado(f,FER);for(let d=f.de,i=0;d<=ate&&i<400;d=calMais(d,1),i++){const x=M.get(d);if(!x||x.calc)M.set(d,{t:fer?"fer":"int",n:f.nome||(fer?"Feriado":"Interrupção letiva")})}}
  return M}
function calPeriodos(a){return calDe(a).periodos.slice().sort((x,y)=>x.n-y.n)}
function calPeriodoDe(a,d,P){P=P||calPeriodos(a);const p=P.find(p=>d>=p.ini&&d<=p.fim);return p?p.n:0}
// dias letivos entre duas datas (dias úteis dentro do ano letivo, sem interrupções nem feriados)
function calLetivos(a,ini,fim,NL){NL=NL||calNaoLetivos(a);let n=0;const i0=a.inicio&&a.inicio>ini?a.inicio:ini,f0=a.fim&&a.fim<fim?a.fim:fim;
  for(let d=i0,k=0;d<=f0&&k<500;d=calMais(d,1),k++){const w=calD(d).getDay();if(w===0||w===6||NL.has(d))continue;n++}return n}
// turma de um marco (pelo id, ou pelo código e anos, para os marcos de turmas que ainda não existiam)
function calTurmaDoMarco(x,a){const E=escData();if(x.turmaId){const t=E.turmas.find(t=>t.id===x.turmaId);if(t)return t}
  if(!x.cod)return null;return E.turmas.find(t=>norm(t.cod)===norm(x.cod)&&(!x.ai||!t.anoIni||t.anoIni===x.ai)&&(!a||turmaNoAno(t,a)))||null}
function calMarcos(a,tid){const L=calDe(a).marcos;if(!tid)return L;return L.filter(m=>{const t=calTurmaDoMarco(m,a);return t?t.id===tid:false})}
function calFctDe(a,t){return calMarcos(a,t.id).filter(m=>m.tipo==="fct"&&m.de&&m.ate)}
const calDatasDe=m=>m.datas&&m.datas.length?m.datas:(m.tipo==="fct"||!m.ate||m.ate===m.de?[m.de]:(()=>{const o=[];for(let d=m.de,i=0;d<=m.ate&&i<60;d=calMais(d,1),i++)o.push(d);return o})());
const calDatasTxt=m=>{if(!m.de)return "—";if(m.datas&&m.datas.length>1){const d=m.datas;const mes=new Set(d.map(x=>x.slice(0,7))).size===1;return mes?d.map(x=>calD(x).getDate()).join(d.length>2?", ":" e ").replace(/, (\d+)$/," e $1")+" de "+calD(d[0]).toLocaleDateString("pt-PT",{month:"long",year:"numeric"}):d.map(x=>calDM(x)).join(", ")}
  return m.ate&&m.ate!==m.de?calDM(m.de,{day:"numeric",month:"short"})+" a "+calDMA(m.ate):calDMA(m.de)};
const calTag=t=>{const T=CAL_TIPOS[t]||CAL_TIPOS.outro;return `<span class="cal-tag" style="--c:${T[1]}">${esc(T[0])}</span>`};
function calTurmaCurta(t){if(!t)return "";const c=cursoById(t.cursoId);return t.cod+(c?" · "+c.nome.replace(/^T[ée]cnic[oa]\/?a?\s+(de|em)\s+/i,""):"")}

/* ---------- importação: lê, mostra o que vai entrar, e só grava em «Importar dados» ---------- */
async function calImportar(file){const tipo=/\.pdf$/i.test(file.name)||file.type==="application/pdf"?"pdf":"docx";
  escLinhaMsg("#calMsg","A ler "+esc(file.name)+"…","info");ovAbrir("A ler "+file.name);let R;
  try{await ovPasso(8,"A abrir o documento…");const buf=await file.arrayBuffer();
    await ovPasso(22,tipo==="pdf"?"A preparar o leitor de PDF…":"A abrir o documento do Word…");
    const linhas=tipo==="pdf"?await calTextoPdf(buf):await calTextoDocx(buf);
    await ovPasso(70,"A ler as datas…");R=calAnalisar(linhas,anoAtivo().ini);
    const nm=R.turmas.reduce((s,t)=>s+t.marcos.length,0);
    await ovPasso(100,`Encontrei ${R.periodos.length} período(s), ${R.interrupcoes.length} interrupção(ões) e ${nm} marco(s) de ${R.turmas.length} turma(s)`)}
  catch(e){ovFechar();escLinhaMsg("#calMsg","Não foi possível ler o documento: "+esc(e.message||String(e)),"bad");return}
  ovFechar(400);
  if(!R.periodos.length&&!R.interrupcoes.length&&!R.turmas.length){escLinhaMsg("#calMsg",`Não encontrei datas de calendário escolar em <b>${esc(file.name)}</b> (períodos, interrupções ou o detalhe das turmas).`,"bad");return}
  CAL_IMP={R,file:file.name,tipo};calPrever()}
// destino: o ano letivo do documento (ou o escolhido); devolve {a, novo}
function calImpAno(sel){const E=escData(),R=CAL_IMP.R;if(String(sel).startsWith("novo:")){const y=+sel.slice(5);return{a:E.anos.find(x=>+x.ini===y)||null,y,novo:!E.anos.some(x=>+x.ini===y)}}
  return{a:E.anos.find(x=>x.id===sel)||anoAtivo(),novo:false}}
function calPrever(selAno){if(!CAL_IMP)return;const {R,file}=CAL_IMP,E=escData(),at=anoAtivo();
  let sel=selAno;if(!sel){const a=R.y0&&E.anos.find(x=>+x.ini===R.y0);sel=a?a.id:R.y0&&!E.anos.some(x=>+x.ini===R.y0)?"novo:"+R.y0:at.id}
  const D=calImpAno(sel),a=D.a||Object.assign(novoAno(D.y),{ferias:[]}),aSim=Object.assign({},a,{inicio:R.inicio||a.inicio,fim:R.fim||a.fim,ini:+a.ini||R.y0});
  const opts=E.anos.slice().sort((x,y)=>y.ini-x.ini).map(x=>`<option value="${x.id}"${x.id===sel?" selected":""}>${esc(x.nome)}${x.id===at.id?" (ano ativo)":""}</option>`).join("")+(R.y0&&!E.anos.some(x=>+x.ini===R.y0)?`<option value="novo:${R.y0}"${sel==="novo:"+R.y0?" selected":""}>${R.y0}/${R.y0+1} (criar este ano letivo)</option>`:"");
  const FER=calFeriados(aSim),ferAg=(a.ferias||[]).slice();
  // interrupções: novas, iguais ou que mudam
  const intEst=R.interrupcoes.map(x=>{const chave=calNorm(x.nome).replace(/interrupcao (do |da )?/,"").trim();const ex=ferAg.find(f=>f&&calNorm(f.nome||"").includes(chave))||ferAg.find(f=>f&&f.de&&!(x.ate<f.de||x.de>(f.ate||f.de))&&!calEhFeriado(f,FER));
    return{x,ex,est:!ex?"nova":ex.de===x.de&&(ex.ate||ex.de)===x.ate?"igual":"muda"}});
  const NLsim=new Map();for(const f of FER)NLsim.set(f.data,1);for(const f of ferAg.concat(R.interrupcoes))if(f&&f.de)for(let d=f.de,i=0;d<=(f.ate||f.de)&&i<400;d=calMais(d,1),i++)NLsim.set(d,1);
  const util=d=>{const w=calD(d).getDay();return w>0&&w<6};
  const intDia=d=>R.interrupcoes.some(x=>d>=x.de&&d<=x.ate)||ferAg.some(f=>f&&f.de&&d>=f.de&&d<=(f.ate||f.de)&&!calEhFeriado(f,FER));
  const ferNovos=FER.filter(f=>util(f.data)&&(!aSim.inicio||f.data>=aSim.inicio)&&(!aSim.fim||f.data<=aSim.fim)&&!intDia(f.data)&&!ferAg.some(x=>x&&x.de===f.data&&(x.ate||x.de)===f.data));
  const letivos=(ini,fim)=>{let n=0;for(let d=ini,k=0;d<=fim&&k<500;d=calMais(d,1),k++)if(util(d)&&!NLsim.has(d))n++;return n};
  // turmas e marcos
  const cal=D.a?calDe(D.a):{marcos:[]};let nNovas=0;
  const turmas=R.turmas.map(T=>{const t=pcTurmaDe({turma:T.titulo},true,[],[]);if(!t)nNovas++;
    const ms=T.marcos.map(m=>{const ex=cal.marcos.find(x=>((t&&x.turmaId===t.id)||(!x.turmaId&&norm(x.cod)===norm(T.cod)))&&norm(x.nome)===norm(m.nome));return{m,est:!ex?"novo":ex.de===m.de&&ex.ate===m.ate?"igual":"muda",ex}});
    return{T,t,ms}});
  // avisos (o "tratamento" do documento)
  const av=[];const fmt=d=>calDM(d,{weekday:"short",day:"numeric",month:"short"});
  for(const p of R.periodos){const n=letivos(p.ini,p.fim);p.calc=n;if(p.diasDoc&&p.diasDoc!==n)av.push(`O documento diz <b>${p.diasDoc}</b> dias letivos no ${p.n}.º período; pelas contas (dias úteis sem feriados nem interrupções) são <b>${n}</b>. Confirme os feriados (o municipal está nas definições do calendário).`)}
  for(const {T,ms} of turmas){const by=k=>ms.map(x=>x.m).find(m=>k.test(calNorm(m.nome)));
    for(const {m} of ms){if(m.tipo==="fct"){if(aSim.fim&&m.ate>aSim.fim)av.push(`${esc(T.cod)}: a FCT acaba (${fmt(m.ate)}) depois do fim do ano letivo.`);continue}
      for(const d of calDatasDe(m)){const w=calD(d).getDay(),fe=FER.find(f=>f.data===d);
        if(w===0||w===6)av.push(`${esc(T.cod)} — ${esc(m.nome)}: ${fmt(d)} é ${w===0?"domingo":"sábado"}.`);
        else if(fe)av.push(`${esc(T.cod)} — ${esc(m.nome)}: ${fmt(d)} é feriado (${esc(fe.nome)}).`);
        else if(intDia(d))av.push(`${esc(T.cod)} — ${esc(m.nome)}: ${fmt(d)} calha numa interrupção letiva.`);
        if((aSim.inicio&&d<aSim.inicio)||(aSim.fim&&d>aSim.fim))av.push(`${esc(T.cod)} — ${esc(m.nome)}: ${fmt(d)} fica fora do ano letivo.`)}}
    const ent=by(/entrega.*(escrita|relatorio)|parte escrita/),ens=by(/ensaio/),apr=ms.map(x=>x.m).find(m=>/apresentacao/.test(calNorm(m.nome))&&!/ensaio/.test(calNorm(m.nome)));
    if(ent&&ens&&ens.de<ent.de)av.push(`<b>${esc(T.cod)}</b>: o «${esc(ens.nome)}» (${calDatasTxt(ens)}) é <b>antes</b> da «${esc(ent.nome)}» (${calDatasTxt(ent)}) — confirme se não é engano de mês.`);
    if(ens&&apr&&apr.de<ens.de)av.push(`<b>${esc(T.cod)}</b>: a «${esc(apr.nome)}» (${calDatasTxt(apr)}) é <b>antes</b> do «${esc(ens.nome)}» (${calDatasTxt(ens)}).`);
    if(ent&&apr&&apr.de<ent.de)av.push(`<b>${esc(T.cod)}</b>: a «${esc(apr.nome)}» é antes da «${esc(ent.nome)}».`)}
  const estTag=e=>e==="igual"?`<span class="tag ok">igual</span>`:e==="muda"?`<span class="tag warn">muda</span>`:`<span class="tag pend">novo</span>`;
  const nm=turmas.reduce((s,x)=>s+x.ms.filter(y=>y.est!=="igual").length,0);
  let h=`<div class="msg info cal-prev" style="margin:12px 0 0"><div class="cal-prevh"><div><b>${esc(file)}</b><br><span class="hint" style="margin:0">Calendário Escolar ${R.y0?R.y0+"/"+(R.y0+1):""}${R.base?" · "+esc(R.base):""}</span></div>
    <label>Ano letivo de destino<select id="calImpAno">${opts}</select></label></div>`;
  h+=`<h4>Ano letivo</h4><table class="rt"><thead><tr><th></th><th>No documento</th><th>Agora na EPISJ 360</th></tr></thead><tbody>
    <tr><td>Início das aulas</td><td><b>${calDMA(R.inicio)}</b></td><td>${D.a?calDMA(a.inicio):"(ano novo)"}</td></tr>
    <tr><td>Fim das aulas</td><td><b>${calDMA(R.fim)}</b></td><td>${D.a?calDMA(a.fim):"(ano novo)"}</td></tr></tbody></table>
    ${D.a&&(R.inicio&&R.inicio!==a.inicio||R.fim&&R.fim!==a.fim)?`<label class="cal-chk"><input type="checkbox" id="calImpDatas" checked> Atualizar o início e o fim das aulas de ${esc(a.nome)}</label>`:`<input type="checkbox" id="calImpDatas" checked hidden>`}`;
  if(R.periodos.length)h+=`<h4>Períodos letivos</h4><table class="rt"><thead><tr><th>Período</th><th>Início</th><th>Termo</th><th>Dias letivos</th></tr></thead><tbody>${R.periodos.map(p=>`<tr><td><b>${p.n}.º</b></td><td>${calDMA(p.ini)}</td><td>${calDMA(p.fim)}</td><td>${p.calc}${p.diasDoc?(p.diasDoc===p.calc?` <span class="tag ok">confere com o documento</span>`:` <span class="tag warn">o documento diz ${p.diasDoc}</span>`):` <span class="hint" style="margin:0">(o documento não indica)</span>`}</td></tr>`).join("")}</tbody></table>`;
  if(R.interrupcoes.length)h+=`<h4>Interrupções letivas</h4><table class="rt"><thead><tr><th>Interrupção</th><th>De</th><th>Até</th><th></th></tr></thead><tbody>${intEst.map(({x,ex,est})=>`<tr><td>${esc(x.nome)}</td><td>${calDMA(x.de)}</td><td>${calDMA(x.ate)}</td><td>${estTag(est)}${est==="muda"?` <span class="hint" style="margin:0">antes: ${calDM(ex.de)} a ${calDM(ex.ate||ex.de)}</span>`:""}</td></tr>`).join("")}</tbody></table>
    ${intEst.some(x=>x.est==="muda")?`<label class="cal-chk"><input type="checkbox" id="calImpInt" checked> Corrigir as datas das interrupções que mudaram (as antigas ficam no ponto de restauro)</label>`:`<input type="checkbox" id="calImpInt" checked hidden>`}`;
  h+=`<h4>Feriados que calham em dias de aulas</h4>${ferNovos.length?`<p class="hint" style="margin:0 0 6px">${ferNovos.map(f=>`${esc(f.nome)} (${calDM(f.data,{weekday:"short",day:"numeric",month:"short"})})`).join(" · ")}</p><label class="cal-chk"><input type="checkbox" id="calImpFer" checked> Acrescentar estes ${ferNovos.length} feriado(s) às interrupções e feriados (para o Horários360 não os contar como dias de aulas)</label>`:`<p class="hint" style="margin:0">Já estão todos registados.</p><input type="checkbox" id="calImpFer" hidden>`}`;
  if(turmas.length)h+=`<h4>Marcos das turmas</h4><div class="cal-prevt">${turmas.map(({T,t,ms})=>`<div class="cal-pt"><div class="cal-pth"><b>${esc(T.cod)}</b> ${esc(T.curso)} <span class="hint" style="margin:0">(${T.ai||""}–${T.af||""})</span> ${t?`<span class="tag ok">em Escola › Turmas</span>`:`<span class="tag warn">ainda não existe</span>`}</div>
      ${ms.map(({m,est,ex})=>`<div class="cal-pm">${calTag(m.tipo)}<span class="grow">${esc(m.nome)}</span><b>${calDatasTxt(m)}</b> ${estTag(est)}${est==="muda"?` <span class="hint" style="margin:0">antes: ${calDatasTxt(ex)}</span>`:""}</div>`).join("")||`<p class="hint" style="margin:0">Sem marcos.</p>`}</div>`).join("")}</div>
    ${nNovas?`<label class="cal-chk"><input type="checkbox" id="calImpTur" checked> Criar em Escola › Turmas as ${nNovas} turma(s) que ainda não existem (com o curso)</label>`:`<input type="checkbox" id="calImpTur" hidden>`}`;
  if(av.length)h+=`<h4>A confirmar</h4><ul class="cal-av">${av.map(x=>`<li>${x}</li>`).join("")}</ul>`;
  h+=`<div class="row" style="margin-top:12px"><span class="hint grow" style="margin:0">Nada é gravado antes de carregar em <b>Importar dados</b>. Não se apaga nada: o que já existe e não está no documento fica como está.${nm?` ${nm} marco(s) novo(s) ou com datas novas.`:""}</span><button class="b s" id="calImpX">Cancelar</button><button class="b imp" id="calImpOk">Importar dados</button></div></div>`;
  $("#calMsg").innerHTML=h;
  $("#calImpAno").onchange=e=>calPrever(e.target.value);
  $("#calImpX").onclick=()=>{CAL_IMP=null;escLinhaMsg("#calMsg","Importação cancelada — nada foi alterado.","info")};
  $("#calImpOk").onclick=()=>calAplicar({ano:$("#calImpAno").value,datas:$("#calImpDatas").checked,int:$("#calImpInt").checked,fer:$("#calImpFer").checked,tur:$("#calImpTur").checked,ferNovos})}
async function calAplicar(o){if(!CAL_IMP||!calPodeEditar())return;const {R,file,tipo}=CAL_IMP,E=escData();
  ponto("Antes de importar o calendário escolar de "+file);ovAbrir("A importar o calendário escolar");await ovPasso(6,"A criar um ponto de restauro…");
  let D=calImpAno(o.ano),a=D.a,anoNovo=false;if(!a){a=novoAno(D.y);E.anos.push(a);anoNovo=true}
  const cal=calDe(a),FER=calFeriados(a);let nP=0,nI=0,nF=0,nM=0,nMu=0;const novasT=[],novosC=[];
  await ovPasso(20,"Início e fim das aulas…");
  if(o.datas||anoNovo){if(R.inicio)a.inicio=R.inicio;if(R.fim)a.fim=R.fim}
  await ovPasso(32,"Períodos letivos…");
  for(const p of R.periodos){const ex=cal.periodos.find(x=>x.n===p.n);if(ex){if(ex.ini!==p.ini||ex.fim!==p.fim||ex.diasDoc!==p.diasDoc){ex.ini=p.ini;ex.fim=p.fim;ex.diasDoc=p.diasDoc;nP++}}else{cal.periodos.push({id:uid(),n:p.n,ini:p.ini,fim:p.fim,diasDoc:p.diasDoc});nP++}}
  await ovPasso(45,"Interrupções letivas…");
  if(!Array.isArray(a.ferias))a.ferias=[];
  for(const x of R.interrupcoes){const chave=calNorm(x.nome).replace(/interrupcao (do |da )?/,"").trim();
    const ex=a.ferias.find(f=>f&&calNorm(f.nome||"").includes(chave))||a.ferias.find(f=>f&&f.de&&!(x.ate<f.de||x.de>(f.ate||f.de))&&!calEhFeriado(f,FER));
    if(!ex){a.ferias.push({id:"cal-i-"+x.de,nome:x.nome,de:x.de,ate:x.ate,tipo:"interrupcao"});nI++}
    else if(o.int&&(ex.de!==x.de||(ex.ate||ex.de)!==x.ate)){ex.de=x.de;ex.ate=x.ate;if(!ex.tipo)ex.tipo="interrupcao";nI++}}
  await ovPasso(55,"Feriados…");
  if(o.fer)for(const f of o.ferNovos||[]){if(a.ferias.some(x=>x&&x.de===f.data&&(x.ate||x.de)===f.data))continue;a.ferias.push({id:"cal-f-"+f.data,nome:f.nome,de:f.data,ate:f.data,tipo:"feriado"});nF++}
  a.ferias.sort((x,y)=>String(x.de||"9").localeCompare(String(y.de||"9")));
  let ni=0;for(const T of R.turmas){ni++;await ovPasso(58+34*ni/Math.max(1,R.turmas.length),`Turma ${ni} de ${R.turmas.length}: ${T.cod}`);
    const t=pcTurmaDe({turma:T.titulo},!o.tur,novasT,novosC);
    for(const m of T.marcos){const ex=cal.marcos.find(x=>((t&&x.turmaId===t.id)||(!x.turmaId&&norm(x.cod)===norm(T.cod)))&&norm(x.nome)===norm(m.nome));
      if(ex){if(ex.de!==m.de||ex.ate!==m.ate||JSON.stringify(ex.datas||null)!==JSON.stringify(m.datas||null)){ex.de=m.de;ex.ate=m.ate;ex.datas=m.datas||null;nMu++}if(t&&!ex.turmaId)ex.turmaId=t.id}
      else{cal.marcos.push({id:uid(),turmaId:t?t.id:"",cod:T.cod,ai:T.ai||null,af:T.af||null,tipo:m.tipo,nome:m.nome,de:m.de,ate:m.ate,datas:m.datas||null,obs:""});nM++}}}
  cal.fonte={nome:file,tipo,em:Date.now(),por:String(EU&&EU.email||"")};if(R.base)cal.base=R.base;if(R.notas.length)cal.notas=[...new Set(cal.notas.concat(R.notas))];
  await ovPasso(94,"A guardar…");save();ponto("Depois de importar o calendário escolar de "+file);try{nuvemAgendar()}catch(e){}
  CAL_IMP=null;CAL_ANO=a.id;try{localStorage.setItem("cal_ano",a.id)}catch(e){}
  try{escRender();esRecarregar()}catch(e){}renderCal();await ovPasso(100,"Guardado ✓");ovFechar(450);
  escLinhaMsg("#calMsg",`✓ Calendário de <b>${esc(a.nome)}</b> importado${anoNovo?" (ano letivo criado)":""}: ${nP} período(s), ${nI} interrupção(ões)${nF?`, ${nF} feriado(s)`:""}, ${nM} marco(s) novo(s)${nMu?` e ${nMu} com datas corrigidas`:""}.`+
    (novasT.length?`<br>Turmas criadas: ${esc(novasT.join(", "))}.`:"")+(novosC.length?`<br>Cursos criados: ${esc(novosC.join(", "))} — ligue-os ao catálogo em <b>Escola › Cursos</b>.`:"")+
    `<br><span class="hint" style="margin:0">O Horários360 já conta com as interrupções e os feriados; o Crono360 usa a FCT de cada turma.</span>`,"ok")}

/* ---------- desenho da secção ---------- */
function renderCal(){if(!$("#cal"))return;const E=escData(),a=calAnoSel(),cal=calDe(a),ed=calPodeEditar(),pf=perfilAtual();
  if(CAL_ANO&&!E.anos.some(x=>x.id===CAL_ANO))CAL_ANO="";
  $("#calAno").innerHTML=anosOrd().slice().reverse().map(x=>`<option value="${x.id}"${x.id===a.id?" selected":""}>${esc(x.nome)}${x.id===E.ativo?" (ativo)":""}</option>`).join("");
  calTiposSync();$("#calImp").style.display=ed?"":"none";if($("#calTiposBtn"))$("#calTiposBtn").style.display=ed?"":"none";$("#calMunL").style.display=ed?"":"none";
  const mun=calMunicipal();if(document.activeElement!==$("#calMunD"))$("#calMunD").value=mun.data?calD("2000-"+mun.data).toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"}):"";if(document.activeElement!==$("#calMunN"))$("#calMunN").value=mun.nome||"";
  // turma (o formando vê só a sua)
  const T=turmasDoAno(a),minha=pf==="form"?(T.find(t=>norm(t.cod)===norm(EU&&EU.turma||""))||null):null;
  if(minha)CAL_T=minha.id;else if(CAL_T&&!T.some(t=>t.id===CAL_T))CAL_T="";
  $("#calTurma").innerHTML=(minha?"":`<option value="">Toda a escola</option>`)+(minha?[minha]:T).map(t=>`<option value="${t.id}"${t.id===CAL_T?" selected":""}>${esc(calTurmaCurta(t))}</option>`).join("");$("#calTurma").disabled=!!minha;
  $("#calTipo").innerHTML=`<option value="">Todos os marcos</option>`+Object.entries(CAL_TIPOS).map(([k,v])=>`<option value="${k}"${k===CAL_TIPO?" selected":""}>${esc(v[0])}</option>`).join("");
  // informação da fonte
  const f=cal.fonte;$("#calInfo").innerHTML=(f?`<p class="hint" style="margin:8px 0 0">Importado de <b>${esc(f.nome)}</b> a ${new Date(f.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}${f.por?" por "+esc(f.por):""}.${cal.base?" De acordo com a "+esc(cal.base)+".":""}</p>`:(ed?`<p class="hint" style="margin:8px 0 0">Ainda sem calendário importado em ${esc(a.nome)}. Carregue em <b>Importar documento</b> e escolha o calendário escolar em Word (.docx) ou PDF.</p>`:""))
    +(cal.notas.length?`<p class="hint" style="margin:4px 0 0">${cal.notas.map(n=>"* "+esc(n)).join("<br>")}</p>`:"");
  const NL=calNaoLetivos(a),P=calPeriodos(a),hj=calHoje();
  // indicadores
  const tot=a.inicio&&a.fim?calLetivos(a,a.inicio,a.fim,NL):0,pas=a.inicio&&a.fim&&hj>=a.inicio?calLetivos(a,a.inicio,hj<a.fim?hj:a.fim,NL):0,pa=calPeriodoDe(a,hj,P),nlh=NL.get(hj);
  const Mt=calMarcos(a,CAL_T),prox=Mt.filter(m=>(m.ate||m.de)>=hj).sort((x,y)=>x.de.localeCompare(y.de))[0];
  $("#calTiles").innerHTML=[[calDM(a.inicio,{day:"numeric",month:"short"})||"—","Início das aulas"],[calDM(a.fim,{day:"numeric",month:"short"})||"—","Fim das aulas"],[tot?`${pas} / ${tot}`:"—","Dias letivos dados / do ano"],
    [nlh?(nlh.t==="int"?"Interrupção":"Feriado"):pa?pa+".º período":hj<(a.inicio||"")?"Antes das aulas":"—","Hoje"],[prox?calDM(prox.de):"—",prox?"Próximo: "+prox.nome.slice(0,40):"Próximo marco"]].map(([v,l])=>`<div class="tile"><div class="v">${esc(v)}</div><div class="l">${esc(l)}</div></div>`).join("");
  // períodos, interrupções e feriados
  const FER=calFeriados(a),intL=(a.ferias||[]).filter(x=>x&&x.de&&!calEhFeriado(x,FER)).sort((x,y)=>x.de.localeCompare(y.de)),ferU=FER.filter(x=>{const w=calD(x.data).getDay();return w>0&&w<6&&(!a.inicio||x.data>=a.inicio)&&(!a.fim||x.data<=a.fim)});
  const ferFalta=ferU.filter(x=>!(a.ferias||[]).some(f=>f&&f.de===x.data&&(f.ate||f.de)===x.data)&&!(a.ferias||[]).some(f=>f&&f.de&&x.data>=f.de&&x.data<=(f.ate||f.de)));
  $("#calPer").innerHTML=(P.length?`<table class="rt"><thead><tr><th>Período</th><th>Início</th><th>Termo</th><th>Dias letivos</th></tr></thead><tbody>${P.map(p=>{const n=calLetivos(a,p.ini,p.fim,NL);return `<tr${pa===p.n?' class="on"':""}><td><b>${p.n}.º</b></td><td>${calDMA(p.ini)}</td><td>${calDMA(p.fim)}</td><td><b>${n}</b>${p.diasDoc?(p.diasDoc===n?` <span class="tag ok" title="O documento indica ${p.diasDoc}">confere</span>`:` <span class="tag warn">documento: ${p.diasDoc}</span>`):""}</td></tr>`}).join("")}</tbody></table>`:`<p class="hint">Sem períodos letivos registados${ed?" — importe o documento do calendário":""}.</p>`)
    +`<div class="cal-cols"><div><h4>Interrupções letivas</h4>${intL.length?intL.map(x=>`<div class="cal-li"><i style="background:#f59e0b"></i><span class="grow">${esc(x.nome||"Interrupção")}</span><b>${calDM(x.de)}${x.ate&&x.ate!==x.de?" a "+calDM(x.ate):""}</b></div>`).join(""):`<p class="hint">Sem interrupções.</p>`}</div>
      <div><h4>Feriados em dias úteis</h4>${ferU.length?ferU.map(x=>`<div class="cal-li"><i style="background:#ef4444"></i><span class="grow">${esc(x.nome)}</span><b>${calDM(x.data,{weekday:"short",day:"numeric",month:"short"})}</b></div>`).join(""):`<p class="hint">Sem feriados em dias úteis.</p>`}</div></div>`
    +(ed&&ferFalta.length?`<div class="msg info" style="margin-top:10px">${ferFalta.length} feriado(s) ainda não estão em <b>Interrupções letivas e feriados</b>: o Horários360 conta-os como dias de aulas. <button class="b s" id="calFerAdd" style="margin-left:6px">Acrescentar</button></div>`:"")
    +(ed?`<p class="hint" style="margin:10px 0 0">As interrupções e os feriados editam-se em <a href="#" data-calir="anos">Anos letivos › Interrupções letivas e feriados</a>.</p>`:"");
  const fb=$("#calFerAdd");if(fb)fb.onclick=()=>{ponto("Antes de acrescentar feriados ao calendário");ferFalta.forEach(x=>a.ferias.push({id:"cal-f-"+x.data,nome:x.nome,de:x.data,ate:x.data,tipo:"feriado"}));a.ferias.sort((x,y)=>String(x.de).localeCompare(String(y.de)));save();try{esRecarregar()}catch(e){}renderCal();toast(ferFalta.length+" feriado(s) acrescentado(s)")};
  calGrelha(a,NL,P);calMarcosUI(a);calLinha(a,NL)}
// grelha do ano: um quadro por mês, com períodos, interrupções, feriados, fins de semana, FCT e marcos da turma escolhida
function calGrelha(a,NL,P){const y0=+a.ini,hj=calHoje(),t=CAL_T?escData().turmas.find(x=>x.id===CAL_T):null,M=calMarcos(a,CAL_T).filter(m=>!CAL_TIPO||m.tipo===CAL_TIPO);
  const porDia=new Map(),fct=[];for(const m of M){if(m.tipo==="fct"&&m.de&&m.ate){if(CAL_T)fct.push(m);continue}for(const d of calDatasDe(m))(porDia.get(d)||porDia.set(d,[]).get(d)).push(m)}
  const emFct=d=>fct.some(m=>d>=m.de&&d<=m.ate);
  const i0=a.inicio||y0+"-09-01",f0=a.fim||(y0+1)+"-07-31",m0=calD(i0),m1=calD(f0);let h="";
  for(let d=new Date(m0.getFullYear(),m0.getMonth(),1,12);d<=m1;d.setMonth(d.getMonth()+1)){const y=d.getFullYear(),mo=d.getMonth(),pre=calS(d).slice(0,7),nd=new Date(y,mo+1,0).getDate(),off=(new Date(y,mo,1).getDay()+6)%7;
    let n=0;let cel="";for(let i=0;i<off;i++)cel+=`<span></span>`;
    for(let dd=1;dd<=nd;dd++){const s=pre+"-"+String(dd).padStart(2,"0"),w=calD(s).getDay(),x=NL.get(s),dentro=(!a.inicio||s>=a.inicio)&&(!a.fim||s<=a.fim),p=calPeriodoDe(a,s,P),ms=porDia.get(s)||[];
      const cls=[w===0||w===6?"fds":"",x?(x.t==="fer"?"fer":"int"):"",!x&&w>0&&w<6&&dentro?"let p"+(p||0):"",!dentro?"fora":"",s===hj?"hoje":"",emFct(s)&&w>0&&w<6?"fct":"",s===CAL_DIA?"sel":""].filter(Boolean).join(" ");
      if(!x&&w>0&&w<6&&dentro)n++;
      const tit=[calD(s).toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"}),x?x.n:(w===0||w===6)?"fim de semana":dentro?(p?"dia letivo · "+p+".º período":"dia letivo"):"fora do ano letivo",emFct(s)?"FCT"+(t?"":" (alguma turma)"):"",...ms.map(m=>{const tt=calTurmaDoMarco(m,a);return (tt&&!CAL_T?tt.cod+": ":"")+m.nome})].filter(Boolean).join(" · ");
      cel+=`<button class="${cls}" data-cald="${s}" title="${esc(tit)}">${dd}${ms.length?`<span class="cal-pts">${[...new Set(ms.map(m=>m.tipo))].slice(0,3).map(k=>`<i style="background:${(CAL_TIPOS[k]||CAL_TIPOS.outro)[1]}"></i>`).join("")}</span>`:""}</button>`}
    h+=`<div class="cal-m"><h4><span>${d.toLocaleDateString("pt-PT",{month:"long"})}${mo===0||mo===8?" "+y:""}</span><small>${n?n+" dias letivos":""}</small></h4><div class="cal-g">${["S","T","Q","Q","S","S","D"].map(x=>`<i>${x}</i>`).join("")}${cel}</div></div>`}
  $("#calGrid").innerHTML=`<div class="cal-ano">${h}</div><div class="cal-leg"><span><b class="let p1"></b>1.º período</span><span><b class="let p2"></b>2.º período</span><span><b class="let p3"></b>3.º período</span><span><b class="int"></b>Interrupção</span><span><b class="fer"></b>Feriado</span><span><b class="fds"></b>Fim de semana</span><span><b class="fct"></b>FCT${t?"":" (escolha a turma)"}</span>${Object.entries(CAL_TIPOS).filter(([k])=>k!=="fct").map(([k,v])=>`<span><i style="background:${v[1]}"></i>${esc(v[0])}</span>`).join("")}</div>`;
  calDiaInfo(a,NL,P)}
function calDiaInfo(a,NL,P){const el=$("#calDia");if(!el)return;if(!CAL_DIA){el.innerHTML=`<p class="hint" style="margin:8px 0 0">Carregue num dia para ver o que acontece.</p>`;return}
  const s=CAL_DIA,w=calD(s).getDay(),x=NL.get(s),p=calPeriodoDe(a,s,P),dentro=(!a.inicio||s>=a.inicio)&&(!a.fim||s<=a.fim);
  const ms=calMarcos(a,CAL_T).filter(m=>calDatasDe(m).includes(s)||(m.tipo==="fct"&&m.de<=s&&m.ate>=s));
  el.innerHTML=`<div class="cal-dia"><b>${esc(calD(s).toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long",year:"numeric"}))}</b> — ${x?esc(x.n):(w===0||w===6)?"fim de semana":dentro?"dia letivo"+(p?" do "+p+".º período":""):"fora do ano letivo"}
    ${ms.length?ms.map(m=>{const t=calTurmaDoMarco(m,a);return `<div class="cal-pm">${calTag(m.tipo)}<span class="grow">${t?`<b>${esc(t.cod)}</b> · `:m.cod?`<b>${esc(m.cod)}</b> · `:""}${esc(m.nome)}</span><span>${calDatasTxt(m)}</span></div>`}).join(""):`<span class="hint" style="margin:0"> · sem marcos${CAL_T?" desta turma":""}.</span>`}</div>`}
// marcos das turmas: lista (com edição para a Direção) e formulário para acrescentar
function calMarcosUI(a){const ed=calPodeEditar(),hj=calHoje(),E=escData(),T=turmasDoAno(a);
  const L=calMarcos(a,CAL_T).filter(m=>!CAL_TIPO||m.tipo===CAL_TIPO).slice().sort((x,y)=>{const tx=calTurmaDoMarco(x,a),ty=calTurmaDoMarco(y,a);return COLL_PTN.compare(String(tx?tx.cod:x.cod||"~"),String(ty?ty.cod:y.cod||"~"))||String(x.de).localeCompare(String(y.de))});
  const falta=m=>{const fim=m.ate||m.de;if(!m.de)return "";if(fim<hj)return `<span class="hint" style="margin:0">passou</span>`;if(m.de<=hj)return `<span class="tag ok">a decorrer</span>`;const n=calDias(hj,m.de);return `<span class="${n<=7?"tag warn":"hint"}" style="margin:0">daqui a ${n} dia${n===1?"":"s"}</span>`};
  let h=`<table class="rt cal-mt"><thead><tr><th style="width:120px">Turma</th><th style="width:110px">Tipo</th><th>Marco</th><th style="width:${ed?"300":"210"}px">Datas</th><th style="width:120px">Quando</th>${ed?'<th style="width:40px"></th>':""}</tr></thead><tbody>`;
  h+=L.map(m=>{const t=calTurmaDoMarco(m,a),tc=t?`<b>${esc(t.cod)}</b>`:`<b>${esc(m.cod||"—")}</b>${m.cod?` <span class="tag warn" title="Esta turma não existe em Escola › Turmas">?</span>`:""}`;
    if(!ed)return `<tr><td>${tc}</td><td>${calTag(m.tipo)}</td><td>${esc(m.nome)}${m.obs?`<div class="hint" style="margin:0">${esc(m.obs)}</div>`:""}</td><td>${calDatasTxt(m)}</td><td>${falta(m)}</td></tr>`;
    return `<tr data-calm="${esc(m.id)}"><td>${tc}</td><td><select data-cmk="tipo">${Object.entries(CAL_TIPOS).map(([k,v])=>`<option value="${k}"${k===m.tipo?" selected":""}>${esc(v[0])}</option>`).join("")}</select></td>
      <td><input type="text" data-cmk="nome" value="${esc(m.nome)}"></td><td class="cal-dt"><input type="date" data-cmk="de" value="${esc(m.de||"")}"><span>a</span><input type="date" data-cmk="ate" value="${esc(m.ate||"")}">${m.datas&&m.datas.length>1?`<div class="hint" style="margin:2px 0 0">dias: ${esc(m.datas.map(x=>calD(x).getDate()).join(", "))}</div>`:""}</td><td>${falta(m)}</td><td><button class="x" data-calmdel title="Apagar este marco">×</button></td></tr>`}).join("")
    ||`<tr><td colspan="${ed?6:5}" class="hint">Sem marcos${CAL_T?" desta turma":""}${CAL_TIPO?" deste tipo":""}.</td></tr>`;
  h+=`</tbody></table>`;
  if(ed)h+=`<form class="row cal-mf" id="calMForm" autocomplete="off"><label style="width:170px">Turma<select name="t">${T.map(t=>`<option value="${t.id}"${t.id===CAL_T?" selected":""}>${esc(t.cod)}</option>`).join("")}</select></label>
    <label style="width:140px">Tipo<select name="tipo">${Object.entries(CAL_TIPOS).map(([k,v])=>`<option value="${k}">${esc(v[0])}</option>`).join("")}</select></label>
    <label class="grow">Marco<input type="text" name="nome" placeholder="ex.: 3.º Momento de avaliação" required></label><label>De<input type="date" name="de" required></label><label>Até<input type="date" name="ate"></label><button class="b" type="submit" style="align-self:flex-end">Acrescentar marco</button></form>`;
  $("#calMarcos").innerHTML=h}
// linha do tempo das turmas: FCT em barra, marcos em losango, interrupções a sombreado, hoje a traço
// 0.9.159: modo ampliado (body.callamplo) — ecrã inteiro com períodos letivos e dias letivos, interrupções e feriados com o nome,
// semanas marcadas, nome do curso de cada turma, o nome e a data de cada marco escritos ao lado e a duração da FCT
function calLinha(a,NL){const el=$("#calLinha");if(!el)return;const y0=+a.ini,i0=a.inicio||y0+"-09-01",f0=a.fim||(y0+1)+"-07-31",tot=Math.max(1,calDias(i0,f0)+1),hj=calHoje();
  const amp=document.body.classList.contains("callamplo");calLAmpSync();
  const x=d=>Math.max(0,Math.min(100,calDias(i0,d)/tot*100)),W=(d0,d1)=>Math.max(.35,(calDias(d0,d1)+1)/tot*100);
  const T=turmasDoAno(a).filter(t=>!CAL_T||t.id===CAL_T),FER=calFeriados(a),ints=(a.ferias||[]).filter(f=>f&&f.de&&!calEhFeriado(f,FER));
  const meses=[];let mi=0;for(let d=new Date(calD(i0).getFullYear(),calD(i0).getMonth(),1,12);calS(d)<=f0;d.setMonth(d.getMonth()+1)){const s=calS(d)<i0?i0:calS(d),nx=new Date(d.getFullYear(),d.getMonth()+1,0,12),e=calS(nx)>f0?f0:calS(nx);
    const n=d.toLocaleDateString("pt-PT",{month:amp&&W(s,e)>=7?"long":"short"}).replace(".","");meses.push(amp?`<span class="${mi++%2?"alt":""}" style="left:${x(s)}%;width:${W(s,e)}%">${n.charAt(0).toUpperCase()+n.slice(1)}${(d.getMonth()===0||!meses.length)&&W(s,e)>=7?" "+d.getFullYear():""}</span>`:`<span style="left:${x(s)}%">${n.charAt(0).toUpperCase()+n.slice(1)}</span>`)}
  let fundo=ints.map(f=>`<i class="cal-ls" style="left:${x(f.de)}%;width:${W(f.de,f.ate||f.de)}%" title="${esc(f.nome||"Interrupção")}"></i>`).join("");
  if(amp){const sem=[];for(let d=i0,k=0;d<=f0&&k<60;d=calMais(d,1)){if(calD(d).getDay()===1){sem.push(`<i class="cal-lw" style="left:${x(d)}%"></i>`);k++}}
    fundo=sem.join("")+fundo+FER.filter(f=>f.data>=i0&&f.data<=f0&&calD(f.data).getDay()%6).map(f=>`<i class="cal-lf" style="left:${x(f.data)}%" title="${esc(f.nome+" · "+calDMA(f.data))}"></i>`).join("")}
  const sombra=fundo+(hj>=i0&&hj<=f0?`<i class="cal-lh" style="left:${x(hj)}%" title="Hoje"></i>`:"");
  if(!T.length){el.innerHTML=`<p class="hint">Sem turmas neste ano letivo.</p>`;return}
  let topo=`<div class="cal-lr cal-lm"><b></b><div class="cal-lt">${meses.join("")}</div></div>`;
  if(amp){const P=calPeriodos(a),dm=d=>calDM(d,{day:"numeric",month:"numeric"});
    topo+=`<div class="cal-lr cal-lp"><b>Períodos</b><div class="cal-lt">${P.map(p=>`<span style="left:${x(p.ini)}%;width:${W(p.ini,p.fim)}%" class="p${p.n}" title="${esc(p.n+".º período · "+calDMA(p.ini)+" a "+calDMA(p.fim))}">${p.n}.º período · ${calLetivos(a,p.ini,p.fim,NL)} dias letivos</span>`).join("")||`<em class="hint">Sem períodos no calendário</em>`}</div></div>`;
    topo+=`<div class="cal-lr cal-li2"><b>Interrupções</b><div class="cal-lt">${ints.map(f=>`<span style="left:${x(f.de)}%;width:${W(f.de,f.ate||f.de)}%" title="${esc((f.nome||"Interrupção")+" · "+dm(f.de)+(f.ate&&f.ate!==f.de?" a "+dm(f.ate):""))}">${W(f.de,f.ate||f.de)>=2.5?esc(f.nome||"Interrupção"):""}</span>`).join("")}${hj>=i0&&hj<=f0?`<i class="cal-lhj" style="left:${x(hj)}%">hoje · ${esc(dm(hj))}</i>`:""}</div></div>`}
  el.innerHTML=(amp?`<div class="cal-lleg">${Object.entries(CAL_TIPOS).map(([k,v])=>`<span><i style="--c:${esc(v[1])}" class="${k==="fct"?"b":""}"></i>${esc(v[0])}</span>`).join("")}<span><i class="s"></i>Interrupção letiva</span><span><i class="f"></i>Feriado</span><span><i class="h"></i>Hoje</span></div>`:"")+
  `<div class="cal-l${amp?" amp":""}">${topo}${T.map(t=>{const M=calMarcos(a,t.id).filter(m=>!CAL_TIPO||m.tipo===CAL_TIPO).slice().sort((p,q)=>String(p.de).localeCompare(String(q.de)));let k=0;
    const it=M.map(m=>{const c=(CAL_TIPOS[m.tipo]||CAL_TIPOS.outro)[1],txt=calDatasTxt(m).replace(/<[^>]+>/g,""),tit=esc(m.nome+" · "+txt);
      if(m.tipo==="fct"&&m.ate&&m.ate!==m.de){const dl=amp?calLetivos(a,m.de,m.ate,NL):0;return `<i class="cal-lb" style="left:${x(m.de)}%;width:${W(m.de,m.ate)}%;--c:${c}" title="${tit}"><span>${amp?`FCT · ${esc(calDM(m.de,{day:"numeric",month:"numeric"}))} a ${esc(calDM(m.ate,{day:"numeric",month:"numeric"}))} · ${dl} dias úteis`:"FCT"}</span></i>`}
      const D=calDatasDe(m),cls=amp?(k++%2?" bx":" cm"):"";
      return D.map((d,di)=>`<i class="cal-ld${cls}" style="left:${x(d)}%;--c:${c}" title="${tit}"></i>`).join("")+(amp?`<em class="cal-ldt${cls}" style="left:${x(D[0])}%;--c:${c}" title="${tit}">${esc(m.nome)} <small>${esc(D.length>1?calDM(D[0],{day:"numeric",month:"numeric"})+"…":calDM(D[0],{day:"numeric",month:"numeric"}))}</small></em>`:"")}).join("");
    return `<div class="cal-lr"><b title="${esc(turmaNome(t))}">${esc(t.cod)}${amp?`<small>${esc((()=>{const c=cursoById(t.cursoId);const n=c?c.nome:turmaNome(t);return n===t.cod?"":String(n).replace(new RegExp("^"+String(t.cod).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*[-–·]\\s*"),"")})())}</small>`:""}</b><div class="cal-lt">${sombra}${it}</div></div>`}).join("")}</div>`}
function calLAmpSync(){const b=document.getElementById("calLAmp");if(b)b.textContent=document.body.classList.contains("callamplo")?"Sair do modo ampliado":"Ampliar"}
function calLAmpSet(on){document.body.classList.toggle("callamplo",!!on);try{const a=calAnoSel();calLinha(a,calNaoLetivos(a))}catch(e){calLAmpSync()}}
(function(){const b=document.getElementById("calLAmp");if(b)b.onclick=()=>calLAmpSet(!document.body.classList.contains("callamplo"));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("callamplo"))calLAmpSet(false)})})();

/* ---------- PDF e Outlook (.ics) ---------- */
async function calPdf(){const a=calAnoSel(),cal=calDe(a),NL=calNaoLetivos(a),P=calPeriodos(a),FER=calFeriados(a),J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});
  const t=CAL_T?escData().turmas.find(x=>x.id===CAL_T):null;
  let y=pdfTitulo(doc,"Calendário Escolar "+a.nome,`${escData().nome}${t?" · Turma "+turmaNome(t):""} · ${calDMA(a.inicio)} a ${calDMA(a.fim)}${cal.base?" · "+cal.base:""}`);
  if(P.length){y=pdfTabela(doc,y,["Período letivo","Início","Termo","Dias letivos"],P.map(p=>[p.n+".º",calDMA(p.ini),calDMA(p.fim),String(calLetivos(a,p.ini,p.fim,NL))]).map(r=>r.map(pdfTxt)),{3:{halign:"right",cellWidth:26}})+8}
  const ints=(a.ferias||[]).filter(f=>f&&f.de&&!calEhFeriado(f,FER));
  if(ints.length){y=pdfTabela(doc,y,["Interrupção letiva","De","Até"],ints.map(f=>[f.nome||"Interrupção",calDMA(f.de),calDMA(f.ate||f.de)].map(pdfTxt)))+8}
  const ferU=FER.filter(x=>{const w=calD(x.data).getDay();return w>0&&w<6&&(!a.inicio||x.data>=a.inicio)&&(!a.fim||x.data<=a.fim)});
  if(ferU.length){y=pdfTabela(doc,y,["Feriado","Data"],ferU.map(f=>[f.nome,calD(f.data).toLocaleDateString("pt-PT",{weekday:"long",day:"numeric",month:"long"})].map(pdfTxt)))+8}
  const TT=turmasDoAno(a).filter(x=>!t||x.id===t.id);const semT=t?[]:cal.marcos.filter(m=>!calTurmaDoMarco(m,a));
  for(const tu of TT){const M=calMarcos(a,tu.id).slice().sort((p,q)=>String(p.de).localeCompare(String(q.de)));if(!M.length)continue;
    if(y>297-PDF_BOT-34){doc.addPage();y=PDF_TOP+6}doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(25);doc.text(pdfTxt(turmaNome(tu)),14,y);
    y=pdfTabela(doc,y+3,["Marco","Datas"],M.map(m=>[m.nome,calDatasTxt(m).replace(/<[^>]+>/g,"")].map(pdfTxt)),{1:{cellWidth:70}})+8}
  if(semT.length){if(y>297-PDF_BOT-34){doc.addPage();y=PDF_TOP+6}doc.setFont("helvetica","bold");doc.setFontSize(11);doc.text("Outras turmas",14,y);y=pdfTabela(doc,y+3,["Turma","Marco","Datas"],semT.map(m=>[m.cod||"",m.nome,calDatasTxt(m)].map(pdfTxt)))+8}
  if(cal.notas.length){if(y>297-PDF_BOT-20){doc.addPage();y=PDF_TOP+6}doc.setFont("helvetica","italic");doc.setFontSize(8.5);doc.setTextColor(90);cal.notas.forEach((n,i)=>doc.text(pdfTxt("* "+n),14,y+i*4.5))}
  pdfMoldura(doc,"Escola Profissional da Ilha de São Jorge · EPISJ 360 · Calendário Escolar "+a.nome);
  doc.save(pdfTxt(`Calendario Escolar ${a.nome.replace("/","-")}${t?" - "+t.cod:""}.pdf`))}
/* 0.9.134: janela «Tipos de marcos» — os seis da app ficam fixos; os da escola mudam-se aqui (nome, cor) e saem só se nenhum marco os usar */
const CT_PAL=["#2563eb","#0891b2","#059669","#65a30d","#ca8a04","#ea580c","#dc2626","#db2777","#9333ea","#4f46e5","#0f766e","#475569"];
function calTiposUsos(){const n={};for(const a of escData().anos)for(const m of calDe(a).marcos||[])n[m.tipo]=(n[m.tipo]||0)+1;return n}
function calTiposJanela(){if(!calPodeEditar())return;const e=escData();if(!Array.isArray(e.calTipos))e.calTipos=[];
  const box=document.createElement("div");box.className="fd-modal";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-labelledby","ctT");document.body.appendChild(box);
  let cor=CT_PAL.find(c=>!Object.values(CAL_TIPOS).some(v=>v[1]===c))||CT_PAL[0];
  const fechar=()=>{box.remove();document.removeEventListener("keydown",esc_)};const esc_=ev=>{if(ev.key==="Escape")fechar()};document.addEventListener("keydown",esc_);
  const gravar=()=>{CAL_TIPOS_K="";calTiposSync();save();renderCal()};
  const desenhar=()=>{const U=calTiposUsos(),uso=k=>U[k]?`${U[k]} marco${U[k]===1?"":"s"}`:"sem marcos";
    box.innerHTML=`<div class="card fd-mcard"><h2 id="ctT">Tipos de marcos</h2>
      <p class="hint" style="margin-top:0">Os tipos servem para filtrar e dar cor aos marcos no calendário, na linha do tempo e no Dashboard. Os da EPISJ 360 não se mudam; os que você acrescentar podem mudar de nome e de cor.</p>
      <div class="ct-l">${Object.entries(CAL_TIPOS_BASE).map(([k,v])=>`<div class="ct-i fixo"><i class="ct-sw" style="background:${v[1]}"></i><span class="ct-n">${esc(v[0])}</span><span class="ct-c">${uso(k)}</span><span class="tag">da app</span></div>`).join("")}
        ${e.calTipos.map(t=>`<div class="ct-i" data-ctk="${esc(t.k)}"><input type="color" value="${esc(t.cor||"#64748b")}" data-ctc aria-label="Cor de ${esc(t.nome)}"><input type="text" value="${esc(t.nome)}" data-ctn aria-label="Nome do tipo"><span class="ct-c">${uso(t.k)}</span>
          <button class="x" data-ctdel title="${U[t.k]?`Não se pode tirar: há ${uso(t.k)} deste tipo (mude-lhes o tipo primeiro)`:`Tirar o tipo ${esc(t.nome)}`}" ${U[t.k]?"disabled":""}>×</button></div>`).join("")}</div>
      <form class="ct-new" id="ctForm" autocomplete="off"><label>Novo tipo<input type="text" id="ctNome" placeholder="ex.: Reunião de pais, Visita de estudo" maxlength="40" required></label>
        <input type="color" id="ctCor" value="${cor}" aria-label="Cor"><button class="b" type="submit">Acrescentar</button></form>
      <div class="ct-pal" role="group" aria-label="Cores sugeridas">${CT_PAL.map(c=>`<button type="button" data-ctp="${c}" class="${c===cor?"on":""}" style="background:${c}" title="${c}"></button>`).join("")}</div>
      <div class="ct-f"><button class="b s" data-ctx type="button">Fechar</button></div></div>`;
    const n=box.querySelector("#ctNome");if(n)setTimeout(()=>n.focus(),0)};
  desenhar();
  box.addEventListener("click",ev=>{const t=ev.target;if(t===box||t.closest("[data-ctx]")){fechar();return}
    const p=t.closest("[data-ctp]");if(p){cor=p.dataset.ctp;box.querySelector("#ctCor").value=cor;box.querySelectorAll("[data-ctp]").forEach(b=>b.classList.toggle("on",b===p));return}
    const d=t.closest("[data-ctdel]");if(d&&!d.disabled){const k=d.closest("[data-ctk]").dataset.ctk,x=e.calTipos.find(z=>z.k===k);if(!x||calTiposUsos()[k])return;
      if(!confirm(`Tirar o tipo «${x.nome}»?`))return;e.calTipos=e.calTipos.filter(z=>z.k!==k);gravar();desenhar();toast("Tipo tirado")}});
  box.addEventListener("input",ev=>{const t=ev.target;if(t.id==="ctCor"){cor=t.value;box.querySelectorAll("[data-ctp]").forEach(b=>b.classList.toggle("on",b.dataset.ctp===cor))}});
  box.addEventListener("change",ev=>{const t=ev.target,r=t.closest("[data-ctk]");if(!r)return;const x=e.calTipos.find(z=>z.k===r.dataset.ctk);if(!x)return;
    if(t.matches("[data-ctc]"))x.cor=t.value;else if(t.matches("[data-ctn]")){const v=t.value.trim();if(!v||Object.entries(CAL_TIPOS).some(([k,w])=>k!==x.k&&norm(w[0])===norm(v))){t.value=x.nome;toast(v?"Já há um tipo com esse nome":"O tipo precisa de um nome");return}x.nome=v}
    gravar()});
  box.addEventListener("submit",ev=>{ev.preventDefault();const v=box.querySelector("#ctNome").value.trim();if(!v)return;
    if(Object.values(CAL_TIPOS).some(w=>norm(w[0])===norm(v))){toast("Já há um tipo com esse nome");return}
    e.calTipos.push({k:"u"+uid(),nome:v,cor:box.querySelector("#ctCor").value||cor});cor=CT_PAL.find(c=>!Object.values(CAL_TIPOS).some(w=>w[1]===c)&&c!==box.querySelector("#ctCor").value)||cor;
    gravar();desenhar();toast(`Tipo «${v}» acrescentado`)})}
function calIcs(){calTiposSync();const a=calAnoSel(),cal=calDe(a),FER=calFeriados(a),t=CAL_T?escData().turmas.find(x=>x.id===CAL_T):null;
  const e=s=>String(s||"").replace(/\\/g,"\\\\").replace(/[;,]/g,m=>"\\"+m).replace(/\r?\n/g,"\\n"),d8=s=>s.replace(/-/g,""),agora=new Date().toISOString().replace(/[-:]/g,"").slice(0,15)+"Z";
  const dobra=l=>{if(l.length<=74)return l;const o=[l.slice(0,74)];for(let i=74;i<l.length;i+=73)o.push(" "+l.slice(i,i+73));return o.join("\r\n")};
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//EPISJ 360//Calendario Escolar//PT","CALSCALE:GREGORIAN","METHOD:PUBLISH","X-WR-CALNAME:"+e("Calendário Escolar "+a.nome+(t?" · "+t.cod:"")),"X-WR-TIMEZONE:Atlantic/Azores"];
  const ev=(id,nome,de,ate,desc,cat)=>{L.push("BEGIN:VEVENT","UID:"+id+"@episj360","DTSTAMP:"+agora,"DTSTART;VALUE=DATE:"+d8(de),"DTEND;VALUE=DATE:"+d8(calMais(ate||de,1)),"SUMMARY:"+e(nome),"TRANSP:TRANSPARENT");if(desc)L.push("DESCRIPTION:"+e(desc));if(cat)L.push("CATEGORIES:"+e(cat));L.push("END:VEVENT")};
  for(const p of calPeriodos(a)){ev("per"+p.n+"i-"+a.id,"Início do "+p.n+".º período",p.ini,p.ini,"","Calendário escolar");ev("per"+p.n+"f-"+a.id,"Fim do "+p.n+".º período",p.fim,p.fim,"","Calendário escolar")}
  for(const f of a.ferias||[])if(f&&f.de)ev("fer-"+(f.id||d8(f.de))+"-"+a.id,f.nome||"Interrupção letiva",f.de,f.ate||f.de,"",calEhFeriado(f,FER)?"Feriado":"Interrupção letiva");
  for(const m of cal.marcos){const tu=calTurmaDoMarco(m,a);if(t&&(!tu||tu.id!==t.id))continue;const pre=(tu?tu.cod:m.cod||"")+" · ";
    if(m.datas&&m.datas.length>1)m.datas.forEach((d,i)=>ev("m-"+m.id+"-"+i,pre+m.nome,d,d,m.obs||"",(CAL_TIPOS[m.tipo]||CAL_TIPOS.outro)[0]));else ev("m-"+m.id,pre+m.nome,m.de,m.ate||m.de,m.obs||"",(CAL_TIPOS[m.tipo]||CAL_TIPOS.outro)[0])}
  L.push("END:VCALENDAR");download(`Calendario Escolar ${a.nome.replace("/","-")}${t?" - "+t.cod:""}.ics`,L.map(dobra).join("\r\n"),"text/calendar;charset=utf-8");toast("Abra o ficheiro .ics no Outlook para juntar ao seu calendário")}

/* ---------- eventos ---------- */
$("#calAno").addEventListener("change",e=>{CAL_ANO=e.target.value;CAL_DIA="";try{localStorage.setItem("cal_ano",CAL_ANO)}catch(x){}renderCal()});
$("#calTurma").addEventListener("change",e=>{CAL_T=e.target.value;try{localStorage.setItem("cal_t",CAL_T)}catch(x){}renderCal()});
$("#calTipo").addEventListener("change",e=>{CAL_TIPO=e.target.value;renderCal()});
if($("#calTiposBtn"))$("#calTiposBtn").addEventListener("click",calTiposJanela);
$("#calImp").onclick=()=>$("#calFile").click();
$("#calFile").addEventListener("change",e=>{const f=e.target.files[0];e.target.value="";if(f)calImportar(f)});
$("#calPdfB").onclick=()=>calPdf().catch(e=>toast("Não foi possível fazer o PDF: "+e.message));
$("#calIcsB").onclick=()=>calIcs();
$("#calGrid").addEventListener("click",e=>{const b=e.target.closest("[data-cald]");if(!b)return;CAL_DIA=CAL_DIA===b.dataset.cald?"":b.dataset.cald;const a=calAnoSel();calGrelha(a,calNaoLetivos(a),calPeriodos(a))});
$("#cal").addEventListener("click",e=>{const l=e.target.closest("[data-calir]");if(l){e.preventDefault();show(l.dataset.calir)}});
$("#calMunD").addEventListener("change",e=>{const m=String(e.target.value).match(/^\s*(\d{1,2})\s*[\/.-]\s*(\d{1,2})\s*$/);if(!m){toast("Escreva o dia e o mês, ex.: 23/04");return}
  calMunicipal().data=String(+m[2]).padStart(2,"0")+"-"+String(+m[1]).padStart(2,"0");save();renderCal()});
$("#calMunN").addEventListener("change",e=>{calMunicipal().nome=e.target.value.trim()||"Feriado municipal";save();renderCal()});
$("#calMarcos").addEventListener("change",e=>{const i=e.target.closest("[data-cmk]");if(!i||!calPodeEditar())return;const tr=i.closest("tr[data-calm]"),a=calAnoSel(),m=calDe(a).marcos.find(x=>x.id===tr.dataset.calm);if(!m)return;
  const k=i.dataset.cmk;m[k]=k==="nome"?i.value.trim():i.value;if(k==="de"||k==="ate"){m.datas=null;if(m.ate&&m.de&&m.ate<m.de)m.ate=m.de}save();renderCal()});
$("#calMarcos").addEventListener("click",e=>{const b=e.target.closest("[data-calmdel]");if(!b||!calPodeEditar())return;const id=b.closest("tr[data-calm]").dataset.calm,a=calAnoSel(),c=calDe(a),m=c.marcos.find(x=>x.id===id);if(!m)return;
  if(!confirm(`Apagar o marco «${m.nome}»?`))return;c.marcos=c.marcos.filter(x=>x.id!==id);save();renderCal();toast("Marco apagado (pode anular)")});
$("#calMarcos").addEventListener("submit",e=>{if(e.target.id!=="calMForm")return;e.preventDefault();if(!calPodeEditar())return;const f=e.target,a=calAnoSel(),t=escData().turmas.find(x=>x.id===f.t.value);
  if(!f.nome.value.trim()||!f.de.value){toast("Escreva o marco e a data");return}
  calDe(a).marcos.push({id:uid(),turmaId:t?t.id:"",cod:t?t.cod:"",tipo:f.tipo.value,nome:f.nome.value.trim(),de:f.de.value,ate:f.ate.value&&f.ate.value>=f.de.value?f.ate.value:f.de.value,datas:null,obs:""});save();renderCal();toast("Marco acrescentado")});
const ferCalB=$("#ferCal");if(ferCalB)ferCalB.onclick=()=>{show("cal");setTimeout(()=>$("#calFile").click(),80)};

/* ---------- widget do Painel da escola ---------- */
WIDGETS.push({id:"cal",mod:"escola",nome:"Calendário escolar",desc:"Hoje no calendário (período, interrupção, feriado) e os próximos marcos das turmas (FCT, avaliação, PAP)",r(){
  const a=anoAtivo(),NL=calNaoLetivos(a),P=calPeriodos(a),hj=calHoje(),x=NL.get(hj),pa=calPeriodoDe(a,hj,P),pf=perfilAtual();
  const minha=pf==="form"?turmasDoAno(a).find(t=>norm(t.cod)===norm(EU&&EU.turma||"")):null;
  const per=P.find(p=>p.n===pa),rest=per?calLetivos(a,calMais(hj,1),per.fim,NL):0;
  let h=`<p class="wg-t">${x?ico("cal")+` Hoje: <b>${esc(x.n)}</b>.`:pa?`Hoje: dia letivo do <b>${pa}.º período</b> — faltam ${rest} dia${rest===1?"":"s"} letivo${rest===1?"":"s"} até ${calDM(per.fim)}.`:hj<(a.inicio||"9")?`As aulas começam a <b>${calDM(a.inicio)}</b>.`:P.length?"Fora dos períodos letivos.":"Calendário por importar."}</p>`;
  const M=calMarcos(a,minha?minha.id:"").filter(m=>(m.ate||m.de)>=hj).sort((p,q)=>p.de.localeCompare(q.de)).slice(0,6);
  h+=M.length?`<div class="wg-lst">${M.map(m=>{const t=calTurmaDoMarco(m,a),c=(CAL_TIPOS[m.tipo]||CAL_TIPOS.outro)[1],n=calDias(hj,m.de);
      return `<div class="wg-li"><i class="wg-dot" style="background:${c}"></i><span class="wg-el">${t&&!minha?`<b>${esc(t.cod)}</b> · `:""}${esc(m.nome)}<br><span class="wg-sub">${calDatasTxt(m)} · ${m.de<=hj?"a decorrer":n===0?"hoje":"daqui a "+n+" dia"+(n===1?"":"s")}</span></span></div>`}).join("")}</div>`
    :wgVazio(calDe(a).marcos.length?"Sem marcos nos próximos tempos.":"Ainda sem marcos das turmas.");
  return h+wgIr("cal","Abrir o calendário")}});

try{if(!localStorage.getItem("guide_wg_cal")){localStorage.setItem("guide_wg_cal","1");if(!WG_SEL.includes("cal")&&!WG_SEL2.includes("cal")){WG_SEL.splice(1,0,"cal");localStorage.setItem(WG_KEY,JSON.stringify(WG_SEL))}}}catch(e){}

// Calendário do ano › modo ampliado: o quadro ocupa o ecrã todo (sem menu lateral); Esc ou o botão para sair
function calAmpSync(){const b=document.getElementById("calAmp");if(b)b.textContent=document.body.classList.contains("calamplo")?"Sair do modo ampliado":"Ampliar"}
function calAmpSet(on){document.body.classList.toggle("calamplo",!!on);calAmpSync()}
(function(){const b=document.getElementById("calAmp");if(b)b.onclick=()=>calAmpSet(!document.body.classList.contains("calamplo"));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("calamplo"))calAmpSet(false)});
  document.querySelector("nav.side")&&document.addEventListener("click",e=>{if(document.body.classList.contains("calamplo")&&e.target.closest(".top,nav.side"))calAmpSet(false)},true)})();
