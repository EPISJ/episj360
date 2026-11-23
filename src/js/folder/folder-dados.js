/* Folder360 — dados (carregado sempre, com o resto da app): estado, normalização, guardar e trazer da nuvem, widget do Painel.
   O ecrã do módulo está em folder/folder.js e só é carregado quando o módulo é aberto (fase 2 da separação do código, 0.9.133). */
/* ===================== EPISJ 360 0.9.107: Folder360 — arquivo físico dos dossiers =====================
   O antigo «dbGUIDE-DTP» (FileMaker, Joel Lima da Cunha 2019) dentro da EPISJ 360:
   · cada dossier com arquivo › armário › prateleira › n.º, ano letivo, curso, título, volume, n.º de projeto, financiamento e ligação ao SharePoint;
   · código de localização calculado sempre a partir da localização (Arquivo-ArmárioPrateleiraN.º-AnoLetivo-Curso, ex.: ARQ1-BIII05-1617-956) —
     no FileMaker o número do código de barras era escrito à mão e ficava desatualizado; aqui o código de barras é sempre o código de localização;
   · lombadas, etiquetas com código de barras, etiquetas de CD, relatório por arquivo e lista de conferência em PDF (logótipos das Definições);
   · mapa do arquivo, requisições (saídas e devoluções) e conferência do arquivo com leitor de códigos (câmara, leitor USB/Bluetooth).
   Dados na peça «FOL» da base de dados (IndexedDB «folder» + g360_estado), só da Direção; juntam-se entre computadores registo a registo
   (pela data da última alteração) e nunca se apagam sem o utilizador pedir. Os 222 dossiers do FileMaker entraram tal como estavam. */
var FO_COR="#c99a6e",FO_VER="1.0";
var FOL=FOL||{t:0,dossiers:[],mov:[],conf:[],cursos:[],def:null,del:{}};
var FO_UI=FO_UI||{q:"",arq:"",arm:"",prat:"",ano:"",tipo:"",fin:"",est:"",sel:"",marc:{},n:150,mapa:"",conf:"",movVer:"ativos",impFonte:"marc",impTipo:"lomb",relArqs:{}};
var foPronto,foH,foIdxC;
document.querySelectorAll("[data-fdver]").forEach(el=>el.textContent="v"+FO_VER);
function foDef0(){return{em:0,
  arqs:["DIR","ARQ1","ARQ2","ARQ3","DIRDAF","ZOTEC2"].map(c=>({cod:c,nome:"",arms:/^DIR/.test(c)?"A":"A,B,C,D,E",prats:/^DIR/.test(c)?"I,II":"I,II,III,IV,V"})),
  titulos:["Dossier Tecnicopedagógico","Reposição da Assiduidade","Justificação de Faltas","Pautas de Avaliação","Formação Pedagógica Inicial de Formadores","Avaliações","1.ºs e 2.ºs Momentos - Provas de Aptidão Profissional","Dossier TP e Rep. da Assiduidade","Gestão Administrativa e Financeira"],
  tipos:["Tecnicopedagógico","Direção Pedagógica","Formando"],
  fins:[{n:"ProEmprego",logo:null,padrao:"img/fin-proemprego.png"},{n:"Açores 2020",logo:null,padrao:"img/fin-acores2020.png"},{n:"Açores 2030",logo:null}],
  anosCur:["1.º ano","2.º ano","3.º ano"],
  site:"www.episj.com",lombW:65,lombPP:1,lombQR:false,etq:"l7159",prazo:15}}
function foNorm(v){const o=v&&typeof v==="object"?v:{},A=k=>Array.isArray(o[k])?o[k].filter(x=>x&&x.id):[];
  return{t:+o.t||0,dossiers:A("dossiers"),mov:A("mov"),conf:A("conf"),cursos:A("cursos"),def:o.def&&typeof o.def==="object"?o.def:null,del:o.del&&typeof o.del==="object"?o.del:{}}}
// carregado à primeira necessidade (regra do arranque: o Folder360 pode ser o último módulo aberto)
function foCarregar(){return foPronto||(foPronto=DB.get("kv","folder").then(v=>{if(!RO){const n=foNorm(v);if((n.t||0)>=(FOL.t||0))FOL=n}}).catch(()=>{}))}
foCarregar();
function foDef(){if(!FOL.def)FOL.def=foDef0();const d=FOL.def,z=foDef0();for(const k in z)if(d[k]===undefined||d[k]===null)d[k]=z[k];
  if(!Array.isArray(d.arqs))d.arqs=z.arqs;["titulos","tipos","anosCur"].forEach(k=>{if(!Array.isArray(d[k]))d[k]=z[k]});
  if(!Array.isArray(d.fins))d.fins=z.fins;d.fins=d.fins.map(f=>typeof f==="string"?{n:f,logo:null}:f);
  d.fins.forEach(f=>{if(f.padrao===undefined&&FO_LGPN[f.n])f.padrao=FO_LGPN[f.n]});return d}
// os logótipos de financiamento que vinham no FileMaker (ProEmprego e Açores 2020), na pasta img da app; carregados à primeira necessidade
var FO_LGPN={"ProEmprego":"img/fin-proemprego.png","Açores 2020":"img/fin-acores2020.png"},FO_LGP=FO_LGP||{};
async function foLgPadrao(){const L=foDef().fins.filter(f=>f.padrao&&!foLg(f.logo)&&FO_LGP[f.padrao]===undefined);for(const f of L)FO_LGP[f.padrao]=await pdfLgImg(f.padrao);return L.length}
function foFinLogo(f){return f?(foLg(f.logo)?f.logo:(f.padrao&&foLg(FO_LGP[f.padrao])?FO_LGP[f.padrao]:null)):null}
function foEd(){return!RO&&podePublicar()}
// ---------- guardar e nuvem (como o PAP360: IndexedDB + peça «FOL») ----------
// 0.9.231: nunca enviar para a nuvem antes da primeira leitura — uma sessão nova (dados só em memória) que guardasse antes de ler apagava tudo o que lá estava (aconteceu ao Folder360 a 23/11/2026); até lá, guardar = ler, juntar e só depois enviar
var FO_SINC=false;
function foGuardar(o){if(RO||LIMPAR)return;const t=Date.now();if(o){o.em=t;o.mod=String(EU&&EU.email||"")}FOL.t=t;foIdxC=null;DB.put("kv","folder",FOL);clearTimeout(foH);
  nuvFila("foH",()=>{try{if(NUVOK()&&!nuvDesl()){if(FO_SINC)nuvemPut("FD",FOL,FOL.t);else foTrazerNuvem()}}catch(e){}},2500)}
function foJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{});
  const pick=(L1,L2)=>{const m=new Map();for(const x of(L2||[]).concat(L1||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}return[...m.values()]};
  const def=a.def&&b.def?((b.def.em||0)>(a.def.em||0)?b.def:a.def):(a.def||b.def||null);
  return{t:Math.max(a.t||0,b.t||0),dossiers:pick(a.dossiers,b.dossiers),mov:pick(a.mov,b.mov),conf:pick(a.conf,b.conf),cursos:pick(a.cursos,b.cursos),def,del}}
async function foTrazerNuvem(){try{await foCarregar();if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{};
    if(idx.FD&&((idx.FD.t||0)>(FOL.t||0)||!FO_SINC)){const j=foNorm(await nuvemGet("FD")),n=foJuntar(FOL,j);FO_SINC=true;
      const sig=x=>x.dossiers.length+"|"+x.mov.length+"|"+x.conf.length+"|"+x.cursos.length+"|"+Math.max(0,...x.dossiers.map(d=>d.em||0),...x.mov.map(d=>d.em||0),...x.conf.map(d=>d.em||0));
      const dif=sig(n)!==sig(j)||JSON.stringify(n.def)!==JSON.stringify(j.def);
      FOL=n;foIdxC=null;DB.put("kv","folder",FOL);if(dif)nuvemPut("FD",FOL,Date.now());if(curTab&&/^fo[A-Z]/.test(curTab))foRender(curTab)}
    else{FO_SINC=true;if((FOL.t||0)>((idx.FD||{}).t||0)&&(FOL.dossiers.length||FOL.mov.length))await nuvemPut("FD",FOL,FOL.t)}}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Folder360/nuvem",e)}}

// ---------- código de localização ----------
function foYY(ano){const m=String(ano||"").match(/(\d{4})\D+(\d{4})/);return m?m[1].slice(2)+m[2].slice(2):""}
function foNumCurso(c){const m=String(c||"").match(/^\s*(\d+)/);return m?m[1]:""}
function foPos(d){return(d.arm||"")+(d.prat||"")+(d.ns||"")}
function foCod(d){return[d.arq,foPos(d),foYY(d.ano),d.cursoNum].filter(x=>x&&String(x).trim()).join("-")}
function foIdx(){if(foIdxC)return foIdxC;const m=new Map();for(const d of FOL.dossiers){const c=foCod(d).toUpperCase();if(!m.has(c))m.set(c,[]);m.get(c).push(d)}return foIdxC=m}
function foRepetido(d){const L=foIdx().get(foCod(d).toUpperCase());return!!(L&&L.length>1)}
function foArq(c){return foDef().arqs.find(a=>a.cod===c)||null}
function foArqNome(c){const a=foArq(c);return a&&a.nome?`${c} · ${a.nome}`:c}
function foLista(s){return String(s||"").split(/[,;\s]+/).map(x=>x.trim()).filter(Boolean)}
function foArms(c){const a=foArq(c),L=a?foLista(a.arms):[];FOL.dossiers.forEach(d=>{if(d.arq===c&&d.arm&&!L.includes(d.arm))L.push(d.arm)});return L}
function foPrats(c){const a=foArq(c),L=a?foLista(a.prats):[];FOL.dossiers.forEach(d=>{if(d.arq===c&&d.prat&&!L.includes(d.prat))L.push(d.prat)});return L}
var FO_ROM={I:1,II:2,III:3,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,X:10,XI:11,XII:12};
function foOrdArq(c){const i=foDef().arqs.findIndex(a=>a.cod===c);return i<0?999:i}
function foCmp(a,b){return foOrdArq(a.arq)-foOrdArq(b.arq)||COLL_PTN.compare(a.arq||"",b.arq||"")||COLL_PTN.compare(a.arm||"",b.arm||"")||
  ((FO_ROM[a.prat]||99)-(FO_ROM[b.prat]||99))||COLL_PTN.compare(a.prat||"",b.prat||"")||COLL_PTN.compare(a.ns||"",b.ns||"")||COLL_PTN.compare(a.ano||"",b.ano||"")}
function foProxNs(arq,arm,prat,exc){let m=0;FOL.dossiers.forEach(d=>{if(d.id!==exc&&d.arq===arq&&d.arm===arm&&d.prat===prat){const n=parseInt(d.ns,10);if(n>m)m=n}});return String(m+1).padStart(2,"0")}
function foVolTxt(d){return d.vol?(d.volT?`${d.vol} de ${d.volT}`:d.vol):""}
function foCursoCurto(d){return String(d.curso||"").replace(/\s+/g," ").trim()}
function foHoje(){return calS(new Date())}
// ---------- requisições ----------
function foMovAtivo(id){return FOL.mov.filter(m=>m.dId===id&&!m.dev).sort((a,b)=>(b.saida||"").localeCompare(a.saida||""))[0]||null}
function foEstado(d){const m=foMovAtivo(d.id);if(m){const at=m.prev&&m.prev<foHoje();return{k:at?"ba":"wa",txt:at?"Em atraso":"Requisitado",m}}return{k:"ok",txt:"No arquivo"}}
// ---------- procurar por um código lido (código de localização, código antigo do FileMaker, ligação do QR) ----------
function foAchar(txt){const s=String(txt||"").trim();if(!s)return null;const u=s.toUpperCase();
  const L=foIdx().get(u);if(L&&L.length)return L[0];
  return FOL.dossiers.find(d=>(d.cbAntigo&&d.cbAntigo.toUpperCase()===u&&!foIdx().get(u))||(d.url&&d.url===s)||d.id===s)||null}

function foLg(o){return o&&o.src&&o.w?o:null}
// ----- opções de listas (também usadas pelo Econo360) -----
function foOpts(L,v,vazio){return(vazio!==undefined?`<option value="">${esc(vazio)}</option>`:"")+L.map(x=>{const o=typeof x==="object"?x:{v:x,t:x};return `<option value="${esc(o.v)}"${String(o.v)===String(v)?" selected":""}>${esc(o.t)}</option>`}).join("")}
// ----- widget do Painel -----
WG_MOD.folder={l:"F",c:FO_COR,n:"Folder360"};
WIDGETS.push({id:"fdreq",mod:"folder",nome:"Arquivo Físico",desc:"Dossiers fora do arquivo e requisições em atraso (Folder360)",r(){
  const hj=foHoje(),A=FOL.mov.filter(m=>!m.dev).sort((a,b)=>(a.prev||"9").localeCompare(b.prev||"9"));
  if(!FOL.dossiers.length)return wgVazio("Ainda sem dossiers no Folder360.")+wgIr("foInicio","Abrir o Folder360");
  if(!A.length)return `<div class="wg-big">${FOL.dossiers.length}</div><p class="wg-t">dossiers no arquivo, todos no sítio.</p>`+wgIr("foInicio","Abrir o Folder360");
  return `<div class="wg-lst">${A.slice(0,6).map(m=>{const d=FOL.dossiers.find(x=>x.id===m.dId),late=m.prev&&m.prev<hj;return `<div class="wg-li"><i class="wg-dot" style="background:${late?"#dc2626":"#d97706"}"></i><span class="wg-el"><b>${esc(d?foCod(d):m.cod||"")}</b> · ${esc(m.quem||"")}<br><span class="wg-sub">${late?"devia ter voltado a ":"volta a "}${esc(calDM(m.prev)||"—")}</span></span></div>`}).join("")}</div>`+wgIr("foMov","Requisições")}});


