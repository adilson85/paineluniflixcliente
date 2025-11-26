# 🧪 Teste Final - Sistema de Indicações

## ✅ Status Atual

Todas as correções foram implementadas e aplicadas com sucesso:

- ✅ Função RPC `generate_referral_code()` corrigida (verifica tabela `users`)
- ✅ Constraint UNIQUE adicionada em `users.referral_code`
- ✅ Fallback JavaScript com verificação de unicidade
- ✅ Interface aprimorada com botão WhatsApp
- ✅ Validação de CPF no cadastro

---

## 🎯 Plano de Teste Completo

### **1. Iniciar a Aplicação**

```bash
npm run dev
```

A aplicação será aberta em: **http://localhost:3050**

---

### **2. Criar ou Fazer Login com Usuário**

**Opção A: Login com usuário existente**
- Email e senha que você já tem

**Opção B: Criar novo usuário**
1. Clique em "Criar Conta"
2. Preencha os dados:
   - Nome Completo
   - Email
   - Telefone (opcional)
   - **CPF (opcional)** ← NOVO! Teste a validação
   - Senha
   - Código de indicação (opcional)
3. Clique em "Criar Conta"

**Teste da validação de CPF:**
- CPF válido: `123.456.789-09`
- CPF inválido: `111.111.111-11` (deve dar erro)

---

### **3. Verificar Dashboard - Programa de Indicações**

Após o login, role até a seção **"Programa de Indicações"**

**Você deve ver:**

```
┌─────────────────────────────────────────────┐
│ 🎁 Programa de Indicações                   │
│    Ganhe 10% de comissão nas recargas       │
├─────────────────────────────────────────────┤
│                                              │
│ [Total em Comissões]  [Total Indicados]     │
│    R$ 0,00                  0                │
│                                              │
│ [Assinantes]                                 │
│     0                                        │
│                                              │
├─────────────────────────────────────────────┤
│ Seu Link de Indicação                        │
│ Compartilhe este link para que pessoas       │
│ testem IPTV e ganhem R$ 10 de desconto...   │
│                                              │
│ [http://localhost:3050?ref=ABC123XY]         │
│ [Copiar] [WhatsApp] ← NOVO!                 │
├─────────────────────────────────────────────┤
│ Seu Código de Indicação                      │
│ As pessoas podem usar este código ao se      │
│ cadastrar para vincular a indicação...       │
│                                              │
│     ┌─────────────┐                          │
│     │  ABC123XY   │ ← Código único de 8 chars│
│     └─────────────┘                          │
└─────────────────────────────────────────────┘
```

---

### **4. Testar Link de Indicação**

#### **4.1 Copiar Link**
1. Clique no botão **"Copiar"**
2. Deve aparecer "Copiado!" por 2 segundos
3. Cole em um bloco de notas para ver:
   ```
   http://localhost:3050?ref=ABC123XY
   ```

#### **4.2 Compartilhar no WhatsApp**
1. Clique no botão **"WhatsApp"** (verde)
2. Deve abrir o WhatsApp Web/Desktop com a mensagem:
   ```
   🎁 *Ganhe R$ 10 de desconto!*

   Você foi indicado para testar IPTV da Uniflix com desconto!

   Clique no link abaixo para solicitar seu teste:
   http://localhost:3050?ref=ABC123XY

   Aproveite!
   ```
3. Você pode enviar para si mesmo ou cancelar

---

### **5. Testar Página de Cadastro via Indicação**

#### **5.1 Abrir Link em Aba Anônima**
1. Copie seu link de indicação
2. Abra uma **aba anônima** (Ctrl+Shift+N)
3. Cole o link: `http://localhost:3050?ref=ABC123XY`
4. Aperte Enter

#### **5.2 Verificar Página de Teste IPTV**
Você deve ver a página:

```
╔═══════════════════════════════════════════╗
║           🎁 Você recebeu um presente!    ║
║                                           ║
║   Você acaba de ganhar R$ 10 de desconto  ║
║        na sua primeira recarga            ║
╚═══════════════════════════════════════════╝

[Banner verde]
Você foi indicado por: João Silva
Código: ABC123XY

[Formulário]
- Nome Completo *
- E-mail *
- WhatsApp *
- Qual dispositivo deseja testar? *
  [ Selecione uma opção ▼ ]

[SOLICITAR TESTE IPTV]
```

#### **5.3 Preencher e Enviar**
1. Preencha todos os campos
2. Clique em "SOLICITAR TESTE IPTV"
3. Deve aparecer mensagem de sucesso:
   ```
   ✅ Solicitação Enviada!
   Você vai receber uma mensagem no WhatsApp...
   [Falar com o Suporte no WhatsApp]
   ```

---

### **6. Verificar Indicado no Dashboard**

1. Volte para a aba do dashboard (usuário logado)
2. Recarregue a página (F5)
3. Na seção "Programa de Indicações":
   - **Total Indicados** deve ter aumentado para 1
   - Clique em **"Total Indicados"** para ver detalhes
4. Deve aparecer modal com:
   ```
   ┌─────────────────────────────────────┐
   │ Meus Indicados                      │
   ├─────────────────────────────────────┤
   │ #1  Maria Silva                     │
   │     📞 (47) 99999-9999 [WhatsApp]  │
   │     📧 maria@email.com              │
   │     [Teste] ← Badge amarelo         │
   │     💳 Sem pagamentos registrados   │
   └─────────────────────────────────────┘
   ```

---

### **7. Testar Geração de Códigos Únicos**

#### **7.1 Criar Múltiplos Usuários**
Crie 3 novos usuários diferentes:

1. **Usuário 2:** `teste2@email.com`
2. **Usuário 3:** `teste3@email.com`
3. **Usuário 4:** `teste4@email.com`

Para cada um:
- Vá até o dashboard
- Anote o código de indicação

#### **7.2 Verificar Unicidade**
Execute no SQL Editor do Supabase:

```sql
SELECT
  full_name,
  email,
  referral_code,
  created_at
FROM users
WHERE referral_code IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
```

**Resultado esperado:**
- Todos os códigos devem ser **diferentes**
- Todos devem ter **8 caracteres** alfanuméricos

---

## 🔍 Checklist de Validação

Marque cada item após testar:

### Validação de CPF
- [ ] CPF com máscara automática (###.###.###-##)
- [ ] CPF válido é aceito
- [ ] CPF inválido mostra erro
- [ ] Campo é opcional (pode deixar vazio)

### Códigos de Indicação
- [ ] Cada usuário recebe código único de 8 caracteres
- [ ] Códigos são alfanuméricos (A-Z, 0-9)
- [ ] Nenhum código se repete (mesmo criando vários usuários)
- [ ] Função RPC `generate_referral_code()` está funcionando

### Interface do Link
- [ ] Link aparece no formato correto: `http://localhost:3050?ref=CODIGO`
- [ ] Botão "Copiar" funciona
- [ ] Botão "WhatsApp" abre com mensagem formatada
- [ ] Descrição clara está visível

### Página de Indicação
- [ ] Abre corretamente ao clicar no link
- [ ] Mostra nome do indicador (se logado)
- [ ] Mostra código de indicação
- [ ] Formulário funciona e salva dados
- [ ] Validação de WhatsApp funciona
- [ ] Mensagem de sucesso aparece

### Dashboard - Indicados
- [ ] Contadores atualizam corretamente
- [ ] Modal mostra lista de indicados
- [ ] Diferencia entre "Teste" e "Cadastrado"
- [ ] Botão WhatsApp funciona para cada indicado

---

## 🐛 Problemas Conhecidos

### ⚠️ Teste de Constraint UNIQUE falha
**Motivo:** Script de teste não tem permissões de admin
**Status:** ✅ Constraint foi adicionada com sucesso no banco
**Verificação:** Execute a query de verificação no SQL Editor

### ⚠️ Service Role Key não configurada
**Motivo:** `.env.local` não tem SUPABASE_SERVICE_ROLE_KEY
**Impacto:** Scripts de criação de usuário não funcionam
**Solução:** Criar usuários pela interface (preferível para testes)

---

## ✅ Próximos Passos (Opcional)

Se quiser melhorar ainda mais o sistema:

1. **Adicionar comissões automáticas**
   - Calcular 10% em cada recarga de indicado
   - Atualizar `total_commission` automaticamente

2. **Notificações**
   - Avisar quando alguém usa seu código
   - Email/WhatsApp quando receber comissão

3. **Estatísticas**
   - Gráfico de indicações por mês
   - Taxa de conversão (teste → assinante)

4. **Recuperação de senha**
   - Adicionar na tela de login
   - Email de reset usando Supabase Auth

---

## 📞 Suporte

Se encontrar algum problema:

1. Verifique os logs no console do navegador (F12)
2. Verifique se o Supabase local está rodando
3. Confira se as migrations foram aplicadas
4. Execute `npm run test:referral-codes` para validar

---

**Data:** 2025-01-21
**Status:** ✅ Pronto para Teste
**Versão:** 1.0
