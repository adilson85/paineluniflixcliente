# 🔍 Como Analisar a Estrutura do Banco de Dados

Agora você pode analisar a estrutura real do banco de dados do projeto **uniflix-adm** e comparar com o que o projeto Cliente Uniflix espera.

---

## 🚀 Executar Análise

```bash
npm run test:analyze-db
```

Este script irá:

1. ✅ Conectar ao Supabase usando as variáveis do `.env`
2. ✅ Verificar quais tabelas existem
3. ✅ Verificar quais campos cada tabela tem
4. ✅ Comparar com o esperado pelo projeto
5. ✅ Verificar funções RPC
6. ✅ Gerar relatório em `database-analysis.json`

---

## 📋 O que o script verifica

### Tabelas Esperadas:
- `profiles`
- `subscription_plans`
- `recharge_prices`
- `user_subscriptions`
- `transactions`
- `referrals`
- `raffles`
- `raffle_entries`

### Campos por Tabela:
O script verifica se todos os campos esperados existem e identifica:
- ✅ Campos que existem
- ⚠️ Campos faltando
- ℹ️ Campos extras (que o admin usa mas o cliente não precisa)

### Funções RPC:
- `generate_referral_code()` - Gera código de indicação

---

## 📊 Exemplo de Saída

```
🔍 Analisando estrutura do banco de dados...

📡 Conectado a: https://xxxxx.supabase.co

📋 VERIFICANDO TABELAS

✅ profiles
✅ subscription_plans
✅ recharge_prices
✅ user_subscriptions
✅ transactions
✅ referrals
✅ raffles
✅ raffle_entries

🔧 VERIFICANDO FUNÇÕES RPC

✅ generate_referral_code() - FUNCIONANDO
   Retornou: ABC123XY

📝 RESUMO

Tabelas encontradas: 8/8
✅ Estrutura do banco está compatível com o projeto!
```

---

## 🔧 Se Houver Diferenças

O script irá mostrar exatamente o que precisa ser adaptado:

```
⚠️  Campos faltando: campo_x, campo_y
   → Torne estes campos opcionais no código

ℹ️  Campos extras: campo_admin_1, campo_admin_2
   → Estes campos podem ser ignorados
```

Depois, ajuste `src/lib/db-config.ts` conforme as recomendações.

---

## 💾 Relatório Gerado

O script gera um arquivo `database-analysis.json` com:
- Estrutura completa encontrada
- Campos faltando/extras por tabela
- Resumo de compatibilidade

Use este relatório para documentar as diferenças e guiar as adaptações.

---

## 🎯 Próximos Passos

1. Execute `npm run test:analyze-db`
2. Revise o relatório gerado
3. Ajuste `src/lib/db-config.ts` se necessário
4. Teste o projeto com dados reais

---

**Agora você pode ver exatamente como está o banco do uniflix-adm!** 🎉











