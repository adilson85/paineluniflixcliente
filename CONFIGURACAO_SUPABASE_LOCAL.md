# 🔧 Configuração do Supabase Local

Este projeto foi adaptado para usar o Supabase local rodando em Docker Compose.

## 📋 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# URL do Supabase Local (Kong API Gateway)
VITE_SUPABASE_URL=http://localhost:54328

# Chave Anon do Supabase Local (padrão para desenvolvimento)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service Role Key (apenas para scripts server-side)
# Obtenha esta chave do Supabase Studio local em http://localhost:54330
# Settings > API > service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 🔄 Adaptações Realizadas

O projeto foi adaptado para usar a estrutura real do banco de dados:

### Tabelas Mapeadas:
- `profiles` → `users` (tabela real)
- `user_subscriptions` → `subscriptions` (tabela real)
- `recharge_prices` → `recharge_options` (tabela real)

### Campos Adaptados:
- `recharge_options`: `duration_months` convertido para `duration_days` (multiplicado por 30)
- `recharge_options`: `display_name` mapeado para `period_label`
- `subscriptions`: campos adicionais como `panel_name`, `monthly_value`, `mac_address`, `device_key`
- `users`: campos adicionais como `cpf`, `email`, `data_nascimento`, `id_botconversa`

## 🚀 Como Usar

1. **Certifique-se de que o Supabase local está rodando:**
   ```bash
   docker ps | grep supabase
   ```

2. **Crie o arquivo `.env.local`** com as variáveis acima

3. **Inicie o projeto:**
   ```bash
   npm run dev
   ```

4. **Acesse o Supabase Studio local:**
   - URL: http://localhost:54330
   - Use para visualizar e gerenciar o banco de dados

## 📊 Estrutura do Banco

### Tabelas Principais:
- `users` - Perfis de usuários
- `subscriptions` - Assinaturas ativas
- `subscription_plans` - Planos disponíveis
- `recharge_options` - Opções de recarga
- `transactions` - Transações financeiras
- `referrals` - Sistema de indicações
- `raffles` - Sorteios mensais
- `raffle_entries` - Entradas nos sorteios

## ⚠️ Notas Importantes

- As chaves padrão do Supabase local são públicas e conhecidas, use apenas em desenvolvimento
- Para produção, use um projeto Supabase real com chaves seguras
- O projeto mantém compatibilidade com os nomes antigos através de aliases no `database.types.ts`











