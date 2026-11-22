/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.147 */
// ===== src/js/inicio/rede.js =====
/* 0.9.93: rede de segurança do arranque — se o script principal falhar antes de a app abrir, a próxima entrada abre na Escola360 e o ecrã de entrada diz o que se passou */
(function(){var vis=false;function falha(m){if(window.__wgOk||vis)return;vis=true;try{localStorage.setItem("guide_mod","escola")}catch(e){}
  var g=document.getElementById("gateMsg"),b=document.getElementById("msGo");if(!g)return;
  g.innerHTML='<div class="msg bad" style="text-align:left">A EPISJ 360 não arrancou bem neste computador. Já corrigi o que estava guardado: carregue em «Tentar outra vez».<br><span class="hint" style="margin:4px 0 0;display:block">'+String(m||"").replace(/[<>&]/g,"")+'</span></div>';
  if(b){b.textContent="Tentar outra vez";b.onclick=function(){location.reload()}}}
  window.addEventListener("error",function(e){falha(e&&(e.message||e.error))});
  window.addEventListener("load",function(){setTimeout(function(){if(!window.__wgOk)falha("o arranque não terminou")},4000)})})();
/* 0.9.133: logótipo da escola no menu — se a imagem não abrir, esconde a ligação (antes era um onerror no próprio HTML) */
(function(){document.querySelectorAll("img[data-esconde-sem-img]").forEach(function(i){var f=function(){if(i.parentNode)i.parentNode.style.display="none"};if(i.complete&&!i.naturalWidth)f();else i.addEventListener("error",f)})})();
