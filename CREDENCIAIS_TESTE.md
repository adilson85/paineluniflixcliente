# 🔐 Credenciais de Teste - Cliente Uniflix

Este documento contém as credenciais de login disponíveis no banco de dados local para testes.

## 👤 Usuários Disponíveis

### 1. Cliente de Teste
**Email:** `teste@uniflix.com`  
**Senha:** `Teste123!@#`  
**Nome:** Cliente Teste Elite  
**ID:** `11111111-1111-1111-1111-111111111111`

Este é o usuário de teste padrão criado pelo script `create-test-user.ts`.

---

### 2. Administrador
**Email:** `admin@uniflix.com`  
**Senha:** *(verificar no banco ou criar nova senha)*  
**Nome:** Administrador Principal  
**ID:** `06394229-9ab1-4f2e-96e7-e0f0b4990503`

---

## 🚀 Como Fazer Login

1. Acesse a aplicação: `http://localhost:5173` (ou a porta configurada no Vite)
2. Use as credenciais acima
3. Faça login normalmente

## 📝 Criar Novo Usuário de Teste

Se precisar criar um novo usuário de teste, execute:

```bash
npm run test:create-user
```

Ou diretamente:

```bash
npx tsx scripts/create-test-user.ts
```

Isso criará um usuário com:
- Email: `teste@uniflix.com`
- Senha: `Teste123!@#`
- Perfil completo
- Assinatura ativa (se houver planos no banco)
- Transações de exemplo
- Indicações de teste

## ⚠️ Importante

- Essas credenciais são apenas para **desenvolvimento local**
- **NUNCA** use essas credenciais em produção
- Se precisar resetar a senha, use o Supabase Studio local: http://localhost:54330

## 🔍 Verificar Usuários no Banco

Para ver todos os usuários no banco:

```sql
SELECT id, email, full_name, referral_code 
FROM users;
```

Para ver usuários no Auth:

```sql
SELECT id, email 
FROM auth.users;
```











