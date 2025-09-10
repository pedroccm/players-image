# Claude Development Guide

## Comando de Lint/Format Obrigatório

SEMPRE rode antes de fazer commit:

```bash
pnpm run fix
```

## Scripts Disponíveis

### Formatação

- `pnpm run format` - Formatar todos os arquivos
- `pnpm run format:check` - Verificar se arquivos estão formatados
- `pnpm run format:staged` - Formatar apenas arquivos no staging
- `pnpm run fix` - Formatar + corrigir ESLint (USE ESTE!)

### Linting

- `pnpm run lint` - Verificar problemas de ESLint
- `pnpm run lint:fix` - Corrigir problemas automáticos de ESLint
- `pnpm run check` - Verificar formatação + ESLint

## VS Code Configuração

O projeto já tem `.vscode/settings.json` configurado para:

- ✅ Formatar automaticamente ao salvar
- ✅ Corrigir ESLint automaticamente
- ✅ Usar Prettier como formatador padrão

## Workflow Recomendado

### Antes de cada commit:

```bash
# 1. Verificar o que está sendo commitado
git status
git diff

# 2. OBRIGATÓRIO: Formatar + corrigir
pnpm run fix

# 3. Adicionar e commitar
git add .
git commit -m "sua mensagem"
git push
```

### Para novos arquivos:

1. Sempre use as configurações do VS Code (formatação automática)
2. Se criar arquivo fora do VS Code, rode `pnpm run format` antes do commit
3. Teste sempre com `pnpm run check` antes de commitar

## Configuração do Prettier

O projeto usa:

- Semi: false (sem ponto e vírgula)
- Single quotes: false (aspas duplas)
- Print width: 80 caracteres
- Tab width: 2 espaços
- Trailing comma: ES5

## Problemas Comuns

### Build falha no Netlify

**Causa**: Arquivos não formatados corretamente
**Solução**:

```bash
pnpm run fix
git add .
git commit -m "fix: apply prettier formatting"
git push
```

### ESLint errors

**Causa**: Imports desordenados, variáveis não usadas, etc.
**Solução**:

```bash
pnpm run lint:fix
```

### Prettier conflicts

**Causa**: Formatação manual incorreta
**Solução**:

```bash
pnpm run format
```

## Extensões VS Code Recomendadas

- Prettier - Code formatter (esbenp.prettier-vscode)
- ESLint (dbaeumer.vscode-eslint)
- Tailwind CSS IntelliSense
- TypeScript Hero (importação automática)

---

**LEMBRE-SE**: SEMPRE rode `pnpm run fix` antes de commitar!
