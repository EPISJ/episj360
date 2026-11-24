/* GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 0.9.244 — ecrã do módulo «folder», carregado quando é aberto */
"use strict";
// ===== src/js/folder/fmp12.js =====
/* ===================== Leitor de ficheiros FileMaker .fmp12 (0.9.234) =====================
   Port em JavaScript do fmptools — Copyright (c) 2020 Evan Miller, licença MIT (https://github.com/evanmiller/fmptools):
   setores de 4096 bytes, cadeia de blocos-folha, pedaços com caminhos (push/pop), texto em SCSU com XOR 0x5A.
   Só leitura; corre no navegador sobre um ArrayBuffer (o ficheiro inteiro). */
function fmpLer(buf){
  const u8=new Uint8Array(buf),SS=4096,HL=20,MAG=[0,1,0,0,0,2,0,1,0,5,0,2,0,2,0xC0];
  for(let i=0;i<MAG.length;i++)if(u8[i]!==MAG[i])throw new Error("Não é um ficheiro do FileMaker (.fmp12).");
  const sig=String.fromCharCode(...u8.subarray(15,20));
  if(sig==="HBAMe")throw new Error("Este ficheiro do FileMaker está cifrado (Encryption at Rest): abra-o no FileMaker e grave uma cópia sem cifra.");
  if(sig!=="HBAM7")throw new Error("Versão do FileMaker não suportada (só .fmp12).");
  const I2=o=>(u8[o]<<8)|u8[o+1],I4=o=>((u8[o]<<24)>>>0)+(u8[o+1]<<16)+(u8[o+2]<<8)+u8[o+3];
  const nb=I4(SS+8);if(!nb||(nb+1)*SS!==u8.length)throw new Error("O ficheiro do FileMaker parece incompleto ou danificado.");
  const off=i=>SS+i*SS; // bloco i (0 = primeiro, a seguir ao cabeçalho)
  const lvl=i=>I2(off(i)+12),prev=i=>I4(off(i)+4),next=i=>I4(off(i)+8);
  let first=2;for(let i=1;i<nb;i++)if(lvl(i)===0&&prev(i)===0){first=i+1;break}
  // pedaços de um bloco: {t:tipo,c:código,r:ref,s:segmento,o:início,l:comprimento}  (t: S=dados simples, R=ref simples, L=ref longa, G=segmento, P=push, Q=pop)
  function pedacos(bi){const base=off(bi)+HL,end=base+SS-HL,out=[];let p=base,pops=0;
    while(p<end){let c=u8[p],k=null;if((c&0xC0)===0xC0){c&=0x3F;pops++}
      if(c===0x00){p++;if(p>=end||u8[p]===0)break;k={t:"S",o:p,l:1};p+=1}
      else if(c<=0x05){p++;const r=u8[p++],l=(c===1?1:0)+2*(c-1);k={t:"R",r,o:p,l};p+=l}
      else if(c===0x06){p++;const r=u8[p++],l=u8[p++];k={t:"R",r,o:p,l};p+=l}
      else if(c===0x07){p++;const s=u8[p++],l=I2(p);p+=2;k={t:"G",s,o:p,l};p+=l}
      else if(c===0x08){p++;k={t:"S",o:p,l:2};p+=2}
      else if(c===0x0E&&u8[p+1]===0xFF){p++;k={t:"S",o:p,l:6};p+=6}
      else if(c<=0x0D){p++;const r=0x80+((u8[p]&0x7F)<<8)+u8[p+1];p+=2;const l=(c===9?1:0)+2*(c-9);k={t:"R",r,o:p,l,k2:1};p+=l}
      else if(c===0x0E){p++;const r=0x80+((u8[p]&0x7F)<<8)+u8[p+1];p+=2;const l=u8[p++];k={t:"R",r,o:p,l,k2:1};p+=l}
      else if(c===0x0F){p++;const s=0x80+((u8[p]&0x7F)<<8)+u8[p+1];p+=2;const l=I2(p);p+=2;k={t:"G",s,o:p,l,k2:1};p+=l}
      else if(c===0x10){p++;k={t:"S",o:p,l:3};p+=3}
      else if(c>=0x11&&c<=0x15){p++;const l=3+(c===0x11?1:0)+2*(c-0x11);k={t:"S",o:p,l};p+=l}
      else if(c===0x16){p++;p+=3;const l=u8[p++];k={t:"L",o:p,l};p+=l}
      else if(c===0x17){p++;p+=3;const l=I2(p);p+=2;k={t:"L",o:p,l};p+=l}
      else if(c===0x18){p++;const l=u8[p++];k={t:"S",o:p,l};p+=l}
      else if(c===0x1B&&!u8[p+1]){p+=2;const r=u8[p++];k={t:"R",r,o:p,l:4};p+=4}
      else if(c>=0x19&&c<=0x1D){p++;const l=u8[p++];k={t:"S",o:p,l};p+=l+(c===0x19?1:0)+2*(c-0x19)}
      else if(c===0x1E){p++;const rl=u8[p++];p+=rl;const l=u8[p++];k={t:"L",o:p,l};p+=l}
      else if(c===0x1F){p++;const rl=u8[p++];p+=rl;const l=I2(p);p+=2;k={t:"L",o:p,l};p+=l}
      else if(c===0x20){p++;if(u8[p]===0xFE){p++;k={t:"P",o:p,l:8};p+=8}else{k={t:"P",o:p,l:1};p+=1}}
      else if(c===0x23){p++;const l=u8[p++];k={t:"S",o:p,l};p+=l}
      else if(c===0x28){p++;k={t:"P",o:p,l:2};p+=2}
      else if(c===0x30){p++;k={t:"P",o:p,l:3};p+=3}
      else if(c===0x38){p++;const l=u8[p++];k={t:"P",o:p,l};p+=l}
      else if(c===0x3D||c===0x40){p++;k={t:"Q"}}
      else if(c===0x80||c===0x88){p++;continue}
      else break; // código desconhecido: fica com o que já leu
      k.c=c;out.push(k);while(pops){out.push({t:"Q"});pops--}}
    return out}
  const pv=k=>{if(!k)return 0;if(k.l===1)return u8[k.o];if(k.l===2)return 0x80+((u8[k.o]&0x7F)<<8)+u8[k.o+1];if(k.l===3)return 0x80+(u8[k.o+1]<<8)+u8[k.o+2];return 0};
  // percorre a cadeia de folhas; f(pedaço, caminho) devolve "fim" para parar
  function percorrer(f){const vis=new Uint8Array(nb+1);let b=first;
    while(b&&b-1<nb&&!vis[b]){vis[b]=1;const path=[];
      for(const k of pedacos(b-1)){if(k.t==="Q"){if(path.length)path.pop();continue}if(k.t==="P")path.push(k);if(f(k,path)==="fim")return}
      b=next(b-1)}}
  function texto(o,l){const a=new Uint8Array(l);for(let i=0;i<l;i++)a[i]=u8[o+i]^0x5A;return fmpScsu(a)}
  function nomeChunk(k,path,nl){ // name_chunk do fmptools
    if(path.length===nl)return k.t==="R"&&k.r===16?1:0;
    if(path.length===nl+1&&pv(path[nl])===16){if(k.t==="R"&&k.r>=1)return k.r===1?1:2;if(k.t==="G"&&k.s>=1)return k.s===1?1:2}return 0}
  function tabelas(){const T=[];percorrer((k,path)=>{if(pv(path[0])>3)return "fim";
      if(path.length>=4&&pv(path[0])===3&&pv(path[1])===16&&pv(path[2])===5&&pv(path[3])>=128){const n=nomeChunk(k,path,4);if(!n)return;
        const i=pv(path[3])-128;if(!i)return;const t=T[i]||(T[i]={i,nome:""});const s=texto(k.o,k.l);t.nome=n===1?s:t.nome+s}});
    return T.filter(Boolean)}
  // registos de uma tabela: [{campo:valor}] (texto; repetições separadas por \u001D)
  function registos(ti){const cols=[],rows=new Map(),T=ti+128;let cur=null,lastRow=0,lastCol=0,raw=[];
    const fecha=()=>{if(!cur)return;const r=rows.get(cur.row)||rows.set(cur.row,{}).get(cur.row),n=cols[cur.col]||("campo"+cur.col);
      const tot=raw.reduce((s,x)=>s+x.length,0),a=new Uint8Array(tot);let o=0;for(const x of raw){a.set(x,o);o+=x.length}
      for(let i=0;i<a.length;i++)a[i]^=0x5A;const v=fmpScsu(a);r[n]=r[n]!==undefined&&cur.long?r[n]+v:v;cur=null;raw=[]};
    percorrer((k,path)=>{const p0=pv(path[0]);if(p0>T)return "fim";if(p0<T)return;if(k.t!=="R"&&k.t!=="G")return;
      const d=path.length-1;
      if(path.length>=4&&pv(path[1])===3&&pv(path[2])===5){const n=nomeChunk(k,path,4);if(n){const ci=pv(path[3]);if(ci){const s=texto(k.o,k.l);cols[ci]=n===1?s:(cols[ci]||"")+s}return}}
      if((d===3||d===4)&&pv(path[1])===3&&pv(path[2])===5)return;
      let ci=0,long=false;const row=pv(path[2]);
      if(d===3&&pv(path[0])>=128&&pv(path[1])===5){const cp=path[path.length-1];ci=pv(cp);if(cp.l===2&&ci>=0x80&&!cols[ci])ci=(ci-0x80)>>8;
        if(!ci||!(lastCol===0||ci<lastCol?row>lastRow:row===lastRow))return;if(k.t==="R"&&k.r===0)return;long=true}
      else if(d===2&&pv(path[0])>=128&&pv(path[1])===5){if(k.t==="R"){if(k.r===252)return;ci=k.r}else ci=k.s;if(ci>=0x80&&k.k2&&!cols[ci])ci=(ci-0x80)>>8}
      if(!ci||!cols[ci])return;
      if(cur&&(ci!==cur.col||row!==cur.row))fecha();else if(cur&&!long)fecha();
      if(!cur)cur={row,col:ci,long};raw.push(u8.slice(k.o,k.o+k.l));lastRow=row;lastCol=ci});
    fecha();return{campos:cols.map((n,i)=>n?{i,n}:null).filter(Boolean),registos:[...rows.entries()].sort((a,b)=>a[0]-b[0]).map(x=>x[1])}}
  return{tabelas,registos}}
// SCSU → texto (como o convert_scsu_to_utf8 do fmptools)
function fmpScsu(a){const SW=[0,0x80,0x100,0x300,0x2000,0x2080,0x2100,0x3000],DW=[0x80,0xC0,0x400,0x600,0x900,0x3040,0x30A0,0xFF00];
  const OT=x=>x>0&&x<0x68?x*0x80:x<0xA8?x*0x80+0xAC00:x===0xF9?0xC0:x===0xFA?0x250:x===0xFB?0x370:x===0xFC?0x530:x===0xFD?0x3040:x===0xFE?0x30A0:x===0xFF?0xFF60:0;
  let i=0,uni=0,sh=0,win=0,hs=0,last=0,s="";while(i<a.length&&a[i]===0x20)i++; // o fmptools tira os espaços do início
  while(i<a.length){const c=a[i++];let u=0;
    if(uni){if(c===0xF0){u=(a[i]<<8)|a[i+1];i+=2}else if(c>=0xE0&&c<=0xE7){win=c-0xE0;uni=0;continue}else if(c>=0xE8&&c<=0xEF){DW[win=c-0xE8]=OT(a[i++]);uni=0;continue}else if(c===0xF1){DW[win=(a[i]&0xE0)>>5]=0x10000+0x80*(((a[i]&0x1F)<<8)+a[i+1]);i+=2;uni=0;continue}else{u=(c<<8)|a[i++]}}
    else if(sh){const w=sh-1;u=c<0x80?SW[w]+c:DW[w]+(c-0x80);sh=0}
    else if(c===0x0F){uni=1;continue}else if(c===0x0E){u=(a[i]<<8)|a[i+1];i+=2}else if(c>=1&&c<=8){sh=c;continue}else if(c>=0x10&&c<=0x17){win=c-0x10;continue}
    else if(c>=0x18&&c<=0x1F){DW[win=c-0x18]=OT(a[i++]);continue}else if(c===0x0B){DW[win=(a[i]&0xE0)>>5]=0x10000+0x80*(((a[i]&0x1F)<<8)+a[i+1]);i+=2;continue}
    else if(c===0x09)u=32;else if(c===0x0A&&last===0x0D){last=c;continue}else if(c===0x0A||c===0x0D)u=10;else if(c>=0x20&&c<=0x7F)u=c;else if(c>=0x80)u=DW[win]+(c-0x80);else u=0xFFFD;
    if(u>=0xDC00&&u<=0xDFFF)u=0x10000+(hs<<10)+(u&0x3FF);else if(u>=0xD800&&u<=0xDBFF){hs=u&0x3FF;continue}hs=0;
    if(u>0)s+=String.fromCodePoint(u);last=u}
  return s}
// ===== src/js/folder/folder.js =====
/* Folder360 — ecrã do módulo (carregado só quando o Folder360 é aberto; os dados estão em folder/folder-dados.js) */
// ---------- Code 128 (conjuntos B e C) ----------
var FO_C128="212222 222122 222221 121223 121322 131222 122213 122312 132212 221213 221312 231212 112232 122132 122231 113222 123122 123221 223211 221132 221231 213212 223112 312131 311222 321122 321221 312212 322112 322211 212123 212321 232121 111323 131123 131321 112313 132113 132311 211313 231113 231311 112133 112331 132131 113123 113321 133121 313121 211331 231131 213113 213311 213131 311123 311321 331121 312113 312311 332111 314111 221411 431111 111224 111422 121124 121421 141122 141221 112214 112412 122114 122411 142112 142211 241211 221114 413111 241112 134111 111242 121142 121241 114212 124112 124211 411212 421112 421211 212141 214121 412121 111143 111341 131141 114113 114311 411113 411311 113141 114131 311141 411131 211412 211214 211232 2331112".split(" ");
function foC128(txt){const s=pdfTxt(String(txt||"")).replace(/[^\x20-\x7e]/g,"?"),v=[];let mode="",i=0;
  const dig=k=>{let n=0;while(k+n<s.length&&/\d/.test(s[k+n]))n++;return n};
  while(i<s.length){const n=dig(i);
    if(n>=4&&(i===0||n>=6||i+n===s.length)){let m=n-(n%2);if(n%2&&i>0){if(mode!=="B"){v.push(mode?100:104);mode="B"}v.push(s.charCodeAt(i)-32);i++;m=n-1-((n-1)%2)}
      if(m>=2){if(mode!=="C"){v.push(mode?99:105);mode="C"}for(let k=0;k<m;k+=2){v.push(+s.substr(i,2));i+=2}continue}}
    if(mode!=="B"){v.push(mode?100:104);mode="B"}v.push(s.charCodeAt(i)-32);i++}
  if(!v.length)v.push(104);let ck=v[0];for(let k=1;k<v.length;k++)ck+=k*v[k];v.push(ck%103,106);
  return v.map(x=>FO_C128[x]).join("").split("").map(Number)}
function foBarSvg(txt,h){const w=foC128(txt),M=w.reduce((a,b)=>a+b,0)+20;let x=10,r="";w.forEach((b,i)=>{if(i%2===0)r+=`M${x} 0h${b}v${h}h-${b}z`;x+=b});
  return `<svg class="fd-bar" viewBox="0 0 ${M} ${h}" preserveAspectRatio="none" aria-label="Código de barras ${esc(txt)}"><path d="${r}" fill="#111"/></svg>`}
function foPdfBar(doc,x,y,w,h,txt){const W=foC128(txt),M=W.reduce((a,b)=>a+b,0)+20,u=w/M;let p=x+10*u;doc.setFillColor(0,0,0);W.forEach((b,i)=>{if(i%2===0)doc.rect(p,y,b*u,h,"F");p+=b*u})}
// ---------- QR code (lib/qrcode.js, MIT, Kazuhiko Arase) ----------
async function foLibQR(){if(!window.qrcode)await loadScript("lib/qrcode.js");try{qrcode.stringToBytes=qrcode.stringToBytesFuncs["UTF-8"]}catch(e){}return window.qrcode}
function foQR(txt){try{const q=qrcode(0,"M");q.addData(String(txt||""),"Byte");q.make();const n=q.getModuleCount();return{n,d:(r,c)=>q.isDark(r,c)}}catch(e){return null}}
function foQRSvg(txt){const q=window.qrcode&&foQR(txt);if(!q)return"";let r="";for(let y=0;y<q.n;y++)for(let x=0;x<q.n;x++)if(q.d(y,x))r+=`M${x+2} ${y+2}h1v1h-1z`;
  return `<svg class="fd-qr" viewBox="0 0 ${q.n+4} ${q.n+4}" shape-rendering="crispEdges" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${r}" fill="#111"/></svg>`}
function foPdfQR(doc,x,y,s,txt){const q=foQR(txt);if(!q)return;const u=s/q.n;doc.setFillColor(0,0,0);
  for(let r=0;r<q.n;r++){let c=0;while(c<q.n){if(q.d(r,c)){let e=c;while(e<q.n&&q.d(r,e))e++;doc.rect(x+c*u,y+r*u,(e-c)*u+.01,u+.01,"F");c=e}else c++}}}
// o QR das lombadas e do relatório leva a ligação ao SharePoint (como no FileMaker); sem ligação, leva o código de localização
function foQRTxt(d){return d.url||foCod(d)}

// ---------- desenho ----------
var FO_ICO={pasta:'<svg viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  scan:'<svg viewBox="0 0 24 24"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M10 8v8M13 8v8M16 8v8"/></svg>',
  out:'<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',
  ok:'<svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>'};
function foVz(ic,t){return `<div class="pp-vz"><i>${FO_ICO[ic]||FO_ICO.pasta}</i><div>${t}</div></div>`}
function foChip(e){return `<span class="pp-chip ${e.k==="ok"?"mu":e.k}">${esc(e.txt)}</span>`}
function foUniq(L){return[...new Set(L.filter(x=>x&&String(x).trim()))]}
function foAnos(){const L=foUniq(FOL.dossiers.map(d=>d.ano).concat(escData().anos.map(a=>a.nome)));return L.sort((a,b)=>COLL_PTN.compare(b,a))}
function foRender(t){foCarregar().then(()=>{try{foDef();
  document.querySelectorAll("[data-fddir]").forEach(x=>x.disabled=!foEd());
  if(t==="foInicio")foInicioUI();else if(t==="foMapa")foMapaUI();else if(t==="foMov")foMovUI();else if(t==="foConf")foConfUI();else if(t==="foImp")foImpUI();else if(t==="foRel")foRelUI();else if(t==="foDef")foDefUI()}
  catch(e){console.warn("Folder360",e)}})}

// ----- Arquivo (início): números, filtros, lista e ficha do dossier -----
function foFiltrados(){const U=FO_UI,q=norm(U.q||"");return FOL.dossiers.filter(d=>{
  if(U.arq&&d.arq!==U.arq)return false;if(U.arm&&d.arm!==U.arm)return false;if(U.prat&&d.prat!==U.prat)return false;if(U.ano&&d.ano!==U.ano)return false;
  if(U.tipo&&d.tipo!==U.tipo)return false;if(U.fin&&d.fin!==U.fin)return false;
  if(U.est){const e=foEstado(d);if(U.est==="req"&&e.k==="ok")return false;if(U.est==="atraso"&&e.k!=="ba")return false;if(U.est==="rep"&&!foRepetido(d))return false;if(U.est==="semurl"&&d.url)return false}
  if(q){const h=norm([foCod(d),d.curso,d.tit,d.proj,d.ano,d.anoCur,d.obs,d.cbAntigo,d.fin,d.tipo].join(" "));if(!q.split(/\s+/).every(w=>h.includes(w)))return false}
  return true}).sort(foCmp)}
function foInicioUI(){const D=FOL.dossiers,ed=foEd(),U=FO_UI;
  const req=D.filter(d=>foEstado(d).k!=="ok"),at=D.filter(d=>foEstado(d).k==="ba"),rep=new Set(D.filter(foRepetido).map(d=>d.id)),arqs=foUniq(D.map(d=>d.arq));
  const anos=foUniq(D.map(d=>d.ano)).sort(COLL_PTN.compare),comUrl=D.filter(d=>d.url).length;
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  $("#foHero").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Arquivo Físico</h1><div class="sub">Dossiers técnico-pedagógicos e da Direção, com o sítio exato de cada um: arquivo, armário, prateleira e número.</div></div><span class="grow"></span>
    ${D.length?`<div class="ay-pct"><b>${Math.round((D.length-req.length)/D.length*100)}%</b>no arquivo agora</div>`:""}</div>
    <div class="ay-stats">${st("Dossiers",D.length,`em ${arqs.length} arquivo${arqs.length===1?"":"s"}`)}${st("Anos letivos",anos.length,anos.length?`${anos[0]} a ${anos[anos.length-1]}`:"")}${st("Requisitados",req.length,at.length?`${at.length} em atraso`:"nenhum em atraso")}${st("Com ligação ao SharePoint",`${comUrl}/${D.length}`)}${rep.size?st("Códigos repetidos",rep.size,"dois dossiers no mesmo sítio"):""}</div></div>`;
  const E=foDef();
  $("#foFiltros").innerHTML=`<label class="grow" style="min-width:220px">Procurar<input type="text" id="foQ" value="${esc(U.q)}" placeholder="código, curso, título, n.º de projeto… ou leia o código de barras"></label>
    <label>Arquivo<select data-fdf="arq">${foOpts(foUniq(E.arqs.map(a=>a.cod).concat(arqs)).map(c=>({v:c,t:foArqNome(c)})),U.arq,"Todos")}</select></label>
    <label>Armário<select data-fdf="arm">${foOpts(U.arq?foArms(U.arq):foUniq(D.map(d=>d.arm)).sort(),U.arm,"Todos")}</select></label>
    <label>Prateleira<select data-fdf="prat">${foOpts(U.arq?foPrats(U.arq):foUniq(D.map(d=>d.prat)).sort((a,b)=>(FO_ROM[a]||99)-(FO_ROM[b]||99)),U.prat,"Todas")}</select></label>
    <label>Ano letivo<select data-fdf="ano">${foOpts(anos.slice().reverse(),U.ano,"Todos")}</select></label>
    <label>Tipo<select data-fdf="tipo">${foOpts(foUniq(E.tipos.concat(D.map(d=>d.tipo))),U.tipo,"Todos")}</select></label>
    <label>Financiamento<select data-fdf="fin">${foOpts(foUniq(E.fins.map(f=>f.n).concat(D.map(d=>d.fin))),U.fin,"Todos")}</select></label>
    <label>Estado<select data-fdf="est">${foOpts([{v:"req",t:"Requisitados"},{v:"atraso",t:"Em atraso"},{v:"rep",t:"Código repetido"},{v:"semurl",t:"Sem ligação"}],U.est,"Todos")}</select></label>`;
  foListaUI();foFichaUI()}
function foListaUI(){const L=foFiltrados(),U=FO_UI,nm=Object.keys(U.marc).filter(k=>U.marc[k]).length,ed=foEd();
  const todos=L.length&&L.every(d=>U.marc[d.id]);
  $("#foAcoes").innerHTML=`<span class="hint" style="margin:0">${L.length} dossier${L.length===1?"":"s"}${L.length!==FOL.dossiers.length?" (filtrados)":""}${nm?` · <b>${nm} selecionado${nm===1?"":"s"}</b> <a href="#" data-fdlimpar>limpar</a>`:""}</span><span class="grow"></span>
    <button class="b s" data-fdimp="lomb" title="Lombadas dos dossiers selecionados (ou dos filtrados, se não houver seleção)">Lombadas</button>
    <button class="b s" data-fdimp="etq" title="Etiquetas com o código de barras">Etiquetas</button>
    <button class="b s" data-fdimp="rel" title="Relatório por arquivo em PDF">Relatório</button>
    ${ed?`<button class="b s" data-fdmover title="Mudar os dossiers selecionados de arquivo, armário ou prateleira">Mudar de sítio</button>`:""}
    <button class="b s" data-fdxls title="Exportar a lista para Excel">Excel</button>`;
  const N=Math.min(L.length,U.n);
  $("#foLista").innerHTML=L.length?`<div class="tw"><table class="rt fd-t"><thead><tr><th style="width:30px"><input type="checkbox" data-fdtodos${todos?" checked":""} aria-label="Selecionar todos"></th><th>Código</th><th>Curso</th><th>Dossier</th><th>Vol.</th><th>Ano letivo</th><th>Estado</th></tr></thead><tbody>${L.slice(0,N).map(d=>{const e=foEstado(d),r=foRepetido(d);
      return `<tr data-fd="${d.id}" class="${U.sel===d.id?"on":""}"><td><input type="checkbox" data-fdmarc${U.marc[d.id]?" checked":""} aria-label="Selecionar"></td><td class="fd-cod">${esc(foCod(d))}</td><td class="fd-cur"><span title="${esc(foCursoCurto(d))}">${esc(foCursoCurto(d))}</span></td><td>${esc(d.tit||"")}${d.princ?' <span class="pp-chip mu" title="Dossier principal">principal</span>':""}</td><td class="fd-nw">${esc(foVolTxt(d))}</td><td class="fd-nw">${esc(d.ano||"")}${d.anoCur?`<br><span class="hint" style="margin:0">${esc(d.anoCur)}</span>`:""}</td><td>${e.k==="ok"?"":foChip(e)}${r?' <span class="pp-chip ba" title="Há outro dossier com o mesmo código (o mesmo sítio)">repetido</span>':""}</td></tr>`}).join("")}</tbody></table></div>
      ${L.length>N?`<div style="text-align:center;margin-top:10px"><button class="b s" data-fdmais>Mostrar mais ${Math.min(150,L.length-N)} (de ${L.length-N})</button></div>`:""}`
    :foVz("pasta",FOL.dossiers.length?"Nenhum dossier com estes filtros.":"Ainda não há dossiers no arquivo."+(foEd()?` Carregue em «Novo dossier» ou traga os dossiers do FileMaker:<br><span class="row" style="gap:8px;justify-content:center;margin-top:10px"><label class="b imp">Importar do FileMaker (.fmp12)<input type="file" accept=".fmp12" data-foimpfm hidden></label><label class="b imp">Importar cópia (.json)<input type="file" accept=".json,application/json" data-foimp hidden></label></span><div id="foImpMsg"></div>`:""))}
function foSel(){return FOL.dossiers.find(d=>d.id===FO_UI.sel)||null}
function foFichaUI(){const d=foSel(),el=$("#foFicha");if(!el)return;
  if(!d){el.innerHTML=`<div class="card fd-fvz">${foVz("pasta","Escolha um dossier da lista para ver onde está, mudar os dados ou imprimir a lombada.")}</div>`;return}
  const E=foDef(),ed=foEd(),dis=ed?"":"disabled",e=foEstado(d),cod=foCod(d),H=FOL.mov.filter(m=>m.dId===d.id).sort((a,b)=>(b.saida||"").localeCompare(a.saida||""));
  const arqs=foUniq(E.arqs.map(a=>a.cod).concat([d.arq]));
  const inp=(k,l,o)=>`<label${o&&o.w2?' class="w2"':""}>${l}<input type="${o&&o.type||"text"}" data-fdk="${k}" value="${esc(d[k]||"")}"${o&&o.dl?` list="${o.dl}"`:""}${o&&o.ph?` placeholder="${esc(o.ph)}"`:""} ${dis}></label>`;
  const sel=(k,l,L)=>`<label>${l}<select data-fdk="${k}" ${dis}>${foOpts(foUniq(L.concat([d[k]])),d[k]||"","—")}</select></label>`;
  el.innerHTML=`<div class="card fd-ficha">
    <div class="fd-fh"><div><div class="fd-fcod">${esc(cod)}</div><div class="hint" style="margin:2px 0 0">${esc(foArqNome(d.arq))} · armário ${esc(d.arm||"—")} · prateleira ${esc(d.prat||"—")} · n.º ${esc(d.ns||"—")}</div></div><span class="grow"></span>${foChip(e)}${foRepetido(d)?' <span class="pp-chip ba">código repetido</span>':""}</div>
    <div class="fd-top"><div class="fd-codes"><div class="fd-barw">${foBarSvg(cod,40)}<small>${esc(cod)}</small></div><div class="fd-qrw" id="foQRw" title="${esc(foQRTxt(d))}"></div></div><div class="fd-lpv"><div class="fd-lpt">Lombada</div><button type="button" class="fd-lpc" id="foLPv" data-fdpdf="lomb" title="Pré-visualização da lombada (${esc(String(+E.lombW||65))} mm) — carregue para criar o PDF"><span class="spin"></span></button><small>${esc(String(+E.lombW||65))} × 158 mm · carregue para o PDF</small></div></div>
    ${e.m?`<div class="msg ${e.k==="ba"?"bad":"info"}" style="margin:8px 0">Requisitado por <b>${esc(e.m.quem||"—")}</b> desde ${esc(calDMA(e.m.saida))}${e.m.prev?` · devolução prevista a ${esc(calDMA(e.m.prev))}`:""}${ed?` <button class="b s" data-fddev="${e.m.id}" style="margin-left:6px">Devolvido</button>`:""}</div>`:""}
    <div class="pp-form fd-form">
      <label>Arquivo<select data-fdk="arq" ${dis}>${foOpts(arqs.map(c=>({v:c,t:foArqNome(c)})),d.arq||"","—")}</select></label>
      ${sel("arm","Armário",foArms(d.arq))}${sel("prat","Prateleira",foPrats(d.arq))}
      <label>N.º na prateleira<span class="fd-in2"><input type="text" data-fdk="ns" value="${esc(d.ns||"")}" ${dis}>${ed?`<button class="b s" type="button" data-fdprox title="O primeiro número livre desta prateleira">próximo</button>`:""}</span></label>
      ${inp("ano","Ano letivo",{dl:"foAnosDL",ph:"2026/2027"})}${sel("anoCur","Ano curricular",E.anosCur)}
      ${inp("curso","Curso",{dl:"foCursosDL",w2:1,ph:"985 - Produção Agropecuária (20-23)"})}
      ${inp("tit","Dossier (título)",{dl:"foTitDL",w2:1})}
      ${inp("vol","Volume")}${inp("volT","de (total de volumes)")}
      ${inp("proj","N.º de projeto",{dl:"foProjDL"})}${sel("fin","Financiamento",E.fins.map(f=>f.n))}
      ${sel("tipo","Tipo",E.tipos)}
      <label class="fd-ck"><input type="checkbox" data-fdk="princ"${d.princ?" checked":""} ${dis}> Dossier principal</label>
      <label class="w2">Ligação (SharePoint/OneDrive)<span class="fd-in2"><input type="url" data-fdk="url" value="${esc(d.url||"")}" placeholder="https://…" ${dis}>${d.url?`<a class="b s" href="${escUrl(d.url)}" target="_blank" rel="noopener">Abrir</a>`:""}</span></label>
      <label class="w2">Observações<textarea data-fdk="obs" rows="2" ${dis}>${esc(d.obs||"")}</textarea></label>
    </div>
    ${d.cbAntigo&&d.cbAntigo.toUpperCase()!==cod.toUpperCase()?`<p class="hint">No FileMaker, o código de barras impresso era <b>${esc(d.cbAntigo)}</b> (escrito à mão, não batia certo com o sítio). As etiquetas novas levam o código de localização.</p>`:""}
    <div class="fd-btns">
      <button class="b s" data-fdpdf="lomb">Lombada</button><button class="b s" data-fdpdf="etq">Etiqueta</button><button class="b s" data-fdpdf="cd">Etiqueta de CD</button>
      <span class="grow"></span>
      ${ed?`${e.k==="ok"?`<button class="b s" data-fdreq>Requisitar</button>`:""}<button class="b s" data-fddup title="Cria o volume seguinte no lugar seguinte da prateleira">Duplicar</button><button class="b s danger" data-fdapagar>Apagar</button>`:""}
    </div>
    <p class="hint fd-meta">Criado ${d.cr?esc(new Date(d.cr).toLocaleDateString("pt-PT")):"—"}${d.por?" por "+esc(d.por):""} · alterado ${d.em?esc(new Date(d.em).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):"—"}${d.mod?" por "+esc(d.mod):""}${d.origem?" · veio do "+esc(d.origem):""}</p>
    ${H.length?`<h3 class="fd-h3">Requisições</h3><div class="fd-hist">${H.slice(0,8).map(m=>`<div><b>${esc(m.quem||"—")}</b> · ${esc(calDM(m.saida,{day:"numeric",month:"short",year:"numeric"}))} → ${m.dev?esc(calDM(m.dev,{day:"numeric",month:"short",year:"numeric"})):"<i>ainda fora</i>"}${m.obs?` · ${esc(m.obs)}`:""}</div>`).join("")}</div>`:""}
  </div>`;
  foLibQR().then(()=>{const w=$("#foQRw");if(w&&foSel()===d)w.innerHTML=foQRSvg(foQRTxt(d))+`<small>${d.url?"abre a pasta":"código"}</small>`}).catch(()=>{});
  foLombPrev(d);
  foDatalists()}
function foDatalists(){const E=foDef(),dl=(id,L)=>{let x=document.getElementById(id);if(!x){x=document.createElement("datalist");x.id=id;document.body.appendChild(x)}x.innerHTML=foUniq(L).map(v=>`<option value="${esc(v)}">`).join("")};
  let tur=[];try{tur=escData().turmas.map(t=>{const c=t.cod?String(t.cod):"";return(c&&/^\d+$/.test(c)?c+" - ":"")+turmaNome(t)})}catch(e){}
  dl("foCursosDL",FOL.cursos.map(c=>c.nome).concat(tur,FOL.dossiers.map(d=>d.curso)));dl("foTitDL",E.titulos.concat(FOL.dossiers.map(d=>d.tit)));
  let fse=[];try{fse=escData().turmas.map(t=>t.fse)}catch(e){}dl("foProjDL",FOL.dossiers.map(d=>d.proj).concat(fse));dl("foAnosDL",foAnos())}
function foNovo(base){const U=FO_UI,a=anoAtivo(),b=base||{};const arq=b.arq||U.arq||(foSel()||{}).arq||"ARQ1",arm=b.arm||U.arm||(foSel()||{}).arm||"A",prat=b.prat||U.prat||(foSel()||{}).prat||"I";
  const d={id:uid()+uid(),arq,arm,prat,ns:foProxNs(arq,arm,prat),ano:b.ano||(a&&a.nome)||"",anoCur:b.anoCur||"",curso:b.curso||"",cursoNum:b.cursoNum||"",tit:b.tit||"Dossier Tecnicopedagógico",
    vol:b.vol||"1",volT:b.volT||"1",proj:b.proj||"",fin:b.fin||"",tipo:b.tipo||"Tecnicopedagógico",princ:!!b.princ,url:b.url||"",obs:"",cbAntigo:"",cr:Date.now(),por:String(EU&&EU.email||""),origem:""};
  FOL.dossiers.push(d);foGuardar(d);U.sel=d.id;return d}
function foMudar(d,k,v){if(k==="princ")d.princ=!!v;else d[k]=v;
  if(k==="curso")d.cursoNum=foNumCurso(v);
  if(k==="arq"){const A=foArms(v),P=foPrats(v);if(A.length&&!A.includes(d.arm))d.arm=A[0];if(P.length&&!P.includes(d.prat))d.prat=P[0]}
  if(k==="volT"&&d.vol&&+d.vol>+v&&+v)d.vol=v;
  foGuardar(d)}
// eventos do Arquivo
(function(){const S=document.getElementById("foInicio");if(!S)return;
  S.addEventListener("input",e=>{if(e.target.id==="foQ"){FO_UI.q=e.target.value;FO_UI.n=150;clearTimeout(foQH);foQH=setTimeout(foListaUI,140)}});
  S.addEventListener("keydown",e=>{if(e.target.id==="foQ"&&e.key==="Enter"){const d=foAchar(e.target.value);if(d){FO_UI.sel=d.id;FO_UI.q="";e.target.value="";foListaUI();foFichaUI();toast("Encontrado: "+foCod(d))}}});
  S.addEventListener("change",e=>{const f=e.target.closest("[data-fdf]");if(f){FO_UI[f.dataset.fdf]=f.value;if(f.dataset.fdf==="arq"){FO_UI.arm="";FO_UI.prat=""}FO_UI.n=150;foInicioUI();return}
    const k=e.target.closest("[data-fdk]");if(k&&foEd()){const d=foSel();if(!d)return;foMudar(d,k.dataset.fdk,k.type==="checkbox"?k.checked:k.value.trim());foListaUI();foFichaUI();return}
    if(e.target.matches("[data-fdmarc]")){const tr=e.target.closest("tr");FO_UI.marc[tr.dataset.fd]=e.target.checked;foListaUI();return}
    if(e.target.matches("[data-fdtodos]")){foFiltrados().forEach(d=>FO_UI.marc[d.id]=e.target.checked);foListaUI()}});
  S.addEventListener("click",e=>{const tr=e.target.closest("tr[data-fd]");
    if(tr&&!e.target.closest("input,a,button")){FO_UI.sel=tr.dataset.fd;S.querySelectorAll("tr[data-fd]").forEach(x=>x.classList.toggle("on",x===tr));foFichaUI();if(innerWidth<1100){const f=$("#foFicha");if(f)f.scrollIntoView({behavior:"smooth",block:"start"})}return}
    const b=e.target.closest("button,a");if(!b)return;const d=foSel();
    if(b.matches("[data-fdlimpar]")){e.preventDefault();FO_UI.marc={};foListaUI();return}
    if(b.matches("[data-fdmais]")){FO_UI.n+=150;foListaUI();return}
    if(b.id==="foNovoB"){if(!foEd())return;foNovo();foInicioUI();toast("Dossier criado — complete os dados");setTimeout(()=>{const i=document.querySelector('#foFicha [data-fdk="curso"]');if(i)i.focus()},60);return}
    if(b.id==="foScanB"){foScanAbrir(t=>{const x=foAchar(t);if(x){FO_UI.sel=x.id;foListaUI();foFichaUI();toast("Encontrado: "+foCod(x));return true}toast("Não encontrado: "+t);return false});return}
    if(b.matches("[data-fdimp]")){FO_UI.impTipo=b.dataset.fdimp==="rel"?FO_UI.impTipo:b.dataset.fdimp;FO_UI.impFonte=foMarcados().length?"marc":"filt";show(b.dataset.fdimp==="rel"?"foRel":"foImp");return}
    if(b.matches("[data-fdxls]")){foExcel(foMarcados().length?foMarcados():foFiltrados());return}
    if(b.matches("[data-fdmover]")){foMoverUI();return}
    if(!d)return;
    if(b.matches("[data-fdprox]")){d.ns=foProxNs(d.arq,d.arm,d.prat,d.id);foGuardar(d);foListaUI();foFichaUI();return}
    if(b.matches("[data-fdpdf]")){foPdf(b.dataset.fdpdf,[d]);return}
    if(b.matches("[data-fddup]")){const n=foNovo(Object.assign({},d,{vol:d.vol&&!isNaN(+d.vol)?String(+d.vol+1):d.vol,volT:d.volT&&+d.vol+1>+d.volT?String(+d.vol+1):d.volT,url:d.url}));n.princ=false;foGuardar(n);foInicioUI();toast("Duplicado: "+foCod(n));return}
    if(b.matches("[data-fdapagar]")){if(!confirm(`Apagar o dossier ${foCod(d)} (${d.tit||""})?\n\nSai da lista em todos os computadores. As requisições dele ficam no histórico.`))return;
      FOL.dossiers=FOL.dossiers.filter(x=>x.id!==d.id);FOL.del[d.id]=Date.now();FO_UI.sel="";delete FO_UI.marc[d.id];foGuardar();foInicioUI();toast("Dossier apagado");return}
    if(b.matches("[data-fdreq]")){foReqNova(d);return}
    if(b.matches("[data-fddev]")){foDevolver(b.dataset.fddev);foFichaUI();foListaUI();return}})})();
var foQH;
function foMarcados(){return FOL.dossiers.filter(d=>FO_UI.marc[d.id]).sort(foCmp)}
function foMoverUI(){const L=foMarcados();if(!L.length){toast("Selecione primeiro os dossiers na lista");return}const E=foDef();
  const box=document.createElement("div");box.className="fd-modal";box.innerHTML=`<div class="card fd-mcard"><h2>Mudar ${L.length} dossier${L.length===1?"":"s"} de sítio</h2>
    <p class="hint">Os números na prateleira continuam a seguir os que lá estão, pela ordem da lista. O código de localização muda sozinho.</p>
    <div class="pp-form"><label>Arquivo<select id="foMvA">${foOpts(E.arqs.map(a=>({v:a.cod,t:foArqNome(a.cod)})),L[0].arq)}</select></label><label>Armário<select id="foMvM"></select></label><label>Prateleira<select id="foMvP"></select></label>
    <label class="fd-ck"><input type="checkbox" id="foMvN" checked> Renumerar a partir do primeiro número livre</label></div>
    <div class="fd-btns"><span class="grow"></span><button class="b s" data-x>Cancelar</button><button class="b" data-ok>Mudar</button></div></div>`;
  document.body.appendChild(box);const up=()=>{const a=$("#foMvA").value;$("#foMvM").innerHTML=foOpts(foArms(a),L[0].arm);$("#foMvP").innerHTML=foOpts(foPrats(a),L[0].prat)};up();
  $("#foMvA").onchange=up;box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-x]")){box.remove();return}
    if(e.target.closest("[data-ok]")){const a=$("#foMvA").value,m=$("#foMvM").value,p=$("#foMvP").value,ren=$("#foMvN").checked;
      L.forEach(d=>{d.arq=a;d.arm=m;d.prat=p;if(ren)d.ns=foProxNs(a,m,p,d.id);foGuardar(d)});box.remove();foInicioUI();toast(`${L.length} dossier${L.length===1?"":"s"} mudado${L.length===1?"":"s"} para ${a}-${m}${p}`)}})}

// ----- Mapa do arquivo -----
function foMapaUI(){const D=FOL.dossiers,E=foDef(),arqs=foUniq(E.arqs.map(a=>a.cod).concat(D.map(d=>d.arq)));
  if(!FO_UI.mapa||!arqs.includes(FO_UI.mapa))FO_UI.mapa=arqs.find(c=>D.some(d=>d.arq===c))||arqs[0]||"";const A=FO_UI.mapa;
  const cont=c=>D.filter(d=>d.arq===c).length;
  $("#foMapaArqs").innerHTML=arqs.map(c=>`<button class="fd-tab${c===A?" on":""}" data-fdmapa="${esc(c)}">${esc(foArqNome(c))}<span>${cont(c)}</span></button>`).join("");
  const arms=foArms(A),prats=foPrats(A),L=D.filter(d=>d.arq===A);
  if(!arms.length||!prats.length){$("#foMapaG").innerHTML=foVz("pasta","Este arquivo ainda não tem armários e prateleiras definidos (Folder360 › Definições).");return}
  const max=Math.max(1,...arms.flatMap(m=>prats.map(p=>L.filter(d=>d.arm===m&&d.prat===p).length)));
  $("#foMapaG").innerHTML=`<div class="fd-map" style="grid-template-columns:44px repeat(${arms.length},minmax(150px,1fr))"><div></div>${arms.map(m=>`<div class="fd-mh">Armário ${esc(m)}<small>${L.filter(d=>d.arm===m).length} dossiers</small></div>`).join("")}
    ${prats.map(p=>`<div class="fd-mr">${esc(p)}</div>${arms.map(m=>{const C=L.filter(d=>d.arm===m&&d.prat===p).sort(foCmp),req=C.filter(d=>foEstado(d).k!=="ok").length,an=foUniq(C.map(d=>d.ano)).sort(COLL_PTN.compare);
      return `<button class="fd-cell${C.length?"":" vz"}" data-fdcel="${esc(m)}|${esc(p)}" title="Ver os dossiers do armário ${esc(m)}, prateleira ${esc(p)}"><div class="fd-ch"><b>${C.length}</b>${req?`<span class="pp-chip wa">${req} fora</span>`:""}</div>
        <div class="fd-fill"><i style="width:${Math.round(C.length/max*100)}%"></i></div>
        <div class="fd-cc">${C.length?`${an.length?esc(an[0]+(an.length>1?" a "+an[an.length-1]:"")):""}<br>${esc(foUniq(C.map(d=>d.cursoNum||"")).slice(0,6).join(" · "))}`:"vazia"}</div>
        <div class="fd-dots">${C.slice(0,24).map(d=>`<i class="${foEstado(d).k}" title="${esc(foCod(d)+" · "+(d.tit||""))}"></i>`).join("")}</div></button>`}).join("")}`).join("")}</div>
    <p class="hint" style="margin-top:10px">Cada quadrado é uma prateleira. Carregue num para ver os dossiers que lá estão. Os pontos laranja e vermelhos são dossiers requisitados (vermelho: em atraso).</p>`}
(function(){const S=document.getElementById("foMapa");if(!S)return;S.addEventListener("click",e=>{const t=e.target.closest("[data-fdmapa]");if(t){FO_UI.mapa=t.dataset.fdmapa;foMapaUI();return}
  const c=e.target.closest("[data-fdcel]");if(c){const[m,p]=c.dataset.fdcel.split("|");Object.assign(FO_UI,{arq:FO_UI.mapa,arm:m,prat:p,q:"",ano:"",tipo:"",fin:"",est:"",n:150});show("foInicio")}})})();

// ----- Requisições (saídas e devoluções) -----
function foReqNova(d){if(!foEd())return;const box=document.createElement("div");box.className="fd-modal";const hj=foHoje(),E=foDef();
  let profs=[];try{profs=cfg.profs.map(p=>p.nome).filter(Boolean)}catch(e){}
  box.innerHTML=`<div class="card fd-mcard"><h2>Requisitar ${d?esc(foCod(d)):"um dossier"}</h2>${d?`<p class="hint">${esc(d.tit||"")} · ${esc(foCursoCurto(d))} · ${esc(d.ano||"")}</p>`:""}
    <div class="pp-form">${d?"":`<label class="w2">Dossier (código ou leia o código de barras)<input type="text" id="foRqD" list="foCodDL" autocomplete="off"></label>`}
    <label class="w2">Quem leva<input type="text" id="foRqQ" list="foProfDL" placeholder="Nome do formador ou de quem requisita" autocomplete="off"></label>
    <label>Data de saída<input type="date" id="foRqS" value="${hj}"></label><label>Devolução prevista<input type="date" id="foRqP" value="${calMais(hj,+E.prazo||15)}"></label>
    <label class="w2">Observações<input type="text" id="foRqO" placeholder="Para quê, por exemplo auditoria, consulta, digitalização…"></label></div>
    <div id="foRqMsg"></div><div class="fd-btns"><span class="grow"></span><button class="b s" data-x>Cancelar</button><button class="b" data-ok>Registar a saída</button></div></div>`;
  document.body.appendChild(box);
  let x=document.getElementById("foProfDL");if(!x){x=document.createElement("datalist");x.id="foProfDL";document.body.appendChild(x)}x.innerHTML=foUniq(profs.concat(FOL.mov.map(m=>m.quem))).map(v=>`<option value="${esc(v)}">`).join("");
  let y=document.getElementById("foCodDL");if(!y){y=document.createElement("datalist");y.id="foCodDL";document.body.appendChild(y)}y.innerHTML=FOL.dossiers.filter(z=>foEstado(z).k==="ok").sort(foCmp).map(z=>`<option value="${esc(foCod(z))}">${esc(z.tit+" · "+z.ano)}</option>`).join("");
  setTimeout(()=>{const i=$(d?"#foRqQ":"#foRqD");if(i)i.focus()},30);
  box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-x]")){box.remove();return}
    if(e.target.closest("[data-ok]")){const dd=d||foAchar($("#foRqD").value),q=$("#foRqQ").value.trim();
      if(!dd){escLinhaMsg("#foRqMsg","Não encontrei esse dossier.","bad");return}if(!q){escLinhaMsg("#foRqMsg","Escreva quem leva o dossier.","bad");return}
      if(foMovAtivo(dd.id)){escLinhaMsg("#foRqMsg","Esse dossier já está requisitado.","bad");return}
      let qid="";try{const p=cfg.profs.find(p=>norm(p.nome)===norm(q));if(p)qid=p.id}catch(e){}
      const m={id:uid()+uid(),dId:dd.id,cod:foCod(dd),quem:q,quemId:qid,saida:$("#foRqS").value||foHoje(),prev:$("#foRqP").value||"",dev:"",obs:$("#foRqO").value.trim(),por:String(EU&&EU.email||""),cr:Date.now()};
      FOL.mov.push(m);foGuardar(m);box.remove();toast("Saída registada: "+foCod(dd));if(curTab)foRender(curTab)}})}
function foDevolver(id){const m=FOL.mov.find(x=>x.id===id);if(!m||!foEd())return;m.dev=foHoje();foGuardar(m);toast("Devolução registada")}
function foMovUI(){const hj=foHoje(),U=FO_UI,A=FOL.mov.filter(m=>!m.dev),at=A.filter(m=>m.prev&&m.prev<hj),ed=foEd();
  const dos=id=>FOL.dossiers.find(d=>d.id===id);
  const st=(t,v,em)=>`<div class="ay-st"><small>${t}</small><b>${v}</b>${em?`<em>${em}</em>`:""}</div>`;
  const ult=FOL.mov.filter(m=>m.dev).sort((a,b)=>(b.dev||"").localeCompare(a.dev||""))[0];
  $("#foMovHero").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Requisições</h1><div class="sub">Quem levou cada dossier, quando saiu e quando volta. Leia o código de barras da lombada para registar uma saída ou uma devolução.</div></div></div>
    <div class="ay-stats">${st("Fora do arquivo",A.length)}${st("Em atraso",at.length,at.length?"a devolução prevista já passou":"")}${st("Requisições registadas",FOL.mov.length)}${st("Última devolução",ult?calDM(ult.dev,{day:"numeric",month:"short"}):"—",ult?esc(ult.quem):"")}</div></div>`;
  $("#foMovVer").innerHTML=[["ativos","Fora do arquivo"],["atraso","Em atraso"],["todos","Histórico"]].map(([k,t])=>`<button class="fd-tab${U.movVer===k?" on":""}" data-fdmv="${k}">${t}</button>`).join("");
  let L=U.movVer==="todos"?FOL.mov.slice():U.movVer==="atraso"?at:A;L.sort((a,b)=>(b.saida||"").localeCompare(a.saida||""));
  $("#foMovL").innerHTML=L.length?`<div class="tw"><table class="rt"><thead><tr><th>Dossier</th><th>Quem leva</th><th>Saída</th><th>Devolução prevista</th><th>Devolvido</th><th>Observações</th>${ed?"<th></th>":""}</tr></thead><tbody>${L.map(m=>{const d=dos(m.dId),late=!m.dev&&m.prev&&m.prev<hj;
      return `<tr><td><b class="fd-cod">${esc(d?foCod(d):m.cod||"(apagado)")}</b><br><span class="hint" style="margin:0">${esc(d?(d.tit||"")+" · "+(d.ano||""):"")}</span></td><td>${esc(m.quem||"")}</td><td class="fd-nw">${esc(calDM(m.saida,{day:"numeric",month:"short",year:"numeric"}))}</td><td class="fd-nw">${m.prev?`<span class="${late?"pp-chip ba":""}">${esc(calDM(m.prev,{day:"numeric",month:"short",year:"numeric"}))}</span>`:"—"}</td><td class="fd-nw">${m.dev?esc(calDM(m.dev,{day:"numeric",month:"short",year:"numeric"})):"—"}</td><td>${esc(m.obs||"")}</td>${ed?`<td class="fd-nw">${m.dev?"":`<button class="b s" data-fddev="${m.id}">Devolvido</button>`}${d?` <button class="b s" data-fdabrir="${d.id}">Ver</button>`:""}</td>`:""}</tr>`}).join("")}</tbody></table></div>`
    :foVz("out",U.movVer==="todos"?"Ainda não há requisições registadas.":U.movVer==="atraso"?"Nenhum dossier em atraso.":"Todos os dossiers estão no arquivo.")}
(function(){const S=document.getElementById("foMov");if(!S)return;
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.dataset.fdmv){FO_UI.movVer=b.dataset.fdmv;foMovUI();return}
    if(b.id==="foMovNova"){foReqNova(null);return}
    if(b.id==="foMovScan"){foScanAbrir(t=>foMovLido(t));return}
    if(b.dataset.fddev){foDevolver(b.dataset.fddev);foMovUI();return}
    if(b.dataset.fdabrir){FO_UI.sel=b.dataset.fdabrir;show("foInicio")}});
  S.addEventListener("keydown",e=>{if(e.target.id==="foMovLer"&&e.key==="Enter"){e.preventDefault();foMovLido(e.target.value);e.target.value=""}})})();
// um código lido nas Requisições: se o dossier está fora, regista a devolução; se está no arquivo, abre a saída
function foMovLido(t){const d=foAchar(t);if(!d){toast("Não encontrado: "+t);return false}if(!foEd())return false;const m=foMovAtivo(d.id);
  if(m){foDevolver(m.id);foMovUI();toast(`Devolvido: ${foCod(d)} (estava com ${m.quem})`);return true}
  foScanFechar();foReqNova(d);return true}

// ----- Conferência do arquivo (inventário com leitor de códigos) -----
function foConfAtual(){if(FO_UI.conf==="__lista")return null;return FOL.conf.find(c=>c.id===FO_UI.conf)||FOL.conf.filter(c=>!c.fim).sort((a,b)=>(b.ini||0)-(a.ini||0))[0]||null}
function foConfAlvo(c){return FOL.dossiers.filter(d=>d.arq===c.arq&&(!c.arm||d.arm===c.arm)&&(!c.prat||d.prat===c.prat)).sort(foCmp)}
function foConfRes(c){const alvo=foConfAlvo(c),lidos=c.lidos||{},ok=[],falta=[],fora=[],desc=[],req=[];
  for(const d of alvo){if(lidos[d.id])ok.push(d);else if(foMovAtivo(d.id))req.push(d);else falta.push(d)}
  for(const k in lidos){const v=lidos[k];if(v&&v.fora){const d=FOL.dossiers.find(x=>x.id===k);if(d)fora.push(d)}}
  (c.desc||[]).forEach(x=>desc.push(x));return{alvo,ok,falta,fora,desc,req}}
function foConfUI(){const E=foDef(),c=foConfAtual(),ed=foEd();
  const arqs=foUniq(E.arqs.map(a=>a.cod).concat(FOL.dossiers.map(d=>d.arq)));
  if(!c){const H=FOL.conf.slice().sort((a,b)=>(b.ini||0)-(a.ini||0));
    $("#foConfOut").innerHTML=`<div class="card"><div class="pp-head"><div><h2>Nova conferência</h2><p class="hint">Escolha a parte do arquivo e passe o leitor (ou a câmara) por cada lombada. No fim fica a saber o que falta, o que está no sítio errado e o que não devia lá estar.</p></div></div>
      <div class="row" style="gap:10px;align-items:flex-end"><label>Arquivo<select id="foCfA">${foOpts(arqs.map(a=>({v:a,t:foArqNome(a)})),arqs.find(a=>FOL.dossiers.some(d=>d.arq===a))||"")}</select></label><label>Armário<select id="foCfM"></select></label><label>Prateleira<select id="foCfP"></select></label>
      <button class="b" id="foCfIni" data-fddir>Começar</button></div></div>
      ${H.length?`<div class="card"><h2>Conferências anteriores</h2><div class="tw"><table class="rt"><thead><tr><th>Parte do arquivo</th><th>Começada</th><th>Terminada</th><th>Lidos</th><th>Em falta</th><th></th></tr></thead><tbody>${H.map(x=>{const r=foConfRes(x);
        return `<tr><td><b>${esc(foConfNome(x))}</b></td><td>${esc(new Date(x.ini).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"}))}${x.por?`<br><span class="hint" style="margin:0">${esc(x.por)}</span>`:""}</td><td>${x.fim?esc(new Date(x.fim).toLocaleString("pt-PT",{dateStyle:"short",timeStyle:"short"})):'<span class="pp-chip wa">a decorrer</span>'}</td><td>${r.ok.length}/${r.alvo.length}</td><td>${r.falta.length?`<span class="pp-chip ba">${r.falta.length}</span>`:'<span class="pp-chip ok">0</span>'}</td><td class="fd-nw"><button class="b s" data-fdcfab="${x.id}">Abrir</button> <button class="b s" data-fdcfpdf="${x.id}">PDF</button></td></tr>`}).join("")}</tbody></table></div></div>`:""}`;
    const up=()=>{const a=$("#foCfA").value;$("#foCfM").innerHTML=foOpts(foArms(a),"","Todos");$("#foCfP").innerHTML=foOpts(foPrats(a),"","Todas")};up();$("#foCfA").onchange=up;
    document.querySelectorAll("#foConf [data-fddir]").forEach(x=>x.disabled=!ed);return}
  const r=foConfRes(c),pct=r.alvo.length?Math.round((r.ok.length+r.req.length)/r.alvo.length*100):0,ult=(c.ult||[]).slice(-6).reverse();
  const lin=(L,k)=>L.length?`<div class="fd-cl">${L.map(d=>`<div class="fd-ci ${k}"><b class="fd-cod">${esc(foCod(d))}</b> <span>${esc(d.tit||"")} · ${esc(d.ano||"")}${k==="req"?` · com ${esc((foMovAtivo(d.id)||{}).quem||"")}`:""}</span></div>`).join("")}</div>`:`<p class="hint">Nenhum.</p>`;
  $("#foConfOut").innerHTML=`<div class="ay-hero pp-hero"><div class="ay-top"><div><h1>Conferência · ${esc(foConfNome(c))}</h1><div class="sub">${c.fim?"Terminada a "+esc(new Date(c.fim).toLocaleString("pt-PT",{dateStyle:"long",timeStyle:"short"})):"A decorrer desde "+esc(new Date(c.ini).toLocaleString("pt-PT",{dateStyle:"long",timeStyle:"short"}))}</div></div><span class="grow"></span><div class="ay-pct"><b>${pct}%</b>conferido</div></div>
    <div class="ay-stats"><div class="ay-st"><small>No sítio</small><b>${r.ok.length}</b><em>de ${r.alvo.length}</em></div><div class="ay-st"><small>Em falta</small><b>${r.falta.length}</b></div><div class="ay-st"><small>Requisitados</small><b>${r.req.length}</b><em>fora, com registo</em></div><div class="ay-st"><small>No sítio errado</small><b>${r.fora.length}</b></div><div class="ay-st"><small>Desconhecidos</small><b>${r.desc.length}</b><em>códigos que não existem</em></div></div></div>
    ${c.fim?"":`<div class="card fd-ler"><label class="grow">Ler código<input type="text" id="foCfLer" placeholder="Passe o leitor na lombada ou escreva o código e carregue em Enter" autocomplete="off" ${ed?"":"disabled"}></label><button class="b" id="foCfCam" ${ed?"":"disabled"}>${FO_ICO.scan} Câmara</button><button class="b s" id="foCfFim" ${ed?"":"disabled"}>Terminar</button>
      <div id="foCfUlt" class="fd-ult">${ult.map(u=>`<span class="pp-chip ${u.k==="ok"?"":u.k}">${esc(u.t)}</span>`).join("")}</div></div>`}
    <div class="fd-cg"><div class="card"><h2>Em falta (${r.falta.length})</h2>${lin(r.falta,"ba")}</div><div class="card"><h2>No sítio errado (${r.fora.length})</h2><p class="hint">Lidos aqui, mas pertencem a outro sítio.</p>${lin(r.fora,"wa")}
      <h2 style="margin-top:14px">Desconhecidos (${r.desc.length})</h2>${r.desc.length?`<div class="fd-cl">${r.desc.map(x=>`<div class="fd-ci mu"><b class="fd-cod">${esc(x)}</b></div>`).join("")}</div>`:'<p class="hint">Nenhum.</p>'}</div>
      <div class="card"><h2>Requisitados (${r.req.length})</h2>${lin(r.req,"req")}<h2 style="margin-top:14px">No sítio (${r.ok.length})</h2>${lin(r.ok,"ok")}</div></div>
    <div class="fd-btns" style="margin-top:6px"><button class="b s" data-fdcfvolta>Voltar às conferências</button><span class="grow"></span><button class="b s" data-fdcfpdf="${c.id}">PDF do resultado</button>${ed&&!c.fim?"":(ed?`<button class="b s danger" data-fdcfapagar="${c.id}">Apagar esta conferência</button>`:"")}</div>`;
  const i=$("#foCfLer");if(i)setTimeout(()=>i.focus(),30)}
function foConfNome(c){return[foArqNome(c.arq),c.arm?"armário "+c.arm:"",c.prat?"prateleira "+c.prat:""].filter(Boolean).join(" · ")}
function foConfLido(t){const c=foConfAtual();if(!c||c.fim||!foEd())return false;const s=String(t||"").trim();if(!s)return false;const d=foAchar(s);c.lidos=c.lidos||{};c.ult=c.ult||[];c.desc=c.desc||[];
  let k,txt;if(!d){if(!c.desc.includes(s))c.desc.push(s);k="mu";txt=s+" · desconhecido";if(navigator.vibrate)navigator.vibrate([60,40,60])}
  else{const ok=d.arq===c.arq&&(!c.arm||d.arm===c.arm)&&(!c.prat||d.prat===c.prat);c.lidos[d.id]={t:Date.now(),fora:!ok};k=ok?"ok":"wa";txt=foCod(d)+(ok?"":" · sítio errado");if(!ok&&navigator.vibrate)navigator.vibrate([60,40,60])}
  c.ult.push({t:txt,k});if(c.ult.length>30)c.ult=c.ult.slice(-30);foGuardar(c);foConfUI();return!!d}
(function(){const S=document.getElementById("foConf");if(!S)return;
  S.addEventListener("keydown",e=>{if(e.target.id==="foCfLer"&&e.key==="Enter"){e.preventDefault();const v=e.target.value;e.target.value="";foConfLido(v)}});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
    if(b.id==="foCfIni"){if(!foEd())return;const c={id:uid()+uid(),arq:$("#foCfA").value,arm:$("#foCfM").value,prat:$("#foCfP").value,ini:Date.now(),fim:0,lidos:{},desc:[],ult:[],por:String(EU&&EU.email||"")};FOL.conf.push(c);FO_UI.conf=c.id;foGuardar(c);foConfUI();return}
    if(b.id==="foCfCam"){foScanAbrir(t=>foConfLido(t),true);return}
    if(b.id==="foCfFim"){const c=foConfAtual();if(!c)return;const r=foConfRes(c);if(!confirm(`Terminar a conferência?\n\n${r.ok.length} no sítio, ${r.falta.length} em falta, ${r.fora.length} no sítio errado.`))return;c.fim=Date.now();foGuardar(c);foConfUI();return}
    if(b.dataset.fdcfab){FO_UI.conf=b.dataset.fdcfab;foConfUI();return}
    if(b.matches("[data-fdcfvolta]")){FO_UI.conf="__lista";foConfUI();return}
    if(b.dataset.fdcfpdf){foPdfConf(FOL.conf.find(x=>x.id===b.dataset.fdcfpdf));return}
    if(b.dataset.fdcfapagar){if(!confirm("Apagar esta conferência? (Os dossiers não são tocados.)"))return;FOL.conf=FOL.conf.filter(x=>x.id!==b.dataset.fdcfapagar);FOL.del[b.dataset.fdcfapagar]=Date.now();FO_UI.conf="__lista";foGuardar();foConfUI()}})})();

// ----- Leitor de códigos com a câmara (BarcodeDetector; no iPad, QR com o jsQR) -----
var FO_SCAN=null;
async function foScanAbrir(cb,cont){foScanFechar();const box=document.createElement("div");box.className="fd-scan";
  box.innerHTML=`<div class="fd-scard"><div class="fd-sv"><video playsinline muted></video><i class="fd-sframe"></i></div><div class="fd-sbar"><span id="foScanMsg">A abrir a câmara…</span><span class="grow"></span><button class="b s" data-x>Fechar</button></div></div>`;
  document.body.appendChild(box);box.addEventListener("click",e=>{if(e.target===box||e.target.closest("[data-x]"))foScanFechar()});
  const msg=t=>{const m=$("#foScanMsg");if(m)m.textContent=t};
  const S=FO_SCAN={box,stream:null,on:true,ult:"",ultT:0};
  try{S.stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"},width:{ideal:1280}},audio:false})}catch(e){msg("Não foi possível usar a câmara ("+(e.message||e.name)+"). Use um leitor USB/Bluetooth ou escreva o código.");return}
  if(!S.on){S.stream.getTracks().forEach(t=>t.stop());return}
  const v=box.querySelector("video");v.srcObject=S.stream;await v.play().catch(()=>{});
  let det=null;try{if("BarcodeDetector" in window){const f=await BarcodeDetector.getSupportedFormats();const q=["code_128","qr_code","ean_13","code_39"].filter(x=>f.includes(x));if(q.length)det=new BarcodeDetector({formats:q})}}catch(e){det=null}
  if(!det){try{if(!window.jsQR)await loadScript("lib/jsQR.js")}catch(e){}}
  msg(det?"Aponte para o código de barras ou para o QR da lombada":"Aponte para o QR code da lombada (este navegador só lê QR codes pela câmara)");
  const cv=document.createElement("canvas"),cx=cv.getContext("2d",{willReadFrequently:true});
  const passo=async()=>{if(!S.on)return;let txt="";
    try{if(v.readyState>=2){if(det){const r=await det.detect(v);if(r&&r.length)txt=r[0].rawValue}
      else if(window.jsQR){const w=Math.min(800,v.videoWidth),h=Math.round(v.videoHeight*w/v.videoWidth);cv.width=w;cv.height=h;cx.drawImage(v,0,0,w,h);const r=jsQR(cx.getImageData(0,0,w,h).data,w,h,{inversionAttempts:"dontInvert"});if(r)txt=r.data}}}catch(e){}
    if(txt&&(txt!==S.ult||Date.now()-S.ultT>2500)){S.ult=txt;S.ultT=Date.now();const ok=cb(txt);msg((ok?"Lido: ":"Não encontrado: ")+txt);box.classList.remove("ok","ko");void box.offsetWidth;box.classList.add(ok?"ok":"ko");if(!cont&&ok){setTimeout(foScanFechar,350);return}}
    setTimeout(passo,det?120:180)};passo()}
function foScanFechar(){const S=FO_SCAN;FO_SCAN=null;if(!S)return;S.on=false;try{S.stream&&S.stream.getTracks().forEach(t=>t.stop())}catch(e){}S.box.remove()}

// 0.9.161: pré-visualização da lombada na ficha — é o próprio PDF da lombada (foLombada), desenhado numa imagem, por isso fica igual ao que se imprime
var FO_LPV={k:"",url:"",n:0};
async function foLombPrev(d){const n=++FO_LPV.n,E=foDef(),W=+E.lombW||65,H=158,k=JSON.stringify([d,W,E.lombQR,E.site,E.fins,typeof LOGOS==="object"?Object.keys(LOGOS).length:0]);
  const porImg=u=>{const b=$("#foLPv");if(b&&foSel()===d&&n===FO_LPV.n)b.innerHTML=`<img src="${u}" alt="Lombada de ${esc(foCod(d))}">`};
  if(FO_LPV.k===k&&FO_LPV.url){porImg(FO_LPV.url);return}
  try{const J=await loadPDF();await foLibQR();await foLgPadrao();if(n!==FO_LPV.n)return;
    const doc=new J({unit:"mm",format:[W+2,H+2],orientation:"portrait",compress:true});foLombada(doc,d,1,1,W,H,true);
    const pdfjs=await calPdfJs(),pdf=await pdfjs.getDocument({data:new Uint8Array(doc.output("arraybuffer")),isEvalSupported:false}).promise,pg=await pdf.getPage(1);
    const vp=pg.getViewport({scale:Math.min(4,(380*(window.devicePixelRatio>1?2:1.4))/((H+2)/25.4*72))}),cv=document.createElement("canvas");cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
    await pg.render({canvasContext:cv.getContext("2d"),viewport:vp}).promise;try{pdf.destroy()}catch(e){}if(n!==FO_LPV.n)return;
    const url=cv.toDataURL("image/png");FO_LPV={k,url,n};porImg(url)}
  catch(e){console.warn(e);const b=$("#foLPv");if(b&&n===FO_LPV.n)b.innerHTML=`<span class="hint" style="margin:0;padding:8px">Sem pré-visualização</span>`}}
// ----- PDF: lombadas, etiquetas, etiquetas de CD, relatório por arquivo, lista de conferência -----
function foA4(J,deitada){return new J({unit:"mm",format:"a4",orientation:deitada?"landscape":"portrait",compress:true})}
function foFoot(d){const E=foDef(),f=E.fins.find(x=>x.n===d.fin);{const p=d.proj&&lgProj(d.proj);if(p)return p} // 0) o do n.º de projeto do dossier (Definições › Logótipos)
  if(foFinLogo(f))return foFinLogo(f); // 1) o logótipo do programa (Folder360 › Definições)
  try{const A=LOGOS.anos||{},anos=escData().anos,y=parseInt(String(d.ano||"").slice(0,4),10);           // 2) o do ano letivo do dossier (Definições › Logótipos)
    const a=anos.find(x=>x.nome===d.ano||x.ini===y);if(a&&A[a.id]&&A[a.id].foot)return A[a.id].foot;if(a&&A[a.id]&&A[a.id].foot===null)return null;
    const L=anos.filter(x=>A[x.id]&&A[x.id].foot&&x.ini<=y).sort((p,q)=>q.ini-p.ini);if(L.length)return A[L[0].id].foot}catch(e){}
  return pdfLogos().f}                                                                                  // 3) o da barra de baixo (ano ativo / padrão)
function foImg(doc,L,x,y,mw,mh,al){if(!foLg(L))return 0;const[w,h]=lgFit(L,mw,mh);const xx=al==="c"?x+(mw-w)/2:al==="r"?x+mw-w:x;try{doc.addImage(L.src,lgFmt(L),xx,y+(mh-h)/2,w,h,undefined,"FAST")}catch(e){}return w}
function foTxtC(doc,t,cx,y,maxw,lh){const L=doc.splitTextToSize(pdfTxt(t),maxw);L.forEach((s,i)=>doc.text(s,cx,y+i*lh,{align:"center"}));return L.length}
function foLombada(doc,d,x,y,W,H,semTira){const E=foDef(),{m,r}=pdfLogos(),cx=x+W/2,cod=foCod(d);
  doc.setDrawColor(30);doc.setLineWidth(.45);doc.rect(x,y,W,H);
  if(m&&r){foImg(doc,m,x+4,y+4,W/2-6,14,"c");foImg(doc,r,x+W/2+2,y+4,W/2-6,14,"c")}else if(m||r)foImg(doc,m||r,x+6,y+4,W-12,14,"c");
  doc.setDrawColor(205);doc.setLineWidth(.2);doc.line(x+5,y+22,x+W-5,y+22);
  doc.setTextColor(20);doc.setFont("helvetica","bold");doc.setFontSize(W<55?9.5:11);let n=foTxtC(doc,foCursoCurto(d)||"",cx,y+30,W-8,4.6);
  doc.setFont("helvetica","normal");doc.setFontSize(10.5);let yy=y+30+n*4.6+5;if(d.ano){doc.text(pdfTxt(d.ano),cx,yy,{align:"center"});yy+=5}if(d.anoCur)doc.text(pdfTxt(d.anoCur),cx,yy,{align:"center"});
  // 0.9.111: o título e o QR repartem o espaço livre entre o ano curricular e o «x de y» — o título já não fica por cima do QR
  {const zT=yy+(d.anoCur?6:1),zB=y+H-58;let fs=W<55?11.5:13,T;doc.setFont("helvetica","bold");
    for(;;){doc.setFontSize(fs);T=doc.splitTextToSize(pdfTxt(d.tit||""),W-8);if(T.length<=3||fs<=8.5)break;fs-=.5}
    const lh=fs*.45,cap=fs*.26,tH=(T.length-1)*lh+cap+1.2;let q=E.lombQR?22:0,ty;
    if(q){ty=zT+cap+1;const fimT=ty+(T.length-1)*lh+1.2,livre=zB-fimT;q=Math.max(12,Math.min(22,livre-4));
      const qy=fimT+Math.max(3,(livre-q)/2);foPdfQR(doc,cx-q/2,qy,q,foQRTxt(d))}
    else ty=zT+Math.max(0,(zB-zT-tH)/2)+cap;
    T.forEach((s,i)=>doc.text(s,cx,ty+i*lh,{align:"center"}))}
  doc.setFont("helvetica","italic");doc.setFontSize(10.5);if(foVolTxt(d))doc.text(pdfTxt(foVolTxt(d)),cx,y+H-52,{align:"center"});
  doc.setDrawColor(205);doc.line(x+5,y+H-47,x+W-5,y+H-47);
  doc.setFont("helvetica","bolditalic");doc.setFontSize(W<55?8.5:9.8);doc.text(pdfTxt(cod),cx,y+H-41,{align:"center"});
  doc.setFont("helvetica","normal");if(d.proj){let f=9;doc.setFontSize(f);while(f>6.5&&doc.getTextWidth(pdfTxt(d.proj))>W-6){f-=.25;doc.setFontSize(f)}foTxtC(doc,d.proj,cx,y+H-35,W-6,3.8)} // 0.9.111: o n.º de projeto numa só linha nas lombadas estreitas
  foImg(doc,foFoot(d),x+3,y+H-28,W-6,10,"c");
  doc.setFont("helvetica","italic");doc.setFontSize(8.5);doc.setTextColor(90);if(E.site)doc.text(pdfTxt(E.site),cx,y+H-7,{align:"center"});
  // tira com o código de barras, para recortar (não vai na pré-visualização da ficha)
  if(semTira)return;const sy=y+H+6;doc.setDrawColor(60);doc.setLineWidth(.25);doc.line(x,sy,x+W,sy);doc.line(x,sy+17,x+W,sy+17);foPdfBar(doc,x+2,sy+2.2,W-4,10.5,cod);
  doc.setFont("courier","normal");doc.setFontSize(6.5);doc.setTextColor(30);doc.text(pdfTxt(cod),cx,sy+15.2,{align:"center"})}
var FO_ETQ={l7159:{t:"Avery L7159 · 3 × 8 (63,5 × 33,9 mm)",c:3,r:8,w:63.5,h:33.9,mx:6.5,my:12.9,px:66,py:33.9,fr:false},
  l7160:{t:"Avery L7160 · 3 × 7 (63,5 × 38,1 mm)",c:3,r:7,w:63.5,h:38.1,mx:7.2,my:15.1,px:66,py:38.1,fr:false},
  l7651:{t:"Avery L7651 · 5 × 13 (38,1 × 21,2 mm) — só o código",c:5,r:13,w:38.1,h:21.2,mx:4.7,my:10.7,px:40.6,py:21.2,fr:false,mini:true},
  livre:{t:"Folha normal, com moldura para recortar (3 × 10)",c:3,r:10,w:62,h:25,mx:10,my:14,px:64,py:27,fr:true}};
function foEtiqueta(doc,d,x,y,F){const cod=foCod(d);if(F.fr){doc.setDrawColor(40);doc.setLineWidth(.25);doc.rect(x,y,F.w,F.h)}
  if(F.mini){foPdfBar(doc,x+1.5,y+3,F.w-3,F.h-9.5,cod);doc.setFont("courier","normal");doc.setFontSize(5.8);doc.setTextColor(20);doc.text(pdfTxt(cod),x+F.w/2,y+F.h-3.2,{align:"center"});return}
  const bh=Math.min(13,F.h*.42);foPdfBar(doc,x+3,y+3,F.w-6,bh,cod);doc.setFont("courier","bold");doc.setFontSize(7.5);doc.setTextColor(20);doc.text(pdfTxt(cod),x+F.w/2,y+3+bh+3.4,{align:"center"});
  doc.setFont("helvetica","normal");doc.setFontSize(6.6);doc.setTextColor(70);const L=doc.splitTextToSize(pdfTxt([d.tit,d.ano].filter(Boolean).join(" · ")),F.w-6).slice(0,1).concat(doc.splitTextToSize(pdfTxt(foCursoCurto(d)),F.w-6).slice(0,F.h>30?2:1));
  L.forEach((s,i)=>doc.text(s,x+F.w/2,y+3+bh+7+i*2.8,{align:"center"}))}
function foCD(doc,d,cx,cy){const R=58,r=20.5,cod=foCod(d),{m,r:rg}=pdfLogos();doc.setDrawColor(150);doc.setLineWidth(.25);doc.setLineDashPattern([1.2,1.2],0);doc.circle(cx,cy,R);doc.circle(cx,cy,r);doc.setLineDashPattern([],0);
  if(m&&rg){foImg(doc,m,cx-27,cy-R+6,25,11,"c");foImg(doc,rg,cx+2,cy-R+6,25,11,"c")}else if(m||rg)foImg(doc,m||rg,cx-15,cy-R+6,30,11,"c");
  doc.setTextColor(20);doc.setFont("helvetica","bold");doc.setFontSize(9.5);const C=doc.splitTextToSize(pdfTxt(foCursoCurto(d)),74).slice(0,2);C.forEach((s,i)=>doc.text(s,cx,cy-R+23+i*4,{align:"center"}));
  doc.setFont("helvetica","normal");doc.setFontSize(8.5);doc.text(pdfTxt([d.ano,d.anoCur].filter(Boolean).join(" · ")),cx,cy-R+23+C.length*4+1.5,{align:"center"});
  doc.setFont("helvetica","bold");doc.setFontSize(8.5);const T=doc.splitTextToSize(pdfTxt(d.tit||""),29).slice(0,4);const tx=cx-r-17.5;T.forEach((s,i)=>doc.text(s,tx,cy-(T.length-1)*1.8+i*3.6,{align:"center"}));
  foPdfQR(doc,cx+r+5,cy-10,20,foQRTxt(d));
  doc.setFont("helvetica","bolditalic");doc.setFontSize(8.5);doc.text(pdfTxt(cod),cx,cy+r+7,{align:"center"});doc.setFont("helvetica","normal");doc.setFontSize(8);if(d.proj)doc.text(pdfTxt(d.proj),cx,cy+r+11.5,{align:"center"});
  foImg(doc,foFoot(d),cx-30,cy+r+15,60,9,"c");doc.setFont("helvetica","italic");doc.setFontSize(7.5);doc.setTextColor(90);doc.text(pdfTxt(foDef().site||""),cx,cy+R-6,{align:"center"})}
async function foPdf(tipo,L,o){if(!L||!L.length){toast("Não há dossiers para imprimir");return}o=o||{};try{const J=await loadPDF();await foLibQR();await foLgPadrao();const E=foDef();let doc,nome;
    if(tipo==="lomb"){doc=foA4(J,1);const W=+(o.w||E.lombW)||65,H=158,pp=Math.max(1,+(o.pp||E.lombPP)||1),gap=6,max=Math.max(1,Math.floor((297-16+gap)/(W+gap))),n=Math.min(pp,max);
      L.forEach((d,i)=>{const k=i%n;if(i&&!k)doc.addPage();const x0=n===1?14:(297-(n*W+(n-1)*gap))/2;foLombada(doc,d,x0+k*(W+gap),12,W,H)});nome=L.length===1?"Lombada "+foCod(L[0]):`Lombadas (${L.length})`}
    else if(tipo==="etq"){const F=FO_ETQ[o.f||E.etq]||FO_ETQ.l7159;doc=foA4(J);const por=F.c*F.r;let p=Math.max(0,(+o.ini||1)-1)%por;
      L.forEach((d,i)=>{if(i&&p===0)doc.addPage();const c=p%F.c,r=Math.floor(p/F.c);foEtiqueta(doc,d,F.mx+c*F.px,F.my+r*F.py,F);p=(p+1)%por});nome=L.length===1?"Etiqueta "+foCod(L[0]):`Etiquetas (${L.length})`}
    else if(tipo==="cd"){doc=foA4(J);L.forEach((d,i)=>{if(i&&i%2===0)doc.addPage();foCD(doc,d,105,i%2?218:79)});nome=L.length===1?"CD "+foCod(L[0]):`Etiquetas de CD (${L.length})`}
    else if(tipo==="rel")return foPdfRel(L,o);
    else if(tipo==="lista")return foPdfLista(L);
    doc.save(pdfTxt(nome)+".pdf");toast("PDF criado")}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
function foGrupos(L){const G=new Map();L.slice().sort(foCmp).forEach(d=>{const k=d.arq||"(sem arquivo)";if(!G.has(k))G.set(k,[]);G.get(k).push(d)});return[...G.entries()]}
async function foPdfRel(L,o){o=o||{};try{const J=await loadPDF();await foLibQR();const doc=foA4(J,1),cod=o.codigos!==false;let first=true;
  for(const[arq,G]of foGrupos(L)){if(!first)doc.addPage();first=false;
    const titulo=()=>{doc.setFont("helvetica","bold");doc.setFontSize(15);doc.setTextColor(22,40,80);doc.text("Relatório por Arquivo",14,PDF_TOP+5);doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(80);
      doc.text(pdfTxt(`${foArqNome(arq)} · ${G.length} dossier${G.length===1?"":"s"} · ${new Date().toLocaleDateString("pt-PT")}`),14,PDF_TOP+11)};
    titulo();
    const body=G.map(d=>[pdfTxt(foCursoCurto(d)),pdfTxt(d.tit||""),pdfTxt(foCod(d)),pdfTxt(foVolTxt(d)),pdfTxt(d.ano||""),pdfTxt(d.proj||""),"",""]);
    doc.autoTable({startY:PDF_TOP+15,head:[["Curso","Dossier","Localização","Vol.","Ano letivo","N.º de projeto",cod?"QR":"",cod?"Código de barras":""]],body,margin:{top:PDF_TOP+15,bottom:PDF_BOT+2,left:14,right:14},theme:"grid",rowPageBreak:"avoid",
      styles:{font:"helvetica",fontSize:8,cellPadding:1.7,overflow:"linebreak",lineColor:[226,230,235],lineWidth:.15,textColor:[40,44,52],valign:"middle",minCellHeight:cod?16:6},
      headStyles:{fillColor:[26,95,208],textColor:255,fontStyle:"bold",lineColor:[26,95,208],minCellHeight:6},alternateRowStyles:{fillColor:[246,248,251]},
      columnStyles:cod?{0:{cellWidth:57},1:{cellWidth:43},2:{cellWidth:37,fontStyle:"bold"},3:{cellWidth:13},4:{cellWidth:19},5:{cellWidth:33},6:{cellWidth:17},7:{cellWidth:50}}:{0:{cellWidth:80},1:{cellWidth:60},2:{cellWidth:44,fontStyle:"bold"},3:{cellWidth:16},4:{cellWidth:24},5:{cellWidth:45},6:{cellWidth:0},7:{cellWidth:0}},
      didDrawPage:dt=>{if(dt.pageNumber>1)titulo()},
      didDrawCell:c=>{if(!cod||c.section!=="body")return;const d=G[c.row.index];if(!d)return;
        if(c.column.index===6)foPdfQR(doc,c.cell.x+2,c.cell.y+(c.cell.height-13)/2,13,foQRTxt(d));
        if(c.column.index===7){foPdfBar(doc,c.cell.x+1,c.cell.y+(c.cell.height-13)/2,c.cell.width-2,10,foCod(d));doc.setFont("courier","normal");doc.setFontSize(5.5);doc.setTextColor(40);doc.text(pdfTxt(foCod(d)),c.cell.x+c.cell.width/2,c.cell.y+(c.cell.height-13)/2+12.6,{align:"center"})}}})}
  pdfMoldura(doc,"Folder360 · Relatório por Arquivo");doc.save(pdfTxt(`Relatório por Arquivo ${new Date().toISOString().slice(0,10)}`)+".pdf");toast("Relatório criado")}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function foPdfLista(L){try{const J=await loadPDF();const doc=foA4(J);let first=true;
  for(const[arq,G]of foGrupos(L)){if(!first)doc.addPage();first=false;const y=pdfTitulo(doc,"Lista de conferência · "+foArqNome(arq),`${G.length} dossiers · conferido em ____/____/________ por ______________________________`);
    doc.autoTable({startY:y-4,head:[["","Código","Curso","Dossier","Vol.","Ano letivo","Observações"]],body:G.map(d=>["",foCod(d),foCursoCurto(d),d.tit||"",foVolTxt(d),d.ano||"",""].map(pdfTxt)),margin:{top:PDF_TOP,bottom:PDF_BOT+2,left:12,right:12},theme:"grid",rowPageBreak:"avoid",
      styles:{font:"helvetica",fontSize:7.6,cellPadding:1.4,overflow:"linebreak",lineColor:[210,214,220],lineWidth:.15,textColor:[40,44,52],valign:"middle"},headStyles:{fillColor:[26,95,208],textColor:255,fontStyle:"bold"},
      columnStyles:{0:{cellWidth:7},1:{cellWidth:36,fontStyle:"bold"},2:{cellWidth:50},3:{cellWidth:38},4:{cellWidth:12},5:{cellWidth:18},6:{cellWidth:"auto"}},
      didDrawCell:c=>{if(c.section==="body"&&c.column.index===0){doc.setDrawColor(60);doc.setLineWidth(.3);doc.rect(c.cell.x+1.6,c.cell.y+c.cell.height/2-1.9,3.8,3.8)}}})}
  pdfMoldura(doc,"Folder360 · Lista de conferência");doc.save(pdfTxt(`Lista de conferência ${new Date().toISOString().slice(0,10)}`)+".pdf");toast("Lista criada")}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function foPdfConf(c){if(!c)return;try{const J=await loadPDF();const doc=foA4(J),r=foConfRes(c);
  let y=pdfTitulo(doc,"Conferência do arquivo · "+foConfNome(c),`Começada a ${new Date(c.ini).toLocaleString("pt-PT")}${c.fim?" · terminada a "+new Date(c.fim).toLocaleString("pt-PT"):" · ainda a decorrer"}${c.por?" · "+c.por:""}`);
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(40);doc.text(pdfTxt(`No sítio: ${r.ok.length} de ${r.alvo.length} · Em falta: ${r.falta.length} · Requisitados: ${r.req.length} · No sítio errado: ${r.fora.length} · Desconhecidos: ${r.desc.length}`),14,y);y+=6;
  const sec=(t,L,extra)=>{if(!L.length)return;if(y>250){doc.addPage();y=PDF_TOP+4}doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.setTextColor(25);doc.text(pdfTxt(`${t} (${L.length})`),14,y);
    y=pdfTabela(doc,y+2,["Código","Curso","Dossier","Ano letivo",extra?extra[0]:"Onde devia estar"],L.map(d=>[foCod(d),foCursoCurto(d),d.tit||"",d.ano||"",extra?extra[1](d):foArqNome(d.arq)+" · "+d.arm+d.prat].map(pdfTxt)),{0:{cellWidth:38,fontStyle:"bold"}},true)+8};
  sec("Em falta",r.falta);sec("No sítio errado",r.fora);sec("Requisitados",r.req,["Com quem",d=>{const m=foMovAtivo(d.id);return m?m.quem+" desde "+calDMA(m.saida):""}]);
  if(r.desc.length){if(y>250){doc.addPage();y=PDF_TOP+4}doc.setFont("helvetica","bold");doc.setFontSize(11.5);doc.text(pdfTxt(`Códigos desconhecidos (${r.desc.length})`),14,y);y=pdfTabela(doc,y+2,["Código lido"],r.desc.map(x=>[pdfTxt(x)]),{},true)+8}
  pdfMoldura(doc,"Folder360 · Conferência do arquivo");doc.save(pdfTxt(`Conferência ${c.arq}${c.arm?" "+c.arm:""}${c.prat?c.prat:""} ${new Date(c.ini).toISOString().slice(0,10)}`)+".pdf")}catch(e){console.warn(e);toast("Não foi possível criar o PDF: "+(e.message||e))}}
async function foExcel(L){try{if(!window.XLSX)await loadScript("lib/xlsx.mini.min.js");
  const R=L.slice().sort(foCmp).map(d=>{const e=foEstado(d);return{"Código":foCod(d),"Arquivo":d.arq,"Armário":d.arm,"Prateleira":d.prat,"N.º":d.ns,"Ano letivo":d.ano,"Ano curricular":d.anoCur,"Curso":d.curso,"Dossier":d.tit,"Volume":d.vol,"Total de volumes":d.volT,"N.º de projeto":d.proj,"Financiamento":d.fin,"Tipo":d.tipo,"Principal":d.princ?"Sim":"Não","Ligação":d.url,"Estado":e.txt,"Com quem":e.m?e.m.quem:"","Observações":d.obs,"Código antigo (FileMaker)":d.cbAntigo||""}});
  const ws=XLSX.utils.json_to_sheet(R),wb=XLSX.utils.book_new();ws["!cols"]=[{wch:24},{wch:8},{wch:8},{wch:9},{wch:5},{wch:11},{wch:12},{wch:48},{wch:30},{wch:7},{wch:8},{wch:28},{wch:13},{wch:18},{wch:9},{wch:40},{wch:12},{wch:24},{wch:30},{wch:22}];
  XLSX.utils.book_append_sheet(wb,ws,"Dossiers");XLSX.writeFile(wb,`Folder360 dossiers ${new Date().toISOString().slice(0,10)}.xlsx`);toast("Excel criado")}catch(e){console.warn(e);toast("Não foi possível criar o Excel: "+(e.message||e))}}

// ----- Lombadas e etiquetas -----
function foImpLista(){const U=FO_UI;if(U.impFonte==="marc")return foMarcados();if(U.impFonte==="filt")return foFiltrados();if(U.impFonte.startsWith("arq:"))return FOL.dossiers.filter(d=>d.arq===U.impFonte.slice(4)).sort(foCmp);return[]}
function foImpUI(){foLgPadrao().then(n=>{if(n&&curTab==="foImp")foImpUI()}).catch(()=>{});const U=FO_UI,E=foDef(),nm=foMarcados().length,nf=foFiltrados().length,arqs=foUniq(FOL.dossiers.map(d=>d.arq));
  if(U.impFonte==="marc"&&!nm)U.impFonte="filt";const L=foImpLista(),ed=foEd();
  const fonte=`<label class="grow">Dossiers<select id="foImpF">${foOpts([{v:"marc",t:`Os selecionados na lista (${nm})`},{v:"filt",t:`Os que estão filtrados na lista (${nf})`}].concat(arqs.map(a=>({v:"arq:"+a,t:`Todo o arquivo ${foArqNome(a)} (${FOL.dossiers.filter(d=>d.arq===a).length})`}))),U.impFonte)}</select></label>`;
  const tipos=[["lomb","Lombadas","Como no FileMaker: logótipos, curso, ano, título, volume, código, n.º de projeto e o logótipo do financiamento, com a tira do código de barras para recortar."],["etq","Etiquetas com código de barras","Para colar na lombada ou na capa e ler com o leitor nas requisições e conferências."],["cd","Etiquetas de CD/DVD","Duas por folha A4, com QR code para a pasta no SharePoint."]];
  $("#foImpOut").innerHTML=`<div class="card"><div class="row" style="gap:10px;align-items:flex-end">${fonte}</div>
    <div class="fd-tipos">${tipos.map(([k,t,d])=>`<button class="fd-tipo${U.impTipo===k?" on":""}" data-fdtipo="${k}"><b>${t}</b><span>${d}</span></button>`).join("")}</div>
    <div class="row" style="gap:10px;align-items:flex-end;margin-top:12px">${U.impTipo==="lomb"?`<label>Largura da lombada<select id="foImpW">${foOpts([{v:50,t:"50 mm (dossier fino)"},{v:65,t:"65 mm (como no FileMaker)"},{v:80,t:"80 mm (dossier largo)"}],E.lombW)}</select></label>
      <label>Por folha<select id="foImpPP">${foOpts([{v:1,t:"1 por folha (como no FileMaker)"},{v:9,t:"Tantas quantas couberem"}],E.lombPP>1?9:1)}</select></label><label class="fd-ck"><input type="checkbox" id="foImpQR"${E.lombQR?" checked":""}> QR code na lombada</label>`
      :U.impTipo==="etq"?`<label class="grow">Folha de etiquetas<select id="foImpEt">${foOpts(Object.keys(FO_ETQ).map(k=>({v:k,t:FO_ETQ[k].t})),E.etq)}</select></label><label style="width:170px">Começar na etiqueta n.º<input type="number" id="foImpIni" min="1" value="1" title="Para aproveitar uma folha já começada"></label>`:""}
      <span class="grow"></span><button class="b" id="foImpGo"${L.length?"":" disabled"}>Criar PDF (${L.length})</button></div></div>
    ${L.length?`<div class="card"><h2>Pré-visualização</h2><div class="fd-prev">${L.slice(0,4).map(foPrevHtml).join("")}</div>${L.length>4?`<p class="hint">… e mais ${L.length-4}.</p>`:""}</div>`:`<div class="card">${foVz("pasta","Escolha os dossiers: selecione-os na lista do Arquivo, use os filtros ou escolha um arquivo inteiro.")}</div>`}`}
function foPrevHtml(d){const t=FO_UI.impTipo,cod=foCod(d),{m,r}=pdfLogos(),f=foFoot(d),img=(L,c)=>foLg(L)?`<img src="${L.src}" class="${c}" alt="">`:"";
  if(t==="etq")return `<div class="fd-pe">${foBarSvg(cod,34)}<b>${esc(cod)}</b><small>${esc([d.tit,d.ano].filter(Boolean).join(" · "))}</small></div>`;
  if(t==="cd")return `<div class="fd-pcd"><div>${img(m,"l")}<b>${esc(foCursoCurto(d))}</b><span>${esc(d.tit||"")}</span><i>${esc(cod)}</i></div></div>`;
  return `<div class="fd-pl"><div class="fd-plb"><div class="fd-plg">${img(m,"l")}${img(r,"l")}</div><b>${esc(foCursoCurto(d))}</b><span>${esc(d.ano||"")}<br>${esc(d.anoCur||"")}</span><strong>${esc(d.tit||"")}</strong><em>${esc(foVolTxt(d))}</em><hr><i>${esc(cod)}</i><small>${esc(d.proj||"")}</small>${img(f,"f")}<u>${esc(foDef().site||"")}</u></div><div class="fd-pls">${foBarSvg(cod,26)}</div></div>`}
(function(){const S=document.getElementById("foImp");if(!S)return;
  S.addEventListener("change",e=>{const E=foDef(),id=e.target.id;
    if(id==="foImpF"){FO_UI.impFonte=e.target.value;foImpUI();return}
    if(foEd()&&["foImpW","foImpPP","foImpQR","foImpEt"].includes(id)){if(id==="foImpW")E.lombW=+e.target.value;if(id==="foImpPP")E.lombPP=+e.target.value;if(id==="foImpQR")E.lombQR=e.target.checked;if(id==="foImpEt")E.etq=e.target.value;foGuardar(E)}});
  S.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;if(b.dataset.fdtipo){FO_UI.impTipo=b.dataset.fdtipo;foImpUI();return}
    if(b.id==="foImpGo"){const o={};if($("#foImpW"))o.w=+$("#foImpW").value;if($("#foImpPP"))o.pp=+$("#foImpPP").value;if($("#foImpEt"))o.f=$("#foImpEt").value;if($("#foImpIni"))o.ini=+$("#foImpIni").value;
      if($("#foImpQR"))foDef().lombQR=$("#foImpQR").checked;foPdf(FO_UI.impTipo,foImpLista(),o)}})})();

// ----- Relatórios -----
function foRelUI(){const D=FOL.dossiers,arqs=foUniq(foDef().arqs.map(a=>a.cod).concat(D.map(d=>d.arq))).filter(a=>D.some(d=>d.arq===a)),U=FO_UI;
  if(!Object.keys(U.relArqs).length)arqs.forEach(a=>U.relArqs[a]=true);const nm=foMarcados().length;
  $("#foRelOut").innerHTML=`<div class="card"><h2>Relatório por arquivo</h2><p class="hint">Uma secção por arquivo, ordenada por armário, prateleira e número, com o QR code da pasta e o código de barras de cada dossier — como o relatório do FileMaker, mas cada arquivo começa numa página nova.</p>
      <div class="fd-chk">${arqs.map(a=>`<label class="fd-ck"><input type="checkbox" data-fdra="${esc(a)}"${U.relArqs[a]?" checked":""}> ${esc(foArqNome(a))} <span class="hint" style="margin:0">(${D.filter(d=>d.arq===a).length})</span></label>`).join("")}</div>
      <div class="row" style="gap:10px;align-items:center;margin-top:10px"><label class="fd-ck"><input type="checkbox" id="foRelCod" checked> Com QR codes e códigos de barras</label><span class="grow"></span>
      ${nm?`<button class="b s" data-fdrel="marc">Só os ${nm} selecionados</button>`:""}<button class="b" data-fdrel="arqs">Criar o relatório</button></div></div>
    <div class="card"><h2>Lista de conferência</h2><p class="hint">Para conferir o arquivo em papel: uma linha por dossier, pela ordem das prateleiras, com um quadrado para marcar e espaço para observações. Para conferir com o leitor de códigos, use a <a href="#" data-fdir="foConf">Conferência</a>.</p>
      <div class="row" style="gap:10px"><span class="grow"></span><button class="b" data-fdrel="lista">Criar a lista</button></div></div>
    <div class="card"><h2>Exportar e importar</h2><p class="hint">O Excel leva todos os dossiers, com todos os campos, o estado e quem os tem. A cópia de segurança (.json) leva tudo o que está no Folder360 e pode voltar a ser importada: junta-se ao que já existe, nada é apagado (em cada dossier fica a versão alterada mais recentemente).</p><div class="row" style="gap:10px"><span class="grow"></span><button class="b s" data-fdrel="xls">Excel (.xlsx)</button><button class="b s" data-fdrel="json">Cópia de segurança (.json)</button>${foEd()?`<label class="b imp" title="Traz uma cópia do Folder360 (.json), por exemplo a dos dossiers do FileMaker. Junta-se ao que já existe, nada é apagado.">Importar cópia (.json)<input type="file" accept=".json,application/json" data-foimp hidden></label><label class="b imp" title="Lê diretamente o ficheiro do FileMaker (dbGUIDE-DTP.fmp12): entram os dossiers e os cursos que ainda não estão no Folder360. Nada é apagado nem substituído.">Importar do FileMaker (.fmp12)<input type="file" accept=".fmp12" data-foimpfm hidden></label>`:""}</div><div id="foImpMsg"></div></div>`}
(function(){const S=document.getElementById("foRel");if(!S)return;
  S.addEventListener("change",e=>{if(e.target.dataset.fdra)FO_UI.relArqs[e.target.dataset.fdra]=e.target.checked});
  S.addEventListener("click",e=>{const a=e.target.closest("[data-fdir]");if(a){e.preventDefault();show(a.dataset.fdir);return}const b=e.target.closest("[data-fdrel]");if(!b)return;const k=b.dataset.fdrel,sel=FOL.dossiers.filter(d=>FO_UI.relArqs[d.arq]);
    if(k==="arqs")foPdfRel(sel,{codigos:$("#foRelCod").checked});else if(k==="marc")foPdfRel(foMarcados(),{codigos:$("#foRelCod").checked});else if(k==="lista")foPdfLista(sel);else if(k==="xls")foExcel(FOL.dossiers);
    else if(k==="json"){download(`folder360_copia_${new Date().toISOString().slice(0,10)}.json`,JSON.stringify(FOL,null,1),"application/json");toast("Cópia descarregada")}})})();

// ----- Importar uma cópia do Folder360 (.json): junta-se, nunca apaga -----
async function foImportar(fl){if(!foEd()||!fl)return;try{const j=JSON.parse(await fl.text()),n=foNorm(j&&j.folder360?j.folder360:j);
    if(!n.dossiers.length&&!n.mov.length&&!n.cursos.length){escLinhaMsg("#foImpMsg","Esse ficheiro não tem dossiers do Folder360.","bad");return}
    const antes=new Map(FOL.dossiers.map(d=>[d.id,d.em||0]));let novos=0,mud=0;n.dossiers.forEach(d=>{if(!antes.has(d.id))novos++;else if((d.em||0)>antes.get(d.id))mud++});
    FOL=foJuntar(FOL,n);foIdxC=null;foGuardar();const m=`Importado: ${novos} dossier${novos===1?"":"s"} novo${novos===1?"":"s"}${mud?`, ${mud} atualizado${mud===1?"":"s"}`:""}. Agora há ${FOL.dossiers.length} dossiers.`;
    toast(m);if(curTab)foRender(curTab);setTimeout(()=>escLinhaMsg("#foImpMsg",m,"ok"),60)}
  catch(e){escLinhaMsg("#foImpMsg","Não foi possível ler esse ficheiro ("+esc(e.message||e)+").","bad")}}
document.querySelectorAll("#foInicio,#foRel").forEach(S=>S.addEventListener("change",e=>{const x=e.target.closest("[data-foimp]");if(x&&x.files&&x.files[0]){foImportar(x.files[0]);x.value=""}}));
// ----- 0.9.234: Importar diretamente do FileMaker (.fmp12) — leitor em fmp12.js -----
// Entram os dossiers e os cursos que ainda não existem; os que já estão no Folder360 (mesmo identificador do FileMaker ou
// mesmo sítio + ano + título + volume) ficam como estão — nada é apagado nem substituído. O Património fica de fora (decisão do diretor).
function foFmData(s){const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(String(s||"").trim());return m?new Date(+m[3],+m[2]-1,+m[1],+(m[4]||0),+(m[5]||0),+(m[6]||0)).getTime():0}
function foFmChave(d){return norm([d.arq,d.arm,d.prat,String(d.ns||"").replace(/^0+/,""),d.ano,d.tit,d.vol||"1"].join("|"))}
async function foImportarFM(fl){if(!foEd()||!fl)return;const msg=(t,k)=>escLinhaMsg("#foImpMsg",t,k);
  try{msg(`A ler ${esc(fl.name)} (${Math.round(fl.size/1048576)} MB)…`,"info");await new Promise(r=>setTimeout(r,30));
    if(typeof FO_SINC!=="undefined"&&!FO_SINC)try{await foTrazerNuvem()}catch(e){} // comparar com o que está mesmo na nuvem
    const f=fmpLer(await fl.arrayBuffer());await new Promise(r=>setTimeout(r,0));
    const T=f.tabelas(),tD=T.find(t=>norm(t.nome)==="dossiers"),tC=T.find(t=>norm(t.nome)==="cursos");
    if(!tD){msg("Esse ficheiro do FileMaker não tem a tabela «Dossiers» (é o dbGUIDE-DTP?).","bad");return}
    const D=f.registos(tD.i).registos,C=tC?f.registos(tC.i).registos:[];
    const vale=v=>{v=String(v??"").trim();return /^-+$/.test(v)?"":v};
    // cursos
    const cPorNome=new Map(FOL.cursos.map(c=>[norm(c.nome),c]));let nC=0;const mapaC=new Map(),NCU=[];
    for(const r of C){const num=vale(r["NúmeroCurso"]),des=vale(r["Designação"]),nome=vale(r.NomeCurso)||(num?num+" - "+des:des);if(!nome)continue;mapaC.set(norm(nome),{nome,num});
      if(cPorNome.has(norm(nome)))continue;const c={id:"fm-"+(r.PrimaryKey||uid()),num,des:des||nome,nome,cr:foFmData(r.CreationTimestamp)||Date.now(),em:foFmData(r.ModificationTimestamp)||Date.now(),origem:"filemaker"};
      NCU.push(c);cPorNome.set(norm(nome),c);nC++}
    // dossiers
    const ids=new Set(FOL.dossiers.map(d=>d.id)),pks=new Set(FOL.dossiers.map(d=>d.fmPk).filter(Boolean)),chaves=new Set(FOL.dossiers.map(foFmChave)),idsTxt=FOL.dossiers.map(d=>String(d.id)).join("\n");
    const criados=new Set(FOL.dossiers.filter(d=>d.cr).map(d=>Math.round(d.cr/1000)+"|"+norm(d.tit))),cbs=new Set(FOL.dossiers.filter(d=>d.cbAntigo).map(d=>norm(d.cbAntigo+"|"+d.ano+"|"+d.tit+"|"+(d.vol||"1")))); // o mesmo registo, mesmo que já tenha mudado de sítio na app
    let novos=0,ja=0;const NOV=[];const E=foDef(),arqs=new Map(E.arqs.map(a=>[a.cod,a]));let defMud=false;
    for(const r of D){const pk=vale(r.PrimaryKey),curso=vale(r.Curso),cc=mapaC.get(norm(curso));
      const d={id:pk?"fm-"+pk:uid()+uid(),fmPk:pk,arq:vale(r["Localização"]),arm:vale(r["Armário"]),prat:vale(r.Prateleira),ns:vale(r["NúmeroSérie"]),ano:vale(r.AnoLetivo),anoCur:vale(r.AnoCurricular),
        curso,cursoNum:foNumCurso(cc&&cc.num?cc.num:curso),tit:vale(r["Título"]),vol:vale(r.Volume)||"1",volT:vale(r.TotalVolume)||"1",proj:vale(r["NúmeroProjeto"]),fin:vale(r.FSE),tipo:vale(r.Tipo)||"Tecnicopedagógico",
        princ:vale(r.Principal)==="Sim",url:vale(r.URL),obs:"",cbAntigo:vale(r.BARCODENUMBER),cr:foFmData(r.CreationTimestamp)||Date.now(),por:vale(r.CreatedBy),em:foFmData(r.ModificationTimestamp)||Date.now(),mod:vale(r.ModifiedBy),origem:"filemaker"};
      if(ids.has(d.id)||ids.has(pk)||(pk&&(pks.has(pk)||idsTxt.includes(pk)))||chaves.has(foFmChave(d))||criados.has(Math.round(d.cr/1000)+"|"+norm(d.tit))||(d.cbAntigo&&cbs.has(norm(d.cbAntigo+"|"+d.ano+"|"+d.tit+"|"+d.vol)))){ja++;continue}
      NOV.push(d);ids.add(d.id);chaves.add(foFmChave(d));novos++}
    // 0.9.234: confirmar antes de juntar (para se ver logo se o número de novos não faz sentido)
    if(novos&&!confirm(`O ficheiro do FileMaker tem ${D.length} dossiers: ${ja} já estão no Folder360 e ${novos} ${novos===1?"é novo":"são novos"}.${nC?`\nHá também ${nC} curso${nC===1?"":"s"} novo${nC===1?"":"s"}.`:""}\n\nJuntar os novos ao Folder360? (Nada é apagado nem substituído.)`)){
      msg("Importação cancelada: nada foi alterado.","info");return}
    if(!novos&&nC&&!confirm(`Os dossiers do FileMaker já estão todos no Folder360, mas há ${nC} curso${nC===1?"":"s"} novo${nC===1?"":"s"}. Juntá-lo${nC===1?"":"s"}?`)){msg("Importação cancelada: nada foi alterado.","info");return}
    FOL.dossiers.push(...NOV);FOL.cursos.push(...NCU);
    for(const d of NOV){if(d.arq){let a=arqs.get(d.arq);if(!a){a={cod:d.arq,nome:"",arms:"",prats:""};E.arqs.push(a);arqs.set(d.arq,a);defMud=true}
        for(const [k,v] of [["arms",d.arm],["prats",d.prat]])if(v&&!foLista(a[k]).includes(v)){a[k]=foLista(a[k]).concat(v).join(",");defMud=true}}
      if(d.fin&&!E.fins.some(x=>norm(x.n)===norm(d.fin))){E.fins.push({n:d.fin,logo:null});defMud=true}}
    if(defMud)E.em=Date.now();
    if(novos||nC||defMud){foIdxC=null;foGuardar()}
    const m=novos||nC?`Importado do FileMaker: ${novos} dossier${novos===1?"":"s"} novo${novos===1?"":"s"}${nC?` e ${nC} curso${nC===1?"":"s"}`:""}${ja?` (${ja} já estavam no Folder360 e ficaram como estavam)`:""}. Agora há ${FOL.dossiers.length} dossiers.`
      :`Nada de novo: os ${ja} dossiers do FileMaker já estão todos no Folder360 (ficaram como estavam).`;
    toast(m);if(curTab)foRender(curTab);setTimeout(()=>msg(esc(m),"ok"),60)}
  catch(e){msg("Não foi possível ler esse ficheiro do FileMaker ("+esc(e.message||e)+").","bad")}}
document.querySelectorAll("#foInicio,#foRel").forEach(S=>S.addEventListener("change",e=>{const x=e.target.closest("[data-foimpfm]");if(x&&x.files&&x.files[0]){foImportarFM(x.files[0]);x.value=""}}));
// ----- Definições -----
function foDefUI(){const E=foDef(),ed=foEd(),dis=ed?"":"disabled",{m,r}=pdfLogos();
  const lst=(k,t,h)=>`<label class="w2">${t}<textarea data-fdlst="${k}" rows="3" ${dis}>${esc(E[k].join("\n"))}</textarea>${h?`<small class="hint">${h}</small>`:""}</label>`;
  $("#foDefOut").innerHTML=`<div class="card"><h2>Arquivos, armários e prateleiras</h2><p class="hint">O código do arquivo é a primeira parte do código de localização (ARQ1-<b>B</b><b>III</b>05-1617-956). Os armários e as prateleiras escrevem-se separados por vírgulas, pela ordem em que estão.</p>
      <div class="tw"><table class="rt pp-ct"><thead><tr><th style="width:110px">Código</th><th>Nome</th><th>Armários</th><th>Prateleiras</th><th>Dossiers</th>${ed?"<th></th>":""}</tr></thead><tbody>${E.arqs.map((a,i)=>`<tr data-fdai="${i}"><td><input type="text" data-fda="cod" value="${esc(a.cod)}" ${dis}></td><td><input type="text" data-fda="nome" value="${esc(a.nome||"")}" placeholder="ex.: Arquivo do piso 0" ${dis}></td><td><input type="text" data-fda="arms" value="${esc(a.arms||"")}" ${dis}></td><td><input type="text" data-fda="prats" value="${esc(a.prats||"")}" ${dis}></td><td>${FOL.dossiers.filter(d=>d.arq===a.cod).length}</td>${ed?`<td><button class="b s danger" data-fdadel="${i}"${FOL.dossiers.some(d=>d.arq===a.cod)?' disabled title="Tem dossiers"':""}>Tirar</button></td>`:""}</tr>`).join("")}</tbody></table></div>
      ${ed?`<button class="b s" data-fdaadd style="margin-top:8px">Acrescentar arquivo</button>`:""}</div>
    <div class="card"><h2>Logótipos</h2><p class="hint">Os logótipos das lombadas, das etiquetas de CD e dos relatórios vêm das <a href="#" data-fdir="def">Definições › Logótipos</a> da EPISJ 360: o <b>Logotipo Principal</b> e o do <b>Canto Superior Direito</b> vão para o cimo da lombada.</p>
      <div class="fd-lgs"><div><small>Principal</small>${foLg(m)?`<img src="${m.src}" alt="">`:"<em>sem logótipo</em>"}</div><div><small>Canto superior direito</small>${foLg(r)?`<img src="${r.src}" alt="">`:"<em>sem logótipo</em>"}</div></div>
      <p class="hint" style="margin-top:12px">No rodapé de cada lombada vai o logótipo do <b>programa de financiamento</b> do dossier, se o puser aqui em baixo. Se não, vai o do ano letivo do dossier (Definições › Logótipos › Centrado no Rodapé) ou, se esse ano não tiver, o do ano mais próximo.</p>
      <div class="tw"><table class="rt pp-ct"><thead><tr><th>Programa de financiamento</th><th>Logótipo do rodapé</th><th>Dossiers</th>${ed?"<th></th>":""}</tr></thead><tbody>${E.fins.map((f,i)=>`<tr data-fdfi="${i}"><td><input type="text" data-fdfn value="${esc(f.n)}" ${dis}></td><td>${foLg(f.logo)?`<img class="fd-flg" src="${f.logo.src}" alt="">`:f.padrao?`<img class="fd-flg" src="${esc(f.padrao)}" alt=""> <span class="hint" style="margin:0">(o do FileMaker)</span>`:'<span class="hint" style="margin:0">— (usa o do ano letivo)</span>'}</td><td>${FOL.dossiers.filter(d=>d.fin===f.n).length}</td>${ed?`<td class="fd-nw"><label class="b s imp">Carregar<input type="file" accept="image/png,image/jpeg" data-fdflg="${i}" hidden></label>${foLg(f.logo)||f.padrao?` <button class="b s" data-fdflx="${i}">Tirar</button>`:""}</td>`:""}</tr>`).join("")}</tbody></table></div>
      ${ed?`<button class="b s" data-fdfadd style="margin-top:8px">Acrescentar programa</button>`:""}</div>
    <div class="card"><h2>Listas</h2><div class="pp-form">${lst("titulos","Títulos dos dossiers","Um por linha. Aparecem como sugestões no campo «Dossier».")}${lst("tipos","Tipos")}${lst("anosCur","Anos curriculares")}</div></div>
    <div class="card"><h2>Lombadas e requisições</h2><div class="pp-form"><label>Texto no fundo da lombada<input type="text" data-fdo="site" value="${esc(E.site||"")}" ${dis}></label><label>Prazo de devolução (dias)<input type="number" min="1" data-fdo="prazo" value="${esc(E.prazo||15)}" ${dis}></label></div></div>
    <div class="card"><h2>Cursos antigos</h2><p class="hint">Os cursos que vieram do FileMaker, para escolher ao criar dossiers de anos antigos. Os cursos e as turmas da Escola360 também aparecem como sugestão. O número do curso é a última parte do código de localização.</p>
      <div class="tw" style="max-height:340px"><table class="rt pp-ct"><thead><tr><th style="width:110px">N.º</th><th>Designação</th><th>Dossiers</th>${ed?"<th></th>":""}</tr></thead><tbody>${FOL.cursos.slice().sort((a,b)=>COLL_PTN.compare(a.num||"zz",b.num||"zz")).map(c=>`<tr data-fdc="${c.id}"><td><input type="text" data-fdck="num" value="${esc(c.num||"")}" ${dis}></td><td><input type="text" data-fdck="des" value="${esc(c.des||"")}" ${dis}></td><td>${FOL.dossiers.filter(d=>d.curso===c.nome).length}</td>${ed?`<td><button class="b s" data-fdcdel="${c.id}">Tirar</button></td>`:""}</tr>`).join("")}</tbody></table></div>
      ${ed?`<button class="b s" data-fdcadd style="margin-top:8px">Acrescentar curso</button>`:""}</div>`}
(function(){const S=document.getElementById("foDef");if(!S)return;
  S.addEventListener("change",async e=>{if(!foEd())return;const E=foDef(),x=e.target;
    const ar=x.closest("[data-fdai]");if(ar&&x.dataset.fda){const a=E.arqs[+ar.dataset.fdai],k=x.dataset.fda,v=x.value.trim();if(k==="cod"){if(!v){x.value=a.cod;return}const old=a.cod;FOL.dossiers.filter(d=>d.arq===old).forEach(d=>{d.arq=v;foGuardar(d)});a.cod=v}else a[k]=v;foGuardar(E);foDefUI();return}
    const fi=x.closest("[data-fdfi]");if(fi&&x.matches("[data-fdfn]")){const f=E.fins[+fi.dataset.fdfi],v=x.value.trim();if(!v){x.value=f.n;return}FOL.dossiers.filter(d=>d.fin===f.n).forEach(d=>{d.fin=v;foGuardar(d)});f.n=v;foGuardar(E);foDefUI();return}
    if(x.dataset.fdflg!==undefined&&x.files&&x.files[0]){const fl=x.files[0],src=await new Promise(ok=>{const r=new FileReader();r.onload=()=>ok(r.result);r.readAsDataURL(fl)}),im=new Image();await new Promise(ok=>{im.onload=ok;im.onerror=ok;im.src=src});
      if(!im.naturalWidth){toast("Essa imagem não abriu");return}E.fins[+x.dataset.fdflg].logo={src,w:im.naturalWidth,h:im.naturalHeight,nome:fl.name};foGuardar(E);foDefUI();return}
    if(x.dataset.fdlst){E[x.dataset.fdlst]=x.value.split("\n").map(s=>s.trim()).filter(Boolean);foGuardar(E);return}
    if(x.dataset.fdo){E[x.dataset.fdo]=x.dataset.fdo==="prazo"?Math.max(1,+x.value||15):x.value.trim();foGuardar(E);return}
    const cr=x.closest("[data-fdc]");if(cr&&x.dataset.fdck){const c=FOL.cursos.find(z=>z.id===cr.dataset.fdc);if(!c)return;const old=c.nome;c[x.dataset.fdck]=x.value.trim();c.nome=c.num?`${c.num} - ${c.des}`:c.des;
      if(old&&old!==c.nome&&confirm(`Mudar também o curso nos ${FOL.dossiers.filter(d=>d.curso===old).length} dossiers que o têm?`))FOL.dossiers.filter(d=>d.curso===old).forEach(d=>{d.curso=c.nome;d.cursoNum=foNumCurso(c.num);foGuardar(d)});foGuardar(c);foDefUI()}});
  S.addEventListener("click",e=>{const a=e.target.closest("[data-fdir]");if(a){e.preventDefault();show(a.dataset.fdir);return}const b=e.target.closest("button");if(!b||!foEd())return;const E=foDef();
    if(b.matches("[data-fdaadd]")){E.arqs.push({cod:"ARQ"+(E.arqs.length+1),nome:"",arms:"A,B,C",prats:"I,II,III,IV,V"});foGuardar(E);foDefUI();return}
    if(b.dataset.fdadel!==undefined){const i=+b.dataset.fdadel;if(FOL.dossiers.some(d=>d.arq===E.arqs[i].cod))return;E.arqs.splice(i,1);foGuardar(E);foDefUI();return}
    if(b.matches("[data-fdfadd]")){E.fins.push({n:"Novo programa",logo:null});foGuardar(E);foDefUI();return}
    if(b.dataset.fdflx!==undefined){const f=E.fins[+b.dataset.fdflx];if(foLg(f.logo))f.logo=null;else f.padrao="";foGuardar(E);foDefUI();return}
    if(b.matches("[data-fdcadd]")){const c={id:uid()+uid(),num:"",des:"Novo curso",nome:"Novo curso",cr:Date.now()};FOL.cursos.push(c);foGuardar(c);foDefUI();return}
    if(b.dataset.fdcdel){const c=FOL.cursos.find(z=>z.id===b.dataset.fdcdel);if(!c||!confirm(`Tirar o curso «${c.nome}» da lista? (Os dossiers que o têm ficam como estão.)`))return;FOL.cursos=FOL.cursos.filter(z=>z!==c);FOL.del[c.id]=Date.now();foGuardar();foDefUI()}})})();

