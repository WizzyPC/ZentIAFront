# ZentIAFront

Frontend profissional da **Zent IA** com autenticação real via Supabase e chat integrado ao backend.

## Principais melhorias

- ✅ Autenticação real com **Supabase Auth** (`email + senha`, sessão persistida e logout real).
- ✅ Proteção real de rotas baseada em sessão Supabase.
- ✅ `Authorization: Bearer <access_token>` nas rotas protegidas da API.
- ✅ Chat com histórico por usuário + sincronização com Supabase (fallback local).
- ✅ Efeito de resposta progressiva (streaming visual digitando).
- ✅ Feedback em respostas da IA (👍 👎).
- ✅ Melhorias visuais: avatars, contraste, espaçamento e navegação consistente.
- ✅ Página de conta com botão **Voltar para chats** + configurações básicas.
Frontend completo da **Zent IA** com React + TypeScript + Tailwind + Vite.

## Funcionalidades

- Login local de usuário (persistido no navegador).
- Chat principal com mensagens de usuário/IA.
- Histórico de chats e botão **Novo Chat**.
- Indicador de digitação enquanto a IA responde.
- Renderização de respostas em Markdown (incluindo blocos de código).
- Painel de conta (perfil + plano).
- Envio de fonte para ingestão via `/api/v1/ingestion/source`.
- Health check da API via `/api/v1/system/health`.
- Tratamento amigável para erros de rede/API.
- Layout responsivo (sidebar móvel + desktop).

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- Supabase JS
- Axios
- React Markdown + Syntax Highlighter

## Configuração

```bash
cp .env.example .env
npm install
npm run dev
```

A aplicação roda em `http://localhost:5173` por padrão.

## Variáveis de ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `VITE_API_BASE_URL` | URL base da API backend | `https://zentia.onrender.com` |

## Endpoints integrados

- `POST /api/v1/chat/complete`
- `GET /api/v1/system/health`
- `POST /api/v1/ingestion/source`

## Deploy

### Vercel

- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` já configurado para fallback SPA.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- `public/_redirects` já configurado para fallback SPA.
- `vercel.json` já configurado para SPA fallback.
- Build command: `npm run build`
- Output directory: `dist`

### Netlify

- Arquivo `public/_redirects` incluído para SPA fallback.
- Build command: `npm run build`
- Publish directory: `dist`

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
