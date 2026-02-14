# ZentIAFront

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
- Zustand (estado global)
- Axios

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
