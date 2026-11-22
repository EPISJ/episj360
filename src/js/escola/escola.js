/* ===================== EPISJ 360 0.5: módulo Escola — anos letivos, cursos, turmas e formadores comuns a todos os módulos ===================== */
// Tudo fica em cfg.escola (com a restante configuração da EPISJ 360: anular/refazer, pontos de restauro e nuvem).
// Os formadores continuam em cfg.profs (o BoxCheck já os usava) e passam a servir todos os módulos.
function anoCorrente(){const d=new Date();return d.getMonth()>=7?d.getFullYear():d.getFullYear()-1}
function novoAno(y){return{id:uid(),nome:y+"/"+(y+1),ini:y,inicio:y+"-09-01",fim:(y+1)+"-06-30",ferias:[]}}
/* 0.9.132: anos letivos repetidos — a causa: quando a app abria sem dados (computador novo, outro navegador, antes de chegar a nuvem)
   criava sozinha um ano letivo com um id ao acaso; ao juntar com a nuvem (que junta pelo id) ficavam dois «2026/2027».
   Agora o ano criado sozinho tem um id fixo (ano-AAAA), igual em todos os computadores, e fica marcado como automático;
   se já houver outro com os mesmos anos de início e fim e o automático não tiver nada (nem interrupções nem dados ligados), sai sozinho.
   Nunca pode haver dois anos letivos com o mesmo nome ou com o mesmo ano de início e de fim. */
function anoAuto(y){const a=novoAno(y);a.id="ano-"+y;a.auto=1;return a}
function anoNomeChave(n){const m=String(n||"").match(/(\d{4})(?:\D+(\d{2,4}))?/);if(!m)return null;const i=+m[1];let f=m[2]?+m[2]:i+1;if(f<100)f=Math.floor(i/100)*100+f;return i+"/"+f}
function anoChave(a){return anoNomeChave(a&&a.nome)||((+a.ini||0)+"/"+((+a.ini||0)+1))}
// o ano letivo que já usa este nome ou os mesmos anos de início e de fim (ou null)
function anoIgual(nome,excetoId){const k=anoNomeChave(nome),n=norm(String(nome||""));return escData().anos.find(a=>a.id!==excetoId&&(norm(String(a.nome||""))===n||(k&&anoChave(a)===k)))||null}
// grupos de anos letivos repetidos: id -> lista do grupo
function anosRepetidos(){const G=new Map(),R=new Map();for(const a of escData().anos){const k=anoChave(a);if(!G.has(k))G.set(k,[]);G.get(k).push(a)}
  for(const L of G.values())if(L.length>1)for(const a of L)R.set(a.id,L);return R}
// quantas vezes o id do ano aparece nos dados (fora da própria lista dos anos)
function anoRefs(id){const q='"'+id+'"';let n=0;const conta=s=>{let i=-1;while((i=s.indexOf(q,i+1))>=0)n++};
  try{const E=cfg.escola||{},c=Object.assign({},cfg,{escola:Object.assign({},E,{anos:[],ativo:""})});delete c._del;conta(JSON.stringify(c))}catch(e){}
  try{conta(JSON.stringify(ESD))}catch(e){}try{conta(JSON.stringify(CR))}catch(e){}try{conta(JSON.stringify(PAP))}catch(e){}
  // os logótipos do ano: o rodapé posto sozinho (o de 2026/2027) não conta como dado do utilizador
  try{const L=Object.assign({},LOGOS,{anos:Object.assign({},LOGOS.anos||{})}),x=L.anos[id];if(x&&x.foot&&x.foot.nome==="fundos-2026-2027.png"&&Object.keys(x).length===1)delete L.anos[id];conta(JSON.stringify(L))}catch(e){}
  return n}
function anosSemAutoRepetidos(e){const G=new Map();for(const a of e.anos){const k=anoChave(a);if(!G.has(k))G.set(k,[]);G.get(k).push(a)}
  for(const L of G.values()){if(L.length<2)continue;const fica=L.find(a=>!a.auto)||L[0];
    for(const a of L)if(a!==fica&&a.auto&&!(a.ferias||[]).length&&a.nome===a.ini+"/"+(a.ini+1)&&!anoRefs(a.id)){e.anos=e.anos.filter(x=>x!==a);if(e.ativo===a.id)e.ativo=fica.id;
      try{const LA=LOGOS.anos;if(LA&&LA[a.id]){if(LA[fica.id]===undefined)LA[fica.id]=LA[a.id];delete LA[a.id];localStorage.setItem(LGKEY,JSON.stringify(LOGOS))}}catch(x){}}}}
function escData(){const e=cfg.escola&&typeof cfg.escola==="object"?cfg.escola:(cfg.escola={});
  e.nome=e.nome||"Escola Profissional da Ilha de São Jorge";
  for(const k of["anos","cursos","turmas","formandos","planos","disciplinas"])if(!Array.isArray(e[k]))e[k]=[];
  if(!e.anos.length){
    // o ano letivo da análise da Box (DTP 2026.2027), se houver; senão o ano letivo corrente
    let y=anoCorrente();try{const a=[...getIdx().anos.keys()];const m=a.length===1&&String(a[0]).match(/(\d{4})/);if(m)y=+m[1]}catch(x){}
    const a=anoAuto(y);e.anos.push(a);e.ativo=a.id}
  e.anos.forEach(a=>{if(!a.ini){const m=String(a.nome||"").match(/(\d{4})/);a.ini=m?+m[1]:anoCorrente()}if(!Array.isArray(a.ferias))a.ferias=[]});
  if(e.anos.length>1)anosSemAutoRepetidos(e);
  if(!e.anos.some(a=>a.id===e.ativo))e.ativo=e.anos.slice().sort((a,b)=>b.ini-a.ini)[0].id;
  calTiposSync();
  return e}
function anoAtivo(){const e=escData();return e.anos.find(a=>a.id===e.ativo)}
function anosOrd(){return escData().anos.slice().sort((a,b)=>a.ini-b.ini)}
function turmaNoAno(t,a){if(!a)return false;if(t.anoIni&&t.anoFim)return a.ini>=t.anoIni&&a.ini<t.anoFim;if(t.anoIni)return a.ini===t.anoIni;return true}
function turmasDoAno(a){a=a||anoAtivo();return escData().turmas.filter(t=>turmaNoAno(t,a)).sort((x,y)=>COLL_PTN.compare(String(x.cod),String(y.cod)))}
function cursoById(id){return escData().cursos.find(c=>c.id===id)||null}
function cursoDaTurma(nome){try{const t=escData().turmas.find(x=>norm(x.nome||"")===norm(nome));return t?cursoById(t.cursoId):null}catch(e){return null}}
function turmaNome(t){if(t.nome)return t.nome;const c=cursoById(t.cursoId),yy=n=>String(n).slice(-2);
  return t.cod+(c?" - "+c.nome:"")+(t.anoIni&&t.anoFim?` (${yy(t.anoIni)}/${yy(t.anoFim)})`:"")}
function anoCurricular(t,a){a=a||anoAtivo();if(!t.anoIni||!turmaNoAno(t,a))return"";return(a.ini-t.anoIni+1)+".º ano"}
function sigla(nome,usadas){const w=String(nome||"").normalize("NFD").replace(/[̀-ͯ]/g,"").split(/\s+/).filter(x=>x.length>2||/^[A-Z]/.test(x));
  let s=((w[0]||"X")[0]+(w.length>1?w[w.length-1][0]:(w[0]||"X")[1]||"")).toUpperCase(),b=s,i=2;
  while(usadas&&usadas.has(s))s=b+i++;if(usadas)usadas.add(s);return s}
function escLinhaMsg(id,t,k){const el=$(id);if(el)el.innerHTML=t?`<div class="msg ${k||"ok"}" style="margin:10px 0 0">${t}</div>`:""}

/* ---------- ano letivo no topo (comum a todos os módulos) ---------- */
const ANO_CURTO=matchMedia("(max-width:440px)");
const anoCurto=n=>{const m=String(n||"").match(/^(?:\d\d)?(\d\d)\s*[\/-]\s*(?:\d\d)?(\d\d)$/);return m?m[1]+"/"+m[2]:n};
function renderAnoTopo(){const s=$("#anoSel");if(!s)return;const e=escData(),c=ANO_CURTO.matches;
  s.innerHTML=anosOrd().map(a=>`<option value="${a.id}" ${a.id===e.ativo?"selected":""} title="${esc(a.nome)}">${esc(c?anoCurto(a.nome):a.nome)}</option>`).join("")}
try{(ANO_CURTO.addEventListener?ANO_CURTO.addEventListener("change",()=>renderAnoTopo()):ANO_CURTO.addListener(()=>renderAnoTopo()))}catch(e){}
$("#anoSel").addEventListener("change",e=>mudarAnoAtivo(e.target.value));
function mudarAnoAtivo(id){const e=escData();if(e.ativo===id)return;e.ativo=id;AY_VER=null;save();escRender();esRecarregar();aplicarLogos();try{renderDef()}catch(x){}toast("Ano letivo ativo: "+anoAtivo().nome)}

/* ---------- painel da escola ---------- */
/* 0.9.80: Painel da escola repensado — em vez de números soltos e avisos, um briefing do dia:
   saudação e o ponto do ano (dia letivo, período, linha do tempo), a saúde dos dados da escola num só número,
   uma lista "Para resolver" com o progresso de cada ponto e o atalho para o resolver, e os números da escola numa só faixa. */
function epPontos(){const e=escData(),a=anoAtivo(),T=turmasDoAno(a),P=cfg.profs||[],L=[];
  const add=(o)=>{if(o.tot>0)L.push(o)};
  add({k:"curso",t:"Turmas com curso",ok:T.filter(t=>cursoById(t.cursoId)).length,tot:T.length,ir:"tur",fx:"Atribuir cursos",p:5});
  add({k:"dt",t:"Turmas com orientador educativo",ok:T.filter(t=>t.dt).length,tot:T.length,ir:"tur",fx:"Atribuir orientadores",p:4});
  add({k:"mail",t:"Formadores com email",ok:P.filter(p=>/\S+@\S+\.\S+/.test(p.email||"")).length,tot:P.length,ir:"prof",fx:"Completar emails",p:4,nota:"sem email não entram na EPISJ 360 nem recebem avisos"});
  add({k:"fse",t:"Turmas com código FSE",ok:T.filter(t=>t.fse).length,tot:T.length,ir:"tur",fx:"Juntar códigos",p:2});
  add({k:"pc",t:"Turmas com plano curricular",ok:T.filter(t=>{try{return pcDe(t.id,a.id)}catch(x){return false}}).length,tot:T.length,ir:"pc",fx:"Fazer planos",p:3});
  add({k:"cnq",t:"Cursos ligados ao Catálogo",ok:e.cursos.filter(c=>c.qual).length,tot:e.cursos.length,ir:"cur",fx:"Ligar ao Catálogo",p:2});
  const op=e.cursos.filter(c=>(c.itens||[]).some(i=>i.opc)&&c.opcH);
  add({k:"opc",t:"Cursos com as UFCD opcionais escolhidas",ok:op.filter(c=>{const es=new Set(c.opcEsc||[]);return hSoma((c.itens||[]).filter(i=>i.opc&&es.has(i.cod)))>=c.opcH}).length,tot:op.length,ir:"cur",fx:"Escolher opcionais",p:2});
  if(modOn("eduschedule")){const st=mhEstado();if(st){const C=st.cards||[];add({k:"hor",t:"Blocos colocados no horário",ok:C.filter(c=>c.day!=null).length,tot:C.length,ir:"esch",fx:"Abrir o Horários360",p:3})}
    else if(T.length)L.push({k:"hor",t:`Horário de ${a.nome}`,ok:0,tot:1,ir:"esch",fx:"Começar o horário",p:3,txt:"por fazer"})}
  if(modOn("crono")){try{const M=crMotor(a),me=crMeuId();let n=0,tot=0;for(const X of M.turmas.values()){const r=crTurmaRes(X,me);for(const o of r.L){tot++;if(o.est==="risco"||o.est==="semhorario")n++}}
    add({k:"crono",t:"Disciplinas a caminho de cumprir o plano",ok:tot-n,tot,ir:"crPs",fx:"Ver o ponto de situação",p:3})}catch(x){}}
  try{const FER=calFeriados(a),util=d=>{const w=calD(d).getDay();return w>0&&w<6};const f=FER.filter(x=>util(x.data)&&(!a.inicio||x.data>=a.inicio)&&(!a.fim||x.data<=a.fim));
    const cob=f.filter(x=>(a.ferias||[]).some(y=>y&&y.de&&x.data>=y.de&&x.data<=(y.ate||y.de))).length;add({k:"fer",t:"Feriados marcados no calendário",ok:cob,tot:f.length,ir:"anos",fx:"Marcar feriados",p:1})}catch(x){}
  return L}
function epSaude(L){let s=0,w=0;for(const x of L){s+=x.p*(x.ok/x.tot);w+=x.p}return w?Math.round(s/w*100):100}
function renderEscPainel(){
  // no arranque o painel é desenhado antes de as funções de datas e dos widgets existirem: espera pelo fim do arranque e volta a desenhar
  try{calHoje;calDM;hSoma;modOn;wgPct}catch(x){try{$("#escNome").value=escData().nome}catch(_){}setTimeout(()=>{try{if(curTab==="esc")renderEscPainel()}catch(e){console.warn("painel",e)}},0);return}
  const e=escData(),a=anoAtivo(),T=turmasDoAno(a),hj=calHoje(),hr=new Date().getHours();
  $("#escNome").value=e.nome;
  const nome=EU&&EU.nome?String(EU.nome).split(/\s+/)[0]:"";
  $("#epGreet").textContent=(hr<6?"Boa noite":hr<12?"Bom dia":hr<20?"Boa tarde":"Boa noite")+(nome?", "+nome:"");
  // o ponto do ano
  let lin=[calDM(hj,{weekday:"long",day:"numeric",month:"long"})];const N=ayNumeros(a);
  if(N.tot&&a.inicio&&a.fim){if(hj<a.inicio)lin.push(`${esc(a.nome)} começa daqui a ${calDias(hj,a.inicio)} dias`);else if(hj>a.fim)lin.push(`${esc(a.nome)} terminou`);
    else{const NL=N.NL,w=calD(hj).getDay(),letivo=w>0&&w<6&&!NL.has(hj),x=NL.get(hj);
      lin.push(letivo?`<b>${N.feitos+1}.º dia letivo</b> de ${N.tot}`:x?`<b>${esc(x.n)}</b> — sem aulas`:"fim de semana");
      let P=[];try{P=calPeriodos(a)}catch(_){}const np=calPeriodoDe(a,hj,P),p=P.find(z=>z.n===np);if(p){const f=calLetivos(a,hj,p.fim,NL);lin.push(`${np}.º período: ${f===0?"acabou":f===1?"falta 1 dia":`faltam ${f} dias`}`)}}}
  $("#epDate").innerHTML=lin.join(" · ");
  $("#epFita").innerHTML=N.tot?ayFita(a,N).replace(/<div class="ay-leg">[\s\S]*$/,""):"";
  // saúde dos dados e o que falta resolver
  const L=epPontos(),sd=epSaude(L),R=L.filter(x=>x.ok<x.tot).sort((x,y)=>y.p*(1-y.ok/y.tot)-x.p*(1-x.ok/x.tot)),OK=L.filter(x=>x.ok>=x.tot);
  $("#epScore").innerHTML=`<b style="color:${sd>=85?"var(--ok)":sd>=60?"#b45309":"#b91c1c"}">${sd}%</b>dados da escola completos · ${OK.length} de ${L.length} pontos em ordem`;
  const vz=!e.cursos.length&&!e.turmas.length;
  $("#escAvisos").innerHTML=vz?`<div class="msg info" style="margin:0">Ainda não há cursos nem turmas. Use <b>Importar turmas e cursos da Box</b> ou crie-os em <a href="#" data-ir="cur">Cursos</a> e <a href="#" data-ir="tur">Turmas</a>.</div>`
    :R.length?R.map(x=>{const pc=Math.round(x.ok/x.tot*100),f=x.tot-x.ok,cor=pc>=80?"#d97706":pc>=40?"#ea580c":"#dc2626";
      return `<button class="ep-it" data-ir="${x.ir}" title="${esc(x.fx)}"><span class="ep-n" style="--c:${cor}">${x.txt?"!":f}</span><span class="ep-tx"><b>${esc(x.t)}</b><small>${x.txt?esc(x.txt):`${x.ok} de ${x.tot}`}${x.nota?" · "+esc(x.nota):""}</small><i class="ep-bar"><i style="width:${pc}%;background:${cor}"></i></i></span><span class="ep-go">${esc(x.fx)} →</span></button>`}).join("")
      +(OK.length?`<div class="ep-oks">${OK.map(x=>`<span>✓ ${esc(x.t)}</span>`).join("")}</div>`:"")
    :`<div class="wg-okm">✓ Tudo em ordem para ${esc(a.nome)} — ${L.length} pontos verificados.</div>`;
  $("#epTodoN").textContent=R.length?R.length:"";
  // os números da escola numa faixa
  const st=modOn("eduschedule")?mhEstado():null,C=st?st.cards||[]:[],pos=C.filter(c=>c.day!=null).length;
  $("#escTiles").innerHTML=[[T.length,"Turmas neste ano","tur"],[e.cursos.length,"Cursos","cur"],[(cfg.profs||[]).length,"Formadores","prof"],[(e.formandos||[]).length,"Formandos","for"],[`${T.filter(t=>{try{return pcDe(t.id,a.id)}catch(x){return false}}).length}/${T.length}`,"Planos curriculares","pc"]]
    .concat(modOn("eduschedule")?[[C.length?wgPct(pos,C.length)+"%":"—","Horário colocado","esch"]]:[])
    .map(([v,l,t])=>`<button class="ay-st ep-k" data-ir="${t}"><small>${esc(l)}</small><b>${esc(v)}</b></button>`).join("");
  try{renderWidgets()}catch(x){}}
$("#escNome").addEventListener("change",e=>{escData().nome=e.target.value.trim()||"Escola Profissional da Ilha de São Jorge";save();esRecarregar()});
$("#esc").addEventListener("click",e=>{const b=e.target.closest(".ep-hero [data-ir]");if(!b)return;e.preventDefault();const t=b.dataset.ir;if(t==="esch")mostrarModulo("eduschedule",true);else show(t)});

$("#escImport").onclick=()=>escImportarBox();
$("#escImport2").onclick=()=>escImportarBox();

