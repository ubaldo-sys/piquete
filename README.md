# Piquete Tropeiros da Lealdade — Sistema de Mensalidades

Sistema de gerenciamento de mensalidades construído com React + Vite + Supabase, hospedado no Firebase Hosting.

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Estilo**: Tailwind CSS 4 + Framer Motion
- **Banco de dados**: Supabase (PostgreSQL)
- **Hospedagem**: Firebase Hosting

## Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta no [Firebase](https://console.firebase.google.com)

## Configuração local

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher variáveis de ambiente
cp .env.example .env

# 3. Rodar localmente
npm run dev
```

## Deploy

```bash
npm run build
firebase login
firebase deploy
```

## Schema do banco

Execute o arquivo `supabase-schema.sql` no SQL Editor do Supabase.

## Login padrão

- Usuário: `admin`
- Senha: `admin@tropeiros`

> ⚠️ Troque a senha diretamente em `src/App.tsx` antes de colocar em produção.
