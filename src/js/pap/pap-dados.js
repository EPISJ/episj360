/* PAP360 — dados (carregado sempre, com o resto da app): estado, normalização, guardar e trazer da nuvem, widget do Painel.
   O ecrã do módulo está em pap/pap.js e só é carregado quando o módulo é aberto (fase 2 da separação do código, 0.9.133). */
/* ===================== EPISJ 360 0.9.92: PAP360 — Provas de Aptidão Profissional =====================
   A «Grelha de Avaliação da Prova de Aptidão Profissional» (livro Excel com macros) dentro da EPISJ 360:
   · Curso → cada prova (turma + fase): responsáveis, Direção Pedagógica, n.º de projeto, local e pasta da Box;
     formandos que apresentam, tema, júri externo, data, hora e ligação da prova escrita (enviada ao júri pelo Office 365);
   · GCFP-F1…F25 → a grelha de cada formando: 6 critérios × 5 níveis, CP = (C1+C2+C3+C4+3×C5+C6)/8,
     NFPAP = (CP1 + 2×CP2 + 7×CP)/10, classificação final arredondada e por extenso;
   · Pauta de Chamada, Folha de Presença, Atas (uma por sessão: dia + manhã/tarde) e Pauta de Avaliação PAP, em PDF;
   · Contactos do júri (de todas as provas e anos).
   Dados na peça «PAP» da base de dados (IndexedDB «pap» + g360_estado), só da Direção; juntam-se entre computadores
   (prova a prova, pela data da última alteração) e nunca se apagam sem o utilizador pedir. Formandos e turmas vêm da Escola360. */
const PAP_COR="#e06cf0",PAP_VER="1.0";
document.querySelectorAll("[data-papver]").forEach(el=>el.textContent="v"+PAP_VER);
function papDef0(){return{em:0,
  crit:[
   {id:"c1",nome:"Capacidade de Investigação",tit:"CAPACIDADE DE INVESTIGAÇÃO",desc:"Avaliação da capacidade de pesquisar e selecionar a informação adequada ao objeto de estudo.",peso:1,niv:["Revela capacidade nula/insuficiente de recolha e seleção de informação adequada ao objeto de estudo","Revela alguma capacidade de recolha e seleção de informação embora insuficiente para o objeto de estudo","Revela capacidade satisfatória de recolha e seleção de informação adequada ao objeto de estudo","Revela boa capacidade de recolha e seleção de informação adequada ao objeto de estudo","Revela excelente capacidade de recolha e seleção de informação adequada ao objeto de estudo"]},
   {id:"c2",nome:"Método de Organização de Trabalho",tit:"MÉTODO DE ORGANIZAÇÃO DE TRABALHO",desc:"Avaliação da capacidade para organizar o trabalho de forma ponderada e ordenada tendo em vista a eficácia e o cumprimento das atividades.",peso:1,niv:["Revela capacidade nula/insuficiente para organizar e desenvolver o trabalho de forma eficaz.","Revela pouca capacidade para organizar e desenvolver o trabalho de forma eficaz.","Revela capacidade para organizar e desenvolver o trabalho de forma eficaz.","Revela boa capacidade para organizar e desenvolver o trabalho de forma eficaz.","Revela uma excelente capacidade para organizar e desenvolver o trabalho de forma eficaz."]},
   {id:"c3",nome:"Grau de Consecução dos Objetivos Propostos",tit:"GRAU DE CONSECUÇÃO DOS OBJETIVOS PROPOSTOS",desc:"Avaliação da capacidade para atingir os objetivos propostos.",peso:1,niv:["Demonstra uma capacidade nula/insuficiente para atingir os objetivos propostos.","Demonstra pouca capacidade para atingir os objetivos propostos.","Demonstra uma capacidade satisfatória para atingir os objetivos propostos.","Demonstra uma boa capacidade para atingir os objetivos propostos.","Demonstra uma excelente capacidade para atingir os objetivos propostos."]},
   {id:"c4",nome:"Trabalho Escrito",tit:"TRABALHO ESCRITO",desc:"Avaliação da organização, apresentação e rigor técnico/científico.",peso:1,niv:["Revela capacidade nula/insuficiente de organização, apresentação e rigor técnico/científico.","Revela pouca capacidade de organização, apresentação e rigor técnico/científico.","Revela capacidade suficiente de organização, apresentação e rigor técnico/científico.","Revela boa capacidade de organização, apresentação e rigor técnico/científico.","Revela uma excelente capacidade de organização, apresentação e rigor técnico/científico."]},
   {id:"c5",nome:"Trabalho Prático",tit:"TRABALHO PRÁTICO",desc:"Avaliação da qualidade e da inovação do trabalho prático.",peso:3,niv:["Revela qualidade nula/insuficiente no trabalho prático.","Revela pouca qualidade e nenhuma inovação no trabalho prático.","Revela qualidade suficiente no trabalho prático mas sem inovar.","Revela boa ou muito boa qualidade no trabalho prático mas sem inovar.","Revela muito boa qualidade no trabalho prático e capacidade de inovar."]},
   {id:"c6",nome:"Apresentação Oral",tit:"APRESENTAÇÃO ORAL",desc:"Avaliação da clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas.",peso:1,niv:["Revela clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas, nula/ insuficiente.","Revela pouca clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas.","Revela clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas.","Revela boa clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas.","Revela muito boa clareza, coerência e capacidade para sintetizar o discurso, organização da apresentação, postura e capacidade de resposta às questões colocadas."]}],
  niveis:[[0,6],[7,9],[10,13],[14,17],[18,20]],
  fin:{cp1:1,cp2:2,cp:7},
  horas:["08:30 - 09:30","09:30 - 10:30","10:30 - 11:30","11:30 - 12:30","13:30 - 14:30","14:30 - 15:30","15:30 - 16:30","16:30 - 17:30"],
  rotResp:"Responsável de Curso",rotOrient:"Orientador Educativo",rotDped:"Direção Pedagógica",rotJuri:"Júri Externo",rotRep:"Representante da área de Formação Profissional",
  localidade:"Velas",local:"Oficina Escolar",cargoPres:"Adjunta Pedagógica",dped:"",ataNota:false,
  ataAbre:"{data}, pelas {hora}, sob a presidência da {cargo}, {presidente}, reuniu-se o seguinte Júri, para assistir à apresentação e defesa oral das Provas de Aptidão Profissional dos formandos:",
  ataMeio:"Após a apresentação e defesa dos projetos das Provas de Aptidão Profissional, os elementos do júri teceram alguns comentários às provas e colocaram questões aos formandos. Os elementos do júri procederam, de seguida, ao preenchimento das Grelhas de Avaliação Final das Provas de Aptidão Profissional e ao lançamento das respetivas classificações em pauta. {resultado}",
  ataFecho:"E nada mais havendo a tratar, foi lida e aprovada a presente ata e deu-se por terminada a reunião."}}
var PAP={t:0,provas:[],contactos:[],def:null,del:{}},PAP_SEL={ano:"",prova:"",cand:""},PAP_IMP=null,PAP_NOVA=false;
function papNorm(v){const o=v&&typeof v==="object"?v:{};const r={t:+o.t||0,provas:Array.isArray(o.provas)?o.provas.filter(p=>p&&p.id):[],contactos:Array.isArray(o.contactos)?o.contactos.filter(c=>c&&c.id):[],def:o.def&&typeof o.def==="object"?o.def:null,del:o.del&&typeof o.del==="object"?o.del:{}};
  r.provas.forEach(papProvaNorm);return r}
function papProvaNorm(P){if(!Array.isArray(P.cands))P.cands=[];if(!P.obs||typeof P.obs!=="object")P.obs={};if(!P.atas||typeof P.atas!=="object")P.atas={};P.fase=P.fase||"1";
  P.cands.forEach(c=>{if(!c.n||typeof c.n!=="object")c.n={};if(c.inc===undefined)c.inc=true});return P}
// 0.9.93: carregado à primeira necessidade — o arranque pode abrir o PAP360 (último módulo usado) antes desta linha
var papPronto=null;function papCarregar(){return papPronto||(papPronto=DB.get("kv","pap").then(v=>{if(!RO)PAP=papNorm(v)}).catch(()=>{}))}
papCarregar();
function papDef(){if(!PAP.def)PAP.def=papDef0();const d=PAP.def,z=papDef0();for(const k in z)if(d[k]===undefined||d[k]===null)d[k]=z[k];
  if(!Array.isArray(d.crit)||!d.crit.length)d.crit=z.crit;if(!Array.isArray(d.niveis)||d.niveis.length!==5)d.niveis=z.niveis;if(!Array.isArray(d.horas))d.horas=z.horas;
  d.crit.forEach((c,i)=>{if(!c.id)c.id="c"+(i+1);if(!Array.isArray(c.niv))c.niv=["","","","",""];if(c.peso===undefined)c.peso=1});return d}
const papEd=()=>!RO&&podePublicar();
// ---------- guardar e nuvem (como o Crono360: IndexedDB + peça «PAP» na base de dados) ----------
var papH=null;
function papGuardar(o){if(RO||LIMPAR)return;const t=Date.now();if(o)o.em=t;PAP.t=t;DB.put("kv","pap",PAP);clearTimeout(papH);
  nuvFila("papH",()=>{try{if(NUVOK()&&!nuvDesl())nuvemPut("PAP",PAP,PAP.t)}catch(e){}},2500)}
function papJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{});
  const pick=(L1,L2)=>{const m=new Map();for(const x of(L2||[]).concat(L1||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}return[...m.values()]};
  const def=a.def&&b.def?((b.def.em||0)>(a.def.em||0)?b.def:a.def):(a.def||b.def||null);
  const r={t:Math.max(a.t||0,b.t||0),provas:pick(a.provas,b.provas),contactos:pick(a.contactos,b.contactos),def,del};r.provas.forEach(papProvaNorm);return r}
async function papTrazerNuvem(){try{await papCarregar();if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{};
    if(idx.PAP&&(idx.PAP.t||0)>(PAP.t||0)){const j=papNorm(await nuvemGet("PAP")),n=papJuntar(PAP,j);const dif=JSON.stringify(n.provas)!==JSON.stringify(j.provas)||JSON.stringify(n.contactos)!==JSON.stringify(j.contactos);
      PAP=n;DB.put("kv","pap",PAP);if(dif)nuvemPut("PAP",PAP,Date.now());if(curTab&&curTab.startsWith("pap"))papRender(curTab)}
    else if((PAP.t||0)>((idx.PAP||{}).t||0)&&(PAP.provas.length||PAP.contactos.length))await nuvemPut("PAP",PAP,PAP.t)}
  catch(e){if(e&&e.kind!=="nokv")console.warn("PAP360/nuvem",e)}}
// ---------- números por extenso (atas e classificações) ----------
const PAP_U=["zero","um","dois","três","quatro","cinco","seis","sete","oito","nove","dez","onze","doze","treze","catorze","quinze","dezasseis","dezassete","dezoito","dezanove"];
const PAP_DZ=["","","vinte","trinta","quarenta","cinquenta","sessenta","setenta","oitenta","noventa"],PAP_CT=["","cento","duzentos","trezentos","quatrocentos","quinhentos","seiscentos","setecentos","oitocentos","novecentos"];
const PAP_MES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function papExt(n,fem){n=Math.floor(Math.abs(+n||0));const f=w=>fem?(w==="um"?"uma":w==="dois"?"duas":w):w;
  if(n<20)return f(PAP_U[n]);if(n<100){const u=n%10;return PAP_DZ[Math.floor(n/10)]+(u?" e "+f(PAP_U[u]):"")}
  if(n<1000){if(n===100)return"cem";const r=n%100;return PAP_CT[Math.floor(n/100)]+(r?" e "+papExt(r,fem):"")}
  const m=Math.floor(n/1000),r=n%1000,s=m===1?"mil":papExt(m,fem)+" mil";return r?s+(r<100||r%100===0?" e ":" ")+papExt(r,fem):s}
function papDataExt(s){if(!s)return"";const d=calD(s),dia=d.getDate();return(dia===1?"Ao primeiro dia":"Aos "+papExt(dia)+" dias")+" de "+PAP_MES[d.getMonth()]+" de "+papExt(d.getFullYear())}
function papHoraExt(hm){const m=String(hm||"").match(/(\d{1,2})[:hH.](\d{2})/);if(!m)return"";const h=+m[1],mi=+m[2];
  return papExt(h,true)+(h===1?" hora":" horas")+(mi?" e "+papExt(mi)+(mi===1?" minuto":" minutos"):"")}
const papVal=n=>n===null||n===undefined?"":`(${papExt(n).toUpperCase()}) VALORES`;
// ---------- cálculos da grelha ----------
const papNum=v=>v===null||v===undefined||v===""||isNaN(+v)?null:+v;
const papArr=x=>Math.floor(x+0.5+1e-9); // ARRED do Excel (metade para cima)
const papFmt=(v,d)=>v===null||v===undefined?"—":(Math.round(v*Math.pow(10,d??2))/Math.pow(10,d??2)).toLocaleString("pt-PT",{maximumFractionDigits:d??2});
function papNivel(v){if(v===null)return -1;const N=papDef().niveis;for(let i=4;i>=0;i--)if(v>=(+N[i][0]||0))return i;return 0}
function papCP(c){const D=papDef();let s=0,w=0;for(const k of D.crit){const v=papNum(c.n&&c.n[k.id]),p=+k.peso||0;if(!p)continue;if(v===null)return null;s+=v*p;w+=p}return w?s/w:null}
function papNF(c){const f=papDef().fin,cp=papCP(c);if(cp===null)return null;let s=(+f.cp||0)*cp,w=+f.cp||0;
  for(const k of["cp1","cp2"]){const p=+f[k]||0;if(!p)continue;const v=papNum(c[k]);if(v===null)return null;s+=p*v;w+=p}return w?s/w:null}
function papFinal(c){const n=papNF(c);return n===null?null:papArr(n)}
function papEstado(c){const D=papDef(),f=papFinal(c);if(f!==null)return{k:f>=10?"ok":"ba",f,txt:f>=10?"Aprovado":"Não aprovado"};
  const n=D.crit.filter(k=>papNum(c.n&&c.n[k.id])!==null).length;if(n||papNum(c.cp1)!==null||papNum(c.cp2)!==null)return{k:"wa",txt:`Incompleta (${n}/${D.crit.length})`};return{k:"mu",txt:"Por avaliar"}}
function papFormulaCP(){const D=papDef(),w=D.crit.reduce((a,k)=>a+(+k.peso||0),0);return `CP = (${D.crit.map((k,i)=>((+k.peso||0)===1?"":(+k.peso||0)+"×")+"C"+(i+1)).join(" + ")}) / ${w}`}
function papFormulaNF(){const f=papDef().fin,p=[["cp1","CP1"],["cp2","CP2"],["cp","CP"]].filter(([k])=>+f[k]).map(([k,n])=>(+f[k]===1?"":+f[k]+"×")+n);return `NFPAP = (${p.join(" + ")}) / ${(+f.cp1||0)+(+f.cp2||0)+(+f.cp||0)}`}
// ---------- provas ----------
function papAnoSel(){const E=escData();return E.anos.find(a=>a.id===PAP_SEL.ano)||anoAtivo()}
function papAnoDe(P){return escData().anos.find(a=>a.id===P.anoId)||anoAtivo()}
function papTurma(P){return P&&P.turmaId?escData().turmas.find(t=>t.id===P.turmaId)||null:null}
const papFaseTxt=f=>f==="esp"?"Época especial":(f||"1")+".ª fase";
function papNome(P){const t=papTurma(P);return `${t?t.cod+" · ":""}${P.curso||"(sem curso)"}${P.fase&&P.fase!=="1"?" · "+papFaseTxt(P.fase):""}`}
function papFse(P){const t=papTurma(P);return String(P.fse||(t&&t.fse)||"")}
const papInc=P=>(P.cands||[]).filter(c=>c.inc&&String(c.nome||"").trim());
const papOrdNome=(a,b)=>COLL_PT.compare(String(a.nome||""),String(b.nome||""));
function papHIni(h){const m=String(h||"").match(/(\d{1,2})[:hH.](\d{2})/);return m?(+m[1])*60+(+m[2]):null}
function papHFim(h){const m=[...String(h||"").matchAll(/(\d{1,2})[:hH.](\d{2})/g)],x=m[m.length-1];return x?(+x[1])*60+(+x[2]):null}
const papHM=min=>min===null||min===undefined?"":String(Math.floor(min/60)).padStart(2,"0")+":"+String(min%60).padStart(2,"0");
const papOrdHora=(a,b)=>String(a.data||"9").localeCompare(String(b.data||"9"))||((papHIni(a.hora)??9999)-(papHIni(b.hora)??9999))||papOrdNome(a,b);
const papDMA=s=>s?calD(s).toLocaleDateString("pt-PT"):"";
function papProva(){const L=PAP.provas;let P=L.find(p=>p.id===PAP_SEL.prova);if(!P){const a=papAnoSel();P=L.filter(p=>p.anoId===a.id).sort((x,y)=>COLL_PTN.compare(papNome(x),papNome(y)))[0]||L[0]||null;PAP_SEL.prova=P?P.id:""}return P}
function papSessoes(P){const G=new Map();for(const c of papInc(P)){if(!c.data)continue;const hi=papHIni(c.hora),per=hi!==null&&hi>=13*60?"t":"m",k=c.data+"|"+per;
    if(!G.has(k))G.set(k,{k,data:c.data,per,cands:[]});G.get(k).cands.push(c)}
  const L=[...G.values()].sort((a,b)=>a.k.localeCompare(b.k));
  for(const s of L){s.cands.sort(papOrdHora);s.juri=[...new Set(s.cands.flatMap(c=>[c.j1,c.j2]).map(x=>String(x||"").trim()).filter(Boolean))];
    const f=s.cands.map(c=>papHFim(c.hora)).filter(x=>x!==null);s.fim=f.length?Math.max(...f):null;s.nome=calDMA(s.data)+" · "+(s.per==="t"?"tarde":"manhã")}
  return L}
function papAta(P,s){if(!P.atas[s.k])P.atas[s.k]={};return P.atas[s.k]}
// responsáveis tirados dos cargos do Plano Curricular da turma (Escola360 › Planos Curriculares); o orientador educativo da turma (Escola › Turmas), se faltar
function papCargo(tid,aid,re){try{const p=pcDe(tid,aid);const x=p&&(p.cargos||[]).find(c=>c.f&&re.test(norm(c.nome||"")));const pr=x&&cfg.profs.find(q=>q.id===x.f);return pr?pr.nome:""}catch(e){return""}}
function papNovaProva(anoId,turmaId,fase,vazia){const E=escData(),D=papDef(),t=turmaId?E.turmas.find(x=>x.id===turmaId):null;
  const ult=PAP.provas.slice().sort((a,b)=>(b.em||0)-(a.em||0))[0];
  let orient=t?papCargo(t.id,anoId,/orientador.*educ/):"";if(!orient&&t&&t.dt){const p=cfg.profs.find(q=>q.id===t.dt);if(p)orient=p.nome}
  const P={id:uid(),anoId,turmaId:turmaId||"",fase:fase||"1",curso:t?turmaNome(t):"",fse:"",resp:t?papCargo(t.id,anoId,/respons.*curso/):"",orient,dped:D.dped||(ult&&ult.dped)||"",
    local:D.local||"",box:"",obs:{},atas:{},cands:[],criado:Date.now(),por:String(EU&&EU.email||"")};
  if(t&&!vazia)papJuntarTurma(P);return P}
function papJuntarTurma(P){if(!P.turmaId)return 0;const F=(escData().formandos||[]).filter(f=>f.turmaId===P.turmaId&&!f.estado);let n=0;
  for(const f of F){if(P.cands.some(c=>c.fId===f.id||(f.num&&c.num===f.num)||norm(c.nome||"")===norm(f.nome||"")))continue;P.cands.push({id:uid(),fId:f.id,num:f.num||"",nome:f.nome,inc:true,n:{}});n++}
  P.cands.sort(papOrdNome);return n}
function papDatasCal(P){try{const a=papAnoDe(P),t=papTurma(P);if(!t)return[];return[...new Set(calMarcos(a,t.id).filter(m=>m.tipo==="pap"&&m.de).flatMap(m=>calDatasDe(m)))].sort()}catch(e){return[]}}
// ----- widget do Painel -----
WG_MOD.pap={l:"P",c:PAP_COR,n:"PAP360"};
WIDGETS.push({id:"papprox",mod:"pap",nome:"Provas de Aptidão Profissional",desc:"As provas do ano letivo: próximas apresentações e grelhas de avaliação por completar",r(){
  const a=anoAtivo(),L=PAP.provas.filter(p=>p.anoId===a.id);if(!L.length)return wgVazio("Ainda sem provas neste ano letivo.")+wgIr("papInicio","Abrir o PAP360");
  const hj=calHoje();return `<div class="wg-lst">${L.slice(0,6).map(P=>{const I=papInc(P),f=I.filter(c=>papFinal(c)!==null).length,d=I.map(c=>c.data).filter(x=>x&&x>=hj).sort()[0];
    return `<div class="wg-li"><i class="wg-dot" style="background:${f===I.length&&I.length?"#16a34a":PAP_COR}"></i><span class="wg-el"><b>${esc(papNome(P))}</b><br><span class="hint" style="margin:0">${f}/${I.length} grelhas${d?" · próxima a "+esc(calDM(d)):""}</span></span></div>`}).join("")}</div>`+wgIr("papInicio","Abrir o PAP360")}});
