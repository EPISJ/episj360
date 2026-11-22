/* ===================== EPISJ 360 0.9.28: Planos Curriculares (por turma) e Distribuição de Serviço Docente (por formador) =====================
   Os planos ficam em cfg.escola.planos (um por turma e por ano letivo) e seguem com o resto da escola: guardar, nuvem, anular e publicar.
   plano = {id, turmaId, anoId, semanas, fct:{horas,semanas,dias}, linhas:[{id,area,disc,mod,h,f}], cargos:[{id,nome,h,f}]}
   A DSD não se guarda: é calculada a partir dos planos (as linhas e os cargos de cada formador). */
const PC_AREAS=[["sociocultural","Componente Sociocultural"],["cientifica","Componente Científica"],["tecnica","Componente Técnica"]];
const PC_AREA_NOME=Object.fromEntries(PC_AREAS.map(([k,n])=>[k,n.replace("Componente ","")]));
const pcH=L=>L.reduce((s,x)=>s+(+x.h||0),0);
const pcNum=n=>(Math.round((+n||0)*100)/100).toLocaleString("pt-PT");
let PC_T=(()=>{try{return localStorage.getItem("pc_t")||""}catch(e){return ""}})();
function pcPlanos(){return escData().planos}
function pcDe(tid,aid){aid=aid||anoAtivo().id;return pcPlanos().find(p=>p.turmaId===tid&&p.anoId===aid)||null}
function pcNorm(p){if(!p.fct||typeof p.fct!=="object")p.fct={horas:null,semanas:null,dias:null};if(!Array.isArray(p.linhas))p.linhas=[];if(!Array.isArray(p.cargos))p.cargos=[];return p}
function pcNovo(t,aid){const p=pcNorm({id:uid(),turmaId:t.id,anoId:aid||anoAtivo().id,semanas:null});pcPlanos().push(p);return p}
const pcProf=id=>cfg.profs.find(p=>p.id===id)||null;
const pcProfNome=id=>{if(!id)return "";const p=pcProf(id);return p?(p.cod?p.cod+" - ":"")+p.nome:"(formador apagado)"};
function pcProfOpts(sel){const ok=!sel||pcProf(sel);return `<option value="">— sem formador —</option>`+(ok?"":`<option value="${esc(sel)}" selected>(formador apagado)</option>`)+
  cfg.profs.slice().sort((a,b)=>COLL_PT.compare(String(a.nome),String(b.nome))).map(p=>`<option value="${p.id}" ${p.id===sel?"selected":""}>${esc(p.nome||"(sem nome)")}${p.cod?` (${esc(p.cod)})`:""}</option>`).join("")}
// horas por semana e tempos semanais (como no Excel: horas ÷ semanas de aulas, e esse valor arredondado para cima)
const pcSemana=(h,p)=>{const s=+p.semanas||0;return s?h/s:0};
function pcDiscs(p,area){const o=[];for(const l of p.linhas)if(l.area===area&&!o.includes(l.disc))o.push(l.disc);return o}
function pcCurso(t){return cursoById(t.cursoId)}
function pcModOpcoes(t){const c=pcCurso(t);if(!c||!Array.isArray(c.itens))return "";const ra=c.qual&&c.qual.conceito==="RA";
  return c.itens.map(i=>{const cod=/^\d/.test(String(i.cod))?(ra?"UC":"UFCD ")+i.cod:i.cod;return `<option value="${esc(cod+" - "+i.nome)}">${i.h?esc(i.h+" h"):""}</option>`}).join("")}
function pcHorasCatalogo(t,mod){const c=pcCurso(t);if(!c||!Array.isArray(c.itens))return null;const m=String(mod).match(/^(?:UFCD\s*|UC\s*)?(\d{3,6})/i);if(!m)return null;
  const i=c.itens.find(x=>String(x.cod).replace(/\D/g,"")===m[1]);return i&&i.h?+i.h:null}

function pcTurmaOpts(){const a=anoAtivo(),T=turmasDoAno(a);
  return T.map(t=>{const p=pcDe(t.id,a.id),c=pcCurso(t);return `<option value="${t.id}" ${t.id===PC_T?"selected":""}>${esc(t.cod)}${c?" — "+esc(c.nome):""}${anoCurricular(t,a)?" · "+esc(anoCurricular(t,a)):""} · ${p&&p.linhas.length?pcNum(pcH(p.linhas))+" h":"sem plano"}</option>`}).join("")}

function renderPC(){const e=escData(),a=anoAtivo(),T=turmasDoAno(a),out=$("#pcOut");$("#pcAnoLbl").textContent=a.nome;
  if(!T.some(t=>t.id===PC_T)){PC_T=(T[0]||{}).id||""}
  $("#pcTurma").innerHTML=T.length?pcTurmaOpts():`<option value="">— sem turmas em ${esc(a.nome)} —</option>`;
  $("#pcDiscDL").innerHTML=[...new Set((e.disciplinas||[]).concat(pcPlanos().flatMap(p=>(p.linhas||[]).map(l=>l.disc))))].filter(Boolean).sort((x,y)=>COLL_PTN.compare(x,y)).map(d=>`<option value="${esc(d)}">`).join("");
  $("#pcPdf").disabled=!pcDe(PC_T);{const b=$("#pcPdfAll");if(b)b.disabled=!escData().turmas.some(t=>pcDe(t.id))}
  if(!T.length){out.innerHTML=`<p class="hint">Não há turmas em ${esc(a.nome)}. Crie-as em <b>Escola › Turmas</b> ou use <b>Importar do Excel</b>, que cria as turmas, os cursos e os formadores que faltarem.</p>`+pcResumoAno();return}
  const t=T.find(x=>x.id===PC_T),p=pcDe(t.id,a.id);$("#pcModDL").innerHTML=pcModOpcoes(t);
  if(!p){const outros=pcPlanos().filter(x=>x!==p&&x.linhas&&x.linhas.length).map(x=>{const tt=e.turmas.find(y=>y.id===x.turmaId),aa=e.anos.find(y=>y.id===x.anoId);return tt&&aa?{x,tt,aa}:null}).filter(Boolean)
      .sort((u,v)=>(v.tt.cursoId===t.cursoId)-(u.tt.cursoId===t.cursoId)||v.aa.ini-u.aa.ini);
    out.innerHTML=`<div class="msg info">A turma <b>${esc(t.cod)}</b> ainda não tem plano curricular em ${esc(a.nome)}.</div>
      <div class="row" style="margin-top:12px"><button class="b" data-pcnovo>Criar plano vazio</button>
      ${outros.length?`<label class="grow">ou copiar o plano de<select id="pcCopSel">${outros.map(o=>`<option value="${o.x.id}">${esc(o.tt.cod)} em ${esc(o.aa.nome)} — ${esc(anoCurricular(o.tt,o.aa)||"")} · ${pcNum(pcH(o.x.linhas))} h</option>`).join("")}</select></label><button class="b s" data-pccop style="align-self:flex-end">Copiar (sem formadores)</button><label class="chip" style="align-self:flex-end"><input type="checkbox" id="pcCopF"> com os formadores</label>`:""}</div>`+pcResumoAno();return}
  pcNorm(p);const c=pcCurso(t),ac=anoCurricular(t,a),semF=p.linhas.filter(l=>!l.f).length+p.cargos.filter(x=>!x.f).length,sem=+p.semanas||0;
  const tot=pcH(p.linhas),fct=+p.fct.horas||0;
  let h=`<div class="pchead"><div><b>${esc(turmaNome(t))}</b><span>${c?esc(c.nome):"sem curso"}${ac?" · "+esc(ac):""}${t.fse?" · Projeto n.º "+esc(t.fse):""}${t.dt?" · Orientador educativo: "+esc(profName(t.dt)):""}</span></div>
    <label>Semanas de aulas<input type="number" min="0" step="1" data-pk="semanas" value="${p.semanas??""}" placeholder="ex.: 28"></label>
    <label>FCT (horas)<input type="number" min="0" step="1" data-pk="fct.horas" value="${p.fct.horas??""}"></label>
    <label>FCT (semanas)<input type="number" min="0" step="1" data-pk="fct.semanas" value="${p.fct.semanas??""}"></label>
    <label>FCT (dias)<input type="number" min="0" data-pk="fct.dias" value="${p.fct.dias!=null?Math.round(p.fct.dias*10)/10:""}" step="0.1"></label></div>`;
  h+=`<div class="tiles pctiles">${PC_AREAS.map(([k,n])=>`<div class="tile"><div class="v">${pcNum(pcH(p.linhas.filter(l=>l.area===k)))} h</div><div class="l">${esc(n.replace("Componente ",""))}</div></div>`).join("")}
    <div class="tile"><div class="v">${pcNum(tot)} h</div><div class="l">Total de horas</div></div><div class="tile"><div class="v">${pcNum(fct)} h</div><div class="l">FCT</div></div><div class="tile"><div class="v">${pcNum(tot+fct)} h</div><div class="l">Total global</div></div></div>`;
  if(!sem)h+=`<div class="msg info">Indique as <b>semanas de aulas</b> para ver as horas semanais e os tempos de cada disciplina.</div>`;
  if(semF)h+=`<div class="msg bad">${semF} módulo(s)/cargo(s) sem formador atribuído.</div>`;
  for(const [k,n] of PC_AREAS){const D=pcDiscs(p,k);
    h+=`<h3 class="pcarea">${esc(n)} <span>${pcNum(pcH(p.linhas.filter(l=>l.area===k)))} h</span></h3>`;
    for(const d of D){const L=p.linhas.filter(l=>l.area===k&&l.disc===d),hd=pcH(L),hs=pcSemana(hd,p);
      h+=`<div class="pcd" data-area="${k}" data-disc="${esc(d)}"><div class="pcdh"><input type="text" list="pcDiscDL" data-ren value="${esc(d)}" title="Nome da disciplina (muda em todas as linhas)"><button class="x" data-deldisc title="Apagar a disciplina e os seus módulos">×</button></div>
        <table class="rt pct"><thead><tr><th>Módulo / UFCD / UC</th><th style="width:90px">Horas</th><th style="width:270px">Formador</th><th style="width:34px"></th></tr></thead><tbody>
        ${L.map(l=>`<tr data-l="${l.id}"><td><input type="text" list="pcModDL" data-k="mod" value="${esc(l.mod)}" placeholder="ex.: Módulo 1 - …"></td><td><input type="number" min="0" step="any" data-k="h" value="${l.h??""}"></td><td><select data-k="f"${l.f?"":` class="pcsem"`}>${lzOpts("prof",l.f,`<option value="">— sem formador —</option>`)}</select></td><td><button class="x" data-dell title="Apagar a linha">×</button></td></tr>`).join("")}
        </tbody><tfoot><tr><td><button class="b s" data-addl>+ módulo</button> <button class="b s" data-todos title="Atribuir o mesmo formador a todos os módulos desta disciplina">mesmo formador em todos</button></td><td><b>${pcNum(hd)} h</b></td><td colspan="2" class="hint" style="margin:0">${sem?`${pcNum(hs)} h/semana · ${Math.ceil(hs-1e-9)} tempo(s) semanal(is)`:""}</td></tr></tfoot></table></div>`}
    h+=`<div class="row pcadd" data-area="${k}"><input type="text" list="pcDiscDL" placeholder="Acrescentar disciplina à componente ${esc(PC_AREA_NOME[k].toLowerCase())}…" data-newdisc><button class="b s" data-adddisc>Acrescentar disciplina</button></div>`}
  h+=`<h3 class="pcarea">Cargos <span>${pcNum(pcH(p.cargos))} h · componente não letiva</span></h3>
    <table class="rt pct"><thead><tr><th>Cargo</th><th style="width:90px">Horas</th><th style="width:270px">Formador</th><th style="width:34px"></th></tr></thead><tbody>
    ${p.cargos.map(x=>`<tr data-c="${x.id}"><td><input type="text" list="pcCargoDL" data-k="nome" value="${esc(x.nome)}"></td><td><input type="number" min="0" step="any" data-k="h" value="${x.h??""}"></td><td><select data-k="f"${x.f?"":` class="pcsem"`}>${lzOpts("prof",x.f,`<option value="">— sem formador —</option>`)}</select></td><td><button class="x" data-delc title="Apagar o cargo">×</button></td></tr>`).join("")}
    </tbody><tfoot><tr><td colspan="4"><button class="b s" data-addc>+ cargo</button></td></tr></tfoot></table>
    <div class="row" style="margin-top:18px;justify-content:flex-end"><button class="b s pcdanger" data-delplano>Apagar o plano de ${esc(t.cod)} em ${esc(a.nome)}</button></div>`;
  out.innerHTML=h+pcResumoAno()}

// quadro de todas as turmas do ano ativo (no fim da página)
function pcResumoAno(){const a=anoAtivo(),T=turmasDoAno(a);if(!T.length)return "";
  const rows=T.map(t=>{const p=pcDe(t.id,a.id),c=pcCurso(t);if(!p)return `<tr data-ir-t="${t.id}"><td><b>${esc(t.cod)}</b></td><td>${c?esc(c.nome):""}</td><td>${esc(anoCurricular(t,a))}</td><td colspan="5" class="hint" style="margin:0">sem plano</td></tr>`;
    const s=PC_AREAS.map(([k])=>pcH(p.linhas.filter(l=>l.area===k))),tt=pcH(p.linhas),sf=p.linhas.filter(l=>!l.f).length;
    return `<tr data-ir-t="${t.id}"><td><b>${esc(t.cod)}</b></td><td>${c?esc(c.nome):""}</td><td>${esc(anoCurricular(t,a))}</td>${s.map(v=>`<td class="pcn">${pcNum(v)}</td>`).join("")}<td class="pcn">${pcNum(+p.fct.horas||0)}</td><td class="pcn"><b>${pcNum(tt+(+p.fct.horas||0))}</b></td><td>${sf?`<span class="tag bad">${sf} sem formador</span>`:`<span class="tag ok">completo</span>`}</td></tr>`}).join("");
  return `<h3 class="pcarea" style="margin-top:26px">Todas as turmas em ${esc(a.nome)}</h3><table class="rt pcres"><thead><tr><th>Turma</th><th>Curso</th><th>Ano</th><th>Sociocultural</th><th>Científica</th><th>Técnica</th><th>FCT</th><th title="Sociocultural + Científica + Técnica + FCT">Total</th><th>Estado</th></tr></thead><tbody>${rows}</tbody></table>`}

$("#pcTurma").addEventListener("change",e=>{PC_T=e.target.value;try{localStorage.setItem("pc_t",PC_T)}catch(x){}renderPC()});
function pcAtual(){return pcDe(PC_T)}
function pcGuardar(){save();renderPC()}
$("#pcOut").addEventListener("change",e=>{const p=pcAtual(),el=e.target;
  if(el.id==="pcCopF")return;
  if(!p)return;
  if(el.dataset.pk){const v=el.value===""?null:+el.value;if(el.dataset.pk.startsWith("fct."))p.fct[el.dataset.pk.slice(4)]=v;else p[el.dataset.pk]=v;return pcGuardar()}
  if(el.hasAttribute("data-ren")){const box=el.closest(".pcd"),de=box.dataset.disc,para=el.value.trim();if(!para||para===de){el.value=de;return}
    p.linhas.forEach(l=>{if(l.area===box.dataset.area&&l.disc===de)l.disc=para});pcDiscNova(para);return pcGuardar()}
  const tr=el.closest("tr[data-l],tr[data-c]");if(!tr||!el.dataset.k)return;
  const o=tr.dataset.l?p.linhas.find(x=>x.id===tr.dataset.l):p.cargos.find(x=>x.id===tr.dataset.c);if(!o)return;const k=el.dataset.k;
  if(k==="h")o.h=el.value===""?null:+el.value;else o[k]=el.value.trim();
  if(k==="mod"&&tr.dataset.l&&(o.h==null||o.h===0)){const hc=pcHorasCatalogo(escData().turmas.find(t=>t.id===p.turmaId)||{},o.mod);if(hc)o.h=hc}
  pcGuardar()});
$("#pcOut").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.matches("[data-newdisc]")){e.preventDefault();e.target.closest(".pcadd").querySelector("[data-adddisc]").click()}});
$("#pcOut").addEventListener("click",e=>{const el=e.target.closest("button,tr[data-ir-t]");if(!el)return;const a=anoAtivo();
  if(el.matches("tr[data-ir-t]")){if(e.target.closest("input,select,button"))return;PC_T=el.dataset.irT;try{localStorage.setItem("pc_t",PC_T)}catch(x){}renderPC();$("#pc").scrollIntoView({behavior:"smooth"});return}
  const t=escData().turmas.find(x=>x.id===PC_T);if(!t)return;
  if(el.hasAttribute("data-pcnovo")){pcNovo(t);return pcGuardar()}
  if(el.hasAttribute("data-pccop")){const src=pcPlanos().find(x=>x.id===$("#pcCopSel").value);if(!src)return;const comF=$("#pcCopF").checked;
    const p=pcNovo(t);p.semanas=src.semanas;p.fct=Object.assign({},src.fct);p.linhas=src.linhas.map(l=>Object.assign({},l,{id:uid(),f:comF?l.f:""}));p.cargos=(src.cargos||[]).map(c=>Object.assign({},c,{id:uid(),f:comF?c.f:""}));
    toast("Plano copiado");return pcGuardar()}
  const p=pcAtual();if(!p)return;
  if(el.hasAttribute("data-addl")){const box=el.closest(".pcd"),area=box.dataset.area,d=box.dataset.disc;let i=-1;p.linhas.forEach((l,j)=>{if(l.area===area&&l.disc===d)i=j});
    const ult=p.linhas[i];p.linhas.splice(i+1,0,{id:uid(),area,disc:d,mod:"",h:null,f:ult?ult.f:""});pcGuardar();
    const trs=$("#pcOut").querySelectorAll(`.pcd[data-area="${area}"] tr[data-l]`);const novo=[...trs].find(r=>{const l=p.linhas.find(x=>x.id===r.dataset.l);return l&&l.disc===d&&!l.mod});if(novo)novo.querySelector("input").focus();return}
  if(el.hasAttribute("data-todos")){const box=el.closest(".pcd"),L=p.linhas.filter(l=>l.area===box.dataset.area&&l.disc===box.dataset.disc),f=(L.find(l=>l.f)||{}).f;
    if(!f){toast("Escolha primeiro o formador numa das linhas");return}L.forEach(l=>l.f=f);toast("Formador atribuído a todos os módulos da disciplina");return pcGuardar()}
  if(el.hasAttribute("data-dell")){const id=el.closest("tr").dataset.l,l=p.linhas.find(x=>x.id===id);ponto(`Antes de apagar ${l&&l.mod||"uma linha"} do plano de ${t.cod}`);p.linhas=p.linhas.filter(x=>x.id!==id);toast("Linha apagada (pode anular)");return pcGuardar()}
  if(el.hasAttribute("data-deldisc")){const box=el.closest(".pcd"),d=box.dataset.disc,n=p.linhas.filter(l=>l.area===box.dataset.area&&l.disc===d).length;
    if(!confirm(`Apagar a disciplina ${d} (${n} módulo(s)) do plano de ${t.cod}?`))return;ponto(`Antes de apagar ${d} do plano de ${t.cod}`);p.linhas=p.linhas.filter(l=>!(l.area===box.dataset.area&&l.disc===d));toast("Disciplina apagada (pode anular)");return pcGuardar()}
  if(el.hasAttribute("data-adddisc")){const box=el.closest(".pcadd"),inp=box.querySelector("[data-newdisc]"),d=inp.value.trim();if(!d){inp.focus();return}
    if(p.linhas.some(l=>l.area===box.dataset.area&&l.disc===d)){toast("Essa disciplina já está nesta componente");return}
    p.linhas.push({id:uid(),area:box.dataset.area,disc:d,mod:"",h:null,f:""});pcDiscNova(d);return pcGuardar()}
  if(el.hasAttribute("data-addc")){p.cargos.push({id:uid(),nome:"",h:null,f:""});return pcGuardar()}
  if(el.hasAttribute("data-delc")){const id=el.closest("tr").dataset.c;ponto(`Antes de apagar um cargo do plano de ${t.cod}`);p.cargos=p.cargos.filter(x=>x.id!==id);toast("Cargo apagado (pode anular)");return pcGuardar()}
  if(el.hasAttribute("data-delplano")){if(!confirm(`Apagar todo o plano curricular de ${t.cod} em ${a.nome}? (${p.linhas.length} módulo(s), ${p.cargos.length} cargo(s))\n\nPode anular a seguir ou repor num ponto de restauro.`))return;
    ponto(`Antes de apagar o plano curricular de ${t.cod} em ${a.nome}`);escData().planos=pcPlanos().filter(x=>x!==p);toast("Plano apagado (pode anular)");return pcGuardar()}});
function pcDiscNova(d){const L=escData().disciplinas;if(d&&!L.some(x=>norm(x)===norm(d)))L.push(d)}

/* ---------- importar o livro do Excel "Planos Curriculares e DSD" ---------- */
let XLSXJ=null;
async function loadXLSX(){if(!XLSXJ){if(!window.XLSX)await loadScript("lib/xlsx.mini.min.js");XLSXJ=window.XLSX}return XLSXJ}
function pcLerLivro(XLSX,wb){
  const out=[],disc=[],form=[];let anoTxt="";
  const txt=v=>v==null?"":String(v).replace(/ /g," ").trim();
  for(const nome of wb.SheetNames){const ws=wb.Sheets[nome];if(!ws)continue;
    const R=XLSX.utils.sheet_to_json(ws,{header:1,raw:true,defval:null,blankrows:true});
    if(/^disciplinas$/i.test(nome)){R.forEach(r=>{const d=txt(r&&r[0]);if(d)disc.push(d)});continue}
    if(/^formadores$/i.test(nome)){R.forEach(r=>{const d=txt(r&&r[0]);if(d)form.push(d)});continue}
    if(!anoTxt){for(const r of R.slice(0,6)){for(const c of r||[]){const m=txt(c).match(/DSD_\d+\.(\d{4})\/(\d{4})/);if(m){anoTxt=m[1];break}}if(anoTxt)break}}
    if(!/^turma ?\d+$/i.test(nome))continue;
    const r1=R[1]||[],r0=R[0]||[];
    const t={folha:nome,turma:txt(r1[1]),codigo:txt(r1[11]),projeto:txt(r0[7]),linhas:[],cargos:[],semanas:null,fct:{horas:null,semanas:null,dias:null}};
    if(!t.turma||/^turma\s*\d*$/i.test(t.turma)||/^A0XX/i.test(t.turma))continue;
    let area=null;const AREAS={"área sociocultural":"sociocultural","área científica":"cientifica","área técnica":"tecnica"};
    for(const r of R.slice(2)){if(!r)continue;const a=txt(r[0]),al=a.toLowerCase();
      if(AREAS[al]){area=AREAS[al];continue}
      if(al==="cargos"){if(txt(r[2]))t.cargos.push({nome:txt(r[2]),h:+r[4]||0,f:txt(r[5])});continue}
      if(/^formação em contexto de trabalho/i.test(a)){t.fct.horas=+r[3]||0;t.fct.semanas=+r[8]||null;continue}
      if(txt(r[5])==="Número de Dias de FCT")t.fct.dias=+r[8]||null;
      if(txt(r[5])==="Número de Semanas de Aulas")t.semanas=+r[8]||null;
      if(a&&area&&!/^(disciplina|total)/i.test(a)&&txt(r[2])&&typeof r[4]==="number")t.linhas.push({area,disc:a,mod:txt(r[2]),h:r[4],f:txt(r[5])})}
    out.push(t)}
  return {turmas:out,disciplinas:[...new Set(disc)],formadores:[...new Set(form)],ano:anoTxt?+anoTxt:null}}
// "158 - Joel da Cunha" → formador da EPISJ 360 (pelo código ou pelo nome); se não existir, é acrescentado
function pcFormador(txt,novos){txt=String(txt||"").trim();if(!txt)return "";const m=txt.match(/^(\d+)\s*[-–]\s*(.+)$/),cod=m?m[1]:"",nome=(m?m[2]:txt).trim();
  const semZ=s=>String(s||"").replace(/^0+/,"");
  let p=cfg.profs.find(x=>cod&&x.cod&&semZ(x.cod)===semZ(cod))||cfg.profs.find(x=>norm(x.nome)===norm(nome));
  if(!p){p={id:uid(),cod,nome,email:emailAuto(nome),abrev:""};cfg.profs.push(p);novos.push(nome)}else if(cod&&!p.cod)p.cod=cod;
  return p.id}
/* 0.9.38: barra de progresso ao centro do ecrã (o resto esbate-se) enquanto se lê e importa o Excel */
const IMPOV={el:null};
function ovAbrir(titulo){let o=IMPOV.el;if(!o){o=document.createElement("div");o.className="impov";o.setAttribute("role","dialog");o.setAttribute("aria-modal","true");
    o.innerHTML=`<div class="impbox"><div class="imptit"></div><div class="impbar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i></i></div><div class="impinf"><span class="imptxt"></span><b class="imppct">0%</b></div></div>`;document.body.appendChild(o);IMPOV.el=o}
  o.querySelector(".imptit").textContent=titulo;o.classList.remove("sai");o.hidden=false;void o.offsetWidth;o.classList.add("on");ovPassoSync(0,"A começar…")}
function ovPassoSync(pct,txt){const o=IMPOV.el;if(!o)return;pct=Math.max(0,Math.min(100,Math.round(pct)));o.querySelector(".impbar i").style.width=pct+"%";o.querySelector(".impbar").setAttribute("aria-valuenow",pct);o.querySelector(".imppct").textContent=pct+"%";if(txt)o.querySelector(".imptxt").textContent=txt}
async function ovPasso(pct,txt){ovPassoSync(pct,txt);await new Promise(r=>requestAnimationFrame(()=>setTimeout(r,30)))}
async function ovFechar(atraso){const o=IMPOV.el;if(!o)return;if(atraso)await new Promise(r=>setTimeout(r,atraso));o.classList.add("sai");o.classList.remove("on");setTimeout(()=>{if(o.classList.contains("sai"))o.hidden=true},260)}
/* 0.9.34: importar do Excel em dois passos — primeiro lê e mostra o que vai entrar (e para que ano letivo), só grava ao carregar em "Importar dados".
   Já não muda o ano letivo ativo sozinho; no fim confirma que os planos ficaram guardados neste navegador e cria um ponto de restauro. */
let PC_IMP=null;
async function pcImportar(file){const msg=t=>escLinhaMsg("#pcMsg",t,"info");msg("A ler "+esc(file.name)+"…");
  ovAbrir("A ler "+file.name);
  let R;try{await ovPasso(8,"A abrir o ficheiro…");const buf=await file.arrayBuffer();await ovPasso(25,"A preparar o leitor de Excel…");const X=await loadXLSX();
    await ovPasso(45,"A ler o livro do Excel…");const wb=X.read(buf,{type:"array"});await ovPasso(75,"A ler as folhas Turma 1, Turma 2…");R=pcLerLivro(X,wb);await ovPasso(100,`Encontrei ${R.turmas.length} plano(s) curricular(es)`)}
  catch(err){ovFechar();escLinhaMsg("#pcMsg","Não foi possível ler o ficheiro: "+esc(err.message),"bad");return}
  ovFechar(350);
  if(!R.turmas.length){escLinhaMsg("#pcMsg","Não encontrei folhas <b>Turma 1</b>, <b>Turma 2</b>… com um plano curricular neste ficheiro.","bad");return}
  const E=escData();let y=R.ano;if(!y){const m=file.name.match(/(20\d\d)[.\/_-](20\d\d)/);y=m?+m[1]:null}
  PC_IMP={R,file:file.name,yFicheiro:y};
  const at=anoAtivo(),anos=E.anos.slice().sort((x,z)=>z.ini-x.ini),existe=y&&E.anos.some(x=>x.ini===y);
  const nmod=R.turmas.reduce((n,T)=>n+T.linhas.length,0);
  const opts=anos.map(x=>`<option value="${x.id}"${x.id===at.id?" selected":""}>${esc(x.nome)}${x.id===at.id?" (ano ativo)":""}</option>`).join("")+(y&&!existe?`<option value="novo:${y}">${y}/${y+1} (criar este ano letivo)</option>`:"");
  $("#pcMsg").innerHTML=`<div class="msg info" style="margin:10px 0 0"><b>${esc(file.name)}</b> — encontrei ${R.turmas.length} plano(s) curricular(es), com ${nmod} módulos/UFCD:<br>
    <span class="hint" style="margin:0">${esc(R.turmas.map(T=>T.turma).join(" · "))}</span>
    ${y&&y!==at.ini?`<br><b>Atenção:</b> o ficheiro diz <b>${y}/${y+1}</b>, mas o ano letivo ativo é <b>${esc(at.nome)}</b>. Escolha abaixo para que ano letivo entram os planos.`:""}
    <div class="row" style="margin-top:10px;align-items:flex-end;flex-wrap:wrap;gap:10px">
      <label>Ano letivo dos planos<select id="pcImpAno">${opts}</select></label>
      <label class="chk" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="pcImpSub" checked> Substituir os planos que já existam nessas turmas</label>
      <span class="grow"></span><button class="b imp" id="pcImpOk">Importar dados</button><button class="b s" id="pcImpX">Cancelar</button></div>
    <p class="hint" style="margin:6px 0 0">Nada é gravado antes de carregar em <b>Importar dados</b>. Turmas, cursos e formadores que faltem são acrescentados; nada é apagado.</p></div>`;
  $("#pcImpX").onclick=()=>{PC_IMP=null;escLinhaMsg("#pcMsg","Importação cancelada — nada foi alterado.","info")};
  $("#pcImpOk").onclick=()=>pcImportarAplicar($("#pcImpAno").value,$("#pcImpSub").checked)}
async function pcImportarAplicar(anoSel,subst){if(!PC_IMP)return;const {R,file}=PC_IMP;const E=escData();
  let ano=null,anoNovo=false;
  ponto("Antes de importar os planos curriculares de "+file);
  if(String(anoSel).startsWith("novo:")){const y=+anoSel.slice(5);ano=E.anos.find(x=>x.ini===y);if(!ano){ano=novoAno(y);E.anos.push(ano);anoNovo=true}}
  else ano=E.anos.find(x=>x.id===anoSel)||anoAtivo();
  ovAbrir("A importar os planos curriculares");await ovPasso(4,"A criar um ponto de restauro…");
  const novosF=[],novasT=[],novosC=[];let feitos=0,salt=0,ni=0;
  for(const T of R.turmas){ni++;await ovPasso(5+80*(ni-1)/R.turmas.length,`Turma ${ni} de ${R.turmas.length}: ${T.turma}`);const t=pcTurmaDe(T,false,novasT,novosC);if(!t)continue;
    let p=pcDe(t.id,ano.id);if(p&&!subst){salt++;continue}
    if(!p)p=pcNovo(t,ano.id);
    p.semanas=T.semanas;p.fct={horas:T.fct.horas,semanas:T.fct.semanas,dias:T.fct.dias!=null?Math.round(T.fct.dias*100)/100:null};
    p.linhas=T.linhas.map(l=>({id:uid(),area:l.area,disc:l.disc,mod:l.mod,h:l.h,f:pcFormador(l.f,novosF)}));
    p.cargos=T.cargos.map(c=>({id:uid(),nome:c.nome,h:c.h,f:pcFormador(c.f,novosF)}));
    if(!t.fse&&T.projeto&&!/X{2,}/i.test(T.projeto))t.fse=fseNorm(T.projeto);
    feitos++}
  await ovPasso(87,"A acrescentar disciplinas e formadores…");R.disciplinas.forEach(pcDiscNova);
  cfg.profs.sort((a,b)=>COLL_PT.compare(String(a.nome),String(b.nome)));
  await ovPasso(92,"A guardar…");save();await ovPasso(96,"A confirmar a gravação…");
  // confirma que ficou mesmo gravado neste navegador
  let gravados=0;try{const st=JSON.parse(localStorage.getItem(KEY)||"{}");gravados=((st.escola||{}).planos||[]).filter(x=>x.anoId===ano.id).length}catch(e){}
  if(!gravados){const sj=JSON.stringify(cfg);if(await DB.put("kv","cfgCopia",{t:Date.now(),s:sj}))try{const c=await DB.get("kv","cfgCopia");gravados=((JSON.parse(c.s).escola||{}).planos||[]).filter(x=>x.anoId===ano.id).length}catch(e){}}
  ponto("Depois de importar os planos curriculares de "+file);try{nuvemAgendar()}catch(e){}
  PC_IMP=null;
  try{renderAll()}catch(x){}escRender();try{esRecarregar()}catch(x){}renderPC();
  await ovPasso(100,gravados?"Guardado ✓":"Terminado");ovFechar(500);
  const outro=ano.id!==escData().ativo;
  escLinhaMsg("#pcMsg",`${gravados?"✓ Guardado. ":"<b>Não consegui confirmar a gravação</b> — veja se o navegador tem espaço e tente de novo. "}Importado(s) ${feitos} plano(s) curricular(es) para <b>${esc(ano.nome)}</b>${anoNovo?" (ano letivo criado)":""}${salt?` · ${salt} turma(s) que já tinham plano ficaram como estavam`:""} · ${gravados} plano(s) de ${esc(ano.nome)} guardados neste navegador.`+
    (outro?`<br>Os planos ficaram em ${esc(ano.nome)}, que não é o ano letivo ativo. <button class="b s" id="pcIrAno" style="margin-left:6px">Mudar para ${esc(ano.nome)}</button>`:"")+
    (novasT.length?`<br>Turmas criadas: ${esc(novasT.join(", "))}.`:"")+(novosC.length?`<br>Cursos criados: ${esc(novosC.join(", "))} — ligue-os ao catálogo em <b>Escola › Cursos</b>.`:"")+
    (novosF.length?`<br>Formadores acrescentados (falta o email): ${esc([...new Set(novosF)].join(", "))}.`:""),gravados?"ok":"bad");
  const b=$("#pcIrAno");if(b)b.onclick=()=>{mudarAnoAtivo(ano.id);try{renderPC()}catch(e){}}}
// "A07 - Mecatrónica Automóvel (26-29)" → turma da EPISJ 360 (cria a turma e o curso se faltarem, a não ser que só se esteja a procurar)
function pcTurmaDe(T,soProcurar,novasT,novosC){const E=escData(),s=String(T.turma).replace(/ /g," ");
  const m=s.match(/^\s*([A-Z]\d+)\s*[-–]\s*(.+?)\s*\((\d{2,4})\s*[-\/]\s*(\d{2,4})\)\s*$/i)||s.match(/^\s*([A-Z]\d+)\s*[-–]\s*(.+?)\s*$/i);if(!m)return null;
  const cod=m[1].toUpperCase(),curso=m[2].trim(),y4=v=>v?(+v<100?2000+ +v:+v):null,ai=y4(m[3]),af=y4(m[4]);
  let t=E.turmas.find(x=>norm(x.cod)===norm(cod)&&(!ai||!x.anoIni||x.anoIni===ai));
  if(t||soProcurar)return t||null;
  let c=E.cursos.find(x=>norm(x.nome)===norm(curso));
  if(!c){c={id:uid(),nome:curso,sigla:"",tipo:"Profissional",qual:null,itens:[]};E.cursos.push(c);E.cursos.sort((a,b)=>COLL_PT.compare(a.nome,b.nome));novosC.push(curso)}
  t={id:uid(),cod,nome:"",cursoId:c.id,anoIni:ai,anoFim:af,dt:"",fse:""};E.turmas.push(t);novasT.push(cod);return t}
$("#pcImp").onclick=()=>$("#pcFile").click();
$("#pcFile").addEventListener("change",e=>{const f=e.target.files[0];e.target.value="";if(f)pcImportar(f)});

/* ---------- Distribuição de Serviço Docente (calculada dos planos do ano ativo) ---------- */
let DSD_SEL=(()=>{try{return localStorage.getItem("dsd_sel")||""}catch(e){return ""}})();
function dsdDados(aid){aid=aid||anoAtivo().id;const E=escData(),TT=new Map(E.turmas.map(t=>[t.id,t])),M=new Map();
  const get=id=>{if(!M.has(id))M.set(id,{id,let:[],nl:[],h:0,hnl:0,hs:0,areas:new Set(),turmas:new Set()});return M.get(id)};
  for(const p of pcPlanos().filter(p=>p.anoId===aid)){const t=TT.get(p.turmaId);if(!t)continue;pcNorm(p);
    for(const l of p.linhas){const r=get(l.f||""),h=+l.h||0;r.let.push({t,p,l});r.h+=h;r.hs+=pcSemana(h,p);r.areas.add(l.area);r.turmas.add(t.id)}
    for(const c of p.cargos){const r=get(c.f||""),h=+c.h||0;r.nl.push({t,p,c});r.hnl+=h;r.hs+=pcSemana(h,p);r.turmas.add(t.id)}}
  // 0.9.50: componente não letiva acrescentada à mão na DSD (cargos e outras horas que não estão nos planos das turmas)
  const semR=dsdSemRef(aid);for(const x of dsdNLs().filter(x=>x.anoId===aid&&x.f)){const r=get(x.f),h=+x.h||0,hs=x.hs!==""&&x.hs!=null?(+x.hs||0):(semR?h/semR:0);r.nl.push({t:null,p:null,c:{nome:x.nome||"Componente não letiva",h},man:x,hs});r.hnl+=h;r.hs+=hs}
  return M}
const dsdTurmaTxt=t=>{if(!t)return "Componente não letiva da escola";const c=cursoById(t.cursoId);return t.nome?t.nome:`${t.cod}${c?" - "+c.nome:""}${t.anoIni&&t.anoFim?` (${String(t.anoIni).slice(-2)}-${String(t.anoFim).slice(-2)})`:""}`};
const dsdOrd=(x,y)=>COLL_PTN.compare(String(x.t?x.t.cod:"~"),String(y.t?y.t.cod:"~"));
function dsdEu(){if(!EU||!EU.email)return null;return cfg.profs.find(p=>String(p.email||"").trim().toLowerCase()===String(EU.email).toLowerCase())||null}
const dsdSoEu=()=>perfilAtual()==="prof";
function renderDSD(){const a=anoAtivo(),M=dsdDados(a.id),out=$("#dsdOut"),soEu=dsdSoEu(),TC=new Map(escData().turmas.map(t=>[t.id,t.cod]));$("#dsdAnoLbl").textContent=a.nome;
  const CNd=new Intl.Collator("pt",{numeric:true}),CPd=new Intl.Collator("pt");const P=cfg.profs.slice().sort((x,y)=>CPd.compare(String(x.nome),String(y.nome)));
  if(soEu){const me=dsdEu();DSD_SEL=me?me.id:"";$("#dsdSel").innerHTML=me?`<option value="${me.id}">${esc(me.nome)}</option>`:`<option value="">—</option>`;$("#dsdSel").disabled=true;$("#dsdFilterL").style.display="none";$("#dsdPdfAll").style.display="none";
    if(!me){out.innerHTML=`<div class="msg info">A sua conta (<b>${esc(EU&&EU.email||"")}</b>) não aparece entre os formadores da escola.</div>`;$("#dsdPdf").disabled=true;return}}
  else{$("#dsdSel").disabled=false;$("#dsdFilterL").style.display="";$("#dsdPdfAll").style.display="";
    if(DSD_SEL&&DSD_SEL!=="_sem"&&!pcProf(DSD_SEL))DSD_SEL="";
    $("#dsdSel").innerHTML=`<option value="">Todos os formadores (resumo)</option>`+(M.has("")?`<option value="_sem" ${DSD_SEL==="_sem"?"selected":""}>— Sem formador atribuído —</option>`:"")+
      P.map(p=>{const r=M.get(p.id);return `<option value="${p.id}" ${p.id===DSD_SEL?"selected":""}>${esc(p.nome)}${p.cod?` (${esc(p.cod)})`:""}${r?` · ${pcNum(r.h+r.hnl)} h`:""}</option>`}).join("")}
  $("#dsdPdf").disabled=!DSD_SEL||DSD_SEL==="_sem";
  const nPl=pcPlanos().filter(p=>p.anoId===a.id).length;
  if(!nPl){out.innerHTML=`<p class="hint">Ainda não há planos curriculares em ${esc(a.nome)}. Faça-os ou importe-os em <b>Escola › Turmas › Planos Curriculares</b>.</p>`;return}
  if(DSD_SEL){out.innerHTML=dsdDetalhe(DSD_SEL==="_sem"?"":DSD_SEL,M);return}
  const q=norm($("#dsdFilter").value||"");
  const L=P.map(p=>({p,r:M.get(p.id)})).filter(({p,r})=>!q||norm([p.cod,p.nome,...(r?[...r.turmas].map(id=>TC.get(id)):[]),...(r?r.let.map(x=>x.l.disc):[])].join(" ")).includes(q));
  const com=L.filter(x=>x.r),sem=L.filter(x=>!x.r),S=M.get("");
  const tl=com.reduce((s,x)=>s+x.r.h,0),tn=com.reduce((s,x)=>s+x.r.hnl,0);
  let h=`<div class="tiles pctiles"><div class="tile"><div class="v">${com.length}</div><div class="l">Formadores com serviço</div></div><div class="tile"><div class="v">${pcNum(tl)} h</div><div class="l">Componente letiva</div></div><div class="tile"><div class="v">${pcNum(tn)} h</div><div class="l">Componente não letiva</div></div><div class="tile"><div class="v">${nPl}</div><div class="l">Planos de turma</div></div></div>`;
  if(S)h+=`<div class="msg bad">${S.let.length+S.nl.length} módulo(s)/cargo(s) sem formador (${pcNum(S.h+S.hnl)} h) — <a href="#" data-dsdsem>ver quais</a>.</div>`;
  h+=`<table class="rt pcres"><thead><tr><th>Código</th><th>Formador</th><th>Área(s)</th><th>Turmas</th><th>Letiva</th><th>Não letiva</th><th>Total</th><th title="Soma das horas de cada turma a dividir pelas suas semanas de aulas">H/semana</th></tr></thead><tbody>`+
    com.slice(0,DSD_N||200).map(({p,r})=>`<tr data-dsd="${p.id}"><td>${esc(p.cod||"")}</td><td><b>${esc(p.nome)}</b></td><td>${esc([...r.areas].map(k=>PC_AREA_NOME[k]).join(", "))}</td><td>${esc([...r.turmas].map(id=>TC.get(id)).sort((x,y)=>CNd.compare(String(x),String(y))).join(", "))}</td><td class="pcn">${pcNum(r.h)}</td><td class="pcn">${pcNum(r.hnl)}</td><td class="pcn"><b>${pcNum(r.h+r.hnl)}</b></td><td class="pcn">${r.hs?pcNum(r.hs):"—"}</td></tr>`).join("")+`</tbody></table>`;
  if(com.length>(DSD_N||200))h+=`<div style="text-align:center;margin:10px 0"><button class="b s" type="button" data-dsdmais>Mostrar mais ${Math.min(500,com.length-(DSD_N||200))} formadores (faltam ${com.length-(DSD_N||200)}) — ou procure acima</button></div>`; // 0.9.53
  if(sem.length)h+=`<details style="margin-top:12px"><summary class="hint" style="cursor:pointer">${sem.length} formador(es) sem serviço atribuído em ${esc(a.nome)}</summary><p class="hint">${sem.map(({p})=>esc(p.nome)).join(", ")}</p></details>`;
  out.innerHTML=h}
var DSD_N=200;
function dsdDetalhe(id,M){const r=M.get(id),p=id?pcProf(id):null,a=anoAtivo();
  const tit=id?`${p?(p.cod?p.cod+" - ":"")+p.nome:"(formador apagado)"}`:"Sem formador atribuído";
  if(!r)return `<div class="msg info"><b>${esc(tit)}</b> não tem serviço atribuído nos planos curriculares de ${esc(a.nome)}.</div>`+dsdNLSec(id,a);
  const porT=new Map();for(const x of r.let.concat(r.nl)){if(!x.t)continue;if(!porT.has(x.t.id))porT.set(x.t.id,{t:x.t,p:x.p,let:[],nl:[]});(x.l?porT.get(x.t.id).let:porT.get(x.t.id).nl).push(x)}
  let h=`<div class="pchead"><div><b>${esc(tit)}</b><span>${id?`Área(s): ${esc([...r.areas].map(k=>PC_AREA_NOME[k]).join(", ")||"—")} · `:""}${r.turmas.size} turma(s)${p&&p.email?" · "+esc(p.email):""}</span></div></div>
    <div class="tiles pctiles"><div class="tile"><div class="v">${pcNum(r.h)} h</div><div class="l">Componente letiva</div></div><div class="tile"><div class="v">${pcNum(r.hnl)} h</div><div class="l">Componente não letiva</div></div><div class="tile"><div class="v">${pcNum(r.h+r.hnl)} h</div><div class="l">Total</div></div><div class="tile"><div class="v">${r.hs?pcNum(r.hs):"—"}</div><div class="l">Horas por semana</div></div></div>
    <table class="rt pcres"><thead><tr><th>Curso / turma</th><th>Disciplina</th><th>Módulo / UFCD / UC</th><th>Horas</th><th>H/semana</th></tr></thead><tbody>`;
  for(const g of [...porT.values()].sort(dsdOrd)){const all=g.let.map(x=>[x.l.disc,x.l.mod,+x.l.h||0]).concat(g.nl.map(x=>["Cargo",x.c.nome,+x.c.h||0]));
    h+=all.map((v,i)=>`<tr>${i===0?`<td rowspan="${all.length+1}"><b>${esc(dsdTurmaTxt(g.t))}</b><br>${dsdSoEu()?"":`<button class="b s" data-abrirpc="${g.t.id}" style="margin-top:6px">Abrir o plano</button>`}</td>`:""}<td>${esc(v[0])}</td><td>${esc(v[1])}</td><td class="pcn">${pcNum(v[2])}</td><td class="pcn">${+g.p.semanas?pcNum(v[2]/g.p.semanas):"—"}</td></tr>`).join("")+
      `<tr class="pcsub"><td colspan="2">Subtotal ${esc(g.t.cod)}</td><td class="pcn"><b>${pcNum(pcH(all.map(v=>({h:v[2]}))))}</b></td><td></td></tr>`}
  return h+`</tbody></table>`+dsdNLSec(id,a)}

/* ---------- 0.9.50: componente não letiva acrescentada à mão na DSD ----------
   cfg.escola.dsdNL = [{id, anoId, f (formador), nome (cargo ou atividade), h (horas no ano), hs (horas por semana, opcional), obs}] */
function dsdNLs(){const E=escData();if(!Array.isArray(E.dsdNL))E.dsdNL=[];return E.dsdNL}
// semanas de aulas de referência: as dos planos do ano (a mais frequente) ou as do calendário do ano letivo
function dsdSemRef(aid){const c=new Map();pcPlanos().filter(p=>p.anoId===aid&&+p.semanas>0).forEach(p=>c.set(+p.semanas,(c.get(+p.semanas)||0)+1));
  if(c.size)return [...c].sort((x,y)=>y[1]-x[1]||y[0]-x[0])[0][0];const a=escData().anos.find(x=>x.id===aid);try{return a?esSemanas({semanas:0},a):30}catch(e){return 30}}
function dsdPodeEditar(){return !RO&&podePublicar()&&!dsdSoEu()}
var DSD_NL_SUG=["Coordenação de Curso","Coordenação de Departamento","Coordenação Pedagógica","Orientador Educativo","Responsável de Curso","Coordenador de FCT","Orientador de FCT","Acompanhamento da PAP","Biblioteca / Centro de Recursos","Apoio Educativo","Apoio a formandos","Projetos (Erasmus+ e outros)","Gabinete de Inserção Profissional","Secretariado de Exames","Assessoria à Direção","Delegado de Segurança","Desporto Escolar","Clube","Qualidade (EQAVET)","Formação de formadores"];
function dsdNLSec(id,a){if(!id)return "";const L=dsdNLs().filter(x=>x.anoId===a.id&&x.f===id),ed=dsdPodeEditar(),sem=dsdSemRef(a.id);if(!ed&&!L.length)return "";
  if(!$("#dsdNLDL")){const dl=document.createElement("datalist");dl.id="dsdNLDL";dl.innerHTML=DSD_NL_SUG.map(v=>`<option value="${esc(v)}">`).join("");document.body.appendChild(dl)}
  const hsTxt=x=>x.hs!==""&&x.hs!=null?pcNum(x.hs):sem?pcNum((+x.h||0)/sem):"—";
  let h=`<div class="dsdnl"><h3>Componente não letiva acrescentada à mão</h3><p class="hint" style="margin-top:0">Cargos e outras horas que não vêm dos planos das turmas (coordenações, projetos, biblioteca, apoio…). Contam na componente não letiva, no total, nas horas por semana e no PDF da DSD.${sem?` Sem horas por semana escritas, contam ${pcNum(sem)} semanas de aulas.`:""}</p>
    <table class="rt dsdnlt"><thead><tr><th>Cargo ou atividade</th><th style="width:120px">Horas no ano</th><th style="width:130px">Horas por semana</th><th>Observações</th>${ed?'<th style="width:40px"></th>':""}</tr></thead><tbody>`;
  h+=L.map(x=>ed?`<tr data-nl="${esc(x.id)}"><td><input type="text" data-nlk="nome" value="${esc(x.nome||"")}" list="dsdNLDL"></td><td><input type="number" min="0" step="0.5" data-nlk="h" value="${esc(x.h??"")}"></td><td><input type="number" min="0" step="0.25" data-nlk="hs" value="${esc(x.hs??"")}" placeholder="${esc(hsTxt(x))}"></td><td><input type="text" data-nlk="obs" value="${esc(x.obs||"")}"></td><td><button class="x" data-nldel title="Apagar">×</button></td></tr>`
    :`<tr><td>${esc(x.nome||"")}</td><td class="pcn">${pcNum(x.h)}</td><td class="pcn">${hsTxt(x)}</td><td>${esc(x.obs||"")}</td></tr>`).join("")
    ||`<tr><td colspan="${ed?5:4}" class="hint">Ainda sem horas não letivas acrescentadas à mão para este formador.</td></tr>`;
  h+=`</tbody></table>`;
  if(ed)h+=`<form class="row dsdnlf" data-nlf="${esc(id)}" autocomplete="off"><label class="grow">Cargo ou atividade<input type="text" name="nome" list="dsdNLDL" placeholder="ex.: Coordenação de Departamento" required></label><label style="width:120px">Horas no ano<input type="number" name="h" min="0" step="0.5"></label><label style="width:130px">Horas por semana<input type="number" name="hs" min="0" step="0.25"></label><label class="grow">Observações<input type="text" name="obs"></label><button class="b" type="submit" style="align-self:flex-end">Acrescentar</button></form>`;
  return h+`</div>`}
$("#dsdOut").addEventListener("change",e=>{const i=e.target.closest("[data-nlk]");if(!i||!dsdPodeEditar())return;const tr=i.closest("tr[data-nl]"),x=tr&&dsdNLs().find(z=>z.id===tr.dataset.nl);if(!x)return;
  const k=i.dataset.nlk;let v=i.value;if(k==="h"||k==="hs"){v=v===""?"":Math.max(0,+v||0);if(k==="hs"&&v!==""&&(x.h===""||x.h==null)){const sm=dsdSemRef(x.anoId);if(sm)x.h=Math.round(v*sm*100)/100}}else v=String(v).trim();
  x[k]=v;save();renderDSD()});
$("#dsdOut").addEventListener("click",e=>{const b=e.target.closest("[data-nldel]");if(!b||!dsdPodeEditar())return;const id=b.closest("tr[data-nl]").dataset.nl,E=escData(),x=dsdNLs().find(z=>z.id===id);if(!x)return;
  if(!confirm(`Apagar «${x.nome||"componente não letiva"}» da Distribuição de Serviço Docente?`))return;E.dsdNL=E.dsdNL.filter(z=>z.id!==id);save();renderDSD();toast("Apagado (pode anular)")});
$("#dsdOut").addEventListener("submit",e=>{const f=e.target.closest("[data-nlf]");if(!f)return;e.preventDefault();if(!dsdPodeEditar())return;const fd=new FormData(f),nome=String(fd.get("nome")||"").trim();if(!nome){toast("Escreva o cargo ou a atividade");return}
  let h=fd.get("h")===""?"":Math.max(0,+fd.get("h")||0),hs=fd.get("hs")===""?"":Math.max(0,+fd.get("hs")||0);const a=anoAtivo(),sm=dsdSemRef(a.id);
  if(h===""&&hs===""){toast("Indique as horas no ano ou as horas por semana");return}if(h===""&&sm)h=Math.round(hs*sm*100)/100;
  dsdNLs().push({id:uid(),anoId:a.id,f:f.dataset.nlf,nome,h,hs,obs:String(fd.get("obs")||"").trim()});save();renderDSD();toast("Acrescentado à componente não letiva")});
$("#dsdSel").addEventListener("change",e=>{DSD_SEL=e.target.value;try{localStorage.setItem("dsd_sel",DSD_SEL)}catch(x){}renderDSD()});
{let h=null;$("#dsdFilter").addEventListener("input",()=>{if(DSD_SEL){DSD_SEL="";}DSD_N=200;clearTimeout(h);h=setTimeout(renderDSD,120)})}
$("#dsdOut").addEventListener("click",e=>{if(e.target.closest("[data-dsdmais]")){DSD_N=(DSD_N||200)+500;renderDSD();return}const tr=e.target.closest("tr[data-dsd]");if(tr){DSD_SEL=tr.dataset.dsd;renderDSD();$("#dsd").scrollIntoView({behavior:"smooth"});return}
  if(e.target.closest("[data-dsdsem]")){e.preventDefault();DSD_SEL="_sem";renderDSD();return}
  const b=e.target.closest("[data-abrirpc]");if(b){PC_T=b.dataset.abrirpc;try{localStorage.setItem("pc_t",PC_T)}catch(x){}show("pc")}});

/* ---------- PDF: plano curricular da turma e DSD de cada formador ---------- */
const PC_RODAPE="Escola Profissional da Ilha de São Jorge · EPISJ 360 · Escola360";
function pdfAssinatura(doc,y){if(y>297-PDF_BOT-28){doc.addPage();y=PDF_TOP+10}doc.setDrawColor(150);doc.setLineWidth(.2);doc.line(120,y+16,196,y+16);doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.setTextColor(95);doc.text("(Diretor Pedagógico)",158,y+21,{align:"center"});return y+26}
/* 0.9.32: Plano Curricular Detalhado no formato da folha oficial da escola (uma tabela por disciplina com o total e as horas semanais,
   Área Sociocultural/Científica/Técnica, Cargos, quadro de FCT e totais, assinatura, data da impressão e paginação); um PDF por turma ou de todas */
function pdfPlanoSec(doc,t,p,a){const ini=doc.getNumberOfPages(),TOP=40,W=210;
  doc.setTextColor(0);doc.setFontSize(8);
  if(t.fse){doc.setFont("helvetica","bolditalic");const v=pdfTxt(t.fse);doc.text(v,170,33,{align:"right"});doc.setFont("helvetica","italic");doc.text("Projeto n.º ",170-doc.getTextWidth(v),33,{align:"right"})}
  const curso=pdfTxt(dsdTurmaTxt(t)),ano=(anoCurricular(t,a)||"").replace(/\s*ano$/,"");
  doc.setFont("helvetica","normal");doc.text("Curso: ",30,37.5);doc.setFont("helvetica","bold");doc.text(curso,30+doc.getTextWidth("Curso: "),37.5);
  if(ano){doc.setFont("helvetica","bold");doc.text(pdfTxt(ano),170,37.5,{align:"right"});doc.setFont("helvetica","normal");doc.text("Ano: ",170-doc.getTextWidth(pdfTxt(ano)),37.5,{align:"right"})}
  doc.setDrawColor(0);doc.setLineWidth(.6);doc.line(14,39.2,W-14,39.2);
  const P1={top:1,bottom:1,left:1,right:1},PD={top:3.2,bottom:3.2,left:1,right:1},SEM=p.semanas||0;
  const LW=(b)=>({top:.2,right:.2,bottom:b||.2,left:.2});
  const area=n=>[{content:n,colSpan:6,styles:{halign:"right",fontStyle:"italic",lineWidth:0,fillColor:false,cellPadding:{top:2.2,bottom:.8,left:1,right:1}}}];
  const cab=(c5)=>["Disciplina","Módulos/UFCDs","Horas","Formador",c5,"Autorização de Lecionação"].map((x,i)=>({content:x,styles:{fillColor:[217,217,217],fontStyle:"bold",fontSize:7,cellPadding:P1,halign:i===2||i>=4?"center":"left",valign:"middle"}}));
  const tempos=h=>SEM?String(Math.ceil(h/SEM-1e-9)):"";
  const tot=(h,sem)=>[{content:"Total",colSpan:2,styles:{halign:"right",fontStyle:"bolditalic",cellPadding:P1,lineWidth:LW(.8)}},{content:pcNum(h),styles:{halign:"right",fontStyle:"bolditalic",cellPadding:P1,lineWidth:LW(.8)}},
    {content:sem?"Horas Semanais":"",styles:{fontStyle:"bolditalic",cellPadding:P1,lineWidth:LW(.8)}},{content:"",styles:{cellPadding:P1,lineWidth:LW(.8)}},{content:sem?tempos(h):"",styles:{halign:"right",fontStyle:"italic",cellPadding:P1,lineWidth:LW(.8)}}];
  const blocos=[];let body=null;const novo=()=>{body=[];blocos.push(body)};const NOME={sociocultural:"Área Sociocultural",cientifica:"Área Científica",tecnica:"Área Técnica"};
  for(const [k] of PC_AREAS){const D=pcDiscs(p,k);if(!D.length)continue;let pri=true;
    for(const d of D){const L=p.linhas.filter(l=>l.area===k&&l.disc===d);novo();if(pri){body.push(area(NOME[k]||k));pri=false}body.push(cab(k==="tecnica"?"Regime Excecional":"Autorização de Acumulação"));
      L.forEach(l=>body.push([d,l.mod,{content:pcNum(l.h),styles:{halign:"center"}},pcProfNome(l.f)||"",""," "].map(x=>typeof x==="string"?pdfTxt(x):x)));
      body.push(tot(pcH(L),true))}}
  if(p.cargos&&p.cargos.length){novo();body.push(area("Cargos"));const G={fillColor:[217,217,217]};
    p.cargos.forEach(c=>body.push([{content:"Cargos",styles:{...G,fontStyle:"bold",cellPadding:P1}},{content:pdfTxt(c.nome),styles:{...G,fontStyle:"bold",cellPadding:P1}},{content:pcNum(c.h),styles:{halign:"center",cellPadding:P1}},{content:pdfTxt(pcProfNome(c.f)),styles:{cellPadding:P1}},{content:"",styles:{cellPadding:P1}},{content:tempos(+c.h||0),styles:{halign:"right",fontStyle:"italic",cellPadding:P1}}]));
    body.push([{content:"Total",colSpan:2,styles:{halign:"right",fontStyle:"bolditalic",cellPadding:P1,lineWidth:0}},{content:pcNum(pcH(p.cargos.map(c=>({h:c.h})))),styles:{halign:"right",fontStyle:"bolditalic",cellPadding:P1}},{content:"",colSpan:3,styles:{lineWidth:0,cellPadding:P1}}])}
  // cada disciplina é um bloco (cabeçalho + módulos + total): se não couber o cabeçalho e uma linha, passa para a página seguinte
  let y=TOP+.4;
  for(const B of blocos){if(y>297-24-(B.length>2?24:16)){doc.addPage();y=TOP+.4}
    doc.autoTable({startY:y,body:B,margin:{top:TOP,bottom:24,left:14,right:14},theme:"grid",
      styles:{font:"helvetica",fontSize:7.2,textColor:0,lineColor:[0,0,0],lineWidth:.2,cellPadding:PD,valign:"middle",overflow:"linebreak"},
      columnStyles:{0:{cellWidth:41},1:{cellWidth:47},2:{cellWidth:13},3:{cellWidth:34},4:{cellWidth:21},5:{cellWidth:26}}});
    y=doc.lastAutoTable.finalY}
  y+=4;if(y>297-24-46){doc.addPage();y=TOP+2}
  const tot0=pcH(p.linhas),fct=+(p.fct&&p.fct.horas)||0,fs=p.fct||{};
  const box=(x,w,rows,cw)=>{doc.autoTable({startY:y,body:rows,margin:{left:x,right:W-x-w,bottom:24},tableWidth:w,theme:"grid",
    styles:{font:"helvetica",fontSize:7,textColor:0,lineColor:[0,0,0],lineWidth:.2,cellPadding:{top:.6,bottom:.6,left:1,right:1}},columnStyles:{0:{halign:"right",fontStyle:"bold",cellWidth:cw}}});return doc.lastAutoTable.finalY};
  const y1=box(14,72,[["Formação em Contexto de Trabalho",pcNum(fct)],["Total de Horas",pcNum(tot0)],["Total de Horas Global",pcNum(tot0+fct)]],52);
  const y2=box(110,86,[["Número de Semanas de FCT",{content:fs.semanas?pcNum(fs.semanas):"",styles:{halign:"center"}}],["Número de Dias de FCT",{content:fs.dias?pcNum(fs.dias):"",styles:{halign:"center"}}],["Número de Semanas de Aulas",{content:SEM?pcNum(SEM):"",styles:{halign:"center",fillColor:[217,217,217]}}]],60);
  y=Math.max(y1,y2)+6;
  doc.setFont("helvetica","bold");doc.setFontSize(7.5);doc.text("Cidadania e Desenvolvimento",14,y+3);
  doc.setFont("helvetica","normal");doc.setFontSize(7);doc.text(pdfTxt("Componente desenvolvida com o contributo de disciplinas e componentes de formação."),14,y+6.6);
  doc.setDrawColor(0);doc.setLineWidth(.3);doc.line(124,y+5,196,y+5);doc.setFontSize(7.5);doc.text("(Diretor Pedagógico)",160,y+8.4,{align:"center"});
  return {ini,fim:doc.getNumberOfPages()}}
async function pdfPlano(todos){const a=anoAtivo(),E=escData();
  const TT=todos?E.turmas.filter(t=>pcDe(t.id)).sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod))):[E.turmas.find(x=>x.id===PC_T)].filter(t=>t&&pcDe(t.id));
  if(!TT.length){toast("Não há planos curriculares neste ano letivo");return}
  const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});
  const muitos=TT.length>3;if(muitos)ovAbrir("A preparar os Planos Curriculares");
  try{for(let i=0;i<TT.length;i++){if(i)doc.addPage();pdfPlanoSec(doc,TT[i],pcDe(TT[i].id),a);if(muitos)await ovPasso(3+85*(i+1)/TT.length,`Turma ${i+1} de ${TT.length}: ${TT[i].cod}`)}}finally{if(muitos)ovFechar(300)}
  const n=doc.getNumberOfPages();for(let pg=1;pg<=n;pg++){doc.setPage(pg);pdfOfLogos(doc,"Plano Curricular Detalhado",a);pdfDsdRodape(doc,pg,n)}
  doc.save(pdfTxt(todos?`Planos Curriculares ${a.nome.replace("/","-")} - todas as turmas.pdf`:`Plano Curricular ${TT[0].cod} ${a.nome.replace("/","-")}.pdf`))}
/* 0.9.31: DSD no formato da folha oficial da escola (cabeçalho com os dois logótipos e o título ao centro, tabela com grelha preta,
   totais da componente letiva/não letiva, código DSD_n.ano, projetos FSE, assinatura do Diretor Pedagógico, data da impressão e paginação) */
function dsdNum(id,M){const ord=cfg.profs.filter(p=>M.has(p.id)).sort((x,y)=>COLL_PTN.compare(String(x.cod||""),String(y.cod||""))||COLL_PT.compare(String(x.nome),String(y.nome))).map(p=>p.id);const i=ord.indexOf(id);return i<0?ord.length+1:i+1}
function pdfOfLogos(doc,titulo,a){const W=210,{main:m,right:r}=LOGOS;
  if(m){const[w,h]=lgFitArea(m,260,40,18);doc.addImage(m.src,lgFmt(m),14,19-h/2,w,h,"lgMain")}
  if(r){const[w,h]=lgFitArea(r,260,40,18);doc.addImage(r.src,lgFmt(r),W-14-w,19-h/2,w,h,"lgRight")}
  doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(12);
  [escData().nome||"Escola Profissional da Ilha de São Jorge","Ano Letivo "+a.nome,titulo].forEach((t,i)=>doc.text(pdfTxt(t),W/2,13+i*6,{align:"center"}))}
function pdfDsdCab(doc,a,p,areas,primeira){const W=210,{main:m,right:r}=LOGOS;
  if(m){const[w,h]=lgFitArea(m,260,40,18);doc.addImage(m.src,lgFmt(m),14,19-h/2,w,h,"lgMain")}
  if(r){const[w,h]=lgFitArea(r,260,40,18);doc.addImage(r.src,lgFmt(r),W-14-w,19-h/2,w,h,"lgRight")}
  doc.setTextColor(0);doc.setFont("helvetica","bold");doc.setFontSize(12);
  [escData().nome||"Escola Profissional da Ilha de São Jorge","Ano Letivo "+a.nome,"Distribuição de Serviço Docente"].forEach((t,i)=>doc.text(pdfTxt(t),W/2,13+i*6,{align:"center"}));
  const nome=pdfTxt(`${p.cod?p.cod+" - ":""}${p.nome}`);doc.setFontSize(8);
  if(primeira){doc.setFont("helvetica","normal");doc.text("Formador(a): ",62,33.5);const x=62+doc.getTextWidth("Formador(a): ");doc.setFont("helvetica","bold");doc.text(nome,x,33.5);
    const ar=pdfTxt(areas||"-");doc.text(ar,W-16,33.5,{align:"right"});const wa=doc.getTextWidth(ar);doc.setFont("helvetica","normal");doc.text("Área(s):",W-16-wa-1.2,33.5,{align:"right"})}
  else{doc.setFont("helvetica","normal");doc.text(nome,W/2+18,33.5)}}
function pdfDsdRodape(doc,pg,tot){const W=210,H=297,f=lgGet("foot");
  if(f){const[w,h]=lgFit(f,92,11);doc.addImage(f.src,lgFmt(f),(W-w)/2,H-14-h/2,w,h,"lgFoot")}
  doc.setTextColor(0);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("Data da Impressão: "+pdfData(),14,H-10);
  doc.setFontSize(10);doc.text(`${pg} de ${tot}`,W-14,H-10,{align:"right"})}
function pdfDsdSec(doc,id,M,a){const r=M.get(id),p=pcProf(id);if(!p)return null;
  const areas=r?[...r.areas].map(k=>PC_AREA_NOME[k]).join(", "):"",cod=`DSD_${dsdNum(id,M)}.${a.nome}`,ini=doc.getNumberOfPages(),TOP=40;
  const body=r?r.let.slice().sort(dsdOrd).map(x=>[dsdTurmaTxt(x.t),x.l.disc,x.l.mod,pcNum(x.l.h)].map(pdfTxt)):[];
  if(r&&r.nl.length)r.nl.slice().sort(dsdOrd).forEach(x=>body.push([x.t?dsdTurmaTxt(x.t):"-",x.t?"Cargo":"Componente não letiva",x.c.nome,pcNum(x.c.h)].map(pdfTxt)));
  if(!body.length)body.push([{content:"Sem serviço atribuído nos planos curriculares.",colSpan:4}]);
  const tot=(t,v,k)=>[{content:t,colSpan:3,styles:{fontStyle:"bolditalic",cellPadding:{top:1.3,bottom:1.3,left:1,right:1}},_k:k},{content:pcNum(v),styles:{fontStyle:"bolditalic",halign:"center",cellPadding:{top:1.3,bottom:1.3,left:1,right:1}}}];
  const hl=r?r.h:0,hn=r?r.hnl:0;
  body.push(tot("Componente Letiva",hl),tot("Componente Não Letiva",hn),tot("Total",hl+hn,"total"));
  doc.setFont("helvetica","italic");doc.setFontSize(8);doc.setTextColor(0);doc.text(pdfTxt(cod),14,TOP-1.2);
  let yTot=null,pgTot=null;
  doc.autoTable({startY:TOP,head:[["Curso","Disciplina","Módulos/UFCDs","Horas"]],body,margin:{top:TOP,bottom:24,left:14,right:14},theme:"grid",
    styles:{font:"helvetica",fontSize:7.4,textColor:0,lineColor:[0,0,0],lineWidth:.2,cellPadding:{top:3.6,bottom:3.6,left:1,right:1},valign:"middle",overflow:"linebreak"},
    headStyles:{fillColor:[217,217,217],textColor:0,fontStyle:"bold",fontSize:8,cellPadding:{top:1,bottom:1,left:1,right:1},lineWidth:.2},
    columnStyles:{0:{cellWidth:49},1:{cellWidth:66},2:{cellWidth:51},3:{cellWidth:16,halign:"center"}},
    didParseCell:d=>{if(d.section==="head"&&d.column.index===3)d.cell.styles.halign="center"},
    didDrawCell:d=>{if(d.section==="body"&&d.column.index===0&&d.row.raw&&d.row.raw[0]&&d.row.raw[0]._k==="total"){yTot=d.cell.y;pgTot=doc.getCurrentPageInfo().pageNumber}},
    didDrawPage:()=>{doc.setDrawColor(0);doc.setLineWidth(.6)}});
  if(yTot!=null){const cur=doc.getCurrentPageInfo().pageNumber;doc.setPage(pgTot);doc.setDrawColor(0);doc.setLineWidth(.7);doc.line(14,yTot,196,yTot);doc.setPage(cur)}
  let y=doc.lastAutoTable.finalY;doc.setDrawColor(0);doc.setLineWidth(.7);doc.line(14,y,196,y);
  if(y>297-24-34){doc.addPage();y=TOP}
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(pdfTxt(cod),196,y+4,{align:"right"});
  const fse=[...new Set((r?[...r.let,...r.nl]:[]).filter(x=>x.t).map(x=>String(x.t.fse||"").trim()).filter(Boolean))];
  doc.setFont("helvetica","italic");doc.setFontSize(8);fse.forEach((c,i)=>doc.text(pdfTxt(c),14,y+12+i*4.4));
  doc.setDrawColor(0);doc.setLineWidth(.3);doc.line(120,y+17,196,y+17);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.text("(Diretor Pedagógico)",158,y+20.5,{align:"center"});
  return {ini,fim:doc.getNumberOfPages(),p,areas,a}}
async function pdfDsd(todos){const a=anoAtivo(),M=dsdDados(a.id),J=await loadPDF(),doc=new J({unit:"mm",format:"a4"});
  const ids=todos?cfg.profs.filter(p=>M.has(p.id)).sort((x,y)=>COLL_PTN.compare(String(x.cod||""),String(y.cod||""))||COLL_PT.compare(String(x.nome),String(y.nome))).map(p=>p.id):[DSD_SEL];
  if(!ids.length||!ids[0]){toast("Não há formadores com serviço atribuído");return}
  const muitos=ids.length>5;if(muitos)ovAbrir("A preparar a Distribuição de Serviço Docente");
  try{const secs=[];for(let i=0;i<ids.length;i++){if(i)doc.addPage();const S=pdfDsdSec(doc,ids[i],M,a);if(S)secs.push(S);if(muitos&&i%8===0)await ovPasso(2+80*i/ids.length,`Formador ${i+1} de ${ids.length}`)}
    let k=0;for(const S of secs){for(let pg=S.ini;pg<=S.fim;pg++){doc.setPage(pg);pdfDsdCab(doc,S.a,S.p,S.areas,pg===S.ini);pdfDsdRodape(doc,pg-S.ini+1,S.fim-S.ini+1)}if(muitos&&++k%25===0)await ovPasso(82+15*k/secs.length,"A pôr cabeçalhos e rodapés…")}
    if(muitos)await ovPasso(99,"A guardar o PDF…")}finally{if(muitos)ovFechar(300)}
  const p=pcProf(ids[0]);doc.save(pdfTxt(todos?`DSD ${a.nome.replace("/","-")} - todos os formadores.pdf`:`${p?(p.cod?p.cod+" - ":"")+p.nome:"DSD"}.pdf`))}
$("#pcPdf").onclick=()=>pdfPlano(false).catch(e=>toast(e.message));
$("#pcPdfAll").onclick=()=>pdfPlano(true).catch(e=>toast(e.message));
$("#dsdPdf").onclick=()=>pdfDsd(false).catch(e=>toast(e.message));
$("#dsdPdfAll").onclick=()=>pdfDsd(true).catch(e=>toast(e.message));

