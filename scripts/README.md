# 📝 Scripts de Teste

Scripts auxiliares para testar e popular o projeto com dados de teste.

---

## 🧪 Criar Usuário de Teste

### Pré-requisitos

1. **Variáveis de ambiente:**
   - `VITE_SUPABASE_URL` - URL do seu projeto Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (não a anon key!)

   > ⚠️ **Importante:** A Service Role Key tem permissões administrativas.
   > Nunca exponha ela no frontend! Use apenas em scripts server-side.

### Como obter a Service Role Key

1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** > **API**
3. Copie a **`service_role` key** (não a `anon` key)

### Configurar variáveis

**Windows PowerShell:**
```powershell
$env:VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

**Linux/Mac:**
```bash
export VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key"
```

**Ou crie um arquivo `.env.local`:**
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### Executar o script

```bash
# Instalar dependências (se ainda não tiver)
npm install

# Executar script
npx tsx scripts/create-test-user.ts
```

### O que o script cria

✅ **Usuário no Auth:**
- Email: `teste@uniflix.com`
- Senha: `Teste123!@#`

✅ **Perfil completo:**
- Nome: "Usuário de Teste"
- Telefone: "(47) 99999-9999"
- Código de indicação único

✅ **Assinatura ativa:**
- Plano ativo (ou cria um plano de teste)
- Expira em 30 dias
- Credenciais de acesso

✅ **Transações de exemplo:**
- 2 recargas (mensal e trimestral)
- 1 comissão de indicação

✅ **Indicações de teste:**
- 2 usuários indicados fictícios
- Comissões calculadas

---

## 🔍 Verificar Dados Criados

Após executar o script, você pode:

1. **Fazer login** com:
   - Email: `teste@uniflix.com`
   - Senha: `Teste123!@#`

2. **Verificar no Supabase Dashboard:**
   - Tabela `profiles` - deve ter o usuário
   - Tabela `user_subscriptions` - deve ter assinatura ativa
   - Tabela `transactions` - deve ter 3 transações
   - Tabela `referrals` - deve ter 2 indicações

---

## 🗑️ Limpar Dados de Teste

Para remover os dados de teste:

```sql
-- No Supabase SQL Editor
DELETE FROM referrals WHERE referrer_id IN (
  SELECT id FROM profiles WHERE email = 'teste@uniflix.com'
);

DELETE FROM transactions WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'teste@uniflix.com'
);

DELETE FROM user_subscriptions WHERE user_id IN (
  SELECT id FROM profiles WHERE email = 'teste@uniflix.com'
);

DELETE FROM profiles WHERE email = 'teste@uniflix.com';

-- Remover do Auth (via Dashboard ou API)
```

---

## ⚠️ Avisos

- ⚠️ **Nunca commite a Service Role Key** no Git
- ⚠️ **Use apenas em desenvolvimento** - não em produção
- ⚠️ **O script pode falhar** se tabelas não existirem - adapte conforme necessário
- ⚠️ **Campos opcionais** podem não existir no seu banco - o script tenta adaptar

---

## 🐛 Troubleshooting

### Erro: "Variáveis de ambiente não configuradas"
- Verifique se `VITE_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão definidas
- Use `echo $VITE_SUPABASE_URL` (Linux/Mac) ou `$env:VITE_SUPABASE_URL` (PowerShell) para verificar

### Erro: "Usuário já existe"
- O script continua e atualiza os dados
- Para criar outro usuário, altere o email no script

### Erro: "Tabela não existe"
- Verifique se todas as tabelas existem no banco
- Consulte `ESTRUTURA_BANCO_DADOS.md` para ver tabelas necessárias

### Erro: "Campo não existe"
- O script tenta adaptar, mas pode falhar
- Verifique `src/lib/db-config.ts` e ajuste conforme necessário

---

## 📚 Próximos Passos

Após criar o usuário de teste:

1. ✅ Faça login na aplicação
2. ✅ Teste todas as funcionalidades
3. ✅ Verifique se os dados aparecem corretamente
4. ✅ Teste recarga, indicações, etc.

---

**Boa sorte com os testes!** 🚀











