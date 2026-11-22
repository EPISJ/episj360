/* ===================== WhatsApp (0.9.170) — avisos gratuitos, um clique de cada vez =====================
   A app escreve cada mensagem e abre o WhatsApp (ligação wa.me) com o número e o texto já preenchidos: quem está na escola
   só carrega em «Enviar». Não há custos nem contas na Meta; é só num sentido (escola → formadores / formandos).
   · Fila «um a um» (waFila): passa de pessoa em pessoa; cada «Abrir no WhatsApp» conta como enviado.
   · Texto para um grupo (waGrupo): copiar ou abrir o WhatsApp para escolher o grupo (ex.: grupo de avisos da turma).
   · Aviso livre (waCompor): formadores e/ou formandos de turmas escolhidas.
   Telemóveis: formadores em H3.tel[profId] (já existia, Horários360) e formandos em H3.telF[formandoId] — peça H3 da
   g360_estado, que só a Direção lê. NUNCA pôr o telemóvel em escola.formandos: a escola publicada leva a lista de
   formandos para os formadores. Registo dos envios em H3.wa (os últimos 300). */
function waNum(tel){const t=h3Tel(tel);return t?t.replace(/^\+/,""):""}
function waLink(tel,txt){return "https://wa.me/"+waNum(tel)+"?text="+encodeURIComponent(String(txt||""))}
function waTelVer(tel){const t=h3Tel(tel);if(!t)return "";const m=/^\+351(\d{3})(\d{3})(\d{3})$/.exec(t);return m?`${m[1]} ${m[2]} ${m[3]}`:t}
function waTelProf(p){return (H3&&p&&h3Tel(H3.tel[p.id]))||""}
function waTelFor(f){return (H3&&f&&h3Tel((H3.telF||{})[f.id]))||""}
function waPrimeiro(n){return String(n||"").trim().split(/\s+/)[0]||""}
function waPreencher(tpl,nome){return String(tpl||"").replace(/\{primeiro_nome\}/g,waPrimeiro(nome)).replace(/\{nome\}/g,String(nome||""))}
// grava um telemóvel (formador: "p", formando: "f"); devolve false se o número não for válido. Vazio apaga só esse número.
function waTelGravar(tipo,id,v){if(!H3||!id)return false;v=String(v||"").trim();const n=v?h3Tel(v):"";if(v&&!n)return false;
  if(tipo==="f"){H3.telF=H3.telF||{};H3.telF[id]=n}else H3.tel[id]=n;h3Guardar();return true}
function waRegistar(o,id,quem){if(!H3)return;H3.wa=H3.wa||[];H3.wa.push({t:Date.now(),por:(EU&&EU.email)||"",o,id:id||"",q:quem||""});if(H3.wa.length>300)H3.wa=H3.wa.slice(-300);h3Guardar()}
function waUltimo(o,id){if(!H3||!H3.wa)return 0;let t=0;for(const x of H3.wa)if(x.o===o&&x.id===id&&x.t>t)t=x.t;return t}
// os telemóveis vivem na peça H3: antes de os usar fora do Horários360, carregar e juntar com a nuvem
async function waPronto(){try{await h3Carregar();if(!H3_SINC)await h3TrazerNuvem()}catch(e){}return !!H3}

/* ---------- janela ---------- */
function waJanela(html){waFechar();const bg=document.createElement("div");bg.className="wa-bg";bg.id="waBg";bg.innerHTML=`<div class="wa-box" role="dialog" aria-modal="true">${html}</div>`;
  document.body.appendChild(bg);bg.addEventListener("click",e=>{if(e.target===bg||e.target.closest("[data-wafecha]"))waFechar()});
  document.addEventListener("keydown",waEsc);return bg}
function waEsc(e){if(e.key==="Escape")waFechar()}
function waFechar(){const b=$("#waBg");if(b){b.remove();if(typeof b._fim==="function")try{b._fim()}catch(e){}}document.removeEventListener("keydown",waEsc)}
const WA_ICO=`<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.5c.3 2 2.2 4.2 5 5l1-1.2 1.8.8-.3 1.4c-3.6.4-7.6-3.3-7.8-7l1.4-.4.9 1.7z"/></svg>`;

/* ---------- um a um ----------
   itens: [{id, nome, tel, txt}]; quem não tem telemóvel fica de fora (contado). opt: {titulo, sub, onFeito(item), fim()} */
function waFila(itens,opt){opt=opt||{};const L=(itens||[]).filter(x=>waNum(x.tel)),sem=(itens||[]).filter(x=>!waNum(x.tel));
  if(!L.length){toast(sem.length?`Ninguém com telemóvel (${sem.length} sem número) — escreva os telemóveis primeiro`:"Ninguém para avisar");return}
  let i=0;const feito=new Set();
  const bg=waJanela(`<div class="wa-h"><div><b>${esc(opt.titulo||"Enviar por WhatsApp")}</b><small id="waCnt"></small></div><button class="x" type="button" data-wafecha title="Fechar">×</button></div>
    ${opt.sub?`<p class="hint" style="margin:0 0 10px">${esc(opt.sub)}</p>`:""}
    <div class="wa-quem" id="waQuem"></div>
    <textarea id="waTxt" rows="8" spellcheck="true"></textarea>
    <div class="row wa-bt"><a class="b" id="waAbrir" target="_blank" rel="noopener">${WA_ICO} Abrir no WhatsApp</a><button class="b s" type="button" id="waSeg">Seguinte</button><button class="b s" type="button" id="waAnt">Anterior</button><span class="grow"></span><button class="b s" type="button" data-wafecha>Terminar</button></div>
    <p class="hint" style="margin:8px 0 0">No WhatsApp carregue em <b>Enviar</b>, volte a esta janela e passe ao seguinte. Pode mudar o texto antes de abrir.${sem.length?` <b>${sem.length}</b> sem telemóvel ficaram de fora: ${esc(sem.slice(0,6).map(x=>x.nome).join(", "))}${sem.length>6?"…":""}.`:""}</p>
    <ol class="wa-lista" id="waLista"></ol>`);
  bg._fim=()=>{if(typeof opt.fim==="function")opt.fim(feito.size)};
  const txt=$("#waTxt"),ab=$("#waAbrir");
  const desenha=()=>{const x=L[i];$("#waCnt").textContent=` · ${i+1} de ${L.length} · ${feito.size} enviado${feito.size===1?"":"s"}`;
    $("#waQuem").innerHTML=`<b>${esc(x.nome)}</b><span>${esc(waTelVer(x.tel))}</span>${feito.has(i)?`<span class="tag ok">aberto no WhatsApp</span>`:""}`;
    txt.value=x.txt;ab.href=waLink(x.tel,x.txt);$("#waAnt").disabled=i===0;$("#waSeg").textContent=i===L.length-1?"Terminar":"Seguinte";
    $("#waLista").innerHTML=L.map((y,k)=>`<li class="${k===i?"cur":""}${feito.has(k)?" ok":""}"><button type="button" data-wak="${k}">${esc(y.nome)}</button>${feito.has(k)?" ✓":""}</li>`).join("")};
  txt.oninput=()=>{L[i].txt=txt.value;ab.href=waLink(L[i].tel,txt.value)};
  ab.onclick=()=>{if(!feito.has(i)){feito.add(i);try{if(opt.onFeito)opt.onFeito(L[i])}catch(e){console.warn("WhatsApp",e)}}setTimeout(desenha,50);$("#waSeg").focus()};
  $("#waSeg").onclick=()=>{if(i>=L.length-1){waFechar();return}i++;desenha()};
  $("#waAnt").onclick=()=>{if(i>0){i--;desenha()}};
  $("#waLista").onclick=e=>{const b=e.target.closest("[data-wak]");if(b){i=+b.dataset.wak;desenha()}};
  desenha()}

/* ---------- texto para um grupo ---------- */
function waGrupo(titulo,txt,opt){opt=opt||{};
  waJanela(`<div class="wa-h"><div><b>${esc(titulo||"Texto para o grupo")}</b></div><button class="x" type="button" data-wafecha title="Fechar">×</button></div>
    <p class="hint" style="margin:0 0 10px">${esc(opt.sub||"Copie e cole no grupo do WhatsApp, ou abra o WhatsApp e escolha o grupo.")}</p>
    <textarea id="waTxt" rows="10"></textarea>
    <div class="row wa-bt"><button class="b" type="button" id="waCp">Copiar o texto</button><a class="b s" id="waAbrir" target="_blank" rel="noopener">${WA_ICO} Abrir no WhatsApp e escolher o grupo</a><span class="grow"></span><button class="b s" type="button" data-wafecha>Fechar</button></div>`);
  const t=$("#waTxt"),ab=$("#waAbrir");t.value=txt||"";ab.href=waLink("",t.value);t.oninput=()=>{ab.href=waLink("",t.value)};
  let feito=false;const marca=()=>{if(!feito){feito=true;try{if(opt.onFeito)opt.onFeito()}catch(e){}}};
  $("#waCp").onclick=()=>{copy(t.value);marca()};ab.onclick=marca}

/* ---------- aviso livre (formadores e/ou turmas) ---------- */
async function waCompor(pre){pre=pre||{};if(!podePublicar()||RO){toast("Só a Direção envia avisos");return}await waPronto();
  const E=escData(),a=anoAtivo(),viva=t=>{try{return forTurmaViva(t)}catch(e){return true}};
  const T=E.turmas.filter(viva).map(t=>({t,fs:E.formandos.filter(f=>f.turmaId===t.id&&!f.estado)})).filter(x=>x.fs.length).sort((x,y)=>COLL_PTN.compare(x.t.cod||"",y.t.cod||""));
  const nP=cfg.profs.filter(p=>waTelProf(p)).length;
  waJanela(`<div class="wa-h"><div><b>Aviso por WhatsApp</b><small> · gratuito, um clique por pessoa</small></div><button class="x" type="button" data-wafecha title="Fechar">×</button></div>
    <div class="wa-dest"><label class="chk"><input type="checkbox" id="waCP"${pre.formadores?" checked":""}> Formadores <small>(${nP} de ${cfg.profs.length} com telemóvel)</small></label>
    <div class="wa-tur">${T.map(({t,fs})=>`<label class="chk"><input type="checkbox" data-watur="${esc(t.id)}"${(pre.turmas||[]).includes(t.id)?" checked":""}> ${esc(t.cod||turmaNome(t))} <small>(${fs.filter(f=>waTelFor(f)).length}/${fs.length})</small></label>`).join("")||`<span class="hint">Sem turmas com formandos em ${esc(a.nome)}.</span>`}</div></div>
    <label class="h3lb" style="margin-top:8px">Mensagem <small class="hint">— pode usar {primeiro_nome} e {nome}</small><textarea id="waMsg" rows="7">${esc(pre.txt||"Olá {primeiro_nome},\n\n\n\nCom os melhores cumprimentos,\nDireção Pedagógica — EPISJ")}</textarea></label>
    <div class="row wa-bt"><button class="b" type="button" id="waUm">${WA_ICO} Um a um no WhatsApp</button><button class="b s" type="button" id="waGr">Texto para o grupo</button><span class="grow"></span><span class="hint" id="waN" style="margin:0"></span></div>`);
  const dest=()=>{const out=[];if($("#waCP").checked)cfg.profs.forEach(p=>out.push({id:"p:"+p.id,nome:p.nome,tel:waTelProf(p),tipo:"p"}));
    document.querySelectorAll("[data-watur]:checked").forEach(c=>{const x=T.find(y=>y.t.id===c.dataset.watur);if(x)x.fs.forEach(f=>out.push({id:"f:"+f.id,nome:f.nome,tel:waTelFor(f),tipo:"f",tur:x.t.cod}))});return out};
  const conta=()=>{const D=dest(),c=D.filter(x=>waNum(x.tel)).length;$("#waN").textContent=D.length?`${c} de ${D.length} com telemóvel`:"Escolha os destinatários"};
  document.querySelectorAll("#waCP,[data-watur]").forEach(i=>i.onchange=conta);conta();
  $("#waUm").onclick=()=>{const D=dest(),m=$("#waMsg").value;if(!D.length){toast("Escolha os destinatários");return}
    waFila(D.map(x=>Object.assign({},x,{txt:waPreencher(m,x.nome)})),{titulo:"Aviso por WhatsApp",onFeito:x=>waRegistar("aviso",x.id,x.nome)})};
  $("#waGr").onclick=()=>{const m=$("#waMsg").value.replace(/Olá \{primeiro_nome\},?/,"Olá a todos,").replace(/\{primeiro_nome\}|\{nome\}/g,"");waGrupo("Texto para o grupo",m,{onFeito:()=>waRegistar("grupo","","aviso")})}}

$("#forWa").onclick=()=>{const t=$("#forTurmaF").value;waCompor({turmas:t?[t]:[]})};
$("#profWa").onclick=()=>waCompor({formadores:true});
