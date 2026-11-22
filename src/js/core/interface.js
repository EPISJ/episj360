/* ---------- interface ---------- */
let PSEL=null,PED=null,PFIL="todos";
const tagE=e=>`<span class="tag ${EST_P[e][1]}">${EST_P[e][0]}</span>`;
function quandoTxt(a){const d=+a.dias||0;let s=a.quando==="antes"?`${d} dia(s) antes do prazo`:a.quando==="depois"?`${d} dia(s) depois do prazo`:"no dia do prazo";
  if(+a.rep>0)s+=`, depois a cada ${a.rep} dia(s) (até ${a.max||1} vez(es))`;return s}
function avEstadoUI(){const el=$("#avEstado");if(!el)return;const A=avCfg();let h="";
  if(msCfg().clientId&&!MSAL){msInit().then(()=>avEstadoUI()).catch(()=>{})}
  if(!msCfg().clientId)h=`<div class="msg bad">Para os avisos saírem, ligue primeiro o Office 365 em <b>Definições</b>.</div>`;
  else if(!MSACC)h=`<div class="msg bad">O Office 365 está configurado mas não há sessão neste navegador. <a href="#" id="avMsIn">Entrar no Office 365</a></div>`;
  else h=`<div class="msg ${A.auto?"ok":"info"}">${A.auto?"Envio automático ligado":"Envio automático desligado"} — os emails saem de <b>${esc(MSACC.username)}</b>.${lastListing?` Última análise: ${esc(lastListing.quando)}.`:""}</div>`;
  const semE=[...new Set(prazos().filter(p=>p.ativo).flatMap(p=>prazoPorProf(prazoItens(p)).filter(g=>g.p.id!=="_"&&!g.p.email&&(g.c.falta||g.c.pendente)).map(g=>g.p.nome)))];
  if(semE.length)h+=`<div class="msg bad">Sem email registado (não recebem avisos): ${esc(semE.join(", "))} — acrescente-o em Formadores.</div>`;
  if(AVMSG)h+=`<div class="msg info">${esc(AVMSG)}</div>`;
  if(A.servidor)h=srvEstadoHTML()+h.replace(/Envio automático (ligado|desligado)/,"Envio a partir deste navegador desligado (usa o serviço)");
  el.innerHTML=h;const li=$("#avMsIn");if(li)li.onclick=async e=>{e.preventDefault();try{await msLoginPopup();avEstadoUI();correrAvisos()}catch(x){AVMSG=msErro(x);avEstadoUI()}}}
function renderProx(){const el=$("#avProx");if(!el)return;const agora=Date.now(),rows=[];
  for(const p of prazos()){if(!p.ativo)continue;
    for(const a of p.avisos||[]){if(!a.ativo)continue;const t=proxima(p,a,agora),o=ocorrenciaDevida(p,a,agora);
      if(o)rows.push({t:o.t,p,a,agora:true});if(t)rows.push({t,p,a})}}
  const dev=avisosDevidos(agora);rows.sort((a,b)=>a.t-b.t);
  if(!rows.length){el.innerHTML=`<p class="hint">Sem envios marcados.</p>`;return}
  el.innerHTML=`<table class="rt"><thead><tr><th>Quando</th><th>Prazo</th><th>Aviso</th><th>Para</th></tr></thead><tbody>${rows.slice(0,12).map(r=>{
    const n=r.agora?dev.filter(x=>x.a&&x.a.id===r.a.id).length:destinatarios(r.p,r.a,prazoItens(r.p)).length;
    return `<tr><td>${r.agora?`<span class="tag warn">na hora</span>`:esc(new Date(r.t).toLocaleString("pt-PT",{weekday:"short",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}))}</td><td>${esc(r.p.nome)}</td><td>${esc(r.a.nome)}</td><td>${r.agora?`${n} por enviar`:`${n} formador(es), se fosse hoje`}</td></tr>`}).join("")}</tbody></table>`}
function renderPrazos(){
  const A=avCfg();srvUI();if(A.servidor&&SES&&Date.now()-SRV.t>10*60e3){SRV.t=Date.now();srvEstado()}$("#avAuto").checked=!!A.auto;$("#avHora").value=A.hora||"09:00";$("#avPara").value=A.para||cfg.mail.relatorio_para||"";
  const P=prazos(),el=$("#praItens");
  el.innerHTML=P.length?P.map(p=>{const L=prazoItens(p),c=contar(L),inc=prazoPorProf(L).filter(g=>g.p.id!=="_"&&(g.c.falta||g.c.atraso||g.c.pendente)).length,fim=fimPrazo(p),dd=diasEntre(Date.now(),fim);
    const quando=isNaN(fim)?"sem data":dd>0?`faltam ${dd} dia(s)`:dd===0?"termina hoje":`terminou há ${-dd} dia(s)`;
    return `<div class="praItem"><div class="nm"><b>${esc(p.nome)}</b>${p.ativo?"":` <span class="tag">inativo</span>`}<small>até ${prazoPT(p)} · ${quando} · ${L.length} documento(s) · ${(p.avisos||[]).filter(a=>a.ativo).length} aviso(s)</small></div>
      <span class="tag ok">${c.prazo} no prazo</span>${c.atraso?`<span class="tag late">${c.atraso} fora do prazo</span>`:""}${c.falta?`<span class="tag bad">${c.falta} não entregue(s)</span>`:""}${c.pendente?`<span class="tag pend">${c.pendente} por entregar</span>`:""}
      <span class="hint" style="margin:0">${inc} formador(es) com pendências</span>
      <button class="b s" data-pver="${p.id}">Ver</button><button class="b s" data-ped="${p.id}">Editar</button></div>`}).join(""):`<p class="hint">Ainda não há prazos. Carregue em <b>+ Novo prazo</b>.</p>`;
  avEstadoUI();renderProx();
  if(PED){const p=P.find(x=>x.id===PED);if(p)renderEditor(p);else{PED=null;$("#praEd").style.display="none"}}
  if(PSEL){const p=P.find(x=>x.id===PSEL);if(p)renderRes(p);else{PSEL=null;$("#praRes").style.display="none"}}
}
function chipsHTML(list,sel,attr){const S=new Set(sel||[]);return list.map(([v,t])=>`<label class="chip${S.has(v)?" on":""}"><input type="checkbox" ${attr}="${esc(v)}"${S.has(v)?" checked":""}> ${esc(t)}</label>`).join("")}
function renderEditor(p){$("#praEd").style.display="";$("#praEdT").textContent="Prazo: "+(p.nome||"");
  const f=document.activeElement;
  if(f!==$("#peNome"))$("#peNome").value=p.nome||"";$("#peData").value=p.data||"";$("#peAtivo").checked=!!p.ativo;$("#peResumo").checked=!!p.resumo;
  if(f!==$("#peDisc"))$("#peDisc").value=p.disc||"";if(f!==$("#peMod"))$("#peMod").value=p.modq||"";
  $("#peDocs").innerHTML=chipsHTML(cfg.docTypes.map(d=>[d.id,d.nome]),p.docs,"data-pdoc");
  const tc={};for(const m of ativos())tc[tipoMod(m)]=(tc[tipoMod(m)]||0)+1;
  $("#peTipos").innerHTML=chipsHTML(TIPOS_MOD.map(([v,t])=>[v,`${t} (${tc[v]||0})`]),p.tipos,"data-ptipo");
  const turmas=[...new Set(ativos().map(m=>m.turma).filter(Boolean))].sort((a,b)=>COLL_PTN.compare(a,b));
  $("#peTurmas").innerHTML=turmas.length?chipsHTML(turmas.map(t=>[t,t]),p.turmas,"data-pturma"):`<span class="hint">Sem turmas — faça a análise e detete os módulos em Atribuições.</span>`;
  $("#peProfs").innerHTML=cfg.profs.length?chipsHTML(cfg.profs.slice().sort((a,b)=>COLL_PT.compare(a.nome,b.nome)).map(x=>[x.id,x.nome]),p.profs,"data-pprof"):`<span class="hint">Sem formadores registados.</span>`;
  const L=prazoItens(p),nm=new Set(L.map(x=>x.m.id)).size;
  $("#peCont").innerHTML=`Este prazo abrange <b>${L.length}</b> documento(s) em <b>${nm}</b> módulo(s)/UC/UFCD de <b>${new Set(L.map(x=>x.pid)).size}</b> formador(es).${L.length?"":" Confirme os filtros e se esses documentos estão pedidos nos módulos (Atribuições)."}`;
  const sem=L.filter(x=>x.aprox&&x.ent).length;if(sem)$("#peCont").innerHTML+=`<br>${sem} entrega(s) com data aproximada (análise anterior à v1.14). Para datas exatas, use “Ler tudo outra vez” em Análise.`;
  renderAvEd(p)}
function renderAvEd(p){const el=$("#peAvisos");const foc=document.activeElement,fk=foc&&foc.dataset&&foc.dataset.avf?foc.dataset.avf+"|"+foc.closest("[data-av]").dataset.av:null;
  if(fk)return; // não redesenha enquanto escreve
  el.innerHTML=(p.avisos||[]).map((a,ix)=>`<div class="avBox" data-av="${a.id}">
    <div class="row"><label class="chip" style="align-self:flex-end"><input type="checkbox" data-avf="ativo"${a.ativo?" checked":""}> ativo</label>
      <label class="grow">Nome do aviso ${ix+1}<input type="text" data-avf="nome" value="${esc(a.nome)}"></label>
      <button class="b s" data-avdel="${a.id}" style="align-self:flex-end">Remover</button></div>
    <div class="row" style="margin-top:8px">
      <label style="width:175px">Quando<select data-avf="quando"><option value="antes"${a.quando==="antes"?" selected":""}>antes do prazo</option><option value="dia"${a.quando==="dia"?" selected":""}>no dia do prazo</option><option value="depois"${a.quando==="depois"?" selected":""}>depois do prazo</option></select></label>
      <label style="width:110px">N.º de dias<input type="number" min="0" max="120" data-avf="dias" value="${+a.dias||0}"${a.quando==="dia"?" disabled":""}></label>
      <label style="width:150px">Repetir a cada<select data-avf="rep">${[0,1,2,3,5,7,10,14,21,30].map(v=>`<option value="${v}"${+a.rep===v?" selected":""}>${v?v+" dia(s)":"não repetir"}</option>`).join("")}</select></label>
      <label style="width:110px">Máx. de envios<input type="number" min="1" max="52" data-avf="max" value="${+a.max||1}"${+a.rep?"":" disabled"}></label>
      <label class="grow">Para quem<select data-avf="dest"><option value="falta"${a.dest!=="incumpriu"?" selected":""}>quem ainda não entregou</option><option value="incumpriu"${a.dest==="incumpriu"?" selected":""}>quem não cumpriu o prazo (inclui entregas atrasadas)</option></select></label>
    </div>
    <p class="hint" style="margin:6px 0">${esc(quandoTxt(a))}${ocorrencias(p,a).length?" · "+ocorrencias(p,a).map(t=>new Date(t).toLocaleDateString("pt-PT",{day:"2-digit",month:"2-digit"})).join(", "):""}</p>
    <label>Assunto<input type="text" data-avf="subj" value="${esc(a.subj)}"></label>
    <label style="margin-top:6px;display:block">Mensagem<textarea data-avf="body">${esc(a.body)}</textarea></label>
    <div class="row" style="margin-top:6px"><button class="b s" data-avprev="${a.id}">Pré-visualizar</button></div>
    <div class="mailbox" data-avout="${a.id}" style="display:none;max-height:300px;overflow:auto"></div>
  </div>`).join("");
  $("#peAddAv").disabled=(p.avisos||[]).length>=AV_MAX}
function renderRes(p){$("#praRes").style.display="";const agora=Date.now(),L=prazoItens(p,agora),c=contar(L),fim=fimPrazo(p);
  $("#prT").textContent=`${p.nome} — até ${prazoPT(p)}`;
  const G=prazoPorProf(L);
  $("#prKpi").innerHTML=`<div class="k-ok"><b>${c.prazo}</b><span>entregues no prazo</span></div><div class="k-late"><b>${c.atraso}</b><span>entregues fora do prazo</span></div>`+
    (agora>fim?`<div class="k-miss"><b>${c.falta}</b><span>não entregues</span></div>`:`<div class="k-pend"><b>${c.pendente}</b><span>ainda por entregar</span></div>`)+
    `<div><b>${G.filter(g=>g.p.id!=="_"&&g.inc).length}</b><span>formador(es) não cumpriram</span></div>`;
  $("#prData").innerHTML=lastListing?`<p class="hint" style="margin:4px 0">Conforme a análise de ${esc(lastListing.quando)}.${analiseFresca()?"":" <b>Atualize a análise</b> em Análise para ver as entregas mais recentes."}</p>`:"";
  const F=[["todos","Todos"],["inc","Não cumpriram"],["falta",agora>fim?"Não entregues":"Por entregar"],["atraso","Fora do prazo"],["prazo","No prazo"]];
  $("#prFil").innerHTML=F.map(([k,t])=>`<label class="chip${PFIL===k?" on":""}"><input type="radio" name="prf" value="${k}"${PFIL===k?" checked":""}> ${t}</label>`).join("");
  const q=norm($("#prQ").value),passa=x=>(PFIL==="todos"||(PFIL==="inc"?(x.est==="falta"||x.est==="atraso"||x.est==="pendente"):PFIL==="falta"?(x.est==="falta"||x.est==="pendente"):x.est===PFIL))&&
    (!q||norm([x.m.turma,x.m.disc,modTitle(x.m),itemNome(x.i),(cfg.profs.find(y=>y.id===x.pid)||{}).nome].join(" ")).includes(q));
  const blocos=G.map(g=>({...g,v:g.it.filter(passa)})).filter(g=>g.v.length);
  $("#prTab").innerHTML=blocos.length?blocos.map(g=>`<div class="prProf"><div><span style="flex:1">${esc(g.p.nome)}${g.p.email?` <span class="hint" style="font-weight:400;margin:0">&lt;${esc(g.p.email)}&gt;</span>`:""}</span>
      ${g.c.prazo?`<span class="tag ok">${g.c.prazo} no prazo</span>`:""}${g.c.atraso?`<span class="tag late">${g.c.atraso} fora do prazo</span>`:""}${g.c.falta?`<span class="tag bad">${g.c.falta} não entregue(s)</span>`:""}${g.c.pendente?`<span class="tag pend">${g.c.pendente} por entregar</span>`:""}</div>
    <table><thead><tr><th>Turma</th><th>Disciplina</th><th>Módulo / UC / UFCD</th><th>Pasta</th><th>Estado</th><th>Entregue em</th></tr></thead><tbody>${g.v.map(x=>`<tr><td>${esc(x.m.turma)}</td><td>${esc(discShort(x.m.disc))}</td><td>${esc(modTitle(x.m))}</td><td>${esc(itemNome(x.i))}</td><td>${tagE(x.est)}${x.i.state==="blank"?` <span class="hint" style="margin:0">(ficheiro não conta)</span>`:""}</td><td>${x.ent?esc((x.aprox?"≈ ":"")+new Date(x.ent).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))+(x.est==="atraso"?` <b style="color:#b45309">+${x.atraso} d</b>`:""):x.est==="falta"?`<b style="color:var(--bad)">${x.atraso} d de atraso</b>`:"—"}</td></tr>`).join("")}</tbody></table></div>`).join(""):`<p class="hint">Nada a mostrar com este filtro.</p>`;
  $("#prAv").innerHTML=(p.avisos||[]).map(a=>`<option value="${a.id}">${esc(a.nome)}</option>`).join("")+(p.resumo?`<option value="resumo">Resumo para mim (direção)</option>`:"");
  const LG=AVL.filter(x=>x.prazo===p.id).slice(-60).reverse();
  $("#prLog").innerHTML=LG.length?`<table class="rt"><thead><tr><th>Data</th><th>Aviso</th><th>Formador</th><th>Itens</th><th>Resultado</th></tr></thead><tbody>${LG.map(x=>{const a=(p.avisos||[]).find(y=>y.id===x.aviso);
    return `<tr><td>${esc(new Date(x.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}</td><td>${esc(x.aviso==="resumo"?"Resumo":a?a.nome:"(aviso removido)")}${x.manual?" · manual":x.servidor?" · serviço de avisos":" · automático"}</td><td>${esc(x.nome||"")}</td><td>${x.n||""}</td><td>${x.ok?`<span class="tag ok">enviado</span>`:`<span class="tag bad">falhou</span> ${esc(x.err||"")}`}</td></tr>`}).join("")}</tbody></table>`:`<p class="hint">Ainda não foi enviado nenhum aviso deste prazo.</p>`}
function prazoCSV(p){const L=prazoItens(p),qq=v=>`"${String(v??"").replace(/"/g,'""')}"`;
  const h=["Formador","Email","Turma","Disciplina","Módulo/UC/UFCD","Documento","Estado","Entregue em","Dias de atraso"];
  return [h.map(qq).join(";"),...L.map(x=>{const p2=cfg.profs.find(y=>y.id===x.pid)||{nome:"(sem formador)",email:""};
    return [p2.nome,p2.email,x.m.turma,discShort(x.m.disc),modTitle(x.m),itemNome(x.i),EST_P[x.est][0],x.ent?new Date(x.ent).toLocaleString("pt-PT"):"",x.atraso||""].map(qq).join(";")})].join("\n")}
const prCur=()=>prazos().find(x=>x.id===PSEL);
const pedCur=()=>prazos().find(x=>x.id===PED);
function prMsg(h,k){$("#prMsg").innerHTML=h?`<div class="msg ${k||"ok"}">${h}</div>`:""}

$("#praNovo").onclick=()=>{const p=novoPrazo();prazos().push(p);save();PED=p.id;PSEL=p.id;renderPrazos();$("#praEd").scrollIntoView({behavior:"smooth"})};
$("#praItens").addEventListener("click",e=>{const v=e.target.closest("[data-pver]"),d=e.target.closest("[data-ped]");
  if(v){PSEL=v.dataset.pver;renderPrazos();$("#praRes").scrollIntoView({behavior:"smooth"})}
  if(d){PED=d.dataset.ped;PSEL=PSEL||PED;renderPrazos();$("#praEd").scrollIntoView({behavior:"smooth"})}});
$("#avAuto").onchange=e=>{const A=avCfg();
  if(e.target.checked&&!confirm("Ligar o envio automático?\n\nSempre que a Box360 estiver aberta, os avisos que estiverem na hora saem sozinhos pelo Office 365, para quem tiver documentos em falta.")){e.target.checked=false;return}
  A.auto=e.target.checked;save();avEstadoUI();if(A.auto)correrAvisos()};
$("#avHora").onchange=e=>{avCfg().hora=e.target.value||"09:00";save();renderPrazos()};
$("#avPara").onchange=e=>{avCfg().para=e.target.value.trim();save()};
$("#avAgora").onclick=async e=>{const btn=e.currentTarget;
  if(!analiseFresca()&&!confirm("A análise tem mais de 3 horas — pode haver entregas recentes que a app ainda não viu. Enviar mesmo assim?\n\n(Para atualizar primeiro: Análise › Analisar.)"))return;
  await avTrazerNuvem();const lista=avisosDevidos();if(!lista.length){AVMSG="Não há avisos na hora para enviar.";avEstadoUI();return}
  if(!confirm(`Enviar agora ${lista.length} email(s)?\n\n`+lista.slice(0,15).map(x=>x.resumo?`• Resumo para ${x.para}`:`• ${x.a.nome} → ${x.g.p.nome} (${x.g.alvo.length})`).join("\n")+(lista.length>15?"\n…":"")))return;
  btn.disabled=true;try{await msToken()}catch(x){AVMSG=msErro(x);avEstadoUI();btn.disabled=false;return}
  AVBUSY=true;try{const r=await enviarLista(lista,true,(i,n)=>{AVMSG=`A enviar ${i} de ${n}…`;avEstadoUI()});AVMSG=`${r.n} email(s) enviado(s).`+(r.falhas.length?` Não enviados: ${r.falhas.join("; ")}`:"")}
  finally{AVBUSY=false;btn.disabled=false;renderPrazos()}};
// editor
const pedSet=(fn,redraw)=>{const p=pedCur();if(!p)return;fn(p);save();if(redraw!==false)renderPrazos()};
$("#peNome").addEventListener("input",e=>pedSet(p=>p.nome=e.target.value,false));
$("#peNome").addEventListener("change",()=>renderPrazos());
$("#peData").onchange=e=>pedSet(p=>p.data=e.target.value);
$("#peAtivo").onchange=e=>pedSet(p=>p.ativo=e.target.checked);
$("#peResumo").onchange=e=>pedSet(p=>p.resumo=e.target.checked);
$("#peDisc").addEventListener("change",e=>pedSet(p=>p.disc=e.target.value));
$("#peMod").addEventListener("change",e=>pedSet(p=>p.modq=e.target.value));
const togg=(arr,v,on)=>{const s=new Set(arr||[]);on?s.add(v):s.delete(v);return[...s]};
$("#praEd").addEventListener("change",e=>{const t=e.target;
  if(t.dataset.pdoc)pedSet(p=>p.docs=togg(p.docs,t.dataset.pdoc,t.checked));
  else if(t.dataset.ptipo)pedSet(p=>p.tipos=togg(p.tipos,t.dataset.ptipo,t.checked));
  else if(t.dataset.pturma)pedSet(p=>p.turmas=togg(p.turmas,t.dataset.pturma,t.checked));
  else if(t.dataset.pprof)pedSet(p=>p.profs=togg(p.profs,t.dataset.pprof,t.checked));
  else if(t.dataset.avf){const id=t.closest("[data-av]").dataset.av,f=t.dataset.avf;
    pedSet(p=>{const a=p.avisos.find(x=>x.id===id);if(!a)return;a[f]=t.type==="checkbox"?t.checked:["dias","rep","max"].includes(f)?Math.max(0,+t.value||0):t.value;if(f==="max")a.max=Math.max(1,a.max)},false);
    t.blur&&["quando","rep","ativo","dest","dias","max"].includes(f)&&(t.blur(),renderPrazos())}});
$("#peAvisos").addEventListener("input",e=>{const t=e.target;if(!t.dataset.avf||!["nome","subj","body"].includes(t.dataset.avf))return;
  const id=t.closest("[data-av]").dataset.av;pedSet(p=>{const a=p.avisos.find(x=>x.id===id);if(a)a[t.dataset.avf]=t.value},false)});
$("#peAvisos").addEventListener("focusout",()=>setTimeout(()=>{if(!document.activeElement||!document.activeElement.dataset||!document.activeElement.dataset.avf)renderPrazos()},50));
$("#peAvisos").addEventListener("click",e=>{const d=e.target.closest("[data-avdel]"),pv=e.target.closest("[data-avprev]");
  if(d){if(!confirm("Remover este aviso?"))return;pedSet(p=>p.avisos=p.avisos.filter(a=>a.id!==d.dataset.avdel))}
  if(pv){const p=pedCur(),a=p&&p.avisos.find(x=>x.id===pv.dataset.avprev),out=document.querySelector(`[data-avout="${pv.dataset.avprev}"]`);if(!a)return;
    const D=destinatarios(p,a,prazoItens(p));let g=D[0];
    if(!g){const any=prazoPorProf(prazoItens(p)).find(x=>x.p.id!=="_");g=any?{...any,alvo:any.it.slice(0,3)}:{p:{nome:"Maria Exemplo",email:""},alvo:[]}}
    out.style.display=out.style.display==="none"?"":"none";
    out.textContent=`${D.length} formador(es) receberiam este aviso se saísse agora.${D[0]?"":" (Exemplo com dados fictícios: ninguém está nesta situação agora.)"}\n\nPara: ${g.p.email||"(sem email)"}\nAssunto: ${preencherAviso(a.subj,p,a,g)}\n\n${preencherAviso(a.body,p,a,g)}`}});
$("#peAddAv").onclick=()=>pedSet(p=>{if((p.avisos||[]).length>=AV_MAX)return;const t=AVISO_TPL[Math.min(p.avisos.length,2)];p.avisos.push({id:uid(),ativo:true,...t,nome:"Novo aviso"})});
$("#peDel").onclick=()=>{const p=pedCur();if(!p||!confirm(`Apagar o prazo “${p.nome}” e os seus avisos?`))return;cfg.prazos=prazos().filter(x=>x.id!==p.id);save();PED=null;if(PSEL===p.id)PSEL=null;$("#praEd").style.display="none";renderPrazos()};
$("#peFechar").onclick=()=>{PED=null;$("#praEd").style.display="none";renderPrazos();if(PSEL)$("#praRes").scrollIntoView({behavior:"smooth"})};
// resultados
$("#prFil").addEventListener("change",e=>{if(e.target.name==="prf"){PFIL=e.target.value;const p=prCur();if(p)renderRes(p)}});
$("#prQ").addEventListener("input",debounce(()=>{const p=prCur();if(p)renderRes(p)},150));
$("#prCsv").onclick=()=>{const p=prCur();if(p)download(`prazo_${norm(p.nome).replace(/[^a-z0-9]+/g,"_")}_${hoje()}.csv`,"﻿"+prazoCSV(p),"text/csv;charset=utf-8")};
$("#prCopy").onclick=()=>{const p=prCur();if(p)copy(resumoTexto(p))};
$("#prSend").onclick=async e=>{const p=prCur();if(!p)return;const id=$("#prAv").value,agora=Date.now();let lista;
  if(id==="resumo"){const para=(avCfg().para||cfg.mail.relatorio_para||"").trim();if(!para){prMsg("Indique em “Resumo dos incumprimentos para” o seu email.","bad");return}
    lista=[{p,resumo:true,para,k:p.id+"|resumo|m"+agora}]}
  else{const a=p.avisos.find(x=>x.id===id);if(!a)return;lista=destinatarios(p,a,prazoItens(p,agora)).map(g=>({p,a,g,k:p.id+"|"+a.id+"|"+g.p.id+"|m"+agora}))}
  if(!lista.length){prMsg("Ninguém está nessa situação neste momento — não há nada a enviar.","ok");return}
  if(!confirm(`Enviar agora ${lista.length} email(s)?\n\n`+lista.slice(0,20).map(x=>x.resumo?"• Resumo para "+x.para:`• ${x.g.p.nome} (${x.g.alvo.length} documento(s))${x.g.p.email?"":" — SEM EMAIL"}`).join("\n")))return;
  const btn=e.currentTarget;btn.disabled=true;try{await msToken()}catch(x){prMsg(esc(msErro(x)),"bad");btn.disabled=false;return}
  try{const r=await enviarLista(lista,true,(i,n,x)=>prMsg(`A enviar ${i} de ${n}${x.g?": "+esc(x.g.p.nome):""}…`,"info"));
    prMsg(`${r.n} email(s) enviado(s).${r.falhas.length?`<br><b>Não enviados:</b><br>${r.falhas.map(esc).join("<br>")}`:""}`,r.falhas.length?"bad":"ok")}
  finally{btn.disabled=false;renderRes(p);renderProx()}};



/* ---------- serviço de avisos na Cloudflare: envia com o computador desligado (v1.17) ---------- */
const AVISOS_WORKER="https://boxcheck-avisos.joel-cunha83.workers.dev";
const srvUrl=()=>String(avCfg().url||AVISOS_WORKER).trim().replace(/\/+$/,"");
let SRV={estado:null,box:"",erro:"",t:0,enviado:0},srvH=null,srvJaLigado=false;
function planoAvisos(){
  const A=avCfg(),idx=getIdx(),L=lastListing||{itens:[]},fmap=new Map(),fpai=new Map(),fich=new Map();
  for(const x of L.itens||[]){if(x.type==="folder"){fmap.set(x.path.split("/").map(s=>s.trim()).filter(Boolean).join("/"),x.id);fpai.set(x.id,x.pid)}else fich.set(x.id,x.pid)}
  const cadeia=id=>{const out=[];let c=id;for(let i=0;c&&i<20;i++){out.push(c);c=fpai.get(c)}return out};
  const itens={},prz=[],[h,mi]=horaEnvio();
  for(const p of prazos()){if(!p.ativo||!pd(p.data))continue;const ks=[];
    for(const x of prazoItens(p)){const k=x.i.key;ks.push(k);if(itens[k])continue;const d=x.i.doc,sub=segs(d.subpasta),ms=segs(x.m.pasta);
      const ids=new Set(idx.pick(ms.concat(sub),"folders").map(r=>fmap.get(r.r.join("/"))).filter(Boolean));
      const roots=[...ids].filter(id=>!ids.has(fpai.get(id)));
      itens[k]={prof:x.pid,need:Math.max(1,d.min||1),kws:splitList(d.palavras),exts:splitList(d.ext),roots,
        files:(x.i.hits||[]).filter(f=>f.fid).map(f=>({id:f.fid,ca:f.ca||f.date||"",nm:f.name,pids:cadeia(fich.get(f.fid))})),
        bad:(x.i.q||[]).filter(y=>y.q&&y.q.lvl==="bad").map(y=>y.f.fid).filter(Boolean),
        linha:`• ${x.m.turma} | ${discShort(x.m.disc)} | ${modTitle(x.m)} → ${d.nome}`,loc:x.i.loc||""}}
    const docs=[],dd=pd(p.data);
    prz.push({id:p.id,nome:p.nome,prazoPT:prazoPT(p),fim:fimPrazo(p),documentos:docs.length?docs.join(", ").replace(/, ([^,]*)$/," e $1").toLowerCase():"a documentação pedida",
      resumo:!!p.resumo,para:(A.para||cfg.mail.relatorio_para||"").trim(),resumoT:new Date(dd[0],dd[1],dd[2]+1,h,mi).getTime(),itens:ks,
      avisos:(p.avisos||[]).map(a=>({id:a.id,nome:a.nome,ativo:!!a.ativo,dest:a.dest||"falta",quando:a.quando,subj:a.subj,body:a.body,occ:ocorrencias(p,a)}))})}
  return{v:1,t:Date.now(),servidor:!!A.servidor,tz:Intl.DateTimeFormat().resolvedOptions().timeZone||"Atlantic/Azores",pos:L.pos||null,rootId:L.rootId||"",ano:anoLetivo(),
    from:(A.remetente||(MSACC&&MSACC.username)||"").trim(),cc:msCfg().cc||"",profs:cfg.profs.map(p=>({id:p.id,nome:p.nome,email:p.email||""})),itens,prazos:prz,
    log:AVL.filter(x=>x.ok&&!x.servidor).slice(-1500)}}
async function srvPedido(caminho,corpo){const w=srvUrl();if(!SES)throw new Error("Entre com a Box primeiro.");
  buConta("av"); // o serviço confirma a conta junto da Box (1 pedido)
  let r;try{r=await fetch(w+caminho,{method:corpo?"POST":"GET",headers:{Authorization:"Bearer "+await accessToken(),...(corpo?{"Content-Type":"application/json"}:{})},body:corpo?JSON.stringify(corpo):undefined})}
  catch(e){throw new Error("Não foi possível contactar o serviço de avisos ("+w+"). Já o criou na Cloudflare?")}
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.erro||("o serviço respondeu "+r.status));return j}
function srvGuardarResposta(j){SRV.estado=j.estado||null;SRV.box=j.box||"";SRV.erro="";SRV.t=Date.now();if(j.log&&avJuntar(j.log)&&curTab==="pra")renderPrazos()}
// 0.9.113: o plano só é enviado ao serviço de avisos quando muda (ou uma vez a cada 12 horas); antes ia de 20 em 20 minutos
function planoHash(o){const x=Object.assign({},o);delete x.t;const t=JSON.stringify(x);let h=5381;for(let i=0;i<t.length;i++)h=(h*33+t.charCodeAt(i))|0;return t.length+":"+h}
async function enviarPlano(forcar){const A=avCfg();if(!A.servidor&&!srvJaLigado)return;if(!lastListing||lastListing.local)return; // 0.9.115: análise das pastas do computador não serve para o serviço
  const pl=planoAvisos(),h=planoHash(pl);let ant=null;try{ant=JSON.parse(localStorage.getItem("g360_plano_h")||"null")}catch(e){}
  if(!forcar&&ant&&ant.h===h&&Date.now()-ant.t<12*3600e3)return;
  try{const j=await srvPedido("/plano",pl);srvGuardarResposta(j);SRV.enviado=Date.now();srvJaLigado=!!A.servidor;try{localStorage.setItem("g360_plano_h",JSON.stringify({h,t:Date.now()}))}catch(e){}}
  catch(e){SRV.erro=e.message}finally{avEstadoUI()}}
function agendarPlano(){const A=avCfg();if(!A.servidor&&!srvJaLigado)return;clearTimeout(srvH);srvH=setTimeout(enviarPlano,15000)}
async function srvEstado(){try{srvGuardarResposta(await srvPedido("/estado"))}catch(e){SRV.erro=e.message}avEstadoUI()}
function srvEstadoHTML(){const A=avCfg();if(!A.servidor)return "";
  if(SRV.erro)return `<div class="msg bad">Serviço de avisos: ${esc(SRV.erro)}</div>`;
  const e=SRV.estado;if(!e)return `<div class="msg info">Serviço de avisos ligado — a confirmar o estado…</div>`;
  const hm=t=>t?new Date(t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}):"nunca";
  return `<div class="msg ${e.erro?"bad":"ok"}">${ico("cloud")} Os avisos saem pelo <b>serviço de avisos</b>, de hora a hora, mesmo com o computador desligado (Box: ${esc(SRV.box)}). Última verificação: ${hm(e.ultimo)} · plano recebido: ${hm(e.planoT)}${e.porEnviar?` · ${e.porEnviar} por enviar na próxima hora`:""}${e.erro?`<br>${esc(e.erro)}`:""}</div>`}

$("#srvUrl").placeholder=AVISOS_WORKER;
function srvUI(){const A=avCfg();$("#srvOn").checked=!!A.servidor;if(document.activeElement!==$("#srvUrl"))$("#srvUrl").value=A.url||"";if(document.activeElement!==$("#srvFrom"))$("#srvFrom").value=A.remetente||"";$("#srvFrom").placeholder=(MSACC&&MSACC.username)||"direcao@escola.pt";$("#srvLigar").href=srvUrl()+"/ligar"}
$("#srvOn").onchange=async e=>{const A=avCfg();
  if(e.target.checked){if(!(A.remetente||(MSACC&&MSACC.username))){toast("Indique o email de onde saem os avisos");e.target.checked=false;$("#srvFrom").focus();return}
    if(!confirm("Passar a enviar os avisos pelo serviço de avisos (Cloudflare)?\n\nOs avisos saem de hora a hora mesmo com o computador desligado. Este navegador deixa de os enviar."))
      {e.target.checked=false;return}}
  A.servidor=e.target.checked;save();srvJaLigado=true;await enviarPlano();if(!A.servidor)srvJaLigado=false;renderPrazos()};
$("#srvUrl").onchange=e=>{avCfg().url=e.target.value.trim();save();srvUI()};
$("#srvFrom").onchange=e=>{avCfg().remetente=e.target.value.trim();save()};
$("#srvTest").onclick=async e=>{e.currentTarget.disabled=true;srvJaLigado=true;try{await enviarPlano(true);if(!SRV.erro)await srvEstado();toast(SRV.erro?"Serviço de avisos: erro":"Plano enviado ao serviço de avisos")}finally{e.currentTarget.disabled=false;if(!avCfg().servidor)srvJaLigado=false}};

/* ---------- tamanho da letra (+/−), guardado neste navegador ---------- */
const FSZ=[80,90,100,110,120,130,140,150,165,180];
let fsz=(()=>{const v=+lsJ("boxcheck_letra",100);return FSZ.includes(v)?v:100})();
function aplicarLetra(){document.body.style.zoom=fsz===100?"":String(fsz/100);setTimeout(()=>{try{document.querySelectorAll(".wg-grid").forEach(wgArrumar)}catch(e){}},30);$("#fszVal").textContent=fsz+"%";
  $("#fszMenos").disabled=fsz===FSZ[0];$("#fszMais").disabled=fsz===FSZ[FSZ.length-1];try{localStorage.setItem("boxcheck_letra",String(fsz))}catch(e){}
  if(typeof curTab!=="undefined"&&curTab==="est")setTimeout(()=>{try{linhaTempo($("#eTime"))}catch(e){}},50)}
$("#fszMais").onclick=()=>{const i=FSZ.indexOf(fsz);if(i<FSZ.length-1){fsz=FSZ[i+1];aplicarLetra()}};
$("#fszMenos").onclick=()=>{const i=FSZ.indexOf(fsz);if(i>0){fsz=FSZ[i-1];aplicarLetra()}};
$("#fszVal").onclick=()=>{fsz=100;aplicarLetra()};
addEventListener("keydown",e=>{if(!(e.ctrlKey||e.metaKey)||!e.altKey)return;if(e.key==="+"||e.key==="="){e.preventDefault();$("#fszMais").click()}else if(e.key==="-"){e.preventDefault();$("#fszMenos").click()}else if(e.key==="0"){e.preventDefault();$("#fszVal").click()}});
aplicarLetra();

/* ---------- init ---------- */
try{localStorage.removeItem("box_skip")}catch(e){}
qualInit();renderAll();renderRP();renderEnvios();renderAnalises();
$("#gTo").value=cfg.mail.relatorio_para||"";

