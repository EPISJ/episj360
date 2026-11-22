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

## Segurança
- `g360_email()` só aceita identidades do inquilino Office 365 da escola (`servidor/supabase-episj360-seguranca.sql`). Não remover essa verificação.
- Tudo o que vai para `innerHTML` passa por `esc()`.
- «Terminar e limpar este computador» (`sairLimpar` em `src/js/core/entrada.js`) só limpa depois de `sairVerificar` confirmar a nuvem. Uma peça nova guardada no aparelho tem de entrar em `sairLocais()`; nunca apagar a marca `episj_ger`.
