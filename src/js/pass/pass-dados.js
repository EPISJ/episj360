/* Pass360 — dados (carregado sempre, com o resto da app): estado, normalização, guardar e trazer da nuvem, widget do Painel.
   O ecrã do módulo está em pass/pass.js e só é carregado quando o módulo é aberto (fase 2 da separação do código, 0.9.133). */
/* ===================== 0.9.98: Pass360 — gestor de palavras-passe da Direção =====================
   Segurança:
   · Tudo é cifrado NESTE computador. A base de dados (peça «PW» de g360_estado) e o IndexedDB (kv/pw) só guardam o cofre cifrado.
   · Chave dos dados (DEK): AES-GCM 256 aleatória. Está guardada «embrulhada» duas vezes: com a chave tirada da palavra-passe mestra
     e com a chave tirada da chave de recuperação (PBKDF2-SHA256, 600 000 iterações, sal aleatório de 16 bytes, cada uma o seu).
     Mudar a palavra-passe mestra só volta a embrulhar a DEK (os dados não mudam).
   · Cada gravação usa um IV novo (12 bytes). O AES-GCM autentica: um cofre alterado ou uma palavra-passe errada não abre.
   · A DEK e as entradas só existem em memória enquanto o cofre está aberto; fecha-se sozinho (falta de uso, modo de privacidade).
   · O que se copia é limpo da área de transferência ao fim de 30 s. Nunca se escreve nada em claro no navegador.
   · Só a Direção vê o módulo (pwPode); o cofre não é publicado para formadores/formandos.
   Arranque: tudo com function/var (pode ser desenhado antes de o resto do script correr). */
var PWS=null;
function pwS(){if(!PWS)PWS={blob:null,dek:null,dados:null,sel:"",q:"",cat:"",ed:null,ver:{},ult:Date.now(),clipH:null,salvarH:null,carregado:null,chk:false,nuvemTem:null,a:false,
  gen:{len:20,mai:true,min:true,num:true,sim:true,amb:true},rec:"",totpH:null,erro:"",modo:""};return PWS}
var PW_IT=600000,PW_CATS=["Box","Office 365","Pleon","Redes sociais","Wi-Fi","Equipamentos","Serviços públicos","Bancos","Fornecedores","Outros"];
function pwPode(){try{const p=PREV||(EU&&EU.perfil)||"";return p==="dexec"||p==="dped"||(!PREV&&!!EU&&!!EU.admin)}catch(e){return false}}
function pwAberto(){const S=pwS();return !!(S.dek&&S.dados)}
function pwCarregar(){const S=pwS();return S.carregado||(S.carregado=DB.get("kv","pw").then(v=>{if(v&&v.ct&&(!S.blob||(v.t||0)>(S.blob.t||0)))S.blob=v}).catch(()=>{}))}
function pwB64(u8){let s="";for(let i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s)}
function pwU8(b){return Uint8Array.from(atob(b),c=>c.charCodeAt(0))}
function pwSal(){return pwB64(crypto.getRandomValues(new Uint8Array(16)))}
async function pwKek(pass,sal,it){const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(String(pass).normalize("NFC")),"PBKDF2",false,["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2",hash:"SHA-256",salt:pwU8(sal),iterations:it||PW_IT},base,{name:"AES-GCM",length:256},false,["wrapKey","unwrapKey"])}
async function pwWrap(dek,kek){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.wrapKey("raw",dek,kek,{name:"AES-GCM",iv});return{iv:pwB64(iv),ct:pwB64(new Uint8Array(ct))}}
async function pwUnwrap(w,kek){return crypto.subtle.unwrapKey("raw",pwU8(w.ct),kek,{name:"AES-GCM",iv:pwU8(w.iv)},{name:"AES-GCM",length:256},true,["encrypt","decrypt"])}
async function pwCifrar(dek,obj){const iv=crypto.getRandomValues(new Uint8Array(12));const ct=await crypto.subtle.encrypt({name:"AES-GCM",iv},dek,new TextEncoder().encode(JSON.stringify(obj)));return{iv:pwB64(iv),ct:pwB64(new Uint8Array(ct))}}
async function pwDecifrar(dek,b){const pt=await crypto.subtle.decrypt({name:"AES-GCM",iv:pwU8(b.iv)},dek,pwU8(b.ct));return JSON.parse(new TextDecoder().decode(pt))}
// chave de recuperação: 24 caracteres de um alfabeto de 32 (120 bits), em grupos de 4
function pwCodRec(){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789",r=crypto.getRandomValues(new Uint8Array(24));let s="";for(let i=0;i<24;i++){s+=A[r[i]%32];if(i%4===3&&i<23)s+="-"}return s}
function pwRecNorm(s){return String(s||"").toUpperCase().replace(/[^A-Z0-9]/g,"")}
function pwNorm(d){d=d&&typeof d==="object"?d:{};return{itens:Array.isArray(d.itens)?d.itens.filter(x=>x&&x.id):[],del:d.del&&typeof d.del==="object"?d.del:{}}}
function pwJuntar(a,b){const del=Object.assign({},b.del||{},a.del||{}),m=new Map();
  for(const x of(b.itens||[]).concat(a.itens||[]))if(x&&x.id&&!del[x.id]){const q=m.get(x.id);if(!q||(x.em||0)>=(q.em||0))m.set(x.id,x)}
  return{itens:[...m.values()],del}}
async function pwCriar(mestra){const S=pwS();const dek=await crypto.subtle.generateKey({name:"AES-GCM",length:256},true,["encrypt","decrypt"]);
  const rec=pwCodRec(),salM=pwSal(),salR=pwSal();
  S.blob={v:2,kdf:{n:"PBKDF2-SHA256",it:PW_IT,salM,salR},wM:await pwWrap(dek,await pwKek(mestra,salM,PW_IT)),wR:await pwWrap(dek,await pwKek(pwRecNorm(rec),salR,PW_IT)),criado:Date.now()};
  S.dek=dek;S.dados={itens:[],del:{}};S.ult=Date.now();await pwGravar(true);return rec}
async function pwGravar(ja){const S=pwS();if(!S.dek||!S.dados||RO)return;const c=await pwCifrar(S.dek,S.dados),t=Date.now();
  S.blob=Object.assign({},S.blob,{iv:c.iv,ct:c.ct,t,por:(EU&&EU.email)||""});try{await DB.put("kv","pw",S.blob)}catch(e){}
  clearTimeout(S.salvarH);const env=()=>{try{if(NUVOK()&&!nuvDesl())nuvemPut("PW",S.blob,S.blob.t)}catch(e){}};if(ja)env();else S.salvarH=setTimeout(env,1200)}
async function pwAbrir(mestra){const S=pwS(),b=S.blob;if(!b||!b.wM)return false;let dek;
  try{dek=await pwUnwrap(b.wM,await pwKek(mestra,b.kdf.salM,b.kdf.it))}catch(e){return false}
  S.dek=dek;S.dados=b.ct?pwNorm(await pwDecifrar(dek,b)):{itens:[],del:{}};S.ult=Date.now();return true}
async function pwAbrirRec(rec){const S=pwS(),b=S.blob;if(!b||!b.wR)return false;let dek;
  try{dek=await pwUnwrap(b.wR,await pwKek(pwRecNorm(rec),b.kdf.salR,b.kdf.it))}catch(e){return false}
  S.dek=dek;S.dados=b.ct?pwNorm(await pwDecifrar(dek,b)):{itens:[],del:{}};S.ult=Date.now();return true}
async function pwNovaMestra(nova){const S=pwS();if(!S.dek)return;const salM=pwSal();S.blob=Object.assign({},S.blob,{kdf:Object.assign({},S.blob.kdf,{salM,it:PW_IT}),wM:await pwWrap(S.dek,await pwKek(nova,salM,PW_IT))});await pwGravar(true)}
async function pwNovaRec(){const S=pwS();if(!S.dek)return"";const rec=pwCodRec(),salR=pwSal();S.blob=Object.assign({},S.blob,{kdf:Object.assign({},S.blob.kdf,{salR}),wR:await pwWrap(S.dek,await pwKek(pwRecNorm(rec),salR,PW_IT))});await pwGravar(true);return rec}
async function pwConfereMestra(m){const S=pwS(),b=S.blob;if(!b||!b.wM)return false;try{await pwUnwrap(b.wM,await pwKek(m,b.kdf.salM,b.kdf.it));return true}catch(e){return false}}
function pwBloquear(silencio){const S=pwS();const ab=pwAberto();S.dek=null;S.dados=null;S.ed=null;S.ver={};S.rec="";clearInterval(S.totpH);
  if(ab&&!silencio)toast("Cofre do Pass360 fechado");if(curTab&&/^pw/.test(curTab))pwRender(curTab)}
// nuvem: traz o cofre mais recente; se estiver aberto, junta as entradas (as duas versões, a mais recente de cada entrada)
async function pwTrazerNuvem(){try{await pwCarregar();if(RO||!pwPode()||!NUVOK()||nuvDesl())return;const S=pwS();
    const idx=(await(await nuvem("GET","")).json()).itens||{};S.chk=true;S.nuvemTem=!!idx.PW;
    if(idx.PW&&(idx.PW.t||0)>((S.blob&&S.blob.t)||0)){const r=await nuvemGet("PW");if(!r||!r.wM)return;
      if(pwAberto()){let d=null;try{d=r.ct?pwNorm(await pwDecifrar(S.dek,r)):{itens:[],del:{}}}catch(e){}
        if(d){const n=pwJuntar(S.dados,d);const muda=JSON.stringify(n.itens)!==JSON.stringify(d.itens);S.blob=Object.assign({},r);S.dados=n;try{await DB.put("kv","pw",S.blob)}catch(e){}if(muda)await pwGravar()}
        else{S.blob=r;try{await DB.put("kv","pw",r)}catch(e){}pwBloquear(true);toast("O cofre do Pass360 foi substituído noutro computador — volte a abri-lo")}}
      else{S.blob=r;try{await DB.put("kv","pw",r)}catch(e){}}
      if(curTab&&/^pw/.test(curTab))pwRender(curTab)}
    else if(S.blob&&S.blob.ct&&(S.blob.t||0)>((idx.PW||{}).t||0))await nuvemPut("PW",S.blob,S.blob.t)}catch(e){}}
