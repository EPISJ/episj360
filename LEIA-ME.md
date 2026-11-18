# BoxDoc — Controlo de Entregas da Box

Uma única página web (`index.html`) que se liga diretamente à Box a partir do navegador, sem o Claude, sem servidor e sem nada instalado. A página:

1. guarda que módulos pertencem a cada professor e que documentos cada módulo tem de ter;
2. lê as pastas da Box e verifica o que foi entregue;
3. gera o relatório do que falta por professor, e o relatório de todas as pastas e subpastas;
4. prepara os emails: a cada professor com o que lhe falta, e o relatório geral (Excel/CSV e PDF).

**A Box só é lida.** A página só faz pedidos de leitura (listar pastas e ficheiros). Além disso, a aplicação da Box fica configurada apenas com permissão de leitura, por isso a própria Box impede qualquer alteração.

---

## 1. Pôr a página online (uma vez)

A página tem de estar num endereço `https://…`. Aberta diretamente do disco (duplo clique), a Box recusa a ligação. Qualquer alojamento de páginas estáticas serve, por exemplo:

- **o site da escola:** peça a quem gere o site para colocar `index.html` numa pasta, por exemplo `https://www.episj.com/entregas/`;
- **Netlify** (gratuito): crie conta em netlify.com, escolha *Add new site → Deploy manually* e arraste a pasta `BoxDoc`;
- **GitHub Pages** (gratuito): crie um repositório, carregue `index.html` e ative *Pages*.

Tome nota do endereço do site, sem o caminho. Por exemplo `https://www.episj.com` ou `https://o-meu-site.netlify.app`. É preciso no passo 2.

## 2. Criar a aplicação na Box (uma vez)

1. Entre na Box e abra https://app.box.com/developers/console
2. **Create New App → Custom App → User Authentication (OAuth 2.0)**. Chame-lhe “Controlo de Entregas”.
3. No separador **Configuration**:
   - **Application Scopes:** deixe marcado **apenas** *Read all files and folders stored in Box* e desmarque tudo o resto;
   - **CORS Domains:** escreva o endereço do site do passo 1, por exemplo `https://www.episj.com`;
   - **Save Changes**.

## 3. Usar (sempre que quiser verificar)

1. Na consola da Box, abra a aplicação → **Configuration** → **Developer Token** → **Generate Developer Token** e copie-o. Vale 60 minutos.
2. Abra a página, vá a **Dados da Box**, cole o token e clique em **Ligar**.
3. Navegue até *Gestão Documental › DTP 2026.2027* e clique em **Analisar**. Com cerca de 1.300 pastas, demora um ou dois minutos.
4. **Pastas:** árvore de todas as pastas e subpastas, com o número de ficheiros em cada uma. As vazias aparecem a vermelho.
5. **Atribuições:**
   - ajuste os tipos de documento (a *Secção* `006` corresponde a “006 - Planificações”, a `007` a “007 - Recursos Didáticos”);
   - clique em **Detetar módulos**;
   - atribua os professores com o filtro: escreva, por exemplo, `A01 matemática`, escolha o professor e clique em **Atribuir**. Para ver os módulos ainda por atribuir, escreva `!prof`.
6. **Relatório:** o que falta, por professor.
7. **Enviar:** “Abrir no email” abre o seu programa de email com a mensagem já escrita. O relatório geral pode ser descarregado em Excel (CSV) ou guardado em PDF.

A última análise fica guardada no navegador. Sem token, pode rever o relatório com **Usar a última análise guardada**.

## Guardar a configuração

As atribuições ficam guardadas **no navegador do computador onde as fez**. Para não as perder, ou para usar noutro computador, abra **Guardar / carregar**, escolha **Descarregar configuração** e guarde o ficheiro `.json`, por exemplo numa pasta sua. Noutro computador, use **Carregar ficheiro…**.

## Problemas frequentes

- **“O navegador não conseguiu falar com a Box”:** o endereço do site não está em *CORS Domains* na aplicação da Box, ou está escrito de forma diferente (com ou sem `www`, `https`).
- **“O token expirou”:** passaram 60 minutos. Gere outro e volte a ligar. A análise já feita não se perde.
- **Um módulo aparece todo em falta mas tem ficheiros:** no Relatório, marque “mostrar ficheiros encontrados” e confirme as pastas do módulo, a secção e as palavras-chave do documento.
