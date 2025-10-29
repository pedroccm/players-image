# Chat Football - Versão Football Website

Nova versão do chat de geração de imagens usando **100% do design e estilo do football-website**.

## 🎨 Figma Design

**Link do design original:**
https://www.figma.com/design/jFLDYdIvwm9cNyXD5EwH6P/app?node-id=0-1&p=f

## 📁 Estrutura

```
chat-football/
├── page.tsx                  # Página principal com layout completo
├── football.css              # CSS adaptado do football-website
├── README.md                 # Esta documentação
└── _components/
    ├── chat-interface.tsx    # Orquestrador principal do chat
    ├── chat-message.tsx      # Mensagens no estilo Q&A
    ├── team-selector.tsx     # Modal de seleção de times (page5 style)
    ├── background-gallery.tsx# Galeria de fundos (page2/page4 style)
    ├── photo-upload.tsx      # Upload de foto do jogador
    └── preview-premium.tsx   # Preview e oferta premium (page3 style)
```

## 🎨 Design

### Características Principais

- **Fontes**: Host Grotesk + Agharti
- **Cores**:
  - Main Blue: `#051C74`
  - Secondary Blue: `#2662E4`
  - Green: `#489F38`
  - Orange: `#FF6533`
  - Yellow: `#FFC500`

### Elementos Visuais

- ✅ **Corners coloridos** (azul, verde, laranja, amarelo)
- ✅ **Header** com logo "de craque by players.cx"
- ✅ **Mensagens Q&A** com logo circular e balões verdes
- ✅ **Seletores de time** com dropdown e busca
- ✅ **Galeria de fundos** em grid 4 colunas com modal viewer
- ✅ **Upload de foto** com preview estilizado
- ✅ **Footer fixo** com botão arredondado e seta

## 🔄 Fluxo do Chat

1. **Welcome** → Mostra heading text
2. **Name** → Input de nome
3. **Home Team** → Seletor de time (modal fullscreen)
4. **Away Team** → Seletor de time adversário
5. **Background** → Galeria de fundos (8 padrão + gerados)
6. **Photo** → Upload da foto do jogador
7. **Location** → Input do local do jogo
8. **DateTime** → Input de data/hora
9. **Generating** → Loading com relógio de areia
10. **Preview** → Preview da arte + oferta premium
11. **Premium** → (implementar PIX)
12. **Complete** → Finalizado

## 🆚 Diferenças vs Versões Anteriores

| Feature            | chat-image        | chat-new-image        | **chat-football**                  |
| ------------------ | ----------------- | --------------------- | ---------------------------------- |
| Design             | Tailwind genérico | Tailwind + form-image | **Football website CSS**           |
| Fontes             | Inter/Sans        | Inter                 | **Host Grotesk + Agharti**         |
| Corners            | ❌                | ❌                    | **✅ Coloridos**                   |
| Q&A Style          | Cards simples     | Cards                 | **Balões verdes + logo**           |
| Team Selector      | ❌                | Componente básico     | **Modal fullscreen + busca**       |
| Background Gallery | Lista             | Grid básico           | **Grid 4 cols + viewer modal**     |
| Photo Upload       | Dropzone          | Form upload           | **Estilo dotted border**           |
| Premium            | Modal simples     | Modal                 | **Seção integrada + botões**       |
| Footer             | Fixo simples      | Fixo                  | **Azul + botão branco estilizado** |

## 📦 Assets

### Imagens (em `/public/football/images/`)

- `logo.png`, `logo_circle.png`, `logo_grey.png`
- `smile.png`, `wave.png`, `rocket.png`, `fire.png`, `gem.png`
- `green_check.png`, `cross_emoji.png`
- `sand_clock.png`, `scale.png`
- `mail.png`, `football.png`
- `gallery1.jpg` até `gallery8.jpg` (fundos padrão)
- Logos de times: `atletico_guaratingueta.png`, `corinthians_paulista.png`, `gfc.png`

### Fontes (em `/public/football/fonts/`)

- **Host Grotesk**: Light, Regular, Medium, SemiBold, Bold, ExtraBold
- **Agharti**: RegularSemiCondensed, BoldSemiCondensed, BlackSemiCondensed

## 🚀 Como Usar

1. Acesse: `http://localhost:3000/chat-football`
2. Siga o fluxo conversacional
3. Selecione times, fundo, faça upload da foto
4. Gere a arte personalizada
5. Opte por premium ou download grátis

## 🔧 APIs Necessárias

- `POST /api/chat-image/generate` - Gera imagem final
- `POST /api/upload` - Upload de fotos
- `POST /api/backgrounds/generate` - Gera fundos dinâmicos (opcional)
- `POST /api/abacatepay/*` - Sistema de pagamento PIX (para premium)

## ✨ Features Especiais

### 1. Background Viewer Modal

Ao clicar no ícone de escala (🔍), abre modal fullscreen com:

- Imagem em tamanho grande
- Navegação com setas esquerda/direita
- Botão "quero esse fundo" no footer

### 2. Team Selector Modal

Modal fullscreen com:

- Campo de busca em tempo real
- Lista de times com logos
- Seleção visual com checkmark verde
- Botão confirmar no footer fixo

### 3. Geração de Fundos Dinâmicos

- Botão "Gerar mais 4 novos fundos"
- Contador de fundos gerados
- Integra com API de geração

### 4. Messages no Estilo Q&A

Mensagens do bot aparecem como:

```
┌─────────────────────────┐
│ 🟢 qual é o seu nome?   │ ← Balão verde com texto uppercase
│    15:00                │ ← Timestamp
└─────────────────────────┘
```

Respostas do usuário aparecem como:

```
┌─────────────────────┐
│  Pedro Silva        │ ← Box branco arredondado com sombra
└─────────────────────┘
```

## 🎯 Próximos Passos

- [ ] Implementar sistema de pagamento PIX completo
- [ ] Adicionar animações de transição
- [ ] Implementar geração de fundos com IA
- [ ] Otimizar para mobile (responsividade já está 90%)
- [ ] Adicionar testes E2E

## 📝 Notas Técnicas

- **CSS Customizado**: Não usa Tailwind, apenas CSS puro adaptado
- **Variáveis CSS**: Todas em `:root` para fácil customização
- **Fontes Next.js**: `next/font/google` + `next/font/local`
- **TypeScript**: 100% tipado
- **React Hooks**: useState, useEffect, useCallback
- **Client Components**: Todos os componentes são `"use client"`

## 🐛 Known Issues

- Fontes Agharti podem não carregar no primeiro render (usar fallback Arial)
- Modal de team selector pode ter scroll issues em iOS Safari
- Background viewer arrows podem ficar cortadas em telas pequenas

---

**Desenvolvido com base no football-website original**
**Mantém 100% da identidade visual e UX**
