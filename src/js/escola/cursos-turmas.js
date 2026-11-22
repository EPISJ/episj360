/* ---------- cursos (com o Catálogo Nacional de Qualificações) ---------- */
const hSoma=a=>a.reduce((s,i)=>s+(i.h||0),0);
// Plano próprio de uma turma (0.9.137): turmas do mesmo curso podem ter escolhas diferentes (TIC ou oferta de escola,
// UFCD/UC opcionais). Fica em t.planoCur={cursoId,gEsc,opcEsc,ofertaEsc}; só vale enquanto a turma for desse curso.
function turmaPlanoProprio(t){const p=t&&t.planoCur;return p&&p.cursoId&&p.cursoId===t.cursoId?p:null}
function planoEscolhas(t){const c=t&&cursoById(t.cursoId);return turmaPlanoProprio(t)||c||null}
function opcEscolhidasOk(c,o){const es=new Set(o.opcEsc||[]);return hSoma((c.itens||[]).filter(i=>i.opc&&es.has(i.cod)))>=(c.opcH||0)}
function cursoOpcOk(c){return opcEscolhidasOk(c,c)&&escData().turmas.every(t=>t.cursoId!==c.id||!turmaPlanoProprio(t)||opcEscolhidasOk(c,t.planoCur))}
let CUR_PT=new Map();
function grupoEsc(c,g){const ch=(c.gEsc||{})[g.nome];return g.discs.find(d=>d.cod===ch)||g.discs.find(d=>d.h)||g.discs[0]}
function cursoPlanoHTML(c,o){o=o||c;const it=c.itens||[],U=c.qual&&c.qual.conceito==="RA"?"UC":"UFCD",ab=k=>CUR_ABERTOS.has(c.id+"|"+k)?" open":"";
  if(!it.length&&!(c.escolar||[]).length)return "";
  const li=(cod,nome,h,extra)=>`<span><b>${esc(cod)}</b> ${esc(nome)}${h?` · ${h} h`:""}${extra||""}</span>`;let out="";
  for(const [ci,comp] of (c.escolar||[]).entries()){let hc=0;
    const gs=comp.grupos.map((g,gi)=>{const d0=grupoEsc(o,g);hc+=d0&&d0.h||0;
      if(g.discs.length>1&&/\sou\s/i.test(g.nome)){ // a escola escolhe (ex.: TIC ou Oferta de Escola)
        const oe=/oferta de escola/i.test(d0.nome);
        return `<div class="cpg"><div class="cpgn">${esc(g.nome)} <span class="tag" style="background:var(--brandbg);color:var(--brand)">escolha da escola</span></div>
          <div class="snqh"><select data-gesc="${esc(g.nome)}" style="max-width:420px">${g.discs.map(d=>`<option value="${esc(d.cod)}" ${d===d0?"selected":""}>${esc(d.nome)}${d.h?` · ${d.h} h`:""}</option>`).join("")}</select>
          ${oe?`<input type="text" data-oesc="${esc(g.nome)}" value="${esc((o.ofertaEsc||{})[g.nome]||"")}" placeholder="Designação da oferta de escola" style="flex:1;min-width:200px">`:""}</div></div>`}
      const alt=g.discs.filter(d=>d!==d0);
      return `<div class="cpg"><div class="cpgn">${esc(g.nome||comp.nome)}</div><div class="snqi">${li(d0.cod,d0.nome,d0.h)}${alt.length?`<span class="hint" style="margin:0">Alternativas: ${alt.map(d=>esc(d.nome)).join(" · ")}</span>`:""}</div></div>`}).join("");
    out+=`<details class="cpc" data-dk="e${ci}"${ab("e"+ci)}><summary><b>${esc(comp.nome)}</b><span class="hint" style="margin:0">${hc?hc+" h":""}</span></summary>${gs}</details>`}
  if(it.length){const ob=it.filter(i=>!i.opc),op=it.filter(i=>i.opc),es=new Set(o.opcEsc||[]),hE=hSoma(op.filter(i=>es.has(i.cod))),req=c.opcH||0;
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
      ${cursoPlanosTurmas(c)}</div>`}).join("")
    ||`<p class="hint">${e.cursos.length?"Nenhum curso corresponde à procura.":"Ainda sem cursos — crie um acima ou importe as turmas da Box."}</p>`}
function cursoPlanosTurmas(c){const E=escData(),T=E.turmas.filter(t=>t.cursoId===c.id).sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod)));
  const base=cursoPlanoHTML(c);if(!base)return "";if(!T.length)return `<div data-pt="">${base}</div>`;
  let sel=CUR_PT.get(c.id)||"";if(sel&&!T.some(t=>t.id===sel))sel="";
  const prop=T.filter(t=>turmaPlanoProprio(t)),tn=t=>`${t.cod}${t.anoIni&&t.anoFim?` (${String(t.anoIni).slice(-2)}-${String(t.anoFim).slice(-2)})`:""}`;
  const bar=`<div class="snqh cpt"><label>Plano de<select data-ptsel><option value="">Curso — turmas que seguem o plano do curso</option>${T.map(t=>`<option value="${t.id}" ${t.id===sel?"selected":""}>${esc(tn(t))}${turmaPlanoProprio(t)?" · plano próprio":""}</option>`).join("")}</select></label>
    <span class="hint" style="margin:0">${prop.length?`Com plano próprio: <b>${prop.map(t=>esc(t.cod)).join(", ")}</b>`:"Todas as turmas seguem o plano do curso"}</span></div>`;
  if(!sel)return bar+`<div data-pt="">${base}</div>`;
  const t=T.find(x=>x.id===sel),pp=turmaPlanoProprio(t);
  if(!pp)return bar+`<div class="msg info cptm"><span>A turma <b>${esc(tn(t))}</b> segue o plano do curso (as escolhas acima, em «Curso»). Se esta turma tem um plano curricular diferente (outra escolha da escola ou outras ${c.qual&&c.qual.conceito==="RA"?"UC":"UFCD"} opcionais), crie um plano próprio.</span><button class="b s" type="button" data-ptcria>Criar plano próprio para ${esc(t.cod)}</button></div>`;
  return bar+`<div class="msg info cptm"><span>A turma <b>${esc(tn(t))}</b> tem <b>plano próprio</b>: as escolhas abaixo valem só para ela; as outras turmas continuam com o plano do curso.</span><button class="b s" type="button" data-ptvolta>Voltar a seguir o plano do curso</button></div><div data-pt="${t.id}">${cursoPlanoHTML(c,pp)}</div>`}
$("#curFilter").addEventListener("input",debounce(()=>renderCursos(),120));
$("#curForm").addEventListener("submit",e=>{e.preventDefault();const nome=$("#cNome").value.trim();if(!nome)return;const E=escData();
  if(E.cursos.some(c=>norm(c.nome)===norm(nome))){toast("Esse curso já existe");return}
  const c={id:uid(),nome,sigla:$("#cSigla").value.trim(),tipo:"Profissional",qual:null,itens:[]};E.cursos.push(c);E.cursos.sort((a,b)=>COLL_PT.compare(a.nome,b.nome));save();$("#curForm").reset();renderCursos();
  if($("#cCnq").checked)cursoCnq(c.id)});
$("#curList").addEventListener("change",e=>{const box=e.target.closest("[data-cur]");if(!box)return;const c=cursoById(box.dataset.cur);if(!c)return;
  if(e.target.matches("[data-pick]")){if(e.target.value)cursoCnq(c.id,e.target.value);return}
  if(e.target.matches("[data-ptsel]")){CUR_PT.set(c.id,e.target.value);renderCursos();return}
  const ptEl=e.target.closest("[data-pt]"),ptT=ptEl&&ptEl.dataset.pt?escData().turmas.find(t=>t.id===ptEl.dataset.pt):null,o=ptT&&turmaPlanoProprio(ptT)||c;
  const depois=()=>{save();if(o!==c&&curTab==="pc")renderPC()};
  if(e.target.matches("[data-opc]")){const s=new Set(o.opcEsc||[]);e.target.checked?s.add(e.target.dataset.opc):s.delete(e.target.dataset.opc);o.opcEsc=[...s];depois();renderCursos();return}
  if(e.target.matches("[data-gesc]")){(o.gEsc=o.gEsc||{})[e.target.dataset.gesc]=e.target.value;depois();renderCursos();return}
  if(e.target.matches("[data-oesc]")){(o.ofertaEsc=o.ofertaEsc||{})[e.target.dataset.oesc]=e.target.value.trim();depois();return}
  const k=e.target.dataset.k;if(!k)return;c[k]=e.target.value.trim();save();if(k==="nome"){renderTurmas();esRecarregar()}if(k==="tipo"&&c.qual)cursoCnq(c.id,c.qual.cod)});
$("#curList").addEventListener("click",e=>{const box=e.target.closest("[data-cur]");if(!box)return;const E=escData(),c=cursoById(box.dataset.cur);if(!c)return;
  if(e.target.hasAttribute("data-cnq")){cursoCnq(c.id);return}
  if(e.target.hasAttribute("data-ptcria")||e.target.hasAttribute("data-ptvolta")){const t=E.turmas.find(x=>x.id===CUR_PT.get(c.id));if(!t)return;
    if(e.target.hasAttribute("data-ptcria")){const ant=t.planoCur&&t.planoCur.cursoId===c.id?t.planoCur:null;
      t.planoCur={cursoId:c.id,gEsc:Object.assign({},c.gEsc||{}),opcEsc:(c.opcEsc||[]).slice(),ofertaEsc:Object.assign({},c.ofertaEsc||{})};if(ant)Object.assign(t.planoCur,ant);
      save();renderCursos();toast(`${t.cod} tem agora plano próprio (começa com as escolhas do curso)`);return}
    if(!confirm(`A turma ${t.cod} deixa o plano próprio e volta a seguir as escolhas do curso ${c.nome}?`))return;
    ponto(`Antes de ${t.cod} voltar ao plano do curso`);delete t.planoCur;save();renderCursos();toast(`${t.cod} segue o plano do curso (pode anular)`);return}
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
      escData().turmas.forEach(t=>{const pp=t.cursoId===c.id&&turmaPlanoProprio(t);if(pp&&pp.opcEsc)pp.opcEsc=pp.opcEsc.filter(k=>c.itens.some(i=>i.opc&&i.cod===k))});
      const mod=SNQ_MOD[c.tipo||"Profissional"];c.escolar=[];if(mod){try{c.escolar=await snqEscolar(v.id,mod)}catch(x){}}}}
    else c.qual=null;
    save();if(!calado){$("#curMsg").textContent=c.qual?`${c.nome} → ${c.qual.nome} (${c.itens.filter(i=>!i.opc).length} ${c.qual.conceito==="RA"?"UC":"UFCD"} obrigatórias${c.itens.some(i=>i.opc)?` + ${c.itens.filter(i=>i.opc).length} opcionais`:""}${(c.escolar||[]).length?" · "+c.escolar.map(x=>x.nome.replace(/^Formação /,"")).join(", "):""}).`:`${c.nome}: não encontrado no catálogo.`}}
  catch(err){$("#curMsg").textContent="Não foi possível consultar o catálogo: "+err.message}
  renderCursos()}

/* 0.9.166: orientador educativo e responsável de curso vêm dos cargos do Plano Curricular da turma (Escola › Turmas › Planos Curriculares);
   se o plano não os tiver, usa-se o que foi escolhido à mão em Escola › Turmas (t.dt / t.rc — nunca se apagam). */
var CARGO_RE={dt:/orientador.*educ|diretor.*turma/,rc:/respons.*curso|coordenador.*curso/};
function turmaCargoPlano(t,k,aid){try{if(!t||typeof pcDe!=="function")return "";const p=pcDe(t.id,aid);const x=p&&(p.cargos||[]).find(c=>c.f&&CARGO_RE[k].test(norm(c.nome||"")));return x&&cfg.profs.some(q=>q.id===x.f)?x.f:""}catch(e){return ""}}
function turmaOE(t,aid){return turmaCargoPlano(t,"dt",aid)||(t&&t.dt)||""}
function turmaRC(t,aid){return turmaCargoPlano(t,"rc",aid)||(t&&t.rc)||""}
function turmaCargoCel(t,k,aid,vazio){const f=turmaCargoPlano(t,k,aid);if(f){const p=cfg.profs.find(q=>q.id===f);return `<div class="tcargo" title="Vem do Plano Curricular da turma (cargos). Para mudar, mude o cargo no plano.">${esc(p.nome)}${p.cod?` (${esc(p.cod)})`:""}<small>do plano curricular</small></div>`}
  return `<select data-k="${k}">${lzOpts("prof",t[k],`<option value="">— ${vazio} —</option>`)}</select>`}
/* ---------- turmas ---------- */
function renderTurmas(){const e=escData(),a=anoAtivo(),q=norm($("#turFilter").value||""),todas=$("#turTodas").checked;
  $("#turAnoLbl").textContent=a.nome;
  const curOpts=sel=>`<option value="">— sem curso —</option>`+e.cursos.map(c=>`<option value="${c.id}" ${c.id===sel?"selected":""}>${esc(c.nome)}</option>`).join("");
  const L=(todas?e.turmas.slice().sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod))):turmasDoAno(a))
    .filter(t=>!q||norm(t.cod+" "+turmaNome(t)+" "+((cursoById(t.cursoId)||{}).nome||"")+" "+profName(turmaOE(t,a.id))+" "+profName(turmaRC(t,a.id))+" "+(t.fse||"")).includes(q));
  $("#tbTur").innerHTML=L.map(t=>{const ac=anoCurricular(t,a);return `<tr data-id="${t.id}">
    <td style="white-space:nowrap"><input type="color" data-k="cor" class="turcor" value="${esc(turmaCor(t))}" title="Cor da turma (igual em toda a app até a turma acabar)"><input type="text" data-k="cod" value="${esc(t.cod)}" style="width:70px"></td>
    <td><select data-k="cursoId">${curOpts(t.cursoId)}</select>${turmaPlanoProprio(t)?`<span class="tag" style="margin-top:4px;background:var(--brandbg);color:var(--brand)" title="Esta turma tem escolhas diferentes das do curso (Escola360 › Cursos)">plano próprio</span>`:""}</td>
    <td><input type="number" data-k="anoIni" value="${t.anoIni||""}" min="2000" max="2100" style="width:84px"></td>
    <td><input type="number" data-k="anoFim" value="${t.anoFim||""}" min="2000" max="2100" style="width:84px"></td>
    <td class="hm">${ac?esc(ac):`<span class="hint" style="margin:0">fora de ${esc(a.nome)}</span>`}</td>
    <td>${turmaCargoCel(t,"dt",a.id,"sem orientador educativo")}</td>
    <td>${turmaCargoCel(t,"rc",a.id,"sem responsável de curso")}</td>
    <td><input type="text" data-k="fse" value="${esc(t.fse||"")}" placeholder="código FSE" spellcheck="false" style="min-width:190px;text-transform:uppercase;font-variant-numeric:tabular-nums"${t.fse&&!fseOk(t.fse)?` title="Confirme o código: o habitual é REGIÃO-00-0000-FSE-000000"`:""}></td>
    <td class="hm"><input type="text" data-k="nome" value="${esc(t.nome||"")}" placeholder="${esc(turmaNome(Object.assign({},t,{nome:""})))}"></td>
    <td><button class="x" data-del title="Apagar turma">×</button></td></tr>`}).join("")
    ||`<tr><td colspan="10" class="hint">${e.turmas.length?(q?"Nenhuma turma corresponde à procura.":`Nenhuma turma em ${esc(a.nome)} — veja <b>todas as turmas</b> ou crie uma acima.`):"Ainda sem turmas — crie uma acima ou importe da Box."}</td></tr>`;
  $("#tCurso").innerHTML=curOpts($("#tCurso").value);if(!$("#tIni").value)$("#tIni").placeholder=a.ini;if(!$("#tFim").value)$("#tFim").placeholder=a.ini+3}
$("#turFilter").addEventListener("input",debounce(()=>renderTurmas(),120));$("#turTodas").addEventListener("change",renderTurmas);
$("#tbTur").addEventListener("change",e=>{const tr=e.target.closest("tr");const t=escData().turmas.find(x=>x.id===tr.dataset.id);if(!t)return;const k=e.target.dataset.k;
  t[k]=/^anoIni|anoFim$/.test(k)?(parseInt(e.target.value)||null):e.target.value.trim();if(k==="cod")t.cod=t.cod.toUpperCase();if(k==="cor"&&!turCorOk(t.cor))delete t.cor;
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
/* 0.9.141: Formandos — lista por turma com a ficha completa de cada formando (dados, turma e curso, orientador educativo,
   plano curricular, calendário da turma, PAP e colegas). A ficha abre ao carregar na linha; os dados mudam-se lá. */
var FOR_EST="",FOR_AB="",FOR_REP=null,FOR_FECH=new Set(),FOR_GK=[];
function forIdade(iso,ref){const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;const r=ref||new Date();let i=r.getFullYear()-+m[1];if(r.getMonth()+1<+m[2]||(r.getMonth()+1===+m[2]&&r.getDate()<+m[3]))i--;return i}
function forAniv(iso){const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return null;const h=new Date();h.setHours(0,0,0,0);let d=new Date(h.getFullYear(),+m[2]-1,+m[3]);if(d<h)d=new Date(h.getFullYear()+1,+m[2]-1,+m[3]);return Math.round((d-h)/864e5)}
function forIni(n){const p=String(n||"").trim().split(/\s+/).filter(Boolean);return ((p[0]||"?")[0]+(p.length>1?p[p.length-1][0]:"")).toUpperCase()}
function forCor(s){let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return ["#3b6fd8","#0f9b8e","#8b5cf6","#d9468f","#e07a1f","#2f855a","#c0392b","#4a5fc1","#0e7490","#9a6b00"][h%10]}
var FOR_EST_TXT={desistente:"Desistente",transferido:"Transferido"};
// 0.9.144: email oficial do formando — a mesma regra dos formadores (primeiro nome + último apelido @episj.com);
// só se guarda f.email nas exceções (escrito à mão). Emails repetidos (formandos ou formadores) ficam assinalados para confirmar.
function formandoEmail(f){return String((f&&f.email)||"").trim().toLowerCase()||(typeof emailAuto==="function"?emailAuto(f&&f.nome):"")}
function forEmailsRep(){const c=new Map(),add=e=>{if(e)c.set(e,(c.get(e)||0)+1)};escData().formandos.forEach(f=>add(formandoEmail(f)));(cfg.profs||[]).forEach(p=>add(String(p.email||"").trim().toLowerCase()));
  return new Set([...c].filter(([,n])=>n>1).map(([e])=>e))}
function forEstTag(f){return f.estado?`<span class="tag exc">${esc(FOR_EST_TXT[f.estado]||f.estado)}</span>`:""}
function renderFormandos(){if(!renderFormandos.wa&&podePublicar()){renderFormandos.wa=1;waPronto().then(()=>{if(curTab==="for"&&FOR_AB)renderFormandos()})} /* 0.9.170: telemóveis (peça H3) */ const e=escData(),q=norm($("#forFilter").value||""),ft=$("#forTurmaF").value,a=anoAtivo();
  $("#forTurmaF").innerHTML=turmaOpts(ft,`<option value="">Todas as turmas</option>`);$("#fTurma").innerHTML=turmaOpts($("#fTurma").value);$("#forBulkT").innerHTML=turmaOpts($("#forBulkT").value,`<option value="">— na própria lista —</option>`);
  document.querySelectorAll("#forEstF [data-fe]").forEach(b=>b.classList.toggle("on",b.dataset.fe===FOR_EST));
  const TM=new Map(e.turmas.map(t=>[t.id,t])),cod=id=>(TM.get(id)||{}).cod||"";
  const CN=new Intl.Collator("pt",{numeric:true}),CP=new Intl.Collator("pt");
  const base=e.formandos.filter(f=>!ft||f.turmaId===ft);
  // números do topo (da turma escolhida ou de todas)
  const REP0=forEmailsRep(),at=base.filter(f=>!f.estado),ids=at.map(f=>forIdade(f.nasc)).filter(x=>x!=null),men=ids.filter(x=>x<18).length,anivs=at.filter(f=>{const d=forAniv(f.nasc);return d!=null&&d<=7});
  $("#forTiles").innerHTML=e.formandos.length?[[at.length,"ativos"],[base.filter(f=>f.estado==="desistente").length,"desistentes"],[base.filter(f=>f.estado==="transferido").length,"transferidos"],
    [ids.length?(ids.reduce((s,x)=>s+x,0)/ids.length).toLocaleString("pt-PT",{maximumFractionDigits:1}):"—","idade média"],[ids.length?men:"—","menores de 18"],[anivs.length,"fazem anos esta semana"],[base.filter(f=>REP0.has(formandoEmail(f))).length,"emails repetidos a confirmar"]]
    .map(([v,l])=>`<div class="frt"><b>${v}</b><span>${l}</span></div>`).join(""):"";
  const REP=forEmailsRep();FOR_REP=REP;
  const L=base.filter(f=>(!FOR_EST||(FOR_EST==="ativo"?!f.estado:f.estado===FOR_EST)||(FOR_EST==="email"&&REP.has(formandoEmail(f))))&&(!q||norm((f.num||"")+" "+f.nome+" "+cod(f.turmaId)+" "+formandoEmail(f)).includes(q)))
    .sort((x,y)=>CN.compare(cod(x.turmaId),cod(y.turmaId))||(!!x.estado-!!y.estado)||CP.compare(x.nome,y.nome));
  // 0.9.165: cada turma abre e fecha (clicar no cabeçalho); fechadas guardadas em FOR_FECH (só nesta sessão)
  FOR_N=FOR_N||200;const G=[],GM=new Map();for(const f of L){const k=f.turmaId||"_sem";let g=GM.get(k);if(!g){g={k,tid:f.turmaId,fs:[]};GM.set(k,g);G.push(g)}g.fs.push(f)}
  const fech=g=>FOR_FECH.has(g.k)&&!(FOR_AB&&g.fs.some(f=>f.id===FOR_AB));
  let h="",mostra=0,resto=0;FOR_GK=G.map(g=>g.k);
  if(G.length>1){const todasF=G.every(fech);h+=`<div class="frgtodas"><button class="b s" type="button" data-frgtodas="${todasF?"abrir":"fechar"}">${todasF?"Abrir todas as turmas":"Fechar todas as turmas"}</button></div>`}
  for(const g of G){const t=TM.get(g.tid),c=t&&cursoById(t.cursoId),nA=e.formandos.filter(x=>x.turmaId===g.tid&&!x.estado).length,fc=fech(g);
    if(mostra>=FOR_N&&!fc){resto+=g.fs.length;continue}
    h+=`<button type="button" class="frg${fc?" fc":""}" data-frg="${esc(g.k)}" aria-expanded="${!fc}"><svg class="frgchev" viewBox="0 0 24 24" width="16" height="16"><path d="m6 9 6 6 6-6"/></svg><b>${t?esc(t.cod):"Sem turma"}</b><span>${t?esc(c?c.nome:turmaNome(t)):""}${t&&anoCurricular(t,a)?" · "+esc(anoCurricular(t,a)):""}${turmaOE(t,a.id)?" · Orientador educativo: "+esc(profName(turmaOE(t,a.id))):""}</span><i>${fc?g.fs.length+" na lista · ":""}${nA} ativo(s)</i></button>`;
    if(fc)continue;
    for(const f of g.fs){if(mostra>=FOR_N){resto++;continue}mostra++;
    const id=forIdade(f.nasc),an=forAniv(f.nasc),ab=FOR_AB===f.id;
    h+=`<div class="frr${f.estado?" sai":""}${ab?" ab":""}" data-id="${f.id}"><button type="button" class="frh" data-fab aria-expanded="${ab}">
      <span class="frav" style="--c:${forCor(f.nome)}">${esc(forIni(f.nome))}</span>
      <span class="frn"><b>${esc(f.nome)}</b><small>${f.num?"N.º "+esc(f.num):"sem número"}${id!=null?` · ${id} anos`:""}${formandoEmail(f)?" · "+esc(formandoEmail(f)):""}${an===0?" · faz anos hoje":an!=null&&an<=7?` · faz anos daqui a ${an} dia${an>1?"s":""}`:""}</small></span>
      ${FOR_REP&&FOR_REP.has(formandoEmail(f))?`<span class="tag bad" title="Há outra pessoa com este email: escreva o email certo na ficha (exceção)">email repetido</span>`:""}${forEstTag(f)}<span class="frc">${cod(f.turmaId)?esc(cod(f.turmaId)):""}</span><svg class="frchev" viewBox="0 0 24 24" width="16" height="16"><path d="m6 9 6 6 6-6"/></svg></button>
      ${ab?forFicha(f):""}</div>`}}
  if(resto>0)h+=`<div style="text-align:center;padding:10px"><button class="b s" type="button" data-formais>Mostrar mais ${Math.min(resto,500)} (faltam ${resto}) — ou escolha a turma acima</button></div>`;
  $("#tbFor").innerHTML=h||`<p class="hint">${e.formandos.length?"Ninguém corresponde à procura.":"Ainda sem formandos — acrescente acima, cole uma lista ou importe o mapa (PDF)."}</p>`;
  $("#forCnt").textContent=e.formandos.length?`${L.length} de ${e.formandos.length} formando(s)${resto>0?" — a mostrar os primeiros "+FOR_N:""}.`:""}
function forFicha(f){const E=escData(),a=anoAtivo(),t=E.turmas.find(x=>x.id===f.turmaId),c=t&&cursoById(t.cursoId),id=forIdade(f.nasc),an=forAniv(f.nasc);
  const sec=(tit,corpo)=>`<div class="frs"><h5>${tit}</h5>${corpo}</div>`,li=(k,v)=>v?`<div class="frli"><span>${k}</span><b>${v}</b></div>`:"";
  // 1) dados
  let h=sec("Dados do formando",`<div class="frform">
    <label>N.º<input type="text" data-k="num" value="${esc(f.num||"")}"></label>
    <label class="w2">Nome<input type="text" data-k="nome" value="${esc(f.nome)}"></label>
    <label>Data de nascimento<input type="date" data-k="nasc" value="${esc(f.nasc||"")}"></label>
    <label>Turma<select data-k="turmaId">${turmaOpts(f.turmaId)}</select></label>
    <label class="w2">Email da escola${f.email?" (exceção)":" (automático)"}<input type="email" data-k="email" value="${esc(f.email||"")}" placeholder="${esc(typeof emailAuto==="function"?emailAuto(f.nome):"")}" spellcheck="false"></label>
    ${podePublicar()&&!RO?`<label>Telemóvel <small>(só a Direção)</small><input type="tel" data-wtel="${esc(f.id)}" value="${esc(H3?waTelVer((H3.telF||{})[f.id]):"")}" placeholder="9xx xxx xxx" inputmode="tel" title="Para os avisos por WhatsApp. Não é publicado nem visto pelos formadores."></label>`:""}
    <label>Situação<select data-k="estado"><option value="">Ativo</option><option value="desistente"${f.estado==="desistente"?" selected":""}>Desistente</option><option value="transferido"${f.estado==="transferido"?" selected":""}>Transferido</option></select></label></div>
    <p class="frnota">${formandoEmail(f)?`<a href="mailto:${esc(formandoEmail(f))}">${esc(formandoEmail(f))}</a> — ${f.email?"escrito à mão (exceção à regra)":"primeiro nome + último apelido; se este formando tiver outro email, escreva-o acima"}`:""}${FOR_REP&&FOR_REP.has(formandoEmail(f))?' · <b style="color:var(--bad)">há outra pessoa com este email</b>':""}</p>
    ${id!=null?`<p class="frnota">${id} anos · ${id>=18?"maior de idade":"menor de idade"}${an!=null?` · ${an===0?"faz anos hoje":`faz ${id+1} anos a ${esc(forDataPt(f.nasc).slice(0,5))} (daqui a ${an} dia${an>1?"s":""})`}`:""}</p>`:""}
    <div class="row" style="margin-top:8px"><button class="b s pcdanger" type="button" data-fdel>Apagar formando</button></div>`);
  // 2) turma e curso
  if(t){const dtI=turmaOE(t,a.id),rcI=turmaRC(t,a.id),dt=dtI?cfg.profs.find(p=>p.id===dtI):null,rc=rcI?cfg.profs.find(p=>p.id===rcI):null,ac=anoCurricular(t,a),p=typeof pcDe==="function"?pcDe(t.id,a.id):null;
    let pl="";if(p&&p.linhas&&p.linhas.length){const disc=new Set(p.linhas.map(l=>l.disc)).size,hh=p.linhas.reduce((s,l)=>s+(+l.h||0),0),fct=+(p.fct&&p.fct.horas)||0;
      pl=li("Plano curricular",`${disc} disciplinas · ${hh.toLocaleString("pt-PT")} h${fct?` + ${fct} h de FCT`:""}`)}
    const pp=typeof turmaPlanoProprio==="function"&&turmaPlanoProprio(t);
    h+=sec("Turma e curso",li("Turma",esc(turmaNome(t)))+li("Curso",c?esc(c.nome)+(c.qual?` <small>(${esc(c.qual.cod)}, nível ${esc(c.qual.nivel||"?")})</small>`:""):"")+li("Ano curricular",ac?esc(ac)+" em "+esc(a.nome):`fora de ${esc(a.nome)}`)
      +li("N.º de projeto",t.fse?esc(t.fse):"")+li("Orientador educativo",dt?esc(dt.nome)+(dt.email?` <a href="mailto:${esc(dt.email)}">${esc(dt.email)}</a>`:""):"")+li("Responsável de curso",rc?esc(rc.nome)+(rc.email?` <a href="mailto:${esc(rc.email)}">${esc(rc.email)}</a>`:""):"")+pl+(pp?li("Plano","plano próprio da turma"):"")
      +`<div class="row" style="margin-top:8px;gap:6px"><button class="b s" type="button" data-fir="pc">Plano curricular</button><button class="b s" type="button" data-fir="tur">Turma</button><button class="b s" type="button" data-fir="cal">Calendário</button></div>`);
    // 3) calendário da turma
    try{const hoje=calHoje(),M=calMarcos(a,t.id).filter(m=>m.de).slice().sort((x,y)=>String(x.de).localeCompare(String(y.de)));
      const fut=M.filter(m=>(m.ate||m.de)>=hoje).slice(0,6),fct=M.filter(m=>m.tipo==="fct");
      h+=sec("Calendário da turma",(fct.length?li("FCT",fct.map(m=>esc(calDatasTxt(m))).join("<br>")):"")+(fut.length?`<div class="frmarcos">${fut.map(m=>`<div>${calTag(m.tipo)}<span>${esc(m.nome||((CAL_TIPOS[m.tipo]||CAL_TIPOS.outro)[0]))}</span><time>${esc(calDatasTxt(m))}</time></div>`).join("")}</div>`:`<p class="hint" style="margin:0">Sem marcos por vir em ${esc(a.nome)}.</p>`))}catch(x){}
    // 4) colegas
    const col=E.formandos.filter(x=>x.turmaId===t.id&&x.id!==f.id).sort((x,y)=>(!!x.estado-!!y.estado)||COLL_PT.compare(x.nome,y.nome)),ca=col.filter(x=>!x.estado);
    const idT=E.formandos.filter(x=>x.turmaId===t.id&&!x.estado).map(x=>forIdade(x.nasc)).filter(x=>x!=null),curto=n=>{const w=String(n||"").trim().split(/\s+/);return w.length>1?w[0]+" "+w[w.length-1]:w[0]||""};
    h+=sec("Colegas de turma",`<div class="frcs"><span><b>${ca.length}</b> ativos</span>${col.length>ca.length?`<span><b>${col.length-ca.length}</b> saíram</span>`:""}${idT.length?`<span><b>${(idT.reduce((x,y)=>x+y,0)/idT.length).toLocaleString("pt-PT",{maximumFractionDigits:1})}</b> anos em média</span>`:""}</div>
      <div class="frcol">${col.map(x=>{const ix=forIdade(x.nasc);return `<button type="button" class="frcl${x.estado?" sai":""}" data-fver="${x.id}" title="${esc(x.nome)}${x.estado?" ("+esc(x.estado)+")":""}"><span class="frav sm" style="--c:${forCor(x.nome)}">${esc(forIni(x.nome))}</span><span class="frcn"><b>${esc(curto(x.nome))}</b><small>${x.num?"N.º "+esc(x.num):""}${ix!=null?(x.num?" · ":"")+ix+" anos":""}${x.estado?" · "+esc(x.estado):""}</small></span></button>`}).join("")||'<p class="hint" style="margin:0">Sem colegas registados.</p>'}</div>`)}
  else h+=sec("Turma e curso",`<p class="hint" style="margin:0">Este formando ainda não tem turma: escolha-a nos dados.</p>`);
  // 5) PAP
  try{if(typeof PAP!=="undefined"&&PAP&&Array.isArray(PAP.provas)&&(typeof podePublicar!=="function"||podePublicar())){const R=[];
      for(const P of PAP.provas)for(const k of P.cands||[])if(k.fId===f.id||(f.num&&k.num&&String(k.num)===String(f.num)&&P.turmaId===f.turmaId))R.push({P,k});
      if(R.length)h+=sec("PAP",R.map(({P,k})=>{const nf=typeof papFinal==="function"?papFinal(k):null,j=[k.j1,k.j2].filter(Boolean).map(x=>{const o=(PAP.contactos||[]).find(c=>c.id===x);return o?o.nome:x});
        return li("Prova",`${esc(P.fase==="esp"?"Época especial":P.fase+".ª fase")}${P.turmaId===f.turmaId?"":" (outra turma)"}`)+li("Tema",esc(k.tema||""))+li("Data",k.data?esc(forDataPt(k.data)||k.data)+(k.hora?" às "+esc(k.hora):""):"")+li("Júri externo",j.map(esc).join(", "))
          +li("Classificação",nf!=null?`<span class="tag ${nf>=10?"ok":"bad"}">${nf} valores</span>`:"por avaliar")}).join('<hr class="frhr">')+`<div class="row" style="margin-top:8px"><button class="b s" type="button" data-fir="papInicio">Abrir PAP360</button></div>`)}
    else if(typeof papCarregar==="function"&&!forFicha.papPedido){forFicha.papPedido=1;papCarregar().then(()=>{if(FOR_AB===f.id)renderFormandos()})}}catch(x){}
  return `<div class="frf">${h}</div>`}
var FOR_N=200;
{let h=null;$("#forFilter").addEventListener("input",()=>{FOR_N=200;clearTimeout(h);h=setTimeout(renderFormandos,120)})}$("#forTurmaF").addEventListener("change",()=>{FOR_N=200;renderFormandos()});
$("#forEstF").addEventListener("click",e=>{const b=e.target.closest("[data-fe]");if(!b)return;FOR_EST=b.dataset.fe;FOR_N=200;renderFormandos()});
// 0.9.170: telemóvel do formando (WhatsApp) — guardado na peça H3 (só a Direção), nunca em escola.formandos (que é publicada para os formadores)
$("#tbFor").addEventListener("change",async e=>{const i=e.target.closest("[data-wtel]");if(!i)return;await waPronto();if(!waTelGravar("f",i.dataset.wtel,i.value)){toast("Número de telemóvel inválido");return}i.value=waTelVer(H3.telF[i.dataset.wtel]);toast(i.value?"Telemóvel guardado":"Telemóvel apagado")});
$("#tbFor").addEventListener("change",e=>{const r=e.target.closest(".frr");if(!r||!e.target.dataset.k)return;const f=escData().formandos.find(x=>x.id===r.dataset.id);if(!f)return;const k=e.target.dataset.k,v=e.target.value.trim();
  if(k==="estado"){if(v)f.estado=v;else delete f.estado}
  else if(k==="email"){const em=v.toLowerCase();if(!em||em===emailAuto(f.nome))delete f.email;else f.email=em}
  else f[k]=v;save();esRecarregar();renderFormandos()});
$("#tbFor").addEventListener("click",e=>{if(e.target.closest("[data-formais]")){FOR_N+=500;renderFormandos();return}
  const gt=e.target.closest("[data-frgtodas]");if(gt){if(gt.dataset.frgtodas==="abrir")FOR_FECH.clear();else{FOR_AB="";FOR_GK.forEach(k=>FOR_FECH.add(k))}renderFormandos();return}
  const gb=e.target.closest("[data-frg]");if(gb){const k=gb.dataset.frg;if(FOR_FECH.has(k))FOR_FECH.delete(k);else{FOR_FECH.add(k);const fa=FOR_AB&&escData().formandos.find(x=>x.id===FOR_AB);if(fa&&(fa.turmaId||"_sem")===k)FOR_AB=""}renderFormandos();return}
  const ir=e.target.closest("[data-fir]"),r=e.target.closest(".frr"),f=r&&escData().formandos.find(x=>x.id===r.dataset.id);
  if(ir){if(f&&f.turmaId&&ir.dataset.fir==="pc"){PC_T=f.turmaId;try{localStorage.setItem("pc_t",PC_T)}catch(x){}}show(ir.dataset.fir);return}
  const v=e.target.closest("[data-fver]");if(v){FOR_AB=v.dataset.fver;renderFormandos();const n=$("#tbFor").querySelector(`.frr[data-id="${CSS.escape(FOR_AB)}"]`);if(n)n.scrollIntoView({behavior:"smooth",block:"start"});return}
  if(e.target.closest("[data-fdel]")&&f){if(!confirm(`Apagar o formando ${f.nome}? Pode anular a seguir.`))return;const E=escData();ponto("Antes de apagar o formando "+f.nome);E.formandos=E.formandos.filter(x=>x!==f);FOR_AB="";save();renderFormandos();esRecarregar();toast("Formando apagado (pode anular)");return}
  if(e.target.closest("[data-fab]")&&f){FOR_AB=FOR_AB===f.id?"":f.id;renderFormandos()}});
$("#forForm").addEventListener("submit",e=>{e.preventDefault();const nome=$("#fNome").value.trim();if(!nome)return;escData().formandos.push({id:uid(),num:$("#fNum").value.trim(),nome,turmaId:$("#fTurma").value});save();const t=$("#fTurma").value;$("#forForm").reset();$("#fTurma").value=t;renderFormandos();esRecarregar();$("#fNum").focus()});
$("#forImport").onclick=async()=>{const lines=$("#forBulk").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return;
  await waPronto(); // 0.9.170: a lista pode trazer o telemóvel (vai para a peça H3, só da Direção)
  ponto("Antes de colar uma lista de formandos");const E=escData(),fix=$("#forBulkT").value;let add=0,upd=0,bad=0,nTel=0;
  for(const l of lines){let p=l.split(/\t|;/).map(x=>x.trim()).filter(Boolean);if(!p.length)continue;
    let tel="";{const k=p.findIndex(x=>/^(\+|00)?[\d\s().-]{9,}$/.test(x)&&/^(\+|00|9|2)/.test(x.replace(/[\s().-]/g,""))&&h3Tel(x));if(k>=0&&p.length>1){tel=h3Tel(p[k]);p.splice(k,1)}}
    if(/^(n\.?º|num|número|numero)$/i.test(p[0])||/^nome$/i.test(p[0]))continue;
    let num="",turma=null;if(/^\d{1,5}$/.test(p[0])){num=p.shift()}
    if(!fix&&p.length>1){const t=turmaPorCod(p[p.length-1]);if(t){turma=t;p.pop()}}
    const nome=p.join(" ").trim();const tid=fix||(turma&&turma.id)||"";if(!nome){bad++;continue}
    const ex=E.formandos.find(f=>(num&&f.num===num&&f.turmaId===tid)||norm(f.nome)===norm(nome));
    let alvo=ex;if(ex){if(num)ex.num=num;if(tid)ex.turmaId=tid;upd++}else{alvo={id:uid(),num,nome,turmaId:tid};E.formandos.push(alvo);add++}
    if(tel&&H3&&alvo){H3.telF=H3.telF||{};H3.telF[alvo.id]=tel;nTel++}}
  if(nTel)h3Guardar();
  save();renderFormandos();esRecarregar();$("#forMsg").textContent=`${add} acrescentado(s), ${upd} atualizado(s)${nTel?`, ${nTel} telemóvel(eis)`:""}${bad?`, ${bad} linha(s) ignorada(s)`:""}.`;if(add||upd)$("#forBulk").value=""};

/* ---------- 0.9.139: importar o «Mapa dos alunos por turma» do dbGEP (PDF) ----------
   Lê só número, nome, data de nascimento, turma e d)esistente / t)ransferido. Morada, n.º de identificação e NIF ficam de fora.
   Junta-se ao que existe (mesmo número, ou mesmo nome na mesma turma); nunca apaga. */
let FOR_PDF=null;
async function forPdfLinhas(buf){const pdfjs=await calPdfJs(),doc=await pdfjs.getDocument({data:new Uint8Array(buf),isEvalSupported:false,disableFontFace:true}).promise,pags=[];
  try{for(let n=1;n<=doc.numPages;n++){const tc=await (await doc.getPage(n)).getTextContent(),L=[];
    for(const it of tc.items){if(!it||typeof it.str!=="string"||!it.str.trim()||!it.transform)continue;const y=it.transform[5];
      let l=null;for(const k of L)if(Math.abs(k.y-y)<=2.5){l=k;break}if(!l){l={y,a:[]};L.push(l)}l.a.push({x:it.transform[4],s:it.str.trim()})}
    L.sort((p,q)=>q.y-p.y);pags.push(L.map(l=>l.a.sort((p,q)=>p.x-q.x).map(i=>i.s).join(" ").replace(/\s+/g," ").trim()))}}
  finally{try{doc.destroy()}catch(e){}}return pags}
function forPdfMapa(pags){const T=[];let cur=null;
  for(const L of pags)for(const l of L){
    const mt=l.match(/Turma:\s*([A-Z]{1,2}\d{1,3}\s*[-–]\s*.+?\(\s*\d{2,4}\s*[-\/]\s*\d{2,4}\s*\))/i)||l.match(/^Turma:\s*([A-Z]{1,2}\d{1,3}\b.*)$/i);
    if(mt){const txt=mt[1].trim();cur=T.find(x=>norm(x.turma)===norm(txt));if(!cur){cur={turma:txt,fs:[],total:null};T.push(cur)}continue}
    const mn=l.match(/Total de Alunos:\s*(\d+)/i);if(mn){if(cur)cur.total=+mn[1];continue}
    const m=l.match(/^(?:([dt])\)\s*)?(\d{4,9})\s+(.+?)\s+(\d{2})\/(\d{2})\/(\d{4})(?:\s|$)/i);
    if(m&&cur&&!cur.fs.some(f=>f.num===m[2]))cur.fs.push({num:m[2],nome:m[3].trim(),nasc:`${m[6]}-${m[5]}-${m[4]}`,estado:m[1]?(m[1].toLowerCase()==="d"?"desistente":"transferido"):""})}
  return T.filter(x=>x.fs.length)}
function forPdfPar(f,tid){const L=escData().formandos;
  return L.find(x=>x.num&&x.num===f.num)||(tid&&L.find(x=>x.turmaId===tid&&norm(x.nome)===norm(f.nome)))||L.find(x=>!x.num&&!x.turmaId&&norm(x.nome)===norm(f.nome))||null}
function forPdfMuda(x,f,tid){return x.num!==f.num||x.nome!==f.nome||(tid&&x.turmaId!==tid)||(x.nasc||"")!==f.nasc||(x.estado||"")!==f.estado}
function forDataPt(iso){const m=String(iso||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?`${m[3]}/${m[2]}/${m[1]}`:""}
function forPdfPrever(){const P=FOR_PDF,out=$("#forPdfPrev");if(!P){out.innerHTML="";return}const inc=P.inc;let tN=0,tA=0,tI=0,tX=0;
  const rows=P.T.map(T=>{const t=pcTurmaDe({turma:T.turma},true),F=T.fs.filter(f=>inc||!f.estado);let n=0,a=0,i=0;
    for(const f of F){const x=forPdfPar(f,t&&t.id);if(!x)n++;else if(forPdfMuda(x,f,t&&t.id))a++;else i++}
    const sai=T.fs.filter(f=>f.estado).length;tN+=n;tA+=a;tI+=i;tX+=sai;
    const conf=T.total!=null&&T.total!==T.fs.length?`<span class="tag bad" title="O PDF diz ${T.total} e a app leu ${T.fs.length}">${T.fs.length} de ${T.total}</span>`:`${T.fs.length}`;
    return `<tr><td><b>${esc(T.turma)}</b></td><td>${t?"já existe":`<span class="tag exc">será criada</span>`}</td><td class="pcn">${conf}</td><td class="pcn">${n}</td><td class="pcn">${a}</td><td class="pcn">${i}</td><td class="pcn">${sai}</td></tr>`}).join("");
  out.innerHTML=`<div class="msg info" style="margin-top:12px">«${esc(P.nome)}»: ${P.T.length} turma(s) e ${P.T.reduce((s,T)=>s+T.fs.length,0)} formando(s). Confira e carregue em <b>Importar</b>.</div>
    <div style="overflow-x:auto"><table class="rt"><thead><tr><th>Turma</th><th>Na EPISJ 360</th><th>No PDF</th><th>Novos</th><th>A atualizar</th><th>Já estavam</th><th>Desistentes / transferidos</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3"><b>Total</b></td><td class="pcn"><b>${tN}</b></td><td class="pcn"><b>${tA}</b></td><td class="pcn"><b>${tI}</b></td><td class="pcn"><b>${tX}</b></td></tr></tfoot></table></div>
    <label class="cal-chk"><input type="checkbox" id="forPdfInc" ${inc?"checked":""}> Importar também os desistentes e os transferidos (ficam assinalados na lista)</label>
    <div class="row" style="margin-top:10px"><button class="b imp" type="button" id="forPdfOk">Importar ${tN+tA} formando(s)</button><button class="b s" type="button" id="forPdfNao">Cancelar</button></div>`}
$("#forPdfGo").onclick=()=>$("#forPdfFile").click();
$("#forPdfFile").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;const msg=$("#forPdfMsg");msg.textContent="A ler o PDF…";FOR_PDF=null;forPdfPrever();
  try{const T=forPdfMapa(await forPdfLinhas(await f.arrayBuffer()));
    if(!T.length){msg.textContent="Não encontrei turmas nem formandos neste PDF. É o «Mapa dos alunos por turma» do dbGEP?";return}
    msg.textContent="";FOR_PDF={nome:f.name,T,inc:true};forPdfPrever()}
  catch(x){console.warn(x);msg.textContent="Não foi possível ler este PDF ("+(x&&x.message||x)+")."}});
$("#forPdfPrev").addEventListener("change",e=>{if(e.target.id==="forPdfInc"&&FOR_PDF){FOR_PDF.inc=e.target.checked;forPdfPrever()}});
$("#forPdfPrev").addEventListener("click",e=>{const P=FOR_PDF;if(!P)return;
  if(e.target.id==="forPdfNao"){FOR_PDF=null;forPdfPrever();return}
  if(e.target.id!=="forPdfOk")return;
  ponto("Antes de importar o mapa dos alunos (PDF)");const E=escData(),novasT=[],novosC=[];let add=0,upd=0;
  for(const T of P.T){const t=pcTurmaDe({turma:T.turma},false,novasT,novosC),tid=t?t.id:"";
    for(const f of T.fs){if(!P.inc&&f.estado)continue;const x=forPdfPar(f,tid);
      if(x){if(!forPdfMuda(x,f,tid))continue;x.num=f.num;x.nome=f.nome;if(tid)x.turmaId=tid;x.nasc=f.nasc;x.estado=f.estado;upd++}
      else{const o={id:uid(),num:f.num,nome:f.nome,turmaId:tid,nasc:f.nasc};if(f.estado)o.estado=f.estado;E.formandos.push(o);add++}}}
  save();FOR_PDF=null;forPdfPrever();escRender();esRecarregar();
  $("#forPdfMsg").textContent=`Importado: ${add} formando(s) novo(s), ${upd} atualizado(s)${novasT.length?`; turmas criadas: ${novasT.join(", ")}`:""}${novosC.length?`; cursos criados: ${novosC.join(", ")}`:""}.`;
  toast("Mapa dos alunos importado (pode anular)")});


