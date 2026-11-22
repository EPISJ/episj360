/* ===================== 0.9.37: cópia de segurança no OneDrive de quem é da Direção (pasta Aplicações › EPISJ 360) =====================
   Uma cópia por dia (ao entrar), mais "Fazer cópia agora"; "Repor do OneDrive" JUNTA a cópia ao que está aqui (não apaga nada). */
const OD_SCOPES=["Files.ReadWrite.AppFolder"];
const odPode=()=>{try{return !!(MSACC&&EU&&!RO&&(EU.admin||EU.perfil==="dexec"||EU.perfil==="dped"))}catch(e){return false}};
async function odTok(interativo){const p=await msInit();if(!MSACC)throw new Error("Entre com a conta do Office 365.");
  try{return (await p.acquireTokenSilent({scopes:OD_SCOPES,account:MSACC})).accessToken}
  catch(e){if(!interativo)throw e;return (await p.acquireTokenPopup({scopes:OD_SCOPES,account:MSACC,redirectUri:MS_REDIR})).accessToken}}
function odDados(){return{app:"EPISJ 360",v:VERSAO,t:Date.now(),por:(EU&&EU.email)||"",cfg:JSON.stringify(cfg),logos:LOGOS,roomcheck:RC,horarios:ESD,modelos:TPL,pap:(typeof PAP!=="undefined"?PAP:null),horarios360:(typeof H3!=="undefined"&&H3&&H3.t?H3:null),pass360:(PWS&&PWS.blob&&PWS.blob.ct)?PWS.blob:null,econo360:(typeof ECO!=="undefined"&&ECO&&ECO.t?ECO:null),econo360faturas:(typeof ECF!=="undefined"&&ECF&&ECF.t?ECF:null),folder360:(typeof FOL!=="undefined"&&FOL&&FOL.dossiers&&FOL.dossiers.length?FOL:null)}}
async function odPut(tok,nome,txt){const r=await fetch("https://graph.microsoft.com/v1.0/me/drive/special/approot:/"+encodeURIComponent(nome)+":/content",{method:"PUT",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/json"},body:txt});
  if(!r.ok)throw new Error("o OneDrive respondeu "+r.status);return r.json()}
async function odCopia(interativo){if(!odPode())throw new Error("Só a Direção faz cópias no OneDrive.");const tok=await odTok(interativo),txt=JSON.stringify(odDados()),dia=new Date().toISOString().slice(0,10);
  await odPut(tok,"EPISJ360-copia-"+dia+".json",txt);await odPut(tok,"EPISJ360-ultima-copia.json",txt);
  try{localStorage.setItem("g360_od_dia",dia);localStorage.setItem("g360_od_t",String(Date.now()))}catch(e){}odUI();return dia}
async function odCopiaDiaria(){odUI();expUI();expOneDrive().catch(()=>{});if(!odPode())return;const dia=new Date().toISOString().slice(0,10);if(localStorage.getItem("g360_od_dia")===dia)return;
  try{await odCopia(false)}catch(e){try{localStorage.setItem("g360_od_falta","1")}catch(x){}odUI()}}
async function odRepor(){const tok=await odTok(true);const r=await fetch("https://graph.microsoft.com/v1.0/me/drive/special/approot:/EPISJ360-ultima-copia.json:/content",{headers:{Authorization:"Bearer "+tok}});
  if(r.status===404)throw new Error("Ainda não há cópias no seu OneDrive.");if(!r.ok)throw new Error("o OneDrive respondeu "+r.status);
  const o=await r.json();if(!o||!o.cfg)throw new Error("A cópia não é da EPISJ 360.");
  if(!confirm(`Juntar a cópia do OneDrive de ${new Date(o.t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})} ao que está neste computador?\n\nNada é apagado: o que só existir num dos lados fica.`))return false;
  ponto("Antes de juntar a cópia do OneDrive");
  cfg=juntarCfg(cfg,JSON.parse(o.cfg));migrate();save();
  try{if(o.roomcheck){RC=rcJuntar(RC,o.roomcheck);rcGravar()}}catch(e){}
  try{if(o.horarios&&(o.horarios.t||0)>(ESD.t||0)){ESD=Object.assign(ESD,o.horarios);esdGuardar()}}catch(e){}
  try{if(o.logos&&typeof o.logos==="object"&&!Object.keys(LOGOS).length){LOGOS=o.logos;guardarLogos()}}catch(e){}
  try{refreshAll()}catch(e){}return true}
function odUI(){const el=$("#odEstado");if(!el)return;const card=$("#odCard");if(card)card.hidden=false;
  const t=+(localStorage.getItem("g360_od_t")||0),falta=localStorage.getItem("g360_od_falta")==="1"&&!t;
  el.innerHTML=t?`<div class="msg ok" style="margin:10px 0 0">${ico("cloud")} Última cópia no OneDrive: ${new Date(t).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})} (Aplicações › EPISJ 360). Faz-se sozinha uma vez por dia, ao entrar.</div>`
    :falta?`<div class="msg info" style="margin:10px 0 0">Para a cópia diária funcionar, carregue em <b>Fazer cópia agora</b> e aceite o acesso à pasta da app no seu OneDrive (só uma vez). Se aparecer que precisa de aprovação do administrador, siga os passos abaixo.</div>`
    :`<p class="hint" style="margin:8px 0 0">Ainda não foi feita nenhuma cópia neste computador.</p>`}
$("#odAgora").onclick=async()=>{const b=$("#odAgora");b.disabled=true;try{const d=await odCopia(true);try{localStorage.removeItem("g360_od_falta")}catch(e){}toast("Cópia guardada no OneDrive ("+d+")")}catch(e){toast("Não foi possível guardar no OneDrive: "+(e.message||e))}b.disabled=false};
$("#odRepor").onclick=async()=>{try{if(await odRepor())toast("Cópia do OneDrive junta com o que estava aqui")}catch(e){toast(e.message||String(e))}};
odUI();
/* 0.9.124: exportação completa feita pelo servidor (função g360-exportar, todas as noites; bucket privado g360-copias, só a Direção lê).
   Aqui: ver e descarregar as exportações, pedir uma agora, e levar a última para o OneDrive de quem é da Direção (fora do servidor). Nunca apaga nada. */
const EXP_B="g360-copias";
const expPode=()=>{try{return !!(SBSES&&EU&&!RO&&(EU.admin||EU.perfil==="dexec"||EU.perfil==="dped"))}catch(e){return false}};
const expTam=b=>b>=1048576?(b/1048576).toFixed(1).replace(".",",")+" MB":Math.max(1,Math.round(b/1024))+" kB";
async function expListar(){const sb=await sbCliente();const {data,error}=await sb.storage.from(EXP_B).list("diario",{limit:400,sortBy:{column:"name",order:"desc"}});
  if(error)throw new Error(error.message||"Não foi possível ler as exportações.");return (data||[]).filter(f=>/^\d{4}-\d{2}-\d{2}\.json\.gz$/.test(f.name))}
async function expBlob(cam){const sb=await sbCliente();const {data,error}=await sb.storage.from(EXP_B).download(cam);if(error||!data)throw new Error((error&&error.message)||"Não foi possível descarregar.");return data}
async function expDescarregar(cam,nome){const b=await expBlob(cam);const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=nome;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000)}
async function expUI(){const card=$("#expCard");if(!card)return;card.hidden=!expPode();if(card.hidden)return;const el=$("#expEstado");
  try{const l=await expListar();const u=l[0];
    el.innerHTML=u?`<div class="msg ok" style="margin:10px 0 0">${ico("cloud")} Última exportação: ${esc(u.name.slice(8,10)+"/"+u.name.slice(5,7)+"/"+u.name.slice(0,4))} (${expTam((u.metadata&&u.metadata.size)||0)}) · ${l.length} guardada${l.length===1?"":"s"}. Faz-se sozinha todas as noites.</div>`
      :`<p class="hint" style="margin:8px 0 0">Ainda não há exportações. A primeira faz-se esta noite, ou carregue em <b>Exportar agora</b>.</p>`}
  catch(e){el.innerHTML=`<p class="hint" style="margin:8px 0 0">${esc(e.message||String(e))}</p>`}}
async function expVer(){const el=$("#expLista");if(el.dataset.aberto==="1"){el.innerHTML="";el.dataset.aberto="";return}
  el.dataset.aberto="1";el.innerHTML=`<p class="hint" style="margin:8px 0 0">A ler…</p>`;
  try{const l=await expListar();const sb=await sbCliente();const h=await sb.storage.from(EXP_B).list("historico",{limit:1000,sortBy:{column:"name",order:"asc"}});
    const hl=((h&&h.data)||[]).filter(f=>/\.json\.gz$/.test(f.name));
    const lin=(cam,nome,rot,tam)=>`<tr><td>${esc(rot)}</td><td style="text-align:right">${expTam(tam||0)}</td><td style="text-align:right"><button class="b s" data-expcam="${esc(cam)}" data-expnome="${esc(nome)}">Descarregar</button></td></tr>`;
    el.innerHTML=`<div style="overflow-x:auto;margin-top:10px"><table class="rt"><thead><tr><th>Exportação completa</th><th style="text-align:right">Tamanho</th><th></th></tr></thead><tbody>${l.map(f=>lin("diario/"+f.name,"EPISJ360-exportacao-"+f.name,f.name.slice(8,10)+"/"+f.name.slice(5,7)+"/"+f.name.slice(0,4),f.metadata&&f.metadata.size)).join("")||`<tr><td colspan="3" class="hint">Ainda não há.</td></tr>`}</tbody></table></div>`
      +(hl.length?`<details style="margin-top:8px"><summary class="hint" style="cursor:pointer;margin:0">Histórico de versões (${hl.length} parte${hl.length===1?"":"s"}, só se acrescenta)</summary><div style="overflow-x:auto"><table class="rt"><tbody>${hl.map(f=>{const m=f.name.match(/^0*(\d+)-0*(\d+)/);return lin("historico/"+f.name,"EPISJ360-historico-"+f.name,m?`Versões ${m[1]} a ${m[2]}`:f.name,f.metadata&&f.metadata.size)}).join("")}</tbody></table></div></details>`:"");
    el.querySelectorAll("[data-expcam]").forEach(b=>b.onclick=async()=>{b.disabled=true;try{await expDescarregar(b.dataset.expcam,b.dataset.expnome)}catch(e){toast(e.message||String(e))}b.disabled=false})}
  catch(e){el.innerHTML=`<p class="hint" style="margin:8px 0 0">${esc(e.message||String(e))}</p>`}}
/* leva a última exportação do servidor para o OneDrive de quem é da Direção (uma vez por exportação; sem janelas) */
async function expOneDrive(){if(!odPode()||!expPode())return;const l=await expListar();const u=l[0];if(!u)return;
  if(localStorage.getItem("g360_exp_od")===u.name)return;const tok=await odTok(false);const b=await expBlob("diario/"+u.name);
  const r=await fetch("https://graph.microsoft.com/v1.0/me/drive/special/approot:/Exportacoes/"+encodeURIComponent("EPISJ360-exportacao-"+u.name)+":/content",{method:"PUT",headers:{Authorization:"Bearer "+tok,"Content-Type":"application/gzip"},body:b});
  if(!r.ok)throw new Error("o OneDrive respondeu "+r.status);try{localStorage.setItem("g360_exp_od",u.name)}catch(e){}}
$("#expAgora").onclick=async()=>{const b=$("#expAgora");b.disabled=true;toast("A exportar a base de dados… pode demorar até um minuto");
  try{const sb=await sbCliente();const {data,error}=await sb.functions.invoke("g360-exportar",{body:{}});
    if(error||!data||!data.ok)throw new Error((data&&data.erro)||(error&&error.message)||"O servidor não respondeu.");
    toast(data.diaria&&data.diaria.ficheiro?"Exportação feita ("+expTam(data.diaria.bytes)+")":"Exportação: "+(data.diaria||"feita"));
    await expUI();const el=$("#expLista");if(el.dataset.aberto==="1"){el.dataset.aberto="";await expVer()}expOneDrive().catch(()=>{})}
  catch(e){toast("Não foi possível exportar: "+(e.message||e))}b.disabled=false};
$("#expVer").onclick=()=>expVer();

/* Definições › Base de dados (Supabase) */
$("#sbSave").onclick=()=>{const url=$("#sbUrl").value.trim().replace(/\/+$/,""),key=$("#sbKey").value.trim();
  if(url&&!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url))return toast("O endereço deve ser como https://xxxxxxxx.supabase.co");
  if(/service_role|^sb_secret_/i.test(key))return toast("Essa é a chave SECRETA — use a chave publicável (sb_publishable_…)");
  try{if(url&&key)localStorage.setItem(SB_CFG_KEY,JSON.stringify({url,key}));else localStorage.removeItem(SB_CFG_KEY)}catch(e){}
  toast(url&&key?"Base de dados configurada — a recarregar":"Configuração da base de dados removida");setTimeout(()=>location.reload(),700)};
if($("#sbSql"))$("#sbSql").onclick=async()=>{try{let t=await (await fetch("servidor/supabase-episj360.sql",{cache:"no-store"})).text();const em=(EU&&EU.email)||"";if(em)t=t.replace("O_SEU_EMAIL@episj.pt",em.toLowerCase()).replace("'Administrador'","'"+String(EU.nome||"Administrador").replace(/'/g,"''")+"'");
  await navigator.clipboard.writeText(t);toast(em?"Script copiado (com "+em+" como administrador)":"Script copiado — mude O_SEU_EMAIL@episj.pt para o seu email")}catch(e){toast("Não foi possível copiar: "+(e.message||e))}};
sbUI();


