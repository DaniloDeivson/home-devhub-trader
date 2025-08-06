import pandas as pd
from FunCalculos import processar_backtest_completo

# Dados de teste simples
test_data = [
    {'entry_date': '2024-01-01T10:00:00', 'exit_date': '2024-01-01T10:30:00', 'pnl': 100},
    {'entry_date': '2024-01-01T11:00:00', 'exit_date': '2024-01-01T11:15:00', 'pnl': -50},
    {'entry_date': '2024-01-01T12:00:00', 'exit_date': '2024-01-01T12:45:00', 'pnl': 200},
    {'entry_date': '2024-01-01T13:00:00', 'exit_date': '2024-01-01T13:20:00', 'pnl': -100},
    {'entry_date': '2024-01-01T14:00:00', 'exit_date': '2024-01-01T14:30:00', 'pnl': 150}
]

print("=== TESTE SIMPLES SHARPE RATIO ===")

# Criar DataFrame
df = pd.DataFrame(test_data)
df['entry_date'] = pd.to_datetime(df['entry_date'])
df['exit_date'] = pd.to_datetime(df['exit_date'])

print("DataFrame criado:")
print(df)
print(f"Colunas: {df.columns.tolist()}")

# Testar processar_backtest_completo
try:
    print("\n=== TESTE processar_backtest_completo ===")
    resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
    
    print("Resultado:")
    print(resultado)
    
    # Verificar Performance Metrics
    performance_metrics = resultado.get("Performance Metrics", {})
    print(f"\n📊 Performance Metrics:")
    print(f"  Sharpe Ratio: {performance_metrics.get('Sharpe Ratio', 'NÃO ENCONTRADO')}")
    print(f"  Net Profit: {performance_metrics.get('Net Profit', 'N/A')}")
    print(f"  Total Trades: {performance_metrics.get('Total Trades', 'N/A')}")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 