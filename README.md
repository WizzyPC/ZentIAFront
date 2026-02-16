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

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon do Supabase |
| `VITE_API_BASE_URL` | URL base da API backend |

## Endpoints integrados

- `POST /api/v1/chat/complete` (autenticado com Bearer token)
- `GET /api/v1/system/health`
- `POST /api/v1/ingestion/source` (autenticado com Bearer token)

## Tabela Supabase recomendada para histórico

Crie a tabela `chat_sessions`:

- `id` (text/uuid, primary key)
- `user_id` (text)
- `title` (text)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)
- `mode` (text)
- `messages` (jsonb)

> O app usa sincronização com Supabase quando disponível e fallback local quando necessário.

## Deploy

### Vercel

- Build command: `npm run build`
- Output directory: `dist`
- `vercel.json` já configurado para fallback SPA.

### Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- `public/_redirects` já configurado para fallback SPA.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```
