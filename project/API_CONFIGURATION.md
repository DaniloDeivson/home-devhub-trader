# Configuração da API para Desenvolvimento Local

## Visão Geral

Este projeto foi configurado para alternar automaticamente entre o backend local (porta 5002) e o backend de produção, dependendo do ambiente de execução.

## Como Funciona

### Detecção Automática do Ambiente

A configuração está localizada em `src/config/api.ts` e detecta automaticamente se está em modo de desenvolvimento:

```typescript
const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEV_MODE === 'true';
```

### URLs Configuradas

- **Desenvolvimento**: `http://localhost:5002`
- **Produção**: `https://api.devhubtrader.com.br`

## Como Usar

### 1. Desenvolvimento Local

Para trabalhar com o backend local na porta 5002:

1. **Inicie o backend:**
   ```bash
   # Windows
   cd python-freela
   start_backend.bat
   
   # Linux/Mac
   cd python-freela
   chmod +x start_backend.sh
   ./start_backend.sh
   
   # Ou diretamente com Python
   cd python-freela
   python start_server.py
   ```

2. **Execute o frontend em modo de desenvolvimento:**
   ```bash
   cd project
   npm run dev
   ```

3. **Verifique se ambos estão rodando:**
   - Backend: http://localhost:5002
   - Frontend: http://localhost:5173 (ou a porta que o Vite mostrar)

### 2. Chamadas de API

Use a função `buildApiUrl()` para todas as chamadas de API:

```typescript
import { buildApiUrl } from '../config/api';

// Exemplo de uso
const response = await fetch(buildApiUrl('/api/tabela'), {
  method: 'POST',
  body: formData,
});
```

### 3. Verificação da Configuração

Em modo de desenvolvimento, você verá no console do navegador:

```
🔧 API Config: {
  environment: 'development',
  baseUrl: 'http://localhost:5002',
  endpoints: {
    tabela: 'http://localhost:5002/api/tabela',
    correlacao: 'http://localhost:5002/api/correlacao',
    trades: 'http://localhost:5002/api/trades',
    disciplina: 'http://localhost:5002/api/disciplina-completa',
    chat: 'http://localhost:5002/chat'
  }
}
```

## Arquivos Atualizados

Os seguintes arquivos foram atualizados para usar a configuração dinâmica:

- `src/pages/BacktestAnalysisPage.tsx`
- `src/components/Metrics.tsx`
- `src/components/ShareModal.tsx`

## Troubleshooting

### Problema: API não está respondendo
1. Verifique se o backend está rodando na porta 5002
2. Verifique se não há conflitos de CORS
3. Verifique o console do navegador para logs de erro

### Problema: URLs ainda apontando para produção
1. Verifique se `import.meta.env.DEV` está retornando `true`
2. Verifique se não há cache do navegador
3. Reinicie o servidor de desenvolvimento

## Configuração de CORS

O backend local deve estar configurado para aceitar requisições de:
- `http://localhost:4173` (Vite dev server)
- `http://localhost:5173` (Vite dev server - porta padrão)
- `http://localhost:3000` (alternativo)

### Resolvendo Problemas de CORS

Se você encontrar erros de CORS como:
```
Access to fetch at 'http://localhost:5002/api/tabela' from origin 'http://localhost:5173' has been blocked by CORS policy
```

1. **Verifique se o backend está rodando:**
   ```bash
   cd python-freela
   python run_backend.py
   ```

2. **Verifique se a porta 5002 está livre:**
   ```bash
   # Windows
   netstat -ano | findstr :5002
   
   # Linux/Mac
   lsof -i :5002
   ```

3. **Reinicie o backend se necessário:**
   ```bash
   cd python-freela
   python run_backend.py
   ```

4. **Verifique os logs do backend** para confirmar que está aceitando requisições da porta correta.

## Notas Importantes

- Todas as chamadas de API agora usam `buildApiUrl()` em vez de URLs hardcoded
- O modo de desenvolvimento é detectado automaticamente
- URLs de compartilhamento também são configuradas dinamicamente
- Logs de debug são exibidos apenas em desenvolvimento 