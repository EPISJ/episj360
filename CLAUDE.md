# EPISJ 360 — regras para quem mexe no código

**Desde a 0.9.135 o código edita-se em `src/`, nunca no `index.html` nem em `app/`.**
`index.html` e `app/` são gerados por `node tools/montar.mjs`; uma alteração feita lá à mão perde-se na montagem seguinte.

## Como fazer uma alteração
1. `git fetch` e partir de `origin/main` (várias sessões publicam em paralelo; a versão nova é a seguinte à de `origin/main`).
2. Editar os ficheiros em `src/` (ver mapa abaixo).
3. Subir `VERSAO` em `src/js/core/base.js` e pôr uma entrada no início de `NOVIDADES` em `src/js/core/novidades.js`.
4. `node tools/montar.mjs` (gera `index.html` e `app/`), depois `node tools/montar.mjs --verificar`.
5. Testar e publicar `src/`, `index.html` e `app/` no mesmo commit.

Se alguém tiver mexido diretamente no `index.html` publicado, levar essas alterações para `src/` antes de montar (senão desaparecem).

## Mapa de `src/`
- `src/index.html` — o HTML da página (sem CSS nem JS; as marcas `@@…@@` são trocadas na montagem).
- `src/ficheiros.json` — **ordem** dos ficheiros. `app` = juntos em `app/app.js` (um só âmbito, como antes dentro de uma função: as funções continuam «içadas» de um ficheiro para o outro). `modulos` = ecrãs carregados só quando o módulo é aberto (`app/m/<id>.js`).
- `src/css/` → `app/app.css`. `src/js/inicio/` (cabeça e rede de segurança do arranque), `src/js/extra/` (NumberFlow e menu Apps).
- `src/js/core/` núcleo (módulos, nuvem/Supabase, entrada e perfis, PDF, Office 365, novidades, arranque); `src/js/box/` Box360; `src/js/escola/` Escola360 (anos, cursos/turmas, planos/DSD, calendário, Painel e widgets); `src/js/horario/`, `src/js/sala/`, `src/js/crono/`, `src/js/social/`.
- PAP360, Pass360, Folder360, Econo360: `<mod>-dados.js` (sempre carregado: estado, nuvem, cópias, widget) + `<mod>.js` (ecrã, carregado ao abrir).

## Módulos carregados ao abrir
- `MOD_LAZY`, `modCarregar(m)` e `modStub()` em `src/js/core/modulos.js`. O núcleo chama `papRender`/`pwRender`/`foRender`/`ecoRender`: são substitutos que carregam o ficheiro e depois chamam o verdadeiro.
- O núcleo e os `*-dados.js` **nunca** podem usar funções que só existem no ecrã do módulo (exceto pelos substitutos ou com `typeof x==="function"`). Um widget cujo conteúdo precisa do ecrã regista-se com `r(){return wgLazy("<mod>","<id>")}` e o ecrã define `WG_R["<id>"]`.
- Para passar outro módulo a «carregado ao abrir»: separar os dados para `<mod>-dados.js`, pôr o ecrã em `modulos` no `ficheiros.json`, juntar a `MOD_LAZY` e criar o substituto do render.

## Regras que continuam (ver `claude/resumo-tecnico.md` no projeto)
- Box só leitura. Nunca apagar dados ao mudar código. Verde só nos botões de importar. «formadores», «formandos», «orientador educativo».
- Arranque: um render chamado no arranque não pode usar `const`/`let` declarados mais abaixo em `app/app.js` (erro TDZ). Testar o arranque com `guide_mod` = cada módulo.

## Horários360 (0.9.137)
- `eduschedule.html` (e as letras em `fontes/`) está na raiz deste repositório e abre na mesma origem (`ES_URL` em `src/js/horario/horario.js`). Já não vem de eduspruce.github.io: melhorias ao Horários360 fazem-se aqui.
- Não passa pela montagem. Tem política de segurança própria com «hashes» dos scripts embutidos: se mudar um `<script>` embutido, atualize o hash correspondente no `<meta http-equiv="Content-Security-Policy">`, senão o Horários360 fica em branco.

## Emails (0.9.163)
- Os emails enviados pela app (`msEnviar`) **não levam ligações (`<a href>`) para episj360.episj.com**: o filtro do Office 365 da escola retinha-os sem avisar (Graph responde 202, mas não chegam). Testado a 22/11/2026: o mesmo email sem ligações chega. Escrever o endereço como texto.

## Segurança
- `g360_email()` só aceita identidades do inquilino Office 365 da escola (`servidor/supabase-episj360-seguranca.sql`). Não remover essa verificação.
- Tudo o que vai para `innerHTML` passa por `esc()`.
- **Nada fica no computador de quem usa a app (0.9.148).** `app/sem-armazenamento.js` corre primeiro (também no Social360 e no Horários360) e troca `localStorage`/`sessionStorage` por memória; `DB` (box/armazenamento.js) é só memória. Dados que têm de durar vão para o Supabase: peças em `g360_estado` (com `nuvemPut`, de preferência por `nuvFila` para sair logo ao fechar a página) e preferências de ecrã em `g360_prefs` (acrescentar a chave a `PREF_LS` em core/novidades.js). Nunca usar IndexedDB, cookies, Cache API ou o `localStorage` verdadeiro (`__g360Mem.real`), exceto a sessão do Supabase (`sbArmazem`) e a marca `box_oauth_pend` do login da Box (só a hora do pedido, no `sessionStorage` verdadeiro, apagada logo ao voltar — protege contra ligar a conta Box de outra pessoa por um link; ver `src/js/box/ligacao.js`).
  - **Exceção (0.9.155): a cache do MSAL (sessão da Microsoft, para enviar emails)** fica no `sessionStorage` verdadeiro — `SessHib` em `src/js/inicio/sem-armazenamento.js` encaminha só as chaves `msal.*`/`login.windows.net`; o resto do `sessionStorage` continua em memória. Sem isto, cada recarga perdia a sessão e os envios dependiam de uma janela que o navegador bloqueia. `guideSair` apaga estas chaves.
- Uma peça nova guardada em `DB.put("kv",…)` tem de entrar em `sairLocais()` (core/entrada.js), que confirma a nuvem antes de apagar o que versões antigas deixaram no computador (`legadoLimpar`). Nunca apagar a marca `episj_ger`.

## Ler antes de escrever (0.9.239)
- A memória começa vazia a cada recarga; os dados de cada módulo vêm do Supabase. **Nada pode ser editado nem gravado antes de a peça do módulo ter sido lida nesta sessão.**
- `nuvemPut` (core/nuvem.js) recusa as peças de `NUV_GUARDA` enquanto a sua marca (`CFG_SINC`, `ES_SINC`, `CR_SINC`, `AV_SINC`, `pwS().lido`, `PAP_SINC`, `FO_SINC`, `OF_SINC`, `ECO_SINC`, `ECF_SINC`, `H3_SINC`) não está ligada. A função `…TrazerNuvem` de cada módulo liga a marca **só depois** de ler a peça (ou de ver que não existe) e, na primeira leitura da sessão, junta com a nuvem — nunca envia a cópia daqui por cima sem ler.
- `core/carga.js` (`CARGA`): enquanto os dados do módulo aberto não chegam, mostra «A trazer da nuvem os dados do …», põe o ecrã `inert` e pede logo os dados; se falhar, «Tentar outra vez».
- **Módulo ou peça nova:** juntar a peça a `NUV_GUARDA`, a marca à função que a traz, e uma linha a `CARGA` (`p` = pronto, `t` = trazer).
