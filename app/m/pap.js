/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.141 — ecrã do módulo «pap», carregado quando é aberto */
"use strict";
// ===== src/js/pap/pap.js =====
/* PAP360 — ecrã do módulo (carregado só quando o PAP360 é aberto; os dados estão em pap/pap-dados.js) */
// ---------- desenho ----------
const PAP_ICO={doc:'<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>',grad:'<svg viewBox="0 0 24 24"><path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',tel:'<svg viewBox="0 0 24 24"><circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/></svg>'};
const papVz=(ic,t)=>`<div class="pp-vz"><i>${PAP_ICO[ic]||PAP_ICO.doc}</i><div>${t}</div></div>`;
function papRender(t){papCarregar().then(()=>{try{
  document.querySelectorAll("[data-papdir]").forEach(x=>{if(x.tagName==="FORM")x.querySelectorAll("input,button").forEach(y=>y.disabled=!papEd());else x.disabled=!papEd()});
  papSelOpcoes();
  if(t==="papInicio")papInicio();else if(t==="papProva")papProvaUI();else if(t==="papGrelha")papGrelhaUI();else if(t==="papDocs")papDocsUI();else if(t==="papJuri")papJuriUI();else if(t==="papDef")papDefUI()}
  catch(e){console.warn("PAP360",e)}})}
function papSelOpcoes(){const P=papProva(),E=escData(),anos=anosOrd().reverse();
  const h=PAP.provas.length?anos.map(a=>{const L=PAP.provas.filter(p=>p.anoId===a.id).sort((x,y)=>COLL_PTN.compare(papNome(x),papNome(y)));return L.length?`<optgroup label="${esc(a.nome)}">${L.map(p=>`<option value="${p.id}"${P&&p.id===P.id?" selected":""}>${esc(papNome(p))}</option>`).join("")}</optgroup>`:""}).join("")
    +PAP.provas.filter(p=>!E.anos.some(a=>a.id===p.anoId)).map(p=>`<option value="${p.id}"${P&&p.id===P.id?" selected":""}>${esc(papNome(p))}</option>`).join(""):`<option value="">— ainda sem provas —</option>`;
  document.querySelectorAll("[data-papsel]").forEach(s=>s.innerHTML=h)}
function papSemProva(el){$(el).innerHTML=papVz("grad",`Ainda não há provas. <a href="#" data-papir="papInicio">Crie uma prova</a> ou importe uma grelha do Excel.`)}
// ----- Provas (início) -----
function papInicio(){const a=papAnoSel(),E=escData(),L=PAP.provas.filter(p=>p.anoId===a.id).sort((x,y)=>COLL_PTN.compare(papNome(x),papNome(y)));
  const C=L.flatMap(papInc),fin=C.map(papFinal).filter(x=>x!==null),apr=fin.filter(x=>x>=10).length,datas=C.map(c=>c.data).filter(Boolean).sort();
  const pct=C.length?Math.round(fin.length/C.length*100):0,hj=calHoje(),prox=datas.find(d=>d>=hj);
  const anosC=new Set(PAP.provas.map(p=>p.anoId));anosC.add(anoAtivo().id);
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  $("#papHero").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Provas de Aptidão Profissional</h1><div class="sub">Ano letivo <select id="papAno">${anosOrd().reverse().filter(x=>anosC.has(x.id)).map(x=>`<option value="${x.id}"${x.id===a.id?" selected":""}>${esc(x.nome)}</option>`).join("")}</select> · ${L.length} prova${L.length===1?"":"s"}</div></div><span class="grow"></span>
    ${C.length?`<div class="ay-pct"><b>${pct}%</b>${fin.length} de ${C.length} grelhas completas</div>`:""}</div>
    <div class="ay-stats">${st("Formandos a apresentar",C.length,L.length?`em ${L.length} prova${L.length===1?"":"s"}`:"")}${st("Grelhas completas",`${fin.length}/${C.length}`)}${st("Aprovados",apr,fin.length?`${fin.length-apr} não aprovado${fin.length-apr===1?"":"s"}`:"")}${st("Média das classificações",fin.length?papFmt(fin.reduce((s,x)=>s+x,0)/fin.length,1):"—",fin.length?"valores":"")}${st("Próxima apresentação",prox?calDM(prox,{day:"numeric",month:"short"}):"—",datas.length?`${calDM(datas[0])} a ${calDM(datas[datas.length-1])}`:"sem datas marcadas")}</div></div>`;
  $("#papAno").onchange=e=>{PAP_SEL.ano=e.target.value;PAP_SEL.prova="";papRender("papInicio")};
  // nova prova
  if(PAP_NOVA&&papEd()){const T=turmasDoAno(a).slice().sort((x,y)=>((y.anoFim===a.ini+1)-(x.anoFim===a.ini+1))||COLL_PTN.compare(String(x.cod),String(y.cod)));
    $("#papNovaBox").innerHTML=`<div class="pp-box"><h3>Nova prova</h3><div class="pp-form">
      <label>Ano letivo<select id="papNAno">${anosOrd().reverse().map(x=>`<option value="${x.id}"${x.id===a.id?" selected":""}>${esc(x.nome)}</option>`).join("")}</select></label>
      <label class="w2">Turma<select id="papNTur"><option value="">— sem turma (escrever o curso à mão) —</option>${T.map(t=>`<option value="${t.id}">${esc(t.cod)} · ${esc(turmaNome(t))}${t.anoFim===a.ini+1?" — finalistas":""}</option>`).join("")}</select></label>
      <label>Fase<select id="papNFase"><option value="1">1.ª fase</option><option value="2">2.ª fase</option><option value="3">3.ª fase</option><option value="esp">Época especial</option></select></label></div>
      <p class="hint" style="margin:8px 0 0">Os formandos vêm de <b>Escola360 › Formandos</b>; o responsável de curso e o orientador educativo, dos cargos do <b>Plano Curricular</b> da turma (ou o orientador educativo indicado em Escola › Turmas).</p>
      <div class="row" style="margin-top:10px"><button class="b" id="papNCriar">Criar a prova</button><button class="b s" id="papNCanc">Cancelar</button></div></div>`;
    $("#papNAno").onchange=e=>{PAP_SEL.ano=e.target.value;papRender("papInicio")};
    $("#papNCanc").onclick=()=>{PAP_NOVA=false;papRender("papInicio")};
    $("#papNCriar").onclick=()=>{const aid=$("#papNAno").value,tid=$("#papNTur").value,f=$("#papNFase").value;
      if(tid&&PAP.provas.some(p=>p.anoId===aid&&p.turmaId===tid&&p.fase===f)&&!confirm("Já existe uma prova desta turma nesta fase. Criar outra?"))return;
      const P=papNovaProva(aid,tid,f,false);PAP.provas.push(P);papGuardar(P);PAP_NOVA=false;PAP_SEL.prova=P.id;PAP_SEL.ano=aid;toast("Prova criada");show("papProva")}}
  else $("#papNovaBox").innerHTML="";
  papImpUI();
  $("#papLista").innerHTML=L.length?`<div class="pp-lst">${L.map(P=>{const I=papInc(P),f=I.map(papFinal).filter(x=>x!==null),d=I.map(c=>c.data).filter(Boolean).sort(),sem=I.filter(c=>!c.data||!c.hora).length,sj=I.filter(c=>!String(c.j1||"").trim()&&!String(c.j2||"").trim()).length,p=I.length?Math.round(f.length/I.length*100):0;
      return `<div class="pp-pc"><h3>${esc(papNome(P))}</h3><div class="pp-meta">${esc(papDef().rotResp)}: ${esc(P.resp||"—")} · ${esc(papDef().rotOrient)}: ${esc(P.orient||"—")}${papFse(P)?`<br>Projeto n.º ${esc(papFse(P))}`:""}</div>
        <div class="pp-chips"><span class="pp-chip">${I.length} formando${I.length===1?"":"s"}</span>${d.length?`<span class="pp-chip mu">${calDM(d[0])}${d[d.length-1]!==d[0]?" a "+calDM(d[d.length-1]):""}</span>`:`<span class="pp-chip wa">sem datas</span>`}${sem&&d.length?`<span class="pp-chip wa">${sem} sem data ou hora</span>`:""}${sj?`<span class="pp-chip wa">${sj} sem júri</span>`:""}${f.length?`<span class="pp-chip ok">média ${papFmt(f.reduce((s,x)=>s+x,0)/f.length,1)}</span>`:""}</div>
        <div><div class="hint" style="margin:0 0 4px">${f.length} de ${I.length} grelhas completas</div><div class="pp-bar2"><i style="width:${p}%"></i></div></div>
        <div class="pp-btns"><button class="b s" data-papabre="${P.id}" data-papt="papProva">Prova e júri</button><button class="b s" data-papabre="${P.id}" data-papt="papGrelha">Grelhas</button><button class="b s" data-papabre="${P.id}" data-papt="papDocs">Pautas e atas</button><span class="grow"></span>${papEd()?`<button class="b s" data-papdel="${P.id}" title="Apagar esta prova (pede confirmação)">Apagar</button>`:""}</div></div>`}).join("")}</div>`
    :papVz("grad",`Ainda não há provas em ${esc(a.nome)}. ${papEd()?"Carregue em <b>Nova prova</b> ou importe a grelha do Excel.":""}`)}
// ----- importar a grelha do Excel -----
function papLerExcel(wb){const S=n=>wb.Sheets[n];const v=(ws,a)=>{const c=ws&&ws[a];return !c||c.t==="e"?undefined:c.v};
  const s=(ws,a)=>{const x=v(ws,a);return x===undefined||x===null||typeof x==="boolean"?"":String(x).trim()};
  const C=S("Curso");if(!C)throw new Error("Este ficheiro não parece uma «Grelha de Avaliação da PAP»: falta a folha «Curso».");
  const semCod=x=>String(x||"").replace(/^\s*\d+\s*[-–]\s*/,"").trim();
  const dia=x=>typeof x==="number"&&x>20000?new Date(Math.round((x-25569)*864e5)).toISOString().slice(0,10):(typeof x==="string"&&/^\d{4}-\d{2}-\d{2}/.test(x)?x.slice(0,10):"");
  const R={curso:s(C,"F6"),resp:semCod(s(C,"F3")),orient:semCod(s(C,"F4")),dped:s(C,"F5"),fse:(x=>/\d{3,}/.test(x)?x:"")(s(C,"F7")),box:(x=>/^https?:/.test(x)?x:"")(s(C,"K6")),cands:[],contactos:[],obs:{},local:"",cargoPres:"",localidade:""};
  for(let r=11;r<=60;r++){const nome=s(C,"D"+r);if(!nome)continue;if(/^n\.?º de alunos/i.test(nome)||/^\d{2,4}\s*-\s/.test(nome))break;const a=v(C,"A"+r),k=s(C,"K"+r);
    R.cands.push({nome,inc:a!==false,j1:s(C,"H"+r),j2:s(C,"I"+r),data:dia(v(C,"J"+r)),prova:/^https?:/.test(k)?k:"",env:/sent|enviad/i.test(s(C,"L"+r))?1:0,n:{}})}
  const porNome=n=>R.cands.find(c=>norm(c.nome)===norm(n));
  let r0=0;for(let r=1;r<=900;r++)if(/^contactos/i.test(s(C,"D"+r))){r0=r;break}
  if(r0){let br=0;for(let r=r0+2;r<r0+500&&br<3;r++){const nome=s(C,"D"+r);if(!nome){br++;continue}br=0;R.contactos.push({nome,empresa:s(C,"E"+r),tel:s(C,"F"+r),tlm:s(C,"G"+r),email:s(C,"H"+r),notas:s(C,"I"+r)})}}
  let nG=0;for(const n of wb.SheetNames){if(!/^GCFP-F\d+$/i.test(n))continue;const G=S(n),nome=s(G,"D11");if(!nome)continue;
    let c=porNome(nome);if(!c){c={nome,inc:true,n:{}};R.cands.push(c)}c.num=s(G,"D12")||c.num||"";c.tema=s(G,"D10")||c.tema||"";
    [16,18,20,22,24,26].forEach((r,i)=>{for(const col of["D","J","P","V","AB"]){const x=v(G,col+r);if(typeof x==="number"){c.n["c"+(i+1)]=x;break}}});
    const x1=v(G,"D34"),x2=v(G,"D35");if(typeof x1==="number")c.cp1=x1;if(typeof x2==="number")c.cp2=x2;nG++}
  R.nGrelhas=nG;
  const PC=S("Pauta de Chamada");if(PC){for(let r=9;r<=40;r++){const nome=s(PC,"B"+r),h=s(PC,"F"+r);if(!nome)continue;const c=porNome(nome);if(c&&h)c.hora=h}
    const ob=[];for(let r=35;r<=40;r++){const t=s(PC,"B"+r);if(!t||/^observa/i.test(t))continue;const m=t.match(/^local\s*:\s*(.+)$/i);if(m)R.local=m[1].trim();else ob.push(t)}R.obs.cham=ob.join("\n")}
  const ob=(n,a,b)=>{const W=S(n);if(!W)return"";const o=[];for(let r=a;r<=b;r++){const t=s(W,"B"+r);if(t&&!/^observa/i.test(t))o.push(t)}return o.join("\n")};
  R.obs.pres=ob("Folha de Presença",36,41);R.obs.pauta=ob("Pauta de Avaliação PAP",36,41);
  const vis=(wb.Workbook&&wb.Workbook.Sheets)||[];
  for(const n of wb.SheetNames){if(!/^ata/i.test(n))continue;const meta=vis.find(x=>x.name===n);if(meta&&meta.Hidden)continue;const A=S(n),t=s(A,"A9");
    const m=t.match(/presid[eê]ncia\s+d[aoe]s?\s+(.+?),\s*(.+?),\s*reuni/i);if(m&&!R.cargoPres)R.cargoPres=m[1].trim();const l=s(A,"E29");if(l&&!R.localidade)R.localidade=l.split(",")[0].trim()}
  return R}
function papTurmaPalpite(R){const E=escData(),mm=String(R.curso).match(/\((\d{2})\s*[-/]\s*(\d{2})\)/),ai=mm?2000+ +mm[1]:0,af=mm?2000+ +mm[2]:0,cod=(String(R.curso).match(/^\s*([A-Z]?\d{2,4})\s*[-–]/i)||[])[1]||"";
  const nome=norm(String(R.curso).replace(/^\s*\S+\s*[-–]\s*/,"").replace(/\(.*?\)/g,"")).split(/\s+/).filter(w=>w.length>3);
  let best=null,bs=0;for(const t of E.turmas){let sc=0;if(cod&&norm(t.cod)===norm(cod))sc+=3;if(ai&&t.anoIni===ai)sc+=2;if(af&&t.anoFim===af)sc+=2;const tn=norm(turmaNome(t));sc+=nome.filter(w=>tn.includes(w)).length;if(sc>bs){bs=sc;best=t}}
  return bs>=3?best:null}
function papAnoPalpite(R,t){const E=escData(),d=R.cands.map(c=>c.data).filter(Boolean).sort()[0];if(d){const y=+d.slice(0,4),m=+d.slice(5,7),ini=m>=9?y:y-1;const a=E.anos.find(x=>x.ini===ini);if(a)return a}
  if(t&&t.anoFim){const a=E.anos.find(x=>x.ini===t.anoFim-1);if(a)return a}return anoAtivo()}
$("#papImpF").addEventListener("change",async e=>{const f=e.target.files[0];e.target.value="";if(!f)return;
  try{const X=await loadXLSX(),wb=X.read(await f.arrayBuffer(),{type:"array",cellDates:false,bookVBA:false});const R=papLerExcel(wb);R.ficheiro=f.name;
    if(!R.cands.length&&!R.contactos.length)throw new Error("Não encontrei formandos nem contactos do júri neste ficheiro.");
    const t=papTurmaPalpite(R);R.turmaId=t?t.id:"";R.anoId=papAnoPalpite(R,t).id;PAP_IMP=R;show("papInicio");papRender("papInicio");setTimeout(()=>{const b=$("#papImpBox");if(b)b.scrollIntoView({behavior:"smooth",block:"start"})},80)}
  catch(x){toast(x.message||"Não foi possível ler o ficheiro")}});
function papImpUI(){const R=PAP_IMP,el=$("#papImpBox");if(!R||!papEd()){el.innerHTML="";return}const E=escData(),a=E.anos.find(x=>x.id===R.anoId)||anoAtivo(),T=E.turmas.slice().sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod)));
  const tmp={n:{}};const fin=c=>{Object.assign(tmp,{n:c.n||{},cp1:c.cp1,cp2:c.cp2});return papFinal(tmp)};
  el.innerHTML=`<div class="pp-box pp-imp"><h3>Importar «${esc(R.ficheiro)}»</h3>
    <div class="pp-chips" style="margin-bottom:8px"><span class="pp-chip">${esc(R.curso||"curso sem nome")}</span><span class="pp-chip">${R.cands.length} formando${R.cands.length===1?"":"s"}</span><span class="pp-chip">${R.nGrelhas} grelha${R.nGrelhas===1?"":"s"}</span><span class="pp-chip">${R.contactos.length} contacto${R.contactos.length===1?"":"s"} do júri</span>${R.fse?`<span class="pp-chip mu">Projeto ${esc(R.fse)}</span>`:""}</div>
    <div class="pp-form"><label>Ano letivo<select id="papIAno">${anosOrd().reverse().map(x=>`<option value="${x.id}"${x.id===a.id?" selected":""}>${esc(x.nome)}</option>`).join("")}</select></label>
      <label class="w2">Turma da EPISJ 360<select id="papITur"><option value="">— sem turma —</option>${T.map(t=>`<option value="${t.id}"${t.id===R.turmaId?" selected":""}>${esc(t.cod)} · ${esc(turmaNome(t))}</option>`).join("")}</select></label>
      <label>Fase<select id="papIFase"><option value="1">1.ª fase</option><option value="2">2.ª fase</option><option value="3">3.ª fase</option><option value="esp">Época especial</option></select></label></div>
    <label class="chip" style="margin-top:10px"><input type="checkbox" id="papIEsc" checked> acrescentar à Escola360 › Formandos os formandos que lá faltam (na turma escolhida)</label>
    <div class="pp-prev" style="margin-top:10px"><table class="rt"><thead><tr><th>N.º</th><th>Nome</th><th>Apresenta</th><th class="hm">Júri externo</th><th>Data</th><th>Hora</th><th>Nota</th></tr></thead><tbody>${R.cands.map(c=>{const f=fin(c);return `<tr><td>${esc(c.num||"")}</td><td>${esc(c.nome)}</td><td>${c.inc?"Sim":"Não"}</td><td class="hm">${esc([c.j1,c.j2].filter(Boolean).join(", "))}</td><td>${esc(papDMA(c.data))}</td><td>${esc(c.hora||"")}</td><td><b>${f===null?"—":f}</b></td></tr>`}).join("")}</tbody></table></div>
    <p class="hint" style="margin:8px 0 0">Junta-se ao que já existe: se já houver uma prova desta turma nesta fase, só se preenche o que lá está em branco. Nenhum dado é apagado. O ficheiro Excel não é alterado.</p>
    <div class="row" style="margin-top:10px"><button class="b" id="papIGo">Importar</button><button class="b s" id="papICanc">Cancelar</button></div></div>`;
  $("#papICanc").onclick=()=>{PAP_IMP=null;papImpUI()};
  $("#papIGo").onclick=()=>{const r=papImportar(R,{anoId:$("#papIAno").value,turmaId:$("#papITur").value,fase:$("#papIFase").value,addEsc:$("#papIEsc").checked});PAP_IMP=null;
    toast(`Importado: ${r.nC} formando(s) novo(s), ${r.nA} atualizado(s), ${r.nJ} contacto(s) do júri novo(s)`);PAP_SEL.prova=r.P.id;PAP_SEL.ano=r.P.anoId;show("papProva")}}
function papImportar(R,o){const D=papDef(),E=escData();let P=PAP.provas.find(p=>p.anoId===o.anoId&&p.fase===o.fase&&(o.turmaId?p.turmaId===o.turmaId:!p.turmaId&&norm(p.curso||"")===norm(R.curso||"")));
  if(!P){P=papNovaProva(o.anoId,o.turmaId,o.fase,true);P.curso=R.curso||P.curso;PAP.provas.push(P)}
  const enche=(obj,k,v)=>{if(v!==undefined&&v!==null&&v!==""&&(obj[k]===undefined||obj[k]===null||obj[k]===""))obj[k]=v};
  enche(P,"curso",R.curso);enche(P,"resp",R.resp);enche(P,"orient",R.orient);enche(P,"dped",R.dped);enche(P,"fse",R.fse);enche(P,"box",R.box);if(R.local&&(!P.local||P.local===D.local))P.local=R.local;
  for(const k of["cham","pres","pauta"])enche(P.obs,k,R.obs[k]);
  if(!D.dped&&R.dped)D.dped=R.dped;if(R.cargoPres&&D.cargoPres!==R.cargoPres&&!D.em)D.cargoPres=R.cargoPres;
  const F=o.turmaId?(E.formandos||[]).filter(f=>f.turmaId===o.turmaId):[];let nC=0,nA=0,addE=0;
  for(const rc of R.cands){let c=P.cands.find(x=>(rc.num&&x.num===rc.num)||norm(x.nome||"")===norm(rc.nome));
    if(!c){c={id:uid(),fId:"",num:"",nome:rc.nome,inc:rc.inc,n:{}};P.cands.push(c);nC++}else nA++;
    for(const k of["num","tema","j1","j2","data","hora","prova"])enche(c,k,rc[k]);if(rc.env&&!c.env)c.env=1;
    for(const k in rc.n)if(papNum(c.n[k])===null)c.n[k]=rc.n[k];for(const k of["cp1","cp2"])if(papNum(c[k])===null&&papNum(rc[k])!==null)c[k]=rc[k];
    if(!c.fId&&F.length){const f=F.find(f=>(c.num&&f.num===c.num)||norm(f.nome||"")===norm(c.nome));if(f){c.fId=f.id;if(!c.num&&f.num)c.num=f.num}}
    if(!c.fId&&o.addEsc&&o.turmaId){const f={id:uid(),num:c.num||"",nome:c.nome,turmaId:o.turmaId};E.formandos.push(f);c.fId=f.id;addE++}}
  P.cands.sort(papOrdNome);if(addE)save();
  let nJ=0;for(const rc of R.contactos){let k=PAP.contactos.find(x=>norm(x.nome)===norm(rc.nome)&&(!rc.empresa||!x.empresa||norm(x.empresa)===norm(rc.empresa)));
    if(!k){k={id:uid(),nome:rc.nome};PAP.contactos.push(k);nJ++}for(const f of["empresa","tel","tlm","email","notas"])enche(k,f,rc[f]);k.em=Date.now()}
  papGuardar(P);return{P,nC,nA,nJ}}
// ----- Prova e júri -----
function papProvaUI(){const P=papProva();if(!P){$("#papCab").innerHTML="";papSemProva("#papCands");return}
  const D=papDef(),E=escData(),ed=papEd(),a=papAnoDe(P),T=turmasDoAno(a),t=papTurma(P),dis=ed?"":"disabled";
  if(t&&!T.some(x=>x.id===t.id))T.push(t);
  $("#papFormDL").innerHTML=cfg.profs.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(p=>`<option value="${esc(p.nome)}">`).join("");
  $("#papJuriDL").innerHTML=PAP.contactos.slice().sort((x,y)=>COLL_PT.compare(x.nome,y.nome)).map(c=>`<option value="${esc(c.nome)}">${esc(c.empresa||"")}</option>`).join("");
  $("#papHorasDL").innerHTML=D.horas.map(h=>`<option value="${esc(h)}">`).join("");
  const dc=papDatasCal(P);
  $("#papCab").innerHTML=`<div class="pp-form">
    <label>Ano letivo<select data-pk="anoId" ${dis}>${anosOrd().reverse().map(x=>`<option value="${x.id}"${x.id===P.anoId?" selected":""}>${esc(x.nome)}</option>`).join("")}</select></label>
    <label class="w2">Turma<select data-pk="turmaId" ${dis}><option value="">— sem turma —</option>${T.map(x=>`<option value="${x.id}"${x.id===P.turmaId?" selected":""}>${esc(x.cod)} · ${esc(turmaNome(x))}</option>`).join("")}</select></label>
    <label>Fase<select data-pk="fase" ${dis}>${[["1","1.ª fase"],["2","2.ª fase"],["3","3.ª fase"],["esp","Época especial"]].map(([v,n])=>`<option value="${v}"${P.fase===v?" selected":""}>${n}</option>`).join("")}</select></label>
    <label class="w2">Curso<input type="text" data-pk="curso" value="${esc(P.curso||"")}" ${dis}></label>
    <label>Projeto n.º<input type="text" data-pk="fse" value="${esc(P.fse||"")}" placeholder="${esc(t&&t.fse||"")}" ${dis} title="Se ficar em branco, usa o código FSE da turma (Escola360 › Turmas)"></label>
    <label>${esc(D.rotResp)}<input type="text" list="papFormDL" data-pk="resp" value="${esc(P.resp||"")}" ${dis}></label>
    <label>${esc(D.rotOrient)}<input type="text" list="papFormDL" data-pk="orient" value="${esc(P.orient||"")}" ${dis}></label>
    <label>${esc(D.rotDped)}<input type="text" list="papFormDL" data-pk="dped" value="${esc(P.dped||"")}" ${dis}></label>
    <label>Local das provas<input type="text" data-pk="local" value="${esc(P.local||"")}" ${dis}></label>
    <label class="w2">Pasta da prova na Box (ligação)<input type="text" inputmode="url" data-pk="box" value="${esc(P.box||"")}" placeholder="https://episj.box.com/s/…" ${dis}></label>
    </div>${P.box?`<p class="hint" style="margin:8px 0 0"><a href="${esc(P.box)}" target="_blank" rel="noopener">Abrir a pasta na Box</a> (só leitura)</p>`:""}
    ${dc.length?`<p class="hint" style="margin:8px 0 0">Datas da PAP desta turma no Calendário Escolar: <b>${dc.map(d=>calDM(d,{day:"numeric",month:"long"})).join(", ")}</b>.</p>`:""}`;
  papCandsUI(P)}
function papCandsUI(P){const ed=papEd(),dis=ed?"":"disabled",L=P.cands;
  const est=c=>{const e=papEstado(c);return `<span class="pp-chip ${e.k}">${e.f!=null?e.f+" · ":""}${e.txt}</span>${c.env?`<div class="pp-st" style="margin-top:3px">enviado ao júri${c.env>1?" a "+papDMA(new Date(c.env).toISOString().slice(0,10)):""}</div>`:""}`};
  $("#papCands").innerHTML=(L.length?`<table class="rt pp-ct"><thead><tr><th style="width:62px">Apresenta</th><th>N.º</th><th>Nome do formando</th><th>Tema</th><th>${esc(papDef().rotJuri)} 1</th><th>${esc(papDef().rotJuri)} 2</th><th>Data</th><th>Hora</th><th class="hm">Prova escrita</th><th>Grelha</th>${ed?"<th></th>":""}</tr></thead><tbody>${L.map(c=>`<tr data-c="${c.id}" class="${c.inc?"":"off"}">
      <td><input type="checkbox" data-ck="inc"${c.inc?" checked":""} ${dis} aria-label="Apresenta"></td>
      <td class="pp-n"><input type="text" data-ck="num" value="${esc(c.num||"")}" ${dis}></td>
      <td class="pp-nm"><input type="text" data-ck="nome" value="${esc(c.nome||"")}" ${dis}></td>
      <td class="pp-tm"><input type="text" data-ck="tema" value="${esc(c.tema||"")}" placeholder="Tema do projeto" ${dis}></td>
      <td class="pp-j"><input type="text" list="papJuriDL" data-ck="j1" value="${esc(c.j1||"")}" ${dis}></td>
      <td class="pp-j"><input type="text" list="papJuriDL" data-ck="j2" value="${esc(c.j2||"")}" ${dis}></td>
      <td class="pp-d"><input type="date" data-ck="data" value="${esc(c.data||"")}" ${dis}></td>
      <td class="pp-h"><input type="text" list="papHorasDL" data-ck="hora" value="${esc(c.hora||"")}" placeholder="08:30 - 09:30" ${dis}></td>
      <td class="hm pp-pv"><input type="text" inputmode="url" data-ck="prova" value="${esc(c.prova||"")}" placeholder="ligação (Box)" ${dis}></td>
      <td data-cest>${est(c)}</td>${ed?`<td><button class="x" data-cdel title="Tirar este formando da prova (pede confirmação)">×</button></td>`:""}</tr>`).join("")}</tbody></table>`
    :papVz("tel",`Esta prova ainda não tem formandos.${P.turmaId?" Carregue em <b>Juntar formandos da turma</b>.":""}`))
    +(ed?`<div class="row" style="margin-top:10px"><button class="b s" id="papAddC">Acrescentar formando</button><span class="hint" style="margin:0">${papInc(P).length} de ${L.length} apresenta${L.length===1?"":"m"}.</span></div>`:"");
  const ad=$("#papAddC");if(ad)ad.onclick=()=>{P.cands.push({id:uid(),fId:"",num:"",nome:"",inc:true,n:{}});papGuardar(P);papCandsUI(P);const i=document.querySelector("#papCands tr:last-child [data-ck=nome]");if(i)i.focus()}}
$("#papCab").addEventListener("change",e=>{const x=e.target.closest("[data-pk]");if(!x||!papEd())return;const P=papProva();if(!P)return;const k=x.dataset.pk,v=x.value.trim();P[k]=v;
  if(k==="turmaId"){const t=papTurma(P);if(t){if(!P.curso)P.curso=turmaNome(t);if(!P.resp)P.resp=papCargo(t.id,P.anoId,/respons.*curso/);if(!P.orient)P.orient=papCargo(t.id,P.anoId,/orientador.*educ/)}}
  papGuardar(P);if(["anoId","turmaId","fase","curso"].includes(k)){PAP_SEL.ano=P.anoId;papSelOpcoes();papProvaUI()}});
$("#papCands").addEventListener("change",e=>{const x=e.target.closest("[data-ck]");if(!x||!papEd())return;const P=papProva(),tr=x.closest("tr"),c=P&&P.cands.find(y=>y.id===tr.dataset.c);if(!c)return;const k=x.dataset.ck;
  c[k]=x.type==="checkbox"?x.checked:x.value.trim();if(k==="inc")tr.classList.toggle("off",!c.inc);papGuardar(P)});
$("#papCands").addEventListener("click",e=>{if(!e.target.closest("[data-cdel]")||!papEd())return;const P=papProva(),tr=e.target.closest("tr"),c=P.cands.find(y=>y.id===tr.dataset.c);if(!c)return;
  const tem=papEstado(c).k!=="mu";if(!confirm(`Tirar «${c.nome||"(sem nome)"}» desta prova?${tem?"\n\nAtenção: este formando já tem notas na grelha, que se perdem.":""}\n\n(Se só não vai apresentar, desmarque «Apresenta».)`))return;
  P.cands=P.cands.filter(y=>y.id!==c.id);papGuardar(P);papCandsUI(P)});
$("#papJuntar").onclick=()=>{const P=papProva();if(!P)return;if(!P.turmaId){escLinhaMsg("#papMsg","Escolha primeiro a turma da prova.","bad");return}const n=papJuntarTurma(P);papGuardar(P);papCandsUI(P);
  escLinhaMsg("#papMsg",n?`${n} formando(s) da turma acrescentado(s).`:"Todos os formandos da turma já estão nesta prova.",n?"ok":"info")};
$("#papHoras").onclick=()=>{const P=papProva();if(!P)return;const D=papDef(),I=papInc(P).slice().sort((a,b)=>String(a.data||"9").localeCompare(String(b.data||"9"))||papOrdNome(a,b));if(!I.length)return;
  let dias=[...new Set(I.map(c=>c.data).filter(Boolean))].sort();if(!dias.length)dias=papDatasCal(P);
  if(!dias.length){escLinhaMsg("#papMsg","Escreva a data de pelo menos um formando (ou marque as datas da PAP da turma no Calendário Escolar).","bad");return}
  if(!D.horas.length){escLinhaMsg("#papMsg","Não há horas definidas em PAP360 › Definições.","bad");return}
  if(I.some(c=>c.hora)&&!confirm("Alguns formandos já têm hora. Distribuir de novo as horas (e os dias) de todos os que apresentam?"))return;
  let di=0,hi=0;for(const c of I){if(di>=dias.length){dias.push(calMais(dias[dias.length-1],1));}c.data=dias[di];c.hora=D.horas[hi];hi++;if(hi>=D.horas.length){hi=0;di++}}
  papGuardar(P);papCandsUI(P);escLinhaMsg("#papMsg",`Horas distribuídas por ${new Set(I.map(c=>c.data)).size} dia(s), ${D.horas.length} por dia, por ordem alfabética.`,"ok")};
$("#papEnviar").onclick=async()=>{const P=papProva();if(!P)return;const por=new Map();
  for(const c of papInc(P))for(const j of[c.j1,c.j2]){const n=String(j||"").trim();if(!n)continue;if(!por.has(n))por.set(n,[]);por.get(n).push(c)}
  if(!por.size){escLinhaMsg("#papMsg","Ainda não há júri externo nesta prova.","bad");return}
  const ct=n=>PAP.contactos.find(x=>norm(x.nome)===norm(n)),ok=n=>/\S+@\S+\.\S+/.test(String((ct(n)||{}).email||"").trim());
  const com=[...por.keys()].filter(ok),sem=[...por.keys()].filter(n=>!ok(n));
  if(!com.length){escLinhaMsg("#papMsg",`Nenhum elemento do júri tem email em <a href="#" data-papir="papJuri">Contactos do júri</a>: ${esc(sem.join(", "))}.`,"bad");return}
  if(!confirm(`Enviar pelo Office 365 a ${com.length} elemento(s) do júri: ${com.join(", ")}?${sem.length?"\n\nSem email (não recebem): "+sem.join(", "):""}`))return;
  const D=papDef(),a=papAnoDe(P);let n=0,err="";
  for(const nm of com){const L=por.get(nm).slice().sort(papOrdHora),k=ct(nm);
    const body=`Olá ${String(nm).split(/\s+/)[0]},\n\nAgradecemos a sua disponibilidade para integrar o júri da Prova de Aptidão Profissional do curso ${P.curso} (ano letivo ${a.nome}).\n\nFormandos que vai avaliar:\n`+L.map(c=>`- ${c.data?calDMA(c.data):"data por marcar"}${c.hora?", "+c.hora:""}: ${c.nome}${c.tema?" — "+c.tema:""}${c.prova?"\n  Prova escrita: "+c.prova:""}`).join("\n")+`\n\n${P.local?"Local: "+P.local+"\n":""}${escData().nome||"Escola Profissional da Ilha de São Jorge"}\n\nCom os melhores cumprimentos,\n${(EU&&EU.nome)||P.dped||""}`;
    try{escLinhaMsg("#papMsg",`A enviar a ${esc(nm)}…`,"info");await msEnviar({to:String(k.email).trim(),subject:`Prova de Aptidão Profissional — ${P.curso}`,body});n++;L.forEach(c=>c.env=Date.now())}catch(x){err=x.message||String(x);break}}
  papGuardar(P);papCandsUI(P);escLinhaMsg("#papMsg",err?`Enviado a ${n}; parou: ${esc(err)}`:`Enviado a ${n} elemento(s) do júri.${sem.length?" Sem email: "+esc(sem.join(", "))+".":""}`,err?"bad":"ok")};
// ----- Grelhas de avaliação -----
function papGrelhaUI(){const P=papProva();if(!P){$("#papCl").innerHTML="";papSemProva("#papG");return}
  const I=papInc(P).slice().sort(papOrdNome);if(!I.length){$("#papCl").innerHTML="";$("#papG").innerHTML=papVz("tel",`Nenhum formando apresenta nesta prova. <a href="#" data-papir="papProva">Abrir Prova e júri</a>`);return}
  let c=I.find(x=>x.id===PAP_SEL.cand)||I[0];PAP_SEL.cand=c.id;
  $("#papCl").innerHTML=I.map(x=>{const e=papEstado(x);return `<button data-pcand="${x.id}" class="${x.id===c.id?"on":""}"><i class="pp-dot ${e.k==="ok"||e.k==="ba"?"ok":e.k}"></i><span>${esc(x.nome)}</span><b>${e.f!=null?e.f:""}</b></button>`}).join("");
  papGrelhaForm(P,c,I)}
function papGrelhaForm(P,c,I){const D=papDef(),ed=papEd(),dis=ed?"":"disabled",N=D.niveis,cp=papCP(c),nf=papNF(c),f=papFinal(c),i=I.indexOf(c);
  const head=`<tr><th style="width:23%">Critério</th>${N.map((r,k)=>`<th>Nível ${k+1}<small>${r[0]}–${r[1]}</small></th>`).join("")}<th style="width:74px;text-align:center">Nota</th></tr>`;
  const rows=D.crit.map((k,ix)=>{const v=papNum(c.n[k.id]),lv=papNivel(v);
    return `<tr data-cr="${k.id}"><td class="pp-cr"><b>C${ix+1} · ${esc(k.nome)}</b><span>${esc(k.desc)}</span>${(+k.peso||0)!==1?`<em>conta ${+k.peso||0} vezes</em>`:""}</td>${N.map((r,j)=>{const q=[];for(let n=+r[0];n<=+r[1];n++)q.push(n);
      return `<td class="pp-lv${lv===j?" on":""}">${esc(k.niv[j]||"")}<div class="pp-q">${q.map(n=>`<button type="button" data-pq="${n}" class="${v===n?"on":""}" ${dis} aria-label="C${ix+1}: ${n} valores">${n}</button>`).join("")}</div></td>`}).join("")}
      <td class="pp-v"><input type="number" min="0" max="20" step="1" inputmode="numeric" data-pv value="${v===null?"":v}" ${dis} aria-label="Nota de C${ix+1}"></td></tr>`}).join("");
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  const f1=+D.fin.cp1,f2=+D.fin.cp2;
  $("#papG").innerHTML=`<div class="pp-gh"><div><h3>${esc(c.nome)}</h3><p class="hint">N.º ${esc(c.num||"—")} · ${c.data?calDMA(c.data):"sem data"}${c.hora?" · "+esc(c.hora):""} · Júri externo: ${esc([c.j1,c.j2].filter(Boolean).join(" e ")||"—")}</p></div><span class="grow" style="flex:1"></span>
      <label style="min-width:260px;flex:1">Tema<input type="text" data-gk="tema" value="${esc(c.tema||"")}" ${dis}></label><label style="width:160px">Data de lançamento<input type="date" data-gk="lanc" value="${esc(c.lanc||c.data||"")}" ${dis}></label></div>
    <p class="hint" style="margin:0 0 6px">Assinale em cada critério a nota atribuída pelo júri (um nível por critério): carregue no número dentro do nível, ou escreva a nota à direita.</p>
    <div class="tw"><table class="pp-gt">${head}${rows}</table></div>
    <div class="pp-res"><div class="ay-stats">${st("Classificação do Projeto (CP)",papFmt(cp),papFormulaCP())}
      ${f1?`<div class="ay-st"><small>1.ª Avaliação Intermédia (CP1)</small><input type="number" min="0" max="20" step="0.01" data-gk="cp1" value="${papNum(c.cp1)===null?"":c.cp1}" ${dis}></div>`:""}
      ${f2?`<div class="ay-st"><small>2.ª Avaliação Intermédia (CP2)</small><input type="number" min="0" max="20" step="0.01" data-gk="cp2" value="${papNum(c.cp2)===null?"":c.cp2}" ${dis}></div>`:""}
      ${st("Nota Final da PAP (NFPAP)",papFmt(nf),papFormulaNF())}</div>
      <div class="pp-fin"><small>Classificação final da PAP</small><b>${f===null?"—":f}</b><em>${f===null?(cp===null?"faltam notas na grelha":"falta "+[f1&&papNum(c.cp1)===null?"CP1":"",f2&&papNum(c.cp2)===null?"CP2":""].filter(Boolean).join(" e ")):papVal(f)}</em>${f!==null?`<span class="pp-chip ${f>=10?"ok":"ba"} pp-ap" style="align-self:flex-start">${f>=10?"Aprovado":"Não aprovado"}</span>`:""}</div></div>
    <div class="pp-nav"><button class="b s" data-pgo="${i-1}" ${i>0?"":"disabled"}>‹ Anterior</button><span class="hint" style="margin:0;align-self:center">${i+1} de ${I.length}</span><button class="b s" data-pgo="${i+1}" ${i<I.length-1?"":"disabled"}>Seguinte ›</button></div>`}
function papGSet(fn){const P=papProva();if(!P||!papEd())return;const c=P.cands.find(x=>x.id===PAP_SEL.cand);if(!c)return;fn(c);papGuardar(P);
  const sy=window.scrollY;papGrelhaUI();window.scrollTo(0,sy)}
$("#papG").addEventListener("click",e=>{const q=e.target.closest("[data-pq]");if(q){const k=q.closest("tr").dataset.cr,n=+q.dataset.pq;papGSet(c=>{c.n[k]=papNum(c.n[k])===n?null:n});return}
  const g=e.target.closest("[data-pgo]");if(g){const P=papProva(),I=papInc(P).slice().sort(papOrdNome),c=I[+g.dataset.pgo];if(c){PAP_SEL.cand=c.id;papGrelhaUI()}}});
$("#papG").addEventListener("change",e=>{const v=e.target.closest("[data-pv]");if(v){const k=v.closest("tr").dataset.cr;let n=papNum(v.value);if(n!==null){n=Math.max(0,Math.min(20,n))}papGSet(c=>{c.n[k]=n});return}
  const g=e.target.closest("[data-gk]");if(g){const k=g.dataset.gk;papGSet(c=>{if(k==="cp1"||k==="cp2"){const n=papNum(g.value);c[k]=n===null?null:Math.max(0,Math.min(20,n))}else c[k]=g.value.trim()})}});
$("#papCl").addEventListener("click",e=>{const b=e.target.closest("[data-pcand]");if(!b)return;PAP_SEL.cand=b.dataset.pcand;papGrelhaUI()});
$("#papGPdf").onclick=()=>{const P=papProva();if(!P)return;const c=P.cands.find(x=>x.id===PAP_SEL.cand);if(!c)return;papBaixar("grelha",P,c)};
// ----- Pautas e atas -----
function papDocsUI(){const P=papProva();if(!P){$("#papDocsAviso").innerHTML="";$("#papDocsOut").innerHTML=`<div class="card">${papVz("doc","Ainda não há provas.")}</div>`;return}
  const D=papDef(),ed=papEd(),dis=ed?"":"disabled",I=papInc(P),S=papSessoes(P),semD=I.filter(c=>!c.data),semH=I.filter(c=>c.data&&!c.hora),inc=I.filter(c=>papFinal(c)===null);
  const av=[];if(semD.length)av.push(`${semD.length} formando(s) sem data — não entram em nenhuma ata: ${esc(semD.map(c=>c.nome).join(", "))}`);if(semH.length)av.push(`${semH.length} formando(s) sem hora`);if(inc.length)av.push(`${inc.length} grelha(s) por completar — a pauta mostra «—»`);
  $("#papDocsAviso").innerHTML=av.length?`<div class="msg info">${av.join("<br>")}</div>`:"";
  const cham=I.slice().sort(papOrdHora),pauta=I.slice().sort(papOrdNome);
  const tab=(h,rows)=>`<div class="pp-prev"><table class="rt"><thead><tr>${h.map(x=>`<th>${x}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${h.length}" class="hint">Sem formandos.</td></tr>`}</tbody></table></div>`;
  const card=(id,tit,hint,btn,corpo)=>`<div class="card pp-doc"><div class="pp-head"><div><h2>${tit}</h2><p class="hint">${hint}</p></div><div class="pp-acts">${btn}</div></div>${corpo}</div>`;
  const ob=(k,ph)=>`<label style="margin-top:10px;display:block">Observações<textarea data-pobs="${k}" placeholder="${ph||""}" ${dis}>${esc(P.obs[k]||"")}</textarea></label>`;
  $("#papDocsOut").innerHTML=
    card("cham","Pauta de Chamada","Os formandos pela ordem de apresentação, com a hora e a data. Assinam o responsável de curso, o orientador educativo e a Direção Pedagógica.",`<button class="b s" data-pappdf="cham">PDF</button>`,
      tab(["Número","Nome","Hora","Data"],cham.map(c=>`<tr><td>${esc(c.num||"")}</td><td>${esc(c.nome)}</td><td>${esc(c.hora||"")}</td><td>${esc(papDMA(c.data))}</td></tr>`).join(""))+`<p class="hint" style="margin:8px 0 0">Local: <b>${esc(P.local||"—")}</b> (muda-se em Prova e júri)</p>`+ob("cham"))
   +card("pres","Folha de Presença","Para cada formando assinar no dia da prova.",`<button class="b s" data-pappdf="pres">PDF</button>`,
      tab(["Número","Nome","Assinatura","Data"],cham.map(c=>`<tr><td>${esc(c.num||"")}</td><td>${esc(c.nome)}</td><td></td><td>${esc(papDMA(c.data))}</td></tr>`).join(""))+ob("pres","Ex.: formandos que não entregaram o projeto ou que se inscreveram na 2.ª fase"))
   +card("atas","Atas da Reunião de Avaliação Final",`Uma ata por sessão (dia e manhã ou tarde), com o júri dessa sessão. Os textos mudam-se em <a href="#" data-papir="papDef">Definições</a>.`,S.length>1?`<button class="b s" data-pappdf="atas">PDF de todas</button>`:"",
      S.length?`<div class="pp-ata">${S.map(s=>{const A=papAta(P,s);return `<div class="pp-pc" data-ses="${esc(s.k)}"><h3>${esc(s.nome)}</h3>
        <div class="pp-chips"><span class="pp-chip">${s.cands.length} formando${s.cands.length===1?"":"s"}</span>${s.juri.length?s.juri.map(j=>`<span class="pp-chip mu">${esc(j)}</span>`).join(""):`<span class="pp-chip wa">sem júri externo</span>`}</div>
        <div class="pp-form" style="grid-template-columns:120px 1fr"><label>Hora da reunião<input type="time" data-ak="hora" value="${esc(A.hora||papHM(s.fim))}" ${dis}></label><label>Secretário(a)<input type="text" list="papFormDL" data-ak="sec" value="${esc(A.sec||"")}" placeholder="${esc(P.resp||"")}" ${dis}></label></div>
        <p>${esc(papAtaAbre(P,s))}</p><div class="pp-btns"><button class="b s" data-pappdf="ata" data-papses="${esc(s.k)}">PDF da ata</button></div></div>`}).join("")}</div>`:papVz("doc","As atas aparecem quando os formandos tiverem data (em Prova e júri)."))
   +card("pauta","Pauta de Avaliação PAP","A classificação final de cada formando e a data de lançamento.",`<button class="b s" data-pappdf="pauta">PDF</button>`,
      tab(["Número","Nome","Nota","Data de lançamento"],pauta.map(c=>{const f=papFinal(c);return `<tr><td>${esc(c.num||"")}</td><td>${esc(c.nome)}</td><td><b>${f===null?"—":f}</b></td><td>${esc(papDMA(c.lanc||c.data))}</td></tr>`}).join(""))+ob("pauta"))
   +card("grel","Grelhas de Avaliação","A grelha de cada formando, uma por página, com o resumo da avaliação e as assinaturas do júri.",`<button class="b s" data-pappdf="grelhas">PDF de todas</button><button class="b s" data-papir="papGrelha">Abrir as grelhas</button>`,
      `<p class="hint" style="margin:0">${I.length-inc.length} de ${I.length} grelhas completas.</p>`)}
$("#papDocsOut").addEventListener("change",e=>{if(!papEd())return;const P=papProva();if(!P)return;const o=e.target.closest("[data-pobs]");if(o){P.obs[o.dataset.pobs]=o.value;papGuardar(P);return}
  const a=e.target.closest("[data-ak]");if(a){const k=a.closest("[data-ses]").dataset.ses;if(!P.atas[k])P.atas[k]={};P.atas[k][a.dataset.ak]=a.value.trim();papGuardar(P);papDocsUI()}});
function papResultado(L){const f=L.map(papFinal).filter(x=>x!==null);if(!f.length)return"";const ap=f.filter(x=>x>=10).length;
  return ap===f.length?"Os formandos admitidos obtiveram classificação positiva.":ap?`${ap} formando${ap===1?" obteve":"s obtiveram"} classificação positiva e ${f.length-ap} não.`:"Nenhum formando obteve classificação positiva."}
function papAtaAbre(P,s){const D=papDef(),A=papAta(P,s),h=A.hora||papHM(s.fim);return String(D.ataAbre||"").replace(/\{data\}/g,papDataExt(s.data)).replace(/\{hora\}/g,h?papHoraExt(h):"…").replace(/\{cargo\}/g,D.cargoPres||"").replace(/\{presidente\}/g,P.dped||"…")}
// ----- Contactos do júri -----
function papJuriUI(){const ed=papEd(),dis=ed?"":"disabled",q=norm($("#papJFiltro").value||"");
  const uso=new Map();for(const P of PAP.provas)for(const c of papInc(P))for(const j of[c.j1,c.j2]){const n=norm(String(j||""));if(n)uso.set(n,(uso.get(n)||0)+1)}
  const L=PAP.contactos.filter(c=>!q||norm([c.nome,c.empresa,c.tel,c.tlm,c.email,c.notas].join(" ")).includes(q)).sort((a,b)=>COLL_PT.compare(a.nome||"",b.nome||""));
  $("#papJOut").innerHTML=L.length?`<table class="rt pp-ct"><thead><tr><th>Contacto</th><th>Empresa</th><th>Telefone</th><th>Telemóvel</th><th>Email</th><th class="hm">Notas</th><th>Provas</th>${ed?"<th></th>":""}</tr></thead><tbody>${L.map(c=>`<tr data-j="${c.id}">
    ${["nome","empresa","tel","tlm","email"].map(k=>`<td><input type="${k==="email"?"email":"text"}" data-jk="${k}" value="${esc(c[k]||"")}" ${dis}></td>`).join("")}<td class="hm"><input type="text" data-jk="notas" value="${esc(c.notas||"")}" ${dis}></td>
    <td><span class="pp-chip ${uso.get(norm(c.nome||""))?"":"mu"}">${uso.get(norm(c.nome||""))||0}</span></td>${ed?`<td><button class="x" data-jdel title="Apagar este contacto (pede confirmação)">×</button></td>`:""}</tr>`).join("")}</tbody></table><p class="hint" style="margin:8px 0 0">${L.length} de ${PAP.contactos.length} contacto(s). «Provas» conta as vezes que a pessoa está no júri de um formando.</p>`
    :papVz("tel",PAP.contactos.length?"Ninguém corresponde à procura.":"Ainda sem contactos do júri. Acrescente acima ou importe a grelha do Excel (traz a lista «Contactos - Júri»).")}
$("#papJFiltro").addEventListener("input",debounce(()=>papJuriUI(),200));
$("#papJForm").addEventListener("submit",e=>{e.preventDefault();if(!papEd())return;const nome=$("#papJNome").value.trim();if(!nome)return;
  const k={id:uid(),nome,empresa:$("#papJEmp").value.trim(),tel:$("#papJTel").value.trim(),tlm:$("#papJTlm").value.trim(),email:$("#papJEmail").value.trim(),notas:""};PAP.contactos.push(k);papGuardar(k);
  ["#papJNome","#papJEmp","#papJTel","#papJTlm","#papJEmail"].forEach(s=>$(s).value="");papJuriUI();toast("Contacto acrescentado")});
$("#papJOut").addEventListener("change",e=>{const x=e.target.closest("[data-jk]");if(!x||!papEd())return;const k=PAP.contactos.find(c=>c.id===x.closest("tr").dataset.j);if(!k)return;k[x.dataset.jk]=x.value.trim();papGuardar(k)});
$("#papJOut").addEventListener("click",e=>{if(!e.target.closest("[data-jdel]")||!papEd())return;const id=e.target.closest("tr").dataset.j,k=PAP.contactos.find(c=>c.id===id);if(!k)return;
  if(!confirm(`Apagar o contacto «${k.nome}»? (Os nomes já escritos no júri das provas ficam.)`))return;PAP.contactos=PAP.contactos.filter(c=>c.id!==id);PAP.del[id]=Date.now();papGuardar();papJuriUI()});
// ----- Definições -----
function papDefUI(){const D=papDef(),ed=papEd(),dis=ed?"":"disabled";
  $("#papDefCrit").innerHTML=D.crit.map((k,i)=>`<div class="pp-crit" data-dc="${i}"><div class="pp-form"><label>Critério<input type="text" value="C${i+1}" disabled></label><label>Nome curto<input type="text" data-dk="nome" value="${esc(k.nome)}" ${dis}></label><label>Título na grelha<input type="text" data-dk="tit" value="${esc(k.tit)}" ${dis}></label><label>Peso na CP<input type="number" min="0" step="1" data-dk="peso" value="${+k.peso||0}" ${dis}></label></div>
    <label style="display:block;margin-top:8px">Descrição<textarea data-dk="desc" ${dis}>${esc(k.desc)}</textarea></label>
    <div class="pp-niv">${D.niveis.map((r,j)=>`<label>Nível ${j+1} <small>(${r[0]}–${r[1]})</small><textarea data-dn="${j}" ${dis}>${esc(k.niv[j]||"")}</textarea></label>`).join("")}</div></div>`).join("");
  $("#papDefForm").innerHTML=`<div class="pp-formula">${esc(papFormulaCP())}</div><br><div class="pp-formula">${esc(papFormulaNF())}</div>
    <div class="pp-form" style="max-width:640px"><label>Peso de CP1 (1.ª avaliação intermédia)<input type="number" min="0" step="1" data-df="cp1" value="${+D.fin.cp1||0}" ${dis}></label><label>Peso de CP2 (2.ª avaliação intermédia)<input type="number" min="0" step="1" data-df="cp2" value="${+D.fin.cp2||0}" ${dis}></label><label>Peso de CP (projeto)<input type="number" min="0" step="1" data-df="cp" value="${+D.fin.cp||0}" ${dis}></label></div>
    <p class="hint" style="margin:12px 0 4px">Níveis (de quanto a quanto vale cada nível):</p>
    <div class="pp-form" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${D.niveis.map((r,j)=>`<label>Nível ${j+1}<span style="display:flex;gap:4px;align-items:center"><input type="number" min="0" max="20" data-dl="${j}" data-dlk="0" value="${r[0]}" ${dis}>–<input type="number" min="0" max="20" data-dl="${j}" data-dlk="1" value="${r[1]}" ${dis}></span></label>`).join("")}</div>
    <p class="hint" style="margin:10px 0 0">A classificação final é a NFPAP arredondada às unidades (como o ARRED do Excel). Aprovado a partir de 10 valores.</p>`;
  const tx=(k,l,t)=>`<label${t?' class="w2"':""}>${l}${t?`<textarea data-dt="${k}" ${dis}>${esc(D[k]||"")}</textarea>`:`<input type="text" data-dt="${k}" value="${esc(D[k]||"")}" ${dis}>`}</label>`;
  $("#papDefTxt").innerHTML=`<div class="pp-form">${tx("rotResp","Nome do cargo «Responsável de Curso»")}${tx("rotOrient","Nome do cargo «Orientador Educativo»")}${tx("rotDped","Nome «Direção Pedagógica»")}${tx("rotJuri","Nome «Júri Externo»")}${tx("rotRep","Cargo do júri externo na ata")}
    ${tx("dped","Direção Pedagógica (nome, para as provas novas)")}${tx("cargoPres","Cargo de quem preside à reunião")}${tx("localidade","Localidade (Velas, …)")}${tx("local","Local das provas (para as provas novas)")}
    <label class="w2">Horas das apresentações (uma por linha)<textarea data-dh ${dis}>${esc(D.horas.join("\n"))}</textarea></label>
    <label class="chip w2" style="align-self:end"><input type="checkbox" data-dt="ataNota"${D.ataNota?" checked":""} ${dis}> na ata, mostrar a nota em vez de «Aprovado»</label>
    ${tx("ataAbre","Ata — abertura ({data}, {hora}, {cargo}, {presidente})",1)}${tx("ataMeio","Ata — depois das apresentações ({resultado})",1)}${tx("ataFecho","Ata — encerramento",1)}</div>`}
$("#papDef").addEventListener("change",e=>{if(!papEd())return;const D=papDef(),x=e.target;
  const c=x.closest("[data-dc]");if(c){const k=D.crit[+c.dataset.dc];if(x.dataset.dk)k[x.dataset.dk]=x.dataset.dk==="peso"?Math.max(0,+x.value||0):x.value.trim();if(x.dataset.dn!==undefined)k.niv[+x.dataset.dn]=x.value.trim()}
  else if(x.dataset.df)D.fin[x.dataset.df]=Math.max(0,+x.value||0);
  else if(x.dataset.dl!==undefined)D.niveis[+x.dataset.dl][+x.dataset.dlk]=Math.max(0,Math.min(20,+x.value||0));
  else if(x.hasAttribute("data-dh"))D.horas=x.value.split(/\n+/).map(s=>s.trim()).filter(Boolean);
  else if(x.dataset.dt)D[x.dataset.dt]=x.type==="checkbox"?x.checked:x.value.trim();
  else return;papGuardar(D);if(x.dataset.dk==="peso"||x.dataset.df||x.dataset.dl!==undefined)papDefUI()});
$("#papDefRepor").onclick=()=>{if(!papEd())return;if(!confirm("Repor os critérios, fórmulas, níveis, horas e textos da grelha original? As provas, as notas e os contactos não mudam."))return;
  const d0=PAP.def||{};PAP.def=papDef0();PAP.def.dped=d0.dped||"";papGuardar(PAP.def);papDefUI();toast("Valores originais repostos")};
// ----- navegação, apagar e PDF -----
document.querySelectorAll("#papInicio,#papProva,#papGrelha,#papDocs,#papJuri,#papDef").forEach(s=>s.addEventListener("click",e=>{
  const ir=e.target.closest("[data-papir]");if(ir){e.preventDefault();show(ir.dataset.papir);return}
  const ab=e.target.closest("[data-papabre]");if(ab){PAP_SEL.prova=ab.dataset.papabre;PAP_SEL.cand="";show(ab.dataset.papt);return}
  const dl=e.target.closest("[data-papdel]");if(dl&&papEd()){const P=PAP.provas.find(p=>p.id===dl.dataset.papdel);if(!P)return;
    if(!confirm(`Apagar a prova «${papNome(P)}», com ${P.cands.length} formando(s) e as notas das grelhas?\n\nIsto não se pode anular.`))return;
    if(P.cands.some(c=>papEstado(c).k!=="mu")&&prompt("Esta prova já tem notas. Para confirmar, escreva APAGAR")!=="APAGAR")return;
    PAP.provas=PAP.provas.filter(p=>p.id!==P.id);PAP.del[P.id]=Date.now();if(PAP_SEL.prova===P.id)PAP_SEL.prova="";papGuardar();papRender("papInicio");toast("Prova apagada");return}
  const pdf=e.target.closest("[data-pappdf]");if(pdf){const P=papProva();if(!P)return;const k=pdf.dataset.pappdf;let x=null;if(k==="ata"){x=papSessoes(P).find(s=>s.k===pdf.dataset.papses);if(!x)return}papBaixar(k,P,x)}}));
document.querySelectorAll("[data-papsel]").forEach(s=>s.addEventListener("change",e=>{PAP_SEL.prova=e.target.value;PAP_SEL.cand="";const P=papProva();if(P)PAP_SEL.ano=P.anoId;papRender(curTab)}));
$("#papNova").onclick=()=>{PAP_NOVA=true;PAP_IMP=null;papRender("papInicio")};
async function papBaixar(k,P,x){try{const doc=await papPdf(k,P,x);const nm={cham:"Pauta de Chamada",pres:"Folha de Presença",pauta:"Pauta de Avaliação PAP",atas:"Atas",ata:"Ata"+(x&&x.data?" "+x.data+(x.per==="t"?" tarde":" manhã"):""),grelhas:"Grelhas de Avaliação",grelha:"Grelha de Avaliação"+(x?" - "+x.nome:""),tudo:"PAP"}[k]||"PAP";
    doc.save(ficheiroNome(`${nm} - ${(papTurma(P)||{}).cod||P.curso||"PAP"} - ${papAnoDe(P).nome.replace("/","-")}.pdf`))}catch(e){console.warn(e);toast(e.message||"Não foi possível gerar o PDF")}}
async function papPdf(k,P,x){const J=await loadPDF(),doc=new J({unit:"mm",format:"a4"}),ctx={doc,first:true,pg(){if(this.first)this.first=false;else doc.addPage()}};
  const I=papInc(P);
  if(k==="cham")papPdfCham(ctx,P);else if(k==="pres")papPdfPres(ctx,P);else if(k==="pauta")papPdfPauta(ctx,P);else if(k==="ata")papPdfAta(ctx,P,x);
  else if(k==="atas")papSessoes(P).forEach(s=>papPdfAta(ctx,P,s));else if(k==="grelha")papPdfGrelha(ctx,P,x);else if(k==="grelhas")I.slice().sort(papOrdNome).forEach(c=>papPdfGrelha(ctx,P,c));
  else if(k==="tudo"){papPdfCham(ctx,P);papPdfPres(ctx,P);papSessoes(P).forEach(s=>papPdfAta(ctx,P,s));I.slice().sort(papOrdNome).forEach(c=>papPdfGrelha(ctx,P,c));papPdfPauta(ctx,P)}
  if(ctx.first){ctx.pg();doc.setFontSize(11);doc.text("Sem formandos para mostrar.",14,PDF_TOP+10)}
  pdfMoldura(doc,`${escData().nome||"Escola Profissional da Ilha de São Jorge"} · EPISJ 360 · PAP360 · ${pdfTxt(P.curso||"")}`,papFse(P));return doc}
const papW=doc=>doc.internal.pageSize.getWidth(),papHt=doc=>doc.internal.pageSize.getHeight();
function papPdfCab(doc,P,titulo){const W=papW(doc),f=papFse(P);let y=PDF_TOP+3;doc.setTextColor(25);doc.setFont("helvetica","bold");doc.setFontSize(11.5);
  doc.text(pdfTxt(escData().nome||"Escola Profissional da Ilha de São Jorge"),W/2,y,{align:"center"});y+=5;doc.setFont("helvetica","normal");doc.setFontSize(9.5);
  doc.text(pdfTxt("Ano Letivo "+papAnoDe(P).nome),W/2,y,{align:"center"});y+=4.5;doc.text(pdfTxt("Prova de Aptidão Profissional"+(P.fase&&P.fase!=="1"?" · "+papFaseTxt(P.fase):"")),W/2,y,{align:"center"});y+=8;
  doc.setFont("helvetica","bold");doc.setFontSize(14);doc.setTextColor(22,40,80);doc.text(pdfTxt(titulo),W/2,y,{align:"center"});y+=8;
  doc.setFontSize(9.5);doc.setTextColor(25);doc.text("Curso:",14,y);doc.setFont("helvetica","normal");const cw=f?W-14-27-66:W-14-27;const cl=doc.splitTextToSize(pdfTxt(P.curso||"-"),cw);doc.text(cl,27,y);
  if(f){doc.setFont("helvetica","bold");doc.text("Projeto:",W-14-64,y);doc.setFont("helvetica","normal");doc.text(pdfTxt(f),W-14-49,y)}return y+4*cl.length+3}
function papPdfAss(doc,y,L,ncol){ncol=ncol||2;const W=papW(doc),H=papHt(doc),cw=(W-28)/ncol,lh=ncol>3?15:19,linhas=Math.ceil(L.length/ncol),need=linhas*lh;
  if(y+need>H-PDF_BOT-2){doc.addPage();y=PDF_TOP+8}
  L.forEach(([r,n],i)=>{const row=Math.floor(i/ncol),noRow=Math.min(ncol,L.length-row*ncol),col=i%ncol,off=(ncol-noRow)/2,cx=14+cw*(col+off)+cw/2,yy=y+row*lh;
    doc.setFont("helvetica","normal");doc.setFontSize(ncol>3?7.8:8.8);doc.setTextColor(40);doc.text(pdfTxt(r||""),cx,yy,{align:"center"});doc.setDrawColor(120);doc.setLineWidth(.2);doc.line(cx-Math.min(30,cw/2-4),yy+(ncol>3?7:8),cx+Math.min(30,cw/2-4),yy+(ncol>3?7:8));
    doc.setFontSize(ncol>3?7.4:8.3);doc.setTextColor(90);if(n)doc.text(pdfTxt("("+n+")"),cx,yy+(ncol>3?10.5:12),{align:"center",maxWidth:cw-2})});return y+need}
function papPdfObs(doc,y,txt){const W=papW(doc),H=papHt(doc),t=pdfTxt(String(txt||"").trim());doc.setFont("helvetica","normal");doc.setFontSize(9);const L=t?doc.splitTextToSize(t,W-34):[];const h=Math.max(14,L.length*4.1+6);
  if(y+h+6>H-PDF_BOT-2){doc.addPage();y=PDF_TOP+6}doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(25);doc.text("Observações:",14,y);
  doc.setDrawColor(200);doc.setLineWidth(.2);doc.roundedRect(14,y+2,W-28,h,1.5,1.5);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(40);if(L.length)doc.text(L,17,y+7);return y+2+h}
function papPdfCham(ctx,P){ctx.pg();const doc=ctx.doc,D=papDef();let y=papPdfCab(doc,P,"Pauta de Chamada");const L=papInc(P).slice().sort(papOrdHora);
  y=pdfTabela(doc,y,["Número","Nome","Hora","Data"],L.map(c=>[c.num||"",c.nome,c.hora||"",papDMA(c.data)].map(pdfTxt)),{0:{cellWidth:24},2:{cellWidth:32},3:{cellWidth:24}});
  y=papPdfObs(doc,y+7,[P.local?"Local: "+P.local:"",P.obs.cham||""].filter(Boolean).join("\n"));papPdfAss(doc,y+9,[[D.rotResp,P.resp],[D.rotOrient,P.orient],[D.rotDped,P.dped]])}
function papPdfPres(ctx,P){ctx.pg();const doc=ctx.doc,D=papDef();let y=papPdfCab(doc,P,"Folha de Presença da Prova de Aptidão Profissional");const L=papInc(P).slice().sort(papOrdHora);
  y=pdfTabela(doc,y,["Número","Nome","Assinatura","Data"],L.map(c=>[c.num||"",c.nome,"",papDMA(c.data)].map(pdfTxt)),{0:{cellWidth:22},2:{cellWidth:72,minCellHeight:9},3:{cellWidth:22}});
  y=papPdfObs(doc,y+7,P.obs.pres||"");papPdfAss(doc,y+9,[[D.rotResp,P.resp],[D.rotOrient,P.orient],[D.rotDped,P.dped]])}
function papPdfPauta(ctx,P){ctx.pg();const doc=ctx.doc,D=papDef();let y=papPdfCab(doc,P,"Pauta de Avaliação");const L=papInc(P).slice().sort(papOrdNome);
  y=pdfTabela(doc,y,["Número","Nome","Nota","Data de Lançamento"],L.map(c=>{const f=papFinal(c);return[c.num||"",c.nome,f===null?"-":String(f),papDMA(c.lanc||c.data)].map(pdfTxt)}),{0:{cellWidth:24},2:{cellWidth:18,halign:"center",fontStyle:"bold"},3:{cellWidth:34}});
  y=papPdfObs(doc,y+7,P.obs.pauta||"");papPdfAss(doc,y+9,[[D.rotResp,P.resp],[D.rotOrient,P.orient],[D.rotDped,P.dped]])}
function papPdfPar(doc,y,t){const W=papW(doc),H=papHt(doc);doc.setFont("helvetica","normal");doc.setFontSize(9.8);doc.setTextColor(30);const s=pdfTxt(t),L=doc.splitTextToSize(s,W-28);
  if(y+L.length*4.4>H-PDF_BOT-2){doc.addPage();y=PDF_TOP+6}doc.text(s,14,y,{maxWidth:W-28,align:"justify",lineHeightFactor:1.25});return y+L.length*4.4+2}
function papPdfAta(ctx,P,s){ctx.pg();const doc=ctx.doc,D=papDef(),W=papW(doc),A=papAta(P,s);let y=papPdfCab(doc,P,"Ata da Reunião de Avaliação Final")+2;
  y=papPdfPar(doc,y,papAtaAbre(P,s));
  y=pdfTabela(doc,y+1,["Número","Nome","Classificação"],s.cands.map(c=>{const f=papFinal(c);return[c.num||"",c.nome,f===null?"-":D.ataNota?f+" valores":(f>=10?"Aprovado":"Não aprovado")].map(pdfTxt)}),{0:{cellWidth:24},2:{cellWidth:34}})+5;
  const it=[["Presidente da Reunião",P.dped||""],[D.rotResp,P.resp||""],[D.rotOrient,P.orient||""]].concat((s.juri.length?s.juri:["",""]).map(j=>[D.rotRep,j]));
  y=pdfTabela(doc,y,["Intervenientes","Nome","Rubrica"],it.map(r=>[r[0],r[1],""].map(pdfTxt)),{0:{cellWidth:62},2:{cellWidth:40,minCellHeight:8}})+6;
  y=papPdfPar(doc,y,String(D.ataMeio||"").replace(/\{resultado\}/g,papResultado(s.cands)).trim());y=papPdfPar(doc,y+1,D.ataFecho||"");
  doc.setFont("helvetica","normal");doc.setFontSize(9.8);doc.text(pdfTxt(`${D.localidade||"Velas"}, ${calDMA(s.data)}`),W/2,y+6,{align:"center"});
  papPdfAss(doc,y+16,[["O(a) Secretário(a)",A.sec||P.resp||""],["O(a) Presidente",P.dped||""]])}
function papPdfGrelha(ctx,P,c){ctx.pg();const doc=ctx.doc,D=papDef(),W=papW(doc),N=D.niveis,f=papFinal(c),cp=papCP(c),nf=papNF(c);let y=PDF_TOP+2;
  doc.setFont("helvetica","bold");doc.setFontSize(12.5);doc.setTextColor(22,40,80);doc.text(pdfTxt("Grelha de Avaliação da Prova de Aptidão Profissional"),W/2,y,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(60);doc.text(pdfTxt("Ano Letivo "+papAnoDe(P).nome+(P.fase&&P.fase!=="1"?" · "+papFaseTxt(P.fase):"")),W/2,y+4.6,{align:"center"});y+=11;
  const info=[[D.rotResp,P.resp],[D.rotOrient,P.orient],[D.rotDped,P.dped],["Curso",P.curso],["Projeto n.º",papFse(P)],["Tema",c.tema],["Nome do Formando",c.nome],["Número",c.num]];
  const y0=y;info.forEach(([l,v],i)=>{doc.setFont("helvetica","bold");doc.setFontSize(8.3);doc.setTextColor(40);doc.text(pdfTxt(l+":"),14,y+i*4.2);doc.setFont("helvetica","normal");doc.setTextColor(20);
    doc.text(pdfTxt(String(v||"").slice(0,110)),48,y+i*4.2,{maxWidth:W-14-48-52})});
  doc.autoTable({startY:y0-3.2,margin:{left:W-14-46,right:14},theme:"grid",tableWidth:46,body:N.map((r,j)=>["Nível "+(j+1),r[0]+"-"+r[1]]),styles:{font:"helvetica",fontSize:7.3,cellPadding:.8,lineColor:[226,230,235],lineWidth:.15,textColor:[40,44,52],halign:"center"},columnStyles:{0:{fillColor:[230,238,252],fontStyle:"bold"}}});
  const dl=c.data?papDMA(c.data):"";doc.setFont("helvetica","bold");doc.setFontSize(8.3);doc.text("Data:",W-14-46,doc.lastAutoTable.finalY+4.4);doc.setFont("helvetica","normal");doc.text(dl,W-14-36,doc.lastAutoTable.finalY+4.4);
  y=Math.max(y+info.length*4.2,doc.lastAutoTable.finalY+6)+1;
  doc.setFont("helvetica","italic");doc.setFontSize(7.3);doc.setTextColor(90);doc.text(pdfTxt("Assinalar nas quadrículas a nota atribuída pelo júri (um nível por critério)"),W-14,y,{align:"right"});y+=1.5;
  const lv=D.crit.map(k=>papNivel(papNum(c.n[k.id])));
  doc.autoTable({startY:y,margin:{top:PDF_TOP,bottom:PDF_BOT+2,left:14,right:14},theme:"grid",head:[["Critério"].concat(N.map((r,j)=>`Nível ${j+1}`))],
    body:D.crit.map((k,i)=>{const v=papNum(c.n[k.id]);return[`C${i+1} - ${k.tit}\n${k.desc}`].concat(N.map((r,j)=>(k.niv[j]||"")+(lv[i]===j&&v!==null?`\n> ${v} valores`:"")))}).map(r=>r.map(pdfTxt)),
    styles:{font:"helvetica",fontSize:6.4,cellPadding:1.1,overflow:"linebreak",lineColor:[214,219,226],lineWidth:.15,textColor:[45,50,58],valign:"top"},headStyles:{fillColor:[26,95,208],textColor:255,fontStyle:"bold",fontSize:7.3,halign:"center"},
    columnStyles:{0:{cellWidth:40,fontStyle:"bold",textColor:[25,30,40]}},
    didParseCell:h=>{if(h.section==="body"&&h.column.index>0&&lv[h.row.index]===h.column.index-1&&papNum(c.n[D.crit[h.row.index].id])!==null){h.cell.styles.fillColor=[248,236,251];h.cell.styles.fontStyle="bold";h.cell.styles.textColor=[22,40,80]}}});
  y=doc.lastAutoTable.finalY+4;const H=papHt(doc);if(y>H-PDF_BOT-64){doc.addPage();y=PDF_TOP+4}
  doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(22,40,80);doc.text("Resumo da Avaliação",14,y);y+=1.8;
  const yR=y;doc.autoTable({startY:yR,margin:{left:14,right:W-14-108},tableWidth:108,theme:"grid",body:D.crit.map((k,i)=>{const v=papNum(c.n[k.id]);return["C"+(i+1),k.nome,v===null?"-":String(v),v===null?"":papVal(v)].map(pdfTxt)}),
    styles:{font:"helvetica",fontSize:7,cellPadding:.75,lineColor:[226,230,235],lineWidth:.15,textColor:[40,44,52]},columnStyles:{0:{cellWidth:9,fontStyle:"bold"},2:{cellWidth:10,halign:"center",fontStyle:"bold"},3:{cellWidth:34}}});
  const yA=doc.lastAutoTable.finalY;
  doc.autoTable({startY:yR,margin:{left:W-14-70,right:14},tableWidth:70,theme:"grid",body:[["Classificação do Projeto (CP)",papFmt(cp)],["1.ª Avaliação Intermédia (CP1)",papFmt(papNum(c.cp1))],["2.ª Avaliação Intermédia (CP2)",papFmt(papNum(c.cp2))],["Nota Final PAP (NFPAP)",papFmt(nf)]].map(r=>r.map(pdfTxt)),
    styles:{font:"helvetica",fontSize:7,cellPadding:.75,lineColor:[226,230,235],lineWidth:.15,textColor:[40,44,52]},columnStyles:{1:{cellWidth:16,halign:"center",fontStyle:"bold"}}});
  doc.setFont("helvetica","normal");doc.setFontSize(6.6);doc.setTextColor(100);doc.text(pdfTxt(papFormulaCP()+"   ·   "+papFormulaNF()),W-14-70,doc.lastAutoTable.finalY+3.4,{maxWidth:70});
  y=Math.max(yA,doc.lastAutoTable.finalY+6)+4;
  doc.setFillColor(243,245,249);doc.roundedRect(14,y-4.6,W-28,8.4,1.4,1.4,"F");doc.setFont("helvetica","bold");doc.setFontSize(9.6);doc.setTextColor(22,40,80);
  doc.text(pdfTxt("CLASSIFICAÇÃO FINAL DA PROVA DE APTIDÃO PROFISSIONAL:"),17,y+.9);doc.text(pdfTxt(f===null?"-":`${f} ${papVal(f)}`),W-17,y+.9,{align:"right"});y+=8;
  doc.setFont("helvetica","normal");doc.setFontSize(8.8);doc.setTextColor(30);doc.text(pdfTxt(`${D.localidade||"Velas"}, ${c.data?calDMA(c.data):"____ de ______________ de ______"}`),14,y+1);
  papPdfAss(doc,y+6,[[D.rotResp,P.resp],[D.rotOrient,P.orient],[D.rotDped,P.dped],[D.rotJuri,c.j1],[D.rotJuri,c.j2]],5)}
