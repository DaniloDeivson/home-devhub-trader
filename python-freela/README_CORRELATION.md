# Análise de Correlação - Suporte para Múltiplos Arquivos

## 🚀 Novas Funcionalidades

### ✅ Suporte para 3+ Arquivos CSV
- **Análise por Pares**: Para 2 arquivos (funcionalidade original)
- **Análise Matricial**: Para 3+ arquivos (nova funcionalidade)

### 📊 Tipos de Análise

#### 1. Análise por Data e Direção
- Compara operações na mesma data e mesma direção (compra/venda)
- Identifica quando estratégias operam simultaneamente
- Calcula correlação de resultados

#### 2. Análise por Data e Resultado
- Responde: "Quando uma estratégia perde, a outra também perde?"
- Analisa correlação diária de resultados
- Fornece estatísticas de diversificação

#### 3. Análise Matricial (3+ arquivos)
- Compara todos os pares possíveis de estratégias
- Calcula estatísticas agregadas
- Fornece recomendação de portfólio

## 🔧 Como Usar

### 1. Iniciar o Servidor
```bash
cd /home/python-freela
source venv_new/bin/activate
python start_server.py
```

### 2. Testar com 2 Arquivos
```bash
curl -X POST \
  -F "files=@arquivo1.csv" \
  -F "files=@arquivo2.csv" \
  http://localhost:5002/api/correlacao
```

### 3. Testar com 3+ Arquivos
```bash
curl -X POST \
  -F "files=@arquivo1.csv" \
  -F "files=@arquivo2.csv" \
  -F "files=@arquivo3.csv" \
  http://localhost:5002/api/correlacao
```

### 4. Executar Testes Automatizados
```bash
python test_correlation_multiple.py
```

## 📈 Resposta da API

### Para 2 Arquivos
```json
{
  "correlacao_data_direcao": {
    "resumo": {
      "total_operacoes_simultaneas": 45,
      "todas_ganharam_simultaneo": 20,
      "todas_perderam_simultaneo": 15,
      "resultados_mistos": 10,
      "pct_correlacao_positiva": 44.4,
      "pct_correlacao_negativa": 33.3,
      "pct_diversificacao": 22.2
    }
  },
  "correlacao_data_resultado": {
    "resumo": {
      "total_dias_analisados": 30,
      "dias_todas_ganharam": 12,
      "dias_todas_perderam": 8,
      "dias_resultados_mistos": 10,
      "resposta_pergunta": {
        "quando_uma_perde_outra_tambem_perde_pct": 26.7,
        "quando_uma_ganha_outra_tambem_ganha_pct": 40.0,
        "dias_com_diversificacao_pct": 33.3
      },
      "interpretacao": "Correlação moderada"
    }
  },
  "correlacao_matricial": {
    "info": "Análise matricial disponível apenas para 3+ arquivos"
  },
  "info_arquivos": {
    "total_arquivos": 2,
    "nomes_arquivos": ["estrategia_a", "estrategia_b"],
    "tipo_analise": "pares"
  }
}
```

### Para 3+ Arquivos
```json
{
  "correlacao_data_direcao": { /* ... */ },
  "correlacao_data_resultado": { /* ... */ },
  "correlacao_matricial": {
    "resumo": {
      "total_pares_analisados": 3,
      "pares_alta_correlacao": 1,
      "pares_boa_diversificacao": 1,
      "pares_correlacao_moderada": 1,
      "pct_alta_correlacao": 33.3,
      "pct_boa_diversificacao": 33.3,
      "pct_correlacao_moderada": 33.3,
      "recomendacao": "Portfólio com correlação moderada"
    },
    "detalhes": [
      {
        "par": ["estrategia_a", "estrategia_b"],
        "correlacao_direcao": { /* ... */ },
        "correlacao_resultado": { /* ... */ }
      }
    ]
  },
  "info_arquivos": {
    "total_arquivos": 3,
    "nomes_arquivos": ["estrategia_a", "estrategia_b", "estrategia_c"],
    "tipo_analise": "matricial"
  }
}
```

## 🎯 Interpretação dos Resultados

### Correlação por Data e Direção
- **Alta correlação positiva**: Estratégias tendem a ganhar/perder juntas
- **Alta correlação negativa**: Estratégias tendem a se complementar
- **Diversificação**: Resultados mistos indicam boa diversificação

### Análise Matricial (3+ arquivos)
- **Portfólio bem diversificado**: Maioria dos pares com boa diversificação
- **Portfólio com alta correlação**: Maioria dos pares com alta correlação
- **Portfólio com correlação moderada**: Distribuição equilibrada

## 🔍 Melhorias Implementadas

1. **Suporte para múltiplos arquivos**: 3+ arquivos CSV
2. **Análise matricial**: Comparação de todos os pares possíveis
3. **Estatísticas agregadas**: Resumo geral do portfólio
4. **Recomendações**: Sugestões baseadas na análise
5. **Melhor tratamento de erros**: Validação robusta
6. **Informações detalhadas**: Metadados sobre o processamento

## 🧪 Testes

Execute o script de teste para verificar a funcionalidade:

```bash
python test_correlation_multiple.py
```

Este script irá:
- Criar arquivos CSV de teste
- Testar com 2 arquivos
- Testar com 3 arquivos
- Verificar a análise matricial
- Limpar arquivos de teste

## 🚀 Próximos Passos

1. **Integração com Frontend**: Atualizar interface para suportar 3+ arquivos
2. **Visualizações**: Gráficos de correlação matricial
3. **Otimização**: Melhorar performance para muitos arquivos
4. **Relatórios**: Exportar análises em PDF/Excel 