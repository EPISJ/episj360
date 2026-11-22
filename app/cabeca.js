/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.224 */
// ===== src/js/inicio/cabeca.js =====
/* corre no <head>, antes de a página aparecer: modo de privacidade e tema escolhidos neste aparelho */
try{(function(){if(localStorage.getItem("g360_priv_on"))document.documentElement.setAttribute("data-priv","on")})()}catch(e){}
try{document.documentElement.setAttribute("data-tema","cobalto")}catch(e){} // 0.9.177: o Cobalto é o único tema (automático)
/* 0.9.133: segurança — a EPISJ 360 não abre dentro de páginas de outros sites (evita que um site alheio a mostre por baixo
   de botões falsos e leve alguém a clicar sem saber: «clickjacking»). Dentro da própria EPISJ 360 continua a funcionar. */
try{(function(){if(window.top===window.self)return;var mesma=false;try{mesma=window.top.location.origin===location.origin}catch(e){}if(mesma)return;
  /* deixa abrir num separador do Teams / SharePoint da escola */
  var ao=location.ancestorOrigins,ms=/^https:\/\/([a-z0-9-]+\.)*(microsoft\.com|office\.com|office365\.com|sharepoint\.com|cloud\.microsoft|live\.com|microsoftonline\.com|episj\.com)$/i;
  if(ao&&ao.length&&[].every.call(ao,function(o){return ms.test(o)}))return;
  document.documentElement.style.display="none";try{window.top.location.href=location.href}catch(e){}})()}catch(e){}
