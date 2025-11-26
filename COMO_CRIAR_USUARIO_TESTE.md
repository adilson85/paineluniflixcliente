# 🧪 Como Criar Usuário de Teste

Guia rápido para criar um cliente de teste no projeto.

---

## 📋 Passo 1: Instalar Dependências

```bash
npm install
```

Isso instalará o `tsx` necessário para executar scripts TypeScript.

---

## 📋 Passo 2: Configurar Variáveis de Ambiente

Você precisa de duas variáveis:

1. **`VITE_SUPABASE_URL`** - URL do seu projeto Supabase
2. **`SUPABASE_SERVICE_ROLE_KEY`** - Service Role Key (não a anon key!)

### Como obter a Service Role Key:

1. Acesse [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a **`service_role` key** (a chave secreta, não a `anon` key)

### Configurar no Windows PowerShell:

```powershell
$env:VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"
```

### Configurar no Linux/Mac:

```bash
export VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"
```

---

## 📋 Passo 3: Executar o Script

```bash
npm run test:create-user
```

Ou diretamente:

```bash
npx tsx scripts/create-test-user.ts
```

---

## ✅ O que será criado:

- ✅ **Usuário no Auth:**
  - Email: `teste@uniflix.com`
  - Senha: `Teste123!@#`

- ✅ **Perfil completo** com código de indicação

- ✅ **Assinatura ativa** (expira em 30 dias)

- ✅ **3 transações de exemplo:**
  - 2 recargas (mensal e trimestral)
  - 1 comissão de indicação

- ✅ **2 indicações de teste** com comissões

---

## 🔐 Credenciais de Login

Após executar o script, você pode fazer login com:

```
Email: teste@uniflix.com
Senha: Teste123!@#
```

Acesse: http://localhost:3050

---

## ⚠️ Avisos Importantes

- ⚠️ **NUNCA commite a Service Role Key** no Git
- ⚠️ **Use apenas em desenvolvimento** - não em produção
- ⚠️ Se o usuário já existir, o script atualiza os dados
- ⚠️ O script pode falhar se tabelas não existirem - adapte conforme necessário

---

## 🐛 Problemas Comuns

### "Variáveis de ambiente não configuradas"
- Verifique se as variáveis estão definidas
- No PowerShell: `$env:VITE_SUPABASE_URL`
- No Linux/Mac: `echo $VITE_SUPABASE_URL`

### "Usuário já existe"
- O script continua e atualiza os dados
- Para criar outro, altere o email no script

### "Tabela não existe"
- Verifique se todas as tabelas existem
- Consulte `ESTRUTURA_BANCO_DADOS.md`

---

## 🗑️ Limpar Dados de Teste

Para remover os dados criados, execute no Supabase SQL Editor:

```sql
-- Remover indicações
DELETE FROM referrals WHERE referrer_id IN (
  SELECT id FROM profiles WHERE full_name = 'Usuário de Teste'
);

-- Remover transações
DELETE FROM transactions WHERE user_id IN (
  SELECT id FROM profiles WHERE full_name = 'Usuário de Teste'
);

-- Remover assinatura
DELETE FROM user_subscriptions WHERE user_id IN (
  SELECT id FROM profiles WHERE full_name = 'Usuário de Teste'
);

-- Remover perfil
DELETE FROM profiles WHERE full_name = 'Usuário de Teste';

-- Remover do Auth (via Dashboard > Authentication > Users)
```

---

**Pronto! Agora você tem um usuário de teste completo para testar o projeto!** 🎉











