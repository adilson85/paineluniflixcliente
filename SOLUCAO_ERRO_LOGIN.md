# 🔧 Solução para Erro 400 no Login

## ❌ Erro Encontrado

```
POST http://127.0.0.1:54328/auth/v1/token?grant_type=password 400 (Bad Request)
```

## ✅ Soluções Aplicadas

### 1. Arquivo `.env.local` Criado

O arquivo `.env.local` foi criado com as configurações corretas:

```env
VITE_SUPABASE_URL=http://localhost:54328
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

### 2. Reiniciar o Servidor

**IMPORTANTE:** Após criar/modificar o `.env.local`, você precisa **reiniciar o servidor Vite** para que as variáveis de ambiente sejam carregadas.

1. Pare o servidor (Ctrl + C)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

## 🔍 Possíveis Causas do Erro 400

### Causa 1: Variáveis de Ambiente Não Carregadas
- ✅ **Resolvido:** Arquivo `.env.local` criado
- ⚠️ **Ação necessária:** Reiniciar o servidor

### Causa 2: Usuário Sem Senha no Auth
Se o usuário foi criado diretamente no banco sem passar pelo Auth do Supabase, pode não ter senha configurada.

**Solução:** Recriar o usuário usando o script:

```bash
npm run test:create-user
```

Ou criar manualmente via Supabase Studio:
1. Acesse: http://localhost:54330
2. Vá em Authentication > Users
3. Crie um novo usuário ou resete a senha

### Causa 3: URL Incorreta
O erro mostra `http://127.0.0.1:54328` mas a configuração usa `localhost:54328`. Isso pode ser normal (são equivalentes), mas se persistir, tente:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54328
```

## 🧪 Testar Login

**Credenciais de Teste:**
- Email: `teste@uniflix.com`
- Senha: `Teste123!@#`

## 📝 Verificar Configuração

Para verificar se as variáveis estão sendo carregadas, adicione temporariamente no `src/lib/supabase.ts`:

```typescript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
```

## ⚠️ Nota Importante

O Vite só carrega variáveis de ambiente que começam com `VITE_`. Certifique-se de que:
- ✅ O arquivo se chama `.env.local` (não `.env`)
- ✅ As variáveis começam com `VITE_`
- ✅ O servidor foi reiniciado após criar/modificar o arquivo










