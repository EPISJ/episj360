// EPISJ 360 — monta a app a partir de src/ (0.9.133).
//   node tools/montar.mjs            → escreve index.html e app/ (app.css, app.js, m/<módulo>.js, …)
//   node tools/montar.mjs --verificar → só confirma que index.html e app/ estão iguais ao que src/ dá (usado no GitHub)
// O código edita-se SEMPRE em src/. index.html e app/ são gerados: alterações feitas lá à mão perdem-se.
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const R=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const S=p=>path.join(R,'src',p);const ler=p=>fs.readFileSync(S(p),'utf8').replace(/\n?$/,'\n');
const M=JSON.parse(fs.readFileSync(S('ficheiros.json'),'utf8'));
const VERSAO=(/const VERSAO="([^"]+)"/.exec(ler('js/core/base.js'))||[])[1];if(!VERSAO)throw new Error('VERSAO não encontrada em src/js/core/base.js');
const AVISO='GERADO por tools/montar.mjs a partir de src/ — não editar aqui (as alterações perdem-se). EPISJ 360 '+VERSAO;
const juntar=(L,css)=>L.map(f=>(css?`/* ===== src/${f} ===== */\n`:`// ===== src/${f} =====\n`)+ler(f)).join('');
const saida={};
saida['app/app.css']=`/* ${AVISO} */\n`+juntar(M.css,true);
// o código da app corre todo no mesmo âmbito (um só ficheiro, como antes dentro de uma função): as funções continuam «içadas» de um ficheiro para o outro
saida['app/app.js']=`/* ${AVISO} */\n"use strict";\n`+juntar(M.app);
for(const [m,L] of Object.entries(M.modulos))saida[`app/m/${m}.js`]=`/* ${AVISO} — ecrã do módulo «${m}», carregado quando é aberto */\n"use strict";\n`+juntar(L);
// 0.9.139: corre antes de tudo, também no Social360 e no Horários360 (nada fica no computador)
saida['app/sem-armazenamento.js']=`/* ${AVISO} */\n`+juntar(M.armazenamento);
saida['app/cabeca.js']=`/* ${AVISO} */\n`+juntar(M.cabeca);
saida['app/rede.js']=`/* ${AVISO} */\n`+juntar(M.rede);
saida['app/extra.js']=`/* ${AVISO} */\n`+juntar(M.extra);
const url=f=>`${f}?v=${encodeURIComponent(VERSAO)}`;
let html=fs.readFileSync(S('index.html'),'utf8');
html=html.replace('<head>\n',`<head>\n<!-- ${AVISO} -->\n`).replace(/^@@css@@$/m,`<link rel="stylesheet" href="${url('app/app.css')}">`).replace(/@@url:([^@]+)@@/g,(x,f)=>{if(!saida[f])throw new Error('ficheiro desconhecido '+f);return url(f)});
if(/@@/.test(html))throw new Error('marca @@ por trocar em src/index.html');
saida['index.html']=html;
const verificar=process.argv.includes('--verificar');let dif=[];
// ficheiros a mais em app/ (de módulos que já não existem)
const existentes=[];const andar=d=>{if(!fs.existsSync(d))return;for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?andar(p):existentes.push(path.relative(R,p))}};andar(path.join(R,'app'));
for(const f of existentes)if(!saida[f]){dif.push(f+' (a mais)');if(!verificar)fs.unlinkSync(path.join(R,f))}
for(const [f,c] of Object.entries(saida)){const p=path.join(R,f);const ant=fs.existsSync(p)?fs.readFileSync(p,'utf8'):null;if(ant!==c){dif.push(f);if(!verificar){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,c)}}}
if(verificar){if(dif.length){console.error('index.html / app/ não correspondem a src/. Corra «node tools/montar.mjs» e publique o resultado:\n  '+dif.join('\n  '));process.exit(1)}console.log('OK: index.html e app/ correspondem a src/ ('+VERSAO+')')}
else console.log(`EPISJ ${VERSAO}: `+(dif.length?'atualizados '+dif.join(', '):'nada mudou'));
