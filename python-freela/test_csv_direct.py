import pandas as pd
import io
from main import carregar_csv_safe

print("=== TESTE DIRETO CARREGAR_CSV_SAFE ===")

# Criar CSV simples
csv_content = """entry_date,exit_date,pnl
2024-01-01T10:00:00,2024-01-01T10:30:00,100
2024-01-01T11:00:00,2024-01-01T11:15:00,-50
2024-01-01T12:00:00,2024-01-01T12:45:00,200"""

print("CSV criado:")
print(csv_content)

# Criar arquivo simulado
csv_buffer = io.StringIO(csv_content)
csv_buffer.name = 'test.csv'

try:
    print("\n=== TESTE carregar_csv_safe ===")
    df = carregar_csv_safe(csv_buffer)
    
    print(f"✅ DataFrame carregado: {len(df)} linhas")
    print("Colunas:", df.columns.tolist())
    print("Primeiras linhas:")
    print(df.head())
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc() 