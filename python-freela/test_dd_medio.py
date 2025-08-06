import pandas as pd
import numpy as np
from FunCalculos import calcular_performance

# Teste com dados simples
df = pd.DataFrame({
    'pnl': [100, -50, 200, -100, 150, -75, 300, -200, 250, -150]
})

print("=== TESTE DD MÉDIO ===")
print("Dados de teste:")
print(df)

result = calcular_performance(df)
print("\nResultado completo:")
for key, value in result.items():
    print(f"{key}: {value}")

print(f"\nDD Médio específico: {result.get('Average Drawdown ($)', 'NÃO ENCONTRADO')}")

# Teste com dados reais (simulando os trades do log)
trades_data = [
    {'pnl': 0}, {'pnl': -4265}, {'pnl': -5300}, {'pnl': -4385}, {'pnl': -7915},
    {'pnl': -2880}, {'pnl': -2515}, {'pnl': -1820}, {'pnl': -1655}, {'pnl': 80},
    {'pnl': -65}, {'pnl': 80}, {'pnl': -3105}, {'pnl': -500}, {'pnl': 80}
]

df_real = pd.DataFrame(trades_data)
print("\n=== TESTE COM DADOS REAIS ===")
print("Primeiros 15 trades do log:")
print(df_real)

result_real = calcular_performance(df_real)
print(f"\nDD Médio com dados reais: {result_real.get('Average Drawdown ($)', 'NÃO ENCONTRADO')}")
print(f"Sharpe Ratio: {result_real.get('Sharpe Ratio', 'NÃO ENCONTRADO')}") 