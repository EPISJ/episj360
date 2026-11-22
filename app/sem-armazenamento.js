/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.192 */
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
  /* 0.9.155: a sessão da Microsoft (cache do MSAL: chaves «msal.…» e as de login.windows.net) fica no sessionStorage verdadeiro, como a do
     Supabase — só enquanto o navegador está aberto. Sem isto, cada recarga perdia a sessão e os emails (Box360, Horários360, Crono360…)
     precisavam de uma janela da Microsoft que o navegador bloqueia. O resto do sessionStorage continua em memória. */
  var MSALK=/^msal\.|login\.windows\.net|login\.microsoftonline\.com/i;
  function SessHib(){var mem=Mem(),R=real.ss;
    function chaves(){var a=[];for(var i=0;i<mem.length;i++)a.push(mem.key(i));if(R)try{for(var j=0;j<R.length;j++){var k=R.key(j);if(k&&MSALK.test(k))a.push(k)}}catch(e){}return a}
    var api={getItem:function(k){k=String(k);if(R&&MSALK.test(k))try{return R.getItem(k)}catch(e){return null}return mem.getItem(k)},
      setItem:function(k,v){k=String(k);if(R&&MSALK.test(k)){try{R.setItem(k,String(v))}catch(e){}return}mem.setItem(k,v)},
      removeItem:function(k){k=String(k);if(R&&MSALK.test(k)){try{R.removeItem(k)}catch(e){}return}mem.removeItem(k)},
      clear:function(){mem.clear()},key:function(i){var a=chaves();return i>=0&&i<a.length?a[i]:null}};
    Object.defineProperty(api,"aoMudar",{get:function(){return mem.aoMudar},set:function(f){mem.aoMudar=f}});
    if(typeof Proxy!=="function"){Object.defineProperty(api,"length",{get:function(){return chaves().length}});return api}
    // Object.keys(sessionStorage) tem de dar as chaves (o MSAL usa-o para encontrar a conta e os tokens)
    return new Proxy({},{get:function(t,p){if(p==="length")return chaves().length;if(p in api)return api[p];if(p==="hasOwnProperty")return function(k){return api.getItem(k)!==null};if(typeof p!=="string"||p in Object.prototype)return Object.prototype[p];return typeof p==="string"?api.getItem(p):undefined},
      set:function(t,p,v){if(p==="aoMudar"){api.aoMudar=v;return true}api.setItem(p,v);return true},
      has:function(t,p){return p in api||(typeof p==="string"&&api.getItem(p)!==null)},
      ownKeys:function(){return chaves()},
      getOwnPropertyDescriptor:function(t,p){var v=typeof p==="string"?api.getItem(p):null;return v===null?undefined:{value:v,writable:true,enumerable:true,configurable:true}},
      deleteProperty:function(t,p){api.removeItem(p);return true}})}
  var M=pai||{ls:Mem(),ss:SessHib(),real:real,legado:0};
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
