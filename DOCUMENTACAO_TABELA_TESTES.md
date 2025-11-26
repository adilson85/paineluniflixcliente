# 📋 Documentação - Tabela `testes_liberados`

## 📊 Onde os dados são salvos

Os dados do formulário de solicitação de teste IPTV são salvos na tabela **`testes_liberados`** do Supabase.

## 🗄️ Estrutura da Tabela

### Campos da Tabela `testes_liberados`:

| Campo | Tipo | Descrição | Preenchido pelo Formulário |
|-------|------|-----------|---------------------------|
| `id` | UUID | ID único (gerado automaticamente) | ✅ Automático |
| `nome` | TEXT | Nome completo do solicitante | ✅ Campo "Nome Completo" |
| `telefone` | TEXT | WhatsApp do solicitante | ✅ Campo "WhatsApp" |
| `email` | TEXT | E-mail do solicitante | ✅ Campo "E-mail" |
| `dispositivo` | TEXT | Dispositivo selecionado | ✅ "Dispositivo" + campo condicional |
| `aplicativo` | TEXT | Aplicativo (será informado via WhatsApp) | ❌ `null` inicialmente |
| `referral_code` | VARCHAR(50) | Código de indicação usado | ✅ Código do link |
| `data_teste` | DATE | Data da solicitação | ✅ Data atual |
| `assinante` | BOOLEAN | Se já é assinante | ✅ `false` (inicial) |
| `valor_pago` | NUMERIC | Valor pago | ✅ `0` (inicial) |
| `quantidade_teste` | INTEGER | Quantidade de testes | ✅ `1` (inicial) |
| `id_botconversa` | NUMERIC | ID do bot do indicador | ✅ ID do indicador (pode ser `null`) |
| `usuario1` | TEXT | Usuário do teste (preenchido depois) | ❌ Preenchido pelo admin |
| `senha1` | TEXT | Senha do teste (preenchido depois) | ❌ Preenchido pelo admin |
| `painel1` | TEXT | Painel do teste (preenchido depois) | ❌ Preenchido pelo admin |
| `created_at` | TIMESTAMP | Data de criação | ✅ Automático |
| `updated_at` | TIMESTAMP | Data de atualização | ✅ Automático |

## 📝 Mapeamento dos Campos do Formulário

### Campos Preenchidos Automaticamente:

```typescript
{
  nome: fullName,                    // "Nome Completo"
  telefone: whatsapp,                // "WhatsApp"
  email: email,                      // "E-mail"
  dispositivo: `${device} ${deviceDetail}`, // Ex: "TV Smart Samsung" ou "Chrome Cast 3ª geração"
  aplicativo: null,                  // Será informado via WhatsApp
  referral_code: referralCode,      // Código de indicação usado
  data_teste: new Date().toISOString().split('T')[0], // Data atual
  assinante: false,                  // Ainda não é assinante
  valor_pago: 0,                      // Ainda não pagou
  quantidade_teste: 1,               // Primeiro teste
  id_botconversa: referrerIdBotconversa || null, // ID do bot do indicador (pode ser null)
}
```

### Exemplo de Dados Salvos:

```json
{
  "id": "uuid-gerado-automaticamente",
  "nome": "João Silva",
  "telefone": "(11) 99999-9999",
  "email": "joao@email.com",
  "dispositivo": "TV Smart Samsung",
  "aplicativo": null,
  "referral_code": "TESTE001",
  "data_teste": "2024-01-15",
  "assinante": false,
  "valor_pago": 0,
  "quantidade_teste": 1,
  "id_botconversa": null,
  "usuario1": null,
  "senha1": null,
  "painel1": null,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

## 🔍 Como Consultar os Dados

### SQL para ver todas as solicitações:

```sql
SELECT 
  id,
  nome,
  telefone,
  aplicativo,
  data_teste,
  assinante,
  created_at
FROM testes_liberados
ORDER BY created_at DESC;
```

### SQL para ver solicitações de um indicador específico:

```sql
SELECT 
  t.*,
  u.full_name as indicador_nome,
  u.referral_code as codigo_indicacao
FROM testes_liberados t
LEFT JOIN users u ON t.id_botconversa = u.id_botconversa
WHERE u.referral_code = 'TESTE001'
ORDER BY t.created_at DESC;
```

## 🔄 Fluxo Completo

1. **Usuário acessa:** `http://localhost:3050?ref=TESTE001`
2. **Preenche formulário:** Nome, WhatsApp, Dispositivo
3. **Sistema salva em:** `testes_liberados`
4. **Admin pode:**
   - Ver todas as solicitações
   - Preencher `usuario1`, `senha1`, `painel1`
   - Atualizar `assinante` quando virar cliente
   - Atualizar `valor_pago` quando pagar

## 📌 Notas Importantes

- A tabela `testes_liberados` já existe no banco de dados
- Os campos `usuario1`, `senha1`, `painel1` são preenchidos pelo admin depois
- O campo `id_botconversa` vincula a solicitação ao indicador
- O campo `aplicativo` armazena o dispositivo e detalhes (ex: "TV Smart - Samsung")

