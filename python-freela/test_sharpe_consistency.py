import pandas as pd
import numpy as np
from FunCalculos import calcular_performance, calcular_metrics, calcular_day_of_week

# Dados de teste (baseado nos logs do usuário)
trades_data = [
    {'entry_date': '2024-07-26T11:46:00', 'exit_date': '2024-07-26T13:52:00', 'pnl': 0, 'direction': 'long'},
    {'entry_date': '2024-08-01T11:00:00', 'exit_date': '2024-08-01T11:28:00', 'pnl': -4265, 'direction': 'short'},
    {'entry_date': '2024-08-02T10:12:00', 'exit_date': '2024-08-02T10:30:00', 'pnl': -5300, 'direction': 'short'},
    {'entry_date': '2024-08-06T12:36:00', 'exit_date': '2024-08-06T13:20:00', 'pnl': -4385, 'direction': 'short'},
    {'entry_date': '2024-08-08T10:54:00', 'exit_date': '2024-08-08T13:08:00', 'pnl': -7915, 'direction': 'short'},
    {'entry_date': '2024-08-09T09:46:00', 'exit_date': '2024-08-09T10:36:00', 'pnl': -2880, 'direction': 'short'},
    {'entry_date': '2024-08-12T11:36:00', 'exit_date': '2024-08-12T11:46:00', 'pnl': -2515, 'direction': 'short'},
    {'entry_date': '2024-08-19T11:38:00', 'exit_date': '2024-08-19T12:22:00', 'pnl': -1820, 'direction': 'short'},
    {'entry_date': '2024-08-19T12:52:00', 'exit_date': '2024-08-19T13:18:00', 'pnl': -1655, 'direction': 'short'},
    {'entry_date': '2024-08-20T11:42:00', 'exit_date': '2024-08-20T11:58:00', 'pnl': 80, 'direction': 'long'},
    {'entry_date': '2024-08-22T09:56:00', 'exit_date': '2024-08-22T11:20:00', 'pnl': -65, 'direction': 'long'},
    {'entry_date': '2024-08-22T11:24:00', 'exit_date': '2024-08-22T11:30:00', 'pnl': 80, 'direction': 'long'},
    {'entry_date': '2024-08-23T11:04:00', 'exit_date': '2024-08-23T11:28:00', 'pnl': -3105, 'direction': 'short'},
    {'entry_date': '2024-08-29T09:52:00', 'exit_date': '2024-08-29T10:26:00', 'pnl': -500, 'direction': 'long'},
    {'entry_date': '2024-09-03T12:50:00', 'exit_date': '2024-09-03T13:02:00', 'pnl': 80, 'direction': 'long'}
]

print("=== TESTE CONSISTÊNCIA SHARPE RATIO ===")
print(f"Dados de teste: {len(trades_data)} trades")

# Criar DataFrame
df = pd.DataFrame(trades_data)
df['entry_date'] = pd.to_datetime(df['entry_date'])
df['exit_date'] = pd.to_datetime(df['exit_date'])
df['pnl'] = pd.to_numeric(df['pnl'], errors='coerce')

print("\nDataFrame criado:")
print(df.head())

# Teste 1: calcular_performance (usado nas métricas principais)
print("\n=== TESTE 1: calcular_performance ===")
performance_result = calcular_performance(df, cdi=0.12)
sharpe_performance = performance_result.get("Sharpe Ratio", 0)
print(f"Sharpe Ratio (calcular_performance): {sharpe_performance}")

# Teste 2: calcular_metrics (usado na análise diária)
print("\n=== TESTE 2: calcular_metrics ===")
lucro, pf, sharpe_metrics, sharpe_simp, trades = calcular_metrics(df, cdi=0.12)
print(f"Sharpe Ratio (calcular_metrics): {sharpe_metrics}")

# Teste 3: calcular_day_of_week (usado na análise diária)
print("\n=== TESTE 3: calcular_day_of_week ===")
day_of_week_result = calcular_day_of_week(df, cdi=0.12)
print("Sharpe Ratios por dia da semana:")
for day, stats in day_of_week_result.get("Stats", {}).items():
    if stats["Trades"] > 0:
        print(f"  {day}: {stats['Sharpe Ratio']}")

# Verificar se há diferenças
print(f"\n=== COMPARAÇÃO ===")
print(f"calcular_performance: {sharpe_performance}")
print(f"calcular_metrics: {sharpe_metrics}")
print(f"Diferencia: {abs(sharpe_performance - sharpe_metrics)}")

if abs(sharpe_performance - sharpe_metrics) < 0.0001:
    print("✅ Sharpe Ratios são consistentes!")
else:
    print("❌ Sharpe Ratios são diferentes!")

# Verificar os valores intermediários
print(f"\n=== VALORES INTERMEDIÁRIOS ===")
pnl_values = df['pnl'].values
mean_return = np.mean(pnl_values)
std_return = np.std(pnl_values, ddof=1)
cdi = 0.12

print(f"PnL values: {pnl_values}")
print(f"Mean return: {mean_return}")
print(f"Std return: {std_return}")
print(f"CDI: {cdi}")
print(f"Sharpe calculation: ({mean_return} - {cdi}) / {std_return} = {(mean_return - cdi) / std_return if std_return != 0 else 0}") 