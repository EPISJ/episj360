/* Econo360 — faturas (0.9.160): fotografia da fatura (no telemóvel abre a câmara) ou importação do PDF.
   Lê o QR code da AT (Portaria 195/2020: NIF do emitente, data, n.º do documento, ATCUD, bases, IVA e total); nos PDF sem QR
   lê o texto. Os ficheiros vão para o bucket privado «eco-faturas» do Supabase (só Direção e Economato; nada se apaga).
   A lista das faturas é a peça «EF» (ECF, em econo/econo-dados.js). «Lançar no stock» cria as entradas (movimentos com fat=id). */
var ECF_UI=ECF_UI||{q:"",est:"",mes:"",n:100};
var ECF_EST={porlancar:{t:"por lançar",k:"wa"},lancada:{t:"lançada no stock",k:"in"},semstock:{t:"sem artigos de stock",k:"mu"},anulada:{t:"anulada",k:"ba"}};
var ECF_TIPOS=[{v:"FT",t:"Fatura"},{v:"FR",t:"Fatura-recibo"},{v:"FS",t:"Fatura simplificada"},{v:"NC",t:"Nota de crédito"},{v:"ND",t:"Nota de débito"},{v:"GT",t:"Guia de transporte"},{v:"GR",t:"Guia de remessa"},{v:"OU",t:"Outro documento"}];
var ECF_URL=new Map(); // caminho → {u, ate}: endereços temporários (assinados) dos ficheiros
var ECF_ICO='<svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>';
var ECF_CAM='<svg viewBox="0 0 24 24"><path d="M3 8a2 2 0 0 1 2-2h2l2-3h6l2 3h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="4"/></svg>';
function ecfFat(id){return ECF.fat.find(f=>f.id===id)||null}
function ecfTipoN(v){const t=ECF_TIPOS.find(x=>x.v===v);return t?t.t:(v||"Documento")}
function ecfDig(s){return String(s||"").replace(/\D/g,"")}
function ecfFornPorNif(nif){const n=ecfDig(nif);return n?ECO.forn.find(f=>ecfDig(f.nif)===n)||null:null}
function ecfNome(f){return(f.forn&&ecoFornNome(f.forn))||f.fornNome||(f.nif?"NIF "+f.nif:"Fornecedor por indicar")}
function ecfChip(f){const e=ECF_EST[f.estado]||{t:f.estado,k:"mu"};return `<span class="pp-chip ${e.k}">${esc(e.t)}</span>`}
function ecfMovs(f){return ECO.mov.filter(m=>m.fat===f.id)}
function ecfPodeSb(){try{return sbAtivo()}catch(e){return false}}

// ---------- ler a fatura: QR code da AT, texto do PDF ----------
function ecfQrAT(s){const o={};String(s||"").split("*").forEach(p=>{const i=p.indexOf(":");if(i>0)o[p.slice(0,i).trim()]=p.slice(i+1).trim()});if(!/^\d{9}$/.test(o.A||""))return null;
  const n=k=>{const v=parseFloat(String(o[k]||"").replace(",","."));return isNaN(v)?0:v};
  const TX={"PT":[6,13,23],"PT-AC":[4,9,16],"PT-MA":[4,12,22]};let base=n("L"),iva=0,tx="",mx=0;
  for(const e of["I","J","K"]){base+=n(e+"2")+n(e+"3")+n(e+"5")+n(e+"7");iva+=n(e+"4")+n(e+"6")+n(e+"8");const T=TX[o[e+"1"]]||null;
    [[3,0],[5,1],[7,2]].forEach(([b,j])=>{if(n(e+b)>mx){mx=n(e+b);tx=T?T[j]:""}})}
  const F=o.F||"",data=/^\d{8}$/.test(F)?F.slice(0,4)+"-"+F.slice(4,6)+"-"+F.slice(6,8):"";
  return{nif:o.A,nifAdq:o.B||"",tipo:o.D||"",data,n:o.G||"",atcud:o.H||"",base:Math.round(base*100)/100,iva:Math.round(iva*100)/100,total:n("O"),tx}}
function ecfTexto(txt){const T=String(txt||""),r={};
  const nifs=[...T.matchAll(/(?:NIF|NIPC|N\.?\s?I\.?\s?F\.?|Contribuinte|VAT|Contrib\.?)\s*(?:n\.?\s*º|nº|no\.?)?\s*[:.]?\s*(?:PT\s?)?(\d{3}\s?\d{3}\s?\d{3})\b/gi)].map(m=>ecfDig(m[1]));
  if(nifs.length)r.nif=nifs[0];
  const d=T.match(/\b(FT|FR|FS|NC|ND|VD|GT|GR)\s+([A-Z0-9][\w.\-]*\/\d{1,9})\b/);if(d){r.tipo=d[1];r.n=d[1]+" "+d[2]}
  const at=T.match(/ATCUD\s*[:\-]?\s*([A-Z0-9]{8,}-\d+)/i);if(at)r.atcud=at[1];
  const di=T.match(/\b(20\d{2})[-/.](\d{2})[-/.](\d{2})\b/)||null,dp=T.match(/\b(\d{2})[-/.](\d{2})[-/.](20\d{2})\b/)||null;
  if(di)r.data=`${di[1]}-${di[2]}-${di[3]}`;else if(dp)r.data=`${dp[3]}-${dp[2]}-${dp[1]}`;
  const tots=[...T.matchAll(/Total(?:\s+a\s+pagar|\s+do\s+documento|\s+documento|\s+geral|\s*\(EUR\)|\s+EUR|\s+c\/\s*IVA|\s+com\s+IVA)?\s*[:€]?\s*(?:EUR|€)?\s*(\d{1,3}(?:[ .]\d{3})*,\d{2}|\d+\.\d{2})\b/gi)].map(m=>ecoNum(m[1])).filter(x=>x>0);
  if(tots.length)r.total=Math.max(...tots);
  const L=T.split(/\n/).map(x=>x.trim()).filter(x=>/[A-Za-zÀ-ú]{3}/.test(x)&&x.length<70&&!/^(original|duplicado|fatura|factura|página|pag\.|recibo|nota|guia|data|n\.?º|cliente|exmo)/i.test(x));
  if(L.length)r.nome=L[0].replace(/\s{2,}/g," ");
  return r}
async function ecfQrDe(cv){const ok=t=>/^A:\d{9}\*B:/.test(t||"")?t:"";
  try{if("BarcodeDetector" in window){const d=new BarcodeDetector({formats:["qr_code"]});const r=await d.detect(cv);for(const x of r||[])if(ok(x.rawValue))return x.rawValue}}catch(e){}
  try{if(!window.jsQR)await loadScript("lib/jsQR.js")}catch(e){return""}if(!window.jsQR)return"";
  const W=cv.width,H=cv.height,cx=cv.getContext("2d",{willReadFrequently:true});
  const Z=[[0,0,W,H],[0,H/2,W,H/2],[0,H/2,W/2,H/2],[W/2,H/2,W/2,H/2],[0,0,W/2,H/2],[W/2,0,W/2,H/2],[0,H/4,W,H/2]];
  for(const [x,y,w,h] of Z){try{const d=cx.getImageData(x|0,y|0,Math.max(1,w|0),Math.max(1,h|0)),r=jsQR(d.data,d.width,d.height,{inversionAttempts:"attemptBoth"});if(r&&ok(r.data))return r.data}catch(e){}}
  return""}
// fotografia: comprimida para JPEG (no máximo 2200 px no lado maior) — uma página de fatura fica com ~300-600 KB
async function ecfImagem(file){let src=null;
  try{src=await createImageBitmap(file,{imageOrientation:"from-image"})}catch(e){try{src=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=URL.createObjectURL(file)})}catch(x){src=null}}
  if(!src)return{blob:file,tipo:file.type||"image/jpeg",cv:null};
  const W=src.width||src.naturalWidth,H=src.height||src.naturalHeight,k=Math.min(1,2200/Math.max(W,H)),cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(W*k));cv.height=Math.max(1,Math.round(H*k));const cx=cv.getContext("2d",{willReadFrequently:true});cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(src,0,0,cv.width,cv.height);
  const blob=await new Promise(ok=>cv.toBlob(ok,"image/jpeg",.8));
  if(!blob||(/jpe?g/.test(file.type)&&file.size<=blob.size))return{blob:file,tipo:file.type||"image/jpeg",cv};
  return{blob,tipo:"image/jpeg",cv}}
async function ecfPdfLer(file){const r={txt:"",qr:""};try{const pdfjs=await calPdfJs(),doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise,np=Math.min(doc.numPages,6);
    for(let i=1;i<=np;i++){const pg=await doc.getPage(i),tc=await pg.getTextContent();r.txt+=tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("")+"\n"}
    const q=r.txt.match(/A:\d{9}\*B:[^\s]+/);if(q)r.qr=q[0];
    for(const i of[...new Set([1,doc.numPages])]){if(r.qr)break;const pg=await doc.getPage(i),vp=pg.getViewport({scale:2.4}),cv=document.createElement("canvas");cv.width=vp.width|0;cv.height=vp.height|0;
      const cx=cv.getContext("2d",{willReadFrequently:true});cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);await pg.render({canvasContext:cx,viewport:vp}).promise;r.qr=await ecfQrDe(cv)}}
  catch(e){console.warn("Econo360/PDF da fatura",e)}return r}
// junta o que se leu à fatura (o QR manda; o texto só completa o que falta)
function ecfAplicar(f,qr,tx){const q=qr?ecfQrAT(qr):null,t=tx||{};if(q){f.qr=qr;f.lido="qr"}else if(Object.keys(t).length)f.lido=f.lido||"texto";
  const p=(k,v)=>{if(v!==undefined&&v!==null&&v!==""&&(f[k]===undefined||f[k]===""||f[k]===null))f[k]=v};
  if(q){p("nif",q.nif);p("tipo",q.tipo);p("data",q.data);p("n",q.n);p("atcud",q.atcud);if(q.base||q.total){p("base",q.base);p("iva",q.iva);p("total",q.total)}p("tx",q.tx)}
  p("nif",t.nif);p("tipo",t.tipo);p("data",t.data);p("n",t.n);p("atcud",t.atcud);p("total",t.total);p("fornNome",t.nome);
  if(!f.forn&&f.nif){const fo=ecfFornPorNif(f.nif);if(fo){f.forn=fo.id;f.fornNome=""}}
  if(!f.tipo)f.tipo="FT"}

// ---------- ficheiros no Supabase Storage ----------
async function ecfEnviar(f,blob,tipo,nome){const sb=await sbCliente(),ext=/pdf/.test(tipo)?"pdf":/png/.test(tipo)?"png":/webp/.test(tipo)?"webp":/hei[cf]/.test(tipo)?"heic":"jpg";
  const p=`${new Date().getFullYear()}/${f.id}/${Date.now().toString(36)}-${uid()}.${ext}`;
  const {error}=await sb.storage.from(ECF_B).upload(p,blob,{contentType:tipo,upsert:false,cacheControl:"3600"});
  if(error){const m=String(error.message||error);throw new Error(/bucket not found/i.test(m)?"o espaço das faturas na nuvem ainda não foi preparado (falta aplicar servidor/supabase-episj360-econo360-faturas.sql)":/row-level security|unauthorized|403/i.test(m)?"esta conta não pode guardar faturas (só a Direção e o perfil Economato)":m)}
  f.fich=f.fich||[];f.fich.push({p,tipo,nome:String(nome||"").slice(0,120),tam:blob.size||0,em:Date.now(),por:String(EU&&EU.email||"")});return p}
async function ecfUrls(f){const L=(f.fich||[]).map(x=>x.p).filter(p=>{const c=ECF_URL.get(p);return!c||c.ate<Date.now()+60000});
  if(L.length){try{const sb=await sbCliente(),{data,error}=await sb.storage.from(ECF_B).createSignedUrls(L,3600);if(!error)(data||[]).forEach(x=>{if(x.signedUrl)ECF_URL.set(x.path,{u:x.signedUrl,ate:Date.now()+3500000})})}catch(e){}}
  return(f.fich||[]).map(x=>Object.assign({u:(ECF_URL.get(x.p)||{}).u||""},x))}
async function ecfMiniaturas(f,el){if(!el)return;if(!(f.fich||[]).length){el.innerHTML=`<p class="hint" style="margin:0">Ainda sem ficheiro.</p>`;return}
  el.innerHTML=`<p class="hint" style="margin:0">A abrir os ficheiros…</p>`;const L=await ecfUrls(f);
  el.innerHTML=L.map((x,i)=>/pdf/.test(x.tipo)?`<a class="ecf-pdf" href="${escUrl(x.u)}" target="_blank" rel="noopener">${ECF_ICO}<span>PDF${L.length>1?" "+(i+1):""}<small>${esc(x.nome||"")}${x.tam?" · "+Math.round(x.tam/1024)+" KB":""}</small></span></a>`
    :`<a class="ecf-img" href="${escUrl(x.u)}" target="_blank" rel="noopener" title="Abrir a página ${i+1}">${x.u?`<img src="${escUrl(x.u)}" alt="Página ${i+1} da fatura" loading="lazy">`:""}<small>pág. ${i+1}</small></a>`).join("")}

// ---------- entrada de ficheiros: fotografar (câmara do telemóvel) ou importar PDF ----------
function ecfFotografar(f){if(!ecoEd())return;const i=document.createElement("input");i.type="file";i.accept="image/*";i.setAttribute("capture","environment");i.hidden=true;document.body.appendChild(i);
  i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)ecfReceber(L,f||null)});i.click();setTimeout(()=>{try{if(!i.files||!i.files.length)i.remove()}catch(e){}},120000)}
function ecfEscolherPdf(f){if(!ecoEd())return;const i=document.createElement("input");i.type="file";i.accept="application/pdf,.pdf,image/*";i.multiple=!f;i.hidden=true;document.body.appendChild(i);
  i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)ecfReceber(L,f||null)});i.click()}
// L: ficheiros escolhidos. f: fatura a que se juntam (página seguinte). Sem f: cada PDF é uma fatura; as fotografias juntas são uma fatura.
async function ecfReceber(L,f){if(!ecoEd())return;if(!ecfPodeSb()){toast("Para guardar faturas é preciso ter entrado com o Office 365.");return}
  const pdfs=L.filter(x=>/pdf$/i.test(x.type)||/\.pdf$/i.test(x.name)),imgs=L.filter(x=>!pdfs.includes(x)&&/^image\//.test(x.type||"image/"));
  if(!pdfs.length&&!imgs.length){toast("Escolha fotografias ou ficheiros PDF");return}
  const box=ecoModal(`<h2>A guardar a fatura…</h2><p class="hint" id="ecfProg">A preparar…</p>`);const prog=t=>{const e=box.querySelector("#ecfProg");if(e)e.textContent=t};
  const novas=[];
  try{const grupos=f?[{f,files:pdfs.concat(imgs)}]:pdfs.map(x=>({f:null,files:[x]})).concat(imgs.length?[{f:null,files:imgs}]:[]);
    let gi=0;for(const G of grupos){gi++;let fat=G.f;const nova=!fat;
      if(nova)fat={id:uid()+uid(),estado:"porlancar",tipo:"",n:"",data:"",nif:"",forn:"",fornNome:"",atcud:"",base:"",iva:"",total:"",tx:"",enc:"",obs:"",linhas:[],fich:[],origem:"",cr:Date.now(),por:String(EU&&EU.email||"")};
      let fi=0;for(const file of G.files){fi++;const pre=grupos.length>1?`Fatura ${gi} de ${grupos.length} · `:"";
        if(/pdf$/i.test(file.type)||/\.pdf$/i.test(file.name)){prog(pre+"a ler o PDF…");const r=await ecfPdfLer(file);ecfAplicar(fat,r.qr,ecfTexto(r.txt));if(!fat.origem)fat.origem="pdf";
          prog(pre+"a guardar o PDF…");await ecfEnviar(fat,file,"application/pdf",file.name)}
        else{prog(pre+(G.files.length>1?`página ${fi} de ${G.files.length}: `:"")+"a preparar a fotografia…");const im=await ecfImagem(file);
          if(!fat.qr&&im.cv){prog(pre+"a procurar o QR code da fatura…");const q=await ecfQrDe(im.cv);if(q)ecfAplicar(fat,q,null)}if(!fat.origem)fat.origem="foto";
          prog(pre+"a guardar a fotografia…");await ecfEnviar(fat,im.blob,im.tipo,file.name||"fotografia.jpg")}}
      if(!fat.data)fat.data=ecoHoje();if(!fat.tipo)fat.tipo="FT";
      if(nova){ECF.fat.push(fat);novas.push(fat)}ecfGuardar(fat)}
    box.remove()}
  catch(e){box.remove();novas.forEach(x=>ecfGuardar(x));toast("Não foi possível guardar o ficheiro: "+(e.message||e));if(curTab==="ecoFat")ecoFatUI();return}
  if(curTab==="ecoFat")ecoFatUI();
  if(f){toast("Página juntada à fatura");ecfAbrir(f);return}
  if(novas.length===1){const x=novas[0];toast(x.lido==="qr"?"Fatura lida pelo QR code — confirme os dados":x.lido?"Confirme os dados lidos da fatura":"Fatura guardada — preencha os dados");ecfAbrir(x)}
  else{toast(`${novas.length} faturas guardadas, por lançar`);if(curTab!=="ecoFat")show("ecoFat")}}

// ---------- lista ----------
function ecfFiltradas(){const U=ECF_UI,q=norm(U.q||"");return ECF.fat.filter(f=>{if(U.est){if(f.estado!==U.est)return false}else if(f.estado==="anulada")return false;
  if(U.mes&&String(f.data||"").slice(0,7)!==U.mes)return false;
  if(q){const h=norm([f.n,f.nif,f.atcud,ecfNome(f),f.obs,ecfTipoN(f.tipo),f.total].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}return true})
  .sort((a,b)=>String(b.data||"").localeCompare(String(a.data||""))||(b.cr||0)-(a.cr||0))}
function ecfTot(f){const t=+f.total;if(t)return t;return(+f.base||0)+(+f.iva||0)}
function ecoFatUI(){const out=$("#ecoFatOut");if(!out)return;const ed=ecoEd(),U=ECF_UI,A=ECF.fat.filter(f=>f.estado!=="anulada"),L=ecfFiltradas(),N=Math.min(L.length,U.n),mob=ecoMob();
  const hj=ecoHoje(),mes=hj.slice(0,7),[ai,af,an]=ecoPeriodoAno(),pl=A.filter(f=>f.estado==="porlancar").length;
  let tm=0,ta=0;for(const f of A){if(f.tipo==="NC")continue;const d=String(f.data||"");if(d.slice(0,7)===mes)tm+=ecfTot(f);if(d>=ai&&d<=af)ta+=ecfTot(f)}
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  const meses=ecoUniq(ECF.fat.map(f=>String(f.data||"").slice(0,7)).filter(Boolean)).sort().reverse().map(m=>({v:m,t:new Date(m+"-15").toLocaleDateString("pt-PT",{month:"long",year:"numeric"})}));
  out.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Faturas</h1><div class="sub">Fotografe a fatura com o telemóvel ou importe o PDF: o QR code é lido sozinho e a fatura fica guardada, ligada às entradas no stock.</div></div></div>
    <div class="ay-stats">${st("Por lançar",pl,pl?"faltam entrar no stock":"tudo lançado")}${st("Este mês",ecoEur(tm),"com IVA")}${st("Ano letivo",ecoEur(ta),an?esc(an):"")}${st("Faturas",A.length,`${A.filter(f=>(f.fich||[]).length).length} com ficheiro`)}</div></div>
  ${ed?`<div class="card ecf-add" id="ecfDrop"><div class="ecf-addt"><b>Juntar uma fatura</b><span class="hint" style="margin:0">${mob?"Tire uma fotografia por página (com o QR code bem visível) ou escolha o PDF.":"Arraste para aqui os PDF das faturas, ou escolha-os. No telemóvel, use «Fotografar fatura»."}</span></div>
    <div class="ecf-addb"><button class="b ecf-foto" data-ecffoto>${ECF_CAM}Fotografar fatura</button><button class="b imp" data-ecfpdf>Importar PDF</button></div>${ecfPodeSb()?"":`<div class="msg info" style="margin:10px 0 0">Para guardar faturas é preciso ter entrado com o Office 365.</div>`}</div>`:""}
  <div class="card"><div class="pp-head"><div><h2>Faturas registadas</h2><p class="hint">Nada se apaga: uma fatura errada anula-se; os ficheiros ficam guardados.</p></div><div class="pp-acts"><button class="b s eco-sopc" data-ecfxls>Excel</button></div></div>
    <div class="row fd-filtros"><label class="grow" style="min-width:200px">Procurar<input type="text" id="ecfQ" value="${esc(U.q)}" placeholder="fornecedor, n.º, NIF, ATCUD…"></label>
      <label>Estado<select data-ecff="est">${ecoOpts([{v:"porlancar",t:"Por lançar"},{v:"lancada",t:"Lançadas no stock"},{v:"semstock",t:"Sem artigos de stock"},{v:"anulada",t:"Anuladas"}],U.est,"Todas (sem anuladas)")}</select></label>
      <label>Mês<select data-ecff="mes">${ecoOpts(meses,U.mes,"Todos")}</select></label></div>
    <p class="hint">${L.length} fatura${L.length===1?"":"s"} · ${ecoEur(L.filter(f=>f.tipo!=="NC").reduce((s,f)=>s+ecfTot(f),0))} com IVA</p>
    ${!L.length?ecoVz("lista",ECF.fat.length?"Nenhuma fatura com estes filtros.":"Ainda não há faturas. Fotografe a primeira ou importe o PDF."):mob
      ?`<div class="eco-cards">${L.slice(0,N).map(f=>`<button class="eco-card" data-ecfa="${f.id}"><span class="eco-cm"><b>${esc(ecfNome(f))}</b><small>${esc(f.n||ecfTipoN(f.tipo))} · ${esc(f.data?calDM(f.data,{day:"2-digit",month:"2-digit",year:"numeric"}):"sem data")}${(f.fich||[]).length?" · "+(f.fich.length)+" fich.":""}</small></span><span class="eco-cq"><b>${ecoEur(ecfTot(f))}</b>${ecfChip(f)}</span></button>`).join("")}</div>`
      :`<div class="tw"><table class="rt eco-t"><thead><tr><th>Data</th><th>Fornecedor</th><th>Documento</th><th class="eco-r">Sem IVA</th><th class="eco-r">Total</th><th>Estado</th><th>Ficheiros</th><th></th></tr></thead><tbody>${L.slice(0,N).map(f=>`<tr data-ecfa="${f.id}" class="${f.estado==="anulada"?"eco-anul":""}"><td class="fd-nw">${esc(f.data?calDM(f.data,{day:"2-digit",month:"2-digit",year:"numeric"}):"—")}</td><td>${esc(ecfNome(f))}${f.nif?`<br><span class="hint" style="margin:0">NIF ${esc(f.nif)}</span>`:""}</td><td>${esc(f.n||"—")}<br><span class="hint" style="margin:0">${esc(ecfTipoN(f.tipo))}${f.lido==="qr"?" · lida pelo QR":""}</span></td><td class="eco-r fd-nw">${f.base!==""&&f.base!=null?ecoEur(f.base):"—"}</td><td class="eco-r fd-nw"><b>${ecoEur(ecfTot(f))}</b></td><td>${ecfChip(f)}</td><td>${(f.fich||[]).length?`${(f.fich||[]).length} ${f.fich.some(x=>/pdf/.test(x.tipo))?"PDF":"foto"+(f.fich.length>1?"s":"")}`:"—"}</td><td class="fd-nw"><button class="b s" data-ecfabrir>Abrir</button></td></tr>`).join("")}</tbody></table></div>`}
    ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ecfmais>Mostrar mais ${Math.min(100,L.length-N)} (de ${L.length-N})</button></div>`:""}</div>`}
(function(){const S=document.getElementById("ecoFat");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ecfQ"){ECF_UI.q=e.target.value;ECF_UI.n=100;clearTimeout(S._h);S._h=setTimeout(()=>{ecoFatUI();const i=$("#ecfQ");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-ecff]");if(f){ECF_UI[f.dataset.ecff]=f.value;ECF_UI.n=100;ecoFatUI()}});
  S.addEventListener("click",e=>{const b=e.target.closest("button,tr[data-ecfa]");if(!b)return;
    if(b.matches("[data-ecffoto]")){ecfFotografar();return}if(b.matches("[data-ecfpdf]")){ecfEscolherPdf();return}
    if(b.matches("[data-ecfmais]")){ECF_UI.n+=100;ecoFatUI();return}if(b.matches("[data-ecfxls]")){ecfXls(ecfFiltradas());return}
    const r=b.closest("[data-ecfa]"),f=r&&ecfFat(r.dataset.ecfa);if(f)ecfAbrir(f)});
  S.addEventListener("dragover",e=>{const d=e.target.closest("#ecfDrop");if(d&&ecoEd()){e.preventDefault();d.classList.add("on")}});
  S.addEventListener("dragleave",e=>{const d=e.target.closest("#ecfDrop");if(d)d.classList.remove("on")});
  S.addEventListener("drop",e=>{const d=e.target.closest("#ecfDrop");if(!d||!ecoEd())return;e.preventDefault();d.classList.remove("on");const L=[...(e.dataTransfer&&e.dataTransfer.files||[])];if(L.length)ecfReceber(L,null)})})();

// ---------- ficha da fatura ----------
function ecfEncsDe(forn){return ECO.enc.filter(e=>(!forn||e.forn===forn)&&e.estado!=="anulada"&&e.estado!=="recebida"||false)}
function ecfAbrir(f){ecoDatalists();const E=ecoDef(),ed=ecoEd(),ab=ed&&f.estado==="porlancar",dis=ab?"":"disabled",M=ecfMovs(f),ativos=M.filter(m=>!m.anula&&!m.anulado);
  const L=(Array.isArray(f.linhas)&&f.linhas.length?f.linhas:[{id:uid(),art:"",q:"",pu:""}]).map(l=>Object.assign({},l));
  const fornOpts=ECO.forn.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(o=>({v:o.id,t:o.nome+(o.nif?" · "+o.nif:"")}));
  const novoF=!f.forn&&(f.fornNome||f.nif);const encs=ecfEncsDe(f.forn).concat(f.enc&&!ecfEncsDe(f.forn).some(e=>e.id===f.enc)?ECO.enc.filter(e=>e.id===f.enc):[]);
  const num=v=>v===""||v===null||v===undefined||isNaN(+v)?"":String(v).replace(".",",");
  const box=ecoModal(`<div class="ecf-h"><h2>${esc(ecfTipoN(f.tipo))}${f.n?" "+esc(f.n):""}</h2>${ecfChip(f)}</div>
    ${f.lido==="qr"?`<div class="msg ok" style="margin:6px 0 10px">Dados lidos do QR code da fatura (NIF, data, n.º, ATCUD e valores). Confirme e indique os artigos.</div>`:f.lido==="texto"?`<div class="msg info" style="margin:6px 0 10px">Sem QR code legível: os dados foram lidos do texto do PDF. Confirme-os.</div>`:f.origem==="foto"&&f.estado==="porlancar"?`<div class="msg info" style="margin:6px 0 10px">Não foi possível ler o QR code da fotografia. Preencha os dados ou tire outra fotografia mais perto do QR code.</div>`:""}
    <div class="ecf-fich" id="ecfFich"></div>
    ${ed&&f.estado!=="anulada"?`<div class="fd-btns" style="margin:6px 0 4px"><button class="b s" data-ecfpag>${ECF_CAM}Mais uma página</button><button class="b s imp" data-ecfpdf2>Juntar PDF</button></div>`:""}
    <div class="pp-form fd-form">
      <label class="w2">Fornecedor<select data-ef="forn" ${dis}>${novoF?`<option value="">— novo fornecedor —</option>`:""}${ecoOpts(fornOpts,f.forn||"",novoF?undefined:"—")}</select></label>
      <label class="w2 ecf-novo"${f.forn?" hidden":""}>Nome do fornecedor novo<input type="text" data-ef="fornNome" value="${esc(f.fornNome||"")}" placeholder="fica em Compras › Fornecedores" ${dis}></label>
      <label>NIF do fornecedor<input type="text" inputmode="numeric" data-ef="nif" value="${esc(f.nif||"")}" ${dis}></label>
      <label>Tipo<select data-ef="tipo" ${dis}>${ecoOpts(ECF_TIPOS,f.tipo||"FT")}</select></label>
      <label>N.º do documento<input type="text" data-ef="n" value="${esc(f.n||"")}" placeholder="FT A/123" ${dis}></label>
      <label>Data<input type="date" data-ef="data" value="${esc(f.data||"")}" ${dis}></label>
      <label>Total sem IVA<input type="text" inputmode="decimal" data-ef="base" value="${esc(num(f.base))}" ${dis}></label>
      <label>IVA<input type="text" inputmode="decimal" data-ef="iva" value="${esc(num(f.iva))}" ${dis}></label>
      <label>Total com IVA<input type="text" inputmode="decimal" data-ef="total" value="${esc(num(f.total))}" ${dis}></label>
      <label>Taxa de IVA dos artigos (%)<input type="text" inputmode="decimal" data-ef="tx" value="${esc(num(f.tx===""||f.tx==null?E.iva:f.tx))}" ${dis}></label>
      <label>ATCUD<input type="text" data-ef="atcud" value="${esc(f.atcud||"")}" ${dis}></label>
      <label>Encomenda<select data-ef="enc" ${dis}>${ecoOpts(encs.map(e=>({v:e.id,t:e.n+" · "+(ecoFornNome(e.forn)||"sem fornecedor")})),f.enc||"","Nenhuma")}</select></label>
      <label class="w2">Observações<input type="text" data-ef="obs" value="${esc(f.obs||"")}" ${ed&&f.estado!=="anulada"?"":"disabled"}></label>
    </div>
    ${f.estado==="porlancar"?`<h3 class="fd-h3">Artigos da fatura (para o stock)</h3><p class="hint" style="margin-top:0">Só o que entra no economato. Serviços, reparações ou combustível: use «Sem artigos de stock».</p><div id="ecfLins"></div>${ab?`<button class="b s" data-ecflin style="margin-top:6px">Mais uma linha</button>`:""}`:""}
    ${M.length?`<h3 class="fd-h3">Entradas no stock</h3><div class="fd-hist">${M.map(m=>{const a=ecoArt(m.art);return `<div class="${m.anula||m.anulado?"eco-anul":""}">${ecoTipoChip(m)} <b>${ecoSinal(m)}${ecoN(Math.abs(m.q))}</b> ${esc(a?a.un||"":"")} · ${esc(a?a.nome:"(artigo apagado)")} · ${ecoEur(Math.abs(+m.q||0)*(+m.pu||0))}</div>`}).join("")}</div>`:""}
    <div id="ecfMsg"></div>
    <p class="hint fd-meta">Registada ${f.cr?esc(new Date(f.cr).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):"—"}${f.por?" por "+esc(f.por):""}${f.em?" · alterada "+esc(new Date(f.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):""}</p>
    <div class="fd-btns ecf-btns"><span class="hint" id="ecfTot" style="margin:0"></span><span class="grow"></span>
      ${ab&&!M.length?`<button class="b s danger" data-ecfanul>Anular fatura</button><button class="b s" data-ecfsem>Sem artigos de stock</button>`:""}
      ${ed&&f.estado==="semstock"?`<button class="b s" data-ecfvolta>Voltar a «por lançar»</button>`:""}
      ${ed&&f.estado==="lancada"&&ativos.length?`<button class="b s danger" data-ecfdesl>Anular o lançamento</button>`:""}
      <button class="b s" data-ecofechar>Fechar</button>${ed&&f.estado!=="anulada"?`<button class="b s" data-ecfguardar>Guardar</button>`:""}${ab?`<button class="b" data-ecflancar>Lançar no stock</button>`:""}</div>`,(ev,bx)=>{const b=ev.target.closest("button");if(!b)return;
      if(b.matches("[data-ecfpag]")){ler();ecfGravarCab(f);bx.remove();ecfFotografar(f);return}
      if(b.matches("[data-ecfpdf2]")){ler();ecfGravarCab(f);bx.remove();ecfEscolherPdf(f);return}
      if(b.matches("[data-ecflin]")){ler();L.push({id:uid(),art:"",q:"",pu:""});desenhar();const i=[...bx.querySelectorAll("[data-efl=a]")].pop();if(i)i.focus();return}
      if(b.dataset.ecflx){ler();const i=L.findIndex(x=>x.id===b.dataset.ecflx);if(i>=0)L.splice(i,1);if(!L.length)L.push({id:uid(),art:"",q:"",pu:""});desenhar();return}
      if(b.matches("[data-ecfguardar]")){ler();if(ecfGravarCab(f)===false)return;bx.remove();ecfDepois("Fatura guardada");return}
      if(b.matches("[data-ecfsem]")){ler();if(ecfGravarCab(f)===false)return;f.estado="semstock";ecfGuardar(f);bx.remove();ecfDepois("Fatura registada (sem artigos de stock)");return}
      if(b.matches("[data-ecfvolta]")){f.estado="porlancar";ecfGuardar(f);bx.remove();ecfAbrir(f);return}
      if(b.matches("[data-ecfanul]")){if(!confirm("Anular esta fatura? Fica registada como anulada (com os ficheiros)."))return;ler();ecfGravarCab(f,true);f.estado="anulada";ecfGuardar(f);bx.remove();ecfDepois("Fatura anulada");return}
      if(b.matches("[data-ecfdesl]")){if(!confirm("Anular o lançamento desta fatura no stock?\n\nEntram movimentos ao contrário (ficam todos registados) e a fatura volta a «por lançar»."))return;ecfDeslancar(f);bx.remove();ecfDepois("Lançamento anulado");ecfAbrir(f);return}
      if(b.matches("[data-ecflancar]")){ler();if(ecfGravarCab(f)===false)return;if(ecfLancar(f,bx)){bx.remove();ecfDepois("Fatura lançada no stock")}}},true);
  const H=k=>box.querySelector(`[data-ef="${k}"]`);
  function ler(){if(!ed||f.estado==="anulada")return;const g=k=>{const x=H(k);return x?x.value:undefined};
    if(ab){const n=k=>{const v=ecoNum(g(k));return isNaN(v)?"":Math.round(v*100)/100};f.forn=g("forn")||"";f.fornNome=f.forn?"":String(g("fornNome")||"").trim();f.nif=ecfDig(g("nif"));f.tipo=g("tipo");f.n=String(g("n")||"").trim();f.data=g("data")||f.data;
      f.base=n("base");f.iva=n("iva");f.total=n("total");const t=ecoNum(g("tx"));f.tx=isNaN(t)?"":t;f.atcud=String(g("atcud")||"").trim();f.enc=g("enc")||""}
    f.obs=String(g("obs")||"").trim();
    box.querySelectorAll("[data-eflk]").forEach(r=>{const l=L.find(x=>x.id===r.dataset.eflk);if(!l)return;const v=r.querySelector("[data-efl=a]").value,a=ecoArtDe(v);l.txt=v;l.art=a?a.id:"";l.q=r.querySelector("[data-efl=q]").value;l.pu=r.querySelector("[data-efl=p]").value});
    f.linhas=L.filter(l=>l.art||String(l.txt||"").trim()||String(l.q||"").trim()).map(l=>({id:l.id,art:l.art,txt:l.art?"":l.txt||"",q:l.q,pu:l.pu}))}
  function desenhar(){const el=box.querySelector("#ecfLins");if(!el)return;
    el.innerHTML=`<div class="eco-lin eco-lh ent"><span>Artigo</span><span>Quantidade</span><span>Preço unit. (sem IVA)</span><span></span></div>`+L.map(l=>{const a=ecoArt(l.art);
      return `<div class="eco-lin ent" data-eflk="${l.id}"><input type="text" data-efl="a" list="ecoArtDL" value="${esc(a?ecoArtTxt(a):l.txt||"")}" placeholder="código, nome ou leitor" ${dis}><input type="text" inputmode="decimal" data-efl="q" value="${esc(l.q??"")}" placeholder="${a?esc(a.un||""):""}" ${dis}><input type="text" inputmode="decimal" data-efl="p" value="${esc(l.pu??"")}" placeholder="${a&&(a.pu0||ecoSt(a.id).ult)?esc(ecoN(a.pu0||ecoSt(a.id).ult)):"0,00"}" ${dis}>${ab?`<button class="b s" data-ecflx="${l.id}" title="Tirar esta linha" aria-label="Tirar">×</button>`:"<span></span>"}</div>`}).join("");tot()}
  function tot(){const t=box.querySelector("#ecfTot");if(!t||f.estado!=="porlancar"){if(t)t.textContent="";return}let n=0,v=0;
    box.querySelectorAll("[data-eflk]").forEach(r=>{const a=ecoArtDe(r.querySelector("[data-efl=a]").value),q=ecoNum(r.querySelector("[data-efl=q]").value);let p=ecoNum(r.querySelector("[data-efl=p]").value);if(!a||!(q>0))return;if(isNaN(p))p=+a.pu0||ecoSt(a.id).ult||0;n++;v+=q*p});
    const b=ecoNum((H("base")||{}).value);t.innerHTML=n?`${n} artigo${n===1?"":"s"} · ${ecoEur(v)} sem IVA${b>0&&Math.abs(b-v)>.05?` <span class="eco-ko">(a fatura diz ${ecoEur(b)})</span>`:""}`:""}
  box.addEventListener("input",e=>{if(e.target.closest("[data-eflk]")||e.target.dataset.ef==="base"){const r=e.target.closest("[data-eflk]");if(r&&e.target.dataset.efl==="a"){ler();const l=L.find(x=>x.id===r.dataset.eflk);if(l&&l.art){desenhar();const n=box.querySelector(`[data-eflk="${l.id}"] [data-efl=q]`);if(n)n.focus();return}}tot()}});
  box.addEventListener("change",e=>{const k=e.target.dataset.ef;
    if(k==="forn"){const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=!!e.target.value;const fo=ecoForn(e.target.value);if(fo&&fo.nif&&H("nif"))H("nif").value=fo.nif;
      const s=H("enc");if(s){const cur=s.value;s.innerHTML=ecoOpts(ecfEncsDe(e.target.value).map(x=>({v:x.id,t:x.n+" · "+(ecoFornNome(x.forn)||"sem fornecedor")})),cur,"Nenhuma")}}
    if(k==="nif"&&!H("forn").value){const fo=ecfFornPorNif(e.target.value);if(fo){H("forn").value=fo.id;const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=true}}
    if(k==="enc"&&e.target.value){const en=ECO.enc.find(x=>x.id===e.target.value);ler();
      if(en&&!L.some(l=>l.art)){L.length=0;(en.linhas||[]).forEach(l=>{const fl=(+l.q||0)-(+l.rec||0);if(l.art&&fl>0)L.push({id:uid(),art:l.art,q:ecoN(fl),pu:l.pu===""||l.pu==null?"":String(l.pu).replace(".",",")})});if(!L.length)L.push({id:uid(),art:"",q:"",pu:""});desenhar()}
      if(en&&en.forn&&!H("forn").value){H("forn").value=en.forn;const nv=box.querySelector(".ecf-novo");if(nv)nv.hidden=true}}});
  box.addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.dataset&&e.target.dataset.efl){e.preventDefault();ler();const l=L[L.length-1];if(l&&l.art&&l.q){L.push({id:uid(),art:"",q:"",pu:""});desenhar();const i=[...box.querySelectorAll("[data-efl=a]")].pop();if(i)i.focus()}}});
  desenhar();ecfMiniaturas(f,box.querySelector("#ecfFich"));return box}
function ecfDepois(t){toast(t);if(curTab==="ecoFat")ecoFatUI();else if(curTab&&/^eco[A-Z]/.test(curTab))ecoRender(curTab)}
// grava o cabeçalho: cria o fornecedor novo (com o NIF) e avisa se a mesma fatura já está registada
function ecfGravarCab(f,semAviso){if(!ecoEd())return false;
  if(f.estado==="porlancar"&&!f.forn&&(f.fornNome||f.nif)){const ja=ecfFornPorNif(f.nif);
    if(ja)f.forn=ja.id;else if(f.fornNome){const fo={id:uid()+uid(),nome:f.fornNome,nif:f.nif||"",contacto:"",email:"",tel:"",cr:Date.now()};ECO.forn.push(fo);ecoGuardar(fo);f.forn=fo.id;toast("Fornecedor novo: "+fo.nome)}
    if(f.forn)f.fornNome=""}
  if(!semAviso&&f.n){const d=ECF.fat.find(x=>x!==f&&x.estado!=="anulada"&&x.n&&norm(x.n)===norm(f.n)&&((x.forn&&x.forn===f.forn)||(x.nif&&x.nif===f.nif)));
    if(d&&!f._dupOk){if(!confirm(`Já está registada uma fatura ${d.n} deste fornecedor (${d.data?calDMA(d.data):"sem data"}).\n\nGuardar esta também?`))return false;f._dupOk=1}}
  const o=Object.assign({},f);delete o._dupOk;Object.assign(f,o);ecfGuardar(f);return true}
function ecfLancar(f,bx){const msg=t=>{const el=bx.querySelector("#ecfMsg");if(el)el.innerHTML=t?`<div class="msg bad" style="margin:10px 0 0">${t}</div>`:""};
  if(f.tipo==="NC")return msg("Uma nota de crédito não entra no stock. Guarde-a ou marque «Sem artigos de stock»; se o material foi devolvido, registe um abate."),false;
  const ok=[],bad=[];for(const l of f.linhas||[]){const q=ecoNum(l.q),a=ecoArt(l.art);if(!a){if(String(l.txt||"").trim())bad.push(`«${esc(l.txt)}» não é um artigo do economato (crie-o em Artigos)`);continue}
    if(!(q>0)){bad.push(`falta a quantidade de ${esc(a.nome)}`);continue}let p=ecoNum(l.pu);if(isNaN(p))p=+a.pu0||ecoSt(a.id).ult||0;ok.push({a,q,pu:p})}
  if(bad.length)return msg(bad.join("<br>")),false;if(!ok.length)return msg("Indique os artigos que entram no stock (ou use «Sem artigos de stock»)."),false;
  const soma=ok.reduce((s,o)=>s+o.q*o.pu,0),b=+f.base||0;
  if(b>0&&Math.abs(b-soma)>.05&&!confirm(`A soma das linhas (${ecoEur(soma)}) não bate com o total sem IVA da fatura (${ecoEur(b)}).\n\nLançar mesmo assim?`))return false;
  const g=uid()+uid(),en=f.enc?ECO.enc.find(x=>x.id===f.enc):null,tx=f.tx===""||f.tx==null?ecoDef().iva:+f.tx;
  const novos=ok.map(o=>ecoMov({g,tipo:"ent",data:f.data||ecoHoje(),art:o.a.id,q:o.q,pu:o.pu,doc:f.n||"",forn:f.forn||"",iva:tx,fat:f.id,enc:en?en.id:"",obs:en?"Encomenda "+en.n:(f.n?"":"Fatura sem número")}));
  for(const o of ok)if(f.forn&&!o.a.forn){o.a.forn=f.forn;ecoGuardar(o.a)}
  if(en){for(const o of ok){const l=(en.linhas||[]).find(x=>x.art===o.a.id&&(+x.rec||0)<(+x.q||0))||(en.linhas||[]).find(x=>x.art===o.a.id);if(l)l.rec=(+l.rec||0)+o.q}
    en.estado=(en.linhas||[]).every(l=>!l.art||(+l.rec||0)>=(+l.q||0))?"recebida":"parcial";ecoGuardar(en)}
  novos.forEach(m=>ecoGuardar(m));f.g=g;f.estado="lancada";ecfGuardar(f);return true}
function ecfDeslancar(f){const M=ecfMovs(f).filter(m=>!m.anula&&!m.anulado),en=f.enc?ECO.enc.find(x=>x.id===f.enc):null;
  for(const m of M){ecoAnular(m);if(en){const l=(en.linhas||[]).find(x=>x.art===m.art&&(+x.rec||0)>0);if(l)l.rec=Math.max(0,(+l.rec||0)-(+m.q||0))}}
  if(en){const L=en.linhas||[];en.estado=L.every(l=>!(+l.rec>0))?"enviada":L.every(l=>!l.art||(+l.rec||0)>=(+l.q||0))?"recebida":"parcial";ecoGuardar(en)}
  f.estado="porlancar";f.g="";ecfGuardar(f)}
function ecfXls(L){ecoXls("Econo360 faturas",[["Faturas",L.map(f=>({"Data":f.data||"","Fornecedor":ecfNome(f),"NIF":f.nif||"","Tipo":ecfTipoN(f.tipo),"N.º":f.n||"","ATCUD":f.atcud||"",
  "Sem IVA":f.base===""||f.base==null?"":+f.base,"IVA":f.iva===""||f.iva==null?"":+f.iva,"Total":ecfTot(f),"Estado":(ECF_EST[f.estado]||{}).t||f.estado,"Encomenda":f.enc?((ECO.enc.find(e=>e.id===f.enc)||{}).n||""):"",
  "Ficheiros":(f.fich||[]).length,"Observações":f.obs||"","Registada por":f.por||""})),[12,30,12,18,18,18,12,12,12,20,14,10,30,26]]])}
