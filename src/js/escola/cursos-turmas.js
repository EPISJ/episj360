/* ---------- cursos (com o Catálogo Nacional de Qualificações) ---------- */
const hSoma=a=>a.reduce((s,i)=>s+(i.h||0),0);
function grupoEsc(c,g){const ch=(c.gEsc||{})[g.nome];return g.discs.find(d=>d.cod===ch)||g.discs.find(d=>d.h)||g.discs[0]}
function cursoPlanoHTML(c){const it=c.itens||[],U=c.qual&&c.qual.conceito==="RA"?"UC":"UFCD",ab=k=>CUR_ABERTOS.has(c.id+"|"+k)?" open":"";
  if(!it.length&&!(c.escolar||[]).length)return "";
  const li=(cod,nome,h,extra)=>`<span><b>${esc(cod)}</b> ${esc(nome)}${h?` · ${h} h`:""}${extra||""}</span>`;let out="";
  for(const [ci,comp] of (c.escolar||[]).entries()){let hc=0;
    const gs=comp.grupos.map((g,gi)=>{const d0=grupoEsc(c,g);hc+=d0&&d0.h||0;
      if(g.discs.length>1&&/\sou\s/i.test(g.nome)){ // a escola escolhe (ex.: TIC ou Oferta de Escola)
        const oe=/oferta de escola/i.test(d0.nome);
        return `<div class="cpg"><div class="cpgn">${esc(g.nome)} <span class="tag" style="background:var(--brandbg);color:var(--brand)">escolha da escola</span></div>
          <div class="snqh"><select data-gesc="${esc(g.nome)}" style="max-width:420px">${g.discs.map(d=>`<option value="${esc(d.cod)}" ${d===d0?"selected":""}>${esc(d.nome)}${d.h?` · ${d.h} h`:""}</option>`).join("")}</select>
          ${oe?`<input type="text" data-oesc="${esc(g.nome)}" value="${esc((c.ofertaEsc||{})[g.nome]||"")}" placeholder="Designação da oferta de escola" style="flex:1;min-width:200px">`:""}</div></div>`}
      const alt=g.discs.filter(d=>d!==d0);
      return `<div class="cpg"><div class="cpgn">${esc(g.nome||comp.nome)}</div><div class="snqi">${li(d0.cod,d0.nome,d0.h)}${alt.length?`<span class="hint" style="margin:0">Alternativas: ${alt.map(d=>esc(d.nome)).join(" · ")}</span>`:""}</div></div>`}).join("");
    out+=`<details class="cpc" data-dk="e${ci}"${ab("e"+ci)}><summary><b>${esc(comp.nome)}</b><span class="hint" style="margin:0">${hc?hc+" h":""}</span></summary>${gs}</details>`}
  if(it.length){const ob=it.filter(i=>!i.opc),op=it.filter(i=>i.opc),es=new Set(c.opcEsc||[]),hE=hSoma(op.filter(i=>es.has(i.cod))),req=c.opcH||0;
    const st=!op.length?"":req?(hE===req?`<span class="tag" style="background:var(--okbg);color:var(--ok)">${hE} de ${req} h escolhidas</span>`:`<span class="tag ${hE>req?"bad":"exc"}">${hE} de ${req} h escolhidas</span>`):`<span class="tag" style="background:#eef1f5;color:#4a5260">${hE} h escolhidas</span>`;
    const bol=[...new Set(op.map(i=>i.bolsa||""))];
    out+=`<details class="cpc" data-dk="tec"${ab("tec")}><summary><b>Formação Tecnológica</b><span class="hint" style="margin:0">${hSoma(ob)} h obrigatórias${op.length?` + ${req?req+" h":""} opcionais`:""}</span>${st}</summary>
      <div class="cpg"><div class="cpgn">${U} obrigatórias (${ob.length} · ${hSoma(ob)} h)</div><div class="snqi">${ob.map(i=>li(i.cod,i.nome,i.h)).join("")}</div></div>
      ${op.length?`<div class="cpg"><div class="cpgn">${U} opcionais — a escola escolhe${req?` <b>${req} h</b>`:""} (${op.length} na bolsa)</div>
        ${bol.map(b=>`${b?`<div class="hint" style="margin:6px 0 2px">${esc(b)}</div>`:""}<div class="snqi">${op.filter(i=>(i.bolsa||"")===b).map(i=>`<label class="cpo"><input type="checkbox" data-opc="${esc(i.cod)}" ${es.has(i.cod)?"checked":""}> ${li(i.cod,i.nome,i.h)}</label>`).join("")}</div>`).join("")}</div>`:""}</details>`}
  const nota=c.qual&&(c.escolar===undefined||!it.some(i=>"opc" in i)&&c.opcH===undefined)?`<p class="hint" style="margin:6px 0 0">Carregue em <b>Atualizar do catálogo</b> para ver as componentes sociocultural e científica e separar as ${U} obrigatórias das opcionais.</p>`:"";
  return nota+out}
let CUR_ABERTOS=new Set();
function renderCursos(){const e=escData(),q=norm($("#curFilter").value||"");
  CUR_ABERTOS=new Set([...document.querySelectorAll("#curList [data-cur] details[open][data-dk]")].map(x=>x.closest("[data-cur]").dataset.cur+"|"+x.dataset.dk));
  const L=e.cursos.filter(c=>!q||norm(c.nome+" "+(c.sigla||"")+" "+(c.qual?c.qual.cod+" "+c.qual.nome:"")).includes(q));
  $("#curList").innerHTML=L.map(c=>{const nT=e.turmas.filter(t=>t.cursoId===c.id).length,nA=turmasDoAno().filter(t=>t.cursoId===c.id).length,it=c.itens||[];
    return `<div class="snq" data-cur="${c.id}"><div class="snqh">
      <input type="text" data-k="nome" value="${esc(c.nome)}" style="flex:1;min-width:220px;font-weight:600">
      <input type="text" data-k="sigla" value="${esc(c.sigla||"")}" placeholder="Sigla" style="width:90px">
      <select data-k="tipo" style="width:auto">${["Profissional","Aprendizagem","EFA","CET / CTeSP","Formação modular","Outro"].map(t=>`<option ${t===(c.tipo||"Profissional")?"selected":""}>${t}</option>`).join("")}</select>
      <span class="hint" style="margin:0">${nT} turma(s)${nA?` · ${nA} neste ano`:""}</span>
      <button class="x" data-del title="Apagar curso">×</button></div>
      <div class="snqh" style="margin-top:8px">${c.qual?`<a href="https://catalogo.snq.gov.pt/qualificacoesDetalhe/${c.qual.id}" target="_blank" rel="noopener">${esc(c.qual.nome)}</a><span class="tag" style="background:#eef1f5;color:#4a5260">${esc(c.qual.cod)} · nível ${esc(c.qual.nivel||"?")} · ${c.qual.conceito==="RA"?"UC":"UFCD"} · referencial de ${esc(c.qual.data||"?")}</span>`:`<span class="tag bad">sem ligação ao catálogo</span>`}
      <span class="grow"></span>${c.cands&&c.cands.length>1?`<select data-pick style="max-width:320px"><option value="">outra qualificação…</option>${c.cands.map(x=>`<option value="${esc(x.cod)}">${esc(x.nome)} (${esc(x.cod)}, nível ${esc(x.nivel)})</option>`).join("")}</select>`:""}
      <button class="b s" data-cnq>${c.qual?"Atualizar do catálogo":"Procurar no catálogo"}</button></div>
      ${cursoPlanoHTML(c)}</div>`}).join("")
    ||`<p class="hint">${e.cursos.length?"Nenhum curso corresponde à procura.":"Ainda sem cursos — crie um acima ou importe as turmas da Box."}</p>`}
$("#curFilter").addEventListener("input",debounce(()=>renderCursos(),120));
$("#curForm").addEventListener("submit",e=>{e.preventDefault();const nome=$("#cNome").value.trim();if(!nome)return;const E=escData();
  if(E.cursos.some(c=>norm(c.nome)===norm(nome))){toast("Esse curso já existe");return}
  const c={id:uid(),nome,sigla:$("#cSigla").value.trim(),tipo:"Profissional",qual:null,itens:[]};E.cursos.push(c);E.cursos.sort((a,b)=>COLL_PT.compare(a.nome,b.nome));save();$("#curForm").reset();renderCursos();
  if($("#cCnq").checked)cursoCnq(c.id)});
$("#curList").addEventListener("change",e=>{const box=e.target.closest("[data-cur]");if(!box)return;const c=cursoById(box.dataset.cur);if(!c)return;
  if(e.target.matches("[data-pick]")){if(e.target.value)cursoCnq(c.id,e.target.value);return}
  if(e.target.matches("[data-opc]")){const s=new Set(c.opcEsc||[]);e.target.checked?s.add(e.target.dataset.opc):s.delete(e.target.dataset.opc);c.opcEsc=[...s];save();renderCursos();return}
  if(e.target.matches("[data-gesc]")){(c.gEsc=c.gEsc||{})[e.target.dataset.gesc]=e.target.value;save();renderCursos();return}
  if(e.target.matches("[data-oesc]")){(c.ofertaEsc=c.ofertaEsc||{})[e.target.dataset.oesc]=e.target.value.trim();save();return}
  const k=e.target.dataset.k;if(!k)return;c[k]=e.target.value.trim();save();if(k==="nome"){renderTurmas();esRecarregar()}if(k==="tipo"&&c.qual)cursoCnq(c.id,c.qual.cod)});
$("#curList").addEventListener("click",e=>{const box=e.target.closest("[data-cur]");if(!box)return;const E=escData(),c=cursoById(box.dataset.cur);if(!c)return;
  if(e.target.hasAttribute("data-cnq")){cursoCnq(c.id);return}
  if(e.target.hasAttribute("data-del")){const nT=E.turmas.filter(t=>t.cursoId===c.id).length;if(nT&&!confirm(`O curso ${c.nome} tem ${nT} turma(s). Apagar na mesma? As turmas ficam sem curso.`))return;
    ponto("Antes de apagar o curso "+c.nome);E.cursos=E.cursos.filter(x=>x!==c);E.turmas.forEach(t=>{if(t.cursoId===c.id)t.cursoId=""});save();escRender();toast("Curso apagado (pode anular)")}});
$("#curCnqTodos").onclick=async()=>{const L=escData().cursos.filter(c=>!c.qual);if(!L.length){toast("Todos os cursos já estão ligados ao catálogo");return}
  ponto("Antes de ligar os cursos ao catálogo");for(let i=0;i<L.length;i++){$("#curMsg").textContent=`A consultar o catálogo: ${i+1} de ${L.length} — ${L[i].nome}…`;await cursoCnq(L[i].id,"",true)}
  $("#curMsg").textContent="Concluído.";renderCursos()};
// mesma procura que o BoxCheck faz para as turmas: escolhe a versão do referencial em vigor no início do ano letivo ativo (ou da turma mais antiga do curso)
async function cursoCnq(id,forcar,calado){const c=cursoById(id);if(!c)return;
  const ini=Math.min(...escData().turmas.filter(t=>t.cursoId===id&&t.anoIni).map(t=>t.anoIni).concat([anoAtivo().ini]));
  if(!calado)$("#curMsg").textContent=`A consultar o catálogo — ${c.nome}…`;
  try{let cands=await snqProcura(c.nome);
    if(!cands.length){const w=c.nome.split(/\s+/).filter(x=>x.length>2);if(w.length>1)cands=await snqProcura(w.slice(0,2).join(" "))}
    cands.forEach(x=>x.sc=snqScore(c.nome,x));cands.sort((a,b)=>b.sc-a.sc);
    let es=forcar?cands.filter(x=>x.cod===forcar):[];
    if(!es.length&&cands.length){const top=cands[0],nb=semTecnico(top.nome);es=cands.filter(x=>semTecnico(x.nome)===nb&&x.nivel===top.nivel);if(!es.length)es=[top]}
    c.cands=cands.slice(0,12).map(({cod,nivel,id,nome,conceito})=>({cod,nivel,id,nome,conceito}));
    if(es.length){const v=await snqVersao(es,ini);if(v){c.qual={cod:v.qual.cod,nome:v.qual.nome,nivel:v.qual.nivel,id:v.id,data:v.data,conceito:v.conceito};
      const T=await snqTec(v.id,v.conceito);c.itens=T.itens;c.opcH=T.opcH;
      if(c.opcEsc)c.opcEsc=c.opcEsc.filter(k=>c.itens.some(i=>i.opc&&i.cod===k));
      const mod=SNQ_MOD[c.tipo||"Profissional"];c.escolar=[];if(mod){try{c.escolar=await snqEscolar(v.id,mod)}catch(x){}}}}
    else c.qual=null;
    save();if(!calado){$("#curMsg").textContent=c.qual?`${c.nome} → ${c.qual.nome} (${c.itens.filter(i=>!i.opc).length} ${c.qual.conceito==="RA"?"UC":"UFCD"} obrigatórias${c.itens.some(i=>i.opc)?` + ${c.itens.filter(i=>i.opc).length} opcionais`:""}${(c.escolar||[]).length?" · "+c.escolar.map(x=>x.nome.replace(/^Formação /,"")).join(", "):""}).`:`${c.nome}: não encontrado no catálogo.`}}
  catch(err){$("#curMsg").textContent="Não foi possível consultar o catálogo: "+err.message}
  renderCursos()}

/* ---------- turmas ---------- */
function renderTurmas(){const e=escData(),a=anoAtivo(),q=norm($("#turFilter").value||""),todas=$("#turTodas").checked;
  $("#turAnoLbl").textContent=a.nome;
  const curOpts=sel=>`<option value="">— sem curso —</option>`+e.cursos.map(c=>`<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(c.nome)}</option>`).join("");
  const L=(todas?e.turmas.slice().sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod))):turmasDoAno(a))
    .filter(t=>!q||norm(t.cod+" "+turmaNome(t)+" "+((cursoById(t.cursoId)||{}).nome||"")+" "+profName(t.dt)+" "+(t.fse||"")).includes(q));
  $("#tbTur").innerHTML=L.map(t=>{const ac=anoCurricular(t,a);return `<tr data-id="${t.id}">
    <td><input type="text" data-k="cod" value="${esc(t.cod)}" style="width:70px"></td>
    <td><select data-k="cursoId">${curOpts(t.cursoId)}</select></td>
    <td><input type="number" data-k="anoIni" value="${t.anoIni||""}" min="2000" max="2100" style="width:84px"></td>
    <td><input type="number" data-k="anoFim" value="${t.anoFim||""}" min="2000" max="2100" style="width:84px"></td>
    <td class="hm">${ac?esc(ac):`<span class="hint" style="margin:0">fora de ${esc(a.nome)}</span>`}</td>
    <td><select data-k="dt">${lzOpts("prof",t.dt,`<option value="">— sem orientador educativo —</option>`)}</select></td>
    <td><input type="text" data-k="fse" value="${esc(t.fse||"")}" placeholder="código FSE" spellcheck="false" style="min-width:190px;text-transform:uppercase;font-variant-numeric:tabular-nums"${t.fse&&!fseOk(t.fse)?` title="Confirme o código: o habitual é REGIÃO-00-0000-FSE-000000"`:""}></td>
    <td class="hm"><input type="text" data-k="nome" value="${esc(t.nome||"")}" placeholder="${esc(turmaNome(Object.assign({},t,{nome:""})))}"></td>
    <td><button class="x" data-del title="Apagar turma">×</button></td></tr>`}).join("")
    ||`<tr><td colspan="9" class="hint">${e.turmas.length?(q?"Nenhuma turma corresponde à procura.":`Nenhuma turma em ${esc(a.nome)} — veja <b>todas as turmas</b> ou crie uma acima.`):"Ainda sem turmas — crie uma acima ou importe da Box."}</td></tr>`;
  $("#tCurso").innerHTML=curOpts($("#tCurso").value);if(!$("#tIni").value)$("#tIni").placeholder=a.ini;if(!$("#tFim").value)$("#tFim").placeholder=a.ini+3}
$("#turFilter").addEventListener("input",debounce(()=>renderTurmas(),120));$("#turTodas").addEventListener("change",renderTurmas);
$("#tbTur").addEventListener("change",e=>{const tr=e.target.closest("tr");const t=escData().turmas.find(x=>x.id===tr.dataset.id);if(!t)return;const k=e.target.dataset.k;
  t[k]=/^anoIni|anoFim$/.test(k)?(parseInt(e.target.value)||null):e.target.value.trim();if(k==="cod")t.cod=t.cod.toUpperCase();
  if(k==="fse"){t.fse=fseNorm(t.fse);if(t.fse&&!fseOk(t.fse))toast("Guardado — mas confirme o código FSE (o habitual é ACORES-10-5571-FSE-000123)")}
  save();renderTurmas();esRecarregar()});
$("#tbTur").addEventListener("click",e=>{if(!e.target.hasAttribute("data-del"))return;const E=escData(),t=E.turmas.find(x=>x.id===e.target.closest("tr").dataset.id);if(!t)return;
  ponto("Antes de apagar a turma "+t.cod);E.turmas=E.turmas.filter(x=>x!==t);save();escRender();esRecarregar();toast("Turma apagada (pode anular)")});
// 0.9.15: código do projeto do Fundo Social Europeu de cada turma
const fseNorm=v=>String(v||"").trim().toUpperCase().replace(/\s+/g,"").replace(/[‐-―]/g,"-");
const fseOk=v=>/^[A-Z]+-\d{2}-\d{4}-FSE\+?-\d{6}$|^[A-Z]+\d{4}-FSE\+?-\d{6,8}$/.test(fseNorm(v));
$("#turForm").addEventListener("submit",e=>{e.preventDefault();const a=anoAtivo(),cod=$("#tCod").value.trim().toUpperCase();if(!cod)return;
  const ai=parseInt($("#tIni").value)||a.ini,af=parseInt($("#tFim").value)||ai+3;
  if(escData().turmas.some(t=>norm(t.cod)===norm(cod)&&t.anoIni===ai)){toast("Já existe a turma "+cod+" com início em "+ai);return}
  const fse=fseNorm($("#tFse").value);
  escData().turmas.push({id:uid(),cod,nome:"",cursoId:$("#tCurso").value,anoIni:ai,anoFim:af,dt:"",fse});save();$("#turForm").reset();escRender();esRecarregar();
  toast("Turma "+cod+" criada"+(fse&&!fseOk(fse)?" — confirme o código FSE":""))});

function escRender(){renderAnoTopo();if(curTab==="esc")renderEscPainel();if(curTab==="anos")renderAnos();if(curTab==="cur")renderCursos();if(curTab==="tur")renderTurmas();if(curTab==="for")renderFormandos();if(curTab==="pc")renderPC();if(curTab==="cal")renderCal();if(curTab&&curTab.startsWith("cr"))crRender(curTab);if(curTab==="dsd")renderDSD()}

/* ---------- formandos (dados gerais partilhados) ---------- */
function turmaOpts(sel,first){return (first??`<option value="">— sem turma —</option>`)+escData().turmas.slice().sort((a,b)=>COLL_PTN.compare(String(a.cod),String(b.cod))).map(t=>`<option value="${t.id}" ${t.id===sel?"selected":""}>${esc(t.cod)}${turmaNoAno(t,anoAtivo())?"":" (outro ano)"}</option>`).join("")}
function turmaPorCod(cod){const a=anoAtivo(),L=escData().turmas.filter(t=>norm(t.cod)===norm(cod));return L.find(t=>turmaNoAno(t,a))||L[0]||null}
function renderFormandos(){const e=escData(),q=norm($("#forFilter").value||""),ft=$("#forTurmaF").value;
  $("#forTurmaF").innerHTML=turmaOpts(ft,`<option value="">Todas as turmas</option>`);$("#fTurma").innerHTML=turmaOpts($("#fTurma").value);$("#forBulkT").innerHTML=turmaOpts($("#forBulkT").value,`<option value="">— na própria lista —</option>`);
  const TC=new Map(e.turmas.map(t=>[t.id,t.cod||""])),cod=id=>TC.get(id)||"";
  const CN=new Intl.Collator("pt",{numeric:true}),CP=new Intl.Collator("pt");
  const L=e.formandos.filter(f=>(!ft||f.turmaId===ft)&&(!q||norm((f.num||"")+" "+f.nome).includes(q))).sort((a,b)=>CN.compare(cod(a.turmaId),cod(b.turmaId))||CN.compare(String(a.num),String(b.num))||CP.compare(a.nome,b.nome));
  FOR_N=FOR_N||200;const resto=L.length-FOR_N;
  $("#tbFor").innerHTML=L.slice(0,FOR_N).map(f=>`<tr data-id="${f.id}"><td><input type="text" data-k="num" value="${esc(f.num||"")}"></td><td><input type="text" data-k="nome" value="${esc(f.nome)}"></td><td><select data-k="turmaId">${lzOpts("turma",f.turmaId)}</select></td><td><button class="x" data-del title="Apagar">×</button></td></tr>`).join("")+(resto>0?`<tr><td colspan="4" style="text-align:center"><button class="b s" type="button" data-formais>Mostrar mais ${Math.min(resto,500)} (faltam ${resto}) — ou escolha a turma acima</button></td></tr>`:"")
    ||`<tr><td colspan="4" class="hint">${e.formandos.length?"Ninguém corresponde à procura.":"Ainda sem formandos — acrescente acima ou cole uma lista."}</td></tr>`;
  $("#forCnt").textContent=e.formandos.length?`${L.length} de ${e.formandos.length} formando(s)${resto>0?" — a mostrar os primeiros "+FOR_N:""}.`:""}
var FOR_N=200;
{let h=null;$("#forFilter").addEventListener("input",()=>{FOR_N=200;clearTimeout(h);h=setTimeout(renderFormandos,120)})}$("#forTurmaF").addEventListener("change",()=>{FOR_N=200;renderFormandos()});
$("#tbFor").addEventListener("change",e=>{const tr=e.target.closest("tr");const f=escData().formandos.find(x=>x.id===tr.dataset.id);if(!f)return;f[e.target.dataset.k]=e.target.value.trim();save();esRecarregar()});
$("#tbFor").addEventListener("click",e=>{if(e.target.hasAttribute("data-formais")){FOR_N+=500;renderFormandos();return}if(!e.target.hasAttribute("data-del"))return;const E=escData();const f=E.formandos.find(x=>x.id===e.target.closest("tr").dataset.id);if(!f)return;ponto("Antes de apagar o formando "+f.nome);E.formandos=E.formandos.filter(x=>x!==f);save();renderFormandos();esRecarregar();toast("Formando apagado (pode anular)")});
$("#forForm").addEventListener("submit",e=>{e.preventDefault();const nome=$("#fNome").value.trim();if(!nome)return;escData().formandos.push({id:uid(),num:$("#fNum").value.trim(),nome,turmaId:$("#fTurma").value});save();const t=$("#fTurma").value;$("#forForm").reset();$("#fTurma").value=t;renderFormandos();esRecarregar();$("#fNum").focus()});
$("#forImport").onclick=()=>{const lines=$("#forBulk").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
  ponto("Antes de colar uma lista de formandos");const E=escData(),fix=$("#forBulkT").value;let add=0,upd=0,bad=0;
  for(const l of lines){let p=l.split(/\t|;/).map(x=>x.trim()).filter(Boolean);if(!p.length)continue;
    if(/^(n\.?º|num|número|numero)$/i.test(p[0])||/^nome$/i.test(p[0]))continue;
    let num="",turma=null;if(/^\d{1,5}$/.test(p[0])){num=p.shift()}
    if(!fix&&p.length>1){const t=turmaPorCod(p[p.length-1]);if(t){turma=t;p.pop()}}
    const nome=p.join(" ").trim();const tid=fix||(turma&&turma.id)||"";if(!nome){bad++;continue}
    const ex=E.formandos.find(f=>(num&&f.num===num&&f.turmaId===tid)||norm(f.nome)===norm(nome));
    if(ex){if(num)ex.num=num;if(tid)ex.turmaId=tid;upd++}else{E.formandos.push({id:uid(),num,nome,turmaId:tid});add++}}
  save();renderFormandos();esRecarregar();$("#forMsg").textContent=`${add} acrescentado(s), ${upd} atualizado(s)${bad?`, ${bad} linha(s) ignorada(s)`:""}.`;if(add||upd)$("#forBulk").value=""};


