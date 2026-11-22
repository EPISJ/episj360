/* ===================== EPISJ 360 0.9.21: widgets do Painel da escola ===================== */
// 20 widgets; cada um só aparece se o seu módulo estiver ligado. Cada pessoa escolhe os que vê (fica guardado neste navegador).
const WG_KEY="guide_widgets",WG_PADRAO=["aniv","ano","cal","incompletas","profs","entregas","prazo","top","horario","agora","esphoje","proxres","meudia"];
const WG_MOD={escola:{l:"E",c:"#ff8a5c",n:"Escola360"},boxcheck:{l:"B",c:"#4da3ff",n:"Box360"},eduschedule:{l:"H",c:"#9b8cff",n:"Horários360"},roomcheck:{l:"S",c:"#ffb547",n:"Sala360"}};
let WG_SEL=(()=>{try{const v=JSON.parse(localStorage.getItem(WG_KEY)||"null");return Array.isArray(v)?v:WG_PADRAO.slice()}catch(e){return WG_PADRAO.slice()}})();
const wgGuardar=()=>{try{localStorage.setItem(WG_KEY,JSON.stringify(WG_SEL))}catch(e){}prefsAgendar()};
// 0.9.146: o widget «Aniversários» aparece uma vez a quem já tinha escolhido os seus widgets (depois pode tirá-lo)
function wgAnivMig(){try{if(localStorage.getItem("g360_wg_aniv"))return;localStorage.setItem("g360_wg_aniv","1");const b=typeof WG_SEL2!=="undefined"&&Array.isArray(WG_SEL2)?WG_SEL2:[];if(!WG_SEL.includes("aniv")&&!b.includes("aniv")){WG_SEL.unshift("aniv");wgGuardar()}}catch(e){}}
const modOn=m=>!MODS_OFF.includes(m)&&!!primeiroPermitido(m);
const wgAgora=()=>{const n=new Date();return n.getHours()*60+n.getMinutes()};
const wgPct=(a,b)=>b?Math.round(a*100/b):0;
const wgBarra=(p,cor)=>`<div class="wg-bar"><i style="width:${Math.max(0,Math.min(100,p))}%${cor?";background:"+cor:""}"></i></div>`;
const wgVazio=t=>`<p class="wg-vz">${t}</p>`;
const wgIr=(t,txt)=>`<button class="wg-ir" data-wgir="${t}">${txt||"Abrir"} →</button>`;
const wgDM=s=>{const d=rcData(s);return d.toLocaleDateString("pt-PT",{day:"numeric",month:"short"}).replace(".","")};
const wgDias=s=>Math.round((rcData(s)-rcData(rcHoje()))/864e5);
const wgHa=t=>{const m=Math.round((Date.now()-t)/6e4);return m<1?"agora mesmo":m<60?"há "+m+" min":m<1440?"há "+Math.round(m/60)+" h":m<2880?"ontem":"há "+Math.round(m/1440)+" dias"};
const wgNum=(v,l,cl)=>`<div class="wg-n${cl?" "+cl:""}"><b>${v}</b><span>${l}</span></div>`;
function wgEval(){try{if(!lastListing)return null;const ev=evaluate();return ev&&ev.length?ev:null}catch(e){return null}}
const wgSemBox=()=>wgVazio(`Ainda não há análise da Box neste computador.`)+wgIr("box","Abrir a Análise");
function wgEu(){const em=String(EU&&EU.email||"").toLowerCase();return em?cfg.profs.find(p=>String(p.email||"").toLowerCase()===em)||null:null}
// aulas de um dia (índice 0 = segunda) no horário do ano ativo; filtro opcional por formador do Horários360
function wgAulas(st,dia,tid){const les=new Map((st.lessons||[]).map(l=>[l.id,l])),TT=new Map((st.teachers||[]).map(t=>[t.id,t])),CC=new Map((st.classes||[]).map(c=>[c.id,c])),SS=new Map((st.subjects||[]).map(x=>[x.id,x])),RR=new Map((st.rooms||[]).map(x=>[x.id,x])),out=[];
  for(const cd of st.cards||[]){if(cd.day!==dia)continue;const l=les.get(cd.lessonId);if(!l)continue;
    (l.linhas||[]).forEach((x,i)=>{if(tid&&x.t!==tid)return;const s=SS.get(x.s)||{},rr=(cd.rx&&cd.rx[0])||cd.r||[],sala=RR.get(rr[i])||RR.get(x.r);
      out.push({p0:cd.period,len:cd.len||1,s:s.short||s.name||"—",cor:s.color||"#2f5fb8",prof:(TT.get(x.t)||{}).short||(TT.get(x.t)||{}).name||"",turmas:(l.classIds||[]).map(id=>(CC.get(id)||{}).name).filter(Boolean).join(", "),sala:sala?sala.name:""})})}
  return out.sort((a,b)=>a.p0-b.p0)}
const wgPer=(st,i)=>{const p=(st.periods||[])[i]||{};return{a:rcMin(p.start),b:rcMin(p.end),l:p.start||String(i+1)}};

const WIDGETS=[
 {id:"ano",mod:"escola",nome:"Progresso do ano letivo",desc:"Quanto já passou do ano, semanas que faltam e a próxima interrupção",r(){
   const a=anoAtivo(),h=rcHoje(),ini=a.inicio||a.ini+"-09-01",fim=a.fim||(a.ini+1)+"-06-30",tot=Math.max(1,(rcData(fim)-rcData(ini))/864e5),dec=Math.min(tot,Math.max(0,(rcData(h)-rcData(ini))/864e5)),p=wgPct(dec,tot);
   const F=(a.ferias||[]).filter(x=>x.de&&x.ate).sort((x,y)=>x.de.localeCompare(y.de)),ag=F.find(x=>x.de<=h&&x.ate>=h),px=F.find(x=>x.de>h);
   const sem=Math.max(0,Math.ceil(wgDias(fim)/7));
   return `<div class="wg-big">${h<ini?"—":p+"%"}</div>${wgBarra(h<ini?0:p)}
     <p class="wg-t">${h<ini?`Começa a <b>${wgDM(ini)}</b> (daqui a ${wgDias(ini)} dias).`:h>fim?`Terminou a ${wgDM(fim)}.`:`Faltam <b>${sem}</b> semana${sem===1?"":"s"} — termina a ${wgDM(fim)}.`}</p>
     <p class="wg-t">${ag?`${ico("cal")} Agora: <b>${esc(ag.nome||"interrupção")}</b>, até ${wgDM(ag.ate)}.`:px?`Próxima interrupção: <b>${esc(px.nome||"interrupção")}</b>, de ${wgDM(px.de)} a ${wgDM(px.ate)} (daqui a ${wgDias(px.de)} dias).`:`Sem interrupções marcadas. `+wgIr("anos","Marcar")}</p>`}},
 {id:"aniv",mod:"escola",nome:"Aniversários",desc:"Formandos e formadores que fazem anos hoje e nos próximos 14 dias, com um atalho para dar os parabéns por email",r(){
   const E=escData(),TC=new Map(E.turmas.map(t=>[t.id,t.cod])),L=[];
   for(const f of E.formandos||[]){if(f.estado||!f.nasc)continue;const d=forAniv(f.nasc);if(d!=null&&d<=14)L.push({d,n:f.nome,id:(forIdade(f.nasc)||0)+(d?1:0),q:TC.get(f.turmaId)?"formando · "+TC.get(f.turmaId):"formando",em:formandoEmail(f),nasc:f.nasc})}
   for(const p of cfg.profs||[]){if(!p.nasc)continue;const d=forAniv(p.nasc);if(d!=null&&d<=14)L.push({d,n:p.nome,id:(forIdade(p.nasc)||0)+(d?1:0),q:"formador",em:String(p.email||"").trim(),nasc:p.nasc,pf:1})}
   L.sort((a,b)=>a.d-b.d||COLL_PT.compare(a.n,b.n));
   const semF=(cfg.profs||[]).filter(p=>!p.nasc).length,semA=(E.formandos||[]).filter(f=>!f.estado&&!f.nasc).length;
   const parab=x=>x.em?`<a class="wg-ir" href="mailto:${esc(x.em)}?subject=${encodeURIComponent("Parabéns!")}&body=${encodeURIComponent(`Olá ${String(x.n).split(/\s+/)[0]},\n\nMuitos parabéns pelo seu aniversário! Desejamos-lhe um excelente dia.\n\nEscola Profissional da Ilha de São Jorge`)}" title="Escrever a ${esc(x.em)}">Dar os parabéns</a>`:"";
   const av=x=>`<span class="frav sm" style="--c:${forCor(x.n)}">${esc(forIni(x.n))}</span>`;
   const hoje=L.filter(x=>x.d===0),prox=L.filter(x=>x.d>0);
   const quando=d=>{if(d===1)return "amanhã";const t=new Date();t.setHours(0,0,0,0);t.setDate(t.getDate()+d);return t.toLocaleDateString("pt-PT",{weekday:"short",day:"numeric",month:"short"}).replace(/\./g,"")};
   let h="";
   if(hoje.length)h+=`<div class="wg-aniv-hoje"><div class="wg-aniv-t">Hoje faz${hoje.length>1?"em":""} anos</div>${hoje.map(x=>`<div class="wg-aniv-p">${av(x)}<span><b>${esc(x.n)}</b><small>${x.id?x.id+" anos · ":""}${esc(x.q)}</small></span>${parab(x)}</div>`).join("")}</div>`;
   if(prox.length)h+=`<div class="wg-lst">${prox.slice(0,8).map(x=>`<div class="wg-li">${av(x)}<span class="wg-el" style="flex:1;min-width:0"><b style="font-weight:600">${esc(x.n)}</b><br><small style="color:var(--muted)">${esc(x.q)}${x.id?" · faz "+x.id+" anos":""}</small></span><i class="wg-tag${x.d<=3?" w":""}">${esc(quando(x.d))}</i></div>`).join("")}${prox.length>8?`<p class="wg-t">e mais ${prox.length-8} nos próximos 14 dias.</p>`:""}</div>`;
   if(!L.length)h+=wgVazio("Ninguém faz anos nos próximos 14 dias.");
   if(semF||semA)h+=`<p class="wg-t" style="margin-top:8px;color:var(--muted)">Sem data de nascimento: ${[semA?`${semA} formando(s)`:"",semF?`${semF} formador(es)`:""].filter(Boolean).join(" e ")}.</p>${semF?wgIr("prof","Formadores"):""}${semA?wgIr("for","Formandos"):""}`;
   return h}},
 {id:"anocur",mod:"escola",nome:"Turmas por ano curricular",desc:"Quantas turmas há no 1.º, 2.º e 3.º ano e quais terminam este ano",r(){
   const a=anoAtivo(),T=turmasDoAno(a);if(!T.length)return wgVazio("Ainda não há turmas neste ano letivo.")+wgIr("tur","Criar turmas");
   const G=new Map();T.forEach(t=>{const k=anoCurricular(t,a)||"sem ano de início";(G.get(k)||G.set(k,[]).get(k)).push(t)});const mx=Math.max(...[...G.values()].map(x=>x.length));
   const fim=T.filter(t=>t.anoFim===a.ini+1);
   return [...G.entries()].sort().map(([k,L])=>`<div class="wg-row"><span class="wg-k">${esc(k)}</span>${wgBarra(L.length*100/mx)}<b>${L.length}</b></div><div class="wg-sub">${L.map(t=>esc(t.cod)).join(" · ")}</div>`).join("")
     +`<p class="wg-t">${fim.length?`Terminam este ano: <b>${fim.map(t=>esc(t.cod)).join(", ")}</b>`:"Nenhuma turma termina este ano."}</p>`}},
 {id:"incompletas",mod:"escola",nome:"Turmas com dados por completar",desc:"Turmas sem curso, sem orientador educativo ou sem código FSE",r(){
   const T=turmasDoAno();if(!T.length)return wgVazio("Ainda não há turmas neste ano letivo.")+wgIr("tur","Criar turmas");
   const L=T.map(t=>({t,f:[!cursoById(t.cursoId)&&"curso",!turmaOE(t)&&"orientador educativo",!t.fse&&"código FSE"].filter(Boolean)})).filter(x=>x.f.length);
   if(!L.length)return `<div class="wg-okm">✓ Todas as ${T.length} turmas têm curso, orientador educativo e código FSE.</div>`;
   return `<p class="wg-t"><b>${L.length}</b> de ${T.length} turmas por completar:</p><div class="wg-lst">${L.map(x=>`<div class="wg-li"><b>${esc(x.t.cod)}</b><span>${x.f.map(f=>`<i class="wg-tag w">sem ${f}</i>`).join("")}</span></div>`).join("")}</div>`+wgIr("tur","Completar em Turmas")}},
 {id:"fse",mod:"escola",nome:"Projetos FSE",desc:"Turmas agrupadas pelo código da operação do Fundo Social Europeu",r(){
   const T=turmasDoAno();if(!T.length)return wgVazio("Ainda não há turmas neste ano letivo.");
   const G=new Map(),sem=[];T.forEach(t=>{if(!t.fse){sem.push(t);return}(G.get(t.fse)||G.set(t.fse,[]).get(t.fse)).push(t)});
   return (G.size?`<div class="wg-lst">${[...G.entries()].sort().map(([k,L])=>`<div class="wg-li"><code class="wg-code">${esc(k)}</code><span>${L.map(t=>esc(t.cod)).join(", ")}</span></div>`).join("")}</div>`:wgVazio("Nenhuma turma tem código FSE."))
     +(sem.length?`<p class="wg-t wg-w">Sem código: <b>${sem.map(t=>esc(t.cod)).join(", ")}</b> ${wgIr("tur","Juntar")}</p>`:"")}},
 {id:"cnq",mod:"escola",nome:"Cursos e Catálogo",desc:"Cursos por ligar ao Catálogo Nacional de Qualificações ou com UFCD opcionais por escolher",r(){
   const C=escData().cursos;if(!C.length)return wgVazio("Ainda não há cursos.")+wgIr("cur","Criar cursos");
   const L=C.map(c=>{const it=c.itens||[],op=it.filter(i=>i.opc),es=new Set(c.opcEsc||[]),hE=hSoma(op.filter(i=>es.has(i.cod))),req=c.opcH||0;
     const tp=op.length&&req?escData().turmas.filter(t=>t.cursoId===c.id&&turmaPlanoProprio(t)&&!opcEscolhidasOk(c,t.planoCur)).map(t=>t.cod):[];
     return{c,p:!c.qual?"por ligar ao Catálogo":op.length&&req&&hE<req?`opcionais: ${hE} h de ${req} h`:tp.length?`opcionais por escolher: ${tp.join(", ")}`:""}}).filter(x=>x.p);
   if(!L.length)return `<div class="wg-okm">✓ Os ${C.length} cursos estão ligados ao Catálogo e com as opcionais escolhidas.</div>`;
   return `<div class="wg-lst">${L.map(x=>`<div class="wg-li"><span class="wg-el">${esc(x.c.nome)}</span><i class="wg-tag w">${esc(x.p)}</i></div>`).join("")}</div>`+wgIr("cur","Abrir Cursos")}},
 {id:"profs",mod:"escola",nome:"Formadores",desc:"Total, sem email do Office 365 (não conseguem entrar) e orientadores educativos",r(){
   const P=cfg.profs,sem=P.filter(p=>!/\S+@\S+\.\S+/.test(p.email||"")),T=turmasDoAno(),dts=new Set(T.map(t=>turmaOE(t)).filter(Boolean));
   return `<div class="wg-ns">${wgNum(P.length,"formadores")}${wgNum(sem.length,"sem email",sem.length?"w":"")}${wgNum(dts.size,"orientadores educativos")}</div>`
     +(sem.length?`<p class="wg-t wg-w">Sem email (não entram na EPISJ 360 nem recebem avisos): ${sem.slice(0,6).map(p=>esc(p.nome)).join(", ")}${sem.length>6?` e mais ${sem.length-6}`:""}</p>`:"")+wgIr("prof","Abrir Formadores")}},
 {id:"entregas",mod:"boxcheck",nome:"Entregas do ano",desc:"Percentagem entregue face ao previsto e como evoluiu nos últimos envios",r(){
   const ev=wgEval();if(!ev)return wgSemBox();const all=ev.flatMap(e=>e.items),ok=all.filter(i=>i.ok).length,p=wgPct(ok,all.length);
   const n={warn:all.filter(i=>i.state==="warn"||i.state==="modelo").length,blank:all.filter(i=>i.state==="blank").length,miss:all.filter(i=>i.state==="missing").length};
   const E=(cfg.envios||[]).slice(0,8).reverse(),mx=Math.max(1,...E.map(x=>x.n||0));
   return `<div class="wg-big">${p}%</div>${wgBarra(p,"var(--ok,#16a34a)")}<p class="wg-t"><b>${ok}</b> de ${all.length} documentos entregues · <b>${n.miss}</b> em falta${n.blank?` · ${n.blank} vazios`:""}${n.warn?` · ${n.warn} a confirmar`:""}</p>`
     +(E.length>1?`<div class="wg-spark" title="Documentos em falta em cada envio registado">${E.map(x=>`<i style="height:${Math.max(6,(x.n||0)*100/mx)}%" title="${esc(new Date(x.t).toLocaleDateString("pt-PT"))}: ${x.n} em falta"></i>`).join("")}</div><p class="wg-sub">Em falta nos últimos ${E.length} envios registados</p>`:"")+wgIr("rel","Ver o relatório")}},
 {id:"prazo",mod:"boxcheck",nome:"Próximo prazo",desc:"Nome, data, dias que faltam e quantos documentos ainda faltam",r(){
   const agora=Date.now(),P=prazos().filter(p=>p.ativo&&pd(p.data)&&fimPrazo(p)>=agora).sort((a,b)=>fimPrazo(a)-fimPrazo(b));
   if(!P.length)return wgVazio("Não há prazos por cumprir.")+wgIr("pra","Marcar prazos");const p=P[0],d=wgDias(p.data),ev=wgEval();
   let h=`<div class="wg-big sm">${esc(p.nome||"Prazo")}</div><p class="wg-t">até <b>${wgDM(p.data)}</b> — ${d<=0?"<b>termina hoje</b>":d===1?"falta <b>1 dia</b>":`faltam <b>${d} dias</b>`}</p>`;
   if(ev){const c=contar(prazoItens(p)),tot=c.prazo+c.atraso+c.falta+c.pendente,ok=c.prazo+c.atraso;h+=wgBarra(wgPct(ok,tot),"var(--ok,#16a34a)")+`<p class="wg-t"><b>${ok}</b> de ${tot} entregues · <b>${c.pendente+c.falta}</b> por entregar</p>`}
   if(P.length>1)h+=`<p class="wg-sub">Depois: ${P.slice(1,3).map(x=>esc(x.nome||"prazo")+" ("+wgDM(x.data)+")").join(" · ")}</p>`;return h+wgIr("pra","Abrir Prazos")}},
 {id:"top",mod:"boxcheck",nome:"Quem mais falta entregar",desc:"Os 5 formadores com mais documentos em falta, com atalho para avisar",r(){
   const ev=wgEval();if(!ev)return wgSemBox();const T=byTeacher(ev).filter(t=>t.p.id!=="_"&&t.miss>0).slice(0,5);
   if(!T.length)return `<div class="wg-okm">✓ Ninguém tem documentos em falta.</div>`;
   return `<div class="wg-lst">${T.map(t=>`<div class="wg-li"><span class="wg-el">${esc(t.p.nome)}</span><span class="wg-mini">${wgBarra(wgPct(t.ok,t.tot),"var(--ok,#16a34a)")}</span><b class="wg-bad">${t.miss}</b></div>`).join("")}</div>`+wgIr("env","Enviar avisos")}},
 {id:"turmasbox",mod:"boxcheck",nome:"Turmas mais atrasadas",desc:"Percentagem de entregas por turma, da mais baixa para a mais alta",r(){
   const ev=wgEval();if(!ev)return wgSemBox();const G=new Map();ev.forEach(e=>{const k=e.mod.turma||"(sem turma)",g=G.get(k)||G.set(k,{ok:0,t:0}).get(k);e.items.forEach(i=>{g.t++;if(i.ok)g.ok++})});
   const L=[...G.entries()].filter(([,g])=>g.t).map(([k,g])=>({k,p:wgPct(g.ok,g.t),g})).sort((a,b)=>a.p-b.p).slice(0,8);if(!L.length)return wgVazio("Sem documentos atribuídos.");
   return L.map(x=>`<div class="wg-row"><span class="wg-k wg-el" title="${esc(x.k)}">${esc(x.k.split(/\s+-\s+/)[0])}</span>${wgBarra(x.p,x.p<50?"var(--bad,#dc2626)":x.p<80?"var(--warn,#d97706)":"var(--ok,#16a34a)")}<b>${x.p}%</b></div>`).join("")+wgIr("rel","Ver o relatório")}},
 {id:"ultimas",mod:"boxcheck",nome:"Últimas entregas",desc:"Os últimos ficheiros que chegaram à Box, quem os entregou e quando",r(){
   if(!lastListing)return wgSemBox();const F=(lastListing.itens||[]).filter(x=>x.type==="file").map(x=>({x,t:Date.parse(x.ca||x.modified_at||"")||0})).filter(o=>o.t).sort((a,b)=>b.t-a.t).slice(0,7);
   if(!F.length)return wgVazio("Sem ficheiros na análise.");
   return `<div class="wg-lst">${F.map(({x,t})=>{const pp=String(x.path||"").split("/").filter(Boolean);return `<div class="wg-li col"><span class="wg-el"><b>${esc(x.name)}</b></span><span class="wg-sub">${esc(x.by||"")}${x.by?" · ":""}${esc(pp.slice(-2).join(" › "))} · ${wgHa(t)}</span></div>`}).join("")}</div>`
     +`<p class="wg-sub">Análise de ${wgHa(lastListing.t||Date.now())}.</p>`}},
 {id:"avisos",mod:"boxcheck",nome:"Avisos automáticos",desc:"Próximos envios marcados e os últimos enviados (com os que falharam)",r(){
   const agora=Date.now(),R=[];for(const p of prazos()){if(!p.ativo)continue;for(const a of p.avisos||[]){if(!a.ativo)continue;const t=proxima(p,a,agora);if(t)R.push({t,p,a})}}R.sort((a,b)=>a.t-b.t);
   const U=AVL.slice(-4).reverse(),fmt=t=>new Date(t).toLocaleString("pt-PT",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
   return `<p class="wg-k2">Próximos</p>${R.length?`<div class="wg-lst">${R.slice(0,3).map(r=>`<div class="wg-li"><span class="wg-el">${esc(r.p.nome||"Prazo")}</span><span class="wg-sub">${fmt(r.t)}</span></div>`).join("")}</div>`:wgVazio("Sem envios marcados.")}
     <p class="wg-k2">Últimos</p>${U.length?`<div class="wg-lst">${U.map(x=>`<div class="wg-li"><span class="wg-el">${esc(x.nome||"")}</span><i class="wg-tag ${x.ok?"o":"b"}">${x.ok?"enviado":"falhou"}</i><span class="wg-sub">${fmt(x.t)}</span></div>`).join("")}</div>`:wgVazio("Ainda não saiu nenhum aviso deste computador.")}
     <p class="wg-sub">${avCfg().servidor?ico("cloud")+" Enviados pelo serviço da EPISJ 360, mesmo com o computador desligado.":avCfg().auto?"Enviados a partir deste navegador.":"Envio automático desligado."}</p>`+wgIr("pra","Abrir Prazos")}},
 {id:"estbox",mod:"boxcheck",nome:"Estado da Box",desc:"Ligação à Box, última análise, pastas excluídas e serviço de avisos",r(){
   const nF=lastListing?(lastListing.itens||[]).filter(x=>x.type==="file").length:0,ex=Object.keys(cfg.excluir||{}).length,A=avCfg(),e=SRV.estado;
   return `<div class="wg-lst">
     <div class="wg-li"><span>Ligação à Box</span><i class="wg-tag ${SES?"o":"w"}">${SES?"ligada":"por ligar"}</i></div>
     <div class="wg-li"><span>Última análise</span><b>${lastListing?wgHa(lastListing.t||0):"—"}</b></div>
     <div class="wg-li"><span>Ficheiros analisados</span><b>${nF}</b></div>
     <div class="wg-li"><span>Pastas excluídas</span><b>${ex}</b></div>
     <div class="wg-li"><span>Serviço de avisos</span><i class="wg-tag ${A.servidor?(SRV.erro||e&&e.erro?"b":"o"):""}">${A.servidor?(SRV.erro||e&&e.erro?"com erro":"ligado"):"não usado"}</i></div>
     ${A.servidor&&e?`<div class="wg-li"><span>Última verificação</span><b>${e.ultimo?wgHa(e.ultimo):"—"}</b></div>`:""}</div>`+wgIr("box","Abrir a Análise")}},
 {id:"horario",mod:"eduschedule",nome:"Estado dos horários",desc:"Turmas com horário completo, tempos por colocar e se já foi publicado",r(){
   const st=mhEstado();if(!st)return wgVazio(`Ainda não há horário para ${esc(anoAtivo().nome)}.`)+wgIr("esch","Abrir o Horários360");
   const C=st.cards||[],pos=C.filter(c=>c.day!=null).length,les=new Map((st.lessons||[]).map(l=>[l.id,l])),falta=new Map();
   C.filter(c=>c.day==null).forEach(c=>{const l=les.get(c.lessonId);(l&&l.classIds||[]).forEach(id=>falta.set(id,(falta.get(id)||0)+(c.len||1)))});
   const CL=st.classes||[],compl=CL.filter(c=>!falta.get(c.id)).length,nm=new Map(CL.map(c=>[c.id,c.name]));
   return `<div class="wg-big">${wgPct(pos,C.length)}%</div>${wgBarra(wgPct(pos,C.length),"#7c3aed")}<p class="wg-t"><b>${pos}</b> de ${C.length} blocos colocados · <b>${compl}</b> de ${CL.length} turmas completas</p>`
     +(falta.size?`<p class="wg-sub">Por colocar: ${[...falta.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([id,n])=>`${esc(nm.get(id)||"?")} (${n})`).join(" · ")}</p>`:"")
     +`<p class="wg-t">${podePublicar()?(PUBT?`Publicado ${wgHa(PUBT)}.`:`<span class="wg-w">Ainda não publicado para formadores e formandos.</span>`):""}</p>`+wgIr("esch","Abrir o Horários360")}},
 {id:"agora",mod:"eduschedule",nome:"Agora na escola",desc:"O tempo letivo em curso, as aulas a decorrer e as salas ocupadas",r(){
   const st=mhEstado();if(!st)return wgVazio("Ainda não há horário publicado.");const dia=(new Date().getDay()+6)%7,D=st.days||[];
   if(dia>=D.length)return wgVazio("Hoje não há aulas. Bom fim de semana!");
   const P=(st.periods||[]).map((_,i)=>wgPer(st,i)),m=wgAgora(),pi=P.findIndex(p=>m>=p.a&&m<p.b);
   if(pi<0){const nx=P.findIndex(p=>p.a>m);return wgVazio(nx<0?"As aulas de hoje já terminaram.":m<(P[0]||{}).a?`As aulas começam às <b>${rcHm(P[0].a)}</b>.`:`Intervalo — o próximo tempo começa às <b>${rcHm(P[nx].a)}</b>.`)}
   const L=wgAulas(st,dia).filter(x=>pi>=x.p0&&pi<x.p0+x.len),salas=new Set(L.map(x=>x.sala).filter(Boolean));
   return `<p class="wg-t"><b>${rcHm(P[pi].a)}–${rcHm(P[pi].b)}</b> · ${L.length} aula${L.length===1?"":"s"} · ${salas.size} sala${salas.size===1?"":"s"} ocupada${salas.size===1?"":"s"}</p>`
     +(L.length?`<div class="wg-lst">${L.slice(0,8).map(x=>`<div class="wg-li"><i class="wg-dot" style="background:${esc(x.cor)}"></i><b>${esc(x.turmas||"—")}</b><span class="wg-el">${esc(x.s)}${x.prof?" · "+esc(x.prof):""}</span><span class="wg-sub">${esc(x.sala)}</span></div>`).join("")}</div>`:wgVazio("Sem aulas neste tempo."))}},
 {id:"carga",mod:"eduschedule",nome:"Carga dos formadores",desc:"Tempos semanais colocados por formador, com a média da escola",r(){
   const st=mhEstado();if(!st)return wgVazio("Ainda não há horário.");const les=new Map((st.lessons||[]).map(l=>[l.id,l])),M=new Map();
   for(const c of st.cards||[]){if(c.day==null)continue;const l=les.get(c.lessonId);if(!l)continue;new Set((l.linhas||[]).map(x=>x.t).filter(Boolean)).forEach(t=>M.set(t,(M.get(t)||0)+(c.len||1)))}
   const T=(st.teachers||[]).map(t=>({n:t.name+(t.short?" ("+t.short+")":""),v:M.get(t.id)||0})).sort((a,b)=>b.v-a.v);if(!T.length)return wgVazio("Sem formadores no horário.");
   const mx=Math.max(1,T[0].v),med=T.reduce((s,t)=>s+t.v,0)/T.length;
   return `<p class="wg-t">Média: <b>${med.toFixed(1)}</b> tempos por semana</p><div class="wg-scr">${T.map(t=>`<div class="wg-row"><span class="wg-k wg-el" title="${esc(t.n)}">${esc(t.n)}</span>${wgBarra(t.v*100/mx,t.v>med*1.25?"var(--warn,#d97706)":t.v<med*.6?"#94a3b8":"#7c3aed")}<b>${t.v}</b></div>`).join("")}</div>`}},
 {id:"esphoje",mod:"roomcheck",nome:"Espaços hoje",desc:"Cada espaço com os tempos do dia, livres ou ocupados",r(){
   const h=rcHoje(),T=rcTempos(),E=RC.esp.filter(e=>e.on),A=rcAtivas().filter(r=>r.d===h).concat(rcAulas(h)),m=wgAgora();if(!E.length)return wgVazio("Sem espaços reserváveis.");
   return `<div class="wg-esp" style="--n:${T.length}"><span></span>${T.map(t=>`<i class="hd${m>=t[0]&&m<t[1]?" ag":""}">${rcHm(t[0])}</i>`).join("")}
     ${E.map(e=>`<b style="--c:${esc(e.c)}" title="${esc(e.n)}">${esc(e.sg||e.n)}</b>${T.map(t=>{const r=A.find(r=>r.e===e.id&&r.h0<t[1]&&r.h1>t[0]);return `<i class="${r?"oc":""}${t[1]<=m?" ps":""}" style="--c:${esc(e.c)}" ${r?`data-wgrc="${esc(r.id)}" title="${esc(r.p+(r.t?" · "+r.t:""))}"`:`title="Livre"`}></i>`}).join("")}`).join("")}</div>
     <p class="wg-sub">${A.length?A.length+" reserva"+(A.length>1?"s":"")+" hoje · clique num tempo ocupado para ver":"Sem reservas hoje — tudo livre."}</p>`+wgIr("rcMapa","Abrir o mapa")}},
 {id:"proxres",mod:"roomcheck",nome:"Próximas reservas",desc:"As próximas 5 reservas de espaços",r(){
   const h=rcHoje(),m=wgAgora(),L=rcAtivas().filter(r=>r.d>h||(r.d===h&&r.h1>m)).sort((a,b)=>a.d.localeCompare(b.d)||a.h0-b.h0).slice(0,5);
   if(!L.length)return wgVazio("Não há reservas marcadas.")+wgIr("rcMapa","Reservar");
   return `<div class="wg-lst">${L.map(r=>{const e=rcE(r.e);return `<div class="wg-li"><i class="wg-dot" style="background:${esc(e.c)}"></i><span class="wg-el"><b>${esc(e.sg||e.n)}</b> · ${r.d===h?"hoje":esc(rcDia(r.d,{weekday:"short",day:"numeric",month:"short"}))} · ${rcHm(r.h0)}–${rcHm(r.h1)}<br><span class="wg-sub">${esc(r.p)}${r.t?" · "+esc(r.t):""}</span></span><button class="b s" data-wgrc="${esc(r.id)}">Ver</button></div>`}).join("")}</div>`}},
 {id:"ocup",mod:"roomcheck",nome:"Ocupação da semana",desc:"Percentagem dos tempos letivos ocupados em cada espaço nesta semana",r(){
   const s0=rcSeg(rcHoje()),dias=[0,1,2,3,4].map(i=>rcMais(s0,i)),T=rcTempos(),tm=T.reduce((s,t)=>s+t[1]-t[0],0)*dias.length,A=rcAtivas().filter(r=>dias.includes(r.d)).concat(dias.flatMap(d=>rcAulas(d))),E=RC.esp.filter(e=>e.on);
   const L=E.map(e=>{let oc=0;A.filter(r=>r.e===e.id).forEach(r=>T.forEach(t=>{oc+=Math.max(0,Math.min(r.h1,t[1])-Math.max(r.h0,t[0]))}));return{e,p:wgPct(oc,tm),n:A.filter(r=>r.e===e.id).length}}).sort((a,b)=>b.p-a.p);
   return L.map(x=>`<div class="wg-row"><span class="wg-k wg-el" title="${esc(x.e.n)}"><i class="wg-dot" style="background:${esc(x.e.c)}"></i>${esc(x.e.n)}</span>${wgBarra(x.p,x.e.c)}<b>${x.p}%</b></div>`).join("")
     +`<p class="wg-sub">Semana de ${wgDM(dias[0])} a ${wgDM(dias[4])} · ${A.length} reserva${A.length===1?"":"s"}</p>`+wgIr("rcMapa","Abrir o mapa")}},
 {id:"meudia",mod:"escola",nome:"O meu dia",desc:"Formador: as aulas de hoje, as entregas e as reservas. Direção: os 3 alertas mais urgentes",r(){
   const pf=perfilAtual(),h=rcHoje(),m=wgAgora();
   if(pf==="prof"||pf==="form"){const me=wgEu(),st=modOn("eduschedule")?mhEstado():null,dia=(new Date().getDay()+6)%7;let out="";
     if(st&&pf==="prof"){const t=me&&(st.teachers||[]).find(t=>t.id===me.id||(ESD.mapaT||{})[t.id]===me.id),L=t?wgAulas(st,dia,t.id):[];
       out+=`<p class="wg-k2">Aulas de hoje</p>`+(L.length?`<div class="wg-lst">${L.map(x=>{const a=wgPer(st,x.p0),b=wgPer(st,x.p0+x.len-1);return `<div class="wg-li${m>=a.a&&m<b.b?" ag":""}"><b>${rcHm(a.a)}</b><span class="wg-el">${esc(x.s)} · ${esc(x.turmas)}</span><span class="wg-sub">${esc(x.sala)}</span></div>`}).join("")}</div>`:wgVazio(t?"Sem aulas hoje.":"Não encontrei o seu horário."))}
     if(modOn("boxcheck")&&pf==="prof")out+=`<p class="wg-k2">Entregas</p>`+wgIr("meu","Ver o que me falta entregar");
     if(modOn("roomcheck")){const R=rcAtivas().filter(r=>(me&&r.pid===me.id||r.p===(EU&&EU.nome))&&(r.d>h||(r.d===h&&r.h1>m))).sort((a,b)=>a.d.localeCompare(b.d)||a.h0-b.h0).slice(0,3);
       out+=`<p class="wg-k2">As minhas reservas</p>`+(R.length?`<div class="wg-lst">${R.map(r=>`<div class="wg-li"><i class="wg-dot" style="background:${esc(rcE(r.e).c)}"></i><span class="wg-el">${esc(rcE(r.e).n)} · ${r.d===h?"hoje":esc(rcDia(r.d,{weekday:"short",day:"numeric"}))} · ${rcHm(r.h0)}</span></div>`).join("")}</div>`:wgVazio("Sem reservas marcadas."))}
     return out||wgVazio("Nada para mostrar hoje.")}
   // Direção: os 3 alertas mais urgentes de todos os módulos
   const al=[];const T=turmasDoAno();
   if(modOn("boxcheck")){const P=prazos().filter(p=>p.ativo&&pd(p.data)&&fimPrazo(p)>=Date.now()).sort((a,b)=>fimPrazo(a)-fimPrazo(b))[0];
     if(P){const d=wgDias(P.data);let falta="";try{if(lastListing){const c=contar(prazoItens(P));falta=c.pendente+c.falta}}catch(e){}if(d<=14&&falta!==0)al.push({u:100-d,t:`Prazo <b>${esc(P.nome||"")}</b> ${d<=0?"termina hoje":"em "+d+" dia"+(d===1?"":"s")}${falta?` — ${falta} documentos por entregar`:""}`,ir:"pra"})}
     if(!SES)al.push({u:40,t:"A Box não está ligada neste computador.",ir:"box"})}
   if(modOn("eduschedule")){const st=mhEstado();if(!st)al.push({u:55,t:`Ainda não há horário para ${esc(anoAtivo().nome)}.`,ir:"esch"});else{const f=(st.cards||[]).filter(c=>c.day==null).length;if(f)al.push({u:60,t:`${f} bloco${f>1?"s":""} do horário por colocar.`,ir:"esch"})}}
   if(modOn("roomcheck")){const A=rcAtivas().filter(r=>r.d===h&&r.h1>m);if(A.length)al.push({u:30,t:`${A.length} reserva${A.length>1?"s":""} de espaços ainda hoje.`,ir:"rcMapa"})}
   const inc=T.filter(t=>!cursoById(t.cursoId)||!turmaOE(t)||!t.fse).length;if(inc)al.push({u:45,t:`${inc} turma${inc>1?"s":""} com dados por completar.`,ir:"tur"});
   const sm=cfg.profs.filter(p=>!/\S+@\S+\.\S+/.test(p.email||"")).length;if(sm)al.push({u:50,t:`${sm} formador${sm>1?"es":""} sem email — não conseguem entrar.`,ir:"prof"});
   al.sort((a,b)=>b.u-a.u);
   return `<p class="wg-t">Bom dia${EU&&EU.nome?", "+esc(EU.nome.split(/\s+/)[0]):""}! ${al.length?"O mais urgente:":""}</p>`+(al.length?`<div class="wg-lst">${al.slice(0,3).map((a,i)=>`<div class="wg-li"><b class="wg-nr">${i+1}</b><span style="flex:1;min-width:0;line-height:1.35">${a.t}</span><button class="b s" data-wgir="${a.ir}">Ver</button></div>`).join("")}</div>`:`<div class="wg-okm">✓ Nada urgente — está tudo em dia.</div>`)}}
];

// 0.9.133: widgets de módulos que só são carregados quando é preciso — o conteúdo (WG_R[id]) vem com o ecrã do módulo
const WG_R={};
function wgLazy(m,id){if(typeof WG_R[id]==="function")return WG_R[id]();
  modCarregar(m).then(()=>{if(curTab==="esc")try{renderWidgets()}catch(e){}}).catch(()=>{});return wgVazio("A carregar…")}
/* 0.9.184: um Dashboard para cada perfil — widgets que cada perfil pode ver e os que aparecem por omissão
   (a quem ainda não escolheu os seus). A Direção pode ver todos; os outros perfis só os que lhes dizem respeito. */
const WG_PERFIL={
  dexec:{a:["ano","cal","aniv","entregas","top","ecorep","fdreq","papprox","s3sem","fse"],b:["crcump","carga","ocup","turmasbox","estbox","cnq"]},
  dped:{a:["ano","cal","aniv","incompletas","entregas","prazo","top","crcump","crmods","horario","agora"],b:["papprox","carga","anocur","turmasbox","ultimas","esphoje","proxres","avisos"]},
  prof:{a:["meudia","agora","cal","prazo","crmods","aniv"],b:["ano","esphoje","proxres"],pode:["meudia","agora","cal","prazo","crmods","aniv","ano","esphoje","proxres","ocup","papprox"]},
  form:{a:["meudia","cal","ano"],b:[],pode:["meudia","cal","ano"]},
  econ:{a:["ecorep","ano","cal"],b:["aniv"],pode:["ecorep","ano","cal","aniv"]}};
function wgPerfilAtual(){let p="";try{p=perfilAtual()}catch(e){}if(!PREV&&EU&&EU.admin)return "dexec";return WG_PERFIL[p]?p:"prof"}
function wgPodePerfil(id){const P=WG_PERFIL[wgPerfilAtual()];return !P.pode||P.pode.includes(id)}
function wgVisiveis(){return WIDGETS.filter(w=>modOn(w.mod)&&wgPodePerfil(w.id))}
// quem nunca escolheu os seus widgets fica com os do seu perfil
function wgPadraoDoPerfil(){const P=WG_PERFIL[wgPerfilAtual()];WG_SEL=P.a.slice();WG_SEL2=P.b.filter(id=>!WG_SEL.includes(id));try{renderWidgets()}catch(e){}}
// 0.9.24: duas zonas de widgets (cada uma com a sua escolha); um widget só aparece numa zona de cada vez
const WG_PADRAO2=["crcump","anocur","fse","cnq","ultimas","carga","ocup","crmods"];
let WG_SEL2=(()=>{try{const v=JSON.parse(localStorage.getItem(WG_KEY+"2")||"null");return Array.isArray(v)?v:WG_PADRAO2.filter(id=>!WG_SEL.includes(id))}catch(e){return WG_PADRAO2.slice()}})();
const WGZ={1:{grid:"#wgGrid",conta:"#wgConta",get sel(){return WG_SEL},set sel(v){WG_SEL=v},padrao:WG_PADRAO,nome:"Widgets"},
           2:{grid:"#wgGrid2",conta:"#wgConta2",get sel(){return WG_SEL2},set sel(v){WG_SEL2=v},padrao:WG_PADRAO2,nome:"Mais widgets"}};
wgAnivMig();
const wgGuardarZ=()=>{try{localStorage.setItem(WG_KEY,JSON.stringify(WG_SEL));localStorage.setItem(WG_KEY+"2",JSON.stringify(WG_SEL2))}catch(e){}prefsAgendar()};
function renderWidgets(){if(!window.__wgOk)return; // só depois de a app arrancar (antes disso nem tudo está definido)
  const vis=new Set(wgVisiveis().map(w=>w.id));
  for(const z of [1,2]){const Z=WGZ[z],g=$(Z.grid);if(!g)continue;const L=Z.sel.map(id=>WIDGETS.find(w=>w.id===id)).filter(w=>w&&vis.has(w.id));
    $(Z.conta).textContent=`${L.length} widget${L.length===1?"":"s"}`;
    g.innerHTML=L.length?L.map(w=>{const M=WG_MOD[w.mod];let c;try{c=w.r()}catch(e){console.warn(w.id,e);c=wgVazio("Não foi possível mostrar este widget.")}
      return `<div class="wg" data-wg="${w.id}" style="--mc:${M.c}"><div class="wg-h"><b title="${esc(M.n)}">${esc(w.nome)}</b><button class="wg-x" data-wgx="${w.id}" title="Esconder este widget" aria-label="Esconder ${esc(w.nome)}">×</button></div><div class="wg-c">${c}</div></div>`}).join("")
      :`<div class="wg-none">Nenhum widget nesta zona. Arraste para aqui um widget da outra zona ou <button class="b s" data-wgesc="${z}">escolha widgets</button>.</div>`;
    wgArrumar(g)}}
// encaixe sem buracos: cada widget ocupa as linhas (de 4 px) que a sua altura pede
const wgRO=window.ResizeObserver?new ResizeObserver(es=>{for(const e of es)wgSpan(e.target)}):null;
let WG_ESC=0;function wgEscala(){if(WG_ESC)return WG_ESC;const d=document.createElement("div");d.style.cssText="position:absolute;visibility:hidden;height:100px;width:1px";document.body.appendChild(d);WG_ESC=d.getBoundingClientRect().height/100||1;d.remove();setTimeout(()=>WG_ESC=0,0);return WG_ESC}
function wgSpan(w){if(!w.isConnected)return;w.style.gridRowEnd="span "+Math.max(1,Math.ceil((w.getBoundingClientRect().height/wgEscala()+14)/4))} // 0.9.80: altura em px da página, mesmo com A+/A−
function wgArrumar(g){g.querySelectorAll(":scope>.wg").forEach(w=>{wgSpan(w);if(wgRO)wgRO.observe(w)})}
// arrastar pelo título: muda a ordem e a zona (o widget mexe-se na grelha enquanto se arrasta)
function wgArrastar(ev,w){if(ev.button!==0||ev.target.closest("button"))return;const x0=ev.clientX,y0=ev.clientY,G=[$("#wgGrid"),$("#wgGrid2")].filter(Boolean);let fant=null,dx=0,dy=0,ult=null;
  const mover=m=>{if(!fant){if(Math.hypot(m.clientX-x0,m.clientY-y0)<6)return;const r=w.getBoundingClientRect();dx=x0-r.left;dy=y0-r.top;
      fant=w.cloneNode(true);fant.classList.add("wg-fant");fant.style.width=r.width+"px";document.body.appendChild(fant);w.classList.add("wg-src");document.body.classList.add("wg-arr")}
    m.preventDefault();fant.style.left=m.clientX-dx+"px";fant.style.top=m.clientY-dy+"px";
    const el=document.elementFromPoint(m.clientX,m.clientY),g=el&&el.closest(".wg-grid");G.forEach(x=>x.classList.toggle("wg-alvo",x===g));if(!g)return;
    const os=[...g.querySelectorAll(":scope>.wg")].filter(o=>o!==w);let ref=null,depois=false;
    const t=os.find(o=>{const r=o.getBoundingClientRect();return m.clientX>=r.left&&m.clientX<=r.right&&m.clientY>=r.top&&m.clientY<=r.bottom});
    if(t){const r=t.getBoundingClientRect();depois=m.clientY>r.top+r.height/2;ref=t}
    else if(os.length){let best=null,bd=1e9;os.forEach(o=>{const r=o.getBoundingClientRect(),d=Math.hypot(m.clientX-(r.left+r.width/2),m.clientY-(r.top+r.height/2));if(d<bd){bd=d;best=o}});ref=best;const r=best.getBoundingClientRect();depois=m.clientY>r.top+r.height/2}
    const k=(ref?ref.dataset.wg:"")+"|"+depois+"|"+g.id;if(k===ult)return;ult=k;
    const vz=g.querySelector(".wg-none");if(vz)vz.remove();
    if(!ref)g.appendChild(w);else g.insertBefore(w,depois?ref.nextSibling:ref);G.forEach(wgArrumar)};
  const largar=()=>{document.removeEventListener("pointermove",mover);document.removeEventListener("pointerup",largar);document.removeEventListener("pointercancel",largar);
    if(!fant)return;fant.remove();w.classList.remove("wg-src");document.body.classList.remove("wg-arr");G.forEach(x=>x.classList.remove("wg-alvo"));
    const ids=g=>g?[...g.querySelectorAll(":scope>.wg")].map(o=>o.dataset.wg):[];const a=ids($("#wgGrid")),b=ids($("#wgGrid2"));
    // guarda a nova ordem (os widgets escolhidos mas escondidos por módulo desligado ficam no fim da sua zona)
    WG_SEL=a.concat(WG_SEL.filter(id=>!a.includes(id)&&!b.includes(id)));WG_SEL2=b.concat(WG_SEL2.filter(id=>!a.includes(id)&&!b.includes(id)));
    wgGuardarZ();renderWidgets()};
  document.addEventListener("pointermove",mover);document.addEventListener("pointerup",largar);document.addEventListener("pointercancel",largar)}
["#wgGrid","#wgGrid2"].forEach(gs=>$(gs).addEventListener("pointerdown",e=>{const h=e.target.closest(".wg-h");if(h&&!e.target.closest("button")){e.preventDefault();wgArrastar(e,h.parentElement)}}));
window.addEventListener("resize",()=>{clearTimeout(window.__wgRz);window.__wgRz=setTimeout(()=>document.querySelectorAll(".wg-grid").forEach(wgArrumar),120)});
function wgEscolher(z){z=+z||1;const Z=WGZ[z],O=WGZ[z===1?2:1],sel=new Set(Z.sel),out=new Set(O.sel),mods=Object.keys(WG_MOD);
  rcAbrir(Z.nome+" — escolher",`<p class="hint" style="margin-top:0">Escolha os que quer ver nesta zona. Só aparecem os dos módulos ligados; a escolha fica guardada neste navegador. Um widget só está numa zona de cada vez: escolher aqui um que está na outra zona muda-o para esta.</p>
    <div class="row" style="margin-bottom:10px"><button class="b s" id="wgTodos">Todos os que sobram</button><button class="b s" id="wgNenhum">Nenhum</button><button class="b s" id="wgRepor">Repor os sugeridos</button></div>
    ${mods.map(m=>{const M=WG_MOD[m],on=modOn(m);return `<div class="wg-pg"><div class="wg-ph" style="--mc:${M.c}">${esc(M.n)}${on?"":` <i class="wg-tag">módulo desligado</i>`}</div>
      ${WIDGETS.filter(w=>w.mod===m).map(w=>`<label class="wg-op${on?"":" off"}"><input type="checkbox" data-wgc="${w.id}"${sel.has(w.id)?" checked":""}${on?"":" disabled"}><span><b>${esc(w.nome)}${out.has(w.id)?` <i class="wg-tag">na outra zona</i>`:""}</b><small>${esc(w.desc)}</small></span></label>`).join("")}</div>`}).join("")}
    <div class="row" style="margin-top:12px"><button class="b" id="wgOk">Feito</button></div>`);
  const ler=()=>{const s=new Set([...document.querySelectorAll("[data-wgc]:checked")].map(x=>x.dataset.wgc));
    Z.sel=Z.sel.filter(id=>s.has(id)).concat(WIDGETS.map(w=>w.id).filter(id=>s.has(id)&&!Z.sel.includes(id)));O.sel=O.sel.filter(id=>!s.has(id));wgGuardarZ();renderWidgets()};
  document.querySelectorAll("[data-wgc]").forEach(x=>x.onchange=ler);
  const marcar=f=>{document.querySelectorAll("[data-wgc]:not(:disabled)").forEach(x=>x.checked=f(x.dataset.wgc));ler()};
  $("#wgTodos").onclick=()=>marcar(id=>sel.has(id)||!out.has(id)||document.querySelector(`[data-wgc="${id}"]`).checked);
  $("#wgNenhum").onclick=()=>marcar(()=>false);$("#wgRepor").onclick=()=>marcar(id=>Z.padrao.includes(id));$("#wgOk").onclick=rcFechar}
$("#wgEsc").onclick=()=>wgEscolher(1);$("#wgEsc2").onclick=()=>wgEscolher(2);
["#wgGrid","#wgGrid2"].forEach((gs,k)=>$(gs).addEventListener("click",e=>{const z=k+1,Z=WGZ[z];
  const q=e.target.closest("[data-wgesc]");if(q){wgEscolher(+q.dataset.wgesc);return}
  const x=e.target.closest("[data-wgx]");if(x){Z.sel=Z.sel.filter(id=>id!==x.dataset.wgx);wgGuardarZ();renderWidgets();toast("Widget escondido — volte a pô-lo em Escolher widgets");return}
  const r=e.target.closest("[data-wgrc]");if(r){rcVer(RC.res[r.dataset.wgrc]);return}
  const b=e.target.closest("[data-wgir]");if(b){const t=b.dataset.wgir;if(t==="esch")mostrarModulo("eduschedule",true);else show(t)}}));
setInterval(()=>{if(curTab==="esc"&&document.visibilityState==="visible"&&$("#rcDw").hidden)renderWidgets()},60000);

/* 0.9.94: Definições › Temas — «360» (o original) e «Cobalto» (inspirado no aspeto da Box). Fica no navegador (g360_tema,
   aplicado logo no <head> para não piscar) e na conta, com as outras preferências (prefsDados().tema) */
const TEMAS=[{id:"360",nome:"360",ds:"O aspeto original da EPISJ 360: menu claro, letra Poppins e o azul da escola.",side:"#fbfcfd",si:"#c5ccd8",sa:"#ffffff",bg:"#f8f9fb",btn:"#163269"},
  {id:"cobalto",nome:"Cobalto",ds:"Inspirado no aspeto da Box: menu lateral azul-cobalto com letra branca, conteúdo branco e tabelas leves.",side:"#3d5c9e",si:"rgba(255,255,255,.55)",sa:"#2f4a86",bg:"#ffffff",btn:"#2d58b8"}];
/* 0.9.177: deixa de haver escolha de temas — o Cobalto é o único, aplicado sempre e automaticamente (a preferência antiga é ignorada) */
function temaAtual(){return "cobalto"}
function temaAplicar(t,sinc){document.documentElement.setAttribute("data-tema","cobalto");try{esTemaSinc()}catch(e){}}
function renderTemas(){}
temaAplicar();

/* 0.9.95: modo de privacidade e código de desbloqueio.
   · O código (4–8 algarismos) nunca é guardado em claro: guarda-se SHA-256(sal + email + código), com um sal aleatório.
   · Fica no navegador (g360_priv = {email:{h,sal,min}}) e na conta (prefsDados().priv), por isso vale em todos os aparelhos.
   · Bloqueado = g360_priv_on (email). O <head> aplica html[data-priv=on] antes de desenhar: recarregar a página não desbloqueia.
   · Depois de 5 tentativas erradas espera 30 s. «Esqueci-me do código» termina a sessão do Office 365: voltar a entrar prova
     quem é e desbloqueia (o código mantém-se; pode mudá-lo nas Definições). */
const PRIV_LS="g360_priv",PRIV_ON="g360_priv_on";
function privEmail(){return String(EU&&EU.email||localStorage.getItem(PRIV_ON)||"").toLowerCase()}
function privTudo(){try{return JSON.parse(localStorage.getItem(PRIV_LS)||"{}")||{}}catch(e){return{}}}
function privDe(em){const o=privTudo()[em||privEmail()];return o&&typeof o==="object"?o:null}
function privGravar(o,sinc){const em=privEmail();if(!em)return;const T=privTudo();if(o)T[em]=o;else delete T[em];try{localStorage.setItem(PRIV_LS,JSON.stringify(T))}catch(e){}
  if(sinc!==false)try{prefsAgendar()}catch(e){}renderPriv()}
async function privHash(sal,em,cod){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(sal+"|"+em+"|"+cod));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("")}
const privValido=c=>/^\d{4,8}$/.test(c);
async function privConfere(cod){const o=privDe();if(!o||!o.h)return false;return (await privHash(o.sal,privEmail(),cod))===o.h}
function privBloqueado(){return document.documentElement.getAttribute("data-priv")==="on"}
function privBloquear(){const o=privDe();if(!o||!o.h){show("def");setTimeout(()=>{const c=$("#privCard");if(c)c.scrollIntoView({behavior:"smooth",block:"center"});const n=$("#privNovo");if(n)n.focus()},120);toast("Defina primeiro um código de desbloqueio");return}
  try{localStorage.setItem(PRIV_ON,privEmail())}catch(e){}document.documentElement.setAttribute("data-priv","on");try{pwBloquear(true)}catch(e){}privEcra()}
function privEcra(){if(!privBloqueado())return;const em=localStorage.getItem(PRIV_ON)||"";$("#privQuem").textContent=em?`Modo de privacidade ligado (${em}). Escreva o código de desbloqueio para continuar.`:"Modo de privacidade ligado. Escreva o código de desbloqueio para continuar.";
  document.querySelectorAll("body>*:not(#privLock)").forEach(x=>{try{x.inert=true}catch(e){}});$("#privErr").textContent="";const i=$("#privCod");i.value="";setTimeout(()=>i.focus(),60)}
function privDesbloquear(){try{localStorage.removeItem(PRIV_ON)}catch(e){}document.documentElement.removeAttribute("data-priv");document.querySelectorAll("body>*").forEach(x=>{try{x.inert=false}catch(e){}});PRIV_ULT=Date.now()}
var PRIV_ERR=0,PRIV_ESP=0,PRIV_ULT=Date.now();
$("#privForm").addEventListener("submit",async e=>{e.preventDefault();const i=$("#privCod"),c=i.value.trim(),err=$("#privErr");
  if(Date.now()<PRIV_ESP){err.textContent=`Muitas tentativas. Espere ${Math.ceil((PRIV_ESP-Date.now())/1000)} s.`;return}
  if(!c){i.focus();return}
  if(!privDe()){privDesbloquear();return} // sem código guardado (ex.: removido noutro aparelho): não fica preso
  if(await privConfere(c)){PRIV_ERR=0;privDesbloquear();return}
  PRIV_ERR++;i.value="";const L=$("#privLock");L.classList.remove("erro");void L.offsetWidth;L.classList.add("erro");
  if(PRIV_ERR>=5){PRIV_ESP=Date.now()+30000;PRIV_ERR=0;err.textContent="Código errado 5 vezes. Espere 30 s."}else err.textContent="Código errado.";i.focus()});
$("#privEsq").onclick=()=>{if(!confirm("Esqueceu-se do código?\n\nA sessão do Office 365 termina neste computador. Volte a entrar com a sua conta da escola: isso desbloqueia a app. Depois pode mudar o código em Definições › Modo de privacidade."))return;
  try{localStorage.removeItem(PRIV_ON)}catch(e){}try{guideSair()}catch(e){location.reload()}};
$("#privBtn").onclick=()=>privBloquear();
function renderPriv(){const o=privDe(),tem=!!(o&&o.h),e=$("#privEst");if(!e)return;
  e.innerHTML=tem?`<span class="tag ok">código definido</span> Pode bloquear com o botão <b>Bloquear</b>, em cima.`:`<span class="tag warn">sem código</span> Defina um código para poder bloquear o ecrã.`;
  $("#privAtualL").hidden=!tem;$("#privTirar").hidden=!tem;$("#privAgora").disabled=!tem;$("#privGuardar").textContent=tem?"Mudar o código":"Guardar código";
  $("#privMin").value=String(o&&o.min||0);$("#privMin").disabled=!tem}
$("#privGuardar").onclick=async()=>{const o=privDe(),a=$("#privAtual").value.trim(),n=$("#privNovo").value.trim(),n2=$("#privNovo2").value.trim();
  if(o&&o.h&&!(await privConfere(a))){toast("O código atual não está certo");$("#privAtual").focus();return}
  if(!privValido(n)){toast("O código novo tem de ter 4 a 8 algarismos");$("#privNovo").focus();return}
  if(n!==n2){toast("Os dois códigos novos não são iguais");$("#privNovo2").focus();return}
  const sal=[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,"0")).join("");
  privGravar({h:await privHash(sal,privEmail(),n),sal,min:o&&o.min||0,t:Date.now()});["#privAtual","#privNovo","#privNovo2"].forEach(x=>$(x).value="");toast(o&&o.h?"Código mudado":"Código guardado — já pode bloquear o ecrã")};
$("#privTirar").onclick=async()=>{if(!(await privConfere($("#privAtual").value.trim()))){toast("Escreva o código atual para o remover");$("#privAtual").focus();return}
  if(!confirm("Remover o código de desbloqueio? O modo de privacidade deixa de estar disponível até definir outro."))return;privGravar({h:"",sal:"",min:0,t:Date.now()});$("#privAtual").value="";toast("Código removido")};
$("#privMin").onchange=()=>{const o=privDe();if(!o||!o.h)return;privGravar(Object.assign({},o,{min:+$("#privMin").value||0,t:Date.now()}));toast(+$("#privMin").value?"A app passa a bloquear-se sozinha":"Bloqueio automático desligado")};
$("#privAgora").onclick=()=>privBloquear();
// bloqueio automático por falta de uso
["pointerdown","pointermove","keydown","wheel","touchstart","scroll"].forEach(ev=>document.addEventListener(ev,()=>{if(!privBloqueado())PRIV_ULT=Date.now()},{passive:true,capture:true}));
setInterval(()=>{const o=EU&&privDe();if(!o||!o.h||!o.min||privBloqueado())return;if(Date.now()-PRIV_ULT>o.min*60000)privBloquear()},15000);
// juntar o que vem da conta (prefs): fica o mais recente
function privDaConta(p){if(!p||typeof p!=="object")return;const o=privDe();if(!o||(+p.t||0)>(+o.t||0))privGravar({h:String(p.h||""),sal:String(p.sal||""),min:+p.min||0,t:+p.t||Date.now()},false)}
renderPriv();if(privBloqueado())privEcra();

/* 0.9.75: ordem das apps na barra de cima (Definições › Ordem das apps), guardada na conta com as outras preferências */
const MODORD_ORIG=[...document.querySelectorAll("#mods button[data-m]")].map(b=>b.dataset.m);
let MODORD=(()=>{try{const v=JSON.parse(localStorage.getItem("guide_modord")||"null");return Array.isArray(v)?v:null}catch(e){return null}})();
function modOrdLista(){const o=(MODORD||[]).filter(m=>MODORD_ORIG.includes(m));return o.concat(MODORD_ORIG.filter(m=>!o.includes(m)))}
function modOrdAplicar(){const nav=$("#mods");if(!nav)return;for(const m of modOrdLista()){const b=nav.querySelector(`button[data-m="${m}"]`);if(b)nav.appendChild(b)}}
function modOrdGuardar(L,sinc){MODORD=L;try{localStorage.setItem("guide_modord",JSON.stringify(L))}catch(e){}modOrdAplicar();renderModOrd();if(sinc!==false)try{prefsAgendar()}catch(e){}}
function renderModOrd(){const ul=$("#modOrd");if(!ul)return;const L=modOrdLista();
  ul.innerHTML=L.map((m,i)=>{const b=$("#mods").querySelector(`button[data-m="${m}"]`);if(!b)return"";const sv=b.querySelector("svg"),nm=((b.querySelector(":scope>span")||b).textContent||"").trim().replace(/360$/,"");
    return `<li draggable="true" data-mo="${m}"><span class="pega" aria-hidden="true">⋮⋮</span>${sv?sv.outerHTML.replace(/id="(m7\w)/g,'id="o$1').replace(/url\(#(m7\w)/g,"url(#o$1"):""}<b>${esc(nm)}<i>360</i></b><button type="button" data-mou="${i}" title="Subir" ${i?"":"disabled"}>↑</button><button type="button" data-mod="${i}" title="Descer" ${i<L.length-1?"":"disabled"}>↓</button></li>`}).join("")}
(()=>{const ul=$("#modOrd");if(!ul)return;let arr=null;
  ul.addEventListener("click",e=>{const u=e.target.closest("[data-mou]"),d=e.target.closest("[data-mod]");if(!u&&!d)return;const L=modOrdLista(),i=+(u||d).dataset[u?"mou":"mod"],j=u?i-1:i+1;if(j<0||j>=L.length)return;[L[i],L[j]]=[L[j],L[i]];modOrdGuardar(L)});
  ul.addEventListener("dragstart",e=>{const li=e.target.closest("li");if(!li)return;arr=li.dataset.mo;li.classList.add("drag");try{e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",arr)}catch(x){}});
  ul.addEventListener("dragover",e=>{const li=e.target.closest("li");if(!li||!arr)return;e.preventDefault();ul.querySelectorAll(".alvo").forEach(x=>x.classList.remove("alvo"));if(li.dataset.mo!==arr)li.classList.add("alvo")});
  ul.addEventListener("dragend",()=>{arr=null;ul.querySelectorAll(".drag,.alvo").forEach(x=>x.classList.remove("drag","alvo"))});
  ul.addEventListener("drop",e=>{const li=e.target.closest("li");if(!li||!arr)return;e.preventDefault();const L=modOrdLista().filter(m=>m!==arr),k=L.indexOf(li.dataset.mo),r=li.getBoundingClientRect(),dep=e.clientY>r.top+r.height/2;L.splice(dep?k+1:k,0,arr);arr=null;modOrdGuardar(L)});
  $("#modOrdReset").onclick=()=>{modOrdGuardar(MODORD_ORIG.slice());toast("Ordem das apps reposta")};
  modOrdAplicar();renderModOrd()})();
