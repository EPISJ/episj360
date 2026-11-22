/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.191 — ecrã do módulo «pass», carregado quando é aberto */
"use strict";
// ===== src/js/pass/pass.js =====
/* Pass360 — ecrã do módulo (carregado só quando o Pass360 é aberto; os dados e a cifra estão em pass/pass-dados.js) */
// ---------- utilidades ----------
function pwIco(n){const P={chave:'<circle cx="7.5" cy="15.5" r="3.5"/><path d="M10 13l9-9M16 7l3 3M14 9l2 2"/>',globo:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',cad:'<rect x="4.5" y="10.5" width="15" height="10" rx="2.2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/>',escudo:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',wifi:'<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1"/>'};
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${P[n]||P.chave}</svg>`}
function pwIcoDe(x){const c=norm(x.cat||"");return /wi-?fi|rede/.test(c)?"wifi":x.url?"globo":"chave"}
function pwUrlOk(u){try{const x=new URL(/^[a-z][a-z0-9+.-]*:/i.test(u)?u:"https://"+u);return /^https?:$/.test(x.protocol)?x.href:""}catch(e){return""}}
function pwDom(u){try{return new URL(pwUrlOk(u)).hostname.replace(/^www\./,"")}catch(e){return""}}
const PW_COMUNS=["password","passw0rd","123456","12345678","123456789","qwerty","azerty","111111","000000","abc123","admin","administrador","escola","episj","sjorge","saojorge","benfica","porto","sporting","portugal","acores","azores","velas","calheta","iloveyou","welcome","bemvindo","senha","palavrapasse"];
function pwForca(p){p=String(p||"");if(!p)return{n:0,bits:0,txt:""};let sz=0;if(/[a-z]/.test(p))sz+=26;if(/[A-Z]/.test(p))sz+=26;if(/\d/.test(p))sz+=10;if(/[^a-zA-Z0-9]/.test(p))sz+=33;
  let bits=p.length*Math.log2(Math.max(sz,2));const l=norm(p).replace(/[^a-z0-9]/g,"");
  {const achou=PW_COMUNS.filter(w=>l.includes(w));if(achou.length){let r=l;for(const w of achou)r=r.split(w).join("");if(r.length<6)bits=Math.min(bits,28);else bits-=12*achou.length}} // palavra comum: penaliza; só anula se for quase tudoif(/(.)\1\1/.test(p))bits-=10;if(/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/i.test(p))bits-=12;if(/^\d+$/.test(p))bits=Math.min(bits,p.length*3.32);
  bits=Math.max(0,Math.round(bits));const n=bits<40?1:bits<60?2:bits<80?3:4;return{n,bits,txt:["","fraca","razoável","forte","muito forte"][n]}}
function pwForcaHTML(p){const f=pwForca(p);if(!f.n)return"";const cor=["","var(--bad)","#d97706","#2563eb","#0e7490"][f.n];return `<span class="pw-fb"><i style="width:${f.n*25}%;background:${cor}"></i></span><span>${f.txt} · cerca de ${f.bits} bits</span>`}
function pwGerarPass(o){const A="ABCDEFGHIJKLMNOPQRSTUVWXYZ",a="abcdefghijklmnopqrstuvwxyz",N="0123456789",Y="!@#$%^&*()-_=+[]{};:,.?/~";
  let sets=[];if(o.mai)sets.push(A);if(o.min)sets.push(a);if(o.num)sets.push(N);if(o.sim)sets.push(Y);if(!sets.length)sets=[a,N];
  if(o.amb)sets=sets.map(s=>s.replace(/[O0Il1|]/g,"")).filter(Boolean);
  const todos=sets.join(""),len=Math.max(8,Math.min(128,o.len|0||20)),rnd=n=>{const lim=Math.floor(4294967296/n)*n;const b=new Uint32Array(1);for(;;){crypto.getRandomValues(b);if(b[0]<lim)return b[0]%n}};
  for(let k=0;k<50;k++){let s="";for(let i=0;i<len;i++)s+=todos[rnd(todos.length)];if(sets.every(set=>[...s].some(c=>set.includes(c))))return s}
  let s="";for(let i=0;i<len;i++)s+=todos[rnd(todos.length)];return s}
// códigos de dois fatores (TOTP, RFC 6238): aceita a chave em base32 ou um endereço otpauth://
function pwB32(s){const A="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";s=String(s||"").toUpperCase().replace(/[^A-Z2-7]/g,"");let bits="";const out=[];for(const c of s)bits+=A.indexOf(c).toString(2).padStart(5,"0");for(let i=0;i+8<=bits.length;i+=8)out.push(parseInt(bits.slice(i,i+8),2));return new Uint8Array(out)}
async function pwTotp(seg,agora){let s=seg,dig=6,per=30,alg="SHA-1";
  try{if(/^otpauth:/i.test(seg)){const u=new URL(seg);s=u.searchParams.get("secret")||"";dig=+u.searchParams.get("digits")||6;per=+u.searchParams.get("period")||30;const al=(u.searchParams.get("algorithm")||"SHA1").toUpperCase();alg=al==="SHA256"?"SHA-256":al==="SHA512"?"SHA-512":"SHA-1"}}catch(e){}
  const k=pwB32(s);if(!k.length)return null;const key=await crypto.subtle.importKey("raw",k,{name:"HMAC",hash:alg},false,["sign"]);
  const ts=(agora||Date.now())/1000,c=Math.floor(ts/per),buf=new ArrayBuffer(8),dv=new DataView(buf);dv.setUint32(0,Math.floor(c/4294967296));dv.setUint32(4,c>>>0);
  const h=new Uint8Array(await crypto.subtle.sign("HMAC",key,buf)),o=h[h.length-1]&15,n=(((h[o]&127)<<24)|(h[o+1]<<16)|(h[o+2]<<8)|h[o+3])%Math.pow(10,dig);
  return{cod:String(n).padStart(dig,"0"),resta:per-Math.floor(ts)%per}}
async function pwCopiar(txt,rot){const S=pwS();S.ult=Date.now();try{await navigator.clipboard.writeText(txt);toast(`${rot} copiado — sai da área de transferência daqui a 30 s`)}catch(e){toast("O navegador não deixou copiar");return}
  clearTimeout(S.clipH);S.clipH=setTimeout(()=>{try{navigator.clipboard.writeText("").catch(()=>{})}catch(e){}},30000)}
function pwDataTxt(t){return t?new Date(t).toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"}):"—"}
function pwCats(){const S=pwS(),c=new Set(PW_CATS);for(const x of(S.dados&&S.dados.itens)||[])if(x.cat)c.add(x.cat);return [...c].sort((a,b)=>COLL_PT.compare(a,b))}
// ---------- desenho ----------
function pwLockHTML(){const S=pwS();
  const cab=(t,s)=>`<div class="pw-ico">${pwIco("cad")}</div><h2>${t}</h2><p class="hint">${s}</p>`;
  if(!S.blob&&!S.chk)return `<div class="card pw-lockc">${cab("A procurar o cofre…","Um momento.")}</div>`;
  if(S.rec)return `<div class="card pw-lockc">${cab("Guarde a chave de recuperação","É a única forma de abrir o cofre se a palavra-passe mestra for esquecida. Imprima-a ou escreva-a e guarde-a num sítio seguro. Não volta a ser mostrada.")}
    <div class="pw-rec"><code id="pwRecTxt">${esc(S.rec)}</code><div class="row" style="justify-content:center"><button class="pw-mini" type="button" data-pwreccop>Copiar</button><button class="pw-mini" type="button" data-pwrecprt>Imprimir</button></div></div>
    <label class="chip" style="margin-top:12px"><input type="checkbox" id="pwRecOk"> Já guardei a chave de recuperação</label><button class="b" type="button" id="pwRecFim" disabled>Abrir o cofre</button></div>`;
  if(!S.blob){if(S.nuvemTem===false)return `<div class="card pw-lockc">${cab("Criar o cofre da escola","O Pass360 guarda as palavras-passe da escola cifradas, só para a Direção. Escolha uma palavra-passe mestra (pelo menos 12 caracteres): é comum a toda a Direção e ninguém a consegue recuperar — por isso vai receber também uma chave de recuperação.")}
      <form id="pwFCriar" autocomplete="off"><input type="password" id="pwC1" placeholder="Palavra-passe mestra" autocomplete="new-password"><div class="pw-forca" id="pwCForca"></div><input type="password" id="pwC2" placeholder="Repetir a palavra-passe mestra" autocomplete="new-password"><div class="pw-err" id="pwCErr">${esc(S.erro)}</div><button class="b" type="submit">Criar o cofre</button></form></div>`;
    return `<div class="card pw-lockc">${cab("Sem ligação à base de dados","Não foi possível confirmar se o cofre da escola já existe. Para não criar um segundo cofre, o Pass360 só o cria com ligação. Tente outra vez daqui a pouco.")}<button class="b s" type="button" data-pwtentar>Tentar outra vez</button></div>`}
  if(S.modo==="rec")return `<div class="card pw-lockc">${cab("Abrir com a chave de recuperação","Escreva a chave de recuperação (com ou sem hífens). Depois de abrir, escolha uma palavra-passe mestra nova.")}
    <form id="pwFRec" autocomplete="off"><input type="text" id="pwRecIn" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" spellcheck="false" autocapitalize="characters"><input type="password" id="pwRN1" placeholder="Palavra-passe mestra nova" autocomplete="new-password"><input type="password" id="pwRN2" placeholder="Repetir a nova" autocomplete="new-password"><div class="pw-err" id="pwRErr">${esc(S.erro)}</div><button class="b" type="submit">Abrir e mudar a palavra-passe mestra</button></form><button class="pw-lnk" type="button" data-pwmodo="">Voltar</button></div>`;
  return `<div class="card pw-lockc">${cab("Cofre fechado","Escreva a palavra-passe mestra da Direção para abrir o cofre.")}
    <form id="pwFAbrir" autocomplete="off"><input type="password" id="pwM" placeholder="Palavra-passe mestra" autocomplete="current-password"><div class="pw-err" id="pwAErr">${esc(S.erro)}</div><button class="b" type="submit" id="pwAbrirB">Abrir o cofre</button></form>
    <button class="pw-lnk" type="button" data-pwmodo="rec">Esqueci-me da palavra-passe mestra</button></div>`}
function pwRender(t){pwCarregar().then(()=>{try{pwRender0(t)}catch(e){console.warn("Pass360",e)}})}
function pwRender0(t){const S=pwS(),sec=document.getElementById(t);if(!sec)return;
  if(!pwPode()){pwBloquear(true);sec.querySelectorAll(".pw-in").forEach(x=>x.hidden=true);const sl=sec.querySelector("[data-pwlock]");if(sl){sl.hidden=false;sl.innerHTML=`<div class="card pw-lockc"><h2>Só para a Direção</h2><p class="hint">O Pass360 só está disponível para a Direção da escola.</p></div>`}return}
  if(!S.blob&&!S.chk&&!S.a){S.a=true;pwTrazerNuvem().then(()=>{S.a=false;if(!S.chk&&!S.blob)S.chk=true;if(curTab===t)pwRender(t)})}
  const slot=sec.querySelector("[data-pwlock]"),inn=sec.querySelector(".pw-in");
  if(t==="pwGerar"){pwGerarRender();return}
  if(!pwAberto()||S.rec){if(slot){slot.innerHTML=pwLockHTML();slot.hidden=false;pwLockLigar(slot)}if(inn)inn.hidden=true;clearInterval(S.totpH);return}
  if(slot){slot.innerHTML="";slot.hidden=true}if(inn)inn.hidden=false;
  if(t==="pwCofre")pwCofreRender();else if(t==="pwSaude")pwSaudeRender();else if(t==="pwDef")pwDefRender()}
function pwLockLigar(el){const S=pwS();
  const fA=el.querySelector("#pwFAbrir");if(fA){const i=el.querySelector("#pwM");setTimeout(()=>i&&i.focus(),50);
    fA.onsubmit=async e=>{e.preventDefault();const v=i.value;if(!v)return;const b=el.querySelector("#pwAbrirB");b.disabled=true;b.textContent="A abrir…";const ok=await pwAbrir(v);i.value="";
      if(ok){S.erro="";pwRender(curTab)}else{S.erro="Palavra-passe mestra errada.";b.disabled=false;b.textContent="Abrir o cofre";el.querySelector("#pwAErr").textContent=S.erro;i.focus()}}}
  const fC=el.querySelector("#pwFCriar");if(fC){const a=el.querySelector("#pwC1"),b=el.querySelector("#pwC2");a.oninput=()=>{el.querySelector("#pwCForca").innerHTML=pwForcaHTML(a.value)};setTimeout(()=>a.focus(),50);
    fC.onsubmit=async e=>{e.preventDefault();const er=el.querySelector("#pwCErr");if(a.value.length<12){er.textContent="Use pelo menos 12 caracteres.";return}if(pwForca(a.value).n<3){er.textContent="Palavra-passe fraca: junte mais palavras, algarismos ou símbolos.";return}
      if(a.value!==b.value){er.textContent="As duas palavras-passe não são iguais.";return}
      await pwTrazerNuvem();if(S.blob||S.nuvemTem!==false){er.textContent="Já existe um cofre da escola: abra-o com a palavra-passe mestra.";pwRender(curTab);return}
      fC.querySelector("button").disabled=true;S.rec=await pwCriar(a.value);a.value=b.value="";pwRender(curTab)}}
  const fR=el.querySelector("#pwFRec");if(fR)fR.onsubmit=async e=>{e.preventDefault();const er=el.querySelector("#pwRErr"),n1=el.querySelector("#pwRN1").value,n2=el.querySelector("#pwRN2").value;
    if(n1.length<12||pwForca(n1).n<3){er.textContent="A palavra-passe mestra nova tem de ter pelo menos 12 caracteres e ser forte.";return}if(n1!==n2){er.textContent="As duas palavras-passe novas não são iguais.";return}
    const ok=await pwAbrirRec(el.querySelector("#pwRecIn").value);if(!ok){er.textContent="Chave de recuperação errada.";return}
    await pwNovaMestra(n1);S.modo="";S.erro="";toast("Cofre aberto — palavra-passe mestra mudada. Avise o resto da Direção.");pwRender(curTab)};
  el.querySelectorAll("[data-pwmodo]").forEach(b=>b.onclick=()=>{S.modo=b.dataset.pwmodo;S.erro="";pwRender(curTab)});
  const tt=el.querySelector("[data-pwtentar]");if(tt)tt.onclick=()=>{S.chk=false;S.a=false;pwRender(curTab)};
  const rc=el.querySelector("[data-pwreccop]");if(rc)rc.onclick=()=>pwCopiar(S.rec,"Chave de recuperação");
  const rp=el.querySelector("[data-pwrecprt]");if(rp)rp.onclick=()=>pwImprimirRec(S.rec);
  const ok=el.querySelector("#pwRecOk"),fim=el.querySelector("#pwRecFim");if(ok&&fim){ok.onchange=()=>{fim.disabled=!ok.checked};fim.onclick=()=>{S.rec="";pwRender(curTab)}}}
function pwImprimirRec(rec){const w=window.open("","_blank");if(!w){toast("O navegador bloqueou a janela — permita pop-ups");return}
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pass360 — chave de recuperação</title><style>body{font:14px/1.5 system-ui,sans-serif;margin:40px;max-width:640px}code{display:block;font-size:26px;font-weight:700;letter-spacing:.08em;border:2px dashed #999;padding:16px;margin:18px 0;text-align:center}</style></head><body><h2>EPISJ 360 · Pass360 — chave de recuperação do cofre da escola</h2><p>Abre o cofre das palavras-passe da Direção se a palavra-passe mestra for esquecida. Guarde esta folha num sítio seguro (por exemplo, no cofre da escola). Quem tiver esta chave consegue abrir o cofre.</p><code>${esc(rec)}</code><p>Gerada a ${new Date().toLocaleString("pt-PT")}. Uma chave nova anula esta.</p></body></html>`);w.document.close();w.focus();setTimeout(()=>w.print(),300)}
function pwFiltrados(){const S=pwS(),q=norm(S.q||"");return S.dados.itens.filter(x=>(!S.cat||x.cat===S.cat)&&(!q||norm([x.tit,x.user,x.url,x.cat,x.notas].join(" ")).includes(q)))
  .sort((a,b)=>(!!b.fav-!!a.fav)||COLL_PT.compare(a.tit||"",b.tit||""))}
function pwCofreRender(){const S=pwS();
  const cs=$("#pwCat");if(cs){const cats=pwCats().filter(c=>S.dados.itens.some(x=>x.cat===c));cs.innerHTML=`<option value="">Todas (${S.dados.itens.length})</option>`+cats.map(c=>`<option ${c===S.cat?"selected":""}>${esc(c)}</option>`).join("")}
  const L=pwFiltrados(),el=$("#pwLista");
  if(!S.dados.itens.length)el.innerHTML=`<div class="pw-vz">O cofre está vazio. Use <b>Nova entrada</b> ou importe um ficheiro CSV em Definições.</div>`;
  else if(!L.length)el.innerHTML=`<div class="pw-vz">Nenhuma entrada corresponde à procura.</div>`;
  else{let h="",ult=null;for(const x of L){const g=x.fav?"Favoritos":"Todas";if(g!==ult){h+=`<div class="pw-gh">${g}</div>`;ult=g}
      h+=`<button type="button" class="pw-it${x.id===S.sel?" on":""}" data-pwsel="${esc(x.id)}"><span class="pw-ii">${pwIco(pwIcoDe(x))}</span><span><b>${esc(x.tit||"(sem nome)")}</b><small>${esc([x.user,pwDom(x.url)||x.cat].filter(Boolean).join(" · "))}</small></span>${x.fav?`<span class="pw-fav" title="Favorito">★</span>`:""}</button>`}
    el.innerHTML=h}
  pwDetRender()}
function pwItem(id){return pwS().dados.itens.find(x=>x.id===id)}
function pwDetRender(){const S=pwS(),el=$("#pwDet");clearInterval(S.totpH);
  if(S.ed){const x=S.ed,cats=pwCats();
    el.innerHTML=`<div class="pw-ed"><h2>${x._novo?"Nova entrada":"Editar entrada"}</h2>
      <div class="row"><label class="grow">Nome<input type="text" id="pwETit" value="${esc(x.tit||"")}" placeholder="ex.: Box — conta da Direção"></label><label style="width:200px">Categoria<input type="text" id="pwECat" list="pwECats" value="${esc(x.cat||"")}"><datalist id="pwECats">${cats.map(c=>`<option value="${esc(c)}">`).join("")}</datalist></label></div>
      <div class="row"><label class="grow">Utilizador ou email<input type="text" id="pwEUser" value="${esc(x.user||"")}" autocomplete="off" spellcheck="false"></label></div>
      <div class="row"><label class="grow">Palavra-passe<span class="pw-pw"><input type="password" id="pwEPass" value="${esc(x.pass||"")}" autocomplete="new-password" spellcheck="false"><button class="pw-mini" type="button" data-pwev>Mostrar</button><button class="pw-mini" type="button" data-pweg>Gerar</button></span></label></div>
      <div class="pw-forca" id="pwEForca">${pwForcaHTML(x.pass)}</div>
      <div class="row" style="margin-top:10px"><label class="grow">Endereço (site)<input type="text" id="pwEUrl" value="${esc(x.url||"")}" placeholder="https://…" spellcheck="false"></label></div>
      <div class="row"><label class="grow">Chave de dois fatores (opcional)<input type="text" id="pwETotp" value="${esc(x.totp||"")}" placeholder="chave em base32 ou endereço otpauth://" spellcheck="false" autocomplete="off"></label></div>
      <div class="row"><label class="grow">Notas<textarea id="pwENotas">${esc(x.notas||"")}</textarea></label></div>
      <label class="chip"><input type="checkbox" id="pwEFav" ${x.fav?"checked":""}> favorito</label>
      <div class="row" style="margin-top:14px"><button class="b" type="button" id="pwEGuardar">Guardar</button><button class="b s" type="button" id="pwECanc">Cancelar</button></div></div>`;
    const pi=$("#pwEPass");pi.oninput=()=>{$("#pwEForca").innerHTML=pwForcaHTML(pi.value)};
    el.querySelector("[data-pwev]").onclick=e=>{const v=pi.type==="password";pi.type=v?"text":"password";e.target.textContent=v?"Esconder":"Mostrar"};
    el.querySelector("[data-pweg]").onclick=()=>{pi.value=pwGerarPass(S.gen);pi.type="text";el.querySelector("[data-pwev]").textContent="Esconder";pi.oninput()};
    $("#pwECanc").onclick=()=>{S.ed=null;pwDetRender()};
    $("#pwEGuardar").onclick=async()=>{const tit=$("#pwETit").value.trim();if(!tit){toast("Dê um nome à entrada");$("#pwETit").focus();return}
      const agora=Date.now(),ant=x._novo?null:pwItem(x.id),pass=pi.value;
      const n={id:x.id,tit,cat:$("#pwECat").value.trim(),user:$("#pwEUser").value.trim(),pass,url:$("#pwEUrl").value.trim(),totp:$("#pwETotp").value.trim(),notas:$("#pwENotas").value,fav:$("#pwEFav").checked,cr:x.cr||agora,em:agora,
        mud:ant&&ant.pass===pass?(ant.mud||ant.cr||agora):agora,hist:(ant&&ant.hist||[]).slice()};
      if(ant&&ant.pass&&ant.pass!==pass)n.hist=[{p:ant.pass,t:ant.mud||ant.em||agora}].concat(n.hist).slice(0,10);
      if(n.totp&&!(await pwTotp(n.totp))){toast("A chave de dois fatores não é válida (base32 ou otpauth://)");return}
      S.dados.itens=S.dados.itens.filter(y=>y.id!==n.id).concat(n);S.sel=n.id;S.ed=null;await pwGravar();pwCofreRender();toast("Entrada guardada")};
    return}
  const x=S.sel&&pwItem(S.sel);
  if(!x){el.innerHTML=`<div class="pw-vz">${S.dados.itens.length?"Escolha uma entrada na lista.":"Ainda não há entradas."}</div>`;return}
  const v=!!S.ver[x.id],u=pwUrlOk(x.url||""),f=pwForca(x.pass),rep=x.pass&&S.dados.itens.some(y=>y.id!==x.id&&y.pass===x.pass);
  const lin=(rot,val,acts)=>`<div class="pw-f"><span>${rot}</span><div>${val}</div><div class="pw-acts">${acts||""}</div></div>`;
  el.innerHTML=`<h2>${pwIco(pwIcoDe(x)).replace("<svg",'<svg style="width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:1.8"')}${esc(x.tit||"(sem nome)")}${x.fav?' <span class="pw-fav" style="color:#d39b00">★</span>':""}</h2>
    <p class="hint" style="margin:0 0 8px">${esc(x.cat||"Sem categoria")} · palavra-passe mudada a ${pwDataTxt(x.mud||x.cr)}</p>
    ${lin("Utilizador",esc(x.user||"—"),x.user?`<button class="pw-mini" type="button" data-pwcop="user">Copiar</button>`:"")}
    ${lin("Palavra-passe",x.pass?`<code>${v?esc(x.pass):"••••••••••••"}</code>`:"—",x.pass?`<button class="pw-mini" type="button" data-pwver>${v?"Esconder":"Mostrar"}</button><button class="pw-mini" type="button" data-pwcop="pass">Copiar</button>`:"")}
    ${x.pass?lin("Força",`<span class="pw-tag ${f.n<2?"b":f.n<3?"w":""}">${f.txt}</span>${rep?` <span class="pw-tag w">repetida noutra entrada</span>`:""}`):""}
    ${x.totp?lin("Código de 2 fatores",`<span class="pw-totp" id="pwTotp">······</span>`,`<button class="pw-mini" type="button" data-pwcop="totp">Copiar</button>`):""}
    ${lin("Endereço",u?`<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(x.url)}</a>`:esc(x.url||"—"),u?`<button class="pw-mini" type="button" data-pwcop="url">Copiar</button>`:"")}
    ${x.notas?lin("Notas",esc(x.notas).replace(/\n/g,"<br>")):""}
    ${x.hist&&x.hist.length?`<details style="margin-top:10px"><summary class="hint" style="cursor:pointer">Palavras-passe anteriores (${x.hist.length})</summary><ul class="pw-hist">${x.hist.map((h,i)=>`<li>${pwDataTxt(h.t)} — <code data-pwh="${i}">••••••••</code> <button class="pw-mini" type="button" data-pwhv="${i}">Mostrar</button></li>`).join("")}</ul></details>`:""}
    <p class="hint" style="margin:12px 0 0">Criada a ${pwDataTxt(x.cr)} · alterada a ${pwDataTxt(x.em)}</p>
    <div class="row" style="margin-top:12px"><button class="b" type="button" data-pwed>Editar</button><button class="b s" type="button" data-pwdel style="color:var(--bad)">Apagar</button></div>`;
  el.querySelectorAll("[data-pwcop]").forEach(b=>b.onclick=async()=>{const k=b.dataset.pwcop;if(k==="totp"){const r=await pwTotp(x.totp);if(r)pwCopiar(r.cod,"Código")}else pwCopiar(x[k],{user:"Utilizador",pass:"Palavra-passe",url:"Endereço"}[k])});
  const vb=el.querySelector("[data-pwver]");if(vb)vb.onclick=()=>{S.ver[x.id]=!S.ver[x.id];S.ult=Date.now();pwDetRender()};
  el.querySelectorAll("[data-pwhv]").forEach(b=>b.onclick=()=>{const i=+b.dataset.pwhv,c=el.querySelector(`[data-pwh="${i}"]`);const m=b.textContent==="Mostrar";c.textContent=m?x.hist[i].p:"••••••••";b.textContent=m?"Esconder":"Mostrar"});
  el.querySelector("[data-pwed]").onclick=()=>{S.ed=Object.assign({},x);pwDetRender()};
  el.querySelector("[data-pwdel]").onclick=async()=>{if(!confirm(`Apagar «${x.tit}» do cofre?\n\nSai do cofre em todos os computadores da Direção.`))return;
    S.dados.itens=S.dados.itens.filter(y=>y.id!==x.id);S.dados.del[x.id]=Date.now();S.sel="";await pwGravar();pwCofreRender();toast("Entrada apagada")};
  if(x.totp){const up=async()=>{const e=document.getElementById("pwTotp");if(!e||!pwAberto()){clearInterval(S.totpH);return}const r=await pwTotp(x.totp);if(r)e.innerHTML=`${r.cod.replace(/(\d{3})(\d+)/,"$1 $2")}<i>${r.resta} s</i>`};up();S.totpH=setInterval(up,1000)}}
function pwGerarRender(){const S=pwS(),g=S.gen;$("#pwGLen").value=g.len;$("#pwGLenV").textContent=g.len;$("#pwGMai").checked=g.mai;$("#pwGMin").checked=g.min;$("#pwGNum").checked=g.num;$("#pwGSim").checked=g.sim;$("#pwGAmb").checked=g.amb;
  const p=pwGerarPass(g);$("#pwGOut").textContent=p;$("#pwGForca").innerHTML=pwForcaHTML(p)}
function pwSaudeRender(){const S=pwS(),L=S.dados.itens.filter(x=>x.pass),agora=Date.now();
  const fracas=L.filter(x=>pwForca(x.pass).n<3),cont=new Map();for(const x of L)cont.set(x.pass,(cont.get(x.pass)||0)+1);
  const rep=L.filter(x=>cont.get(x.pass)>1),antigas=L.filter(x=>agora-(x.mud||x.cr||agora)>365*864e5),sem2=S.dados.itens.filter(x=>x.url&&!x.totp);
  const pct=L.length?Math.round(100*L.filter(x=>pwForca(x.pass).n>=3&&cont.get(x.pass)===1&&agora-(x.mud||x.cr||agora)<=365*864e5).length/L.length):100;
  const lista=(tit,desc,A,tag)=>`<div class="card"><h3 style="margin:0 0 4px">${tit} <span class="pw-tag ${A.length?tag:""}">${A.length}</span></h3><p class="hint">${desc}</p>${A.length?A.sort((a,b)=>COLL_PT.compare(a.tit||"",b.tit||"")).map(x=>`<button type="button" class="pw-it" data-pwir="${esc(x.id)}"><span class="pw-ii">${pwIco(pwIcoDe(x))}</span><span><b>${esc(x.tit||"(sem nome)")}</b><small>${esc([x.user,x.cat].filter(Boolean).join(" · "))}</small></span></button>`).join(""):`<p class="hint" style="margin:0">Nenhuma.</p>`}</div>`;
  $("#pwSaudeC").innerHTML=`<div class="tiles"><div class="tile"><div class="l">entradas</div><div class="v">${S.dados.itens.length}</div></div><div class="tile"><div class="l">palavras-passe em ordem</div><div class="v">${pct}%</div></div><div class="tile"><div class="l">fracas</div><div class="v" style="color:${fracas.length?"var(--bad)":"inherit"}">${fracas.length}</div></div><div class="tile"><div class="l">repetidas</div><div class="v" style="color:${rep.length?"var(--warn)":"inherit"}">${rep.length}</div></div><div class="tile"><div class="l">com mais de 1 ano</div><div class="v">${antigas.length}</div></div></div>`
    +lista("Palavras-passe fracas","Curtas, previsíveis ou com palavras comuns (nomes da escola, da terra, clubes, sequências). Mude-as por uma gerada.",fracas,"b")
    +lista("Palavras-passe repetidas","A mesma palavra-passe em mais de uma entrada: se uma conta for descoberta, as outras também ficam expostas.",rep,"w")
    +lista("Sem mudar há mais de um ano","Palavras-passe que não mudam há mais de 12 meses.",antigas,"w")
    +lista("Sites sem dois fatores guardados","Entradas com endereço e sem chave de dois fatores. Se o serviço permitir, ligue a verificação em dois passos e guarde aqui a chave.",sem2,"")}
function pwDefRender(){$("#pwMin").value=String(pwMinDe());$("#pwROut").innerHTML="";$("#pwImpMsg").innerHTML=""}
function pwMinDe(){let m=5;try{m=+(localStorage.getItem("pw_min")||5)}catch(e){}return [1,5,15,30].includes(m)?m:5}
// ---------- importar / exportar ----------
function pwCsv(t){const R=[];let r=[],c="",q=false;t=String(t).replace(/^﻿/,"");
  for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}
    else if(ch==='"')q=true;else if(ch===","||ch===";"&&!t.slice(0,t.indexOf("\n")).includes(",")){r.push(c);c=""}else if(ch==="\n"||ch==="\r"){if(ch==="\r"&&t[i+1]==="\n")i++;r.push(c);c="";if(r.some(x=>x!==""))R.push(r);r=[]}else c+=ch}
  r.push(c);if(r.some(x=>x!==""))R.push(r);return R}
function pwDeCsv(txt){const R=pwCsv(txt);if(R.length<2)return[];const H=R[0].map(h=>norm(h).replace(/[^a-z_]/g,""));
  const col=(...ks)=>{for(const k of ks){const i=H.indexOf(k);if(i>=0)return i}return -1};
  const iN=col("name","title","nome","titulo"),iU=col("url","login_uri","website","uri","endereco"),iL=col("username","login_username","user","utilizador","email","login"),iP=col("password","login_password","senha","palavrapasse"),
    iO=col("note","notes","extra","notas"),iT=col("login_totp","totp","otpauth","otp"),iC=col("folder","grouping","category","categoria","pasta"),iF=col("favorite","fav");
  if(iP<0)return null;const agora=Date.now();
  return R.slice(1).map(r=>({id:uid(),tit:(r[iN]||pwDom(r[iU]||"")||r[iL]||"(sem nome)").trim(),url:(r[iU]||"").trim(),user:(r[iL]||"").trim(),pass:r[iP]||"",notas:r[iO]||"",totp:(r[iT]||"").trim(),cat:(r[iC]||"").trim(),fav:/^(1|true|sim|yes)$/i.test(r[iF]||""),cr:agora,em:agora,mud:agora,hist:[]})).filter(x=>x.pass||x.user)}
async function pwImportar(novos,origem){const S=pwS();const chave=x=>[norm(x.tit||""),x.user||"",x.pass||""].join("\u0001"),tem=new Set(S.dados.itens.map(chave));let n=0,d=0;
  for(const x of novos){if(tem.has(chave(x))){d++;continue}tem.add(chave(x));S.dados.itens.push(x);n++}
  if(n)await pwGravar();$("#pwImpMsg").innerHTML=`<div class="msg ok" style="margin-top:10px">${origem}: ${n} entrada${n===1?"":"s"} nova${n===1?"":"s"}${d?` · ${d} já existia${d===1?"":"m"} (não repetidas)`:""}. Nada foi apagado.</div>`;toast(`${n} entrada(s) importada(s)`)}
function pwDescarregar(nome,txt,tipo){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([txt],{type:tipo}));a.download=nome;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000)}
// ---------- ligações (uma vez) ----------
(function(){const S=pwS();
  ["pointerdown","keydown","wheel","touchstart"].forEach(ev=>document.addEventListener(ev,()=>{if(PWS&&PWS.dek)PWS.ult=Date.now()},{passive:true,capture:true}));
  setInterval(()=>{if(PWS&&PWS.dek&&Date.now()-PWS.ult>pwMinDe()*60000)pwBloquear()},10000);
  document.querySelectorAll("[data-pwbloq]").forEach(b=>b.onclick=()=>pwBloquear());
  $("#pwQ").addEventListener("input",debounce(()=>{S.q=$("#pwQ").value;pwCofreRender()},120));
  $("#pwCat").onchange=e=>{S.cat=e.target.value;pwCofreRender()};
  $("#pwNova").onclick=()=>{S.ed={id:uid(),_novo:true,cat:S.cat||""};pwDetRender();setTimeout(()=>{const i=$("#pwETit");if(i)i.focus()},50)};
  $("#pwLista").addEventListener("click",e=>{const b=e.target.closest("[data-pwsel]");if(!b)return;S.sel=b.dataset.pwsel;S.ed=null;pwCofreRender()});
  $("#pwSaudeC").addEventListener("click",e=>{const b=e.target.closest("[data-pwir]");if(!b)return;S.sel=b.dataset.pwir;S.ed=null;show("pwCofre")});
  const g=()=>{S.gen={len:+$("#pwGLen").value,mai:$("#pwGMai").checked,min:$("#pwGMin").checked,num:$("#pwGNum").checked,sim:$("#pwGSim").checked,amb:$("#pwGAmb").checked};pwGerarRender()};
  ["#pwGLen","#pwGMai","#pwGMin","#pwGNum","#pwGSim","#pwGAmb"].forEach(s=>$(s).addEventListener("input",g));
  $("#pwGNova").onclick=()=>pwGerarRender();$("#pwGCop").onclick=()=>pwCopiar($("#pwGOut").textContent,"Palavra-passe");
  $("#pwMin").onchange=e=>{try{localStorage.setItem("pw_min",e.target.value)}catch(x){}toast("Bloqueio automático guardado")};
  $("#pwMNova").addEventListener("input",()=>{$("#pwMForca").innerHTML=pwForcaHTML($("#pwMNova").value)});
  $("#pwMMudar").onclick=async()=>{const a=$("#pwMAtual").value,n=$("#pwMNova").value,n2=$("#pwMNova2").value;
    if(!(await pwConfereMestra(a))){toast("A palavra-passe mestra atual não está certa");return}if(n.length<12||pwForca(n).n<3){toast("A nova tem de ter pelo menos 12 caracteres e ser forte");return}if(n!==n2){toast("As duas novas não são iguais");return}
    await pwNovaMestra(n);["#pwMAtual","#pwMNova","#pwMNova2"].forEach(s=>$(s).value="");$("#pwMForca").innerHTML="";toast("Palavra-passe mestra mudada — avise o resto da Direção")};
  $("#pwRNova").onclick=async()=>{if(!(await pwConfereMestra($("#pwRMestra").value))){toast("Escreva a palavra-passe mestra para gerar uma chave nova");return}
    if(!confirm("Gerar uma chave de recuperação nova? A anterior deixa de funcionar."))return;const rec=await pwNovaRec();$("#pwRMestra").value="";
    $("#pwROut").innerHTML=`<div class="pw-rec"><b>Chave de recuperação nova</b> — guarde-a já; não volta a ser mostrada.<code>${esc(rec)}</code><div class="row"><button class="pw-mini" type="button" id="pwRCop">Copiar</button><button class="pw-mini" type="button" id="pwRPrt">Imprimir</button></div></div>`;
    $("#pwRCop").onclick=()=>pwCopiar(rec,"Chave de recuperação");$("#pwRPrt").onclick=()=>pwImprimirRec(rec)};
  $("#pwImpCsv").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f||!pwAberto())return;const r=new FileReader();r.onload=async()=>{const L=pwDeCsv(r.result);
    if(!L){$("#pwImpMsg").innerHTML=`<div class="msg bad" style="margin-top:10px">Não encontrei a coluna da palavra-passe neste CSV.</div>`;return}await pwImportar(L,`«${f.name}»`)};r.readAsText(f)};
  $("#pwImpCif").onchange=e=>{const f=e.target.files[0];e.target.value="";if(!f||!pwAberto())return;const r=new FileReader();r.onload=async()=>{let b;try{b=JSON.parse(r.result)}catch(x){b=null}
    if(!b||!b.wM||!b.ct){$("#pwImpMsg").innerHTML=`<div class="msg bad" style="margin-top:10px">Este ficheiro não é uma cópia cifrada do Pass360.</div>`;return}
    const m=prompt("Palavra-passe mestra dessa cópia (a que estava em uso quando foi descarregada):");if(!m)return;let d=null;
    try{const dek=await pwUnwrap(b.wM,await pwKek(m,b.kdf.salM,b.kdf.it));d=pwNorm(await pwDecifrar(dek,b))}catch(x){}
    if(!d){$("#pwImpMsg").innerHTML=`<div class="msg bad" style="margin-top:10px">Palavra-passe mestra errada para essa cópia.</div>`;return}
    await pwImportar(d.itens.map(x=>Object.assign({},x,{id:pwItem(x.id)?uid():x.id})),`Cópia cifrada «${f.name}»`)};r.readAsText(f)};
  $("#pwExpCif").onclick=()=>{if(!S.blob||!S.blob.ct)return;pwDescarregar(`pass360_cofre_cifrado_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(S.blob),"application/json");toast("Cópia cifrada descarregada")};
  $("#pwExpCsv").onclick=async()=>{if(!pwAberto())return;if(!confirm("Exportar todas as palavras-passe À VISTA para um ficheiro CSV?\n\nQualquer pessoa que abra o ficheiro vê tudo. Use só para mudar de programa e apague o ficheiro logo a seguir."))return;
    const m=prompt("Para confirmar, escreva a palavra-passe mestra:");if(!m||!(await pwConfereMestra(m))){toast("Palavra-passe mestra errada — nada foi exportado");return}
    const q=v=>`"${String(v??"").replace(/"/g,'""')}"`;const t=["name,url,username,password,note,totp,folder,favorite"].concat(S.dados.itens.map(x=>[x.tit,x.url,x.user,x.pass,x.notas,x.totp,x.cat,x.fav?1:0].map(q).join(","))).join("\n");
    pwDescarregar(`pass360_A_VISTA_${new Date().toISOString().slice(0,10)}.csv`,"﻿"+t,"text/csv;charset=utf-8");toast("CSV exportado — apague-o depois de usar")};
})();
