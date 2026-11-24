/* Ofício360 — ecrã do módulo (carregado só quando o Ofício360 é aberto; os dados estão em oficio/oficio-dados.js) */
var OF_B="oficios",OF_URL=new Map(),ofQH,ofRH;
var OF_ICO={carta:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
  ent:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',sai:'<svg viewBox="0 0 24 24"><path d="M12 21V9M7 14l5-5 5 5M5 3h14"/></svg>',
  clip:'<svg viewBox="0 0 24 24"><path d="m21 11-8.5 8.5a5 5 0 0 1-7-7L14 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7"/></svg>',
  pdf:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>'};
function ofVz(ic,t){return `<div class="pp-vz"><i>${OF_ICO[ic]||OF_ICO.carta}</i><div>${t}</div></div>`}
function ofChip(r){if(r.anulado)return `<span class="pp-chip ba">Anulado</span>`;const e=ofEstado(r);return `<span class="pp-chip ${e.k}">${esc(e.t)}</span>`+(ofAtraso(r)?' <span class="pp-chip ba">prazo passou</span>':"")}
function ofTipoTxt(r){return r.tipo==="ent"?"Entrada":"Saída"}
function ofUniq(L){return[...new Set(L.filter(x=>x&&String(x).trim()))]}
function ofOpts(L,v,vazio){return(vazio!==undefined?`<option value="">${esc(vazio)}</option>`:"")+L.map(x=>{const o=typeof x==="object"?x:{v:x,t:x};return `<option value="${esc(o.v)}"${String(o.v)===String(v)?" selected":""}>${esc(o.t)}</option>`}).join("")}
function ofModal(html,onClick,larga){const box=document.createElement("div");box.className="fd-modal of-modal";box.innerHTML=`<div class="card fd-mcard${larga?" of-mlarga":""}">${html}</div>`;document.body.appendChild(box);
  box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-offechar]")){box.remove();return}if(onClick)onClick(e,box)});
  setTimeout(()=>{const i=box.querySelector("input:not([type=checkbox]):not([readonly]),select,textarea");if(i)i.focus()},40);return box}
function ofSel(){return OFI.reg.find(r=>r.id===OF_UI.sel)||null}
function ofHist(r,txt){(r.hist=r.hist||[]).push({t:Date.now(),por:String(EU&&EU.email||""),txt})}
function ofFormadores(){let P=[];try{P=(cfg.profs||[]).slice().sort(cmpProf).map(p=>({v:profEmail(p),t:(p.cod?`(${p.cod}) `:"")+p.nome}))}catch(e){}return P.filter(p=>p.v)}
function ofDataPT(s){return s?calDMA(s):"—"}
function ofDataC(s){if(!s)return"";const[y,m,d]=String(s).split("-");return d&&m&&y?`${d}-${m}-${y}`:s}

function ofRender(t){ofCarregar().then(()=>{try{ofDef();
  document.querySelectorAll("[data-ofdir]").forEach(x=>x.disabled=!ofEd());
  if(t==="ofInicio")ofInicioUI();else if(t==="ofRedigir")ofRedUI();else if(t==="ofEnt")ofEntUI();else if(t==="ofLivro")ofLivUI();else if(t==="ofDef")ofDefUI()}
  catch(e){console.warn("Ofício360",e)}})}

// ================= Correspondência (início): números, filtros, lista e ficha =================
function ofFiltrados(){const U=OF_UI,q=norm(U.q||""),hj=ofHoje();return OFI.reg.filter(r=>{
  if(U.tipo&&r.tipo!==U.tipo)return false;if(U.via&&r.via!==U.via)return false;if(U.ano&&r.ciclo!==U.ano&&!(r.tipo==="sai"&&!r.n&&U.ano===ofCiclo()))return false;if(U.classif&&r.classif!==U.classif)return false;
  if(U.estado){if(U.estado==="aberto"&&!ofAberto(r))return false;if(U.estado==="atraso"&&!ofAtraso(r))return false;if(U.estado==="rasc"&&!(r.tipo==="sai"&&r.estado==="rasc"))return false;
    if(U.estado==="anulado"&&!r.anulado)return false;if(U.estado==="semanexo"&&(r.anexos||[]).length)return false;if(U.estado==="semresp"&&!(r.tipo==="ent"&&!r.anulado&&r.estado!=="resp"&&r.estado!=="arq"))return false}
  if(q){const d=r.dest||{},h=norm([r.num,r.assunto,ofQuem(r),r.email,r.refExt,r.classif,r.proc,r.obs,r.desp,r.ctt,d.nome,d.org,d.cargo,ofVia(r.via)].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}
  return true}).sort(ofCmp)}
function ofInicioUI(){const R=OFI.reg,c=ofCiclo(),U=OF_UI;
  const ent=R.filter(r=>r.tipo==="ent"&&r.ciclo===c&&!r.anulado),sai=R.filter(r=>r.tipo==="sai"&&r.ciclo===c&&!r.anulado),ab=R.filter(ofAberto),at=R.filter(ofAtraso),rasc=R.filter(r=>r.tipo==="sai"&&r.estado==="rasc"&&!r.anulado);
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  const ult=sai.filter(r=>r.n).sort((a,b)=>b.n-a.n)[0];
  $("#ofHero").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Ofícios</h1><div class="sub">Correspondência oficial da escola, em carta e digital: o que entra, o que sai, a numeração, os prazos de resposta e os documentos de cada ofício.</div></div><span class="grow"></span>
    ${ab.length?`<div class="ay-pct"><b>${ab.length}</b>por tratar</div>`:""}</div>
    <div class="ay-stats">${st("Entradas em "+esc(c),ent.length)}${st("Saídas em "+esc(c),sai.length,ult?"último: "+esc(ult.num):"")}${st("Por tratar",ab.length,at.length?`${at.length} com o prazo passado`:"nenhum com o prazo passado")}${st("Rascunhos",rasc.length,rasc.length?"ofícios ainda sem número":"")}${st("Entidades",OFI.ent.length)}</div></div>`;
  const D=ofDef(),ciclos=ofUniq(R.map(r=>r.ciclo).concat([c])).sort((a,b)=>COLL_PTN.compare(b,a));
  $("#ofFiltros").innerHTML=`<label class="grow" style="min-width:220px">Procurar<input type="text" id="ofQ" value="${esc(U.q)}" placeholder="n.º, assunto, entidade, referência, n.º de registo dos CTT…"></label>
    <label>Tipo<select data-off="tipo">${ofOpts([{v:"ent",t:"Entradas"},{v:"sai",t:"Saídas"}],U.tipo,"Entradas e saídas")}</select></label>
    <label>Situação<select data-off="estado">${ofOpts([{v:"aberto",t:"Por tratar"},{v:"atraso",t:"Prazo passado"},{v:"semresp",t:"Entradas sem resposta"},{v:"rasc",t:"Rascunhos"},{v:"semanexo",t:"Sem documento"},{v:"anulado",t:"Anulados"}],U.estado,"Todas")}</select></label>
    <label>Via<select data-off="via">${ofOpts(OF_VIAS,U.via,"Todas")}</select></label>
    <label>Ano<select data-off="ano">${ofOpts(ciclos,U.ano,"Todos")}</select></label>
    <label>Classificação<select data-off="classif">${ofOpts(ofUniq(D.classif.concat(R.map(r=>r.classif))),U.classif,"Todas")}</select></label>`;
  ofListaUI();ofFichaUI()}
function ofListaUI(){const L=ofFiltrados(),U=OF_UI,N=Math.min(L.length,U.n);
  $("#ofAcoes").innerHTML=`<span class="hint" style="margin:0">${L.length} ofício${L.length===1?"":"s"}${L.length!==OFI.reg.length?" (filtrados)":""}</span><span class="grow"></span>
    <button class="b s" data-ofxls title="Exportar a lista para Excel">Excel</button><button class="b s" data-ofir="ofLivro" title="Livro de registo em PDF">Livro de registo</button>`;
  $("#ofLista").innerHTML=L.length?`<div class="tw"><table class="rt fd-t of-t"><thead><tr><th>N.º</th><th>Data</th><th>Entidade</th><th>Assunto</th><th>Via</th><th>Situação</th></tr></thead><tbody>${L.slice(0,N).map(r=>{const nA=(r.anexos||[]).length;
      return `<tr data-of="${r.id}" class="${U.sel===r.id?"on":""}${r.anulado?" of-anul":""}"><td class="fd-nw"><span class="of-tp ${r.tipo}" title="${ofTipoTxt(r)}">${OF_ICO[r.tipo]}</span><b class="of-num">${esc(r.num||"sem n.º")}</b>${ofRepetido(r)?' <span class="pp-chip ba" title="Há outro ofício com o mesmo número">repetido</span>':""}</td>
        <td class="fd-nw">${esc(calDM(r.data,{day:"numeric",month:"short",year:"numeric"}))}</td><td class="fd-cur"><span>${esc(ofQuem(r)||"—")}</span></td>
        <td>${esc(r.assunto||"(sem assunto)")}${nA?` <span class="of-clip" title="${nA} documento${nA===1?"":"s"}">${OF_ICO.clip}${nA>1?nA:""}</span>`:""}</td><td class="fd-nw">${esc(ofVia(r.via))}</td><td>${ofChip(r)}</td></tr>`}).join("")}</tbody></table></div>
      ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-ofmais>Mostrar mais ${Math.min(150,L.length-N)} (de ${L.length-N})</button></div>`:""}`
    :ofVz("carta",OFI.reg.length?"Nenhum ofício com estes filtros.":!OF_SINC?"A trazer os ofícios guardados na nuvem…":"Ainda não há ofícios registados."+(ofEd()?` Registe a primeira entrada, redija um ofício ou traga o livro de registo que já existe:<br><span class="row" style="gap:8px;justify-content:center;margin-top:10px"><label class="b imp">Importar livro de registo (Excel)<input type="file" accept=".xlsx,.xls,.csv,.ods" data-ofimpxls hidden></label></span>`:""))}

function ofFichaUI(){const r=ofSel(),el=$("#ofFicha");if(!el)return;
  if(!r){el.innerHTML=`<div class="card fd-fvz">${ofVz("carta","Escolha um ofício da lista para ver os dados, os documentos e o despacho.")}</div>`;return}
  const D=ofDef(),ed=ofEd()&&!r.anulado,dis=ed?"":"disabled",E=r.tipo==="ent";
  const inp=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-ofk="${k}" value="${esc(r[k]||"")}"${o&&o.dl?` list="${o.dl}"`:""}${o&&o.ph?` placeholder="${esc(o.ph)}"`:""} ${dis}></label>`;
  const resp=OFI.reg.filter(x=>x.respondeA===r.id),orig=r.respondeA?OFI.reg.find(x=>x.id===r.respondeA):null;
  el.innerHTML=`<div class="card fd-ficha of-ficha">
    <div class="fd-fh"><div><div class="fd-fcod"><span class="of-tp ${r.tipo}">${OF_ICO[r.tipo]}</span> ${esc(r.num||"Rascunho sem número")}</div><div class="hint" style="margin:2px 0 0">${ofTipoTxt(r)} · ${esc(ofVia(r.via)||"via por indicar")} · ${esc(ofDataPT(r.data))}</div></div><span class="grow"></span>${ofChip(r)}</div>
    ${r.anulado?`<div class="msg bad" style="margin:8px 0">Anulado${r.anulMot?": "+esc(r.anulMot):""}. O número fica no livro de registo e não volta a ser usado.</div>`:""}
    ${orig?`<div class="msg info" style="margin:8px 0">Responde à entrada <a href="#" data-ofabrir="${orig.id}"><b>${esc(orig.num||"")}</b></a> · ${esc(orig.assunto||"")}</div>`:""}
    <div class="pp-form fd-form">
      ${inp("data",E?"Data de entrada":"Data do ofício",{type:"date"})}${E?inp("dataDoc","Data do documento",{type:"date"}):inp("dataEnv","Data de envio",{type:"date"})}
      <label>Via<select data-ofk="via" ${dis}>${ofOpts(OF_VIAS,r.via||"","—")}</select></label>
      <label>Situação<select data-ofk="estado" ${dis}>${ofOpts(OF_EST[r.tipo],r.estado||"")}</select></label>
      ${E?"":`<label class="w2">Departamento (dá a abreviatura do n.º)<select data-ofk="dep" ${dis}>${ofDepOpts(r.dep)}</select></label>`}
      <label class="w2">${E?"Remetente":"Destinatário"} (entidade)<input type="text" data-ofk="entNome" value="${esc(ofQuem(r))}" list="ofEntDL" placeholder="escreva ou escolha uma entidade" ${dis}></label>
      ${inp("email","Email",{type:"email",ph:"para responder ou enviar por email"})}${inp("refExt",E?"Referência do remetente":"Sua referência",{ph:E?"n.º do ofício recebido":""})}
      ${inp("assunto","Assunto",{w2:1})}
      <label>Classificação<select data-ofk="classif" ${dis}>${ofOpts(ofUniq(D.classif.concat([r.classif])),r.classif||"","—")}</select></label>${inp("proc","Processo / pasta",{ph:"ex.: 2026/FSE/012"})}
      ${!E&&(r.via==="registada"||r.via==="ar")?inp("ctt","N.º de registo dos CTT",{ph:"RR123456789PT"})+`<label class="fd-ck"><input type="checkbox" data-ofk="arOk"${r.arOk?" checked":""} ${dis}> Aviso de receção devolvido</label>`:""}
      ${E?`<label class="w2">Despacho<textarea data-ofk="desp" rows="2" placeholder="ex.: À Direção Pedagógica, para informar." ${dis}>${esc(r.desp||"")}</textarea></label>
      <label>Para quem<input type="text" data-ofk="resp" value="${esc(r.resp||"")}" list="ofRespDL" placeholder="email de quem trata" ${dis}></label>${inp("prazo","Responder até",{type:"date"})}`:""}
      <label class="w2">Observações<textarea data-ofk="obs" rows="2" ${dis}>${esc(r.obs||"")}</textarea></label>
    </div>
    <h3 class="fd-h3">Documentos</h3><div class="of-anx" id="ofAnx"></div>
    ${ed?`<div class="fd-btns" style="margin-top:6px"><button class="b s" data-ofjuntar>Juntar ficheiro</button><button class="b s" data-ofdigit title="Fotografar as páginas da carta com a câmara e guardar num só PDF">Digitalizar</button>${!E&&r.n?`<button class="b s" data-ofguardarpdf title="Guarda nos documentos o PDF do ofício tal como está agora">Guardar o PDF do ofício</button>`:""}</div>`:""}
    ${E?`<h3 class="fd-h3">Resposta</h3>${resp.length?`<div class="fd-hist">${resp.map(x=>`<div><a href="#" data-ofabrir="${x.id}"><b>${esc(x.num||"rascunho")}</b></a> · ${esc(calDM(x.data,{day:"numeric",month:"short",year:"numeric"}))} · ${esc(x.assunto||"")}</div>`).join("")}</div>`:`<p class="hint" style="margin:0">Ainda sem resposta.</p>`}`:""}
    <div class="fd-btns">
      ${E?(ed?`<button class="b" data-ofresponder>Responder</button>${r.resp?`<button class="b s" data-ofavisar title="Envia um email a quem trata o ofício, com o despacho e o documento">Avisar por email</button>`:""}`:""):`<button class="b" data-ofredigir>${r.estado==="rasc"?"Continuar a redigir":"Abrir o ofício"}</button><button class="b s" data-ofpdf>PDF</button><button class="b s" data-ofword title="O ofício no Modelo de Ofício EPISJ, em Word">Word</button><button class="b s" data-ofenv title="Envelope DL de janela">Envelope</button>`}
      <span class="grow"></span>
      ${ed?(r.n?`<button class="b s danger" data-ofanular title="O ofício fica no livro, riscado; o número não volta a ser usado">Anular</button>`:`<button class="b s danger" data-ofapagar>Apagar o rascunho</button>`):""}
    </div>
    ${(r.hist||[]).length?`<h3 class="fd-h3">Histórico</h3><div class="fd-hist">${r.hist.slice(-8).reverse().map(h=>`<div>${esc(new Date(h.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))} · ${esc(h.txt)}${h.por?` <span class="hint" style="margin:0">(${esc(h.por)})</span>`:""}</div>`).join("")}</div>`:""}
    <p class="hint fd-meta">Registado ${r.cr?esc(new Date(r.cr).toLocaleDateString("pt-PT")):"—"}${r.por?" por "+esc(r.por):""} · alterado ${r.em?esc(new Date(r.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):"—"}${r.mod?" por "+esc(r.mod):""}${r.origem?" · "+esc(r.origem):""}</p>
  </div>`;
  ofAnexosUI(r,$("#ofAnx"));ofDatalists()}
function ofDatalists(){const dl=(id,L)=>{let x=document.getElementById(id);if(!x){x=document.createElement("datalist");x.id=id;document.body.appendChild(x)}x.innerHTML=L.map(v=>typeof v==="object"?`<option value="${esc(v.v)}">${esc(v.t)}</option>`:`<option value="${esc(v)}">`).join("")};
  dl("ofEntDL",ofUniq(OFI.ent.map(e=>e.org||e.nome).concat(OFI.reg.map(r=>r.entNome))).sort(COLL_PTN.compare));dl("ofRespDL",ofFormadores())}
// novo registo
function ofNovo(tipo,base){const b=base||{},D=ofDef(),hj=ofHoje();
  const r={id:uid()+uid(),tipo,n:0,ciclo:"",num:"",data:b.data||hj,dataDoc:b.dataDoc||"",via:b.via||(tipo==="ent"?"carta":"email"),dep:tipo==="sai"?String(b.dep||D.depOm||"").toUpperCase():"",sauda:"",entId:b.entId||"",entNome:b.entNome||"",email:b.email||"",
    dest:b.dest||{trat:D.trat[0]||"",nome:"",cargo:"",org:"",morada:"",cpl:""},assunto:b.assunto||"",refExt:b.refExt||"",refExtData:b.refExtData||"",classif:b.classif||"",proc:b.proc||"",
    estado:tipo==="ent"?"novo":"rasc",prazo:tipo==="ent"&&+D.prazo?calS(new Date(Date.now()+864e5*(+D.prazo))):"",resp:"",desp:"",respondeA:b.respondeA||"",ctt:"",dataEnv:"",arOk:false,
    corpo:b.corpo||"",anexosTxt:"",anexos:[],obs:"",hist:[],cr:Date.now(),por:String(EU&&EU.email||""),origem:b.origem||""};
  if(tipo==="ent"){ofNumerar(r);ofHist(r,"entrada registada com o n.º "+r.num)}else ofHist(r,"rascunho criado");
  OFI.reg.push(r);ofGuardar(r);OF_UI.sel=r.id;return r}
function ofMudar(r,k,v){const ant=r[k];
  if(k==="arOk")r.arOk=!!v;else if(k==="entNome"){r.entNome=v;const e=OFI.ent.find(x=>norm(x.org||x.nome)===norm(v));r.entId=e?e.id:"";if(e&&!r.email&&e.email)r.email=e.email;
    if(e&&r.tipo==="sai")r.dest=ofDestDe(e)}
  else r[k]=v;
  if(k==="dep"&&r.tipo==="sai"&&r.n&&ant!==v){r.num=ofNumTxt(r);ofHist(r,"departamento: "+ofDepNome(v)+" (n.º "+r.num+")")}
  if(k==="estado"&&ant!==v)ofHist(r,"situação: "+ofEstado(r).t);
  if(k==="estado"&&v!=="rasc"&&r.tipo==="sai"&&!r.n){ofNumerar(r);ofHist(r,"número atribuído: "+r.num)}
  if(k==="desp"&&v&&r.tipo==="ent"&&r.estado==="novo"){r.estado="tratar"}
  if(k==="data"&&r.n&&ofCiclo(v)!==r.ciclo)toast("Atenção: a data é de outro ano, mas o número "+r.num+" não muda.");
  ofGuardar(r)}
function ofDepOpts(v){const D=ofDef(),L=D.deps.map(d=>({v:String(d.a||"").toUpperCase(),t:`${d.n} (${String(d.a||"").toUpperCase()})`}));if(v&&!L.some(o=>o.v===String(v).toUpperCase()))L.push({v,t:v});return ofOpts(L,String(v||"").toUpperCase())}
function ofDestDe(e){return{trat:e.trat||ofDef().trat[0]||"",nome:e.nome||"",cargo:e.cargo||"",org:e.org||"",morada:e.morada||"",cpl:e.cpl||""}}
// eventos da Correspondência
(function(){const S=document.getElementById("ofInicio");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ofQ"){OF_UI.q=e.target.value;OF_UI.n=150;clearTimeout(ofQH);ofQH=setTimeout(ofListaUI,140)}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-off]");if(f){OF_UI[f.dataset.off]=f.value;OF_UI.n=150;ofInicioUI();return}
    const x=e.target.closest("[data-ofimpxls]");if(x&&x.files&&x.files[0]){ofImportarXls(x.files[0]);x.value="";return}
    const y=e.target.closest("[data-ofimpfich]");if(y&&y.files&&y.files.length){ofDeFicheiros([...y.files]);y.value="";return}
    const k=e.target.closest("[data-ofk]");if(k&&ofEd()){const r=ofSel();if(!r)return;ofMudar(r,k.dataset.ofk,k.type==="checkbox"?k.checked:k.value);
      if(["entNome","estado","via","assunto","data","desp"].includes(k.dataset.ofk)){ofListaUI();ofFichaUI()}else ofListaUI()}});
  S.addEventListener("click",async e=>{const tr=e.target.closest("tr[data-of]");if(tr&&!e.target.closest("a,button,input")){OF_UI.sel=tr.dataset.of;ofListaUI();ofFichaUI();
      if(innerWidth<1280){const f=$("#ofFicha");if(f)f.scrollIntoView({behavior:"smooth",block:"start"})}return}
    const a=e.target.closest("[data-ofabrir]");if(a){e.preventDefault();OF_UI.sel=a.dataset.ofabrir;OF_UI.q="";OF_UI.tipo="";OF_UI.estado="";ofInicioUI();return}
    const b=e.target.closest("button");if(!b)return;const r=ofSel();
    if(b.dataset.ofir){show(b.dataset.ofir);return}
    if(b.hasAttribute("data-ofmais")){OF_UI.n+=150;ofListaUI();return}
    if(b.hasAttribute("data-ofxls")){ofExcel(ofFiltrados());return}
    if(!ofEd())return;
    if(b.id==="ofNovaEnt"){ofNovo("ent");OF_UI.q="";ofInicioUI();toast("Entrada registada");return}
    if(b.id==="ofNovaSai"){const n=ofNovo("sai");OF_UI.red=n.id;show("ofRedigir");return}
    if(b.id==="ofDigitB"){ofDigitalizar(null);return}
    if(!r)return;
    if(b.hasAttribute("data-ofredigir")){OF_UI.red=r.id;show("ofRedigir");return}
    if(b.hasAttribute("data-ofpdf")){ofPdfAbrir(r);return}
    if(b.hasAttribute("data-ofword")){ofWord(r);return}
    if(b.hasAttribute("data-ofenv")){ofEnvelope(r);return}
    if(b.hasAttribute("data-ofjuntar")){ofEscolher(f=>ofJuntarFich(r,f));return}
    if(b.hasAttribute("data-ofdigit")){ofDigitalizar(r);return}
    if(b.hasAttribute("data-ofguardarpdf")){ofGuardarPdf(r).then(()=>{toast("PDF guardado nos documentos");ofFichaUI()}).catch(x=>toast("Não foi possível guardar: "+(x.message||x)));return}
    if(b.hasAttribute("data-ofresponder")){ofResponder(r);return}
    if(b.hasAttribute("data-ofavisar")){ofAvisar(r);return}
    if(b.hasAttribute("data-ofanular")){ofAnular(r);return}
    if(b.hasAttribute("data-ofapagar")){if(!confirm("Apagar este rascunho? Ainda não tem número, por isso não fica no livro de registo."))return;OFI.del[r.id]=Date.now();OFI.reg=OFI.reg.filter(x=>x!==r);OF_UI.sel="";ofGuardar(null);ofInicioUI();return}})})();
function ofAnular(r){const box=ofModal(`<h2>Anular o ofício ${esc(r.num)}</h2><p class="hint">O ofício fica no livro de registo, riscado, e o número não volta a ser usado. Os documentos ficam guardados.</p>
  <label>Motivo<input type="text" id="ofAnMot" placeholder="ex.: enviado por engano, substituído pelo n.º…"></label><div class="fd-btns"><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b danger" data-ofanok>Anular</button></div>`,(e,bx)=>{
    if(e.target.closest("[data-ofanok]")){r.anulado=true;r.anulMot=bx.querySelector("#ofAnMot").value.trim();ofHist(r,"anulado"+(r.anulMot?": "+r.anulMot:""));ofGuardar(r);bx.remove();ofInicioUI()}})}
function ofResponder(e0){const D=ofDef(),e=ofEntidade(e0.entId);
  const n=ofNovo("sai",{respondeA:e0.id,entId:e0.entId,entNome:ofQuem(e0),email:e0.email||(e&&e.email)||"",dest:e?ofDestDe(e):{trat:D.trat[0]||"",nome:"",cargo:"",org:ofQuem(e0),morada:"",cpl:""},
    assunto:e0.assunto||"",refExt:e0.refExt||"",refExtData:e0.dataDoc||e0.data||"",classif:e0.classif||"",proc:e0.proc||"",via:e0.via==="email"||e0.via==="digital"?"email":"registada"});
  ofHist(e0,"resposta iniciada");ofGuardar(e0);OF_UI.red=n.id;show("ofRedigir")}
async function ofAvisar(r){const para=String(r.resp||"").trim();if(!/@/.test(para)){toast("Indique o email de quem trata o ofício");return}
  const pdf=(r.anexos||[]).find(a=>/pdf/.test(a.tipo||"")&&(a.tam||0)<3e6);
  const box=ofModal(`<h2>Avisar ${esc(para)}</h2><p class="hint">Vai um email da sua conta do Office 365 com o despacho${pdf?" e o documento do ofício em anexo":""}.</p>
    <label>Mensagem<textarea id="ofAvTx" rows="8">${esc(`Bom dia,\n\nFoi-lhe atribuído o ofício ${r.num} (${ofQuem(r)}), com o assunto «${r.assunto||""}».${r.desp?`\n\nDespacho: ${r.desp}`:""}${r.prazo?`\n\nPrazo para responder: ${ofDataPT(r.prazo)}.`:""}\n\nCom os melhores cumprimentos,\n${ofDef().sigCargo||""}`)}</textarea></label>
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b" data-ofavok>Enviar</button></div>`,async(e,bx)=>{
    if(!e.target.closest("[data-ofavok]"))return;const btn=e.target.closest("button");btn.disabled=true;btn.textContent="A enviar…";
    try{let anexo=null;if(pdf){const b=await ofBaixar(pdf);if(b)anexo={name:pdf.nome||(r.num.replace(/\W+/g,"-")+".pdf"),b64:await ofB64(b)}}
      await msEnviar({to:para,subject:`Ofício ${r.num} para tratar — ${r.assunto||""}`,body:bx.querySelector("#ofAvTx").value,anexo});
      ofHist(r,"aviso enviado a "+para);ofGuardar(r);bx.remove();toast("Email enviado");ofFichaUI()}catch(x){btn.disabled=false;btn.textContent="Enviar";toast("Não foi possível enviar: "+(x.message||x))}})}

// ================= Documentos (Supabase Storage, bucket privado «oficios») =================
async function ofEnviarFich(r,blob,tipo,nome){if(!sbAtivo())throw new Error("é preciso ter entrado com o Office 365");const sb=await sbCliente();
  const ext=(String(nome||"").match(/\.([a-z0-9]{2,5})$/i)||[])[1]||(/pdf/.test(tipo)?"pdf":/png/.test(tipo)?"png":/jpe?g/.test(tipo)?"jpg":"bin");
  const p=`${new Date().getFullYear()}/${r.id}/${Date.now().toString(36)}-${uid()}.${ext.toLowerCase()}`;
  const {error}=await sb.storage.from(OF_B).upload(p,blob,{contentType:tipo||"application/octet-stream",upsert:false,cacheControl:"3600"});
  if(error){const m=String(error.message||error);throw new Error(/bucket not found/i.test(m)?"o espaço dos ofícios na nuvem ainda não foi preparado (servidor/supabase-episj360-oficio360.sql)":/row-level security|unauthorized|403/i.test(m)?"esta conta não pode guardar documentos de ofícios (só a Direção)":/exceeded|too large|413/i.test(m)?"o ficheiro é grande demais (máximo 25 MB)":m)}
  (r.anexos=r.anexos||[]).push({p,tipo:tipo||"",nome:String(nome||"documento").slice(0,140),tam:blob.size||0,em:Date.now(),por:String(EU&&EU.email||"")});ofHist(r,"documento junto: "+String(nome||"").slice(0,80));ofGuardar(r);return p}
async function ofUrls(r){const L=(r.anexos||[]).map(x=>x.p).filter(p=>{const c=OF_URL.get(p);return!c||c.ate<Date.now()+60000});
  if(L.length){try{const sb=await sbCliente(),{data,error}=await sb.storage.from(OF_B).createSignedUrls(L,3600);if(!error)(data||[]).forEach(x=>{if(x.signedUrl)OF_URL.set(x.path,{u:x.signedUrl,ate:Date.now()+3500000})})}catch(e){}}
  return(r.anexos||[]).map(x=>Object.assign({u:(OF_URL.get(x.p)||{}).u||""},x))}
async function ofBaixar(a){const L=await ofUrls({anexos:[a]}),u=L[0]&&L[0].u;if(!u)return null;const x=await fetch(u);return x.ok?await x.blob():null}
function ofB64(blob){return new Promise((ok,ko)=>{const f=new FileReader();f.onload=()=>ok(String(f.result).split(",")[1]||"");f.onerror=ko;f.readAsDataURL(blob)})}
async function ofAnexosUI(r,el){if(!el)return;const A=r.anexos||[];if(!A.length){el.innerHTML=`<p class="hint" style="margin:0">Ainda sem documentos${r.tipo==="ent"?" (a carta digitalizada, o PDF ou o email recebido)":""}.</p>`;return}
  el.innerHTML=`<p class="hint" style="margin:0">A abrir…</p>`;const L=await ofUrls(r);if(ofSel()!==r)return;
  el.innerHTML=L.map(x=>{const img=/^image\//.test(x.tipo||"");return `<a class="of-doc" href="${escUrl(x.u)}" target="_blank" rel="noopener">${img&&x.u?`<img src="${escUrl(x.u)}" alt="" loading="lazy">`:`<i>${OF_ICO.pdf}</i>`}<span>${esc(x.nome||"documento")}<small>${esc(new Date(x.em).toLocaleDateString("pt-PT"))}${x.tam?" · "+(x.tam>1048576?(x.tam/1048576).toFixed(1)+" MB":Math.max(1,Math.round(x.tam/1024))+" KB"):""}</small></span></a>`}).join("")}
function ofEscolher(fn,aceitar,multi){const i=document.createElement("input");i.type="file";i.accept=aceitar||".pdf,.eml,.msg,.doc,.docx,.odt,.xlsx,.txt,image/*";i.multiple=multi!==false;i.hidden=true;document.body.appendChild(i);
  i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)fn(L)});i.click()}
async function ofJuntarFich(r,L){const box=ofModal(`<h2>A guardar…</h2><p class="hint" id="ofProg">A preparar…</p>`);
  try{let i=0;for(const f of L){i++;box.querySelector("#ofProg").textContent=`Documento ${i} de ${L.length}: ${f.name}`;await ofEnviarFich(r,f,f.type,f.name)}box.remove();toast(L.length>1?"Documentos guardados":"Documento guardado")}
  catch(e){box.remove();toast("Não foi possível guardar: "+(e.message||e))}ofFichaUI()}

// ----- registar entradas a partir de ficheiros (PDF, email .eml, digitalizações) -----
async function ofDeFicheiros(L){if(!ofEd())return;if(!sbAtivo()){toast("Para guardar documentos é preciso ter entrado com o Office 365.");return}
  const box=ofModal(`<h2>A registar…</h2><p class="hint" id="ofProg">A ler os ficheiros…</p>`);let ult=null;
  try{let i=0;for(const f of L){i++;box.querySelector("#ofProg").textContent=`Ficheiro ${i} de ${L.length}: ${f.name}`;
      const base={origem:"registado a partir de "+f.name,via:"digital"};
      if(/\.eml$/i.test(f.name)||f.type==="message/rfc822"){Object.assign(base,ofLerEml(await f.text()),{via:"email"})}
      else if(/pdf/i.test(f.type)||/\.pdf$/i.test(f.name)){Object.assign(base,ofLerTexto(await ofPdfTexto(f)))}
      else if(/\.msg$/i.test(f.name))base.via="email";
      const r=ofNovo("ent",base);await ofEnviarFich(r,f,f.type||(/\.eml$/i.test(f.name)?"message/rfc822":""),f.name);ult=r}
    box.remove();toast(L.length>1?`${L.length} entradas registadas`:"Entrada registada: "+(ult&&ult.num))}
  catch(e){box.remove();toast("Não foi possível registar: "+(e.message||e))}
  if(ult)OF_UI.sel=ult.id;OF_UI.q="";ofInicioUI()}
async function ofPdfTexto(file){let t="";try{const pdfjs=await calPdfJs(),doc=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    for(let i=1;i<=Math.min(doc.numPages,3);i++){const pg=await doc.getPage(i),tc=await pg.getTextContent();t+=tc.items.map(it=>it.str+(it.hasEOL?"\n":" ")).join("")+"\n"}}catch(e){console.warn("Ofício360/PDF",e)}return t}
var OF_MESES=["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
function ofDataDeTexto(t){let m=String(t||"").match(/\b(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})\b/);if(m&&+m[2]<=12&&+m[1]<=31)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
  m=String(t||"").match(/\b(\d{4})-(\d{2})-(\d{2})\b/);if(m)return m[0];
  m=norm(String(t||"")).match(/\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(\d{4})\b/);
  if(m){const i=OF_MESES.map(x=>norm(x)).indexOf(m[2]);return `${m[3]}-${String(i+1).padStart(2,"0")}-${m[1].padStart(2,"0")}`}return""}
// o que se consegue ler do texto de um ofício: assunto, referência, data, email do remetente
function ofLerTexto(t){const o={},s=String(t||"");
  let m=s.match(/Assunto\s*[:\-–]\s*([^\n]{3,220})/i);if(m)o.assunto=m[1].replace(/\s{2,}/g," ").trim();
  m=s.match(/(?:N\/\s*Ref(?:er[êe]ncia)?\.?|Nossa\s+refer[êe]ncia|Of[íi]cio\s+n\.?\s*[ºo°]?\.?|Ref(?:er[êe]ncia)?\.?\s*n?\.?\s*[ºo°]?\s*:)\s*[:\-]?\s*([A-Za-z0-9][\w\-\/\.]{1,40})/i);if(m&&/\d/.test(m[1]))o.refExt=m[1].replace(/[.,;]$/,"");
  const d=ofDataDeTexto(s);if(d)o.dataDoc=d;
  m=(s.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)||[]).find(x=>!/@episj\.(com|pt)$/i.test(x));if(m)o.email=m.toLowerCase();
  const e=o.email&&OFI.ent.find(x=>x.email&&x.email.toLowerCase()===o.email);if(e){o.entId=e.id;o.entNome=e.org||e.nome}return o}
function ofRfc2047(s){return String(s||"").replace(/=\?([^?]+)\?([bq])\?([^?]*)\?=/gi,(x,cs,enc,txt)=>{try{let bytes;
    if(enc.toLowerCase()==="b"){const bin=atob(txt);bytes=Uint8Array.from(bin,c=>c.charCodeAt(0))}
    else{const q=txt.replace(/_/g," ");const a=[];for(let i=0;i<q.length;i++){if(q[i]==="="&&/^[0-9a-f]{2}$/i.test(q.substr(i+1,2))){a.push(parseInt(q.substr(i+1,2),16));i+=2}else a.push(q.charCodeAt(i))}bytes=new Uint8Array(a)}
    return new TextDecoder(cs).decode(bytes)}catch(e){return txt}}).replace(/\?=\s+=\?/g,"")}
function ofLerEml(t){const cab=String(t||"").split(/\r?\n\r?\n/)[0].replace(/\r?\n[ \t]+/g," "),H=k=>{const m=cab.match(new RegExp("^"+k+":\\s*(.*)$","im"));return m?ofRfc2047(m[1]).trim():""};
  const o={},de=H("From"),em=(de.match(/<([^>]+)>/)||[])[1]||(de.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)||[])[0]||"";
  o.assunto=H("Subject").replace(/^(re|fw|fwd|enc|res)\s*:\s*/i,"");if(em)o.email=em.toLowerCase();
  const nome=de.replace(/<[^>]*>/,"").replace(/"/g,"").trim();const e=o.email&&OFI.ent.find(x=>x.email&&x.email.toLowerCase()===o.email);
  if(e){o.entId=e.id;o.entNome=e.org||e.nome}else if(nome&&nome!==em)o.entNome=nome;else if(em)o.entNome=em;
  const d=new Date(H("Date"));if(!isNaN(d))o.dataDoc=calS(d);return o}

// ----- digitalizar cartas com a câmara (várias páginas num só PDF) -----
async function ofImgJpeg(file){let src=null;
  try{src=await createImageBitmap(file,{imageOrientation:"from-image"})}catch(e){try{src=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=URL.createObjectURL(file)})}catch(x){src=null}}
  if(!src)return null;const W=src.width||src.naturalWidth,H=src.height||src.naturalHeight,k=Math.min(1,2000/Math.max(W,H)),cv=document.createElement("canvas");
  cv.width=Math.max(1,Math.round(W*k));cv.height=Math.max(1,Math.round(H*k));const cx=cv.getContext("2d");cx.fillStyle="#fff";cx.fillRect(0,0,cv.width,cv.height);cx.drawImage(src,0,0,cv.width,cv.height);
  return{src:cv.toDataURL("image/jpeg",.78),w:cv.width,h:cv.height}}
function ofDigitalizar(r){if(!ofEd())return;if(!sbAtivo()){toast("Para guardar documentos é preciso ter entrado com o Office 365.");return}const P=[];
  const desenha=bx=>{bx.querySelector("#ofPags").innerHTML=P.length?P.map((p,i)=>`<figure class="of-pg"><img src="${p.src}" alt="Página ${i+1}"><figcaption>pág. ${i+1} <button class="b s" data-ofpgx="${i}" title="Tirar esta página">×</button></figcaption></figure>`).join(""):`<p class="hint" style="margin:0">Ainda sem páginas. Fotografe a carta de frente, com boa luz, uma página de cada vez.</p>`;
    bx.querySelector("[data-ofdgok]").disabled=!P.length};
  const juntar=async(L,bx)=>{for(const f of L){const j=await ofImgJpeg(f);if(j)P.push(j)}desenha(bx)};
  const box=ofModal(`<h2>${r?"Digitalizar para "+esc(r.num||"o ofício"):"Digitalizar uma carta recebida"}</h2><p class="hint">As páginas ficam num só PDF${r?"":", e a carta fica registada como entrada nova"}.</p>
    <div class="of-pags" id="ofPags"></div>
    <div class="fd-btns"><button class="b" data-ofdgcam>Fotografar página</button><button class="b s" data-ofdgesc>Escolher imagens</button><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b" data-ofdgok disabled>Guardar o PDF</button></div>`,async(e,bx)=>{
    const b=e.target.closest("button");if(!b)return;
    if(b.dataset.ofpgx!==undefined){P.splice(+b.dataset.ofpgx,1);desenha(bx);return}
    if(b.hasAttribute("data-ofdgcam")){const i=document.createElement("input");i.type="file";i.accept="image/*";i.setAttribute("capture","environment");i.hidden=true;document.body.appendChild(i);
      i.addEventListener("change",()=>{const L=[...(i.files||[])];i.remove();if(L.length)juntar(L,bx)});i.click();return}
    if(b.hasAttribute("data-ofdgesc")){ofEscolher(L=>juntar(L,bx),"image/*");return}
    if(b.hasAttribute("data-ofdgok")){b.disabled=true;b.textContent="A guardar…";
      try{const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});P.forEach((p,i)=>{if(i)doc.addPage();const k=Math.min(198/p.w,285/p.h),w=p.w*k,h=p.h*k;doc.addImage(p.src,"JPEG",(210-w)/2,(297-h)/2,w,h)});
        const blob=doc.output("blob"),alvo=r||ofNovo("ent",{origem:"carta digitalizada",via:"carta"});
        await ofEnviarFich(alvo,blob,"application/pdf",`Digitalização ${ofDataC(ofHoje())}.pdf`);bx.remove();toast(r?"Digitalização guardada":"Entrada registada: "+alvo.num);OF_UI.sel=alvo.id;
        if(curTab==="ofInicio")ofInicioUI();else show("ofInicio")}
      catch(x){b.disabled=false;b.textContent="Guardar o PDF";toast("Não foi possível guardar: "+(x.message||x))}}},true);
  desenha(box)}
// botões do topo da Correspondência (fora do card): importar ficheiros
document.querySelectorAll("#ofInicio [data-ofimpfich]").forEach(x=>x.accept=".pdf,.eml,.msg,image/*");

// ================= Redigir (ofícios de saída) =================
function ofRedUI(){const el=$("#ofRedOut"),r=OFI.reg.find(x=>x.id===OF_UI.red&&x.tipo==="sai");
  if(!r){const R=OFI.reg.filter(x=>x.tipo==="sai"&&!x.anulado).sort(ofCmp),rasc=R.filter(x=>x.estado==="rasc");
    el.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Redigir ofício</h1><div class="sub">Ofícios em papel timbrado da escola, numerados no livro de registo, para imprimir, meter no envelope de janela ou enviar por email.</div></div><span class="grow"></span>${ofEd()?`<button class="b" data-ofrnovo>Novo ofício</button>`:""}</div></div>
      <div class="card"><h2>Rascunhos</h2>${rasc.length?ofMini(rasc):`<p class="hint" style="margin:0">Sem rascunhos.</p>`}</div>
      <div class="card"><h2>Últimos ofícios enviados</h2>${R.filter(x=>x.n).length?ofMini(R.filter(x=>x.n).slice(0,12)):`<p class="hint" style="margin:0">Ainda não há ofícios de saída.</p>`}</div>`;return}
  const D=ofDef(),ed=ofEd()&&!r.anulado,dis=ed?"":"disabled",d=r.dest||(r.dest={}),orig=r.respondeA?OFI.reg.find(x=>x.id===r.respondeA):null;
  const di=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="text" data-ork="dest.${k}" value="${esc(d[k]||"")}"${o&&o.ph?` placeholder="${esc(o.ph)}"`:""}${o&&o.dl?` list="${o.dl}"`:""} ${dis}></label>`;
  const ri=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-ork="${k}" value="${esc(r[k]||"")}"${o&&o.ph?` placeholder="${esc(o.ph)}"`:""} ${dis}></label>`;
  el.innerHTML=`<div class="of-redtop"><button class="b s" data-ofrvoltar>‹ Ofícios por enviar</button><b class="of-rnum">${esc(r.num||"Rascunho sem número")}</b>${ofChip(r)}${orig?`<span class="hint" style="margin:0">responde a ${esc(orig.num)}</span>`:""}<span class="grow"></span>
    ${ed&&!r.n?`<button class="b" data-ofrnum title="Dá o número seguinte do livro de registo de saídas (${esc(ofNumTxt({tipo:"sai",n:ofProxN("sai",ofCiclo(r.data)),ciclo:ofCiclo(r.data),dep:r.dep}))})">Atribuir número</button>`:""}
    <button class="b s" data-ofrpdf>PDF</button><button class="b s" data-ofrword title="O ofício no Modelo de Ofício EPISJ, em Word">Word</button><button class="b s" data-ofrenv>Envelope</button>${ed?`<button class="b s" data-ofrmail title="Envia o ofício em PDF por email, da sua conta do Office 365">Enviar por email</button><button class="b s" data-ofrcarta title="Regista o envio por correio (data e n.º de registo dos CTT)">Enviado por correio</button><button class="b s" data-ofrdup>Duplicar</button>`:""}</div>
  <div class="of-red">
    <div class="card of-redf">
      <h2>Destinatário</h2>
      <div class="pp-form fd-form">
        <label class="w2">Entidade<select data-ofrent ${dis}>${ofOpts(OFI.ent.slice().sort((a,b)=>COLL_PTN.compare(a.org||a.nome,b.org||b.nome)).map(e=>({v:e.id,t:e.org?(e.org+(e.nome?" — "+e.nome:"")):e.nome})),r.entId||"","— escrever à mão —")}</select></label>
        ${di("trat","Tratamento",{dl:"ofTratDL"})}${di("nome","Nome")}${di("cargo","Cargo",{ph:"ex.: Diretor Regional"})}${di("org","Entidade / organismo")}
        <label class="w2">Morada<textarea data-ork="dest.morada" rows="2" ${dis}>${esc(d.morada||"")}</textarea></label>${di("cpl","Código postal e localidade",{ph:"9500-000 Ponta Delgada"})}
        ${ri("email","Email",{type:"email"})}
      </div>
      ${ed?`<div class="fd-btns" style="margin-top:4px"><button class="b s" data-ofrguardent title="Guarda este destinatário nas Entidades, para os próximos ofícios">${r.entId?"Atualizar a entidade":"Guardar nas entidades"}</button></div>`:""}
      <h2 style="margin-top:16px">Ofício</h2>
      <div class="pp-form fd-form">
        <label class="w2">Departamento<select data-ork="dep" ${dis}>${ofDepOpts(r.dep)}</select></label>${ri("data","Data",{type:"date"})}<label>Via<select data-ork="via" ${dis}>${ofOpts(OF_VIAS,r.via||"","—")}</select></label>
        ${ri("refExt","Sua referência")}${ri("refExtData","Data (da sua referência)",{type:"date"})}
        <label>Classificação<select data-ork="classif" ${dis}>${ofOpts(ofUniq(D.classif.concat([r.classif])),r.classif||"","—")}</select></label>${ri("proc","Processo / pasta")}
        ${ri("assunto","Assunto",{w2:1})}
        <label class="w2">Saudação<input type="text" data-ork="sauda" value="${esc(r.sauda||"")}" placeholder="${esc(ofSauda(Object.assign({},r,{sauda:""})))}" ${dis}></label>
        <label class="w2">Texto<textarea data-ork="corpo" rows="14" placeholder="Escreva o texto do ofício. Uma linha em branco separa os parágrafos." ${dis}>${esc(r.corpo||"")}</textarea></label>
        ${ri("anexosTxt","Anexos (a mencionar no ofício)",{w2:1,ph:"ex.: Mapa de assiduidade; Declaração"})}
      </div>
    </div>
    <div class="of-prevw"><div class="of-folha" id="ofFolha"></div><p class="hint" style="text-align:center">Pré-visualização. O PDF leva os logótipos das Definições (cabeçalho e rodapé).</p></div>
  </div>`;
  let x=document.getElementById("ofTratDL");if(!x){x=document.createElement("datalist");x.id="ofTratDL";document.body.appendChild(x)}x.innerHTML=D.trat.map(v=>`<option value="${esc(v)}">`).join("");
  ofFolha(r)}
function ofMini(L){return `<div class="tw"><table class="rt fd-t"><thead><tr><th>N.º</th><th>Data</th><th>Destinatário</th><th>Assunto</th><th>Situação</th></tr></thead><tbody>${L.map(r=>`<tr data-ofred="${r.id}"><td class="fd-nw"><b>${esc(r.num||"sem n.º")}</b></td><td class="fd-nw">${esc(calDM(r.data,{day:"numeric",month:"short",year:"numeric"}))}</td><td>${esc(ofQuem(r)||(r.dest&&(r.dest.org||r.dest.nome))||"—")}</td><td>${esc(r.assunto||"(sem assunto)")}</td><td>${ofChip(r)}</td></tr>`).join("")}</tbody></table></div>`}
function ofParas(t){return String(t||"").replace(/\r/g,"").split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean)}
function ofDestLinhas(d){return[d.trat,d.nome,d.cargo,d.org].concat(String(d.morada||"").split(/\n/)).concat([d.cpl]).map(s=>String(s||"").trim()).filter(Boolean)}
// 0.9.236: o ofício segue o «Modelo de Ofício EPISJ» (Word): título OFÍCIO e via, quadro das referências, destinatário à direita, assunto com barra azul,
// saudação, parágrafos com avanço, fecho, localidade e data, linha da assinatura com nome e cargo
var OF_AZ="#2D3170",OF_AZ2="#1282C5";
function ofSauda(r){if(String(r.sauda||"").trim())return r.sauda.trim();const d=r.dest||{};
  return `${(d.trat||"Exmo(a). Senhor(a)").trim()}${d.cargo?" "+d.cargo.trim():""}${d.nome?", "+d.nome.trim():""},`}
function ofSig(r){const D=ofDef(),dp=ofDep(r.dep);return{nome:(dp&&dp.sigNome)||D.sigNome||"",cargo:(dp&&dp.sigCargo)||D.sigCargo||""}}
function ofDestBloco(d){const L=[];const nome=(d.nome||"").trim(),org=(d.org||"").trim(),cargo=(d.cargo||"").trim();
  L.push(nome||org||cargo);const c2=[nome?cargo:"",nome||cargo?org:""].filter(Boolean).join(" / ");if(c2&&c2!==L[0])L.push(c2);
  String(d.morada||"").split(/\n/).map(s=>s.trim()).filter(Boolean).forEach(s=>L.push(s));if((d.cpl||"").trim())L.push(d.cpl.trim());return L.filter(Boolean)}
function ofFolha(r){const el=$("#ofFolha");if(!el)return;const D=ofDef(),d=r.dest||{},L=pdfLogosSeguro(),sg=ofSig(r),dest=ofDestBloco(d);
  el.innerHTML=`<div class="of-fcab">${L.m?`<img src="${L.m.src}" alt="">`:""}<span class="grow"></span>${L.r?`<img src="${L.r.src}" alt="">`:""}</div>
    <div class="of-ftit"><b>OFÍCIO</b><span>${r.via?"Via: "+esc(ofVia(r.via)):""}</span></div>
    <table class="of-fref"><tr><th>Sua referência</th><th>Data</th><th>Nossa referência</th><th>Data</th></tr><tr><td>${esc(r.refExt||"")}</td><td>${esc(ofDataC(r.refExtData).replace(/-/g,"/"))}</td><td>${esc(r.num||"(por atribuir)")}</td><td>${esc(ofDataC(r.data).replace(/-/g,"/"))}</td></tr></table>
    <div class="of-fdest"><small>DESTINATÁRIO</small>${dest.map((s,i)=>i===0?`<b>${esc(s)}</b>`:esc(s)).join("<br>")||`<span class="hint">destinatário</span>`}</div>
    <p class="of-fass"><b>Assunto:</b> <strong>${esc(r.assunto||"")}</strong></p>
    <p class="of-fsau">${esc(ofSauda(r))}</p>
    ${ofParas(r.corpo).map(p=>`<p class="of-fpar">${esc(p).replace(/\n/g,"<br>")}</p>`).join("")||`<p class="hint">O texto do ofício aparece aqui.</p>`}
    <p class="of-ffecho">${esc(D.fecho||"")}<br><span>${esc(D.local||"")}${D.local?", ":""}${esc(ofDataPT(r.data))}</span></p>
    <div class="of-fsig">${D.sigImg&&D.sigImg.src?`<img src="${D.sigImg.src}" alt="">`:""}<i></i><b>${esc(sg.nome||"")}</b><span>${esc(sg.cargo||"")}</span></div>
    ${r.anexosTxt?`<p class="of-fanx"><b>Anexos:</b> ${esc(r.anexosTxt)}</p>`:""}`}
function pdfLogosSeguro(){try{return pdfLogos()||{}}catch(e){return{}}}
(function(){const S=document.getElementById("ofRedigir");if(!S)return;
  const alvo=()=>OFI.reg.find(x=>x.id===OF_UI.red);
  S.addEventListener("input",e=>{const k=e.target.closest("[data-ork]");if(!k||!ofEd())return;const r=alvo();if(!r||r.anulado)return;const c=k.dataset.ork;
    if(c.startsWith("dest.")){(r.dest=r.dest||{})[c.slice(5)]=k.value}else r[c]=k.value;
    clearTimeout(ofRH);ofRH=setTimeout(()=>{ofFolha(r);ofGuardar(r)},250)});
  S.addEventListener("change",e=>{const r=alvo();if(!r||!ofEd())return;
    if(e.target.matches("[data-ofrent]")){const en=ofEntidade(e.target.value);r.entId=en?en.id:"";if(en){r.dest=ofDestDe(en);r.entNome=en.org||en.nome;if(en.email)r.email=en.email}ofGuardar(r);ofRedUI();return}
    const k=e.target.closest("[data-ork]");if(k){const c=k.dataset.ork;if(c.startsWith("dest.")){r.dest[c.slice(5)]=k.value;if(c==="dest.org"||c==="dest.nome")r.entNome=r.dest.org||r.dest.nome}else r[c]=k.value;
      if(c==="dep"&&r.n){r.num=ofNumTxt(r);ofHist(r,"departamento: "+ofDepNome(r.dep)+" (n.º "+r.num+")")}
      if(c==="via"||c==="data"||c==="dep")ofRedUI();else ofFolha(r);ofGuardar(r)}});
  S.addEventListener("click",e=>{const tr=e.target.closest("tr[data-ofred]");if(tr){OF_UI.red=tr.dataset.ofred;ofRedUI();return}
    const b=e.target.closest("button");if(!b)return;const r=alvo();
    if(b.hasAttribute("data-ofrnovo")){if(!ofEd())return;const n=ofNovo("sai");OF_UI.red=n.id;ofRedUI();return}
    if(b.hasAttribute("data-ofrvoltar")){OF_UI.red="";ofRedUI();return}
    if(!r)return;
    if(b.hasAttribute("data-ofrpdf")){ofPdfAbrir(r);return}
    if(b.hasAttribute("data-ofrword")){ofWord(r);return}
    if(b.hasAttribute("data-ofrenv")){ofEnvelope(r);return}
    if(!ofEd()||r.anulado)return;
    if(b.hasAttribute("data-ofrnum")){if(!String(r.assunto||"").trim()){toast("Escreva primeiro o assunto");return}ofNumerar(r);r.estado="reg";ofHist(r,"número atribuído: "+r.num);ofRespondida(r);ofGuardar(r);ofRedUI();toast("Ofício registado com o n.º "+r.num);return}
    if(b.hasAttribute("data-ofrguardent")){const d=r.dest||{};if(!(d.org||d.nome)){toast("Escreva o nome ou a entidade");return}let en=ofEntidade(r.entId);
      if(!en){en={id:uid()+uid(),cr:Date.now(),por:String(EU&&EU.email||"")};OFI.ent.push(en)}Object.assign(en,{trat:d.trat||"",nome:d.nome||"",cargo:d.cargo||"",org:d.org||"",morada:d.morada||"",cpl:d.cpl||"",email:r.email||en.email||""});
      r.entId=en.id;r.entNome=en.org||en.nome;ofGuardar(en);ofGuardar(r);ofRedUI();toast("Entidade guardada");return}
    if(b.hasAttribute("data-ofrdup")){const n=ofNovo("sai",{entId:r.entId,entNome:r.entNome,email:r.email,dest:Object.assign({},r.dest),assunto:r.assunto,classif:r.classif,proc:r.proc,corpo:r.corpo,via:r.via});n.anexosTxt=r.anexosTxt||"";ofGuardar(n);OF_UI.red=n.id;ofRedUI();toast("Cópia criada (rascunho)");return}
    if(b.hasAttribute("data-ofrmail")){ofMail(r);return}
    if(b.hasAttribute("data-ofrcarta")){ofCarta(r);return}})})();
// a entrada a que este ofício responde passa a «Respondido»
function ofRespondida(r){if(!r.respondeA)return;const e=OFI.reg.find(x=>x.id===r.respondeA);if(e&&e.estado!=="resp"&&e.estado!=="arq"){e.estado="resp";ofHist(e,"respondido com o ofício "+r.num);ofGuardar(e)}}
function ofSub(t,r){const D=ofDef();return String(t||"").replace(/\{num\}/g,r.num||"").replace(/\{assunto\}/g,r.assunto||"").replace(/\{assinatura\}/g,[D.sigCargo,D.sigNome].filter(Boolean).join("\n"))}
function ofFalta(r){if(!String(r.assunto||"").trim())return"Escreva o assunto.";if(!ofParas(r.corpo).length)return"Escreva o texto do ofício.";return""}
function ofMail(r){const f=ofFalta(r);if(f){toast(f);return}const D=ofDef();
  const box=ofModal(`<h2>Enviar ${esc(r.num||"o ofício")} por email</h2><p class="hint">Vai da sua conta do Office 365, com o ofício em PDF em anexo${r.n?"":". O ofício recebe agora o número seguinte do livro de registo"}. Fica uma cópia do PDF nos documentos do ofício.</p>
    <label>Para<input type="text" id="ofMTo" value="${esc(r.email||"")}" placeholder="email@entidade.pt; outro@…"></label><label>Cc<input type="text" id="ofMCc" value=""></label>
    <label>Assunto<input type="text" id="ofMAs" value="${esc(ofSub(D.assuntoEmail,Object.assign({},r,{num:r.num||ofNumTxt({tipo:"sai",n:ofProxN("sai",ofCiclo(r.data)),ciclo:ofCiclo(r.data),dep:r.dep})})))}"></label>
    <label>Mensagem<textarea id="ofMTx" rows="7">${esc(ofSub(D.corpoEmail,Object.assign({},r,{num:r.num||"n.º (a atribuir)"})))}</textarea></label>
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b" data-ofmok>Enviar</button></div>`,async(e,bx)=>{
    if(!e.target.closest("[data-ofmok]"))return;const to=bx.querySelector("#ofMTo").value.trim();if(!/@/.test(to)){toast("Indique o email do destinatário");return}
    const btn=e.target.closest("button");btn.disabled=true;btn.textContent="A enviar…";
    try{const novo=!r.n;if(novo){ofNumerar(r);ofHist(r,"número atribuído: "+r.num)}
      const doc=await ofPdfDoc(r),blob=doc.output("blob"),nome=`Oficio ${r.num.replace(/[\/\\]+/g,"-")}.pdf`;
      await msEnviar({to,cc:bx.querySelector("#ofMCc").value,subject:bx.querySelector("#ofMAs").value.replace(/\{num\}/g,r.num),body:bx.querySelector("#ofMTx").value.replace(/n\.º \(a atribuir\)/g,r.num),anexo:{name:nome,b64:await ofB64(blob)}});
      r.via="email";r.estado="env";r.dataEnv=ofHoje();if(!r.email)r.email=to;ofHist(r,"enviado por email para "+to);ofRespondida(r);ofGuardar(r);
      try{await ofEnviarFich(r,blob,"application/pdf",nome)}catch(x){toast("Enviado, mas a cópia do PDF não ficou guardada: "+(x.message||x))}
      bx.remove();toast("Ofício "+r.num+" enviado");ofRedUI()}
    catch(x){btn.disabled=false;btn.textContent="Enviar";ofGuardar(r);toast("Não foi possível enviar: "+(x.message||x))}})}
function ofCarta(r){const f=ofFalta(r);if(f){toast(f);return}
  const box=ofModal(`<h2>Enviado por correio</h2><p class="hint">${r.n?"":"O ofício recebe agora o número seguinte do livro de registo. "}Fica uma cópia do PDF nos documentos do ofício.</p>
    <label>Via<select id="ofCVia">${ofOpts(OF_VIAS.filter(v=>/carta|registada|ar|mao/.test(v.v)),r.via&&/carta|registada|ar|mao/.test(r.via)?r.via:"registada")}</select></label>
    <label>Data de envio<input type="date" id="ofCData" value="${esc(r.dataEnv||ofHoje())}"></label><label>N.º de registo dos CTT<input type="text" id="ofCCtt" value="${esc(r.ctt||"")}" placeholder="RR123456789PT (cartas registadas)"></label>
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b" data-ofcok>Registar o envio</button></div>`,async(e,bx)=>{
    if(!e.target.closest("[data-ofcok]"))return;const btn=e.target.closest("button");btn.disabled=true;
    if(!r.n){ofNumerar(r);ofHist(r,"número atribuído: "+r.num)}r.via=bx.querySelector("#ofCVia").value;r.dataEnv=bx.querySelector("#ofCData").value;r.ctt=bx.querySelector("#ofCCtt").value.trim().toUpperCase();
    r.estado="env";ofHist(r,"enviado por "+ofVia(r.via).toLowerCase()+(r.ctt?" ("+r.ctt+")":""));ofRespondida(r);ofGuardar(r);
    try{await ofGuardarPdf(r)}catch(x){toast("Registado, mas a cópia do PDF não ficou guardada: "+(x.message||x))}bx.remove();ofRedUI()})}
async function ofGuardarPdf(r){const doc=await ofPdfDoc(r);return ofEnviarFich(r,doc.output("blob"),"application/pdf",`Oficio ${String(r.num||"rascunho").replace(/[\/\\]+/g,"-")}.pdf`)}

// ----- PDF do ofício (A4, papel timbrado) e envelope DL -----
function ofRGB(h){h=String(h).replace("#","");return[parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
async function ofPdfDoc(r){const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"}),D=ofDef(),d=r.dest||{},W=210,H=297,X=25,Wt=W-2*X,sg=ofSig(r),az=ofRGB(OF_AZ),az2=ofRGB(OF_AZ2),cz=[107,111,128];
  const cor=c=>doc.setTextColor(c[0],c[1],c[2]),lim=H-PDF_BOT-8;let y=Math.max(PDF_TOP+10,46);
  const nova=()=>{doc.addPage();y=PDF_TOP+10};
  // título e via
  doc.setFont("helvetica","bold");doc.setFontSize(13);cor(az);doc.text("OFÍCIO",X,y,{charSpace:1.1});
  if(r.via){doc.setFont("helvetica","normal");doc.setFontSize(8.5);cor(cz);doc.text(pdfTxt("Via: "+ofVia(r.via)),W-X,y,{align:"right"})}
  y+=5;
  // quadro das referências
  const cw=Wt/4,th=13;doc.setFillColor(238,241,248);doc.rect(X,y,Wt,th,"F");doc.setDrawColor(az[0],az[1],az[2]);doc.setLineWidth(.6);doc.line(X,y,X+Wt,y);
  doc.setDrawColor(201,205,219);doc.setLineWidth(.2);for(let i=1;i<4;i++)doc.line(X+cw*i,y+1.5,X+cw*i,y+th-1.5);
  const lab=["SUA REFERÊNCIA","DATA","NOSSA REFERÊNCIA","DATA"],val=[r.refExt||"",ofDataC(r.refExtData).replace(/-/g,"/"),r.num||"(por atribuir)",ofDataC(r.data).replace(/-/g,"/")];
  lab.forEach((t,i)=>{doc.setFont("helvetica","bold");doc.setFontSize(6.6);cor(az2);doc.text(pdfTxt(t),X+cw*i+2.5,y+4.6,{charSpace:.35});
    doc.setFontSize(9.5);cor(az);doc.text(doc.splitTextToSize(pdfTxt(val[i]),cw-4)[0]||"",X+cw*i+2.5,y+10)});
  y+=th+9;
  // destinatário (à direita, na janela do envelope)
  const xd=X+80;doc.setFont("helvetica","bold");doc.setFontSize(6.6);cor(az2);doc.text("DESTINATÁRIO",xd,y,{charSpace:.35});y+=5;
  ofDestBloco(d).forEach((s,i)=>{doc.setFont("helvetica",i===0?"bold":"normal");doc.setFontSize(10);cor(i===0?az:[30,34,40]);doc.splitTextToSize(pdfTxt(s),Wt-80).forEach(l=>{doc.text(l,xd,y);y+=4.7})});
  y+=9;
  // assunto
  doc.setFont("helvetica","bold");doc.setFontSize(10);const aw=doc.getTextWidth("Assunto: ");const AL=doc.splitTextToSize(pdfTxt(r.assunto||""),Wt-4-aw);
  doc.setFillColor(az2[0],az2[1],az2[2]);doc.rect(X-.5,y-3.9,1.1,4.9+4.7*(AL.length-1),"F");cor(az);doc.text("Assunto:",X+3,y);cor([30,34,40]);AL.forEach((l,i)=>{doc.text(l,X+3+aw,y);if(i<AL.length-1)y+=4.7});
  y+=13;
  // saudação e texto
  doc.setFont("helvetica","normal");doc.setFontSize(10);cor([30,34,40]);doc.splitTextToSize(pdfTxt(ofSauda(r)),Wt).forEach(l=>{doc.text(l,X,y);y+=4.9});y+=3;
  const lh=4.7,ind=10;
  for(const p of ofParas(r.corpo)){const t=pdfTxt(p).replace(/\n/g," ");const f=doc.splitTextToSize(t,Wt-ind),primeira=f[0]||"",resto=t.slice(primeira.length).trim();
    const L=[{s:primeira,x:X+ind,w:Wt-ind}].concat(resto?doc.splitTextToSize(resto,Wt).map(s=>({s,x:X,w:Wt})):[]);
    L.forEach((o,i)=>{if(y>lim)nova();const ult=i===L.length-1;if(!ult&&o.s.split(" ").length>3)doc.text(o.s,o.x,y,{maxWidth:o.w,align:"justify"});else doc.text(o.s,o.x,y);y+=lh});y+=2.8}
  if(y>lim-45)nova();y+=1.5;doc.text(pdfTxt(D.fecho||""),X,y);y+=5;doc.setFontSize(8.5);cor(cz);doc.text(pdfTxt(`${D.local?D.local+", ":""}${ofDataPT(r.data)}`),X,y);
  // assinatura
  y+=8;if(D.sigImg&&D.sigImg.src&&D.sigImg.w){const[w,h]=lgFit(D.sigImg,55,18);try{doc.addImage(D.sigImg.src,lgFmt(D.sigImg),W/2-w/2,y,w,h)}catch(e){}y+=h+1}else y+=16;
  doc.setDrawColor(181,185,200);doc.setLineWidth(.25);doc.line(W/2-33,y,W/2+33,y);y+=5;
  doc.setFont("helvetica","bold");doc.setFontSize(10);cor(az);if(sg.nome)doc.text(pdfTxt(sg.nome),W/2,y,{align:"center"});y+=4.6;
  doc.setFont("helvetica","normal");doc.setFontSize(9);cor(cz);if(sg.cargo)doc.text(pdfTxt(sg.cargo),W/2,y,{align:"center"});y+=4;
  if(r.anexosTxt){y+=6;if(y>lim)nova();doc.setFontSize(9);cor([30,34,40]);doc.setFont("helvetica","bold");doc.text("Anexos:",X,y);doc.setFont("helvetica","normal");doc.splitTextToSize(pdfTxt(r.anexosTxt),Wt-16).forEach(l=>{doc.text(l,X+15,y);y+=4.4})}
  pdfMoldura(doc,`Ofício ${r.num||"(rascunho)"}`);return doc}
// ----- o mesmo ofício em Word, preenchendo o «Modelo de Ofício EPISJ» (modelos/oficio-episj.docx) -----
function ofXml(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}
async function ofWord(r){try{if(!window.JSZip)await loadScript("lib/jszip.min.js");const res=await fetch("modelos/oficio-episj.docx");if(!res.ok)throw new Error("modelo Word não encontrado");
    const zip=await JSZip.loadAsync(await res.arrayBuffer()),D=ofDef(),sg=ofSig(r),d=r.dest||{};let x=await zip.file("word/document.xml").async("string");
    const P=x.match(/<w:p[ >][\s\S]*?<\/w:p>/g)||[],txt=p=>(p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g)||[]).map(t=>t.replace(/<[^>]+>/g,"")).join("");
    const poe=(p,v)=>{let i=0;return p.replace(/(<w:t[^>]*>)([^<]*)(<\/w:t>)/g,(m,a,b,c)=>(i++===0?a.replace(/<w:t(?![^>]*xml:space)/,'<w:t xml:space="preserve"')+ofXml(v)+c:a+c))};
    const poeRun=(p,ix,v)=>{let i=0;return p.replace(/(<w:t[^>]*>)([^<]*)(<\/w:t>)/g,(m,a,b,c)=>(i++===ix?a.replace(/<w:t(?![^>]*xml:space)/,'<w:t xml:space="preserve"')+ofXml(v)+c:m))};
    let nRef=0,nData=0,corpoFeito=false,pCargo=null;const dest=ofDestBloco(d),REP=[];let out;
    for(const p of P){out=[];REP.push(out);const t=txt(p);let np=p;
      if(t.startsWith("OFÍCIO")&&t.includes("Via:"))np=p.replace(/>Via: [^<]*</,">"+ofXml(r.via?"Via: "+ofVia(r.via):"")+"<");
      else if(t==="[N.º]"&&nRef++===0)np=poe(p,r.refExt||"");
      else if(t==="[DD/MM/AAAA]"){np=poe(p,nData++===0?ofDataC(r.refExtData).replace(/-/g,"/"):ofDataC(r.data).replace(/-/g,"/"))}
      else if(t==="[N.º]/DP/[AAAA]")np=poe(p,r.num||"");
      else if(t==="[Nome do destinatário]")np=poe(p,dest[0]||"");
      else if(t==="[Cargo / Entidade]"){pCargo=p;continue}
      else if(t==="[Morada]")continue;
      else if(t==="[Código postal e localidade]"){const R=dest.slice(1);R.slice(0,-1).forEach(s=>out.push(poe(pCargo||p,s)));out.push(poe(p,R.length?R[R.length-1]:""));continue}
      else if(t.startsWith("Assunto: "))np=poeRun(p,1,r.assunto||"");
      else if(/^Exmo\(a\)\. Senhor\(a\)/.test(t))np=poe(p,ofSauda(r));
      else if(/^\[(Texto do ofício|Segundo parágrafo|Parágrafo final)/.test(t)){if(!corpoFeito){corpoFeito=true;out.push(...ofParas(r.corpo).map(s=>poe(p,s.replace(/\n/g," "))))}continue}
      else if(t.startsWith("[Localidade]"))np=poe(p,`${D.local?D.local+", ":""}${ofDataPT(r.data)}`);
      else if(t==="[Nome]")np=poe(p,sg.nome||"");
      else if(t==="[Cargo]"){np=poe(p,sg.cargo||"");out.push(np);if(r.anexosTxt)out.push(poe(p.replace(/<w:jc w:val="center"\/>/,""),"Anexos: "+r.anexosTxt));continue}
      out.push(np)}
    let i=0;x=x.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,()=>(REP[i++]||[]).join(""));zip.file("word/document.xml",x);
    const blob=await zip.generateAsync({type:"blob",mimeType:"application/vnd.openxmlformats-officedocument.wordprocessingml.document"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Oficio ${String(r.num||"rascunho").replace(/[\/\\]+/g,"-")}.docx`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000)}
  catch(e){console.warn(e);toast("Não foi possível criar o Word: "+(e.message||e))}}
async function ofPdfAbrir(r){try{const doc=await ofPdfDoc(r);doc.save(`Oficio ${String(r.num||"rascunho").replace(/[\/\\]+/g,"-")}.pdf`)}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function ofEnvelope(r){try{const J=await loadPDF(),doc=new J({unit:"mm",format:[110,220],orientation:"landscape"}),D=ofDef(),L=pdfLogosSeguro();
    let y=14;if(L.m){const[w,h]=lgFit(L.m,34,14);doc.addImage(L.m.src,lgFmt(L.m),12,10,w,h);y=10+h+4}
    doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(80);String(D.remetente||"").split(/\n/).forEach(l=>{doc.text(pdfTxt(l),12,y);y+=3.4});
    if(r.via==="registada"||r.via==="ar"){doc.setDrawColor(30);doc.setLineWidth(.4);doc.rect(150,10,58,r.via==="ar"?14:9);doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(20);
      doc.text("CORREIO REGISTADO",179,16,{align:"center"});if(r.via==="ar")doc.text("COM AVISO DE RECEÇÃO",179,21,{align:"center"})}
    doc.setTextColor(20);doc.setFontSize(11);let yy=52;ofDestLinhas(r.dest||{}).forEach((s,i)=>{doc.setFont("helvetica",i===0?"bold":"normal");doc.splitTextToSize(pdfTxt(s),92).forEach(l=>{doc.text(l,112,yy);yy+=5.2})});
    doc.save(`Envelope ${String(r.num||"rascunho").replace(/[\/\\]+/g,"-")}.pdf`)}catch(e){console.warn(e);toast("Não foi possível criar o envelope: "+(e.message||e))}}

// ================= Entidades =================
function ofEntUI(){const el=$("#ofEntOut"),U=OF_UI,q=norm(U.entQ||""),ed=ofEd();
  const L=OFI.ent.filter(e=>!q||norm([e.org,e.nome,e.cargo,e.email,e.cpl,e.nif].join(" ")).includes(q)).sort((a,b)=>COLL_PTN.compare(a.org||a.nome,b.org||b.nome)),e=OFI.ent.find(x=>x.id===U.entSel);
  const n=x=>OFI.reg.filter(r=>r.entId===x.id).length;
  el.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Entidades</h1><div class="sub">Quem escreve à escola e a quem a escola escreve: tratamento, cargo, morada e email, para preencher os ofícios e os envelopes.</div></div><span class="grow"></span>${ed?`<button class="b" data-ofenova>Nova entidade</button>`:""}</div></div>
  <div class="fd-cols"><div class="card fd-lcard"><div class="row fd-filtros"><label class="grow">Procurar<input type="text" id="ofEntQ" value="${esc(U.entQ)}" placeholder="nome, entidade, email, localidade…"></label></div>
    ${L.length?`<div class="tw"><table class="rt fd-t"><thead><tr><th>Entidade</th><th>Pessoa / cargo</th><th>Localidade</th><th>Email</th><th>Ofícios</th></tr></thead><tbody>${L.map(x=>`<tr data-ofent="${x.id}" class="${U.entSel===x.id?"on":""}"><td><b>${esc(x.org||x.nome)}</b></td><td>${esc([x.nome!==x.org?x.nome:"",x.cargo].filter(Boolean).join(" · "))}</td><td>${esc(String(x.cpl||"").replace(/^\d{4}-\d{3}\s*/,""))}</td><td>${esc(x.email||"")}</td><td>${n(x)||""}</td></tr>`).join("")}</tbody></table></div>`:ofVz("carta",OFI.ent.length?"Nenhuma entidade encontrada.":"Ainda não há entidades. São criadas aqui ou ao redigir um ofício («Guardar nas entidades»).")}
  </div><div id="ofEntFicha">${e?ofEntFicha(e):`<div class="card fd-fvz">${ofVz("carta","Escolha uma entidade para a ver ou mudar.")}</div>`}</div></div>`}
function ofEntFicha(e){const dis=ofEd()?"":"disabled",i=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-ofek="${k}" value="${esc(e[k]||"")}"${o&&o.ph?` placeholder="${esc(o.ph)}"`:""}${o&&o.dl?` list="${o.dl}"`:""} ${dis}></label>`;
  const R=OFI.reg.filter(r=>r.entId===e.id).sort(ofCmp);
  return `<div class="card fd-ficha"><div class="fd-fh"><div class="fd-fcod">${esc(e.org||e.nome||"Entidade nova")}</div></div><div class="pp-form fd-form">
    ${i("org","Entidade / organismo",{w2:1})}${i("trat","Tratamento",{dl:"ofTratDL"})}${i("nome","Nome")}${i("cargo","Cargo",{w2:1})}
    <label class="w2">Morada<textarea data-ofek="morada" rows="2" ${dis}>${esc(e.morada||"")}</textarea></label>${i("cpl","Código postal e localidade",{w2:1})}
    ${i("email","Email",{type:"email"})}${i("tel","Telefone")}${i("nif","NIF")}<label class="w2">Observações<textarea data-ofek="obs" rows="2" ${dis}>${esc(e.obs||"")}</textarea></label></div>
    ${ofEd()?`<div class="fd-btns"><button class="b s" data-ofeofi>Novo ofício para esta entidade</button><span class="grow"></span><button class="b s danger" data-ofeapagar>Apagar</button></div>`:""}
    ${R.length?`<h3 class="fd-h3">Ofícios</h3><div class="fd-hist">${R.slice(0,12).map(r=>`<div><a href="#" data-ofabrir2="${r.id}"><b>${esc(r.num||"rascunho")}</b></a> · ${ofTipoTxt(r)} · ${esc(calDM(r.data,{day:"numeric",month:"short",year:"numeric"}))} · ${esc(r.assunto||"")}</div>`).join("")}</div>`:""}</div>`}
(function(){const S=document.getElementById("ofEnt");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="ofEntQ"){OF_UI.entQ=e.target.value;clearTimeout(ofQH);ofQH=setTimeout(()=>{ofEntUI();const i=$("#ofEntQ");if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},200)}});
  S.addEventListener("change",e=>{const k=e.target.closest("[data-ofek]");if(!k||!ofEd())return;const en=OFI.ent.find(x=>x.id===OF_UI.entSel);if(!en)return;en[k.dataset.ofek]=k.value;
    if(k.dataset.ofek==="org"||k.dataset.ofek==="nome")OFI.reg.forEach(r=>{if(r.entId===en.id&&r.tipo==="ent"){r.entNome=en.org||en.nome}});ofGuardar(en);ofEntUI()});
  S.addEventListener("click",e=>{const tr=e.target.closest("tr[data-ofent]");if(tr){OF_UI.entSel=tr.dataset.ofent;ofEntUI();return}
    const a=e.target.closest("[data-ofabrir2]");if(a){e.preventDefault();OF_UI.sel=a.dataset.ofabrir2;OF_UI.q="";OF_UI.tipo="";OF_UI.estado="";show("ofInicio");return}
    const b=e.target.closest("button");if(!b||!ofEd())return;
    if(b.hasAttribute("data-ofenova")){const en={id:uid()+uid(),trat:ofDef().trat[0]||"",org:"",nome:"",cr:Date.now(),por:String(EU&&EU.email||"")};OFI.ent.push(en);ofGuardar(en);OF_UI.entSel=en.id;OF_UI.entQ="";ofEntUI();return}
    const en=OFI.ent.find(x=>x.id===OF_UI.entSel);if(!en)return;
    if(b.hasAttribute("data-ofeofi")){const n=ofNovo("sai",{entId:en.id,entNome:en.org||en.nome,email:en.email||"",dest:ofDestDe(en)});OF_UI.red=n.id;show("ofRedigir");return}
    if(b.hasAttribute("data-ofeapagar")){const k=OFI.reg.filter(r=>r.entId===en.id).length;if(!confirm(`Apagar a entidade «${en.org||en.nome}»?${k?` Os ${k} ofícios dela ficam como estão, com o nome escrito.`:""}`))return;
      OFI.reg.forEach(r=>{if(r.entId===en.id){r.entNome=r.entNome||en.org||en.nome;r.entId="";ofGuardar(r)}});OFI.del[en.id]=Date.now();OFI.ent=OFI.ent.filter(x=>x!==en);OF_UI.entSel="";ofGuardar(null);ofEntUI()}})})();

// ================= Livro de registo (PDF e Excel) e importação =================
function ofLivUI(){const el=$("#ofLivOut"),U=OF_UI,ciclos=ofUniq(OFI.reg.map(r=>r.ciclo).concat([ofCiclo()])).sort((a,b)=>COLL_PTN.compare(b,a));if(!U.livAno)U.livAno=ciclos[0];
  const L=ofLivro(),ent=L.filter(r=>r.tipo==="ent").length;
  el.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Livro de registo</h1><div class="sub">O registo oficial da correspondência: todas as entradas e saídas numeradas, pela ordem do número, incluindo as anuladas.</div></div></div>
    <div class="ay-stats"><div class="ay-st"><small>Entradas</small><b>${ent}</b></div><div class="ay-st"><small>Saídas</small><b>${L.length-ent}</b></div><div class="ay-st"><small>Anulados</small><b>${L.filter(r=>r.anulado).length}</b></div></div></div>
  <div class="card"><div class="row fd-filtros"><label>Ano<select id="ofLivAno">${ofOpts(ciclos,U.livAno)}</select></label><label>Livro<select id="ofLivTipo">${ofOpts([{v:"ent",t:"Entradas"},{v:"sai",t:"Saídas"}],U.livTipo,"Entradas e saídas")}</select></label><span class="grow"></span>
    <button class="b" data-oflivpdf>Livro em PDF</button><button class="b s" data-oflivxls>Excel</button></div>
    ${L.length?`<div class="tw"><table class="rt fd-t"><thead><tr><th>N.º</th><th>Data</th><th>Via</th><th>Entidade</th><th>Assunto</th><th>Referência</th><th>Situação</th></tr></thead><tbody>${L.map(r=>`<tr class="${r.anulado?"of-anul":""}"><td class="fd-nw"><b>${esc(r.num)}</b></td><td class="fd-nw">${esc(ofDataC(r.data))}</td><td>${esc(ofVia(r.via))}</td><td>${esc(ofQuem(r))}</td><td>${esc(r.assunto||"")}</td><td>${esc(r.refExt||"")}</td><td>${ofChip(r)}</td></tr>`).join("")}</tbody></table></div>`:ofVz("carta","Sem ofícios numerados neste ano.")}</div>
  <div class="card"><h2>Listagem de Ofícios (Excel)</h2><p class="hint">Enquanto a escola usar a «Listagem de Ofícios» (Mod. DP333) em Excel, carregue aqui a versão mais recente sempre que for atualizada: entram os ofícios novos, atualizam-se os que mudaram no Excel e nada é apagado. Também serve outro livro de registo em Excel (colunas como N.º, Data, Entidade, Assunto).</p>
    ${(()=>{const u=ofDef().listUlt;return u?`<p class="hint" style="margin:0 0 8px">Última vez: <b>${esc(new Date(u.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}</b> · ${esc(u.nome||"")} · ${u.linhas} ofícios lidos, ${u.novos} novos, ${u.atual} atualizados${u.conf?`, ${u.conf} com conflito`:""}${u.por?` · ${esc(u.por)}`:""}</p>`:""})()}
    ${ofEd()?`<label class="b imp">${ofDef().listUlt?"Carregar a listagem atualizada (Excel)":"Importar a Listagem de Ofícios (Excel)"}<input type="file" accept=".xlsx,.xlsm,.xls,.csv,.ods" data-ofimpxls hidden></label>`:""}</div>`}
function ofLivro(){const U=OF_UI;return OFI.reg.filter(r=>r.n&&r.ciclo===U.livAno&&(!U.livTipo||r.tipo===U.livTipo)).sort((a,b)=>(a.tipo===b.tipo?0:a.tipo==="ent"?-1:1)||a.n-b.n)}
async function ofLivPdf(){try{const L=ofLivro(),J=await loadPDF(),doc=pdfA4L(J),U=OF_UI;if(!L.length){toast("Sem ofícios para o livro");return}
    const tipos=U.livTipo?[U.livTipo]:["ent","sai"];let first=true;
    for(const t of tipos){const T=L.filter(r=>r.tipo===t);if(!T.length)continue;if(!first)doc.addPage();first=false;
      const y=pdfTitulo(doc,`Livro de registo de ${t==="ent"?"entradas":"saídas"} · ${U.livAno}`,`${T.length} ofício${T.length===1?"":"s"} · ${pdfData()}`);
      pdfTabela(doc,y,["N.º","Data","Via",t==="ent"?"Remetente":"Destinatário","Assunto",t==="ent"?"Ref. do remetente":"Sua ref.","Classificação",t==="ent"?"Despacho / resposta":"Envio"],
        T.map(r=>[r.num+(r.anulado?" (anulado)":""),ofDataC(r.data),ofVia(r.via),ofQuem(r),r.assunto||"",r.refExt||"",r.classif||"",
          t==="ent"?[r.desp,OFI.reg.filter(x=>x.respondeA===r.id&&x.n).map(x=>"resp. "+x.num).join(", "),ofEstado(r).t].filter(Boolean).join(" · "):[ofEstado(r).t,r.dataEnv?ofDataC(r.dataEnv):"",r.ctt].filter(Boolean).join(" · ")].map(pdfTxt)),
        {0:{cellWidth:24},1:{cellWidth:20},2:{cellWidth:28},3:{cellWidth:46},5:{cellWidth:26},6:{cellWidth:30},7:{cellWidth:44}})}
    pdfMoldura(doc,"Livro de registo de correspondência · Ofício360");doc.save(`Livro de registo ${U.livAno.replace(/\//g,"-")}.pdf`)}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function ofExcel(L){try{if(!window.XLSX)await loadScript("lib/xlsx.mini.min.js");
  const R=L.map(r=>({"Tipo":ofTipoTxt(r),"N.º":r.num||"","Ano":r.ciclo||"","Data":r.data||"","Data do documento":r.dataDoc||"","Via":ofVia(r.via),"Entidade":ofQuem(r),"Email":r.email||"","Assunto":r.assunto||"",
    "Referência":r.refExt||"","Classificação":r.classif||"","Processo":r.proc||"","Situação":r.anulado?"Anulado":ofEstado(r).t,"Despacho":r.desp||"","Para quem":r.resp||"","Responder até":r.prazo||"",
    "Responde a":r.respondeA?((OFI.reg.find(x=>x.id===r.respondeA)||{}).num||""):"","Data de envio":r.dataEnv||"","Registo CTT":r.ctt||"","Documentos":(r.anexos||[]).length,"Observações":r.obs||""}));
  const ws=XLSX.utils.json_to_sheet(R),wb=XLSX.utils.book_new();ws["!cols"]=[{wch:8},{wch:12},{wch:10},{wch:11},{wch:11},{wch:22},{wch:34},{wch:26},{wch:50},{wch:16},{wch:22},{wch:14},{wch:14},{wch:36},{wch:26},{wch:12},{wch:12},{wch:12},{wch:16},{wch:6},{wch:30}];
  XLSX.utils.book_append_sheet(wb,ws,"Ofícios");XLSX.writeFile(wb,`Oficio360 ${new Date().toISOString().slice(0,10)}.xlsx`);toast("Excel criado")}catch(e){console.warn(e);toast("Não foi possível criar o Excel: "+(e.message||e))}}
function ofXlsData(v){if(v===undefined||v===null||v==="")return"";if(typeof v==="number"&&v>20000&&v<80000){const d=new Date(Date.UTC(1899,11,30)+v*864e5);return d.toISOString().slice(0,10)}
  if(v instanceof Date&&!isNaN(v))return calS(v);return ofDataDeTexto(String(v))}
// ----- 0.9.236: «Listagem de Ofícios» (Excel Mod. DP333) — carregar e voltar a carregar enquanto a escola usar o Excel -----
// Lê todas as folhas «Ofícios …» (títulos na linha com «Número de Ofício»: Data, Ano, Departamento/Entidade, Abrv, #, Número de Ofício, Destinatário, Assunto)
// e a folha «Entidades e Departamentos». Cada ofício é identificado pelo ano + n.º. Voltar a carregar: junta os novos, atualiza os que vieram do Excel e
// não foram mudados na app, e nunca apaga nada. Se o mesmo n.º tiver sido dado na app a outro ofício, aparece como conflito (nada é mudado).
function ofEhListagem(wb){return wb.SheetNames.some(sn=>{const A=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:"",range:0}).slice(0,30);return A.some(l=>l.some(c=>norm(String(c))==="numero de oficio"))})}
function ofLerListagem(wb){const linhas=[],ents=[],vistos=new Set();let dupl=0;
  // a folha mais recente primeiro (a «Ofícios 2026» tem 2022–2026); um n.º repetido noutra folha conta uma vez
  const folhas=wb.SheetNames.slice().reverse();
  for(const sn of folhas){const A=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:""});
    if(/entidades/i.test(sn)){const h=A[0]||[],ci=h.findIndex(c=>/^entidades?$/i.test(String(c).trim()));A.slice(1).forEach(l=>{const v=String(l[ci<0?0:ci]||"").trim();if(v)ents.push(v)});continue}
    const hi=A.findIndex(l=>l.some(c=>norm(String(c))==="numero de oficio"));if(hi<0)continue;const H=A[hi].map(c=>norm(String(c||"")));
    const col=re=>H.findIndex(h=>re.test(h)),cN=col(/^numero de oficio$/),cD=col(/^data$/),cA=col(/^ano$/),cDep=col(/departamento/),cAb=col(/^abrv|^abrev/),cDes=col(/destinat/),cAs=col(/^assunto/);
    const cH=H.map((h,i)=>h==="#"?i:-1).filter(i=>i>=0),cSeq=cH.length?cH[cH.length-1]:-1;
    for(const l of A.slice(hi+1)){const num=String(cN>=0?l[cN]:"").trim(),ass=String(cAs>=0?l[cAs]:"").trim(),des=String(cDes>=0?l[cDes]:"").trim(),depN=String(cDep>=0?l[cDep]:"").trim();
      const m=num.match(/^(\d+)\s*\/\s*([A-Za-zÀ-ú]*)\s*\/\s*(\d{3,4})$/);const data=ofXlsData(cD>=0?l[cD]:"");
      let n=m?+m[1]:(+(cSeq>=0?l[cSeq]:0)||0),ab=m?m[2].toUpperCase():String(cAb>=0?l[cAb]:"").trim().toUpperCase(),ano=m?+m[3]:(+(cA>=0?l[cA]:0)||0);
      if(!(ano>=2000&&ano<2100))ano=+(data||"").slice(0,4)||0;
      if(!n||!ano||!(num||depN))continue;const k=ano+"|"+n;if(vistos.has(k)){dupl++;continue}vistos.add(k);
      linhas.push({k,n,ciclo:String(ano),num:m&&ano===+m[3]?num.replace(/\s+/g,""):`${n}/${ab}/${ano}`,dep:ab,depN,data:data||`${ano}-01-01`,ent:des,assunto:ass,folha:sn})}}
  return{linhas,ents,dupl}}
async function ofImportarListagem(wb,file){const {linhas,ents,dupl}=ofLerListagem(wb);if(!linhas.length){toast("Não encontrei ofícios na listagem");return}
  const t0=Date.now(),idx=new Map();OFI.reg.forEach(r=>{if(r.tipo==="sai"&&r.n)idx.set(r.ciclo+"|"+r.n,r)});
  let novos=0,atual=0,iguais=0,entN=0;const conf=[];
  const porNome=new Map(OFI.ent.map(e=>[norm(e.org||e.nome),e]));
  for(const nome of ents){const k=norm(nome);if(k&&!porNome.has(k)){const e={id:uid()+uid(),trat:"",org:nome,nome:"",cr:t0,em:t0,por:String(EU&&EU.email||""),origem:"Listagem de Ofícios (Excel)"};OFI.ent.push(e);porNome.set(k,e);entN++}}
  for(const L of linhas){const x=idx.get(L.k),en=L.ent?porNome.get(norm(L.ent)):null;
    if(!x){const r={id:uid()+uid(),tipo:"sai",n:L.n,ciclo:L.ciclo,num:L.num,dep:L.dep,data:L.data,via:"",entId:en?en.id:"",entNome:L.ent,dest:{org:L.ent},assunto:L.assunto,estado:"env",
        lst:1,lstEm:t0,cr:t0,em:t0,por:String(EU&&EU.email||""),mod:String(EU&&EU.email||""),origem:"Listagem de Ofícios (Excel)"};OFI.reg.push(r);idx.set(L.k,r);novos++;continue}
    if(x.lst&&(x.em||0)<=(x.lstEm||0)){const dif=x.num!==L.num||x.dep!==L.dep||x.data!==L.data||(x.entNome||"")!==L.ent||(x.assunto||"")!==L.assunto;
      if(dif){Object.assign(x,{num:L.num,dep:L.dep,data:L.data,entNome:L.ent,entId:en?en.id:(x.entId||""),dest:Object.assign({},x.dest||{},{org:L.ent}),assunto:L.assunto,lstEm:t0+1,em:t0+1});atual++}else iguais++;continue}
    // já existe na app (feito na app ou mudado depois de importado): não se mexe; só avisa se for outro ofício
    if(norm(x.assunto||"")===norm(L.assunto)||!L.assunto)iguais++;else conf.push({num:L.num,xl:L.assunto,app:x.assunto||"",appNum:x.num})}
  const D=ofDef();D.listUlt={t:t0,nome:file.name,linhas:linhas.length,novos,atual,conf:conf.length,por:String(EU&&EU.email||"")};D.em=t0;
  OFI.t=t0;ofGuardar(null);
  const ult={};linhas.forEach(L=>{if(!ult[L.ciclo]||L.n>ult[L.ciclo])ult[L.ciclo]=L.n});const anoA=ofCiclo(),prox=ofProxN("sai",anoA);
  ofModal(`<h2>Listagem de Ofícios carregada</h2>
    <p>${linhas.length} ofícios lidos de «${esc(file.name)}»${dupl?` (${dupl} repetidos entre folhas, contados uma vez)`:""}.</p>
    <ul class="of-res"><li><b>${novos}</b> novos no Ofício<span class="sup360">360</span></li><li><b>${atual}</b> atualizados (mudaram no Excel)</li><li><b>${iguais}</b> já estavam iguais</li>${entN?`<li><b>${entN}</b> entidades novas</li>`:""}${conf.length?`<li class="bad"><b>${conf.length}</b> com o mesmo número de um ofício feito na app (não foram mudados)</li>`:""}</ul>
    ${conf.length?`<div class="tw"><table class="rt fd-t"><thead><tr><th>N.º</th><th>No Excel</th><th>Na app</th></tr></thead><tbody>${conf.slice(0,15).map(c=>`<tr><td class="fd-nw"><b>${esc(c.num)}</b></td><td>${esc(c.xl)}</td><td>${esc(c.appNum)} · ${esc(c.app)}</td></tr>`).join("")}</tbody></table></div><p class="hint">Enquanto o Excel for usado, dê os números dos ofícios num só sítio, para não haver números repetidos.</p>`:""}
    <p class="hint">O próximo ofício feito na app em ${esc(anoA)} fica com o n.º <b>${prox}</b>. Pode voltar a carregar a listagem sempre que o Excel for atualizado: só entram as novidades e nada é apagado.</p>
    <div class="fd-btns"><span class="grow"></span><button class="b" data-offechar>Fechar</button></div>`,null,true);
  ofRender(curTab)}
async function ofImportarXls(file){if(!ofEd())return;try{if(!window.XLSX)await loadScript("lib/xlsx.mini.min.js");
    const wb=XLSX.read(new Uint8Array(await file.arrayBuffer()),{type:"array"});if(ofEhListagem(wb)){await ofImportarListagem(wb,file);return}const linhas=[];
    for(const sn of wb.SheetNames){const A=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,raw:true,defval:""});const hi=A.findIndex(l=>l.some(c=>/assunto/i.test(String(c))));if(hi<0)continue;
      const H=A[hi].map(c=>norm(String(c||""))),col=(...re)=>H.findIndex(h=>re.some(x=>x.test(h)));
      const C={n:col(/^n\.?\s*[ºo°]?\.?$/,/^numero/,/^n\.?\s*[ºo°]?\s*(de\s+)?(registo|oficio|entrada|saida)/,/^registo$/),data:col(/^data(\s+de\s+(entrada|saida|registo))?$/,/^data/),ent:col(/remetente|destinatario|entidade|^de$|^para$|origem|destino/),
        ass:col(/assunto/),via:col(/^via|meio|forma/),ref:col(/refer|^ref/),cls:col(/classif/),obs:col(/observ|^obs/),tipo:col(/^tipo$|entrada\s*\/\s*saida|^e\/s$/),doc:col(/data\s+do\s+(documento|oficio)/)};
      for(const l of A.slice(hi+1))if(l.some(c=>String(c).trim()))linhas.push({l,C,folha:sn})}
    if(!linhas.length){toast("Não encontrei uma linha de títulos com «Assunto» no Excel");return}
    const temTipo=linhas.some(x=>x.C.tipo>=0);
    ofModal(`<h2>Importar ${linhas.length} linha${linhas.length===1?"":"s"}</h2><p class="hint">De «${esc(file.name)}». Os ofícios com um número que já existe no mesmo ano ficam como estão; os outros juntam-se ao livro de registo.</p>
      <label>Estes ofícios são<select id="ofImpTipo">${temTipo?`<option value="col">como diz a coluna «Tipo» de cada linha</option>`:""}<option value="ent">Entradas</option><option value="sai">Saídas</option></select></label>
      <div class="fd-btns"><span class="grow"></span><button class="b s" data-offechar>Cancelar</button><button class="b imp" data-ofimpok>Importar</button></div>`,(e,bx)=>{
      if(!e.target.closest("[data-ofimpok]"))return;const tsel=bx.querySelector("#ofImpTipo").value;let novos=0,ja=0,sem=0;
      for(const {l,C} of linhas){const g=i=>i>=0?l[i]:"";let tipo=tsel;if(tsel==="col"){const t=norm(String(g(C.tipo)));tipo=/^s|saida|expedid/.test(t)?"sai":"ent"}
        const data=ofXlsData(g(C.data))||"",ass=String(g(C.ass)||"").trim();if(!ass&&!g(C.n)){sem++;continue}
        const nTxt=String(g(C.n)||""),nN=parseInt((nTxt.match(/\d+/)||[])[0],10)||0,cic=(nTxt.match(/(\d{4}(?:\/\d{4})?)\s*$/)||[])[1]||ofCiclo(data||ofHoje());
        if(nN&&OFI.reg.some(x=>x.tipo===tipo&&x.ciclo===cic&&+x.n===nN)){ja++;continue}
        const viaT=norm(String(g(C.via)||"")),via=/aviso|a\.?r\.?$/.test(viaT)?"ar":/regist/.test(viaT)?"registada":/mail|correio\s+eletr/.test(viaT)?"email":/plataf|digital|sga|siges/.test(viaT)?"digital":/mao/.test(viaT)?"mao":viaT?"carta":(tipo==="ent"?"carta":"registada");
        const r={id:uid()+uid(),tipo,n:nN,ciclo:nN?cic:"",num:"",data:data||ofHoje(),dataDoc:ofXlsData(g(C.doc))||"",via,entId:"",entNome:String(g(C.ent)||"").trim(),email:"",dest:{trat:"",nome:"",cargo:"",org:String(g(C.ent)||"").trim(),morada:"",cpl:""},
          assunto:ass,refExt:String(g(C.ref)||"").trim(),refExtData:"",classif:String(g(C.cls)||"").trim(),proc:"",estado:tipo==="ent"?"arq":"env",prazo:"",resp:"",desp:"",respondeA:"",ctt:"",dataEnv:"",arOk:false,corpo:"",anexosTxt:"",anexos:[],
          obs:String(g(C.obs)||"").trim(),hist:[],cr:Date.now(),por:String(EU&&EU.email||""),origem:"importado de "+file.name};
        if(nN)r.num=ofNumTxt(r);else ofNumerar(r);const en=OFI.ent.find(x=>norm(x.org||x.nome)===norm(r.entNome));if(en)r.entId=en.id;
        ofHist(r,"importado de "+file.name);OFI.reg.push(r);novos++}
      ofGuardar(null);bx.remove();toast(`${novos} ofício${novos===1?"":"s"} importado${novos===1?"":"s"}${ja?` · ${ja} já existia${ja===1?"":"m"}`:""}${sem?` · ${sem} linha${sem===1?"":"s"} sem assunto`:""}`);ofRender(curTab)})}
  catch(e){console.warn(e);toast("Não foi possível ler o Excel: "+(e.message||e))}}
(function(){const S=document.getElementById("ofLivro");if(!S)return;
  S.addEventListener("change",e=>{if(e.target.id==="ofLivAno"){OF_UI.livAno=e.target.value;ofLivUI();return}if(e.target.id==="ofLivTipo"){OF_UI.livTipo=e.target.value;ofLivUI();return}
    const x=e.target.closest("[data-ofimpxls]");if(x&&x.files&&x.files[0]){ofImportarXls(x.files[0]);x.value=""}});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.hasAttribute("data-oflivpdf"))ofLivPdf();if(b.hasAttribute("data-oflivxls"))ofExcel(ofLivro())})})();

// ================= Definições =================
function ofDefUI(){const D=ofDef(),dis=ofEd()?"":"disabled",el=$("#ofDefOut");
  const i=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-ofdk="${k}" value="${esc(D[k]??"")}"${o&&o.ph?` placeholder="${esc(o.ph)}"`:""} ${dis}></label>`;
  const ex=ofNumTxt({tipo:"sai",n:ofProxN("sai",ofCiclo()),ciclo:ofCiclo()});
  el.innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Definições</h1><div class="sub">Numeração, papel timbrado, assinatura e mensagens do Ofício360.</div></div></div></div>
  <div class="card"><h2>Numeração</h2><p class="hint">O próximo ofício de saída fica com o n.º <b>${esc(ex)}</b> (o número segue no ano para todos os departamentos, como na Listagem de Ofícios). No «Número das saídas»: {n3} = n.º com 3 algarismos (001), {n} = sem zeros, {dep} = abreviatura do departamento, {ano} = ano. Os números já dados nunca mudam, mesmo que mude estas regras.</p><div class="pp-form">
    ${i("fmtS","Número das saídas",{ph:"{n3}/{dep}/{ano}"})}<label>Departamento por omissão<select data-ofdk="depOm" ${dis}>${ofDepOpts(D.depOm)}</select></label>
    ${i("prefE","Prefixo das entradas",{ph:"E"})}${i("dig","Algarismos das entradas",{type:"number"})}
    <label>Recomeça a contar<select data-ofdk="ciclo" ${dis}>${ofOpts([{v:"civil",t:"Em cada ano civil (1 de janeiro)"},{v:"letivo",t:"Em cada ano letivo (1 de setembro)"}],D.ciclo)}</select></label>
    ${i("prazo","Prazo de resposta por omissão (dias)",{type:"number"})}</div></div>
  <div class="card"><h2>Papel timbrado e assinatura</h2><p class="hint">Os logótipos do cabeçalho e do rodapé são os das Definições da EPISJ<b class="sup360">360</b> (Logótipos).</p><div class="pp-form">
    ${i("local","Localidade")}${i("fecho","Fecho",{w2:1})}${i("sigCargo","Cargo de quem assina")}${i("sigNome","Nome de quem assina")}
    <label class="w2">Remetente (envelopes)<textarea data-ofdk="remetente" rows="3" ${dis}>${esc(D.remetente||"")}</textarea></label>
    <div class="w2 of-sigw">${D.sigImg&&D.sigImg.src?`<img src="${D.sigImg.src}" alt="Assinatura">`:`<span class="hint" style="margin:0">Sem assinatura digitalizada (o ofício sai com espaço para assinar à mão).</span>`}
      ${ofEd()?`<label class="b imp">Importar assinatura (imagem)<input type="file" accept="image/png,image/jpeg" data-ofsig hidden></label>${D.sigImg?`<button class="b s" data-ofsigx>Tirar</button>`:""}`:""}</div></div></div>
  <div class="card"><h2>Departamentos</h2><p class="hint">Uma linha por departamento: <b>abreviatura; nome; quem assina; cargo</b>. A abreviatura entra no número do ofício (154/<b>RC</b>/2026). Quem assina e o cargo são opcionais: se ficarem em branco, vale o que está em «Papel timbrado e assinatura».</p>
    <div class="pp-form"><label class="w2">Departamentos<textarea data-ofdeps rows="10" ${dis}>${esc(D.deps.map(d=>[d.a,d.n,d.sigNome||"",d.sigCargo||""].join("; ").replace(/(; )+$/,"")).join("\n"))}</textarea></label></div></div>
  <div class="card"><h2>Listas</h2><div class="pp-form"><label class="w2">Classificações (uma por linha)<textarea data-ofdl="classif" rows="7" ${dis}>${esc(D.classif.join("\n"))}</textarea></label>
    <label class="w2">Tratamentos (uma por linha)<textarea data-ofdl="trat" rows="4" ${dis}>${esc(D.trat.join("\n"))}</textarea></label></div></div>
  <div class="card"><h2>Email com o ofício</h2><p class="hint">{num} = número do ofício · {assunto} · {assinatura} = cargo e nome de quem assina. Sem ligações para a app (o filtro do Office 365 retém esses emails).</p><div class="pp-form">
    ${i("assuntoEmail","Assunto do email",{w2:1})}<label class="w2">Mensagem<textarea data-ofdk="corpoEmail" rows="6" ${dis}>${esc(D.corpoEmail||"")}</textarea></label></div></div>`}
(function(){const S=document.getElementById("ofDef");if(!S)return;
  S.addEventListener("change",async e=>{if(!ofEd())return;const D=ofDef(),x=e.target;
    if(x.dataset.ofdk){D[x.dataset.ofdk]=x.type==="number"?Math.max(0,+x.value||0):x.value;D.em=Date.now();ofGuardar(null);if(/^pref|dig|ciclo|fmtS|depOm/.test(x.dataset.ofdk))ofDefUI();return}
    if(x.matches("[data-ofdeps]")){const L=x.value.split(/\n/).map(l=>l.split(";").map(c=>c.trim())).filter(c=>c[0]&&c[1]).map(c=>({a:c[0].toUpperCase(),n:c[1],sigNome:c[2]||"",sigCargo:c[3]||""}));
      if(!L.length){toast("Indique pelo menos um departamento");ofDefUI();return}D.deps=L;D.em=Date.now();ofGuardar(null);ofDefUI();return}
    if(x.dataset.ofdl){D[x.dataset.ofdl]=x.value.split(/\n/).map(s=>s.trim()).filter(Boolean);D.em=Date.now();ofGuardar(null);return}
    if(x.matches("[data-ofsig]")&&x.files&&x.files[0]){const f=x.files[0];x.value="";try{const src=await new Promise((ok,ko)=>{const r=new FileReader();r.onload=()=>ok(r.result);r.onerror=ko;r.readAsDataURL(f)});
        const img=await new Promise((ok,ko)=>{const i=new Image();i.onload=()=>ok(i);i.onerror=ko;i.src=src});const k=Math.min(1,600/img.width),cv=document.createElement("canvas");cv.width=Math.round(img.width*k);cv.height=Math.round(img.height*k);
        cv.getContext("2d").drawImage(img,0,0,cv.width,cv.height);D.sigImg={src:cv.toDataURL("image/png"),w:cv.width,h:cv.height};D.em=Date.now();ofGuardar(null);ofDefUI();toast("Assinatura guardada")}catch(er){toast("Não foi possível ler a imagem")}}});
  S.addEventListener("click",e=>{const b=e.target.closest("[data-ofsigx]");if(b&&ofEd()){const D=ofDef();D.sigImg=null;D.em=Date.now();ofGuardar(null);ofDefUI()}})})();
