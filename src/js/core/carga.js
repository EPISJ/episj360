/* ===================== 0.9.239: nada se mexe antes de os dados chegarem (em toda a app) =====================
   A memória do navegador começa vazia a cada recarga (nada fica no computador) e os dados de cada módulo vêm do Supabase.
   Enquanto os dados do módulo aberto não chegam:
   · aparece um aviso por cima do ecrã («A trazer da nuvem os dados do …») e o ecrã fica só para ver (inert): não se edita,
     não se importa, não se numera — assim nada é gravado por cima do que está guardado nem duplicado;
   · os dados desse módulo são pedidos logo (não esperam pela fila dos outros módulos);
   · se não for possível trazê-los, o aviso diz isso e tem «Tentar outra vez».
   Segunda proteção, na gravação: nuvemPut recusa peças que ainda não foram lidas nesta sessão (NUV_GUARDA em core/nuvem.js).
   Para um módulo novo: juntar uma linha a CARGA (pronto = a peça já foi lida; trazer = a função que a vai buscar e junta). */
var CARGA={
  escola:{p:()=>CFG_SINC,t:()=>NUV.ocupado?null:nuvemTrazer(true)},
  boxcheck:{p:()=>CFG_SINC,t:()=>NUV.ocupado?null:nuvemTrazer(true)},
  eduschedule:{p:()=>ES_SINC&&H3_SINC,t:()=>Promise.all([esTrazerNuvem(),h3TrazerNuvem()])},
  roomcheck:{p:()=>!!rcNuvOk,t:()=>rcTrazer(false)},
  crono:{p:()=>CR_SINC,t:()=>crTrazerNuvem()},
  pap:{p:()=>PAP_SINC,t:()=>papTrazerNuvem()},
  pass:{p:()=>!!pwS().lido,t:()=>pwTrazerNuvem(),q:()=>pwPode()},
  folder:{p:()=>FO_SINC,t:()=>foTrazerNuvem()},
  econo:{p:()=>ECO_SINC&&ECF_SINC,t:()=>ecoTrazerNuvem(),q:()=>ecoEcon()||cargaNuvem()},
  oficio:{p:()=>OF_SINC,t:()=>ofTrazerNuvem()}
};
var CARGA_EST={}; // módulo → {voo, ult (última tentativa), falhou}
function cargaNuvem(){try{return!RO&&NUVOK()&&!nuvDesl()}catch(e){return false}}
// o módulo m precisa de esperar? (só quem vai buscar os dados à nuvem; formadores e formandos veem o publicado e não editam)
function cargaEspera(m){const C=CARGA[m];if(!C)return false;try{if(C.p())return false;return C.q?!!C.q():cargaNuvem()}catch(e){return false}}
function cargaTrazer(m){const C=CARGA[m],E=CARGA_EST[m]||(CARGA_EST[m]={});if(!C||E.voo)return;
  let pr=null;try{pr=C.t()}catch(e){pr=null}if(!pr||typeof pr.then!=="function"){E.ult=Date.now();return}
  E.voo=true;E.ult=Date.now();E.falhou=false;
  pr.catch(()=>{}).then(()=>{E.voo=false;let ok=false;try{ok=!!C.p()}catch(e){}E.falhou=!ok;cargaVer()})}
var CARGA_MOSTRA=null; // secção que está bloqueada agora
function cargaVer(){try{
  const sec=document.querySelector("main>section.on"),m=curTab?modDeTab(curTab):null;
  const espera=!!(sec&&m&&cargaEspera(m));
  let av=document.getElementById("cargaAviso");
  if(!espera){if(av)av.remove();
    if(CARGA_MOSTRA){const s=CARGA_MOSTRA;CARGA_MOSTRA=null;s.inert=false;s.classList.remove("carga-espera");
      // os dados acabaram de chegar: redesenha o ecrã aberto com eles
      if(s===sec&&curTab)setTimeout(()=>{try{show(curTab)}catch(e){}},0)}
    return}
  if(CARGA_MOSTRA&&CARGA_MOSTRA!==sec){CARGA_MOSTRA.inert=false;CARGA_MOSTRA.classList.remove("carga-espera")}
  CARGA_MOSTRA=sec;sec.inert=true;sec.classList.add("carga-espera");
  const E=CARGA_EST[m]||(CARGA_EST[m]={});
  if(!E.voo&&(!E.ult||Date.now()-E.ult>(E.falhou?20000:4000)))cargaTrazer(m);
  const M=MODULOS.find(x=>x.id===m),nome=M?M.nome:"módulo";
  if(!av){av=document.createElement("div");av.id="cargaAviso";av.setAttribute("role","status")}
  const falhou=E.falhou&&!E.voo,sig=(falhou?"f":"a")+m;
  if(av.dataset.sig!==sig){av.dataset.sig=sig;av.className="carga-aviso"+(falhou?" bad":"");
    av.innerHTML=falhou
      ?`<b>Não consegui trazer da nuvem os dados do ${esc(nome)}.</b> Para não se perder nem duplicar nada, este ecrã fica só para ver até os dados chegarem. <button class="b s" type="button" data-cargatentar>Tentar outra vez</button>`
      :`<span class="carga-roda" aria-hidden="true"></span><b>A trazer da nuvem os dados do ${esc(nome)}…</b> Até chegarem, este ecrã fica só para ver (não se edita nem importa nada), para não se perder nem duplicar informação.`;
    const b=av.querySelector("[data-cargatentar]");if(b)b.onclick=()=>{E.ult=0;E.falhou=false;cargaVer()}}
  if(av.nextElementSibling!==sec)sec.parentNode.insertBefore(av,sec)}
catch(e){console.warn("EPISJ 360/carga",e)}}
// um só pedido de cada vez por função (o arranque e a abertura do módulo podem pedir ao mesmo tempo); um pedido que chegue
// a meio fica para logo a seguir (nunca se perde uma gravação pendente); no fim confirma o bloqueio do ecrã
function cargaUma(f){let p=null,outra=false;const w=function(...a){if(p){outra=true;return p}
  p=Promise.resolve().then(()=>f.apply(this,a)).finally(()=>{p=null;setTimeout(cargaVer,0);if(outra){outra=false;w()}});return p};return w}
esTrazerNuvem=cargaUma(esTrazerNuvem);h3TrazerNuvem=cargaUma(h3TrazerNuvem);crTrazerNuvem=cargaUma(crTrazerNuvem);papTrazerNuvem=cargaUma(papTrazerNuvem);
pwTrazerNuvem=cargaUma(pwTrazerNuvem);foTrazerNuvem=cargaUma(foTrazerNuvem);ecoTrazerNuvem=cargaUma(ecoTrazerNuvem);avTrazerNuvem=cargaUma(avTrazerNuvem);
// confirma de 2 em 2 segundos (a sessão da nuvem pode ficar pronta depois de o ecrã abrir)
setInterval(cargaVer,2000);
