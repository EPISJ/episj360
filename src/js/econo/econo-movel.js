/* Econo360 — versão para telemóvel (0.9.160). Em ecrãs até 760 px (body.ecom, posto por show()):
   barra de baixo com Artigos · Faturas · [câmara] · Movimentos · Mais (abre o menu do módulo), listas em cartões,
   ficha do artigo em ecrã inteiro, janelas em ecrã inteiro e leitor de códigos de barras com a câmara.
   O resto da app não muda (por agora só o Econo360 tem versão própria para telemóvel). */
var ECO_MOB_MQ="(max-width:760px)";
function ecoMob(){try{return matchMedia(ECO_MOB_MQ).matches}catch(e){return false}}
function ecoMovel(t){const B=document.body;B.classList.toggle("ecoed",ecoEd());if(t!=="ecoInicio")B.classList.remove("ecofic");
  let b=document.getElementById("ecoBar");
  if(!b){b=document.createElement("nav");b.id="ecoBar";b.className="eco-bar";b.setAttribute("aria-label","Econo360");
    const I=(p)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
    b.innerHTML=`<button type="button" data-t="ecoInicio">${I('<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>')}<span>Artigos</span></button>
      <button type="button" data-t="ecoFat">${I('<path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>')}<span>Faturas</span></button>
      <button type="button" class="eco-bcam" data-ecobcam aria-label="Fotografar fatura">${I('<path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/>')}</button>
      <button type="button" data-t="ecoMovs">${I('<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>')}<span>Movimentos</span></button>
      <button type="button" data-ecobmais>${I('<path d="M4 7h16M4 12h16M4 17h16"/>')}<span>Mais</span></button>`;
    document.body.appendChild(b);
    b.addEventListener("click",e=>{const x=e.target.closest("button");if(!x)return;document.body.classList.remove("ecofic");
      if(x.dataset.t){show(x.dataset.t);window.scrollTo({top:0});return}
      if(x.matches("[data-ecobcam]")){ecfFotografar();return}
      if(x.matches("[data-ecobmais]")){const n=document.getElementById("navBtn");if(n)n.click()}});
    try{const mq=matchMedia(ECO_MOB_MQ),f=()=>{document.body.classList.remove("ecofic");if(curTab&&/^eco[A-Z]/.test(curTab))ecoRender(curTab)};mq.addEventListener?mq.addEventListener("change",f):mq.addListener(f)}catch(e){}}
  b.querySelectorAll("button[data-t]").forEach(x=>{x.classList.toggle("on",x.dataset.t===t);x.hidden=!podeVer(x.dataset.t)});}
function ecoFichaAbrir(){if(!ecoMob())return;document.body.classList.add("ecofic");const f=document.getElementById("ecoFicha");if(f)f.scrollTop=0}
// leitor de códigos com a câmara (BarcodeDetector; nos navegadores sem ele, só QR com o jsQR) — reutiliza o aspeto do leitor do Folder360
var ECO_SCAN=null;
async function ecoScan(cb){ecoScanFechar();const box=document.createElement("div");box.className="fd-scan";
  box.innerHTML=`<div class="fd-scard"><div class="fd-sv"><video playsinline muted></video><i class="fd-sframe"></i></div><div class="fd-sbar"><span id="ecoScanMsg">A abrir a câmara…</span><span class="grow"></span><button class="b s" data-x>Fechar</button></div></div>`;
  document.body.appendChild(box);box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-x]"))ecoScanFechar()});
  const msg=t=>{const m=document.getElementById("ecoScanMsg");if(m)m.textContent=t};const S=ECO_SCAN={box,stream:null,on:true,ult:"",ultT:0};
  try{S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280}},audio:false})}catch(e){msg("Não foi possível usar a câmara ("+(e.message||e.name)+"). Escreva o código na caixa «Procurar».");return}
  if(!S.on){S.stream.getTracks().forEach(t=>t.stop());return}
  const v=box.querySelector("video");v.srcObject=S.stream;await v.play().catch(()=>{});
  let det=null;try{if("BarcodeDetector" in window){const f=await BarcodeDetector.getSupportedFormats();const q=["ean_13","ean_8","upc_a","upc_e","code_128","code_39","qr_code"].filter(x=>f.includes(x));if(q.length)det=new BarcodeDetector({formats:q})}}catch(e){det=null}
  if(!det){try{if(!window.jsQR)await loadScript("lib/jsQR.js")}catch(e){}}
  msg(det?"Aponte para o código de barras do artigo":"Este navegador só lê QR codes pela câmara — para códigos de barras, escreva o número");
  const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
  const passo=async()=>{if(!S.on)return;let txt="";
    try{if(v.readyState>=2){if(det){const r=await det.detect(v);if(r&&r.length)txt=r[0].rawValue}
      else if(window.jsQR){const w=Math.min(800,v.videoWidth),h=Math.round(v.videoHeight*w/v.videoWidth);cv.width=w;cv.height=h;cx.drawImage(v,0,0,w,h);const r=jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:"dontInvert"});if(r)txt=r.data}}}catch(e){}
    if(txt&&(txt!==S.ult||Date.now()-S.ultT>2500)){S.ult=txt;S.ultT=Date.now();const ok=cb(txt);msg((ok?"Lido: ":"Não há nenhum artigo com o código ")+txt);box.classList.remove("ok","ko");void box.offsetWidth;box.classList.add(ok?"ok":"ko");if(ok){setTimeout(ecoScanFechar,350);return}}
    setTimeout(passo,det?120:180)};passo()}
function ecoScanFechar(){const S=ECO_SCAN;ECO_SCAN=null;if(!S)return;S.on=false;try{S.stream&&S.stream.getTracks().forEach(t=>t.stop())}catch(e){}S.box.remove()}
function ecoScanArtigo(){ecoScan(txt=>{const q=String(txt||"").trim(),a=ECO.art.find(x=>(x.cb&&String(x.cb)===q)||(x.cod&&norm(x.cod)===norm(q)));if(!a)return false;ECO_UI.sel=a.id;ECO_UI.q="";ecoInicioUI();ecoFichaAbrir();return true})}
