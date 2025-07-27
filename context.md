# DEVHUB TRADER - CONTEXTO DO PROJETO

## 🎯 VISÃO GERAL

O **DevHub Trader** é uma plataforma completa de trading automatizado que combina análise avançada de backtest, criação de robôs de trading e uma comunidade de traders. O sistema é composto por um frontend React/TypeScript moderno e um backend Python/Flask robusto.

## 🏗️ ARQUITETURA DO SISTEMA

### Frontend (React/TypeScript)
- **Localização**: `project/src/`
- **Tecnologias**: React 18, TypeScript, Vite, Tailwind CSS
- **Estado**: Zustand para gerenciamento de estado
- **Roteamento**: React Router DOM
- **Charts**: Chart.js, Recharts
- **Editor**: Monaco Editor (VS Code)
- **Colaboração**: Y.js para edição colaborativa

### Backend (Python/Flask)
- **Localização**: `python-freela/`
- **Tecnologias**: Flask, Pandas, NumPy, OpenAI
- **Banco**: Supabase (PostgreSQL)
- **Processamento**: Cálculos avançados de trading
- **API**: RESTful endpoints

## 📊 MÓDULOS DE CÁLCULOS

### 1. Cálculos Básicos (`FunCalculos.py`)
**Métricas Fundamentais:**
- Lucro/Prejuízo (P&L)
- Win Rate (% de trades vencedores)
- Profit Factor (Lucro bruto / Prejuízo bruto)
- Payoff (Média ganhos / Média perdas)
- Total de Trades

**Métricas de Risco:**
- Drawdown Máximo
- Sharpe Ratio
- Recovery Factor
- Consecutive Wins/Losses

**Análises Temporais:**
- Performance por dia da semana
- Performance mensal
- Tempo no mercado

### 2. Cálculos Avançados (`FunMultiCalculos.py`)
- Processamento de múltiplos arquivos CSV
- Análise comparativa entre estratégias
- Consolidação de métricas
- Correlação entre diferentes abordagens

### 3. Análise de Correlação (`Correlacao.py`)
- Correlação por data e direção
- Análise de sincronização entre estratégias
- Identificação de padrões comportamentais

## 🤖 SISTEMA DE BACKTEST

### Engine (`project/backtest/engine.py`)
- Simulação de estratégias em dados históricos
- Gestão de capital e posições
- Cálculo de custos (comissões, slippage)
- Geração e processamento de sinais

### Métricas (`project/backtest/metrics.py`)
- Net Profit, Win Rate, Average Win/Loss
- Profit Factor, Max Drawdown, Sharpe Ratio
- Recovery Factor, Expectancy
- Análise por dia da semana e mês

## 🎨 INTERFACE WEB

### Páginas Principais
1. **BacktestAnalysisPage**: Análise completa de backtest
2. **StrategyAnalysisPage**: Análise de estratégias
3. **EditorPage**: Editor de código para robôs
4. **RobotsPage**: Gerenciamento de robôs
5. **AdminPanel**: Painel administrativo

### Componentes de Análise
- **MetricsDashboard**: Dashboard principal de métricas
- **EquityCurveSection**: Curva de equity interativa
- **TradesTable**: Tabela detalhada de trades
- **DailyAnalysisSection**: Análise temporal
- **EmotionalProfileSection**: Perfil emocional do trader
- **CorrelationSection**: Análise de correlação

## 🔧 API BACKEND

### Endpoints Principais
- `/api/tabela`: Análise básica de trades
- `/api/backtest-completo`: Backtest completo
- `/api/correlacao`: Análise de correlação
- `/api/trades`: Processamento de trades
- `/api/equity-curve`: Curva de equity
- `/chat`: Integração com IA (OpenAI)

### Funcionalidades Avançadas
- Processamento de CSV com encoding brasileiro
- Cálculos em tempo real
- Integração com IA para análises
- Gestão de estado com serialização customizada

## 🗄️ BANCO DE DADOS (Supabase)

### Tabelas Principais
- **robots**: Robôs de trading
- **robot_versions**: Versões dos robôs
- **shared_robots**: Robôs compartilhados
- **saved_analyses**: Análises salvas
- **user_profiles**: Perfis de usuários
- **subscriptions**: Planos de assinatura

## 🧠 ANÁLISE EMOCIONAL

### Índices de Disciplina
- **Stop Discipline Index**: Controle de stop loss
- **Daily Loss Discipline**: Gestão de perdas diárias
- **Leverage Discipline**: Controle de alavancagem
- **Fury Probability**: Probabilidade de "fúria trading"

### Perfil Emocional
- Análise de padrões comportamentais
- Identificação de pontos de melhoria
- Recomendações personalizadas

## 📈 VISUALIZAÇÕES

### Gráficos e Dashboards
- **Equity Curve**: Evolução do capital
- **Drawdown Chart**: Análise de quedas
- **Performance Charts**: Métricas de performance
- **Correlation Matrix**: Matriz de correlação
- **Daily Analysis**: Análise temporal

## 🔄 FLUXO DE DADOS

### Processamento de CSV
1. Upload de arquivo CSV
2. Processamento com encoding brasileiro
3. Cálculos de métricas
4. Geração de visualizações
5. Exibição no frontend

### Backtest Completo
1. Definição de estratégia
2. Simulação em dados históricos
3. Cálculo de métricas
4. Geração de relatórios
5. Análise de performance

### Análise Comparativa
1. Upload de múltiplos arquivos
2. Processamento individual
3. Análise de correlação
4. Comparação de métricas
5. Dashboard consolidado

## 🎯 OBJETIVOS DO SISTEMA

### Análise Profunda
- Métricas completas de performance
- Análise de risco detalhada
- Identificação de padrões

### Comparação de Estratégias
- Análise lado a lado
- Correlação entre abordagens
- Otimização de estratégias

### Gestão de Risco
- Controle de drawdown
- Análise de disciplina
- Recomendações de melhoria

### Automação
- Criação de robôs de trading
- Backtesting automatizado
- Execução de estratégias

### Comunidade
- Compartilhamento de estratégias
- Análises colaborativas
- Aprendizado coletivo

### IA Integrada
- Análises inteligentes
- Recomendações personalizadas
- Chat assistente

## 🛠️ TECNOLOGIAS UTILIZADAS

### Frontend
- React 18.3.1
- TypeScript 5.5.3
- Vite 5.4.2
- Tailwind CSS 3.4.1
- Zustand 4.5.1
- Chart.js 4.4.9
- Monaco Editor 4.6.0

### Backend
- Python 3.12
- Flask 3.1.1
- Pandas 2.3.0
- NumPy 2.3.0
- OpenAI 1.88.0
- Supabase 2.39.7

### Banco de Dados
- PostgreSQL (via Supabase)
- Migrations automáticas
- Real-time subscriptions

## 📁 ESTRUTURA DE ARQUIVOS

```
home-devhub-trader/
├── project/                 # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── stores/        # Gerenciamento de estado
│   │   ├── services/      # Serviços
│   │   └── lib/          # Bibliotecas
│   ├── backtest/          # Sistema de backtest
│   └── supabase/         # Migrations do banco
└── python-freela/         # Backend Python/Flask
    ├── FunCalculos.py     # Cálculos básicos
    ├── FunMultiCalculos.py # Cálculos avançados
    ├── Correlacao.py      # Análise de correlação
    └── main.py           # API Flask
```

## 🎨 DESIGN SYSTEM

### Cores e Temas
- Design moderno e profissional
- Interface intuitiva para traders
- Responsividade completa
- Acessibilidade

### Componentes
- Dashboards interativos
- Tabelas com filtros
- Gráficos responsivos
- Modais e overlays
- Formulários avançados

## 🔒 SEGURANÇA

### Autenticação
- Supabase Auth
- JWT tokens
- Controle de sessão

### Autorização
- Planos de assinatura
- Limites por usuário
- Controle de acesso

### Dados
- Validação de entrada
- Sanitização de dados
- Logs de erro

## 📊 MÉTRICAS E KPIs

### Performance de Trading
- Net Profit
- Win Rate
- Profit Factor
- Sharpe Ratio
- Max Drawdown

### Engajamento
- Usuários ativos
- Análises realizadas
- Robôs criados
- Tempo de sessão

### Qualidade
- Taxa de erro
- Tempo de resposta
- Disponibilidade
- Satisfação do usuário

Este contexto fornece uma visão completa e detalhada do sistema DevHub Trader, permitindo entender sua arquitetura, funcionalidades e objetivos. 