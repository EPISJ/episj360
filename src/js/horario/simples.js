/* ===================== Horários360 — versão simples (0.9.136) =====================
   A versão simples serve para mostrar os horários vindos do Untis e comunicá-los aos formadores:
   · Semana (hsSem): o horário de uma semana concreta, com as datas, os feriados e as interrupções do Calendário Escolar
     e o horário em vigor em cada dia (os períodos do Crono360/Untis); por formador, turma ou sala;
   · Comunicar (hsCom, só a Direção): quem tem o horário mudado desde o último aviso, e avisos por
     email (Office 365 da escola), notificação no telemóvel (ntfy, gratuito, sem conta) e SMS pelo telemóvel da escola;
     avisos automáticos opcionais depois de cada alteração (por exemplo, depois de importar os PDF do Untis).
   A versão completa é o editor de sempre (separador «Horários», o EduSchedule) — escolhe-se em Simples / Completa.
   Dados na peça «H3» da base de dados (IndexedDB «h3» + g360_estado), só da Direção (os telemóveis nunca são publicados).
   Atenção ao arranque: show() pode chamar hsRender antes de este ficheiro ter corrido — por isso tudo começa com await. */
var H3=null,H3_IMP=false,H3S={tipo:"",quem:"",seg:""},H3_PRONTO=null,H3_H=null,H3_ENVIO=false;
const H3_MSG0={assunto:"Horário — alterações a partir de {semana}",
  corpo:"Olá {nome},\n\nO seu horário na EPISJ 360 foi atualizado.\n\n{alteracoes}\n\nPode ver o horário de cada semana em {ligacao} (Horários360 › Semana).\n\nCom os melhores cumprimentos,\nDireção Pedagógica",
  curta:"EPISJ 360: o seu horário mudou ({n}). Veja em {ligacao}"};
function h3Norm(v){v=v&&typeof v==="object"?v:{};return{t:+v.t||0,salT:+v.salT||0,modo:v.modo==="completa"?"completa":"simples",sal:v.sal||"",tel:v.tel&&typeof v.tel==="object"?v.tel:{},ult:v.ult&&typeof v.ult==="object"?v.ult:{},
  env:Array.isArray(v.env)?v.env:[],auto:Object.assign({on:false,email:true,push:true,min:10},v.auto||{}),msg:Object.assign({},H3_MSG0,v.msg||{}),visto:+v.visto||0}}
function h3Carregar(){if(!H3_PRONTO)H3_PRONTO=DB.get("kv","h3").then(v=>{H3=h3Norm(v);h3ModoAplicar()}).catch(()=>{H3=h3Norm(null);h3ModoAplicar()});return H3_PRONTO}
function h3Sal(){const a=new Uint8Array(9);crypto.getRandomValues(a);return [...a].map(x=>x.toString(36).padStart(2,"0")).join("")}
function h3Guardar(){if(RO||LIMPAR||!H3)return;H3.t=Date.now();DB.put("kv","h3",H3);clearTimeout(H3_H);
  H3_H=setTimeout(()=>{try{if(NUVOK()&&!nuvDesl())nuvemPut("H3",H3,H3.t)}catch(e){}},2500);try{guidePubAgendar()}catch(e){}}
function h3Juntar(a,b){const n=h3Norm((b.t||0)>(a.t||0)?b:a),o=(b.t||0)>(a.t||0)?a:b;
  n.tel=Object.assign({},o.tel,n.tel);for(const [k,v] of Object.entries(o.ult||{}))if(!n.ult[k]||(v.t||0)>(n.ult[k].t||0))n.ult[k]=v;
  const m=new Map();for(const x of(o.env||[]).concat(n.env||[]))m.set(x.t+"|"+x.por,x);n.env=[...m.values()].sort((x,y)=>x.t-y.t).slice(-200);if(o.sal&&(!n.sal||(o.salT||0)<(n.salT||Infinity))){n.sal=o.sal;n.salT=o.salT||0}return n}
async function h3TrazerNuvem(){try{await h3Carregar();if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{};
    if(idx.H3&&(idx.H3.t||0)>(H3.t||0)){const j=h3Norm(await nuvemGet("H3"));H3=h3Juntar(H3,j);DB.put("kv","h3",H3);h3ModoAplicar();if(curTab==="hsCom")hsComRender()}
    else if((H3.t||0)>((idx.H3||{}).t||0))await nuvemPut("H3",H3,H3.t)}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Horários360/nuvem",e)}}

/* ---------- Simples / Completa ---------- */
function h3Modo(){if(H3&&H3.t)return H3.modo;try{return localStorage.getItem("h360_modo")==="completa"?"completa":"simples"}catch(e){return "simples"}}
function h3EschOk(){return h3Modo()==="completa"||H3_IMP}
function h3ModoAplicar(){const m=h3Modo();try{localStorage.setItem("h360_modo",m)}catch(e){}
  const M=MODULOS.find(x=>x.id==="eduschedule");if(M)M.inicio=m==="completa"?"esch":"hsSem";
  const box=document.querySelector("[data-h3modo]");if(box){box.hidden=!(typeof podePublicar==="function"&&podePublicar()&&!RO);box.querySelectorAll("button").forEach(b=>b.classList.toggle("on",b.dataset.h3m===m))}
  const b=document.querySelector('#nav button[data-t="esch"]');if(b)b.hidden=!podeVer("esch");
  h3EsMenuAtual();
  if(curTab==="esch"&&!h3EschOk())show("hsSem")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-h3m]");if(!b||RO)return;h3Carregar().then(()=>{H3.modo=b.dataset.h3m;h3Guardar();h3ModoAplicar();
  toast(H3.modo==="completa"?"Versão completa: o editor de horários está em «Horários»":"Versão simples: mostra os horários vindos do Untis e comunica-os aos formadores");show(H3.modo==="completa"?"esch":"hsSem")})});

// no editor (versão completa) o menu da EPISJ 360 está escondido: o menu do editor ganha Simples / Completa e Semana / Comunicar
function h3EsMenu(d){if(!d||!d.body||d.getElementById("h3ir"))return;const cab=d.querySelector(".g-mh");const cx=cab&&cab.parentElement;if(!cx)return;
  const x=d.createElement("div");x.id="h3ir";x.style.cssText="display:flex;flex-direction:column;gap:6px;margin:2px 4px 8px";
  const bt=(t,on,f,tit)=>{const b=d.createElement("button");b.type="button";b.textContent=t;if(tit)b.title=tit;b.style.cssText="flex:1;border:0;font:inherit;font-size:12px;font-weight:600;padding:5px 8px;cursor:pointer;background:"+(on?"var(--g-brand,#163269)":"transparent")+";color:"+(on?"#fff":"var(--g-muted,#6b7385)");b.onclick=f;return b};
  const lig=(t,f)=>{const a=d.createElement("a");a.href="#";a.textContent=t;a.style.cssText="font-size:12.5px;font-weight:500;color:var(--g-brand,#163269);text-decoration:none;padding:3px 7px";a.onclick=e=>{e.preventDefault();f()};return a};
  const modo=d.createElement("div");modo.style.cssText="display:flex;border:1px solid var(--g-line,#e3e7ee);border-radius:999px;overflow:hidden;background:#fff";
  const m=h3Modo(),dir=podePublicar()&&!RO,mudar=v=>h3Carregar().then(()=>{H3.modo=v;H3_IMP=false;h3Guardar();h3ModoAplicar();aplicarPerfil();show(v==="completa"?"esch":"hsSem")});
  if(dir){modo.append(bt("Simples",m==="simples",()=>mudar("simples"),"Mostra os horários vindos do Untis e comunica-os aos formadores"),bt("Completa",m==="completa",()=>{if(m!=="completa")mudar("completa")},"O editor de horários completo"));x.append(modo)}
  const ls=d.createElement("div");ls.style.cssText="display:flex;flex-wrap:wrap;gap:2px";ls.append(lig("Semana",()=>{H3_IMP=false;$("#esMsg").innerHTML="";show("hsSem")}));if(dir)ls.append(lig("Comunicar",()=>{H3_IMP=false;$("#esMsg").innerHTML="";show("hsCom")}));x.append(ls);
  cab.after(x)}
function h3EsMenuAtual(){try{const d=$("#esFr").contentDocument,x=d&&d.getElementById("h3ir");if(x){x.remove();h3EsMenu(d)}}catch(e){}}
/* ---------- utilidades ---------- */
const h3Seg=d=>{const x=calD(d),w=(x.getDay()+6)%7;return calMais(d,-w)};
const h3Lig=()=>location.origin+location.pathname.replace(/index\.html$/,"");
function h3Tel(v){let s=String(v||"").replace(/[^\d+]/g,"");if(/^00/.test(s))s="+"+s.slice(2);if(/^\d{9}$/.test(s))s="+351"+s;return /^\+\d{8,15}$/.test(s)?s:""}
function h3Topico(email){const s=(H3&&H3.sal)||(PUB&&PUB.h3&&PUB.h3.sal)||"";if(!s||!email)return "";const e=String(email).trim().toLowerCase();return "episj360-"+esHash(e+"|"+s)+esHash(s+"|"+e)+esHash(s+e+s)}
function h3ProfDe(st,tid){const P=cfg.profs||[];return P.find(p=>p.id===tid)||P.find(p=>p.id===(ESD.mapaT||{})[tid])||null}
function h3Email(p){return p?(String(p.email||"").trim().toLowerCase()||(typeof emailAuto==="function"?emailAuto(p.nome):"")):""}
// o que se mostra numa célula, para formador (t), turma (c) ou sala (r)
function h3Celulas(st,V,tipo,id){const T=new Map((st.teachers||[]).map(t=>[t.id,t])),C=new Map((st.classes||[]).map(c=>[c.id,c])),S=new Map((st.subjects||[]).map(x=>[x.id,x])),R=new Map((st.rooms||[]).map(x=>[x.id,x]));
  const les=new Map((V.lessons||[]).map(l=>[l.id,l])),out=new Map();
  for(const cd of V.cards||[]){const l=les.get(cd.lessonId);if(!l)continue;const lin=(l.linhas||[]).map((x,i)=>Object.assign({i},x));
    for(let k=0;k<(cd.len||1);k++){const rr=(cd.rx&&cd.rx[k])||cd.r||[];
      const sel=tipo==="t"?lin.filter(x=>x.t===id):tipo==="c"?((l.classIds||[]).includes(id)?lin.filter(x=>!x.cls||x.cls.includes(id)):[]):lin.filter(x=>(rr[x.i]||x.r)===id);
      for(const x of sel){const s=S.get(x.s)||{},sala=R.get(rr[x.i])||R.get(x.r),tu=(x.cls&&x.cls.length?x.cls:(l.classIds||[])).map(c=>(C.get(c)||{}).name).filter(Boolean).join(", "),f=T.get(x.t)||{};
        const key=cd.day+"|"+(cd.period+k);(out.get(key)||out.set(key,[]).get(key)).push({s,disc:s.short||s.name||"—",nome:s.name||"",tu,form:f.short||f.name||"",formN:f.name||"",sala:sala?sala.name:""})}}}
  return out}

/* ---------- Semana ---------- */
async function hsRender(){await null;try{await esdPronto}catch(e){}try{await h3Carregar()}catch(e){}
  const out=$("#hsOut"),hero=$("#hsHero");if(!out)return;const st=mhEstado(),a=anoAtivo(),pf=perfilAtual(),dir=podePublicar()&&!RO;
  $("#hsImp").style.display=dir?"":"none";$("#hsAvisos").innerHTML=pf==="prof"?h3AvisosFormador():"";
  if(!st){hero.innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Horários</h1><div class="sub">${esc(a.nome)}</div></div></div></div>`;
    out.innerHTML=`<div class="pp-vz">${ICO.cal}<p>${RO?"A Direção ainda não publicou o horário de "+esc(a.nome)+".":"Ainda não há horário para "+esc(a.nome)+". Importe os PDF do Untis (botão verde acima)."}</p></div>`;$("#hsQuem").innerHTML="";return}
  const T=(st.teachers||[]).slice().sort((x,y)=>COLL_PT.compare(String(x.name),String(y.name))),C=(st.classes||[]).slice().sort((x,y)=>COLL_PTN.compare(String(x.name),String(y.name))),R=(st.rooms||[]).slice().sort((x,y)=>COLL_PTN.compare(String(x.name),String(y.name)));
  const tipoEl=$("#hsTipo"),quemEl=$("#hsQuem");tipoEl.parentNode.style.display=pf==="form"?"none":"";
  if(!H3S.tipo){H3S.tipo=pf==="form"?"c":"t";
    if(pf==="prof"){const me=(cfg.profs||[]).find(p=>String(p.email||"").toLowerCase()===String(EU&&EU.email||""));const t=me&&T.find(t=>t.id===me.id||(ESD.mapaT||{})[t.id]===me.id);if(t)H3S.quem=t.id}
    if(pf==="form"){const tc=(EU&&EU.turma)||lsJ("guide_mh_turma","");const c=C.find(c=>norm(c.name)===norm(tc));if(c)H3S.quem=c.id}}
  if(pf==="form")H3S.tipo="c";tipoEl.value=H3S.tipo;
  const L=H3S.tipo==="t"?T.map(t=>[t.id,t.name+(t.short&&t.short!==t.name?" ("+t.short+")":"")]):H3S.tipo==="r"?R.map(r=>[r.id,r.name]):C.map(c=>[c.id,c.name+(c.full&&c.full!==c.name?" — "+c.full:"")]);
  if(!L.some(x=>x[0]===H3S.quem))H3S.quem=(L[0]||[""])[0];
  quemEl.innerHTML=L.map(([id,n])=>`<option value="${esc(id)}"${id===H3S.quem?" selected":""}>${esc(n)}</option>`).join("");
  const hj=calHoje();if(!H3S.seg){let d=hj;const w=calD(d).getDay();if(w===6)d=calMais(d,2);else if(w===0)d=calMais(d,1);H3S.seg=h3Seg(d)}
  $("#hsData").value=H3S.seg;
  const VL=cpVersoes(st).slice().sort((p,q)=>String(p.de||"").localeCompare(String(q.de||""))),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],NL=calNaoLetivos(a);
  const dias=D.map((d,i)=>{const dt=calMais(H3S.seg,i);let V=cpVersaoEm(VL,dt);if(!V&&VL.length===1)V=VL[0];const nl=NL.get(dt),fora=(a.inicio&&dt<a.inicio)||(a.fim&&dt>a.fim);return{i,nome:d,dt,V,nl,fora}});
  const nomeQ=(L.find(x=>x[0]===H3S.quem)||["",""])[1];let n=0;const cel=new Map(),cache=new Map();
  for(const d of dias){if(!d.V||d.nl||d.fora)continue;if(!cache.has(d.V))cache.set(d.V,h3Celulas(st,d.V,H3S.tipo,H3S.quem));const m=cache.get(d.V);
    P.forEach((p,pi)=>{const L2=m.get(d.i+"|"+pi);if(L2){cel.set(d.i+"|"+pi,L2);n+=L2.length}})}
  const fim=calMais(H3S.seg,D.length-1),mesmo=H3S.seg.slice(0,7)===fim.slice(0,7);
  const tit=mesmo?`${calD(H3S.seg).getDate()} a ${calDM(fim,{day:"numeric",month:"long"})}`:`${calDM(H3S.seg,{day:"numeric",month:"short"})} a ${calDM(fim,{day:"numeric",month:"short"})}`;
  const rotT={t:"Formador",c:"Turma",r:"Sala"}[H3S.tipo],estaSem=H3S.seg===h3Seg(hj);
  hero.innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Semana de ${esc(tit)}</h1><div class="sub">${esc(rotT)} · ${esc(nomeQ)}${estaSem?" · esta semana":""}</div></div><span class="grow"></span><div class="ay-pct"><b>${n}</b>tempo${n===1?"":"s"} nesta semana</div></div></div>`;
  const muda=[...new Set(dias.filter(d=>d.V).map(d=>d.V))];
  let h=muda.length>1?`<div class="msg info" style="margin:0 0 10px">O horário muda nesta semana: a partir de <b>${esc(calDM(dias.find(d=>d.V===muda[1]).dt,{weekday:"long",day:"numeric",month:"long"}))}</b>.</div>`:"";
  h+=`<div class="mzh hsw" style="grid-template-columns:76px repeat(${D.length},minmax(110px,1fr))"><div class="h"></div>`+dias.map(d=>`<div class="h${d.dt===hj?" hj":""}">${esc(d.nome)}<small>${esc(calDM(d.dt))}</small>${d.nl?`<em class="${d.nl.t}">${esc(d.nl.n)}</em>`:d.fora?`<em>fora do ano letivo</em>`:""}</div>`).join("");
  P.forEach((p,pi)=>{h+=`<div class="p">${esc(p.label||pi+1)}<div class="hint" style="margin:0;font-weight:400">${esc(p.start||"")}${p.end?"–"+esc(p.end):""}</div></div>`;
    for(const d of dias){const c=cel.get(d.i+"|"+pi),cl=d.nl?" nl "+d.nl.t:d.fora?" nl":"";
      h+=`<div class="c${cl}${d.dt===hj?" hj":""}">${c?c.map(x=>{const cor=x.s.color||"#2f5fb8",sub=H3S.tipo==="t"?[x.tu,x.sala]:H3S.tipo==="c"?[x.form,x.sala]:[x.tu,x.form];
        return `<div class="a" style="background:${esc(cor)};color:${corTexto(cor)}" title="${esc([x.nome,x.formN,x.tu,x.sala].filter(Boolean).join(" · "))}"><b>${esc(x.disc)}</b><span>${esc(sub.filter(Boolean).join(" · "))}</span></div>`}).join(""):""}</div>`}});
  const x=ESD.porAno&&ESD.porAno[a.id];
  out.innerHTML=h+`</div>`+(n?"":`<p class="hint">Sem aulas nesta semana.</p>`)+`<p class="hint">${esc(st.name||"")} · ${esc(a.nome)}${x&&x.quando?" · horário atualizado a "+new Date(x.quando).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):""}</p>`}
function h3AvisosFormador(){const em=String(EU&&EU.email||"").toLowerCase(),tp=h3Topico(em);
  return `<div class="card" style="margin-top:14px"><h3 style="margin:0 0 6px">Avisos de alterações</h3><p class="hint" style="margin:0 0 8px">Quando o seu horário muda, a Direção avisa-o por email em <b>${esc(em)}</b>.${tp?` Para receber também uma notificação no telemóvel (gratuito, sem criar conta): instale a app <b>ntfy</b> (App Store ou Google Play), carregue em <b>+</b> e escreva o tópico abaixo — ou abra a ligação no telemóvel.`:""}</p>
    ${tp?`<div class="row" style="align-items:center"><code class="h3top">${esc(tp)}</code><a class="b s" href="https://ntfy.sh/${encodeURIComponent(tp)}" target="_blank" rel="noopener">Abrir no ntfy</a><button class="b s" data-h3cp="${esc(tp)}">Copiar tópico</button></div>`:""}</div>`}
$("#hsTipo").onchange=e=>{H3S.tipo=e.target.value;H3S.quem="";hsRender()};
$("#hsQuem").onchange=e=>{H3S.quem=e.target.value;hsRender()};
$("#hsData").onchange=e=>{if(e.target.value){H3S.seg=h3Seg(e.target.value);hsRender()}};
$("#hsAnt").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),-7);hsRender()};
$("#hsSeg").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),7);hsRender()};
$("#hsHoje").onclick=()=>{H3S.seg="";hsRender()};
$("#hsImp").onclick=()=>h3Importar();
document.addEventListener("click",e=>{const b=e.target.closest("[data-h3cp]");if(!b)return;try{navigator.clipboard.writeText(b.dataset.h3cp);toast("Copiado")}catch(x){}});

/* ---------- Importar do Untis a partir da versão simples ----------
   Os PDF escolhem-se aqui e são entregues ao importador do editor (o mesmo da versão completa), onde se confirma a importação. */
function h3Importar(){const inp=document.createElement("input");inp.type="file";inp.multiple=true;inp.accept=".pdf,.zip,application/pdf,application/zip";inp.style.display="none";document.body.append(inp);
  inp.onchange=async()=>{const fs=[...inp.files];inp.remove();if(!fs.length)return;H3_IMP=true;aplicarPerfil();show("esch");
    const fr=$("#esFr");let w=null;for(let i=0;i<100;i++){try{w=fr.contentWindow;if(w&&typeof w.updfEscolher==="function"&&fr.classList.contains("pronto"))break}catch(e){}w=null;await new Promise(r=>setTimeout(r,200))}
    if(!w){toast("O editor de horários não abriu — tente outra vez");return}
    const Pr=w.HTMLInputElement.prototype,orig=Pr.click;
    Pr.click=function(){if(this.type==="file"){Pr.click=orig;try{const dt=new w.DataTransfer();fs.forEach(f=>dt.items.add(f));this.files=dt.files;this.dispatchEvent(new w.Event("change",{bubbles:true}))}catch(e){toast("Não foi possível entregar os ficheiros ao importador: "+e.message)}return}return orig.call(this)};
    try{w.updfEscolher()}catch(e){Pr.click=orig;toast("Não foi possível importar: "+e.message);return}
    setTimeout(()=>{if(Pr.click!==orig)Pr.click=orig},4000);
    $("#esMsg").innerHTML=`<div class="msg info h3volta"><span>Confirme a importação na janela do Horários360. Quando terminar, volte à vista simples — os formadores com o horário mudado aparecem em «Comunicar».</span><button class="b s" data-h3volta>Voltar à semana</button></div>`};
  inp.click()}
document.addEventListener("click",e=>{if(!e.target.closest("[data-h3volta]"))return;H3_IMP=false;$("#esMsg").innerHTML="";aplicarPerfil();show(h3Modo()==="completa"?"hsCom":"hsSem")});

/* ---------- Comunicar: o que mudou desde o último aviso ---------- */
// as aulas de um formador no horário em vigor e nos seguintes, em frases que se podem comparar e mostrar
function h3Linhas(st,tid){const VL=cpVersoes(st),hj=calHoje(),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],o=new Set();
  for(const V of VL){if(V.ate&&V.ate<hj)continue;const m=h3Celulas(st,V,"t",tid),pre=V.de&&V.de>hj?"A partir de "+calDM(V.de)+" · ":"";
    for(const [k,L] of m){const [di,pi]=k.split("|").map(Number),p=P[pi]||{};for(const x of L)o.add(`${pre}${D[di]||"?"} ${p.start||p.label||pi+1}${p.end?"–"+p.end:""} · ${x.disc}${x.tu?" · "+x.tu:""}${x.sala?" · "+x.sala:""}`)}}
  const DS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],ord=s=>{const m=/(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)\S* (\d\d:\d\d)?/.exec(s);return (s.startsWith("A partir")?"1":"0")+(m?DS.indexOf(m[1].slice(0,3))+(m[2]||""):"")+s};
  return [...o].sort((a,b)=>ord(a).localeCompare(ord(b)))}
function h3Pendentes(){const st=mhEstado();if(!st||!H3)return[];const r=[];
  for(const t of st.teachers||[]){const cur=h3Linhas(st,t.id),ant=H3.ult[t.id],p=h3ProfDe(st,t.id);
    if(!ant){if(cur.length)r.push({t,p,cur,novo:true,mais:cur,menos:[]});continue}
    const A=new Set(ant.c||[]),B=new Set(cur),mais=cur.filter(x=>!A.has(x)),menos=(ant.c||[]).filter(x=>!B.has(x));if(mais.length||menos.length)r.push({t,p,cur,novo:false,mais,menos})}
  return r.sort((a,b)=>COLL_PT.compare(String(a.t.name),String(b.t.name)))}
function h3Txt(x){if(x.novo)return "O seu horário:\n"+x.cur.map(s=>"  "+s).join("\n");
  return (x.mais.length?"Aulas novas ou mudadas:\n"+x.mais.map(s=>"  + "+s).join("\n"):"")+(x.mais.length&&x.menos.length?"\n\n":"")+(x.menos.length?"Deixam de existir:\n"+x.menos.map(s=>"  − "+s).join("\n"):"")}
function h3Preencher(tpl,x){const n=x.novo?"horário novo":(x.mais.length+x.menos.length)+" alteraç"+(x.mais.length+x.menos.length===1?"ão":"ões");
  const sem=calDM(h3Seg(calHoje()),{day:"numeric",month:"long"});
  return String(tpl||"").replace(/\{nome\}/g,(x.p&&x.p.nome)||x.t.name||"").replace(/\{alteracoes\}/g,h3Txt(x)).replace(/\{ligacao\}/g,h3Lig()).replace(/\{semana\}/g,sem).replace(/\{n\}/g,n)}
function h3Marcar(x,canais){H3.ult[x.t.id]={c:x.cur,t:Date.now()};H3.env.push({t:Date.now(),por:(EU&&EU.email)||"",quem:x.t.name||"",canais,n:x.novo?-1:x.mais.length+x.menos.length});if(H3.env.length>200)H3.env=H3.env.slice(-200)}
async function h3Push(x){const tp=h3Topico(h3Email(x.p));if(!tp)throw new Error("sem tópico");
  const r=await fetch("https://ntfy.sh/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:tp,title:"EPISJ 360 — Horário",message:h3Preencher(H3.msg.curta,x),click:h3Lig(),tags:["calendar"]})});
  if(!r.ok)throw new Error("ntfy "+r.status)}
async function h3Email1(x){const to=h3Email(x.p);if(!to)throw new Error("sem email");await msEnviar({to,subject:h3Preencher(H3.msg.assunto,x),body:h3Preencher(H3.msg.corpo,x)})}
function h3SmsLink(L){const nums=L.map(x=>h3Tel(H3.tel[(x.p||{}).id])).filter(Boolean);if(!nums.length)return "";
  const body=encodeURIComponent(L.length===1?h3Preencher(H3.msg.curta,L[0]):"EPISJ 360: o seu horário mudou. Veja em "+h3Lig()),ios=/iPhone|iPad|Macintosh/.test(navigator.userAgent);
  return ios?`sms:/open?addresses=${nums.join(",")}&body=${body}`:`sms:${nums.join(",")}?body=${body}`}
async function h3Enviar(L,canais,msg){if(H3_ENVIO||!L.length)return;H3_ENVIO=true;let ok=0,erros=[];
  try{for(let i=0;i<L.length;i++){const x=L[i],feito=[];if(msg)msg(`A enviar ${i+1} de ${L.length}…`);
      if(canais.includes("email"))try{await h3Email1(x);feito.push("email")}catch(e){erros.push((x.t.name||"")+": email — "+(e.message||e))}
      if(canais.includes("push"))try{await h3Push(x);feito.push("push")}catch(e){erros.push((x.t.name||"")+": notificação — "+(e.message||e))}
      if(feito.length){h3Marcar(x,feito);ok++}
      if(canais.includes("email")&&i<L.length-1)await new Promise(r=>setTimeout(r,2100))}}
  finally{H3_ENVIO=false;h3Guardar()}
  return{ok,erros}}
// avisos automáticos: do navegador de quem é da Direção, alguns minutos depois de o horário mudar (um computador de cada vez)
async function h3AutoVer(){try{if(!H3||!H3.auto.on||RO||H3_ENVIO||!podePublicar())return;const a=anoAtivo(),x=ESD.porAno&&ESD.porAno[a.id];if(!x||!x.quando)return;
    if(Date.now()-x.quando<(+H3.auto.min||10)*60000||curTab==="esch")return;const L=h3Pendentes();if(!L.length)return;
    const can=[];if(H3.auto.email&&MSACC)can.push("email");if(H3.auto.push)can.push("push");if(!can.length)return;
    if(!(await trincoNuvem("h3-auto",300)))return;const r=await h3Enviar(L,can);if(r&&r.ok)toast(`Horários360: ${r.ok} formador${r.ok===1?"":"es"} avisado${r.ok===1?"":"s"} das alterações do horário`);if(curTab==="hsCom")hsComRender()}catch(e){console.warn("Horários360/avisos",e)}}
setInterval(h3AutoVer,60000);

async function hsComRender(){await null;try{await esdPronto}catch(e){}await h3Carregar();const el=$("#hsComOut");if(!el)return;
  if(!podePublicar()||RO){el.innerHTML=`<div class="msg info">Só a Direção comunica os horários.</div>`;return}
  if(!H3.sal){try{await h3TrazerNuvem()}catch(e){}if(!H3.sal){H3.sal=h3Sal();H3.salT=Date.now();h3Guardar()}}
  const st=mhEstado(),L=st?h3Pendentes():[],ms=!!MSACC;
  $("#hsComHero").innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Comunicar horários</h1><div class="sub">Avisa cada formador quando o horário vindo do Untis muda — só o que mudou para ele.</div></div><span class="grow"></span><div class="ay-pct"><b>${L.length}</b>formador${L.length===1?"":"es"} por avisar</div></div></div>`;
  if(!st){el.innerHTML=`<div class="pp-vz">${ICO.cal}<p>Ainda não há horário para ${esc(anoAtivo().nome)}. Importe os PDF do Untis em «Semana».</p></div>`;return}
  const sms=h3SmsLink(L),semEm=L.filter(x=>!h3Email(x.p)).length;
  let h=`<div class="card"><h3 style="margin:0 0 4px">Por avisar</h3>
    <p class="hint" style="margin:0 0 10px">${L.length?"Formadores com o horário diferente do último aviso. Escolha a quem enviar e por onde.":"Todos os formadores já foram avisados do horário atual."}</p>`;
  if(L.length){h+=`<div class="tw"><table class="rt"><thead><tr><th><input type="checkbox" id="h3All" checked aria-label="Todos"></th><th>Formador</th><th>Email</th><th>Telemóvel</th><th>O que mudou</th></tr></thead><tbody>`+
    L.map(x=>`<tr><td><input type="checkbox" data-h3sel="${esc(x.t.id)}" checked></td><td>${esc((x.p&&x.p.nome)||x.t.name)}</td><td>${esc(h3Email(x.p)||"—")}</td><td>${esc(h3Tel(H3.tel[(x.p||{}).id])||"—")}</td>
      <td><details><summary>${x.novo?"horário novo ("+x.cur.length+" tempo"+(x.cur.length===1?"":"s")+")":`${x.mais.length?"+"+x.mais.length:""}${x.mais.length&&x.menos.length?" / ":""}${x.menos.length?"−"+x.menos.length:""}`}</summary><pre class="h3dif">${esc(h3Txt(x))}</pre></details></td></tr>`).join("")+`</tbody></table></div>
    <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px">
      <button class="b" id="h3Em"${ms?"":" disabled title=\"Entre com o Office 365 para enviar emails\""}>Enviar email</button>
      <button class="b" id="h3Pu">Enviar notificação ao telemóvel</button>
      <button class="b" id="h3EmPu"${ms?"":" disabled"}>Email e notificação</button>
      ${sms?`<a class="b s" id="h3Sms" href="${esc(sms)}">SMS pelo telemóvel</a>`:""}
      <span class="grow"></span><button class="b s" id="h3Marc" title="Dar como avisados sem enviar nada">Marcar como avisados</button></div>
    <p class="hint" id="h3Msg" style="margin:8px 0 0">${ms?"":"Para enviar emails, entre com o Office 365 da escola (como para os outros envios). "}${semEm?semEm+" sem email em Escola360 › Formadores. ":""}</p>`}
  h+=`</div>`;
  // avisos automáticos
  h+=`<div class="card"><h3 style="margin:0 0 4px">Avisos automáticos</h3>
    <label class="chk"><input type="checkbox" data-h3a="on"${H3.auto.on?" checked":""}> Avisar sozinho os formadores ${esc(String(H3.auto.min))} minutos depois de o horário mudar (por exemplo, depois de importar os PDF do Untis)</label>
    <div class="row" style="gap:16px;margin-top:6px"><label class="chk"><input type="checkbox" data-h3a="email"${H3.auto.email?" checked":""}> por email</label><label class="chk"><input type="checkbox" data-h3a="push"${H3.auto.push?" checked":""}> por notificação no telemóvel</label></div>
    <p class="hint" style="margin:6px 0 0">Os avisos saem do navegador de quem é da Direção e tem a EPISJ 360 aberta (um computador de cada vez). O SMS pelo telemóvel é sempre à mão.</p></div>`;
  // mensagem
  h+=`<div class="card"><h3 style="margin:0 0 4px">Mensagem</h3><p class="hint" style="margin:0 0 8px">Pode usar {nome}, {alteracoes}, {ligacao}, {semana} e, na mensagem curta, {n}.</p>
    <label class="h3lb">Assunto do email<input type="text" data-h3m2="assunto" value="${esc(H3.msg.assunto)}"></label>
    <label class="h3lb">Email<textarea data-h3m2="corpo" rows="9">${esc(H3.msg.corpo)}</textarea></label>
    <label class="h3lb">Mensagem curta (notificação e SMS)<input type="text" data-h3m2="curta" value="${esc(H3.msg.curta)}"></label>
    <div class="row" style="margin-top:6px"><button class="b s" id="h3MsgRep">Repor as mensagens originais</button></div></div>`;
  // contactos
  const F=(st.teachers||[]).map(t=>({t,p:h3ProfDe(st,t.id)})).filter(x=>x.p).sort((a,b)=>COLL_PT.compare(a.p.nome,b.p.nome));
  h+=`<div class="card"><h3 style="margin:0 0 4px">Contactos dos formadores</h3>
    <p class="hint" style="margin:0 0 8px">O email vem de Escola360 › Formadores. Os telemóveis servem só para o SMS e ficam só com a Direção (não são publicados). O tópico é o que cada formador escreve na app ntfy para receber as notificações — também o vê em Horários360 › Semana.</p>
    <div class="tw"><table class="rt"><thead><tr><th>Formador</th><th>Email</th><th>Telemóvel</th><th>Tópico das notificações</th></tr></thead><tbody>`+
    F.map(({p})=>{const tp=h3Topico(h3Email(p));return `<tr><td>${esc(p.nome)}</td><td>${esc(h3Email(p)||"—")}</td><td><input type="text" data-h3tel="${esc(p.id)}" value="${esc(H3.tel[p.id]||"")}" placeholder="9xx xxx xxx" inputmode="tel" style="width:140px"></td><td>${tp?`<code class="h3top">${esc(tp)}</code> <button class="b s" data-h3cp="${esc(tp)}" title="Copiar">Copiar</button>`:"—"}</td></tr>`}).join("")+`</tbody></table></div></div>`;
  // como funciona
  h+=`<div class="card"><h3 style="margin:0 0 4px">Como chegam os avisos (tudo gratuito)</h3><ul class="hint" style="margin:0;padding-left:18px">
    <li><b>Email</b> — pela conta do Office 365 da escola de quem envia, como os outros envios da EPISJ 360.</li>
    <li><b>Notificação no telemóvel</b> — pelo <b>ntfy</b> (serviço gratuito e de código aberto, sem conta): o formador instala a app ntfy e subscreve o seu tópico. Chega como uma mensagem, mas não gasta SMS. A mensagem só diz que o horário mudou e onde o ver.</li>
    <li><b>SMS</b> — não há serviço de SMS gratuito em Portugal para muitos envios (os gratuitos dão 1 SMS por dia ou só créditos de teste). Por isso o botão abre a app Mensagens do telemóvel (ou do Mac) com os números e o texto já preenchidos: sai pelo tarifário do telemóvel da escola.</li></ul></div>`;
  // histórico
  const E=H3.env.slice(-30).reverse();
  if(E.length)h+=`<div class="card"><h3 style="margin:0 0 6px">Últimos avisos</h3><div class="tw"><table class="rt"><thead><tr><th>Quando</th><th>Formador</th><th>Por</th><th>Enviado por</th></tr></thead><tbody>`+
    E.map(e=>`<tr><td>${esc(new Date(e.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}</td><td>${esc(e.quem)}</td><td>${esc((e.canais||[]).map(c=>({email:"email",push:"notificação",sms:"SMS",marca:"marcado à mão"})[c]||c).join(", "))}</td><td>${esc(e.por)}</td></tr>`).join("")+`</tbody></table></div></div>`;
  el.innerHTML=h;
  const sel=()=>{const ids=new Set([...el.querySelectorAll("[data-h3sel]:checked")].map(i=>i.dataset.h3sel));return L.filter(x=>ids.has(x.t.id))};
  const m=t=>{const e=$("#h3Msg");if(e)e.textContent=t};
  const go=async can=>{const S=sel();if(!S.length){toast("Escolha pelo menos um formador");return}
    if(!confirm(`Enviar ${can.map(c=>c==="email"?"email":"notificação").join(" e ")} a ${S.length} formador${S.length===1?"":"es"}?`))return;
    const r=await h3Enviar(S,can,m);if(!r)return;toast(`${r.ok} formador${r.ok===1?"":"es"} avisado${r.ok===1?"":"s"}`);hsComRender().then(()=>{if(r.erros.length){const e=$("#h3Msg");if(e)e.innerHTML=`<span style="color:var(--bad)">${r.erros.slice(0,8).map(esc).join("<br>")}</span>`}})};
  const b1=$("#h3Em"),b2=$("#h3Pu"),b3=$("#h3EmPu"),b4=$("#h3Marc"),b5=$("#h3Sms"),all=$("#h3All");
  if(b1)b1.onclick=()=>go(["email"]);if(b2)b2.onclick=()=>go(["push"]);if(b3)b3.onclick=()=>go(["email","push"]);
  if(all)all.onchange=()=>{el.querySelectorAll("[data-h3sel]").forEach(i=>i.checked=all.checked);h3SmsAtual()};
  el.querySelectorAll("[data-h3sel]").forEach(i=>i.onchange=h3SmsAtual);
  function h3SmsAtual(){if(b5){const s=h3SmsLink(sel());if(s)b5.href=s;b5.hidden=!s}}
  if(b5)b5.onclick=()=>{setTimeout(()=>{const S=sel().filter(x=>h3Tel(H3.tel[(x.p||{}).id]));if(S.length&&confirm("A mensagem foi enviada pelo telemóvel? Os "+S.length+" formadores com telemóvel ficam como avisados."))
    {S.forEach(x=>h3Marcar(x,["sms"]));h3Guardar();hsComRender()}},1500)};
  if(b4)b4.onclick=()=>{const S=sel();if(!S.length)return;if(!confirm(`Dar ${S.length} formador${S.length===1?"":"es"} como avisado${S.length===1?"":"s"} sem enviar nada?`))return;S.forEach(x=>h3Marcar(x,["marca"]));h3Guardar();hsComRender()};
  el.querySelectorAll("[data-h3a]").forEach(i=>i.onchange=()=>{H3.auto[i.dataset.h3a]=i.checked;h3Guardar()});
  el.querySelectorAll("[data-h3m2]").forEach(i=>i.onchange=()=>{H3.msg[i.dataset.h3m2]=i.value;h3Guardar()});
  $("#h3MsgRep").onclick=()=>{if(!confirm("Repor as mensagens originais?"))return;H3.msg=Object.assign({},H3_MSG0);h3Guardar();hsComRender()};
  el.querySelectorAll("[data-h3tel]").forEach(i=>i.onchange=()=>{const v=i.value.trim();if(v&&!h3Tel(v)){toast("Número de telemóvel inválido");return}H3.tel[i.dataset.h3tel]=v?h3Tel(v):"";h3Guardar()})}
h3Carregar();
