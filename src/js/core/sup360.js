/* ===================== 0.9.223: «360» sempre sobrescrito (EPISJ³⁶⁰, Escola³⁶⁰, PAP³⁶⁰…) =====================
   Pedido do diretor: «em toda a app e todos os logos põe o 360 sobrescrito».
   - Logótipos e nomes dos módulos no HTML: <b class="sup360">360</b> / <i class="sup360">360</i> (estilo em css/app.css › .sup360; não usar «s360», que é a classe do body no Social360).
   - Todo o texto que aparece no ecrã (também o que os módulos desenham depois, e as janelas do Horários360 e do Social360):
     sup360Aplicar() troca «EPISJ 360», «Box360», «Horários360»… por «EPISJ<sup>360</sup>». Não mexe em campos de escrita,
     listas de escolha (<option> não aceita HTML), código, SVG nem endereços (episj360.episj.com fica igual).
   - Título do separador do navegador e nome no ecrã principal do telemóvel: algarismos sobrescritos Unicode (³⁶⁰).
   - PDF: pdfTxt360() desenha o 360 mais pequeno e subido (rodapé de todos os documentos).
   Só `function`/`var` aqui (regra do arranque). */
var S360_RE=/(EPISJ|Escola|ESCOLA|Box|BOX|Hor[aá]rios?|HOR[AÁ]RIOS?|Sala|SALA|Crono|CRONO|Social|SOCIAL|PAP|Pass|PASS|Folder|FOLDER|Econo|ECONO) ? ?360(?![\w@\/-]|\.[a-z])/g;
var S360_SALTA={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,SELECT:1,OPTION:1,CODE:1,PRE:1,NOSCRIPT:1,TITLE:1,SUP:1};
var S360_OBS=null;
function sup360Uni(t){return String(t||"").replace(S360_RE,"$1³⁶⁰")}
function sup360No(n){for(let e=n.parentNode;e&&e.nodeType===1;e=e.parentNode){if(S360_SALTA[e.nodeName.toUpperCase()]||e.isContentEditable||e.namespaceURI==="http://www.w3.org/2000/svg"||(e.classList&&(e.classList.contains("sup360")||e.classList.contains("sup360-nao"))))return false}return true}
function sup360Texto(n){const t=n.nodeValue;if(!t||t.indexOf("360")<0||!n.parentNode)return; // 0.9.241: texto já trocado entretanto (mudou duas vezes seguidas)
S360_RE.lastIndex=0;if(!S360_RE.test(t)||!sup360No(n))return;
  S360_RE.lastIndex=0;const doc=n.ownerDocument,f=doc.createDocumentFragment();let i=0,m;
  while((m=S360_RE.exec(t))){f.appendChild(doc.createTextNode(t.slice(i,m.index)+m[1]));const s=doc.createElement("sup");s.className="sup360";s.textContent="360";f.appendChild(s);i=m.index+m[0].length}
  f.appendChild(doc.createTextNode(t.slice(i)));n.parentNode.replaceChild(f,n)}
function sup360Aplicar(raiz){if(!raiz)return;if(raiz.nodeType===3){sup360Texto(raiz);return}
  if(raiz.nodeType!==1&&raiz.nodeType!==9&&raiz.nodeType!==11)return;
  const doc=raiz.ownerDocument||raiz,w=doc.createTreeWalker(raiz,4,{acceptNode:n=>n.nodeValue&&n.nodeValue.indexOf("360")>=0?1:3}),L=[];
  while(w.nextNode())L.push(w.currentNode);L.forEach(sup360Texto)}
function sup360Observar(doc){if(!doc||!doc.body||doc.__s360)return;doc.__s360=1;sup360Aplicar(doc.body);
  const ob=new MutationObserver(R=>{for(const r of R){if(r.type==="characterData")sup360Texto(r.target);else r.addedNodes.forEach(sup360Aplicar)}});
  ob.observe(doc.body,{childList:true,subtree:true,characterData:true});if(doc===document)S360_OBS=ob}
// janelas da mesma origem (Horários360, Social360): aplicar também lá dentro, a cada carregamento
function sup360Janelas(){document.querySelectorAll("iframe").forEach(fr=>{if(fr.__s360)return;fr.__s360=1;const ir=()=>{try{const d=fr.contentDocument;if(d&&d.body)sup360Observar(d)}catch(e){}};
  fr.addEventListener("load",ir);ir()})}
function sup360Titulo(){try{const t=document.title,u=sup360Uni(t);if(u!==t)document.title=u}catch(e){}}
function sup360Iniciar(){sup360Titulo();sup360Observar(document);sup360Janelas();
  try{new MutationObserver(sup360Titulo).observe(document.querySelector("title"),{childList:true,characterData:true,subtree:true})}catch(e){}
  try{new MutationObserver(sup360Janelas).observe(document.body,{childList:true,subtree:true})}catch(e){}}
// PDF: texto com o «360» sobrescrito, alinhado à esquerda em (x,y); devolve a largura
function pdfTxt360(doc,t,x,y){const s=String(t||""),fs=doc.getFontSize();S360_RE.lastIndex=0;let i=0,m,cx=x;
  const tx=p=>{if(p){doc.text(p,cx,y);cx+=doc.getTextWidth(p)}};
  while((m=S360_RE.exec(s))){tx(s.slice(i,m.index)+m[1]);doc.setFontSize(fs*.62);doc.text("360",cx+.15,y-fs*.32*.3528);cx+=doc.getTextWidth("360")+.3;doc.setFontSize(fs);i=m.index+m[0].length}
  tx(s.slice(i));return cx-x}
sup360Iniciar();
