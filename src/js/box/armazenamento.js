/* ---------- armazenamento local grande (IndexedDB): textos dos documentos, listagens e contagens ---------- */
const DB=(()=>{let p=null;
  const open=()=>p||(p=new Promise((ok,ko)=>{try{if(!window.indexedDB){ko(new Error("sem IndexedDB"));return}
    const r=indexedDB.open("boxcheck",1);
    r.onupgradeneeded=()=>{const d=r.result;["textos","listagens","kv"].forEach(n=>{if(!d.objectStoreNames.contains(n))d.createObjectStore(n)})};
    r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error);r.onblocked=()=>ko(new Error("bloqueado"))}catch(e){ko(e)}}));
  const tx=async(store,mode,fn)=>{const d=await open();return new Promise((ok,ko)=>{const t=d.transaction(store,mode);const s=t.objectStore(store);let res;const rq=fn(s);if(rq)rq.onsuccess=()=>{res=rq.result};t.oncomplete=()=>ok(res);t.onerror=()=>ko(t.error);t.onabort=()=>ko(t.error||new Error("abortado"))})};
  return{
    get:(s,k)=>tx(s,"readonly",st=>st.get(k)).catch(()=>undefined),
    put:(s,k,v)=>tx(s,"readwrite",st=>st.put(v,k)).then(()=>true).catch(e=>{console.warn("DB",e);return false}),
    all:s=>tx(s,"readonly",st=>st.getAll()).catch(()=>[]),
    del:(s,k)=>tx(s,"readwrite",st=>st.delete(k)).catch(()=>{})}})();
// 0.9.35: ao abrir, se a cópia no IndexedDB for mais recente do que a do localStorage (por exemplo, porque o localStorage estava cheio), junta-se
DB.get("kv","cfgCopia").then(c=>{if(!c||!c.s||RO||LIMPAR)return;const lt=+(localStorage.getItem(KEY+"_t")||0);
  if(c.t>lt+500&&c.s!==lastStored){try{const o=JSON.parse(c.s);cfg=juntarCfg(o,cfg);try{migrate()}catch(e){}lastJSON=JSON.stringify(cfg);cfgRev++;persist(lastJSON);try{refreshAll()}catch(e){}}catch(e){console.warn("cópia",e)}}}).catch(()=>{});


/* ---------- análise do texto de um documento: palavras, enchimento e "impressão" para comparar textos ---------- */
const TX=new Map(); // sha1 -> {sha1, n: início do texto normalizado, w: n.º de palavras, u, top, lorem, rep, sig} (w=null: a Box não tem texto)
function fnv(s){let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)}return h>>>0}
const MH=64,MHA=new Uint32Array(MH),MHB=new Uint32Array(MH);{let x=12345;const r=()=>{x=(Math.imul(x^(x>>>15),0x2c1b3c6d)+0x297a2d39)>>>0;return x};for(let i=0;i<MH;i++){MHA[i]=r()|1;MHB[i]=r()}}
function analisarTexto(raw){
  const full=norm(String(raw||"")).slice(0,60000);
  const tk=full.match(/[a-z0-9]{2,}/g)||[];const w=tk.length;
  const freq=new Map();for(const t of tk)freq.set(t,(freq.get(t)||0)+1);
  let mx=0;for(const v of freq.values())if(v>mx)mx=v;
  const top=w?mx/w:0,u=w?freq.size/w:0;
  const lorem=/lorem ipsum|dolor sit amet|consectetur adipiscing/.test(full);
  const rep=/(.)\1{11,}/.test(full.replace(/[\s._\-=*|]/g,""))||/\b([a-z0-9]{2,})(\s+\1\b){5,}/.test(full);
  // impressão do texto (minhash sobre sequências de 5 palavras): dois textos quase iguais têm impressões quase iguais
  const sig=new Uint32Array(MH).fill(0xffffffff);const lim=Math.min(w,5000),k=lim>=5?5:Math.max(1,lim);
  const th=new Uint32Array(lim);for(let i=0;i<lim;i++)th[i]=fnv(tk[i]);
  for(let i=0;i+k<=lim;i++){let h=th[i];for(let q=1;q<k;q++)h=Math.imul(h^th[i+q],0x01000193)>>>0;
    for(let j=0;j<MH;j++){const v=(Math.imul(MHA[j],h)+MHB[j])>>>0;if(v<sig[j])sig[j]=v}}
  return{n:full.slice(0,8000),w,u,top,lorem,rep,sig};
}
const simSig=(a,b)=>{let s=0;for(let i=0;i<MH;i++)if(a[i]===b[i])s++;return s/MH};
const bandKeys=t=>t.bk||(t.bk=Array.from({length:16},(_,b)=>b+":"+t.sig[b*4]+","+t.sig[b*4+1]+","+t.sig[b*4+2]+","+t.sig[b*4+3]));
const textosProntos=DB.all("textos").then(all=>{const lim=Date.now()-7*864e5;
  for(const r of all){if(!r||!r.sha1)continue;if(r.w==null){if((r.t||0)>lim)TX.set(r.sha1,r)}else if(r.sig)TX.set(r.sha1,r)}
  txRev++});
async function guardarTexto(sha1,txt){const a=analisarTexto(txt);a.sha1=sha1;TX.set(sha1,a);txRev++;await DB.put("textos",sha1,a)}
async function guardarSemTexto(sha1){const a={sha1,w:null,t:Date.now()};TX.set(sha1,a);await DB.put("textos",sha1,a)}

/* ---------- listagens guardadas por pasta analisada, e contagens (pontos de comparação) ---------- */
const lsJ=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?d:v}catch(e){return d}};
const resumos=()=>lsJ("box_resumos",{});
async function guardarListagem(j){
  const ok=await DB.put("listagens","L|"+j.rootId,j);
  const r=resumos();r[j.rootId]={pasta:j.pasta,quando:j.quando,t:j.t,tFull:j.tFull||j.t,pos:!!j.pos,n:j.nF,np:j.nP};
  try{localStorage.setItem("box_resumos",JSON.stringify(r));localStorage.setItem("box_last_root",j.rootId);
    if(ok)localStorage.removeItem("box_last_listing")}catch(e){}
  if(!ok){try{localStorage.setItem("box_last_listing",JSON.stringify(j))}catch(e){}}
  setTimeout(renderAnalises,0);
  return ok}
async function lerListagem(rootId){let j=await DB.get("listagens","L|"+rootId);
  if(!j){const o=lsJ("box_last_listing",null);if(o&&o.itens&&(o.rootId||"legacy")===rootId)j=o}
  return j||null}
const basesIdx=()=>lsJ("box_bases",{});
// uma contagem guarda só os ficheiros (é com ela que o painel Alterações compara o estado atual)
async function criarBase(j,label){
  const b={rootId:j.rootId,t:Date.now(),quando:j.quando,pasta:j.pasta,label,
    itens:j.itens.filter(x=>x.type!=="folder").map(x=>({id:x.id,path:x.path,name:x.name,size:x.size??null,sha1:x.sha1||"",modified_at:x.modified_at||""}))};
  if(!await DB.put("listagens","B|"+j.rootId+"|"+b.t,b))return null;
  const idx=basesIdx(),l=(idx[j.rootId]=idx[j.rootId]||[]);l.unshift({t:b.t,quando:b.quando,label,n:b.itens.length});
  while(l.length>12){const old=l.pop();DB.del("listagens","B|"+j.rootId+"|"+old.t)}
  try{localStorage.setItem("box_bases",JSON.stringify(idx))}catch(e){}
  setTimeout(()=>nuvemBases(j.rootId),0);
  return b}
const lerBase=(rootId,t)=>DB.get("listagens","B|"+rootId+"|"+t);
// análise guardada pelas versões anteriores (no armazenamento pequeno do navegador): passa para a base de dados local
const migrarListagem=(async()=>{try{const o=lsJ("box_last_listing",null);if(!o||!o.itens)return;
  if(!o.rootId)o.rootId="legacy";o.nP=o.itens.filter(x=>x.type==="folder").length;o.nF=o.itens.length-o.nP;
  if(await guardarListagem(o)&&!(basesIdx()[o.rootId]||[]).length)await criarBase(o,"Análise de "+o.quando)}catch(e){console.warn(e)}})();

function download(name,text,type){
  try{const b=text instanceof Blob?text:new Blob([text],{type:type||"text/plain;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}
  catch(e){toast("Não foi possível descarregar — use Copiar")}}
const hoje=()=>{const d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}; // 0.9.110: data local (nos Açores, entre as 23h e a meia-noite, a data em UTC já era a do dia seguinte)
const dataPT=t=>new Date(t).toLocaleDateString("pt-PT");
function toast(m){const t=$("#toast");t.textContent=m;t.classList.add("on");clearTimeout(t._h);t._h=setTimeout(()=>t.classList.remove("on"),2200)}
async function copy(txt){try{await navigator.clipboard.writeText(txt);toast("Copiado")}catch(e){toast("Não foi possível copiar — selecione o texto e use Ctrl+C")}}

