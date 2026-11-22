/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.150 */
// ===== src/js/inicio/sem-armazenamento.js =====
/* EPISJ 360 0.9.148 — nada fica guardado no computador de quem usa a app: os dados vivem só no Supabase.
   Este ficheiro corre antes de tudo (na página principal, no Social360 e no Horários360) e troca o localStorage e o
   sessionStorage do navegador por cópias em memória, que desaparecem quando a página fecha. O que precisa de durar vai
   para o Supabase (dados da escola em g360_estado, preferências de cada conta em g360_prefs).
   Única exceção: a sessão de entrada do Supabase fica no sessionStorage verdadeiro (separador aberto; apaga-se ao fechar
   o navegador), porque a entrada com a Microsoft sai da página e volta (ver sbCliente em core/nuvem.js).
   As janelas embutidas da mesma origem (Social360, Horários360) usam a memória da página principal.
   O que versões antigas deixaram no computador passa para a memória ao abrir e é apagado do computador quando se confirma
   que está na nuvem (legadoLimpar em core/entrada.js). */
(function(){
  if(window.__g360Mem)return;
  var pai=null;try{if(window.parent!==window&&window.parent.__g360Mem&&window.parent.location.origin===location.origin)pai=window.parent.__g360Mem}catch(e){}
  var real={ls:null,ss:null};try{real.ls=window.localStorage}catch(e){}try{real.ss=window.sessionStorage}catch(e){}
  function Mem(){var m=new Map(),o={
    getItem:function(k){k=String(k);return m.has(k)?m.get(k):null},
    setItem:function(k,v){k=String(k);m.set(k,String(v));if(o.aoMudar)try{o.aoMudar(k)}catch(e){}},
    removeItem:function(k){k=String(k);if(!m.has(k))return;m.delete(k);if(o.aoMudar)try{o.aoMudar(k)}catch(e){}},
    clear:function(){m.clear()},
    key:function(i){var a=Array.from(m.keys());return i>=0&&i<a.length?a[i]:null}};
    Object.defineProperty(o,"length",{get:function(){return m.size}});return o}
  var M=pai||{ls:Mem(),ss:Mem(),real:real,legado:0};
  if(!pai){
    // o que versões antigas deixaram no localStorage deste computador passa para a memória (não se perde nada que ainda não esteja na nuvem)
    try{if(real.ls){var ks=[];for(var i=0;i<real.ls.length;i++)ks.push(real.ls.key(i));
      ks.forEach(function(k){if(!k||/^msal\.|login\.windows|login\.microsoftonline|^episj360\.sb/i.test(k))return;var v=real.ls.getItem(k);if(v!=null){M.ls.setItem(k,v);M.legado++}})}}catch(e){}
  }
  window.__g360Mem=M;
  try{Object.defineProperty(window,"localStorage",{configurable:true,enumerable:true,get:function(){return M.ls}})}catch(e){}
  try{Object.defineProperty(window,"sessionStorage",{configurable:true,enumerable:true,get:function(){return M.ss}})}catch(e){}
  M.ativo=(function(){try{return window.localStorage===M.ls&&window.sessionStorage===M.ss}catch(e){return false}})();
})();
