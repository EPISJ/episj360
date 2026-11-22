# EPISJ 360

Aplicação de gestão da **Escola Profissional da Ilha de São Jorge** — https://episj360.episj.com

Módulos: Escola360, Box360, Horários360, Sala360, Crono360, Social360, PAP360, Pass360, Folder360, Econo360.

## Como está organizado

- Este repositório é o que o GitHub Pages publica em **episj360.episj.com** (ficheiro `CNAME`).
- Os ficheiros da app são trazidos automaticamente de `EduSpruce/eduspruce.github.io` (pasta `boxdoc/`) pelo fluxo **Sincronizar** (`.github/workflows/sincronizar.yml`), de 10 em 10 minutos, ou à mão em *Actions › Sincronizar › Run workflow*.
- **Não edite os ficheiros da app aqui:** são substituídos na sincronização seguinte. Ficam sempre `README.md`, `CNAME`, `.nojekyll` e `.github`.
- Os dados ficam no Supabase (projeto `episj360`), com exportação completa todas as noites (Definições › Exportação completa da base de dados).

## Domínio

DNS em dominios.pt: registo `CNAME` com o nome `episj360` e o valor `episj.github.io`.
