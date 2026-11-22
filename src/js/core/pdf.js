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
  return{m:LOGOS.main||P.main||null,r:LOGOS.right||null,f:f||null}}
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
    doc.text(pdfTxt(rodape),14,H-7);doc.text(`Página ${i} de ${n}`,W-14,H-7,{align:"right"})}}
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
function pdfFormadorSec(doc,t,y,geral){const H=doc.internal.pageSize.getHeight();
  if(y>H-PDF_BOT-24){doc.addPage();y=PDF_TOP+4}
  doc.setFont("helvetica","bold");doc.setFontSize(geral?10.5:11.5);doc.setTextColor(25);doc.text(pdfTxt(t.p.nome+(t.p.cod?` (${t.p.cod})`:"")),14,y);
  const nm=doc.getTextWidth(pdfTxt(t.p.nome+(t.p.cod?` (${t.p.cod})`:"")));
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(95);
  doc.text(pdfTxt(`${t.p.email?t.p.email+" · ":""}${t.miss} documento(s) em falta · ${t.ok} de ${t.tot} entregue(s)`),14+nm+4,y);
  return pdfTabela(doc,y+3,["Turma","Disciplina","Módulo/UFCD","Em falta","Localização na Box","Observações"],pdfAgrupar(t),
    {0:{cellWidth:44},1:{cellWidth:20},2:{cellWidth:26},3:{cellWidth:72,fontStyle:"bold"},4:{cellWidth:52}},true)+7}
async function pdfFormador(t){const J=await loadPDF(),doc=pdfA4L(J);
  const y=pdfTitulo(doc,"Documentação em falta na Box",pdfSub());pdfFormadorSec(doc,t,y,false);
  pdfMoldura(doc,"Escola Profissional da Ilha de São Jorge · EPISJ 360 · Box360");return doc}
async function pdfGeral(){const J=await loadPDF(),doc=pdfA4L(J),T=byTeacher(evaluate());
  const tot=T.reduce((a,t)=>a+t.tot,0),ok=T.reduce((a,t)=>a+t.ok,0);
  let y=pdfTitulo(doc,"Relatório de documentação não entregue",pdfSub()+` · Entregue: ${ok}/${tot} (${tot?Math.round(ok/tot*100):0}%) · Em falta: ${tot-ok}`);
  const res=T.filter(t=>t.tot).map(t=>[t.p.nome,t.p.email||"",String(t.miss),`${t.tot?Math.round(t.ok/t.tot*100):0}%`].map(pdfTxt));
  doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.setTextColor(25);doc.text("Resumo por formador",14,y);
  y=pdfTabela(doc,y+3,["Formador","Email","Em falta","Entregue"],res,{2:{halign:"right",cellWidth:22},3:{halign:"right",cellWidth:22}},true)+10;
  // 0.9.50: com muitos formadores, barra de progresso e a página não congela
  const F=T.filter(t=>t.miss),muitos=F.length>20;if(muitos)ovAbrir("A preparar o relatório geral");
  try{for(let i=0;i<F.length;i++){y=pdfFormadorSec(doc,F[i],y,true);if(muitos&&i%10===9)await ovPasso(5+i/F.length*88,`Formador ${i+1} de ${F.length}…`)}
    if(muitos)await ovPasso(95,"A pôr cabeçalhos e rodapés…");
    pdfMoldura(doc,"Escola Profissional da Ilha de São Jorge · EPISJ 360 · Box360 · Relatório geral")}
  finally{if(muitos){ovPassoSync(100,"Pronto");ovFechar(300)}}
  return doc}
const ficheiroNome=s=>String(s).replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g," ").trim();
const pdfNomeF=t=>ficheiroNome(`Documentos em falta - ${t.p.nome} - ${anoLetivo().replace("/","-")}.pdf`);
const pdfNomeG=()=>ficheiroNome(`Relatório de documentação não entregue - ${hoje()}.pdf`);
const pdfB64=doc=>{const b=new Uint8Array(doc.output("arraybuffer"));let s="";for(let i=0;i<b.length;i+=0x8000)s+=String.fromCharCode.apply(null,b.subarray(i,i+0x8000));return btoa(s)};
async function baixarPDF(fn,nome){try{const d=await fn();d.save(nome)}catch(e){toast(e.message||"Não foi possível gerar o PDF")}}

