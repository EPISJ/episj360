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
  curta:"EPISJ 360: o seu horário mudou ({n}). Veja em {ligacao}",
  // 0.9.170: WhatsApp (formadores, um a um) e turmas (grupo da turma ou formandos um a um)
  wa:"Olá {primeiro_nome},\n\nO seu horário mudou ({n}).\n\n{alteracoes}\n\nVeja o horário de cada semana em {ligacao} (Horários360 › Semana).\n\nDireção Pedagógica — EPISJ",
  waT:"Horário da turma {turma} — mudou a partir de {semana}.\n\n{alteracoes}\n\nVeja o horário em {ligacao} (Horários360 › Semana).\n\nDireção Pedagógica — EPISJ"};
function h3Norm(v){v=v&&typeof v==="object"?v:{};return{t:+v.t||0,salT:+v.salT||0,modo:v.modo==="completa"?"completa":"simples",sal:v.sal||"",tel:v.tel&&typeof v.tel==="object"?v.tel:{},telF:v.telF&&typeof v.telF==="object"?v.telF:{},wa:Array.isArray(v.wa)?v.wa:[],ultC:v.ultC&&typeof v.ultC==="object"?v.ultC:{},ult:v.ult&&typeof v.ult==="object"?v.ult:{},
  env:Array.isArray(v.env)?v.env:[],auto:Object.assign({on:false,email:true,push:true,min:10},v.auto||{}),msg:Object.assign({},H3_MSG0,v.msg||{}),visto:+v.visto||0}}
function h3Carregar(){if(!H3_PRONTO)H3_PRONTO=DB.get("kv","h3").then(v=>{H3=h3Norm(v);h3ModoAplicar()}).catch(()=>{H3=h3Norm(null);h3ModoAplicar()});return H3_PRONTO}
function h3Sal(){const a=new Uint8Array(9);crypto.getRandomValues(a);return [...a].map(x=>x.toString(36).padStart(2,"0")).join("")}
function h3Guardar(){if(RO||LIMPAR||!H3)return;H3.t=Date.now();DB.put("kv","h3",H3);
  nuvFila("h3",()=>{try{if(NUVOK()&&!nuvDesl()){if(H3_SINC)nuvemPut("H3",H3,H3.t);else h3TrazerNuvem()}}catch(e){}},2500);try{guidePubAgendar()}catch(e){}} // 0.9.149: fila de envios (sai ao fechar a página)
function h3Juntar(a,b){const n=h3Norm((b.t||0)>(a.t||0)?b:a),o=(b.t||0)>(a.t||0)?a:b;
  n.tel=Object.assign({},o.tel,n.tel);n.telF=Object.assign({},o.telF,n.telF); // 0.9.170: telemóveis dos formandos (WhatsApp)
  {const w=new Map();for(const x of(o.wa||[]).concat(n.wa||[]))w.set(x.t+"|"+x.por+"|"+x.id,x);n.wa=[...w.values()].sort((x,y)=>x.t-y.t).slice(-300)}
  for(const [k,v] of Object.entries(o.ultC||{})){const q=n.ultC[k];if(!q||(v.t||0)>(q.t||0))n.ultC[k]=v}for(const [k,v] of Object.entries(o.ult||{})){const q=n.ult[k];if(!q){n.ult[k]=v;continue}const r=Object.assign({},(v.t||0)>(q.t||0)?v:q);
    for(const [c,ct] of [["em","emT"],["tl","tlT"]]){const x=(v[ct]||0)>(q[ct]||0)?v:q;if(x[c]!==undefined){r[c]=x[c];r[ct]=x[ct]}}if(r.em&&r.em===r.tl){const z=[v,q].find(y=>y.c&&y.em===r.em&&y.tl===r.tl);if(z)r.c=z.c}n.ult[k]=r}
  const m=new Map();for(const x of(o.env||[]).concat(n.env||[]))m.set(x.t+"|"+x.por,x);n.env=[...m.values()].sort((x,y)=>x.t-y.t).slice(-200);if(o.sal&&(!n.sal||(o.salT||0)<(n.salT||Infinity))){n.sal=o.sal;n.salT=o.salT||0}return n}
// 0.9.149: os dados só vivem na nuvem — até à primeira leitura, nada se envia sem antes juntar com o que lá está (h3Juntar nunca apaga contactos nem avisos)
var H3_SINC=false;
async function h3TrazerNuvem(){try{await h3Carregar();if(RO||!NUVOK()||nuvDesl())return;const idx=(await(await nuvem("GET","")).json()).itens||{},tn=(idx.H3||{}).t||0;
    if(tn&&(tn>(H3.t||0)||!H3_SINC)){const j=h3Norm(await nuvemGet("H3")),n=h3Juntar(H3,j),mud=JSON.stringify(n)!==JSON.stringify(j);H3=n;H3_SINC=true;DB.put("kv","h3",H3);h3ModoAplicar();if(curTab==="hsCom")hsComRender();if(mud&&(H3.t||0)>=tn)await nuvemPut("H3",H3,Date.now())}
    else{H3_SINC=true;if((H3.t||0)>tn)await nuvemPut("H3",H3,H3.t)}}
  catch(e){if(e&&e.kind!=="nokv")console.warn("Horários360/nuvem",e)}}

/* ---------- Simples / Completa ---------- */
function h3Modo(){if(H3&&H3.t)return H3.modo;try{return localStorage.getItem("h360_modo")==="completa"?"completa":"simples"}catch(e){return "simples"}}
function h3EschOk(){return h3Modo()==="completa"||H3_IMP}
function h3ModoAplicar(){const m=h3Modo();try{localStorage.setItem("h360_modo",m)}catch(e){}
  const M=MODULOS.find(x=>x.id==="eduschedule");if(M)M.inicio=m==="completa"?"esch":"hsSem";
  const box=document.querySelector("[data-h3modo]");if(box){box.hidden=!(typeof podePublicar==="function"&&podePublicar()&&!RO);box.querySelectorAll("button").forEach(b=>{b.classList.toggle("sel",b.dataset.h3m===m);b.setAttribute("aria-pressed",b.dataset.h3m===m?"true":"false")})}
  const b=document.querySelector('#nav button[data-t="esch"]');if(b)b.hidden=!podeVer("esch");
  h3EsMenuAtual();
  if(curTab==="esch"&&!h3EschOk())show("hsSem")}
document.addEventListener("click",e=>{const b=e.target.closest("[data-h3m]");if(!b||RO)return;h3Carregar().then(()=>{H3.modo=b.dataset.h3m;H3_IMP=false;try{$("#esMsg").innerHTML=""}catch(x){}h3Guardar();h3ModoAplicar();
  toast(H3.modo==="completa"?"Versão completa: o editor de horários está em «Horários»":"Versão simples: mostra os horários vindos do Untis e comunica-os aos formadores");show(H3.modo==="completa"?"esch":"hsSem")})});

// no editor (versão completa) o menu da EPISJ 360 está escondido: o menu do editor ganha Simples / Completa e Semana / Comunicar
function h3EsMenu(d){if(!d||!d.body||d.getElementById("h3ir"))return;const cab=d.querySelector(".g-mh");const cx=cab&&cab.parentElement;if(!cx)return;
  const x=d.createElement("div");x.id="h3ir";x.style.cssText="display:flex;flex-direction:column;gap:6px;margin:2px 4px 8px";
  const bt=(t,on,f,tit)=>{const b=d.createElement("button");b.type="button";b.textContent=t;if(tit)b.title=tit;if(on)b.className="sel";b.style.cssText="flex:1;border:0;font:inherit;font-size:12px;font-weight:600;padding:5px 8px;cursor:pointer;background:"+(on?"var(--g-brand,#163269)":"transparent")+";color:"+(on?"#fff":"var(--g-muted,#6b7385)");b.onclick=f;return b};
  if(!d.getElementById("h3irCss")){const c=d.createElement("style");c.id="h3irCss";c.textContent="#h3ir a{font-size:12.5px;font-weight:600;color:var(--g-brand,#163269);text-decoration:none;padding:3px 7px;border-radius:6px}#h3ir a:hover{background:rgba(22,50,105,.08)}[data-gtema=cobalto] #h3ir a{color:rgba(255,255,255,.88)}[data-gtema=cobalto] #h3ir a:hover{background:rgba(255,255,255,.12)}[data-gtema=cobalto] #h3ir .h3m{background:rgba(255,255,255,.08)!important;border-color:rgba(255,255,255,.28)!important}[data-gtema=cobalto] #h3ir .h3m button{color:rgba(255,255,255,.82)!important}[data-gtema=cobalto] #h3ir .h3m button.sel{background:#fff!important;color:var(--g-side,#1f3f8f)!important}";d.head.appendChild(c)}
  const lig=(t,f)=>{const a=d.createElement("a");a.href="#";a.textContent=t;a.onclick=e=>{e.preventDefault();f()};return a};
  const modo=d.createElement("div");modo.className="h3m";modo.style.cssText="display:flex;border:1px solid var(--g-line,#e3e7ee);border-radius:999px;overflow:hidden;background:#fff";
  const m=h3Modo(),dir=podePublicar()&&!RO,mudar=v=>h3Carregar().then(()=>{H3.modo=v;H3_IMP=false;$("#esMsg").innerHTML="";h3Guardar();h3ModoAplicar();aplicarPerfil();show(v==="completa"?"esch":"hsSem")});
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
  const nD=(st.days||[0,0,0,0,0]).length,nP=(st.periods||[]).length||99;
  for(const cd of V.cards||[]){const l=les.get(cd.lessonId);if(!l)continue;if(!(cd.day>=0&&cd.day<nD&&cd.period>=0&&cd.period<nP))continue; // 0.9.151: aulas por colocar (sem dia/tempo) não entram
    const lin=(l.linhas||[]).map((x,i)=>Object.assign({i},x));
    for(let k=0;k<(cd.len||1);k++){const rr=(cd.rx&&cd.rx[k])||cd.r||[];
      const sel=tipo==="t"?lin.filter(x=>x.t===id):tipo==="c"?((l.classIds||[]).includes(id)?lin.filter(x=>!x.cls||x.cls.includes(id)):[]):lin.filter(x=>(rr[x.i]||x.r)===id);
      for(const x of sel){const s=S.get(x.s)||{},sala=R.get(rr[x.i])||R.get(x.r),cids=(x.cls&&x.cls.length?x.cls:(l.classIds||[])),tu=cids.map(c=>(C.get(c)||{}).name).filter(Boolean).join(", "),f=T.get(x.t)||{};
        const key=cd.day+"|"+(cd.period+k);(out.get(key)||out.set(key,[]).get(key)).push({s,cid:cids[0]||"",sid:x.s||"",disc:s.short||s.name||"—",nome:s.name||"",tu,form:f.short||f.name||"",formN:f.name||"",sala:sala?sala.name:""})}}}
  return out}

/* ---------- 0.9.226: cada tempo é um bloco à parte e os intervalos aparecem na grelha ----------
   Os tempos estão separados por intervalos: nunca se juntam tempos seguidos num só bloco. Entre dois tempos em que o fim de um
   é anterior ao início do seguinte (horas de st.periods), a grelha ganha uma linha «Intervalo · 09:20–09:30 · 10 min». */
const h3Min=s=>{const m=/^(\d{1,2})\s*[:h.]\s*(\d{2})/.exec(String(s||"").trim());return m?(+m[1])*60+(+m[2]):null};
function h3Intervalos(P){const M=new Map();(P||[]).forEach((p,pi)=>{const q=P[pi+1];if(!q)return;const a=h3Min(p.end),b=h3Min(q.start);if(a!=null&&b!=null&&b>a)M.set(pi,{apos:pi,de:String(p.end).trim(),ate:String(q.start).trim(),min:b-a})});return M}
// linhas da grelha: G.row[pi] = linha do tempo pi; G.ivs = intervalos com a sua linha; G.iv = intervalos por «tempo antes»
function h3Grade(P,r0){const iv=h3Intervalos(P),row=[],ivs=[];let r=r0||2;(P||[]).forEach((p,pi)=>{row[pi]=r++;const x=iv.get(pi);if(x)ivs.push(Object.assign({row:r++},x))});return{row,ivs,iv}}
const h3IvTxt=x=>`Intervalo · ${x.de}–${x.ate} · ${x.min} min`;
const h3IvHtml=x=>`<div class="hsiv" data-a="${h3Min(x.de)}" data-b="${h3Min(x.ate)}" style="grid-row:${x.row};grid-column:1/-1" title="${esc(h3IvTxt(x))}"><span>${esc(h3IvTxt(x))}</span></div>`;
// 0.9.227: linha da hora atual na coluna de hoje (como no calendário do Outlook). As células de hoje levam data-ag e as horas
// do tempo (data-a / data-b, em minutos); a linha é posta por cima da grelha e atualiza-se a cada 30 s.
const h3AgAttr=p=>{const a=h3Min(p&&p.start),b=h3Min(p&&p.end);return a!=null&&b!=null&&b>a?` data-ag="1" data-a="${a}" data-b="${b}"`:""};
function h3AgoraDesenhar(g){let l=g.querySelector(":scope>.hsag");const d=new Date(),now=d.getHours()*60+d.getMinutes()+d.getSeconds()/60;
  const hj=[...g.querySelectorAll(":scope>[data-ag]")].filter(c=>c.offsetParent);let y=null;
  if(hj.length)for(const c of hj.concat([...g.querySelectorAll(":scope>.hsiv[data-a]")])){const a=+c.dataset.a,b=+c.dataset.b;if(now>=a&&now<b){y=c.offsetTop+(now-a)/(b-a)*c.offsetHeight;break}}
  if(y==null){if(l)l.remove();return}
  const x0=Math.min(...[...g.querySelectorAll(":scope>.c")].filter(c=>c.offsetParent).map(c=>c.offsetLeft)),c0=hj[0],hh=String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
  if(!l){l=document.createElement("div");l.className="hsag";l.dataset.col="1";l.setAttribute("aria-hidden","true");l.innerHTML="<b></b><i></i>";g.append(l)}
  l.style.top=Math.round(y)+"px";l.style.left=x0+"px";l.style.width=(g.scrollWidth-x0)+"px";l.title="Agora: "+hh;
  const i=l.querySelector("i");i.style.left=(c0.offsetLeft-x0)+"px";i.style.width=c0.offsetWidth+"px";l.querySelector("b").textContent=hh}
function h3Agora(){document.querySelectorAll(".mzh[data-agora]").forEach(g=>{try{h3AgoraDesenhar(g)}catch(e){}})}
setInterval(h3Agora,30000);window.addEventListener("resize",()=>h3Agora());
const h3AgoraJa=()=>{requestAnimationFrame(h3Agora);setTimeout(h3Agora,400)};

/* ---------- 0.9.153: cores consistentes ----------
   Uma paleta só (a das cores dos módulos da EPISJ 360, sem verde — o verde é dos botões de importar), igual na Semana, em
   Por formadores e no email: no horário de um formador e de uma sala a cor é a da TURMA (sempre a mesma em todo o lado);
   no horário de uma turma a cor é a da DISCIPLINA. Fundo claro, barra de cor à esquerda e texto escuro (lê-se sempre bem). */
const H3_PAL=["#2f5fb8","#e8743b","#7c6cf0","#d99a18","#0a8fb0","#e0507e","#b24ccf","#a8714d","#3949ab","#d64545","#3b9be6","#5b6b8c","#c2410c","#8b5cf6","#0e7490","#be185d"];
var H3_CORC={k:"",m:null};
function h3CorMapa(st){turCores();const k=(st.classes||[]).length+":"+(st.subjects||[]).length+":"+(st.name||"")+":"+TUR_COR_K;if(H3_CORC.k===k&&H3_CORC.m)return H3_CORC.m;
  const m={c:new Map(),s:new Map()};// 0.9.172: a cor de cada turma é a da turma na Escola360 (turmaCor), a mesma em toda a app
  {let E={turmas:[]};try{E=escData()}catch(e){}const byId=new Map(E.turmas.map(t=>[t.id,t])),byCod=new Map();for(const t of E.turmas)if(!turAcabou(t,turAnoHoje())||!byCod.has(norm(t.cod)))byCod.set(norm(t.cod),t);
   (st.classes||[]).slice().sort((a,b)=>COLL_PTN.compare(String(a.name),String(b.name))).forEach((c,i)=>{const t=byId.get(c.id)||byId.get((ESD.mapaC||{})[c.id])||byCod.get(norm(c.name));m.c.set(c.id,t?turmaCor(t):H3_PAL[i%H3_PAL.length])})}
  (st.subjects||[]).slice().sort((a,b)=>COLL_PTN.compare(String(a.short||a.name),String(b.short||b.name))).forEach((x,i)=>m.s.set(x.id,H3_PAL[(i*5)%H3_PAL.length]));H3_CORC={k,m};return m}
function h3Cor(st,x,tipo){const m=h3CorMapa(st);return (tipo==="c"?m.s.get(x.sid):m.c.get(x.cid))||m.s.get(x.sid)||H3_PAL[0]}
function h3Tinta(hex,a){const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex||"");if(!m)return "#eef3fc";return "#"+[1,2,3].map(i=>Math.round(parseInt(m[i],16)*a+255*(1-a)).toString(16).padStart(2,"0")).join("")}
function h3Escuro(hex){const m=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex||"");if(!m)return "#163269";return "#"+[1,2,3].map(i=>Math.round(parseInt(m[i],16)*.62).toString(16).padStart(2,"0")).join("")}

/* ---------- Semana ---------- */
async function hsRender(){await null;try{await esdPronto}catch(e){}try{await h3Carregar()}catch(e){}
  const out=$("#hsOut"),hero=$("#hsHero");if(!out)return;const st=mhEstado(),a=anoAtivo(),pf=perfilAtual(),dir=podePublicar()&&!RO;
  $("#hsImpG").style.display=dir?"":"none";["hsImp","hsImpTudo","hsImpGpu"].forEach(i=>{const b=$("#"+i);b.hidden=false;b.style.display=""});$("#hsAvisos").innerHTML=pf==="prof"?h3AvisosFormador():"";
  if(!st){hero.innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Horários</h1><div class="sub">${esc(a.nome)}</div></div></div></div>`;
    out.innerHTML=`<div class="pp-vz">${ICO.cal}<p>${RO?"A Direção ainda não publicou o horário de "+esc(a.nome)+".":"Ainda não há horário para "+esc(a.nome)+". Importe os PDF do Untis (botão verde acima)."}</p></div>`;$("#hsQuem").innerHTML="";return}
  const T=(st.teachers||[]).slice().sort(cmpTch),C=(st.classes||[]).slice().sort((x,y)=>COLL_PTN.compare(String(x.name),String(y.name))),R=(st.rooms||[]).slice().sort((x,y)=>COLL_PTN.compare(String(x.name),String(y.name)));
  const tipoEl=$("#hsTipo"),quemEl=$("#hsQuem");tipoEl.parentNode.style.display=pf==="form"?"none":"";
  if(!H3S.tipo){H3S.tipo=pf==="form"?"c":"t";
    if(pf==="prof"){const me=(cfg.profs||[]).find(p=>String(p.email||"").toLowerCase()===String(EU&&EU.email||""));const t=me&&T.find(t=>t.id===me.id||(ESD.mapaT||{})[t.id]===me.id);if(t)H3S.quem=t.id}
    if(pf==="form"){const tc=(EU&&EU.turma)||lsJ("guide_mh_turma","");const c=C.find(c=>norm(c.name)===norm(tc));if(c)H3S.quem=c.id}}
  if(pf==="form")H3S.tipo="c";tipoEl.value=H3S.tipo;
  const L=H3S.tipo==="t"?T.map(t=>[t.id,tchRot(t)]):H3S.tipo==="r"?R.map(r=>[r.id,r.name]):C.map(c=>[c.id,clsRot(c)]);
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
  /* 0.9.189: igual a «O meu horário» — legenda das cores; 0.9.226: um bloco por tempo e os intervalos à vista */
  h+=`<div class="mzh mzh2 hsw" data-agora="1" style="--hsn:${P.length||1};--hsi:${h3Intervalos(P).size};grid-template-columns:76px repeat(${D.length},minmax(110px,1fr))"><div class="h" style="grid-row:1;grid-column:1"></div>`+dias.map((d,di)=>`<div class="h${d.dt===hj?" hj":""}" style="grid-row:1;grid-column:${di+2}">${esc(d.nome)}<small>${esc(calDM(d.dt))}</small>${d.nl?`<em class="${d.nl.t}">${esc(d.nl.n)}</em>`:d.fora?`<em>fora do ano letivo</em>`:""}</div>`).join("");
  const G=h3Grade(P);
  P.forEach((p,pi)=>{h+=`<div class="p" style="grid-row:${G.row[pi]};grid-column:1">${esc(p.label||pi+1)}<div class="hint" style="margin:0;font-weight:400">${esc(p.start||"")}${p.end?"–"+esc(p.end):""}</div></div>`});
  h+=G.ivs.map(h3IvHtml).join("");
  const hsInfo=x=>{const cor=h3Cor(st,x,H3S.tipo),tit=H3S.tipo==="c"?x.disc:(x.tu||x.disc),sub=H3S.tipo==="t"?[x.tu?x.disc:"",x.sala]:H3S.tipo==="c"?[x.form,x.sala]:[x.tu?x.disc:"",x.form];return{cor,tit,sub:sub.filter(Boolean).join(" · "),dica:[x.nome,x.formN,x.tu,x.sala].filter(Boolean).join(" · ")}};
  const usadasS=new Map();
  /* 0.9.226: cada tempo no seu bloco (já não se juntam tempos seguidos) */
  dias.forEach((d,di)=>{const cl=d.nl?" nl "+d.nl.t:d.fora?" nl":"";P.forEach((p,pi)=>{const c=cel.get(d.i+"|"+pi);
      h+=`<div class="c${cl}${d.dt===hj?" hj":""}"${d.dt===hj&&!d.nl&&!d.fora?h3AgAttr(p):""} style="grid-row:${G.row[pi]};grid-column:${di+2}">${c?c.map(x=>{const o=hsInfo(x);usadasS.set(o.tit,o.cor);
        return `<div class="a" style="background:${h3Tinta(o.cor,.16)};border-left:4px solid ${esc(o.cor)};color:#1b2333" title="${esc(o.dica+(p.start?" · "+p.start+(p.end?"–"+p.end:""):""))}"><b style="color:${h3Escuro(o.cor)}">${esc(o.tit)}</b><span>${esc(o.sub)}</span></div>`}).join(""):""}</div>`})});
  h+=`</div>`+(usadasS.size?`<div class="mzleg">${[...usadasS].sort((x,y)=>COLL_PTN.compare(x[0],y[0])).map(([t,c])=>`<span><i style="background:${esc(c)}"></i>${esc(t)}</span>`).join("")}</div>`:"")+`<div>`;
  const x=ESD.porAno&&ESD.porAno[a.id];
  out.innerHTML=h+`</div>`+(n?"":`<p class="hint">Sem aulas nesta semana.</p>`)+`<p class="hint">${esc(st.name||"")} · ${esc(a.nome)}${x&&x.quando?" · horário atualizado a "+new Date(x.quando).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):""}</p>`;h3AgoraJa()}
function h3AvisosFormador(){const em=String(EU&&EU.email||"").toLowerCase(),tp=h3Topico(em);
  return `<div class="card" style="margin-top:14px"><h3 style="margin:0 0 6px">Avisos de alterações</h3><p class="hint" style="margin:0 0 8px">Quando o seu horário muda, a Direção avisa-o por email em <b>${esc(em)}</b>.${tp?` Para receber também uma notificação no telemóvel (gratuito, sem criar conta): instale a app <b>ntfy</b> (App Store ou Google Play), carregue em <b>+</b> e escreva o tópico abaixo — ou abra a ligação no telemóvel.`:""}</p>
    ${tp?`<div class="row" style="align-items:center"><code class="h3top">${esc(tp)}</code><a class="b s" href="https://ntfy.sh/${encodeURIComponent(tp)}" target="_blank" rel="noopener">Abrir no ntfy</a><button class="b s" data-h3cp="${esc(tp)}">Copiar tópico</button></div>`:""}</div>`}
$("#hsTipo").onchange=e=>{H3S.tipo=e.target.value;H3S.quem="";hsRender()};
$("#hsQuem").onchange=e=>{H3S.quem=e.target.value;hsRender()};
$("#hsData").onchange=e=>{if(e.target.value){H3S.seg=h3Seg(e.target.value);hsRender()}};
$("#hsAnt").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),-7);hsRender()};
$("#hsSeg").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),7);hsRender()};
$("#hsHoje").onclick=()=>{H3S.seg="";hsRender()};
/* 0.9.228: Semana › modo ampliado (body.hsamplo) — o horário ocupa o ecrã todo, sem o menu lateral, com os tempos mais altos;
   Esc, o botão ou um clique no menu de cima/lateral para sair (como no Calendário do ano e no Crono360). */
function hsAmpSync(){const b=$("#hsAmp");if(b)b.textContent=document.body.classList.contains("hsamplo")?"Sair do modo ampliado":"Ampliar"}
function hsAmpSet(on){document.body.classList.toggle("hsamplo",!!on);hsAmpSync();h3AgoraJa()}
$("#hsAmp").onclick=()=>hsAmpSet(!document.body.classList.contains("hsamplo"));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("hsamplo"))hsAmpSet(false)});
document.addEventListener("click",e=>{if(document.body.classList.contains("hsamplo")&&e.target.closest(".top,nav.side"))hsAmpSet(false)},true);
$("#hsImp").onclick=()=>h3Importar();
$("#hsImpTudo").onclick=()=>h3Importar(true);
$("#hsImpGpu").onclick=()=>h3Importar("gpu");
document.addEventListener("click",e=>{const b=e.target.closest("[data-h3cp]");if(!b)return;try{navigator.clipboard.writeText(b.dataset.h3cp);toast("Copiado")}catch(x){}});

/* ---------- Por formadores (0.9.142): todos os formadores numa semana, lado a lado ----------
   0.9.158: tempos seguidos da mesma aula juntam-se num só bloco; por omissão só quem tem aulas na semana (botão «Todos»);
   linhas da mesma altura, dias em fundos alternados, hoje destacado e uma linha final com quantos formadores estão em aula em cada tempo. */
const H3F={q:"",todos:false};
async function hsForRender(){await null;try{await esdPronto}catch(e){}try{await h3Carregar()}catch(e){}
  const out=$("#hsForOut"),hero=$("#hsForHero");if(!out)return;const st=mhEstado(),a=anoAtivo(),hj=calHoje();
  if(!H3S.seg){let d=hj;const w=calD(d).getDay();if(w===6)d=calMais(d,2);else if(w===0)d=calMais(d,1);H3S.seg=h3Seg(d)}
  $("#hsForData").value=H3S.seg;
  if(!st){hero.innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Por formadores</h1><div class="sub">${esc(a.nome)}</div></div></div></div>`;out.innerHTML=`<div class="pp-vz">${ICO.cal}<p>${RO?"A Direção ainda não publicou o horário de "+esc(a.nome)+".":"Ainda não há horário para "+esc(a.nome)+"."}</p></div>`;return}
  const VL=cpVersoes(st).slice().sort((p,q)=>String(p.de||"").localeCompare(String(q.de||""))),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],NP=P.length,NL=calNaoLetivos(a);
  const dias=D.map((d,i)=>{const dt=calMais(H3S.seg,i);let V=cpVersaoEm(VL,dt);if(!V&&VL.length===1)V=VL[0];return{i,nome:d,dt,V,nl:NL.get(dt),fora:(a.inicio&&dt<a.inicio)||(a.fim&&dt>a.fim)}});
  const em=String(EU&&EU.email||"").toLowerCase(),me=(cfg.profs||[]).find(p=>h3Email(p)===em),eu=t=>!!me&&(t.id===me.id||(ESD.mapaT||{})[t.id]===me.id);
  const cache=new Map();const cel=(t,d)=>{if(!d.V||d.nl||d.fora)return null;const k=t.id+"|"+(VL.indexOf(d.V));if(!cache.has(k))cache.set(k,h3Celulas(st,d.V,"t",t.id));return cache.get(k)};
  const q=norm(H3F.q||"");
  const TT=(st.teachers||[]).filter(t=>!q||norm((t.name||"")+" "+(t.short||"")).includes(q)).map(t=>{let n=0;for(const d of dias){const m=cel(t,d);if(m)for(let pi=0;pi<NP;pi++){const L=m.get(d.i+"|"+pi);if(L)n+=L.length}}return{t,n}})
    .sort((x,y)=>(eu(y.t)-eu(x.t))||cmpTch(x.t,y.t));
  const comAulas=TT.filter(x=>x.n>0),semAulas=TT.filter(x=>!x.n&&!eu(x.t));
  const mostra=H3F.todos||!comAulas.length?TT:TT.filter(x=>x.n>0||eu(x.t));
  const ocup=dias.map(()=>new Array(NP).fill(0));let tot=0;const fim=calMais(H3S.seg,D.length-1);
  const IV=h3Intervalos(P),ivA=pi=>pi&&IV.has(pi-1)?" ivl":""; // 0.9.226: separação dos intervalos
  let h=`<div class="tw hsfw"><table class="hsf"><thead><tr><th class="nm" rowspan="2">Formador</th>${dias.map((d,di)=>`<th colspan="${NP}" class="dsep${di%2?" alt":""}${d.dt===hj?" hj":""}${d.nl||d.fora?" nl":""}">${esc(d.nome)} <small>${esc(calDM(d.dt))}</small>${d.dt===hj?` <i class="hjt">hoje</i>`:""}${d.nl?`<em>${esc(d.nl.n)}</em>`:d.fora?`<em>fora do ano letivo</em>`:""}</th>`).join("")}<th rowspan="2" class="tt">Tempos</th></tr><tr>${dias.map((d,di)=>P.map((p,pi)=>`<th class="${pi===0?"dsep":""}${ivA(pi)}${di%2?" alt":""}${d.dt===hj?" hj":""}" title="${esc((p.start||"")+(p.end?"–"+p.end:"")+(IV.get(pi-1)&&pi?"\n"+h3IvTxt(IV.get(pi-1))+" antes":""))}">${esc(p.label||pi+1)}</th>`).join("")).join("")}</tr></thead><tbody>`;
  for(const {t,n} of mostra){let r=`<td class="nm"><a href="#" data-hsver="${esc(t.id)}" title="Ver a semana de ${esc(t.name||"")}">${esc(tchRot(t))}</a></td>`;
    dias.forEach((d,di)=>{const m=cel(t,d),base=(d.nl||d.fora?" nl":"")+(di%2?" alt":"")+(d.dt===hj?" hj":"");
      for(let pi=0;pi<NP;){const L=m&&m.get(d.i+"|"+pi),cl=(pi===0?"dsep":"")+ivA(pi)+base;
        if(!L){r+=`<td class="${cl}"></td>`;pi++;continue}
        const x=L[0],len=1; // 0.9.226: um tempo por célula
        ocup[di][pi]++;
        const cor=h3Cor(st,x,"t"),pa=P[pi]||{},pz=P[pi+len-1]||{},hr=(pa.start||"")+(pz.end?"–"+pz.end:"");
        const tit=[`${x.nome||x.disc}${x.tu?" · "+x.tu:""}${x.sala?" · "+x.sala:""}`].concat(L.slice(1).map(y=>[y.nome||y.disc,y.tu,y.sala].filter(Boolean).join(" · "))).join("\n")+`\n${len} tempo${len>1?"s":""}${hr?" · "+hr:""}`;
        r+=`<td class="${cl} on"><div class="hsb" style="--sc:${esc(cor)};background:${h3Tinta(cor,.16)};color:${h3Escuro(cor)}" title="${esc(tit)}"><b>${esc(x.tu||x.disc)}${L.length>1?` <i>+${L.length-1}</i>`:""}</b><span>${esc([x.tu?x.disc:"",x.sala].filter(Boolean).join(" · "))}</span></div></td>`;pi+=len}});
    tot+=n;h+=`<tr class="${eu(t)?"eu":""}${n?"":" vz"}">${r}<td class="tt">${n||`<span class="z">0</span>`}</td></tr>`}
  h+=`</tbody><tfoot><tr><td class="nm">Formadores em aula</td>${dias.map((d,di)=>ocup[di].map((v,pi)=>`<td class="${pi===0?"dsep":""}${ivA(pi)}${di%2?" alt":""}${d.dt===hj?" hj":""}">${v||""}</td>`).join("")).join("")}<td class="tt">${tot}</td></tr></tfoot></table></div>`;
  const MOV=typeof mvLigado==="function"&&mvLigado();if(MOV)h=hsForMovel(st,dias,P,mostra,cel,hj,eu); // 0.9.216: no telemóvel, um dia de cada vez
  hero.innerHTML=`<div class="ay-hero"><div class="ay-top"><div><h1>Por formadores</h1><div class="sub">Semana de ${esc(calDM(H3S.seg,{day:"numeric",month:"short"}))} a ${esc(calDM(fim,{day:"numeric",month:"short"}))}${H3S.seg===h3Seg(hj)?" · esta semana":""}${me?" · o seu horário aparece primeiro":""}</div></div><span class="grow"></span><div class="ay-pct"><b>${comAulas.length}</b>com aulas, de ${TT.length} formador${TT.length===1?"":"es"} · ${tot} tempo${tot===1?"":"s"}</div></div></div>`;
  const seg=comAulas.length&&semAulas.length?`<div class="hsfbar"><div class="frseg" role="group" aria-label="Formadores a mostrar"><button type="button" data-hsft="0" class="${H3F.todos?"":"on"}">Com aulas (${comAulas.length})</button><button type="button" data-hsft="1" class="${H3F.todos?"on":""}">Todos (${TT.length})</button></div>${H3F.todos?"":`<span class="hint" style="margin:0">${semAulas.length} sem aulas nesta semana: ${esc(semAulas.slice(0,6).map(x=>x.t.name||x.t.short).join(", "))}${semAulas.length>6?"…":""}</span>`}</div>`:"";
  out.innerHTML=TT.length?seg+h+(MOV?`<p class="hint">Toque no nome de um formador para ver a semana dele. Deslize para o lado para mudar de dia.</p>`:`<p class="hint">Carregue no nome de um formador para ver a semana dele em pormenor. Passe o rato por cima de uma aula para ver a disciplina, a turma, a sala e as horas.</p>`):`<p class="hint">Nenhum formador com este nome.</p>`;
  if(MOV){const g=out.querySelector(".mv-hsf");if(g){const n=dias.length,hjI=dias.findIndex(d=>d.dt===hj);MV_DIA_R.hsfor=hsForRender;mvDiasLigar(g,"hsfor",n,()=>mvDiaSel("hsfor",n,hjI))}}}
/* 0.9.216: «Por formadores» no telemóvel — fila de dias e, para cada formador, os tempos desse dia numa só linha */
function hsForMovel(st,dias,P,mostra,cel,hj,eu){const NP=P.length,n=dias.length,hjI=dias.findIndex(d=>d.dt===hj),di=mvDiaSel("hsfor",n,hjI),d=dias[di];
  const bar=mvDiasHtml(dias.map(x=>({n:String(x.nome).slice(0,3),s:calDM(x.dt),hj:x.dt===hj,nl:!!(x.nl||x.fora)})),di,"hsfor");
  const IV=h3Intervalos(P),cols=`grid-template-columns:${P.map((p,pi)=>"minmax(0,1fr)"+(IV.has(pi)&&pi<NP-1?" 5px":"")).join(" ")}`,ivI=pi=>IV.has(pi)&&pi<NP-1?`<b class="iv" title="${esc(h3IvTxt(IV.get(pi)))}"></b>`:""; // 0.9.226: intervalos
  const cab=`<div class="mv-hsfh" style="${cols}">${P.map((p,pi)=>`<span>${esc(p.start||p.label||pi+1)}</span>`+(IV.has(pi)&&pi<NP-1?"<span></span>":"")).join("")}</div>`;
  const aviso=d.nl?`<div class="msg info" style="margin:0 0 10px">${esc(calDM(d.dt,{weekday:"long",day:"numeric",month:"long"}))}: ${esc(d.nl.n)}</div>`:d.fora?`<div class="msg info" style="margin:0 0 10px">Fora do ano letivo.</div>`:"";
  let emAula=0;const linhas=mostra.map(({t,n:nt})=>{const m=cel(t,d);let r="",tem=0;
    for(let pi=0;pi<NP;pi++){const L=m&&m.get(d.i+"|"+pi);if(!L){r+=`<i></i>`+ivI(pi);continue}
      const x=L[0],cor=h3Cor(st,x,"t"),pa=P[pi]||{};tem++; // 0.9.226: um tempo por bloco
      r+=`<div class="on" style="--sc:${esc(cor)};background:${h3Tinta(cor,.18)};color:${h3Escuro(cor)}" title="${esc([x.nome||x.disc,x.tu,x.sala,(pa.start||"")+(pa.end?"–"+pa.end:"")].filter(Boolean).join(" · "))}"><b>${esc(x.tu||x.disc)}</b></div>`+ivI(pi)}
    if(tem)emAula++;
    return `<div class="mv-hsfr${eu(t)?" eu":""}${tem?"":" vz"}"><div class="mv-hsfn"><a href="#" data-hsver="${esc(t.id)}">${esc(tchRot(t))}</a><small>${tem?tem+" tempo"+(tem>1?"s":"")+" neste dia":"sem aulas neste dia"} · ${nt} na semana</small></div><div class="mv-hsfs" style="${cols}">${r}</div></div>`}).join("");
  return bar+aviso+`<div class="mv-hsf"><div class="mv-hsft">${emAula} formador${emAula===1?"":"es"} em aula · ${esc(calDM(d.dt,{weekday:"long",day:"numeric",month:"long"}))}</div>${cab}${linhas}</div>`}
$("#hsForOut").addEventListener("click",e=>{const b=e.target.closest("[data-hsft]");if(!b)return;H3F.todos=b.dataset.hsft==="1";hsForRender()});
$("#hsForQ").oninput=debounce(()=>{H3F.q=$("#hsForQ").value;hsForRender()},200);
$("#hsForData").onchange=e=>{if(e.target.value){H3S.seg=h3Seg(e.target.value);hsForRender()}};
$("#hsForAnt").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),-7);hsForRender()};
$("#hsForSeg").onclick=()=>{H3S.seg=calMais(H3S.seg||h3Seg(calHoje()),7);hsForRender()};
$("#hsForHoje").onclick=()=>{H3S.seg="";hsForRender()};
$("#hsForOut").addEventListener("click",e=>{const l=e.target.closest("[data-hsver]");if(!l)return;e.preventDefault();H3S.tipo="t";H3S.quem=l.dataset.hsver;show("hsSem")});

/* ---------- Importar do Untis a partir da versão simples ----------
   Os PDF escolhem-se aqui e são entregues ao importador do editor (o mesmo da versão completa), onde se confirma a importação. */
// 0.9.148: também os ficheiros GPU do Untis (GPU001.TXT…GPU006.TXT) — o mesmo intercâmbio que o DBG pleon lê; vão para o importador GPU do editor (junta ao horário atual)
const h3EhGPU=f=>/(^|\/)GPU0*\d+\D*\.txt$/i.test(f.webkitRelativePath||f.name)||/^GPU0*\d+\.txt$/i.test(f.name);
function h3Importar(modo){const pasta=modo===true||modo==="pasta",gpu=modo==="gpu";
  const inp=document.createElement("input");inp.type="file";inp.multiple=true;if(pasta)inp.webkitdirectory=true;else inp.accept=gpu?".txt,.TXT,text/plain":".pdf,.zip,.txt,application/pdf,application/zip,text/plain";inp.style.display="none";document.body.append(inp);
  inp.onchange=async()=>{let fs=[...inp.files].filter(f=>!/(^|\/)(__MACOSX|\.)/.test(f.webkitRelativePath||f.name));inp.remove();if(!fs.length){if(pasta)toast("Pasta vazia.");return}
    // na pasta (ou numa escolha mista): se houver ficheiros GPU, entram esses (dados exatos do Untis); senão os PDF e .zip
    const G=fs.filter(h3EhGPU),PD=fs.filter(f=>/\.(pdf|zip)$/i.test(f.name));
    let tipo=gpu||G.length?"gpu":"pdf",L=tipo==="gpu"?(G.length?G:fs.filter(f=>/\.txt$/i.test(f.name))):PD;
    if(!L.length){toast(gpu?"Escolha os ficheiros GPU do Untis (GPU001.TXT e, se houver, GPU002…GPU006).":pasta?"Essa pasta não tem PDF nem ficheiros GPU do Untis.":"Escolha PDF, .zip ou ficheiros GPU do Untis.");return}
    if(tipo==="gpu"&&!L.some(f=>/GPU0*1\D*\.txt$/i.test(f.name))){toast("Falta o GPU001.TXT (horários) — é o ficheiro principal da exportação do Untis.");return}
    if(pasta||(G.length&&PD.length))toast(tipo==="gpu"?`A importar ${L.length} ficheiro${L.length===1?"":"s"} GPU do Untis${PD.length?" (os PDF ficam de fora: os GPU têm os dados exatos)":""}…`:`A importar ${L.length} PDF…`);
    H3_IMP=true;aplicarPerfil();show("esch");
    const fr=$("#esFr");let w=null;for(let i=0;i<100;i++){try{w=fr.contentWindow;if(w&&typeof w.updfEscolher==="function"&&fr.classList.contains("pronto"))break}catch(e){}w=null;await new Promise(r=>setTimeout(r,200))}
    if(!w){toast("O editor de horários não abriu — tente outra vez");return}
    const entregar=inpEl=>{const dt=new w.DataTransfer();L.forEach(f=>dt.items.add(f));inpEl.files=dt.files;inpEl.dispatchEvent(new w.Event("change",{bubbles:true}))};
    if(tipo==="gpu"){ // a página «Ficheiro» do editor tem o importador GPU (#im-dif): abre-a e entrega-lhe os ficheiros
      try{w.location.hash="ficheiro"}catch(e){}let el=null;for(let i=0;i<50&&!el;i++){await new Promise(r=>setTimeout(r,100));try{el=fr.contentDocument.getElementById("im-dif")}catch(e){}}
      if(!el){toast("Não encontrei o importador GPU do editor — abra Horários › Ficheiro › Importar ficheiros GPU");return}
      try{entregar(el)}catch(e){toast("Não foi possível entregar os ficheiros ao importador: "+e.message);return}}
    else{const Pr=w.HTMLInputElement.prototype,orig=Pr.click;
      Pr.click=function(){if(this.type==="file"){Pr.click=orig;try{entregar(this)}catch(e){toast("Não foi possível entregar os ficheiros ao importador: "+e.message)}return}return orig.call(this)};
      try{w.updfEscolher()}catch(e){Pr.click=orig;toast("Não foi possível importar: "+e.message);return}
      setTimeout(()=>{if(Pr.click!==orig)Pr.click=orig},4000)}
    $("#esMsg").innerHTML=`<div class="msg info h3volta"><span>Confirme a importação na janela do Horários360 (por omissão junta ao horário atual, sem apagar nada). Quando terminar, volte à vista simples — os formadores com o horário mudado aparecem em «Comunicar».</span><button class="b s" data-h3volta>Voltar à semana</button></div>`};
  inp.click()}
document.addEventListener("click",e=>{if(!e.target.closest("[data-h3volta]"))return;H3_IMP=false;$("#esMsg").innerHTML="";aplicarPerfil();show(h3Modo()==="completa"?"hsCom":"hsSem")});

/* ---------- Comunicar: o que mudou desde o último aviso ---------- */
// as aulas de um formador no horário em vigor e nos seguintes, em frases que se podem comparar e mostrar
const h3Frase=(pre,dia,p,pi,x)=>`${pre}${dia} ${p.start||p.label||pi+1}${p.end?"–"+p.end:""} · ${x.disc}${x.tu?" · "+x.tu:""}${x.sala?" · "+x.sala:""}`;
function h3Linhas(st,tid){const VL=cpVersoes(st),hj=calHoje(),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],o=new Set();
  for(const V of VL){if(V.ate&&V.ate<hj)continue;const m=h3Celulas(st,V,"t",tid),pre=V.de&&V.de>hj?"A partir de "+calDM(V.de)+" · ":"";
    for(const [k,L] of m){const [di,pi]=k.split("|").map(Number),p=P[pi]||{};if(!D[di])continue;for(const x of L)o.add(h3Frase(pre,D[di],p,pi,x))}}
  const DS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],ord=s=>{const m=/(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)\S* (\d\d:\d\d)?/.exec(s);return (s.startsWith("A partir")?"1":"0")+(m?DS.indexOf(m[1].slice(0,3))+(m[2]||""):"")+s};
  return [...o].sort((a,b)=>ord(a).localeCompare(ord(b)))}
// 0.9.149: cada formador só sai da lista depois de avisado pelas duas vias — email e telemóvel (notificação ou SMS).
// H3.ult[tid] = {c: horário do último aviso completo (base das diferenças), em/emT: horário avisado por email, tl/tlT: por telemóvel}
function h3Pendentes(){const st=mhEstado();if(!st||!H3)return[];const r=[];
  for(const t of st.teachers||[]){const cur=h3Linhas(st,t.id),h=esHash(cur.join("\n")),ant=H3.ult[t.id],p=h3ProfDe(st,t.id);
    if(!ant&&!cur.length)continue;
    // 0.9.153: as linhas «?» (aulas por colocar, antes da 0.9.151) deixam de contar
    const base=ant&&ant.c&&ant.c.filter(l=>!/^\? /.test(l)),hb=ant&&ant.c?esHash(ant.c.join("\n")):"",A=new Set(base||[]),B=new Set(cur),mais=base?cur.filter(x=>!A.has(x)):cur,menos=base?base.filter(x=>!B.has(x)):[],igual=!!base&&!mais.length&&!menos.length;
    const antigo=!!ant&&ant.em===undefined&&ant.tl===undefined; // avisos de antes da 0.9.149: contam para as duas vias se nada mudou
    const emOk=!!ant&&(ant.em===h||(igual&&(antigo||ant.em===hb))),tlOk=!!ant&&(ant.tl===h||(igual&&(antigo||ant.tl===hb)));
    if(emOk&&tlOk)continue;
    r.push({t,p,cur,h,novo:!base,mais,menos,emOk,tlOk})}
  return r.sort((a,b)=>COLL_PT.compare(String(a.t.name),String(b.t.name)))}
/* ---------- 0.9.170: turmas (formandos) — avisos pelo WhatsApp ----------
   Como para os formadores: o horário de cada turma (em vigor e seguintes) em frases; H3.ultC[classId]={c,h,t} = o último
   horário avisado. Avisa-se pelo grupo de avisos da turma (texto pronto) ou os formandos um a um (wa.me, ver core/whatsapp.js). */
function h3TurmaDe(c){const E=escData();return E.turmas.find(t=>t.id===c.id)||E.turmas.find(t=>t.id===(ESD.mapaC||{})[c.id])||E.turmas.find(t=>norm(t.cod||"")===norm(c.name||""))||null}
function h3LinhasC(st,cid){const VL=cpVersoes(st),hj=calHoje(),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],o=new Set();
  for(const V of VL){if(V.ate&&V.ate<hj)continue;const m=h3Celulas(st,V,"c",cid),pre=V.de&&V.de>hj?"A partir de "+calDM(V.de)+" · ":"";
    for(const [k,L] of m){const [di,pi]=k.split("|").map(Number),p=P[pi]||{};if(!D[di])continue;
      for(const x of L)o.add(`${pre}${D[di]} ${p.start||p.label||pi+1}${p.end?"–"+p.end:""} · ${x.disc}${x.form?" · "+x.form:""}${x.sala?" · "+x.sala:""}`)}}
  const DS=["Seg","Ter","Qua","Qui","Sex","Sáb","Dom"],ord=s=>{const m=/(Seg|Ter|Qua|Qui|Sex|Sáb|Dom)\S* (\d\d:\d\d)?/.exec(s);return (s.startsWith("A partir")?"1":"0")+(m?DS.indexOf(m[1].slice(0,3))+(m[2]||""):"")+s};
  return [...o].sort((a,b)=>ord(a).localeCompare(ord(b)))}
function h3PendentesC(){const st=mhEstado();if(!st||!H3)return[];const r=[];
  for(const c of st.classes||[]){const cur=h3LinhasC(st,c.id),h=esHash(cur.join("\n")),ant=H3.ultC[c.id];if(!ant&&!cur.length)continue;if(ant&&ant.h===h)continue;
    const base=ant&&ant.c,A=new Set(base||[]),B=new Set(cur);r.push({c,t:h3TurmaDe(c),cur,h,novo:!base,mais:base?cur.filter(x=>!A.has(x)):cur,menos:base?base.filter(x=>!B.has(x)):[]})}
  return r.sort((a,b)=>COLL_PTN.compare(String((a.t&&a.t.cod)||a.c.name),String((b.t&&b.t.cod)||b.c.name)))}
function h3MarcarC(x){H3.ultC[x.c.id]={c:x.cur,h:x.h,t:Date.now()};H3.env.push({t:Date.now(),por:(EU&&EU.email)||"",quem:"Turma "+((x.t&&x.t.cod)||x.c.name||""),canais:["wa"],n:x.novo?-1:x.mais.length+x.menos.length});if(H3.env.length>200)H3.env=H3.env.slice(-200)}
function h3TxtC(x){if(x.novo)return x.cur.map(s=>"• "+s).join("\n");return (x.mais.length?"Aulas novas ou mudadas:\n"+x.mais.map(s=>"+ "+s).join("\n"):"")+(x.mais.length&&x.menos.length?"\n\n":"")+(x.menos.length?"Deixam de existir:\n"+x.menos.map(s=>"− "+s).join("\n"):"")}
function h3PreencherC(tpl,x,nome){const sem=calDM(h3Seg(calHoje()),{day:"numeric",month:"long"});
  return String(tpl||"").replace(/\{turma\}/g,(x.t&&x.t.cod)||x.c.name||"").replace(/\{alteracoes\}/g,h3TxtC(x)).replace(/\{ligacao\}/g,h3Lig()).replace(/\{semana\}/g,sem).replace(/\{primeiro_nome\}/g,waPrimeiro(nome)).replace(/\{nome\}/g,nome||"")}
function h3FormandosC(x){return x.t?escData().formandos.filter(f=>f.turmaId===x.t.id&&!f.estado):[]}
function h3Txt(x){if(x.novo)return "O seu horário:\n"+x.cur.map(s=>"  "+s).join("\n");
  return (x.mais.length?"Aulas novas ou mudadas:\n"+x.mais.map(s=>"  + "+s).join("\n"):"")+(x.mais.length&&x.menos.length?"\n\n":"")+(x.menos.length?"Deixam de existir:\n"+x.menos.map(s=>"  − "+s).join("\n"):"")}
/* 0.9.171: {nome} = só o primeiro nome do formador («Olá Joel,») */
function h3PNome(x){const n=String((x.p&&x.p.nome)||x.t.name||"").trim();return n.split(/\s+/)[0]||n}
function h3Preencher(tpl,x){const n=x.novo?"horário novo":(x.mais.length+x.menos.length)+" alteraç"+(x.mais.length+x.menos.length===1?"ão":"ões");
  const sem=calDM(h3Seg(calHoje()),{day:"numeric",month:"long"});
  return String(tpl||"").replace(/\{nome\}/g,h3PNome(x)).replace(/\{alteracoes\}/g,h3Txt(x)).replace(/\{ligacao\}/g,h3Lig()).replace(/\{semana\}/g,sem).replace(/\{n\}/g,n)}
function h3Marcar(x,canais){const u=Object.assign({},H3.ult[x.t.id]||{}),agora=Date.now(),todos=canais.includes("marca");
  if(todos||canais.includes("email")){u.em=x.h;u.emT=agora}
  if(todos||canais.includes("push")||canais.includes("sms")||canais.includes("wa")){u.tl=x.h;u.tlT=agora}
  if(u.em===x.h&&u.tl===x.h)u.c=x.cur;u.t=agora;H3.ult[x.t.id]=u;
  H3.env.push({t:agora,por:(EU&&EU.email)||"",quem:x.t.name||"",canais,n:x.novo?-1:x.mais.length+x.menos.length});if(H3.env.length>200)H3.env=H3.env.slice(-200)}
async function h3Push(x){const tp=h3Topico(h3Email(x.p));if(!tp)throw new Error("sem tópico");
  const r=await fetch("https://ntfy.sh/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({topic:tp,title:"EPISJ 360 — Horário",message:h3Preencher(H3.msg.curta,x),click:h3Lig(),tags:["calendar"]})});
  if(!r.ok)throw new Error("ntfy "+r.status)}
async function h3Email1(x){const to=h3Email(x.p);if(!to)throw new Error("sem email");await msEnviar({to,subject:h3Preencher(H3.msg.assunto,x),body:h3Preencher(H3.msg.corpo,x),html:h3EmailHtml(x)})}
// 0.9.151: email em HTML com o horário desenhado (grelha dias × tempos, cores das disciplinas, aulas novas ou mudadas assinaladas).
// Estilos todos embutidos e tabelas simples, para o Outlook e o Gmail mostrarem igual; o texto simples continua como alternativa.
function h3EmailHtml(x){const st=mhEstado();if(!st)return "";const hj=calHoje(),D=st.days||["Seg","Ter","Qua","Qui","Sex"],P=st.periods||[],novo=new Set(x.novo?[]:x.mais),F="font-family:Segoe UI,Helvetica,Arial,sans-serif";
  const VL=cpVersoes(st).slice().sort((p,q)=>String(p.de||"").localeCompare(String(q.de||""))).filter(V=>!(V.ate&&V.ate<hj));
  const usadas=new Map();
  const grelha=V=>{const m=h3Celulas(st,V,"t",x.t.id),pre=V.de&&V.de>hj?"A partir de "+calDM(V.de)+" · ":"";let n=0;
    // 0.9.226: um bloco por tempo e uma linha para cada intervalo
    const IV=h3Intervalos(P);
    let h=`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-spacing:4px;width:100%;max-width:760px;table-layout:fixed;${F};font-size:12px"><tr><td style="width:62px"></td>${D.map(d=>`<td style="width:${Math.floor(100/D.length)}%;padding:6px 4px 4px;text-align:center;font-weight:700;font-size:12.5px;color:#163269;border-bottom:2px solid #e3e7ee">${esc(d)}</td>`).join("")}</tr>`;
    P.forEach((p,pi)=>{h+=`<tr><td style="padding:6px 8px 4px 0;text-align:right;color:#8a92a3;white-space:nowrap;vertical-align:top;font-size:11px;line-height:1.35"><b style="color:#1b2333;font-size:12px">${esc(p.start||p.label||pi+1)}</b><br>${esc(p.end||"")}</td>`;
      D.forEach((d,di)=>{const L=m.get(di+"|"+pi);if(!L){h+=`<td style="background:#f6f8fb;border-radius:8px;height:46px"></td>`;return}
        h+=`<td style="vertical-align:top;padding:0;height:46px">`+L.map(c=>{n++;const cor=h3Cor(st,c,"t"),nv=novo.has(h3Frase(pre,d,p,pi,c));usadas.set(c.tu||c.disc,cor);
          return `<div style="background:${h3Tinta(cor,.16)};border-left:4px solid ${esc(cor)};${nv?"outline:2px solid #1b2333;":""}border-radius:8px;padding:6px 8px;margin:0 0 3px;line-height:1.3;min-height:32px;color:#1b2333"><b style="font-size:13px;color:${h3Escuro(cor)}">${esc(c.tu||c.disc)}</b>${nv?` <span style="font-size:9.5px;font-weight:700;letter-spacing:.04em;background:#1b2333;color:#fff;border-radius:4px;padding:1px 5px;vertical-align:1px">NOVO</span>`:""}<br><span style="font-size:11px;color:#4a5262">${esc([c.tu?c.disc:"",c.sala].filter(Boolean).join(" · "))}</span></div>`}).join("")+`</td>`});h+=`</tr>`;
      const x=IV.get(pi);if(x&&pi<P.length-1)h+=`<tr><td colspan="${D.length+1}" style="padding:1px 0;text-align:center;font-size:10.5px;color:#8a92a3;border-top:1px dashed #d5dbe5;border-bottom:1px dashed #d5dbe5;background:#fafbfd">${esc(h3IvTxt(x))}</td></tr>`});
    return {h:h+`</table>`,n}};
  let quadro="";for(const V of VL){const g=grelha(V);if(!g.n&&VL.length>1)continue;
    quadro+=`<p style="${F};font-size:14px;font-weight:700;color:#163269;margin:18px 0 6px">${VL.length>1?(V.de&&V.de>hj?"A partir de "+esc(calDMA(V.de)):"Horário em vigor"+(V.de?" desde "+esc(calDMA(V.de)):"")):"O seu horário"} <span style="font-weight:400;color:#6b7385">· ${g.n} tempo${g.n===1?"":"s"} por semana</span></p>`+g.h}
  {const leg=[...usadas].sort((a,b)=>COLL_PTN.compare(a[0],b[0])).map(([t,c])=>`<span style="display:inline-block;margin:0 10px 4px 0;white-space:nowrap"><span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${esc(c)};vertical-align:-1px"></span>&nbsp;${esc(t)}</span>`).join("");
    quadro+=`<p style="${F};font-size:12px;color:#4a5262;margin:8px 0 0">${leg}${!x.novo&&x.mais.length?`<span style="display:inline-block;white-space:nowrap"><span style="font-size:9.5px;font-weight:700;background:#1b2333;color:#fff;border-radius:4px;padding:1px 5px">NOVO</span>&nbsp;aula nova ou mudada</span>`:""}</p>`}
  if(!x.novo&&x.menos.length)quadro+=`<p style="${F};font-size:13px;font-weight:700;color:#1b2333;margin:14px 0 4px">Deixam de existir</p><ul style="${F};font-size:12.5px;color:#6b7385;margin:0;padding-left:18px">${x.menos.map(l=>`<li style="text-decoration:line-through">${esc(l)}</li>`).join("")}</ul>`;
  /* 0.9.163: sem ligações no email — o filtro de correio do Office 365 retinha (sem avisar) os emails com ligações para o endereço da
     EPISJ 360, um domínio ainda recente; testado a 22/11/2026: o mesmo email sem ligações chega. O endereço fica escrito, em negrito. */
  const lig=h3Lig(),txt0=t=>esc(t).replace(/\n/g,"<br>").replace(/\{ligacao\}/g,`<b style="color:#163269">${esc(lig.replace(/^https?:\/\//,"").replace(/\/$/,""))}</b>`);
  /* 0.9.170: a despedida («Com os melhores cumprimentos, …» e a assinatura) fica alinhada à direita */
  const txt=t=>{const m=String(t).match(/(^|\n)[ \t]*((com os )?(melhores |cordiais )?cumprimentos|atenciosamente|saudações)/i);if(!m)return txt0(t);const k=m.index+m[1].length;
    return txt0(t.slice(0,k).replace(/\s+$/,""))+`<div style="text-align:right;margin-top:${k?14:0}px">${txt0(t.slice(k).replace(/^\s+/,""))}</div>`};
  const corpo=String(H3.msg.corpo||"").replace(/\{nome\}/g,h3PNome(x)).replace(/\{semana\}/g,calDM(h3Seg(hj),{day:"numeric",month:"long"})).replace(/\{n\}/g,x.novo?"horário novo":String(x.mais.length+x.menos.length));
  const partes=corpo.split("{alteracoes}").map((t,i,a)=>a.length>1?(i===0?t.replace(/\s+$/,""):i===a.length-1?t.replace(/^\s+/,""):t.trim()):t),meio=`</div>${quadro}<div style="${F};font-size:14px;color:#1b2333;line-height:1.55;margin-top:16px">`;
  const btn="";
  return `<!DOCTYPE html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:780px;padding:8px 4px">
${h3EmailTopo(F)}
<div style="${F};font-size:14px;color:#1b2333;line-height:1.55">${partes.map(txt).join(meio)}</div>${partes.length<2?quadro:""}${btn}
${h3EmailFundos()}<p style="${F};font-size:11px;color:#9aa1ad;margin:10px 0 0">Escola Profissional da Ilha de São Jorge · mensagem enviada pela EPISJ 360</p></div></body></html>`}
/* 0.9.169: logótipos do ano letivo no email — em cima o logótipo principal (e o do canto direito, se houver), em baixo a barra de
   financiamento do ano (a mesma da barra de baixo da app). As imagens seguem como anexos embutidos (cid:, ver msEmbutir em o365.js). */
function h3LgImg(o,maxW,maxH,alt){if(!o||!o.src||!/^data:image\//.test(o.src))return "";const w0=+o.w||maxW,h0=+o.h||maxH,k=Math.min(1,maxW/w0,maxH/h0),w=Math.max(1,Math.round(w0*k)),h=Math.max(1,Math.round(h0*k));
  return `<img src="${esc(o.src)}" width="${w}" height="${h}" alt="${esc(alt)}" style="display:block;border:0;width:${w}px;height:${h}px;max-width:100%">`}
function h3EmailTopo(F){let m,r;try{m=lgGet("main");r=lgGet("right")}catch(e){}
  const a=h3LgImg(m,220,52,"Escola Profissional da Ilha de São Jorge"),b=h3LgImg(r,200,52,"");
  // 0.9.170: cabeçalho com o nome da escola, o ano letivo e a data do horário (última importação/publicação do ano)
  let ano="",dt="";try{const A=anoAtivo();if(A){ano=anoNomeChave(A.nome)||A.nome||"";const q=ESD.porAno&&ESD.porAno[A.id]&&ESD.porAno[A.id].quando;if(q)dt=new Date(q).toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"})}}catch(e){}
  const sub=[ano?"Ano letivo "+ano:"",dt?"Horário de "+dt:""].filter(Boolean).join(" · ");
  const tit=`<div style="${F};margin:0 0 18px;text-align:center"><div style="font-size:16px;font-weight:700;color:#163269;line-height:1.3">Escola Profissional da Ilha de São Jorge</div>${sub?`<div style="font-size:13px;color:#4a5262;margin-top:2px">${esc(sub)}</div>`:""}</div>`;
  if(!a&&!b)return tit;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:760px;margin:0 0 14px;border-bottom:1px solid #e3e7ee"><tr><td style="padding:0 0 12px;vertical-align:middle">${a}</td><td style="padding:0 0 12px;vertical-align:middle" align="right">${b}</td></tr></table>`+tit}
function h3EmailFundos(){let f;try{f=lgFootBarra()}catch(e){try{f=lgGet("foot")}catch(x){}}const im=h3LgImg(f,560,64,"Logótipos de financiamento do ano letivo");
  return im?`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:760px;margin:22px 0 0;border-top:1px solid #e3e7ee"><tr><td align="center" style="padding:14px 0 0">${im}</td></tr></table>`:""}
function h3SmsLink(L){L=L.filter(x=>!x.tlOk);const nums=L.map(x=>h3Tel(H3.tel[(x.p||{}).id])).filter(Boolean);if(!nums.length)return "";
  const body=encodeURIComponent(L.length===1?h3Preencher(H3.msg.curta,L[0]):"EPISJ 360: o seu horário mudou. Veja em "+h3Lig()),ios=/iPhone|iPad|Macintosh/.test(navigator.userAgent);
  return ios?`sms:/open?addresses=${nums.join(",")}&body=${body}`:`sms:${nums.join(",")}?body=${body}`}
async function h3Enviar(L,canais,msg,forcar){ // 0.9.164: forcar = envio pedido à mão (manda a todos os escolhidos, também a quem já tinha recebido por essa via)
if(H3_ENVIO||!L.length)return;H3_ENVIO=true;let ok=0,erros=[],nomes=[];
  // 0.9.155: a sessão do Office 365 é pedida logo no início (ainda no clique, para a janela da Microsoft não ser bloqueada);
  // se não houver sessão, diz uma vez porquê em vez de falhar formador a formador
  if(canais.includes("email")&&L.some(x=>forcar||!x.emOk)){try{await msToken()}catch(e){H3_ENVIO=false;const m=typeof msErro==="function"?msErro(e):(e.message||String(e));
    return{ok:0,erros:["Os emails não saíram: "+m+" Carregue em «Ligar a conta da Microsoft» (por cima dos botões) e depois envie outra vez."]}}}
  try{for(let i=0;i<L.length;i++){const x=L[i],feito=[];if(msg)msg(`A enviar ${i+1} de ${L.length}…`);
      const fazEm=canais.includes("email")&&(forcar||!x.emOk),fazTl=canais.includes("push")&&(forcar||!x.tlOk);
      if(fazEm)try{await h3Email1(x);feito.push("email")}catch(e){erros.push((x.t.name||"")+": email — "+(e.message||e))}
      if(fazTl)try{await h3Push(x);feito.push("push")}catch(e){erros.push((x.t.name||"")+": notificação — "+(e.message||e))}
      if(feito.length){h3Marcar(x,feito);ok++;nomes.push(((x.p&&x.p.nome)||x.t.name||"")+" ("+feito.map(c=>c==="email"?"email para "+h3Email(x.p):"notificação").join(" e ")+")")}
      if(fazEm&&i<L.length-1)await new Promise(r=>setTimeout(r,2100))}}
  finally{H3_ENVIO=false;h3Guardar()}
  return{ok,erros,nomes}}
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
    <p class="hint" style="margin:0 0 10px">${L.length?"Formadores com o horário diferente do último aviso. Cada um só sai da lista depois de avisado pelas duas vias: email e telemóvel (notificação, SMS ou WhatsApp). Quem já foi avisado por uma via só recebe a outra.":"Todos os formadores já foram avisados do horário atual, por email e por telemóvel."}</p>`;
  if(L.length){h+=`<div class="tw"><table class="rt"><thead><tr><th><input type="checkbox" id="h3All" checked aria-label="Todos"></th><th>Formador</th><th>Email</th><th>Telemóvel</th><th>Avisado por</th><th>O que mudou</th></tr></thead><tbody>`+
    L.map(x=>`<tr><td><input type="checkbox" data-h3sel="${esc(x.t.id)}" checked></td><td>${esc((x.p&&x.p.nome)||x.t.name)}</td><td>${esc(h3Email(x.p)||"—")}</td><td>${esc(h3Tel(H3.tel[(x.p||{}).id])||"—")}</td>
      <td><span class="h3via ${x.emOk?"ok":""}">${x.emOk?"✓ ":""}Email</span> <span class="h3via ${x.tlOk?"ok":""}">${x.tlOk?"✓ ":""}Telemóvel</span></td>
      <td><details><summary>${x.novo?"horário novo ("+x.cur.length+" tempo"+(x.cur.length===1?"":"s")+")":`${x.mais.length?"+"+x.mais.length:""}${x.mais.length&&x.menos.length?" / ":""}${x.menos.length?"−"+x.menos.length:""}`}</summary><pre class="h3dif">${esc(h3Txt(x))}</pre></details> <button class="b s" type="button" data-h3prev="${esc(x.t.id)}" title="Ver o email que este formador vai receber">Ver email</button></td></tr>`).join("")+`</tbody></table></div>
    <div class="h3ms">${ms?`Os emails saem de <b>${esc(MSACC.username||"")}</b>.`:`<span>Para enviar emails é preciso a sua conta da Microsoft neste navegador.</span><button class="b s" type="button" id="h3MsLig">Ligar a conta da Microsoft</button>`}</div>
    <div class="row" style="margin-top:10px;flex-wrap:wrap;gap:8px">
      <button class="b" id="h3Em">Enviar email</button>
      <button class="b" id="h3Pu">Enviar notificação ao telemóvel</button>
      <button class="b" id="h3EmPu">Email e notificação</button>
      ${sms?`<a class="b s" id="h3Sms" href="${esc(sms)}">SMS pelo telemóvel</a>`:""}
      <button class="b s" id="h3Wa" title="Abre o WhatsApp com a mensagem de cada formador já escrita (gratuito)">WhatsApp um a um</button>
      <span class="grow"></span><button class="b s" id="h3Marc" title="Dar como avisados sem enviar nada">Marcar como avisados</button></div>
    <p class="hint" id="h3Msg" style="margin:8px 0 0">${ms?"":"Para enviar emails, entre com o Office 365 da escola (como para os outros envios). "}${semEm?semEm+" sem email em Escola360 › Formadores. ":""}</p>`}
  h+=`</div>`;
  // 0.9.170: turmas (formandos) pelo WhatsApp
  const LC=h3PendentesC();
  h+=`<div class="card"><h3 style="margin:0 0 4px">Turmas — avisar os formandos pelo WhatsApp</h3>
    <p class="hint" style="margin:0 0 10px">${LC.length?"Turmas com o horário diferente do último aviso. Use o grupo de avisos da turma (texto pronto a copiar) ou envie aos formandos um a um. Os telemóveis dos formandos escrevem-se em Escola360 › Formandos (ficam só com a Direção). Gratuito: sai pelo WhatsApp de quem envia.":"Todas as turmas já foram avisadas do horário atual."}</p>`;
  if(LC.length){h+=`<div class="tw"><table class="rt"><thead><tr><th>Turma</th><th>Formandos com telemóvel</th><th>O que mudou</th><th></th></tr></thead><tbody>`+
    LC.slice(0,80).map(x=>{const F=h3FormandosC(x),ct=F.filter(f=>waTelFor(f)).length;return `<tr><td><b>${esc((x.t&&x.t.cod)||x.c.name)}</b>${x.t?"":` <small class="hint">(sem turma na Escola360)</small>`}</td><td>${ct} de ${F.length}</td>
      <td><details><summary>${x.novo?"horário ("+x.cur.length+" tempo"+(x.cur.length===1?"":"s")+")":`${x.mais.length?"+"+x.mais.length:""}${x.mais.length&&x.menos.length?" / ":""}${x.menos.length?"−"+x.menos.length:""}`}</summary><pre class="h3dif">${esc(h3TxtC(x))}</pre></details></td>
      <td style="white-space:nowrap"><button class="b s" type="button" data-h3wag="${esc(x.c.id)}">Grupo da turma</button> <button class="b s" type="button" data-h3waf="${esc(x.c.id)}"${ct?"":" disabled title=\"Nenhum formando desta turma tem telemóvel\""}>Formandos um a um</button> <button class="b s" type="button" data-h3wam="${esc(x.c.id)}" title="Dar a turma como avisada sem enviar nada">Marcar</button></td></tr>`}).join("")+`</tbody></table></div>
    ${LC.length>80?`<p class="hint">E mais ${LC.length-80} turmas.</p>`:""}<div class="row" style="margin-top:8px"><span class="grow"></span><button class="b s" type="button" id="h3WaMT">Marcar todas as turmas como avisadas</button></div>`}
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
    <label class="h3lb">WhatsApp aos formadores <small class="hint">— também {primeiro_nome}</small><textarea data-h3m2="wa" rows="6">${esc(H3.msg.wa)}</textarea></label>
    <label class="h3lb">WhatsApp às turmas <small class="hint">— {turma}, {alteracoes}, {semana}, {ligacao}; um a um também {primeiro_nome}</small><textarea data-h3m2="waT" rows="6">${esc(H3.msg.waT)}</textarea></label>
    <div class="row" style="margin-top:6px"><button class="b s" id="h3MsgRep">Repor as mensagens originais</button></div></div>`;
  // contactos
  const F=(st.teachers||[]).map(t=>({t,p:h3ProfDe(st,t.id)})).filter(x=>x.p).sort((a,b)=>cmpProf(a.p,b.p));
  h+=`<div class="card"><h3 style="margin:0 0 4px">Contactos dos formadores</h3>
    <p class="hint" style="margin:0 0 8px">O email vem de Escola360 › Formadores. Os telemóveis servem para o SMS e o WhatsApp e ficam só com a Direção (não são publicados). O tópico é o que cada formador escreve na app ntfy para receber as notificações — também o vê em Horários360 › Semana.</p>
    <div class="tw"><table class="rt"><thead><tr><th>Formador</th><th>Email</th><th>Telemóvel</th><th>Tópico das notificações</th></tr></thead><tbody>`+
    F.map(({p})=>{const tp=h3Topico(h3Email(p));return `<tr><td>${esc(profRot(p))}</td><td>${esc(h3Email(p)||"—")}</td><td><input type="text" data-h3tel="${esc(p.id)}" value="${esc(H3.tel[p.id]||"")}" placeholder="9xx xxx xxx" inputmode="tel" style="width:140px"></td><td>${tp?`<code class="h3top">${esc(tp)}</code> <button class="b s" data-h3cp="${esc(tp)}" title="Copiar">Copiar</button>`:"—"}</td></tr>`}).join("")+`</tbody></table></div></div>`;
  // como funciona
  h+=`<div class="card"><h3 style="margin:0 0 4px">Como chegam os avisos (tudo gratuito)</h3><ul class="hint" style="margin:0;padding-left:18px">
    <li><b>Email</b> — pela conta do Office 365 da escola de quem envia, como os outros envios da EPISJ 360.</li>
    <li><b>Notificação no telemóvel</b> — pelo <b>ntfy</b> (serviço gratuito e de código aberto, sem conta): o formador instala a app ntfy e subscreve o seu tópico. Chega como uma mensagem, mas não gasta SMS. A mensagem só diz que o horário mudou e onde o ver.</li>
    <li><b>WhatsApp</b> — gratuito: a app abre o WhatsApp de quem envia (no computador ou no telemóvel) com o número e a mensagem já escritos, e basta carregar em Enviar; passa-se de pessoa em pessoa. Para as turmas há também o texto pronto para o grupo de avisos da turma.</li>
    <li><b>SMS</b> — não há serviço de SMS gratuito em Portugal para muitos envios (os gratuitos dão 1 SMS por dia ou só créditos de teste). Por isso o botão abre a app Mensagens do telemóvel (ou do Mac) com os números e o texto já preenchidos: sai pelo tarifário do telemóvel da escola.</li></ul></div>`;
  // histórico
  const E=H3.env.slice(-30).reverse();
  if(E.length)h+=`<div class="card"><h3 style="margin:0 0 6px">Últimos avisos</h3><div class="tw"><table class="rt"><thead><tr><th>Quando</th><th>Formador</th><th>Por</th><th>Enviado por</th></tr></thead><tbody>`+
    E.map(e=>`<tr><td>${esc(new Date(e.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}</td><td>${esc(e.quem)}</td><td>${esc((e.canais||[]).map(c=>({email:"email",push:"notificação",sms:"SMS",wa:"WhatsApp",marca:"marcado à mão"})[c]||c).join(", "))}</td><td>${esc(e.por)}</td></tr>`).join("")+`</tbody></table></div></div>`;
  el.innerHTML=h;
  const sel=()=>{const ids=new Set([...el.querySelectorAll("[data-h3sel]:checked")].map(i=>i.dataset.h3sel));return L.filter(x=>ids.has(x.t.id))};
  const m=t=>{const e=$("#h3Msg");if(e)e.textContent=t};
  const go=async can=>{const S=sel();if(!S.length){toast("Escolha pelo menos um formador");return}
    if(!confirm(`Enviar ${can.map(c=>c==="email"?"email":"notificação").join(" e ")} a ${S.length} formador${S.length===1?"":"es"}?`))return;
    const r=await h3Enviar(S,can,m,true);if(!r)return;toast(`${r.ok} formador${r.ok===1?"":"es"} avisado${r.ok===1?"":"s"}`);hsComRender().then(()=>{const e=$("#h3Msg");if(!e)return;e.innerHTML=(r.nomes&&r.nomes.length?`<span style="color:var(--ok,#1a7f45)">Enviado: ${r.nomes.slice(0,10).map(esc).join("; ")}${r.nomes.length>10?" e mais "+(r.nomes.length-10):""}.</span>`:"")+(r.erros.length?`${r.nomes&&r.nomes.length?"<br>":""}<span style="color:var(--bad)">${r.erros.slice(0,8).map(esc).join("<br>")}</span>`:"")})};
  // 0.9.156: o botão liga a conta da Microsoft logo no clique (a janela não é bloqueada); sem conta carregada, tenta recuperá-la da sessão do navegador
  const bl=$("#h3MsLig");if(bl)bl.onclick=async()=>{try{await msLoginPopup();toast("Conta da Microsoft ligada");hsComRender()}catch(e){m(typeof msErro==="function"?msErro(e):String(e.message||e))}};
  if(!ms&&!window.__h3MsTent){window.__h3MsTent=1;msInit().then(()=>{if(MSACC)hsComRender()}).catch(()=>{})}
  const b1=$("#h3Em"),b2=$("#h3Pu"),b3=$("#h3EmPu"),b4=$("#h3Marc"),b5=$("#h3Sms"),all=$("#h3All");
  if(b1)b1.onclick=()=>go(["email"]);if(b2)b2.onclick=()=>go(["push"]);if(b3)b3.onclick=()=>go(["email","push"]);
  if(all)all.onchange=()=>{el.querySelectorAll("[data-h3sel]").forEach(i=>i.checked=all.checked);h3SmsAtual()};
  el.querySelectorAll("[data-h3sel]").forEach(i=>i.onchange=h3SmsAtual);
  function h3SmsAtual(){if(b5){const s=h3SmsLink(sel());if(s)b5.href=s;b5.hidden=!s}}
  if(b5)b5.onclick=()=>{setTimeout(()=>{const S=sel().filter(x=>!x.tlOk&&h3Tel(H3.tel[(x.p||{}).id]));if(S.length&&confirm("A mensagem foi enviada pelo telemóvel? Os "+S.length+" formadores com telemóvel ficam como avisados por telemóvel."))
    {S.forEach(x=>h3Marcar(x,["sms"]));h3Guardar();hsComRender()}},1500)};
  if(b4)b4.onclick=()=>{const S=sel();if(!S.length)return;if(!confirm(`Dar ${S.length} formador${S.length===1?"":"es"} como avisado${S.length===1?"":"s"} pelas duas vias sem enviar nada?`))return;S.forEach(x=>h3Marcar(x,["marca"]));h3Guardar();hsComRender()};
  // 0.9.170: WhatsApp
  const bw=$("#h3Wa");if(bw)bw.onclick=()=>{const S=sel();if(!S.length){toast("Escolha pelo menos um formador");return}
    waFila(S.map(x=>({id:x.t.id,x,nome:(x.p&&x.p.nome)||x.t.name||"",tel:h3Tel(H3.tel[(x.p||{}).id]),txt:waPreencher(h3Preencher(H3.msg.wa,x),(x.p&&x.p.nome)||x.t.name||"")})),{titulo:"Horário por WhatsApp — formadores",
      onFeito:y=>{h3Marcar(y.x,["wa"]);waRegistar("h3",y.id,y.nome)},fim:n=>{if(n)hsComRender()}})};
  const xC=id=>LC.find(y=>y.c.id===id);
  el.querySelectorAll("[data-h3wag]").forEach(b=>b.onclick=()=>{const x=xC(b.dataset.h3wag);if(!x)return;
    waGrupo("Grupo da turma "+((x.t&&x.t.cod)||x.c.name),h3PreencherC(H3.msg.waT,x,"").replace(/Olá ,/g,"Olá a todos,"),{sub:"Copie e cole no grupo de avisos da turma, ou abra o WhatsApp e escolha o grupo. A turma fica como avisada.",onFeito:()=>{h3MarcarC(x);waRegistar("h3t",x.c.id,"grupo");setTimeout(hsComRender,400)}})});
  el.querySelectorAll("[data-h3waf]").forEach(b=>b.onclick=()=>{const x=xC(b.dataset.h3waf);if(!x)return;const F=h3FormandosC(x),com=F.filter(f=>waTelFor(f)).length;
    waFila(F.map(f=>({id:f.id,nome:f.nome,tel:waTelFor(f),txt:h3PreencherC(H3.msg.waT,x,f.nome)})),{titulo:"Horário da turma "+((x.t&&x.t.cod)||x.c.name)+" — formandos",
      sub:"Depois de enviar a todos, a turma fica como avisada.",onFeito:f=>waRegistar("h3t",x.c.id,f.nome),fim:n=>{if(n&&n>=com){h3MarcarC(x);h3Guardar()}if(n)hsComRender()}})});
  el.querySelectorAll("[data-h3wam]").forEach(b=>b.onclick=()=>{const x=xC(b.dataset.h3wam);if(!x)return;h3MarcarC(x);h3Guardar();hsComRender()});
  const bmt=$("#h3WaMT");if(bmt)bmt.onclick=()=>{if(!confirm(`Dar as ${LC.length} turmas como avisadas sem enviar nada?`))return;LC.forEach(h3MarcarC);h3Guardar();hsComRender()};
  el.querySelectorAll("[data-h3prev]").forEach(b=>b.onclick=()=>{const x=L.find(y=>y.t.id===b.dataset.h3prev);if(!x)return;const w=window.open("","_blank");if(!w){toast("O navegador bloqueou a janela — permita janelas deste site");return}
    w.document.open();w.document.write(h3EmailHtml(x).replace("<body",`<body`).replace('<div style="max-width:780px;padding:8px 4px">',`<div style="max-width:780px;padding:8px 4px"><p style="font-family:Segoe UI,Arial,sans-serif;font-size:12px;color:#6b7385;margin:0 0 14px">Pré-visualização · Para: ${esc(h3Email(x.p))} · Assunto: ${esc(h3Preencher(H3.msg.assunto,x))}</p>`));w.document.close()});
  el.querySelectorAll("[data-h3a]").forEach(i=>i.onchange=()=>{H3.auto[i.dataset.h3a]=i.checked;h3Guardar()});
  el.querySelectorAll("[data-h3m2]").forEach(i=>i.onchange=()=>{H3.msg[i.dataset.h3m2]=i.value;h3Guardar()});
  $("#h3MsgRep").onclick=()=>{if(!confirm("Repor as mensagens originais?"))return;H3.msg=Object.assign({},H3_MSG0);h3Guardar();hsComRender()};
  el.querySelectorAll("[data-h3tel]").forEach(i=>i.onchange=()=>{const v=i.value.trim();if(v&&!h3Tel(v)){toast("Número de telemóvel inválido");return}H3.tel[i.dataset.h3tel]=v?h3Tel(v):"";h3Guardar()})}
h3Carregar();
