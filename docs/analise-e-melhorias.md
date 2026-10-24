# LunarPass Tests — Análise e próximos passos (versão enxuta)

**Princípio:** adotar a estrutura de pastas já desenhada (módulos `mission-control` e `storefront`, dois projects no Playwright) e fazer só o que for necessário para começar os testes do Storefront. O restante fica em um backlog.

---

## 1. Diagnóstico

A estrutura-alvo (pastas por módulo, `pages/shared/` só para o que os dois módulos usam, `support/` com `db`, `helpers`, `index`, `types` e `users`, e um project do Playwright por módulo) está boa e é suficiente para o Storefront. O que existe hoje no disco ainda está na estrutura antiga:

| Hoje | Alvo |
|---|---|
| `tests/login.spec.ts`, `tests/register.spec.ts` | `tests/mission-control/` |
| `tests/home.spec.ts` | `tests/storefront/home.spec.ts` |
| `pages/login.page.ts`, `dash.page.ts`, `register.page.ts` | `pages/mission-control/` |
| `pages/componentes/navbar.ts` | `pages/mission-control/navbar.ts` |
| `pages/componentes/toast.ts` | `pages/shared/toast.ts` |
| *(não existe)* | `pages/storefront/home.page.ts` |
| `playwright.config.ts` com 1 project (`chromium`) | 2 projects: `mission-control` e `storefront` |
| `support/index.ts` com `app.loginPage`, `app.navbar`... | `app.mission.*`, `app.store.*`, `app.toast` |

Também há arquivos sem commit: `docs/arquitetura.md` e `support/index.ts`.

---

## 2. O que fazer agora

### 2.1 Tirar a senha do banco do código (único item urgente) — **adiado por decisão**

> **Decisão:** por enquanto a connection string continua em `support/db.ts` e não há `.env`. O uso de `.env` chegou a ser aplicado e foi revertido. O item abaixo permanece como recomendação pendente.

`support/db.ts` tem a connection string do Supabase escrita no código, e ela já está no histórico do git (commit `f7747f6`), com remote no GitHub.

1. Trocar a senha do banco no painel do Supabase.
2. Criar `.env` com `DATABASE_URL=...` e ler com `process.env.DATABASE_URL` em `support/db.ts`.
3. Adicionar `.env` ao `.gitignore` e criar um `.env.example` sem o valor real.

Para o Playwright carregar o `.env`, basta `import 'dotenv/config'` no topo do `playwright.config.ts` (`yarn add -D dotenv`).

### 2.2 Mover os arquivos para a estrutura-alvo

Seguir a tabela da seção 1. Depois da movimentação, ajustar os imports relativos (por exemplo, `../support` vira `../../support`; `../support/db` vira `../../support/db`).

Na fixture (`support/index.ts`), agrupar por módulo, como já está no `arquitetura.md`:

```ts
const createApp = (page: Page) => ({
  mission: {
    loginPage: new LoginPage(page),
    dashPage: new DashPage(page),
    registerPage: new RegisterPage(page),
    navbar: new Navbar(page),
  },
  store: {
    homePage: new HomePage(page),
  },
  toast: new Toast(page),
})
```

E migrar o `home.spec.ts` para usar `app.store.homePage` (hoje ele usa `page` direto e importa de `@playwright/test`).

### 2.3 `playwright.config.ts` com os dois projects

Só trocar o project `chromium` pelos dois projects. O `baseURL` continua no `use` global, vindo de `BASE_URL` (os dois módulos estão na mesma origem, então não precisa de URL por project):

```ts
projects: [
  {
    name: 'mission-control',
    testDir: './tests/mission-control',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'storefront',
    testDir: './tests/storefront',
    use: { ...devices['Desktop Chrome'] },
  },
],
```

Comandos: `npx playwright test --project=mission-control` e `npx playwright test --project=storefront`.

### 2.4 Trocar o seletor do `Toast` antes de começar o Storefront

`Toast.message` usa `getByRole('listitem')`. Na lista de resultados do Storefront cada missão também é um `li`, então o locator vai pegar vários elementos e o Playwright vai dar erro de strict mode. Trocar por um seletor específico do toast (role `status`/`alert` ou `data-testid="toast"`). Se o app não oferecer nenhum, incluir o pedido no `aderencia.md`.

### 2.5 Dois ajustes pequenos (opcionais)

- `package.json`: adicionar os scripts `test`, `test:mission` e `test:store`. `@anthropic-ai/claude-code` e `9router` estão em `dependencies`; se não forem usados pelos testes, vale mover para devDependencies ou instalar globalmente.
- `RegisterPage.submit()` faz um `expect` no meio do preenchimento (data de retorno). Funciona, mas mistura ação com verificação. Pode ficar como está por enquanto.

---

## 3. Regra de dados para o Storefront (sem criar nada novo)

A vitrine é pública e compartilha dados com o Mission Control. Com o que já existe em `support/db.ts` (`cleanInsertMission`, `cleanMission`):

1. Cada teste semeia a **própria missão** com ID exclusivo, como já é feito hoje.
2. Asserções sobre aquela missão específica, nunca sobre contagem total ou posição na lista (já está no `arquitetura.md`).
3. Missões criadas no teste são removidas ao final (`test.afterEach` chamando `cleanMission`). Hoje o `register.spec` só limpa **antes**, então as missões ficam no catálogo e aparecem na vitrine.

**Ponto a decidir quando chegar nele:** o cenário "nenhuma missão para a base X" (empty state) exige que a base esteja vazia, o que conflita com testes em paralelo e com os dados compartilhados. Vale combinar com o time como tratar (rodar esse teste isolado, ou ter um ambiente de teste separado).

---

## 4. Backlog (não agora)

Itens que fazem sentido mais adiante, sem urgência:

- Login único com `storageState` (setup project) para o Mission Control, em vez de logar pela UI em cada teste.
- Fixtures de dados com limpeza automática (`seedMission`), e factories com `faker`.
- Tipos do banco gerados a partir do Postgres (`kysely-codegen`), quando o Storefront precisar de reservas e tickets completos.
- `tsconfig.json`, ESLint/Prettier e pipeline de CI.
- Banco de teste separado do banco que o app usa.
- Tags por regra de negócio (`@R3`) e componentes próprios no Storefront (card de missão, mapa de assentos), quando os specs crescerem.
- Fechar o pool do banco ao final da execução (já está no seu item 4 da seção 6).

---

## 5. Ajustes pequenos no `arquitetura.md`

- Incluir `users.ts` em `support/` no desenho de pastas.
- Alinhar o nome `cleanAndInsertMission` (doc) com `cleanInsertMission` (código).
- Remover o TODO do `baseURL` do Storefront (mesma origem).
- Indicar que é o estado-alvo e o que já foi migrado.
