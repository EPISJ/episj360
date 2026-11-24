/* Ofício360 — dados (carregado sempre, com o resto da app): estado, numeração, guardar e trazer da nuvem, widget do Painel.
   O ecrã do módulo está em oficio/oficio.js e só é carregado quando o módulo é aberto.
   ===================== EPISJ 360 0.9.235: Ofício360 — gestão de ofícios (em carta e digitais) =====================
   · registo de entradas e saídas com numeração anual própria (E-001/2026, S-001/2026), via (carta simples, registada, com aviso
     de receção, email, plataforma digital, em mão), entidade, assunto, referências, classificação, prazo e estado;
   · despacho das entradas (para quem, até quando) e resposta ligada ao ofício recebido;
   · redação dos ofícios de saída em papel timbrado (logótipos das Definições), envelope DL de janela, envio por email com o PDF;
   · anexos (PDF, digitalizações com a câmara do telemóvel, emails .eml) no Supabase Storage (bucket privado «oficios»);
   · livro de registo em PDF e Excel; entidades (destinatários e remetentes) reutilizáveis.
   Dados na peça «OF» de g360_estado, só da Direção; juntam-se registo a registo (pela data da última alteração) e nunca se apagam
   sem o utilizador pedir. Os números já dados nunca mudam (um ofício anulado fica no livro, riscado). */
var OF_COR="#ff7a59",OF_VER="1.1";
var OFI=OFI||{t:0,reg:[],ent:[],def:null,del:{}};
var OF_UI=OF_UI||{q:"",tipo:"",estado:"",via:"",ano:"",classif:"",sel:"",n:150,red:"",livAno:"",livTipo:"",entQ:"",entSel:""};
var ofPronto,ofH;
document.querySelectorAll("[data-ofver]").forEach(el=>el.textContent="v"+OF_VER);
var OF_VIAS=[{v:"carta",t:"Carta simples"},{v:"registada",t:"Carta registada"},{v:"ar",t:"Carta registada com aviso de receção"},{v:"email",t:"Correio eletrónico"},
  {v:"digital",t:"Plataforma digital"},{v:"mao",t:"Entregue em mão"},{v:"outro",t:"Outra via"}];
var OF_EST={ent:[{v:"novo",t:"Por tratar",k:"wa"},{v:"tratar",t:"Em tratamento",k:"ok"},{v:"resp",t:"Respondido",k:"mu"},{v:"arq",t:"Arquivado",k:"mu"}],
  sai:[{v:"rasc",t:"Rascunho",k:"wa"},{v:"reg",t:"Registado",k:"ok"},{v:"env",t:"Enviado",k:"mu"},{v:"arq",t:"Arquivado",k:"mu"}]};
// 0.9.236: numeração das saídas igual à «Listagem de Ofícios» (Mod. DP333): «n.º/ABREVIATURA/ano» (001/PE/2026 … 154/RC/2026), número seguido no ano para todos os departamentos
var OF_DEPS0=[{a:"DP",n:"Direção Pedagógica"},{a:"PE",n:"Presidência Executiva"},{a:"DAF",n:"Direção Administrativa e Financeira"},{a:"FOR",n:"Formadores"},{a:"RC",n:"Responsável de Curso"},
  {a:"OE",n:"Orientador Educativo"},{a:"TIOP",n:"Técnico de Inserção e Orientação Profissional"},{a:"SA",n:"Serviços Administrativos"},{a:"SC",n:"Serviços Contabilísticos"}];
function ofDef0(){return{em:0,prefE:"E",prefS:"S",dig:3,ciclo:"civil",prazo:10,local:"Velas",fmtS:"{n3}/{dep}/{ano}",depOm:"DP",deps:OF_DEPS0.map(d=>Object.assign({},d)),listUlt:null,
  trat:["Exmo. Senhor","Exma. Senhora","Exmos. Senhores","Ao Cuidado de"],
  classif:["Direção Regional","Fundos comunitários / FSE","Formadores","Formandos e encarregados de educação","Entidades de FCT e parceiros","Autarquias","Fornecedores","Outros"],
  fecho:"Com os melhores cumprimentos,",sigCargo:"O Diretor",sigNome:"",sigImg:null,
  remetente:"Escola Profissional da Ilha de São Jorge\nVelas\n9800 São Jorge, Açores",
  assuntoEmail:"Ofício {num} — {assunto}",
  corpoEmail:"Exmo.(a) Senhor(a),\n\nJunto enviamos, em anexo, o ofício {num}, relativo a «{assunto}».\n\nCom os melhores cumprimentos,\n{assinatura}"}}
function ofNorm(v){const o=v&&typeof v==="object"?v:{},A=k=>Array.isArray(o[k])?o[k].filter(x=>x&&x.id):[];
  return{t:+o.t||0,reg:A("reg"),ent:A("ent"),def:o.def&&typeof o.def==="object"?o.def:null,del:o.del&&typeof o.del==="object"?o.del:{}}}
function ofCarregar(){return ofPronto||(ofPronto=DB.get("kv","oficio").then(v=>{if(!RO){const n=ofNorm(v);if((n.t||0)>=(OFI.t||0))OFI=n}}).catch(()=>{}))}
ofCarregar();
function ofDef(){if(!OFI.def)OFI.def=ofDef0();const d=OFI.def,z=ofDef0();for(const k in z)if(d[k]===undefined||d[k]===null&&k!=="sigImg")d[k]=z[k];
  ["trat","classif","deps"].forEach(k=>{if(!Array.isArray(d[k]))d[k]=z[k]});return d}
function ofDep(a){const A=String(a||"").trim().toUpperCase();return ofDef().deps.find(d=>String(d.a||"").toUpperCase()===A)||null}
function ofDepNome(a){const d=ofDep(a);return d?d.n:(a||"")}
function ofEd(){return!RO&&podePublicar()}
// ---------- guardar e nuvem (como o Folder360: nunca enviar antes da primeira leitura) ----------
var OF_SINC=false;
function ofGuardar(o){if(RO||LIMPAR)return;const t=Date.now();if(o){o.em=t;o.mod=String(EU&&EU.email||"")}OFI.t=t;DB.put("kv","oficio",OFI);clearTimeout(ofH);
  nuvFila("ofH",()=>{try{if(NUVOK()&&!nuvDesl()){if(OF_SINC)nuvemPut("OF",OFI,OFI.t);else ofTrazerNuvem()}}catch(e){}},2500)}
function ofJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{});
  const pick=(L1,L2)=>{const m=new Map();for(const x of(L2||[]).concat(L1||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}return[...m.values()]};
  const def=a.def&&b.def?((b.def.em||0)>(a.def.em||0)?b.def:a.def):(a.def||b.def||null);
  return{t:Math.max(a.t||0,b.t||0),reg:pick(a.reg,b.reg),ent:pick(a.ent,b.ent),def,del}}
async function ofTrazerNuvem(){try{await ofCarregar();if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{};
    if(idx.OF&&((idx.OF.t||0)>(OFI.t||0)||!OF_SINC)){const j=ofNorm(await nuvemGet("OF")),n=ofJuntar(OFI,j);OF_SINC=true;
      const sig=x=>x.reg.length+"|"+x.ent.length+"|"+Object.keys(x.del).length+"|"+Math.max(0,...x.reg.map(d=>d.em||0),...x.ent.map(d=>d.em||0));
      const dif=sig(n)!==sig(j)||JSON.stringify(n.def)!==JSON.stringify(j.def);
      OFI=n;DB.put("kv","oficio",OFI);if(dif)nuvemPut("OF",OFI,Date.now());if(curTab&&/^of[A-Z]/.test(curTab))ofRender(curTab)}
    else{OF_SINC=true;if((OFI.t||0)>((idx.OF||{}).t||0)&&(OFI.reg.length||OFI.ent.length))await nuvemPut("OF",OFI,OFI.t)}}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Ofício360/nuvem",e)}}

// ---------- numeração ----------
function ofHoje(){return calS(new Date())}
// o «ano» da numeração: ano civil (por omissão) ou ano letivo (2026/2027), conforme as Definições
function ofCiclo(data){const d=String(data||ofHoje()),y=+d.slice(0,4)||new Date().getFullYear();if(ofDef().ciclo!=="letivo")return String(y);
  const m=+d.slice(5,7)||1;return m>=9?`${y}/${y+1}`:`${y-1}/${y}`}
function ofProxN(tipo,ciclo){let m=0;for(const r of OFI.reg)if(r.tipo===tipo&&r.ciclo===ciclo&&+r.n>m)m=+r.n;return m+1}
function ofNumTxt(r){if(!r||!r.n)return"";const D=ofDef();
  if(r.tipo==="sai"&&D.fmtS)return String(D.fmtS).replace(/\{n3\}/g,String(r.n).padStart(+D.dig||3,"0")).replace(/\{n\}/g,String(r.n)).replace(/\{dep\}/g,String(r.dep||D.depOm||"").toUpperCase()).replace(/\{ano\}/g,r.ciclo);
  const p=r.tipo==="ent"?D.prefE:D.prefS;return `${p?p+"-":""}${String(r.n).padStart(+D.dig||3,"0")}/${r.ciclo}`}
function ofNumerar(r){if(r.n)return;r.ciclo=ofCiclo(r.data);r.n=ofProxN(r.tipo,r.ciclo);r.num=ofNumTxt(r)}
function ofRepetido(r){return!!r.n&&OFI.reg.some(x=>x!==r&&x.tipo===r.tipo&&x.ciclo===r.ciclo&&+x.n===+r.n)}
function ofEstado(r){return(OF_EST[r.tipo]||OF_EST.ent).find(e=>e.v===r.estado)||(OF_EST[r.tipo]||OF_EST.ent)[0]}
function ofAberto(r){return!r.anulado&&r.tipo==="ent"&&(r.estado==="novo"||r.estado==="tratar")}
function ofAtraso(r){return ofAberto(r)&&!!r.prazo&&r.prazo<ofHoje()}
function ofVia(v){const x=OF_VIAS.find(o=>o.v===v);return x?x.t:(v||"")}
function ofEntidade(id){return id?OFI.ent.find(e=>e.id===id)||null:null}
function ofQuem(r){const e=ofEntidade(r.entId),d=r.dest||{};return r.entNome||(e&&(e.org||e.nome))||(r.tipo==="sai"&&(d.org||d.nome))||""}
function ofCmp(a,b){return String(b.data||"").localeCompare(String(a.data||""))||String(b.ciclo||"").localeCompare(String(a.ciclo||""))||(+b.n||0)-(+a.n||0)||(b.cr||0)-(a.cr||0)}

// ----- widget do Painel -----
WG_MOD.oficio={l:"O",c:OF_COR,n:"Ofício360"};
WIDGETS.push({id:"ofpend",mod:"oficio",nome:"Ofícios por tratar",desc:"Ofícios recebidos por tratar e prazos de resposta (Ofício360)",r(){
  const hj=ofHoje(),A=OFI.reg.filter(ofAberto).sort((a,b)=>(a.prazo||"9").localeCompare(b.prazo||"9"));
  if(!OFI.reg.length)return wgVazio("Ainda sem ofícios registados no Ofício360.")+wgIr("ofInicio","Abrir o Ofício360");
  if(!A.length)return `<div class="wg-big">0</div><p class="wg-t">ofícios recebidos por tratar.</p>`+wgIr("ofInicio","Abrir o Ofício360");
  return `<div class="wg-lst">${A.slice(0,6).map(r=>{const late=r.prazo&&r.prazo<hj;return `<div class="wg-li"><i class="wg-dot" style="background:${late?"#dc2626":r.prazo?"#d97706":"#94a3b8"}"></i><span class="wg-el"><b>${esc(r.num||"")}</b> · ${esc(ofQuem(r))}<br><span class="wg-sub">${esc(r.assunto||"")}${r.prazo?` · ${late?"prazo passou a ":"responder até "}${esc(calDM(r.prazo))}`:""}</span></span></div>`}).join("")}</div>`+wgIr("ofInicio","Ofícios")}});
