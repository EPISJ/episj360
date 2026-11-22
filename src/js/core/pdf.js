/* ---------- logótipos dos documentos (Definições) ---------- */
const LG_SLOTS=[{k:"main",t:"Logotipo Principal",d:"Canto superior esquerdo de todos os documentos e no topo do menu lateral."},
  {k:"right",t:"Canto Superior Direito",opt:1,d:"Por exemplo, o logótipo do agrupamento, da Secretaria Regional ou de um programa (Erasmus+, Eco-Escolas)."},
  {k:"foot",t:"Centrado no Rodapé",opt:1,ano:1,d:"Os logótipos de financiamento ou de parceiros: aparecem na barra ao fundo da app e no rodapé de cada documento. São de cada ano letivo — mude o ano no topo para escolher os de outro ano."}];
/* EPISJ 360 0.9.7: o logótipo do rodapé é de cada ano letivo (LOGOS.anos[id].foot) */
const LG_FUNDOS_PADRAO={ini:2026,src:"img/fundos-2026-2027.png"}; // Açores 2030 · Governo dos Açores · Portugal 2030 · UE (para 2026/2027, até ser mudado nas Definições)
function lgAnoId(){try{return anoAtivo().id}catch(e){return""}}
// 0.9.19: a barra de baixo mostra os logótipos do ano ativo; se esse ano ainda não tiver, usa os do ano mais recente que tiver (só um "Remover" explícito a esconde)
function lgFootBarra(){const f=lgGet("foot");if(f||f===null)return f;const A=(LOGOS.anos||{}),ini=(anoAtivo()||{}).ini||9999;
  const anos=escData().anos.filter(a=>A[a.id]&&A[a.id].foot).sort((a,b)=>(b.ini<=ini)-(a.ini<=ini)||b.ini-a.ini);return anos.length?A[anos[0].id].foot:undefined}
function lgGet(k){const P=(typeof RO!=="undefined"&&RO&&typeof PUB!=="undefined"&&PUB&&PUB.logos)||null; // 0.9.217: formadores e formandos usam os logótipos publicados pela Direção
  if(k!=="foot")return LOGOS[k]||(P&&P[k])||undefined;const a=LOGOS.anos&&LOGOS.anos[lgAnoId()];if(a&&a.foot!==undefined)return a.foot;return P&&P.foot||undefined}
function lgSet(k,v){if(k!=="foot"){if(v)LOGOS[k]=v;else delete LOGOS[k];return}const id=lgAnoId();if(!id)return;LOGOS.anos=LOGOS.anos||{};const a=LOGOS.anos[id]=LOGOS.anos[id]||{};if(v)a.foot=v;else{a.foot=null}}
/* 0.9.140: o logótipo do rodapé também pode ser de cada n.º de projeto (código FSE da turma): LOGOS.proj[código].foot.
   Nos documentos de uma turma (ou de uma prova, de um dossier) usa-se o do projeto; se não houver, o do ano letivo. */
function lgProjK(fse){return String(fse||"").trim().toUpperCase().replace(/\s+/g,"").replace(/[\u2010-\u2015]/g,"-")}
function lgProj(fse){const k=lgProjK(fse);if(!k)return undefined;const o=LOGOS.proj&&LOGOS.proj[k];return o?o.foot:undefined}
function lgProjSet(fse,v){const k=lgProjK(fse);if(!k)return;LOGOS.proj=LOGOS.proj||{};if(v)LOGOS.proj[k]={foot:v};else LOGOS.proj[k]={foot:null}}
// marca o n.º de projeto das páginas a partir da página atual (documentos com várias turmas)
function pdfProjDesde(doc,fse){(doc.__fsePg=doc.__fsePg||{})[doc.getNumberOfPages()]=String(fse||"")}
function pdfProjPag(doc,i,fse){if(typeof fse==="function")return fse(i);if(fse)return fse;const M=doc.__fsePg;if(!M)return "";let r="",b=0;for(const k in M)if(+k<=i&&+k>=b){b=+k;r=M[k]}return r}
let LG_MIG=null;function lgMigrar(){if(!LG_MIG)LG_MIG=lgMigrar0().finally(()=>{LG_MIG=null});return LG_MIG}
async function lgMigrar0(){try{if(LOGOS.anos&&LOGOS.anos.__ok)return;LOGOS.anos=LOGOS.anos||{};const id=lgAnoId();if(!id)return;
  if(LOGOS.foot){if(LOGOS.anos[id]===undefined)LOGOS.anos[id]={foot:LOGOS.foot};delete LOGOS.foot}
  // os logótipos de 2026/2027 entram já no ano letivo de 2026/2027
  const a=escData().anos.find(x=>x.ini===LG_FUNDOS_PADRAO.ini);
  if(a&&LOGOS.anos[a.id]===undefined){const r=await fetch(LG_FUNDOS_PADRAO.src);const b=await r.blob();const src=await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(b)});
    const im=new Image();await new Promise(ok=>{im.onload=ok;im.onerror=ok;im.src=src});LOGOS.anos[a.id]={foot:{src,w:im.naturalWidth||691,h:im.naturalHeight||79,nome:"fundos-2026-2027.png"}}}
  LOGOS.anos.__ok=1;try{localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}catch(e){}aplicarLogos();if(typeof renderDef==="function"&&document.querySelector("#lgSlots"))renderDef()}catch(e){console.warn("logótipos",e)}}
function lgNavW(){const n=document.querySelector("nav.side");if(n){const w=Math.round(n.getBoundingClientRect().right),R=document.documentElement.style;R.setProperty("--navw",w+"px");if(w>0)R.setProperty("--navwe",w+"px")}} // 0.9.69: --navwe guarda a largura do menu para alinhar os logótipos no Horários360
addEventListener("resize",lgNavW);function topH(){const t=document.querySelector(".top");if(t)document.documentElement.style.setProperty("--toph",Math.round(t.getBoundingClientRect().bottom)+"px")}addEventListener("resize",topH);setTimeout(topH,0);setTimeout(topH,1500);try{new ResizeObserver(lgNavW).observe(document.querySelector("nav.side"))}catch(e){}
const IC_UP=`<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4"/></svg>`;
const IC_DEL=`<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14M10 11v6M14 11v6"/></svg>`;
const IC_IMG=`<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>`;
let lgAlvo="main";
function guardarLogos(){LOGOS.t=Date.now();try{localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}catch(e){toast("Não foi possível guardar a imagem neste navegador (é grande demais?)")}marcarCfg();aplicarLogos();renderDef();lgEnviarJa()}
/* 0.9.62: os logótipos não se perdem entre separadores e computadores — cada gravação leva a hora (LOGOS.t);
   da nuvem só se aceita uma versão mais recente; a mais antiga junta-se sem tirar nada e a nossa volta a ser enviada */
function lgDoNavegador(){try{const v=JSON.parse(localStorage.getItem(LGKEY)||"null");if(v&&typeof v==="object"&&(v.t||0)>(LOGOS.t||0)){LOGOS=v;aplicarLogos()}}catch(e){}}
function lgJuntar(n){lgDoNavegador();const tn=+n.t||0,tl=+LOGOS.t||0;if(JSON.stringify(n)===JSON.stringify(LOGOS))return false;
  if(tn>tl){LOGOS=n}else{const j=Object.assign({},n,LOGOS);if(n.anos||LOGOS.anos){j.anos=Object.assign({},n.anos||{},LOGOS.anos||{});for(const k in j.anos)if(n.anos&&LOGOS.anos&&n.anos[k]&&LOGOS.anos[k]&&typeof n.anos[k]==="object")j.anos[k]=Object.assign({},n.anos[k],LOGOS.anos[k])}
    if(n.proj||LOGOS.proj)j.proj=Object.assign({},n.proj||{},LOGOS.proj||{});
    j.t=tl||Date.now();LOGOS=j;setTimeout(()=>{try{localStorage.setItem("boxcheck_cfg_t",String(Date.now()))}catch(e){}lgEnviarJa()},0)}
  try{localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}catch(e){}aplicarLogos();lgMigrar();try{if(document.querySelector("#lgSlots"))renderDef()}catch(e){}return true}
function lgEnviarJa(){try{if(nuvDesl()||!NUVOK())return;clearTimeout(nuvH);nuvH=setTimeout(()=>{if(NUV.ocupado){lgEnviarJa();return}nuvemPut("estado",estadoAtual(),cfgT()||Date.now())},1200)}catch(e){}}
addEventListener("storage",e=>{if(e.key===LGKEY)lgDoNavegador();if(e.key===LGKEY&&document.querySelector("#lgSlots"))try{renderDef()}catch(x){}});
function aplicarLogos(){const m=LOGOS.main;
  {const fb=document.querySelector("#fundos");let f;try{f=lgFootBarra()}catch(e){f=lgGet("foot")}if(fb){const im=fb.querySelector("img");if(f){if(im.getAttribute("src")!==f.src)im.src=f.src;im.hidden=false}else{im.hidden=true;im.removeAttribute("src")}fb.hidden=false;document.body.classList.add("temfundos");lgNavW()}
   const gf=document.querySelector("#gFundos");if(gf){const gi=gf.querySelector("img");if(f){if(gi.getAttribute("src")!==f.src)gi.src=f.src;gf.hidden=false}else{gf.hidden=true;gi.removeAttribute("src")}}}
  const top=document.querySelector(".sfoot"),ti=top&&top.querySelector("img"),gi=document.querySelector(".gschl");
  if(ti){if(!ti.dataset.orig)ti.dataset.orig=ti.src;ti.src=m?m.src:ti.dataset.orig;top.classList.toggle("wbg",!!(m&&m.bg));if(m)top.style.display=""}
  if(gi){if(!gi.dataset.orig)gi.dataset.orig=gi.src;gi.src=m?m.src:gi.dataset.orig;if(m)gi.style.display=""}}
function lerImagem(file){return new Promise((ok,ko)=>{
  const svg=/svg/.test(file.type)||/\.svg$/i.test(file.name),jpg=/jpe?g/.test(file.type)||/\.jpe?g$/i.test(file.name);
  if(!svg&&!jpg&&!/png/.test(file.type)&&!/\.png$/i.test(file.name))return ko(new Error("Use uma imagem PNG, JPG ou SVG."));
  const fr=new FileReader();fr.onerror=()=>ko(new Error("Não foi possível ler o ficheiro."));
  fr.onload=()=>{const img=new Image();img.onerror=()=>ko(new Error("Não foi possível ler a imagem."));
    img.onload=()=>{let w=img.naturalWidth||600,h=img.naturalHeight||300;const max=svg?1400:1000,r=svg?max/Math.max(w,h):Math.min(1,max/Math.max(w,h));
      w=Math.max(1,Math.round(w*r));h=Math.max(1,Math.round(h*r));const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");
      if(jpg){x.fillStyle="#fff";x.fillRect(0,0,w,h)}x.drawImage(img,0,0,w,h);
      ok({src:c.toDataURL(jpg?"image/jpeg":"image/png",.9),w,h,nome:file.name})};
    img.src=fr.result};fr.readAsDataURL(file)})}
async function porLogo(k,file){try{const L=await lerImagem(file);if(k.startsWith("proj:")){lgProjSet(k.slice(5),L);guardarLogos();toast("Logótipo do rodapé guardado para o projeto "+k.slice(5));return}if(k==="main"&&LOGOS.main)L.bg=LOGOS.main.bg;lgSet(k,L);guardarLogos();toast(k==="foot"?"Logótipos guardados para "+(anoAtivo()||{}).nome:"Logótipo guardado")}catch(e){toast(e.message)}}
function renderDef(){
  $("#lgSlots").innerHTML=LG_SLOTS.map(S=>{const L=lgGet(S.k);
    return `<div class="lgslot${S.k==="main"?" main":""}" data-lg="${S.k}">
      <div class="lgbox${L?"":" vazio"}" data-lgpick title="Escolher imagem">${L?`<img src="${L.src}" alt="">`:`${IC_IMG}Escolher`}</div>
      <div class="grow"><h4>${S.t}${S.ano?`<span class="opt" style="background:#eaf6ee;color:#2f9e57">ano letivo ${esc((anoAtivo()||{}).nome||"")}</span>`:S.opt?`<span class="opt">opcional</span>`:""}</h4><p>${S.d}</p>
      <div class="row">${L?`<button class="b${S.k==="main"?"":" s"}" data-lgpick>${IC_UP}Substituir</button><button class="b rm" data-lgdel>${IC_DEL}Remover</button>`:`<button class="b s" data-lgpick>${IC_UP}Escolher Imagem</button>`}</div>
      ${S.k==="foot"?lgProjHTML():""}
      ${S.k==="main"&&L?`<label class="chip" style="margin-top:10px;display:inline-flex;border:0;background:none;padding:0;font-weight:600"><input type="checkbox" data-lgbg ${L.bg?"checked":""}> Fundo branco (para logótipos escuros no modo escuro)</label>`:""}</div></div>`}).join("");
  const im=(k,ph)=>lgGet(k)?`<img src="${lgGet(k).src}" alt="">`:(ph?`<span class="lgph">${ph}</span>`:"");
  $("#lgPvMain").innerHTML=im("main","LOGO");$("#lgPvRight").innerHTML=im("right","OPCIONAL");$("#lgPvFoot").innerHTML=im("foot","OPCIONAL");
  const c=msCfg();$("#msClient").value=c.clientId||"";$("#msTenant").value=c.tenant||"";$("#msCc").value=c.cc||"";$("#msLista").checked=!!c.lista;$("#msRedir").textContent=MS_REDIR;
  msUI(true)}
function lgProjHTML(){let T=[];try{T=escData().turmas||[]}catch(e){}const G=new Map();
  for(const t of T){const k=lgProjK(t.fse);if(!k)continue;if(!G.has(k))G.set(k,[]);G.get(k).push(t.cod)}
  for(const k in LOGOS.proj||{})if(LOGOS.proj[k]&&LOGOS.proj[k].foot&&!G.has(k))G.set(k,[]);
  const ks=[...G.keys()].sort();
  if(!ks.length)return `<div class="lgproj"><h5>Por n.º de projeto</h5><p class="hint" style="margin:0">Quando as turmas tiverem o n.º de projeto (Escola360 › Turmas, código FSE), pode escolher aqui um rodapé para cada projeto.</p></div>`;
  return `<div class="lgproj"><h5>Por n.º de projeto</h5><p class="hint" style="margin:0 0 8px">Os documentos de uma turma usam o rodapé do seu n.º de projeto; sem imagem própria, usam o do ano letivo (acima).</p>
    ${ks.map(k=>{const L=lgProj(k),cs=G.get(k);return `<div class="lgpr" data-lgproj="${esc(k)}"><div class="lgpb${L?"":" vazio"}" data-lgppick title="Escolher imagem">${L?`<img src="${L.src}" alt="">`:"do ano letivo"}</div>
      <div class="grow"><code>${esc(k)}</code><span class="hint" style="margin:0">${cs.length?"Turmas: "+cs.map(esc).join(", "):"sem turmas"}</span></div>
      <button class="b s" type="button" data-lgppick>${IC_UP}${L?"Substituir":"Escolher"}</button>${L?`<button class="b rm" type="button" data-lgpdel>${IC_DEL}Remover</button>`:""}</div>`}).join("")}</div>`}
$("#lgSlots").addEventListener("click",e=>{const pr=e.target.closest("[data-lgproj]");if(pr){const k=pr.dataset.lgproj;
    if(e.target.closest("[data-lgppick]")){lgAlvo="proj:"+k;$("#lgFile").value="";$("#lgFile").click()}
    else if(e.target.closest("[data-lgpdel]")){if(LOGOS.proj)delete LOGOS.proj[k];guardarLogos();toast("O projeto "+k+" volta a usar o rodapé do ano letivo")}return}
  const sl=e.target.closest("[data-lg]");if(!sl)return;const k=sl.dataset.lg;
  if(e.target.closest("[data-lgpick]")){lgAlvo=k;$("#lgFile").value="";$("#lgFile").click()}
  else if(e.target.closest("[data-lgdel]")){lgSet(k,null);guardarLogos();toast("Logótipo removido")}});
$("#lgSlots").addEventListener("change",e=>{if(!e.target.matches("[data-lgbg]")||!LOGOS.main)return;LOGOS.main.bg=e.target.checked;guardarLogos()});
$("#lgFile").addEventListener("change",e=>{const f=e.target.files[0];if(f)porLogo(lgAlvo,f)});
["dragenter","dragover"].forEach(ev=>$("#lgSlots").addEventListener(ev,e=>{const sl=e.target.closest("[data-lg]");if(!sl)return;e.preventDefault();sl.classList.add("drag")}));
$("#lgSlots").addEventListener("dragleave",e=>{const sl=e.target.closest("[data-lg]");if(sl&&!sl.contains(e.relatedTarget))sl.classList.remove("drag")});
aplicarLogos();lgMigrar();
$("#lgSlots").addEventListener("drop",e=>{const sl=e.target.closest("[data-lg]");if(!sl)return;e.preventDefault();sl.classList.remove("drag");const f=e.dataTransfer.files[0];if(f)porLogo(sl.dataset.lg,f)});

/* ---------- PDF (relatório por formador e geral) ---------- */
function loadScript(src){return new Promise((ok,ko)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=()=>ko(new Error("Não foi possível carregar "+src.split("/").pop()+" (sem internet?)"));document.head.appendChild(s)})}
let PDFJ=null;
async function loadPDF(){if(!PDFJ){if(!window.jspdf)await loadScript("lib/jspdf.umd.min.js");await loadScript("lib/jspdf.plugin.autotable.min.js");PDFJ=window.jspdf.jsPDF}await pdfLgPadrao();return PDFJ}
/* 0.9.89: se este computador ainda não tiver os logótipos das Definições, os PDF usam os da escola que vêm com a app
   (logótipo da EPISJ em cima e logótipos de financiamento de 2026/2027 em baixo). Um «Remover» explícito continua a valer. */
let PDF_LG=null;
async function pdfLgImg(src){try{const b=await (await fetch(src)).blob();const d=await new Promise(ok=>{const f=new FileReader();f.onload=()=>ok(f.result);f.readAsDataURL(b)});
  const im=new Image();await new Promise(ok=>{im.onload=ok;im.onerror=ok;im.src=d});return im.naturalWidth?{src:d,w:im.naturalWidth,h:im.naturalHeight}:null}catch(e){return null}}
async function pdfLgPadrao(){if(!PDF_LG){const[m,f]=await Promise.all([pdfLgImg("img/logo-episj.png"),pdfLgImg(LG_FUNDOS_PADRAO.src)]);PDF_LG={main:m,foot:f}}return PDF_LG}
function pdfLogos(fse){try{lgDoNavegador()}catch(e){}const P=PDF_LG||{};let f=fse?lgProj(fse):undefined;if(!f)f=lgGet("foot");if(f===undefined)try{f=lgFootBarra()}catch(e){}if(f===undefined)f=P.foot;
  let m=LOGOS.main,r=LOGOS.right;try{m=m||lgGet("main");r=r||lgGet("right")}catch(e){} // 0.9.219: formadores usam os publicados pela Direção
  return{m:m||P.main||null,r:r||null,f:f||null}}
// as fontes base do PDF só têm caracteres latinos: troca os tipográficos por equivalentes simples
const pdfTxt=s=>String(s??"").replace(/[—–]/g,"-").replace(/[“”«»]/g,'"').replace(/[‘’]/g,"'").replace(/…/g,"...").replace(/[›→]/g,">").replace(/•/g,"-").replace(/⚠/g,"!").replace(/[^\x00-\xff]/g,"");
const lgFmt=L=>/^data:image\/jpe?g/.test(L.src)?"JPEG":"PNG";
const lgFit=(L,mw,mh)=>{const r=Math.min(mw/L.w,mh/L.h);return[L.w*r,L.h*r]};
// 0.9.30: os dois logótipos do cabeçalho com o mesmo "peso" visual (mesma área), mais pequenos e centrados na mesma linha
const lgFitArea=(L,A,mw,mh)=>{const ar=L.w/L.h;let w=Math.sqrt(A*ar),h=w/ar;const r=Math.min(1,mw/w,mh/h);return[w*r,h*r]};
const PDF_TOP=36,PDF_BOT=28;
function pdfMoldura(doc,rodape,fse){const n=doc.getNumberOfPages(),{m,r,f:f0}=pdfLogos();
  for(let i=1;i<=n;i++){doc.setPage(i);const pf=pdfProjPag(doc,i,fse),f=(pf&&lgProj(pf))||f0;const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight();
    if(m){const[w,h]=lgFitArea(m,230,40,14);doc.addImage(m.src,lgFmt(m),14,19-h/2,w,h,"lgMain")}
    if(r){const[w,h]=lgFitArea(r,230,40,14);doc.addImage(r.src,lgFmt(r),W-14-w,19-h/2,w,h,"lgRight")}
    doc.setDrawColor(222,226,231);doc.setLineWidth(.2);if(m||r)doc.line(14,31,W-14,31);doc.line(14,H-PDF_BOT+3,W-14,H-PDF_BOT+3);
    if(f){const[w,h]=lgFit(f,120,13);doc.addImage(f.src,lgFmt(f),(W-w)/2,H-PDF_BOT+5+(13-h)/2,w,h,f===f0?"lgFoot":"lgFoot_"+lgProjK(pf))}
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(130);
    pdfTxt360(doc,pdfTxt(rodape),14,H-7);doc.text(`Página ${i} de ${n}`,W-14,H-7,{align:"right"})}}
function pdfTitulo(doc,titulo,sub){doc.setFont("helvetica","bold");doc.setFontSize(16);doc.setTextColor(22,40,80);doc.text(pdfTxt(titulo),14,PDF_TOP+6);
  doc.setFont("helvetica","normal");doc.setFontSize(9.5);doc.setTextColor(95);doc.text(pdfTxt(sub),14,PDF_TOP+12);return PDF_TOP+22}
const pdfData=()=>new Date().toLocaleDateString("pt-PT");
const pdfSub=()=>`Ano letivo ${anoLetivo()} · ${pdfData()}${cfg.mail.prazo?" · Prazo de entrega: "+cfg.mail.prazo:""}`;
function pdfTabela(doc,y,head,body,cols,compacto){
  doc.autoTable({startY:y,head:[head],body,margin:{top:PDF_TOP,bottom:PDF_BOT+2,left:14,right:14},theme:"grid",rowPageBreak:compacto?"avoid":"auto",
    styles:{font:"helvetica",fontSize:compacto?7:8,cellPadding:compacto?{top:.9,bottom:.9,left:1.4,right:1.4}:1.7,overflow:"linebreak",lineColor:[226,230,235],lineWidth:.15,textColor:[40,44,52],valign:"top"},
    headStyles:{fillColor:[26,95,208],textColor:255,fontStyle:"bold",lineColor:[26,95,208]},alternateRowStyles:{fillColor:[246,248,251]},columnStyles:cols||{}});
  return doc.lastAutoTable.finalY}
/* 0.9.89: relatório mais compacto — página A4 deitada, letra mais pequena e uma linha por turma/disciplina/módulo
   (os documentos em falta do mesmo módulo ficam juntos na mesma célula; a localização mostra a pasta comum) */
const pdfA4L=J=>new J({unit:"mm",format:"a4",orientation:"landscape"});
// 0.9.90: n.º de projeto (código FSE da turma, Escola360 › Turmas) — procura pelo nome exato, senão pelo código + anos da turma
function pdfFseTurma(nome){try{const e=escData(),T=e.turmas||[];let t=T.find(x=>norm(x.nome||"")===norm(nome));
  if(!t){const c=turmaCod(nome),an=turmaAnos(nome),yy=n=>String(n||"").slice(-2);if(c){const L=T.filter(x=>norm(x.cod)===norm(c));
    t=(an&&L.find(x=>x.anoIni&&yy(x.anoIni)+"-"+yy(x.anoFim)===an))||(L.length===1?L[0]:null)||turmaPorCod(c)}}
  return t&&t.fse?String(t.fse):""}catch(e){return""}}
/* 0.9.103: «Em falta» por extenso — lê o caminho da pasta vazia e diz o que falta: a secção (012.1.3 - Pautas de Avaliação),
   a disciplina (1400 - TIC) e o módulo. Ex.: «Pautas de avaliação do Módulo 003 de TIC». Pastas de formandos vazias dentro de
   um teste juntam-se: «Teste prático - A03 dos formandos Alecio, Diogo e Ines (Enunciados de avaliação do Módulo 002 de TIC)». */
const FD_AC=[["avaliacao","avaliação"],["avaliacoes","avaliações"],["pratico","prático"],["praticos","práticos"],["pratica","prática"],["praticas","práticas"],["teorico","teórico"],["teorica","teórica"],
  ["modulo","módulo"],["modulos","módulos"],["didaticos","didáticos"],["didatico","didático"],["planificacao","planificação"],["planificacoes","planificações"],["sumarios","sumários"],["formacao","formação"],
  ["informacao","informação"],["pedagogico","pedagógico"],["pedagogica","pedagógica"],["tecnico","técnico"],["tecnica","técnica"],["relatorio","relatório"],["relatorios","relatórios"],["exercicios","exercícios"],
  ["correcao","correção"],["correcoes","correções"],["correccao","correção"],["classificacao","classificação"],["classificacoes","classificações"],["gestao","gestão"],["educacao","educação"],["acao","ação"],["producao","produção"],
  ["grelhas","grelhas"],["criterios","critérios"],["sintese","síntese"],["recuperacao","recuperação"],["assiduidade","assiduidade"],["registos","registos"],["presencas","presenças"],["reunioes","reuniões"],["atas","atas"]];
const FD_ACM=new Map(FD_AC);
const fdAcento=s=>String(s||"").replace(/[A-Za-z]+/g,w=>{const r=FD_ACM.get(w.toLowerCase());if(!r)return w;
  return w===w.toUpperCase()&&w.length>1?r.toUpperCase():w[0]===w[0].toUpperCase()?r[0].toUpperCase()+r.slice(1):r});
const fdSecRe=/^\d{2,3}(\.\d+)*\s*[-–]\s*/;
// «012.1.3 - Pautas de Avaliacao» → «Pautas de avaliação» (siglas e palavras com números ficam como estão)
function fdRotulo(c){const s=fdAcento(String(c||"").replace(fdSecRe,"").trim());let i=0;
  return s.replace(/\S+/g,w=>{const r=i++===0?w[0].toUpperCase()+w.slice(1):(/\d/.test(w)||(w.length>1&&w===w.toUpperCase())?w:w.toLowerCase());return r})}
const fdArt=m=>/^(ufcd|uc)\b/i.test(norm(m))?"da":"do";
const fdNome=s=>String(s||"").replace(/^[\s\-–_.]+/,"").trim();
const fdLista=L=>L.length<2?L.join(""):L.slice(0,-1).join(", ")+" e "+L[L.length-1];
// primeiros nomes dos formandos (Escola360 › Formandos), para reconhecer as pastas de cada formando
var FD_FORM=null,FD_FORMK="";
function fdFormandos(){let e;try{e=escData()}catch(x){return new Set()}const L=e.formandos||[],k=L.length+"|"+(L[0]&&L[0].id||"");
  if(FD_FORM&&FD_FORMK===k)return FD_FORM;FD_FORM=new Set(L.map(f=>norm(String(f.nome||"").split(/\s+/)[0])).filter(Boolean));FD_FORMK=k;return FD_FORM}
function fdEhFormando(nomes,pai){const F=fdFormandos(),ok=n=>F.has(norm(fdNome(n).split(/\s+/)[0]));
  if(nomes.some(ok))return true;if(F.size>20)return false; // com os formandos da Escola360 preenchidos, só conta quem lá está
  const doc=/grelha|enunciad|corre|criterio|pauta|matriz|resolu|soluc|registo|sumario|planifica|ata|relatorio|modelo|anexo|fotos|video/;
  return nomes.length>1&&nomes.every(n=>{const s=fdNome(n);return s&&!/\d/.test(s)&&s.split(/\s+/).length<=3&&!fdSecRe.test(s)&&!isModName(s)&&!doc.test(norm(s))})
    &&/teste|ficha|trabalho|prova|exerc|formand|portef/.test(norm(pai||""))}
// analisa uma linha do que falta (rowsFor): devolve a chave de agrupamento e o texto (ou as peças para juntar irmãs)
function faltaInfo(r){const it=r.item||{},m=(r.e&&r.e.mod)||{},discR=discShort(r.disc);
  const modCurto=fdAcento(codCurto(m.cod||"")||r.mod||"");
  if(it.doc&&it.doc.id==="sec:modulo")return{gk:"m0",txt:`Pasta ${fdArt(modCurto)} ${modCurto}${discR?" de "+discR:""} (não existe na Box)`,loc:r.loc||""};
  const L=String(r.loc||"").split(/\s*[›>]\s*/).filter(Boolean),all=[...L,String(r.falta||"")],u=all.length-1;
  const iD=all.findIndex(c=>isDisc(c));let iS=-1;for(let k=0;k<(iD>=0?iD:u);k++)if(fdSecRe.test(all[k]))iS=k;
  const mk=m.cod?modKey(m.cod):"";let iM=-1;for(let k=iD>=0?iD+1:0;k<=u;k++)if(isModName(all[k])&&(!mk||modKey(all[k])===mk)){iM=k;break}
  if(iM<0)for(let k=iD>=0?iD+1:0;k<=u;k++)if(isModName(all[k])){iM=k;break}
  const sec=iS>=0?fdRotulo(all[iS]):"",disc=iD>=0?discShort(all[iD]):discR,mod=iM>=0?fdAcento(all[iM]):modCurto;
  const deMod=`${fdArt(mod)} ${mod}${disc?" de "+disc:""}`,base=sec?`${sec} ${deMod}`:`Pasta ${deMod}`;
  const locPasta=all.join(" > "),locPai=L.join(" > ");
  if(u===iM)return{gk:"p:"+locPasta,txt:sec?base:`Pasta ${deMod} (vazia)`,loc:locPasta};
  if(u===iD)return{gk:"p:"+locPasta,txt:(sec||"Pasta")+(disc?" de "+disc:"")+" (pasta da disciplina vazia)",loc:locPasta};
  if(u===iS)return{gk:"p:"+locPasta,txt:sec+(disc?" de "+disc:"")+" (pasta vazia)",loc:locPasta};
  const cima=Math.max(iM,iD,iS);if(cima<0)return{gk:"p:"+locPasta,txt:fdAcento(r.falta),loc:locPasta};
  // pasta mais funda (ex.: a de um formando dentro de «Teste Prático - A03»): junta-se às irmãs vazias da mesma pasta
  return{gk:"s:"+locPai,base,pai:all.slice(cima+1,u),folha:String(r.falta||""),loc:locPai,locPasta}}
function faltaTexto(g){if(g.txt)return g.txt;const nomes=g.folhas,pai=g.pai[g.pai.length-1]||"";
  if(fdEhFormando(nomes,pai)){const quem=(nomes.length>1?"dos formandos ":"do formando ")+fdLista(nomes.map(fdNome));
    return pai?`${fdAcento(pai)} ${quem} (${g.base})`:`${g.base} — ${quem}`}
  return `${g.base}: ${[...g.pai.map(fdAcento),fdLista(nomes.map(n=>fdAcento(fdNome(n))))].join(" › ")}`}
function faltaDesc(r){const g=faltaInfo(r);if(g.txt)return g.txt;return faltaTexto({...g,folhas:[g.folha]})}
function pdfAgrupar(t){const G=new Map(),FS=new Map(),fse=n=>{if(!FS.has(n))FS.set(n,pdfFseTurma(n));return FS.get(n)};
  for(const r of rowsFor(t,true)){const f=faltaInfo(r),k=[r.turma,r.disc,r.mod,f.gk].join("\u0001");let g=G.get(k);
    if(!g){g={turma:r.turma,disc:r.disc,mod:r.mod,...f,folhas:[],obs:[],n:0};G.set(k,g)}
    g.n++;if(f.folha!=null&&!g.folhas.includes(f.folha))g.folhas.push(f.folha);
    if(r.state==="blank")g.obs.push(fdNome(r.falta)+": o ficheiro entregue não conta ("+motivoBad(r.item)+")")}
  return[...G.values()].map(g=>{const loc=g.folhas.length===1&&g.locPasta?g.locPasta:g.loc;
    const pj=fse(g.turma);return[g.turma,discShort(g.disc),g.mod,faltaTexto(g),loc,[pj?"Projeto n.º "+pj:"",...g.obs].filter(Boolean).join("; ")].map(pdfTxt)})}
/* 0.9.219: «Documentos em falta» — um só modelo de relatório para a Direção (por formador, geral, anexo dos emails) e para o formador:
   A4 ao alto, logótipos, título ao centro, formador e análise, quatro caixas de resumo com barra, e uma tabela por turma e módulo
   com o estado de cada documento a cores (Estado · Documento · Pasta · Entregue a). */
const ENT_COR={ok:[15,123,63],warn:[161,92,0],modelo:[161,92,0],blank:[180,35,24],missing:[180,35,24],naoconf:[161,92,0]};
const ENT_FUNDO={ok:[230,244,234],warn:[255,244,224],modelo:[255,244,224],blank:[253,236,236],missing:[253,236,236],naoconf:[255,244,224]};
const ENT_TXT={ok:"entregue",warn:"entregue — a confirmar",modelo:"entregue — não segue o modelo",blank:"não conta (vazio ou falso)",missing:"em falta",naoconf:"por confirmar"};
// D = {nome,cod,email,analise,t,so,grupos:[{tu,di,mo,proj,it:[{st,tipo,onde,obs,d}]}],todos:[{it}]} → acrescenta os totais
function entDados(D){const all=(D.todos||D.grupos).flatMap(g=>g.it);D.tot=all.length;D.ent=all.filter(x=>boxOkS(x.st)).length;D.nf=all.filter(x=>boxFaltaS(x.st)).length;
  D.mods=(D.todos||D.grupos).length;D.modsOk=(D.todos||D.grupos).filter(g=>g.it.length&&g.it.every(x=>boxOkS(x.st))).length;return D}
// dados do relatório de um formador na Direção (byTeacher), com os mesmos documentos que o formador vê
function entDeProf(t,so){const FS=new Map(),fse=n=>{if(!FS.has(n))FS.set(n,pdfFseTurma(n));return FS.get(n)};
  const todos=t.list.map(e=>{const mo=modTitle(e.mod);return{tu:e.mod.turma||"",di:discShort(e.mod.disc)||e.mod.disc||"",mo,proj:fse(e.mod.turma||""),it:e.items.map(i=>boxItem(boxItemPub(i,e.mod),{mo}))}})
    .sort((a,b)=>COLL_PTN.compare(a.tu+" "+a.mo,b.tu+" "+b.mo));
  const grupos=todos.map(g=>({...g,it:so==="tudo"?g.it:g.it.filter(x=>!boxOkS(x.st))})).filter(g=>g.it.length);
  let an="";try{an=lastListing?nomePasta(lastListing.pasta):""}catch(e){}
  return entDados({nome:t.p.nome||"",cod:t.p.cod||"",email:t.p.email||"",analise:an,t:lastListing&&lastListing.t,so:so||"falta",grupos,todos})}
function entSec(doc,D,y,geral){const W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),X=14,LW=W-28;
  if(y>H-PDF_BOT-60){doc.addPage();y=PDF_TOP+4}
  const pct=D.tot?Math.round(D.ent*100/D.tot):0,dt=x=>x?new Date(x+"T12:00").toLocaleDateString("pt-PT"):"—";
  // formador e análise
  doc.setFont("helvetica","bold");doc.setFontSize(geral?11:12);doc.setTextColor(22,50,105);const nm=pdfTxt((D.cod?D.cod+" · ":"")+D.nome);doc.text(nm,X,y);
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(90);
  doc.text(pdfTxt([D.email,D.analise?"Análise da Box: "+D.analise+(D.t?" ("+new Date(D.t).toLocaleDateString("pt-PT")+")":""):"",D.so==="tudo"?"Todos os documentos":"Só os documentos em falta"].filter(Boolean).join("  ·  ")),X,y+5);
  y+=9;
  // caixas de resumo
  const bx=[["Documentação entregue",pct+"%",null],["Documentos em falta",String(D.nf),D.nf?[180,35,24]:null],["Entregues",D.ent+" de "+D.tot,null],["Módulos completos",D.modsOk+" de "+D.mods,null]],gw=(LW-9)/4;
  bx.forEach(([l,v,c],k)=>{const x=X+k*(gw+3);doc.setDrawColor(227,231,238);doc.setLineWidth(.25);doc.roundedRect(x,y,gw,13,1.6,1.6,"S");
    doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.setTextColor(107,115,133);doc.text(pdfTxt(l),x+3,y+4.6);
    doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(...(c||[27,35,51]));doc.text(pdfTxt(v),x+3,y+10.6)});
  y+=15.5;doc.setFillColor(238,241,246);doc.roundedRect(X,y,LW,1.8,.9,.9,"F");
  if(pct){doc.setFillColor(...(pct===100?[31,157,85]:pct>=50?[217,154,24]:[214,69,69]));doc.roundedRect(X,y,LW*pct/100,1.8,.9,.9,"F")}
  y+=5.5;
  if(!D.grupos.length){doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(15,123,63);doc.text(pdfTxt(D.so==="tudo"?"Sem documentos.":"Não falta entregar nenhum documento nesta análise."),X,y+4);return y+12}
  const nL=D.grupos.reduce((a,g)=>a+g.it.length,0),cp=nL>25,body=[];
  for(const g of D.grupos){const f=g.it.filter(x=>boxFaltaS(x.st)).length;
    body.push([{content:pdfTxt([g.tu,g.mo].filter(Boolean).join(" · ")+(g.di?"   "+g.di:"")+(g.proj?"   ·   Projeto n.º "+g.proj:"")),colSpan:3,_g:1},{content:pdfTxt(f?f+" em falta":"completo"),_g:2,_f:f}]);
    for(const x of g.it)body.push([{content:pdfTxt(ENT_TXT[x.st]||x.st),_st:x.st},pdfTxt(x.tipo+(x.obs?"\n"+x.obs:"")),pdfTxt(x.onde||"—"),pdfTxt(dt(x.d))])}
  doc.autoTable({startY:y,head:[["Estado","Documento","Pasta","Entregue a"]],body,margin:{top:PDF_TOP,bottom:PDF_BOT+2,left:X,right:X},theme:"plain",rowPageBreak:"avoid",
    styles:{font:"helvetica",fontSize:cp?7.4:8.4,cellPadding:cp?{top:.8,bottom:.8,left:1.6,right:1.6}:{top:1.5,bottom:1.5,left:1.8,right:1.8},textColor:[27,35,51],valign:"top",lineColor:[238,241,246],lineWidth:{bottom:.2}},
    headStyles:{fontSize:7,textColor:[107,115,133],fontStyle:"bold",lineColor:[214,219,228],lineWidth:{bottom:.3}},
    columnStyles:{0:{cellWidth:36},2:{cellWidth:44,textColor:[74,82,98]},3:{cellWidth:20,textColor:[74,82,98]}},
    didParseCell:h=>{if(h.section!=="body")return;const r=h.row.raw,c=r[h.column.index];
      if(r[0]&&r[0]._g){h.cell.styles.fillColor=[243,245,249];h.cell.styles.fontStyle="bold";h.cell.styles.textColor=[22,50,105];h.cell.styles.fontSize=cp?7.8:8.8;
        if(c&&c._g===2){h.cell.styles.halign="right";h.cell.styles.textColor=c._f?[180,35,24]:[15,123,63]}return}
      if(h.column.index===0&&c&&c._st){h.cell.styles.textColor=ENT_COR[c._st]||[60,60,60];h.cell.styles.fillColor=ENT_FUNDO[c._st]||[238,241,246];h.cell.styles.fontStyle="bold";h.cell.styles.fontSize=cp?6.8:7.6}
      if(h.column.index===1){const t=String(h.cell.raw||"");if(t.includes("\n"))h.cell.styles.textColor=[27,35,51]}}});
  return doc.lastAutoTable.finalY+(geral?9:4)}
// título ao centro, entre os logótipos (só na 1.ª página)
function entTitulo(doc,t,sub){const W=doc.internal.pageSize.getWidth();doc.setFont("helvetica","bold");doc.setFontSize(15);doc.setTextColor(22,50,105);doc.text(pdfTxt(t),W/2,17,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(74,82,98);doc.text(pdfTxt(sub),W/2,23,{align:"center"});return PDF_TOP+4}
async function pdfEntregas(L,geral){const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});
  const emit="Emitido a "+new Date().toLocaleDateString("pt-PT",{day:"numeric",month:"long",year:"numeric"});
  let y=entTitulo(doc,geral?"Documentos em falta — relatório geral":"Documentos em falta","Escola Profissional da Ilha de São Jorge  ·  "+emit);
  if(geral){const res=geral.map(D=>[pdfTxt((D.cod?D.cod+" · ":"")+D.nome),pdfTxt(D.email||""),String(D.nf),(D.tot?Math.round(D.ent*100/D.tot):0)+"%"]);
    const tot=geral.reduce((a,D)=>a+D.tot,0),ent=geral.reduce((a,D)=>a+D.ent,0),nf=geral.reduce((a,D)=>a+D.nf,0);
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(22,50,105);doc.text(pdfTxt(`Resumo por formador — entregue ${ent} de ${tot} (${tot?Math.round(ent*100/tot):0}%) · em falta ${nf}`),14,y);
    doc.autoTable({startY:y+3,head:[["Formador","Email","Em falta","Entregue"]],body:res,margin:{top:PDF_TOP,bottom:PDF_BOT+2,left:14,right:14},theme:"plain",
      styles:{font:"helvetica",fontSize:8,cellPadding:1.3,lineColor:[238,241,246],lineWidth:{bottom:.2}},headStyles:{fontSize:7,textColor:[107,115,133],lineColor:[214,219,228],lineWidth:{bottom:.3}},
      columnStyles:{2:{halign:"right",cellWidth:20},3:{halign:"right",cellWidth:20}},didParseCell:h=>{if(h.section==="body"&&h.column.index===2&&+h.cell.raw>0)h.cell.styles.textColor=[180,35,24]}});
    y=doc.lastAutoTable.finalY+10}
  const muitos=L.length>20;if(muitos)ovAbrir("A preparar o relatório");
  try{for(let i=0;i<L.length;i++){y=entSec(doc,L[i],y,!!geral);if(muitos&&i%10===9)await ovPasso(5+i/L.length*88,`Formador ${i+1} de ${L.length}…`)}
    pdfMoldura(doc,"Escola Profissional da Ilha de São Jorge · EPISJ 360 · Box360"+(geral?" · Relatório geral":""))}
  finally{if(muitos){ovPassoSync(100,"Pronto");ovFechar(300)}}
  return doc}
async function pdfFormador(t){return pdfEntregas([entDeProf(t,"falta")])}
async function pdfGeral(){const T=byTeacher(evaluate()).filter(t=>t.tot).sort((a,b)=>cmpProf(a.p,b.p));const L=T.map(t=>entDeProf(t,"falta"));
  return pdfEntregas(L.filter(D=>D.grupos.length),L)}
const ficheiroNome=s=>String(s).replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim();
const pdfNomeF=t=>ficheiroNome(`Documentos em falta - ${t.p.nome} - ${anoLetivo().replace("/","-")}.pdf`);
const pdfNomeG=()=>ficheiroNome(`Relatório de documentação não entregue - ${hoje()}.pdf`);
const pdfB64=doc=>{const b=new Uint8Array(doc.output("arraybuffer"));let s="";for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)};
async function baixarPDF(fn,nome){try{const d=await fn();d.save(nome)}catch(e){toast(e.message||"Não foi possível gerar o PDF")}}

