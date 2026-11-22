/* ---------- módulo RoomCheck: reservas do Auditório e dos Laboratórios de Informática 1 e 2 ----------
   Guardado neste navegador ("roomcheck") e na nuvem da EPISJ 360 (nome "rc"), junto por reserva: em cada uma vence a alteração mais recente
   (as canceladas ficam marcadas x:1 durante 90 dias para não voltarem de outro computador). Nada vai para a Box. */
const RC_VER="1.3";
document.querySelectorAll("[data-rcver]").forEach(el=>el.textContent="v"+RC_VER);
const RC_ESP0=[{id:"auditorio",n:"Auditório",sg:"Aud.",c:"#7c3aed",on:1},{id:"lab1",n:"Laboratório de Informática 1",sg:"LI1",c:"#0e7490",on:1},{id:"lab2",n:"Laboratório de Informática 2",sg:"LI2",c:"#c2410c",on:1}];
let RC=(()=>{let o=null;try{o=JSON.parse(localStorage.getItem("roomcheck")||"null")}catch(e){}
  if(!o||typeof o!=="object")o={};if(!Array.isArray(o.esp)||!o.esp.length)o.esp=RC_ESP0.map(x=>({...x}));
  o.cfg=Object.assign({abre:480,fecha:1140,sab:false},o.cfg||{});{const g=+(localStorage.getItem("episj_ger")||0);if(g&&!o.ger)o.ger=g}o.res=o.res&&typeof o.res==="object"?o.res:{};o.et=o.et||0;return o})();
const RCV={sem:"",esp:"",ed:null,vista:(()=>{try{return localStorage.getItem("rc_vista")||"sem"}catch(e){return"sem"}})(),ref:""};
// 0.9.14: tempos letivos (início e fim em minutos) — os do horário da escola; podem mudar-se em RoomCheck › Espaços
const RC_TEMPOS0=[[510,560],[570,620],[640,690],[700,750],[810,860],[870,920],[940,990]];
function rcTempos(){const T=(Array.isArray(RC.cfg.tempos)?RC.cfg.tempos:RC_TEMPOS0).filter(t=>Array.isArray(t)&&Number.isFinite(t[0])&&Number.isFinite(t[1])&&t[1]>t[0]).slice().sort((a,b)=>a[0]-b[0]);return T.length?T:RC_TEMPOS0}
const rcPad=n=>String(n).padStart(2,"0");
const rcIso=d=>d.getFullYear()+"-"+rcPad(d.getMonth()+1)+"-"+rcPad(d.getDate());
const rcData=s=>{const p=String(s||"").split("-");return new Date(+p[0],(+p[1]||1)-1,+p[2]||1)};
const rcMais=(s,n)=>{const d=rcData(s);d.setDate(d.getDate()+n);return rcIso(d)};
const rcSeg=s=>{const d=rcData(s);d.setDate(d.getDate()-(d.getDay()+6)%7);return rcIso(d)};
const rcHoje=()=>rcIso(new Date());
const rcHm=m=>rcPad(Math.floor(m/60))+":"+rcPad(m%60);
const rcHc=m=>Math.floor(m/60)+":"+rcPad(m%60);
const rcMin=t=>{const p=String(t||"").split(":");return p.length<2||p[0]===""?NaN:(+p[0])*60+(+p[1])};
const rcE=id=>RC.esp.find(e=>e.id===id)||{id,n:id,sg:id,c:"#64748b",on:0};
const rcDia=(s,o)=>rcData(s).toLocaleDateString("pt-PT",o||{weekday:"long",day:"numeric",month:"long"});
const rcAtivas=()=>Object.values(RC.res).filter(r=>r&&!r.x);
const rcChoque=(e,d,h0,h1,ignorar)=>rcAtivas().concat(rcAulas(d)).find(r=>r.e===e&&r.d===d&&r.h0<h1&&r.h1>h0&&r.id!==ignorar);
function rcGravar(nuvem){
  const lim=Date.now()-90*864e5;for(const k in RC.res){const r=RC.res[k];if(r&&r.x&&(r.u||0)<lim)delete RC.res[k]}
  if(LIMPAR)return;try{localStorage.setItem("roomcheck",JSON.stringify(RC))}catch(e){toast("Não foi possível guardar neste navegador")}
  if(nuvem!==false)rcNuvemAgendar()}
/* nuvem da EPISJ 360 */
let rcNuvH=null,rcNuvOk=0,rcNuvErr="";
function rcJuntar(a,b){if((a.ger||0)!==(b.ger||0))return (a.ger||0)>(b.ger||0)?a:b;const o={ger:a.ger||0,esp:a.esp,cfg:a.cfg,et:a.et||0,res:{...(a.res||{})}};
  if((b.et||0)>(o.et||0)){o.esp=b.esp;o.cfg=Object.assign({abre:480,fecha:1140,sab:false},b.cfg||{});o.et=b.et}
  for(const k in (b.res||{})){const r=b.res[k];if(!r)continue;const l=o.res[k];if(!l||(r.u||0)>(l.u||0))o.res[k]=r}return o}
function rcNuvemAgendar(){clearTimeout(rcNuvH);nuvFila("rcNuvH",()=>rcTrazer(true),1500)}
async function rcTrazer(enviar){try{if(!NUVOK()||nuvDesl()){rcNuvUI();return}
    let rem=null;const idx=(await (await nuvem("GET","")).json()).itens||{};if(idx.rc)rem=await nuvemGet("rc");
    const antes=JSON.stringify(RC);if(rem)RC=rcJuntar(RC,rem);
    const mudouAqui=JSON.stringify(RC)!==antes;if(mudouAqui)rcGravar(false);
    if(enviar||!rem||JSON.stringify(rcJuntar(rem,RC))!==JSON.stringify(rem))await nuvem("PUT","rc",await gz(RC),Date.now());
    rcNuvOk=Date.now();rcNuvErr="";if(mudouAqui&&curTab.startsWith("rc"))rcRender(curTab)}
  catch(e){if(e.kind!=="nokv")rcNuvErr=e.message||String(e)}rcNuvUI()}
function rcNuvUI(){const el=$("#rcNuv");if(!el)return;
  el.innerHTML=!NUVOK()?"":nuvDesl()?`<div class="msg info">Sem armazenamento na nuvem: as reservas ficam só neste navegador.</div>`:rcNuvErr?`<div class="msg bad">Não foi possível guardar na nuvem (${esc(rcNuvErr)}). Volta a tentar sozinho.</div>`:rcNuvOk?`<div class="msg ok">${ico("cloud")} Reservas guardadas na nuvem às ${new Date(rcNuvOk).toLocaleTimeString("pt-PT",{hour:"2-digit",minute:"2-digit"})}.</div>`:""}
/* atualiza com a vista aberta e à vista (para ver as reservas feitas noutro computador) */
setInterval(()=>{if(curTab&&curTab.startsWith("rc")&&document.visibilityState==="visible"&&$("#rcDw").hidden)rcTrazer(false)},60000);

function rcRender(t){t=t||curTab;if(!RCV.sem)RCV.sem=rcSeg(rcHoje());
  if(t==="rcMapa")rcMapa();if(t==="rcLista")rcLista();if(t==="rcEsp")rcEspacos();rcNuvUI()}

/* ---------- mapa da semana ---------- */
function rcMapa(){const hoje=rcHoje(),E=RC.esp.filter(e=>e.on);if(RCV.esp&&!E.some(e=>e.id===RCV.esp))RCV.esp="";
  const nada=!RCV.esp,esps=nada?E.slice(0,1).map(e=>({...e,id:"\u0000",c:"#9aa3b2"})):E.filter(e=>e.id===RCV.esp); // 0.9.22: sem sala escolhida não há vista "Todos" — o calendário fica a cinzento e vazio
  rcSemSala(nada);
  document.querySelectorAll("[data-rcvis]").forEach(b=>{b.classList.toggle("on",b.dataset.rcvis===RCV.vista);b.setAttribute("aria-selected",b.dataset.rcvis===RCV.vista)});
  if(RCV.vista==="mes"||RCV.vista==="ano")return rcMesAno(E,esps);
  const n=RC.cfg.sab?6:5,dias=[...Array(n)].map((_,i)=>rcMais(RCV.sem,i));const A=rcAtivas();
  if(!RC.cfg.sab&&A.some(r=>r.d===rcMais(RCV.sem,5)))dias.push(rcMais(RCV.sem,5));
  const AM=A.concat(dias.flatMap(d=>rcAulas(d))); // 0.9.47: com as aulas do Horários360
  const T=rcTempos();let H0=T[0][0],H1=T[T.length-1][1];AM.forEach(r=>{if(dias.includes(r.d)&&esps.some(e=>e.id===r.e)){H0=Math.min(H0,Math.floor(r.h0/30)*30);H1=Math.max(H1,Math.ceil(r.h1/30)*30)}});
  const PX=rcPx(H1-H0,46),alt=(H1-H0)*PX,estreito=esps.length>1,fim=rcMais(RCV.sem,dias.length-1);
  $("#rcEsps").innerHTML=E.map(e=>`<button class="rc-chip${RCV.esp===e.id?" on":""}" data-rcesp="${esc(e.id)}" style="--c:${esc(e.c)}"><i></i>${esc(e.n)}</button>`).join("");
  $("#rcSem").textContent=rcData(RCV.sem).toLocaleDateString("pt-PT",{day:"numeric",month:"short"})+" – "+rcData(fim).toLocaleDateString("pt-PT",{day:"numeric",month:"short",year:"numeric"});
  const horas=[];for(let m=Math.ceil(H0/60)*60;m<=H1;m+=60)if(m<T[0][0]-15||m>T[T.length-1][1]+15)horas.push(m); // horas só fora dos tempos letivos
  const gaps=T.slice(1).map((t,i)=>[T[i][1],t[0]]).filter(g=>g[1]>g[0]);
  const bloco=(r,e)=>{const top=(r.h0-H0)*PX,h=Math.max(18,(r.h1-r.h0)*PX-2),curto=h<40,medio=h<62;
    const hh=estreito?`<b>${rcHc(r.h0)}</b>${medio?"":`<b>–${rcHc(r.h1)}</b>`}`:`<b>${rcHm(r.h0)}–${rcHm(r.h1)}</b>`;
    if(r.aula)return `<div class="rc-bl rc-aula${curto?" curto":""}" data-rcaula="${esc(r.id)}" style="--c:${esc(e.c)};top:${top}px;height:${h}px" title="${esc(e.n+" · "+rcHm(r.h0)+"–"+rcHm(r.h1)+" · "+r.p+(r.t?" · "+r.t:"")+(r.m?" · "+r.m:"")+" (Horários360)")}"><span class="rc-hh">${hh}</span><span>${esc(r.p)}</span>${curto?"":r.t?`<span class="rc-mut">${esc(r.t)}</span>`:""}</div>`;
    return `<button class="rc-bl${curto?" curto":""}" data-rcr="${esc(r.id)}" style="--c:${esc(e.c)};top:${top}px;height:${h}px" title="${esc(e.n+" · "+rcHm(r.h0)+"–"+rcHm(r.h1)+" · "+r.p+(r.t?" · "+r.t:"")+(r.m?" · "+r.m:""))}"><span class="rc-hh">${hh}</span><span>${esc(r.p)}</span>${curto?"":r.t?`<span class="rc-mut">${esc(r.t)}</span>`:""}</button>`};
  const linhas=horas.map(m=>`<i style="top:${(m-H0)*PX}px"></i>`).join("")+T.map(t=>`<i class="t" style="top:${(t[0]-H0)*PX}px"></i><i class="t" style="top:${(t[1]-H0)*PX}px"></i>`).join("")
    +gaps.map(g=>`<b class="rc-int${g[1]-g[0]>=45?" alm":""}" style="top:${(g[0]-H0)*PX}px;height:${(g[1]-g[0])*PX}px"></b>`).join("");
  $("#rcGrid").innerHTML=`<div class="rc-grid${estreito?" rc-3":""}" style="--nd:${dias.length}"><div class="rc-cab"></div>
    ${dias.map(d=>`<div class="rc-cab${d===hoje?" hoje":""}"><b>${esc(rcData(d).toLocaleDateString("pt-PT",{weekday:"short"}).replace(".",""))}</b> <span>${rcData(d).getDate()}</span>${estreito?`<div class="rc-sub" style="grid-template-columns:repeat(${esps.length},1fr)">${esps.map(e=>`<span style="--c:${esc(e.c)}" title="${esc(e.n)}">${esc(e.sg)}</span>`).join("")}</div>`:""}</div>`).join("")}
    <div class="rc-horas" style="height:${alt}px">${horas.map(m=>`<span style="top:${(m-H0)*PX}px">${rcHm(m)}</span>`).join("")}${T.map(t=>`<div class="rc-tp" style="top:${(t[0]-H0)*PX}px;height:${(t[1]-t[0])*PX}px"><b>${rcHm(t[0])}</b><em>${rcHm(t[1])}</em></div>`).join("")}${gaps.filter(g=>g[1]-g[0]>=45).map(g=>`<div class="rc-alm" style="top:${(g[0]-H0)*PX}px;height:${(g[1]-g[0])*PX}px">Almoço</div>`).join("")}</div>
    ${dias.map(d=>`<div class="rc-dia${d===hoje?" hoje":""}${d<hoje?" pas":""}"><div class="rc-lanes" style="height:${alt}px">${linhas}${esps.map(e=>`<div class="rc-lane" data-rcd="${d}" data-rce="${esc(e.id)}" style="--c:${esc(e.c)}">${AM.filter(r=>r.d===d&&r.e===e.id).map(r=>bloco(r,e)).join("")}</div>`).join("")}</div></div>`).join("")}</div>`;
  const prox=A.filter(r=>r.d>=hoje).sort((a,b)=>a.d.localeCompare(b.d)||a.h0-b.h0).slice(0,10);
  $("#rcProx").innerHTML=prox.length?`<div class="rc-lista">${prox.map(r=>{const e=rcE(r.e);return `<div class="rc-it" style="--c:${esc(e.c)}"><i></i><div><b>${esc(e.n)}</b> · ${esc(rcDia(r.d))} · ${rcHm(r.h0)}–${rcHm(r.h1)}<br><span class="rc-mut">${esc(r.p)}${r.t?" · "+esc(r.t):""}${r.m?" · "+esc(r.m):""}${r.s?" · todas as semanas":""}</span></div><button class="b s" data-rcv="${esc(r.id)}">Ver</button></div>`}).join("")}</div>`:`<p class="hint" style="margin:0">Ainda não há reservas marcadas.</p>`;
  document.querySelectorAll("[data-rcesp]").forEach(b=>b.onclick=()=>{RCV.esp=b.dataset.rcesp;rcMapa()});
  document.querySelectorAll("#rcGrid .rc-lane").forEach(l=>l.onclick=ev=>{if(!RCV.esp||ev.target.closest(".rc-bl"))return;const d=l.dataset.rcd;if(d<hoje){toast("Não dá para reservar em dias que já passaram");return}
    const m=H0+(ev.clientY-l.getBoundingClientRect().top)/PX,tp=T.find(t=>m>=t[0]&&m<t[1]),ag=(()=>{const n=new Date();return n.getHours()*60+n.getMinutes()})();
    if(tp){if(d===hoje&&tp[1]<=ag){toast("Esse tempo já passou");return}rcNova({e:l.dataset.rce,d,h0:tp[0],h1:tp[1]});return} // clique num tempo: reserva esse tempo
    let h0=H0+Math.floor((m-H0)/30)*30;if(d===hoje&&h0+30<=ag)h0=Math.ceil(ag/15)*15;
    rcNova({e:l.dataset.rce,d,h0,h1:Math.min(1439,h0+90)})});
  document.querySelectorAll("#rcMapa [data-rcr],#rcMapa [data-rcv]").forEach(b=>b.onclick=()=>{if(rcArrastou){rcArrastou=false;return}rcVer(RC.res[b.dataset.rcr||b.dataset.rcv])});
  document.querySelectorAll("#rcGrid .rc-bl[data-rcr]").forEach(b=>b.addEventListener("pointerdown",ev=>rcArrastar(ev,b,{H0,PX,T,hoje})));
  document.querySelectorAll("#rcGrid [data-rcaula]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();toast(b.title)});
  const sc=$("#rcGrid").closest(".rc-scroll"),dh=$("#rcGrid .rc-dia.hoje");if(sc&&dh&&sc.scrollWidth>sc.clientWidth+4&&sc.dataset.sem!==RCV.sem){sc.dataset.sem=RCV.sem;sc.scrollLeft=Math.max(0,dh.offsetLeft-(window.innerWidth<700?40:52))}}
/* RoomCheck 1.2: arrastar uma reserva para outra hora, dia ou espaço; nas que se repetem, pergunta se é só este dia ou todas */
let rcArrastou=false;
/* RoomCheck 1.3: o mapa ocupa a altura que o ecrã tem livre (e volta a desenhar-se quando a janela muda de tamanho) */
function rcLivre(cab){const g=$("#rcGrid");if(!g||!g.offsetParent)return 0;const top=g.getBoundingClientRect().top+window.scrollY;
  const f=$("#fundos"),fh=f&&!f.hidden&&getComputedStyle(f).display!=="none"&&getComputedStyle(f).position==="fixed"?f.getBoundingClientRect().height:0; // 0.9.20: a barra dos logótipos fixa em baixo tapa o fim do mapa
  return Math.max(0,window.innerHeight-top-cab-28-fh)} // 28 = margem do cartão por baixo
function rcPx(min,cab){const h=rcLivre(cab),pq=window.innerWidth<700;if(!h)return 1.15;return Math.max(pq?.85:.9,Math.min(2.6,h/min))}
let rcRsz=0,rcLarg=window.innerWidth;
{const fb=$("#fundos");if(fb&&window.MutationObserver)new MutationObserver(()=>{if(curTab==="rcMapa"){clearTimeout(rcRsz);rcRsz=setTimeout(rcMapa,60)}}).observe(fb,{attributes:true,attributeFilter:["hidden"]})}
window.addEventListener("resize",()=>{clearTimeout(rcRsz);rcRsz=setTimeout(()=>{if(curTab==="rcMapa"&&!document.querySelector(".rc-bl.arr")){rcMapa()}rcLarg=window.innerWidth},150)});
function rcArrastar(ev,el,o){if(ev.button!==0)return;const r=RC.res[el.dataset.rcr];if(!r||r.d<o.hoje)return;
  const dur=r.h1-r.h0,y0=ev.clientY,x0=ev.clientX,lane0=el.parentNode,top0=parseFloat(el.style.top),dy=y0-el.getBoundingClientRect().top;
  let ativo=false,alvo=null,dica=null;
  const calc=(cx,cy)=>{el.style.pointerEvents="none";const ln=document.elementFromPoint(cx,cy)?.closest?.(".rc-lane");el.style.pointerEvents="";if(!ln)return null;
    let h0=o.H0+(cy-dy-ln.getBoundingClientRect().top)/o.PX;const tp=o.T.find(t=>h0+10>=t[0]&&h0+10<t[1]); // perto do início de um tempo: encaixa nele
    h0=tp&&Math.abs(h0-tp[0])<=20?tp[0]:Math.round(h0/5)*5;h0=Math.max(0,Math.min(1440-dur,h0));
    const d=ln.dataset.rcd,e=ln.dataset.rce;return{ln,d,e,h0,h1:h0+dur,mau:d<o.hoje?"dia que já passou":(rcChoque(e,d,h0,h0+dur,r.id)?"ocupado":"")}};
  const mover=m=>{if(!ativo){if(Math.hypot(m.clientX-x0,m.clientY-y0)<5)return;ativo=true;el.classList.add("arr");el.setPointerCapture(ev.pointerId);dica=document.createElement("div");dica.className="rc-arrh";document.body.appendChild(dica)}
    m.preventDefault();const a=calc(m.clientX,m.clientY);if(!a)return;alvo=a;if(a.ln!==el.parentNode)a.ln.appendChild(el);
    el.style.top=(a.h0-o.H0)*o.PX+"px";el.classList.toggle("mau",!!a.mau);
    dica.textContent=`${rcE(a.e).sg} · ${rcData(a.d).toLocaleDateString("pt-PT",{weekday:"short",day:"numeric"})} · ${rcHm(a.h0)}–${rcHm(a.h1)}${a.mau?" — "+a.mau:""}`;dica.style.left=m.clientX+14+"px";dica.style.top=m.clientY+14+"px"};
  const largar=()=>{el.removeEventListener("pointermove",mover);el.removeEventListener("pointerup",largar);el.removeEventListener("pointercancel",largar);if(dica)dica.remove();
    if(!ativo)return;rcArrastou=true;setTimeout(()=>rcArrastou=false,50);
    const voltar=()=>{lane0.appendChild(el);el.style.top=top0+"px";el.classList.remove("arr","mau")};
    if(!alvo||(alvo.d===r.d&&alvo.e===r.e&&alvo.h0===r.h0)){voltar();return}
    if(alvo.mau){voltar();toast(alvo.mau==="ocupado"?"Esse espaço está ocupado nesse horário":"Não dá para mudar para um dia que já passou");return}
    rcMover(r,alvo,voltar)};
  el.addEventListener("pointermove",mover);el.addEventListener("pointerup",largar);el.addEventListener("pointercancel",largar)}
function rcMover(r,a,voltar){const hoje=rcHoje(),serie=r.s?rcAtivas().filter(x=>x.s===r.s&&x.d>=r.d&&x.d>=hoje).sort((x,y)=>x.d.localeCompare(y.d)):[];
  const desc=`${rcE(a.e).n} · ${rcDia(a.d)} · ${rcHm(a.h0)}–${rcHm(a.h1)}`;
  const aplicar=todas=>{const dd=Math.round((rcData(a.d)-rcData(r.d))/864e5),u=Date.now(),L=todas?serie:[r],ok=[],oc=[];
    for(const x of L){const d=rcMais(x.d,dd),c=rcChoque(a.e,d,a.h0,a.h1,x.id);if(c||d<hoje){oc.push({d,c});continue}
      RC.res[x.id]={...x,e:a.e,d,h0:a.h0,h1:a.h1,s:todas?x.s:"",u};ok.push(d)} // só este dia: sai da série
    rcGravar();rcFechar();rcRender(curTab);
    if(!oc.length)toast(ok.length>1?ok.length+" reservas mudadas":"Reserva mudada · "+desc);
    else toast(`${ok.length} mudada(s); ficaram como estavam ${oc.length} (ocupado: ${oc.map(o=>rcDia(o.d,{day:"numeric",month:"short"})).join(", ")})`)};
  if(serie.length<2){aplicar(false);return}
  rcAbrir("Mudar reserva",`<div class="rc-ver" style="--c:${esc(rcE(a.e).c)}"><b>${esc(r.p)}</b><span>${esc(desc)}</span></div>
    <p class="hint">Esta reserva repete-se todas as semanas (${serie.length} de hoje em diante). O que quer mudar?</p>
    <div class="rc-mv"><button class="b" id="rcMv1">Só este dia<small>${esc(rcDia(r.d,{weekday:"long",day:"numeric",month:"long"}))} — as outras semanas ficam como estão</small></button>
    <button class="b s" id="rcMvT">Todas as semanas, deste dia em diante<small>${serie.length} reservas passam para ${esc(rcData(a.d).toLocaleDateString("pt-PT",{weekday:"long"}))}, ${rcHm(a.h0)}–${rcHm(a.h1)}${a.e!==r.e?", "+esc(rcE(a.e).n):""}</small></button>
    <button class="b s" id="rcMvX">Cancelar</button></div>`);
  voltar(); // até escolher, a reserva fica onde estava (fechar o painel de qualquer forma é cancelar)
  $("#rcMv1").onclick=()=>aplicar(false);$("#rcMvT").onclick=()=>aplicar(true);$("#rcMvX").onclick=rcFechar}
document.querySelectorAll("[data-rcnav]").forEach(b=>b.onclick=()=>{const n=+b.dataset.rcnav,v=RCV.vista;
  if(!n){RCV.sem=rcSeg(rcHoje());RCV.ref=rcHoje()}
  else if(v==="sem")RCV.sem=rcMais(RCV.sem||rcSeg(rcHoje()),7*n);
  else{const r=rcData(RCV.ref||rcHoje());RCV.ref=rcIso(v==="mes"?new Date(r.getFullYear(),r.getMonth()+n,1):new Date(r.getFullYear()+n,0,1))}
  rcMapa()});
document.querySelectorAll("[data-rcvis]").forEach(b=>b.onclick=()=>{const v=b.dataset.rcvis;if(v===RCV.vista)return;
  if(v!=="sem")RCV.ref=RCV.vista==="sem"?rcMais(RCV.sem||rcSeg(rcHoje()),3):(RCV.ref||rcHoje()); // mês/ano: o da semana que se estava a ver
  else{const r=RCV.ref||rcHoje(),h=rcHoje();RCV.sem=rcSeg(r.slice(0,7)===h.slice(0,7)||(RCV.vista==="ano"&&r.slice(0,4)===h.slice(0,4))?h:r)}
  RCV.vista=v;try{localStorage.setItem("rc_vista",v)}catch(e){}rcMapa()});
const rcIrSemana=d=>{RCV.sem=rcSeg(d);RCV.vista="sem";try{localStorage.setItem("rc_vista","sem")}catch(e){}rcMapa()};
function rcSemSala(nada){const sc=$("#rcGrid")&&$("#rcGrid").closest(".rc-scroll");if(!sc)return;sc.classList.toggle("rc-off",nada);
  let av=sc.querySelector(".rc-aviso");if(nada&&!av){av=document.createElement("div");av.className="rc-aviso";av.innerHTML=`<div><b>Por favor, selecione uma sala</b><span>Escolha acima o Auditório ou um dos Laboratórios para ver o calendário e reservar.</span></div>`;sc.appendChild(av)}
  if(av){av.hidden=!nada; // 0.9.86: no telemóvel a grelha desliza para o lado — o aviso acompanha a parte à vista
    const pos=()=>{av.style.left=sc.scrollLeft+"px";av.style.width=sc.clientWidth+"px";av.style.right="auto"};pos();if(!sc.dataset.avs){sc.dataset.avs=1;sc.addEventListener("scroll",()=>{const a=sc.querySelector(".rc-aviso");if(a&&!a.hidden){a.style.left=sc.scrollLeft+"px"}},{passive:true})}}}
/* ---------- RoomCheck 1.1: mapa do mês e do ano ---------- */
function rcMesAno(E,esps){const hoje=rcHoje(),A=rcAtivas(),ids=new Set(esps.map(e=>e.id)),R=A.filter(r=>ids.has(r.e)),ref=rcData(RCV.ref||(RCV.ref=rcHoje())),y=ref.getFullYear(),T=rcTempos();
  const porDia=new Map();R.forEach(r=>(porDia.get(r.d)||porDia.set(r.d,[]).get(r.d)).push(r));porDia.forEach(L=>L.sort((a,b)=>a.h0-b.h0||String(a.e).localeCompare(String(b.e))));
  $("#rcEsps").innerHTML=E.map(e=>`<button class="rc-chip${RCV.esp===e.id?" on":""}" data-rcesp="${esc(e.id)}" style="--c:${esc(e.c)}"><i></i>${esc(e.n)}</button>`).join("");
  const comSab=d0=>RC.cfg.sab||R.some(r=>r.d.slice(0,d0.length)===d0&&rcData(r.d).getDay()===6),nomeDia=["Seg","Ter","Qua","Qui","Sex","Sáb"];
  const um=esps.length===1,cor=um?esps[0].c:"var(--brand)";
  if(RCV.vista==="mes"){const m=ref.getMonth(),pre=rcIso(new Date(y,m,1)).slice(0,7),nd=comSab(pre)?6:5,ini=rcSeg(rcIso(new Date(y,m,1))),fimM=rcIso(new Date(y,m+1,0));
    $("#rcSem").textContent=new Date(y,m,1).toLocaleDateString("pt-PT",{month:"long",year:"numeric"});
    let h=`<div class="rc-mes" style="--nd:${nd}">${nomeDia.slice(0,nd).map(n=>`<div class="rc-cab"><b>${n}</b></div>`).join("")}`;
    for(let w=ini;w<=fimM;w=rcMais(w,7))for(let i=0;i<nd;i++){const d=rcMais(w,i),L=porDia.get(d)||[],max=L.length>4?3:4;
      h+=`<div class="rc-md${d.slice(0,7)!==pre?" fora":""}${d===hoje?" hoje":""}${d<hoje?" pas":""}" data-rcmd="${d}"><button class="rc-mdn" data-rcir="${d}" title="Ver a semana">${rcData(d).getDate()}</button>
        ${L.slice(0,max).map(r=>{const e=rcE(r.e);return `<button class="rc-mc" data-rcr="${esc(r.id)}" style="--c:${esc(e.c)}" title="${esc(e.n+" · "+rcHm(r.h0)+"–"+rcHm(r.h1)+" · "+r.p+(r.t?" · "+r.t:""))}"><b>${rcHm(r.h0)}</b><span>${um?"":esc(e.sg)+" · "}${esc(r.p)}</span></button>`}).join("")}
        ${L.length>max?`<button class="rc-mais" data-rcir="${d}">+${L.length-max} mais</button>`:""}</div>`}
    $("#rcGrid").innerHTML=h+`</div>`;
    const sem=Math.round((rcData(fimM)-rcData(ini))/864e5/7)+1,lv=rcLivre(30),mn=window.innerWidth<700?64:104;
    const rh=Math.floor((lv-30-sem*6)/sem);if(rh>mn){const g=$("#rcGrid .rc-mes");g.classList.add("fit");g.style.gridTemplateRows=`auto repeat(${sem},${rh}px)`}}
  else{const a0=ref.getMonth()>=8?y:y-1;$("#rcSem").textContent="Ano letivo "+a0+"/"+(a0+1);const tot=T.reduce((s,t)=>s+t[1]-t[0],0)*esps.length||1;
    let h=`<div class="rc-ano" style="--c:${esc(cor)}">`;
    for(let k=0;k<12;k++){const ym=new Date(a0,8+k,1),yy=ym.getFullYear(),m=ym.getMonth(),pre=rcIso(ym).slice(0,7),nd=comSab(pre)?6:5,ini=rcSeg(pre+"-01"),fimM=rcIso(new Date(yy,m+1,0));
      const nRes=R.filter(r=>r.d.slice(0,7)===pre).length;
      h+=`<div class="rc-am"><h4><button data-rcmes="${pre}-01">${ym.toLocaleDateString("pt-PT",{month:"long"})}${m===0?" "+yy:""}</button><span>${nRes?nRes+(nRes>1?" reservas":" reserva"):""}</span></h4><div class="rc-amg" style="--nd:${nd}">${nomeDia.slice(0,nd).map(n=>`<i>${n[0]}</i>`).join("")}`;
      for(let w=ini;w<=fimM;w=rcMais(w,7))for(let i=0;i<nd;i++){const d=rcMais(w,i);if(d.slice(0,7)!==pre){h+=`<span></span>`;continue}
        const L=porDia.get(d)||[];let oc=0;L.forEach(r=>T.forEach(t=>{oc+=Math.max(0,Math.min(r.h1,t[1])-Math.max(r.h0,t[0]))}));
        const f=oc/tot,lv=!L.length?0:f<.15?1:f<.4?2:f<.7?3:4;
        h+=`<button class="${lv?"l"+lv:""}${d<hoje?" pas":""}${d===hoje?" hoje":""}" data-rcir="${d}" title="${esc(rcDia(d,{weekday:"long",day:"numeric",month:"long"}))}${L.length?" · "+L.length+(L.length>1?" reservas":" reserva")+" · "+Math.round(f*100)+"% dos tempos ocupados":" · livre"}">${rcData(d).getDate()}</button>`}
      h+=`</div></div>`}
    $("#rcGrid").innerHTML=h+`</div><div class="rc-leg" style="--c:${esc(cor)}">Ocupação dos tempos letivos${um?"":" (todos os espaços)"}: <b></b> livre <b style="background:color-mix(in srgb,var(--c) 22%,#fff)"></b><b style="background:color-mix(in srgb,var(--c) 42%,#fff)"></b><b style="background:color-mix(in srgb,var(--c) 66%,#fff)"></b><b style="background:var(--c)"></b> cheio · clique num dia para ver a semana</div>`}
  const prox=A.filter(r=>r.d>=hoje).sort((a,b)=>a.d.localeCompare(b.d)||a.h0-b.h0).slice(0,10);
  $("#rcProx").innerHTML=prox.length?`<div class="rc-lista">${prox.map(r=>{const e=rcE(r.e);return `<div class="rc-it" style="--c:${esc(e.c)}"><i></i><div><b>${esc(e.n)}</b> · ${esc(rcDia(r.d))} · ${rcHm(r.h0)}–${rcHm(r.h1)}<br><span class="rc-mut">${esc(r.p)}${r.t?" · "+esc(r.t):""}${r.m?" · "+esc(r.m):""}${r.s?" · todas as semanas":""}</span></div><button class="b s" data-rcv="${esc(r.id)}">Ver</button></div>`}).join("")}</div>`:`<p class="hint" style="margin:0">Ainda não há reservas marcadas.</p>`;
  document.querySelectorAll("[data-rcesp]").forEach(b=>b.onclick=()=>{RCV.esp=b.dataset.rcesp;rcMapa()});
  document.querySelectorAll("#rcGrid [data-rcir]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();rcIrSemana(b.dataset.rcir)});
  document.querySelectorAll("#rcGrid [data-rcmes]").forEach(b=>b.onclick=()=>{RCV.ref=b.dataset.rcmes;RCV.vista="mes";try{localStorage.setItem("rc_vista","mes")}catch(e){}rcMapa()});
  document.querySelectorAll("#rcGrid [data-rcmd]").forEach(c=>c.onclick=ev=>{if(ev.target.closest("button"))return;const d=c.dataset.rcmd;if(d<hoje){toast("Não dá para reservar em dias que já passaram");return}rcNova({e:RCV.esp!=="todos"?RCV.esp:undefined,d,h0:T[0][0],h1:T[0][1]})});
  document.querySelectorAll("#rcMapa [data-rcr],#rcMapa [data-rcv]").forEach(b=>b.onclick=ev=>{ev.stopPropagation();rcVer(RC.res[b.dataset.rcr||b.dataset.rcv])})}
$("#rcNova").onclick=()=>rcNova({});

/* ---------- painel lateral ---------- */
function rcAbrir(t,html){$("#rcDwT").textContent=t;$("#rcDwC").innerHTML=html;$("#rcDw").hidden=false;setTimeout(()=>{const f=$("#rcDwC input,#rcDwC button");if(f)f.focus()},30)}
function rcFechar(){$("#rcDw").hidden=true}
$("#rcDwX").onclick=rcFechar;$("#rcDw").addEventListener("mousedown",e=>{if(e.target.id==="rcDw")rcFechar()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!$("#rcDw").hidden)rcFechar()});

/* 0.9.33: na reserva, "Reservado por" e "Turma" vêm dos dados da escola (formadores e turmas do ano letivo ativo);
   se o formador escolhido dá Tecnologias da Informação e Comunicação, o motivo fica "Tecnologias de Informação e Comunicação" */
const RC_TIC="Tecnologias de Informação e Comunicação";
function rcProfPorNome(n){n=String(n||"").trim().toLowerCase();return n?(cfg.profs||[]).find(p=>String(p.nome||"").trim().toLowerCase()===n)||null:null}
function rcEhTIC(prof){if(!prof)return false;const re=/tecnologias\s+d[ae]\s+informa|(^|\D)1400(\D|$)|\bTIC\b/i;
  try{const a=anoAtivo().id;if(pcPlanos().some(p=>p.anoId===a&&(p.linhas||[]).some(l=>l.f===prof.id&&re.test(l.disc||""))))return true}catch(e){}
  return re.test([prof.grupo,prof.area,prof.disc,prof.disciplina].filter(Boolean).join(" "))}
function rcTurmaTxt(t){try{return dsdTurmaTxt(t)}catch(e){return t.cod+(t.nome?" — "+t.nome:"")}}
function rcCamposHTML(sf,v){v=v||{};const P=(cfg.profs||[]).filter(p=>p.nome).slice().sort(cmpProf);
  let T=[];try{T=turmasDoAno().map(rcTurmaTxt)}catch(e){}
  const pIn=!v.p||P.some(p=>p.nome===v.p),tIn=!v.t||T.includes(v.t);
  return `<label>Reservado por<select id="rcPs${sf}"><option value="">— escolha o formador —</option>${P.map(p=>`<option value="${esc(p.nome)}"${p.nome===v.p?" selected":""}>${esc(p.cod?p.cod+" - "+p.nome:p.nome)}</option>`).join("")}<option value="__o"${pIn?"":" selected"}>Outro (serviço ou pessoa de fora)…</option></select></label>
    <input type="text" id="rcP${sf}" value="${esc(v.p||"")}" maxlength="80" placeholder="Nome do serviço ou da pessoa" ${pIn?"hidden":""}>
    <label><span>Turma <span class="rc-mut">(opcional)</span></span><select id="rcTs${sf}"><option value="">— sem turma —</option>${T.map(t=>`<option value="${esc(t)}"${t===v.t?" selected":""}>${esc(t)}</option>`).join("")}${tIn?"":`<option value="${esc(v.t)}" selected>${esc(v.t)}</option>`}</select></label>
    <input type="hidden" id="rcT${sf}" value="${esc(v.t||"")}">
    <label><span>Motivo <span class="rc-mut">(opcional)</span></span><input type="text" id="rcM${sf}" value="${esc(v.m||"")}" maxlength="200" placeholder="Ex.: aula prática, teste, reunião"></label>`}
function rcCamposLigar(sf){const ps=$("#rcPs"+sf),pi=$("#rcP"+sf),ts=$("#rcTs"+sf),ti=$("#rcT"+sf),mi=$("#rcM"+sf);let auto=mi.value===RC_TIC?RC_TIC:"";
  const motivo=()=>{const tic=rcEhTIC(rcProfPorNome(pi.value));if(tic&&(!mi.value.trim()||mi.value===auto)){mi.value=RC_TIC;auto=RC_TIC}else if(!tic&&auto&&mi.value===auto){mi.value="";auto=""}};
  ps.onchange=()=>{if(ps.value==="__o"){pi.hidden=false;if(rcProfPorNome(pi.value))pi.value="";pi.focus()}else{pi.hidden=true;pi.value=ps.value}motivo()};
  pi.oninput=motivo;ts.onchange=()=>{ti.value=ts.value};motivo()}
/* ---------- nova reserva ---------- */
function rcNova(o){const hoje=rcHoje(),E=RC.esp.filter(e=>e.on);const e=(o.e&&o.e!=="\u0000"?o.e:"")||RCV.esp||(E[0]||{}).id;
  const d=o.d&&o.d>=hoje?o.d:((RCV.sem||hoje)>hoje?RCV.sem:hoje);const h0=Number.isFinite(o.h0)?o.h0:600,h1=Number.isFinite(o.h1)?o.h1:Math.min(1439,h0+90);
  const profs=(cfg.profs||[]).map(p=>p.nome).filter(Boolean),turmas=(()=>{let L=[];try{L=turmasDoAno().map(t=>t.cod+(t.nome?" — "+t.nome:""))}catch(_){}if(!L.length)L=[...new Set((cfg.mods||[]).map(m=>m.turma).filter(Boolean))].sort((a,b)=>COLL_PT.compare(a,b));return L})();
  const temMail=!!(msCfg()&&msCfg().clientId);
  rcAbrir("Nova reserva",`<div class="rc-f">
    <span class="rc-l">Espaço</span><div class="rc-ops">${E.map(x=>`<label class="rc-op" style="--c:${esc(x.c)}"><input type="radio" name="rcE" value="${esc(x.id)}" ${x.id===e?"checked":""}><i></i>${esc(x.n)}</label>`).join("")}</div>
    <div class="rc-3c"><label>Dia<input type="date" id="rcD" value="${d}" min="${hoje}"></label><label>Das<input type="time" id="rcH0" value="${rcHm(h0)}" step="300"></label><label>Às<input type="time" id="rcH1" value="${rcHm(h1)}" step="300"></label></div>
    <div class="rc-tps"><span class="rc-mut">Tempos:</span>${rcTempos().map((t,i)=>`<button class="b s" data-rctp="${i}" title="${rcHm(t[0])}–${rcHm(t[1])}">${rcHm(t[0])}</button>`).join("")}</div>
    <div class="rc-dur"><span class="rc-mut">Duração:</span>${[45,50,90,100,180].map(m=>`<button class="b s" data-rcdur="${m}">${Math.floor(m/60)}h${rcPad(m%60)}</button>`).join("")}</div>
    <div id="rcLivre" class="rc-livre" aria-live="polite"></div>
    ${rcCamposHTML("",{p:(()=>{try{const me=dsdEu();return me?me.nome:""}catch(e){return""}})()})}
    <label class="rc-chk"><input type="checkbox" id="rcRep"> Repetir todas as semanas, no mesmo dia e hora</label>
    <div id="rcRepW" hidden><label>Até<input type="date" id="rcAte" min="${rcMais(d,7)}" value="${rcMais(d,56)}"></label><p class="hint" style="margin:4px 0 0">No máximo 60 semanas. Os dias já ocupados ficam de fora e a EPISJ 360 diz quais.</p></div>
    ${temMail?`<label class="rc-chk"><input type="checkbox" id="rcMail"> Enviar confirmação por email ao formador (Office 365)</label>`:""}
    <div class="row" style="margin-top:6px"><button class="b" id="rcOk">Reservar</button><button class="b s" id="rcX">Cancelar</button></div>
    <div id="rcRes"></div></div>`);
  const val=()=>({e:(document.querySelector('input[name="rcE"]:checked')||{}).value,d:$("#rcD").value,h0:rcMin($("#rcH0").value),h1:rcMin($("#rcH1").value)});
  const livre=()=>{const x=val(),el=$("#rcLivre");if(!x.d||!Number.isFinite(x.h0)||!Number.isFinite(x.h1)){el.className="rc-livre";el.textContent="";return}
    if(x.h1<=x.h0){el.className="rc-livre mau";el.textContent="A hora de fim tem de ser depois da hora de início.";return}
    const c=rcChoque(x.e,x.d,x.h0,x.h1);el.className="rc-livre "+(c?"mau":"bom");el.textContent=c?`Ocupado: ${c.p} das ${rcHm(c.h0)} às ${rcHm(c.h1)}.`:`✓ ${rcE(x.e).n} livre nesse horário.`};
  const TT=rcTempos(),tpUI=()=>{const a=rcMin($("#rcH0").value),b=rcMin($("#rcH1").value);document.querySelectorAll("[data-rctp]").forEach(x=>{const t=TT[+x.dataset.rctp];x.classList.toggle("on",t[0]>=a&&t[1]<=b)})};
  document.querySelectorAll("[data-rctp]").forEach(x=>x.onclick=()=>{const i=+x.dataset.rctp,j=TT.findIndex(t=>t[0]===rcMin($("#rcH0").value));
    if(j>=0&&i>j&&TT[i][1]>rcMin($("#rcH1").value))$("#rcH1").value=rcHm(TT[i][1]); // outro tempo a seguir: junta até lá
    else{$("#rcH0").value=rcHm(TT[i][0]);$("#rcH1").value=rcHm(TT[i][1])}livre();tpUI()});
  document.querySelectorAll("#rcDwC input").forEach(i=>i.addEventListener("input",()=>{livre();tpUI()}));document.querySelectorAll('#rcDwC input[type=radio]').forEach(i=>i.addEventListener("change",livre));livre();tpUI();
  document.querySelectorAll("[data-rcdur]").forEach(b=>b.onclick=()=>{const h=rcMin($("#rcH0").value);if(Number.isFinite(h)){$("#rcH1").value=rcHm(Math.min(1439,h+ +b.dataset.rcdur));livre();tpUI()}});
  $("#rcRep").onchange=ev=>{$("#rcRepW").hidden=!ev.target.checked};
  $("#rcD").addEventListener("change",()=>{const v=$("#rcD").value;if(v){$("#rcAte").min=rcMais(v,7);if($("#rcAte").value<=v)$("#rcAte").value=rcMais(v,56)}});
  $("#rcX").onclick=rcFechar;rcCamposLigar("");
  $("#rcOk").onclick=async()=>{const x=val(),p=$("#rcP").value.trim();
    if(!x.e)return toast("Escolha o espaço");if(!x.d||x.d<hoje)return toast("Escolha um dia a partir de hoje");
    if(!Number.isFinite(x.h0)||!Number.isFinite(x.h1)||x.h1<=x.h0)return toast("Verifique as horas");if(!p)return toast("Indique quem reserva");
    const dias=[x.d];if($("#rcRep").checked){const ate=$("#rcAte").value;if(!ate||ate<=x.d)return toast("Escolha até quando se repete");let k=rcMais(x.d,7);while(k<=ate&&dias.length<60){dias.push(k);k=rcMais(k,7)}}
    const b=$("#rcOk");b.disabled=true;await rcTrazer(false); /* traz primeiro o que foi reservado noutros computadores */
    const s=dias.length>1?uid()+uid():"",ok=[],oc=[],u=Date.now(),pf=(cfg.profs||[]).find(q=>q.nome===p);
    for(const d of dias){const c=rcChoque(x.e,d,x.h0,x.h1);if(c){oc.push({d,c});continue}
      const id=uid()+uid();RC.res[id]={id,e:x.e,d,h0:x.h0,h1:x.h1,p,pid:pf?pf.id:"",t:$("#rcT").value.trim(),m:$("#rcM").value.trim(),s,u,c:u};ok.push(d)}
    if(ok.length){rcGravar();RCV.sem=rcSeg(x.d);rcRender(curTab)}
    const mail=$("#rcMail")&&$("#rcMail").checked;
    if(ok.length&&mail){if(!pf||!pf.email)toast("Sem email deste formador em Formadores — confirmação não enviada");
      else try{const e=rcE(x.e);await msEnviar({to:pf.email,cc:msCfg().cc||"",subject:`Reserva confirmada: ${e.n} — ${rcDia(ok[0],{day:"numeric",month:"long"})}${ok.length>1?" (e mais "+(ok.length-1)+")":""}`,
        body:`Olá,\n\nFicou reservado o ${e.n}, das ${rcHm(x.h0)} às ${rcHm(x.h1)}:\n\n${ok.map(d=>"• "+rcDia(d)).join("\n")}\n${$("#rcT").value.trim()?"\nTurma: "+$("#rcT").value.trim():""}${$("#rcM").value.trim()?"\nMotivo: "+$("#rcM").value.trim():""}\n\nEscola Profissional da Ilha de São Jorge`});toast("Confirmação enviada para "+pf.email)}
      catch(er){toast("Reserva feita, mas o email não saiu: "+(er.message||er))}}
    if(ok.length&&!oc.length){rcFechar();if(!mail)toast(ok.length>1?ok.length+" reservas feitas":"Reserva feita · "+rcE(x.e).n+" · "+rcHm(x.h0)+"–"+rcHm(x.h1));return}
    b.disabled=!!ok.length;if(ok.length)b.textContent="Feito";
    $("#rcRes").innerHTML=`<div class="rc-livre ${ok.length?"":"mau"}">${ok.length?`✓ ${ok.length} ${ok.length>1?"reservas feitas":"reserva feita"}. `:""}<b>${oc.length>1?"Estes dias ficaram de fora":"Este dia ficou de fora"}:</b><ul>${oc.map(o=>`<li>${esc(rcDia(o.d,{weekday:"short",day:"numeric",month:"short"}))} — ocupado por ${esc(o.c.p)} (${rcHm(o.c.h0)}–${rcHm(o.c.h1)})</li>`).join("")}</ul></div>`}}

/* ---------- ver / alterar / cancelar ---------- */
function rcVer(r){if(!r)return;const e=rcE(r.e),hoje=rcHoje(),serie=r.s?rcAtivas().filter(x=>x.s===r.s&&x.d>=hoje).length:0;
  rcAbrir(e.n,`<div class="rc-f"><div class="rc-ver" style="--c:${esc(e.c)}"><b>${esc(rcDia(r.d))}</b><span>${rcHm(r.h0)}–${rcHm(r.h1)}</span></div>
    <dl class="rc-dl"><dt>Reservado por</dt><dd>${esc(r.p)}</dd>${r.t?`<dt>Turma</dt><dd>${esc(r.t)}</dd>`:""}${r.m?`<dt>Motivo</dt><dd>${esc(r.m)}</dd>`:""}${r.s?`<dt>Repetição</dt><dd>Todas as semanas (${serie} por vir)</dd>`:""}<dt>Marcada em</dt><dd>${esc(new Date(r.c||r.u).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}</dd></dl>
    <div class="row" style="margin-top:8px"><button class="b s" id="rcMud">Mudar hora ou espaço</button><button class="b rc-del" id="rcC1">Cancelar esta reserva</button>${serie>1?`<button class="b s" id="rcCs">Cancelar toda a série</button>`:""}</div></div>`);
  const canc=serie=>{if(!confirm(serie?"Cancelar todas as reservas desta série, de hoje em diante?":"Cancelar esta reserva?"))return;const u=Date.now();let n=0;
    rcAtivas().forEach(x=>{if(serie?(x.s===r.s&&x.d>=hoje):x.id===r.id){RC.res[x.id]={...x,x:1,u};n++}});rcGravar();rcFechar();rcRender(curTab);toast(n>1?n+" reservas canceladas":"Reserva cancelada")};
  $("#rcC1").onclick=()=>canc(false);if($("#rcCs"))$("#rcCs").onclick=()=>canc(true);
  $("#rcMud").onclick=()=>{const E=RC.esp.filter(x=>x.on||x.id===r.e);
    rcAbrir("Mudar reserva",`<div class="rc-f"><span class="rc-l">Espaço</span><div class="rc-ops">${E.map(x=>`<label class="rc-op" style="--c:${esc(x.c)}"><input type="radio" name="rcE2" value="${esc(x.id)}" ${x.id===r.e?"checked":""}><i></i>${esc(x.n)}</label>`).join("")}</div>
      <div class="rc-3c"><label>Dia<input type="date" id="rcD2" value="${r.d}"></label><label>Das<input type="time" id="rcA2" value="${rcHm(r.h0)}" step="300"></label><label>Às<input type="time" id="rcB2" value="${rcHm(r.h1)}" step="300"></label></div>
      ${rcCamposHTML("2",{p:r.p,t:r.t,m:r.m})}
      <div class="row"><button class="b" id="rcG2">Guardar</button><button class="b s" id="rcX2">Voltar</button></div></div>`);
    $("#rcX2").onclick=()=>rcVer(RC.res[r.id]);rcCamposLigar("2");
    $("#rcG2").onclick=async()=>{const e2=(document.querySelector('input[name="rcE2"]:checked')||{}).value,d=$("#rcD2").value,h0=rcMin($("#rcA2").value),h1=rcMin($("#rcB2").value),p=$("#rcP2").value.trim();
      if(!d||!Number.isFinite(h0)||!Number.isFinite(h1)||h1<=h0)return toast("Verifique o dia e as horas");if(!p)return toast("Indique quem reserva");
      await rcTrazer(false);const c=rcChoque(e2,d,h0,h1,r.id);if(c)return toast(`Ocupado: ${c.p} das ${rcHm(c.h0)} às ${rcHm(c.h1)}`);
      RC.res[r.id]={...RC.res[r.id],e:e2,d,h0,h1,p,t:$("#rcT2").value.trim(),m:$("#rcM2").value.trim(),u:Date.now()};rcGravar();rcFechar();rcRender(curTab);toast("Reserva alterada")}}}

/* ---------- lista, PDF e CSV ---------- */
function rcFiltradas(){const e=$("#rcFE").value,de=$("#rcFDe").value,ate=$("#rcFAte").value,q=$("#rcFQ").value.trim().toLowerCase();
  return rcAtivas().filter(r=>(!e||r.e===e)&&(!de||r.d>=de)&&(!ate||r.d<=ate)&&(!q||[r.p,r.t,r.m].join(" ").toLowerCase().includes(q))).sort((a,b)=>a.d.localeCompare(b.d)||a.h0-b.h0||a.e.localeCompare(b.e))}
function rcLista(){const s=$("#rcFE"),v=s.value;s.innerHTML=`<option value="">Todos</option>`+RC.esp.map(e=>`<option value="${esc(e.id)}">${esc(e.n)}</option>`).join("");s.value=v;
  if(!$("#rcFDe").dataset.ini){$("#rcFDe").value=rcHoje();$("#rcFDe").dataset.ini=1}
  const L=rcFiltradas(),N=window.__rclN||200; // 0.9.48: com muitas reservas, mostra 200 de cada vez
  $("#rcTab").innerHTML=L.length?`<table class="rc-t"><thead><tr><th>Dia</th><th>Horas</th><th>Espaço</th><th>Reservado por</th><th>Turma</th><th>Motivo</th><th></th></tr></thead><tbody>${L.slice(0,N).map(r=>{const e=rcE(r.e);return `<tr><td>${esc(rcDia(r.d,{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}))}</td><td>${rcHm(r.h0)}–${rcHm(r.h1)}</td><td><span class="rc-pt" style="--c:${esc(e.c)}"></span>${esc(e.n)}</td><td>${esc(r.p)}</td><td>${esc(r.t||"")}</td><td>${esc(r.m||"")}</td><td><button class="b s" data-rcv="${esc(r.id)}">Ver</button></td></tr>`}).join("")}</tbody></table><p class="hint">${L.length} reserva(s)${L.length>N?` — a mostrar ${N}. <button class="b s" id="rcMais">Mostrar mais ${Math.min(300,L.length-N)}</button>`:"."}</p>`
    :`<p class="hint">Nenhuma reserva com estes filtros.</p>`;
  document.querySelectorAll("#rcTab [data-rcv]").forEach(b=>b.onclick=()=>rcVer(RC.res[b.dataset.rcv]));
  const mm=$("#rcMais");if(mm)mm.onclick=()=>{window.__rclN=N+300;rcLista()}}
["#rcFE","#rcFDe","#rcFAte"].forEach(s=>$(s).addEventListener("change",()=>{window.__rclN=200;rcLista()}));$("#rcFQ").addEventListener("input",debounce(()=>{window.__rclN=200;rcLista()},200));
$("#rcCsv").onclick=()=>{const L=rcFiltradas(),q=v=>'"'+String(v??"").replace(/"/g,'""')+'"';
  download("reservas-"+rcHoje()+".csv","﻿"+[["Dia","Início","Fim","Espaço","Reservado por","Turma","Motivo"].map(q).join(";")].concat(L.map(r=>[r.d,rcHm(r.h0),rcHm(r.h1),rcE(r.e).n,r.p,r.t,r.m].map(q).join(";"))).join("\r\n"),"text/csv;charset=utf-8")};
$("#rcPdf").onclick=async()=>{try{const J=await loadPDF(),doc=new J({orientation:"landscape"}),L=rcFiltradas();
    doc.setFontSize(15);doc.text("Reservas de espaços — Escola Profissional da Ilha de São Jorge",14,16);doc.setFontSize(10);
    doc.text(`EPISJ 360 · Sala360 · ${$("#rcFE").value?rcE($("#rcFE").value).n:"todos os espaços"}${$("#rcFDe").value?" · de "+dataPT($("#rcFDe").value):""}${$("#rcFAte").value?" até "+dataPT($("#rcFAte").value):""} · emitido em ${new Date().toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})}`,14,23);
    doc.autoTable({startY:28,head:[["Dia","Horas","Espaço","Reservado por","Turma","Motivo"]],body:L.map(r=>[rcDia(r.d,{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}),rcHm(r.h0)+"–"+rcHm(r.h1),rcE(r.e).n,r.p,r.t||"",r.m||""]),theme:"grid",styles:{fontSize:9},headStyles:{fillColor:[22,50,105]}});
    doc.save("reservas-"+rcHoje()+".pdf")}catch(e){toast("Não foi possível criar o PDF: "+(e.message||e))}};

/* ---------- espaços ---------- */
function rcEspMudou(){RC.et=Date.now();rcGravar();rcEspacos()}
function rcEspacos(){$("#rcEspTab").innerHTML=`<table class="rc-t"><thead><tr><th>Cor</th><th>Nome</th><th>Sigla</th><th>Reservável</th><th></th></tr></thead><tbody>${RC.esp.map((e,i)=>`<tr data-i="${i}"><td><input type="color" data-k="c" value="${esc(e.c)}"></td><td><input type="text" data-k="n" value="${esc(e.n)}" maxlength="60"></td><td style="width:110px"><input type="text" data-k="sg" value="${esc(e.sg)}" maxlength="5"></td><td style="width:100px"><input type="checkbox" data-k="on" ${e.on?"checked":""}></td><td style="width:60px">${rcAtivas().some(r=>r.e===e.id)?"":`<button class="b s" data-rcdel="${i}" title="Apagar">✕</button>`}</td></tr>`).join("")}</tbody></table>`;
  $("#rcAbre").value=rcHm(RC.cfg.abre);$("#rcFecha").value=rcHm(RC.cfg.fecha);$("#rcSab").checked=!!RC.cfg.sab;
  if(document.activeElement!==$("#rcTempos"))$("#rcTempos").value=rcTempos().map(t=>rcHm(t[0])+"-"+rcHm(t[1])).join("\n")}
$("#rcEspTab").addEventListener("change",ev=>{const i=ev.target.closest("tr")?.dataset.i,k=ev.target.dataset.k;if(i==null||!k)return;const e=RC.esp[+i];
  if(k==="on")e.on=ev.target.checked?1:0;else{const v=ev.target.value.trim();if(!v&&k!=="c"){rcEspacos();return}e[k]=v}rcEspMudou()});
$("#rcEspTab").addEventListener("click",ev=>{const b=ev.target.closest("[data-rcdel]");if(!b)return;const e=RC.esp[+b.dataset.rcdel];if(confirm(`Apagar o espaço “${e.n}”?`)){RC.esp.splice(+b.dataset.rcdel,1);rcEspMudou()}});
$("#rcEspAdd").onclick=()=>{RC.esp.push({id:"e"+uid(),n:"Novo espaço",sg:"NE",c:"#2f9e57",on:1});rcEspMudou()};
[["#rcAbre","abre"],["#rcFecha","fecha"]].forEach(([s,k])=>$(s).addEventListener("change",ev=>{const m=rcMin(ev.target.value);if(Number.isFinite(m)){RC.cfg[k]=m;if(RC.cfg.fecha<=RC.cfg.abre+60)RC.cfg.fecha=Math.min(1440,RC.cfg.abre+60);rcEspMudou()}}));
$("#rcSab").addEventListener("change",ev=>{RC.cfg.sab=ev.target.checked;rcEspMudou()});
$("#rcTempos").addEventListener("change",ev=>{const T=[],mal=[];ev.target.value.split(/\n/).map(l=>l.trim()).filter(Boolean).forEach(l=>{const m=l.match(/(\d{1,2})[:h.](\d{2})\s*[-–a]+\s*(\d{1,2})[:h.](\d{2})/);if(!m){mal.push(l);return}
    const a=+m[1]*60+ +m[2],b=+m[3]*60+ +m[4];if(b>a)T.push([a,b]);else mal.push(l)});
  if(!T.length){toast("Não percebi nenhum tempo — use o formato 08:30-09:20");return}
  RC.cfg.tempos=T.sort((a,b)=>a[0]-b[0]);rcEspMudou();toast(T.length+" tempos guardados"+(mal.length?` · ${mal.length} linha(s) não percebida(s)`:""))});
$("#rcTemposRepor").onclick=()=>{delete RC.cfg.tempos;rcEspMudou();toast("Repostos os tempos da escola")};
$("#rcTemposES").onclick=()=>{const st=mhEstado(),T=(st&&st.periods||[]).map(p=>[rcMin(p.start),rcMin(p.end)]).filter(t=>Number.isFinite(t[0])&&Number.isFinite(t[1])&&t[1]>t[0]);
  if(!T.length){toast("O horário do Horários360 deste ano letivo ainda não tem tempos com horas");return}RC.cfg.tempos=T;rcEspMudou();toast(T.length+" tempos copiados do Horários360")};
// abre logo com a última análise guardada, sem voltar a ler a Box
const pronto=(async()=>{try{await migrarListagem;let root="";try{root=localStorage.getItem("box_last_root")||""}catch(e){}
  if(root){const j=await lerListagem(root);if(j){useListing(j,true);showLast();boxMsg(`Aberta a análise guardada de “${j.pasta}” (${j.quando}): ${files.length} ficheiros e ${folders.length} pastas.`,"ok")}}
  await carregarRef()}catch(e){console.warn(e)}})();
textosProntos.then(()=>{if(curTab==="rel")renderReport();if(curTab==="alt")renderAlt()});

