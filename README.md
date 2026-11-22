# EPISJ 360

Aplicação de gestão da **Escola Profissional da Ilha de São Jorge** — https://episj360.episj.com

Módulos: Escola360, Box360, Horários360, Sala360, Crono360, Social360, PAP360, Pass360, Folder360, Econo360.

## Como está organizado

- **Este repositório é a fonte da EPISJ 360.** As alterações à app fazem-se aqui, diretamente, e o GitHub Pages publica-as em **episj360.episj.com** (ficheiro `CNAME`).
- Até à versão 0.9.125 a app vivia em `EduSpruce/eduspruce.github.io` (pasta `boxdoc/`) e era copiada para aqui de 10 em 10 minutos. Essa sincronização foi desligada: não editar a `boxdoc/`.
- `servidor/`: cópias de referência das funções do Supabase e do Cloudflare Worker, e os scripts SQL. Alterar aqui não publica nada: as funções têm de ser publicadas outra vez.
- `esm/supabase-2.117.3.min.js`: cliente do Supabase (a app carrega-o com `../esm/…`, que na raiz do domínio dá `/esm/…`).
- Os dados ficam no Supabase (projeto `episj360`), com exportação completa todas as noites (Definições › Exportação completa da base de dados).

## Endereços de login (têm de incluir episj360.episj.com)

- **Supabase** › Authentication › URL Configuration: Site URL `https://episj360.episj.com/`; Redirect URLs `https://episj360.episj.com/**` e `https://boxcheck.episj.pt/**`.
- **Microsoft Entra**, aplicação da EPISJ 360 (`8ed0cf26-753c-4bba-aa1a-f9ca0d799cae`) › Autenticação › Aplicação de página única: `https://episj360.episj.com/ms.html`.
- **Cloudflare Workers** `boxdoc-login` e `boxcheck-avisos`: origens permitidas com `https://episj360.episj.com`.

## Domínio

DNS em dominios.pt: registo `CNAME` com o nome `episj360` e o valor `episj.github.io`.
