/* Econo360 — dados (carregado sempre, com o resto da app): estado, normalização, guardar e trazer da nuvem, widget do Painel.
   O ecrã do módulo está em econo/econo.js e só é carregado quando o módulo é aberto (fase 2 da separação do código, 0.9.133). */
/* ===================== EPISJ 360 0.9.116: Econo360 — economato da escola profissional =====================
   Artigos, movimentos (o stock é sempre a soma dos movimentos: nada se escreve à mão e nada se apaga — um erro anula-se com
   um movimento de sentido contrário), requisições dos formadores, compras e fornecedores, inventário e custos por projeto FSE.
   Dados da Direção: peça «EC» em g360_estado + IndexedDB kv/econo (ECO). Requisições e catálogo dos formadores: tabelas
   eco_req e eco_cat no Supabase (servidor/supabase-episj360-econo360.sql), com filtragem por linha.
   Regra do arranque: só function/var aqui (o Econo360 pode ser o último módulo aberto). */
var ECO_COR="#f4d35e",ECO_VER="1.0";
var ECO=ECO||{t:0,art:[],mov:[],forn:[],enc:[],inv:[],def:null,del:{}};
var ECO_UI=ECO_UI||{q:"",cat:"",loc:"",est:"",sel:"",n:150,mq:"",mtipo:"",mde:"",mate:"",mn:200,rver:"pend",cper:"ano",cde:"",cate:"",cpor:"fse",csel:"",invSel:""};
var ecoPronto,ecoH,ecoCalcC=null,ECO_REQ=null,ECO_REQERR="",ECO_CAT=null,ecoCatH;
document.querySelectorAll("[data-ecover]").forEach(el=>el.textContent="v"+ECO_VER);
var ECO_TIPOS={ent:{n:"Entrada",c:"in"},sai:{n:"Saída",c:"wa"},aba:{n:"Abate",c:"ba"},ace:{n:"Acerto",c:"mu"}};
var ECO_ICO={caixa:'<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/></svg>',
  lista:'<svg viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>',
  carrinho:'<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 2-1.6L22 7H6"/></svg>',
  mao:'<svg viewBox="0 0 24 24"><path d="M9 11V5a2 2 0 0 1 4 0v6M13 10V4a2 2 0 0 1 4 0v7M17 9a2 2 0 0 1 4 0v5a8 8 0 0 1-8 8h-1a8 8 0 0 1-6.6-3.5L3 15a2 2 0 0 1 3.3-2.2L9 16V8a2 2 0 0 0-4 0"/></svg>'};
function ecoDef0(){return{em:0,
  cats:["Papelaria e escritório","Consumíveis de impressão","Limpeza e higiene","Cozinha e restauração","Elétrico e eletrónico","Ferramentas e oficina","Informática","Laboratório","Primeiros socorros","Outros"],
  locs:["Economato"],uns:["unidade","caixa","pacote","resma","rolo","embalagem","par","litro","kg","metro"],
  iva:16,pref:"EC",aprovar:true,avisar:true}}
function ecoNorm(v){const o=v&&typeof v==="object"?v:{},A=k=>Array.isArray(o[k])?o[k].filter(x=>x&&x.id):[];
  return{t:+o.t||0,art:A("art"),mov:A("mov"),forn:A("forn"),enc:A("enc"),inv:A("inv"),def:o.def&&typeof o.def==="object"?o.def:null,del:o.del&&typeof o.del==="object"?o.del:{}}}
function ecoCarregar(){return ecoPronto||(ecoPronto=DB.get("kv","econo").then(v=>{if(!RO||ecoEcon()){const n=ecoNorm(v);if((n.t||0)>=(ECO.t||0))ECO=n;ecoCalcC=null}}).catch(()=>{}))}
ecoCarregar();
function ecoDef(){if(!ECO.def)ECO.def=ecoDef0();const d=ECO.def,z=ecoDef0();for(const k in z)if(d[k]===undefined||d[k]===null)d[k]=z[k];
  ["cats","locs","uns"].forEach(k=>{if(!Array.isArray(d[k])||!d[k].length)d[k]=z[k]});return d}
function ecoEd(){return(!RO&&podePublicar())||ecoEcon()}
// 0.9.117: perfil «Economato» — entra só no Econo360; lê e grava a peça EC diretamente no Supabase (RLS: g360_economato)
function ecoEcon(){try{return!!(EU&&!EU.admin&&!EU.provisorio&&EU.perfil==="econ"&&!PREV&&sbAtivo())}catch(e){return false}}
async function ecoNuvPut(t){await sbNuvem("PUT","EC",await gz(ECO),t||ECO.t)}
async function ecoNuvGet(){const r=await sbNuvem("GET","EC");if(!r.ok)return null;return ungz(await r.arrayBuffer())}
function ecoHoje(){return calS(new Date())}
function ecoUniq(L){return[...new Set(L.filter(x=>x!==undefined&&x!==null&&String(x).trim()).map(String))]}
function ecoOpts(L,v,vazio){return foOpts(L,v,vazio)}
function ecoVz(ic,t){return `<div class="pp-vz"><i>${ECO_ICO[ic]||ECO_ICO.caixa}</i><div>${t}</div></div>`}
function ecoEur(v){return(+v||0).toLocaleString("pt-PT",{style:"currency",currency:"EUR"})}
function ecoEurP(v){return(Math.round((+v||0)*100)/100).toLocaleString("pt-PT",{minimumFractionDigits:2,maximumFractionDigits:2})+" EUR"}
function ecoN(v){const n=Math.round((+v||0)*1000)/1000;return n.toLocaleString("pt-PT",{maximumFractionDigits:3})}
function ecoNum(s){const x=String(s??"").trim().replace(/\s/g,"").replace(/€/g,"");if(!x)return NaN;return +(/,\d{1,3}$/.test(x)?x.replace(/\./g,"").replace(",","."):x.replace(/,/g,""))}
// ---------- guardar e nuvem (como o Folder360) ----------
function ecoGuardar(o){if((RO&&!ecoEcon())||LIMPAR)return;const t=Date.now();if(o){o.em=t;o.mod=String(EU&&EU.email||"")}ECO.t=t;ecoCalcC=null;DB.put("kv","econo",ECO);clearTimeout(ecoH);
  nuvFila("ecoH",()=>{try{if(ecoEcon())ecoNuvPut().catch(e=>toast("Econo360: não foi possível guardar na nuvem — "+(e.message||e)));else if(NUVOK()&&!nuvDesl())nuvemPut("EC",ECO,ECO.t)}catch(e){}},2500);if(typeof ecoCatAgendar==="function")ecoCatAgendar()}
function ecoJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{});
  const pick=(L1,L2)=>{const m=new Map();for(const x of(L2||[]).concat(L1||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}return[...m.values()]};
  const def=a.def&&b.def?((b.def.em||0)>(a.def.em||0)?b.def:a.def):(a.def||b.def||null);
  return{t:Math.max(a.t||0,b.t||0),art:pick(a.art,b.art),mov:pick(a.mov,b.mov),forn:pick(a.forn,b.forn),enc:pick(a.enc,b.enc),inv:pick(a.inv,b.inv),def,del}}
function ecoSig(x){const L=x.art.concat(x.mov,x.forn,x.enc,x.inv);return L.length+"|"+Math.max(0,...L.map(d=>d.em||0))}
async function ecoTrazerNuvem(){try{await ecoCarregar();const econ=ecoEcon();if(!econ&&(RO||!NUVOK()||nuvDesl()))return;const idx=(await(await(econ?sbNuvem("GET",""):nuvem("GET",""))).json()).itens||{};
    await ecfTrazerNuvem(idx,econ);
    if(idx.EC&&(idx.EC.t||0)>(ECO.t||0)){const j=ecoNorm(econ?await ecoNuvGet():await nuvemGet("EC")),n=ecoJuntar(ECO,j);
      const dif=ecoSig(n)!==ecoSig(j)||JSON.stringify(n.def)!==JSON.stringify(j.def);
      ECO=n;ecoCalcC=null;DB.put("kv","econo",ECO);if(dif){if(econ)ecoNuvPut(Date.now()).catch(()=>{});else nuvemPut("EC",ECO,Date.now())}if(curTab&&/^eco[A-Z]/.test(curTab))ecoRender(curTab)}
    else if((ECO.t||0)>((idx.EC||{}).t||0)&&(ECO.art.length||ECO.mov.length)){if(econ)await ecoNuvPut();else await nuvemPut("EC",ECO,ECO.t)}}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Econo360/nuvem",e)}}

// ---------- 0.9.160: faturas (peça «EF» em g360_estado; ficheiros no bucket privado «eco-faturas» do Supabase) ----------
// Peça à parte (e não dentro de «EC») para as versões antigas da app, que só conhecem as listas do ECO, não as perderem ao juntar.
var ECF=ECF||{t:0,fat:[],del:{}},ecfPronto,ECF_B="eco-faturas";
function ecfNorm(v){const o=v&&typeof v==="object"?v:{};return{t:+o.t||0,fat:Array.isArray(o.fat)?o.fat.filter(x=>x&&x.id):[],del:o.del&&typeof o.del==="object"?o.del:{}}}
function ecfCarregar(){return ecfPronto||(ecfPronto=DB.get("kv","econofat").then(v=>{if(!RO||ecoEcon()){const n=ecfNorm(v);if((n.t||0)>=(ECF.t||0))ECF=n}}).catch(()=>{}))}
ecfCarregar();
function ecfGuardar(o){if((RO&&!ecoEcon())||LIMPAR)return;const t=Date.now();if(o){o.em=t;o.mod=String(EU&&EU.email||"")}ECF.t=t;DB.put("kv","econofat",ECF);
  nuvFila("ecfH",()=>{try{if(ecoEcon())gz(ECF).then(b=>sbNuvem("PUT","EF",b,ECF.t)).catch(e=>toast("Econo360: não foi possível guardar as faturas na nuvem — "+(e.message||e)));else if(NUVOK()&&!nuvDesl())nuvemPut("EF",ECF,ECF.t)}catch(e){}},2000)}
function ecfJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{}),m=new Map();
  for(const x of(b.fat||[]).concat(a.fat||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}
  return{t:Math.max(a.t||0,b.t||0),fat:[...m.values()],del}}
async function ecfTrazerNuvem(idx,econ){try{await ecfCarregar();const r=idx.EF;
    if(r&&(r.t||0)>(ECF.t||0)){const j=ecfNorm(econ?await(async()=>{const x=await sbNuvem("GET","EF");return x.ok?ungz(await x.arrayBuffer()):null})():await nuvemGet("EF")),n=ecfJuntar(ECF,j);
      const sig=x=>x.fat.length+"|"+Math.max(0,...x.fat.map(f=>f.em||0));ECF=n;DB.put("kv","econofat",ECF);
      if(sig(n)!==sig(j)){if(econ)sbNuvem("PUT","EF",await gz(ECF),Date.now()).catch(()=>{});else nuvemPut("EF",ECF,Date.now())}
      if(curTab==="ecoFat"&&typeof ecoRender==="function")ecoRender(curTab)}
    else if((ECF.t||0)>((r||{}).t||0)&&ECF.fat.length){if(econ)await sbNuvem("PUT","EF",await gz(ECF),ECF.t);else await nuvemPut("EF",ECF,ECF.t)}}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Econo360/faturas",e)}}

// ----- widget do Painel (o conteúdo é desenhado por econo/econo.js, carregado quando é preciso) -----
WG_MOD.econo={l:"Ec",c:ECO_COR,n:"Econo360"};
WIDGETS.push({id:"ecorep",mod:"econo",nome:"Economato",desc:"Artigos para repor e requisições por tratar (Econo360)",r(){return wgLazy("econo","ecorep")}});
