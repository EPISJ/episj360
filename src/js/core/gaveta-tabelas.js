
/* 0.9.48: gaveta do menu (telemóvel e iPad) */
(function(){const b=document.getElementById("navBtn"),v=document.getElementById("navVeu"),n=document.getElementById("nav");if(!b||!n)return;
  const pm=matchMedia("(max-width:820px)");
  const abrir=o=>{if(o&&document.body.classList.contains("esch"))o=false;document.body.classList.toggle("navopen",o);b.setAttribute("aria-expanded",o?"true":"false");if(v)v.hidden=!o;if(o){const f=n.querySelector("button.on,button:not([hidden])");f&&f.focus({preventScroll:true})}};
  b.addEventListener("click",()=>abrir(!document.body.classList.contains("navopen")));
  if(v)v.addEventListener("click",()=>abrir(false));
  n.addEventListener("click",e=>{if(pm.matches&&e.target.closest("button[data-t]"))abrir(false)});
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&document.body.classList.contains("navopen"))abrir(false)});
  (pm.addEventListener?pm.addEventListener("change",()=>abrir(false)):pm.addListener(()=>abrir(false)));
  // deslizar para a esquerda fecha a gaveta
  let x0=null;n.addEventListener("touchstart",e=>{x0=e.touches[0].clientX},{passive:true});n.addEventListener("touchend",e=>{if(x0!=null&&e.changedTouches[0].clientX-x0<-60)abrir(false);x0=null},{passive:true});
})();

/* 0.9.48: cada tabela da página fica dentro de uma caixa que desliza na horizontal (telemóvel e iPad) */
(function(){const m=document.querySelector("main");if(!m)return;let h=null;
  // 0.9.130: os títulos das colunas de números ficam alinhados à direita, como os números (antes ficavam por cima da coluna ao lado)
  const alinhar=t=>{t.dataset.al="1";const hr=t.tHead&&t.tHead.rows[t.tHead.rows.length-1];if(!hr||!t.tBodies[0])return;const nh=hr.cells.length;
    for(const tr of t.tBodies[0].rows){if(tr.cells.length!==nh)continue;for(let i=0;i<nh;i++){const td=tr.cells[i];if(td.classList.contains("pcn")||td.classList.contains("crn")||td.classList.contains("num"))hr.cells[i].classList.add("thn")}break}};
  const embrulhar=()=>{h=null;m.querySelectorAll("table:not([data-al])").forEach(alinhar);m.querySelectorAll("table").forEach(t=>{if(t.parentElement&&t.parentElement.classList.contains("tw"))return;if(t.closest(".wg,.rc-grid,.lghd"))return;
    const n=(t.tHead&&t.tHead.rows[0]?t.tHead.rows[0].cells.length:(t.rows[0]?t.rows[0].cells.length:0))||0;if(n<4)return;
    const w=document.createElement("div");w.className="tw";w.style.setProperty("--twmin",Math.min(1100,Math.max(640,n*112))+"px");t.parentElement.insertBefore(w,t);w.appendChild(t)})};
  new MutationObserver(()=>{if(!h)h=requestAnimationFrame(embrulhar)}).observe(m,{childList:true,subtree:true});embrulhar()})();

