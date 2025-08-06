import pandas as pd
import numpy as np
from FunCalculos import processar_backtest_completo
from main import make_json_serializable
import json

# Dados de teste
test_data = [
    {'entry_date': '2024-01-01T10:00:00', 'exit_date': '2024-01-01T10:30:00', 'pnl': 100},
    {'entry_date': '2024-01-01T11:00:00', 'exit_date': '2024-01-01T11:15:00', 'pnl': -50},
    {'entry_date': '2024-01-01T12:00:00', 'exit_date': '2024-01-01T12:45:00', 'pnl': 200},
    {'entry_date': '2024-01-01T13:00:00', 'exit_date': '2024-01-01T13:20:00', 'pnl': -100},
    {'entry_date': '2024-01-01T14:00:00', 'exit_date': '2024-01-01T14:30:00', 'pnl': 150}
]

print("=== TESTE SERIALIZAÇÃO JSON ===")

# Criar DataFrame
df = pd.DataFrame(test_data)
df['entry_date'] = pd.to_datetime(df['entry_date'])
df['exit_date'] = pd.to_datetime(df['exit_date'])

# Processar dados
resultado = processar_backtest_completo(df, capital_inicial=100000, cdi=0.12)

print("Resultado original:")
print(f"Sharpe Ratio: {resultado.get('Performance Metrics', {}).get('Sharpe Ratio', 'NÃO ENCONTRADO')}")

# Testar serialização
try:
    print("\n=== TESTE 1: make_json_serializable ===")
    serialized = make_json_serializable(resultado)
    
    print("Serializado com sucesso!")
    print(f"Sharpe Ratio após serialização: {serialized.get('Performance Metrics', {}).get('Sharpe Ratio', 'NÃO ENCONTRADO')}")
    
    # Testar conversão para JSON
    print("\n=== TESTE 2: Conversão para JSON ===")
    json_str = json.dumps(serialized)
    print("JSON criado com sucesso!")
    
    # Testar parsing de volta
    print("\n=== TESTE 3: Parsing de volta ===")
    parsed = json.loads(json_str)
    print(f"Sharpe Ratio após parsing: {parsed.get('Performance Metrics', {}).get('Sharpe Ratio', 'NÃO ENCONTRADO')}")
    
    print("✅ Todos os testes passaram!")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 