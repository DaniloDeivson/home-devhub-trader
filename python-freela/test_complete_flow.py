import pandas as pd
import numpy as np
from FunCalculos import processar_backtest_completo, calcular_performance

# Simular os dados que vêm do frontend (baseado nos logs)
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

print("=== TESTE FLUXO COMPLETO ===")
print(f"Dados de teste: {len(trades_data)} trades")

# Criar DataFrame
df = pd.DataFrame(trades_data)
df['entry_date'] = pd.to_datetime(df['entry_date'])
df['exit_date'] = pd.to_datetime(df['exit_date'])
df['pnl'] = pd.to_numeric(df['pnl'], errors='coerce')

print("\nDataFrame criado:")
print(df.head())

# Testar função calcular_performance diretamente
print("\n=== TESTE calcular_performance ===")
performance_result = calcular_performance(df, cdi=0.12)
print("Performance Metrics:")
for key, value in performance_result.items():
    print(f"  {key}: {value}")

# Testar função processar_backtest_completo
print("\n=== TESTE processar_backtest_completo ===")
complete_result = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
performance_metrics = complete_result.get("Performance Metrics", {})

print("Performance Metrics do processar_backtest_completo:")
for key, value in performance_metrics.items():
    print(f"  {key}: {value}")

# Simular o mapeamento que acontece no main.py
print("\n=== SIMULAÇÃO DO MAPEAMENTO (main.py) ===")
metricas_principais = {
    "sharpe_ratio": performance_metrics.get("Sharpe Ratio", 0),
    "fator_recuperacao": performance_metrics.get("Recovery Factor", 0),
    "drawdown_maximo": -performance_metrics.get("Max Drawdown ($)", 0),
    "drawdown_maximo_pct": performance_metrics.get("Max Drawdown (%)", 0),
    "drawdown_medio": performance_metrics.get("Average Drawdown ($)", 0),  # DD Médio
    "dias_operados": performance_metrics.get("Active Days", 0),
    "resultado_liquido": performance_metrics.get("Net Profit", 0),
    "fator_lucro": performance_metrics.get("Profit Factor", 0),
    "win_rate": performance_metrics.get("Win Rate (%)", 0),
    "roi": (performance_metrics.get("Net Profit", 0) / 100000 * 100) if 100000 > 0 else 0,
}

print("Métricas Principais mapeadas:")
for key, value in metricas_principais.items():
    print(f"  {key}: {value}")

print(f"\n🎯 RESULTADO FINAL:")
print(f"  DD Médio: {metricas_principais['drawdown_medio']}")
print(f"  Sharpe Ratio: {metricas_principais['sharpe_ratio']}")
print(f"  Win Rate: {metricas_principais['win_rate']}%")
print(f"  Profit Factor: {metricas_principais['fator_lucro']}") 