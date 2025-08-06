import pandas as pd
import io
from main import carregar_csv_safe, processar_backtest_completo

# Criar CSV no formato correto (como esperado pela função carregar_csv_safe)
csv_content = """Data;Hora;Ativo;Abertura;Fechamento;Tempo Operação;Qtd Compra;Qtd Venda;Lado;Preço Compra;Preço Venda;Preço de Mercado;Médio;Res. Intervalo;Res. Intervalo (%);Número Operação;Res. Operação;Res. Operação (%);Drawdown;Ganho Max.;Perda Max.;TET;Total
01/01/2024;10:00:00;PETR4;25,50;25,60;00:30:00;100;0;C;25,50;25,60;25,60;25,55;10,00;0,39;1;10,00;0,39;0,00;10,00;0,00;0,00;10,00
01/01/2024;11:00:00;PETR4;25,60;25,55;00:15:00;0;100;V;25,60;25,55;25,55;-5,00;-0,20;2;-5,00;-0,20;0,00;0,00;5,00;0,00;-5,00
01/01/2024;12:00:00;PETR4;25,55;25,75;00:45:00;100;0;C;25,55;25,75;25,75;25,65;20,00;0,78;3;20,00;0,78;0,00;20,00;0,00;0,00;20,00
01/01/2024;13:00:00;PETR4;25,75;25,65;00:20:00;0;100;V;25,75;25,65;25,65;-10,00;-0,39;4;-10,00;-0,39;0,00;0,00;10,00;0,00;-10,00
01/01/2024;14:00:00;PETR4;25,65;25,80;00:30:00;100;0;C;25,65;25,80;25,80;25,72;15,00;0,58;5;15,00;0,58;0,00;15,00;0,00;0,00;15,00"""

print("=== TESTE FORMATO CSV CORRETO ===")

# Criar arquivo simulado
csv_buffer = io.StringIO(csv_content)
csv_buffer.name = 'test.csv'

try:
    print("=== TESTE 1: carregar_csv_safe ===")
    df = carregar_csv_safe(csv_buffer)
    
    print(f"DataFrame carregado: {len(df)} linhas")
    print("Colunas:", df.columns.tolist())
    print("Primeiras linhas:")
    print(df.head())
    
    print("\n=== TESTE 2: processar_backtest_completo ===")
    resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)
    
    # Verificar Performance Metrics
    performance_metrics = resultado.get("Performance Metrics", {})
    print(f"\n📊 Performance Metrics:")
    print(f"  Sharpe Ratio: {performance_metrics.get('Sharpe Ratio', 'NÃO ENCONTRADO')}")
    print(f"  Net Profit: {performance_metrics.get('Net Profit', 'N/A')}")
    print(f"  Total Trades: {performance_metrics.get('Total Trades', 'N/A')}")
    
    if performance_metrics.get('Sharpe Ratio'):
        print("✅ Sharpe Ratio calculado corretamente!")
    else:
        print("❌ Sharpe Ratio não encontrado")
        
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 