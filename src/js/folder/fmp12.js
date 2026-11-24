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
