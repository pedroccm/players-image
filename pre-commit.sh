#!/bin/bash

echo "🔧 Running pre-commit checks..."

# Formatar apenas arquivos modificados
echo "📝 Formatting modified files..."
git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx|js|jsx)$' | xargs -r pnpm exec prettier --write

# Adicionar arquivos formatados de volta ao stage
git add .

# Verificar se há erros de build localmente
echo "🧪 Running quick lint check..."
pnpm run lint:fix

echo "✅ Pre-commit checks completed!"