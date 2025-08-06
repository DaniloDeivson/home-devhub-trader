import pandas as pd
import io
from main import carregar_csv_safe, processar_backtest_completo

# Criar dados de teste
test_data = [
    {'entry_date': '2024-01-01T10:00:00', 'exit_date': '2024-01-01T10:30:00', 'pnl': 100},
    {'entry_date': '2024-01-01T11:00:00', 'exit_date': '2024-01-01T11:15:00', 'pnl': -50},
    {'entry_date': '2024-01-01T12:00:00', 'exit_date': '2024-01-01T12:45:00', 'pnl': 200},
    {'entry_date': '2024-01-01T13:00:00', 'exit_date': '2024-01-01T13:20:00', 'pnl': -100},
    {'entry_date': '2024-01-01T14:00:00', 'exit_date': '2024-01-01T14:30:00', 'pnl': 150}
]

print("=== TESTE CARREGAMENTO CSV ===")

# Criar CSV em memória
df = pd.DataFrame(test_data)
csv_buffer = io.StringIO()
df.to_csv(csv_buffer, index=False)
csv_content = csv_buffer.getvalue()

print("CSV criado:")
print(csv_content)

# Testar carregamento
try:
    # Criar um arquivo simulado
    from io import BytesIO
    csv_file = BytesIO(csv_content.encode('utf-8'))
    csv_file.name = 'test.csv'
    
    print("\n=== TESTE 1: carregar_csv_safe ===")
    df_loaded = carregar_csv_safe(csv_file)
    print(f"DataFrame carregado: {len(df_loaded)} linhas")
    print("Colunas:", df_loaded.columns.tolist())
    print("Primeiras linhas:")
    print(df_loaded.head())
    
    print("\n=== TESTE 2: processar_backtest_completo ===")
    resultado = processar_backtest_completo(df_loaded, capital_inicial=100000, cdi=0.12)
    
    print("Resultado completo:")
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